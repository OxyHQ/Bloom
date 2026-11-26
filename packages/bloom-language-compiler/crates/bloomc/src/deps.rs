//! Dependencies: `bloom add`, the npm packages underneath, and `Package.resolved`.
//!
//! A Bloom package's dependencies are Bloom packages (`.package(…)`) and the
//! npm packages of its binding modules (`.bindings(…, npm:)`). Underneath,
//! each is an npm package, fetched by bun into a content-addressed store
//! (`$BLOOM_STORE`, by default `~/.local/share/bloom/store`) under the 7-day
//! supply-chain quarantine, and installed into `.bloom/build/`. What resolved is
//! locked in `Package.resolved` beside the manifest: every npm package, its
//! version and its integrity hash. Regenerating `.bloom/build/` pins every one
//! of them again (bun's `overrides`), so a fresh checkout builds what was locked.

use std::collections::BTreeMap;
use std::path::PathBuf;
use std::process::Command;

use bloom_lang::package::{self, KNOWN_PACKAGES, Requirement, Version, known_package};

use crate::expo::{RUNTIME, STDLIB_NATIVE, TOOLS};
use crate::project::{Package, write};

/// The content-addressed store bun fetches tarballs into.
pub fn store() -> PathBuf {
    if let Ok(store) = std::env::var("BLOOM_STORE") {
        return PathBuf::from(store);
    }
    let home = std::env::var("XDG_DATA_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(std::env::var("HOME").unwrap_or_default()).join(".local/share"));
    home.join("bloom/store")
}

/// One locked npm package.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct Locked {
    pub name: String,
    pub version: String,
    pub integrity: String,
}

/// `Package.resolved`.
#[derive(Debug, Default, Clone, PartialEq)]
pub struct Resolved {
    /// The Bloom packages: name → (npm package, version).
    pub bloom: BTreeMap<String, (String, String)>,
    /// Every npm package underneath.
    pub npm: Vec<Locked>,
}

const RESOLVED_HEADER: &str =
    "// Package.resolved: written by bloom (`bloom add`, `bloom build`). Do not edit.";

impl Resolved {
    pub fn read(package: &Package) -> Option<Resolved> {
        let text = std::fs::read_to_string(package.root.join(package::RESOLVED)).ok()?;
        let body: String =
            text.lines().filter(|l| !l.trim_start().starts_with("//")).collect::<Vec<_>>().join("\n");
        let value = crate::json::parse(&body).ok()?;
        let mut out = Resolved::default();
        for entry in value.get("packages").as_array() {
            let (Some(name), Some(npm), Some(version)) =
                (entry.get("name").as_str(), entry.get("npm").as_str(), entry.get("version").as_str())
            else {
                continue;
            };
            out.bloom.insert(name.into(), (npm.into(), version.into()));
        }
        for entry in value.get("npm").as_array() {
            let Some(line) = entry.as_str() else { continue };
            let mut parts = line.split(' ');
            let (Some(spec), Some(integrity)) = (parts.next(), parts.next()) else { continue };
            let (name, version) = package::split_npm_spec(spec);
            out.npm.push(Locked {
                name: name.into(),
                version: version.unwrap_or_default().into(),
                integrity: integrity.into(),
            });
        }
        Some(out)
    }

    /// The file's text: one entry per line, so a change reads as a diff.
    pub fn render(&self) -> String {
        let quote = |s: &str| crate::json::write(&crate::json::Value::String(s.to_string()));
        let mut out = format!("{RESOLVED_HEADER}\n{{\n  \"version\": 1,\n  \"packages\": [");
        let bloom: Vec<String> = self
            .bloom
            .iter()
            .map(|(name, (npm, version))| {
                format!(
                    "\n    {{ \"name\": {}, \"npm\": {}, \"version\": {} }}",
                    quote(name),
                    quote(npm),
                    quote(version)
                )
            })
            .collect();
        out.push_str(&bloom.join(","));
        out.push_str(if bloom.is_empty() { "],\n  \"npm\": [" } else { "\n  ],\n  \"npm\": [" });
        let npm: Vec<String> = self
            .npm
            .iter()
            .map(|l| format!("\n    {}", quote(&format!("{}@{} {}", l.name, l.version, l.integrity))))
            .collect();
        out.push_str(&npm.join(","));
        out.push_str(if npm.is_empty() { "]\n}\n" } else { "\n  ]\n}\n" });
        out
    }
}

