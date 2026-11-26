//! `bloomc lsp`: a language server over stdio.
//!
//! Incremental sync. On open and on every change a document is analysed
//! (`bloom_lang::analyze`) and its diagnostics published; a save republishes
//! the open documents that import the saved file, and a watched TS file's
//! change is forgotten and republishes every open document. Hover shows a
//! definition's or an expression's type; go-to-definition reaches Bloom
//! definitions in this and other `.bloom` files and a TS import's declaration;
//! references are this file's; completion is `complete`'s; formatting is
//! `bloomc fmt`. Positions are LSP's: 0-based lines and UTF-16 columns. A
//! document's TS imports resolve from the nearest directory above it with a
//! `tsconfig.json` (the workspace root otherwise).

use std::collections::HashMap;
use std::io::{BufRead, Write};
use std::path::{Path, PathBuf};

use bloom_lang::{Analysis, Definition, DefinitionKind, DefinitionOrigin, Diagnostic, Severity, Span};

use crate::complete;
use crate::json::{self, Value, object};
use crate::text;

/// Serves until `exit`; true when `shutdown` came first.
pub fn serve(mut input: impl BufRead, mut output: impl Write) -> Result<bool, String> {
    let mut server = Server { documents: HashMap::new(), root: None, shut_down: false };
    while let Some(message) = read_message(&mut input)? {
        let method = message.get("method").as_str().unwrap_or("").to_string();
        if method == "exit" {
            return Ok(server.shut_down);
        }
        for reply in server.handle(&method, &message) {
            write_message(&mut output, &reply)?;
        }
    }
    Ok(server.shut_down)
}

fn read_message(input: &mut impl BufRead) -> Result<Option<Value>, String> {
    let mut length: Option<usize> = None;
    loop {
        let mut header = String::new();
        if input.read_line(&mut header).map_err(|e| e.to_string())? == 0 {
            return Ok(None);
        }
        let header = header.trim_end();
        if header.is_empty() {
            break;
        }
        if let Some(value) = header.strip_prefix("Content-Length:") {
            length = value.trim().parse().ok();
        }
    }
    let length = length.ok_or("a message without Content-Length")?;
    let mut body = vec![0; length];
    input.read_exact(&mut body).map_err(|e| e.to_string())?;
    let text = String::from_utf8(body).map_err(|e| e.to_string())?;
    json::parse(&text).map(Some)
}

fn write_message(output: &mut impl Write, message: &Value) -> Result<(), String> {
    let body = json::write(message);
    write!(output, "Content-Length: {}\r\n\r\n{body}", body.len()).map_err(|e| e.to_string())?;
    output.flush().map_err(|e| e.to_string())
}

/// An open document: its text and, once asked for, its analysis.
struct Document {
    text: String,
    analysis: Option<Analysis>,
}

struct Server {
    documents: HashMap<String, Document>,
    /// The workspace root `initialize` named.
    root: Option<PathBuf>,
    shut_down: bool,
}

fn response(id: &Value, result: Value) -> Value {
    object([("jsonrpc", "2.0".into()), ("id", id.clone()), ("result", result)])
}

