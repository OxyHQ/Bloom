//! Expressions: chains become builders and modifiers, calls to TS functions
//! keep their convention (a trailing options object becomes named arguments,
//! spec 5), and every JS form without a `.bloom` meaning is a refusal.

use oxc_ast::ast::{
    Argument, ArrayExpressionElement, ArrowFunctionExpression, BindingPattern, CallExpression, ChainElement,
    Expression, FormalParameters, ObjectExpression, ObjectPropertyKind, PropertyKey, TemplateLiteral,
};
use oxc_span::{GetSpan, Span};
use oxc_syntax::operator::{BinaryOperator, LogicalOperator, UnaryOperator};

use crate::module::Tr;

/// JS globals: their `.bloom` forms are methods (`a.max(b)`) or do not exist.
const GLOBALS: &[&str] = &[
    "Math",
    "Object",
    "Array",
    "JSON",
    "Number",
    "String",
    "Boolean",
    "Date",
    "Promise",
    "parseInt",
    "parseFloat",
    "isNaN",
    "setTimeout",
    "clearTimeout",
    "setInterval",
    "clearInterval",
    "console",
    "window",
    "document",
    "globalThis",
    "encodeURIComponent",
    "decodeURIComponent",
    "Intl",
    "Symbol",
    "Map",
    "Set",
    "Error",
    "RegExp",
    "structuredClone",
    "requestAnimationFrame",
    "queueMicrotask",
];

/// Array and string methods with a `.bloom` name of their own.
const RENAMED: &[(&str, &str)] = &[
    ("includes", "contains"),
    ("join", "joined"),
    ("trim", "trimmed"),
    ("toLowerCase", "lowercased"),
    ("toUpperCase", "uppercased"),
];

/// Stacks, whose children read best as a builder even when there is one.
const STACKS: &[&str] = &["VStack", "HStack", "ZStack", "ScrollView", "Group", "List", "Section"];

/// A condition as [`Tr::test_parts`] reads it.
pub enum Test {
    Plain(String),
    /// `if let name = name`, and the unwrapped value's own test.
    Bind(String, Option<String>),
}

/// What a call's callee is.
enum Callee {
    Node(String),
    View,
    LocalFn,
    Embed,
    Setter,
    Ts,
}

