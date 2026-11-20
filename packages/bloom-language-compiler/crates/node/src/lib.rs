//! Node binding for the Bloom language compiler, loaded by the Metro and Jest
//! adapters in `js/`.

use napi_derive::napi;

#[napi(object)]
pub struct Diagnostic {
    pub message: String,
    pub help: Option<String>,
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
}

/// Compile one module. The output is the same on every platform.
#[napi]
pub fn compile(source: String, filename: String) -> Output {
    let output = bloom_language_compiler::compile(&source, &filename);
    Output {
        code: output.code,
        map: output.map,
        changed: output.changed,
        hoisted: output.hoisted,
        diagnostics: output
            .diagnostics
            .into_iter()
            .map(|d| Diagnostic {
                message: d.message,
                help: d.help,
                line: d.line,
                column: d.column,
                rendered: d.rendered,
            })
            .collect(),
    }
}
