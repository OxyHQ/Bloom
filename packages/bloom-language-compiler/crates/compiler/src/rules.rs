//! The chain rules both front ends hold: the embedded pass (over TSX, through
//! oxc) and bloomc (over `.bloom`, through its own tree) describe each chain
//! as a [`Chain`] and hand it here, so a rule is written once.
//!
//! What lives here is what a chain's shape decides: the Liquid Glass rules
//! (glass on glass, glass in scrolling content or per item of a list, clear
//! glass undimmed, tinted glasses in one group, glasses side by side outside a
//! `GlassGroup`, a fade over a view that holds glass, the lens budget),
//! Apple's toolbar rules, a `ViewThatFits` of few candidates, icon-only
//! controls without a label, a section of choices holding only tagged items,
//! and an environment's literal kinds. Modifiers and tokens are checked by
//! each front end against the same generated tables (`spec`): bloomc types
//! its arguments, the embedded pass reads its literals.
//!
//! A front end walks its own tree and calls [`Rules::chain`] on each chain,
//! then enters its modifiers' arguments ([`Rules::enter_modifier`]) outermost
//! first, then its children ([`Rules::enter_children`]), leaving each scope
//! with [`Rules::leave`]; a callback drawn once per item enters
//! [`Rules::enter_list`]. [`Rules::finish`] holds the module-wide budget.

use oxc_span::Span;

use crate::docs::{Doc, Tour};
use crate::spec::FADING_LOOPS;

pub struct Problem {
    pub span: Span,
    pub message: String,
    pub help: Option<String>,
    /// The docs that explain it, the most precise first.
    pub docs: Vec<Doc>,
}

/// The kind of a literal value, as an environment value's type is checked.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Literal {
    Boolean,
    Number,
    String,
}

impl Literal {
    pub fn name(self) -> &'static str {
        match self {
            Self::Boolean => "boolean",
            Self::Number => "number",
            Self::String => "string",
        }
    }
}

/// A chain: a node constructor (or a view) and its modifiers.
pub struct Chain<'s> {
    /// The node kind (`view` for an app's own view).
    pub kind: &'static str,
    /// The whole chain.
    pub span: Span,
    /// The constructor call.
    pub root: Span,
    /// The modifiers, in source order.
    pub modifiers: Vec<Modifier<'s>>,
    /// The constructor's arguments, in order. A front end describes children
    /// two levels down from the chain it hands to [`Rules::chain`]; deeper
    /// chains are [`Rules::chain`]'s own when the walk reaches them.
    pub children: Vec<Child<'s>>,
}

pub struct Modifier<'s> {
    pub name: &'s str,
    /// The call, from the chain's start to its closing parenthesis.
    pub span: Span,
    /// Its first argument.
    pub value: Value<'s>,
    /// Its arguments (a toolbar's items), described one level down.
    pub arguments: Vec<Child<'s>>,
}

/// A modifier's first argument, as far as the rules read it.
pub enum Value<'s> {
    /// No argument.
    None,
    /// A string literal.
    Str(&'s str),
    /// A name with methods called on it (`clear.dimmed()`, `identity`): the
    /// root's name, the methods outermost first, and whether the name is the
    /// language's `identity` glass.
    Path { root: &'s str, methods: Vec<&'s str>, identity: bool },
    /// Anything else. `fades`: a motion value that changes opacity (described
    /// for the [`FADE_MODIFIERS`] only; false elsewhere).
    Other { fades: bool },
}

pub enum Child<'s> {
    Chain(Chain<'s>),
    /// Anything that is no chain (a value, a condition, a list).
    Other,
}

impl Child<'_> {
    fn chain(&self) -> Option<&Chain<'_>> {
        match self {
            Child::Chain(chain) => Some(chain),
            Child::Other => None,
        }
    }

    fn kind(&self) -> &'static str {
        self.chain().map_or("view", |chain| chain.kind)
    }
}

