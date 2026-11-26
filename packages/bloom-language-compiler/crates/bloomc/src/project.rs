//! A package on disk, and `bloom check` over its modules.
//!
//! Modules check in dependency order, level by level (the modules of a level in
//! parallel, and the files of a module in parallel). Each module's result is
//! kept under `.bloom/cache/` with its key: the compiler, the module's sources,
//! the manifest, and the *interfaces* of the modules it depends on. A module's
//! interface (`.bloom/modules/<Module>.bloominterface`) is the declarations its
//! files show other files (their `.d.bloom.ts`), so an edit inside a function
//! body rechecks that module and not the modules that import it (in the
//! spirit of a `.swiftmodule`).

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
        None => std::env::current_dir().map_err(|e| e.to_string())?.join("."),
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
        "not inside a Bloom package (no Package.bloom here or above): create one with `bloom new <Name>`".to_string()
    })
}

/// A module's last check: its key, its interface's hash, and whether it was clean.
#[derive(Debug, Clone, PartialEq)]
struct Cached {
    key: u128,
    interface: u128,
}

const CACHE_HEADER: &str = "bloom-modules 1";

fn load_cache(path: &Path) -> HashMap<String, Cached> {
    let Ok(text) = std::fs::read_to_string(path) else { return HashMap::new() };
    let mut lines = text.lines();
    if lines.next() != Some(CACHE_HEADER) {
        return HashMap::new();
    }
    lines
        .filter_map(|line| {
            let mut parts = line.split(' ');
            let name = parts.next()?.to_string();
            let key = u128::from_str_radix(parts.next()?, 16).ok()?;
            let interface = u128::from_str_radix(parts.next()?, 16).ok()?;
            Some((name, Cached { key, interface }))
        })
        .collect()
}

fn save_cache(path: &Path, entries: &BTreeMap<String, Cached>) -> Result<(), String> {
    let mut text = format!("{CACHE_HEADER}\n");
    for (name, entry) in entries {
        text.push_str(&format!("{name} {:032x} {:032x}\n", entry.key, entry.interface));
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
    /// Target index → (file, emitted TS) for the modules compiled this run.
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

/// Checks the modules (all of them with `force`, else the stale ones).
pub fn check_modules(package: &Package, options: &CheckOptions, force: bool) -> Result<Checked, String> {
    let started = Instant::now();
    let manifest = &package.manifest;
    let cache_path = package.dot().join("cache/modules");
    let cache = if force { HashMap::new() } else { load_cache(&cache_path) };
    let digest = compiler_digest(false);
    let compile_options = package.options(options.allow_ts_imports);
    let mut interfaces: HashMap<usize, u128> = HashMap::new();
    let mut entries = BTreeMap::new();
    let mut emitted = BTreeMap::new();
    let (mut errors, mut warnings, mut files_checked, mut modules_checked) = (0, 0, 0, 0);
    for level in package::levels(manifest) {
        // Each module's key: the compiler, the manifest, its sources, its dependencies' interfaces.
        let mut stale = Vec::new();
        for &index in &level {
            let target = &manifest.targets[index];
            let files = package.files(index);
            let mut bytes = digest.to_le_bytes().to_vec();
            bytes.extend(package.source.as_bytes());
            for file in &files {
                bytes.extend(file.as_os_str().as_encoded_bytes());
                bytes.extend(hash(&[&std::fs::read(file).unwrap_or_default()]).to_le_bytes());
            }
            for (dep, _) in &target.dependencies {
                if let Some(d) = manifest.targets.iter().position(|t| &t.name == dep) {
                    bytes.extend(interfaces.get(&d).copied().unwrap_or_default().to_le_bytes());
                }
            }
            let key = hash(&[&bytes]);
            let interface_file = package.dot().join("modules").join(format!("{}.bloominterface", target.name));
            match cache.get(&target.name) {
                Some(entry) if entry.key == key && interface_file.is_file() => {
                    interfaces.insert(index, entry.interface);
                    entries.insert(target.name.clone(), entry.clone());
                }
                _ => stale.push((index, key, files)),
            }
        }
        let work: Vec<(usize, PathBuf)> =
            stale.iter().flat_map(|(index, _, files)| files.iter().map(|f| (*index, f.clone()))).collect();
        let results = parallel::map(&work, options.jobs, |(_, path)| {
            std::fs::read_to_string(path)
                .map(|source| bloom_lang::compile(&source, &shown(path), &compile_options))
                .map_err(|e| format!("{}: {e}", path.display()))
        });
        let mut by_module: BTreeMap<usize, Vec<(PathBuf, bloom_lang::Output)>> = BTreeMap::new();
        for ((index, path), result) in work.into_iter().zip(results) {
            by_module.entry(index).or_default().push((path, result?));
        }
        for (index, key, _) in stale {
            let target = &manifest.targets[index];
            let outputs = by_module.remove(&index).unwrap_or_default();
            modules_checked += 1;
            files_checked += outputs.len();
            let mut interface = format!("// The interface of module {}: what its files show other files.\n", target.name);
            let mut module_errors = 0;
            let mut code = Vec::new();
            for (path, output) in &outputs {
                report(&output.warnings);
                report(&output.diagnostics);
                module_errors += output.diagnostics.len();
                warnings += output.warnings.len();
                let rel = path.strip_prefix(&package.root).unwrap_or(path);
                interface.push_str(&format!("\n// {}\n{}", rel.display(), output.dts.as_deref().unwrap_or("")));
                code.push((path.clone(), output.code.clone()));
            }
            errors += module_errors;
            let interface_hash = hash(&[interface.as_bytes()]);
            interfaces.insert(index, interface_hash);
            emitted.insert(index, code);
            if module_errors == 0 {
                write(&package.dot().join("modules").join(format!("{}.bloominterface", target.name)), &interface)?;
                entries.insert(target.name.clone(), Cached { key, interface: interface_hash });
            }
        }
    }
    save_cache(&cache_path, &entries)?;
    let plural = |n: usize, word: &str| format!("{n} {word}{}", if n == 1 { "" } else { "s" });
    eprintln!(
        "bloom: checked {} of {} ({}; {}, {}) in {} ms",
        plural(modules_checked, "module"),
        manifest.targets.len(),
        plural(files_checked, "file"),
        plural(errors, "error"),
        plural(warnings, "warning"),
        started.elapsed().as_millis()
    );
    Ok(Checked { ok: errors == 0, emitted })
}
