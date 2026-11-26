//! `bloom_lang::analyze` over the Notifications port: definitions and their
//! references, scopes, members, expected types and dependencies.

use std::collections::BTreeMap;
use std::path::Path;

use bloom_lang::{DefinitionKind, DefinitionOrigin, MemberKind, Options, analyze};

/// The fixtures' project: the same `paths` as the golden tests.
fn options() -> Options {
    let mut paths = BTreeMap::new();
    paths.insert("@/*".to_string(), vec!["stubs/frontend/*".to_string()]);
    paths.insert("react-i18next".to_string(), vec!["stubs/react-i18next.d.ts".to_string()]);
    paths.insert("@oxy.so/services/ui/client".to_string(), vec!["stubs/oxy-services.d.ts".to_string()]);
    paths.insert("@oxy.so/core/logger".to_string(), vec!["stubs/oxy-logger.d.ts".to_string()]);
    Options { root: Some(Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures")), paths, dev: false }
}

fn port() -> (String, bloom_lang::Analysis) {
    let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/emit/notifications_port.bloom");
    let source = std::fs::read_to_string(path).expect("the fixture");
    let analysis = analyze(&source, "emit/notifications_port.bloom", &options());
    (source, analysis)
}

fn at(source: &str, needle: &str, nth: usize) -> u32 {
    source.match_indices(needle).nth(nth).map(|(i, _)| i as u32).expect("the needle")
}

#[test]
fn definitions_and_references() {
    let (source, analysis) = port();
    assert!(analysis.diagnostics.is_empty(), "{:?}", analysis.diagnostics);
    let prefs = analysis
        .definitions
        .iter()
        .position(|d| d.name == "Prefs" && d.kind == DefinitionKind::Item)
        .expect("the struct");
    assert_eq!(analysis.definitions[prefs].span.start, at(&source, "Prefs {", 0));
    // `Prefs` is named by `Partial<Prefs>`, `Prefs.patch(…)` and `Prefs(..stored)`.
    let refs = analysis.references_to(prefs);
    assert!(refs.len() >= 5, "{refs:?}");
    // `prefs.likes` refers to the field `likes`.
    let likes = analysis.definition_at(at(&source, "prefs.likes", 0) + 6).expect("a reference");
    assert_eq!(analysis.definitions[likes].kind, DefinitionKind::Field);
    assert_eq!(analysis.definitions[likes].name, "likes");
    // `saving` is a state, written in a handler and read in the body.
    let saving = analysis.definition_at(at(&source, "if saving", 0) + 3).expect("saving");
    assert_eq!(analysis.definitions[saving].kind, DefinitionKind::State);
    assert!(analysis.references_to(saving).len() >= 3);
    // An import comes from its TS file.
    let auth = analysis.definitions.iter().find(|d| d.name == "useAuth").expect("useAuth");
    assert_eq!(auth.kind, DefinitionKind::Import);
    assert!(
        matches!(&auth.origin, DefinitionOrigin::Ts(Some(path), _) if path.ends_with("oxy-services.d.ts"))
    );
}

#[test]
fn scope_members_and_expected_types() {
    let (source, analysis) = port();
    let inside = at(&source, "logger.error", 0);
    let names: Vec<&str> =
        analysis.scope_at(inside).iter().map(|d| analysis.definitions[*d].name.as_str()).collect();
    for name in ["error", "key", "value", "saving", "prefs", "t", "isOn", "logger"] {
        assert!(names.contains(&name), "{name} in {names:?}");
    }
    assert!(!names.contains(&"title"), "another function's parameter: {names:?}");
    let members = analysis.members_at(at(&source, ".wrapControl()", 0));
    assert!(members.iter().any(|m| m.name == "description" && m.kind == MemberKind::Modifier), "{members:?}");
    let fields = analysis.members_at(at(&source, "prefs.likes", 0) + 5);
    assert!(fields.iter().any(|m| m.name == "quotes" && m.kind == MemberKind::Field), "{fields:?}");
    assert_eq!(analysis.expected_type_at(at(&source, "isOn(prefs, key)", 0) + 5).as_deref(), Some("Prefs"));
    assert!(
        analysis.dependencies.iter().any(|d| d.ends_with("react-i18next.d.ts")),
        "{:?}",
        analysis.dependencies
    );
}

/// An edited TS file is read again on the next compile, and is a dependency.
#[test]
fn edited_declarations_are_read_again() {
    let dir = std::env::temp_dir().join(format!("bloom-lang-deps-{}", std::process::id()));
    std::fs::create_dir_all(&dir).expect("a temp dir");
    std::fs::write(dir.join("count.ts"), "export const count: number = 1\n").expect("write");
    let source = "import { count } from \"./count\"\nlet n: Float = count\n";
    let options = Options { root: Some(dir.clone()), paths: BTreeMap::new(), dev: false };
    let first = bloom_lang::compile(source, "a.bloom", &options);
    assert!(first.diagnostics.is_empty(), "{:?}", first.diagnostics);
    assert!(first.dependencies.iter().any(|d| d.ends_with("count.ts")), "{:?}", first.dependencies);
    std::fs::write(dir.join("count.ts"), "export const count: string = \"one\"\n").expect("write");
    let second = bloom_lang::compile(source, "a.bloom", &options);
    assert!(second.diagnostics.iter().any(|d| d.code == "B0201"), "{:?}", second.diagnostics);
    std::fs::remove_dir_all(&dir).ok();
}
