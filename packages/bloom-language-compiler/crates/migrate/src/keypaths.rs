//! TS's computed-key update as Swift's key paths (#1082): a key that names one of a struct's
//! fields is a `WritableKeyPath<T, V>`.
//!
//! | TS | Bloom 2.0 |
//! |---|---|
//! | `(key: keyof Prefs, value: boolean) => { const next = { ...prefs, [key]: value } … }` | `(key: WritableKeyPath<Prefs, Bool>, value: Bool) { var next = prefs; next[keyPath: key] = value … }` |
//! | `(field: 'min' \| 'max', text: string)` spread into `draft` | `field: WritableKeyPath<Draft, String>` |
//! | `f('min', v)`, `{ filterKey: 'showAgents' }` (a `keyof Prefs` field) | `f(\.min, v)`, `{ filterKey: \.showAgents }` |
//! | `prefs[key]` | `prefs[keyPath: key]` |
//!
//! A key is a key path only when the function uses it as nothing else (every use is `[key]` or an
//! argument): a key also read as a string (`errors.includes(key)`) stays TS's.

use std::collections::{HashMap, HashSet};

use oxc_ast::ast::*;
use oxc_ast_visit::Visit;
use oxc_span::GetSpan;

use crate::module::Tr;

/// Where a key path's root type comes from.
#[derive(Clone, Debug)]
pub enum Root {
    /// `keyof X`: `X`'s TS text.
    Type,
    /// The spread base's declared type (`Draft`), or its name (`draft`) when the file does not say it.
    Base(String),
}

/// The key paths of a file.
#[derive(Default, Debug)]
pub struct KeyPaths {
    /// A parameter (by start) that is a key path: its root and its value's TS type text.
    pub params: HashMap<u32, (Root, String)>,
    /// `keyof X` (by `X`'s text) → the value's TS type text, where one function says it.
    pub keyof_value: HashMap<String, String>,
    /// Names read as key paths (`[key]`).
    pub names: HashSet<String>,
    /// String literals (by start) written as `\.k`.
    pub literals: HashSet<u32>,
}

/// The value type a TS type text is, where the codemod names it.
pub fn value_type(text: &str) -> Option<&'static str> {
    match text.trim() {
        "boolean" => Some("Bool"),
        "string" => Some("String"),
        "number" => Some("Float"),
        _ => None,
    }
}

/// Every use of `name` in `body` is a subscript key (`[name]`, `{ [name]: v }`).
fn only_keyed(body: &FunctionBody, name: &str) -> bool {
    struct Uses<'n> {
        name: &'n str,
        all: usize,
        keyed: usize,
    }
    impl<'a> Visit<'a> for Uses<'_> {
        fn visit_identifier_reference(&mut self, id: &IdentifierReference<'a>) {
            if id.name == self.name {
                self.all += 1;
            }
        }
        fn visit_computed_member_expression(&mut self, m: &ComputedMemberExpression<'a>) {
            if matches!(&m.expression, Expression::Identifier(id) if id.name == self.name) {
                self.keyed += 1;
            }
            oxc_ast_visit::walk::walk_computed_member_expression(self, m);
        }
        fn visit_object_property(&mut self, p: &ObjectProperty<'a>) {
            if p.computed && matches!(&p.key, PropertyKey::Identifier(id) if id.name == self.name) {
                self.keyed += 1;
            }
            oxc_ast_visit::walk::walk_object_property(self, p);
        }
    }
    let mut uses = Uses { name, all: 0, keyed: 0 };
    uses.visit_function_body(body);
    uses.all == uses.keyed
}

/// `keyof X`: `X`'s text.
fn keyof_of<'s>(src: &'s str, t: &TSType) -> Option<&'s str> {
    let TSType::TSTypeOperatorType(op) = t else { return None };
    if op.operator != TSTypeOperatorOperator::Keyof {
        return None;
    }
    let s = op.type_annotation.span();
    Some(&src[s.start as usize..s.end as usize])
}

fn literal_union(t: &TSType) -> bool {
    match t {
        TSType::TSUnionType(u) => u.types.iter().all(
            |t| matches!(t, TSType::TSLiteralType(l) if matches!(l.literal, TSLiteral::StringLiteral(_))),
        ),
        _ => false,
    }
}

struct Scan<'s> {
    src: &'s str,
    out: KeyPaths,
    /// A key-path function's name → the argument indexes that are keys.
    fns: HashMap<String, Vec<usize>>,
    /// `fname('k', …)`: callee, index, literal start.
    calls: Vec<(String, usize, u32)>,
    /// `{ f: 'k' }`: field, literal start.
    props: Vec<(String, u32)>,
    /// `f: keyof X` in a type literal: field, `X`.
    fields: Vec<(String, String)>,
    /// A name's declared TS type, where it is a plain name (`const x: T`, `useState<T>()`).
    declared: HashMap<String, String>,
}

