//! Golden tests: every `fixtures/{synthetic,mention}/*.tsx` migrates to its
//! `.bloom.snap` (the `.bloom` it compiles to, or the refusal and its
//! reasons). The `mention` fixtures are copies of Mention modules, with stub
//! declarations for what they import. `BLOOM_BLESS=1 cargo test -p bloom_migrate`
//! rewrites the snapshots.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use bloom_migrate::{Status, migrate};

fn fixtures() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures")
}

fn options() -> bloom_lang::Options {
    let paths: BTreeMap<String, Vec<String>> = [
        ("@/*", "stubs/frontend/*"),
        ("react-i18next", "stubs/react-i18next.d.ts"),
        ("react-native", "stubs/react-native.d.ts"),
        ("expo-router", "stubs/expo-router.d.ts"),
        ("@mention/shared-types", "stubs/shared-types.d.ts"),
        ("@oxy.so/bloom/icons/*", "stubs/icon.d.ts"),
    ]
    .into_iter()
    .map(|(k, v)| (k.to_string(), vec![v.to_string()]))
    .collect();
    bloom_lang::Options { root: Some(fixtures()), paths, dev: false, ..Default::default() }
}

/// What a fixture's snapshot holds: the `.bloom`, or the status and its reasons.
fn render(m: &bloom_migrate::Migration) -> String {
    match m.status {
        Status::Migrated | Status::NeedsReview => m.bloom.clone().unwrap_or_default(),
        _ => {
            let mut out = format!("{}\n", m.status.word());
            for r in &m.reasons {
                out.push_str(&format!("{}: {}: {}\n", r.line, r.code, r.detail));
            }
            out
        }
    }
}

#[test]
fn golden() {
    let bless = std::env::var_os("BLOOM_BLESS").is_some();
    let mut failures = Vec::new();
    let mut count = 0;
    for dir in ["synthetic", "mention"] {
        let mut files: Vec<PathBuf> = std::fs::read_dir(fixtures().join(dir))
            .expect("the fixtures")
            .map(|e| e.expect("an entry").path())
            .filter(|p| p.extension().is_some_and(|e| e == "tsx"))
            .collect();
        files.sort();
        for path in files {
            count += 1;
            let source = std::fs::read_to_string(&path).expect("the fixture");
            let name = format!("{dir}/{}", path.file_name().expect("a name").to_string_lossy());
            let actual = render(&migrate(&source, &name, &options()));
            let snap = path.with_extension("bloom.snap");
            if bless {
                std::fs::write(&snap, &actual).expect("write the snapshot");
                continue;
            }
            let expected = std::fs::read_to_string(&snap).unwrap_or_default();
            if expected != actual {
                failures.push(format!("{name}:\n--- expected\n{expected}\n--- actual\n{actual}"));
            }
        }
    }
    assert!(count > 0, "no fixtures");
    assert!(failures.is_empty(), "{}", failures.join("\n\n"));
}

/// A migrated fixture's `.bloom` is formatted: `bloomc fmt` leaves it alone.
#[test]
fn output_is_formatted() {
    for dir in ["synthetic", "mention"] {
        for entry in std::fs::read_dir(fixtures().join(dir)).expect("the fixtures") {
            let path = entry.expect("an entry").path();
            if path.extension().is_none_or(|e| e != "tsx") {
                continue;
            }
            let source = std::fs::read_to_string(&path).expect("the fixture");
            let name = format!("{dir}/{}", path.file_name().expect("a name").to_string_lossy());
            let m = migrate(&source, &name, &options());
            if let (Status::Migrated | Status::NeedsReview, Some(bloom)) = (&m.status, &m.bloom) {
                let again = bloom_fmt::format(bloom, "x.bloom").expect("it parses");
                assert_eq!(&again, bloom, "{name} is not formatted");
            }
        }
    }
}

/// A file outside the embedded language is skipped, not refused.
#[test]
fn skips_plain_typescript() {
    let m = migrate("export const x = 1;\n", "x.ts", &options());
    assert_eq!(m.status, Status::Skipped);
}
