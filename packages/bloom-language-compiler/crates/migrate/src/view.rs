//! Views, functions and statements.
//!
//! A `view(function X(props) { … })` is `view X(params) { members; body { … } }`:
//! the props type's fields are the parameters, the hooks and derived values
//! before the first `return` are members (`useState` is `@state`,
//! `useMemo`/`useCallback` are dropped: bloomc memoises), and the returns are
//! the body, an early `if (c) return A` becoming `if c { A } else { … }`.

use oxc_ast::ast::{
    Argument, ArrowFunctionExpression, AssignmentOperator, AssignmentTarget, BindingPattern, CallExpression,
    Declaration, Expression, FormalParameters, Function, ObjectPattern, PropertyKey, SimpleAssignmentTarget,
    Statement, TSSignature, TSType, TSTypeName, VariableDeclarationKind, VariableDeclarator,
};
use oxc_span::{GetSpan, Span};
use oxc_syntax::operator::UnaryOperator;

use crate::REVIEW_MARKER;
use crate::expr::is_nothing;
use crate::module::{Setter, Tr, optional_ty};

/// A function's body: an arrow's expression or statements.
#[derive(Clone, Copy)]
pub enum Body<'b, 'a> {
    Expr(&'b Expression<'a>),
    Block(&'b [Statement<'a>], u32),
}

impl<'b, 'a> Body<'b, 'a> {
    fn of_arrow(arrow: &'b ArrowFunctionExpression<'a>) -> Self {
        match arrow.get_expression() {
            Some(e) => Body::Expr(e),
            None => Body::Block(arrow_statements(arrow), arrow_end(arrow)),
        }
    }

    fn of_function(f: &'b Function<'a>) -> Option<Self> {
        f.body.as_ref().map(|b| Body::Block(&b.statements, b.span.end))
    }
}

/// React hooks the codemod rewrites; every other React hook is a refusal.
fn react_hook(tr: &Tr, call: &CallExpression) -> Option<String> {
    match &call.callee {
        Expression::Identifier(id) => tr.react.get(id.name.as_str()).cloned(),
        Expression::StaticMemberExpression(m) => match &m.object {
            Expression::Identifier(id)
                if tr.react.get(id.name.as_str()).is_some_and(|e| e == "default" || e == "*") =>
            {
                Some(m.property.name.to_string())
            }
            _ => None,
        },
        _ => None,
    }
}

/// `infer_ret`'s answer when bloomc infers the result (a closure `let`).
const INFERRED: &str = "_";

