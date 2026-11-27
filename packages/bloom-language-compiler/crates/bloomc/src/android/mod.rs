//! `bloom build android` and `bloom run android` without Expo (ADR 0002, section 7).
//!
//! `bloom` writes the Gradle project itself into `.bloom/build/android/` from
//! `Package.bloom`, and drives it: settings and root build over React Native's Gradle
//! plugin, the app module (its manifest from `app: App(…)`: id, version, permissions,
//! icon, splash, deep-link schemes; its signing from a local keystore that is never
//! committed), React Native core (Fabric and Hermes), the React Native libraries the app
//! depends on (autolinked from `autolinking.json`, which `bloom` writes, see `autolink`),
//! and the package's Bloom native modules (`.native` targets, the standard library's
//! among them), each a Gradle library whose TurboModule spec React Native's codegen reads.
//! Metro is driven by `bloom` too (`bloom-metro.js`, which the Gradle plugin calls to
//! bundle). No Expo prebuild, CLI, EAS or Expo module is involved: the JS of an Expo
//! package that remains under Bloom (expo-router, until the Bloom router replaces it) runs
//! over small shims of the Expo surface it reads (`shims/`). `--with-expo` keeps the Expo
//! path (`crate::expo`) until every module is replaced.

mod autolink;

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::Command;

use bloom_lang::package::Platform;

use crate::expo::{Mode, application_id, run_in, shown_rel};
use crate::json::{self, Value};
use crate::project::{CheckOptions, Package, check_modules, write};


/// The shims of the Expo surface a Bloom build answers, by file.
const SHIM_FILES: &[(&str, &str)] = &[
    ("expo.js", include_str!("shims/expo.js")),
    ("expo-modules-core.js", include_str!("shims/expo-modules-core.js")),
    ("expo-constants.js", include_str!("shims/expo-constants.js")),
    ("expo-linking.js", include_str!("shims/expo-linking.js")),
    ("expo-blur.js", include_str!("shims/expo-blur.js")),
    ("expo-font.js", include_str!("shims/expo-font.js")),
    ("expo-splash-screen.js", include_str!("shims/expo-splash-screen.js")),
    ("expo-dom.js", include_str!("shims/expo-dom.js")),
    ("empty.js", include_str!("shims/empty.js")),
    ("unavailable.js", include_str!("shims/unavailable.js")),
];

/// What each shimmed request resolves to on Android and iOS.
const SHIMMED: &[(&str, &str)] = &[
    ("expo", "expo.js"),
    ("expo-modules-core", "expo-modules-core.js"),
    ("expo-constants", "expo-constants.js"),
    ("expo-linking", "expo-linking.js"),
    ("expo-blur", "expo-blur.js"),
    ("expo-font", "expo-font.js"),
    ("expo-splash-screen", "expo-splash-screen.js"),
    ("expo/dom", "expo-dom.js"),
    ("expo/dom/global", "empty.js"),
    ("@expo/metro-runtime", "empty.js"),
];

/// Expo packages whose JS a Bloom build keeps, over the shims, until their Bloom
/// replacement lands: expo-router (the Bloom router, phase F step 3) and the two it draws
/// with. Every other `expo*` request resolves to `unavailable.js`.
const KEPT: &[&str] = &["expo-router", "expo-status-bar", "expo-glass-effect"];

/// React Native's own Metro config and Babel preset: what a Bloom build bundles with
/// (React Native's version, as React Native pins them).
pub fn tools() -> Vec<(String, String)> {
    let rn = crate::expo::RUNTIME.iter().find(|(n, _)| *n == "react-native").map_or("*", |(_, v)| v);
    vec![
        ("@react-native/babel-preset".to_string(), rn.to_string()),
        ("@react-native/metro-config".to_string(), rn.to_string()),
    ]
}

// ---- the JS layer --------------------------------------------------------------

fn quote(s: &str) -> String {
    json::write(&Value::String(s.to_string()))
}

/// The app's config as the shims read it (`expo-constants`' `expoConfig`, the scheme).
fn app_config(package: &Package) -> String {
    let m = &package.manifest;
    let schemes = schemes(package);
    json::write(&json::object([
        ("name", Value::String(display_name(package))),
        ("slug", Value::String(slug(&m.name))),
        ("version", Value::String(version(package))),
        ("scheme", Value::String(schemes.first().cloned().unwrap_or_default())),
        ("schemes", Value::Array(schemes.into_iter().map(Value::String).collect())),
        ("android", json::object([("package", Value::String(app_id(package)))])),
    ]))
}

/// The root of an app with a `NavigationStack`: today's router over the route files under
/// `app/`, whose context `bloom` writes (no `require.context`, no Expo entry).
pub fn routed_entry(header: &str, app: &Path) -> Result<String, String> {
    let mut files = Vec::new();
    list_js(app, app, &mut files);
    files.sort();
    if files.is_empty() {
        return Err(format!("{}: no route files", app.display()));
    }
    let modules: Vec<String> =
        files.iter().map(|f| format!("  {}: require({}),", quote(&format!("./{f}")), quote(&format!("./app/{f}")))).collect();
    Ok(format!(
        "{header}import {{ createElement }} from 'react';\nimport {{ AppRegistry }} from 'react-native';\nimport {{ ExpoRoot }} from 'expo-router';\n\n// The route files (written from the app's routes enum), as the router's context.\nconst modules = {{\n{}\n}};\nfunction context(key) {{\n  return modules[key];\n}}\ncontext.keys = () => Object.keys(modules);\ncontext.resolve = (key) => key;\ncontext.id = './app';\n\nfunction Root() {{\n  return createElement(ExpoRoot, {{ context }});\n}}\n\nAppRegistry.registerComponent('main', () => Root);\n",
        modules.join("\n")
    ))
}

