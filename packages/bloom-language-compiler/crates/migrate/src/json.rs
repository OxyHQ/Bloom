//! TS's `unknown` as the stdlib's `JSONValue` (`Foreign<"unknown">`), narrowed the Swift way:
//! by its lenient reads (`stdlib/Bloom/JSON.bloom`), each `none` where the value is not of that
//! kind.
//!
//! | TS (`x: unknown`) | Bloom 2.0 |
//! |---|---|
//! | `if (typeof x === 'string') …` | `if let x = x.string { … }` |
//! | `typeof x === 'number' ? x : d` | `x.number ?? d` |
//! | `typeof x === 'string' && t ? a : b` | `if let x = x.string { t ? a : b } else { b }` |
//! | `const m = e; if (!Array.isArray(m)) return` | `guard let m = e?.array else { return }` |
//! | `Array.isArray(x) ? a : b` | `if let x = x.array { a } else { b }` |
//! | `if (!x \|\| typeof x !== 'object') continue; const r = x as Record<string, unknown>` | `guard let r = x.object else { continue }` |
//! | `(x as { k?: unknown }).k`, `r.k` of a `Record<string, unknown>` | `x["k"]`, `r["k"]` (a `JSONValue?`) |
//! | `r.k === 'video'` | `r["k"]?.string == "video"` |
//! | `xs.filter((v): v is string => typeof v === 'string')` of a JSON array | `xs.compactMap { $0.string }` |

use oxc_ast::ast::*;
use oxc_span::GetSpan;
use oxc_syntax::operator::{BinaryOperator, LogicalOperator, UnaryOperator};

/// Whether `text` is a name, a member chain or a subscript of one (`x["k"]?.a`), so a read binds
/// to all of it.
fn is_postfix_text(text: &str) -> bool {
    crate::expr::is_postfix_text(text)
        || (!text.starts_with('[')
            && !text.contains(' ')
            && text.chars().all(|c| c.is_alphanumeric() || matches!(c, '_' | '.' | '?' | '$' | '[' | ']' | '"' | '-')))
}
use crate::module::Tr;

/// TS's `unknown`, as the codemod writes its type.
pub const VALUE: &str = "Foreign<\"unknown\">";
const OPTIONAL: &str = "Foreign<\"unknown\">?";
const OBJECT: &str = "[String: Foreign<\"unknown\">]";
const ARRAY: &str = "[Foreign<\"unknown\">]";

/// What a JSON expression is.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Json {
    /// A `JSONValue` (TS's `unknown`, which holds `undefined` too).
    Value,
    /// A `JSONValue?` (a member read).
    Optional,
    /// A `[String: JSONValue]` (TS's `Record<string, unknown>`).
    Object,
    /// A `[JSONValue]` (a JSON value `Array.isArray` narrowed).
    Array,
}

impl Json {
    pub fn ty(self) -> &'static str {
        match self {
            Json::Value => VALUE,
            Json::Optional => OPTIONAL,
            Json::Object => OBJECT,
            Json::Array => ARRAY,
        }
    }

    fn is_value(self) -> bool {
        matches!(self, Json::Value | Json::Optional)
    }
}

/// `typeof x === "string"`'s kind as the read that narrows to it.
fn kind_read(kind: &str) -> Option<&'static str> {
    match kind {
        "string" => Some("string"),
        "number" => Some("number"),
        "boolean" => Some("bool"),
        _ => None,
    }
}

/// `typeof x === "k"` (or `"k" === typeof x`): `x` and `k`.
fn typeof_test<'b, 'a>(e: &'b Expression<'a>) -> Option<(&'b Expression<'a>, &'b str)> {
    let Expression::BinaryExpression(b) = e.without_parentheses() else { return None };
    if !matches!(b.operator, BinaryOperator::StrictEquality | BinaryOperator::Equality) {
        return None;
    }
    let (t, k) = match (b.left.without_parentheses(), b.right.without_parentheses()) {
        (Expression::UnaryExpression(u), Expression::StringLiteral(k))
        | (Expression::StringLiteral(k), Expression::UnaryExpression(u))
            if u.operator == UnaryOperator::Typeof =>
        {
            (&u.argument, k)
        }
        _ => return None,
    };
    Some((t, k.value.as_str().unwrap_or_default()))
}

