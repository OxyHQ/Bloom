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
            // `p.catch((e) => …)` as a statement, on a promise bloomc types: a task that awaits it,
            // `task { do { try await p } catch let e { … } }`.
            ("B0209", "catch")
                if receiver.is_some_and(|r| r.starts_with("Promise<")) && source[..start].ends_with('.') =>
            {
                promise_catch(source, start, end)
            }
            // A state read after the handler wrote it: React's closure reads the value of its
            // render, so the read is a snapshot taken before the first write.
            ("B0410", _) if text.chars().all(|c| c.is_alphanumeric() || c == '_') => {
                first_write(source, start, text).map(|line_start| {
                    let snapshot = format!("{text}Before");
                    let indent: String = source[line_start..].chars().take_while(|c| *c == ' ').collect();
                    let already =
                        source[..line_start].trim_end().ends_with(&format!("let {snapshot} = {text}"))
                            || edits.iter().any(|(a, b, t)| {
                                *a == line_start && *b == line_start && t.contains(&snapshot)
                            });
                    if !already {
                        edits.push((line_start, line_start, format!("{indent}let {snapshot} = {text}\n")));
                    }
                    (start, end, snapshot)
                })
            }
            // `n = value` where `@state n = 7` took an `Int` from its literal but TS's state is a
            // `number`: the state is a `Float` (`@state n: Float = 7`).
            ("B0201", _)
                if d.message == "expected `Int`, found `Float`"
                    && source[..start].trim_end().ends_with(" =")
                    && !source[..start].trim_end().ends_with("==") =>
            {
                let before = source[..start].trim_end().trim_end_matches('=').trim_end();
                let name_start =
                    before.rfind(|c: char| !(c.is_alphanumeric() || c == '_')).map_or(0, |i| i + 1);
                let name = &before[name_start..];
                let decl = format!("@state {name} = ");
                source.find(&decl).filter(|_| !name.is_empty()).and_then(|at| {
                    let value_at = at + decl.len();
                    let literal: String =
                        source[value_at..].chars().take_while(|c| c.is_ascii_digit()).collect();
                    let after = source[value_at + literal.len()..].chars().next();
                    (!literal.is_empty() && after.is_none_or(|c| c == '\n' || c == ' ')).then(|| {
                        (
                            at + "@state ".len() + name.len(),
                            at + "@state ".len() + name.len(),
                            ": Float".to_string(),
                        )
                    })
                })
            }
            // `xs.count < max` with a `Float` max (a TS `number`): JS compared numbers, so the
            // count is read as one, `xs.count.toFloat() < max`.
            ("B0201", _) if d.message == "expected `Int`, found `Float`" => {
                let before = &source[..start];
                [" < ", " <= ", " > ", " >= ", " == ", " != "]
                    .iter()
                    .find(|op| before.ends_with(**op))
                    .and_then(|op| {
                        let left_end = start - op.len();
                        let left = &source[..left_end];
                        let left_start = left
                            .rfind(|c: char| !(c.is_alphanumeric() || matches!(c, '_' | '.' | '?' | '!')))
                            .map_or(0, |i| i + 1);
                        let operand = &source[left_start..left_end];
                        (!operand.is_empty() && operand.starts_with(|c: char| c.is_alphabetic()))
                            .then(|| (left_end, left_end, ".toFloat()".to_string()))
                    })
            }
            // A local `var` read by a closure (`task { await save(patch) }`) that nothing writes
            // after it: the closure reads its value then, a `let` bound before the closure's line.
            ("B0402", _) if text.chars().all(|c| c.is_alphanumeric() || c == '_') => {
                // The statement holding the closure: the nearest line up at the `var`'s indent.
                let decl = source[..start].rfind(&format!("var {text}"));
                let decl_line = decl.map_or(0, |d| source[..d].rfind('\n').map_or(0, |i| i + 1));
                let indent: String = source[decl_line..].chars().take_while(|c| *c == ' ').collect();
                let mut line_start = source[..start].rfind('\n').map_or(0, |i| i + 1);
                while line_start > decl_line
                    && source[line_start..].chars().take_while(|c| *c == ' ').count() > indent.len()
                {
                    line_start = source[..line_start - 1].rfind('\n').map_or(0, |i| i + 1);
                }
                let written_after = source[start..]
                    .lines()
                    .skip(1)
                    .take_while(|l| l.trim().is_empty() || l.len() - l.trim_start().len() >= indent.len())
                    .any(|l| {
                        let t = l.trim_start();
                        t.starts_with(&format!("{text} ="))
                            || t.starts_with(&format!("{text}."))
                            || t.starts_with(&format!("{text}["))
                    });
                let declared_var = decl.is_some_and(|d| d < line_start);
                (!written_after && declared_var).then(|| {
                    let snapshot = format!("{text}Now");
                    if !edits
                        .iter()
                        .any(|(a, b, t)| *a == line_start && *b == line_start && t.contains(&snapshot))
                    {
                        edits.push((line_start, line_start, format!("{indent}let {snapshot} = {text}\n")));
                    }
                    (start, end, snapshot)
                })
            }
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
            // `t("k", defaultValue: "x")`, `f(id, kind: k)` to a TS function whose last parameter
            // is an options object: the trailing named arguments are that record.
            ("B0207", _)
                if d.message.starts_with("no parameter is named `")
                    || (d.message.starts_with("missing argument(s): the ")
                        && d.message.ends_with("(unlabelled)")) =>
            {
                call_args(source, start, end).and_then(|(a, b)| options_record(source, a, b))
            }
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
            // `s?.startsWith?.(x)`: a method a Bloom type has is always there, `s?.startsWith(x)`.
            ("B0205", _) if d.message.contains("has no member") && source[end..].starts_with("?.(") => {
                Some((end, end + 2, String::new()))
            }
            // `p.then((v) => …)` as a statement, on a promise bloomc types: `task { let v = await p; … }`.
            ("B0209", "then")
                if receiver.is_some_and(|r| r.starts_with("Promise<")) && source[..start].ends_with('.') =>
            {
                promise_then(source, start, end)
            }
            // `f?.(x)` on a function that is always there: `f(x)`.
            ("B0201", _)
                if d.message.starts_with("`?.` reads an optional") && source[end..].starts_with("?.(") =>
            {
                Some((end, end + 2, String::new()))
            }
            // `[..xs].sort((a, b) => a.n - b.n)`: JS's comparator as Bloom's order, `sorted { a, b in (…) < 0 }`.
            ("B0209", "sort")
                if receiver.is_some_and(|r| r.starts_with('[')) && source[end..].starts_with(" {") =>
            {
                block_end(source, end).and_then(|close| {
                    let inner = source[end..close].trim().strip_prefix('{')?.strip_suffix('}')?.trim();
                    let (params, body) = inner.split_once(" in ")?;
                    (params.split(',').count() == 2 && !body.contains('\n'))
                        .then(|| (start, close, format!("sorted {{ {params} in ({}) < 0 }}", body.trim())))
                })
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
                if receiver.is_some_and(|r| r.starts_with('[') && r.contains(": ") || r == "_")
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
                        let (want, found) =
                            d.message["expected `".len()..].split_once("`, found `").unwrap_or_default();
                        !want.ends_with('?') && want != "Bool" && found.ends_with("?`")
                    } =>
            {
                Some((end, end, "!".to_string()))
            }
            // A value of a Bloom type TS had narrowed to present (`if (!params) return …;` before,
            // an `else` of the test), passed where it is required: `params!`.
            ("B0201", _)
                if d.message.starts_with("expected `")
                    && crate::expr::is_postfix_text(text)
                    && text.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '.')
                    && {
                        let (want, found) =
                            d.message["expected `".len()..].split_once("`, found `").unwrap_or_default();
                        want.starts_with(|c: char| c.is_ascii_uppercase())
                            && want.chars().all(|c| c.is_alphanumeric() || c == '_')
                            && !["String", "Float", "Int", "Double", "Bool", "View"].contains(&want)
                            && found.strip_suffix("?`") == Some(want)
                    } =>
            {
                Some((end, end, "!".to_string()))
            }
            // An optional interpolated (JS printed `undefined`): its text or nothing, under review.
            ("B0201", _) if d.message == "an optional is interpolated" => {
                let line_start = source[..start].rfind('\n').map_or(0, |i| i + 1);
                let indent: String = source[line_start..].chars().take_while(|c| *c == ' ').collect();
                let note = format!(
                    "{indent}// {}: an optional interpolated as `?? \"\"`: JS printed `undefined` for it\n",
                    crate::REVIEW_MARKER
                );
                let value =
                    if crate::expr::is_postfix_text(text) { text.to_string() } else { format!("({text})") };
                if !edits.iter().any(|(a, b, _)| *a <= line_start && line_start < (*b).max(*a + 1)) {
                    edits.push((line_start, line_start, note));
                }
                Some((start, end, format!("{value} ?? \"\"")))
            }
            // The `?? ""` above on a number: its digits when it is there, `x != none ? "${x}" : ""` (narrowed).
            ("B0201", "\"\"")
                if (d.message == "expected `Float?`, found `String`"
                    || d.message == "expected `Int?`, found `String`")
                    && source[..start].ends_with(" ?? ") =>
            {
                let open = source[..start].rfind("${").map(|i| i + 2);
                open.and_then(|open| {
                    let operand = &source[open..start - " ?? ".len()];
                    crate::expr::is_postfix_text(operand)
                        .then(|| (open, end, format!("{operand} != none ? \"${{{operand}}}\" : \"\"")))
                })
            }
            // `i < 0` on an index Bloom gives as `Int?` (`indexOf`, `findIndex`: `none`, not `-1`).
            ("B0201", _)
                if (d.message == "`<` does not apply to `Int?`"
                    || d.message == "`>=` does not apply to `Int?`"
                    || d.message == "`>` does not apply to `Int?`")
                    && crate::expr::is_postfix_text(text) =>
            {
                let rest = &source[end..];
                [(" < 0", "== none"), (" >= 0", "!= none"), (" > -1", "!= none"), (" <= -1", "== none")]
                    .iter()
                    .find(|(op, _)| {
                        rest.starts_with(op)
                            && rest[op.len()..].chars().next().is_none_or(|c| !c.is_ascii_digit() && c != '.')
                    })
                    .map(|(op, test)| (start, end + op.len(), format!("{text} {test}")))
            }
            // Arithmetic on a `Record<K, number>` read TS typed present: `d[k]!`.
            ("B0201", _)
                if d.message.contains("` does not apply to `")
                    && d.message.ends_with("?`")
                    && is_subscript(text) =>
            {
                Some((end, end, "!".to_string()))
            }
            // `const [a, b] = f()` of a longer TS tuple: the rest of it is not bound, `(a, b, _)`.
            ("B0303", _)
                if d.message.starts_with("a tuple of ") && text.starts_with('(') && text.ends_with(')') =>
            {
                let have: usize = d.message["a tuple of ".len()..].split(' ').next()?.parse().ok()?;
                let ty = d
                    .message
                    .split_once("cannot match `")
                    .map(|(_, t)| t.trim_end_matches('`'))
                    .unwrap_or_default();
                let inner = ty.strip_prefix('(').and_then(|t| t.strip_suffix(')')).unwrap_or_default();
                let arity = tuple_arity(inner);
                (arity > have).then(|| {
                    let pad = ", _".repeat(arity - have);
                    (end - 1, end - 1, pad)
                })
            }
            // A TS tuple's `length` (`coordinates: [number, number]`): its arity.
            ("B0205", "count")
                if receiver.is_some_and(|r| r.starts_with('(') && r.ends_with(')'))
                    && source[..start].ends_with('.') =>
            {
                let r = receiver.unwrap_or_default();
                let inner = &r[1..r.len() - 1];
                let arity = tuple_arity(inner);
                receiver_start(source, start).map(|at| (at, end, arity.to_string()))
            }
            // An `Int?` index (`indexOf`, `findIndex`) TS's test had found (`if (i > 0)`), used
            // where the index is required (`xs[i]`, `removing(at: i)`): `i!`.
            ("B0201", _)
                if d.message == "expected `Int`, found `Int?`"
                    && text.chars().all(|c| c.is_alphanumeric() || c == '_')
                    && (source[..start].ends_with('[') || source[..start].ends_with("at: ")) =>
            {
                Some((end, end, "!".to_string()))
            }
            // A string tested for its truthiness (`user.handle ? … : …`): whether it is not empty.
            ("B0201", _)
                if d.message == "expected `Bool`, found `String`"
                    && !text.is_empty()
                    && text.chars().all(|c| c.is_alphanumeric() || matches!(c, '_' | '.' | '!'))
                    && !text.starts_with('!') =>
            {
                Some((start, end, format!("!{text}.isEmpty")))
            }
            // A test of an optional TS read for its truthiness (`if (members.find(…))`): an object
            // or a non-empty literal is truthy, so it is whether it is there; a `Bool?` whether it is `true`.
            ("B0201", _)
                if d.message.starts_with("expected `Bool`, found `") && d.message.ends_with("?`") =>
            {
                let found = &d.message["expected `Bool`, found `".len()..d.message.len() - 2];
                let literals = found.starts_with('"') && !found.contains("\"\"");
                let object =
                    !["String", "Float", "Int", "Double", "_", "["].iter().any(|p| found.starts_with(p))
                        && !found.starts_with('"')
                        && found != "Bool";
                let test = if found == "Bool" { "== true" } else { "!= none" };
                let head = source[..start].ends_with("if ") && source[end..].starts_with(" {");
                (literals || object || found == "Bool").then(|| {
                    let spelled = if head || crate::expr::is_postfix_text(text) && head {
                        format!("{text} {test}")
                    } else {
                        format!("({text} {test})")
                    };
                    (start, end, spelled)
                })
            }
            // A string drawn as a child (`{description}`): its text.
            ("B0201", _)
                if (d.message == "expected `View?`, found `String`"
                    || d.message == "expected `View`, found `String`")
                    && (line_is(source, start, end) || braced(source, start, end)) =>
            {
                Some((start, end, format!("RawText({text})")))
            }
            // An unwrap the codemod wrote before bloomc narrowed the value (a test spelled later): gone.
            ("B0201", _) if d.message.starts_with("`!` unwraps an optional") => {
                if source[end..].starts_with('!') {
                    Some((end, end + 1, String::new()))
                } else if text.ends_with('!') {
                    Some((end - 1, end, String::new()))
                } else {
                    None
                }
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
                        && (bytes[i - 1].is_ascii_alphanumeric()
                            || matches!(bytes[i - 1], b'_' | b')' | b']'));
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

/// The arguments `a..b` with their trailing named ones (`k: v`, all of them to the end) as
/// one record: `x, k: v, l: w` → `x, { k: v, l: w }`. `None` when none is named or a
/// positional one follows a named one.
fn options_record(source: &str, a: usize, b: usize) -> Option<(usize, usize, String)> {
    let inner = &source[a..b];
    let mut parts: Vec<(usize, usize)> = Vec::new();
    let (mut depth, mut quoted, mut from) = (0i32, false, 0usize);
    let mut prev = ' ';
    let mut comment = false;
    for (i, c) in inner.char_indices() {
        // A line comment among the arguments (`a: x, // why`) is skipped to its line's end.
        if comment {
            if c == '\n' {
                comment = false;
            }
            prev = c;
            continue;
        }
        match c {
            '/' if !quoted && inner[i..].starts_with("//") => comment = true,
            '"' if prev != '\\' => quoted = !quoted,
            '(' | '[' | '{' if !quoted => depth += 1,
            ')' | ']' | '}' if !quoted => depth -= 1,
            ',' if !quoted && depth == 0 => {
                parts.push((from, i));
                from = i + 1;
            }
            _ => {}
        }
        prev = c;
    }
    if !inner[from..].trim().is_empty() {
        parts.push((from, inner.len()));
    }
    // A part's code without the comment lines before it.
    let code = |s: usize, e: usize| -> &str {
        let mut part = inner[s..e].trim();
        while part.starts_with("//") {
            part = part.split_once('\n').map_or("", |(_, rest)| rest).trim();
        }
        part
    };
    let named = |&(s, e): &(usize, usize)| {
        let part = code(s, e);
        part.split_once(':').is_some_and(|(k, _)| {
            let k = k.trim();
            !k.is_empty() && k.chars().all(|c| c.is_alphanumeric() || c == '_')
        })
    };
    // A trailing comment after the last comma is not an argument.
    let trailing_comment = parts.last().is_some_and(|&(s, e)| code(s, e).is_empty());
    let (parts, tail) = if trailing_comment {
        let (&last, rest) = parts.split_last()?;
        (rest.to_vec(), inner[last.0..last.1].trim().to_string())
    } else {
        (parts, String::new())
    };
    let first = parts.iter().position(named)?;
    if !parts[first..].iter().all(named) {
        return None;
    }
    let fields: Vec<&str> = parts[first..].iter().map(|&(s, e)| inner[s..e].trim()).collect();
    let start = a + parts[first].0;
    let lead = if first == 0 { "" } else { " " };
    // With comments among them, one field a line (a `//` would swallow the rest of a line).
    let commented = !tail.is_empty() || fields.iter().any(|f| f.contains("//"));
    let record = if commented {
        format!("{lead}{{\n{},\n{tail}\n}}", fields.join(",\n"))
    } else {
        format!("{lead}{{ {} }}", fields.join(", "))
    };
    Some((start, b, record))
}

/// `receiver.then { v in body }` as a statement: the task that awaits it, then runs `body`.
fn promise_then(source: &str, start: usize, end: usize) -> Option<(usize, usize, String)> {
    let (at, close, receiver, inner) = promise_statement(source, start, end)?;
    let (params, body) = inner.split_once(" in ")?;
    let name = params.split(':').next()?.trim();
    if name.is_empty() || !name.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return None;
    }
    Some((at, close, format!("task {{\nlet {name} = await {receiver}\n{body}\n}}")))
}

