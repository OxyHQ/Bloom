//! The standard library (ADR 0002, section 3): `.bloom` modules that ship with the
//! compiler, written over one small JS file of primitives (`runtime.ts`) that only they
//! see (their `extern module`).
//!
//! The sources live in `stdlib/Bloom/` and are embedded here. A package's files see
//! every `public` name of them without an import (`Bloom` is the implicit core): the
//! compiler writes them under `<package>/.bloom/std/Bloom/` (once per process, only when
//! they differ), and a file's uses import exactly the names it uses from there, as for
//! any module. A name the package declares itself shadows the standard library's.

use std::cell::RefCell;
use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

/// The module name the standard library's names come from (diagnostics, the reference).
pub const MODULE: &str = "Bloom";

/// The standard library's files: (file name, contents), in reference order.
pub const SOURCES: &[(&str, &str)] = &[
    ("Core.bloom", include_str!("../../../stdlib/Bloom/Core.bloom")),
    ("Math.bloom", include_str!("../../../stdlib/Bloom/Math.bloom")),
    ("Time.bloom", include_str!("../../../stdlib/Bloom/Time.bloom")),
    ("URL.bloom", include_str!("../../../stdlib/Bloom/URL.bloom")),
    ("JSON.bloom", include_str!("../../../stdlib/Bloom/JSON.bloom")),
    ("HTTP.bloom", include_str!("../../../stdlib/Bloom/HTTP.bloom")),
    ("Storage.bloom", include_str!("../../../stdlib/Bloom/Storage.bloom")),
    ("Image.bloom", include_str!("../../../stdlib/Bloom/Image.bloom")),
    ("Video.bloom", include_str!("../../../stdlib/Bloom/Video.bloom")),
    ("Splash.bloom", include_str!("../../../stdlib/Bloom/Splash.bloom")),
    ("Island.bloom", include_str!("../../../stdlib/Bloom/Island.bloom")),
    ("Concurrency.bloom", include_str!("../../../stdlib/Bloom/Concurrency.bloom")),
    ("Regex.bloom", include_str!("../../../stdlib/Bloom/Regex.bloom")),
    ("Logger.bloom", include_str!("../../../stdlib/Bloom/Logger.bloom")),
    ("Localization.bloom", include_str!("../../../stdlib/Bloom/Localization.bloom")),
    ("Navigation.bloom", include_str!("../../../stdlib/Bloom/Navigation.bloom")),
    ("Data.bloom", include_str!("../../../stdlib/Bloom/Data.bloom")),
    ("runtime.ts", include_str!("../../../stdlib/Bloom/runtime.ts")),
    ("routing.ts", include_str!("../../../stdlib/Bloom/routing.ts")),
    ("players.ts", include_str!("../../../stdlib/Bloom/players.ts")),
    ("routing-expo.ts", include_str!("../../../stdlib/Bloom/routing-expo.ts")),
    ("router.ts", include_str!("../../../stdlib/Bloom/router.ts")),
    ("models.ts", include_str!("../../../stdlib/Bloom/models.ts")),
    // The language's string helpers, as they are (one source): `runtime.ts` and a package's
    // emitted files read them here, so counting a string never loads the UI runtime.
    ("text.ts", include_str!("../../../../bloom-language/src/text.ts")),
    (
        "generated/graphemes.generated.ts",
        include_str!("../../../../bloom-language/src/generated/graphemes.generated.ts"),
    ),
];

/// The standard library's own manifest: its module and its native modules (`.native`).
pub const MANIFEST: &str = include_str!("../../../stdlib/Package.bloom");

