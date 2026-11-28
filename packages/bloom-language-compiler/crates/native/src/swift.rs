//! `--target swiftui`: a checked Bloom program as Swift and SwiftUI. Not built in the
//! prototype (see ADR 0003, "iOS"): it reports what it would need.

use crate::{Emitted, Problem, Program};

pub fn emit(program: &Program) -> Result<Vec<Emitted>, Vec<Problem>> {
    let file =
        program.modules.first().and_then(|m| m.files.first()).map(|f| f.path.clone()).unwrap_or_default();
    Err(vec![Problem {
        file,
        span: Default::default(),
        message: "swiftui: this backend is not built in the prototype (ADR 0003)".into(),
    }])
}