/// `Array.isArray(x)`'s `x`.
fn is_array_test<'b, 'a>(e: &'b Expression<'a>) -> Option<&'b Expression<'a>> {
    let Expression::CallExpression(call) = e.without_parentheses() else { return None };
    let Expression::StaticMemberExpression(m) = &call.callee else { return None };
    let Expression::Identifier(object) = &m.object else { return None };
    if object.name != "Array" || m.property.name != "isArray" {
        return None;
    }
    match call.arguments.as_slice() {
        [a] => a.as_expression(),
        _ => None,
    }
}

/// `!x || typeof x !== "object"` (either order, or `x === null ||`): `x`.
fn not_object_test<'b, 'a>(e: &'b Expression<'a>, src: &str) -> Option<&'b Expression<'a>> {
    let Expression::LogicalExpression(l) = e.without_parentheses() else { return None };
    if l.operator != LogicalOperator::Or {
        return None;
    }
    let text = |e: &Expression| src[e.span().start as usize..e.span().end as usize].to_string();
    let typeof_not_object = |e: &'b Expression<'a>| -> Option<&'b Expression<'a>> {
        let Expression::BinaryExpression(b) = e.without_parentheses() else { return None };
        if !matches!(b.operator, BinaryOperator::StrictInequality | BinaryOperator::Inequality) {
            return None;
        }
        match (b.left.without_parentheses(), b.right.without_parentheses()) {
            (Expression::UnaryExpression(u), Expression::StringLiteral(k))
                if u.operator == UnaryOperator::Typeof && k.value.as_str() == Some("object") =>
            {
                Some(&u.argument)
            }
            _ => None,
        }
    };
    let guard_of = |e: &Expression, x: &str| match e.without_parentheses() {
        Expression::UnaryExpression(n) if n.operator == UnaryOperator::LogicalNot => {
            text(n.argument.without_parentheses()) == x
        }
        Expression::BinaryExpression(b)
            if matches!(b.operator, BinaryOperator::StrictEquality | BinaryOperator::Equality) =>
        {
            matches!(b.right.without_parentheses(), Expression::NullLiteral(_))
                && text(b.left.without_parentheses()) == x
        }
        _ => false,
    };
    if let Some(x) = typeof_not_object(&l.right)
        && guard_of(&l.left, &text(x))
    {
        return Some(x);
    }
    if let Some(x) = typeof_not_object(&l.left)
        && guard_of(&l.right, &text(x))
    {
        return Some(x);
    }
    None
}

/// Whether a cast's type says the value is an object of unknown fields: `{ k?: unknown }`, or
/// `Record<string, unknown>`.
fn unknown_object_type(t: &TSType, property: Option<&str>) -> bool {
    match t {
        TSType::TSTypeLiteral(literal) => literal.members.iter().any(|m| match m {
            TSSignature::TSPropertySignature(p) => {
                let named = match &p.key {
                    PropertyKey::StaticIdentifier(id) => property.is_none_or(|k| id.name == k),
                    PropertyKey::StringLiteral(s) => property.is_none_or(|k| s.value == k),
                    _ => false,
                };
                named
                    && p.type_annotation
                        .as_ref()
                        .is_some_and(|a| matches!(a.type_annotation, TSType::TSUnknownKeyword(_)))
            }
            _ => false,
        }),
        TSType::TSTypeReference(r) => record_of_unknown(r),
        _ => false,
    }
}

fn record_of_unknown(r: &TSTypeReference) -> bool {
    matches!(&r.type_name, TSTypeName::IdentifierReference(id) if id.name == "Record")
        && r.type_arguments.as_ref().is_some_and(|a| {
            matches!(a.params.as_slice(), [TSType::TSStringKeyword(_), TSType::TSUnknownKeyword(_)])
        })
}