impl Chain<'_> {
    fn has(&self, modifier: &str) -> bool {
        self.modifiers.iter().any(|m| m.name == modifier)
    }

    fn child_chains(&self) -> impl Iterator<Item = &Chain<'_>> {
        self.children.iter().filter_map(Child::chain)
    }
}

/// The modifiers that can fade a view: a front end describes their value's
/// `fades`, and asks [`fade`] whether a view that holds glass fades.
pub const FADE_MODIFIERS: &[&str] = &["opacity", "transition", "keyframes", "repeatForever"];

/// Nodes whose children are content: they scroll, or they are a card of it.
const CONTENT_KINDS: &[&str] = &["scrollView", "scrollArea", "scrollSurface", "list", "virtualList", "card"];

/// How many glasses one module may draw before the compiler warns: a screen's
/// bars, toolbar groups and a floating control, well under the 60 lenses Bloom
/// measured at 21% janky frames on a Pixel 8a (AGENTS.rules.md, Material).
const LENS_BUDGET: usize = 12;

/// Where a chain is written: inside the children of a glass, of scrolling
/// content, of a glass group, of a callback drawn per item.
#[derive(Clone, Copy, Default)]
struct Place {
    in_glass: bool,
    in_content: bool,
    in_group: bool,
    in_list: bool,
}

/// A scope entered by [`Rules::enter_children`], [`Rules::enter_modifier`] or
/// [`Rules::enter_list`], left with [`Rules::leave`].
#[must_use]
pub struct Scope {
    place: Place,
    /// A group's span: its tinted glasses are counted while it is entered.
    group: Option<Span>,
}

/// The rules over one module's chains, in the order a front end walks them.
#[derive(Default)]
pub struct Rules {
    place: Place,
    /// Per enclosing glass group, toolbar group or toolbar: its tinted glasses.
    groups: Vec<u32>,
    /// Every glass the module draws, in source order (the lens budget).
    lenses: Vec<Span>,
    pub errors: Vec<Problem>,
    pub warnings: Vec<Problem>,
}

/// A glass, as the Liquid Glass rules see it.
struct Glass {
    span: Span,
    /// `.inContent()`: in the content layer on purpose.
    in_content: bool,
    /// Tinted with a colour (`.tint()`, or `glassProminent`'s accent).
    tinted: bool,
    /// `clear` with neither a tint nor `.dimmed()`.
    undimmed_clear: bool,
}

impl Rules {
    /// One chain's rules; returns whether it draws glass (for [`Rules::enter_children`]).
    pub fn chain(&mut self, chain: &Chain) -> bool {
        let glass = self.glass(chain);
        self.toolbar(chain);
        if let Some(problem) = untagged_choice(chain) {
            self.errors.push(problem);
        }
        glass
    }

    /// Enters a chain's children: inside its glass (`glass`, from [`Rules::chain`]),
    /// its scrolling content, its group.
    pub fn enter_children(&mut self, chain: &Chain, glass: bool) -> Scope {
        let outer = self.place;
        self.place.in_glass |= glass;
        self.place.in_content |= CONTENT_KINDS.contains(&chain.kind);
        self.place.in_group |= chain.kind == "glassGroup";
        let group = chain.kind == "glassGroup" || chain.kind == "toolbarGroup";
        self.enter_group(outer, group.then_some(chain.root))
    }

    /// Enters a modifier's arguments: a toolbar's items are a group.
    pub fn enter_modifier(&mut self, name: &str, span: Span) -> Scope {
        let toolbar = matches!(name, "toolbar" | "toolbarLeading");
        self.enter_group(self.place, toolbar.then_some(span))
    }

    /// Enters a callback drawn once per item of a list (`.map()`, `for`).
    pub fn enter_list(&mut self) -> Scope {
        let outer = self.place;
        self.place.in_list = true;
        Scope { place: outer, group: None }
    }

    fn enter_group(&mut self, outer: Place, group: Option<Span>) -> Scope {
        if group.is_some() {
            self.groups.push(0);
        }
        Scope { place: outer, group }
    }

