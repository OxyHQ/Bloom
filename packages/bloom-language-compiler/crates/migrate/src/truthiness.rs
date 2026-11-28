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
    defaults_of: &HashMap<String, Vec<String>>,
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
        // A condition's tuple read may have been respelled since (`xs?[0]` is `xs.0`, typed.rs).
        if !conditions.contains(operand) && !conditions.iter().any(|c| tuple_reads(c) == operand) {
            continue;
        }
        // A `!` written before the operand (`!x`, not part of the span) negates it too.
        // (`!!x`, `Boolean(x)`, is `x`'s truthiness itself.)
        // `!(x)`: the negation of the parenthesised operand, parentheses dropped.
        let (start, end, negated) = if source[..start].ends_with("!(")
            && !source[..start].ends_with("!!(")
            && source[end..].starts_with(')')
        {
            (start - 2, end + 1, !negated)
        } else {
            (start, end, negated)
        };
        let (start, negated) = if source[start..].starts_with("!(") {
            (start, negated)
        } else if source[..start].ends_with("!!") {
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
            // A branch that writes `x` (TS's `setX(…)`): `x` there would be the immutable
            // unwrapped value, so the value is `xValue` and the writes stay `x`'s.
            let body = end + 1;
            if let Some(close) = block_end(source, body)
                && !edits.iter().any(|(s, e, _)| start < *e && *s < close)
                && !reserved.iter().any(|(s, e)| start < *e && *s < close)
                && let Some(renamed) = rebind(&source[body + 1..close], operand)
            {
                edits.push((start, close, format!("let {operand}Value = {operand} {{{renamed}")));
                continue;
            }
            edits.push((start, end, format!("let {operand} = {operand}")));
            continue;
        }
        let Some(test) = test(operand, found, negated) else { continue };
        // An `||` test stays bare only where `||` binds as loosely as its place
        // (bloomc narrows through a bare `||`, not through parentheses).
        let before = source[..start].trim_end();
        let after = source[end..].trim_start();
        let loose = (before.ends_with("if") || before.ends_with("||") || before.ends_with('('))
            && (after.starts_with('{') || after.starts_with("||") || after.starts_with(')'));
        let test = if source[..start].ends_with(['.', '!']) || test.contains(" || ") && !loose {
            format!("({test})")
        } else {
            test
        };
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

/// A replacement: the span `start..end` and its text.
type Edit = (usize, usize, String);

