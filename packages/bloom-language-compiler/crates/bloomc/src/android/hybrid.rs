//! Hybrid mode: `bloom build android` for an adopted Expo app (`adopt: Expo(…)` in
//! `Package.bloom`, written by `bloom init --adopt`; ADR 0002, sections 2 and 7).
//!
//! An adopted app keeps its JS where it is, installed by its own package manager, and
//! bundled by Metro over its own Metro config. `bloom` generates and drives the native
//! project, as it does for a Bloom app, with three differences:
//!
//! - **Stopgaps.** The Expo packages listed in `stopgaps:` are linked through Expo Modules
//!   autolinking, limited to them and to the Expo modules they depend on. Every other Expo
//!   module is excluded, so a Bloom module replaces an Expo package by removing one line.
//!   Their JS resolves as it does in an Expo build; an Expo package that is neither linked
//!   nor answered by one of Bloom's shims fails the bundle, naming the line to add.
//! - **Overrides.** The app's own native config, which `bloom init --adopt` writes from the
//!   app config's evaluated plugins (`<overrides>/android/`), is a layer over the generated
//!   project: its `AndroidManifest.xml` merges over the app's (as a build-type manifest, so
//!   it wins), and its `res/`, `gradle.properties`, `proguard-rules.pro` and `app.gradle`
//!   are added.
//! - **The JS.** Metro runs over the app's `metro.config.js`, with the app's `tsconfig.json`
//!   path aliases (which Expo's CLI resolves) and the stopgap rule above layered on top.

use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};
use std::process::Command;

use bloom_lang::package::Adopt;

use crate::json::{self, Value};
use crate::project::{Package, write};

/// Where a build's JS and npm packages are.
#[derive(Debug, Clone)]
pub struct Layout {
    /// React Native's project root: Metro's, and the app module's `react { root }`.
    pub root: PathBuf,
    /// The bundle's entry file.
    pub entry: PathBuf,
    /// The `node_modules` directories packages resolve from, nearest first.
    pub modules: Vec<PathBuf>,
}

impl Layout {
    /// A Bloom app: everything in the generated build directory.
    pub fn bloom(build: &Path) -> Layout {
        Layout {
            root: build.to_path_buf(),
            entry: build.join("index.js"),
            modules: vec![build.join("node_modules")],
        }
    }

    /// An adopted app: its own root, and the `node_modules` its package manager installed
    /// (the app's own, then each directory above it, as a workspace hoists them).
    pub fn adopted(package: &Package, adopt: &Adopt) -> Result<Layout, String> {
        let modules = package
            .root
            .ancestors()
            .map(|d| d.join("node_modules"))
            .filter(|d| d.is_dir())
            .collect::<Vec<_>>();
        if modules.is_empty() {
            return Err(format!(
                "{}: no node_modules here or above: install the app's packages first",
                package.root.display()
            ));
        }
        let mut layout = Layout { root: package.root.clone(), entry: PathBuf::new(), modules };
        layout.entry = layout.entry_file(&package.root, &adopt.entry)?;
        Ok(layout)
    }

    /// The installed package `name`'s directory.
    pub fn resolve(&self, name: &str) -> Option<PathBuf> {
        self.modules.iter().map(|m| m.join(name)).find(|p| p.join("package.json").is_file())
    }

    pub fn require(&self, name: &str) -> Result<PathBuf, String> {
        self.resolve(name).ok_or_else(|| format!("`{name}` is not installed (looked in {})", self.searched()))
    }

    fn searched(&self) -> String {
        self.modules.iter().map(|m| m.display().to_string()).collect::<Vec<_>>().join(", ")
    }

