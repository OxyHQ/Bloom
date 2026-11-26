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
        let list = receiver.is_some_and(|r| r.starts_with('['));
        let collection = receiver.is_some_and(|r| r.starts_with("Set<") || r.starts_with("Map<"));
        let edit = match (d.code, text) {
            // `s.has(x)`, `m.size`: a Bloom `Set`/`Map` has `contains` and `count`.
            ("B0209", "has") if collection => Some((start, end, "contains".to_string())),
            ("B0205", "size") if collection => Some((start, end, "count".to_string())),
            // `xs.some(f)`, `xs.every(f)`: a Bloom list's `any` and `all`.
            ("B0209", "some") if list => Some((start, end, "any".to_string())),
            ("B0209", "every") if list => Some((start, end, "all".to_string())),
            // A promise-returning call JS let go unawaited: started as a task.
            ("B0430", _) => Some((start, end, format!("task {{\nawait {text}\n}}"))),
            // A list of views drawn as a child (`{rows}`): each of its views.
            ("B0201", _)
                if d.message == "expected `View`, found `[View]`"
                    && crate::expr::is_postfix_text(text)
                    && line_is(source, start, end) =>
            {
                Some((start, end, format!("for v in {text} {{ v }}")))
            }
            // `{}` where a dictionary is expected: the empty dictionary `[:]` (`{}` is a closure).
            ("B0201", "{}")
                if d.message.starts_with("expected `[") && d.message.ends_with("found `() -> Unit`") =>
            {
                Some((start, end, "[:]".to_string()))
            }
            // Text of an optional string: JS drew nothing for `undefined`.
            ("B0201", _)
                if d.message == "`String?` may be `none` here"
                    && (source[..start].ends_with("Text(") || source[..start].ends_with("RawText("))
                    && source[end..].starts_with(')') =>
            {
                Some((start, end, format!("{text} ?? \"\"")))
            }
            // TS lets `?.` read a value that is never `none`; Bloom reads it with `.`.
            ("B0201", _)
                if d.message.starts_with("`?.` reads an optional") && source[..start].ends_with("?.") =>
            {
                Some((start - 2, start, ".".to_string()))
            }
            // `x ?? fallback` where `x` is never `none`: `x`.
            ("B0201", _) if d.message.starts_with("`??` gives a fallback") => {
                let rest = &source[end..];
                let op = rest.find(|c: char| !c.is_whitespace()).filter(|&i| rest[i..].starts_with("??"));
                op.and_then(|i| {
                    operand_len(&rest[i + 2..]).map(|n| (start, end + i + 2 + n, text.to_string()))
                })
            }
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

/// The length of the operand at the start of `source` (after spaces): up to a
/// delimiter outside brackets and strings.
fn operand_len(source: &str) -> Option<usize> {
    let mut depth = 0i32;
    let mut quote: Option<char> = None;
    let mut started = false;
    let mut prev = ' ';
    for (i, c) in source.char_indices() {
        if let Some(q) = quote {
            if c == q && prev != '\\' {
                quote = None;
            }
            prev = c;
            continue;
        }
        match c {
            '"' | '\'' | '`' => quote = Some(c),
            '(' | '[' | '{' => depth += 1,
            ')' | ']' | '}' if depth == 0 => return started.then_some(i),
            ')' | ']' | '}' => depth -= 1,
            ',' | '\n' | '?' | ':' | '|' | '&' if depth == 0 && started => return Some(i),
            c if c.is_whitespace() && depth == 0 && started => {
                // `a ?? b c`: an operator follows; the operand ended.
                let next = source[i..].trim_start();
                if !next.starts_with('.') {
                    return Some(i);
                }
            }
            _ => {}
        }
        if !c.is_whitespace() {
            started = true;
        }
        prev = c;
    }
    started.then_some(source.len())
}

/// Whether `start..end` is all of its line.
fn line_is(source: &str, start: usize, end: usize) -> bool {
    let before = &source[..start];
    let line_start = before.rfind('\n').map_or(0, |i| i + 1);
    let after = &source[end..];
    let line_end = after.find('\n').unwrap_or(after.len());
    before[line_start..].trim().is_empty() && after[..line_end].trim().is_empty()
}
