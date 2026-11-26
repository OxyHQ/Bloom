//! The per-file cost of compiling, in process (no I/O, no process start):
//!
//! ```text
//! cargo run --release -p bloomc --example per_file -- <runs> <file.bloom|file.tsx>…
//! ```
//!
//! For each file, the median, p10 and p90 of `runs` compiles: a `.bloom` file
//! through `bloom_lang::compile` (parse, check, emit and the embedded pass), a
//! `.ts`/`.tsx` file through the embedded pass alone. One JSON line per file.

use std::time::Instant;

fn main() {
    let mut args = std::env::args().skip(1);
    let runs: usize = args.next().and_then(|n| n.parse().ok()).expect("usage: per_file <runs> <files…>");
    let options = bloom_lang::Options::default();
    for path in args {
        let source = std::fs::read_to_string(&path).expect("a readable file");
        let bloom = path.ends_with(".bloom");
        let mut samples: Vec<f64> = (0..runs)
            .map(|_| {
                let started = Instant::now();
                if bloom {
                    let output = bloom_lang::compile(&source, &path, &options);
                    assert!(output.diagnostics.is_empty(), "{}", output.diagnostics[0].rendered);
                    std::hint::black_box(output.code);
                } else {
                    std::hint::black_box(bloom_language_compiler::compile(&source, &path).code);
                }
                started.elapsed().as_secs_f64() * 1e6
            })
            .collect();
        samples.sort_by(f64::total_cmp);
        let at = |q: f64| samples[((samples.len() - 1) as f64 * q).round() as usize];
        println!(
            "{{\"file\":{path:?},\"runs\":{runs},\"medianUs\":{:.2},\"p10Us\":{:.2},\"p90Us\":{:.2}}}",
            at(0.5),
            at(0.1),
            at(0.9)
        );
    }
}