impl Server {
    fn handle(&mut self, method: &str, message: &Value) -> Vec<Value> {
        let id = message.get("id");
        let params = message.get("params");
        let uri = params.get("textDocument").get("uri").as_str().unwrap_or("").to_string();
        let position = params.get("position");
        match method {
            "initialize" => {
                self.root = params.get("rootUri").as_str().map(|uri| PathBuf::from(path_of(uri)));
                vec![response(id, capabilities())]
            }
            "shutdown" => {
                self.shut_down = true;
                vec![response(id, Value::Null)]
            }
            "textDocument/didOpen" => {
                let text = params.get("textDocument").get("text").as_str().unwrap_or("").to_string();
                self.documents.insert(uri.clone(), Document { text, analysis: None });
                vec![self.publish(&uri)]
            }
            "textDocument/didChange" => {
                if let Some(document) = self.documents.get_mut(&uri) {
                    for change in params.get("contentChanges").as_array() {
                        apply_change(&mut document.text, change);
                    }
                    document.analysis = None;
                }
                vec![self.publish(&uri)]
            }
            "textDocument/didSave" => {
                let saved = PathBuf::from(path_of(&uri));
                bloom_lang::invalidate(&saved);
                self.republish(|analysis| analysis.dependencies.contains(&saved))
            }
            "workspace/didChangeWatchedFiles" => {
                for change in params.get("changes").as_array() {
                    if let Some(changed) = change.get("uri").as_str() {
                        bloom_lang::invalidate(Path::new(&path_of(changed)));
                    }
                }
                self.republish(|_| true)
            }
            "textDocument/didClose" => {
                self.documents.remove(&uri);
                vec![publish(&uri, Vec::new())]
            }
            "textDocument/hover" => vec![response(id, self.hover(&uri, position))],
            "textDocument/definition" => vec![response(id, self.definition(&uri, position))],
            "textDocument/references" => {
                let declaration = params.get("context").get("includeDeclaration") != &Value::Bool(false);
                vec![response(id, self.references(&uri, position, declaration))]
            }
            "textDocument/completion" => vec![response(id, self.completion(&uri, position))],
            "textDocument/formatting" => vec![response(id, self.formatting(&uri))],
            // Any other request is answered "not supported"; notifications are ignored.
            _ if !id.is_null() => vec![object([
                ("jsonrpc", "2.0".into()),
                ("id", id.clone()),
                (
                    "error",
                    object([
                        ("code", Value::Number(-32601.0)),
                        ("message", format!("{method} is not supported").into()),
                    ]),
                ),
            ])],
            _ => Vec::new(),
        }
    }

    /// What a document's analysis reads from its project.
    fn options(&self, uri: &str) -> bloom_lang::Options {
        let path = PathBuf::from(path_of(uri));
        let root = path
            .ancestors()
            .skip(1)
            .find(|dir| dir.join("tsconfig.json").is_file())
            .map(Path::to_path_buf)
            .or_else(|| self.root.clone());
        bloom_lang::Options { root, ..Default::default() }
    }

    /// The document's text and analysis, analysed now if it changed.
    fn analysed(&mut self, uri: &str) -> Option<(&str, &Analysis)> {
        let options = self.options(uri);
        let document = self.documents.get_mut(uri)?;
        if document.analysis.is_none() {
            document.analysis = Some(bloom_lang::analyze(&document.text, &path_of(uri), &options));
        }
        Some((&document.text, document.analysis.as_ref()?))
    }

    fn publish(&mut self, uri: &str) -> Value {
        let Some((text, analysis)) = self.analysed(uri) else { return publish(uri, Vec::new()) };
        let diagnostics =
            analysis.diagnostics.iter().chain(&analysis.warnings).map(|d| diagnostic(text, d)).collect();
        publish(uri, diagnostics)
    }

    /// Analyses again, and publishes, every open document whose last analysis `stale` picks.
    fn republish(&mut self, stale: impl Fn(&Analysis) -> bool) -> Vec<Value> {
        let mut uris: Vec<String> = self
            .documents
            .iter_mut()
            .filter(|(_, d)| d.analysis.as_ref().is_some_and(&stale))
            .map(|(uri, d)| {
                d.analysis = None;
                uri.clone()
            })
            .collect();
        uris.sort();
        uris.iter().map(|uri| self.publish(uri)).collect()
    }

    fn offset(&self, uri: &str, position: &Value) -> Option<u32> {
        let text = &self.documents.get(uri)?.text;
        Some(text::offset(text, position.get("line").as_u32()?, position.get("character").as_u32()?))
    }

    fn hover(&mut self, uri: &str, position: &Value) -> Value {
        let Some(offset) = self.offset(uri, position) else { return Value::Null };
        let Some((text, analysis)) = self.analysed(uri) else { return Value::Null };
        let (shown, span) = match analysis.definition_at(offset).map(|def| &analysis.definitions[def]) {
            Some(d) => {
                let shown = match &d.ty {
                    Some(ty) if d.kind != DefinitionKind::Item || !ty.is_empty() => {
                        format!("{}: {ty}", d.name)
                    }
                    _ => d.name.clone(),
                };
                (shown, None)
            }
            None => match analysis.type_at(offset) {
                Some(ty) => (ty, None::<Span>),
                None => return Value::Null,
            },
        };
        let (start, end) = text::word_at(text, offset);
        let span = span.unwrap_or(Span::new(start, end));
        object([
            (
                "contents",
                object([("kind", "markdown".into()), ("value", format!("```bloom\n{shown}\n```").into())]),
            ),
            ("range", range(text, span)),
        ])
    }