impl<'s> Scan<'s> {
    fn function(&mut self, name: Option<&str>, params: &FormalParameters, body: Option<&FunctionBody>) {
        let Some(body) = body else { return };
        #[derive(Default)]
        struct Objects(Vec<(String, String, String)>);
        impl<'a> Visit<'a> for Objects {
            fn visit_object_expression(&mut self, o: &ObjectExpression<'a>) {
                if let [ObjectPropertyKind::SpreadProperty(s), ObjectPropertyKind::ObjectProperty(p)] =
                    o.properties.as_slice()
                    && p.computed
                    && let Expression::Identifier(base) = s.argument.without_parentheses()
                    && let PropertyKey::Identifier(key) = &p.key
                    && let Expression::Identifier(value) = p.value.without_parentheses()
                {
                    self.0.push((base.name.to_string(), key.name.to_string(), value.name.to_string()));
                }
                oxc_ast_visit::walk::walk_object_expression(self, o);
            }
        }
        let mut objects = Objects::default();
        objects.visit_function_body(body);
        let param = |n: &str| {
            params.items.iter().enumerate().find_map(|(i, p)| match &p.pattern {
                BindingPattern::BindingIdentifier(id) if id.name == n => Some((i, p)),
                _ => None,
            })
        };
        for (base, key, value) in objects.0 {
            let (Some((index, k)), Some((_, v))) = (param(&key), param(&value)) else { continue };
            let (Some(kt), Some(vt)) = (&k.type_annotation, &v.type_annotation) else { continue };
            let vs = vt.type_annotation.span();
            let value_text = self.src[vs.start as usize..vs.end as usize].to_string();
            if value_type(&value_text).is_none() || !only_keyed(body, &key) {
                continue;
            }
            let root = if let Some(x) = keyof_of(self.src, &kt.type_annotation) {
                self.out.keyof_value.entry(x.to_string()).or_insert_with(|| value_text.clone());
                Root::Type
            } else if literal_union(&kt.type_annotation) {
                Root::Base(base)
            } else {
                continue;
            };
            self.out.params.insert(k.span.start, (root, value_text));
            self.out.names.insert(key.clone());
            if let Some(name) = name {
                self.fns.entry(name.to_string()).or_default().push(index);
            }
        }
    }
}

impl<'a> Visit<'a> for Scan<'_> {
    fn visit_variable_declarator(&mut self, d: &VariableDeclarator<'a>) {
        // `const x: T = …`, `const [x, setX] = useState<T>(…)`: `x`'s type.
        let named = |t: &TSType| match t {
            TSType::TSTypeReference(r) if r.type_arguments.is_none() => match &r.type_name {
                TSTypeName::IdentifierReference(n) => Some(n.name.to_string()),
                _ => None,
            },
            _ => None,
        };
        match (&d.id, d.type_annotation.as_ref(), d.init.as_ref().map(|e| e.without_parentheses())) {
            (BindingPattern::BindingIdentifier(id), Some(t), _) => {
                if let Some(n) = named(&t.type_annotation) {
                    self.declared.insert(id.name.to_string(), n);
                }
            }
            (BindingPattern::ArrayPattern(p), None, Some(Expression::CallExpression(c))) => {
                if let Some(Some(BindingPattern::BindingIdentifier(id))) = p.elements.first()
                    && let Some(args) = &c.type_arguments
                    && let [only] = args.params.as_slice()
                    && let Some(n) = named(only)
                {
                    self.declared.insert(id.name.to_string(), n);
                }
            }
            _ => {}
        }
        if let BindingPattern::BindingIdentifier(id) = &d.id
            && let Some(init) = &d.init
        {
            let arrow = match init.without_parentheses() {
                Expression::ArrowFunctionExpression(a) => Some(&**a),
                Expression::CallExpression(c) => match c.arguments.first() {
                    Some(Argument::ArrowFunctionExpression(a)) => Some(&**a),
                    _ => None,
                },
                _ => None,
            };
            if let Some(a) = arrow
                && let ArrowFunctionBody::FunctionBody(body) = &a.body
            {
                self.function(Some(&id.name), &a.params, Some(body));
            }
        }
        oxc_ast_visit::walk::walk_variable_declarator(self, d);
    }

    fn visit_function(&mut self, f: &Function<'a>, flags: oxc_syntax::scope::ScopeFlags) {
        self.function(f.id.as_ref().map(|i| i.name.as_str()), &f.params, f.body.as_deref());
        oxc_ast_visit::walk::walk_function(self, f, flags);
    }

    fn visit_call_expression(&mut self, c: &CallExpression<'a>) {
        if let Expression::Identifier(callee) = &c.callee {
            for (i, a) in c.arguments.iter().enumerate() {
                if let Argument::StringLiteral(s) = a {
                    self.calls.push((callee.name.to_string(), i, s.span.start));
                }
            }
        }
        oxc_ast_visit::walk::walk_call_expression(self, c);
    }

    fn visit_object_property(&mut self, p: &ObjectProperty<'a>) {
        if let (PropertyKey::StaticIdentifier(k), Expression::StringLiteral(s)) = (&p.key, &p.value) {
            self.props.push((k.name.to_string(), s.span.start));
        }
        oxc_ast_visit::walk::walk_object_property(self, p);
    }

    fn visit_ts_property_signature(&mut self, p: &TSPropertySignature<'a>) {
        if let PropertyKey::StaticIdentifier(k) = &p.key
            && let Some(t) = &p.type_annotation
            && let Some(x) = keyof_of(self.src, &t.type_annotation)
        {
            self.fields.push((k.name.to_string(), x.to_string()));
        }
        oxc_ast_visit::walk::walk_ts_property_signature(self, p);
    }
}