fn list_js(root: &Path, dir: &Path, out: &mut Vec<String>) {
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            list_js(root, &path, out);
        } else if path.extension().is_some_and(|e| e == "js") {
            out.push(path.strip_prefix(root).unwrap_or(&path).to_string_lossy().replace('\\', "/"));
        }
    }
}

/// Metro and Babel config, the shims and `bloom-metro.js`: a Bloom build's JS layer.
pub fn write_js(package: &Package, header: &str) -> Result<(), String> {
    let build = package.build_dir();
    let shims = build.join("shims");
    for (name, text) in SHIM_FILES {
        write(&shims.join(name), text)?;
    }
    write(&shims.join("app-config.json"), &app_config(package))?;
    let shimmed: Vec<String> = SHIMMED.iter().map(|(n, f)| format!("  {}: {},", quote(n), quote(f))).collect();
    let kept: Vec<String> = KEPT.iter().map(|n| quote(n)).collect();
    let native_only: Vec<String> = crate::expo::STDLIB_NATIVE.iter().map(|(n, _)| quote(n)).collect();
    write(
        &build.join("metro.config.js"),
        &format!(
            r#"{header}// A Bloom build: React Native's own Metro config, no Expo underneath (ADR 0002, section 7).
const path = require('node:path');
const {{ getDefaultConfig }} = require('@react-native/metro-config');
const {{ withBloomLanguage }} = require('@oxy.so/bloom-language-compiler/metro');

const projectRoot = __dirname;
const packageRoot = path.resolve(projectRoot, {root});
const config = getDefaultConfig(projectRoot);
config.watchFolders = [packageRoot];
config.resolver.nodeModulesPaths = [path.join(projectRoot, 'node_modules')];
config.resolver.disableHierarchicalLookup = true;
config.resolver.blockList = [/\/\.bloom\/(cache|dist|modules)\//, /\/\.bloom\/build\/(android|ios|native)\//];

// The Expo surface the JS that remains reads, answered by Bloom's shims; any other Expo
// package has no native code here, and resolves to a module that says so.
const shims = path.join(projectRoot, 'shims');
const shimmed = {{
{shimmed}
}};
const kept = new Set([{kept}]);
const nativeOnly = new Set([{native_only}]);
const packageOf = (name) => (name.startsWith('@') ? name.split('/').slice(0, 2).join('/') : name.split('/')[0]);
const isExpo = (pkg) => pkg === 'expo' || pkg.startsWith('expo-') || pkg.startsWith('@expo/');
const upstreamResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, name, platform) => {{
  if (platform === 'web') {{
    if (nativeOnly.has(name)) return {{ type: 'empty' }};
  }} else {{
    if (shimmed[name]) return {{ type: 'sourceFile', filePath: path.join(shims, shimmed[name]) }};
    const pkg = packageOf(name);
    if (isExpo(pkg) && !kept.has(pkg)) {{
      if (process.env.BLOOM_DEBUG) console.warn(`bloom: ${{name}} (from ${{context.originModulePath}}) has no native code in a Bloom build`);
      return {{ type: 'sourceFile', filePath: path.join(shims, 'unavailable.js') }};
    }}
  }}
  return (upstreamResolve ?? context.resolveRequest)(context, name, platform);
}};

module.exports = withBloomLanguage(config);
"#,
            root = quote(&crate::files::relative_url(&build, &package.root)),
            shimmed = shimmed.join("\n"),
            kept = kept.join(", "),
            native_only = native_only.join(", "),
        ),
    )?;
    write(
        &build.join("babel.config.js"),
        &format!(
            r#"{header}// React Native's preset, Reanimated's worklets, and the one build-time constant the
// Expo packages that remain read (`process.env.EXPO_OS`, the platform).
function inlinePlatform({{ types: t }}) {{
  return {{
    visitor: {{
      MemberExpression(path, state) {{
        if (path.matchesPattern('process.env.EXPO_OS')) path.replaceWith(t.stringLiteral(state.opts.platform));
      }},
    }},
  }};
}}

module.exports = function (api) {{
  const platform = api.caller((caller) => (caller && caller.platform) || 'android');
  api.cache.using(() => platform);
  return {{
    presets: ['module:@react-native/babel-preset'],
    plugins: [[inlinePlatform, {{ platform }}], 'react-native-worklets/plugin'],
  }};
}};
"#
        ),
    )?;
    write(&build.join("bloom-metro.js"), &format!("{header}{METRO_DRIVER}"))?;
    Ok(())
}

/// `bloom-metro.js`: Metro as `bloom` drives it. `bundle` is what React Native's Gradle
/// plugin runs for a release (and embedded debug) bundle; `start` is the dev server.
const METRO_DRIVER: &str = r#"'use strict';
// node bloom-metro.js bundle --platform android --dev false --entry-file … --bundle-output …
// node bloom-metro.js start [--port 8081]
const path = require('node:path');
const { bundleCommand, startCommand } = require('@react-native/community-cli-plugin');

const [command, ...rest] = process.argv.slice(2);
const args = { config: path.join(__dirname, 'metro.config.js') };
for (let i = 0; i < rest.length; i++) {
  const flag = rest[i];
  if (!flag.startsWith('--')) continue;
  const key = flag.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const next = rest[i + 1];
  if (next === undefined || next.startsWith('--')) {
    args[key] = true;
  } else {
    args[key] = next === 'true' ? true : next === 'false' ? false : next;
    i++;
  }
}
if (typeof args.port === 'string') args.port = Number(args.port);
if (typeof args.maxWorkers === 'string') args.maxWorkers = Number(args.maxWorkers);
const ctx = {
  root: __dirname,
  reactNativePath: path.dirname(require.resolve('react-native/package.json')),
  platforms: { android: {}, ios: {} },
};
const commands = { bundle: bundleCommand, start: startCommand };
if (!commands[command]) {
  console.error(`bloom-metro: no command \`${command}\` (bundle, start)`);
  process.exit(2);
}
if (command === 'bundle') args.dev = args.dev === true;
Promise.resolve(commands[command].func([], ctx, args)).catch((error) => {
  console.error(error);
  process.exit(1);
});
"#;

