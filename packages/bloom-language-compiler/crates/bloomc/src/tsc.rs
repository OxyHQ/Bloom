//! `bloomc check --tsc`: the foreign boundary checked by the project's own
//! `tsc` (spec 4.7: what bloomc cannot see in a `.d.ts`, `tsc` does).
//!
//! Every `.bloom` file of the project is compiled to TypeScript into a mirror
//! of the project under `node_modules/.cache/bloomc/tsc/` (`src/Row.bloom` is
//! `src/Row.bloom.ts`, which `import … from "./Row.bloom"` finds first, with a
//! `src/Row.ts` beside it for `"./Row"`). A generated `tsconfig.json` there
//! extends the project's, merges the mirror with the project (`rootDirs`, so
//! the emitted modules' relative TS imports reach the project's files) and
//! points each `paths` target at the mirror before the project. The project's
//! `tsc --noEmit` checks it, and every diagnostic in emitted code is mapped
//! through the compiler's source map back to the `.bloom` span that wrote it.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Instant;

use bloom_lang::ast::Visibility;
use bloom_lang::{Diagnostic, Span};

use crate::files::{bloom_files, normalize, relative, relative_url};
use crate::json::{self, Value, object};
use crate::{parallel, text};

/// Where the mirror and its config live, under the project.
pub const MIRROR: &str = "node_modules/.cache/bloomc/tsc";
/// The code of a `tsc` error at a `.bloom` span (interop: B06xx).
const CODE: &str = "B0620";

/// One emitted module: the `.bloom` file, its source, and the compiler's map.
struct Emitted {
    bloom: PathBuf,
    source: String,
    map: Option<String>,
}

