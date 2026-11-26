//! The map from the emitted TypeScript back to the `.bloom` source.

use oxc_sourcemap::SourceMapBuilder;

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

impl Mappings {
    /// The map as JSON (v3).
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
}
