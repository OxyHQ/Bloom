//! Source maps: bloomc writes its own (v3) JSON, which a reader decodes to the
//! marks the emitter left; and the upstream over-read it avoids, as a repro.

use oxc_sourcemap::SourceMap;

/// The map of a compiled module decodes, and points into the `.bloom` source.
#[test]
fn the_map_decodes_to_the_source() {
    let source = "/// A \"quoted\" doc\nfn double(x: Int) -> Int {\n  x * 2\n}\n";
    let output = bloom_lang::compile(source, "a.bloom", &bloom_lang::Options::default());
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics);
    let map = SourceMap::from_json_string(output.map.as_deref().expect("a map")).expect("valid JSON");
    assert_eq!(map.get_sources().map(|s| s.to_string()).collect::<Vec<_>>(), vec!["a.bloom"]);
    assert_eq!(map.get_source_contents().next().map(|s| s.map(|s| s.to_string())), Some(Some(source.into())));
    let lines: Vec<u32> = map.get_tokens().map(|t| t.get_src_line()).collect();
    assert!(lines.contains(&1) && lines.contains(&2), "{lines:?}");
    let code_line = output.code.lines().position(|l| l.contains("x * 2")).expect("the body") as u32;
    assert!(map.get_tokens().any(|t| t.get_dst_line() == code_line && t.get_src_line() == 2));
}

/// `oxc_sourcemap` 9.0.0's `to_json_string` escapes strings with
/// `escape-simd` 0.1.1 (through `json-escape-simd` 3.1.3), whose AVX2
/// `format_string` reads 32 bytes past the end of a short string (a 17-byte
/// file name): a heap-buffer-overflow read under AddressSanitizer. Ignored:
/// it is undefined behaviour, so it runs only where it is caught (a release
/// build: the debug build takes another path):
///
/// ```text
/// RUSTFLAGS=-Zsanitizer=address cargo +nightly test --release -p bloom_lang --target x86_64-unknown-linux-gnu \
///   --test sourcemap -- --ignored
/// ```
#[test]
#[ignore]
fn upstream_json_escape_over_read() {
    let mut builder = oxc_sourcemap::SourceMapBuilder::default();
    let id = builder.add_source_and_content("tsx/rows/Row0.tsx", "x");
    builder.add_token(0, 0, 0, 0, Some(id), None);
    let json = builder.into_sourcemap().to_json_string();
    assert!(json.contains("Row0"));
}