    /// Leaves a scope; a group holds Apple's rule of one tinted control in it.
    pub fn leave(&mut self, scope: Scope) {
        if let Some(span) = scope.group {
            let tinted = self.groups.pop().unwrap_or(0);
            if tinted > 1 {
                self.warnings.push(Problem {
                    span,
                    message: format!("{tinted} tinted glasses in one group: tint one, the primary action"),
                    help: Some(
                        "Apple: refrain from adding color to the background of multiple controls; the key action \
                         is .style('glassProminent'), the rest untinted"
                            .into(),
                    ),
                    docs: vec![Doc::Tour(Tour::LiquidGlassRules)],
                });
            }
        }
        self.place = scope.place;
    }

    /// The module-wide rules (the lens budget), after the walk.
    pub fn finish(&mut self) {
        if let Some(&span) = self.lenses.get(LENS_BUDGET) {
            self.warnings.push(Problem {
                span,
                message: format!("{} glasses in one module: past the budget of {LENS_BUDGET}", self.lenses.len()),
                help: Some(
                    "every lens is drawn each frame (60 at once were 21% janky frames on a Pixel 8a): group nearby \
                     glass in a GlassGroup, and keep glass to the navigation layer"
                        .into(),
                ),
                docs: vec![Doc::Tour(Tour::LiquidGlassRules), Doc::Tour(Tour::GlassGroups)],
            });
        }
    }

    /// The Liquid Glass rules for one chain (see docs/bloom-language.mdx, Liquid
    /// Glass rules), and an icon-only control's label.
    fn glass(&mut self, chain: &Chain) -> bool {
        let glass = glass_of(chain);
        if let Some(glass) = &glass {
            self.lenses.push(glass.span);
            if glass.tinted {
                for count in &mut self.groups {
                    *count += 1;
                }
            }
            if glass.undimmed_clear {
                self.warnings.push(Problem {
                    span: glass.span,
                    message: "clear glass with no dimming layer".into(),
                    help: Some(
                        "Apple: clear glass sits over rich media, with a dimming layer when the media is bright: \
                         .glass(clear.dimmed()), or a tint"
                            .into(),
                    ),
                    docs: vec![Doc::Tour(Tour::LiquidGlassRules), Doc::modifier("glass")],
                });
            }
            if self.place.in_list && !glass.in_content {
                self.warnings.push(Problem {
                    span: glass.span,
                    message: "a glass per item of a list".into(),
                    help: Some(
                        "every lens is drawn each frame; a row's control that is glass on purpose says so with \
                         .inContent()"
                            .into(),
                    ),
                    docs: vec![Doc::Tour(Tour::LiquidGlassRules), Doc::modifier("inContent")],
                });
            }
            if self.place.in_glass {
                self.errors.push(Problem {
                    span: glass.span,
                    message: "glass on glass: this glass is inside another glass".into(),
                    help: Some(
                        "Liquid Glass is one layer: drop this .glass(), or put both side by side in a GlassGroup".into(),
                    ),
                    docs: vec![Doc::Tour(Tour::LiquidGlassRules), Doc::Tour(Tour::GlassGroups)],
                });
            } else if self.place.in_content && !glass.in_content {
                self.warnings.push(Problem {
                    span: glass.span,
                    message: "glass in scrolling content: glass belongs to the navigation layer".into(),
                    help: Some(
                        "put it on a bar, a toolbar or a floating control; a control in a row that is glass on \
                         purpose says so with .inContent()"
                            .into(),
                    ),
                    docs: vec![Doc::Tour(Tour::LiquidGlassRules), Doc::modifier("inContent")],
                });
            }
        }
        if !self.place.in_group && chain.kind == "stack" {
            let siblings = chain.child_chains().filter(|child| glass_of(child).is_some()).count();
            if siblings > 1 {
                self.warnings.push(Problem {
                    span: chain.root,
                    message: format!("{siblings} glasses side by side outside a GlassGroup"),
                    help: Some(
                        "wrap them in GlassGroup(...): nearby glass renders together, blends and morphs as one".into(),
                    ),
                    docs: vec![Doc::Tour(Tour::GlassGroups), Doc::Node("glassGroup")],
                });
            }
        }
        if let Some(problem) = unlabelled_icon_control(chain) {
            self.errors.push(problem);
        }
        glass.is_some()
    }

