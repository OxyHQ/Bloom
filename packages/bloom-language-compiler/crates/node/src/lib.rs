//! Node binding for the Bloom language compiler, loaded by the Metro and Jest
//! adapters in `js/`.

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
