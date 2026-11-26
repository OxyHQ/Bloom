//! `bloomc migrate`: embedded-language `.tsx` modules to `.bloom` (`bloom_migrate`).
//!
//! Without `--write` nothing changes on disk: each file's status is printed,
//! and `--report` adds the totals and the refusal reasons by frequency.
//! `--write` writes `X.bloom` and its `X.d.bloom.ts` for every file that
//! migrated (or needs review) and removes `X.tsx`: a module is never both (B0610).
//! `--print` prints each translation (or the draft that was refused).

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

/// Every `.tsx`/`.ts` module under `paths` (no declarations, tests, fixtures or dependencies).
fn modules(paths: &[PathBuf]) -> Result<Vec<PathBuf>, String> {
    fn walk(dir: &Path, out: &mut Vec<PathBuf>) -> std::io::Result<()> {
        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            let name = entry.file_name().to_string_lossy().into_owned();
            if entry.file_type()?.is_dir() {
                if !name.starts_with('.') && !SKIPPED_DIRS.contains(&name.as_str()) {
                    walk(&entry.path(), out)?;
                }
            } else if is_module(&name) {
                out.push(entry.path());
            }
        }
        Ok(())
    }
    let mut out = Vec::new();
    for path in paths {
        let meta = std::fs::metadata(path).map_err(|e| format!("{}: {e}", path.display()))?;
        if meta.is_dir() {
            walk(path, &mut out).map_err(|e| format!("{}: {e}", path.display()))?;
        } else {
            out.push(path.clone());
        }
    }
    out.sort();
    out.dedup();
    Ok(out)
}

const SKIPPED_DIRS: &[&str] = &["node_modules", "__tests__", "__mocks__", "__fixtures__", "__perf__"];

fn is_module(name: &str) -> bool {
    (name.ends_with(".tsx") || name.ends_with(".ts"))
        && !name.ends_with(".d.ts")
        && !name.contains(".d.bloom.")
        && !name.contains(".test.")
        && !name.contains(".spec.")
}

/// False when a file was refused.
pub fn migrate(paths: &[PathBuf], options: &MigrateOptions) -> Result<bool, String> {
    let files = modules(paths)?;
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
