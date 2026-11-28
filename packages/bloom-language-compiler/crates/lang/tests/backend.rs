//! `bloom_lang::backend`: the checked program a native backend reads (ADR 0003), from the same
//! front end `compile` emits TypeScript from.

use bloom_lang::backend::{self, CallRes, Ty};
use bloom_lang::{Options, compile};

const SOURCE: &str = r#"
public struct Post { public let title: String; public var likes: Int = 0 }
extension Post { public func liked() -> Post { Post(title: self.title, likes: self.likes + 1) } }
public func total(_ posts: [Post]) -> Int { posts.map { $0.liked().likes }.reduce(0) { $0 + $1 } }
"#;

#[test]
fn the_checked_program_is_what_compile_emits_from() {
    let checked = backend::checked(SOURCE, "post.bloom", &Options::default());
    assert!(checked.diagnostics.is_empty(), "{:?}", checked.diagnostics);
    // Every expression the checker typed has a type a backend can read, and the extension
    // call resolved to its lowered function.
    assert!(checked.result.types.values().all(|ty| !matches!(ty, Ty::Unknown)));
    assert!(
        checked
            .result
            .calls
            .values()
            .any(|c| matches!(c, CallRes::Extension { func, .. } if &**func == "Post$liked"))
    );
    assert!(checked.result.defs.iter().any(|d| d.name == "Post"));
    assert_eq!(compile(SOURCE, "post.bloom", &Options::default()).diagnostics.len(), 0);
}

#[test]
fn its_errors_are_compiles() {
    let bad = "public func f() -> Int { \"x\" }\n";
    let checked = backend::checked(bad, "bad.bloom", &Options::default());
    let compiled = compile(bad, "bad.bloom", &Options::default());
    let codes = |ds: &[bloom_lang::Diagnostic]| ds.iter().map(|d| d.code).collect::<Vec<_>>();
    assert!(!checked.diagnostics.is_empty());
    assert_eq!(codes(&checked.diagnostics), codes(&compiled.diagnostics));
    assert!(!checked.diagnostics[0].rendered.is_empty());
}
