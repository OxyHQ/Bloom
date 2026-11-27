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

const TICKER: &str = r#"public struct Ticker: View {
  @State private var timer = Ref(0)
  @State private var shown = 0

  var body: some View {
    VStack {
      Text("\(shown)")
      Button(Text("Tick")).onPress { timer.value += 1 }
      Button(Text("Show")).onPress { shown = timer.value }
    }
  }
}
"#;

#[test]
fn a_ref_keeps_a_value_across_renders_without_one() {
    // `useRef(0)`'s 2.0 form: the standard library's `Ref<T>` held in `@State`, made once
    // (one hook); writing `timer.value` draws nothing.
    let root = package("ref", &[("Sources/Model/Ticker.bloom", TICKER)]);
    let path = root.join("Sources/Model/Ticker.bloom");
    let out = compile(TICKER, &path.to_string_lossy(), &Options::default());
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    assert!(out.code.contains("useState<Ref<number>>(() => Ref$$init(0))"), "{}", out.code);
    assert!(out.code.contains("timer.value = timer.value + (1);"), "{}", out.code);
    // The class's `init` is imported with it, as a value.
    assert!(out.code.contains("import { type Ref, Ref$$init } from"), "{}", out.code);
}

const RECIPES: &str = r#"let card = defineModifier { v in v.padding(.md) }

private func control(_ icon: IconComponent, _ look: ViewModifier?) -> View {
  Icon(icon).modifier(look ?? card)
}
"#;

#[test]
fn bloom_ui_types_and_recipes_need_no_import() {
    // M8: `ViewModifier`, `IconComponent`, `defineModifier` and `defineTokens` are BloomUI's,
    // so a package file names them without `import … from "@oxy.so/bloom-language"`.
    let root = package("bloom-ui", &[("Sources/Model/Controls.bloom", RECIPES)]);
    let path = root.join("Sources/Model/Controls.bloom");
    // The embedded language's declarations are the repository's (`node_modules`).
    let repo = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../..");
    let options = Options { root: Some(repo.clone()), ..Options::default() };
    let out = compile(RECIPES, &path.to_string_lossy(), &options);
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    assert!(
        out.code.contains(
            "import { defineModifier, type IconComponent, type ViewModifier } from \"@oxy.so/bloom-language\";"
        ),
        "{}",
        out.code
    );
    // A file that still imports them (the migration mode) keeps its one import.
    let written = format!(
        "import {{ type IconComponent, type ViewModifier, defineModifier }} from \"@oxy.so/bloom-language\"\n{RECIPES}"
    );
    std::fs::write(&path, &written).unwrap();
    let options = Options { allow_ts_imports: true, root: Some(repo), ..Options::default() };
    let out = compile(&written, &path.to_string_lossy(), &options);
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
}

#[test]
fn bloom_uis_action_is_the_action_bars_node_and_bloomdatas_a_mutation() {
    // R1: the standard library's optimistic change is `Mutation`, so `Action` in an
    // `ActionBar` is BloomUI's node, not a struct of the standard library.
    const BAR: &str = r#"func send(_ id: String) async -> Int { id.count }

public struct Bar: View {
  let like = Mutation.make("like") { (id: String) in await send(id) }
  var body: some View {
    ActionBar {
      ActionGroup {
        Action(.close, "Close").onPress { Task { await like.run("a") } }
      }
    }
  }
}
"#;
    let root = package("ui-action", &[("Sources/App/Bar.bloom", BAR)]);
    let path = root.join("Sources/App/Bar.bloom");
    let repo = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../..");
    let options = Options { root: Some(repo), ..Options::default() };
    let out = compile(BAR, &path.to_string_lossy(), &options);
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    assert!(out.code.contains("Action(RiCloseLine, \"Close\")"), "{}", out.code);
    assert!(out.code.contains("Mutation$$make(\"like\""), "{}", out.code);
}

#[test]
fn a_caught_error_casts_to_an_http_error() {
    // R6: `catch let err` is an `Error`; `catch let err as HTTPError` tests it (through
    // `HTTPError.cast`), and so does `err as? HTTPError`, whose `response` is the reply's.
    const STATUS: &str = r#"public func status(_ api: HTTPClient) async -> String {
  do {
    try await api.perform(.delete, "posts/1")
    return "ok"
  } catch let error as HTTPError {
    return "\(error.response.status) \(error.body)"
  } catch {
    if let http = error as? HTTPError { return http.message }
    return "offline"
  }
}

