//! BloomUI's SwiftUI names (ADR 0002, section 3), written where the language's own are:
//! the inverse of `bloom_lang::bloomui`'s lowering, so a migrated file reads as SwiftUI does.
//!
//! | The language's | Written |
//! |---|---|
//! | `VStack { … }.align(a).spacing(s)` | `VStack(alignment: a, spacing: s) { … }` (and `HStack`) |
//! | `.foreground(x)`, `.lines(n)` | `.foregroundStyle(x)`, `.lineLimit(n)` |
//! | `Loading()` | `ProgressView()` |
//!
//! A name the file declares itself is left alone, as the lowering leaves it.

use std::collections::{BTreeMap, HashSet};

use bloom_lang::analysis::{Node, walk_file};
use bloom_lang::ast::*;

/// `source` in SwiftUI's names, or `None` when nothing changes.
pub fn names(source: &str, filename: &str) -> Option<String> {
    let (file, _, diagnostics) = bloom_lang::parse(source, filename);
    if !diagnostics.is_empty() {
        return None;
    }
    let own: HashSet<&str> = file.items.iter().map(|i| i.kind.name().name.as_str()).collect();
    // start → (end, replacement); an edit inside one already taken is skipped.
    let mut edits: BTreeMap<usize, (usize, String)> = BTreeMap::new();
    walk_file(&file, &mut |node| {
        let Node::Expr(e) = node else { return };
        let ExprKind::Call(call) = &e.kind else { return };
        match &call.callee.kind {
            ExprKind::Field(object, member) => {
                let renamed = match member.name.as_str() {
                    "foreground" => Some("foregroundStyle"),
                    "lines" => Some("lineLimit"),
                    _ => None,
                };
                if let Some(renamed) = renamed {
                    edits.insert(member.span.start as usize, (member.span.end as usize, renamed.to_string()));
                }
                // `VStack { … }.align(a).spacing(s)`: the outermost of the stack's own modifiers.
                if matches!(member.name.as_str(), "align" | "spacing") {
                    let _ = object;
                    stack_arguments(e, &own, source, &mut edits);
                }
            }
            ExprKind::Name(name) if name == "Loading" && call.args.is_empty() && !own.contains("Loading") => {
                let span = call.callee.span;
                edits.insert(span.start as usize, (span.end as usize, "ProgressView".to_string()));
            }
            _ => {}
        }
    });
    apply(source, edits)
}

/// The stack under `.align(a)`/`.spacing(s)` modifiers (`outer` the outermost), with them
/// as its `alignment:`/`spacing:` arguments.
fn stack_arguments(
    outer: &Expr,
    own: &HashSet<&str>,
    source: &str,
    edits: &mut BTreeMap<usize, (usize, String)>,
) {
    // Peel `.align`/`.spacing` calls down to the stack.
    let mut alignment = None;
    let mut spacing = None;
    let mut at = outer;
    loop {
        let ExprKind::Call(call) = &at.kind else { return };
        match &call.callee.kind {
            ExprKind::Field(object, member)
                if matches!(member.name.as_str(), "align" | "spacing")
                    && call.args.len() == 1
                    && call.args[0].label.is_none()
                    && call.trailing.is_none() =>
            {
                let value = &call.args[0].value;
                let slot = if member.name == "align" { &mut alignment } else { &mut spacing };
                if slot.is_some() {
                    return;
                }
                *slot = Some(&source[value.span.start as usize..value.span.end as usize]);
                at = object;
            }
            ExprKind::Name(name)
                if matches!(name.as_str(), "VStack" | "HStack")
                    && !own.contains(name.as_str())
                    && call.args.is_empty()
                    && call.trailing.is_some() =>
            {
                let mut args = Vec::new();
                if let Some(a) = alignment {
                    args.push(format!("alignment: {a}"));
                }
                if let Some(s) = spacing {
                    args.push(format!("spacing: {s}"));
                }
                let callee = call.callee.span;
                // Only the outermost modifier makes the edit: an inner one is inside it.
                edits.retain(|&start, _| {
                    !(start >= at.span.start as usize && start < outer.span.end as usize)
                });
                let stack = &source[callee.end as usize..at.span.end as usize];
                edits.insert(
                    callee.start as usize,
                    (outer.span.end as usize, format!("{name}({}){stack}", args.join(", "))),
                );
                return;
            }
            _ => return,
        }
    }
}

