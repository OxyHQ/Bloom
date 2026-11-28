//! Name resolution and type checking (spec sections 4 to 8): local
//! bidirectional inference with unification, signatures required at module
//! level. The checker leaves side tables the emitter reads: what each name,
//! call, member, assignment, await and pattern resolved to, and every type.

pub(crate) mod call;
mod exhaust;
mod members;

use rustc_hash::{FxHashMap as HashMap, FxHashSet as HashSet};
use std::collections::BTreeSet;
use std::path::{Path, PathBuf};
use std::rc::Rc;

use crate::Options;
use crate::ast::*;
use crate::diagnostic::{Diagnostic, closest};
use crate::ts;
use crate::types::*;
use crate::ui;

pub use exhaust::Pat;
pub use members::{Bound, Conformance, Read, WitnessArg, Witnessed, witness_param};

pub type LocalId = usize;

#[derive(Debug, Clone, PartialEq)]
pub enum LocalKind {
    Let,
    Var,
    Param,
    /// A view's parameter: one of its props.
    Prop,
    /// `@Binding var x: T` (2.0): a prop holding a `Binding<T>`, read and written as a `T`
    /// (`x[0]`, `x[1](v)`); `$x` is the binding itself.
    Bound,
    /// `@state`; written through its setter.
    State,
    /// `@ref`: read and written as `x.current`, outside the render.
    Ref,
    /// A view member whose value is a hook (`let x = useX()`, `@list`, `@record`, `@env`).
    Hook,
    /// A view's `let` member.
    Derived,
    /// A view's `fn` member.
    Handler,
    ModuleFn,
    ModuleConst,
    /// A Bloom view: called with its props as named arguments.
    View,
    /// A TS value.
    Import {
        hook: bool,
    },
    /// A TS React component: a node, its props as named arguments.
    Component {
        props: Ty,
    },
}

#[derive(Debug, Clone)]
pub struct Local {
    pub name: String,
    pub ty: Ty,
    pub kind: LocalKind,
    pub span: Span,
    /// The function frame that declared it (a `var` is not capturable).
    pub frame: usize,
    /// For a view member, the view's index in `CheckResult::views`.
    pub view: Option<usize>,
}

