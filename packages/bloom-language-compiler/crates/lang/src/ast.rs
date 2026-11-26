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
    Private,
    Pub,
    /// `pub default`: the module's default export.
    PubDefault,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Item {
    pub visibility: Visibility,
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
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct StructDecl {
    pub name: Ident,
    pub generics: Vec<Ident>,
    pub fields: Vec<Field>,
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
    pub variants: Vec<Variant>,
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
    pub name: Ident,
    pub generics: Vec<Ident>,
    pub params: Vec<Param>,
    pub ret: Option<TypeExpr>,
    pub body: Block,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Param {
    pub name: Ident,
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
    /// `None` when written without parentheses (`screen Settings { … }`).
    pub params: Option<Vec<Param>>,
    pub members: Vec<Member>,
    /// The `body` keyword.
    pub body_keyword: Span,
    pub body: Block,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub enum Member {
    State(StateDecl),
    Let(LetStmt),
    Fn(FnDecl),
}

impl Member {
    pub fn span(&self) -> Span {
        match self {
            Member::State(s) => s.span,
            Member::Let(l) => l.span,
            Member::Fn(f) => f.span,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StateAttr {
    State,
    List,
    Record,
    Env,
}

impl StateAttr {
    pub fn word(self) -> &'static str {
        match self {
            StateAttr::State => "state",
            StateAttr::List => "list",
            StateAttr::Record => "record",
            StateAttr::Env => "env",
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
    Expr(Expr),
}

#[derive(Debug, Clone, PartialEq)]
pub struct LetStmt {
    pub pattern: Pattern,
    pub ty: Option<TypeExpr>,
    pub value: Expr,
    pub span: Span,
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
        }
    }

    /// Binding power: higher binds tighter (section 6.1).
    pub fn precedence(self) -> u8 {
        match self {
            BinaryOp::Mul | BinaryOp::Div | BinaryOp::Rem => 7,
            BinaryOp::Add | BinaryOp::Sub => 6,
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
    Call { callee: Box::new(callee), args, parens: true, trailing: None }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Call {
    pub callee: Box<Expr>,
    pub args: Vec<Arg>,
    /// Whether the arguments were written in parentheses (`f()` or `f { … }`).
    pub parens: bool,
    pub trailing: Option<Box<Closure>>,
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
