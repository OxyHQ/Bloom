//! Typed TypeScript from a checked `.bloom` module (spec section 11).
//!
//! Zero-cost rules: structs and `with` are object literals, fieldless enums
//! are strings, `T?` is `undefined`, `?`/`??`/`?.` are inline. One fiber per
//! `view`; bloomc writes the view's memo cache itself (`c` from
//! `react/compiler-runtime`) from the checker's exact dependencies and marks
//! the body `"use no memo"`. A closure that reads nothing reactive is a module
//! constant. What would read a value twice is a small module-local helper.

use rustc_hash::{FxHashMap as HashMap, FxHashSet as HashSet};
use std::collections::{BTreeMap, BTreeSet};

use crate::Options;
use crate::ast::*;
use crate::check::{
    AssignRes, AwaitRes, CallRes, CheckResult, FieldRes, LocalId, LocalKind, NameRes, Recv, TryRes,
    plain_text,
};
use crate::diagnostic::Diagnostic;
use crate::sourcemap::Mappings;
use crate::types::*;

pub const LANGUAGE: &str = "@oxy.so/bloom-language";
pub const ROUTER: &str = "@oxy.so/bloom-language/router";
pub const DATA: &str = "@oxy.so/bloom-data";

/// `KeyPath<S, V>` in TS: the names of `S`'s fields whose type is `V`.
const KEY_PATH: &str = "type $KeyPath<S, V> = { [K in keyof S]-?: S[K] extends V ? K : never }[keyof S];\n";

pub struct Emitted {
    pub code: String,
    pub dts: String,
    pub map: Mappings,
    pub diagnostics: Vec<Diagnostic>,
}

/// Emitted text with the `.bloom` offsets its pieces came from.
#[derive(Debug, Default, Clone)]
struct Frag {
    text: String,
    marks: Vec<(u32, u32)>,
}

impl Frag {
    fn of(text: impl Into<String>) -> Self {
        Frag { text: text.into(), marks: Vec::new() }
    }

    fn at(span: Span, text: impl Into<String>) -> Self {
        Frag { text: text.into(), marks: vec![(0, span.start)] }
    }

    fn s(&mut self, text: &str) -> &mut Self {
        self.text.push_str(text);
        self
    }

    fn f(&mut self, other: Frag) -> &mut Self {
        let base = self.text.len() as u32;
        self.marks.extend(other.marks.into_iter().map(|(g, s)| (g + base, s)));
        self.text.push_str(&other.text);
        self
    }

    fn mark(&mut self, span: Span) -> &mut Self {
        self.marks.push((self.text.len() as u32, span.start));
        self
    }

    fn join(items: Vec<Frag>, sep: &str) -> Frag {
        let mut out = Frag::default();
        for (i, item) in items.into_iter().enumerate() {
            if i > 0 {
                out.s(sep);
            }
            out.f(item);
        }
        out
    }

    fn wrap(mut self, open: &str, close: &str) -> Frag {
        let mut out = Frag::of(open);
        out.f(std::mem::take(&mut self));
        out.s(close);
        out
    }
}

/// Where a block's value goes.
#[derive(Clone)]
enum Tail {
    Discard,
    Return,
    Bind(String),
}

struct ViewState {
    slots: usize,
    /// Members whose value can change between renders.
    reactive: HashSet<LocalId>,
    setters: HashMap<LocalId, String>,
}

struct Emitter<'a> {
    ck: &'a CheckResult,
    /// Field defaults of the module's structs, emitted where a struct is built.
    defaults: HashMap<ExprId, &'a Expr>,
    options: &'a Options,
    /// Statement buffers: an expression that needs statements puts them in the top one.
    bufs: Vec<Vec<Frag>>,
    temps: usize,
    imports: BTreeMap<&'static str, BTreeSet<String>>,
    type_imports: BTreeMap<String, BTreeSet<String>>,
    helpers: BTreeSet<&'static str>,
    /// Module constants hoisted out of the current item.
    hoisted: Vec<Frag>,
    hoisted_names: HashMap<Span, String>,
    /// Static trees hoisted to module scope, by their text.
    hoisted_trees: HashMap<String, String>,
    /// The item's expressions that are the same value on every evaluation (`mark_static`).
    statics: HashSet<ExprId>,
    /// Emitting a hoisted tree: what is inside it is not hoisted again.
    in_static: bool,
    diagnostics: Vec<Diagnostic>,
    view: Option<ViewState>,
    /// The `AbortSignal` of the task being emitted.
    signal: Option<String>,
    /// Inside a conditional operand: `?` cannot return early from here.
    conditional: usize,
    uses_result: bool,
    uses_key_path: bool,
    /// A pattern's bindings: each name is the path it binds (`post`, `$t0.value`), never a copy.
    aliases: HashMap<LocalId, String>,
    /// An awaited TS promise matched as a `Result`: its error temp → its value temp (none for `Unit`).
    splits: HashMap<String, Option<String>>,
    /// Comparison functions of recursive types (`$eq0`), by TS type: their name and type.
    eq_helpers: Vec<(String, String, Ty)>,
    /// Names for the element variables of list and map comparisons.
    eq_vars: usize,
    names: HashSet<String>,
    /// The next closure maps an `.enumerated()` list: its `(i, x)` is `(x, i)`.
    enumerated: bool,
    /// While the body's tree is emitted: what the enclosing cache scope depends on.
    scope: Option<Vec<String>>,
    body_span: Option<Span>,
    /// Where the item being emitted starts: a module constant before it is defined.
    item_start: u32,
}

pub fn emit(file: &File, ck: &CheckResult, _source: &str, _filename: &str, options: &Options) -> Emitted {
    let names: HashSet<String> = ck.locals.iter().map(|l| l.name.clone()).collect();
    let mut defaults = HashMap::default();
    for item in &file.items {
        if let ItemKind::Struct(s) = &item.kind {
            for field in &s.fields {
                if let Some(default) = &field.default {
                    defaults.insert(default.id, default);
                }
            }
        }
    }
    let mut emitter = Emitter {
        ck,
        defaults,
        options,
        bufs: vec![Vec::new()],
        temps: 0,
        imports: BTreeMap::new(),
        type_imports: BTreeMap::new(),
        helpers: BTreeSet::new(),
        hoisted: Vec::new(),
        hoisted_names: HashMap::default(),
        hoisted_trees: HashMap::default(),
        statics: HashSet::default(),
        in_static: false,
        diagnostics: Vec::new(),
        view: None,
        signal: None,
        conditional: 0,
        uses_result: false,
        uses_key_path: false,
        aliases: HashMap::default(),
        splits: HashMap::default(),
        eq_helpers: Vec::new(),
        eq_vars: 0,
        names,
        enumerated: false,
        scope: None,
        body_span: None,
        item_start: 0,
    };
    let mut body = Frag::default();
    for import in &file.imports {
        body.f(emitter.import(import));
    }
    let mut items = Frag::default();
    for (index, item) in file.items.iter().enumerate() {
        emitter.item_start = item.span.start;
        emitter.statics = emitter.static_exprs(item);
        let emitted = emitter.item(index, item);
        for hoisted in std::mem::take(&mut emitter.hoisted) {
            items.f(hoisted).s("\n");
        }
        items.f(emitted).s("\n");
    }
    let mut code = Frag::default();
    code.f(emitter.header());
    code.f(body);
    if emitter.uses_key_path {
        code.s(KEY_PATH);
    }
    if emitter.uses_result {
        code.s("type $Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };\n");
    }
    for helper in std::mem::take(&mut emitter.helpers) {
        code.s(helper_text(helper)).s("\n");
    }
    code.f(emitter.eq_functions());
    code.s("\n").f(items);
    let dts = emitter.dts(file);
    let map = Mappings { points: dedup(code.marks) };
    Emitted { code: code.text, dts, map, diagnostics: emitter.diagnostics }
}

fn dedup(mut marks: Vec<(u32, u32)>) -> Vec<(u32, u32)> {
    marks.sort_by_key(|(g, _)| *g);
    marks.dedup_by_key(|(g, _)| *g);
    marks
}

const RESERVED: &[&str] = &[
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "enum",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "null",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "yield",
    "let",
    "static",
    "implements",
    "interface",
    "package",
    "private",
    "protected",
    "public",
    "await",
    "arguments",
    "eval",
    "undefined",
    "NaN",
    "Infinity",
];

fn js_name(name: &str) -> String {
    if RESERVED.contains(&name) { format!("{name}_") } else { name.to_string() }
}

fn is_ident(name: &str) -> bool {
    name.chars().next().is_some_and(|c| c.is_ascii_alphabetic() || c == '_' || c == '$')
        && name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '$')
}

fn prop_key(name: &str) -> String {
    if is_ident(name) { name.to_string() } else { format!("{name:?}") }
}

fn member(object: Frag, name: &str) -> Frag {
    let mut out = object;
    if is_ident(name) {
        out.s(".").s(name);
    } else {
        out.s(&format!("[{name:?}]"));
    }
    out
}

fn capitalised(name: &str) -> String {
    let mut chars = name.chars();
    chars.next().map_or_else(String::new, |c| c.to_ascii_uppercase().to_string() + chars.as_str())
}

pub(crate) fn string_literal(text: &str) -> String {
    let mut out = String::from("\"");
    for c in text.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// Whether an emitted expression can be an operand without parentheses.
fn is_atom(expr: &Expr) -> bool {
    matches!(
        expr.kind,
        ExprKind::Name(_)
            | ExprKind::Int(_)
            | ExprKind::Float(_)
            | ExprKind::Bool(_)
            | ExprKind::None
            | ExprKind::Str { .. }
            | ExprKind::Paren(_)
            | ExprKind::Call(_)
            | ExprKind::Field(..)
            | ExprKind::OptField(..)
            | ExprKind::Index(..)
            | ExprKind::List(_)
            | ExprKind::Binding(_)
    )
}

fn helper_text(name: &str) -> &'static str {
    match name {
        "toInt" => {
            "function $toInt(text: string): number | undefined {\n  const value = Number(text.trim());\n  return text.trim() !== \"\" && Number.isSafeInteger(value) ? value : undefined;\n}"
        }
        "toFloat" => {
            "function $toFloat(text: string): number | undefined {\n  const value = Number(text.trim());\n  return text.trim() !== \"\" && !Number.isNaN(value) ? value : undefined;\n}"
        }
        "index" => {
            "function $index(index: number): number | undefined {\n  return index < 0 ? undefined : index;\n}"
        }
        "sorted" => {
            "function $sorted<T>(items: readonly T[], before: (a: T, b: T) => boolean): readonly T[] {\n  return [...items].sort((a, b) => (before(a, b) ? -1 : before(b, a) ? 1 : 0));\n}"
        }
        "inserting" => {
            "function $inserting<T>(items: readonly T[], item: T, at: number): readonly T[] {\n  return [...items.slice(0, at), item, ...items.slice(at)];\n}"
        }
        "removing" => {
            "function $removing<T>(items: readonly T[], at: number): readonly T[] {\n  return [...items.slice(0, at), ...items.slice(at + 1)];\n}"
        }
        "mapDeleting" => {
            "function $mapDeleting<K, V>(map: ReadonlyMap<K, V>, key: K): ReadonlyMap<K, V> {\n  const copy = new Map(map);\n  copy.delete(key);\n  return copy;\n}"
        }
        "setDeleting" => {
            "function $setDeleting<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {\n  const copy = new Set(set);\n  copy.delete(value);\n  return copy;\n}"
        }
        "without" => {
            "function $without<V>(map: Readonly<Record<string, V>>, key: string): Readonly<Record<string, V>> {\n  const { [key]: _, ...rest } = map;\n  return rest;\n}"
        }
        "mapOption" => {
            "function $mapOption<T, U>(value: T | undefined, f: (value: T) => U): U | undefined {\n  return value === undefined ? undefined : f(value);\n}"
        }
        "mapResult" => {
            "function $mapResult<T, U, E>(result: $Result<T, E>, f: (value: T) => U): $Result<U, E> {\n  return result.ok ? { ok: true, value: f(result.value) } : result;\n}"
        }
        "mapErr" => {
            "function $mapErr<T, E, F>(result: $Result<T, E>, f: (error: E) => F): $Result<T, F> {\n  return result.ok ? result : { ok: false, error: f(result.error) };\n}"
        }
        "unwrapOr" => {
            "function $unwrapOr<T, E>(result: $Result<T, E>, fallback: T): T {\n  return result.ok ? result.value : fallback;\n}"
        }
        "okValue" => {
            "function $okValue<T, E>(result: $Result<T, E>): T | undefined {\n  return result.ok ? result.value : undefined;\n}"
        }
        "compact" => {
            "function $compact<T>(items: readonly (T | undefined)[]): readonly T[] {\n  return items.filter((item): item is T => item !== undefined);\n}"
        }
        _ => "",
    }
}

impl<'a> Emitter<'a> {
    fn import_name(&mut self, module: &'static str, name: &str) {
        self.imports.entry(module).or_default().insert(name.to_string());
    }

    fn header(&mut self) -> Frag {
        let mut out = Frag::default();
        let compiler = self.imports.remove("react/compiler-runtime");
        if compiler.is_some() {
            out.s("// @ts-expect-error: React's types hide the compiler runtime, which only compiled code calls.\n");
            out.s("import { c as $c } from \"react/compiler-runtime\";\n");
        }
        for (module, names) in &self.imports {
            let names: Vec<&str> = names.iter().map(String::as_str).collect();
            out.s(&format!("import {{ {} }} from {};\n", names.join(", "), string_literal(module)));
        }
        for (module, names) in &self.type_imports {
            let names: Vec<&str> = names.iter().map(String::as_str).collect();
            out.s(&format!("import type {{ {} }} from {};\n", names.join(", "), string_literal(module)));
        }
        out
    }

    fn import(&mut self, import: &Import) -> Frag {
        if matches!(import.kind, ImportKind::Module(_)) {
            return Frag::default();
        }
        let specifier = match import.source.as_str() {
            "bloom/data" => DATA,
            "bloom/router" => ROUTER,
            "bloom/motion" => LANGUAGE,
            // JS's own globals: named in the file, imported from nowhere.
            "js" => return Frag::default(),
            other => other,
        };
        let mut out = Frag::at(import.span, "import ");
        match &import.kind {
            ImportKind::Module(_) => {}
            ImportKind::Namespace(name) => {
                out.s(&format!("* as {}", js_name(&name.name)));
            }
            ImportKind::Named(specs) => {
                let parts: Vec<String> = specs
                    .iter()
                    .map(|spec| {
                        let local = spec.local();
                        let kind = if spec.type_only || self.ck.type_only_imports.contains(&spec.span) {
                            "type "
                        } else {
                            ""
                        };
                        if local.name == spec.name.name {
                            format!("{kind}{}", spec.name.name)
                        } else {
                            format!("{kind}{} as {}", spec.name.name, local.name)
                        }
                    })
                    .collect();
                out.s(&format!("{{ {} }}", parts.join(", ")));
            }
        }
        out.s(&format!(" from {};\n", string_literal(specifier)));
        out
    }

    // ---- types ------------------------------------------------------------

    fn ts_type(&mut self, ty: &Ty) -> String {
        match ty {
            Ty::Int | Ty::Float => "number".into(),
            Ty::Bool => "boolean".into(),
            Ty::Str => "string".into(),
            Ty::Unit => "undefined".into(),
            Ty::Never => "never".into(),
            Ty::JsError => "Error".into(),
            Ty::List(t) => format!("readonly {}[]", self.ts_operand(t)),
            Ty::Map(v) => format!("Readonly<Record<string, {}>>", self.ts_type(v)),
            Ty::JsMap(k, v) => format!("ReadonlyMap<{}, {}>", self.ts_type(k), self.ts_type(v)),
            Ty::Set(t) => format!("ReadonlySet<{}>", self.ts_type(t)),
            Ty::Tuple(items) => {
                format!("readonly [{}]", items.iter().map(|t| self.ts_type(t)).collect::<Vec<_>>().join(", "))
            }
            Ty::Option(t) => format!("{} | undefined", self.ts_operand(t)),
            Ty::Result(a, b) => {
                self.uses_result = true;
                format!("$Result<{}, {}>", self.ts_type(a), self.ts_type(b))
            }
            Ty::Adt(def, args) => {
                let d = &self.ck.defs[*def];
                let base = match &d.origin {
                    Origin::Record => {
                        let fields: Vec<String> = d
                            .fields()
                            .iter()
                            .map(|f| {
                                let optional = if f.default == FieldDefault::Undefined { "?" } else { "" };
                                format!("{}{optional}: {}", prop_key(&f.name), self.ts_type(&f.ty))
                            })
                            .collect();
                        format!("{{ {} }}", fields.join("; "))
                    }
                    Origin::Local => d.name.clone(),
                    Origin::Bloom { specifier } => {
                        if !self.ck.type_imports.contains(&d.name) {
                            self.type_imports.entry(specifier.clone()).or_default().insert(d.name.clone());
                        }
                        d.name.clone()
                    }
                    Origin::Ts { path } => {
                        if self.ck.type_imports.contains(&d.name) {
                            d.name.clone()
                        } else {
                            path.clone()
                        }
                    }
                };
                if args.is_empty() || matches!(d.origin, Origin::Ts { .. }) {
                    base
                } else {
                    format!("{base}<{}>", args.iter().map(|t| self.ts_type(t)).collect::<Vec<_>>().join(", "))
                }
            }
            Ty::Partial(inner) => format!("Partial<{}>", self.ts_type(inner)),
            Ty::KeyPath(root, value) => {
                self.uses_key_path = true;
                format!("$KeyPath<{}, {}>", self.ts_type(root), self.ts_type(value))
            }
            Ty::Fn(f) => {
                let params: Vec<String> = f
                    .params
                    .iter()
                    .enumerate()
                    .map(|(i, p)| {
                        let name = p.name.clone().map_or(format!("p{i}"), |n| js_name(&n));
                        if p.rest {
                            return format!("...{name}: {}[]", self.ts_type(&p.ty));
                        }
                        let optional = if p.optional { "?" } else { "" };
                        format!("{name}{optional}: {}", self.ts_type(&p.ty))
                    })
                    .collect();
                let ret = self.ts_return(&f.ret, f.is_async);
                format!("({}) => {ret}", params.join(", "))
            }
            Ty::Async(t) | Ty::Promise(t) => format!("Promise<{}>", self.ts_return(t, false)),
            Ty::View(_) => {
                self.type_imports.entry(LANGUAGE.into()).or_default().insert("Child".into());
                "Child".into()
            }
            Ty::Binding(t) => {
                self.type_imports.entry(LANGUAGE.into()).or_default().insert("Binding".into());
                format!("Binding<{}>", self.ts_type(t))
            }
            Ty::Strings(set) => set.values.iter().map(|v| string_literal(v)).collect::<Vec<_>>().join(" | "),
            Ty::Foreign(path) if !path.is_empty() && !path.contains("Navigation") => {
                for name in ["ComponentRef", "ComponentProps"] {
                    if path.contains(&format!("{name}<")) {
                        self.type_imports.entry("react".into()).or_default().insert(name.into());
                    }
                }
                path.to_string()
            }
            Ty::Param(_, name) => name.to_string(),
            Ty::Foreign(_) | Ty::Var(_) | Ty::Unknown => "unknown".into(),
        }
    }

    fn ts_operand(&mut self, ty: &Ty) -> String {
        let text = self.ts_type(ty);
        if matches!(ty, Ty::Option(_) | Ty::Fn(_) | Ty::Strings(_))
            || text.contains(" | ") && !text.starts_with('(')
            || text.starts_with("readonly ")
        {
            format!("({text})")
        } else {
            text
        }
    }

    fn ts_return(&mut self, ty: &Ty, is_async: bool) -> String {
        let inner = if *ty == Ty::Unit { "void".to_string() } else { self.ts_type(ty) };
        if is_async { format!("Promise<{inner}>") } else { inner }
    }

    /// The emitted type of a field: optional fields are written `name?:`.
    fn ts_field(&mut self, field: &FieldDef) -> String {
        format!("readonly {}: {};", prop_key(&field.name), self.ts_type(&field.ty))
    }

    // ---- names ------------------------------------------------------------

    fn local_name(&self, local: LocalId) -> String {
        if let Some(alias) = self.aliases.get(&local) {
            return alias.clone();
        }
        if self.ck.whole_props.contains(&local) {
            return "props".into();
        }
        let info = &self.ck.locals[local];
        if let Some(hoisted) = self.hoisted_names.get(&info.span) {
            return hoisted.clone();
        }
        if info.kind == LocalKind::Ref {
            return format!("{}.current", js_name(&info.name));
        }
        js_name(&info.name)
    }

    /// A `@ref` passed to `.ref(x)`: a host view fills it, so it holds `null` when empty.
    fn is_view_ref(&self, local: LocalId) -> bool {
        self.ck
            .ref_objects
            .iter()
            .any(|id| matches!(self.ck.names.get(id), Some(NameRes::Local(l)) if *l == local))
    }

    fn setter(&self, local: LocalId) -> String {
        self.view
            .as_ref()
            .and_then(|v| v.setters.get(&local).cloned())
            .unwrap_or_else(|| format!("set{}", capitalised(&self.ck.locals[local].name)))
    }

    fn temp(&mut self) -> String {
        self.temps += 1;
        format!("$t{}", self.temps - 1)
    }

