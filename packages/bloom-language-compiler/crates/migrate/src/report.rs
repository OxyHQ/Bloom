//! `bloomc migrate --report`: per-file status and the refusal reasons by frequency.

use std::collections::BTreeMap;

use crate::{Migration, Status};

#[derive(Clone, Copy, PartialEq, Eq)]
enum Kind {
    Language,
    React,
    Hook,
}

impl Kind {
    fn label(self) -> &'static str {
        match self {
            Kind::Language => "language modules (views, screens, UI functions)",
            Kind::React => "React component modules (JSX, toElement)",
            Kind::Hook => "TS hook modules (no component)",
        }
    }
}

const REACT_CODES: &[&str] =
    &["component:react", "jsx:bare", "embed:to-element", "react:memo", "react:forwardRef", "jsx:host"];

fn kind_of(m: &Migration) -> Kind {
    if m.reasons.iter().any(|r| REACT_CODES.contains(&r.code.as_str())) {
        Kind::React
    } else if m.reasons.iter().any(|r| r.code == "hook:module") {
        Kind::Hook
    } else {
        Kind::Language
    }
}

/// One file's result, as the report lists it.
pub struct Entry {
    pub path: String,
    pub migration: Migration,
}

/// The report: totals, the reasons by how many files they stop, and each file.
pub fn render(entries: &[Entry]) -> String {
    let language: Vec<&Entry> = entries.iter().filter(|e| e.migration.status != Status::Skipped).collect();
    let count = |status: Status| language.iter().filter(|e| e.migration.status == status).count();
    let total = language.len();
    let pct = |n: usize| if total == 0 { 0.0 } else { n as f64 * 100.0 / total as f64 };
    let (migrated, review, refused) =
        (count(Status::Migrated), count(Status::NeedsReview), count(Status::Refused));
    let mut out = String::new();
    out.push_str(&format!("bloomc migrate: {total} embedded-language file(s)\n"));
    out.push_str(&format!("  migrated      {migrated:>5}  {:>5.1}%\n", pct(migrated)));
    out.push_str(&format!("  needs review  {review:>5}  {:>5.1}%\n", pct(review)));
    out.push_str(&format!("  refused       {refused:>5}  {:>5.1}%\n", pct(refused)));

    // What kind of module each file is: a React component module (JSX or `toElement`
    // outside an `Embed`), a TS hook module, or one written in the language throughout.
    out.push_str("\nby module kind (files: migrated / needs review / refused):\n");
    for kind in [Kind::Language, Kind::React, Kind::Hook] {
        let of_kind: Vec<&&Entry> = language.iter().filter(|e| kind_of(&e.migration) == kind).collect();
        let n = |status: Status| of_kind.iter().filter(|e| e.migration.status == status).count();
        out.push_str(&format!(
            "  {:<44} {:>4}: {} / {} / {}\n",
            kind.label(),
            of_kind.len(),
            n(Status::Migrated),
            n(Status::NeedsReview),
            n(Status::Refused)
        ));
    }

    // A reason counts once per file it stops, and by how often it occurs.
    let mut reasons: BTreeMap<&str, (usize, usize, &str)> = BTreeMap::new();
    let mut examples: BTreeMap<&str, Vec<String>> = BTreeMap::new();
    for entry in &language {
        let mut seen = Vec::new();
        for reason in &entry.migration.reasons {
            let slot = reasons.entry(&reason.code).or_insert((0, 0, &reason.detail));
            slot.1 += 1;
            if !seen.contains(&reason.code.as_str()) {
                slot.0 += 1;
                seen.push(&reason.code);
                let list = examples.entry(&reason.code).or_default();
                if list.len() < 3 {
                    list.push(format!("{}:{}", entry.path, reason.line));
                }
            }
        }
    }
    // Files stopped by exactly one reason: what fixing that reason alone would migrate.
    let mut only: BTreeMap<&str, usize> = BTreeMap::new();
    for entry in &language {
        let mut codes: Vec<&str> = entry.migration.reasons.iter().map(|r| r.code.as_str()).collect();
        codes.sort_unstable();
        codes.dedup();
        if let [code] = codes.as_slice() {
            *only.entry(code).or_default() += 1;
        }
    }
    let mut ranked: Vec<_> = reasons.into_iter().collect();
    ranked.sort_by(|a, b| b.1.0.cmp(&a.1.0).then(b.1.1.cmp(&a.1.1)).then(a.0.cmp(b.0)));
    if !ranked.is_empty() {
        out.push_str("\nrefusal reasons (files / occurrences / files with it alone; an example):\n");
        for (code, (files, occurrences, detail)) in &ranked {
            let alone = only.get(code).copied().unwrap_or(0);
            out.push_str(&format!("  {files:>5} {occurrences:>6} {alone:>5}  {code}: {detail}\n"));
            if let Some(list) = examples.get(code) {
                out.push_str(&format!("{:>21}e.g. {}\n", "", list.join(", ")));
            }
        }
    }
    out.push_str("\nfiles:\n");
    for entry in &language {
        let m = &entry.migration;
        let mut line = format!("  {:<13} {}", m.status.word(), entry.path);
        if m.reviews > 0 {
            line.push_str(&format!(" ({} review marker(s))", m.reviews));
        }
        if let Some(first) = m.reasons.first() {
            let at = if first.line > 0 { format!(":{}", first.line) } else { String::new() };
            line.push_str(&format!("{at}  {}: {}", first.code, first.detail));
            if m.reasons.len() > 1 {
                line.push_str(&format!(" (+{} more)", m.reasons.len() - 1));
            }
        }
        out.push_str(&line);
        out.push('\n');
    }
    out
}
