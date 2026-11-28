//! JS members that bloomc's types name. A member the codemod could not type is
//! written as JS wrote it (`picked.has(id)`); bloomc then says what the receiver
//! is (B0209 "`Set<String>` has no method `has`") and the member becomes its
//! `.bloom` name. Only receivers whose type has the member under another name are
//! rewritten; anything else stays an error (a refusal).
//!
//! A guard the source had (`?.`, `?.[`, `?.(`, `??`) is never dropped here, even where TS types
//! the value present: JS reads it at run time (a cache, a test's `as never`), so it stays as
//! written and bloomc keeps it on a TS value. A Bloom value bloomc says is never `none` refuses.

use bloom_lang::Diagnostic;
use std::collections::HashMap;

/// `source` with each member bloomc named respelled, or `None` when there is none. `ts` is the
/// file's TS text: a fallback the codemod wrote itself is told from the source's by it.
pub fn fix(source: &str, diagnostics: &[Diagnostic], ts: &str) -> Option<String> {
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
            // `n.toFixed(d)`: Bloom's `n.formatted(fractionDigits: d)` (`Int` and `Float`).
            ("B0209", "toFixed")
                if matches!(receiver, Some("Int" | "Float" | "Int?" | "Float?"))
                    && source[end..].starts_with('(')
                    && !source[end..].starts_with("()") =>
            {
                Some((start, end + 1, "formatted(fractionDigits: ".to_string()))
            }
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
                    let declared = format!("let {snapshot} = {text}\n");
                    let already = source[line_start..start].contains(&declared)
                        || source[..line_start].trim_end().ends_with(declared.trim_end())
                        || edits
                            .iter()
                            .any(|(a, b, t)| *a == line_start && *b == line_start && t.contains(&snapshot));
                    if !already {
                        edits.push((line_start, line_start, format!("{indent}let {snapshot} = {text}\n")));
                    }
                    (start, end, snapshot)
                })
            }
            // `xs = xs.add(x)` on a Bloom `Set`: TS's `add` mutates and returns the set, so the
            // assignment is the set with it inserted (`delete` is likewise `removing`).
            ("B0209", "add" | "delete")
                if receiver.is_some_and(|r| r.starts_with("Set<")) && source[..start].ends_with('.') && {
                    let before = &source[..start - 1];
                    let line = &before[before.rfind('\n').map_or(0, |i| i + 1)..];
                    let receiver_text = line.rsplit([' ', '(']).next().unwrap_or("");
                    !receiver_text.is_empty()
                        && (line.trim_start().starts_with(&format!("{receiver_text} = "))
                            || line.contains(&format!("{{ {receiver_text} = ")))
                } =>
            {
                Some((start, end, if text == "add" { "inserting" } else { "removing" }.to_string()))
            }
            // `new Set(xs).add(x)`: JS copies the set, then adds to the copy; with value semantics
            // that is `xs.inserting(x)` (`delete`: `removing`).
            ("B0209", "add" | "delete")
                if receiver.is_some_and(|r| r.starts_with("Set<"))
                    && source[..start].ends_with(").")
                    && let Some(open) = source[..start - 2].rfind("Set(")
                    && source[..open].ends_with(|c: char| !(c.is_alphanumeric() || c == '_' || c == '.'))
                    && source[open + 4..start - 2]
                        .chars()
                        .all(|c| c.is_alphanumeric() || c == '_' || c == '.')
                    && !source[open + 4..start - 2].is_empty() =>
            {
                let set = &source[open + 4..start - 2];
                let method = if text == "add" { "inserting" } else { "removing" };
                Some((open, end, format!("{set}.{method}")))
            }
            // `0..<n` with a `Float` bound (a TS `number` given to `Array.from({ length })`, which
            // truncates it): `0..<n.truncated()`.
            ("B0201", _)
                if d.message == "expected `Int`, found `Float`"
                    && (source[..start].ends_with("..<") || source[..start].ends_with("..<(")) =>
            {
                let simple = text.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '.');
                Some((
                    start,
                    end,
                    if simple { format!("{text}.truncated()") } else { format!("({text}).truncated()") },
                ))
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
            // A call of a module function the codemod made `async throws` (TS's rejection rejects
            // its promise): awaited, `try await f()`; handed on as TS's promise, a task of it.
            ("B0223", _) if d.message == "this call can throw, and it is not marked with `try`" => {
                let callee: String = text.chars().take_while(|c| c.is_alphanumeric() || *c == '_').collect();
                let declared = !callee.is_empty()
                    && text[callee.len()..].starts_with('(')
                    && [format!("async fn {callee}("), format!("async fn {callee}<")].iter().any(|head| {
                        source.match_indices(head.as_str()).any(|(at, _)| {
                            let sig = &source[at..];
                            let sig = &sig[..sig.find(" {\n").unwrap_or(sig.len())];
                            sig.contains(" throws")
                        })
                    });
                if !declared {
                    None
                } else if source[..start].ends_with("await ") {
                    Some((start - "await ".len(), start - "await ".len(), "try ".to_string()))
                } else {
                    Some((start, end, format!("task {{\ntry await {text}\n}}")))
                }
            }
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
            // `s.trimEnd()` / `s.trimStart()`: the standard library's `trimmingEnd()` /
            // `trimmingStart()` (JS's own, so the same whitespace).
            ("B0209", "trimEnd" | "trimStart")
                if receiver == Some("String") && source[end..].starts_with("()") =>
            {
                let name = if text == "trimEnd" { "trimmingEnd" } else { "trimmingStart" };
                Some((start, end, name.to_string()))
            }
            // Named arguments to a function whose one parameter is unnamed (a TS
            // options object, `(data: { text: string }) => void`): the record itself.
            // `t("k", defaultValue: "x")`, `f(id, kind: k)` to a TS function whose last parameter
            // is an options object: the trailing named arguments are that record.
            // `if let x = x` the codemod wrote for an optional's truthiness, where `x` is now a
            // `Bool` (spelled since): its truthiness, `if x`.
            ("B0303", _)
                if d.message.starts_with("`if let ")
                    && d.message.ends_with("unwraps an optional, and this is `Bool`") =>
            {
                let name = d.message["`if let ".len()..].split(' ').next().unwrap_or_default();
                let bind = format!("if let {name} = {name} ");
                let line = source[..start].rfind('\n').map_or(0, |i| i + 1);
                let line_end = source[start..].find('\n').map_or(source.len(), |i| start + i);
                source[line..line_end]
                    .find(&bind)
                    .filter(|_| name.chars().all(|c| c.is_alphanumeric() || c == '_'))
                    .map(|at| (line + at, line + at + bind.len(), format!("if {name} ")))
            }
            // `if let x = x { x }` the codemod wrote for an optional child, where bloomc has
            // narrowed `x` present (`tabBar ? Sticky { tabBar } : none`): the child itself.
            ("B0303", _)
                if d.message.starts_with("`if let ")
                    && d.message.ends_with("unwraps an optional, and this is `View`") =>
            {
                let name = d.message["`if let ".len()..].split(' ').next().unwrap_or_default();
                let whole = format!("if let {name} = {name} {{ {name} }}");
                let line = source[..start].rfind('\n').map_or(0, |i| i + 1);
                let line_end = source[start..].find('\n').map_or(source.len(), |i| start + i);
                source[line..line_end]
                    .find(&whole)
                    .filter(|_| name.chars().all(|c| c.is_alphanumeric() || c == '_'))
                    .map(|at| (line + at, line + at + whole.len(), name.to_string()))
            }
            // A function value TS typed with an optional parameter (`t: (key: string, o?: O) =>
            // string`) called without it: a Swift function type has no defaults, so it is `none`.
            ("B0207", _)
                if d.message.starts_with("missing argument(s): the ")
                    && d.message.split(", ").all(|m| m.ends_with("(unlabelled)"))
                    && source[..start].ends_with('(')
                    && source[end..].starts_with(')')
                    && options_record(source, start, end).is_none() =>
            {
                let callee: String = source[..start - 1]
                    .chars()
                    .rev()
                    .take_while(|c| c.is_alphanumeric() || *c == '_')
                    .collect::<Vec<_>>()
                    .into_iter()
                    .rev()
                    .collect();
                let missing = d.message.matches("(unlabelled)").count();
                let function_typed = !callee.is_empty()
                    && !source[..start - 1 - callee.len()].ends_with('.')
                    && source.contains(&format!("{callee}: ("));
                function_typed.then(|| {
                    let nones = vec!["none"; missing].join(", ");
                    let added = if text.trim().is_empty() { nones } else { format!(", {nones}") };
                    (end, end, added)
                })
            }
            ("B0207", _)
                if d.message.starts_with("no parameter is named `")
                    || (d.message.starts_with("missing argument(s): the ")
                        && d.message.ends_with("(unlabelled)")) =>
            {
                call_args(source, start, end).and_then(|(a, b)| options_record(source, a, b))
            }
            // JS `s.slice(n)` (to the end) on a plain receiver: Bloom's `slice` takes both ends.
            ("B0207", _)
                if d.message == "this takes 2 argument(s), not 1"
                    && source[..start].ends_with(".slice(")
                    && !text.trim_start().starts_with('-')
                    && source[end..].starts_with(')') =>
            {
                let dot = start - ".slice(".len();
                receiver_start(source, dot + 1).and_then(|at| {
                    let receiver = &source[at..dot];
                    (!receiver.is_empty()
                        && receiver.chars().all(|c| c.is_alphanumeric() || matches!(c, '_' | '.')))
                    .then(|| (end, end, format!(", {receiver}.count")))
                })
            }
            // A closure's optional parameters (`(a, b?: T) =>`, written `b: T?`) the call leaves out:
            // `none`, as JS passes `undefined`. (bloomc points at the last argument given.)
            ("B0207", _)
                if d.message.starts_with("missing argument(s): `")
                    && d.message != "missing argument(s): ``"
                    && source[end..].starts_with(')') =>
            {
                let missing = d.message.matches('`').count() / 2;
                Some((end, end, ", none".repeat(missing)))
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
                    // `i >= 0` on an index (`findIndex`): whether it was found.
                    _ => index_test(source, start, end, text),
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
                            // A string or number name TS narrowed (`if (!name || …) return …; else`):
                            // a plain name only, as a field path may be a TS getter's fresh read.
                            && (!["String", "Float", "Int", "Double", "Bool", "View"].contains(&want)
                                || (["String", "Float", "Int", "Double"].contains(&want)
                                    && text.chars().all(|c| c.is_alphanumeric() || c == '_')))
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
                index_test(source, start, end, text)
            }
            // A function read from a `Record<K, F>` that TS typed present (`const Glyph =
            // ICONS[mode]`), then called: JS calls it as it is, so the read is `ICONS[mode]!`.
            ("B0208", _)
                if d.message.ends_with("?` cannot be called")
                    && !text.is_empty()
                    && text.chars().all(|c| c.is_alphanumeric() || c == '_') =>
            {
                // Past `if let x = x` to the declaration it unwraps.
                let decl = format!("let {text} = ");
                let shadow = format!("let {text} = {text} {{");
                let mut before = start;
                let at = loop {
                    let at = source[..before].rfind(&decl)?;
                    if !source[at..].starts_with(&shadow) {
                        break at;
                    }
                    before = at;
                };
                let value = at + decl.len();
                let end_of = statement_end(source, value);
                // The one record read in the value, unwrapped (`c ? none : ICONS[k]`).
                let reads: Vec<usize> = (value..end_of)
                    .filter(|&i| {
                        source.as_bytes()[i] == b']'
                            && !source[i + 1..].starts_with(['!', '?'])
                            && is_subscript(&source[value..=i])
                            && subscript_open(source, i).is_some_and(|o| {
                                source[..o].ends_with(|c: char| c.is_alphanumeric() || c == '_')
                            })
                    })
                    .collect();
                match reads.as_slice() {
                    [close] => Some((close + 1, close + 1, "!".to_string())),
                    _ => None,
                }
            }
            // A TS tuple read by a constant index (`coordinates[0]`): Swift's tuple member,
            // `coordinates.0`. (`coordinates?.[0]` waits for bloomc to parse `x?.0`.)
            ("B0201", _)
                if d.message.ends_with("` cannot be indexed") && receiver.is_some_and(is_tuple_type) =>
            {
                tuple_index(source, end).map(|(n, close)| (end, close, format!(".{n}")))
            }
            // `(a ?? b) != none` (TS's truthiness of `a ?? b`) of an object `a` and a string `b`:
            // `a` is truthy when present, else `b` when not empty.
            ("B0201", _)
                if d.message.starts_with("expected `")
                    && d.message.ends_with("?`, found `String?`")
                    && crate::expr::is_postfix_text(text)
                    && source[..start].ends_with("?? ") =>
            {
                let object = &d.message["expected `".len()..d.message.len() - "?`, found `String?`".len()];
                let plain_object = object.starts_with(|c: char| c.is_ascii_uppercase())
                    && !["String", "Float", "Int", "Bool", "Double", "Foreign"]
                        .iter()
                        .any(|p| object.starts_with(p));
                enclosing_group(source, start, end).and_then(|(open, close)| {
                    let inner = &source[open + 1..close - 1];
                    let (a, b) = inner.split_once(" ?? ")?;
                    // The test the codemod spelled, or TS's `Boolean(a ?? b)` (its `!!` dropped).
                    let tested = if source[close..].starts_with(" != none") {
                        close + " != none".len()
                    } else if ts.contains(&format!("Boolean({a} ?? {b})")) {
                        close
                    } else {
                        return None;
                    };
                    (plain_object && b == text && crate::expr::is_postfix_text(a))
                        .then(|| (open, tested, format!("({a} != none || {b} != none && !{b}.isEmpty)")))
                })
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
            // `match await f() { case .ok(v) => { …; await g() } case .err(_) => {} }` as a block's
            // last statement: the `.ok` case ends in a TS `await` whose `Result` nothing reads
            // (TS's `await g();`), so it is discarded, `let _ = await g()`.
            ("B0201", _)
                if d.message.starts_with("the branches give `Result<")
                    && d.message.ends_with("` and `Unit`")
                    && text.starts_with("match await ") =>
            {
                let err = text.rfind("case .err(_) => {}")?;
                let ok_end = text[..err].trim_end().strip_suffix('}')?.trim_end().len();
                let line = text[..ok_end].rfind('\n').map_or(0, |i| i + 1);
                let indent = text[line..].len() - text[line..].trim_start().len();
                // The last statement's first line: the last line at the case body's indentation.
                let head = text[..ok_end].rmatch_indices('\n').map(|(i, _)| i + 1).find(|&i| {
                    let l = &text[i..];
                    l.len() - l.trim_start().len() == indent && !l.trim_start().starts_with(['}', ')', '.'])
                })?;
                text[head + indent..].starts_with("await ").then(|| {
                    let at = start + head + indent;
                    (at, at, "let _ = ".to_string())
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
            // `let s: SongSearch = useSearch(…)`: TS's annotation of a TS call's result with an
            // interface it is assignable to; Bloom's types are nominal, so the binding takes the
            // call's own type.
            ("B0201", _)
                if d.message.starts_with("expected `")
                    && {
                        let (want, found) =
                            d.message["expected `".len()..].split_once("`, found `").unwrap_or_default();
                        let found = found.trim_end_matches('`');
                        let named = |t: &str| {
                            t.starts_with(|c: char| c.is_ascii_uppercase())
                                && t.chars().all(|c| c.is_alphanumeric() || c == '_')
                                && !["String", "Float", "Int", "Bool", "View", "Foreign"].contains(&t)
                        };
                        named(want) && named(found)
                    }
                    && text.contains('(') =>
            {
                let line_start = source[..start].rfind('\n').map_or(0, |i| i + 1);
                let head = &source[line_start..start];
                let want =
                    d.message["expected `".len()..].split_once('`').map(|(w, _)| w).unwrap_or_default();
                let annotation = format!(": {want} = ");
                head.trim_start().starts_with("let ").then_some(()).and_then(|_| head.find(&annotation)).map(
                    |at| {
                        let a = line_start + at;
                        (a, a + annotation.len(), " = ".to_string())
                    },
                )
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
                let plain = text.chars().all(|c| c.is_alphanumeric() || matches!(c, '_' | '.' | '!' | '?'));
                if found == "String" && plain {
                    // A `String?` is truthy when it is there and not empty.
                    Some((start, end, format!("(({text} ?? \"\") != \"\")")))
                } else {
                    (literals || object || found == "Bool").then(|| {
                        let spelled =
                            if head { format!("{text} {test}") } else { format!("({text} {test})") };
                        (start, end, spelled)
                    })
                }
            }
            // A string drawn as a child (`{description}`): its text.
            ("B0201", _)
                if (d.message == "expected `View?`, found `String`"
                    || d.message == "expected `View`, found `String`")
                    && (line_is(source, start, end) || braced(source, start, end)) =>
            {
                Some((start, end, format!("RawText({text})")))
            }
            // A list of a string and nodes (`[separator, Link(…) { … }]`, TS's `[s, Embed(<Link/>)]`
            // spread into a text): bloomc types it from the string, so its strings are text nodes.
            ("B0201", _)
                if d.message.ends_with(", found `View`")
                    && (d.message.starts_with("expected `String`")
                        || d.message.starts_with("expected `\"")) =>
            {
                texts_beside_nodes(source, start)
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
            // `(x ?? 0) > 0`, `(x ?? "") != ""`: a fallback the codemod wrote itself for a test of an
            // optional, where bloomc has since narrowed `x` present. The source had no `x ??`, so
            // nothing it guarded is dropped: the read is `x`.
            ("B0201", _)
                if d.message.starts_with("`??` gives a fallback")
                    && crate::expr::is_postfix_text(text)
                    && !ts.contains(&format!("{text} ??"))
                    // (Anywhere else, TS's `x || ""` is a guard: below, `x` is declared optional.)
                    && (source[..start].ends_with('(') || source[..start].ends_with("${")) =>
            {
                let rest = &source[end..];
                let at = rest.len() - rest.trim_start().len();
                if source[..start].ends_with('(') {
                    ["?? 0)", "?? \"\")"].iter().find_map(|own| {
                        rest[at..]
                            .starts_with(own)
                            .then(|| (start - 1, end + at + own.len(), text.to_string()))
                    })
                } else if source[..start].ends_with("${") && rest[at..].starts_with("?? \"\"}") {
                    // `"${x ?? ""}"`, the codemod's own for an interpolated optional: `"${x}"`, and
                    // its review note above the line goes with it.
                    let cut = end + at + "?? \"\"".len();
                    let line = source[..start].rfind('\n').map_or(0, |i| i + 1);
                    let note = source[..line.saturating_sub(1)].rfind('\n').map_or(0, |i| i + 1);
                    let noted = line > 0
                        && source[note..line]
                            .trim()
                            .starts_with("// bloom: review: an optional interpolated as")
                        && source[line..start].matches("${").count() == 1
                        && !source[cut..].split('\n').next().unwrap_or("").contains("${");
                    if noted {
                        Some((note, cut, format!("{}{text}", &source[line..start])))
                    } else {
                        Some((start, cut, text.to_string()))
                    }
                } else {
                    None
                }
            }
            // `d[k?.lowercased()]`: a subscript takes a key, not an optional one, so the read is
            // narrowed, `(k != none ? d[k.lowercased()] : none)`.
            ("B0201", _)
                if d.message.starts_with("expected `")
                    && d.message.ends_with("?`")
                    && source[..start].ends_with('[')
                    && source[end..].starts_with(']')
                    && text.matches("?.").count() == 1 =>
            {
                let (key_root, _) = text.split_once("?.").unwrap_or_default();
                let dict_end = start - 1;
                let dict_from = source[..dict_end]
                    .rfind(|c: char| !(c.is_alphanumeric() || c == '_' || c == '.'))
                    .map_or(0, |i| i + 1);
                let dict = &source[dict_from..dict_end];
                let simple = |t: &str| {
                    !t.is_empty()
                        && t.starts_with(|c: char| c.is_alphabetic() || c == '_')
                        && t.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '.')
                };
                (simple(key_root) && simple(dict)).then(|| {
                    let key = text.replacen("?.", ".", 1);
                    (dict_from, end + 1, format!("({key_root} != none ? {dict}[{key}] : none)"))
                })
            }
            // `engagement?.likes`, `pollData.options ?? []`, `f?.(x)` on a field, parameter or prop the
            // codemod declared from TS's type (`engagement: Engagement`): the source guards it, so the
            // declaration is written optional (`Engagement?`) and the guard stays. One TS declared
            // optional that bloomc has narrowed present (`if onRate { … onRate?.(x) }`) is read as it.
            ("B0201", _)
                if d.message.starts_with("`?.` reads an optional, and this is `")
                    || d.message.starts_with("`??` gives a fallback for an optional, and this is `") =>
            {
                let shown =
                    d.message.split_once("this is `").map(|(_, t)| t.trim_end_matches('`')).unwrap_or("");
                let fallback = d.message.starts_with("`??`");
                let (receiver, guard) = if fallback {
                    (text, None)
                } else if source[..start].ends_with("?.") {
                    let before = &source[..start - 2];
                    let from = before
                        .rfind(|c: char| !(c.is_alphanumeric() || c == '_' || c == '.'))
                        .map_or(0, |i| i + 1);
                    (&before[from..], Some((start - 2, start, ".")))
                } else if source[end..].starts_with("?.(") {
                    (text, Some((end, end + 2, "")))
                } else {
                    ("", None)
                };
                let simple = !receiver.is_empty()
                    && receiver.starts_with(|c: char| c.is_alphabetic() || c == '_')
                    && receiver.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '.');
                let name = receiver.rsplit('.').next().unwrap_or("");
                match simple.then(|| guarded_decl(source, name, shown)).flatten() {
                    Some(Decl::Present(at)) => Some((at.0, at.1, at.2)),
                    Some(Decl::Narrowed) => guard.map(|(a, b, t)| (a, b, t.to_string())),
                    None => None,
                }
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
            && !edits.iter().any(|(a, b, x)| s < *b && *a < e || (*a, *b, x) == (s, e, &t))
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
    // `p.then { … }` (TS's `() => …`): nothing is bound, the value is discarded.
    let first = inner.lines().next().unwrap_or_default();
    let has_param = first.split_once(" in").is_some_and(|(params, rest)| {
        (rest.is_empty() || rest.starts_with([' ', '\n']))
            && params.split(',').all(|p| {
                let p = p.split(':').next().unwrap_or_default().trim();
                !p.is_empty() && p.chars().all(|c| c.is_alphanumeric() || c == '_')
            })
    });
    let (name, body) = if has_param {
        let (params, body) = inner.split_once(" in")?;
        (params.split(':').next()?.trim(), body.trim_start())
    } else {
        ("_", inner.as_str())
    };
    if name.is_empty() || !name.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return None;
    }
    let awaited = source[at..].starts_with("await");
    // The last statement of a function that returns the promise (`return p.then(…)`) stays a
    // value: a task there would return nothing.
    let tail = source[close..].trim_start().starts_with('}');
    let signature = source[..at]
        .rmatch_indices('\n')
        .map(|(i, _)| &source[i + 1..])
        .find(|l| {
            l.starts_with("fn ")
                || l.starts_with("pub fn ")
                || l.starts_with("async fn ")
                || l.starts_with("pub async fn ")
        })
        .and_then(|l| l.split(") {").next());
    if tail && signature.is_some_and(|l| l.contains("-> Promise")) {
        return None;
    }
    // `then` runs on success only: a rejection is not caught here (TS left it unhandled).
    let steps = format!("do {{\nlet {name} = try await {receiver}\n{body}\n}} catch {{}}");
    Some((at, close, if awaited { steps } else { format!("task {{\n{steps}\n}}") }))
}

/// A statement `receiver.m { … }` (`start..end` is `m`): where it starts and ends, its receiver
/// and the closure's inside.
fn promise_statement(source: &str, start: usize, end: usize) -> Option<(usize, usize, String, String)> {
    let at = receiver_start(source, start)?;
    let line_start = source[..at].rfind('\n').map_or(0, |i| i + 1);
    let lead = source[line_start..at].trim();
    if !(lead.is_empty() || lead.ends_with('{') || lead == "await") || at == start - 1 {
        return None;
    }
    let close = block_end(source, end)?;
    let inner = source[end..close].trim().strip_prefix('{')?.strip_suffix('}')?.trim().to_string();
    let after = source[close..].trim_start_matches([' ', '\t']);
    if !(after.is_empty() || after.starts_with('\n') || after.starts_with('}')) {
        return None;
    }
    // `await p.then(f)`: the statement starts at its `await`.
    let receiver = source[at..start - 1].trim().to_string();
    let at = if lead == "await" { source[..at].trim_end().len() - "await".len() } else { at };
    Some((at, close, receiver, inner))
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
                // React reads the handler's state as of its render all through it: the snapshot
                // is the same at the top of the handler, where every read is in its scope (a
                // write inside a `do` is read by its `catch`).
                return found.map(|_| line_end + 1);
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

/// The list literal holding the node at `at`, with each of its string items (a literal, or
/// a lowercase name or member path) written `RawText(item)`; `None` when it has none.
fn texts_beside_nodes(source: &str, at: usize) -> Option<(usize, usize, String)> {
    // The innermost `[` open at `at`.
    let bytes = source.as_bytes();
    let mut depth = 0i32;
    let mut open = None;
    for i in (0..at).rev() {
        match bytes[i] {
            b')' | b']' | b'}' => depth += 1,
            b'(' | b'{' if depth == 0 => return None,
            b'(' | b'{' => depth -= 1,
            b'[' if depth == 0 => {
                open = Some(i);
                break;
            }
            b'[' => depth -= 1,
            _ => {}
        }
    }
    let open = open?;
    // A list literal, not a subscript: nothing that ends a value right before it.
    let before = source[..open].trim_end();
    let word = before.rsplit(|c: char| !(c.is_alphanumeric() || c == '_')).next().unwrap_or("");
    let keyword = matches!(word, "return" | "in" | "else" | "yield" | "await");
    if !keyword
        && before.ends_with(|c: char| c.is_alphanumeric() || matches!(c, '_' | ')' | ']' | '?' | '!' | '"'))
    {
        return None;
    }
    let close = subscript_close(source, open)?;
    let inner = &source[open + 1..close];
    let mut items: Vec<(usize, usize)> = Vec::new();
    let (mut depth, mut quote, mut from, mut prev) = (0i32, false, 0usize, ' ');
    for (i, c) in inner.char_indices() {
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
            ')' | ']' | '}' => depth -= 1,
            ',' if depth == 0 => {
                items.push((from, i));
                from = i + 1;
            }
            _ => {}
        }
        prev = c;
    }
    items.push((from, inner.len()));
    let mut out = String::with_capacity(inner.len() + 16);
    let mut wrapped = false;
    let mut last = 0;
    for (a, b) in items {
        let raw = &inner[a..b];
        let item = raw.trim();
        let Some(text) = (!item.is_empty()).then(|| as_text(item)).flatten() else { continue };
        let lead = a + (raw.len() - raw.trim_start().len());
        out.push_str(&inner[last..lead]);
        out.push_str(&text);
        last = lead + item.len();
        wrapped = true;
    }
    out.push_str(&inner[last..]);
    wrapped.then(|| (open + 1, close, out))
}

/// Whether `item` is a string: a literal, or a lowercase name or member path.
fn text_item(item: &str) -> bool {
    let literal = item.len() >= 2 && item.starts_with('"') && item.ends_with('"');
    let path = item.starts_with(|c: char| c.is_lowercase() || c == '_')
        && item.chars().all(|c| c.is_alphanumeric() || matches!(c, '_' | '.'));
    literal || path
}

/// `item` as a node when it is a string (`RawText(item)`), or a ternary whose string
/// branches are (`c ? RawText(a) : Link(…)`, `RawText(c ? "a" : "b")`); `None` otherwise.
fn as_text(item: &str) -> Option<String> {
    if text_item(item) {
        return Some(format!("RawText({item})"));
    }
    let (q, colon) = ternary(item)?;
    let (cond, yes, no) = (&item[..q], item[q + 1..colon].trim(), item[colon + 1..].trim());
    if text_item(yes) && text_item(no) {
        return Some(format!("RawText({item})"));
    }
    let yes2 = as_text(yes);
    let no2 = as_text(no);
    if yes2.is_none() && no2.is_none() {
        return None;
    }
    let yes = yes2.unwrap_or_else(|| yes.to_string());
    let no = no2.unwrap_or_else(|| no.to_string());
    Some(format!("{}? {yes} : {no}", cond))
}

/// The top-level `?` and its `:` of a ternary `item` (strings and brackets skipped).
fn ternary(item: &str) -> Option<(usize, usize)> {
    let bytes = item.as_bytes();
    let (mut depth, mut quote, mut q, mut nested) = (0i32, false, None, 0);
    for (i, &b) in bytes.iter().enumerate() {
        if quote {
            if b == b'"' && bytes[i - 1] != b'\\' {
                quote = false;
            }
            continue;
        }
        match b {
            b'"' => quote = true,
            b'(' | b'[' | b'{' => depth += 1,
            b')' | b']' | b'}' => depth -= 1,
            // `?.`, `??` and a postfix `x?` are not the ternary's.
            b'?' if depth == 0
                && bytes.get(i + 1).is_some_and(|n| *n == b' ')
                && i > 0
                && bytes[i - 1] == b' ' =>
            {
                if q.is_none() {
                    q = Some(i);
                } else {
                    nested += 1;
                }
            }
            b':' if depth == 0 && q.is_some() => {
                if nested == 0 {
                    return q.map(|q| (q, i));
                }
                nested -= 1;
            }
            _ => {}
        }
    }
    None
}

/// The `]` matching the `[` at `open` (strings skipped).
fn subscript_close(source: &str, open: usize) -> Option<usize> {
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
            '[' | '(' | '{' => depth += 1,
            ']' | ')' | '}' => {
                depth -= 1;
                if depth == 0 {
                    return (c == ']').then_some(open + i);
                }
            }
            _ => {}
        }
        prev = c;
    }
    None
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

/// A TS cast the codemod dropped (`x as Tab`, [`crate::module::Translated::casts`]) where bloomc
/// expected a string literal union and found `String`: Bloom's checked cast, `(x as! Tab)` (a
/// trap in a dev build when `x` is not one of the cases, TS's plain cast in a release one).
pub fn casts(source: &str, diagnostics: &[Diagnostic], casts: &HashMap<String, String>) -> Option<String> {
    let mut edits: Vec<(usize, usize, String)> = Vec::new();
    for d in diagnostics {
        if d.code != "B0201" {
            continue;
        }
        let Some(expected) =
            d.message.strip_prefix("expected `").and_then(|m| m.strip_suffix("`, found `String`"))
        else {
            continue;
        };
        if !expected.starts_with('"') {
            continue;
        }
        let (mut start, mut end) = (d.span.start as usize, d.span.end as usize);
        let Some(mut text) = source.get(start..end) else { continue };
        // bloomc points at a branch of the conditional the cast's `a || b` was spelled as: the
        // cast is the group around it.
        if !casts.contains_key(&crate::truthiness::squeeze(text))
            && let Some((s, e)) = enclosing_group(source, start, end)
            && unspelled_or(&crate::truthiness::squeeze(&source[s + 1..e - 1])).is_some()
        {
            (start, end, text) = (s, e, &source[s..e]);
        }
        let key = crate::truthiness::squeeze(text);
        let bare = key.strip_prefix('(').and_then(|k| k.strip_suffix(')')).unwrap_or(&key);
        let Some(ty) = casts.get(&key).or_else(|| casts.get(bare)).or_else(|| {
            let or = unspelled_or(bare)?;
            casts.get(&or).or_else(|| casts.get(&format!("({or})")))
        }) else {
            continue;
        };
        if edits.iter().any(|(s, e, _)| start < *e && *s < end) {
            continue;
        }
        // An unnamed TS type (`Trend['type']`) is cast to the union bloomc expected.
        let ty = if ty.is_empty() { format!("({expected})") } else { ty.clone() };
        edits.push((start, end, format!("({text} as! {ty})")));
    }
    if edits.is_empty() {
        return None;
    }
    edits.sort_by_key(|(start, ..)| std::cmp::Reverse(*start));
    let mut out = source.to_string();
    for (start, end, text) in edits {
        out.replace_range(start..end, &text);
    }
    Some(out)
}

/// Where the statement whose value starts at `start` ends: a line break outside brackets that
/// neither ends in an operator nor is followed by a line continuing it (`?`, `:`, `.`, `&&`).
fn statement_end(source: &str, start: usize) -> usize {
    let bytes = source.as_bytes();
    let mut depth = 0i32;
    let mut quote = false;
    for i in start..bytes.len() {
        match bytes[i] {
            b'"' => quote = !quote,
            _ if quote => {}
            b'(' | b'[' | b'{' => depth += 1,
            b')' | b']' | b'}' => {
                depth -= 1;
                if depth < 0 {
                    return i;
                }
            }
            b'\n' if depth == 0 => {
                let line = source[start..i].trim_end();
                let next = source[i + 1..].trim_start();
                let continued = line
                    .ends_with(['=', '!', '<', '>', '?', ':', '&', '|', '+', '-', '*', '/', ','])
                    || next.starts_with(['?', ':', '.', '&', '|']);
                if !continued {
                    return i;
                }
            }
            _ => {}
        }
    }
    bytes.len()
}

/// `i < 0`, `i >= 0` (and `> -1`, `<= -1`) on an `Int?` index Bloom gives as `none` where JS
/// gives `-1`: `i == none`, `i != none`.
fn index_test(source: &str, start: usize, end: usize, text: &str) -> Option<(usize, usize, String)> {
    let rest = &source[end..];
    [(" < 0", "== none"), (" >= 0", "!= none"), (" > -1", "!= none"), (" <= -1", "== none")]
        .iter()
        .find(|(op, _)| {
            rest.starts_with(op)
                && rest[op.len()..].chars().next().is_none_or(|c| !c.is_ascii_digit() && c != '.')
        })
        .map(|(op, test)| (start, end + op.len(), format!("{text} {test}")))
}

/// Whether a bloomc type is a tuple, `(A, B)` (not a function type or a group).
fn is_tuple_type(ty: &str) -> bool {
    ty.starts_with('(') && ty.ends_with(')') && !ty.contains("->") && tuple_arity(&ty[1..ty.len() - 1]) > 1
}

/// `[N]` right at `at`, an integer literal index: `N` and the end of the `]`.
fn tuple_index(source: &str, at: usize) -> Option<(String, usize)> {
    let rest = source[at..].strip_prefix('[')?;
    let close = rest.find(']')?;
    let n = &rest[..close];
    (!n.is_empty() && n.chars().all(|c| c.is_ascii_digit())).then(|| (n.to_string(), at + 1 + close + 1))
}

/// The parenthesised group of `source` around `start..end`: `(` … `)`.
fn enclosing_group(source: &str, start: usize, end: usize) -> Option<(usize, usize)> {
    let bytes = source.as_bytes();
    let mut depth = 0i32;
    let open = (0..start).rev().find(|&i| {
        match bytes[i] {
            b')' => depth += 1,
            b'(' if depth == 0 => return true,
            b'(' => depth -= 1,
            _ => {}
        }
        false
    })?;
    let mut depth = 0i32;
    let close = (end..bytes.len()).find(|&i| {
        match bytes[i] {
            b'(' => depth += 1,
            b')' if depth == 0 => return true,
            b')' => depth -= 1,
            _ => {}
        }
        false
    })?;
    Some((open, close + 1))
}

/// A JS value `a || b` as `crate::truthiness` spelled it for a `String` or a number
/// (`a.isEmpty ? b : a`, `a == 0 ? b : a`), squeezed: the `a||b` a cast was recorded by.
fn unspelled_or(text: &str) -> Option<String> {
    let (test, rest) = text.split_once('?')?;
    let (right, left) = rest.rsplit_once(':')?;
    let a = test.strip_suffix(".isEmpty").or_else(|| test.strip_suffix("==0"))?;
    let a = a.strip_prefix('(').and_then(|x| x.strip_suffix(')')).unwrap_or(a);
    let left = left.strip_prefix('(').and_then(|x| x.strip_suffix(')')).unwrap_or(left);
    (a == left).then(|| format!("{a}||{right}"))
}

/// What a guarded name's one declaration in the draft says.
enum Decl {
    /// Declared with TS's type, present: the edit that writes it optional.
    Present((usize, usize, String)),
    /// Declared optional already: bloomc narrowed it, so the guard reads a present value.
    Narrowed,
}

/// The one declaration `name: T` in `source` (a stored property, a field of a record type or
/// struct, a parameter) whose type is bloomc's `shown`, or `shown` made optional.
fn guarded_decl(source: &str, name: &str, shown: &str) -> Option<Decl> {
    if name.is_empty() || shown.is_empty() || shown.ends_with('?') {
        return None;
    }
    // `if let onRate = onRate { … onRate?.(x) }`: bound present, whatever it was declared.
    if source.contains(&format!("if let {name} = {name} ")) {
        return Some(Decl::Narrowed);
    }
    // bloomc shows a record's optional field as `x?: T?`; the codemod writes `x: T?`.
    let shown = shown.replace("?: ", ": ");
    let needle = format!("{name}: ");
    let mut found = Vec::new();
    let mut from = 0;
    while let Some(i) = source[from..].find(&needle) {
        let at = from + i;
        from = at + needle.len();
        let boundary = source[..at].chars().next_back().is_none_or(|c| !(c.is_alphanumeric() || c == '_'));
        if !boundary {
            continue;
        }
        let start = at + needle.len();
        let end = type_end(source, start);
        let ty = source[start..end].trim_end();
        let compound = ty.contains("->") || ty.contains(" | ");
        if ty == shown {
            let edit = if compound {
                (start, start + ty.len(), format!("({ty})?"))
            } else {
                (start + ty.len(), start + ty.len(), "?".to_string())
            };
            found.push(Decl::Present(edit));
        } else if ty == format!("{shown}?") || ty == format!("({shown})?") {
            found.push(Decl::Narrowed);
        }
    }
    (found.len() == 1).then(|| found.pop()).flatten()
}

/// Where a type written at `start` ends: a `,`, `)`, `]`, `}`, `=`, a line end or ` in` outside
/// brackets and strings.
fn type_end(source: &str, start: usize) -> usize {
    let mut depth = 0i32;
    let mut quoted = false;
    for (i, c) in source[start..].char_indices() {
        let at = start + i;
        match c {
            '"' => quoted = !quoted,
            _ if quoted => {}
            '(' | '[' | '{' => depth += 1,
            ')' | ']' | '}' if depth > 0 => depth -= 1,
            ',' | ')' | ']' | '}' | '=' | '\n' if depth == 0 => return at,
            ' ' if depth == 0 && (source[at..].starts_with(" in ") || source[at..].starts_with(" in\n")) => {
                return at;
            }
            _ => {}
        }
    }
    source.len()
}

#[cfg(test)]
mod tests {
    use bloom_lang::{Diagnostic, Span};

    fn fixed(source: &str, code: &'static str, at: &str, message: &str) -> Option<String> {
        let start = source.find(at).expect("the span") as u32;
        let span = Span { start, end: start + at.len() as u32 };
        super::fix(source, &[Diagnostic::error(code, span, message)], "")
    }

    // The standard library's (`Core.bloom`), which a package's files see: a golden is not in one.
    #[test]
    fn trim_end_and_start_are_the_standard_librarys() {
        let source = "let a = name.trimEnd()\nlet b = name.trimStart()\n";
        let end = fixed(source, "B0209", "trimEnd", "`String` has no method `trimEnd`");
        assert_eq!(end.as_deref(), Some("let a = name.trimmingEnd()\nlet b = name.trimStart()\n"));
        let start = fixed(source, "B0209", "trimStart", "`String` has no method `trimStart`");
        assert_eq!(start.as_deref(), Some("let a = name.trimEnd()\nlet b = name.trimmingStart()\n"));
    }
}
