//! The Gradle project around the kotlin-compose output: an app module with the emitted
//! sources, Bloom's Kotlin runtime (`runtime/android/`), and an activity that sets the
//! package's `App` view as its content. Compose Foundation only (no Material), R8 on, and
//! `profileinstaller` so the Compose libraries' baseline profiles are installed with the app.

use std::path::Path;

use crate::Program;

/// The runtime's sources, embedded so the binary writes a complete project.
const RUNTIME: &[(&str, &str)] = &[
    ("so/oxy/bloom/std/Std.kt", include_str!("../runtime/android/so/oxy/bloom/std/Std.kt")),
    ("so/oxy/bloom/std/Externs.kt", include_str!("../runtime/android/so/oxy/bloom/std/Externs.kt")),
    ("so/oxy/bloom/std/TimeExterns.kt", include_str!("../runtime/android/so/oxy/bloom/std/TimeExterns.kt")),
    ("so/oxy/bloom/std/Builtins.kt", include_str!("../runtime/android/so/oxy/bloom/std/Builtins.kt")),
    ("so/oxy/bloom/ui/Tokens.kt", include_str!("../runtime/android/so/oxy/bloom/ui/Tokens.kt")),
    (
        "so/oxy/bloom/ui/BloomTheme.generated.kt",
        include_str!("../runtime/android/so/oxy/bloom/ui/BloomTheme.generated.kt"),
    ),
    ("so/oxy/bloom/ui/Views.kt", include_str!("../runtime/android/so/oxy/bloom/ui/Views.kt")),
    ("so/oxy/bloom/ui/FlexRow.kt", include_str!("../runtime/android/so/oxy/bloom/ui/FlexRow.kt")),
    ("so/oxy/bloom/ui/FlexColumn.kt", include_str!("../runtime/android/so/oxy/bloom/ui/FlexColumn.kt")),
    ("so/oxy/bloom/ui/Grid.kt", include_str!("../runtime/android/so/oxy/bloom/ui/Grid.kt")),
    ("so/oxy/bloom/ui/Tabs.kt", include_str!("../runtime/android/so/oxy/bloom/ui/Tabs.kt")),
    ("so/oxy/bloom/ui/Video.kt", include_str!("../runtime/android/so/oxy/bloom/ui/Video.kt")),
    ("so/oxy/bloom/ui/Modifiers.kt", include_str!("../runtime/android/so/oxy/bloom/ui/Modifiers.kt")),
    ("so/oxy/bloom/ui/Image.kt", include_str!("../runtime/android/so/oxy/bloom/ui/Image.kt")),
    ("so/oxy/bloom/ui/Icons.kt", include_str!("../runtime/android/so/oxy/bloom/ui/Icons.kt")),
    ("so/oxy/bloom/ui/Material.kt", include_str!("../runtime/android/so/oxy/bloom/ui/Material.kt")),
    ("so/oxy/bloom/color/Hct.kt", include_str!("../runtime/android/so/oxy/bloom/color/Hct.kt")),
];

