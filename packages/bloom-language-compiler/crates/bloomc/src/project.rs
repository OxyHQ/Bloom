//! A package on disk, and `bloom check` over its modules.
//!
//! Modules check in dependency order, level by level (the files of a level in
//! parallel). Each file's result is kept in `.bloom/cache/modules` with its key:
//! the compiler, the manifest, its own text, the *interfaces* of its module's
//! other files and the public interfaces of the modules its module depends on.
//! A file's interface ([`bloom_lang::interface`]) is its visible declarations'
//! types and signatures: the `internal` and `public` ones for its own module, the
//! `public` ones for other modules. So an edit inside a function body, a comment
//! or a private item rechecks that file only; a new `internal` signature rechecks
//! its module's other files too, and a new `public` one the importing modules'
//! files as well (in the spirit of a `.swiftmodule`).

use std::collections::{BTreeMap, HashMap};
use std::path::{Path, PathBuf};
use std::time::Instant;

use bloom_lang::package::{self, Manifest, TargetKind};

use crate::build::{compiler_digest, hash, report, shown};
use crate::files::bloom_files;
use crate::parallel;

/// A package: its root and its evaluated manifest.
#[derive(Debug, Clone)]
pub struct Package {
    pub root: PathBuf,
    pub manifest: Manifest,
    /// The manifest's text.
    pub source: String,
}

pub struct CheckOptions {
    pub jobs: usize,
    pub tsc: bool,
    pub allow_ts_imports: bool,
}

impl Package {
    /// Reads the package at `root`; the manifest's errors are printed.
    pub fn load(root: &Path) -> Result<Package, String> {
        let path = root.join(package::MANIFEST);
        let source = std::fs::read_to_string(&path).map_err(|e| format!("{}: {e}", path.display()))?;
        match package::parse(&source, &shown(&path)) {
            Ok(manifest) => Ok(Package { root: root.to_path_buf(), manifest, source }),
            Err(errors) => {
                report(&errors);
                Err(format!("{} has {} error(s)", shown(&path), errors.len()))
            }
        }
    }

    /// `.bloom/`: everything the toolchain generates (git-ignored).
    pub fn dot(&self) -> PathBuf {
        self.root.join(".bloom")
    }

    /// `.bloom/build/`: the generated app the platform tools build.
    pub fn build_dir(&self) -> PathBuf {
        self.dot().join("build")
    }

    pub fn target_dir(&self, index: usize) -> PathBuf {
        self.root.join(self.manifest.targets[index].dir())
    }

    /// The `.bloom` files of target `index` (none when its directory is missing).
    pub fn files(&self, index: usize) -> Vec<PathBuf> {
        let dir = self.target_dir(index);
        if !dir.is_dir() {
            return Vec::new();
        }
        let mut files = bloom_files(&[dir]).unwrap_or_default();
        // A target nested in another's directory keeps its own files.
        let nested: Vec<PathBuf> = (0..self.manifest.targets.len())
            .filter(|&i| i != index && self.target_dir(i).starts_with(self.target_dir(index)))
            .map(|i| self.target_dir(i))
            .collect();
        files.retain(|f| !nested.iter().any(|n| f.starts_with(n)));
        files
    }

    /// The directories of the targets that exist.
    pub fn source_dirs(&self) -> Vec<PathBuf> {
        (0..self.manifest.targets.len()).map(|i| self.target_dir(i)).filter(|d| d.is_dir()).collect()
    }

    /// The compile options of the package's files: modules resolve through it,
    /// and TS imports (binding modules) resolve in the generated build directory.
    pub fn options(&self, allow_ts_imports: bool) -> bloom_lang::Options {
        let build = self.build_dir();
        bloom_lang::Options {
            root: Some(if build.join("node_modules").is_dir() { build } else { self.root.clone() }),
            package: Some(self.root.clone()),
            allow_ts_imports,
            modules: true,
            ..Default::default()
        }
    }

    pub fn targets_of(&self, kind: fn(&TargetKind) -> bool) -> Vec<usize> {
        (0..self.manifest.targets.len()).filter(|&i| kind(&self.manifest.targets[i].kind)).collect()
    }
}

/// The package around `paths` (or the working directory).
pub fn find(paths: &[PathBuf]) -> Result<Option<Package>, String> {
    let start = match paths.first() {
        Some(path) => std::path::absolute(path).map_err(|e| e.to_string())?,
        None => std::env::current_dir().map_err(|e| e.to_string())?,
    };
    let Some(root) = std::iter::once(start.as_path())
        .chain(start.ancestors().skip(1))
        .find(|dir| dir.join(package::MANIFEST).is_file())
    else {
        return Ok(None);
    };
    Package::load(root).map(Some)
}

