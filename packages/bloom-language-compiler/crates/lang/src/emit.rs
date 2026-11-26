//! Typed TypeScript from a checked `.bloom` module (spec section 11).
//!
//! Zero-cost rules: structs and `with` are object literals, fieldless enums
//! are strings, `T?` is `undefined`, `?`/`??`/`?.` are inline. One fiber per
//! `view`; bloomc writes the view's memo cache itself (`c` from
//! `react/compiler-runtime`) from the checker's exact dependencies and marks
//! the body `"use no memo"`. A closure that reads nothing reactive is a module
//! constant. What would read a value twice is a small module-local helper.

use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};

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
    diagnostics: Vec<Diagnostic>,
    view: Option<ViewState>,
    /// The `AbortSignal` of the task being emitted.
    signal: Option<String>,
    /// Inside a conditional operand: `?` cannot return early from here.
    conditional: usize,
    uses_result: bool,
    names: HashSet<String>,
    /// While the body's tree is emitted: what the enclosing cache scope depends on.
    scope: Option<Vec<String>>,
    body_span: Option<Span>,
    /// Where the item being emitted starts: a module constant before it is defined.
    item_start: u32,
}

pub fn emit(file: &File, ck: &CheckResult, _source: &str, _filename: &str, options: &Options) -> Emitted {
    let names: HashSet<String> = ck.locals.iter().map(|l| l.name.clone()).collect();
    let mut defaults = HashMap::new();
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
        hoisted_names: HashMap::new(),
        hoisted_trees: HashMap::new(),
        diagnostics: Vec::new(),
        view: None,
        signal: None,
        conditional: 0,
        uses_result: false,
        names,
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
        let emitted = emitter.item(index, item);
        for hoisted in std::mem::take(&mut emitter.hoisted) {
            items.f(hoisted).s("\n");
        }
        items.f(emitted).s("\n");
    }
    let mut code = Frag::default();
    code.f(emitter.header());
    code.f(body);
    if emitter.uses_result {
        code.s("type $Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };\n");
    }
    for helper in std::mem::take(&mut emitter.helpers) {
        code.s(helper_text(helper)).s("\n");
    }
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

