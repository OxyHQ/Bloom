//! `bloomc fmt`: the one canonical layout of a `.bloom` file (spec section 14).
//!
//! No options: two-space indent, 100 columns, a chain that does not fit goes
//! one modifier per line, trailing commas in multi-line argument lists, at
//! most one empty line, imports sorted by path, and every comment kept.
//! Formatting is idempotent, and the formatted file parses to the same tree.

mod doc;
mod format;

pub use format::Migration;

pub use bloom_lang::Diagnostic;

/// The width a line is fitted to.
pub const WIDTH: usize = 100;

/// The file formatted, or its syntax errors (a file that does not parse is
/// never rewritten).
pub fn format(source: &str, filename: &str) -> Result<String, Vec<Diagnostic>> {
    let (file, comments, diagnostics) = bloom_lang::parse(source, filename);
    if !diagnostics.is_empty() {
        return Err(diagnostics);
    }
    let doc = format::Formatter::new(source, &comments).file(&file);
    let mut out = doc::print(&doc, WIDTH);
    if !out.is_empty() {
        out.push('\n');
    }
    Ok(out)
}

/// `bloom migrate --from 0.x`: the file printed in 2.0's forms (`func`, labels, `public`,
/// `\(x)`, `switch`, `case`, `struct X: View`), and notes on what stays 0.x. The output is
/// re-parsed; a migration that does not parse is an error, never a write.
pub fn migrate(source: &str, filename: &str) -> Result<(String, Vec<String>), Vec<Diagnostic>> {
    let (file, _, diagnostics) = bloom_lang::parse(source, filename);
    if !diagnostics.is_empty() {
        return Err(diagnostics);
    }
    // A view's `effect` members as modifiers of its body, before the rest is printed.
    let effects = effects_as_modifiers(source, &file);
    let source = effects.as_deref().unwrap_or(source);
    let (file, comments, diagnostics) = bloom_lang::parse(source, filename);
    if !diagnostics.is_empty() {
        return Err(diagnostics);
    }
    // A `public` declaration that names a type of the file makes it public too, until none is
    // left (each round can expose the types a newly public one names).
    let mut publicize: Vec<String> = Vec::new();
    let (out, notes) = loop {
        let migration = Migration {
            labels: labels(&file),
            publicize: publicize.clone(),
            notes: Vec::new(),
            refs: Vec::new(),
        };
        let mut formatter = format::Formatter::migrating(source, &comments, migration);
        let doc = formatter.file(&file);
        let notes = formatter.into_notes();
        let mut out = doc::print(&doc, WIDTH);
        if !out.is_empty() {
            out.push('\n');
        }
        let more: Vec<String> =
            bloom_lang::exposed_types(&out).into_iter().filter(|n| !publicize.contains(n)).collect();
        if more.is_empty() || publicize.len() > 64 {
            break (out, notes);
        }
        publicize.extend(more);
    };
    let (_, _, diagnostics) = bloom_lang::parse(&out, filename);
    if !diagnostics.is_empty() {
        return Err(diagnostics);
    }
    let notes = notes
        .into_iter()
        .map(|(span, note)| {
            let line = source[..span.start as usize].matches('\n').count() + 1;
            format!("{filename}:{line}: {note}")
        })
        .collect();
    Ok((out, notes))
}