/// Every package of a `bun.lock`, with its integrity: each package is one line
/// there, `"key": ["name@version", "", { … }, "sha512-…"]`.
pub fn read_bun_lock(text: &str) -> Vec<Locked> {
    let mut out = Vec::new();
    let mut in_packages = false;
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("\"packages\"") {
            in_packages = true;
            continue;
        }
        if !in_packages {
            continue;
        }
        let Some(array) = trimmed.split_once(": [\"").map(|(_, rest)| rest) else { continue };
        let Some(spec) = array.split('"').next() else { continue };
        let integrity = trimmed.rsplit('"').nth(1).filter(|s| s.starts_with("sha"));
        let (name, version) = package::split_npm_spec(spec);
        let (Some(version), Some(integrity)) = (version, integrity) else { continue };
        // Workspace and linked packages have no registry tarball to lock.
        if version.starts_with("file:") || version.starts_with("link:") || version.starts_with("workspace:") {
            continue;
        }
        out.push(Locked { name: name.into(), version: version.into(), integrity: integrity.into() });
    }
    out.sort();
    out.dedup();
    out
}

/// `BLOOM_LINK=name=path,…`: first-party packages from a checkout (developing Bloom itself).
fn links() -> BTreeMap<String, String> {
    std::env::var("BLOOM_LINK")
        .unwrap_or_default()
        .split(',')
        .filter_map(|pair| pair.split_once('='))
        .map(|(name, path)| {
            let path = std::path::absolute(path).unwrap_or_else(|_| PathBuf::from(path));
            (name.to_string(), format!("file:{}", path.display()))
        })
        .collect()
}

/// The generated app's `package.json`.
pub fn package_json(package: &Package) -> Result<String, String> {
    let mut deps: BTreeMap<String, String> =
        RUNTIME.iter().chain(STDLIB_NATIVE).map(|(n, v)| (n.to_string(), v.to_string())).collect();
    let resolved = Resolved::read(package).unwrap_or_default();
    for dep in &package.manifest.dependencies {
        let Some(npm) = dep.npm_name() else { continue };
        let version = match &dep.requirement {
            Requirement::From(v) => format!("^{v}"),
            Requirement::Exact(v) => v.to_string(),
            Requirement::Path(p) => format!("file:{}", package.root.join(p).display()),
        };
        // A locked version within the requirement is the one installed.
        let version = match resolved.bloom.get(&dep.name) {
            Some((_, locked)) if Version::parse(locked).is_some_and(|l| dep.requirement.allows(&l)) => {
                locked.clone()
            }
            _ => version,
        };
        deps.insert(npm, version);
        if let Some(known) = known_package(&dep.name) {
            for runtime in known.runtime {
                deps.entry(runtime.to_string()).or_insert_with(|| "*".into());
            }
        }
    }
    for target in &package.manifest.targets {
        if let Some((npm, Some(version))) = target.npm() {
            deps.insert(npm.to_string(), version.to_string());
        }
    }
    deps.extend(links());
    let dev: BTreeMap<String, String> = TOOLS.iter().map(|(n, v)| (n.to_string(), v.to_string())).collect();
    // Everything locked is pinned again, transitive packages too.
    let overrides: BTreeMap<String, String> = if package.build_dir().join("bun.lock").is_file() {
        BTreeMap::new()
    } else {
        resolved
            .npm
            .iter()
            .filter(|l| !deps.contains_key(&l.name))
            .map(|l| (l.name.clone(), l.version.clone()))
            .collect()
    };
    let block = |map: &BTreeMap<String, String>| {
        let lines: Vec<String> = map
            .iter()
            .map(|(k, v)| {
                format!(
                    "    {}: {}",
                    crate::json::write(&crate::json::Value::String(k.clone())),
                    crate::json::write(&crate::json::Value::String(v.clone()))
                )
            })
            .collect();
        format!("{{\n{}\n  }}", lines.join(",\n"))
    };
    let name: String = package
        .manifest
        .name
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c.to_ascii_lowercase() } else { '-' })
        .collect();
    let mut out = format!(
        "{{\n  \"name\": \"{name}\",\n  \"private\": true,\n  \"version\": \"1.0.0\",\n  \"main\": \"index.js\",\n  \"dependencies\": {},\n  \"devDependencies\": {}",
        block(&deps),
        block(&dev)
    );
    if !overrides.is_empty() {
        out.push_str(&format!(",\n  \"overrides\": {}", block(&overrides)));
    }
    out.push_str("\n}\n");
    Ok(out)
}

