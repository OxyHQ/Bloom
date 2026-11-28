//! `--target kotlin-compose`: a checked Bloom program as Kotlin and Jetpack Compose.
//!
//! | Bloom | Kotlin |
//! |---|---|
//! | `struct Post: Equatable { let id: String; var likes: Int = 0 }` | `data class Post(val id: String, val likes: Int = 0)`: value semantics, `==` derived |
//! | `enum PrefKey { case likes … }` | `enum class PrefKey { likes, … }` |
//! | `enum PostKind { case text; case image(url: String) }` | `sealed interface PostKind` with `data object Text` and `data class Image(val url: String)` |
//! | `extension Post { func liked(_ on: Bool) -> Post; var age: String {…} }` | extension functions and properties |
//! | `func f(of name: String) async throws -> T` | `suspend fun f(of: String): T`: labels are Kotlin parameter names |
//! | `struct Row: View { let post: Post; @State var x = 0; func f() {…}; var body … }` | `@Composable fun Row(post: Post, modifier: Modifier = Modifier)`, `var x by remember { mutableStateOf(0) }`, a local `fun f()` |
//! | `.task { … }`, `.onAppear { … }`, `.onChange(of: v) { old, new in … }` | `LaunchedEffect(Unit) { … }`, `OnChange(v) { old, new -> … }` |
//! | `task { await f() }` | `scope.launch { f() }` over `rememberCoroutineScope()` |
//! | `VStack(spacing: .lg) { … }.padding(.horizontal, .lg)` | `VStack(spacing = Space.lg, modifier = Modifier.bloomPadding(Edge.horizontal, Space.lg)) { … }` |
//! | `switch x { case .a: …; case .b(let v): … }` | `when (val s = x) { X.a -> …; is X.B -> { val v = s.v; … } }` |
//!
//! The views (`VStack`, `Toggle`, `GroupedSection`, `Action`…) and the standard library
//! (`range`, `sleep(for:)`, `ContinuousClock`, `print`) are the Kotlin runtime in
//! `runtime/android/` (`so.oxy.bloom.ui`), drawn with Compose Foundation, not Material.

use std::collections::{BTreeSet, HashMap};
use std::fmt::Write as _;
use std::path::PathBuf;

use bloom_lang::ast::*;
use bloom_lang::backend::Ty;

use crate::{
    Decls, Emitted, EnumInfo, ParamInfo, Problem, Program, SourceFile, escape, is_synthetic, static_name,
    upper_first,
};

const KEYWORDS: &[&str] = &[
    "as",
    "break",
    "class",
    "continue",
    "do",
    "else",
    "false",
    "for",
    "fun",
    "if",
    "in",
    "interface",
    "is",
    "null",
    "object",
    "package",
    "return",
    "super",
    "this",
    "throw",
    "true",
    "try",
    "typealias",
    "typeof",
    "val",
    "var",
    "when",
    "while",
];

fn kw(name: &str) -> String {
    escape(name, KEYWORDS)
}

/// The Kotlin package of a Bloom module.
pub fn package_of(app: &str, module: &str) -> String {
    format!("bloom.{}.{}", app.to_lowercase(), module.to_lowercase())
}

pub fn emit(program: &Program) -> Result<Vec<Emitted>, Vec<Problem>> {
    let (out, problems) = emit_all(program);
    if problems.is_empty() { Ok(out) } else { Err(problems) }
}

/// Every file's Kotlin, and the constructs left uncovered in it (as `TODO()`).
pub fn emit_all(program: &Program) -> (Vec<Emitted>, Vec<Problem>) {
    let mut out = Vec::new();
    let mut problems = Vec::new();
    let package_for = |m: &crate::Module| {
        if m.std { "so.oxy.bloom.std".to_string() } else { package_of(&program.name, &m.name) }
    };
    let packages: Vec<String> = program.modules.iter().filter(|m| !m.std).map(package_for).collect();
    for module in &program.modules {
        let package = package_for(module);
        let island = program.islands.contains(&module.name).then_some(module.name.as_str());
        for file in &module.files {
            let mut e = Emitter::new(&program.decls, file);
            e.island = island;
            let text = e.file(&package, &packages);
            problems.extend(e.problems);
            let stem = file.path.file_stem().unwrap_or_default().to_string_lossy().into_owned();
            let dir: PathBuf = package.split('.').collect();
            out.push(Emitted { path: dir.join(format!("{stem}.kt")), text });
        }
    }
    (out, problems)
}

/// What a block of statements is emitted as.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Mode {
    /// A function's body whose last expression is its value (`return` is written).
    Value,
    /// Statements whose values are dropped.
    Unit,
    /// A lambda's body: its last expression is its value, without `return`.
    Lambda,
    /// A view builder: each expression is a view, drawn.
    View,
}

struct Emitter<'a> {
    decls: &'a Decls,
    file: &'a SourceFile,
    problems: Vec<Problem>,
    /// The view being emitted uses `task { }`: it needs a coroutine scope.
    needs_scope: bool,
    /// Names bound in the current function to their Bloom types, where known (receivers).
    locals: Vec<HashMap<String, String>>,
    /// `$0` in the closure being emitted is Kotlin's `it`.
    shorthand_it: bool,
    /// The enum the statement being emitted switches over, for its patterns.
    fresh: u32,
    /// The layout scopes the view being emitted is drawn in, innermost last: `row` (an
    /// `HStack`'s `RowScope`), `column` (a `VStack`'s), or `other` (a box, a list, a lambda).
    scopes: Vec<&'static str>,
    /// Emitting an actor's members: its methods run isolated.
    actor: bool,
    /// `return` inside a lambda body (an actor's `isolated { }`): `return@label`.
    return_label: Option<String>,
    /// In a `ViewModifier`'s body: its `content` parameter (the view it wraps).
    modifier_content: Option<String>,
    /// The type parameters of the type whose members are being emitted.
    owner_generics: Vec<String>,
    /// The Kotlin package of the file being emitted.
    package: String,
    /// The file's private items' names (a public inline view may not call them).
    private_names: Vec<String>,
    /// In a function with `Codable` witnesses: each type parameter's codec parameter.
    codecs: HashMap<String, String>,
    /// The view's `@Binding` props: a read is `.value`, a write `.set(…)`, `$x` the binding.
    binding_props: std::collections::HashSet<String>,
    /// Static members of the item being emitted: top-level declarations (`Post__decode`),
    /// written after it. A static member has no companion object, so a call site, a derived
    /// coder and a witness all name it one way, as the TypeScript backend's `Post$$decode`.
    hoisted: String,
    /// The module being emitted is a Compose island: its view of the same name gets the entry
    /// the island host calls (`island_entry`).
    island: Option<&'a str>,
}

/// A view expression unwound: the node or view call at its base, and the modifiers on it
/// in source order (innermost first).
struct Chain<'e> {
    name: &'e str,
    call: &'e Call,
    mods: Vec<(&'e str, &'e Call)>,
}

fn unwind(expr: &Expr) -> Option<Chain<'_>> {
    let mut mods = Vec::new();
    let mut at = expr;
    loop {
        let ExprKind::Call(call) = &at.kind else { return None };
        match &call.callee.kind {
            ExprKind::Field(inner, name) => {
                mods.push((name.name.as_str(), call));
                at = inner;
            }
            ExprKind::Name(name) => {
                mods.reverse();
                return Some(Chain { name, call, mods });
            }
            _ => return None,
        }
    }
}

/// Whether a statement of a stack's body draws a view that fills the stack's width
/// (`.frame(width: .full)` on it).
fn fills_width(stmt: &Stmt) -> bool {
    let StmtKind::Expr(e) = &stmt.kind else { return false };
    let mut at = e;
    loop {
        match &at.kind {
            ExprKind::Call(call) => {
                if let ExprKind::Field(inner, name) = &call.callee.kind {
                    if name.name == "frame"
                        && call.args.iter().any(|a| {
                            a.label.as_ref().is_some_and(|l| l.name == "width")
                                && matches!(&a.value.kind, ExprKind::ImplicitMember(m) if m.name == "full")
                        })
                    {
                        return true;
                    }
                    at = inner;
                } else {
                    return false;
                }
            }
            ExprKind::Paren(inner) => at = inner,
            _ => return false,
        }
    }
}

/// The built-in nodes the runtime draws (BloomUI's names, as Bloom writes them).
const NODES: &[&str] = &[
    "Text",
    "Icon",
    "Avatar",
    "Image",
    "Spacer",
    "ProgressView",
    "Toggle",
    "TextField",
    "Button",
    "VStack",
    "HStack",
    "ZStack",
    "ScrollView",
    "ScrollArea",
    "VirtualList",
    "List",
    "GroupedSection",
    "GroupedSectionItem",
    "ActionBar",
    "Action",
    "NavigationStack",
    "Divider",
    "Tabs",
    "TabItem",
    "Video",
];

/// A modifier's category, from the spec (`modifierCategories`): `node` when it is an option
/// of its node's own implementation.
fn category(name: &str) -> &'static str {
    bloom_language_compiler::spec::MODIFIER_CATEGORIES
        .iter()
        .find(|(m, _)| *m == name)
        .map_or("node", |(_, c)| c)
}

/// A modifier drawn around any node: a layout or paint modifier (by the spec's category), a
/// `Modifier` extension of the runtime (`Modifier.bloomPadding`). Text traits, environment
/// values and a node's own options are its parameters.
fn universal(name: &str) -> bool {
    name == "onTapGesture" || matches!(category(name), "layout" | "paint")
}

/// The token class an implicit member is read from, by the modifier or argument it is in.
fn token_class(node: &str, param: &str) -> &'static str {
    match (node, param) {
        (_, "spacing") => "Space",
        ("HStack", "alignment" | "align") => "VAlign",
        ("VStack", "alignment" | "align") => "HAlign",
        ("ZStack", "alignment") => "Align",
        (_, "font") => "Font",
        (_, "foregroundStyle") | (_, "foreground") | (_, "background") => "Colors",
        ("Avatar", "size") => "AvatarSize",
        ("Icon", "size") => "IconSize",
        (_, "size") | (_, "controlSize") => "ControlSize",
        ("Button", "style" | "buttonStyle") => "ButtonStyle",
        ("Tabs", "style") => "TabsStyle",
        (_, "contentFit") => "ContentFit",
        (_, "corner") => "Corner",
        (_, "tint") => "Tone",
        (_, "icon") => "Icons",
        (_, "edge") => "Edge",
        (_, "length") => "Length",
        (_, "weight") => "Weight",
        (_, "leading") => "Leading",
        (_, "borderColor") => "Colors",
        (_, "borderWidth") => "BorderWidth",
        (_, "borderEdge") => "BorderEdge",
        (_, "axis") => "Axis",
        _ => "Tokens",
    }
}

impl<'a> Emitter<'a> {
    fn new(decls: &'a Decls, file: &'a SourceFile) -> Self {
        Emitter {
            decls,
            file,
            problems: Vec::new(),
            needs_scope: false,
            locals: vec![HashMap::new()],
            shorthand_it: false,
            fresh: 0,
            scopes: Vec::new(),
            actor: false,
            return_label: None,
            modifier_content: None,
            owner_generics: Vec::new(),
            binding_props: Default::default(),
            package: String::new(),
            private_names: Vec::new(),
            codecs: HashMap::new(),
            hoisted: String::new(),
            island: None,
        }
    }

    fn unsupported(&mut self, span: Span, what: impl Into<String>) -> String {
        self.problems.push(Problem {
            file: self.file.path.clone(),
            span,
            message: format!("kotlin-compose: {} is not supported by this backend yet", what.into()),
        });
        "TODO()".into()
    }

    fn type_at(&self, span: Span) -> Option<&str> {
        self.file.types.get(&span).map(|s| s.as_str())
    }

    /// A checker type as Kotlin writes it, where it has one (`[String: [Post]]` is
    /// `Map<String, List<Post>>`): what an empty literal or a narrowed binding is annotated with.
    fn kty(&self, ty: &Ty) -> Option<String> {
        Some(match ty {
            Ty::Int => "Long".into(),
            Ty::Float => "Double".into(),
            Ty::Bool => "Boolean".into(),
            Ty::Str => "String".into(),
            Ty::Unit => "Unit".into(),
            Ty::Date => "Date".into(),
            Ty::JsError => "Throwable".into(),
            Ty::List(t) => format!("List<{}>", self.kty(t)?),
            Ty::Map(v) => format!("Map<String, {}>", self.kty(v)?),
            Ty::JsMap(k, v) => format!("Map<{}, {}>", self.kty(k)?, self.kty(v)?),
            Ty::Set(t) => format!("Set<{}>", self.kty(t)?),
            Ty::Option(t) => {
                let inner = self.kty(t)?;
                if inner.ends_with('?') || inner.contains("->") {
                    format!("({inner})?")
                } else {
                    format!("{inner}?")
                }
            }
            Ty::Result(a, b) => format!("BloomResult<{}, {}>", self.kty(a)?, self.kty(b)?),
            Ty::Tuple(items) if items.len() == 2 => {
                format!("Pair<{}, {}>", self.kty(&items[0])?, self.kty(&items[1])?)
            }
            Ty::Tuple(items) if items.len() == 3 => {
                format!(
                    "Triple<{}, {}, {}>",
                    self.kty(&items[0])?,
                    self.kty(&items[1])?,
                    self.kty(&items[2])?
                )
            }
            Ty::Param(_, name) => name.to_string(),
            Ty::Foreign(_) => "Any?".into(),
            Ty::Adt(id, args) => {
                let def = self.file.checked.defs.get(*id)?;
                if args.is_empty() {
                    def.name.clone()
                } else {
                    let args: Option<Vec<String>> = args.iter().map(|a| self.kty(a)).collect();
                    format!("{}<{}>", def.name, args?.join(", "))
                }
            }
            _ => return None,
        })
    }

    /// The checker's type of the binding declared at `span` (a `let`, a `guard let`'s name).
    fn binding_ty(&self, span: Span) -> Option<String> {
        let local = self.file.checked.locals.iter().find(|l| l.span == span)?;
        self.kty(&local.ty)
    }

    /// Whether the name `e` is a local binding (a parameter, a `let`), by the checker.
    fn is_local(&self, e: &Expr) -> bool {
        self.file.checked.names.contains_key(&e.id)
    }

    /// The checker's type of `e` (the checked IR, by expression id).
    fn ty_of(&self, e: &Expr) -> Option<&Ty> {
        self.file.checked.types.get(&e.id)
    }

    /// `ty` as Bloom writes it, from the checker's definitions.
    fn bloom_name(&self, ty: &Ty) -> String {
        bloom_lang::backend::display(ty, &self.file.checked)
    }

    /// The definition an expression's type names (a struct, an enum, a class).
    fn def_of(&self, e: &Expr) -> Option<&bloom_lang::backend::Def> {
        match self.ty_of(e)? {
            Ty::Adt(id, _) => self.file.checked.defs.get(*id),
            Ty::Option(inner) => match inner.as_ref() {
                Ty::Adt(id, _) => self.file.checked.defs.get(*id),
                _ => None,
            },
            _ => None,
        }
    }