    fn push_stmt(&mut self, stmt: Frag) {
        self.bufs.last_mut().expect("a buffer").push(stmt);
    }

    // ---- items ------------------------------------------------------------

    fn item(&mut self, index: usize, item: &Item) -> Frag {
        let export = if !item.visibility.exported(self.options.modules) { "" } else { "export " };
        match &item.kind {
            ItemKind::Struct(s) => self.struct_decl(s, export),
            ItemKind::Enum(e) => self.enum_decl(e, export),
            ItemKind::Alias(a) => {
                let generics = self.generics(&a.generics);
                let ty = self.ck.type_exprs.get(&a.ty.span).cloned().unwrap_or(Ty::Unknown);
                let text = self.ts_type(&ty);
                Frag::at(item.span, format!("{export}type {}{generics} = {text};\n", a.name.name))
            }
            ItemKind::Const(c) => {
                let local = self.ck.items[&index];
                let ty = self.ck.locals[local].ty.clone();
                let annotation =
                    if c.ty.is_some() { format!(": {}", self.ts_type(&ty)) } else { String::new() };
                let value = self.value_expr(&c.value);
                let mut out =
                    Frag::at(item.span, format!("{export}const {}{annotation} = ", js_name(&c.name.name)));
                out.f(value).s(";\n");
                out
            }
            ItemKind::Fn(f) => {
                let mut out = Frag::at(item.span, export);
                out.f(self.function(f, None));
                out.s("\n");
                out
            }
            ItemKind::View(v) => self.view_decl(index, item, v),
        }
    }

    fn generics(&self, generics: &[Ident]) -> String {
        if generics.is_empty() {
            String::new()
        } else {
            format!("<{}>", generics.iter().map(|g| g.name.as_str()).collect::<Vec<_>>().join(", "))
        }
    }

    fn def_of(&self, name: &str) -> Option<DefId> {
        self.ck.defs.iter().position(|d| d.name == name && d.origin == Origin::Local)
    }

    fn struct_decl(&mut self, s: &StructDecl, export: &str) -> Frag {
        let Some(def) = self.def_of(&s.name.name) else { return Frag::default() };
        let fields: Vec<String> =
            self.ck.defs[def].fields().to_vec().iter().map(|f| format!("  {}", self.ts_field(f))).collect();
        Frag::at(
            s.name.span,
            format!(
                "{export}interface {}{} {{\n{}\n}}\n",
                s.name.name,
                self.generics(&s.generics),
                fields.join("\n")
            ),
        )
    }

    fn enum_decl(&mut self, e: &EnumDecl, export: &str) -> Frag {
        let Some(def) = self.def_of(&e.name.name) else { return Frag::default() };
        let text = self.enum_type(def);
        Frag::at(
            e.name.span,
            format!("{export}type {}{} = {text};\n", e.name.name, self.generics(&e.generics)),
        )
    }

    /// An enum's representation: a string per fieldless case, `{ tag, … }` per payload case.
    fn enum_type(&mut self, def: DefId) -> String {
        let variants = self.ck.defs[def].variants().to_vec();
        if variants.is_empty() {
            return "never".into();
        }
        variants
            .iter()
            .map(|v| {
                if v.payload.is_empty() {
                    string_literal(&v.name)
                } else {
                    let fields: Vec<String> = (0..v.payload.len())
                        .map(|i| {
                            format!("readonly {}: {}", prop_key(&v.key(i)), self.ts_type(&v.payload[i].1))
                        })
                        .collect();
                    format!("{{ readonly tag: {}; {} }}", string_literal(&v.name), fields.join("; "))
                }
            })
            .collect::<Vec<_>>()
            .join(" | ")
    }

    /// `function name(params): Ret { body }`; `name`: a closure's own name (a handler).
    fn function(&mut self, f: &FnDecl, as_arrow: Option<()>) -> Frag {
        let params = self.ck.fn_params.get(&f.span).cloned().unwrap_or_default();
        let mut list = Vec::new();
        for (param, local) in f.params.iter().zip(&params) {
            let ty = self.ck.locals[*local].ty.clone();
            let dots = if param.rest { "..." } else { "" };
            let mut p =
                Frag::at(param.span, format!("{dots}{}: {}", js_name(&param.name.name), self.ts_type(&ty)));
            if let Some(default) = &param.default {
                p.s(" = ").f(self.value_expr(default));
            }
            list.push(p);
        }
        let ret_ty = f
            .ret
            .as_ref()
            .and_then(|r| self.ck.type_exprs.get(&r.span).cloned())
            .or_else(|| self.ck.fn_rets.get(&f.span).cloned())
            .unwrap_or(Ty::Unit);
        let ret = self.ts_return(&ret_ty, f.is_async);
        let generics = self.generics(&f.generics);
        let tail = if ret_ty == Ty::Unit { Tail::Discard } else { Tail::Return };
        let body = self.block_body(&f.body.stmts, tail, None);
        let mut out = Frag::at(f.span, "");
        match as_arrow {
            None => {
                out.s(if f.is_async { "async function " } else { "function " })
                    .s(&js_name(&f.name.name))
                    .s(&generics)
                    .s("(");
                out.f(Frag::join(list, ", ")).s(&format!("): {ret} "));
            }
            Some(()) => {
                out.s(if f.is_async { "async " } else { "" }).s(&generics).s("(");
                out.f(Frag::join(list, ", ")).s(&format!("): {ret} => "));
            }
        }
        out.f(body);
        out
    }

    // ---- blocks and statements --------------------------------------------

    /// `{ statements }`, the last line's value going to `tail`.
    fn block_body(&mut self, stmts: &[Stmt], tail: Tail, signal: Option<&str>) -> Frag {
        self.bufs.push(Vec::new());
        self.stmts(stmts, tail, signal);
        let lines = self.bufs.pop().expect("the block's buffer");
        let mut out = Frag::of("{\n");
        for line in lines {
            out.f(line).s("\n");
        }
        out.s("}");
        out
    }

    fn stmts(&mut self, stmts: &[Stmt], tail: Tail, signal: Option<&str>) {
        for (index, stmt) in stmts.iter().enumerate() {
            let last = index + 1 == stmts.len();
            if let StmtKind::Defer(deferred) = &stmt.kind {
                // The rest of the block runs in `try`, the deferred block in `finally`.
                self.bufs.push(Vec::new());
                self.stmts(&stmts[index + 1..], tail, signal);
                let rest = self.bufs.pop().expect("the rest");
                let finally = self.block_body(&deferred.stmts, Tail::Discard, None);
                if let Some(signal) = signal {
                    // In a task, it also runs when the task is cancelled, then not again.
                    let name = self.temp();
                    let mut line = Frag::at(stmt.span, format!("const {name} = () => "));
                    line.f(finally).s(&format!(";\n{signal}.addEventListener(\"abort\", {name});\ntry {{\n"));
                    for l in rest {
                        line.f(l).s("\n");
                    }
                    line.s(&format!(
                        "}} finally {{\n{signal}.removeEventListener(\"abort\", {name});\nif (!{signal}.aborted) {name}();\n}}"
                    ));
                    self.push_stmt(line);
                    return;
                }
                let mut line = Frag::at(stmt.span, "try {\n");
                for l in rest {
                    line.f(l).s("\n");
                }
                line.s("} finally ").f(finally);
                self.push_stmt(line);
                return;
            }
            match (&stmt.kind, last) {
                (StmtKind::Expr(expr), true) => self.tail_expr(expr, &tail),
                _ => self.stmt(stmt),
            }
            if let Some(signal) = signal
                && stmt_awaits(stmt)
                && !last
            {
                self.push_stmt(Frag::of(format!("if ({signal}.aborted) return;")));
            }
        }
    }

    /// An expression whose value goes to `tail`.
    fn tail_expr(&mut self, expr: &Expr, tail: &Tail) {
        // `fail(e)` as a statement, or a block's last line: `throw e;` (it gives no value).
        if let ExprKind::Call(call) = &expr.kind
            && self.ck.calls.get(&expr.id) == Some(&CallRes::Fail)
        {
            let mut line = Frag::at(expr.span, "throw ");
            line.f(self.fail_value(call)).s(";");
            self.push_stmt(line);
            return;
        }
        match (&expr.kind, tail) {
            (ExprKind::If(if_expr), _) if !self.simple_if(if_expr) || matches!(tail, Tail::Discard) => {
                self.if_stmt(if_expr, tail)
            }
            (ExprKind::Match(m), _) if !self.simple_match(m) || matches!(tail, Tail::Discard) => {
                self.match_stmt(m, tail)
            }
            (_, Tail::Discard) => {
                let value = self.expr(expr);
                // `await ping()?` as a statement: the work is in the statements it pushed.
                if value.text == "undefined" {
                    return;
                }
                let mut line = value;
                line.s(";");
                self.push_stmt(line);
            }
            (_, Tail::Return) => {
                let value = self.expr(expr);
                let mut line = Frag::at(expr.span, "return ");
                line.f(value).s(";");
                self.push_stmt(line);
            }
            (_, Tail::Bind(name)) => {
                let value = self.expr(expr);
                let mut line = Frag::at(expr.span, format!("{name} = "));
                line.f(value).s(";");
                self.push_stmt(line);
            }
        }
    }

    fn stmt(&mut self, stmt: &Stmt) {
        match &stmt.kind {
            StmtKind::Let(l) => {
                let annotation = l.ty.as_ref().and_then(|t| self.ck.type_exprs.get(&t.span).cloned());
                let value = self.value_expr(&l.value);
                let target = self.binding_target(&l.pattern);
                let annotation = annotation.map(|ty| format!(": {}", self.ts_type(&ty))).unwrap_or_default();
                // `let _ = v`: the value, bound to nothing (two would redeclare `_`).
                let head = if l.pattern.kind == PatternKind::Wildcard {
                    String::new()
                } else {
                    format!("const {target}{annotation} = ")
                };
                let mut line = Frag::at(stmt.span, head);
                line.f(value).s(";");
                self.push_stmt(line);
            }
            StmtKind::Var(v) => {
                let annotation = v.ty.as_ref().and_then(|t| self.ck.type_exprs.get(&t.span).cloned());
                let annotation = annotation.map(|ty| format!(": {}", self.ts_type(&ty))).unwrap_or_default();
                let value = self.value_expr(&v.value);
                let mut line = Frag::at(stmt.span, format!("let {}{annotation} = ", js_name(&v.name.name)));
                line.f(value).s(";");
                self.push_stmt(line);
            }
            StmtKind::Assign(a) => self.assign(a, stmt.span),
            StmtKind::Return(value) => match value {
                Some(value) => self.tail_expr(value, &Tail::Return),
                None => self.push_stmt(Frag::at(stmt.span, "return;")),
            },
            StmtKind::While(w) => {
                let cond = self.expr(&w.cond);
                let body = self.block_body(&w.body.stmts, Tail::Discard, self.signal.clone().as_deref());
                let mut line = Frag::at(stmt.span, "while (");
                line.f(cond).s(") ").f(body);
                self.push_stmt(line);
            }
            StmtKind::For(f) => {
                let iter_ty = self.ck.types.get(&f.iter.id).cloned().unwrap_or(Ty::Unknown);
                let mut iter = match self.enumerated_list(&f.iter) {
                    // `for (i, x) in xs.enumerated()`: the array's own `[i, x]` entries.
                    Some(list) => {
                        let mut out = self.operand(list);
                        out.s(".entries()");
                        out
                    }
                    None => self.expr(&f.iter),
                };
                if matches!(iter_ty, Ty::Map(_)) {
                    iter = iter.wrap("Object.entries(", ")");
                }
                let target = self.binding_target(&f.pattern);
                let body = self.block_body(&f.body.stmts, Tail::Discard, self.signal.clone().as_deref());
                let mut line = Frag::at(stmt.span, format!("for (const {target} of "));
                line.f(iter).s(") ").f(body);
                self.push_stmt(line);
            }
            StmtKind::Expr(expr) => self.tail_expr(expr, &Tail::Discard),
            StmtKind::Defer(block) => {
                let body = self.block_body(&block.stmts, Tail::Discard, None);
                self.push_stmt(body);
            }
            // `guard c else { … }`: `if (!(c)) { … }`; what `c` binds reads its path after it.
            StmtKind::Guard(g) => {
                let cond = self.condition(&g.cond);
                let body = self.block_body(&g.otherwise.stmts, Tail::Discard, self.signal.clone().as_deref());
                let mut line = Frag::at(stmt.span, "if (!(");
                line.f(cond).s(")) ").f(body);
                self.push_stmt(line);
            }
            StmtKind::Throw(value) => {
                let value = self.expr(value);
                let mut line = Frag::at(stmt.span, "throw ");
                line.f(value).s(";");
                self.push_stmt(line);
            }
            StmtKind::Do(d) => self.do_stmt(d, stmt.span),
        }
    }

    /// `do { … } catch … { … }`: one JS `try`; several catches test the error in order, and
    /// one that matches none rethrows it.
    fn do_stmt(&mut self, d: &DoStmt, span: Span) {
        let signal = self.signal.clone();
        let body = self.block_body(&d.body.stmts, Tail::Discard, signal.as_deref());
        let mut line = Frag::at(span, "try ");
        line.f(body);
        match d.catches.as_slice() {
            [] => {
                line.s(" finally {}");
            }
            [only] if only.pattern.is_none() => {
                let name = only.name.as_ref().map_or("error".to_string(), |n| js_name(&n.name));
                let body = self.block_body(&only.body.stmts, Tail::Discard, signal.as_deref());
                line.s(&format!(" catch ({name}) ")).f(body);
            }
            catches => {
                line.s(" catch ($error) {\n");
                let mut caught_all = false;
                for (index, catch) in catches.iter().enumerate() {
                    let test = match &catch.pattern {
                        Some(pattern) => {
                            let tests = self.pattern_test(pattern, "$error");
                            if tests.is_empty() { None } else { Some(tests.join(" && ")) }
                        }
                        None => None,
                    };
                    let mut lines = Vec::new();
                    if catch.pattern.is_none() {
                        let name = catch.name.as_ref().map_or("error".to_string(), |n| js_name(&n.name));
                        lines.push(format!("const {name} = $error;"));
                    }
                    let body = self.block_body(&catch.body.stmts, Tail::Discard, signal.as_deref());
                    let head = match (&test, index) {
                        (Some(test), 0) => format!("if ({test}) "),
                        (Some(test), _) => format!(" else if ({test}) "),
                        (None, 0) => String::new(),
                        (None, _) => " else ".to_string(),
                    };
                    line.s(&head);
                    if lines.is_empty() {
                        line.f(body);
                    } else {
                        line.s("{\n").s(&lines.join("\n")).s("\n").f(body).s("\n}");
                    }
                    if test.is_none() {
                        caught_all = true;
                        break;
                    }
                }
                if !caught_all {
                    line.s(" else {\nthrow $error;\n}");
                }
                line.s("\n}");
            }
        }
        self.push_stmt(line);
    }

    /// The JS binding a `let` pattern writes (`x`, `{ a, b: c }`, `[a, b]`).
    fn binding_target(&self, pattern: &Pattern) -> String {
        match &pattern.kind {
            PatternKind::Bind(name) => js_name(&name.name),
            PatternKind::Wildcard => "_".into(),
            PatternKind::Tuple(items) => {
                // `(_, b)`: a hole, `[, b]`.
                let items: Vec<String> =
                    items
                        .iter()
                        .map(|p| {
                            if p.kind == PatternKind::Wildcard {
                                String::new()
                            } else {
                                self.binding_target(p)
                            }
                        })
                        .collect();
                format!("[{}]", items.join(", "))
            }
            PatternKind::Record(fields) => {
                let parts: Vec<String> = fields
                    .iter()
                    .map(|(name, sub)| match sub {
                        Some(sub) => format!("{}: {}", prop_key(&name.name), self.binding_target(sub)),
                        None => js_name(&name.name),
                    })
                    .collect();
                format!("{{ {} }}", parts.join(", "))
            }
            _ => "_".into(),
        }
    }

    fn assign(&mut self, a: &AssignStmt, span: Span) {
        let Some(res) = self.ck.assigns.get(&a.span).cloned() else { return };
        let op = match a.op {
            AssignOp::Set => None,
            AssignOp::Add => Some("+"),
            AssignOp::Sub => Some("-"),
            AssignOp::Mul => Some("*"),
        };
        let value = self.expr(&a.value);
        let combine = |current: Frag, value: Frag| -> Frag {
            match op {
                Some(op) => {
                    let mut out = current;
                    out.s(&format!(" {op} ")).f(value.wrap("(", ")"));
                    out
                }
                None => value,
            }
        };
        match res {
            AssignRes::State { local, fields, functional } => {
                let name = self.local_name(local);
                let setter = self.setter(local);
                let new = if fields.is_empty() {
                    combine(Frag::of(name.clone()), value)
                } else {
                    updated(&name, &fields, combine(Frag::of(field_path(&name, &fields)), value))
                };
                let mut line = Frag::at(span, format!("{setter}("));
                if functional {
                    line.s(&format!("({name}) => ")).f(if fields.is_empty() {
                        new
                    } else {
                        new.wrap("(", ")")
                    });
                } else {
                    line.f(new);
                }
                line.s(");");
                self.push_stmt(line);
            }
            AssignRes::Foreign => {
                let mut line = Frag::at(span, "");
                line.f(self.expr(&a.target)).s(&format!(" {} ", a.op.text())).f(value).s(";");
                self.push_stmt(line);
            }
            AssignRes::Var { local, fields } => {
                let name = self.local_name(local);
                let new = if fields.is_empty() {
                    combine(Frag::of(name.clone()), value)
                } else {
                    updated(&name, &fields, combine(Frag::of(field_path(&name, &fields)), value))
                };
                let mut line = Frag::at(span, format!("{name} = "));
                line.f(new).s(";");
                self.push_stmt(line);
            }
        }
    }

    // ---- control flow -----------------------------------------------------

    /// An `if` whose branches are each one expression, with no `let` to bind: a ternary.
    fn simple_if(&self, if_expr: &IfExpr) -> bool {
        let one = |b: &Block| matches!(b.stmts.as_slice(), [Stmt { kind: StmtKind::Expr(e), .. }] if !matches!(e.kind, ExprKind::If(_) | ExprKind::Match(_)) || matches!(&e.kind, ExprKind::If(i) if self.simple_if(i)));
        matches!(if_expr.cond, Cond::Expr(_))
            && one(&if_expr.then)
            && match if_expr.otherwise.as_deref() {
                Some(Else::Block(b)) => one(b),
                Some(Else::If(e)) => matches!(&e.kind, ExprKind::If(i) if self.simple_if(i)),
                None => false,
            }
    }

    fn simple_match(&self, m: &MatchExpr) -> bool {
        m.arms.iter().all(|arm| matches!(arm.body, ArmBody::Expr(_)) && !binds(&arm.pattern))
            && is_path(&m.scrutinee)
    }

    fn if_stmt(&mut self, if_expr: &IfExpr, tail: &Tail) {
        let cond = self.condition(&if_expr.cond);
        let signal = self.signal.clone();
        self.bufs.push(Vec::new());
        self.stmts(&if_expr.then.stmts, tail.clone(), signal.as_deref());
        if if_expr.then.stmts.is_empty() {
            self.bind_unit(tail);
        }
        let then = self.bufs.pop().expect("then");
        let mut line = Frag::of("if (");
        line.f(cond).s(") {\n");
        for l in then {
            line.f(l).s("\n");
        }
        line.s("}");
        match if_expr.otherwise.as_deref() {
            Some(Else::If(next)) => {
                let ExprKind::If(next_if) = &next.kind else { unreachable!() };
                self.bufs.push(Vec::new());
                self.if_stmt(next_if, tail);
                let rest = self.bufs.pop().expect("else");
                line.s(" else {\n");
                for l in rest {
                    line.f(l).s("\n");
                }
                line.s("}");
            }
            Some(Else::Block(block)) => {
                self.bufs.push(Vec::new());
                self.stmts(&block.stmts, tail.clone(), signal.as_deref());
                let rest = self.bufs.pop().expect("else");
                line.s(" else {\n");
                for l in rest {
                    line.f(l).s("\n");
                }
                line.s("}");
            }
            None => {
                if let Tail::Bind(name) = tail {
                    line.s(&format!(" else {{\n{name} = undefined;\n}}"));
                }
            }
        }
        self.push_stmt(line);
    }

    fn bind_unit(&mut self, tail: &Tail) {
        if let Tail::Bind(name) = tail {
            self.push_stmt(Frag::of(format!("{name} = undefined;")));
        }
    }

    /// A condition's test; the names an `if let` binds become aliases of their paths.
    fn condition(&mut self, cond: &Cond) -> Frag {
        match cond {
            Cond::Expr(expr) => self.expr(expr),
            Cond::Let(pattern, value) => {
                let subject = self.subject(value, &[pattern]);
                let value_ty = self.ck.pattern_tys.get(&value.span).cloned().unwrap_or(Ty::Unknown);
                // `if let v = optional` unwraps; any other pattern matches.
                if let (PatternKind::Bind(name), Ty::Option(_)) = (&pattern.kind, &value_ty) {
                    self.alias(name, &subject);
                    return Frag::of(format!("{subject} !== undefined"));
                }
                let tests = self.pattern_test(pattern, &subject);
                Frag::of(if tests.is_empty() { "true".to_string() } else { tests.join(" && ") })
            }
        }
    }

