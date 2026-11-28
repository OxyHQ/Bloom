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
    /// TS casts `x as T` the codemod dropped, by the text of `x`: where bloomc finds a `String`
    /// for a string literal union, the cast is Bloom's `x as! T` (`crate::typed::casts`).
    pub casts: HashMap<String, String>,
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
    /// Names bound from an Axios-shaped cast (`error as { response?: { data?: … } }`): an
    /// `HTTPError?`, whose `response.data` fields are read from its decoded body (`Tr::http_error`).
    pub http_errors: HashSet<String>,
    /// Names bound to a `new Map`/`new Set`: their in-place changes reassign them.
    pub collections: HashMap<String, String>,
    /// Member functions of the view being translated.
    pub member_fns: HashSet<String>,
    /// Object literals whose fields are then written (`params.q = v`, `counts[k] += 1`):
    /// a `var` each write reassigns; `true` for one written by key (a dictionary).
    pub grown: HashMap<String, bool>,
    /// A value whose branches give it (`let body; if (c) body = a; else body = b`):
    /// a write of it is the branch's `return`.
    pub assign_returns: Option<String>,
    /// The props are named whole (`..props: P`): `props` is a value.
    pub whole_props: bool,
    /// The props of a view that hands them on whole, written out: `X(props)` passes each.
    pub props_fields: Vec<String>,
    /// Those props' types (name, type, optional), for [`Scope::field_defaults`].
    pub props_field_types: Vec<(String, String, bool)>,
    /// `const { isNested = false } = props` of written-out props: the stored property's own
    /// default (`var isNested: Bool = false`), which is TS's destructure default exactly.
    pub field_defaults: Vec<(String, String)>,
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
    /// The fields of the file's object types (`interface P { … }`, `type P = { … }`), as record
    /// fields: an inline intersection of them is one record type (`crate::types`).
    pub object_fields: HashMap<String, Vec<String>>,
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
    /// The file on disk (`filename` under the root): where its relative imports are read from.
    pub path: String,
    /// Each imported local name's module specifier.
    pub import_sources: HashMap<String, String>,
    /// TS types the output names that the file did not import (a props type's fields
    /// written out): (module specifier, name), imported as types.
    pub extra_imports: Vec<(String, String)>,
    pub scope: Scope,
    /// Module functions a `view(F)` constant wraps: translated as that view.
    pub wrapped: HashSet<String>,
    /// Module functions taking one destructured object, every call passing one object or
    /// a name: labelled parameters (key, type, optional), in the pattern's order.
    pub labelled: HashMap<String, Vec<(String, String, bool)>>,
    /// Views whose props end in a rest (`{ label, ...menu }: P & { label }`): the rest's
    /// name and the own props; a call's other fields are the rest's record.
    pub rest_views: HashMap<String, (String, Vec<String>)>,
    /// `useQuery({ … })` and `useInfiniteQuery({ … })` calls drawn with Mention's `TanStackQuery`
    /// binding module (their span starts): every one of the file, each with options and result reads the
    /// binding declares (`Tr::scan_tanstack`).
    pub tanstack: HashSet<u32>,
    /// Views whose written-out props took TS destructure defaults (`Scope::field_defaults`): a
    /// view that hands its props to one on whole takes the same defaults, so the forward fits.
    pub view_defaults: HashMap<String, Vec<(String, String)>>,
    /// `const X = memo(Named, compare)` of a local view: the file's own reads of `X` name the
    /// view (`Named`), since a module `let` is in scope only below it and the view is above.
    pub view_aliases: HashMap<String, String>,
    /// Review notes for the statement being translated (`Tr::review`).
    pub reviews: Vec<String>,
    /// While set, comments stay queued (a `defineModifier` read ahead of its place).
    pub quiet: bool,
    /// Inside a `try` written as a `Result` closure: an `await` propagates with `?`.
    pub propagate: bool,
    /// Inside a `do` block (TS's `try`): a TS `await` is `try await`, a `throw` is `throw`.
    pub in_do: bool,
    /// Async functions that return a value and await a TS promise outside a `try`: TS's
    /// rejection rejects their promise, so they are `async throws` and their awaits `try await`
    /// (`Tr::scan_throwing`).
    pub throwing: HashSet<String>,
    /// Translating a `Map`'s entries: a two-item list literal is a tuple.
    pub pairs: bool,
    /// Inside that closure: a bare `return` is `return ok(())`.
    pub try_return: bool,
    /// Inside a `forEach` callback written as a `for`: a bare `return` is `continue`. The
    /// next closure body takes `pending_loop_return` as its own.
    pub loop_return: bool,
    pub pending_loop_return: bool,
    /// How many closures the statement is in: a `throw` in one is `err(e)?`.
    pub closures: u32,
    /// Translating the arguments of a call to a TS import (`useMutation({ mutationFn })`):
    /// an async closure among them is one TS calls, whose `await`s reject with `?`.
    pub ts_args: bool,
    /// TS imports named like a Bloom node (`Button` from `@oxy.so/bloom/button`,
    /// `ScrollView` from `react-native`): imported under another name, since in
    /// `.bloom` the node's name is the node.
    pub import_renames: HashMap<String, String>,
    /// Translating an `if`/`for`/`while` head, where `{` opens the body: a closure
    /// argument stays inside the parentheses.
    pub head: bool,
    /// The next block translated is a loop's body: `if (c) continue;` there guards the rest.
    pub loop_block: bool,
    /// Translating a hook function (`fn useX`): React's memo hooks are TS calls.
    pub hook_fn: bool,
    /// Language exports the output calls as TS (`defineModifier` for a modifier value).
    pub lang_values: std::collections::BTreeSet<String>,
    /// Names an `export { a, b }` list exports: `pub` where they are declared.
    pub listed_exports: HashSet<String>,
    /// `const X = memo(Named, compare)`: Named's `equal(old, new)` member.
    pub equal_for: HashMap<String, String>,
    /// Translating `lazy`'s closure: `import("./X")` is written as is.
    pub dynamic_import: bool,
    /// React's hooks the output calls (from a hook function).
    pub react_values: std::collections::BTreeSet<String>,
    /// Condition operands of unknown type (see [`Translated::conditions`]).
    pub defaults: HashMap<String, Vec<String>>,
    pub conditions: HashSet<String>,
    /// See [`Translated::casts`].
    pub casts: HashMap<String, String>,
    /// Calls whose one type argument types the binding they initialise.
    pub typed_calls: HashSet<u32>,
    /// `let x = x ?? d` lines a pattern's defaults leave for after its `let`.
    pub pattern_defaults: Vec<String>,
    /// The `equal(old, new) { … }` member of the view being declared (a memo comparator).
    pub pending_equal: Option<String>,
    /// The module constant initialiser being translated (`Tr::constant`): an `as const` list
    /// that is one is the module constant itself.
    pub module_init: Option<Span>,
    /// Module constants an expression inside a function needs (`(['a', 'b'] as const).map(…)`):
    /// written above the item being translated, in order (`Tr::hoist_const_list`).
    pub hoisted: Vec<(String, String)>,
    /// Every name [`Tr::hoisted`] has given in the module (it is emptied item by item).
    pub hoisted_names: HashSet<String>,
    /// `actions(…)`/`menu(…)` constants written as `MenuActions`/`MenuContent` structs: a
    /// call of one takes labelled arguments, as a view's does.
    pub menu_structs: HashSet<String>,
    /// The fields TS read off an Axios error's `response.data`, with their Bloom types: the
    /// module's `ServerErrorBody` struct, which `HTTPResponse.decode` reads (`Tr::http_error`).
    pub server_error_fields: Vec<(String, String)>,
    /// Translating a `MenuActions`/`MenuContent` struct (`Tr::menu_struct`).
    pub in_menu: bool,
    /// Each menu struct's stored properties, in order: `F(options)` of a whole value passes each.
    pub menu_fields: HashMap<String, Vec<String>>,
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
/// `MenuView` is a `Menu(…)` chain: in Bloom, a `View` like any node.
const LANG_VIEW_TYPES: &[&str] = &["Child", "ViewNode", "MenuView"];

