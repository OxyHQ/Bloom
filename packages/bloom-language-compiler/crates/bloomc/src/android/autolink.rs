//! The React Native libraries a Bloom Android build links, as React Native's Gradle plugin
//! reads them (`autolinking.json`, the community CLI's `config` format).
//!
//! `bloom` writes it itself (ADR 0002, section 7): the app's direct dependencies that have
//! Android code, minus Expo's (a Bloom build links no Expo module), plus the package's Bloom
//! native modules. A library's `react-native.config.js` may move its sources or its CMake
//! file; those files are JS, so one `node` run reads them all.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::json::{self, Value};

/// One linked library.
#[derive(Debug, Clone, PartialEq)]
pub struct Library {
    pub name: String,
    pub root: PathBuf,
    pub source_dir: PathBuf,
    pub import: String,
    pub instance: String,
    pub library_name: Option<String>,
    pub component_descriptors: Vec<String>,
    pub cmake_lists: PathBuf,
}

/// A package Expo owns: a Bloom build never links its native code.
pub fn is_expo(name: &str) -> bool {
    name == "expo" || name.starts_with("expo-") || name.starts_with("@expo/")
}

/// The `ReactPackage` class of an Android source tree: (its package, its class name).
fn package_class(source_dir: &Path) -> Option<(String, String)> {
    let mut files = Vec::new();
    collect(&source_dir.join("src/main"), &["java", "kt"], &mut files);
    files.sort();
    for file in files {
        let Ok(text) = std::fs::read_to_string(&file) else { continue };
        if !text.contains("ReactPackage") {
            continue;
        }
        let package = text.lines().find_map(|l| {
            l.trim().strip_prefix("package ").map(|p| p.trim_end_matches(';').trim().to_string())
        })?;
        let mut rest = text.as_str();
        while let Some(at) = rest.find("class ") {
            let after = &rest[at + 6..];
            let name: String = after.chars().take_while(|c| c.is_alphanumeric() || *c == '_').collect();
            // Its declaration: up to its body, or to the next class (one without a body).
            let header = after.split('{').next().unwrap_or("");
            let header = header.split("class ").next().unwrap_or(header);
            if !name.is_empty() && header.contains("ReactPackage") {
                return Some((package, name));
            }
            rest = after;
        }
    }
    None
}

fn collect(dir: &Path, extensions: &[&str], out: &mut Vec<PathBuf>) {
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if path.file_name().is_some_and(|n| n == "node_modules" || n == "build" || n == ".git") {
                continue;
            }
            collect(&path, extensions, out);
        } else if path.extension().is_some_and(|e| extensions.iter().any(|x| e == *x)) {
            out.push(path);
        }
    }
}

/// The Fabric components a library declares in its JS (`codegenNativeComponent('Name')`),
/// as the component descriptors the app registers.
fn component_descriptors(root: &Path) -> Vec<String> {
    let mut files = Vec::new();
    collect(root, &["js", "jsx", "ts", "tsx"], &mut files);
    let mut out = Vec::new();
    for file in files {
        let Ok(text) = std::fs::read_to_string(&file) else { continue };
        let mut rest = text.as_str();
        while let Some(at) = rest.find("codegenNativeComponent") {
            rest = &rest[at + "codegenNativeComponent".len()..];
            let call = rest.trim_start();
            let call = if call.starts_with('<') { call.split_once('>').map_or("", |(_, r)| r) } else { call };
            let Some(args) = call.trim_start().strip_prefix('(') else { continue };
            let args = args.trim_start();
            let Some(quote) = args.chars().next().filter(|c| *c == '\'' || *c == '"') else { continue };
            let name: String = args[1..].chars().take_while(|c| *c != quote).collect();
            let end = args.find(')').unwrap_or(args.len());
            if name.is_empty() || args[..end].contains("interfaceOnly: true") {
                continue;
            }
            let descriptor = format!("{name}ComponentDescriptor");
            if !out.contains(&descriptor) {
                out.push(descriptor);
            }
        }
    }
    out.sort();
    out
}

