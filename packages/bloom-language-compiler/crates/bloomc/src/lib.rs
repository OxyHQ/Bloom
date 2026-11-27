//! `bloom` (and its migration alias `bloomc`): Bloom's command line (ADR 0002, section 2).
//!
//! ```text
//! bloom new <name> [--template app|module]
//! bloom init --adopt
//! bloom check [--tsc] [--project <dir>] [--allow-ts-imports] [--jobs N] [paths…]
//! bloom fmt [--check] [--jobs N] [paths…]
//! bloom build web|android|ios [--release] [--with-expo] [--generate]
//! bloom run web|android|ios [--release] [--device <serial>] [--with-expo]
//! bloom test [filter]
//! bloom add <package> [--from <version>] [--npm <npm-package>]
//! bloom bind <npm-package>[@version] [--name <Name>]
//! bloom migrate --from 0.x [--check] [--jobs N] <paths…>
//! bloom lsp
//! bloomc build <dir> --out <dir> [--jobs N] [--no-cache] [--dev]
//! ```
//!
//! Inside a package (a directory with `Package.bloom`, or below one), `check`,
//! `fmt` and `test` take the package's targets when no path is given, and every
//! file resolves its imports through the package's modules. A path is a `.bloom`
//! file or a directory searched for them (skipping `node_modules` and hidden
//! directories). Files run in parallel on `--jobs` threads (the machine's
//! parallelism by default); output and diagnostics come out in path order, so a
//! run is deterministic.

mod adopt;
mod android;
mod bind;
mod build;
mod complete;
mod deps;
mod expo;
mod files;
mod json;
mod lsp;
mod navigation;
mod parallel;
mod project;
mod scaffold;
mod testing;
mod text;
mod tsc;

use std::path::PathBuf;
use std::process::ExitCode;

const USAGE: &str = "usage:
  bloom new <name> [--template app|module]
  bloom init --adopt
  bloom check [--tsc] [--project <dir>] [--allow-ts-imports] [--jobs N] [paths…]
  bloom fmt [--check] [--jobs N] [paths…]
  bloom build web|android|ios [--release] [--with-expo] [--generate]
  bloom run web|android|ios [--release] [--device <serial>] [--with-expo]
  bloom test [filter]
  bloom add <package> [--from <version>] [--npm <npm-package>]
  bloom bind <npm-package>[@version] [--name <Name>]
  bloom migrate --from 0.x [--check] [--jobs N] <paths…>
  bloom lsp
  bloomc build <dir> --out <dir> [--jobs N] [--no-cache] [--dev]";

/// The command line, read by hand (the workspace takes no new crates).
#[derive(Debug, Default)]
struct Args {
    command: String,
    paths: Vec<PathBuf>,
    out: Option<PathBuf>,
    jobs: Option<usize>,
    check: bool,
    no_cache: bool,
    dev: bool,
    release: bool,
    /// `build`/`run android --with-expo`: Expo's prebuild and modules underneath (the
    /// fallback while phase F replaces them, ADR 0002 section 7).
    with_expo: bool,
    /// `build android --generate`: write the Gradle project (for Android Studio) and stop.
    generate: bool,
    tsc: bool,
    /// `init --adopt`: an existing Expo app becomes a Bloom package.
    adopt: bool,
    /// `check --tsc --project <dir>` outside a package: the tsconfig project to check against.
    project: Option<PathBuf>,
    allow_ts_imports: bool,
    template: Option<String>,
    device: Option<String>,
    from: Option<String>,
    npm: Option<String>,
    name: Option<String>,
}

fn parse_args(raw: impl IntoIterator<Item = String>) -> Result<Args, String> {
    let mut raw = raw.into_iter();
    let mut args = Args { command: raw.next().ok_or("no command")?, ..Args::default() };
    let value = |raw: &mut dyn Iterator<Item = String>, flag: &str, what: &str| {
        raw.next().ok_or(format!("{flag} needs {what}"))
    };
    while let Some(arg) = raw.next() {
        match arg.as_str() {
            "--check" => args.check = true,
            "--no-cache" => args.no_cache = true,
            "--dev" => args.dev = true,
            "--release" => args.release = true,
            "--with-expo" => args.with_expo = true,
            "--generate" => args.generate = true,
            "--tsc" => args.tsc = true,
            "--adopt" => args.adopt = true,
            "--project" | "-p" => args.project = Some(value(&mut raw, "--project", "a directory")?.into()),
            "--allow-ts-imports" => args.allow_ts_imports = true,
            "--out" => args.out = Some(value(&mut raw, "--out", "a directory")?.into()),
            "--template" => args.template = Some(value(&mut raw, "--template", "app or module")?),
            "--device" => args.device = Some(value(&mut raw, "--device", "a device serial")?),
            "--from" => args.from = Some(value(&mut raw, "--from", "a version")?),
            "--npm" => args.npm = Some(value(&mut raw, "--npm", "an npm package")?),
            "--name" => args.name = Some(value(&mut raw, "--name", "a module name")?),
            "--jobs" | "-j" => {
                let n = value(&mut raw, "--jobs", "a number")?;
                args.jobs =
                    Some(n.parse().ok().filter(|&n| n > 0).ok_or(format!("--jobs {n}: not a count"))?);
            }
            flag if flag.starts_with('-') => return Err(format!("unknown flag {flag}")),
            path => args.paths.push(path.into()),
        }
    }
    Ok(args)
}