/// The package around the working directory, or an error that says how to make one.
pub fn require(paths: &[PathBuf]) -> Result<Package, String> {
    find(paths)?.ok_or_else(|| {
        "not inside a Bloom package (no Package.bloom here or above): create one with `bloom new <Name>`"
            .to_string()
    })
}

/// A file's last check: the key of its own text, what it shows other files
/// (hashes of its `public` lines and of all its lines, see [`bloom_lang::interface`]),
/// the key of its check, and whether that check was clean.
#[derive(Debug, Clone, PartialEq)]
struct Cached {
    own: u128,
    public: u128,
    internal: u128,
    key: u128,
    ok: bool,
}

/// Version 2: per file, keyed by interfaces (version 1 was per module, by `.d.bloom.ts`).
const CACHE_HEADER: &str = "bloom-files 2";

fn load_cache(path: &Path) -> HashMap<PathBuf, Cached> {
    let Ok(text) = std::fs::read_to_string(path) else { return HashMap::new() };
    let mut lines = text.lines();
    if lines.next() != Some(CACHE_HEADER) {
        return HashMap::new();
    }
    lines
        .filter_map(|line| {
            let mut parts = line.splitn(6, ' ');
            let mut number = || u128::from_str_radix(parts.next()?, 16).ok();
            let (own, public, internal, key) = (number()?, number()?, number()?, number()?);
            let ok = parts.next()? == "1";
            Some((PathBuf::from(parts.next()?), Cached { own, public, internal, key, ok }))
        })
        .collect()
}

fn save_cache(path: &Path, entries: &BTreeMap<PathBuf, Cached>) -> Result<(), String> {
    let mut text = format!("{CACHE_HEADER}\n");
    for (file, e) in entries {
        text.push_str(&format!(
            "{:032x} {:032x} {:032x} {:032x} {} {}\n",
            e.own,
            e.public,
            e.internal,
            e.key,
            u8::from(e.ok),
            file.display()
        ));
    }
    write(path, &text)
}

pub fn write(path: &Path, text: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("{}: {e}", parent.display()))?;
    }
    std::fs::write(path, text).map_err(|e| format!("{}: {e}", path.display()))
}

/// What checking the package produced: per module, the emitted TS of each file.
pub struct Checked {
    pub ok: bool,
    /// Target index → (file, emitted TS) for the files compiled this run.
    pub emitted: BTreeMap<usize, Vec<(PathBuf, String)>>,
}

/// Checks every module of the package; false when one has an error.
pub fn check(package: &Package, options: &CheckOptions) -> Result<bool, String> {
    let checked = check_modules(package, options, false)?;
    if !checked.ok || !options.tsc {
        return Ok(checked.ok);
    }
    crate::bind::check_tsc(package, options)
}

/// A file of a module being checked: its source and what it shows other files.
struct FileState {
    path: PathBuf,
    source: String,
    own: u128,
    public: u128,
    internal: u128,
    /// Whether `public` and `internal` were kept from the cache (its text is unchanged).
    known: bool,
}