impl Tr<'_> {
    /// Notes an assisted translation; it is written above the statement holding it.
    pub fn review(&mut self, note: String) {
        if !self.quiet {
            self.reviews.push(note);
        }
    }

    /// The review markers due, as comment lines, for the statement about to be written.
    pub fn take_reviews(&mut self) -> String {
        std::mem::take(&mut self.reviews)
            .into_iter()
            .map(|note| format!("// {}: {note}\n", crate::REVIEW_MARKER))
            .collect()
    }

    /// Comments due before `pos`, at a place a `.bloom` line may start.
    pub fn note(&mut self, pos: u32) -> String {
        if self.quiet { String::new() } else { self.comments.before(pos, false) }
    }

    pub fn expr(&mut self, e: &Expression) -> String {
        match e {
            Expression::BooleanLiteral(b) => b.value.to_string(),
            Expression::NullLiteral(_) => "none".into(),
            Expression::NumericLiteral(n) => number(n.value),
            Expression::StringLiteral(s) => quote(s.value.as_str().unwrap_or_default()),
            Expression::TemplateLiteral(t) => self.template(t),
            Expression::Identifier(id) => self.ident(&id.name, id.span),
            Expression::ParenthesizedExpression(p) => format!("({})", self.expr(&p.expression)),
            Expression::TSAsExpression(a) => {
                // `as const` says nothing at run time; `as T` neither, so it is dropped
                // under review (`bloomc check --tsc` checks the value where it lands).
                let ty = self.slice(a.type_annotation.span());
                if ty != "const" {
                    self.review(format!("`as {ty}` dropped: annotate where the value lands if tsc needs it"));
                }
                self.expr(&a.expression)
            }
            Expression::TSSatisfiesExpression(s) => self.expr(&s.expression),
            Expression::TSNonNullExpression(n) => {
                self.refuse("ts:non-null", "a non-null assertion `!` (use `if let`)", n.span)
            }
            Expression::ArrayExpression(array) => {
                let mut items = Vec::new();
                for element in &array.elements {
                    match element {
                        ArrayExpressionElement::SpreadElement(s) => {
                            items.push(self.refuse("array:spread", "an array spread", s.span))
                        }
                        ArrayExpressionElement::Elision(s) => {
                            items.push(self.refuse("array:hole", "an array hole", s.span))
                        }
                        other => {
                            let value = other.to_expression();
                            items.push(self.expr(value));
                        }
                    }
                }
                format!("[{}]", items.join(", "))
            }
            Expression::ObjectExpression(o) => self.record(o),
            Expression::ArrowFunctionExpression(arrow) => self.closure(arrow),
            Expression::FunctionExpression(f) => self.refuse(
                "function:expression",
                "a `function` expression (an arrow or a member `fn`)",
                f.span,
            ),
            Expression::CallExpression(call) => self.call(call),
            Expression::ChainExpression(chain) => match &chain.expression {
                ChainElement::CallExpression(call) => {
                    if has_optional_call(call) {
                        self.refuse("optional:call", "an optional call `f?.()` in an expression", call.span)
                    } else {
                        self.call(call)
                    }
                }
                ChainElement::StaticMemberExpression(m) => {
                    self.static_member(&m.object, &m.property.name, m.optional, m.span)
                }
                ChainElement::ComputedMemberExpression(m) => {
                    if m.optional {
                        self.refuse("optional:index", "an optional index `a?.[i]`", m.span)
                    } else {
                        let object = self.expr(&m.object);
                        format!("{object}[{}]", self.expr(&m.expression))
                    }
                }
                ChainElement::TSNonNullExpression(n) => {
                    self.refuse("ts:non-null", "a non-null assertion `!`", n.span)
                }
                ChainElement::PrivateFieldExpression(p) => self.refuse("class", "a private field", p.span),
            },
            Expression::StaticMemberExpression(m) => {
                self.static_member(&m.object, &m.property.name, m.optional, m.span)
            }
            Expression::ComputedMemberExpression(m) => {
                if let Expression::StringLiteral(key) = &m.expression
                    && crate::module::is_identifier(key.value.as_str().unwrap_or_default())
                {
                    return self.static_member(
                        &m.object,
                        key.value.as_str().unwrap_or_default(),
                        m.optional,
                        m.span,
                    );
                }
                let object = self.expr(&m.object);
                format!("{object}[{}]", self.expr(&m.expression))
            }
            Expression::ConditionalExpression(c) => {
                let test = self.test(&c.test, false);
                let a = self.expr(&c.consequent);
                let b = self.expr(&c.alternate);
                format!("{test} ? {a} : {b}")
            }
            Expression::LogicalExpression(l) => {
                let op = match l.operator {
                    LogicalOperator::And => "&&",
                    LogicalOperator::Or => "||",
                    LogicalOperator::Coalesce => "??",
                };
                let left = self.expr(&l.left);
                let right = self.expr(&l.right);
                format!("{left} {op} {right}")
            }
            Expression::BinaryExpression(b) => self.binary(b),
            Expression::UnaryExpression(u) => match u.operator {
                UnaryOperator::LogicalNot => format!("!{}", self.expr(&u.argument)),
                UnaryOperator::UnaryNegation => format!("-{}", self.expr(&u.argument)),
                op => self.refuse(
                    &format!("operator:{}", op.as_str()),
                    format!("the `{}` operator", op.as_str()),
                    u.span,
                ),
            },
            Expression::AwaitExpression(a) => format!("await {}", self.expr(&a.argument)),
            Expression::JSXElement(el) => self.component(el),
            Expression::JSXFragment(f) => self.fragment_value(f),
            Expression::AssignmentExpression(a) => {
                self.refuse("assign:expression", "an assignment inside an expression", a.span)
            }
            Expression::UpdateExpression(u) => {
                self.refuse("assign:expression", "`++`/`--` inside an expression", u.span)
            }
            Expression::NewExpression(n) => {
                self.refuse("new", format!("`new {}`", self.slice(n.callee.span())), n.span)
            }
            Expression::SequenceExpression(s) => self.refuse("operator:comma", "a comma expression", s.span),
            Expression::TaggedTemplateExpression(t) => {
                self.refuse("template:tagged", "a tagged template", t.span)
            }
            Expression::RegExpLiteral(r) => self.refuse("regexp", "a regular expression", r.span),
            Expression::ThisExpression(t) => self.refuse("class", "`this`", t.span),
            Expression::ImportExpression(i) => self.refuse("import:dynamic", "a dynamic `import()`", i.span),
            other => {
                self.refuse("expression", format!("`{}`", short(self.slice(other.span()))), other.span())
            }
        }
    }

    fn ident(&mut self, name: &str, span: Span) -> String {
        if let Some(renamed) = self.scope.renames.get(name) {
            return renamed.clone();
        }
        if name == "undefined" {
            return "none".into();
        }
        if let Some(setter) = self.scope.setters.get(name) {
            // A setter handed on as a value: the closure that assigns the state.
            let state = setter.state.clone();
            return format!("{{ next in {state} = next }}");
        }
        if self.scope.props.as_deref() == Some(name) {
            return self.refuse(
                "view:props-object",
                "the props object used whole (spread or passed on)",
                span,
            );
        }
        if GLOBALS.contains(&name) && !self.imported.contains(name) {
            return self.refuse(&format!("global:{name}"), format!("the JS global `{name}`"), span);
        }
        if self.react.contains_key(name) {
            return self.refuse(&format!("react:{}", self.react[name]), format!("React's `{name}`"), span);
        }
        self.name(name, span)
    }

    fn static_member(&mut self, object: &Expression, property: &str, optional: bool, _span: Span) -> String {
        if let Expression::Identifier(id) = object
            && self.scope.props.as_deref() == Some(id.name.as_str())
            && !self.scope.renames.contains_key(id.name.as_str())
        {
            return self.name(property, id.span);
        }
        let dot = if optional || has_optional(object) { "?." } else { "." };
        let object_text = self.expr(object);
        let property = if property == "length" { "count" } else { property };
        format!("{object_text}{dot}{property}")
    }

    fn binary(&mut self, b: &oxc_ast::ast::BinaryExpression) -> String {
        let op = match b.operator {
            BinaryOperator::StrictEquality | BinaryOperator::Equality => "==",
            BinaryOperator::StrictInequality | BinaryOperator::Inequality => "!=",
            BinaryOperator::LessThan => "<",
            BinaryOperator::LessEqualThan => "<=",
            BinaryOperator::GreaterThan => ">",
            BinaryOperator::GreaterEqualThan => ">=",
            BinaryOperator::Addition => "+",
            BinaryOperator::Subtraction => "-",
            BinaryOperator::Multiplication => "*",
            BinaryOperator::Division => "/",
            BinaryOperator::Remainder => "%",
            op => {
                return self.refuse(
                    &format!("operator:{}", op.as_str()),
                    format!("the `{}` operator", op.as_str()),
                    b.span,
                );
            }
        };
        let left = self.operand(&b.left, &b.right);
        let right = self.operand(&b.right, &b.left);
        format!("{left} {op} {right}")
    }

    /// One side of a comparison: a string literal against a local union is its case.
    fn operand(&mut self, side: &Expression, other: &Expression) -> String {
        if let Expression::StringLiteral(s) = side
            && let Some(union) = self.type_of(other)
            && let Some(cases) = self.unions.get(&union)
        {
            let value = s.value.as_str().unwrap_or_default();
            if cases.iter().any(|c| c == value) {
                return format!(".{value}");
            }
        }
        if let Expression::Identifier(id) = side
            && id.name == "undefined"
        {
            return "none".into();
        }
        self.expr(side)
    }

    /// A condition. JS truthiness is spelled out from the declared type: a `String`
    /// is `!s.isEmpty`, a `Float` `n != 0`, an optional value `x != none` (or, with
    /// `binds`, where the branch reads it unwrapped, `if let x = x`).
    pub fn test(&mut self, e: &Expression, binds: bool) -> String {
        match self.test_parts(e, binds) {
            Test::Plain(text) => text,
            Test::Bind(name, None) => format!("let {name} = {name}"),
            Test::Bind(_, Some(_)) => self.test(e, false),
        }
    }

    /// A condition, keeping an optional `String`/`Float` as `if let` plus its own test,
    /// for a builder line to nest (`if let s = s { if !s.isEmpty { … } }`).
    pub fn test_parts(&mut self, e: &Expression, binds: bool) -> Test {
        if let Some((name, ty)) = self.declared(e) {
            let plain = is_plain_name(&name);
            return Test::Plain(match ty.as_str() {
                "Bool" => name,
                "String" => format!("!{name}.isEmpty"),
                "Float" => format!("{name} != 0"),
                "Bool?" => format!("{name} == true"),
                "String?" if binds && plain => {
                    return Test::Bind(name.clone(), Some(format!("!{name}.isEmpty")));
                }
                "Float?" if binds && plain => return Test::Bind(name.clone(), Some(format!("{name} != 0"))),
                "String?" => format!("({name} ?? \"\") != \"\""),
                "Float?" => format!("({name} ?? 0) != 0"),
                t if t.ends_with('?') && binds && plain => return Test::Bind(name, None),
                t if t.ends_with('?') => format!("{name} != none"),
                _ => self.expr(e),
            });
        }
        if let Expression::UnaryExpression(u) = e.without_parentheses()
            && u.operator == UnaryOperator::LogicalNot
            && self.declared(&u.argument).is_some()
        {
            return Test::Plain(self.test_negated(&u.argument));
        }
        Test::Plain(self.expr(e))
    }

    /// `!(test)`, with truthiness spelled out as in [`Tr::test`].
    pub fn test_negated(&mut self, e: &Expression) -> String {
        if let Some((name, ty)) = self.declared(e) {
            return match ty.as_str() {
                "Bool" => format!("!{name}"),
                "String" => format!("{name}.isEmpty"),
                "Float" => format!("{name} == 0"),
                "Bool?" => format!("{name} != true"),
                "String?" => format!("({name} ?? \"\") == \"\""),
                "Float?" => format!("({name} ?? 0) == 0"),
                t if t.ends_with('?') => format!("{name} == none"),
                _ => format!("!({})", self.expr(e)),
            };
        }
        if let Expression::UnaryExpression(u) = e.without_parentheses()
            && u.operator == UnaryOperator::LogicalNot
        {
            return self.test(&u.argument, false);
        }
        let text = self.expr(e);
        crate::view::negate(e, &text)
    }

    /// A name or a prop with its declared Bloom type, as the output writes the name.
    fn declared(&mut self, e: &Expression) -> Option<(String, String)> {
        let name = match e.without_parentheses() {
            Expression::Identifier(id) => {
                self.scope.renames.get(id.name.as_str()).cloned().unwrap_or(id.name.to_string())
            }
            Expression::StaticMemberExpression(m) => match &m.object {
                Expression::Identifier(id) if self.scope.props.as_deref() == Some(id.name.as_str()) => {
                    m.property.name.to_string()
                }
                _ => return None,
            },
            _ => return None,
        };
        let ty = self.scope.decl.get(&name)?.clone();
        self.used.insert(name.clone());
        Some((name, ty))
    }

    /// The declared type name of a name or a prop, when known.
    pub fn type_of(&self, e: &Expression) -> Option<String> {
        match e.without_parentheses() {
            Expression::Identifier(id) => self.scope.types.get(id.name.as_str()).cloned(),
            Expression::StaticMemberExpression(m) => match &m.object {
                Expression::Identifier(id) if self.scope.props.as_deref() == Some(id.name.as_str()) => {
                    self.scope.types.get(m.property.name.as_str()).cloned()
                }
                _ => None,
            },
            _ => None,
        }
    }

    fn template(&mut self, t: &TemplateLiteral) -> String {
        let mut out = String::from("\"");
        for (i, quasi) in t.quasis.iter().enumerate() {
            let text = quasi.value.cooked.as_ref().map(|c| c.as_str().unwrap_or_default().to_string());
            match text {
                Some(text) => out.push_str(&escape(&text)),
                None => return self.refuse("template:raw", "a template with an invalid escape", quasi.span),
            }
            if let Some(e) = t.expressions.get(i) {
                out.push_str("${");
                out.push_str(&self.expr(e));
                out.push('}');
            }
        }
        out.push('"');
        out
    }

    // ---- calls -----------------------------------------------------------------

    fn callee(&self, call: &CallExpression) -> Callee {
        let Expression::Identifier(id) = &call.callee else { return Callee::Ts };
        let name = id.name.as_str();
        if self.scope.setters.contains_key(name) {
            return Callee::Setter;
        }
        if self.is_lang(name, "Embed") {
            return Callee::Embed;
        }
        if let Some(ctor) = self.node_ctor(name) {
            return Callee::Node(ctor.to_string());
        }
        if self.views.contains(name) {
            return Callee::View;
        }
        if self.fns.contains(name) || self.scope.member_fns.contains(name) {
            return Callee::LocalFn;
        }
        Callee::Ts
    }

    pub fn call(&mut self, call: &CallExpression) -> String {
        if let Expression::Identifier(id) = &call.callee {
            let name = id.name.as_str();
            if name == "String"
                && !self.imported.contains(name)
                && let [arg] = call.arguments.as_slice()
                && let Some(value) = arg.as_expression()
            {
                // `String(x)` is the template `${x}`: both convert with ToString.
                return format!("\"${{{}}}\"", self.expr(value));
            }
            if self.is_lang(name, "toElement") {
                // The boundary disappears: a view is a value where TS takes an element.
                // `toElement(x, key)` is `x.id(key)`.
                return match call.arguments.as_slice() {
                    [arg] if arg.as_expression().is_some() => self.expr(arg.to_expression()),
                    [arg, key] if arg.as_expression().is_some() && key.as_expression().is_some() => {
                        let value = self.expr(arg.to_expression());
                        let key = self.expr(key.to_expression());
                        format!("{value}.id({key})")
                    }
                    _ => self.refuse("embed:to-element", "`toElement` with a spread argument", call.span),
                };
            }
            if self.is_lang(name, "view") || self.is_lang(name, "defineModifier") {
                return self.refuse("view:nested", format!("`{name}(…)` inside an expression"), call.span);
            }
            if let Some(export) = self.react.get(name) {
                let export = export.clone();
                return self.refuse(&format!("react:{export}"), format!("React's `{name}` here"), call.span);
            }
        }
        if let Expression::StaticMemberExpression(member) = &call.callee
            && self.is_view(&member.object)
        {
            return self.modifier(call, &member.object, &member.property.name, member.property.span);
        }
        match self.callee(call) {
            Callee::Embed => self.embed(call),
            Callee::Node(ctor) => self.node_call(&ctor, call),
            Callee::Setter => self.refuse(
                "state:setter-expression",
                "a state setter called inside an expression",
                call.span,
            ),
            Callee::View => {
                let callee = self.expr(&call.callee);
                match call.arguments.as_slice() {
                    [] => format!("{callee}()"),
                    [Argument::ObjectExpression(o)] => format!("{callee}({})", self.named_args(o)),
                    _ => self.refuse(
                        "view:props-object",
                        "a view called with a computed props object",
                        call.span,
                    ),
                }
            }
            Callee::LocalFn => {
                let callee = self.expr(&call.callee);
                let args = self.positional(&call.arguments, true);
                format!("{callee}({args})")
            }
            Callee::Ts => self.ts_call(call),
        }
    }

    /// A call by TypeScript's convention: a trailing object literal is named arguments.
    fn ts_call(&mut self, call: &CallExpression) -> String {
        let callee = match &call.callee {
            Expression::StaticMemberExpression(m) => {
                let method = m.property.name.as_str();
                let renamed = RENAMED.iter().find(|(from, _)| *from == method).map_or(method, |(_, to)| to);
                let dot = if m.optional || has_optional(&m.object) { "?." } else { "." };
                let object = self.expr(&m.object);
                format!("{object}{dot}{renamed}")
            }
            other => self.expr(other),
        };
        if let Some(args) = &call.type_arguments {
            // Type arguments steer TS inference only: dropped under review.
            let args = self.slice(args.span);
            self.review(format!(
                "type arguments `{args}` dropped from `{callee}(…)`: annotate the binding if tsc needs them"
            ));
        }
        // A trailing object with a spread or a computed key stays one record.
        let (last_object, rest) = match call.arguments.split_last() {
            Some((Argument::ObjectExpression(o), rest)) if named_args_fit(o) => (Some(o), rest),
            _ => (None, call.arguments.as_slice()),
        };
        let mut args = self.positional(rest, false);
        if let Some(object) = last_object {
            let named = self.named_args(object);
            if !named.is_empty() {
                if !args.is_empty() {
                    args.push_str(", ");
                }
                args.push_str(&named);
            }
        }
        // One closure argument reads as a trailing closure (`xs.map { x in … }`).
        if let [Argument::ArrowFunctionExpression(arrow)] = call.arguments.as_slice() {
            return format!("{callee} {}", self.closure(arrow));
        }
        format!("{callee}({args})")
    }

    pub fn positional(&mut self, args: &[Argument], _local: bool) -> String {
        let mut out = Vec::new();
        for arg in args {
            let note = self.note(arg.span().start);
            let value = match arg {
                Argument::SpreadElement(s) => self.refuse("call:spread", "a spread argument", s.span),
                other => self.expr(other.to_expression()),
            };
            out.push(format!("{note}{value}"));
        }
        out.join(", ")
    }

    /// `{ a: 1, b, 'x-y': 2, ...rest }` as the record `{ a: 1, b: b, "x-y": 2, ..rest }`.
    pub fn record(&mut self, object: &ObjectExpression) -> String {
        let mut out = Vec::new();
        for property in &object.properties {
            let note = self.note(property.span().start);
            match property {
                ObjectPropertyKind::SpreadProperty(s) => {
                    out.push(format!("{note}..{}", self.expr(&s.argument)))
                }
                ObjectPropertyKind::ObjectProperty(p) => {
                    if p.method || p.kind != oxc_ast::ast::PropertyKind::Init {
                        out.push(self.refuse(
                            "object:method",
                            "a method or accessor in an object literal",
                            p.span,
                        ));
                        continue;
                    }
                    let key = match &p.key {
                        PropertyKey::StaticIdentifier(id) => id.name.to_string(),
                        PropertyKey::StringLiteral(s) => {
                            let key = s.value.as_str().unwrap_or_default();
                            if crate::module::is_identifier(key) { key.to_string() } else { quote(key) }
                        }
                        PropertyKey::NumericLiteral(n) => quote(&n.value.to_string()),
                        _ => {
                            out.push(self.refuse(
                                "object:computed-key",
                                "a computed key in a record",
                                p.span,
                            ));
                            continue;
                        }
                    };
                    let value = self.expr(&p.value);
                    out.push(format!("{note}{key}: {value}"));
                }
            }
        }
        if out.is_empty() { "{}".to_string() } else { format!("{{ {} }}", out.join(", ")) }
    }

    /// `{ a: 1, b }` as `a: 1, b: b`.
    pub fn named_args(&mut self, object: &ObjectExpression) -> String {
        let mut out = Vec::new();
        for property in &object.properties {
            let note = self.note(property.span().start);
            match property {
                ObjectPropertyKind::SpreadProperty(s) => {
                    out.push(self.refuse("object:spread", "an object spread in named arguments", s.span))
                }
                ObjectPropertyKind::ObjectProperty(p) => {
                    let key = match &p.key {
                        PropertyKey::StaticIdentifier(id) => id.name.to_string(),
                        PropertyKey::StringLiteral(s)
                            if crate::module::is_identifier(s.value.as_str().unwrap_or_default()) =>
                        {
                            s.value.as_str().unwrap_or_default().to_string()
                        }
                        _ => {
                            out.push(self.refuse(
                                "object:computed-key",
                                "a computed key in named arguments",
                                p.span,
                            ));
                            continue;
                        }
                    };
                    if p.method || p.kind != oxc_ast::ast::PropertyKind::Init {
                        out.push(self.refuse(
                            "object:method",
                            "a method or accessor in an object literal",
                            p.span,
                        ));
                        continue;
                    }
                    let value = self.expr(&p.value);
                    out.push(format!("{note}{key}: {value}"));
                }
            }
        }
        out.join(", ")
    }

    /// A modifier on a chain.
    fn modifier(&mut self, call: &CallExpression, object: &Expression, name: &str, at: Span) -> String {
        let receiver = self.expr(object);
        let note = self.note(at.start);
        let sep = if note.is_empty() { String::new() } else { format!("\n{note}") };
        if name == "modifier"
            && let [Argument::Identifier(id)] = call.arguments.as_slice()
            && let Some(chain) = self.modifiers.get(id.name.as_str())
        {
            return format!("{receiver}{sep}{chain}");
        }
        let args = match call.arguments.as_slice() {
            [Argument::ObjectExpression(o)] if named_args_fit(o) && keyed_modifier(name) => {
                format!("({})", self.named_args(o))
            }
            [Argument::ArrowFunctionExpression(arrow)] => format!(" {}", self.closure(arrow)),
            args => {
                let mut out = Vec::new();
                for arg in args {
                    let value = match arg {
                        Argument::SpreadElement(s) => self.refuse("call:spread", "a spread argument", s.span),
                        other => self.expr(other.to_expression()),
                    };
                    out.push(value);
                }
                format!("({})", out.join(", "))
            }
        };
        format!("{receiver}{sep}.{name}{args}")
    }

    fn node_call(&mut self, ctor: &str, call: &CallExpression) -> String {
        let args: Vec<&Argument> = call.arguments.iter().collect();
        // The children: the longest run of view-shaped arguments at the end.
        let mut split = args.len();
        while split > 0 && self.is_child(args[split - 1]) {
            split -= 1;
        }
        let children = &args[split..];
        let conditional = children.iter().any(|a| a.as_expression().is_some_and(|e| is_conditional_child(e)));
        let builder = !children.is_empty() && (children.len() >= 2 || conditional || STACKS.contains(&ctor));
        let leading = if builder { &args[..split] } else { &args[..] };
        let mut values = Vec::new();
        for arg in leading {
            let note = self.note(arg.span().start);
            let value = match arg {
                Argument::SpreadElement(s) => self.spread_child(&s.argument),
                Argument::ArrayExpression(array) if array.elements.len() == 2 => self.binding(array),
                other => self.expr(other.to_expression()),
            };
            values.push(format!("{note}{value}"));
        }
        let callee = self.name(ctor, call.callee.span());
        let head =
            if !builder || !values.is_empty() { format!("{callee}({})", values.join(", ")) } else { callee };
        if !builder {
            return head;
        }
        let mut lines = Vec::new();
        for arg in children {
            let note = self.note(arg.span().start);
            let line = match arg {
                Argument::SpreadElement(s) => self.spread_child(&s.argument),
                other => self.child(other.to_expression()),
            };
            lines.push(format!("{note}{line}"));
        }
        format!("{head} {{\n{}\n}}", lines.join("\n"))
    }

    /// `...xs` among children: the list as one `[View]` child, under review: the
    /// runtime draws a list as one keyed slot (a `Presence`), one fiber more than
    /// the spread siblings it replaces.
    fn spread_child(&mut self, list: &Expression) -> String {
        self.review("spread children are one `[View]` child: one keyed slot (+1 fiber), not siblings".into());
        match list.without_parentheses() {
            Expression::CallExpression(call) if is_map(call) => self.child(list),
            other => self.expr(other),
        }
    }

    /// `[value, setter]`: `$state` when it is a state's own pair, else `Binding(get:set:)`.
    fn binding(&mut self, array: &oxc_ast::ast::ArrayExpression) -> String {
        let (Some(get), Some(set)) = (array.elements[0].as_expression(), array.elements[1].as_expression())
        else {
            return self.refuse("binding", "a binding pair with a spread or a hole", array.span);
        };
        if let (Expression::Identifier(value), Expression::Identifier(setter)) = (get, set)
            && self.scope.setters.get(setter.name.as_str()).is_some_and(|s| s.state == value.name.as_str())
        {
            return format!("${}", value.name);
        }
        if !matches!(set, Expression::ArrowFunctionExpression(_) | Expression::Identifier(_)) {
            return self.refuse("binding", "a binding pair whose setter is not a function", array.span);
        }
        let get = self.expr(get);
        let set = self.expr(set);
        format!("Binding(get: {get}, set: {set})")
    }

    /// A builder line: a conditional child is an `if`, a mapped list a `for`.
    pub fn child(&mut self, e: &Expression) -> String {
        match e {
            Expression::ParenthesizedExpression(p) => self.child(&p.expression),
            Expression::ConditionalExpression(c) if is_nothing(&c.alternate) => {
                let then = |tr: &mut Self| tr.child(&c.consequent);
                self.child_if(&c.test, then, None::<fn(&mut Self) -> String>)
            }
            Expression::ConditionalExpression(c) if is_nothing(&c.consequent) => {
                let test = self.test_negated(&c.test);
                let otherwise = self.child(&c.alternate);
                format!("if {test} {{\n{otherwise}\n}}")
            }
            Expression::ConditionalExpression(c)
                if self.is_view(&c.consequent) || self.is_view(&c.alternate) =>
            {
                let then = |tr: &mut Self| tr.child(&c.consequent);
                let otherwise = |tr: &mut Self| tr.child(&c.alternate);
                self.child_if(&c.test, then, Some(otherwise))
            }
            Expression::LogicalExpression(l)
                if l.operator == LogicalOperator::And && self.is_view(&l.right) =>
            {
                let then = |tr: &mut Self| tr.child(&l.right);
                self.child_if(&l.left, then, None::<fn(&mut Self) -> String>)
            }
            Expression::CallExpression(call) if is_map(call) => {
                let Some(Argument::ArrowFunctionExpression(arrow)) = call.arguments.first() else {
                    unreachable!()
                };
                let Expression::StaticMemberExpression(member) = &call.callee else { unreachable!() };
                match (arrow.params.items.as_slice(), arrow.params.rest.is_none()) {
                    ([param], true) if matches!(param.pattern, BindingPattern::BindingIdentifier(_)) => {
                        let BindingPattern::BindingIdentifier(id) = &param.pattern else { unreachable!() };
                        let list = self.expr(&member.object);
                        let item = self.bind(&id.name, id.span);
                        let body = self.arrow_view_lines(arrow);
                        format!("for {item} in {list} {{\n{body}\n}}")
                    }
                    _ => self.expr(e),
                }
            }
            Expression::NullLiteral(n) => {
                self.refuse("children:null", "a `null` child (an empty slot)", n.span)
            }
            Expression::JSXFragment(f) => self.fragment_value(f),
            // An optional view (`children?: ReactNode`) is drawn when it is there.
            Expression::Identifier(id)
                if self.scope.decl.get(id.name.as_str()).is_some_and(|t| t == "View?") =>
            {
                let name = self.expr(e);
                format!("if let {name} = {name} {{\n{name}\n}}")
            }
            Expression::CallExpression(call)
                if matches!(&call.callee, Expression::Identifier(id) if self.is_lang(&id.name, "toElement"))
                    && call.arguments.len() == 1
                    && call.arguments[0].as_expression().is_some()
                    && !is_conditional_child(call.arguments[0].to_expression()) =>
            {
                self.child(call.arguments[0].to_expression())
            }
            _ => self.expr(e),
        }
    }

    /// A conditional builder line. An optional `String` read in the branch is
    /// unwrapped and tested: `if let s = s { if !s.isEmpty { A } else { B } } else { B }`.
    fn child_if(
        &mut self,
        test: &Expression,
        then: impl Fn(&mut Self) -> String,
        otherwise: Option<impl Fn(&mut Self) -> String>,
    ) -> String {
        let parts = self.test_parts(test, true);
        let then = then(self);
        let otherwise = otherwise.map(|o| o(self));
        let tail = |b: &Option<String>| match b {
            Some(b) if b.starts_with("if ") => format!(" else {b}"),
            Some(b) => format!(" else {{\n{b}\n}}"),
            None => String::new(),
        };
        match parts {
            Test::Plain(test) => format!("if {test} {{\n{then}\n}}{}", tail(&otherwise)),
            Test::Bind(name, None) => format!("if let {name} = {name} {{\n{then}\n}}{}", tail(&otherwise)),
            Test::Bind(name, Some(inner)) => {
                let t = tail(&otherwise);
                format!("if let {name} = {name} {{\nif {inner} {{\n{then}\n}}{t}\n}}{t}")
            }
        }
    }

    /// Whether an argument is a child: a view, a conditional or mapped view, a spread.
    fn is_child(&self, arg: &Argument) -> bool {
        match arg {
            Argument::SpreadElement(_) => true,
            other => other.as_expression().is_some_and(|e| self.is_view(e)),
        }
    }

    /// Whether an expression is UI: a chain from a node, a view call, a conditional of them.
    pub fn is_view(&self, e: &Expression) -> bool {
        match e.without_parentheses() {
            Expression::JSXElement(_) | Expression::JSXFragment(_) => true,
            Expression::CallExpression(call) if matches!(&call.callee, Expression::Identifier(id) if self.is_lang(&id.name, "toElement")) => {
                true
            }
            Expression::CallExpression(call) => {
                if is_map(call) {
                    let Some(Argument::ArrowFunctionExpression(arrow)) = call.arguments.first() else {
                        return false;
                    };
                    return self.arrow_builds_ui(arrow);
                }
                match &call.callee {
                    Expression::Identifier(id) => {
                        let name = id.name.as_str();
                        self.node_ctor(name).is_some()
                            || self.is_lang(name, "Embed")
                            || self.views.contains(name)
                            || self.view_fns.contains(name)
                    }
                    Expression::StaticMemberExpression(m) => self.is_view(&m.object),
                    _ => false,
                }
            }
            Expression::Identifier(id) => {
                self.scope.view_values.contains(id.name.as_str())
                    || (self.view_fns.contains(id.name.as_str()) && !self.fns.contains(id.name.as_str()))
            }
            Expression::ConditionalExpression(c) => {
                (self.is_view(&c.consequent) || is_nothing(&c.consequent))
                    && (self.is_view(&c.alternate) || is_nothing(&c.alternate))
                    && !(is_nothing(&c.consequent) && is_nothing(&c.alternate))
            }
            Expression::LogicalExpression(l) => l.operator == LogicalOperator::And && self.is_view(&l.right),
            _ => false,
        }
    }

    pub fn arrow_builds_ui(&self, arrow: &ArrowFunctionExpression) -> bool {
        match arrow.get_expression() {
            Some(e) => self.is_view(e),
            None => returns_view(crate::view::arrow_statements(arrow), self),
        }
    }

    pub fn function_builds_ui(&self, f: &oxc_ast::ast::Function) -> bool {
        f.body.as_ref().is_some_and(|b| returns_view(&b.statements, self))
    }

    // ---- closures --------------------------------------------------------------

    pub fn closure(&mut self, arrow: &ArrowFunctionExpression) -> String {
        let saved = self.scope.clone();
        let (params, prelude) = self.closure_params(&arrow.params);
        let body = match arrow.get_expression() {
            Some(e) => self.stmt_expr(e),
            None => {
                self.block_stmts(crate::view::arrow_statements(arrow), crate::view::arrow_end(arrow), false)
            }
        };
        self.scope = saved;
        let body = if prelude.is_empty() { body } else { format!("{}\n{body}", prelude.join("\n")) };
        match params {
            params if !params.is_empty() => format!("{{ {params} in\n{body}\n}}"),
            _ if body.trim().is_empty() => "{}".to_string(),
            _ => format!("{{\n{body}\n}}"),
        }
    }

    /// A closure's parameters, and the `let`s that destructure a destructured one
    /// (`({ item }) => …` is `{ arg in let { item } = arg; … }`).
    fn closure_params(&mut self, params: &FormalParameters) -> (String, Vec<String>) {
        let mut out = Vec::new();
        let mut prelude = Vec::new();
        let several = params.items.len() > 1;
        for (index, param) in params.items.iter().enumerate() {
            let ty = param.type_annotation.as_ref().map(|t| format!(": {}", self.ty(&t.type_annotation)));
            let name = match &param.pattern {
                BindingPattern::BindingIdentifier(id) => {
                    self.scope.renames.remove(id.name.as_str());
                    self.bind(&id.name, id.span)
                }
                BindingPattern::ObjectPattern(pattern) => {
                    let name = if several { format!("arg{index}") } else { "arg".to_string() };
                    let pattern = self.record_pattern(pattern);
                    prelude.push(format!("let {pattern} = {name}"));
                    name
                }
                other => {
                    out.push(self.refuse(
                        "param:destructure",
                        "a closure parameter with a default or an array pattern",
                        other.span(),
                    ));
                    continue;
                }
            };
            out.push(format!("{name}{}", ty.unwrap_or_default()));
        }
        if let Some(rest) = &params.rest {
            out.push(self.refuse("param:rest", "a rest parameter", rest.span));
        }
        (out.join(", "), prelude)
    }
}

