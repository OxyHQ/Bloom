//! `bloom build` and `bloom run`: the generated app underneath (ADR 0002, section 2).
//!
//! For phase A the platform build is an Expo app that `bloom` writes to
//! `.bloom/build/` (its `package.json`, `app.json`, Metro, Babel, Jest and TS
//! config, wired with the compiler's Metro adapter) and drives: `expo export`
//! for the web, `expo prebuild` and Gradle for Android. It is regenerated on
//! every build, never edited, and git-ignored. iOS is phase F.

use std::path::{Path, PathBuf};
use std::process::Command;

use bloom_lang::package::{Platform, TargetKind};

use crate::project::{CheckOptions, Package, check_modules, write};

/// The Bloom release this toolchain builds against (`bloom new` writes it).
pub const BLOOM_VERSION: &str = "23.9.1";

/// The runtime under a Bloom app, pinned as Bloom's own repository pins it
/// (a test keeps this table equal to Bloom's `package.json` files).
pub const RUNTIME: &[(&str, &str)] = &[
    ("@oxy.so/bloom", BLOOM_VERSION),
    ("@oxy.so/bloom-language", "1.7.0"),
    ("@oxy.so/bloom-language-compiler", "1.5.0"),
    ("expo", "~58.0.23"),
    ("expo-blur", "~58.0.5"),
    ("expo-font", "~58.0.11"),
    ("expo-haptics", "~58.0.7"),
    ("expo-image", "~58.0.18"),
    ("expo-router", "~58.0.30"),
    ("react", "19.3.0"),
    ("react-dom", "19.3.0"),
    ("react-native", "0.88.1"),
    ("react-native-gesture-handler", "~3.3.0"),
    ("react-native-reanimated", "4.7.1"),
    ("react-native-safe-area-context", "~5.11.1"),
    ("react-native-screens", "~4.30.1"),
    ("react-native-svg", "15.16.0"),
    ("react-native-web", "~0.21.4"),
    ("react-native-worklets", "0.13.0"),
];

/// Build tools, not shipped in the app.
pub const TOOLS: &[(&str, &str)] = &[
    ("typescript", "~6.0.3"),
    ("@types/react", "~19.3.0"),
    ("jest", "^30.5.2"),
    ("babel-plugin-react-compiler", "1.0.0"),
];

/// First-party packages, exempt from the quarantine (as in every Oxy repo's bunfig).
const FIRST_PARTY: &[&str] = &[
    "@oxy.so/bloom",
    "@oxy.so/bloom-data",
    "@oxy.so/bloom-language",
    "@oxy.so/bloom-language-compiler",
    "@oxy.so/bloom-language-compiler-darwin-arm64",
    "@oxy.so/bloom-language-compiler-darwin-x64",
    "@oxy.so/bloom-language-compiler-linux-arm64-gnu",
    "@oxy.so/bloom-language-compiler-linux-x64-gnu",
    "@oxy.so/bloom-language-compiler-wasm32-wasi",
    "@oxy.so/bloom-language-compiler-win32-x64-msvc",
];

/// How a build runs.
pub struct Mode {
    pub release: bool,
    pub device: Option<String>,
    pub jobs: usize,
    pub allow_ts_imports: bool,
}

impl Mode {
    pub(crate) fn new(args: &crate::Args, check: &CheckOptions) -> Mode {
        Mode {
            release: args.release,
            device: args.device.clone(),
            jobs: check.jobs,
            allow_ts_imports: check.allow_ts_imports,
        }
    }
}

const IOS: &str = "iOS builds come with phase F (ADR 0002, section 7: the Bloom platform without Expo); for now build web or android";

fn platform_check(package: &Package, platform: &str) -> Result<(), String> {
    let wanted = match platform {
        "web" => Platform::Web,
        "android" => Platform::Android(0),
        "ios" => return Err(IOS.into()),
        other => return Err(format!("no platform `{other}`: use web or android")),
    };
    let listed = package
        .manifest
        .platforms
        .iter()
        .any(|p| std::mem::discriminant(p) == std::mem::discriminant(&wanted));
    if !listed {
        return Err(format!("Package.bloom does not list `.{platform}` in `platforms:`"));
    }
    Ok(())
}

