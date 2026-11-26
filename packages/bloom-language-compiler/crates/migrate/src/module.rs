//! The module: imports, items and what the rest of the translation needs to
//! know about the file before it starts (which names are language nodes,
//! views, local functions, modifiers and string-literal unions).

use std::collections::{HashMap, HashSet};

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Argument, BindingPattern, Declaration, ExportDefaultDeclarationKind, Expression, Function,
    ImportDeclarationSpecifier, ModuleExportName, Statement, TSSignature, TSType, TSTypeName,
    VariableDeclarationKind,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType, Span};

use crate::Reason;
use crate::comments::Comments;

/// The language modules: their names are the `.bloom` prelude.
const LANGUAGE: &str = "@oxy.so/bloom-language";

pub struct Translated {
    pub text: String,
    pub reasons: Vec<Reason>,
    /// Condition operands of a type the codemod does not know, as written: JS
    /// truthiness that bloomc's own types spell out (`crate::truthiness`).
    pub conditions: HashSet<String>,
    /// `a || b` as a value, left → right: JS's default for a falsy `a`, spelled
    /// from bloomc's type of `a` (`crate::truthiness::defaults`).
    pub defaults: HashMap<String, Vec<String>>,
}

/// One kept TS import, by module, in source order.
#[derive(Default)]
struct Imports {
    order: Vec<String>,
    /// module → (local, imported, type-only)
    names: HashMap<String, Vec<(String, String, bool)>>,
    namespaces: Vec<(String, String)>,
}

/// What a state setter writes.
#[derive(Clone)]
pub struct Setter {
    pub state: String,
}

/// The names in scope while translating a view or a function.
#[derive(Default, Clone)]
pub struct Scope {
    /// `setX` → the `@state x` it writes.
    pub setters: HashMap<String, Setter>,
    /// The view's props parameter (`props.x` is `x`).
    pub props: Option<String>,
    /// A name written as another (`(prev) => …` in a functional update is the state).
    pub renames: HashMap<String, String>,
    /// A name's declared type name, for string literals of a local union.
    pub types: HashMap<String, String>,
    /// The parameter of an `Embed((render) => …)`.
    pub render: Option<String>,
    /// Names bound to UI values (`const header = HStack(…)`).
    pub view_values: HashSet<String>,
    /// Names with a declared Bloom type (parameters, props): conditions read it.
    pub decl: HashMap<String, String>,
    /// `useRef` names: `r.current` is the `@ref r`.
    pub refs: HashSet<String>,
    /// Names bound to a `new Map`/`new Set`: their in-place changes reassign them.
    pub collections: HashMap<String, String>,
    /// Member functions of the view being translated.
    pub member_fns: HashSet<String>,
}

pub struct Tr<'s> {
    pub src: &'s str,
    /// The `.tsx` path: names an anonymous default `screen`/`layout`.
    pub filename: String,
    line_starts: Vec<u32>,
    pub comments: Comments,
    pub reasons: Vec<Reason>,
    /// Language imports: local name → exported name.
    pub lang: HashMap<String, String>,
    /// `react` imports: local name → exported name (`default`, `*`).
    pub react: HashMap<String, String>,
    /// `defineModifier` constants → the modifiers they apply, as `.a(…).b(…)`.
    pub modifiers: HashMap<String, String>,
    /// Local string-literal unions → their cases.
    pub unions: HashMap<String, Vec<String>>,
    /// Local object types (interfaces, object aliases) → their members' names.
    pub objects: HashSet<String>,
    /// Object types that only type a view's props: they become its parameters.
    pub props_types: HashSet<String>,
    /// Local views (and the module functions a `view(F)` wraps).
    pub views: HashSet<String>,
    /// React components whose every return is `toElement(tree)`: they become views.
    pub components: HashSet<String>,
    /// Module functions (Bloom `fn`s).
    pub fns: HashSet<String>,
    /// Module functions and constants that return or hold UI.
    pub view_fns: HashSet<String>,
    /// Every name the output mentions, for keeping only the imports it uses.
    pub used: HashSet<String>,
    /// JS globals the output reads, imported from `"js"`.
    pub js: std::collections::BTreeSet<String>,
    /// React types the output names (`React.ReactNode` is `ReactNode` from `react`).
    pub react_types: std::collections::BTreeSet<String>,
    /// Every imported local name (a JS global is only one when not imported).
    pub imported: HashSet<String>,
    pub scope: Scope,
    /// Module functions a `view(F)` constant wraps: translated as that view.
    pub wrapped: HashSet<String>,
    /// Review notes for the statement being translated (`Tr::review`).
    pub reviews: Vec<String>,
    /// While set, comments stay queued (a `defineModifier` read ahead of its place).
    pub quiet: bool,
    /// Inside a `try` written as a `Result` closure: an `await` propagates with `?`.
    pub propagate: bool,
    /// Translating a `Map`'s entries: a two-item list literal is a tuple.
    pub pairs: bool,
    /// Inside that closure: a bare `return` is `return ok(())`.
    pub try_return: bool,
    /// TS imports named like a Bloom node (`Button` from `@oxy.so/bloom/button`,
    /// `ScrollView` from `react-native`): imported under another name, since in
    /// `.bloom` the node's name is the node.
    pub import_renames: HashMap<String, String>,
    /// Translating an `if`/`for`/`while` head, where `{` opens the body: a closure
    /// argument stays inside the parentheses.
    pub head: bool,
    /// Condition operands of unknown type (see [`Translated::conditions`]).
    pub defaults: HashMap<String, Vec<String>>,
    pub conditions: HashSet<String>,
    /// Calls whose one type argument types the binding they initialise.
    pub typed_calls: HashSet<u32>,
    /// `let x = x ?? d` lines a pattern's defaults leave for after its `let`.
    pub pattern_defaults: Vec<String>,
    /// The `equal(old, new) { … }` member of the view being declared (a memo comparator).
    pub pending_equal: Option<String>,
}

impl<'s> Tr<'s> {
    pub fn line(&self, pos: u32) -> u32 {
        match self.line_starts.binary_search(&pos) {
            Ok(i) => i as u32 + 1,
            Err(i) => i as u32,
        }
    }

