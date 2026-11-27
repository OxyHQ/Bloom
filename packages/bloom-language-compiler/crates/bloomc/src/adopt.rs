//! `bloom init --adopt`: an existing Expo app becomes a Bloom package (ADR 0002, section 2).
//!
//! It writes `Package.bloom` from the app's `package.json` and its app config, and keeps the
//! app's native config as an override layer (`Native/android/`):
//!
//! - **The manifest.** `app: App(…)` takes the application id, version, name, URL schemes,
//!   icon, splash and permissions; `adopt: Expo(entry:)` takes `package.json`'s `main`.
//! - **The stopgaps.** Every Expo package the app depends on that has no Bloom module yet is a
//!   `.expo(…)` line of `stopgaps:` (the Expo modules installed under other names among them),
//!   so the Expo surface that remains is visible in the manifest and shrinks one line at a time.
//! - **The overrides.** What the app config's plugins write into the native project, read
//!   from Expo's own introspection (`expo config --type introspect`): the manifest entries,
//!   strings, colours and Gradle properties `bloom` does not generate, and the ProGuard rules
//!   of `expo-build-properties`.
//!
//! Expo's CLI runs once here, to evaluate the app config; `bloom build` never runs it.

use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};
use std::process::Command;

use bloom_lang::package::PERMISSIONS;

use crate::json::{self, Value};
use crate::project::write;

/// What replaces each Expo package, as ADR 0002 section 7's inventory says; the packages whose
/// Bloom replacement a Bloom build already has are not stopgaps.
const REPLACED: &[(&str, &str)] = &[
    ("expo-video", "BloomVideo, Bloom's video view"),
    ("expo-splash-screen", "the manifest's splash (`App(splash:splashImage:)`)"),
    ("expo-dev-client", "`bloom run`"),
    ("expo-build-properties", "Package.bloom and the overrides"),
];

const UNTIL: &[(&str, &str)] = &[
    ("expo-image", "BloomUI.Image"),
    ("expo-image-manipulator", "ImageEditor"),
    ("expo-image-picker", "PhotoPicker"),
    ("expo-camera", "Camera"),
    ("expo-router", "the Bloom router"),
    ("expo-linking", "the Bloom router"),
    ("expo-updates", "Bloom.Updates (Oxy Updates)"),
    ("expo-constants", "App.info"),
    ("expo-system-ui", "Package.bloom settings"),
    ("expo-status-bar", "App.statusBar"),
    ("expo-font", "Package.bloom fonts"),
    ("expo-asset", "typed resources"),
    ("expo-audio", "BloomMedia.AudioPlayer"),
    ("expo-blur", "BloomUI materials"),
    ("expo-glass-effect", "BloomUI glass"),
    ("expo-linear-gradient", "BloomUI.LinearGradient"),
    ("expo-gl", "Canvas"),
    ("expo-haptics", "Bloom.Device.Haptics"),
    ("expo-keep-awake", "Screen.keepAwake"),
    ("expo-file-system", "FileStore"),
    ("expo-document-picker", "DocumentPicker"),
    ("expo-sharing", "ShareSheet"),
    ("expo-share-intent", "incoming shares"),
    ("expo-secure-store", "SecureStore"),
    ("expo-local-authentication", "Biometrics"),
    ("expo-crypto", "Crypto"),
    ("@expo/app-integrity", "AppIntegrity"),
    ("expo-sqlite", "BloomData's SQLite"),
    ("expo-notifications", "Bloom.Notifications"),
    ("expo-location", "Bloom.Location"),
    ("expo-clipboard", "Bloom.Clipboard"),
    ("expo-web-browser", "Bloom.WebSession"),
    ("@expo/vector-icons", "BloomUI.Icon"),
];

/// Gradle properties `bloom` writes itself, or only Expo's app template reads.
const OWN_PROPERTIES: &[&str] = &[
    "reactNativeArchitectures",
    "newArchEnabled",
    "hermesEnabled",
    "edgeToEdgeEnabled",
    "android.useAndroidX",
    "android.enableMinifyInReleaseBuilds",
    "android.enableShrinkResourcesInReleaseBuilds",
    "android.enablePngCrunchInReleaseBuilds",
    "EX_DEV_CLIENT_NETWORK_INSPECTOR",
    "expo.gif.enabled",
    "expo.webp.enabled",
    "expo.webp.animated",
];

