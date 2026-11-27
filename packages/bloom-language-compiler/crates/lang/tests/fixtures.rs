//! Golden tests: every `fixtures/emit/*.bloom` compiles, and its TypeScript
//! (`.ts.snap`) and declarations (`.d.bloom.ts.snap`) match; every
//! `fixtures/check/*.bloom` fails with exactly the rendered diagnostics of
//! its `.stderr`. `BLOOM_BLESS=1 cargo test` rewrites the snapshots.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use bloom_lang::{Options, compile};

fn fixtures() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures")
}

pub fn options() -> Options {
    let mut paths = BTreeMap::new();
    paths.insert("@/*".to_string(), vec!["stubs/frontend/*".to_string()]);
    paths.insert("react-i18next".to_string(), vec!["stubs/react-i18next.d.ts".to_string()]);
    paths.insert("@oxy.so/services/ui/client".to_string(), vec!["stubs/oxy-services.d.ts".to_string()]);
    paths.insert("@oxy.so/core/logger".to_string(), vec!["stubs/oxy-logger.d.ts".to_string()]);
    paths.insert("@tanstack/react-query".to_string(), vec!["stubs/tanstack-query.d.ts".to_string()]);
    Options { root: Some(fixtures()), paths, dev: false, ..Default::default() }
}

fn bless() -> bool {
    std::env::var_os("BLOOM_BLESS").is_some()
}

/// Compares `actual` with the snapshot at `path` (or writes it when blessing).
fn snapshot(path: &Path, actual: &str) -> Result<(), String> {
    if bless() {
        std::fs::write(path, actual).expect("write the snapshot");
        return Ok(());
    }
    let expected = std::fs::read_to_string(path).unwrap_or_default();
    if expected == actual {
        Ok(())
    } else {
        Err(format!("{} differs:\n--- expected\n{expected}\n--- actual\n{actual}", path.display()))
    }
}

fn sources(dir: &str) -> Vec<PathBuf> {
    let mut files: Vec<PathBuf> = std::fs::read_dir(fixtures().join(dir))
        .expect("the fixtures directory")
        .map(|entry| entry.expect("an entry").path())
        .filter(|path| path.extension().is_some_and(|e| e == "bloom"))
        .collect();
    files.sort();
    files
}

#[test]
fn emit_fixtures() {
    let mut failures = Vec::new();
    for path in sources("emit") {
        let source = std::fs::read_to_string(&path).expect("the fixture");
        let name = format!("emit/{}", path.file_name().expect("a name").to_string_lossy());
        // `dev_*.bloom` is compiled as a development build (`bloomc build --dev`).
        let dev = name.starts_with("emit/dev_");
        let output = compile(&source, &name, &Options { dev, ..options() });
        if !output.diagnostics.is_empty() {
            let rendered: Vec<&str> = output.diagnostics.iter().map(|d| d.rendered.as_str()).collect();
            failures.push(format!("{name} has errors:\n{}", rendered.join("\n\n")));
            continue;
        }
        let warnings: Vec<&str> = output.warnings.iter().map(|d| d.rendered.as_str()).collect();
        let stem = path.with_extension("");
        for result in [
            snapshot(&stem.with_extension("ts.snap"), &output.code),
            snapshot(&stem.with_extension("d.bloom.ts.snap"), output.dts.as_deref().unwrap_or_default()),
            snapshot(&stem.with_extension("warnings"), &warnings.join("\n\n")),
        ] {
            if let Err(failure) = result {
                failures.push(failure);
            }
        }
        assert!(
            output.map.as_deref().is_some_and(|map| map.contains("\"mappings\"")),
            "{name} has a source map"
        );
        // bloomc's output is a fixed point of the embedded pass: everything that pass does
        // to a module (hoisting static chains, the React Compiler opt-in, lowering
        // `toElement`) bloomc has already done or does not need. An optimisation added to
        // the pass that would change bloomc's output fails here until bloomc does it too.
        let again = bloom_language_compiler::compile(&output.code, &format!("{name}.ts"));
        if again.changed {
            failures.push(format!("{name}: the embedded pass changes bloomc's output:\n{}", again.code));
        }
    }
    assert!(failures.is_empty(), "{}", failures.join("\n\n"));
}

