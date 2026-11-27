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
/// A 0.x `screen` is its file's default export; 2.0's `struct X: Screen` is so only in a route
/// (`bloom migrate` rewrites its importers), and a named export elsewhere.
fn unexported(code: &str) -> String {
    code.lines()
        .map(|l| l.strip_prefix("export ").unwrap_or(l))
        .map(|l| match l.strip_prefix("default screen(function ") {
            Some(rest) => {
                let name = rest.split('(').next().unwrap_or_default();
                format!("const {name} = screen(function {rest}")
            }
            None => l.to_string(),
        })
        .collect::<Vec<_>>()
        .join("\n")
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
