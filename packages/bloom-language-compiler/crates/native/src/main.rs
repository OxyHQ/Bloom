//! `bloom-native emit --target kotlin-compose|swiftui <package> --out <dir>`: the
//! experimental native backends (ADR 0003). `--android-project <dir>` also writes a Gradle
//! project around the emitted sources and the Kotlin runtime.

use std::path::PathBuf;
use std::process::ExitCode;

fn usage() -> ExitCode {
    eprintln!(
        "usage: bloom-native emit --target kotlin-compose|swiftui <package dir> --out <dir> [--android-project <dir> --app-id <id>]"
    );
    ExitCode::from(2)
}

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.first().map(String::as_str) != Some("emit") {
        return usage();
    }
    let mut target = None;
    let mut package = None;
    let mut out = None;
    let mut project = None;
    let mut app_id = None;
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--target" => {
                i += 1;
                target = args.get(i).and_then(|t| bloom_native::Target::parse(t));
            }
            "--out" => {
                i += 1;
                out = args.get(i).map(PathBuf::from);
            }
            "--android-project" => {
                i += 1;
                project = args.get(i).map(PathBuf::from);
            }
            "--app-id" => {
                i += 1;
                app_id = args.get(i).cloned();
            }
            other => package = Some(PathBuf::from(other)),
        }
        i += 1;
    }
    let (Some(target), Some(package)) = (target, package) else { return usage() };
    let started = std::time::Instant::now();
    let program = match bloom_native::load(&package) {
        Ok(p) => p,
        Err(problems) => {
            for p in problems {
                eprintln!("{}", p.message);
            }
            return ExitCode::FAILURE;
        }
    };
    let emitted = match bloom_native::emit(&program, target) {
        Ok(e) => e,
        Err(problems) => {
            let sources: std::collections::HashMap<_, _> = program
                .modules
                .iter()
                .flat_map(|m| m.files.iter().map(|f| (f.path.clone(), f.source.clone())))
                .collect();
            for p in &problems {
                eprintln!("{}", p.render(sources.get(&p.file).map(String::as_str)));
            }
            eprintln!("bloom-native: {} construct(s) not covered", problems.len());
            return ExitCode::FAILURE;
        }
    };
    let root = match (&project, &out) {
        (Some(project), _) => project.join("app/src/main/kotlin"),
        (None, Some(out)) => out.clone(),
        (None, None) => return usage(),
    };
    if let Some(project) = &project {
        let id = app_id.unwrap_or_else(|| format!("so.bloom.{}.compose", program.name.to_lowercase()));
        if let Err(e) = bloom_native::android::write_project(project, &program, &id) {
            eprintln!("bloom-native: {e}");
            return ExitCode::FAILURE;
        }
    }
    for file in &emitted {
        let path = root.join(&file.path);
        if let Some(dir) = path.parent() {
            let _ = std::fs::create_dir_all(dir);
        }
        if let Err(e) = std::fs::write(&path, &file.text) {
            eprintln!("bloom-native: {}: {e}", path.display());
            return ExitCode::FAILURE;
        }
    }
    eprintln!(
        "bloom-native: emitted {} file(s) for {} in {} ms",
        emitted.len(),
        program.name,
        started.elapsed().as_millis()
    );
    ExitCode::SUCCESS
}