    fn file(&mut self, package: &str, packages: &[String]) -> String {
        self.package = package.to_string();
        self.private_names = self
            .file
            .ast
            .items
            .iter()
            .filter(|i| i.visibility == Visibility::Private)
            .filter_map(|i| match &i.kind {
                ItemKind::View(v) => Some(v.name.name.clone()),
                ItemKind::Fn(f) => Some(f.name.name.clone()),
                ItemKind::Struct(s) => Some(s.name.name.clone()),
                ItemKind::Const(c) => Some(c.name.name.clone()),
                ItemKind::Enum(e) => Some(e.name.name.clone()),
                ItemKind::Class(c) => Some(c.name.name.clone()),
                _ => None,
            })
            .collect();
        let mut out = String::new();
        let _ = writeln!(
            out,
            "// Generated by bloom-native --target kotlin-compose from {}. Do not edit.",
            self.file_name()
        );
        out.push_str("@file:Suppress(\"UNUSED_VARIABLE\", \"UNUSED_PARAMETER\", \"NAME_SHADOWING\", \"unused\", \"RedundantSuppression\")\n\n");
        let _ = writeln!(out, "package {package}\n");
        if package == "so.oxy.bloom.std" {
            // The standard library draws nothing: Compose's runtime (its stability annotations
            // and state) only.
            out.push_str("import androidx.compose.runtime.*\n");
        } else {
            out.push_str("import androidx.compose.runtime.*\nimport androidx.compose.ui.Modifier\nimport kotlinx.coroutines.launch\nimport so.oxy.bloom.ui.*\nimport so.oxy.bloom.std.*\n");
        }
        // The standard library sees no app module.
        for other in packages.iter().filter(|p| p.as_str() != package && package != "so.oxy.bloom.std") {
            let _ = writeln!(out, "import {other}.*");
        }
        out.push('\n');
        let items = self.file.ast.items.clone();
        let derived = self.derived_items();
        for item in &items {
            let text = self.item(item);
            if !text.is_empty() {
                out.push_str(&text);
                out.push('\n');
            }
            let hoisted = std::mem::take(&mut self.hoisted);
            if !hoisted.is_empty() {
                out.push_str(&hoisted);
                out.push('\n');
            }
            // The island's entry, beside the view named after its module.
            if let ItemKind::View(v) = &item.kind
                && self.island == Some(v.name.name.as_str())
            {
                out.push_str(&self.island_entry(v));
                out.push('\n');
            }
            // What the compiler derives for a type (`Codable`'s coders), beside it.
            if let Some(name) = Self::item_type_name(item) {
                for d in derived.iter().filter(|(owner, _)| owner == name) {
                    let text = self.item(&d.1);
                    out.push_str(&text);
                    out.push('\n');
                }
            }
        }
        out
    }

    /// `<Island>__island(props, emit)`: what the island host (`bloom build`'s `IslandRegistry`,
    /// #1074) draws. `props` is the React Native side's JSON object of the view's props: each
    /// is decoded by its type's `Codable` decoder, remembered by its own JSON value, so a props
    /// change re-decodes only what changed (and Compose skips what is equal). Each event prop
    /// (`(T) -> Void`) emits its name and its value's JSON, which `onIslandEvent` carries out.
    fn island_entry(&mut self, v: &ViewDecl) -> String {
        let name = v.name.name.clone();
        let mut body =
            String::from("  val json = remember(props) { JSON__parse(props.ifEmpty { \"{}\" }) }\n");
        let mut args = Vec::new();
        for p in v.params.iter().flatten() {
            let prop = p.name.name.clone();
            let at = format!("{name}.{prop}");
            let value = format!("jsonField(json, \"{prop}\", \"{name}\")");
            match &p.ty.kind {
                TypeKind::Fn { params, ret, .. } if is_void(ret) => {
                    let emit = match params.as_slice() {
                        [] => format!("{{ emit(\"{prop}\", \"null\") }}"),
                        [one] => match coder(one, false) {
                            Some(enc) => format!("{{ v -> emit(\"{prop}\", JSON__stringify(({enc})(v))) }}"),
                            None => self.unsupported(one.span, "an island event of a type with no encoder"),
                        },
                        _ => self.unsupported(p.ty.span, "an island event with more than one value"),
                    };
                    args.push(format!("{} = {emit}", kw(&prop)));
                }
                _ => {
                    let optional = matches!(p.ty.kind, TypeKind::Optional(_));
                    let decode = match (&p.default, optional) {
                        (Some(d), false) => {
                            let wrapped = TypeExpr {
                                kind: TypeKind::Optional(Box::new(p.ty.clone())),
                                span: p.ty.span,
                            };
                            let d = self.expr(d);
                            coder(&wrapped, true).map(|dec| format!("({dec})(member, \"{at}\") ?: {d}"))
                        }
                        _ => coder(&p.ty, true).map(|dec| format!("({dec})(member, \"{at}\")")),
                    };
                    let Some(decode) = decode else {
                        self.unsupported(p.ty.span, "an island prop of a type with no decoder");
                        continue;
                    };
                    let local = format!("p_{prop}");
                    let _ = writeln!(body, "  val {local}Json = {value}");
                    let _ = writeln!(
                        body,
                        "  val {local} = remember({local}Json) {{ val member = {local}Json; {decode} }}"
                    );
                    args.push(format!("{} = {local}", kw(&prop)));
                }
            }
        }
        format!(
            "/** The island host's entry for `{name}` (`IslandRegistry`): its props decoded from `props`, its events to `emit`. */\n@Composable\nfun {name}__island(props: String, emit: (String, String) -> Unit) {{\n{body}  {name}({})\n}}\n",
            args.join(", ")
        )
    }

    fn item_type_name(item: &Item) -> Option<&str> {
        match &item.kind {
            ItemKind::Struct(s) => Some(&s.name.name),
            ItemKind::Enum(e) => Some(&e.name.name),
            _ => None,
        }
    }

    /// The derived `Codable` members of the file's types, from the checked tree (`codable.rs`:
    /// `T$$decode`, `T$$encode` and `T$$self`, typed by the checker), by their type.
    fn derived_items(&self) -> Vec<(String, Item)> {
        self.file
            .lowered
            .items
            .iter()
            .filter(|i| is_synthetic(i.span))
            .filter_map(|i| {
                let name = match &i.kind {
                    ItemKind::Fn(f) => &f.name.name,
                    ItemKind::Const(c) => &c.name.name,
                    _ => return None,
                };
                let (owner, member, true) = bloom_lang::backend::demangle(name)? else { return None };
                matches!(member, "decode" | "encode" | "self").then(|| (owner.to_string(), i.clone()))
            })
            .collect()
    }

    fn is_std(&self) -> bool {
        self.package == "so.oxy.bloom.std"
    }

    fn file_name(&self) -> String {
        self.file.path.file_name().unwrap_or_default().to_string_lossy().into_owned()
    }