    /// The type of what `expr` evaluates to.
    fn expr_ty(&self, expr: &Expr) -> Ty {
        self.ck.types.get(&expr.id).cloned().unwrap_or(Ty::Unknown)
    }

    /// Whether `path` starts at a `var` (a value that can change while its bindings are read).
    fn var_rooted(&self, path: &Expr) -> bool {
        let mut root = path;
        while let ExprKind::Field(inner, _) | ExprKind::Paren(inner) = &root.kind {
            root = inner;
        }
        matches!(self.ck.names.get(&root.id), Some(NameRes::Local(l)) if matches!(self.ck.locals[*l].kind, LocalKind::Var | LocalKind::Ref))
    }

    /// `name` (a pattern's binding) reads `path`.
    fn alias(&mut self, name: &Ident, path: &str) {
        if let Some(local) = self.ck.pattern_locals.get(&name.span) {
            self.aliases.insert(*local, path.to_string());
        }
    }

    /// A value matched more than once: a path as is (one no `var` roots, so it
    /// cannot change under its bindings), anything else in a temp; an awaited
    /// TS promise is settled in place (`await_settled`), its value kept when
    /// one of `patterns` binds it.
    fn subject(&mut self, value: &Expr, patterns: &[&Pattern]) -> String {
        // Settled in place when every pattern is `.ok(…)`, `.err(…)` or `_`; a
        // pattern that binds the `Result` itself reads it whole.
        if let ExprKind::Await(inner) = &value.kind
            && self.ck.awaits.get(&value.id) == Some(&AwaitRes::Ts)
            && patterns.iter().all(|p| matches!(p.kind, PatternKind::Case { .. } | PatternKind::Wildcard))
        {
            let keep = patterns.iter().any(|p| {
                matches!(&p.kind, PatternKind::Case { name, args: Some(args), .. } if name.name == "ok" && args.iter().any(binds))
            });
            let (ok, error) = self.await_settled(value, inner, keep);
            self.splits.insert(error.clone(), ok);
            return error;
        }
        if is_path(value) && !matches!(value.kind, ExprKind::Call(_)) && !self.var_rooted(value) {
            return self.expr(value).text;
        }
        let name = self.temp();
        let emitted = self.expr(value);
        let mut line = Frag::at(value.span, format!("const {name} = "));
        line.f(emitted).s(";");
        self.push_stmt(line);
        name
    }

    fn match_stmt(&mut self, m: &MatchExpr, tail: &Tail) {
        let patterns: Vec<&Pattern> = m.arms.iter().map(|a| &a.pattern).collect();
        let subject = self.subject(&m.scrutinee, &patterns);
        let signal = self.signal.clone();
        let mut line = Frag::default();
        let count = m.arms.len();
        for (index, arm) in m.arms.iter().enumerate() {
            let mut tests = self.pattern_test(&arm.pattern, &subject);
            let last = index + 1 == count && arm.guard.is_none();
            self.bufs.push(Vec::new());
            let guard = arm.guard.as_ref().map(|g| self.expr(g));
            match &arm.body {
                ArmBody::Expr(e) => self.tail_expr(e, tail),
                ArmBody::Block(b) => {
                    self.stmts(&b.stmts, tail.clone(), signal.as_deref());
                    if b.stmts.is_empty() {
                        self.bind_unit(tail);
                    }
                }
            }
            let body = self.bufs.pop().expect("arm");
            if index > 0 {
                line.s(" else ");
            }
            if last && index > 0 {
                line.s("{\n");
            } else {
                if tests.is_empty() {
                    tests.push("true".into());
                }
                line.s("if (").s(&tests.join(" && "));
                if let Some(guard) = guard {
                    line.s(" && (").f(guard).s(")");
                }
                line.s(") {\n");
            }
            for l in body {
                line.f(l).s("\n");
            }
            line.s("}");
        }
        self.push_stmt(line);
    }

