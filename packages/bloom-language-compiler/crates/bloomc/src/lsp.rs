//! `bloomc lsp`: a minimal language server over stdio.
//!
//! Full-text sync; on open and on every change the document is checked and its
//! diagnostics published; hover shows the type the checker found at the
//! position; formatting is `bloomc fmt`. Positions are LSP's: 0-based lines and
//! UTF-16 columns.

use std::collections::HashMap;
use std::io::{BufRead, Write};

use bloom_lang::{Diagnostic, Severity, Span};

use crate::json::{self, Value, object};

/// Serves until `exit`; true when `shutdown` came first.
pub fn serve(mut input: impl BufRead, mut output: impl Write) -> Result<bool, String> {
    let mut server = Server { documents: HashMap::new(), shut_down: false };
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

struct Server {
    documents: HashMap<String, String>,
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
        match method {
            "initialize" => vec![response(
                id,
                object([
                    (
                        "capabilities",
                        object([
                            ("textDocumentSync", 1u32.into()),
                            ("hoverProvider", true.into()),
                            ("documentFormattingProvider", true.into()),
                        ]),
                    ),
                    ("serverInfo", object([("name", "bloomc".into())])),
                ]),
            )],
            "shutdown" => {
                self.shut_down = true;
                vec![response(id, Value::Null)]
            }
            "textDocument/didOpen" => {
                let text = params.get("textDocument").get("text").as_str().unwrap_or("").to_string();
                self.documents.insert(uri.clone(), text);
                vec![self.publish(&uri)]
            }
            "textDocument/didChange" => {
                // Full sync: the last change is the whole document.
                if let Some(text) =
                    params.get("contentChanges").as_array().last().and_then(|c| c.get("text").as_str())
                {
                    self.documents.insert(uri.clone(), text.to_string());
                }
                vec![self.publish(&uri)]
            }
            "textDocument/didClose" => {
                self.documents.remove(&uri);
                vec![publish(&uri, Vec::new())]
            }
            "textDocument/hover" => vec![response(id, self.hover(&uri, params.get("position")))],
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

    fn publish(&self, uri: &str) -> Value {
        let Some(text) = self.documents.get(uri) else { return publish(uri, Vec::new()) };
        let checked = bloom_lang::check(text, &path_of(uri), &bloom_lang::Options::default());
        let diagnostics =
            checked.diagnostics.iter().chain(&checked.warnings).map(|d| diagnostic(text, d)).collect();
        publish(uri, diagnostics)
    }

    fn hover(&self, uri: &str, position: &Value) -> Value {
        let Some(text) = self.documents.get(uri) else { return Value::Null };
        let (Some(line), Some(character)) =
            (position.get("line").as_u32(), position.get("character").as_u32())
        else {
            return Value::Null;
        };
        let offset = offset_of(text, line, character);
        let checked = bloom_lang::check(text, &path_of(uri), &bloom_lang::Options::default());
        // The innermost span at the position.
        let Some((span, ty)) = checked
            .types
            .iter()
            .filter(|(span, _)| span.start <= offset && offset < span.end.max(span.start + 1))
            .min_by_key(|(span, _)| span.end - span.start)
        else {
            return Value::Null;
        };
        object([
            (
                "contents",
                object([("kind", "markdown".into()), ("value", format!("```bloom\n{ty}\n```").into())]),
            ),
            ("range", range(text, *span)),
        ])
    }

    fn formatting(&self, uri: &str) -> Value {
        let Some(text) = self.documents.get(uri) else { return Value::Null };
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

/// The path a `file://` URI names (percent-decoded); any other URI as is.
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
    String::from_utf8_lossy(&out).into_owned()
}

/// LSP's position of a byte offset.
fn position(text: &str, offset: u32) -> Value {
    let (line, character) = crate::text::position(text, offset);
    object([("line", line.into()), ("character", character.into())])
}

fn range(text: &str, span: Span) -> Value {
    object([("start", position(text, span.start)), ("end", position(text, span.end))])
}

fn offset_of(text: &str, line: u32, character: u32) -> u32 {
    crate::text::offset(text, line, character)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn frame(message: &str) -> String {
        format!("Content-Length: {}\r\n\r\n{message}", message.len())
    }

    fn replies(script: &[&str]) -> Vec<Value> {
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

    #[test]
    fn initializes_and_shuts_down() {
        let out = replies(&[
            r#"{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}"#,
            r#"{"jsonrpc":"2.0","method":"initialized","params":{}}"#,
            r#"{"jsonrpc":"2.0","id":2,"method":"textDocument/definition","params":{}}"#,
            r#"{"jsonrpc":"2.0","id":3,"method":"shutdown"}"#,
            r#"{"jsonrpc":"2.0","method":"exit"}"#,
        ]);
        assert_eq!(out.len(), 3);
        assert_eq!(out[0].get("result").get("capabilities").get("hoverProvider"), &Value::Bool(true));
        assert_eq!(out[1].get("error").get("code"), &Value::Number(-32601.0));
        assert!(out[2].get("result").is_null());
    }

    #[test]
    fn file_uris_are_decoded() {
        assert_eq!(path_of("file:///a/My%20App/x.bloom"), "/a/My App/x.bloom");
    }
}