/// Compiles and `tsc`-checks every `.bloom` file under `paths` (the project
/// when none) of the project at `project` (the working directory by default);
/// false when bloomc or `tsc` finds an error.
pub fn check(paths: &[PathBuf], project: Option<&Path>, jobs: usize) -> Result<bool, String> {
    let started = Instant::now();
    let cwd = std::env::current_dir().map_err(|e| e.to_string())?;
    let root = std::path::absolute(project.unwrap_or(&cwd)).map_err(|e| e.to_string())?;
    let tsconfig = root.join("tsconfig.json");
    if !tsconfig.is_file() {
        return Err(format!("{}: no tsconfig.json (pass the project with --project)", root.display()));
    }
    let typescript = find_tsc(&root)?;
    let targets = if paths.is_empty() { vec![root.clone()] } else { paths.to_vec() };
    let files: Vec<PathBuf> = bloom_files(&targets)?
        .iter()
        .map(std::path::absolute)
        .collect::<Result<_, _>>()
        .map_err(|e| e.to_string())?;
    if let Some(outside) = files.iter().find(|file| !file.starts_with(&root)) {
        return Err(format!("{}: outside the project {}", outside.display(), root.display()));
    }

    let mirror = root.join(MIRROR);
    match std::fs::remove_dir_all(&mirror) {
        Err(e) if e.kind() != std::io::ErrorKind::NotFound => {
            return Err(format!("{}: {e}", mirror.display()));
        }
        _ => {}
    }
    let options = bloom_lang::Options { root: Some(root.clone()), ..Default::default() };
    let compiled = parallel::map(&files, jobs, |path| {
        let source = std::fs::read_to_string(path).map_err(|e| format!("{}: {e}", path.display()))?;
        let output = bloom_lang::compile(&source, &shown(path, &cwd), &options);
        Ok::<_, String>((source, output))
    });

    let (mut errors, mut warnings) = (0, 0);
    let mut emitted: HashMap<PathBuf, Emitted> = HashMap::new();
    let mut roots = Vec::new();
    for (path, result) in files.iter().zip(compiled) {
        let (source, output) = result?;
        for diagnostic in output.warnings.iter().chain(&output.diagnostics) {
            eprintln!("{}\n", diagnostic.rendered);
        }
        warnings += output.warnings.len();
        errors += output.diagnostics.len();
        if !output.diagnostics.is_empty() {
            continue;
        }
        let module = mirror.join(relative(path, &root)).with_added_extension("ts");
        write(&module, &output.code)?;
        // `import { Row } from "./Row"` names the `.bloom` module too.
        let stem = path.file_stem().unwrap_or_default().to_string_lossy().into_owned();
        let has_default =
            bloom_lang::parse(&source, "").0.items.iter().any(|i| i.visibility == Visibility::PubDefault);
        let mut reexport = format!("export * from \"./{stem}.bloom\";\n");
        if has_default {
            reexport.push_str(&format!("export {{ default }} from \"./{stem}.bloom\";\n"));
        }
        let stub = module.with_file_name(format!("{stem}.ts"));
        write(&stub, &reexport)?;
        emitted.insert(stub, Emitted { bloom: path.clone(), source: source.clone(), map: None });
        roots.push(module.clone());
        emitted.insert(module, Emitted { bloom: path.clone(), source, map: output.map });
    }

    if !roots.is_empty() {
        let config = mirror.join("tsconfig.json");
        write(&config, &json::write(&generated_config(&root, &tsconfig, &mirror, &roots)?))?;
        let run = Command::new("node")
            .arg(&typescript)
            .args(["--noEmit", "--pretty", "false", "-p"])
            .arg(&config)
            .current_dir(&root)
            .output()
            .map_err(|e| format!("node {}: {e}", typescript.display()))?;
        let stdout = String::from_utf8_lossy(&run.stdout);
        let reported = parse_output(&stdout);
        if !run.status.success() && reported.is_empty() {
            return Err(format!(
                "tsc failed with no diagnostics:\n{stdout}{}",
                String::from_utf8_lossy(&run.stderr)
            ));
        }
        for problem in reported {
            let file = problem.file.as_ref().map(|f| root.join(f));
            match file.as_ref().and_then(|f| emitted.get(f)) {
                Some(module) => eprintln!("{}\n", lift(&problem, module, &cwd).rendered),
                None => eprintln!("{}\n", problem.raw),
            }
            if problem.severity == "error" {
                errors += 1;
            } else {
                warnings += 1;
            }
        }
    }
    let plural = |n: usize, word: &str| format!("{n} {word}{}", if n == 1 { "" } else { "s" });
    eprintln!(
        "bloomc: checked {} with tsc ({}, {}) in {} ms",
        plural(files.len(), "file"),
        plural(errors, "error"),
        plural(warnings, "warning"),
        started.elapsed().as_millis()
    );
    Ok(errors == 0)
}

fn shown(path: &Path, cwd: &Path) -> String {
    relative(path, cwd).to_string_lossy().into_owned()
}

fn write(path: &Path, text: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("{}: {e}", parent.display()))?;
    }
    std::fs::write(path, text).map_err(|e| format!("{}: {e}", path.display()))
}

/// The project's own TypeScript: `node_modules/typescript/bin/tsc` from the
/// project up.
fn find_tsc(root: &Path) -> Result<PathBuf, String> {
    root.ancestors()
        .map(|dir| dir.join("node_modules/typescript/bin/tsc"))
        .find(|tsc| tsc.is_file())
        .ok_or_else(|| {
            format!("{}: TypeScript is not installed (no node_modules/typescript)", root.display())
        })
}

/// A path from the mirror's directory, as `tsconfig.json` writes one.
fn from_mirror(mirror: &Path, to: &Path) -> String {
    match relative_url(mirror, to) {
        url if url.is_empty() => ".".to_string(),
        url if url.starts_with("..") => url,
        url => format!("./{url}"),
    }
}

