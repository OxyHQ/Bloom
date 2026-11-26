//! ADR 0002 phase A's exit: the Spanish summary's three Mention examples
//! (`docs/adr/0002-resumen-es.md`), as written there, compile with no errors in a package
//! (`examples/Mention`), beside stand-ins for the two app modules they import
//! (`Mention.API`, `Mention.Settings`). Their TypeScript is kept as goldens
//! (`tests/fixtures/exit/`); `BLOOM_BLESS=1` rewrites them.

use std::path::{Path, PathBuf};

use bloom_lang::{Options, compile};

#[test]
fn the_adr_examples_compile_with_no_errors() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../examples/Mention");
    let goldens = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/exit");
    let mut failures = Vec::new();
    for module in ["API", "Settings", "Feed", "Screens"] {
        let dir = root.join("Sources").join(module);
        let mut files: Vec<PathBuf> = std::fs::read_dir(&dir).unwrap().map(|e| e.unwrap().path()).collect();
        files.sort();
        for path in files {
            let source = std::fs::read_to_string(&path).unwrap();
            let out = compile(&source, &path.to_string_lossy(), &Options::default());
            let problems: Vec<&str> =
                out.diagnostics.iter().chain(&out.warnings).map(|d| d.rendered.as_str()).collect();
            if !problems.is_empty() {
                failures.push(format!("{}:\n{}", path.display(), problems.join("\n")));
                continue;
            }
            let golden =
                goldens.join(format!("{module}.{}.ts.snap", path.file_stem().unwrap().to_string_lossy()));
            if std::env::var_os("BLOOM_BLESS").is_some() {
                std::fs::create_dir_all(&goldens).unwrap();
                std::fs::write(&golden, &out.code).unwrap();
            } else if std::fs::read_to_string(&golden).unwrap_or_default() != out.code {
                failures.push(format!("{} differs", golden.display()));
            }
        }
    }
    assert!(failures.is_empty(), "{}", failures.join("\n\n"));
}