/// Whether a list of statements returns UI from every `return` with a value.
fn returns_view(statements: &[oxc_ast::ast::Statement], tr: &Tr) -> bool {
    use oxc_ast::ast::Statement;
    let mut any = false;
    for statement in statements {
        match statement {
            Statement::ReturnStatement(r) => match &r.argument {
                Some(value) if is_nothing(value) => {}
                Some(value) => {
                    if !tr.is_view(value) {
                        return false;
                    }
                    any = true;
                }
                None => {}
            },
            Statement::IfStatement(i) => {
                let mut branches = vec![&i.consequent];
                if let Some(alternate) = &i.alternate {
                    branches.push(alternate);
                }
                for branch in branches {
                    let inner: &[Statement] = match branch {
                        Statement::BlockStatement(b) => &b.body,
                        other => std::slice::from_ref(other),
                    };
                    if inner.iter().any(|s| matches!(s, Statement::ReturnStatement(_))) || !inner.is_empty() {
                        let sub = returns_view(inner, tr);
                        let has_value = inner.iter().any(|s| {
                            matches!(s, Statement::ReturnStatement(r) if r.argument.as_ref().is_some_and(|v| !is_nothing(v)))
                        });
                        if has_value && !sub {
                            return false;
                        }
                        any |= sub;
                    }
                }
            }
            _ => {}
        }
    }
    any
}

