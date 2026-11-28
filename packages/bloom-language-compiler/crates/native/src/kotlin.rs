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

use crate::{Decls, Emitted, EnumInfo, ParamInfo, Problem, Program, SourceFile, escape, upper_first};

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
    let mut out = Vec::new();
    let mut problems = Vec::new();
    let packages: Vec<String> = program.modules.iter().map(|m| package_of(&program.name, &m.name)).collect();
    for module in &program.modules {
        let package = package_of(&program.name, &module.name);
        for file in &module.files {
            let mut e = Emitter::new(&program.decls, file);
            let text = e.file(&package, &packages);
            problems.extend(e.problems);
            let stem = file.path.file_stem().unwrap_or_default().to_string_lossy().into_owned();
            let dir: PathBuf = package.split('.').collect();
            out.push(Emitted { path: dir.join(format!("{stem}.kt")), text });
        }
    }
    if problems.is_empty() { Ok(out) } else { Err(problems) }
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

/// The built-in nodes the runtime draws (BloomUI's names, as Bloom writes them).
const NODES: &[&str] = &[
    "Text",
    "Icon",
    "Avatar",
    "Image",
    "Spacer",
    "ProgressView",
    "Toggle",
    "Button",
    "VStack",
    "HStack",
    "ZStack",
    "ScrollView",
    "VirtualList",
    "List",
    "GroupedSection",
    "GroupedSectionItem",
    "ActionBar",
    "Action",
    "NavigationStack",
    "Divider",
];

/// A modifier every node takes: a `Modifier` extension of the runtime.
fn universal(name: &str) -> bool {
    matches!(
        name,
        "padding"
            | "frame"
            | "background"
            | "corner"
            | "opacity"
            | "aspectRatio"
            | "onTapGesture"
            | "border"
            | "grow"
            | "shrink"
    )
}