/// A statement `receiver.m { … }` (`start..end` is `m`): where it starts and ends, its receiver
/// and the closure's inside.
fn promise_statement(source: &str, start: usize, end: usize) -> Option<(usize, usize, String, String)> {
    let at = receiver_start(source, start)?;
    let line_start = source[..at].rfind('\n').map_or(0, |i| i + 1);
    let lead = source[line_start..at].trim();
    if !(lead.is_empty() || lead.ends_with('{')) || at == start - 1 {
        return None;
    }
    let close = block_end(source, end)?;
    let inner = source[end..close].trim().strip_prefix('{')?.strip_suffix('}')?.trim().to_string();
    let after = source[close..].trim_start_matches([' ', '\t']);
    if !(after.is_empty() || after.starts_with('\n') || after.starts_with('}')) {
        return None;
    }
    Some((at, close, source[at..start - 1].trim().to_string(), inner))
}

/// Where the receiver of the member at `start` (just after its `.`) begins: `a.b(…)`, back
/// over whitespace and line breaks.
fn receiver_start(source: &str, start: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut at = source[..start - 1].trim_end().len();
    loop {
        if at > 0 && bytes[at - 1] == b')' {
            let mut depth = 0i32;
            let mut i = at;
            while i > 0 {
                i -= 1;
                match bytes[i] {
                    b')' => depth += 1,
                    b'(' => {
                        depth -= 1;
                        if depth == 0 {
                            break;
                        }
                    }
                    _ => {}
                }
            }
            at = i;
        }
        let ident = source[..at].trim_end_matches(|c: char| c.is_alphanumeric() || c == '_');
        if ident.len() == at {
            break;
        }
        at = ident.len();
        if at > 0 && bytes[at - 1] == b'.' {
            at -= 1;
            // `a!.b`, `a?.b`: the unwrap belongs to the receiver.
            while at > 0 && matches!(bytes[at - 1], b'!' | b'?') {
                at -= 1;
            }
            continue;
        }
        break;
    }
    Some(at)
}