public func code(_ error: Error) -> Int { (error as? HTTPError)?.response.status ?? 0 }
"#;
    let root = package("http-cast", &[("Sources/Model/Status.bloom", STATUS)]);
    let path = root.join("Sources/Model/Status.bloom");
    let out = compile(STATUS, &path.to_string_lossy(), &Options::default());
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    for line in [
        "import { type HTTPClient, type HTTPError, HTTPClient$perform, HTTPError$$cast } from \"../../.bloom/std/Bloom/HTTP.bloom\";",
        "if (HTTPError$$cast($error) !== undefined) {\nconst error = HTTPError$$cast($error)!;",
        "const $t0 = HTTPError$$cast(error);",
        "(HTTPError$$cast(error))?.response.status ?? 0",
    ] {
        assert!(out.code.contains(line), "{line}\n{}", out.code);
    }
    // A type that does not say how is B0213, and an `Error` has no `response` of its own.
    const WRONG: &str = r#"public func wrong(_ error: Error) -> Int {
  let n = error as? Int
  error.response.status
}
"#;
    let root = package("http-cast-wrong", &[("Sources/Model/Wrong.bloom", WRONG)]);
    let path = root.join("Sources/Model/Wrong.bloom");
    let out = compile(WRONG, &path.to_string_lossy(), &Options::default());
    let codes: Vec<&str> = out.diagnostics.iter().map(|d| d.code).collect();
    assert_eq!(codes, ["B0213", "B0205"], "{}", rendered(&out));
}

#[test]
fn a_plural_count_is_a_double() {
    // M4: a TS number is a `Double`, and CLDR plural rules take decimals, so `count:` does;
    // an `Int` widens to it.
    let source = "public func label(_ n: Double, _ xs: [String]) -> String {\n  String(localized: \"feed.count\", count: n) + String(localized: \"feed.count\", count: xs.count)\n}\n";
    let en = r#"{ "feed.count": { "one": "{count} post", "other": "{count} posts" } }"#;
    let root = package(
        "i18n-double",
        &[("Resources/Localizable/en.json", en), ("Sources/Model/Label.bloom", source)],
    );
    let path = root.join("Sources/Model/Label.bloom");
    let out = compile(source, &path.to_string_lossy(), &Options::default());
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    assert!(out.code.contains("String$$localized(\"feed.count\", undefined, n)"), "{}", out.code);
}

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

