use crate::Options;
use crate::ast::{File, Span};
use crate::diagnostic::Diagnostic;

pub struct CheckResult {
    pub diagnostics: Vec<Diagnostic>,
}

impl CheckResult {
    pub fn types(&self, _source: &str) -> Vec<(Span, String)> {
        Vec::new()
    }
}

pub fn check(_file: &File, _source: &str, _filename: &str, _options: &Options) -> CheckResult {
    CheckResult { diagnostics: Vec::new() }
}