/// Resources `bloom` generates (the name, the splash, the launcher background).
const OWN_RESOURCES: &[&str] = &["app_name", "splash_background", "ic_launcher_background"];

fn quote(s: &str) -> String {
    json::write(&Value::String(s.to_string()))
}

fn read_json(path: &Path) -> Result<Value, String> {
    let text = std::fs::read_to_string(path).map_err(|e| format!("{}: {e}", path.display()))?;
    json::parse(&text).map_err(|e| format!("{}: {e}", path.display()))
}

fn keys(value: &Value) -> Vec<String> {
    match value {
        Value::Object(fields) => fields.keys().cloned().collect(),
        _ => Vec::new(),
    }
}

fn is_expo(name: &str) -> bool {
    name == "expo" || name.starts_with("expo-") || name.starts_with("@expo/")
}

/// The package directory of `name`, from `root` up.
fn installed(root: &Path, name: &str) -> Option<PathBuf> {
    root.ancestors().map(|d| d.join("node_modules").join(name)).find(|p| p.join("package.json").is_file())
}

/// Runs a node program in `root` and parses its standard output as JSON.
fn node_json(root: &Path, program: &Path, args: &[&str]) -> Result<Value, String> {
    let output = Command::new("node")
        .arg(program)
        .args(args)
        .current_dir(root)
        .env("EXPO_NO_TELEMETRY", "1")
        .output()
        .map_err(|e| format!("node {}: {e}", program.display()))?;
    if !output.status.success() {
        return Err(format!(
            "`node {} {}` failed:\n{}",
            program.display(),
            args.join(" "),
            String::from_utf8_lossy(&output.stderr)
        ));
    }
    json::parse(&String::from_utf8_lossy(&output.stdout)).map_err(|e| format!("{}: {e}", program.display()))
}

/// A Bloom package name from the app's: its letters and digits, capitalised.
fn package_name(name: &str) -> String {
    let mut out = String::new();
    let mut upper = true;
    for c in name.chars() {
        if c.is_ascii_alphanumeric() {
            out.push(if upper { c.to_ascii_uppercase() } else { c });
            upper = false;
        } else {
            upper = true;
        }
    }
    if out.chars().next().is_none_or(|c| !c.is_ascii_uppercase()) {
        out.insert_str(0, "App");
    }
    out
}

fn relative_asset(path: &str) -> String {
    path.trim_start_matches("./").to_string()
}

/// A plugin's options in the app config (`[name, options]`), when it lists it.
fn plugin<'a>(config: &'a Value, name: &str) -> Option<&'a Value> {
    config.get("plugins").as_array().iter().find_map(|p| match p {
        Value::Array(items) if items.first().and_then(Value::as_str) == Some(name) => items.get(1),
        _ => None,
    })
}

// ---- the manifest, as xml2js writes it ---------------------------------------------

fn attrs(node: &Value) -> BTreeMap<String, String> {
    match node.get("$") {
        Value::Object(fields) => {
            fields.iter().filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string()))).collect()
        }
        _ => BTreeMap::new(),
    }
}

fn children<'a>(node: &'a Value, tag: &str) -> &'a [Value] {
    node.get(tag).as_array()
}

fn escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\n', "&#xA;")
}

/// An element and its children as XML, from xml2js's object form.
fn element(tag: &str, node: &Value, attributes: &BTreeMap<String, String>, depth: usize, out: &mut String) {
    let pad = "  ".repeat(depth);
    out.push_str(&format!("{pad}<{tag}"));
    for (k, v) in attributes {
        out.push_str(&format!(" {k}=\"{}\"", escape(v)));
    }
    let mut inner = String::new();
    if let Value::Object(fields) = node {
        for (child, items) in fields {
            if child == "$" || child == "_" {
                continue;
            }
            for item in items.as_array() {
                element(child, item, &attrs(item), depth + 1, &mut inner);
            }
        }
    }
    let text = node.get("_").as_str().unwrap_or_default();
    if inner.is_empty() && text.is_empty() {
        out.push_str(" />\n");
    } else if inner.is_empty() {
        out.push_str(&format!(">{}</{tag}>\n", escape(text)));
    } else {
        out.push_str(&format!(">\n{inner}{pad}</{tag}>\n"));
    }
}