/// A 0.x view's `effect` members as 2.0's modifiers on its body (one expression): `effect(id:
/// 0)` or `effect(id: ())` (once) is `.onAppear { … }`, its top-level `defer` the
/// `.onDisappear { … }`; `effect(id: x)` is `.task(id: x) { … }`, its `defer` run when the
/// task is cancelled (as the effect's cleanup was). An `effect` without an `id:` re-runs for
/// what it reads, which no modifier says: it stays, and so does its view.
fn effects_as_modifiers(source: &str, file: &bloom_lang::ast::File) -> Option<String> {
    use bloom_lang::ast::*;
    let slice = |s: Span| &source[s.start as usize..s.end as usize];
    // start → (end, replacement)
    let mut edits: Vec<(usize, usize, String)> = Vec::new();
    for item in &file.items {
        let ItemKind::View(v) = &item.kind else { continue };
        if v.surface.is_some() {
            continue;
        }
        let effects: Vec<&EffectDecl> = v
            .members
            .iter()
            .filter_map(|m| match m {
                Member::Effect(e) => Some(e),
                _ => None,
            })
            .collect();
        let [Stmt { kind: StmtKind::Expr(root), .. }] = v.body.stmts.as_slice() else { continue };
        // An effect without an `id:` that resets state when a value changes (`if seen != v {
        // seen = v; … }`, TS's adjust-state-while-drawing) is an `.onChange(of: v)`: the test
        // holds only after `v` changed.
        let watched = |e: &EffectDecl| -> Option<Span> {
            let [Stmt { kind: StmtKind::Expr(only), .. }] = e.body.stmts.as_slice() else { return None };
            let ExprKind::If(i) = &only.kind else { return None };
            let Cond::Expr(cond) = &i.cond else { return None };
            let ExprKind::Binary(BinaryOp::Ne, seen, value) = &cond.kind else { return None };
            let ExprKind::Name(seen) = &seen.kind else { return None };
            let assigns = i.then.stmts.iter().any(|s| slice(s.span).starts_with(&format!("{seen} = ")));
            (i.otherwise.is_none() && assigns).then_some(value.span)
        };
        if effects.is_empty() || effects.iter().any(|e| e.id.is_none() && watched(e).is_none()) {
            continue;
        }
        // A view that stays 0.x for another reason keeps its effects as written.
        let stays = v.params.iter().flatten().any(|p| p.spread || p.rest)
            || v.members.iter().any(
                |m| matches!(m, Member::State(s) if matches!(s.attr, StateAttr::List | StateAttr::Record)),
            );
        if stays {
            continue;
        }
        // `.task(id:)` first: the parser reads `.onAppear`/`.onDisappear` only at the chain's end.
        let mut modifiers = String::new();
        let mut once = String::new();
        // A `.task`'s top-level `defer` runs when its body returns, where React ran the cleanup on
        // unmount or a new id: a body with a cleanup ends waiting for its cancellation
        // (`await Task.cancellation`, the stdlib's), so the `defer` runs then. A debounce, a
        // `setTimeout` its cleanup clears, is a cancellable `sleep(for:)` before the work
        // (repros/mention15/task-defer-runs-at-once).
        let task_body = |e: &EffectDecl| -> String {
            let stmts = &e.body.stmts;
            if !stmts.iter().any(|s| matches!(s.kind, StmtKind::Defer(_))) {
                return slice(e.body.span).to_string();
            }
            if let [before @ .., timer, cleanup] = stmts.as_slice()
                && let StmtKind::Let(l) = &timer.kind
                && let PatternKind::Bind(name) = &l.pattern.kind
                && let ExprKind::Call(call) = &l.value.kind
                && matches!(&call.callee.kind, ExprKind::Name(n) if n == "setTimeout")
                && let [work, delay] = call.args.as_slice()
                && work.label.is_none()
                && delay.label.is_none()
                && let ExprKind::Closure(work) = &work.value.kind
                && work.params.is_empty()
                && let StmtKind::Defer(block) = &cleanup.kind
                && let [clear] = block.stmts.as_slice()
                && slice(clear.span).trim() == format!("clearTimeout({})", name.name)
                && !before.iter().any(|s| slice(s.span).contains(name.name.as_str()))
            {
                let mut lines: Vec<String> = before.iter().map(|s| slice(s.span).to_string()).collect();
                lines.push(format!("try? await sleep(for: .milliseconds({}))", slice(delay.value.span)));
                lines.extend(work.body.iter().map(|s| slice(s.span).to_string()));
                return format!("{{\n{}\n}}", lines.join("\n"));
            }
            let body = slice(e.body.span);
            let close = body.rfind('}').unwrap_or(body.len());
            format!("{}\nawait Task.cancellation\n}}", body[..close].trim_end())
        };
        for effect in &effects {
            let Some(id) = effect.id.as_ref() else {
                let value = watched(effect).expect("a watched value");
                modifiers.push_str(&format!(
                    "\n.onChange(of: {}) {{ _, _ in\n{}\n}}",
                    slice(value),
                    slice(effect.body.stmts[0].span)
                ));
                continue;
            };
            let runs_once = matches!(id.kind, ExprKind::Unit | ExprKind::Int(_))
                || matches!(&id.kind, ExprKind::Tuple(values) if values.is_empty());
            if !runs_once {
                modifiers.push_str(&format!("\n.task(id: {}) {}", slice(id.span), task_body(effect)));
                continue;
            }
            let (defers, rest): (Vec<&Stmt>, Vec<&Stmt>) =
                effect.body.stmts.iter().partition(|s| matches!(s.kind, StmtKind::Defer(_)));
            if !rest.is_empty() {
                let lines: Vec<&str> = rest.iter().map(|s| slice(s.span)).collect();
                once.push_str(&format!("\n.onAppear {{\n{}\n}}", lines.join("\n")));
            }
            for defer in defers {
                let StmtKind::Defer(block) = &defer.kind else { continue };
                once.push_str(&format!("\n.onDisappear {}", slice(block.span)));
            }
        }
        modifiers.push_str(&once);
        for effect in &effects {
            // The member and the rest of its line.
            let end = source[effect.span.end as usize..]
                .find('\n')
                .map_or(source.len(), |i| effect.span.end as usize + i);
            edits.push((effect.span.start as usize, end, String::new()));
        }
        // A body that is an `if` or a `match` draws its branch: the modifiers go on a `Group`.
        if matches!(root.kind, ExprKind::If(_) | ExprKind::Match(_)) {
            edits.push((root.span.start as usize, root.span.start as usize, "Group {\n".to_string()));
            modifiers.insert_str(0, "\n}");
        }
        edits.push((root.span.end as usize, root.span.end as usize, modifiers));
    }
    if edits.is_empty() {
        return None;
    }
    edits.sort_by_key(|e| e.0);
    let mut out = String::with_capacity(source.len());
    let mut at = 0;
    for (start, end, text) in edits {
        out.push_str(&source[at..start]);
        out.push_str(&text);
        at = end;
    }
    out.push_str(&source[at..]);
    Some(without_unused_js_timers(out))
}

