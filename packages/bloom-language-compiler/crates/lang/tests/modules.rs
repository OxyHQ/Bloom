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

/// A `private` declaration is its file's only, as TS's file scope is: it shadows a sibling's
/// public name inside its own file, the sibling keeps its own, and a third file reads the
/// public one. Two internal or public declarations of one name stay B0807.
#[test]
fn a_private_declaration_shadows_a_sibling_in_its_own_file() {
    let public = "public struct PostActions: View {\n  let count: Int\n  var body: some View { Text(\"\\(count)\") }\n}\n";
    let local = "private struct PostActions: View {\n  let label: String\n  var body: some View { Text(label) }\n}\n\npublic struct PostItem: View {\n  var body: some View { PostActions(label: \"row\") }\n}\n";
    let third = "public struct Detail: View {\n  var body: some View { PostActions(count: 2) }\n}\n";
    let root = package(
        "private-shadow",
        &[
            ("Package.bloom", MANIFEST),
            ("Sources/Feed/PostActions.bloom", public),
            ("Sources/Feed/PostItem.bloom", local),
            ("Sources/Feed/Detail.bloom", third),
        ],
    );
    let item = build(&root, "Sources/Feed/PostItem.bloom", &Options::default());
    assert!(item.diagnostics.is_empty(), "{:?}", item.diagnostics);
    assert!(!item.code.contains("./PostActions.bloom"), "{}", item.code);
    assert!(item.code.contains("PostActions({ label: \"row\" })"), "{}", item.code);
    for file in ["Sources/Feed/PostActions.bloom", "Sources/Feed/Detail.bloom"] {
        let out = build(&root, file, &Options::default());
        assert!(out.diagnostics.is_empty(), "{file}: {:?}", out.diagnostics);
    }
    let detail = build(&root, "Sources/Feed/Detail.bloom", &Options::default());
    assert!(detail.code.contains("import { PostActions } from \"./PostActions.bloom\";"), "{}", detail.code);
    // An internal one beside the public one is still two declarations of the module's name.
    let internal = local.replace("private struct", "struct");
    let root = package(
        "internal-twice",
        &[
            ("Package.bloom", MANIFEST),
            ("Sources/Feed/PostActions.bloom", public),
            ("Sources/Feed/PostItem.bloom", &internal),
        ],
    );
    assert_eq!(codes(&build(&root, "Sources/Feed/PostItem.bloom", &Options::default())), ["B0807"]);
}

const INTERNAL_ROW: &str = "view Line(title: String) {\n  body {\n    Text(title)\n  }\n}\n";
const USES_ROW: &str =
    "public view Lines {\n  body {\n    VStack {\n      Line(title: \"One\")\n    }\n  }\n}\n";

#[test]
fn platform_files_are_alternatives_not_siblings() {
    let list = |text: &str| {
        format!(
            "public struct NotificationsList: View {{\n  let count: Int\n  var body: some View {{ Text(\"{text}\") }}\n}}\nprivate func helper() -> Int {{ 1 }}\n"
        )
    };
    let root = package(
        "platforms",
        &[
            ("Package.bloom", MANIFEST),
            ("Sources/Feed/NotificationsList.native.bloom", &list("native")),
            ("Sources/Feed/NotificationsList.web.bloom", &list("web")),
            (
                "Sources/Feed/Inbox.bloom",
                "public struct Inbox: View {\n  var body: some View { NotificationsList(count: 3) }\n}\n",
            ),
        ],
    );
    // One is compiled per platform (Metro's `.native`/`.web`), so they declare the same names.
    for file in ["Sources/Feed/NotificationsList.native.bloom", "Sources/Feed/NotificationsList.web.bloom"] {
        let out = build(&root, file, &Options::default());
        assert!(out.diagnostics.is_empty(), "{file}: {:?}", out.diagnostics);
    }
    // The module's other files import it by its base name, and Metro picks the platform's.
    let out = build(&root, "Sources/Feed/Inbox.bloom", &Options::default());
    assert!(out.diagnostics.is_empty(), "{:?}", out.diagnostics);
    assert!(out.code.contains("import { NotificationsList } from \"./NotificationsList\";"), "{}", out.code);
}