/// The permission's Package.bloom member, when it has one.
fn permission_member(name: &str) -> Option<&'static str> {
    let short = name.strip_prefix("android.permission.")?;
    let member = match short {
        "CAMERA" => "camera",
        "RECORD_AUDIO" => "microphone",
        "ACCESS_FINE_LOCATION" | "ACCESS_COARSE_LOCATION" => "location",
        "POST_NOTIFICATIONS" => "notifications",
        "READ_CONTACTS" => "contacts",
        "USE_BIOMETRIC" => "biometrics",
        "VIBRATE" => "vibrate",
        _ => return None,
    };
    PERMISSIONS.iter().copied().find(|m| *m == member)
}

/// What `bloom init --adopt` read from the introspected manifest.
#[derive(Default)]
struct FromManifest {
    /// `permissions:` entries, as Package.bloom writes them.
    permissions: Vec<String>,
    /// The URL schemes of the main activity's plain VIEW filters.
    schemes: Vec<String>,
    /// The override manifest.
    overrides: String,
    /// What the overrides left out, for the report.
    dropped: Vec<String>,
    /// Resources the kept entries reference (`@string/x`, `@color/x`).
    references: BTreeSet<String>,
}

fn read_manifest(manifest: &Value, resources: &BTreeSet<String>) -> FromManifest {
    let mut out = FromManifest::default();
    let root = manifest.get("manifest");
    let mut body = String::new();
    // Every attribute value that references a resource the overrides cannot provide is left out.
    let usable = |out: &mut FromManifest, value: &str| -> bool {
        match value.strip_prefix('@').and_then(|r| r.split_once('/')) {
            Some(("string" | "color" | "drawable" | "mipmap" | "xml", name)) => {
                if resources.contains(name) {
                    out.references.insert(name.to_string());
                    true
                } else {
                    false
                }
            }
            _ => true,
        }
    };
    for p in children(root, "uses-permission") {
        let a = attrs(p);
        let Some(name) = a.get("android:name") else { continue };
        if name == "android.permission.INTERNET" {
            continue;
        }
        if a.len() == 1 {
            let entry = permission_member(name).map(|m| format!(".{m}")).unwrap_or_else(|| quote(name));
            if !out.permissions.contains(&entry) {
                out.permissions.push(entry);
            }
        } else {
            element("uses-permission", p, &a, 1, &mut body);
        }
    }
    for tag in ["queries", "permission", "uses-feature"] {
        for item in children(root, tag) {
            element(tag, item, &attrs(item), 1, &mut body);
        }
    }
    let mut application = String::new();
    // What Bloom's generated application sets itself.
    const APP_OWN: &[&str] = &[
        "android:name",
        "android:label",
        "android:icon",
        "android:roundIcon",
        "android:allowBackup",
        "android:theme",
        "android:supportsRtl",
        "android:enableOnBackInvokedCallback",
    ];
    let mut app_attrs = BTreeMap::new();
    for app in children(root, "application") {
        for (k, v) in attrs(app) {
            if APP_OWN.contains(&k.as_str()) {
                continue;
            }
            if usable(&mut out, &v) {
                app_attrs.insert(k, v);
            } else {
                out.dropped
                    .push(format!("application {k}=\"{v}\" (a resource the app config's plugins generate)"));
            }
        }
        let Value::Object(fields) = app else { continue };
        for (tag, items) in fields {
            if tag == "$" {
                continue;
            }
            for item in items.as_array() {
                let mut a = attrs(item);
                if tag == "activity" && a.get("android:name").map(String::as_str) == Some(".MainActivity") {
                    activity(item, &mut a, &mut out, &mut application);
                    continue;
                }
                let refs: Vec<String> = a.values().cloned().collect();
                if refs.iter().all(|v| usable(&mut out, v)) {
                    element(tag, item, &a, 2, &mut application);
                } else {
                    out.dropped
                        .push(format!("<{tag} {}>", a.get("android:name").cloned().unwrap_or_default()));
                }
            }
        }
    }
    if !application.is_empty() || !app_attrs.is_empty() {
        body.push_str("  <application");
        for (k, v) in &app_attrs {
            body.push_str(&format!(" {k}=\"{}\"", escape(v)));
        }
        if application.is_empty() {
            body.push_str(" />\n");
        } else {
            body.push_str(&format!(">\n{application}  </application>\n"));
        }
    }
    out.overrides = format!(
        "<!-- The app's own native config, over what bloom generates from Package.bloom (written by\n     bloom's adoption of the app, from the app config's plugins; edit it here). XML comments\n     take no double hyphen. -->\n<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\" xmlns:tools=\"http://schemas.android.com/tools\">\n{body}</manifest>\n"
    );
    out
}