fn string_literal(text: &str) -> String {
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
        "settle" => {
            "async function $settle<T>(value: PromiseLike<T> | T): Promise<$Result<Awaited<T>, Error>> {\n  try {\n    return { ok: true, value: await value };\n  } catch (error) {\n    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };\n  }\n}"
        }
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
        let specifier = match import.source.as_str() {
            "bloom/data" => DATA,
            "bloom/router" => ROUTER,
            "bloom/motion" => LANGUAGE,
            other => other,
        };
        let mut out = Frag::at(import.span, "import ");
        match &import.kind {
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
            Ty::Fn(f) => {
                let params: Vec<String> = f
                    .params
                    .iter()
                    .enumerate()
                    .map(|(i, p)| {
                        let name = p.name.clone().map_or(format!("p{i}"), |n| js_name(&n));
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
            Ty::Foreign(path) if !path.is_empty() && !path.contains("Navigation") => path.to_string(),
            Ty::Param(_, name) => name.to_string(),
            Ty::Foreign(_) | Ty::Var(_) | Ty::Unknown => "unknown".into(),
        }
    }

    fn ts_operand(&mut self, ty: &Ty) -> String {
        let text = self.ts_type(ty);
        if matches!(ty, Ty::Option(_) | Ty::Fn(_) | Ty::Strings(_))
            || text.contains(" | ") && !text.starts_with('(')
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
        if let Some(view) = &self.view {
            let _ = view;
        }
        let info = &self.ck.locals[local];
        if let Some(hoisted) = self.hoisted_names.get(&info.span) {
            return hoisted.clone();
        }
        js_name(&info.name)
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
        let export = if item.visibility == Visibility::Private { "" } else { "export " };
        match &item.kind {
            ItemKind::Struct(s) => self.struct_decl(s, export),
            ItemKind::Enum(e) => self.enum_decl(e, export),
            ItemKind::Alias(a) => {
                let generics = self.generics(&a.generics);
                let ty = self
                    .ck
                    .spans
                    .iter()
                    .find(|(span, _)| *span == a.ty.span)
                    .map(|(_, t)| t.clone())
                    .unwrap_or(Ty::Unknown);
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
            let mut p = Frag::at(param.span, format!("{}: {}", js_name(&param.name.name), self.ts_type(&ty)));
            if let Some(default) = &param.default {
                p.s(" = ").f(self.value_expr(default));
            }
            list.push(p);
        }
        let ret_ty =
            f.ret.as_ref().and_then(|r| self.ck.type_exprs.get(&r.span).cloned()).unwrap_or(Ty::Unit);
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
        match (&expr.kind, tail) {
            (ExprKind::If(if_expr), _) if !self.simple_if(if_expr) || matches!(tail, Tail::Discard) => {
                self.if_stmt(if_expr, tail)
            }
            (ExprKind::Match(m), _) if !self.simple_match(m) || matches!(tail, Tail::Discard) => {
                self.match_stmt(m, tail)
            }
            (_, Tail::Discard) => {
                let value = self.expr(expr);
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
                let mut line = Frag::at(stmt.span, format!("const {target}{annotation} = "));
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
                let mut iter = self.expr(&f.iter);
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
        }
    }

    /// The JS binding a `let` pattern writes (`x`, `{ a, b: c }`, `[a, b]`).
    fn binding_target(&self, pattern: &Pattern) -> String {
        match &pattern.kind {
            PatternKind::Bind(name) => js_name(&name.name),
            PatternKind::Wildcard => "_".into(),
            PatternKind::Tuple(items) => {
                format!("[{}]", items.iter().map(|p| self.binding_target(p)).collect::<Vec<_>>().join(", "))
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
        let (cond, bindings) = self.condition(&if_expr.cond);
        let signal = self.signal.clone();
        self.bufs.push(Vec::new());
        for (name, value) in bindings {
            self.push_stmt(Frag::of(format!("const {name} = {value};")));
        }
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

    /// A condition's test and the names an `if let` binds.
    fn condition(&mut self, cond: &Cond) -> (Frag, Vec<(String, String)>) {
        match cond {
            Cond::Expr(expr) => (self.expr(expr), Vec::new()),
            Cond::Let(pattern, value) => {
                let subject = self.subject(value);
                let value_ty = self.ck.pattern_tys.get(&value.span).cloned().unwrap_or(Ty::Unknown);
                // `if let v = optional` unwraps; any other pattern matches.
                if let (PatternKind::Bind(name), Ty::Option(_)) = (&pattern.kind, &value_ty) {
                    return (
                        Frag::of(format!("{subject} !== undefined")),
                        vec![(js_name(&name.name), subject)],
                    );
                }
                let (tests, bindings) = self.pattern_test(pattern, &subject);
                let test = if tests.is_empty() { "true".to_string() } else { tests.join(" && ") };
                (Frag::of(test), bindings)
            }
        }
    }

    /// A value matched more than once: a path as is, anything else in a temp.
    fn subject(&mut self, value: &Expr) -> String {
        if is_path(value) && !matches!(value.kind, ExprKind::Call(_)) {
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
        let subject = self.subject(&m.scrutinee);
        let signal = self.signal.clone();
        let mut line = Frag::default();
        let count = m.arms.len();
        for (index, arm) in m.arms.iter().enumerate() {
            let (mut tests, bindings) = self.pattern_test(&arm.pattern, &subject);
            let last = index + 1 == count && arm.guard.is_none();
            self.bufs.push(Vec::new());
            for (name, value) in &bindings {
                self.push_stmt(Frag::of(format!("const {name} = {value};")));
            }
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
                    // Bindings a guard reads are inlined into it.
                    let mut text = guard.text;
                    for (name, value) in &bindings {
                        text = replace_word(&text, name, value);
                    }
                    line.s(" && (").s(&text).s(")");
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

    /// A pattern's tests on `subject`, and the names it binds to what.
    fn pattern_test(&mut self, pattern: &Pattern, subject: &str) -> (Vec<String>, Vec<(String, String)>) {
        let ty = self.ck.pattern_tys.get(&pattern.span).cloned().unwrap_or(Ty::Unknown);
        let mut tests = Vec::new();
        let mut bindings = Vec::new();
        match &pattern.kind {
            PatternKind::Wildcard => {}
            PatternKind::Bind(name) => bindings.push((js_name(&name.name), subject.to_string())),
            PatternKind::Literal(expr) => {
                let value = self.expr(expr).text;
                tests.push(format!("{subject} === {value}"));
            }
            PatternKind::None => tests.push(format!("{subject} === undefined")),
            PatternKind::Tuple(items) => {
                for (i, item) in items.iter().enumerate() {
                    let (t, b) = self.pattern_test(item, &format!("{subject}[{i}]"));
                    tests.extend(t);
                    bindings.extend(b);
                }
            }
            PatternKind::Record(fields) => {
                for (name, sub) in fields {
                    let path = format!("{subject}.{}", name.name);
                    match sub {
                        Some(sub) => {
                            let (t, b) = self.pattern_test(sub, &path);
                            tests.extend(t);
                            bindings.extend(b);
                        }
                        None => bindings.push((js_name(&name.name), path)),
                    }
                }
            }
            PatternKind::Or(alternatives) => {
                let alts: Vec<String> = alternatives
                    .iter()
                    .map(|a| {
                        let (t, _) = self.pattern_test(a, subject);
                        if t.is_empty() { "true".into() } else { format!("({})", t.join(" && ")) }
                    })
                    .collect();
                tests.push(format!("({})", alts.join(" || ")));
            }
            PatternKind::Case { name, args, .. } => {
                let args = args.clone().unwrap_or_default();
                let sub = |this: &mut Self,
                           index: usize,
                           path: String,
                           tests: &mut Vec<String>,
                           bindings: &mut Vec<(String, String)>| {
                    if let Some(p) = args.get(index) {
                        let (t, b) = this.pattern_test(p, &path);
                        tests.extend(t);
                        bindings.extend(b);
                    }
                };
                match (&ty, name.name.as_str()) {
                    (Ty::Option(_), "none") => tests.push(format!("{subject} === undefined")),
                    (Ty::Option(_), _) => {
                        tests.push(format!("{subject} !== undefined"));
                        sub(self, 0, subject.to_string(), &mut tests, &mut bindings);
                    }
                    (Ty::Result(..), "ok") => {
                        tests.push(format!("{subject}.ok"));
                        sub(self, 0, format!("{subject}.value"), &mut tests, &mut bindings);
                    }
                    (Ty::Result(..), _) => {
                        tests.push(format!("!{subject}.ok"));
                        sub(self, 0, format!("{subject}.error"), &mut tests, &mut bindings);
                    }
                    (Ty::Adt(def, _), case) => {
                        let d = &self.ck.defs[*def];
                        let Some(variant) = d.variants().iter().find(|v| v.name == case).cloned() else {
                            return (tests, bindings);
                        };
                        if variant.payload.is_empty() {
                            tests.push(format!("{subject} === {}", string_literal(case)));
                        } else {
                            if !d.is_fieldless() && d.variants().iter().any(|v| v.payload.is_empty()) {
                                tests.push(format!("typeof {subject} === \"object\""));
                            }
                            tests.push(format!("{subject}.tag === {}", string_literal(case)));
                            for index in 0..variant.payload.len() {
                                sub(
                                    self,
                                    index,
                                    format!("{subject}.{}", variant.key(index)),
                                    &mut tests,
                                    &mut bindings,
                                );
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        (tests, bindings)
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
    /// statements it needs stay inside it.
    fn conditional_expr(&mut self, expr: &Expr) -> Frag {
        self.conditional += 1;
        self.bufs.push(Vec::new());
        let value = self.operand(expr);
        let stmts = self.bufs.pop().expect("the branch");
        self.conditional -= 1;
        if stmts.is_empty() {
            return value;
        }
        let awaits = stmts.iter().any(|s| s.text.contains("await ")) || value.text.contains("await ");
        let mut out = Frag::of(if awaits { "(await (async () => {\n" } else { "(() => {\n" });
        for s in stmts {
            out.f(s).s("\n");
        }
        out.s("return ").f(value).s(";\n");
        out.s(if awaits { "})())" } else { "})()" });
        out
    }

    fn expr(&mut self, expr: &Expr) -> Frag {
        let mut out = Frag::default();
        out.mark(expr.span);
        out.f(self.expr_inner(expr));
        // A `Foreign` value where Bloom expects a type: TypeScript checks it is one.
        if let Some(ty) = self.ck.foreign_checks.get(&expr.id).cloned() {
            let ty = self.ts_type(&ty);
            if ty != "unknown" {
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
            ExprKind::Name(_) => match self.ck.names.get(&expr.id) {
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
            ExprKind::Paren(inner) => self.expr(inner).wrap("(", ")"),
            ExprKind::Tuple(items) if items.is_empty() => Frag::of("undefined"),
            ExprKind::Tuple(items) => {
                let items: Vec<Frag> = items.iter().map(|i| self.expr(i)).collect();
                Frag::join(items, ", ").wrap("[", "] as const")
            }
            ExprKind::List(items) => {
                let items: Vec<Frag> = items.iter().map(|i| self.expr(i)).collect();
                let list = Frag::join(items, ", ").wrap("[", "]");
                if self.options.dev { list.wrap("Object.freeze(", ")") } else { list }
            }
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
                let mut out = self.operand(cond);
                out.s(" ? ").f(self.conditional_expr(then)).s(" : ").f(self.conditional_expr(otherwise));
                out
            }
            ExprKind::Await(inner) => {
                let value = self.expr(inner);
                match self.ck.awaits.get(&expr.id) {
                    Some(AwaitRes::Ts) => {
                        self.helpers.insert("settle");
                        self.uses_result = true;
                        value.wrap("await $settle(", ")")
                    }
                    _ => value.wrap("await (", ")"),
                }
            }
            ExprKind::Try(inner) => self.try_expr(expr, inner),
            ExprKind::Field(object, name) => self.field(expr, object, name),
            ExprKind::OptField(object, name) => {
                let mut out = self.operand(object);
                out.s("?.").s(&name.name);
                out
            }
            ExprKind::Index(object, index) => {
                let mut out = self.operand(object);
                out.s("[").f(self.expr(index)).s("]");
                out
            }
            ExprKind::Call(call) => self.call(expr, call),
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
        let left = self.operand(lhs);
        let right = if matches!(op, BinaryOp::And | BinaryOp::Or | BinaryOp::Default) {
            self.conditional_expr(rhs)
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
        if self.conditional > 0 {
            self.diagnostics.push(
                Diagnostic::error("B0220", expr.span, "`?` here would return early from inside a condition")
                    .label("evaluated only sometimes")
                    .help("bind it first: `let value = f()?`, then use `value`")
                    .spec("45-enums-option-and-result"),
            );
            return Frag::of("undefined");
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
            let mut out = self.operand(cond);
            out.s(" ? ").f(self.conditional_expr(then)).s(" : ");
            match if_expr.otherwise.as_deref() {
                Some(Else::Block(b)) => {
                    let [Stmt { kind: StmtKind::Expr(e), .. }] = b.stmts.as_slice() else { unreachable!() };
                    out.f(self.conditional_expr(e));
                }
                Some(Else::If(e)) => {
                    out.f(self.expr(e));
                }
                None => {
                    out.s("undefined");
                }
            }
            return out;
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
            let mut out = Frag::default();
            let count = m.arms.len();
            for (index, arm) in m.arms.iter().enumerate() {
                let ArmBody::Expr(body) = &arm.body else { unreachable!() };
                let (tests, _) = self.pattern_test(&arm.pattern, &subject);
                let mut tests = tests;
                if let Some(guard) = &arm.guard {
                    tests.push(self.operand(guard).text);
                }
                if index + 1 == count && arm.guard.is_none() {
                    out.f(self.conditional_expr(body));
                } else {
                    let test = if tests.is_empty() { "true".to_string() } else { tests.join(" && ") };
                    out.s(&format!("({test}) ? ")).f(self.conditional_expr(body)).s(" : ");
                }
            }
            if m.arms.last().is_some_and(|a| a.guard.is_some()) {
                out.s("undefined");
            }
            return out.wrap("(", ")");
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
                    Ty::Var(_) | Ty::Unknown => js_name(&p.name.name),
                    _ => format!("{}: {}", js_name(&p.name.name), self.ts_type(&ty)),
                }
            })
            .collect();
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
                    if matches!(e.kind, ExprKind::Map(_)) { value.wrap("(", ")") } else { value }
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
        if self.view.is_some() && self.reads_only_module(c) {
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

    fn call(&mut self, expr: &Expr, call: &Call) -> Frag {
        let Some(res) = self.ck.calls.get(&expr.id).cloned() else {
            let callee = self.operand(&call.callee);
            let mut out = callee;
            out.f(Frag::join(self.args(call), ", ").wrap("(", ")"));
            return out;
        };
        match res {
            CallRes::Bloom { order } => {
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
                while values.last().is_some_and(|v| v.text == "undefined")
                    && order.last().is_some_and(Option::is_none)
                {
                    values.pop();
                    if values.len() < order.len() && order[values.len()].is_some() {
                        break;
                    }
                }
                let mut out = self.operand(&call.callee);
                out.f(Frag::join(values, ", ").wrap("(", ")"));
                out
            }
            CallRes::Ts => {
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
                if let Some(trailing) = &call.trailing {
                    values.push(self.closure(trailing));
                }
                let mut out = self.operand(&call.callee);
                out.f(Frag::join(values, ", ").wrap("(", ")"));
                out
            }
            CallRes::Struct(def) => self.construct(call, def, false),
            CallRes::Partial(def) => self.construct(call, def, true),
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
                self.import_name(LANGUAGE, ctor);
                let mut values: Vec<Frag> = call.args.iter().map(|a| self.node_arg(&a.value)).collect();
                if let Some(trailing) = &call.trailing {
                    values.extend(self.children(&trailing.body));
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
            // A task runs in an effect of its view: the chain is its receiver.
            CallRes::Task => {
                let ExprKind::Field(receiver, _) = &call.callee.kind else { unreachable!() };
                self.expr(receiver)
            }
            CallRes::View { params } => {
                let order = self.view_order(call, &params);
                let entries: Vec<Frag> = order
                    .into_iter()
                    .map(|(name, arg)| {
                        let mut entry = Frag::of(format!("{}: ", prop_key(&name)));
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
                    .filter_map(|a| a.label.as_ref().map(|l| (l, a)))
                    .map(|(label, a)| {
                        let mut entry = Frag::of(format!("{}: ", prop_key(&label.name)));
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
            CallRes::Sleep => {
                let ms = call.args.first().map_or(Frag::of("0"), |a| self.expr(&a.value));
                ms.wrap("new Promise<void>((resolve) => setTimeout(resolve, ", "))")
            }
        }
    }

    /// A view call's props in parameter order.
    fn view_order(&mut self, call: &Call, params: &[String]) -> Vec<(String, Frag)> {
        let mut out = Vec::new();
        let mut next = 0;
        let mut given: HashMap<String, Frag> = HashMap::new();
        for arg in &call.args {
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
            given.insert(name, value);
        }
        if let Some(trailing) = &call.trailing
            && let Some(name) = params.iter().rev().find(|p| !given.contains_key(*p))
        {
            let value = self.closure(trailing);
            given.insert(name.clone(), value);
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
                let subject = self.subject(&arg.value);
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
        let ExprKind::Field(receiver, _) = &call.callee.kind else { unreachable!() };
        let object = self.operand(receiver);
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
            out.s(&format!(".{method}")).f(Frag::join(args, ", ").wrap("(", ")"));
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
            (Recv::List, "map" | "filter" | "find") => {
                let f = args.first().map(|a| lambda(a, 1)).unwrap_or_default();
                call_on(object, name, vec![f])
            }
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
        let mut out = Vec::new();
        for stmt in stmts {
            match &stmt.kind {
                StmtKind::Let(_) => self.stmt(stmt),
                StmtKind::Expr(expr) => out.push(self.scoped_child(expr)),
                StmtKind::For(f) => {
                    let iter_ty = self.ck.types.get(&f.iter.id).cloned().unwrap_or(Ty::Unknown);
                    let mut iter = self.operand(&f.iter);
                    if matches!(iter_ty, Ty::Map(_)) {
                        iter = iter.wrap("Object.entries(", ")");
                    }
                    let target = self.binding_target(&f.pattern);
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
                    let mut line = iter;
                    line.mark(stmt.span).s(&format!(".map(({target}) => ")).f(body).s(")");
                    out.push(line);
                }
                _ => {}
            }
        }
        out
    }

    /// One child: `if` and `match` keep their slot (`null` when they draw nothing).
    fn child(&mut self, expr: &Expr) -> Frag {
        match &expr.kind {
            ExprKind::If(if_expr) => {
                let (cond, bindings) = self.condition(&if_expr.cond);
                let then = self.branch(&if_expr.then.stmts, &bindings);
                let otherwise = match if_expr.otherwise.as_deref() {
                    Some(Else::If(next)) => self.child(next),
                    Some(Else::Block(block)) => self.branch(&block.stmts, &[]),
                    None => Frag::of("null"),
                };
                let mut out = Frag::at(expr.span, "");
                out.f(cond.wrap("(", ")")).s(" ? ").f(then).s(" : ").f(otherwise);
                out
            }
            ExprKind::Match(m) => {
                let subject = self.subject(&m.scrutinee);
                let mut out = Frag::at(expr.span, "");
                let count = m.arms.len();
                for (index, arm) in m.arms.iter().enumerate() {
                    let (mut tests, bindings) = self.pattern_test(&arm.pattern, &subject);
                    if let Some(guard) = &arm.guard {
                        let mut text = self.operand(guard).text;
                        for (name, value) in &bindings {
                            text = replace_word(&text, name, value);
                        }
                        tests.push(text);
                    }
                    let body = match &arm.body {
                        ArmBody::Expr(e) => self.branch(
                            std::slice::from_ref(&Stmt { kind: StmtKind::Expr(e.clone()), span: e.span }),
                            &bindings,
                        ),
                        ArmBody::Block(b) => self.branch(&b.stmts, &bindings),
                    };
                    if index + 1 == count && arm.guard.is_none() {
                        out.f(body);
                    } else {
                        let test = if tests.is_empty() { "true".to_string() } else { tests.join(" && ") };
                        out.s(&format!("({test}) ? ")).f(body).s(" : ");
                    }
                }
                if m.arms.last().is_some_and(|a| a.guard.is_some()) {
                    out.s("null");
                }
                out.wrap("(", ")")
            }
            _ => self.expr(expr),
        }
    }

    /// A conditional builder branch: its children (one, or a list), with the names it binds.
    fn branch(&mut self, stmts: &[Stmt], bindings: &[(String, String)]) -> Frag {
        self.conditional += 1;
        self.bufs.push(Vec::new());
        for (name, value) in bindings {
            self.push_stmt(Frag::of(format!("const {name} = {value};")));
        }
        let children = self.children(stmts);
        let stmts = self.bufs.pop().expect("the branch");
        self.conditional -= 1;
        let value = match children.len() {
            0 => Frag::of("null"),
            1 => children.into_iter().next().expect("one"),
            _ => Frag::join(children, ", ").wrap("[", "]"),
        };
        if stmts.is_empty() {
            return value;
        }
        let mut out = Frag::of("(() => {\n");
        for s in stmts {
            out.f(s).s("\n");
        }
        out.s("return ").f(value).s(";\n})()");
        out
    }
}

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

/// Calls `f` with the id of every call in `expr` (closures included: a static tree has none).
fn visit_calls(expr: &Expr, f: &mut dyn FnMut(ExprId)) {
    match &expr.kind {
        ExprKind::Call(call) => {
            f(expr.id);
            visit_calls(&call.callee, f);
            call.args.iter().for_each(|a| visit_calls(&a.value, f));
            if let Some(trailing) = &call.trailing {
                for stmt in &trailing.body {
                    match &stmt.kind {
                        StmtKind::Expr(e) => visit_calls(e, f),
                        _ => f(ExprId(u32::MAX)),
                    }
                }
            }
        }
        ExprKind::Field(e, _) | ExprKind::Paren(e) => visit_calls(e, f),
        ExprKind::Int(_)
        | ExprKind::Float(_)
        | ExprKind::Bool(_)
        | ExprKind::None
        | ExprKind::Unit
        | ExprKind::Name(_)
        | ExprKind::ImplicitMember(_) => {}
        ExprKind::Str { parts, .. } if parts.iter().all(|p| matches!(p, StrPart::Text(_))) => {}
        // Anything else (an operator, a closure, a conditional) is not a static tree.
        _ => f(ExprId(u32::MAX)),
    }
}

/// Whether the dependency `outer` changes whenever `inner` does (`auth` covers `auth.x`).
fn covers(outer: &str, inner: &str) -> bool {
    outer == inner
        || inner.strip_prefix(outer).is_some_and(|rest| rest.starts_with('.') || rest.starts_with("?."))
}

/// Replaces whole-word occurrences of `name` in emitted `text`.
fn replace_word(text: &str, name: &str, value: &str) -> String {
    let mut out = String::new();
    let mut rest = text;
    while let Some(at) = rest.find(name) {
        let before = rest[..at].chars().last();
        let after = rest[at + name.len()..].chars().next();
        let word =
            |c: Option<char>| c.is_some_and(|c| c.is_alphanumeric() || c == '_' || c == '$' || c == '.');
        out.push_str(&rest[..at]);
        if word(before) || after.is_some_and(|c| c.is_alphanumeric() || c == '_' || c == '$') {
            out.push_str(name);
        } else {
            out.push_str(value);
        }
        rest = &rest[at + name.len()..];
    }
    out.push_str(rest);
    out
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

fn stmt_awaits(stmt: &Stmt) -> bool {
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
        StmtKind::Return(None) | StmtKind::Defer(_) => {}
    }
    found
}

/// Whether `expr` awaits (closures are their own).
fn expr_awaits(expr: &Expr) -> bool {
    match &expr.kind {
        ExprKind::Await(_) => true,
        ExprKind::Closure(_) => false,
        ExprKind::Paren(e)
        | ExprKind::Unary(_, e)
        | ExprKind::Try(e)
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
            | ExprKind::Unary(_, e)
            | ExprKind::Await(e)
            | ExprKind::Try(e)
            | ExprKind::Field(e, _)
            | ExprKind::OptField(e, _) => go(e),
            ExprKind::Tuple(items) | ExprKind::List(items) => items.iter().for_each(go),
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
        // A subtree of nodes that reads nothing of the view is built once, at module scope.
        if self.static_tree(expr) {
            let value = self.child(expr);
            // The same tree twice is one constant.
            if let Some(name) = self.hoisted_trees.get(&value.text) {
                return Frag::of(name.clone());
            }
            let name = format!("$view{}", self.hoisted_trees.len());
            self.hoisted_trees.insert(value.text.clone(), name.clone());
            let mut decl = Frag::of(format!("const {name} = "));
            decl.f(value).s(";");
            self.hoisted.push(decl);
            return Frag::of(name);
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

    /// Whether `expr` builds nodes only (node, modifier and component calls, literals)
    /// from names already defined at module scope: the same value on every render.
    fn static_tree(&self, expr: &Expr) -> bool {
        let mut only_nodes = true;
        let mut calls = 0;
        visit_calls(expr, &mut |id| {
            calls += 1;
            if !matches!(
                self.ck.calls.get(&id),
                Some(
                    CallRes::Node(_)
                        | CallRes::Modifier { .. }
                        | CallRes::Component
                        | CallRes::EnumCase(..)
                        | CallRes::Struct(_)
                )
            ) {
                only_nodes = false;
            }
        });
        if !only_nodes || calls == 0 || matches!(expr.kind, ExprKind::Name(_)) {
            return false;
        }
        let mut module = true;
        crate::check::walk_names(expr, &mut |_, id| match self.ck.names.get(&id) {
            Some(NameRes::Local(local)) => {
                let info = &self.ck.locals[*local];
                let defined = match info.kind {
                    LocalKind::Import { .. } | LocalKind::Component { .. } | LocalKind::ModuleFn => true,
                    LocalKind::ModuleConst | LocalKind::View => info.span.start < self.item_start,
                    _ => false,
                };
                if !defined || info.frame != 0 {
                    module = false;
                }
            }
            None => {
                if self.ck.bindings.contains_key(&id) {
                    module = false;
                }
            }
        });
        module
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
        let mut setters = HashMap::new();
        for locals in &info.members {
            for local in locals {
                if self.ck.locals[*local].kind == LocalKind::State {
                    let plain = format!("set{}", capitalised(&self.ck.locals[*local].name));
                    let name = if self.names.contains(&plain) { format!("${plain}") } else { plain };
                    setters.insert(*local, name);
                }
            }
        }
        self.view = Some(ViewState { slots: 0, reactive: info.props.iter().copied().collect(), setters });
        self.bufs.push(Vec::new());
        // Props.
        let export =
            if item.visibility == Visibility::Private || v.kind != ViewKind::View { "" } else { "export " };
        let props_name = format!("{}Props", v.name.name);
        let mut props_decl = Frag::default();
        if !info.props.is_empty() {
            let params = v.params.as_deref().unwrap_or_default();
            let mut fields = Vec::new();
            let mut targets = Vec::new();
            for (param, local) in params.iter().zip(&info.props) {
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
            props_decl = Frag::of(format!("{export}interface {props_name} {{\n{}\n}}\n", fields.join("\n")));
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
            for task in self.tasks(root) {
                self.task_effect(task);
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
                    if item.visibility == Visibility::Private { "" } else { "export " }
                ),
            ),
            ViewKind::Screen => ("screen", ROUTER, "export default ".to_string()),
            ViewKind::Layout => ("layout", ROUTER, "export default ".to_string()),
        };
        self.import_name(module, wrapper);
        let mut out = props_decl;
        out.mark(item.span).s(&format!("{prefix}{wrapper}(function {name}({param}) {{\n")).f(body).s("});\n");
        out
    }

    fn member(&mut self, member: &Member, locals: &[LocalId]) {
        match member {
            Member::State(state) => {
                let local = locals[0];
                let ty = self.ck.locals[local].ty.clone();
                let ts = self.ts_type(&ty);
                let name = self.local_name(local);
                let line = match state.attr {
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
                self.view.as_mut().expect("a view").reactive.insert(local);
            }
            Member::Let(l) => {
                let kind = locals.first().map(|l| self.ck.locals[*l].kind.clone());
                let annotation = l.ty.as_ref().and_then(|t| self.ck.type_exprs.get(&t.span).cloned());
                let deps = self.expr_deps(&l.value);
                let hook = kind == Some(LocalKind::Hook);
                let target = self.binding_target(&l.pattern);
                if hook || trivial(&l.value) {
                    let value = self.expr(&l.value);
                    let annotation =
                        annotation.map(|ty| format!(": {}", self.ts_type(&ty))).unwrap_or_default();
                    let mut line = Frag::at(l.span, format!("const {target}{annotation} = "));
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
                if destructure {
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

    /// The `.task` calls of the body's root chain, outermost first.
    fn tasks<'e>(&self, root: &'e Expr) -> Vec<&'e Call> {
        let mut out = Vec::new();
        let mut current = root;
        while let ExprKind::Call(call) = &current.kind {
            if self.ck.calls.get(&current.id) == Some(&CallRes::Task) {
                out.push(call);
            }
            match &call.callee.kind {
                ExprKind::Field(receiver, _) => current = receiver,
                _ => break,
            }
        }
        out
    }

    fn task_effect(&mut self, call: &Call) {
        let Some(trailing) = &call.trailing else { return };
        self.import_name("react", "useEffect");
        let signal = "$signal".to_string();
        let saved = self.signal.replace(signal.clone());
        let body = self.block_body(&trailing.body, Tail::Discard, Some(&signal));
        self.signal = saved;
        let deps: Vec<Frag> = call.args.iter().map(|a| self.expr(&a.value)).collect();
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

    // ---- declarations -----------------------------------------------------------

    /// `Name.d.bloom.ts`: what TypeScript importers of the module see.
    fn dts(&mut self, file: &File) -> String {
        let mut out = String::new();
        let mut uses_composed = false;
        for (index, item) in file.items.iter().enumerate() {
            if item.visibility == Visibility::Private
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
                    let props_name = format!("{}Props", v.name.name);
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
                                "export declare const {}: ({props}) => ComposedView;\n",
                                v.name.name
                            ));
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
        let mut header = String::new();
        for import in &file.imports {
            header.push_str(&self.import(import).text);
        }
        if uses_composed {
            self.type_imports.entry(LANGUAGE.into()).or_default().insert("ComposedView".into());
        }
        for (module, names) in &self.type_imports {
            let names: Vec<&str> = names.iter().map(String::as_str).collect();
            header.push_str(&format!(
                "import type {{ {} }} from {};\n",
                names.join(", "),
                string_literal(module)
            ));
        }
        if self.uses_result {
            header.push_str("type $Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };\n");
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