    pub fn slice(&self, span: Span) -> &'s str {
        &self.src[span.start as usize..span.end as usize]
    }

    /// Records why the file cannot move and returns a placeholder for the draft.
    pub fn refuse(&mut self, code: &str, detail: impl Into<String>, span: Span) -> String {
        let line = self.line(span.start);
        self.reasons.push(Reason { code: code.to_string(), detail: detail.into(), line });
        "«?»".to_string()
    }

    /// Whether `e` is `X.displayName = "…"` for a view `X` (React DevTools' name; a
    /// view's fiber is named after its function, `X`).
    fn view_display_name(&mut self, e: &Expression) -> bool {
        let Expression::AssignmentExpression(a) = e else { return false };
        let oxc_ast::ast::AssignmentTarget::StaticMemberExpression(m) = &a.left else { return false };
        let Expression::Identifier(object) = &m.object else { return false };
        if m.property.name != "displayName" || !self.views.contains(object.name.as_str()) {
            return false;
        }
        if let Expression::StringLiteral(s) = &a.right
            && s.value.as_str().unwrap_or_default() != object.name.as_str()
        {
            let shown = s.value.as_str().unwrap_or_default().to_string();
            self.review(format!("the DevTools name `{shown}` dropped: the view is named `{}`", object.name));
        }
        true
    }

    /// A local binding (`let`, `@state`, a closure's or a loop's item): a Bloom keyword
    /// (`if`, `body`) is renamed `if_` in its scope. (The contextual ones name
    /// parameters and fields, not `let` patterns or states.)
    pub fn bind(&mut self, name: &str, span: Span) -> String {
        if bloom_lang::KEYWORDS.contains(&name) {
            let renamed = format!("{name}_");
            self.scope.renames.insert(name.to_string(), renamed.clone());
            self.used.insert(renamed.clone());
            return renamed;
        }
        self.name(name, span)
    }

    /// A function's parameter, its label: the contextual keywords (`type`, `body`,
    /// `view`, `screen`, `layout`, `from`) name it as they are.
    pub fn bind_param(&mut self, name: &str, span: Span) -> String {
        if bloom_lang::KEYWORDS.contains(&name) && !CONTEXTUAL.contains(&name) {
            let renamed = format!("{name}_");
            self.scope.renames.insert(name.to_string(), renamed.clone());
            self.used.insert(renamed.clone());
            return renamed;
        }
        self.name(name, span)
    }

    /// A name the output uses for a TS import (see [`Tr::import_renames`]).
    pub fn import_name(&mut self, name: &str, span: Span) -> String {
        match self.import_renames.get(name) {
            Some(renamed) => {
                let renamed = renamed.clone();
                self.used.insert(renamed.clone());
                renamed
            }
            None => self.name(name, span),
        }
    }

    /// A name the output uses.
    pub fn name(&mut self, name: &str, span: Span) -> String {
        if bloom_lang::KEYWORDS.contains(&name) && !CONTEXTUAL.contains(&name) {
            return self.refuse("name:keyword", format!("`{name}` is a Bloom keyword"), span);
        }
        self.used.insert(name.to_string());
        name.to_string()
    }

    /// Whether `name` is the language export `export`.
    pub fn is_lang(&self, name: &str, export: &str) -> bool {
        self.lang.get(name).is_some_and(|e| e == export)
    }

    /// The node constructor a local name is, when it is one.
    pub fn node_ctor(&self, name: &str) -> Option<&str> {
        let export = self.lang.get(name)?;
        bloom_lang_nodes().contains(export.as_str()).then_some(export.as_str())
    }

    /// Whether the text between two offsets holds an empty line.
    pub fn blank_between(&self, from: u32, to: u32) -> bool {
        if from >= to {
            return false;
        }
        let between = &self.src[from as usize..to as usize];
        let mut newlines = 0;
        for line in between.split('\n').skip(1) {
            if line.trim().is_empty() {
                newlines += 1;
            } else {
                newlines = 0;
            }
            if newlines >= 1 && between.matches('\n').count() >= 2 {
                return true;
            }
        }
        false
    }
}

/// The names the prelude gives every `.bloom` module from the language.
fn bloom_lang_nodes() -> &'static HashSet<&'static str> {
    use std::sync::OnceLock;
    static NODES: OnceLock<HashSet<&'static str>> = OnceLock::new();
    NODES.get_or_init(|| {
        bloom_language_compiler::spec::NODES.iter().flat_map(|n| n.constructors.iter().copied()).collect()
    })
}

/// Language exports with a `.bloom` form: prelude names or what the codemod rewrites.
const LANG_HANDLED: &[&str] = &[
    "Embed",
    "toElement",
    "view",
    "screen",
    "layout",
    "toast",
    "navigate",
    "defineModifier",
    "Child",
    "Binding",
];

/// Types the language exports that `.bloom` writes as `View`.
const LANG_VIEW_TYPES: &[&str] = &["Child", "ViewNode"];