/// The native modules' implementations, by path under the standard library's directory.
pub const NATIVE_SOURCES: &[(&str, &str)] = &[
    (
        "Native/BloomStorage/android/so/oxy/bloom/storage/Databases.kt",
        include_str!("../../../stdlib/Bloom/Native/BloomStorage/android/so/oxy/bloom/storage/Databases.kt"),
    ),
    (
        "Native/BloomStorage/android/so/oxy/bloom/storage/BloomStorageModule.kt",
        include_str!(
            "../../../stdlib/Bloom/Native/BloomStorage/android/so/oxy/bloom/storage/BloomStorageModule.kt"
        ),
    ),
    (
        "Native/BloomStorage/android/so/oxy/bloom/storage/BloomStoragePackage.kt",
        include_str!(
            "../../../stdlib/Bloom/Native/BloomStorage/android/so/oxy/bloom/storage/BloomStoragePackage.kt"
        ),
    ),
    (
        "Native/BloomStorage/android/so/oxy/bloom/storage/Stores.kt",
        include_str!("../../../stdlib/Bloom/Native/BloomStorage/android/so/oxy/bloom/storage/Stores.kt"),
    ),
    (
        "Native/BloomImage/android/so/oxy/bloom/image/BloomImageModule.kt",
        include_str!(
            "../../../stdlib/Bloom/Native/BloomImage/android/so/oxy/bloom/image/BloomImageModule.kt"
        ),
    ),
    (
        "Native/BloomImage/android/so/oxy/bloom/image/BloomImagePackage.kt",
        include_str!(
            "../../../stdlib/Bloom/Native/BloomImage/android/so/oxy/bloom/image/BloomImagePackage.kt"
        ),
    ),
    (
        "Native/BloomImage/android/so/oxy/bloom/image/BloomImageView.kt",
        include_str!("../../../stdlib/Bloom/Native/BloomImage/android/so/oxy/bloom/image/BloomImageView.kt"),
    ),
    (
        "Native/BloomImage/android/so/oxy/bloom/image/BloomImageViewManager.kt",
        include_str!(
            "../../../stdlib/Bloom/Native/BloomImage/android/so/oxy/bloom/image/BloomImageViewManager.kt"
        ),
    ),
    (
        "Native/BloomImage/android/so/oxy/bloom/image/Pipeline.kt",
        include_str!("../../../stdlib/Bloom/Native/BloomImage/android/so/oxy/bloom/image/Pipeline.kt"),
    ),
    (
        "Native/BloomVideo/android/dependencies.gradle",
        include_str!("../../../stdlib/Bloom/Native/BloomVideo/android/dependencies.gradle"),
    ),
    (
        "Native/BloomVideo/android/so/oxy/bloom/video/BloomVideoModule.kt",
        include_str!(
            "../../../stdlib/Bloom/Native/BloomVideo/android/so/oxy/bloom/video/BloomVideoModule.kt"
        ),
    ),
    (
        "Native/BloomVideo/android/so/oxy/bloom/video/BloomVideoPackage.kt",
        include_str!(
            "../../../stdlib/Bloom/Native/BloomVideo/android/so/oxy/bloom/video/BloomVideoPackage.kt"
        ),
    ),
    (
        "Native/BloomVideo/android/so/oxy/bloom/video/Startup.kt",
        include_str!("../../../stdlib/Bloom/Native/BloomVideo/android/so/oxy/bloom/video/Startup.kt"),
    ),
    (
        "Native/BloomVideo/android/so/oxy/bloom/video/BloomVideoView.kt",
        include_str!("../../../stdlib/Bloom/Native/BloomVideo/android/so/oxy/bloom/video/BloomVideoView.kt"),
    ),
    (
        "Native/BloomVideo/android/so/oxy/bloom/video/BloomVideoViewManager.kt",
        include_str!(
            "../../../stdlib/Bloom/Native/BloomVideo/android/so/oxy/bloom/video/BloomVideoViewManager.kt"
        ),
    ),
    (
        "Native/BloomVideo/android/so/oxy/bloom/video/Players.kt",
        include_str!("../../../stdlib/Bloom/Native/BloomVideo/android/so/oxy/bloom/video/Players.kt"),
    ),
    (
        "Native/BloomSplash/android/so/oxy/bloom/splash/BloomSplashModule.kt",
        include_str!(
            "../../../stdlib/Bloom/Native/BloomSplash/android/so/oxy/bloom/splash/BloomSplashModule.kt"
        ),
    ),
    (
        "Native/BloomSplash/android/so/oxy/bloom/splash/BloomSplashPackage.kt",
        include_str!(
            "../../../stdlib/Bloom/Native/BloomSplash/android/so/oxy/bloom/splash/BloomSplashPackage.kt"
        ),
    ),
    (
        "Native/BloomSplash/android/so/oxy/bloom/splash/SplashHold.kt",
        include_str!("../../../stdlib/Bloom/Native/BloomSplash/android/so/oxy/bloom/splash/SplashHold.kt"),
    ),
];