/// The main activity: its schemes become `App(schemes:)`, its other filters and the attributes
/// that differ from Bloom's stay, replacing Bloom's.
fn activity(
    node: &Value,
    a: &mut BTreeMap<String, String>,
    out: &mut FromManifest,
    application: &mut String,
) {
    // Bloom's own: the name, the launch mode, export, the launch theme (Bloom's splash) and
    // the configuration changes.
    for own in ["android:launchMode", "android:exported", "android:theme", "android:configChanges"] {
        a.remove(own);
    }
    let mut filters = String::new();
    for filter in children(node, "intent-filter") {
        let actions: Vec<String> =
            children(filter, "action").iter().filter_map(|x| attrs(x).get("android:name").cloned()).collect();
        let data: Vec<BTreeMap<String, String>> = children(filter, "data").iter().map(attrs).collect();
        if actions.iter().any(|x| x == "android.intent.action.MAIN") {
            continue;
        }
        let plain_view = actions == ["android.intent.action.VIEW"]
            && !attrs(filter).contains_key("android:autoVerify")
            && !data.is_empty()
            && data.iter().all(|d| d.len() == 1 && d.contains_key("android:scheme"));
        if plain_view {
            for d in &data {
                let scheme = &d["android:scheme"];
                // Expo's development client's own scheme.
                if !scheme.starts_with("exp+") && !out.schemes.contains(scheme) {
                    out.schemes.push(scheme.clone());
                }
            }
            continue;
        }
        let mut f = attrs(filter);
        f.remove("data-generated");
        element("intent-filter", filter, &f, 3, &mut filters);
    }
    let replaced: Vec<&str> =
        a.keys().filter(|k| *k == "android:windowSoftInputMode").map(String::as_str).collect();
    let mut tag = String::from("    <activity android:name=\".MainActivity\"");
    for (k, v) in a.iter().filter(|(k, _)| *k != "android:name") {
        tag.push_str(&format!(" {k}=\"{}\"", escape(v)));
    }
    if !replaced.is_empty() {
        tag.push_str(&format!(" tools:replace=\"{}\"", replaced.join(",")));
    }
    if filters.is_empty() {
        tag.push_str(" />\n");
    } else {
        tag.push_str(&format!(">\n{filters}    </activity>\n"));
    }
    application.push_str(&tag);
}

/// `res/values/overrides.xml`: the strings and colours the plugins write (besides Bloom's own).
fn resources_xml(android: &Value) -> (String, BTreeSet<String>) {
    let mut names = BTreeSet::new();
    let mut body = String::new();
    for (file, tag) in [("strings", "string"), ("colors", "color")] {
        for item in children(android.get(file).get("resources"), tag) {
            let a = attrs(item);
            let Some(name) = a.get("name") else { continue };
            if OWN_RESOURCES.contains(&name.as_str()) || name.starts_with("expo_splash_screen") {
                continue;
            }
            names.insert(name.clone());
            element(tag, item, &a, 1, &mut body);
        }
    }
    (
        format!(
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Written by bloom's adoption of the app, from the app config's plugins. -->\n<resources>\n{body}</resources>\n"
        ),
        names,
    )
}