// ---- the native modules --------------------------------------------------------

/// A Bloom native module the build links: its interface and its Kotlin sources.
#[derive(Debug, Clone)]
pub struct NativeModule {
    pub module: bloom_lang::native::Module,
    pub kotlin: PathBuf,
}

/// The standard library's native modules and the package's `.native` targets.
pub fn native_modules(package: &Package) -> Result<Vec<NativeModule>, String> {
    bloom_lang::stdlib::ensure(&package.root);
    let std_dir = bloom_lang::stdlib::dir(&package.root);
    let std_manifest = bloom_lang::package::parse(bloom_lang::stdlib::MANIFEST, "stdlib/Package.bloom")
        .map_err(|_| "the standard library's manifest does not parse".to_string())?;
    let interfaces = bloom_lang::stdlib::native_modules();
    let mut out = Vec::new();
    for target in &std_manifest.targets {
        let Some((kotlin, _)) = target.native_sources() else { continue };
        let module = interfaces
            .iter()
            .find(|m| m.name == target.name)
            .ok_or_else(|| format!("the standard library declares no `extern native \"{}\"`", target.name))?;
        out.push(NativeModule { module: module.clone(), kotlin: std_dir.parent().unwrap_or(&std_dir).join(kotlin) });
    }
    for (index, target) in package.manifest.targets.iter().enumerate() {
        let Some((kotlin, _)) = target.native_sources() else { continue };
        let mut found = None;
        for file in package.files(index) {
            let source = std::fs::read_to_string(&file).map_err(|e| format!("{}: {e}", file.display()))?;
            for module in bloom_lang::native::modules(&source)? {
                // The bridge and the spec sit beside the interface, where its import finds them.
                let dir = file.parent().unwrap_or(&package.root);
                write(&dir.join(bloom_lang::native::spec_file(&module.name)), &bloom_lang::native::spec(&module))?;
                write(&dir.join(bloom_lang::native::bridge_file(&module.name)), &bloom_lang::native::bridge(&module))?;
                if module.name == target.name {
                    found = Some(module);
                }
            }
        }
        let module = found.ok_or_else(|| {
            format!(
                "the native target `{0}` has no interface: declare `extern native \"{0}\" {{ … }}` in {1}/",
                target.name,
                target.dir().display()
            )
        })?;
        out.push(NativeModule { module, kotlin: package.root.join(kotlin) });
    }
    Ok(out)
}

/// The Kotlin package of a module's sources (their `package` line).
fn kotlin_package(dir: &Path) -> Option<String> {
    let mut stack = vec![dir.to_path_buf()];
    while let Some(dir) = stack.pop() {
        for entry in std::fs::read_dir(&dir).ok()?.flatten() {
            let path = entry.path();
            if path.is_dir() {
                stack.push(path);
            } else if path.extension().is_some_and(|e| e == "kt") {
                let text = std::fs::read_to_string(&path).ok()?;
                if let Some(line) = text.lines().find_map(|l| l.trim().strip_prefix("package ")) {
                    return Some(line.trim().to_string());
                }
            }
        }
    }
    None
}

/// Writes a native module's Gradle library under `.bloom/build/native/<Name>/` and returns
/// it as a library to link.
fn write_native_library(build: &Path, native: &NativeModule) -> Result<autolink::Library, String> {
    let name = &native.module.name;
    let root = build.join("native").join(name);
    let java_package = kotlin_package(&native.kotlin)
        .ok_or_else(|| format!("{}: no Kotlin sources for the native module `{name}`", native.kotlin.display()))?;
    write(
        &root.join("package.json"),
        &json::write(&json::object([
            ("name", Value::String(format!("bloom-native-{}", name.to_lowercase()))),
            ("version", Value::String("1.0.0".into())),
            ("private", Value::Bool(true)),
            (
                "codegenConfig",
                json::object([
                    ("name", Value::String(name.clone())),
                    ("type", Value::String("modules".into())),
                    ("jsSrcsDir", Value::String("js".into())),
                    ("android", json::object([("javaPackageName", Value::String(java_package.clone()))])),
                ]),
            ),
        ])),
    )?;
    write(&root.join("js").join(bloom_lang::native::spec_file(name)), &bloom_lang::native::spec(&native.module))?;
    let android = root.join("android");
    write(
        &android.join("build.gradle"),
        &format!(
            r#"// Generated by bloom: the native module `{name}` (its Bloom interface is `extern native "{name}"`).
apply plugin: "com.android.library"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

android {{
  namespace "{java_package}"
  compileSdk rootProject.ext.compileSdkVersion
  defaultConfig {{
    minSdkVersion rootProject.ext.minSdkVersion
  }}
  sourceSets {{
    main {{
      java.srcDirs += [{kotlin}]
    }}
  }}
}}

// React Native's codegen writes the spec class the Kotlin module extends (and its JNI glue)
// from the TurboModule spec bloom generated from the Bloom interface.
react {{
  jsRootDir = file("../js")
  libraryName = "{name}"
  codegenJavaPackageName = "{java_package}"
}}

dependencies {{
  implementation("com.facebook.react:react-android")
}}
"#,
            kotlin = quote(&native.kotlin.to_string_lossy()),
        ),
    )?;
    write(
        &android.join("src/main/AndroidManifest.xml"),
        "<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\" />\n",
    )?;
    Ok(autolink::Library {
        name: format!("bloom-native-{}", name.to_lowercase()),
        root: root.clone(),
        source_dir: android.clone(),
        import: format!("import {java_package}.{name}Package;"),
        instance: format!("new {name}Package()"),
        library_name: Some(name.clone()),
        component_descriptors: Vec::new(),
        cmake_lists: android.join("build/generated/source/codegen/jni/CMakeLists.txt"),
    })
}

