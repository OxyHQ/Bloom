//! `cargo run --example compile -- <file> [native|web]`: print the compiled
//! module, its CSS and its diagnostics.

use bloom_language_compiler::{Platform, compile};

fn main() {
    let mut args = std::env::args().skip(1);
    let path = args.next().expect("usage: compile <file> [native|web]");
    let platform = match args.next().as_deref() {
        Some("web") => Platform::Web,
        _ => Platform::Native,
    };
    let source = std::fs::read_to_string(&path).expect("readable source file");
    let output = compile(&source, &path, platform);
    for diagnostic in &output.diagnostics {
        eprintln!("{}\n", diagnostic.rendered);
    }
    print!("{}", output.code);
    if !output.css.is_empty() {
        println!("\n/* CSS */\n{}", output.css);
    }
}
