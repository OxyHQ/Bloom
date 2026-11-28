//! The kotlin-compose backend on the bench package (`examples/NativeBench`): it checks, emits
//! with no construct left uncovered, and the Kotlin keeps the shapes ADR 0003 describes.

use std::path::Path;

fn bench() -> bloom_native::Program {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../examples/NativeBench");
    match bloom_native::load(&dir) {
        Ok(program) => program,
        Err(problems) => {
            panic!("{}", problems.iter().map(|p| p.message.clone()).collect::<Vec<_>>().join("\n"))
        }
    }
}

fn kotlin() -> String {
    let program = bench();
    let emitted = match bloom_native::emit(&program, bloom_native::Target::KotlinCompose) {
        Ok(files) => files,
        Err(problems) => {
            panic!("{}", problems.iter().map(|p| p.message.clone()).collect::<Vec<_>>().join("\n"))
        }
    };
    emitted.iter().map(|f| format!("// {}\n{}", f.path.display(), f.text)).collect()
}

#[test]
fn the_bench_emits_every_file() {
    let program = bench();
    let files: usize = program.modules.iter().map(|m| m.files.len()).sum();
    let emitted = bloom_native::emit(&program, bloom_native::Target::KotlinCompose).unwrap_or_default();
    assert_eq!(emitted.len(), files);
}

#[test]
fn values_are_data_classes_and_enums() {
    let kt = kotlin();
    assert!(kt.contains("data class Post(\n  override val id: String,"), "{kt}");
    assert!(
        kt.contains("enum class PrefKey {\n  pushEnabled, likes, boosts, follows, mentions, replies, quotes\n}")
    );
    assert!(kt.contains("sealed interface PostKind {\n  data object Text : PostKind\n  data class Image(val url: String, val aspect: Double) : PostKind"));
    // A type the program declares takes its extensions' members inside its class.
    assert!(kt.contains("  fun setting(key: PrefKey, on: Boolean): Prefs {"));
    assert!(kt.contains("  val age: String\n    get() {"));
}

#[test]
fn views_are_composables_with_state_and_effects() {
    let kt = kotlin();
    assert!(kt.contains(
        "@Composable\nfun PostRow(post: Post, onLike: (Post) -> Unit, modifier: Modifier = Modifier) {"
    ));
    assert!(kt.contains("var prefs by remember { mutableStateOf(Prefs()) }"));
    assert!(kt.contains("val scope = rememberCoroutineScope()"));
    assert!(kt.contains("suspend fun save(key: PrefKey, on: Boolean) {"));
    assert!(kt.contains("OnChange(prefs) { old, new ->"));
    assert!(kt.contains("when (val s1 = post.kind) {"));
    assert!(kt.contains("is PostKind.Image -> {\n          val url = s1.url"));
}

#[test]
fn modifiers_wrap_outward_as_compose_runs_inward() {
    let kt = kotlin();
    // `.padding(.horizontal, .lg).padding(.vertical, .sm)`: the last written is outermost.
    assert!(kt.contains("modifier = modifier.bloomPadding(Edge.vertical, Space.sm).bloomPadding(Edge.horizontal, Space.lg)"), "{kt}");
}

#[test]
fn the_android_project_is_written() {
    let program = bench();
    let dir = std::env::temp_dir().join(format!("bloom-native-test-{}", std::process::id()));
    bloom_native::android::write_project(&dir, &program, "so.bloom.test").expect("project");
    for file in [
        "settings.gradle.kts",
        "app/build.gradle.kts",
        "app/src/main/AndroidManifest.xml",
        "app/src/main/kotlin/so/bloom/test/MainActivity.kt",
        "app/src/main/kotlin/so/oxy/bloom/ui/Views.kt",
    ] {
        assert!(dir.join(file).is_file(), "{file}");
    }
    let manifest = std::fs::read_to_string(dir.join("app/src/main/AndroidManifest.xml")).unwrap_or_default();
    // aapt refuses `--` inside an XML comment.
    assert!(!manifest.split("<!--").skip(1).any(|c| c.split("-->").next().unwrap_or("").contains("--")));
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn swiftui_is_reported_not_built() {
    let program = bench();
    assert!(bloom_native::emit(&program, bloom_native::Target::SwiftUI).is_err());
}