impl Tr<'_> {
    // ---- views -----------------------------------------------------------------

    pub fn view_item(
        &mut self,
        name: &str,
        call: &CallExpression,
        vis: &'static str,
        body: &[Statement],
    ) -> String {
        let Expression::Identifier(callee) = &call.callee else { unreachable!("a view call") };
        let kind = match self.lang.get(callee.name.as_str()).map(String::as_str) {
            Some("screen") => "screen",
            Some("layout") => "layout",
            _ => "view",
        };
        if call.arguments.len() != 1 {
            return self.refuse("view:options", format!("`{}(…)` with options", callee.name), call.span);
        }
        match call.arguments[0].as_expression().map(|e| e.without_parentheses()) {
            Some(Expression::FunctionExpression(f)) => match Body::of_function(f) {
                Some(b) => self.view_decl(kind, name, vis, &f.params, b, body, f.span),
                None => self.refuse("view:body", "a view without a body", f.span),
            },
            Some(Expression::ArrowFunctionExpression(arrow)) => {
                self.view_decl(kind, name, vis, &arrow.params, Body::of_arrow(arrow), body, arrow.span)
            }
            Some(Expression::Identifier(id)) => {
                let target = body.iter().find_map(|s| match s {
                    Statement::FunctionDeclaration(f) if f.id.as_ref().is_some_and(|i| i.name == id.name) => {
                        Some(f)
                    }
                    _ => None,
                });
                match target.and_then(|f| Body::of_function(f).map(|b| (f, b))) {
                    Some((f, b)) => self.view_decl(kind, name, vis, &f.params, b, body, f.span),
                    None => self.refuse(
                        "view:wrapped",
                        format!("`view({})` of a function not in this module", id.name),
                        id.span,
                    ),
                }
            }
            _ => self.refuse("view:wrapped", "a view of something other than a function", call.span),
        }
    }

    /// An Expo Router route file (under `app/`): `layout` for `_layout`, else `screen`.
    pub fn route_kind(&self) -> Option<&'static str> {
        let path = self.filename.replace('\\', "/");
        let in_app = path.starts_with("app/") || path.starts_with("./app/") || path.contains("/app/");
        if !in_app {
            return None;
        }
        let stem = path.rsplit('/').next().unwrap_or_default();
        Some(if stem.starts_with("_layout") { "layout" } else { "screen" })
    }

    /// `export default function X()` in a route file, as `pub default screen X`.
    pub fn route_fn(&mut self, kind: &str, name: &str, f: &Function, module: &[Statement]) -> String {
        if !f.params.items.is_empty() {
            return self.refuse("route:props", format!("the route component `{name}` takes props"), f.span);
        }
        match Body::of_function(f) {
            Some(b) => self.view_decl(kind, name, "pub default ", &f.params, b, module, f.span),
            None => self.refuse("fn:declare", "a function without a body", f.span),
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn view_decl(
        &mut self,
        kind: &str,
        name: &str,
        vis: &'static str,
        params: &FormalParameters,
        fn_body: Body,
        module: &[Statement],
        span: Span,
    ) -> String {
        self.view_decl_typed(kind, name, vis, params, None, fn_body, module, span)
    }

    /// A view whose props type may come from elsewhere (`const X: React.FC<P> = (…) =>`).
    #[allow(clippy::too_many_arguments)]
    pub fn view_decl_typed(
        &mut self,
        kind: &str,
        name: &str,
        vis: &'static str,
        params: &FormalParameters,
        props_ty: Option<&TSType>,
        fn_body: Body,
        module: &[Statement],
        span: Span,
    ) -> String {
        let equal = self.pending_equal.take();
        self.scope = Default::default();
        let params = self.view_params(params, props_ty, module, span);
        let (members, body) = match fn_body {
            Body::Expr(e) => (String::new(), self.view_value(e)),
            Body::Block(statements, end) => self.view_members(statements, end),
        };
        let members = match equal {
            Some(equal) if members.is_empty() => equal,
            Some(equal) => format!("{equal}\n\n{members}"),
            None => members,
        };
        self.scope = Default::default();
        let params = params.map_or(String::new(), |p| format!("({p})"));
        let members = if members.is_empty() { String::new() } else { format!("{members}\n\n") };
        format!("{vis}{kind} {name}{params} {{\n{members}body {{\n{body}\n}}\n}}")
    }

    /// The props as parameters, from the props type's fields.
    fn view_params(
        &mut self,
        params: &FormalParameters,
        props_ty: Option<&TSType>,
        module: &[Statement],
        span: Span,
    ) -> Option<String> {
        let param = match params.items.as_slice() {
            [] => return None,
            [param] => param,
            _ => {
                return Some(self.refuse(
                    "view:params",
                    "a view function with more than one parameter",
                    span,
                ));
            }
        };
        let Some(annotation) = param.type_annotation.as_ref().map(|t| &t.type_annotation).or(props_ty) else {
            return Some(self.refuse("view:untyped-props", "untyped props", param.span));
        };
        let mut spread = None;
        let members: Vec<&TSSignature> = match annotation {
            TSType::TSTypeLiteral(literal) => literal.members.iter().collect(),
            TSType::TSTypeReference(reference) => {
                let TSTypeName::IdentifierReference(id) = &reference.type_name else {
                    return Some(self.refuse("view:props-type", "props of a qualified type", reference.span));
                };
                match local_object(module, &id.name) {
                    Some(members) => members,
                    // Props typed elsewhere (`X.types.ts`): their fields spread in (`..XProps`).
                    None if self.imported.contains(id.name.as_str())
                        && reference.type_arguments.is_none() =>
                    {
                        spread = Some(self.name(&id.name, id.span));
                        Vec::new()
                    }
                    None => {
                        return Some(self.refuse(
                            "view:imported-props",
                            format!(
                                "props typed by `{}`, which is not an object type of this module",
                                id.name
                            ),
                            reference.span,
                        ));
                    }
                }
            }
            other => {
                return Some(self.refuse(
                    "view:props-type",
                    "props of an intersection or computed type",
                    other.span(),
                ));
            }
        };
        // Destructured props: their local names and defaults.
        let mut defaults: Vec<(String, &Expression)> = Vec::new();
        match &param.pattern {
            BindingPattern::BindingIdentifier(id) => self.scope.props = Some(id.name.to_string()),
            BindingPattern::ObjectPattern(pattern) => {
                if pattern.rest.is_some() {
                    return Some(self.refuse("view:rest-props", "rest props `{ a, ...rest }`", pattern.span));
                }
                for property in &pattern.properties {
                    let Some(key) = key_name(&property.key) else {
                        return Some(self.refuse(
                            "view:props-pattern",
                            "a computed prop name",
                            property.span,
                        ));
                    };
                    match &property.value {
                        BindingPattern::BindingIdentifier(local) => {
                            if local.name != key.as_str() {
                                self.scope.renames.insert(local.name.to_string(), key.clone());
                            }
                        }
                        BindingPattern::AssignmentPattern(a) => {
                            let BindingPattern::BindingIdentifier(local) = &a.left else {
                                return Some(self.refuse(
                                    "view:props-pattern",
                                    "a nested props pattern",
                                    property.span,
                                ));
                            };
                            if local.name != key.as_str() {
                                self.scope.renames.insert(local.name.to_string(), key.clone());
                            }
                            defaults.push((key, &a.right));
                        }
                        _ => {
                            return Some(self.refuse(
                                "view:props-pattern",
                                "a nested props pattern",
                                property.span,
                            ));
                        }
                    }
                }
            }
            _ => return Some(self.refuse("view:props-pattern", "an array props pattern", param.span)),
        }
        let mut out = Vec::new();
        if let Some(spread) = spread {
            if let Some((key, value)) = defaults.first() {
                return Some(self.refuse(
                    "view:spread-default",
                    format!("a default for `{key}`, a prop of an imported props type"),
                    value.span(),
                ));
            }
            out.push(format!("..{spread}"));
        }
        for member in members {
            if let TSSignature::TSPropertySignature(p) = member
                && let Some(t) = &p.type_annotation
                && let TSType::TSTypeReference(r) = &t.type_annotation
                && let TSTypeName::IdentifierReference(id) = &r.type_name
                && let Some(key) = key_name(&p.key)
            {
                self.scope.types.insert(key, id.name.to_string());
            }
            let Some((field, ty, optional)) = self.field(member) else { continue };
            let default = defaults.iter().find(|(k, _)| *k == field).map(|(_, e)| *e);
            let declared = if optional && default.is_none() { optional_ty(&ty) } else { ty.clone() };
            self.scope.decl.insert(field.clone(), declared);
            let text = match (default, optional) {
                (Some(value), _) => {
                    let value = self.typed_value(value, self.scope.types.get(&field).cloned());
                    format!("{field}: {ty} = {value}")
                }
                (None, true) => format!("{field}: {} = none", optional_ty(&ty)),
                (None, false) => format!("{field}: {ty}"),
            };
            out.push(text);
        }
        Some(out.join(", "))
    }

    /// A value where a local union is expected: its string literal is the case.
    fn typed_value(&mut self, value: &Expression, ty: Option<String>) -> String {
        if let Expression::StringLiteral(s) = value
            && let Some(cases) = ty.and_then(|t| self.unions.get(&t))
            && cases.iter().any(|c| c == s.value.as_str().unwrap_or_default())
        {
            return format!(".{}", s.value.as_str().unwrap_or_default());
        }
        self.expr(value)
    }

    /// The view function's statements as members and a body.
    fn view_members(&mut self, statements: &[Statement], end: u32) -> (String, String) {
        let mut members: Vec<String> = Vec::new();
        let mut previous: Option<u32> = None;
        for (i, statement) in statements.iter().enumerate() {
            let span = statement.span();
            let returns = match statement {
                Statement::ReturnStatement(_) => true,
                Statement::IfStatement(s) => branch_returns(&s.consequent),
                _ => false,
            };
            if returns {
                let body = self.view_lines(&statements[i..], end);
                return (members.join("\n"), body);
            }
            let note = self.note(span.start);
            let blank = previous.is_some_and(|p| self.blank_between(p, span.start));
            previous = Some(span.end);
            let member = match statement {
                Statement::VariableDeclaration(v) => {
                    if v.kind != VariableDeclarationKind::Const {
                        self.refuse(
                            "view:mutable",
                            "a `let` in a view (a view's values are immutable)",
                            v.span,
                        )
                    } else {
                        let parts: Vec<String> = v.declarations.iter().map(|d| self.member(d)).collect();
                        parts.into_iter().filter(|p| !p.is_empty()).collect::<Vec<_>>().join("\n")
                    }
                }
                Statement::FunctionDeclaration(f) => match (&f.id, Body::of_function(f)) {
                    (Some(id), Some(body)) => {
                        let name = id.name.to_string();
                        self.scope.member_fns.insert(name.clone());
                        self.fn_text(
                            &name,
                            "",
                            f.r#async,
                            &f.params,
                            f.return_type.as_deref().map(|t| &t.type_annotation),
                            body,
                        )
                    }
                    _ => self.refuse("fn:anonymous", "an anonymous function", f.span),
                },
                Statement::ExpressionStatement(s) => match &s.expression {
                    Expression::CallExpression(call)
                        if react_hook(self, call).as_deref() == Some("useEffect") =>
                    {
                        self.effect(call)
                    }
                    Expression::CallExpression(call) if react_hook(self, call).is_some() => {
                        let hook = react_hook(self, call).unwrap_or_default();
                        self.refuse(&format!("react:{hook}"), format!("React's `{hook}`"), call.span)
                    }
                    // A TS hook called for what it does: a member whose value is unused.
                    Expression::CallExpression(call) if matches!(&call.callee, Expression::Identifier(id) if is_hook_name(&id.name)) =>
                    {
                        format!("let _ = {}", self.expr(&s.expression))
                    }
                    _ => self.refuse(
                        "view:statement",
                        "a statement in a view body (a view computes, it does not do)",
                        s.span,
                    ),
                },
                other => self.refuse("view:statement", "a statement in a view body", other.span()),
            };
            if member.is_empty() {
                members.push(note.trim_end().to_string());
                continue;
            }
            if blank {
                members.push(String::new());
            }
            let reviews = self.take_reviews();
            members.push(format!("{note}{reviews}{member}"));
        }
        let body = self.refuse("view:no-return", "a view that does not return", Span::new(end, end));
        (members.join("\n"), body)
    }

    /// One `const` of a view body as a member.
    fn member(&mut self, d: &VariableDeclarator) -> String {
        let Some(init) = &d.init else {
            return self.refuse("view:uninitialised", "a constant without a value", d.span);
        };
        let init = init.without_parentheses();
        if let Expression::CallExpression(call) = init
            && let Some(hook) = react_hook(self, call)
        {
            return self.react_member(d, call, &hook);
        }
        match (&d.id, init) {
            (BindingPattern::BindingIdentifier(id), Expression::ArrowFunctionExpression(arrow)) => {
                let name = id.name.to_string();
                self.scope.member_fns.insert(name.clone());
                self.arrow_fn(&name, "", arrow)
            }
            (BindingPattern::ObjectPattern(pattern), Expression::Identifier(source))
                if self.scope.props.as_deref() == Some(source.name.as_str()) =>
            {
                // `const { a, b: c } = props`: the parameters are already in scope.
                for property in &pattern.properties {
                    if let (Some(key), BindingPattern::BindingIdentifier(local)) =
                        (key_name(&property.key), &property.value)
                    {
                        if local.name != key.as_str() {
                            self.scope.renames.insert(local.name.to_string(), key);
                        }
                    } else {
                        return self.refuse(
                            "view:props-pattern",
                            "a nested or defaulted props pattern",
                            property.span,
                        );
                    }
                }
                if pattern.rest.is_some() {
                    return self.refuse("view:rest-props", "rest props `{ a, ...rest }`", pattern.span);
                }
                String::new()
            }
            _ => self.let_decl(d, init, true),
        }
    }

    fn react_member(&mut self, d: &VariableDeclarator, call: &CallExpression, hook: &str) -> String {
        match hook {
            "useState" => {
                let BindingPattern::ArrayPattern(pattern) = &d.id else {
                    return self.refuse(
                        "react:useState",
                        "`useState` not destructured as `[value, setValue]`",
                        d.span,
                    );
                };
                let value = match pattern.elements.first() {
                    // A state named by a keyword (`body`) is renamed in the view (`body_`).
                    Some(Some(BindingPattern::BindingIdentifier(id))) => self.bind(&id.name, id.span),
                    _ => return self.refuse("react:useState", "`useState` without a value name", d.span),
                };
                if let Some(Some(BindingPattern::BindingIdentifier(setter))) = pattern.elements.get(1) {
                    self.scope.setters.insert(setter.name.to_string(), Setter { state: value.clone() });
                }
                let ty = call.type_arguments.as_ref().and_then(|a| a.params.first()).map(|t| {
                    if let TSType::TSTypeReference(r) = t
                        && let TSTypeName::IdentifierReference(id) = &r.type_name
                    {
                        self.scope.types.insert(value.clone(), id.name.to_string());
                    }
                    self.ty(t)
                });
                let init = match call.arguments.first().and_then(|a| a.as_expression()) {
                    Some(Expression::ArrowFunctionExpression(arrow)) if arrow.params.items.is_empty() => {
                        match arrow.get_expression() {
                            Some(e) => self.typed_value(e, self.scope.types.get(&value).cloned()),
                            None => {
                                return self.refuse(
                                    "react:useState",
                                    "a lazy initialiser with statements",
                                    arrow.span,
                                );
                            }
                        }
                    }
                    Some(e) => self.typed_value(e, self.scope.types.get(&value).cloned()),
                    None if ty.as_deref().is_some_and(|t| t.ends_with('?')) => "none".into(),
                    None => {
                        return self.refuse(
                            "react:useState",
                            "`useState()` without an initial value",
                            call.span,
                        );
                    }
                };
                let name = self.name(&value, d.span);
                match ty {
                    Some(ty) => format!("@state {name}: {ty} = {init}"),
                    None => format!("@state {name} = {init}"),
                }
            }
            "useRef" => {
                let BindingPattern::BindingIdentifier(id) = &d.id else {
                    return self.refuse("react:useRef", "a destructured `useRef`", d.span);
                };
                let name = self.bind(&id.name, id.span);
                let init = call.arguments.first().and_then(|a| a.as_expression());
                let ty = call.type_arguments.as_ref().and_then(|a| a.params.first()).map(|t| {
                    let ty = self.ty(t);
                    // `useRef<T>(null)`: a ref that holds a `T` once it is set.
                    if init.is_none_or(is_nothing) { optional_ty(&ty) } else { ty }
                });
                let init = match init {
                    Some(e) => self.expr(e),
                    None => "none".into(),
                };
                self.scope.refs.insert(id.name.to_string());
                match ty {
                    Some(ty) => format!("@ref {name}: {ty} = {init}"),
                    None => format!("@ref {name} = {init}"),
                }
            }
            "useMemo" | "useCallback" => {
                let BindingPattern::BindingIdentifier(id) = &d.id else {
                    return self.refuse(&format!("react:{hook}"), format!("a destructured `{hook}`"), d.span);
                };
                let Some(Argument::ArrowFunctionExpression(arrow)) = call.arguments.first() else {
                    return self.refuse(
                        &format!("react:{hook}"),
                        format!("`{hook}` of something other than an arrow"),
                        call.span,
                    );
                };
                let name = id.name.to_string();
                let out = if hook == "useCallback" {
                    self.scope.member_fns.insert(name.clone());
                    self.arrow_fn(&name, "", arrow)
                } else {
                    let value = match arrow.get_expression() {
                        Some(e) => Some(e),
                        None => match crate::view::arrow_statements(arrow) {
                            [Statement::ReturnStatement(r)] => r.argument.as_ref(),
                            _ => None,
                        },
                    };
                    match value {
                        Some(value) => {
                            if self.is_view(value) {
                                self.scope.view_values.insert(name.clone());
                            }
                            let ty = d
                                .type_annotation
                                .as_ref()
                                .map(|t| format!(": {}", self.ty(&t.type_annotation)));
                            let value = self.expr(value);
                            let name = self.name(&name, id.span);
                            format!("let {name}{} = {value}", ty.unwrap_or_default())
                        }
                        // A computation with statements: a closure called in place (bloomc memoises it).
                        None => {
                            let ty = d
                                .type_annotation
                                .as_ref()
                                .map(|t| format!(": {}", self.ty(&t.type_annotation)));
                            let saved = self.scope.clone();
                            let body = self.block_stmts(arrow_statements(arrow), arrow_end(arrow), true);
                            self.scope = saved;
                            let name = self.bind(&name, id.span);
                            format!("let {name}{} = {{\n{body}\n}}()", ty.unwrap_or_default())
                        }
                    }
                };
                if let Some(deps) = call.arguments.get(1) {
                    let span = deps.span();
                    self.comments.skip_within(span.start, span.end);
                }
                out
            }
            other => self.refuse(&format!("react:{other}"), format!("React's `{other}`"), call.span),
        }
    }

    /// `const pattern = value` as `let`: a name, or a record pattern.
    fn let_decl(&mut self, d: &VariableDeclarator, init: &Expression, immutable: bool) -> String {
        // A `Map`/`Set` changed in place (`s.add(x)`) is a `var` its changes reassign.
        let mut immutable = immutable;
        if let (BindingPattern::BindingIdentifier(id), Expression::NewExpression(n)) =
            (&d.id, init.without_parentheses())
            && matches!(&n.callee, Expression::Identifier(c) if matches!(c.name.as_str(), "Map" | "Set"))
        {
            let Expression::Identifier(c) = &n.callee else { unreachable!() };
            self.scope.collections.insert(id.name.to_string(), c.name.to_string());
            if mutates(self.src, &id.name) {
                immutable = false;
            }
        }
        let keyword = if immutable { "let" } else { "var" };
        let mut ty = d
            .type_annotation
            .as_ref()
            .map(|t| format!(": {}", self.ty(&t.type_annotation)))
            .unwrap_or_default();
        // `const x = f<T>(…)`: the type argument types the binding (`let x: T = f(…)`).
        if ty.is_empty()
            && let Expression::CallExpression(call) = init.without_parentheses()
            && let Some(args) = &call.type_arguments
            && let [only] = args.params.as_slice()
            // A record pattern takes the type argument only when it is a record type
            // (`useLocalSearchParams<{ id: string }>()`, not `useQuery<Lane[]>()`).
            && (matches!(d.id, BindingPattern::BindingIdentifier(_)) || matches!(only, TSType::TSTypeLiteral(_)))
        {
            ty = format!(": {}", self.ty(only));
            self.typed_calls.insert(call.span.start);
        }
        let pattern = match &d.id {
            BindingPattern::BindingIdentifier(id) => {
                if self.is_view(init) {
                    self.scope.view_values.insert(id.name.to_string());
                }
                self.scope.renames.remove(id.name.as_str());
                self.bind(&id.name, id.span)
            }
            BindingPattern::ObjectPattern(pattern) if immutable => self.record_pattern(pattern),
            BindingPattern::ArrayPattern(p) if immutable => {
                // `const [a, b] = f()`: a tuple pattern (a TS tuple is a Bloom tuple).
                if p.rest.is_some() {
                    return self.refuse("destructure:rest", "a rest element in an array pattern", p.span);
                }
                let mut items = Vec::new();
                for element in &p.elements {
                    match element {
                        None => items.push("_".to_string()),
                        Some(BindingPattern::BindingIdentifier(id)) => {
                            items.push(self.bind(&id.name, id.span))
                        }
                        Some(other) => items.push(self.refuse(
                            "destructure:array",
                            "a nested array pattern",
                            other.span(),
                        )),
                    }
                }
                format!("({})", items.join(", "))
            }
            other => return self.refuse("destructure", "a destructuring pattern", other.span()),
        };
        let value = self.expr(init);
        let defaults = std::mem::take(&mut self.pattern_defaults);
        let mut out = format!("{keyword} {pattern}{ty} = {value}");
        for line in defaults {
            out.push('\n');
            out.push_str(&line);
        }
        out
    }

    pub fn record_pattern(&mut self, pattern: &ObjectPattern) -> String {
        if pattern.rest.is_some() {
            return self.refuse("destructure:rest", "a rest pattern `{ a, ...rest }`", pattern.span);
        }
        let mut parts = Vec::new();
        for property in &pattern.properties {
            let Some(key) = key_name(&property.key) else {
                parts.push(self.refuse("destructure:computed", "a computed key in a pattern", property.span));
                continue;
            };
            match &property.value {
                BindingPattern::BindingIdentifier(local) => {
                    let bound = self.bind(&local.name, local.span);
                    parts.push(if bound == key { key } else { format!("{key}: {bound}") });
                }
                BindingPattern::ObjectPattern(inner) => {
                    let inner = self.record_pattern(inner);
                    parts.push(format!("{key}: {inner}"));
                }
                // `{ data: lanes = [] }`: bound, then `let lanes = lanes ?? []`.
                BindingPattern::AssignmentPattern(a) => match &a.left {
                    BindingPattern::BindingIdentifier(local) => {
                        let bound = self.bind(&local.name, local.span);
                        parts.push(if bound == key { key } else { format!("{key}: {bound}") });
                        let value = self.expr(&a.right);
                        self.pattern_defaults.push(format!("let {bound} = {bound} ?? {value}"));
                    }
                    other => parts.push(self.refuse(
                        "destructure:default",
                        "a default on a nested pattern",
                        other.span(),
                    )),
                },
                BindingPattern::ArrayPattern(a) => {
                    parts.push(self.refuse("destructure:array", "array destructuring", a.span));
                }
            }
        }
        format!("{{ {} }}", parts.join(", "))
    }

    /// The returns of a view (or of a function returning UI), as builder lines.
    fn view_lines(&mut self, statements: &[Statement], end: u32) -> String {
        let mut lines = Vec::new();
        let mut i = 0;
        while i < statements.len() {
            let statement = &statements[i];
            let note = self.note(statement.span().start);
            if !note.is_empty() {
                lines.push(note.trim_end().to_string());
            }
            match statement {
                Statement::ReturnStatement(r) => {
                    if let Some(value) = &r.argument {
                        let value = self.view_value(value);
                        lines.push(self.take_reviews() + &value);
                    }
                    return lines.join("\n");
                }
                Statement::IfStatement(s) if branch_returns(&s.consequent) => {
                    let empty = branch(&s.consequent)
                        .iter()
                        .all(|st| matches!(st, Statement::ReturnStatement(r) if r.argument.as_ref().is_none_or(is_nothing)));
                    let test = if empty { self.test_negated(&s.test) } else { self.test(&s.test, true) };
                    let then = self.view_lines(branch(&s.consequent), s.consequent.span().end);
                    let otherwise = match &s.alternate {
                        Some(alternate) => self.view_lines(branch(alternate), alternate.span().end),
                        None => self.view_lines(&statements[i + 1..], end),
                    };
                    if empty {
                        // `if (c) return null; …`: the rest, under the negated condition.
                        lines.push(format!("if {test} {{\n{otherwise}\n}}"));
                    } else if is_single_if(&otherwise) {
                        lines.push(format!("if {test} {{\n{then}\n}} else {otherwise}"));
                    } else {
                        lines.push(format!("if {test} {{\n{then}\n}} else {{\n{otherwise}\n}}"));
                    }
                    return lines.join("\n");
                }
                Statement::VariableDeclaration(v) if v.kind == VariableDeclarationKind::Const => {
                    for d in &v.declarations {
                        let Some(init) = &d.init else {
                            lines.push(self.refuse(
                                "view:uninitialised",
                                "a constant without a value",
                                d.span,
                            ));
                            continue;
                        };
                        if let Expression::CallExpression(call) = init.without_parentheses()
                            && (react_hook(self, call).is_some() || is_hook_call(call))
                        {
                            lines.push(self.refuse(
                                "hook:after-return",
                                "a hook after an early return",
                                call.span,
                            ));
                            continue;
                        }
                        let line = self.let_decl(d, init, true);
                        lines.push(self.take_reviews() + &line);
                    }
                }
                other => lines.push(self.refuse(
                    "view:statement",
                    "a statement among a view's returns",
                    other.span(),
                )),
            }
            i += 1;
        }
        let tail = self.note(end);
        if !tail.is_empty() {
            lines.push(tail.trim_end().to_string());
        }
        lines.join("\n")
    }

    /// A returned UI value as builder lines: nothing is no line, a conditional an `if`.
    fn view_value(&mut self, value: &Expression) -> String {
        if is_nothing(value) {
            return String::new();
        }
        // A component's `return toElement(tree)`: the tree is the body.
        if let Expression::CallExpression(call) = value.without_parentheses()
            && let Expression::Identifier(id) = &call.callee
            && self.is_lang(&id.name, "toElement")
            && let [arg] = call.arguments.as_slice()
            && let Some(tree) = arg.as_expression()
        {
            return self.child(tree);
        }
        self.child(value)
    }

    /// The lines of a `for` built from `xs.map((x) => …)`.
    pub fn arrow_view_lines(&mut self, arrow: &ArrowFunctionExpression) -> String {
        match arrow.get_expression() {
            Some(e) => self.view_value(e),
            None => self.view_lines(crate::view::arrow_statements(arrow), crate::view::arrow_end(arrow)),
        }
    }

    // ---- functions -------------------------------------------------------------

    pub fn function_item(
        &mut self,
        name: &str,
        f: &Function,
        vis: &'static str,
        module: &[Statement],
    ) -> String {
        self.function_item_typed(name, f, vis, None, module)
    }

    /// A module function; a component's props type may come from elsewhere (`memo<P>(function …)`).
    pub fn function_item_typed(
        &mut self,
        name: &str,
        f: &Function,
        vis: &'static str,
        props_ty: Option<&TSType>,
        module: &[Statement],
    ) -> String {
        if self.components.contains(name) {
            return match Body::of_function(f) {
                Some(body) => {
                    self.view_decl_typed("view", name, vis, &f.params, props_ty, body, module, f.span)
                }
                None => self.refuse("fn:declare", "a function without a body", f.span),
            };
        }
        if let Some(refusal) = self.module_fn_kind(name, f.span) {
            return refusal;
        }
        match Body::of_function(f) {
            Some(body) => {
                self.scope = Default::default();
                let out = self.fn_text(
                    name,
                    vis,
                    f.r#async,
                    &f.params,
                    f.return_type.as_deref().map(|t| &t.type_annotation),
                    body,
                );
                self.scope = Default::default();
                out
            }
            None => self.refuse("fn:declare", "a function without a body", f.span),
        }
    }

    pub fn arrow_item(
        &mut self,
        name: &str,
        arrow: &ArrowFunctionExpression,
        vis: &'static str,
        props_ty: Option<&TSType>,
        module: &[Statement],
    ) -> String {
        if self.components.contains(name) {
            let body = Body::of_arrow(arrow);
            return self.view_decl_typed(
                "view",
                name,
                vis,
                &arrow.params,
                props_ty,
                body,
                module,
                arrow.span,
            );
        }
        if let Some(refusal) = self.module_fn_kind(name, arrow.span) {
            return refusal;
        }
        self.scope = Default::default();
        let out = self.arrow_fn(name, vis, arrow);
        self.scope = Default::default();
        out
    }

    /// A TS hook or a React component at module level: neither is a `.bloom` function
    /// (hooks are view members; a component that returns JSX is still React).
    fn module_fn_kind(&mut self, name: &str, span: Span) -> Option<String> {
        if is_hook_name(name) {
            return Some(self.refuse(
                "hook:module",
                format!("`{name}` is a TS hook (hooks are view members in `.bloom`)"),
                span,
            ));
        }
        if name.starts_with(|c: char| c.is_ascii_uppercase()) && has_jsx(self.src, span) {
            return Some(self.refuse(
                "component:react",
                format!("`{name}` is a React component (it returns JSX)"),
                span,
            ));
        }
        None
    }

    fn arrow_fn(&mut self, name: &str, vis: &'static str, arrow: &ArrowFunctionExpression) -> String {
        let ret = arrow.return_type.as_deref().map(|t| &t.type_annotation);
        self.fn_text(name, vis, arrow.r#async, &arrow.params, ret, Body::of_arrow(arrow))
    }

    pub fn fn_text(
        &mut self,
        name: &str,
        vis: &'static str,
        is_async: bool,
        params: &FormalParameters,
        ret: Option<&TSType>,
        body: Body,
    ) -> String {
        let saved = self.scope.clone();
        let (params, prelude) = self.fn_params(params);
        let ret = match ret {
            Some(t) => self.ret_type(t, is_async),
            None => self.infer_ret(body),
        };
        // A result type bloomc infers: a closure `let` (a `fn` signature is required).
        let closure = ret.as_deref() == Some(INFERRED);
        if closure && (is_async || params.contains(" = ")) {
            self.scope = saved;
            return self.refuse(
                "fn:return-type",
                "a function returning a value without a return type",
                match body {
                    Body::Expr(e) => e.span(),
                    Body::Block(_, end) => Span::new(end, end),
                },
            );
        }
        let text = match body {
            Body::Expr(e) => {
                if ret.is_some() {
                    if ret.as_deref().is_some_and(|r| r.starts_with("View")) {
                        self.view_value(e)
                    } else {
                        self.expr(e)
                    }
                } else {
                    self.stmt_expr(e)
                }
            }
            Body::Block(statements, end) => {
                if ret.as_deref().is_some_and(|r| r.starts_with("View")) && is_view_returns(statements) {
                    self.view_lines(statements, end)
                } else {
                    self.block_stmts(statements, end, ret.is_some())
                }
            }
        };
        self.scope = saved;
        let text = if prelude.is_empty() { text } else { format!("{}\n{text}", prelude.join("\n")) };
        let name = self.name(name, Span::default());
        if closure {
            let head = if params.is_empty() { String::new() } else { format!(" {params} in") };
            return format!("{vis}let {name} = {{{head}\n{text}\n}}");
        }
        let keyword = if is_async { "async fn" } else { "fn" };
        let ret = ret.map(|r| format!(" -> {r}")).unwrap_or_default();
        format!("{vis}{keyword} {name}({params}){ret} {{\n{text}\n}}")
    }

    /// A function's parameters, and the `let`s that destructure a typed object parameter.
    fn fn_params(&mut self, params: &FormalParameters) -> (String, Vec<String>) {
        let mut out = Vec::new();
        let mut prelude = Vec::new();
        let several = params.items.len() > 1;
        for (index, param) in params.items.iter().enumerate() {
            if let (BindingPattern::ObjectPattern(pattern), Some(t)) =
                (&param.pattern, &param.type_annotation)
            {
                let name = if several { format!("arg{index}") } else { "arg".to_string() };
                let ty = self.ty(&t.type_annotation);
                let pattern = self.record_pattern(pattern);
                prelude.push(format!("let {pattern} = {name}"));
                prelude.append(&mut self.pattern_defaults);
                out.push(format!("{name}: {ty}"));
                continue;
            }
            let BindingPattern::BindingIdentifier(id) = &param.pattern else {
                let (pattern, default) = match &param.pattern {
                    BindingPattern::AssignmentPattern(a) => (&a.left, Some(&a.right)),
                    other => (other, None),
                };
                if let (BindingPattern::BindingIdentifier(id), Some(default)) = (pattern, default) {
                    let ty = match &param.type_annotation {
                        Some(t) => self.ty(&t.type_annotation),
                        None => match literal_type(default) {
                            Some(t) => t.to_string(),
                            None => {
                                out.push(self.refuse(
                                    "param:untyped",
                                    format!("`{}` has no type", id.name),
                                    param.span,
                                ));
                                continue;
                            }
                        },
                    };
                    let value = self.expr(default);
                    out.push(format!("{}: {ty} = {value}", self.bind(&id.name, id.span)));
                    continue;
                }
                out.push(self.refuse("param:destructure", "a destructured parameter", param.span));
                continue;
            };
            self.scope.renames.remove(id.name.as_str());
            let name = self.bind(&id.name, id.span);
            let Some(t) = &param.type_annotation else {
                out.push(self.refuse("param:untyped", format!("`{}` has no type", id.name), param.span));
                continue;
            };
            if let TSType::TSTypeReference(r) = &t.type_annotation
                && let TSTypeName::IdentifierReference(tid) = &r.type_name
            {
                self.scope.types.insert(id.name.to_string(), tid.name.to_string());
            }
            let ty = self.ty(&t.type_annotation);
            let declared =
                if param.optional && param.initializer.is_none() { optional_ty(&ty) } else { ty.clone() };
            self.scope.decl.insert(name.clone(), declared);
            let text = match &param.initializer {
                Some(default) => format!(
                    "{name}: {ty} = {}",
                    self.typed_value(default, self.scope.types.get(id.name.as_str()).cloned())
                ),
                None if param.optional => format!("{name}: {} = none", optional_ty(&ty)),
                None => format!("{name}: {ty}"),
            };
            out.push(text);
        }
        if let Some(rest) = &params.rest {
            out.push(self.refuse("param:rest", "a rest parameter (a list in `.bloom`)", rest.span));
        }
        (out.join(", "), prelude)
    }

    /// A written return type; `void` (and an async function's `Promise<void>`) is none.
    fn ret_type(&mut self, t: &TSType, is_async: bool) -> Option<String> {
        if matches!(t, TSType::TSVoidKeyword(_)) {
            return None;
        }
        if is_async
            && let TSType::TSTypeReference(r) = t
            && let TSTypeName::IdentifierReference(id) = &r.type_name
            && id.name == "Promise"
            && let Some(inner) = r.type_arguments.as_ref().and_then(|a| a.params.first())
        {
            if matches!(inner, TSType::TSVoidKeyword(_)) {
                return None;
            }
            return Some(self.ty(inner));
        }
        Some(self.ty(t))
    }

    /// The return type left unwritten: UI, nothing, or a refusal.
    fn infer_ret(&mut self, body: Body) -> Option<String> {
        match body {
            Body::Expr(e) => {
                if self.is_view(e) {
                    Some(if may_be_nothing(e) { "View?".into() } else { "View".into() })
                } else if is_effect(e) {
                    None
                } else if let Some(ty) = value_type(e) {
                    Some(ty.to_string())
                } else {
                    Some(INFERRED.into())
                }
            }
            Body::Block(statements, end) => {
                let values = return_values(statements);
                if values.is_empty() {
                    None
                } else if values.iter().all(|v| self.is_view(v) || is_nothing(v)) {
                    Some(if values.iter().any(|v| is_nothing(v) || may_be_nothing(v)) {
                        "View?".into()
                    } else {
                        "View".into()
                    })
                } else if let Some(ty) =
                    value_type(values[0]).filter(|t| values.iter().all(|v| value_type(v) == Some(t)))
                {
                    Some(ty.to_string())
                } else {
                    let _ = end;
                    Some(INFERRED.into())
                }
            }
        }
    }

    // ---- statements ------------------------------------------------------------

    /// A block's statements; with `tail`, a last `return e` is the result `e`.
    pub fn block_stmts(&mut self, statements: &[Statement], end: u32, tail: bool) -> String {
        let mut lines = Vec::new();
        let mut previous: Option<u32> = None;
        for (i, statement) in statements.iter().enumerate() {
            let span = statement.span();
            let note = self.note(span.start);
            if previous.is_some_and(|p| self.blank_between(p, span.start)) {
                lines.push(String::new());
            }
            previous = Some(span.end);
            let last = i + 1 == statements.len();
            // `const x = await tsCall()` outside a `try`: the rest of the block runs on
            // `.ok(x)`; a rejection stops it (TS: an unhandled rejection).
            if !self.propagate
                && let Some(start @ (AwaitStart::Let(..) | AwaitStart::Pattern(..))) =
                    awaited_start(statement)
                && !self.awaits_bloom(start.value())
            {
                let awaited = self.expr(start.value());
                let (bound, destructure) = match start {
                    AwaitStart::Let(id, _) => (self.bind(&id.name, id.span), String::new()),
                    AwaitStart::Pattern(p, _) => {
                        ("value".to_string(), format!("let {} = value\n", self.record_pattern(p)))
                    }
                    _ => unreachable!(),
                };
                let rest = self.block_stmts(&statements[i + 1..], end, tail);
                let reviews = self.take_reviews();
                lines.push(format!(
                    "{note}{reviews}// {REVIEW_MARKER}: a rejection of the awaited call stops the block here (TS: an unhandled rejection)\nmatch await {awaited} {{\ncase .ok({bound}) => {{\n{destructure}{rest}\n}}\ncase .err(_) => {{}}\n}}"
                ));
                return lines.join("\n");
            }
            let text = match statement {
                Statement::ReturnStatement(r) if last && tail => match &r.argument {
                    Some(value) => self.expr(value),
                    None => String::new(),
                },
                Statement::TryStatement(t) => self.try_stmt(t, last),
                other => self.stmt(other),
            };
            let reviews = self.take_reviews();
            lines.push(format!("{note}{reviews}{text}"));
        }
        let note = self.note(end);
        if !note.is_empty() {
            lines.push(note.trim_end().to_string());
        }
        lines.join("\n")
    }

    fn stmt(&mut self, statement: &Statement) -> String {
        match statement {
            Statement::VariableDeclaration(v) => {
                let immutable = v.kind == VariableDeclarationKind::Const;
                if !immutable && v.kind != VariableDeclarationKind::Let {
                    return self.refuse("statement:var", "a `var`", v.span);
                }
                let mut out = Vec::new();
                for d in &v.declarations {
                    match &d.init {
                        Some(init) => out.push(self.let_decl(d, init, immutable)),
                        None => out.push(self.refuse(
                            "statement:uninitialised",
                            "a `let` without a value",
                            d.span,
                        )),
                    }
                }
                out.join("\n")
            }
            Statement::ExpressionStatement(s) => self.stmt_expr(&s.expression),
            Statement::IfStatement(s) => {
                let test = self.test(&s.test, true);
                let then = self.block_of(&s.consequent);
                match &s.alternate {
                    None => format!("if {test} {{\n{then}\n}}"),
                    Some(Statement::IfStatement(_)) => {
                        let otherwise = self.stmt(s.alternate.as_ref().expect("an else"));
                        format!("if {test} {{\n{then}\n}} else {otherwise}")
                    }
                    Some(alternate) => {
                        let otherwise = self.block_of(alternate);
                        format!("if {test} {{\n{then}\n}} else {{\n{otherwise}\n}}")
                    }
                }
            }
            Statement::ReturnStatement(r) => match &r.argument {
                Some(value) => format!("return {}", self.expr(value)),
                None if self.try_return => "return ok(())".into(),
                None => "return".into(),
            },
            Statement::ForOfStatement(f) => {
                let item = match &f.left {
                    oxc_ast::ast::ForStatementLeft::VariableDeclaration(v) => match v.declarations.as_slice()
                    {
                        [d] => match &d.id {
                            BindingPattern::BindingIdentifier(id) => Some(self.bind(&id.name, id.span)),
                            _ => None,
                        },
                        _ => None,
                    },
                    _ => None,
                };
                let Some(item) = item else {
                    return self.refuse("statement:for-pattern", "a `for…of` over a pattern", f.span);
                };
                let list = self.expr(&f.right);
                let body = self.block_of(&f.body);
                format!("for {item} in {list} {{\n{body}\n}}")
            }
            Statement::TryStatement(t) => self.try_stmt(t, false),
            Statement::ThrowStatement(t) => {
                self.refuse("statement:throw", "`throw` (return a `Result`)", t.span)
            }
            Statement::SwitchStatement(s) => {
                self.refuse("statement:switch", "a `switch` (a `match`)", s.span)
            }
            Statement::BlockStatement(b) => self.refuse("statement:block", "a bare block", b.span),
            Statement::FunctionDeclaration(f) => {
                self.refuse("fn:nested", "a function inside a function", f.span)
            }
            Statement::ForStatement(f) => self.refuse("statement:for", "a C-style `for`", f.span),
            Statement::WhileStatement(w) => {
                let test = self.expr(&w.test);
                let body = self.block_of(&w.body);
                format!("while {test} {{\n{body}\n}}")
            }
            Statement::EmptyStatement(_) => String::new(),
            other => self.refuse("statement", "a statement with no `.bloom` form", other.span()),
        }
    }

    fn block_of(&mut self, statement: &Statement) -> String {
        match statement {
            Statement::BlockStatement(b) => self.block_stmts(&b.body, b.span.end, false),
            other => self.stmt(other),
        }
    }

    /// An expression in statement position: a setter call is an assignment.
    pub fn stmt_expr(&mut self, e: &Expression) -> String {
        match e {
            Expression::CallExpression(call)
                if let Expression::StaticMemberExpression(m) = &call.callee
                    && let Expression::Identifier(object) = &m.object
                    && self.scope.collections.contains_key(object.name.as_str())
                    && matches!(m.property.name.as_str(), "add" | "set" | "delete" | "clear") =>
            {
                // `s.add(x)` changes `s` in place; a Bloom `Set` is a value, so it is reassigned.
                let name = self.name(&object.name, object.span);
                let args: Vec<String> = call
                    .arguments
                    .iter()
                    .map(|a| a.as_expression().map_or_else(String::new, |e| self.expr(e)))
                    .collect();
                let method = match m.property.name.as_str() {
                    "add" => "inserting",
                    "set" => "setting",
                    "delete" => "removing",
                    _ => return format!("{name} = {}()", self.scope.collections[object.name.as_str()]),
                };
                format!("{name} = {name}.{method}({})", args.join(", "))
            }
            // `xs.forEach((x) => …)` is a `for`; `(x, i)` iterates `xs.enumerated()`.
            Expression::CallExpression(call)
                if let Expression::StaticMemberExpression(m) = &call.callee
                    && m.property.name == "forEach"
                    && !m.optional
                    && let [Argument::ArrowFunctionExpression(arrow)] = call.arguments.as_slice()
                    && !arrow.r#async
                    && arrow.params.rest.is_none()
                    && arrow
                        .params
                        .items
                        .iter()
                        .all(|p| matches!(p.pattern, BindingPattern::BindingIdentifier(_)))
                    && matches!(arrow.params.items.len(), 1 | 2)
                    && {
                        // A `return` in the callback is a `continue` in a `for`.
                        let mut returns = Vec::new();
                        collect_returns(crate::view::arrow_statements(arrow), &mut returns);
                        returns.is_empty()
                    } =>
            {
                let list = self.expr(&m.object);
                let names: Vec<String> = arrow
                    .params
                    .items
                    .iter()
                    .map(|p| {
                        let BindingPattern::BindingIdentifier(id) = &p.pattern else { unreachable!() };
                        self.bind(&id.name, id.span)
                    })
                    .collect();
                let body = self.closure_body(arrow);
                match names.as_slice() {
                    [x] => format!("for {x} in {list} {{\n{body}\n}}"),
                    [x, i] => format!("for ({i}, {x}) in {list}.enumerated() {{\n{body}\n}}"),
                    _ => unreachable!(),
                }
            }
            Expression::CallExpression(call) => {
                if let Expression::Identifier(id) = &call.callee
                    && let Some(setter) = self.scope.setters.get(id.name.as_str()).cloned()
                {
                    return self.set_state(&setter.state, call);
                }
                self.expr(e)
            }
            Expression::UnaryExpression(u) if u.operator == UnaryOperator::Void => match &u.argument {
                Expression::CallExpression(_) => format!("task {{ await {} }}", self.expr(&u.argument)),
                other => self.refuse("operator:void", "`void` of something other than a call", other.span()),
            },
            Expression::AssignmentExpression(a) => {
                let op = match a.operator {
                    AssignmentOperator::Assign => "=",
                    AssignmentOperator::Addition => "+=",
                    AssignmentOperator::Subtraction => "-=",
                    AssignmentOperator::Multiplication => "*=",
                    op => {
                        return self.refuse(
                            &format!("operator:{}", op.as_str()),
                            format!("`{}`", op.as_str()),
                            a.span,
                        );
                    }
                };
                let target = match &a.left {
                    AssignmentTarget::AssignmentTargetIdentifier(id) => self.name(&id.name, id.span),
                    // `r.current = v`: a `@ref` is written by its name.
                    AssignmentTarget::StaticMemberExpression(m)
                        if m.property.name == "current"
                            && matches!(&m.object, Expression::Identifier(o) if self.scope.refs.contains(o.name.as_str())) =>
                    {
                        let Expression::Identifier(o) = &m.object else { unreachable!() };
                        self.name(&o.name, o.span)
                    }
                    other => {
                        return self.refuse(
                            "mutation",
                            "a write to an object's field (values are immutable)",
                            other.span(),
                        );
                    }
                };
                let value = self.expr(&a.right);
                format!("{target} {op} {value}")
            }
            Expression::UpdateExpression(u) => match &u.argument {
                SimpleAssignmentTarget::AssignmentTargetIdentifier(id) => {
                    let op = if u.operator == oxc_syntax::operator::UpdateOperator::Increment {
                        "+="
                    } else {
                        "-="
                    };
                    format!("{} {op} 1", self.name(&id.name, id.span))
                }
                other => self.refuse("mutation", "`++` on an object's field", other.span()),
            },
            Expression::ChainExpression(chain) => match &chain.expression {
                oxc_ast::ast::ChainElement::CallExpression(call) => self.optional_call(call),
                _ => self.expr(e),
            },
            _ => self.expr(e),
        }
    }

    /// `setX(v)` as `x = v`; a functional update `setX((p) => f(p))` as `x = f(x)`.
    fn set_state(&mut self, state: &str, call: &CallExpression) -> String {
        let [arg] = call.arguments.as_slice() else {
            return self.refuse("state:setter", "a state setter with other than one argument", call.span);
        };
        let value = match arg {
            Argument::ArrowFunctionExpression(arrow) => {
                let param = match arrow.params.items.as_slice() {
                    [p] => match &p.pattern {
                        BindingPattern::BindingIdentifier(id) => Some(id.name.to_string()),
                        _ => None,
                    },
                    _ => None,
                };
                let value = match arrow.get_expression() {
                    Some(e) => Some(e),
                    None => match crate::view::arrow_statements(arrow) {
                        [Statement::ReturnStatement(r)] => r.argument.as_ref(),
                        _ => None,
                    },
                };
                // `setX((prev) => { …; return next })`: the statements, then `x = next`.
                let statements = crate::view::arrow_statements(arrow);
                if let (Some(param), None, [init @ .., Statement::ReturnStatement(last)]) =
                    (&param, value, statements)
                    && let Some(result) = &last.argument
                {
                    let mut returns = Vec::new();
                    collect_returns(init, &mut returns);
                    if let Some(r) = returns.first() {
                        return self.refuse("state:update", "a functional update that returns early", r.span);
                    }
                    let saved = self.scope.renames.insert(param.clone(), state.to_string());
                    let lines = self.block_stmts(init, last.span.start, false);
                    let value = self.expr(result);
                    match saved {
                        Some(s) => self.scope.renames.insert(param.clone(), s),
                        None => self.scope.renames.remove(param),
                    };
                    return format!("{lines}\n{state} = {value}");
                }
                match (param, value) {
                    (Some(param), Some(value)) => {
                        let saved = self.scope.renames.insert(param.clone(), state.to_string());
                        let text = self.expr(value);
                        match saved {
                            Some(s) => self.scope.renames.insert(param, s),
                            None => self.scope.renames.remove(&param),
                        };
                        text
                    }
                    _ => {
                        return self.refuse(
                            "state:update",
                            "a functional update with statements",
                            arrow.span,
                        );
                    }
                }
            }
            other => {
                let ty = self.scope.types.get(state).cloned();
                self.typed_value(other.to_expression(), ty)
            }
        };
        format!("{state} = {value}")
    }

    /// `useEffect(() => { …; return cleanup }, deps)` as an `effect` member: `[x]` is
    /// `effect(id: x)`, `[]` (once) `effect(id: 0)`; other deps are bloomc's inferred
    /// reads, under review. The returned cleanup is a `defer` where it was set.
    fn effect(&mut self, call: &CallExpression) -> String {
        let (Some(Argument::ArrowFunctionExpression(arrow)), deps) =
            (call.arguments.first(), call.arguments.get(1))
        else {
            return self.refuse(
                "react:useEffect",
                "a `useEffect` of something other than an arrow",
                call.span,
            );
        };
        if arrow.r#async || !arrow.params.items.is_empty() {
            return self.refuse("effect:async", "an async `useEffect` (async work is `.task`)", arrow.span);
        }
        let head = match deps.map(|d| d.as_expression().map(|e| e.without_parentheses())) {
            None => {
                return self.refuse(
                    "effect:every-render",
                    "a `useEffect` without dependencies (it runs after every render)",
                    call.span,
                );
            }
            Some(Some(Expression::ArrayExpression(a))) => match a.elements.as_slice() {
                [] => "effect(id: 0)".to_string(),
                [only] if only.as_expression().is_some() => {
                    format!("effect(id: {})", self.expr(only.to_expression()))
                }
                _ => {
                    let deps = self.slice(a.span).to_string();
                    self.review(format!("its deps were {deps}: bloomc infers them from what it reads"));
                    "effect".to_string()
                }
            },
            Some(_) => {
                return self.refuse(
                    "effect:deps",
                    "a `useEffect` whose deps are not a list literal",
                    call.span,
                );
            }
        };
        let saved = self.scope.clone();
        let body = match arrow.get_expression() {
            Some(e) => self.stmt_expr(e),
            None => {
                let statements = arrow_statements(arrow);
                let (body, cleanup) = match statements.split_last() {
                    Some((Statement::ReturnStatement(r), rest)) if r.argument.is_some() => {
                        (rest, r.argument.as_ref())
                    }
                    _ => (statements, None),
                };
                let mut text = self.block_stmts(body, arrow_end(arrow), false);
                if let Some(cleanup) = cleanup {
                    let deferred = match cleanup.without_parentheses() {
                        Expression::ArrowFunctionExpression(c) if c.params.items.is_empty() => {
                            match c.get_expression() {
                                Some(e) => self.stmt_expr(e),
                                None => self.block_stmts(arrow_statements(c), arrow_end(c), false),
                            }
                        }
                        other => format!("{}()", self.expr(other)),
                    };
                    text.push_str(&format!("\ndefer {{\n{deferred}\n}}"));
                }
                text
            }
        };
        self.scope = saved;
        format!("{head} {{\n{body}\n}}")
    }

    /// A `memo` comparator as the view's `equal(old, new) { … }` member: a module
    /// function is called with both; an arrow's parameters are the member's.
    pub fn equal_member(&mut self, comparator: &Expression) -> String {
        let saved = std::mem::take(&mut self.scope);
        let out = match comparator.without_parentheses() {
            Expression::Identifier(_) => {
                let f = self.expr(comparator);
                format!("equal(old, new) {{ {f}(old, new) }}")
            }
            Expression::ArrowFunctionExpression(arrow) => match arrow.params.items.as_slice() {
                [a, b] if arrow.params.rest.is_none() => match (&a.pattern, &b.pattern) {
                    (BindingPattern::BindingIdentifier(a), BindingPattern::BindingIdentifier(b)) => {
                        let (a, b) = (self.bind(&a.name, a.span), self.bind(&b.name, b.span));
                        let body = match arrow.get_expression() {
                            Some(e) => self.expr(e),
                            None => self.block_stmts(arrow_statements(arrow), arrow_end(arrow), true),
                        };
                        format!("equal({a}, {b}) {{\n{body}\n}}")
                    }
                    _ => self.refuse(
                        "react:memo-compare",
                        "a comparator with destructured parameters",
                        arrow.span,
                    ),
                },
                _ => self.refuse("react:memo-compare", "a comparator without two parameters", arrow.span),
            },
            other => self.refuse(
                "react:memo-compare",
                format!("the comparator `{}`", self.slice(other.span())),
                other.span(),
            ),
        };
        self.scope = saved;
        out
    }

    /// `f?.(a)` as a statement.
    /// Any other `try` around awaits: its block as a closure returning a `Result`,
    /// each `await` propagating with `?`, matched like an awaited call. A `return`
    /// in the block would return from the closure, so it is refused unless it is a
    /// bare `return` of a `try` that ends its block (then `return ok(())` is the same).
    fn try_closure(
        &mut self,
        t: &oxc_ast::ast::TryStatement,
        handler: &oxc_ast::ast::CatchClause,
        finalizer: Option<String>,
        last: bool,
    ) -> String {
        let mut returns = Vec::new();
        collect_returns(&t.block.body, &mut returns);
        if let Some(r) = returns.iter().find(|r| r.argument.is_some() || !last) {
            return self.refuse(
                "try:return",
                "a `return` inside a `try` around several awaits (it would return from the `Result` closure)",
                r.span,
            );
        }
        let error = match handler.param.as_ref().map(|p| &p.pattern) {
            Some(BindingPattern::BindingIdentifier(id)) => self.bind(&id.name, id.span),
            None => "_".into(),
            Some(other) => {
                return self.refuse("try:pattern", "a destructured `catch` parameter", other.span());
            }
        };
        let propagate = std::mem::replace(&mut self.propagate, true);
        let returning = std::mem::replace(&mut self.try_return, true);
        let block = self.block_stmts(&t.block.body, t.block.span.end, false);
        self.propagate = propagate;
        self.try_return = returning;
        let err = self.block_stmts(&handler.body.body, handler.body.span.end, false);
        let marker = format!(
            "// {REVIEW_MARKER}: the `try` block as a `Result` closure; every `await` propagates its rejection with `?` (a synchronous TS throw is not caught)"
        );
        let defer = finalizer.map(|f| format!("{f}\n")).unwrap_or_default();
        format!(
            "{marker}\nlet attempt = {{\n{block}\nreturn ok(())\n}}\n{defer}match await attempt() {{\ncase .ok(_) => {{ }}\ncase .err({error}) => {{\n{err}\n}}\n}}"
        )
    }

    /// A statement before a `try`'s first `await` that cannot throw, so it may be
    /// written before the `match`: a state write of a pure value, a logger call,
    /// a `const` of a pure value.
    fn cannot_throw(&self, statement: &Statement) -> bool {
        match statement {
            Statement::ExpressionStatement(s) => match s.expression.without_parentheses() {
                Expression::CallExpression(call) => {
                    let args_pure = call.arguments.iter().all(|a| a.as_expression().is_some_and(is_pure));
                    match &call.callee {
                        Expression::Identifier(id) => {
                            self.scope.setters.contains_key(id.name.as_str()) && args_pure
                        }
                        Expression::StaticMemberExpression(m) => {
                            matches!(&m.object, Expression::Identifier(o) if o.name.to_lowercase().ends_with("logger"))
                                && matches!(
                                    m.property.name.as_str(),
                                    "debug" | "info" | "warn" | "error" | "log"
                                )
                                && args_pure
                        }
                        _ => false,
                    }
                }
                _ => false,
            },
            Statement::VariableDeclaration(v) => {
                v.kind == VariableDeclarationKind::Const
                    && v.declarations.iter().all(|d| {
                        matches!(d.id, BindingPattern::BindingIdentifier(_))
                            && d.init.as_ref().is_some_and(is_pure)
                    })
            }
            Statement::EmptyStatement(_) => true,
            _ => false,
        }
    }

    fn optional_call(&mut self, call: &CallExpression) -> String {
        self.optional_call_expr(call)
    }

    /// `try { await x } catch (e) { … } finally { … }`: a `match` on the awaited
    /// `Result` and a `defer`, under a review marker (the TS caught a throw anywhere
    /// in the block; the match handles the awaited call's rejection).
    fn try_stmt(&mut self, t: &oxc_ast::ast::TryStatement, last: bool) -> String {
        let finalizer = match &t.finalizer {
            Some(f) if !last => {
                return self.refuse(
                    "try:finally",
                    "a `finally` with statements after the `try` (a `defer` runs at the block's end)",
                    f.span,
                );
            }
            Some(f) => {
                let body = self.block_stmts(&f.body, f.span.end, false);
                Some(format!("defer {{\n{body}\n}}"))
            }
            None => None,
        };
        let Some(handler) = &t.handler else {
            // `try { … } finally { … }` is exactly a `defer`.
            let body = self.block_stmts(&t.block.body, t.block.span.end, false);
            return format!("{}\n{body}", finalizer.unwrap_or_default());
        };
        let body = &t.block.body;
        let fast = body.iter().position(|s| awaited_start(s).is_some()).filter(|&k| {
            !self.awaits_bloom(awaited_start(&body[k]).expect("an awaited start").value())
                && body[..k].iter().all(|s| self.cannot_throw(s))
                && !body[k + 1..].iter().any(|s| self.slice(s.span()).contains("await"))
        });
        let Some(k) = fast else {
            if !self.slice(t.block.span).contains("await") {
                return self.refuse(
                    "try:sync",
                    "a `try` around code with no `await` (`.bloom` has no exceptions: the throwing TS call needs a `Result` wrapper)",
                    t.span,
                );
            }
            return self.try_closure(t, handler, finalizer, last);
        };
        let prefix = self.block_stmts(&body[..k], body[k].span().start, false);
        let mut destructure = None;
        let (bound, awaited, rest, returns) = match awaited_start(&body[k]).expect("an awaited start") {
            AwaitStart::Expr(a) => ("_".to_string(), a, &body[k + 1..], false),
            AwaitStart::Let(id, a) => (self.bind(&id.name, id.span), a, &body[k + 1..], false),
            AwaitStart::Return(a) => ("value".to_string(), a, &body[k + 1..], true),
            AwaitStart::Pattern(p, a) => {
                let pattern = self.record_pattern(p);
                destructure = Some(format!("let {pattern} = value"));
                ("value".to_string(), a, &body[k + 1..], false)
            }
        };
        let error = match handler.param.as_ref().map(|p| &p.pattern) {
            Some(BindingPattern::BindingIdentifier(id)) => self.bind(&id.name, id.span),
            None => "_".into(),
            Some(other) => {
                return self.refuse("try:pattern", "a destructured `catch` parameter", other.span());
            }
        };
        let awaited = self.expr(awaited);
        let mut ok = self.block_stmts(rest, t.block.span.end, false);
        if returns {
            ok = format!("return value\n{ok}");
        }
        if let Some(d) = destructure {
            ok = format!("{d}\n{ok}");
        }
        let prefix = if prefix.trim().is_empty() { String::new() } else { format!("{prefix}\n") };
        let err = self.block_stmts(&handler.body.body, handler.body.span.end, false);
        let marker = format!(
            "// {REVIEW_MARKER}: the `catch` caught a throw anywhere in the `try`; `.err` is the awaited call's rejection"
        );
        let defer = finalizer.map(|f| format!("{f}\n")).unwrap_or_default();
        format!(
            "{prefix}{marker}\n{defer}match await {awaited} {{\ncase .ok({bound}) => {{\n{ok}\n}}\ncase .err({error}) => {{\n{err}\n}}\n}}"
        )
    }
}

/// How a `try` block's first awaited statement starts.
enum AwaitStart<'b, 'a> {
    /// `await x`
    Expr(&'b Expression<'a>),
    /// `const v = await x`
    Let(&'b oxc_ast::ast::BindingIdentifier<'a>, &'b Expression<'a>),
    /// `return await x`
    Return(&'b Expression<'a>),
    /// `const { a, b } = await x`
    Pattern(&'b oxc_ast::ast::ObjectPattern<'a>, &'b Expression<'a>),
}

impl<'b, 'a> AwaitStart<'b, 'a> {
    fn value(&self) -> &'b Expression<'a> {
        match self {
            AwaitStart::Expr(a)
            | AwaitStart::Let(_, a)
            | AwaitStart::Return(a)
            | AwaitStart::Pattern(_, a) => a,
        }
    }
}

fn awaited_start<'b, 'a>(statement: &'b Statement<'a>) -> Option<AwaitStart<'b, 'a>> {
    match statement {
        Statement::ExpressionStatement(s) => match s.expression.without_parentheses() {
            Expression::AwaitExpression(a) => Some(AwaitStart::Expr(&a.argument)),
            _ => None,
        },
        Statement::VariableDeclaration(v) if v.declarations.len() == 1 => {
            let d = &v.declarations[0];
            match (&d.id, d.init.as_ref().map(|i| i.without_parentheses())) {
                (BindingPattern::BindingIdentifier(id), Some(Expression::AwaitExpression(a))) => {
                    Some(AwaitStart::Let(id, &a.argument))
                }
                (BindingPattern::ObjectPattern(p), Some(Expression::AwaitExpression(a))) => {
                    Some(AwaitStart::Pattern(p, &a.argument))
                }
                _ => None,
            }
        }
        Statement::ReturnStatement(r) => match r.argument.as_ref().map(|a| a.without_parentheses()) {
            Some(Expression::AwaitExpression(a)) => Some(AwaitStart::Return(&a.argument)),
            _ => None,
        },
        _ => None,
    }
}

/// Whether the module changes the collection `name` in place (`name.add(…)`).
fn mutates(src: &str, name: &str) -> bool {
    ["add", "set", "delete", "clear"].iter().any(|m| {
        let needle = format!("{name}.{m}(");
        src.match_indices(&needle)
            .any(|(i, _)| !src[..i].ends_with(|c: char| c.is_alphanumeric() || c == '_' || c == '.'))
    })
}

/// The `return`s of a block, outside nested functions.
fn collect_returns<'b, 'a>(
    statements: &'b [Statement<'a>],
    out: &mut Vec<&'b oxc_ast::ast::ReturnStatement<'a>>,
) {
    for statement in statements {
        match statement {
            Statement::ReturnStatement(r) => out.push(r),
            Statement::IfStatement(i) => {
                collect_returns(std::slice::from_ref(&i.consequent), out);
                if let Some(a) = &i.alternate {
                    collect_returns(std::slice::from_ref(a), out);
                }
            }
            Statement::BlockStatement(b) => collect_returns(&b.body, out),
            Statement::ForOfStatement(f) => collect_returns(std::slice::from_ref(&f.body), out),
            Statement::WhileStatement(w) => collect_returns(std::slice::from_ref(&w.body), out),
            Statement::TryStatement(t) => {
                collect_returns(&t.block.body, out);
                if let Some(h) = &t.handler {
                    collect_returns(&h.body.body, out);
                }
            }
            _ => {}
        }
    }
}

