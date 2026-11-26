//! The standard library (`stdlib/Bloom/`, ADR 0002 section 3): every file compiles, and
//! a package's files use it without importing it.

use std::path::{Path, PathBuf};

use bloom_lang::{Options, compile, stdlib};

const MANIFEST: &str = r#"let package = Package(
  name: "App",
  targets: [
    .app("App", dependencies: ["Model"]),
    .module("Model"),
  ]
)
"#;

fn package(name: &str, files: &[(&str, &str)]) -> PathBuf {
    let root = Path::new(env!("CARGO_TARGET_TMPDIR")).join("stdlib").join(name);
    let _ = std::fs::remove_dir_all(&root);
    for (path, text) in [("Package.bloom", MANIFEST)].iter().chain(files) {
        let path = root.join(path);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(path, text).unwrap();
    }
    root
}

fn rendered(output: &bloom_lang::Output) -> String {
    output.diagnostics.iter().map(|d| d.rendered.as_str()).collect::<Vec<_>>().join("\n")
}

#[test]
fn every_standard_library_file_compiles() {
    let root = package("compiles", &[]);
    let mut failures = Vec::new();
    for path in stdlib::ensure(&root) {
        let source = std::fs::read_to_string(&path).unwrap();
        let out = compile(&source, &path.to_string_lossy(), &Options::default());
        if !out.diagnostics.is_empty() {
            failures.push(format!("{}:\n{}", path.display(), rendered(&out)));
        }
        // Beside its source, for `tests/tsc/check.sh` and for reading.
        let _ = std::fs::write(path.with_extension("ts"), &out.code);
    }
    assert!(failures.is_empty(), "{}", failures.join("\n\n"));
}

#[test]
fn a_package_file_uses_the_standard_library_without_importing_it() {
    let root = package(
        "implicit",
        &[(
            "Sources/Model/Names.bloom",
            "public func initials(_ name: String) -> String {\n  let words = name.components(separatedBy: \" \").filter { !$0.isBlank }\n  let at = words.firstIndex(where: { $0.hasPrefix(\"@\") }) ?? -1\n  return \"\\(at) \" + words.map { $0.prefix(1) }.joined(\"\")\n}\n",
        )],
    );
    let out = compile(
        &std::fs::read_to_string(root.join("Sources/Model/Names.bloom")).unwrap(),
        &root.join("Sources/Model/Names.bloom").to_string_lossy(),
        &Options::default(),
    );
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    assert!(
        out.code.contains(
            "import { Array$firstIndex, String$components, String$hasPrefix, String$isBlank, String$prefix } from \"../../.bloom/std/Bloom/Core.bloom\";"
        ),
        "{}",
        out.code
    );
}

#[test]
fn a_package_name_shadows_the_standard_library() {
    let root = package(
        "shadow",
        &[(
            "Sources/Model/Own.bloom",
            "public func stride(from: Int, to: Int, by: Int) -> [Int] { [from, to, by] }\n\npublic func use() -> [Int] { stride(from: 0, to: 1, by: 1) }\n",
        )],
    );
    let path = root.join("Sources/Model/Own.bloom");
    let out = compile(&std::fs::read_to_string(&path).unwrap(), &path.to_string_lossy(), &Options::default());
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    assert!(!out.code.contains(".bloom/std"), "{}", out.code);
}