fn generated_config(root: &Path, tsconfig: &Path, mirror: &Path, roots: &[PathBuf]) -> Result<Value, String> {
    let mut options = vec![
        ("noEmit", Value::Bool(true)),
        ("emitDeclarationOnly", Value::Bool(false)),
        ("incremental", Value::Bool(false)),
        ("composite", Value::Bool(false)),
        ("allowArbitraryExtensions", Value::Bool(true)),
        ("rootDirs", Value::Array(vec![from_mirror(mirror, root).into(), ".".into()])),
    ];
    if let Some(paths) = project_paths(tsconfig)? {
        // Targets are relative to the inherited `baseUrl` when there is one, else to this config.
        let base = paths.base_url.as_deref().unwrap_or(mirror);
        let mut mapped = std::collections::BTreeMap::new();
        for (pattern, targets) in &paths.entries {
            let mut out = Vec::new();
            for target in targets {
                let absolute = normalize(&paths.dir.join(target));
                if let Ok(inside) = absolute.strip_prefix(root) {
                    out.push(Value::from(from_mirror(base, &mirror.join(inside))));
                }
                out.push(Value::from(from_mirror(base, &absolute)));
            }
            mapped.insert(pattern.clone(), Value::Array(out));
        }
        options.push(("paths", Value::Object(mapped)));
    }
    Ok(object([
        ("extends", from_mirror(mirror, tsconfig).into()),
        ("compilerOptions", Value::Object(options.into_iter().map(|(k, v)| (k.to_string(), v)).collect())),
        ("files", Value::Array(roots.iter().map(|r| from_mirror(mirror, r).into()).collect())),
        ("include", Value::Array(Vec::new())),
    ]))
}

/// `paths` as written: each pattern with its targets.
type PathEntries = Vec<(String, Vec<String>)>;

/// A project's effective `compilerOptions.paths`: its patterns, the directory
/// its targets are relative to, and the inherited `baseUrl` (absolute).
#[derive(Debug, PartialEq)]
struct Paths {
    entries: PathEntries,
    dir: PathBuf,
    base_url: Option<PathBuf>,
}

/// Follows `extends` (relative paths and packages, a string or an array) as
/// `tsc` does: the nearest config's `paths` and `baseUrl` win.
fn project_paths(tsconfig: &Path) -> Result<Option<Paths>, String> {
    let mut paths: Option<(PathEntries, PathBuf)> = None;
    let mut base_url: Option<PathBuf> = None;
    let mut queue = vec![tsconfig.to_path_buf()];
    let mut seen = Vec::new();
    while let Some(config) = queue.pop() {
        if seen.contains(&config) {
            continue;
        }
        seen.push(config.clone());
        let text = std::fs::read_to_string(&config).map_err(|e| format!("{}: {e}", config.display()))?;
        let value = json::parse(&strip_jsonc(&text)).map_err(|e| format!("{}: {e}", config.display()))?;
        let dir = config.parent().unwrap_or(Path::new("")).to_path_buf();
        let options = value.get("compilerOptions");
        if base_url.is_none()
            && let Some(url) = options.get("baseUrl").as_str()
        {
            base_url = Some(normalize(&dir.join(url)));
        }
        if paths.is_none()
            && let Value::Object(entries) = options.get("paths")
        {
            let entries = entries
                .iter()
                .map(|(k, v)| {
                    (k.clone(), v.as_array().iter().filter_map(|t| t.as_str().map(String::from)).collect())
                })
                .collect();
            paths = Some((entries, dir.clone()));
        }
        let extends = match value.get("extends") {
            Value::String(one) => vec![one.clone()],
            Value::Array(many) => many.iter().filter_map(|v| v.as_str().map(String::from)).collect(),
            _ => Vec::new(),
        };
        // The last of an array has the highest precedence, as the nearest: it is read first.
        for spec in extends {
            if let Some(found) = resolve_extends(&dir, &spec) {
                queue.push(found);
            }
        }
    }
    Ok(paths.map(|(entries, dir)| Paths { dir: base_url.clone().unwrap_or(dir), entries, base_url }))
}

