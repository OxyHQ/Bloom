//! `check`, `fmt` and `build`.

use std::collections::{BTreeMap, HashMap};
use std::hash::{DefaultHasher, Hasher};
use std::path::{Component, Path, PathBuf};
use std::time::Instant;

use crate::files::{bloom_files, relative, relative_url};
use crate::json::{self, Value};
use crate::parallel;

fn read(path: &Path) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| format!("{}: {e}", path.display()))
}

/// How a path is shown in diagnostics: relative to the working directory when under it.
fn shown(path: &Path) -> String {
    let cwd = std::env::current_dir().unwrap_or_default();
    relative(path, &cwd).to_string_lossy().into_owned()
}

fn options(dev: bool) -> bloom_lang::Options {
    bloom_lang::Options { root: std::env::current_dir().ok(), dev, ..Default::default() }
}

fn report(diagnostics: &[bloom_lang::Diagnostic]) {
    for diagnostic in diagnostics {
        eprintln!("{}\n", diagnostic.rendered);
    }
}

fn summary(verb: &str, files: usize, errors: usize, warnings: usize, started: Instant) {
    let plural = |n: usize, word: &str| format!("{n} {word}{}", if n == 1 { "" } else { "s" });
    eprintln!(
        "bloomc: {verb} {} ({}, {}) in {} ms",
        plural(files, "file"),
        plural(errors, "error"),
        plural(warnings, "warning"),
        started.elapsed().as_millis()
    );
}

/// Type-checks every file; false when any has an error.
pub fn check(paths: &[PathBuf], jobs: usize) -> Result<bool, String> {
    let started = Instant::now();
    let files = bloom_files(paths)?;
    let options = options(false);
    let results = parallel::map(&files, jobs, |path| {
        read(path).map(|source| bloom_lang::check(&source, &shown(path), &options))
    });
    let (mut errors, mut warnings) = (0, 0);
    for result in results {
        let checked = result?;
        report(&checked.warnings);
        report(&checked.diagnostics);
        errors += checked.diagnostics.len();
        warnings += checked.warnings.len();
    }
    summary("checked", files.len(), errors, warnings, started);
    Ok(errors == 0)
}

/// Formats every file in place, or with `check` lists the ones that are not
/// formatted; false when a file does not parse or (`check`) is not formatted.
pub fn fmt(paths: &[PathBuf], check: bool, jobs: usize) -> Result<bool, String> {
    let files = bloom_files(paths)?;
    let results = parallel::map(&files, jobs, |path| -> Result<_, String> {
        let source = read(path)?;
        Ok(match bloom_fmt::format(&source, &shown(path)) {
            Ok(formatted) if formatted == source => Ok(false),
            Ok(formatted) => {
                if !check {
                    std::fs::write(path, formatted).map_err(|e| format!("{}: {e}", path.display()))?;
                }
                Ok(true)
            }
            Err(diagnostics) => Err(diagnostics),
        })
    });
    let mut ok = true;
    for (path, result) in files.iter().zip(results) {
        match result? {
            Ok(false) => {}
            Ok(true) if check => {
                println!("{}", shown(path));
                ok = false;
            }
            Ok(true) => println!("formatted {}", shown(path)),
            Err(diagnostics) => {
                report(&diagnostics);
                ok = false;
            }
        }
    }
    Ok(ok)
}

/// `bloomc migrate --from 0.x [--check] <paths…>`: rewrites 0.x files in 2.0's forms, and
/// prints what each leaves in 0.x form. `--check` lists the files it would change.
pub fn migrate(paths: &[PathBuf], check: bool, jobs: usize) -> Result<bool, String> {
    let files = bloom_files(paths)?;
    let results = parallel::map(&files, jobs, |path| -> Result<_, String> {
        let source = read(path)?;
        Ok(match bloom_fmt::migrate(&source, &shown(path)) {
            Ok((migrated, notes)) => {
                let changed = migrated != source;
                if changed && !check {
                    std::fs::write(path, migrated).map_err(|e| format!("{}: {e}", path.display()))?;
                }
                Ok((changed, notes))
            }
            Err(diagnostics) => Err(diagnostics),
        })
    });
    let mut ok = true;
    for (path, result) in files.iter().zip(results) {
        match result? {
            Ok((changed, notes)) => {
                if changed {
                    println!("{} {}", if check { "would migrate" } else { "migrated" }, shown(path));
                    ok &= !check;
                }
                for note in notes {
                    println!("  note: {note}");
                }
            }
            Err(diagnostics) => {
                report(&diagnostics);
                ok = false;
            }
        }
    }
    Ok(ok)
}

