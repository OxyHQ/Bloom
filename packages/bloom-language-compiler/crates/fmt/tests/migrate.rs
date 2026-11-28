//! `bloom migrate --from 0.x` over the compiler's 0.x emit fixtures: each migrated file parses,
//! is formatted, and compiles to the TypeScript its 0.x source compiles to.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

fn fixtures() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../lang/tests/fixtures")
}

fn options() -> bloom_lang::Options {
    let mut paths = BTreeMap::new();
    paths.insert("@/*".to_string(), vec!["stubs/frontend/*".to_string()]);
    paths.insert("react-i18next".to_string(), vec!["stubs/react-i18next.d.ts".to_string()]);
    paths.insert("@oxy.so/services/ui/client".to_string(), vec!["stubs/oxy-services.d.ts".to_string()]);
    paths.insert("@oxy.so/core/logger".to_string(), vec!["stubs/oxy-logger.d.ts".to_string()]);
    bloom_lang::Options { root: Some(fixtures()), paths, ..Default::default() }
}

/// The code without `export`: a migration makes `public` the types a 0.x `pub` declaration
/// named, which 2.0 exports (0.x declared them beside it, unexported).
fn unexported(code: &str) -> String {
    code.lines().map(|l| l.strip_prefix("export ").unwrap_or(l)).collect::<Vec<_>>().join("\n")
}

#[test]
fn migrated_fixtures_compile_to_the_same_typescript() {
    let mut sources: Vec<PathBuf> = std::fs::read_dir(fixtures().join("emit"))
        .expect("the emit fixtures")
        .map(|e| e.expect("an entry").path())
        .filter(|p| p.extension().is_some_and(|e| e == "bloom"))
        .filter(|p| !p.file_name().is_some_and(|n| n.to_string_lossy().starts_with("surface_")))
        .collect();
    sources.sort();
    let mut failures = Vec::new();
    for path in sources {
        let source = std::fs::read_to_string(&path).expect("the fixture");
        let name = format!("emit/{}", path.file_name().expect("a name").to_string_lossy());
        let migrated = match bloom_fmt::migrate(&source, &name) {
            Ok((migrated, _)) => migrated,
            Err(diagnostics) => {
                let rendered: Vec<&str> = diagnostics.iter().map(|d| d.rendered.as_str()).collect();
                failures.push(format!("{name} does not migrate:\n{}", rendered.join("\n")));
                continue;
            }
        };
        match bloom_fmt::format(&migrated, &name) {
            Ok(formatted) if formatted == migrated => {}
            _ => failures.push(format!("{name}: the migration is not formatted")),
        }
        // A value `@ref` becomes the standard library's `Ref(v)` in `@State` (one hook, no
        // render, as `useRef`): its TypeScript differs, and the fixture tree has no package for
        // the standard library. `refs_become_ref_and_view_ref` checks its text.
        if migrated.contains("= Ref(") {
            continue;
        }
        // Against the formatted 0.x source: formatting alone sorts the imports.
        let formatted = bloom_fmt::format(&source, &name).expect("the fixture formats");
        let before = bloom_lang::compile(&formatted, &name, &options());
        let after = bloom_lang::compile(&migrated, &name, &options());
        if !after.diagnostics.is_empty() {
            let rendered: Vec<&str> = after.diagnostics.iter().map(|d| d.rendered.as_str()).collect();
            failures.push(format!("{name}: the migration has errors:\n{}", rendered.join("\n")));
        } else if unexported(&before.code) != unexported(&after.code) {
            let first = before.code.lines().zip(after.code.lines()).find(|(a, b)| a != b);
            failures.push(format!("{name}: the migration compiles differently: {first:?}"));
        }
    }
    assert!(failures.is_empty(), "{} of the fixtures:\n\n{}", failures.len(), failures.join("\n\n"));
}

/// A view's `effect` members become modifiers of its body: once is `.onAppear` (its `defer`
/// the `.onDisappear`), an `id:` is `.task(id:)`; the view is then a `struct`.
#[test]
fn effects_become_body_modifiers() {
    let source = r#"pub view Search(id: String) {
  @state query = ""

  effect(id: 0) {
    query = id
    defer { query = "" }
  }

  effect(id: (id, query)) {
    query = query + id
  }

  body {
    Text(query)
  }
}
"#;
    let (migrated, notes) = bloom_fmt::migrate(source, "search.bloom").expect("it migrates");
    assert!(notes.is_empty(), "{notes:?}");
    assert_eq!(
        migrated,
        r#"public struct Search: View {
  let id: String
  @State private var query = ""

  var body: some View {
    Text(query)
    .task(id: (id, query)) { query = query + id }
    .onAppear { query = id }
    .onDisappear { query = "" }
  }
}
"#
    );
    let compiled = bloom_lang::compile(&migrated, "search.bloom", &options());
    assert!(compiled.diagnostics.is_empty(), "{:?}", compiled.diagnostics);
    assert!(compiled.warnings.iter().all(|w| w.code != "B0950"), "{:?}", compiled.warnings);
}

/// A value `@ref x = v` is `@State private var x = Ref(v)`, read and written as `x.value`; a
/// ref handed to a host view (`.ref(field)`) with `T? = none` is `ViewRef<T>()`.
#[test]
fn refs_become_ref_and_view_ref() {
    let source = std::fs::read_to_string(fixtures().join("emit/refs.bloom")).expect("the fixture");
    let (migrated, _) = bloom_fmt::migrate(&source, "emit/refs.bloom").expect("it migrates");
    assert!(migrated.contains("@State private var timer = Ref(0)"), "{migrated}");
    assert!(migrated.contains("@State private var field = ViewRef<ViewInstance>()"), "{migrated}");
    assert!(migrated.contains("timer.value = field == none ? 0 : timer.value + 1"), "{migrated}");
    assert!(migrated.contains(".ref(field)"), "{migrated}");
    assert!(!migrated.lines().any(|l| l.trim_start().starts_with("@ref")), "{migrated}");
}