/// An untyped `Foreign` (TS's `unknown`) stays untyped through a call, a member and an index:
/// `setOpen(none)` with `setOpen: Foreign` was `ReturnType<>` in the hook's inferred return type,
/// which Babel refuses ("Type argument list cannot be empty"). Not a golden: tsc refuses any use
/// of an `unknown`, which is why such a value is typed (`Foreign<"…">`) where TS checks it.
#[test]
fn an_untyped_foreign_stays_untyped() {
    let source = r#"import { useCallback, useState } from "react"

public func useModel() {
  let (open, setOpen): (String?, Foreign) = useState(none)
  let close = useCallback({ setOpen(none) }, [])
  return { open: open, close: close }
}

public func useRead(_ value: Foreign) {
  return { name: value.name, first: value[0] }
}
"#;
    let output = compile(source, "emit/foreign_untyped.bloom", &options());
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics);
    let dts = output.dts.unwrap_or_default();
    for code in [&output.code, &dts] {
        assert!(!code.contains("<>") && !code.contains(": [\""), "{code}");
    }
    assert!(
        output.code.contains("useModel(): { open: string | undefined; close: () => unknown }"),
        "{}",
        output.code
    );
    assert!(dts.contains("useRead(value: unknown): { name: unknown; first: unknown }"), "{dts}");
}

#[test]
fn check_fixtures() {
    let mut failures = Vec::new();
    for path in sources("check") {
        let source = std::fs::read_to_string(&path).expect("the fixture");
        let name = format!("check/{}", path.file_name().expect("a name").to_string_lossy());
        let output = compile(&source, &name, &options());
        let rendered: Vec<&str> =
            output.diagnostics.iter().chain(&output.warnings).map(|d| d.rendered.as_str()).collect();
        if output.diagnostics.is_empty() && output.warnings.is_empty() {
            failures.push(format!("{name} reports nothing"));
        }
        if let Err(failure) = snapshot(&path.with_extension("stderr"), &(rendered.join("\n\n") + "\n")) {
            failures.push(failure);
        }
    }
    assert!(failures.is_empty(), "{}", failures.join("\n\n"));
}

/// `BLOOM_FILE=… BLOOM_ROOT=… cargo test -p bloom_lang --test fixtures compile_one -- --ignored --nocapture`:
/// compiles one file against a real project (its `tsconfig.json` paths), printing
/// the diagnostics, then writing the TS (`BLOOM_OUT`, default: stdout).
#[test]
#[ignore]
fn compile_one() {
    let file = std::env::var("BLOOM_FILE").expect("BLOOM_FILE");
    let root = std::env::var("BLOOM_ROOT").expect("BLOOM_ROOT");
    let source = std::fs::read_to_string(&file).expect("the file");
    let relative =
        Path::new(&file).strip_prefix(&root).map(Path::to_path_buf).unwrap_or_else(|_| file.clone().into());
    let options =
        Options { root: Some(root.into()), paths: BTreeMap::new(), dev: false, ..Default::default() };
    let output = compile(&source, &relative.to_string_lossy(), &options);
    for diagnostic in output.diagnostics.iter().chain(&output.warnings) {
        eprintln!("{}\n", diagnostic.rendered);
    }
    match std::env::var("BLOOM_OUT") {
        Ok(out) => {
            std::fs::write(&out, &output.code).expect("write");
            if let Some(dts) = &output.dts {
                std::fs::write(format!("{out}.d.bloom.ts"), dts).expect("write");
            }
        }
        Err(_) => println!("{}", output.code),
    }
}

/// `cargo test --release -p bloom_lang --test fixtures timing -- --ignored --nocapture`:
/// the compile time of each emit fixture, cold (the first compile reads the TS
/// declarations it imports) and warm (the median of 200, declarations cached).
#[test]
#[ignore]
fn timing() {
    for path in sources("emit") {
        let source = std::fs::read_to_string(&path).expect("the fixture");
        let name = format!("emit/{}", path.file_name().expect("a name").to_string_lossy());
        let options = options();
        let cold = std::time::Instant::now();
        let _ = compile(&source, &name, &options);
        let cold = cold.elapsed();
        let mut runs: Vec<std::time::Duration> = (0..200)
            .map(|_| {
                let start = std::time::Instant::now();
                let output = compile(&source, &name, &options);
                assert!(output.diagnostics.is_empty());
                start.elapsed()
            })
            .collect();
        runs.sort();
        let parse = {
            let start = std::time::Instant::now();
            for _ in 0..200 {
                let _ = bloom_lang::parse(&source, &name);
            }
            start.elapsed() / 200
        };
        let average = |f: &dyn Fn()| {
            let start = std::time::Instant::now();
            for _ in 0..200 {
                f();
            }
            start.elapsed() / 200
        };
        let check = average(&|| {
            let _ = bloom_lang::check(&source, &name, &options);
        });
        let code = compile(&source, &name, &options).code;
        let embedded = average(&|| {
            let _ = bloom_language_compiler::compile(&code, &format!("{name}.ts"));
        });
        println!(
            "{name}: {} lines, cold {:?}, warm median {:?} (p90 {:?}); parse {:?}, parse+check {:?}, embedded pass {:?}",
            source.lines().count(),
            cold,
            runs[100],
            runs[180],
            parse,
            check,
            embedded
        );
    }
}

