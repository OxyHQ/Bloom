//! `extern native "Name" { … }`: a Bloom native module's interface (ADR 0002, section 7).
//!
//! ```swift
//! extern native "BloomStorage" {
//!   func get(_ kind: String, _ name: String, _ key: String) -> String?
//!   func set(_ kind: String, _ name: String, _ key: String, _ value: String?)
//!   func keys(_ kind: String, _ name: String) -> [String]
//! }
//! ```
//!
//! The interface is written once, in Bloom. From it the toolchain writes two TS files:
//!
//! - **the spec**, `Native<Name>.ts`: React Native's codegen input (`Spec extends
//!   TurboModule`, `TurboModuleRegistry.get<Spec>('Name')`). The Android build runs RN's
//!   codegen over it, which writes the Java spec class the Kotlin module extends and the C++
//!   (JSI) glue Fabric's TurboModule manager calls; iOS's codegen writes the ObjC++ protocol
//!   the Swift module conforms to. So the Kotlin (Swift) side is type-checked against the
//!   same interface the Bloom side is.
//! - **the bridge**, `Native<Name>Bridge.ts`: what Bloom code imports (the lowering in
//!   `crate::externs`). It loads the TurboModule only when first called, so a web bundle or a
//!   Node test that never calls it never loads React Native, and it carries values in
//!   Bloom's forms (an absent optional is `undefined` in Bloom and `null` across the bridge).
//!
//! Every function is synchronous unless it is `async throws` (a `Promise` in the spec). A
//! TurboModule runs a `void` method asynchronously, so a synchronous function without a
//! result is carried as one that returns a `boolean` (`true`): the call blocks until the
//! native side has run it, and a write is seen by the read after it.

use crate::ast::*;

/// The import the lowering writes for `extern native "Name"`: the bridge, beside the file.
pub fn bridge_import(name: &str) -> String {
    format!("./Native{name}Bridge")
}

/// The spec's file name: `NativeBloomStorage.ts`.
pub fn spec_file(name: &str) -> String {
    format!("Native{name}.ts")
}

/// The bridge's file name: `NativeBloomStorageBridge.ts`.
pub fn bridge_file(name: &str) -> String {
    format!("Native{name}Bridge.ts")
}

/// A type the bridge carries.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Type {
    String,
    Bool,
    Number,
    Void,
    Array(Box<Type>),
    Optional(Box<Type>),
}

impl Type {
    fn ts(&self) -> String {
        match self {
            Type::String => "string".into(),
            Type::Bool => "boolean".into(),
            Type::Number => "number".into(),
            Type::Void => "void".into(),
            Type::Array(t) => format!("Array<{}>", t.ts()),
            Type::Optional(t) => format!("{} | null", t.ts()),
        }
    }

    /// The type in Bloom's TS forms (an absent optional is `undefined`).
    fn bloom_ts(&self) -> String {
        match self {
            Type::Array(t) => format!("readonly {}[]", t.bloom_ts()),
            Type::Optional(t) => format!("{} | undefined", t.bloom_ts()),
            other => other.ts(),
        }
    }
}

/// One function of the interface.
#[derive(Debug, Clone, PartialEq)]
pub struct Function {
    /// The native method's name (`@extern("…")`, else the function's).
    pub name: String,
    pub params: Vec<(String, Type)>,
    pub ret: Type,
    pub is_async: bool,
}

/// One `extern native` block.
#[derive(Debug, Clone, PartialEq)]
pub struct Module {
    pub name: String,
    pub functions: Vec<Function>,
}

fn type_of(t: &TypeExpr) -> Result<Type, String> {
    Ok(match &t.kind {
        TypeKind::Named { name, args } if args.is_empty() => match name.name.as_str() {
            "String" => Type::String,
            "Bool" => Type::Bool,
            "Int" | "Double" | "Float" => Type::Number,
            "Void" => Type::Void,
            other => return Err(format!("`{other}`")),
        },
        TypeKind::List(inner) => Type::Array(Box::new(type_of(inner)?)),
        TypeKind::Optional(inner) => Type::Optional(Box::new(type_of(inner)?)),
        _ => return Err("this type".into()),
    })
}

fn extern_name(item: &Item, fallback: &str) -> String {
    for attr in &item.modifiers.attrs {
        if attr.name.name == "extern"
            && let Some(arg) = attr.args.first()
            && let ExprKind::Str { parts, .. } = &arg.value.kind
            && let [StrPart::Text(text)] = parts.as_slice()
        {
            return text.clone();
        }
    }
    fallback.to_string()
}

/// The `extern native` blocks of `source` (parsed on its own), with what their types are not.
pub fn modules(source: &str) -> Result<Vec<Module>, String> {
    let (file, _, _) = crate::parse(source, "");
    let mut out = Vec::new();
    for item in &file.items {
        let ItemKind::Extern(block) = &item.kind else { continue };
        if !block.native {
            continue;
        }
        let mut functions = Vec::new();
        for inner in &block.items {
            let ItemKind::Fn(f) = &inner.kind else { continue };
            let what = |e: String| {
                format!(
                    "`{}.{}`: {e} does not cross a native bridge (it carries String, Bool, Int, Double, arrays and optionals of them)",
                    block.package.name, f.name.name
                )
            };
            let params = f
                .params
                .iter()
                .map(|p| Ok((p.name.name.clone(), type_of(&p.ty).map_err(what)?)))
                .collect::<Result<Vec<_>, String>>()?;
            let ret = match &f.ret {
                Some(t) => type_of(t).map_err(what)?,
                None => Type::Void,
            };
            functions.push(Function {
                name: extern_name(inner, &f.name.name),
                params,
                ret,
                is_async: f.is_async,
            });
        }
        out.push(Module { name: block.package.name.clone(), functions });
    }
    Ok(out)
}