    fn visibility(v: Visibility) -> &'static str {
        match v {
            Visibility::Private => "private ",
            _ => "",
        }
    }

    // ---- types -------------------------------------------------------------------------

    fn ty(&mut self, t: &TypeExpr) -> String {
        match &t.kind {
            TypeKind::Named { name, args } => {
                let base = match name.name.as_str() {
                    "Bool" => "Boolean".to_string(),
                    // `Int` is 64-bit in the language (ADR 0003), as Swift's is.
                    "Int" => "Long".to_string(),
                    "Float" | "Double" => "Double".to_string(),
                    "String" | "Character" => "String".to_string(),
                    "Void" | "Unit" => "Unit".to_string(),
                    // `fatal()`: it never returns.
                    "Never" => "Nothing".to_string(),
                    // A view value (a prop, a builder's result): something to draw.
                    "View" => return "@Composable () -> Unit".into(),
                    "Self" => return "Self".into(),
                    // `Foreign<"unknown">` (`JSONValue`): a value of the platform's own.
                    "Foreign" => return "Any?".into(),
                    // Bloom's `Result` (`ok` / `err`), not Kotlin's.
                    "Result" if args.len() == 2 => {
                        return format!("BloomResult<{}, {}>", self.ty(&args[0]), self.ty(&args[1]));
                    }
                    // `any P`: a value of a type conforming to `P` is a `P` (an interface).
                    "any" if args.len() == 1 => return self.ty(&args[0]),
                    "Set" if args.len() == 1 => return format!("Set<{}>", self.ty(&args[0])),
                    // What `throw` throws and `catch` binds.
                    "Error" if args.is_empty() => return "Throwable".into(),
                    other => other.to_string(),
                };
                if args.is_empty() {
                    base
                } else {
                    let args: Vec<String> = args.iter().map(|a| self.ty(a)).collect();
                    format!("{base}<{}>", args.join(", "))
                }
            }
            TypeKind::List(inner) => format!("List<{}>", self.ty(inner)),
            TypeKind::Map(k, v) => format!("Map<{}, {}>", self.ty(k), self.ty(v)),
            TypeKind::Optional(inner) => {
                let inner = self.ty(inner);
                // `(() -> Unit)?`: a function type takes parentheses before its `?`.
                if inner.contains("->") { format!("({inner})?") } else { format!("{inner}?") }
            }
            // `() -> View`: a builder, drawn where it is called.
            TypeKind::Fn { params, ret, .. } if Self::is_view_type(ret) => {
                let params: Vec<String> = params.iter().map(|p| self.ty(p)).collect();
                format!("@Composable ({}) -> Unit", params.join(", "))
            }
            TypeKind::Fn { is_async, params, ret, .. } => {
                let params: Vec<String> = params.iter().map(|p| self.ty(p)).collect();
                let ret = self.ty(ret);
                let suspend = if *is_async { "suspend " } else { "" };
                format!("{suspend}({}) -> {ret}", params.join(", "))
            }
            TypeKind::Tuple(items) if items.is_empty() => "Unit".into(),
            TypeKind::Tuple(items) if items.len() == 2 => {
                format!("Pair<{}, {}>", self.ty(&items[0]), self.ty(&items[1]))
            }
            TypeKind::Tuple(items) if items.len() == 3 => {
                format!("Triple<{}, {}, {}>", self.ty(&items[0]), self.ty(&items[1]), self.ty(&items[2]))
            }
            _ => self.unsupported(t.span, "this type"),
        }
    }

    fn is_view_type(t: &TypeExpr) -> bool {
        matches!(&t.kind, TypeKind::Named { name, .. } if name.name == "View")
    }

    // ---- items -------------------------------------------------------------------------

    fn item(&mut self, item: &Item) -> String {
        let vis = Self::visibility(item.visibility);
        match &item.kind {
            ItemKind::Struct(s) => self.struct_decl(vis, s),
            ItemKind::Enum(e) => self.enum_decl(vis, e),
            ItemKind::Class(c) => self.class_decl(vis, c),
            ItemKind::Protocol(p) => self.protocol_decl(vis, p),
            ItemKind::Fn(f) => self.func(vis, f, None, 0),
            ItemKind::View(v) => self.view(vis, v),
            ItemKind::Const(c) => {
                let ty = c.ty.as_ref().map(|t| format!(": {}", self.ty(t))).unwrap_or_default();
                let value = self.expr(&c.value);
                let kind = if c.mutable { "var" } else { "val" };
                format!("{vis}{kind} {}{ty} = {value}\n", decl_name(&c.name.name))
            }
            // A type the program declares takes its extensions' members inside its class.
            ItemKind::Extension(x) if self.decls.declared_here(&x.name.name, &self.file.path) => {
                String::new()
            }
            ItemKind::Extension(x) => self.extension(x),
            ItemKind::Alias(a) => {
                let ty = self.ty(&a.ty);
                format!("{vis}typealias {} = {ty}\n", a.name.name)
            }
            // The standard library's externs are the runtime's, hand-written in Kotlin under their
            // Bloom names (`so.oxy.bloom.std`'s `Externs.kt`).
            ItemKind::Extern(_) if self.is_std() => String::new(),
            ItemKind::Extern(x) => self.unsupported(x.package.span, "an extern module").replace("TODO()", ""),
            ItemKind::Test(_) => String::new(),
        }
    }

    /// A type's Kotlin supertypes: the program's protocols it conforms to, and the runtime's
    /// `Identifiable`. Equatable, Hashable and CaseIterable are what a data class or an enum
    /// class already is; Codable is the emitted coder's (`codable.rs`, to come).
    fn supertypes(&self, ty: &str) -> Vec<String> {
        self.decls
            .conforms
            .get(ty)
            .into_iter()
            .flatten()
            .filter(|p| p.as_str() == "Identifiable" || self.decls.protocols.contains_key(p.as_str()))
            .cloned()
            .collect()
    }

    /// A type's members: its own, then every extension's in the program, in file order.
    fn members_of(&self, ty: &str, own: &[TypeMember]) -> Vec<TypeMember> {
        let mut all = own.to_vec();
        for (_, body) in
            self.decls.extensions.get(ty).into_iter().flatten().filter(|(p, _)| *p == self.file.path)
        {
            all.extend(body.members.iter().cloned());
        }
        all
    }

    fn generics(names: &[Ident]) -> String {
        if names.is_empty() {
            String::new()
        } else {
            format!("<{}>", names.iter().map(|g| g.name.clone()).collect::<Vec<_>>().join(", "))
        }
    }

    /// A class body's members at `indent`; the static ones are top-level (`hoisted`).
    fn class_body(&mut self, ty: &str, members: &[TypeMember], indent: usize) -> String {
        let mut body = String::new();
        for m in members {
            if m.modifiers.is_static {
                let generics = self.owner_generics.clone();
                let text = self.static_member(ty, m, &generics);
                self.hoisted.push_str(&text);
            } else {
                body.push_str(&self.member(ty, m, indent));
            }
        }
        body
    }

    /// A static member of `owner` as a top-level declaration named as the checker lowers it
    /// (`Post.decode` is `Post$$decode`, Kotlin's `Post__decode`). A static function of a
    /// generic type takes the type's parameters as its own (`Array__decode<Element>`).
    fn static_member(&mut self, owner: &str, m: &TypeMember, generics: &[String]) -> String {
        let vis = Self::visibility(m.visibility);
        let lowered = |member: &str| bloom_lang::backend::mangle(owner, member, true);
        match &m.kind {
            TypeMemberKind::Func(f) if f.name.name == "==" => String::new(),
            TypeMemberKind::Func(f) => {
                let mut f = f.clone();
                f.name.name = lowered(&f.name.name);
                let text = self.func(vis, &f, None, 0);
                with_type_params(text, generics)
            }
            TypeMemberKind::Stored { mutable, name, ty: t, value: Some(v) } => {
                if !generics.is_empty() {
                    self.unsupported(
                        name.span,
                        format!("a static stored property of the generic type `{owner}`"),
                    );
                    return String::new();
                }
                let kind = if *mutable { "var" } else { "val" };
                let t = t.as_ref().map(|t| format!(": {}", self.ty(t))).unwrap_or_default();
                let v = self.expr(v);
                format!("{vis}{kind} {}{t} = {v}\n", static_name(&lowered(&name.name)))
            }
            TypeMemberKind::Computed { name, ty: rty, body } => {
                let rt = self.ty(rty);
                self.locals.push(HashMap::new());
                let body_text = self.block(&body.stmts, 2, Mode::Value);
                self.locals.pop();
                let head = format!("{vis}val {}: {rt}", static_name(&lowered(&name.name)));
                if generics.is_empty() {
                    format!("{head}\n  get() {{\n{body_text}  }}\n")
                } else {
                    self.unsupported(name.span, format!("a static property of the generic type `{owner}`"));
                    String::new()
                }
            }
            TypeMemberKind::Stored { name, .. } => {
                self.unsupported(name.span, "a static stored property with no value");
                String::new()
            }
            TypeMemberKind::Let(l) => {
                self.unsupported(l.span, "a static `let` pattern");
                String::new()
            }
        }
    }

    fn braces(body: String) -> String {
        if body.is_empty() { "\n".into() } else { format!(" {{\n{body}}}\n") }
    }

    fn struct_decl(&mut self, vis: &str, s: &StructDecl) -> String {
        let name = &s.name.name;
        let mut fields = Vec::new();
        for f in &s.fields {
            let ty = self.ty(&f.ty);
            let default = match &f.default {
                Some(d) => format!(" = {}", self.expr(d)),
                None => String::new(),
            };
            let over = if self.decls.is_requirement(name, &f.name.name) { "override " } else { "" };
            fields.push(format!("  {over}val {}: {ty}{default},", kw(&f.name.name)));
        }
        let supers = self.supertypes(name);
        let supers = if supers.is_empty() { String::new() } else { format!(" : {}", supers.join(", ")) };
        let own = s.surface.as_ref().map(|b| b.members.clone()).unwrap_or_default();
        let members = self.members_of(name, &own);
        self.owner_generics = s.generics.iter().map(|g| g.name.clone()).collect();
        let body = self.class_body(name, &members, 1);
        self.owner_generics.clear();
        // A struct is a value: `data class` gives it structural `==`, `hashCode` and `copy`,
        // and Compose treats a class of `val`s of stable types as stable (it skips on `==`).
        if fields.is_empty() && s.generics.is_empty() {
            return format!("{vis}data object {name}{supers}{}", Self::braces(body));
        }
        // `@Transparent` (one field, the value is that field's): a `@JvmInline value class`,
        // its field's value at runtime, `==` the field's.
        let transparent = self
            .file
            .checked
            .defs
            .iter()
            .enumerate()
            .any(|(id, d)| d.name == *name && self.file.checked.transparent.contains(&id));
        if transparent && fields.len() == 1 && s.generics.is_empty() {
            let field = fields[0].trim().trim_end_matches(',');
            return format!("@JvmInline\n{vis}value class {name}({field}){supers}{}", Self::braces(body));
        }
        format!(
            "@Immutable\n{vis}data class {name}{}(\n{}\n){supers}{}",
            Self::generics(&s.generics),
            fields.join("\n"),
            Self::braces(body)
        )
    }

    fn enum_decl(&mut self, vis: &str, e: &EnumDecl) -> String {
        let name = &e.name.name;
        let info = self.decls.enums.get(name).cloned().unwrap_or_default();
        let members = self.members_of(name, &e.members);
        let supers = self.supertypes(name);
        let mut out = String::new();
        if !info.has_payload() {
            let cases: Vec<String> = e.variants.iter().map(|v| kw(&v.name.name)).collect();
            let supers = if supers.is_empty() { String::new() } else { format!(" : {}", supers.join(", ")) };
            let body = self.class_body(name, &members, 1);
            let _ = write!(out, "{vis}enum class {name}{supers} {{\n  {}", cases.join(", "));
            if body.is_empty() {
                out.push_str("\n}\n");
            } else {
                let _ = write!(out, ";\n\n{body}}}\n");
            }
            return out;
        }
        let generics = Self::generics(&e.generics);
        let supers = if supers.is_empty() { String::new() } else { format!(" : {}", supers.join(", ")) };
        let _ = writeln!(out, "@Immutable\n{vis}sealed interface {name}{generics}{supers} {{");
        for v in &e.variants {
            let class = upper_first(&v.name.name);
            if v.payload.is_empty() {
                if !e.generics.is_empty() {
                    self.unsupported(v.name.span, "a case without a payload in a generic enum");
                }
                let _ = writeln!(out, "  data object {class} : {name}");
            } else {
                let fields: Vec<String> = v
                    .payload
                    .iter()
                    .enumerate()
                    .map(|(i, p)| {
                        let field = p.name.as_ref().map(|n| n.name.clone()).unwrap_or(format!("_{i}"));
                        format!("val {}: {}", kw(&field), self.ty(&p.ty))
                    })
                    .collect();
                let _ =
                    writeln!(out, "  data class {class}{generics}({}) : {name}{generics}", fields.join(", "));
            }
        }
        let body = self.class_body(name, &members, 1);
        if !body.is_empty() {
            out.push('\n');
            out.push_str(&body);
        }
        out.push_str("}\n");
        out
    }

    /// `final class` and `@Observable final class` (2.0): a Kotlin class. An `@Observable`
    /// class's stored `var`s are snapshot state, so a composable that reads one field is
    /// invalidated by that field's writes only (ADR 0002's field-level subscriptions).
    fn class_decl(&mut self, vis: &str, c: &ClassDecl) -> String {
        let name = &c.name.name;
        let members = self.members_of(name, &c.body.members);
        let inits: Vec<&FnDecl> = members
            .iter()
            .filter_map(|m| match &m.kind {
                TypeMemberKind::Func(f) if f.name.name == "init" => Some(f),
                _ => None,
            })
            .collect();
        if inits.len() > 1 {
            self.unsupported(inits[1].name.span, "a class with more than one `init`");
        }
        let init = inits.first().cloned().cloned();
        let ctor = match &init {
            Some(f) => format!("({})", self.params(&f.params, f.func)),
            None => String::new(),
        };
        let mut supers = self.supertypes(name);
        if c.actor {
            supers.insert(0, "BloomActor()".into());
        }
        let supers = if supers.is_empty() { String::new() } else { format!(" : {}", supers.join(", ")) };
        let mut body = String::new();
        for m in &members {
            if let TypeMemberKind::Stored { mutable, name: field, ty, value } = &m.kind {
                body.push_str(&self.stored(name, c, m, *mutable, field, ty.as_ref(), value.as_ref()));
            }
        }
        if let Some(f) = &init {
            self.locals.push(HashMap::new());
            let mut inner = self.rebinds(&f.params, f.func, 2);
            inner.push_str(&self.block(&f.body.stmts, 2, Mode::Unit));
            self.locals.pop();
            let _ = write!(body, "\n  init {{\n{inner}  }}\n");
        }
        let rest: Vec<TypeMember> = members
            .iter()
            .filter(|m| {
                !matches!(&m.kind, TypeMemberKind::Stored { .. })
                    && !matches!(&m.kind, TypeMemberKind::Func(f) if f.name.name == "init")
            })
            .cloned()
            .collect();
        self.actor = c.actor;
        let methods = self.class_body(name, &rest, 1);
        self.actor = false;
        if !methods.is_empty() {
            body.push('\n');
            body.push_str(&methods);
        }
        let stable = if c.observable { "@Stable\n" } else { "" };
        format!(
            "{stable}{vis}class {name}{}{ctor}{supers}{}",
            Self::generics(&c.generics),
            Self::braces(body)
        )
    }

    /// A class's stored property.
    #[allow(clippy::too_many_arguments)]
    fn stored(
        &mut self,
        owner: &str,
        c: &ClassDecl,
        m: &TypeMember,
        mutable: bool,
        field: &Ident,
        ty: Option<&TypeExpr>,
        value: Option<&Expr>,
    ) -> String {
        let vis = Self::visibility(m.visibility);
        let over = if self.decls.is_requirement(owner, &field.name) { "override " } else { "" };
        let written = ty.map(|t| self.ty(t));
        let annotated = written.as_ref().map(|t| format!(": {t}")).unwrap_or_default();
        let setter = match m.modifiers.setter {
            Some((Visibility::Private, _)) => "\n    private set",
            _ => "",
        };
        let name = kw(&field.name);
        // `var cursor: String?` starts as none, as Swift's optional does.
        let none = Expr { id: bloom_lang::backend::ExprId(u32::MAX), kind: ExprKind::None, span: field.span };
        let value = value.or(match ty.map(|t| &t.kind) {
            Some(TypeKind::Optional(_)) => Some(&none),
            _ => None,
        });
        match (mutable && c.observable, value) {
            (true, Some(v)) => {
                let v = self.expr(v);
                let state = match &written {
                    Some(t) => format!("mutableStateOf<{t}>({v})"),
                    None => format!("mutableStateOf({v})"),
                };
                format!("  {over}{vis}var {name}{annotated} by {state}{setter}\n")
            }
            (true, None) => {
                self.unsupported(field.span, "an `@Observable` field with no initial value");
                String::new()
            }
            (false, Some(v)) => {
                let v = self.expr(v);
                let kind = if mutable { "var" } else { "val" };
                format!("  {over}{vis}{kind} {name}{annotated} = {v}{setter}\n")
            }
            // Assigned by `init`, in the class's `init { }` block.
            (false, None) => {
                let kind = if mutable { "var" } else { "val" };
                format!("  {over}{vis}{kind} {name}{annotated}{setter}\n")
            }
        }
    }

    /// `protocol P: Q { var x: T { get }; func f(_ a: A) -> R }`: a Kotlin interface.
    fn protocol_decl(&mut self, vis: &str, p: &ProtocolDecl) -> String {
        let parents: Vec<String> = p.inherits.iter().filter_map(crate::type_name).collect();
        let supers = if parents.is_empty() { String::new() } else { format!(" : {}", parents.join(", ")) };
        let mut body = String::new();
        for r in &p.requirements {
            match r {
                Requirement::Property { is_static: true, span, .. }
                | Requirement::Func { decl: FnDecl { span, .. }, is_static: true } => {
                    self.unsupported(*span, "a static requirement (a type's witness)");
                }
                Requirement::Property { name, ty, settable, .. } => {
                    let kind = if *settable { "var" } else { "val" };
                    let _ = writeln!(body, "  {kind} {}: {}", kw(&name.name), self.ty(ty));
                }
                Requirement::Func { decl, .. } => {
                    let params = self.params(&decl.params, decl.func);
                    let ret = match &decl.ret {
                        Some(t) if !Self::is_view_type(t) => format!(": {}", self.ty(t)),
                        _ => String::new(),
                    };
                    let suspend = if decl.is_async { "suspend " } else { "" };
                    let _ = writeln!(body, "  {suspend}fun {}({params}){ret}", kw(&decl.name.name));
                }
            }
        }
        format!("{vis}interface {}{supers}{}", p.name.name, Self::braces(body))
    }

    fn extension(&mut self, x: &ExtensionDecl) -> String {
        let mut out = String::new();
        if !x.body.conformances.is_empty() {
            let why = if self.decls.declared.contains(&x.name.name) {
                "a type declared in another file"
            } else {
                "a type the program does not declare"
            };
            self.unsupported(x.name.span, format!("a conformance added to `{}`, {why}", x.name.name));
        }
        for m in &x.body.members {
            out.push_str(&self.extension_member(&x.name.name, m));
        }
        out
    }

    /// A member of a type the program does not declare (`String`, `[T]`): a Kotlin extension.
    fn extension_member(&mut self, ty: &str, m: &TypeMember) -> String {
        let vis = Self::visibility(m.visibility);
        let (receiver, params) = builtin_receiver(ty);
        let generic = if params.is_empty() { String::new() } else { format!("<{}> ", params.join(", ")) };
        let generic = generic.as_str();
        // `init(…)` of a built-in type (`Date(timeIntervalSince1970:)`): a function of its labels
        // returning the value its body makes (`Date__init_timeIntervalSince1970`), as the checker
        // lowers it (`init_name`).
        if let TypeMemberKind::Func(f) = &m.kind
            && f.name.name == "init"
            && !self.decls.declared.contains(ty)
        {
            let mut f = f.clone();
            let labels: Vec<Option<String>> = f
                .params
                .iter()
                .map(|p| Some(crate::param_info(p, true).label.unwrap_or_else(|| "_".into())))
                .collect();
            f.name.name = crate::init_name(ty, labels.iter().map(|l| l.as_deref()));
            f.ret = Some(TypeExpr {
                kind: TypeKind::Named {
                    name: Ident { name: ty.to_string(), span: f.span },
                    args: Vec::new(),
                },
                span: f.span,
            });
            let text = self.func(vis, &f, None, 0);
            return with_type_params(text, &params.iter().map(|p| p.to_string()).collect::<Vec<_>>());
        }
        // A static member of any type is a top-level declaration (`String__decode`).
        if m.modifiers.is_static {
            let params: Vec<String> = params.iter().map(|p| p.to_string()).collect();
            return self.static_member(ty, m, &params);
        }
        match &m.kind {
            TypeMemberKind::Func(f) if !params.is_empty() && !f.generics.is_empty() => {
                let text = self.func(vis, f, Some(&receiver), 0);
                text.replacen("fun <", &format!("fun <{}, ", params.join(", ")), 1)
            }
            TypeMemberKind::Func(f) => {
                let text = self.func(vis, f, Some(&receiver), 0);
                text.replacen("fun ", &format!("fun {generic}"), 1)
            }
            TypeMemberKind::Computed { name, ty: rty, body } => {
                let rt = self.ty(rty);
                self.locals.push(HashMap::new());
                let body_text = self.block(&body.stmts, 2, Mode::Value);
                self.locals.pop();
                format!(
                    "{vis}val {generic}{receiver}.{}: {rt}\n  get() {{\n{body_text}  }}\n",
                    kw(&name.name)
                )
            }
            TypeMemberKind::Stored { name, .. } => {
                self.unsupported(name.span, "a stored property in an extension");
                String::new()
            }
            TypeMemberKind::Let(l) => {
                self.unsupported(l.span, "a `let` in an extension of a type the program does not declare");
                String::new()
            }
        }
    }

    /// A member inside its type's Kotlin class, interface or enum class, at `indent`.
    fn member(&mut self, ty: &str, m: &TypeMember, indent: usize) -> String {
        let p = pad(indent);
        let over = if !m.modifiers.is_static && self.decls.is_requirement(ty, Self::member_name(m)) {
            "override "
        } else {
            ""
        };
        let vis = format!("{over}{}", Self::visibility(m.visibility));
        match &m.kind {
            // `static func ==`: a data class's `==` is structural already.
            TypeMemberKind::Func(f) if f.name.name == "==" => String::new(),
            TypeMemberKind::Func(f) if self.actor && !m.modifiers.is_static => {
                self.actor_method(&vis, f, indent)
            }
            TypeMemberKind::Func(f) => self.func(&vis, f, None, indent),
            TypeMemberKind::Computed { name, ty: rty, body } => {
                let rt = self.ty(rty);
                self.locals.push(HashMap::new());
                let text = match body.stmts.as_slice() {
                    [Stmt { kind: StmtKind::Expr(e), .. }]
                        if !matches!(e.kind, ExprKind::If(_) | ExprKind::Match(_)) =>
                    {
                        format!("{p}{vis}val {}: {rt}\n{p}  get() = {}\n", kw(&name.name), self.expr(e))
                    }
                    stmts => {
                        let body_text = self.block(stmts, indent + 2, Mode::Value);
                        format!("{p}{vis}val {}: {rt}\n{p}  get() {{\n{body_text}{p}  }}\n", kw(&name.name))
                    }
                };
                self.locals.pop();
                text
            }
            TypeMemberKind::Let(l) => {
                let text = self.let_stmt(l, indent);
                format!("{p}{vis}{}", text.trim_start())
            }
            // `static let shared = …`: a companion object's property.
            TypeMemberKind::Stored { mutable, name, ty: t, value: Some(v) } if m.modifiers.is_static => {
                let kind = if *mutable { "var" } else { "val" };
                let t = t.as_ref().map(|t| format!(": {}", self.ty(t))).unwrap_or_default();
                let v = self.expr(v);
                format!("{p}{vis}{kind} {}{t} = {v}\n", kw(&name.name))
            }
            // A struct's stored properties are its constructor's fields (`struct_decl`).
            TypeMemberKind::Stored { .. } => String::new(),
        }
    }

    fn member_name(m: &TypeMember) -> &str {
        match &m.kind {
            TypeMemberKind::Func(f) => &f.name.name,
            TypeMemberKind::Computed { name, .. } | TypeMemberKind::Stored { name, .. } => &name.name,
            TypeMemberKind::Let(_) => "",
        }
    }

    /// An actor's method: its body runs isolated, on the actor's own serial dispatcher
    /// (`BloomActor.isolated`), so it is `suspend` to its callers, as Swift's are `async`.
    fn actor_method(&mut self, vis: &str, f: &FnDecl, indent: usize) -> String {
        let p = pad(indent);
        let params = self.params(&f.params, f.func);
        let ret = match &f.ret {
            Some(t) => format!(": {}", self.ty(t)),
            None => String::new(),
        };
        self.locals.push(HashMap::new());
        let saved = self.return_label.replace("isolated".into());
        let mut body = self.rebinds(&f.params, f.func, indent + 1);
        let mode = if f.ret.is_some() { Mode::Lambda } else { Mode::Unit };
        body.push_str(&self.block(&f.body.stmts, indent + 1, mode));
        self.return_label = saved;
        self.locals.pop();
        format!("{p}{vis}suspend fun {}({params}){ret} = isolated {{\n{body}{p}}}\n", kw(&f.name.name))
    }

    fn params(&mut self, params: &[Param], func: bool) -> String {
        let mut out = Vec::new();
        for p in params {
            let info = crate::param_info(p, func);
            // The label is what call sites write, so it is the Kotlin name; the body's name
            // for it is bound below when they differ.
            let name = info.label.clone().unwrap_or_else(|| p.name.name.clone());
            let ty = self.ty(&p.ty);
            let default = match &p.default {
                Some(d) => format!(" = {}", self.expr(d)),
                None => String::new(),
            };
            out.push(format!("{}: {ty}{default}", kw(&name)));
        }
        out.join(", ")
    }

    /// Binds a parameter's body name when its label differs (`of name: String`).
    fn rebinds(&self, params: &[Param], func: bool, indent: usize) -> String {
        let mut out = String::new();
        for p in params {
            let info = crate::param_info(p, func);
            if let Some(label) = &info.label
                && label != &p.name.name
            {
                let _ = writeln!(out, "{}val {} = {}", pad(indent), kw(&p.name.name), kw(label));
            }
        }
        out
    }

    fn func(&mut self, vis: &str, f: &FnDecl, receiver: Option<&str>, indent: usize) -> String {
        let returns_view = f.ret.as_ref().is_some_and(Self::is_view_type);
        let ret = match &f.ret {
            Some(t) if returns_view => {
                let _ = t;
                String::new()
            }
            Some(t) => format!(": {}", self.ty(t)),
            None => String::new(),
        };
        let suspend = if f.is_async { "suspend " } else { "" };
        // A hook (a function with `@State var`s, or calling a hook) composes: its state is
        // remembered in its caller's composition.
        let hook = f.body.stmts.iter().any(|s| matches!(&s.kind, StmtKind::Var(v) if v.state.is_some()));
        let composable = if returns_view || hook { "@Composable " } else { "" };
        let recv = receiver.map(|r| format!("{r}.")).unwrap_or_default();
        let (type_params, where_clause) = self.type_params(f);
        let mut params = self.params(&f.params, f.func);
        let saved_codecs = std::mem::take(&mut self.codecs);
        for (name, ty) in self.codec_params(f) {
            if !params.is_empty() {
                params.push_str(", ");
            }
            let _ = write!(params, "{name}: Codec<{ty}>");
            self.codecs.insert(ty, name);
        }
        let mut scope = HashMap::new();
        for p in &f.params {
            if let TypeKind::Named { name, .. } = &p.ty.kind {
                scope.insert(p.name.name.clone(), name.name.clone());
            }
        }
        self.locals.push(scope);
        let mode = if returns_view {
            Mode::View
        } else if f.ret.is_some() {
            Mode::Value
        } else {
            Mode::Unit
        };
        let mut body = self.rebinds(&f.params, f.func, indent + 1);
        body.push_str(&self.block(&f.body.stmts, indent + 1, mode));
        self.locals.pop();
        self.codecs = saved_codecs;
        let p = pad(indent);
        format!(
            "{p}{composable}{vis}{suspend}fun {type_params}{recv}{}({params}){ret}{where_clause} {{\n{body}{p}}}\n",
            decl_name(&f.name.name)
        )
    }

    /// A generic function's `Codable` witnesses, as the checker names them (`$w_T_Codable`):
    /// each one's Kotlin parameter name and the type parameter it is the codec of. A call
    /// passes them after its arguments (`witness_args`), and `T.self` reads them.
    fn codec_params(&self, f: &FnDecl) -> Vec<(String, String)> {
        let Some(params) = self.file.checked.witness_params.get(&f.span) else { return Vec::new() };
        params
            .iter()
            .filter(|(_, _, bound)| matches!(bound, bloom_lang::backend::Bound::Codable))
            .filter_map(|(name, index, _)| {
                let ty = f.generics.get(*index as usize)?.name.clone();
                Some((witness_name(name), ty))
            })
            .collect()
    }

    /// The witnesses a generic call passes after its arguments: its codecs.
    fn witness_args(&self, call_id: bloom_lang::backend::ExprId) -> Vec<String> {
        use bloom_lang::backend::WitnessArg;
        let Some(args) = self.file.checked.witness_args.get(&call_id) else { return Vec::new() };
        args.iter()
            .flatten()
            .filter_map(|w| match w {
                WitnessArg::Codec(text) => Some(text.replace("$$", "__")),
                WitnessArg::Param(name) if name.contains("Codable") => Some(witness_name(name)),
                _ => None,
            })
            .collect()
    }

    /// A generic function's type parameters and their bounds: `<T : Titled> `, and a
    /// `where` clause when one has several (`P & Q`, or `where T: P, T: Q`). `Equatable` and
    /// `Hashable` bound nothing: every Kotlin value has `==` and `hashCode`.
    fn type_params(&mut self, f: &FnDecl) -> (String, String) {
        if f.generics.is_empty() {
            return (String::new(), String::new());
        }
        let mut heads = Vec::new();
        let mut wheres = Vec::new();
        for g in &f.generics {
            let mut bounds = Vec::new();
            for (name, bound) in f.constraints.iter().filter(|(n, _)| n.name == g.name) {
                let _ = name;
                match crate::type_name(bound).as_deref() {
                    Some("Equatable" | "Hashable" | "Sendable") => {}
                    Some("Comparable") => bounds.push(format!("Comparable<{}>", g.name)),
                    // A codec is passed as a witness parameter (`codec_params`), as the
                    // TypeScript backend passes it: no Kotlin bound.
                    Some("Codable" | "Encodable" | "Decodable") => {}
                    _ => bounds.push(self.ty(bound)),
                }
            }
            match bounds.len() {
                0 => heads.push(g.name.clone()),
                1 => heads.push(format!("{} : {}", g.name, bounds[0])),
                _ => {
                    heads.push(g.name.clone());
                    wheres.extend(bounds.into_iter().map(|b| format!("{} : {b}", g.name)));
                }
            }
        }
        let where_clause =
            if wheres.is_empty() { String::new() } else { format!(" where {}", wheres.join(", ")) };
        (format!("<{}> ", heads.join(", ")), where_clause)
    }

    fn view(&mut self, vis: &str, v: &ViewDecl) -> String {
        self.needs_scope = false;
        let mut props = Vec::new();
        let mut scope = HashMap::new();
        for p in v.params.iter().flatten() {
            let ty = self.ty(&p.ty);
            let default = match &p.default {
                Some(d) => format!(" = {}", self.expr(d)),
                None => String::new(),
            };
            props.push(format!("{}: {ty}{default}", kw(&p.name.name)));
            if let TypeKind::Named { name, .. } = &p.ty.kind {
                scope.insert(p.name.name.clone(), name.name.clone());
                // `@Binding var isOn: Bool`: read through `.value`, written through `.set`.
                if name.name == "Binding" {
                    self.binding_props.insert(p.name.name.clone());
                }
            }
        }
        props.push("modifier: Modifier = Modifier".into());
        // `struct X: ViewModifier`: the view it wraps, drawn with the modifier its body gives it
        // (last, so a call site passes it as a trailing lambda).
        let content = (v.kind == ViewKind::Modifier)
            .then(|| v.content.as_ref().map_or_else(|| "content".to_string(), |c| kw(&c.name)));
        if let Some(c) = &content {
            props.push(format!("{c}: @Composable (Modifier) -> Unit"));
        }
        let outer_content = std::mem::replace(&mut self.modifier_content, content);
        self.locals.push(scope);
        let mut body = String::new();
        for m in &v.members {
            match m {
                Member::State(s) if s.attr == StateAttr::State => {
                    let value = self.expr(&s.value);
                    let ty = s.ty.as_ref().map(|t| format!("<{}>", self.ty(t))).unwrap_or_default();
                    let _ = writeln!(
                        body,
                        "  var {} by remember {{ mutableStateOf{ty}({value}) }}",
                        kw(&s.name.name)
                    );
                }
                // `@Environment(\.k) var k`: the value in scope. A built-in one is the runtime's
                // (`Environment.disabled`); an app's `EnvironmentKey` is read from its key,
                // named by its package, since the local takes the key's own name.
                Member::State(s) if s.attr == StateAttr::Env => {
                    let key = match &s.value.kind {
                        ExprKind::KeyPath { root: None, path } if path.len() == 1 => {
                            Some(path[0].name.clone())
                        }
                        _ => None,
                    };
                    match key {
                        Some(k) if self.decls.env_keys.contains(&k) => {
                            let _ = writeln!(
                                body,
                                "  val {} = {}.{}.current",
                                kw(&s.name.name),
                                self.package,
                                kw(&k)
                            );
                        }
                        Some(k) => {
                            let _ = writeln!(body, "  val {} = Environment.{}", kw(&s.name.name), kw(&k));
                        }
                        None => {
                            self.unsupported(s.value.span, "this environment key");
                        }
                    }
                }
                Member::State(s) => {
                    self.unsupported(s.span, format!("`@{}`", s.attr.word()));
                }
                Member::Let(l) => body.push_str(&self.let_stmt(l, 1)),
                Member::Fn(f) => body.push_str(&self.func("", f, None, 1)),
                Member::Effect(e) => {
                    let inner = self.block(&e.body.stmts, 2, Mode::Unit);
                    let key = match &e.id {
                        Some(id) if !matches!(id.kind, ExprKind::Unit) => self.expr(id),
                        _ => "Unit".into(),
                    };
                    let _ = writeln!(body, "  LaunchedEffect({key}) {{\n{inner}  }}");
                }
                // `static func ==`: Compose's strong skipping compares a row's props itself
                // (stable values by `==`, lambdas by what they capture).
                Member::Equal(_) => {}
            }
        }
        let drawn = self.view_block(&v.body.stmts, 1, Some("modifier"));
        self.modifier_content = outer_content;
        self.locals.pop();
        let scope_line = if self.needs_scope { "  val scope = rememberCoroutineScope()\n" } else { "" };
        // A stateless one-node view (the TypeScript backend's `inlineView`) is an inline
        // composable: no restart scope or skipping of its own, its body drawn in its caller's,
        // as it costs no component on React Native. Its lambdas are `noinline` (they are passed
        // on, not called in place), and a public one inlines only what is public.
        let inline = self.inlinable(v)
            && (vis == "private " || !self.private_names.iter().any(|n| mentions(&drawn, n)));
        let (head, props) = if inline {
            let props: Vec<String> = props
                .iter()
                .map(|p| match p.split_once(": ") {
                    Some((name, ty)) if ty.contains("->") => format!("noinline {name}: {ty}"),
                    _ => p.clone(),
                })
                .collect();
            ("inline ", props)
        } else {
            ("", props)
        };
        format!(
            "@Composable\n{vis}{head}fun {}({}) {{\n{scope_line}{body}{drawn}}}\n",
            v.name.name,
            props.join(", ")
        )
    }

    /// The TypeScript backend's `inlineView` rule (`emit.rs`, `inlinable`): a view with no
    /// members (state, environment, `let`s, methods, effects, a comparator), not generic,
    /// reading no `@Observable` model, whose body is one view call with no `.task`, no
    /// `.onChange` and no `.id()` of its own.
    fn inlinable(&self, v: &ViewDecl) -> bool {
        if v.kind != ViewKind::View || !v.generics.is_empty() || !v.members.is_empty() {
            return false;
        }
        let [stmt] = v.body.stmts.as_slice() else { return false };
        let StmtKind::Expr(root) = &stmt.kind else { return false };
        if !matches!(root.kind, ExprKind::Call(_)) || !matches!(self.ty_of(root), Some(Ty::View(_))) {
            return false;
        }
        let Some(chain) = unwind(root) else { return false };
        !chain.mods.iter().any(|(name, _)| matches!(*name, "task" | "onChange" | "onAppear" | "id"))
    }

    // ---- statements ----------------------------------------------------------------

    fn let_stmt(&mut self, l: &LetStmt, indent: usize) -> String {
        let value = self.expr(&l.value);
        match &l.pattern.kind {
            PatternKind::Bind(name) => {
                let ty = l.ty.as_ref().map(|t| format!(": {}", self.ty(t))).unwrap_or_default();
                if let Some(t) = self.type_at(name.span).map(String::from) {
                    self.bind(&name.name, &t);
                }
                format!("{}val {}{ty} = {value}\n", pad(indent), kw(&name.name))
            }
            PatternKind::Wildcard => format!("{}{value}\n", pad(indent)),
            _ => format!("{}{}\n", pad(indent), self.unsupported(l.span, "a destructuring `let`")),
        }
    }

    fn bind(&mut self, name: &str, ty: &str) {
        if let Some(scope) = self.locals.last_mut() {
            scope.insert(name.to_string(), ty.to_string());
        }
    }

    fn block(&mut self, stmts: &[Stmt], indent: usize, mode: Mode) -> String {
        let mut out = String::new();
        for (i, stmt) in stmts.iter().enumerate() {
            let last = i + 1 == stmts.len();
            if let StmtKind::Defer(deferred) = &stmt.kind {
                // `defer { … }`: the rest of the block runs in `try`, the deferred work in `finally`.
                let rest = self.block(&stmts[i + 1..], indent + 1, mode);
                let fin = self.block(&deferred.stmts, indent + 1, Mode::Unit);
                let p = pad(indent);
                let _ = write!(out, "{p}try {{\n{rest}{p}}} finally {{\n{fin}{p}}}\n");
                return out;
            }
            out.push_str(&self.stmt(stmt, indent, if last { mode } else { Mode::Unit }));
        }
        out
    }

    fn stmt(&mut self, stmt: &Stmt, indent: usize, mode: Mode) -> String {
        let p = pad(indent);
        match &stmt.kind {
            StmtKind::Let(l) => self.let_stmt(l, indent),
            // `@State var x = v` in a hook function (2.0): the composable's own state, as a view's.
            StmtKind::Var(v) if v.state.is_some() => {
                let ty = v.ty.as_ref().map(|t| format!("<{}>", self.ty(t))).unwrap_or_default();
                let value = self.expr(&v.value);
                format!("{p}var {} by remember {{ mutableStateOf{ty}({value}) }}\n", kw(&v.name.name))
            }
            StmtKind::Var(v) => {
                let ty = v.ty.as_ref().map(|t| format!(": {}", self.ty(t))).unwrap_or_default();
                let value = self.expr(&v.value);
                format!("{p}var {}{ty} = {value}\n", kw(&v.name.name))
            }
            StmtKind::Assign(a) => {
                let value = self.expr(&a.value);
                // `x op= v` reads the place first: `x = x op v`, so a value's copy is rebuilt.
                let value = match a.op {
                    AssignOp::Set => value,
                    op => format!("{} {} {value}", self.expr(&a.target), op.text().trim_end_matches('=')),
                };
                let root = Self::place_root(&a.target);
                let (place, rebuilt) = self.place(&a.target, value);
                match root {
                    Some(n) if self.binding_props.contains(n) => format!("{p}{}.set({rebuilt})\n", kw(n)),
                    _ => format!("{p}{place} = {rebuilt}\n"),
                }
            }
            StmtKind::Return(Some(e)) => {
                let label = self.return_label.as_ref().map(|l| format!("@{l}")).unwrap_or_default();
                format!("{p}return{label} {}\n", self.expr(e))
            }
            StmtKind::Return(None) => {
                let label = self.return_label.as_ref().map(|l| format!("@{l}")).unwrap_or_default();
                format!("{p}return{label}\n")
            }
            StmtKind::Defer(_) => unreachable!("handled by block"),
            // `break` / `continue`, and a labelled loop's (`outer: for …`, `break outer`):
            // Kotlin's `break@outer` on a loop written `outer@ for …`.
            StmtKind::Break(label) => match label {
                Some(l) => format!("{p}break@{}\n", l.name),
                None => format!("{p}break\n"),
            },
            StmtKind::Continue(label) => match label {
                Some(l) => format!("{p}continue@{}\n", l.name),
                None => format!("{p}continue\n"),
            },
            StmtKind::While(w) => {
                let cond = self.expr(&w.cond);
                let body = self.block(&w.body.stmts, indent + 1, Mode::Unit);
                let label = w.label.as_ref().map(|l| format!("{}@ ", l.name)).unwrap_or_default();
                format!("{p}{label}while ({cond}) {{\n{body}{p}}}\n")
            }
            StmtKind::For(f) => {
                let iter = self.expr(&f.iter);
                let name = match &f.pattern.kind {
                    PatternKind::Bind(n) => kw(&n.name),
                    PatternKind::Wildcard => "_".into(),
                    // `for (i, p) in xs.enumerated()`: Kotlin destructures `withIndex()`'s pairs.
                    PatternKind::Tuple(items) => {
                        let names: Vec<String> = items
                            .iter()
                            .map(|q| match &q.kind {
                                PatternKind::Bind(n) => kw(&n.name),
                                _ => "_".into(),
                            })
                            .collect();
                        format!("({})", names.join(", "))
                    }
                    _ => self.unsupported(f.pattern.span, "this `for` pattern"),
                };
                // In a view builder, each pass draws its views.
                let body = if mode == Mode::View {
                    self.view_block(&f.body.stmts, indent + 1, None)
                } else {
                    self.block(&f.body.stmts, indent + 1, Mode::Unit)
                };
                let label = f.label.as_ref().map(|l| format!("{}@ ", l.name)).unwrap_or_default();
                format!("{p}{label}for ({name} in {iter}) {{\n{body}{p}}}\n")
            }
            StmtKind::Guard(g) => {
                let otherwise = self.block(&g.otherwise.stmts, indent + 1, Mode::Unit);
                match &g.cond {
                    Cond::Expr(c) => {
                        let c = self.expr(c);
                        format!("{p}if (!({c})) {{\n{otherwise}{p}}}\n")
                    }
                    Cond::Let(pat, value) => match &pat.kind {
                        // Annotated with the unwrapped type: a smart-cast `T & Any` would make a
                        // later `fold(first)` infer the non-null type.
                        PatternKind::Bind(n) => {
                            let v = self.expr(value);
                            let ty = self.binding_ty(n.span).map(|t| format!(": {t}")).unwrap_or_default();
                            format!("{p}val {}{ty} = {v} ?: run {{\n{otherwise}{p}}}\n", kw(&n.name))
                        }
                        _ => format!("{p}{}\n", self.unsupported(pat.span, "this `guard let` pattern")),
                    },
                }
            }
            // A thrown `Error` is a `Throwable` already; any other value is wrapped (`BloomError`).
            StmtKind::Throw(e) if matches!(self.ty_of(e), Some(Ty::JsError)) => {
                format!("{p}throw {}\n", self.expr(e))
            }
            StmtKind::Throw(e) => format!("{p}throw BloomError({})\n", self.expr(e)),
            StmtKind::Do(d) => {
                let body = self.block(&d.body.stmts, indent + 1, Mode::Unit);
                let mut out = format!("{p}try {{\n{body}{p}}}");
                for c in &d.catches {
                    let name = c.name.as_ref().map(|n| n.name.clone()).unwrap_or("error".into());
                    let inner = self.block(&c.body.stmts, indent + 1, Mode::Unit);
                    let _ = write!(out, " catch ({}: Throwable) {{\n{inner}{p}}}", kw(&name));
                }
                out.push('\n');
                out
            }
            StmtKind::Expr(e) => match mode {
                Mode::View => self.view_stmt(e, indent, None),
                Mode::Value => match &e.kind {
                    ExprKind::If(_) | ExprKind::Match(_) => format!("{p}return {}\n", self.expr(e)),
                    _ => format!("{p}return {}\n", self.expr(e)),
                },
                Mode::Lambda | Mode::Unit => match &e.kind {
                    ExprKind::If(i) if mode == Mode::Unit => self.if_stmt(i, indent, Mode::Unit, None),
                    ExprKind::Match(m) if mode == Mode::Unit => self.match_stmt(m, indent, Mode::Unit, None),
                    _ => format!("{p}{}\n", self.expr(e)),
                },
            },
        }
    }

    fn if_stmt(&mut self, i: &IfExpr, indent: usize, mode: Mode, modifier: Option<&str>) -> String {
        let p = pad(indent);
        // `if let x = v { … }`: `run { val x = v; if (x != null) { … } }`, so `x` is the
        // smart-cast value inside and nothing outside (Swift's scoping), and `v` is read once.
        if let Cond::Let(pat, value) = &i.cond {
            let PatternKind::Bind(n) = &pat.kind else {
                return format!("{p}{}\n", self.unsupported(pat.span, "this `if let` pattern"));
            };
            let v = self.expr(value);
            let name = kw(&n.name);
            let inner =
                self.if_branches(format!("{name} != null"), String::new(), i, indent + 1, mode, modifier);
            return format!("{p}run {{\n{p}  val {name} = {v}\n{inner}{p}}}\n");
        }
        let (head, bind) = self.cond(&i.cond, indent + 1);
        self.if_branches(head, bind, i, indent, mode, modifier)
    }

    /// An `if`'s test, then its branches.
    fn if_branches(
        &mut self,
        head: String,
        bind: String,
        i: &IfExpr,
        indent: usize,
        mode: Mode,
        modifier: Option<&str>,
    ) -> String {
        let p = pad(indent);
        let then = if mode == Mode::View {
            self.view_block(&i.then.stmts, indent + 1, modifier)
        } else {
            self.block(&i.then.stmts, indent + 1, mode)
        };
        let mut out = format!("{p}if ({head}) {{\n{bind}{then}{p}}}");
        match i.otherwise.as_deref() {
            Some(Else::Block(b)) => {
                let body = if mode == Mode::View {
                    self.view_block(&b.stmts, indent + 1, modifier)
                } else {
                    self.block(&b.stmts, indent + 1, mode)
                };
                let _ = write!(out, " else {{\n{body}{p}}}");
            }
            Some(Else::If(e)) => {
                if let ExprKind::If(inner) = &e.kind {
                    let nested = self.if_stmt(inner, indent, mode, modifier);
                    let _ = write!(out, " else {}", nested.trim_start());
                    return out;
                }
            }
            None => {}
        }
        out.push('\n');
        out
    }

    /// A write to a place, with value semantics: the place's root (a name, or a field of a
    /// class, which is a reference) and the value rebuilt up to it. `posts[i].likes = v` on
    /// a list of structs is `posts = posts.replacing(i, posts[i].copy(likes = v))`: each
    /// struct on the way is copied with its field changed, each list or dictionary replaced.
    fn place(&mut self, target: &Expr, value: String) -> (String, String) {
        match &target.kind {
            ExprKind::Field(base, field) if !self.is_reference(base) => {
                let b = self.expr(base);
                self.place(base, format!("{b}.copy({} = {value})", kw(&field.name)))
            }
            ExprKind::Index(base, index) => {
                let b = self.expr(base);
                let i = self.expr(index);
                let rebuilt = match self.ty_of(base) {
                    Some(Ty::Map(_) | Ty::JsMap(..)) => format!("{b} + ({i} to {value})"),
                    // A local whose type the checker keeps by its declaration, not this span:
                    // a string key is a dictionary's (`out[k] = v` on `[String: String]`).
                    None if matches!(self.ty_of(index), Some(Ty::Str | Ty::Strings(_))) => {
                        format!("{b} + ({i} to {value})")
                    }
                    _ => format!("{b}.replacing({i}, {value})"),
                };
                if self.is_reference(base) {
                    return (b, rebuilt);
                }
                self.place(base, rebuilt)
            }
            _ => (self.expr(target), value),
        }
    }

    /// The name a place starts from (`posts` in `posts[i].likes`).
    fn place_root(target: &Expr) -> Option<&str> {
        match &target.kind {
            ExprKind::Name(n) => Some(n),
            ExprKind::Field(base, _) | ExprKind::Index(base, _) => Self::place_root(base),
            _ => None,
        }
    }

    /// Whether `e` is a class instance (a reference: its fields are written in place) or
    /// `self` in a class's own members, rather than a value.
    fn is_reference(&self, e: &Expr) -> bool {
        if let ExprKind::Name(n) = &e.kind
            && n == "self"
        {
            return self.def_of(e).is_none_or(|d| d.class.is_some());
        }
        if let Some(def) = self.def_of(e) {
            return def.class.is_some();
        }
        self.receiver_type(e).is_some_and(|t| self.decls.classes.contains(t.trim_end_matches('?')))
    }

    /// An `if` condition: its Kotlin test, and the bindings an `if let` makes in its body.
    fn cond(&mut self, c: &Cond, indent: usize) -> (String, String) {
        match c {
            Cond::Expr(e) => (self.expr(e), String::new()),
            Cond::Let(pat, value) => match &pat.kind {
                PatternKind::Bind(n) => {
                    let v = self.expr(value);
                    self.fresh += 1;
                    let tmp = format!("v{}", self.fresh);
                    (
                        format!("{v}.let {{ {tmp} = it; true }} ?: false"),
                        format!("{}val {} = {tmp}!!\n", pad(indent), kw(&n.name)),
                    )
                }
                _ => (self.unsupported(pat.span, "this `if let` pattern"), String::new()),
            },
        }
    }

    /// The enum a `switch` subject is, by the checker's type of it.
    fn subject_enum(&self, scrutinee: &Expr) -> Option<(String, EnumInfo)> {
        let ty = self.type_at(scrutinee.span).map(String::from).or_else(|| self.receiver_type(scrutinee))?;
        let ty = ty.trim_end_matches('?').to_string();
        // Bloom's `Result`: the runtime's `BloomResult.Ok(value)` / `BloomResult.Err(error)`.
        if ty.starts_with("Result<") {
            let cases = vec![
                ("ok".to_string(), vec!["value".to_string()]),
                ("err".to_string(), vec!["error".to_string()]),
            ];
            return Some(("BloomResult".into(), EnumInfo { cases }));
        }
        self.decls.enums.get(&ty).map(|info| (ty, info.clone()))
    }

    fn arm_head(
        &mut self,
        pat: &Pattern,
        enum_ty: Option<&(String, EnumInfo)>,
        subject: &str,
        indent: usize,
    ) -> (String, String) {
        match &pat.kind {
            PatternKind::Wildcard => ("else".into(), String::new()),
            PatternKind::Literal(e) => (self.expr(e), String::new()),
            PatternKind::None => ("null".into(), String::new()),
            PatternKind::Case { name, args, .. } => {
                let Some((ty, info)) = enum_ty else {
                    return (
                        self.unsupported(pat.span, "a case pattern on a value whose enum is unknown"),
                        String::new(),
                    );
                };
                if !info.has_payload() {
                    return (format!("{ty}.{}", kw(&name.name)), String::new());
                }
                let class = upper_first(&name.name);
                let fields = info.payload(&name.name).map(|f| f.to_vec()).unwrap_or_default();
                if fields.is_empty() {
                    return (format!("{ty}.{class}"), String::new());
                }
                let mut binds = String::new();
                for (i, arg) in args.iter().flatten().enumerate() {
                    if let PatternKind::Bind(n) = &arg.kind
                        && let Some(field) = fields.get(i)
                    {
                        let _ =
                            writeln!(binds, "{}val {} = {subject}.{}", pad(indent), kw(&n.name), kw(field));
                    }
                }
                (format!("is {ty}.{class}"), binds)
            }
            PatternKind::Or(ps) => {
                let heads: Vec<String> =
                    ps.iter().map(|p| self.arm_head(p, enum_ty, subject, indent).0).collect();
                (heads.join(", "), String::new())
            }
            _ => (self.unsupported(pat.span, "this pattern"), String::new()),
        }
    }

    fn match_stmt(&mut self, m: &MatchExpr, indent: usize, mode: Mode, modifier: Option<&str>) -> String {
        let p = pad(indent);
        let enum_ty = self.subject_enum(&m.scrutinee);
        let scrutinee = self.expr(&m.scrutinee);
        self.fresh += 1;
        let subject = format!("s{}", self.fresh);
        let mut out = format!("{p}when (val {subject} = {scrutinee}) {{\n");
        let mut has_else = false;
        for arm in &m.arms {
            let (head, binds) = self.arm_head(&arm.pattern, enum_ty.as_ref(), &subject, indent + 2);
            has_else |= head == "else" && arm.guard.is_none();
            // `case .image(let url, _) where url.isEmpty`: Kotlin 2.2's guard condition, the
            // payload bound inside it as it is inside the body.
            let guard = match &arm.guard {
                Some(g) if binds.is_empty() => format!(" if ({})", self.expr(g)),
                Some(g) => {
                    let lets: Vec<String> = binds.lines().map(|l| l.trim().to_string()).collect();
                    format!(" if (run {{ {}; {} }})", lets.join("; "), self.expr(g))
                }
                None => String::new(),
            };
            let head = if guard.is_empty() { head } else { format!("{head}{guard}") };
            let stmts: Vec<Stmt> = match &arm.body {
                ArmBody::Expr(e) => vec![Stmt { kind: StmtKind::Expr(e.clone()), span: e.span }],
                ArmBody::Block(b) => b.stmts.clone(),
            };
            let body = if mode == Mode::View {
                self.view_block(&stmts, indent + 2, modifier)
            } else {
                self.block(&stmts, indent + 2, mode)
            };
            let _ = write!(out, "{p}  {head} -> {{\n{binds}{body}{p}  }}\n");
        }
        if !has_else && enum_ty.is_none() {
            let _ = writeln!(out, "{p}  else -> {{}}");
        }
        let _ = writeln!(out, "{p}}}");
        out
    }

    // ---- views ---------------------------------------------------------------------

    /// A view builder's statements, drawn. `modifier`, when given, is applied to each view
    /// drawn at this level (a view's root: only one of its branches draws).
    fn view_block(&mut self, stmts: &[Stmt], indent: usize, modifier: Option<&str>) -> String {
        let mut out = String::new();
        for stmt in stmts {
            match &stmt.kind {
                StmtKind::Expr(e) => out.push_str(&self.view_stmt(e, indent, modifier)),
                StmtKind::For(_) => out.push_str(&self.stmt(stmt, indent, Mode::View)),
                _ => out.push_str(&self.stmt(stmt, indent, Mode::Unit)),
            }
        }
        out
    }

    fn view_stmt(&mut self, e: &Expr, indent: usize, modifier: Option<&str>) -> String {
        let p = pad(indent);
        match &e.kind {
            ExprKind::None => String::new(),
            ExprKind::If(i) => self.if_stmt(i, indent, Mode::View, modifier),
            ExprKind::Match(m) => self.match_stmt(m, indent, Mode::View, modifier),
            ExprKind::Paren(inner) => self.view_stmt(inner, indent, modifier),
            // A modifier's `content`: drawn with the modifier it is given.
            ExprKind::Name(n) if self.modifier_content.as_deref() == Some(kw(n).as_str()) => {
                self.content_expr(e, indent, modifier).unwrap_or_default()
            }
            // A view value (a prop of type `View`): drawn by calling it.
            ExprKind::Name(n) if matches!(self.ty_of(e), Some(Ty::View(_))) => format!("{p}{}()\n", kw(n)),
            _ => match self.view_expr(e, indent, modifier) {
                Some(text) => text,
                // A call that draws (`rows()`, `names(xs)`): a composable call, as it is.
                None if matches!(e.kind, ExprKind::Call(_)) && matches!(self.ty_of(e), Some(Ty::View(_))) => {
                    format!("{p}{}\n", self.expr(e))
                }
                None => format!("{p}{}\n", self.unsupported(e.span, "this expression as a view")),
            },
        }
    }

    /// A view expression (a node or view call with its modifiers), drawn at `indent`.
    fn view_expr(&mut self, e: &Expr, indent: usize, outer: Option<&str>) -> Option<String> {
        if let Some(drawn) = self.content_expr(e, indent, outer) {
            return Some(drawn);
        }
        let chain = unwind(e)?;
        // `v.modifier(X(…))`: `X` wraps `v` (everything before it); what follows applies to `X`.
        if let Some(k) = chain.mods.iter().rposition(|(name, _)| *name == "modifier")
            && let ExprKind::Field(inner, _) = &chain.mods[k].1.callee.kind
            && let Some(arg) = chain.mods[k].1.args.first()
            && let ExprKind::Call(wrap) = &arg.value.kind
            && let ExprKind::Name(wrapper) = &wrap.callee.kind
        {
            let p = pad(indent);
            let mut layout = Vec::new();
            for (name, call) in &chain.mods[k + 1..] {
                if universal(name) {
                    layout.push(self.layout_modifier(wrapper, name, call));
                } else {
                    self.unsupported(call.callee.span, format!("`.{name}` after `.modifier(…)`"));
                }
            }
            layout.reverse();
            let mut args = self.call_args(wrapper, wrap);
            match (outer, layout.is_empty()) {
                (Some(o), _) => args.push(format!("modifier = {o}{}", layout.concat())),
                (None, false) => args.push(format!("modifier = Modifier{}", layout.concat())),
                (None, true) => {}
            }
            let content = self.view_expr(inner, indent + 1, Some("contentModifier")).unwrap_or_default();
            return Some(format!(
                "{p}{}({}) {{ contentModifier ->\n{content}{p}}}\n",
                kw(wrapper),
                args.join(", ")
            ));
        }
        let p = pad(indent);
        // Effects ride on the view: emitted beside it, in the same composable.
        let mut effects = String::new();
        let mut node_mods: Vec<(&str, &Call)> = Vec::new();
        let mut layout: Vec<String> = Vec::new();
        for (name, call) in &chain.mods {
            match *name {
                "task" | "onAppear" => {
                    let body = call.trailing.as_deref().map(|c| c.body.clone()).unwrap_or_default();
                    // `.task(id: v)`: the effect restarts (the old one cancelled) when `v` changes.
                    let key = call
                        .args
                        .iter()
                        .find(|a| a.label.as_ref().is_some_and(|l| l.name == "id"))
                        .map_or_else(|| "Unit".to_string(), |a| self.expr(&a.value));
                    let inner = self.block(&body, indent + 1, Mode::Unit);
                    let _ = write!(effects, "{p}LaunchedEffect({key}) {{\n{inner}{p}}}\n");
                }
                "onChange" => {
                    let of = call.args.first().map(|a| self.expr(&a.value)).unwrap_or_default();
                    let closure = call.trailing.as_deref();
                    let names: Vec<String> = closure
                        .map(|c| c.params.iter().map(|p| kw(&p.name.name)).collect())
                        .unwrap_or_default();
                    let names = if names.len() == 2 { names.join(", ") } else { "_, _".into() };
                    let body = closure.map(|c| c.body.clone()).unwrap_or_default();
                    let inner = self.block(&body, indent + 1, Mode::Unit);
                    let _ = write!(effects, "{p}OnChange({of}) {{ {names} ->\n{inner}{p}}}\n");
                }
                n if universal(n) => layout.push(self.layout_modifier(chain.name, n, call)),
                // A press on a view of the app (`MediaBox(…).onPress { }`): the view's modifier.
                "onPress" if !matches!(chain.name, "Button" | "Action") => {
                    layout.push(self.layout_modifier(chain.name, "onTapGesture", call))
                }
                _ => node_mods.push((name, call)),
            }
        }
        // A border on a rounded view follows its corner (`.border(…).corner(.lg)`).
        if let Some(radius) = layout.iter().find_map(|m| {
            m.strip_prefix(".bloomCorner(").and_then(|r| r.strip_suffix(')')).map(str::to_string)
        }) {
            for m in layout.iter_mut().filter(|m| m.starts_with(".bloomBorder(") && m.ends_with(')')) {
                m.pop();
                m.push_str(&format!(", corner = {radius})"));
            }
            // The material's surface too (`.glass().corner(.lg)`): a capsule otherwise.
            for m in layout.iter_mut().filter(|m| {
                (m.starts_with(".bloomGlass(") || m.starts_with(".bloomBlur(")) && m.ends_with(')')
            }) {
                m.pop();
                let sep = if m.ends_with('(') { "" } else { ", " };
                m.push_str(&format!("{sep}corner = {radius})"));
            }
        }
        // `.shrink().grow()`: the grow's weight alone.
        if layout.iter().any(|m| m == ".weight(1f)") {
            layout.retain(|m| m != ".weight(1f, fill = false)" && !m.starts_with(".flexShrink("));
        }
        // Bloom's modifiers wrap outward (the last is outermost), Compose's chain runs from the
        // outside in: reversed.
        layout.reverse();
        let modifier = match (outer, layout.is_empty()) {
            (Some(o), true) => Some(o.to_string()),
            (Some(o), false) => Some(format!("{o}{}", layout.concat())),
            (None, true) => None,
            (None, false) => Some(format!("Modifier{}", layout.concat())),
        };
        let drawn = if NODES.contains(&chain.name) {
            self.node(&chain, &node_mods, modifier, indent)
        } else if self.decls.views.contains_key(chain.name) || self.is_local_view_fn(chain.name) {
            for (name, call) in &node_mods {
                let span = call.callee.span;
                self.unsupported(span, format!("`.{name}` on a view of the app"));
            }
            let mut args = self.call_args(chain.name, chain.call);
            if let Some(m) = modifier {
                args.push(format!("modifier = {m}"));
            }
            format!("{p}{}({})\n", chain.name, args.join(", "))
        } else {
            return None;
        };
        Some(format!("{drawn}{effects}"))
    }

    /// In a `ViewModifier`'s body, `content` with its modifiers (`content.padding(.md)`): the
    /// wrapped view, drawn with them.
    fn content_expr(&mut self, e: &Expr, indent: usize, outer: Option<&str>) -> Option<String> {
        let content = self.modifier_content.clone()?;
        let mut mods = Vec::new();
        let mut at = e;
        loop {
            match &at.kind {
                ExprKind::Call(call) => match &call.callee.kind {
                    ExprKind::Field(inner, name) => {
                        mods.push((name.name.as_str(), call));
                        at = inner;
                    }
                    _ => return None,
                },
                ExprKind::Name(n) if kw(n) == content => break,
                ExprKind::Paren(inner) => at = inner,
                _ => return None,
            }
        }
        mods.reverse();
        let mut layout = Vec::new();
        for (name, call) in mods {
            if universal(name) {
                layout.push(self.layout_modifier("content", name, call));
            } else {
                self.unsupported(call.callee.span, format!("`.{name}` on a modifier's content"));
            }
        }
        layout.reverse();
        let modifier = format!("{}{}", outer.unwrap_or("Modifier"), layout.concat());
        Some(format!("{}{content}({modifier})\n", pad(indent)))
    }

    fn is_local_view_fn(&self, name: &str) -> bool {
        // A view's own `func row(…) -> some View` (emitted as a local @Composable function).
        !name.is_empty() && name.chars().next().is_some_and(|c| c.is_lowercase())
    }

    fn layout_modifier(&mut self, node: &str, name: &str, call: &Call) -> String {
        // A Compose row already hands its last child the room left, and a child never grows
        // past its constraints: flex's `grow` and `shrink` have nothing to do.
        // Flex's grow and shrink are a weight in the parent stack (Compose's `RowScope` or
        // `ColumnScope`): `grow` takes the room left; `shrink` gives way first, measured after
        // its siblings (`fill = false`: no wider than its content). Outside a stack: nothing.
        if matches!(name, "grow" | "shrink") {
            if !matches!(self.scopes.last(), Some(&"row" | &"column")) {
                return String::new();
            }
            if name == "grow" {
                return ".weight(1f)".into();
            }
            // In a row, React Native's flex-shrink (the runtime's `FlexRow`): `.first` gives way
            // before `.normal`; in a column, a weight measured after its siblings.
            if self.scopes.last() == Some(&"row") {
                let factor = match call.args.first().map(|a| &a.value.kind) {
                    Some(ExprKind::ImplicitMember(m)) if m.name == "first" => "10f",
                    Some(ExprKind::ImplicitMember(m)) if m.name == "never" || m.name == "none" => "0f",
                    _ => "1f",
                };
                return format!(".flexShrink({factor})");
            }
            return ".weight(1f, fill = false)".into();
        }
        let args: Vec<String> = call
            .args
            .iter()
            .enumerate()
            .map(|(i, a)| {
                let param = match (name, a.label.as_ref().map(|l| l.name.as_str())) {
                    // `.border(color, width, edge)`.
                    ("border", None) => ["borderColor", "borderWidth", "borderEdge"].get(i).copied().unwrap_or("value"),
                    ("padding", _) if matches!(&a.value.kind, ExprKind::ImplicitMember(m) if is_edge(&m.name)) => "edge",
                    ("frame", Some(_)) => "length",
                    ("corner", _) => "corner",
                    ("padding", _) => "spacing",
                    ("background", _) => "background",
                    _ => "value",
                };
                let value = self.token_or_expr(node, param, &a.value);
                match &a.label {
                    Some(l) => format!("{} = {value}", kw(&l.name)),
                    None => value,
                }
            })
            .collect();
        let kname = match name {
            "onTapGesture" => "bloomOnPress".to_string(),
            other => format!("bloom{}", upper_first(other)),
        };
        let mut args = args;
        if let Some(closure) = call.trailing.as_deref() {
            args.push(self.closure(closure));
        }
        format!(".{kname}({})", args.join(", "))
    }

    /// An argument that may be a token (`.lg`): the runtime's token constant, by where it is.
    fn token_or_expr(&mut self, node: &str, param: &str, value: &Expr) -> String {
        // The checker's token for a Swift-named one (`.xxl` is "2xl", `.caption1` "caption-1",
        // `.muted.opacity(0.1)` "muted/10").
        if let Some(token) = self.file.checked.swift_tokens.get(&value.id).cloned() {
            let class = token_class(node, param);
            return match token.split_once('/') {
                Some((role, pct)) => {
                    let alpha = pct.parse::<f64>().unwrap_or(100.0) / 100.0;
                    format!("{class}.{}.copy(alpha = {alpha}f)", token_name(role))
                }
                None => format!("{class}.{}", token_name(&token)),
            };
        }
        match &value.kind {
            ExprKind::ImplicitMember(m) => format!("{}.{}", token_class(node, param), token_name(&m.name)),
            _ => self.expr(value),
        }
    }

    fn node(
        &mut self,
        chain: &Chain,
        mods: &[(&str, &Call)],
        modifier: Option<String>,
        indent: usize,
    ) -> String {
        let p = pad(indent);
        let node = chain.name;
        let call = chain.call;
        let mut args: Vec<String> = Vec::new();
        // `Text("a ", Text("b").foregroundStyle(.primary))`, `Text(..runs.map { … })`: one text
        // of runs (an `AnnotatedString`), each run a string or a styled `Text`.
        let runs = node == "Text"
            && (call.args.len() > 1
                || call.args.iter().any(|a| a.spread || matches!(self.ty_of(&a.value), Some(Ty::View(_)))));
        if runs {
            args.push(self.text_runs(&call.args));
        }
        // The constructor's own arguments.
        let mut positional = 0;
        for a in call.args.iter().filter(|_| !runs) {
            let label = a.label.as_ref().map(|l| l.name.as_str());
            let text = match (node, label) {
                ("Icon" | "Action", None) if positional == 0 => self.token_or_expr(node, "icon", &a.value),
                ("VStack" | "HStack" | "ZStack", Some(l)) => {
                    format!("{} = {}", kw(l), self.token_or_expr(node, l, &a.value))
                }
                ("VirtualList" | "List", None) if positional == 1 => {
                    // The row: a closure drawing a view.
                    match &a.value.kind {
                        ExprKind::Closure(c) => {
                            positional += 1;
                            let row = self.view_closure(c, indent);
                            args.push(format!("row = {row}"));
                            continue;
                        }
                        _ => self.expr(&a.value),
                    }
                }
                ("NavigationStack", Some("root")) => format!("root = {}", self.expr(&a.value)),
                // `Avatar(url, { name: n, initials: i })`: the fallback disc's name and initials.
                ("Avatar", None) if positional == 1 => {
                    positional += 1;
                    if let ExprKind::Record(entries) = &a.value.kind {
                        for entry in entries {
                            match entry {
                                RecordEntry::Field { key, value }
                                    if matches!(key.name.as_str(), "name" | "initials") =>
                                {
                                    args.push(format!("{} = {}", key.name, self.expr(value)));
                                }
                                RecordEntry::Field { key, .. } => {
                                    self.unsupported(key.span, format!("the avatar option `{}`", key.name));
                                }
                                RecordEntry::Spread(value) => {
                                    self.unsupported(value.span, "a spread avatar option");
                                }
                            }
                        }
                    } else {
                        self.unsupported(a.value.span, "avatar options that are not a record literal");
                    }
                    continue;
                }
                (_, Some(l)) => format!("{} = {}", kw(l), self.expr(&a.value)),
                // A view passed to a node (`Button(Text("Like"))`): a composable lambda.
                (_, None) if matches!(self.ty_of(&a.value), Some(Ty::View(_))) => {
                    self.view_arg(&a.value, indent)
                }
                (_, None) => self.expr(&a.value),
            };
            if label.is_none() {
                positional += 1;
            }
            args.push(text);
        }
        // The node's own modifiers, as its parameters.
        for (name, m) in mods {
            let arg = m.args.first();
            let value = match (node, *name, arg) {
                ("GroupedSectionItem", "wrapControl", _) => "true".to_string(),
                (_, "trailing", Some(a)) => {
                    let inner = self.view_expr(&a.value, indent + 1, None).unwrap_or_default();
                    format!("{{\n{inner}{p}}}")
                }
                // `.trailing { … }`: a builder of views, a composable lambda.
                (_, "trailing", None) if m.trailing.is_some() => {
                    let c = m.trailing.as_deref().unwrap_or_else(|| unreachable!());
                    self.scopes.push("row");
                    let inner = self.view_block(&c.body, indent + 1, None);
                    self.scopes.pop();
                    format!("{{\n{inner}{p}}}")
                }
                // `.countFormat(compact)`: a function of the program, passed by reference.
                (_, "countFormat", Some(a)) => match &a.value.kind {
                    ExprKind::Name(n) if self.decls.funcs.contains_key(n.as_str()) => format!("::{}", kw(n)),
                    _ => self.expr(&a.value),
                },
                (_, "onPress", _) => match m.trailing.as_deref() {
                    Some(c) => self.closure(c),
                    None => arg.map(|a| self.expr(&a.value)).unwrap_or_default(),
                },
                (_, "lineLimit", Some(a)) => self.expr(&a.value),
                (_, mname, Some(a)) => self.token_or_expr(node, mname, &a.value),
                (_, _, None) => "true".to_string(),
            };
            let param = match *name {
                "foregroundStyle" => "foreground",
                "lineLimit" => "lines",
                "align" => "alignment",
                "controlSize" => "size",
                "buttonStyle" => "style",
                other => other,
            };
            args.push(format!("{param} = {value}"));
        }
        if let Some(m) = modifier {
            args.push(format!("modifier = {m}"));
        }
        // Children: a trailing builder, or a Button's action.
        let trailing = call.trailing.as_deref();
        match (node, trailing) {
            ("Button", Some(c)) => {
                args.push(format!("onPress = {}", self.closure(c)));
                format!("{p}Button({})\n", args.join(", "))
            }
            ("NavigationStack", Some(c)) => {
                let content = self.view_closure(c, indent);
                format!("{p}NavigationStack({}) {content}\n", args.join(", "))
            }
            (_, Some(c)) => {
                // A column in a row whose child fills its width (`.frame(width: .full)`: a tab's
                // underline): React Native's column is as wide as its content there, and the
                // child stretches to that, not to the row's room.
                if node == "VStack" && self.scopes.last() == Some(&"row") && c.body.iter().any(fills_width) {
                    args.push("fitContent = true".into());
                }
                self.scopes.push(match node {
                    "HStack" => "row",
                    "VStack" | "ScrollView" => "column",
                    _ => "other",
                });
                let body = self.view_block(&c.body, indent + 1, None);
                self.scopes.pop();
                format!("{p}{node}({}) {{\n{body}{p}}}\n", args.join(", "))
            }
            (_, None) => format!("{p}{node}({})\n", args.join(", ")),
        }
    }

    /// A view value as an argument: `{ Text("Like") }`.
    fn view_arg(&mut self, e: &Expr, indent: usize) -> String {
        let p = pad(indent);
        match self.view_expr(e, indent + 1, None) {
            Some(text) => format!("{{\n{text}{p}}}"),
            None => self.expr(e),
        }
    }

    /// A closure that draws a view: `{ post -> PostRow(…) }`.
    fn view_closure(&mut self, c: &Closure, indent: usize) -> String {
        let p = pad(indent);
        let params: Vec<String> = c.params.iter().map(|q| kw(&q.name.name)).collect();
        let head = if params.is_empty() { String::new() } else { format!(" {} ->", params.join(", ")) };
        self.scopes.push("other");
        let body = self.view_block(&c.body, indent + 1, None);
        self.scopes.pop();
        format!("{{{head}\n{body}{p}}}")
    }

    // ---- expressions --------------------------------------------------------------

    fn receiver_type(&self, e: &Expr) -> Option<String> {
        if let Some(t) = self.ty_of(e) {
            return Some(self.bloom_name(t));
        }
        if let Some(t) = self.type_at(e.span) {
            return Some(t.to_string());
        }
        match &e.kind {
            ExprKind::Name(n) => self.locals.iter().rev().find_map(|s| s.get(n).cloned()),
            _ => None,
        }
    }

    fn call_args(&mut self, callee: &str, call: &Call) -> Vec<String> {
        let params: Option<Vec<ParamInfo>> = self
            .decls
            .funcs
            .get(callee)
            .or_else(|| self.decls.views.get(callee))
            .or_else(|| self.decls.structs.get(callee))
            .cloned();
        self.args_by(params.as_deref(), call)
    }

    /// The arguments of a call, positional while they follow the declaration in order and
    /// named once one is skipped; a label of an unknown callee (the runtime's) is its name.
    fn args_by(&mut self, params: Option<&[ParamInfo]>, call: &Call) -> Vec<String> {
        let mut out = Vec::new();
        let mut named = false;
        let mut at = 0usize;
        for a in &call.args {
            let value = self.expr(&a.value);
            let label = a.label.as_ref().map(|l| l.name.clone());
            match params {
                Some(params) => {
                    // The first parameter from here on with this label (Swift's order).
                    let found =
                        params.iter().enumerate().skip(at).find(|(_, p)| p.label == label).map(|(i, _)| i);
                    match found {
                        Some(i) if !named && i == at => {
                            out.push(value);
                            at = i + 1;
                        }
                        Some(i) => {
                            named = true;
                            let name = params[i].label.clone().unwrap_or(params[i].name.clone());
                            out.push(format!("{} = {value}", kw(&name)));
                        }
                        None => out.push(value),
                    }
                }
                None => match label {
                    Some(l) => out.push(format!("{} = {value}", kw(&l))),
                    None => out.push(value),
                },
            }
        }
        if let Some(c) = call.trailing.as_deref() {
            let closure = self.closure(c);
            // Swift's rule: the unlabelled trailing closure fills the first parameter no
            // argument named (`row { } label: { }` is `row(action: { }, label: { })`).
            match params {
                Some(params) => {
                    let given: Vec<Option<String>> =
                        call.args.iter().map(|a| a.label.as_ref().map(|l| l.name.clone())).collect();
                    let slot = params.iter().position(|p| p.label.is_some() && !given.contains(&p.label));
                    match slot {
                        Some(i) if named || i != out.len() => {
                            let name = params[i].label.clone().unwrap_or(params[i].name.clone());
                            out.push(format!("{} = {closure}", kw(&name)));
                        }
                        _ => out.push(closure),
                    }
                }
                None => out.push(closure),
            }
        }
        out
    }

    /// A `Text`'s runs as the runtime's `List<TextRun>`: each argument a run, a spread
    /// (`..xs.map { x in … }`) its runs in place.
    fn text_runs(&mut self, args: &[Arg]) -> String {
        let mut out = String::from("buildList<TextRun> {");
        for a in args {
            if a.spread {
                // `..xs.map { x in run }`: each element's run.
                if let ExprKind::Call(call) = &a.value.kind
                    && let ExprKind::Field(base, method) = &call.callee.kind
                    && method.name == "map"
                    && let Some(c) = call.trailing.as_deref().or_else(|| {
                        call.args.first().and_then(|x| match &x.value.kind {
                            ExprKind::Closure(c) => Some(c),
                            _ => None,
                        })
                    })
                    && let [Stmt { kind: StmtKind::Expr(body), .. }] = c.body.as_slice()
                {
                    let list = self.expr(base);
                    let param = c.params.first().map_or_else(|| "it".to_string(), |p| kw(&p.name.name));
                    let run = self.text_run(body);
                    let _ = write!(out, " addAll({list}.map {{ {param} -> {run} }});");
                } else {
                    let list = self.expr(&a.value);
                    let _ = write!(out, " addAll({list});");
                }
            } else {
                let run = self.text_run(&a.value);
                let _ = write!(out, " add({run});");
            }
        }
        out.push_str(" }");
        out
    }

    /// One run: a string, or `Text(s)` with its colour, weight, decoration, link or press.
    fn text_run(&mut self, e: &Expr) -> String {
        match &e.kind {
            ExprKind::Paren(inner) => return self.text_run(inner),
            ExprKind::Ternary(c, a, b) => {
                let (c, a, b) = (self.expr(c), self.text_run(a), self.text_run(b));
                return format!("(if ({c}) {a} else {b})");
            }
            _ => {}
        }
        let Some(chain) = unwind(e).filter(|c| c.name == "Text") else {
            return format!("TextRun({})", self.expr(e));
        };
        let text = chain.call.args.first().map(|a| self.expr(&a.value)).unwrap_or_else(|| "\"\"".into());
        let mut parts = vec![text];
        for (name, call) in &chain.mods {
            let arg = call.args.first();
            match (*name, arg) {
                ("foregroundStyle" | "foreground", Some(a)) => {
                    parts.push(format!("color = {}", self.token_or_expr("Text", "foregroundStyle", &a.value)))
                }
                ("weight", Some(a)) => {
                    parts.push(format!("weight = {}", self.token_or_expr("Text", "weight", &a.value)))
                }
                // `.italic()`, or `.italic(r.italic)`: a flag of the run's own.
                ("underline" | "italic" | "strikethrough", arg) => {
                    let param = if *name == "strikethrough" { "strike" } else { name };
                    let value = arg.map_or_else(|| "true".to_string(), |a| self.expr(&a.value));
                    parts.push(format!("{param} = {value}"));
                }
                ("link", Some(a)) => parts.push(format!("href = {}", self.expr(&a.value))),
                ("onPress", _) => {
                    let action = match call.trailing.as_deref() {
                        Some(c) => self.closure(c),
                        None => arg.map(|a| self.expr(&a.value)).unwrap_or_default(),
                    };
                    parts.push(format!("onPress = {action}"));
                }
                _ => {
                    self.unsupported(call.callee.span, format!("`.{name}` on a run of a text"));
                }
            }
        }
        format!("TextRun({})", parts.join(", "))
    }

    fn closure(&mut self, c: &Closure) -> String {
        // A builder (`{ Text("a"); Text("b") }` where a `() -> View` goes): its lines are drawn.
        if self.file.checked.closures.get(&c.span).is_some_and(|i| i.builder) {
            return self.view_closure(c, 1);
        }
        let shorthand = !c.has_in && c.params.len() == 1 && c.params[0].name.name == "$0";
        let saved = self.shorthand_it;
        self.shorthand_it = shorthand;
        let params: Vec<String> = c.params.iter().map(|q| kw(&q.name.name.replace('$', "p"))).collect();
        let head = if shorthand || params.is_empty() {
            String::new()
        } else if c.tuple {
            // `{ (i, x) in … }`: one tuple (a `Pair`, `xs.enumerated()`'s), destructured.
            format!("({}) -> ", params.join(", "))
        } else {
            format!("{} -> ", params.join(", "))
        };
        let text = if c.body.len() == 1
            && let StmtKind::Expr(e) = &c.body[0].kind
            && !matches!(e.kind, ExprKind::If(_) | ExprKind::Match(_))
        {
            format!("{{ {head}{} }}", self.expr(e))
        } else {
            let body = self.block(&c.body, 2, Mode::Lambda);
            format!("{{ {head}\n{body}}}")
        };
        self.shorthand_it = saved;
        text
    }

    fn string(&mut self, parts: &[StrPart]) -> String {
        let mut out = String::from("\"");
        for part in parts {
            match part {
                StrPart::Text(t) => {
                    for ch in t.chars() {
                        match ch {
                            '"' => out.push_str("\\\""),
                            '\\' => out.push_str("\\\\"),
                            '$' => out.push_str("\\$"),
                            '\n' => out.push_str("\\n"),
                            '\r' => out.push_str("\\r"),
                            '\t' => out.push_str("\\t"),
                            c if (c as u32) < 0x20 => {
                                let _ = write!(out, "\\u{:04x}", c as u32);
                            }
                            c => out.push(c),
                        }
                    }
                }
                StrPart::Interp(e) => {
                    let _ = write!(out, "${{{}}}", self.expr(e));
                }
            }
        }
        out.push('"');
        out
    }

    fn implicit(&mut self, e: &Expr, name: &Ident) -> String {
        use bloom_lang::backend::FieldRes;
        // `.dateTime` where a `DateFormat` goes: the type's static (`DateFormat__dateTime`).
        match self.file.checked.fields.get(&e.id) {
            Some(FieldRes::Static(n)) => return static_name(n),
            Some(FieldRes::StaticGet(n)) => return static_name(&n.replacen("$$get$", "$$", 1)),
            _ => {}
        }
        if let Some(ty) = self.ty_of(e).map(|t| self.bloom_name(t)) {
            let ty = ty.trim_end_matches('?');
            for lowered in [format!("{ty}$$get${}", name.name), format!("{ty}$$${}", name.name)] {
                if self.decls.static_lets.contains(&lowered) || self.decls.static_getters.contains(&lowered) {
                    return static_name(&lowered.replacen("$$get$", "$$", 1));
                }
            }
        }
        // A token where the spec takes one (`.muted`, `.lg`): the runtime's token constant.
        if let Some(Ty::Strings(set)) = self.ty_of(e).map(|t| match t {
            Ty::Option(inner) => inner.as_ref(),
            t => t,
        }) && set.token
        {
            return format!("{}.{}", token_set_class(&set.name), token_name(&name.name));
        }
        let ty = self.ty_of(e).map(|t| self.bloom_name(t)).or_else(|| self.type_at(e.span).map(String::from));
        match ty.map(|t| t.trim_end_matches('?').to_string()) {
            Some(ty) => match self.decls.enums.get(&ty) {
                Some(info) if info.has_payload() => format!("{ty}.{}", upper_first(&name.name)),
                _ => format!("{ty}.{}", kw(&name.name)),
            },
            None => self.unsupported(e.span, format!("`.{}` (its type is unknown here)", name.name)),
        }
    }

    fn expr(&mut self, e: &Expr) -> String {
        match &e.kind {
            // An integer literal is a `Long` (`Int` is 64-bit), or a `Double` where one is expected.
            ExprKind::Int(n) => match self.ty_of(e) {
                Some(Ty::Float) => format!("{n}.0"),
                _ => format!("{n}L"),
            },
            ExprKind::Float(f) => {
                let s = f.to_string();
                if s.contains('.') || s.contains('e') { s } else { format!("{s}.0") }
            }
            ExprKind::Bool(b) => b.to_string(),
            ExprKind::None => "null".into(),
            ExprKind::Unit => "Unit".into(),
            // `"xs"` where a token goes (a space, a colour): the runtime's token constant.
            ExprKind::Str { parts, .. }
                if let [StrPart::Text(t)] = parts.as_slice()
                    && let Some(Ty::Strings(set)) = self.ty_of(e)
                    && set.token =>
            {
                format!("{}.{}", token_set_class(&set.name), token_name(t))
            }
            ExprKind::Str { parts, .. } => self.string(parts),
            ExprKind::Name(n) if n == "self" => "this".into(),
            ExprKind::Name(n) if n == "$0" && self.shorthand_it => "it".into(),
            ExprKind::Name(n) if self.binding_props.contains(n) => format!("{}.value", kw(n)),
            // A lowered static (`String$$decode` in derived code): a function as a value is a
            // reference, a `let` its value.
            ExprKind::Name(n) if n.contains("$$") => {
                if self.decls.static_fns.contains(n) {
                    format!("::{}", static_name(n))
                } else {
                    static_name(n)
                }
            }
            // A top-level function as a value (`xs.map(format)`): a function reference.
            // (A name the checker types as a value, a member field named as a function, is the field.)
            ExprKind::Name(n)
                if self.decls.funcs.contains_key(n)
                    && !self.is_local(e)
                    && !matches!(self.ty_of(e), Some(t) if !matches!(t, Ty::Fn(_))) =>
            {
                format!("::{}", kw(n))
            }
            ExprKind::Name(n) => kw(&n.replace('$', "p")),
            ExprKind::ImplicitMember(name) => self.implicit(e, name),
            ExprKind::Binding(path) if path.len() == 1 && self.binding_props.contains(&path[0].name) => {
                kw(&path[0].name)
            }
            ExprKind::Binding(path) => {
                let place: Vec<String> = path.iter().map(|i| kw(&i.name)).collect();
                let place = place.join(".");
                format!("Binding({{ {place} }}, {{ {place} = it }})")
            }
            ExprKind::Paren(inner) => format!("({})", self.expr(inner)),
            ExprKind::Tuple(items) if items.len() == 2 => {
                format!("Pair({}, {})", self.expr(&items[0]), self.expr(&items[1]))
            }
            ExprKind::Tuple(items) if items.len() == 3 => {
                format!(
                    "Triple({}, {}, {})",
                    self.expr(&items[0]),
                    self.expr(&items[1]),
                    self.expr(&items[2])
                )
            }
            // `[..a, x]`: a list built from its parts.
            ExprKind::List(items) if items.iter().any(|i| matches!(i.kind, ExprKind::Spread(_))) => {
                let parts: Vec<String> = items
                    .iter()
                    .map(|i| match &i.kind {
                        ExprKind::Spread(inner) => format!("addAll({})", self.expr(inner)),
                        _ => format!("add({})", self.expr(i)),
                    })
                    .collect();
                format!("buildList {{ {} }}", parts.join("; "))
            }
            // `[]` and `[:]`: typed by the checker, as Kotlin cannot infer an empty `listOf()`'s.
            ExprKind::List(items) if items.is_empty() => match self.ty_of(e).and_then(|t| self.kty(t)) {
                Some(t) if t.starts_with("List<") => format!("listOf<{}>()", &t[5..t.len() - 1]),
                _ => "listOf()".into(),
            },
            ExprKind::Map(entries) if entries.is_empty() => match self.ty_of(e).and_then(|t| self.kty(t)) {
                Some(t) if t.starts_with("Map<") => format!("mapOf<{}>()", &t[4..t.len() - 1]),
                _ => "mapOf()".into(),
            },
            ExprKind::List(items) => {
                let items: Vec<String> = items.iter().map(|i| self.expr(i)).collect();
                format!("listOf({})", items.join(", "))
            }
            ExprKind::Map(entries) => {
                let items: Vec<String> =
                    entries.iter().map(|(k, v)| format!("{} to {}", self.expr(k), self.expr(v))).collect();
                format!("mapOf({})", items.join(", "))
            }
            ExprKind::Unary(op, inner) => {
                let inner = self.expr(inner);
                match op {
                    UnaryOp::Not => format!("!{inner}"),
                    UnaryOp::Neg => format!("-{inner}"),
                }
            }
            ExprKind::Binary(op, a, b) => {
                let (a, b) = (self.expr(a), self.expr(b));
                let op = match op {
                    BinaryOp::Default => "?:",
                    other => other.text(),
                };
                format!("{a} {op} {b}")
            }
            ExprKind::Ternary(c, a, b) => {
                format!("(if ({}) {} else {})", self.expr(c), self.expr(a), self.expr(b))
            }
            ExprKind::Await(inner) => self.expr(inner),
            ExprKind::Force(inner) => format!("{}!!", self.expr(inner)),
            ExprKind::Throwing(kind, inner) => {
                let inner = self.expr(inner);
                match kind {
                    TryKind::Optional => format!("runCatching {{ {inner} }}.getOrNull()"),
                    TryKind::Plain | TryKind::Force => inner,
                }
            }
            ExprKind::Field(base, field) => self.field(e, base, field),
            ExprKind::OptField(base, field) => format!("{}?.{}", self.expr(base), kw(&field.name)),
            ExprKind::Index(base, index) => format!("{}[{}]", self.expr(base), self.expr(index)),
            ExprKind::Call(call) => self.call(e, call),
            ExprKind::Closure(c) => self.closure(c),
            ExprKind::If(i) if matches!(i.cond, Cond::Let(..)) => self.if_let_value(i),
            ExprKind::If(i) => {
                let (cond, _) = self.cond(&i.cond, 0);
                let then = self.value_of(&i.then.stmts);
                let otherwise = match i.otherwise.as_deref() {
                    Some(Else::Block(b)) => self.value_of(&b.stmts),
                    Some(Else::If(x)) => self.expr(x),
                    None => "Unit".into(),
                };
                format!("(if ({cond}) {then} else {otherwise})")
            }
            ExprKind::Match(m) => {
                let text = self.match_stmt(m, 1, Mode::Lambda, None);
                text.trim().to_string()
            }
            ExprKind::Task(block) => {
                self.needs_scope = true;
                let body = self.block(&block.stmts, 2, Mode::Unit);
                format!("scope.launch {{\n{body}  }}")
            }
            ExprKind::Record(_) => self.unsupported(e.span, "a record literal"),
            _ => self.unsupported(e.span, "this expression"),
        }
    }

    /// `if let x = v { a } else { b }` as a value: `run { val x = v; if (x != null) a else b }`,
    /// so the binding is the smart-cast value in `a` and nothing outside.
    fn if_let_value(&mut self, i: &IfExpr) -> String {
        let Cond::Let(pat, value) = &i.cond else { unreachable!("an if let") };
        let PatternKind::Bind(n) = &pat.kind else {
            return self.unsupported(pat.span, "this `if let` pattern");
        };
        let v = self.expr(value);
        let then = self.value_of(&i.then.stmts);
        let otherwise = match i.otherwise.as_deref() {
            Some(Else::Block(b)) => self.value_of(&b.stmts),
            Some(Else::If(x)) => self.expr(x),
            None => "Unit".into(),
        };
        let name = kw(&n.name);
        format!("run {{ val {name} = {v}; if ({name} != null) {then} else {otherwise} }}")
    }

    fn value_of(&mut self, stmts: &[Stmt]) -> String {
        match stmts {
            [Stmt { kind: StmtKind::Expr(e), .. }] => self.expr(e),
            _ => {
                let body = self.block(stmts, 2, Mode::Lambda);
                format!("run {{\n{body}}}")
            }
        }
    }

    /// `x.count`, `xs.isEmpty`: the standard library's properties that are Kotlin functions
    /// or other names; a computed property of the app's extension stays a property.
    fn field(&mut self, e: &Expr, base: &Expr, field: &Ident) -> String {
        use bloom_lang::backend::FieldRes;
        // `PrefKey.allCases` (`CaseIterable`): an enum class's `entries`.
        if field.name == "allCases"
            && let ExprKind::Name(n) = &base.kind
            && self.decls.enums.contains_key(n)
        {
            return format!("{n}.entries");
        }
        // `T.m`, a static member: its top-level declaration (`Post.self` is `Post__self`), a
        // function read as a value being a reference to it.
        match self.file.checked.fields.get(&e.id) {
            Some(FieldRes::Static(name)) => {
                return if self.decls.static_fns.contains(name.as_ref()) {
                    format!("::{}", static_name(name))
                } else {
                    static_name(name)
                };
            }
            Some(FieldRes::StaticGet(name)) => return static_name(&name.replacen("$$get$", "$$", 1)),
            // A task's cancellation is its coroutine's: `await Task.cancellation` suspends until
            // the effect is cancelled (its `defer` runs in the `finally`), `Task.isCancelled`
            // reads the job. Work given no cancellation (core12's `implicit_signals`) needs
            // nothing passed: a suspend call is cancelled with its coroutine.
            Some(FieldRes::TaskCancellation) => return "kotlinx.coroutines.awaitCancellation()".into(),
            Some(FieldRes::TaskCancelled) => return "(kotlinx.coroutines.currentCoroutineContext()[kotlinx.coroutines.Job]?.isActive == false)".into(),
            // A dictionary's `keys`, `values` and `entries` are lists (of pairs, for `entries`).
            Some(FieldRes::Prop {
                recv: bloom_lang::backend::Recv::Map | bloom_lang::backend::Recv::JsMap,
                name,
            }) if matches!(*name, "keys" | "values" | "entries") => {
                let b = self.expr(base);
                return match *name {
                    "entries" => format!("{b}.toList()"),
                    other => format!("{b}.{other}.toList()"),
                };
            }
            // `t.0`: a `Pair`'s or `Triple`'s component.
            Some(FieldRes::Index(i)) => {
                let b = self.expr(base);
                let name = ["first", "second", "third"].get(*i).copied().unwrap_or("first");
                return format!("{b}.{name}");
            }
            _ => {}
        }
        // `T.self` of a `Codable` type parameter: its codec, passed as a witness.
        if field.name == "self"
            && let ExprKind::Name(n) = &base.kind
            && let Some(codec) = self.codecs.get(n)
        {
            return codec.clone();
        }
        let ty = self.receiver_type(base).unwrap_or_default();
        let b = self.expr(base);
        let list = ty.starts_with('[');
        let string = ty == "String";
        // `PostKind.text`: a payload enum's case without a payload is an object.
        if let ExprKind::Name(n) = &base.kind
            && let Some(info) = self.decls.enums.get(n)
        {
            // `PrefKey.allCases` (`CaseIterable`): an enum class's `entries`.
            if field.name == "allCases" {
                return format!("{n}.entries");
            }
            if info.has_payload() {
                return format!("{n}.{}", upper_first(&field.name));
            }
        }
        match field.name.as_str() {
            // `count` is the runtime's: a `Long`, and a string's counts grapheme clusters.
            "count" if list || string => format!("{b}.count"),
            "isEmpty" if list || string => format!("{b}.isEmpty()"),
            "first" if list => format!("{b}.firstOrNull()"),
            "last" if list => format!("{b}.lastOrNull()"),
            name => format!("{b}.{}", kw(name)),
        }
    }

    fn call(&mut self, _e: &Expr, call: &Call) -> String {
        match &call.callee.kind {
            ExprKind::Name(n) => {
                let n = n.as_str();
                // `Binding(get: v, set: f)`: a value and its setter.
                // `Task { … }` in a handler: launched on the view's scope.
                if n == "Task"
                    && call.args.is_empty()
                    && let Some(c) = call.trailing.as_deref()
                {
                    self.needs_scope = true;
                    let body = self.block(&c.body, 2, Mode::Unit);
                    return format!("scope.launch {{\n{body}  }}");
                }
                if n == "Binding" {
                    let get = call.args.iter().find(|a| a.label.as_ref().is_some_and(|l| l.name == "get"));
                    let set = call.args.iter().find(|a| a.label.as_ref().is_some_and(|l| l.name == "set"));
                    let get = get.map(|a| self.expr(&a.value)).unwrap_or_default();
                    let set = set.map(|a| self.expr(&a.value)).unwrap_or_default();
                    return format!("Binding({{ {get} }}, {set})");
                }
                // A name the checker resolved to a lowered static (`Date(timeIntervalSince1970: s)`
                // is `Date$$init$timeIntervalSince1970`).
                let resolved = match self.file.checked.names.get(&call.callee.id) {
                    Some(bloom_lang::backend::NameRes::Local(l)) => {
                        self.file
                            .checked
                            .locals
                            .get(*l)
                            .map(|l| l.name.clone())
                            .filter(|r| r.contains("$$") && r != n)
                            // A declared type's `init` is its Kotlin constructor.
                            .filter(|r| {
                                bloom_lang::backend::demangle(r)
                                    .is_some_and(|(o, _, _)| !self.decls.declared.contains(o))
                            })
                    }
                    _ => None,
                };
                if let Some(lowered) = resolved {
                    let args = self.args_by(
                        None,
                        &Call {
                            args: call.args.iter().map(|a| Arg { label: None, ..a.clone() }).collect(),
                            ..call.clone()
                        },
                    );
                    return format!("{}({})", static_name(&lowered), args.join(", "));
                }
                // `min`, `max`, `abs`, `round`, `floor`, `ceil`: JavaScript's `Math`, which rounds
                // half toward +infinity; an `Int` result is a `Long`.
                if let Some(bloom_lang::backend::CallRes::Math(name)) = self.file.checked.calls.get(&_e.id) {
                    let args = self.args_by(None, call);
                    let a = args.join(", ");
                    let int = matches!(self.ty_of(_e), Some(Ty::Int));
                    let text = match *name {
                        "min" => format!("minOf({a})"),
                        "max" => format!("maxOf({a})"),
                        "abs" => format!("kotlin.math.abs({a})"),
                        "round" => format!("kotlin.math.floor(({a}).toDouble() + 0.5)"),
                        other => format!("kotlin.math.{other}(({a}).toDouble())"),
                    };
                    return if int && matches!(*name, "round" | "floor" | "ceil") {
                        format!("{text}.toLong()")
                    } else {
                        text
                    };
                }
                // A lowered static called by name (derived code's `Optional$$decode(…)`).
                if n.contains("$$") {
                    let params = bloom_lang::backend::demangle(n).and_then(|(o, m, _)| {
                        self.decls.methods.get(&(o.to_string(), m.to_string())).cloned()
                    });
                    let mut args = self.args_by(params.as_deref(), call);
                    args.extend(self.witness_args(_e.id));
                    return format!("{}({})", static_name(n), args.join(", "));
                }
                let mut args = self.call_args(n, call);
                args.extend(self.witness_args(_e.id));
                format!("{}({})", kw(n), args.join(", "))
            }
            ExprKind::Field(_, method)
                if let Some(bloom_lang::backend::FieldRes::Static(name)) =
                    self.file.checked.fields.get(&call.callee.id) =>
            {
                let owner =
                    bloom_lang::backend::demangle(name).map(|(o, _, _)| o.to_string()).unwrap_or_default();
                let params = self.decls.methods.get(&(owner, method.name.clone())).cloned();
                let mut args = self.args_by(params.as_deref(), call);
                args.extend(self.witness_args(_e.id));
                format!("{}({})", static_name(name), args.join(", "))
            }
            ExprKind::Field(base, method) => {
                // `PostKind.image(url:aspect:)`: a payload case constructed.
                if let ExprKind::Name(ty) = &base.kind
                    && let Some(info) = self.decls.enums.get(ty)
                    && info.has_payload()
                {
                    let args = self.args_by(None, call);
                    return format!("{ty}.{}({})", upper_first(&method.name), args.join(", "));
                }
                let recv_ty = self.receiver_type(base).unwrap_or_default();
                let recv_ty = recv_ty.trim_end_matches('?').to_string();
                let params = self.decls.methods.get(&(recv_ty.clone(), method.name.clone())).cloned();
                let b = self.expr(base);
                let mut args = self.args_by(params.as_deref(), call);
                args.extend(self.witness_args(_e.id));
                // Swift's `reduce(_ initial:, _ next:)` is Kotlin's `fold`.
                if method.name == "reduce" && call.args.len() + usize::from(call.trailing.is_some()) == 2 {
                    let args = self.args_by(None, call);
                    return format!("{b}.fold({})", args.join(", "));
                }
                if method.name == "enumerated" && call.args.is_empty() {
                    return format!("{b}.enumerated()");
                }
                // The compiler's built-in members where Kotlin's own member of that name means
                // something else (`Long.toFloat()` is a 32-bit `Float`, `List.indexOf` an `Int`).
                if let Some(bloom_lang::backend::CallRes::Method { recv, name }) =
                    self.file.checked.calls.get(&_e.id)
                {
                    use bloom_lang::backend::Recv;
                    let joined = args.join(", ");
                    match (recv, *name) {
                        (Recv::Int, "toFloat") => return format!("{b}.toDouble()"),
                        (Recv::Str, "toInt") => return format!("{b}.toLongOrNull()"),
                        (Recv::Str, "toFloat") => return format!("{b}.toDoubleOrNull()"),
                        (Recv::List, "indexOf") => return format!("{b}.bloomIndexOf({joined})"),
                        (Recv::List, "find") => return format!("{b}.firstOrNull({joined})"),
                        (Recv::List, "compactMap") => return format!("{b}.mapNotNull({joined})"),
                        (Recv::Option, "map") => return format!("{b}?.let({joined})"),
                        (Recv::Option, "unwrapOr") => return format!("({b} ?: {joined})"),
                        // core12's natural order (no comparator, over Int, Float, String or
                        // Date): `min`/`max` are `T?`, `sorted` Kotlin's own.
                        (Recv::List, "min" | "max") if self.file.checked.natural_orders.contains(&_e.id) => {
                            return format!("{b}.{name}OrNull()");
                        }
                        (Recv::List, "sorted") if self.file.checked.natural_orders.contains(&_e.id) => {
                            return format!("{b}.sorted()");
                        }
                        _ => {}
                    }
                }
                let name = match (recv_ty.starts_with('['), recv_ty == "String", method.name.as_str()) {
                    (_, true, "lowercased") => "lowercase",
                    (_, true, "uppercased") => "uppercase",
                    (_, true, "replacingOccurrences") => "replacingOccurrences",
                    (_, _, other) => other,
                };
                let name = kw(name);
                format!("{b}.{name}({})", args.join(", "))
            }
            _ => {
                let callee = self.expr(&call.callee);
                let args = self.args_by(None, call);
                format!("{callee}({})", args.join(", "))
            }
        }
    }
}

