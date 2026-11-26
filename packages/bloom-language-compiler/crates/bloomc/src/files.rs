//! Finding `.bloom` files.

use std::path::{Path, PathBuf};

/// Every `.bloom` file under `paths` (a file is taken as given), sorted, once each.
pub fn bloom_files(paths: &[PathBuf]) -> Result<Vec<PathBuf>, String> {
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

fn walk(dir: &Path, out: &mut Vec<PathBuf>) -> std::io::Result<()> {
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let name = entry.file_name();
        let name = name.to_string_lossy();
        let kind = entry.file_type()?;
        if kind.is_dir() {
            if !name.starts_with('.') && name != "node_modules" {
                walk(&entry.path(), out)?;
            }
        } else if name.ends_with(".bloom") {
            out.push(entry.path());
        }
    }
    Ok(())
}

/// `path` relative to `base` when it is under it (`a/b/c` from `a` is `b/c`),
/// else `path` itself.
pub fn relative(path: &Path, base: &Path) -> PathBuf {
    path.strip_prefix(base).map(Path::to_path_buf).unwrap_or_else(|_| path.to_path_buf())
}

/// The relative path from directory `from` to `to` (both absolute or both
/// relative to the same directory), with `/` separators.
pub fn relative_url(from: &Path, to: &Path) -> String {
    let from: Vec<_> = from.components().collect();
    let to: Vec<_> = to.components().collect();
    let common = from.iter().zip(&to).take_while(|(a, b)| a == b).count();
    let mut parts: Vec<String> = std::iter::repeat_n("..".to_string(), from.len() - common).collect();
    parts.extend(to[common..].iter().map(|c| c.as_os_str().to_string_lossy().into_owned()));
    parts.join("/")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn relative_urls_climb_then_descend() {
        assert_eq!(
            relative_url(Path::new("/o/lib/rows"), Path::new("/o/src/rows/Row.bloom")),
            "../../src/rows/Row.bloom"
        );
        assert_eq!(relative_url(Path::new("/o"), Path::new("/o/a.bloom")), "a.bloom");
    }
}