    fn definition(&mut self, uri: &str, position: &Value) -> Value {
        let Some(offset) = self.offset(uri, position) else { return Value::Null };
        let options = self.options(uri);
        let Some((text, analysis)) = self.analysed(uri) else { return Value::Null };
        let Some(def) = analysis.definition_at(offset) else { return Value::Null };
        let d = &analysis.definitions[def];
        match &d.origin {
            DefinitionOrigin::Local => location(uri, text, d.span),
            DefinitionOrigin::Bloom(path) => in_bloom_file(path, d, &options).unwrap_or(Value::Null),
            DefinitionOrigin::Ts(Some(path), _) => in_ts_file(path, &d.name).unwrap_or(Value::Null),
            DefinitionOrigin::Ts(None, _) => Value::Null,
        }
    }

    fn references(&mut self, uri: &str, position: &Value, declaration: bool) -> Value {
        let Some(offset) = self.offset(uri, position) else { return Value::Null };
        let Some((text, analysis)) = self.analysed(uri) else { return Value::Null };
        let Some(def) = analysis.definition_at(offset) else { return Value::Array(Vec::new()) };
        let own = analysis.definitions[def].span;
        Value::Array(
            analysis
                .references_to(def)
                .into_iter()
                .filter(|span| declaration || *span != own)
                .map(|span| location(uri, text, span))
                .collect(),
        )
    }

    fn completion(&mut self, uri: &str, position: &Value) -> Value {
        let Some(offset) = self.offset(uri, position) else { return Value::Null };
        let options = self.options(uri);
        let path = path_of(uri);
        let Some(document) = self.documents.get(uri) else { return Value::Null };
        let text = &document.text;
        let items =
            complete::complete(text, offset, &|patched| bloom_lang::analyze(patched, &path, &options));
        Value::Array(
            items
                .into_iter()
                .map(|item| {
                    let mut fields =
                        vec![("label", Value::from(item.label.clone())), ("kind", item.kind.into())];
                    if let Some(detail) = item.detail {
                        fields.push(("detail", detail.into()));
                    }
                    if let Some(span) = item.replace {
                        fields.push((
                            "textEdit",
                            object([("range", range(text, span)), ("newText", item.label.into())]),
                        ));
                    }
                    Value::Object(fields.into_iter().map(|(k, v)| (k.to_string(), v)).collect())
                })
                .collect(),
        )
    }

    fn formatting(&self, uri: &str) -> Value {
        let Some(document) = self.documents.get(uri) else { return Value::Null };
        let text = &document.text;
        match bloom_fmt::format(text, &path_of(uri)) {
            Ok(formatted) if &formatted != text => Value::Array(vec![object([
                ("range", range(text, Span::new(0, text.len() as u32))),
                ("newText", formatted.into()),
            ])]),
            // Formatted already, or it does not parse (its diagnostics say why).
            _ => Value::Array(Vec::new()),
        }
    }
}

fn capabilities() -> Value {
    object([
        (
            "capabilities",
            object([
                (
                    "textDocumentSync",
                    object([
                        ("openClose", true.into()),
                        // Incremental.
                        ("change", 2u32.into()),
                        ("save", object([("includeText", false.into())])),
                    ]),
                ),
                ("hoverProvider", true.into()),
                ("definitionProvider", true.into()),
                ("referencesProvider", true.into()),
                (
                    "completionProvider",
                    object([("triggerCharacters", Value::Array(vec![".".into(), "\"".into()]))]),
                ),
                ("documentFormattingProvider", true.into()),
            ]),
        ),
        ("serverInfo", object([("name", "bloomc".into())])),
    ])
}

/// One `contentChanges` entry: a range and its new text, or the whole text.
fn apply_change(text: &mut String, change: &Value) {
    let Some(new_text) = change.get("text").as_str() else { return };
    let range = change.get("range");
    if range.is_null() {
        *text = new_text.to_string();
        return;
    }
    let at = |position: &Value| {
        text::offset(
            text,
            position.get("line").as_u32().unwrap_or(0),
            position.get("character").as_u32().unwrap_or(0),
        ) as usize
    };
    let (start, end) = (at(range.get("start")), at(range.get("end")));
    text.replace_range(start.min(end)..end.max(start), new_text);
}