/// Whether `text` uses the identifier `name` (not as part of a longer one).
fn mentions(text: &str, name: &str) -> bool {
    let ident = |c: char| c.is_alphanumeric() || c == '_';
    text.match_indices(name).any(|(at, _)| {
        let before = text[..at].chars().next_back();
        let after = text[at + name.len()..].chars().next();
        !before.is_some_and(ident) && !after.is_some_and(ident)
    })
}

fn is_void(t: &TypeExpr) -> bool {
    match &t.kind {
        TypeKind::Named { name, .. } => matches!(name.name.as_str(), "Void" | "Unit"),
        TypeKind::Tuple(items) => items.is_empty(),
        _ => false,
    }
}

/// The derived coder of a written type, as a Kotlin function value: its decoder
/// (`(JSONValue, String) -> T`) or its encoder (`(T) -> JSONValue`), as `codable.rs` composes
/// them (`[Post]` is `Array__decoder(::Post__decode)`).
fn coder(t: &TypeExpr, decode: bool) -> Option<String> {
    let (member, list) = if decode { ("decode", "decoder") } else { ("encode", "encoder") };
    Some(match &t.kind {
        TypeKind::Named { name, args } if args.is_empty() => {
            let owner = match name.name.as_str() {
                "Float" => "Double",
                other => other,
            };
            format!("::{owner}__{member}")
        }
        TypeKind::List(e) => format!("Array__{list}({})", coder(e, decode)?),
        TypeKind::Optional(e) => format!("Optional__{list}({})", coder(e, decode)?),
        TypeKind::Map(k, v) if matches!(&k.kind, TypeKind::Named { name, .. } if name.name == "String") => {
            format!("Dictionary__{list}({})", coder(v, decode)?)
        }
        _ => return None,
    })
}