#[test]
fn a_class_is_imported_with_its_init() {
    // M9: a reference held in `@State` is often a class of another file; `Box(0)` is its
    // `init` (`Box$$init`), imported as a value beside the type.
    let root = package(
        "class-init",
        &[
            ("Package.bloom", MANIFEST),
            (
                "Sources/Feed/Box.bloom",
                "public final class Box<T> {\n  public var value: T\n  public init(_ value: T) { self.value = value }\n}\n",
            ),
            (
                "Sources/Feed/Ticker.bloom",
                "public struct Ticker: View {\n  @State private var timer = Box(0)\n  var body: some View {\n    Button(Text(\"Tick\")).onPress { timer.value += 1 }\n  }\n}\n",
            ),
        ],
    );
    let out = build(&root, "Sources/Feed/Ticker.bloom", &Options::default());
    assert!(out.diagnostics.is_empty(), "{:?}", out.diagnostics);
    assert!(out.code.contains("import { type Box, Box$$init } from \"./Box.bloom\";"), "{}", out.code);
    assert!(out.code.contains("useState<Box<number>>(() => Box$$init(0))"), "{}", out.code);
}

fn app(imports: &str) -> String {
    format!("{imports}\n\npublic view Home {{\n  body {{\n    Lines()\n  }}\n}}\n")
}

#[test]
fn internal_is_the_module_and_private_the_file() {
    let root = package(
        "access",
        &[
            ("Package.bloom", MANIFEST),
            ("Sources/Feed/Line.bloom", INTERNAL_ROW),
            ("Sources/Feed/Rows.bloom", USES_ROW),
        ],
    );
    let out = build(&root, "Sources/Feed/Rows.bloom", &Options::default());
    assert!(out.diagnostics.is_empty(), "{:?}", out.diagnostics);
    assert!(out.code.contains("import { Line } from \"./Line.bloom\";"), "{}", out.code);
    let row = build(&root, "Sources/Feed/Line.bloom", &Options::default());
    assert!(
        row.code.contains("export const Line"),
        "an internal item is exported for its module: {}",
        row.code
    );

    std::fs::write(root.join("Sources/Feed/Line.bloom"), format!("private {INTERNAL_ROW}")).unwrap();
    let out = build(&root, "Sources/Feed/Rows.bloom", &Options::default());
    assert_eq!(codes(&out), ["B0804"], "{:?}", out.diagnostics);
    assert!(
        out.diagnostics[0].message.contains("private to Sources/Feed/Line.bloom"),
        "{}",
        out.diagnostics[0].message
    );
}

#[test]
fn imports_name_modules_and_see_their_public_items() {
    let root = package(
        "imports",
        &[
            ("Package.bloom", MANIFEST),
            ("Sources/Feed/Line.bloom", INTERNAL_ROW),
            ("Sources/Feed/Rows.bloom", USES_ROW),
            ("Sources/Demo/Home.bloom", &app("import Bloom\nimport Demo.Feed")),
        ],
    );
    let out = build(&root, "Sources/Demo/Home.bloom", &Options::default());
    assert!(out.diagnostics.is_empty(), "{:?}", out.diagnostics);
    assert!(out.code.contains("import { Lines } from \"../Feed/Rows.bloom\";"), "{}", out.code);

    // Not imported: the checker's "cannot find" says which import it needs.
    std::fs::write(root.join("Sources/Demo/Home.bloom"), app("import Bloom")).unwrap();
    let out = build(&root, "Sources/Demo/Home.bloom", &Options::default());
    let missing = out.diagnostics.iter().find(|d| d.code == "B0202").expect("cannot find `Lines`");
    assert_eq!(missing.help.as_deref(), Some("`Lines` is in module `Feed`: add `import Feed`"));

    // An internal item of another module.
    std::fs::write(
        root.join("Sources/Demo/Home.bloom"),
        "import Feed\n\npublic view Home {\n  body {\n    Line(title: \"x\")\n  }\n}\n",
    )
    .unwrap();
    let out = build(&root, "Sources/Demo/Home.bloom", &Options::default());
    assert_eq!(codes(&out), ["B0803"], "{:?}", out.diagnostics);
    assert_eq!(out.diagnostics[0].message, "`Line` is internal to module `Feed`");
}

