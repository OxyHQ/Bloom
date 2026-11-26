//! `bloom bind <npm-package>` and `bloom check --tsc`.
//!
//! `bloom bind` declares a `.bindings` target for the package (at the newest
//! version past the 7-day quarantine, unless one is given), installs it, and
//! writes `Bindings/<Name>/<Name>.bloom` from its `.d.ts` with the compiler's
//! boundary reader. The file is then curated by hand: a second `bloom bind`
//! writes `.bloom/bindings/<Name>.bloom` instead, to compare against.
//!
//! `bloom check --tsc` compiles the binding modules and runs `tsc` over what
//! they emit: the only TS in a package that crosses into a JS package, so the
//! only place TypeScript has to agree with Bloom.

use bloom_lang::package::{self, TargetKind, split_npm_spec};

use crate::expo::{run_in, write_manifests};
use crate::project::{CheckOptions, Package, check_modules, write};

/// `@sentry/react-native` → `Sentry`; `left-pad` → `LeftPad`.
pub fn module_name(npm: &str) -> String {
    let base = match npm.strip_prefix('@').and_then(|s| s.split_once('/')) {
        Some((scope, _)) => scope,
        None => npm,
    };
    base.split(|c: char| !c.is_ascii_alphanumeric())
        .filter(|p| !p.is_empty())
        .map(|p| {
            let mut chars = p.chars();
            chars.next().map_or(String::new(), |c| c.to_ascii_uppercase().to_string() + chars.as_str())
        })
        .collect()
}

pub fn bind(package: &Package, spec: &str, name: Option<&str>) -> Result<bool, String> {
    let (npm, version) = split_npm_spec(spec);
    let version = match version {
        Some(v) => v.to_string(),
        None => crate::deps::newest(npm, None)?,
    };
    let name = name.map_or_else(|| module_name(npm), str::to_string);
    let existing = package.manifest.targets.iter().find(|t| t.name == name);
    let mut package = package.clone();
    match existing {
        Some(t) if !matches!(&t.kind, TargetKind::Bindings { npm: n } if split_npm_spec(n).0 == npm) => {
            return Err(format!("`{name}` is already a target of another kind: name the module with --name"));
        }
        Some(_) => {}
        None => {
            let entry = format!(".bindings(\"{name}\", npm: \"{npm}@{version}\")");
            let updated = package::with_target(&package.source, &entry)
                .ok_or("Package.bloom has no `targets: [ … ]` to add the binding module to")?;
            let manifest = package::parse(&updated, package::MANIFEST).map_err(|e| {
                format!("the edited manifest does not evaluate: {:?}", e.first().map(|d| &d.message))
            })?;
            write(&package.root.join(package::MANIFEST), &updated)?;
            package = Package { manifest, source: updated, ..package };
        }
    }
    write_manifests(&package)?;
    crate::deps::install(&package)?;
    let build = package.build_dir();
    let options = package.options(false);
    let binding = bloom_lang::bindgen::generate(npm, &version, &build.join("index.js"), &options)?;
    let file = package.root.join("Bindings").join(&name).join(format!("{name}.bloom"));
    let target = if file.exists() {
        package.dot().join("bindings").join(format!("{name}.bloom"))
    } else {
        file.clone()
    };
    write(&target, &binding.text)?;
    let shown = target.strip_prefix(&package.root).unwrap_or(&target).display().to_string();
    if target == file {
        println!("bloom: wrote {shown}, the binding module of {npm}@{version}");
    } else {
        println!(
            "bloom: {} is curated: the fresh binding is in {shown}",
            file.strip_prefix(&package.root).unwrap_or(&file).display()
        );
    }
    if !binding.skipped.is_empty() {
        println!("  not declared: {} (listed at the end of the file)", binding.skipped.len());
    }
    println!("  use it: add \"{name}\" to a target's dependencies in Package.bloom, and `import {name}`");
    Ok(true)
}

/// `tsc` over the binding modules' emitted TS.
pub fn check_tsc(package: &Package, options: &CheckOptions) -> Result<bool, String> {
    let bindings = package.targets_of(|k| matches!(k, TargetKind::Bindings { .. }));
    if bindings.is_empty() {
        println!("bloom: no binding modules: nothing crosses into TS");
        return Ok(true);
    }
    write_manifests(package)?;
    crate::deps::install(package)?;
    let checked = check_modules(package, options, true)?;
    if !checked.ok {
        return Ok(false);
    }
    let build = package.build_dir();
    let out = build.join("tsc");
    let _ = std::fs::remove_dir_all(&out);
    for index in &bindings {
        for (file, code) in checked.emitted.get(index).into_iter().flatten() {
            let rel = file.strip_prefix(&package.root).unwrap_or(file);
            // `X.bloom.ts`: what `import … from "./X.bloom"` resolves to.
            let mut path = out.join(rel).into_os_string();
            path.push(".ts");
            write(std::path::Path::new(&path), code)?;
        }
    }
    write(
        &build.join("tsconfig.tsc.json"),
        "{\n  \"extends\": \"./tsconfig.json\",\n  \"compilerOptions\": { \"noEmit\": true, \"skipLibCheck\": true, \"moduleResolution\": \"bundler\" },\n  \"include\": [\"tsc/**/*.ts\"]\n}\n",
    )?;
    write(
        &build.join("tsconfig.json"),
        "{\n  \"extends\": \"expo/tsconfig.base\",\n  \"compilerOptions\": { \"strict\": true }\n}\n",
    )?;
    match run_in(&build, "bun", &["x", "tsc", "-p", "tsconfig.tsc.json"]) {
        Ok(()) => {
            println!("bloom: tsc agrees with {} binding module(s)", bindings.len());
            Ok(true)
        }
        Err(_) => Ok(false),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn names_a_binding_module() {
        assert_eq!(module_name("@sentry/react-native"), "Sentry");
        assert_eq!(module_name("left-pad"), "LeftPad");
        assert_eq!(module_name("date-fns"), "DateFns");
    }
}