/// A value read that cannot throw: literals, names, field reads, records and lists of them.
fn is_pure(e: &Expression) -> bool {
    match e.without_parentheses() {
        Expression::BooleanLiteral(_)
        | Expression::NullLiteral(_)
        | Expression::NumericLiteral(_)
        | Expression::StringLiteral(_)
        | Expression::Identifier(_) => true,
        Expression::TemplateLiteral(t) => t.expressions.iter().all(is_pure),
        Expression::StaticMemberExpression(m) => is_pure(&m.object),
        Expression::ChainExpression(c) => match &c.expression {
            oxc_ast::ast::ChainElement::StaticMemberExpression(m) => is_pure(&m.object),
            _ => false,
        },
        Expression::ConditionalExpression(c) => {
            is_pure(&c.test) && is_pure(&c.consequent) && is_pure(&c.alternate)
        }
        Expression::LogicalExpression(l) => is_pure(&l.left) && is_pure(&l.right),
        Expression::UnaryExpression(u) => u.operator == UnaryOperator::LogicalNot && is_pure(&u.argument),
        Expression::ObjectExpression(o) => o.properties.iter().all(|p| match p {
            oxc_ast::ast::ObjectPropertyKind::ObjectProperty(p) => !p.computed && is_pure(&p.value),
            oxc_ast::ast::ObjectPropertyKind::SpreadProperty(_) => false,
        }),
        Expression::ArrayExpression(a) => a.elements.iter().all(|e| e.as_expression().is_some_and(is_pure)),
        _ => false,
    }
}

