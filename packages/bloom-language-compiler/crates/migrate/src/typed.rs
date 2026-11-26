//! JS members that bloomc's types name. A member the codemod could not type is
//! written as JS wrote it (`picked.has(id)`); bloomc then says what the receiver
//! is (B0209 "`Set<String>` has no method `has`") and the member becomes its
//! `.bloom` name. Only receivers whose type has the member under another name are
//! rewritten; anything else stays an error (a refusal).

use bloom_lang::Diagnostic;

/// `source` with each member bloomc named respelled, or `None` when there is none.
pub fn fix(source: &str, diagnostics: &[Diagnostic]) -> Option<String> {
    let mut edits: Vec<(usize, usize, String)> = Vec::new();
    for d in diagnostics {
        let (start, end) = (d.span.start as usize, d.span.end as usize);
        let Some(text) = source.get(start..end) else { continue };
        let receiver = d.message.strip_prefix('`').and_then(|m| m.split_once('`')).map(|(r, _)| r);
        let collection = receiver.is_some_and(|r| r.starts_with("Set<") || r.starts_with("Map<"));
        let edit = match (&*d.code, text) {
            // `s.has(x)`, `m.size`: a Bloom `Set`/`Map` has `contains` and `count`.
            ("B0209", "has") if collection => Some((start, end, "contains".to_string())),
            ("B0205", "size") if collection => Some((start, end, "count".to_string())),
            // `new Set(s)` copies `s`; a Bloom `Set` is a value, so the copy is `s`.
            ("B0201", _) => {
                let found = d.message.split("found `").nth(1).unwrap_or_default();
                let copied = ["Set(", "Map("]
                    .iter()
                    .find(|ctor| found.starts_with(&ctor[..3]) && source[..start].ends_with(*ctor));
                match copied {
                    Some(ctor) if source[end..].starts_with(')') => {
                        Some((start - ctor.len(), end + 1, text.to_string()))
                    }
                    _ => None,
                }
            }
            _ => None,
        };
        if let Some((s, e, t)) = edit
            && !edits.iter().any(|(a, b, _)| s < *b && *a < e)
        {
            edits.push((s, e, t));
        }
    }
    if edits.is_empty() {
        return None;
    }
    edits.sort_by_key(|(start, ..)| std::cmp::Reverse(*start));
    let mut out = source.to_string();
    for (start, end, text) in &edits {
        out.replace_range(*start..*end, text);
    }
    Some(out)
}