    /// Apple's toolbar rules (at most three groups in a toolbar, text actions
    /// kept apart from icon actions within a group), and a `ViewThatFits` of at
    /// most three candidates.
    fn toolbar(&mut self, chain: &Chain) {
        for modifier in chain.modifiers.iter().rev() {
            if modifier.name != "toolbar" && modifier.name != "toolbarLeading" {
                continue;
            }
            let groups = modifier.arguments.iter().filter(|item| item.kind() == "toolbarGroup").count();
            if groups > 3 {
                self.warnings.push(Problem {
                    span: modifier.span,
                    message: format!("{groups} toolbar groups: a toolbar has at most three"),
                    help: Some("Apple: aim for a maximum of three groups; move the rest into a menu".into()),
                    docs: vec![Doc::Tour(Tour::Navigation), Doc::Node("toolbarGroup")],
                });
            }
        }
        if chain.kind == "viewThatFits" && chain.children.len() > 4 {
            self.warnings.push(Problem {
                span: chain.root,
                message: format!("ViewThatFits measures {} candidates", chain.children.len() - 1),
                help: Some(
                    "each candidate is laid out once more to measure it: keep to three, and small".into(),
                ),
                docs: vec![Doc::Tour(Tour::Layout), Doc::Node("viewThatFits")],
            });
        }
        if chain.kind != "toolbarGroup" {
            return;
        }
        let (mut text, mut icons) = (false, false);
        for button in chain.child_chains().filter(|item| item.kind == "button") {
            let worded = button.children.iter().any(|child| child.kind() == "text");
            text |= worded;
            icons |= !worded;
        }
        if text && icons {
            self.warnings.push(Problem {
                span: chain.root,
                message: "a toolbar group mixes text and icon buttons".into(),
                help: Some(
                    "Apple: keep actions with text labels apart; put them in groups of their own".into(),
                ),
                docs: vec![Doc::Tour(Tour::Navigation), Doc::Node("toolbarGroup")],
            });
        }
    }
}

/// The glass a chain draws: a `.glass()` that is not `identity`, a glass
/// button style, or a FAB (always on glass) without `.glass(identity)`.
fn glass_of(chain: &Chain) -> Option<Glass> {
    let in_content = chain.has("inContent");
    let mut glass: Option<Span> = None;
    let mut identity = false;
    let (mut tinted, mut undimmed_clear) = (false, false);
    for modifier in &chain.modifiers {
        match modifier.name {
            "glass" => {
                let (root, methods): (&str, &[&str]) = match &modifier.value {
                    Value::None => ("regular", &[]),
                    Value::Path { root, methods, identity: is_identity } => {
                        identity = *is_identity;
                        (root, methods)
                    }
                    Value::Str(_) | Value::Other { .. } => ("", &[]),
                };
                if !matches!(modifier.value, Value::Path { .. }) {
                    identity = false;
                }
                glass = (!identity).then_some(modifier.span);
                tinted = methods.contains(&"tint");
                undimmed_clear = root == "clear" && !tinted && !methods.contains(&"dimmed");
            }
            "style" if matches!(modifier.value, Value::Str("glass" | "glassProminent")) => {
                glass = glass.or(Some(modifier.span));
                tinted |= matches!(modifier.value, Value::Str("glassProminent"));
            }
            _ => {}
        }
    }
    if glass.is_none() && chain.kind == "fab" && !identity {
        glass = Some(chain.root);
    }
    glass.map(|span| Glass { span, in_content, tinted, undimmed_clear })
}