/// The lens engine the runtime's material draws through (bloom-lens's `android-engine`, free of
/// React Native): written beside the runtime, and replaced by the engine's own Gradle project
/// (`:oxy.so-bloom-lens-engine`) in an app that links `@oxy.so/bloom-lens` (`bloom build`'s
/// `:bloom-islands`), so its classes are in the app once.
pub const ENGINE_PACKAGE: &str = "so/oxy/bloom/glassmenu";
const ENGINE: &[(&str, &str)] = &[
    (
        "so/oxy/bloom/glassmenu/backdrop/GlassBackdrop.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/backdrop/GlassBackdrop.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/backdrop/GlassLens.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/backdrop/GlassLens.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/chrome/StaticGlassCache.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/chrome/StaticGlassCache.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/field/GlassFieldTexture.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/field/GlassFieldTexture.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/field/GlassGaussianField.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/field/GlassGaussianField.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/field/GlassShapes.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/field/GlassShapes.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/field/RoundedField.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/field/RoundedField.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/field/RoundedUnion.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/field/RoundedUnion.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/motion/GlassJelly.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/motion/GlassJelly.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/motion/GlassSpring.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/motion/GlassSpring.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/overlay/GlassFeedback.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/overlay/GlassFeedback.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/records/GlassAbsorbRecord.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/records/GlassAbsorbRecord.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/records/GlassMenuConfigRecord.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/records/GlassMenuConfigRecord.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/records/GlassShrinkRecord.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/records/GlassShrinkRecord.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/records/GlassTriggerConfigRecord.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/records/GlassTriggerConfigRecord.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/render/GlassRecipe.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/render/GlassRecipe.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/render/GlassRenderer.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/render/GlassRenderer.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/render/GlassShaders.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/render/GlassShaders.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/render/GlassStill.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/render/GlassStill.kt"
        ),
    ),
    (
        "so/oxy/bloom/glassmenu/render/GlassSurfaceState.kt",
        include_str!(
            "../../../../bloom-lens/android-engine/src/main/java/so/oxy/bloom/glassmenu/render/GlassSurfaceState.kt"
        ),
    ),
];

/// The versions the project builds with: React Native 0.88's AGP, and Compose and Kotlin
/// releases past the 7-day supply-chain quarantine.
const AGP: &str = "9.2.1";
const KOTLIN: &str = "2.2.10";
const COMPOSE: &str = "1.12.1";
const ACTIVITY: &str = "1.11.0";
const PROFILEINSTALLER: &str = "1.4.0";
const COROUTINES: &str = "1.10.2";
/// Media3, the version expo-video ships (one ExoPlayer in an app that has both).
const MEDIA3: &str = "1.9.1";

/// The Kotlin runtime's sources, as files under a source root (`so/oxy/bloom/ui/Views.kt`).
pub fn runtime_sources() -> Vec<crate::Emitted> {
    RUNTIME
        .iter()
        .chain(ENGINE)
        .map(|(path, text)| crate::Emitted { path: path.into(), text: (*text).to_string() })
        .collect()
}

fn write(path: &Path, text: &str) -> Result<(), String> {
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    }
    std::fs::write(path, text).map_err(|e| format!("{}: {e}", path.display()))
}

/// The module whose `App` view is the activity's content: the app target, by convention the
/// module named like the package.
fn app_module(program: &Program) -> String {
    program
        .modules
        .iter()
        .find(|m| m.name == program.name)
        .or_else(|| program.modules.iter().find(|m| m.files.iter().any(|f| f.source.contains("struct App:"))))
        .map(|m| m.name.clone())
        .unwrap_or_else(|| program.name.clone())
}

pub fn write_project(dir: &Path, program: &Program, id: &str) -> Result<(), String> {
    let header = "// Generated by bloom-native --target kotlin-compose. Do not edit.\n";
    write(
        &dir.join("settings.gradle.kts"),
        &format!(
            "{header}pluginManagement {{\n  repositories {{\n    google()\n    mavenCentral()\n    gradlePluginPortal()\n  }}\n}}\n\ndependencyResolutionManagement {{\n  repositories {{\n    google()\n    mavenCentral()\n  }}\n}}\n\nrootProject.name = \"{}Compose\"\ninclude(\":app\")\n",
            program.name
        ),
    )?;
    write(
        &dir.join("build.gradle.kts"),
        &format!(
            "{header}plugins {{\n  id(\"com.android.application\") version \"{AGP}\" apply false\n  id(\"org.jetbrains.kotlin.android\") version \"{KOTLIN}\" apply false\n  id(\"org.jetbrains.kotlin.plugin.compose\") version \"{KOTLIN}\" apply false\n}}\n"
        ),
    )?;
    write(
        &dir.join("gradle.properties"),
        "org.gradle.jvmargs=-Xmx3072m\nandroid.useAndroidX=true\nandroid.builtInKotlin=false\nandroid.newDsl=false\nkotlin.code.style=official\n",
    )?;
    write(
        &dir.join("gradle/wrapper/gradle-wrapper.properties"),
        "distributionBase=GRADLE_USER_HOME\ndistributionPath=wrapper/dists\ndistributionUrl=https\\://services.gradle.org/distributions/gradle-9.4.1-bin.zip\nzipStoreBase=GRADLE_USER_HOME\nzipStorePath=wrapper/dists\n",
    )?;
    write(
        &dir.join("app/build.gradle.kts"),
        &format!(
            r#"{header}plugins {{
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
  id("org.jetbrains.kotlin.plugin.compose")
}}

android {{
  namespace = "{id}"
  compileSdk = 37
  defaultConfig {{
    applicationId = "{id}"
    minSdk = 26
    targetSdk = 36
    versionCode = 1
    versionName = "0.1.0"
  }}
  buildTypes {{
    release {{
      isMinifyEnabled = true
      isShrinkResources = true
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
      // The bench signs with the debug key; `bloom build` would use the app's keystore.
      signingConfig = signingConfigs.getByName("debug")
    }}
  }}
  compileOptions {{
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }}
  buildFeatures {{ compose = true }}
  packaging {{ resources {{ excludes += "/META-INF/{{AL2.0,LGPL2.1}}" }} }}
}}

kotlin {{
  compilerOptions {{ jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) }}
}}

