//! JS globals the standard library has (ADR 0002, section 3), written by its names:
//!
//! | TS (`import { … } from "js"`) | Bloom 2.0 |
//! |---|---|
//! | `encodeURIComponent(s)`, `decodeURIComponent(s)` | `percentEncoded(s)`, `percentDecoded(s)` |
//!
//! The `"js"` import of a name goes once nothing reads it.

use std::collections::BTreeMap;

use bloom_lang::analysis::{Node, walk_file};
use bloom_lang::ast::*;

const RENAMED: &[(&str, &str)] =
    &[("encodeURIComponent", "percentEncoded"), ("decodeURIComponent", "percentDecoded")];

pub fn globals(source: &str, filename: &str) -> Option<String> {
    let (file, _, diagnostics) = bloom_lang::parse(source, filename);
    if !diagnostics.is_empty() {
        return None;
    }
    let from_js: Vec<String> = file
        .imports
        .iter()
        .filter(|i| i.source == "js")
        .filter_map(|i| match &i.kind {
            ImportKind::Named(specs) => {
                Some(specs.iter().map(|s| s.local().name.clone()).collect::<Vec<_>>())
            }
            _ => None,
        })
        .flatten()
        .collect();
    let mut edits: BTreeMap<usize, (usize, String)> = BTreeMap::new();
    walk_file(&file, &mut |node| {
        let Node::Expr(e) = node else { return };
        let ExprKind::Call(call) = &e.kind else { return };
        match &call.callee.kind {
            ExprKind::Name(name) if from_js.contains(name) => {
                if let Some((_, to)) = RENAMED.iter().find(|(from, _)| from == name) {
                    let span = call.callee.span;
                    edits.insert(span.start as usize, (span.end as usize, to.to_string()));
                }
            }
            _ => {}
        }
    });
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
    // `import { a, b } from "js"` without the names nothing reads now.
    let code: String = out.lines().filter(|l| !l.starts_with("import ")).collect::<Vec<_>>().join("\n");
    let reads = |name: &str| {
        let word = |c: char| c.is_alphanumeric() || c == '_';
        code.match_indices(name).any(|(i, _)| {
            !code[..i].chars().next_back().is_some_and(word)
                && !code[i + name.len()..].chars().next().is_some_and(word)
        })
    };
    let lines: Vec<String> = out
        .split_inclusive('\n')
        .filter_map(|line| {
            let Some(inner) =
                line.strip_prefix("import { ").and_then(|l| l.trim_end().strip_suffix(" } from \"js\""))
            else {
                return Some(line.to_string());
            };
            let names: Vec<&str> =
                inner.split(',').map(str::trim).filter(|n| reads(n.trim_start_matches("type "))).collect();
            (!names.is_empty()).then(|| format!("import {{ {} }} from \"js\"\n", names.join(", ")))
        })
        .collect();
    Some(lines.concat())
}
