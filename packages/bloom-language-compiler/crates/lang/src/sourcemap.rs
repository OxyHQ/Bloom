use crate::diagnostic::{Diagnostic, Severity};

#[derive(Default)]
pub struct Mappings {}

impl Mappings {
    pub fn lift(
        &self,
        problem: &bloom_language_compiler::Diagnostic,
        _code: &str,
        severity: Severity,
    ) -> Diagnostic {
        let mut d = Diagnostic::error("B0500", Default::default(), problem.message.clone());
        d.severity = severity;
        d
    }
    pub fn compose(&self, map: &str, _filename: &str, _source: &str) -> String {
        map.to_string()
    }
    pub fn to_json(&self, _filename: &str, _source: &str, _code: &str) -> String {
        String::new()
    }
}