/// A statement that leaves the block (`return`, `continue`, `break`, `throw`).
fn exits(statement: &Statement) -> bool {
    match statement {
        Statement::ReturnStatement(_)
        | Statement::ContinueStatement(_)
        | Statement::BreakStatement(_)
        | Statement::ThrowStatement(_) => true,
        Statement::BlockStatement(b) => b.body.last().is_some_and(exits),
        _ => false,
    }
}

impl Tr<'_> {
    /// What `e` is, where it is a JSON value the codemod typed.
    pub fn json_kind(&self, e: &Expression) -> Option<Json> {
        match e.without_parentheses() {
            Expression::Identifier(_) => match self.declared_type(e)?.as_str() {
                VALUE => Some(Json::Value),
                OPTIONAL => Some(Json::Optional),
                OBJECT => Some(Json::Object),
                ARRAY => Some(Json::Array),
                _ => None,
            },
            Expression::StaticMemberExpression(m) => {
                self.json_member_of(&m.object, &m.property.name).map(|_| Json::Optional)
            }
            Expression::ChainExpression(c) => match &c.expression {
                ChainElement::StaticMemberExpression(m) => {
                    self.json_member_of(&m.object, &m.property.name).map(|_| Json::Optional)
                }
                ChainElement::ComputedMemberExpression(m) => {
                    (self.json_kind(&m.object) == Some(Json::Object)).then_some(Json::Optional)
                }
                _ => None,
            },
            Expression::ComputedMemberExpression(m) => {
                (self.json_kind(&m.object) == Some(Json::Object)).then_some(Json::Optional)
            }
            _ => None,
        }
    }

    /// `object.property` read off a JSON value: the value read and what it is (a cast of a
    /// `JSONValue` to an object type, or a `[String: JSONValue]`).
    fn json_member_of<'b, 'a>(&self, object: &'b Expression<'a>, property: &str) -> Option<(&'b Expression<'a>, Json)> {
        match object.without_parentheses() {
            Expression::TSAsExpression(a) if unknown_object_type(&a.type_annotation, Some(property)) => {
                let kind = self.json_kind(&a.expression).filter(|k| k.is_value())?;
                Some((&a.expression, kind))
            }
            e => {
                let kind = self.json_kind(e).filter(|k| *k == Json::Object)?;
                Some((e, kind))
            }
        }
    }

    /// `(x as { k?: unknown }).k` and `r.k` of a `[String: JSONValue]`: `x["k"]`, `r["k"]`.
    pub fn json_member(&mut self, object: &Expression, property: &str, optional: bool) -> Option<String> {
        let (value, kind) = self.json_member_of(object, property)?;
        let text = self.expr(value);
        let text = if is_postfix_text(&text) { text } else { format!("({text})") };
        let q = if kind == Json::Optional || (optional && kind != Json::Object) { "?" } else { "" };
        Some(format!("{text}{q}[{}]", crate::expr::quote(property)))
    }

    /// `x` as a read of `.k` (`x.string`, `x?.string` for an optional).
    fn json_as(&mut self, x: &Expression, kind: Json, read: &str) -> String {
        let text = self.expr(x);
        let text = if is_postfix_text(&text) { text } else { format!("({text})") };
        let q = if kind == Json::Optional { "?" } else { "" };
        format!("{text}{q}.{read}")
    }

    /// The JSON forms of a binary test: `typeof x === "string"` on a JSON value is whether its
    /// `.string` is there; `r.k === "video"` compares its string.
    pub fn json_binary(&mut self, b: &BinaryExpression) -> Option<String> {
        let eq = matches!(b.operator, BinaryOperator::StrictEquality | BinaryOperator::Equality);
        let ne = matches!(b.operator, BinaryOperator::StrictInequality | BinaryOperator::Inequality);
        if !eq && !ne {
            return None;
        }
        // `typeof x === "string"`: `x.string != none`.
        let (t, lit) = match (b.left.without_parentheses(), b.right.without_parentheses()) {
            (Expression::UnaryExpression(u), Expression::StringLiteral(k))
            | (Expression::StringLiteral(k), Expression::UnaryExpression(u))
                if u.operator == UnaryOperator::Typeof =>
            {
                (Some(&u.argument), Some(k))
            }
            _ => (None, None),
        };
        if let (Some(t), Some(k)) = (t, lit)
            && let Some(kind) = self.json_kind(t).filter(|k| k.is_value())
            && let Some(read) = kind_read(k.value.as_str().unwrap_or_default())
        {
            let text = self.json_as(t, kind, read);
            return Some(format!("{text} {} none", if eq { "!=" } else { "==" }));
        }
        // `r.k === "video"`: the member's string (or number, or Boolean).
        let op = if eq { "==" } else { "!=" };
        for (value, literal) in [(&b.left, &b.right), (&b.right, &b.left)] {
            let read = match literal.without_parentheses() {
                Expression::StringLiteral(_) | Expression::TemplateLiteral(_) => "string",
                Expression::NumericLiteral(_) => "number",
                Expression::BooleanLiteral(_) => "bool",
                _ => continue,
            };
            let Some(kind) = self.json_kind(value).filter(|k| k.is_value()) else { continue };
            let text = self.json_as(value, kind, read);
            let literal = self.expr(literal);
            return Some(format!("{text} {op} {literal}"));
        }
        None
    }

    /// `Array.isArray(x)` of a JSON value: `x.array != none`.
    pub fn json_is_array(&mut self, x: &Expression) -> Option<String> {
        let kind = self.json_kind(x).filter(|k| k.is_value())?;
        Some(format!("{} != none", self.json_as(x, kind, "array")))
    }

    /// `xs.filter((v): v is string => typeof v === "string")` of a JSON array: `xs.compactMap { $0.string }`.
    pub fn json_filter(&mut self, call: &CallExpression) -> Option<String> {
        let Expression::StaticMemberExpression(m) = &call.callee else { return None };
        if m.property.name != "filter" || self.json_kind(&m.object) != Some(Json::Array) {
            return None;
        }
        let [Argument::ArrowFunctionExpression(arrow)] = call.arguments.as_slice() else { return None };
        let [param] = arrow.params.items.as_slice() else { return None };
        let BindingPattern::BindingIdentifier(id) = &param.pattern else { return None };
        let (x, kind) = typeof_test(arrow.get_expression()?)?;
        let read = kind_read(kind)?;
        if !matches!(x.without_parentheses(), Expression::Identifier(v) if v.name == id.name) {
            return None;
        }
        let list = self.expr(&m.object);
        let list = if is_postfix_text(&list) { list } else { format!("({list})") };
        Some(format!("{list}.compactMap {{ $0.{read} }}"))
    }

    /// `x`, a name, typed `ty` while `f` writes what it holds.
    fn json_scoped<T>(&mut self, x: &str, ty: &str, f: impl FnOnce(&mut Self) -> T) -> T {
        let before = self.scope.decl.insert(x.to_string(), ty.to_string());
        let out = f(self);
        match before {
            Some(b) => self.scope.decl.insert(x.to_string(), b),
            None => self.scope.decl.remove(x),
        };
        out
    }

    /// A plain name bound to a JSON value: its `.bloom` name.
    fn json_name(&mut self, x: &Expression) -> Option<(String, Json)> {
        let Expression::Identifier(id) = x.without_parentheses() else { return None };
        let kind = self.json_kind(x).filter(|k| k.is_value())?;
        let name = self.scope.renames.get(id.name.as_str()).cloned().unwrap_or_else(|| id.name.to_string());
        Some((name, kind))
    }

    /// A ternary on a JSON value's kind: `typeof x === "number" ? x : d` is `x.number ?? d`, and
    /// `Array.isArray(x) ? a : b` is `if let x = x.array { a } else { b }`.
    pub fn json_ternary(&mut self, c: &ConditionalExpression) -> Option<String> {
        let simple = |e: &Expression| {
            matches!(
                e.without_parentheses(),
                Expression::Identifier(_)
                    | Expression::StringLiteral(_)
                    | Expression::NumericLiteral(_)
                    | Expression::BooleanLiteral(_)
                    | Expression::NullLiteral(_)
                    | Expression::ArrayExpression(_)
            )
        };
        let (narrow, rest, read) = if let Some((x, k)) = typeof_test(&c.test) {
            (x, None, kind_read(k)?)
        } else if let Expression::LogicalExpression(l) = c.test.without_parentheses()
            && l.operator == LogicalOperator::And
            && let Some((x, k)) = typeof_test(&l.left)
        {
            (x, Some(&l.right), kind_read(k)?)
        } else if let Some(x) = is_array_test(&c.test) {
            (x, None, "array")
        } else {
            return None;
        };
        let (name, kind) = self.json_name(narrow)?;
        let ty = match read {
            "string" => "String",
            "number" => "Float",
            "bool" => "Bool",
            _ => ARRAY,
        };
        // `typeof x === "number" ? x : d`: `x.number ?? d`.
        if rest.is_none()
            && matches!(c.consequent.without_parentheses(), Expression::Identifier(y) if self.scope.renames.get(y.name.as_str()).map_or(y.name.as_str(), |r| r.as_str()) == name)
        {
            let read = self.json_as(narrow, kind, read);
            if crate::expr::is_nothing(&c.alternate) {
                return Some(read);
            }
            let otherwise = self.expr(&c.alternate);
            return Some(format!("{read} ?? {otherwise}"));
        }
        if rest.is_some() && !simple(&c.alternate) {
            return None;
        }
        let value = self.json_as(narrow, kind, read);
        let otherwise = self.expr(&c.alternate);
        let then = self.json_scoped(&name, ty, |tr| match rest {
            Some(rest) => {
                let test = tr.test(rest, false);
                let a = tr.expr(&c.consequent);
                format!("{test} ? {a} : {otherwise}")
            }
            None => tr.expr(&c.consequent),
        });
        Some(format!("if let {name} = {value} {{ {then} }} else {{ {otherwise} }}"))
    }

    /// The test of a `&&`/`||` that guards a JSON value's `typeof x === "object"` with `x` (or
    /// `!x`): the guard says nothing more (`.object` and `.array` are `none` for `null`).
    pub fn json_guarded_object_test<'b, 'a>(&self, l: &'b LogicalExpression<'a>) -> Option<&'b Expression<'a>> {
        let (guard, test) = (&l.left, &l.right);
        let x = match guard.without_parentheses() {
            Expression::Identifier(_) if l.operator == LogicalOperator::And => guard,
            Expression::UnaryExpression(n)
                if l.operator == LogicalOperator::Or && n.operator == UnaryOperator::LogicalNot =>
            {
                &n.argument
            }
            _ => return None,
        };
        let Expression::Identifier(x) = x.without_parentheses() else { return None };
        let Expression::BinaryExpression(b) = test.without_parentheses() else { return None };
        let (Expression::UnaryExpression(u), Expression::StringLiteral(k)) =
            (b.left.without_parentheses(), b.right.without_parentheses())
        else {
            return None;
        };
        if u.operator != UnaryOperator::Typeof || k.value.as_str() != Some("object") {
            return None;
        }
        let Expression::Identifier(y) = u.argument.without_parentheses() else { return None };
        (x.name == y.name && self.json_kind(&u.argument).is_some_and(|k| k.is_value())).then_some(test)
    }

    /// The JSON statements of a block at `statements[i]`: the text and how many statements it
    /// takes.
    ///
    /// - `if (typeof x === "string") …`: `if let x = x.string { … }`;
    /// - `const m = e; if (!Array.isArray(m)) return …`: `guard let m = e?.array else { return … }`;
    /// - `if (!x || typeof x !== "object") continue; const r = x as Record<string, unknown>`:
    ///   `guard let r = x.object else { continue }`.
    pub fn json_statement(&mut self, statements: &[Statement], i: usize) -> Option<(String, usize)> {
        let statement = &statements[i];
        let next = statements.get(i + 1);
        // `const m = e; if (!Array.isArray(m)) exit`.
        if let Statement::VariableDeclaration(v) = statement
            && v.kind == VariableDeclarationKind::Const
            && let [d] = v.declarations.as_slice()
            && let BindingPattern::BindingIdentifier(id) = &d.id
            && d.type_annotation.is_none()
            && let Some(init) = &d.init
            && let Some(kind) = self.json_kind(init).filter(|k| k.is_value())
            && let Some(Statement::IfStatement(s)) = next
            && s.alternate.is_none()
            && exits(&s.consequent)
            && let Expression::UnaryExpression(n) = s.test.without_parentheses()
            && n.operator == UnaryOperator::LogicalNot
            && let Some(Expression::Identifier(x)) = is_array_test(&n.argument).map(|e| e.without_parentheses())
            && x.name == id.name
        {
            let value = self.json_as(init, kind, "array");
            let exit = self.block_of(&s.consequent);
            self.scope.renames.remove(id.name.as_str());
            let name = self.bind(&id.name, id.span);
            self.scope.decl.insert(name.clone(), ARRAY.to_string());
            return Some((format!("guard let {name} = {value} else {{\n{exit}\n}}"), 2));
        }
        let Statement::IfStatement(s) = statement else { return None };
        // `if (!x || typeof x !== "object") exit; const r = x as Record<string, unknown>`.
        if s.alternate.is_none()
            && exits(&s.consequent)
            && let Some(x) = not_object_test(&s.test, self.src)
            && let Some((_, kind)) = self.json_name(x)
            && let Some(Statement::VariableDeclaration(v)) = next
            && v.kind == VariableDeclarationKind::Const
            && let [d] = v.declarations.as_slice()
            && let BindingPattern::BindingIdentifier(id) = &d.id
            && let Some(Expression::TSAsExpression(a)) = d.init.as_ref().map(|e| e.without_parentheses())
            && let TSType::TSTypeReference(r) = &a.type_annotation
            && record_of_unknown(r)
            && matches!((a.expression.without_parentheses(), x.without_parentheses()),
                (Expression::Identifier(a), Expression::Identifier(b)) if a.name == b.name)
        {
            let value = self.json_as(x, kind, "object");
            let exit = self.block_of(&s.consequent);
            self.scope.renames.remove(id.name.as_str());
            let name = self.bind(&id.name, id.span);
            self.scope.decl.insert(name.clone(), OBJECT.to_string());
            self.review(format!(
                "`{}` and its `as Record<string, unknown>`: an array is not `.object` here (TS read its keys as a record's)",
                self.slice(s.test.span())
            ));
            return Some((format!("guard let {name} = {value} else {{\n{exit}\n}}"), 2));
        }
        // `if (typeof x === "string") …` (`&& t`, with no `else`).
        let (narrow, rest, read) = if let Some((x, k)) = typeof_test(&s.test) {
            (x, None, kind_read(k)?)
        } else if let Expression::LogicalExpression(l) = s.test.without_parentheses()
            && l.operator == LogicalOperator::And
            && s.alternate.is_none()
            && let Some((x, k)) = typeof_test(&l.left)
        {
            (x, Some(&l.right), kind_read(k)?)
        } else {
            return None;
        };
        let (name, kind) = self.json_name(narrow)?;
        let ty = match read {
            "string" => "String",
            "number" => "Float",
            _ => "Bool",
        };
        let value = self.json_as(narrow, kind, read);
        let then = self.json_scoped(&name, ty, |tr| {
            let body = tr.block_of(&s.consequent);
            match rest {
                Some(rest) => {
                    let test = tr.test(rest, false);
                    let test = crate::expr::strip_parens(&test).to_string();
                    format!("if {test} {{\n{body}\n}}")
                }
                None => body,
            }
        });
        let otherwise = match &s.alternate {
            None => String::new(),
            Some(alternate @ Statement::IfStatement(_)) => format!(" else {}", self.stmt(alternate)),
            Some(alternate) => format!(" else {{\n{}\n}}", self.block_of(alternate)),
        };
        Some((format!("if let {name} = {value} {{\n{then}\n}}{otherwise}"), 1))
    }
}