/// A translator for `source` (`filename`), before its imports are read.
pub fn new_tr<'s>(source: &'s str, filename: &str, comments: Comments) -> Tr<'s> {
    Tr {
        src: source,
        filename: filename.to_string(),
        line_starts: {
            let mut starts = vec![0];
            starts.extend(source.match_indices('\n').map(|(i, _)| i as u32 + 1));
            starts
        },
        comments,
        reasons: Vec::new(),
        lang: HashMap::new(),
        react: HashMap::new(),
        modifiers: HashMap::new(),
        unions: HashMap::new(),
        objects: HashSet::new(),
        object_fields: HashMap::new(),
        props_types: HashSet::new(),
        views: HashSet::new(),
        components: HashSet::new(),
        fns: HashSet::new(),
        view_fns: HashSet::new(),
        used: HashSet::new(),
        js: Default::default(),
        imported: HashSet::new(),
        path: filename.to_string(),
        import_sources: HashMap::new(),
        extra_imports: Vec::new(),
        react_types: Default::default(),
        scope: Scope::default(),
        wrapped: HashSet::new(),
        labelled: HashMap::new(),
        rest_views: HashMap::new(),
        tanstack: HashSet::new(),
        view_defaults: HashMap::new(),
        view_aliases: HashMap::new(),
        reviews: Vec::new(),
        quiet: false,
        propagate: false,
        in_do: false,
        throwing: HashSet::new(),
        pairs: false,
        try_return: false,
        loop_return: false,
        pending_loop_return: false,
        closures: 0,
        ts_args: false,
        head: false,
        loop_block: false,
        hook_fn: false,
        dynamic_import: false,
        equal_for: HashMap::new(),
        listed_exports: HashSet::new(),
        lang_values: Default::default(),
        react_values: Default::default(),
        import_renames: HashMap::new(),
        pending_equal: None,
        module_init: None,
        hoisted: Vec::new(),
        hoisted_names: HashSet::new(),
        menu_structs: HashSet::new(),
        server_error_fields: Vec::new(),
        in_menu: false,
        menu_fields: HashMap::new(),
        pattern_defaults: Vec::new(),
        typed_calls: HashSet::new(),
        conditions: HashSet::new(),
        casts: HashMap::new(),
        defaults: HashMap::new(),
    }
}

/// Reads `body`'s imports into `tr` (where names come from), for a file read only for its
/// types (a props interface's): a file that does not import `React` names its global
/// namespace.
pub fn read_imports(tr: &mut Tr, body: &[Statement]) {
    let mut imports = Imports::default();
    for statement in body {
        if let Statement::ImportDeclaration(import) = statement {
            tr.import(import, &mut imports);
        }
    }
    if !tr.react.contains_key("React") && !tr.imported.contains("React") {
        tr.react.insert("React".into(), "*".into());
    }
}