/// The `extern native` interfaces the standard library declares.
pub fn native_modules() -> Vec<crate::native::Module> {
    SOURCES
        .iter()
        .filter(|(n, _)| n.ends_with(".bloom"))
        .flat_map(|(_, text)| crate::native::modules(text).unwrap_or_default())
        .collect()
}

/// The generated files beside the sources: each native interface's codegen specs and bridge.
fn generated() -> Vec<(String, String)> {
    native_modules().iter().flat_map(crate::native::Module::generated).collect()
}

thread_local! {
    static WRITTEN: RefCell<BTreeSet<PathBuf>> = const { RefCell::new(BTreeSet::new()) };
}

/// Where the standard library is written for the package at `root`.
pub fn dir(root: &Path) -> PathBuf {
    root.join(".bloom").join("std").join(MODULE)
}

/// Writes the standard library under `root` (when it differs from what is there) and
/// returns its `.bloom` files.
pub fn ensure(root: &Path) -> Vec<PathBuf> {
    let dir = dir(root);
    let first = WRITTEN.with(|w| w.borrow_mut().insert(dir.clone()));
    if first {
        let _ = std::fs::create_dir_all(&dir);
        let generated = generated();
        let files = SOURCES
            .iter()
            .chain(NATIVE_SOURCES)
            .map(|(n, c)| (*n, *c))
            .chain(generated.iter().map(|(n, c)| (n.as_str(), c.as_str())));
        for (name, contents) in files {
            let path = dir.join(name);
            if let Some(parent) = path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            if std::fs::read_to_string(&path).ok().as_deref() == Some(contents) {
                continue;
            }
            // Written whole, then renamed: a bundler's workers may read it meanwhile.
            let tmp = path.with_file_name(format!(
                ".{}.{}.tmp",
                path.file_name().unwrap_or_default().to_string_lossy(),
                std::process::id()
            ));
            if std::fs::write(&tmp, contents).is_ok() {
                let _ = std::fs::rename(&tmp, &path);
            }
        }
    }
    SOURCES.iter().filter(|(n, _)| n.ends_with(".bloom")).map(|(n, _)| dir.join(n)).collect()
}

/// Where the file at `path` imports the string helpers from: the standard library's `text.ts`
/// in a package whose standard library is written (`./text` from the standard library itself),
/// `None` elsewhere (the language's index has them too).
pub fn text_module(path: &Path) -> Option<String> {
    let path = crate::modules::absolute(path);
    if contains(&path) {
        return Some("./text".into());
    }
    let root = crate::modules::find_root(&path)?;
    let text = dir(&root).join("text.ts");
    if !text.is_file() {
        return None;
    }
    let from = path.parent()?;
    let specifier = crate::modules::relative_specifier(from, &dir(&root).join("text"));
    Some(specifier)
}

/// `path` is one of the standard library's files.
pub fn contains(path: &Path) -> bool {
    path.parent().is_some_and(|p| p.ends_with(Path::new(".bloom/std").join(MODULE)))
}

// ---- the reference ---------------------------------------------------------------

/// `text` cut where its body or value starts: the first `{` or ` = ` outside brackets.
fn signature(text: &str) -> String {
    let mut depth = 0i32;
    let bytes = text.as_bytes();
    let mut in_string = false;
    for (i, &b) in bytes.iter().enumerate() {
        match b {
            b'"' => in_string = !in_string,
            _ if in_string => {}
            b'(' | b'[' | b'<' => depth += 1,
            b')' | b']' => depth -= 1,
            b'>' if i > 0 && bytes[i - 1] != b'-' => depth -= 1,
            b'{' if depth <= 0 => return text[..i].trim_end().to_string(),
            b'=' if depth <= 0 && i > 0 && bytes[i - 1] == b' ' && bytes.get(i + 1) == Some(&b' ') => {
                return text[..i].trim_end().to_string();
            }
            _ => {}
        }
    }
    text.trim_end().to_string()
}

fn parens_open(text: &str) -> bool {
    text.matches('(').count() > text.matches(')').count()
}

/// The `// …` lines that open a file, as Markdown (an indented block is code).
fn intro(source: &str) -> String {
    let mut out = String::new();
    let mut code = false;
    for line in source.lines() {
        let Some(rest) = line.strip_prefix("//").filter(|_| !line.starts_with("///")) else { break };
        let rest = rest.strip_prefix(' ').unwrap_or(rest);
        let indented = rest.starts_with("    ");
        if indented && !code {
            out.push_str("```swift\n");
            code = true;
        } else if !indented && code && !rest.is_empty() {
            out.push_str("```\n\n");
            code = false;
        }
        if code {
            if !rest.is_empty() {
                out.push_str(&rest[4..]);
            }
        } else {
            out.push_str(rest);
        }
        out.push('\n');
    }
    if code {
        while out.ends_with("\n\n") {
            out.pop();
        }
        out.push_str("```\n");
    }
    out.trim_end().to_string()
}

