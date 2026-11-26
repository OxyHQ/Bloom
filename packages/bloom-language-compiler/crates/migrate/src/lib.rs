//! `bloomc migrate`: an embedded-language `.tsx` module to a `.bloom` module
//! (ADR 0001, "Migration from the embedded language").
//!
//! The UI part is mechanical: chains become builders and modifiers 1:1,
//! `view()` becomes `view`, `Embed(<C … />)` becomes the component node
//! `C(…)`, `toElement` boundaries disappear, `useState` becomes `@state` and
//! its setter calls assignments, `useCallback`/`useMemo` are dropped (bloomc
//! memoises), interfaces become `struct`s and local string-literal unions
//! fieldless `enum`s. The logic part is assisted: a `try`/`catch` around one
//! await becomes `match await …` under a `// bloom: review` marker.
//!
//! Anything the codemod cannot translate keeping the same meaning is a
//! refusal with a reason, and the file stays `.tsx`: it never writes code it
//! cannot vouch for. A translation is then printed by `bloom_fmt` and compiled
//! by bloomc (`bloom_lang::compile`); a file that does not compile with 0
//! errors is refused too, with bloomc's first error as the reason.

mod comments;
mod expr;
mod jsx;
mod module;
pub mod report;
mod truthiness;
mod typed;
mod types;
mod view;

use std::path::{Path, PathBuf};

/// The marker an assisted translation leaves above what a person should read.
pub const REVIEW_MARKER: &str = "bloom: review";

/// What the codemod made of a file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Status {
    /// Translated mechanically and compiled with 0 errors.
    Migrated,
    /// Compiled with 0 errors, with assisted parts under `// bloom: review`.
    NeedsReview,
    /// Left as `.tsx`: the reasons say why.
    Refused,
    /// Not an embedded-language module (no `@oxy.so/bloom-language` import).
    Skipped,
}

impl Status {
    pub fn word(&self) -> &'static str {
        match self {
            Status::Migrated => "migrated",
            Status::NeedsReview => "needs review",
            Status::Refused => "refused",
            Status::Skipped => "skipped",
        }
    }
}

/// Why a file was refused. `code` groups reasons in the report.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Reason {
    pub code: String,
    pub detail: String,
    /// 1-based line in the `.tsx` source (0 for a compile error of the output).
    pub line: u32,
}

#[derive(Debug, Clone)]
pub struct Migration {
    pub status: Status,
    /// The `.bloom` source (formatted), when the file was translated; with a
    /// refusal, the draft as far as it went (for `--report` debugging).
    pub bloom: Option<String>,
    pub reasons: Vec<Reason>,
    /// How many `// bloom: review` markers the translation carries.
    pub reviews: usize,
    /// The module's `Name.d.bloom.ts`, when it compiled.
    pub dts: Option<String>,
}

/// The `.bloom` path a `.tsx`/`.ts` module moves to.
pub fn bloom_path(path: &Path) -> PathBuf {
    path.with_extension("bloom")
}

/// Whether `source` is written in the embedded language.
pub fn is_language_module(source: &str) -> bool {
    source.contains("'@oxy.so/bloom-language") || source.contains("\"@oxy.so/bloom-language")
}

/// Migrates one module. `filename` is the `.tsx` path (relative to
/// `options.root` or absolute); the output is compiled as its `.bloom` twin.
pub fn migrate(source: &str, filename: &str, options: &bloom_lang::Options) -> Migration {
    if !is_language_module(source) {
        return Migration {
            status: Status::Skipped,
            bloom: None,
            reasons: Vec::new(),
            reviews: 0,
            dts: None,
        };
    }
    let translated = module::translate(source, filename);
    let reviews = translated.text.matches(REVIEW_MARKER).count();
    if !translated.reasons.is_empty() {
        return Migration {
            status: Status::Refused,
            bloom: Some(translated.text),
            reasons: translated.reasons,
            reviews,
            dts: None,
        };
    }
    let target = bloom_path(Path::new(filename)).to_string_lossy().into_owned();
    let formatted = match bloom_fmt::format(&translated.text, &target) {
        Ok(formatted) => formatted,
        Err(diagnostics) => {
            // The codemod wrote something that does not parse: its own bug, reported as such.
            let reasons = diagnostics
                .iter()
                .map(|d| Reason { code: "codemod:unparsable".into(), detail: d.message.clone(), line: 0 })
                .collect();
            return Migration {
                status: Status::Refused,
                bloom: Some(translated.text),
                reasons,
                reviews,
                dts: None,
            };
        }
    };
    let mut compiled = bloom_lang::compile(&formatted, &target, options);
    // JS truthiness of the conditions the codemod could not type, spelled from bloomc's types.
    let mut formatted = formatted;
    // JS members (`s.has(x)`, `m.size`) respelled from the receivers' types, the same way.
    for _ in 0..3 {
        let spelled = truthiness::spell(&formatted, &compiled.diagnostics, &translated.conditions, &translated.defaults);
        let spelled = match spelled {
            Some(s) => typed::fix(&s, &compiled.diagnostics).or(Some(s)),
            None => typed::fix(&formatted, &compiled.diagnostics),
        };
        let Some(spelled) = spelled else { break };
        let Ok(reformatted) = bloom_fmt::format(&spelled, &target) else { break };
        if reformatted == formatted {
            break;
        }
        formatted = reformatted;
        compiled = bloom_lang::compile(&formatted, &target, options);
    }
    if !compiled.diagnostics.is_empty() {
        let reasons = compiled
            .diagnostics
            .iter()
            .map(|d| Reason { code: format!("bloomc:{}", d.code), detail: d.message.clone(), line: 0 })
            .collect();
        return Migration { status: Status::Refused, bloom: Some(formatted), reasons, reviews, dts: None };
    }
    let status = if reviews > 0 { Status::NeedsReview } else { Status::Migrated };
    Migration { status, bloom: Some(formatted), reasons: Vec::new(), reviews, dts: compiled.dts }
}
