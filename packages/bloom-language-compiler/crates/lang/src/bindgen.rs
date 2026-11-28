//! `bloom bind <npm-package>`: a binding module generated from the package's
//! `.d.ts`, through the same boundary reader the checker uses (`crate::ts`).
//!
//! The output is an `extern module` (ADR 0002, section 4) with every export
//! the reader can type: functions (`async throws` for a promise), constants,
//! and the TS interfaces they name, as structs. What it cannot type in Bloom is
//! `Foreign<"…">`, which only binding modules may write; React components are
//! listed for a view to wrap. The file is generated once and then curated.

use std::collections::{BTreeMap, BTreeSet};

use rustc_hash::FxHashMap as HashMap;
use std::path::Path;

use crate::Options;
use crate::types::{DefKind, Display, Ty};

/// What `bloom bind` writes, and what it left out.
#[derive(Debug, Clone)]
pub struct Binding {
    pub text: String,
    /// Exports the module does not declare, with why.
    pub skipped: Vec<(String, String)>,
}

/// Reads `npm` (resolved from the file `from`, in the generated build
/// directory) and writes its binding module.
pub fn generate(npm: &str, version: &str, from: &Path, options: &Options) -> Result<Binding, String> {
    let path = crate::ts::resolve(from, npm, options)
        .ok_or_else(|| format!("cannot find TS declarations for {npm} (is it installed, with types?)"))?;
    let file = crate::ts::read(&path).ok_or_else(|| format!("cannot read {}", path.display()))?;
    let names = crate::modules::exports_of(from, npm, options);
    let mut defs = Vec::new();
    let mut named = HashMap::default();
    let mut reads = BTreeSet::new();
    let mut functions = Vec::new();
    let mut skipped = Vec::new();
    let mut used = BTreeSet::new();
    for name in &names {
        if !valid_name(name) {
            skipped.push((name.clone(), "not a Bloom name".into()));
            continue;
        }
        let mut mapper = crate::ts::Mapper {
            defs: &mut defs,
            options,
            named: &mut named,
            reads: &mut reads,
            module: None,
        };
        let Some(mapped) = mapper.export(&file, name, name, 0) else {
            skipped.push((name.clone(), "its declaration could not be read".into()));
            continue;
        };
        if mapped.component.is_some() {
            skipped.push((
                name.clone(),
                "a React component: wrap it in a view outside the extern module".into(),
            ));
            continue;
        }
        match mapped.value {
            Some(Ty::Fn(f)) => {
                let params: Vec<String> = f
                    .params
                    .iter()
                    .enumerate()
                    .map(|(i, p)| {
                        let pname =
                            p.name.clone().filter(|n| valid_name(n)).unwrap_or_else(|| format!("arg{i}"));
                        let ty = bloom_type(&p.ty, &defs, &mut used);
                        let ty =
                            if p.optional && !matches!(p.ty, Ty::Option(_)) { format!("{ty}?") } else { ty };
                        if p.rest { format!("_ ..{pname}: [{ty}]") } else { format!("_ {pname}: {ty}") }
                    })
                    .collect();
                let (prefix, ret) = match &f.ret {
                    Ty::Promise(inner) => ("async throws", inner.as_ref().clone()),
                    other => ("", other.clone()),
                };
                let ret = if matches!(&ret, Ty::Unit) || matches!(&ret, Ty::Tuple(t) if t.is_empty()) {
                    String::new()
                } else {
                    format!(" -> {}", bloom_type(&ret, &defs, &mut used))
                };
                let effects = if prefix.is_empty() { String::new() } else { format!(" {prefix}") };
                functions.push(format!("  public func {name}({}){effects}{ret}", params.join(", ")));
            }
            Some(value) => {
                functions.push(format!("  public let {name}: {}", bloom_type(&value, &defs, &mut used)));
            }
            None if mapped.ty.is_some() => {
                // A type alone: declared below when a signature names it.
                if let Some(Ty::Adt(def, _)) = mapped.ty {
                    used.insert(def);
                }
            }
            None => skipped.push((name.clone(), "neither a value nor a type".into())),
        }
    }
    // The structs the signatures name, each once, by name.
    let mut structs: BTreeMap<String, String> = BTreeMap::new();
    let mut pending: Vec<usize> = used.iter().copied().collect();
    let mut seen = BTreeSet::new();
    while let Some(def) = pending.pop() {
        if !seen.insert(def) {
            continue;
        }
        let Some(d) = defs.get(def) else { continue };
        let DefKind::Struct(fields) = &d.kind else { continue };
        let mut nested = BTreeSet::new();
        let lines: Vec<String> = fields
            .iter()
            .filter(|f| valid_name(&f.name))
            .map(|f| format!("    public var {}: {}", f.name, bloom_type(&f.ty, &defs, &mut nested)))
            .collect();
        pending.extend(nested);
        let generics =
            if d.generics.is_empty() { String::new() } else { format!("<{}>", d.generics.join(", ")) };
        structs.insert(
            d.name.clone(),
            format!("  public struct {}{generics} {{\n{}\n  }}", d.name, lines.join("\n")),
        );
    }
    let mut text = format!(
        "// Generated by `bloom bind {npm}@{version}`, then curated: rename with\n\
         // `@extern(\"jsName\") public func bloomName(…)`, and remove what the app does not use.\n\
         // This module is the only place `{npm}` crosses into Bloom; `bloom check --tsc` checks it.\n\
         extern module \"{npm}\" {{\n"
    );
    for s in structs.values() {
        text.push_str(s);
        text.push_str("\n\n");
    }
    text.push_str(&functions.join("\n"));
    text.push_str("\n}\n");
    if !skipped.is_empty() {
        text.push_str("\n// Not declared:\n");
        for (name, why) in &skipped {
            text.push_str(&format!("//   {name}: {why}\n"));
        }
    }
    Ok(Binding { text, skipped })
}