/// `receiver.catch { e: T in body }` as a statement (`start..end` is `catch`): the task that
/// awaits the receiver and catches its error.
fn promise_catch(source: &str, start: usize, end: usize) -> Option<(usize, usize, String)> {
    let bytes = source.as_bytes();
    // The receiver: `a.b(…)`, back from the dot (over whitespace and line breaks).
    let mut at = source[..start - 1].trim_end().len();
    loop {
        if at > 0 && bytes[at - 1] == b')' {
            let mut depth = 0i32;
            let mut i = at;
            while i > 0 {
                i -= 1;
                match bytes[i] {
                    b')' => depth += 1,
                    b'(' => {
                        depth -= 1;
                        if depth == 0 {
                            break;
                        }
                    }
                    _ => {}
                }
            }
            at = i;
        }
        let ident = source[..at].trim_end_matches(|c: char| c.is_alphanumeric() || c == '_');
        if ident.len() == at {
            break;
        }
        at = ident.len();
        if at > 0 && bytes[at - 1] == b'.' {
            at -= 1;
            continue;
        }
        break;
    }
    let line_start = source[..at].rfind('\n').map_or(0, |i| i + 1);
    let lead = source[line_start..at].trim();
    // `await p.catch(…)` in async code: awaited where it is, no task of its own.
    let awaited = lead.ends_with("await") && {
        let before = lead.trim_end_matches("await").trim_end();
        before.is_empty() || before.ends_with('{')
    };
    if !(lead.is_empty() || lead.ends_with('{') || awaited) || at == start - 1 {
        return None;
    }
    let receiver = source[at..start - 1].trim();
    let at = if awaited { source[..at].trim_end().len() - "await".len() } else { at };
    let close = block_end(source, end)?;
    let closure = source[end..close].trim();
    let inner = closure.strip_prefix('{')?.strip_suffix('}')?.trim();
    let (name, body) = match inner.split_once(" in ") {
        Some((params, body)) if !params.contains(['(', '{', '"']) => (params.split(':').next()?.trim(), body),
        _ => ("", inner),
    };
    if !name.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return None;
    }
    let catch = if name.is_empty() { "catch".to_string() } else { format!("catch let {name}") };
    let after = source[close..].trim_start_matches([' ', '\t']);
    if !(after.is_empty() || after.starts_with('\n') || after.starts_with('}')) {
        return None;
    }
    let handled = format!("do {{\ntry await {receiver}\n}} {catch} {{\n{body}\n}}");
    Some((at, close, if awaited { handled } else { format!("task {{\n{handled}\n}}") }))
}