/// A catalog rewritten without its modified time changing (two writes within one tick of
/// the kernel's coarse file clock, as on Seldon's CI VMs) is read again: the catalogs are
/// cached on their content, never on their modified time.
#[test]
fn a_catalog_rewritten_with_the_same_modified_time_is_read_again() {
    let source = "public func label() -> String {\n  String(localized: \"feed.bbbb\")\n}\n";
    let root = package(
        "i18n-rewritten",
        &[
            ("Resources/Localizable/en.json", r#"{ "feed.aaaa": "A" }"#),
            ("Sources/Model/Label.bloom", source),
        ],
    );
    let catalog = root.join("Resources/Localizable/en.json");
    let path = root.join("Sources/Model/Label.bloom");
    let before = compile(source, &path.to_string_lossy(), &Options::default());
    let codes: Vec<&str> = before.diagnostics.iter().map(|d| d.code).collect();
    assert_eq!(codes, ["B0840"], "feed.bbbb is not in the catalog yet: {}", rendered(&before));

    // The same length and the same modified time: only the content says it changed.
    let modified = std::fs::metadata(&catalog).unwrap().modified().unwrap();
    std::fs::write(&catalog, r#"{ "feed.bbbb": "B" }"#).unwrap();
    std::fs::File::options().write(true).open(&catalog).unwrap().set_modified(modified).unwrap();
    assert_eq!(std::fs::metadata(&catalog).unwrap().modified().unwrap(), modified);

    let after = compile(source, &path.to_string_lossy(), &Options::default());
    assert!(after.diagnostics.is_empty(), "the rewritten catalog is read: {}", rendered(&after));
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
            assert!(
                !source.contains("extern module") && !source.contains("Foreign"),
                "no bindings: {}",
                path.display()
            );
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

const ROW: &str = r#"public struct Row: View {
  let names: [String]
  let likes: Int
  let createdAt: Date
  @State private var on = true

  var body: some View {
    VStack(spacing: .sm) {
      ForEach(names) { name in
        Text(name).foregroundStyle(.muted).lineLimit(1)
      }
      HStack(alignment: .center, spacing: .xs) {
        Button(action: { on = !on }) { Label("\(likes)", icon: .like) }
        Label("Saved", icon: .bookmark)
        Text(createdAt, format: .relative)
        Toggle("Likes", isOn: $on)
        Toggle("Reposts", isOn: $on).description("When someone reposts you")
      }
      List(names) { name in Text(name) }
      ProgressView()
    }
  }
}
"#;

#[test]
fn bloomui_names_lower_onto_the_languages_nodes() {
    let root = package("bloomui", &[("Sources/Model/Row.bloom", ROW)]);
    let path = root.join("Sources/Model/Row.bloom");
    let out = compile(ROW, &path.to_string_lossy(), &Options::default());
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    let golden = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/stdlib/bloomui.ts.snap");
    if std::env::var_os("BLOOM_BLESS").is_some() {
        std::fs::write(&golden, &out.code).unwrap();
    }
    assert_eq!(std::fs::read_to_string(&golden).unwrap_or_default(), out.code);
}

/// The compiler's table of Bloom's icon set is the set: every `Ri*` glyph of
/// `src/icons/remix`, and the `./icons/<Name>Icon` exports.
#[test]
fn icons_are_blooms_icon_set() {
    let repo = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../..");
    let mut names: Vec<String> = std::fs::read_dir(repo.join("src/icons/remix"))
        .unwrap()
        .filter_map(|e| e.ok()?.file_name().into_string().ok())
        .filter(|n| n.starts_with("Ri") && n.ends_with(".tsx"))
        .map(|n| n.trim_end_matches(".tsx").to_string())
        .collect();
    let manifest = std::fs::read_to_string(repo.join("package.json")).unwrap();
    for line in manifest.lines() {
        let line = line.trim();
        if let Some(rest) = line.strip_prefix("\"./icons/")
            && let Some((name, _)) = rest.split_once('"')
            && name.ends_with("Icon")
            && name.chars().all(|c| c.is_ascii_alphanumeric())
        {
            names.push(name.to_string());
        }
    }
    names.sort();
    names.dedup();
    let body: String = names.iter().map(|n| format!("    \"{n}\",\n")).collect();
    let text = format!(
        "//! Generated by `BLOOM_BLESS=1 cargo test -p bloom_lang --test stdlib icons` from Bloom's icon set\n//! (`src/icons/remix`, and the `./icons/<Name>Icon` exports). Do not edit.\n\n/// Every glyph component of `@oxy.so/bloom/icons/<Name>`, sorted.\npub const ICONS: &[&str] = &[\n{body}];\n"
    );
    let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("src/icons.generated.rs");
    if std::env::var_os("BLOOM_BLESS").is_some() {
        std::fs::write(&path, &text).unwrap();
    }
    assert_eq!(
        std::fs::read_to_string(&path).unwrap_or_default(),
        text,
        "src/icons.generated.rs is stale: run BLOOM_BLESS=1 cargo test -p bloom_lang --test stdlib icons"
    );
}

#[test]
fn an_icon_outside_blooms_set_is_reported() {
    let badge = |glyph: &str| {
        format!("public struct Badge: View {{\n  var body: some View {{\n    Icon(.{glyph})\n  }}\n}}\n")
    };
    let good = badge("verified");
    let root = package("icons", &[("Sources/Model/Badge.bloom", &good)]);
    let path = root.join("Sources/Model/Badge.bloom");
    let out = compile(&good, &path.to_string_lossy(), &Options::default());
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    assert!(out.code.contains("@oxy.so/bloom/icons/RiVerifiedBadgeLine"), "{}", out.code);
    let bad = badge("noSuchGlyph");
    std::fs::write(&path, &bad).unwrap();
    let out = compile(&bad, &path.to_string_lossy(), &Options::default());
    let text = rendered(&out);
    assert!(
        text.contains("B0502") && text.contains("`.noSuchGlyph` is not an icon of Bloom's set"),
        "{text}"
    );
}

#[test]
fn an_icon_beside_its_written_glyph_import_is_that_import() {
    // M7: the glyph import `Icon(.close)` adds was a second `RiCloseLine` (B0217) whose
    // derived span rendered past the source, a panic in `Diagnostic::render`.
    let source = "import { RiCloseLine } from \"@oxy.so/bloom/icons/RiCloseLine\"\n\npublic struct CloseButton: View {\n  var body: some View {\n    VStack {\n      Icon(RiCloseLine)\n      Icon(.close)\n    }\n  }\n}\n";
    let root = package("icon-import", &[("Sources/Model/CloseButton.bloom", source)]);
    let path = root.join("Sources/Model/CloseButton.bloom");
    let options = Options { allow_ts_imports: true, ..Options::default() };
    let out = compile(source, &path.to_string_lossy(), &options);
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    assert_eq!(out.code.matches("from \"@oxy.so/bloom/icons/RiCloseLine\"").count(), 1, "{}", out.code);
}

const REFRESHABLE: &str = r#"func reload() async {
  try? await sleep(for: Duration.milliseconds(10))
}

public struct Feed: View {
  let names: [String]

  var body: some View {
    List(names) { name in Text(name) }
      .refreshable { await reload() }
  }
}
"#;

/// `List(…).refreshable { … }`: SwiftUI's pull to refresh, an async action. The view gets a
/// refreshing state; the pull sets it and runs the action, whose end clears it.
#[test]
fn refreshable_runs_an_async_action() {
    let root = package("refreshable", &[("Sources/Model/Feed.bloom", REFRESHABLE)]);
    let path = root.join("Sources/Model/Feed.bloom");
    let out = compile(REFRESHABLE, &path.to_string_lossy(), &Options::default());
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    assert!(out.code.contains("useState<boolean>(false)"), "{}", out.code);
    assert!(out.code.contains(".refreshable(refreshAction("), "{}", out.code);
    let golden = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/stdlib/refreshable.ts.snap");
    if std::env::var_os("BLOOM_BLESS").is_some() {
        std::fs::write(&golden, &out.code).unwrap();
    }
    assert_eq!(std::fs::read_to_string(&golden).unwrap_or_default(), out.code);
}

const MODEL: &str = r#"@Model public struct Note: Codable, Equatable {
  @Attribute(.unique) public let slug: String
  public var text: String
  public let createdAt: Date
  public var pinned: Bool = false
}