    /// A pattern's tests on `subject`; the names it binds become aliases of their paths.
    fn pattern_test(&mut self, pattern: &Pattern, subject: &str) -> Vec<String> {
        let ty = self.ck.pattern_tys.get(&pattern.span).cloned().unwrap_or(Ty::Unknown);
        let mut tests = Vec::new();
        match &pattern.kind {
            PatternKind::Wildcard => {}
            PatternKind::Bind(name) => self.alias(name, subject),
            PatternKind::Literal(expr) => {
                let value = self.expr(expr).text;
                tests.push(format!("{subject} === {value}"));
            }
            PatternKind::None => tests.push(format!("{subject} === undefined")),
            PatternKind::Tuple(items) => {
                for (i, item) in items.iter().enumerate() {
                    tests.extend(self.pattern_test(item, &format!("{subject}[{i}]")));
                }
            }
            PatternKind::Record(fields) => {
                for (name, sub) in fields {
                    let path = format!("{subject}.{}", name.name);
                    match sub {
                        Some(sub) => tests.extend(self.pattern_test(sub, &path)),
                        None => self.alias(name, &path),
                    }
                }
            }
            PatternKind::Or(alternatives) => {
                let alts: Vec<String> = alternatives
                    .iter()
                    .map(|a| {
                        let t = self.pattern_test(a, subject);
                        if t.is_empty() { "true".into() } else { format!("({})", t.join(" && ")) }
                    })
                    .collect();
                tests.push(format!("({})", alts.join(" || ")));
            }
            PatternKind::Case { name, args, .. } => {
                let args = args.clone().unwrap_or_default();
                let sub = |this: &mut Self, index: usize, path: String, tests: &mut Vec<String>| {
                    if let Some(p) = args.get(index) {
                        tests.extend(this.pattern_test(p, &path));
                    }
                };
                // An awaited promise settled in place: no error is `ok`, its value the value temp.
                let split = self.splits.get(subject).cloned();
                match (&ty, name.name.as_str()) {
                    (Ty::Option(_), "none") => tests.push(format!("{subject} === undefined")),
                    (Ty::Option(_), _) => {
                        tests.push(format!("{subject} !== undefined"));
                        sub(self, 0, subject.to_string(), &mut tests);
                    }
                    (Ty::Result(..), "ok") => match split {
                        Some(value) => {
                            tests.push(format!("{subject} === undefined"));
                            sub(self, 0, value.unwrap_or_else(|| "undefined".into()), &mut tests);
                        }
                        None => {
                            tests.push(format!("{subject}.ok"));
                            sub(self, 0, format!("{subject}.value"), &mut tests);
                        }
                    },
                    (Ty::Result(..), _) => match split {
                        Some(_) => {
                            tests.push(format!("{subject} !== undefined"));
                            sub(self, 0, subject.to_string(), &mut tests);
                        }
                        None => {
                            tests.push(format!("!{subject}.ok"));
                            sub(self, 0, format!("{subject}.error"), &mut tests);
                        }
                    },
                    (Ty::Adt(def, _), case) => {
                        let d = &self.ck.defs[*def];
                        let Some(variant) = d.variants().iter().find(|v| v.name == case).cloned() else {
                            return tests;
                        };
                        if variant.payload.is_empty() {
                            tests.push(format!("{subject} === {}", string_literal(case)));
                        } else {
                            if !d.is_fieldless() && d.variants().iter().any(|v| v.payload.is_empty()) {
                                tests.push(format!("typeof {subject} === \"object\""));
                            }
                            tests.push(format!("{subject}.tag === {}", string_literal(case)));
                            for index in 0..variant.payload.len() {
                                sub(self, index, format!("{subject}.{}", variant.key(index)), &mut tests);
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        tests
    }

    // ---- expressions --------------------------------------------------------

    /// An expression in a value position (a `let`, an argument): an `if` or
    /// `match` that needs statements is lowered into a temp.
    fn value_expr(&mut self, expr: &Expr) -> Frag {
        self.expr(expr)
    }

    /// An operand: parenthesised unless it is an atom.
    fn operand(&mut self, expr: &Expr) -> Frag {
        let out = self.expr(expr);
        if is_atom(expr) { out } else { out.wrap("(", ")") }
    }

    /// An expression evaluated only sometimes (a branch, the right of `&&`):
    /// its value, and the statements it needs (they stay inside its branch).
    fn conditional(&mut self, f: impl FnOnce(&mut Self) -> Frag) -> (Vec<Frag>, Frag) {
        self.conditional += 1;
        self.bufs.push(Vec::new());
        let value = f(self);
        let stmts = self.bufs.pop().expect("the branch");
        self.conditional -= 1;
        (stmts, value)
    }

    /// Choices tried in order, the first whose test holds giving the value (the
    /// last has no test): a conditional expression when no choice needs
    /// statements, else an `if` chain into a temp of type `ty`.
    fn select(&mut self, choices: Vec<Choice>, ty: &Ty, paren: bool) -> Frag {
        let needs_statements = choices.iter().enumerate().any(|(i, c)| {
            !c.value.0.is_empty() || i > 0 && c.test.as_ref().is_some_and(|(stmts, _)| !stmts.is_empty())
        });
        if !needs_statements {
            let mut out = Frag::default();
            for choice in choices {
                if let Some((_, test)) = choice.test {
                    out.f(if paren { test.wrap("(", ")") } else { test }).s(" ? ").f(choice.value.1).s(" : ");
                } else {
                    out.f(choice.value.1);
                }
            }
            return out;
        }
        let name = self.temp();
        let ty = self.ts_type(ty);
        self.push_stmt(Frag::of(format!("let {name}: {ty};")));
        let mut chain = Frag::default();
        for (index, choice) in choices.into_iter().rev().enumerate() {
            let mut body = Frag::default();
            for line in choice.value.0 {
                body.f(line).s("\n");
            }
            body.s(&format!("{name} = ")).f(choice.value.1).s(";\n");
            chain = match choice.test {
                None => body,
                Some((stmts, test)) => {
                    let mut out = Frag::default();
                    for line in stmts {
                        out.f(line).s("\n");
                    }
                    out.s("if (").f(test).s(") {\n").f(body).s("}");
                    if index > 0 {
                        out.s(" else {\n").f(chain).s("}");
                    }
                    out.s("\n");
                    out
                }
            };
        }
        let text = chain.text.trim_end().to_string();
        chain.text = text;
        self.push_stmt(chain);
        Frag::of(name)
    }

    /// `await promise` of a TS promise, settled in place with a `try` around
    /// only the await: the value in one temp (none for `Unit`), the error (a
    /// JS `Error`) in another, `undefined` when the promise resolved.
    fn await_settled(&mut self, expr: &Expr, inner: &Expr, keep: bool) -> (Option<String>, String) {
        let value_ty = match self.ck.types.get(&expr.id) {
            Some(Ty::Result(ok, _)) => (**ok).clone(),
            _ => Ty::Unknown,
        };
        let promise = self.expr(inner);
        let value = (keep && value_ty != Ty::Unit).then(|| self.temp());
        let error = self.temp();
        if let Some(value) = &value {
            let ts = self.ts_type(&value_ty);
            self.push_stmt(Frag::of(format!("let {value}!: {ts};")));
        }
        self.push_stmt(Frag::of(format!("let {error}: Error | undefined;")));
        let assign = value.as_ref().map_or_else(String::new, |v| format!("{v} = "));
        self.try_await(expr.span, promise, &assign, ";", &format!("{error} = {TO_ERROR};"));
        (value, error)
    }

    /// `try { <before>await promise<after> } catch ($error) { <caught> }`.
    fn try_await(&mut self, span: Span, promise: Frag, before: &str, after: &str, caught: &str) {
        let mut line = Frag::at(span, "try {\n");
        line.s(before).s("await ").f(promise).s(after).s(&format!("\n}} catch ($error) {{\n{caught}\n}}"));
        self.push_stmt(line);
    }

    fn expr(&mut self, expr: &Expr) -> Frag {
        let mut out = Frag::default();
        out.mark(expr.span);
        out.f(self.expr_inner(expr));
        // A struct passed as a record type with fewer fields: named, so TS does not refuse
        // its other fields as excess properties of a fresh literal (the checker proved it fits).
        if self.ck.widened.contains(&expr.id) && !self.bufs.is_empty() {
            let name = self.temp();
            let mut stmt = Frag::of(format!("const {name} = "));
            stmt.f(out).s(";");
            self.push_stmt(stmt);
            return Frag::of(name);
        }
        // A `Foreign` value where Bloom expects a type: TypeScript checks it is one.
        if let Some(ty) = self.ck.foreign_checks.get(&expr.id).cloned() {
            let ty = self.ts_type(&ty);
            if ty != "unknown" {
                // `satisfies` binds tighter than an operator: `((a || b) satisfies T)`.
                if matches!(expr.kind, ExprKind::Binary(..) | ExprKind::Ternary(..)) {
                    return out.wrap("((", &format!(") satisfies {ty})"));
                }
                return out.wrap("(", &format!(" satisfies {ty})"));
            }
        }
        out
    }

    fn expr_inner(&mut self, expr: &Expr) -> Frag {
        match &expr.kind {
            ExprKind::Error => Frag::of("undefined"),
            ExprKind::Int(v) => Frag::of(v.to_string()),
            ExprKind::Float(v) => {
                Frag::of(if v.fract() == 0.0 && v.is_finite() { format!("{v:.1}") } else { v.to_string() })
            }
            ExprKind::Bool(v) => Frag::of(v.to_string()),
            ExprKind::None | ExprKind::Unit => Frag::of("undefined"),
            ExprKind::Task(block) => {
                let saved = std::mem::replace(&mut self.conditional, 0);
                let body = self.block_body(&block.stmts, Tail::Discard, None);
                self.conditional = saved;
                body.wrap("void (async () => ", ")()")
            }
            ExprKind::Str { parts, .. } => self.string(parts),
            // `x != none` narrowed `x` in its block: the narrowed name reads as this one does.
            ExprKind::Name(_) if self.ck.narrowed.contains_key(&expr.id) => {
                let (narrowed, original) = self.ck.narrowed[&expr.id];
                let text = self.local_name(original);
                self.aliases.insert(narrowed, text.clone());
                Frag::of(text)
            }
            // `import("./X")`, a dynamic import.
            ExprKind::Name(name) if name == "import" && !self.ck.names.contains_key(&expr.id) => {
                Frag::of("import")
            }
            ExprKind::Name(_) => match self.ck.names.get(&expr.id) {
                Some(NameRes::Local(local)) if self.ck.ref_objects.contains(&expr.id) => {
                    Frag::of(js_name(&self.ck.locals[*local].name))
                }
                Some(NameRes::Local(local))
                    if self.ck.locals[*local].kind == LocalKind::Ref && self.is_view_ref(*local) =>
                {
                    Frag::of(format!("({} ?? undefined)", self.local_name(*local)))
                }
                Some(NameRes::Local(local)) => Frag::of(self.local_name(*local)),
                _ => Frag::of("undefined"),
            },
            ExprKind::ImplicitMember(name) => Frag::of(string_literal(&name.name)),
            ExprKind::Binding(path) => {
                let Some((local, fields)) = self.ck.bindings.get(&expr.id).cloned() else {
                    return Frag::of("undefined");
                };
                let name = self.local_name(local);
                let setter = self.setter(local);
                if fields.is_empty() {
                    return Frag::of(format!("[{name}, {setter}] as const"));
                }
                let ty = match self.ck.types.get(&expr.id) {
                    Some(Ty::Binding(t)) => self.ts_type(t),
                    _ => "unknown".into(),
                };
                let _ = path;
                let new = updated(&name, &fields, Frag::of("value"));
                let mut out = Frag::of(format!(
                    "[{}, (value: {ty}) => {setter}(({name}) => (",
                    field_path(&name, &fields)
                ));
                out.f(new).s("))] as const");
                out
            }
            ExprKind::TypeApply { .. } => Frag::of("undefined"),
            ExprKind::KeyPath { path, .. } => {
                Frag::of(path.first().map_or_else(|| "undefined".into(), |f| string_literal(&f.name)))
            }
            ExprKind::Paren(inner) => self.expr(inner).wrap("(", ")"),
            ExprKind::Tuple(items) if items.is_empty() => Frag::of("undefined"),
            ExprKind::Tuple(items) => {
                let items: Vec<Frag> = items.iter().map(|i| self.expr(i)).collect();
                Frag::join(items, ", ").wrap("[", "] as const")
            }
            ExprKind::Spread(inner) => self.operand(inner).wrap("...", ""),
            ExprKind::Is(subject, _) => {
                let value = self.operand(subject);
                if let Some((narrowed, _)) = self.ck.narrowed.get(&expr.id) {
                    self.aliases.insert(*narrowed, value.text.clone());
                }
                let test = match self.ck.is_tests.get(&expr.id) {
                    Some(Ty::Str) => "typeof {} === \"string\"",
                    Some(Ty::Bool) => "typeof {} === \"boolean\"",
                    Some(Ty::Int) => "typeof {} === \"number\" && Number.isInteger({})",
                    Some(Ty::List(_)) => "Array.isArray({})",
                    _ => "typeof {} === \"number\"",
                };
                Frag::of(format!("({})", test.replace("{}", &value.text)))
            }
            ExprKind::List(items) => {
                let items: Vec<Frag> = items.iter().map(|i| self.expr(i)).collect();
                let list = Frag::join(items, ", ").wrap("[", "]");
                if self.options.dev { list.wrap("Object.freeze(", ")") } else { list }
            }
            ExprKind::Record(entries) => match self.ck.calls.get(&expr.id) {
                Some(CallRes::Struct(def)) => self.construct(&record_call(expr.span, entries), *def, false),
                Some(CallRes::Partial(def)) => self.construct(&record_call(expr.span, entries), *def, true),
                _ => {
                    let entries: Vec<Frag> = entries
                        .iter()
                        .map(|entry| match entry {
                            RecordEntry::Field { key, value } => {
                                let mut out = Frag::at(key.span, prop_key(&key.name));
                                out.s(": ").f(self.expr(value));
                                out
                            }
                            RecordEntry::Spread(value) => {
                                let mut out = Frag::of("...");
                                out.f(self.operand(value));
                                out
                            }
                        })
                        .collect();
                    if entries.is_empty() {
                        Frag::of("{}")
                    } else {
                        Frag::join(entries, ", ").wrap("{ ", " }")
                    }
                }
            },
            ExprKind::Map(entries) => {
                let entries: Vec<Frag> = entries
                    .iter()
                    .map(|(k, v)| {
                        let key = match &k.kind {
                            ExprKind::Str { parts, .. }
                                if parts.iter().all(|p| matches!(p, StrPart::Text(_))) =>
                            {
                                Frag::of(string_literal(&plain_text(parts)))
                            }
                            _ => self.expr(k).wrap("[", "]"),
                        };
                        let mut entry = key;
                        entry.s(": ").f(self.expr(v));
                        entry
                    })
                    .collect();
                if entries.is_empty() { Frag::of("{}") } else { Frag::join(entries, ", ").wrap("{ ", " }") }
            }
            ExprKind::Unary(op, operand) => {
                let mut out = Frag::of(if *op == UnaryOp::Not { "!" } else { "-" });
                out.f(self.operand(operand));
                out
            }
            ExprKind::Binary(op, lhs, rhs) => self.binary(*op, lhs, rhs, expr),
            ExprKind::Ternary(cond, then, otherwise) => {
                let test = self.operand(cond);
                let then = self.conditional(|this| this.operand(then));
                let otherwise = self.conditional(|this| this.operand(otherwise));
                let ty = self.expr_ty(expr);
                self.select(
                    vec![
                        Choice { test: Some((Vec::new(), test)), value: then },
                        Choice { test: None, value: otherwise },
                    ],
                    &ty,
                    false,
                )
            }
            ExprKind::Await(inner) => match self.ck.awaits.get(&expr.id) {
                // A `Result` that escapes (bound, passed, returned): built in place.
                Some(AwaitRes::Ts) => {
                    let ty = self.ck.types.get(&expr.id).cloned().unwrap_or(Ty::Unknown);
                    let ts = self.ts_type(&ty);
                    let promise = self.expr(inner);
                    let name = self.temp();
                    self.push_stmt(Frag::of(format!("let {name}: {ts};")));
                    self.try_await(
                        expr.span,
                        promise,
                        &format!("{name} = {{ ok: true, value: "),
                        " };",
                        &format!("{name} = {{ ok: false, error: {TO_ERROR} }};"),
                    );
                    Frag::of(name)
                }
                _ => self.expr(inner).wrap("await (", ")"),
            },
            ExprKind::Try(inner) => self.try_expr(expr, inner),
            ExprKind::Throwing(TryKind::Plain | TryKind::Force, inner) => self.expr(inner),
            // `try? f()`: its value, or `undefined` when it throws.
            ExprKind::Throwing(TryKind::Optional, inner) => {
                let value = self.expr(inner);
                let (open, close) =
                    if expr_awaits(inner) { ("(await (async () => ", ")())") } else { ("(() => ", ")()") };
                let mut out = Frag::of(open);
                out.s("{\ntry {\nreturn ").f(value).s(";\n} catch {\nreturn undefined;\n}\n}").s(close);
                out
            }
            // A chain narrowed present: TS does not keep a property's narrowing in a closure.
            ExprKind::Field(object, name) if self.ck.narrowed_paths.contains(&expr.id) => {
                let mut out = self.field(expr, object, name);
                out.s("!");
                out
            }
            ExprKind::Field(object, name) => self.field(expr, object, name),
            ExprKind::OptField(object, name) => {
                let mut out = self.operand(object);
                out.s("?.").s(&name.name);
                if self.ck.narrowed_paths.contains(&expr.id) {
                    out.s("!");
                }
                out
            }
            ExprKind::Index(object, index) => {
                let mut out = self.operand(object);
                out.s("[").f(self.expr(index)).s("]");
                out
            }
            ExprKind::Call(call) => self.call(expr, call),
            ExprKind::Closure(_)
                if matches!(self.ck.calls.get(&expr.id), Some(CallRes::Struct(_) | CallRes::Partial(_))) =>
            {
                match self.ck.calls.get(&expr.id) {
                    Some(CallRes::Struct(def)) => self.construct(&record_call(expr.span, &[]), *def, false),
                    Some(CallRes::Partial(def)) => self.construct(&record_call(expr.span, &[]), *def, true),
                    _ => unreachable!("matched above"),
                }
            }
            ExprKind::Closure(c) => self.closure(c),
            ExprKind::If(if_expr) => self.if_value(expr, if_expr),
            ExprKind::Match(m) => self.match_value(expr, m),
        }
    }

    fn string(&mut self, parts: &[StrPart]) -> Frag {
        if parts.iter().all(|p| matches!(p, StrPart::Text(_))) {
            return Frag::of(string_literal(&plain_text(parts)));
        }
        let mut out = Frag::of("`");
        for part in parts {
            match part {
                StrPart::Text(text) => {
                    out.s(&text.replace('\\', "\\\\").replace('`', "\\`").replace("${", "\\${"));
                }
                StrPart::Interp(inner) => {
                    out.s("${").f(self.expr(inner)).s("}");
                }
            }
        }
        out.s("`");
        out
    }

    fn binary(&mut self, op: BinaryOp, lhs: &Expr, rhs: &Expr, expr: &Expr) -> Frag {
        // A TS value against `none`: TS's absence may be `null` too (`text.match(re) != none`).
        if matches!(op, BinaryOp::Eq | BinaryOp::Ne) {
            let foreign = |e: &Expr| matches!(self.ck.types.get(&e.id), Some(Ty::Foreign(_)));
            let value = match (&lhs.kind, &rhs.kind) {
                (_, ExprKind::None) if foreign(lhs) => Some(lhs),
                (ExprKind::None, _) if foreign(rhs) => Some(rhs),
                _ => None,
            };
            if let Some(value) = value {
                let mut out = self.operand(value);
                out.s(if op == BinaryOp::Eq { " == null" } else { " != null" });
                return out;
            }
        }
        if let Some(ty) = self.ck.structural.get(&expr.id).cloned() {
            // Field by field, on paths: an operand that is not one is read once, into a temp.
            let a = self.path_or_temp(lhs);
            let b = self.path_or_temp(rhs);
            let same = self.equal(&a, &b, &ty, &mut Vec::new());
            return if op == BinaryOp::Ne { Frag::of(format!("!({same})")) } else { Frag::of(same) };
        }
        let left = self.operand(lhs);
        let right = if matches!(op, BinaryOp::And | BinaryOp::Or | BinaryOp::Default) {
            let (stmts, right) = self.conditional(|this| this.operand(rhs));
            if !stmts.is_empty() {
                // `a && b` where `b` needs statements: `a`, then `b` only when it is needed.
                let name = self.temp();
                let ty = match op {
                    BinaryOp::Default => {
                        let ty = self.expr_ty(lhs);
                        self.ts_type(&ty)
                    }
                    _ => "boolean".into(),
                };
                let mut line = Frag::of(format!("let {name}: {ty} = "));
                line.f(left).s(";");
                self.push_stmt(line);
                let test = match op {
                    BinaryOp::And => name.clone(),
                    BinaryOp::Or => format!("!{name}"),
                    _ => format!("{name} === undefined"),
                };
                let mut line = Frag::of(format!("if ({test}) {{\n"));
                for s in stmts {
                    line.f(s).s("\n");
                }
                line.s(&format!("{name} = ")).f(right).s(";\n}");
                self.push_stmt(line);
                return Frag::of(name);
            }
            right
        } else {
            self.operand(rhs)
        };
        let text = match op {
            BinaryOp::Eq => "===",
            BinaryOp::Ne => "!==",
            other => other.text(),
        };
        let mut out = left;
        out.s(&format!(" {text} ")).f(right);
        // Integer division truncates toward zero (spec 4.3).
        if op == BinaryOp::Div && matches!(self.ck.types.get(&expr.id), Some(Ty::Int)) {
            return out.wrap("Math.trunc(", ")");
        }
        out
    }

    fn try_expr(&mut self, expr: &Expr, inner: &Expr) -> Frag {
        if self.ck.tries.get(&expr.id) == Some(&TryRes::Throw) {
            // A rejected TS promise rejects (or is caught) as it is.
            let mut awaited_expr = inner;
            while let ExprKind::Paren(e) = &awaited_expr.kind {
                awaited_expr = e;
            }
            if let ExprKind::Await(awaited) = &awaited_expr.kind
                && self.ck.awaits.get(&awaited_expr.id) == Some(&AwaitRes::Ts)
            {
                let mut out = Frag::at(expr.span, "(await ");
                out.f(self.operand(awaited)).s(")");
                return out;
            }
            let name = self.temp();
            let value = self.expr(inner);
            let mut line = Frag::at(expr.span, format!("const {name} = "));
            line.f(value).s(";");
            self.push_stmt(line);
            self.push_stmt(Frag::of(format!("if (!{name}.ok) throw {name}.error;")));
            return Frag::of(format!("{name}.value"));
        }
        if self.conditional > 0 {
            self.diagnostics.push(
                Diagnostic::error("B0220", expr.span, "`?` here would return early from inside a condition")
                    .label("evaluated only sometimes")
                    .help("bind it first: `let value = f()?`, then use `value`")
                    .spec("45-enums-option-and-result"),
            );
            return Frag::of("undefined");
        }
        // `await promise?`: the error returns from inside the `catch`.
        if let ExprKind::Await(awaited) = &inner.kind
            && self.ck.awaits.get(&inner.id) == Some(&AwaitRes::Ts)
        {
            let value_ty = self.ck.types.get(&expr.id).cloned().unwrap_or(Ty::Unknown);
            let promise = self.expr(awaited);
            let caught = format!("return {{ ok: false, error: {TO_ERROR} }};");
            if value_ty == Ty::Unit {
                self.try_await(expr.span, promise, "", ";", &caught);
                return Frag::of("undefined");
            }
            let name = self.temp();
            let ts = self.ts_type(&value_ty);
            self.push_stmt(Frag::of(format!("let {name}: {ts};")));
            self.try_await(expr.span, promise, &format!("{name} = "), ";", &caught);
            return Frag::of(name);
        }
        let name = self.temp();
        let value = self.expr(inner);
        let mut line = Frag::at(expr.span, format!("const {name} = "));
        line.f(value).s(";");
        self.push_stmt(line);
        match self.ck.tries.get(&expr.id) {
            Some(TryRes::Option) => {
                self.push_stmt(Frag::of(format!("if ({name} === undefined) return undefined;")));
                Frag::of(name)
            }
            _ => {
                self.push_stmt(Frag::of(format!("if (!{name}.ok) return {name};")));
                Frag::of(format!("{name}.value"))
            }
        }
    }

    fn field(&mut self, expr: &Expr, object: &Expr, name: &Ident) -> Frag {
        match self.ck.fields.get(&expr.id).cloned() {
            Some(FieldRes::EnumCase(def, index)) => {
                Frag::of(string_literal(&self.ck.defs[def].variants()[index].name))
            }
            Some(FieldRes::TaskSignal) => Frag::of(self.signal.clone().unwrap_or_else(|| "undefined".into())),
            Some(FieldRes::TaskCancelled) => {
                Frag::of(self.signal.as_ref().map_or_else(|| "false".into(), |s| format!("{s}.aborted")))
            }
            Some(FieldRes::Index(index)) => {
                let mut out = self.operand(object);
                out.s(&format!("[{index}]"));
                out
            }
            Some(FieldRes::Prop { recv, name: prop }) => {
                let object = self.operand(object);
                match (recv, prop) {
                    (Recv::Str | Recv::List, "count") => member(object, "length"),
                    (Recv::Str | Recv::List, "isEmpty") => member(object, "length").wrap("(", " === 0)"),
                    (Recv::List, "first") => {
                        let mut out = object;
                        out.s("[0]");
                        out
                    }
                    (Recv::List, "last") => {
                        let mut out = object;
                        out.s(".at(-1)");
                        out
                    }
                    (Recv::Map, "count") => object.wrap("Object.keys(", ").length"),
                    (Recv::Map, "isEmpty") => object.wrap("(Object.keys(", ").length === 0)"),
                    (Recv::Map, "keys") => object.wrap("Object.keys(", ")"),
                    (Recv::Map, "values") => object.wrap("Object.values(", ")"),
                    (Recv::Map, "entries") => object.wrap("Object.entries(", ")"),
                    (Recv::JsMap | Recv::Set, "count") => member(object, "size"),
                    (Recv::JsMap | Recv::Set, "isEmpty") => member(object, "size").wrap("(", " === 0)"),
                    (Recv::JsMap | Recv::Set, "keys" | "values" | "entries") => {
                        object.wrap("[...", &format!(".{prop}()]"))
                    }
                    (Recv::Result, _) => member(object, "ok"),
                    _ => member(object, prop),
                }
            }
            _ => {
                let object = self.operand(object);
                member(object, &name.name)
            }
        }
    }

    fn if_value(&mut self, expr: &Expr, if_expr: &IfExpr) -> Frag {
        if self.simple_if(if_expr) {
            let Cond::Expr(cond) = &if_expr.cond else { unreachable!() };
            let [Stmt { kind: StmtKind::Expr(then), .. }] = if_expr.then.stmts.as_slice() else {
                unreachable!()
            };
            let test = self.operand(cond);
            let then = self.conditional(|this| this.operand(then));
            let otherwise = match if_expr.otherwise.as_deref() {
                Some(Else::Block(b)) => {
                    let [Stmt { kind: StmtKind::Expr(e), .. }] = b.stmts.as_slice() else { unreachable!() };
                    self.conditional(|this| this.operand(e))
                }
                Some(Else::If(e)) => self.conditional(|this| this.expr(e)),
                None => (Vec::new(), Frag::of("undefined")),
            };
            let ty = self.expr_ty(expr);
            return self.select(
                vec![
                    Choice { test: Some((Vec::new(), test)), value: then },
                    Choice { test: None, value: otherwise },
                ],
                &ty,
                false,
            );
        }
        let name = self.temp();
        let ty = self.ck.types.get(&expr.id).cloned().unwrap_or(Ty::Unknown);
        let ts = self.ts_type(&ty);
        self.push_stmt(Frag::of(format!("let {name}: {ts};")));
        self.if_stmt(if_expr, &Tail::Bind(name.clone()));
        Frag::of(name)
    }

    fn match_value(&mut self, expr: &Expr, m: &MatchExpr) -> Frag {
        if self.simple_match(m) {
            let subject = self.expr(&m.scrutinee).text;
            let mut choices = Vec::new();
            let count = m.arms.len();
            for (index, arm) in m.arms.iter().enumerate() {
                let ArmBody::Expr(body) = &arm.body else { unreachable!() };
                let mut tests = self.pattern_test(&arm.pattern, &subject);
                if let Some(guard) = &arm.guard {
                    tests.push(self.operand(guard).text);
                }
                let value = self.conditional(|this| this.operand(body));
                let test = (index + 1 < count || arm.guard.is_some()).then(|| {
                    (
                        Vec::new(),
                        Frag::of(if tests.is_empty() { "true".to_string() } else { tests.join(" && ") }),
                    )
                });
                choices.push(Choice { test, value });
            }
            if m.arms.last().is_some_and(|a| a.guard.is_some()) {
                choices.push(Choice { test: None, value: (Vec::new(), Frag::of("undefined")) });
            }
            let ty = self.expr_ty(expr);
            let out = self.select(choices, &ty, true);
            return if out.text.starts_with('$') { out } else { out.wrap("(", ")") };
        }
        let name = self.temp();
        let ty = self.ck.types.get(&expr.id).cloned().unwrap_or(Ty::Unknown);
        let ts = self.ts_type(&ty);
        self.push_stmt(Frag::of(format!("let {name}: {ts};")));
        self.match_stmt(m, &Tail::Bind(name.clone()));
        Frag::of(name)
    }

    /// A closure; one that reads nothing of its view or function is a module constant.
    fn closure(&mut self, c: &Closure) -> Frag {
        let Some(info) = self.ck.closures.get(&c.span).cloned() else { return Frag::of("undefined") };
        if let Some(name) = self.hoisted_names.get(&c.span).cloned() {
            return Frag::of(name);
        }
        let params: Vec<String> = c
            .params
            .iter()
            .zip(&info.params)
            .map(|(p, local)| {
                let ty = self.ck.locals[*local].ty.clone();
                match ty {
                    Ty::Foreign(ref path) if path.is_empty() => js_name(&p.name.name),
                    // A view: where it is passed says which (TS's `V extends ViewModifiers<V>`).
                    Ty::Var(_) | Ty::Unknown | Ty::View(None) => js_name(&p.name.name),
                    _ => format!("{}: {}", js_name(&p.name.name), self.ts_type(&ty)),
                }
            })
            .collect();
        // A parameter without a TS type takes its type from where the closure is passed.
        let contextual = c.params.iter().zip(&params).any(|(p, text)| *text == js_name(&p.name.name));
        let params: Vec<String> = if c.tuple && std::mem::take(&mut self.enumerated) && c.params.len() == 2 {
            // `xs.enumerated().map { (i, x) in … }` is `xs.map((x, i) => …)`.
            vec![params[1].clone(), params[0].clone()]
        } else if c.tuple {
            let names: Vec<String> = c.params.iter().map(|p| js_name(&p.name.name)).collect();
            let types: Vec<String> =
                info.params
                    .iter()
                    .map(|l| self.ck.locals[*l].ty.clone())
                    .map(|t| {
                        if matches!(t, Ty::Var(_) | Ty::Unknown) {
                            "unknown".into()
                        } else {
                            self.ts_type(&t)
                        }
                    })
                    .collect();
            vec![format!("[{}]: readonly [{}]", names.join(", "), types.join(", "))]
        } else {
            params
        };
        let tail = if info.ret == Ty::Unit || matches!(info.ret, Ty::Var(_) | Ty::Unknown) {
            Tail::Discard
        } else {
            Tail::Return
        };
        let saved_conditional = std::mem::replace(&mut self.conditional, 0);
        let body = match (c.body.as_slice(), &tail) {
            // `{ x in x + 1 }`: an expression body.
            ([Stmt { kind: StmtKind::Expr(e), .. }], _)
                if !matches!(e.kind, ExprKind::If(_) | ExprKind::Match(_)) =>
            {
                self.bufs.push(Vec::new());
                let value = self.expr(e);
                let stmts = self.bufs.pop().expect("the closure");
                if stmts.is_empty() {
                    if matches!(e.kind, ExprKind::Map(_) | ExprKind::Record(_)) {
                        value.wrap("(", ")")
                    } else {
                        value
                    }
                } else {
                    let mut out = Frag::of("{\n");
                    for s in stmts {
                        out.f(s).s("\n");
                    }
                    if matches!(tail, Tail::Return) {
                        out.s("return ").f(value).s(";\n}");
                    } else {
                        out.f(value).s(";\n}");
                    }
                    out
                }
            }
            _ => self.block_body(&c.body, tail, None),
        };
        self.conditional = saved_conditional;
        let mut out = Frag::at(c.span, if info.is_async { "async " } else { "" });
        out.s(&format!("({}) => ", params.join(", "))).f(body);
        // A closure that reads no local of its surroundings is built once, at module scope.
        if self.view.is_some() && !contextual && self.reads_only_module(c) {
            let name = format!("$fn{}", self.hoisted.len() + self.hoisted_names.len());
            let mut decl = Frag::of(format!("const {name} = "));
            decl.f(out).s(";");
            self.hoisted.push(decl);
            self.hoisted_names.insert(c.span, name.clone());
            return Frag::of(name);
        }
        out
    }

    /// Whether every name `c` reads is its own or the module's.
    fn reads_only_module(&self, c: &Closure) -> bool {
        let mut only = true;
        let inner: HashSet<LocalId> =
            self.ck.closures.get(&c.span).map(|i| i.params.iter().copied().collect()).unwrap_or_default();
        crate::check::walk_stmts(&c.body, &mut |_, id| {
            if let Some(NameRes::Local(local)) = self.ck.names.get(&id) {
                let info = &self.ck.locals[*local];
                let module = matches!(
                    info.kind,
                    LocalKind::ModuleFn
                        | LocalKind::ModuleConst
                        | LocalKind::View
                        | LocalKind::Import { .. }
                        | LocalKind::Component { .. }
                ) && info.frame == 0;
                let own =
                    inner.contains(local) || info.span.start >= c.span.start && info.span.end <= c.span.end;
                if !module && !own {
                    only = false;
                }
            } else if self.ck.bindings.contains_key(&id) {
                only = false;
            }
        });
        // Assignments write states: their setters are the view's.
        only && !stmts_assign(&c.body)
    }

    // ---- calls --------------------------------------------------------------

    fn args(&mut self, call: &Call) -> Vec<Frag> {
        call.args.iter().map(|a| self.expr(&a.value)).collect()
    }

    /// `xs` when `expr` is `xs.enumerated()`.
    fn enumerated_list<'e>(&self, expr: &'e Expr) -> Option<&'e Expr> {
        let ExprKind::Call(call) = &expr.kind else { return None };
        if !matches!(
            self.ck.calls.get(&expr.id),
            Some(CallRes::Method { recv: Recv::List, name: "enumerated" })
        ) {
            return None;
        }
        match &call.callee.kind {
            ExprKind::Field(list, _) => Some(list),
            _ => None,
        }
    }

    /// A positional argument; `..xs` into a rest parameter is `...xs`.
    fn spread_arg(&mut self, arg: &Arg) -> Frag {
        let value = self.expr(&arg.value);
        if arg.spread { value.wrap("...", "") } else { value }
    }

    fn call(&mut self, expr: &Expr, call: &Call) -> Frag {
        if self.hoistable(expr) {
            return self.hoist(expr);
        }
        let open = if call.optional { "?.(" } else { "(" };
        let Some(res) = self.ck.calls.get(&expr.id).cloned() else {
            let callee = self.operand(&call.callee);
            let mut out = callee;
            out.f(Frag::join(self.args(call), ", ").wrap(open, ")"));
            return out;
        };
        match res {
            CallRes::Bloom { order, rest } => {
                let mut values: Vec<Frag> = order
                    .iter()
                    .map(|slot| match slot {
                        Some(i) if *i == call.args.len() => {
                            self.closure(call.trailing.as_ref().expect("a trailing closure"))
                        }
                        Some(i) => self.expr(&call.args[*i].value),
                        None => Frag::of("undefined"),
                    })
                    .collect();
                while rest.is_empty()
                    && values.last().is_some_and(|v| v.text == "undefined")
                    && order.last().is_some_and(Option::is_none)
                {
                    values.pop();
                    if values.len() < order.len() && order[values.len()].is_some() {
                        break;
                    }
                }
                if !rest.is_empty() {
                    // The rest parameter's slot is the last; its arguments follow the others.
                    values.truncate(order.len().saturating_sub(1));
                    for &index in &rest {
                        values.push(self.spread_arg(&call.args[index]));
                    }
                }
                let mut out = self.operand(&call.callee);
                out.f(Frag::join(values, ", ").wrap(open, ")"));
                out
            }
            CallRes::Ts => {
                let mut values: Vec<Frag> =
                    call.args.iter().filter(|a| a.label.is_none()).map(|a| self.spread_arg(a)).collect();
                let named: Vec<Frag> = call
                    .args
                    .iter()
                    .filter_map(|a| a.label.as_ref().map(|l| (l, a)))
                    .map(|(label, a)| {
                        let mut entry = Frag::of(format!("{}: ", prop_key(&label.name)));
                        entry.f(self.expr(&a.value));
                        entry
                    })
                    .collect();
                if !named.is_empty() {
                    values.push(Frag::join(named, ", ").wrap("{ ", " }"));
                }
                if let Some(trailing) = &call.trailing {
                    values.push(self.closure(trailing));
                }
                let mut out = self.operand(&call.callee);
                if matches!(self.ck.names.get(&call.callee.id), Some(NameRes::Local(l)) if self.ck.constructors.contains(l))
                {
                    out = out.wrap("new ", "");
                }
                out.f(Frag::join(values, ", ").wrap(open, ")"));
                out
            }
            CallRes::Collection(ty) => {
                let types = match &ty {
                    Ty::JsMap(k, v) => format!("Map<{}, {}>", self.ts_type(k), self.ts_type(v)),
                    Ty::Set(t) => format!("Set<{}>", self.ts_type(t)),
                    _ => "Map".into(),
                };
                let mut out = Frag::at(call.callee.span, format!("new {types}("));
                if let Some(arg) = call.args.first() {
                    out.f(self.expr(&arg.value));
                }
                out.s(")");
                out
            }
            CallRes::Struct(def) => self.construct(call, def, false),
            CallRes::Partial(def) => self.construct(call, def, true),
            CallRes::Keyed { partial } => {
                let mut out = Frag::of("{ ");
                if !partial {
                    let ExprKind::Field(object, _) = &call.callee.kind else { unreachable!() };
                    out.s("...").f(self.operand(object)).s(", ");
                }
                out.s("[")
                    .f(self.expr(&call.args[0].value))
                    .s("]: ")
                    .f(self.expr(&call.args[1].value))
                    .s(" }");
                out
            }
            CallRes::With(_) => {
                let ExprKind::Field(object, _) = &call.callee.kind else { unreachable!() };
                let mut out = Frag::of("{ ...");
                out.f(self.operand(object));
                for arg in &call.args {
                    if let Some(label) = &arg.label {
                        out.s(&format!(", {}: ", prop_key(&label.name))).f(self.expr(&arg.value));
                    }
                }
                out.s(" }");
                out
            }
            CallRes::EnumCase(def, index) => {
                let variant = self.ck.defs[def].variants()[index].clone();
                let mut out = Frag::of(format!("{{ tag: {} as const", string_literal(&variant.name)));
                for (position, arg) in call.args.iter().enumerate() {
                    let slot = match &arg.label {
                        Some(label) => variant
                            .payload
                            .iter()
                            .position(|(n, _)| n.as_deref() == Some(label.name.as_str()))
                            .unwrap_or(position),
                        None => position,
                    };
                    out.s(&format!(", {}: ", prop_key(&variant.key(slot)))).f(self.expr(&arg.value));
                }
                if let Some(trailing) = &call.trailing {
                    out.s(&format!(", {}: ", prop_key(&variant.key(call.args.len()))))
                        .f(self.closure(trailing));
                }
                out.s(" }");
                out
            }
            CallRes::Node(ctor) => {
                self.import_name(bloom_language_compiler::entries::module_of(ctor), ctor);
                let mut values: Vec<Frag> = call.args.iter().map(|a| self.node_arg(&a.value)).collect();
                if let Some(trailing) = &call.trailing {
                    // A trailing `for` fills a rest parameter as its parent's own children.
                    let rest = crate::ui::signature(ctor).last().is_some_and(|p| p.starts_with("..."));
                    values.extend(self.children_spreading(&trailing.body, rest));
                }
                let mut out = Frag::at(call.callee.span, ctor);
                out.f(Frag::join(values, ", ").wrap("(", ")"));
                out
            }
            CallRes::Modifier { object } => {
                let ExprKind::Field(receiver, name) = &call.callee.kind else { unreachable!() };
                let receiver = self.operand(receiver);
                let mut values: Vec<Frag> =
                    call.args.iter().filter(|a| a.label.is_none()).map(|a| self.node_arg(&a.value)).collect();
                if object {
                    let entries: Vec<Frag> = call
                        .args
                        .iter()
                        .filter_map(|a| a.label.as_ref().map(|l| (l, a)))
                        .map(|(label, a)| {
                            let mut entry = Frag::of(format!("{}: ", prop_key(&label.name)));
                            entry.f(self.expr(&a.value));
                            entry
                        })
                        .collect();
                    values.push(Frag::join(entries, ", ").wrap("{ ", " }"));
                }
                if let Some(trailing) = &call.trailing {
                    if self.ck.closures.get(&trailing.span).is_some_and(|c| c.builder) {
                        values.extend(self.children(&trailing.body));
                    } else {
                        values.push(self.closure(trailing));
                    }
                }
                let mut out = receiver;
                out.s(".").mark(name.span).s(&name.name).f(Frag::join(values, ", ").wrap("(", ")"));
                out
            }
            // A task or an `.onChange` runs in an effect of its view: the chain is its receiver.
            CallRes::Task | CallRes::OnChange(_) => {
                let ExprKind::Field(receiver, _) = &call.callee.kind else { unreachable!() };
                self.expr(receiver)
            }
            CallRes::View { params, trailing } => {
                let order = self.view_order(call, &params, trailing.as_deref());
                let entries: Vec<Frag> = order
                    .into_iter()
                    .map(|(name, arg)| {
                        let mut entry = Frag::of(if name.is_empty() {
                            "...".to_string()
                        } else {
                            format!("{}: ", prop_key(&name))
                        });
                        entry.f(arg);
                        entry
                    })
                    .collect();
                let mut out = self.operand(&call.callee);
                if entries.is_empty() {
                    out.s("()");
                } else {
                    out.f(Frag::join(entries, ", ").wrap("({ ", " })"));
                }
                out
            }
            CallRes::Component => {
                self.import_name(LANGUAGE, "Embed");
                self.import_name("react/jsx-runtime", "jsx as $jsx");
                self.type_imports.entry("react".into()).or_default().insert("ComponentProps".into());
                let component = self.expr(&call.callee);
                let mut props: Vec<Frag> = call
                    .args
                    .iter()
                    .filter(|a| a.label.is_some() || a.spread)
                    .map(|a| {
                        let mut entry = match &a.label {
                            Some(label) => Frag::of(format!("{}: ", prop_key(&label.name))),
                            None => Frag::of("..."),
                        };
                        entry.f(self.expr(&a.value));
                        entry
                    })
                    .collect();
                let children = call.trailing.as_ref().map(|t| self.children(&t.body));
                if let Some(children) = &children {
                    let rendered = if children.len() == 1 {
                        children[0].clone()
                    } else {
                        Frag::join(children.clone(), ", ").wrap("[", "]")
                    };
                    props.push(rendered.wrap("children: $render(", ")"));
                }
                let object =
                    if props.is_empty() { Frag::of("{}") } else { Frag::join(props, ", ").wrap("{ ", " }") };
                let mut element = Frag::of("$jsx(");
                element
                    .f(component.clone())
                    .s(", ")
                    .f(object)
                    .s(" satisfies ComponentProps<typeof ")
                    .f(component)
                    .s(">)");
                if children.is_some() {
                    element.wrap("Embed(($render) => ", ")")
                } else {
                    element.wrap("Embed(", ")")
                }
            }
            CallRes::Method { recv, name } => self.method(call, recv, name),
            CallRes::Ok | CallRes::Err => {
                self.uses_result = true;
                let value = call.args.first().map_or(Frag::of("undefined"), |a| self.expr(&a.value));
                let mut out = Frag::of(if res == CallRes::Ok {
                    "{ ok: true as const, value: "
                } else {
                    "{ ok: false as const, error: "
                });
                out.f(value).s(" }");
                out
            }
            CallRes::Toast | CallRes::Navigate => {
                let (module, name) =
                    if res == CallRes::Toast { (LANGUAGE, "toast") } else { (ROUTER, "navigate") };
                self.import_name(module, name);
                let mut values: Vec<Frag> =
                    call.args.iter().filter(|a| a.label.is_none()).map(|a| self.expr(&a.value)).collect();
                let named: Vec<Frag> = call
                    .args
                    .iter()
                    .filter_map(|a| a.label.as_ref().map(|l| (l, a)))
                    .map(|(label, a)| {
                        let mut entry = Frag::of(format!("{}: ", prop_key(&label.name)));
                        entry.f(self.expr(&a.value));
                        entry
                    })
                    .collect();
                if !named.is_empty() {
                    values.push(Frag::join(named, ", ").wrap("{ ", " }"));
                }
                let mut out = Frag::at(call.callee.span, name);
                out.f(Frag::join(values, ", ").wrap("(", ")"));
                out
            }
            CallRes::Binding => {
                let values = self.args(call);
                Frag::join(values, ", ").wrap("[", "] as const")
            }
            CallRes::Math(name) => {
                let values: Vec<Frag> = call.args.iter().map(|a| self.spread_arg(a)).collect();
                let mut out = Frag::at(call.callee.span, format!("Math.{name}"));
                out.f(Frag::join(values, ", ").wrap("(", ")"));
                out
            }
            CallRes::Regex => {
                let args: Vec<Frag> = call.args.iter().map(|a| self.expr(&a.value)).collect();
                Frag::join(args, ", ").wrap("new RegExp(", ")")
            }
            CallRes::Catching => {
                self.uses_result = true;
                let ty = self.ck.types.get(&expr.id).cloned().unwrap_or(Ty::Unknown);
                let Ty::Result(value_ty, _) = &ty else { return Frag::of("undefined") };
                let ts = self.ts_type(&ty);
                let value_ts = self.ts_type(value_ty);
                let (result, value) = (self.temp(), self.temp());
                let body = call.trailing.as_deref().map_or(&[][..], |c| &c.body[..]);
                self.conditional += 1;
                let block = self.block_body(body, Tail::Bind(value.clone()), None);
                self.conditional -= 1;
                let mut line =
                    Frag::at(expr.span, format!("let {result}: {ts};\ntry {{\nlet {value}: {value_ts};\n"));
                line.f(block).s(&format!(
                    "\n{result} = {{ ok: true, value: {value} }};\n}} catch ($error) {{\n{result} = {{ ok: false, error: {TO_ERROR} }};\n}}"
                ));
                self.push_stmt(line);
                Frag::of(result)
            }
            CallRes::Parse { int } => {
                let helper = if int { "toInt" } else { "toFloat" };
                self.helpers.insert(helper);
                let value = call.args.first().map_or(Frag::of("\"\""), |a| self.expr(&a.value));
                value.wrap(&format!("${helper}("), ")")
            }
            CallRes::Fail => {
                // Where a value is needed (`c ? x : fail(e)`): a throw as an expression.
                let mut out = Frag::of("(() => { throw ");
                out.f(self.fail_value(call)).s("; })()");
                out
            }
            CallRes::Sleep => {
                let ms = call.args.first().map_or(Frag::of("0"), |a| self.expr(&a.value));
                ms.wrap("new Promise<void>((resolve) => setTimeout(resolve, ", "))")
            }
            CallRes::All | CallRes::Race => {
                let method = if res == CallRes::All { "Promise.all([" } else { "Promise.race([" };
                Frag::join(self.args(call), ", ").wrap(method, "])")
            }
        }
    }

    /// `fail(e)`'s error.
    fn fail_value(&mut self, call: &Call) -> Frag {
        call.args.first().map_or(Frag::of("new Error()"), |a| self.expr(&a.value))
    }

    /// A view call's props in parameter order.
    /// A view call's props as `(name, value)`, in the view's order; with a `..r` among
    /// them, in the order written (a spread's name is empty: `...r`), so later ones win.
    fn view_order(&mut self, call: &Call, params: &[String], trailing: Option<&str>) -> Vec<(String, Frag)> {
        let mut out = Vec::new();
        let mut next = 0;
        let mut given: HashMap<String, Frag> = HashMap::default();
        let written = call.args.iter().any(|a| a.spread);
        for arg in &call.args {
            if arg.spread && arg.label.is_none() {
                out.push((String::new(), self.operand(&arg.value)));
                continue;
            }
            let name = match &arg.label {
                Some(label) => label.name.clone(),
                None => {
                    while next < params.len() && given.contains_key(&params[next]) {
                        next += 1;
                    }
                    params.get(next).cloned().unwrap_or_default()
                }
            };
            let value = self.expr(&arg.value);
            if written {
                given.insert(name.clone(), Frag::of(""));
                out.push((name, value));
            } else {
                given.insert(name, value);
            }
        }
        if let Some(closure) = &call.trailing
            && let Some(name) =
                trailing.or_else(|| params.iter().rev().find(|p| !given.contains_key(*p)).map(|p| p.as_str()))
        {
            let value = self.closure(closure);
            if written {
                out.push((name.to_string(), value));
                return out;
            }
            given.insert(name.to_string(), value);
        }
        if written {
            return out;
        }
        for param in params {
            if let Some(value) = given.remove(param) {
                out.push((param.clone(), value));
            }
        }
        out
    }

    fn construct(&mut self, call: &Call, def: DefId, partial: bool) -> Frag {
        let fields = self.ck.defs[def].fields().to_vec();
        let given: HashMap<&str, &Expr> =
            call.args.iter().filter_map(|a| a.label.as_ref().map(|l| (l.name.as_str(), &a.value))).collect();
        let mut entries: Vec<Frag> = Vec::new();
        if partial {
            for arg in call.args.iter().filter(|a| a.spread) {
                let mut entry = Frag::of("...");
                entry.f(self.operand(&arg.value));
                entries.push(entry);
            }
        } else {
            // Each spread, in order: a struct gives every field, a patch only the
            // fields it has (`p?.likes ?? <default>`), so a field is never `undefined`.
            let mut spreads: Vec<(String, bool, bool)> = Vec::new();
            for arg in call.args.iter().filter(|a| a.spread) {
                let ty = self.ck.types.get(&arg.value.id).cloned().unwrap_or(Ty::Unknown);
                let (patch, optional) = match &ty {
                    Ty::Partial(_) => (true, false),
                    Ty::Option(inner) if matches!(**inner, Ty::Partial(_)) => (true, true),
                    _ => (false, false),
                };
                let subject = self.subject(&arg.value, &[]);
                spreads.push((subject, patch, optional));
            }
            for field in &fields {
                if given.contains_key(field.name.as_str()) {
                    continue;
                }
                let mut value = match &field.default {
                    FieldDefault::Expr(id) => self.default_expr(*id),
                    FieldDefault::Literal(text) => Some(Frag::of(text.clone())),
                    FieldDefault::Undefined | FieldDefault::None => None,
                };
                for (subject, patch, optional) in &spreads {
                    let read = format!("{subject}{}{}", if *optional { "?." } else { "." }, field.name);
                    value = Some(match (patch, value) {
                        (true, Some(fallback)) => {
                            let mut out = Frag::of(format!("{read} ?? "));
                            out.f(fallback.wrap("(", ")"));
                            out
                        }
                        _ => Frag::of(read),
                    });
                }
                if let Some(value) = value {
                    let mut entry = Frag::of(format!("{}: ", prop_key(&field.name)));
                    entry.f(value);
                    entries.push(entry);
                }
            }
        }
        for arg in &call.args {
            if let Some(label) = &arg.label {
                let mut entry = Frag::of(format!("{}: ", prop_key(&label.name)));
                entry.f(self.expr(&arg.value));
                entries.push(entry);
            }
        }
        if entries.is_empty() { Frag::of("{}") } else { Frag::join(entries, ", ").wrap("{ ", " }") }
    }

    /// A field default of a local struct, emitted where the struct is built.
    fn default_expr(&mut self, id: ExprId) -> Option<Frag> {
        let expr = self.defaults.get(&id).copied()?;
        Some(self.expr(expr))
    }

    fn method(&mut self, call: &Call, recv: Recv, name: &str) -> Frag {
        let (receiver, optional) = match &call.callee.kind {
            ExprKind::Field(receiver, _) => (receiver, false),
            ExprKind::OptField(receiver, _) => (receiver, true),
            _ => unreachable!("a method's callee is a member"),
        };
        // `x?.m(…)`: a JS method is `x?.m(…)`; any other lowering reads `x` once, then
        // runs only when it is not `none`.
        let direct = match recv {
            Recv::Str => !matches!(name, "toInt" | "toFloat"),
            Recv::List => {
                matches!(
                    name,
                    "map"
                        | "filter"
                        | "find"
                        | "reduce"
                        | "contains"
                        | "prefix"
                        | "dropFirst"
                        | "joined"
                        | "flatMap"
                        | "any"
                        | "all"
                        | "slice"
                        | "enumerated"
                )
            }
            _ => false,
        };
        // `xs.enumerated().map { (i, x) in … }`: `xs.map((x, i) => …)`, no pairs built.
        let mut receiver = receiver;
        if recv == Recv::List
            && name == "map"
            && !optional
            && call.trailing.as_ref().is_some_and(|c| c.tuple && c.params.len() == 2)
            && let ExprKind::Call(inner) = &receiver.kind
            && matches!(
                self.ck.calls.get(&receiver.id),
                Some(CallRes::Method { recv: Recv::List, name: "enumerated" })
            )
            && let ExprKind::Field(list, _) = &inner.callee.kind
        {
            receiver = list;
            self.enumerated = true;
        }
        let guard = (optional && !direct).then(|| self.path_or_temp(receiver));
        let object = match &guard {
            Some(name) => Frag::of(name.clone()),
            None => self.operand(receiver),
        };
        let lowered = self.method_lowered(call, recv, name, object, optional && direct);
        match guard {
            Some(name) => {
                let mut out = Frag::of(format!("({name} == null ? undefined : "));
                out.f(lowered).s(")");
                out
            }
            None => lowered,
        }
    }

    fn method_lowered(&mut self, call: &Call, recv: Recv, name: &str, object: Frag, optional: bool) -> Frag {
        let dot = if optional { "?." } else { "." };
        let mut args: Vec<Frag> = self.args(call);
        if let Some(trailing) = &call.trailing {
            args.push(self.closure(trailing));
        }
        // A function value passed to a JS array method would also receive the index.
        let lambda = |arg: &Frag, arity: usize| -> Frag {
            let is_closure = arg.text.contains("=>");
            if is_closure {
                return arg.clone();
            }
            let params: Vec<String> = (0..arity).map(|i| format!("v{i}")).collect();
            let mut out = Frag::of(format!("({}) => ", params.join(", ")));
            out.f(arg.clone().wrap("(", ")")).s(&format!("({})", params.join(", ")));
            out
        };
        let call_on = |object: Frag, method: &str, args: Vec<Frag>| -> Frag {
            let mut out = object;
            out.s(&format!("{dot}{method}")).f(Frag::join(args, ", ").wrap("(", ")"));
            out
        };
        let helper = |this: &mut Self, helper: &'static str, mut values: Vec<Frag>| -> Frag {
            this.helpers.insert(helper);
            if matches!(helper, "mapResult" | "mapErr" | "unwrapOr" | "okValue") {
                this.uses_result = true;
            }
            values.insert(0, Frag::default());
            let mut out = Frag::of(format!("${helper}("));
            let values: Vec<Frag> = values.into_iter().skip(1).collect();
            out.f(Frag::join(values, ", ")).s(")");
            out
        };
        match (recv, name) {
            (Recv::Str, "contains") => call_on(object, "includes", args),
            (Recv::Str, "lowercased") => call_on(object, "toLowerCase", args),
            (Recv::Str, "uppercased") => call_on(object, "toUpperCase", args),
            (Recv::Str, "trimmed") => call_on(object, "trim", args),
            // A `RegExp` pattern replaces as JS's `replace` does (its flags say how often).
            (Recv::Str, "replace")
                if call
                    .args
                    .first()
                    .is_some_and(|a| matches!(self.ck.types.get(&a.value.id), Some(Ty::Foreign(_)))) =>
            {
                call_on(object, "replace", args)
            }
            (Recv::Str, "replace") => call_on(object, "replaceAll", args),
            (Recv::Str, "toInt") => helper(self, "toInt", vec![object]),
            (Recv::Str, "toFloat") => helper(self, "toFloat", vec![object]),
            (Recv::Int | Recv::Float, "toFloat") => object,
            (Recv::Int | Recv::Float, "rounded") => object.wrap("Math.round(", ")"),
            (Recv::Int | Recv::Float, "floor") => object.wrap("Math.floor(", ")"),
            (Recv::Int | Recv::Float, "ceil") => object.wrap("Math.ceil(", ")"),
            (Recv::Int | Recv::Float, "truncated") => object.wrap("Math.trunc(", ")"),
            (Recv::Int | Recv::Float, "abs") => object.wrap("Math.abs(", ")"),
            (Recv::Int | Recv::Float, "min" | "max") => {
                let mut values = vec![object];
                values.extend(args);
                Frag::join(values, ", ").wrap(&format!("Math.{name}("), ")")
            }
            (Recv::Int | Recv::Float, _) => {
                let mut out = Frag::of("Math.min(Math.max(");
                let mut args = args.into_iter();
                out.f(object)
                    .s(", ")
                    .f(args.next().unwrap_or_default())
                    .s("), ")
                    .f(args.next().unwrap_or_default())
                    .s(")");
                out
            }
            (Recv::List, "map" | "filter" | "find" | "flatMap") => {
                let f = args.first().map(|a| lambda(a, 1)).unwrap_or_default();
                call_on(object, name, vec![f])
            }
            (Recv::List, "any" | "all") => {
                let f = args.first().map(|a| lambda(a, 1)).unwrap_or_default();
                call_on(object, if name == "any" { "some" } else { "every" }, vec![f])
            }
            (Recv::List, "slice") => call_on(object, "slice", args),
            (Recv::List, "indexOf") => helper(self, "index", vec![call_on(object, "indexOf", args)]),
            (Recv::List, "enumerated") => call_on(object, "map", vec![Frag::of("(x, i) => [i, x] as const")]),
            (Recv::List, "compactMap") => {
                let f = args.first().map(|a| lambda(a, 1)).unwrap_or_default();
                helper(self, "compact", vec![call_on(object, "map", vec![f])])
            }
            (Recv::List, "findIndex") => {
                let f = args.first().map(|a| lambda(a, 1)).unwrap_or_default();
                helper(self, "index", vec![call_on(object, "findIndex", vec![f])])
            }
            (Recv::List, "reduce") => {
                let mut args = args.into_iter();
                let initial = args.next().unwrap_or_default();
                let f = args.next().map(|a| lambda(&a, 2)).unwrap_or_default();
                call_on(object, "reduce", vec![f, initial])
            }
            (Recv::List, "contains") => call_on(object, "includes", args),
            (Recv::List, "sorted") => {
                let mut values = vec![object];
                values.extend(args);
                helper(self, "sorted", values)
            }
            (Recv::List, "reversed") => object.wrap("[...", "].reverse()"),
            (Recv::List, "prefix") => {
                let mut values = vec![Frag::of("0")];
                values.extend(args);
                call_on(object, "slice", values)
            }
            (Recv::List, "dropFirst") => call_on(object, "slice", args),
            (Recv::List, "appending") => {
                let mut out = Frag::of("[...");
                out.f(object).s(", ").f(args.into_iter().next().unwrap_or_default()).s("]");
                out
            }
            (Recv::List, "inserting") | (Recv::List, "removing") => {
                let mut values = vec![object];
                values.extend(args);
                helper(self, if name == "inserting" { "inserting" } else { "removing" }, values)
            }
            (Recv::List, "joined") => call_on(object, "join", args),
            (Recv::JsMap, "get") => call_on(object, "get", args),
            (Recv::JsMap | Recv::Set, "contains") => call_on(object, "has", args),
            (Recv::JsMap, "setting") => {
                let mut out = object.wrap("new Map(", ")");
                out.s(".set").f(Frag::join(args, ", ").wrap("(", ")"));
                out
            }
            (Recv::Set, "inserting") => {
                let mut out = object.wrap("new Set(", ")");
                out.s(".add").f(Frag::join(args, ", ").wrap("(", ")"));
                out
            }
            (Recv::JsMap | Recv::Set, _) => {
                let mut values = vec![object];
                values.extend(args);
                helper(self, if recv == Recv::JsMap { "mapDeleting" } else { "setDeleting" }, values)
            }
            (Recv::Map, "setting") => {
                let mut args = args.into_iter();
                let mut out = Frag::of("{ ...");
                out.f(object)
                    .s(", [")
                    .f(args.next().unwrap_or_default())
                    .s("]: ")
                    .f(args.next().unwrap_or_default())
                    .s(" }");
                out
            }
            (Recv::Map, _) => {
                let mut values = vec![object];
                values.extend(args);
                helper(self, "without", values)
            }
            (Recv::Option, "map") => {
                let mut values = vec![object];
                values.extend(args);
                helper(self, "mapOption", values)
            }
            (Recv::Option, _) => {
                let mut out = object;
                out.s(" ?? ").f(args.into_iter().next().unwrap_or_default().wrap("(", ")"));
                out.wrap("(", ")")
            }
            (Recv::Result, method) => {
                let helper_name = match method {
                    "map" => "mapResult",
                    "mapErr" => "mapErr",
                    "unwrapOr" => "unwrapOr",
                    _ => "okValue",
                };
                let mut values = vec![object];
                values.extend(args);
                helper(self, helper_name, values)
            }
            _ => call_on(object, name, args),
        }
    }

    // ---- builders -----------------------------------------------------------

    /// A builder's lines as children: views, `if`/`match` (one slot each), `for` (a list).
    fn children(&mut self, stmts: &[Stmt]) -> Vec<Frag> {
        self.children_spreading(stmts, false)
    }

    /// [`Self::children`]; `rest`: they fill a rest parameter, so a last `for` whose
    /// items are one plain view each, none able to leave (`.transition`), is spread
    /// (`...xs.map(…)`): its items are the parent's children, keyed by their `.id()`
    /// as in a list, with no list slot (`Presence`, one fiber) around them. Nothing
    /// follows them, so no sibling shifts when the list's length changes.
    fn children_spreading(&mut self, stmts: &[Stmt], rest: bool) -> Vec<Frag> {
        let last = stmts.iter().rposition(|s| matches!(s.kind, StmtKind::Expr(_) | StmtKind::For(_)));
        let mut out = Vec::new();
        for (index, stmt) in stmts.iter().enumerate() {
            match &stmt.kind {
                StmtKind::Let(_) => self.stmt(stmt),
                StmtKind::Expr(expr) => out.push(self.scoped_child(expr)),
                StmtKind::For(f) => {
                    let iter_ty = self.ck.types.get(&f.iter.id).cloned().unwrap_or(Ty::Unknown);
                    // `for (i, x) in xs.enumerated()`: `xs.map((x, i) => …)`.
                    let swapped = match (self.enumerated_list(&f.iter), &f.pattern.kind) {
                        (Some(list), PatternKind::Tuple(items)) if items.len() == 2 => {
                            Some((list, [self.binding_target(&items[1]), self.binding_target(&items[0])]))
                        }
                        _ => None,
                    };
                    let mut iter = match &swapped {
                        Some((list, _)) => self.operand(list),
                        None => self.operand(&f.iter),
                    };
                    if matches!(iter_ty, Ty::Map(_)) {
                        iter = iter.wrap("Object.entries(", ")");
                    } else if matches!(iter_ty, Ty::JsMap(..) | Ty::Set(_)) {
                        // A builder `for` maps over an array.
                        iter = iter.wrap("[...", "]");
                    }
                    let target = match swapped {
                        Some((_, [x, i])) => format!("{x}, {i}"),
                        None => self.binding_target(&f.pattern),
                    };
                    self.bufs.push(Vec::new());
                    let children = self.children(&f.body.stmts);
                    let stmts = self.bufs.pop().expect("the loop");
                    let value = if children.len() == 1 {
                        children.into_iter().next().expect("one")
                    } else {
                        Frag::join(children, ", ").wrap("[", "]")
                    };
                    let body = if stmts.is_empty() {
                        value
                    } else {
                        let mut b = Frag::of("{\n");
                        for s in stmts {
                            b.f(s).s("\n");
                        }
                        b.s("return ").f(value).s(";\n}");
                        b
                    };
                    let spread = rest
                        && last == Some(index)
                        && matches!(f.body.stmts.as_slice(), [.., Stmt { kind: StmtKind::Expr(e), .. }] if plain_item(e))
                        && f.body.stmts.iter().filter(|s| !matches!(s.kind, StmtKind::Let(_))).count() == 1;
                    let mut line = if spread { Frag::of("...") } else { Frag::default() };
                    line.f(iter).mark(stmt.span).s(&format!(".map(({target}) => ")).f(body).s(")");
                    out.push(line);
                }
                _ => {}
            }
        }
        out
    }

    /// One child: `if` and `match` keep their slot (`null` when they draw nothing).
    fn child(&mut self, expr: &Expr) -> Frag {
        let child = Ty::View(None);
        match &expr.kind {
            ExprKind::If(if_expr) => {
                let test = self.condition(&if_expr.cond);
                let then = self.branch(&if_expr.then.stmts);
                let otherwise = match if_expr.otherwise.as_deref() {
                    Some(Else::If(next)) => self.conditional(|this| this.child(next)),
                    Some(Else::Block(block)) => self.branch(&block.stmts),
                    None => (Vec::new(), Frag::of("null")),
                };
                let choices = vec![
                    Choice { test: Some((Vec::new(), test)), value: then },
                    Choice { test: None, value: otherwise },
                ];
                let mut out = Frag::at(expr.span, "");
                out.f(self.select(choices, &child, true));
                out
            }
            ExprKind::Match(m) => {
                let patterns: Vec<&Pattern> = m.arms.iter().map(|a| &a.pattern).collect();
                let subject = self.subject(&m.scrutinee, &patterns);
                let mut choices = Vec::new();
                let count = m.arms.len();
                for (index, arm) in m.arms.iter().enumerate() {
                    let mut tests = self.pattern_test(&arm.pattern, &subject);
                    if let Some(guard) = &arm.guard {
                        tests.push(self.operand(guard).text);
                    }
                    let value = match &arm.body {
                        ArmBody::Expr(e) => self.branch(std::slice::from_ref(&Stmt {
                            kind: StmtKind::Expr(e.clone()),
                            span: e.span,
                        })),
                        ArmBody::Block(b) => self.branch(&b.stmts),
                    };
                    let test = (index + 1 < count || arm.guard.is_some()).then(|| {
                        (
                            Vec::new(),
                            Frag::of(if tests.is_empty() { "true".to_string() } else { tests.join(" && ") }),
                        )
                    });
                    choices.push(Choice { test, value });
                }
                if m.arms.last().is_some_and(|a| a.guard.is_some()) {
                    choices.push(Choice { test: None, value: (Vec::new(), Frag::of("null")) });
                }
                let out = self.select(choices, &child, true);
                let mut marked = Frag::at(expr.span, "");
                marked.f(if out.text.starts_with('$') { out } else { out.wrap("(", ")") });
                marked
            }
            _ => self.expr(expr),
        }
    }

    /// A conditional builder branch: its children (one, or a list), and the statements they need.
    fn branch(&mut self, stmts: &[Stmt]) -> (Vec<Frag>, Frag) {
        self.conditional(|this| {
            let children = this.children(stmts);
            match children.len() {
                0 => Frag::of("null"),
                1 => children.into_iter().next().expect("one"),
                _ => Frag::join(children, ", ").wrap("[", "]"),
            }
        })
    }
}

impl Emitter<'_> {
    // ---- structural equality (spec 4.3) ----------------------------------------

    /// `expr` as a path to read more than once: itself when it is one, else a temp.
    fn path_or_temp(&mut self, expr: &Expr) -> String {
        if is_path(expr) && !matches!(expr.kind, ExprKind::Call(_)) {
            return self.operand(expr).text;
        }
        let name = self.temp();
        let value = self.expr(expr);
        let mut line = Frag::at(expr.span, format!("const {name} = "));
        line.f(value).s(";");
        self.push_stmt(line);
        name
    }

    /// Whether `a` and `b` (paths) are equal as values of `ty`, inline; a
    /// recursive type compares through a module function. `seen`: the types
    /// being expanded.
    fn equal(&mut self, a: &str, b: &str, ty: &Ty, seen: &mut Vec<DefId>) -> String {
        if crate::check::equality(&self.ck.defs, ty) == crate::check::Equality::Identity {
            return format!("{a} === {b}");
        }
        let and = |parts: Vec<String>| -> String {
            if parts.is_empty() {
                "true".into()
            } else {
                parts
                    .iter()
                    .map(|p| if p.contains(" ? ") { format!("({p})") } else { p.clone() })
                    .collect::<Vec<_>>()
                    .join(" && ")
            }
        };
        match ty {
            Ty::Option(inner) => {
                let inner = self.equal(a, b, inner, seen);
                format!("{a} === undefined || {b} === undefined ? {a} === {b} : {inner}")
            }
            Ty::Tuple(items) => {
                let parts = items
                    .iter()
                    .enumerate()
                    .map(|(i, t)| self.equal(&format!("{a}[{i}]"), &format!("{b}[{i}]"), t, seen))
                    .collect();
                and(parts)
            }
            Ty::Partial(inner) => {
                let Ty::Adt(def, args) = &**inner else { return format!("{a} === {b}") };
                let fields = self.ck.defs[*def].fields().to_vec();
                let parts = fields
                    .iter()
                    .map(|f| {
                        let ty = Ty::Option(Box::new(substitute(&f.ty, args)));
                        self.equal(&member_path(a, &f.name), &member_path(b, &f.name), &ty, seen)
                    })
                    .collect();
                and(parts)
            }
            Ty::Adt(def, args) => {
                if seen.contains(def) {
                    let name = self.eq_helper(ty);
                    return format!("{name}({a}, {b})");
                }
                seen.push(*def);
                let d = self.ck.defs[*def].clone();
                let out = match &d.kind {
                    DefKind::Struct(fields) => {
                        let parts = fields
                            .iter()
                            .map(|f| {
                                self.equal(
                                    &member_path(a, &f.name),
                                    &member_path(b, &f.name),
                                    &substitute(&f.ty, args),
                                    seen,
                                )
                            })
                            .collect();
                        and(parts)
                    }
                    DefKind::Enum(variants) => {
                        // The same case (`tag`), then its payload; a fieldless case is its string.
                        let mut out = format!("{a} === {b} || ");
                        if variants.iter().any(|v| v.payload.is_empty()) {
                            out.push_str(&format!(
                                "typeof {a} === \"object\" && typeof {b} === \"object\" && "
                            ));
                        }
                        let mut arms = String::new();
                        for variant in variants.iter().filter(|v| !v.payload.is_empty()) {
                            let tag = string_literal(&variant.name);
                            let parts = (0..variant.payload.len())
                                .map(|i| {
                                    let key = variant.key(i);
                                    self.equal(
                                        &member_path(a, &key),
                                        &member_path(b, &key),
                                        &substitute(&variant.payload[i].1, args),
                                        seen,
                                    )
                                })
                                .collect();
                            arms.push_str(&format!(
                                "{a}.tag === {tag} && {b}.tag === {tag} ? {} : ",
                                and(parts)
                            ));
                        }
                        out.push_str(&format!("({arms}false)"));
                        out
                    }
                };
                seen.pop();
                out
            }
            Ty::List(elem) => {
                let (x, i) = (format!("$x{}", self.eq_vars), format!("$i{}", self.eq_vars));
                self.eq_vars += 1;
                let inner = self.equal(&x, &format!("{b}[{i}]!"), elem, seen);
                format!("{a}.length === {b}.length && {a}.every(({x}, {i}) => {inner})")
            }
            Ty::Map(value) => {
                let (x, k) = (format!("$x{}", self.eq_vars), format!("$k{}", self.eq_vars));
                self.eq_vars += 1;
                let inner = self.equal(&x, &format!("{b}[{k}]!"), value, seen);
                format!(
                    "Object.keys({a}).length === Object.keys({b}).length && Object.entries({a}).every(([{k}, {x}]) => {k} in {b} && {inner})"
                )
            }
            Ty::Result(ok, err) => {
                let ok = self.equal(&format!("{a}.value"), &format!("{b}.value"), ok, seen);
                let err = self.equal(&format!("{a}.error"), &format!("{b}.error"), err, seen);
                format!("{a}.ok && {b}.ok ? {ok} : !{a}.ok && !{b}.ok ? {err} : false")
            }
            _ => format!("{a} === {b}"),
        }
    }

    /// The module function comparing values of the recursive type `ty`.
    fn eq_helper(&mut self, ty: &Ty) -> String {
        let ts = self.ts_type(ty);
        if let Some((name, _, _)) = self.eq_helpers.iter().find(|(_, t, _)| *t == ts) {
            return name.clone();
        }
        let name = format!("$eq{}", self.eq_helpers.len());
        self.eq_helpers.push((name.clone(), ts, ty.clone()));
        name
    }

    /// The comparison functions the module's recursive types need: each expands
    /// its type once, and its own recursion calls it (or another one) again.
    fn eq_functions(&mut self) -> Frag {
        let mut out = Frag::default();
        let mut index = 0;
        while index < self.eq_helpers.len() {
            let (name, ts, ty) = self.eq_helpers[index].clone();
            let body = self.equal("a", "b", &ty, &mut Vec::new());
            out.s(&format!("function {name}(a: {ts}, b: {ts}): boolean {{\n  return {body};\n}}\n"));
            index += 1;
        }
        out
    }
}

/// `object.name` as a path (`object["a-b"]` when the name is not an identifier).
fn member_path(object: &str, name: &str) -> String {
    if is_ident(name) { format!("{object}.{name}") } else { format!("{object}[{name:?}]") }
}

/// One choice of [`Emitter::select`]: its test (with the statements it needs) and its value.
struct Choice {
    test: Option<(Vec<Frag>, Frag)>,
    value: (Vec<Frag>, Frag),
}

/// A caught value as a JS `Error` (a TS promise may reject with anything).
const TO_ERROR: &str = "$error instanceof Error ? $error : new Error(String($error))";

/// `{ ...x, a: { ...x.a, b: value } }` for `x.a.b = value`.
fn updated(name: &str, fields: &[String], value: Frag) -> Frag {
    let mut out = value;
    for depth in (0..fields.len()).rev() {
        let base = field_path(name, &fields[..depth]);
        let mut wrapped = Frag::of(format!("{{ ...{base}, {}: ", prop_key(&fields[depth])));
        wrapped.f(out).s(" }");
        out = wrapped;
    }
    out
}

fn field_path(name: &str, fields: &[String]) -> String {
    let mut out = name.to_string();
    for field in fields {
        out.push('.');
        out.push_str(field);
    }
    out
}

/// Whether `text` names `name` as a whole word.
fn mentions(text: &str, name: &str) -> bool {
    let word = |c: char| c.is_alphanumeric() || c == '_' || c == '$';
    text.match_indices(name).any(|(at, _)| {
        !text[..at].chars().next_back().is_some_and(word)
            && !text[at + name.len()..].chars().next().is_some_and(word)
    })
}

/// Whether the dependency `outer` changes whenever `inner` does (`auth` covers `auth.x`).
fn covers(outer: &str, inner: &str) -> bool {
    outer == inner
        || inner.strip_prefix(outer).is_some_and(|rest| rest.starts_with('.') || rest.starts_with("?."))
}

fn is_path(expr: &Expr) -> bool {
    match &expr.kind {
        ExprKind::Name(_) => true,
        ExprKind::Field(inner, _) => is_path(inner),
        ExprKind::Paren(inner) => is_path(inner),
        _ => false,
    }
}

fn binds(pattern: &Pattern) -> bool {
    match &pattern.kind {
        PatternKind::Bind(_) => true,
        PatternKind::Case { args: Some(args), .. } | PatternKind::Tuple(args) | PatternKind::Or(args) => {
            args.iter().any(binds)
        }
        PatternKind::Record(_) => true,
        _ => false,
    }
}

pub(crate) fn stmt_awaits(stmt: &Stmt) -> bool {
    let mut found = false;
    let mut visit = |e: &Expr| {
        if expr_awaits(e) {
            found = true;
        }
    };
    match &stmt.kind {
        StmtKind::Let(l) => visit(&l.value),
        StmtKind::Var(v) => visit(&v.value),
        StmtKind::Assign(a) => visit(&a.value),
        StmtKind::Return(Some(e)) | StmtKind::Expr(e) => visit(e),
        StmtKind::While(w) => visit(&w.cond),
        StmtKind::For(f) => visit(&f.iter),
        StmtKind::Guard(g) => match &g.cond {
            Cond::Expr(e) | Cond::Let(_, e) => visit(e),
        },
        StmtKind::Throw(e) => visit(e),
        StmtKind::Return(None) | StmtKind::Defer(_) | StmtKind::Do(_) => {}
    }
    found
}

/// Whether `expr` awaits (closures are their own).
fn expr_awaits(expr: &Expr) -> bool {
    match &expr.kind {
        ExprKind::Await(_) => true,
        ExprKind::Closure(_) => false,
        ExprKind::Paren(e)
        | ExprKind::Spread(e)
        | ExprKind::Is(e, _)
        | ExprKind::Unary(_, e)
        | ExprKind::Try(e)
        | ExprKind::Throwing(_, e)
        | ExprKind::Field(e, _)
        | ExprKind::OptField(e, _) => expr_awaits(e),
        ExprKind::Binary(_, a, b) | ExprKind::Index(a, b) => expr_awaits(a) || expr_awaits(b),
        ExprKind::Ternary(a, b, c) => expr_awaits(a) || expr_awaits(b) || expr_awaits(c),
        ExprKind::Call(call) => expr_awaits(&call.callee) || call.args.iter().any(|a| expr_awaits(&a.value)),
        ExprKind::If(i) => {
            matches!(&i.cond, Cond::Expr(e) | Cond::Let(_, e) if expr_awaits(e))
                || i.then.stmts.iter().any(stmt_awaits)
        }
        ExprKind::Match(m) => expr_awaits(&m.scrutinee),
        ExprKind::Tuple(items) | ExprKind::List(items) => items.iter().any(expr_awaits),
        ExprKind::Record(entries) => entries.iter().any(|e| expr_awaits(e.value())),
        _ => false,
    }
}

fn stmts_assign(stmts: &[Stmt]) -> bool {
    stmts.iter().any(|s| match &s.kind {
        StmtKind::Assign(_) => true,
        StmtKind::Expr(e) | StmtKind::Return(Some(e)) => expr_assigns(e),
        StmtKind::While(w) => stmts_assign(&w.body.stmts),
        StmtKind::For(f) => stmts_assign(&f.body.stmts),
        _ => false,
    })
}

fn expr_assigns(expr: &Expr) -> bool {
    match &expr.kind {
        ExprKind::If(i) => {
            stmts_assign(&i.then.stmts)
                || matches!(i.otherwise.as_deref(), Some(Else::Block(b)) if stmts_assign(&b.stmts))
                || matches!(i.otherwise.as_deref(), Some(Else::If(e)) if expr_assigns(e))
        }
        ExprKind::Match(m) => {
            m.arms.iter().any(|a| matches!(&a.body, ArmBody::Block(b) if stmts_assign(&b.stmts)))
        }
        _ => false,
    }
}

impl<'a> Emitter<'a> {
    // ---- views ----------------------------------------------------------------

    /// What `stmts` read that can change between renders, as the longest member
    /// paths (`auth.isPending`, `prefs.likes`): values are immutable, so a path's
    /// value is the dependency. A method keeps its receiver (`router.push(…)`
    /// depends on `router`); an assigned state is written, not read.
    fn deps(&self, stmts: &[Stmt]) -> Vec<String> {
        let mut out = Vec::new();
        for stmt in stmts {
            self.stmt_deps(stmt, &mut out);
        }
        // `auth` covers `auth.isPending`.
        let all = out.clone();
        out.retain(|d| !all.iter().any(|p| p != d && covers(p, d)));
        out
    }

    fn expr_deps(&self, expr: &Expr) -> Vec<String> {
        let mut out = Vec::new();
        self.collect(expr, &mut out);
        let all = out.clone();
        out.retain(|d| !all.iter().any(|p| p != d && covers(p, d)));
        out
    }

    fn stmt_deps(&self, stmt: &Stmt, out: &mut Vec<String>) {
        match &stmt.kind {
            StmtKind::Let(l) => self.collect(&l.value, out),
            StmtKind::Var(v) => self.collect(&v.value, out),
            StmtKind::Assign(a) => {
                let mut target = &a.target;
                while let ExprKind::Field(inner, _) = &target.kind {
                    target = inner;
                }
                if !matches!(target.kind, ExprKind::Name(_)) {
                    self.collect(&a.target, out);
                }
                self.collect(&a.value, out);
            }
            StmtKind::Return(Some(e)) | StmtKind::Expr(e) => self.collect(e, out),
            StmtKind::Return(None) => {}
            StmtKind::Defer(b) => b.stmts.iter().for_each(|s| self.stmt_deps(s, out)),
            StmtKind::While(w) => {
                self.collect(&w.cond, out);
                w.body.stmts.iter().for_each(|s| self.stmt_deps(s, out));
            }
            StmtKind::For(f) => {
                self.collect(&f.iter, out);
                f.body.stmts.iter().for_each(|s| self.stmt_deps(s, out));
            }
            StmtKind::Guard(g) => {
                match &g.cond {
                    Cond::Expr(e) | Cond::Let(_, e) => self.collect(e, out),
                }
                g.otherwise.stmts.iter().for_each(|s| self.stmt_deps(s, out));
            }
            StmtKind::Throw(e) => self.collect(e, out),
            StmtKind::Do(d) => {
                d.body.stmts.iter().for_each(|s| self.stmt_deps(s, out));
                d.catches.iter().flat_map(|c| &c.body.stmts).for_each(|s| self.stmt_deps(s, out));
            }
        }
    }

    /// The emitted path of a reactive read (`auth`, `auth.isPending`, `post?.title`).
    fn dep_path(&self, expr: &Expr) -> Option<String> {
        let view = self.view.as_ref()?;
        match &expr.kind {
            ExprKind::Name(_) => match self.ck.names.get(&expr.id) {
                Some(NameRes::Local(local)) if view.reactive.contains(local) => Some(self.local_name(*local)),
                _ => None,
            },
            ExprKind::Field(object, name)
                if self.ck.fields.get(&expr.id) == Some(&FieldRes::Field) && is_ident(&name.name) =>
            {
                self.dep_path(object).map(|p| format!("{p}.{}", name.name))
            }
            ExprKind::OptField(object, name) if is_ident(&name.name) => {
                self.dep_path(object).map(|p| format!("{p}?.{}", name.name))
            }
            ExprKind::Paren(inner) => self.dep_path(inner),
            _ => None,
        }
    }

    fn push_dep(out: &mut Vec<String>, dep: String) {
        if !out.contains(&dep) {
            out.push(dep);
        }
    }

    fn collect(&self, expr: &Expr, out: &mut Vec<String>) {
        if let Some(path) = self.dep_path(expr) {
            Self::push_dep(out, path);
            return;
        }
        let mut go = |e: &Expr| self.collect(e, out);
        match &expr.kind {
            ExprKind::Binding(_) => {
                if let Some((local, fields)) = self.ck.bindings.get(&expr.id)
                    && self.view.as_ref().is_some_and(|v| v.reactive.contains(local))
                {
                    Self::push_dep(out, field_path(&self.local_name(*local), fields));
                }
            }
            ExprKind::Str { parts, .. } => parts.iter().for_each(|p| {
                if let StrPart::Interp(e) = p {
                    go(e);
                }
            }),
            ExprKind::Paren(e)
            | ExprKind::Spread(e)
            | ExprKind::Is(e, _)
            | ExprKind::Unary(_, e)
            | ExprKind::Await(e)
            | ExprKind::Try(e)
            | ExprKind::Throwing(_, e)
            | ExprKind::Field(e, _)
            | ExprKind::OptField(e, _) => go(e),
            ExprKind::Tuple(items) | ExprKind::List(items) => items.iter().for_each(go),
            ExprKind::Record(entries) => entries.iter().for_each(|e| go(e.value())),
            ExprKind::Map(entries) => entries.iter().for_each(|(k, v)| {
                go(k);
                go(v);
            }),
            ExprKind::Binary(_, a, b) | ExprKind::Index(a, b) => {
                go(a);
                go(b);
            }
            ExprKind::Ternary(a, b, c) => {
                go(a);
                go(b);
                go(c);
            }
            ExprKind::Call(call) => {
                // `.task` and `.onChange` run in effects: the render reads only their receiver.
                if let (Some(CallRes::Task | CallRes::OnChange(_)), ExprKind::Field(receiver, _)) =
                    (self.ck.calls.get(&expr.id), &call.callee.kind)
                {
                    go(receiver);
                    return;
                }
                // A method reads its receiver whole.
                match &call.callee.kind {
                    ExprKind::Field(receiver, _) => go(receiver),
                    _ => go(&call.callee),
                }
                call.args.iter().for_each(|a| go(&a.value));
                if let Some(trailing) = &call.trailing {
                    trailing.body.iter().for_each(|s| self.stmt_deps(s, out));
                }
            }
            ExprKind::Closure(c) => c.body.iter().for_each(|s| self.stmt_deps(s, out)),
            ExprKind::Task(b) => b.stmts.iter().for_each(|s| self.stmt_deps(s, out)),
            ExprKind::If(i) => {
                match &i.cond {
                    Cond::Expr(e) | Cond::Let(_, e) => self.collect(e, out),
                }
                i.then.stmts.iter().for_each(|s| self.stmt_deps(s, out));
                match i.otherwise.as_deref() {
                    Some(Else::If(e)) => self.collect(e, out),
                    Some(Else::Block(b)) => b.stmts.iter().for_each(|s| self.stmt_deps(s, out)),
                    None => {}
                }
            }
            ExprKind::Match(m) => {
                self.collect(&m.scrutinee, out);
                for arm in &m.arms {
                    if let Some(g) = &arm.guard {
                        self.collect(g, out);
                    }
                    match &arm.body {
                        ArmBody::Expr(e) => self.collect(e, out),
                        ArmBody::Block(b) => b.stmts.iter().for_each(|s| self.stmt_deps(s, out)),
                    }
                }
            }
            _ => {}
        }
    }

    /// Whether `expr` reads a name the body itself binds (a `for` item, an `if let`,
    /// a closure parameter): such a subtree is cached with its parent, never alone.
    fn reads_body_local(&self, expr: &Expr) -> bool {
        let Some(body) = self.body_span else { return false };
        let mut found = false;
        crate::check::walk_names(expr, &mut |_, id| {
            if let Some(NameRes::Local(local)) = self.ck.names.get(&id) {
                let span = self.ck.locals[*local].span;
                if span.start >= body.start && span.end <= body.end {
                    found = true;
                }
            }
        });
        found
    }

    /// A child cached on its own when it reads less than its parent (React
    /// Compiler style): `(changed ? (… , $[n] = child) : $[n])`, lazy, so it
    /// keeps its identity (and the runtime skips it) when only the parent's
    /// other dependencies change.
    fn scoped_child(&mut self, expr: &Expr) -> Frag {
        let Some(parent) = self.scope.clone() else { return self.child(expr) };
        // A conditional keeps its slot; its branches are cached on their own.
        if matches!(expr.kind, ExprKind::If(_) | ExprKind::Match(_)) || self.reads_body_local(expr) {
            return self.child(expr);
        }
        if self.hoistable(expr) {
            return self.expr(expr);
        }
        let deps = self.expr_deps(expr);
        let narrower = !deps.is_empty()
            && deps.iter().all(|d| parent.iter().any(|p| covers(p, d)))
            && !(deps.len() == parent.len() && deps.iter().all(|d| parent.contains(d)));
        if !narrower {
            return self.child(expr);
        }
        self.scope = Some(deps.clone());
        let value = self.child(expr);
        self.scope = Some(parent);
        let view = self.view.as_mut().expect("a view");
        let base = view.slots;
        view.slots += deps.len() + 1;
        let slot = base + deps.len();
        let cond = deps
            .iter()
            .enumerate()
            .map(|(i, d)| format!("$[{}] !== {d}", base + i))
            .collect::<Vec<_>>()
            .join(" || ");
        let stores: String =
            deps.iter().enumerate().map(|(i, d)| format!("$[{}] = {d}, ", base + i)).collect();
        let mut out = Frag::of(format!("({cond} ? ({stores}$[{slot}] = "));
        out.f(value).s(&format!(") : $[{slot}])"));
        out
    }

    /// The expressions of `item` that are the same value on every evaluation:
    /// literals, names defined at module scope (before the item), closures that
    /// read only those, and node, modifier, component, struct and enum-case
    /// calls of static parts. One walk, bottom-up.
    fn static_exprs(&self, item: &Item) -> HashSet<ExprId> {
        let mut statics = HashSet::default();
        let mut decided = HashSet::default();
        crate::analysis::walk_item(item, &mut |node| {
            if let crate::analysis::Node::Expr(expr) = node
                && !decided.contains(&expr.id)
            {
                self.mark_static(expr, &mut statics, &mut decided);
            }
        });
        statics
    }

    fn mark_static(&self, expr: &Expr, statics: &mut HashSet<ExprId>, decided: &mut HashSet<ExprId>) -> bool {
        let mut go = |e: &Expr| self.mark_static(e, statics, decided);
        let is_static = match &expr.kind {
            ExprKind::Int(_)
            | ExprKind::Float(_)
            | ExprKind::Bool(_)
            | ExprKind::None
            | ExprKind::Unit
            | ExprKind::ImplicitMember(_)
            | ExprKind::KeyPath { .. } => true,
            ExprKind::Str { parts, .. } => parts.iter().all(|p| match p {
                StrPart::Text(_) => true,
                StrPart::Interp(e) => go(e),
            }),
            ExprKind::Name(_) => self.module_name(expr.id),
            ExprKind::Paren(e) | ExprKind::Spread(e) | ExprKind::Unary(_, e) => go(e),
            ExprKind::Field(object, _) => {
                matches!(self.ck.fields.get(&expr.id), Some(FieldRes::EnumCase(..))) || go(object)
            }
            ExprKind::Binary(_, a, b) => go(a) & go(b),
            ExprKind::Tuple(items) | ExprKind::List(items) => items.iter().fold(true, |all, e| go(e) & all),
            ExprKind::Record(entries) => entries.iter().fold(true, |all, e| go(e.value()) & all),
            ExprKind::Closure(c) => {
                let mut only = !stmts_assign(&c.body);
                crate::check::walk_stmts(&c.body, &mut |_, id| {
                    if !self.module_name(id) {
                        only = false;
                    }
                });
                only
            }
            ExprKind::Call(call) => {
                let node = matches!(
                    self.ck.calls.get(&expr.id),
                    Some(
                        CallRes::Node(_)
                            | CallRes::Modifier { .. }
                            | CallRes::Component
                            | CallRes::View { .. }
                            | CallRes::EnumCase(..)
                            | CallRes::Struct(_)
                    )
                );
                let callee = match &call.callee.kind {
                    ExprKind::Field(receiver, _) => go(receiver),
                    _ => true,
                };
                let args = call.args.iter().fold(true, |all, a| go(&a.value) & all);
                let trailing = call.trailing.as_ref().is_none_or(|c| {
                    let mut all = true;
                    for stmt in &c.body {
                        match &stmt.kind {
                            StmtKind::Expr(e) => all &= go(e),
                            _ => all = false,
                        }
                    }
                    all && (self.ck.closures.get(&c.span).is_some_and(|i| i.builder) || {
                        let mut only = !stmts_assign(&c.body);
                        crate::check::walk_stmts(&c.body, &mut |_, id| only &= self.module_name(id));
                        only
                    })
                });
                node && callee && args && trailing
            }
            _ => false,
        };
        decided.insert(expr.id);
        if is_static {
            statics.insert(expr.id);
        }
        is_static
    }

    /// Whether the name read at `id` is defined at module scope before the item being emitted.
    fn module_name(&self, id: ExprId) -> bool {
        match self.ck.names.get(&id) {
            Some(NameRes::Local(local)) => {
                let info = &self.ck.locals[*local];
                let defined = match info.kind {
                    LocalKind::Import { .. } | LocalKind::Component { .. } | LocalKind::ModuleFn => true,
                    LocalKind::ModuleConst | LocalKind::View => info.span.start < self.item_start,
                    _ => false,
                };
                defined && info.frame == 0
            }
            None => !self.ck.bindings.contains_key(&id),
        }
    }

    /// A static node chain: built once, at module scope.
    fn hoistable(&self, expr: &Expr) -> bool {
        !self.in_static
            && self.statics.contains(&expr.id)
            && matches!(
                self.ck.calls.get(&expr.id),
                Some(CallRes::Node(_) | CallRes::Modifier { .. } | CallRes::Component | CallRes::View { .. })
            )
    }

    /// `expr` (a static chain) as a module constant; the same tree twice is one constant.
    fn hoist(&mut self, expr: &Expr) -> Frag {
        self.in_static = true;
        let value = self.child(expr);
        self.in_static = false;
        if let Some(name) = self.hoisted_trees.get(&value.text) {
            return Frag::of(name.clone());
        }
        let name = format!("$view{}", self.hoisted_trees.len());
        self.hoisted_trees.insert(value.text.clone(), name.clone());
        let mut decl = Frag::of(format!("const {name} = "));
        decl.f(value).s(";");
        self.hoisted.push(decl);
        Frag::of(name)
    }

    /// A node's argument: a view is a child that may be cached on its own.
    fn node_arg(&mut self, value: &Expr) -> Frag {
        if matches!(self.ck.types.get(&value.id), Some(Ty::View(_)))
            && !matches!(value.kind, ExprKind::If(_) | ExprKind::Match(_))
        {
            self.scoped_child(value)
        } else {
            self.expr(value)
        }
    }

    /// `name` computed by `prelude; value`, again only when a dependency changed.
    fn memo(
        &mut self,
        name: &str,
        ty: Option<String>,
        deps: &[String],
        prelude: Vec<Frag>,
        value: Frag,
    ) -> Frag {
        let dep_names: Vec<String> = deps.to_vec();
        let view = self.view.as_mut().expect("a view");
        let base = view.slots;
        view.slots += dep_names.len() + 1;
        let slot = base + dep_names.len();
        let cond = if dep_names.is_empty() {
            format!("$[{slot}] === Symbol.for(\"react.memo_cache_sentinel\")")
        } else {
            dep_names
                .iter()
                .enumerate()
                .map(|(i, d)| format!("$[{}] !== {d}", base + i))
                .collect::<Vec<_>>()
                .join(" || ")
        };
        let mut out = Frag::of(match ty {
            Some(ty) => format!("let {name}: {ty};\n"),
            None => format!("let {name};\n"),
        });
        out.s(&format!("if ({cond}) {{\n"));
        for line in prelude {
            out.f(line).s("\n");
        }
        out.s(&format!("{name} = ")).f(value).s(";\n");
        for (i, d) in dep_names.iter().enumerate() {
            out.s(&format!("$[{}] = {d};\n", base + i));
        }
        out.s(&format!("$[{slot}] = {name};\n}} else {{\n{name} = $[{slot}];\n}}"));
        out
    }

    fn view_decl(&mut self, index: usize, item: &Item, v: &ViewDecl) -> Frag {
        let info = self.ck.views.get(&index).cloned().unwrap_or_default();
        let mut setters = HashMap::default();
        for locals in &info.members {
            for local in locals {
                if self.ck.locals[*local].kind == LocalKind::State {
                    let plain = format!("set{}", capitalised(&self.ck.locals[*local].name));
                    let name = if self.names.contains(&plain) { format!("${plain}") } else { plain };
                    setters.insert(*local, name);
                }
            }
        }
        // The props, and a name for their whole value (`..props: P`), are what a render reads.
        let reactive = info.props.iter().chain(self.ck.whole_props.iter()).copied().collect();
        self.view = Some(ViewState { slots: 0, reactive, setters });
        self.bufs.push(Vec::new());
        // Props.
        let export = if !item.visibility.exported(self.options.modules) || v.kind != ViewKind::View {
            ""
        } else {
            "export "
        };
        let mut props_name = format!("{}Props", v.name.name);
        let mut props_decl = Frag::default();
        if !info.props.is_empty() {
            let params = v.params.as_deref().unwrap_or_default();
            let mut fields = Vec::new();
            let mut targets = Vec::new();
            let mut extends = Vec::new();
            let mut spreads = info.spreads.iter();
            let mut props = info.props.iter();
            for param in params {
                if param.spread {
                    // `..Props`: the interface extends it; its fields are destructured.
                    let Some((ty, range)) = spreads.next() else { continue };
                    let defaults: Vec<FieldDefault> = match ty {
                        Ty::Adt(def, _) => {
                            self.ck.defs[*def].fields().iter().map(|f| f.default.clone()).collect()
                        }
                        _ => Vec::new(),
                    };
                    // A TS interface is extended; a Bloom struct's fields are written out,
                    // those with a default optional.
                    let ts = matches!(ty, Ty::Adt(def, _) if matches!(self.ck.defs[*def].origin, Origin::Ts { .. }));
                    if ts {
                        extends.push(self.ts_type(ty));
                    }
                    for (index, local) in info.props[range.clone()].iter().enumerate() {
                        props.next();
                        if !ts {
                            let optional = if defaults.get(index).is_some_and(|d| *d != FieldDefault::None) {
                                "?"
                            } else {
                                ""
                            };
                            let prop_ty = self.ck.locals[*local].ty.clone();
                            fields.push(format!(
                                "  readonly {}{optional}: {};",
                                prop_key(&self.ck.locals[*local].name),
                                self.ts_type(&prop_ty)
                            ));
                        }
                        let mut target = Frag::of(self.local_name(*local));
                        match defaults.get(index) {
                            Some(FieldDefault::Expr(id)) => {
                                if let Some(value) = self.default_expr(*id) {
                                    target.s(" = ").f(value);
                                }
                            }
                            Some(FieldDefault::Literal(text)) => {
                                target.s(&format!(" = {text}"));
                            }
                            _ => {}
                        }
                        targets.push(target);
                    }
                    continue;
                }
                let Some(local) = props.next() else { break };
                let ty = self.ck.locals[*local].ty.clone();
                let optional = if param.default.is_some() { "?" } else { "" };
                fields.push(format!(
                    "  readonly {}{optional}: {};",
                    prop_key(&param.name.name),
                    self.ts_type(&ty)
                ));
                let mut target = Frag::of(js_name(&param.name.name));
                if let Some(default) = &param.default {
                    target.s(" = ").f(self.expr(default));
                }
                targets.push(target);
            }
            if fields.is_empty() && !extends.is_empty() {
                // Only spreads: the props are their type, under the name it has.
                props_name = extends.join(" & ");
            } else {
                if extends.contains(&props_name) {
                    // `view PostCard(..PostCardProps, …)`: its own name is taken.
                    props_name = format!("{}ViewProps", v.name.name);
                }
                let extends = if extends.is_empty() {
                    String::new()
                } else {
                    format!(" extends {}", extends.join(", "))
                };
                props_decl = Frag::of(format!(
                    "{export}interface {props_name}{extends} {{\n{}\n}}\n",
                    fields.join("\n")
                ));
            }
            let mut line = Frag::of("const ");
            line.f(Frag::join(targets, ", ").wrap("{ ", " }")).s(" = props;");
            self.push_stmt(line);
        }
        for (member, locals) in v.members.iter().zip(&info.members) {
            self.member(member, locals);
        }
        // Tasks: one effect each, with an `AbortController`.
        let root = v
            .body
            .stmts
            .iter()
            .rev()
            .find_map(|s| if let StmtKind::Expr(e) = &s.kind { Some(e) } else { None });
        if let Some(root) = root {
            for (call, watched) in self.effects(root) {
                match watched {
                    Some(ty) => self.change_effect(call, &ty),
                    None => self.task_effect(call),
                }
            }
        }
        // The body, cached on what it reads.
        let deps = self.deps(&v.body.stmts);
        self.bufs.push(Vec::new());
        self.scope = Some(deps.clone());
        self.body_span = Some(v.body.span);
        let mut value = Frag::default();
        for stmt in &v.body.stmts {
            match &stmt.kind {
                StmtKind::Expr(expr) => value = self.child(expr),
                _ => self.stmt(stmt),
            }
        }
        self.scope = None;
        self.body_span = None;
        let prelude = self.bufs.pop().expect("the body");
        let tree = self.temp();
        let memo = self.memo(&tree, None, &deps, prelude, value);
        self.push_stmt(memo);
        self.push_stmt(Frag::of(format!("return {tree};")));
        let lines = self.bufs.pop().expect("the view");
        let slots = self.view.take().expect("the view").slots;
        let mut body = Frag::of("\"use no memo\";\n");
        if slots > 0 {
            self.import_name("react/compiler-runtime", "c");
            body.s(&format!("const $ = $c({slots});\n"));
        }
        for line in lines {
            body.f(line).s("\n");
        }
        let param = if info.props.is_empty() { String::new() } else { format!("props: {props_name}") };
        let name = &v.name.name;
        let (wrapper, module, prefix) = match v.kind {
            ViewKind::View => (
                "view",
                LANGUAGE,
                format!(
                    "{}const {name} = ",
                    if !item.visibility.exported(self.options.modules) { "" } else { "export " }
                ),
            ),
            ViewKind::Screen => ("screen", ROUTER, "export default ".to_string()),
            ViewKind::Layout => ("layout", ROUTER, "export default ".to_string()),
        };
        self.import_name(module, wrapper);
        let mut out = props_decl;
        out.mark(item.span).s(&format!("{prefix}{wrapper}(function {name}({param}) {{\n")).f(body).s("}");
        if let Some(equal) =
            v.members.iter().find_map(|m| if let Member::Equal(e) = m { Some(e) } else { None })
            && v.kind == ViewKind::View
        {
            let body = self.block_body(&equal.body.stmts, Tail::Return, None);
            out.mark(equal.span).s(&format!(
                ", ({}: {props_name}, {}: {props_name}): boolean => ",
                js_name(&equal.old.name),
                js_name(&equal.new.name)
            ));
            out.f(body);
        }
        out.s(");\n");
        // `pub default view`: the module's default export too.
        if v.kind == ViewKind::View && item.visibility == Visibility::PubDefault {
            out.s(&format!("export default {name};\n"));
        }
        out
    }

    /// What an `id:` re-runs for, as effect dependencies: a tuple's values each, so
    /// `id: (a, b)` is `[a, b]` and not a fresh array every render.
    fn dep_values(&mut self, id: &Expr) -> Vec<Frag> {
        match &id.kind {
            ExprKind::Tuple(values) => values.iter().map(|v| self.expr(v)).collect(),
            ExprKind::Paren(inner) => self.dep_values(inner),
            _ => vec![self.expr(id)],
        }
    }

    /// `effect { … }`: one `useEffect` on its reads (or `id:`); the `defer`s at its
    /// top are the cleanup it returns, last first.
    fn effect(&mut self, e: &EffectDecl) {
        self.import_name("react", "useEffect");
        let deps = match &e.id {
            Some(id) => self.dep_values(id),
            None => self.deps(&e.body.stmts).into_iter().map(Frag::of).collect(),
        };
        enum Cleanup {
            Named(String),
            Inline(Frag),
        }
        let mut cleanups = Vec::new();
        self.bufs.push(Vec::new());
        let stmts = &e.body.stmts;
        for (index, stmt) in stmts.iter().enumerate() {
            let StmtKind::Defer(block) = &stmt.kind else {
                self.stmt(stmt);
                continue;
            };
            let body = self.block_body(&block.stmts, Tail::Discard, None);
            if stmts[index..].iter().all(|s| matches!(s.kind, StmtKind::Defer(_))) {
                cleanups.push(Cleanup::Inline(body));
            } else {
                // A cleanup set before more work: named where it is, returned at the end.
                let name = self.temp();
                let mut line = Frag::at(stmt.span, format!("const {name} = () => "));
                line.f(body).s(";");
                self.push_stmt(line);
                cleanups.push(Cleanup::Named(name));
            }
        }
        let lines = self.bufs.pop().expect("the effect");
        let mut out = Frag::at(e.keyword, "useEffect(() => {\n");
        for line in lines {
            out.f(line).s("\n");
        }
        match cleanups.len() {
            0 => {}
            1 => match cleanups.pop().expect("one") {
                Cleanup::Named(name) => {
                    out.s(&format!("return {name};\n"));
                }
                Cleanup::Inline(body) => {
                    out.s("return () => ").f(body).s(";\n");
                }
            },
            _ => {
                out.s("return () => {\n");
                for cleanup in cleanups.into_iter().rev() {
                    match cleanup {
                        Cleanup::Named(name) => out.s(&format!("{name}();\n")),
                        Cleanup::Inline(body) => out.f(body).s("\n"),
                    };
                }
                out.s("};\n");
            }
        }
        out.s("}, ").f(Frag::join(deps, ", ").wrap("[", "]")).s(");");
        self.push_stmt(out);
    }

    fn member(&mut self, member: &Member, locals: &[LocalId]) {
        match member {
            Member::Effect(e) => self.effect(e),
            // `memo`'s comparator: the second argument of `view()`.
            Member::Equal(_) => {}
            Member::State(state) => {
                let local = locals[0];
                let ty = self.ck.locals[local].ty.clone();
                let ts = self.ts_type(&ty);
                let name = self.local_name(local);
                let line = match state.attr {
                    StateAttr::Ref => {
                        self.import_name("react", "useRef");
                        let raw = js_name(&self.ck.locals[local].name);
                        if self.is_view_ref(local) {
                            let inner = match &ty {
                                Ty::Option(inner) => self.ts_type(inner),
                                other => self.ts_type(other),
                            };
                            Frag::at(state.span, format!("const {raw} = useRef<{inner} | null>(null);"))
                        } else {
                            let mut line = Frag::at(state.span, format!("const {raw} = useRef<{ts}>("));
                            line.f(self.expr(&state.value)).s(");");
                            line
                        }
                    }
                    StateAttr::State => {
                        self.import_name("react", "useState");
                        let setter = self.setter(local);
                        let value = self.expr(&state.value);
                        let constant = matches!(
                            state.value.kind,
                            ExprKind::Int(_)
                                | ExprKind::Float(_)
                                | ExprKind::Bool(_)
                                | ExprKind::None
                                | ExprKind::Str { .. }
                        );
                        let mut line =
                            Frag::at(state.span, format!("const [{name}, {setter}] = useState<{ts}>("));
                        if constant {
                            line.f(value);
                        } else {
                            line.s("() => ").f(
                                if matches!(state.value.kind, ExprKind::Call(_))
                                    && value.text.starts_with('{')
                                {
                                    value.wrap("(", ")")
                                } else {
                                    value
                                },
                            );
                        }
                        line.s(");");
                        line
                    }
                    StateAttr::List => {
                        self.import_name(DATA, "useList");
                        let mut line = Frag::at(state.span, format!("const {name} = useList("));
                        line.f(self.expr(&state.value)).s(");");
                        line
                    }
                    StateAttr::Record => {
                        self.import_name(DATA, "useRecord");
                        let mut line = Frag::at(state.span, format!("const {name} = useRecord("));
                        // `Post.record(id)` reads the entity `Post` at `id`.
                        match &state.value.kind {
                            ExprKind::Call(call) if matches!(&call.callee.kind, ExprKind::Field(_, m) if m.name == "record") =>
                            {
                                let ExprKind::Field(entity, _) = &call.callee.kind else { unreachable!() };
                                let mut values = vec![self.expr(entity)];
                                values.extend(self.args(call));
                                line.f(Frag::join(values, ", "));
                            }
                            _ => {
                                line.f(self.expr(&state.value));
                            }
                        }
                        line.s(");");
                        line
                    }
                    StateAttr::Env => {
                        self.import_name(LANGUAGE, "useEnvironment");
                        let mut line = Frag::at(state.span, format!("const {name} = useEnvironment("));
                        line.f(self.expr(&state.value)).s(");");
                        line
                    }
                };
                self.push_stmt(line);
                if state.attr != StateAttr::Ref {
                    self.view.as_mut().expect("a view").reactive.insert(local);
                }
            }
            Member::Let(l) => {
                let kind = locals.first().map(|l| self.ck.locals[*l].kind.clone());
                let annotation = l.ty.as_ref().and_then(|t| self.ck.type_exprs.get(&t.span).cloned());
                let deps = self.expr_deps(&l.value);
                let hook = kind == Some(LocalKind::Hook) || self.ck.hook_lets.contains(&l.span);
                let target = self.binding_target(&l.pattern);
                if hook || trivial(&l.value) {
                    let value = self.expr(&l.value);
                    let annotation =
                        annotation.map(|ty| format!(": {}", self.ts_type(&ty))).unwrap_or_default();
                    let head = if l.pattern.kind == PatternKind::Wildcard {
                        String::new()
                    } else {
                        format!("const {target}{annotation} = ")
                    };
                    let mut line = Frag::at(l.span, head);
                    line.f(value).s(";");
                    self.push_stmt(line);
                    if hook || !deps.is_empty() {
                        self.view.as_mut().expect("a view").reactive.extend(locals.iter().copied());
                    }
                    return;
                }
                self.bufs.push(Vec::new());
                let value = self.expr(&l.value);
                let prelude = self.bufs.pop().expect("the value");
                let (name, destructure) = match &l.pattern.kind {
                    PatternKind::Bind(name) => (js_name(&name.name), false),
                    _ => (self.temp(), true),
                };
                let ty = locals
                    .first()
                    .filter(|_| !destructure)
                    .map(|l| self.ck.locals[*l].ty.clone())
                    .or(annotation);
                let ty = ty.map(|t| self.ts_type(&t));
                let memo = self.memo(&name, ty, &deps, prelude, value);
                self.push_stmt(memo);
                if destructure && l.pattern.kind != PatternKind::Wildcard {
                    self.push_stmt(Frag::of(format!("const {target} = {name};")));
                }
                if !deps.is_empty() {
                    self.view.as_mut().expect("a view").reactive.extend(locals.iter().copied());
                }
            }
            Member::Fn(f) => {
                let local = locals[0];
                let deps = self.deps(&f.body.stmts);
                let reads_view = self.fn_reads_view(f);
                let function = self.function(f, Some(()));
                let name = js_name(&f.name.name);
                if !reads_view {
                    // A handler that reads nothing of its view is a module function.
                    let hoisted = format!("${}", f.name.name);
                    let mut decl = Frag::of(format!("const {hoisted} = "));
                    decl.f(function).s(";");
                    self.hoisted.push(decl);
                    self.hoisted_names.insert(self.ck.locals[local].span, hoisted);
                    return;
                }
                let ty = self.ck.locals[local].ty.clone();
                let ts = self.ts_type(&ty);
                let memo = self.memo(&name, Some(ts), &deps, Vec::new(), function);
                self.push_stmt(memo);
                if !deps.is_empty() {
                    self.view.as_mut().expect("a view").reactive.insert(local);
                }
            }
        }
    }

    /// Whether a member `fn` reads a member, a prop or a state of its view.
    fn fn_reads_view(&self, f: &FnDecl) -> bool {
        let mut reads = false;
        crate::check::walk_stmts(&f.body.stmts, &mut |_, id| {
            let local = match self.ck.names.get(&id) {
                Some(NameRes::Local(local)) => Some(*local),
                _ => self.ck.bindings.get(&id).map(|(l, _)| *l),
            };
            if let Some(local) = local {
                let info = &self.ck.locals[local];
                if info.view.is_some() && !(info.span.start >= f.span.start && info.span.end <= f.span.end) {
                    reads = true;
                }
            }
        });
        reads || stmts_assign(&f.body.stmts)
    }

    /// The `.task` and `.onChange` calls of the body's root chain, in the order
    /// they are written; an `.onChange` with the type it watches.
    fn effects<'e>(&self, root: &'e Expr) -> Vec<(&'e Call, Option<Ty>)> {
        let mut out = Vec::new();
        let mut current = root;
        while let ExprKind::Call(call) = &current.kind {
            match self.ck.calls.get(&current.id) {
                Some(CallRes::Task) => out.push((call, None)),
                Some(CallRes::OnChange(ty)) => out.push((call, Some(ty.clone()))),
                _ => {}
            }
            match &call.callee.kind {
                ExprKind::Field(receiver, _) => current = receiver,
                _ => break,
            }
        }
        out.reverse();
        out
    }

    fn task_effect(&mut self, call: &Call) {
        let Some(trailing) = &call.trailing else { return };
        self.import_name("react", "useEffect");
        let signal = "$signal".to_string();
        let saved = self.signal.replace(signal.clone());
        let body = self.block_body(&trailing.body, Tail::Discard, Some(&signal));
        self.signal = saved;
        let deps: Vec<Frag> = call.args.iter().flat_map(|a| self.dep_values(&a.value)).collect();
        let mut line = Frag::at(
            call.callee.span,
            "useEffect(() => {\nconst $controller = new AbortController();\nconst $signal = $controller.signal;\nvoid (async () => ",
        );
        line.f(body)
            .s(")();\nreturn () => $controller.abort();\n}, ")
            .f(Frag::join(deps, ", ").wrap("[", "]"))
            .s(");");
        self.push_stmt(line);
    }

    /// `.onChange(of: value) { old, new in … }`: one effect on `value`, with the
    /// value it last ran for in a ref, so the first render and an equal value
    /// (`==`, structural) do not run it.
    fn change_effect(&mut self, call: &Call, ty: &Ty) {
        let (Some(trailing), Some(arg)) = (&call.trailing, call.args.first()) else { return };
        self.import_name("react", "useEffect");
        self.import_name("react", "useRef");
        let value = self.path_or_temp(&arg.value);
        let previous = self.temp();
        let ts = self.ts_type(ty);
        self.push_stmt(Frag::of(format!("const {previous} = useRef<{ts}>({value});")));
        let info = self.ck.closures.get(&trailing.span).cloned();
        let params = info.as_ref().map(|i| i.params.clone()).unwrap_or_default();
        let old = match params.first() {
            Some(local) => self.local_name(*local),
            None => self.temp(),
        };
        if let Some(new) = params.get(1) {
            self.aliases.insert(*new, value.clone());
        }
        let same = self.equal(&old, &value, ty, &mut Vec::new());
        let body = self.block_body(&trailing.body, Tail::Discard, None);
        let mut line = Frag::at(
            call.callee.span,
            format!(
                "useEffect(() => {{\nconst {old} = {previous}.current;\nif ({same}) return;\n{previous}.current = {value};\n"
            ),
        );
        if info.is_some_and(|i| i.is_async) {
            line.s("void (async () => ").f(body).s(")();\n");
        } else {
            line.f(body).s("\n");
        }
        line.s(&format!("}}, [{value}]);"));
        self.push_stmt(line);
    }

    // ---- declarations -----------------------------------------------------------

    /// `Name.d.bloom.ts`: what TypeScript importers of the module see.
    fn dts(&mut self, file: &File) -> String {
        let mut out = String::new();
        let mut uses_composed = false;
        for (index, item) in file.items.iter().enumerate() {
            if !item.visibility.exported(self.options.modules)
                && !matches!(&item.kind, ItemKind::View(v) if v.kind != ViewKind::View)
            {
                continue;
            }
            match &item.kind {
                ItemKind::Struct(s) => out.push_str(&self.struct_decl(s, "export ").text),
                ItemKind::Enum(e) => out.push_str(&self.enum_decl(e, "export ").text),
                ItemKind::Alias(_) => out.push_str(&self.item(index, item).text),
                ItemKind::Const(c) => {
                    let local = self.ck.items[&index];
                    let ty = self.ck.locals[local].ty.clone();
                    out.push_str(&format!(
                        "export declare const {}: {};\n",
                        js_name(&c.name.name),
                        self.ts_type(&ty)
                    ));
                }
                ItemKind::Fn(f) => {
                    let local = self.ck.items[&index];
                    let Ty::Fn(fn_ty) = self.ck.locals[local].ty.clone() else { continue };
                    let params: Vec<String> = f
                        .params
                        .iter()
                        .zip(&fn_ty.params)
                        .map(|(p, t)| {
                            if t.rest {
                                return format!("...{}: {}[]", js_name(&p.name.name), self.ts_type(&t.ty));
                            }
                            format!(
                                "{}{}: {}",
                                js_name(&p.name.name),
                                if p.default.is_some() { "?" } else { "" },
                                self.ts_type(&t.ty)
                            )
                        })
                        .collect();
                    let ret = self.ts_return(&fn_ty.ret, fn_ty.is_async);
                    out.push_str(&format!(
                        "export declare function {}{}({}): {ret};\n",
                        js_name(&f.name.name),
                        self.generics(&f.generics),
                        params.join(", ")
                    ));
                }
                ItemKind::View(v) => {
                    let local = self.ck.items[&index];
                    let Ty::Fn(fn_ty) = self.ck.locals[local].ty.clone() else { continue };
                    let mut props_name = format!("{}Props", v.name.name);
                    let spreads = self.ck.views.get(&index).map(|i| i.spreads.clone()).unwrap_or_default();
                    if spreads.iter().any(|(ty, _)| self.ts_type(ty) == props_name) {
                        // `view PostCard(..PostCardProps)`: its own name is taken.
                        props_name = format!("{}ViewProps", v.name.name);
                    }
                    if !fn_ty.params.is_empty() {
                        let fields: Vec<String> = fn_ty
                            .params
                            .iter()
                            .map(|p| {
                                format!(
                                    "  readonly {}{}: {};",
                                    prop_key(p.name.as_deref().unwrap_or_default()),
                                    if p.optional { "?" } else { "" },
                                    self.ts_type(&p.ty)
                                )
                            })
                            .collect();
                        out.push_str(&format!(
                            "export interface {props_name} {{\n{}\n}}\n",
                            fields.join("\n")
                        ));
                    }
                    let props =
                        if fn_ty.params.is_empty() { String::new() } else { format!("props: {props_name}") };
                    match v.kind {
                        ViewKind::View => {
                            uses_composed = true;
                            out.push_str(&format!(
                                "/** A Bloom view: a node factory, not a JSX component. Use it in a chain (`VStack({}())`), or from TSX as `toElement({}())`. */\n",
                                v.name.name, v.name.name
                            ));
                            out.push_str(&format!(
                                "export declare const {}: ({props}) => ComposedView;\n",
                                v.name.name
                            ));
                            if item.visibility == Visibility::PubDefault {
                                out.push_str(&format!("export default {};\n", v.name.name));
                            }
                        }
                        _ => {
                            let props_ty =
                                if fn_ty.params.is_empty() { "{}".to_string() } else { props_name };
                            out.push_str(&format!("declare const _default: import(\"react\").ComponentType<{props_ty}>;\nexport default _default;\n"));
                        }
                    }
                }
            }
        }
        // The private types an exported declaration names are declared (not exported).
        let mut private = String::new();
        loop {
            let mut added = false;
            for item in &file.items {
                if item.visibility.exported(self.options.modules) {
                    continue;
                }
                let name = item.kind.name().name.clone();
                let declared = mentions(&private, &format!("interface {name}"))
                    || mentions(&private, &format!("type {name}"));
                if declared || !(mentions(&out, &name) || mentions(&private, &name)) {
                    continue;
                }
                let text = match &item.kind {
                    ItemKind::Struct(s) => self.struct_decl(s, "").text,
                    ItemKind::Enum(e) => self.enum_decl(e, "").text,
                    ItemKind::Alias(_) => self.item(0, item).text,
                    _ => continue,
                };
                private.push_str(&text);
                added = true;
            }
            if !added {
                break;
            }
        }
        let out = private + &out;
        // Only what the declarations name, imported as types.
        let mut header = String::new();
        for import in &file.imports {
            let ImportKind::Named(specs) = &import.kind else { continue };
            let used: Vec<String> = specs
                .iter()
                .filter(|spec| mentions(&out, &spec.local().name))
                .map(|spec| {
                    if spec.local().name == spec.name.name {
                        spec.name.name.clone()
                    } else {
                        format!("{} as {}", spec.name.name, spec.local().name)
                    }
                })
                .collect();
            if !used.is_empty() {
                header.push_str(&format!(
                    "import type {{ {} }} from {};\n",
                    used.join(", "),
                    string_literal(&import.source)
                ));
            }
        }
        if uses_composed {
            self.type_imports.entry(LANGUAGE.into()).or_default().insert("ComposedView".into());
        }
        for (module, names) in &self.type_imports {
            let names: Vec<&str> = names.iter().map(String::as_str).filter(|n| mentions(&out, n)).collect();
            if !names.is_empty() {
                header.push_str(&format!(
                    "import type {{ {} }} from {};\n",
                    names.join(", "),
                    string_literal(module)
                ));
            }
        }
        if mentions(&out, "$Result") {
            header.push_str("type $Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };\n");
        }
        if mentions(&out, "$KeyPath") {
            header.push_str(KEY_PATH);
        }
        header + &out
    }
}

/// A value cheap enough to recompute on every render: a name, a field, a literal, `!x`.
fn trivial(expr: &Expr) -> bool {
    match &expr.kind {
        ExprKind::Name(_) | ExprKind::Int(_) | ExprKind::Float(_) | ExprKind::Bool(_) | ExprKind::None => {
            true
        }
        ExprKind::Str { parts, .. } => parts.iter().all(|p| matches!(p, StrPart::Text(_))),
        ExprKind::Field(inner, _)
        | ExprKind::OptField(inner, _)
        | ExprKind::Paren(inner)
        | ExprKind::Unary(_, inner) => trivial(inner),
        ExprKind::Binary(op, a, b)
            if !matches!(op, BinaryOp::Add) || !matches!(a.kind, ExprKind::Str { .. }) =>
        {
            trivial(a) && trivial(b)
        }
        _ => false,
    }
}

/// A `for` item spread among its parent's children: one view, not a branch,
/// whose own chain cannot leave (`.transition`; `Presence` keeps those).
fn plain_item(expr: &Expr) -> bool {
    match &expr.kind {
        ExprKind::If(_) | ExprKind::Match(_) => false,
        ExprKind::Paren(inner) => plain_item(inner),
        ExprKind::Call(call) => match &call.callee.kind {
            ExprKind::Field(receiver, name) => name.name != "transition" && plain_item(receiver),
            _ => true,
        },
        ExprKind::Field(receiver, _) => plain_item(receiver),
        _ => true,
    }
}