/// Installs `.bloom/build/` when its `package.json` changed, then locks what resolved.
pub fn install(package: &Package) -> Result<(), String> {
    let build = package.build_dir();
    let manifest = std::fs::read_to_string(build.join("package.json")).unwrap_or_default();
    let key = format!("{:032x}", crate::build::hash(&[manifest.as_bytes()]));
    let stamp = build.join(".installed");
    if build.join("node_modules").is_dir()
        && std::fs::read_to_string(&stamp).ok().as_deref() == Some(key.as_str())
    {
        return Ok(());
    }
    crate::expo::run_in(&build, "bun", &["install"])?;
    lock(package)?;
    write(&stamp, &key)
}

/// Writes `Package.resolved` from what bun installed.
pub fn lock(package: &Package) -> Result<(), String> {
    let text = std::fs::read_to_string(package.build_dir().join("bun.lock")).unwrap_or_default();
    let npm = read_bun_lock(&text);
    let mut resolved = Resolved { npm, ..Resolved::default() };
    for dep in &package.manifest.dependencies {
        let Some(npm) = dep.npm_name() else { continue };
        if let Some(found) = resolved.npm.iter().find(|l| l.name == npm) {
            resolved.bloom.insert(dep.name.clone(), (npm.clone(), found.version.clone()));
        }
    }
    write(&package.root.join(package::RESOLVED), &resolved.render())
}

/// The newest version of `npm` allowed by `requirement` and published at
/// least 7 days ago (first-party packages exempt), from the registry via bun.
pub fn newest(npm: &str, requirement: Option<&Requirement>) -> Result<String, String> {
    let bun = std::env::var("BLOOM_BUN").unwrap_or_else(|_| "bun".into());
    let out = Command::new(&bun)
        .args(["info", npm, "time", "--json"])
        .env("BUN_INSTALL_CACHE_DIR", store())
        .output()
        .map_err(|e| format!("{bun}: {e}"))?;
    if !out.status.success() {
        return Err(format!("no npm package {npm}: {}", String::from_utf8_lossy(&out.stderr).trim()));
    }
    let times = crate::json::parse(&String::from_utf8_lossy(&out.stdout))
        .map_err(|e| format!("bun info {npm}: {e}"))?;
    let crate::json::Value::Object(times) = times else {
        return Err(format!("bun info {npm}: no publish times"));
    };
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |d| d.as_secs());
    let first_party = npm.starts_with("@oxy.so/");
    let mut best: Option<Version> = None;
    for (version, time) in &times {
        let Some(parsed) = Version::parse(version) else { continue };
        if parsed.pre.is_some() || requirement.is_some_and(|r| !r.allows(&parsed)) {
            continue;
        }
        let published = time.as_str().and_then(parse_iso_seconds).unwrap_or(u64::MAX);
        if !first_party && now.saturating_sub(published) < 7 * 24 * 3600 {
            continue;
        }
        if best.as_ref().is_none_or(|b| parsed > *b) {
            best = Some(parsed);
        }
    }
    best.map(|v| v.to_string())
        .ok_or_else(|| format!("no version of {npm} fits and is past the 7-day quarantine"))
}

/// `2026-11-19T10:00:00.000Z` as seconds since the epoch.
pub fn parse_iso_seconds(text: &str) -> Option<u64> {
    let (date, time) = text.split_once('T')?;
    let mut d = date.split('-').map(|p| p.parse::<i64>().ok());
    let (y, m, day) = (d.next()??, d.next()??, d.next()??);
    let mut t = time.trim_end_matches('Z').split(':');
    let (h, min) = (t.next()?.parse::<i64>().ok()?, t.next()?.parse::<i64>().ok()?);
    let s = t.next()?.split('.').next()?.parse::<i64>().ok()?;
    // Days from the civil date (Howard Hinnant's algorithm).
    let y = if m <= 2 { y - 1 } else { y };
    let era = y.div_euclid(400);
    let yoe = y - era * 400;
    let mp = (m + 9) % 12;
    let doy = (153 * mp + 2) / 5 + day - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    let days = era * 146_097 + doe - 719_468;
    u64::try_from(days * 86_400 + h * 3600 + min * 60 + s).ok()
}