pub fn translate(source: &str, filename: &str) -> Translated {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(filename).unwrap_or_default();
    let parsed = Parser::new(&allocator, source, source_type).parse();
    if parsed.diagnostics.has_errors() {
        return Translated {
            conditions: HashSet::new(),
            defaults: HashMap::new(),
            text: String::new(),
            reasons: vec![Reason {
                code: "parse".into(),
                detail: "the TypeScript does not parse".into(),
                line: 0,
            }],
        };
    }
    let program = parsed.program;
    let mut line_starts = vec![0];
    line_starts.extend(source.match_indices('\n').map(|(i, _)| i as u32 + 1));
    let mut tr = Tr {
        src: source,
        filename: filename.to_string(),
        line_starts,
        comments: Comments::new(source, &program.comments),
        reasons: Vec::new(),
        lang: HashMap::new(),
        react: HashMap::new(),
        modifiers: HashMap::new(),
        unions: HashMap::new(),
        objects: HashSet::new(),
        props_types: HashSet::new(),
        views: HashSet::new(),
        components: HashSet::new(),
        fns: HashSet::new(),
        view_fns: HashSet::new(),
        used: HashSet::new(),
        js: Default::default(),
        imported: HashSet::new(),
        react_types: Default::default(),
        scope: Scope::default(),
        wrapped: HashSet::new(),
        reviews: Vec::new(),
        quiet: false,
        propagate: false,
        pairs: false,
        try_return: false,
        head: false,
        import_renames: HashMap::new(),
        pending_equal: None,
        pattern_defaults: Vec::new(),
        typed_calls: HashSet::new(),
        conditions: HashSet::new(),
        defaults: HashMap::new(),
    };

    // The imports first: every later decision depends on where a name comes from.
    let mut imports = Imports::default();
    // The file's header: the comments above its first import or item.
    let first = program.body.first().map_or(source.len() as u32, |s| s.span().start);
    for statement in &program.body {
        if let Statement::ImportDeclaration(import) = statement {
            tr.import(import, &mut imports);
        }
    }
    // A TS import named like a language node the file also uses (`Button` from
    // `@oxy.so/bloom/button` beside `Button as LButton`) is imported under another name.
    for (source, names) in imports.names.iter_mut() {
        for (local, _, type_only) in names.iter_mut() {
            if !*type_only
                && bloom_lang_nodes().contains(local.as_str())
                && tr.lang.values().any(|export| export == local)
            {
                let prefix = if source == "react-native" { "RN" } else { "TS" };
                let renamed = format!("{prefix}{local}");
                tr.import_renames.insert(local.clone(), renamed.clone());
                *local = renamed;
            }
        }
    }
    let header = tr.comments.before(first, false);
    tr.scan(&program.body);

    let defaults = default_exports(&program.body);
    let mut items = Vec::new();
    // Comments above an item with no `.bloom` text of its own (a `defineModifier`,
    // a props interface) go above the next item, as plain comments.
    let mut pending = String::new();
    for statement in &program.body {
        if matches!(statement, Statement::ImportDeclaration(_)) {
            continue;
        }
        let comments = tr.comments.before(statement.span().start, true);
        let item = tr.item(statement, &defaults, &program.body);
        let item = if item.is_empty() { item } else { tr.take_reviews() + &item };
        if item.is_empty() {
            pending.push_str(&undoc(&comments));
            pending.push_str(&undoc(&tr.comments.before(statement.span().end, false)));
            continue;
        }
        let comments = if pending.is_empty() {
            comments
        } else {
            format!("{}\n{comments}", std::mem::take(&mut pending))
        };
        items.push(comments + &item);
    }
    let trailing = pending + &tr.comments.rest();
    let items = hoist_lets(items);

    // Sections one empty line apart: the header, the imports, each item, what trails.
    let imports = tr.imports_text(&imports);
    let mut sections = vec![header, imports];
    sections.extend(items);
    sections.push(trailing);
    let out = sections
        .iter()
        .map(|s| s.trim_matches('\n'))
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("\n\n")
        + "\n";
    Translated { text: out, reasons: tr.reasons, conditions: tr.conditions, defaults: tr.defaults }
}

/// Doc comments as plain comments: what they documented is not in the output.
fn undoc(comments: &str) -> String {
    comments
        .lines()
        .map(|l| l.strip_prefix('/').filter(|r| r.starts_with("//")).unwrap_or(l).to_string() + "\n")
        .collect()
}

/// The local names `export default X;` exports.
fn default_exports(body: &[Statement]) -> HashSet<String> {
    let mut out = HashSet::new();
    for statement in body {
        if let Statement::ExportDefaultDeclaration(export) = statement {
            match export.declaration.as_expression() {
                Some(Expression::Identifier(id)) => {
                    out.insert(id.name.to_string());
                }
                Some(Expression::CallExpression(call)) if memo_of(call).is_some() => {
                    out.extend(memo_of(call));
                }
                _ => {}
            }
        }
    }
    out
}

/// The name of a component's props type: its parameter's annotation, or `React.FC<P>`'s `P`.
fn component_props_type(
    declaration: Option<&Declaration>,
    default_fn: Option<&Function>,
    react: &HashMap<String, String>,
) -> Option<String> {
    let named = |t: &TSType| match t {
        TSType::TSTypeReference(r) => match &r.type_name {
            TSTypeName::IdentifierReference(id) => Some(id.name.to_string()),
            _ => None,
        },
        _ => None,
    };
    let first_param = |params: &oxc_ast::ast::FormalParameters| {
        params.items.first()?.type_annotation.as_ref().and_then(|t| named(&t.type_annotation))
    };
    if let Some(f) = default_fn {
        return first_param(&f.params);
    }
    match declaration? {
        Declaration::FunctionDeclaration(f) => first_param(&f.params),
        Declaration::VariableDeclaration(v) => {
            let d = v.declarations.first()?;
            let init = d.init.as_ref();
            let memo = init.and_then(|i| memo_call(i, react));
            if let Some(m) = &memo
                && let Some(p) = m.props.and_then(named)
            {
                return Some(p);
            }
            let function = memo.map(|m| m.function).or(init);
            let params = match function {
                Some(Expression::ArrowFunctionExpression(a)) => Some(&a.params),
                Some(Expression::FunctionExpression(f)) => Some(&f.params),
                _ => None,
            };
            if let Some(p) = params.and_then(|p| first_param(p)) {
                return Some(p);
            }
            let TSType::TSTypeReference(r) = &d.type_annotation.as_ref()?.type_annotation else {
                return None;
            };
            named(r.type_arguments.as_ref()?.params.first()?)
        }
        _ => None,
    }
}

/// `memo(F)`, `memo<P>(F)`, `React.memo(F)` around a function `F`: `F`, `P`, and
/// the comparator when there is one. A view is already `memo`'d (shallow props).
pub struct Memo<'b, 'a> {
    pub function: &'b Expression<'a>,
    pub props: Option<&'b TSType<'a>>,
    pub comparator: Option<&'b Expression<'a>>,
}

pub fn memo_call<'b, 'a>(e: &'b Expression<'a>, react: &HashMap<String, String>) -> Option<Memo<'b, 'a>> {
    let Expression::CallExpression(call) = e.without_parentheses() else { return None };
    let namespace = |n: &str| react.get(n).is_some_and(|e| e == "default" || e == "*");
    let is_memo = match &call.callee {
        Expression::Identifier(id) => react.get(id.name.as_str()).is_some_and(|e| e == "memo"),
        Expression::StaticMemberExpression(m) => {
            m.property.name == "memo" && matches!(&m.object, Expression::Identifier(o) if namespace(&o.name))
        }
        _ => false,
    };
    if !is_memo {
        return None;
    }
    let function = call.arguments.first()?.as_expression()?;
    if !matches!(function, Expression::FunctionExpression(_) | Expression::ArrowFunctionExpression(_)) {
        return None;
    }
    Some(Memo {
        function,
        props: call.type_arguments.as_ref().and_then(|a| a.params.first()),
        comparator: call.arguments.get(1).and_then(|a| a.as_expression()),
    })
}

/// `memo(X)` / `React.memo(X)` without a comparator: `X`.
fn memo_of(call: &oxc_ast::ast::CallExpression) -> Option<String> {
    let memo = match &call.callee {
        Expression::Identifier(id) => id.name == "memo",
        Expression::StaticMemberExpression(m) => m.property.name == "memo",
        _ => false,
    };
    match (memo, call.arguments.as_slice()) {
        (true, [Argument::Identifier(id)]) => Some(id.name.to_string()),
        _ => None,
    }
}