/// `a || b` as a value, where bloomc found `a` not `Bool`: JS's "`b` when `a` is
/// falsy", spelled from `a`'s type. Returns the edits, whole `a || b` spans, and
/// the spans of the `||`s left for a later round (one holding another: the inner
/// one is spelled first, `a || (b || c)`).
pub fn defaults(
    source: &str,
    diagnostics: &[Diagnostic],
    defaults: &HashMap<String, Vec<String>>,
) -> (Vec<Edit>, Vec<(usize, usize)>) {
    let mut edits: Vec<Edit> = Vec::new();
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
        let Some(rights) = defaults.get(&squeeze(left)) else { continue };
        // ` || right`, however bloom_fmt broke the lines.
        let rest = &source[end..];
        let Some(op) = rest.find(|c: char| !c.is_whitespace()).filter(|&i| rest[i..].starts_with("||"))
        else {
            continue;
        };
        // A parenthesised default (the rest of a chain) is matched as a group: an
        // earlier round may have spelled the `||` inside it. (One left operand may
        // have several defaults in a module: the one written after it.)
        let len = rights.iter().find_map(|right| {
            let grouped = right.starts_with('(') && right.ends_with(')');
            if grouped { group_len(&rest[op + 2..]) } else { squeezed_prefix(&rest[op + 2..], right) }
        });
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
            t if t.ends_with('?') && (!t.contains('|') || literal_union(t) || foreign_object(t)) => {
                format!("{a} ?? {right}")
            }
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
    // `a || b` with a TS value `a` (bloomc reads it as a condition and finds the
    // right side not `Bool`): JS's value `||`, `a ? a : b` (a member chain, read twice).
    for d in diagnostics {
        if d.code != "B0201" || !d.message.starts_with("expected `Bool`, found `") {
            continue;
        }
        let (start, end) = (d.span.start as usize, d.span.end as usize);
        let Some(right) = source.get(start..end) else { continue };
        let Some(head) = source[..start].trim_end().strip_suffix("||") else { continue };
        let head = head.trim_end();
        let right_sq = squeeze(right);
        let Some(left) = defaults.iter().find_map(|(left, rights)| {
            (rights.iter().any(|r| squeeze(r) == right_sq)
                && head.ends_with(left.as_str())
                && is_postfix(left))
            .then_some(left.as_str())
        }) else {
            continue;
        };
        let left_start = head.len() - left.len();
        // The whole left operand: not the tail of a longer chain (`x.a` of `y.x.a`).
        if source[..left_start].ends_with(|c: char| c.is_alphanumeric() || c == '_' || c == '.' || c == '?') {
            continue;
        }
        let before = source[..left_start].trim_end();
        let after = source[end..].trim_start();
        let starts_line = source[..left_start].rsplit('\n').next().unwrap_or("").trim().is_empty();
        let bare = (before.ends_with([':', '(', '{', ',', '=']) || before.ends_with("return") || starts_line)
            && (after.starts_with([')', ',', '}', '\n']) || after.is_empty());
        let text = format!("{left} ? {left} : {right}");
        let text = if bare { text } else { format!("({text})") };
        if edits.iter().any(|(s, e, _)| left_start < *e && *s < end) {
            continue;
        }
        edits.push((left_start, end, text));
    }
    // The condition of the `a ? a : b` written above, now typed: its truthiness.
    for d in diagnostics {
        let Some(found) =
            d.message.strip_prefix("expected `Bool`, found `").and_then(|m| m.strip_suffix('`'))
        else {
            continue;
        };
        if d.code != "B0201" {
            continue;
        }
        let (start, end) = (d.span.start as usize, d.span.end as usize);
        let Some(text) = source.get(start..end) else { continue };
        if !is_postfix(text) || !source[end..].starts_with(&format!(" ? {text} : ")) {
            continue;
        }
        let Some(test) = test(text, found, false) else { continue };
        let test = if test.contains(" || ") || test.contains(" && ") { format!("({test})") } else { test };
        if edits.iter().any(|(s, e, _)| start < *e && *s < end) {
            continue;
        }
        edits.push((start, end, test));
    }
    // The same `a || b` of two TS values, typed `Bool` where a value is expected
    // (bloomc reports the whole expression).
    for d in diagnostics {
        if d.code != "B0201"
            || !d.message.ends_with("found `Bool`")
            || d.message.starts_with("expected `Bool")
        {
            continue;
        }
        let (start, end) = (d.span.start as usize, d.span.end as usize);
        let Some(text) = source.get(start..end) else { continue };
        let whole = squeeze(text);
        let Some((left, right)) = defaults.iter().find_map(|(left, rights)| {
            rights
                .iter()
                .find(|r| whole == format!("{}||{}", squeeze(left), squeeze(r)))
                .filter(|_| is_postfix(left) && text.starts_with(left.as_str()))
                .map(|r| (left.as_str(), r.as_str()))
        }) else {
            continue;
        };
        let op = text[left.len()..].find("||").map(|i| left.len() + i + 2);
        let Some(op) = op else { continue };
        let right_text = squeeze_lines(text[op..].trim());
        let _ = right;
        let before = source[..start].trim_end();
        let after = source[end..].trim_start();
        let starts_line = source[..start].rsplit('\n').next().unwrap_or("").trim().is_empty();
        let bare = (before.ends_with([':', '(', '{', ',', '=']) || before.ends_with("return") || starts_line)
            && (after.starts_with([')', ',', '}', '\n']) || after.is_empty());
        let out = format!("{left} ? {left} : {right_text}");
        let out = if bare { out } else { format!("({out})") };
        if edits.iter().any(|(s, e, _)| start < *e && *s < end) {
            continue;
        }
        edits.push((start, end, out));
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
/// `c` with each `?[N]` (a constant index of a tuple bloomc typed present) read as `.N`.
fn tuple_reads(c: &str) -> String {
    let mut out = String::with_capacity(c.len());
    let mut rest = c;
    while let Some(i) = rest.find("?[") {
        let tail = &rest[i + 2..];
        match tail.find(']') {
            Some(close) if close > 0 && tail[..close].chars().all(|ch| ch.is_ascii_digit()) => {
                out.push_str(&rest[..i]);
                out.push('.');
                out.push_str(&tail[..close]);
                rest = &tail[close + 1..];
            }
            _ => {
                out.push_str(&rest[..i + 2]);
                rest = tail;
            }
        }
    }
    out.push_str(rest);
    out
}

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
        // A name or member chain is narrowed on the right of `&&` and of `||` after `== none`.
        "String?" if !negated && is_name(text) => format!("{text} != none && !{text}.isEmpty"),
        "String?" if is_name(text) => format!("{text} == none || {text}.isEmpty"),
        "String?" => format!("({text} ?? \"\") {eq} \"\""),
        "Int?" | "Float?" if !negated && is_name(text) => format!("{text} != none && {text} != 0"),
        "Int?" | "Float?" if is_name(text) => format!("{text} == none || {text} == 0"),
        "Int?" | "Float?" => format!("({text} ?? 0) {eq} 0"),
        "Bool?" => format!("{operand} {} true", if negated { "!=" } else { "==" }),
        // Any other optional is truthy when present: an object, a list, a view, a function.
        t if t.ends_with('?') && (!t.contains('|') || foreign_object(t)) => format!("{operand} {eq} none"),
        // A value that is never `none` (a struct, a record, a list, a function): JS's
        // object is always truthy.
        t if always_object(t) => (if negated { "false" } else { "true" }).to_string(),
        // A union of non-empty string literals is never falsy.
        t if !t.ends_with('?') && literal_union(t) => (if negated { "false" } else { "true" }).to_string(),
        _ => return None,
    })
}