/// An arrow's statements (none when its body is an expression).
pub fn arrow_statements<'b, 'a>(arrow: &'b ArrowFunctionExpression<'a>) -> &'b [Statement<'a>] {
    arrow.get_function_body().map_or(&[], |b| &b.statements)
}

/// Where an arrow's body ends.
pub fn arrow_end(arrow: &ArrowFunctionExpression) -> u32 {
    arrow.get_function_body().map_or(arrow.span.end, |b| b.span.end)
}

/// `!(test)`, written the short way when `test` is a comparison or a negation.
pub fn negate(test: &Expression, text: &str) -> String {
    use oxc_syntax::operator::BinaryOperator;
    match test.without_parentheses() {
        Expression::BinaryExpression(b) => {
            let swapped = match b.operator {
                BinaryOperator::StrictEquality | BinaryOperator::Equality => Some((" == ", " != ")),
                BinaryOperator::StrictInequality | BinaryOperator::Inequality => Some((" != ", " == ")),
                _ => None,
            };
            match swapped {
                Some((from, to)) if text.matches(from).count() == 1 => text.replacen(from, to, 1),
                _ => format!("!({text})"),
            }
        }
        Expression::UnaryExpression(u) if u.operator == UnaryOperator::LogicalNot => {
            text.strip_prefix('!').map_or_else(|| format!("!({text})"), str::to_string)
        }
        Expression::Identifier(_) | Expression::StaticMemberExpression(_) | Expression::CallExpression(_) => {
            format!("!{text}")
        }
        _ => format!("!({text})"),
    }
}

