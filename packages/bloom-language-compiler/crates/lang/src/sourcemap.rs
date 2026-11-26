//! The map from the emitted TypeScript back to the `.bloom` source, and its
//! composition with the embedded pass's map, so the final code maps to `.bloom`.

use oxc_sourcemap::SourceMap;

use crate::ast::Span;
use crate::diagnostic::{Diagnostic, Severity, line_column};

/// (offset in the emitted TS, offset in the `.bloom` source), by emitted offset.
#[derive(Debug, Default, Clone)]
pub struct Mappings {
    pub points: Vec<(u32, u32)>,
}

/// Each line's start offset, and whether the line is ASCII (its UTF-16 columns are its bytes).
struct Lines {
    starts: Vec<u32>,
    ascii: Vec<bool>,
}

fn line_starts(text: &str) -> Lines {
    let starts: Vec<u32> =
        std::iter::once(0).chain(text.match_indices('\n').map(|(i, _)| i as u32 + 1)).collect();
    let ascii = starts
        .iter()
        .enumerate()
        .map(|(i, start)| {
            let end = starts.get(i + 1).map_or(text.len(), |e| *e as usize);
            text.as_bytes()[*start as usize..end].is_ascii()
        })
        .collect();
    Lines { starts, ascii }
}

/// 0-based (line, UTF-16 column) of `offset`, as source maps count.
fn position(text: &str, lines: &Lines, offset: u32) -> (u32, u32) {
    let line = lines.starts.partition_point(|s| *s <= offset).saturating_sub(1);
    let start = lines.starts[line];
    if lines.ascii[line] {
        return (line as u32, offset.min(text.len() as u32) - start);
    }
    let end = (offset as usize).min(text.len());
    let column = text.get(start as usize..end).map_or(0, |t| t.encode_utf16().count());
    (line as u32, column as u32)
}

/// The offset of 0-based (line, UTF-16 column).
fn offset(text: &str, lines: &Lines, line: u32, column: u32) -> u32 {
    let Some(start) = lines.starts.get(line as usize).copied() else { return text.len() as u32 };
    if lines.ascii[line as usize] {
        let end = lines.starts.get(line as usize + 1).map_or(text.len() as u32, |e| *e);
        return (start + column).min(end);
    }
    let mut units = 0;
    for (index, ch) in text[start as usize..].char_indices() {
        if units >= column || ch == '\n' {
            return start + index as u32;
        }
        units += ch.len_utf16() as u32;
    }
    text.len() as u32
}

impl Mappings {
    /// The `.bloom` offset the emitted offset came from: the nearest mark at or before it.
    fn source_of(&self, emitted: u32) -> Option<u32> {
        let at = self.points.partition_point(|(g, _)| *g <= emitted);
        at.checked_sub(1).map(|i| self.points[i].1)
    }

    pub fn to_json(&self, filename: &str, source: &str, code: &str) -> String {
        let code_starts = line_starts(code);
        let source_starts = line_starts(source);
        let tokens = self.points.iter().map(|(generated, original)| {
            let (dst_line, dst_col) = position(code, &code_starts, *generated);
            let (src_line, src_col) = position(source, &source_starts, *original);
            (dst_line, dst_col, src_line, src_col)
        });
        write_map(filename, source, tokens)
    }

    /// `embedded` maps the final code to the emitted TS; the result maps it to `.bloom`.
    pub fn compose(&self, embedded: &str, emitted: &str, filename: &str, source: &str) -> String {
        let Ok(map) = SourceMap::from_json_string(embedded) else {
            return self.to_json(filename, source, emitted);
        };
        let emitted_starts = line_starts(emitted);
        let source_starts = line_starts(source);
        let tokens: Vec<(u32, u32, u32, u32)> = map
            .get_tokens()
            .filter_map(|token| {
                let at = offset(emitted, &emitted_starts, token.get_src_line(), token.get_src_col());
                let original = self.source_of(at)?;
                let (src_line, src_col) = position(source, &source_starts, original);
                Some((token.get_dst_line(), token.get_dst_col(), src_line, src_col))
            })
            .collect();
        write_map(filename, source, tokens.into_iter())
    }

    /// A diagnostic of the embedded pass (on the emitted TS), at the `.bloom` span that wrote it.
    pub fn lift(
        &self,
        problem: &bloom_language_compiler::Diagnostic,
        emitted: &str,
        source: &str,
        severity: Severity,
    ) -> Diagnostic {
        let starts = line_starts(emitted);
        let at = offset(emitted, &starts, problem.line.saturating_sub(1), problem.column.saturating_sub(1));
        let original = self.source_of(at).unwrap_or(0);
        let end = source[original as usize..]
            .find(['\n', ')'])
            .map_or(source.len(), |i| original as usize + i + 1) as u32;
        let mut diagnostic =
            Diagnostic::error("B0500", Span::new(original, end.max(original + 1)), problem.message.clone())
                .maybe_help(problem.help.clone());
        if let Some(url) = problem.docs.first() {
            diagnostic = diagnostic.docs(url.clone());
        }
        diagnostic.severity = severity;
        let _ = line_column(source, original);
        diagnostic
    }
}

/// A v3 source map of one source, its tokens (generated line and column,
/// source line and column) in generated order, written here rather than by
/// `oxc_sourcemap`: its JSON escaping (`escape-simd` 0.1.1's AVX2 path) reads
/// past the end of a short string (`tests/sourcemap.rs`).
fn write_map(filename: &str, source: &str, tokens: impl Iterator<Item = (u32, u32, u32, u32)>) -> String {
    let mut mappings = String::new();
    let (mut line, mut col, mut src_line, mut src_col) = (0u32, 0i64, 0i64, 0i64);
    let mut first = true;
    for (dst_line, dst_col, s_line, s_col) in tokens {
        while line < dst_line {
            mappings.push(';');
            line += 1;
            col = 0;
            first = true;
        }
        if !first {
            mappings.push(',');
        }
        first = false;
        for delta in [dst_col as i64 - col, 0, s_line as i64 - src_line, s_col as i64 - src_col] {
            vlq(&mut mappings, delta);
        }
        (col, src_line, src_col) = (dst_col as i64, s_line as i64, s_col as i64);
    }
    format!(
        "{{\"version\":3,\"sources\":[{}],\"sourcesContent\":[{}],\"names\":[],\"mappings\":\"{mappings}\"}}",
        json_string(filename),
        json_string(source)
    )
}

/// One base64 VLQ value.
fn vlq(out: &mut String, value: i64) {
    const DIGITS: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut rest = if value < 0 { ((-value) << 1) | 1 } else { value << 1 } as u64;
    loop {
        let mut digit = rest & 31;
        rest >>= 5;
        if rest > 0 {
            digit |= 32;
        }
        out.push(DIGITS[digit as usize] as char);
        if rest == 0 {
            break;
        }
    }
}

fn json_string(text: &str) -> String {
    let mut out = String::with_capacity(text.len() + 2);
    out.push('"');
    for c in text.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 || c == '\u{2028}' || c == '\u{2029}' => {
                out.push_str(&format!("\\u{:04x}", c as u32))
            }
            c => out.push(c),
        }
    }
    out.push('"');
    out
}