/// `setTimeout`/`clearTimeout` dropped from the file's `"js"` import once no debounce reads them
/// (a debounce is a `sleep(for:)` now), and the import with them when it names nothing else.
fn without_unused_js_timers(source: String) -> String {
    if !source.contains("} from \"js\"") {
        return source;
    }
    let mut out = String::with_capacity(source.len());
    let mut rest = source.as_str();
    while let Some(line_end) = rest.find('\n') {
        let line = &rest[..line_end];
        rest = &rest[line_end + 1..];
        let trimmed = line.trim();
        if let Some(names) = trimmed.strip_prefix("import {").and_then(|r| r.strip_suffix("} from \"js\"")) {
            let used = |name: &str| {
                source.match_indices(name).any(|(i, _)| {
                    let before = source[..i].chars().next_back();
                    let after = source[i + name.len()..].chars().next();
                    let word =
                        |c: Option<char>| c.is_some_and(|c| c.is_alphanumeric() || c == '_' || c == '$');
                    !word(before) && !word(after) && !source[..i].ends_with("import { ") && after == Some('(')
                })
            };
            let kept: Vec<&str> = names
                .split(',')
                .map(str::trim)
                .filter(|n| !n.is_empty())
                .filter(|n| !matches!(*n, "setTimeout" | "clearTimeout") || used(n))
                .collect();
            if kept.is_empty() {
                continue;
            }
            out.push_str(&format!("import {{ {} }} from \"js\"\n", kept.join(", ")));
            continue;
        }
        out.push_str(line);
        out.push('\n');
    }
    out.push_str(rest);
    out
}

/// Each local function's parameters: labelled (`Some(name)`) when a call in the file names
/// it, `_` otherwise, so every call keeps compiling.
fn labels(file: &bloom_lang::ast::File) -> std::collections::HashMap<String, Vec<Option<String>>> {
    use bloom_lang::analysis::{Node, walk_file};
    use bloom_lang::ast::*;
    let mut fns: Vec<&FnDecl> = Vec::new();
    for item in &file.items {
        match &item.kind {
            ItemKind::Fn(f) => fns.push(f),
            ItemKind::View(v) => fns.extend(v.members.iter().filter_map(|m| match m {
                Member::Fn(f) => Some(f),
                _ => None,
            })),
            _ => {}
        }
    }
    let mut named: std::collections::HashSet<(String, String)> = Default::default();
    walk_file(file, &mut |node| {
        if let Node::Expr(Expr { kind: ExprKind::Call(call), .. }) = node
            && let ExprKind::Name(callee) = &call.callee.kind
        {
            for arg in &call.args {
                if let Some(label) = &arg.label {
                    named.insert((callee.clone(), label.name.clone()));
                }
            }
        }
    });
    // A 2.0 `func` has its labels already (and may be overloaded by them): only a 0.x `fn`'s are
    // read off its calls.
    fns.into_iter()
        .filter(|f| !f.func)
        .map(|f| {
            let labels = f
                .params
                .iter()
                .map(|p| {
                    named.contains(&(f.name.name.clone(), p.name.name.clone())).then(|| p.name.name.clone())
                })
                .collect();
            (f.name.name.clone(), labels)
        })
        .collect()
}
