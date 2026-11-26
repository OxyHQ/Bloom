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
