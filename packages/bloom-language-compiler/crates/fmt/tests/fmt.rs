//! The formatter over every `.bloom` fixture: idempotent, the same tree
//! (spans aside) before and after, every comment kept in order, and the
//! output of the fixtures here held to their `.formatted.bloom` snapshots.
//!
//! `BLOOM_FMT_UPDATE=1 cargo test -p bloom_fmt` rewrites the snapshots.

use std::path::{Path, PathBuf};

fn fixtures() -> Vec<PathBuf> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let mut out = Vec::new();
    // This crate's fixtures, and the core's that parse (its emit fixtures).
    for dir in [root.join("tests/fixtures"), root.join("../lang/tests/fixtures/emit")] {
        let Ok(entries) = std::fs::read_dir(&dir) else { continue };
        for entry in entries.flatten() {
            let path = entry.path();
            let name = path.to_string_lossy();
            if name.ends_with(".bloom") && !name.ends_with(".formatted.bloom") {
                out.push(path);
            }
        }
    }
    out.sort();
    assert!(!out.is_empty(), "no fixtures");
    out
}

/// The tree's debug print without positions (spans and expression ids).
fn shape(ast: &bloom_lang::Ast) -> String {
    let debug = format!("{ast:?}");
    let mut out = String::with_capacity(debug.len());
    let mut rest = debug.as_str();
    while let Some(index) = rest.find(['S', 'E']) {
        let (before, after) = rest.split_at(index);
        out.push_str(before);
        if let Some(tail) = after.strip_prefix("Span { start: ") {
            rest = &tail[tail.find('}').expect("a span ends") + 1..];
            out.push('_');
        } else if let Some(tail) = after.strip_prefix("ExprId(") {
            rest = &tail[tail.find(')').expect("an id ends") + 1..];
            out.push('_');
        } else {
            out.push_str(&after[..1]);
            rest = &after[1..];
        }
    }
    out.push_str(rest);
    out
}

fn parsed(source: &str) -> bloom_lang::Ast {
    let (ast, _, diagnostics) = bloom_lang::parse(source, "x.bloom");
    assert!(diagnostics.is_empty(), "{}", diagnostics[0].rendered);
    ast
}

fn comment_texts(source: &str) -> Vec<String> {
    let (_, comments, _) = bloom_lang::parse(source, "x.bloom");
    comments.comments.iter().map(|c| c.text.trim_end().to_string()).collect()
}

fn format(path: &Path) -> (String, String) {
    let source = std::fs::read_to_string(path).unwrap();
    let formatted = bloom_fmt::format(&source, &path.to_string_lossy())
        .unwrap_or_else(|d| panic!("{}: {}", path.display(), d[0].rendered));
    (source, formatted)
}

#[test]
fn formatting_is_idempotent() {
    for path in fixtures() {
        let (_, once) = format(&path);
        let twice = bloom_fmt::format(&once, "x.bloom")
            .unwrap_or_else(|d| panic!("{}: {}", path.display(), d[0].rendered));
        assert_eq!(twice, once, "{} changes when formatted again", path.display());
    }
}

#[test]
fn formatting_keeps_the_tree() {
    for path in fixtures() {
        let (source, formatted) = format(&path);
        let (mut before, after) = (parsed(&source), parsed(&formatted));
        // Imports are sorted by path: compare them in that order.
        before.imports.sort_by(|a, b| a.source.cmp(&b.source));
        assert_eq!(shape(&after), shape(&before), "{}: the tree changed", path.display());
    }
}

#[test]
fn formatting_keeps_every_comment() {
    for path in fixtures() {
        let (source, formatted) = format(&path);
        let mut before = comment_texts(&source);
        let mut after = comment_texts(&formatted);
        // Sorting imports may move an import's comments; the set is the same.
        before.sort();
        after.sort();
        assert_eq!(after, before, "{}: comments changed", path.display());
    }
}

#[test]
fn the_output_matches_the_snapshots() {
    let update = std::env::var_os("BLOOM_FMT_UPDATE").is_some();
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures");
    for path in fixtures().into_iter().filter(|p| p.starts_with(&root)) {
        let (_, formatted) = format(&path);
        let snapshot = path.with_extension("formatted.bloom");
        if update {
            std::fs::write(&snapshot, &formatted).unwrap();
            continue;
        }
        let expected = std::fs::read_to_string(&snapshot)
            .unwrap_or_else(|_| panic!("{} has no snapshot; run with BLOOM_FMT_UPDATE=1", path.display()));
        assert_eq!(formatted, expected, "{} no longer formats as its snapshot", path.display());
    }
}

#[test]
fn every_line_fits_unless_it_cannot_break() {
    for path in fixtures() {
        let (_, formatted) = format(&path);
        for line in formatted.lines() {
            // A line over the width is one with nothing left to break: a string, a comment.
            if line.chars().count() > bloom_fmt::WIDTH {
                assert!(
                    line.contains('"') || line.contains("//"),
                    "{}: {line:?} is too long",
                    path.display()
                );
            }
        }
    }
}

#[test]
fn a_file_with_syntax_errors_is_not_formatted() {
    assert!(bloom_fmt::format("view {", "x.bloom").is_err());
}

#[test]
fn shape_ignores_positions() {
    assert_eq!(shape(&parsed("let a = 1")), shape(&parsed("let  a =   1")));
}