/// Whether every return of a component body is `toElement(…)` or nothing.
fn returns_to_element(statements: &[Statement], to_element: &dyn Fn(&str) -> bool) -> bool {
    fn value_ok(e: &Expression, to_element: &dyn Fn(&str) -> bool) -> bool {
        match e.without_parentheses() {
            Expression::NullLiteral(_) | Expression::JSXElement(_) | Expression::JSXFragment(_) => true,
            Expression::CallExpression(call) => {
                matches!(&call.callee, Expression::Identifier(id) if to_element(&id.name))
            }
            Expression::ConditionalExpression(c) => {
                value_ok(&c.consequent, to_element) && value_ok(&c.alternate, to_element)
            }
            _ => false,
        }
    }
    fn walk(statements: &[Statement], to_element: &dyn Fn(&str) -> bool, any: &mut bool) -> bool {
        for statement in statements {
            match statement {
                Statement::ReturnStatement(r) => match &r.argument {
                    Some(v) if value_ok(v, to_element) => *any |= !matches!(v, Expression::NullLiteral(_)),
                    Some(_) => return false,
                    None => {}
                },
                Statement::IfStatement(i) => {
                    let branches = [Some(&i.consequent), i.alternate.as_ref()];
                    for branch in branches.into_iter().flatten() {
                        let inner: &[Statement] = match branch {
                            Statement::BlockStatement(b) => &b.body,
                            other => std::slice::from_ref(other),
                        };
                        if !walk(inner, to_element, any) {
                            return false;
                        }
                    }
                }
                _ => {}
            }
        }
        true
    }
    let mut any = false;
    walk(statements, to_element, &mut any) && any
}

impl<'s> Tr<'s> {
    fn import(&mut self, import: &oxc_ast::ast::ImportDeclaration, imports: &mut Imports) {
        let source = import.source.value.as_str().unwrap_or_default().to_string();
        let Some(specifiers) = &import.specifiers else {
            self.refuse(
                "import:side-effect",
                format!("`import '{source}'` has no `.bloom` form"),
                import.span,
            );
            return;
        };
        let type_only = import.import_kind.is_type();
        let language = source == LANGUAGE || source.starts_with(&format!("{LANGUAGE}/"));
        for specifier in specifiers {
            match specifier {
                ImportDeclarationSpecifier::ImportSpecifier(s) => {
                    let imported = match &s.imported {
                        ModuleExportName::IdentifierName(n) => n.name.to_string(),
                        ModuleExportName::IdentifierReference(n) => n.name.to_string(),
                        ModuleExportName::StringLiteral(n) => {
                            n.value.as_str().unwrap_or_default().to_string()
                        }
                    };
                    let local = s.local.name.to_string();
                    self.imported.insert(local.clone());
                    if language {
                        self.lang.insert(local.clone(), imported.clone());
                        if !bloom_lang_nodes().contains(imported.as_str())
                            && !LANG_HANDLED.contains(&imported.as_str())
                        {
                            // No `.bloom` form: kept as a TS import of the language (types, environments).
                            let entry = imports.names.entry(source.clone()).or_default();
                            if entry.is_empty() && !imports.order.contains(&source) {
                                imports.order.push(source.clone());
                            }
                            entry.push((local, imported, type_only || s.import_kind.is_type()));
                        }
                        continue;
                    }
                    if source == "react" {
                        self.react.insert(local.clone(), imported.clone());
                        continue;
                    }
                    if !imports.order.contains(&source) {
                        imports.order.push(source.clone());
                    }
                    let type_only = type_only || s.import_kind.is_type();
                    imports.names.entry(source.clone()).or_default().push((local, imported, type_only));
                }
                ImportDeclarationSpecifier::ImportDefaultSpecifier(s) => {
                    let local = s.local.name.to_string();
                    self.imported.insert(local.clone());
                    if source == "react" {
                        self.react.insert(local, "default".into());
                        continue;
                    }
                    if !imports.order.contains(&source) {
                        imports.order.push(source.clone());
                    }
                    imports.names.entry(source.clone()).or_default().push((
                        local,
                        "default".into(),
                        type_only,
                    ));
                }
                ImportDeclarationSpecifier::ImportNamespaceSpecifier(s) => {
                    let local = s.local.name.to_string();
                    self.imported.insert(local.clone());
                    if source == "react" {
                        self.react.insert(local, "*".into());
                        continue;
                    }
                    imports.namespaces.push((local, source.clone()));
                }
            }
        }
    }

    /// The `import` lines for the names the output uses.
    fn imports_text(&self, imports: &Imports) -> String {
        let mut out = String::new();
        if !self.js.is_empty() {
            let names: Vec<&str> = self.js.iter().map(String::as_str).collect();
            out.push_str(&format!("import {{ {} }} from \"js\"\n", names.join(", ")));
        }
        let mut react: Vec<String> =
            self.react
                .iter()
                .filter(|(local, export)| {
                    self.used.contains(*local) && export.chars().next().is_some_and(char::is_uppercase)
                })
                .map(|(local, export)| {
                    if local == export {
                        format!("type {local}")
                    } else {
                        format!("type {export} as {local}")
                    }
                })
                .collect();
        react.extend(
            self.react_types.iter().filter(|t| !self.react.contains_key(*t)).map(|t| format!("type {t}")),
        );
        react.sort();
        if !react.is_empty() {
            out.push_str(&format!("import {{ {} }} from \"react\"\n", react.join(", ")));
        }
        for source in &imports.order {
            let names: Vec<String> = imports.names[source]
                .iter()
                .filter(|(local, ..)| self.used.contains(local))
                .map(|(local, imported, type_only)| {
                    let kind = if *type_only { "type " } else { "" };
                    if local == imported {
                        format!("{kind}{local}")
                    } else {
                        format!("{kind}{imported} as {local}")
                    }
                })
                .collect();
            if !names.is_empty() {
                out.push_str(&format!("import {{ {} }} from \"{source}\"\n", names.join(", ")));
            }
        }
        for (local, source) in &imports.namespaces {
            if self.used.contains(local) {
                out.push_str(&format!("import * as {local} from \"{source}\"\n"));
            }
        }
        out
    }

