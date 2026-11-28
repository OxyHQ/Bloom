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
//! bundle). No Expo prebuild, CLI, EAS or Expo module is involved: navigation is the Bloom
//! router (`stdlib/Bloom/router.ts`, see `routed_entry`), and the few Expo imports Bloom's own
//! components still make are answered by small shims (`shims/`). `--with-expo` keeps the Expo
//! path (`crate::expo`) until every module is replaced.

mod autolink;
pub mod hybrid;

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::Command;

use bloom_lang::package::Platform;

use crate::expo::{Mode, application_id, run_in, shown_rel};
use crate::json::{self, Value};
use crate::project::{CheckOptions, Package, check_modules, write};

/// The shims of the Expo surface a Bloom build answers, by file: what Bloom's own components
/// still read (`expo-blur`, `expo-font`, `expo`'s lens check), until their Bloom modules land,
/// and `expo-video`, over the standard library's `BloomVideo`.
const SHIM_FILES: &[(&str, &str)] = &[
    ("expo.js", include_str!("shims/expo.js")),
    ("expo-modules-core.js", include_str!("shims/expo-modules-core.js")),
    ("expo-blur.js", include_str!("shims/expo-blur.js")),
    ("expo-font.js", include_str!("shims/expo-font.js")),
    ("expo-video.js", include_str!("shims/expo-video.js")),
    ("expo-splash-screen.js", include_str!("shims/expo-splash-screen.js")),
    ("url.js", include_str!("shims/url.js")),
];

/// What each shimmed request resolves to on Android and iOS.
const SHIMMED: &[(&str, &str)] = &[
    ("expo", "expo.js"),
    ("expo-modules-core", "expo-modules-core.js"),
    ("expo-blur", "expo-blur.js"),
    ("expo-font", "expo-font.js"),
    ("expo-video", "expo-video.js"),
    ("expo-splash-screen", "expo-splash-screen.js"),
];

/// Expo packages whose JS a Bloom build keeps, over the shims: none since the Bloom router
/// replaced expo-router (phase F step 3). Every `expo*` request that no shim answers does not
/// resolve: an optional `require` falls back, an import fails the build, naming the way out.
const KEPT: &[&str] = &[];

/// React Native's own Metro config and Babel preset: what a Bloom build bundles with
/// (React Native's version, as React Native pins them).
pub fn tools() -> Vec<(String, String)> {
    let rn = crate::expo::RUNTIME.iter().find(|(n, _)| *n == "react-native").map_or("*", |(_, v)| v);
    vec![
        // Bloom's packages ship their TS sources to React Native (`react-native` in their
        // package.json), which write `export * as tokens from …`.
        ("@babel/plugin-transform-export-namespace-from".to_string(), "7.29.7".to_string()),
        // The WHATWG URL a Bloom build installs (`shims/url.js`), as Expo's runtime did.
        ("whatwg-url-minimum".to_string(), "0.2.0".to_string()),
        ("@react-native/babel-preset".to_string(), rn.to_string()),
        ("@react-native/metro-config".to_string(), rn.to_string()),
    ]
}

// ---- the JS layer --------------------------------------------------------------

fn quote(s: &str) -> String {
    json::write(&Value::String(s.to_string()))
}

/// What the entry of an app with a `NavigationStack` is written from.
pub struct RoutedEntry<'a> {
    /// The standard library's directory, from the build directory.
    pub std: &'a str,
    pub entry_name: &'a str,
    pub entry: &'a str,
    pub catalogs: &'a str,
    pub table: &'a crate::navigation::Table,
}

/// The entry of an app with a `NavigationStack`: the Bloom router (`stdlib/Bloom/router.ts`)
/// installed with the app's routes, and the root view (whose `NavigationStack` draws it)
/// under Bloom's provider, registered as `main`. No expo-router, no file routes.
pub fn routed_entry(header: &str, r: &RoutedEntry) -> String {
    let (icons, spec) = crate::navigation::router_spec(r.table);
    let mut imports = String::new();
    for icon in &icons {
        imports.push_str(&format!("import {{ {icon} }} from '@oxy.so/bloom/icons/{icon}';\n"));
    }
    format!(
        "{header}import './shims/url';\nimport {{ createElement }} from 'react';\nimport {{ AppRegistry }} from 'react-native';\nimport {{ GestureHandlerRootView }} from 'react-native-gesture-handler';\nimport {{ SafeAreaProvider }} from 'react-native-safe-area-context';\nimport {{ BloomProvider }} from '@oxy.so/bloom/provider';\nimport {{ toElement }} from '@oxy.so/bloom-language';\n{imports}import {{ registerCatalog }} from '{std}/runtime';\nimport {{ registerNavigation }} from '{std}/routing';\nimport {{ bloomRouter }} from '{std}/router';\nimport {{ {entry_name} }} from '{entry}';\n\n{catalogs}\n// The Bloom router, over the routes of `NavigationStack` (the app's routes enum).\nregisterNavigation(bloomRouter({spec}));\n\n// The app's root view, whose `NavigationStack` draws the router. Each route is a Bloom\n// screen, drawn edge to edge. Bloom's tab bar and sheets take their taps and drags through\n// the gesture handler's root (without it, Android delivers none).\nfunction Root() {{\n  return createElement(\n    GestureHandlerRootView,\n    {{ style: {{ flex: 1 }} }},\n    createElement(SafeAreaProvider, null, createElement(BloomProvider, null, toElement({entry_name}()))),\n  );\n}}\n\nAppRegistry.registerComponent('main', () => Root);\n",
        std = r.std,
        entry_name = r.entry_name,
        entry = r.entry,
        catalogs = r.catalogs,
    )
}