pub fn translate(source: &str, filename: &str, path: &str) -> Translated {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(filename).unwrap_or_default();
    let parsed = Parser::new(&allocator, source, source_type).parse();
    if parsed.diagnostics.has_errors() {
        return Translated {
            conditions: HashSet::new(),
            defaults: HashMap::new(),
            casts: HashMap::new(),
            text: String::new(),
            reasons: vec![Reason {
                code: "parse".into(),
                detail: "the TypeScript does not parse".into(),
                line: 0,
            }],
        };
    }
    let program = parsed.program;
    let mut tr = new_tr(source, filename, Comments::new(source, &program.comments));
    tr.path = path.to_string();

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
    // `React.ReactNode` in a file that does not import `React`: its global namespace.
    if !tr.react.contains_key("React") && !tr.imported.contains("React") {
        tr.react.insert("React".into(), "*".into());
    }
    let header = tr.comments.before(first, false);
    tr.scan(&program.body);
    tr.scan_memo_aliases(&program.body);
    tr.scan_object_fields(&program.body);

    let defaults = default_exports(&program.body);
    for statement in &program.body {
        if let Statement::ExportNamedDeclaration(export) = statement
            && let Some(names) = export_list(export)
        {
            tr.listed_exports.extend(names);
        }
    }
    tr.scan_labelled(&program.body);
    tr.scan_tanstack(&program.body);
    tr.scan_throwing(&program);
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
        // A list an expression inside the item took as a module constant goes above it.
        for (name, list) in std::mem::take(&mut tr.hoisted) {
            items.push(format!("let {name} = {list}"));
        }
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
    if !tr.server_error_fields.is_empty() {
        let fields: Vec<String> =
            tr.server_error_fields.iter().map(|(k, t)| format!("var {k}: {t} = none")).collect();
        // Above every item: bloomc derives `Codable` for a struct declared before its `T.self`.
        items.insert(0, format!(
            "/// The server's error JSON, as TS read it off an Axios error's `response.data`.\nstruct ServerErrorBody: Codable {{\n{}\n}}",
            fields.join("\n")
        ));
    }
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
    Translated {
        text: out,
        reasons: tr.reasons,
        conditions: tr.conditions,
        defaults: tr.defaults,
        casts: tr.casts,
    }
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

/// `memo(Named)` / `React.memo(Named, compare)`: the component's name and the comparator.
fn memo_alias<'b, 'a>(
    e: &'b Expression<'a>,
    react: &HashMap<String, String>,
) -> Option<(String, Option<&'b Expression<'a>>)> {
    let Expression::CallExpression(call) = e.without_parentheses() else { return None };
    let namespace = |n: &str| react.get(n).is_some_and(|e| e == "default" || e == "*");
    let is_memo = match &call.callee {
        Expression::Identifier(id) => react.get(id.name.as_str()).is_some_and(|e| e == "memo"),
        Expression::StaticMemberExpression(m) => {
            m.property.name == "memo" && matches!(&m.object, Expression::Identifier(o) if namespace(&o.name))
        }
        _ => false,
    };
    match (is_memo, call.arguments.as_slice()) {
        (true, [Argument::Identifier(id)]) => Some((id.name.to_string(), None)),
        (true, [Argument::Identifier(id), compare]) => Some((id.name.to_string(), compare.as_expression())),
        _ => None,
    }
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
/// Whether `e` is an element (JSX, `toElement(…)`, `null`, a conditional of them, or a body
/// constant `elements` names that is one).
fn element_value(
    e: &Expression,
    to_element: &dyn Fn(&str) -> bool,
    elements: &[(&str, &Expression)],
    depth: u8,
) -> bool {
    match e.without_parentheses() {
        Expression::NullLiteral(_) | Expression::JSXElement(_) | Expression::JSXFragment(_) => true,
        Expression::CallExpression(call) => {
            matches!(&call.callee, Expression::Identifier(id) if to_element(&id.name))
        }
        Expression::ConditionalExpression(c) => {
            element_value(&c.consequent, to_element, elements, depth)
                && element_value(&c.alternate, to_element, elements, depth)
        }
        Expression::Identifier(id) if depth == 0 => elements
            .iter()
            .find(|(n, _)| *n == id.name.as_str())
            .is_some_and(|(_, init)| element_value(init, to_element, elements, 1)),
        _ => false,
    }
}

fn returns_to_element(statements: &[Statement], to_element: &dyn Fn(&str) -> bool) -> bool {
    // `const empty = c ? <A/> : null; … return empty`: a body constant that is an element.
    let elements: Vec<(&str, &Expression)> = statements
        .iter()
        .filter_map(|s| match s {
            Statement::VariableDeclaration(v) if v.kind == VariableDeclarationKind::Const => Some(v),
            _ => None,
        })
        .flat_map(|v| v.declarations.iter())
        .filter_map(|d| match (&d.id, &d.init) {
            (BindingPattern::BindingIdentifier(id), Some(init)) => Some((id.name.as_str(), init)),
            _ => None,
        })
        .collect();
    let value_ok = |e: &Expression| -> bool { element_value(e, to_element, &elements, 0) };
    fn walk(
        statements: &[Statement],
        value_ok: &dyn Fn(&Expression) -> bool,
        any: &mut bool,
    ) -> bool {
        for statement in statements {
            match statement {
                Statement::ReturnStatement(r) => match &r.argument {
                    Some(v) if value_ok(v) => *any |= !matches!(v, Expression::NullLiteral(_)),
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
                        if !walk(inner, value_ok, any) {
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
    walk(statements, &value_ok, &mut any) && any
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
                    self.import_sources.insert(local.clone(), source.clone());
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
        if !self.tanstack.is_empty() {
            out.push_str("import TanStackQuery\n");
        }
        if !self.lang_values.is_empty() {
            let names: Vec<String> = self
                .lang_values
                .iter()
                .map(|local| match self.lang.get(local) {
                    Some(export) if export != local => format!("{export} as {local}"),
                    _ => local.clone(),
                })
                .collect();
            out.push_str(&format!("import {{ {} }} from \"{LANGUAGE}\"\n", names.join(", ")));
        }
        if !self.js.is_empty() {
            let names: Vec<&str> = self.js.iter().map(String::as_str).collect();
            out.push_str(&format!("import {{ {} }} from \"js\"\n", names.join(", ")));
        }
        let mut react: Vec<String> = self
            .react
            .iter()
            .filter(|(local, export)| {
                self.used.contains(*local) && export.chars().next().is_some_and(char::is_uppercase)
            })
            .map(|(local, export)| {
                // React's components (`<Suspense>`) are values; its other names types.
                let kind = if matches!(export.as_str(), "Suspense" | "StrictMode" | "Profiler" | "Activity") {
                    ""
                } else {
                    "type "
                };
                if local == export { format!("{kind}{local}") } else { format!("{kind}{export} as {local}") }
            })
            .collect();
        react.extend(
            self.react_types.iter().filter(|t| !self.react.contains_key(*t)).map(|t| format!("type {t}")),
        );
        react.extend(self.react_values.iter().cloned());
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
        let mut extra: Vec<&String> = Vec::new();
        for (source, _) in &self.extra_imports {
            if !extra.contains(&source) {
                extra.push(source);
            }
        }
        for source in extra {
            let mut names: Vec<&str> = self
                .extra_imports
                .iter()
                .filter(|(s, n)| s == source && !self.imported.contains(n))
                .map(|(_, n)| n.as_str())
                .collect();
            names.sort();
            names.dedup();
            if !names.is_empty() {
                let names: Vec<String> = names.iter().map(|n| format!("type {n}")).collect();
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
    /// `const X = memo(Named, compare)` of a component of this module: Named takes
    /// the comparator as its `equal` member (X is then Named itself).
    /// [`Tr::labelled`]: a module function `f({ a, b = 1 }: P)` that nothing exports or reads
    /// except as `f({ … })` or `f(name)` takes `a`/`b` as labelled parameters, so a caller
    /// that holds the fields passes them, with no object built.
    fn scan_labelled(&mut self, body: &[Statement]) {
        use oxc_ast_visit::Visit;
        #[derive(Default)]
        struct Uses {
            refs: HashMap<String, usize>,
            calls: HashMap<String, usize>,
        }
        impl<'a> Visit<'a> for Uses {
            fn visit_identifier_reference(&mut self, id: &oxc_ast::ast::IdentifierReference<'a>) {
                *self.refs.entry(id.name.to_string()).or_default() += 1;
            }
            fn visit_call_expression(&mut self, call: &oxc_ast::ast::CallExpression<'a>) {
                if let Expression::Identifier(id) = &call.callee
                    && let [arg] = call.arguments.as_slice() && match arg {
                    Argument::Identifier(_) => true,
                    Argument::ObjectExpression(o) => o.properties.iter().all(
                        |p| matches!(p, oxc_ast::ast::ObjectPropertyKind::ObjectProperty(p) if !p.computed),
                    ),
                    _ => false,
                } {
                    *self.calls.entry(id.name.to_string()).or_default() += 1;
                }
                oxc_ast_visit::walk::walk_call_expression(self, call);
            }
        }
        let mut uses = Uses::default();
        for statement in body {
            uses.visit_statement(statement);
        }
        for statement in body {
            let Statement::FunctionDeclaration(f) = statement else { continue };
            let Some(id) = &f.id else { continue };
            let name = id.name.as_str();
            let [param] = f.params.items.as_slice() else { continue };
            let (BindingPattern::ObjectPattern(pattern), Some(t)) = (&param.pattern, &param.type_annotation)
            else {
                continue;
            };
            if pattern.rest.is_some()
                || uses.calls.get(name).is_none_or(|&c| c == 0 || uses.refs.get(name) != Some(&c))
                || self.listed_exports.contains(name)
            {
                continue;
            }
            let TSType::TSTypeReference(r) = &t.type_annotation else { continue };
            let TSTypeName::IdentifierReference(ty) = &r.type_name else { continue };
            if r.type_arguments.is_some() {
                continue;
            }
            let fields: Vec<(String, String, bool)> = match crate::view::local_object(body, &ty.name) {
                Some(members) => members.iter().filter_map(|m| self.field(m)).collect(),
                None if self.imported.contains(ty.name.as_str()) => match self.external_props(&ty.name) {
                    Some(fields) => fields.into_iter().map(|f| (f.name, f.ty, f.optional)).collect(),
                    None => continue,
                },
                None => continue,
            };
            let mut params = Vec::new();
            for property in &pattern.properties {
                let simple = match &property.value {
                    BindingPattern::BindingIdentifier(_) => true,
                    BindingPattern::AssignmentPattern(a) => {
                        matches!(a.left, BindingPattern::BindingIdentifier(_))
                    }
                    _ => false,
                };
                let Some(key) = crate::view::key_name(&property.key).filter(|_| simple && !property.computed)
                else {
                    params.clear();
                    break;
                };
                let Some((_, ty, optional)) = fields.iter().find(|(k, ..)| *k == key) else {
                    params.clear();
                    break;
                };
                params.push((key, ty.clone(), *optional));
            }
            if !params.is_empty() {
                self.labelled.insert(name.to_string(), params);
            }
        }
    }

    /// [`Tr::tanstack`]. The binding (Mention's `Bindings/TanStackQuery`) declares these
    /// options and result fields; a file that reads others keeps TanStack's TS declarations.
    /// `useInfiniteQuery` is the cursor-paged one: a `String?` cursor (`initialPageParam` of
    /// `undefined`/`null`), `queryFn: ({ pageParam }) => …` and a one-page `getNextPageParam`.
    /// [`Tr::throwing`]: `async function f(…): Promise<T>` (or `const f = async (…): Promise<T> =>`),
    /// `T` not `void`, whose body awaits a TS call at its own level, outside any `try`.
    fn scan_throwing(&mut self, program: &oxc_ast::ast::Program) {
        use oxc_ast_visit::Visit;
        struct Scan<'s> {
            locals: &'s HashSet<String>,
            found: HashSet<String>,
        }
        fn value_promise(ret: Option<&oxc_ast::ast::TSTypeAnnotation>) -> bool {
            let Some(ret) = ret else { return false };
            let TSType::TSTypeReference(r) = &ret.type_annotation else { return false };
            let oxc_ast::ast::TSTypeName::IdentifierReference(id) = &r.type_name else { return false };
            id.name == "Promise"
                && r.type_arguments.as_ref().is_some_and(|a| {
                    a.params.len() == 1
                        && !matches!(a.params[0], TSType::TSVoidKeyword(_) | TSType::TSUndefinedKeyword(_))
                })
        }
        fn ts_await(locals: &HashSet<String>, e: &Expression) -> bool {
            match e.without_parentheses() {
                Expression::AwaitExpression(a) => match a.argument.without_parentheses() {
                    Expression::CallExpression(c) => {
                        !matches!(&c.callee, Expression::Identifier(id) if locals.contains(id.name.as_str()))
                    }
                    _ => true,
                },
                Expression::UnaryExpression(u) => ts_await(locals, &u.argument),
                _ => false,
            }
        }
        fn unguarded(locals: &HashSet<String>, statements: &[Statement]) -> bool {
            statements.iter().any(|st| match st {
                Statement::VariableDeclaration(v) => {
                    v.declarations.iter().any(|d| d.init.as_ref().is_some_and(|i| ts_await(locals, i)))
                }
                Statement::ExpressionStatement(e) => ts_await(locals, &e.expression),
                Statement::ReturnStatement(r) => r.argument.as_ref().is_some_and(|a| ts_await(locals, a)),
                Statement::IfStatement(i) => {
                    ts_await(locals, &i.test)
                        || unguarded(locals, std::slice::from_ref(&i.consequent))
                        || i.alternate.as_ref().is_some_and(|a| unguarded(locals, std::slice::from_ref(a)))
                }
                Statement::BlockStatement(b) => unguarded(locals, &b.body),
                _ => false,
            })
        }
        impl<'a> Visit<'a> for Scan<'_> {
            fn visit_function(
                &mut self,
                f: &oxc_ast::ast::Function<'a>,
                flags: oxc_syntax::scope::ScopeFlags,
            ) {
                if f.r#async
                    && let Some(id) = &f.id
                    && value_promise(f.return_type.as_deref())
                    && f.body.as_ref().is_some_and(|b| unguarded(self.locals, &b.statements))
                {
                    self.found.insert(id.name.to_string());
                }
                oxc_ast_visit::walk::walk_function(self, f, flags);
            }
            fn visit_variable_declarator(&mut self, d: &oxc_ast::ast::VariableDeclarator<'a>) {
                // `const f = async (…) => …`, also as `useCallback(async (…) => …, deps)`.
                let init = d.init.as_ref().map(|i| match i.without_parentheses() {
                    Expression::CallExpression(c)
                        if matches!(&c.callee, Expression::Identifier(u) if u.name == "useCallback") =>
                    {
                        c.arguments.first().and_then(|a| a.as_expression()).unwrap_or(i)
                    }
                    other => other,
                });
                if let BindingPattern::BindingIdentifier(id) = &d.id
                    && let Some(Expression::ArrowFunctionExpression(a)) =
                        init.map(|i| i.without_parentheses())
                    && a.r#async
                    && a.get_expression().is_none()
                    && value_promise(a.return_type.as_deref())
                    && unguarded(self.locals, crate::view::arrow_statements(a))
                {
                    self.found.insert(id.name.to_string());
                }
                oxc_ast_visit::walk::walk_variable_declarator(self, d);
            }
        }
        // A local function: any name the module declares that is not imported.
        let mut locals = HashSet::new();
        {
            struct Names<'n>(&'n mut HashSet<String>);
            impl<'a> Visit<'a> for Names<'_> {
                fn visit_binding_identifier(&mut self, id: &oxc_ast::ast::BindingIdentifier<'a>) {
                    self.0.insert(id.name.to_string());
                }
            }
            Names(&mut locals).visit_program(program);
        }
        for i in &self.imported {
            locals.remove(i);
        }
        // To a fixed point: awaiting a throwing local function outside a `try` throws too.
        let mut found = HashSet::new();
        loop {
            let ts_like: HashSet<String> = locals.difference(&found).cloned().collect();
            let mut scan = Scan { locals: &ts_like, found: HashSet::new() };
            scan.visit_program(program);
            if scan.found.len() == found.len() {
                break;
            }
            found = scan.found;
        }
        self.throwing = found;
    }

    fn scan_tanstack(&mut self, body: &[Statement]) {
        use oxc_ast_visit::Visit;
        const OPTIONS: &[&str] =
            &["queryKey", "queryFn", "enabled", "staleTime", "gcTime", "refetchInterval"];
        const RESULT: &[&str] = &["data", "isLoading", "isPending", "isFetching", "isError", "refetch"];
        const INFINITE_OPTIONS: &[&str] =
            &["queryKey", "queryFn", "initialPageParam", "getNextPageParam", "enabled", "staleTime"];
        const INFINITE_RESULT: &[&str] = &[
            "data",
            "isLoading",
            "isPending",
            "isFetching",
            "isError",
            "hasNextPage",
            "isFetchingNextPage",
            "fetchNextPage",
            "refetch",
        ];
        let hooks: Vec<&'static str> = ["useQuery", "useInfiniteQuery"]
            .into_iter()
            .filter(|h| {
                self.import_sources.get(*h).map(String::as_str) == Some("@tanstack/react-query")
                    && !self.import_renames.contains_key(*h)
            })
            .collect();
        if hooks.is_empty() {
            return;
        }
        #[derive(Default)]
        struct Calls<'s> {
            src: &'s str,
            hooks: Vec<&'static str>,
            all: usize,
            bound: Vec<(u32, Option<String>, bool)>,
        }
        fn hook<'h>(hooks: &[&'h str], call: &oxc_ast::ast::CallExpression) -> Option<&'h str> {
            let Expression::Identifier(id) = &call.callee else { return None };
            hooks.iter().find(|h| **h == id.name.as_str()).copied()
        }
        /// `undefined`, `null`, or either cast (`undefined as string | undefined`): no first cursor.
        fn no_cursor(e: &Expression) -> bool {
            match e.without_parentheses() {
                Expression::TSAsExpression(a) => no_cursor(&a.expression),
                Expression::NullLiteral(_) => true,
                Expression::Identifier(id) => id.name == "undefined",
                _ => false,
            }
        }
        fn options_ok(call: &oxc_ast::ast::CallExpression, infinite: bool) -> bool {
            let [Argument::ObjectExpression(o)] = call.arguments.as_slice() else { return false };
            let allowed = if infinite { INFINITE_OPTIONS } else { OPTIONS };
            let mut has_fn = false;
            let mut has_cursor = !infinite;
            for p in &o.properties {
                let oxc_ast::ast::ObjectPropertyKind::ObjectProperty(p) = p else { return false };
                let Some(key) = crate::view::key_name(&p.key) else { return false };
                if !allowed.contains(&key.as_str()) || p.computed {
                    return false;
                }
                match key.as_str() {
                    "queryFn" => {
                        // `() => call()`, or `({ pageParam }) => call(pageParam)` for a page: its
                        // promise is awaited in the binding's async closure.
                        let Expression::ArrowFunctionExpression(a) = &p.value else { return false };
                        if a.get_expression().is_none() {
                            return false;
                        }
                        let params_ok = if infinite {
                            match a.params.items.as_slice() {
                                [] => true,
                                [param] => match &param.pattern {
                                    BindingPattern::ObjectPattern(o) => {
                                        o.rest.is_none()
                                            && o.properties.iter().all(|f| {
                                                crate::view::key_name(&f.key).as_deref() == Some("pageParam")
                                                    && matches!(&f.value, BindingPattern::BindingIdentifier(id) if id.name == "pageParam")
                                            })
                                    }
                                    _ => false,
                                },
                                _ => false,
                            }
                        } else {
                            a.params.items.is_empty()
                        };
                        if !params_ok {
                            return false;
                        }
                        has_fn = true;
                    }
                    "initialPageParam" => {
                        if !no_cursor(&p.value) {
                            return false;
                        }
                        has_cursor = true;
                    }
                    // A named function, or an arrow of the last page alone: the binding's `(T) -> String?`.
                    "getNextPageParam" => match &p.value {
                        Expression::Identifier(_) => {}
                        Expression::ArrowFunctionExpression(a)
                            if a.params.items.len() == 1 && a.params.rest.is_none() => {}
                        _ => return false,
                    },
                    _ => {}
                }
            }
            has_fn && has_cursor
        }
        impl<'a> Visit<'a> for Calls<'_> {
            fn visit_call_expression(&mut self, call: &oxc_ast::ast::CallExpression<'a>) {
                if hook(&self.hooks, call).is_some() {
                    self.all += 1;
                }
                oxc_ast_visit::walk::walk_call_expression(self, call);
            }
            fn visit_variable_declarator(&mut self, d: &oxc_ast::ast::VariableDeclarator<'a>) {
                if let Some(Expression::CallExpression(call)) = &d.init
                    && let Some(name) = hook(&self.hooks, call)
                {
                    let infinite = name == "useInfiniteQuery";
                    let result = if infinite { INFINITE_RESULT } else { RESULT };
                    let ok = options_ok(call, infinite);
                    let reads = match &d.id {
                        BindingPattern::BindingIdentifier(id) => Some(id.name.to_string()),
                        BindingPattern::ObjectPattern(p) => {
                            let fields = p.rest.is_none()
                                && p.properties.iter().all(|f| {
                                    crate::view::key_name(&f.key)
                                        .is_some_and(|k| result.contains(&k.as_str()))
                                        && matches!(f.value, BindingPattern::BindingIdentifier(_))
                                });
                            self.bound.push((call.span.start, None, ok && fields));
                            oxc_ast_visit::walk::walk_variable_declarator(self, d);
                            return;
                        }
                        _ => None,
                    };
                    let ok =
                        ok && reads.as_deref().is_some_and(|n| reads_only(self.src, n, d.span.end, result));
                    self.bound.push((call.span.start, reads, ok));
                }
                oxc_ast_visit::walk::walk_variable_declarator(self, d);
            }
        }
        /// Every read of `name` after `from` is `name.f` / `name?.f` of a declared field.
        fn reads_only(src: &str, name: &str, from: u32, result: &[&str]) -> bool {
            let text = &src[from as usize..];
            text.match_indices(name).all(|(i, _)| {
                let before = text[..i].chars().next_back();
                let after = &text[i + name.len()..];
                let word = |c: Option<char>| c.is_some_and(|c| c.is_alphanumeric() || c == '_' || c == '$');
                if word(before) || before == Some('.') || word(after.chars().next()) {
                    return true;
                }
                // An element of a dependency list (`[t, query]`): the result as a value.
                let prev = text[..i].trim_end().chars().next_back();
                let next = after.trim_start().chars().next();
                if matches!(prev, Some('[' | ',')) && matches!(next, Some(']' | ',')) {
                    return true;
                }
                // `const { hasNextPage, fetchNextPage } = query;`: fields the binding declares.
                if let Some(head) = text[..i].trim_end().strip_suffix('=')
                    && let Some(open) = head.rfind("const {")
                    && matches!(next, Some(';') | Some('\n') | None)
                {
                    let names = head[open + "const {".len()..].trim_end().trim_end_matches('}');
                    return !names.contains(['{', ':', '.', '='])
                        && names
                            .split(',')
                            .map(str::trim)
                            .filter(|n| !n.is_empty())
                            .all(|n| result.contains(&n));
                }
                let field = after.strip_prefix("?.").or_else(|| after.strip_prefix('.'));
                field.is_some_and(|f| {
                    let f: String = f.chars().take_while(|c| c.is_alphanumeric() || *c == '_').collect();
                    result.contains(&f.as_str())
                })
            })
        }
        let mut calls = Calls { src: self.src, hooks, ..Default::default() };
        for statement in body {
            calls.visit_statement(statement);
        }
        if calls.all == 0 || calls.bound.len() != calls.all || calls.bound.iter().any(|(_, _, ok)| !ok) {
            return;
        }
        self.tanstack = calls.bound.iter().map(|(at, ..)| *at).collect();
    }

    fn scan_memo_aliases(&mut self, body: &[Statement]) {
        for statement in body {
            let declaration = match statement {
                Statement::ExportDeclaration(export) => Some(&export.declaration),
                other => other.as_declaration(),
            };
            let Some(Declaration::VariableDeclaration(v)) = declaration else { continue };
            for d in &v.declarations {
                if let Some(init) = &d.init
                    && let Some((named, _)) = memo_alias(init, &self.react)
                    && self.views.contains(named.as_str())
                    && let BindingPattern::BindingIdentifier(alias) = &d.id
                {
                    self.view_aliases.insert(alias.name.to_string(), named.clone());
                }
                if let Some(init) = &d.init
                    && let Some((named, Some(compare))) = memo_alias(init, &self.react)
                    && self.views.contains(named.as_str())
                {
                    self.quiet = true;
                    let member = self.equal_member(compare);
                    self.quiet = false;
                    self.equal_for.insert(named, member);
                }
            }
        }
    }

    /// [`Tr::object_fields`]: each object type's fields, translated quietly (their own
    /// declarations report what they refuse).
    fn scan_object_fields(&mut self, body: &[Statement]) {
        let names: Vec<String> = self.objects.iter().cloned().collect();
        let reasons = self.reasons.len();
        let quiet = std::mem::replace(&mut self.quiet, true);
        for name in names {
            let Some(members) = crate::view::local_object(body, &name) else { continue };
            let mut fields = Vec::new();
            for member in members {
                match self.field(member) {
                    Some((field, ty, optional)) => {
                        fields.push(format!("{field}: {}", if optional { optional_ty(&ty) } else { ty }))
                    }
                    None => {
                        fields.clear();
                        break;
                    }
                }
            }
            if !fields.is_empty() {
                self.object_fields.insert(name, fields);
            }
        }
        self.quiet = quiet;
        self.reasons.truncate(reasons);
    }

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
                // A menu's actions or content: a struct, called with labels; its props type's
                // fields, for a call that hands it one value (`Rows(options)`).
                if self.is_lang(callee, "actions") || self.is_lang(callee, "menu") {
                    self.views.insert(name.clone());
                    if let Some(Expression::FunctionExpression(f)) = call
                        .arguments
                        .first()
                        .and_then(|a| a.as_expression())
                        .map(|e| e.without_parentheses())
                        && let [param] = f.params.items.as_slice()
                        && let Some(annotation) = param.type_annotation.as_ref()
                        && let TSType::TSTypeReference(r) = &annotation.type_annotation
                        && let TSTypeName::IdentifierReference(ty) = &r.type_name
                        && let Some(members) = crate::view::local_object(body, &ty.name)
                    {
                        let fields: Vec<String> = members
                            .iter()
                            .filter_map(|m| match m {
                                TSSignature::TSPropertySignature(p) => crate::view::key_name(&p.key),
                                _ => None,
                            })
                            .collect();
                        self.menu_fields.insert(name.clone(), fields);
                    }
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
            // An arrow whose body is `toElement(tree)` itself (`({ a }) => toElement(…)`).
            let mut expression_body = false;
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
                                // `(p) => c ? <A {…p} /> : <B />`: an element, not only `toElement(…)`.
                                expression_body = a.get_expression().is_some_and(|e| {
                                    !matches!(e.without_parentheses(), Expression::NullLiteral(_))
                                        && element_value(e, &|n| self.is_lang(n, "toElement"), &[], 1)
                                });
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
                && (expression_body || returns_to_element(statements, &|n| self.is_lang(n, "toElement")))
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
        // Props handed on whole keep their type (`..props: P`).
        if let Some(oxc_ast::ast::FormalParameter { pattern: BindingPattern::BindingIdentifier(id), .. }) =
            params.items.first()
            && props_used_whole(self.src, f.span(), &id.name)
        {
            return;
        }
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
        if let Some(oxc_ast::ast::FormalParameter { pattern: BindingPattern::BindingIdentifier(id), .. }) =
            f.params.items.first()
            && props_used_whole(self.src, f.span, &id.name)
        {
            return;
        }
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
                let mut chain = text.strip_prefix(&param).map(str::to_string).unwrap_or_default();
                // `v.….modifier(other)` of a modifier defined above: its chain, inlined too.
                for (other, inner) in &self.modifiers {
                    chain = chain.replace(&format!(".modifier({other})"), inner);
                }
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
        self.hook_fn = false;
        match statement {
            Statement::ExportDeclaration(export) => {
                self.declaration(&export.declaration, "pub ", defaults, body)
            }
            // `export { a, b }`: each item is `pub` where it is declared.
            Statement::ExportNamedDeclaration(export) if export_list(export).is_some() => String::new(),
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
        if defaults.contains(name) {
            "pub default "
        } else if self.listed_exports.contains(name) {
            "pub "
        } else {
            given
        }
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
                // A module `let` of this file alone (`let showInfo: (() => void) | null = null`, a
                // registry a provider fills): Swift's file-scope `private var`. One another module
                // could write stays refused.
                if v.kind == VariableDeclarationKind::Let
                    && vis.is_empty()
                    && let [d] = v.declarations.as_slice()
                    && let BindingPattern::BindingIdentifier(id) = &d.id
                    && !self.listed_exports.contains(id.name.as_str())
                    && !defaults.contains(id.name.as_str())
                    && let Some(init) = &d.init
                {
                    let name = id.name.to_string();
                    let text = self.constant(&name, d.type_annotation.as_deref(), init, vis, body);
                    let decl = format!("let {name}");
                    return match text.find(&decl) {
                        Some(at) if text[at + decl.len()..].starts_with([' ', ':']) => {
                            format!("{}private var {name}{}", &text[..at], &text[at + decl.len()..])
                        }
                        _ => self.refuse("module:mutable", "a module-level `let`/`var`", v.span),
                    };
                }
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
                // `interface A extends B { … }` with `B` an object type here: B's fields, then A's.
                let mut inherited = String::new();
                let members: Vec<&TSSignature> = if interface.extends.is_empty() {
                    interface.body.body.iter().collect()
                } else if interface.type_parameters.is_none()
                    && let Some(members) = crate::view::local_object(body, &name)
                {
                    members
                } else if interface.type_parameters.is_none()
                    && let Some(fields) = self.imported_bases(interface)
                {
                    // `B` imported: its fields written out (2.0 has no spread members), then A's;
                    // a field A declares again is A's (TS's narrower).
                    let own: Vec<String> =
                        interface.body.body.iter().filter_map(|m| member_name(m)).collect();
                    for f in fields.into_iter().filter(|f| !own.contains(&f.name)) {
                        inherited.push_str(&if f.optional {
                            format!("{}: {} = none\n", f.name, optional_ty(&f.ty))
                        } else {
                            format!("{}: {}\n", f.name, f.ty)
                        });
                    }
                    interface.body.body.iter().collect()
                } else {
                    return self.refuse(
                        "type:extends",
                        format!("`interface {name}` extends another type"),
                        interface.span,
                    );
                };
                let generics = self.generics(interface.type_parameters.as_deref());
                let fields = inherited + &self.struct_fields(&members);
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
                    let fields = self.struct_fields(&literal.members.iter().collect::<Vec<_>>());
                    return format!("{vis}struct {name}{generics} {{\n{fields}}}");
                }
                // `type P = Q & { t: T }` of object types here: one struct of all their fields.
                if matches!(alias.type_annotation, TSType::TSIntersectionType(_))
                    && let Some(members) = crate::view::local_object(body, &name)
                {
                    if self.props_types.contains(&name) && vis.is_empty() {
                        return String::new();
                    }
                    let fields = self.struct_fields(&members);
                    return format!("{vis}struct {name} {{\n{fields}}}");
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

    /// The fields of an interface's bases when each is a plain type imported from another TS
    /// file the codemod can read (`interface A extends B, C`), in order; `None` otherwise.
    fn imported_bases(&mut self, interface: &oxc_ast::ast::TSInterfaceDeclaration) -> Option<Vec<crate::props::Field>> {
        let mut out: Vec<crate::props::Field> = Vec::new();
        for heritage in &interface.extends {
            let TSTypeName::IdentifierReference(base) = &heritage.type_name else { return None };
            if heritage.type_arguments.is_some() || !self.imported.contains(base.name.as_str()) {
                return None;
            }
            for field in self.external_props(&base.name)? {
                out.retain(|f| f.name != field.name);
                out.push(field);
            }
        }
        Some(out)
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

    fn struct_fields(&mut self, members: &[&TSSignature]) -> String {
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
        // `[…] as const satisfies readonly T[]`: the `as const` is the constant's own.
        let own = match init.without_parentheses() {
            Expression::TSSatisfiesExpression(s) => s.expression.without_parentheses().span(),
            other => other.span(),
        };
        let outer = self.module_init.replace(own);
        let out = self.constant_item(name, annotation, init, vis, body);
        self.module_init = outer;
        // `[{ key, url }, { key, url, label }]` with no annotation: TS's element type is the union
        // of the shapes, so a key some items leave out is optional (`label: String?`).
        if annotation.is_none()
            && let Some(record) = shapes_record(init)
        {
            let decl = format!("let {name} = ");
            if let Some(at) = out.find(&decl) {
                return format!("{}let {name}: [{record}] = {}", &out[..at], &out[at + decl.len()..]);
            }
        }
        out
    }

    /// A list of string literals written `as const` inside a function (`(['videos',
    /// 'following'] as const).map(…)`, TS's tab lists): a module constant of its own, which
    /// Bloom types as a list of the literals' union (spec 6.4), named after its values. The
    /// same list twice in a file is one constant.
    pub fn hoist_const_list(&mut self, values: &[String], text: String) -> String {
        if let Some((name, _)) = self.hoisted.iter().find(|(_, list)| *list == text) {
            return name.clone();
        }
        let mut base: String = values
            .iter()
            .map(|v| {
                v.chars()
                    .map(|c| if c.is_ascii_alphanumeric() { c.to_ascii_uppercase() } else { '_' })
                    .collect::<String>()
            })
            .collect::<Vec<_>>()
            .join("_");
        if base.len() > 32 || base.is_empty() || base.starts_with(|c: char| c.is_ascii_digit()) {
            base = "VALUES".into();
        }
        let mut name = base.clone();
        let mut n = 2;
        while self.src.contains(name.as_str())
            || self.hoisted.iter().any(|(h, _)| *h == name)
            || self.hoisted_names.contains(&name)
        {
            name = format!("{base}_{n}");
            n += 1;
        }
        self.hoisted_names.insert(name.clone());
        self.hoisted.push((name.clone(), text));
        self.used.insert(name.clone());
        name
    }

    /// A menu's actions or content as the struct that conforms to `protocol`: drafted as a view
    /// (its props, its members, its result), then written as the struct, its props stored `let`s
    /// and its result `body` (a tag → action table for `MenuActions`, the rows for `MenuContent`).
    fn menu_struct(
        &mut self,
        protocol: &str,
        name: &str,
        call: &oxc_ast::ast::CallExpression,
        vis: &'static str,
        body: &[Statement],
    ) -> String {
        let outer = std::mem::replace(&mut self.in_menu, true);
        let draft = self.view_item(name, call, vis, body);
        self.in_menu = outer;
        let Some((stored, members, body_part)) = draft_parts(&draft, vis, name) else { return draft };
        let result_type = if protocol == "MenuActions" { "[String: () -> Unit]" } else { "some View" };
        let fields: Vec<String> = stored
            .iter()
            .filter_map(|line| {
                let rest = line.strip_prefix("let ").or_else(|| line.strip_prefix("var "))?;
                Some(rest.split(':').next()?.trim().to_string())
            })
            .collect();
        self.menu_fields.entry(name.to_string()).or_insert(fields);
        self.menu_structs.insert(name.to_string());
        self.views.insert(name.to_string());
        let vis = vis.replace("pub ", "public ");
        format!(
            "{vis}struct {name}: {protocol} {{\n{}\n{}var body: {result_type} {{{body_part}",
            stored.join("\n"),
            members
        )
    }

    /// A generic component (`function Shell<TItem>(props: P<TItem>)`): drafted as a view, then
    /// written as 2.0's `struct Shell<TItem>: View`, since a 0.x `view` takes no type parameters.
    pub fn generic_view(&mut self, draft: String, vis: &str, name: &str, generics: &[String]) -> String {
        // The view printed in 2.0's forms (its members too: `@state` is `@State private var`),
        // then given its type parameters (0.x has no generic view).
        if let Ok((printed, _)) = bloom_fmt::migrate(&draft, "generic.bloom") {
            let head = format!("struct {name}: View");
            if let Some(at) = printed.find(&head) {
                let mut printed = printed;
                printed.insert_str(at + "struct ".len() + name.len(), &format!("<{}>", generics.join(", ")));
                return printed.trim().to_string();
            }
        }
        let Some((stored, members, body_part)) = draft_parts(&draft, vis, name) else { return draft };
        let vis = vis.replace("pub ", "public ");
        format!(
            "{vis}struct {name}<{}>: View {{\n{}\n{}var body: some View {{{body_part}",
            generics.join(", "),
            stored.join("\n"),
            members
        )
    }

    fn constant_item(
        &mut self,
        name: &str,
        annotation: Option<&oxc_ast::ast::TSTypeAnnotation>,
        init: &Expression,
        vis: &'static str,
        body: &[Statement],
    ) -> String {
        let init = init.without_parentheses();
        // `memo(Named) as typeof Named`: the cast says nothing at run time.
        let init = match init {
            Expression::TSAsExpression(a)
                if matches!(&a.type_annotation, oxc_ast::ast::TSType::TSTypeQuery(_)) =>
            {
                a.expression.without_parentheses()
            }
            other => other,
        };
        // `const X = memo(Named[, compare])` of a view here: X is Named (a view is memoised;
        // the comparator is Named's `equal` member).
        if let Some((named, _)) = memo_alias(init, &self.react)
            && self.views.contains(named.as_str())
        {
            let target = self.name(&named, init.span());
            let name = self.bind_param(name, init.span());
            self.views.insert(name.clone());
            return format!("{vis}let {name} = {target}");
        }
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
            // `actions(function F(props) { …; return table })` and `menu(function F(props) { …;
            // return rows })`: a struct conforming to `MenuActions` or `MenuContent` (#1046).
            if self.is_lang(&callee, "actions") || self.is_lang(&callee, "menu") {
                let protocol = if self.is_lang(&callee, "actions") { "MenuActions" } else { "MenuContent" };
                return self.menu_struct(protocol, name, call, vis, body);
            }
            if self.is_lang(&callee, "defineModifier") {
                // Used as a value too (`.modifier(look ?? card)`, a prop): the modifier itself.
                if modifier_used_as_value(self.src, name)
                    && let Some(chain) = self.modifiers.get(name).cloned()
                {
                    self.lang_values.insert(callee.clone());
                    let name = self.bind_param(name, call.span);
                    return format!("{vis}let {name} = {callee} {{ v: View in v{chain} }}");
                }
                return String::new();
            }
            // `lazy(() => import("./X"))`: React's `lazy` with a Bloom closure, a component.
            if self.react.get(&callee).is_some_and(|e| e == "lazy")
                && let [Argument::ArrowFunctionExpression(arrow)] = call.arguments.as_slice()
                && arrow.params.items.is_empty()
                && let Some(body) = arrow.get_expression()
            {
                self.react_values.insert(if callee == "lazy" {
                    callee.clone()
                } else {
                    format!("lazy as {callee}")
                });
                self.dynamic_import = true;
                let body = self.expr(body);
                self.dynamic_import = false;
                let name = self.bind_param(name, call.span);
                self.views.insert(name.clone());
                return format!("{vis}let {name} = {callee} {{ {body} }}");
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
                // `const f: Renderer = (a, b) => …` (parameters typed by the annotation, a
                // function type): a closure `let` of that type, its parameters inferred.
                if props_ty.is_none()
                    && !self.components.contains(name)
                    && !crate::view::is_hook_name(name)
                    && let Some(t) = annotation
                    && matches!(t.type_annotation, TSType::TSTypeReference(_))
                    && !arrow.params.items.is_empty()
                    && arrow.params.items.iter().all(|p| {
                        p.type_annotation.is_none()
                            && matches!(p.pattern, BindingPattern::BindingIdentifier(_))
                    })
                {
                    let ty = self.ty(&t.type_annotation);
                    let closure = self.closure(arrow);
                    let name = self.bind_param(name, arrow.span);
                    return format!("{vis}let {name}: {ty} = {closure}");
                }
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
pub fn chain_root(expression: &Expression) -> Option<String> {
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
        let code = code.strip_prefix("pub ").unwrap_or(code);
        let rest = code.strip_prefix("default ").unwrap_or(code).strip_prefix("let ")?;
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
    /// The name a declaration item (`struct X`, `func X`, `enum X`) declares.
    fn decl_name(item: &str) -> Option<&str> {
        let code = item.lines().find(|l| !l.trim_start().starts_with("//") && !l.trim().is_empty())?;
        let mut words = code.split_whitespace();
        words.find(|w| matches!(*w, "struct" | "func" | "enum" | "fn" | "view" | "class"))?;
        let name = words.next()?;
        let end = name.find(|c: char| !(c.is_alphanumeric() || c == '_')).unwrap_or(name.len());
        (end > 0).then(|| &name[..end])
    }
    // Whether a `let` reads a declaration between `first` and itself while the module loads:
    // a value that is not a closure (`let X = View`; a closure reads it when it runs).
    let reads_later = |items: &[String], first: usize, i: usize| {
        let item = &items[i];
        let code =
            item.lines().find(|l| !l.trim_start().starts_with("//") && !l.trim().is_empty()).unwrap_or("");
        let closure = code.split_once(" = ").is_some_and(|(_, v)| v.trim_start().starts_with('{'));
        !closure && (first..i).any(|j| decl_name(&items[j]).is_some_and(|d| mentions(item, d)))
    };
    let Some(first) = items.iter().position(|item| let_name(item).is_none()) else { return items };
    // A `let` that reads a declaration between `first` and itself stays: a view or function
    // is a JS `const` too, so the hoisted value would read it before it is defined.
    let late: Vec<usize> = (first..items.len())
        .filter(|&i| let_name(&items[i]).is_some_and(|n| items[..i].iter().any(|it| mentions(it, n))))
        .filter(|&i| !reads_later(&items, first, i))
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
                && !reads_later(&items, first, j)
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

/// Whether the props parameter `name` of the function at `span` is read whole: a
/// use that is not `name.x` / `name?.x` (nor the parameter itself).
pub fn props_used_whole(src: &str, span: Span, name: &str) -> bool {
    let text = &src[span.start as usize..span.end as usize];
    let mut seen_param = false;
    text.match_indices(name).any(|(i, _)| {
        let before = text[..i].chars().next_back();
        let after = &text[i + name.len()..];
        let word = |c: Option<char>| c.is_some_and(|c| c.is_alphanumeric() || c == '_' || c == '$');
        if word(before) || before == Some('.') || word(after.chars().next()) {
            return false;
        }
        let after = after.trim_start();
        if !seen_param && after.starts_with(':') {
            seen_param = true;
            return false;
        }
        // `const { a, b } = props`: field reads, not the whole value (a `...rest` is).
        if let Some(pattern) = destructured_from(&text[..i]) {
            return pattern.contains("...");
        }
        !(after.starts_with('.') || after.starts_with("?.") || after.starts_with(':'))
    })
}

/// The object pattern of `const { … } = ` that `before` ends with, or `None`.
fn destructured_from(before: &str) -> Option<&str> {
    let before = before.trim_end().strip_suffix('=')?;
    if before.ends_with(['=', '!', '<', '>', '+', '-', '*', '/', '|', '&', '?']) {
        return None;
    }
    let before = before.trim_end().strip_suffix('}')?;
    let open = before.rfind('{')?;
    let head = before[..open].trim_end();
    (head.ends_with("const") || head.ends_with("let")).then(|| &before[open + 1..])
}

/// `export { a, b }` (no renames, no source): the names.
fn export_list(export: &oxc_ast::ast::ExportNamedDeclaration) -> Option<Vec<String>> {
    export
        .specifiers
        .iter()
        .map(|s| {
            let local = s.local.name().to_string();
            (s.exported.name() == local.as_str()).then_some(local)
        })
        .collect()
}

/// Whether the modifier `name` is read other than as `.modifier(name)`.
fn modifier_used_as_value(src: &str, name: &str) -> bool {
    src.match_indices(name).any(|(i, _)| {
        let before = &src[..i];
        let after = &src[i + name.len()..];
        let word = |c: Option<char>| c.is_some_and(|c| c.is_alphanumeric() || c == '_' || c == '$');
        if word(before.chars().next_back()) || word(after.chars().next()) {
            return false;
        }
        let applied = before.ends_with(".modifier(") && after.starts_with(')');
        // A value: an argument, a field, an operand (`look ?? card`), not a word in a comment.
        let b = before.trim_end();
        let a = after.trim_start();
        let opens = b.ends_with(['(', ',', ':', '?', '=', '[']) && !b.ends_with("==") && !b.ends_with("=>");
        let closes = a.starts_with([')', ',', '}', ']', ';', '?', '\n']) || a.is_empty();
        !applied && opens && closes
    })
}

/// `a: T, b: [K: V] = [:]` split at its top-level commas.
fn split_top_level(text: &str) -> Vec<&str> {
    let mut out = Vec::new();
    let (mut depth, mut start) = (0i32, 0);
    let mut quoted = false;
    for (i, c) in text.char_indices() {
        match c {
            '"' => quoted = !quoted,
            '(' | '[' | '{' | '<' if !quoted => depth += 1,
            ')' | ']' | '}' | '>' if !quoted && !text[..i].ends_with('-') => depth -= 1,
            ',' if depth == 0 && !quoted => {
                out.push(&text[start..i]);
                start = i + 1;
            }
            _ => {}
        }
    }
    out.push(&text[start..]);
    out
}

/// A drafted `{vis}view Name(a: T, b: U = v) { members body { … } }`: its props as stored
/// properties (`let a: T`, `var b: U = v`), its members, and its body from after `body {`.
fn draft_parts(draft: &str, vis: &str, name: &str) -> Option<(Vec<String>, String, String)> {
    let rest = draft.strip_prefix(format!("{vis}view {name}").as_str())?;
    let (params, rest) = match rest.strip_prefix('(') {
        Some(after) => {
            let mut depth = 1usize;
            let mut end = 0;
            for (i, c) in after.char_indices() {
                match c {
                    '(' | '[' | '{' => depth += 1,
                    ')' | ']' | '}' => {
                        depth -= 1;
                        if depth == 0 {
                            end = i;
                            break;
                        }
                    }
                    _ => {}
                }
            }
            (&after[..end], &after[end + 1..])
        }
        None => ("", rest),
    };
    let inner = rest.trim_start().strip_prefix('{')?;
    let at = inner.rfind("body {")?;
    let (members, body_part) = inner.split_at(at);
    let stored: Vec<String> = split_top_level(params)
        .into_iter()
        .filter(|p| !p.trim().is_empty())
        .map(|p| {
            let p = p.trim();
            if p.contains('=') { format!("var {p}") } else { format!("let {p}") }
        })
        .collect();
    Some((stored, members.to_string(), body_part["body {".len()..].to_string()))
}

/// The record type of a list of object literals whose items differ in their keys (each value a
/// string, number or boolean literal): every key, `T?` where an item leaves it out. `None` when
/// the items agree (bloomc types them already) or a value is not a literal.
fn shapes_record(init: &Expression) -> Option<String> {
    let init = match init.without_parentheses() {
        Expression::TSAsExpression(a) => a.expression.without_parentheses(),
        other => other,
    };
    let Expression::ArrayExpression(a) = init else { return None };
    let mut keys: Vec<(String, &'static str, usize)> = Vec::new();
    let mut items = 0;
    for element in &a.elements {
        let Some(Expression::ObjectExpression(o)) = element.as_expression() else { return None };
        items += 1;
        for p in &o.properties {
            let oxc_ast::ast::ObjectPropertyKind::ObjectProperty(p) = p else { return None };
            if p.computed || p.method || p.shorthand {
                return None;
            }
            let key = crate::view::key_name(&p.key)?;
            let ty = match p.value.without_parentheses() {
                Expression::StringLiteral(_) | Expression::TemplateLiteral(_) => "String",
                Expression::NumericLiteral(_) => "Float",
                Expression::BooleanLiteral(_) => "Bool",
                _ => return None,
            };
            match keys.iter_mut().find(|(k, _, _)| *k == key) {
                Some((_, t, n)) if *t == ty => *n += 1,
                Some(_) => return None,
                None => keys.push((key, ty, 1)),
            }
        }
    }
    if items < 2 || keys.iter().all(|(_, _, n)| *n == items) {
        return None;
    }
    let fields: Vec<String> = keys
        .iter()
        .map(|(k, t, n)| if *n == items { format!("{k}: {t}") } else { format!("{k}: {t}?") })
        .collect();
    Some(format!("{{ {} }}", fields.join(", ")))
}

/// The name a member of an object type declares (`a` of `a: T` or `a(): T`).
fn member_name(member: &TSSignature) -> Option<String> {
    match member {
        TSSignature::TSPropertySignature(p) => crate::view::key_name(&p.key),
        TSSignature::TSMethodSignature(m) => crate::view::key_name(&m.key),
        _ => None,
    }
}