/// Whether builder lines are one `if … else …` chain (it can follow `else` directly).
fn is_single_if(lines: &str) -> bool {
    lines.starts_with("if ") && lines.ends_with('}') && {
        // Balanced braces that close only at the end: one statement.
        let mut depth = 0i32;
        let mut closed_early = false;
        let bytes: Vec<char> = lines.chars().collect();
        for (i, c) in bytes.iter().enumerate() {
            match c {
                '{' => depth += 1,
                '}' => {
                    depth -= 1;
                    if depth == 0 && i + 1 < bytes.len() {
                        let rest: String = bytes[i + 1..].iter().collect();
                        if !rest.trim_start().starts_with("else") {
                            closed_early = true;
                        }
                    }
                }
                _ => {}
            }
        }
        !closed_early
    }
}

/// The members of a module object type named `name` (an interface or an object alias).
fn local_object<'b, 'a>(module: &'b [Statement<'a>], name: &str) -> Option<Vec<&'b TSSignature<'a>>> {
    for statement in module {
        let declaration = match statement {
            Statement::ExportDeclaration(e) => Some(&e.declaration),
            other => other.as_declaration(),
        };
        match declaration {
            Some(Declaration::TSInterfaceDeclaration(i)) if i.id.name == name && i.extends.is_empty() => {
                return Some(i.body.body.iter().collect());
            }
            Some(Declaration::TSTypeAliasDeclaration(a)) if a.id.name == name => {
                if let TSType::TSTypeLiteral(literal) = &a.type_annotation {
                    return Some(literal.members.iter().collect());
                }
                return None;
            }
            _ => {}
        }
    }
    None
}

