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
    "Infinity",
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
    "__DEV__",
    "require",
    "fetch",
    "navigator",
    "location",
    "alert",
    "localStorage",
    "performance",
    "atob",
    "btoa",
    "AbortController",
    "URL",
    "URLSearchParams",
    "Blob",
    "FormData",
    "Headers",
    "TextEncoder",
    "TextDecoder",
    "WeakMap",
    "WeakSet",
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
            // A note quoting multi-line source stays one comment line.
            self.reviews.push(note.split_whitespace().collect::<Vec<_>>().join(" "));
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
            Expression::ParenthesizedExpression(p) => {
                let inner = self.expr(&p.expression);
                // `(['a', 'b'] as const)` became a constant's name: no parentheses around a name.
                if !inner.is_empty() && inner.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
                    inner
                } else {
                    format!("({inner})")
                }
            }
            Expression::TSAsExpression(a) => {
                // `as const` says nothing at run time; `as T` neither, so it is dropped
                // under review (`bloomc check --tsc` checks the value where it lands).
                let ty = self.slice(a.type_annotation.span()).to_string();
                if ty != "const" {
                    self.review(format!("`as {ty}` dropped: annotate where the value lands if tsc needs it"));
                }
                // `[['owned', a], ['joined', b]] as const`: a list of pairs, each a tuple (TS's
                // readonly tuples), as a `Map`'s entries are.
                let pairs = ty == "const"
                    && matches!(a.expression.without_parentheses(), Expression::ArrayExpression(list)
                        if !list.elements.is_empty() && list.elements.iter().all(|e| matches!(e,
                            oxc_ast::ast::ArrayExpressionElement::ArrayExpression(p) if p.elements.len() == 2)));
                let text = if pairs {
                    let outer = std::mem::replace(&mut self.pairs, true);
                    let text = self.entries(&a.expression);
                    self.pairs = outer;
                    text
                } else {
                    self.expr(&a.expression)
                };
                // `(['a', 'b'] as const)` inside a function: a module constant, which keeps the
                // literals' union (a local list of strings is `[String]`).
                if ty == "const"
                    && self.module_init != Some(a.span)
                    && let Expression::ArrayExpression(list) = a.expression.without_parentheses()
                    && !list.elements.is_empty()
                    && let Some(values) = list
                        .elements
                        .iter()
                        .map(|e| match e {
                            oxc_ast::ast::ArrayExpressionElement::StringLiteral(s) => {
                                s.value.as_str().map(str::to_string)
                            }
                            _ => None,
                        })
                        .collect::<Option<Vec<_>>>()
                {
                    return self.hoist_const_list(&values, text);
                }
                // `as T` of a named type: kept for bloomc's answer (`crate::typed::casts`).
                if let oxc_ast::ast::TSType::TSTypeReference(r) = &a.type_annotation
                    && r.type_arguments.is_none()
                    && let oxc_ast::ast::TSTypeName::IdentifierReference(id) = &r.type_name
                {
                    let name = self.name(&id.name, id.span);
                    self.casts.insert(crate::truthiness::squeeze(&text), name);
                }
                // `as X['k']`: a TS type Bloom does not name. Where bloomc expects a literal union,
                // the cast is to that union, written out (`crate::typed::casts`).
                if let oxc_ast::ast::TSType::TSIndexedAccessType(_) = &a.type_annotation {
                    self.casts.insert(crate::truthiness::squeeze(&text), String::new());
                }
                text
            }
            Expression::TSSatisfiesExpression(s) => self.expr(&s.expression),
            // `x!`: Swift's force unwrap (a dev build traps on `none`, a release one is TS's `x!`).
            Expression::TSNonNullExpression(n) => self.forced(&n.expression),
            Expression::ArrayExpression(array) => {
                let pairs = std::mem::replace(&mut self.pairs, false);
                let mut items = Vec::new();
                for element in &array.elements {
                    match element {
                        ArrayExpressionElement::SpreadElement(s) => {
                            items.push(format!("..{}", self.expr(&s.argument)))
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
                // A `Map`'s entries: a `[k, v]` pair is a tuple.
                self.pairs = pairs;
                if pairs && items.len() == 2 && array.elements.iter().all(|e| !e.is_spread()) {
                    return format!("({})", items.join(", "));
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
                ChainElement::CallExpression(call) => self.optional_call_expr(call),
                ChainElement::StaticMemberExpression(m) => {
                    self.static_member(&m.object, &m.property.name, m.optional, m.span)
                }
                ChainElement::ComputedMemberExpression(m) => {
                    // `a?.[i]` is `a?[i]`.
                    if m.optional {
                        let object = self.expr(&m.object);
                        format!("{object}?[{}]", self.expr(&m.expression))
                    } else {
                        let object = self.expr(&m.object);
                        format!("{object}[{}]", self.expr(&m.expression))
                    }
                }
                ChainElement::TSNonNullExpression(n) => self.forced(&n.expression),
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
                // `e instanceof Error ? e.message : fallback`: a thrown JS `Error` is the stdlib's
                // `JSError`, so `(e as? JSError)?.message ?? fallback`.
                if let Expression::BinaryExpression(b) = c.test.without_parentheses()
                    && b.operator == BinaryOperator::Instanceof
                    && let Expression::Identifier(class) = b.right.without_parentheses()
                    && class.name == "Error"
                    && let Expression::Identifier(value) = b.left.without_parentheses()
                    && let Expression::StaticMemberExpression(m) = c.consequent.without_parentheses()
                    && matches!(m.property.name.as_str(), "message" | "name")
                    && let Expression::Identifier(read) = m.object.without_parentheses()
                    && read.name == value.name
                {
                    let error = self.name(&value.name, value.span);
                    let fallback = self.expr(&c.alternate);
                    return format!("({error} as? JSError)?.{} ?? {fallback}", m.property.name);
                }
                let test = self.test(&c.test, false);
                let a = self.expr(&c.consequent);
                // A conditional in the first branch keeps its parentheses (`a ? (b ? c : d) : e`).
                let a = if matches!(c.consequent.without_parentheses(), Expression::ConditionalExpression(_))
                {
                    format!("({a})")
                } else {
                    a
                };
                // `hasName ? name : …` with `const hasName = !!name?.trim()`: TS narrows `name`
                // by the aliased test, so it is `name!` (a release build emits TS's `name`).
                let a = if let (Expression::Identifier(t), Expression::Identifier(y)) =
                    (c.test.without_parentheses(), c.consequent.without_parentheses())
                    && self.alias_proves(&t.name, &y.name)
                    && self.declared_type(&c.consequent).is_some_and(|ty| ty.ends_with('?'))
                {
                    format!("{a}!")
                } else {
                    a
                };
                let b = self.expr(&c.alternate);
                format!("{test} ? {a} : {b}")
            }
            Expression::LogicalExpression(l) => {
                let op = match l.operator {
                    LogicalOperator::And => "&&",
                    LogicalOperator::Or => "||",
                    LogicalOperator::Coalesce => "??",
                };
                // `name && "@${name}"` as a value: JS gives the string when `name` is truthy and
                // `name` itself (`""` or `undefined`) when it is not. `left` is read twice, so only
                // a name or a member chain.
                if l.operator == LogicalOperator::And
                    && !self.head
                    && matches!(
                        l.right.without_parentheses(),
                        Expression::StringLiteral(_) | Expression::TemplateLiteral(_)
                    )
                    && is_member_chain(&l.left)
                {
                    let test = self.test(&l.left, false);
                    let test = strip_parens(&test).to_string();
                    let value = self.expr(&l.right);
                    let fallback = self.expr(&l.left);
                    return format!("({test} ? {value} : {fallback})");
                }
                // `x ?? undefined` is `x`.
                if l.operator == LogicalOperator::Coalesce && is_nothing(&l.right) {
                    return self.expr(&l.left);
                }
                // `x || undefined` of a name or a member chain: JS's falsy `x` is `none`
                // (MediaGrid's `posterUri={item.uri || undefined}` hands no poster for `""`).
                if l.operator == LogicalOperator::Or
                    && is_nothing(&l.right)
                    && !self.head
                    && is_member_chain(&l.left)
                {
                    let test = self.test(&l.left, false);
                    let test = strip_parens(&test).to_string();
                    let value = self.expr(&l.left);
                    return format!("({test} ? {value} : none)");
                }
                // `x || undefined`: `x`, an empty one kept (JS gave `undefined`).
                if l.operator == LogicalOperator::Or && is_nothing(&l.right) {
                    self.review(
                        "`|| undefined` dropped: a falsy value (`\"\"`, `0`) is kept, not `none`".into(),
                    );
                    return self.expr(&l.left);
                }
                // `a || 0`, `a || ""`, `a || false`: the falsy value of `a`'s own type as
                // the default gives what `a ?? d` gives (only `NaN || 0` differs); `a || []`
                // and `a || {}` too (a list or an object is never falsy).
                if l.operator == LogicalOperator::Or
                    && !is_boolean_shaped(&l.left)
                    && match l.right.without_parentheses() {
                        Expression::NumericLiteral(n) => n.value == 0.0,
                        Expression::StringLiteral(s) => s.value.is_empty(),
                        Expression::BooleanLiteral(b) => !b.value,
                        Expression::ArrayExpression(a) => a.elements.is_empty(),
                        Expression::ObjectExpression(o) => o.properties.is_empty(),
                        _ => false,
                    }
                {
                    let left = self.expr(&l.left);
                    let right = self.expr(&l.right);
                    return format!("{left} ?? {right}");
                }
                if l.operator == LogicalOperator::Or && !is_boolean_shaped(&l.left) {
                    // `a || b || c` is `a || (b || c)` (JS gives the first truthy one either
                    // way): each `||`'s left is one operand, its default the rest.
                    let mut operands = vec![&l.right];
                    let mut first = &l.left;
                    while let Expression::LogicalExpression(inner) = first.without_parentheses()
                        && inner.operator == LogicalOperator::Or
                        && !is_boolean_shaped(&inner.left)
                    {
                        operands.push(&inner.right);
                        first = &inner.left;
                    }
                    operands.push(first);
                    let texts: Vec<String> = operands.iter().rev().map(|e| self.expr(e)).collect();
                    let mut acc = texts.last().cloned().unwrap_or_default();
                    for left in texts.iter().rev().skip(1) {
                        let right = if acc.contains("||") { format!("({acc})") } else { acc };
                        self.defaults
                            .entry(crate::truthiness::squeeze(left))
                            .or_default()
                            .push(right.clone());
                        acc = format!("{left} || {right}");
                    }
                    return acc;
                }
                let left = if l.operator == LogicalOperator::Coalesce {
                    self.optional_read(&l.left)
                } else {
                    self.expr(&l.left)
                };
                let right = self.expr(&l.right);
                format!("{left} {op} {right}")
            }
            // `d.getMonth() + 1`: the calendar's 1-based month itself (`crate::dates`).
            Expression::BinaryExpression(b) if let Some(text) = self.date_month(b) => text,
            Expression::BinaryExpression(b) => self.binary(b),
            Expression::UnaryExpression(u) => match u.operator {
                // `!!x?.trim()`: `Boolean(x?.trim())`, an optional string's truthiness.
                UnaryOperator::LogicalNot
                    if let Expression::UnaryExpression(inner) = u.argument.without_parentheses()
                        && inner.operator == UnaryOperator::LogicalNot
                        && optional_string_call(&inner.argument) =>
                {
                    self.boolean(&inner.argument)
                }
                // `!x` is always a boolean in JS: the negated truthiness of `x`.
                UnaryOperator::LogicalNot => self.test_negated(&u.argument),
                UnaryOperator::UnaryNegation => format!("-{}", self.expr(&u.argument)),
                op => self.refuse(
                    &format!("operator:{}", op.as_str()),
                    format!("the `{}` operator", op.as_str()),
                    u.span,
                ),
            },
            Expression::AwaitExpression(a) => {
                let value = self.expr(&a.argument);
                // A local function made `async throws` ([`crate::module::Tr::throwing`]).
                // (A local function made `async throws` is awaited with `try` anywhere.)
                if self.awaits_throwing(&a.argument) || self.in_do && !self.awaits_bloom(&a.argument) {
                    format!("try await {value}")
                } else if self.propagate && !self.awaits_bloom(&a.argument) {
                    format!("await {value}?")
                } else {
                    format!("await {value}")
                }
            }
            Expression::JSXElement(el) => self.component(el),
            Expression::JSXFragment(f) => self.fragment_value(f),
            Expression::AssignmentExpression(a) => {
                self.refuse("assign:expression", "an assignment inside an expression", a.span)
            }
            Expression::UpdateExpression(u) => {
                self.refuse("assign:expression", "`++`/`--` inside an expression", u.span)
            }
            Expression::NewExpression(n) => match &n.callee {
                Expression::Identifier(id)
                    if matches!(id.name.as_str(), "Map" | "Set")
                        && !self.imported.contains(id.name.as_str()) =>
                {
                    let targs = n
                        .type_arguments
                        .as_ref()
                        .map(|t| {
                            let tys: Vec<String> = t.params.iter().map(|p| self.ty(p)).collect();
                            format!("<{}>", tys.join(", "))
                        })
                        .unwrap_or_default();
                    let pairs = std::mem::replace(&mut self.pairs, id.name == "Map");
                    let args: Vec<String> = n
                        .arguments
                        .iter()
                        .map(|a| match a.as_expression() {
                            Some(e) => self.entries(e),
                            None => self.refuse("call:spread", "a spread argument to `new`", a.span()),
                        })
                        .collect();
                    self.pairs = pairs;
                    format!("{}{targs}({})", id.name, args.join(", "))
                }
                // `new Date(…)`: the standard library's `Date` (`crate::dates`).
                Expression::Identifier(id)
                    if id.name == "Date"
                        && let Some(d) = self.date_val(e) =>
                {
                    d.value()
                }
                // `new RegExp(x)`: construction is a call of the `"js"` import.
                Expression::Identifier(id)
                    if GLOBALS.contains(&id.name.as_str()) && !self.imported.contains(id.name.as_str()) =>
                {
                    self.js.insert(id.name.to_string());
                    let args: Vec<String> = n
                        .arguments
                        .iter()
                        .map(|a| match a.as_expression() {
                            Some(e) => self.expr(e),
                            None => self.refuse("call:spread", "a spread argument to `new`", a.span()),
                        })
                        .collect();
                    format!("{}({})", id.name, args.join(", "))
                }
                // `new Intl.NumberFormat(l, o)`: a closure that formats a number (`crate::intl`).
                Expression::StaticMemberExpression(_) if let Some(text) = self.intl_formatter(n) => text,
                Expression::StaticMemberExpression(_) if let Some(text) = self.date_formatter(n) => text,
                _ => self.refuse("new", format!("`new {}`", self.slice(n.callee.span())), n.span),
            },
            Expression::SequenceExpression(s) => self.refuse("operator:comma", "a comma expression", s.span),
            Expression::TaggedTemplateExpression(t) => {
                self.refuse("template:tagged", "a tagged template", t.span)
            }
            // `/a+/g`: `RegExp("a+", "g")`, the `"js"` import's constructor.
            Expression::RegExpLiteral(r) => {
                self.js.insert("RegExp".into());
                let pattern = quote(r.regex.pattern.text.as_str());
                let flags = r.regex.flags.to_string();
                if flags.is_empty() {
                    format!("RegExp({pattern})")
                } else {
                    format!("RegExp({pattern}, {})", quote(&flags))
                }
            }
            Expression::ThisExpression(t) => self.refuse("class", "`this`", t.span),
            Expression::ImportExpression(i)
                if self.dynamic_import
                    && let Expression::StringLiteral(s) = &i.source =>
            {
                format!("import({})", quote(s.value.as_str().unwrap_or_default()))
            }
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
        if let Some(view) = self.view_aliases.get(name).cloned() {
            return self.ident(&view, span);
        }
        if let Some(renamed) = self.import_renames.get(name) {
            let renamed = renamed.clone();
            self.used.insert(renamed.clone());
            return renamed;
        }
        if name == "undefined" {
            return "none".into();
        }
        if let Some(setter) = self.scope.setters.get(name) {
            // A setter handed on as a value: the closure that assigns the state.
            let state = setter.state.clone();
            return format!("{{ next in {state} = next }}");
        }
        if self.scope.props.as_deref() == Some(name) && self.scope.whole_props {
            self.used.insert(name.to_string());
            return name.to_string();
        }
        // A menu's actions or content (built only when its menu opens or a row is chosen) hands
        // its props on as TS did: one record of the stored properties.
        if self.in_menu
            && let Some(fields) = self.whole_props_fields(name)
        {
            let fields: Vec<String> = fields.iter().map(|f| format!("{f}: {}", self.name(f, span))).collect();
            return format!("{{ {} }}", fields.join(", "));
        }
        if self.scope.props.as_deref() == Some(name) {
            return self.refuse(
                "view:props-object",
                "the props object used whole (spread or passed on)",
                span,
            );
        }
        // JS's `Infinity` and `NaN` are the stdlib's `Double.infinity` and `Double.nan` (2.0 has no
        // "js" import in app code).
        if matches!(name, "Infinity" | "NaN")
            && !self.imported.contains(name)
            && !self.scope.decl.contains_key(name)
        {
            return if name == "NaN" { "Double.nan" } else { "Double.infinity" }.to_string();
        }
        // A prop named like a JS global (`location`) is the prop.
        if GLOBALS.contains(&name) && !self.imported.contains(name) && !self.scope.decl.contains_key(name) {
            if matches!(name, "Map" | "Set") {
                return self.refuse(
                    &format!("global:{name}"),
                    format!("the JS global `{name}` as a value"),
                    span,
                );
            }
            // A JS global is a `Foreign` import from `"js"` (tsc checks its uses).
            self.js.insert(name.to_string());
            return name.to_string();
        }
        if self.react.contains_key(name) {
            let export = self.react[name].clone();
            if self.hook_fn && matches!(export.as_str(), "useMemo" | "useCallback" | "useContext") {
                self.react_values.insert(if export == name { export } else { format!("{export} as {name}") });
                return name.to_string();
            }
            return self.refuse(&format!("react:{export}"), format!("React's `{name}`"), span);
        }
        self.name(name, span)
    }

    fn static_member(&mut self, object: &Expression, property: &str, optional: bool, _span: Span) -> String {
        // `Number.NaN`, `Number.MAX_SAFE_INTEGER`, …: the stdlib's or the number itself.
        if let Expression::Identifier(o) = object.without_parentheses()
            && o.name == "Number"
            && !self.imported.contains("Number")
        {
            match property {
                "NaN" => return "Double.nan".to_string(),
                "POSITIVE_INFINITY" => return "Double.infinity".to_string(),
                "MAX_SAFE_INTEGER" => return "9007199254740991".to_string(),
                "MIN_SAFE_INTEGER" => return "(0 - 9007199254740991)".to_string(),
                _ => {}
            }
        }
        // `React.Children.toArray(node).length`: a `View` is one child.
        if property == "length"
            && let Expression::CallExpression(call) = object.without_parentheses()
            && let Expression::StaticMemberExpression(m) = &call.callee
            && m.property.name == "toArray"
            && matches!(&m.object, Expression::StaticMemberExpression(c) if c.property.name == "Children")
        {
            self.review(
                "`React.Children.toArray(x).length` is 1: a view is one child (a `Group` counts once)".into(),
            );
            return "1".into();
        }
        if let Expression::Identifier(id) = object
            && self.scope.props.as_deref() == Some(id.name.as_str())
            && !self.scope.renames.contains_key(id.name.as_str())
        {
            return self.name(property, id.span);
        }
        // `r.current`: a `@ref` is read by its name.
        if property == "current"
            && let Expression::Identifier(id) = object
            && self.scope.refs.contains(id.name.as_str())
        {
            return self.name(&id.name, id.span);
        }
        let dot = if optional || has_optional(object) { "?." } else { "." };
        let object_text = if optional { self.optional_read(object) } else { self.expr(object) };
        let property = if property == "length" { "count" } else { property };
        format!("{object_text}{dot}{property}")
    }

    fn binary(&mut self, b: &oxc_ast::ast::BinaryExpression) -> String {
        // `e instanceof C`: `e is C`, Swift's type test.
        if b.operator == BinaryOperator::Instanceof
            && let Expression::Identifier(class) = b.right.without_parentheses()
        {
            let value = self.expr(&b.left);
            let value = if is_postfix_text(&value) { value } else { format!("({value})") };
            let class = self.name(&class.name, class.span);
            return format!("{value} is {class}");
        }
        // `"k" in x` (TS narrowing a union by a key): whether `x.k` is there, under review
        // (JS's `in` holds for a key set to `undefined` too).
        if b.operator == BinaryOperator::In
            && let Expression::StringLiteral(key) = b.left.without_parentheses()
            && crate::module::is_identifier(key.value.as_str().unwrap_or_default())
        {
            let key = key.value.as_str().unwrap_or_default();
            let value = self.expr(&b.right);
            let value = if is_postfix_text(&value) { value } else { format!("({value})") };
            self.review(format!(
                "`\"{key}\" in …` is whether `.{key}` is there (JS also counts a key set to `undefined`)"
            ));
            return format!("{value}.{key} != none");
        }
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
        // `typeof x === "string"`: `x is String`; `"undefined"` tests `none`.
        let typeof_of = |e: &'_ Expression<'_>| match e.without_parentheses() {
            Expression::UnaryExpression(u) if u.operator == UnaryOperator::Typeof => Some(()),
            _ => None,
        };
        if matches!(op, "==" | "!=") {
            let (t, lit) =
                if typeof_of(&b.left).is_some() { (&b.left, &b.right) } else { (&b.right, &b.left) };
            if let (Expression::UnaryExpression(u), Expression::StringLiteral(kind)) =
                (t.without_parentheses(), lit.without_parentheses())
                && u.operator == UnaryOperator::Typeof
            {
                let value = self.expr(&u.argument);
                let value = if is_postfix_text(&value) { value } else { format!("({value})") };
                let ty = match kind.value.as_str().unwrap_or_default() {
                    "string" => "String",
                    "number" => "Float",
                    "boolean" => "Bool",
                    "undefined" => return format!("{value} {op} none"),
                    other => {
                        return self.refuse("operator:typeof", format!("`typeof … === \"{other}\"`"), b.span);
                    }
                };
                return if op == "==" { format!("{value} is {ty}") } else { format!("!({value} is {ty})") };
            }
        }
        // `xs.indexOf(x) === -1`: a Bloom `indexOf` gives `none`, not `-1`.
        let index_of = |e: &Expression| {
            matches!(e.without_parentheses(), Expression::CallExpression(c)
                if matches!(&c.callee, Expression::StaticMemberExpression(m) if m.property.name == "indexOf"))
        };
        let number = |e: &Expression| match e.without_parentheses() {
            Expression::NumericLiteral(n) => Some(n.value),
            Expression::UnaryExpression(u) if u.operator == UnaryOperator::UnaryNegation => match &u.argument
            {
                Expression::NumericLiteral(n) => Some(-n.value),
                _ => None,
            },
            _ => None,
        };
        if index_of(&b.left)
            && let Some(n) = number(&b.right)
        {
            let found = match (op, n) {
                ("==", -1.0) | ("<", 0.0) | ("<=", -1.0) => Some(false),
                ("!=", -1.0) | (">=", 0.0) | (">", -1.0) => Some(true),
                _ => None,
            };
            if let Some(found) = found {
                let call = self.expr(&b.left);
                return format!("{call} {} none", if found { "!=" } else { "==" });
            }
        }
        // `xs[i] === undefined`: whether the element is there, `xs.at(i) == none`.
        if matches!(op, "==" | "!=") && (is_nothing(&b.right) || is_nothing(&b.left)) {
            let (value, _) = if is_nothing(&b.right) { (&b.left, &b.right) } else { (&b.right, &b.left) };
            if index_read(value).is_some() {
                return format!("{} {op} none", self.optional_read(value));
            }
        }
        let left = self.operand(&b.left, &b.right);
        let right = self.operand(&b.right, &b.left);
        format!("{left} {op} {right}")
    }

    /// `x!`, kept against its operand.
    fn forced(&mut self, e: &Expression) -> String {
        let text = self.expr(e);
        if is_postfix_text(&text) { format!("{text}!") } else { format!("({text})!") }
    }

    /// A value read where TS allows `undefined` (`?.`, `??`, a test): a list's element by
    /// index is `xs.at(i)`, since `xs[i]` is the element itself and out of range a trap. A
    /// dictionary's `d[k]` is optional already; `crate::typed` puts back one bloomc types so.
    pub fn optional_read(&mut self, e: &Expression) -> String {
        if let Some((object, key)) = index_read(e) {
            let object = self.expr(object);
            let key = self.expr(key);
            return format!("{object}.at({key})");
        }
        self.expr(e)
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
    /// An expression in a statement head (`for x in …`, `while …`): see [`Tr::head`].
    pub fn head_expr(&mut self, e: &Expression) -> String {
        let head = std::mem::replace(&mut self.head, true);
        let text = self.expr(e);
        self.head = head;
        text
    }

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
        let head = std::mem::replace(&mut self.head, true);
        let test = self.test_parts_inner(e, binds);
        self.head = head;
        test
    }

    fn test_parts_inner(&mut self, e: &Expression, binds: bool) -> Test {
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
                "String?" if plain || is_member_path(&name) => format!("{name} != none && !{name}.isEmpty"),
                "String?" => format!("({name} ?? \"\") != \"\""),
                // A member path is read again: bloomc narrows it for the branch (`trend.count`).
                "Float?" if is_member_path(&name) => format!("{name} != none && {name} != 0"),
                "Float?" => format!("({name} ?? 0) != 0"),
                t if t.ends_with('?') && binds && plain => return Test::Bind(name, None),
                t if t.ends_with('?') => format!("{name} != none"),
                _ => self.expr(e),
            });
        }
        if let Expression::UnaryExpression(u) = e.without_parentheses()
            && u.operator == UnaryOperator::LogicalNot
        {
            return Test::Plain(self.test_negated(&u.argument));
        }
        // In a condition, `a && b` / `a || b` is the truthiness of each side.
        if let Expression::LogicalExpression(l) = e.without_parentheses()
            && l.operator != LogicalOperator::Coalesce
        {
            let op = if l.operator == LogicalOperator::And { "&&" } else { "||" };
            let left = self.test_operand(&l.left);
            let right = self.test_operand(&l.right);
            return Test::Plain(format!("{left} {op} {right}"));
        }
        Test::Plain(self.condition(e))
    }

    /// A call in an optional chain: `f?.(a)` and `x.m?.(a)` stay optional calls;
    /// `a?.b.m()` reads its receiver optionally.
    pub fn optional_call_expr(&mut self, call: &CallExpression) -> String {
        if !call.optional {
            return self.call(call);
        }
        let callee = self.expr(&call.callee);
        let args = self.positional(&call.arguments, false);
        format!("{callee}?.({args})")
    }

    /// `Boolean(x)`: the truthiness of `x`. An operand the codemod cannot type is
    /// `!!x` (bloomc types it, `crate::truthiness` spells it and drops the `!!`).
    fn boolean(&mut self, value: &Expression) -> String {
        // `Boolean(x?.trim())`: an optional string's truthiness, `(x?.trimmed() ?? "") != ""`
        // (`undefined` and `""` are both falsy).
        if optional_string_call(value) {
            let text = self.expr(value);
            return format!("(({text} ?? \"\") != \"\")");
        }
        let plain = self.declared(value).is_none()
            && !matches!(
                value.without_parentheses(),
                Expression::LogicalExpression(_) | Expression::UnaryExpression(_)
            )
            && !is_boolean_shaped(value);
        if plain {
            let text = self.condition(value);
            return if is_postfix_text(&text) { format!("!!{text}") } else { format!("!!({text})") };
        }
        format!("({})", self.test(value, false))
    }

    /// One side of `&&`/`||` in a condition, parenthesised when it is itself an `||`/`&&`.
    fn test_operand(&mut self, e: &Expression) -> String {
        match e.without_parentheses() {
            Expression::LogicalExpression(_) => format!("({})", self.test(e, false)),
            // A member path the codemod cannot type is `!!x`, as `Boolean(x)` is: bloomc types an
            // `a || b` of optionals as a value (`String?`), so a bare `x` here would be read as
            // JS's default, not as its truthiness. `crate::truthiness` spells `x` and drops `!!`.
            // (A call keeps its own form: its text may be respelled before it is typed.)
            inner
                if self.declared(e).is_none()
                    && !is_boolean_shaped(e)
                    && !matches!(inner, Expression::UnaryExpression(_)) =>
            {
                let text = self.condition(e);
                let path = text.starts_with(|c: char| c.is_alphabetic() || c == '_')
                    && text.chars().all(|c| c.is_alphanumeric() || matches!(c, '_' | '.' | '?' | '!'));
                if path { format!("!!{text}") } else { text }
            }
            _ => self.test(e, false),
        }
    }

    /// A condition operand the codemod cannot type: written as is, and recorded,
    /// so that bloomc's types spell its truthiness (`crate::truthiness`).
    pub fn condition(&mut self, e: &Expression) -> String {
        let text = self.optional_read(e);
        if !is_boolean_shaped(e) {
            self.conditions.insert(text.clone());
        }
        text
    }

    /// `!(test)`, with truthiness spelled out as in [`Tr::test`].
    pub fn test_negated(&mut self, e: &Expression) -> String {
        if let Some((name, ty)) = self.declared(e) {
            return match ty.as_str() {
                "Bool" => format!("!{name}"),
                "String" => format!("{name}.isEmpty"),
                "Float" => format!("{name} == 0"),
                "Bool?" => format!("{name} != true"),
                // Parenthesised (an `if` head drops them: bloomc narrows a bare `||`).
                "String?" if is_plain_name(&name) || is_member_path(&name) => {
                    format!("({name} == none || {name}.isEmpty)")
                }
                "String?" => format!("({name} ?? \"\") == \"\""),
                "Float?" if is_member_path(&name) => format!("({name} == none || {name} == 0)"),
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
        // `!(a || b)`: each operand's truthiness is spelled, so it is tested as a whole.
        if let Expression::LogicalExpression(l) = e.without_parentheses()
            && l.operator != LogicalOperator::Coalesce
        {
            return format!("!({})", self.test(e, false));
        }
        let text = self.condition(e);
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

    /// Whether `const test = !!value?.…` (or `!!value`, `Boolean(value…)`, `value != null`) is
    /// in the file: TS narrows `value` where `test` holds.
    fn alias_proves(&self, test: &str, value: &str) -> bool {
        let head = format!("const {test} = ");
        let Some(at) = self.src.find(&head) else { return false };
        let init = &self.src[at + head.len()..];
        let init = &init[..init.find(['\n', ';']).unwrap_or(init.len())];
        [format!("!!{value}?."), format!("Boolean({value}?."), format!("Boolean({value})")]
            .iter()
            .any(|p| init.starts_with(p.as_str()))
            || [format!("!!{value}"), format!("{value} != null"), format!("{value} !== undefined")]
                .iter()
                .any(|p| init == p)
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

    /// A `Map`'s entries: a list literal of pairs, or a `map` whose closure gives
    /// a pair; the pairs (and only they) are tuples.
    fn entries(&mut self, e: &Expression) -> String {
        if !self.pairs {
            return self.expr(e);
        }
        match e.without_parentheses() {
            Expression::ArrayExpression(array) => {
                let items: Vec<String> = array
                    .elements
                    .iter()
                    .map(|el| match el {
                        ArrayExpressionElement::ArrayExpression(pair) if pair.elements.len() == 2 => {
                            self.expr(el.to_expression())
                        }
                        ArrayExpressionElement::SpreadElement(s) => {
                            let pairs = std::mem::replace(&mut self.pairs, false);
                            let text = format!("..{}", self.expr(&s.argument));
                            self.pairs = pairs;
                            text
                        }
                        other => {
                            let pairs = std::mem::replace(&mut self.pairs, false);
                            let text = self.expr(other.to_expression());
                            self.pairs = pairs;
                            text
                        }
                    })
                    .collect();
                format!("[{}]", items.join(", "))
            }
            Expression::CallExpression(_) => self.expr(e),
            _ => {
                let pairs = std::mem::replace(&mut self.pairs, false);
                let text = self.expr(e);
                self.pairs = pairs;
                text
            }
        }
    }

    /// An awaited value that is a Bloom async function's result (no `Result`:
    /// a Bloom function does not reject).
    /// A call of a local function made `async throws` ([`crate::module::Tr::throwing`]).
    pub fn awaits_throwing(&self, e: &Expression) -> bool {
        matches!(e.without_parentheses(), Expression::CallExpression(c)
            if matches!(&c.callee, Expression::Identifier(id) if self.throwing.contains(id.name.as_str())))
    }

    pub fn awaits_bloom(&self, e: &Expression) -> bool {
        matches!(e.without_parentheses(), Expression::CallExpression(call) if matches!(self.callee(call), Callee::LocalFn))
    }

    pub fn call(&mut self, call: &CallExpression) -> String {
        // `Date.now()`, `d.getTime()`, `d.toLocaleDateString(l, o)`: the standard library's `Date`.
        if let Some(text) = self.date_call(call) {
            return text;
        }
        if let Some(text) = self.number_call(call) {
            return text;
        }
        // `new Intl.NumberFormat(…).format(x)`: `x.formatted(…)`.
        if let Some(text) = self.intl_format_call(call) {
            return text;
        }
        // `number.format(x)` of a `const number = new Intl.NumberFormat(…)`: a call of its closure.
        if let Expression::StaticMemberExpression(m) = &call.callee
            && m.property.name == "format"
            && let Expression::Identifier(id) = &m.object
            && let [arg] = call.arguments.as_slice()
            && let Some(value) = arg.as_expression()
            && self.src.contains(&format!("{} = new Intl.NumberFormat(", id.name))
        {
            let f = self.expr(&m.object);
            let v = self.expr(value);
            return format!("{f}({v})");
        }
        let ts = self.ts_callee(&call.callee);
        let saved = std::mem::replace(&mut self.ts_args, ts);
        let text = self.call_inner(call);
        self.ts_args = saved;
        text
    }

    /// JS's `Number(x)` where the file says what `x` is, and `Number.isNaN(x)` of a number: a
    /// string is `s.trimmed().isEmpty ? 0 : (Float(s) ?? Double.nan)` (JS reads a blank string as 0
    /// and text that is no number as `NaN`; `Float(s)` is `none` for both), an `Int` is
    /// `n.toFloat()`, a `Float` itself. A `Number(x)` of a TS value stays JS's.
    fn number_call(&mut self, call: &CallExpression) -> Option<String> {
        let [arg] = call.arguments.as_slice() else { return None };
        let value = arg.as_expression()?;
        match &call.callee {
            Expression::Identifier(id) if id.name == "Number" && !self.imported.contains("Number") => {
                let ty = match value.without_parentheses() {
                    Expression::StringLiteral(_) | Expression::TemplateLiteral(_) => "String".to_string(),
                    Expression::NumericLiteral(_) => "Float".to_string(),
                    e => self.declared_type(e)?,
                };
                let text = self.expr(value);
                let text = if is_postfix_text(&text) { text } else { format!("({text})") };
                match ty.as_str() {
                    "String" | "String?"
                        if matches!(
                            value.without_parentheses(),
                            Expression::Identifier(_) | Expression::StaticMemberExpression(_)
                        ) =>
                    {
                        Some(format!("({text}.trimmed().isEmpty ? 0 : (Float({text}) ?? Double.nan))"))
                    }
                    "Int" => Some(format!("{text}.toFloat()")),
                    "Float" => Some(text),
                    _ => None,
                }
            }
            Expression::StaticMemberExpression(m)
                if m.property.name == "isNaN"
                    && matches!(&m.object, Expression::Identifier(o) if o.name == "Number" && !self.imported.contains("Number")) =>
            {
                let number = match value.without_parentheses() {
                    Expression::CallExpression(c) => {
                        matches!(&c.callee, Expression::StaticMemberExpression(g) if g.property.name == "getTime")
                    }
                    e => matches!(self.declared_type(e).as_deref(), Some("Float")),
                };
                if !number {
                    return None;
                }
                let text = self.expr(value);
                let text = if is_postfix_text(&text) { text } else { format!("({text})") };
                Some(format!("{text}.isNaN"))
            }
            _ => None,
        }
    }

    /// Whether `callee` is a TS import's (or a member of one): not the language's or React's.
    fn ts_callee(&self, callee: &Expression) -> bool {
        let mut root = callee;
        while let Expression::StaticMemberExpression(m) = root {
            root = &m.object;
        }
        matches!(root, Expression::Identifier(id)
            if self.imported.contains(id.name.as_str())
                && !self.lang.contains_key(id.name.as_str())
                && !self.react.contains_key(id.name.as_str()))
    }

    /// `Array.from` itself, not a local or an import of that name.
    fn is_array_from(&self, call: &CallExpression) -> bool {
        matches!(&call.callee, Expression::StaticMemberExpression(m)
            if m.property.name == "from"
                && matches!(&m.object, Expression::Identifier(o) if o.name == "Array" && !self.imported.contains("Array")))
    }

    /// `0..<n`, the bound parenthesized unless it is a postfix expression.
    fn range_to(&mut self, n: &Expression) -> String {
        let n = self.expr(n);
        if is_postfix_text(&n) { format!("0..<{n}") } else { format!("0..<({n})") }
    }

    fn call_inner(&mut self, call: &CallExpression) -> String {
        // `xs.filter((x): x is T => test)`: TS narrows the list's element type by the guard, which
        // Swift spells `compactMap { x in test ? x : none }` (the element is `T`, not `T?`).
        if let Expression::StaticMemberExpression(m) = &call.callee
            && m.property.name == "filter"
            && !m.optional
            && let [Argument::ArrowFunctionExpression(arrow)] = call.arguments.as_slice()
            && let Some(ret) = &arrow.return_type
            && let oxc_ast::ast::TSType::TSTypePredicate(p) = &ret.type_annotation
            && !p.asserts
            && let [param] = arrow.params.items.as_slice()
            && let oxc_ast::ast::BindingPattern::BindingIdentifier(id) = &param.pattern
            && let oxc_ast::ast::TSTypePredicateName::Identifier(guarded) = &p.parameter_name
            && guarded.name == id.name
            && let Some(body) = arrow.get_expression()
        {
            let receiver = self.expr(&m.object);
            let receiver = if is_postfix_text(&receiver) { receiver } else { format!("({receiver})") };
            let name = self.name(&id.name, id.span);
            let head = std::mem::replace(&mut self.head, false);
            let test = self.test(body, false);
            self.head = head;
            return format!("{receiver}.compactMap {{ {name} in {test} ? {name} : none }}");
        }
        // `Math.max(a, b)` and kin are the prelude's typed `max(a, b)`; `Array.isArray(x)` is `x is [Foreign]`.
        if let Expression::StaticMemberExpression(m) = &call.callee
            && let Expression::Identifier(object) = &m.object
            && !self.imported.contains(object.name.as_str())
            && call.arguments.iter().all(|a| a.as_expression().is_some())
        {
            let prelude = match (object.name.as_str(), m.property.name.as_str(), call.arguments.len()) {
                ("Math", f @ ("max" | "min"), n) if n >= 1 => Some(f),
                ("Math", f @ ("abs" | "round" | "floor" | "ceil"), 1) => Some(f),
                _ => None,
            };
            if let Some(f) = prelude {
                let args: Vec<String> = call.arguments.iter().map(|a| self.expr(a.to_expression())).collect();
                return format!("{f}({})", args.join(", "));
            }
            // `Array.from({ length: n }, (_, i) => …)` is `(0..<n).map { i in … }`, and with no
            // function the range itself (ADR 0002 section 6.3).
            if object.name == "Array"
                && m.property.name == "from"
                && let Some(n) = array_from_length(call)
            {
                let range = self.range_to(n);
                return match call.arguments.get(1) {
                    None => format!("({range})"),
                    Some(Argument::ArrowFunctionExpression(arrow)) if let Some(i) = unused_item(arrow) => {
                        let i = match i {
                            Some((name, span)) => self.bind(name, span),
                            None => "_".into(),
                        };
                        let body = self.closure_body(arrow);
                        format!("({range}).map {{ {i} in\n{body}\n}}")
                    }
                    Some(_) => self.refuse(
                        "array:from",
                        "`Array.from({ length })` with a function that reads its item (`undefined`)",
                        call.span,
                    ),
                };
            }
            if object.name == "Array" && m.property.name == "isArray" && call.arguments.len() == 1 {
                let value = self.expr(call.arguments[0].to_expression());
                let value = if is_postfix_text(&value) { value } else { format!("({value})") };
                return format!("{value} is [Foreign]");
            }
        }
        // JS `s.replace(a, b)` replaces the first match; Bloom's `replace` is `replaceAll`.
        if let Expression::StaticMemberExpression(m) = &call.callee
            && m.property.name == "replace"
            && call.arguments.len() == 2
        {
            match call.arguments[0].as_expression().map(|e| e.without_parentheses()) {
                Some(Expression::RegExpLiteral(r)) if r.regex.flags.to_string().contains('g') => {}
                // `^…`, or `…$` that cannot match empty, without `m`: one match at most,
                // so every match is the first.
                Some(Expression::RegExpLiteral(r))
                    if matches_once(r.regex.pattern.text.as_str())
                        && !r.regex.flags.to_string().contains('m') =>
                {
                    self.js.insert("RegExp".into());
                    let pattern = quote(r.regex.pattern.text.as_str());
                    let flags = quote(&format!("g{}", r.regex.flags));
                    let object = self.expr(&m.object);
                    let optional = if m.optional { "?" } else { "" };
                    let with = call.arguments[1].as_expression().map(|e| self.expr(e)).unwrap_or_default();
                    return format!("{object}{optional}.replace(RegExp({pattern}, {flags}), {with})");
                }
                Some(Expression::RegExpLiteral(r)) => {
                    return self.refuse(
                        "string:replace",
                        "`replace` with a regex without `g` (Bloom's `replace` replaces every match)",
                        r.span,
                    );
                }
                _ => self
                    .review("`replace` replaces every occurrence in `.bloom`; JS replaced the first".into()),
            }
        }
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
            if name == "Boolean"
                && !self.imported.contains(name)
                && let [arg] = call.arguments.as_slice()
                && let Some(value) = arg.as_expression()
            {
                return self.boolean(value);
            }
            // An `Embed((render) => <C slot={render(x)} />)` render prop's `render(x)` in a prop:
            // a view where TS takes an element, as `toElement(x)` is.
            if self.scope.render.as_deref() == Some(name)
                && let [arg] = call.arguments.as_slice()
                && arg.as_expression().is_some()
            {
                return self.expr(arg.to_expression());
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
            // A modifier made in place (`{ compact: defineModifier((v) => v.padding('md')) }`, a
            // function's result): the modifier value, `defineModifier { v: View in v.… }`.
            if self.is_lang(name, "defineModifier")
                && let [Argument::ArrowFunctionExpression(arrow)] = call.arguments.as_slice()
                && let [param] = arrow.params.items.as_slice()
                && let BindingPattern::BindingIdentifier(id) = &param.pattern
                && let Some(body) = arrow.get_expression()
                && crate::module::chain_root(body).is_some_and(|root| root == id.name.as_str())
            {
                let saved = self.scope.clone();
                let v = self.bind(&id.name, id.span);
                let chain = self.expr(body);
                self.scope = saved;
                self.lang_values.insert(name.to_string());
                return format!("{name} {{ {v}: View in {chain} }}");
            }
            if self.is_lang(name, "view") || self.is_lang(name, "defineModifier") {
                return self.refuse("view:nested", format!("`{name}(…)` inside an expression"), call.span);
            }
            if let Some(export) = self.react.get(name)
                && !(self.hook_fn && matches!(export.as_str(), "useMemo" | "useCallback" | "useContext"))
            {
                let export = export.clone();
                return self.refuse(&format!("react:{export}"), format!("React's `{name}` here"), call.span);
            }
        }
        if let Expression::StaticMemberExpression(member) = &call.callee
            && self.is_view(&member.object)
        {
            return self.modifier(call, &member.object, &member.property.name, member.property.span);
        }
        // `Array.from({ length: n }).map((_, i) => …)`: `(0..<n).map { i in … }`.
        if let Some((member, x, i, arrow)) = indexed_callback(call, &["map", "flatMap"])
            && x.starts_with('_')
            && let Expression::CallExpression(from) = member.object.without_parentheses()
            && self.is_array_from(from)
            && from.arguments.len() == 1
            && let Some(n) = array_from_length(from)
        {
            let range = self.range_to(n);
            let i = self.bind(i, arrow.span);
            let body = self.closure_body(arrow);
            return format!("({range}).{} {{ {i} in\n{body}\n}}", member.property.name);
        }
        // `xs.map((x, i) => …)`: `xs.enumerated().map { (i, x) in … }`. `every`/`some` give a
        // `Bool` either way, so they take the pairs too (then `all`/`any`).
        if let Some((member, x, i, arrow)) = indexed_callback(call, &["map", "flatMap", "every", "some"]) {
            let list = self.expr(&member.object);
            let (x, i) = (self.bind(x, arrow.span), self.bind(i, arrow.span));
            let body = self.closure_body(arrow);
            let method = member.property.name.as_str();
            // A test reads in a condition, where a trailing closure would be the `if`'s block.
            if matches!(method, "every" | "some") {
                return format!("{list}.enumerated().{method}({{ ({i}, {x}) in\n{body}\n}})");
            }
            return format!("{list}.enumerated().{method} {{ ({i}, {x}) in\n{body}\n}}");
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
                let rest = match &call.callee {
                    Expression::Identifier(id) => self.rest_views.get(id.name.as_str()).cloned(),
                    _ => None,
                };
                match call.arguments.as_slice() {
                    [] => format!("{callee}()"),
                    // `X({ label, post, … })` for `X({ label, ...menu })`: the other fields are `menu`.
                    [Argument::ObjectExpression(o)] if let Some((rest, own)) = rest => {
                        format!("{callee}({})", self.rest_args(o, &rest, &own))
                    }
                    [Argument::ObjectExpression(o)] => format!("{callee}({})", self.named_args(o)),
                    // `X(props)` of a view whose rest is a base interface (`Tr::rest_bases`): its own
                    // props by name, then the base's fields as the rest's record.
                    [Argument::Identifier(v)]
                        if let Expression::Identifier(id) = &call.callee
                            && let Some(base) = self.rest_bases.get(id.name.as_str()).cloned()
                            && let Some((rest, own)) = self.rest_views.get(id.name.as_str()).cloned() =>
                    {
                        // Props written out (`Tr::whole_props_fields`) are read by name.
                        let whole = self.whole_props_fields(&v.name).is_some();
                        let value = self.name(&v.name, v.span);
                        let mut read = |f: &String| {
                            if whole {
                                format!("{f}: {}", self.name(f, v.span))
                            } else {
                                format!("{f}: {value}.{f}")
                            }
                        };
                        let mut args: Vec<String> = own.iter().map(&mut read).collect();
                        let fields: Vec<String> = base.iter().map(&mut read).collect();
                        args.push(format!("{rest}: {{ {} }}", fields.join(", ")));
                        format!("{callee}({})", args.join(", "))
                    }
                    // `X(props)` in a view whose props are written out: each one, by name.
                    [Argument::Identifier(v)] if let Some(fields) = self.whole_props_fields(&v.name) => {
                        // The callee's TS defaults are this view's too (`Tr::view_defaults`).
                        if let Expression::Identifier(id) = &call.callee
                            && let Some(defaults) = self.view_defaults.get(id.name.as_str()).cloned()
                        {
                            for (key, value) in defaults {
                                if fields.contains(&key)
                                    && !self.scope.field_defaults.iter().any(|(k, _)| *k == key)
                                {
                                    self.scope.field_defaults.push((key, value));
                                }
                            }
                        }
                        let args: Vec<String> =
                            fields.iter().map(|f| format!("{f}: {}", self.name(f, v.span))).collect();
                        format!("{callee}({})", args.join(", "))
                    }
                    // `Rows(options)` of a menu struct: each stored property read from the value.
                    [Argument::Identifier(v)]
                        if let Expression::Identifier(id) = &call.callee
                            && let Some(fields) = self.menu_fields.get(id.name.as_str()).cloned() =>
                    {
                        let value = self.name(&v.name, v.span);
                        let args: Vec<String> = fields.iter().map(|f| format!("{f}: {value}.{f}")).collect();
                        format!("{callee}({})", args.join(", "))
                    }
                    // `X(props)`: its fields as the arguments.
                    [arg] if arg.as_expression().is_some() => {
                        let value = self.expr(arg.to_expression());
                        format!("{callee}(..{value})")
                    }
                    _ => self.refuse(
                        "view:props-object",
                        "a view called with a computed props object",
                        call.span,
                    ),
                }
            }
            Callee::LocalFn => {
                let callee = self.expr(&call.callee);
                let labels = match &call.callee {
                    Expression::Identifier(id) => self.labelled.get(id.name.as_str()).cloned(),
                    _ => None,
                };
                // A function with labelled parameters (`Tr::labelled`): an object's fields,
                // or a value's, by label.
                if let Some(labels) = labels {
                    match call.arguments.as_slice() {
                        [Argument::ObjectExpression(o)] => {
                            return format!("{callee}({})", self.named_args(o));
                        }
                        [Argument::Identifier(v)] => {
                            let whole = self.whole_props_fields(&v.name).is_some();
                            let value = if whole {
                                String::new()
                            } else {
                                self.expr(call.arguments[0].to_expression())
                            };
                            let args: Vec<String> = labels
                                .iter()
                                .map(|(k, ..)| {
                                    if whole {
                                        format!("{k}: {}", self.name(k, v.span))
                                    } else {
                                        format!("{k}: {value}.{k}")
                                    }
                                })
                                .collect();
                            return format!("{callee}({})", args.join(", "));
                        }
                        _ => {}
                    }
                }
                let args = self.positional(&call.arguments, true);
                format!("{callee}({args})")
            }
            Callee::Ts => self.ts_call(call),
        }
    }

    /// The written-out props of the view's props parameter `name` (see [`Scope::props_fields`]).
    pub fn whole_props_fields(&self, name: &str) -> Option<Vec<String>> {
        (self.scope.props.as_deref() == Some(name) && !self.scope.props_fields.is_empty())
            .then(|| self.scope.props_fields.clone())
    }

    /// A call's object for a view with rest props: its own props by name, the other fields
    /// as one record, `rest: { … }`.
    fn rest_args(&mut self, o: &ObjectExpression, rest: &str, own: &[String]) -> String {
        let mut named = Vec::new();
        let mut others = Vec::new();
        for property in &o.properties {
            let text = match property {
                ObjectPropertyKind::ObjectProperty(p) => {
                    let key = match &p.key {
                        PropertyKey::StaticIdentifier(id) => Some(id.name.to_string()),
                        _ => None,
                    };
                    let value = self.expr(&p.value);
                    match key {
                        Some(k) if own.contains(&k) => {
                            named.push(format!("{k}: {value}"));
                            continue;
                        }
                        Some(k) => format!("{k}: {value}"),
                        None => return self.named_args(o),
                    }
                }
                ObjectPropertyKind::SpreadProperty(_) => return self.named_args(o),
            };
            others.push(text);
        }
        named.push(format!("{rest}: {{ {} }}", others.join(", ")));
        named.join(", ")
    }

    /// A call by TypeScript's convention: a trailing object literal is named arguments.
    fn ts_call(&mut self, call: &CallExpression) -> String {
        // `useQuery({ queryKey, queryFn: () => f() })`: the `TanStackQuery` binding's
        // `useQuery(QueryOptions(queryKey:, queryFn: { try await f() }))` (`Tr::tanstack`), and
        // `useInfiniteQuery` likewise with `InfiniteQueryOptions`.
        if self.tanstack.contains(&call.span.start)
            && let [Argument::ObjectExpression(o)] = call.arguments.as_slice()
        {
            let infinite =
                matches!(&call.callee, Expression::Identifier(id) if id.name == "useInfiniteQuery");
            let mut fields = Vec::new();
            for property in &o.properties {
                let ObjectPropertyKind::ObjectProperty(p) = property else { unreachable!() };
                let PropertyKey::StaticIdentifier(key) = &p.key else { unreachable!() };
                let value = match &p.value {
                    Expression::ArrowFunctionExpression(arrow) if key.name == "queryFn" => {
                        let Some(body) = arrow.get_expression() else { unreachable!() };
                        let value = match body.without_parentheses() {
                            Expression::AwaitExpression(a) => &a.argument,
                            other => other,
                        };
                        // `() => c ? f() : g()`: each branch awaited (`c ? try await f() : try await g()`).
                        let value = match value.without_parentheses() {
                            Expression::ConditionalExpression(c) => {
                                let head = std::mem::replace(&mut self.head, false);
                                let test = self.test(&c.test, false);
                                self.head = head;
                                let a = self.expr(&c.consequent);
                                let b = self.expr(&c.alternate);
                                format!("{test} ? try await {a} : try await {b}")
                            }
                            other => format!("try await {}", self.expr(other)),
                        };
                        match (infinite, arrow.params.items.is_empty()) {
                            (false, _) => format!("{{ {value} }}"),
                            (true, true) => format!("{{ _ in {value} }}"),
                            // `({ pageParam }) => f(pageParam)`: the page's context, its cursor read.
                            (true, false) => {
                                format!("{{ page in\nlet pageParam = page.pageParam\nreturn {value}\n}}")
                            }
                        }
                    }
                    // `undefined as string | undefined`: no first cursor.
                    _ if key.name == "initialPageParam" => "none".to_string(),
                    value => self.expr(value),
                };
                fields.push(format!("{}: {value}", key.name));
            }
            if infinite {
                if !fields.iter().any(|f| f.starts_with("getNextPageParam:")) {
                    fields.push("getNextPageParam: { _ in none }".to_string());
                }
                return format!("useInfiniteQuery(InfiniteQueryOptions({}))", fields.join(", "));
            }
            return format!("useQuery(QueryOptions({}))", fields.join(", "));
        }
        // `s.padStart(2, "0")`: the standard library's `paddingStart(to:with:)` (and `padEnd`).
        if let Expression::StaticMemberExpression(m) = &call.callee
            && let Some(to) = match m.property.name.as_str() {
                "padStart" => Some("paddingStart"),
                "padEnd" => Some("paddingEnd"),
                _ => None,
            }
            && matches!(call.arguments.len(), 1 | 2)
            && call.arguments.iter().all(|a| a.as_expression().is_some())
        {
            let dot = if m.optional || has_optional(&m.object) { "?." } else { "." };
            let object = self.expr(&m.object);
            let args: Vec<String> =
                call.arguments.iter().filter_map(|a| a.as_expression()).map(|a| self.expr(a)).collect();
            return match args.as_slice() {
                [length] => format!("{object}{dot}{to}(to: {length})"),
                [length, pad] => format!("{object}{dot}{to}(to: {length}, with: {pad})"),
                _ => unreachable!(),
            };
        }
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
        if let Some(args) = &call.type_arguments
            && !self.typed_calls.contains(&call.span.start)
        {
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
        // i18next's `t(key, "default", { … })`: the default is the options' `defaultValue`.
        let (rest, default) = match rest {
            [key, Argument::StringLiteral(d)] if callee == "t" && last_object.is_some() => (
                std::slice::from_ref(key),
                Some(format!("defaultValue: {}", quote(d.value.as_str().unwrap_or_default()))),
            ),
            _ => (rest, None),
        };
        let mut args = self.positional(rest, false);
        if let Some(default) = default {
            args.push_str(", ");
            args.push_str(&default);
        }
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
        // (In a statement head `{` opens the body: there it stays an argument.)
        if let [Argument::ArrowFunctionExpression(arrow)] = call.arguments.as_slice() {
            let closure = self.closure(arrow);
            return if self.head { format!("{callee}({closure})") } else { format!("{callee} {closure}") };
        }
        format!("{callee}({args})")
    }

    pub fn positional(&mut self, args: &[Argument], _local: bool) -> String {
        let mut out = Vec::new();
        for arg in args {
            let note = self.note(arg.span().start);
            let value = match arg {
                // A list spread into a rest parameter (`f(..xs)`).
                Argument::SpreadElement(s) => format!("..{}", self.expr(&s.argument)),
                other => self.expr(other.to_expression()),
            };
            out.push(format!("{note}{value}"));
        }
        out.join(", ")
    }

    /// `{ a: 1, b, 'x-y': 2, ...rest }` as the record `{ a: 1, b: b, "x-y": 2, ..rest }`.
    /// `c ? { k: v, … } : {}` (or `c ? {} : { … }`) spread into a record: its fields,
    /// each `k: c ? v : none`. `None` for any other spread.
    fn conditional_fields(&mut self, e: &Expression) -> Option<String> {
        let Expression::ConditionalExpression(c) = e.without_parentheses() else { return None };
        fn object<'b, 'a>(e: &'b Expression<'a>) -> Option<&'b ObjectExpression<'a>> {
            match e.without_parentheses() {
                Expression::ObjectExpression(o) => Some(o),
                _ => None,
            }
        }
        // `{}`, `undefined` and `null` spread nothing.
        let nothing = |e: &Expression| is_nothing(e) || object(e).is_some_and(|o| o.properties.is_empty());
        let (fields, negate) = match (object(&c.consequent), object(&c.alternate)) {
            (Some(f), _) if nothing(&c.alternate) && !f.properties.is_empty() => (f, false),
            (_, Some(f)) if nothing(&c.consequent) && !f.properties.is_empty() => (f, true),
            _ => return None,
        };
        let mut pairs = Vec::new();
        for property in &fields.properties {
            let ObjectPropertyKind::ObjectProperty(p) = property else { return None };
            let PropertyKey::StaticIdentifier(id) = &p.key else { return None };
            if p.method || p.kind != oxc_ast::ast::PropertyKind::Init {
                return None;
            }
            pairs.push((id.name.to_string(), &p.value));
        }
        let test = if negate { self.test_negated(&c.test) } else { self.test(&c.test, false) };
        let out: Vec<String> = pairs
            .into_iter()
            .map(|(key, value)| {
                let value = self.expr(value);
                format!("{key}: {test} ? {value} : none")
            })
            .collect();
        Some(out.join(", "))
    }

    pub fn record(&mut self, object: &ObjectExpression) -> String {
        if let Some(dictionary) = self.dictionary(object) {
            return dictionary;
        }
        let mut out = Vec::new();
        for property in &object.properties {
            let note = self.note(property.span().start);
            match property {
                // `...(c ? { k: v } : {})`: the field when `c` holds, `k: c ? v : none` (a
                // record's absent field is `none`).
                ObjectPropertyKind::SpreadProperty(s)
                    if let Some(fields) = self.conditional_fields(&s.argument) =>
                {
                    out.push(format!("{note}{fields}"))
                }
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

    /// An object literal with a computed key is a dictionary: `{ ...d, [k]: v }` is
    /// `d.setting(k, v)`, `{ [k]: v, s: w }` the literal `[k: v, "s": w]`. `None`
    /// without a computed key, or with a spread that is not first or a method.
    fn dictionary(&mut self, object: &ObjectExpression) -> Option<String> {
        let props = &object.properties;
        let computed = |p: &ObjectPropertyKind| {
            matches!(p, ObjectPropertyKind::ObjectProperty(p) if p.computed
                && !matches!(p.key, PropertyKey::StringLiteral(_) | PropertyKey::NumericLiteral(_)))
        };
        if !props.iter().any(computed) {
            return None;
        }
        let (base, rest) = match props.first() {
            Some(ObjectPropertyKind::SpreadProperty(s)) => (Some(&s.argument), &props[1..]),
            _ => (None, &props[..]),
        };
        let mut entries = Vec::new();
        for property in rest {
            let ObjectPropertyKind::ObjectProperty(p) = property else { return None };
            if p.method || p.kind != oxc_ast::ast::PropertyKind::Init || p.shorthand {
                return None;
            }
            let key = match &p.key {
                PropertyKey::StaticIdentifier(id) => quote(&id.name),
                PropertyKey::StringLiteral(s) => quote(s.value.as_str().unwrap_or_default()),
                key => self.expr(key.as_expression()?),
            };
            let value = self.expr(&p.value);
            entries.push((key, value));
        }
        Some(match base {
            Some(base) => {
                let mut out = self.expr(base);
                if !is_postfix_text(&out) {
                    out = format!("({out})");
                }
                for (k, v) in entries {
                    out.push_str(&format!(".setting({k}, {v})"));
                }
                out
            }
            None => {
                let items: Vec<String> = entries.into_iter().map(|(k, v)| format!("{k}: {v}")).collect();
                format!("[{}]", items.join(", "))
            }
        })
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
        // `Embed(c ? <A/> : <B/>).m()`: the conditional is one node to modify, a `Group`.
        let receiver = if receiver.starts_with("if ") {
            format!("{} {{\n{receiver}\n}}", self.name("Group", at))
        } else {
            receiver
        };
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
                        Argument::SpreadElement(s) => format!("..{}", self.expr(&s.argument)),
                        // `.presented([open, setOpen])`: the pair is a binding.
                        Argument::ArrayExpression(array) if self.is_binding_pair(array) => {
                            self.binding(array)
                        }
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
        // A spread child (`...xs.map(…)`) is a `for` line, which only a builder takes.
        // A spread of a name (`Text(...runs)`) stays a spread argument.
        let spread = children.iter().any(|a| {
            matches!(a, Argument::SpreadElement(s) if matches!(
                s.argument.without_parentheses(),
                Expression::CallExpression(_)
                    | Expression::ConditionalExpression(_)
                    | Expression::LogicalExpression(_)
                    | Expression::ArrayExpression(_)
            ))
        });
        let builder =
            !children.is_empty() && (children.len() >= 2 || conditional || spread || STACKS.contains(&ctor));
        let leading = if builder { &args[..split] } else { &args[..] };
        let mut values = Vec::new();
        for arg in leading {
            let note = self.note(arg.span().start);
            let value = match arg {
                Argument::SpreadElement(s) => self.spread_child(&s.argument),
                // `[value, setValue]` a node takes; a two-item list of values (options) is a list.
                Argument::ArrayExpression(array)
                    if array.elements.len() == 2
                        && !array.elements.iter().any(|e| {
                            e.is_spread()
                                || matches!(
                                    e.as_expression().map(|e| e.without_parentheses()),
                                    Some(Expression::ObjectExpression(_))
                                )
                        }) =>
                {
                    self.binding(array)
                }
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
        // `...(c ? [a, b] : [d])`, `...[a, b]`: the items are siblings, so they splice.
        let literal = |e: &Expression| matches!(e.without_parentheses(), Expression::ArrayExpression(a) if a.elements.iter().all(|x| x.as_expression().is_some()));
        match list.without_parentheses() {
            Expression::ConditionalExpression(c) if literal(&c.consequent) && literal(&c.alternate) => {
                let empty = |e: &Expression| matches!(e.without_parentheses(), Expression::ArrayExpression(a) if a.elements.is_empty());
                let then = |tr: &mut Self| tr.splice(&c.consequent);
                let otherwise = |tr: &mut Self| tr.splice(&c.alternate);
                return if empty(&c.alternate) {
                    self.child_if(&c.test, c.consequent.span(), then, None::<fn(&mut Self) -> String>)
                } else {
                    self.child_if(&c.test, c.consequent.span(), then, Some(otherwise))
                };
            }
            Expression::LogicalExpression(l) if l.operator == LogicalOperator::And && literal(&l.right) => {
                let then = |tr: &mut Self| tr.splice(&l.right);
                return self.child_if(&l.left, l.right.span(), then, None::<fn(&mut Self) -> String>);
            }
            e if literal(e) => return self.splice(e),
            _ => {}
        }
        self.review("spread children are one `[View]` child: one keyed slot (+1 fiber), not siblings".into());
        match list.without_parentheses() {
            Expression::CallExpression(call) if is_map(call) => self.child(list),
            other => self.expr(other),
        }
    }

    /// Whether `[a, b]` reads as a binding pair: `b` is a function or a state's setter.
    fn is_binding_pair(&self, array: &oxc_ast::ast::ArrayExpression) -> bool {
        array.elements.len() == 2
            && match array.elements[1].as_expression().map(|e| e.without_parentheses()) {
                Some(Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_)) => true,
                Some(Expression::Identifier(id)) => {
                    self.scope.setters.contains_key(id.name.as_str())
                        // `[audience, onAudienceChange]`: a handler named as one (`onX`, `setX`).
                        || handler_name(&id.name)
                }
                _ => false,
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
        let set = match set {
            // `[open, () => setOpen(false)]`: the setter ignores the value it is given.
            Expression::ArrowFunctionExpression(arrow) if arrow.params.items.is_empty() => {
                let text = self.closure(arrow);
                match text.strip_prefix('{') {
                    Some(rest) => format!("{{ _ in{rest}"),
                    None => text,
                }
            }
            other => self.expr(other),
        };
        format!("Binding(get: {get}, set: {set})")
    }

    /// A builder line: a conditional child is an `if`, a mapped list a `for`.
    pub fn child(&mut self, e: &Expression) -> String {
        match e {
            Expression::ParenthesizedExpression(p) => self.child(&p.expression),
            Expression::ConditionalExpression(c) if is_nothing(&c.alternate) => {
                let then = |tr: &mut Self| tr.child(&c.consequent);
                self.child_if(&c.test, c.consequent.span(), then, None::<fn(&mut Self) -> String>)
            }
            Expression::ConditionalExpression(c) if is_nothing(&c.consequent) => {
                let test = self.test_negated(&c.test);
                let otherwise = self.child(&c.alternate);
                format!("if {test} {{\n{otherwise}\n}}")
            }
            Expression::ConditionalExpression(c)
                if self.is_view(&c.consequent)
                    || self.is_view(&c.alternate)
                    || is_mapped(&c.consequent)
                    || is_mapped(&c.alternate) =>
            {
                let then = |tr: &mut Self| tr.child(&c.consequent);
                let otherwise = |tr: &mut Self| tr.child(&c.alternate);
                self.child_if(&c.test, c.consequent.span(), then, Some(otherwise))
            }
            Expression::LogicalExpression(l)
                if l.operator == LogicalOperator::And && self.is_view(&l.right) =>
            {
                let then = |tr: &mut Self| tr.child(&l.right);
                self.child_if(&l.left, l.right.span(), then, None::<fn(&mut Self) -> String>)
            }
            // `c && xs?.map((x) => …)`: the rows of an optional list, none when it is `none`.
            Expression::LogicalExpression(l)
                if l.operator == LogicalOperator::And
                    && matches!(l.right.without_parentheses(), Expression::ChainExpression(c)
                        if matches!(&c.expression, oxc_ast::ast::ChainElement::CallExpression(call) if is_map(call))) =>
            {
                let then = |tr: &mut Self| {
                    let list = tr.head_expr(&l.right);
                    format!("for row in {list} ?? [] {{ row }}")
                };
                self.child_if(&l.left, l.right.span(), then, None::<fn(&mut Self) -> String>)
            }
            Expression::CallExpression(call) if is_map(call) => {
                let Some(Argument::ArrowFunctionExpression(arrow)) = call.arguments.first() else {
                    unreachable!()
                };
                let Expression::StaticMemberExpression(member) = &call.callee else { unreachable!() };
                if let Some((_, x, i, arrow)) = indexed_callback(call, &["map"]) {
                    let list = self.head_expr(&member.object);
                    let (x, i) = (self.bind(x, arrow.span), self.bind(i, arrow.span));
                    let body = self.arrow_view_lines(arrow);
                    return format!("for ({i}, {x}) in {list}.enumerated() {{\n{body}\n}}");
                }
                match (arrow.params.items.as_slice(), arrow.params.rest.is_none()) {
                    ([param], true) if matches!(param.pattern, BindingPattern::BindingIdentifier(_)) => {
                        let BindingPattern::BindingIdentifier(id) = &param.pattern else { unreachable!() };
                        let list = self.head_expr(&member.object);
                        let item = self.bind(&id.name, id.span);
                        // `xs.map((x: T) => …)`: TS reads each element as `T` (a wider record,
                        // `count?: number` among its fields), and so does the loop.
                        let typed = match &param.type_annotation {
                            Some(ann)
                                if matches!(ann.type_annotation, oxc_ast::ast::TSType::TSTypeLiteral(_)) =>
                            {
                                format!("let {item}: {} = {item}\n", self.ty(&ann.type_annotation))
                            }
                            _ => String::new(),
                        };
                        let body = self.arrow_view_lines(arrow);
                        format!("for {item} in {list} {{\n{typed}{body}\n}}")
                    }
                    // `xs.map(({ a, b }) => …)`: each item, destructured first.
                    ([param], true) if let BindingPattern::ObjectPattern(pattern) = &param.pattern => {
                        let list = self.head_expr(&member.object);
                        let destructure = self.record_pattern(pattern);
                        let body = self.arrow_view_lines(arrow);
                        format!("for item in {list} {{\nlet {destructure} = item\n{body}\n}}")
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
            // `Embed(xs.map(x => …))` among children: each view of the list, a `for`.
            Expression::CallExpression(call)
                if matches!(&call.callee, Expression::Identifier(id) if self.is_lang(&id.name, "Embed"))
                    && call.arguments.len() == 1
                    && call.arguments[0].as_expression().is_some_and(|a| {
                        matches!(a.without_parentheses(), Expression::CallExpression(m) if is_map(m))
                            && self.is_view(a)
                    }) =>
            {
                self.child(call.arguments[0].to_expression())
            }
            _ => self.expr(e),
        }
    }

    /// A list literal's items as sibling builder lines.
    fn splice(&mut self, e: &Expression) -> String {
        let Expression::ArrayExpression(a) = e.without_parentheses() else { return self.child(e) };
        let lines: Vec<String> =
            a.elements.iter().filter_map(|x| x.as_expression()).map(|x| self.child(x)).collect();
        lines.join("\n")
    }

    /// A conditional builder line. An optional `String` read in the branch is
    /// unwrapped and tested: `if let s = s { if !s.isEmpty { A } else { B } } else { B }`.
    fn child_if(
        &mut self,
        test: &Expression,
        branch: Span,
        then: impl Fn(&mut Self) -> String,
        otherwise: Option<impl Fn(&mut Self) -> String>,
    ) -> String {
        let parts = self.test_parts(test, true);
        let (bound, then) = self.unwrapped_branch(&parts, branch, then);
        let otherwise = otherwise.map(|o| o(self));
        let tail = |b: &Option<String>| match b {
            Some(b) if b.starts_with("if ") => format!(" else {b}"),
            Some(b) => format!(" else {{\n{b}\n}}"),
            None => String::new(),
        };
        match parts {
            Test::Plain(test) => format!("if {test} {{\n{then}\n}}{}", tail(&otherwise)),
            Test::Bind(name, None) => {
                let bound = bound.unwrap_or_else(|| name.clone());
                format!("if let {bound} = {name} {{\n{then}\n}}{}", tail(&otherwise))
            }
            Test::Bind(name, Some(inner)) => {
                let t = tail(&otherwise);
                let (bound, inner) = match bound {
                    Some(b) => (b.clone(), inner.replacen(&name, &b, 1)),
                    None => (name.clone(), inner),
                };
                format!("if let {bound} = {name} {{\nif {inner} {{\n{then}\n}}{t}\n}}{t}")
            }
        }
    }

    /// A branch under `if let x = x` that writes `x` (its setter, `x = …`, `x.current = …`):
    /// the unwrapped value is `xValue`, since `x` there would be the immutable binding, and
    /// each write in the branch goes to `x` itself (TS's narrowed reads, its writes to the state).
    pub fn unwrapped_branch(
        &mut self,
        parts: &Test,
        branch: Span,
        then: impl FnOnce(&mut Self) -> String,
    ) -> (Option<String>, String) {
        let name = match parts {
            Test::Bind(name, _) if self.writes_in(branch, name) => name.clone(),
            _ => return (None, then(self)),
        };
        let bound = format!("{name}Value");
        let previous = self.scope.renames.insert(name.clone(), bound.clone());
        let text = then(self);
        match previous {
            Some(p) => self.scope.renames.insert(name.clone(), p),
            None => self.scope.renames.remove(&name),
        };
        let text = redirect_writes(&text, &bound, &name);
        (Some(bound), text)
    }

    /// Whether the TS text in `span` writes `name`: a call of its state's setter, `name = …`
    /// or `name.current = …`.
    pub fn writes_in(&self, span: Span, name: &str) -> bool {
        let setters: Vec<String> =
            self.scope.setters.iter().filter(|(_, s)| s.state == name).map(|(k, _)| k.clone()).collect();
        writes_name(&self.src[span.start as usize..span.end as usize], name, &setters)
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
        let head = std::mem::replace(&mut self.head, false);
        // An async closure TS calls: a rejection of what it awaits rejects its promise,
        // as TS's did (`let page = await api.list()?`).
        let ts = std::mem::replace(&mut self.ts_args, false);
        let propagate = std::mem::replace(&mut self.propagate, ts && arrow.r#async);
        let returning = std::mem::replace(&mut self.try_return, false);
        let in_do = std::mem::replace(&mut self.in_do, false);
        self.closures += 1;
        let text = self.closure_inner(arrow);
        self.closures -= 1;
        self.in_do = in_do;
        self.ts_args = ts;
        self.head = head;
        self.propagate = propagate;
        self.try_return = returning;
        text
    }

    /// A closure's body lines, its parameters bound by the caller.
    pub fn closure_body(&mut self, arrow: &ArrowFunctionExpression) -> String {
        let saved = self.scope.clone();
        let propagate = std::mem::replace(&mut self.propagate, false);
        let returning = std::mem::replace(&mut self.try_return, false);
        let in_do = std::mem::replace(&mut self.in_do, false);
        let pending = std::mem::replace(&mut self.pending_loop_return, false);
        let loop_return = std::mem::replace(&mut self.loop_return, pending);
        self.closures += 1;
        let body = match arrow.get_expression() {
            Some(e) => self.stmt_expr(e),
            None => {
                self.block_stmts(crate::view::arrow_statements(arrow), crate::view::arrow_end(arrow), false)
            }
        };
        self.closures -= 1;
        self.loop_return = loop_return;
        self.in_do = in_do;
        self.propagate = propagate;
        self.try_return = returning;
        self.scope = saved;
        body
    }

    fn closure_inner(&mut self, arrow: &ArrowFunctionExpression) -> String {
        let saved = self.scope.clone();
        let loop_return = std::mem::replace(&mut self.loop_return, false);
        let (params, prelude) = self.closure_params(&arrow.params);
        let body = match arrow.get_expression() {
            Some(e) => self.stmt_expr(e),
            None => {
                self.block_stmts(crate::view::arrow_statements(arrow), crate::view::arrow_end(arrow), false)
            }
        };
        self.scope = saved;
        self.loop_return = loop_return;
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
            // `(a, b?: T) =>`: Swift's closures take no defaults, so `b` is a `T?` its callers pass
            // (`crate::typed` writes `none` where a call leaves it out).
            let ty = param.type_annotation.as_ref().map(|t| {
                let ty = self.ty(&t.type_annotation);
                if param.optional && param.initializer.is_none() {
                    format!(": {}", crate::module::optional_ty(&ty))
                } else {
                    format!(": {ty}")
                }
            });
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
                // `([key, value]) => …` (an entry): the pair is a tuple.
                BindingPattern::ArrayPattern(pattern)
                    if pattern.rest.is_none()
                        && pattern.elements.len() >= 2
                        && pattern.elements.iter().all(|e| {
                            e.as_ref().is_none_or(|e| matches!(e, BindingPattern::BindingIdentifier(_)))
                        }) =>
                {
                    let name = if several { format!("arg{index}") } else { "arg".to_string() };
                    let names: Vec<String> = pattern
                        .elements
                        .iter()
                        .map(|e| match e {
                            Some(BindingPattern::BindingIdentifier(id)) => self.bind(&id.name, id.span),
                            _ => "_".to_string(),
                        })
                        .collect();
                    prelude.push(format!("let ({}) = {name}", names.join(", ")));
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
            out.push(self.rest_param(rest));
        }
        (out.join(", "), prelude)
    }

    /// `...runs: T[]` as the rest parameter `..runs: [T]`.
    pub fn rest_param(&mut self, rest: &oxc_ast::ast::FormalParameterRest) -> String {
        let BindingPattern::BindingIdentifier(id) = &rest.rest.argument else {
            return self.refuse("param:rest", "a rest parameter with a pattern", rest.span);
        };
        let Some(t) = &rest.type_annotation else {
            return self.refuse("param:rest", "an untyped rest parameter", rest.span);
        };
        let ty = self.ty(&t.type_annotation);
        if !ty.starts_with('[') {
            return self.refuse("param:rest", "a rest parameter that is not a list", rest.span);
        }
        let name = self.bind(&id.name, id.span);
        format!("..{name}: {ty}")
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

/// Whether `text` is a name or a member chain, so `!` binds to all of it.
pub fn is_postfix_text(text: &str) -> bool {
    !text.is_empty() && text.chars().all(|c| c.is_alphanumeric() || matches!(c, '_' | '.' | '?' | '$'))
}

/// Whether an expression is a `Bool` by its shape (a comparison, a negation, a literal).
fn is_boolean_shaped(e: &Expression) -> bool {
    match e.without_parentheses() {
        Expression::BooleanLiteral(_) => true,
        Expression::BinaryExpression(b) => b.operator.is_equality() || b.operator.is_compare(),
        Expression::UnaryExpression(u) => u.operator == UnaryOperator::LogicalNot,
        _ => false,
    }
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

/// `xs.m((x, i) => …)` for a method in `methods`: the member, the item and index
/// names, and the closure.
pub fn indexed_callback<'b, 'a>(
    call: &'b CallExpression<'a>,
    methods: &[&str],
) -> Option<(&'b oxc_ast::ast::StaticMemberExpression<'a>, &'b str, &'b str, &'b ArrowFunctionExpression<'a>)>
{
    let Expression::StaticMemberExpression(m) = &call.callee else { return None };
    if !methods.contains(&m.property.name.as_str()) || m.optional {
        return None;
    }
    let [Argument::ArrowFunctionExpression(arrow)] = call.arguments.as_slice() else { return None };
    match arrow.params.items.as_slice() {
        [x, i] if arrow.params.rest.is_none() => match (&x.pattern, &i.pattern) {
            (BindingPattern::BindingIdentifier(x), BindingPattern::BindingIdentifier(i)) => {
                Some((m, x.name.as_str(), i.name.as_str(), arrow))
            }
            _ => None,
        },
        _ => None,
    }
}

/// `Array.from({ length: n }, …)`'s `n`.
pub fn array_from_length<'b, 'a>(call: &'b CallExpression<'a>) -> Option<&'b Expression<'a>> {
    let Some(Argument::ObjectExpression(o)) = call.arguments.first() else { return None };
    let [ObjectPropertyKind::ObjectProperty(p)] = o.properties.as_slice() else { return None };
    (!p.computed && p.key.static_name().is_some_and(|k| k == "length") && call.arguments.len() <= 2)
        .then_some(&p.value)
}

/// An `Array.from` callback's index parameter, when it never reads the item (`undefined`):
/// `Some(None)` for none (`() => …`, `(_) => …`), `Some(Some(i))` for `(_, i) => …`.
fn unused_item<'b>(arrow: &'b ArrowFunctionExpression) -> Option<Option<(&'b str, Span)>> {
    if arrow.r#async || arrow.params.rest.is_some() {
        return None;
    }
    let name = |p: &'b oxc_ast::ast::FormalParameter| match &p.pattern {
        BindingPattern::BindingIdentifier(id) => Some((id.name.as_str(), id.span)),
        _ => None,
    };
    match arrow.params.items.as_slice() {
        [] => Some(None),
        [x] => name(x).filter(|(x, _)| x.starts_with('_')).map(|_| None),
        [x, i] => name(x).filter(|(x, _)| x.starts_with('_')).and(name(i)).map(Some),
        _ => None,
    }
}

pub fn is_map(call: &CallExpression) -> bool {
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

/// `a.b.c`: a read of stored members, with no call, unwrap or subscript (read again for free).
fn is_member_path(text: &str) -> bool {
    text.contains('.')
        && text.split('.').all(|part| {
            part.starts_with(|c: char| c.is_alphabetic() || c == '_')
                && part.chars().all(|c| c.is_alphanumeric() || c == '_')
        })
}

pub fn quote(text: &str) -> String {
    format!("\"{}\"", escape(text))
}

fn short(text: &str) -> String {
    let line = text.lines().next().unwrap_or_default();
    if line.len() > 40 { format!("{}…", &line[..line.floor_char_boundary(40)]) } else { line.to_string() }
}

/// Whether a regex (without `m`) matches a string once at most: anchored at its
/// start, or at its end by a last atom that cannot match empty (`\/+$`, not `a*$`).
fn matches_once(pattern: &str) -> bool {
    if pattern.starts_with('^') {
        return true;
    }
    let Some(body) = pattern.strip_suffix('$') else { return false };
    !body.is_empty() && !body.ends_with('\\') && !body.contains('|') && !body.ends_with(['*', '?', ')', '}'])
}

/// `text` without one pair of parentheses around all of it (`(a || b)` → `a || b`).
pub fn strip_parens(text: &str) -> &str {
    let Some(inner) = text.strip_prefix('(').and_then(|t| t.strip_suffix(')')) else { return text };
    let mut depth = 0i32;
    for c in inner.chars() {
        match c {
            '(' => depth += 1,
            ')' => {
                depth -= 1;
                if depth < 0 {
                    return text;
                }
            }
            _ => {}
        }
    }
    if depth == 0 { inner } else { text }
}

/// `xs[i]` read by an index (a number, or arithmetic, or a name that says it is one):
/// its list and index. A key read (`labels[kind]`) is not one.
pub fn index_read<'b, 'a>(e: &'b Expression<'a>) -> Option<(&'b Expression<'a>, &'b Expression<'a>)> {
    let Expression::ComputedMemberExpression(m) = e.without_parentheses() else { return None };
    if m.optional {
        return None;
    }
    let indexish = match m.expression.without_parentheses() {
        Expression::NumericLiteral(_) => true,
        Expression::BinaryExpression(b) => {
            matches!(b.operator, BinaryOperator::Addition | BinaryOperator::Subtraction)
                && matches!(b.right.without_parentheses(), Expression::NumericLiteral(_))
        }
        Expression::Identifier(id) => {
            let n = id.name.as_str();
            n == "i" || n == "j" || n == "idx" || n == "index" || n.ends_with("Index") || n.ends_with("Idx")
        }
        _ => false,
    };
    indexish.then_some((&m.object, &m.expression))
}

/// `xs.map(…)` (a mapped list drawn as children).
fn is_mapped(e: &Expression) -> bool {
    matches!(e.without_parentheses(), Expression::CallExpression(call) if is_map(call))
}

/// `text` with each assignment to `from` (`from = …`, `from += …`) written to `to`: `from` is
/// an immutable binding, so a write of it can only mean `to`.
fn redirect_writes(text: &str, from: &str, to: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut rest = text;
    while let Some(at) = rest.find(from) {
        let before = rest[..at].chars().next_back();
        let after = &rest[at + from.len()..];
        let word = before.is_none_or(|c| !(c.is_alphanumeric() || c == '_' || c == '.'))
            && after.chars().next().is_none_or(|c| !(c.is_alphanumeric() || c == '_'));
        let op = after.trim_start();
        let assigns = ["=", "+=", "-=", "*="].iter().any(|o| op.starts_with(o))
            && !op.starts_with("==")
            && !op.starts_with("=>");
        out.push_str(&rest[..at]);
        out.push_str(if word && assigns { to } else { from });
        rest = after;
    }
    out.push_str(rest);
    out
}

/// Whether TS `code` (an expression or a statement) writes `name`: `name = …`, `name.current = …`,
/// `name++`, or a call of one of `setters`.
fn writes_name(code: &str, name: &str, setters: &[String]) -> bool {
    use oxc_ast::ast::{AssignmentTarget, SimpleAssignmentTarget};
    use oxc_ast_visit::Visit;
    struct Finder<'n> {
        name: &'n str,
        setters: &'n [String],
        found: bool,
    }
    impl Finder<'_> {
        fn target(&mut self, t: &SimpleAssignmentTarget) {
            match t {
                SimpleAssignmentTarget::AssignmentTargetIdentifier(id) if id.name == self.name => {
                    self.found = true
                }
                SimpleAssignmentTarget::StaticMemberExpression(m)
                    if m.property.name == "current"
                        && matches!(&m.object, Expression::Identifier(o) if o.name == self.name) =>
                {
                    self.found = true
                }
                _ => {}
            }
        }
    }
    impl<'a> Visit<'a> for Finder<'_> {
        fn visit_assignment_expression(&mut self, a: &oxc_ast::ast::AssignmentExpression<'a>) {
            if let Some(t) = a.left.as_simple_assignment_target() {
                self.target(t);
            } else if let AssignmentTarget::AssignmentTargetIdentifier(id) = &a.left
                && id.name == self.name
            {
                self.found = true;
            }
            oxc_ast_visit::walk::walk_assignment_expression(self, a);
        }
        fn visit_update_expression(&mut self, u: &oxc_ast::ast::UpdateExpression<'a>) {
            self.target(&u.argument);
            oxc_ast_visit::walk::walk_update_expression(self, u);
        }
        fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
            if matches!(&call.callee, Expression::Identifier(id) if self.setters.iter().any(|s| s == id.name.as_str()))
            {
                self.found = true;
            }
            oxc_ast_visit::walk::walk_call_expression(self, call);
        }
    }
    if !code.contains(name) && !setters.iter().any(|s| code.contains(s.as_str())) {
        return false;
    }
    let allocator = oxc_allocator::Allocator::default();
    let wrapped = format!("({code})");
    let mut parsed = oxc_parser::Parser::new(&allocator, &wrapped, oxc_span::SourceType::tsx()).parse();
    if !parsed.diagnostics.is_empty() {
        parsed = oxc_parser::Parser::new(&allocator, code, oxc_span::SourceType::tsx()).parse();
    }
    let mut finder = Finder { name, setters, found: false };
    finder.visit_program(&parsed.program);
    finder.found
}

/// A name or a chain of member reads (`a`, `a.b`, `a?.b.c`): reading it twice reads the same.
fn is_member_chain(e: &Expression) -> bool {
    match e.without_parentheses() {
        Expression::Identifier(_) => true,
        Expression::StaticMemberExpression(m) => is_member_chain(&m.object),
        Expression::ChainExpression(c) => match &c.expression {
            oxc_ast::ast::ChainElement::StaticMemberExpression(m) => is_member_chain(&m.object),
            _ => false,
        },
        _ => false,
    }
}

/// `onChange`, `onAudienceChange`, `setValue`: a name React code gives a value's handler.
fn handler_name(name: &str) -> bool {
    ["on", "set"].iter().any(|prefix| {
        name.strip_prefix(prefix).and_then(|rest| rest.chars().next()).is_some_and(|c| c.is_ascii_uppercase())
    })
}

/// `x?.trim()`, `a?.b.toLowerCase()`: a string method's result through an optional link, a
/// `String?` whatever `x` is (the method names a string).
fn optional_string_call(e: &Expression) -> bool {
    const STRING_METHODS: &[&str] =
        &["trim", "trimStart", "trimEnd", "toLowerCase", "toUpperCase", "normalize"];
    let call = match e.without_parentheses() {
        Expression::ChainExpression(c) => match &c.expression {
            oxc_ast::ast::ChainElement::CallExpression(call) => call,
            _ => return false,
        },
        _ => return false,
    };
    matches!(&call.callee, Expression::StaticMemberExpression(m)
        if STRING_METHODS.contains(&m.property.name.as_str()) && call.arguments.is_empty())
}