/// A `Button` or `FAB` whose content is glyphs alone has a `.label()`: the
/// glyph says nothing to a screen reader (Apple: "provide an accessibility
/// label for every icon").
fn unlabelled_icon_control(chain: &Chain) -> Option<Problem> {
    if chain.kind != "button" && chain.kind != "fab" {
        return None;
    }
    if chain.children.is_empty()
        || chain.children.iter().any(|child| child.kind() != "icon")
        || chain.has("label")
    {
        return None;
    }
    let name = if chain.kind == "fab" { "FAB" } else { "Button" };
    Some(Problem {
        span: chain.root,
        message: format!("an icon-only {name} has no .label()"),
        help: Some(format!("name what it does: {name}(Icon(…)).label('Share')")),
        docs: vec![Doc::Tour(Tour::Accessibility), Doc::modifier("label")],
    })
}

/// A row of a menu `Section` with a `.selection()` that is no tagged `Item`: the
/// runtime refuses it (`readMenuRows`), as each row of a section of choices is
/// one choice, its tag its value. A row the compiler cannot see (a list, a
/// name) is the runtime's to check.
fn untagged_choice(chain: &Chain) -> Option<Problem> {
    if chain.kind != "menuSection" || !chain.has("selection") {
        return None;
    }
    chain.child_chains().find(|row| !(row.kind == "menuItem" && row.has("tag"))).map(|row| Problem {
        span: row.span,
        message: "a Section with a .selection() holds its choices only".into(),
        help: Some("each row is a choice: Item(title).tag(value)".into()),
        docs: vec![Doc::Node("menuSection"), Doc::modifier("selection")],
    })
}

/// `.opacity()`, a transition, keyframes or a loop that fades a view holding
/// glass (`holds_glass`: any chain among its children, at any depth, has a
/// `.glass()`): on the web a faded ancestor flattens the material.
pub fn fade(modifier: &Modifier, holds_glass: bool) -> Option<Problem> {
    let fades = match (modifier.name, &modifier.value) {
        (_, Value::None) => false,
        ("opacity", value) => !matches!(value, Value::Str("opaque")),
        ("repeatForever", Value::Str(token)) => FADING_LOOPS.contains(token),
        ("transition" | "keyframes" | "repeatForever", Value::Other { fades }) => *fades,
        _ => false,
    };
    (holds_glass && fades).then(|| Problem {
        span: modifier.span,
        message: format!(".{}() fades a view that holds glass", modifier.name),
        help: Some(
            "on the web a faded ancestor flattens the material (it stops blurring); put the fade on the .glass() \
             view itself, which fades the material's own layers instead"
                .into(),
        ),
        docs: vec![Doc::Tour(Tour::LiquidGlassRules), Doc::modifier(modifier.name)],
    })
}

/// `defineEnvironment('name', default)`: a literal name (`name_literal`), and a
/// literal default (`default`: its span and whether it is a literal, `null` or
/// `undefined`) whose kind every `.environment(key, value)` is held to.
pub fn define_environment(call: Span, name_literal: bool, default: Option<(Span, bool)>) -> Option<Problem> {
    if !name_literal {
        return Some(Problem {
            span: call,
            message: "defineEnvironment() takes its name as a string literal".into(),
            help: Some("const Compact = defineEnvironment('compact', false)".into()),
            docs: vec![Doc::Tour(Tour::Environment)],
        });
    }
    if default.is_some_and(|(_, literal)| literal) {
        return None;
    }
    Some(Problem {
        span: default.map_or(call, |(span, _)| span),
        message:
            "defineEnvironment() takes a literal default: a string, a number, a boolean, null or undefined"
                .into(),
        help: Some("an environment value is a token or a plain value, never a style or an object".into()),
        docs: vec![Doc::Tour(Tour::Environment)],
    })
}

/// `.environment(key, value)`: a literal value has the kind of the key's default.
pub fn environment_value(expected: Literal, found: Literal, span: Span) -> Option<Problem> {
    (found != expected).then(|| Problem {
        span,
        message: format!(".environment() sets a {} value to a {}", expected.name(), found.name()),
        help: Some(format!(
            "the value has the type of the key's default (defineEnvironment): pass a {}",
            expected.name()
        )),
        docs: vec![Doc::Tour(Tour::Environment), Doc::modifier("environment")],
    })
}