    /// An entry as `package.json`'s `main` names it: a path (`./index.js`) or a package
    /// subpath (`expo-router/entry`).
    fn entry_file(&self, root: &Path, entry: &str) -> Result<PathBuf, String> {
        let candidates = |base: PathBuf| {
            let mut out = vec![base.clone()];
            for ext in ["js", "jsx", "ts", "tsx"] {
                out.push(base.with_extension(ext));
                out.push(base.join(format!("index.{ext}")));
            }
            out
        };
        let base = if entry.starts_with('.') || entry.starts_with('/') {
            root.join(entry)
        } else {
            let (name, sub) = split_specifier(entry);
            let dir = self.require(name)?;
            if sub.is_empty() {
                dir.join(main_of(&dir).unwrap_or_else(|| "index.js".into()))
            } else {
                dir.join(sub)
            }
        };
        candidates(base.clone())
            .into_iter()
            .find(|p| p.is_file())
            .map(|p| crate::files::normalize(&p))
            .ok_or_else(|| {
                format!("the entry `{entry}` (adopt: Expo(entry:)) is not a file: {}", base.display())
            })
    }
}

/// `@scope/name/sub/path` as (`@scope/name`, `sub/path`).
fn split_specifier(spec: &str) -> (&str, &str) {
    let parts = if spec.starts_with('@') { 2 } else { 1 };
    let mut end = 0;
    for (count, (i, _)) in spec.match_indices('/').enumerate() {
        if count + 1 == parts {
            end = i;
            break;
        }
    }
    if end == 0 { (spec, "") } else { (&spec[..end], &spec[end + 1..]) }
}

fn read_json(path: &Path) -> Value {
    std::fs::read_to_string(path).ok().and_then(|t| json::parse(&t).ok()).unwrap_or(Value::Null)
}

fn main_of(dir: &Path) -> Option<String> {
    read_json(&dir.join("package.json")).get("main").as_str().map(str::to_string)
}

fn names(value: &Value) -> Vec<String> {
    match value {
        Value::Object(fields) => fields.keys().cloned().collect(),
        _ => Vec::new(),
    }
}

fn strings(value: &Value) -> Vec<String> {
    value.as_array().iter().filter_map(|v| v.as_str().map(str::to_string)).collect()
}

/// A package Expo owns by its name.
pub fn is_expo_name(name: &str) -> bool {
    super::autolink::is_expo(name)
}

/// What a hybrid build links through Expo Modules autolinking, and which Expo JS it lets
/// through.
#[derive(Debug, Clone, PartialEq)]
pub struct ExpoLink {
    /// `expo-modules-autolinking`'s Gradle plugins (`expo-autolinking-settings`).
    pub gradle_plugin: PathBuf,
    /// The project Expo's autolinking searches from (the app's root).
    pub project_root: PathBuf,
    /// Every Expo module installed (name → directory), linked or not.
    pub modules: BTreeMap<String, PathBuf>,
    /// The Expo modules linked: the stopgaps, `expo`, and the Expo modules they depend on.
    pub linked: BTreeSet<String>,
    /// The Expo modules left out of the build.
    pub excluded: BTreeSet<String>,
    /// The Expo packages whose JS resolves: the linked ones, and the JS-only Expo packages
    /// the stopgaps list or depend on.
    pub allowed: BTreeSet<String>,
}

impl ExpoLink {
    /// Whether `name` is an Expo package (by name, or an Expo module under another name).
    pub fn is_expo(&self, name: &str) -> bool {
        is_expo_name(name) || self.modules.contains_key(name)
    }
}

