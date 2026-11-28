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

use std::path::Path;

pub use crate::ast::ExprId;
pub use crate::check::{
    AssignRes, AwaitRes, CallRes, CheckResult, ClosureInfo, FieldRes, Local, LocalId, LocalKind, NameRes,
    Recv, TryRes, ViewInfo,
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

/// Parses and checks `source` as [`crate::compile`] does, and returns the checked program
/// instead of emitting it.
pub fn checked(source: &str, filename: &str, options: &Options) -> Checked {
    crate::ts::next_epoch();
    crate::codable::reset();
    let (mut file, syntax) = crate::lowered(source);
    let resolution = crate::modules::prepare(&mut file, source, filename, options);
    let module_options = crate::for_module(&resolution, options);
    let options = module_options.as_ref().unwrap_or(options);
    let absolute = resolution.in_module.then(|| crate::modules::absolute(Path::new(filename)));
    let at = absolute.as_ref().map(|p| p.to_string_lossy().into_owned());
    let at = at.as_deref().unwrap_or(filename);
    let mut result = crate::check::check(&file, source, at, options);
    crate::rules(&file, source, &mut result);
    let (mut errors, mut warnings) = crate::merge(syntax, std::mem::take(&mut result.diagnostics));
    crate::resolved(resolution, &mut errors, &mut warnings, &mut result.dependencies, options);
    for diagnostic in errors.iter_mut().chain(warnings.iter_mut()) {
        crate::codable::anchor(diagnostic);
        diagnostic.render(source, filename);
    }
    Checked { lowered: file, result, diagnostics: errors, warnings }
}

/// `ty` as Bloom writes it (`[Post]`, `LoadState`, `Int?`).
pub fn display(ty: &Ty, result: &CheckResult) -> String {
    Display { ty, defs: &result.defs }.to_string()
}