/// Checks the modules' files (all of them with `force`, else the stale ones).
pub fn check_modules(package: &Package, options: &CheckOptions, force: bool) -> Result<Checked, String> {
    let started = Instant::now();
    let manifest = &package.manifest;
    let cache_path = package.dot().join("cache/modules");
    let cache = if force { HashMap::new() } else { load_cache(&cache_path) };
    let digest = compiler_digest(false);
    let compile_options = package.options(options.allow_ts_imports);
    // Target index → the hash of its files' `public` lines: what importing modules see.
    let mut publics: HashMap<usize, u128> = HashMap::new();
    let mut entries = BTreeMap::new();
    let mut emitted: BTreeMap<usize, Vec<(PathBuf, String)>> = BTreeMap::new();
    let (mut errors, mut warnings, mut files_checked, mut total_files) = (0, 0, 0, 0);
    let mut modules_checked = std::collections::BTreeSet::new();
    for level in package::levels(manifest) {
        // Each file's own key: the compiler, the manifest, its path and its text.
        let mut modules: Vec<(usize, Vec<FileState>)> = Vec::new();
        for &index in &level {
            let mut states = Vec::new();
            for path in package.files(index) {
                let source =
                    std::fs::read_to_string(&path).map_err(|e| format!("{}: {e}", path.display()))?;
                let mut bytes = digest.to_le_bytes().to_vec();
                bytes.extend(package.source.as_bytes());
                bytes.extend(path.as_os_str().as_encoded_bytes());
                bytes.extend(source.as_bytes());
                let own = hash(&[&bytes]);
                let (public, internal, known) = match cache.get(&path) {
                    Some(entry) if entry.own == own => (entry.public, entry.internal, true),
                    _ => (0, 0, false),
                };
                states.push(FileState { path, source, own, public, internal, known });
            }
            modules.push((index, states));
        }
        // The interfaces of the files whose text changed (the others' are kept).
        let reread: Vec<(usize, usize)> = modules
            .iter()
            .enumerate()
            .flat_map(|(m, (_, states))| {
                states.iter().enumerate().filter(|(_, s)| !s.known).map(move |(f, _)| (m, f))
            })
            .collect();
        let fresh = parallel::map(&reread, options.jobs, |&(m, f)| {
            let state = &modules[m].1[f];
            let text = bloom_lang::interface(&state.source, &shown(&state.path), &compile_options);
            let public: String =
                text.lines().filter(|l| l.starts_with("public ")).flat_map(|l| [l, "\n"]).collect();
            (hash(&[public.as_bytes()]), hash(&[text.as_bytes()]))
        });
        for (&(m, f), (public, internal)) in reread.iter().zip(fresh) {
            let state = &mut modules[m].1[f];
            (state.public, state.internal) = (public, internal);
        }
        for (index, states) in &modules {
            let mut bytes = Vec::new();
            for state in states {
                bytes.extend(state.path.as_os_str().as_encoded_bytes());
                bytes.extend(state.public.to_le_bytes());
            }
            publics.insert(*index, hash(&[&bytes]));
        }
        // Each file's key: its own, its module's other files' interfaces (all their
        // lines), and its dependencies' public interfaces.
        let mut stale: Vec<(usize, usize, u128)> = Vec::new();
        for (m, (index, states)) in modules.iter().enumerate() {
            let target = &manifest.targets[*index];
            let mut deps = Vec::new();
            for (dep, _) in &target.dependencies {
                if let Some(d) = manifest.targets.iter().position(|t| &t.name == dep) {
                    deps.extend(publics.get(&d).copied().unwrap_or_default().to_le_bytes());
                }
            }
            for (f, state) in states.iter().enumerate() {
                let mut bytes = state.own.to_le_bytes().to_vec();
                for sibling in states.iter().filter(|s| s.path != state.path) {
                    bytes.extend(sibling.path.as_os_str().as_encoded_bytes());
                    bytes.extend(sibling.internal.to_le_bytes());
                }
                bytes.extend(&deps);
                let key = hash(&[&bytes]);
                let cached =
                    Cached { own: state.own, public: state.public, internal: state.internal, key, ok: true };
                match cache.get(&state.path) {
                    Some(entry) if entry.ok && entry.key == key => {
                        entries.insert(state.path.clone(), cached);
                    }
                    _ => stale.push((m, f, key)),
                }
            }
            total_files += states.len();
        }
        let results = parallel::map(&stale, options.jobs, |&(m, f, _)| {
            let state = &modules[m].1[f];
            bloom_lang::compile(&state.source, &shown(&state.path), &compile_options)
        });
        for (&(m, f, key), output) in stale.iter().zip(results) {
            let (index, states) = &modules[m];
            let state = &states[f];
            report(&output.warnings);
            report(&output.diagnostics);
            errors += output.diagnostics.len();
            warnings += output.warnings.len();
            files_checked += 1;
            modules_checked.insert(*index);
            let ok = output.diagnostics.is_empty();
            entries.insert(
                state.path.clone(),
                Cached { own: state.own, public: state.public, internal: state.internal, key, ok },
            );
            emitted.entry(*index).or_default().push((state.path.clone(), output.code));
        }
    }
    save_cache(&cache_path, &entries)?;
    let plural = |n: usize, word: &str| format!("{n} {word}{}", if n == 1 { "" } else { "s" });
    eprintln!(
        "bloom: checked {} of {} in {} of {} ({}, {}) in {} ms",
        files_checked,
        plural(total_files, "file"),
        modules_checked.len(),
        plural(manifest.targets.len(), "module"),
        plural(errors, "error"),
        plural(warnings, "warning"),
        started.elapsed().as_millis()
    );
    Ok(Checked { ok: errors == 0, emitted })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn copy(from: &Path, to: &Path) {
        std::fs::create_dir_all(to).unwrap();
        for entry in std::fs::read_dir(from).unwrap().flatten() {
            // A local build's `.bloom/` (its installed runtime) is not the package.
            if entry.file_name() == ".bloom" {
                continue;
            }
            let target = to.join(entry.file_name());
            if entry.path().is_dir() {
                copy(&entry.path(), &target);
            } else {
                std::fs::copy(entry.path(), target).unwrap();
            }
        }
    }

    /// The exit demo (ADR 0002's three examples) checks, and a second check
    /// reuses every module; an edit inside a function body rechecks only its module.
    #[test]
    fn the_demo_checks_per_module() {
        let example = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../examples/Demo");
        let root = std::env::temp_dir().join(format!("bloom-demo-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        copy(&example, &root);
        let package = Package::load(&root).unwrap();
        let options = CheckOptions { jobs: 2, tsc: false, allow_ts_imports: false };
        let first = check_modules(&package, &options, false).unwrap();
        assert!(first.ok);
        assert_eq!(first.emitted.len(), package.manifest.targets.len());
        assert!(check_modules(&package, &options, false).unwrap().emitted.is_empty(), "all cached");
        let api = root.join("Sources/API/API.bloom");
        let text = std::fs::read_to_string(&api).unwrap().replace("id != \"3\"", "id != \"2\"");
        std::fs::write(&api, text).unwrap();
        let again = check_modules(&package, &options, false).unwrap();
        let names: Vec<&str> =
            again.emitted.keys().map(|&i| package.manifest.targets[i].name.as_str()).collect();
        assert_eq!(names, ["API"], "a body edit keeps API's interface, so its dependents stay cached");
        let _ = std::fs::remove_dir_all(&root);
    }

    /// The files `check_modules` rechecked, by name (the check must be clean).
    fn rechecked(package: &Package) -> Vec<String> {
        let options = CheckOptions { jobs: 2, tsc: false, allow_ts_imports: false };
        let checked = check_modules(package, &options, false).unwrap();
        assert!(checked.ok);
        let mut names: Vec<String> = checked
            .emitted
            .values()
            .flatten()
            .map(|(path, _)| path.file_name().unwrap().to_string_lossy().into_owned())
            .collect();
        names.sort();
        names
    }

    fn edit(path: &Path, from: &str, to: &str) {
        let text = std::fs::read_to_string(path).unwrap();
        assert!(text.contains(from), "{from} in {}", path.display());
        std::fs::write(path, text.replacen(from, to, 1)).unwrap();
    }

    /// Per-file keys over interfaces: a body, a comment or a private item rechecks
    /// its file only; an internal signature its module's files; a public one the
    /// importing module's files as well.
    #[test]
    fn a_body_edit_rechecks_only_its_file() {
        let root = std::env::temp_dir().join(format!("bloom-incremental-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        let files = [
            (
                "Package.bloom",
                "let package = Package(\n  name: \"Shop\",\n  platforms: [.web],\n  targets: [\n    \
                 .module(\"Feed\", dependencies: [\"Posts\"]),\n    .module(\"Posts\"),\n  ]\n)\n",
            ),
            (
                "Sources/Posts/Post.bloom",
                "public struct Post {\n  public let title: String\n}\n\n\
                 public func headline(_ post: Post) -> String {\n  shout(post.title)\n}\n",
            ),
            ("Sources/Posts/Format.bloom", "func shout(_ text: String) -> String {\n  text + \"!\"\n}\n"),
            (
                "Sources/Feed/Feed.bloom",
                "import Posts\n\npublic func top(_ post: Post) -> String {\n  headline(post)\n}\n",
            ),
        ];
        for (path, text) in files {
            write(&root.join(path), text).unwrap();
        }
        let package = Package::load(&root).unwrap();
        let (post, format) = (root.join("Sources/Posts/Post.bloom"), root.join("Sources/Posts/Format.bloom"));
        assert_eq!(rechecked(&package), ["Feed.bloom", "Format.bloom", "Post.bloom"]);
        assert!(rechecked(&package).is_empty(), "all cached");
        // A function body, a comment, a private item: that file only.
        edit(&format, "text + \"!\"", "text + \"!!\"");
        assert_eq!(rechecked(&package), ["Format.bloom"]);
        edit(&post, "shout(post.title)", "// the title, loud\n  shout(post.title + \"?\")");
        assert_eq!(rechecked(&package), ["Post.bloom"]);
        edit(&post, "public struct Post", "private func unused() -> Int {\n  1\n}\n\npublic struct Post");
        assert_eq!(rechecked(&package), ["Post.bloom"]);
        // An internal signature: its module's files, not the modules that import it.
        edit(&format, "func shout(_ text: String) -> String", "func shout(_ text: String) -> String?");
        edit(&post, "shout(post.title + \"?\")", "shout(post.title + \"?\") ?? \"\"");
        assert_eq!(rechecked(&package), ["Format.bloom", "Post.bloom"]);
        // A public signature: the importing modules' files too.
        edit(&post, "public let title: String", "public let title: String\n  public let likes: Int");
        edit(&root.join("Sources/Feed/Feed.bloom"), "headline(post)", "headline(post) + \"\\(post.likes)\"");
        assert_eq!(rechecked(&package), ["Feed.bloom", "Format.bloom", "Post.bloom"]);
        edit(
            &post,
            "public func headline(_ post: Post) -> String",
            "public func headline(_ post: Post) -> String?",
        );
        edit(&root.join("Sources/Feed/Feed.bloom"), "headline(post) +", "(headline(post) ?? \"\") +");
        assert_eq!(rechecked(&package), ["Feed.bloom", "Format.bloom", "Post.bloom"]);
        let _ = std::fs::remove_dir_all(&root);
    }
}
