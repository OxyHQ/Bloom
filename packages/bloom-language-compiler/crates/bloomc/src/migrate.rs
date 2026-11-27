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
    // The migration mode (ADR 0002, section 4): a migrated module may still import TS by path.
    let lang = bloom_lang::Options { root: root.clone(), allow_ts_imports: true, ..Default::default() };
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
    let written: Vec<(PathBuf, Option<String>)> = files
        .iter()
        .zip(&entries)
        .filter(|(_, e)| {
            options.write && matches!(e.migration.status, Status::Migrated | Status::NeedsReview)
        })
        .map(|(p, e)| (p.clone(), e.migration.default_export.clone()))
        .collect();
    if !written.is_empty()
        && let Some(root) = &root
    {
        for note in rewrite_importers(root, &written)? {
            println!("{note}");
        }
        // Now that the modules are `.bloom` on disk: their imports of one another by path
        // become module imports (or go, within one module), and npm imports with a binding
        // target import it; each file is kept so only when it still compiles.
        for (path, _) in &written {
            if let Some(note) = module_imports(root, &bloom_path(path), &lang)? {
                println!("{note}");
            }
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

/// `file`'s string imports, in 2.0's module imports where the manifest says (ADR 0002,
/// sections 1 and 4): another `.bloom` module of its own target is dropped (its names are
/// the module's), one of another target is `import Target`, and an npm package that a
/// `.bindings` target binds is `import Target`. Kept only when the file compiles so.
fn module_imports(root: &Path, file: &Path, lang: &bloom_lang::Options) -> Result<Option<String>, String> {
    use bloom_lang::ast::ImportKind;
    let absolute = std::path::absolute(file).map_err(|e| e.to_string())?;
    let Some(package) = bloom_lang::modules::find_root(&absolute) else { return Ok(None) };
    let loaded = bloom_lang::modules::load(&package);
    let Ok(graph) = loaded.as_ref() else { return Ok(None) };
    let Some(own) = graph.target_of(&absolute) else { return Ok(None) };
    let source = std::fs::read_to_string(file).map_err(|e| format!("{}: {e}", file.display()))?;
    let shown = file.strip_prefix(root).unwrap_or(file).to_string_lossy().into_owned();
    let (ast, _, diagnostics) = bloom_lang::parse(&source, &shown);
    if !diagnostics.is_empty() {
        return Ok(None);
    }
    let dir = absolute.parent().map(Path::to_path_buf).unwrap_or_default();
    let mut out = String::new();
    let mut at = 0;
    let mut modules: Vec<String> = Vec::new();
    let mut changed = 0;
    for import in &ast.imports {
        if matches!(import.kind, ImportKind::Module(_)) {
            continue;
        }
        let spec = import.source.as_str();
        let target = if spec.starts_with('.') {
            Some(normalize(&dir.join(spec)))
        } else {
            spec.strip_prefix("@/").map(|s| normalize(&root.join(s)))
        };
        let module = match target {
            Some(stem) => {
                let bloom = if stem.extension().is_some_and(|e| e == "bloom") {
                    stem.clone()
                } else {
                    stem.with_extension("bloom")
                };
                if !bloom.is_file() {
                    continue;
                }
                match graph.target_of(&bloom) {
                    Some(t) if t == own => None,
                    Some(t) => Some(graph.manifest.targets[t].name.clone()),
                    None => continue,
                }
            }
            None => {
                let bound =
                    graph.manifest.targets.iter().find(|t| t.npm().is_some_and(|(npm, _)| npm == spec));
                match bound {
                    Some(t) => Some(t.name.clone()),
                    None => continue,
                }
            }
        };
        let (start, end) = (import.span.start as usize, import.span.end as usize);
        out.push_str(&source[at..start]);
        if let Some(module) = module
            && !modules.contains(&module)
        {
            out.push_str(&format!("import {module}"));
            modules.push(module);
        }
        at = end;
        changed += 1;
    }
    if changed == 0 {
        return Ok(None);
    }
    out.push_str(&source[at..]);
    let Ok(formatted) = bloom_fmt::format(&out, &shown) else { return Ok(None) };
    let compiled = bloom_lang::compile(&formatted, &absolute.to_string_lossy(), lang);
    if !compiled.diagnostics.is_empty() {
        return Ok(Some(format!("{shown}: keeps its path imports ({})", compiled.diagnostics[0].message)));
    }
    std::fs::write(file, &formatted).map_err(|e| format!("{}: {e}", file.display()))?;
    Ok(Some(format!("{shown}: {changed} path import(s) as module imports")))
}

/// Points the TS importers of `migrated` at their `.bloom` modules; returns what
/// still needs a person (JSX that draws a module that is now a view).
pub(crate) fn rewrite_importers(
    root: &Path,
    migrated: &[(PathBuf, Option<String>)],
) -> Result<Vec<String>, String> {
    let stems: Vec<PathBuf> =
        migrated.iter().map(|(p, _)| normalize(&root.join(p.with_extension("")))).collect();
    let mut notes = Vec::new();
    for file in modules(&[root.to_path_buf()], true)? {
        let Ok(source) = std::fs::read_to_string(&file) else { continue };
        let dir = file.parent().unwrap_or(root);
        let mut out = String::with_capacity(source.len());
        let mut rest = source.as_str();
        let mut changed = false;
        let mut drawn = Vec::new();
        while let Some(i) = rest.find(['\'', '"', '/']) {
            // A comment is copied as it is: an apostrophe in it opens no string.
            if rest.as_bytes()[i] == b'/' {
                let comment = match rest.as_bytes().get(i + 1) {
                    Some(b'/') => Some(rest[i..].find('\n').map_or(rest.len(), |n| i + n)),
                    Some(b'*') => Some(rest[i + 2..].find("*/").map_or(rest.len(), |n| i + 2 + n + 2)),
                    _ => None,
                };
                let end = comment.unwrap_or(i + 1);
                out.push_str(&rest[..end]);
                rest = &rest[end..];
                continue;
            }
            let quote = rest.as_bytes()[i] as char;
            let Some(len) = rest[i + 1..].find(quote) else { break };
            let spec = &rest[i + 1..i + 1 + len];
            let head = rest[..i].trim_end();
            let is_specifier = ["from", "import(", "require(", "jest.mock(", "jest.requireActual("]
                .iter()
                .any(|k| head.ends_with(k));
            out.push_str(&rest[..=i]);
            // A `.bloom` module migrated from 0.x is imported as `X.bloom` already.
            let bare = spec.strip_suffix(".bloom").unwrap_or(spec);
            let target = if bare.starts_with('.') {
                Some(normalize(&dir.join(bare)))
            } else {
                bare.strip_prefix("@/").map(|s| normalize(&root.join(s)))
            };
            if is_specifier
                && let Some(target) = target
                && let Some(index) = stems.iter().position(|s| s == &target)
            {
                // 2.0 exports a TS default export by name: `import X from` becomes
                // `import { Name as X } from`.
                let name = migrated[index].1.as_deref();
                if let Some(name) = name {
                    named_default_import(&mut out, name);
                }
                out.push_str(bare);
                out.push_str(".bloom");
                changed = true;
                // `jest.mock(spec, () => ({ default: … }))` mocks the export by its name.
                if let Some(name) = name
                    && head.ends_with("jest.mock(")
                {
                    let after = &rest[i + 1 + len + 1..];
                    if let Some(end) = call_end(after)
                        && let Some(at) = after[..end].find("default:")
                    {
                        let mut call = after[..end].to_string();
                        call.replace_range(at..at + "default:".len(), &format!("{name}:"));
                        out.push(quote);
                        out.push_str(&call);
                        rest = &after[end..];
                        continue;
                    }
                }
                let statement = &head[head.rfind("import").unwrap_or(head.len())..];
                drawn.extend(imported_names(statement));
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
            for name in drawn {
                let tag = format!("<{name}");
                let drawn_as_jsx = out.match_indices(&tag).any(|(i, _)| {
                    !out[i + tag.len()..].starts_with(|c: char| c.is_ascii_alphanumeric() || c == '_')
                });
                if drawn_as_jsx {
                    notes.push(format!(
                        "  draws <{name} …/> as JSX: a view is drawn as toElement({name}({{ … }}))"
                    ));
                }
            }
        }
    }
    Ok(notes)
}

/// Where the call `text` is inside (after its first argument) closes: the index of its `)`.
fn call_end(text: &str) -> Option<usize> {
    let mut depth = 0usize;
    for (i, c) in text.char_indices() {
        match c {
            '(' | '{' | '[' => depth += 1,
            ')' | '}' | ']' if depth == 0 => return (c == ')').then_some(i),
            ')' | '}' | ']' => depth -= 1,
            _ => {}
        }
    }
    None
}

/// The `import` statement `out` ends inside (at its specifier's opening quote), with its
/// default import `X` (`import X from`, `import X, { … } from`) as `{ name as X }`.
fn named_default_import(out: &mut String, name: &str) {
    let Some(start) = out.rfind("import") else { return };
    let Some(from) = out[start..].rfind("from").map(|i| start + i) else { return };
    let clause = out[start + "import".len()..from].trim().to_string();
    if clause.starts_with('{') || clause.starts_with('*') || clause.starts_with("type ") {
        return;
    }
    let (default, rest) = match clause.split_once(',') {
        Some((d, r)) => (d.trim().to_string(), r.trim().to_string()),
        None => (clause.clone(), String::new()),
    };
    if default.is_empty() {
        return;
    }
    let named = if default == name { name.to_string() } else { format!("{name} as {default}") };
    let clause = match rest.strip_prefix('{').and_then(|r| r.strip_suffix('}')) {
        Some(inner) if !inner.trim().is_empty() => format!("{{ {named}, {} }}", inner.trim()),
        _ => format!("{{ {named} }}"),
    };
    out.replace_range(start..from, &format!("import {clause} "));
}

/// The local names an `import … from` statement binds (`import X`, `{ A, B as C }`).
fn imported_names(statement: &str) -> Vec<String> {
    let Some(clause) = statement.strip_prefix("import") else { return Vec::new() };
    let clause = clause.trim().trim_end_matches("from").trim();
    let clause = clause.strip_prefix("type ").unwrap_or(clause);
    let mut names = Vec::new();
    let (default, braces) = match clause.find('{') {
        Some(i) => (&clause[..i], &clause[i + 1..clause.rfind('}').unwrap_or(clause.len())]),
        None => (clause, ""),
    };
    let default = default.trim().trim_end_matches(',').trim();
    if !default.is_empty() && !default.starts_with('*') {
        names.push(default.to_string());
    }
    for part in braces.split(',') {
        let part = part.trim();
        let local = part.rsplit(" as ").next().unwrap_or(part).trim();
        let local = local.strip_prefix("type ").unwrap_or(local);
        if !local.is_empty() {
            names.push(local.to_string());
        }
    }
    names
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_0x_default_export_is_imported_and_mocked_by_name() {
        let root = std::env::temp_dir().join(format!("bloomc-importers-{}", std::process::id()));
        std::fs::create_dir_all(root.join("Post")).unwrap();
        let caller = root.join("Feed.tsx");
        std::fs::write(
            &caller,
            "// The row's chip, and the warning's.\n\
             import Chip from './Post/LaneChip.bloom';\n\
             import { Other } from './Post/Other.bloom';\n\
             jest.mock('@/Post/LaneChip.bloom', () => ({ __esModule: true, default: () => null }));\n",
        )
        .unwrap();
        let notes =
            rewrite_importers(&root, &[(PathBuf::from("Post/LaneChip.bloom"), Some("LaneChip".into()))])
                .unwrap();
        let out = std::fs::read_to_string(&caller).unwrap();
        std::fs::remove_dir_all(&root).unwrap();
        assert_eq!(notes, vec!["Feed.tsx: imports the .bloom module(s)".to_string()]);
        assert_eq!(
            out,
            "// The row's chip, and the warning's.\n\
             import { LaneChip as Chip } from './Post/LaneChip.bloom';\n\
             import { Other } from './Post/Other.bloom';\n\
             jest.mock('@/Post/LaneChip.bloom', () => ({ __esModule: true, LaneChip: () => null }));\n"
        );
    }
}
