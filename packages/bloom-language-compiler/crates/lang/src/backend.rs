//! The checked program, for the native backends (ADR 0003).
//!
//! The TypeScript emitter reads two things: the tree the checker checked (with 2.0's type
//! members lowered, `extensions`) and the checker's side tables keyed by [`ExprId`]
//! (`CheckResult`: each expression's [`Ty`], what each call, field, name, `await` and `try`
//! resolved to, the definitions, the locals). That pair is Bloom's checked IR. This module
//! hands the same pair to another backend, read-only, without emitting TypeScript, so the
//! Kotlin and Swift backends consume exactly what the TypeScript one does.
//!
//! Additive: nothing here changes what the checker computes or what `compile` emits.
//!
//! The parser's expression ids survive the lowering (it adds its own nodes past
//! `u32::MAX / 2`), so a backend may walk the tree as the parser wrote it (`parse`, the 2.0
//! surface) and look each parser-made expression up in `result`.

pub use crate::ast::ExprId;
pub use crate::check::{
    AssignRes, AwaitRes, Bound, CallRes, CheckResult, ClosureInfo, Conformance, FieldRes, Local, LocalId,
    LocalKind, NameRes, Recv, TryRes, ViewInfo, WitnessArg, Witnessed,
};
pub use crate::extensions::{demangle, mangle};
pub use crate::types::{
    ClassDef, Def, DefId, DefKind, Display, FieldDef, FnTy, Origin, ParamTy, RequirementDef, StrSet, Ty,
    VariantDef,
};
use crate::{Ast, Diagnostic, Options};

/// A `.bloom` file, checked: the tree as the checker saw it, and what it found.
pub struct Checked {
    /// The tree the checker checked: the parser's, with 2.0 type members lowered.
    pub lowered: Ast,
    /// The checker's side tables, keyed by the tree's expression ids.
    pub result: CheckResult,
    /// Errors (syntax, resolution, type): a backend emits nothing when there is one.
    pub diagnostics: Vec<Diagnostic>,
    pub warnings: Vec<Diagnostic>,
}

/// Parses and checks `source` as [`crate::compile`] does (the same front end,
/// `crate::check_source`), and returns the checked program instead of emitting it.
pub fn checked(source: &str, filename: &str, options: &Options) -> Checked {
    let crate::Front { file, checked, mut errors, mut warnings, .. } =
        crate::check_source(source, filename, options, true);
    crate::render_all(&mut errors, &mut warnings, source, filename);
    Checked { lowered: file, result: checked, diagnostics: errors, warnings }
}

/// `ty` as Bloom writes it (`[Post]`, `LoadState`, `Int?`).
pub fn display(ty: &Ty, result: &CheckResult) -> String {
    Display { ty, defs: &result.defs }.to_string()
}