pub struct BuildOptions {
    pub jobs: usize,
    pub cache: bool,
    pub dev: bool,
}

const CACHE_FILE: &str = ".bloomc-cache";
const CACHE_HEADER: &str = "bloomc-cache 1";

/// 128 bits of SipHash over `parts` (two keyed passes): a cache key, not a signature.
fn hash(parts: &[&[u8]]) -> u128 {
    let pass = |seed: u8| {
        let mut hasher = DefaultHasher::new();
        hasher.write_u8(seed);
        for part in parts {
            hasher.write_usize(part.len());
            hasher.write(part);
        }
        hasher.finish()
    };
    (u128::from(pass(1)) << 64) | u128::from(pass(2))
}

/// A file's last successful build: its content, its key (content, compiler
/// and dependencies) and its relative imports, so an unchanged file is not parsed.
struct Entry {
    content: u128,
    key: u128,
    deps: Vec<PathBuf>,
}

fn load_cache(path: &Path) -> HashMap<PathBuf, Entry> {
    let Ok(text) = std::fs::read_to_string(path) else { return HashMap::new() };
    let mut lines = text.lines();
    if lines.next() != Some(CACHE_HEADER) {
        return HashMap::new();
    }
    lines
        .filter_map(|line| {
            let mut fields = line.split('\t');
            let file = PathBuf::from(fields.next()?);
            let content = u128::from_str_radix(fields.next()?, 16).ok()?;
            let key = u128::from_str_radix(fields.next()?, 16).ok()?;
            Some((file, Entry { content, key, deps: fields.map(PathBuf::from).collect() }))
        })
        .collect()
}

fn save_cache(path: &Path, entries: &BTreeMap<PathBuf, Entry>) -> Result<(), String> {
    let mut text = format!("{CACHE_HEADER}\n");
    for (file, entry) in entries {
        text.push_str(&format!("{}\t{:032x}\t{:032x}", file.display(), entry.content, entry.key));
        for dep in &entry.deps {
            text.push('\t');
            text.push_str(&dep.to_string_lossy());
        }
        text.push('\n');
    }
    std::fs::write(path, text).map_err(|e| format!("{}: {e}", path.display()))
}

/// `a/./b/../c` as `a/c`, without touching the file system.
fn normalize(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                out.pop();
            }
            other => out.push(other),
        }
    }
    out
}

/// The files a module's relative imports name (`./Row.bloom`, `../model`),
/// resolved as the compiler does; package imports are not followed.
fn relative_imports(source: &str, file: &Path) -> Vec<PathBuf> {
    let (ast, _, _) = bloom_lang::parse(source, "");
    let dir = file.parent().unwrap_or(Path::new(""));
    let mut deps: Vec<PathBuf> = ast
        .imports
        .iter()
        .filter(|import| import.source.starts_with("./") || import.source.starts_with("../"))
        .filter_map(|import| {
            let base = normalize(&dir.join(&import.source));
            let candidates = ["", ".bloom", ".ts", ".tsx", ".d.ts", "/index.ts", "/index.tsx"];
            candidates
                .iter()
                .map(|ext| PathBuf::from(format!("{}{ext}", base.display())))
                .find(|p| p.is_file())
        })
        .collect();
    deps.sort();
    deps.dedup();
    deps
}

/// The binary's digest: a new compiler invalidates every cached file.
fn compiler_digest(dev: bool) -> u128 {
    let binary = std::env::current_exe().and_then(std::fs::read).unwrap_or_default();
    hash(&[&binary, &[u8::from(dev)]])
}