// ---- the Gradle project --------------------------------------------------------

fn slug(name: &str) -> String {
    name.chars().map(|c| if c.is_ascii_alphanumeric() { c.to_ascii_lowercase() } else { '-' }).collect()
}

fn app_id(package: &Package) -> String {
    package.manifest.app.id.clone().unwrap_or_else(|| application_id(package))
}

fn display_name(package: &Package) -> String {
    package.manifest.app.display_name.clone().unwrap_or_else(|| package.manifest.name.clone())
}

fn version(package: &Package) -> String {
    package.manifest.app.version.clone().unwrap_or_else(|| "1.0.0".into())
}

fn schemes(package: &Package) -> Vec<String> {
    if package.manifest.app.schemes.is_empty() {
        vec![slug(&package.manifest.name)]
    } else {
        package.manifest.app.schemes.clone()
    }
}

fn xml(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;").replace('\'', "\\'")
}

/// React Native's own version catalog: the SDK, NDK and build tools it is built with.
fn versions(build: &Path) -> BTreeMap<String, String> {
    let text = std::fs::read_to_string(build.join("node_modules/react-native/gradle/libs.versions.toml"))
        .unwrap_or_default();
    let mut out = BTreeMap::new();
    let mut in_versions = false;
    for line in text.lines() {
        let line = line.trim();
        if line.starts_with('[') {
            in_versions = line == "[versions]";
            continue;
        }
        if in_versions && let Some((k, v)) = line.split_once('=') {
            out.insert(k.trim().to_string(), v.trim().trim_matches('"').to_string());
        }
    }
    out
}

/// The signing keystore: `$BLOOM_ANDROID_KEYSTORE` (with `…_PASSWORD`, `…_ALIAS`), else one
/// per app under `~/.bloom/keystores/`, created on first use. Never in the package, so never
/// committed; a release key that is lost cannot update the app, so it is kept outside
/// `.bloom/` (which is regenerated).
struct Signing {
    store: PathBuf,
    password: String,
    alias: String,
}

fn keystores() -> PathBuf {
    std::env::var_os("BLOOM_KEYSTORES").map(PathBuf::from).unwrap_or_else(|| {
        PathBuf::from(std::env::var_os("HOME").unwrap_or_default()).join(".bloom/keystores")
    })
}

fn keytool(store: &Path, alias: &str, password: &str, dname: &str) -> Result<(), String> {
    std::fs::create_dir_all(store.parent().unwrap_or(Path::new("."))).map_err(|e| e.to_string())?;
    let status = Command::new("keytool")
        .args(["-genkeypair", "-noprompt", "-keystore"])
        .arg(store)
        .args(["-storetype", "PKCS12", "-alias", alias, "-keyalg", "RSA", "-keysize", "2048", "-validity", "10000"])
        .args(["-storepass", password, "-keypass", password, "-dname", dname])
        .status()
        .map_err(|e| format!("keytool: {e}"))?;
    if status.success() { Ok(()) } else { Err(format!("keytool failed ({status})")) }
}

fn signing(package: &Package, release: bool) -> Result<Signing, String> {
    if release && let Some(store) = std::env::var_os("BLOOM_ANDROID_KEYSTORE") {
        return Ok(Signing {
            store: PathBuf::from(store),
            password: std::env::var("BLOOM_ANDROID_KEYSTORE_PASSWORD")
                .map_err(|_| "BLOOM_ANDROID_KEYSTORE needs BLOOM_ANDROID_KEYSTORE_PASSWORD")?,
            alias: std::env::var("BLOOM_ANDROID_KEY_ALIAS").unwrap_or_else(|_| "upload".into()),
        });
    }
    let dir = keystores();
    if !release {
        let store = dir.join("debug.keystore");
        if !store.is_file() {
            keytool(&store, "androiddebugkey", "android", "CN=Android Debug,O=Android,C=US")?;
        }
        return Ok(Signing { store, password: "android".into(), alias: "androiddebugkey".into() });
    }
    let id = app_id(package);
    let store = dir.join(format!("{id}.keystore"));
    let secret = dir.join(format!("{id}.password"));
    if !store.is_file() {
        // A random password, readable only by the owner.
        let mut bytes = [0u8; 18];
        std::fs::File::open("/dev/urandom")
            .and_then(|mut f| std::io::Read::read_exact(&mut f, &mut bytes))
            .map_err(|e| format!("/dev/urandom: {e}"))?;
        let password: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
        keytool(&store, "upload", &password, &format!("CN={},O=Bloom", display_name(package)))?;
        std::fs::write(&secret, &password).map_err(|e| format!("{}: {e}", secret.display()))?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            for path in [&store, &secret] {
                let _ = std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600));
            }
        }
        println!("bloom: created the release key {} (keep it: updates are signed with it)", store.display());
    }
    let password = std::fs::read_to_string(&secret).map_err(|e| format!("{}: {e}", secret.display()))?;
    Ok(Signing { store, password: password.trim().to_string(), alias: "upload".into() })
}

/// The launcher icon: the package's PNG, else Bloom's (an adaptive vector).
fn write_icon(package: &Package, res: &Path) -> Result<(), String> {
    if let Some(icon) = &package.manifest.app.icon {
        let from = package.root.join(icon);
        let to = res.join("mipmap-xxxhdpi/ic_launcher.png");
        std::fs::create_dir_all(to.parent().unwrap_or(res)).map_err(|e| e.to_string())?;
        std::fs::copy(&from, &to).map_err(|e| format!("the app icon {}: {e}", from.display()))?;
        return Ok(());
    }
    write(
        &res.join("mipmap-anydpi-v26/ic_launcher.xml"),
        "<adaptive-icon xmlns:android=\"http://schemas.android.com/apk/res/android\">\n  <background android:drawable=\"@color/ic_launcher_background\" />\n  <foreground android:drawable=\"@drawable/ic_launcher_foreground\" />\n</adaptive-icon>\n",
    )?;
    write(
        &res.join("drawable/ic_launcher_foreground.xml"),
        "<vector xmlns:android=\"http://schemas.android.com/apk/res/android\" android:width=\"108dp\" android:height=\"108dp\" android:viewportWidth=\"108\" android:viewportHeight=\"108\">\n  <path android:fillColor=\"#FFFFFF\" android:pathData=\"M54,30a12,12 0,0 1,12 12a12,12 0,0 1,12 12a12,12 0,0 1,-12 12a12,12 0,0 1,-12 12a12,12 0,0 1,-12 -12a12,12 0,0 1,-12 -12a12,12 0,0 1,12 -12a12,12 0,0 1,12 -12z\" />\n</vector>\n",
    )
}