fn valid_name(name: &str) -> bool {
    name.chars().next().is_some_and(|c| c.is_ascii_alphabetic() || c == '_')
        && name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_')
        && !crate::KEYWORDS.contains(&name)
        && name != "default"
}

/// `ty` as a binding module writes it; `used` collects the structs it names.
fn bloom_type(ty: &Ty, defs: &[crate::types::Def], used: &mut BTreeSet<usize>) -> String {
    match ty {
        Ty::Foreign(text) if text.is_empty() => "Foreign<\"unknown\">".into(),
        Ty::Foreign(text) => format!("Foreign<\"{}\">", text.replace('"', "'")),
        Ty::List(t) => format!("[{}]", bloom_type(t, defs, used)),
        Ty::Map(t) => format!("[String: {}]", bloom_type(t, defs, used)),
        Ty::Option(t) if matches!(**t, Ty::Fn(_)) => format!("({})?", bloom_type(t, defs, used)),
        Ty::Option(t) => format!("{}?", bloom_type(t, defs, used)),
        Ty::Result(a, b) => format!("Result<{}, {}>", bloom_type(a, defs, used), bloom_type(b, defs, used)),
        Ty::Promise(t) => format!("Promise<{}>", bloom_type(t, defs, used)),
        Ty::Tuple(items) if !items.is_empty() => {
            let items: Vec<String> = items.iter().map(|t| bloom_type(t, defs, used)).collect();
            format!("({})", items.join(", "))
        }
        Ty::Fn(f) => {
            let params: Vec<String> = f.params.iter().map(|p| bloom_type(&p.ty, defs, used)).collect();
            let asynchronous = if f.is_async { "async " } else { "" };
            format!("{asynchronous}({}) -> {}", params.join(", "), bloom_type(&f.ret, defs, used))
        }
        Ty::Adt(def, args) => {
            used.insert(*def);
            let name = defs.get(*def).map_or("Foreign<\"unknown\">".to_string(), |d| d.name.clone());
            if args.is_empty() {
                name
            } else {
                let args: Vec<String> = args.iter().map(|t| bloom_type(t, defs, used)).collect();
                format!("{name}<{}>", args.join(", "))
            }
        }
        Ty::Unknown | Ty::Var(_) => "Foreign<\"unknown\">".into(),
        other => Display { ty: other, defs }.to_string(),
    }
}