/// The file's key paths.
pub fn scan(src: &str, program: &Program) -> KeyPaths {
    let mut scan = Scan {
        src,
        out: KeyPaths::default(),
        fns: HashMap::new(),
        calls: Vec::new(),
        props: Vec::new(),
        fields: Vec::new(),
        declared: HashMap::new(),
    };
    scan.visit_program(program);
    let mut out = scan.out;
    // A spread base's root is its declared type.
    for (root, _) in out.params.values_mut() {
        if let Root::Base(base) = root
            && let Some(t) = scan.declared.get(base.as_str())
        {
            *base = t.clone();
        }
    }
    for (callee, index, at) in scan.calls {
        if scan.fns.get(&callee).is_some_and(|ix| ix.contains(&index)) {
            out.literals.insert(at);
        }
    }
    // A record field typed `keyof X`, where a function says `X`'s value type: a key path too.
    let fields: HashSet<String> =
        scan.fields.into_iter().filter(|(_, x)| out.keyof_value.contains_key(x)).map(|(f, _)| f).collect();
    for (field, at) in scan.props {
        if fields.contains(&field) {
            out.literals.insert(at);
        }
    }
    out.names.extend(fields);
    out
}

impl Tr<'_> {
    /// `keyof X` where the file says its value type: `WritableKeyPath<X, V>`.
    pub fn keyof_key_path(&mut self, t: &TSType) -> Option<String> {
        let x = keyof_of(self.src, t)?;
        let v = value_type(self.key_paths.keyof_value.get(x)?)?;
        let TSType::TSTypeOperatorType(op) = t else { return None };
        let root = self.ty(&op.type_annotation);
        Some(format!("WritableKeyPath<{root}, {v}>"))
    }

    /// A key parameter's type (`field: WritableKeyPath<Draft, String>`).
    pub fn key_path_param(&mut self, param: &FormalParameter) -> Option<String> {
        let (root, value) = self.key_paths.params.get(&param.span.start)?.clone();
        let v = value_type(&value)?;
        let root = match root {
            Root::Type => {
                return param.type_annotation.as_ref().and_then(|t| self.keyof_key_path(&t.type_annotation));
            }
            Root::Base(t) if crate::module::is_identifier(&t) && t.starts_with(char::is_uppercase) => t,
            Root::Base(base) => self.scope.decl.get(&base)?.trim_end_matches('?').to_string(),
        };
        Some(format!("WritableKeyPath<{root}, {v}>"))
    }

    /// `const next = { ...base, [key]: value }`: `var next = base` and `next[keyPath: key] = value`.
    pub fn key_path_update(&mut self, name: &str, init: &Expression) -> Option<String> {
        let Expression::ObjectExpression(o) = init.without_parentheses() else { return None };
        let [ObjectPropertyKind::SpreadProperty(s), ObjectPropertyKind::ObjectProperty(p)] =
            o.properties.as_slice()
        else {
            return None;
        };
        let PropertyKey::Identifier(key) = &p.key else { return None };
        if !p.computed || !self.key_paths.names.contains(key.name.as_str()) {
            return None;
        }
        let base = self.expr(&s.argument);
        let key = self.ident(&key.name, key.span);
        let value = self.expr(&p.value);
        Some(format!("var {name} = {base}\n{name}[keyPath: {key}] = {value}"))
    }
}
