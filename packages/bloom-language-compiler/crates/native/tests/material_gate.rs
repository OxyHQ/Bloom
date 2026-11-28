//! The material gate (ADR 0003, step 3): `BloomMaterial` (`runtime/…/ui/Material.kt`) is the one
//! place the native runtime blurs, stretches, vibrates or draws the material's edge. Any other
//! runtime file that does fails here, so a component cannot grow a material of its own: it draws
//! through `bloomMaterial`, `bloomGlass` or `bloomBlur`.

use std::path::{Path, PathBuf};

/// What only the material may use, and why.
const MATERIAL_ONLY: &[(&str, &str)] = &[
    ("RenderEffect", "a blur or a shader effect"),
    ("createBlurEffect", "a blur"),
    ("BlurMaskFilter", "a blur"),
    ("Modifier.blur", "a blur"),
    (".blur(", "a blur"),
    ("innerShadow", "the material's edge"),
    ("dropShadow", "the material's shadow"),
    ("EdgeEffect", "an overscroll stretch"),
    ("verscroll", "an overscroll stretch"),
    ("GlassJelly", "the material's press stretch"),
    ("deformControl", "the material's press stretch"),
    ("deformMenu", "the material's press stretch"),
    ("performHapticFeedback", "a vibration"),
    ("HapticFeedback", "a vibration"),
    ("Vibrator", "a vibration"),
    ("VibrationEffect", "a vibration"),
    ("GlassFeedback", "a vibration"),
    ("GlassRenderer", "the lens engine's glass"),
    ("GlassBackdrop", "the lens engine's glass"),
];

/// The material itself.
const MATERIAL: &str = "Material.kt";

fn kotlin_files(dir: &Path, out: &mut Vec<PathBuf>) {
    for entry in std::fs::read_dir(dir).unwrap() {
        let path = entry.unwrap().path();
        if path.is_dir() {
            kotlin_files(&path, out);
        } else if path.extension().is_some_and(|e| e == "kt") {
            out.push(path);
        }
    }
}

#[test]
fn only_the_material_blurs_stretches_or_vibrates() {
    let runtime = Path::new(env!("CARGO_MANIFEST_DIR")).join("runtime");
    let mut files = Vec::new();
    kotlin_files(&runtime, &mut files);
    assert!(files.iter().any(|f| f.ends_with(MATERIAL)), "the runtime has no {MATERIAL}");
    let mut found = Vec::new();
    for file in &files {
        if file.file_name().is_some_and(|n| n == MATERIAL) {
            continue;
        }
        let text = std::fs::read_to_string(file).unwrap();
        for (number, line) in text.lines().enumerate() {
            let code = line.split("//").next().unwrap_or("");
            for (pattern, what) in MATERIAL_ONLY {
                if code.contains(pattern) {
                    found.push(format!(
                        "{}:{}: `{pattern}` ({what}) belongs to the material: draw through bloomMaterial, bloomGlass or bloomBlur",
                        file.strip_prefix(&runtime).unwrap_or(file).display(),
                        number + 1
                    ));
                }
            }
        }
    }
    assert!(found.is_empty(), "\n{}", found.join("\n"));
}

#[test]
fn the_material_draws_through_the_lens_engine_and_the_generated_edge() {
    let material = std::fs::read_to_string(
        Path::new(env!("CARGO_MANIFEST_DIR")).join("runtime/android/so/oxy/bloom/ui").join(MATERIAL),
    )
    .unwrap();
    for needed in [
        "so.oxy.bloom.glassmenu.motion.GlassJelly",
        "GlassFeedback.tick",
        "MaterialEdges.dark",
        "MaterialEdges.light",
    ] {
        assert!(material.contains(needed), "{MATERIAL} no longer uses {needed}");
    }
}