#[test]
fn an_import_is_a_declared_dependency() {
    let manifest = MANIFEST.replace(".module(\"Feed\")", ".module(\"Feed\"),\n    .module(\"Posts\")");
    let root = package(
        "undeclared",
        &[
            ("Package.bloom", &manifest),
            ("Sources/Posts/Post.bloom", "public view Post {\n  body {\n    Text(\"p\")\n  }\n}\n"),
            ("Sources/Feed/Rows.bloom", "import Posts\nimport Feeds\nimport BloomData\nimport Feed\n"),
        ],
    );
    let out = build(&root, "Sources/Feed/Rows.bloom", &Options::default());
    let found: Vec<(&str, String)> =
        out.diagnostics.iter().map(|d| (d.code, d.help.clone().unwrap_or_default())).collect();
    assert_eq!(
        found[0],
        ("B0802", "add \"Posts\" to `.module(\"Feed\", dependencies: […])` in Package.bloom".into())
    );
    assert_eq!(found[1], ("B0801", "did you mean `Feed`?".into()));
    assert_eq!(found[2], ("B0802", "run `bloom add BloomData`".into()));
    assert_eq!(found[3].0, "B0801", "its own module: {found:?}");
}

const SENTRY: &str = r#"// The binding module of a JS package.
extern module "fake-sentry" {
  @extern("init") public func initialize(_ dsn: String)
  @extern("captureException") public func capture(_ message: String) -> String
  public let SDK_VERSION: String
}
"#;

const FAKE_SENTRY: &str = "export declare function init(dsn: string): void;\nexport declare function captureException(message: string): string;\nexport declare const SDK_VERSION: string;\n";

#[test]
fn a_binding_module_lowers_its_extern_module() {
    let root = package(
        "bindings",
        &[
            ("Package.bloom", MANIFEST),
            ("Bindings/Sentry/Sentry.bloom", SENTRY),
            ("node_modules/fake-sentry/index.d.ts", FAKE_SENTRY),
            (
                "node_modules/fake-sentry/package.json",
                "{ \"name\": \"fake-sentry\", \"types\": \"index.d.ts\" }",
            ),
            (
                "Sources/Demo/Report.bloom",
                "import Sentry\n\npublic func report(_ message: String) -> String {\n  initialize(\"dsn\")\n  return capture(\"\\(SDK_VERSION): \\(message)\")\n}\n",
            ),
        ],
    );
    let out = build(&root, "Bindings/Sentry/Sentry.bloom", &Options::default());
    assert!(out.diagnostics.is_empty(), "{:?}", out.diagnostics);
    assert!(out.code.contains("import * as __extern0 from \"fake-sentry\";"), "{}", out.code);
    assert!(out.code.contains("export function initialize("), "{}", out.code);
    let app = build(&root, "Sources/Demo/Report.bloom", &Options::default());
    assert!(app.diagnostics.is_empty(), "{:?}", app.diagnostics);
    assert!(app.code.contains("from \"../../Bindings/Sentry/Sentry.bloom\""), "{}", app.code);
    assert!(!app.code.contains("fake-sentry"), "the app never names the JS package: {}", app.code);
}

#[test]
fn an_extern_function_has_no_body() {
    let root = package(
        "extern-body",
        &[
            ("Package.bloom", MANIFEST),
            (
                "Bindings/Sentry/Sentry.bloom",
                "extern module \"fake-sentry\" {\n  public func start() { print(\"x\") }\n  public async func flush()\n}\n",
            ),
        ],
    );
    let out = build(&root, "Bindings/Sentry/Sentry.bloom", &Options::default());
    assert!(codes(&out).starts_with(&["B0820", "B0821"]), "{:?}", out.diagnostics);
}