/// `bloom build <platform>`: check, generate, install, build.
pub fn build(package: &Package, platform: &str, mode: &Mode) -> Result<bool, String> {
    platform_check(package, platform)?;
    let options = CheckOptions { jobs: mode.jobs, tsc: false, allow_ts_imports: mode.allow_ts_imports };
    if !check_modules(package, &options, false)?.ok {
        return Ok(false);
    }
    generate(package)?;
    crate::deps::install(package)?;
    let build = package.build_dir();
    let dist = package.dot().join("dist").join(platform);
    match platform {
        "web" => {
            run_in(
                &build,
                "bun",
                &["x", "expo", "export", "--platform", "web", "--output-dir", &dist.to_string_lossy()],
            )?;
            println!("bloom: web build in {}", shown_rel(package, &dist));
        }
        _ => {
            let apk = android_build(package, mode.release)?;
            println!("bloom: Android build in {}", shown_rel(package, &apk));
        }
    }
    Ok(true)
}

/// `bloom run <platform>`: build and start, on a browser or the emulator.
pub fn run(package: &Package, platform: &str, mode: &Mode) -> Result<bool, String> {
    platform_check(package, platform)?;
    let build = package.build_dir();
    match (platform, mode.release) {
        ("web", false) | ("android", false) => {
            let options =
                CheckOptions { jobs: mode.jobs, tsc: false, allow_ts_imports: mode.allow_ts_imports };
            if !check_modules(package, &options, false)?.ok {
                return Ok(false);
            }
            generate(package)?;
            crate::deps::install(package)?;
            if platform == "web" {
                // Metro's dev server, with fast refresh.
                run_in(&build, "bun", &["x", "expo", "start", "--web"])?;
            } else {
                let serial = device(mode)?;
                prebuild(package)?;
                run_in(&build, "bun", &["x", "expo", "run:android", "--device", &serial])?;
            }
            Ok(true)
        }
        ("web", true) => {
            if !self::build(package, "web", mode)? {
                return Ok(false);
            }
            run_in(&build, "bun", &["x", "expo", "serve", "--port", "8081"])?;
            Ok(true)
        }
        _ => {
            if !self::build(package, "android", mode)? {
                return Ok(false);
            }
            let serial = device(mode)?;
            let apk = package.dot().join("dist/android").join(format!("{}.apk", package.manifest.name));
            let id = application_id(package);
            run_in(&build, "adb", &["-s", &serial, "install", "-r", &apk.to_string_lossy()])?;
            run_in(
                &build,
                "adb",
                &["-s", &serial, "shell", "am", "start", "-n", &format!("{id}/.MainActivity")],
            )?;
            println!("bloom: started {id} on {serial}");
            Ok(true)
        }
    }
}

/// The device to run on: `--device`, `$ANDROID_SERIAL`, else the one running emulator.
/// A phone is used only when named: `bloom run` never picks one by itself.
fn device(mode: &Mode) -> Result<String, String> {
    if let Some(serial) = mode.device.clone().or_else(|| std::env::var("ANDROID_SERIAL").ok()) {
        return Ok(serial);
    }
    let out = Command::new("adb").arg("devices").output().map_err(|e| format!("adb: {e}"))?;
    let listed = String::from_utf8_lossy(&out.stdout);
    let emulators: Vec<&str> = listed
        .lines()
        .skip(1)
        .filter_map(|l| l.split_once('\t'))
        .filter(|(serial, state)| serial.starts_with("emulator-") && *state == "device")
        .map(|(serial, _)| serial)
        .collect();
    match emulators.as_slice() {
        [one] => Ok(one.to_string()),
        [] => Err("no Android emulator is running: start one (`emulator -avd <name>`), or name a device with --device".into()),
        _ => Err(format!("{} emulators are running: name one with --device", emulators.len())),
    }
}

fn android_build(package: &Package, release: bool) -> Result<PathBuf, String> {
    prebuild(package)?;
    let android = package.build_dir().join("android");
    let variant = if release { "Release" } else { "Debug" };
    let abis = std::env::var("BLOOM_ANDROID_ABIS").unwrap_or_else(|_| "x86_64".into());
    run_in(
        &android,
        "./gradlew",
        &[&format!("assemble{variant}"), &format!("-PreactNativeArchitectures={abis}"), "--no-daemon"],
    )?;
    let lower = variant.to_lowercase();
    let built = android.join(format!("app/build/outputs/apk/{lower}/app-{lower}.apk"));
    let apk = package.dot().join("dist/android").join(format!("{}.apk", package.manifest.name));
    std::fs::create_dir_all(apk.parent().unwrap_or(Path::new("."))).map_err(|e| e.to_string())?;
    std::fs::copy(&built, &apk).map_err(|e| format!("{}: {e}", built.display()))?;
    Ok(apk)
}