/// Metro and Babel config, the shims and `bloom-metro.js`: a Bloom build's JS layer.
pub fn write_js(package: &Package, header: &str) -> Result<(), String> {
    let build = package.build_dir();
    let shims = build.join("shims");
    for (name, text) in SHIM_FILES {
        write(&shims.join(name), text)?;
    }
    let shimmed: Vec<String> =
        SHIMMED.iter().map(|(n, f)| format!("  {}: {},", quote(n), quote(f))).collect();
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
// package has no native code here, and does not resolve.
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
      // Not resolved: an optional `require` (in a `try`) falls back, and an import fails the build.
      throw new Error(
        `${{name}} is an Expo package, which has no native code in a Bloom build (ADR 0002, section 7): use its Bloom module, or build with --with-expo`,
      );
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
            r#"{header}// React Native's preset, Reanimated's worklets, `export * as` (Bloom's TS sources), and the
// one build-time constant the Expo packages that remain read (`process.env.EXPO_OS`).
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
    plugins: [
      [inlinePlatform, {{ platform }}],
      '@babel/plugin-transform-export-namespace-from',
      'react-native-worklets/plugin',
    ],
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
if (typeof args.maxWorkers === 'string') args.maxWorkers = Number(args.maxWorkers);

/** The release bundle (and its assets), as React Native's own `bundle` command writes it. */
function bundle() {
  const { bundleCommand } = require('@react-native/community-cli-plugin');
  const ctx = {
    root: process.env.BLOOM_METRO_ROOT || __dirname,
    reactNativePath: path.dirname(require.resolve('react-native/package.json')),
    platforms: { android: {}, ios: {} },
  };
  args.dev = args.dev === true;
  // Every Bloom Android build runs Hermes: transform for it (as Expo's CLI does), not for an
  // older engine. Without this the bundle carries the transforms for the 'default' profile.
  if (args.unstableTransformProfile === undefined && args.platform !== 'web') {
    args.unstableTransformProfile = 'hermes-stable';
  }
  return bundleCommand.func([], ctx, args);
}

/** Metro's dev server, with React Native's dev middleware (the debugger's endpoints). */
async function start() {
  const Metro = require('metro');
  const { createDevMiddleware } = require('@react-native/dev-middleware');
  const port = Number(args.port ?? 8081);
  const config = await Metro.loadConfig({
    config: args.config,
    port,
    resetCache: args.resetCache === true,
    maxWorkers: args.maxWorkers,
  });
  const { middleware, websocketEndpoints } = createDevMiddleware({
    serverBaseUrl: `http://localhost:${port}`,
    logger: console,
  });
  // The app asks whether a packager runs here before it loads its bundle from it.
  const status = (req, res, next) => {
    if (req.url !== '/status') return next();
    res.setHeader('X-React-Native-Project-Root', __dirname);
    res.end('packager-status:running');
  };
  await Metro.runServer(config, {
    host: typeof args.host === 'string' ? args.host : undefined,
    unstable_extraMiddleware: [status, middleware],
    websocketEndpoints,
  });
  console.log(`bloom: Metro on http://localhost:${port}`);
}

const commands = { bundle, start };
if (!commands[command]) {
  console.error(`bloom-metro: no command \`${command}\` (bundle, start)`);
  process.exit(2);
}
Promise.resolve(commands[command]()).catch((error) => {
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
        out.push(NativeModule {
            module: module.clone(),
            kotlin: std_dir.parent().unwrap_or(&std_dir).join(kotlin),
        });
    }
    for (index, target) in package.manifest.targets.iter().enumerate() {
        let Some((kotlin, _)) = target.native_sources() else { continue };
        let mut found = None;
        for file in package.files(index) {
            let source = std::fs::read_to_string(&file).map_err(|e| format!("{}: {e}", file.display()))?;
            for module in bloom_lang::native::modules(&source)? {
                // The bridge and the spec sit beside the interface, where its import finds them.
                let dir = file.parent().unwrap_or(&package.root);
                for (file, text) in module.generated() {
                    write(&dir.join(file), &text)?;
                }
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
    let java_package = kotlin_package(&native.kotlin).ok_or_else(|| {
        format!("{}: no Kotlin sources for the native module `{name}`", native.kotlin.display())
    })?;
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
                    ("type", Value::String(native.module.codegen_type().into())),
                    ("jsSrcsDir", Value::String("js".into())),
                    ("android", json::object([("javaPackageName", Value::String(java_package.clone()))])),
                ]),
            ),
        ])),
    )?;
    for (file, text) in native.module.specs() {
        write(&root.join("js").join(file), &text)?;
    }
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
{extra}}}
"#,
            kotlin = quote(&native.kotlin.to_string_lossy()),
            extra = native_dependencies(&native.kotlin)?,
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
        component_descriptors: native.module.component_descriptors(),
        cmake_lists: android.join("build/generated/source/codegen/jni/CMakeLists.txt"),
    })
}