/// Bloom's fonts in the APK's assets (`assets/fonts/<family>.ttf`, which React Native finds
/// by family name), from Bloom's own font table.
fn write_fonts(build: &Path, assets: &Path) -> Result<(), String> {
    let fonts = build.join("node_modules/@oxy.so/bloom/lib/commonjs/fonts");
    let (Ok(table), Ok(faces)) = (
        std::fs::read_to_string(fonts.join("font-assets.native.js")),
        std::fs::read_to_string(fonts.join("display-face.js")),
    ) else {
        return Ok(());
    };
    let face = |key: &str| {
        faces.split("DISPLAY_FACE_FAMILIES = {").nth(1).and_then(|rest| {
            rest.split('}').next()?.lines().find_map(|l| {
                let (k, v) = l.split_once(':')?;
                (k.trim() == key).then(|| v.trim().trim_end_matches(',').trim_matches('\'').to_string())
            })
        })
    };
    for line in table.lines() {
        let Some((key, value)) = line.split_once(": require('./") else { continue };
        let file = value.split('\'').next().unwrap_or_default();
        let key = key.trim();
        let family = if let Some(inner) = key.strip_prefix("[_displayFace.DISPLAY_FACE_FAMILIES.") {
            face(inner.trim_end_matches(']'))
        } else {
            Some(key.trim_matches('\'').to_string())
        };
        if let Some(family) = family {
            let to = assets.join("fonts").join(format!("{family}.ttf"));
            std::fs::create_dir_all(to.parent().unwrap_or(assets)).map_err(|e| e.to_string())?;
            std::fs::copy(fonts.join(file), &to).map_err(|e| format!("{file}: {e}"))?;
        }
    }
    Ok(())
}

