//! The map from the emitted TypeScript back to the `.bloom` source, and its
//! composition with the embedded pass's map, so the final code maps to `.bloom`.

use oxc_sourcemap::{SourceMap, SourceMapBuilder};

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
        let mut builder = SourceMapBuilder::default();
        let id = builder.add_source_and_content(filename, source);
        for (generated, original) in &self.points {
            let (dst_line, dst_col) = position(code, &code_starts, *generated);
            let (src_line, src_col) = position(source, &source_starts, *original);
            builder.add_token(dst_line, dst_col, src_line, src_col, Some(id), None);
        }
        builder.into_sourcemap().to_json_string()
    }

    /// `embedded` maps the final code to the emitted TS; the result maps it to `.bloom`.
    pub fn compose(&self, embedded: &str, emitted: &str, filename: &str, source: &str) -> String {
        let Ok(map) = SourceMap::from_json_string(embedded) else {
            return self.to_json(filename, source, emitted);
        };
        let emitted_starts = line_starts(emitted);
        let source_starts = line_starts(source);
        let mut builder = SourceMapBuilder::default();
        let id = builder.add_source_and_content(filename, source);
        for token in map.get_tokens() {
            let at = offset(emitted, &emitted_starts, token.get_src_line(), token.get_src_col());
            if let Some(original) = self.source_of(at) {
                let (src_line, src_col) = position(source, &source_starts, original);
                builder.add_token(
                    token.get_dst_line(),
                    token.get_dst_col(),
                    src_line,
                    src_col,
                    Some(id),
                    None,
                );
            }
        }
        builder.into_sourcemap().to_json_string()
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