/// A declaration's Kotlin name: a lowered static's (`Post$$decode`) is `Post__decode`.
fn decl_name(name: &str) -> String {
    if name.contains('$') { static_name(name) } else { kw(name) }
}

/// `fun …` of a static member of a generic type, with the type's parameters first.
fn with_type_params(text: String, generics: &[String]) -> String {
    if generics.is_empty() {
        return text;
    }
    let list = generics.join(", ");
    match text.find("fun <") {
        Some(at) if text[..at].lines().count() <= 1 => text.replacen("fun <", &format!("fun <{list}, "), 1),
        _ => text.replacen("fun ", &format!("fun <{list}> "), 1),
    }
}

/// A built-in type's Kotlin receiver for its extensions, and the type parameters it brings
/// (`extension Array` is `List<Element>`, generic over `Element`).
fn builtin_receiver(ty: &str) -> (String, &'static [&'static str]) {
    match ty {
        "String" => ("String".into(), &[]),
        "Int" => ("Long".into(), &[]),
        "Double" | "Float" => ("Double".into(), &[]),
        "Bool" => ("Boolean".into(), &[]),
        "Array" => ("List<Element>".into(), &["Element"]),
        "Set" => ("Set<Element>".into(), &["Element"]),
        "Dictionary" => ("Map<String, Value>".into(), &["Value"]),
        "Optional" => ("Wrapped?".into(), &["Wrapped"]),
        "Result" => ("BloomResult<Success, Failure>".into(), &["Success", "Failure"]),
        "Error" => ("Throwable".into(), &[]),
        other => (other.to_string(), &[]),
    }
}