/// Writes `.bloom/build/android/`.
fn write_gradle(package: &Package, libraries: &[autolink::Library], release: bool) -> Result<(), String> {
    let build = package.build_dir();
    let android = build.join("android");
    let header = "// Generated by bloom from Package.bloom: regenerated on every build, never edited.\n";
    let modules = build.join("node_modules");
    let gradle_plugin = modules.join("@react-native/gradle-plugin");
    if !gradle_plugin.is_dir() {
        return Err("React Native's Gradle plugin is not installed (node_modules/@react-native/gradle-plugin)".into());
    }
    let v = versions(&build);
    let get = |k: &str, d: &str| v.get(k).cloned().unwrap_or_else(|| d.to_string());
    let min_sdk = package
        .manifest
        .platforms
        .iter()
        .find_map(|p| if let Platform::Android(v) = p { Some(*v) } else { None })
        .unwrap_or(26)
        .max(get("minSdk", "24").parse().unwrap_or(24));
    let id = app_id(package);

    // Gradle itself: React Native's Gradle plugin's own wrapper.
    for file in ["gradlew", "gradlew.bat", "gradle/wrapper/gradle-wrapper.jar", "gradle/wrapper/gradle-wrapper.properties"] {
        let to = android.join(file);
        std::fs::create_dir_all(to.parent().unwrap_or(&android)).map_err(|e| e.to_string())?;
        std::fs::copy(gradle_plugin.join(file), &to).map_err(|e| format!("{file}: {e}"))?;
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(android.join("gradlew"), std::fs::Permissions::from_mode(0o755));
    }
    if let Some(sdk) = std::env::var_os("ANDROID_HOME").or_else(|| std::env::var_os("ANDROID_SDK_ROOT")).or_else(|| {
        let home = PathBuf::from(std::env::var_os("HOME")?).join("Android/Sdk");
        home.is_dir().then(|| home.into_os_string())
    }) {
        write(&android.join("local.properties"), &format!("sdk.dir={}\n", Path::new(&sdk).display()))?;
    }

    write(&build.join("autolinking.json"), &autolink::config_json(&build, &id, libraries))?;
    write(
        &android.join("settings.gradle"),
        &format!(
            "{header}pluginManagement {{\n  includeBuild({plugin})\n}}\n\nplugins {{\n  id(\"com.facebook.react.settings\")\n}}\n\n// The libraries bloom links (autolinking.json): the app's React Native libraries and its\n// Bloom native modules. No Expo module.\nextensions.configure(com.facebook.react.ReactSettingsExtension) {{ ex ->\n  ex.autolinkLibrariesFromConfigFile(new File(rootDir, \"../autolinking.json\"))\n}}\n\nrootProject.name = {name}\ninclude ':app'\nincludeBuild({plugin})\n",
            plugin = quote(&gradle_plugin.to_string_lossy()),
            name = quote(&package.manifest.name),
        ),
    )?;
    write(
        &android.join("build.gradle"),
        &format!(
            "{header}buildscript {{\n  ext {{\n    buildToolsVersion = {bt}\n    minSdkVersion = {min_sdk}\n    compileSdkVersion = {csdk}\n    targetSdkVersion = {tsdk}\n    ndkVersion = {ndk}\n    kotlinVersion = {kotlin}\n  }}\n  repositories {{\n    google()\n    mavenCentral()\n  }}\n  dependencies {{\n    classpath('com.android.tools.build:gradle')\n    classpath('com.facebook.react:react-native-gradle-plugin')\n    classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')\n  }}\n}}\n\nallprojects {{\n  repositories {{\n    google()\n    mavenCentral()\n  }}\n}}\n\napply plugin: \"com.facebook.react.rootproject\"\n",
            bt = quote(&get("buildTools", "36.0.0")),
            csdk = get("compileSdk", "36"),
            tsdk = get("targetSdk", "36"),
            ndk = quote(&get("ndkVersion", "27.1.12297006")),
            kotlin = quote(&get("kotlin", "2.2.0")),
        ),
    )?;
    let abis = std::env::var("BLOOM_ANDROID_ABIS").unwrap_or_else(|_| "x86_64".into());
    write(
        &android.join("gradle.properties"),
        &format!(
            "# Generated by bloom from Package.bloom.\norg.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=768m\norg.gradle.parallel=true\nandroid.useAndroidX=true\nreactNativeArchitectures={abis}\nnewArchEnabled=true\nhermesEnabled=true\nedgeToEdgeEnabled=true\nandroid.builtInKotlin=false\nandroid.newDsl=false\n"
        ),
    )?;
    let hermes = modules.join("hermes-compiler/hermesc/%OS-BIN%/hermesc");
    let debug = signing(package, false)?;
    let release_signing = if release { Some(signing(package, true)?) } else { None };
    let signing_block = |name: &str, s: &Signing| {
        format!(
            "    {name} {{\n      storeFile file({})\n      storePassword {}\n      keyAlias {}\n      keyPassword {}\n    }}\n",
            quote(&s.store.to_string_lossy()),
            quote(&s.password),
            quote(&s.alias),
            quote(&s.password)
        )
    };
    let mut signing_configs = signing_block("debug", &debug);
    if let Some(s) = &release_signing {
        signing_configs.push_str(&signing_block("release", s));
    }
    let release_config = if release_signing.is_some() { "release" } else { "debug" };
    let build_number = package.manifest.app.build.unwrap_or(1);
    write(
        &android.join("app/build.gradle"),
        &format!(
            r#"{header}apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

react {{
  root = file("../..")
  reactNativeDir = file("../../node_modules/react-native")
  codegenDir = file("../../node_modules/@react-native/codegen")
  entryFile = file("../../index.js")
  // Metro, as bloom drives it.
  cliFile = file("../../bloom-metro.js")
  bundleCommand = "bundle"
  hermesCommand = {hermes}
  autolinkLibrariesWithApp()
}}

android {{
  ndkVersion rootProject.ext.ndkVersion
  buildToolsVersion rootProject.ext.buildToolsVersion
  compileSdk rootProject.ext.compileSdkVersion
  namespace {id}
  defaultConfig {{
    applicationId {id}
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode {build_number}
    versionName {version}
  }}
  signingConfigs {{
{signing_configs}  }}
  buildTypes {{
    debug {{
      signingConfig signingConfigs.debug
    }}
    release {{
      signingConfig signingConfigs.{release_config}
      minifyEnabled true
      shrinkResources false
      proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
    }}
  }}
  packagingOptions {{
    jniLibs {{
      useLegacyPackaging false
    }}
  }}
}}

dependencies {{
  implementation("com.facebook.react:react-android")
  implementation("com.facebook.react:hermes-android")
}}
"#,
            hermes = quote(&hermes.to_string_lossy()),
            id = quote(&id),
            version = quote(&version(package)),
        ),
    )?;
    write(&android.join("app/proguard-rules.pro"), "# Generated by bloom. React Native's own rules come with its AAR.\n")?;
    let kotlin_dir = android.join("app/src/main/java").join(id.replace('.', "/"));
    write(
        &kotlin_dir.join("MainApplication.kt"),
        &format!(
            "{header}package {id}\n\nimport android.app.Application\nimport com.facebook.react.PackageList\nimport com.facebook.react.ReactApplication\nimport com.facebook.react.ReactHost\nimport com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative\nimport com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost\n\nclass MainApplication : Application(), ReactApplication {{\n  override val reactHost: ReactHost by lazy {{\n    getDefaultReactHost(context = applicationContext, packageList = PackageList(this).packages)\n  }}\n\n  override fun onCreate() {{\n    super.onCreate()\n    loadReactNative(this)\n  }}\n}}\n"
        ),
    )?;
    write(
        &kotlin_dir.join("MainActivity.kt"),
        &format!(
            "{header}package {id}\n\nimport android.os.Bundle\nimport com.facebook.react.ReactActivity\nimport com.facebook.react.ReactActivityDelegate\nimport com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled\nimport com.facebook.react.defaults.DefaultReactActivityDelegate\n\nclass MainActivity : ReactActivity() {{\n  override fun onCreate(savedInstanceState: Bundle?) {{\n    // The app's theme replaces the launch theme (the splash) with the first frame. A saved\n    // state is not restored: react-native-screens rebuilds its fragments from JS.\n    setTheme(R.style.AppTheme)\n    super.onCreate(null)\n  }}\n\n  override fun getMainComponentName(): String = \"main\"\n\n  override fun createReactActivityDelegate(): ReactActivityDelegate =\n    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)\n}}\n"
        ),
    )?;
    let mut permissions = vec!["android.permission.INTERNET".to_string()];
    for p in &package.manifest.app.permissions {
        for name in p.android() {
            if !permissions.contains(&name) {
                permissions.push(name);
            }
        }
    }
    let uses: String =
        permissions.iter().map(|p| format!("  <uses-permission android:name=\"{}\" />\n", xml(p))).collect();
    let deep_links: String = schemes(package)
        .iter()
        .map(|s| {
            format!(
                "      <intent-filter>\n        <action android:name=\"android.intent.action.VIEW\" />\n        <category android:name=\"android.intent.category.DEFAULT\" />\n        <category android:name=\"android.intent.category.BROWSABLE\" />\n        <data android:scheme=\"{}\" />\n      </intent-filter>\n",
                xml(s)
            )
        })
        .collect();
    let round = if package.manifest.app.icon.is_some() { "" } else { " android:roundIcon=\"@mipmap/ic_launcher\"" };
    write(
        &android.join("app/src/main/AndroidManifest.xml"),
        &format!(
            "<!-- Generated by bloom from Package.bloom: regenerated on every build, never edited. -->\n<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\">\n{uses}  <application android:name=\".MainApplication\" android:label=\"@string/app_name\" android:icon=\"@mipmap/ic_launcher\"{round} android:allowBackup=\"false\" android:theme=\"@style/AppTheme\" android:supportsRtl=\"true\" android:enableOnBackInvokedCallback=\"true\">\n    <activity android:name=\".MainActivity\" android:configChanges=\"keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode|smallestScreenSize\" android:launchMode=\"singleTask\" android:windowSoftInputMode=\"adjustResize\" android:theme=\"@style/LaunchTheme\" android:exported=\"true\">\n      <intent-filter>\n        <action android:name=\"android.intent.action.MAIN\" />\n        <category android:name=\"android.intent.category.LAUNCHER\" />\n      </intent-filter>\n{deep_links}    </activity>\n  </application>\n</manifest>\n"
        ),
    )?;
    write(
        &android.join("app/src/debug/AndroidManifest.xml"),
        "<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\" xmlns:tools=\"http://schemas.android.com/tools\">\n  <!-- Metro's dev server over adb reverse. -->\n  <application android:usesCleartextTraffic=\"true\" tools:replace=\"android:usesCleartextTraffic\" />\n</manifest>\n",
    )?;
    let res = android.join("app/src/main/res");
    let splash = package.manifest.app.splash.clone().unwrap_or_else(|| "#FFFFFF".into());
    write(
        &res.join("values/strings.xml"),
        &format!("<resources>\n  <string name=\"app_name\">{}</string>\n</resources>\n", xml(&display_name(package))),
    )?;
    write(
        &res.join("values/colors.xml"),
        &format!(
            "<resources>\n  <color name=\"splash_background\">{splash}</color>\n  <color name=\"ic_launcher_background\">#0B57D0</color>\n</resources>\n"
        ),
    )?;
    let splash_image = match &package.manifest.app.splash_image {
        Some(image) => {
            let to = res.join("drawable-xxhdpi/splash_image.png");
            std::fs::create_dir_all(to.parent().unwrap_or(&res)).map_err(|e| e.to_string())?;
            std::fs::copy(package.root.join(image), &to).map_err(|e| format!("the splash image {image}: {e}"))?;
            "  <item><bitmap android:gravity=\"center\" android:src=\"@drawable/splash_image\" /></item>\n"
        }
        None => "",
    };
    write(
        &res.join("drawable/launch_background.xml"),
        &format!(
            "<layer-list xmlns:android=\"http://schemas.android.com/apk/res/android\">\n  <item android:drawable=\"@color/splash_background\" />\n{splash_image}</layer-list>\n"
        ),
    )?;
    write(
        &res.join("values/styles.xml"),
        "<resources>\n  <style name=\"AppTheme\" parent=\"Theme.AppCompat.DayNight.NoActionBar\">\n    <item name=\"android:statusBarColor\">@android:color/transparent</item>\n    <item name=\"android:navigationBarColor\">@android:color/transparent</item>\n    <item name=\"android:windowBackground\">@color/splash_background</item>\n  </style>\n  <!-- The launch theme: the splash, until the app's theme takes over. -->\n  <style name=\"LaunchTheme\" parent=\"AppTheme\">\n    <item name=\"android:windowBackground\">@drawable/launch_background</item>\n  </style>\n</resources>\n",
    )?;
    write_icon(package, &res)?;
    write_fonts(&build, &android.join("app/src/main/assets"))?;
    write(&android.join(".gitignore"), "*\n")?;
    Ok(())
}