public func remember(_ note: Note) -> Bool {
  Note.store.insert(note)
  return Note.store.update(note.slug) { n in Note(slug: n.slug, text: n.text, createdAt: n.createdAt, pinned: true) }
}

public struct Notes: View {
  @Query(Note.self, sort: \.createdAt, order: .reverse, filter: { $0.pinned }) var pinned: [Note]
  @Query(Note.self, id: "welcome") var welcome: Note?

  var body: some View {
    VStack(spacing: .sm) {
      Text(welcome?.text ?? "")
      ForEach(pinned) { note in Text(note.text) }
    }
  }
}
"#;

/// `@Model` derives the type's store (`Note.store`, keyed by its `@Attribute(.unique)`
/// field), and a view's `@Query` reads it with the data layer's hooks.
#[test]
fn a_model_is_derived_and_queried() {
    let root = package("model", &[("Sources/Model/Notes.bloom", MODEL)]);
    let path = root.join("Sources/Model/Notes.bloom");
    let out = compile(MODEL, &path.to_string_lossy(), &Options::default());
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    assert!(out.code.contains("modelStore(\"Note\", \"slug\")"), "{}", out.code);
    assert!(out.code.contains("useQuery(Note$$store, \"createdAt\", \"reverse\""), "{}", out.code);
    let golden = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/stdlib/model.ts.snap");
    if std::env::var_os("BLOOM_BLESS").is_some() {
        std::fs::write(&golden, &out.code).unwrap();
    }
    assert_eq!(std::fs::read_to_string(&golden).unwrap_or_default(), out.code);
}

#[test]
fn a_model_without_a_string_key_is_reported() {
    for (source, expected) in [
        ("@Model public struct A: Codable {\n  public let name: String\n}\n", "has no key"),
        ("@Model public struct B: Codable {\n  public let id: Int\n}\n", "not a `String`"),
    ] {
        let root = package("model-key", &[("Sources/Model/A.bloom", source)]);
        let path = root.join("Sources/Model/A.bloom");
        let out = compile(source, &path.to_string_lossy(), &Options::default());
        assert!(
            out.diagnostics.iter().any(|d| d.code == "B0831" && d.message.contains(expected)),
            "{}",
            rendered(&out)
        );
    }
}