/// `expo prebuild` for Android, again only when the generated config changed.
fn prebuild(package: &Package) -> Result<(), String> {
    let build = package.build_dir();
    let stamp = build.join(".prebuild");
    let config = std::fs::read_to_string(build.join("app.json")).unwrap_or_default();
    let installed = std::fs::read_to_string(build.join("package.json")).unwrap_or_default();
    let key = format!("{:032x}", crate::build::hash(&[config.as_bytes(), installed.as_bytes()]));
    if build.join("android").is_dir() && std::fs::read_to_string(&stamp).ok().as_deref() == Some(key.as_str())
    {
        return Ok(());
    }
    run_in(&build, "bun", &["x", "expo", "prebuild", "--platform", "android", "--no-install", "--clean"])?;
    write(&stamp, &key)
}

/// `so.bloom.<name>`, from the package name.
pub fn application_id(package: &Package) -> String {
    let name: String = package.manifest.name.chars().filter(char::is_ascii_alphanumeric).collect();
    format!("so.bloom.{}", name.to_lowercase())
}

pub fn run_in(dir: &Path, program: &str, args: &[&str]) -> Result<(), String> {
    let program = if program == "bun" {
        std::env::var("BLOOM_BUN").unwrap_or_else(|_| "bun".into())
    } else {
        program.into()
    };
    let status = Command::new(&program)
        .args(args)
        .current_dir(dir)
        .env("BUN_INSTALL_CACHE_DIR", crate::deps::store())
        .env("EXPO_NO_TELEMETRY", "1")
        .status()
        .map_err(|e| format!("{program}: {e}"))?;
    if status.success() { Ok(()) } else { Err(format!("`{program} {}` failed ({status})", args.join(" "))) }
}

fn shown_rel(package: &Package, path: &Path) -> String {
    path.strip_prefix(&package.root).unwrap_or(path).display().to_string()
}

/// The app target's root view: a `public view App` in the app target's files.
fn entry(package: &Package) -> Result<(PathBuf, String), String> {
    let app = package
        .targets_of(|k| matches!(k, TargetKind::App))
        .first()
        .copied()
        .ok_or("Package.bloom has no `.app` target to build")?;
    let name = &package.manifest.targets[app].name;
    for file in package.files(app) {
        let source = std::fs::read_to_string(&file).unwrap_or_default();
        let (ast, _, _) = bloom_lang::parse(&source, "");
        for item in &ast.items {
            let item_name = &item.kind.name().name;
            if item_name == "App" || item_name == &format!("{name}App") {
                return Ok((file, item_name.clone()));
            }
        }
    }
    Err(format!("the app target `{name}` has no root view: declare `public view App` in Sources/{name}/"))
}

