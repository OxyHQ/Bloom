//! `bloomc`: check, format and build `.bloom` files, and serve them to an editor.
//!
//! ```text
//! bloomc check [--tsc] [--project <dir>] [--jobs N] <paths…>
//! bloomc fmt [--check] [--jobs N] <paths…>
//! bloomc build <dir> --out <dir> [--jobs N] [--no-cache] [--dev]
//! bloomc lsp
//! ```
//!
//! A path is a `.bloom` file or a directory searched for them (skipping
//! `node_modules` and hidden directories). Files run in parallel on
//! `--jobs` threads (the machine's parallelism by default); output and
//! diagnostics come out in path order, so a run is deterministic. `check
//! --tsc` also type-checks the emitted TypeScript with the project's `tsc`
//! (every `.bloom` file of the project when no path is given).

mod build;
mod complete;
mod files;
mod json;
mod lsp;
mod parallel;
mod text;
mod tsc;

use std::path::PathBuf;
use std::process::ExitCode;

const USAGE: &str = "usage:
  bloomc check [--tsc] [--project <dir>] [--jobs N] <paths…>
  bloomc fmt [--check] [--jobs N] <paths…>
  bloomc build <dir> --out <dir> [--jobs N] [--no-cache] [--dev]
  bloomc lsp";

/// The command line, read by hand (the workspace takes no new crates).
#[derive(Debug, Default)]
struct Args {
    command: String,
    paths: Vec<PathBuf>,
    out: Option<PathBuf>,
    project: Option<PathBuf>,
    jobs: Option<usize>,
    check: bool,
    no_cache: bool,
    dev: bool,
    tsc: bool,
}

fn parse_args(raw: impl IntoIterator<Item = String>) -> Result<Args, String> {
    let mut raw = raw.into_iter();
    let mut args = Args { command: raw.next().ok_or("no command")?, ..Args::default() };
    while let Some(arg) = raw.next() {
        match arg.as_str() {
            "--check" => args.check = true,
            "--no-cache" => args.no_cache = true,
            "--dev" => args.dev = true,
            "--tsc" => args.tsc = true,
            "--project" | "-p" => {
                args.project = Some(raw.next().ok_or("--project needs a directory")?.into());
            }
            "--out" => args.out = Some(raw.next().ok_or("--out needs a directory")?.into()),
            "--jobs" | "-j" => {
                let n = raw.next().ok_or("--jobs needs a number")?;
                args.jobs =
                    Some(n.parse().ok().filter(|&n| n > 0).ok_or(format!("--jobs {n}: not a count"))?);
            }
            flag if flag.starts_with('-') => return Err(format!("unknown flag {flag}")),
            path => args.paths.push(path.into()),
        }
    }
    Ok(args)
}

fn main() -> ExitCode {
    // WASI has no working directory of its own: js/bloomc.js passes it as PWD.
    #[cfg(target_os = "wasi")]
    if let Ok(dir) = std::env::var("PWD") {
        let _ = std::env::set_current_dir(dir);
    }
    let args = match parse_args(std::env::args().skip(1)) {
        Ok(args) => args,
        Err(message) => {
            eprintln!("bloomc: {message}\n{USAGE}");
            return ExitCode::from(2);
        }
    };
    let jobs = args.jobs.unwrap_or_else(|| std::thread::available_parallelism().map_or(1, |n| n.get()));
    let result = match args.command.as_str() {
        "check" if args.tsc => tsc::check(&args.paths, args.project.as_deref(), jobs),
        "check" => build::check(&args.paths, jobs),
        "fmt" => build::fmt(&args.paths, args.check, jobs),
        "build" => match (args.paths.as_slice(), &args.out) {
            ([dir], Some(out)) => {
                build::build(dir, out, &build::BuildOptions { jobs, cache: !args.no_cache, dev: args.dev })
            }
            _ => Err("build takes one source directory and --out <dir>".to_string()),
        },
        "lsp" => lsp::serve(std::io::stdin().lock(), std::io::stdout().lock()),
        "help" | "--help" | "-h" => {
            println!("{USAGE}");
            Ok(true)
        }
        other => Err(format!("unknown command {other}")),
    };
    match result {
        Ok(true) => ExitCode::SUCCESS,
        Ok(false) => ExitCode::FAILURE,
        Err(message) => {
            eprintln!("bloomc: {message}");
            ExitCode::from(2)
        }
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
        let c = args("check --tsc -p app").unwrap();
        assert!(c.tsc);
        assert_eq!(c.project, Some(PathBuf::from("app")));
    }

    #[test]
    fn rejects_unknown_flags_and_bad_counts() {
        assert!(args("fmt --write x").is_err());
        assert!(args("check -j 0 x").is_err());
        assert!(args("").is_err());
    }
}