/// `bloom add <package>`: a Bloom package, recorded in `Package.bloom` and `Package.resolved`.
pub fn add(package: &Package, name: &str, from: Option<&str>, npm: Option<&str>) -> Result<bool, String> {
    if name.contains('/')
        || name.starts_with('@')
        || name.chars().next().is_some_and(|c| c.is_ascii_lowercase())
    {
        return Err(format!(
            "`{name}` is an npm package: generate a binding module for it with `bloom bind {name}` (`bloom add` adds Bloom packages, such as {})",
            KNOWN_PACKAGES.iter().map(|k| k.name).collect::<Vec<_>>().join(", ")
        ));
    }
    if package.manifest.dependencies.iter().any(|d| d.name == name) {
        println!("bloom: {name} is already a dependency");
        return Ok(true);
    }
    let npm_name = match (npm, known_package(name)) {
        (Some(npm), _) => npm.to_string(),
        (None, Some(known)) => known.npm.to_string(),
        (None, None) => {
            return Err(format!(
                "no Bloom package `{name}` is known: name the npm package that carries it with --npm @scope/name"
            ));
        }
    };
    let requirement = match from {
        Some(v) => Some(Requirement::From(Version::parse(v).ok_or(format!("--from {v}: not a version"))?)),
        None => None,
    };
    let version = newest(&npm_name, requirement.as_ref())?;
    let npm_part = if npm.is_some() { format!(", npm: \"{npm_name}\"") } else { String::new() };
    let entry = format!(".package(\"{name}\"{npm_part}, from: \"{version}\")");
    let updated = package::with_dependency(&package.source, &package.manifest, &entry);
    package::parse(&updated, package::MANIFEST)
        .map_err(|e| format!("the edited manifest does not evaluate: {:?}", e.first().map(|d| &d.message)))?;
    write(&package.root.join(package::MANIFEST), &updated)?;
    let mut resolved = Resolved::read(package).unwrap_or_default();
    resolved.bloom.insert(name.to_string(), (npm_name.clone(), version.clone()));
    write(&package.root.join(package::RESOLVED), &resolved.render())?;
    println!("bloom: added {name} {version} (`import {name}` in a module)");
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_a_bun_lock() {
        let lock = r#"{
  "lockfileVersion": 1,
  "workspaces": { "": { "name": "demo", "dependencies": { "left-pad": "^1.3.0" } } },
  "packages": {
    "@sentry/react-native": ["@sentry/react-native@6.2.0", "", { "dependencies": {} }, "sha512-AAA=="],
    "left-pad": ["left-pad@1.3.0", "", {}, "sha512-BBB=="],
    "local": ["local@file:../x", {}],
  }
}"#;
        let locked = read_bun_lock(lock);
        assert_eq!(locked.len(), 2);
        assert_eq!(
            locked[0],
            Locked {
                name: "@sentry/react-native".into(),
                version: "6.2.0".into(),
                integrity: "sha512-AAA==".into()
            }
        );
    }

    #[test]
    fn a_resolved_file_round_trips() {
        let mut resolved = Resolved::default();
        resolved.bloom.insert("BloomData".into(), ("@oxy.so/bloom-data".into(), "0.1.2".into()));
        resolved.npm.push(Locked {
            name: "left-pad".into(),
            version: "1.3.0".into(),
            integrity: "sha512-BBB==".into(),
        });
        let text = resolved.render();
        assert!(text.contains("\n    \"left-pad@1.3.0 sha512-BBB==\"\n"), "{text}");
        let dir = std::env::temp_dir().join(format!("bloom-resolved-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join(package::RESOLVED), &text).unwrap();
        let source = "let package = Package(name: \"A\", targets: [.app(\"A\")])".to_string();
        let pkg = Package { root: dir, manifest: package::parse(&source, "x").unwrap(), source };
        assert_eq!(Resolved::read(&pkg), Some(resolved));
        assert_eq!(Resolved::default().render().lines().count(), 6);
    }

    #[test]
    fn iso_times() {
        assert_eq!(parse_iso_seconds("1970-01-02T00:00:00.000Z"), Some(86_400));
        assert_eq!(parse_iso_seconds("2026-11-26T12:30:15Z"), Some(1_795_696_215));
    }
}