/// The token class an implicit member is read from, by the modifier or argument it is in.
fn token_class(node: &str, param: &str) -> &'static str {
    match (node, param) {
        (_, "spacing") => "Space",
        ("HStack", "alignment") => "VAlign",
        ("VStack", "alignment") => "HAlign",
        ("ZStack", "alignment") => "Align",
        (_, "font") => "Font",
        (_, "foregroundStyle") | (_, "foreground") | (_, "background") => "Colors",
        ("Avatar", "size") => "AvatarSize",
        ("Icon", "size") => "IconSize",
        (_, "size") | (_, "controlSize") => "ControlSize",
        ("Button", "style") => "ButtonStyle",
        (_, "contentFit") => "ContentFit",
        (_, "corner") => "Corner",
        (_, "tint") => "Tone",
        (_, "icon") => "Icons",
        (_, "edge") => "Edge",
        (_, "length") => "Length",
        (_, "weight") => "Weight",
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

    fn file(&mut self, package: &str, packages: &[String]) -> String {
        let mut out = String::new();
        let _ = writeln!(
            out,
            "// Generated by bloom-native --target kotlin-compose from {}. Do not edit.",
            self.file_name()
        );
        out.push_str("@file:Suppress(\"UNUSED_VARIABLE\", \"UNUSED_PARAMETER\", \"NAME_SHADOWING\", \"unused\", \"RedundantSuppression\")\n\n");
        let _ = writeln!(out, "package {package}\n");
        out.push_str("import androidx.compose.runtime.*\nimport androidx.compose.ui.Modifier\nimport kotlinx.coroutines.launch\nimport so.oxy.bloom.ui.*\nimport so.oxy.bloom.std.*\n");
        for other in packages.iter().filter(|p| p.as_str() != package) {
            let _ = writeln!(out, "import {other}.*");
        }
        out.push('\n');
        let items = self.file.ast.items.clone();
        for item in &items {
            let text = self.item(item);
            if !text.is_empty() {
                out.push_str(&text);
                out.push('\n');
            }
        }
        out
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
                    "Int" => "Int".to_string(),
                    "Float" | "Double" => "Double".to_string(),
                    "String" | "Character" => "String".to_string(),
                    "Void" | "Unit" => "Unit".to_string(),
                    "Self" => return "Self".into(),
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
            TypeKind::Optional(inner) => format!("{}?", self.ty(inner)),
            TypeKind::Fn { is_async, params, ret } => {
                let params: Vec<String> = params.iter().map(|p| self.ty(p)).collect();
                let ret = self.ty(ret);
                let suspend = if *is_async { "suspend " } else { "" };
                format!("{suspend}({}) -> {ret}", params.join(", "))
            }
            TypeKind::Tuple(items) if items.is_empty() => "Unit".into(),
            TypeKind::Tuple(items) if items.len() == 2 => {
                format!("Pair<{}, {}>", self.ty(&items[0]), self.ty(&items[1]))
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
            ItemKind::Fn(f) => self.func(vis, f, None, 0),
            ItemKind::View(v) => self.view(vis, v),
            ItemKind::Const(c) => {
                let ty = c.ty.as_ref().map(|t| format!(": {}", self.ty(t))).unwrap_or_default();
                let value = self.expr(&c.value);
                format!("{vis}val {}{ty} = {value}\n", kw(&c.name.name))
            }
            ItemKind::Extension(x) => self.extension(x),
            ItemKind::Alias(a) => {
                let ty = self.ty(&a.ty);
                format!("{vis}typealias {} = {ty}\n", a.name.name)
            }
            ItemKind::Protocol(p) => self.unsupported(p.span, "a protocol").replace("TODO()", ""),
            ItemKind::Class(c) => self.unsupported(c.name.span, "a class").replace("TODO()", ""),
            ItemKind::Extern(x) => self.unsupported(x.package.span, "an extern module").replace("TODO()", ""),
            ItemKind::Test(_) => String::new(),
        }
    }

    fn conformances(body: Option<&TypeBody>) -> Vec<String> {
        body.map(|b| {
            b.conformances
                .iter()
                .filter_map(|c| match &c.kind {
                    TypeKind::Named { name, .. } => Some(name.name.clone()),
                    _ => None,
                })
                .collect()
        })
        .unwrap_or_default()
    }

    fn struct_decl(&mut self, vis: &str, s: &StructDecl) -> String {
        let conforms = Self::conformances(s.surface.as_deref());
        let identifiable = conforms.iter().any(|c| c == "Identifiable");
        let mut fields = Vec::new();
        for f in &s.fields {
            let ty = self.ty(&f.ty);
            let default = match &f.default {
                Some(d) => format!(" = {}", self.expr(d)),
                None => String::new(),
            };
            let over = if identifiable && f.name.name == "id" { "override " } else { "" };
            fields.push(format!("  {over}val {}: {ty}{default},", kw(&f.name.name)));
        }
        let supers = if identifiable { " : Identifiable" } else { "" };
        // A struct is a value: `data class` gives it structural `==`, `hashCode` and `copy`,
        // and Compose treats a class of `val`s of stable types as stable (it skips on `==`).
        let mut out =
            format!("@Immutable\n{vis}data class {}(\n{}\n){supers}\n", s.name.name, fields.join("\n"));
        if s.fields.is_empty() {
            out = format!("{vis}data object {}\n", s.name.name);
        }
        // Methods written inside the struct (2.0) are emitted as extensions.
        if let Some(surface) = &s.surface {
            for m in &surface.members {
                out.push_str(&self.type_member(&s.name.name, m));
            }
        }
        out
    }

    fn enum_decl(&mut self, vis: &str, e: &EnumDecl) -> String {
        let info = self.decls.enums.get(&e.name.name).cloned().unwrap_or_default();
        let mut out = String::new();
        if !info.has_payload() {
            let cases: Vec<String> = e.variants.iter().map(|v| kw(&v.name.name)).collect();
            let _ = writeln!(out, "{vis}enum class {} {{ {} }}", e.name.name, cases.join(", "));
        } else {
            let _ = writeln!(out, "@Immutable\n{vis}sealed interface {} {{", e.name.name);
            for v in &e.variants {
                let class = upper_first(&v.name.name);
                if v.payload.is_empty() {
                    let _ = writeln!(out, "  data object {class} : {}", e.name.name);
                } else {
                    let fields: Vec<String> = v
                        .payload
                        .iter()
                        .enumerate()
                        .map(|(i, p)| {
                            let name = p.name.as_ref().map(|n| n.name.clone()).unwrap_or(format!("_{i}"));
                            format!("val {}: {}", kw(&name), self.ty(&p.ty))
                        })
                        .collect();
                    let _ = writeln!(out, "  data class {class}({}) : {}", fields.join(", "), e.name.name);
                }
            }
            out.push_str("}\n");
        }
        for m in &e.members {
            out.push_str(&self.type_member(&e.name.name, m));
        }
        out
    }

    fn extension(&mut self, x: &ExtensionDecl) -> String {
        let mut out = String::new();
        for m in &x.body.members {
            out.push_str(&self.type_member(&x.name.name, m));
        }
        out
    }

    /// A member of a type, as a Kotlin extension on it.
    fn type_member(&mut self, ty: &str, m: &TypeMember) -> String {
        let vis = Self::visibility(m.visibility);
        match &m.kind {
            TypeMemberKind::Func(f) if m.modifiers.is_static && f.name.name == "==" => String::new(),
            TypeMemberKind::Func(f) if m.modifiers.is_static => {
                // `static func` → a member of the companion is not possible on a data class
                // declared elsewhere; a top-level function named `Type_name` stands in.
                self.func(vis, f, Some(&format!("{ty}.Companion")), 0)
            }
            TypeMemberKind::Func(f) => self.func(vis, f, Some(ty), 0),
            TypeMemberKind::Computed { name, ty: rty, body } => {
                let rt = self.ty(rty);
                self.locals.push(HashMap::new());
                let body_text = self.block(&body.stmts, 1, Mode::Value);
                self.locals.pop();
                format!("{vis}val {ty}.{}: {rt}\n  get() {{\n{body_text}  }}\n", kw(&name.name))
            }
            // Stored properties are the struct's fields.
            TypeMemberKind::Stored { .. } | TypeMemberKind::Let(_) => String::new(),
        }
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
        let composable = if returns_view { "@Composable " } else { "" };
        let recv = receiver.map(|r| format!("{r}.")).unwrap_or_default();
        let params = self.params(&f.params, f.func);
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
        let p = pad(indent);
        format!(
            "{p}{composable}{vis}{suspend}fun {recv}{}({params}){ret} {{\n{body}{p}}}\n",
            kw(&f.name.name)
        )
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
            }
        }
        props.push("modifier: Modifier = Modifier".into());
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
        self.locals.pop();
        let scope_line = if self.needs_scope { "  val scope = rememberCoroutineScope()\n" } else { "" };
        format!(
            "@Composable\n{vis}fun {}({}) {{\n{scope_line}{body}{drawn}}}\n",
            v.name.name,
            props.join(", ")
        )
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
            StmtKind::Var(v) => {
                let ty = v.ty.as_ref().map(|t| format!(": {}", self.ty(t))).unwrap_or_default();
                let value = self.expr(&v.value);
                format!("{p}var {}{ty} = {value}\n", kw(&v.name.name))
            }
            StmtKind::Assign(a) => {
                let value = self.expr(&a.value);
                match &a.target.kind {
                    // `p.likes = v` on a value: a copy with the field changed.
                    ExprKind::Field(base, field)
                        if matches!(base.kind, ExprKind::Name(_)) && a.op == AssignOp::Set =>
                    {
                        let base = self.expr(base);
                        format!("{p}{base} = {base}.copy({} = {value})\n", kw(&field.name))
                    }
                    _ => {
                        let target = self.expr(&a.target);
                        format!("{p}{target} {} {value}\n", a.op.text())
                    }
                }
            }
            StmtKind::Return(Some(e)) => format!("{p}return {}\n", self.expr(e)),
            StmtKind::Return(None) => format!("{p}return\n"),
            StmtKind::Defer(_) => unreachable!("handled by block"),
            StmtKind::While(w) => {
                let cond = self.expr(&w.cond);
                let body = self.block(&w.body.stmts, indent + 1, Mode::Unit);
                format!("{p}while ({cond}) {{\n{body}{p}}}\n")
            }
            StmtKind::For(f) => {
                let iter = self.expr(&f.iter);
                let name = match &f.pattern.kind {
                    PatternKind::Bind(n) => kw(&n.name),
                    PatternKind::Wildcard => "_".into(),
                    _ => self.unsupported(f.pattern.span, "this `for` pattern"),
                };
                let body = self.block(&f.body.stmts, indent + 1, Mode::Unit);
                format!("{p}for ({name} in {iter}) {{\n{body}{p}}}\n")
            }
            StmtKind::Guard(g) => {
                let otherwise = self.block(&g.otherwise.stmts, indent + 1, Mode::Unit);
                match &g.cond {
                    Cond::Expr(c) => {
                        let c = self.expr(c);
                        format!("{p}if (!({c})) {{\n{otherwise}{p}}}\n")
                    }
                    Cond::Let(pat, value) => match &pat.kind {
                        PatternKind::Bind(n) => {
                            let v = self.expr(value);
                            format!("{p}val {} = {v} ?: run {{\n{otherwise}{p}}}\n", kw(&n.name))
                        }
                        _ => format!("{p}{}\n", self.unsupported(pat.span, "this `guard let` pattern")),
                    },
                }
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
        let (head, bind) = self.cond(&i.cond, indent + 1);
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
            has_else |= head == "else";
            let guard = arm.guard.as_ref().map(|g| format!(" -> if ({})", self.expr(g)));
            if guard.is_some() {
                self.unsupported(arm.span, "a `where` guard");
            }
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
            _ => match self.view_expr(e, indent, modifier) {
                Some(text) => text,
                None => format!("{p}{}\n", self.unsupported(e.span, "this expression as a view")),
            },
        }
    }

    /// A view expression (a node or view call with its modifiers), drawn at `indent`.
    fn view_expr(&mut self, e: &Expr, indent: usize, outer: Option<&str>) -> Option<String> {
        let chain = unwind(e)?;
        let p = pad(indent);
        // Effects ride on the view: emitted beside it, in the same composable.
        let mut effects = String::new();
        let mut node_mods: Vec<(&str, &Call)> = Vec::new();
        let mut layout: Vec<String> = Vec::new();
        for (name, call) in &chain.mods {
            match *name {
                "task" | "onAppear" => {
                    let body = call.trailing.as_deref().map(|c| c.body.clone()).unwrap_or_default();
                    let inner = self.block(&body, indent + 1, Mode::Unit);
                    let _ = write!(effects, "{p}LaunchedEffect(Unit) {{\n{inner}{p}}}\n");
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
                _ => node_mods.push((name, call)),
            }
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

    fn is_local_view_fn(&self, name: &str) -> bool {
        // A view's own `func row(…) -> some View` (emitted as a local @Composable function).
        !name.is_empty() && name.chars().next().is_some_and(|c| c.is_lowercase())
    }

    fn layout_modifier(&mut self, node: &str, name: &str, call: &Call) -> String {
        // A Compose row already hands its last child the room left, and a child never grows
        // past its constraints: flex's `grow` and `shrink` have nothing to do.
        if matches!(name, "grow" | "shrink") {
            return String::new();
        }
        let args: Vec<String> = call
            .args
            .iter()
            .map(|a| {
                let param = match (name, a.label.as_ref().map(|l| l.name.as_str())) {
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
        // The constructor's own arguments.
        let mut positional = 0;
        for a in &call.args {
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
                (_, Some(l)) => format!("{} = {}", kw(l), self.expr(&a.value)),
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
                "controlSize" => "size",
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
                let body = self.view_block(&c.body, indent + 1, None);
                format!("{p}{node}({}) {{\n{body}{p}}}\n", args.join(", "))
            }
            (_, None) => format!("{p}{node}({})\n", args.join(", ")),
        }
    }

    /// A closure that draws a view: `{ post -> PostRow(…) }`.
    fn view_closure(&mut self, c: &Closure, indent: usize) -> String {
        let p = pad(indent);
        let params: Vec<String> = c.params.iter().map(|q| kw(&q.name.name)).collect();
        let head = if params.is_empty() { String::new() } else { format!(" {} ->", params.join(", ")) };
        let body = self.view_block(&c.body, indent + 1, None);
        format!("{{{head}\n{body}{p}}}")
    }

    // ---- expressions --------------------------------------------------------------

    fn receiver_type(&self, e: &Expr) -> Option<String> {
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
            out.push(self.closure(c));
        }
        out
    }

    fn closure(&mut self, c: &Closure) -> String {
        let shorthand = !c.has_in && c.params.len() == 1 && c.params[0].name.name == "$0";
        let saved = self.shorthand_it;
        self.shorthand_it = shorthand;
        let params: Vec<String> = c.params.iter().map(|q| kw(&q.name.name.replace('$', "p"))).collect();
        let head =
            if shorthand || params.is_empty() { String::new() } else { format!("{} -> ", params.join(", ")) };
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
        match self.type_at(e.span).map(|t| t.trim_end_matches('?').to_string()) {
            Some(ty) => match self.decls.enums.get(&ty) {
                Some(info) if info.has_payload() => format!("{ty}.{}", upper_first(&name.name)),
                _ => format!("{ty}.{}", kw(&name.name)),
            },
            None => self.unsupported(e.span, format!("`.{}` (its type is unknown here)", name.name)),
        }
    }

    fn expr(&mut self, e: &Expr) -> String {
        match &e.kind {
            ExprKind::Int(n) => n.to_string(),
            ExprKind::Float(f) => {
                let s = f.to_string();
                if s.contains('.') || s.contains('e') { s } else { format!("{s}.0") }
            }
            ExprKind::Bool(b) => b.to_string(),
            ExprKind::None => "null".into(),
            ExprKind::Unit => "Unit".into(),
            ExprKind::Str { parts, .. } => self.string(parts),
            ExprKind::Name(n) if n == "self" => "this".into(),
            ExprKind::Name(n) if n == "$0" && self.shorthand_it => "it".into(),
            ExprKind::Name(n) => kw(&n.replace('$', "p")),
            ExprKind::ImplicitMember(name) => self.implicit(e, name),
            ExprKind::Binding(path) => {
                let place: Vec<String> = path.iter().map(|i| kw(&i.name)).collect();
                let place = place.join(".");
                format!("Binding({{ {place} }}, {{ {place} = it }})")
            }
            ExprKind::Paren(inner) => format!("({})", self.expr(inner)),
            ExprKind::Tuple(items) if items.len() == 2 => {
                format!("Pair({}, {})", self.expr(&items[0]), self.expr(&items[1]))
            }
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
            ExprKind::Field(base, field) => self.field(base, field),
            ExprKind::OptField(base, field) => format!("{}?.{}", self.expr(base), kw(&field.name)),
            ExprKind::Index(base, index) => format!("{}[{}]", self.expr(base), self.expr(index)),
            ExprKind::Call(call) => self.call(e, call),
            ExprKind::Closure(c) => self.closure(c),
            ExprKind::If(i) => {
                let (cond, bind) = self.cond(&i.cond, 0);
                if !bind.is_empty() {
                    return self.unsupported(e.span, "`if let` as a value");
                }
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
    fn field(&mut self, base: &Expr, field: &Ident) -> String {
        let ty = self.receiver_type(base).unwrap_or_default();
        let b = self.expr(base);
        let list = ty.starts_with('[');
        let string = ty == "String";
        // `PostKind.text`: a payload enum's case without a payload is an object.
        if let ExprKind::Name(n) = &base.kind
            && let Some(info) = self.decls.enums.get(n)
            && info.has_payload()
        {
            return format!("{n}.{}", upper_first(&field.name));
        }
        match field.name.as_str() {
            "count" if list => format!("{b}.size"),
            "count" if string => format!("{b}.length"),
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
                if n == "Binding" {
                    let get = call.args.iter().find(|a| a.label.as_ref().is_some_and(|l| l.name == "get"));
                    let set = call.args.iter().find(|a| a.label.as_ref().is_some_and(|l| l.name == "set"));
                    let get = get.map(|a| self.expr(&a.value)).unwrap_or_default();
                    let set = set.map(|a| self.expr(&a.value)).unwrap_or_default();
                    return format!("Binding({{ {get} }}, {set})");
                }
                let args = self.call_args(n, call);
                format!("{}({})", kw(n), args.join(", "))
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
                let args = self.args_by(params.as_deref(), call);
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

fn is_edge(name: &str) -> bool {
    matches!(name, "all" | "horizontal" | "vertical" | "top" | "bottom" | "leading" | "trailing")
}

/// A token's Kotlin name: `2xl` is not an identifier.
fn token_name(name: &str) -> String {
    match name.chars().next() {
        Some(c) if c.is_ascii_digit() => format!("_{name}"),
        _ => kw(name),
    }
}

fn pad(indent: usize) -> String {
    "  ".repeat(indent)
}

#[allow(dead_code)]
fn names(set: &BTreeSet<String>) -> String {
    set.iter().cloned().collect::<Vec<_>>().join(", ")
}