    /// What the translation needs to know about the module's own names.
    fn scan(&mut self, body: &[Statement]) {
        let mut wrapped = Vec::new();
        for statement in body {
            let declaration = match statement {
                Statement::ExportDeclaration(export) => Some(&export.declaration),
                _ => statement.as_declaration(),
            };
            if let Some(Declaration::FunctionDeclaration(f)) = declaration
                && let Some(id) = &f.id
            {
                self.fns.insert(id.name.to_string());
            }
            if let Some(Declaration::TSTypeAliasDeclaration(alias)) = declaration {
                let name = alias.id.name.to_string();
                // A string-literal union stays one (`"a" | "b"`): TS-shaped data, zero-cost.
                if string_union(&alias.type_annotation).is_some() {
                } else if matches!(alias.type_annotation, TSType::TSTypeLiteral(_)) {
                    self.objects.insert(name);
                }
            }
            if let Some(Declaration::TSInterfaceDeclaration(interface)) = declaration {
                self.objects.insert(interface.id.name.to_string());
            }
            let init = match declaration {
                Some(Declaration::VariableDeclaration(v)) if v.kind == VariableDeclarationKind::Const => {
                    v.declarations.first().and_then(|d| match (&d.id, &d.init) {
                        (BindingPattern::BindingIdentifier(id), Some(init)) => {
                            Some((id.name.to_string(), init))
                        }
                        _ => None,
                    })
                }
                _ => None,
            };
            if let Some(Declaration::VariableDeclaration(v)) = declaration {
                for d in &v.declarations {
                    if let (BindingPattern::BindingIdentifier(id), Some(init)) = (&d.id, &d.init)
                        && matches!(
                            init.without_parentheses(),
                            Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_)
                        )
                    {
                        self.fns.insert(id.name.to_string());
                    }
                }
            }
            if let Some((name, init)) = init
                && let Expression::CallExpression(call) = init.without_parentheses()
                && let Expression::Identifier(callee) = &call.callee
            {
                let callee = callee.name.as_str();
                if self.is_lang(callee, "view")
                    || self.is_lang(callee, "screen")
                    || self.is_lang(callee, "layout")
                {
                    self.views.insert(name.clone());
                    if let Some(Argument::Identifier(f)) = call.arguments.first() {
                        wrapped.push(f.name.to_string());
                    }
                    if let Some(f) = call.arguments.first().and_then(|a| a.as_expression()) {
                        self.note_props_type(f);
                    }
                }
                if self.is_lang(callee, "defineModifier") {
                    self.define_modifier(&name, call);
                }
            }
        }
        // `export default view(function X(props: P) { … })`: P types the props too.
        for statement in body {
            if let Statement::ExportDefaultDeclaration(export) = statement
                && let Some(Expression::CallExpression(call)) = export.declaration.as_expression()
                && let Expression::Identifier(callee) = &call.callee
                && ["view", "screen", "layout"].iter().any(|v| self.is_lang(&callee.name, v))
                && let Some(f) = call.arguments.first().and_then(|a| a.as_expression())
            {
                self.note_props_type(f);
            }
        }
        // `view(F)`: F's props type is the view's.
        self.wrapped.extend(wrapped.iter().cloned());
        for statement in body {
            if let Statement::FunctionDeclaration(f) = statement
                && f.id.as_ref().is_some_and(|id| wrapped.contains(&id.name.to_string()))
            {
                self.note_function_props(f);
            }
        }
        // React components that only return `toElement(tree)`: views.
        for statement in body {
            let declaration = match statement {
                Statement::ExportDeclaration(export) => Some(&export.declaration),
                _ => statement.as_declaration(),
            };
            let default_fn = match statement {
                Statement::ExportDefaultDeclaration(export) => match &export.declaration {
                    ExportDefaultDeclarationKind::FunctionDeclaration(f) => Some(f),
                    _ => None,
                },
                _ => None,
            };
            let found: Option<(String, &[Statement], Span)> = if let Some(f) = default_fn {
                match (&f.id, &f.body) {
                    (Some(id), Some(b)) => Some((id.name.to_string(), &b.statements[..], f.span)),
                    _ => None,
                }
            } else {
                match declaration {
                    Some(Declaration::FunctionDeclaration(f)) => match (&f.id, &f.body) {
                        (Some(id), Some(b)) => Some((id.name.to_string(), &b.statements[..], f.span)),
                        _ => None,
                    },
                    Some(Declaration::VariableDeclaration(v)) => v.declarations.first().and_then(|d| {
                        let BindingPattern::BindingIdentifier(id) = &d.id else { return None };
                        let init = d.init.as_ref()?;
                        let init = match memo_call(init, &self.react) {
                            Some(m) => m.function,
                            None => init,
                        };
                        match init {
                            Expression::ArrowFunctionExpression(a) => {
                                Some((id.name.to_string(), crate::view::arrow_statements(a), a.span))
                            }
                            Expression::FunctionExpression(f) => {
                                f.body.as_ref().map(|b| (id.name.to_string(), &b.statements[..], f.span))
                            }
                            _ => None,
                        }
                    }),
                    _ => None,
                }
            };
            if let Some((name, statements, _span)) = found
                && name.starts_with(|c: char| c.is_ascii_uppercase())
                && returns_to_element(statements, &|n| self.is_lang(n, "toElement"))
            {
                self.components.insert(name.clone());
                self.views.insert(name);
                if let Some(props) = component_props_type(declaration, default_fn.map(|f| &**f), &self.react)
                {
                    self.props_types.insert(props);
                }
            }
        }
        // Module functions and constants that build UI.
        for statement in body {
            let declaration = match statement {
                Statement::ExportDeclaration(export) => Some(&export.declaration),
                _ => statement.as_declaration(),
            };
            match declaration {
                Some(Declaration::FunctionDeclaration(f)) => {
                    if let Some(id) = &f.id
                        && self.function_builds_ui(f)
                    {
                        self.view_fns.insert(id.name.to_string());
                    }
                }
                Some(Declaration::VariableDeclaration(v)) => {
                    for d in &v.declarations {
                        if let (BindingPattern::BindingIdentifier(id), Some(init)) = (&d.id, &d.init) {
                            let builds = match init.without_parentheses() {
                                Expression::ArrowFunctionExpression(arrow) => self.arrow_builds_ui(arrow),
                                other => self.is_view(other),
                            };
                            if builds {
                                self.view_fns.insert(id.name.to_string());
                            }
                        }
                    }
                }
                _ => {}
            }
        }
    }

    fn note_props_type(&mut self, f: &Expression) {
        let params = match f.without_parentheses() {
            Expression::FunctionExpression(f) => &f.params,
            Expression::ArrowFunctionExpression(a) => &a.params,
            _ => return,
        };
        if let Some(name) = params.items.first().and_then(|p| p.type_annotation.as_ref()).and_then(|t| {
            if let TSType::TSTypeReference(r) = &t.type_annotation
                && let TSTypeName::IdentifierReference(id) = &r.type_name
            {
                Some(id.name.to_string())
            } else {
                None
            }
        }) {
            self.props_types.insert(name);
        }
    }

    fn note_function_props(&mut self, f: &Function) {
        if let Some(name) = f.params.items.first().and_then(|p| p.type_annotation.as_ref()).and_then(|t| {
            if let TSType::TSTypeReference(r) = &t.type_annotation
                && let TSTypeName::IdentifierReference(id) = &r.type_name
            {
                Some(id.name.to_string())
            } else {
                None
            }
        }) {
            self.props_types.insert(name);
        }
    }

    /// `defineModifier((v) => v.a(…).b(…))`: the chain after `v`, inlined where it is applied.
    fn define_modifier(&mut self, name: &str, call: &oxc_ast::ast::CallExpression) {
        let Some(Expression::ArrowFunctionExpression(arrow)) =
            call.arguments.first().and_then(|a| a.as_expression())
        else {
            self.refuse("modifier:define", "`defineModifier` takes an arrow over one view", call.span);
            return;
        };
        let (Some(param), Some(body)) = (
            arrow.params.items.first().and_then(|p| match &p.pattern {
                BindingPattern::BindingIdentifier(id) => Some(id.name.to_string()),
                _ => None,
            }),
            arrow.get_expression(),
        ) else {
            self.refuse("modifier:define", "`defineModifier` takes an arrow over one view", call.span);
            return;
        };
        match chain_root(body) {
            Some(root) if root == param => {
                // The body without its parameter is the chain applied where `.modifier(M)` was.
                self.quiet = true;
                let text = self.expr(body);
                self.quiet = false;
                let chain = text.strip_prefix(&param).map(str::to_string).unwrap_or_default();
                self.modifiers.insert(name.to_string(), chain);
            }
            _ => {
                self.refuse(
                    "modifier:define",
                    "`defineModifier`'s body is not a chain on its view",
                    call.span,
                );
            }
        }
    }

    // ---- items ---------------------------------------------------------------

    fn item(&mut self, statement: &Statement, defaults: &HashSet<String>, body: &[Statement]) -> String {
        match statement {
            Statement::ExportDeclaration(export) => {
                self.declaration(&export.declaration, "pub ", defaults, body)
            }
            Statement::ExportNamedDeclaration(export) => {
                self.refuse("export:list", "an `export { … }` list (export each item instead)", export.span)
            }
            Statement::ExportFromDeclaration(export) => {
                self.refuse("export:list", "an `export { … } from` re-export", export.span)
            }
            Statement::ExportDefaultDeclaration(export) => match &export.declaration {
                ExportDefaultDeclarationKind::Identifier(_) => String::new(),
                ExportDefaultDeclarationKind::CallExpression(call)
                    if memo_of(call).is_some_and(|x| self.components.contains(&x)) =>
                {
                    String::new()
                }
                ExportDefaultDeclarationKind::CallExpression(call) => {
                    let name = match call.arguments.first().and_then(|a| a.as_expression()) {
                        Some(Expression::FunctionExpression(f)) => {
                            f.id.as_ref().map(|id| id.name.to_string())
                        }
                        Some(Expression::ArrowFunctionExpression(_)) => self.default_name(call),
                        _ => None,
                    };
                    match name {
                        Some(name) => self.view_item(&name, call, "pub default ", body),
                        None => self.refuse(
                            "export:default",
                            "a default export that is not a named view",
                            export.span,
                        ),
                    }
                }
                ExportDefaultDeclarationKind::FunctionDeclaration(f)
                    if f.id.as_ref().is_some_and(|id| self.components.contains(id.name.as_str())) =>
                {
                    let name = f.id.as_ref().map(|id| id.name.to_string()).unwrap_or_default();
                    match self.route_kind() {
                        // A route's default export is a React component: a `screen` or `layout`.
                        Some(kind) => self.route_fn(kind, &name, f, body),
                        None => self.function_item(&name, f, "pub default ", body),
                    }
                }
                ExportDefaultDeclarationKind::FunctionDeclaration(f) => {
                    self.refuse("component:react", "a default-exported function component", f.span)
                }
                _ => self.refuse("export:default", "a default export that is not a named view", export.span),
            },
            Statement::ExportAllDeclaration(export) => {
                self.refuse("export:list", "an `export * from` re-export", export.span)
            }
            // `X.displayName = "…"` on a component that is now a view: the view names itself.
            Statement::ExpressionStatement(e) if self.view_display_name(&e.expression) => String::new(),
            _ => match statement.as_declaration() {
                Some(declaration) => self.declaration(declaration, "", defaults, body),
                None => self.refuse("statement:top-level", "a statement at module level", statement.span()),
            },
        }
    }

    /// An anonymous default `screen`/`layout`/`view` is named after its route:
    /// `app/(tabs)/_layout.tsx` is `TabsLayout`, `settings/index.tsx` `SettingsScreen`.
    fn default_name(&self, call: &oxc_ast::ast::CallExpression) -> Option<String> {
        let Expression::Identifier(callee) = &call.callee else { return None };
        let suffix = match self.lang.get(callee.name.as_str()).map(String::as_str) {
            Some("layout") => "Layout",
            Some("screen") => "Screen",
            Some("view") => "View",
            _ => return None,
        };
        let path = std::path::Path::new(&self.filename);
        let stem = path.file_stem()?.to_string_lossy().into_owned();
        let word = if stem.starts_with('_') || stem == "index" {
            path.parent()?.file_name()?.to_string_lossy().into_owned()
        } else {
            stem
        };
        let camel: String = word
            .split(|c: char| !c.is_ascii_alphanumeric())
            .filter(|p| !p.is_empty())
            .map(|p| p[..1].to_ascii_uppercase() + &p[1..])
            .collect();
        let camel = if camel.starts_with(|c: char| c.is_ascii_alphabetic()) {
            camel
        } else {
            format!("Route{camel}")
        };
        Some(format!("{camel}{suffix}"))
    }

    fn visibility(&self, name: &str, given: &'static str, defaults: &HashSet<String>) -> &'static str {
        if defaults.contains(name) { "pub default " } else { given }
    }

    fn declaration(
        &mut self,
        declaration: &Declaration,
        vis: &'static str,
        defaults: &HashSet<String>,
        body: &[Statement],
    ) -> String {
        match declaration {
            Declaration::VariableDeclaration(v) => {
                if v.kind != VariableDeclarationKind::Const {
                    return self.refuse("module:mutable", "a module-level `let`/`var`", v.span);
                }
                let mut out = Vec::new();
                for d in &v.declarations {
                    let BindingPattern::BindingIdentifier(id) = &d.id else {
                        out.push(self.refuse("module:destructure", "a destructured module constant", d.span));
                        continue;
                    };
                    let name = id.name.to_string();
                    let vis = self.visibility(&name, vis, defaults);
                    let Some(init) = &d.init else {
                        out.push(self.refuse("module:uninitialised", "a constant without a value", d.span));
                        continue;
                    };
                    out.push(self.constant(&name, d.type_annotation.as_deref(), init, vis, body));
                }
                out.retain(|s| !s.is_empty());
                out.join("\n\n")
            }
            Declaration::FunctionDeclaration(f) => {
                let Some(id) = &f.id else {
                    return self.refuse("fn:anonymous", "an anonymous function", f.span);
                };
                let name = id.name.to_string();
                if self.wrapped.contains(&name) {
                    // Drawn by its `view(F)` constant, where it is translated.
                    return String::new();
                }
                let vis = self.visibility(&name, vis, defaults);
                self.function_item(&name, f, vis, body)
            }
            Declaration::TSInterfaceDeclaration(interface) => {
                let name = interface.id.name.to_string();
                if self.props_types.contains(&name) && vis.is_empty() {
                    return String::new();
                }
                if !interface.extends.is_empty() {
                    return self.refuse(
                        "type:extends",
                        format!("`interface {name}` extends another type"),
                        interface.span,
                    );
                }
                let generics = self.generics(interface.type_parameters.as_deref());
                let fields = self.struct_fields(&interface.body.body);
                let vis = self.visibility(&name, vis, defaults);
                format!("{vis}struct {name}{generics} {{\n{fields}}}")
            }
            Declaration::TSTypeAliasDeclaration(alias) => {
                let name = alias.id.name.to_string();
                let vis = self.visibility(&name, vis, defaults);
                if let Some(cases) = self.unions.get(&name).cloned() {
                    if let Some(bad) = cases.iter().find(|c| !is_identifier(c)) {
                        return self.refuse(
                            "type:union-case",
                            format!("`{name}` has the case \"{bad}\", which is not a name"),
                            alias.span,
                        );
                    }
                    return format!("{vis}enum {name} {{\n{}\n}}", cases.join("\n"));
                }
                if let TSType::TSTypeLiteral(literal) = &alias.type_annotation {
                    if self.props_types.contains(&name) && vis.is_empty() {
                        return String::new();
                    }
                    let generics = self.generics(alias.type_parameters.as_deref());
                    let fields = self.struct_fields(&literal.members);
                    return format!("{vis}struct {name}{generics} {{\n{fields}}}");
                }
                let generics = self.generics(alias.type_parameters.as_deref());
                let ty = self.ty(&alias.type_annotation);
                format!("{vis}type {name}{generics} = {ty}")
            }
            Declaration::TSEnumDeclaration(e) => self.refuse("type:ts-enum", "a TypeScript `enum`", e.span),
            Declaration::ClassDeclaration(c) => self.refuse("class", "a class", c.span),
            other => self.refuse("declaration", "a declaration with no `.bloom` form", other.span()),
        }
    }

    fn generics(&mut self, params: Option<&oxc_ast::ast::TSTypeParameterDeclaration>) -> String {
        match params {
            Some(p) if !p.params.is_empty() => {
                let names: Vec<String> = p.params.iter().map(|t| t.name.name.to_string()).collect();
                format!("<{}>", names.join(", "))
            }
            _ => String::new(),
        }
    }

    fn struct_fields(&mut self, members: &[TSSignature]) -> String {
        let mut out = String::new();
        for member in members {
            let comments = self.comments.before(member.span().start, false);
            out.push_str(&comments);
            match self.field(member) {
                Some((name, ty, optional)) => {
                    if optional {
                        out.push_str(&format!("{name}: {} = none\n", optional_ty(&ty)));
                    } else {
                        out.push_str(&format!("{name}: {ty}\n"));
                    }
                }
                None => continue,
            }
        }
        out
    }

    /// A member of an object type: its name, type and whether it may be absent.
    pub fn field(&mut self, member: &TSSignature) -> Option<(String, String, bool)> {
        match member {
            TSSignature::TSPropertySignature(p) => {
                let name = match &p.key {
                    oxc_ast::ast::PropertyKey::StaticIdentifier(id) => id.name.to_string(),
                    _ => {
                        self.refuse("type:computed-key", "a computed or quoted member name", p.span);
                        return None;
                    }
                };
                let Some(ty) = &p.type_annotation else {
                    self.refuse("type:untyped-member", format!("`{name}` has no type"), p.span);
                    return None;
                };
                let ty = self.ty(&ty.type_annotation);
                Some((name, ty, p.optional))
            }
            TSSignature::TSMethodSignature(m) => {
                let name = match &m.key {
                    oxc_ast::ast::PropertyKey::StaticIdentifier(id) => id.name.to_string(),
                    _ => {
                        self.refuse("type:computed-key", "a computed or quoted member name", m.span);
                        return None;
                    }
                };
                let ty =
                    self.fn_type(&m.params, m.return_type.as_deref().map(|t| &t.type_annotation), m.span);
                Some((name, ty, m.optional))
            }
            other => {
                self.refuse("type:signature", "an index, call or construct signature", other.span());
                None
            }
        }
    }

    fn constant(
        &mut self,
        name: &str,
        annotation: Option<&oxc_ast::ast::TSTypeAnnotation>,
        init: &Expression,
        vis: &'static str,
        body: &[Statement],
    ) -> String {
        let init = init.without_parentheses();
        if let Expression::CallExpression(call) = init
            && let Expression::Identifier(callee) = &call.callee
        {
            let callee = callee.name.to_string();
            if self.is_lang(&callee, "view")
                || self.is_lang(&callee, "screen")
                || self.is_lang(&callee, "layout")
            {
                return self.view_item(name, call, vis, body);
            }
            if self.is_lang(&callee, "defineModifier") {
                return String::new();
            }
            if matches!(self.react.get(&callee).map(String::as_str), Some("lazy" | "forwardRef")) {
                return self.refuse(
                    &format!("react:{}", self.react[&callee]),
                    format!("`{callee}(…)`"),
                    call.span,
                );
            }
        }
        if let Some(memo) = memo_call(init, &self.react) {
            if let Some(comparator) = memo.comparator {
                // The comparator is the view's `equal(old, new) { … }` member.
                let member = self.equal_member(comparator);
                self.pending_equal = Some(member);
            }
            // A view is already `memo`'d: the wrapper goes.
            return match memo.function {
                Expression::ArrowFunctionExpression(arrow) => {
                    self.arrow_item(name, arrow, vis, memo.props, body)
                }
                Expression::FunctionExpression(f) => self.function_item_typed(name, f, vis, memo.props, body),
                _ => unreachable!(),
            };
        }
        if let Expression::CallExpression(call) = init
            && let Expression::StaticMemberExpression(member) = &call.callee
            && let Expression::Identifier(object) = &member.object
            && self.react.get(object.name.as_str()).is_some_and(|e| e == "default" || e == "*")
        {
            return self.refuse(
                &format!("react:{}", member.property.name),
                format!("`React.{}(…)`", member.property.name),
                call.span,
            );
        }
        match init {
            Expression::ArrowFunctionExpression(arrow) => {
                // `const X: React.FC<P> = (…) =>`: the props type is the annotation's argument.
                let props_ty = annotation.and_then(|t| match &t.type_annotation {
                    TSType::TSTypeReference(r) => r.type_arguments.as_ref().and_then(|a| a.params.first()),
                    _ => None,
                });
                self.arrow_item(name, arrow, vis, props_ty, body)
            }
            Expression::FunctionExpression(f) => self.function_item(name, f, vis, body),
            _ => {
                let ty = annotation.map(|t| format!(": {}", self.ty(&t.type_annotation))).unwrap_or_default();
                let value = self.expr(init);
                format!("{vis}let {name}{ty} = {value}")
            }
        }
    }
}