const ASYNC_LET: &str = r#"public func profile(_ id: String) async throws -> String {
  try await sleep(for: Duration.milliseconds(1.0))
  return "profile \(id)"
}

public func count(_ id: String) async -> Int {
  id.count
}

/// Both calls start at once; the result waits for the two.
public func header(_ id: String) async throws -> String {
  async let name = profile(id)
  async let posts = count(id)
  let (n, p) = try await (name, posts)
  return "\(n): \(p)"
}

public func one(_ id: String) async -> Int {
  async let posts = count(id)
  return await posts
}
"#;

/// `async let`: each call starts where it is declared, and `await` reads it (a tuple of
/// them, together); errors surface at the `try await`.
#[test]
fn async_let_starts_now_and_is_read_with_await() {
    let root = package("async-let", &[("Sources/Model/Header.bloom", ASYNC_LET)]);
    let path = root.join("Sources/Model/Header.bloom");
    let out = compile(ASYNC_LET, &path.to_string_lossy(), &Options::default());
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    assert!(out.code.contains("const name = profile(id);\nname.catch(() => {});"), "{}", out.code);
    assert!(out.code.contains("(await Promise.all([name, posts]))"), "{}", out.code);
    let golden = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/stdlib/async-let.ts.snap");
    if std::env::var_os("BLOOM_BLESS").is_some() {
        std::fs::write(&golden, &out.code).unwrap();
    }
    assert_eq!(std::fs::read_to_string(&golden).unwrap_or_default(), out.code);
}

#[test]
fn an_async_let_is_awaited_with_try_once_in_its_scope() {
    let head = "public func profile(_ id: String) async throws -> String { id }\n\n";
    for (body, expected) in [
        (
            "public func a() async throws -> String {\n  async let p = profile(\"x\")\n  return \"\"\n}\n",
            "is never awaited",
        ),
        (
            "public func b() async throws -> String {\n  async let p = profile(\"x\")\n  return await p\n}\n",
            "not awaited with `try`",
        ),
        (
            "public func c() async throws -> String {\n  async let p = profile(\"x\")\n  let q = p\n  return try await p\n}\n",
            "read it with `await p`",
        ),
        (
            "public func d() throws -> String {\n  async let p = profile(\"x\")\n  return \"\"\n}\n",
            "only allowed in an async function",
        ),
    ] {
        let source = format!("{head}{body}");
        let root = package("async-let-errors", &[("Sources/Model/A.bloom", &source)]);
        let path = root.join("Sources/Model/A.bloom");
        let out = compile(&source, &path.to_string_lossy(), &Options::default());
        assert!(
            out.diagnostics.iter().any(|d| d.message.contains(expected)),
            "{expected}:\n{}",
            rendered(&out)
        );
    }
}

const ACTOR: &str = r#"public actor Counter {
  public var count: Int = 0

  public func increment() -> Int {
    count += 1
    return count
  }

  public func add(_ n: Int) async throws -> Int {
    try await sleep(for: Duration.milliseconds(1.0))
    count += n
    return increment()
  }
}

public func tick(_ counter: Counter) async throws -> Int {
  let a = await counter.increment()
  let b = try await counter.add(2)
  return a + b
}
"#;

/// `actor`: a class whose methods run one at a time through its queue, awaited from
/// outside; its own members call one another directly.
#[test]
fn an_actor_serialises_its_methods() {
    let root = package("actor", &[("Sources/Model/Counter.bloom", ACTOR)]);
    let path = root.join("Sources/Model/Counter.bloom");
    let out = compile(ACTOR, &path.to_string_lossy(), &Options::default());
    assert!(out.diagnostics.is_empty(), "{}", rendered(&out));
    assert!(out.code.contains("actorIsolated(self, "), "{}", out.code);
    assert!(out.code.contains("Counter$increment$isolated(self)"), "{}", out.code);
    let golden = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/stdlib/actor.ts.snap");
    if std::env::var_os("BLOOM_BLESS").is_some() {
        std::fs::write(&golden, &out.code).unwrap();
    }
    assert_eq!(std::fs::read_to_string(&golden).unwrap_or_default(), out.code);
    // From outside, a call is awaited.
    let sync = format!("{ACTOR}\npublic func now(_ counter: Counter) -> Int {{ counter.increment() }}\n");
    let out = compile(&sync, &path.to_string_lossy(), &Options::default());
    assert!(!out.diagnostics.is_empty(), "a call without await compiles:\n{}", out.code);
}