/// The stopgaps: every Expo package the app depends on, and every Expo module installed for it
/// under another name, but those Bloom replaces and those the app excludes from autolinking.
fn stopgaps(root: &Path, package: &Value, modules: &BTreeSet<String>) -> Vec<(String, Option<String>)> {
    let deps: BTreeSet<String> = keys(package.get("dependencies")).into_iter().collect();
    let excluded: BTreeSet<String> = package
        .get("expo")
        .get("autolinking")
        .get("android")
        .get("exclude")
        .as_array()
        .iter()
        .filter_map(|v| v.as_str().map(str::to_string))
        .collect();
    let local = root.join("modules");
    let mut out = Vec::new();
    for name in deps.iter().chain(modules.iter()) {
        let direct = deps.contains(name);
        let expo_module = modules.contains(name);
        // The app's own Expo modules (`modules/<name>`), which Expo autolinks without a dependency.
        let own_module = expo_module && local.join(name).is_dir();
        if !(direct && (is_expo(name) || expo_module) || own_module) {
            continue;
        }
        if name == "expo" || excluded.contains(name) || REPLACED.iter().any(|(n, _)| n == name) {
            continue;
        }
        if out.iter().any(|(n, _): &(String, Option<String>)| n == name) {
            continue;
        }
        let until = UNTIL
            .iter()
            .find(|(n, _)| n == name)
            .map(|(_, u)| u.to_string())
            .or_else(|| own_module.then(|| "its Bloom native module (`.native`)".to_string()));
        out.push((name.clone(), until));
    }
    out
}

