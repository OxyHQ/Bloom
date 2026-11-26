//! bloomc's core: the `.bloom` language front end and its emitter.
//!
//! `.bloom` source is lexed and parsed ([`parse`]) into a lossless tree
//! ([`ast`], comments in [`ast::Comments`]), resolved and type-checked
//! ([`check`]), and emitted as typed TypeScript that calls the embedded
//! language (`@oxy.so/bloom-language`). The embedded language's own pass
//! (`bloom_language_compiler::compile`) then runs on that TypeScript in the
//! same process, hoisting static chains, and the two source maps are composed
//! back to the `.bloom` file ([`compile`]).

pub mod ast;
mod check;
pub mod diagnostic;
mod emit;
mod lexer;
mod parser;
mod sourcemap;
mod ts;
mod types;
mod ui;

use std::collections::BTreeMap;
use std::path::PathBuf;

pub use ast::{Comments, File as Ast, Span};
pub use diagnostic::{Diagnostic, Label, Severity};

/// What a compile needs from its host. Small on purpose.
#[derive(Debug, Clone, Default)]
pub struct Options {
    /// The project root: where `paths` targets and `node_modules` are looked up.
    pub root: Option<PathBuf>,
    /// TypeScript `paths`: a pattern (`@/*`) to its targets (`packages/frontend/*`),
    /// relative to `root`.
    pub paths: BTreeMap<String, Vec<String>>,
    /// A development build: lists are frozen in dev (spec 4.1), and names are kept readable.
    pub dev: bool,
}

/// A compiled `.bloom` module.
#[derive(Debug, Clone)]
pub struct Output {
    /// The TypeScript module (empty when there are errors).
    pub code: String,
    /// Source map (JSON, v3) from `code` back to the `.bloom` source.
    pub map: Option<String>,
    /// The text of `Name.d.bloom.ts`: what TypeScript importers see.
    pub dts: Option<String>,
    /// Errors: the module does not compile.
    pub diagnostics: Vec<Diagnostic>,
    /// Warnings: reported, and the module compiles.
    pub warnings: Vec<Diagnostic>,
}

/// The types the checker found, by span (for hover), and its diagnostics.
#[derive(Debug, Clone, Default)]
pub struct Checked {
    /// Each expression's and binding's span with its type, as Bloom writes it.
    pub types: Vec<(Span, String)>,
    pub diagnostics: Vec<Diagnostic>,
    pub warnings: Vec<Diagnostic>,
}

/// Parses `source`: the tree, the comments and the syntax errors (rendered).
/// Parsing recovers at item, statement and closing-brace boundaries, so the
/// tree is complete even with errors (unreadable parts are `ExprKind::Error`).
pub fn parse(source: &str, filename: &str) -> (Ast, Comments, Vec<Diagnostic>) {
    let (file, comments, mut diagnostics) = parser::parse(source);
    for diagnostic in &mut diagnostics {
        diagnostic.render(source, filename);
    }
    (file, comments, diagnostics)
}

/// Parses and checks `source`, without emitting.
pub fn check(source: &str, filename: &str, options: &Options) -> Checked {
    let (file, _, syntax) = parser::parse(source);
    let mut result = check::check(&file, source, filename, options);
    let (mut errors, mut warnings) = merge(syntax, std::mem::take(&mut result.diagnostics));
    for diagnostic in errors.iter_mut().chain(warnings.iter_mut()) {
        diagnostic.render(source, filename);
    }
    Checked { types: result.types(source), diagnostics: errors, warnings }
}

/// Compiles one `.bloom` module to TypeScript.
pub fn compile(source: &str, filename: &str, options: &Options) -> Output {
    let (file, _, syntax) = parser::parse(source);
    let mut checked = check::check(&file, source, filename, options);
    let (mut errors, mut warnings) = merge(syntax, std::mem::take(&mut checked.diagnostics));
    let mut output =
        Output { code: String::new(), map: None, dts: None, diagnostics: Vec::new(), warnings: Vec::new() };
    if errors.is_empty() {
        let emitted = emit::emit(&file, &checked, source, filename, options);
        errors.extend(emitted.diagnostics);
        if errors.is_empty() {
            let embedded = bloom_language_compiler::compile(&emitted.code, &ts_filename(filename));
            // The embedded pass checks every chain again; anything it finds is
            // reported at the `.bloom` span that wrote the chain.
            for problem in embedded.diagnostics {
                errors.push(emitted.map.lift(&problem, &emitted.code, source, Severity::Error));
            }
            for problem in embedded.warnings {
                warnings.push(emitted.map.lift(&problem, &emitted.code, source, Severity::Warning));
            }
            if errors.is_empty() {
                let (code, map) = if embedded.changed {
                    let map = embedded
                        .map
                        .as_deref()
                        .map(|map| emitted.map.compose(map, &emitted.code, filename, source));
                    (embedded.code, map)
                } else {
                    let map = emitted.map.to_json(filename, source, &emitted.code);
                    (emitted.code, Some(map))
                };
                output.code = code;
                output.map = map;
                output.dts = Some(emitted.dts);
            }
        }
    }
    for diagnostic in errors.iter_mut().chain(warnings.iter_mut()) {
        if diagnostic.rendered.is_empty() {
            diagnostic.render(source, filename);
        }
    }
    output.diagnostics = errors;
    output.warnings = warnings;
    output
}

/// Syntax errors and the checker's findings, as errors and warnings. With a
/// syntax error the checker's errors are left out: they would be about the
/// parser's recovery, and one typo is one error.
fn merge(syntax: Vec<Diagnostic>, checked: Vec<Diagnostic>) -> (Vec<Diagnostic>, Vec<Diagnostic>) {
    let has_syntax = !syntax.is_empty();
    let (errors, warnings): (Vec<_>, Vec<_>) =
        checked.into_iter().partition(|d| d.severity == Severity::Error);
    if has_syntax { (syntax, warnings) } else { (errors, warnings) }
}

/// The emitted module's name, for the embedded pass: `x.bloom` is `x.bloom.ts`.
fn ts_filename(filename: &str) -> String {
    format!("{filename}.ts")
}