/// Each listed package's `react-native.config.js` `dependency.platforms.android`, by name
/// (`null` for a package that opts out of Android).
fn configs(build: &Path, names: &[String]) -> Result<BTreeMap<String, Value>, String> {
    let with_config: Vec<&String> =
        names.iter().filter(|n| build.join("node_modules").join(n).join("react-native.config.js").is_file()).collect();
    if with_config.is_empty() {
        return Ok(BTreeMap::new());
    }
    let list = json::write(&Value::Array(with_config.iter().map(|n| Value::String((*n).clone())).collect()));
    let script = format!(
        "const path = require('node:path');\nconst out = {{}};\nfor (const name of {list}) {{\n  const config = require(path.resolve('node_modules', name, 'react-native.config.js'));\n  const platforms = config && config.dependency && config.dependency.platforms;\n  if (platforms && 'android' in platforms) out[name] = platforms.android;\n}}\nprocess.stdout.write(JSON.stringify(out));\n"
    );
    let output = Command::new("node")
        .args(["-e", &script])
        .current_dir(build)
        .output()
        .map_err(|e| format!("node (reading the libraries' react-native.config.js): {e}"))?;
    if !output.status.success() {
        return Err(format!(
            "reading the libraries' react-native.config.js failed:\n{}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }
    match json::parse(&String::from_utf8_lossy(&output.stdout)) {
        Ok(Value::Object(fields)) => Ok(fields.into_iter().collect()),
        _ => Err("reading the libraries' react-native.config.js: not a JSON object".into()),
    }
}

/// The libraries of the generated app's `package.json` dependencies with Android code.
pub fn libraries(build: &Path) -> Result<Vec<Library>, String> {
    let manifest = json::parse(&std::fs::read_to_string(build.join("package.json")).map_err(|e| e.to_string())?)
        .map_err(|e| format!("package.json: {e}"))?;
    let mut names: Vec<String> = match manifest.get("dependencies") {
        Value::Object(fields) => fields.keys().cloned().collect(),
        _ => Vec::new(),
    };
    names.retain(|n| !is_expo(n) && n != "react-native" && n != "react" && n != "react-dom");
    names.sort();
    let configs = configs(build, &names)?;
    let mut out = Vec::new();
    for name in names {
        let root = build.join("node_modules").join(&name);
        let config = configs.get(&name);
        if matches!(config, Some(Value::Null)) {
            continue;
        }
        let field = |key: &str| config.map(|c| c.get(key)).and_then(|v| v.as_str()).map(str::to_string);
        let source_dir = match field("sourceDir") {
            Some(dir) => root.join(dir),
            None => root.join("android"),
        };
        if !source_dir.join("build.gradle").is_file() && !source_dir.join("build.gradle.kts").is_file() {
            continue;
        }
        let (import, instance) = match (field("packageImportPath"), field("packageInstance")) {
            (Some(import), Some(instance)) => (import, instance),
            _ => {
                let Some((package, class)) = package_class(&source_dir) else {
                    return Err(format!("{name}: no ReactPackage class under {}", source_dir.display()));
                };
                (format!("import {package}.{class};"), format!("new {class}()"))
            }
        };
        let pkg = json::parse(&std::fs::read_to_string(root.join("package.json")).unwrap_or_default())
            .unwrap_or(Value::Null);
        let library_name = field("libraryName").or_else(|| pkg.get("codegenConfig").get("name").as_str().map(str::to_string));
        let cmake_lists = match field("cmakeListsPath") {
            Some(path) => source_dir.join(path),
            None => source_dir.join("build/generated/source/codegen/jni/CMakeLists.txt"),
        };
        let descriptors = match config.map(|c| c.get("componentDescriptors")) {
            Some(Value::Array(items)) => items.iter().filter_map(|v| v.as_str().map(str::to_string)).collect(),
            _ => component_descriptors(&root),
        };
        out.push(Library {
            name,
            root,
            source_dir,
            import,
            instance,
            library_name,
            component_descriptors: descriptors,
            cmake_lists,
        });
    }
    Ok(out)
}

fn path(p: &Path) -> Value {
    Value::String(p.to_string_lossy().into_owned())
}

/// `autolinking.json`, as React Native's Gradle plugin reads it.
pub fn config_json(build: &Path, package_name: &str, libraries: &[Library]) -> String {
    let mut dependencies = BTreeMap::new();
    for lib in libraries {
        let mut android = BTreeMap::new();
        android.insert("sourceDir".to_string(), path(&lib.source_dir));
        android.insert("packageImportPath".to_string(), Value::String(lib.import.clone()));
        android.insert("packageInstance".to_string(), Value::String(lib.instance.clone()));
        android.insert("buildTypes".to_string(), Value::Array(Vec::new()));
        if let Some(name) = &lib.library_name {
            android.insert("libraryName".to_string(), Value::String(name.clone()));
        }
        android.insert(
            "componentDescriptors".to_string(),
            Value::Array(lib.component_descriptors.iter().cloned().map(Value::String).collect()),
        );
        android.insert("cmakeListsPath".to_string(), path(&lib.cmake_lists));
        android.insert("cxxModuleCMakeListsModuleName".to_string(), Value::Null);
        android.insert("cxxModuleCMakeListsPath".to_string(), Value::Null);
        android.insert("cxxModuleHeaderName".to_string(), Value::Null);
        android.insert("isPureCxxDependency".to_string(), Value::Bool(false));
        let mut platforms = BTreeMap::new();
        platforms.insert("android".to_string(), Value::Object(android.into_iter().collect()));
        let mut dep = BTreeMap::new();
        dep.insert("root".to_string(), path(&lib.root));
        dep.insert("name".to_string(), Value::String(lib.name.clone()));
        dep.insert("platforms".to_string(), Value::Object(platforms.into_iter().collect()));
        dependencies.insert(lib.name.clone(), Value::Object(dep.into_iter().collect()));
    }
    let mut android = BTreeMap::new();
    android.insert("sourceDir".to_string(), path(&build.join("android")));
    android.insert("packageName".to_string(), Value::String(package_name.to_string()));
    let mut project = BTreeMap::new();
    project.insert("android".to_string(), Value::Object(android.into_iter().collect()));
    let mut root = BTreeMap::new();
    root.insert("root".to_string(), path(build));
    root.insert("reactNativePath".to_string(), path(&build.join("node_modules/react-native")));
    root.insert("dependencies".to_string(), Value::Object(dependencies.into_iter().collect()));
    root.insert("project".to_string(), Value::Object(project.into_iter().collect()));
    json::write(&Value::Object(root.into_iter().collect()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_package_class_and_its_components_are_found() {
        let root = std::env::temp_dir().join(format!("bloom-autolink-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        let java = root.join("android/src/main/java/com/example");
        std::fs::create_dir_all(&java).unwrap();
        std::fs::write(
            java.join("ExamplePackage.kt"),
            "package com.example\n\nclass Helper\nclass ExamplePackage : BaseReactPackage() {\n}\n",
        )
        .unwrap();
        std::fs::create_dir_all(root.join("src")).unwrap();
        std::fs::write(
            root.join("src/ExampleNativeComponent.ts"),
            "export default codegenNativeComponent<NativeProps>('RNExample', {});\nexport const Other = codegenNativeComponent<P>(\"RNInner\", { interfaceOnly: true });\n",
        )
        .unwrap();
        assert_eq!(
            package_class(&root.join("android")),
            Some(("com.example".to_string(), "ExamplePackage".to_string()))
        );
        assert_eq!(component_descriptors(&root), ["RNExampleComponentDescriptor"]);
        let _ = std::fs::remove_dir_all(&root);
    }
}