/// The JS members the codemod renamed (`length` → `count`, `trim()` → `trimmed()`, …) put back
/// where bloomc types the receiver `Foreign`: there the member is TS's own, emitted as written.
pub fn foreign_js_names(source: &str, filename: &str, options: &bloom_lang::Options) -> Option<String> {
    const NAMES: &[(&str, &str)] = &[
        ("count", "length"),
        ("trimmed", "trim"),
        ("contains", "includes"),
        ("joined", "join"),
        ("lowercased", "toLowerCase"),
        ("uppercased", "toUpperCase"),
    ];
    let checked = bloom_lang::check(source, filename, options);
    let mut ends: std::collections::HashMap<usize, &str> = std::collections::HashMap::new();
    for (span, ty) in &checked.types {
        let end = span.end as usize;
        // The widest expression ending there is the receiver.
        ends.entry(end).or_insert(ty.as_str());
        if ty.starts_with("Foreign") {
            ends.insert(end, ty.as_str());
        }
    }
    let mut edits: Vec<(usize, usize, &str)> = Vec::new();
    for (bloom, js) in NAMES {
        for (at, _) in source.match_indices(&format!(".{bloom}")) {
            let name_start = at + 1;
            let name_end = name_start + bloom.len();
            let next = source[name_end..].chars().next();
            if next.is_some_and(|c| c.is_alphanumeric() || c == '_') {
                continue;
            }
            let receiver_end = if source[..at].ends_with('?') { at - 1 } else { at };
            if ends.get(&receiver_end).is_some_and(|ty| ty.starts_with("Foreign")) {
                edits.push((name_start, name_end, js));
            }
        }
    }
    if edits.is_empty() {
        return None;
    }
    edits.sort_by_key(|(start, ..)| std::cmp::Reverse(*start));
    let mut out = source.to_string();
    for (start, end, text) in edits {
        out.replace_range(start..end, text);
    }
    Some(out)
}