// ---- driving it ----------------------------------------------------------------

/// Everything up to Gradle: check, the JS layer, the install, the Gradle project.
fn prepare(package: &Package, mode: &Mode) -> Result<bool, String> {
    let options = CheckOptions { jobs: mode.jobs, tsc: false, allow_ts_imports: mode.allow_ts_imports };
    if !check_modules(package, &options, false)?.ok {
        return Ok(false);
    }
    crate::expo::generate_for(package, true)?;
    crate::deps::install(package)?;
    let build = package.build_dir();
    let natives = native_modules(package)?;
    let mut libraries = autolink::libraries(&build)?;
    for native in &natives {
        libraries.push(write_native_library(&build, native)?);
    }
    write_gradle(package, &libraries, mode.release)?;
    Ok(true)
}

/// `bloom build android`: the APK, in `.bloom/dist/android/<Name>.apk`. A debug build loads
/// its JS from Metro (`bloom run android`); a release build embeds the Hermes bytecode.
pub fn build(package: &Package, mode: &Mode) -> Result<Option<PathBuf>, String> {
    if !prepare(package, mode)? {
        return Ok(None);
    }
    let android = package.build_dir().join("android");
    let variant = if mode.release { "Release" } else { "Debug" };
    let abis = std::env::var("BLOOM_ANDROID_ABIS").unwrap_or_else(|_| "x86_64".into());
    run_in(&android, "./gradlew", &[&format!("assemble{variant}"), &format!("-PreactNativeArchitectures={abis}")])?;
    let lower = variant.to_lowercase();
    let built = android.join(format!("app/build/outputs/apk/{lower}/app-{lower}.apk"));
    let suffix = if mode.release { "" } else { "-debug" };
    let apk = package.dot().join("dist/android").join(format!("{}{suffix}.apk", package.manifest.name));
    std::fs::create_dir_all(apk.parent().unwrap_or(Path::new("."))).map_err(|e| e.to_string())?;
    std::fs::copy(&built, &apk).map_err(|e| format!("{}: {e}", built.display()))?;
    println!("bloom: Android build in {}", shown_rel(package, &apk));
    Ok(Some(apk))
}