fn key_name(key: &PropertyKey) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(id) => Some(id.name.to_string()),
        _ => None,
    }
}

/// Whether a branch ends in a `return`.
fn branch_returns(statement: &Statement) -> bool {
    match statement {
        Statement::ReturnStatement(_) => true,
        Statement::BlockStatement(b) => b.body.last().is_some_and(branch_returns),
        Statement::IfStatement(i) => {
            branch_returns(&i.consequent) && i.alternate.as_ref().is_some_and(branch_returns)
        }
        _ => false,
    }
}

fn branch<'b, 'a>(statement: &'b Statement<'a>) -> &'b [Statement<'a>] {
    match statement {
        Statement::BlockStatement(b) => &b.body,
        other => std::slice::from_ref(other),
    }
}

/// Whether the statements are only `const`s, early-return `if`s and returns.
fn is_view_returns(statements: &[Statement]) -> bool {
    statements.iter().all(|s| match s {
        Statement::ReturnStatement(_) => true,
        Statement::VariableDeclaration(v) => v.kind == VariableDeclarationKind::Const,
        Statement::IfStatement(i) => branch_returns(&i.consequent),
        _ => false,
    })
}

/// Every value a function's `return`s give (nested `if`s included).
fn return_values<'b, 'a>(statements: &'b [Statement<'a>]) -> Vec<&'b Expression<'a>> {
    let mut out = Vec::new();
    for statement in statements {
        match statement {
            Statement::ReturnStatement(r) => out.extend(r.argument.as_ref()),
            Statement::IfStatement(i) => {
                out.extend(return_values(branch(&i.consequent)));
                if let Some(alternate) = &i.alternate {
                    out.extend(return_values(branch(alternate)));
                }
            }
            Statement::BlockStatement(b) => out.extend(return_values(&b.body)),
            _ => {}
        }
    }
    out
}

