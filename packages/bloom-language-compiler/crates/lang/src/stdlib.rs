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
    ("Concurrency.bloom", include_str!("../../../stdlib/Bloom/Concurrency.bloom")),
    ("Regex.bloom", include_str!("../../../stdlib/Bloom/Regex.bloom")),
    ("Logger.bloom", include_str!("../../../stdlib/Bloom/Logger.bloom")),
    ("Localization.bloom", include_str!("../../../stdlib/Bloom/Localization.bloom")),
    ("runtime.ts", include_str!("../../../stdlib/Bloom/runtime.ts")),
];

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
        for (name, contents) in SOURCES {
            let path = dir.join(name);
            if std::fs::read_to_string(&path).ok().as_deref() == Some(contents) {
                continue;
            }
            // Written whole, then renamed: a bundler's workers may read it meanwhile.
            let tmp = dir.join(format!(".{name}.{}.tmp", std::process::id()));
            if std::fs::write(&tmp, contents).is_ok() {
                let _ = std::fs::rename(&tmp, &path);
            }
        }
    }
    SOURCES.iter().filter(|(n, _)| n.ends_with(".bloom")).map(|(n, _)| dir.join(n)).collect()
}

/// `path` is one of the standard library's files.
pub fn contains(path: &Path) -> bool {
    path.parent().is_some_and(|p| p.ends_with(Path::new(".bloom/std").join(MODULE)))
}