fn is_plain_name(text: &str) -> bool {
    crate::module::is_identifier(text)
}

/// Whether a modifier's one object is its keyed arguments (`.frame(width: …)`): the
/// spec types its parameter as a keyed object kind on every node. Any other object
/// (`.refreshable({ refreshing, onRefresh })`) is a record.
fn keyed_modifier(name: &str) -> bool {
    use bloom_language_compiler::spec;
    let Some((_, kinds)) = spec::MODIFIERS.iter().find(|(m, _)| *m == name) else { return false };
    let [kind] = kinds else { return false };
    spec::OBJECTS.iter().any(|(k, ..)| k == kind)
        && !spec::NODES.iter().any(|n| n.params.iter().any(|(m, _)| *m == name))
}

/// Whether an object literal reads as named arguments: plain keys, no spread.
fn named_args_fit(object: &ObjectExpression) -> bool {
    object.properties.iter().all(|p| match p {
        ObjectPropertyKind::SpreadProperty(_) => false,
        ObjectPropertyKind::ObjectProperty(p) => match &p.key {
            PropertyKey::StaticIdentifier(_) => true,
            PropertyKey::StringLiteral(s) => {
                crate::module::is_identifier(s.value.as_str().unwrap_or_default())
            }
            _ => false,
        },
    })
}