/// The libraries a native module links besides React Native: its `android/dependencies.gradle`
/// (Gradle `dependencies { }` lines, such as `implementation("androidx.media3:…")`), when it
/// has one, indented into the module's `dependencies` block.
fn native_dependencies(android: &Path) -> Result<String, String> {
    let file = android.join("dependencies.gradle");
    if !file.is_file() {
        return Ok(String::new());
    }
    let text = std::fs::read_to_string(&file).map_err(|e| format!("{}: {e}", file.display()))?;
    Ok(text
        .lines()
        .map(|line| if line.is_empty() { "\n".to_string() } else { format!("  {line}\n") })
        .collect())
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
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "\\'")
}

/// React Native's own version catalog: the SDK, NDK and build tools it is built with.
fn versions(react_native: &Path) -> BTreeMap<String, String> {
    let text = std::fs::read_to_string(react_native.join("gradle/libs.versions.toml")).unwrap_or_default();
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
    /// The password as Gradle reads it (a Groovy expression): from the environment or the
    /// owner-only file beside the keystore, so it is never written into the generated project.
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
        .args([
            "-storetype",
            "PKCS12",
            "-alias",
            alias,
            "-keyalg",
            "RSA",
            "-keysize",
            "2048",
            "-validity",
            "10000",
        ])
        .args(["-storepass", password, "-keypass", password, "-dname", dname])
        .status()
        .map_err(|e| format!("keytool: {e}"))?;
    if status.success() { Ok(()) } else { Err(format!("keytool failed ({status})")) }
}

