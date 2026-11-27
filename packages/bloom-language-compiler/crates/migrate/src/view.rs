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
use oxc_syntax::operator::{LogicalOperator, UnaryOperator};

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

/// TanStack Query's hooks: a type argument is the data's type, not the result's.
const QUERY_HOOKS: &[&str] = &[
    "useQuery",
    "useInfiniteQuery",
    "useSuspenseQuery",
    "useSuspenseInfiniteQuery",
    "useMutation",
    "useQueries",
];

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
        // A `screen()` beside the file's default export (the route, `export default function
        // X()` drawing it) is a view: a file has one route.
        let kind = if kind != "view"
            && !vis.contains("default")
            && body.iter().any(|s| matches!(s, Statement::ExportDefaultDeclaration(d)
                if !matches!(&d.declaration, oxc_ast::ast::ExportDefaultDeclarationKind::Identifier(i) if i.name == name)))
        {
            "view"
        } else {
            kind
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
        let equal = self.pending_equal.take().or_else(|| self.equal_for.remove(name));
        self.scope = Default::default();
        let params = self.view_params(name, params, props_ty, module, span);
        let (members, body) = match fn_body {
            Body::Expr(e) => (String::new(), self.view_value(e)),
            Body::Block(statements, end) => self.view_members(statements, end),
        };
        // Written-out props with a TS destructure default: `name: T = value`.
        let params = if self.scope.field_defaults.is_empty() {
            params
        } else {
            let defaults = std::mem::take(&mut self.scope.field_defaults);
            self.view_defaults.insert(name.to_string(), defaults.clone());
            let fields = std::mem::take(&mut self.scope.props_field_types);
            let out: Vec<String> = fields
                .into_iter()
                .map(|(name, ty, optional)| match defaults.iter().find(|(k, _)| *k == name) {
                    Some((_, value)) => format!("{name}: {ty} = {value}"),
                    None if optional => format!("{name}: {} = none", optional_ty(&ty)),
                    None => format!("{name}: {ty}"),
                })
                .collect();
            Some(out.join(", "))
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
        view: &str,
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
        // `function X(props: P)` that hands `props` on whole (`<Y {...props} />`): `..props: P`
        // spreads P's fields and names the whole value.
        if let BindingPattern::BindingIdentifier(id) = &param.pattern
            && let TSType::TSTypeReference(reference) = annotation
            && reference.type_arguments.is_none()
            && let TSTypeName::IdentifierReference(ty) = &reference.type_name
            && crate::module::props_used_whole(self.src, span, &id.name)
        {
            self.scope.props = Some(id.name.to_string());
            // Its fields written out when the codemod can read them (2.0 has no `..props`): a
            // call that hands `props` on passes each (`Tr::whole_props_fields`).
            let fields: Option<Vec<(String, String, bool)>> = match local_object(module, &ty.name) {
                Some(members) => Some(members.iter().filter_map(|m| self.field(m)).collect()),
                None if self.imported.contains(ty.name.as_str()) => self
                    .external_props(&ty.name)
                    .map(|fields| fields.into_iter().map(|f| (f.name, f.ty, f.optional)).collect()),
                None => None,
            };
            if let Some(fields) = fields.filter(|f| !f.is_empty()) {
                let mut out = Vec::new();
                self.scope.props_field_types = fields.clone();
                for (name, ty, optional) in fields {
                    let declared = if optional { optional_ty(&ty) } else { ty.clone() };
                    self.scope.decl.insert(name.clone(), declared.clone());
                    out.push(if optional {
                        format!("{name}: {declared} = none")
                    } else {
                        format!("{name}: {ty}")
                    });
                    self.scope.props_fields.push(name);
                }
                return Some(out.join(", "));
            }
            self.scope.whole_props = true;
            let ty = self.name(&ty.name, ty.span);
            let name = self.bind_param(&id.name, id.span);
            return Some(format!("..{name}: {ty}"));
        }
        let mut spread = None;
        // Fields of a props type written in another TS file, written out (2.0 has no `..Props`).
        let mut external: Vec<crate::props::Field> = Vec::new();
        let members: Vec<&TSSignature> = match annotation {
            TSType::TSTypeLiteral(literal) => literal.members.iter().collect(),
            TSType::TSTypeReference(reference) => {
                let TSTypeName::IdentifierReference(id) = &reference.type_name else {
                    return Some(self.refuse("view:props-type", "props of a qualified type", reference.span));
                };
                match local_object(module, &id.name) {
                    Some(members) => members,
                    // `interface P extends Q { … }` with `Q` imported: `..Q`, then P's own fields.
                    None if let Some((members, base)) = local_extends(module, &id.name)
                        && self.imported.contains(base.as_str())
                        && reference.type_arguments.is_none() =>
                    {
                        match self.external_props(&base) {
                            Some(fields) => external = fields,
                            None => spread = Some(self.name(&base, id.span)),
                        }
                        members
                    }
                    // Props typed elsewhere (`X.types.ts`): their fields written out when the
                    // codemod can read them, else spread in (`..XProps`, which stays 0.x).
                    None if self.imported.contains(id.name.as_str())
                        && reference.type_arguments.is_none() =>
                    {
                        match self.external_props(&id.name) {
                            Some(fields) => external = fields,
                            None => spread = Some(self.name(&id.name, id.span)),
                        }
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
            // `P & { label: string }`: the local object types' fields, and one imported
            // type's spread (`..P`).
            TSType::TSIntersectionType(intersection) => {
                let mut members = Vec::new();
                for part in &intersection.types {
                    match part {
                        TSType::TSTypeLiteral(literal) => members.extend(literal.members.iter()),
                        TSType::TSTypeReference(r)
                            if r.type_arguments.is_none()
                                && let TSTypeName::IdentifierReference(id) = &r.type_name =>
                        {
                            if let Some(local) = local_object(module, &id.name) {
                                members.extend(local);
                            } else if spread.is_none() && self.imported.contains(id.name.as_str()) {
                                spread = Some(self.name(&id.name, id.span));
                            } else {
                                return Some(self.refuse(
                                    "view:props-type",
                                    "props of an intersection of types from elsewhere",
                                    part.span(),
                                ));
                            }
                        }
                        other => {
                            return Some(self.refuse(
                                "view:props-type",
                                "props of an intersection with a computed type",
                                other.span(),
                            ));
                        }
                    }
                }
                members
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
        let mut rest_field: Option<String> = None;
        match &param.pattern {
            BindingPattern::BindingIdentifier(id) => self.scope.props = Some(id.name.to_string()),
            BindingPattern::ObjectPattern(pattern) => {
                // `{ label, ...menu }: P & { label }`: the rest is exactly the imported
                // type's fields when the pattern takes exactly the local ones: `..menu: P`.
                if let Some(rest) = &pattern.rest {
                    let own: Vec<String> = members
                        .iter()
                        .filter_map(|m| match m {
                            TSSignature::TSPropertySignature(p) => key_name(&p.key),
                            _ => None,
                        })
                        .collect();
                    let mut taken: Vec<String> =
                        pattern.properties.iter().filter_map(|p| key_name(&p.key)).collect();
                    let mut own_sorted = own.clone();
                    taken.sort();
                    own_sorted.sort();
                    match (&rest.argument, &spread) {
                        (BindingPattern::BindingIdentifier(id), Some(base))
                            if taken == own_sorted && taken.len() == pattern.properties.len() =>
                        {
                            // 2.0: the rest is one stored property of `P` (no `..menu`); a call's
                            // fields other than the own props are its record (`Tr::rest_args`).
                            let name = self.bind_param(&id.name, id.span);
                            self.rest_views.insert(view.to_string(), (name.clone(), taken.clone()));
                            rest_field = Some(format!("{name}: {base}"));
                            spread = None;
                        }
                        _ => {
                            return Some(self.refuse(
                                "view:rest-props",
                                "rest props `{ a, ...rest }` that are not exactly an imported props type",
                                pattern.span,
                            ));
                        }
                    }
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
            let own = |key: &str| {
                members.iter().any(|m| matches!(m, TSSignature::TSPropertySignature(p) if key_name(&p.key).as_deref() == Some(key)))
            };
            if let Some((key, value)) = defaults.iter().find(|(key, _)| !own(key)) {
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
        out.extend(rest_field);
        for field in external {
            let default = defaults.iter().find(|(k, _)| *k == field.name).map(|(_, e)| *e);
            let ty = field.ty;
            let declared = if field.optional && default.is_none() { optional_ty(&ty) } else { ty.clone() };
            self.scope.decl.insert(field.name.clone(), declared);
            let name = field.name;
            out.push(match (default, field.optional) {
                (Some(value), _) => {
                    let value = self.expr(value);
                    format!("{name}: {ty} = {value}")
                }
                (None, true) => format!("{name}: {} = none", optional_ty(&ty)),
                (None, false) => format!("{name}: {ty}"),
            });
        }
        Some(out.join(", "))
    }

    /// The fields of a props type imported from another TS file, with the types they
    /// name imported here (`None`: they cannot be written out).
    pub fn external_props(&mut self, name: &str) -> Option<Vec<crate::props::Field>> {
        let specifier = self.import_sources.get(name)?.clone();
        let (fields, imports) = crate::props::external_fields(&self.path, &specifier, name)?;
        for (source, ty) in imports {
            if source == "react" {
                self.react_types.insert(ty);
                continue;
            }
            self.used.insert(ty.clone());
            if !self.imported.contains(&ty) && !self.extra_imports.contains(&(source.clone(), ty.clone())) {
                self.extra_imports.push((source, ty));
            }
        }
        Some(fields)
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
        let mut skip_to = 0;
        for (i, statement) in statements.iter().enumerate() {
            if i < skip_to {
                continue;
            }
            let span = statement.span();
            // `let x = init` and the statements after it that build `x` (`if (c) x = …`,
            // `xs.push(…)`): one value, computed by a closure called in place.
            if let Some((name, last)) = self.built_value(statements, i) {
                let note = self.note(span.start);
                let blank = previous.is_some_and(|p| self.blank_between(p, span.start));
                previous = Some(statements[last].span().end);
                skip_to = last + 1;
                let member = self.built_member(&name, statements, i, last);
                let member = self.take_reviews() + &member;
                if blank {
                    members.push(String::new());
                }
                members.push(format!("{note}{member}"));
                continue;
            }
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
                // `if (prev !== x) { setPrev(x); setY(…) }`: state adjusted while drawing,
                // an effect after the render here (its test re-checked there).
                Statement::IfStatement(s) if only_state_writes(self, statement) => {
                    let _ = s;
                    let saved = self.scope.clone();
                    let text = self.block_stmts(std::slice::from_ref(statement), span.end, false);
                    self.scope = saved;
                    self.review(
                        "TS adjusted state while drawing; here an effect does it after the render (one render with the earlier state)"
                            .into(),
                    );
                    format!("{}effect {{\n{text}\n}}", self.take_reviews())
                }
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
                    // `useLayoutEffect`: 2.0's effects run after the frame is drawn, not before.
                    Expression::CallExpression(call)
                        if react_hook(self, call).as_deref() == Some("useLayoutEffect") =>
                    {
                        self.review(
                            "TS ran this before the frame was drawn (`useLayoutEffect`); 2.0's effects run after it".into(),
                        );
                        self.effect(call)
                    }
                    Expression::CallExpression(call) if react_hook(self, call).is_some() => {
                        let hook = react_hook(self, call).unwrap_or_default();
                        self.refuse(&format!("react:{hook}"), format!("React's `{hook}`"), call.span)
                    }
                    // `useFocusEffect(useCallback(() => { … }, deps))`: the callback is a
                    // member `fn` (memoised on what it reads, as the deps did), handed to the hook.
                    Expression::CallExpression(call)
                        if let Expression::Identifier(hook) = &call.callee
                            && is_hook_name(&hook.name)
                            && let [Argument::CallExpression(inner)] = call.arguments.as_slice()
                            && react_hook(self, inner).as_deref() == Some("useCallback")
                            && let Some(Argument::ArrowFunctionExpression(arrow)) =
                                inner.arguments.first()
                            && arrow.params.items.is_empty()
                            && !arrow.r#async
                            && arrow.get_expression().is_none()
                            && {
                                let mut returns = Vec::new();
                                collect_returns(arrow_statements(arrow), &mut returns);
                                returns.iter().all(|r| r.argument.is_none())
                            } =>
                    {
                        let base = hook.name.trim_start_matches("use");
                        let mut name = format!("{}{}Callback", base[..1].to_lowercase(), &base[1..]);
                        while self.scope.member_fns.contains(&name) {
                            name.push('_');
                        }
                        self.scope.member_fns.insert(name.clone());
                        if let Some(deps) = inner.arguments.get(1) {
                            let span = deps.span();
                            self.comments.skip_within(span.start, span.end);
                        }
                        let mut f =
                            self.fn_text(&name, "", false, &arrow.params, None, Body::of_arrow(arrow));
                        // React Navigation's effect callback returns its cleanup or nothing.
                        if hook.name == "useFocusEffect"
                            && let Some(open) = f.find(") {")
                            && f.ends_with('}')
                        {
                            f = format!(
                                "{}) -> (() -> Unit)? {{{}\nreturn none\n}}",
                                &f[..open],
                                &f[open + 3..f.len() - 1]
                            );
                        }
                        let hook = self.name(&hook.name, hook.span);
                        format!("{f}\nlet _ = {hook}({name})")
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
                let mut lines = Vec::new();
                for property in &pattern.properties {
                    if let (Some(key), BindingPattern::BindingIdentifier(local)) =
                        (key_name(&property.key), &property.value)
                    {
                        if local.name != key.as_str() {
                            self.scope.renames.insert(local.name.to_string(), key);
                        }
                    } else if let (Some(key), BindingPattern::AssignmentPattern(a)) =
                        (key_name(&property.key), &property.value)
                        && let BindingPattern::BindingIdentifier(local) = &a.left
                    {
                        // `{ isNested = false } = props` of written-out props, a constant default:
                        // the stored property's own (`Scope::field_defaults`).
                        if local.name == key.as_str()
                            && self.scope.props_fields.contains(&key)
                            && is_constant(&a.right)
                        {
                            let value = self.expr(&a.right);
                            self.scope.field_defaults.push((key, value));
                            continue;
                        }
                        // `{ isNested = false } = props`: the prop, or the default when absent.
                        let value = self.expr(&a.right);
                        self.scope.renames.remove(local.name.as_str());
                        let name = self.bind(&local.name, local.span);
                        self.scope.decl.remove(&name);
                        lines.push(format!("let {name} = {key} ?? {value}"));
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
                lines.join("\n")
            }
            _ => self.let_decl(d, init, true),
        }
    }

    /// `const [v, setV] = useState<T>(init)` in a hook function (which has no `@state`):
    /// React's hook called as TS, `let (v, setV): (T, Foreign) = useState(init)`; the
    /// setter is TS's (`Dispatch<SetStateAction<T>>`, tsc checks its calls).
    fn hook_state(&mut self, pattern: &oxc_ast::ast::ArrayPattern, call: &CallExpression) -> String {
        if pattern.rest.is_some() || pattern.elements.len() > 2 {
            return self.refuse(
                "react:useState",
                "`useState` destructured beyond `[value, setValue]`",
                pattern.span,
            );
        }
        let mut names = Vec::new();
        for i in 0..2 {
            names.push(match pattern.elements.get(i) {
                Some(Some(BindingPattern::BindingIdentifier(id))) => self.bind(&id.name, id.span),
                None | Some(None) => "_".to_string(),
                Some(Some(other)) => {
                    return self.refuse("react:useState", "a nested `useState` pattern", other.span());
                }
            });
        }
        let arg = call.arguments.first().and_then(|a| a.as_expression());
        let ty = match call.type_arguments.as_ref().and_then(|a| a.params.first()) {
            Some(t) if arg.is_none() => optional_ty(&self.ty(t)),
            Some(t) => self.ty(t),
            None => match arg.map(|a| a.without_parentheses()) {
                Some(Expression::BooleanLiteral(_)) => "Bool".into(),
                Some(Expression::StringLiteral(_)) => "String".into(),
                Some(Expression::NumericLiteral(_)) => "Float".into(),
                _ => "Foreign".into(),
            },
        };
        let init = arg.map(|a| self.expr(a)).unwrap_or_default();
        let name = self.name(&names[0], pattern.span);
        let Expression::Identifier(callee) = &call.callee else { unreachable!() };
        let state = callee.name.to_string();
        self.react_values.insert(if state == "useState" {
            state.clone()
        } else {
            format!("useState as {state}")
        });
        // The setter is TS's `Dispatch<SetStateAction<T>>`, written so tsc can check its calls.
        let ts = match call.type_arguments.as_ref().and_then(|a| a.params.first()) {
            Some(t) if arg.is_none() => Some(format!("{} | undefined", self.slice(t.span()))),
            Some(t) => Some(self.slice(t.span()).to_string()),
            None => match ty.as_str() {
                "Bool" => Some("boolean".into()),
                "String" => Some("string".into()),
                "Float" => Some("number".into()),
                _ => None,
            },
        };
        let setter = match ts.filter(|t| !t.contains(['"', '\n', '\\'])) {
            Some(t) => format!("Foreign<\"import('react').Dispatch<import('react').SetStateAction<{t}>>\">"),
            None => "Foreign".to_string(),
        };
        format!("let ({name}, {}): ({ty}, {setter}) = {state}({init})", names[1])
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
                let empty = call.arguments.is_empty();
                let ty = call.type_arguments.as_ref().and_then(|a| a.params.first()).map(|t| {
                    if let TSType::TSTypeReference(r) = t
                        && let TSTypeName::IdentifierReference(id) = &r.type_name
                    {
                        self.scope.types.insert(value.clone(), id.name.to_string());
                    }
                    // `useState<T>()`: a `T | undefined`, `none` until it is set.
                    if empty { optional_ty(&self.ty(t)) } else { self.ty(t) }
                });
                let init = match call.arguments.first().and_then(|a| a.as_expression()) {
                    Some(Expression::ArrowFunctionExpression(arrow)) if arrow.params.items.is_empty() => {
                        match arrow.get_expression() {
                            Some(e) => self.typed_value(e, self.scope.types.get(&value).cloned()),
                            // `useState(() => { … })`: its value, from a closure called in place.
                            None => {
                                let saved = self.scope.clone();
                                let body = self.block_stmts(arrow_statements(arrow), arrow_end(arrow), true);
                                self.scope = saved;
                                format!("{{\n{body}\n}}()")
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
            // `const { a, b } = useMemo(() => …, deps)`: the value destructured (bloomc memoises).
            "useMemo"
                if let BindingPattern::ObjectPattern(pattern) = &d.id
                    && let Some(Argument::ArrowFunctionExpression(arrow)) = call.arguments.first() =>
            {
                let value = match arrow.get_expression() {
                    Some(e) => Some(e),
                    None => match crate::view::arrow_statements(arrow) {
                        [Statement::ReturnStatement(r)] => r.argument.as_ref(),
                        _ => None,
                    },
                };
                let value = match value {
                    Some(value) => {
                        let text = self.expr(value);
                        if crate::expr::is_postfix_text(&text) { text } else { format!("({text})") }
                    }
                    None => {
                        let saved = self.scope.clone();
                        let body = self.block_stmts(arrow_statements(arrow), arrow_end(arrow), true);
                        self.scope = saved;
                        format!("{{\n{body}\n}}()")
                    }
                };
                let destructure = self.record_pattern(pattern);
                if let Some(deps) = call.arguments.get(1) {
                    let span = deps.span();
                    self.comments.skip_within(span.start, span.end);
                }
                format!("let {destructure} = {value}")
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
        if self.hook_fn
            && let Expression::CallExpression(call) = init.without_parentheses()
            && let Expression::Identifier(callee) = &call.callee
            && self.react.get(callee.name.as_str()).is_some_and(|e| e == "useState")
            && let BindingPattern::ArrayPattern(pattern) = &d.id
        {
            return self.hook_state(pattern, call);
        }
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
        // An object literal whose fields are written after: a `var` each write reassigns.
        if let (BindingPattern::BindingIdentifier(id), Expression::ObjectExpression(_)) =
            (&d.id, init.without_parentheses())
            && let Some(by_key) = field_writes(self.src, &id.name)
        {
            self.scope.grown.insert(id.name.to_string(), by_key);
            immutable = false;
        }
        // A list literal grown in place (`xs.push(x)`): a `var` each push reassigns.
        if let (BindingPattern::BindingIdentifier(id), Expression::ArrayExpression(_)) =
            (&d.id, init.without_parentheses())
            && pushes(self.src, &id.name)
        {
            self.scope.collections.insert(id.name.to_string(), "Array".to_string());
            immutable = false;
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
            // `useQuery<T>()` types its data, not what it returns (a query result).
            && !matches!(&call.callee, Expression::Identifier(c) if QUERY_HOOKS.contains(&c.name.as_str()))
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
            // `const [x] = xs.splice(i, 1)`: the element, then the list without it.
            BindingPattern::ArrayPattern(p)
                if immutable
                    && p.rest.is_none()
                    && let [Some(BindingPattern::BindingIdentifier(id))] = p.elements.as_slice()
                    && let Expression::CallExpression(call) = init.without_parentheses()
                    && let Expression::StaticMemberExpression(m) = &call.callee
                    && m.property.name == "splice"
                    && let Expression::Identifier(list) = &m.object
                    && self.scope.collections.get(list.name.as_str()).is_some_and(|k| k == "Array")
                    && let [index, count] = call.arguments.as_slice()
                    && matches!(count.as_expression(), Some(Expression::NumericLiteral(n)) if n.value == 1.0) =>
            {
                let item = self.bind(&id.name, id.span);
                let name = self.name(&list.name, list.span);
                let index = index.as_expression().map_or_else(String::new, |e| self.expr(e));
                return format!("let {item} = {name}[{index}]\n{name} = {name}.removing(at: {index})");
            }
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
        // The pattern's defaults before its value: a declaration in a closure there
        // takes its own.
        let defaults = std::mem::take(&mut self.pattern_defaults);
        let value = self.expr(init);
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
                        // A `null`/`undefined` default is the value itself.
                        if !crate::expr::is_nothing(&a.right) {
                            let value = self.expr(&a.right);
                            self.pattern_defaults.push(format!("let {bound} = {bound} ?? {value}"));
                        }
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
            if let Some((name, last)) = self.built_value(statements, i) {
                let member = self.built_member(&name, statements, i, last);
                lines.push(self.take_reviews() + &member);
                i = last + 1;
                continue;
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
                    let test = crate::expr::strip_parens(&test).to_string();
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
                        // `const { a } = props` after a return: the props are in scope.
                        let line = if matches!(init.without_parentheses(), Expression::Identifier(s) if self.scope.props.as_deref() == Some(s.name.as_str()))
                        {
                            self.member(d)
                        } else {
                            self.let_decl(d, init, true)
                        };
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
        // A TS hook is a hook function (`fn useX`): its `let`s may call hooks; React's
        // memo hooks stay calls (`useMemo({ … }, [deps])`), since a hook function is not
        // memoised by bloomc.
        self.hook_fn = is_hook_name(name);
        if self.hook_fn {
            return None;
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
        let text = self.fn_text(name, vis, arrow.r#async, &arrow.params, ret, Body::of_arrow(arrow));
        // `const f = <T,>(…) => …`: a generic `fn f<T>(…)` (a closure `let` takes no type parameters).
        match arrow.type_parameters.as_deref() {
            Some(p) if !p.params.is_empty() => {
                // `T extends string` (or `number`): compared with `==`, so `T: Equatable`.
                let names: Vec<String> = p
                    .params
                    .iter()
                    .map(|t| match &t.constraint {
                        Some(TSType::TSStringKeyword(_) | TSType::TSNumberKeyword(_)) => {
                            format!("{}: Equatable", t.name.name)
                        }
                        _ => t.name.name.to_string(),
                    })
                    .collect();
                let head = format!("fn {}(", self.name(name, Span::default()));
                match text.find(&head) {
                    Some(at) => {
                        let mut text = text;
                        text.insert_str(at + head.len() - 1, &format!("<{}>", names.join(", ")));
                        text
                    }
                    None => self.refuse(
                        "fn:generic",
                        "a generic arrow function without a return type",
                        arrow.span,
                    ),
                }
            }
            _ => text,
        }
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
        let labels = self.labelled.get(name).cloned();
        let (params, prelude) = self.fn_params(params, labels);
        let ret = match ret {
            Some(t) => self.ret_type(t, is_async),
            None => self.infer_ret(body),
        };
        // A result type bloomc infers: a closure `let` (a `fn` signature is required).
        let closure = ret.as_deref() == Some(INFERRED);
        // A hook function without `->` has its last line's type (bloomc infers it).
        let inferred_hook = closure && self.hook_fn;
        let closure = closure && !inferred_hook;
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
        let ret = if inferred_hook { None } else { ret };
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
    fn fn_params(
        &mut self,
        params: &FormalParameters,
        labels: Option<Vec<(String, String, bool)>>,
    ) -> (String, Vec<String>) {
        let mut out = Vec::new();
        let mut prelude = Vec::new();
        // `f({ a, b: local = 1 }: P)` called only with an object or a name: `a: A, b: B? = none`,
        // then `let local = b ?? 1` (TS's default applies to an absent field).
        if let Some(labels) = labels
            && let [param] = params.items.as_slice()
            && let BindingPattern::ObjectPattern(pattern) = &param.pattern
        {
            for (property, (key, ty, optional)) in pattern.properties.iter().zip(labels) {
                let (local, default) = match &property.value {
                    BindingPattern::BindingIdentifier(id) => (id, None),
                    BindingPattern::AssignmentPattern(a) => match &a.left {
                        BindingPattern::BindingIdentifier(id) => (id, Some(&a.right)),
                        _ => unreachable!("scan_labelled takes plain names"),
                    },
                    _ => unreachable!("scan_labelled takes plain names"),
                };
                let default = default.filter(|d| !crate::expr::is_nothing(d));
                self.scope.renames.remove(local.name.as_str());
                let label = self.bind_param(&key, property.span);
                let bound = self.bind(&local.name, local.span);
                let opt = optional_ty(&ty);
                // A default re-binds the value; the parameter takes an inner name, so the JS
                // has one binding of each (`isNested givenIsNested: Bool? = none`).
                let given = if default.is_some() && bound == label {
                    let mut chars = label.chars();
                    let first =
                        chars.next().map(|c| c.to_uppercase().collect::<String>()).unwrap_or_default();
                    format!("given{first}{}", chars.as_str())
                } else {
                    label.clone()
                };
                let head = if given == label { label.clone() } else { format!("{label} {given}") };
                out.push(if optional || default.is_some() {
                    format!("{head}: {opt} = none")
                } else {
                    format!("{head}: {ty}")
                });
                match default {
                    Some(value) => {
                        let value = self.expr(value);
                        prelude.push(format!("let {bound} = {given} ?? {value}"));
                        self.scope.decl.insert(bound.clone(), ty.clone());
                    }
                    None => {
                        if bound != label {
                            prelude.push(format!("let {bound} = {label}"));
                        }
                        self.scope.decl.insert(bound.clone(), if optional { opt } else { ty.clone() });
                    }
                }
            }
            return (out.join(", "), prelude);
        }
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
                    out.push(format!("{}: {ty} = {value}", self.bind_param(&id.name, id.span)));
                    continue;
                }
                out.push(self.refuse("param:destructure", "a destructured parameter", param.span));
                continue;
            };
            self.scope.renames.remove(id.name.as_str());
            let name = self.bind_param(&id.name, id.span);
            let Some(t) = &param.type_annotation else {
                // `tallRow = false`: the default's literal type.
                if let Some(default) = &param.initializer
                    && let Some(ty) = literal_type(default)
                {
                    let value = self.expr(default);
                    self.scope.decl.insert(name.clone(), ty.to_string());
                    out.push(format!("{name}: {ty} = {value}"));
                    continue;
                }
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
            out.push(self.rest_param(rest));
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
    /// The imported TS function `e` calls (`f(…)`), when it is one.
    fn ts_call_of(&self, e: &Expression) -> Option<String> {
        let Expression::CallExpression(call) = e.without_parentheses() else { return None };
        let Expression::Identifier(id) = &call.callee else { return None };
        (self.imported.contains(id.name.as_str()) && !self.lang.contains_key(id.name.as_str()))
            .then(|| id.name.to_string())
    }

    fn infer_ret(&mut self, body: Body) -> Option<String> {
        match body {
            Body::Expr(e) => {
                if self.is_view(e) {
                    Some(if may_be_nothing(e) { "View?".into() } else { "View".into() })
                } else if is_effect(e)
                    && !matches!(e.without_parentheses(), Expression::CallExpression(c)
                        if !matches!(&c.callee, Expression::Identifier(id)
                            if self.scope.setters.contains_key(id.name.as_str())))
                {
                    // A call's value is the function's (`(r) => t(key(r))`); a setter's is
                    // a statement.
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
                } else if let Some(callee) = self.ts_call_of(values[0])
                    && values.iter().all(|v| self.ts_call_of(v).as_deref() == Some(callee.as_str()))
                {
                    // Every return is a call of one imported TS function: its result type.
                    Some(format!("Foreign<\"ReturnType<typeof {callee}>\">"))
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
        let loop_block = std::mem::replace(&mut self.loop_block, false);
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
                && !self.in_do
                && let Some(start @ (AwaitStart::Let(..) | AwaitStart::Pattern(..))) =
                    awaited_start(statement)
                && !self.awaits_bloom(start.value())
            {
                let awaited = self.head_expr(start.value());
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
            // `if (!(await tsCall())) …` outside a `try`: the same, the `if` and the rest
            // of the block on `.ok(value)`.
            if !self.propagate
                && !self.in_do
                && let Statement::IfStatement(s) = statement
                && let Some(awaited) = awaited_test(&s.test)
                && !self.awaits_bloom(awaited)
            {
                let call = self.head_expr(awaited);
                let text = self.stmt(statement);
                let marked = format!("await {call}");
                if text.matches(&marked).count() == 1 {
                    let text = text
                        .replace(&format!("({marked})"), "value")
                        .replace(&marked, "value")
                        .replace("!(value)", "!value");
                    let rest = self.block_stmts(&statements[i + 1..], end, tail);
                    let reviews = self.take_reviews();
                    lines.push(format!(
                        "{note}{reviews}// {REVIEW_MARKER}: a rejection of the awaited call stops the block here (TS: an unhandled rejection)\nmatch await {call} {{\ncase .ok(value) => {{\n{text}\n{rest}\n}}\ncase .err(_) => {{}}\n}}"
                    ));
                    return lines.join("\n");
                }
            }
            // `if (c) continue;` in a loop's body: the rest of the body runs when `!c`.
            if loop_block
                && let Statement::IfStatement(s) = statement
                && s.alternate.is_none()
                && is_continue(&s.consequent)
            {
                let test = self.test_negated(&s.test);
                let test = crate::expr::strip_parens(&test).to_string();
                let reviews = self.take_reviews();
                self.loop_block = true;
                let rest = self.block_stmts(&statements[i + 1..], end, tail);
                lines.push(format!("{note}{reviews}if {test} {{\n{rest}\n}}"));
                return lines.join("\n");
            }
            let text = match statement {
                Statement::ReturnStatement(r) if last && tail => match &r.argument {
                    Some(value) => self.expr(value),
                    None => String::new(),
                },
                Statement::TryStatement(t) => self.try_stmt(t, last),
                // The last statement's bare block: nothing after it sees its names, and a
                // name may be declared again, so its statements are this block's (its `return`
                // stays the function's tail).
                Statement::BlockStatement(b) if last => self.block_stmts(&b.body, b.span.end, tail),
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
                        // `let host: string;` assigned on every path after (tsc checked
                        // it): a `var` from any start value of its type.
                        None => {
                            let ty = d.type_annotation.as_ref().map(|t| self.ty(&t.type_annotation));
                            let start = match ty.as_deref() {
                                Some("String") => Some("\"\""),
                                Some("Float") | Some("Int") => Some("0"),
                                Some("Bool") => Some("false"),
                                Some(t) if t.ends_with('?') => Some("none"),
                                _ => None,
                            };
                            match (&d.id, start, ty) {
                                (BindingPattern::BindingIdentifier(id), Some(start), Some(ty)) => {
                                    let name = self.bind(&id.name, id.span);
                                    out.push(format!("var {name}: {ty} = {start}"));
                                }
                                _ => out.push(self.refuse(
                                    "statement:uninitialised",
                                    "a `let` without a value or a simple type",
                                    d.span,
                                )),
                            }
                        }
                    }
                }
                out.join("\n")
            }
            Statement::ExpressionStatement(s) => self.stmt_expr(&s.expression),
            Statement::IfStatement(s) => {
                let parts = self.test_parts(&s.test, true);
                // Only a plain `if let` rebinds (an optional `String`'s test is spelled `s != none && …`).
                let (bound, then) = match &parts {
                    crate::expr::Test::Bind(_, None) => {
                        self.unwrapped_branch(&parts, s.consequent.span(), |tr| tr.block_of(&s.consequent))
                    }
                    _ => (None, self.block_of(&s.consequent)),
                };
                let test = match (parts, bound) {
                    (crate::expr::Test::Plain(text), _) => text,
                    (crate::expr::Test::Bind(name, None), bound) => {
                        format!("let {} = {name}", bound.unwrap_or_else(|| name.clone()))
                    }
                    (crate::expr::Test::Bind(..), _) => self.test(&s.test, false),
                };
                let test = crate::expr::strip_parens(&test).to_string();
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
                            BindingPattern::BindingIdentifier(id) => {
                                Some((self.bind(&id.name, id.span), None))
                            }
                            // `for (const { a } of xs)`: the item, then its fields.
                            BindingPattern::ObjectPattern(p) => {
                                Some(("item".to_string(), Some(self.record_pattern(p))))
                            }
                            // `for (const [k, v] of entries)`: a tuple.
                            BindingPattern::ArrayPattern(p)
                                if p.rest.is_none()
                                    && p.elements.iter().all(|e| {
                                        e.as_ref()
                                            .is_none_or(|e| matches!(e, BindingPattern::BindingIdentifier(_)))
                                    }) =>
                            {
                                let names: Vec<String> = p
                                    .elements
                                    .iter()
                                    .map(|e| match e {
                                        Some(BindingPattern::BindingIdentifier(id)) => {
                                            self.bind(&id.name, id.span)
                                        }
                                        _ => "_".to_string(),
                                    })
                                    .collect();
                                Some((format!("({})", names.join(", ")), None))
                            }
                            _ => None,
                        },
                        _ => None,
                    },
                    _ => None,
                };
                let Some((item, pattern)) = item else {
                    return self.refuse("statement:for-pattern", "a `for…of` over a pattern", f.span);
                };
                let list = self.head_expr(&f.right);
                self.loop_block = true;
                let body = self.block_of(&f.body);
                self.loop_block = false;
                let body = match pattern {
                    Some(p) => format!("let {p} = {item}\n{body}"),
                    None => body,
                };
                format!("for {item} in {list} {{\n{body}\n}}")
            }
            Statement::TryStatement(t) => self.try_stmt(t, false),
            // In a `Result` closure (a `try` written as one): its error. In `catching` or a closure
            // TS calls (`mutationFn`, `queryFn`): `fail(e)`, TS's throw (bloomc checks
            // that TS calls it, B0222).
            Statement::ThrowStatement(t) if self.in_do => format!("throw {}", self.expr(&t.argument)),
            Statement::ThrowStatement(t) if self.try_return => {
                format!("return err({})", self.expr(&t.argument))
            }
            Statement::ThrowStatement(t) if self.propagate || self.closures > 0 => {
                format!("fail({})", self.expr(&t.argument))
            }
            Statement::ThrowStatement(t) => {
                self.refuse("statement:throw", "`throw` outside a closure (return a `Result`)", t.span)
            }
            Statement::SwitchStatement(s) => self.switch(s),
            // A bare block is a scope: `do { … }`. (The last statement's block is spliced, in
            // `block_stmts`.)
            Statement::BlockStatement(b) => {
                let body = self.block_stmts(&b.body, b.span.end, false);
                format!("do {{\n{body}\n}}")
            }
            Statement::FunctionDeclaration(f) => {
                self.refuse("fn:nested", "a function inside a function", f.span)
            }
            Statement::ForStatement(f) => self.refuse("statement:for", "a C-style `for`", f.span),
            Statement::WhileStatement(w) => {
                let test = self.head_expr(&w.test);
                let body = self.block_of(&w.body);
                format!("while {test} {{\n{body}\n}}")
            }
            Statement::EmptyStatement(_) => String::new(),
            other => self.refuse("statement", "a statement with no `.bloom` form", other.span()),
        }
    }

    /// `statements[i]` declaring a value the statements after it build: its name and
    /// the index of the last statement that writes it. Each statement in between
    /// writes it (and no state); none returns.
    fn built_value(&self, statements: &[Statement], i: usize) -> Option<(String, usize)> {
        let Statement::VariableDeclaration(v) = &statements[i] else { return None };
        let [d] = v.declarations.as_slice() else { return None };
        let BindingPattern::BindingIdentifier(id) = &d.id else { return None };
        let name = id.name.as_str();
        let built = v.kind == VariableDeclarationKind::Let
            || matches!(
                d.init.as_ref().map(|e| e.without_parentheses()),
                Some(Expression::ArrayExpression(_))
            );
        if !built {
            return None;
        }
        let text = |s: &Statement| &self.src[s.span().start as usize..s.span().end as usize];
        let mut last = None;
        for (j, statement) in statements.iter().enumerate().skip(i + 1) {
            let t = text(statement);
            if !writes_name(t, name) {
                break;
            }
            let mut returns = Vec::new();
            collect_returns(std::slice::from_ref(statement), &mut returns);
            if !returns.is_empty()
                || matches!(statement, Statement::VariableDeclaration(_) | Statement::FunctionDeclaration(_))
                || writes_state(self, statement)
            {
                break;
            }
            last = Some(j);
        }
        let last = last?;
        // Read after it is built (a `let` never written after is a plain member).
        Some((name.to_string(), last))
    }

    /// The member for [`Tr::built_value`]: `let x = { var x = init … return x }()`.
    fn built_member(&mut self, name: &str, statements: &[Statement], first: usize, last: usize) -> String {
        let Statement::VariableDeclaration(v) = &statements[first] else { unreachable!() };
        let d = &v.declarations[0];
        let saved = self.scope.clone();
        let declared = match &d.init {
            Some(init) => self.let_decl(d, init, false),
            // `let body; if (c) { body = a } else { body = b }`: the branches give it.
            None if first + 1 == last && assigns_every_branch(&statements[last], name) => {
                let saved_assign = self.scope.assign_returns.replace(name.to_string());
                let body = self.block_stmts(&statements[last..=last], statements[last].span().end, false);
                self.scope.assign_returns = saved_assign;
                self.scope = saved;
                let outer = self.bind(name, d.span);
                return format!("let {outer} = {{\n{body}\n}}()");
            }
            // `let label: string;` then assigned on every path (TS checks it): any start value.
            None => {
                let ty = d.type_annotation.as_ref().map(|t| self.ty(&t.type_annotation));
                let start = match ty.as_deref() {
                    Some("String") => "\"\"",
                    Some("Float") | Some("Int") => "0",
                    Some("Bool") => "false",
                    Some(t) if t.ends_with('?') => "none",
                    _ => {
                        self.scope = saved;
                        return self.refuse("view:mutable", "a `let` without a value in a view", d.span);
                    }
                };
                format!("var {name}: {} = {start}", ty.unwrap_or_default())
            }
        };
        let declared = declared.replacen("let ", "var ", 1);
        let body = self.block_stmts(&statements[first + 1..=last], statements[last].span().end, false);
        self.scope = saved;
        let outer = self.bind(name, d.span);
        format!("let {outer} = {{\n{declared}\n{body}\nreturn {name}\n}}()")
    }

    /// A `switch` as a `match` on its literals (an `if` chain on other cases): each
    /// case group ends in `break`, `return` or `throw`; a fallthrough into a case
    /// with statements of its own is refused.
    fn switch(&mut self, s: &oxc_ast::ast::SwitchStatement) -> String {
        // The groups: the tests, whether `default` is among them, and what they run.
        let mut groups: Vec<(Vec<&Expression>, bool, &[Statement])> = Vec::new();
        let mut tests = Vec::new();
        let mut default = false;
        for (i, case) in s.cases.iter().enumerate() {
            match &case.test {
                Some(t) => tests.push(t),
                None => default = true,
            }
            if case.consequent.is_empty() && i + 1 < s.cases.len() {
                continue;
            }
            let mut body: &[Statement] = &case.consequent;
            // A block body (`case x: { … }`) is its statements.
            if let [Statement::BlockStatement(b)] = body {
                body = &b.body;
            }
            let ends = match body.last() {
                Some(Statement::BreakStatement(b)) if b.label.is_none() => {
                    body = &body[..body.len() - 1];
                    true
                }
                Some(Statement::ReturnStatement(_) | Statement::ThrowStatement(_)) => true,
                None => true,
                _ => i + 1 == s.cases.len(),
            };
            if !ends || body.iter().any(has_break) {
                return self.refuse(
                    "statement:switch",
                    "a `switch` case that falls through or breaks early",
                    case.span,
                );
            }
            groups.push((std::mem::take(&mut tests), std::mem::replace(&mut default, false), body));
        }
        let literal = |e: &Expression| {
            matches!(e.without_parentheses(), Expression::StringLiteral(_) | Expression::NumericLiteral(_))
        };
        let subject = self.head_expr(&s.discriminant);
        let end = s.span.end;
        let all_literal = groups.iter().all(|(tests, ..)| tests.iter().all(|t| literal(t)));
        let mut arms = Vec::new();
        let mut fallback = None;
        for (tests, default, body) in &groups {
            let saved = self.scope.clone();
            let text = self.block_stmts(body, end, false);
            self.scope = saved;
            if *default {
                fallback = Some(text);
                continue;
            }
            let values: Vec<String> = tests.iter().map(|t| self.expr(t)).collect();
            arms.push((values, text));
        }
        // Every case returns a value and there is no `default`: TS's exhaustive `switch` on a
        // literal union (a function that returns from it), so no `case _` (bloomc checks it).
        let exhaustive = fallback.is_none()
            && groups.iter().all(|(_, _, body)| {
                matches!(body.last(), Some(Statement::ReturnStatement(r)) if r.argument.is_some())
            });
        if all_literal {
            let mut lines: Vec<String> = arms
                .into_iter()
                .map(|(v, text)| format!("case {} => {{\n{text}\n}}", v.join(" | ")))
                .collect();
            if !exhaustive {
                lines.push(format!("case _ => {{\n{}\n}}", fallback.unwrap_or_default()));
            }
            return format!("match {subject} {{\n{}\n}}", lines.join("\n"));
        }
        // Cases of TS values: an `if` chain on `==` (the `switch`'s `===`).
        if !crate::expr::is_postfix_text(&subject) {
            return self.refuse(
                "statement:switch",
                "a `switch` on a computed value with cases that are not literals",
                s.span,
            );
        }
        let branches: Vec<String> = arms
            .into_iter()
            .map(|(values, text)| {
                let test: Vec<String> = values.iter().map(|v| format!("{subject} == {v}")).collect();
                format!("if {} {{\n{text}\n}}", test.join(" || "))
            })
            .collect();
        let mut out = branches.join(" else ");
        if let Some(f) = fallback {
            out = if out.is_empty() { f } else { format!("{out} else {{\n{f}\n}}") };
        }
        out
    }

    fn block_of(&mut self, statement: &Statement) -> String {
        match statement {
            Statement::BlockStatement(b) => self.block_stmts(&b.body, b.span.end, false),
            other => self.stmt(other),
        }
    }

    /// An expression in statement position: a setter call is an assignment.
    /// Whether `e` (a branch of a statement's `?:` or `&&`) calls a state setter.
    fn writes_state(&self, e: &Expression) -> bool {
        match e.without_parentheses() {
            Expression::CallExpression(call) => matches!(
                &call.callee,
                Expression::Identifier(id) if self.scope.setters.contains_key(id.name.as_str())
            ),
            Expression::ConditionalExpression(c) => {
                self.writes_state(&c.consequent) || self.writes_state(&c.alternate)
            }
            _ => false,
        }
    }

    pub fn stmt_expr(&mut self, e: &Expression) -> String {
        match e {
            Expression::CallExpression(call)
                if let Expression::StaticMemberExpression(m) = &call.callee
                    && let Expression::Identifier(object) = &m.object
                    && let Some(kind) = self.scope.collections.get(object.name.as_str())
                    && (kind == "Array")
                        == matches!(m.property.name.as_str(), "push" | "unshift" | "splice")
                    && matches!(
                        m.property.name.as_str(),
                        "add" | "set" | "delete" | "clear" | "push" | "unshift" | "splice"
                    ) =>
            {
                // `s.add(x)` changes `s` in place; a Bloom `Set` is a value, so it is reassigned.
                let name = self.name(&object.name, object.span);
                let args: Vec<String> = call
                    .arguments
                    .iter()
                    .map(|a| a.as_expression().map_or_else(String::new, |e| self.expr(e)))
                    .collect();
                let method = match m.property.name.as_str() {
                    // `xs.push(a, b)`: a Bloom list is a value too.
                    "push" => return format!("{name} = [..{name}, {}]", args.join(", ")),
                    "unshift" => return format!("{name} = [{}, ..{name}]", args.join(", ")),
                    // `xs.splice(i, 1)`: the list without its `i`th element.
                    "splice" if args.len() == 2 && args[1] == "1" => {
                        return format!("{name} = {name}.removing(at: {})", args[0]);
                    }
                    "splice" => return self.refuse("mutation", "`splice` other than `(i, 1)`", call.span),
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
                let list = self.head_expr(&m.object);
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
            // `() => (c ? setStep('edit') : back())`: the parentheses say nothing here.
            Expression::ParenthesizedExpression(p)
                if self.writes_state(&p.expression)
                    || matches!(p.expression.without_parentheses(), Expression::LogicalExpression(l)
                        if l.operator == LogicalOperator::And && self.writes_state(&l.right)) =>
            {
                self.stmt_expr(p.expression.without_parentheses())
            }
            // `c ? setStep('edit') : back?.()` as a statement (a handler's body): its value is
            // unused, so it is an `if`, and each branch a statement (a setter writes the state).
            Expression::ConditionalExpression(c)
                if self.writes_state(&c.consequent) || self.writes_state(&c.alternate) =>
            {
                let test = self.test(&c.test, false);
                let test = crate::expr::strip_parens(&test).to_string();
                let then = self.stmt_expr(c.consequent.without_parentheses());
                let otherwise = self.stmt_expr(c.alternate.without_parentheses());
                format!("if {test} {{\n{then}\n}} else {{\n{otherwise}\n}}")
            }
            // `ready && setOpen(true)` as a statement: an `if`.
            Expression::LogicalExpression(l)
                if l.operator == LogicalOperator::And && self.writes_state(&l.right) =>
            {
                let test = self.test(&l.left, false);
                let test = crate::expr::strip_parens(&test).to_string();
                let then = self.stmt_expr(l.right.without_parentheses());
                format!("if {test} {{\n{then}\n}}")
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
                    // A branch's last write of a value the branches give: its `return`.
                    AssignmentTarget::AssignmentTargetIdentifier(id)
                        if op == "=" && self.scope.assign_returns.as_deref() == Some(id.name.as_str()) =>
                    {
                        return format!("return {}", self.expr(&a.right));
                    }
                    AssignmentTarget::AssignmentTargetIdentifier(id) => self.name(&id.name, id.span),
                    // `r.current = v`: a `@ref` is written by its name.
                    AssignmentTarget::StaticMemberExpression(m)
                        if m.property.name == "current"
                            && matches!(&m.object, Expression::Identifier(o) if self.scope.refs.contains(o.name.as_str())) =>
                    {
                        let Expression::Identifier(o) = &m.object else { unreachable!() };
                        self.name(&o.name, o.span)
                    }
                    // `params.q = v` on a local object literal: `params = { ..params, q: v }`.
                    AssignmentTarget::StaticMemberExpression(m)
                        if let Expression::Identifier(o) = &m.object
                            && self.scope.grown.get(o.name.as_str()) == Some(&false)
                            && op != "*=" =>
                    {
                        let name = self.name(&o.name, o.span);
                        let field = m.property.name.as_str();
                        let value = self.expr(&a.right);
                        let value = match op {
                            "=" => value,
                            op => format!("{name}.{field} {} {value}", &op[..1]),
                        };
                        return format!("{name} = {{ ..{name}, {field}: {value} }}");
                    }
                    // `counts[k] = v` on a local object literal: `counts = counts.setting(k, v)`.
                    AssignmentTarget::ComputedMemberExpression(m)
                        if let Expression::Identifier(o) = &m.object
                            && self.scope.grown.get(o.name.as_str()) == Some(&true)
                            && op != "*=" =>
                    {
                        let name = self.name(&o.name, o.span);
                        let key = self.expr(&m.expression);
                        let value = self.expr(&a.right);
                        let value = match op {
                            "=" => value,
                            op => format!("({name}[{key}] ?? 0) {} {value}", &op[..1]),
                        };
                        return format!("{name} = {name}.setting({key}, {value})");
                    }
                    // `player.loop = true`: a field of a TS value is TS's to write (spec 4.6);
                    // on a Bloom value the checker refuses it.
                    AssignmentTarget::StaticMemberExpression(m) => {
                        format!("{}.{}", self.expr(&m.object), m.property.name)
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
                SimpleAssignmentTarget::StaticMemberExpression(m) => {
                    let op = if u.operator == oxc_syntax::operator::UpdateOperator::Increment {
                        "+="
                    } else {
                        "-="
                    };
                    format!("{}.{} {op} 1", self.expr(&m.object), m.property.name)
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
                // `[a, b]`: re-run when any changes, as React's deps (a tuple `id:` is flat).
                elements if elements.iter().all(|e| e.as_expression().is_some()) => {
                    let deps: Vec<String> = elements.iter().map(|e| self.expr(e.to_expression())).collect();
                    format!("effect(id: ({}))", deps.join(", "))
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
        // TS's `try`/`catch` is 2.0's `do`/`catch`: a TS `await` in it is `try await`, a throw
        // anywhere in it (sync or a rejection) is caught, and a `return` returns from the function.
        self.do_catch(t, handler, finalizer)
    }

    /// `try { … } catch (e) { … }` as `do { … } catch let e { … }` (`catch { … }` when the error
    /// is unnamed, Swift's implicit `error`).
    fn do_catch(
        &mut self,
        t: &oxc_ast::ast::TryStatement,
        handler: &oxc_ast::ast::CatchClause,
        finalizer: Option<String>,
    ) -> String {
        // A state named like the caught error (`error`, Swift's implicit one too): the handler's
        // `error = …` writes the state, so the caught value takes another name.
        let state_named = |tr: &Self, name: &str| tr.scope.setters.values().any(|s| s.state == name);
        let shadow = match handler.param.as_ref().map(|p| &p.pattern) {
            Some(BindingPattern::BindingIdentifier(id)) if state_named(self, &id.name) => {
                Some(id.name.to_string())
            }
            None if state_named(self, "error") => Some(String::new()),
            _ => None,
        };
        let catch = match handler.param.as_ref().map(|p| &p.pattern) {
            _ if shadow.is_some() => "catch let caught".to_string(),
            Some(BindingPattern::BindingIdentifier(id)) => {
                let name = self.bind(&id.name, id.span);
                if name == "error" { "catch".to_string() } else { format!("catch let {name}") }
            }
            None => "catch".into(),
            Some(other) => {
                return self.refuse("try:pattern", "a destructured `catch` parameter", other.span());
            }
        };
        let propagate = std::mem::replace(&mut self.propagate, false);
        let returning = std::mem::replace(&mut self.try_return, false);
        let in_do = std::mem::replace(&mut self.in_do, true);
        let block = self.block_stmts(&t.block.body, t.block.span.end, false);
        self.in_do = in_do;
        let renamed = shadow.as_ref().map(|ts| {
            let previous = (!ts.is_empty()).then(|| self.scope.renames.insert(ts.clone(), "caught".into()));
            (ts.clone(), previous)
        });
        let err = self.block_stmts(&handler.body.body, handler.body.span.end, false);
        if let Some((ts, previous)) = renamed {
            match previous {
                Some(Some(p)) => {
                    self.scope.renames.insert(ts, p);
                }
                Some(None) => {
                    self.scope.renames.remove(&ts);
                }
                None => {}
            }
        }
        self.propagate = propagate;
        self.try_return = returning;
        let defer = finalizer.map(|f| format!("{f}\n")).unwrap_or_default();
        format!("{defer}do {{\n{block}\n}} {catch} {{\n{err}\n}}")
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
/// Whether `name`'s fields are written in `src`: `Some(true)` when only by key
/// (`name[k] = v`), `Some(false)` when only by name (`name.f = v`), `None` when
/// neither or both.
fn field_writes(src: &str, name: &str) -> Option<bool> {
    let mut by_key = false;
    let mut by_name = false;
    for (i, _) in src.match_indices(name) {
        if src[..i].ends_with(|c: char| c.is_alphanumeric() || c == '_' || c == '.') {
            continue;
        }
        let rest = &src[i + name.len()..];
        let target_end = if let Some(r) = rest.strip_prefix('[') {
            r.find(']').map(|j| (true, j + 2))
        } else if let Some(r) = rest.strip_prefix('.') {
            let j = r.find(|c: char| !(c.is_alphanumeric() || c == '_')).unwrap_or(r.len());
            (j > 0).then_some((false, j + 1))
        } else {
            None
        };
        let Some((keyed, end)) = target_end else { continue };
        let after = rest[end..].trim_start();
        let assigns = (after.starts_with('=') && !after.starts_with("==") && !after.starts_with("=>"))
            || after.starts_with("+=")
            || after.starts_with("-=");
        if assigns {
            if keyed { by_key = true } else { by_name = true }
        }
    }
    match (by_key, by_name) {
        (true, false) => Some(true),
        (false, true) => Some(false),
        _ => None,
    }
}

/// Whether `name.push(` occurs in `src` (as a name of its own, not `a.name.push(`).
fn pushes(src: &str, name: &str) -> bool {
    ["push", "unshift", "splice"].iter().any(|m| {
        let needle = format!("{name}.{m}(");
        src.match_indices(&needle)
            .any(|(i, _)| !src[..i].ends_with(|c: char| c.is_alphanumeric() || c == '_' || c == '.'))
    })
}

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
pub fn local_object<'b, 'a>(module: &'b [Statement<'a>], name: &str) -> Option<Vec<&'b TSSignature<'a>>> {
    for statement in module {
        let declaration = match statement {
            Statement::ExportDeclaration(e) => Some(&e.declaration),
            other => other.as_declaration(),
        };
        match declaration {
            Some(Declaration::TSInterfaceDeclaration(i)) if i.id.name == name && i.extends.is_empty() => {
                return Some(i.body.body.iter().collect());
            }
            // `interface P extends Q { … }` with `Q` an object type here: Q's members, then P's.
            Some(Declaration::TSInterfaceDeclaration(i)) if i.id.name == name => {
                let [heritage] = i.extends.as_slice() else { return None };
                let TSTypeName::IdentifierReference(base) = &heritage.type_name else { return None };
                if heritage.type_arguments.is_some() || base.name == name {
                    return None;
                }
                let mut members = local_object(module, &base.name)?;
                members.extend(i.body.body.iter());
                return Some(members);
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

/// A local `interface name extends Base { … }` (one base, a plain name): its own
/// members and the base's name.
fn local_extends<'b, 'a>(
    module: &'b [Statement<'a>],
    name: &str,
) -> Option<(Vec<&'b TSSignature<'a>>, String)> {
    for statement in module {
        let declaration = match statement {
            Statement::ExportDeclaration(e) => Some(&e.declaration),
            other => other.as_declaration(),
        };
        if let Some(Declaration::TSInterfaceDeclaration(i)) = declaration
            && i.id.name == name
            && let [heritage] = i.extends.as_slice()
            && heritage.type_arguments.is_none()
            && let TSTypeName::IdentifierReference(base) = &heritage.type_name
        {
            return Some((i.body.body.iter().collect(), base.name.to_string()));
        }
    }
    None
}

pub fn key_name(key: &PropertyKey) -> Option<String> {
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
    use oxc_syntax::operator::BinaryOperator as B;
    match e.without_parentheses() {
        Expression::StringLiteral(_) | Expression::TemplateLiteral(_) => Some("String"),
        Expression::BooleanLiteral(_) => Some("Bool"),
        Expression::NumericLiteral(_) => Some("Float"),
        Expression::UnaryExpression(u) if u.operator == UnaryOperator::LogicalNot => Some("Bool"),
        // `() => { … }` with no value returned: a Unit callback (`withHaptic(h) => () => { … }`).
        Expression::ArrowFunctionExpression(a)
            if a.params.items.is_empty()
                && a.params.rest.is_none()
                && !a.r#async
                && a.get_expression().is_none()
                && return_values(arrow_statements(a)).is_empty() =>
        {
            Some("() -> Unit")
        }
        // `Boolean(x)`, `String(x)`: the JS conversions.
        Expression::CallExpression(c)
            if c.arguments.len() == 1
                && matches!(&c.callee, Expression::Identifier(id) if id.name == "Boolean" || id.name == "String") =>
        {
            match &c.callee {
                Expression::Identifier(id) if id.name == "Boolean" => Some("Bool"),
                _ => Some("String"),
            }
        }
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

pub fn is_hook_name(name: &str) -> bool {
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

/// Whether `statement` (an `if` that does not return) only writes states: each of
/// its branches' statements is a state setter's call.
fn only_state_writes(tr: &Tr, statement: &Statement) -> bool {
    match statement {
        Statement::IfStatement(s) => {
            only_state_writes(tr, &s.consequent)
                && s.alternate.as_ref().is_none_or(|a| only_state_writes(tr, a))
        }
        Statement::BlockStatement(b) => !b.body.is_empty() && b.body.iter().all(|s| only_state_writes(tr, s)),
        Statement::ExpressionStatement(e) => matches!(
            e.expression.without_parentheses(),
            Expression::CallExpression(call)
                if matches!(&call.callee, Expression::Identifier(id) if tr.scope.setters.contains_key(id.name.as_str()))
        ),
        _ => false,
    }
}

/// Whether a statement is `continue` (or a block of only that).
fn is_continue(statement: &Statement) -> bool {
    match statement {
        Statement::ContinueStatement(c) => c.label.is_none(),
        Statement::BlockStatement(b) => matches!(b.body.as_slice(), [only] if is_continue(only)),
        _ => false,
    }
}

/// Whether a `break` (of the enclosing `switch`) occurs in `statement`, outside loops.
fn has_break(statement: &Statement) -> bool {
    match statement {
        Statement::BreakStatement(_) => true,
        Statement::IfStatement(i) => has_break(&i.consequent) || i.alternate.as_ref().is_some_and(has_break),
        Statement::BlockStatement(b) => b.body.iter().any(has_break),
        Statement::TryStatement(t) => {
            t.block.body.iter().any(has_break)
                || t.handler.as_ref().is_some_and(|h| h.body.body.iter().any(has_break))
                || t.finalizer.as_ref().is_some_and(|f| f.body.iter().any(has_break))
        }
        _ => false,
    }
}

/// Whether `text` writes `name`: `name = …`, `name += …`, `name.f = …`,
/// `name[k] = …` or `name.push(…)`.
fn writes_name(text: &str, name: &str) -> bool {
    text.match_indices(name).any(|(i, _)| {
        if text[..i].ends_with(|c: char| c.is_alphanumeric() || c == '_' || c == '.') {
            return false;
        }
        let mut rest = &text[i + name.len()..];
        if rest.starts_with(|c: char| c.is_alphanumeric() || c == '_') {
            return false;
        }
        if rest.starts_with(".push(") {
            return true;
        }
        if let Some(r) = rest.strip_prefix('[') {
            let Some(j) = r.find(']') else { return false };
            rest = &r[j + 1..];
        } else if let Some(r) = rest.strip_prefix('.') {
            let j = r.find(|c: char| !(c.is_alphanumeric() || c == '_')).unwrap_or(r.len());
            rest = &r[j..];
        }
        let after = rest.trim_start();
        (after.starts_with('=') && !after.starts_with("==") && !after.starts_with("=>"))
            || after.starts_with("+=")
            || after.starts_with("-=")
    })
}

/// Whether `statement` is an `if`/`else` chain with a final `else` whose every branch
/// ends with `name = …` and writes `name` nowhere else.
fn assigns_every_branch(statement: &Statement, name: &str) -> bool {
    let ends_with_write = |s: &Statement| {
        let body = branch(s);
        let Some((last, rest)) = body.split_last() else { return false };
        let writes = |s: &Statement| {
            matches!(s, Statement::ExpressionStatement(e)
            if matches!(&e.expression, Expression::AssignmentExpression(a)
                if a.operator == AssignmentOperator::Assign
                    && matches!(&a.left, AssignmentTarget::AssignmentTargetIdentifier(id) if id.name == name)))
        };
        writes(last) && !rest.iter().any(writes)
    };
    match statement {
        Statement::IfStatement(s) => {
            ends_with_write(&s.consequent)
                && match &s.alternate {
                    Some(Statement::IfStatement(_)) => {
                        assigns_every_branch(s.alternate.as_ref().unwrap(), name)
                    }
                    Some(other) => ends_with_write(other),
                    None => false,
                }
        }
        _ => false,
    }
}

/// Whether `statement` calls a state setter while it runs (not in a closure it makes).
fn writes_state(tr: &Tr, statement: &Statement) -> bool {
    match statement {
        Statement::IfStatement(s) => {
            writes_state(tr, &s.consequent) || s.alternate.as_ref().is_some_and(|a| writes_state(tr, a))
        }
        Statement::BlockStatement(b) => b.body.iter().any(|s| writes_state(tr, s)),
        Statement::ForOfStatement(f) => writes_state(tr, &f.body),
        Statement::ExpressionStatement(e) => matches!(
            e.expression.without_parentheses(),
            Expression::CallExpression(call)
                if matches!(&call.callee, Expression::Identifier(id) if tr.scope.setters.contains_key(id.name.as_str()))
        ),
        _ => false,
    }
}

/// The awaited call an `if` tests: `await f()`, `!(await f())`, parenthesised.
fn awaited_test<'b, 'a>(test: &'b Expression<'a>) -> Option<&'b Expression<'a>> {
    match test.without_parentheses() {
        Expression::AwaitExpression(a) => Some(&a.argument),
        Expression::UnaryExpression(u) if u.operator == UnaryOperator::LogicalNot => {
            awaited_test(&u.argument)
        }
        _ => None,
    }
}

/// A literal default (`false`, `0`, `-1`, `"x"`): it reads nothing, so it may be a stored
/// property's default.
fn is_constant(e: &Expression) -> bool {
    match e.without_parentheses() {
        Expression::BooleanLiteral(_) | Expression::NumericLiteral(_) | Expression::StringLiteral(_) => true,
        Expression::UnaryExpression(u) => {
            u.operator == oxc_syntax::operator::UnaryOperator::UnaryNegation
                && matches!(u.argument, Expression::NumericLiteral(_))
        }
        _ => false,
    }
}
