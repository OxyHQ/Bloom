//! i18next's `t()` as the standard library's localized strings (ADR 0002, section 3):
//!
//! | TS (react-i18next) | Bloom 2.0 |
//! |---|---|
//! | `const { t } = useTranslation()` | (gone: localization is the standard library's) |
//! | `t("feed.empty")`, `t("k", { defaultValue: "…" })` | `String(localized: "feed.empty")` (the catalog holds the text) |
//! | `t("k", { count: n })` | `String(localized: "k", count: n)` |
//! | `t("k", { name: x })` | `String(localized: "k", args: ["name": "\(x)"])` |
//!
//! The keys are checked against the package's `Resources/Localizable` catalogs once it has
//! them (B0840). A file that still reads `i18n` keeps its `useTranslation()` for it.

use std::collections::BTreeMap;

use bloom_lang::analysis::{Node, walk_file};
use bloom_lang::ast::*;

const HOOK: &str = "useTranslation";

/// `source` with its `t(…)` calls localized, or `None` when it has none.
pub fn localize(source: &str, filename: &str) -> Option<String> {
    let (file, _, diagnostics) = bloom_lang::parse(source, filename);
    if !diagnostics.is_empty() {
        return None;
    }
    // The destructuring lines: `let { t } = useTranslation()` (or with `i18n`, kept for it).
    let mut edits: BTreeMap<usize, (usize, String)> = BTreeMap::new();
    let mut found = false;
    let mut at = 0;
    for line in source.split_inclusive('\n') {
        let trimmed = line.trim();
        let start = at;
        at += line.len();
        let Some(inner) =
            trimmed.strip_prefix("let {").and_then(|l| l.strip_suffix(&format!("}} = {HOOK}()")))
        else {
            continue;
        };
        let names: Vec<&str> = inner.split(',').map(str::trim).collect();
        if !names.contains(&"t") {
            continue;
        }
        found = true;
        let rest: Vec<&str> = names.into_iter().filter(|n| *n != "t").collect();
        let indent = &line[..line.len() - line.trim_start().len()];
        let text = if rest.is_empty() {
            String::new()
        } else {
            format!("{indent}let {{ {} }} = {HOOK}()\n", rest.join(", "))
        };
        edits.insert(start, (at, text));
    }
    if !found {
        return None;
    }
    let slice = |s: Span| &source[s.start as usize..s.end as usize];
    let mut unknown = false;
    walk_file(&file, &mut |node| {
        let Node::Expr(e) = node else { return };
        let ExprKind::Call(call) = &e.kind else { return };
        if !matches!(&call.callee.kind, ExprKind::Name(n) if n == "t") || call.trailing.is_some() {
            return;
        }
        let Some((key, options)) = call.args.split_first() else { return };
        if key.label.is_some() || key.spread {
            unknown = true;
            return;
        }
        // The options: labelled arguments, or one record.
        let mut fields: Vec<(&str, &Expr)> = Vec::new();
        for option in options {
            match (&option.label, &option.value.kind) {
                (Some(label), _) => fields.push((label.name.as_str(), &option.value)),
                // `t("k", "Default")`: i18next's default text, which the catalog holds.
                (None, ExprKind::Str { .. }) if !option.spread => {}
                (None, ExprKind::Record(entries)) if !option.spread => {
                    for entry in entries {
                        match entry {
                            RecordEntry::Field { key, value } => fields.push((key.name.as_str(), value)),
                            RecordEntry::Spread(_) => unknown = true,
                        }
                    }
                }
                _ => unknown = true,
            }
        }
        let mut out = format!("String(localized: {}", slice(key.value.span));
        let mut args = Vec::new();
        for (name, value) in fields {
            match name {
                "defaultValue" => {}
                "count" => out.push_str(&format!(", count: {}", slice(value.span))),
                _ => args.push(format!("\"{name}\": \"\\({})\"", slice(value.span))),
            }
        }
        if !args.is_empty() {
            out.push_str(&format!(", args: [{}]", args.join(", ")));
        }
        out.push(')');
        edits.insert(e.span.start as usize, (e.span.end as usize, out));
    });
    if unknown {
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
    // The hook's import, once nothing calls it.
    if !out.contains(&format!("{HOOK}()")) {
        out = out
            .lines()
            .filter_map(|l| {
                if !(l.starts_with("import ") && l.contains("\"react-i18next\"")) {
                    return Some(l.to_string());
                }
                let open = l.find('{')?;
                let close = l.find('}')?;
                let names: Vec<&str> = l[open + 1..close]
                    .split(',')
                    .map(str::trim)
                    .filter(|n| !n.is_empty() && *n != HOOK)
                    .collect();
                (!names.is_empty())
                    .then(|| format!("{}{{ {} }}{}", &l[..open], names.join(", "), &l[close + 1..]))
            })
            .collect::<Vec<_>>()
            .join("\n")
            + "\n";
    }
    Some(out)
}