dependencies {{
  implementation("androidx.activity:activity-compose:{ACTIVITY}")
  implementation("androidx.compose.runtime:runtime:{COMPOSE}")
  implementation("androidx.compose.ui:ui:{COMPOSE}")
  implementation("androidx.compose.foundation:foundation:{COMPOSE}")
  implementation("androidx.profileinstaller:profileinstaller:{PROFILEINSTALLER}")
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:{COROUTINES}")
  implementation("androidx.media3:media3-exoplayer:{MEDIA3}")
  implementation("androidx.media3:media3-exoplayer-hls:{MEDIA3}")
}}
"#
        ),
    )?;
    write(
        &dir.join("app/src/main/AndroidManifest.xml"),
        r#"<?xml version="1.0" encoding="utf-8"?>
<!-- Generated by bloom-native (target kotlin-compose). Do not edit. -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.INTERNET" />
  <application android:label="@string/app_name" android:allowBackup="false" android:supportsRtl="true" android:theme="@style/AppTheme" android:enableOnBackInvokedCallback="true">
    <activity android:name=".MainActivity" android:exported="true" android:launchMode="singleTask" android:configChanges="keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode|smallestScreenSize" android:windowSoftInputMode="adjustResize">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>
  </application>
</manifest>
"#,
    )?;
    write(
        &dir.join("app/src/main/res/values/strings.xml"),
        &format!(
            "<resources>\n  <string name=\"app_name\">{} Compose</string>\n</resources>\n",
            program.name
        ),
    )?;
    write(
        &dir.join("app/src/main/res/values/styles.xml"),
        "<resources>\n  <style name=\"AppTheme\" parent=\"android:Theme.Material.Light.NoActionBar\">\n    <item name=\"android:windowBackground\">@android:color/white</item>\n  </style>\n</resources>\n",
    )?;
    let app_package = crate::kotlin::package_of(&program.name, &app_module(program));
    let id_dir: std::path::PathBuf = id.split('.').collect();
    write(
        &dir.join("app/src/main/kotlin").join(id_dir).join("MainActivity.kt"),
        &format!(
            "{header}package {id}\n\nimport android.os.Bundle\nimport androidx.activity.ComponentActivity\nimport androidx.activity.compose.setContent\nimport androidx.activity.enableEdgeToEdge\nimport {app_package}.App\nimport so.oxy.bloom.ui.BloomThemeProvider\n\nclass MainActivity : ComponentActivity() {{\n  override fun onCreate(savedInstanceState: Bundle?) {{\n    enableEdgeToEdge()\n    super.onCreate(savedInstanceState)\n    setContent {{ BloomThemeProvider {{ App() }} }}\n  }}\n}}\n"
        ),
    )?;
    for (path, text) in RUNTIME.iter().chain(ENGINE) {
        write(&dir.join("app/src/main/kotlin").join(path), text)?;
    }
    Ok(())
}