fn may_be_nothing(e: &Expression) -> bool {
    match e.without_parentheses() {
        Expression::ConditionalExpression(c) => {
            is_nothing(&c.consequent)
                || is_nothing(&c.alternate)
                || may_be_nothing(&c.consequent)
                || may_be_nothing(&c.alternate)
        }
        Expression::LogicalExpression(_) => true,
        other => is_nothing(other),
    }
}

/// An expression used for what it does: a call, an assignment, `void`.
fn is_effect(e: &Expression) -> bool {
    matches!(
        e.without_parentheses(),
        Expression::CallExpression(_)
            | Expression::ChainExpression(_)
            | Expression::AssignmentExpression(_)
            | Expression::UpdateExpression(_)
            | Expression::AwaitExpression(_)
    ) || matches!(e, Expression::UnaryExpression(u) if u.operator == UnaryOperator::Void)
}

/// The type a value's own shape gives it: a literal, a comparison, arithmetic.
fn value_type(e: &Expression) -> Option<&'static str> {
    use oxc_syntax::operator::{BinaryOperator as B, LogicalOperator};
    match e.without_parentheses() {
        Expression::StringLiteral(_) | Expression::TemplateLiteral(_) => Some("String"),
        Expression::BooleanLiteral(_) => Some("Bool"),
        Expression::NumericLiteral(_) => Some("Float"),
        Expression::UnaryExpression(u) if u.operator == UnaryOperator::LogicalNot => Some("Bool"),
        Expression::UnaryExpression(u) if u.operator == UnaryOperator::UnaryNegation => {
            value_type(&u.argument)
        }
        Expression::BinaryExpression(b) => match b.operator {
            B::StrictEquality
            | B::StrictInequality
            | B::Equality
            | B::Inequality
            | B::LessThan
            | B::LessEqualThan
            | B::GreaterThan
            | B::GreaterEqualThan => Some("Bool"),
            B::Addition
                if value_type(&b.left) == Some("String") || value_type(&b.right) == Some("String") =>
            {
                Some("String")
            }
            B::Addition | B::Subtraction | B::Multiplication | B::Division | B::Remainder
                if value_type(&b.left) == Some("Float") && value_type(&b.right) == Some("Float") =>
            {
                Some("Float")
            }
            _ => None,
        },
        Expression::LogicalExpression(l) => match l.operator {
            LogicalOperator::And | LogicalOperator::Or
                if value_type(&l.left) == Some("Bool") && value_type(&l.right) == Some("Bool") =>
            {
                Some("Bool")
            }
            LogicalOperator::Coalesce => value_type(&l.right),
            _ => None,
        },
        Expression::ConditionalExpression(c) => {
            let a = value_type(&c.consequent)?;
            (value_type(&c.alternate) == Some(a)).then_some(a)
        }
        _ => None,
    }
}