/// Where a definition of another `.bloom` file is: its declaration there, by
/// name and kind (a case also by its enum).
fn in_bloom_file(path: &Path, wanted: &Definition, options: &bloom_lang::Options) -> Option<Value> {
    let source = std::fs::read_to_string(path).ok()?;
    let analysis = bloom_lang::analyze(&source, &path.to_string_lossy(), options);
    let kind = if wanted.kind == DefinitionKind::Import { DefinitionKind::Item } else { wanted.kind };
    let found = analysis.definitions.iter().find(|d| {
        d.origin == DefinitionOrigin::Local
            && d.name == wanted.name
            && d.kind == kind
            && (kind != DefinitionKind::Case || d.ty == wanted.ty)
    })?;
    Some(location(&uri_of(path), &source, found.span))
}

/// Where a TS file declares `name`: its `function`, `const`, `class`,
/// `interface`, `type`… (the top of the file when none is found).
fn in_ts_file(path: &Path, name: &str) -> Option<Value> {
    let source = std::fs::read_to_string(path).ok()?;
    let is_word = |c: char| c.is_alphanumeric() || c == '_' || c == '$';
    let declared = ["function", "const", "let", "var", "class", "interface", "type", "enum", "namespace"]
        .iter()
        .filter_map(|keyword| {
            let needle = format!("{keyword} {name}");
            source
                .match_indices(&needle)
                .map(|(i, _)| i)
                .find(|&i| {
                    let before = source[..i].chars().next_back().is_none_or(|c| !is_word(c));
                    let after = source[i + needle.len()..].chars().next().is_none_or(|c| !is_word(c));
                    before && after
                })
                .map(|i| i + keyword.len() + 1)
        })
        .min();
    let span = declared.map_or(Span::new(0, 0), |at| Span::new(at as u32, (at + name.len()) as u32));
    Some(location(&uri_of(path), &source, span))
}

fn location(uri: &str, text: &str, span: Span) -> Value {
    object([("uri", uri.into()), ("range", range(text, span))])
}

fn publish(uri: &str, diagnostics: Vec<Value>) -> Value {
    object([
        ("jsonrpc", "2.0".into()),
        ("method", "textDocument/publishDiagnostics".into()),
        ("params", object([("uri", uri.into()), ("diagnostics", Value::Array(diagnostics))])),
    ])
}

fn diagnostic(text: &str, d: &Diagnostic) -> Value {
    let message = match &d.help {
        Some(help) => format!("{}\nhelp: {help}", d.message),
        None => d.message.clone(),
    };
    let severity: u32 = if d.severity == Severity::Error { 1 } else { 2 };
    object([
        ("range", range(text, d.span)),
        ("severity", severity.into()),
        ("code", d.code.into()),
        ("source", "bloomc".into()),
        ("message", message.into()),
    ])
}

/// The path a `file://` URI names (percent-decoded; `/C:/x` is `C:/x`); any other URI as is.
fn path_of(uri: &str) -> String {
    let Some(path) = uri.strip_prefix("file://") else { return uri.to_string() };
    let bytes = path.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%'
            && let Some(byte) = path.get(i + 1..i + 3).and_then(|h| u8::from_str_radix(h, 16).ok())
        {
            out.push(byte);
            i += 3;
            continue;
        }
        out.push(bytes[i]);
        i += 1;
    }
    let path = String::from_utf8_lossy(&out).into_owned();
    match path.as_bytes() {
        [b'/', drive, b':', ..] if drive.is_ascii_alphabetic() => path[1..].to_string(),
        _ => path,
    }
}

/// The `file://` URI of a path, percent-encoding what a URI path cannot hold.
fn uri_of(path: &Path) -> String {
    let path = crate::files::normalize(path).to_string_lossy().replace('\\', "/");
    let mut out = String::from(if path.starts_with('/') { "file://" } else { "file:///" });
    for byte in path.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'/' | b'-' | b'_' | b'.' | b'~' | b':' => {
                out.push(byte as char)
            }
            _ => out.push_str(&format!("%{byte:02X}")),
        }
    }
    out
}

/// LSP's position of a byte offset.
fn position(text: &str, offset: u32) -> Value {
    let (line, character) = text::position(text, offset);
    object([("line", line.into()), ("character", character.into())])
}

fn range(text: &str, span: Span) -> Value {
    object([("start", position(text, span.start)), ("end", position(text, span.end))])
}

#[cfg(test)]
mod tests {
    use super::*;

