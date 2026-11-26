//! Node binding for the Bloom language compiler, loaded by the Metro and Jest
//! adapters in `js/`: `compile` (the embedded language's pass over a TS
//! module) and the `.bloom` compiler's `compileBloom`, `checkBloom` and
//! `formatBloom`.

use napi_derive::napi;

#[napi(object)]
pub struct Diagnostic {
    pub message: String,
    pub help: Option<String>,
    /// Links to the docs that explain it, the most precise first.
    pub docs: Vec<String>,
    pub line: u32,
    pub column: u32,
    pub rendered: String,
}

#[napi(object)]
pub struct Output {
    pub code: String,
    pub map: Option<String>,
    pub changed: bool,
    pub hoisted: u32,
    pub diagnostics: Vec<Diagnostic>,
    pub warnings: Vec<Diagnostic>,
}

/// Compile one module. The output is the same on every platform.
#[napi]
pub fn compile(source: String, filename: String) -> Output {
    let output = bloom_language_compiler::compile(&source, &filename);
    let convert = |diagnostics: Vec<bloom_language_compiler::Diagnostic>| -> Vec<Diagnostic> {
        diagnostics
            .into_iter()
            .map(|d| Diagnostic {
                message: d.message,
                help: d.help,
                docs: d.docs,
                line: d.line,
                column: d.column,
                rendered: d.rendered,
            })
            .collect()
    };
    Output {
        code: output.code,
        map: output.map,
        changed: output.changed,
        hoisted: output.hoisted,
        diagnostics: convert(output.diagnostics),
        warnings: convert(output.warnings),
    }
}

/// Every docs link a diagnostic can carry: what the docs check holds to a heading.
#[napi]
pub fn doc_links() -> Vec<String> {
    bloom_language_compiler::doc_links()
}

/// A `.bloom` diagnostic: its code (`B0502`), where it is (1-based line and
/// column, and the byte span), and how a terminal shows it.
#[napi(object)]
pub struct BloomDiagnostic {
    pub code: String,
    pub message: String,
    pub help: Option<String>,
    /// The docs that explain it (empty or one link).
    pub docs: Vec<String>,
    pub line: u32,
    pub column: u32,
    pub start: u32,
    pub end: u32,
    pub rendered: String,
}

fn bloom_diagnostics(diagnostics: Vec<bloom_lang::Diagnostic>) -> Vec<BloomDiagnostic> {
    diagnostics
        .into_iter()
        .map(|d| BloomDiagnostic {
            code: d.code.to_string(),
            message: d.message,
            help: d.help,
            docs: d.docs.into_iter().collect(),
            line: d.line,
            column: d.column,
            start: d.span.start,
            end: d.span.end,
            rendered: d.rendered,
        })
        .collect()
}

/// What a `.bloom` compile reads from its host.
#[napi(object)]
pub struct BloomOptions {
    /// The project root, where `paths` targets and `node_modules` are looked up.
    pub root: Option<String>,
    /// TypeScript `paths`: a pattern (`@/*`) to its targets, relative to `root`.
    pub paths: Option<std::collections::HashMap<String, Vec<String>>>,
    /// A development build.
    pub dev: Option<bool>,
    /// The app's Expo Router folder, relative to `root` (default: `app/` or `src/app/`).
    pub app: Option<String>,
}

fn lang_options(options: Option<BloomOptions>) -> bloom_lang::Options {
    let Some(options) = options else { return bloom_lang::Options::default() };
    bloom_lang::Options {
        root: options.root.map(Into::into),
        paths: options.paths.unwrap_or_default().into_iter().collect(),
        dev: options.dev.unwrap_or(false),
        app: options.app.map(Into::into),
    }
}

#[napi(object)]
pub struct BloomOutput {
    /// The TypeScript module (empty when there are errors).
    pub code: String,
    /// Source map (JSON) from `code` back to the `.bloom` file.
    pub map: Option<String>,
    /// The text of `Name.d.bloom.ts`.
    pub dts: Option<String>,
    pub diagnostics: Vec<BloomDiagnostic>,
    pub warnings: Vec<BloomDiagnostic>,
}

/// Compile one `.bloom` module to TypeScript (the embedded pass included).
#[napi]
pub fn compile_bloom(source: String, filename: String, options: Option<BloomOptions>) -> BloomOutput {
    let output = bloom_lang::compile(&source, &filename, &lang_options(options));
    BloomOutput {
        code: output.code,
        map: output.map,
        dts: output.dts,
        diagnostics: bloom_diagnostics(output.diagnostics),
        warnings: bloom_diagnostics(output.warnings),
    }
}

/// A type the checker found: its byte span and the type as Bloom writes it.
#[napi(object)]
pub struct BloomType {
    pub start: u32,
    pub end: u32,
    #[napi(js_name = "type")]
    pub ty: String,
}

#[napi(object)]
pub struct BloomChecked {
    pub types: Vec<BloomType>,
    pub diagnostics: Vec<BloomDiagnostic>,
    pub warnings: Vec<BloomDiagnostic>,
}

/// Parse and type-check one `.bloom` module, without emitting.
#[napi]
pub fn check_bloom(source: String, filename: String, options: Option<BloomOptions>) -> BloomChecked {
    let checked = bloom_lang::check(&source, &filename, &lang_options(options));
    BloomChecked {
        types: checked
            .types
            .into_iter()
            .map(|(span, ty)| BloomType { start: span.start, end: span.end, ty })
            .collect(),
        diagnostics: bloom_diagnostics(checked.diagnostics),
        warnings: bloom_diagnostics(checked.warnings),
    }
}

#[napi(object)]
pub struct BloomFormatted {
    /// The formatted file, or nothing when it does not parse.
    pub code: Option<String>,
    pub diagnostics: Vec<BloomDiagnostic>,
}

/// Format one `.bloom` file (`bloomc fmt`'s layout).
#[napi]
pub fn format_bloom(source: String, filename: String) -> BloomFormatted {
    match bloom_fmt::format(&source, &filename) {
        Ok(code) => BloomFormatted { code: Some(code), diagnostics: Vec::new() },
        Err(diagnostics) => BloomFormatted { code: None, diagnostics: bloom_diagnostics(diagnostics) },
    }
}