/// `bloom init --adopt` in `root`.
pub fn adopt(root: &Path) -> Result<bool, String> {
    let manifest_path = root.join(bloom_lang::package::MANIFEST);
    if manifest_path.exists() {
        return Err(format!("{} exists already", manifest_path.display()));
    }
    let package = read_json(&root.join("package.json"))?;
    let cli = installed(root, "@expo/cli")
        .ok_or("this is not an Expo app with its packages installed (no @expo/cli in node_modules)")?;
    eprintln!("bloom: evaluating the app config with Expo's CLI (once, for the adoption)");
    let config = node_json(root, &cli.join("bin/cli.js"), &["config", "--type", "introspect", "--json"])?;
    let autolinking =
        installed(root, "expo-modules-autolinking").ok_or("expo-modules-autolinking is not installed")?;
    let modules: BTreeSet<String> = keys(&node_json(
        root,
        &autolinking.join("bin/expo-modules-autolinking.js"),
        &["search", "--platform", "android", "--json"],
    )?)
    .into_iter()
    .collect();
    let android_results = config.get("_internal").get("modResults").get("android");
    let (resources, resource_names) = resources_xml(android_results);
    let from_manifest = read_manifest(android_results.get("manifest"), &resource_names);

    // App(…)
    let name = config.get("name").as_str().unwrap_or("App").to_string();
    let android = config.get("android");
    let mut app = Vec::new();
    if let Some(id) = android.get("package").as_str() {
        app.push(format!("id: {}", quote(id)));
    }
    if let Some(version) = config.get("version").as_str() {
        app.push(format!("version: {}", quote(version)));
    }
    if let Some(code) = android.get("versionCode").as_u32() {
        app.push(format!("build: {code}"));
    }
    app.push(format!("displayName: {}", quote(&name)));
    let mut schemes = from_manifest.schemes.clone();
    for scheme in match config.get("scheme") {
        Value::String(s) => vec![s.clone()],
        other => other.as_array().iter().filter_map(|v| v.as_str().map(str::to_string)).collect(),
    } {
        if !schemes.contains(&scheme) {
            schemes.push(scheme);
        }
    }
    if !schemes.is_empty() {
        app.push(format!("schemes: [{}]", schemes.iter().map(|s| quote(s)).collect::<Vec<_>>().join(", ")));
    }
    if let Some(icon) = config.get("icon").as_str() {
        app.push(format!("icon: {}", quote(&relative_asset(icon))));
    }
    let splash =
        plugin(&config, "expo-splash-screen").cloned().unwrap_or_else(|| config.get("splash").clone());
    if let Some(color) = splash.get("backgroundColor").as_str().filter(|c| c.len() == 7 && c.starts_with('#'))
    {
        app.push(format!("splash: {}", quote(color)));
    }
    if let Some(image) = splash.get("image").as_str() {
        app.push(format!("splashImage: {}", quote(&relative_asset(image))));
    }
    if !from_manifest.permissions.is_empty() {
        app.push(format!("permissions: [{}]", from_manifest.permissions.join(", ")));
    }
    let build_properties = plugin(&config, "expo-build-properties").map(|p| p.get("android").clone());
    if build_properties.as_ref().is_some_and(|p| p.get("buildReactNativeFromSource") == &Value::Bool(true)) {
        app.push("reactNativeFromSource: true".into());
    }
    let entry = package.get("main").as_str().unwrap_or("index.js").to_string();
    let stopgaps = stopgaps(root, &package, &modules);
    let platforms: Vec<&str> = {
        let listed = config.get("platforms").as_array();
        let has = |p: &str| listed.is_empty() || listed.iter().any(|v| v.as_str() == Some(p));
        let mut out = Vec::new();
        if has("ios") {
            out.push(".iOS(17)");
        }
        if has("android") {
            out.push(".android(26)");
        }
        if has("web") {
            out.push(".web");
        }
        out
    };
    let mut text = format!(
        "// Package.bloom: written by `bloom init --adopt` from package.json and the app config.\n// The app's JS stays where it is; `bloom build android` generates and drives the native\n// project (ADR 0002, section 7).\nlet package = Package(\n  name: {name},\n  platforms: [{platforms}],\n  app: App(\n{app}\n  ),\n  // The app's own native config, kept as a layer over the generated project: Native/android/.\n  adopt: Expo(entry: {entry}, overrides: \"Native\"),\n  // The Expo packages still linked (Expo Modules autolinking, limited to these and what they\n  // need), each until its Bloom module replaces it. Remove a line when its module lands.\n  stopgaps: [\n",
        name = quote(&package_name(&name)),
        platforms = platforms.join(", "),
        app = app.iter().map(|a| format!("    {a},")).collect::<Vec<_>>().join("\n"),
        entry = quote(&entry),
    );
    for (stopgap, until) in &stopgaps {
        match until {
            Some(until) => {
                text.push_str(&format!("    .expo({}, until: {}),\n", quote(stopgap), quote(until)))
            }
            None => text.push_str(&format!("    .expo({}),\n", quote(stopgap))),
        }
    }
    text.push_str("  ],\n  targets: []\n)\n");
    // The manifest must read back: a test of what this wrote.
    if let Err(errors) = bloom_lang::package::parse(&text, "Package.bloom") {
        let shown: Vec<String> = errors.iter().map(|e| e.message.clone()).collect();
        return Err(format!("the generated Package.bloom does not parse: {}\n{text}", shown.join("; ")));
    }

    let native = root.join("Native/android");
    write(&native.join("AndroidManifest.xml"), &from_manifest.overrides)?;
    if !resource_names.is_empty() {
        write(&native.join("res/values/overrides.xml"), &resources)?;
    }
    let properties: Vec<String> = android_results
        .get("gradleProperties")
        .as_array()
        .iter()
        .filter(|p| p.get("type").as_str() == Some("property"))
        .filter_map(|p| Some((p.get("key").as_str()?, p.get("value").as_str()?)))
        .filter(|(k, _)| !OWN_PROPERTIES.contains(k) && !k.starts_with("org.gradle."))
        .map(|(k, v)| format!("{k}={v}"))
        .collect();
    if !properties.is_empty() {
        write(
            &native.join("gradle.properties"),
            &format!(
                "# Written by `bloom init --adopt` from the app config's plugins.\n{}\n",
                properties.join("\n")
            ),
        )?;
    }
    if let Some(rules) = build_properties.as_ref().and_then(|p| p.get("extraProguardRules").as_str()) {
        write(
            &native.join("proguard-rules.pro"),
            &format!("# expo-build-properties' extraProguardRules.\n{rules}\n"),
        )?;
    }
    write(&manifest_path, &text)?;
    println!("bloom: wrote Package.bloom and Native/android/ for {name}");
    println!(
        "bloom: {} stopgap(s): {}",
        stopgaps.len(),
        stopgaps.iter().map(|(n, _)| n.as_str()).collect::<Vec<_>>().join(", ")
    );
    for (pkg, by) in REPLACED {
        if package.get("dependencies").get(pkg).as_str().is_some() {
            println!("bloom: {pkg} is not a stopgap: {by} replaces it");
        }
    }
    for dropped in &from_manifest.dropped {
        println!("bloom: left out of the overrides: {dropped}");
    }
    println!("bloom: build it with `bloom build android`; `.bloom/` is generated (git-ignore it)");
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn names_and_permissions() {
        assert_eq!(package_name("Mention"), "Mention");
        assert_eq!(package_name("my-app (dev)"), "MyAppDev");
        assert_eq!(package_name("9lives"), "App9lives");
        assert_eq!(permission_member("android.permission.CAMERA"), Some("camera"));
        assert_eq!(permission_member("so.oxy.permission.IDENTITY"), None);
    }

    /// The introspected manifest splits into Package.bloom's settings and the overrides.
    #[test]
    fn the_manifest_splits_into_settings_and_overrides() {
        let manifest = json::parse(
            r##"{"manifest": {"$": {"xmlns:android": "x"},
              "uses-permission": [{"$": {"android:name": "android.permission.INTERNET"}}, {"$": {"android:name": "android.permission.CAMERA"}}, {"$": {"android:name": "so.oxy.permission.IDENTITY"}}, {"$": {"android:name": "android.permission.READ_EXTERNAL_STORAGE", "android:maxSdkVersion": "32"}}],
              "queries": [{"provider": [{"$": {"android:authorities": "so.oxy.commons.identity"}}]}],
              "application": [{"$": {"android:name": ".MainApplication", "android:allowBackup": "true", "android:fullBackupContent": "@xml/secure_store_backup_rules"},
                "meta-data": [{"$": {"android:name": "a.b", "android:value": "@string/runtime"}}, {"$": {"android:name": "c.d", "android:resource": "@color/missing"}}],
                "activity": [{"$": {"android:name": ".MainActivity", "android:theme": "@style/Theme.App.SplashScreen", "android:windowSoftInputMode": "adjustPan", "android:screenOrientation": "portrait"},
                  "intent-filter": [
                    {"action": [{"$": {"android:name": "android.intent.action.MAIN"}}]},
                    {"action": [{"$": {"android:name": "android.intent.action.VIEW"}}], "data": [{"$": {"android:scheme": "mention"}}, {"$": {"android:scheme": "exp+mention"}}]},
                    {"$": {"android:autoVerify": "true", "data-generated": "true"}, "action": [{"$": {"android:name": "android.intent.action.VIEW"}}], "data": [{"$": {"android:scheme": "https", "android:host": "mention.earth"}}]}
                  ]}]}]}}"##,
        )
        .unwrap();
        let resources: BTreeSet<String> = ["runtime".to_string()].into_iter().collect();
        let out = read_manifest(&manifest, &resources);
        assert_eq!(out.permissions, [".camera", "\"so.oxy.permission.IDENTITY\""]);
        assert_eq!(out.schemes, ["mention"]);
        let o = &out.overrides;
        assert!(o.contains("android:maxSdkVersion=\"32\""), "{o}");
        assert!(o.contains("so.oxy.commons.identity"), "{o}");
        assert!(o.contains("android:value=\"@string/runtime\""), "{o}");
        assert!(!o.contains("@color/missing") && !o.contains("secure_store_backup_rules"), "{o}");
        assert!(!o.contains("allowBackup") && !o.contains("Theme.App.SplashScreen"), "{o}");
        assert!(o.contains("android:screenOrientation=\"portrait\""), "{o}");
        assert!(o.contains("tools:replace=\"android:windowSoftInputMode\""), "{o}");
        assert!(o.contains("android:autoVerify=\"true\"") && !o.contains("data-generated"), "{o}");
        assert!(!o.contains("android.intent.action.MAIN"), "{o}");
        assert_eq!(out.dropped.len(), 2, "{:?}", out.dropped);
    }
}
