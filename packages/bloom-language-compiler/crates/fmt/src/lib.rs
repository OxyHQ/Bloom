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
    let (file, comments, diagnostics) = bloom_lang::parse(source, filename);
    if !diagnostics.is_empty() {
        return Err(diagnostics);
    }
    // A `public` declaration that names a type of the file makes it public too, until none is
    // left (each round can expose the types a newly public one names).
    let mut publicize: Vec<String> = Vec::new();
    let (out, notes) = loop {
        let migration = Migration { labels: labels(&file), publicize: publicize.clone(), notes: Vec::new() };
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
    fns.into_iter()
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
