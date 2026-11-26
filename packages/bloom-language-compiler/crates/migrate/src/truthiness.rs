//! JS truthiness that bloomc's types spell out. A condition the codemod could not
//! type is written as is (`if user { … }`); bloomc then says what it is
//! (B0201 "expected `Bool`, found `User?`"), and the condition becomes the test
//! JS meant: `user != none`, `!name.isEmpty`, `count != 0`. Only the operands the
//! codemod recorded as conditions are rewritten, and only from a type whose
//! truthiness has a `.bloom` spelling; anything else stays an error (a refusal).

use std::collections::HashSet;

use bloom_lang::Diagnostic;

/// `source` with each recorded condition bloomc found not `Bool` spelled out, or
/// `None` when there is nothing to spell.
pub fn spell(source: &str, diagnostics: &[Diagnostic], conditions: &HashSet<String>) -> Option<String> {
    let mut edits: Vec<(usize, usize, String)> = Vec::new();
    for d in diagnostics {
        if d.code != "B0201" {
            continue;
        }
        let Some(found) =
            d.message.strip_prefix("expected `Bool`, found `").and_then(|m| m.strip_suffix('`'))
        else {
            continue;
        };
        let (start, end) = (d.span.start as usize, d.span.end as usize);
        let Some(text) = source.get(start..end) else { continue };
        // bloomc may point at a negation as a whole (`!name.trimmed()`).
        let (negated, operand) = match text.strip_prefix('!') {
            Some(rest) if !conditions.contains(text) => (true, rest),
            _ => (false, text),
        };
        if !conditions.contains(operand) {
            continue;
        }
        // A `!` written before the operand (`!x`, not part of the span) negates it too.
        // (`!!x`, `Boolean(x)`, is `x`'s truthiness itself.)
        let (start, negated) = if source[..start].ends_with("!!") {
            (start - 2, negated)
        } else if source[..start].ends_with('!') {
            (start - 1, !negated)
        } else {
            (start, negated)
        };
        let Some(test) = test(operand, found, negated) else { continue };
        let test = if source[..start].ends_with(['.', '!']) { format!("({test})") } else { test };
        if edits.iter().any(|(s, e, _)| start < *e && *s < end) {
            continue;
        }
        edits.push((start, end, test));
    }
    edits.sort_by_key(|(start, ..)| std::cmp::Reverse(*start));
    let mut out = source.to_string();
    for (start, end, test) in &edits {
        out.replace_range(*start..*end, test);
    }
    // `Boolean(x)` was `!!x` for bloomc to type `x`; it is now a `Bool` either way.
    let out = drop_double_negation(&out);
    if edits.is_empty() && out == source { None } else { Some(out) }
}

/// `!!x` as `x`, outside string literals (the codemod writes `!!` only for `Boolean(x)`).
fn drop_double_negation(source: &str) -> String {
    let mut out = String::with_capacity(source.len());
    let mut chars = source.chars().peekable();
    let mut in_string = false;
    while let Some(c) = chars.next() {
        if in_string {
            out.push(c);
            match c {
                '\\' => out.extend(chars.next()),
                '"' => in_string = false,
                _ => {}
            }
            continue;
        }
        match c {
            '"' => {
                in_string = true;
                out.push(c);
            }
            '!' if chars.peek() == Some(&'!') => {
                chars.next();
            }
            _ => out.push(c),
        }
    }
    out
}

/// The truthiness test of `text`, of the Bloom type `ty` (its negation with `negated`).
fn test(text: &str, ty: &str, negated: bool) -> Option<String> {
    let operand = if is_postfix(text) { text.to_string() } else { format!("({text})") };
    let (eq, not) = if negated { ("==", "") } else { ("!=", "!") };
    Some(match ty {
        "String" => format!("{not}{operand}.isEmpty"),
        "Int" | "Float" => format!("{operand} {eq} 0"),
        "String?" => format!("({text} ?? \"\") {eq} \"\""),
        "Int?" | "Float?" => format!("({text} ?? 0) {eq} 0"),
        "Bool?" => format!("{operand} {} true", if negated { "!=" } else { "==" }),
        // Any other optional is truthy when present: an object, a list, a view, a function.
        t if t.ends_with('?') && !t.contains('|') => format!("{operand} {eq} none"),
        _ => return None,
    })
}

/// Whether `text` is a name or a member chain (`a.b.c`, `a?.b`): no parentheses needed.
fn is_postfix(text: &str) -> bool {
    crate::expr::is_postfix_text(text)
}