fn resolve_extends(dir: &Path, spec: &str) -> Option<PathBuf> {
    let with_json = |p: PathBuf| -> Option<PathBuf> {
        if p.is_file() {
            return Some(p);
        }
        let json = p.with_added_extension("json");
        if json.is_file() {
            return Some(json);
        }
        let inner = p.join("tsconfig.json");
        inner.is_file().then_some(inner)
    };
    if spec.starts_with('.') || Path::new(spec).is_absolute() {
        return with_json(normalize(&dir.join(spec)));
    }
    dir.ancestors().find_map(|base| with_json(base.join("node_modules").join(spec)))
}

/// JSON with comments and trailing commas (a `tsconfig.json`) as JSON: comments
/// go first, then each comma whose next character closes an object or array.
fn strip_jsonc(text: &str) -> String {
    let without_comments = outside_strings(text, |rest| {
        if rest.starts_with("//") {
            Some(rest.find('\n').unwrap_or(rest.len()))
        } else {
            let body = rest.strip_prefix("/*")?;
            Some(body.find("*/").map_or(rest.len(), |end| end + 4))
        }
    });
    outside_strings(&without_comments, |rest| {
        let after = rest.strip_prefix(',')?.trim_start();
        (after.starts_with('}') || after.starts_with(']')).then_some(1)
    })
}

/// `text` without the runs `skip` measures (`Some(length)`) where one starts
/// outside a string.
fn outside_strings(text: &str, skip: impl Fn(&str) -> Option<usize>) -> String {
    let mut out = String::with_capacity(text.len());
    let mut chars = text.char_indices().peekable();
    let mut in_string = false;
    while let Some((at, c)) = chars.next() {
        if in_string {
            out.push(c);
            match c {
                '\\' => {
                    if let Some((_, escaped)) = chars.next() {
                        out.push(escaped);
                    }
                }
                '"' => in_string = false,
                _ => {}
            }
            continue;
        }
        if let Some(length) = skip(&text[at..]) {
            while chars.peek().is_some_and(|&(next, _)| next < at + length) {
                chars.next();
            }
            continue;
        }
        in_string = c == '"';
        out.push(c);
    }
    out
}

/// One diagnostic as `tsc --pretty false` prints it.
#[derive(Debug, PartialEq)]
struct Reported {
    /// Relative to the project, as tsc prints it (none for a global diagnostic).
    file: Option<String>,
    /// 1-based line and UTF-16 column.
    line: u32,
    column: u32,
    severity: String,
    code: String,
    /// The message, its chained lines after the first.
    message: String,
    raw: String,
}

/// `file(line,col): error TS2322: message`, chained lines indented below it;
/// `error TS5023: message` for a global one.
fn parse_output(output: &str) -> Vec<Reported> {
    let mut reported: Vec<Reported> = Vec::new();
    for line in output.lines() {
        if line.starts_with(' ')
            && let Some(last) = reported.last_mut()
        {
            last.message.push('\n');
            last.message.push_str(line);
            last.raw.push('\n');
            last.raw.push_str(line);
            continue;
        }
        let (location, rest) = match line.find("): ") {
            Some(at) if line[..at].contains('(') => (Some(&line[..at + 1]), &line[at + 3..]),
            _ => (None, line),
        };
        let Some((severity, rest)) = rest.split_once(' ') else { continue };
        if !matches!(severity, "error" | "warning" | "message") {
            continue;
        }
        let Some((code, message)) = rest.split_once(": ") else { continue };
        let (file, line_number, column) = match location.and_then(|l| l.rsplit_once('(')) {
            Some((file, at)) => {
                let mut numbers = at.trim_end_matches(')').split(',').map(|n| n.parse().unwrap_or(1));
                (Some(file.to_string()), numbers.next().unwrap_or(1), numbers.next().unwrap_or(1))
            }
            None => (None, 0, 0),
        };
        reported.push(Reported {
            file,
            line: line_number,
            column,
            severity: severity.to_string(),
            code: code.to_string(),
            message: message.to_string(),
            raw: line.to_string(),
        });
    }
    reported
}

