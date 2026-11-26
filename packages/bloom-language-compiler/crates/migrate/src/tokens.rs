//! Typed tokens (ADR 0002, section 5): a string literal the checker reads as a token of a
//! set (`.padding("md")`, `.foreground("muted")`) is written by its Swift name (`.padding(.md)`,
//! `.foreground(.muted)`). A token without a Swift name (`"6"`, `"primary/10"`) stays a string.

use std::collections::BTreeMap;

/// `source` with its string tokens typed, or `None` when it has none.
pub fn typed(source: &str, filename: &str, options: &bloom_lang::Options) -> Option<String> {
    let checked = bloom_lang::check(source, filename, options);
    let mut edits: BTreeMap<usize, (usize, String)> = BTreeMap::new();
    for (span, ty) in &checked.types {
        let (start, end) = (span.start as usize, span.end as usize);
        let Some(literal) = source.get(start..end) else { continue };
        let Some(token) = literal.strip_prefix('"').and_then(|l| l.strip_suffix('"')) else { continue };
        if token.contains(['"', '\\']) {
            continue;
        }
        // The checker names a token set's type by the set, capitalised (`Space`, `IconSize`).
        let mut chars = ty.chars();
        let Some(first) = chars.next().filter(char::is_ascii_uppercase) else { continue };
        let set = first.to_ascii_lowercase().to_string() + chars.as_str();
        if let Some(swift) = bloom_lang::swift_token_name(&set, token) {
            edits.insert(start, (end, format!(".{swift}")));
        }
    }
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