/// `bloom run android`: build, install and start on the emulator; a debug build with Metro.
pub fn run(package: &Package, mode: &Mode) -> Result<bool, String> {
    let Some(apk) = build(package, mode)? else { return Ok(false) };
    let serial = crate::expo::device(mode)?;
    let build_dir = package.build_dir();
    run_in(&build_dir, "adb", &["-s", &serial, "install", "-r", &apk.to_string_lossy()])?;
    if !mode.release {
        run_in(&build_dir, "adb", &["-s", &serial, "reverse", "tcp:8081", "tcp:8081"])?;
    }
    let id = app_id(package);
    run_in(&build_dir, "adb", &["-s", &serial, "shell", "am", "start", "-n", &format!("{id}/.MainActivity")])?;
    println!("bloom: started {id} on {serial}");
    if !mode.release {
        run_in(&build_dir, "node", &["bloom-metro.js", "start"])?;
    }
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn package(name: &str, manifest: &str, files: &[(&str, &str)]) -> Package {
        let root = std::env::temp_dir().join(format!("bloom-android-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        for (path, text) in files {
            let path = root.join(path);
            std::fs::create_dir_all(path.parent().unwrap()).unwrap();
            std::fs::write(path, text).unwrap();
        }
        let source = manifest.to_string();
        Package { root, manifest: bloom_lang::package::parse(&source, "x").unwrap(), source }
    }

    const APP: &str = "public view App {\n  var body: View {\n    Text(\"hi\")\n  }\n}\n";

    /// A Bloom build's JS layer: React Native's Metro and Babel, the root on React Native's
    /// registry, and the Expo surface answered by Bloom's shims (no Expo runtime).
    #[test]
    fn the_js_layer_has_no_expo_runtime() {
        let package = package(
            "js",
            "let package = Package(name: \"Shop\", platforms: [.android(26)], app: App(schemes: [\"shop\"]), targets: [.app(\"Shop\")])",
            &[("Sources/Shop/App.bloom", APP)],
        );
        crate::expo::generate_for(&package, true).unwrap();
        let build = package.build_dir();
        let read = |p: &str| std::fs::read_to_string(build.join(p)).unwrap();
        let index = read("index.js");
        assert!(index.contains("AppRegistry.registerComponent('main', () => Root);"), "{index}");
        assert!(!index.contains("from 'expo'"), "{index}");
        let metro = read("metro.config.js");
        assert!(metro.contains("require('@react-native/metro-config')"), "{metro}");
        assert!(!metro.contains("expo/metro-config"), "{metro}");
        assert!(metro.contains("\"expo-linking\": \"expo-linking.js\""), "{metro}");
        let babel = read("babel.config.js");
        assert!(babel.contains("module:@react-native/babel-preset") && babel.contains("react-native-worklets/plugin"));
        let config = json::parse(&read("shims/app-config.json")).unwrap();
        assert_eq!(config.get("scheme").as_str(), Some("shop"));
        assert!(read("bloom-metro.js").contains("bundleCommand"));
        let _ = std::fs::remove_dir_all(&package.root);
    }

    #[test]
    fn a_routed_app_gets_its_route_context() {
        let dir = std::env::temp_dir().join(format!("bloom-android-routes-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        for f in ["_layout.js", "(tabs)/index.js", "post/[id].js"] {
            std::fs::create_dir_all(dir.join(f).parent().unwrap()).unwrap();
            std::fs::write(dir.join(f), "").unwrap();
        }
        let entry = routed_entry("", &dir).unwrap();
        assert!(entry.contains("\"./(tabs)/index.js\": require(\"./app/(tabs)/index.js\"),"), "{entry}");
        assert!(entry.contains("\"./post/[id].js\": require(\"./app/post/[id].js\"),"), "{entry}");
        assert!(entry.contains("createElement(ExpoRoot, { context })"), "{entry}");
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// The standard library's storage module is linked: its Kotlin sources, its codegen
    /// spec (from the Bloom interface) and its package for the app's package list.
    #[test]
    fn the_storage_module_is_a_gradle_library() {
        let package = package(
            "native",
            "let package = Package(name: \"Shop\", platforms: [.android(26)], targets: [.app(\"Shop\")])",
            &[("Sources/Shop/App.bloom", APP)],
        );
        let natives = native_modules(&package).unwrap();
        assert_eq!(natives.iter().map(|n| n.module.name.as_str()).collect::<Vec<_>>(), ["BloomStorage"]);
        assert!(natives[0].kotlin.join("so/oxy/bloom/storage/BloomStorageModule.kt").is_file(), "{:?}", natives[0].kotlin);
        let build = package.build_dir();
        let lib = write_native_library(&build, &natives[0]).unwrap();
        assert_eq!(lib.import, "import so.oxy.bloom.storage.BloomStoragePackage;");
        let spec = std::fs::read_to_string(build.join("native/BloomStorage/js/NativeBloomStorage.ts")).unwrap();
        assert!(spec.contains("TurboModuleRegistry.get<Spec>('BloomStorage')"), "{spec}");
        let gradle = std::fs::read_to_string(build.join("native/BloomStorage/android/build.gradle")).unwrap();
        assert!(gradle.contains("codegenJavaPackageName = \"so.oxy.bloom.storage\""), "{gradle}");
        let pkg = json::parse(&std::fs::read_to_string(build.join("native/BloomStorage/package.json")).unwrap()).unwrap();
        assert_eq!(pkg.get("codegenConfig").get("android").get("javaPackageName").as_str(), Some("so.oxy.bloom.storage"));
        let _ = std::fs::remove_dir_all(&package.root);
    }
}