fn signing(package: &Package, release: bool) -> Result<Signing, String> {
    if release && let Some(store) = std::env::var_os("BLOOM_ANDROID_KEYSTORE") {
        return Ok(Signing {
            store: PathBuf::from(store),
            password: {
                std::env::var("BLOOM_ANDROID_KEYSTORE_PASSWORD")
                    .map_err(|_| "BLOOM_ANDROID_KEYSTORE needs BLOOM_ANDROID_KEYSTORE_PASSWORD")?;
                "System.getenv(\"BLOOM_ANDROID_KEYSTORE_PASSWORD\")".into()
            },
            alias: std::env::var("BLOOM_ANDROID_KEY_ALIAS").unwrap_or_else(|_| "upload".into()),
        });
    }
    let dir = keystores();
    if !release {
        let store = dir.join("debug.keystore");
        if !store.is_file() {
            keytool(&store, "androiddebugkey", "android", "CN=Android Debug,O=Android,C=US")?;
        }
        return Ok(Signing { store, password: quote("android"), alias: "androiddebugkey".into() });
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
    if !secret.is_file() {
        return Err(format!("{}: the release key's password is missing", secret.display()));
    }
    let password = format!("new File({}).text.trim()", quote(&secret.to_string_lossy()));
    Ok(Signing { store, password, alias: "upload".into() })
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
fn write_fonts(bloom: Option<PathBuf>, assets: &Path) -> Result<(), String> {
    let Some(bloom) = bloom else { return Ok(()) };
    let fonts = bloom.join("lib/commonjs/fonts");
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
/// A package React Native depends on: under its own `node_modules`, else where the app's resolve.
fn react_native_dependency(layout: &hybrid::Layout, react_native: &Path, name: &str) -> Option<PathBuf> {
    Some(react_native.join("node_modules").join(name))
        .filter(|d| d.join("package.json").is_file())
        .or_else(|| layout.resolve(name))
}

/// What the Gradle project is written from besides the package.
struct GradleInputs<'a> {
    layout: &'a hybrid::Layout,
    libraries: &'a [autolink::Library],
    release: bool,
    /// The stopgaps of a hybrid build, linked through Expo's autolinking.
    expo: Option<&'a hybrid::ExpoLink>,
    overrides: &'a hybrid::Overrides,
}

fn write_gradle(package: &Package, inputs: &GradleInputs) -> Result<(), String> {
    let (layout, libraries, release) = (inputs.layout, inputs.libraries, inputs.release);
    let build = package.build_dir();
    let android = build.join("android");
    let header = "// Generated by bloom from Package.bloom: regenerated on every build, never edited.\n";
    let react_native = layout.require("react-native")?;
    let gradle_plugin = react_native_dependency(layout, &react_native, "@react-native/gradle-plugin")
        .ok_or("React Native's Gradle plugin is not installed (node_modules/@react-native/gradle-plugin)")?;
    let codegen = react_native_dependency(layout, &react_native, "@react-native/codegen")
        .unwrap_or_else(|| react_native.join("../@react-native/codegen"));
    let hermes_compiler = react_native_dependency(layout, &react_native, "hermes-compiler")
        .unwrap_or_else(|| react_native.join("../hermes-compiler"));
    let v = versions(&react_native);
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
    for file in [
        "gradlew",
        "gradlew.bat",
        "gradle/wrapper/gradle-wrapper.jar",
        "gradle/wrapper/gradle-wrapper.properties",
    ] {
        let to = android.join(file);
        std::fs::create_dir_all(to.parent().unwrap_or(&android)).map_err(|e| e.to_string())?;
        std::fs::copy(gradle_plugin.join(file), &to).map_err(|e| format!("{file}: {e}"))?;
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(android.join("gradlew"), std::fs::Permissions::from_mode(0o755));
    }
    if let Some(sdk) =
        std::env::var_os("ANDROID_HOME").or_else(|| std::env::var_os("ANDROID_SDK_ROOT")).or_else(|| {
            let home = PathBuf::from(std::env::var_os("HOME")?).join("Android/Sdk");
            home.is_dir().then(|| home.into_os_string())
        })
    {
        write(&android.join("local.properties"), &format!("sdk.dir={}\n", Path::new(&sdk).display()))?;
    }

    write(&build.join("autolinking.json"), &autolink::config_json(&build, &react_native, &id, libraries))?;
    let expo_management = inputs.expo.map(hybrid::settings_plugin_management).unwrap_or_default();
    let expo_plugin = if inputs.expo.is_some() { "  id(\"expo-autolinking-settings\")\n" } else { "" };
    let expo_body = inputs.expo.map(hybrid::settings_body).unwrap_or_default();
    let what = if inputs.expo.is_some() {
        "Bloom native modules, beside the stopgaps below."
    } else {
        "Bloom native modules. No Expo module."
    };
    // `reactNativeFromSource: true`: React Native's Android libraries built from the installed
    // `react-native` (its patches included), as React Native documents building from source.
    let from_source = if package.manifest.app.react_native_from_source {
        format!(
            "\n// React Native from source (App(reactNativeFromSource: true)).\nincludeBuild({rn}) {{\n  dependencySubstitution {{\n    substitute(module(\"com.facebook.react:react-android\")).using(project(\":packages:react-native:ReactAndroid\"))\n    substitute(module(\"com.facebook.react:react-native\")).using(project(\":packages:react-native:ReactAndroid\"))\n    substitute(module(\"com.facebook.react:hermes-android\")).using(project(\":packages:react-native:ReactAndroid:hermes-engine\"))\n    substitute(module(\"com.facebook.react:hermes-engine\")).using(project(\":packages:react-native:ReactAndroid:hermes-engine\"))\n  }}\n}}\n",
            rn = quote(&react_native.to_string_lossy())
        )
    } else {
        String::new()
    };
    write(
        &android.join("settings.gradle"),
        &format!(
            "{header}pluginManagement {{\n  includeBuild({plugin})\n{expo_management}}}\n\nplugins {{\n  id(\"com.facebook.react.settings\")\n{expo_plugin}}}\n\n// The libraries bloom links (autolinking.json): the app's React Native libraries and its\n// {what}\nextensions.configure(com.facebook.react.ReactSettingsExtension) {{ ex ->\n  ex.autolinkLibrariesFromConfigFile(new File(rootDir, \"../autolinking.json\"))\n}}\n{expo_body}\nrootProject.name = {name}\ninclude ':app'\nincludeBuild({plugin})\n{from_source}",
            plugin = quote(&gradle_plugin.to_string_lossy()),
            name = quote(&package.manifest.name),
        ),
    )?;
    write(
        &android.join("build.gradle"),
        &format!(
            "{header}buildscript {{\n  ext {{\n    buildToolsVersion = {bt}\n    minSdkVersion = {min_sdk}\n    compileSdkVersion = {csdk}\n    targetSdkVersion = {tsdk}\n    ndkVersion = {ndk}\n    kotlinVersion = {kotlin}\n  }}\n  repositories {{\n    google()\n    mavenCentral()\n  }}\n  dependencies {{\n    classpath('com.android.tools.build:gradle')\n    classpath('com.facebook.react:react-native-gradle-plugin')\n    classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')\n  }}\n}}\n\nallprojects {{\n  repositories {{\n    google()\n    mavenCentral()\n{jitpack}  }}\n}}\n\n{expo_root}apply plugin: \"com.facebook.react.rootproject\"\n",
            // The stopgaps build with Expo's root project plugin (their KSP and Kotlin versions,
            // Expo's version catalog) and the repositories Expo's template lists.
            jitpack = if inputs.expo.is_some() { "    maven { url 'https://www.jitpack.io' }\n" } else { "" },
            expo_root = if inputs.expo.is_some() { "apply plugin: \"expo-root-project\"\n" } else { "" },
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
            "# Generated by bloom from Package.bloom.\norg.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=768m\norg.gradle.parallel=true\nandroid.useAndroidX=true\nreactNativeArchitectures={abis}\nnewArchEnabled=true\nhermesEnabled=true\nedgeToEdgeEnabled=true\nandroid.builtInKotlin=false\nandroid.newDsl=false\n{extra}",
            extra = inputs
                .overrides
                .gradle_properties
                .as_ref()
                .map(|p| format!("\n# The app's own (Package.bloom `adopt:` overrides).\n{p}"))
                .unwrap_or_default(),
        ),
    )?;
    let hermes = hermes_compiler.join("hermesc/%OS-BIN%/hermesc");
    let debug = signing(package, false)?;
    let release_signing = if release { Some(signing(package, true)?) } else { None };
    let signing_block = |name: &str, s: &Signing| {
        format!(
            "    {name} {{\n      storeFile file({})\n      storePassword {}\n      keyAlias {}\n      keyPassword {}\n    }}\n",
            quote(&s.store.to_string_lossy()),
            s.password,
            quote(&s.alias),
            s.password
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
  root = file({react_root})
  reactNativeDir = file({react_native})
  codegenDir = file({codegen})
  entryFile = file({entry})
  // Metro, as bloom drives it.
  cliFile = file("../../bloom-metro.js")
  bundleCommand = "bundle"
  hermesCommand = {hermes}
  autolinkLibrariesWithApp()
}}

// The bundle's inputs beyond the JS and TS files React Native's plugin tracks under `root`:
// the package's `.bloom` sources, its string catalogs and the standard library, which live
// outside the build directory. Without them an edited `.bloom` file leaves the bundle
// UP-TO-DATE and the APK ships the old JS.
tasks.matching {{ it.name.startsWith("createBundle") && it.name.endsWith("JsAndAssets") }}.configureEach {{
  inputs.files(fileTree({package_root}) {{
    include "**/*.bloom", "**/*.ts", "**/*.tsx", "**/*.js", "**/*.json"
    exclude ".bloom/build/**", ".bloom/cache/**", ".bloom/dist/**", ".bloom/modules/**", "**/node_modules/**"
    // Native projects inside the package (an adopted app's own modules) are Gradle's outputs.
    exclude "**/android/**", "**/ios/**", "**/build/**"
  }}).withPropertyName("bloomSources").withPathSensitivity(PathSensitivity.RELATIVE)
  // How bloom bundles (its Metro driver and config, an adopted app's Babel transformer): a
  // change there is a new bundle too.
  inputs.files(fileTree(file("../..")) {{ include "*.js" }}).withPropertyName("bloomMetro").withPathSensitivity(PathSensitivity.RELATIVE)
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
{res}{app_gradle}"#,
            res = inputs
                .overrides
                .res
                .as_ref()
                .map(|r| format!("\n// The app's own resources (Package.bloom `adopt:` overrides).\nandroid.sourceSets.main.res.srcDirs += [{}]\n", quote(&r.to_string_lossy())))
                .unwrap_or_default(),
            app_gradle = inputs
                .overrides
                .app_gradle
                .as_ref()
                .map(|f| format!("\n// The app's own build additions (Package.bloom `adopt:` overrides).\napply from: {}\n", quote(&f.to_string_lossy())))
                .unwrap_or_default(),
            react_root = quote(&layout.root.to_string_lossy()),
            react_native = quote(&react_native.to_string_lossy()),
            codegen = quote(&codegen.to_string_lossy()),
            entry = quote(&layout.entry.to_string_lossy()),
            hermes = quote(&hermes.to_string_lossy()),
            package_root = quote(&package.root.to_string_lossy()),
            id = quote(&id),
            version = quote(&version(package)),
        ),
    )?;
    write(
        &android.join("app/proguard-rules.pro"),
        &format!(
            "# Generated by bloom. React Native's own rules come with its AAR.\n{}",
            inputs.overrides.proguard.as_deref().unwrap_or_default()
        ),
    )?;
    let kotlin_dir = android.join("app/src/main/java").join(id.replace('.', "/"));
    let expo = inputs.expo.is_some();
    write(
        &kotlin_dir.join("MainApplication.kt"),
        &format!(
            "{header}package {id}\n\nimport android.app.Application\nimport com.facebook.react.PackageList\nimport com.facebook.react.ReactApplication\nimport com.facebook.react.ReactHost\nimport com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative\n{host_import}\nimport com.facebook.react.modules.network.OkHttpClientFactory\nimport com.facebook.react.modules.network.OkHttpClientProvider\nimport okhttp3.Dispatcher\n\nclass MainApplication : Application(), ReactApplication {{\n  override val reactHost: ReactHost by lazy {{\n    {host}(context = applicationContext, packageList = PackageList(this).packages)\n  }}\n\n  override fun onCreate() {{\n    super.onCreate()\n    // The app's HTTP clients (fetch's and the image pipeline's): React Native's, with 16\n    // requests in flight per host rather than OkHttp's 5, so a screen of images loads\n    // as fast as the platform's image loaders load it.\n    OkHttpClientProvider.setOkHttpClientFactory(\n      OkHttpClientFactory {{\n        OkHttpClientProvider.createClientBuilder(this)\n          .dispatcher(Dispatcher().apply {{ maxRequestsPerHost = 16 }})\n          .build()\n      }}\n    )\n    loadReactNative(this)\n{app_created}  }}\n{app_configuration}}}\n",
            host_import = if expo {
                "import android.content.res.Configuration\nimport expo.modules.ApplicationLifecycleDispatcher\nimport expo.modules.ExpoReactHostFactory"
            } else {
                "import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost"
            },
            // The stopgaps' lifecycle listeners and host handlers (Expo's), while they are linked.
            host = if expo { "ExpoReactHostFactory.getDefaultReactHost" } else { "getDefaultReactHost" },
            app_created =
                if expo { "    ApplicationLifecycleDispatcher.onApplicationCreate(this)\n" } else { "" },
            app_configuration = if expo {
                "\n  override fun onConfigurationChanged(newConfig: Configuration) {\n    super.onConfigurationChanged(newConfig)\n    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)\n  }\n"
            } else {
                ""
            },
        ),
    )?;
    write(
        &kotlin_dir.join("MainActivity.kt"),
        &format!(
            "{header}package {id}\n\nimport android.os.Bundle\nimport com.facebook.react.ReactActivity\nimport com.facebook.react.ReactActivityDelegate\nimport com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled\nimport com.facebook.react.defaults.DefaultReactActivityDelegate\n\nclass MainActivity : ReactActivity() {{\n  override fun onCreate(savedInstanceState: Bundle?) {{\n    // The app's theme replaces the launch theme (the splash) with the first frame. A saved\n    // state is not restored: react-native-screens rebuilds its fragments from JS.\n    setTheme(R.style.AppTheme)\n    super.onCreate(null)\n    // No frame before the first content (or the app's `Splash.hide()`): the splash stays.\n    so.oxy.bloom.splash.SplashHold.install(this)\n  }}\n\n  override fun getMainComponentName(): String = \"main\"\n\n  override fun createReactActivityDelegate(): ReactActivityDelegate =\n{delegate}\n}}\n",
            delegate = if expo {
                "    expo.modules.ReactActivityDelegateWrapper(\n      this,\n      true,\n      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {}\n    )"
            } else {
                "    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)"
            },
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
    let round =
        if package.manifest.app.icon.is_some() { "" } else { " android:roundIcon=\"@mipmap/ic_launcher\"" };
    write(
        &android.join("app/src/main/AndroidManifest.xml"),
        &format!(
            "<!-- Generated by bloom from Package.bloom: regenerated on every build, never edited. -->\n<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\" xmlns:tools=\"http://schemas.android.com/tools\">\n{uses}  <application android:name=\".MainApplication\" android:label=\"@string/app_name\" android:icon=\"@mipmap/ic_launcher\"{round} android:allowBackup=\"false\" tools:replace=\"android:allowBackup\" android:theme=\"@style/AppTheme\" android:supportsRtl=\"true\" android:enableOnBackInvokedCallback=\"true\">\n    <activity android:name=\".MainActivity\" android:configChanges=\"keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode|smallestScreenSize\" android:launchMode=\"singleTask\" android:windowSoftInputMode=\"adjustResize\" android:theme=\"@style/LaunchTheme\" android:exported=\"true\">\n      <intent-filter>\n        <action android:name=\"android.intent.action.MAIN\" />\n        <category android:name=\"android.intent.category.LAUNCHER\" />\n      </intent-filter>\n{deep_links}    </activity>\n  </application>\n</manifest>\n"
        ),
    )?;
    // Metro's dev server over the device's reverse port; and, for an adopted app, its own
    // manifest (the overrides) as the build type's, which merges over the main one.
    let cleartext = "android:usesCleartextTraffic=\"true\" tools:replace=\"android:usesCleartextTraffic\"";
    let debug_manifest = inputs.overrides.build_type_manifest(cleartext).unwrap_or_else(|| {
        format!("<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\" xmlns:tools=\"http://schemas.android.com/tools\">\n  <!-- Metro's dev server over the device's reverse port. -->\n  <application {cleartext} />\n</manifest>\n")
    });
    write(&android.join("app/src/debug/AndroidManifest.xml"), &debug_manifest)?;
    let release_manifest = android.join("app/src/release/AndroidManifest.xml");
    match inputs.overrides.build_type_manifest("") {
        Some(text) => write(&release_manifest, &text)?,
        None => {
            let _ = std::fs::remove_file(&release_manifest);
        }
    }
    let res = android.join("app/src/main/res");
    let splash = package.manifest.app.splash.clone().unwrap_or_else(|| "#FFFFFF".into());
    write(
        &res.join("values/strings.xml"),
        &format!(
            "<resources>\n  <string name=\"app_name\">{}</string>\n</resources>\n",
            xml(&display_name(package))
        ),
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
            std::fs::copy(package.root.join(image), &to)
                .map_err(|e| format!("the splash image {image}: {e}"))?;
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
    write_fonts(layout.resolve("@oxy.so/bloom"), &android.join("app/src/main/assets"))?;
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
    let build = package.build_dir();
    let header = "// Generated by bloom from Package.bloom: regenerated on every build, never edited.\n";
    // A Bloom app's JS and packages are generated and installed in the build directory; an
    // adopted Expo app's stay where its own package manager installed them (hybrid mode).
    let (layout, manifest_dir) = match &package.manifest.adopt {
        Some(adopt) => (hybrid::Layout::adopted(package, adopt)?, package.root.clone()),
        None => {
            crate::expo::generate_for(package, true)?;
            crate::deps::install(package)?;
            (hybrid::Layout::bloom(&build), build.clone())
        }
    };
    let link = hybrid::expo_link(package, &layout)?;
    if package.manifest.adopt.is_some() {
        hybrid::write_js(package, link.as_ref(), SHIM_FILES, SHIMMED, header, METRO_DRIVER)?;
    }
    let natives = native_modules(package)?;
    let skip = |name: &str| link.as_ref().is_some_and(|l| l.is_expo(name));
    let mut libraries = autolink::libraries(&manifest_dir, &layout, KEPT, &skip)?;
    if let Some(link) = &link {
        // Expo's own package list (the linked modules), as a React Native package.
        let expo = layout.require("expo")?;
        libraries.push(autolink::Library {
            name: "expo".into(),
            root: expo.clone(),
            source_dir: expo.join("android"),
            import: "import expo.modules.ExpoModulesPackage;".into(),
            instance: "new ExpoModulesPackage()".into(),
            library_name: None,
            component_descriptors: Vec::new(),
            cmake_lists: expo.join("android/build/generated/source/codegen/jni/CMakeLists.txt"),
        });
        println!(
            "bloom: hybrid build: {} Expo module(s) linked as stopgaps ({}), {} left out",
            link.linked.len(),
            link.linked.iter().cloned().collect::<Vec<_>>().join(", "),
            link.excluded.len()
        );
    }
    for native in &natives {
        libraries.push(write_native_library(&build, native)?);
    }
    let overrides = hybrid::Overrides::read(package);
    let inputs = GradleInputs {
        layout: &layout,
        libraries: &libraries,
        release: mode.release,
        expo: link.as_ref(),
        overrides: &overrides,
    };
    write_gradle(package, &inputs)?;
    Ok(true)
}

/// `bloom build android`: the APK, in `.bloom/dist/android/<Name>.apk`. A debug build loads
/// its JS from Metro (`bloom run android`); a release build embeds the Hermes bytecode.
pub fn build(package: &Package, mode: &Mode) -> Result<Option<PathBuf>, String> {
    if !prepare(package, mode)? {
        return Ok(None);
    }
    let android = package.build_dir().join("android");
    if mode.generate {
        println!(
            "bloom: the Gradle project is in {} (open it in Android Studio)",
            shown_rel(package, &android)
        );
        return Ok(Some(android));
    }
    let variant = if mode.release { "Release" } else { "Debug" };
    let abis = std::env::var("BLOOM_ANDROID_ABIS").unwrap_or_else(|_| "x86_64".into());
    run_in(
        &android,
        "./gradlew",
        &[&format!("assemble{variant}"), &format!("-PreactNativeArchitectures={abis}")],
    )?;
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
    run_in(
        &build_dir,
        "adb",
        &["-s", &serial, "shell", "am", "start", "-n", &format!("{id}/.MainActivity")],
    )?;
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
        assert!(metro.contains("\"expo-blur\": \"expo-blur.js\""), "{metro}");
        assert!(!metro.contains("expo-linking"), "{metro}");
        let babel = read("babel.config.js");
        assert!(
            babel.contains("module:@react-native/babel-preset")
                && babel.contains("react-native-worklets/plugin")
        );
        assert!(read("bloom-metro.js").contains("bundleCommand"));
        let _ = std::fs::remove_dir_all(&package.root);
    }

    /// A routed app's entry installs the Bloom router with its routes enum as the spec: no
    /// file routes, no expo-router, each case's reader typing its parameters.
    #[test]
    fn a_routed_app_gets_the_bloom_router() {
        let package = crate::navigation::tests::package("bloom-router", crate::navigation::tests::APP);
        crate::expo::generate_for(&package, true).unwrap();
        let build = package.build_dir();
        assert!(!build.join("app").exists(), "a Bloom build writes no file routes");
        let index = std::fs::read_to_string(build.join("index.js")).unwrap();
        assert!(
            index.contains("import { bloomRouter } from './../std/Bloom/router';")
                || index.contains("std/Bloom/router'"),
            "{index}"
        );
        assert!(index.contains("registerNavigation(bloomRouter({"), "{index}");
        assert!(index.contains("sheets: [\"compose\"]"), "{index}");
        assert!(
            index.contains("\"post\": (p) => ({ tag: \"post\", \"id\": (p[\"id\"] ?? ''), \"page\": Number(p[\"page\"]) }),"),
            "{index}"
        );
        assert!(
            index.contains("{ route: \"feed\", title: \"Home\", icon: RiHomeLine, activeIcon: RiHomeFill },"),
            "{index}"
        );
        assert!(index.contains("import { RiHomeLine } from '@oxy.so/bloom/icons/RiHomeLine';"), "{index}");
        assert!(index.contains("AppRegistry.registerComponent('main', () => Root);"), "{index}");
        assert!(!index.contains("expo"), "{index}");
        let _ = std::fs::remove_dir_all(&package.root);
    }

    /// The video module links androidx media3 from its `dependencies.gradle`, and a Bloom
    /// build answers `expo-video` with the shim over it.
    #[test]
    fn the_video_module_links_media3_behind_the_expo_video_shim() {
        let package = package(
            "video",
            "let package = Package(name: \"Shop\", platforms: [.android(26)], targets: [.app(\"Shop\")])",
            &[("Sources/Shop/App.bloom", APP)],
        );
        let natives = native_modules(&package).unwrap();
        let video = natives.iter().find(|n| n.module.name == "BloomVideo").unwrap();
        let build = package.build_dir();
        let lib = write_native_library(&build, video).unwrap();
        assert_eq!(lib.import, "import so.oxy.bloom.video.BloomVideoPackage;");
        assert_eq!(lib.component_descriptors, ["BloomVideoViewComponentDescriptor"]);
        let gradle = std::fs::read_to_string(build.join("native/BloomVideo/android/build.gradle")).unwrap();
        assert!(
            gradle.contains("  implementation(\"com.facebook.react:react-android\")\n  // The libraries"),
            "{gradle}"
        );
        assert!(
            gradle.contains("  implementation(\"androidx.media3:media3-exoplayer:1.9.1\")\n"),
            "{gradle}"
        );
        let spec = std::fs::read_to_string(build.join("native/BloomVideo/js/NativeBloomVideo.ts")).unwrap();
        assert!(spec.contains("readonly onStatus: CodegenTypes.EventEmitter<"), "{spec}");
        write_js(&package, "").unwrap();
        let metro = std::fs::read_to_string(build.join("metro.config.js")).unwrap();
        assert!(metro.contains("\"expo-video\": \"expo-video.js\""), "{metro}");
        let shim = std::fs::read_to_string(build.join("shims/expo-video.js")).unwrap();
        assert!(shim.contains("TurboModuleRegistry.get('BloomVideo')"), "{shim}");
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
        assert_eq!(
            natives.iter().map(|n| n.module.name.as_str()).collect::<Vec<_>>(),
            ["BloomStorage", "BloomImage", "BloomVideo", "BloomSplash"]
        );
        assert!(
            natives[0].kotlin.join("so/oxy/bloom/storage/BloomStorageModule.kt").is_file(),
            "{:?}",
            natives[0].kotlin
        );
        let build = package.build_dir();
        let lib = write_native_library(&build, &natives[0]).unwrap();
        assert_eq!(lib.import, "import so.oxy.bloom.storage.BloomStoragePackage;");
        let spec =
            std::fs::read_to_string(build.join("native/BloomStorage/js/NativeBloomStorage.ts")).unwrap();
        assert!(spec.contains("TurboModuleRegistry.get<Spec>('BloomStorage')"), "{spec}");
        let gradle = std::fs::read_to_string(build.join("native/BloomStorage/android/build.gradle")).unwrap();
        assert!(gradle.contains("codegenJavaPackageName = \"so.oxy.bloom.storage\""), "{gradle}");
        let pkg =
            json::parse(&std::fs::read_to_string(build.join("native/BloomStorage/package.json")).unwrap())
                .unwrap();
        assert_eq!(
            pkg.get("codegenConfig").get("android").get("javaPackageName").as_str(),
            Some("so.oxy.bloom.storage")
        );
        assert_eq!(pkg.get("codegenConfig").get("type").as_str(), Some("modules"));
        assert!(lib.component_descriptors.is_empty());
        let _ = std::fs::remove_dir_all(&package.root);
    }

    #[test]
    fn a_native_view_is_a_fabric_component_library() {
        let package = package(
            "native-view",
            "let package = Package(name: \"Shop\", platforms: [.android(26)], targets: [.app(\"Shop\")])",
            &[("Sources/Shop/App.bloom", APP)],
        );
        let natives = native_modules(&package).unwrap();
        let image = natives.iter().find(|n| n.module.name == "BloomImage").unwrap();
        let build = package.build_dir();
        let lib = write_native_library(&build, image).unwrap();
        assert_eq!(lib.import, "import so.oxy.bloom.image.BloomImagePackage;");
        // The app registers the view's component descriptor (autolinking.json).
        assert_eq!(lib.component_descriptors, ["BloomImageViewComponentDescriptor"]);
        let js = build.join("native/BloomImage/js");
        let component = std::fs::read_to_string(js.join("BloomImageViewNativeComponent.ts")).unwrap();
        assert!(component.contains("codegenNativeComponent<NativeProps>('BloomImageView')"), "{component}");
        assert!(js.join("NativeBloomImage.ts").is_file());
        let pkg =
            json::parse(&std::fs::read_to_string(build.join("native/BloomImage/package.json")).unwrap())
                .unwrap();
        // A module with functions and a view: codegen writes both.
        assert_eq!(pkg.get("codegenConfig").get("type").as_str(), Some("all"));
        let _ = std::fs::remove_dir_all(&package.root);
    }
}