/// Writes `.bloom/build/`: everything the platform tools read.
pub fn generate(package: &Package) -> Result<(), String> {
    let build = package.build_dir();
    let rel = |p: &Path| crate::files::relative_url(&build, p);
    let header = "// Generated by bloom from Package.bloom: regenerated on every build, never edited.\n";
    write_manifests(package)?;
    write(&build.join("app.json"), &app_json(package))?;
    // A package without an app target (a module, its tests) has no entry point.
    if package.targets_of(|k| matches!(k, TargetKind::App)).is_empty() {
        write(&build.join("index.js"), &format!("{header}// No `.app` target: nothing to start.\n"))?;
    } else {
        let (entry_file, entry_name) = entry(package)?;
        write(
            &build.join("index.js"),
            &format!(
                "{header}import {{ createElement }} from 'react';\nimport {{ registerRootComponent }} from 'expo';\nimport {{ BloomProvider }} from '@oxy.so/bloom/provider';\nimport {{ Screen }} from '@oxy.so/bloom/screen';\nimport {{ toElement }} from '@oxy.so/bloom-language';\nimport {{ {entry_name} }} from '{}';\n\n// The app's root view: a screen under Bloom's provider.\nfunction Root() {{\n  return createElement(BloomProvider, null, createElement(Screen, null, toElement({entry_name}())));\n}}\n\nregisterRootComponent(Root);\n",
                rel(&entry_file)
            ),
        )?;
    }
    write(
        &build.join("metro.config.js"),
        &format!(
            r#"{header}const path = require('node:path');
const {{ getDefaultConfig }} = require('expo/metro-config');
const {{ withBloomLanguage }} = require('@oxy.so/bloom-language-compiler/metro');

const projectRoot = __dirname;
const packageRoot = path.resolve(projectRoot, '{root}');
const config = getDefaultConfig(projectRoot);
// The package's modules live outside the generated app; its runtime only here.
config.watchFolders = [packageRoot];
config.resolver.nodeModulesPaths = [path.join(projectRoot, 'node_modules')];
config.resolver.disableHierarchicalLookup = true;
config.resolver.blockList = [/\/\.bloom\/(cache|dist|modules)\//, /\/\.bloom\/build\/(android|ios)\//];

module.exports = withBloomLanguage(config);
"#,
            root = rel(&package.root),
        ),
    )?;
    write(
        &build.join("babel.config.js"),
        &format!(
            "{header}module.exports = function (api) {{\n  api.cache(true);\n  return {{ presets: ['babel-preset-expo'] }};\n}};\n"
        ),
    )?;
    write(
        &build.join("tsconfig.json"),
        "{\n  \"extends\": \"expo/tsconfig.base\",\n  \"compilerOptions\": { \"strict\": true }\n}\n",
    )?;
    write(&build.join("jest.config.js"), crate::testing::JEST_CONFIG)?;
    write(&build.join("testing.js"), crate::testing::RUNTIME)?;
    write(&build.join(".gitignore"), "*\n")?;
    Ok(())
}

/// `package.json` and `bunfig.toml`: what installing the runtime needs.
pub fn write_manifests(package: &Package) -> Result<(), String> {
    let build = package.build_dir();
    write(&build.join("package.json"), &crate::deps::package_json(package)?)?;
    write(&build.join("bunfig.toml"), &bunfig())
}

fn bunfig() -> String {
    let excludes: Vec<String> = FIRST_PARTY.iter().map(|n| format!("  \"{n}\",")).collect();
    format!(
        "# Generated by bloom. The 7-day supply-chain quarantine: nothing published in the\n# last week resolves (first-party packages exempt, by exact name).\n[install]\nminimumReleaseAge = 604800\nminimumReleaseAgeExcludes = [\n{}\n]\n",
        excludes.join("\n")
    )
}

fn app_json(package: &Package) -> String {
    let m = &package.manifest;
    let slug: String = m
        .name
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c.to_ascii_lowercase() } else { '-' })
        .collect();
    let platforms: Vec<String> = m
        .platforms
        .iter()
        .map(|p| match p {
            Platform::Ios(_) => "\"ios\"".to_string(),
            Platform::Android(_) => "\"android\"".to_string(),
            Platform::Web => "\"web\"".to_string(),
        })
        .collect();
    let min_sdk = m
        .platforms
        .iter()
        .find_map(|p| if let Platform::Android(v) = p { Some(*v) } else { None })
        .unwrap_or(26);
    let id = application_id(package);
    format!(
        r#"{{
  "expo": {{
    "name": "{name}",
    "slug": "{slug}",
    "version": "1.0.0",
    "platforms": [{platforms}],
    "newArchEnabled": true,
    "android": {{ "package": "{id}", "minSdkVersion": {min_sdk} }},
    "ios": {{ "bundleIdentifier": "{id}" }},
    "web": {{ "bundler": "metro", "output": "single" }}
  }}
}}
"#,
        name = m.name,
        platforms = platforms.join(", "),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The runtime table pins what Bloom's own repository pins.
    #[test]
    fn the_runtime_matches_blooms_package_json() {
        let repo = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../..");
        let read = |p: &str| std::fs::read_to_string(repo.join(p)).unwrap();
        let root = crate::json::parse(&read("package.json")).unwrap();
        assert_eq!(root.get("version").as_str(), Some(BLOOM_VERSION));
        let dev = root.get("devDependencies");
        for (name, version) in RUNTIME.iter().chain(TOOLS) {
            if name.starts_with("@oxy.so/") {
                let dir = name.trim_start_matches("@oxy.so/");
                if dir == "bloom" {
                    continue;
                }
                let pkg = crate::json::parse(&read(&format!("packages/{dir}/package.json"))).unwrap();
                assert_eq!(pkg.get("version").as_str(), Some(*version), "{name}");
            } else {
                assert_eq!(
                    dev.get(name).as_str(),
                    Some(*version),
                    "{name} drifted from Bloom's devDependencies"
                );
            }
        }
    }
}
