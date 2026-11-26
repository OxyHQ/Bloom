//! Errors with a code, a primary span, labels, a fix and a docs link,
//! rendered as the source they point at (spec section 13).

use crate::ast::Span;

pub const SPEC_DOCS: &str = "https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-lang-spec.mdx";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Severity {
    Error,
    Warning,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Label {
    pub span: Span,
    pub message: String,
}

#[derive(Debug, Clone)]
pub struct Diagnostic {
    /// `B0502`: the range says what kind (spec section 13).
    pub code: &'static str,
    pub severity: Severity,
    pub message: String,
    pub span: Span,
    /// What the caret under the primary span says.
    pub primary_label: Option<String>,
    /// Related spans.
    pub labels: Vec<Label>,
    /// The fix, as a sentence (`did you mean "md"?`).
    pub help: Option<String>,
    /// A machine-applicable edit: replace `span` with the text.
    pub fix: Option<(Span, String)>,
    pub docs: Option<String>,
    /// 1-based line and column of the primary span's start (filled by `render`).
    pub line: u32,
    pub column: u32,
    /// The diagnostic as a terminal shows it (filled by `render`).
    pub rendered: String,
}

impl Diagnostic {
    pub fn error(code: &'static str, span: Span, message: impl Into<String>) -> Self {
        Self {
            code,
            severity: Severity::Error,
            message: message.into(),
            span,
            primary_label: None,
            labels: Vec::new(),
            help: None,
            fix: None,
            docs: None,
            line: 0,
            column: 0,
            rendered: String::new(),
        }
    }

    pub fn warning(code: &'static str, span: Span, message: impl Into<String>) -> Self {
        Self { severity: Severity::Warning, ..Self::error(code, span, message) }
    }

    pub fn label(mut self, message: impl Into<String>) -> Self {
        self.primary_label = Some(message.into());
        self
    }

    pub fn with_label(mut self, span: Span, message: impl Into<String>) -> Self {
        self.labels.push(Label { span, message: message.into() });
        self
    }

    pub fn help(mut self, help: impl Into<String>) -> Self {
        self.help = Some(help.into());
        self
    }

    pub fn maybe_help(mut self, help: Option<String>) -> Self {
        if help.is_some() {
            self.help = help;
        }
        self
    }

    pub fn fix(mut self, span: Span, text: impl Into<String>) -> Self {
        self.fix = Some((span, text.into()));
        self
    }

    /// A link into the spec, by its section anchor.
    pub fn spec(mut self, anchor: &str) -> Self {
        self.docs = Some(format!("{SPEC_DOCS}#{anchor}"));
        self
    }

    pub fn docs(mut self, url: String) -> Self {
        self.docs = Some(url);
        self
    }

    /// Fills `line`, `column` and `rendered` against the file's source.
    pub fn render(&mut self, source: &str, filename: &str) {
        let (line, column) = line_column(source, self.span.start);
        self.line = line;
        self.column = column;
        let severity = match self.severity {
            Severity::Error => "error",
            Severity::Warning => "warning",
        };
        let mut lines: Vec<u32> = vec![line];
        for label in &self.labels {
            lines.push(line_column(source, label.span.start).0);
        }
        let gutter = lines.iter().max().copied().unwrap_or(1).to_string().len();
        let pad = " ".repeat(gutter);
        let mut out = format!(
            "{severity}[{}]: {}\n{pad}--> {filename}:{line}:{column}\n{pad} |\n",
            self.code, self.message
        );
        let mut snippets: Vec<(Span, char, Option<&str>)> =
            vec![(self.span, '^', self.primary_label.as_deref())];
        snippets.extend(self.labels.iter().map(|label| (label.span, '-', Some(label.message.as_str()))));
        snippets.sort_by_key(|(span, _, _)| span.start);
        let mut last_line = 0;
        for (span, mark, message) in snippets {
            let (number, column) = line_column(source, span.start);
            if last_line != 0 && number > last_line + 1 {
                out.push_str(&format!("{pad} |\n"));
            }
            let text = line_text(source, span.start);
            if number != last_line {
                out.push_str(&format!("{number:>gutter$} | {text}\n"));
            }
            last_line = number;
            let line_end = span.start as usize + (text.len() + 1).saturating_sub(column as usize);
            let width = (span.end as usize).min(line_end).saturating_sub(span.start as usize);
            let width = source[span.start as usize..span.start as usize + width].chars().count().max(1);
            let indent: String =
                text.chars().take(column as usize - 1).map(|c| if c == '\t' { '\t' } else { ' ' }).collect();
            let marks: String = std::iter::repeat_n(mark, width).collect();
            match message {
                Some(message) => out.push_str(&format!("{pad} | {indent}{marks} {message}\n")),
                None => out.push_str(&format!("{pad} | {indent}{marks}\n")),
            }
        }
        if self.help.is_some() || self.docs.is_some() {
            out.push_str(&format!("{pad} |\n"));
        }
        if let Some(help) = &self.help {
            out.push_str(&format!("help: {help}\n"));
        }
        if let Some(docs) = &self.docs {
            out.push_str(&format!("{pad} = docs: {docs}\n"));
        }
        self.rendered = out.trim_end().to_string();
    }
}

/// 1-based line and column (in characters) of `offset`.
pub fn line_column(source: &str, offset: u32) -> (u32, u32) {
    let offset = (offset as usize).min(source.len());
    let before = &source[..offset];
    let line = before.matches('\n').count() as u32 + 1;
    let line_start = before.rfind('\n').map_or(0, |i| i + 1);
    (line, source[line_start..offset].chars().count() as u32 + 1)
}

fn line_text(source: &str, offset: u32) -> &str {
    let offset = (offset as usize).min(source.len());
    let start = source[..offset].rfind('\n').map_or(0, |i| i + 1);
    let end = source[offset..].find('\n').map_or(source.len(), |i| offset + i);
    source[start..end].trim_end_matches('\r')
}

/// The closest of `candidates` to `wrong`: the same name in another case or
/// spelling, or one or two edits away (a third of its length at most).
pub fn closest<'c>(wrong: &str, candidates: impl IntoIterator<Item = &'c str>) -> Option<&'c str> {
    let folded = fold(wrong);
    let mut best: Option<(usize, &str)> = None;
    for candidate in candidates {
        if fold(candidate) == folded {
            return Some(candidate);
        }
        let distance = edit_distance(wrong, candidate);
        let limit = (wrong.chars().count().max(3) / 3).clamp(1, 3);
        if distance <= limit && best.is_none_or(|(d, _)| distance < d) {
            best = Some((distance, candidate));
        }
    }
    best.map(|(_, candidate)| candidate)
}

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