fn literal_type(e: &Expression) -> Option<&'static str> {
    match e {
        Expression::StringLiteral(_) | Expression::TemplateLiteral(_) => Some("String"),
        Expression::NumericLiteral(_) => Some("Float"),
        Expression::BooleanLiteral(_) => Some("Bool"),
        _ => None,
    }
}

fn is_hook_call(call: &CallExpression) -> bool {
    matches!(&call.callee, Expression::Identifier(id) if is_hook_name(&id.name))
}

fn is_hook_name(name: &str) -> bool {
    name.starts_with("use") && name.chars().nth(3).is_some_and(|c| c.is_ascii_uppercase())
}

/// Whether the code in `span` holds JSX outside an `Embed(…)`.
pub fn has_jsx(source: &str, span: Span) -> bool {
    use oxc_ast_visit::Visit;
    struct Finder {
        found: bool,
    }
    impl<'a> Visit<'a> for Finder {
        fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
            if matches!(&call.callee, Expression::Identifier(id) if id.name == "Embed") {
                return;
            }
            oxc_ast_visit::walk::walk_call_expression(self, call);
        }
        fn visit_jsx_element(&mut self, _: &oxc_ast::ast::JSXElement<'a>) {
            self.found = true;
        }
        fn visit_jsx_fragment(&mut self, _: &oxc_ast::ast::JSXFragment<'a>) {
            self.found = true;
        }
    }
    let text = &source[span.start as usize..span.end as usize];
    if !text.contains('<') {
        return false;
    }
    let allocator = oxc_allocator::Allocator::default();
    let wrapped = format!("({text})");
    let parsed = oxc_parser::Parser::new(&allocator, &wrapped, oxc_span::SourceType::tsx()).parse();
    let mut finder = Finder { found: false };
    finder.visit_program(&parsed.program);
    finder.found
}
