//! Compile errors that read like the source they point at.

use oxc_span::Span;

use crate::docs::Doc;

/// An error fails the build; a warning is reported and the build goes on.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Severity {
    Error,
    Warning,
}

#[derive(Debug, Clone)]
pub struct Diagnostic {
    pub severity: Severity,
    pub message: String,
    pub help: Option<String>,
    /// Links to the docs that explain it, the most precise first.
    pub docs: Vec<String>,
    /// 1-based line and column of the offending span's start.
    pub line: u32,
    pub column: u32,
    /// The message, file position, source line, a caret under the span, the
    /// help and a `= docs:` line per link.
    pub rendered: String,
}

impl Diagnostic {
    pub fn with_severity(
        severity: Severity,
        source: &str,
        filename: &str,
        span: Span,
        message: String,
        help: Option<String>,
        docs: &[Doc],
    ) -> Self {
        let start = span.start as usize;
        let line_start = source[..start].rfind('\n').map_or(0, |i| i + 1);
        let line_end = source[start..].find('\n').map_or(source.len(), |i| start + i);
        let line = source[..start].matches('\n').count() as u32 + 1;
        let column = source[line_start..start].chars().count() as u32 + 1;
        let text = &source[line_start..line_end];
        let width = (span.end as usize).min(line_end).saturating_sub(start).max(1);

        let gutter = line.to_string().len();
        let pad = " ".repeat(gutter);
        let label = match severity {
            Severity::Error => "error",
            Severity::Warning => "warning",
        };
        let mut rendered = format!(
            "{label}[bloom]: {message}\n{pad}--> {filename}:{line}:{column}\n{pad} |\n{line} | {text}\n{pad} | {}{}",
            " ".repeat(column as usize - 1),
            "^".repeat(width),
        );
        if let Some(help) = &help {
            rendered.push_str(&format!("\n{pad} = help: {help}"));
        }
        let docs: Vec<String> = docs.iter().map(|doc| doc.url()).collect();
        for url in &docs {
            rendered.push_str(&format!("\n{pad} = docs: {url}"));
        }
        Self { severity, message, help, docs, line, column, rendered }
    }
}

/// `did you mean 'md'?` for a name one or two edits away from a real one, or
/// the same name in another case or spelling (`largeTitle` for `large-title`,
/// `childspacing` for `childSpacing`).
pub fn suggest(wrong: &str, candidates: &[&str]) -> Option<String> {
    let folded = fold(wrong);
    candidates
        .iter()
        .find(|candidate| fold(candidate) == folded)
        .or_else(|| {
            candidates
                .iter()
                .map(|candidate| (edit_distance(wrong, candidate), candidate))
                .filter(|(distance, _)| *distance <= 2)
                .min_by_key(|(distance, _)| *distance)
                .map(|(_, candidate)| candidate)
        })
        .map(|candidate| format!("did you mean '{candidate}'?"))
}

/// A name with case, `-` and `_` left out: camelCase, kebab-case and
/// snake_case spellings of one name fold to the same text.
fn fold(name: &str) -> String {
    name.chars().filter(|c| *c != '-' && *c != '_').flat_map(char::to_lowercase).collect()
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
