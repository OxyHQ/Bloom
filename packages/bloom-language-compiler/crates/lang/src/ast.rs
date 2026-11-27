//! The syntax tree of a `.bloom` file, as written: every node has its span,
//! parentheses and trailing closures are kept, and comments live in a side
//! table ([`Comments`]), so a formatter can print the file back losslessly.

use std::fmt;

/// A byte range of the source, `start..end`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default, PartialOrd, Ord)]
pub struct Span {
    pub start: u32,
    pub end: u32,
}

impl Span {
    pub fn new(start: u32, end: u32) -> Self {
        Self { start, end }
    }

    /// The span from the start of `self` to the end of `other`.
    pub fn to(self, other: Span) -> Span {
        Span { start: self.start.min(other.start), end: self.end.max(other.end) }
    }

    pub fn contains(self, offset: u32) -> bool {
        self.start <= offset && offset < self.end
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Ident {
    pub name: String,
    pub span: Span,
}

impl fmt::Display for Ident {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.name)
    }
}

/// One `.bloom` file: a module.
#[derive(Debug, Clone, PartialEq)]
pub struct File {
    pub imports: Vec<Import>,
    pub items: Vec<Item>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Import {
    pub kind: ImportKind,
    /// The module path as written, without quotes.
    pub source: String,
    pub source_span: Span,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ImportKind {
    /// `import { a, type B, c as d } from "…"`
    Named(Vec<ImportSpec>),
    /// `import * as ns from "…"`
    Namespace(Ident),
    /// `import Bloom`, `import Mention.Posts` (2.0): a module by name, its segments in order.
    /// The import's `source` is the dotted text and `source_span` the path's span.
    Module(Vec<Ident>),
}

#[derive(Debug, Clone, PartialEq)]
pub struct ImportSpec {
    pub type_only: bool,
    pub name: Ident,
    pub alias: Option<Ident>,
    pub span: Span,
}

impl ImportSpec {
    /// The name the module sees.
    pub fn local(&self) -> &Ident {
        self.alias.as_ref().unwrap_or(&self.name)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Visibility {
    /// `private` (or `fileprivate`): this file only.
    Private,
    /// Unwritten, or `internal`: the whole module (the default).
    Internal,
    /// `public` (0.x `pub`): other modules too.
    Public,
    /// 0.x `pub default`: the module's default export.
    PubDefault,
}

impl Visibility {
    /// Visible outside its file, so exported by the emitted module. `internal` is exported
    /// when the file is compiled as part of a directory module (`modules`); a file compiled
    /// on its own is its own module, so its internal names stay in it.
    pub fn exported(self, modules: bool) -> bool {
        match self {
            Visibility::Private => false,
            Visibility::Internal => modules,
            Visibility::Public | Visibility::PubDefault => true,
        }
    }
}

/// `@Name` or `@Name(args)` before a declaration (`@Observable`, `@State`, `@extern("init")`).
#[derive(Debug, Clone, PartialEq)]
pub struct Attr {
    pub name: Ident,
    pub args: Vec<Arg>,
    pub span: Span,
}

/// A declaration's written modifiers: its visibility, and the attributes before it.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct Modifiers {
    pub attrs: Vec<Attr>,
    /// `None`: unwritten (internal).
    pub visibility_span: Option<Span>,
    /// `private(set)`, `internal(set)`: who may assign it, when narrower than who reads it.
    pub setter: Option<(Visibility, Span)>,
    pub is_static: bool,
    pub is_final: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Item {
    pub visibility: Visibility,
    pub modifiers: Modifiers,
    pub kind: ItemKind,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ItemKind {
    Struct(StructDecl),
    Enum(EnumDecl),
    Alias(AliasDecl),
    Fn(FnDecl),
    View(ViewDecl),
    Const(ConstDecl),
    /// `extension String { func … }`: methods, computed properties and static members of
    /// a type declared elsewhere (a built-in, or a struct or enum). Lowered before checking
    /// (`crate::extensions::lower`) to free functions the checker finds by the receiver's type.
    Extension(ExtensionDecl),
    /// `@Observable final class Model { … }` (2.0): a reference type. Its stored properties
    /// are its fields, its `init` and members are lowered like a struct's (`crate::extensions`).
    Class(ClassDecl),
    /// `protocol P: Q { var id: String { get }; func f() -> Int }` (2.0): requirements a
    /// conforming type meets with fields, computed properties or methods.
    Protocol(ProtocolDecl),
    /// `extern module "pkg" { … }`: a binding module's declarations of a JS
    /// package's API (ADR 0002, section 4). Lowered before checking
    /// (`crate::modules::lower_externs`): its functions have no body.
    Extern(ExternModule),
    /// `test("name") { … }`: a test of a `.tests` target (`bloom test`), lowered
    /// before checking (`crate::testing::lower`).
    Test(TestDecl),
}

#[derive(Debug, Clone, PartialEq)]
pub struct TestDecl {
    /// The test's name, as written in the string, and the string's span.
    pub name: Ident,
    pub body: Block,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ClassDecl {
    pub name: Ident,
    pub generics: Vec<Ident>,
    /// `@Observable`: its fields are a store a view subscribes to, field by field.
    pub observable: bool,
    /// `actor` (2.0): a class whose methods run one at a time, awaited from outside.
    pub actor: bool,
    /// Its conformances and members as written.
    pub body: TypeBody,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ProtocolDecl {
    pub name: Ident,
    /// `: Q, R`: the protocols it refines.
    pub inherits: Vec<TypeExpr>,
    pub requirements: Vec<Requirement>,
    pub span: Span,
}

/// A protocol's requirement: `var id: String { get }` (`{ get set }`), or a `func`'s
/// signature (its body is empty).
#[derive(Debug, Clone, PartialEq)]
pub enum Requirement {
    Property { name: Ident, ty: TypeExpr, settable: bool, is_static: bool, span: Span },
    Func { decl: FnDecl, is_static: bool },
}

impl Requirement {
    pub fn name(&self) -> &Ident {
        match self {
            Requirement::Property { name, .. } => name,
            Requirement::Func { decl, .. } => &decl.name,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct ExtensionDecl {
    /// The extended type, as written (`String`, `Array`, `Post`).
    pub name: Ident,
    pub generics: Vec<Ident>,
    /// Its conformances and members as written.
    pub body: TypeBody,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ExternModule {
    /// The npm package, as written (without quotes), and its span; for `extern native`,
    /// the native module's name (`"BloomStorage"`).
    pub package: Ident,
    pub items: Vec<Item>,
    /// `extern native "Name" { … }`: a Bloom native module's interface (ADR 0002, section 7),
    /// implemented in Kotlin and Swift and reached through a generated TurboModule bridge.
    pub native: bool,
}

impl ItemKind {
    pub fn name(&self) -> &Ident {
        match self {
            ItemKind::Struct(s) => &s.name,
            ItemKind::Enum(e) => &e.name,
            ItemKind::Alias(a) => &a.name,
            ItemKind::Fn(f) => &f.name,
            ItemKind::View(v) => &v.name,
            ItemKind::Const(c) => &c.name,
            ItemKind::Extension(e) => &e.name,
            ItemKind::Class(c) => &c.name,
            ItemKind::Protocol(p) => &p.name,
            ItemKind::Extern(e) => &e.package,
            ItemKind::Test(t) => &t.name,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct StructDecl {
    pub name: Ident,
    pub generics: Vec<Ident>,
    pub fields: Vec<Field>,
    /// Written Swift's way (2.0): its conformances and members as written, for the
    /// formatter; `fields` are its stored properties.
    pub surface: Option<Box<TypeBody>>,
}

/// A 2.0 type's declaration as written (`struct X: View, Equatable { … }`): what the
/// formatter prints. The checker and emitter read the declaration it was lowered to.
#[derive(Debug, Clone, PartialEq)]
pub struct TypeBody {
    pub conformances: Vec<TypeExpr>,
    pub members: Vec<TypeMember>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub struct TypeMember {
    pub visibility: Visibility,
    pub modifiers: Modifiers,
    pub kind: TypeMemberKind,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub enum TypeMemberKind {
    /// `let name: T`, `var name: T = v`, `var name = v`.
    Stored { mutable: bool, name: Ident, ty: Option<TypeExpr>, value: Option<Expr> },
    /// `var body: some View { … }`: a computed property.
    Computed { name: Ident, ty: TypeExpr, body: Block },
    /// `func`, `static func ==`, `init(…)`.
    Func(FnDecl),
    /// `let { t } = useTranslation()`: a destructuring constant, per render (a view's).
    Let(LetStmt),
}

#[derive(Debug, Clone, PartialEq)]
pub struct Field {
    pub name: Ident,
    pub ty: TypeExpr,
    pub default: Option<Expr>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub struct EnumDecl {
    pub name: Ident,
    pub generics: Vec<Ident>,
    /// `: Equatable, CaseIterable` (2.0).
    pub conformances: Vec<TypeExpr>,
    /// Written with Swift's `case` before its cases (2.0).
    pub swift: bool,
    pub variants: Vec<Variant>,
    /// Its other members as written (2.0): computed properties, methods, `static let`s.
    /// Lowered like a struct's (`crate::extensions`).
    pub members: Vec<TypeMember>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Variant {
    pub name: Ident,
    pub payload: Vec<Payload>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Payload {
    pub name: Option<Ident>,
    pub ty: TypeExpr,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub struct AliasDecl {
    pub name: Ident,
    pub generics: Vec<Ident>,
    pub ty: TypeExpr,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FnDecl {
    pub is_async: bool,
    /// Spelled `func` (2.0): its parameters are labelled unless written `_`.
    pub func: bool,
    pub name: Ident,
    pub generics: Vec<Ident>,
    /// `<T: Equatable>`, `where T: P`: the protocols a type parameter conforms to.
    pub constraints: Vec<(Ident, TypeExpr)>,
    pub params: Vec<Param>,
    /// `throws`, or `throws(E)` with the error type it throws.
    pub throws: Option<Throws>,
    pub ret: Option<TypeExpr>,
    pub body: Block,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Throws {
    pub span: Span,
    pub ty: Option<TypeExpr>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Param {
    /// `to x: Int`: the argument label a call writes (`move(to: 1)`); `_` for none.
    /// Unwritten in a `func`, the label is the name.
    pub label: Option<Ident>,
    pub name: Ident,
    /// `..name: [T]`: a rest parameter, the last one; it takes any number of `T`.
    pub rest: bool,
    /// `..Props` (a view's): the fields of a struct or TS interface, each a prop.
    /// `name` is then the type's name and `ty` the type.
    pub spread: bool,
    /// `..props: Props` (a view's): the props spread, and their whole value named.
    pub whole: Option<Ident>,
    pub ty: TypeExpr,
    pub default: Option<Expr>,
    pub span: Span,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ViewKind {
    View,
    /// A route: the file's default export, through `screen()`.
    Screen,
    /// A route layout, through `layout()`.
    Layout,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ViewDecl {
    pub kind: ViewKind,
    pub name: Ident,
    /// `struct ProfileGridList<T: ProfileGridEntry>: View` (2.0): its type parameters.
    pub generics: Vec<Ident>,
    /// `<T: P>`, `where T: P`: what each type parameter conforms to or has the shape of.
    pub constraints: Vec<(Ident, TypeExpr)>,
    /// `None` when written without parentheses (`screen Settings { … }`).
    pub params: Option<Vec<Param>>,
    pub members: Vec<Member>,
    /// The `body` keyword.
    pub body_keyword: Span,
    pub body: Block,
    pub span: Span,
    /// `struct X: View { … }` (2.0): the declaration as written, which the formatter prints.
    /// Its stored `let`s are the props, `@State` the states, `var body` the body, and
    /// `.task`, `.onAppear`, `.onDisappear` and `.onChange` on the body its effects.
    pub surface: Option<Box<TypeBody>>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum Member {
    State(StateDecl),
    Let(LetStmt),
    Fn(FnDecl),
    Effect(EffectDecl),
    Equal(EqualDecl),
}

impl Member {
    pub fn span(&self) -> Span {
        match self {
            Member::State(s) => s.span,
            Member::Let(l) => l.span,
            Member::Fn(f) => f.span,
            Member::Effect(e) => e.span,
            Member::Equal(e) => e.span,
        }
    }
}

/// `equal(old, new) { … }`: whether two props are equal for the view (`memo`'s
/// comparator); `old` and `new` are its props.
#[derive(Debug, Clone, PartialEq)]
pub struct EqualDecl {
    pub keyword: Span,
    pub old: Ident,
    pub new: Ident,
    pub body: Block,
    pub span: Span,
}

/// `effect { … }` or `effect(id: value) { … }`: synchronous work after a render whose
/// reads (or `id:`) changed; a `defer` at its top is its cleanup.
#[derive(Debug, Clone, PartialEq)]
pub struct EffectDecl {
    pub keyword: Span,
    /// `id:`: what it re-runs for, in place of its reads.
    pub id: Option<Expr>,
    pub body: Block,
    pub span: Span,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StateAttr {
    State,
    List,
    Record,
    Env,
    /// `@ref x = v`: a value that lives across renders without causing one (`useRef`).
    Ref,
}

impl StateAttr {
    pub fn word(self) -> &'static str {
        match self {
            StateAttr::State => "state",
            StateAttr::List => "list",
            StateAttr::Record => "record",
            StateAttr::Env => "env",
            StateAttr::Ref => "ref",
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct StateDecl {
    pub attr: StateAttr,
    pub attr_span: Span,
    pub name: Ident,
    pub ty: Option<TypeExpr>,
    pub value: Expr,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ConstDecl {
    pub name: Ident,
    pub ty: Option<TypeExpr>,
    pub value: Expr,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Block {
    pub stmts: Vec<Stmt>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Stmt {
    pub kind: StmtKind,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub enum StmtKind {
    Let(LetStmt),
    Var(VarStmt),
    Assign(AssignStmt),
    Return(Option<Expr>),
    /// `defer { … }`: runs when the enclosing block ends, however it ends.
    Defer(Block),
    While(WhileStmt),
    For(ForStmt),
    /// `guard cond else { … }` (2.0): the block runs and leaves when `cond` fails; the names
    /// an `if let`-style condition binds are in scope after it.
    Guard(GuardStmt),
    /// `throw error` (2.0): a JS `throw`.
    Throw(Expr),
    /// `do { … } catch … { … }` (2.0): a JS `try`/`catch`.
    Do(DoStmt),
    Expr(Expr),
}

#[derive(Debug, Clone, PartialEq)]
pub struct GuardStmt {
    pub cond: Cond,
    pub otherwise: Block,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DoStmt {
    pub body: Block,
    pub catches: Vec<Catch>,
}

/// `catch { … }` (binds `error`), `catch let e { … }`, `catch let e as APIError { … }`, or
/// `catch .offline { … }` (a pattern over a typed error).
#[derive(Debug, Clone, PartialEq)]
pub struct Catch {
    pub keyword: Span,
    pub name: Option<Ident>,
    pub ty: Option<TypeExpr>,
    pub pattern: Option<Pattern>,
    pub body: Block,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub struct LetStmt {
    pub pattern: Pattern,
    pub ty: Option<TypeExpr>,
    pub value: Expr,
    pub span: Span,
    /// `async let x = f()` (2.0): the call starts now, and `await x` reads its result.
    pub is_async: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct VarStmt {
    pub name: Ident,
    pub ty: Option<TypeExpr>,
    pub value: Expr,
    pub span: Span,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AssignOp {
    Set,
    Add,
    Sub,
    Mul,
}

impl AssignOp {
    pub fn text(self) -> &'static str {
        match self {
            AssignOp::Set => "=",
            AssignOp::Add => "+=",
            AssignOp::Sub => "-=",
            AssignOp::Mul => "*=",
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct AssignStmt {
    /// A place: a name and its fields (`draft.text`).
    pub target: Expr,
    pub op: AssignOp,
    pub value: Expr,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub struct WhileStmt {
    pub cond: Expr,
    pub body: Block,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ForStmt {
    pub pattern: Pattern,
    pub iter: Expr,
    pub body: Block,
}

/// An expression's identity in the checker's side tables.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct ExprId(pub u32);

#[derive(Debug, Clone, PartialEq)]
pub struct Expr {
    pub id: ExprId,
    pub kind: ExprKind,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub enum StrPart {
    /// Text with its escapes resolved.
    Text(String),
    /// `${expr}`.
    Interp(Expr),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UnaryOp {
    Not,
    Neg,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BinaryOp {
    Mul,
    Div,
    Rem,
    Add,
    Sub,
    Lt,
    Le,
    Gt,
    Ge,
    Eq,
    Ne,
    And,
    Or,
    Default,
    /// `a..<b`: the `Int`s from `a` up to, not including, `b`.
    HalfOpen,
    /// `a...b`: the `Int`s from `a` up to and including `b`.
    Closed,
}

impl BinaryOp {
    pub fn text(self) -> &'static str {
        match self {
            BinaryOp::Mul => "*",
            BinaryOp::Div => "/",
            BinaryOp::Rem => "%",
            BinaryOp::Add => "+",
            BinaryOp::Sub => "-",
            BinaryOp::Lt => "<",
            BinaryOp::Le => "<=",
            BinaryOp::Gt => ">",
            BinaryOp::Ge => ">=",
            BinaryOp::Eq => "==",
            BinaryOp::Ne => "!=",
            BinaryOp::And => "&&",
            BinaryOp::Or => "||",
            BinaryOp::Default => "??",
            BinaryOp::HalfOpen => "..<",
            BinaryOp::Closed => "...",
        }
    }

    /// Whether it forms a range (`..<`, `...`).
    pub fn is_range(self) -> bool {
        matches!(self, BinaryOp::HalfOpen | BinaryOp::Closed)
    }

    /// Binding power: higher binds tighter (section 6.1).
    pub fn precedence(self) -> u8 {
        match self {
            BinaryOp::Mul | BinaryOp::Div | BinaryOp::Rem => 8,
            BinaryOp::Add | BinaryOp::Sub => 7,
            // Swift's `RangeFormationPrecedence`: below `+`, above the comparisons.
            BinaryOp::HalfOpen | BinaryOp::Closed => 6,
            BinaryOp::Lt | BinaryOp::Le | BinaryOp::Gt | BinaryOp::Ge => 5,
            BinaryOp::Eq | BinaryOp::Ne => 4,
            BinaryOp::And => 3,
            BinaryOp::Or => 2,
            BinaryOp::Default => 1,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum ExprKind {
    Int(i64),
    Float(f64),
    Bool(bool),
    None,
    /// `()`: the Unit value.
    Unit,
    Str {
        parts: Vec<StrPart>,
        raw: bool,
    },
    /// A value or type name (`draft`, `Prefs`, `VStack`).
    Name(String),
    /// `.case`, typed by what is expected.
    ImplicitMember(Ident),
    /// `$state` or `$state.field.field`.
    Binding(Vec<Ident>),
    /// `\.field` or `\Type.field`: a typed key path (`KeyPath<Type, V>`).
    KeyPath {
        root: Option<Ident>,
        path: Vec<Ident>,
    },
    /// `Partial<Prefs>`, `Load<Int>`: a type applied, as a callee.
    TypeApply {
        name: Ident,
        args: Vec<TypeExpr>,
    },
    Paren(Box<Expr>),
    Tuple(Vec<Expr>),
    List(Vec<Expr>),
    /// `..xs` in a list literal (`[..a, b]`): its items, in place.
    Spread(Box<Expr>),
    /// `x is String`: whether a TS value is of a Bloom type (`String`, `Int`, `Float`,
    /// `Bool`, `[T]`); `if x is T { … }` narrows `x` there.
    Is(Box<Expr>, TypeExpr),
    /// `error as? HTTPError` (2.0, Swift's conditional cast): the value as a `T`, or `none`;
    /// `T` says how (`static func cast(_ error: Error) -> T?`). A string literal union
    /// (`x as? Tab`) is a membership test. `forced`: `x as! Tab`, the value itself, a trap in a
    /// dev build when it is not one.
    CastAs(Box<Expr>, TypeExpr, bool),
    /// `[k: v, …]`; `[:]` is empty.
    Map(Vec<(Expr, Expr)>),
    /// `{ key: value, "quoted-key": v, ..spread }`: a record, typed by what is expected.
    Record(Vec<RecordEntry>),
    Unary(UnaryOp, Box<Expr>),
    Binary(BinaryOp, Box<Expr>, Box<Expr>),
    Ternary(Box<Expr>, Box<Expr>, Box<Expr>),
    Await(Box<Expr>),
    /// `expr?`: return the error (or `none`) early.
    Try(Box<Expr>),
    /// `expr!` (2.0): the optional's value; `none` is a trap.
    Force(Box<Expr>),
    /// `try f()`, `try? f()`, `try! f()` (2.0): a call that throws.
    Throwing(TryKind, Box<Expr>),
    Field(Box<Expr>, Ident),
    OptField(Box<Expr>, Ident),
    Index(Box<Expr>, Box<Expr>),
    Call(Call),
    Closure(Closure),
    If(IfExpr),
    Match(MatchExpr),
    /// `task { … }`: starts the work and goes on (spawn); its value is Unit.
    Task(Block),
    /// What the parser put where it could not read an expression.
    Error,
}

#[derive(Debug, Clone, PartialEq)]
pub enum RecordEntry {
    /// `key: value`; a quoted key's name is its text.
    Field { key: Ident, value: Expr },
    /// `..value`
    Spread(Expr),
}

impl RecordEntry {
    /// The entry's value: a field's, or the spread one.
    pub fn value(&self) -> &Expr {
        match self {
            RecordEntry::Field { value, .. } | RecordEntry::Spread(value) => value,
        }
    }
}

/// A record as the struct construction it is (`S(key: v, ..spread)`), for a record
/// typed by a struct: the same checks, the same object.
pub fn record_call(span: Span, entries: &[RecordEntry]) -> Call {
    let args = entries
        .iter()
        .map(|entry| match entry {
            RecordEntry::Field { key, value } => Arg {
                label: Some(key.clone()),
                spread: false,
                value: value.clone(),
                span: key.span.to(value.span),
            },
            RecordEntry::Spread(value) => {
                Arg { label: None, spread: true, value: value.clone(), span: value.span }
            }
        })
        .collect();
    let callee = Expr { id: ExprId(u32::MAX), kind: ExprKind::Name(String::new()), span };
    Call { callee: Box::new(callee), args, parens: true, trailing: None, optional: false }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Call {
    pub callee: Box<Expr>,
    pub args: Vec<Arg>,
    /// Whether the arguments were written in parentheses (`f()` or `f { … }`).
    pub parens: bool,
    pub trailing: Option<Box<Closure>>,
    /// `f?.(…)`: called only when the callee is not `none`.
    pub optional: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Arg {
    pub label: Option<Ident>,
    /// `..value`: a struct spread.
    pub spread: bool,
    pub value: Expr,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Closure {
    /// `{ a, b in … }`; empty without `in`.
    pub params: Vec<ClosureParam>,
    /// Whether `in` was written.
    pub has_in: bool,
    /// `{ (i, x) in … }`: one tuple parameter, its items named.
    pub tuple: bool,
    pub body: Vec<Stmt>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ClosureParam {
    pub name: Ident,
    pub ty: Option<TypeExpr>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IfExpr {
    pub cond: Cond,
    pub then: Block,
    pub otherwise: Option<Box<Else>>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum Else {
    If(Expr),
    Block(Block),
}

#[derive(Debug, Clone, PartialEq)]
pub enum Cond {
    Expr(Box<Expr>),
    /// `let pattern = value`
    Let(Pattern, Box<Expr>),
}

#[derive(Debug, Clone, PartialEq)]
pub struct MatchExpr {
    pub scrutinee: Box<Expr>,
    pub arms: Vec<Arm>,
    /// Written `switch x { case .a: … }` (2.0) rather than 0.x `match x { case .a => … }`.
    pub switch: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TryKind {
    /// `try f()`: the error propagates.
    Plain,
    /// `try? f()`: `none` when it throws.
    Optional,
    /// `try! f()`: the error is a crash.
    Force,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Arm {
    pub pattern: Pattern,
    pub guard: Option<Expr>,
    pub body: ArmBody,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ArmBody {
    Expr(Expr),
    Block(Block),
}

#[derive(Debug, Clone, PartialEq)]
pub struct Pattern {
    pub kind: PatternKind,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub enum PatternKind {
    Wildcard,
    Bind(Ident),
    /// A literal: an Int, Float, String or Bool expression.
    Literal(Box<Expr>),
    None,
    /// `.case`, `.case(p, …)`, `Type.case(p, …)`.
    Case {
        ty: Option<Ident>,
        name: Ident,
        args: Option<Vec<Pattern>>,
    },
    Tuple(Vec<Pattern>),
    /// `{ a, b: p }`
    Record(Vec<(Ident, Option<Pattern>)>),
    Or(Vec<Pattern>),
}

#[derive(Debug, Clone, PartialEq)]
pub struct TypeExpr {
    pub kind: TypeKind,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub enum TypeKind {
    Named {
        name: Ident,
        args: Vec<TypeExpr>,
    },
    List(Box<TypeExpr>),
    Map(Box<TypeExpr>, Box<TypeExpr>),
    Tuple(Vec<TypeExpr>),
    Fn {
        is_async: bool,
        params: Vec<TypeExpr>,
        ret: Box<TypeExpr>,
    },
    Optional(Box<TypeExpr>),
    /// `"a" | "b"`: a union of string literals (TS-shaped data; an enum is Bloom's own choice).
    Strings(Vec<String>),
    /// `{ a: Int, b: String? }`: a structural record type (an optional field may be absent).
    Record(Vec<(Ident, TypeExpr)>),
    /// What the parser put where it could not read a type.
    Error,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CommentKind {
    /// `// …`
    Line,
    /// `/* … */` (nesting).
    Block,
    /// `/// …`: attached to the next item.
    Doc,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Comment {
    pub kind: CommentKind,
    /// The comment's text without its delimiters.
    pub text: String,
    pub span: Span,
}

/// Every comment of a file, in source order.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Comments {
    pub comments: Vec<Comment>,
}

impl Comments {
    /// The doc comments (`///`) written directly above `span`.
    pub fn docs_before(&self, source: &str, span: Span) -> Vec<&Comment> {
        let mut docs = Vec::new();
        let mut end = span.start as usize;
        for comment in self.comments.iter().rev().filter(|c| c.span.end as usize <= span.start as usize) {
            let between = &source[comment.span.end as usize..end];
            if comment.kind != CommentKind::Doc || !between.trim().is_empty() {
                break;
            }
            docs.push(comment);
            end = comment.span.start as usize;
        }
        docs.reverse();
        docs
    }
}
