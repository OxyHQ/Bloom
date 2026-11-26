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

const POST: &str = r#"public struct User: Codable, Equatable {
  public let name: String
  public let isVerified: Bool
}

public enum Visibility: Codable {
  case everyone
  case followers
}

public struct Post: Codable, Equatable {
  public let id: String
  public let author: User
  @CodingKey("created_at") public let createdAt: Date
  public var likes: Int = 0
  public let tags: [String]
  public let replyTo: String?
  public let visibility: Visibility
  public let counts: [String: Int]
}

public func read(_ text: String) throws -> [Post] {
  try JSON.decode(Array.codec(Post.self), from: text)
}

public func write(_ post: Post) -> String { JSON.encode(Post.self, post) }
"#;

#[test]
fn codable_is_derived_at_compile_time() {
    let root = package("codable", &[("Sources/Model/Post.bloom", POST)]);
    let path = root.join("Sources/Model/Post.bloom");
    let out = compile(POST, &path.to_string_lossy(), &Options::default());
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    let golden = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/stdlib/codable.ts.snap");
    if std::env::var_os("BLOOM_BLESS").is_some() {
        std::fs::create_dir_all(golden.parent().unwrap()).unwrap();
        std::fs::write(&golden, &out.code).unwrap();
    }
    assert_eq!(std::fs::read_to_string(&golden).unwrap_or_default(), out.code);
}

const FEED_TITLE: &str = r#"public struct FeedTitle: View {
  let count: Int

  var body: some View {
    VStack {
      Text("feed.title")
      Text(String(localized: "feed.count", count: count))
      Text("Plain text stays as written")
    }
  }
}
"#;

#[test]
fn localized_strings_are_checked_against_the_catalogs() {
    let en = r#"{ "feed.title": "Home", "feed.count": { "one": "{count} post", "other": "{count} posts" } }"#;
    let es = r#"{ "feed.title": "Inicio" }"#;
    let root = package(
        "i18n",
        &[
            ("Resources/Localizable/en.json", en),
            ("Resources/Localizable/es.json", es),
            ("Sources/Model/FeedTitle.bloom", FEED_TITLE),
        ],
    );
    let path = root.join("Sources/Model/FeedTitle.bloom");
    let out = compile(FEED_TITLE, &path.to_string_lossy(), &Options::default());
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    assert!(out.code.contains("String$$localized(\"feed.title\")"), "{}", out.code);
    assert!(out.code.contains("String$$localized(\"feed.count\", undefined, count)"), "{}", out.code);
    assert!(out.code.contains("\"Plain text stays as written\""), "{}", out.code);
    let warnings: Vec<&str> = out.warnings.iter().map(|w| w.code).collect();
    assert_eq!(warnings, ["B0842"], "es.json lacks feed.count");

    let typo =
        FEED_TITLE.replace("\"feed.count\"", "\"feed.cuont\"").replace("\"feed.title\"", "\"feed.titel\"");
    let out = compile(&typo, &path.to_string_lossy(), &Options::default());
    let codes: Vec<&str> = out.diagnostics.iter().map(|d| d.code).collect();
    assert_eq!(codes, ["B0840"], "{}", rendered(&out));
    assert_eq!(out.diagnostics[0].help.as_deref(), Some("did you mean `feed.count`?"));
    let warnings: Vec<&str> = out.warnings.iter().map(|w| w.code).collect();
    assert_eq!(warnings, ["B0841"]);
}

#[test]
fn the_reference_is_generated_from_the_sources() {
    let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../../docs/bloom-stdlib.mdx");
    let reference = stdlib::reference();
    if std::env::var_os("BLOOM_BLESS").is_some() {
        std::fs::write(&path, &reference).unwrap();
    }
    assert!(
        std::fs::read_to_string(&path).unwrap_or_default() == reference,
        "docs/bloom-stdlib.mdx is stale: run BLOOM_BLESS=1 cargo test -p bloom_lang --test stdlib reference"
    );
}

/// Mention's API client, a feed model and the settings store, on the standard library
/// alone (ADR 0002 phase B's exit): `examples/MentionPort`, compiled and kept as goldens.
#[test]
fn mentions_model_network_and_settings_layers_need_no_bindings() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../examples/MentionPort");
    let goldens = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/stdlib/mention");
    let mut failures = Vec::new();
    for module in ["API", "Posts", "Feed", "Settings"] {
        let dir = root.join("Sources").join(module);
        let mut files: Vec<PathBuf> = std::fs::read_dir(&dir).unwrap().map(|e| e.unwrap().path()).collect();
        files.sort();
        for path in files {
            let source = std::fs::read_to_string(&path).unwrap();
            assert!(!source.contains("extern module") && !source.contains("Foreign"), "no bindings: {}", path.display());
            let out = compile(&source, &path.to_string_lossy(), &Options::default());
            if !out.diagnostics.is_empty() {
                failures.push(format!("{}:\n{}", path.display(), rendered(&out)));
                continue;
            }
            let name = format!("{module}.{}.ts.snap", path.file_stem().unwrap().to_string_lossy());
            let golden = goldens.join(name);
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
