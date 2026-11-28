//! What an unannotated TS function returns (R7), read from its body the way TS infers it,
//! for the shapes hooks are written in: a returned object of `useState` pairs, `useCallback`s,
//! literals, comparisons and ternaries. What it cannot tell is `Other` (`Foreign`, which
//! TS checks); a call or a name of the module is `ReturnType<typeof f>` / `typeof x`, resolved
//! when the summary is mapped.

use rustc_hash::FxHashMap as HashMap;

use oxc_ast::ast::{
    Argument, ArrayExpressionElement, ArrowFunctionBody, BinaryOperator, BindingPattern, Expression,
    FormalParameters, FunctionBody, LogicalOperator, ObjectPropertyKind, PropertyKind, Statement,
    UnaryOperator,
};

use super::{Reader, TsFn, TsMember, TsParam, TsType};

/// The names a body binds, as they are known so far.
type Env = HashMap<String, TsType>;

impl Reader {
    /// What a declared function returns when it is not annotated (`function useX() { … }`).
    pub(super) fn infer_function(&self, function: &oxc_ast::ast::Function) -> Option<TsType> {
        if function.return_type.is_some() || function.generator {
            return None;
        }
        let body = function.body.as_ref()?;
        match self.fn_expr(&function.params, None, body, function.r#async, &Env::default()) {
            TsType::Fn(f) => f.inferred,
            _ => None,
        }
    }

    /// The type of a module-level `const`'s initializer when it is plain data (`export const
    /// GAP = 12`, a record or list of literals); anything else (a call, a component, a
    /// function) stays the TS value it is.
    pub(super) fn infer_init(&self, init: &Expression) -> Option<TsType> {
        // `const MAX = 4`: an `Int`, as Bloom writes it (it widens to `Float` where one is expected).
        if let Expression::NumericLiteral(n) = init
            && n.value.fract() == 0.0
            && n.value.abs() < 9_007_199_254_740_992.0
        {
            return Some(TsType::Int);
        }
        Some(self.expr(init, &Env::default())).filter(plain)
    }

