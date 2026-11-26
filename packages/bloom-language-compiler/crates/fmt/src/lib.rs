//! `bloomc fmt`: the one canonical layout of a `.bloom` file (spec section 14).
//!
//! No options: two-space indent, 100 columns, a chain that does not fit goes
//! one modifier per line, trailing commas in multi-line argument lists, at
//! most one empty line, imports sorted by path, and every comment kept.
//! Formatting is idempotent, and the formatted file parses to the same tree.

mod doc;
mod format;

pub use bloom_lang::Diagnostic;

/// The width a line is fitted to.
pub const WIDTH: usize = 100;

/// The file formatted, or its syntax errors (a file that does not parse is
/// never rewritten).
pub fn format(source: &str, filename: &str) -> Result<String, Vec<Diagnostic>> {
    let (file, comments, diagnostics) = bloom_lang::parse(source, filename);
    if !diagnostics.is_empty() {
        return Err(diagnostics);
    }
    let doc = format::Formatter::new(source, &comments).file(&file);
    let mut out = doc::print(&doc, WIDTH);
    if !out.is_empty() {
        out.push('\n');
    }
    Ok(out)
}