/// The start of the line of the first write `name = …` before `read`, in the closure or
/// function holding it (scanned back to its head line).
fn first_write(source: &str, read: usize, name: &str) -> Option<usize> {
    let mut found = None;
    let mut depth = 0i32;
    let mut line_end = source[read..].find('\n').map_or(source.len(), |i| read + i);
    loop {
        let line_start = source[..line_end].rfind('\n').map_or(0, |i| i + 1);
        let line = &source[line_start..line_end];
        let scanned = if line_start <= read && read <= line_end { &source[line_start..read] } else { line };
        let opens = scanned.matches('{').count() as i32;
        let closes = scanned.matches('}').count() as i32;
        depth += closes - opens;
        let trimmed = line.trim_start();
        for op in [" = ", " += ", " -= "] {
            if trimmed.starts_with(&format!("{name}{op}")) && line_start < read {
                found = Some(line_start);
            }
        }
        if depth < 0 {
            let head = trimmed.trim_end();
            let closure = head.ends_with(" in")
                || head.contains(".on")
                || head.starts_with("task")
                || head.starts_with("fn ")
                || head.starts_with("func ")
                || head.contains(" fn ")
                || head.contains(" func ")
                || head.contains(" in ");
            if closure {
                break;
            }
            depth = 0;
        }
        if line_start == 0 || trimmed.starts_with("body ") || trimmed.starts_with("var body") {
            break;
        }
        line_end = line_start - 1;
    }
    found
}

/// How many items a tuple type's inside (`A, (B) -> C, [D]`) lists: its commas outside brackets
/// (an arrow's `>` is not one).
fn tuple_arity(inner: &str) -> usize {
    let mut depth = 0i32;
    let mut prev = ' ';
    let mut commas = 0;
    for c in inner.chars() {
        match c {
            '(' | '[' | '{' | '<' => depth += 1,
            '>' if prev == '-' => {}
            ')' | ']' | '}' | '>' => depth -= 1,
            ',' if depth == 0 => commas += 1,
            _ => {}
        }
        prev = c;
    }
    commas + 1
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
