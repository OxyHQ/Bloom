//! Directory modules and `Package.bloom` (ADR 0002, sections 1 and 2): a
//! package written to a temporary directory, compiled file by file.

use std::path::{Path, PathBuf};

use bloom_lang::{Options, compile};

/// A package at a fresh directory: `files` are (path, text) under it.
fn package(name: &str, files: &[(&str, &str)]) -> PathBuf {
    let root = Path::new(env!("CARGO_TARGET_TMPDIR")).join("modules").join(name);
    let _ = std::fs::remove_dir_all(&root);
    for (path, text) in files {
        let path = root.join(path);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(path, text).unwrap();
    }
    root
}

fn build(root: &Path, file: &str, options: &Options) -> bloom_lang::Output {
    let path = root.join(file);
    let source = std::fs::read_to_string(&path).unwrap();
    compile(&source, &path.to_string_lossy(), options)
}

fn codes(output: &bloom_lang::Output) -> Vec<&'static str> {
    output.diagnostics.iter().map(|d| d.code).collect()
}

const MANIFEST: &str = r#"let package = Package(
  name: "Demo",
  targets: [
    .app("Demo", dependencies: ["Feed", "Sentry"]),
    .module("Feed"),
    .bindings("Sentry", npm: "@sentry/react-native@6.2.0"),
  ]
)
"#;

const ROW: &str = "pub view Row(title: String) {\n  body {\n    Text(title)\n  }\n}\n";

#[test]
fn a_module_sees_its_other_files() {
    let root = package(
        "siblings",
        &[
            ("Package.bloom", MANIFEST),
            ("Sources/Feed/Row.bloom", ROW),
            (
                "Sources/Feed/Rows.bloom",
                "pub view Rows {\n  body {\n    VStack {\n      Row(title: \"One\")\n    }\n  }\n}\n",
            ),
        ],
    );
    let out = build(&root, "Sources/Feed/Rows.bloom", &Options::default());
    assert!(out.diagnostics.is_empty(), "{:?}", out.diagnostics);
    assert!(out.code.contains("import { Row } from \"./Row.bloom\";"), "{}", out.code);
    // The other file is a dependency: an edit there recompiles this one.
    assert!(out.dependencies.iter().any(|d| d.ends_with("Sources/Feed/Row.bloom")), "{:?}", out.dependencies);
    assert!(out.dependencies.iter().any(|d| d.ends_with("Package.bloom")));
}

#[test]
fn app_modules_import_no_paths() {
    let root = package(
        "paths",
        &[
            ("Package.bloom", MANIFEST),
            ("Sources/Feed/Row.bloom", "import { useState } from \"react\"\n"),
            ("Bindings/Sentry/Sentry.bloom", "import { captureException } from \"@sentry/react-native\"\n"),
        ],
    );
    let out = build(&root, "Sources/Feed/Row.bloom", &Options::default());
    assert_eq!(codes(&out), ["B0806"]);
    let message = &out.diagnostics[0];
    assert!(message.help.as_deref().unwrap_or_default().contains("bloom bind react"), "{message:?}");
    // The migration mode keeps them, and a binding module is where they belong.
    let migrating = Options { allow_ts_imports: true, ..Options::default() };
    assert!(!codes(&build(&root, "Sources/Feed/Row.bloom", &migrating)).contains(&"B0806"));
    assert!(!codes(&build(&root, "Bindings/Sentry/Sentry.bloom", &Options::default())).contains(&"B0806"));
}

#[test]
fn a_file_outside_a_package_is_a_0x_file() {
    let root = package("loose", &[("lib/Row.bloom", "import { useState } from \"react\"\n")]);
    assert!(!codes(&build(&root, "lib/Row.bloom", &Options::default())).contains(&"B0806"));
}

#[test]
fn a_broken_manifest_is_reported_once() {
    let root = package(
        "broken",
        &[("Package.bloom", "let package = Package(name: \"Demo\")\n"), ("Sources/Demo/App.bloom", ROW)],
    );
    let out = build(&root, "Sources/Demo/App.bloom", &Options::default());
    assert_eq!(codes(&out), ["B0810"], "{:?}", out.diagnostics);
}

#[test]
fn two_files_of_a_module_share_one_namespace() {
    let root = package(
        "duplicate",
        &[("Package.bloom", MANIFEST), ("Sources/Feed/Row.bloom", ROW), ("Sources/Feed/Other.bloom", ROW)],
    );
    let out = build(&root, "Sources/Feed/Other.bloom", &Options::default());
    assert_eq!(codes(&out), ["B0807"], "{:?}", out.diagnostics);
    assert!(out.diagnostics[0].message.contains("Sources/Feed/Row.bloom"));
}
