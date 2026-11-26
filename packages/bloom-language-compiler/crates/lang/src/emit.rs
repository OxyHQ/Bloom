use crate::Options;
use crate::ast::File;
use crate::check::CheckResult;
use crate::diagnostic::Diagnostic;
use crate::sourcemap::Mappings;

pub struct Emitted {
    pub code: String,
    pub dts: String,
    pub map: Mappings,
    pub diagnostics: Vec<Diagnostic>,
}

pub fn emit(
    _file: &File,
    _checked: &CheckResult,
    _source: &str,
    _filename: &str,
    _options: &Options,
) -> Emitted {
    Emitted { code: String::new(), dts: String::new(), map: Mappings::default(), diagnostics: Vec::new() }
}
