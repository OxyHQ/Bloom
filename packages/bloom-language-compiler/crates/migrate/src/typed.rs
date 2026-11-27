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
            // `m.values()`, `m.keys()`, `m.entries()`: a Bloom `Map`/`Set`'s lists.
            ("B0209", "values" | "keys" | "entries") if collection && source[end..].starts_with("()") => {
                Some((start, end + 2, text.to_string()))
            }
            // `xs.some(f)`, `xs.every(f)`: a Bloom list's `any` and `all`.
            ("B0209", "some") if list => Some((start, end, "any".to_string())),
            ("B0209", "every") if list => Some((start, end, "all".to_string())),
            // A promise-returning call JS let go unawaited: started as a task.
            ("B0430", _) => Some((start, end, format!("task {{\nawait {text}\n}}"))),
            // `await f()` of a call that is not async (TS awaited a plain value): the
            // call; a `task { await f() }` around it alone is the call too.
            ("B0215", _)
                if d.message.starts_with("`await` waits for an async call")
                    && source[..start].ends_with("await ") =>
            {
                let at = start - "await ".len();
                let before = source[..at].trim_end();
                let after = source[end..].trim_start();
                match (before.strip_suffix("task {"), after.starts_with('}')) {
                    (Some(head), true) => {
                        let close = end + (source[end..].len() - after.len()) + 1;
                        Some((head.len(), close, text.to_string()))
                    }
                    _ => Some((at, start, String::new())),
                }
            }
            // `typeof x === "string"` / `Array.isArray(x)` on a value bloomc types as
            // that (or its optional): the test is whether it is present.
            ("B0213", _) if d.message.starts_with("`is` tests a TS value, and this is `") => {
                let ty = d.message.split('`').nth(3).unwrap_or_default();
                let rest = &source[end..];
                let tested = rest.strip_prefix(" is ").and_then(|r| {
                    ["String", "Float", "Bool", "[Foreign]"].iter().find(|t| r.starts_with(**t)).copied()
                });
                let base = ty.strip_suffix('?').unwrap_or(ty);
                let same = match tested {
                    Some("[Foreign]") => base.starts_with('['),
                    Some(t) => base == t,
                    None => false,
                };
                match tested {
                    Some(t) if same => {
                        let close = end + " is ".len() + t.len();
                        let test = if ty.ends_with('?') { format!("{text} != none") } else { "true".into() };
                        Some((start, close, test))
                    }
                    _ => None,
                }
            }
            // `s.substring(a, b)` from literal non-negative indices: Bloom's `slice`.
            ("B0209", "substring")
                if receiver == Some("String")
                    && source[end..]
                        .strip_prefix('(')
                        .is_some_and(|r| r.starts_with(|c: char| c.is_ascii_digit())) =>
            {
                Some((start, end, "slice".to_string()))
            }
            // `s.trimEnd()` / `s.trimStart()`: JS's `\s` is the set `trim` strips.
            ("B0209", "trimEnd" | "trimStart")
                if receiver == Some("String") && source[end..].starts_with("()") =>
            {
                let re = if text == "trimEnd" { r"\\s+$" } else { r"^\\s+" };
                Some((start, end + 2, format!("replace(Regex(\"{re}\"), \"\")")))
            }
            // Named arguments to a function whose one parameter is unnamed (a TS
            // options object, `(data: { text: string }) => void`): the record itself.
            ("B0207", _) if d.message == "missing argument(s): ``" => call_args(source, start, end)
                .filter(|(a, b)| {
                    let inner = &source[*a..*b];
                    // Every argument named (`a: x, b: y`): one record.
                    inner.trim_start().starts_with(|c: char| c.is_alphabetic() || c == '_')
                        && inner.split(',').next().is_some_and(|first| {
                            first.split_once(':').is_some_and(|(k, _)| {
                                k.trim().chars().all(|c| c.is_alphanumeric() || c == '_')
                            })
                        })
                })
                .map(|(a, b)| (a, b, format!("{{ {} }}", source[a..b].trim()))),
            // `d.title` on a dictionary (TS's `Record<string, …>` read by a key): `d["title"]`.
            ("B0205", _)
                if receiver.is_some_and(|r| r.starts_with("[String: "))
                    && d.message.contains("has no member")
                    && text.chars().all(|c| c.is_alphanumeric() || c == '_')
                    && source[..start].ends_with('.') =>
            {
                let dot = if source[..start].ends_with("?.") { 2 } else { 1 };
                let open = if dot == 2 { "?[" } else { "[" };
                Some((start - dot, end, format!("{open}\"{text}\"]")))
            }
            // `X(props)`: TS's `createElement(X, props)`, a props object spread (`X(..props)`).
            ("B0207", _)
                if d.message == "a component takes its props by name"
                    && crate::expr::is_postfix_text(text) =>
            {
                Some((start, end, format!("..{text}")))
            }
            // `let s = useX().menu()`: the hook's call is a member of its own,
            // `let sHook = useX()`, then `let s = sHook.menu()`.
            ("B0420", _) if d.message.ends_with("is called outside a view member") => {
                let line_start = source[..start].rfind('\n').map_or(0, |i| i + 1);
                let head = &source[line_start..start];
                let name = head.trim_start().strip_prefix("let ").and_then(|h| h.strip_suffix(" = "));
                let call_end = source[end..].starts_with('(').then(|| matching_paren(source, end)).flatten();
                match (name, call_end) {
                    (Some(name), Some(close))
                        if name.chars().all(|c| c.is_alphanumeric() || c == '_')
                            && source[close..].starts_with('.') =>
                    {
                        let indent = &head[..head.len() - head.trim_start().len()];
                        let hook = format!("{name}Hook");
                        Some((
                            line_start,
                            close,
                            format!(
                                "{indent}let {hook} = {}\n{indent}let {name} = {hook}",
                                &source[start..close]
                            ),
                        ))
                    }
                    _ => None,
                }
            }
            // A list of views drawn as a child (`{rows}`): each of its views.
            ("B0201", _)
                if (d.message == "expected `View`, found `[View]`"
                    || d.message == "expected `View?`, found `[View]`")
                    && crate::expr::is_postfix_text(text)
                    && (line_is(source, start, end) || braced(source, start, end)) =>
            {
                Some((start, end, format!("for v in {text} {{ v }}")))
            }
            // A `[View?]` (TS's `Child[]`, `null`s drawn as nothing) as a child.
            ("B0201", _)
                if (d.message == "expected `View`, found `[View?]`"
                    || d.message == "expected `View?`, found `[View?]`")
                    && crate::expr::is_postfix_text(text)
                    && (line_is(source, start, end) || braced(source, start, end)) =>
            {
                Some((start, end, format!("for v in {text} {{ if let v = v {{ v }} }}")))
            }
            // A `for` where one view is expected (an `if` branch given as a value): a `Group`.
            ("B0201", _)
                if d.message == "this block gives no value; expected `View`" && text.starts_with("for ") =>
            {
                block_end(source, start).map(|e| (start, e, format!("Group {{\n{}\n}}", &source[start..e])))
            }
            // `count > 1` on a `Float?`: JS compares `undefined` as `NaN` (false), as `0 > 1` is;
            // so for `> n` (n ≥ 0) and `>= n` (n > 0) the absent value is `0`.
            ("B0201", _)
                if (d.message == "`>` does not apply to `Float?`"
                    || d.message == "`>=` does not apply to `Float?`"
                    || d.message == "`>` does not apply to `Int?`"
                    || d.message == "`>=` does not apply to `Int?`")
                    && crate::expr::is_postfix_text(text) =>
            {
                let rest = source[end..].trim_start();
                let (op, after) = if let Some(a) = rest.strip_prefix(">=") {
                    (">=", a)
                } else if let Some(a) = rest.strip_prefix('>') {
                    (">", a)
                } else {
                    ("", rest)
                };
                let literal: String =
                    after.trim_start().chars().take_while(|c| c.is_ascii_digit() || *c == '.').collect();
                let n: Option<f64> = literal.parse().ok();
                let after_literal = after.trim_start()[literal.len()..].chars().next();
                let simple =
                    after_literal.is_none_or(|c| !(c.is_alphanumeric() || c == '_' || c == '.' || c == '('));
                match (op, n) {
                    (">", Some(n)) if n >= 0.0 && simple => Some((start, end, format!("({text} ?? 0)"))),
                    (">=", Some(n)) if n > 0.0 && simple => Some((start, end, format!("({text} ?? 0)"))),
                    _ => None,
                }
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
            // `xs[i]?.x`: TS reads past the end as `undefined`; a list's `xs[i]` is the element
            // (out of range a trap), so the optional read is `xs.at(i)?.x`.
            ("B0201", _)
                if d.message.starts_with("`?.` reads an optional")
                    && source[..start].ends_with("]?.")
                    && subscript_open(source, start - 3).is_some() =>
            {
                let close = start - 3;
                subscript_open(source, close)
                    .map(|open| (open, close + 1, format!(".at({})", &source[open + 1..close])))
            }
            // TS lets `?.` read a value that is never `none`; Bloom reads it with `.`.
            ("B0201", _)
                if d.message.starts_with("`?.` reads an optional") && source[..start].ends_with("?.") =>
            {
                Some((start - 2, start, ".".to_string()))
            }
            // `xs[i] ?? d`: the element when it is there, `xs.at(i) ?? d`.
            ("B0201", _)
                if d.message.starts_with("`??` gives a fallback")
                    && text.ends_with(']')
                    && subscript_open(source, end - 1).is_some_and(|o| o > start) =>
            {
                subscript_open(source, end - 1)
                    .map(|open| (open, end, format!(".at({})", &source[open + 1..end - 1])))
            }
            // `d.at(k)` on a dictionary (the codemod read a key as an index): `d[k]`, optional already.
            ("B0209", "at")
                if receiver.is_some_and(|r| r.starts_with('[') && r.contains(": "))
                    && source[..start].ends_with('.')
                    && source[end..].starts_with('(') =>
            {
                matching_paren(source, end)
                    .map(|close| (start - 1, close, format!("[{}]", &source[end + 1..close - 1])))
            }
            // A member of an optional TS had narrowed to present (`if (!p) return; p.x`, a
            // `p?.x` test before): TS's flow said it is there, so it is read as `p!.x` (a
            // release build emits `p.x`, as TS did; JS would have thrown on `undefined`).
            ("B0201", _)
                if d.message.ends_with("` may be `none`")
                    && source[..start].ends_with('.')
                    && !source[..start].ends_with("?.") =>
            {
                Some((start - 1, start - 1, "!".to_string()))
            }
            ("B0209" | "B0205", _)
                if receiver.is_some_and(|r| r.ends_with('?'))
                    && source[..start].ends_with('.')
                    && !source[..start].ends_with("?.") =>
            {
                Some((start - 1, start - 1, "!".to_string()))
            }
            // `labels[kind]` where TS typed the value present (`Record<Kind, string>`): `labels[kind]!`.
            ("B0201", _)
                if d.message.starts_with("expected `")
                    && d.message.ends_with("?`")
                    && is_subscript(text)
                    && {
                        let (want, found) = d.message["expected `".len()..].split_once("`, found `").unwrap_or_default();
                        found.strip_suffix("?`") == Some(want)
                    } =>
            {
                Some((end, end, "!".to_string()))
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
/// Just past the `)` matching the `(` at `open`.
fn matching_paren(source: &str, open: usize) -> Option<usize> {
    let mut depth = 0i32;
    let mut quoted = false;
    for (i, b) in source.bytes().enumerate().skip(open) {
        match b {
            b'"' => quoted = !quoted,
            b'(' if !quoted => depth += 1,
            b')' if !quoted => {
                depth -= 1;
                if depth == 0 {
                    return Some(i + 1);
                }
            }
            _ => {}
        }
    }
    None
}

/// The argument list holding `start..end`: from just after its `(` to its `)`
/// (strings skipped crudely: a quote toggles).
fn call_args(source: &str, start: usize, end: usize) -> Option<(usize, usize)> {
    let bytes = source.as_bytes();
    let mut depth = 0i32;
    let mut open = None;
    let mut quoted = false;
    for i in (0..start).rev() {
        match bytes[i] {
            b'"' => quoted = !quoted,
            b')' | b']' | b'}' if !quoted => depth += 1,
            b'(' if !quoted && depth == 0 => {
                open = Some(i + 1);
                break;
            }
            b'(' | b'[' | b'{' if !quoted => depth -= 1,
            _ => {}
        }
    }
    let open = open?;
    let mut depth = 0i32;
    let mut quoted = false;
    for (i, &b) in bytes.iter().enumerate().skip(end) {
        match b {
            b'"' => quoted = !quoted,
            b'(' | b'[' | b'{' if !quoted => depth += 1,
            b')' if !quoted && depth == 0 => return Some((open, i)),
            b')' | b']' | b'}' if !quoted => depth -= 1,
            _ => {}
        }
    }
    None
}

/// The `[` of the subscript whose `]` is at `close` (strings skipped crudely), when what
/// precedes it is a receiver (`xs[`, `a.b[`, `f()[`), not a list literal.
fn subscript_open(source: &str, close: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    if bytes.get(close) != Some(&b']') {
        return None;
    }
    let mut depth = 0i32;
    let mut quoted = false;
    for i in (0..=close).rev() {
        match bytes[i] {
            b'"' => quoted = !quoted,
            b']' | b')' | b'}' if !quoted => depth += 1,
            b'[' | b'(' | b'{' if !quoted => {
                depth -= 1;
                if depth == 0 {
                    let receiver = i > 0
                        && (bytes[i - 1].is_ascii_alphanumeric() || matches!(bytes[i - 1], b'_' | b')' | b']'));
                    return (bytes[i] == b'[' && receiver).then_some(i);
                }
            }
            _ => {}
        }
    }
    None
}

/// Whether `text` is a subscript read, `d[k]` (a receiver, then one bracket to the end).
fn is_subscript(text: &str) -> bool {
    text.ends_with(']') && subscript_open(text, text.len() - 1).is_some_and(|o| o > 0)
}

/// Whether `start..end` is a builder's only line written inline: `{ rows }`.
fn braced(source: &str, start: usize, end: usize) -> bool {
    source[..start].trim_end().ends_with('{') && source[end..].trim_start().starts_with('}')
}

fn line_is(source: &str, start: usize, end: usize) -> bool {
    let before = &source[..start];
    let line_start = before.rfind('\n').map_or(0, |i| i + 1);
    let after = &source[end..];
    let line_end = after.find('\n').unwrap_or(after.len());
    before[line_start..].trim().is_empty() && after[..line_end].trim().is_empty()
}

/// The end of the block whose `{` is the first one at or after `start`: just past
/// its matching `}` (strings skipped).
fn block_end(source: &str, start: usize) -> Option<usize> {
    let open = start + source[start..].find('{')?;
    let mut depth = 0i32;
    let mut quote = false;
    let mut prev = ' ';
    for (i, c) in source[open..].char_indices() {
        if quote {
            if c == '"' && prev != '\\' {
                quote = false;
            }
            prev = c;
            continue;
        }
        match c {
            '"' => quote = true,
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    return Some(open + i + 1);
                }
            }
            _ => {}
        }
        prev = c;
    }
    None
}