/// How a call is emitted.
#[derive(Debug, Clone, PartialEq)]
pub enum CallRes {
    /// `x.m(…)` with `m` an extension method (`crate::extensions`): the lowered function
    /// `func`, called with `x` first, then the arguments as [`CallRes::Bloom`] orders them.
    Extension {
        func: Rc<str>,
        order: Vec<Option<usize>>,
        rest: Vec<usize>,
    },
    /// A Bloom function: argument index for each parameter, in order (`None`: its default).
    Bloom {
        order: Vec<Option<usize>>,
        /// The arguments a rest parameter takes, in order (a spread `..xs` among them).
        rest: Vec<usize>,
    },
    /// A TS function: positional arguments, then the named ones as one object.
    Ts,
    /// `Map(entries)` / `Set(values)`: `new Map<K, V>(…)`, `new Set<T>(…)`.
    Collection(Ty),
    /// `min`, `max`, `abs`, `round`, `floor`, `ceil`: `Math.…`.
    Math(&'static str),
    /// `Regex(pattern, flags)`: a JS `RegExp`.
    Regex,
    /// `Array(xs)`: a new array of a range's, a list's or a set's elements.
    ArrayOf,
    /// `catching { … }`: the block's value, or what it threw, as a `Result`.
    Catching,
    /// `Int(s)` / `Float(s)`.
    Parse {
        int: bool,
    },
    Struct(DefId),
    Partial(DefId),
    /// `s.with(field: v)`.
    With(DefId),
    /// `S.patch(key, v)` (`partial`) or `s.with(key, v)`: the field a key path names.
    Keyed {
        partial: bool,
    },
    EnumCase(DefId, usize),
    Node(&'static str),
    /// `.name(…)` on a view; `object`: the named arguments form one object (`.frame(width: …)`).
    Modifier {
        object: bool,
    },
    /// `.task { … }` / `.task(id: v) { … }` on the body's root.
    Task,
    /// A Bloom view: its props as one object.
    View {
        params: Vec<String>,
        /// The prop the trailing closure fills.
        trailing: Option<String>,
        /// A generic view's witness props (`$w_T_Titled`), for its protocol bounds in order:
        /// their values are the call's [`CheckResult::witness_args`].
        witnesses: Vec<String>,
    },
    /// A TS component: `Embed(jsx(C, props))`.
    Component,
    /// A standard library member (spec 12).
    Method {
        recv: Recv,
        name: &'static str,
    },
    Ok,
    Err,
    Toast,
    Navigate,
    Binding,
    Sleep,
    /// `fail(e)`: `throw e`, an expression (`(() => { throw e; })()` where a value is needed).
    Fail,
    /// `all(a, b)`: `Promise.all`.
    All,
    /// `race(a, b)`: `Promise.race`.
    Race,
    /// `.onChange(of: v) { old, new in … }` on the body's root: the watched value's type.
    OnChange(Ty),
    /// `Task { … }`: the closure's work, started and not awaited.
    Spawn,
    /// `EnvironmentKey(name, default: v)`: `defineEnvironment(name, v)`.
    EnvironmentKey,
    /// `T()` for a class without an `init`: `new T()`.
    New(DefId),
    /// `x.m(…)` with `x` a constrained type parameter's value (`witness` its parameter) or
    /// an `any P` (`None`: the existential's own witness), and `m` a requirement.
    Witness {
        witness: Option<String>,
        member: String,
        order: Vec<Option<usize>>,
        rest: Vec<usize>,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Recv {
    Str,
    Int,
    Float,
    List,
    Map,
    JsMap,
    Set,
    Option,
    Result,
}

/// How `a.b` is emitted.
#[derive(Debug, Clone, PartialEq)]
pub enum FieldRes {
    /// A field of a struct, a TS object or a foreign value.
    Field,
    /// `t.0`
    Index(usize),
    EnumCase(DefId, usize),
    /// A standard library property (`count`, `isEmpty`, `first`, `last`, `keys`, …).
    Prop {
        recv: Recv,
        name: &'static str,
    },
    /// `error.message`.
    ErrorField,
    /// `Task.signal`.
    TaskSignal,
    /// `Task.isCancelled`.
    TaskCancelled,
    /// `x.p`, an extension's computed property: `func(x)`.
    Extension(Rc<str>),
    /// `T.m`, an extension's static member: the lowered name.
    Static(Rc<str>),
    /// `x.p` with `x` a constrained type parameter's value or an `any P`, and `p` a
    /// requirement: read through the witness (see [`CallRes::Witness`]).
    Witness {
        witness: Option<String>,
        member: String,
    },
    /// `T.p`, an extension's static computed property: `func()`.
    StaticGet(Rc<str>),
}

#[derive(Debug, Clone, PartialEq)]
pub enum AssignRes {
    /// A state's setter; `functional` when the value reads the state.
    State {
        local: LocalId,
        fields: Vec<String>,
        functional: bool,
    },
    Var {
        local: LocalId,
        fields: Vec<String>,
    },
    /// A field of a TS value (`player.loop = true`): TS's own write, which tsc checks.
    Foreign,
    /// A place the emitter rebuilds from the target (2.0): a field of a class (`model`
    /// `Some(observable)`: written in place, through its store when observable, `raw` in
    /// its `init`), or an element of a `var`'s list (`xs[i].done = true`).
    Place {
        local: LocalId,
        model: Option<bool>,
        raw: bool,
    },
    /// `isOn = v` with `isOn` a `@Binding`: `isOn[1](v)`.
    Bound {
        local: LocalId,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AwaitRes {
    Bloom,
    /// A TS promise, settled into a `Result`.
    Ts,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TryRes {
    Result,
    Option,
    /// In a frame that throws: the error is thrown.
    Throw,
}

#[derive(Debug, Clone)]
pub struct ClosureInfo {
    pub params: Vec<LocalId>,
    pub is_async: bool,
    pub ret: Ty,
    /// A builder: each line is a child.
    pub builder: bool,
}

#[derive(Debug, Clone, Default)]
pub struct ViewInfo {
    pub props: Vec<LocalId>,
    /// `..Props`: the type spread, and the props it gave (a range of `props`).
    pub spreads: Vec<(Ty, std::ops::Range<usize>)>,
    /// Each member's locals, in order (a destructuring `let` has several).
    pub members: Vec<Vec<LocalId>>,
}

#[derive(Debug, Clone)]
pub enum NameRes {
    Local(LocalId),
}

#[derive(Default)]
pub struct CheckResult {
    pub diagnostics: Vec<Diagnostic>,
    pub defs: Vec<Def>,
    pub locals: Vec<Local>,
    pub types: HashMap<ExprId, Ty>,
    pub spans: Vec<(Span, Ty)>,
    pub names: HashMap<ExprId, NameRes>,
    /// `.xxl`, `.caption1`, `.primary.opacity(0.1)` where a token goes (2.0): the token string
    /// each compiles to (`"2xl"`, `"caption-1"`, `"primary/10"`).
    pub swift_tokens: HashMap<ExprId, String>,
    pub calls: HashMap<ExprId, CallRes>,
    pub fields: HashMap<ExprId, FieldRes>,
    pub bindings: HashMap<ExprId, (LocalId, Vec<String>)>,
    pub assigns: HashMap<Span, AssignRes>,
    /// JS classes imported from "js": a call of one is `new`.
    pub constructors: HashSet<LocalId>,
    /// `x is T`: the type tested.
    pub is_tests: HashMap<ExprId, Ty>,
    /// `x as? T`: `T`'s lowered `cast` (`HTTPError$$cast`).
    pub casts: HashMap<ExprId, Rc<str>>,
    /// `x as? Tab` / `x as! Tab` with `Tab` a string literal union: its values, tested at run
    /// time (`as!` only in a dev build).
    pub union_casts: HashMap<ExprId, Rc<StrSet>>,
    /// `catch let e as T` with a `T` that casts (keyed by the catch's span): its `cast`, which
    /// tests the error (a catch of any other `T` types it, as a typed `throws(T)` does).
    pub catch_casts: HashMap<Span, Rc<str>>,
    /// A `break` (by its span) that leaves a `switch` (by its scrutinee's span), Swift's
    /// `break` in a case: the `switch`'s statement takes a label and the `break` names it.
    pub switch_breaks: HashMap<Span, Span>,
    /// `if x is T`: the narrowed local and the one it narrows.
    pub narrowed: HashMap<ExprId, (LocalId, LocalId)>,
    /// `@ref` names passed as the ref itself (`.ref(x)`), not its value.
    pub ref_objects: HashSet<ExprId>,
    /// `..props: Props`: the locals naming a view's whole props (emitted `props`).
    pub whole_props: HashSet<LocalId>,
    /// A hook function written without `->`: its result, inferred from its body (by the
    /// fn's span).
    pub fn_rets: HashMap<Span, Ty>,
    pub awaits: HashMap<ExprId, AwaitRes>,
    /// `await (a, b)` of `async let`s: every one awaited together (`Promise.all`).
    pub await_all: HashSet<ExprId>,
    /// The `async let` locals (each holds its call's promise).
    pub async_lets: HashSet<LocalId>,
    pub tries: HashMap<ExprId, TryRes>,
    pub closures: HashMap<Span, ClosureInfo>,
    /// Pattern span → the type it matches; binding span → its local.
    pub pattern_tys: HashMap<Span, Ty>,
    pub pattern_locals: HashMap<Span, LocalId>,
    /// A `let`/`var` that shadows a parameter, a prop or an outer local (`let x = x ?? 0`), by
    /// its name's span: its JS name (`x$1`). JS has one scope for a function's parameters and
    /// body, and `const x = x` reads the new `x` before it is set.
    pub renamed: HashMap<Span, String>,
    /// `ts.state ?? {}` with a TS type of required fields: the `{}`, a patch typed as one in TS.
    pub partial_fallbacks: HashSet<ExprId>,
    /// Item index → its locals: a fn's parameters, a view's info.
    pub fn_params: HashMap<Span, Vec<LocalId>>,
    pub views: HashMap<usize, ViewInfo>,
    /// Item index → the local it declares.
    pub items: HashMap<usize, LocalId>,
    /// Type names the module declares or imports: what the emitter names them.
    pub type_imports: Vec<String>,
    /// Imported names that are types only (a struct or enum of another `.bloom` module,
    /// a TS interface): emitted as `import type`.
    pub type_only_imports: HashSet<Span>,
    /// The names an assignment writes (`count` in `count += 1`): written, not read.
    pub assign_targets: HashSet<ExprId>,
    /// Each written type's span → the type it names.
    pub type_exprs: HashMap<Span, Ty>,
    /// `Foreign` values accepted as a Bloom type: emitted `(value satisfies T)`.
    pub foreign_checks: HashMap<ExprId, Ty>,
    /// Every file the check read: imported `.bloom` modules, TS declarations
    /// (through re-exports), the `tsconfig.json` whose `paths` resolved them.
    pub dependencies: BTreeSet<PathBuf>,
    /// Struct constructions passed as a record type with fewer fields (emitted through a temp).
    pub widened: HashSet<ExprId>,
    /// Builder lines that are a list of views (`Menu { glyph; rows }`): their items are the
    /// parent's children, spread as the embedded language's `...rows` where a `for` would be.
    pub view_lists: HashSet<ExprId>,
    /// Bloom views where TS takes a React element (a prop, an argument, what a TS callback
    /// returns): emitted as `toElement(view)`.
    pub elements: HashSet<ExprId>,
    /// Member chains read where they were narrowed present (emitted `u.name!`).
    pub narrowed_paths: HashSet<ExprId>,
    /// Objects a member or method reads through an optional chain (`a?.b` in `a?.b.c`): `none`
    /// at run time when an earlier `?.` was.
    pub chain_links: HashSet<ExprId>,
    /// Trailing builders that fill a view's `View`/`View?` property (emitted as its children).
    pub builder_props: HashSet<Span>,
    /// Trailing builders of a TS component that fill a node prop other than `children`
    /// (`content: ReactNode`), by the builder's span: the prop's name.
    pub component_slots: HashMap<Span, String>,
    /// A TS component's one-line builder that is text (`TextFieldLabel { label }`): JSX text
    /// children, passed as they are.
    pub text_children: HashSet<Span>,
    /// `xs[i]` on an array: an element, bounds-checked in dev (`$get`), read as is in
    /// release. The value says whether the element type is itself optional.
    pub list_reads: HashMap<ExprId, bool>,
    /// A view's `let`s, and a hook function's top-level ones, whose value calls a hook (drawn
    /// every render, never in a memo scope).
    pub hook_lets: HashSet<Span>,
    /// The keys of dictionary elements assigned in place (`table[k] = v`), by the key's id: the
    /// dictionary rebuilt with the key (`{ ...table, [k]: v }`), not a list's `$at`.
    pub map_writes: HashSet<ExprId>,
    /// Locals bound to a value optional only through a guard kept on a TS value TS says is
    /// present (`let postId = viewPost?.id`): a cache of one declares no type, so TS's (`string`)
    /// is the one it reads.
    pub claim_only: HashSet<LocalId>,
    /// `{}` where a TS object type Bloom does not map is expected: the empty object, not a closure.
    pub empty_objects: HashSet<ExprId>,
    /// `a == b` / `a != b` on a type compared field by field: the type.
    pub structural: HashMap<ExprId, Ty>,
    /// Module constants whose record literal keeps its string literals' types (`let SIZES =
    /// { small: "8" }` is `{ small: "8" }`), by the value's id: TS's `as const`.
    pub literal_consts: HashSet<ExprId>,
    /// `a == b` on a type parameter constrained `Equatable`: its witness parameter.
    pub witness_eq: HashMap<ExprId, String>,
    /// The module's declared conformances to protocols, with how each requirement is met.
    pub conformances: Vec<Conformance>,
    /// A view's index → each `@Observable` model it holds and the fields it reads of it.
    pub observed: HashMap<usize, Vec<(LocalId, Vec<String>)>>,
    /// A value passed as `any P`: its type and the protocol (`{ self, w: T$$P }`).
    pub packs: HashMap<ExprId, (DefId, DefId)>,
    /// A generic call's witnesses, after its arguments, for its constraints in order.
    pub witness_args: HashMap<ExprId, Vec<Option<WitnessArg>>>,
    /// `@Environment(\.k)` (by the state's span): the environment key `k` in scope, or
    /// `None` for a built-in one (`environmentValues.k`).
    pub env_keys: HashMap<Span, Option<LocalId>>,
    /// A generic function's witness parameters (by the function's span): each one's name
    /// and what it witnesses.
    pub witness_params: HashMap<Span, Vec<(String, u32, Bound)>>,
    /// A generic function's or view's shape-bounded type parameters (by its span): each
    /// one's index and shape, which TS writes `T extends Shape`.
    pub shapes: HashMap<Span, Vec<(u32, Ty)>>,
}

impl CheckResult {
    pub fn types(&self, _source: &str) -> Vec<(Span, String)> {
        let mut out: Vec<(Span, String)> = self
            .spans
            .iter()
            .map(|(span, ty)| (*span, Display { ty, defs: &self.defs }.to_string()))
            .collect();
        out.sort_by_key(|(span, _)| (span.start, std::cmp::Reverse(span.end)));
        out
    }
}

/// A function frame: what `return` and `?` refer to, and whether `await` may appear.
struct Frame {
    ret: Ty,
    is_async: bool,
    /// A closure: `await` makes it async.
    closure: bool,
    /// The states written so far in this frame (B0410).
    written: HashSet<LocalId>,
    /// Inside `.task { }`: `Task.signal` is in scope.
    task: bool,
    /// A render frame (a view's members and body): states are not written here.
    render: bool,
    /// A `task { … }`: an async call here starts without being awaited.
    spawn: bool,
    /// An `effect` past a `defer` at its top: its cleanup is set, so it does not `return`.
    cleanup: bool,
    /// A closure TS calls, or `catching { … }`'s block: `?` on a `Result` throws its
    /// error (rejecting the promise, or caught), and does not change the result.
    throws: bool,
    /// A `func … throws(E)`: what a `throw` here throws (`Unknown` for an untyped `throws`).
    raises: Option<Ty>,
    /// The `do { … } catch` blocks around this point of the frame: a `try` here is caught.
    handled: u32,
}

/// What a `break` or `continue` leaves.
#[derive(Debug, Clone)]
enum Breakable {
    /// A `for` or `while`, and its name (`outer: for …`).
    Loop(Option<String>),
    /// A `switch` statement, by its scrutinee's span.
    Switch(Span),
}

/// A generic call waiting for its witnesses: the call, its type arguments, its constraints,
/// where it is, and the constrained type parameters in scope there.
type PendingWitnesses = (ExprId, Vec<(Ty, Rc<str>)>, Span, Vec<(String, Bound)>);

/// A shape-bounded type argument waiting for its check: it, its shape, where, and the shapes
/// in scope there.
type PendingShape = (Ty, Ty, Span, Vec<(String, Ty)>);

/// A TS type that is a React ref: a `@ref` passed there is the ref, not its value.
fn is_ref_type(text: &str) -> bool {
    // `RefObject<T>`, `React.Ref<T>`, `import("react").MutableRefObject<T>`, a union with one.
    text.split(|c: char| !(c.is_alphanumeric() || c == '_' || c == '<')).any(|word| {
        matches!(
            word.split('<').next(),
            Some("RefObject" | "MutableRefObject" | "Ref" | "LegacyRef" | "ForwardedRef" | "RefCallback")
        ) && word.contains('<')
    })
}

/// A member chain's fields from its root, each marked when read through `?.`.
type FieldPath = Vec<(String, bool)>;

/// A type name in scope.
#[derive(Debug, Clone)]
enum TypeName {
    Def(DefId),
    Alias(Ty, usize),
    Ty(Ty),
}

pub struct Checker<'o> {
    source: &'o str,
    path: PathBuf,
    options: &'o Options,
    pub out: CheckResult,
    vars: Vec<Option<Ty>>,
    /// Record types by shape (`record_type`).
    records: HashMap<String, DefId>,
    scopes: Vec<HashMap<String, LocalId>>,
    type_names: HashMap<String, TypeName>,
    /// Type parameters in scope (innermost last).
    generics: Vec<String>,
    frames: Vec<Frame>,
    ts_named: HashMap<(PathBuf, String), Ty>,
    /// `import * as ns from "…"`: the TS file each namespace names, for its members.
    ts_namespaces: HashMap<String, Rc<ts::TsFile>>,
    /// The view being checked.
    view: Option<usize>,
    /// The `async let`s not yet awaited: whether the call throws, and the scope depth.
    pending: HashMap<LocalId, (bool, usize)>,
    /// The outermost call of a view member's value may be a hook.
    hook_allowed: bool,
    /// Calls that may be hooks as that call's arguments (`useAccount(useRoutedName())`): they
    /// run on every render, in the same order, as the call does.
    hook_args: HashSet<ExprId>,
    /// In a hook function (`fn useX`): the scope depth of its body, whose `let`s and result
    /// may call hooks.
    hook_body: Option<usize>,
    /// The frame of the hook function being checked: its closures are cached across calls, so
    /// a `var` of its own is not one they may capture.
    hook_frame: Option<usize>,
    /// `var`s a closure may capture, read and write (Swift's): one declared in a function, a
    /// closure or a handler, by its name's span. Not one of a view's render or of a hook
    /// function, whose closures are cached across renders and would keep a stale binding.
    capturable: HashSet<Span>,
    /// Whether the call just checked was a hook.
    was_hook: bool,
    /// The body's root chain may carry `.task`.
    task_allowed: bool,
    /// Spans already reported: one error per place.
    reported: HashSet<Span>,
    /// Expressions optional only because a `?.` before them in their chain was `none`:
    /// the rest of the chain reads their value (`b?.label.count`), as JS short-circuits.
    chained: HashSet<ExprId>,
    /// Checking `.ref(x)`'s argument: a `@ref` there is the ref itself.
    ref_object: bool,
    /// Expressions in a child's place (a builder line, a node's children, `Embed`'s value, and
    /// the branches of a conditional there): a list of views is a child (TS's `Child` is).
    child_slots: HashSet<ExprId>,
    /// The pairs of TS object types being compared field by field (a recursive interface
    /// fits itself while it is compared).
    structural: Vec<(DefId, DefId)>,
    /// The next closure checked is `catching { … }`'s block (its frame throws).
    pub(super) closure_throws: bool,
    /// Member chains of immutable values narrowed present (`u.name != none`): the
    /// scope depth, the root local, the path (`?.` marked) and the present type.
    paths: Vec<(usize, LocalId, FieldPath, Ty)>,
    /// Inside `try …`: a call of a throwing function here is marked.
    trying: bool,
    /// Reads of `@Observable` models by views: the view, the local holding the model, the read.
    view_reads: Vec<(usize, LocalId, Read)>,
    /// The member function of a type being checked (`FeedModel$like`), and what each
    /// member of an `@Observable` class reads of its `self`.
    member_fn: Option<String>,
    member_reads: HashMap<String, HashSet<Read>>,
    /// The constrained type parameters in scope: each one's name and bound.
    bounds_in_scope: Vec<(String, Bound)>,
    /// The type parameters in scope bounded by a shape (`<T: ProfileGridEntry>`): each one's
    /// name and shape, whose fields a value of it has.
    shapes_in_scope: Vec<(String, Ty)>,
    /// Checking a module constant's record literal: its string literal fields keep their types.
    literal_record: bool,
    /// Declaring a `let`/`var` statement's names: one that shadows is renamed (`renamed`).
    binding_stmt: bool,
    /// `let path = pathOf()` with a TS value: the local holds TS's claim (`ts_claimed`).
    ts_claimed_locals: HashSet<LocalId>,
    /// What each call is expected to give (by its id), for a generic method's result.
    call_expected: HashMap<ExprId, Ty>,
    /// Calls whose expected type is only inferred, from a sibling (a list literal's earlier item,
    /// a ternary's first branch): it is not met with a generic method's result, which only a
    /// declared type (an annotation, a parameter's) is.
    inferred_expected: HashSet<ExprId>,
    /// The loops and `switch`es around this point, innermost last, each with the frame it is
    /// in: what `break` and `continue` leave.
    breakables: Vec<(usize, Breakable)>,
    /// The base of an implicit member chain (`.dateTime` of `.dateTime.month()`), by its id: the
    /// type the whole chain is expected to be.
    implicit_chains: HashMap<ExprId, Ty>,
    /// Record literals a closure gives (its tail, its `return`s) when its result type is not
    /// written: an expected struct types them but takes their extra fields, as TS checks no
    /// excess property on a callback's result.
    callback_results: HashSet<ExprId>,
    /// Values optional only through a guard kept on a TS value TS says is present
    /// (`viewPost?.id`, `viewPost` a TS `HydratedPost`): TS's own type is the present one.
    claim_only: HashSet<ExprId>,
    /// Calls of a shape-bounded generic, checked once their type arguments are known: each
    /// type argument, its shape, where, and the shapes in scope there.
    pending_shapes: Vec<PendingShape>,
    /// Inside a class's `init`: its fields are set directly, its `let`s too.
    in_init: bool,
    /// `EnvironmentKey(…, default: v)` calls → `v`'s type, and the module constants that
    /// hold one → that type: what a key of this file holds.
    env_values: HashMap<ExprId, Ty>,
    key_values: HashMap<LocalId, Ty>,
    /// Generic calls whose witnesses are found once their type arguments are known: the
    /// call, its type arguments, its constraints, where, and the bounds in scope there.
    pending_witnesses: Vec<PendingWitnesses>,
    /// When analysing for an editor: each checked expression's expected type.
    pub expected: Option<Vec<(Span, Ty)>>,
    /// Whether every typed span is kept (for hover and analysis; a compile does not read them).
    spans: bool,
}

pub fn check(file: &File, source: &str, filename: &str, options: &Options) -> CheckResult {
    let mut checker = Checker::new(source, filename, options);
    checker.module(file);
    checker.finish()
}

/// Checks `file` for the emitter, without the typed spans hover reads.
pub fn check_for_emit(file: &File, source: &str, filename: &str, options: &Options) -> CheckResult {
    let mut checker = Checker::new(source, filename, options);
    checker.spans = false;
    checker.module(file);
    checker.finish()
}

/// Checks `file` and records each expression's expected type (for an editor).
pub fn check_recording(
    file: &File,
    source: &str,
    filename: &str,
    options: &Options,
) -> (CheckResult, Vec<(Span, Ty)>, PathBuf) {
    let mut checker = Checker::new(source, filename, options);
    checker.expected = Some(Vec::new());
    checker.module(file);
    let path = checker.path.clone();
    let expected = checker.expected.take().unwrap_or_default();
    let expected = expected.into_iter().map(|(span, ty)| (span, checker.zonk(&ty))).collect();
    (checker.finish(), expected, path)
}

impl<'o> Checker<'o> {
    fn new(source: &'o str, filename: &str, options: &'o Options) -> Self {
        let path = match &options.root {
            Some(root) if Path::new(filename).is_relative() => root.join(filename),
            _ => PathBuf::from(filename),
        };
        Self {
            source,
            path,
            options,
            out: CheckResult::default(),
            vars: Vec::new(),
            records: HashMap::default(),
            scopes: vec![HashMap::default()],
            type_names: HashMap::default(),
            generics: Vec::new(),
            frames: vec![Frame {
                ret: Ty::Unit,
                is_async: false,
                closure: false,
                written: HashSet::default(),
                task: false,
                render: false,
                spawn: false,
                cleanup: false,
                throws: false,
                raises: None,
                handled: 0,
            }],
            ts_named: HashMap::default(),
            ts_namespaces: HashMap::default(),
            view: None,
            pending: HashMap::default(),
            hook_allowed: false,
            hook_args: HashSet::default(),
            hook_body: None,
            hook_frame: None,
            capturable: HashSet::default(),
            was_hook: false,
            task_allowed: false,
            reported: HashSet::default(),
            chained: HashSet::default(),
            ref_object: false,
            child_slots: HashSet::default(),
            structural: Vec::new(),
            closure_throws: false,
            paths: Vec::new(),
            trying: false,
            view_reads: Vec::new(),
            member_fn: None,
            member_reads: HashMap::default(),
            bounds_in_scope: Vec::new(),
            shapes_in_scope: Vec::new(),
            literal_record: false,
            binding_stmt: false,
            ts_claimed_locals: HashSet::default(),
            call_expected: HashMap::default(),
            inferred_expected: HashSet::default(),
            implicit_chains: HashMap::default(),
            breakables: Vec::new(),
            callback_results: HashSet::default(),
            claim_only: HashSet::default(),
            pending_shapes: Vec::new(),
            in_init: false,
            env_values: HashMap::default(),
            key_values: HashMap::default(),
            pending_witnesses: Vec::new(),
            expected: None,
            spans: true,
        }
    }

    fn finish(mut self) -> CheckResult {
        let rets = std::mem::take(&mut self.out.fn_rets);
        self.out.fn_rets = rets
            .into_iter()
            .map(|(span, ty)| {
                // Nothing at the end of the body: it gives nothing.
                let ty = self.zonk(&ty);
                (span, if matches!(ty, Ty::Var(_)) { Ty::Unit } else { ty })
            })
            .collect();
        let types = std::mem::take(&mut self.out.types);
        self.out.types = types.into_iter().map(|(id, ty)| (id, self.zonk(&ty))).collect();
        let spans = std::mem::take(&mut self.out.spans);
        self.out.spans = spans.into_iter().map(|(span, ty)| (span, self.zonk(&ty))).collect();
        let locals = std::mem::take(&mut self.out.locals);
        self.out.locals = locals.into_iter().map(|l| Local { ty: self.zonk(&l.ty), ..l }).collect();
        let calls = std::mem::take(&mut self.out.calls);
        self.out.calls = calls
            .into_iter()
            .map(|(id, call)| match call {
                CallRes::OnChange(ty) => (id, CallRes::OnChange(self.zonk(&ty))),
                CallRes::Collection(ty) => (id, CallRes::Collection(self.zonk(&ty))),
                other => (id, other),
            })
            .collect();
        let structural = std::mem::take(&mut self.out.structural);
        self.out.structural = structural.into_iter().map(|(id, ty)| (id, self.zonk(&ty))).collect();
        let pattern_tys = std::mem::take(&mut self.out.pattern_tys);
        self.out.pattern_tys = pattern_tys.into_iter().map(|(s, ty)| (s, self.zonk(&ty))).collect();
        let closures = std::mem::take(&mut self.out.closures);
        self.out.closures =
            closures.into_iter().map(|(s, c)| (s, ClosureInfo { ret: self.zonk(&c.ret), ..c })).collect();
        for def in 0..self.out.defs.len() {
            let mut d = self.out.defs[def].clone();
            match &mut d.kind {
                DefKind::Struct(fields) => fields.iter_mut().for_each(|f| f.ty = self.zonk(&f.ty)),
                DefKind::Enum(variants) => {
                    variants.iter_mut().for_each(|v| v.payload.iter_mut().for_each(|p| p.1 = self.zonk(&p.1)))
                }
                DefKind::Protocol(requirements) => {
                    requirements.iter_mut().for_each(|r| r.ty = self.zonk(&r.ty))
                }
            }
            self.out.defs[def] = d;
        }
        self.out
    }

    // ---- diagnostics ----------------------------------------------------

    /// Records `span`'s type for hover and analysis.
    fn span_type(&mut self, (span, ty): (Span, Ty)) {
        if self.spans {
            self.out.spans.push((span, ty));
        }
    }

    fn report(&mut self, diagnostic: Diagnostic) {
        if self.reported.insert(diagnostic.span) {
            self.out.diagnostics.push(diagnostic);
        }
    }

    fn show(&self, ty: &Ty) -> String {
        let ty = self.zonk(ty);
        format!("`{}`", Display { ty: &ty, defs: &self.out.defs })
    }

    fn mismatch(&mut self, span: Span, actual: &Ty, expected: &Ty) {
        let actual = self.zonk(actual);
        let expected = self.zonk(expected);
        if matches!(actual, Ty::Unknown) || matches!(expected, Ty::Unknown) {
            return;
        }
        if let Ty::Foreign(text) = &actual {
            let help = format!(
                "annotate it where Bloom first uses it: `let value: {} = …`; TypeScript then checks the boundary",
                Display { ty: &expected, defs: &self.out.defs }
            );
            let label = if text.is_empty() {
                "a TS value Bloom could not type".to_string()
            } else {
                format!("a TS value Bloom could not type (`{text}`)")
            };
            self.report(
                Diagnostic::error(
                    "B0601",
                    span,
                    format!("a `Foreign` value flows into {}", self.show(&expected)),
                )
                .label(label)
                .help(help)
                .spec("47-the-foreign-boundary"),
            );
            return;
        }
        let mut diagnostic = Diagnostic::error(
            "B0201",
            span,
            format!("expected {}, found {}", self.show(&expected), self.show(&actual)),
        )
        .label(format!("this is {}", self.show(&actual)))
        .spec("43-soundness-rules");
        let help = match (&actual, &expected) {
            (Ty::Float, Ty::Int) => {
                Some("convert it: `.rounded()`, `.floor()`, `.ceil()` or `.truncated()` (a `Float` never narrows implicitly)".to_string())
            }
            (Ty::Option(inner), other) if self.compatible(inner, other) => Some(
                "it may be `none`: unwrap it with `?? fallback`, `if let value = …`, `?.` or `match`"
                    .to_string(),
            ),
            (Ty::Async(_), _) => Some("this is a pending async call: write `await` before it".to_string()),
            (Ty::Promise(_), _) => {
                Some("this is a promise: write `await` before it, and handle its `Result`".to_string())
            }
            (Ty::Result(ok, _), other) if self.compatible(ok, other) => {
                Some("this is a `Result`: `match` it, or write `?` to return the error early".to_string())
            }
            (Ty::Str, Ty::Strings(set)) if set.token => Some(format!(
                "a `String` is not a token: write a literal (`\"{}\"`), or give the value the token type (`let x: {} = …`)",
                set.values.iter().find(|v| v.chars().any(|c| c.is_alphabetic())).cloned().unwrap_or_default(),
                token_type_name(&set.name)
            )),
            _ => None,
        };
        diagnostic = diagnostic.maybe_help(help);
        self.report(diagnostic);
    }

    // ---- types ----------------------------------------------------------

    fn fresh(&mut self) -> Ty {
        self.vars.push(None);
        Ty::Var(self.vars.len() as u32 - 1)
    }

    fn resolve(&self, ty: &Ty) -> Ty {
        let mut ty = ty.clone();
        while let Ty::Var(v) = ty {
            match &self.vars[v as usize] {
                Some(bound) => ty = bound.clone(),
                None => break,
            }
        }
        ty
    }

    pub fn zonk(&self, ty: &Ty) -> Ty {
        map_ty(ty, &mut |t| match t {
            Ty::Var(v) => self.vars[*v as usize].as_ref().map(|bound| self.zonk(bound)),
            _ => None,
        })
    }

    fn occurs(&self, var: u32, ty: &Ty) -> bool {
        let mut found = false;
        map_ty(&self.zonk(ty), &mut |t| {
            if *t == Ty::Var(var) {
                found = true;
            }
            None
        });
        found
    }

    /// One `.bloom` declaration reached through two imports (a module's own and another
    /// module's signature that names it): each import numbers its types anew.
    fn same_declaration(&self, a: DefId, b: DefId) -> bool {
        let (x, y) = (&self.out.defs[a], &self.out.defs[b]);
        let bloom = |o: &Origin| matches!(o, Origin::Bloom { .. } | Origin::Local);
        x.name == y.name
            && x.generics.len() == y.generics.len()
            && bloom(&x.origin)
            && bloom(&y.origin)
            && matches!(x.origin, Origin::Bloom { .. }) | matches!(y.origin, Origin::Bloom { .. })
            && std::mem::discriminant(&x.kind) == std::mem::discriminant(&y.kind)
    }

    fn unify(&mut self, a: &Ty, b: &Ty) -> bool {
        let a = self.resolve(a);
        let b = self.resolve(b);
        match (&a, &b) {
            (Ty::Var(x), Ty::Var(y)) if x == y => true,
            (Ty::Var(x), other) | (other, Ty::Var(x)) => {
                if self.occurs(*x, other) {
                    return false;
                }
                self.vars[*x as usize] = Some(other.clone());
                true
            }
            (Ty::Unknown, _) | (_, Ty::Unknown) | (Ty::Never, _) | (_, Ty::Never) => true,
            (Ty::Foreign(_), Ty::Foreign(_)) | (Ty::View(_), Ty::View(_)) => true,
            (Ty::List(x), Ty::List(y))
            | (Ty::Map(x), Ty::Map(y))
            | (Ty::Set(x), Ty::Set(y))
            | (Ty::Option(x), Ty::Option(y))
            | (Ty::Partial(x), Ty::Partial(y))
            | (Ty::Async(x), Ty::Async(y))
            | (Ty::Promise(x), Ty::Promise(y))
            | (Ty::Binding(x), Ty::Binding(y)) => self.unify(x, y),
            (Ty::Result(a1, b1), Ty::Result(a2, b2))
            | (Ty::KeyPath(a1, b1), Ty::KeyPath(a2, b2))
            | (Ty::JsMap(a1, b1), Ty::JsMap(a2, b2)) => self.unify(a1, a2) && self.unify(b1, b2),
            (Ty::Tuple(x), Ty::Tuple(y)) => {
                x.len() == y.len() && x.iter().zip(y).all(|(x, y)| self.unify(x, y))
            }
            (Ty::Adt(d1, x), Ty::Adt(d2, y)) => {
                (d1 == d2 || self.same_declaration(*d1, *d2))
                    && x.len() == y.len()
                    && x.iter().zip(y).all(|(x, y)| self.unify(x, y))
            }
            (Ty::Strings(x), Ty::Strings(y)) => x.name == y.name || x.values == y.values,
            (Ty::Fn(f), Ty::Fn(g)) => {
                f.params.len() == g.params.len()
                    && f.is_async == g.is_async
                    && f.params.iter().zip(&g.params).all(|(p, q)| self.unify(&p.ty, &q.ty))
                    && self.unify(&f.ret, &g.ret)
            }
            (Ty::Param(x, _), Ty::Param(y, _)) => x == y,
            _ => a == b,
        }
    }

    /// Whether two types could be the same, without binding anything.
    fn compatible(&self, a: &Ty, b: &Ty) -> bool {
        let a = self.zonk(a);
        let b = self.zonk(b);
        a == b || matches!(a, Ty::Var(_)) || matches!(b, Ty::Var(_))
    }

    /// Whether a value of `actual` fits where `expected` is wanted (spec 4.2):
    /// `T` promotes to `T?`, a token is a `String`, a struct is its own patch,
    /// anything flows into TS, and a function returning anything fits one
    /// returning `Unit`.
    /// The structural record type of `fields`: one definition per shape, so two records
    /// of the same fields are the same type.
    pub(crate) fn record_type(&mut self, fields: Vec<FieldDef>) -> Ty {
        let name = format!(
            "{{ {} }}",
            fields
                .iter()
                .map(|f| {
                    let optional = if f.default == FieldDefault::Undefined { "?" } else { "" };
                    format!("{}{optional}: {}", f.name, Display { ty: &f.ty, defs: &self.out.defs })
                })
                .collect::<Vec<_>>()
                .join(", ")
        );
        if let Some(&def) = self.records.get(&name) {
            return Ty::Adt(def, Vec::new());
        }
        self.out.defs.push(Def {
            name: name.clone(),
            generics: Vec::new(),
            kind: DefKind::Struct(fields),
            origin: Origin::Record,
            class: None,
            tagged: None,
        });
        let def = self.out.defs.len() - 1;
        self.records.insert(name, def);
        Ty::Adt(def, Vec::new())
    }

    /// A spec object parameter's type (`dialogButton`), by its name: a record of `fields`.
    pub(crate) fn object_type(&mut self, name: &str, fields: Vec<FieldDef>) -> Ty {
        if let Some(&def) = self.records.get(name) {
            return Ty::Adt(def, Vec::new());
        }
        self.out.defs.push(Def {
            name: name.to_string(),
            generics: Vec::new(),
            kind: DefKind::Struct(fields),
            origin: Origin::Record,
            class: None,
            tagged: None,
        });
        let def = self.out.defs.len() - 1;
        self.records.insert(name.to_string(), def);
        Ty::Adt(def, Vec::new())
    }

    /// A record (or struct) fits a record type when it has each of its fields (an optional one
    /// may be absent), each fitting.
    fn fits_record(
        &mut self,
        actual: DefId,
        actual_args: &[Ty],
        expected: DefId,
        expected_args: &[Ty],
    ) -> bool {
        let have = self.out.defs[actual].fields().to_vec();
        let want = self.out.defs[expected].fields().to_vec();
        want.iter().all(|w| match have.iter().find(|h| h.name == w.name) {
            Some(h) => {
                let (a, e) = (substitute(&h.ty, actual_args), substitute(&w.ty, expected_args));
                // A TS value in a field (`avatar: user.avatar`) fits any field type: TS checks
                // the record where it lands, as it checks a TS value passed as an argument.
                matches!(self.resolve(&a), Ty::Foreign(_))
                    || self.fits_through_ts(&a, &e)
                    || self.coerce(&a, &e)
            }
            None => w.default == FieldDefault::Undefined,
        })
    }

    /// `actual` fits `expected` only through TS values: a list (or dictionary, or optional)
    /// whose items are `Foreign` where Bloom's items are typed, or a function whose parameter is
    /// typed where the expected one is `Foreign` (TS passes it that value). `coerce` refuses
    /// both; the caller writes a `satisfies` so TypeScript checks them.
    /// Whether `ty` still has an unsolved type variable (a generic's `T` at a call).
    fn has_var(&self, ty: &Ty) -> bool {
        let mut found = false;
        map_ty(&self.zonk(ty), &mut |t| {
            found |= matches!(t, Ty::Var(_));
            None
        });
        found
    }

    /// A view, or an optional one.
    fn is_view(&self, ty: &Ty) -> bool {
        match self.resolve(ty) {
            Ty::View(_) => true,
            Ty::Option(inner) => matches!(self.resolve(&inner), Ty::View(_)),
            _ => false,
        }
    }

    /// A list that is a child (`xs.map { x in Row(x) }`): of views, optional or not, or of TS
    /// values (TS checks them where they land, `Menu(glyph, ...rows)`). `Some(true)` when its
    /// items may be spread as siblings; an optional list (`c ? rows : none`) is one child.
    fn child_list(&self, ty: &Ty) -> Option<bool> {
        let items = |ty: &Ty| match self.resolve(ty) {
            Ty::List(item) => {
                let item = match self.resolve(&item) {
                    Ty::Option(inner) => self.resolve(&inner),
                    other => other,
                };
                matches!(item, Ty::View(_) | Ty::Foreign(_))
            }
            _ => false,
        };
        match self.resolve(ty) {
            Ty::Option(inner) if items(&inner) => Some(false),
            list if items(&list) => Some(true),
            _ => None,
        }
    }

    fn fits_through_ts(&mut self, actual: &Ty, expected: &Ty) -> bool {
        let (a, e) = (self.resolve(actual), self.resolve(expected));
        match (&a, &e) {
            (Ty::Foreign(_), Ty::Unknown | Ty::Foreign(_) | Ty::Var(_)) => false,
            (Ty::Foreign(_), _) => true,
            (Ty::List(x), Ty::List(y)) | (Ty::Option(x), Ty::Option(y)) | (Ty::Map(x), Ty::Map(y)) => {
                self.fits_through_ts(x, y)
            }
            (Ty::List(_), Ty::Option(inner)) => self.fits_through_ts(&a, inner),
            (Ty::Fn(f), Ty::Fn(g)) if f.params.len() <= g.params.len() => {
                let mut through = false;
                let mut params = f.params.clone();
                for (p, q) in params.iter_mut().zip(&g.params) {
                    let (pt, qt) = (self.resolve(&p.ty), self.resolve(&q.ty));
                    if matches!(qt, Ty::Foreign(_))
                        && !matches!(pt, Ty::Foreign(_) | Ty::Unknown | Ty::Var(_))
                    {
                        p.ty = q.ty.clone();
                        through = true;
                    }
                }
                through && self.coerce(&Ty::Fn(Rc::new(FnTy { params, ..(**f).clone() })), &e)
            }
            _ => false,
        }
    }

    fn coerce(&mut self, actual: &Ty, expected: &Ty) -> bool {
        let a = self.resolve(actual);
        let e = self.resolve(expected);
        match (&a, &e) {
            (Ty::Never | Ty::Unknown, _) | (_, Ty::Unknown) => true,
            (Ty::Var(_), _) | (_, Ty::Var(_)) => self.unify(&a, &e),
            (_, Ty::Foreign(_)) => true,
            // A value of `T: ProfileGridEntry` is a `ProfileGridEntry` (and fits what one fits).
            (Ty::Param(..), _) if !matches!(e, Ty::Param(..)) && self.shape_of(&a).is_some() => {
                let shape = self.shape_of(&a).expect("checked");
                self.coerce(&shape, &e)
            }
            (Ty::Foreign(_), _) => false,
            (Ty::Option(x), Ty::Option(y)) => self.coerce(x, y),
            (_, Ty::Option(inner)) => self.coerce(&a, inner),
            (Ty::Strings(_), Ty::Str) => true,
            // An `Int` widens to `Float` (both are JS numbers; spec 4.2). Never the other way.
            (Ty::Int, Ty::Float) => true,
            (Ty::Map(x), Ty::Map(y)) => self.coerce(x, y),
            // A record, or a TS object type, is a dictionary of its fields when each fits.
            (Ty::Adt(def, args), Ty::Map(value))
                if matches!(self.out.defs[*def].origin, Origin::Record | Origin::Ts { .. })
                    && matches!(self.out.defs[*def].kind, DefKind::Struct(_)) =>
            {
                let (args, value) = (args.clone(), (**value).clone());
                let fields = self.out.defs[*def].fields().to_vec();
                fields.iter().all(|f| self.coerce(&substitute(&f.ty, &args), &value))
            }
            (Ty::Adt(d1, x), Ty::Adt(d2, y))
                if d1 != d2
                    && (self.out.defs[*d1].origin == Origin::Record
                        || self.out.defs[*d2].origin == Origin::Record)
                    && matches!(self.out.defs[*d2].kind, DefKind::Struct(_)) =>
            {
                let (d1, d2, x, y) = (*d1, *d2, x.clone(), y.clone());
                self.fits_record(d1, &x, d2, &y)
            }
            // Two TS object types (`PostUser` where `ProfileCardData` is expected): TS's types
            // are structural, so one fits the other when its fields do.
            (Ty::Adt(d1, x), Ty::Adt(d2, y))
                if d1 != d2
                    && matches!(self.out.defs[*d1].origin, Origin::Ts { .. })
                    && matches!(self.out.defs[*d2].origin, Origin::Ts { .. })
                    && matches!(self.out.defs[*d1].kind, DefKind::Struct(_))
                    && matches!(self.out.defs[*d2].kind, DefKind::Struct(_)) =>
            {
                let (d1, d2, x, y) = (*d1, *d2, x.clone(), y.clone());
                if self.structural.contains(&(d1, d2)) {
                    return true;
                }
                self.structural.push((d1, d2));
                let fits = self.fits_record(d1, &x, d2, &y);
                self.structural.pop();
                fits
            }
            (Ty::Strings(x), Ty::Strings(y)) => {
                Rc::ptr_eq(x, y) || x.values.iter().all(|v| ui::token_ok(y, v))
            }
            (Ty::Adt(d1, x), Ty::Partial(inner)) => match self.resolve(inner) {
                Ty::Adt(d2, y) => *d1 == d2 && x.iter().zip(&y).all(|(x, y)| self.unify(x, y)),
                _ => false,
            },
            (Ty::List(x), Ty::List(y)) => self.coerce(x, y),
            (Ty::Fn(f), Ty::Fn(g)) => {
                if f.params.len() > g.params.len() && f.params[g.params.len()..].iter().any(|p| !p.optional) {
                    return false;
                }
                let params_ok = f.params.iter().zip(&g.params).all(|(p, q)| self.coerce(&q.ty, &p.ty));
                let mut ret = self.resolve(&g.ret);
                // TS's `() => Promise<void> | void` (read as `Promise<Unit>?`): its result may be
                // discarded, so a function returning nothing fits it, and an async one its promise (R1).
                if let Ty::Option(inner) = &ret {
                    let inner = self.resolve(inner);
                    let void_promise =
                        matches!(&inner, Ty::Promise(value) if self.resolve(value) == Ty::Unit);
                    if inner == Ty::Unit || (void_promise && !f.is_async) {
                        ret = Ty::Unit;
                    } else if void_promise {
                        ret = inner;
                    }
                }
                let ret_ok = if ret == Ty::Unit {
                    // The result is discarded; an async function's promise too.
                    let _ = self.unify(&f.ret, &Ty::Unit) || true;
                    true
                } else if f.is_async
                    && !g.is_async
                    && let Ty::Promise(inner) = &ret
                {
                    // A Bloom `async` function is a JS function returning a promise that
                    // never rejects (its failures are values), so it is TS's `() => Promise<T>`.
                    // One whose result is itself a TS promise resolves to that promise's value.
                    match self.resolve(&f.ret) {
                        Ty::Promise(value) => self.coerce(&value, inner),
                        _ => self.coerce(&f.ret, inner),
                    }
                } else {
                    f.is_async == g.is_async && self.coerce(&f.ret, &g.ret)
                };
                params_ok && ret_ok
            }
            _ => self.unify(&a, &e),
        }
    }

    // ---- scopes ---------------------------------------------------------

    fn push(&mut self) {
        self.scopes.push(HashMap::default());
    }

    fn pop(&mut self) {
        // An `async let` is awaited in its scope: its result (or its error) is read.
        let depth = self.scopes.len();
        let mut left: Vec<LocalId> =
            self.pending.iter().filter(|(_, (_, d))| *d == depth).map(|(l, _)| *l).collect();
        left.sort_unstable();
        for local in left {
            self.pending.remove(&local);
            let info = self.out.locals[local].clone();
            self.report(
                Diagnostic::error("B0227", info.span, format!("`async let {}` is never awaited", info.name))
                    .label("its call runs, and nothing reads its result or its error")
                    .help(format!(
                        "read it with `await {}` before the block ends, or call it without `async let`",
                        info.name
                    ))
                    .spec("8-effects-tasks-and-concurrency"),
            );
        }
        self.scopes.pop();
        let depth = self.scopes.len();
        self.paths.retain(|p| p.0 <= depth);
    }

    fn declare(&mut self, name: &Ident, ty: Ty, kind: LocalKind) -> LocalId {
        if self.binding_stmt
            && matches!(kind, LocalKind::Let | LocalKind::Var)
            && name.name != "_"
            && let Some(outer) = self.lookup(&name.name)
            && !matches!(
                self.out.locals[outer].kind,
                LocalKind::ModuleFn
                    | LocalKind::ModuleConst
                    | LocalKind::View
                    | LocalKind::Import { .. }
                    | LocalKind::Component { .. }
            )
        {
            let taken =
                self.out.renamed.values().filter(|n| n.starts_with(&format!("{}$", name.name))).count();
            self.out.renamed.insert(name.span, format!("{}${}", name.name, taken + 1));
        }
        let id = self.out.locals.len();
        self.out.locals.push(Local {
            name: name.name.clone(),
            ty: ty.clone(),
            kind,
            span: name.span,
            frame: self.frames.len() - 1,
            view: self.view,
        });
        self.span_type((name.span, ty));
        if name.name != "_" {
            self.scopes.last_mut().expect("a scope").insert(name.name.clone(), id);
        }
        id
    }

    fn lookup(&self, name: &str) -> Option<LocalId> {
        self.scopes.iter().rev().find_map(|scope| scope.get(name).copied())
    }

    fn names_in_scope(&self) -> Vec<String> {
        let mut names: Vec<String> = self.scopes.iter().flat_map(|s| s.keys().cloned()).collect();
        names.extend(
            ["ok", "err", "fail", "toast", "navigate", "Binding", "sleep", "all", "race"].map(String::from),
        );
        names.extend(ui::constructors().map(String::from));
        names
    }

    // ---- type expressions -----------------------------------------------

    fn resolve_type(&mut self, te: &TypeExpr) -> Ty {
        let ty = self.resolve_type_inner(te);
        self.span_type((te.span, ty.clone()));
        self.out.type_exprs.insert(te.span, ty.clone());
        ty
    }

    fn resolve_type_inner(&mut self, te: &TypeExpr) -> Ty {
        match &te.kind {
            TypeKind::Error => Ty::Unknown,
            TypeKind::Composition(_) => {
                self.report(
                    Diagnostic::error("B0232", te.span, "a protocol composition is a constraint, not a type")
                        .label("`P & Q` constrains a type parameter")
                        .help("write `func f<T: P & Q>(_ x: T)`, or `where T: P & Q`")
                        .spec("46-generics"),
                );
                Ty::Unknown
            }
            TypeKind::List(t) => Ty::List(Box::new(self.resolve_type(t))),
            TypeKind::Map(k, v) => {
                let key = self.resolve_type(k);
                if !matches!(key, Ty::Str | Ty::Unknown) {
                    self.report(
                        Diagnostic::error(
                            "B0204",
                            k.span,
                            format!("a map's keys are strings in phase 0, not {}", self.show(&key)),
                        )
                        .label("not a `String` key")
                        .help("key it by a string (`[String: V]`), or keep a list of pairs")
                        .spec("41-the-types"),
                    );
                }
                Ty::Map(Box::new(self.resolve_type(v)))
            }
            TypeKind::Strings(values) => {
                let name = values.iter().map(|v| format!("{v:?}")).collect::<Vec<_>>().join(" | ");
                let mut unique: Vec<String> = Vec::new();
                for value in values {
                    if !unique.contains(value) {
                        unique.push(value.clone());
                    }
                }
                Ty::Strings(Rc::new(StrSet { name, values: unique, token: false }))
            }
            TypeKind::Record(fields) => {
                let fields = fields
                    .iter()
                    .map(|(name, t)| {
                        let ty = self.resolve_type(t);
                        let default = if matches!(ty, Ty::Option(_)) {
                            FieldDefault::Undefined
                        } else {
                            FieldDefault::None
                        };
                        FieldDef { name: name.name.clone(), ty, default }
                    })
                    .collect();
                self.record_type(fields)
            }
            TypeKind::Tuple(items) if items.is_empty() => Ty::Unit,
            TypeKind::Tuple(items) => Ty::Tuple(items.iter().map(|t| self.resolve_type(t)).collect()),
            TypeKind::Fn { is_async, params, ret } => {
                let params = params
                    .iter()
                    .map(|p| ParamTy {
                        labelled: false,
                        positional: false,
                        name: None,
                        ty: self.resolve_type(p),
                        optional: false,
                        rest: false,
                    })
                    .collect();
                let ret = self.resolve_type(ret);
                Ty::Fn(Rc::new(FnTy {
                    params,
                    ret,
                    is_async: *is_async,
                    generics: 0,
                    ts: false,
                    throws: false,
                    bounds: Vec::new(),
                    shapes: Vec::new(),
                }))
            }
            TypeKind::Optional(inner) => {
                let inner_ty = self.resolve_type(inner);
                if matches!(inner.kind, TypeKind::Optional(_)) || matches!(inner_ty, Ty::Option(_)) {
                    self.report(
                        Diagnostic::error("B0203", te.span, "an optional is never optional again")
                            .label("`T??` has no meaning `T?` lacks")
                            .help("write one `?`: an optional's absence is `none` alone")
                            .spec("41-the-types"),
                    );
                    return inner_ty;
                }
                Ty::Option(Box::new(inner_ty))
            }
            TypeKind::Named { name, args } => self.named_type(name, args, te.span),
        }
    }

    fn named_type(&mut self, name: &Ident, args: &[TypeExpr], span: Span) -> Ty {
        let arity = |checker: &mut Self, want: usize| -> bool {
            if args.len() != want {
                checker.report(
                    Diagnostic::error(
                        "B0218",
                        span,
                        format!("`{}` takes {want} type argument(s), not {}", name.name, args.len()),
                    )
                    .label("wrong number of type arguments")
                    .spec("46-generics"),
                );
                return false;
            }
            true
        };
        if let Some(index) = self.generics.iter().rposition(|g| *g == name.name) {
            return Ty::Param(index as u32, name.name.as_str().into());
        }
        // `Foreign<"ReturnType<typeof setTimeout>">`: a TS type written out, which TS checks.
        if name.name == "Foreign"
            && let [TypeExpr { kind: TypeKind::Strings(texts), .. }] = args
            && let [text] = texts.as_slice()
        {
            return Ty::Foreign(text.as_str().into());
        }
        // `any P`: a value of some type conforming to `P`, with its witness.
        if name.name == "any"
            && let [inner] = args
        {
            return match self.resolve_type(inner) {
                any @ Ty::Any(_) => any,
                Ty::Unknown => Ty::Unknown,
                other => {
                    let shown = self.show(&other);
                    self.report(
                        Diagnostic::error(
                            "B0204",
                            inner.span,
                            format!("`any` takes a protocol, and {shown} is not one"),
                        )
                        .label("not a protocol")
                        .spec("48-protocols"),
                    );
                    Ty::Unknown
                }
            };
        }
        let simple = match name.name.as_str() {
            "Int" => Some(Ty::Int),
            "Float" => Some(Ty::Float),
            "Bool" => Some(Ty::Bool),
            "String" => Some(Ty::Str),
            "Unit" | "Void" => Some(Ty::Unit),
            "Double" => Some(Ty::Float),
            "View" => Some(Ty::View(None)),
            "Error" => Some(Ty::JsError),
            "Foreign" => Some(Ty::Foreign("".into())),
            _ => None,
        };
        if let Some(ty) = simple {
            arity(self, 0);
            return ty;
        }
        match name.name.as_str() {
            "Map" => {
                return if arity(self, 2) {
                    let key = self.resolve_type(&args[0]);
                    Ty::JsMap(Box::new(key), Box::new(self.resolve_type(&args[1])))
                } else {
                    Ty::Unknown
                };
            }
            "Set" => {
                return if arity(self, 1) {
                    Ty::Set(Box::new(self.resolve_type(&args[0])))
                } else {
                    Ty::Unknown
                };
            }
            "Result" => {
                return if arity(self, 2) {
                    let ok = self.resolve_type(&args[0]);
                    Ty::Result(Box::new(ok), Box::new(self.resolve_type(&args[1])))
                } else {
                    Ty::Unknown
                };
            }
            "Promise" => {
                return if arity(self, 1) {
                    Ty::Promise(Box::new(self.resolve_type(&args[0])))
                } else {
                    Ty::Unknown
                };
            }
            "Binding" => {
                return if arity(self, 1) {
                    Ty::Binding(Box::new(self.resolve_type(&args[0])))
                } else {
                    Ty::Unknown
                };
            }
            "KeyPath" => {
                if !arity(self, 2) {
                    return Ty::Unknown;
                }
                let root = self.resolve_type(&args[0]);
                let value = self.resolve_type(&args[1]);
                return match &root {
                    Ty::Adt(def, _) if matches!(self.out.defs[*def].kind, DefKind::Struct(_)) => {
                        Ty::KeyPath(Box::new(root), Box::new(value))
                    }
                    // A generic function's `KeyPath<T, V>`: each call's `T` is a struct, which
                    // the key path written at the call is checked against.
                    Ty::Param(..) => Ty::KeyPath(Box::new(root), Box::new(value)),
                    Ty::Unknown => Ty::Unknown,
                    _ => {
                        self.report(
                            Diagnostic::error(
                                "B0204",
                                args[0].span,
                                format!("a key path is into a struct, not {}", self.show(&root)),
                            )
                            .label("not a struct")
                            .spec("44-structs"),
                        );
                        Ty::Unknown
                    }
                };
            }
            "Partial" => {
                if !arity(self, 1) {
                    return Ty::Unknown;
                }
                let inner = self.resolve_type(&args[0]);
                return match &inner {
                    Ty::Adt(def, _) if matches!(self.out.defs[*def].kind, DefKind::Struct(_)) => {
                        Ty::Partial(Box::new(inner))
                    }
                    Ty::Unknown => Ty::Unknown,
                    _ => {
                        self.report(
                            Diagnostic::error(
                                "B0204",
                                args[0].span,
                                format!("`Partial` takes a struct, not {}", self.show(&inner)),
                            )
                            .label("not a struct")
                            .spec("44-structs"),
                        );
                        Ty::Unknown
                    }
                };
            }
            _ => {}
        }
        if let Some(found) = self.type_names.get(&name.name).cloned() {
            return match found {
                // A protocol written as a type is its existential (`any P`).
                TypeName::Def(def) if matches!(self.out.defs[def].kind, DefKind::Protocol(_)) => Ty::Any(def),
                TypeName::Def(def) => {
                    let want = self.out.defs[def].generics.len();
                    if !arity(self, want) {
                        return Ty::Unknown;
                    }
                    let args = args.iter().map(|a| self.resolve_type(a)).collect();
                    Ty::Adt(def, args)
                }
                TypeName::Alias(ty, want) => {
                    if !arity(self, want) {
                        return Ty::Unknown;
                    }
                    let args: Vec<Ty> = args.iter().map(|a| self.resolve_type(a)).collect();
                    substitute(&ty, &args)
                }
                TypeName::Ty(ty) => ty,
            };
        }
        if let Some(set) = ui::token_set_by_type(&name.name) {
            arity(self, 0);
            return Ty::Strings(set);
        }
        let mut candidates: Vec<String> = self.type_names.keys().cloned().collect();
        candidates.extend(
            [
                "Int", "Float", "Bool", "String", "Unit", "View", "Result", "Binding", "Partial", "KeyPath",
                "Error",
            ]
            .map(String::from),
        );
        let help = closest(&name.name, candidates.iter().map(String::as_str))
            .map(|near| format!("did you mean `{near}`?"));
        let mut diagnostic =
            Diagnostic::error("B0204", name.span, format!("cannot find type `{}`", name.name))
                .label("not a type in scope")
                .maybe_help(help.clone())
                .spec("41-the-types");
        if help.is_none() {
            diagnostic =
                diagnostic.help("declare it (`struct`, `enum`, `type`), or import it from its module");
        }
        self.report(diagnostic);
        Ty::Unknown
    }

    // ---- the module -----------------------------------------------------

    fn module(&mut self, file: &File) {
        for import in &file.imports {
            self.import(import);
        }
        // Types first (so fields can name any of them), then their bodies.
        let mut pending = Vec::new();
        let no_generics: Vec<Ident> = Vec::new();
        for (index, item) in file.items.iter().enumerate() {
            let (name, generics) = match &item.kind {
                ItemKind::Struct(s) => (&s.name, &s.generics),
                ItemKind::Enum(e) => (&e.name, &e.generics),
                ItemKind::Class(c) => (&c.name, &c.generics),
                ItemKind::Protocol(p) => (&p.name, &no_generics),
                ItemKind::Alias(_) => {
                    pending.push(index);
                    continue;
                }
                _ => continue,
            };
            if self.type_names.contains_key(&name.name) {
                self.duplicate(name);
                continue;
            }
            let def = self.out.defs.len();
            let kind = match &item.kind {
                ItemKind::Struct(_) | ItemKind::Class(_) => DefKind::Struct(Vec::new()),
                ItemKind::Protocol(_) => DefKind::Protocol(Vec::new()),
                _ => DefKind::Enum(Vec::new()),
            };
            let class = match &item.kind {
                ItemKind::Class(c) => Some(ClassDef { observable: c.observable, ..ClassDef::default() }),
                _ => None,
            };
            self.out.defs.push(Def {
                name: name.name.clone(),
                generics: generics.iter().map(|g| g.name.clone()).collect(),
                kind,
                origin: Origin::Local,
                class,
                tagged: None,
            });
            self.type_names.insert(name.name.clone(), TypeName::Def(def));
            self.span_type((name.span, Ty::Adt(def, Vec::new())));
        }
        for index in pending {
            if let ItemKind::Alias(alias) = &file.items[index].kind {
                self.generics = alias.generics.iter().map(|g| g.name.clone()).collect();
                let ty = self.resolve_type(&alias.ty);
                self.generics.clear();
                self.type_names.insert(alias.name.name.clone(), TypeName::Alias(ty, alias.generics.len()));
            }
        }
        for item in &file.items {
            match &item.kind {
                ItemKind::Struct(s) => self.struct_fields(s),
                ItemKind::Enum(e) => self.enum_variants(e),
                ItemKind::Class(c) => self.class_fields(c),
                _ => {}
            }
        }
        for item in &file.items {
            if let ItemKind::Protocol(p) = &item.kind {
                self.protocol_requirements(p);
            }
        }
        // Values: functions and views are visible everywhere; constants in order.
        for (index, item) in file.items.iter().enumerate() {
            let local = match &item.kind {
                ItemKind::Fn(f) => {
                    let ty = self.fn_signature(f);
                    if let Ty::Fn(fn_ty) = &ty
                        && !fn_ty.bounds.is_empty()
                    {
                        let params = fn_ty
                            .bounds
                            .iter()
                            .filter_map(|(param, protocol)| match param {
                                Ty::Param(index, name) => {
                                    Some((witness_param(name, protocol), *index, Bound::of(protocol)))
                                }
                                _ => None,
                            })
                            .collect();
                        self.out.witness_params.insert(f.span, params);
                    }
                    Some(self.declare_unique(&f.name, ty, LocalKind::ModuleFn))
                }
                ItemKind::View(v) => {
                    let ty = self.view_type(v);
                    Some(self.declare_unique(&v.name, ty, LocalKind::View))
                }
                _ => None,
            };
            if let Some(local) = local {
                self.out.items.insert(index, local);
            }
        }
        self.conformances(file);
        let mut screens = 0;
        for (index, item) in file.items.iter().enumerate() {
            match &item.kind {
                ItemKind::Const(c) => {
                    let declared = c.ty.as_ref().map(|t| self.resolve_type(t));
                    let ty = self.const_value(&c.value, declared.as_ref());
                    let local = match self.lazy_props(&c.value) {
                        // `let X = lazy(() => import("./X"))`: a component, with the module's props.
                        Some(props) => self.declare_unique(
                            &c.name,
                            Ty::View(Some("embed")),
                            LocalKind::Component { props },
                        ),
                        // `private var`: the file's own, which any function or closure may write.
                        None if c.mutable => {
                            self.capturable.insert(c.name.span);
                            self.declare_unique(&c.name, ty, LocalKind::Var)
                        }
                        None => self.declare_unique(&c.name, ty, LocalKind::ModuleConst),
                    };
                    if let Some(value) = self.env_values.get(&c.value.id).cloned() {
                        self.key_values.insert(local, value);
                    }
                    self.out.items.insert(index, local);
                }
                ItemKind::Struct(s) => self.struct_defaults(s),
                ItemKind::Class(c) => self.class_defaults(c),
                ItemKind::Fn(f) => {
                    self.fn_body(f, false);
                }
                ItemKind::View(v) => {
                    if matches!(v.kind, ViewKind::Screen | ViewKind::Layout) {
                        screens += 1;
                        if screens > 1 {
                            self.report(
                                Diagnostic::error(
                                    "B0106",
                                    v.name.span,
                                    "a file has one `screen` or `layout`",
                                )
                                .label("a second route in this file")
                                .help("a route is the file's default export: move this one to its own file")
                                .spec("71-a-view"),
                            );
                        }
                    }
                    self.view_decl(index, v);
                }
                _ => {}
            }
        }
        self.observed();
        for (id, bounds, span, scope) in std::mem::take(&mut self.pending_witnesses) {
            let outer = std::mem::replace(&mut self.bounds_in_scope, scope);
            let witnesses = bounds
                .iter()
                .map(|(ty, protocol)| self.witness_for(ty, &Bound::of(protocol), span))
                .collect();
            self.bounds_in_scope = outer;
            self.out.witness_args.insert(id, witnesses);
        }
        for (ty, shape, span, scope) in std::mem::take(&mut self.pending_shapes) {
            let outer = std::mem::replace(&mut self.shapes_in_scope, scope);
            self.has_shape(&ty, &shape, span);
            self.shapes_in_scope = outer;
        }
    }

    /// A module constant's value. A record literal written without a type keeps its string
    /// literals' types (`let SIZES = { small: "8", large: "12" }` is `{ small: "8", large:
    /// "12" }`), as TS's `as const` does, so a field read is a token where one is taken (R6).
    fn const_value(&mut self, value: &Expr, declared: Option<&Ty>) -> Ty {
        // `let TABS = ["videos", "following"]`: a list of string literals is a list of their
        // union (`["videos", "following"] as const`), so `TABS[i]` and `for tab in TABS` are
        // a `"videos" | "following"`, as TS's `as const` tab lists are.
        if declared.is_none()
            && let ExprKind::List(items) = &value.kind
            && !items.is_empty()
            && let Some(literals) = items.iter().map(string_literal).collect::<Option<Vec<_>>>()
        {
            let mut values: Vec<String> = Vec::new();
            for ty in literals {
                if let Ty::Strings(set) = ty
                    && !values.contains(&set.values[0])
                {
                    values.push(set.values[0].clone());
                }
            }
            let name = values.iter().map(|v| format!("{v:?}")).collect::<Vec<_>>().join(" | ");
            let elem = Ty::Strings(Rc::new(StrSet { name, values, token: false }));
            let list = Ty::List(Box::new(elem));
            let ty = self.expr(value, Some(&list));
            self.out.literal_consts.insert(value.id);
            return ty;
        }
        let literal = declared.is_none() && matches!(value.kind, ExprKind::Record(_));
        let outer = std::mem::replace(&mut self.literal_record, literal);
        let ty = self.expr(value, declared);
        self.literal_record = outer;
        if literal {
            self.out.literal_consts.insert(value.id);
        }
        ty
    }

    /// `let isNested = isNested ?? false` beside a stored `var isNested: Bool? = none`: one name
    /// declared twice in the struct (Swift's invalid redeclaration), not a shadow.
    fn member_beside_prop(&mut self, name: &Ident) {
        let Some(prop) = self.scopes.last().and_then(|s| s.get(&name.name)).copied() else { return };
        if !matches!(self.out.locals[prop].kind, LocalKind::Prop | LocalKind::Bound) {
            return;
        }
        self.report(
            Diagnostic::error("B0217", name.span, format!("`{}` is a stored property already", name.name))
                .label("a second declaration in the struct")
                .help(format!(
                    "give the stored property its default (`var {}: T = …`): a prop left out takes it, as TS's `{{ {} = … }} = props` does",
                    name.name, name.name
                ))
                .spec("71a-a-view-the-20-way"),
        );
    }

    fn duplicate(&mut self, name: &Ident) {
        self.report(
            Diagnostic::error("B0217", name.span, format!("`{}` is declared twice", name.name))
                .label("a second declaration")
                .help("rename one of them")
                .spec("10-modules-and-interop"),
        );
    }

    fn declare_unique(&mut self, name: &Ident, ty: Ty, kind: LocalKind) -> LocalId {
        if self.scopes.last().is_some_and(|s| s.contains_key(&name.name)) {
            self.duplicate(name);
        }
        self.declare(name, ty, kind)
    }

    fn struct_fields(&mut self, s: &StructDecl) {
        let Some(TypeName::Def(def)) = self.type_names.get(&s.name.name).cloned() else { return };
        self.generics = s.generics.iter().map(|g| g.name.clone()).collect();
        let mut fields: Vec<FieldDef> = Vec::new();
        for field in &s.fields {
            if fields.iter().any(|f| f.name == field.name.name) {
                self.duplicate(&field.name);
            }
            let ty = self.resolve_type(&field.ty);
            let default = match &field.default {
                Some(expr) => FieldDefault::Expr(expr.id),
                None => FieldDefault::None,
            };
            fields.push(FieldDef { name: field.name.name.clone(), ty, default });
        }
        self.generics.clear();
        self.out.defs[def].kind = DefKind::Struct(fields);
    }

    fn struct_defaults(&mut self, s: &StructDecl) {
        let Some(TypeName::Def(def)) = self.type_names.get(&s.name.name).cloned() else { return };
        self.generics = s.generics.iter().map(|g| g.name.clone()).collect();
        for (index, field) in s.fields.iter().enumerate() {
            if let Some(expr) = &field.default {
                let ty = self.out.defs[def].fields()[index].ty.clone();
                self.expr(expr, Some(&ty));
            }
        }
        self.generics.clear();
    }

    fn enum_variants(&mut self, e: &EnumDecl) {
        let Some(TypeName::Def(def)) = self.type_names.get(&e.name.name).cloned() else { return };
        self.generics = e.generics.iter().map(|g| g.name.clone()).collect();
        let mut variants: Vec<VariantDef> = Vec::new();
        for variant in &e.variants {
            if variants.iter().any(|v| v.name == variant.name.name) {
                self.duplicate(&variant.name);
            }
            let payload = variant
                .payload
                .iter()
                .map(|p| (p.name.as_ref().map(|n| n.name.clone()), self.resolve_type(&p.ty)))
                .collect();
            variants.push(VariantDef { name: variant.name.name.clone(), payload });
        }
        self.generics.clear();
        self.out.defs[def].kind = DefKind::Enum(variants);
    }

    fn fn_signature(&mut self, f: &FnDecl) -> Ty {
        // A function of its own type parameters; a member of a generic view's sees the view's.
        let outer_generics = self.generics.clone();
        if !f.generics.is_empty() {
            self.generics = f.generics.iter().map(|g| g.name.clone()).collect();
        }
        let params = f
            .params
            .iter()
            .map(|p| {
                let ty = self.resolve_type(&p.ty);
                // A rest parameter takes any number of its list's elements.
                let (ty, rest) = match (p.rest, self.resolve(&ty)) {
                    (true, Ty::List(element)) => (*element, true),
                    _ => (ty, false),
                };
                // A `func`'s parameter is called by its label (its name unless written), `_` by position.
                let (labelled, positional, name) = match (&p.label, f.func) {
                    (Some(label), _) if label.name == "_" => (false, true, Some(p.name.name.clone())),
                    (Some(label), _) => (true, false, Some(label.name.clone())),
                    (None, func) => (func && !rest, false, Some(p.name.name.clone())),
                };
                ParamTy { labelled, positional, name, ty, optional: p.default.is_some(), rest }
            })
            .collect();
        let ret = match &f.ret {
            Some(r) => self.resolve_type(r),
            // A hook function's result is inferred (a TS hook rarely writes its type).
            None if is_hook_name(&f.name.name) => match self.out.fn_rets.get(&f.span) {
                Some(ret) => ret.clone(),
                None => {
                    let ret = self.fresh();
                    self.out.fn_rets.insert(f.span, ret.clone());
                    ret
                }
            },
            None => Ty::Unit,
        };
        let bounds = self
            .bounds(&f.generics, &f.constraints)
            .into_iter()
            .map(|(index, name, bound)| (Ty::Param(index, name.as_str().into()), bound.name()))
            .collect();
        let shaped = self.shapes(&f.generics, &f.constraints);
        let shapes = shaped
            .iter()
            .map(|(index, shape)| {
                (Ty::Param(*index, f.generics[*index as usize].name.as_str().into()), shape.clone())
            })
            .collect();
        if !shaped.is_empty() {
            self.out.shapes.insert(f.span, shaped);
        }
        self.generics = outer_generics;
        Ty::Fn(Rc::new(FnTy {
            params,
            ret,
            is_async: f.is_async,
            generics: f.generics.len() as u32,
            ts: false,
            throws: f.throws.is_some(),
            bounds,
            shapes,
        }))
    }

    /// `@Environment(\.k)`: the built-in value `k` (`disabled`, `controlSize`,
    /// `buttonStyle`), or the environment key named `k` in scope (an app's own value).
    fn environment_key(&mut self, state: &StateDecl, key: &Ident, declared: Option<Ty>) -> Ty {
        let builtin = match key.name.as_str() {
            "disabled" => Some(Ty::Bool),
            "controlSize" | "buttonStyle" => Some(Ty::Foreign(
                format!(
                    "(typeof import(\"@oxy.so/bloom-language\").environmentValues)[\"{}\"][\"defaultValue\"]",
                    key.name
                )
                .into(),
            )),
            _ => None,
        };
        if let Some(ty) = builtin {
            self.out.env_keys.insert(state.span, None);
            return declared.unwrap_or(ty);
        }
        match self.lookup(&key.name) {
            Some(local) => {
                self.out.env_keys.insert(state.span, Some(local));
                // A key of this file: the type of its default; another module's: its TS type's.
                let value = self.key_values.get(&local).cloned().or_else(|| {
                    match self.resolve(&self.out.locals[local].ty.clone()) {
                        Ty::Foreign(text) => text
                            .strip_prefix("import(\"@oxy.so/bloom-language\").EnvironmentKey<")
                            .and_then(|t| t.strip_suffix('>'))
                            .map(|t| self.named_ts(t)),
                        _ => None,
                    }
                });
                declared.or(value).unwrap_or_else(|| Ty::Foreign("".into()))
            }
            None => {
                self.report(
                    Diagnostic::error("B0202", key.span, format!("no environment value `\\.{}` in scope", key.name))
                        .label("not a built-in value, nor a key declared or imported here")
                        .help("import the module that declares it, or use `disabled`, `controlSize` or `buttonStyle`")
                        .spec("74-environment"),
                );
                self.out.env_keys.insert(state.span, None);
                Ty::Unknown
            }
        }
    }

    /// A TS type's text that names a Bloom type in scope (`Session`, `string`), as the
    /// type; else the TS type itself.
    fn named_ts(&self, text: &str) -> Ty {
        match text {
            "number" => Ty::Float,
            "string" => Ty::Str,
            "boolean" => Ty::Bool,
            name => match self.type_names.get(name) {
                Some(TypeName::Def(def)) => Ty::Adt(*def, Vec::new()),
                _ => Ty::Foreign(name.into()),
            },
        }
    }

    /// `task { … }` / `Task { … }`: work started without being awaited (its own async frame).
    pub(super) fn spawn(&mut self, stmts: &[Stmt], span: Span) {
        let task = self.frames.last().is_some_and(|f| f.task);
        self.frames.push(Frame {
            ret: Ty::Unit,
            is_async: true,
            closure: true,
            written: HashSet::default(),
            task,
            render: false,
            spawn: true,
            cleanup: false,
            throws: false,
            raises: None,
            handled: 0,
        });
        self.push();
        let trying = std::mem::take(&mut self.trying);
        self.stmts(stmts, Some(&Ty::Unit), span);
        self.trying = trying;
        self.pop();
        self.frames.pop();
    }

    /// A call of a generic function whose constraints take witnesses: found once its
    /// type arguments are known (at the module's end).
    pub(super) fn witnesses_of(&mut self, expr: &Expr, span: Span, f: &FnTy) {
        for (ty, shape) in &f.shapes {
            self.pending_shapes.push((ty.clone(), shape.clone(), span, self.shapes_in_scope.clone()));
        }
        if f.bounds.is_empty() {
            return;
        }
        let scope = self.bounds_in_scope.clone();
        self.pending_witnesses.push((expr.id, f.bounds.clone(), span, scope));
    }

    /// A call of a function that throws: written in a `try`.
    pub(super) fn throwing_call(&mut self, span: Span, f: &FnTy) {
        if f.throws && !self.trying {
            self.report(
                Diagnostic::error("B0223", span, "this call can throw, and it is not marked with `try`")
                    .label("a throwing call")
                    .help("write `try` before it (`try?` for `none` on an error, `do { try … } catch { … }` to handle it)")
                    .fix(Span::new(span.start, span.start), "try ")
                    .spec("6-expressions-and-control-flow"),
            );
        }
    }

    /// `try f()` where nothing catches what it throws: a function that does not throw,
    /// outside a `do { … } catch`.
    fn unhandled_try(&mut self, span: Span) {
        let Some(frame) = self.frames.last() else { return };
        if frame.closure || frame.raises.is_some() || frame.handled > 0 || frame.throws {
            return;
        }
        self.report(
            Diagnostic::error("B0224", span, "errors thrown from here are not handled")
                .label("this function does not throw")
                .help("mark the function `throws`, catch it in `do { … } catch { … }`, or write `try?`")
                .spec("6-expressions-and-control-flow"),
        );
    }

    /// A function's body; `member`: a view's `fn` (it reads the view's members).
    fn fn_body(&mut self, f: &FnDecl, member: bool) -> Ty {
        let signature = self.fn_signature(f);
        let Ty::Fn(fn_ty) = &signature else { unreachable!("a signature is a function") };
        let outer_generics = self.generics.clone();
        if !f.generics.is_empty() {
            self.generics = f.generics.iter().map(|g| g.name.clone()).collect();
        }
        let raises = match f.throws.as_ref().map(|t| t.ty.as_ref()) {
            Some(Some(ty)) => Some(self.resolve_type(ty)),
            Some(None) => Some(Ty::Unknown),
            None => None,
        };
        self.push();
        self.frames.push(Frame {
            ret: fn_ty.ret.clone(),
            is_async: f.is_async,
            closure: false,
            written: HashSet::default(),
            task: false,
            render: false,
            spawn: false,
            cleanup: false,
            throws: false,
            raises,
            handled: 0,
        });
        // A type's member (`T$m`): what an observable `self` it reads; an `init` makes `self`.
        let outer_member =
            std::mem::replace(&mut self.member_fn, f.name.name.contains('$').then(|| f.name.name.clone()));
        let init = f.name.name.ends_with("$$init");
        let outer_init = std::mem::replace(&mut self.in_init, init);
        if init {
            let self_ty = fn_ty.ret.clone();
            self.declare(&Ident { name: "self".into(), span: f.name.span }, self_ty, LocalKind::Let);
            self.frames.last_mut().expect("a frame").ret = Ty::Unit;
        }
        // A generic view's member also sees the view's own bounds (its witnesses are props).
        let mut bounds: Vec<(String, Bound)> =
            if f.generics.is_empty() { self.bounds_in_scope.clone() } else { Vec::new() };
        bounds.extend(fn_ty.bounds.iter().filter_map(|(param, protocol)| match param {
            Ty::Param(_, name) => Some((name.to_string(), Bound::of(protocol))),
            _ => None,
        }));
        let outer_bounds = std::mem::replace(&mut self.bounds_in_scope, bounds);
        let mut shapes: Vec<(String, Ty)> =
            if f.generics.is_empty() { self.shapes_in_scope.clone() } else { Vec::new() };
        shapes.extend(fn_ty.shapes.iter().filter_map(|(param, shape)| match param {
            Ty::Param(_, name) => Some((name.to_string(), shape.clone())),
            _ => None,
        }));
        let outer_shapes = std::mem::replace(&mut self.shapes_in_scope, shapes);
        let mut params = Vec::new();
        for (index, (param, ty)) in f.params.iter().zip(&fn_ty.params).enumerate() {
            if let Some(default) = &param.default {
                self.expr(default, Some(&ty.ty));
            }
            if param.rest {
                self.rest_param(param, ty, index + 1 == f.params.len());
            }
            let local_ty = if ty.rest { Ty::List(Box::new(ty.ty.clone())) } else { ty.ty.clone() };
            params.push(self.declare(&param.name, local_ty, LocalKind::Param));
        }
        self.out.fn_params.insert(f.span, params);
        let ret = if init { Ty::Unit } else { fn_ty.ret.clone() };
        let hook = is_hook_name(&f.name.name).then_some(self.scopes.len() + 1);
        let outer_hook = std::mem::replace(&mut self.hook_body, hook);
        let frame = is_hook_name(&f.name.name).then_some(self.frames.len() - 1);
        let outer_frame = std::mem::replace(&mut self.hook_frame, frame);
        self.block(&f.body, Some(&ret));
        self.hook_body = outer_hook;
        self.hook_frame = outer_frame;
        self.frames.pop();
        self.pop();
        self.bounds_in_scope = outer_bounds;
        self.shapes_in_scope = outer_shapes;
        self.in_init = outer_init;
        self.member_fn = outer_member;
        self.generics = outer_generics;
        let _ = member;
        signature
    }

    /// `equal(old, new) { … }`: `memo`'s comparator. It reads only its two props
    /// records (as passed: a prop with a default may be absent) and module names.
    fn equal_member(&mut self, v: &ViewDecl, e: &EqualDecl) {
        let first = v.members.iter().find_map(|m| if let Member::Equal(e) = m { Some(e.span) } else { None });
        if first != Some(e.span) {
            self.report(
                Diagnostic::error("B0435", e.keyword, "a view has one `equal`")
                    .label("a second comparator")
                    .help("join the conditions with `&&` in one `equal(old, new) { … }`")
                    .spec("71-a-view"),
            );
        }
        if v.kind != ViewKind::View || v.params.as_ref().is_none_or(Vec::is_empty) {
            self.report(
                Diagnostic::error("B0435", e.keyword, "`equal` compares a view's props, and this has none")
                    .label("not a view with props")
                    .help("a screen or layout is not memoised on props; a view without props never re-renders for them")
                    .spec("71-a-view"),
            );
        }
        let fields = self
            .view_params(v)
            .into_iter()
            .map(|p| {
                let ty = match (p.optional, self.resolve(&p.ty)) {
                    (true, Ty::Option(_)) | (false, _) => p.ty,
                    (true, other) => Ty::Option(Box::new(other)),
                };
                let default = if p.optional { FieldDefault::Undefined } else { FieldDefault::None };
                FieldDef { name: p.name.unwrap_or_default(), ty, default }
            })
            .collect();
        let props = self.record_type(fields);
        // Only module names: the comparator runs outside any render.
        let inner = self.scopes.split_off(1);
        self.push();
        self.frames.push(Frame {
            ret: Ty::Bool,
            is_async: false,
            closure: false,
            written: HashSet::default(),
            task: false,
            render: false,
            spawn: false,
            cleanup: false,
            throws: false,
            raises: None,
            handled: 0,
        });
        self.declare(&e.old, props.clone(), LocalKind::Param);
        self.declare(&e.new, props, LocalKind::Param);
        self.block(&e.body, Some(&Ty::Bool));
        self.frames.pop();
        self.pop();
        self.scopes.extend(inner);
    }

    /// `effect { … }`: synchronous work after a render, which writes states as a
    /// handler does; a `defer` at its top is its cleanup.
    fn effect(&mut self, e: &EffectDecl) {
        if let Some(id) = &e.id {
            self.expr(id, None);
        }
        self.push();
        self.frames.push(Frame {
            ret: Ty::Unit,
            is_async: false,
            closure: false,
            written: HashSet::default(),
            task: false,
            render: false,
            spawn: false,
            cleanup: false,
            throws: false,
            raises: None,
            handled: 0,
        });
        for stmt in &e.body.stmts {
            if let StmtKind::Defer(block) = &stmt.kind {
                self.block(block, Some(&Ty::Unit));
                self.frames.last_mut().expect("the effect").cleanup = true;
            } else {
                self.stmt(stmt);
            }
        }
        self.frames.pop();
        self.pop();
    }

    /// `..name: [T]`: a list type, last, without a default.
    fn rest_param(&mut self, param: &Param, ty: &ParamTy, last: bool) {
        let problem = if !ty.rest {
            Some(("a rest parameter's type is a list", "write `[T]`"))
        } else if !last {
            Some(("a rest parameter comes last", "move it to the end"))
        } else if param.default.is_some() {
            Some((
                "a rest parameter has no default",
                "remove the default: it is `[]` when no argument is given",
            ))
        } else {
            None
        };
        if let Some((message, help)) = problem {
            self.report(
                Diagnostic::error("B0207", param.span, message)
                    .label("not a rest parameter")
                    .help(help)
                    .spec("5-values-functions-and-closures"),
            );
        }
    }

    /// A view's type: a function of its props, generic over its type parameters
    /// (`struct ProfileGridList<T: ProfileGridEntry>: View`), whose protocol bounds take a
    /// witness (passed as a prop) and whose shapes take none.
    fn view_type(&mut self, v: &ViewDecl) -> Ty {
        let params = self.view_params(v);
        let outer =
            std::mem::replace(&mut self.generics, v.generics.iter().map(|g| g.name.clone()).collect());
        let bounded = self.bounds(&v.generics, &v.constraints);
        let witnesses: Vec<(String, u32, Bound)> = bounded
            .iter()
            .map(|(index, name, bound)| (witness_param(name, &bound.name()), *index, bound.clone()))
            .collect();
        if !witnesses.is_empty() {
            self.out.witness_params.insert(v.span, witnesses);
        }
        let bounds = bounded
            .into_iter()
            .map(|(index, name, bound)| (Ty::Param(index, name.as_str().into()), bound.name()))
            .collect();
        let shaped = self.shapes(&v.generics, &v.constraints);
        let shapes = shaped
            .iter()
            .map(|(index, shape)| {
                (Ty::Param(*index, v.generics[*index as usize].name.as_str().into()), shape.clone())
            })
            .collect();
        if !shaped.is_empty() {
            self.out.shapes.insert(v.span, shaped);
        }
        self.generics = outer;
        // A menu's actions (`.actions(…)`) or content (a `Menu`'s child) is that node, not a view.
        let node = match v.kind {
            ViewKind::MenuActions => "menuActions",
            ViewKind::MenuContent => "menuContent",
            _ => "view",
        };
        Ty::Fn(Rc::new(FnTy {
            params,
            ret: Ty::View(Some(node)),
            is_async: false,
            generics: v.generics.len() as u32,
            ts: false,
            throws: false,
            bounds,
            shapes,
        }))
    }

    fn view_params(&mut self, v: &ViewDecl) -> Vec<ParamTy> {
        let outer =
            std::mem::replace(&mut self.generics, v.generics.iter().map(|g| g.name.clone()).collect());
        let out = self.view_params_in_scope(v);
        self.generics = outer;
        out
    }

    fn view_params_in_scope(&mut self, v: &ViewDecl) -> Vec<ParamTy> {
        let mut out = Vec::new();
        for p in v.params.iter().flatten() {
            if p.spread {
                out.extend(self.spread_props(p).map(|(_, props)| props).unwrap_or_default());
                continue;
            }
            out.push(ParamTy {
                labelled: false,
                positional: false,
                name: Some(p.name.name.clone()),
                ty: self.resolve_type(&p.ty),
                optional: p.default.is_some(),
                rest: false,
            });
        }
        out
    }

    /// `..Props`: the type, and each of its fields as a prop (one with a default, or a
    /// TS optional one, may be left out). `None` when it has no fields Bloom can read.
    fn spread_props(&mut self, p: &Param) -> Option<(Ty, Vec<ParamTy>)> {
        let ty = self.resolve_type(&p.ty);
        let Ty::Adt(def, targs) = self.resolve(&ty) else { return None };
        if !matches!(self.out.defs[def].kind, DefKind::Struct(_)) {
            return None;
        }
        let props = self.out.defs[def]
            .fields()
            .iter()
            .map(|f| ParamTy {
                labelled: false,
                positional: false,
                name: Some(f.name.clone()),
                ty: substitute(&f.ty, &targs),
                optional: f.default != FieldDefault::None,
                rest: false,
            })
            .collect();
        Some((ty, props))
    }

    fn view_decl(&mut self, index: usize, v: &ViewDecl) {
        self.view = Some(index);
        // A generic view's type parameters, protocol bounds and shapes are in scope in it.
        let outer_generics =
            std::mem::replace(&mut self.generics, v.generics.iter().map(|g| g.name.clone()).collect());
        let bounds: Vec<(String, Bound)> = self
            .bounds(&v.generics, &v.constraints)
            .into_iter()
            .map(|(_, name, bound)| (name, bound))
            .collect();
        let outer_bounds = std::mem::replace(&mut self.bounds_in_scope, bounds);
        let shapes: Vec<(String, Ty)> = self
            .shapes(&v.generics, &v.constraints)
            .into_iter()
            .map(|(index, shape)| (v.generics[index as usize].name.clone(), shape))
            .collect();
        let outer_shapes = std::mem::replace(&mut self.shapes_in_scope, shapes);
        self.view_decl_in_scope(index, v);
        self.generics = outer_generics;
        self.bounds_in_scope = outer_bounds;
        self.shapes_in_scope = outer_shapes;
    }

    fn view_decl_in_scope(&mut self, index: usize, v: &ViewDecl) {
        self.push();
        self.frames.push(Frame {
            ret: Ty::View(None),
            is_async: false,
            closure: false,
            written: HashSet::default(),
            task: false,
            render: true,
            spawn: false,
            cleanup: false,
            throws: false,
            raises: None,
            handled: 0,
        });
        let mut info = ViewInfo::default();
        let mut params = self.view_params(v).into_iter();
        for param in v.params.iter().flatten() {
            if param.spread {
                match self.spread_props(param) {
                    Some((ty, props)) => {
                        let start = info.props.len();
                        for _ in &props {
                            let prop = params.next().expect("a spread prop");
                            let name =
                                Ident { name: prop.name.clone().unwrap_or_default(), span: param.name.span };
                            info.props.push(self.declare(&name, prop.ty, LocalKind::Prop));
                        }
                        if let Some(whole) = &param.whole {
                            let local = self.declare(whole, ty.clone(), LocalKind::Prop);
                            self.out.whole_props.insert(local);
                        }
                        info.spreads.push((ty, start..info.props.len()));
                    }
                    None => {
                        let ty = self.resolve_type(&param.ty);
                        let shown = self.show(&ty);
                        self.report(
                            Diagnostic::error(
                                "B0204",
                                param.span,
                                format!("cannot spread {shown} into props"),
                            )
                            .label("not a struct or an interface Bloom reads")
                            .help("spread a struct, a record type or a TS interface: `..PostProps`")
                            .spec("71-a-view"),
                        );
                    }
                }
                continue;
            }
            let ty = params.next().expect("a prop");
            if let Some(default) = &param.default {
                self.expr(default, Some(&ty.ty));
            }
            if param.rest {
                self.report(
                    Diagnostic::error("B0207", param.span, "a view takes props, not a rest parameter")
                        .label("a prop is passed by name")
                        .help("take a list: `items: [T]`")
                        .spec("5-values-functions-and-closures"),
                );
            }
            // `@Binding var isOn: Bool`: read and written as a `Bool`, `$isOn` the binding.
            let bound = v.surface.as_ref().is_some_and(|body| {
                body.members.iter().any(|m| {
                    m.modifiers.attrs.first().is_some_and(|a| a.name.name == "Binding")
                        && matches!(&m.kind, TypeMemberKind::Stored { name, .. } if name.name == param.name.name)
                })
            });
            let local = match (bound, self.resolve(&ty.ty)) {
                (true, Ty::Binding(inner)) => self.declare(&param.name, *inner, LocalKind::Bound),
                _ => self.declare(&param.name, ty.ty, LocalKind::Prop),
            };
            info.props.push(local);
        }
        for member in &v.members {
            let locals = match member {
                Member::State(state) => {
                    let declared = state.ty.as_ref().map(|t| self.resolve_type(t));
                    let ty = match (&state.attr, &state.value.kind) {
                        (StateAttr::Env, ExprKind::KeyPath { root: None, path }) if path.len() == 1 => {
                            self.environment_key(state, &path[0], declared.clone())
                        }
                        _ => Ty::Unknown,
                    };
                    let ty = match state.attr {
                        _ if ty != Ty::Unknown || self.out.env_keys.contains_key(&state.span) => ty,
                        StateAttr::State | StateAttr::Ref => self.expr(&state.value, declared.as_ref()),
                        // A bloom-data store or an environment key: its value is the store's.
                        _ => {
                            self.boundary(&state.value, None);
                            declared.unwrap_or_else(|| Ty::Foreign("".into()))
                        }
                    };
                    let kind = match state.attr {
                        StateAttr::State => LocalKind::State,
                        StateAttr::Ref => LocalKind::Ref,
                        _ => LocalKind::Hook,
                    };
                    vec![self.declare(&state.name, ty, kind)]
                }
                Member::Let(stmt) => {
                    self.hook_allowed = true;
                    self.was_hook = false;
                    let declared = stmt.ty.as_ref().map(|t| self.resolve_type(t));
                    let ty = self.expr(&stmt.value, declared.as_ref());
                    self.hook_allowed = false;
                    let kind = if self.was_hook { LocalKind::Hook } else { LocalKind::Derived };
                    if self.was_hook {
                        self.out.hook_lets.insert(stmt.span);
                    }
                    if let PatternKind::Bind(name) = &stmt.pattern.kind {
                        self.member_beside_prop(name);
                    }
                    let locals = self.bind_irrefutable(&stmt.pattern, &ty, kind);
                    // `let path = usePathname()`: the member keeps the TS value's claim.
                    if let ([local], PatternKind::Bind(_)) = (locals.as_slice(), &stmt.pattern.kind)
                        && self.ts_claimed(&stmt.value, &ty)
                    {
                        self.ts_claimed_locals.insert(*local);
                        if self.is_claim_only(&stmt.value) {
                            self.out.claim_only.insert(*local);
                        }
                    }
                    locals
                }
                Member::Fn(f) => {
                    let ty = self.fn_signature(f);
                    let local = self.declare(&f.name, ty, LocalKind::Handler);
                    self.fn_body(f, true);
                    vec![local]
                }
                Member::Effect(e) => {
                    self.effect(e);
                    Vec::new()
                }
                Member::Equal(e) => {
                    self.equal_member(v, e);
                    Vec::new()
                }
            };
            info.members.push(locals);
        }
        self.out.views.insert(index, info);
        match v.kind {
            // The tag → action table a chosen row runs (`MenuActionTable`).
            ViewKind::MenuActions => {
                let action = Ty::Fn(Rc::new(FnTy {
                    params: Vec::new(),
                    ret: Ty::Unit,
                    is_async: false,
                    generics: 0,
                    ts: false,
                    throws: false,
                    bounds: Vec::new(),
                    shapes: Vec::new(),
                }));
                self.block(&v.body, Some(&Ty::Map(Box::new(action))));
            }
            // A menu's rows: builder lines, as a container's children.
            ViewKind::MenuContent => {
                self.push();
                self.builder(&v.body.stmts);
                self.pop();
            }
            _ => self.body(&v.body),
        }
        self.frames.pop();
        self.pop();
        self.view = None;
    }

    /// A view's `body { … }`: one view, whose root chain may carry `.task`.
    fn body(&mut self, block: &Block) {
        self.push();
        let mut views = 0;
        for stmt in &block.stmts {
            match &stmt.kind {
                StmtKind::Let(_) => self.stmt(stmt),
                StmtKind::Expr(expr) => {
                    views += 1;
                    if views == 2 {
                        self.report(
                            Diagnostic::error("B0504", expr.span, "a body is one view")
                                .label("a second view in the body")
                                .help("put the views in one container: `VStack { … }` or `Group { … }`")
                                .spec("71-a-view"),
                        );
                    }
                    self.task_allowed = true;
                    self.child(expr);
                    self.task_allowed = false;
                }
                _ => self.builder_line(stmt),
            }
        }
        if views == 0 {
            self.report(
                Diagnostic::error("B0504", block.span, "this body draws nothing")
                    .label("no view here")
                    .help("write the view the body draws: `body { Text(\"…\") }`")
                    .spec("71-a-view"),
            );
        }
        self.pop();
    }

    // ---- imports --------------------------------------------------------

    fn import(&mut self, import: &Import) {
        // `import Bloom`, `import Mention.Posts`: modules by name, resolved by the module graph
        // (crates/lang/src/modules.rs); `Bloom` is the implicit core.
        if matches!(import.kind, ImportKind::Module(_)) {
            return;
        }
        let specifier = match import.source.as_str() {
            "bloom/data" => "@oxy.so/bloom-data",
            "bloom/router" => "@oxy.so/bloom-language/router",
            "bloom/motion" => "@oxy.so/bloom-language",
            other => other,
        };
        if specifier.ends_with(".bloom") {
            // Relative to this file, or through the `paths` map (`@/rows/row.bloom`).
            let path = ts::resolve(&self.path, specifier, self.options)
                .unwrap_or_else(|| self.path.parent().unwrap_or(Path::new(".")).join(specifier));
            self.import_bloom(import, &path);
            return;
        }
        // `import { Row } from "./Row"`: a `.bloom` module when one is there, never both.
        let relative = specifier.starts_with("./") || specifier.starts_with("../");
        if relative && Path::new(specifier).extension().is_none() {
            let with_extension = format!("{specifier}.bloom");
            if self.path.parent().unwrap_or(Path::new(".")).join(&with_extension).is_file() {
                if let Some(ts_path) = ts::resolve(&self.path, specifier, self.options) {
                    self.report(
                        Diagnostic::error("B0610", import.source_span, format!("\"{specifier}\" is both a .bloom module and a TS module"))
                            .label(format!("also `{}`", ts_path.file_name().map_or(String::new(), |n| n.to_string_lossy().into_owned())))
                            .help(format!("remove one of them, or import the one you mean with its extension: \"{with_extension}\""))
                            .spec("10-modules-and-interop"),
                    );
                    return;
                }
                let path = self.path.parent().unwrap_or(Path::new(".")).join(&with_extension);
                self.import_bloom(import, &path);
                return;
            }
            // `./X` with only platform files (`X.native.bloom`, `X.web.bloom`): Metro picks
            // one per platform; the first is checked against.
            let dir = self.path.parent().unwrap_or(Path::new("."));
            if let Some(path) = crate::modules::PLATFORMS
                .iter()
                .map(|p| dir.join(format!("{specifier}.{p}.bloom")))
                .find(|p| p.is_file())
            {
                self.import_bloom(import, &path);
                return;
            }
        }
        if specifier == "js" {
            // `import { encodeURIComponent, Math } from "js"`: JS's globals, named before use.
            // TypeScript types them (lib.es and lib.dom) where they cross.
            if let ImportKind::Named(specs) = &import.kind {
                for spec in specs {
                    let local = spec.local().clone();
                    let value = Ty::Foreign(format!("typeof globalThis.{}", spec.name.name).into());
                    let id = self.declare_unique(&local, value, LocalKind::Import { hook: false });
                    // A JS class is constructed by a call: `Date(x)` is `new Date(x)`.
                    if JS_CLASSES.contains(&spec.name.name.as_str()) {
                        self.out.constructors.insert(id);
                    }
                }
            }
            return;
        }
        let resolved = ts::resolve(&self.path, specifier, self.options);
        let file = resolved.as_deref().and_then(ts::read);
        if let Some(path) = resolved {
            self.out.dependencies.insert(path);
        }
        if self.options.paths.is_empty() && !relative {
            let root = self
                .options
                .root
                .clone()
                .unwrap_or_else(|| self.path.parent().unwrap_or(Path::new(".")).to_path_buf());
            let config = root.join("tsconfig.json");
            if config.is_file() {
                self.out.dependencies.insert(config);
            }
        }
        // An import the compiler wrote (an icon BloomUI names) is the platform's to resolve.
        if file.is_none() && !crate::codable::is_synthetic(import.source_span) {
            self.out.diagnostics.push(
                Diagnostic::warning(
                    "B0602",
                    import.source_span,
                    format!("cannot find TS declarations for \"{}\"", import.source),
                )
                .label("its names are `Foreign`: annotate them before Bloom logic uses them")
                .help("check the path, the `paths` map or that the package is installed")
                .spec("47-the-foreign-boundary"),
            );
        }
        match &import.kind {
            ImportKind::Module(_) => {}
            ImportKind::Namespace(name) => {
                if let Some(file) = &file {
                    self.ts_namespaces.insert(name.name.clone(), file.clone());
                }
                self.declare_unique(
                    name,
                    Ty::Foreign(format!("typeof {}", name.name).into()),
                    LocalKind::Import { hook: false },
                );
            }
            ImportKind::Named(specs) => {
                for spec in specs {
                    let local = spec.local().clone();
                    let mapped = match &file {
                        Some(file) => {
                            let mut mapper = ts::Mapper {
                                defs: &mut self.out.defs,
                                options: self.options,
                                named: &mut self.ts_named,
                                reads: &mut self.out.dependencies,
                            };
                            let mapped = mapper.export(file, &spec.name.name, &local.name, 0);
                            if mapped.is_none()
                                && let Some((path, name)) =
                                    ts::bloom_export(file, &spec.name.name, self.options, 0)
                            {
                                // A TS module that re-exports a `.bloom` module's item.
                                let exported = Ident { name, span: spec.name.span };
                                self.bloom_names(
                                    &path,
                                    &import.source,
                                    import.source_span,
                                    &[(exported, local, spec.span)],
                                );
                                continue;
                            }
                            if mapped.is_none() {
                                let exports: Vec<&str> = file.exports.keys().map(String::as_str).collect();
                                let help = closest(&spec.name.name, exports.iter().copied())
                                    .map(|near| format!("did you mean `{near}`?"));
                                self.report(
                                    Diagnostic::error(
                                        "B0603",
                                        spec.name.span,
                                        format!("\"{}\" has no export `{}`", import.source, spec.name.name),
                                    )
                                    .label("not exported there")
                                    .maybe_help(help)
                                    .spec("10-modules-and-interop"),
                                );
                            }
                            mapped.unwrap_or_default()
                        }
                        None => ts::Mapped {
                            value: Some(Ty::Foreign(format!("typeof {}", local.name).into())),
                            ty: None,
                            component: None,
                        },
                    };
                    if mapped.value.is_none() && mapped.component.is_none() && mapped.ty.is_some() {
                        self.out.type_only_imports.insert(spec.span);
                    }
                    if let Some(ty) = mapped.ty {
                        self.type_names.insert(local.name.clone(), TypeName::Ty(ty));
                        self.out.type_imports.push(local.name.clone());
                    }
                    if spec.type_only {
                        continue;
                    }
                    let hook = is_hook_name(&local.name);
                    if let Some(props) = mapped.component {
                        self.declare_unique(&local, Ty::View(Some("embed")), LocalKind::Component { props });
                    } else if let Some(value) = mapped.value {
                        self.declare_unique(&local, value, LocalKind::Import { hook });
                    }
                }
            }
        }
    }

    fn import_bloom(&mut self, import: &Import, path: &Path) {
        let ImportKind::Named(specs) = &import.kind else {
            self.report(
                Diagnostic::error("B0603", import.span, "a .bloom module is imported by name")
                    .label("`* as` is for TS modules")
                    .help("import the names: `import { Row } from \"./Row.bloom\"`")
                    .spec("10-modules-and-interop"),
            );
            return;
        };
        let names: Vec<(Ident, Ident, Span)> =
            specs.iter().map(|spec| (spec.name.clone(), spec.local().clone(), spec.span)).collect();
        self.bloom_names(path, &import.source, import.source_span, &names);
    }

    /// Declares `names` (exported name, local name, the import spec's span) of
    /// the `.bloom` module at `path`, imported as `specifier`.
    fn bloom_names(&mut self, path: &Path, specifier: &str, at: Span, names: &[(Ident, Ident, Span)]) {
        let Some(module) = signatures(path, specifier, self.options) else {
            self.report(
                Diagnostic::error("B0602", at, format!("cannot read \"{specifier}\""))
                    .label("no such .bloom file")
                    .help("check the path: it is relative to this file, or mapped by `paths`")
                    .spec("10-modules-and-interop"),
            );
            return;
        };
        // Its types are numbered from 0 there: after this module's here.
        let offset = self.out.defs.len();
        self.out.defs.extend(module.defs.iter().map(|d| shift_def(d, offset)));
        self.out.dependencies.extend(module.files.iter().map(|(p, _)| p.clone()));
        for (name, local, spec_span) in names {
            if let Some(def) = module.types.get(&name.name) {
                self.type_names.insert(local.name.clone(), TypeName::Def(def + offset));
                self.out.type_imports.push(local.name.clone());
                self.out.type_only_imports.insert(*spec_span);
                continue;
            }
            if let Some((ty, n)) = module.aliases.get(&name.name) {
                self.type_names.insert(local.name.clone(), TypeName::Alias(shift(ty, offset), *n));
                self.out.type_imports.push(local.name.clone());
                self.out.type_only_imports.insert(*spec_span);
                continue;
            }
            match module.values.get(&name.name) {
                Some((ty, kind)) => {
                    self.declare_unique(local, shift(ty, offset), kind.clone());
                }
                None => {
                    self.report(
                        Diagnostic::error(
                            "B0603",
                            name.span,
                            format!("\"{specifier}\" has no `pub` item `{}`", name.name),
                        )
                        .label("not exported there")
                        .help("mark it `pub` in its module")
                        .spec("10-modules-and-interop"),
                    );
                }
            }
        }
    }

    /// Another module's `pub` types and signatures, for an import.
    fn declare_signatures(&mut self, file: &File, specifier: &str) {
        // Its imports name the types its signatures use: `.bloom` ones too (their
        // signatures are cached; a cycle reads as an unknown type).
        for import in &file.imports {
            self.import(import);
        }
        let first = self.out.defs.len();
        let no_generics: Vec<Ident> = Vec::new();
        for item in &file.items {
            let (name, generics, kind) = match &item.kind {
                ItemKind::Struct(s) => (&s.name, &s.generics, DefKind::Struct(Vec::new())),
                ItemKind::Enum(e) => (&e.name, &e.generics, DefKind::Enum(Vec::new())),
                ItemKind::Class(c) => (&c.name, &c.generics, DefKind::Struct(Vec::new())),
                ItemKind::Protocol(p) => (&p.name, &no_generics, DefKind::Protocol(Vec::new())),
                _ => continue,
            };
            let class = match &item.kind {
                ItemKind::Class(c) => Some(ClassDef { observable: c.observable, ..ClassDef::default() }),
                _ => None,
            };
            let def = self.out.defs.len();
            self.out.defs.push(Def {
                name: name.name.clone(),
                generics: generics.iter().map(|g| g.name.clone()).collect(),
                kind,
                origin: Origin::Bloom { specifier: specifier.to_string() },
                class,
                tagged: None,
            });
            self.type_names.insert(name.name.clone(), TypeName::Def(def));
        }
        for item in &file.items {
            match &item.kind {
                ItemKind::Struct(s) => {
                    self.struct_fields(s);
                    let Some(TypeName::Def(def)) = self.type_names.get(&s.name.name).cloned() else {
                        continue;
                    };
                    if let DefKind::Struct(fields) = &mut self.out.defs[def].kind {
                        for (field, decl) in fields.iter_mut().zip(&s.fields) {
                            field.default = match &decl.default {
                                Some(expr) => {
                                    literal_text(expr).map_or(FieldDefault::None, FieldDefault::Literal)
                                }
                                None => FieldDefault::None,
                            };
                        }
                    }
                }
                ItemKind::Enum(e) => self.enum_variants(e),
                ItemKind::Class(c) => self.class_fields(c),
                ItemKind::Alias(a) => {
                    let ty = self.resolve_type(&a.ty);
                    self.type_names.insert(a.name.name.clone(), TypeName::Alias(ty, a.generics.len()));
                }
                _ => {}
            }
        }
        for item in &file.items {
            if let ItemKind::Protocol(p) = &item.kind {
                self.protocol_requirements(p);
            }
        }
        let _ = first;
        for item in &file.items {
            if !item.visibility.exported(self.options.modules) {
                continue;
            }
            match &item.kind {
                ItemKind::Fn(f) => {
                    let ty = self.fn_signature(f);
                    self.declare(&f.name, ty, LocalKind::ModuleFn);
                }
                ItemKind::View(v) if v.kind == ViewKind::View || v.kind.is_menu() => {
                    let ty = self.view_type(v);
                    self.declare(&v.name, ty, LocalKind::View);
                }
                ItemKind::Const(c) => {
                    let ty = match &c.ty {
                        Some(t) => self.resolve_type(t),
                        None => self.const_value(&c.value, None),
                    };
                    self.declare(&c.name, ty, LocalKind::ModuleConst);
                }
                _ => {}
            }
        }
    }

    // ---- statements -----------------------------------------------------

    /// A block's value: its last line when that is an expression.
    fn block(&mut self, block: &Block, expected: Option<&Ty>) -> Ty {
        self.push();
        let ty = self.stmts(&block.stmts, expected, block.span);
        self.pop();
        ty
    }

    fn stmts(&mut self, stmts: &[Stmt], expected: Option<&Ty>, span: Span) -> Ty {
        let discard = expected.is_some_and(|e| self.resolve(e) == Ty::Unit);
        let mut ty = Ty::Unit;
        for (index, stmt) in stmts.iter().enumerate() {
            let last = index + 1 == stmts.len();
            match &stmt.kind {
                StmtKind::Expr(expr) if last && !discard => {
                    // A hook function's result may be a hook's (`fn useX() -> T { useY() }`).
                    self.hook_allowed = self.hook_body == Some(self.scopes.len());
                    ty = self.expr(expr, expected);
                    self.hook_allowed = false;
                }
                StmtKind::Return(_) => {
                    self.stmt(stmt);
                    ty = Ty::Never;
                }
                _ => {
                    self.stmt(stmt);
                    // `if x == none { return … }`: `x` is present in the rest of the block.
                    if let StmtKind::Expr(e) = &stmt.kind
                        && let ExprKind::If(guard) = &e.kind
                        && guard.otherwise.is_none()
                        && guard.then.stmts.last().is_some_and(|s| matches!(s.kind, StmtKind::Return(_)))
                        && let Cond::Expr(test) = &guard.cond
                    {
                        self.narrow(test, BinaryOp::Eq, BinaryOp::Or);
                    }
                    if last {
                        ty = Ty::Unit;
                    }
                }
            }
        }
        if let Some(expected) = expected
            && !discard
            && !matches!(stmts.last().map(|s| &s.kind), Some(StmtKind::Expr(_) | StmtKind::Return(_)))
            && !stmts.last().is_some_and(always_exits)
        {
            let expected = expected.clone();
            if !self.coerce(&Ty::Unit, &expected) {
                let at = stmts.last().map_or(span, |s| s.span);
                self.report(
                    Diagnostic::error(
                        "B0201",
                        at,
                        format!("this block gives no value; expected {}", self.show(&expected)),
                    )
                    .label("the last line is not an expression")
                    .help("end the block with the value (the last expression is the result)")
                    .spec("5-values-functions-and-closures"),
                );
            }
            return expected;
        }
        if discard { Ty::Unit } else { ty }
    }

    fn stmt(&mut self, stmt: &Stmt) {
        match &stmt.kind {
            StmtKind::Let(l) if l.is_async => self.async_let(l),
            StmtKind::Let(l) => {
                let declared = l.ty.as_ref().map(|t| self.resolve_type(t));
                // A hook function's top-level `let` may call a hook, as a view member does.
                let top = self.hook_body == Some(self.scopes.len());
                self.hook_allowed = top;
                let outer_hook = std::mem::take(&mut self.was_hook);
                let ty = self.expr(&l.value, declared.as_ref());
                self.hook_allowed = false;
                // Drawn on every call, never in the hook function's memo cache.
                if top && self.was_hook {
                    self.out.hook_lets.insert(l.span);
                }
                self.was_hook |= outer_hook;
                self.binding_stmt = true;
                let locals = self.bind_irrefutable(&l.pattern, &ty, LocalKind::Let);
                self.binding_stmt = false;
                if let ([local], PatternKind::Bind(_)) = (locals.as_slice(), &l.pattern.kind)
                    && self.ts_claimed(&l.value, &ty)
                {
                    self.ts_claimed_locals.insert(*local);
                    if self.is_claim_only(&l.value) {
                        self.out.claim_only.insert(*local);
                    }
                }
            }
            StmtKind::Var(v) => {
                let declared = v.ty.as_ref().map(|t| self.resolve_type(t));
                let ty = self.expr(&v.value, declared.as_ref());
                self.binding_stmt = true;
                self.declare(&v.name, ty, LocalKind::Var);
                self.binding_stmt = false;
                let frame = self.frames.len() - 1;
                if !self.frames[frame].render && self.hook_frame != Some(frame) {
                    self.capturable.insert(v.name.span);
                }
            }
            StmtKind::Assign(a) => self.assign(a),
            StmtKind::Return(_) if self.frames.last().is_some_and(|f| f.cleanup) => {
                self.report(
                    Diagnostic::error("B0434", stmt.span, "an effect returns after its cleanup is set")
                        .label("a `defer` above set the cleanup")
                        .help("return before the `defer`, or put the rest in an `if`")
                        .spec("8-effects-tasks-and-concurrency"),
                );
            }
            StmtKind::Return(value) => {
                let ret = self.frames.last().expect("a frame").ret.clone();
                match value {
                    Some(value) => {
                        self.expr(value, Some(&ret));
                    }
                    None => {
                        if !self.coerce(&Ty::Unit, &ret) {
                            self.report(
                                Diagnostic::error(
                                    "B0201",
                                    stmt.span,
                                    format!(
                                        "`return` needs a value: this function returns {}",
                                        self.show(&ret)
                                    ),
                                )
                                .label("no value")
                                .spec("5-values-functions-and-closures"),
                            );
                        }
                    }
                }
            }
            StmtKind::While(w) => {
                self.expr(&w.cond, Some(&Ty::Bool));
                self.breakables
                    .push((self.frames.len(), Breakable::Loop(w.label.as_ref().map(|l| l.name.clone()))));
                self.block(&w.body, Some(&Ty::Unit));
                self.breakables.pop();
            }
            StmtKind::For(f) => {
                let elem = self.iterable(&f.iter);
                self.push();
                self.bind_irrefutable(&f.pattern, &elem, LocalKind::Let);
                self.breakables
                    .push((self.frames.len(), Breakable::Loop(f.label.as_ref().map(|l| l.name.clone()))));
                self.stmts(&f.body.stmts, Some(&Ty::Unit), f.body.span);
                self.breakables.pop();
                self.pop();
            }
            StmtKind::Break(label) | StmtKind::Continue(label) => {
                let is_break = matches!(stmt.kind, StmtKind::Break(_));
                self.leave(stmt.span, label.as_ref(), is_break);
            }
            StmtKind::Defer(block) => {
                self.block(block, Some(&Ty::Unit));
            }
            // The else block first, without the names the condition binds; they are in
            // scope for the statements after the guard.
            StmtKind::Guard(g) => {
                self.block(&g.otherwise, Some(&Ty::Unit));
                if !g.otherwise.stmts.last().is_some_and(exits) {
                    self.report(
                        Diagnostic::error("B0110", g.otherwise.span, "a `guard`'s `else` must leave")
                            .label("this block falls through")
                            .help("end it with `return`, `throw`, `break` or `continue`")
                            .spec("6-expressions-and-control-flow"),
                    );
                }
                self.cond(&g.cond);
            }
            StmtKind::Throw(value) => {
                // `throw e` in a `func … throws(E)`: `e` is an `E`.
                let raises = self.frames.last().and_then(|f| f.raises.clone()).filter(|t| *t != Ty::Unknown);
                let handled = self.frames.last().is_some_and(|f| f.handled > 0);
                match raises {
                    Some(ty) if !handled => {
                        self.expr(value, Some(&ty));
                    }
                    _ => {
                        self.expr(value, None);
                    }
                }
            }
            StmtKind::Do(d) => {
                let catches = !d.catches.is_empty();
                if catches {
                    self.frames.last_mut().expect("a frame").handled += 1;
                }
                self.block(&d.body, Some(&Ty::Unit));
                if catches {
                    self.frames.last_mut().expect("a frame").handled -= 1;
                }
                for catch in &d.catches {
                    self.push();
                    let ty = catch.ty.as_ref().map_or(Ty::JsError, |t| self.resolve_type(t));
                    // `catch let e as HTTPError`: a type that casts is tested (R6).
                    if catch.ty.is_some()
                        && catch.pattern.is_none()
                        && let Some((func, _)) = self.cast_fn(&ty)
                    {
                        self.out.catch_casts.insert(catch.span, func);
                    }
                    match (&catch.pattern, &catch.name) {
                        (Some(pattern), _) => {
                            let mut locals = Vec::new();
                            self.bind(pattern, &ty, &LocalKind::Let, &mut locals);
                        }
                        (None, Some(name)) => {
                            self.declare(name, ty, LocalKind::Let);
                        }
                        // `catch { … }`: the error is `error`.
                        (None, None) => {
                            let name = Ident { name: "error".into(), span: catch.keyword };
                            self.declare(&name, ty, LocalKind::Let);
                        }
                    }
                    self.stmts(&catch.body.stmts, Some(&Ty::Unit), catch.body.span);
                    self.pop();
                }
            }
            StmtKind::Expr(expr) => {
                let ty = self.expr(expr, None);
                // A node on a line of its own outside a builder (a closure that is not a
                // builder, a function's body): built, then dropped, so nothing draws it.
                if matches!(self.resolve(&ty), Ty::View(_)) {
                    self.report(
                        Diagnostic::error("B0506", expr.span, "this node is built and never drawn")
                            .label("a line of a closure or function that is not a builder")
                            .help(
                                "return it (the last line is the value), or pass it where a view is \
                                 drawn: a node's or view's trailing builder, or a `View` prop",
                            )
                            .spec("72-builders-modifiers-and-tokens"),
                    );
                }
                if matches!(self.resolve(&ty), Ty::Async(_) | Ty::Promise(_))
                    && !self.frames.last().is_some_and(|f| f.spawn)
                {
                    self.report(
                        Diagnostic::error(
                            "B0430",
                            expr.span,
                            "this async call is neither awaited nor started as a task",
                        )
                        .label("its result (and any failure) would be dropped")
                        .help("write `await` before it, or start it on its own: `task { await … }`")
                        .spec("8-effects-tasks-and-concurrency"),
                    );
                }
            }
        }
    }

    /// The element type of what `for … in` walks.
    fn iterable(&mut self, expr: &Expr) -> Ty {
        let ty = self.expr(expr, None);
        match self.resolve(&ty) {
            Ty::List(elem) => *elem,
            Ty::Map(value) => Ty::Tuple(vec![Ty::Str, *value]),
            Ty::JsMap(key, value) => Ty::Tuple(vec![*key, *value]),
            Ty::Set(elem) => *elem,
            Ty::Unknown => Ty::Unknown,
            // A TS iterable: its items are TS's too.
            Ty::Foreign(text) => foreign_of(&text, |t| format!("{t}[number]")),
            Ty::Var(_) => {
                let elem = self.fresh();
                self.unify(&ty, &Ty::List(Box::new(elem.clone())));
                elem
            }
            other => {
                self.report(
                    Diagnostic::error(
                        "B0201",
                        expr.span,
                        format!("`for … in` walks a list, not {}", self.show(&other)),
                    )
                    .label("not a list")
                    .spec("6-expressions-and-control-flow"),
                );
                Ty::Unknown
            }
        }
    }

    /// 2.0's places (`true` when `a` is one): `isOn = v` on a `@Binding`, a field of a
    /// class (written in place), and an element of a list (`posts[i].likes += 1`), rebuilt
    /// with value semantics.
    fn assign_place(&mut self, a: &AssignStmt) -> bool {
        enum Seg<'e> {
            Field(&'e Ident),
            Index(&'e Expr),
        }
        let mut segs = Vec::new();
        let mut root = &a.target;
        loop {
            match &root.kind {
                ExprKind::Field(inner, name) => {
                    segs.push(Seg::Field(name));
                    root = inner;
                }
                ExprKind::Index(inner, index) => {
                    segs.push(Seg::Index(index));
                    root = inner;
                }
                _ => break,
            }
        }
        segs.reverse();
        let ExprKind::Name(name) = &root.kind else { return false };
        let Some(local) = self.lookup(name) else { return false };
        let info = self.out.locals[local].clone();
        let class = match self.resolve(&info.ty) {
            Ty::Adt(def, _) => self.out.defs[def].class.clone().map(|c| (def, c)),
            _ => None,
        };
        let indexed = segs.iter().any(|s| matches!(s, Seg::Index(_)));
        let bound = info.kind == LocalKind::Bound && segs.is_empty();
        let model = class.is_some() && !segs.is_empty();
        if !bound && !model && !indexed {
            return false;
        }
        // An element of a TS value (`patch[key] = "show"`, `patch` a TS `Partial<Record<K, V>>`
        // Bloom does not map): TS's own object, written in place as TS writes it; tsc checks it.
        if indexed && matches!(self.resolve(&info.ty), Ty::Foreign(_)) && info.kind != LocalKind::State {
            if info.kind == LocalKind::Var && info.frame != self.frames.len() - 1 {
                self.var_captured(&info, a.target.span);
            }
            self.expr(&a.target, None);
            self.boundary(&a.value, None);
            self.out.assigns.insert(a.span, AssignRes::Foreign);
            return true;
        }
        self.out.assign_targets.insert(root.id);
        self.out.names.insert(root.id, NameRes::Local(local));
        if !bound && !model && info.kind != LocalKind::Var {
            self.report(
                Diagnostic::error(
                    "B0403",
                    a.target.span,
                    format!("an element of `{name}` is assigned only in a `var`"),
                )
                .label("not a `var`")
                .with_label(info.span, "declared here")
                .help(format!("copy it first: `var next = {name}`, then assign into `next`"))
                .spec("43-soundness-rules"),
            );
        }
        if info.kind == LocalKind::Var && info.frame != self.frames.len() - 1 {
            self.var_captured(&info, a.target.span);
        }
        // The place's type, segment by segment.
        let mut ty = info.ty.clone();
        for (index, seg) in segs.iter().enumerate() {
            ty = match (seg, self.resolve(&ty)) {
                (Seg::Field(field), Ty::Adt(def, args))
                    if matches!(self.out.defs[def].kind, DefKind::Struct(_)) =>
                {
                    match self.out.defs[def].fields().iter().find(|f| f.name == field.name) {
                        Some(f) => {
                            let found = substitute(&f.ty, &args);
                            if index == 0
                                && let Some((class_def, class)) = &class
                            {
                                self.model_write(*class_def, class, field, name == "self");
                            }
                            found
                        }
                        None => {
                            self.unknown_field(field, &Ty::Adt(def, args));
                            Ty::Unknown
                        }
                    }
                }
                (Seg::Index(i), Ty::List(element)) => {
                    self.expr(i, Some(&Ty::Int));
                    *element
                }
                (Seg::Index(i), Ty::Map(value)) => {
                    self.expr(i, Some(&Ty::Str));
                    self.out.map_writes.insert(i.id);
                    *value
                }
                (_, Ty::Unknown) => Ty::Unknown,
                (_, other) => {
                    let shown = self.show(&other);
                    self.report(
                        Diagnostic::error(
                            "B0205",
                            a.target.span,
                            format!("{shown} has no place to assign here"),
                        )
                        .label("not a struct's field, nor a list's element")
                        .spec("43-soundness-rules"),
                    );
                    Ty::Unknown
                }
            };
        }
        match a.op {
            AssignOp::Set => {
                self.expr(&a.value, Some(&ty));
            }
            op => {
                let value = self.expr(&a.value, Some(&ty));
                let numeric = matches!(self.resolve(&ty), Ty::Int | Ty::Float | Ty::Unknown);
                let text = op == AssignOp::Add && matches!(self.resolve(&ty), Ty::Str);
                if !numeric && !text {
                    self.report(
                        Diagnostic::error(
                            "B0201",
                            a.span,
                            format!("`{}` needs a number, found {}", op.text(), self.show(&value)),
                        )
                        .label("not a number")
                        .spec("61-precedence-high-to-low"),
                    );
                }
            }
        }
        let res = if bound {
            AssignRes::Bound { local }
        } else {
            let observable = class.as_ref().map(|(_, c)| c.observable);
            let raw = !model || self.in_init || observable == Some(false);
            AssignRes::Place { local, model: model.then_some(observable.unwrap_or(false)), raw }
        };
        self.out.assigns.insert(a.span, res);
        true
    }

    /// A write to a class's field: a `let` only in its `init`, a `private(set)` only in
    /// the class's own members.
    fn model_write(&mut self, def: DefId, class: &ClassDef, field: &Ident, through_self: bool) {
        let owner = &self.out.defs[def].name;
        let inside = self.member_fn.as_ref().is_some_and(|f| f.split('$').next() == Some(owner.as_str()));
        if class.constants.contains(&field.name) && !(self.in_init && through_self) {
            self.report(
                Diagnostic::error(
                    "B0403",
                    field.span,
                    format!("cannot assign to `{}`: it is a `let`", field.name),
                )
                .label("set once, in `init`")
                .help(format!("declare it `var {}`", field.name))
                .spec("49-classes-and-observable-models"),
            );
        } else if class.sealed.contains(&field.name) && !inside {
            self.report(
                Diagnostic::error(
                    "B0404",
                    field.span,
                    format!("`{}` is assigned only inside `{owner}`", field.name),
                )
                .label("`private(set)` (or `private`)")
                .help(format!("call a method of `{owner}` that changes it"))
                .spec("49-classes-and-observable-models"),
            );
        }
    }

    fn assign(&mut self, a: &AssignStmt) {
        if self.assign_place(a) {
            return;
        }
        let mut fields = Vec::new();
        let mut root = &a.target;
        while let ExprKind::Field(inner, name) = &root.kind {
            fields.push(name.name.clone());
            root = inner;
        }
        fields.reverse();
        let ExprKind::Name(name) = &root.kind else { return };
        self.out.assign_targets.insert(root.id);
        let Some(local) = self.lookup(name) else {
            self.expr(&a.target, None);
            self.expr(&a.value, None);
            return;
        };
        let info = self.out.locals[local].clone();
        // A field of a TS value (an expo-video player, a DOM node): TS's own object.
        let mut through = info.ty.clone();
        let mut foreign = false;
        for field in &fields {
            match self.resolve(&through) {
                Ty::Foreign(_) => {
                    foreign = true;
                    break;
                }
                Ty::Adt(def, args) => match self.out.defs[def].fields().iter().find(|f| f.name == *field) {
                    Some(f) => through = substitute(&f.ty, &args),
                    None => break,
                },
                _ => break,
            }
        }
        if foreign && info.kind != LocalKind::State {
            if info.kind == LocalKind::Var && info.frame != self.frames.len() - 1 {
                self.var_captured(&info, a.target.span);
            }
            self.expr(&a.target, None);
            self.boundary(&a.value, None);
            self.out.assigns.insert(a.span, AssignRes::Foreign);
            return;
        }
        let mutable = matches!(info.kind, LocalKind::State | LocalKind::Var | LocalKind::Ref);
        if !mutable {
            let help = match info.kind {
                LocalKind::Let | LocalKind::Derived => format!(
                    "declare it with `var {name} = …` (in a function) or make it `@state {name} = …` (in a view)"
                ),
                LocalKind::Prop => {
                    "a prop is its parent's: take a binding (`Binding<T>`) or a callback to change it"
                        .to_string()
                }
                _ => "only a `@state` or a `var` can be assigned".to_string(),
            };
            self.report(
                Diagnostic::error(
                    "B0403",
                    a.target.span,
                    format!("cannot assign to `{name}`: it is immutable"),
                )
                .label("immutable")
                .with_label(info.span, "declared here")
                .help(help)
                .spec("43-soundness-rules"),
            );
        }
        if info.kind == LocalKind::Var && info.frame != self.frames.len() - 1 {
            self.var_captured(&info, a.target.span);
        }
        // The place's type, field by field.
        let place_ty = {
            let mut ty = info.ty.clone();
            for field in &fields {
                ty = match self.resolve(&ty) {
                    Ty::Adt(def, args) => match self.out.defs[def].fields().iter().find(|f| f.name == *field)
                    {
                        Some(f) => substitute(&f.ty, &args),
                        None => {
                            self.expr(&a.target, None);
                            Ty::Unknown
                        }
                    },
                    _ => {
                        self.expr(&a.target, None);
                        Ty::Unknown
                    }
                };
            }
            ty
        };
        if info.kind == LocalKind::Ref && self.frames.last().is_some_and(|f| f.render) {
            self.ref_in_render(name, a.target.span);
        }
        if info.kind == LocalKind::State && self.frames.last().is_some_and(|f| f.render) {
            self.report(
                Diagnostic::error(
                    "B0401",
                    a.target.span,
                    format!("`{name}` is written while the view draws"),
                )
                .label("a state changes in an event, not in the body or a derived value")
                .help("write it in a handler (`fn`, `.onPress { … }`) or a `.task { … }`")
                .spec("73-reactivity-compile-time"),
            );
        }
        let reads_self = reads_name(&a.value, name);
        match a.op {
            AssignOp::Set => {
                self.expr(&a.value, Some(&place_ty));
            }
            op => {
                let value = self.expr(&a.value, Some(&place_ty));
                let numeric = matches!(self.resolve(&place_ty), Ty::Int | Ty::Float | Ty::Unknown);
                let text = op == AssignOp::Add && matches!(self.resolve(&place_ty), Ty::Str);
                if !numeric && !text {
                    self.report(
                        Diagnostic::error(
                            "B0201",
                            a.span,
                            format!("`{}` needs a number, found {}", op.text(), self.show(&value)),
                        )
                        .label("not a number")
                        .spec("61-precedence-high-to-low"),
                    );
                }
            }
        }
        let functional = reads_self || a.op != AssignOp::Set || !fields.is_empty();
        let res = if info.kind == LocalKind::State {
            self.frames.last_mut().expect("a frame").written.insert(local);
            AssignRes::State { local, fields, functional }
        } else {
            AssignRes::Var { local, fields }
        };
        self.out.assigns.insert(a.span, res);
    }

    /// A ref is read and written in handlers, effects and tasks; while the view draws
    /// it would not be what the next render sees.
    fn ref_in_render(&mut self, name: &str, span: Span) {
        self.report(
            Diagnostic::error("B0411", span, format!("`{name}` is a `@ref`, used while the view draws"))
                .label("a ref changes without a render, so the body would not follow it")
                .help("read or write it in a handler, an `effect` or a `.task`; make it `@state` to draw it; pass it to `.ref(x)` as is")
                .spec("73-reactivity-compile-time"),
        );
    }

    fn var_captured(&mut self, info: &Local, span: Span) {
        // A function's own `var`: its closures capture the binding, as Swift's do (JS's `let`).
        if self.capturable.contains(&info.span) {
            return;
        }
        self.report(
            Diagnostic::error(
                "B0402",
                span,
                format!("`{}` is a `var`, and a closure cannot capture it", info.name),
            )
            .label("captured here")
            .with_label(info.span, "declared here")
            .help("bind its value to a `let` before the closure, or make it `@state` (a function's own `var` may be captured; a view's render and a hook function's may not)")
            .spec("43-soundness-rules"),
        );
    }

    // ---- builders -------------------------------------------------------

    /// A builder's lines (spec 7.2): views, `if`, `match`, `for` and `let`.
    fn builder(&mut self, stmts: &[Stmt]) {
        self.push();
        for stmt in stmts {
            self.builder_line(stmt);
        }
        self.pop();
    }

    fn builder_line(&mut self, stmt: &Stmt) {
        match &stmt.kind {
            StmtKind::Let(_) => self.stmt(stmt),
            StmtKind::Expr(expr) => self.child(expr),
            StmtKind::For(f) => {
                let elem = self.iterable(&f.iter);
                self.push();
                self.bind_irrefutable(&f.pattern, &elem, LocalKind::Let);
                self.builder(&f.body.stmts);
                self.pop();
            }
            _ => self.report(
                Diagnostic::error("B0504", stmt.span, "a builder line is a view")
                    .label("not a view, `if`, `for`, `match` or `let`")
                    .help("do this in a handler (`fn`, `.onPress { … }`); a builder only lists children")
                    .spec("72-builders-modifiers-and-tokens"),
            ),
        }
    }

    /// One child: a view, an optional view, a list of views, or a builder `if`/`match`.
    fn child(&mut self, expr: &Expr) {
        match &expr.kind {
            ExprKind::If(if_expr) => {
                self.record(expr, Ty::View(None));
                self.push();
                self.cond(&if_expr.cond);
                self.builder(&if_expr.then.stmts);
                self.pop();
                match if_expr.otherwise.as_deref() {
                    Some(Else::If(next)) => self.child(next),
                    Some(Else::Block(block)) => self.builder(&block.stmts),
                    None => {}
                }
            }
            ExprKind::Match(m) => {
                self.record(expr, Ty::View(None));
                self.match_arms(m, expr.span, &mut |checker, body| match body {
                    ArmBody::Expr(e) => {
                        checker.child(e);
                        Ty::View(None)
                    }
                    ArmBody::Block(b) => {
                        checker.builder(&b.stmts);
                        Ty::View(None)
                    }
                });
            }
            _ => {
                // A child may be absent (`on ? Icon(i) : none`): nothing is drawn, as TS's `Child` allows.
                let optional = Ty::Option(Box::new(Ty::View(None)));
                self.child_slots.insert(expr.id);
                // `[rowView, c ? sheet : none]`: a list literal's items are children too.
                let list = Ty::List(Box::new(optional.clone()));
                let want = if matches!(expr.kind, ExprKind::List(_)) { list } else { optional };
                self.expr(expr, Some(&want));
            }
        }
    }

    fn record(&mut self, expr: &Expr, ty: Ty) {
        self.out.types.insert(expr.id, ty.clone());
        self.span_type((expr.span, ty));
    }

    // ---- patterns -------------------------------------------------------

    fn bind_irrefutable(&mut self, pattern: &Pattern, ty: &Ty, kind: LocalKind) -> Vec<LocalId> {
        let mut locals = Vec::new();
        self.bind(pattern, ty, &kind, &mut locals);
        let row = vec![self.to_pat(pattern)];
        let ty = self.zonk(ty);
        if !matches!(pattern.kind, PatternKind::Bind(_) | PatternKind::Wildcard)
            && !matches!(ty, Ty::Unknown | Ty::Foreign(_))
        {
            let missing = exhaust::missing(&[row], &ty, &self.out.defs);
            if !missing.is_empty() {
                self.report(
                    Diagnostic::error("B0304", pattern.span, "this pattern may not match")
                        .label(format!("it does not match {}", missing.join(", ")))
                        .help("use `if let` or `match` for a pattern that can fail")
                        .spec("45-enums-option-and-result"),
                );
            }
        }
        locals
    }

    /// Declares the names `pattern` binds, checking it against `ty`.
    fn bind(&mut self, pattern: &Pattern, ty: &Ty, kind: &LocalKind, locals: &mut Vec<LocalId>) {
        self.out.pattern_tys.insert(pattern.span, ty.clone());
        let resolved = self.resolve(ty);
        match &pattern.kind {
            PatternKind::Wildcard => {}
            PatternKind::Bind(name) => {
                let local = self.declare(name, ty.clone(), kind.clone());
                self.out.pattern_locals.insert(name.span, local);
                locals.push(local);
            }
            PatternKind::Literal(expr) => {
                self.expr(expr, Some(ty));
            }
            PatternKind::None => {
                if !matches!(resolved, Ty::Option(_) | Ty::Unknown | Ty::Var(_)) {
                    self.pattern_mismatch(pattern, "`none`", &resolved);
                }
            }
            PatternKind::Tuple(items) => {
                let tys = match &resolved {
                    Ty::Tuple(tys) if tys.len() == items.len() => tys.clone(),
                    Ty::Unknown | Ty::Foreign(_) => vec![resolved.clone(); items.len()],
                    Ty::Var(_) => {
                        let tys: Vec<Ty> = items.iter().map(|_| self.fresh()).collect();
                        self.unify(&resolved, &Ty::Tuple(tys.clone()));
                        tys
                    }
                    _ => {
                        self.pattern_mismatch(pattern, &format!("a tuple of {}", items.len()), &resolved);
                        vec![Ty::Unknown; items.len()]
                    }
                };
                for (item, ty) in items.iter().zip(tys) {
                    self.bind(item, &ty, kind, locals);
                }
            }
            PatternKind::Record(fields) => {
                for (name, sub) in fields {
                    let field_ty = match &resolved {
                        Ty::Adt(def, args) => {
                            match self.out.defs[*def].fields().iter().find(|f| f.name == name.name) {
                                Some(f) => substitute(&f.ty, args),
                                None => {
                                    self.unknown_field(name, &resolved);
                                    Ty::Unknown
                                }
                            }
                        }
                        Ty::Foreign(text) => foreign_of(text, |t| format!("{t}[\"{}\"]", name.name)),
                        Ty::Unknown => Ty::Unknown,
                        _ => {
                            self.pattern_mismatch(pattern, "a struct", &resolved);
                            Ty::Unknown
                        }
                    };
                    match sub {
                        Some(sub) => self.bind(sub, &field_ty, kind, locals),
                        None => {
                            let local = self.declare(name, field_ty, kind.clone());
                            self.out.pattern_locals.insert(name.span, local);
                            locals.push(local);
                        }
                    }
                }
            }
            PatternKind::Or(alternatives) => {
                for alternative in alternatives {
                    let before = locals.len();
                    self.bind(alternative, ty, kind, locals);
                    if locals.len() > before {
                        self.report(
                            Diagnostic::error(
                                "B0303",
                                alternative.span,
                                "the alternatives of `|` bind no names in phase 0",
                            )
                            .label("a name bound here")
                            .help("write one `case` per alternative that binds")
                            .spec("45-enums-option-and-result"),
                        );
                    }
                }
            }
            PatternKind::Case { ty: qualifier, name, args } => {
                let payload = self.case_payload(pattern, qualifier.as_ref(), name, &resolved);
                let Some(payload) = payload else {
                    for arg in args.iter().flatten() {
                        self.bind(arg, &Ty::Unknown, kind, locals);
                    }
                    return;
                };
                if let Some(args) = args {
                    if args.len() != payload.len() {
                        self.report(
                            Diagnostic::error(
                                "B0303",
                                pattern.span,
                                format!(
                                    "`.{}` carries {} value(s), not {}",
                                    name.name,
                                    payload.len(),
                                    args.len()
                                ),
                            )
                            .label("wrong number of patterns")
                            .help(if payload.is_empty() {
                                format!("write `.{}` without parentheses", name.name)
                            } else {
                                format!("write {} pattern(s), `_` for one you skip", payload.len())
                            })
                            .spec("45-enums-option-and-result"),
                        );
                    }
                    for (arg, ty) in args.iter().zip(payload.iter().chain(std::iter::repeat(&Ty::Unknown))) {
                        self.bind(arg, ty, kind, locals);
                    }
                }
            }
        }
    }

    /// The payload types of the case `name` of `ty`, or `None` after reporting.
    fn case_payload(
        &mut self,
        pattern: &Pattern,
        qualifier: Option<&Ident>,
        name: &Ident,
        ty: &Ty,
    ) -> Option<Vec<Ty>> {
        match ty {
            Ty::Option(inner) => match name.name.as_str() {
                "some" => Some(vec![(**inner).clone()]),
                "none" => Some(vec![]),
                _ => {
                    self.unknown_case(name, &["some", "none"], ty);
                    None
                }
            },
            Ty::Result(ok, err) => match name.name.as_str() {
                "ok" => Some(vec![(**ok).clone()]),
                "err" => Some(vec![(**err).clone()]),
                _ => {
                    self.unknown_case(name, &["ok", "err"], ty);
                    None
                }
            },
            Ty::Adt(def, args) if matches!(self.out.defs[*def].kind, DefKind::Enum(_)) => {
                let d = self.out.defs[*def].clone();
                if let Some(q) = qualifier
                    && q.name != d.name
                {
                    self.pattern_mismatch(pattern, &format!("`{}`", q.name), ty);
                    return None;
                }
                match d.variants().iter().find(|v| v.name == name.name) {
                    Some(v) => Some(v.payload.iter().map(|(_, t)| substitute(t, args)).collect()),
                    None => {
                        let names: Vec<&str> = d.variants().iter().map(|v| v.name.as_str()).collect();
                        self.unknown_case(name, &names, ty);
                        None
                    }
                }
            }
            Ty::Unknown => None,
            other => {
                self.pattern_mismatch(pattern, &format!("a case `.{}`", name.name), other);
                None
            }
        }
    }

    fn unknown_case(&mut self, name: &Ident, cases: &[&str], ty: &Ty) {
        let help = match closest(&name.name, cases.iter().copied()) {
            Some(near) => format!(
                "did you mean `.{near}`? the cases are {}",
                cases.iter().map(|c| format!("`.{c}`")).collect::<Vec<_>>().join(", ")
            ),
            None => format!(
                "the cases are {}",
                cases.iter().map(|c| format!("`.{c}`")).collect::<Vec<_>>().join(", ")
            ),
        };
        self.report(
            Diagnostic::error("B0216", name.span, format!("{} has no case `.{}`", self.show(ty), name.name))
                .label("no such case")
                .help(help)
                .spec("45-enums-option-and-result"),
        );
    }

    fn unknown_field(&mut self, name: &Ident, ty: &Ty) {
        let fields: Vec<String> = match self.resolve(ty) {
            Ty::Adt(def, _) => self.out.defs[def].fields().iter().map(|f| f.name.clone()).collect(),
            _ => Vec::new(),
        };
        let help = closest(&name.name, fields.iter().map(String::as_str))
            .map(|near| format!("did you mean `{near}`?"))
            .or_else(|| {
                (!fields.is_empty()).then(|| {
                    format!(
                        "its fields are {}",
                        fields.iter().map(|f| format!("`{f}`")).collect::<Vec<_>>().join(", ")
                    )
                })
            });
        self.report(
            Diagnostic::error("B0205", name.span, format!("{} has no field `{}`", self.show(ty), name.name))
                .label("no such field")
                .maybe_help(help)
                .spec("44-structs"),
        );
    }

    fn pattern_mismatch(&mut self, pattern: &Pattern, what: &str, ty: &Ty) {
        self.report(
            Diagnostic::error("B0303", pattern.span, format!("{what} cannot match {}", self.show(ty)))
                .label(format!("the value is {}", self.show(ty)))
                .spec("45-enums-option-and-result"),
        );
    }

    /// A pattern in the exhaustiveness checker's terms.
    fn to_pat(&self, pattern: &Pattern) -> Pat {
        let ty = self.out.pattern_tys.get(&pattern.span).map(|t| self.zonk(t)).unwrap_or(Ty::Unknown);
        match &pattern.kind {
            PatternKind::Wildcard | PatternKind::Bind(_) => Pat::Wild,
            PatternKind::None => Pat::Ctor("none".into(), vec![]),
            PatternKind::Literal(expr) => match &expr.kind {
                ExprKind::Bool(b) => Pat::Ctor(b.to_string(), vec![]),
                ExprKind::Str { parts, .. } if matches!(ty, Ty::Strings(_)) => {
                    Pat::Ctor(format!("\"{}\"", plain_text(parts)), vec![])
                }
                ExprKind::Str { parts, .. } => Pat::Lit(format!("\"{}\"", plain_text(parts))),
                _ => Pat::Lit(self.source[expr.span.start as usize..expr.span.end as usize].to_string()),
            },
            PatternKind::Tuple(items) => {
                Pat::Ctor("tuple".into(), items.iter().map(|p| self.to_pat(p)).collect())
            }
            PatternKind::Record(fields) => match &ty {
                Ty::Adt(def, _) => {
                    let pats = self.out.defs[*def]
                        .fields()
                        .iter()
                        .map(|f| {
                            fields
                                .iter()
                                .find(|(name, _)| name.name == f.name)
                                .and_then(|(_, sub)| sub.as_ref())
                                .map_or(Pat::Wild, |sub| self.to_pat(sub))
                        })
                        .collect();
                    Pat::Ctor("struct".into(), pats)
                }
                _ => Pat::Wild,
            },
            PatternKind::Case { name, args, .. } => {
                let ctor = match (&ty, name.name.as_str()) {
                    (Ty::Option(_), "some" | "none") | (Ty::Result(..), "ok" | "err") => name.name.clone(),
                    _ => format!(".{}", name.name),
                };
                Pat::Ctor(ctor, args.iter().flatten().map(|p| self.to_pat(p)).collect())
            }
            // An alternative is expanded by the caller.
            PatternKind::Or(_) => Pat::Wild,
        }
    }

    /// The rows an arm contributes: one per alternative of `|`.
    fn rows(&self, pattern: &Pattern) -> Vec<Pat> {
        match &pattern.kind {
            PatternKind::Or(alternatives) => alternatives.iter().flat_map(|a| self.rows(a)).collect(),
            _ => vec![self.to_pat(pattern)],
        }
    }

    /// `lazy(() => import("./X"))` with React's `lazy` imported: a component whose props TS
    /// checks.
    fn lazy_props(&mut self, value: &Expr) -> Option<Ty> {
        let ExprKind::Call(call) = &value.kind else { return None };
        let ExprKind::Name(name) = &call.callee.kind else { return None };
        let local = self.lookup(name)?;
        if !matches!(self.out.locals[local].kind, LocalKind::Import { .. }) || name != "lazy" {
            return None;
        }
        let closure = match (call.args.as_slice(), &call.trailing) {
            ([arg], None) => match &arg.value.kind {
                ExprKind::Closure(c) => c,
                _ => return None,
            },
            ([], Some(c)) => c,
            _ => return None,
        };
        let [Stmt { kind: StmtKind::Expr(body), .. }] = closure.body.as_slice() else { return None };
        let ExprKind::Call(import) = &body.kind else { return None };
        if !matches!(&import.callee.kind, ExprKind::Name(n) if n == "import") {
            return None;
        }
        let [arg] = import.args.as_slice() else { return None };
        let ExprKind::Str { parts, .. } = &arg.value.kind else { return None };
        let [StrPart::Text(specifier)] = parts.as_slice() else { return None };
        // The module is TS's to read: the component's props are checked by the emitted
        // `satisfies ComponentProps<typeof X>`.
        if let Some(path) = ts::resolve(&self.path, specifier, self.options) {
            self.out.dependencies.insert(path);
        }
        Some(Ty::Foreign("".into()))
    }

    // ---- control flow ---------------------------------------------------

    /// `if x != none { … }` (also `none != x`, and each side of `&&`): `x` is present in
    /// the block, as TS narrows it. Locals read as themselves only (not `@ref`/`@state`).
    fn narrow_present(&mut self, expr: &Expr) {
        self.narrow(expr, BinaryOp::Ne, BinaryOp::And);
    }

    /// `test` (`!=` joined by `&&`, or `==` joined by `||` for a guard that exits) holding
    /// for `name … none`: the name is present after it.
    fn narrow(&mut self, expr: &Expr, test: BinaryOp, join: BinaryOp) {
        // `(x != none) ? x : d`: through parentheses.
        if let ExprKind::Paren(inner) = &expr.kind {
            return self.narrow(inner, test, join);
        }
        let ExprKind::Binary(op, lhs, rhs) = &expr.kind else { return };
        match op {
            op if *op == join => {
                self.narrow(lhs, test, join);
                self.narrow(rhs, test, join);
            }
            // `rows.kind == "sources"` (where `!= none` would narrow) on a TS discriminated
            // union: `rows` is that member there, as TS narrows it.
            op if (*op == BinaryOp::Eq && test == BinaryOp::Ne)
                || (*op == BinaryOp::Ne && test == BinaryOp::Eq) =>
            {
                let (subject, literal) = match (&lhs.kind, &rhs.kind) {
                    (_, ExprKind::Str { parts, .. }) => (lhs, parts),
                    (ExprKind::Str { parts, .. }, _) => (rhs, parts),
                    _ => return,
                };
                let [StrPart::Text(value)] = literal.as_slice() else { return };
                let value = value.clone();
                self.narrow_tag(expr.id, subject, &value);
            }
            op if *op == test => {
                let subject = match (&lhs.kind, &rhs.kind) {
                    (_, ExprKind::None) => lhs,
                    (ExprKind::None, _) => rhs,
                    _ => return,
                };
                if !matches!(subject.kind, ExprKind::Name(_)) {
                    self.narrow_path(subject);
                    return;
                }
                let ExprKind::Name(name) = &subject.kind else { return };
                let Some(NameRes::Local(original)) = self.out.names.get(&subject.id).cloned() else { return };
                // A `@State` too: its value is the render's, as a `let`'s is (a write in a handler
                // is read again only after it, which is B0410).
                if !matches!(
                    self.out.locals[original].kind,
                    LocalKind::Let
                        | LocalKind::Param
                        | LocalKind::Prop
                        | LocalKind::Derived
                        | LocalKind::Hook
                        | LocalKind::State
                ) {
                    return;
                }
                let Ty::Option(inner) = self.resolve(&self.out.locals[original].ty.clone()) else { return };
                let ident = Ident { name: name.clone(), span: self.out.locals[original].span };
                let narrowed = self.declare(&ident, *inner, LocalKind::Let);
                self.out.narrowed.insert(subject.id, (narrowed, original));
            }
            _ => {}
        }
    }

    /// A member chain of an immutable local (`u.name`, `u?.name`), as a path.
    fn path_of(&self, expr: &Expr) -> Option<(LocalId, FieldPath)> {
        match &expr.kind {
            ExprKind::Paren(inner) => self.path_of(inner),
            ExprKind::Field(object, name) | ExprKind::OptField(object, name) => {
                let (root, mut path) = self.path_of(object)?;
                path.push((name.name.clone(), matches!(expr.kind, ExprKind::OptField(..))));
                Some((root, path))
            }
            ExprKind::Name(_) => match self.out.names.get(&expr.id) {
                Some(NameRes::Local(local))
                    if matches!(
                        self.out.locals[*local].kind,
                        LocalKind::Let
                            | LocalKind::Param
                            | LocalKind::Prop
                            | LocalKind::Derived
                            | LocalKind::Hook
                            | LocalKind::State
                    ) =>
                {
                    Some((*local, Vec::new()))
                }
                _ => None,
            },
            _ => None,
        }
    }

    /// `u.name != none`: values are immutable, so `u.name` is present where the test held.
    fn narrow_path(&mut self, subject: &Expr) {
        let Some((root, path)) = self.path_of(subject) else { return };
        let Some(ty) = self.out.types.get(&subject.id).cloned() else { return };
        let Ty::Option(inner) = self.resolve(&ty) else { return };
        let depth = self.scopes.len();
        self.paths.push((depth, root, path, *inner));
    }

    /// A member chain read where it was narrowed present: its present type.
    fn narrowed_path(&mut self, expr: &Expr, ty: Ty) -> Ty {
        let Some((root, path)) = self.path_of(expr) else { return ty };
        let Some(present) = self.paths.iter().rev().find(|p| p.1 == root && p.2 == path).map(|p| p.3.clone())
        else {
            return ty;
        };
        match self.resolve(&ty) {
            Ty::Option(_) => {}
            // A TS discriminated union narrowed on its tag: the member, read as it is.
            Ty::Adt(def, _) if self.out.defs[def].tagged.is_some() => return present,
            _ => return ty,
        }
        self.out.narrowed_paths.insert(expr.id);
        present
    }

    fn cond(&mut self, cond: &Cond) {
        match cond {
            Cond::Expr(expr) => {
                self.expr(expr, Some(&Ty::Bool));
                // `if x is T { … }`: `x` is a `T` in the block.
                if let ExprKind::Is(subject, _) = &expr.kind
                    && let ExprKind::Name(name) = &subject.kind
                    && let Some(NameRes::Local(original)) = self.out.names.get(&subject.id).cloned()
                    && let Some(ty) = self.out.is_tests.get(&expr.id).cloned()
                {
                    let ident = Ident { name: name.clone(), span: self.out.locals[original].span };
                    let narrowed = self.declare(&ident, ty, LocalKind::Let);
                    self.out.narrowed.insert(expr.id, (narrowed, original));
                }
                self.narrow_present(expr);
            }
            Cond::Let(pattern, value) => {
                let ty = self.expr(value, None);
                // `if let v = optional`: a bare name unwraps.
                let resolved = self.resolve(&ty);
                let bound = match (&pattern.kind, &resolved) {
                    (PatternKind::Bind(_), Ty::Option(inner)) => (**inner).clone(),
                    (PatternKind::Bind(_), Ty::Foreign(_) | Ty::Unknown) => resolved.clone(),
                    (PatternKind::Bind(name), _) => {
                        self.report(
                            Diagnostic::error(
                                "B0303",
                                value.span,
                                format!(
                                    "`if let {} = …` unwraps an optional, and this is {}",
                                    name.name,
                                    self.show(&resolved)
                                ),
                            )
                            .label("never `none`")
                            .help(format!(
                                "bind it with `let {} = …`, or match a case: `if let .ready(x) = …`",
                                name.name
                            ))
                            .spec("45-enums-option-and-result"),
                        );
                        resolved.clone()
                    }
                    _ => ty.clone(),
                };
                let mut locals = Vec::new();
                self.bind(pattern, &bound, &LocalKind::Let, &mut locals);
                // The value it unwraps, for the emitter.
                self.out.pattern_tys.insert(value.span, ty);
            }
        }
    }

    fn if_expr(&mut self, if_expr: &IfExpr, expected: Option<&Ty>, span: Span) -> Ty {
        self.push();
        self.cond(&if_expr.cond);
        let Some(otherwise) = if_expr.otherwise.as_deref() else {
            // Where a `View?` is taken (`.accessory(if open { row })`), an `if` without `else`
            // is the optional child it is in a builder.
            let view = match expected.map(|e| self.resolve(e)) {
                Some(Ty::Option(inner)) => Some(self.resolve(&inner)),
                other => other,
            };
            if let Some(view @ Ty::View(_)) = view {
                self.block(&if_expr.then, Some(&view));
                self.pop();
                return Ty::Option(Box::new(view));
            }
            self.block(&if_expr.then, Some(&Ty::Unit));
            self.pop();
            return Ty::Unit;
        };
        let then = self.block(&if_expr.then, expected);
        self.pop();
        let other = match otherwise {
            Else::If(next) => self.expr(next, expected.or(Some(&then))),
            Else::Block(block) => self.block(block, expected.or(Some(&then))),
        };
        self.join(&then, &other, span)
    }

    /// The type of two branches together: `T` and `none` make `T?`.
    fn join(&mut self, a: &Ty, b: &Ty, span: Span) -> Ty {
        let ra = self.resolve(a);
        let rb = self.resolve(b);
        match (&ra, &rb) {
            (Ty::Never, _) => rb,
            (_, Ty::Never) => ra,
            // A TS value beside `none` or a Bloom value: TS checks the whole where it lands.
            (Ty::Foreign(_), _) => ra,
            (_, Ty::Foreign(_)) => rb,
            (Ty::Option(_), _) if self.coerce(&rb, &ra) => ra,
            (_, Ty::Option(_)) if self.coerce(&ra, &rb) => rb,
            (Ty::Strings(_), Ty::Str) | (Ty::Str, Ty::Strings(_)) => Ty::Str,
            (Ty::Int, Ty::Float) | (Ty::Float, Ty::Int) => Ty::Float,
            (Ty::Strings(x), Ty::Strings(y)) if x.token && x.name == y.name => ra,
            (Ty::Strings(x), Ty::Strings(y)) if !x.token && !y.token => {
                let mut values = x.values.clone();
                values.extend(y.values.iter().filter(|v| !x.values.contains(v)).cloned());
                let name = values.iter().map(|v| format!("\"{v}\"")).collect::<Vec<_>>().join(" | ");
                Ty::Strings(Rc::new(StrSet { name, values, token: false }))
            }
            // An optional beside another type (`c ? "x" : d ? "y" : none`, R3): the optional of
            // the two joined, as TS's `"x" | "y" | null`.
            (Ty::Option(x), Ty::Option(y)) => Ty::Option(Box::new(self.join(x, y, span))),
            (Ty::Option(x), _) => Ty::Option(Box::new(self.join(x, &rb, span))),
            (_, Ty::Option(y)) => Ty::Option(Box::new(self.join(&ra, y, span))),
            _ => {
                if !self.coerce(&rb, &ra) {
                    self.report(
                        Diagnostic::error(
                            "B0201",
                            span,
                            format!("the branches give {} and {}", self.show(&ra), self.show(&rb)),
                        )
                        .label("every branch gives the same type")
                        .spec("6-expressions-and-control-flow"),
                    );
                }
                ra
            }
        }
    }

    /// A `match`'s subject that is a TS discriminated union's tag (`rows.kind`, `rows` a local):
    /// the subject's id, the local, and the union.
    fn tagged_subject(&self, scrutinee: &Expr) -> Option<(ExprId, LocalId, Rc<Tagged>)> {
        let ExprKind::Field(object, field) = &scrutinee.kind else { return None };
        let ExprKind::Name(_) = &object.kind else { return None };
        let Some(NameRes::Local(local)) = self.out.names.get(&object.id).cloned() else { return None };
        let Ty::Adt(def, _) = self.resolve(&self.out.locals[local].ty) else { return None };
        let tagged = self.out.defs[def].tagged.clone()?;
        (tagged.tag == field.name).then_some((scrutinee.id, local, tagged))
    }

    /// A tag read on a member chain (`item.media.mode`, `item.media` a TS discriminated union):
    /// the chain as a path, and the union. Values are immutable, so the chain narrows as a name
    /// does.
    fn tagged_path(&self, scrutinee: &Expr) -> Option<(LocalId, FieldPath, Rc<Tagged>)> {
        let ExprKind::Field(object, field) = &scrutinee.kind else { return None };
        if matches!(object.kind, ExprKind::Name(_)) {
            return None;
        }
        let (root, path) = self.path_of(object)?;
        let ty = self.out.types.get(&object.id)?;
        let Ty::Adt(def, _) = self.resolve(ty) else { return None };
        let tagged = self.out.defs[def].tagged.clone()?;
        (tagged.tag == field.name).then_some((root, path, tagged))
    }

    /// Narrows a tag test's subject (a name or a member chain) to the member `value` names.
    fn narrow_tag(&mut self, id: ExprId, subject: &Expr, value: &str) {
        if let Some((_, original, tagged)) = self.tagged_subject(subject) {
            let Some((_, member)) = tagged.members.iter().find(|(v, _)| v == value) else { return };
            let ident =
                Ident { name: self.out.locals[original].name.clone(), span: self.out.locals[original].span };
            let narrowed = self.declare(&ident, member.clone(), LocalKind::Let);
            self.out.narrowed.insert(id, (narrowed, original));
        } else if let Some((root, path, tagged)) = self.tagged_path(subject) {
            let Some((_, member)) = tagged.members.iter().find(|(v, _)| v == value) else { return };
            let depth = self.scopes.len();
            self.paths.push((depth, root, path, member.clone()));
        }
    }

    /// Checks a `match`'s arms (exhaustive, reachable); `arm` checks each body.
    fn match_arms(
        &mut self,
        m: &MatchExpr,
        span: Span,
        arm: &mut dyn FnMut(&mut Self, &ArmBody) -> Ty,
    ) -> Vec<Ty> {
        let scrutinee = self.expr(&m.scrutinee, None);
        let scrutinee = self.resolve(&scrutinee);
        self.out.pattern_tys.insert(m.scrutinee.span, scrutinee.clone());
        let mut rows: Vec<Vec<Pat>> = Vec::new();
        let mut tys = Vec::new();
        let zonked = self.zonk(&scrutinee);
        let tagged = self.tagged_subject(&m.scrutinee).is_some() || self.tagged_path(&m.scrutinee).is_some();
        for a in &m.arms {
            self.push();
            let mut locals = Vec::new();
            self.bind(&a.pattern, &scrutinee, &LocalKind::Let, &mut locals);
            // `switch rows.kind { case "sources": … }` on a TS discriminated union: `rows` is that
            // member in the arm, as TS narrows it (`rows.sources`).
            if tagged
                && let PatternKind::Literal(literal) = &a.pattern.kind
                && let ExprKind::Str { parts, .. } = &literal.kind
                && let [StrPart::Text(value)] = parts.as_slice()
            {
                let value = value.clone();
                self.narrow_tag(literal.id, &m.scrutinee, &value);
            }
            if let Some(guard) = &a.guard {
                self.expr(guard, Some(&Ty::Bool));
            }
            let arm_rows = self.rows(&a.pattern);
            let reachable = arm_rows.iter().any(|row| {
                exhaust::useful(
                    &rows,
                    std::slice::from_ref(row),
                    std::slice::from_ref(&zonked),
                    &self.out.defs,
                )
            });
            if !reachable && !matches!(zonked, Ty::Unknown | Ty::Foreign(_)) {
                self.out.diagnostics.push(
                    Diagnostic::warning("B0302", a.pattern.span, "this arm is never reached")
                        .label("the arms above match every value it matches")
                        .help("remove it, or move it above the arm that covers it")
                        .spec("43-soundness-rules"),
                );
            }
            if a.guard.is_none() {
                rows.extend(arm_rows.into_iter().map(|p| vec![p]));
            }
            tys.push(arm(self, &a.body));
            self.pop();
        }
        if matches!(zonked, Ty::Foreign(_)) {
            self.report(
                Diagnostic::error("B0601", m.scrutinee.span, "a `Foreign` value is matched")
                    .label("Bloom cannot check these patterns against a TS value it could not type")
                    .help("annotate it first: `let value: T = …`, then `match value`")
                    .spec("47-the-foreign-boundary"),
            );
        }
        if !matches!(zonked, Ty::Unknown | Ty::Foreign(_)) {
            let missing = exhaust::missing(&rows, &zonked, &self.out.defs);
            if !missing.is_empty() {
                let list = missing.iter().map(|m| format!("`{m}`")).collect::<Vec<_>>().join(", ");
                let arms: String = missing.iter().map(|m| format!("\n      case {m} => …")).collect();
                self.report(
                    Diagnostic::error(
                        "B0301",
                        m.scrutinee.span,
                        format!("this {} does not cover {list}", if m.switch { "switch" } else { "match" }),
                    )
                    .label(format!("{} is not matched by every value", self.show(&zonked)))
                    .help(format!("add the missing arm(s), or `case _ =>` for the rest:{arms}"))
                    .spec("43-soundness-rules"),
                );
            }
        }
        let _ = span;
        tys
    }

    /// `break` / `continue` (with a loop's name or not): what it leaves, which is a loop of this
    /// frame (a closure's body is not its loop's), or for an unnamed `break` a `switch`.
    fn leave(&mut self, span: Span, label: Option<&Ident>, is_break: bool) {
        let word = if is_break { "break" } else { "continue" };
        let depth = self.frames.len();
        let here: Vec<Breakable> =
            self.breakables.iter().rev().take_while(|(d, _)| *d == depth).map(|(_, b)| b.clone()).collect();
        match label {
            Some(label) => {
                if !here.iter().any(|b| matches!(b, Breakable::Loop(Some(n)) if *n == label.name)) {
                    self.report(
                        Diagnostic::error(
                            "B0219",
                            label.span,
                            format!("no loop named `{}` is around this `{word}`", label.name),
                        )
                        .label("not the name of an enclosing loop")
                        .help(format!("name the loop: `{}: for … {{ … }}`", label.name))
                        .spec("62-control-flow-and-errors-20"),
                    );
                }
            }
            None => match here.iter().find(|b| is_break || matches!(b, Breakable::Loop(_))) {
                Some(Breakable::Switch(scrutinee)) => {
                    self.out.switch_breaks.insert(span, *scrutinee);
                }
                Some(Breakable::Loop(_)) => {}
                None => {
                    let what = if is_break { "a loop or a `switch`" } else { "a loop" };
                    self.report(
                        Diagnostic::error("B0219", span, format!("`{word}` is only valid inside {what}"))
                            .label("nothing here to leave")
                            .help("a closure's body is not its loop's: `return` leaves the closure")
                            .spec("62-control-flow-and-errors-20"),
                    );
                }
            },
        }
    }

    fn match_expr(&mut self, m: &MatchExpr, expected: Option<&Ty>, span: Span) -> Ty {
        self.breakables.push((self.frames.len(), Breakable::Switch(m.scrutinee.span)));
        let ty = self.match_value(m, expected, span);
        self.breakables.pop();
        ty
    }

    fn match_value(&mut self, m: &MatchExpr, expected: Option<&Ty>, span: Span) -> Ty {
        let expected = expected.cloned();
        let tys = self.match_arms(m, span, &mut |checker, body| match body {
            ArmBody::Expr(e) => checker.expr(e, expected.as_ref()),
            ArmBody::Block(b) => checker.block(b, expected.as_ref()),
        });
        let mut ty = Ty::Never;
        for arm_ty in tys {
            ty = self.join(&ty, &arm_ty, span);
        }
        ty
    }

    // ---- expressions ----------------------------------------------------

    /// Checks `expr` against `expected` (when there is one) and records its type.
    pub fn expr(&mut self, expr: &Expr, expected: Option<&Ty>) -> Ty {
        if let (Some(recorded), Some(expected)) = (&mut self.expected, expected) {
            recorded.push((expr.span, expected.clone()));
        }
        let mut ty = self.infer(expr, expected);
        if matches!(expr.kind, ExprKind::Field(..) | ExprKind::OptField(..)) && !self.paths.is_empty() {
            ty = self.narrowed_path(expr, ty);
        }
        self.out.types.insert(expr.id, ty.clone());
        self.span_type((expr.span, ty.clone()));
        // A value passed as `any P`: packed with its conformance's witness.
        if let Some(Ty::Any(protocol)) = expected.map(|e| self.resolve(e))
            && let Ty::Adt(def, _) = self.resolve(&ty)
        {
            let declared = self.out.conformances.iter().any(|c| c.def == def && c.protocol == protocol)
                || self.out.defs[def].origin != Origin::Local;
            if !declared {
                let (shown, name) = (self.show(&ty), self.out.defs[protocol].name.clone());
                self.report(
                    Diagnostic::error("B0232", expr.span, format!("{shown} does not conform to `{name}`"))
                        .label(format!("passed as `any {name}`"))
                        .help(format!("declare it: `extension {}: {name} {{ … }}`", self.out.defs[def].name))
                        .spec("48-protocols"),
                );
            }
            self.out.packs.insert(expr.id, (def, protocol));
            return Ty::Any(protocol);
        }
        match expected {
            Some(expected) => {
                // A TS value Bloom could not type is accepted where a type is
                // expected; the emitted `satisfies` lets TypeScript check it (spec 4.7).
                // Nothing known yet (a generic's `U`): the TS value's own type is what it is.
                if matches!(self.resolve(&ty), Ty::Foreign(_)) && matches!(self.resolve(expected), Ty::Var(_))
                {
                    self.unify(expected, &ty);
                    return ty;
                }
                if matches!(self.resolve(&ty), Ty::Foreign(_))
                    && !matches!(self.resolve(expected), Ty::Unknown | Ty::Foreign(_))
                {
                    if let Ty::Fn(f) = self.resolve(expected)
                        && f.is_async
                    {
                        let params: Vec<String> =
                            f.params.iter().map(|p| self.show(&p.ty).trim_matches('`').to_string()).collect();
                        let ret = self.show(&f.ret).trim_matches('`').to_string();
                        self.report(
                                Diagnostic::error("B0201", expr.span, "a TS function returns a promise, not a Bloom async result")
                                    .label("a TS value typed as a Bloom `async` function")
                                    .help(format!("type it with `Promise`: `({}) -> Promise<{ret}>`; awaiting it gives a `Result`", params.join(", ")))
                                    .spec("8-effects-tasks-and-concurrency"),
                            );
                    }
                    let mut expected = self.zonk(expected);
                    // Go on with the type the help writes, so one mistake is one error.
                    if let Ty::Fn(f) = &expected
                        && f.is_async
                    {
                        let ret = Ty::Promise(Box::new(f.ret.clone()));
                        expected = Ty::Fn(Rc::new(FnTy { ret, is_async: false, ..(**f).clone() }));
                    }
                    self.out.foreign_checks.insert(expr.id, expected.clone());
                    return expected;
                }
                // A list of views in a child's place (`Menu { glyph; rows }`): its items are
                // children (spec 7.2).
                if self.child_slots.contains(&expr.id)
                    && let Some(spread) = self.child_list(&ty)
                    && self.is_view(expected)
                {
                    if spread {
                        self.out.view_lists.insert(expr.id);
                    }
                    return expected.clone();
                }
                // A list of TS values where `[T]` is expected (`accounts: data ?? []`), or a
                // function given a TS value where it takes a `T` (`bans.map(renderBan)`): as a
                // single TS value, accepted, and TypeScript checks the whole (spec 4.7).
                if self.fits_through_ts(&ty, expected) {
                    let expected = self.zonk(expected);
                    let check = match (self.resolve(&ty), &expected) {
                        (Ty::List(_), Ty::Option(inner)) => (**inner).clone(),
                        _ => expected.clone(),
                    };
                    self.out.foreign_checks.insert(expr.id, check);
                    return expected;
                }
                if !self.coerce(&ty, expected) {
                    self.mismatch(expr.span, &ty, expected);
                    return Ty::Unknown;
                }
                // A struct built here and passed as a record type with fewer fields: TS would
                // refuse the extra ones on a fresh object literal, so the emitter names it first.
                if let (Ty::Adt(built, _), Ty::Adt(record, _)) = (self.resolve(&ty), self.resolve(expected))
                    && built != record
                    && self.out.defs[record].origin == Origin::Record
                    && matches!(self.out.calls.get(&expr.id), Some(CallRes::Struct(_)))
                {
                    self.out.widened.insert(expr.id);
                }
                if matches!(self.resolve(&ty), Ty::Never) { ty } else { expected.clone() }
            }
            None => ty,
        }
    }

    /// An argument TS checks: `Foreign` and Bloom values alike, an `Int` where
    /// a TS `number` is, a closure whose untyped parameters TS infers.
    pub fn boundary(&mut self, expr: &Expr, ts_ty: Option<&Ty>) -> Ty {
        let hint = ts_ty.map(|t| self.resolve(t));
        // A `@ref` where TS takes a ref (`RefObject<…>`, `Ref<…>`): the ref itself. While the
        // view draws, where TS's type is not known to Bloom, too (its value would be B0411;
        // tsc checks the ref against what TS takes).
        let drawing = self.frames.last().is_some_and(|f| f.render);
        let ref_hint = match &hint {
            Some(Ty::Foreign(text)) => is_ref_type(text) || drawing,
            Some(Ty::Adt(def, _)) => is_ref_type(&format!("{}<", self.out.defs[*def].name)),
            None => drawing,
            _ => false,
        };
        if let ExprKind::Name(name) = &expr.kind
            && ref_hint
            && !self.ref_object
            && self.lookup(name).is_some_and(|l| self.out.locals[l].kind == LocalKind::Ref)
        {
            self.ref_object = true;
            let ty = self.boundary(expr, None);
            self.ref_object = false;
            return ty;
        }
        let ty = match (&expr.kind, &hint) {
            (ExprKind::Closure(c), None | Some(Ty::Foreign(_))) => {
                let ty = self.closure(c, None, true);
                self.out.types.insert(expr.id, ty.clone());
                ty
            }
            _ => {
                // A closure TS calls throws: `?` and `fail(e)` there throw its error.
                if matches!(expr.kind, ExprKind::Closure(_)) {
                    self.closure_throws = true;
                }
                // A literal where a TS type is expected (`tsFunc([{ a }, { b }])`): each element and
                // field is TS's to check on its own, not typed from its sibling.
                let foreign_literal = literal_shaped(expr);
                let ty = self
                    .infer(expr, hint.as_ref().filter(|h| foreign_literal || !matches!(h, Ty::Foreign(_))));
                if matches!(expr.kind, ExprKind::Field(..) | ExprKind::OptField(..)) && !self.paths.is_empty()
                {
                    self.narrowed_path(expr, ty)
                } else {
                    ty
                }
            }
        };
        self.out.types.insert(expr.id, ty.clone());
        self.span_type((expr.span, ty.clone()));
        if hint.as_ref().is_some_and(is_element) {
            self.element(expr);
        }
        if let Some(hint) = hint {
            // `merge<T extends Holder>(actor: T)` given a TS value: `T` is that value's type, so
            // the result is one too (it was left unsolved, `_`).
            let fits = (matches!(hint, Ty::Var(_)) && self.coerce(&ty, &hint))
                || matches!((self.resolve(&ty), &hint), (Ty::Int, Ty::Float))
                || matches!(self.resolve(&ty), Ty::Foreign(_))
                // A `Foreign?` where TS takes an optional (`account: account`): TS checks it.
                || matches!((self.resolve(&ty), &hint), (Ty::Option(inner), Ty::Option(_)) if matches!(self.resolve(&inner), Ty::Foreign(_)))
                // A list of TS values, or a function given one: TS checks it here too.
                || self.fits_through_ts(&ty, &hint)
                // `postPermalink(viewPost?.id)` with a TS `viewPost` TS says is there: optional only
                // by the guard Bloom kept, and `string` in TS's own type, which TS checks here.
                || matches!(self.resolve(&ty), Ty::Option(inner)
                    if !matches!(hint, Ty::Option(_)) && self.is_claim_only(expr) && self.coerce(&inner, &hint))
                || self.coerce(&ty, &hint);
            if !fits {
                self.mismatch(expr.span, &ty, &hint);
            }
        }
        if matches!(self.resolve(&ty), Ty::Async(_)) {
            self.report(
                Diagnostic::error("B0430", expr.span, "a pending async call is passed to TS")
                    .label("an async Bloom call")
                    .help("write `await` before it, or pass the function itself")
                    .spec("8-effects-tasks-and-concurrency"),
            );
        }
        ty
    }

    fn infer(&mut self, expr: &Expr, expected: Option<&Ty>) -> Ty {
        let expected_resolved = expected.map(|e| self.resolve(e));
        // Swift's implicit member chain: `.dateTime.month(.abbreviated)` where a `DateFormat` is
        // expected starts from `DateFormat.dateTime`.
        if let Some(expected) = &expected_resolved
            && matches!(expr.kind, ExprKind::Call(_) | ExprKind::Field(..))
            && let Some(root) = implicit_root(expr)
        {
            self.implicit_chains.entry(root.id).or_insert_with(|| expected.clone());
        }
        match &expr.kind {
            ExprKind::Error => Ty::Unknown,
            ExprKind::Int(_) => match expected_resolved {
                // A literal is as polymorphic as the type it is written for.
                Some(Ty::Float) => Ty::Float,
                Some(Ty::Option(inner)) if *inner == Ty::Float => Ty::Float,
                _ => Ty::Int,
            },
            ExprKind::Float(_) => Ty::Float,
            ExprKind::Unit => Ty::Unit,
            ExprKind::Task(block) => {
                self.spawn(&block.stmts, block.span);
                Ty::Unit
            }
            ExprKind::Bool(_) => Ty::Bool,
            ExprKind::None => match expected_resolved {
                Some(Ty::Option(inner)) => Ty::Option(inner),
                _ => Ty::Option(Box::new(self.fresh())),
            },
            ExprKind::Str { parts, .. } => self.string(expr, parts, expected_resolved.as_ref()),
            ExprKind::Name(name) => self.name(expr, name),
            ExprKind::ImplicitMember(name) => self.implicit_member(expr, name, expected_resolved.as_ref()),
            ExprKind::Binding(path) => self.binding(expr, path),
            ExprKind::KeyPath { root, path } => {
                self.key_path(expr, root.as_ref(), path, expected_resolved.as_ref())
            }
            ExprKind::TypeApply { name, .. } => {
                self.report(
                    Diagnostic::error(
                        "B0201",
                        expr.span,
                        format!("`{}<…>` is a type here, not a value", name.name),
                    )
                    .label("a type")
                    .help("construct it: `Partial<Prefs>(likes: false)`, or name a case: `Load<Int>.loading`")
                    .spec("44-structs"),
                );
                Ty::Unknown
            }
            ExprKind::Paren(inner) => self.expr(inner, expected),
            ExprKind::Tuple(items) if items.is_empty() => Ty::Unit,
            ExprKind::Tuple(items) => {
                let expected_items = match &expected_resolved {
                    Some(Ty::Tuple(tys)) if tys.len() == items.len() => tys.clone(),
                    _ => Vec::new(),
                };
                Ty::Tuple(
                    items
                        .iter()
                        .enumerate()
                        .map(|(i, item)| self.expr(item, expected_items.get(i)))
                        .collect(),
                )
            }
            ExprKind::List(items) => {
                // Where a `[T]?` is expected (`xs ?? ["anyone"]` beside a TS `ReplyPermission[]`), the
                // list is a `[T]`: its literals take `T` (a string literal union) as one would.
                let elem = match &expected_resolved {
                    Some(Ty::List(elem)) => (**elem).clone(),
                    Some(Ty::Option(inner)) => match self.resolve(inner) {
                        Ty::List(elem) => *elem,
                        _ => self.fresh(),
                    },
                    _ => self.fresh(),
                };
                // Where a TS type is expected, each literal item is TS's to check on its own (as a
                // TS value), never typed from its sibling; the list is that TS type.
                // (A TS prop that may be absent, `style?: StyleProp<ViewStyle>`, is `Foreign?`.)
                let foreign_expected = match &expected_resolved {
                    Some(foreign @ Ty::Foreign(_)) => Some(foreign.clone()),
                    Some(Ty::Option(inner)) => match self.resolve(inner) {
                        foreign @ Ty::Foreign(_) => Some(foreign),
                        _ => None,
                    },
                    _ => None,
                };
                if let Some(foreign) = foreign_expected
                    && items.iter().any(literal_shaped)
                {
                    let item_ty = Ty::Foreign("".into());
                    for item in items {
                        let (inner, spread) = match &item.kind {
                            ExprKind::Spread(inner) => (&**inner, true),
                            _ => (item, false),
                        };
                        let ty = if literal_shaped(inner) {
                            self.expr(inner, Some(&item_ty))
                        } else {
                            self.expr(inner, None)
                        };
                        if spread {
                            self.out.types.insert(item.id, ty);
                        }
                    }
                    return foreign;
                }
                // With no declared item type, an item's expected type is its siblings': inferred.
                if matches!(self.resolve(&elem), Ty::Var(_)) {
                    for item in items {
                        match &item.kind {
                            ExprKind::Spread(inner) => inferred_calls(inner, &mut self.inferred_expected),
                            _ => inferred_calls(item, &mut self.inferred_expected),
                        }
                    }
                }
                for item in items {
                    if let ExprKind::Spread(inner) = &item.kind {
                        let list = Ty::List(Box::new(elem.clone()));
                        let ty = self.expr(inner, Some(&list));
                        self.out.types.insert(item.id, ty);
                        continue;
                    }
                    let ty = self.expr(item, Some(&elem));
                    let _ = ty;
                }
                Ty::List(Box::new(elem))
            }
            ExprKind::Record(entries) => self.record_literal(expr, entries, expected),
            ExprKind::Is(subject, te) => {
                let ty = self.resolve_type(te);
                let value = self.expr(subject, None);
                let tested = matches!(ty, Ty::Str | Ty::Int | Ty::Float | Ty::Bool | Ty::List(_));
                if !tested {
                    self.report(
                        Diagnostic::error(
                            "B0213",
                            te.span,
                            format!(
                                "`is` tests for a string, a number, a bool or a list, not {}",
                                self.show(&ty)
                            ),
                        )
                        .label("not a type JS can test")
                        .help("a Bloom type's cases are an enum's: `match` on it")
                        .spec("47-the-foreign-boundary"),
                    );
                } else if !matches!(self.resolve(&value), Ty::Foreign(_) | Ty::Unknown | Ty::Var(_)) {
                    self.report(
                        Diagnostic::error(
                            "B0213",
                            subject.span,
                            format!("`is` tests a TS value, and this is {}", self.show(&value)),
                        )
                        .label("its type is already known")
                        .help("a Bloom value's cases are an enum's: `match` on it")
                        .spec("47-the-foreign-boundary"),
                    );
                }
                self.out.is_tests.insert(expr.id, ty);
                Ty::Bool
            }
            ExprKind::CastAs(subject, te, forced) => {
                let target = self.resolve_type(te);
                let value = self.expr(subject, None);
                if let Ty::Strings(set) = self.resolve(&target)
                    && !set.token
                {
                    return self.union_cast(expr, subject, &value, &target, set, *forced);
                }
                if *forced {
                    self.report(
                        Diagnostic::error(
                            "B0213",
                            te.span,
                            format!(
                                "`as!` casts to a string literal union, and {} is not one",
                                self.show(&target)
                            ),
                        )
                        .label("not a literal union")
                        .help("write `as?` and handle `none`, or `x!` on an optional")
                        .spec("62-control-flow-and-errors-20"),
                    );
                    return target;
                }
                match self.cast_fn(&target) {
                    Some((func, f)) => {
                        if let Some(param) = f.params.first()
                            && !self.coerce(&value, &param.ty)
                        {
                            self.mismatch(subject.span, &value, &param.ty);
                        }
                        self.out.casts.insert(expr.id, func);
                        Ty::Option(Box::new(target))
                    }
                    None => {
                        self.no_cast(te.span, &target);
                        Ty::Option(Box::new(target))
                    }
                }
            }
            ExprKind::Spread(inner) => {
                self.report(
                    Diagnostic::error("B0207", expr.span, "`..` spreads a list into a list literal")
                        .label("not in `[…]`")
                        .help("write `[..a, b]`, or `S(..s)` for a struct")
                        .spec("6-expressions-and-control-flow"),
                );
                self.expr(inner, None)
            }
            ExprKind::Map(entries) => {
                let value = match &expected_resolved {
                    Some(Ty::Map(value)) => (**value).clone(),
                    _ => self.fresh(),
                };
                for (key, item) in entries {
                    self.expr(key, Some(&Ty::Str));
                    self.expr(item, Some(&value));
                }
                Ty::Map(Box::new(value))
            }
            ExprKind::Unary(op, operand) => match op {
                UnaryOp::Not => {
                    self.expr(operand, Some(&Ty::Bool));
                    Ty::Bool
                }
                UnaryOp::Neg => {
                    // A number, whatever optional is expected of the negation (`x ?? -1`).
                    let hint = match &expected_resolved {
                        Some(Ty::Option(inner)) => Some((**inner).clone()),
                        Some(Ty::Int | Ty::Float) => expected_resolved.clone(),
                        _ => None,
                    };
                    let ty = self.expr(operand, hint.as_ref());
                    let ty = self.resolve(&ty);
                    // A TS value negated is a number (`-event.translationY`), checked by TS.
                    if let Ty::Foreign(_) = ty {
                        self.out.foreign_checks.insert(operand.id, Ty::Float);
                        return Ty::Float;
                    }
                    if !matches!(ty, Ty::Int | Ty::Float | Ty::Unknown) {
                        self.operand_error(operand.span, "`-`", &ty);
                    }
                    ty
                }
            },
            ExprKind::Binary(op, lhs, rhs) => self.binary(expr, *op, lhs, rhs, expected_resolved.as_ref()),
            ExprKind::Ternary(cond, then, otherwise) => {
                // An item of a list literal (an open type): a chain that ends in `none` is the
                // optional of its branches, so they are not held to the first one's type.
                let open = expected.filter(|e| {
                    matches!(self.resolve(e), Ty::Var(_)) && (ends_in_none(then) || ends_in_none(otherwise))
                });
                if let Some(var) = open {
                    let var = var.clone();
                    let joined = self.infer(expr, None);
                    if !self.coerce(&joined, &var) {
                        self.mismatch(expr.span, &joined, &var);
                    }
                    return joined;
                }
                // In a child's place, so are its branches (`c ? Text(…) : xs.map(f)`).
                let slot = self.child_slots.contains(&expr.id);
                if slot {
                    self.child_slots.extend([then.id, otherwise.id]);
                }
                self.expr(cond, Some(&Ty::Bool));
                // A hook in a branch runs only sometimes (B0420).
                self.hook_allowed = false;
                // `p != none ? p.x : d` / `p == none ? d : p.x`: present in the branch that knows.
                self.push();
                self.narrow_present(cond);
                // With nothing expected, a string literal branch is its literal (`c ? "96" : "48"`
                // is `"96" | "48"`, as TS's `const` infers), so it fits a token set.
                let then_lit = expected.is_none().then(|| string_literal(then)).flatten();
                let a = match &then_lit {
                    Some(lit) => self.expr(then, Some(&lit.clone())),
                    None => self.expr(then, expected),
                };
                self.pop();
                // `c ? f : none` is `F?`: `none` is not held to the other branch's type.
                // An `Int` branch does not hold a `Float` one to `Int` (`c ? 0 : 0.5` is `Float`).
                let int = Ty::Int == self.resolve(&a);
                let else_lit = expected.is_none().then(|| string_literal(otherwise)).flatten();
                // `c ? x : d ? y : none` (R3): the rest of the chain ends in `none`, so it is held
                // to `x`'s optional, not to `x`'s type.
                // `c ? s : opt?.x`: the other branch may be `none` too (an optional chain), so it
                // is held to `s`'s optional and the two join to it.
                let optional_a = (expected.is_none()
                    && (ends_in_none(otherwise) || optional_chain(otherwise)))
                .then(|| Ty::Option(Box::new(a.clone())));
                let hint = match otherwise.kind {
                    _ if else_lit.is_some() => else_lit.as_ref(),
                    _ if then_lit.is_some() => None,
                    ExprKind::None => expected,
                    _ if int => expected,
                    _ if optional_a.is_some() => optional_a.as_ref(),
                    _ => expected.or(Some(&a)).filter(|_| !matches!(then.kind, ExprKind::None)),
                };
                // The first branch's type held to the other is inferred, not declared.
                if expected.is_none() {
                    inferred_calls(otherwise, &mut self.inferred_expected);
                }
                self.push();
                self.narrow(cond, BinaryOp::Eq, BinaryOp::Or);
                let b = self.expr(otherwise, hint);
                self.pop();
                // A view and a list of views, as a child: TS's `Child` is either.
                if slot
                    && (self.child_list(&a).is_some() || self.child_list(&b).is_some())
                    && [(&a, then), (&b, otherwise)].iter().all(|(t, e)| {
                        self.is_view(t) || self.child_list(t).is_some() || matches!(e.kind, ExprKind::None)
                    })
                {
                    return Ty::View(None);
                }
                self.join(&a, &b, expr.span)
            }
            ExprKind::Await(inner) => self.await_expr(expr, inner),
            ExprKind::Try(inner) => self.try_expr(expr, inner),
            ExprKind::Force(inner) => self.force(inner, expected_resolved.as_ref()),
            // `try f()`: a JS exception propagates; `try? f()` is `none` when it throws.
            ExprKind::Throwing(kind, inner) => {
                let expected_inner = match (kind, expected.map(|e| self.resolve(e))) {
                    (TryKind::Optional, Some(Ty::Option(inner))) => Some(*inner),
                    (TryKind::Optional, _) => None,
                    // `try await`: what is awaited may be a TS promise's `Result`, unwrapped below.
                    _ if matches!(inner.kind, ExprKind::Await(_)) => None,
                    (_, want) => want,
                };
                if *kind == TryKind::Plain {
                    self.unhandled_try(expr.span);
                }
                let outer = std::mem::replace(&mut self.trying, true);
                let ty = self.expr(inner, expected_inner.as_ref());
                self.trying = outer;
                // `try await` on a TS promise: its rejection is thrown, not a `Result`.
                if matches!(kind, TryKind::Plain | TryKind::Force)
                    && let ExprKind::Await(_) = &inner.kind
                    && self.out.awaits.get(&inner.id) == Some(&AwaitRes::Ts)
                    && let Ty::Result(value, _) = self.resolve(&ty)
                {
                    self.out.awaits.insert(inner.id, AwaitRes::Bloom);
                    self.out.types.insert(inner.id, (*value).clone());
                    return *value;
                }
                match (kind, self.resolve(&ty)) {
                    (TryKind::Optional, Ty::Option(_)) => ty,
                    (TryKind::Optional, Ty::Unit) => Ty::Unit,
                    (TryKind::Optional, _) => Ty::Option(Box::new(ty)),
                    _ => ty,
                }
            }
            ExprKind::Field(object, name) => self.field(expr, object, name),
            ExprKind::OptField(object, name) => {
                let ty = self.expr(object, None);
                match self.resolve(&ty) {
                    Ty::Option(inner) => {
                        let field = self.member(expr, &inner, name, object.span);
                        let claim = self.is_claim_only(object);
                        self.claim_link(expr, claim, &field);
                        self.rechain(expr, field)
                    }
                    Ty::Foreign(text) => foreign_of(&text, |t| format!("{t}[\"{}\"]", name.name)),
                    Ty::Unknown => Ty::Unknown,
                    // `viewPost?.authors` where TS says `viewPost` is always there: kept, as a guard.
                    other if self.ts_claimed(object, &ty) => {
                        let field = self.member(expr, &other, name, object.span);
                        self.claim_link(expr, true, &field);
                        self.rechain(expr, field)
                    }
                    other => {
                        self.report(
                            Diagnostic::error(
                                "B0201",
                                name.span,
                                format!("`?.` reads an optional, and this is {}", self.show(&other)),
                            )
                            .label("never `none`")
                            .help(format!("write `.{}`", name.name))
                            .fix(Span::new(name.span.start - 2, name.span.start), ".")
                            .spec("45-enums-option-and-result"),
                        );
                        self.member(expr, &other, name, object.span)
                    }
                }
            }
            ExprKind::OptIndex(object, index) => {
                let ty = self.expr(object, None);
                let inner = match self.resolve(&ty) {
                    Ty::Option(inner) => Some(self.resolve(&inner)),
                    Ty::Foreign(_) | Ty::Unknown => None,
                    // `post.tags?[0]` where TS says `tags` is always there: kept, as a guard.
                    other if self.ts_claimed(object, &ty) => Some(other),
                    other => {
                        self.report(
                            Diagnostic::error(
                                "B0201",
                                index.span,
                                format!("`?[…]` reads an optional, and this is {}", self.show(&other)),
                            )
                            .label("never `none`")
                            .help("write `[…]`")
                            .spec("45-enums-option-and-result"),
                        );
                        Some(other)
                    }
                };
                match inner {
                    Some(Ty::List(elem)) => {
                        self.expr(index, Some(&Ty::Int));
                        self.rechain(expr, *elem)
                    }
                    Some(Ty::Map(value)) => {
                        self.expr(index, Some(&Ty::Str));
                        self.rechain(expr, Ty::Option(value))
                    }
                    Some(Ty::Foreign(text)) => {
                        self.boundary(index, None);
                        foreign_of(&text, |t| format!("{t}[number]"))
                    }
                    None => {
                        self.boundary(index, None);
                        match self.resolve(&ty) {
                            Ty::Foreign(text) => foreign_of(&text, |t| format!("{t}[number]")),
                            _ => Ty::Unknown,
                        }
                    }
                    Some(Ty::Unknown) => Ty::Unknown,
                    Some(other) => {
                        self.expr(index, None);
                        self.report(
                            Diagnostic::error(
                                "B0205",
                                index.span,
                                format!("{} has no subscript", self.show(&other)),
                            )
                            .label("not a list or a dictionary")
                            .spec("12-standard-library-surface-draft"),
                        );
                        Ty::Unknown
                    }
                }
            }
            ExprKind::Index(object, index) => {
                let ty = self.expr(object, None);
                match self.resolve(&ty) {
                    // `xs[i]` is the element, as in Swift: out of range is a trap (dev
                    // builds check it), and `xs.at(i)` is the optional read.
                    Ty::List(elem) => {
                        self.expr(index, Some(&Ty::Int));
                        let optional = matches!(self.resolve(&elem), Ty::Option(_));
                        self.out.list_reads.insert(expr.id, optional);
                        *elem
                    }
                    Ty::Map(value) => {
                        self.expr(index, Some(&Ty::Str));
                        Ty::Option(value)
                    }
                    // `prefs[key]`: a key path's field.
                    ref root @ (Ty::Adt(..) | Ty::Partial(_)) if self.is_struct(root) => {
                        let (base, partial) = match root {
                            Ty::Partial(inner) => (self.resolve(inner), true),
                            other => (other.clone(), false),
                        };
                        let value = self.fresh();
                        let key = Ty::KeyPath(Box::new(base.clone()), Box::new(value.clone()));
                        match &index.kind {
                            ExprKind::KeyPath { .. } => {
                                self.expr(index, Some(&key));
                            }
                            // `SIZES[size]` with `size: "small" | "large"`, TS's `T[K]`: the
                            // fields those keys name, joined.
                            _ => {
                                let given = self.expr(index, None);
                                match self.resolve(&given) {
                                    Ty::Strings(set) if !set.values.is_empty() => {
                                        let fields = match &base {
                                            Ty::Adt(def, args) => self.out.defs[*def]
                                                .fields()
                                                .iter()
                                                .map(|f| (f.name.clone(), substitute(&f.ty, args)))
                                                .collect::<Vec<_>>(),
                                            _ => Vec::new(),
                                        };
                                        let mut joined: Option<Ty> = None;
                                        for key_name in &set.values {
                                            match fields.iter().find(|(n, _)| n == key_name) {
                                                Some((_, ty)) => {
                                                    joined = Some(match joined {
                                                        Some(j) => self.join(&j, ty, expr.span),
                                                        None => ty.clone(),
                                                    });
                                                }
                                                None => {
                                                    let name =
                                                        Ident { name: key_name.clone(), span: index.span };
                                                    self.unknown_field(&name, &base);
                                                }
                                            }
                                        }
                                        if let Some(joined) = joined {
                                            self.unify(&value, &joined);
                                        }
                                    }
                                    other => {
                                        if !self.coerce(&other, &key) {
                                            self.mismatch(index.span, &other, &key);
                                        }
                                    }
                                }
                            }
                        }
                        let value = self.resolve(&value);
                        match value {
                            Ty::Option(_) => value,
                            other if partial => Ty::Option(Box::new(other)),
                            other => other,
                        }
                    }
                    Ty::Foreign(text) => {
                        self.boundary(index, None);
                        foreign_of(&text, |t| format!("{t}[number]"))
                    }
                    Ty::Unknown => Ty::Unknown,
                    other => {
                        self.report(
                            Diagnostic::error(
                                "B0201",
                                object.span,
                                format!("{} cannot be indexed", self.show(&other)),
                            )
                            .label("not a list or a map")
                            .spec("12-standard-library-surface-draft"),
                        );
                        Ty::Unknown
                    }
                }
            }
            ExprKind::Call(call) => self.call(expr, call, expected_resolved.as_ref()),
            // `{}` where a struct (or a patch) is expected is an empty record, not a closure;
            // where its optional is expected too (`viewPost?.metadata ?? {}`, a TS type whose
            // fields are all optional).
            ExprKind::Closure(c)
                if c.params.is_empty()
                    && c.body.is_empty()
                    && matches!(&expected_resolved, Some(Ty::Adt(..) | Ty::Partial(_))) =>
            {
                self.record_literal(expr, &[], expected)
            }
            ExprKind::Closure(c)
                if c.params.is_empty()
                    && c.body.is_empty()
                    && let Some(Ty::Option(inner)) = &expected_resolved
                    && matches!(self.resolve(inner), Ty::Adt(..) | Ty::Partial(_)) =>
            {
                let inner = self.resolve(inner);
                self.record_literal(expr, &[], Some(&inner))
            }
            // Where a TS object type Bloom does not map is expected (`var patch: Prefs = {}`, a
            // `Partial<Record<K, V>>`): the empty object, as TS's `{}`. A TS function type Bloom
            // maps is a function, so a `Foreign` here is an object unless its text says otherwise.
            ExprKind::Closure(c)
                if c.params.is_empty()
                    && c.body.is_empty()
                    && matches!(&expected_resolved, Some(Ty::Foreign(text))
                        if !text.is_empty() && !text.contains("=>") && !text.contains("Parameters<")) =>
            {
                self.out.empty_objects.insert(expr.id);
                expected_resolved.clone().expect("matched")
            }
            ExprKind::Closure(c) => self.closure(c, expected_resolved.as_ref(), false),
            ExprKind::If(if_expr) => self.if_expr(if_expr, expected, expr.span),
            ExprKind::Match(m) => self.match_expr(m, expected, expr.span),
        }
    }

    fn operand_error(&mut self, span: Span, op: &str, ty: &Ty) {
        if matches!(ty, Ty::Foreign(_)) {
            self.mismatch(span, ty, &Ty::Float);
            return;
        }
        self.report(
            Diagnostic::error("B0201", span, format!("{op} does not apply to {}", self.show(ty)))
                .label(format!("this is {}", self.show(ty)))
                .spec("61-precedence-high-to-low"),
        );
    }

    fn string(&mut self, expr: &Expr, parts: &[StrPart], expected: Option<&Ty>) -> Ty {
        let mut interpolated = false;
        for part in parts {
            if let StrPart::Interp(inner) = part {
                interpolated = true;
                let ty = self.expr(inner, None);
                match self.resolve(&ty) {
                    Ty::Str
                    | Ty::Int
                    | Ty::Float
                    | Ty::Bool
                    | Ty::Strings(_)
                    | Ty::Foreign(_)
                    | Ty::Unknown
                    | Ty::Var(_) => {}
                    Ty::Adt(def, _) if self.out.defs[def].is_fieldless() => {}
                    Ty::Option(_) => self.report(
                        Diagnostic::error("B0201", inner.span, "an optional is interpolated")
                            .label("it may be `none`, which would print `undefined`")
                            .help("unwrap it first: `${name ?? \"\"}`")
                            .spec("2-lexical-structure"),
                    ),
                    other => self.report(
                        Diagnostic::error(
                            "B0201",
                            inner.span,
                            format!("{} is interpolated into a string", self.show(&other)),
                        )
                        .label("not text, a number or a Bool")
                        .help("interpolate one of its fields")
                        .spec("2-lexical-structure"),
                    ),
                }
            }
        }
        // A literal where an optional choice is expected (`tone ?? "calm"`) is one of its strings.
        let expected = match expected {
            Some(Ty::Option(inner)) => match self.resolve(inner) {
                Ty::Strings(set) => Some(Ty::Strings(set)),
                _ => None,
            },
            other => other.cloned(),
        };
        if let (Some(Ty::Strings(set)), false) = (expected.as_ref(), interpolated) {
            let text = plain_text(parts);
            if ui::token_ok(set, &text) {
                return Ty::Strings(set.clone());
            }
            self.bad_token(expr.span, set, &text, None);
            return Ty::Strings(set.clone());
        }
        Ty::Str
    }

    /// B0502: a literal that is not one of the set's tokens.
    pub fn bad_token(&mut self, span: Span, set: &Rc<StrSet>, text: &str, modifier: Option<&str>) {
        let kind = if set.token { format!("{} token", set.name) } else { format!("`{}`", set.name) };
        let suggestion = ui::closest_token(set, text);
        let shown: Vec<&str> = set
            .values
            .iter()
            .map(String::as_str)
            .filter(|t| {
                !t.starts_with('-')
                    && !t.chars().all(|c| c.is_ascii_digit() || c == '.' || c == '%' || c == '/')
            })
            .collect();
        let label = if shown.len() <= 16 {
            format!("expected one of: {}", shown.join(" "))
        } else {
            format!("expected one of: {} …", shown[..16].join(" "))
        };
        let mut diagnostic = Diagnostic::error("B0502", span, format!("`\"{text}\"` is not a {kind}"))
            .label(label)
            .docs(if set.token {
                ui::token_docs(set)
            } else {
                format!("{}#47-the-foreign-boundary", crate::diagnostic::SPEC_DOCS)
            });
        if let Some(near) = suggestion {
            diagnostic =
                diagnostic.help(format!("did you mean `\"{near}\"`?")).fix(span, format!("\"{near}\""));
        } else if let Some(modifier) = modifier {
            diagnostic = diagnostic.help(format!("see the tokens `.{modifier}()` takes"));
        }
        self.report(diagnostic);
    }

    fn name(&mut self, expr: &Expr, name: &str) -> Ty {
        if let Some(local) = self.lookup(name) {
            self.out.names.insert(expr.id, NameRes::Local(local));
            if self.out.async_lets.contains(&local) {
                self.report(
                    Diagnostic::error(
                        "B0227",
                        expr.span,
                        format!("`{name}` is an `async let`: read it with `await {name}`"),
                    )
                    .label("its result is not there yet")
                    .fix(Span::new(expr.span.start, expr.span.start), "await ")
                    .spec("8-effects-tasks-and-concurrency"),
                );
            }
            let info = self.out.locals[local].clone();
            if info.kind == LocalKind::Var && info.frame != self.frames.len() - 1 {
                self.var_captured(&info, expr.span);
            }
            if info.kind == LocalKind::Ref {
                if self.ref_object {
                    // `.ref(x)`: the ref itself, for the host view to fill.
                    self.out.ref_objects.insert(expr.id);
                } else if self.frames.last().is_some_and(|f| f.render) {
                    self.ref_in_render(name, expr.span);
                }
            }
            if info.kind == LocalKind::State && self.frames.last().is_some_and(|f| f.written.contains(&local))
            {
                self.report(
                    Diagnostic::error(
                        "B0410",
                        expr.span,
                        format!("`{name}` is read after it is written in this closure"),
                    )
                    .label("this reads the value the view drew with, not the new one")
                    .help(format!("bind the new value first: `let next = …; {name} = next`, then use `next`"))
                    .spec("73-reactivity-compile-time"),
                );
            }
            return self.instantiate(&info.ty);
        }
        match name {
            "ok" | "err" | "fail" | "toast" | "navigate" | "sleep" | "all" | "race" | "Binding" | "Regex"
            | "catching" | "min" | "max" | "abs" | "round" | "floor" | "ceil" => {
                self.report(
                    Diagnostic::error("B0208", expr.span, format!("`{name}` is called, not passed"))
                        .label("call it")
                        .help(format!("write `{name}(…)`"))
                        .spec("10-modules-and-interop"),
                );
                return Ty::Unknown;
            }
            _ => {}
        }
        if ui::node_by_constructor(name).is_some() {
            self.report(
                Diagnostic::error("B0208", expr.span, format!("`{name}` is a node: call it"))
                    .label("a node constructor")
                    .help(format!("write `{name}(…)` or `{name} {{ … }}`"))
                    .spec("72-builders-modifiers-and-tokens"),
            );
            return Ty::Unknown;
        }
        if self.type_names.contains_key(name) {
            self.report(
                Diagnostic::error("B0208", expr.span, format!("`{name}` is a type, not a value"))
                    .label("a type")
                    .help(format!("construct it (`{name}(…)`) or name one of its cases (`{name}.case`)"))
                    .spec("41-the-types"),
            );
            return Ty::Unknown;
        }
        self.unknown_name(expr.span, name);
        Ty::Unknown
    }

    fn unknown_name(&mut self, span: Span, name: &str) {
        let names = self.names_in_scope();
        let help =
            closest(name, names.iter().map(String::as_str)).map(|near| format!("did you mean `{near}`?"));
        let mut diagnostic = Diagnostic::error("B0202", span, format!("cannot find `{name}` in scope"))
            .label("not declared")
            .maybe_help(help.clone())
            .spec("10-modules-and-interop");
        if help.is_none() && name.chars().next().is_some_and(|c| c.is_ascii_lowercase()) {
            diagnostic = diagnostic.help("declare it with `let`, or import it from its module");
        }
        self.report(diagnostic);
    }

    /// A generic function's type with fresh variables for its parameters.
    fn instantiate(&mut self, ty: &Ty) -> Ty {
        match ty {
            Ty::Fn(f) if f.generics > 0 => {
                let args: Vec<Ty> = (0..f.generics).map(|_| self.fresh()).collect();
                let params =
                    f.params.iter().map(|p| ParamTy { ty: substitute(&p.ty, &args), ..p.clone() }).collect();
                let bounds = f.bounds.iter().map(|(t, p)| (substitute(t, &args), p.clone())).collect();
                let shapes = f
                    .shapes
                    .iter()
                    .map(|(t, shape)| (substitute(t, &args), substitute(shape, &args)))
                    .collect();
                Ty::Fn(Rc::new(FnTy {
                    params,
                    ret: substitute(&f.ret, &args),
                    bounds,
                    shapes,
                    generics: 0,
                    ..(**f).clone()
                }))
            }
            _ => ty.clone(),
        }
    }

    fn implicit_member(&mut self, expr: &Expr, name: &Ident, expected: Option<&Ty>) -> Ty {
        // The base of a chain (`.dateTime.month(.abbreviated).day()`): the chain's expected type.
        let chained = self.implicit_chains.remove(&expr.id);
        let target = match expected.or(chained.as_ref()) {
            Some(Ty::Option(inner)) => self.resolve(inner),
            Some(other) => self.resolve(other),
            None => Ty::Unknown,
        };
        match &target {
            Ty::Adt(def, args) if matches!(self.out.defs[*def].kind, DefKind::Enum(_)) => {
                let d = self.out.defs[*def].clone();
                match d.variants().iter().position(|v| v.name == name.name) {
                    Some(index) => {
                        if !d.variants()[index].payload.is_empty() {
                            self.report(
                                Diagnostic::error(
                                    "B0207",
                                    expr.span,
                                    format!("`.{}` carries a value", name.name),
                                )
                                .label("call it with its payload")
                                .help(format!("write `.{}(…)`", name.name))
                                .spec("45-enums-option-and-result"),
                            );
                        }
                        self.out.fields.insert(expr.id, FieldRes::EnumCase(*def, index));
                        Ty::Adt(*def, args.clone())
                    }
                    None => {
                        let names: Vec<&str> = d.variants().iter().map(|v| v.name.as_str()).collect();
                        self.unknown_case(name, &names, &target);
                        Ty::Unknown
                    }
                }
            }
            // `.relative`, `.dateTime` where a `DateFormat` is expected: a static member of the
            // struct, as Swift's implicit member expression reads one.
            Ty::Adt(def, _)
                if matches!(self.out.defs[*def].kind, DefKind::Struct(_))
                    && let Some(ty) = {
                        let owner = self.out.defs[*def].name.clone();
                        self.static_member(expr, &owner, name)
                    } =>
            {
                ty
            }
            _ => {
                self.report(
                    Diagnostic::error("B0212", expr.span, format!("which type's case is `.{}`?", name.name))
                        .label("no enum type is expected here")
                        .help(format!("name the type: `Type.{}`", name.name))
                        .spec("3-grammar-ebnf"),
                );
                Ty::Unknown
            }
        }
    }

    fn is_struct(&self, ty: &Ty) -> bool {
        match self.resolve(ty) {
            Ty::Adt(def, _) => matches!(self.out.defs[def].kind, DefKind::Struct(_)),
            Ty::Partial(inner) => self.is_struct(&inner),
            _ => false,
        }
    }

    /// `\.field` (its struct from the expected `KeyPath<S, V>`) or `\S.field`.
    fn key_path(&mut self, expr: &Expr, root: Option<&Ident>, path: &[Ident], expected: Option<&Ty>) -> Ty {
        let expected_root = match expected {
            Some(Ty::KeyPath(root, _)) => Some(self.resolve(root)),
            Some(Ty::Option(inner)) => match self.resolve(inner) {
                Ty::KeyPath(root, _) => Some(self.resolve(&root)),
                _ => None,
            },
            _ => None,
        };
        let root_ty = match root {
            Some(name) => match self.type_names.get(&name.name).cloned() {
                Some(TypeName::Def(def)) if matches!(self.out.defs[def].kind, DefKind::Struct(_)) => {
                    let args = match &expected_root {
                        Some(Ty::Adt(d, args)) if *d == def => args.clone(),
                        _ => (0..self.out.defs[def].generics.len()).map(|_| self.fresh()).collect(),
                    };
                    Ty::Adt(def, args)
                }
                _ => {
                    self.report(
                        Diagnostic::error("B0204", name.span, format!("`{}` is not a struct", name.name))
                            .label("a key path starts at a struct")
                            .spec("44-structs"),
                    );
                    return Ty::Unknown;
                }
            },
            None => match expected_root {
                Some(ty @ Ty::Adt(..)) => ty,
                _ => {
                    self.report(
                        Diagnostic::error("B0212", expr.span, "which struct is this key path into?")
                            .label("no `KeyPath<S, V>` is expected here")
                            .help(format!(
                                "name the struct: `\\Type.{}`",
                                path.first().map_or("field", |f| f.name.as_str())
                            ))
                            .spec("44-structs"),
                    );
                    return Ty::Unknown;
                }
            },
        };
        let Some(field) = path.first() else { return Ty::Unknown };
        if let Some(extra) = path.get(1) {
            self.report(
                Diagnostic::error("B0221", extra.span, "a key path names one field")
                    .label("a nested field")
                    .help("take the key path of the inner struct, and read it from the field")
                    .spec("44-structs"),
            );
        }
        let Ty::Adt(def, args) = &root_ty else { return Ty::Unknown };
        let Some(f) = self.out.defs[*def].fields().iter().find(|f| f.name == field.name).cloned() else {
            self.unknown_field(field, &root_ty);
            return Ty::Unknown;
        };
        self.out.fields.insert(expr.id, FieldRes::Field);
        Ty::KeyPath(Box::new(root_ty.clone()), Box::new(substitute(&f.ty, args)))
    }

    fn binding(&mut self, expr: &Expr, path: &[Ident]) -> Ty {
        let root = &path[0];
        let Some(local) = self.lookup(&root.name) else {
            self.unknown_name(root.span, &root.name);
            return Ty::Unknown;
        };
        let info = self.out.locals[local].clone();
        if info.kind == LocalKind::Bound && path.len() == 1 {
            self.out.bindings.insert(expr.id, (local, Vec::new()));
            return Ty::Binding(Box::new(info.ty.clone()));
        }
        if info.kind != LocalKind::State {
            self.report(
                Diagnostic::error(
                    "B0505",
                    expr.span,
                    format!("`${}` binds a state, and `{}` is not one", root.name, root.name),
                )
                .label("not a `@state`")
                .with_label(info.span, "declared here")
                .help(format!(
                    "declare it `@state {} = …` in the view, or pass a `Binding(get: …, set: {{ v in … }})`",
                    root.name
                ))
                .spec("72-builders-modifiers-and-tokens"),
            );
            return Ty::Unknown;
        }
        let mut ty = info.ty.clone();
        let mut fields = Vec::new();
        for field in &path[1..] {
            ty = match self.resolve(&ty) {
                Ty::Adt(def, args) if matches!(self.out.defs[def].kind, DefKind::Struct(_)) => {
                    match self.out.defs[def].fields().iter().find(|f| f.name == field.name) {
                        Some(f) => substitute(&f.ty, &args),
                        None => {
                            self.unknown_field(field, &Ty::Adt(def, args));
                            return Ty::Unknown;
                        }
                    }
                }
                other => {
                    self.report(
                        Diagnostic::error(
                            "B0505",
                            field.span,
                            format!("{} has no fields to bind", self.show(&other)),
                        )
                        .label("not a struct")
                        .spec("72-builders-modifiers-and-tokens"),
                    );
                    return Ty::Unknown;
                }
            };
            fields.push(field.name.clone());
        }
        self.out.bindings.insert(expr.id, (local, fields));
        Ty::Binding(Box::new(ty))
    }

    fn binary(&mut self, expr: &Expr, op: BinaryOp, lhs: &Expr, rhs: &Expr, expected: Option<&Ty>) -> Ty {
        match op {
            // `a..<b`, `a...b`: a collection of `Int`s, typed `[Int]`. A `for` over it and its
            // `.map` build no array of their own (section 6.3).
            // `0...3` where a `ClosedRange<Int>` is expected (`formatted(fractionDigits: 0...3)`):
            // Swift's range value, its two bounds.
            BinaryOp::Closed
                if let Some(Ty::Adt(def, args)) = expected.map(|e| match self.resolve(e) {
                    Ty::Option(inner) => self.resolve(&inner),
                    other => other,
                }) && self.out.defs[def].name == "ClosedRange"
                    && matches!(self.out.defs[def].kind, DefKind::Struct(_)) =>
            {
                let bound = args.first().cloned().unwrap_or(Ty::Int);
                for side in [lhs, rhs] {
                    self.expr(side, Some(&bound));
                }
                self.out.calls.insert(expr.id, CallRes::Struct(def));
                Ty::Adt(def, args)
            }
            BinaryOp::HalfOpen | BinaryOp::Closed => {
                for side in [lhs, rhs] {
                    let ty = self.expr(side, Some(&Ty::Int));
                    if !self.coerce(&ty, &Ty::Int) {
                        self.mismatch(side.span, &ty, &Ty::Int);
                    }
                }
                Ty::List(Box::new(Ty::Int))
            }
            BinaryOp::And | BinaryOp::Or => {
                let left = self.expr(lhs, None);
                // A hook on the right runs only sometimes (B0420).
                self.hook_allowed = false;
                // `f || b` of a TS value `f`: JS's value `||`, `b` when `f` is falsy, typed
                // as `b` and checked by tsc (`satisfies`).
                if op == BinaryOp::Or
                    && matches!(self.resolve(&left), Ty::Foreign(_))
                    && !matches!(expected.map(|e| self.resolve(e)), Some(Ty::Bool))
                {
                    let right = self.expr(rhs, expected);
                    match self.resolve(&right) {
                        Ty::Bool | Ty::Foreign(_) | Ty::Unknown => {}
                        _ => {
                            self.out.foreign_checks.insert(expr.id, right.clone());
                        }
                    }
                    return right;
                }
                // `title || "Untitled"` of an optional that is not a `Bool` (a TS `string | null`
                // reads as `String?`): JS's value `||` too, the other side when it is absent or
                // falsy, as the TS it came from wrote it.
                if op == BinaryOp::Or
                    && let Ty::Option(inner) = self.resolve(&left)
                    && !matches!(self.resolve(&inner), Ty::Bool)
                    && !matches!(expected.map(|e| self.resolve(e)), Some(Ty::Bool))
                {
                    // The other side may be absent too (`user.username || user.handle`): then
                    // so is the whole, as JS's `||` gives it.
                    let optional = Ty::Option(inner.clone());
                    let right = self.expr(rhs, Some(&optional));
                    let mut inside = rhs;
                    while let ExprKind::Paren(e) = &inside.kind {
                        inside = e;
                    }
                    let own = self.out.types.get(&inside.id).cloned().unwrap_or(right);
                    let own = match self.resolve(&own) {
                        // Checked as the optional (`satisfies T | undefined`).
                        Ty::Foreign(_) => return optional,
                        Ty::Option(r) => *r,
                        other => other,
                    };
                    let joined = self.join(&inner, &own, expr.span);
                    return if self.may_be_absent(rhs) { Ty::Option(Box::new(joined)) } else { joined };
                }
                // As `expr(lhs, Some(Bool))` would have.
                if let Some(recorded) = &mut self.expected {
                    recorded.push((lhs.span, Ty::Bool));
                }
                if matches!(self.resolve(&left), Ty::Foreign(_)) {
                    self.out.foreign_checks.insert(lhs.id, Ty::Bool);
                } else if !self.coerce(&left, &Ty::Bool) {
                    self.mismatch(lhs.span, &left, &Ty::Bool);
                }
                // `x != none && x.isEmpty`: `x` is present on the right of `&&`.
                // `x == none || x.isEmpty`: present on the right of `||`.
                self.push();
                if op == BinaryOp::And {
                    self.narrow_present(lhs);
                } else {
                    self.narrow(lhs, BinaryOp::Eq, BinaryOp::Or);
                }
                self.expr(rhs, Some(&Ty::Bool));
                self.pop();
                Ty::Bool
            }
            BinaryOp::Default => {
                let left = self.expr(lhs, None);
                // A hook on the right runs only sometimes (B0420).
                self.hook_allowed = false;
                // `ts.authors ?? []` where TS says `authors` is always there: TS's claim, so the
                // fallback is kept, as for an optional.
                let left = match self.resolve(&left) {
                    Ty::Option(_) | Ty::Unknown | Ty::Foreign(_) | Ty::Var(_) => left,
                    other if self.ts_claimed(lhs, &left) => Ty::Option(Box::new(other)),
                    _ => left,
                };
                match self.resolve(&left) {
                    // `viewPost?.metadata ?? {}` where TS's type has required fields: TS's
                    // `State | {}`, every field optional, so it is a `Partial<State>`.
                    Ty::Option(inner)
                        if is_empty_braces(rhs)
                            && expected.is_none_or(|e| matches!(self.resolve(e), Ty::Var(_)))
                            && self.ts_claimed(lhs, &left)
                            && matches!(self.resolve(&inner), Ty::Adt(def, _)
                                if matches!(self.out.defs[def].kind, DefKind::Struct(_))
                                    && self.out.defs[def].fields().iter().any(|f| f.default == FieldDefault::None
                                        && !matches!(f.ty, Ty::Option(_)))) =>
                    {
                        let partial = Ty::Partial(inner.clone());
                        self.expr(rhs, Some(&partial));
                        self.out.partial_fallbacks.insert(rhs.id);
                        partial
                    }
                    Ty::Option(inner) => {
                        // A literal's optional (`c ? "x" : none`) falls back to any string, as TS's
                        // `"x" | ""`: the two are joined (R3).
                        let literal = matches!(self.resolve(&inner), Ty::Strings(set) if !set.token);
                        let hint = match expected {
                            Some(e) => e.clone(),
                            None if literal => Ty::Str,
                            None => (*inner).clone(),
                        };
                        let right = self.expr(rhs, Some(&Ty::Option(Box::new(hint.clone()))));
                        let _ = right;
                        // `x ?? y` is optional only when `y` is.
                        let right_ty = self.out.types.get(&rhs.id).cloned().unwrap_or(Ty::Unknown);
                        match self.resolve(&right_ty) {
                            Ty::Option(_) => Ty::Option(inner),
                            // `x ?? foreign` (`user.color ?? cached?.color`): TS's, checked where it lands.
                            Ty::Foreign(_) => right_ty,
                            Ty::Str | Ty::Strings(_) if literal => self.join(&inner, &right_ty, expr.span),
                            _ => {
                                if self.coerce(&right_ty, &inner) {
                                    return *inner;
                                }
                                // Both sides fit what is expected (`headerAuthors ?? []` where a
                                // `[PostUser]` is taken, `HydratedAuthor` extending `PostUser`).
                                if let Some(e) = expected
                                    && self.coerce(&inner, e)
                                    && self.coerce(&right_ty, e)
                                {
                                    return e.clone();
                                }
                                self.mismatch(rhs.span, &right_ty, &inner);
                                *inner
                            }
                        }
                    }
                    Ty::Unknown => {
                        self.expr(rhs, None);
                        Ty::Unknown
                    }
                    Ty::Foreign(path) => {
                        // `foreign ?? e` takes `e`'s type (the left side may be `null` in TS too);
                        // TS checks the whole where it lands, typed as `e`. When `e` says less than
                        // TS knows (`data ?? []`), its items are the TS value's (`NonNullable<…>[number]`).
                        let right = self.expr(rhs, expected);
                        let present = format!("NonNullable<{path}>");
                        match self.resolve(&right) {
                            Ty::List(item) if matches!(self.resolve(&item), Ty::Var(_)) => {
                                self.unify(&item, &Ty::Foreign(format!("{present}[number]").into()));
                            }
                            Ty::Map(value) if matches!(self.resolve(&value), Ty::Var(_)) => {
                                self.unify(&value, &Ty::Foreign(format!("{present}[string]").into()));
                            }
                            _ => {}
                        }
                        right
                    }
                    other => {
                        self.report(
                            Diagnostic::error(
                                "B0201",
                                lhs.span,
                                format!(
                                    "`??` gives a fallback for an optional, and this is {}",
                                    self.show(&other)
                                ),
                            )
                            .label("never `none`")
                            .help("remove `?? …`: the value is always there")
                            .spec("45-enums-option-and-result"),
                        );
                        self.expr(rhs, None);
                        other
                    }
                }
            }
            BinaryOp::Eq | BinaryOp::Ne => {
                let left = self.expr(lhs, None);
                // `T == T?` compares as optionals (as Swift does).
                let hint = match self.resolve(&left) {
                    Ty::Option(_) | Ty::Unknown | Ty::Var(_) | Ty::Never => left.clone(),
                    other => Ty::Option(Box::new(other)),
                };
                // A literal union (`Tab?`, TS's `'videos' | 'following'`) compares with any
                // `String`, as TS's does; a string literal is still held to its values (R3).
                let hint = match self.resolve(&hint) {
                    Ty::Option(inner)
                        if matches!(self.resolve(&inner), Ty::Strings(_))
                            && string_literal(rhs).is_none() =>
                    {
                        Ty::Option(Box::new(Ty::Str))
                    }
                    _ => hint,
                };
                self.expr(rhs, Some(&hint));
                // The right side's own type (`expr` gives back the expected one).
                let right = self.out.types.get(&rhs.id).cloned().unwrap_or(Ty::Unknown);
                let optional =
                    matches!(self.resolve(&right), Ty::Option(_)) && !matches!(rhs.kind, ExprKind::None);
                let ty = if optional { self.zonk(&hint) } else { self.zonk(&left) };
                // `x != none` tests presence, whatever `x` holds.
                let presence = matches!(lhs.kind, ExprKind::None) || matches!(rhs.kind, ExprKind::None);
                if let Some(witness) = self.equatable_param(&ty) {
                    self.out.witness_eq.insert(expr.id, witness);
                    return Ty::Bool;
                }
                match if presence { Equality::Identity } else { equality(&self.out.defs, &ty) } {
                    Equality::Identity => {}
                    Equality::Structural => {
                        self.out.structural.insert(expr.id, ty);
                    }
                    Equality::None(part) => {
                        let what = if part == ty {
                            self.show(&ty)
                        } else {
                            format!("{} (it holds {})", self.show(&ty), self.show(&part))
                        };
                        let help = match part {
                            Ty::Param(..) => {
                                "compare a field of it, or take a comparison function: `(T, T) -> Bool`"
                            }
                            _ => "compare what they hold (a field, an id) instead",
                        };
                        self.report(
                            Diagnostic::error("B0210", lhs.span.to(rhs.span), format!("`{}` cannot compare {what}", op.text()))
                                .label("functions, views, bindings, pending calls and type parameters have no equality")
                                .help(help)
                                .spec("43-soundness-rules"),
                        );
                    }
                }
                Ty::Bool
            }
            BinaryOp::Lt | BinaryOp::Le | BinaryOp::Gt | BinaryOp::Ge => {
                let left = self.expr(lhs, None);
                let left = self.resolve(&left);
                // A TS value compared with a number (or a string) is one (`item.pokeCount > 1`):
                // the emitted `satisfies` lets TS check it, as in arithmetic. Two TS values are
                // compared as TS compares them.
                if let Ty::Foreign(_) = left {
                    let right = self.expr(rhs, None);
                    let checked = match self.actual(rhs, &right) {
                        Ty::Int | Ty::Float => Some(Ty::Float),
                        Ty::Str | Ty::Strings(_) => Some(Ty::Str),
                        Ty::Foreign(_) | Ty::Unknown | Ty::Never | Ty::Var(_) => None,
                        other => {
                            self.operand_error(rhs.span, &format!("`{}`", op.text()), &other);
                            None
                        }
                    };
                    if let Some(ty) = checked {
                        self.out.foreign_checks.insert(lhs.id, ty);
                    }
                    return Ty::Bool;
                }
                if !matches!(left, Ty::Int | Ty::Float | Ty::Str | Ty::Strings(_) | Ty::Unknown | Ty::Var(_))
                {
                    self.operand_error(lhs.span, &format!("`{}`", op.text()), &left);
                }
                let hint = if matches!(left, Ty::Strings(_)) { Ty::Str } else { left };
                self.expr(rhs, Some(&hint));
                Ty::Bool
            }
            BinaryOp::Add | BinaryOp::Sub | BinaryOp::Mul | BinaryOp::Div | BinaryOp::Rem => {
                let left = self.expr(lhs, expected.filter(|e| matches!(e, Ty::Int | Ty::Float)));
                // The operand's own type: an `Int` stays one where a `Float` is expected, so
                // `i / j` truncates even then.
                let left = self.actual(lhs, &left);
                match &left {
                    Ty::Str | Ty::Strings(_) if op == BinaryOp::Add => {
                        let right = self.expr(rhs, None);
                        if !matches!(self.resolve(&right), Ty::Str | Ty::Strings(_) | Ty::Unknown) {
                            self.report(
                                Diagnostic::error(
                                    "B0201",
                                    rhs.span,
                                    format!("`+` joins strings, and this is {}", self.show(&right)),
                                )
                                .label("not a String")
                                .help("interpolate it instead: `\"${a}${b}\"`")
                                .spec("61-precedence-high-to-low"),
                            );
                        }
                        Ty::Str
                    }
                    Ty::Float => {
                        self.expr(rhs, Some(&left));
                        left
                    }
                    // `Int` with a `Float` is a `Float` (the `Int` widens).
                    Ty::Int => {
                        let right = self.expr(rhs, expected.filter(|e| matches!(e, Ty::Int | Ty::Float)));
                        match self.actual(rhs, &right) {
                            Ty::Float => Ty::Float,
                            Ty::Int | Ty::Unknown | Ty::Never => Ty::Int,
                            Ty::Var(_) => {
                                self.unify(&right, &Ty::Int);
                                Ty::Int
                            }
                            // A TS value beside an `Int` is a number (`2 * Math.PI`).
                            Ty::Foreign(_) => {
                                self.out.foreign_checks.insert(rhs.id, Ty::Float);
                                Ty::Float
                            }
                            other => {
                                self.mismatch(rhs.span, &other, &Ty::Int);
                                Ty::Int
                            }
                        }
                    }
                    Ty::Var(_) => {
                        let right = self.expr(rhs, None);
                        self.unify(&left, &right);
                        right
                    }
                    Ty::Unknown => {
                        self.expr(rhs, None);
                        Ty::Unknown
                    }
                    // A TS value beside a number (or, for `+`, a string) is one (`insets.top + 4`):
                    // the emitted `satisfies` lets TS check it.
                    Ty::Foreign(_) => {
                        let right = self.expr(rhs, expected.filter(|e| matches!(e, Ty::Int | Ty::Float)));
                        let ty = match self.actual(rhs, &right) {
                            Ty::Int | Ty::Float => Ty::Float,
                            Ty::Str | Ty::Strings(_) if op == BinaryOp::Add => Ty::Str,
                            Ty::Foreign(_) | Ty::Unknown => return right,
                            other => {
                                self.operand_error(rhs.span, &format!("`{}`", op.text()), &other);
                                return Ty::Unknown;
                            }
                        };
                        self.out.foreign_checks.insert(lhs.id, ty.clone());
                        ty
                    }
                    other => {
                        self.operand_error(lhs.span, &format!("`{}`", op.text()), other);
                        self.expr(rhs, None);
                        Ty::Unknown
                    }
                }
            }
        }
    }

    /// A Bloom view where TS takes a React element crosses as one (`toElement(view)`); an
    /// optional one is, branch by branch (`bare ? none : Text("foot")`), and otherwise whole.
    pub(super) fn element(&mut self, expr: &Expr) {
        if matches!(expr.kind, ExprKind::None) {
            return;
        }
        let Some(ty) = self.out.types.get(&expr.id).cloned() else { return };
        match self.resolve(&ty) {
            Ty::View(_) => {
                self.out.elements.insert(expr.id);
            }
            Ty::Option(inner) if matches!(self.resolve(&inner), Ty::View(_)) => match &expr.kind {
                ExprKind::Paren(inside) => self.element(inside),
                ExprKind::Ternary(_, then, otherwise) => {
                    self.element(then);
                    self.element(otherwise);
                }
                _ => {
                    self.out.elements.insert(expr.id);
                }
            },
            _ => {}
        }
    }

    /// Whether `expr`, checked against an optional, may be `none`: its own type, through the
    /// branches and fallbacks that pass the optional down (`(a || (c ? b : d))`).
    fn may_be_absent(&self, expr: &Expr) -> bool {
        match &expr.kind {
            ExprKind::None => true,
            ExprKind::Paren(inner) => self.may_be_absent(inner),
            ExprKind::Ternary(_, then, otherwise) => {
                self.may_be_absent(then) || self.may_be_absent(otherwise)
            }
            // `a || "user"` of an optional or a TS value (`displayName || "user"`): absent only when
            // its right side may be, in parentheses or not.
            ExprKind::Binary(BinaryOp::Or | BinaryOp::Default, lhs, rhs)
                if matches!(
                    self.out.types.get(&lhs.id).map(|t| self.resolve(t)),
                    Some(Ty::Option(_) | Ty::Foreign(_))
                ) =>
            {
                self.may_be_absent(rhs)
            }
            _ => matches!(self.out.types.get(&expr.id).map(|t| self.resolve(t)), Some(Ty::Option(_))),
        }
    }

    /// The type `expr` has itself, before it met what was expected of it (`returned`).
    fn actual(&mut self, expr: &Expr, returned: &Ty) -> Ty {
        match self.out.types.get(&expr.id).map(|own| self.resolve(own)) {
            // A TS value taken as what was expected (its `satisfies` checks it).
            Some(Ty::Foreign(_)) | None => self.resolve(returned),
            Some(own) => own,
        }
    }

    /// `async let x = f()`: `f()` starts now; `x` holds its promise until `await x`.
    fn async_let(&mut self, l: &LetStmt) {
        let frame = self.frames.last().expect("a frame");
        if !frame.is_async || frame.closure {
            self.report(
                Diagnostic::error("B0215", l.span, "`async let` is only allowed in an async function")
                    .label("this function is not async")
                    .help("mark the function `async`")
                    .spec("8-effects-tasks-and-concurrency"),
            );
        }
        let PatternKind::Bind(name) = &l.pattern.kind else {
            self.report(
                Diagnostic::error("B0227", l.pattern.span, "`async let` binds one name")
                    .label("not a name")
                    .help("write `async let x = f()`, and destructure `await x`")
                    .spec("8-effects-tasks-and-concurrency"),
            );
            return;
        };
        // Its errors surface where it is awaited (`try await x`), not here.
        let before = self.out.diagnostics.len();
        let ty = self.expr(&l.value, None);
        let mut throws = false;
        let mut index = before;
        while index < self.out.diagnostics.len() {
            if self.out.diagnostics[index].code == "B0223" {
                let removed = self.out.diagnostics.remove(index);
                self.reported.remove(&removed.span);
                throws = true;
            } else {
                index += 1;
            }
        }
        let value = match self.resolve(&ty) {
            Ty::Async(value) => *value,
            Ty::Unknown => Ty::Unknown,
            other => {
                self.report(
                    Diagnostic::error(
                        "B0215",
                        l.value.span,
                        format!("`async let` starts an async call, and this is {}", self.show(&other)),
                    )
                    .label("not an async call")
                    .help("write `let`")
                    .spec("8-effects-tasks-and-concurrency"),
                );
                other
            }
        };
        if let Some(declared) = l.ty.as_ref().map(|t| self.resolve_type(t))
            && !self.unify(&value, &declared)
        {
            self.mismatch(l.value.span, &value, &declared);
        }
        let local = self.declare(name, Ty::Async(Box::new(value)), LocalKind::Let);
        self.out.async_lets.insert(local);
        self.pending.insert(local, (throws, self.scopes.len()));
    }

    /// `await x` of an `async let` (or `await (a, b)` of several): its result, once.
    fn await_pending(&mut self, expr: &Expr, inner: &Expr) -> Option<Ty> {
        let names: Vec<&Expr> = match &inner.kind {
            ExprKind::Name(_) => vec![inner],
            ExprKind::Tuple(items) if !items.is_empty() => items.iter().collect(),
            ExprKind::Paren(inside) => return self.await_pending(expr, inside),
            _ => return None,
        };
        let mut locals = Vec::new();
        for name in &names {
            let ExprKind::Name(text) = &name.kind else { return None };
            let local = self.lookup(text)?;
            if !self.out.async_lets.contains(&local) {
                return None;
            }
            locals.push((local, *name));
        }
        let mut tys = Vec::new();
        for (local, name) in locals {
            self.out.names.insert(name.id, NameRes::Local(local));
            let ty = self.out.locals[local].ty.clone();
            self.out.types.insert(name.id, ty.clone());
            if let Some((throws, _)) = self.pending.remove(&local)
                && throws
                && !self.trying
            {
                self.report(
                    Diagnostic::error(
                        "B0223",
                        name.span,
                        "this `async let` can throw, and it is not awaited with `try`",
                    )
                    .label("its call throws")
                    .help("write `try await`")
                    .fix(Span::new(expr.span.start, expr.span.start), "try ")
                    .spec("6-expressions-and-control-flow"),
                );
            }
            tys.push(match ty {
                Ty::Async(value) => *value,
                other => other,
            });
        }
        self.out.awaits.insert(expr.id, AwaitRes::Bloom);
        if names.len() == 1 && !matches!(inner.kind, ExprKind::Tuple(_)) {
            return tys.pop();
        }
        self.out.await_all.insert(expr.id);
        Some(Ty::Tuple(tys))
    }

    fn await_expr(&mut self, expr: &Expr, inner: &Expr) -> Ty {
        if let Some(ty) = self.await_pending(expr, inner) {
            let frame = self.frames.last_mut().expect("a frame");
            if frame.closure {
                frame.is_async = true;
            }
            return ty;
        }
        let frame = self.frames.last_mut().expect("a frame");
        if frame.closure {
            frame.is_async = true;
        } else if !frame.is_async {
            self.report(
                Diagnostic::error("B0215", expr.span, "`await` is only allowed in an async function")
                    .label("this function is not async")
                    .help("mark the function `async fn`, or await in a closure (`.onPress { await … }`)")
                    .spec("8-effects-tasks-and-concurrency"),
            );
        }
        let ty = self.expr(inner, None);
        match self.resolve(&ty) {
            Ty::Async(t) => {
                self.out.awaits.insert(expr.id, AwaitRes::Bloom);
                *t
            }
            Ty::Promise(t) => {
                self.out.awaits.insert(expr.id, AwaitRes::Ts);
                Ty::Result(t, Box::new(Ty::JsError))
            }
            Ty::Foreign(text) => {
                self.out.awaits.insert(expr.id, AwaitRes::Ts);
                Ty::Result(Box::new(foreign_of(&text, |t| format!("Awaited<{t}>"))), Box::new(Ty::JsError))
            }
            Ty::Unknown => Ty::Unknown,
            other => {
                self.report(
                    Diagnostic::error(
                        "B0215",
                        inner.span,
                        format!("`await` waits for an async call, and this is {}", self.show(&other)),
                    )
                    .label("nothing to wait for")
                    .help("remove `await`")
                    .spec("8-effects-tasks-and-concurrency"),
                );
                other
            }
        }
    }

    /// `x!` (2.0): the value of an optional; `none` traps (checked in a dev build).
    fn force(&mut self, inner: &Expr, expected: Option<&Ty>) -> Ty {
        let expected = expected.map(|t| match t {
            Ty::Option(_) => t.clone(),
            other => Ty::Option(Box::new(other.clone())),
        });
        let ty = self.expr(inner, expected.as_ref());
        match self.resolve(&ty) {
            Ty::Option(value) => *value,
            Ty::Foreign(text) => Ty::Foreign(text),
            Ty::Unknown => Ty::Unknown,
            other => {
                self.report(
                    Diagnostic::error(
                        "B0201",
                        Span::new(inner.span.end, inner.span.end + 1),
                        format!("`!` unwraps an optional, and this is {}", self.show(&other)),
                    )
                    .label("never `none`")
                    .help("remove `!`")
                    .fix(Span::new(inner.span.end, inner.span.end + 1), "")
                    .spec("45-enums-option-and-result"),
                );
                other
            }
        }
    }

    fn try_expr(&mut self, expr: &Expr, inner: &Expr) -> Ty {
        let ty = self.expr(inner, None);
        let ret = self.frames.last().expect("a frame").ret.clone();
        let ret_resolved = self.resolve(&ret);
        match self.resolve(&ty) {
            Ty::Result(ok, _) if self.frames.last().is_some_and(|f| f.throws) => {
                self.out.tries.insert(expr.id, TryRes::Throw);
                *ok
            }
            Ty::Result(ok, err) => {
                self.out.tries.insert(expr.id, TryRes::Result);
                match ret_resolved {
                    Ty::Result(_, fn_err) => {
                        if !self.coerce(&err, &fn_err) {
                            self.report(
                                Diagnostic::error(
                                    "B0214",
                                    expr.span,
                                    format!(
                                        "`?` returns {} early, and this function's error is {}",
                                        self.show(&err),
                                        self.show(&fn_err)
                                    ),
                                )
                                .label("the error types differ")
                                .help("convert it first: `.mapErr { e in … }?`")
                                .spec("45-enums-option-and-result"),
                            );
                        }
                    }
                    Ty::Var(_) => {
                        let ok_var = self.fresh();
                        self.unify(&ret, &Ty::Result(Box::new(ok_var), err));
                    }
                    _ => self.try_outside(expr, &ret_resolved, "a `Result`"),
                }
                *ok
            }
            Ty::Option(inner_ty) => {
                self.out.tries.insert(expr.id, TryRes::Option);
                match ret_resolved {
                    Ty::Option(_) => {}
                    Ty::Var(_) => {
                        let some = self.fresh();
                        self.unify(&ret, &Ty::Option(Box::new(some)));
                    }
                    _ => self.try_outside(expr, &ret_resolved, "an optional"),
                }
                *inner_ty
            }
            Ty::Unknown => Ty::Unknown,
            other => {
                self.report(
                    Diagnostic::error(
                        "B0214",
                        expr.span,
                        format!("`?` unwraps a `Result` or an optional, and this is {}", self.show(&other)),
                    )
                    .label("nothing to unwrap")
                    .help("remove `?`")
                    .spec("45-enums-option-and-result"),
                );
                other
            }
        }
    }

    fn try_outside(&mut self, expr: &Expr, ret: &Ty, what: &str) {
        self.report(
            Diagnostic::error(
                "B0214",
                expr.span,
                format!(
                    "`?` on {what} needs a function that returns one, and this one returns {}",
                    self.show(ret)
                ),
            )
            .label("cannot return early from here")
            .help("`match` the value instead, or make the function return a `Result`")
            .spec("45-enums-option-and-result"),
        );
    }

    fn field(&mut self, expr: &Expr, object: &Expr, name: &Ident) -> Ty {
        // `Type.case` and `Task.signal`, before values.
        if let ExprKind::Name(type_name) = &object.kind
            && self.lookup(type_name).is_none()
        {
            if type_name == "Task" && matches!(name.name.as_str(), "signal" | "isCancelled") {
                if !self.frames.iter().any(|f| f.task) {
                    self.report(
                        Diagnostic::error(
                            "B0432",
                            expr.span,
                            format!("`Task.{}` is read outside a `.task {{ … }}`", name.name),
                        )
                        .label("no task here")
                        .help("read it inside `.task { … }` on the body")
                        .spec("8-effects-tasks-and-concurrency"),
                    );
                }
                if name.name == "isCancelled" {
                    self.out.fields.insert(expr.id, FieldRes::TaskCancelled);
                    return Ty::Bool;
                }
                self.out.fields.insert(expr.id, FieldRes::TaskSignal);
                return Ty::Foreign("AbortSignal".into());
            }
            if name.name == "self"
                && let Some(ty) = self.codec_param(expr, type_name)
            {
                return ty;
            }
            if let Some(ty) = self.static_member(expr, type_name, name) {
                return ty;
            }
            if let Some(TypeName::Def(def)) = self.type_names.get(type_name).cloned() {
                return self.enum_case_value(expr, def, name, Vec::new());
            }
        }
        if let ExprKind::TypeApply { name: type_name, args } = &object.kind
            && let Some(TypeName::Def(def)) = self.type_names.get(&type_name.name).cloned()
        {
            let args = args.iter().map(|a| self.resolve_type(a)).collect();
            return self.enum_case_value(expr, def, name, args);
        }
        let ty = self.expr(object, None);
        let out = match self.unchain(object, &ty) {
            Some(inner) => {
                let field = self.member(expr, &inner, name, object.span);
                let claim = self.is_claim_only(object);
                self.claim_link(expr, claim, &field);
                self.rechain(expr, field)
            }
            None => self.member(expr, &ty, name, object.span),
        };
        match self.out.fields.get(&expr.id).cloned() {
            Some(FieldRes::Field) => self.observe(object, Read::Field(name.name.clone())),
            Some(FieldRes::Extension(func)) => self.observe(object, Read::Member(func.to_string())),
            _ => {}
        }
        out
    }

    /// Whether `expr`'s type is TS's claim, not Bloom's guarantee: a TS value, a value of a type
    /// read from a `.d.ts`, or what is read from one (`viewPost.authors`, a TS call's result).
    /// TS says `authors` is always there; the data at run time may lack it, so a `?.` or `??`
    /// written on it is kept (lead decision, 2026-11-27).
    pub(super) fn ts_claimed(&self, expr: &Expr, ty: &Ty) -> bool {
        let from_ts = |checker: &Self, ty: &Ty| {
            let ty = match checker.resolve(ty) {
                Ty::Option(inner) => checker.resolve(&inner),
                other => other,
            };
            match ty {
                Ty::Foreign(_) => true,
                Ty::Adt(def, _) => matches!(checker.out.defs[def].origin, Origin::Ts { .. }),
                _ => false,
            }
        };
        if from_ts(self, ty) {
            return true;
        }
        let ty_of = |e: &Expr| self.out.types.get(&e.id).cloned().unwrap_or(Ty::Unknown);
        match &expr.kind {
            ExprKind::Paren(inner) => self.ts_claimed(inner, &ty_of(inner)),
            ExprKind::Field(object, _)
            | ExprKind::OptField(object, _)
            | ExprKind::Index(object, _)
            | ExprKind::OptIndex(object, _) => self.ts_claimed(object, &ty_of(object)),
            ExprKind::Call(_) => matches!(self.out.calls.get(&expr.id), Some(CallRes::Ts)),
            ExprKind::Name(_) => matches!(
                self.out.names.get(&expr.id),
                Some(NameRes::Local(l))
                    if matches!(self.out.locals[*l].kind, LocalKind::Import { .. })
                        || self.ts_claimed_locals.contains(l)
            ),
            _ => false,
        }
    }

    /// The value an optional chain carries on, when `object` is optional only by a `?.` in it.
    pub(super) fn unchain(&mut self, object: &Expr, ty: &Ty) -> Option<Ty> {
        if !self.chained.contains(&object.id) {
            return None;
        }
        match self.resolve(ty) {
            Ty::Option(inner) => {
                self.out.chain_links.insert(object.id);
                Some(self.resolve(&inner))
            }
            _ => None,
        }
    }

    /// A link of an optional chain: `none` when an earlier `?.` was. Marks it when the
    /// option is the chain's own, so the next link reads through it.
    /// A link of an optional chain read through a guard TS says never fires (`claim`), whose own
    /// member is present: optional only by the guard.
    pub(super) fn claim_link(&mut self, expr: &Expr, claim: bool, member: &Ty) {
        if claim && !matches!(self.resolve(member), Ty::Option(_) | Ty::Foreign(_) | Ty::Unknown) {
            self.claim_only.insert(expr.id);
        }
    }

    /// Whether `expr` is optional only through guards kept on TS values TS says are present.
    pub(super) fn is_claim_only(&self, expr: &Expr) -> bool {
        match &expr.kind {
            ExprKind::Paren(inner) => self.is_claim_only(inner),
            ExprKind::Name(_) => matches!(
                self.out.names.get(&expr.id),
                Some(NameRes::Local(l)) if self.out.claim_only.contains(l)
            ),
            _ => self.claim_only.contains(&expr.id),
        }
    }

    pub(super) fn rechain(&mut self, expr: &Expr, ty: Ty) -> Ty {
        match self.resolve(&ty) {
            Ty::Option(_) | Ty::Unit | Ty::Unknown | Ty::Never => ty,
            // A TS member read through `?.` stays `Foreign` (not `Foreign?`): TS's absence is
            // its own, checked where the value lands (`server?.robots` beside a `String?`).
            Ty::Foreign(_) => {
                self.chained.insert(expr.id);
                ty
            }
            other => {
                self.chained.insert(expr.id);
                Ty::Option(Box::new(other))
            }
        }
    }

    fn enum_case_value(&mut self, expr: &Expr, def: DefId, name: &Ident, args: Vec<Ty>) -> Ty {
        let d = self.out.defs[def].clone();
        if !matches!(d.kind, DefKind::Enum(_)) {
            self.report(
                Diagnostic::error(
                    "B0205",
                    expr.span,
                    format!("`{}` is a struct; `{}.{}` names nothing", d.name, d.name, name.name),
                )
                .label("structs have no cases")
                .help(format!("construct it: `{}(…)`", d.name))
                .spec("44-structs"),
            );
            return Ty::Unknown;
        }
        let Some(index) = d.variants().iter().position(|v| v.name == name.name) else {
            let names: Vec<&str> = d.variants().iter().map(|v| v.name.as_str()).collect();
            self.unknown_case(name, &names, &Ty::Adt(def, args));
            return Ty::Unknown;
        };
        if !d.variants()[index].payload.is_empty() {
            self.report(
                Diagnostic::error("B0207", expr.span, format!("`{}.{}` carries a value", d.name, name.name))
                    .label("call it with its payload")
                    .help(format!("write `{}.{}(…)`", d.name, name.name))
                    .spec("45-enums-option-and-result"),
            );
        }
        self.out.fields.insert(expr.id, FieldRes::EnumCase(def, index));
        let args = if args.is_empty() { d.generics.iter().map(|_| self.fresh()).collect() } else { args };
        Ty::Adt(def, args)
    }

    /// The type an extension of `ty` is keyed by (`crate::extensions`).
    pub(super) fn extension_owner(&self, ty: &Ty) -> Option<String> {
        Some(match ty {
            Ty::Str | Ty::Strings(_) => "String".into(),
            Ty::Int => "Int".into(),
            Ty::Float => "Double".into(),
            Ty::Bool => "Bool".into(),
            Ty::List(_) => "Array".into(),
            Ty::Map(_) => "Dictionary".into(),
            Ty::Set(_) => "Set".into(),
            Ty::Option(_) => "Optional".into(),
            Ty::Result(..) => "Result".into(),
            Ty::JsError => "Error".into(),
            Ty::Adt(def, _) => self.out.defs[*def].name.clone(),
            _ => return None,
        })
    }

    /// The lowered function of `ty`'s extension member `name`, when there is one in scope.
    pub(super) fn extension_fn(&self, ty: &Ty, name: &str, is_static: bool) -> Option<(Rc<str>, LocalId)> {
        let owner = self.extension_owner(ty)?;
        let func = crate::extensions::mangle(&owner, name, is_static);
        let local = self.lookup(&func)?;
        Some((func.into(), local))
    }

    /// The lowered `static func cast(_ error: Error) -> T?` of `ty`'s extension, which `as? T`
    /// and `catch let e as T` call (`HTTPError$$cast`).
    pub(super) fn cast_fn(&mut self, ty: &Ty) -> Option<(Rc<str>, Rc<FnTy>)> {
        let (func, local) = self.extension_fn(ty, "cast", true)?;
        let fn_ty = self.out.locals[local].ty.clone();
        match self.instantiate(&fn_ty) {
            Ty::Fn(f) if f.params.len() == 1 => Some((func, f)),
            _ => None,
        }
    }

    /// `x as? Tab`: `x` (a `String`, a `String?`, another literal union or a TS value) when it is
    /// one of `Tab`'s values, else `none`. `x as! Tab`: `x` as a `Tab`, a trap in a dev build
    /// when it is not one (a plain cast in a release build, as `x!` is).
    fn union_cast(
        &mut self,
        expr: &Expr,
        subject: &Expr,
        value: &Ty,
        target: &Ty,
        set: Rc<StrSet>,
        forced: bool,
    ) -> Ty {
        let inner = match self.resolve(value) {
            Ty::Option(inner) => self.resolve(&inner),
            other => other,
        };
        if !matches!(inner, Ty::Str | Ty::Strings(_) | Ty::Foreign(_) | Ty::Unknown) {
            self.report(
                Diagnostic::error(
                    "B0213",
                    subject.span,
                    format!(
                        "a cast to {} tests a string, and this is {}",
                        self.show(target),
                        self.show(value)
                    ),
                )
                .label("not a string")
                .help("cast a `String` (or a `String?`)")
                .spec("62-control-flow-and-errors-20"),
            );
        }
        self.out.union_casts.insert(expr.id, set);
        if forced { target.clone() } else { Ty::Option(Box::new(target.clone())) }
    }

    fn no_cast(&mut self, span: Span, ty: &Ty) {
        let shown = self.show(ty);
        self.report(
            Diagnostic::error("B0213", span, format!("`as?` casts to a type that says how, and {shown} does not"))
                .label("no `cast` in its extensions")
                .help(format!(
                    "declare `extension {shown} {{ static func cast(_ error: Error) -> {shown}? {{ … }} }}`, or test a TS value with `is`"
                ))
                .spec("62-control-flow-and-errors-20"),
        );
    }

    /// `T.m` with `m` a static member of an extension of `T` (`T$$m`).
    fn static_member(&mut self, expr: &Expr, type_name: &str, name: &Ident) -> Option<Ty> {
        let owner = crate::extensions::key(type_name);
        let getter = crate::extensions::mangle(owner, &format!("get${}", name.name), true);
        if let Some(local) = self.lookup(&getter) {
            let ty = self.out.locals[local].ty.clone();
            if let Ty::Fn(f) = self.instantiate(&ty) {
                self.out.fields.insert(expr.id, FieldRes::StaticGet(getter.into()));
                return Some(f.ret.clone());
            }
        }
        let func = crate::extensions::mangle(owner, &name.name, true);
        let local = self.lookup(&func)?;
        self.out.fields.insert(expr.id, FieldRes::Static(func.into()));
        let ty = self.out.locals[local].ty.clone();
        Some(self.instantiate(&ty))
    }

    /// `x.p` with `p` a computed property of an extension of `x`'s type: its function's result.
    fn extension_property(&mut self, expr: &Expr, ty: &Ty, name: &Ident) -> Option<Ty> {
        let (func, local) = self.extension_fn(ty, &name.name, false)?;
        let fn_ty = self.out.locals[local].ty.clone();
        let Ty::Fn(f) = self.instantiate(&fn_ty) else { return None };
        if f.params.len() != 1 {
            return None;
        }
        if !self.unify(&f.params[0].ty, ty) {
            self.mismatch(name.span, ty, &f.params[0].ty);
        }
        self.out.fields.insert(expr.id, FieldRes::Extension(func));
        Some(f.ret.clone())
    }

    /// `value.name` on a value of type `ty`.
    fn member(&mut self, expr: &Expr, ty: &Ty, name: &Ident, object_span: Span) -> Ty {
        let resolved = self.resolve(ty);
        let builtin = matches!(
            (&resolved, name.name.as_str()),
            (
                Ty::Str | Ty::Strings(_) | Ty::List(_) | Ty::Map(_) | Ty::JsMap(..) | Ty::Set(_),
                "count" | "isEmpty"
            ) | (Ty::List(_), "first" | "last")
                | (Ty::Map(_) | Ty::JsMap(..), "keys" | "values" | "entries")
                | (Ty::Set(_), "values")
                | (Ty::Result(..), "isOk")
                | (Ty::JsError, "message" | "name")
        );
        let field = match &resolved {
            Ty::Adt(def, _) => self.out.defs[*def].fields().iter().any(|f| f.name == name.name),
            _ => false,
        };
        if !builtin
            && !field
            && let Some(ty) = self.extension_property(expr, &resolved, name)
        {
            return ty;
        }
        if matches!(resolved, Ty::Param(..) | Ty::Any(_))
            && let Some((witness, requirement)) = self.requirement(&resolved, &name.name)
            && !requirement.method
        {
            self.out.fields.insert(expr.id, FieldRes::Witness { witness, member: name.name.clone() });
            return requirement.ty;
        }
        // `item.postId` where `item: T` and `T: ProfileGridEntry`: the shape's field, read
        // from the value itself.
        if let Some(shape) = self.shape_of(&resolved) {
            return self.member(expr, &shape, name, object_span);
        }
        let prop = |checker: &mut Self, recv: Recv, n: &'static str, ty: Ty| {
            checker.out.fields.insert(expr.id, FieldRes::Prop { recv, name: n });
            ty
        };
        match (&resolved, name.name.as_str()) {
            (Ty::Adt(def, args), _) if matches!(self.out.defs[*def].kind, DefKind::Struct(_)) => {
                match self.out.defs[*def].fields().iter().find(|f| f.name == name.name) {
                    Some(f) => {
                        let ty = substitute(&f.ty, args);
                        self.out.fields.insert(expr.id, FieldRes::Field);
                        ty
                    }
                    None => {
                        self.unknown_field(name, &resolved);
                        Ty::Unknown
                    }
                }
            }
            (Ty::Partial(inner), _) => {
                let field = self.member(expr, inner, name, object_span);
                match field {
                    Ty::Option(_) | Ty::Unknown => field,
                    other => Ty::Option(Box::new(other)),
                }
            }
            (Ty::Tuple(items), index) if index.parse::<usize>().is_ok() => {
                let index: usize = index.parse().expect("checked");
                match items.get(index) {
                    Some(ty) => {
                        self.out.fields.insert(expr.id, FieldRes::Index(index));
                        ty.clone()
                    }
                    None => {
                        self.report(
                            Diagnostic::error(
                                "B0205",
                                name.span,
                                format!("this tuple has {} items; `.{index}` is past them", items.len()),
                            )
                            .label("out of range")
                            .spec("41-the-types"),
                        );
                        Ty::Unknown
                    }
                }
            }
            (Ty::Str | Ty::Strings(_), "count") => prop(self, Recv::Str, "count", Ty::Int),
            (Ty::Str | Ty::Strings(_), "isEmpty") => prop(self, Recv::Str, "isEmpty", Ty::Bool),
            (Ty::List(_), "count") => prop(self, Recv::List, "count", Ty::Int),
            (Ty::List(_), "isEmpty") => prop(self, Recv::List, "isEmpty", Ty::Bool),
            (Ty::List(elem), "first") => prop(self, Recv::List, "first", Ty::Option(elem.clone())),
            (Ty::List(elem), "last") => prop(self, Recv::List, "last", Ty::Option(elem.clone())),
            (Ty::Map(_), "count") => prop(self, Recv::Map, "count", Ty::Int),
            (Ty::Map(_), "isEmpty") => prop(self, Recv::Map, "isEmpty", Ty::Bool),
            (Ty::Map(_), "keys") => prop(self, Recv::Map, "keys", Ty::List(Box::new(Ty::Str))),
            (Ty::Map(value), "values") => prop(self, Recv::Map, "values", Ty::List(value.clone())),
            (Ty::Map(value), "entries") => prop(
                self,
                Recv::Map,
                "entries",
                Ty::List(Box::new(Ty::Tuple(vec![Ty::Str, (**value).clone()]))),
            ),
            (Ty::JsMap(..), "count") => prop(self, Recv::JsMap, "count", Ty::Int),
            (Ty::JsMap(..), "isEmpty") => prop(self, Recv::JsMap, "isEmpty", Ty::Bool),
            (Ty::JsMap(key, _), "keys") => prop(self, Recv::JsMap, "keys", Ty::List(key.clone())),
            (Ty::JsMap(_, value), "values") => prop(self, Recv::JsMap, "values", Ty::List(value.clone())),
            (Ty::JsMap(key, value), "entries") => prop(
                self,
                Recv::JsMap,
                "entries",
                Ty::List(Box::new(Ty::Tuple(vec![(**key).clone(), (**value).clone()]))),
            ),
            (Ty::Set(_), "count") => prop(self, Recv::Set, "count", Ty::Int),
            (Ty::Set(_), "isEmpty") => prop(self, Recv::Set, "isEmpty", Ty::Bool),
            (Ty::Set(elem), "values") => prop(self, Recv::Set, "values", Ty::List(elem.clone())),
            (Ty::Result(..), "isOk") => prop(self, Recv::Result, "isOk", Ty::Bool),
            (Ty::JsError, "message" | "name") => {
                self.out.fields.insert(expr.id, FieldRes::ErrorField);
                Ty::Str
            }
            (Ty::Foreign(text), _) => {
                self.out.fields.insert(expr.id, FieldRes::Field);
                foreign_of(text, |t| format!("{t}[\"{}\"]", name.name))
            }
            (Ty::Unknown, _) => Ty::Unknown,
            (Ty::Option(_), _) => {
                self.report(
                    Diagnostic::error("B0201", name.span, format!("{} may be `none`", self.show(&resolved)))
                        .label(format!("`.{}` would read nothing when it is `none`", name.name))
                        .help(format!("write `?.{}`, or unwrap it first (`if let`, `??`)", name.name))
                        .fix(Span::new(name.span.start - 1, name.span.start), "?.")
                        .spec("45-enums-option-and-result"),
                );
                let _ = object_span;
                Ty::Unknown
            }
            (Ty::View(_), modifier) => {
                self.report(
                    Diagnostic::error("B0208", name.span, format!("`.{modifier}` is a modifier: call it"))
                        .label("a modifier is a call")
                        .help(format!("write `.{modifier}(…)`"))
                        .spec("72-builders-modifiers-and-tokens"),
                );
                Ty::Unknown
            }
            _ => {
                let methods = call::method_names(&resolved);
                let help = if methods.contains(&name.name.as_str()) {
                    Some(format!("`{}` is a method: call it, `.{}(…)`", name.name, name.name))
                } else {
                    closest(&name.name, methods.iter().copied())
                        .map(|near| format!("did you mean `.{near}`?"))
                };
                self.report(
                    Diagnostic::error(
                        "B0205",
                        name.span,
                        format!("{} has no member `{}`", self.show(&resolved), name.name),
                    )
                    .label("no such member")
                    .maybe_help(help)
                    .spec("12-standard-library-surface-draft"),
                );
                Ty::Unknown
            }
        }
    }

    /// A closure; `boundary`: TS takes it, so untyped parameters are TS's to infer.
    pub fn closure(&mut self, c: &Closure, expected: Option<&Ty>, boundary: bool) -> Ty {
        let expected_fn = match expected.map(|e| self.resolve(e)) {
            Some(Ty::Fn(f)) => Some(f),
            // A closure where an optional function is expected (`filter: ((T) -> Bool)?`).
            Some(Ty::Option(inner)) => match self.resolve(&inner) {
                Ty::Fn(f) => Some(f),
                _ => None,
            },
            _ => None,
        };
        // A `() -> View` closure of several lines (Swift's `@ViewBuilder`): each line a child.
        if let Some(f) = &expected_fn
            && f.params.is_empty()
            && !f.is_async
            && c.params.is_empty()
            && matches!(self.resolve(&f.ret), Ty::View(_))
            && !matches!(c.body.as_slice(), [Stmt { kind: StmtKind::Expr(_), .. }])
        {
            self.builder(&c.body);
            self.out.closures.insert(
                c.span,
                ClosureInfo { params: Vec::new(), is_async: false, ret: Ty::View(None), builder: true },
            );
            return Ty::Fn(f.clone());
        }
        self.push();
        let mut params = Vec::new();
        let mut param_tys = Vec::new();
        // `{ (a, b) in … }`: the one parameter is a tuple, its items named.
        let items = match (c.tuple, expected_fn.as_ref().and_then(|f| f.params.first())) {
            (true, Some(p)) => match self.resolve(&p.ty) {
                Ty::Tuple(items) if items.len() == c.params.len() => Some(items),
                Ty::Var(_) => None,
                other => {
                    self.report(
                        Diagnostic::error(
                            "B0201",
                            c.span,
                            format!(
                                "`({{ … }}) in` takes a tuple of {}, and this is {}",
                                c.params.len(),
                                self.show(&other)
                            ),
                        )
                        .label("not a tuple of that many items")
                        .spec("5-values-functions-and-closures"),
                    );
                    None
                }
            },
            _ => None,
        };
        for (index, param) in c.params.iter().enumerate() {
            let expected_param = match (&items, c.tuple) {
                (Some(items), _) => Some(items[index].clone()),
                (None, true) => None,
                (None, false) => expected_fn.as_ref().and_then(|f| f.params.get(index)).map(|p| p.ty.clone()),
            };
            let ty = match (&param.ty, expected_param) {
                (Some(te), Some(want)) => {
                    let ty = self.resolve_type(te);
                    // `{ file: File? in … }` where `(File) -> …` is expected: a parameter may
                    // take more than it is given, as Swift's `(T?) -> U` fits `(T) -> U`.
                    let wider = matches!(self.resolve(&ty), Ty::Option(_))
                        && !matches!(self.resolve(&want), Ty::Option(_) | Ty::Var(_))
                        && self.coerce(&want, &ty);
                    if !wider && !self.unify(&ty, &want) {
                        self.mismatch(te.span, &ty, &want);
                    }
                    ty
                }
                (Some(te), None) => self.resolve_type(te),
                (None, Some(want)) => want,
                (None, None) if boundary => Ty::Foreign("".into()),
                (None, None) => self.fresh(),
            };
            param_tys.push(ParamTy {
                labelled: false,
                positional: false,
                name: Some(param.name.name.clone()),
                ty: ty.clone(),
                optional: false,
                rest: false,
            });
            params.push((param, ty));
        }
        if c.tuple {
            let tuple = Ty::Tuple(param_tys.iter().map(|p| p.ty.clone()).collect());
            param_tys = vec![ParamTy {
                labelled: false,
                positional: false,
                name: None,
                ty: tuple,
                optional: false,
                rest: false,
            }];
        }
        let mut ret = expected_fn.as_ref().map_or_else(|| self.fresh(), |f| f.ret.clone());
        // `{ () -> [Item] in … }`: the written result type, which each `return` is checked against.
        if let Some(written) = &c.ret {
            let declared = self.resolve_type(written);
            if expected_fn.is_some() && !self.coerce(&declared, &ret) {
                self.mismatch(written.span, &declared, &ret);
            }
            ret = declared;
        }
        // TS's `() => Promise<void> | void` (read as `Promise<Unit>?`): a closure that returns
        // nothing, or one that awaits (its promise), fits it (R1).
        if let Ty::Option(inner) = self.resolve(&ret) {
            let inner = self.resolve(&inner);
            if inner == Ty::Unit || matches!(&inner, Ty::Promise(value) if self.resolve(value) == Ty::Unit) {
                let awaits = c.body.iter().any(crate::emit::stmt_awaits);
                ret = if awaits { Ty::Promise(Box::new(Ty::Unit)) } else { Ty::Unit };
            }
        }
        // TS's `() => Promise<T>` taking a closure that awaits: the closure's result is `T`.
        let promised = match self.resolve(&ret) {
            Ty::Promise(inner) if c.body.iter().any(crate::emit::stmt_awaits) => Some(*inner),
            _ => None,
        };
        let throws = std::mem::take(&mut self.closure_throws) || boundary || promised.is_some();
        if let Some(inner) = promised {
            ret = inner;
        }
        let task = self.frames.last().is_some_and(|f| f.task);
        self.frames.push(Frame {
            ret: ret.clone(),
            is_async: false,
            closure: true,
            written: HashSet::default(),
            task,
            render: false,
            spawn: false,
            cleanup: false,
            throws,
            raises: expected_fn.as_ref().filter(|f| f.throws).map(|_| Ty::Unknown),
            handled: 0,
        });
        let mut locals = Vec::new();
        for (param, ty) in params {
            locals.push(self.declare(&param.name, ty, LocalKind::Param));
        }
        let ret_resolved = self.resolve(&ret);
        if c.ret.is_none() {
            closure_results(&c.body, true, &mut self.callback_results);
        }
        let trying = std::mem::take(&mut self.trying);
        let body_ty = self.stmts(&c.body, Some(&ret), c.span);
        self.trying = trying;
        // A TS callback that returns a React element (`(surface) => ReactNode`): its view crosses
        // as one.
        if is_element(&ret_resolved)
            && let Some(Stmt { kind: StmtKind::Expr(tail), .. }) = c.body.last()
        {
            // `{ nested in (Row(post: nested)) }`: the view inside the parentheses.
            let mut tail: &Expr = tail;
            while let ExprKind::Paren(inner) = &tail.kind {
                tail = inner;
            }
            if let Some(tail_ty) = self.out.types.get(&tail.id).cloned()
                && matches!(self.resolve(&tail_ty), Ty::View(_))
            {
                self.out.elements.insert(tail.id);
            }
        }
        // A Bloom async call is awaited or started as a task, never returned unawaited.
        if let (Ty::Async(_), Some(Stmt { kind: StmtKind::Expr(tail), .. })) =
            (self.resolve(&body_ty), c.body.last())
        {
            self.report(
                Diagnostic::error(
                    "B0430",
                    tail.span,
                    "this async call is neither awaited nor started as a task",
                )
                .label("its result (and any failure) would be dropped")
                .help("write `await` before it, or start it on its own: `task { await … }`")
                .spec("8-effects-tasks-and-concurrency"),
            );
        }
        if matches!(ret_resolved, Ty::Var(_)) {
            self.unify(&ret, &body_ty);
        }
        let frame = self.frames.pop().expect("the closure's frame");
        self.pop();
        let info = ClosureInfo { params: locals, is_async: frame.is_async, ret: ret.clone(), builder: false };
        self.out.closures.insert(c.span, info);
        Ty::Fn(Rc::new(FnTy {
            params: param_tys,
            ret,
            is_async: frame.is_async,
            generics: 0,
            ts: false,
            throws: false,
            bounds: Vec::new(),
            shapes: Vec::new(),
        }))
    }
}

/// A `.bloom` module's public signatures as its importers see them: its types
/// (numbered from 0), its type names and values, and the files they were
/// read from, with their stamps.
struct Signatures {
    defs: Vec<Def>,
    types: HashMap<String, DefId>,
    /// Its exported `type X = …` aliases: the type and how many parameters it takes.
    aliases: HashMap<String, (Ty, usize)>,
    values: HashMap<String, (Ty, LocalKind)>,
    files: Vec<(PathBuf, ts::Stamp)>,
    checked: std::cell::Cell<u64>,
}

thread_local! {
    /// The `.bloom` modules whose signatures are being read (an import cycle stops there).
    static READING: std::cell::RefCell<std::collections::BTreeSet<PathBuf>> =
        const { std::cell::RefCell::new(std::collections::BTreeSet::new()) };
}

/// Marks a module's signatures as read when dropped.
struct Reading(PathBuf);

impl Drop for Reading {
    fn drop(&mut self) {
        READING.with(|r| r.borrow_mut().remove(&self.0));
    }
}

thread_local! {
    /// Imported `.bloom` modules, by path and the specifier their types are imported by.
    /// Never dropped: see [`ts::ThreadCache`].
    static MODULES: ts::ThreadCache<HashMap<(PathBuf, String), Rc<Signatures>>> =
        ts::thread_cache(HashMap::default());
}

/// Forgets the imported modules read from `path` (or every one).
pub fn forget(path: Option<&Path>) {
    MODULES.with(|m| match path {
        Some(path) => m.borrow_mut().retain(|_, sig| sig.files.iter().all(|(p, _)| p != path)),
        None => m.borrow_mut().clear(),
    });
}

/// The signatures of the `.bloom` module at `path`, read once and reused while
/// it and what it imports are unchanged on disk (checked once per compile).
fn signatures(path: &Path, specifier: &str, options: &Options) -> Option<Rc<Signatures>> {
    let key = (path.to_path_buf(), specifier.to_string());
    let epoch = ts::epoch();
    let cached = MODULES.with(|m| m.borrow().get(&key).cloned());
    if let Some(sig) = cached
        && (sig.checked.get() == epoch
            || sig.files.iter().all(|(p, stamp)| ts::stamp(p).unwrap_or((None, 0)) == *stamp))
    {
        sig.checked.set(epoch);
        return Some(sig);
    }
    if READING.with(|r| r.borrow().contains(path)) {
        return None;
    }
    let source = std::fs::read_to_string(path).ok()?;
    READING.with(|r| r.borrow_mut().insert(path.to_path_buf()));
    let _reading = Reading(path.to_path_buf());
    let (mut file, _, _) = crate::parser::parse(&source);
    crate::extensions::lower(&mut file);
    // Its module imports, as the names its signatures use (`crate::modules`).
    crate::modules::prepare(&mut file, &source, &path.to_string_lossy(), options);
    let mut sub = Checker::new(&source, &path.to_string_lossy(), options);
    sub.declare_signatures(&file, specifier);
    let types = sub
        .type_names
        .iter()
        .filter_map(|(name, t)| match t {
            TypeName::Def(def) => Some((name.clone(), *def)),
            _ => None,
        })
        .collect();
    let aliases = file
        .items
        .iter()
        .filter(|i| matches!(i.kind, ItemKind::Alias(_)) && i.visibility.exported(options.modules))
        .filter_map(|i| match sub.type_names.get(&i.kind.name().name) {
            Some(TypeName::Alias(ty, n)) => Some((i.kind.name().name.clone(), (sub.zonk(ty), *n))),
            _ => None,
        })
        .collect();
    let values = sub.scopes[0]
        .iter()
        .map(|(name, id)| {
            let local = &sub.out.locals[*id];
            (name.clone(), (sub.zonk(&local.ty), local.kind.clone()))
        })
        .collect();
    let mut files: Vec<PathBuf> = std::mem::take(&mut sub.out.dependencies).into_iter().collect();
    files.push(path.to_path_buf());
    let files = files.into_iter().map(|p| {
        let stamp = ts::stamp(&p).unwrap_or((None, 0));
        (p, stamp)
    });
    let sig = Rc::new(Signatures {
        defs: sub.out.defs.iter().map(|d| Def { kind: zonk_kind(&sub, &d.kind), ..d.clone() }).collect(),
        types,
        aliases,
        values,
        files: files.collect(),
        checked: std::cell::Cell::new(epoch),
    });
    MODULES.with(|m| m.borrow_mut().insert(key, sig.clone()));
    Some(sig)
}

/// What other files see of the `.bloom` file `file` (at `path`, its module imports
/// prepared): the types and signatures [`signatures`] reads for an import, as text,
/// one declaration per line, sorted. Each line starts with who sees it: `public`
/// (the modules that import its module; every importer outside a package) or
/// `internal` (the other files of its module). Bodies, comments and private items
/// are not in it, except a private type a visible signature names, so a build keys
/// a file's importers on the lines they see.
pub fn interface(file: &File, source: &str, path: &Path, options: &Options) -> String {
    let mut sub = Checker::new(source, &path.to_string_lossy(), options);
    sub.declare_signatures(file, "");
    // Who sees a name: 2 other modules, 1 its module, 0 its file only.
    let mut items: std::collections::BTreeMap<&str, u8> = Default::default();
    for item in &file.items {
        let seen = match item.visibility {
            v if !v.exported(options.modules) => 0,
            Visibility::Internal => 1,
            _ => 2,
        };
        let entry = items.entry(item.kind.name().name.as_str()).or_default();
        *entry = (*entry).max(seen);
    }
    let defs: Vec<Def> =
        sub.out.defs.iter().map(|d| Def { kind: zonk_kind(&sub, &d.kind), ..d.clone() }).collect();
    let field_types = |kind: &DefKind| -> Vec<Ty> {
        match kind {
            DefKind::Struct(fields) => fields.iter().map(|f| f.ty.clone()).collect(),
            DefKind::Enum(variants) => {
                variants.iter().flat_map(|v| v.payload.iter().map(|(_, t)| t.clone())).collect()
            }
            DefKind::Protocol(requirements) => requirements.iter().map(|r| r.ty.clone()).collect(),
        }
    };
    // A type is seen as widely as the widest visible declaration that names it.
    let mut seen = vec![0u8; defs.len()];
    let mut work: Vec<(Ty, u8)> = Vec::new();
    for (&name, &level) in &items {
        if level == 0 {
            continue;
        }
        if let Some(TypeName::Def(def)) = sub.type_names.get(name) {
            work.push((Ty::Adt(*def, Vec::new()), level));
        }
        if let Some(id) = sub.scopes[0].get(name) {
            work.push((sub.zonk(&sub.out.locals[*id].ty), level));
        }
    }
    while let Some((ty, level)) = work.pop() {
        map_ty(&ty, &mut |t| {
            if let Ty::Adt(def, _) | Ty::Any(def) = t
                && seen[*def] < level
            {
                seen[*def] = level;
                work.extend(field_types(&defs[*def].kind).into_iter().map(|t| (t, level)));
            }
            None
        });
    }
    // Types by name, not by number, so a new private type leaves the others' lines alone.
    let keys: Vec<String> = defs
        .iter()
        .map(|d| match &d.origin {
            Origin::Bloom { specifier } if specifier.is_empty() => d.name.clone(),
            origin => format!("{}@{origin:?}", d.name),
        })
        .collect();
    fn named(ty: &Ty, keys: &[String]) -> Ty {
        map_ty(ty, &mut |t| match t {
            Ty::Adt(def, args) => {
                let args: Vec<Ty> = args.iter().map(|a| named(a, keys)).collect();
                Some(Ty::Foreign(format!("{}{args:?}", keys[*def]).into()))
            }
            Ty::Any(def) => Some(Ty::Foreign(format!("any {}", keys[*def]).into())),
            _ => None,
        })
    }
    let who = |level: u8| if level == 2 { "public" } else { "internal" };
    let mut lines = Vec::new();
    for (&name, &level) in &items {
        if level == 0 {
            continue;
        }
        let mut line = format!("{} {name}", who(level));
        if let Some(TypeName::Def(def)) = sub.type_names.get(name) {
            line.push_str(&format!(" type {}", keys[*def]));
        }
        if let Some(id) = sub.scopes[0].get(name) {
            let local = &sub.out.locals[*id];
            line.push_str(&format!(" value {:?} {:?}", named(&sub.zonk(&local.ty), &keys), local.kind));
        }
        lines.push(line);
    }
    for (def, d) in defs.iter().enumerate() {
        if seen[def] == 0 {
            continue;
        }
        let kind = match &d.kind {
            DefKind::Struct(fields) => DefKind::Struct(
                fields.iter().map(|f| FieldDef { ty: named(&f.ty, &keys), ..f.clone() }).collect(),
            ),
            DefKind::Enum(variants) => DefKind::Enum(
                variants
                    .iter()
                    .map(|v| VariantDef {
                        payload: v.payload.iter().map(|(n, t)| (n.clone(), named(t, &keys))).collect(),
                        ..v.clone()
                    })
                    .collect(),
            ),
            DefKind::Protocol(requirements) => DefKind::Protocol(
                requirements
                    .iter()
                    .map(|r| RequirementDef { ty: named(&r.ty, &keys), ..r.clone() })
                    .collect(),
            ),
        };
        lines.push(format!("{} def {} {:?} {kind:?}", who(seen[def]), keys[def], d.generics));
    }
    lines.sort();
    let mut text = lines.join("\n");
    text.push('\n');
    text
}

fn zonk_kind(checker: &Checker, kind: &DefKind) -> DefKind {
    match kind {
        DefKind::Struct(fields) => DefKind::Struct(
            fields.iter().map(|f| FieldDef { ty: checker.zonk(&f.ty), ..f.clone() }).collect(),
        ),
        DefKind::Enum(variants) => DefKind::Enum(
            variants
                .iter()
                .map(|v| VariantDef {
                    payload: v.payload.iter().map(|(n, t)| (n.clone(), checker.zonk(t))).collect(),
                    ..v.clone()
                })
                .collect(),
        ),
        DefKind::Protocol(requirements) => DefKind::Protocol(
            requirements.iter().map(|r| RequirementDef { ty: checker.zonk(&r.ty), ..r.clone() }).collect(),
        ),
    }
}

/// `ty` with every struct and enum renumbered by `offset`.
fn shift(ty: &Ty, offset: usize) -> Ty {
    if offset == 0 {
        return ty.clone();
    }
    map_ty(ty, &mut |t| match t {
        Ty::Adt(def, args) => Some(Ty::Adt(def + offset, args.iter().map(|a| shift(a, offset)).collect())),
        Ty::Any(def) => Some(Ty::Any(def + offset)),
        _ => None,
    })
}

fn shift_def(def: &Def, offset: usize) -> Def {
    let kind = match &def.kind {
        DefKind::Struct(fields) => DefKind::Struct(
            fields.iter().map(|f| FieldDef { ty: shift(&f.ty, offset), ..f.clone() }).collect(),
        ),
        DefKind::Enum(variants) => DefKind::Enum(
            variants
                .iter()
                .map(|v| VariantDef {
                    payload: v.payload.iter().map(|(n, t)| (n.clone(), shift(t, offset))).collect(),
                    ..v.clone()
                })
                .collect(),
        ),
        DefKind::Protocol(requirements) => DefKind::Protocol(
            requirements.iter().map(|r| RequirementDef { ty: shift(&r.ty, offset), ..r.clone() }).collect(),
        ),
    };
    let tagged = def.tagged.as_ref().map(|t| {
        Rc::new(Tagged {
            tag: t.tag.clone(),
            members: t.members.iter().map(|(v, ty)| (v.clone(), shift(ty, offset))).collect(),
        })
    });
    Def { kind, tagged, ..def.clone() }
}

/// How `==` compares values of a type (spec 4.3).
#[derive(Debug, PartialEq)]
pub enum Equality {
    /// `===`: numbers, strings, `Bool`, fieldless enums, key paths, a TS value.
    Identity,
    /// Field by field (structs, tuples, payload enums, lists, maps, `Result`).
    Structural,
    /// Not comparable: the part that has no equality.
    None(Ty),
}

pub fn equality(defs: &[Def], ty: &Ty) -> Equality {
    let mut seen = Vec::new();
    equality_in(defs, ty, &mut seen)
}

fn equality_in(defs: &[Def], ty: &Ty, seen: &mut Vec<DefId>) -> Equality {
    let all = |tys: &mut dyn Iterator<Item = Ty>, seen: &mut Vec<DefId>| -> Equality {
        for t in tys {
            if let Equality::None(part) = equality_in(defs, &t, seen) {
                return Equality::None(part);
            }
        }
        Equality::Structural
    };
    match ty {
        Ty::Int
        | Ty::Float
        | Ty::Bool
        | Ty::Str
        | Ty::Unit
        | Ty::Strings(_)
        | Ty::KeyPath(..)
        | Ty::JsError
        | Ty::Foreign(_)
        | Ty::Never
        | Ty::Var(_)
        | Ty::Unknown => Equality::Identity,
        Ty::Option(inner) => match equality_in(defs, inner, seen) {
            Equality::Identity => Equality::Identity,
            other => other,
        },
        // A class is compared by identity, as Swift's `===`; an existential has no `==`.
        Ty::Adt(def, _) if defs[*def].class.is_some() => Equality::Identity,
        Ty::Any(_) => Equality::None(ty.clone()),
        Ty::Adt(def, args) => {
            if defs[*def].is_fieldless() {
                return Equality::Identity;
            }
            if seen.contains(def) {
                return Equality::Structural;
            }
            seen.push(*def);
            let parts: Vec<Ty> = match &defs[*def].kind {
                DefKind::Struct(fields) => fields.iter().map(|f| substitute(&f.ty, args)).collect(),
                DefKind::Enum(variants) => {
                    variants.iter().flat_map(|v| v.payload.iter().map(|(_, t)| substitute(t, args))).collect()
                }
                DefKind::Protocol(_) => Vec::new(),
            };
            let out = all(&mut parts.into_iter(), seen);
            seen.pop();
            out
        }
        Ty::Partial(inner) => equality_in(defs, inner, seen),
        Ty::Tuple(items) => all(&mut items.iter().cloned(), seen),
        Ty::List(t) | Ty::Map(t) => all(&mut std::iter::once((**t).clone()), seen),
        Ty::Result(a, b) => all(&mut [(**a).clone(), (**b).clone()].into_iter(), seen),
        Ty::Fn(_)
        | Ty::View(_)
        | Ty::Binding(_)
        | Ty::Async(_)
        | Ty::Promise(_)
        | Ty::Param(..)
        | Ty::JsMap(..)
        | Ty::Set(_) => Equality::None(ty.clone()),
    }
}

/// Whether `expr` reads the name `name` (a state's own value, for a functional update).
pub fn reads_name(expr: &Expr, name: &str) -> bool {
    let mut found = false;
    walk_names(expr, &mut |n, _| {
        if n == name {
            found = true;
        }
    });
    found
}

/// JS's built-in classes: calling one from "js" constructs it.
const JS_CLASSES: &[&str] = &[
    "AbortController",
    "ArrayBuffer",
    "Blob",
    "DataView",
    "Date",
    "Error",
    "FormData",
    "Headers",
    "Image",
    "Promise",
    "RangeError",
    "RegExp",
    "Request",
    "Response",
    "TextDecoder",
    "TextEncoder",
    "TypeError",
    "Uint8Array",
    "URL",
    "URLSearchParams",
    "WeakMap",
    "WeakSet",
    "WebSocket",
    "Worker",
];

/// Every name `expr` reads, with its expression id (closures included).
pub fn walk_names(expr: &Expr, f: &mut dyn FnMut(&str, ExprId)) {
    match &expr.kind {
        ExprKind::Name(name) => f(name, expr.id),
        ExprKind::Binding(path) => f(&path[0].name, expr.id),
        ExprKind::Str { parts, .. } => {
            for part in parts {
                if let StrPart::Interp(inner) = part {
                    walk_names(inner, f);
                }
            }
        }
        ExprKind::Paren(e)
        | ExprKind::Spread(e)
        | ExprKind::Is(e, _)
        | ExprKind::CastAs(e, ..)
        | ExprKind::Unary(_, e)
        | ExprKind::Await(e)
        | ExprKind::Try(e)
        | ExprKind::Force(e)
        | ExprKind::Throwing(_, e)
        | ExprKind::Field(e, _)
        | ExprKind::OptField(e, _) => walk_names(e, f),
        ExprKind::Tuple(items) | ExprKind::List(items) => items.iter().for_each(|e| walk_names(e, f)),
        ExprKind::Record(entries) => entries.iter().for_each(|e| walk_names(e.value(), f)),
        ExprKind::Map(entries) => entries.iter().for_each(|(k, v)| {
            walk_names(k, f);
            walk_names(v, f);
        }),
        ExprKind::Binary(_, a, b) | ExprKind::Index(a, b) | ExprKind::OptIndex(a, b) => {
            walk_names(a, f);
            walk_names(b, f);
        }
        ExprKind::Ternary(a, b, c) => {
            walk_names(a, f);
            walk_names(b, f);
            walk_names(c, f);
        }
        ExprKind::Call(call) => {
            walk_names(&call.callee, f);
            call.args.iter().for_each(|a| walk_names(&a.value, f));
            if let Some(c) = &call.trailing {
                walk_stmts(&c.body, f);
            }
        }
        ExprKind::Closure(c) => walk_stmts(&c.body, f),
        ExprKind::Task(block) => walk_stmts(&block.stmts, f),
        ExprKind::If(i) => walk_if(i, f),
        ExprKind::Match(m) => {
            walk_names(&m.scrutinee, f);
            for arm in &m.arms {
                walk_pattern(&arm.pattern, f);
                if let Some(g) = &arm.guard {
                    walk_names(g, f);
                }
                match &arm.body {
                    ArmBody::Expr(e) => walk_names(e, f),
                    ArmBody::Block(b) => walk_stmts(&b.stmts, f),
                }
            }
        }
        ExprKind::Int(_)
        | ExprKind::Unit
        | ExprKind::Float(_)
        | ExprKind::Bool(_)
        | ExprKind::None
        | ExprKind::ImplicitMember(_)
        | ExprKind::TypeApply { .. }
        | ExprKind::KeyPath { .. }
        | ExprKind::Error => {}
    }
}

fn walk_pattern(pattern: &Pattern, f: &mut dyn FnMut(&str, ExprId)) {
    match &pattern.kind {
        PatternKind::Literal(e) => walk_names(e, f),
        PatternKind::Case { args: Some(args), .. } | PatternKind::Tuple(args) | PatternKind::Or(args) => {
            args.iter().for_each(|p| walk_pattern(p, f))
        }
        PatternKind::Record(fields) => {
            fields.iter().filter_map(|(_, p)| p.as_ref()).for_each(|p| walk_pattern(p, f))
        }
        _ => {}
    }
}

fn walk_if(i: &IfExpr, f: &mut dyn FnMut(&str, ExprId)) {
    match &i.cond {
        Cond::Expr(e) => walk_names(e, f),
        Cond::Let(p, e) => {
            walk_pattern(p, f);
            walk_names(e, f);
        }
    }
    walk_stmts(&i.then.stmts, f);
    match i.otherwise.as_deref() {
        Some(Else::If(e)) => walk_names(e, f),
        Some(Else::Block(b)) => walk_stmts(&b.stmts, f),
        None => {}
    }
}

pub fn walk_stmts(stmts: &[Stmt], f: &mut dyn FnMut(&str, ExprId)) {
    for stmt in stmts {
        match &stmt.kind {
            StmtKind::Let(l) => walk_names(&l.value, f),
            StmtKind::Var(v) => walk_names(&v.value, f),
            StmtKind::Assign(a) => {
                walk_names(&a.target, f);
                walk_names(&a.value, f);
            }
            StmtKind::Return(Some(e)) | StmtKind::Expr(e) => walk_names(e, f),
            StmtKind::Return(None) => {}
            StmtKind::Break(_) | StmtKind::Continue(_) => {}
            StmtKind::Defer(block) => walk_stmts(&block.stmts, f),
            StmtKind::While(w) => {
                walk_names(&w.cond, f);
                walk_stmts(&w.body.stmts, f);
            }
            StmtKind::Guard(g) => {
                match &g.cond {
                    Cond::Expr(e) | Cond::Let(_, e) => walk_names(e, f),
                }
                walk_stmts(&g.otherwise.stmts, f);
            }
            StmtKind::Throw(e) => walk_names(e, f),
            StmtKind::Do(d) => {
                walk_stmts(&d.body.stmts, f);
                d.catches.iter().for_each(|c| walk_stmts(&c.body.stmts, f));
            }
            StmtKind::For(fs) => {
                walk_names(&fs.iter, f);
                walk_stmts(&fs.body.stmts, f);
            }
        }
    }
}

/// A statement that leaves its block: `return`, `throw`, or a call to `fatalError`.
fn exits(stmt: &Stmt) -> bool {
    match &stmt.kind {
        StmtKind::Return(_) | StmtKind::Throw(_) | StmtKind::Break(_) | StmtKind::Continue(_) => true,
        StmtKind::Expr(e) => match &e.kind {
            ExprKind::Call(call) => matches!(&call.callee.kind, ExprKind::Name(n) if n == "fatalError"),
            _ => false,
        },
        _ => false,
    }
}

/// Whether a TS type is a React element (`ReactNode`, `ReactElement`, `JSX.Element`), which a
/// Bloom view crosses into as `toElement(view)`.
pub(crate) fn is_element(ty: &Ty) -> bool {
    match ty {
        Ty::Foreign(text) => text.starts_with("import(\"react\")."),
        Ty::Option(inner) => is_element(inner),
        _ => false,
    }
}

/// Whether `expr` is an optional chain (`selected?.label`, `user?.name.count`, `f?()`), which
/// gives `none` when what it reads through is.
/// `{}`: an empty record where a struct is expected (else a closure of nothing).
fn is_empty_braces(expr: &Expr) -> bool {
    matches!(&expr.kind, ExprKind::Closure(c) if c.params.is_empty() && c.body.is_empty())
}

fn optional_chain(expr: &Expr) -> bool {
    match &expr.kind {
        ExprKind::OptField(..) | ExprKind::OptIndex(..) => true,
        ExprKind::Paren(inner) | ExprKind::Field(inner, _) | ExprKind::Index(inner, _) => {
            optional_chain(inner)
        }
        ExprKind::Call(call) => call.optional || optional_chain(&call.callee),
        _ => false,
    }
}

/// Whether a conditional chain gives `none` in one of its branches (`d ? y : none`).
/// The calls `expr` gives, through parentheses, branches and `??`: their expected type is
/// inferred from a sibling.
fn inferred_calls(expr: &Expr, out: &mut HashSet<ExprId>) {
    match &expr.kind {
        ExprKind::Call(_) => {
            out.insert(expr.id);
        }
        ExprKind::Paren(inner) | ExprKind::Await(inner) | ExprKind::Try(inner) | ExprKind::Force(inner) => {
            inferred_calls(inner, out);
        }
        ExprKind::Ternary(_, then, otherwise) | ExprKind::Binary(BinaryOp::Default, then, otherwise) => {
            inferred_calls(then, out);
            inferred_calls(otherwise, out);
        }
        _ => {}
    }
}

/// The record literals a closure's body gives: its tail (when `tail`) and its `return`s, through
/// parentheses, branches, `??` and list literals, not inside a nested closure.
fn closure_results(stmts: &[Stmt], tail: bool, out: &mut HashSet<ExprId>) {
    fn given(expr: &Expr, out: &mut HashSet<ExprId>) {
        match &expr.kind {
            ExprKind::Record(_) => {
                out.insert(expr.id);
            }
            ExprKind::Paren(inner) => given(inner, out),
            ExprKind::Ternary(_, then, otherwise) | ExprKind::Binary(BinaryOp::Default, then, otherwise) => {
                given(then, out);
                given(otherwise, out);
            }
            ExprKind::List(items) => items.iter().for_each(|item| given(item, out)),
            ExprKind::If(i) => {
                closure_results(&i.then.stmts, true, out);
                match i.otherwise.as_deref() {
                    Some(Else::If(e)) => given(e, out),
                    Some(Else::Block(b)) => closure_results(&b.stmts, true, out),
                    None => {}
                }
            }
            ExprKind::Match(m) => m.arms.iter().for_each(|arm| match &arm.body {
                ArmBody::Expr(e) => given(e, out),
                ArmBody::Block(b) => closure_results(&b.stmts, true, out),
            }),
            _ => {}
        }
    }
    /// The `return`s inside a statement-level `if` or `switch`.
    fn returns(expr: &Expr, out: &mut HashSet<ExprId>) {
        match &expr.kind {
            ExprKind::If(i) => {
                closure_results(&i.then.stmts, false, out);
                match i.otherwise.as_deref() {
                    Some(Else::If(e)) => returns(e, out),
                    Some(Else::Block(b)) => closure_results(&b.stmts, false, out),
                    None => {}
                }
            }
            ExprKind::Match(m) => m.arms.iter().for_each(|arm| {
                if let ArmBody::Block(b) = &arm.body {
                    closure_results(&b.stmts, false, out);
                }
            }),
            _ => {}
        }
    }
    for (index, stmt) in stmts.iter().enumerate() {
        match &stmt.kind {
            StmtKind::Return(Some(e)) => given(e, out),
            StmtKind::Expr(e) if tail && index + 1 == stmts.len() => given(e, out),
            StmtKind::Expr(e) => returns(e, out),
            StmtKind::While(w) => closure_results(&w.body.stmts, false, out),
            StmtKind::For(f) => closure_results(&f.body.stmts, false, out),
            StmtKind::Guard(g) => closure_results(&g.otherwise.stmts, false, out),
            StmtKind::Do(d) => {
                closure_results(&d.body.stmts, false, out);
                d.catches.iter().for_each(|c| closure_results(&c.body.stmts, false, out));
            }
            _ => {}
        }
    }
}

/// The implicit member a chain of member reads and calls starts from (`.dateTime` of
/// `.dateTime.month(.abbreviated).day()`), if it starts from one.
fn implicit_root(expr: &Expr) -> Option<&Expr> {
    let mut at = expr;
    loop {
        at = match &at.kind {
            ExprKind::Call(call) => match &call.callee.kind {
                ExprKind::Field(object, _) => object,
                _ => return None,
            },
            ExprKind::Field(object, _) => object,
            ExprKind::ImplicitMember(_) if !std::ptr::eq(at, expr) => return Some(at),
            _ => return None,
        };
    }
}

/// A literal Swift types from its context: a list, a record, or a ternary or parentheses of them.
fn literal_shaped(expr: &Expr) -> bool {
    match &expr.kind {
        ExprKind::List(_) | ExprKind::Record(_) => true,
        ExprKind::Paren(inner) => literal_shaped(inner),
        ExprKind::Ternary(_, then, otherwise) => literal_shaped(then) || literal_shaped(otherwise),
        _ => false,
    }
}

fn ends_in_none(expr: &Expr) -> bool {
    match &expr.kind {
        ExprKind::None => true,
        ExprKind::Paren(inner) => ends_in_none(inner),
        ExprKind::Ternary(_, then, otherwise) => ends_in_none(then) || ends_in_none(otherwise),
        _ => false,
    }
}

/// A statement no path falls out of: an exit, or a `do` whose body and catches all exit.
fn always_exits(stmt: &Stmt) -> bool {
    match &stmt.kind {
        StmtKind::Do(d) => {
            d.body.stmts.last().is_some_and(always_exits)
                && !d.catches.is_empty()
                && d.catches.iter().all(|c| c.body.stmts.last().is_some_and(always_exits))
        }
        _ => exits(stmt),
    }
}

pub(crate) fn is_hook_name(name: &str) -> bool {
    name.strip_prefix("use").and_then(|rest| rest.chars().next()).is_some_and(|c| c.is_ascii_uppercase())
}

/// A string literal's text (no interpolation).
/// A string literal without interpolation, as its one-value literal type.
fn string_literal(expr: &Expr) -> Option<Ty> {
    let ExprKind::Str { parts, .. } = &expr.kind else { return None };
    if !parts.iter().all(|p| matches!(p, StrPart::Text(_))) {
        return None;
    }
    let value = plain_text(parts);
    Some(Ty::Strings(Rc::new(StrSet { name: format!("{value:?}"), values: vec![value], token: false })))
}

pub fn plain_text(parts: &[StrPart]) -> String {
    parts
        .iter()
        .map(|part| match part {
            StrPart::Text(text) => text.as_str(),
            StrPart::Interp(_) => "",
        })
        .collect()
}

/// A literal default as TS text, for a struct imported from another module.
fn literal_text(expr: &Expr) -> Option<String> {
    Some(match &expr.kind {
        ExprKind::Int(v) => v.to_string(),
        ExprKind::Float(v) => v.to_string(),
        ExprKind::Bool(v) => v.to_string(),
        ExprKind::None => "undefined".into(),
        ExprKind::Str { parts, .. } if parts.iter().all(|p| matches!(p, StrPart::Text(_))) => {
            format!("{:?}", plain_text(parts))
        }
        ExprKind::List(items) if items.is_empty() => "[]".into(),
        ExprKind::Map(entries) if entries.is_empty() => "{}".into(),
        ExprKind::Field(object, case) if matches!(object.kind, ExprKind::Name(_)) => {
            format!("{:?}", case.name)
        }
        ExprKind::Unary(UnaryOp::Neg, inner) => format!("-{}", literal_text(inner)?),
        _ => return None,
    })
}
