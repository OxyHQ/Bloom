//! `bloom-native emit --target kotlin-compose|swiftui <package> --out <dir>`: the
//! experimental native backends (ADR 0003). `--android-project <dir>` also writes a Gradle
//! project around the emitted sources and the Kotlin runtime.

use std::path::PathBuf;
use std::process::ExitCode;

fn usage() -> ExitCode {
    eprintln!(
        "usage: bloom-native emit --target kotlin-compose|swiftui <package dir> --out <dir> [--module A,B] [--std JSON,Core] [--runtime] [--android-project <dir> | --ios-project <dir>] [--app-id <id>]"
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
    let mut std_modules: Vec<String> = Vec::new();
    let mut only: Option<Vec<String>> = None;
    let mut runtime = false;
    let mut ios_project: Option<PathBuf> = None;
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
            "--ios-project" => {
                i += 1;
                ios_project = args.get(i).map(PathBuf::from);
            }
            "--app-id" => {
                i += 1;
                app_id = args.get(i).cloned();
            }
            // `--std JSON,Core`: those standard library modules, compiled through the backend.
            "--std" => {
                i += 1;
                std_modules =
                    args.get(i).map(|s| s.split(',').map(String::from).collect()).unwrap_or_default();
            }
            // `--module FeedIsland,…`: only those modules and the package modules they import.
            "--module" => {
                i += 1;
                only = args.get(i).map(|s| s.split(',').map(String::from).collect());
            }
            // `--runtime`: Bloom's Kotlin runtime (`so.oxy.bloom.ui`, `so.oxy.bloom.std`) into `--out`
            // too, so the output is a complete source set (`bloom build`'s `:bloom-islands`).
            "--runtime" => runtime = true,
            other => package = Some(PathBuf::from(other)),
        }
        i += 1;
    }
    let (Some(target), Some(package)) = (target, package) else { return usage() };
    let started = std::time::Instant::now();
    let std: Vec<&str> = std_modules.iter().map(String::as_str).collect();
    let program = match bloom_native::load_modules(&package, &std, only.as_deref()) {
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
    // `--ios-project`: the Xcode project around the Swift (what `bloom build ios --target native` writes).
    if let Some(dir) = &ios_project {
        let id =
            app_id.clone().unwrap_or_else(|| format!("so.bloom.{}.swiftui", program.name.to_lowercase()));
        if let Err(e) = bloom_native::swift::project::write_project(dir, &program, &emitted, &id) {
            eprintln!("bloom-native: {e}");
            return ExitCode::FAILURE;
        }
        eprintln!(
            "bloom-native: wrote the iOS project for {} at {} ({} file(s), {} ms); on the Mac: xcodegen generate",
            program.name,
            dir.display(),
            emitted.len(),
            started.elapsed().as_millis()
        );
        return ExitCode::SUCCESS;
    }
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
    let mut emitted = emitted;
    if runtime {
        emitted.extend(bloom_native::android::runtime_sources());
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
