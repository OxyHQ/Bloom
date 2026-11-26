//! `bloomc migrate`: embedded-language `.tsx` modules to `.bloom` (`bloom_migrate`).
//!
//! Without `--write` nothing changes on disk: each file's status is printed,
//! and `--report` adds the totals and the refusal reasons by frequency.
//! `--write` writes `X.bloom` and its `X.d.bloom.ts` for every file that
//! migrated (or needs review) and removes `X.tsx`: a module is never both (B0610).
//! `--print` prints each translation (or the draft that was refused).
//!
//! After `--write`, every TS module under the working directory that imports a
//! migrated module by an extensionless path (relative, or `@/`) imports it as
//! `X.bloom` (spec 10), `jest.mock` paths included; the modules that draw a
//! migrated component as JSX (`<X …/>`) are listed, since a view is drawn as
//! `toElement(X({ … }))`.

use std::path::{Path, PathBuf};

use bloom_migrate::report::{self, Entry};
use bloom_migrate::{Status, bloom_path};

use crate::parallel;

pub struct MigrateOptions {
    pub jobs: usize,
    pub write: bool,
    pub report: bool,
    pub print: bool,
}

/// Every `.tsx`/`.ts` module under `paths` (no declarations or dependencies; no
/// tests, mocks, fixtures or perf harnesses unless `tests`).
fn modules(paths: &[PathBuf], tests: bool) -> Result<Vec<PathBuf>, String> {
    let walk_tests = tests;
    fn walk(dir: &Path, out: &mut Vec<PathBuf>, tests: bool) -> std::io::Result<()> {
        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            let name = entry.file_name().to_string_lossy().into_owned();
            if entry.file_type()?.is_dir() {
                let skipped = name == "node_modules" || (!tests && TEST_DIRS.contains(&name.as_str()));
                if !name.starts_with('.') && !skipped {
                    walk(&entry.path(), out, tests)?;
                }
            } else if is_module(&name) && (tests || !is_test(&name)) {
                out.push(entry.path());
            }
        }
        Ok(())
    }
    let mut out = Vec::new();
    for path in paths {
        let meta = std::fs::metadata(path).map_err(|e| format!("{}: {e}", path.display()))?;
        if meta.is_dir() {
            walk(path, &mut out, walk_tests).map_err(|e| format!("{}: {e}", path.display()))?;
        } else {
            out.push(path.clone());
        }
    }
    out.sort();
    out.dedup();
    Ok(out)
}

const TEST_DIRS: &[&str] = &["__tests__", "__mocks__", "__fixtures__", "__perf__"];

fn is_module(name: &str) -> bool {
    (name.ends_with(".tsx") || name.ends_with(".ts"))
        && !name.ends_with(".d.ts")
        && !name.contains(".d.bloom.")
}

fn is_test(name: &str) -> bool {
    name.contains(".test.") || name.contains(".spec.")
}