/// The Expo modules installed for `root`, as Expo's autolinking finds them: name → directory.
fn search(layout: &Layout, root: &Path) -> Result<BTreeMap<String, PathBuf>, String> {
    let autolinking = layout.require("expo-modules-autolinking")?;
    let bin = autolinking.join("bin/expo-modules-autolinking.js");
    let output = Command::new("node")
        .arg(&bin)
        .args(["search", "--platform", "android", "--json"])
        .current_dir(root)
        .output()
        .map_err(|e| format!("node {}: {e}", bin.display()))?;
    if !output.status.success() {
        return Err(format!(
            "Expo's autolinking search failed:\n{}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }
    let found = json::parse(&String::from_utf8_lossy(&output.stdout))
        .map_err(|e| format!("Expo's autolinking search: {e}"))?;
    let Value::Object(fields) = found else { return Err("Expo's autolinking search: not an object".into()) };
    Ok(fields
        .into_iter()
        .map(|(name, entry)| {
            let path = entry.get("path").as_str().map(PathBuf::from).unwrap_or_default();
            (name, path)
        })
        .collect())
}

/// The Expo surface of a hybrid build: `None` when the package lists no stopgaps.
pub fn expo_link(package: &Package, layout: &Layout) -> Result<Option<ExpoLink>, String> {
    let stopgaps = &package.manifest.stopgaps;
    if stopgaps.is_empty() {
        return Ok(None);
    }
    let modules = search(layout, &package.root)?;
    // The stopgaps stand on `expo` (its core and package list): it must be installed.
    layout.require("expo")?;
    let autolinking = layout.require("expo-modules-autolinking")?;
    let dir_of =
        |name: &str| modules.get(name).cloned().filter(|p| p.is_dir()).or_else(|| layout.resolve(name));
    let mut allowed = BTreeSet::new();
    let mut queue: Vec<String> = vec!["expo".to_string()];
    for stopgap in stopgaps {
        if dir_of(&stopgap.name).is_none() {
            return Err(format!(
                "the stopgap `{}` is not installed: add it to package.json, or remove its `.expo(…)` line from Package.bloom",
                stopgap.name
            ));
        }
        queue.push(stopgap.name.clone());
    }
    while let Some(name) = queue.pop() {
        if !allowed.insert(name.clone()) {
            continue;
        }
        let Some(dir) = dir_of(&name) else { continue };
        let manifest = read_json(&dir.join("package.json"));
        for dep in names(manifest.get("dependencies")) {
            if (is_expo_name(&dep) || modules.contains_key(&dep))
                && !allowed.contains(&dep)
                && dir_of(&dep).is_some()
            {
                queue.push(dep);
            }
        }
    }
    // The app's own exclusions (`expo.autolinking.android.exclude`) stay excluded.
    let app = read_json(&package.root.join("package.json"));
    let app_excluded: BTreeSet<String> =
        strings(app.get("expo").get("autolinking").get("android").get("exclude")).into_iter().collect();
    let linked: BTreeSet<String> =
        modules.keys().filter(|m| allowed.contains(*m) && !app_excluded.contains(*m)).cloned().collect();
    let excluded: BTreeSet<String> = modules.keys().filter(|m| !linked.contains(*m)).cloned().collect();
    Ok(Some(ExpoLink {
        gradle_plugin: autolinking.join("android/expo-gradle-plugin"),
        project_root: package.root.clone(),
        modules,
        linked,
        excluded,
        allowed,
    }))
}

fn quote(s: &str) -> String {
    json::write(&Value::String(s.to_string()))
}

/// The lines `settings.gradle` adds for the stopgaps: Expo's autolinking settings plugin,
/// limited to the linked modules.
pub fn settings_plugin_management(link: &ExpoLink) -> String {
    format!("  includeBuild({})\n", quote(&link.gradle_plugin.to_string_lossy()))
}

pub fn settings_body(link: &ExpoLink) -> String {
    let excluded: Vec<String> = link.excluded.iter().map(|m| quote(m)).collect();
    format!(
        "\n// The stopgaps (Package.bloom `stopgaps:`): Expo modules linked through Expo's own\n// autolinking, limited to them and the Expo modules they depend on. Every other Expo module\n// found is excluded. Linked: {linked}.\nexpoAutolinking.projectRoot = file({root})\nexpoAutolinking.exclude = [{excluded}]\nexpoAutolinking.useExpoModules()\nexpoAutolinking.useExpoVersionCatalog()\n",
        linked = link.linked.iter().cloned().collect::<Vec<_>>().join(", "),
        root = quote(&link.project_root.to_string_lossy()),
        excluded = excluded.join(", "),
    )
}

// ---- the overrides ---------------------------------------------------------------

/// The app's own native config over the generated project: `<overrides>/android/`.
#[derive(Debug, Clone, Default)]
pub struct Overrides {
    pub manifest: Option<String>,
    pub res: Option<PathBuf>,
    pub gradle_properties: Option<String>,
    pub proguard: Option<String>,
    pub app_gradle: Option<PathBuf>,
}

impl Overrides {
    pub fn read(package: &Package) -> Overrides {
        let Some(adopt) = &package.manifest.adopt else { return Overrides::default() };
        let dir = package.root.join(&adopt.overrides).join("android");
        let text = |f: &str| std::fs::read_to_string(dir.join(f)).ok();
        Overrides {
            manifest: text("AndroidManifest.xml"),
            res: Some(dir.join("res")).filter(|d| d.is_dir()),
            gradle_properties: text("gradle.properties"),
            proguard: text("proguard-rules.pro"),
            app_gradle: Some(dir.join("app.gradle")).filter(|f| f.is_file()),
        }
    }

    /// The build-type manifest: the override, with `extra` application attributes (the debug
    /// build's cleartext traffic to Metro) merged into its `<application>`.
    pub fn build_type_manifest(&self, extra: &str) -> Option<String> {
        let manifest = self.manifest.as_ref()?;
        let mut text = manifest.clone();
        if !text.contains("xmlns:tools=") {
            text =
                text.replacen("<manifest ", "<manifest xmlns:tools=\"http://schemas.android.com/tools\" ", 1);
        }
        if extra.is_empty() {
            return Some(text);
        }
        Some(match text.find("<application") {
            Some(at) => {
                let insert = at + "<application".len();
                let mut out = text.clone();
                out.insert_str(insert, &format!(" {extra}"));
                // `<application/>` with no children stays self-closed.
                out
            }
            None => text.replacen("</manifest>", &format!("  <application {extra} />\n</manifest>"), 1),
        })
    }
}

// ---- the JS layer ----------------------------------------------------------------

/// The Metro config of an adopted app: its own, under the stopgap rule and its tsconfig
/// path aliases; and `bloom-metro.js`, rooted at the app.
pub fn write_js(
    package: &Package,
    link: Option<&ExpoLink>,
    shim_files: &[(&str, &str)],
    shimmed: &[(&str, &str)],
    header: &str,
    driver: &str,
) -> Result<(), String> {
    let build = package.build_dir();
    let shims = build.join("shims");
    // Bloom's shims answer an Expo package only where the build does not link it.
    let linked = |n: &str| link.is_some_and(|l| l.allowed.contains(n));
    let answered: Vec<(&str, &str)> = shimmed.iter().copied().filter(|(n, _)| !linked(n)).collect();
    for (name, text) in shim_files {
        if answered.iter().any(|(_, f)| f == name) || *name == "url.js" {
            write(&shims.join(name), text)?;
        }
    }
    let shim_lines: Vec<String> =
        answered.iter().map(|(n, f)| format!("  {}: {},", quote(n), quote(f))).collect();
    let allowed: Vec<String> = link.map(|l| l.allowed.iter().map(|n| quote(n)).collect()).unwrap_or_default();
    let modules: Vec<String> = link.map(|l| l.modules.keys().map(|n| quote(n)).collect()).unwrap_or_default();
    let root = crate::files::relative_url(&build, &package.root);
    write(
        &build.join("metro.config.js"),
        &format!(
            r#"{header}// An adopted Expo app (Package.bloom `adopt:`): its own Metro config, with the stopgap rule
// and its tsconfig path aliases on top (ADR 0002, section 7).
const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, {root});
const shims = path.join(__dirname, 'shims');
const shimmed = {{
{shim_lines}
}};
// The Expo packages whose JS resolves (the stopgaps and what they need), and every Expo
// module installed: one that is not allowed has no native code in this build.
const allowed = new Set([{allowed}]);
const expoModules = new Set([{modules}]);
const packageOf = (name) => (name.startsWith('@') ? name.split('/').slice(0, 2).join('/') : name.split('/')[0]);
const isExpo = (pkg) => pkg === 'expo' || pkg.startsWith('expo-') || pkg.startsWith('@expo/') || expoModules.has(pkg);

/** A tsconfig's JSON: its comments and trailing commas removed. */
function readJsonc(file) {{
  let text;
  try {{
    text = fs.readFileSync(file, 'utf8');
  }} catch {{
    return {{}};
  }}
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {{
    const c = text[i];
    if (inString) {{
      out += c;
      if (c === '\\') out += text[++i] ?? '';
      else if (c === '"') inString = false;
    }} else if (c === '"') {{
      inString = true;
      out += c;
    }} else if (c === '/' && text[i + 1] === '/') {{
      while (i < text.length && text[i] !== '\n') i++;
      out += '\n';
    }} else if (c === '/' && text[i + 1] === '*') {{
      const end = text.indexOf('*/', i + 2);
      i = end < 0 ? text.length : end + 1;
    }} else {{
      out += c;
    }}
  }}
  return JSON.parse(out.replace(/,(\s*[}}\]])/g, '$1'));
}}

/** `compilerOptions.paths` of the app's tsconfig, or of the relative configs it extends. */
function tsPaths(file) {{
  const config = readJsonc(file);
  const dir = path.dirname(file);
  const options = config.compilerOptions ?? {{}};
  if (options.paths) return {{ base: path.resolve(dir, options.baseUrl ?? '.'), paths: options.paths }};
  for (const parent of [].concat(config.extends ?? [])) {{
    if (!parent.startsWith('.')) continue;
    const found = tsPaths(path.resolve(dir, parent.endsWith('.json') ? parent : `${{parent}}.json`));
    if (found) return found;
  }}
  return null;
}}

const aliases = tsPaths(path.join(appRoot, 'tsconfig.json'));
const rules = aliases
  ? Object.entries(aliases.paths).map(([from, [to]]) => {{
      const wild = from.endsWith('*');
      const target = path.resolve(aliases.base, to.replace(/\*$/, '')) + (to.endsWith('/*') ? '/' : '');
      return [wild ? from.slice(0, -1) : from, target, wild];
    }})
  : [];

module.exports = async () => {{
  let config = require(path.join(appRoot, 'metro.config.js'));
  if (typeof config === 'function') config = await config();
  config = await config;
  const upstream = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, name, platform) => {{
    const resolve = upstream ?? context.resolveRequest;
    if (platform !== 'web') {{
      if (shimmed[name]) return {{ type: 'sourceFile', filePath: path.join(shims, shimmed[name]) }};
      const pkg = packageOf(name);
      if (isExpo(pkg) && !allowed.has(pkg)) {{
        // Not resolved: an optional `require` (in a `try`) falls back, and an import fails the build.
        throw new Error(
          `${{name}} is an Expo package this build does not link: list it in Package.bloom's stopgaps (\`.expo("${{pkg}}")\`), or use its Bloom module (ADR 0002, section 7)`,
        );
      }}
    }}
    for (const [prefix, target, wild] of rules) {{
      if (wild ? name.startsWith(prefix) : name === prefix) {{
        return resolve(context, wild ? target + name.slice(prefix.length) : target, platform);
      }}
    }}
    return resolve(context, name, platform);
  }};
  return config;
}};
"#,
            root = quote(&root),
            shim_lines = shim_lines.join("\n"),
            allowed = allowed.join(", "),
            modules = modules.join(", "),
        ),
    )?;
    write(
        &build.join("bloom-metro.js"),
        &format!(
            "{header}// Metro's project root is the adopted app's.\nprocess.env.BLOOM_METRO_ROOT = process.env.BLOOM_METRO_ROOT || require('node:path').resolve(__dirname, {root});\n{driver}",
            root = quote(&root),
        ),
    )?;
    write(&build.join(".gitignore"), "*\n")?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_specifier_splits_into_its_package_and_subpath() {
        assert_eq!(split_specifier("expo-router/entry"), ("expo-router", "entry"));
        assert_eq!(split_specifier("@scope/name/a/b"), ("@scope/name", "a/b"));
        assert_eq!(split_specifier("@scope/name"), ("@scope/name", ""));
        assert_eq!(split_specifier("react"), ("react", ""));
    }

    #[test]
    fn the_override_manifest_takes_the_debug_attributes() {
        let overrides = Overrides {
            manifest: Some(
                "<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\">\n  <application>\n    <meta-data android:name=\"a\" android:value=\"b\" />\n  </application>\n</manifest>\n"
                    .into(),
            ),
            ..Overrides::default()
        };
        let debug = overrides.build_type_manifest("android:usesCleartextTraffic=\"true\"").unwrap();
        assert!(debug.contains("<application android:usesCleartextTraffic=\"true\">"), "{debug}");
        assert!(debug.contains("xmlns:tools="), "{debug}");
        let release = overrides.build_type_manifest("").unwrap();
        assert!(release.contains("  <application>\n"), "{release}");
    }
}
