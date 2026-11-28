//! The Swift backend's golden tests, one per construct: `tests/golden-swift/<case>.bloom` is
//! checked as the only file of a module named after it (`surface_models` is `SurfaceModels`),
//! emitted with `--target swiftui`, and compared with `tests/golden-swift/<case>.swift`.
//! `BLESS=1 cargo test -p bloom_native --test golden_swift` rewrites the expectations; review
//! the diff like any other change. `scripts/typecheck-swift.sh` type-checks every golden with
//! `swiftc` against the iOS runtime.
//!
//! Besides its own cases it runs the TypeScript emitter's pure-Bloom 2.0 fixtures, the same
//! list as the Kotlin goldens (`tests/golden.rs`), so all three backends are held to the same
//! programs.

use std::path::{Path, PathBuf};

fn manifest(module: &str) -> String {
    format!(
        "let package = Package(\n  name: \"Golden\",\n  platforms: [.iOS(17)],\n  targets: [.module(\"{module}\")]\n)\n"
    )
}

fn module_name(case: &str) -> String {
    case.split('_')
        .map(|w| {
            let mut c = w.chars();
            c.next().map(|f| f.to_uppercase().collect::<String>() + c.as_str()).unwrap_or_default()
        })
        .collect()
}

/// The TypeScript emitter's fixtures whose closure is pure Bloom (as in `tests/golden.rs`).
const FIXTURES: &[&str] = &[
    "surface_closures",
    "surface_control",
    "surface_extensions",
    "surface_force",
    "surface_functions",
    "surface_models",
    "surface_protocols",
    "surface_subscripts",
    "surface_tokens",
    "surface_view_children",
    "surface_views",
];

fn golden_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/golden-swift")
}

fn cases() -> Vec<PathBuf> {
    let dir = golden_dir();
    let mut cases: Vec<PathBuf> = std::fs::read_dir(&dir)
        .expect("tests/golden-swift")
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.extension().is_some_and(|x| x == "bloom"))
        .collect();
    cases.sort();
    let fixtures = Path::new(env!("CARGO_MANIFEST_DIR")).join("../lang/tests/fixtures/emit");
    cases.extend(FIXTURES.iter().map(|f| fixtures.join(format!("{f}.bloom"))));
    cases
}

/// The case's Swift, or what stopped it (a check error or an uncovered construct).
fn emit(case: &Path) -> String {
    let name = case.file_stem().unwrap_or_default().to_string_lossy().into_owned();
    static CALLS: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
    let call = CALLS.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    let root = std::env::temp_dir().join(format!("bloom-swift-golden-{}-{call}-{name}", std::process::id()));
    let module_dir = module_name(&name);
    let module = root.join("Sources").join(&module_dir);
    std::fs::create_dir_all(&module).expect("temp package");
    std::fs::write(root.join("Package.bloom"), manifest(&module_dir)).expect("manifest");
    let source = std::fs::read_to_string(case).expect("case");
    std::fs::write(module.join(format!("{name}.bloom")), &source).expect("source");
    let text: String = match bloom_native::load(&root) {
        Err(problems) => problems.iter().map(|p| format!("// error: {}\n", p.message)).collect(),
        Ok(program) => {
            let (files, problems) = bloom_native::swift::emit_all(&program);
            let mut text: String =
                problems.iter().map(|p| format!("// uncovered: {}\n", p.render(Some(&source)))).collect();
            text.extend(files.into_iter().map(|f| f.text));
            text
        }
    };
    let _ = std::fs::remove_dir_all(&root);
    text.replace(&root.to_string_lossy().into_owned(), "<package>")
}

#[test]
fn every_construct_matches_its_golden() {
    let bless = std::env::var_os("BLESS").is_some();
    let mut failed = Vec::new();
    for case in cases() {
        let got = emit(&case);
        let stem = case.file_stem().unwrap_or_default().to_string_lossy().into_owned();
        let expected_path = golden_dir().join(format!("{stem}.swift"));
        if bless {
            std::fs::write(&expected_path, &got).expect("bless");
            continue;
        }
        let expected = std::fs::read_to_string(&expected_path).unwrap_or_default();
        if got != expected {
            failed.push(format!("--- {}\n{got}", case.display()));
        }
        assert!(!got.contains("// error:"), "{}:\n{got}", case.display());
    }
    assert!(failed.is_empty(), "goldens differ (BLESS=1 to accept):\n{}", failed.join("\n"));
}

/// The constructs the Swift backend does not cover yet, across every case.
#[test]
fn coverage_is_reported() {
    let mut uncovered = 0;
    for case in cases() {
        uncovered += emit(&case).matches("// uncovered:").count();
    }
    eprintln!("swiftui: {uncovered} uncovered constructs over {} cases", cases().len());
}