struct Compiled {
    diagnostics: Vec<bloom_lang::Diagnostic>,
    warnings: Vec<bloom_lang::Diagnostic>,
}

/// Compiles every `.bloom` file under `dir` into `out` at the same relative
/// path, as `Name.ts`, `Name.ts.map` and `Name.d.bloom.ts`. With the cache, a
/// file whose content, imports (transitively) and compiler are unchanged,
/// and whose outputs exist, is not compiled again.
pub fn build(dir: &Path, out: &Path, options: &BuildOptions) -> Result<bool, String> {
    let started = Instant::now();
    let dir = std::path::absolute(dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    let out = std::path::absolute(out).map_err(|e| format!("{}: {e}", out.display()))?;
    std::fs::create_dir_all(&out).map_err(|e| format!("{}: {e}", out.display()))?;
    let files = bloom_files(std::slice::from_ref(&dir))?;
    let sources: Vec<String> =
        parallel::map(&files, options.jobs, |p| read(p)).into_iter().collect::<Result<_, _>>()?;
    let contents: HashMap<&Path, u128> =
        files.iter().zip(&sources).map(|(p, s)| (p.as_path(), hash(&[s.as_bytes()]))).collect();

    let cache_path = out.join(CACHE_FILE);
    let cache = if options.cache { load_cache(&cache_path) } else { HashMap::new() };
    // Each file's imports: from the cache when its content is unchanged, else parsed.
    let deps: Vec<Vec<PathBuf>> =
        parallel::map(&files.iter().zip(&sources).collect::<Vec<_>>(), options.jobs, |(path, source)| {
            match cache.get(*path) {
                Some(entry) if entry.content == contents[path.as_path()] => entry.deps.clone(),
                _ => relative_imports(source, path),
            }
        });
    let deps_of: HashMap<&Path, &[PathBuf]> =
        files.iter().map(PathBuf::as_path).zip(deps.iter().map(Vec::as_slice)).collect();
    let digest = compiler_digest(options.dev);
    let mut foreign: HashMap<PathBuf, u128> = HashMap::new();
    let keys: Vec<u128> = files
        .iter()
        .map(|file| {
            // The content of the file and of everything it imports, transitively, by path.
            let mut closure: BTreeMap<&Path, u128> = BTreeMap::new();
            let mut stack = vec![file.as_path()];
            while let Some(current) = stack.pop() {
                if closure.contains_key(current) {
                    continue;
                }
                let content = match contents.get(current) {
                    Some(&content) => {
                        stack.extend(deps_of[current].iter().map(PathBuf::as_path));
                        content
                    }
                    None => *foreign
                        .entry(current.to_path_buf())
                        .or_insert_with(|| hash(&[&std::fs::read(current).unwrap_or_default()])),
                };
                closure.insert(current, content);
            }
            let mut bytes = digest.to_le_bytes().to_vec();
            for (path, content) in &closure {
                bytes.extend(path.as_os_str().as_encoded_bytes());
                bytes.extend(content.to_le_bytes());
            }
            hash(&[&bytes])
        })
        .collect();

    let outputs = |file: &Path| {
        let rel = relative(file, &dir);
        let stem = rel
            .file_name()
            .map(|n| n.to_string_lossy().trim_end_matches(".bloom").to_string())
            .unwrap_or_default();
        let target = out.join(&rel).with_file_name(&stem);
        (
            target.with_file_name(format!("{stem}.ts")),
            target.with_file_name(format!("{stem}.ts.map")),
            target.with_file_name(format!("{stem}.d.bloom.ts")),
        )
    };
    let stale: Vec<usize> = (0..files.len())
        .filter(|&i| {
            let fresh = cache.get(&files[i]).is_some_and(|entry| entry.key == keys[i])
                && outputs(&files[i]).0.is_file();
            !fresh
        })
        .collect();

    let compile_options = self::options(options.dev);
    let results: Vec<Result<Compiled, String>> = parallel::map(&stale, options.jobs, |&i| {
        let file = &files[i];
        let output = bloom_lang::compile(&sources[i], &shown(file), &compile_options);
        if output.diagnostics.is_empty() {
            let (ts, map, dts) = outputs(file);
            let write = |path: &Path, text: &str| -> Result<(), String> {
                if let Some(parent) = path.parent() {
                    std::fs::create_dir_all(parent).map_err(|e| format!("{}: {e}", parent.display()))?;
                }
                std::fs::write(path, text).map_err(|e| format!("{}: {e}", path.display()))
            };
            let map_name = map.file_name().unwrap_or_default().to_string_lossy().into_owned();
            let mut code = output.code;
            if let Some(source_map) = &output.map {
                let ts_name = ts.file_name().unwrap_or_default().to_string_lossy().into_owned();
                write(
                    &map,
                    &relocate_map(source_map, &ts_name, &relative_url(map.parent().unwrap_or(&out), file))?,
                )?;
                code.push_str(&format!("\n//# sourceMappingURL={map_name}\n"));
            }
            write(&ts, &code)?;
            if let Some(text) = &output.dts {
                write(&dts, text)?;
            }
        }
        Ok(Compiled { diagnostics: output.diagnostics, warnings: output.warnings })
    });

    let mut entries: BTreeMap<PathBuf, Entry> = BTreeMap::new();
    let failed: Vec<usize> = stale
        .iter()
        .zip(&results)
        .filter(|(_, r)| r.as_ref().map_or(true, |c| !c.diagnostics.is_empty()))
        .map(|(&i, _)| i)
        .collect();
    for (i, file) in files.iter().enumerate() {
        if !failed.contains(&i) {
            entries.insert(
                file.clone(),
                Entry { content: contents[file.as_path()], key: keys[i], deps: deps[i].clone() },
            );
        }
    }
    let (mut errors, mut warnings) = (0, 0);
    for result in results {
        let compiled = result?;
        report(&compiled.warnings);
        report(&compiled.diagnostics);
        errors += compiled.diagnostics.len();
        warnings += compiled.warnings.len();
    }
    if options.cache {
        save_cache(&cache_path, &entries)?;
    }
    summary(&format!("built {} of", stale.len()), files.len(), errors, warnings, started);
    Ok(errors == 0)
}

/// The compiler's map, named for its output file and pointing at the source
/// by a path relative to the map.
fn relocate_map(map: &str, file: &str, source: &str) -> Result<String, String> {
    let mut map = json::parse(map).map_err(|e| format!("the compiler's source map: {e}"))?;
    if let Value::Object(fields) = &mut map {
        fields.insert("file".to_string(), file.into());
        fields.insert("sources".to_string(), Value::Array(vec![source.into()]));
    }
    Ok(json::write(&map))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_lexically() {
        assert_eq!(normalize(Path::new("/a/b/./../c/d.bloom")), PathBuf::from("/a/c/d.bloom"));
    }

    #[test]
    fn a_cache_round_trips() {
        let dir = std::env::temp_dir().join(format!("bloomc-cache-test-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join(CACHE_FILE);
        let mut entries = BTreeMap::new();
        entries.insert(
            PathBuf::from("/x/a.bloom"),
            Entry { content: 1, key: u128::MAX, deps: vec!["/x/b.bloom".into()] },
        );
        save_cache(&path, &entries).unwrap();
        let loaded = load_cache(&path);
        let entry = &loaded[Path::new("/x/a.bloom")];
        assert_eq!(
            (entry.content, entry.key, entry.deps.clone()),
            (1, u128::MAX, vec![PathBuf::from("/x/b.bloom")])
        );
        std::fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn a_map_is_relocated() {
        let map = r#"{"version":3,"sources":["src/a.bloom"],"names":[],"mappings":"AAAA"}"#;
        let moved = json::parse(&relocate_map(map, "a.ts", "../src/a.bloom").unwrap()).unwrap();
        assert_eq!(moved.get("sources").as_array()[0].as_str(), Some("../src/a.bloom"));
        assert_eq!(moved.get("file").as_str(), Some("a.ts"));
    }
}