/// Whether `text` is a name or a member chain without calls (bloomc narrows both).
fn is_name(text: &str) -> bool {
    !text.is_empty()
        && !text.starts_with(|c: char| c.is_ascii_digit() || c == '.')
        && text.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '.' || c == '?')
}

/// Whether `text` is a name or a member chain (`a.b.c`, `a?.b`): no parentheses needed.
fn is_postfix(text: &str) -> bool {
    crate::expr::is_postfix_text(text)
}

/// `Foreign(Pick<User, 'id' | 'name'>)?`: an optional TS object type (its `|` is the
/// TS text's own); falsy only when absent. A TS primitive in it (`string`, `number`,
/// `boolean`) has falsy values of its own, so it is not one.
fn foreign_object(ty: &str) -> bool {
    let Some(inner) = ty.strip_prefix("Foreign(").and_then(|t| t.strip_suffix(")?")) else { return false };
    let words: Vec<&str> = inner.split(|c: char| !c.is_alphanumeric()).collect();
    !["string", "number", "boolean", "bigint", "any", "unknown"].iter().any(|p| words.contains(p))
}

/// A Bloom type whose values are JS objects, never `none`: a struct name, a record,
/// a list or dictionary, a function.
fn always_object(ty: &str) -> bool {
    if ty.ends_with('?') || ty.contains('|') || ty.starts_with("Foreign") || ty.starts_with('_') {
        return false;
    }
    if ty.starts_with(['{', '[']) || ty.starts_with('(') && ty.contains("->") {
        return true;
    }
    ty.starts_with(|c: char| c.is_ascii_uppercase())
        && ty.chars().all(|c| c.is_alphanumeric() || c == '_')
        && !matches!(ty, "String" | "Int" | "Float" | "Bool" | "Unit" | "View")
}