    fn frame(message: &str) -> String {
        format!("Content-Length: {}\r\n\r\n{message}", message.len())
    }

    /// The server's replies to `script`, a list of JSON-RPC messages, over its stdio protocol.
    fn replies(script: &[String]) -> Vec<Value> {
        let input: String = script.iter().map(|m| frame(m)).collect();
        let mut output = Vec::new();
        serve(input.as_bytes(), &mut output).unwrap();
        let mut reader = output.as_slice();
        let mut out = Vec::new();
        while let Some(message) = read_message(&mut reader).unwrap() {
            out.push(message);
        }
        out
    }

    fn quoted(text: &str) -> String {
        json::write(&Value::String(text.to_string()))
    }

    fn open(uri: &str, text: &str) -> String {
        format!(
            r#"{{"jsonrpc":"2.0","method":"textDocument/didOpen","params":{{"textDocument":{{"uri":"{uri}","languageId":"bloom","version":1,"text":{}}}}}}}"#,
            quoted(text)
        )
    }

    fn request(id: u32, method: &str, uri: &str, line: u32, character: u32) -> String {
        format!(
            r#"{{"jsonrpc":"2.0","id":{id},"method":"{method}","params":{{"textDocument":{{"uri":"{uri}"}},"position":{{"line":{line},"character":{character}}},"context":{{"includeDeclaration":true}}}}}}"#
        )
    }

    /// `text` with its `|` removed, and the cursor's line and column.
    fn cursor(text: &str) -> (String, u32, u32) {
        let at = text.find('|').expect("a cursor");
        let (line, column) = text::position(text, at as u32);
        (text.replacen('|', "", 1), line, column)
    }

    /// The reply to request `id`.
    fn result(out: &[Value], id: u32) -> Value {
        out.iter()
            .find(|m| m.get("id") == &Value::Number(f64::from(id)))
            .expect("a reply")
            .get("result")
            .clone()
    }

    fn labels(items: &Value) -> Vec<String> {
        items.as_array().iter().filter_map(|i| i.get("label").as_str().map(String::from)).collect()
    }

    /// A completion at the document's `|`.
    fn complete_at(text: &str) -> Value {
        let (text, line, column) = cursor(text);
        let uri = "file:///tmp/bloomc-lsp-complete.bloom";
        let out = replies(&[open(uri, &text), request(1, "textDocument/completion", uri, line, column)]);
        result(&out, 1)
    }

    const STARTED: &str = r#"{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}"#;

    #[test]
    fn initializes_and_shuts_down() {
        let out = replies(&[
            STARTED.into(),
            r#"{"jsonrpc":"2.0","method":"initialized","params":{}}"#.into(),
            r#"{"jsonrpc":"2.0","id":2,"method":"textDocument/rename","params":{}}"#.into(),
            r#"{"jsonrpc":"2.0","id":3,"method":"shutdown"}"#.into(),
            r#"{"jsonrpc":"2.0","method":"exit"}"#.into(),
        ]);
        assert_eq!(out.len(), 3);
        let capabilities = out[0].get("result").get("capabilities");
        for provider in ["hoverProvider", "definitionProvider", "referencesProvider"] {
            assert_eq!(capabilities.get(provider), &Value::Bool(true), "{provider}");
        }
        assert_eq!(capabilities.get("textDocumentSync").get("change"), &Value::Number(2.0));
        assert_eq!(out[1].get("error").get("code"), &Value::Number(-32601.0));
        assert!(out[2].get("result").is_null());
    }

    const PANEL: &str = "enum Tone {\n  plain\n  loud\n}\n\nstruct Draft {\n  text: String = \"\"\n  tone: Tone = .plain\n}\n\npub view Panel(title: String) {\n  @state draft = Draft()\n\n  body {\n    Text(title)\n  }\n}\n";

