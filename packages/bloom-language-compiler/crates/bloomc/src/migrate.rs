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
//! migrated component as JSX (`<X …/>`) draw it as `toElement(X({ … }))` (a view is a node
//! factory), and the ones it cannot rewrite (a view with children) are listed.

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
        let mut migration = result?;
        // A route (under `app/`) keeps its default export, its screen; any other module's default
        // is renamed in its importers, which the fork beside it would not follow.
        let route = path.components().any(|c| c.as_os_str() == "app");
        let renamed_default = migration.default_export.is_some() && !route;
        if migration.status != Status::Skipped
            && renamed_default
            && let Some(fork) = platform_fork(path)
        {
            migration.status = Status::Refused;
            migration.reasons.push(bloom_migrate::Reason {
                code: "module:platform-fork".into(),
                detail: format!(
                    "`{}` is this module's platform fork: its importers name what both export (TS's \
                     default), so the two move to Bloom together",
                    fork.file_name().map(|n| n.to_string_lossy()).unwrap_or_default()
                ),
                line: 0,
            });
        }
        entries.push(Entry { path: shown(path), migration });
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
    // A route's default export is a `Screen`: a component (`screen(…)`), drawn as `<X />`.
    let screens: Vec<bool> = migrated
        .iter()
        .map(|(p, name)| {
            std::fs::read_to_string(root.join(p.with_extension("bloom"))).is_ok_and(|bloom| match name {
                Some(name) => bloom.contains(&format!("struct {name}: Screen")),
                // A route keeps its default export: its screen.
                None => bloom.contains(": Screen {"),
            })
        })
        .collect();
    // A module with a platform fork beside it (`ProfileHoverCard/index.tsx` and `index.web.tsx`)
    // keeps its importers' bare path: Metro and Jest resolve the platform's file first and `.bloom`
    // after, so `X.bloom` would draw this module on every platform.
    let forked: Vec<bool> = migrated.iter().map(|(p, _)| platform_fork(&root.join(p)).is_some()).collect();
    let mut notes = rewrite_bloom_importers(root, migrated, &stems)?;
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
                // Only a static `import … from` names its default import; a mock is renamed below.
                if let Some(name) = name
                    && head.ends_with("from")
                {
                    named_default_import(&mut out, name);
                    named_default_export(&mut out, name);
                }
                out.push_str(bare);
                if !forked[index] {
                    out.push_str(".bloom");
                }
                changed = true;
                if head.ends_with("jest.mock(") {
                    let after = &rest[i + 1 + len + 1..];
                    if let Some(end) = call_end(after) {
                        let mut call = after[..end].to_string();
                        // `jest.mock(spec, () => ({ default: … }))` mocks the export by its name.
                        if let Some(name) = name
                            && let Some(at) = call.find("default:")
                        {
                            call.replace_range(at..at + "default:".len(), &format!("{name}:"));
                        }
                        let views =
                            exported_views(&root.join(migrated[index].0.with_extension("d.bloom.ts")));
                        let mocked = mock_views(&call, &views);
                        if mocked.is_some() || call != after[..end] {
                            out.push(quote);
                            out.push_str(&mocked.unwrap_or(call));
                            rest = &after[end..];
                            continue;
                        }
                    }
                }
                // `lazy(() => import('./X'))` reads the module's default: 2.0 exports it by name,
                // so the import hands it on as the default `lazy` takes.
                if let Some(name) = name
                    && head.ends_with("import(")
                    && rest[i + 1 + len + 1..].starts_with(')')
                    && !rest[i + 1 + len + 2..].trim_start().starts_with(".then")
                {
                    out.push(quote);
                    out.push_str(&format!(").then((m) => ({{ default: m.{name} }}))"));
                    rest = &rest[i + 1 + len + 2..];
                    continue;
                }
                let statement = &head[head.rfind("import").unwrap_or(head.len())..];
                let mut names = imported_names(statement);
                if screens[index] {
                    let local = match name {
                        Some(name) => statement
                            .split(['{', '}', ','])
                            .map(str::trim)
                            .find_map(|part| part.strip_prefix(&format!("{name} as ")))
                            .map_or(name, str::trim)
                            .to_string(),
                        // `import X from`: the default import's own name.
                        None => statement
                            .strip_prefix("import")
                            .map(|c| c.trim().trim_end_matches("from").trim())
                            .map(|c| c.split([',', '{']).next().unwrap_or("").trim().to_string())
                            .unwrap_or_default(),
                    };
                    names.retain(|n| *n != local);
                }
                drawn.extend(names);
            } else {
                out.push_str(spec);
            }
            out.push(quote);
            rest = &rest[i + 1 + len + 1..];
        }
        out.push_str(rest);
        if changed {
            // `<X …/>` of a migrated view: `toElement(X({ … }))`.
            let names: Vec<String> = drawn.to_vec();
            let redrawn = bloom_migrate::draw_views_as_nodes(&out, &file.to_string_lossy(), &names);
            let out = redrawn.clone().unwrap_or(out);
            std::fs::write(&file, &out).map_err(|e| format!("{}: {e}", file.display()))?;
            let shown = file.strip_prefix(root).unwrap_or(&file).display().to_string();
            notes.push(format!("{shown}: imports the .bloom module(s)"));
            if redrawn.is_some() {
                notes.push("  draws the migrated views as toElement(X({ … }))".to_string());
            }
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

/// The views a migrated module exports, from its declarations
/// (`export declare const X: (props: P) => ComposedView`).
fn exported_views(dts: &Path) -> Vec<String> {
    let Ok(text) = std::fs::read_to_string(dts) else { return Vec::new() };
    text.lines()
        .filter_map(|line| {
            let rest = line.strip_prefix("export declare const ")?;
            let (name, ty) = rest.split_once(": ")?;
            (ty.contains("=> ComposedView") || ty.contains("=> ViewNode")).then(|| name.to_string())
        })
        .collect()
}

/// `jest.mock(spec, factory)` of a migrated module whose views the factory mocks as React
/// components (`X: (props) => <Text …/>`, `X: 'X'`): each such view's mock is the component drawn
/// as the view's node (`Embed`), since a TS importer now calls the view (`toElement(X({ … }))`).
/// `call` is the text after the specifier (`, () => …`); none when it mocks no view.
fn mock_views(call: &str, views: &[String]) -> Option<String> {
    let factory = call.trim_start().strip_prefix(',')?.trim();
    let factory = factory.strip_suffix(',').unwrap_or(factory).trim_end();
    let mocked: Vec<&String> = views
        .iter()
        .filter(|v| {
            call.match_indices(v.as_str()).any(|(i, _)| {
                let before = call[..i].chars().next_back();
                let after = call[i + v.len()..].trim_start();
                !before.is_some_and(|c| c.is_alphanumeric() || c == '_' || c == '.')
                    && (after.starts_with(':') || after.starts_with('(') || after.starts_with(','))
            })
        })
        .collect();
    if factory.is_empty() || mocked.is_empty() {
        return None;
    }
    let fields: Vec<String> = mocked.iter().map(|v| format!("{v}: asView(mod.{v})")).collect();
    let names: Vec<String> = mocked.iter().map(|v| format!("`{v}`")).collect();
    Some(format!(
        ", () => {{\n  // {}: the migrated module's view(s); each mocked component is drawn as the view's node.\n  const mod = ({factory})() as Record<string, unknown>;\n  const {{ Embed }} = jest.requireActual<typeof import('@oxy.so/bloom-language')>('@oxy.so/bloom-language');\n  const {{ createElement }} = jest.requireActual<typeof import('react')>('react');\n  const asView = (c: unknown) =>\n    typeof c === 'function' || typeof c === 'string'\n      ? (props: object) => Embed(createElement(c as never, props))\n      : c;\n  return {{ ...mod, {} }};\n}}",
        names.join(", "),
        fields.join(", ")
    ))
}

/// `.bloom` modules that import a migrated file's default export (`import { default as X }
/// from "./X"`, as 0.x modules and earlier migrations wrote it) take it by its 2.0 name.
fn rewrite_bloom_importers(
    root: &Path,
    migrated: &[(PathBuf, Option<String>)],
    stems: &[PathBuf],
) -> Result<Vec<String>, String> {
    fn walk(dir: &Path, out: &mut Vec<PathBuf>) -> std::io::Result<()> {
        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            let name = entry.file_name().to_string_lossy().into_owned();
            if entry.file_type()?.is_dir() {
                if !name.starts_with('.') && name != "node_modules" {
                    walk(&entry.path(), out)?;
                }
            } else if name.ends_with(".bloom") {
                out.push(entry.path());
            }
        }
        Ok(())
    }
    let mut files = Vec::new();
    walk(root, &mut files).map_err(|e| format!("{}: {e}", root.display()))?;
    let mut notes = Vec::new();
    for file in files {
        let Ok(source) = std::fs::read_to_string(&file) else { continue };
        let dir = file.parent().unwrap_or(root);
        let mut changed = false;
        let lines: Vec<String> = source
            .split_inclusive('\n')
            .map(|line| {
                let Some(rest) = line.strip_prefix("import {") else { return line.to_string() };
                let Some((clause, spec)) = rest.split_once("} from \"") else { return line.to_string() };
                let Some(spec) = spec.split('"').next() else { return line.to_string() };
                if !clause.contains("default as ") {
                    return line.to_string();
                }
                let bare = spec.strip_suffix(".bloom").unwrap_or(spec);
                let target = if bare.starts_with('.') {
                    normalize(&dir.join(bare))
                } else if let Some(s) = bare.strip_prefix("@/") {
                    normalize(&root.join(s))
                } else {
                    return line.to_string();
                };
                let Some(index) = stems.iter().position(|s| s == &target) else { return line.to_string() };
                let Some(name) = migrated[index].1.as_deref() else { return line.to_string() };
                let parts: Vec<String> = clause
                    .split(',')
                    .map(str::trim)
                    .filter(|p| !p.is_empty())
                    .map(|part| match part.strip_prefix("default as ") {
                        Some(local) if local.trim() == name => name.to_string(),
                        Some(local) => format!("{name} as {}", local.trim()),
                        None => part.to_string(),
                    })
                    .collect();
                let rewritten = format!(
                    "import {{ {} }} from \"{spec}\"{}",
                    parts.join(", "),
                    &rest[rest.find(&format!("\"{spec}\"")).map_or(rest.len(), |i| i + spec.len() + 2)..]
                );
                if rewritten != line {
                    changed = true;
                }
                rewritten
            })
            .collect();
        if changed {
            std::fs::write(&file, lines.concat()).map_err(|e| format!("{}: {e}", file.display()))?;
            let shown = file.strip_prefix(root).unwrap_or(&file).display().to_string();
            notes.push(format!("{shown}: imports the migrated default export(s) by name"));
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

/// A sibling of `path` for another platform (`CameraPage.web.tsx` beside `CameraPage.tsx`, or
/// the other way round). Metro and Jest resolve `X` to the platform's file first.
fn platform_fork(path: &Path) -> Option<PathBuf> {
    const PLATFORMS: [&str; 4] = ["web", "native", "ios", "android"];
    const EXTS: [&str; 4] = ["tsx", "ts", "jsx", "js"];
    let dir = path.parent()?;
    let name = path.file_name()?.to_str()?;
    let (stem, _) = name.rsplit_once('.')?;
    let (base, own) = match stem.rsplit_once('.') {
        Some((base, platform)) if PLATFORMS.contains(&platform) => (base, Some(platform)),
        _ => (stem, None),
    };
    let candidates = PLATFORMS
        .iter()
        .filter(|p| Some(**p) != own)
        .flat_map(|p| EXTS.iter().map(move |ext| format!("{base}.{p}.{ext}")))
        .chain(own.into_iter().flat_map(|_| EXTS.iter().map(|ext| format!("{base}.{ext}"))));
    candidates.map(|c| dir.join(c)).find(|c| c.is_file())
}

/// `export { default } from` (a route re-exporting its page) as `export { Name as default } from`;
/// `export { default as X }` as `export { Name as X }`.
fn named_default_export(out: &mut String, name: &str) {
    let Some(start) = out.rfind("export") else { return };
    let Some(from) = out[start..].rfind("from").map(|i| start + i) else { return };
    if out[start..from].contains("import") {
        return;
    }
    let clause = out[start + "export".len()..from].trim();
    let Some(inner) = clause.strip_prefix('{').and_then(|c| c.strip_suffix('}')) else { return };
    let items: Vec<String> = inner
        .split(',')
        .map(str::trim)
        .filter(|item| !item.is_empty())
        .map(|item| match item.strip_prefix("default") {
            Some("") => format!("{name} as default"),
            Some(rest) if rest.starts_with(' ') => format!("{name}{rest}"),
            _ => item.to_string(),
        })
        .collect();
    out.replace_range(start..from, &format!("export {{ {} }} ", items.join(", ")));
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
    fn a_re_exported_default_is_exported_by_name() {
        let mut out = "export { default } from ".to_string();
        named_default_export(&mut out, "CameraPage");
        assert_eq!(out, "export { CameraPage as default } from ");
        let mut out = "import X from './a';\nexport { default as Page, other } from ".to_string();
        named_default_export(&mut out, "CameraPage");
        assert_eq!(out, "import X from './a';\nexport { CameraPage as Page, other } from ");
        // An import after the last export is not an export.
        let mut out = "export const a = 1;\nimport X from ".to_string();
        named_default_export(&mut out, "CameraPage");
        assert_eq!(out, "export const a = 1;\nimport X from ");
    }

    #[test]
    fn a_platform_sibling_is_a_fork() {
        let root = std::env::temp_dir().join(format!("bloomc-forks-{}", std::process::id()));
        std::fs::create_dir_all(&root).unwrap();
        for name in ["Camera.tsx", "Camera.web.tsx", "Alone.tsx"] {
            std::fs::write(root.join(name), "").unwrap();
        }
        assert_eq!(platform_fork(&root.join("Camera.tsx")), Some(root.join("Camera.web.tsx")));
        assert_eq!(platform_fork(&root.join("Camera.web.tsx")), Some(root.join("Camera.tsx")));
        assert_eq!(platform_fork(&root.join("Alone.tsx")), None);
        std::fs::remove_dir_all(&root).unwrap();
    }

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
             /* drags ESM in at import time */\n\
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
             /* drags ESM in at import time */\n\
             jest.mock('@/Post/LaneChip.bloom', () => ({ __esModule: true, LaneChip: () => null }));\n"
        );
    }
}
