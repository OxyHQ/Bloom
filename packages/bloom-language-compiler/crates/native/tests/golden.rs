//! Golden tests, one per construct: `tests/golden/<case>.bloom` is checked as the only file
//! of a module named after it (`surface_models` is `SurfaceModels`) in a package, emitted with the Kotlin backend, and compared with
//! `tests/golden/<case>.kt`. `BLESS=1 cargo test -p bloom_native --test golden` rewrites the
//! expectations; review the diff like any other change.
//!
//! Besides its own cases it runs the TypeScript emitter's pure-Bloom 2.0 fixtures
//! (`crates/lang/tests/fixtures/emit/surface_*.bloom`, listed in [`FIXTURES`]), so both
//! backends are held to the same programs; their goldens are `tests/golden/<fixture>.kt`.

use std::path::{Path, PathBuf};

/// Each case is the module of its name, so every golden is its own Kotlin package
/// (`bloom.golden.surface_models`) and all of them compile together (`scripts/compile-goldens.sh`).
fn manifest(module: &str) -> String {
    format!(
        "let package = Package(\n  name: \"Golden\",\n  platforms: [.android(26)],\n  targets: [.module(\"{module}\")]\n)\n"
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

/// The TypeScript emitter's fixtures whose closure is pure Bloom (no TS import).
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
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/golden")
}

fn cases() -> Vec<PathBuf> {
    let dir = golden_dir();
    let mut cases: Vec<PathBuf> = std::fs::read_dir(&dir)
        .expect("tests/golden")
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.extension().is_some_and(|x| x == "bloom"))
        .collect();
    cases.sort();
    let fixtures = Path::new(env!("CARGO_MANIFEST_DIR")).join("../lang/tests/fixtures/emit");
    cases.extend(FIXTURES.iter().map(|f| fixtures.join(format!("{f}.bloom"))));
    cases
}

/// The case's Kotlin, or what stopped it (a check error or an uncovered construct).
fn emit(case: &Path) -> String {
    let name = case.file_stem().unwrap_or_default().to_string_lossy().into_owned();
    // One directory per call: the two tests run in parallel, each removing its own.
    static CALLS: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
    let call = CALLS.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    let root = std::env::temp_dir().join(format!("bloom-native-golden-{}-{call}-{name}", std::process::id()));
    let module_dir = module_name(&name);
    let module = root.join("Sources").join(&module_dir);
    std::fs::create_dir_all(&module).expect("temp package");
    std::fs::write(root.join("Package.bloom"), manifest(&module_dir)).expect("manifest");
    let source = std::fs::read_to_string(case).expect("case");
    std::fs::write(module.join(format!("{name}.bloom")), &source).expect("source");
    let text: String = match bloom_native::load(&root) {
        Err(problems) => problems.iter().map(|p| format!("// error: {}\n", p.message)).collect(),
        Ok(program) => {
            let (files, problems) = bloom_native::kotlin::emit_all(&program);
            let mut text: String =
                problems.iter().map(|p| format!("// uncovered: {}\n", p.render(Some(&source)))).collect();
            text.extend(files.into_iter().map(|f| f.text));
            text
        }
    };
    let _ = std::fs::remove_dir_all(&root);
    text.replace(&root.to_string_lossy().into_owned(), "<package>")
        .replace(&format!("bloom-native-golden-{}-{call}-", std::process::id()), "")
}

#[test]
fn every_construct_matches_its_golden() {
    let bless = std::env::var_os("BLESS").is_some();
    let mut failed = Vec::new();
    for case in cases() {
        let got = emit(&case);
        let stem = case.file_stem().unwrap_or_default().to_string_lossy().into_owned();
        let expected_path = golden_dir().join(format!("{stem}.kt"));
        if bless {
            std::fs::write(&expected_path, &got).expect("bless");
            continue;
        }
        let expected = std::fs::read_to_string(&expected_path).unwrap_or_default();
        if got != expected {
            failed.push(format!("--- {}\n{got}", case.display()));
        }
        // A case the main checker rejects is not a backend's case.
        assert!(!got.contains("// error:"), "{}:\n{got}", case.display());
    }
    assert!(failed.is_empty(), "goldens differ (BLESS=1 to accept):\n{}", failed.join("\n"));
}

/// The constructs the backend does not cover yet, across every case: a golden records them
/// as `// uncovered:` lines, so coverage is countable and each one gained is a reviewed diff.
#[test]
fn coverage_is_reported() {
    let mut uncovered = 0;
    for case in cases() {
        uncovered += emit(&case).matches("// uncovered:").count();
    }
    eprintln!("kotlin-compose: {uncovered} uncovered constructs over {} cases", cases().len());
}