/// A union of string literals (`'a' | 'b'`): its cases.
pub fn string_union(ty: &TSType) -> Option<Vec<String>> {
    let TSType::TSUnionType(union) = ty else { return None };
    let mut cases = Vec::new();
    for member in &union.types {
        let TSType::TSLiteralType(literal) = member else { return None };
        let oxc_ast::ast::TSLiteral::StringLiteral(s) = &literal.literal else { return None };
        cases.push(s.value.as_str().unwrap_or_default().to_string());
    }
    Some(cases)
}

pub fn is_identifier(text: &str) -> bool {
    let mut chars = text.chars();
    chars.next().is_some_and(|c| c.is_ascii_alphabetic() || c == '_')
        && chars.all(|c| c.is_ascii_alphanumeric() || c == '_')
        && !bloom_lang::KEYWORDS.contains(&text)
}

/// `T` as an optional, once.
/// A TS type bloomc cannot spell, kept verbatim: `Foreign<"AvatarProps['source']">`.
/// The names it mentions stay imported.
impl Tr<'_> {
    pub fn foreign_ty(&mut self, text: &str) -> String {
        let text = text.split_whitespace().collect::<Vec<_>>().join(" ").replace('"', "'");
        for word in text.split(|c: char| !(c.is_alphanumeric() || c == '_' || c == '$')) {
            if word.chars().next().is_some_and(|c| c.is_alphabetic() || c == '_') {
                self.used.insert(word.to_string());
            }
        }
        format!("Foreign<\"{text}\">")
    }
}