/// False when a file was refused.
pub fn migrate(paths: &[PathBuf], options: &MigrateOptions) -> Result<bool, String> {
    let files = modules(paths, false)?;
    let root = std::env::current_dir().ok();
    let lang = bloom_lang::Options { root: root.clone(), ..Default::default() };
    let shown = |path: &Path| -> String {
        let cwd = root.clone().unwrap_or_default();
        path.strip_prefix(&cwd).unwrap_or(path).to_string_lossy().into_owned()
    };
    let results = parallel::map(&files, options.jobs, |path| {
        std::fs::read_to_string(path)
            .map(|source| bloom_migrate::migrate(&source, &shown(path), &lang))
            .map_err(|e| format!("{}: {e}", path.display()))
    });
    let mut entries = Vec::new();
    for (path, result) in files.iter().zip(results) {
        entries.push(Entry { path: shown(path), migration: result? });
    }
    let mut ok = true;
    for (path, entry) in files.iter().zip(&entries) {
        let m = &entry.migration;
        if m.status == Status::Refused {
            ok = false;
        }
        if options.print
            && m.status != Status::Skipped
            && let Some(bloom) = &m.bloom
        {
            println!("// ===== {} ({})\n{bloom}", entry.path, m.status.word());
        }
        if options.write && matches!(m.status, Status::Migrated | Status::NeedsReview) {
            let target = bloom_path(path);
            let write =
                |p: &Path, text: &str| std::fs::write(p, text).map_err(|e| format!("{}: {e}", p.display()));
            write(&target, m.bloom.as_deref().unwrap_or_default())?;
            if let Some(dts) = &m.dts {
                write(&target.with_extension("d.bloom.ts"), dts)?;
            }
            std::fs::remove_file(path).map_err(|e| format!("{}: {e}", path.display()))?;
        }
    }
    let written: Vec<PathBuf> = files
        .iter()
        .zip(&entries)
        .filter(|(_, e)| {
            options.write && matches!(e.migration.status, Status::Migrated | Status::NeedsReview)
        })
        .map(|(p, _)| p.clone())
        .collect();
    if !written.is_empty()
        && let Some(root) = &root
    {
        for note in rewrite_importers(root, &written)? {
            println!("{note}");
        }
    }
    if options.report {
        print!("{}", report::render(&entries));
    } else {
        for entry in entries.iter().filter(|e| e.migration.status != Status::Skipped) {
            let m = &entry.migration;
            let verb = if options.write && m.status != Status::Refused { " (written)" } else { "" };
            println!("{}: {}{verb}", entry.path, m.status.word());
            for reason in &m.reasons {
                let at = if reason.line > 0 { format!("line {}: ", reason.line) } else { String::new() };
                println!("  {at}{}: {}", reason.code, reason.detail);
            }
        }
    }
    Ok(ok)
}

/// Points the TS importers of `migrated` at their `.bloom` modules; returns what
/// still needs a person (JSX that draws a module that is now a view).
fn rewrite_importers(root: &Path, migrated: &[PathBuf]) -> Result<Vec<String>, String> {
    let stems: Vec<PathBuf> = migrated.iter().map(|p| normalize(&root.join(p.with_extension("")))).collect();
    let mut notes = Vec::new();
    for file in modules(&[root.to_path_buf()], true)? {
        let Ok(source) = std::fs::read_to_string(&file) else { continue };
        let dir = file.parent().unwrap_or(root);
        let mut out = String::with_capacity(source.len());
        let mut rest = source.as_str();
        let mut changed = false;
        let mut drawn = Vec::new();
        while let Some(i) = rest.find(['\'', '"']) {
            let quote = rest.as_bytes()[i] as char;
            let Some(len) = rest[i + 1..].find(quote) else { break };
            let spec = &rest[i + 1..i + 1 + len];
            let head = rest[..i].trim_end();
            let is_specifier = ["from", "import(", "require(", "jest.mock(", "jest.requireActual("]
                .iter()
                .any(|k| head.ends_with(k));
            out.push_str(&rest[..=i]);
            let target = if spec.starts_with('.') {
                Some(normalize(&dir.join(spec)))
            } else {
                spec.strip_prefix("@/").map(|s| normalize(&root.join(s)))
            };
            if is_specifier
                && let Some(target) = target
                && stems.contains(&target)
            {
                out.push_str(spec);
                out.push_str(".bloom");
                changed = true;
                drawn.push(target);
            } else {
                out.push_str(spec);
            }
            out.push(quote);
            rest = &rest[i + 1 + len + 1..];
        }
        out.push_str(rest);
        if changed {
            std::fs::write(&file, &out).map_err(|e| format!("{}: {e}", file.display()))?;
            let shown = file.strip_prefix(root).unwrap_or(&file).display().to_string();
            notes.push(format!("{shown}: imports the .bloom module(s)"));
            for target in drawn {
                let name = target.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
                if out.contains(&format!("<{name}")) {
                    notes.push(format!(
                        "  draws <{name} …/> as JSX: a view is drawn as toElement({name}({{ … }}))"
                    ));
                }
            }
        }
    }
    Ok(notes)
}

/// `a/./b/../c` as `a/c`, without touching the disk.
fn normalize(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for part in path.components() {
        match part {
            std::path::Component::CurDir => {}
            std::path::Component::ParentDir => {
                out.pop();
            }
            other => out.push(other),
        }
    }
    out
}