/// The `.bloom` offset that wrote 0-based (line, UTF-16 column) of the emitted
/// module: the nearest mapping at or before it (the emitter maps a chain once).
fn original_offset(map: &str, source: &str, line: u32, column: u32) -> Option<u32> {
    let map = oxc_sourcemap::SourceMap::from_json_string(map).ok()?;
    let tokens: Vec<_> = map.get_tokens().filter(|t| t.get_source_id().is_some()).collect();
    let at = tokens.partition_point(|t| (t.get_dst_line(), t.get_dst_col()) <= (line, column));
    let token = tokens.get(at.checked_sub(1)?)?;
    Some(text::offset(source, token.get_src_line(), token.get_src_col()))
}

/// A `tsc` diagnostic in emitted code, at the `.bloom` span that wrote it.
fn lift(problem: &Reported, module: &Emitted, cwd: &Path) -> Diagnostic {
    let at = module
        .map
        .as_deref()
        .and_then(|map| original_offset(map, &module.source, problem.line - 1, problem.column - 1))
        .unwrap_or(0);
    let (start, end) = text::word_at(&module.source, at);
    let span = if end > start { Span::new(start, end) } else { Span::new(at, at + 1) };
    let mut diagnostic = if problem.severity == "error" {
        Diagnostic::error(CODE, span, format!("{}: {}", problem.code, problem.message))
    } else {
        Diagnostic::warning(CODE, span, format!("{}: {}", problem.code, problem.message))
    };
    diagnostic = diagnostic
        .label(format!(
            "tsc, at {}:{}:{} of the emitted TypeScript",
            problem.file.as_deref().unwrap_or(""),
            problem.line,
            problem.column
        ))
        .spec("47-the-foreign-boundary");
    diagnostic.render(&module.source, &shown(&module.bloom, cwd));
    diagnostic
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn jsonc_loses_comments_and_trailing_commas_not_strings() {
        let text = "{ // a\n \"a\": \"//not\", /* b */ \"c\": [1, 2, ], \"d\": { \"e\": 1, // x\n }, }";
        assert_eq!(
            json::parse(&strip_jsonc(text)).unwrap(),
            json::parse(r#"{"a":"//not","c":[1,2],"d":{"e":1}}"#).unwrap()
        );
    }

    #[test]
    fn tsc_output_is_read_with_its_chains() {
        let output = "src/a.bloom.ts(3,7): error TS2322: Type 'number' is not assignable to type 'string'.\n  Types of property 'x' are incompatible.\nerror TS5023: Unknown compiler option 'x'.\n";
        let reported = parse_output(output);
        assert_eq!(reported.len(), 2);
        assert_eq!(reported[0].file.as_deref(), Some("src/a.bloom.ts"));
        assert_eq!((reported[0].line, reported[0].column), (3, 7));
        assert_eq!(reported[0].code, "TS2322");
        assert!(reported[0].message.ends_with("incompatible."));
        assert_eq!(reported[1].file, None);
        assert_eq!(reported[1].code, "TS5023");
    }

    #[test]
    fn paths_follow_extends_and_base_url() {
        let dir = std::env::temp_dir().join(format!("bloomc-tsc-paths-{}", std::process::id()));
        std::fs::create_dir_all(dir.join("app")).unwrap();
        std::fs::write(
            dir.join("base.json"),
            "{ \"compilerOptions\": { \"baseUrl\": \"./app\", \"paths\": { \"@/*\": [\"src/*\"], } } }",
        )
        .unwrap();
        std::fs::write(dir.join("app/tsconfig.json"), "{ \"extends\": \"../base\" }").unwrap();
        let paths = project_paths(&dir.join("app/tsconfig.json")).unwrap().unwrap();
        assert_eq!(paths.entries, vec![("@/*".to_string(), vec!["src/*".to_string()])]);
        assert_eq!(paths.dir, dir.join("app"));
        assert_eq!(paths.base_url, Some(dir.join("app")));
        std::fs::remove_dir_all(dir).unwrap();
    }
}
