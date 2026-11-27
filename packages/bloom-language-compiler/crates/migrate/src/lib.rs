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
mod i18n;
mod jsx;
mod module;
mod props;
pub mod report;
mod stdlib;
mod swiftui;
mod tokens;
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
    /// The view or function the TS module exported as its default: 2.0 exports it by name,
    /// so its TS importers import it by name (`import { X as Y }`).
    pub default_export: Option<String>,
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
            default_export: None,
        };
    }
    // A relative `filename` is read from `options.root` (the props files it opens, too).
    let path = match &options.root {
        Some(root) if Path::new(filename).is_relative() => root.join(filename).to_string_lossy().into_owned(),
        _ => filename.to_string(),
    };
    let mut translated = module::translate(source, filename, &path);
    let default_export = named_default(&mut translated.text);
    let reviews = translated.text.matches(REVIEW_MARKER).count();
    if !translated.reasons.is_empty() {
        return Migration {
            status: Status::Refused,
            bloom: Some(translated.text),
            reasons: translated.reasons,
            reviews,
            dts: None,
            default_export: None,
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
                default_export: None,
            };
        }
    };
    let mut compiled = bloom_lang::compile(&formatted, &target, options);
    // JS truthiness of the conditions the codemod could not type, spelled from bloomc's types.
    let mut formatted = formatted;
    // JS members (`s.has(x)`, `m.size`) respelled from the receivers' types, the same way.
    // One kind of respelling a round: each reads the spans of the text it was compiled from.
    for _ in 0..12 {
        // Truthiness first: a value `a || b` types as `Bool` until it is spelled, and
        // what reads it (`owner?.name`) would be respelled from that.
        let spelled = truthiness::spell(
            &formatted,
            &compiled.diagnostics,
            &translated.conditions,
            &translated.defaults,
        )
        .or_else(|| typed::fix(&formatted, &compiled.diagnostics))
        .or_else(|| truthiness::fold(&formatted));
        let Some(spelled) = spelled else { break };
        let Ok(reformatted) = bloom_fmt::format(&spelled, &target) else { break };
        if reformatted == formatted {
            break;
        }
        formatted = reformatted;
        compiled = bloom_lang::compile(&formatted, &target, options);
    }
    // A renamed JS member on a `Foreign` receiver is TS's own: written back as JS wrote it.
    if compiled.diagnostics.is_empty()
        && let Some(js) = typed::foreign_js_names(&formatted, &target, options)
        && let Ok(reformatted) = bloom_fmt::format(&js, &target)
    {
        let again = bloom_lang::compile(&reformatted, &target, options);
        if again.diagnostics.is_empty() {
            formatted = reformatted;
            compiled = again;
        }
    }
    if !compiled.diagnostics.is_empty() {
        let reasons = compiled
            .diagnostics
            .iter()
            .map(|d| Reason { code: format!("bloomc:{}", d.code), detail: d.message.clone(), line: 0 })
            .collect();
        return Migration {
            status: Status::Refused,
            bloom: Some(formatted),
            reasons,
            reviews,
            dts: None,
            default_export: None,
        };
    }
    // Bloom 2.0 (ADR 0002): the checked draft printed in 2.0's forms, then compiled again. A
    // form 2.0 retires that is left (B0950) or an error of the 2.0 text is a reason: the file
    // is migrated only when it is 2.0 throughout.
    let (bloom, notes) = match bloom_fmt::migrate(&formatted, &target) {
        Ok(migrated) => migrated,
        Err(diagnostics) => {
            let reasons = diagnostics
                .iter()
                .map(|d| Reason { code: "codemod:2.0-unparsable".into(), detail: d.message.clone(), line: 0 })
                .collect();
            return Migration {
                status: Status::Refused,
                bloom: Some(formatted),
                reasons,
                reviews,
                dts: None,
                default_export: None,
            };
        }
    };
    let _ = notes;
    let compiled = bloom_lang::compile(&bloom, &target, options);
    let mut reasons: Vec<Reason> = compiled
        .diagnostics
        .iter()
        .map(|d| Reason { code: format!("2.0:bloomc:{}", d.code), detail: d.message.clone(), line: 0 })
        .collect();
    reasons.extend(compiled.warnings.iter().filter(|w| w.code == "B0950").map(|w| Reason {
        code: format!("0.x:{}", retired_form(&w.message)),
        detail: w.message.clone(),
        line: 0,
    }));
    if !reasons.is_empty() {
        return Migration {
            status: Status::Refused,
            bloom: Some(bloom),
            reasons,
            reviews,
            dts: None,
            default_export: None,
        };
    }
    // i18next's `t("k")` as `String(localized: "k")`, string tokens as typed ones (`.padding("md")` → `.padding(.md)`), then SwiftUI's names
    // (`VStack(spacing: .sm) { … }`): each kept when the file still checks.
    let mut bloom = bloom;
    let mut compiled = compiled;
    let passes: [Pass; 6] = [
        &|text| swiftui::private_items(text, &target),
        &|text| i18n::localize(text, &target),
        &|text| stdlib::globals(text, &target),
        &|text| tokens::typed(text, &target, options),
        &|text| swiftui::names(text, &target),
        &|text| swiftui::icons(text, &target),
    ];
    for pass in passes {
        let Some(next) = pass(&bloom) else { continue };
        let Ok(next) = bloom_fmt::format(&next, &target) else { continue };
        let again = bloom_lang::compile(&next, &target, options);
        if again.diagnostics.is_empty() {
            bloom = next;
            compiled = again;
        }
    }
    // The fixes after the draft may add review notes of their own.
    let reviews = bloom.matches(REVIEW_MARKER).count();
    let status = if reviews > 0 { Status::NeedsReview } else { Status::Migrated };
    Migration { status, bloom: Some(bloom), reasons: Vec::new(), reviews, dts: compiled.dts, default_export }
}

/// A default-exported view or function (`pub default view X`, or a closure `let`) as a named one: 2.0 has no
/// default exports but a route's screen or layout. Returns its name.
pub fn named_default(text: &mut String) -> Option<String> {
    for kind in ["view ", "fn ", "let "] {
        let marker = format!("pub default {kind}");
        let Some(at) = text.find(&marker) else { continue };
        let at_line = at == 0 || text.as_bytes()[at - 1] == b'\n';
        if !at_line {
            continue;
        }
        let rest = &text[at + marker.len()..];
        let name: String = rest.chars().take_while(|c| c.is_alphanumeric() || *c == '_').collect();
        text.replace_range(at..at + marker.len(), &format!("pub {kind}"));
        return Some(name);
    }
    None
}

/// A rewrite of the 2.0 text, kept when the file still checks.
type Pass<'a> = &'a dyn Fn(&str) -> Option<String>;

/// The retired form a B0950 warning names (its first backquoted word): `effect`, `@ref`, ….
fn retired_form(message: &str) -> String {
    message.split('`').nth(1).unwrap_or(message).to_string()
}