/// Keywords that may name params, fields and values (#979).
const CONTEXTUAL: &[&str] = &["type", "body", "view", "screen", "layout", "from"];

pub fn optional_ty(ty: &str) -> String {
    // A function or union type is parenthesised: `(() -> Unit)?`, `("a" | "b")?`.
    if ty.contains("->") || ty.contains(" | ") {
        let whole = ty.strip_suffix('?').is_some_and(|t| t.starts_with('(') && closes_at_end(t));
        return if whole { ty.to_string() } else { format!("({ty})?") };
    }
    if ty.ends_with('?') { ty.to_string() } else { format!("{ty}?") }
}

/// Whether the `(` that starts `t` closes at its last character.
fn closes_at_end(t: &str) -> bool {
    let mut depth = 0i32;
    for (i, c) in t.char_indices() {
        match c {
            '(' => depth += 1,
            ')' => {
                depth -= 1;
                if depth == 0 {
                    return i == t.len() - 1;
                }
            }
            _ => {}
        }
    }
    false
}

/// The identifier a chain (`v.a().b()`) starts from.
fn chain_root(expression: &Expression) -> Option<String> {
    match expression.without_parentheses() {
        Expression::Identifier(id) => Some(id.name.to_string()),
        Expression::CallExpression(call) => chain_root(&call.callee),
        Expression::StaticMemberExpression(m) => chain_root(&m.object),
        _ => None,
    }
}