/// Routes are read from the app's `app/` tree, its folders are the compile's
/// dependencies, and a route added to the tree is seen by the next compile.
#[test]
fn routes_follow_the_app_tree() {
    let root = std::env::temp_dir().join(format!("bloom-routes-{}", std::process::id()));
    let app = root.join("app");
    std::fs::create_dir_all(&app).expect("a temporary app");
    std::fs::write(app.join("index.tsx"), "export default function Home() { return null; }\n")
        .expect("a route");
    let source = "view Link {\n  body { Button(Text(\"New\")).onPress(navigate(\"/new\")) }\n}\n";
    let options = Options { root: Some(root.clone()), ..Default::default() };
    let before = compile(source, "Link.bloom", &options);
    assert!(before.diagnostics.iter().any(|d| d.code == "B0701"), "an unknown route is an error");
    assert!(before.dependencies.contains(&app), "the app folder is a dependency");
    std::fs::write(app.join("new.tsx"), "export default function New() { return null; }\n")
        .expect("a new route");
    let after = compile(source, "Link.bloom", &options);
    let _ = std::fs::remove_dir_all(&root);
    assert!(after.diagnostics.is_empty(), "the new route is seen: {:?}", after.diagnostics);
}

/// A 2.0 screen is its route's default export under the app's router folder, and its named
/// export anywhere else (`emit/screen_named`), so a route that renders it can import it.
#[test]
fn a_screen_is_default_only_in_a_route() {
    let source = "public struct Welcome: Screen {\n  var body: some View { Text(\"hi\") }\n}\n";
    let route = compile(source, "app/welcome.bloom", &options());
    assert!(route.code.contains("export default screen(function Welcome"), "{}", route.code);
    let elsewhere = compile(source, "components/Welcome.bloom", &options());
    assert!(elsewhere.code.contains("export const Welcome = screen(function Welcome"), "{}", elsewhere.code);
}

/// A package's `exports` patterns (`"./icons/Ri*"`), resolved as Node and TS do: the longest
/// matching prefix, its `*` replaced, `types` read before `react-native`, `import`, `default`.
#[test]
fn package_exports_patterns() {
    let root = Path::new(env!("CARGO_TARGET_TMPDIR")).join("exports_patterns");
    let _ = std::fs::remove_dir_all(&root);
    let bloom = root.join("node_modules/@oxy.so/bloom");
    let files = [
        (
            "package.json",
            r#"{
  "name": "@oxy.so/bloom",
  "exports": {
    "./icons/*": { "types": "./lib/typescript/module/icons/wrong/*.d.ts" },
    "./icons/Ri*": {
      "react-native": {
        "types": "./lib/typescript/module/icons/remix/Ri*.d.ts",
        "default": "./src/icons/remix/Ri*.tsx"
      },
      "import": { "types": "./lib/typescript/module/icons/remix/Ri*.d.ts", "default": "./lib/module/icons/remix/Ri*.js" }
    },
    "./icons/LikeIcon": [{ "import": { "types": "./lib/typescript/module/icons/LikeIcon.d.ts" } }]
  }
}"#,
        ),
        (
            "lib/typescript/module/icons/remix/RiHeart3Line.d.ts",
            "export declare const RiHeart3Line: import(\"react\").ForwardRefExoticComponent<{ size?: number }>;\n",
        ),
        (
            "lib/typescript/module/icons/LikeIcon.d.ts",
            "export declare function LikeIcon({ size }: { size?: number }): import(\"react\").JSX.Element;\n",
        ),
    ];
    for (path, text) in files {
        let path = bloom.join(path);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(path, text).unwrap();
    }
    let source = std::fs::read_to_string(fixtures().join("packages/exports_patterns.bloom")).unwrap();
    let file = root.join("Liked.bloom");
    let options = Options { root: Some(root.clone()), ..Default::default() };
    let output = compile(&source, &file.to_string_lossy(), &options);
    let all: Vec<&str> =
        output.diagnostics.iter().chain(&output.warnings).map(|d| d.rendered.as_str()).collect();
    assert!(all.is_empty(), "{}", all.join("\n\n"));
    if let Err(failure) = snapshot(&fixtures().join("packages/exports_patterns.ts.snap"), &output.code) {
        panic!("{failure}");
    }
}