/// The reference of the standard library (`docs/bloom-stdlib.mdx`), from its sources:
/// each file's opening comment, then its public types, members and functions with
/// their `///` docs.
pub fn reference() -> String {
    let mut out = String::from(
        "---\ntitle: The Bloom standard library\ndescription: Every public type, member and function of the modules that ship with the toolchain (ADR 0002, section 3). Generated from stdlib/Bloom.\n---\n\n{/* Generated by `BLOOM_BLESS=1 cargo test -p bloom_lang --test stdlib reference`, from packages/bloom-language-compiler/stdlib/Bloom/*.bloom. Do not edit by hand. */}\n\n# The Bloom standard library\n\nThe standard library is implicit in every package file: its names need no `import`, and a\nfile imports exactly what it uses. A name the package declares itself shadows it. It is\nwritten in Bloom over a small set of JS primitives (`stdlib/Bloom/runtime.ts`) that only it\nsees. Members marked `static` are called on the type (`Date.now`, `URL.parse(…)`); the others\non a value (`\"a b\".components(separatedBy: \" \")`).\n",
    );
    for (name, source) in SOURCES.iter().filter(|(n, _)| n.ends_with(".bloom")) {
        let module = name.trim_end_matches(".bloom");
        out.push_str(&format!("\n## {module}\n\n"));
        let lead = intro(source);
        if !lead.is_empty() {
            out.push_str(&lead);
            out.push('\n');
        }
        let lines: Vec<&str> = source.lines().collect();
        let mut docs: Vec<String> = Vec::new();
        // The open `extension X` / `struct X` / `enum X` at column 0, and whether it is listed.
        let mut container: Option<bool> = None;
        let mut i = 0;
        while i < lines.len() {
            let line = lines[i];
            let trimmed = line.trim_start();
            i += 1;
            if let Some(doc) = trimmed.strip_prefix("///") {
                docs.push(doc.trim().to_string());
                continue;
            }
            if line == "}" {
                container = None;
                docs.clear();
                continue;
            }
            let top = !line.starts_with(' ');
            if top && line.starts_with("extern module") {
                container = Some(false);
                docs.clear();
                continue;
            }
            let extension = top && (line.starts_with("extension ") || line.starts_with("public extension "));
            let declares = trimmed.starts_with("public ") || (extension && container.is_none());
            let case = !top && container == Some(true) && trimmed.starts_with("case ");
            if !declares && !case {
                if !trimmed.starts_with('@') {
                    docs.clear();
                }
                continue;
            }
            let mut header = trimmed.to_string();
            while parens_open(&header) && i < lines.len() {
                header.push(' ');
                header.push_str(lines[i].trim());
                i += 1;
            }
            let header = header.replace("( ", "(").replace(", )", ")").replace(",)", ")");
            let sig = signature(&header);
            let sig = sig.strip_prefix("public ").unwrap_or(&sig).to_string();
            let doc = docs.join(" ");
            docs.clear();
            let opens = line.trim_end().ends_with('{') && !line.trim_end().ends_with("{ }");
            let is_type = top && (sig.starts_with("struct ") || sig.starts_with("enum ") || extension);
            if is_type {
                out.push_str(&format!("\n### `{sig}`\n\n"));
                if !doc.is_empty() {
                    out.push_str(&format!("{doc}\n\n"));
                }
                if opens && !lines[i - 1].trim_end().ends_with('}') {
                    container = Some(true);
                }
                continue;
            }
            if top && container.is_none() || container == Some(false) {
                out.push_str(&format!("\n### `{sig}`\n\n"));
                if !doc.is_empty() {
                    out.push_str(&format!("{doc}\n"));
                }
                continue;
            }
            if container == Some(true) {
                if doc.is_empty() {
                    out.push_str(&format!("- `{sig}`\n"));
                } else {
                    out.push_str(&format!("- `{sig}`: {doc}\n"));
                }
            }
        }
    }
    out
}