    /// What an arrow returns when it is not annotated (`const useX = () => …`).
    pub(super) fn infer_arrow(&self, arrow: &oxc_ast::ast::ArrowFunctionExpression) -> Option<TsType> {
        if arrow.return_type.is_some() {
            return None;
        }
        self.infer_body(&arrow.params, &arrow.body, arrow.r#async, &Env::default())
    }

    /// The type a function body returns: `None` when it has none to read (a body with no
    /// `return` of a value is `void`). `asynchronous` wraps it in a `Promise`.
    pub(super) fn infer_body(
        &self,
        params: &FormalParameters,
        body: &ArrowFunctionBody,
        asynchronous: bool,
        outer: &Env,
    ) -> Option<TsType> {
        let mut env = outer.clone();
        for param in &params.items {
            let ty = param.type_annotation.as_ref().map_or(TsType::Other, |t| self.ty(&t.type_annotation));
            bind(&mut env, &param.pattern, ty);
        }
        let ret = match body {
            ArrowFunctionBody::FunctionBody(block) => self.block_returns(block, &mut env),
            expression => self.expr(expression.to_expression(), &env),
        };
        Some(if asynchronous { TsType::Ref("Promise".into(), vec![ret]) } else { ret })
    }

    fn block_returns(&self, body: &FunctionBody, env: &mut Env) -> TsType {
        let mut returns = Vec::new();
        self.body_statements(&body.statements, env, &mut returns);
        join(returns)
    }

    /// Reads `statements` in order: each `const`/`let` binds its names, each `return` adds its
    /// type. Nested blocks are read for their returns, with their own names.
    fn body_statements(&self, statements: &[Statement], env: &mut Env, returns: &mut Vec<TsType>) {
        for statement in statements {
            self.body_statement(statement, env, returns);
        }
    }

    fn body_statement(&self, statement: &Statement, env: &mut Env, returns: &mut Vec<TsType>) {
        match statement {
            Statement::VariableDeclaration(variables) => {
                for declarator in &variables.declarations {
                    let annotated = declarator.type_annotation.as_ref().map(|t| self.ty(&t.type_annotation));
                    match (&declarator.id, declarator.init.as_ref()) {
                        // `const [value, setValue] = useState<T>(initial)`.
                        (BindingPattern::ArrayPattern(pattern), Some(Expression::CallExpression(call)))
                            if callee_name(&call.callee) == Some("useState") =>
                        {
                            let value = match call.type_arguments.as_ref().and_then(|a| a.params.first()) {
                                Some(t) => self.ty(t),
                                None => match call.arguments.first() {
                                    // `useState(() => initial)`.
                                    Some(Argument::ArrowFunctionExpression(arrow)) => self
                                        .infer_body(&arrow.params, &arrow.body, false, env)
                                        .unwrap_or(TsType::Other),
                                    Some(arg) => match arg.as_expression() {
                                        Some(e) => self.expr(e, env),
                                        None => TsType::Other,
                                    },
                                    None => TsType::Union(vec![TsType::Other, TsType::Undefined]),
                                },
                            };
                            let setter = TsType::Fn(Box::new(TsFn {
                                type_params: Vec::new(),
                                bounded: Vec::new(),
                                params: vec![TsParam {
                                    name: "value".into(),
                                    ty: Some(value.clone()),
                                    optional: false,
                                    rest: false,
                                }],
                                ret: Some(TsType::Void),
                                inferred: None,
                            }));
                            let mut items = pattern.elements.iter();
                            if let Some(Some(first)) = items.next() {
                                bind(env, first, value);
                            }
                            if let Some(Some(second)) = items.next() {
                                bind(env, second, setter);
                            }
                        }
                        (pattern, init) => {
                            let ty = annotated
                                .or_else(|| init.map(|e| self.expr(e, env)))
                                .unwrap_or(TsType::Other);
                            bind(env, pattern, ty);
                        }
                    }
                }
            }
            Statement::FunctionDeclaration(function) => {
                if let (Some(id), Some(body)) = (&function.id, &function.body) {
                    let ty = self.fn_expr(
                        &function.params,
                        function.return_type.as_ref(),
                        body,
                        function.r#async,
                        env,
                    );
                    env.insert(id.name.to_string(), ty);
                }
            }
            Statement::ReturnStatement(ret) => {
                returns.push(match &ret.argument {
                    Some(argument) => self.expr(argument, env),
                    None => TsType::Undefined,
                });
            }
            Statement::BlockStatement(block) => {
                let mut inner = env.clone();
                self.body_statements(&block.body, &mut inner, returns);
            }
            Statement::IfStatement(branch) => {
                for arm in std::iter::once(&branch.consequent).chain(branch.alternate.as_ref()) {
                    let mut inner = env.clone();
                    self.body_statement(arm, &mut inner, returns);
                }
            }
            Statement::TryStatement(attempt) => {
                let mut inner = env.clone();
                self.body_statements(&attempt.block.body, &mut inner, returns);
                if let Some(handler) = &attempt.handler {
                    let mut inner = env.clone();
                    self.body_statements(&handler.body.body, &mut inner, returns);
                }
            }
            // A loop or a switch may return: what it returns is not read here.
            Statement::ForStatement(_)
            | Statement::ForInStatement(_)
            | Statement::ForOfStatement(_)
            | Statement::WhileStatement(_)
            | Statement::DoWhileStatement(_)
            | Statement::SwitchStatement(_)
                if contains_return(statement) =>
            {
                returns.push(TsType::Other);
            }
            _ => {}
        }
    }

    fn fn_expr(
        &self,
        params: &FormalParameters,
        annotated: Option<&oxc_allocator::Box<oxc_ast::ast::TSTypeAnnotation>>,
        body: &FunctionBody,
        asynchronous: bool,
        env: &Env,
    ) -> TsType {
        let mut function = self.function(&None, params, annotated.map(|t| &t.type_annotation));
        if function.ret.is_none() {
            let mut inner = env.clone();
            for param in &params.items {
                let ty =
                    param.type_annotation.as_ref().map_or(TsType::Other, |t| self.ty(&t.type_annotation));
                bind(&mut inner, &param.pattern, ty);
            }
            let ret = self.block_returns(body, &mut inner);
            function.inferred =
                Some(if asynchronous { TsType::Ref("Promise".into(), vec![ret]) } else { ret });
        }
        TsType::Fn(Box::new(function))
    }

    /// The type of an expression in `env`.
    fn expr(&self, expr: &Expression, env: &Env) -> TsType {
        match expr {
            Expression::StringLiteral(_) | Expression::TemplateLiteral(_) => TsType::String,
            Expression::NumericLiteral(_) => TsType::Number,
            Expression::BooleanLiteral(_) => TsType::Boolean,
            Expression::NullLiteral(_) => TsType::Null,
            Expression::Identifier(id) => match id.name.as_str() {
                "undefined" => TsType::Undefined,
                name => env.get(name).cloned().unwrap_or_else(|| TsType::Query(name.to_string())),
            },
            Expression::ParenthesizedExpression(inner) => self.expr(&inner.expression, env),
            Expression::TSAsExpression(cast) => match &cast.type_annotation {
                // `x as const`: what `x` is.
                oxc_ast::ast::TSType::TSTypeReference(r) if matches!(&r.type_name, oxc_ast::ast::TSTypeName::IdentifierReference(n) if n.name == "const") => {
                    self.expr(&cast.expression, env)
                }
                annotation => self.ty(annotation),
            },
            Expression::TSSatisfiesExpression(check) => self.expr(&check.expression, env),
            Expression::TSTypeAssertion(cast) => self.ty(&cast.type_annotation),
            Expression::TSNonNullExpression(inner) => match self.expr(&inner.expression, env) {
                TsType::Union(members) => join(
                    members.into_iter().filter(|m| !matches!(m, TsType::Undefined | TsType::Null)).collect(),
                ),
                other => other,
            },
            Expression::AwaitExpression(inner) => match self.expr(&inner.argument, env) {
                TsType::Ref(name, mut args) if name == "Promise" && args.len() == 1 => args.remove(0),
                TsType::Ref(..) | TsType::Query(_) | TsType::Returns(_) | TsType::Other => TsType::Other,
                other => other,
            },
            Expression::UnaryExpression(unary) => match unary.operator {
                UnaryOperator::LogicalNot | UnaryOperator::Delete => TsType::Boolean,
                UnaryOperator::Typeof => TsType::String,
                UnaryOperator::Void => TsType::Undefined,
                _ => TsType::Number,
            },
            Expression::UpdateExpression(_) => TsType::Number,
            Expression::BinaryExpression(binary) => {
                let op = binary.operator;
                if op.is_equality() || op.is_compare() || op.is_relational() {
                    return TsType::Boolean;
                }
                if op == BinaryOperator::Addition {
                    return match (self.expr(&binary.left, env), self.expr(&binary.right, env)) {
                        (TsType::Number, TsType::Number) => TsType::Number,
                        (TsType::String, _) | (_, TsType::String) => TsType::String,
                        _ => TsType::Other,
                    };
                }
                TsType::Number
            }
            Expression::LogicalExpression(logical) => {
                let left = self.expr(&logical.left, env);
                let right = self.expr(&logical.right, env);
                match logical.operator {
                    LogicalOperator::And | LogicalOperator::Or
                        if matches!(left, TsType::Boolean) && matches!(right, TsType::Boolean) =>
                    {
                        TsType::Boolean
                    }
                    // `x ?? fallback`: `x` without its `undefined`, or the fallback.
                    LogicalOperator::Coalesce => match left {
                        TsType::Union(members) => {
                            let mut present: Vec<TsType> = members
                                .into_iter()
                                .filter(|m| !matches!(m, TsType::Undefined | TsType::Null))
                                .collect();
                            present.push(right);
                            join(present)
                        }
                        TsType::Undefined | TsType::Null => right,
                        TsType::Other | TsType::Query(_) | TsType::Returns(_) | TsType::Ref(..) => {
                            TsType::Other
                        }
                        present => present,
                    },
                    _ => TsType::Other,
                }
            }
            Expression::ConditionalExpression(branch) => {
                join(vec![self.expr(&branch.consequent, env), self.expr(&branch.alternate, env)])
            }
            Expression::ArrayExpression(array) => {
                let mut items = Vec::new();
                for element in &array.elements {
                    match element {
                        ArrayExpressionElement::SpreadElement(_) | ArrayExpressionElement::Elision(_) => {
                            return TsType::Other;
                        }
                        other => match other.as_expression() {
                            Some(e) => items.push(self.expr(e, env)),
                            None => return TsType::Other,
                        },
                    }
                }
                if items.is_empty() {
                    return TsType::Other;
                }
                TsType::Array(Box::new(join(items)))
            }
            Expression::ObjectExpression(object) => {
                let mut members = Vec::new();
                for property in &object.properties {
                    let ObjectPropertyKind::ObjectProperty(property) = property else { return TsType::Other };
                    if property.computed || property.kind != PropertyKind::Init {
                        return TsType::Other;
                    }
                    let Some(name) = super::key_name(&property.key) else { return TsType::Other };
                    let ty = self.expr(&property.value, env);
                    members.retain(|m: &TsMember| m.name != name);
                    members.push(TsMember { name, optional: false, ty });
                }
                TsType::Object(members)
            }
            Expression::ArrowFunctionExpression(arrow) => {
                let mut function = self.function(
                    &arrow.type_parameters,
                    &arrow.params,
                    arrow.return_type.as_ref().map(|t| &t.type_annotation),
                );
                if function.ret.is_none() {
                    function.inferred = self.infer_body(&arrow.params, &arrow.body, arrow.r#async, env);
                }
                TsType::Fn(Box::new(function))
            }
            Expression::FunctionExpression(function) => match &function.body {
                Some(body) if function.type_parameters.is_none() => {
                    self.fn_expr(&function.params, function.return_type.as_ref(), body, function.r#async, env)
                }
                _ => TsType::Other,
            },
            Expression::CallExpression(call) => self.call(call, env),
            Expression::StaticMemberExpression(member) => {
                let object = self.expr(&member.object, env);
                let name = member.property.name.as_str();
                match object {
                    TsType::Object(members) => {
                        members.into_iter().find(|m| m.name == name).map_or(TsType::Other, |m| m.ty)
                    }
                    TsType::String | TsType::Array(_) if name == "length" => TsType::Number,
                    _ => TsType::Other,
                }
            }
            _ => TsType::Other,
        }
    }

    fn call(&self, call: &oxc_ast::ast::CallExpression, env: &Env) -> TsType {
        let Some(name) = callee_name(&call.callee) else { return TsType::Other };
        let first = call.arguments.first().and_then(Argument::as_expression);
        match name {
            // `useCallback(fn, deps)` is `fn`; `useMemo(() => x, deps)` is `x`.
            "useCallback" => first.map_or(TsType::Other, |f| self.expr(f, env)),
            "useMemo" => match first.map(|f| self.expr(f, env)) {
                Some(TsType::Fn(function)) => function.ret.or(function.inferred).unwrap_or(TsType::Other),
                _ => TsType::Other,
            },
            "Boolean" => TsType::Boolean,
            "String" => TsType::String,
            "Number" | "parseInt" | "parseFloat" => TsType::Number,
            // A call of a generic function, or with type arguments: TS's to infer.
            _ if call.type_arguments.is_some() => TsType::Other,
            name => match env.get(name) {
                Some(TsType::Fn(function)) if function.type_params.is_empty() => {
                    function.ret.clone().or_else(|| function.inferred.clone()).unwrap_or(TsType::Other)
                }
                Some(_) => TsType::Other,
                None => TsType::Returns(Box::new(TsType::Query(name.to_string()))),
            },
        }
    }
}

/// `f` of `f(…)` (also `React.useState`).
fn callee_name<'e>(callee: &'e Expression) -> Option<&'e str> {
    match callee {
        Expression::Identifier(id) => Some(id.name.as_str()),
        Expression::StaticMemberExpression(member) if matches!(&member.object, Expression::Identifier(o) if o.name == "React") => {
            Some(member.property.name.as_str())
        }
        _ => None,
    }
}

/// Binds the names of `pattern` (a name, or an object pattern of an object's members).
fn bind(env: &mut Env, pattern: &BindingPattern, ty: TsType) {
    match pattern {
        BindingPattern::BindingIdentifier(id) => {
            env.insert(id.name.to_string(), ty);
        }
        BindingPattern::ObjectPattern(object) => {
            for property in &object.properties {
                let member = super::key_name(&property.key).and_then(|key| match &ty {
                    TsType::Object(members) => members.iter().find(|m| m.name == key).map(|m| m.ty.clone()),
                    _ => None,
                });
                bind(env, &property.value, member.unwrap_or(TsType::Other));
            }
            if let Some(rest) = &object.rest {
                bind(env, &rest.argument, TsType::Other);
            }
        }
        BindingPattern::ArrayPattern(array) => {
            for element in array.elements.iter().flatten() {
                bind(env, element, TsType::Other);
            }
            if let Some(rest) = &array.rest {
                bind(env, &rest.argument, TsType::Other);
            }
        }
        BindingPattern::AssignmentPattern(assignment) => bind(env, &assignment.left, ty),
    }
}

/// One type for several (a function's returns, a ternary's branches): the one they share, or
/// their union (`string | undefined`, an optional).
fn join(types: Vec<TsType>) -> TsType {
    let mut out: Vec<TsType> = Vec::new();
    for ty in types {
        let members = match ty {
            TsType::Union(members) => members,
            other => vec![other],
        };
        for member in members {
            let key = format!("{member:?}");
            if !out.iter().any(|m| format!("{m:?}") == key) {
                out.push(member);
            }
        }
    }
    match out.len() {
        0 => TsType::Void,
        1 => out.remove(0),
        _ => TsType::Union(out),
    }
}

/// Whether a statement holds a `return` (not inside a nested function).
fn contains_return(statement: &Statement) -> bool {
    match statement {
        Statement::ReturnStatement(_) => true,
        Statement::BlockStatement(block) => block.body.iter().any(contains_return),
        Statement::IfStatement(branch) => {
            contains_return(&branch.consequent) || branch.alternate.as_ref().is_some_and(contains_return)
        }
        Statement::ForStatement(s) => contains_return(&s.body),
        Statement::ForInStatement(s) => contains_return(&s.body),
        Statement::ForOfStatement(s) => contains_return(&s.body),
        Statement::WhileStatement(s) => contains_return(&s.body),
        Statement::DoWhileStatement(s) => contains_return(&s.body),
        Statement::SwitchStatement(s) => s.cases.iter().any(|c| c.consequent.iter().any(contains_return)),
        Statement::TryStatement(s) => {
            s.block.body.iter().any(contains_return)
                || s.handler.as_ref().is_some_and(|h| h.body.body.iter().any(contains_return))
        }
        Statement::LabeledStatement(s) => contains_return(&s.body),
        _ => false,
    }
}

/// Whether a type is data of literals only (no name, call or function of the module).
fn plain(ty: &TsType) -> bool {
    match ty {
        TsType::Number | TsType::String | TsType::Boolean | TsType::StrLit(_) | TsType::BoolLit => true,
        TsType::Array(item) => plain(item),
        TsType::Object(members) => !members.is_empty() && members.iter().all(|m| plain(&m.ty)),
        _ => false,
    }
}