/// `true ? a : b` as `a` (`false ? a : b` as `b`), `true && a` and `false || a` as
/// `a`: the conditions a value that is never `none` spelled as `true`. Only a whole
/// expression is folded (after `(`, `=`, `,`, `:`, `{`, `[`, `return` or `=>`), so
/// the branch left in its place needs no parentheses. `None` when there is none.
pub fn fold(source: &str) -> Option<String> {
    let mut out = fold_once(source)?;
    for _ in 0..64 {
        match fold_once(&out) {
            Some(next) => out = next,
            None => break,
        }
    }
    Some(out)
}

fn fold_once(source: &str) -> Option<String> {
    let bytes = source.as_bytes();
    let mut quote = false;
    let mut i = 0;
    while i < bytes.len() {
        let c = bytes[i];
        if quote {
            if c == b'\\' {
                i += 2;
                continue;
            }
            if c == b'"' {
                quote = false;
            }
            i += 1;
            continue;
        }
        if c == b'"' {
            quote = true;
            i += 1;
            continue;
        }
        let word = ["true", "false"].into_iter().find(|w| bytes[i..].starts_with(w.as_bytes()));
        let boundary =
            i == 0 || !(bytes[i - 1].is_ascii_alphanumeric() || matches!(bytes[i - 1], b'_' | b'.'));
        if let Some(w) = word
            && boundary
        {
            let before = source[..i].trim_end();
            let whole = before.ends_with(['(', '=', ',', ':', '{', '['])
                && !before.ends_with("==")
                && !before.ends_with("!=")
                && !before.ends_with("<=")
                && !before.ends_with(">=")
                || before.ends_with("return")
                || before.ends_with("=>");
            let rest = &source[i + w.len()..];
            let after = rest.trim_start();
            let gap = rest.len() - after.len();
            if whole && gap > 0 {
                let at = i + w.len() + gap;
                if after.starts_with("? ") {
                    let then_start = at + 2;
                    let then_len = branch_len(&source[then_start..], true)?;
                    let else_start = then_start + then_len + 2;
                    let else_len = branch_len(&source[else_start..], false)?;
                    let keep = if w == "true" {
                        &source[then_start..then_start + then_len]
                    } else {
                        &source[else_start..else_start + else_len]
                    };
                    let keep = keep.trim();
                    return Some(format!("{}{keep}{}", &source[..i], &source[else_start + else_len..]));
                }
                let op = if w == "true" { "&&" } else { "||" };
                if after.starts_with(op) && after[2..].starts_with(char::is_whitespace) {
                    let tail = after[2..].trim_start();
                    return Some(format!("{}{tail}", &source[..i]));
                }
            }
        }
        i += 1;
    }
    None
}

/// The length of a conditional's branch at the start of `source`: the `then`
/// branch ends at its `:` (`then` true), the `else` branch where the enclosing
/// expression does (a closer, a `,`, or a line that does not continue it).
fn branch_len(source: &str, then: bool) -> Option<usize> {
    let bytes = source.as_bytes();
    let (mut depth, mut pending) = (0i32, 0i32);
    let mut quote = false;
    let mut i = 0;
    while i < bytes.len() {
        let c = bytes[i];
        if quote {
            if c == b'\\' {
                i += 2;
                continue;
            }
            if c == b'"' {
                quote = false;
            }
            i += 1;
            continue;
        }
        match c {
            b'"' => quote = true,
            b'(' | b'[' | b'{' => depth += 1,
            b')' | b']' | b'}' if depth == 0 => return (!then).then_some(i),
            b')' | b']' | b'}' => depth -= 1,
            b',' if depth == 0 => return (!then).then_some(i),
            b'?' if depth == 0 && bytes.get(i + 1) == Some(&b' ') && i > 0 && bytes[i - 1] == b' ' => {
                pending += 1
            }
            b':' if depth == 0 && bytes.get(i + 1) == Some(&b' ') && i > 0 && bytes[i - 1] == b' ' => {
                if pending == 0 {
                    return then.then_some(i - 1);
                }
                pending -= 1;
            }
            b'\n' if depth == 0 && !then => {
                let next = source[i..].trim_start();
                let continues =
                    [".", "?", ":", "&&", "||", "+", "-", "*", "/", "=="].iter().any(|p| next.starts_with(p));
                if !continues {
                    return Some(i);
                }
            }
            _ => {}
        }
        i += 1;
    }
    (!then).then_some(bytes.len())
}

