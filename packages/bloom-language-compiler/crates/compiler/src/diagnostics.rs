//! Compile errors that read like the source they point at.

use oxc_span::Span;

#[derive(Debug, Clone)]
pub struct Diagnostic {
    pub message: String,
    pub help: Option<String>,
    /// 1-based line and column of the offending span's start.
    pub line: u32,
    pub column: u32,
    /// The message, file position, source line, a caret under the span and the help.
    pub rendered: String,
}

impl Diagnostic {
    pub fn new(source: &str, filename: &str, span: Span, message: String, help: Option<String>) -> Self {
        let start = span.start as usize;
        let line_start = source[..start].rfind('\n').map_or(0, |i| i + 1);
        let line_end = source[start..].find('\n').map_or(source.len(), |i| start + i);
        let line = source[..start].matches('\n').count() as u32 + 1;
        let column = source[line_start..start].chars().count() as u32 + 1;
        let text = &source[line_start..line_end];
        let width = (span.end as usize).min(line_end).saturating_sub(start).max(1);

        let gutter = line.to_string().len();
        let pad = " ".repeat(gutter);
        let mut rendered = format!(
            "error[bloom]: {message}\n{pad}--> {filename}:{line}:{column}\n{pad} |\n{line} | {text}\n{pad} | {}{}",
            " ".repeat(column as usize - 1),
            "^".repeat(width),
        );
        if let Some(help) = &help {
            rendered.push_str(&format!("\n{pad} = help: {help}"));
        }
        Self { message, help, line, column, rendered }
    }
}

/// `did you mean 'md'?` for a token one or two edits away from a real one.
pub fn suggest(wrong: &str, candidates: &[&str]) -> Option<String> {
    candidates
        .iter()
        .map(|candidate| (edit_distance(wrong, candidate), *candidate))
        .filter(|(distance, _)| *distance <= 2)
        .min_by_key(|(distance, _)| *distance)
        .map(|(_, candidate)| format!("did you mean '{candidate}'?"))
}

fn edit_distance(a: &str, b: &str) -> usize {
    let b: Vec<char> = b.chars().collect();
    let mut row: Vec<usize> = (0..=b.len()).collect();
    for (i, ca) in a.chars().enumerate() {
        let mut previous = row[0];
        row[0] = i + 1;
        for (j, cb) in b.iter().enumerate() {
            let substitution = previous + usize::from(ca != *cb);
            previous = row[j + 1];
            row[j + 1] = substitution.min(row[j] + 1).min(row[j + 1] + 1);
        }
    }
    row[b.len()]
}