/// A checker witness name (`$w_T_Codable`) as a Kotlin identifier.
fn witness_name(name: &str) -> String {
    name.replace('$', "_")
}

/// The runtime's class for one of the spec's token sets, by the set's name.
fn token_set_class(set: &str) -> String {
    match set {
        "color" | "colorRole" | "foreground" => "Colors".into(),
        "space" | "spacing" => "Space".into(),
        "font" | "textStyle" => "Font".into(),
        "corner" | "radius" => "Corner".into(),
        "tone" => "Tone".into(),
        "controlSize" | "size" => "ControlSize".into(),
        "weight" | "fontWeight" => "Weight".into(),
        other => upper_first(other),
    }
}

fn is_edge(name: &str) -> bool {
    matches!(name, "all" | "horizontal" | "vertical" | "top" | "bottom" | "leading" | "trailing")
}

/// A token's Kotlin name: `2xl` is not an identifier (`_2xl`), nor is `caption-1` (`caption1`).
/// A token's Kotlin name, as `scripts/native-theme-kotlin.ts` names it: `caption-1` is
/// `caption1`, `large-title` `largeTitle`, `2xl` `_2xl`, `12.5` `_12_5`.
fn token_name(name: &str) -> String {
    let mut flat = String::new();
    let mut upper = false;
    for c in name.chars() {
        match c {
            '-' => upper = !flat.is_empty(),
            '.' => flat.push('_'),
            c if upper => {
                flat.extend(c.to_uppercase());
                upper = false;
            }
            c => flat.push(c),
        }
    }
    let name = flat;
    match name.chars().next() {
        Some(c) if c.is_ascii_digit() => format!("_{name}"),
        _ => kw(&name),
    }
}

fn pad(indent: usize) -> String {
    "  ".repeat(indent)
}

#[allow(dead_code)]
fn names(set: &BTreeSet<String>) -> String {
    set.iter().cloned().collect::<Vec<_>>().join(", ")
}
