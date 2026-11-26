//! JS truthiness that bloomc's types spell out. A condition the codemod could not
//! type is written as is (`if user { … }`); bloomc then says what it is
//! (B0201 "expected `Bool`, found `User?`"), and the condition becomes the test
//! JS meant: `user != none`, `!name.isEmpty`, `count != 0`. Only the operands the
//! codemod recorded as conditions are rewritten, and only from a type whose
//! truthiness has a `.bloom` spelling; anything else stays an error (a refusal).

use std::collections::{HashMap, HashSet};

use bloom_lang::Diagnostic;

/// `source` with each recorded condition bloomc found not `Bool` spelled out, or
/// `None` when there is nothing to spell.
pub fn spell(
    source: &str,
    diagnostics: &[Diagnostic],
    conditions: &HashSet<String>,
    defaults_of: &HashMap<String, String>,
) -> Option<String> {
    let (mut edits, reserved) = defaults(source, diagnostics, defaults_of);
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
        // `if x {` on an optional object: the branch may read it, so it is unwrapped.
        let whole_if = source[..start].ends_with("if ") && source[end..].starts_with(" {");
        let plain = operand.chars().all(|c| c.is_alphanumeric() || c == '_');
        let object = found.ends_with('?') && !matches!(found, "String?" | "Int?" | "Float?" | "Bool?");
        if whole_if && plain && object && !negated {
            edits.push((start, end, format!("let {operand} = {operand}")));
            continue;
        }
        let Some(test) = test(operand, found, negated) else { continue };
        let test = if source[..start].ends_with(['.', '!']) { format!("({test})") } else { test };
        if edits.iter().any(|(s, e, _)| start < *e && *s < end)
            || reserved.iter().any(|(s, e)| start < *e && *s < end)
        {
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

/// `a || b` as a value, where bloomc found `a` not `Bool`: JS's "`b` when `a` is
/// falsy", spelled from `a`'s type. Returns the edits, whole `a || b` spans, and
/// the spans of the `||`s left for a later round (one holding another: the inner
/// one is spelled first, `a || (b || c)`).
pub fn defaults(
    source: &str,
    diagnostics: &[Diagnostic],
    defaults: &HashMap<String, String>,
) -> (Vec<(usize, usize, String)>, Vec<(usize, usize)>) {
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
        let Some(left) = source.get(start..end) else { continue };
        let Some(right) = defaults.get(&squeeze(left)) else { continue };
        // ` || right`, however bloom_fmt broke the lines.
        let rest = &source[end..];
        let Some(op) = rest.find(|c: char| !c.is_whitespace()).filter(|&i| rest[i..].starts_with("||"))
        else {
            continue;
        };
        // A parenthesised default (the rest of a chain) is matched as a group: an
        // earlier round may have spelled the `||` inside it.
        let grouped = right.starts_with('(') && right.ends_with(')');
        let len = if grouped { group_len(&rest[op + 2..]) } else { squeezed_prefix(&rest[op + 2..], right) };
        let Some(len) = len else { continue };
        let tail_len = op + 2 + len;
        let right_text = squeeze_lines(rest[op + 2..op + 2 + len].trim());
        let right = right_text.as_str();
        let left = &squeeze_lines(left);
        let a = if is_postfix(left) { left.to_string() } else { format!("({left})") };
        let text = match found {
            "String" => format!("{a}.isEmpty ? {right} : {a}"),
            "Int" | "Float" => format!("{a} == 0 ? {right} : {a}"),
            "String?" => format!("({left} ?? \"\") == \"\" ? {right} : {a} ?? \"\""),
            "Int?" | "Float?" => format!("({left} ?? 0) == 0 ? {right} : {a} ?? 0"),
            "Bool?" => format!("{a} == true || {right}"),
            t if t.ends_with('?') && (!t.contains('|') || literal_union(t)) => format!("{a} ?? {right}"),
            _ => continue,
        };
        // Inside a larger expression the conditional keeps its own parentheses.
        let before = source[..start].trim_end();
        let after = source[end + tail_len..].trim_start();
        let bare = (before.ends_with([':', '(', '{', ',', '=']) || before.ends_with("return"))
            && (after.starts_with([')', ',', '}', '\n']) || after.is_empty());
        let text =
            if bare || text.contains("??") && !text.contains('?') { text } else { format!("({text})") };
        edits.push((start, end + tail_len, text));
    }
    // An `||` holding another waits: the inner one is spelled this round.
    let held: Vec<usize> = (0..edits.len())
        .filter(|&i| {
            let (s, e, _) = &edits[i];
            edits
                .iter()
                .enumerate()
                .any(|(j, (s2, e2, _))| j != i && s <= s2 && e2 <= e && (s, e) != (s2, e2))
        })
        .collect();
    let reserved = held.iter().map(|&i| (edits[i].0, edits[i].1)).collect();
    let edits = edits.into_iter().enumerate().filter(|(i, _)| !held.contains(i)).map(|(_, e)| e).collect();
    (edits, reserved)
}

/// The length of the parenthesised group at the start of `source` (after spaces).
fn group_len(source: &str) -> Option<usize> {
    let start = source.find(|c: char| !c.is_whitespace())?;
    if !source[start..].starts_with('(') {
        return None;
    }
    let mut depth = 0i32;
    let mut quote = false;
    let mut prev = ' ';
    for (i, c) in source[start..].char_indices() {
        if quote {
            if c == '"' && prev != '\\' {
                quote = false;
            }
            prev = c;
            continue;
        }
        match c {
            '"' => quote = true,
            '(' | '[' | '{' => depth += 1,
            ')' | ']' | '}' => {
                depth -= 1;
                if depth == 0 {
                    return Some(start + i + 1);
                }
            }
            _ => {}
        }
        prev = c;
    }
    None
}

/// Text without its layout: no whitespace, no trailing commas.
pub fn squeeze(text: &str) -> String {
    let flat: String = text.chars().filter(|c| !c.is_whitespace()).collect();
    flat.replace(",)", ")").replace(",]", "]").replace(",}", "}")
}

/// A multi-line expression on one line (bloom_fmt breaks it again).
fn squeeze_lines(text: &str) -> String {
    text.split('\n').map(str::trim).collect::<Vec<_>>().join(" ").replace("( ", "(").replace(", )", ")")
}

/// The length of `source`'s prefix that is `text` up to layout.
fn squeezed_prefix(source: &str, text: &str) -> Option<usize> {
    let want = squeeze(text);
    let mut got = String::new();
    for (i, c) in source.char_indices() {
        if !c.is_whitespace() {
            got.push(c);
        }
        if squeeze(&got) == want && !c.is_whitespace() {
            return Some(i + c.len_utf8());
        }
        if got.len() > want.len() + 8 {
            return None;
        }
    }
    None
}

/// `"a" | "b"?`: an optional union of string literals none of which is `""`.
fn literal_union(ty: &str) -> bool {
    let inner = ty.trim_end_matches('?').trim_start_matches('(').trim_end_matches(')');
    inner.split('|').all(|c| {
        let c = c.trim();
        c.len() > 2 && c.starts_with('"') && c.ends_with('"')
    })
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
