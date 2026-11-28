//! The colour engine in the runtime (`runtime/android/bloom/bloomthemeengine`) is what this
//! backend emits from `packages/bloom-theme-engine` today: a change to the engine, or to the
//! emitter, that leaves the runtime's copy behind fails here. `scripts/emit-runtime.sh` in that
//! package writes it again.

use std::path::Path;

#[test]
fn the_runtime_holds_the_engine_as_emitted() {
    let manifest = Path::new(env!("CARGO_MANIFEST_DIR"));
    let package = manifest.join("../../../bloom-theme-engine");
    let program = bloom_native::load_modules(&package, &["Math", "Core"], None).unwrap_or_else(|problems| {
        panic!("{}", problems.iter().map(|p| p.message.clone()).collect::<Vec<_>>().join("\n"))
    });
    let emitted = bloom_native::emit(&program, bloom_native::Target::KotlinCompose)
        .unwrap_or_else(|problems| panic!("{} construct(s) not covered", problems.len()));
    let shipped: std::collections::HashMap<_, _> =
        bloom_native::android::THEME_ENGINE.iter().copied().collect();
    let mut stale = Vec::new();
    let mut count = 0;
    for file in &emitted {
        count += 1;
        let path = file.path.to_string_lossy();
        match shipped.get(path.as_ref()) {
            Some(text) if *text == file.text => {}
            Some(_) => stale.push(format!("{path} differs")),
            None => stale.push(format!("{path} is not in THEME_ENGINE")),
        }
    }
    assert_eq!(count, shipped.len(), "THEME_ENGINE lists {} files, the engine emits {count}", shipped.len());
    assert!(
        stale.is_empty(),
        "run packages/bloom-theme-engine/scripts/emit-runtime.sh:\n{}",
        stale.join("\n")
    );
}