#[test]
fn bind_writes_a_binding_module_that_checks() {
    let dts = "export interface Options { dsn: string; tracesSampleRate?: number }\nexport declare function init(options: Options): void;\nexport declare function flush(timeout: number): Promise<boolean>;\nexport declare const SDK_VERSION: string;\n";
    let root = package(
        "bindgen",
        &[
            ("Package.bloom", MANIFEST),
            ("node_modules/fake-sentry/index.d.ts", dts),
            (
                "node_modules/fake-sentry/package.json",
                "{ \"name\": \"fake-sentry\", \"types\": \"index.d.ts\" }",
            ),
        ],
    );
    let from = root.join("Bindings/Sentry/Sentry.bloom");
    let binding = bloom_lang::bindgen::generate("fake-sentry", "6.2.0", &from, &Options::default()).unwrap();
    let text = &binding.text;
    assert!(text.contains("extern module \"fake-sentry\" {"), "{text}");
    assert!(text.contains("  public func init(_ options: Options)\n"), "{text}");
    assert!(text.contains("  public func flush(_ timeout: Float) async throws -> Bool\n"), "{text}");
    assert!(text.contains("  public let SDK_VERSION: String\n"), "{text}");
    assert!(
        text.contains("  public struct Options {\n    public var dsn: String\n    public var tracesSampleRate: Float?\n  }"),
        "{text}"
    );
    std::fs::create_dir_all(from.parent().unwrap()).unwrap();
    // `async throws` checks once `throws` functions take `try` (the surface's work).
    let checkable: String =
        text.lines().filter(|l| !l.contains("async throws")).map(|l| format!("{l}\n")).collect();
    std::fs::write(&from, checkable).unwrap();
    let out = build(&root, "Bindings/Sentry/Sentry.bloom", &Options::default());
    assert!(out.diagnostics.is_empty(), "{text}\n{:?}", out.diagnostics);
}

#[test]
fn tests_lower_onto_the_runtime() {
    let manifest = MANIFEST.replace(
        ".module(\"Feed\")",
        ".module(\"Feed\"),\n    .tests(\"FeedTests\", dependencies: [\"Feed\"])",
    );
    let root = package(
        "tests",
        &[
            ("Package.bloom", &manifest),
            ("Sources/Feed/Count.bloom", "public func double(_ n: Int) -> Int {\n  n * 2\n}\n"),
            (
                "Tests/FeedTests/CountTests.bloom",
                "import Feed\n\ntest(\"doubles\") {\n  let n = double(2)\n  #expect(n == 4)\n  #expect(n > 3)\n}\n",
            ),
            ("Sources/Feed/Stray.bloom", "test(\"misplaced\") {\n  #expect(true)\n}\n"),
        ],
    );
    let out = build(&root, "Tests/FeedTests/CountTests.bloom", &Options::default());
    assert!(
        out.diagnostics.is_empty() && out.warnings.is_empty(),
        "{:?} {:?}",
        out.diagnostics,
        out.warnings
    );
    let code = &out.code;
    assert!(code.contains("import * as __testing from \"bloom:testing\";"), "{code}");
    assert!(code.contains("__testing.expectEqual(n, 4, \"n == 4\")"), "{code}");
    assert!(code.contains("__testing.expect(n > 3, \"n > 3\")"), "{code}");
    assert!(code.contains("__testing.test(\"doubles\", __test0)"), "{code}");
    let stray = build(&root, "Sources/Feed/Stray.bloom", &Options::default());
    assert_eq!(codes(&stray), ["B0823"]);
}

#[test]
fn foreign_types_stay_in_binding_modules() {
    let root = package(
        "foreign",
        &[
            ("Package.bloom", MANIFEST),
            ("Sources/Feed/Raw.bloom", "public func raw(_ x: Foreign<\"unknown\">) -> Int {\n  1\n}\n"),
            ("Bindings/Sentry/Raw.bloom", "public func raw(_ x: Foreign<\"unknown\">) -> Int {\n  1\n}\n"),
        ],
    );
    assert_eq!(codes(&build(&root, "Sources/Feed/Raw.bloom", &Options::default())), ["B0822"]);
    assert!(build(&root, "Bindings/Sentry/Raw.bloom", &Options::default()).diagnostics.is_empty());
}
