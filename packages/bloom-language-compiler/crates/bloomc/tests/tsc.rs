//! `bloomc check --tsc` on `tests/tsc-project`: the project's `tsc` checks the
//! emitted TypeScript, and the one planted boundary error (a `String` passed
//! where the TS function takes a `Date`, which Bloom sees as `Foreign`) is
//! reported at the `.bloom` span that wrote it. The other modules import each
//! other by `.bloom` and extensionless paths, a TS module imports them through
//! `paths` and a relative path, and none of that is an error.
//!
//! Needs Node and the repository's `node_modules` (TypeScript, React's types):
//! skipped without them.

use std::path::Path;
use std::process::Command;

#[test]
fn tsc_errors_in_emitted_code_land_on_the_bloom_span() {
    let project = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/tsc-project");
    if !project.ancestors().any(|dir| dir.join("node_modules/typescript/bin/tsc").is_file()) {
        eprintln!("skipped: no node_modules/typescript above {}", project.display());
        return;
    }
    let run = Command::new(env!("CARGO_BIN_EXE_bloomc"))
        .args(["check", "--tsc"])
        .current_dir(&project)
        .output()
        .expect("bloomc runs");
    let stderr = String::from_utf8_lossy(&run.stderr);
    assert_eq!(run.status.code(), Some(1), "{stderr}");
    assert_eq!(stderr.matches("error[").count(), 1, "{stderr}");
    assert!(
        stderr.contains(
            "error[B0620]: TS2345: Argument of type 'string' is not assignable to parameter of type 'RegExp'."
        ),
        "{stderr}"
    );
    let at = "src/screens/stamp.bloom:4:33";
    assert!(stderr.contains(&format!("--> {at}")), "{stderr}");
    assert!(
        stderr
            .contains("4 |   let line: String = formatWhen(at)\n  |                                 ^^ tsc"),
        "{stderr}"
    );
    // The fixtures' 0.x forms warn (B0950); one error is tsc's.
    assert!(stderr.contains("checked 5 files with tsc (1 error, "), "{stderr}");

    // `--project` from elsewhere, and one file: the same error.
    let run = Command::new(env!("CARGO_BIN_EXE_bloomc"))
        .args(["check", "--tsc", "--project"])
        .arg(&project)
        .arg(project.join("src/screens/stamp.bloom"))
        .current_dir(project.parent().unwrap())
        .output()
        .expect("bloomc runs");
    let stderr = String::from_utf8_lossy(&run.stderr);
    assert_eq!(run.status.code(), Some(1), "{stderr}");
    assert!(stderr.contains("--> tsc-project/src/screens/stamp.bloom:4:33"), "{stderr}");
    assert!(stderr.contains("checked 1 file with tsc (1 error, "), "{stderr}");
}
