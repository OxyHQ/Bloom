//! `bloomc build`'s cache follows what each compile read: editing a TS file a
//! `.bloom` module imports rebuilds that module and the modules importing it,
//! and nothing else.

use std::path::Path;
use std::process::Command;

fn copy(from: &Path, to: &Path) {
    std::fs::create_dir_all(to).unwrap();
    for entry in std::fs::read_dir(from).unwrap() {
        let entry = entry.unwrap();
        let name = entry.file_name();
        if name == "node_modules" {
            continue;
        }
        if entry.file_type().unwrap().is_dir() {
            copy(&entry.path(), &to.join(name));
        } else {
            std::fs::copy(entry.path(), to.join(name)).unwrap();
        }
    }
}

fn build(project: &Path) -> String {
    let run = Command::new(env!("CARGO_BIN_EXE_bloomc"))
        .args(["build", "src", "--out", "out"])
        .current_dir(project)
        .output()
        .expect("bloomc runs");
    let stderr = String::from_utf8_lossy(&run.stderr).into_owned();
    assert!(run.status.success(), "{stderr}");
    stderr.lines().last().unwrap_or_default().split(" (").next().unwrap_or_default().to_string()
}

#[test]
fn a_changed_ts_import_rebuilds_its_importers() {
    let project = std::env::temp_dir().join(format!("bloomc-build-cache-{}", std::process::id()));
    copy(&Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/tsc-project"), &project);
    assert_eq!(build(&project), "bloomc: built 5 of 5 files");
    assert_eq!(build(&project), "bloomc: built 0 of 5 files");
    // row.bloom and stamp.bloom import when.ts; list.bloom and pair.bloom import row.bloom.
    let when = project.join("src/when.ts");
    let edited = std::fs::read_to_string(&when).unwrap() + "\nexport const later = 1;\n";
    std::fs::write(&when, edited).unwrap();
    assert_eq!(build(&project), "bloomc: built 4 of 5 files");
    assert_eq!(build(&project), "bloomc: built 0 of 5 files");
    std::fs::remove_dir_all(project).unwrap();
}