const HEADER: &str = "// Generated by bloom from an `extern native` interface: regenerated on every build, never edited.\n";

/// The spec's return type: a promise for an async function, a boolean for a synchronous one
/// without a result (so the call blocks; see the module's docs).
fn spec_ret(f: &Function) -> String {
    match (&f.ret, f.is_async) {
        (ret, true) => format!("Promise<{}>", ret.ts()),
        (Type::Void, false) => "boolean".into(),
        (ret, false) => ret.ts(),
    }
}

/// React Native's codegen input for `module`.
pub fn spec(module: &Module) -> String {
    let mut out = String::from(HEADER);
    out.push_str("import type { TurboModule } from 'react-native';\nimport { TurboModuleRegistry } from 'react-native';\n\n");
    out.push_str("export interface Spec extends TurboModule {\n");
    for f in &module.functions {
        let params: Vec<String> = f.params.iter().map(|(n, t)| format!("{n}: {}", t.ts())).collect();
        out.push_str(&format!("  {}({}): {};\n", f.name, params.join(", "), spec_ret(f)));
    }
    out.push_str("}\n\n");
    out.push_str(&format!("export default TurboModuleRegistry.get<Spec>('{}');\n", module.name));
    out
}

/// A value of `t` from the bridge, in Bloom's form.
fn from_native(t: &Type, value: &str) -> String {
    match t {
        Type::Optional(_) => format!("{value} ?? undefined"),
        _ => value.to_string(),
    }
}

/// The bridge Bloom code imports for `module`.
pub fn bridge(module: &Module) -> String {
    let name = &module.name;
    let mut out = String::from(HEADER);
    out.push_str(&format!(
        "import type {{ Spec }} from './Native{name}';\n\ndeclare const require: (id: string) => unknown;\n\nlet native: Spec | undefined;\n\n/** The TurboModule, loaded on first use (a web bundle or a Node test never loads it). */\nfunction module(): Spec {{\n  if (!native) {{\n    const found = (require('./Native{name}') as {{ default: Spec | null }}).default;\n    if (!found) throw new Error('Bloom: the native module {name} is not in this build (bloom build android links it)');\n    native = found;\n  }}\n  return native;\n}}\n\n/** The native module is linked (always true in a `bloom build`; false on the web and in tests). */\nexport function isAvailable(): boolean {{\n  if (native) return true;\n  try {{\n    return module() !== undefined;\n  }} catch {{\n    return false;\n  }}\n}}\n"
    ));
    for f in &module.functions {
        let params: Vec<String> = f.params.iter().map(|(n, t)| format!("{n}: {}", t.bloom_ts())).collect();
        let args: Vec<String> = f
            .params
            .iter()
            .map(|(n, t)| if matches!(t, Type::Optional(_)) { format!("{n} ?? null") } else { n.clone() })
            .collect();
        let call = format!("module().{}({})", f.name, args.join(", "));
        let (ret, body) = match (&f.ret, f.is_async) {
            (ret, true) => (
                format!("Promise<{}>", ret.bloom_ts()),
                if matches!(ret, Type::Optional(_)) {
                    format!("return {call}.then((value) => value ?? undefined);")
                } else {
                    format!("return {call};")
                },
            ),
            (Type::Void, false) => ("void".into(), format!("{call};")),
            (ret, false) => (ret.bloom_ts(), format!("return {};", from_native(ret, &call))),
        };
        out.push_str(&format!(
            "\nexport function {}({}): {ret} {{\n  {body}\n}}\n",
            f.name,
            params.join(", ")
        ));
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    const STORAGE: &str = r#"extern native "BloomStorage" {
  func get(_ kind: String, _ name: String, _ key: String) -> String?
  func set(_ kind: String, _ name: String, _ key: String, _ value: String?)
  func keys(_ kind: String, _ name: String) -> [String]
  func flush() async throws -> Int
}
"#;

    #[test]
    fn an_interface_writes_the_codegen_spec() {
        let modules = modules(STORAGE).unwrap();
        assert_eq!(modules.len(), 1);
        let spec = spec(&modules[0]);
        assert!(spec.contains("export interface Spec extends TurboModule {"), "{spec}");
        assert!(spec.contains("  get(kind: string, name: string, key: string): string | null;"), "{spec}");
        // A synchronous call without a result returns a boolean, so it blocks.
        assert!(
            spec.contains("  set(kind: string, name: string, key: string, value: string | null): boolean;"),
            "{spec}"
        );
        assert!(spec.contains("  keys(kind: string, name: string): Array<string>;"), "{spec}");
        assert!(spec.contains("  flush(): Promise<number>;"), "{spec}");
        assert!(spec.ends_with("export default TurboModuleRegistry.get<Spec>('BloomStorage');\n"), "{spec}");
    }

    #[test]
    fn the_bridge_carries_bloom_forms_and_loads_lazily() {
        let bridge = bridge(&modules(STORAGE).unwrap()[0]);
        assert!(bridge.contains("import type { Spec } from './NativeBloomStorage';"), "{bridge}");
        assert!(!bridge.contains("from 'react-native'"), "{bridge}");
        assert!(bridge.contains("return module().get(kind, name, key) ?? undefined;"), "{bridge}");
        assert!(bridge.contains("module().set(kind, name, key, value ?? null);"), "{bridge}");
        assert!(bridge.contains("export function keys(kind: string, name: string): readonly string[]"), "{bridge}");
    }

    #[test]
    fn a_type_the_bridge_cannot_carry_is_named() {
        let error = modules("extern native \"X\" {\n  func f(_ a: Post) -> String\n}\n").unwrap_err();
        assert!(error.contains("`X.f`: `Post` does not cross a native bridge"), "{error}");
    }
}