    #[test]
    fn incremental_changes_edit_the_text_they_name() {
        let uri = "file:///tmp/bloomc-lsp-sync.bloom";
        let broken = "pub view Panel() {\n  body {\n    Text(\"a\"\n  }\n}\n";
        // Close the call: insert `)` at 2:12, then rename the view over 0:9-0:14.
        let changes = r#"[{"range":{"start":{"line":2,"character":12},"end":{"line":2,"character":12}},"text":")"},{"range":{"start":{"line":0,"character":9},"end":{"line":0,"character":14}},"text":"Card"}]"#;
        let out = replies(&[
            open(uri, broken),
            format!(
                r#"{{"jsonrpc":"2.0","method":"textDocument/didChange","params":{{"textDocument":{{"uri":"{uri}","version":2}},"contentChanges":{changes}}}}}"#
            ),
            r#"{"jsonrpc":"2.0","id":7,"method":"textDocument/formatting","params":{"textDocument":{"uri":"file:///tmp/bloomc-lsp-sync.bloom"},"options":{}}}"#.into(),
        ]);
        assert!(!out[0].get("params").get("diagnostics").as_array().is_empty(), "the open call is an error");
        assert_eq!(out[1].get("params").get("diagnostics").as_array(), &[], "{:?}", out[1]);
        // Formatted already: the text is exactly the edited one.
        assert_eq!(result(&out, 7), Value::Array(Vec::new()));
        let mut text = broken.to_string();
        apply_change(&mut text, &json::parse(changes).unwrap().as_array()[0]);
        apply_change(&mut text, &json::parse(changes).unwrap().as_array()[1]);
        assert_eq!(text, "pub view Card() {\n  body {\n    Text(\"a\")\n  }\n}\n");
    }

    #[test]
    fn hover_shows_a_definitions_type() {
        let uri = "file:///tmp/bloomc-lsp-hover.bloom";
        let (text, line, column) = cursor(&PANEL.replace("Text(title)", "Text(ti|tle)"));
        let out = replies(&[open(uri, &text), request(1, "textDocument/hover", uri, line, column)]);
        let hover = result(&out, 1);
        assert_eq!(hover.get("contents").get("value").as_str(), Some("```bloom\ntitle: String\n```"));
        assert_eq!(hover.get("range").get("start").get("character"), &Value::Number(9.0));
    }

    #[test]
    fn definitions_and_references_in_the_file() {
        let uri = "file:///tmp/bloomc-lsp-definition.bloom";
        let (text, line, column) = cursor(&PANEL.replace("draft = Draft()", "draft = Dr|aft()"));
        let out = replies(&[
            open(uri, &text),
            request(1, "textDocument/definition", uri, line, column),
            request(2, "textDocument/references", uri, line, column),
        ]);
        let definition = result(&out, 1);
        assert_eq!(definition.get("uri").as_str(), Some(uri));
        // `struct Draft` is on line 5.
        assert_eq!(definition.get("range").get("start").get("line"), &Value::Number(5.0));
        assert_eq!(definition.get("range").get("start").get("character"), &Value::Number(7.0));
        let references = result(&out, 2);
        let lines: Vec<&Value> =
            references.as_array().iter().map(|l| l.get("range").get("start").get("line")).collect();
        assert_eq!(lines, [&Value::Number(5.0), &Value::Number(11.0)]);
    }

