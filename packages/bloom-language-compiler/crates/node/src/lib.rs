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
    pub css: String,
    pub changed: bool,
    pub diagnostics: Vec<Diagnostic>,
}

/// Compile one module. `platform` is `"native"` or `"web"`.
#[napi]
pub fn compile(source: String, filename: String, platform: String) -> Output {
    let platform = match platform.as_str() {
        "web" => bloom_language_compiler::Platform::Web,
        _ => bloom_language_compiler::Platform::Native,
    };
    let output = bloom_language_compiler::compile(&source, &filename, platform);
    Output {
        code: output.code,
        map: output.map,
        css: output.css,
        changed: output.changed,
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