fn apply(source: &str, edits: BTreeMap<usize, (usize, String)>) -> Option<String> {
    if edits.is_empty() {
        return None;
    }
    let mut out = String::with_capacity(source.len());
    let mut at = 0;
    for (start, (end, text)) in edits {
        if start < at {
            continue;
        }
        out.push_str(&source[at..start]);
        out.push_str(&text);
        at = end;
    }
    out.push_str(&source[at..]);
    Some(out)
}

/// TS's module-private declarations (not exported) as 2.0's `private`: a module is a
/// directory of files in 2.0, so an unwritten (internal) name would be seen by every file
/// of the module, and two files' helpers of one name would collide.
pub fn private_items(source: &str, filename: &str) -> Option<String> {
    let (file, _, diagnostics) = bloom_lang::parse(source, filename);
    if !diagnostics.is_empty() {
        return None;
    }
    let mut edits = BTreeMap::new();
    for item in &file.items {
        let skipped = matches!(item.kind, ItemKind::Extension(_) | ItemKind::Extern(_) | ItemKind::Test(_));
        if skipped || item.modifiers.visibility_span.is_some() || !item.modifiers.attrs.is_empty() {
            continue;
        }
        // A screen or a layout is its route's export.
        if let ItemKind::View(v) = &item.kind
            && v.kind != ViewKind::View
        {
            continue;
        }
        let at = item.span.start as usize;
        edits.insert(at, (at, "private ".to_string()));
    }
    apply(source, edits)
}

/// `Icon(RiCloseLine)` with the glyph imported from `@oxy.so/bloom/icons/…` as `Icon(.close)`,
/// Bloom's icon set by name (checked at compile time); the import goes once nothing else
/// reads it. The inverse of `bloom_lang::bloomui::icon_component`.
pub fn icons(source: &str, filename: &str) -> Option<String> {
    let (file, _, diagnostics) = bloom_lang::parse(source, filename);
    if !diagnostics.is_empty() {
        return None;
    }
    let glyphs: HashSet<String> = file
        .imports
        .iter()
        .filter(|i| i.source.starts_with("@oxy.so/bloom/icons/"))
        .filter_map(|i| match &i.kind {
            ImportKind::Named(specs) => {
                Some(specs.iter().map(|s| s.local().name.clone()).collect::<Vec<_>>())
            }
            _ => None,
        })
        .flatten()
        .collect();
    let mut edits = BTreeMap::new();
    walk_file(&file, &mut |node| {
        let Node::Expr(e) = node else { return };
        let ExprKind::Call(call) = &e.kind else { return };
        if !matches!(&call.callee.kind, ExprKind::Name(n) if n == "Icon") {
            return;
        }
        let [only] = call.args.as_slice() else { return };
        let ExprKind::Name(glyph) = &only.value.kind else { return };
        if only.label.is_some() || !glyphs.contains(glyph) {
            return;
        }
        let Some(name) = icon_name(glyph) else { return };
        if bloom_lang::bloomui::icon_component(&name) != *glyph {
            return;
        }
        let span = only.value.span;
        edits.insert(span.start as usize, (span.end as usize, format!(".{name}")));
    });
    let out = apply(source, edits)?;
    // The imports of glyphs nothing reads now.
    let code: String = out.lines().filter(|l| !l.starts_with("import ")).collect::<Vec<_>>().join("\n");
    let reads = |name: &str| {
        code.match_indices(name).any(|(i, _)| {
            let word = |c: char| c.is_alphanumeric() || c == '_';
            !code[..i].chars().next_back().is_some_and(word)
                && !code[i + name.len()..].chars().next().is_some_and(word)
        })
    };
    let kept: Vec<&str> = out
        .split_inclusive('\n')
        .filter(|line| {
            let Some(rest) = line.strip_prefix("import { ") else { return true };
            match rest.split_once(" } from \"@oxy.so/bloom/icons/") {
                Some((name, _)) => reads(name),
                None => true,
            }
        })
        .collect();
    Some(kept.concat())
}

/// `RiCloseLine` → `close`, `RiHeartFill` → `heartFill`, `LikeIcon` → `like`.
fn icon_name(component: &str) -> Option<String> {
    let base = if let Some(own) = component.strip_suffix("Icon") {
        own.to_string()
    } else {
        let remix = component.strip_prefix("Ri")?;
        remix.strip_suffix("Line").map_or_else(|| remix.to_string(), str::to_string)
    };
    let mut chars = base.chars();
    let first = chars.next()?;
    Some(first.to_ascii_lowercase().to_string() + chars.as_str())
}