pub const VIEW_TYPES: &[&str] = LANG_VIEW_TYPES;

/// A module `let` read by an item above it moves up, above the first item that is
/// not a `let` (the order of the `let`s kept): a module value is in scope after its
/// declaration, while TS's functions read a later `const` when they run.
fn hoist_lets(items: Vec<String>) -> Vec<String> {
    fn let_name(item: &str) -> Option<&str> {
        let code = item.lines().find(|l| !l.trim_start().starts_with("//") && !l.trim().is_empty())?;
        let rest = code.strip_prefix("pub ").unwrap_or(code).strip_prefix("let ")?;
        let end = rest.find(|c: char| !(c.is_alphanumeric() || c == '_')).unwrap_or(rest.len());
        (end > 0).then(|| &rest[..end])
    }
    fn mentions(text: &str, name: &str) -> bool {
        text.match_indices(name).any(|(i, _)| {
            let before = text[..i].chars().next_back();
            let after = text[i + name.len()..].chars().next();
            let word = |c: Option<char>| c.is_some_and(|c| c.is_alphanumeric() || c == '_');
            !word(before) && !word(after)
        })
    }
    let Some(first) = items.iter().position(|item| let_name(item).is_none()) else { return items };
    let late: Vec<usize> = (first..items.len())
        .filter(|&i| let_name(&items[i]).is_some_and(|n| items[..i].iter().any(|it| mentions(it, n))))
        .collect();
    if late.is_empty() {
        return items;
    }
    // A hoisted `let` takes the `let`s it reads along (they stay in order).
    let mut moved: Vec<usize> = late.clone();
    for &i in late.iter().rev() {
        for j in first..i {
            if !moved.contains(&j)
                && let Some(n) = let_name(&items[j])
                && mentions(&items[i], n)
            {
                moved.push(j);
            }
        }
    }
    moved.sort_unstable();
    let mut out: Vec<String> = items[..first].to_vec();
    out.extend(moved.iter().map(|&i| items[i].clone()));
    out.extend((first..items.len()).filter(|i| !moved.contains(i)).map(|i| items[i].clone()));
    out
}