    #[test]
    fn definitions_in_other_bloom_and_ts_files() {
        let dir = std::env::temp_dir().join(format!("bloomc-lsp-files-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(
            dir.join("row.bloom"),
            "pub view Row(name: String) {\n  body {\n    Text(name)\n  }\n}\n",
        )
        .unwrap();
        std::fs::write(
            dir.join("names.ts"),
            "// names\nexport function greet(name: string): string {\n  return name;\n}\n",
        )
        .unwrap();
        let screen = "import { Row } from \"./row.bloom\"\nimport { greet } from \"./names\"\n\npub view Screen() {\n  body {\n    Row(name: gr|eet(\"a\"))\n  }\n}\n";
        let (text, line, column) = cursor(screen);
        let uri = uri_of(&dir.join("screen.bloom"));
        let out = replies(&[
            open(&uri, &text),
            request(1, "textDocument/definition", &uri, line, column),
            request(2, "textDocument/definition", &uri, line, 5),
        ]);
        assert_eq!(out[0].get("params").get("diagnostics").as_array(), &[], "{:?}", out[0]);
        let ts = result(&out, 1);
        assert_eq!(ts.get("uri").as_str(), Some(uri_of(&dir.join("names.ts")).as_str()));
        assert_eq!(ts.get("range").get("start"), &json::parse(r#"{"line":1,"character":16}"#).unwrap());
        let bloom = result(&out, 2);
        assert_eq!(bloom.get("uri").as_str(), Some(uri_of(&dir.join("row.bloom")).as_str()));
        assert_eq!(bloom.get("range").get("start"), &json::parse(r#"{"line":0,"character":9}"#).unwrap());
        std::fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn a_save_republishes_the_documents_that_import_it() {
        let dir = std::env::temp_dir().join(format!("bloomc-lsp-save-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(
            dir.join("row.bloom"),
            "pub view Row(name: String) {\n  body {\n    Text(name)\n  }\n}\n",
        )
        .unwrap();
        let screen = "import { Row } from \"./row.bloom\"\n\npub view Screen() {\n  body {\n    Row(name: \"a\")\n  }\n}\n";
        let (screen_uri, row_uri) = (uri_of(&dir.join("screen.bloom")), uri_of(&dir.join("row.bloom")));
        let saved = |uri: &str| {
            format!(
                r#"{{"jsonrpc":"2.0","method":"textDocument/didSave","params":{{"textDocument":{{"uri":"{uri}"}}}}}}"#
            )
        };
        let first = replies(&[open(&screen_uri, screen), saved(&row_uri)]);
        // Renamed on disk: the importer, analysed again, no longer finds `Row`.
        std::fs::write(
            dir.join("row.bloom"),
            "pub view Line(name: String) {\n  body {\n    Text(name)\n  }\n}\n",
        )
        .unwrap();
        let second = replies(&[open(&screen_uri, screen), saved(&row_uri), saved(&screen_uri)]);
        std::fs::remove_dir_all(&dir).unwrap();
        assert_eq!(first.len(), 2, "{first:?}");
        assert_eq!(first[1].get("params").get("uri").as_str(), Some(screen_uri.as_str()));
        assert_eq!(first[1].get("params").get("diagnostics").as_array(), &[]);
        assert!(!second[1].get("params").get("diagnostics").as_array().is_empty(), "{second:?}");
        // A save of a file nothing open imports republishes nothing.
        assert_eq!(second.len(), 2, "{second:?}");
    }

    #[test]
    fn completion_offers_the_scope_and_the_keywords() {
        let items = complete_at(&PANEL.replace("Text(title)", "Text(t|)"));
        let labels = labels(&items);
        for wanted in ["title", "draft", "Draft", "Tone", "Panel", "VStack", "match", "let"] {
            assert!(labels.contains(&wanted.to_string()), "{wanted} in {labels:?}");
        }
    }

    #[test]
    fn completion_after_a_dot_offers_fields_and_modifiers() {
        let fields = labels(&complete_at(&PANEL.replace("Text(title)", "Text(draft.|)")));
        assert!(fields.contains(&"text".to_string()) && fields.contains(&"tone".to_string()), "{fields:?}");
        let modifiers = labels(&complete_at(&PANEL.replace("Text(title)", "Text(title)\n      .|")));
        for wanted in ["padding", "font", "foreground"] {
            assert!(modifiers.contains(&wanted.to_string()), "{wanted} in {modifiers:?}");
        }
    }

    #[test]
    fn completion_offers_the_expected_enums_cases() {
        let items = complete_at(
            &PANEL.replace("@state draft = Draft()", "@state draft = Draft()\n  let tone: Tone = .|"),
        );
        assert_eq!(labels(&items), ["plain", "loud"]);
    }

    #[test]
    fn completion_inside_a_modifiers_string_offers_its_tokens() {
        let items = complete_at(&PANEL.replace("Text(title)", "Text(title).font(\"he|\")"));
        let labels = labels(&items);
        assert!(labels.contains(&"headline".to_string()), "{labels:?}");
        let headline = items.as_array().iter().find(|i| i.get("label").as_str() == Some("headline")).unwrap();
        // It replaces what is typed inside the quotes.
        let edit = headline.get("textEdit").get("range");
        assert_eq!(edit.get("start").get("character"), &Value::Number(22.0));
        assert_eq!(edit.get("end").get("character"), &Value::Number(24.0));
    }

    #[test]
    fn file_uris_are_decoded_and_encoded() {
        assert_eq!(path_of("file:///a/My%20App/x.bloom"), "/a/My App/x.bloom");
        assert_eq!(path_of("file:///C:/a/x.bloom"), "C:/a/x.bloom");
        assert_eq!(uri_of(Path::new("/a/My App/x.bloom")), "file:///a/My%20App/x.bloom");
        assert_eq!(uri_of(Path::new("C:\\a\\x.bloom")), "file:///C:/a/x.bloom");
    }
}