pub fn is_nothing(e: &Expression) -> bool {
    match e.without_parentheses() {
        Expression::NullLiteral(_) => true,
        Expression::Identifier(id) => id.name == "undefined",
        _ => false,
    }
}

fn is_conditional_child(e: &Expression) -> bool {
    match e.without_parentheses() {
        Expression::ConditionalExpression(_) | Expression::LogicalExpression(_) => true,
        Expression::CallExpression(call) => is_map(call),
        _ => false,
    }
}

fn is_map(call: &CallExpression) -> bool {
    matches!(&call.callee, Expression::StaticMemberExpression(m) if m.property.name == "map")
        && matches!(call.arguments.as_slice(), [Argument::ArrowFunctionExpression(_)])
}

/// Whether the object path of a member or call has an optional link (`a?.b`).
pub fn has_optional(e: &Expression) -> bool {
    match e {
        Expression::StaticMemberExpression(m) => m.optional || has_optional(&m.object),
        Expression::ComputedMemberExpression(m) => m.optional || has_optional(&m.object),
        Expression::CallExpression(c) => c.optional || has_optional(&c.callee),
        _ => false,
    }
}

fn has_optional_call(call: &CallExpression) -> bool {
    call.optional
        || match &call.callee {
            Expression::StaticMemberExpression(m) => has_optional(&m.object) || m.optional,
            other => has_optional(other),
        }
}

pub fn number(value: f64) -> String {
    if value.fract() == 0.0 && value.abs() < 1e15 { format!("{}", value as i64) } else { format!("{value}") }
}

pub fn escape(text: &str) -> String {
    let mut out = String::new();
    for c in text.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\t' => out.push_str("\\t"),
            '$' => out.push_str("\\$"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{{{:x}}}", c as u32)),
            c => out.push(c),
        }
    }
    out
}

pub fn quote(text: &str) -> String {
    format!("\"{}\"", escape(text))
}

fn short(text: &str) -> String {
    let line = text.lines().next().unwrap_or_default();
    if line.len() > 40 { format!("{}…", &line[..line.floor_char_boundary(40)]) } else { line.to_string() }
}