/// The program's name as invoked: `bloom` or `bloomc`.
fn program() -> String {
    std::env::args()
        .next()
        .and_then(|a| PathBuf::from(a).file_stem().map(|s| s.to_string_lossy().into_owned()))
        .filter(|s| s == "bloomc")
        .unwrap_or_else(|| "bloom".into())
}

/// The one positional argument of a command.
fn one(args: &Args, what: &str) -> Result<String, String> {
    match args.paths.as_slice() {
        [one] => Ok(one.to_string_lossy().into_owned()),
        _ => Err(format!("{} takes {what}", args.command)),
    }
}

pub fn main() -> ExitCode {
    // WASI has no working directory of its own: js/bloomc.js passes it as PWD.
    #[cfg(target_os = "wasi")]
    if let Ok(dir) = std::env::var("PWD") {
        let _ = std::env::set_current_dir(dir);
    }
    let name = program();
    let args = match parse_args(std::env::args().skip(1)) {
        Ok(args) => args,
        Err(message) => {
            eprintln!("{name}: {message}\n{USAGE}");
            return ExitCode::from(2);
        }
    };
    let jobs =
        args.jobs.unwrap_or_else(|| std::thread::available_parallelism().map_or(1, |n| n.get()).min(6));
    let result = run(&args, jobs);
    match result {
        Ok(true) => ExitCode::SUCCESS,
        Ok(false) => ExitCode::FAILURE,
        Err(message) => {
            eprintln!("{name}: {message}");
            ExitCode::from(2)
        }
    }
}

fn run(args: &Args, jobs: usize) -> Result<bool, String> {
    let check_options =
        project::CheckOptions { jobs, tsc: args.tsc, allow_ts_imports: args.allow_ts_imports };
    match args.command.as_str() {
        "init" if args.adopt => adopt::adopt(&std::env::current_dir().map_err(|e| e.to_string())?),
        "init" => {
            Err("init takes --adopt (an existing Expo app); a new package is `bloom new <Name>`".into())
        }
        "new" => scaffold::new(&one(args, "a package name")?, args.template.as_deref().unwrap_or("app")),
        "check" => match project::find(&args.paths)? {
            Some(package) if args.paths.is_empty() => project::check(&package, &check_options),
            // Outside a package: the emitted TS of the files, checked by the project's tsc.
            _ if args.tsc => tsc::check(&args.paths, args.project.as_deref(), jobs),
            _ => build::check(&args.paths, jobs, args.allow_ts_imports),
        },
        "fmt" => match project::find(&args.paths)? {
            Some(package) if args.paths.is_empty() => build::fmt(&package.source_dirs(), args.check, jobs),
            _ if args.paths.is_empty() => Err("fmt takes paths outside a package".into()),
            _ => build::fmt(&args.paths, args.check, jobs),
        },
        "build" => match (args.paths.as_slice(), &args.out) {
            // `bloomc build <dir> --out <dir>`: the 0.x file build.
            ([dir], Some(out)) => {
                build::build(dir, out, &build::BuildOptions { jobs, cache: !args.no_cache, dev: args.dev })
            }
            ([platform], None) => {
                let package = project::require(&[])?;
                expo::build(&package, &platform.to_string_lossy(), &expo::Mode::new(args, &check_options))
            }
            _ => Err("build takes a platform (web, android or ios), or <dir> --out <dir>".to_string()),
        },
        "run" => {
            let platform = one(args, "a platform (web, android or ios)")?;
            let package = project::require(&[])?;
            expo::run(&package, &platform, &expo::Mode::new(args, &check_options))
        }
        "test" => {
            let package = project::require(&[])?;
            testing::run(
                &package,
                args.paths.first().map(|p| p.to_string_lossy().into_owned()),
                &check_options,
            )
        }
        "add" => {
            let package = project::require(&[])?;
            deps::add(&package, &one(args, "a package")?, args.from.as_deref(), args.npm.as_deref())
        }
        "bind" => {
            let package = project::require(&[])?;
            bind::bind(&package, &one(args, "an npm package")?, args.name.as_deref())
        }
        "migrate" => match args.from.as_deref() {
            Some("0.x") => build::migrate(&args.paths, args.check, jobs),
            Some(other) => Err(format!("migrate --from {other}: only 0.x is known")),
            None => Err("migrate needs --from 0.x".to_string()),
        },
        "lsp" => lsp::serve(std::io::stdin().lock(), std::io::stdout().lock()),
        "help" | "--help" | "-h" => {
            println!("{USAGE}");
            Ok(true)
        }
        other => Err(format!("unknown command {other}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(line: &str) -> Result<Args, String> {
        parse_args(line.split_whitespace().map(String::from))
    }

    #[test]
    fn reads_flags_and_paths_in_any_order() {
        let a = args("build src --out lib -j 3 --no-cache").unwrap();
        assert_eq!(a.command, "build");
        assert_eq!(a.paths, [PathBuf::from("src")]);
        assert_eq!(a.out, Some(PathBuf::from("lib")));
        assert_eq!(a.jobs, Some(3));
        assert!(a.no_cache);
        let a = args("run android --release --device emulator-5554").unwrap();
        assert_eq!(a.paths, [PathBuf::from("android")]);
        assert!(a.release);
        assert_eq!(a.device.as_deref(), Some("emulator-5554"));
        let a = args("new Demo --template module").unwrap();
        assert_eq!(a.template.as_deref(), Some("module"));
    }

    #[test]
    fn rejects_unknown_flags_and_bad_counts() {
        assert!(args("fmt --write x").is_err());
        assert!(args("check -j 0 x").is_err());
        assert!(args("new --template").is_err());
        assert!(args("").is_err());
    }
}