/// The index of the `}` closing the block whose `{` is at `open`, skipping strings.
fn block_end(source: &str, open: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    if bytes.get(open) != Some(&b'{') {
        return None;
    }
    let (mut depth, mut i, mut string) = (0usize, open, false);
    while i < bytes.len() {
        match bytes[i] {
            b'\\' if string => i += 1,
            b'"' => string = !string,
            b'{' if !string => depth += 1,
            b'}' if !string => {
                depth -= 1;
                if depth == 0 {
                    return Some(i);
                }
            }
            _ => {}
        }
        i += 1;
    }
    None
}

/// `body` (a block's text after its `{`) with each read of `name` written `nameValue`, when
/// the block writes `name` (`name = …`); `None` when it does not. A member (`.name`), a label
/// (`name:`) and the text of a string literal (outside its interpolations) are not reads.
fn rebind(body: &str, name: &str) -> Option<String> {
    let bytes = body.as_bytes();
    let ident = |c: u8| c.is_ascii_alphanumeric() || c == b'_';
    let mut out = String::with_capacity(body.len() + 16);
    let (mut i, mut writes) = (0usize, false);
    // Nesting of string literals and their `${…}` interpolations: `true` is a string.
    let mut stack: Vec<bool> = Vec::new();
    let mut braces: Vec<usize> = Vec::new();
    while i < bytes.len() {
        let in_string = stack.last() == Some(&true);
        let c = bytes[i];
        if in_string {
            match c {
                b'\\' => {
                    out.push_str(&body[i..(i + 2).min(body.len())]);
                    i += 2;
                    continue;
                }
                b'"' => {
                    stack.pop();
                }
                b'$' if bytes.get(i + 1) == Some(&b'{') => {
                    stack.push(false);
                    braces.push(0);
                    out.push_str("${");
                    i += 2;
                    continue;
                }
                _ => {}
            }
            out.push(c as char);
            i += 1;
            continue;
        }
        match c {
            b'"' => stack.push(true),
            b'{' => {
                if let Some(d) = braces.last_mut() {
                    *d += 1;
                }
            }
            b'}' if braces.last() == Some(&0) => {
                braces.pop();
                stack.pop();
            }
            b'}' => {
                if let Some(d) = braces.last_mut() {
                    *d -= 1;
                }
            }
            _ => {}
        }
        if body[i..].starts_with(name)
            && (i == 0 || !ident(bytes[i - 1]))
            && bytes.get(i + name.len()).is_none_or(|&n| !ident(n))
        {
            let member = i >= 1 && bytes[i - 1] == b'.' && !(i >= 2 && bytes[i - 2] == b'.');
            let after = &body[i + name.len()..];
            let label = after.starts_with(':') && !after.starts_with("::");
            let rest = after.trim_start();
            let write = ["=", "+=", "-=", "*="].iter().any(|o| rest.starts_with(o))
                && !rest.starts_with("==")
                && !rest.starts_with("=>");
            writes |= write && !member;
            if member || label || write {
                out.push_str(name);
            } else {
                out.push_str(name);
                out.push_str("Value");
            }
            i += name.len();
            continue;
        }
        let len = body[i..].chars().next().map_or(1, char::len_utf8);
        out.push_str(&body[i..i + len]);
        i += len;
    }
    writes.then_some(out)
}
