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
//! The interface is written once, in Bloom. From it the toolchain writes TS files:
//!
//! - **the module spec**, `Native<Name>.ts`: React Native's codegen input (`Spec extends
//!   TurboModule`, `TurboModuleRegistry.get<Spec>('Name')`). The Android build runs RN's
//!   codegen over it, which writes the Java spec class the Kotlin module extends and the C++
//!   (JSI) glue Fabric's TurboModule manager calls; iOS's codegen writes the ObjC++ protocol
//!   the Swift module conforms to. So the Kotlin (Swift) side is type-checked against the
//!   same interface the Bloom side is.
//! - **a component spec per native view**, `<View>NativeComponent.ts` (below).
//! - **the bridge**, `Native<Name>Bridge.ts`: what Bloom code imports (the lowering in
//!   `crate::externs`). It loads the TurboModule (or the view) only when first used, so a
//!   web bundle or a Node test that never calls it never loads React Native, and it carries
//!   values in Bloom's forms (an absent optional is `undefined` in Bloom and `null` across
//!   the bridge).
//!
//! Every function is synchronous unless it is `async throws` (a `Promise` in the spec). A
//! TurboModule runs a `void` method asynchronously, so a synchronous function without a
//! result is carried as one that returns a `boolean` (`true`): the call blocks until the
//! native side has run it, and a write is seen by the read after it.
//!
//! ## Native views
//!
//! A function that returns `View` is a native view: a Fabric component, drawn by a Kotlin
//! view (and a Swift one with `bloom build ios`).
//!
//! ```swift
//! extern native "BloomImage" {
//!   @extern("BloomImageView")
//!   func imageView(
//!     source: String,
//!     contentFit: "cover" | "contain" | "fill" | "none" | "scale-down" = "cover",
//!     transition: Int = 0,
//!     onLoad: (({ width: Double, height: Double }) -> Void)? = nil
//!   ) -> View
//! }
//! ```
//!
//! - Its parameters are the view's props: `String`, `Bool`, `Int` (`Int32`), `Double`,
//!   `Float`, a union of strings (an enum prop, whose default is the parameter's, else the
//!   first), arrays and optionals of them.
//! - A closure parameter is an event the native side sends (its name starts with `on`). Its
//!   one parameter, a record, is the event's fields; `() -> Void` sends none.
//! - The component's name is `@extern("…")`'s, else the function's. Its spec is
//!   `<Name>NativeComponent.ts` (`codegenNativeComponent<NativeProps>('Name')`), from which
//!   the Android build's codegen writes the Java `<Name>ManagerInterface` and
//!   `<Name>ManagerDelegate` the Kotlin view manager implements, and the C++ props, event
//!   emitter and component descriptor Fabric draws it with.
//! - The bridge's function returns the view as an embedded element. It takes the space it
//!   is offered (as a SwiftUI representable does), so a `.frame()` sizes it. Where the
//!   build does not link it (the web, a test), it draws nothing.

use crate::ast::*;

/// The import the lowering writes for `extern native "Name"`: the bridge, beside the file.
pub fn bridge_import(name: &str) -> String {
    format!("./Native{name}Bridge")
}

/// The module spec's file name: `NativeBloomStorage.ts`.
pub fn spec_file(name: &str) -> String {
    format!("Native{name}.ts")
}

/// The bridge's file name: `NativeBloomStorageBridge.ts`.
pub fn bridge_file(name: &str) -> String {
    format!("Native{name}Bridge.ts")
}

/// A native view's component spec file name: `BloomImageViewNativeComponent.ts` (codegen
/// and React Native's Babel preset find a component's spec by this suffix).
pub fn component_file(view: &str) -> String {
    format!("{view}NativeComponent.ts")
}

/// A type the bridge carries.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Type {
    String,
    Bool,
    /// `Int`: a `number` in a module's spec, an `Int32` in a view's.
    Int,
    /// `Double`: a `number` in a module's spec, a `Double` in a view's.
    Number,
    /// `Float`: a `number` in a module's spec, a `Float` in a view's.
    Float,
    Void,
    Array(Box<Type>),
    Optional(Box<Type>),
    /// `"a" | "b"`: a view's enum prop.
    Strings(Vec<String>),
}

impl Type {
    /// The type in a module spec.
    fn ts(&self) -> String {
        match self {
            Type::String => "string".into(),
            Type::Bool => "boolean".into(),
            Type::Int | Type::Number | Type::Float => "number".into(),
            Type::Void => "void".into(),
            Type::Array(t) => format!("Array<{}>", t.ts()),
            Type::Optional(t) => format!("{} | null", t.ts()),
            Type::Strings(values) => strings(values),
        }
    }

    /// The type in a component spec (codegen's numeric types).
    fn component_ts(&self) -> String {
        match self {
            Type::Int => "CodegenTypes.Int32".into(),
            Type::Number => "CodegenTypes.Double".into(),
            Type::Float => "CodegenTypes.Float".into(),
            Type::Array(t) => format!("ReadonlyArray<{}>", t.component_ts()),
            Type::Optional(t) => t.component_ts(),
            other => other.ts(),
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

fn strings(values: &[String]) -> String {
    values.iter().map(|v| format!("'{v}'")).collect::<Vec<_>>().join(" | ")
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

/// A literal default of a view's prop (the native side's value when the prop is unset).
#[derive(Debug, Clone, PartialEq)]
pub enum Literal {
    Str(String),
    Int(i64),
    Number(f64),
    Bool(bool),
}

impl Literal {
    fn ts(&self) -> String {
        match self {
            Literal::Str(s) => format!("'{s}'"),
            Literal::Int(i) => i.to_string(),
            Literal::Number(n) => format!("{n:?}"),
            Literal::Bool(b) => b.to_string(),
        }
    }
}

/// What a view's prop carries.
#[derive(Debug, Clone, PartialEq)]
pub enum PropType {
    Value(Type),
    /// An event the native side sends, with its fields.
    Event(Vec<(String, Type)>),
}

/// One prop of a native view (a parameter of its function).
#[derive(Debug, Clone, PartialEq)]
pub struct Prop {
    pub name: String,
    pub ty: PropType,
    pub default: Option<Literal>,
}

/// A native view: a Fabric component.
#[derive(Debug, Clone, PartialEq)]
pub struct NativeView {
    /// The component's name (`@extern("…")`, else the function's): the bridge's export,
    /// the codegen spec's name and the Kotlin view manager's `NAME`.
    pub name: String,
    pub props: Vec<Prop>,
}

/// One `extern native` block.
#[derive(Debug, Clone, PartialEq)]
pub struct Module {
    pub name: String,
    pub functions: Vec<Function>,
    pub views: Vec<NativeView>,
}

impl Module {
    /// codegen's library type: `modules`, `components` or `all`.
    pub fn codegen_type(&self) -> &'static str {
        match (self.functions.is_empty(), self.views.is_empty()) {
            (false, true) | (true, true) => "modules",
            (true, false) => "components",
            (false, false) => "all",
        }
    }

    /// The component descriptors the app registers for this module's views.
    pub fn component_descriptors(&self) -> Vec<String> {
        self.views.iter().map(|v| format!("{}ComponentDescriptor", v.name)).collect()
    }

    /// codegen's inputs: the module spec (when it declares functions) and each view's
    /// component spec, as (file name, contents).
    pub fn specs(&self) -> Vec<(String, String)> {
        let mut out = Vec::new();
        if !self.functions.is_empty() {
            out.push((spec_file(&self.name), spec(self)));
        }
        for view in &self.views {
            out.push((component_file(&view.name), component_spec(view)));
        }
        out
    }

    /// Every generated file beside the interface: the specs, then the bridge.
    pub fn generated(&self) -> Vec<(String, String)> {
        let mut out = self.specs();
        out.push((bridge_file(&self.name), bridge(self)));
        out
    }
}

fn type_of(t: &TypeExpr) -> Result<Type, String> {
    Ok(match &t.kind {
        TypeKind::Named { name, args } if args.is_empty() => match name.name.as_str() {
            "String" => Type::String,
            "Bool" => Type::Bool,
            "Int" => Type::Int,
            "Double" => Type::Number,
            "Float" => Type::Float,
            "Void" => Type::Void,
            other => return Err(format!("`{other}`")),
        },
        TypeKind::List(inner) => Type::Array(Box::new(type_of(inner)?)),
        TypeKind::Optional(inner) => Type::Optional(Box::new(type_of(inner)?)),
        TypeKind::Strings(values) => Type::Strings(values.clone()),
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

/// Whether `t` is `View` (or `some View`): the function is a native view.
fn is_view(t: &TypeExpr) -> bool {
    matches!(&t.kind, TypeKind::Named { name, args } if args.is_empty() && name.name == "View")
}

fn literal(e: &Expr) -> Option<Literal> {
    Some(match &e.kind {
        ExprKind::Int(i) => Literal::Int(*i),
        ExprKind::Float(f) => Literal::Number(*f),
        ExprKind::Bool(b) => Literal::Bool(*b),
        ExprKind::Str { parts, .. } => match parts.as_slice() {
            [StrPart::Text(text)] => Literal::Str(text.clone()),
            [] => Literal::Str(String::new()),
            _ => return None,
        },
        ExprKind::Paren(inner) => return literal(inner),
        _ => return None,
    })
}

/// The event a closure parameter's type declares: its fields, or `None` when it is not a
/// closure.
fn event_of(t: &TypeExpr) -> Option<Result<Vec<(String, Type)>, String>> {
    let t = match &t.kind {
        TypeKind::Optional(inner) => inner,
        _ => t,
    };
    let TypeKind::Fn { params, ret, is_async } = &t.kind else { return None };
    let void = matches!(&ret.kind, TypeKind::Named { name, args } if args.is_empty() && name.name == "Void")
        || matches!(&ret.kind, TypeKind::Tuple(items) if items.is_empty());
    if *is_async || !void {
        return Some(Err("an event is a closure that returns `Void`".into()));
    }
    Some(match params.as_slice() {
        [] => Ok(Vec::new()),
        [only] => match &only.kind {
            TypeKind::Record(fields) => fields
                .iter()
                .map(|(name, ty)| match type_of(ty) {
                    Ok(Type::Void) | Ok(Type::Strings(_)) => Err(format!(
                        "the event field `{}` is a String, Bool, number or an array or optional of them",
                        name.name
                    )),
                    Ok(t) => Ok((name.name.clone(), t)),
                    Err(e) => Err(format!("the event field `{}`: {e}", name.name)),
                })
                .collect(),
            _ => {
                Err("an event's one parameter is a record of its fields (`({ width: Double }) -> Void`)"
                    .into())
            }
        },
        _ => {
            Err("an event takes one record of its fields (`({ width: Double, height: Double }) -> Void`)"
                .into())
        }
    })
}

fn view_of(block: &ExternModule, name: String, f: &FnDecl) -> Result<NativeView, String> {
    let what = |e: String| format!("the native view `{}.{}`: {e}", block.package.name, f.name.name);
    let mut props = Vec::new();
    for p in &f.params {
        let ty = match event_of(&p.ty) {
            Some(fields) => {
                if !p.name.name.starts_with("on") {
                    return Err(what(format!(
                        "the event `{}` is named `on…` (its native name is `top…`)",
                        p.name.name
                    )));
                }
                PropType::Event(fields.map_err(what)?)
            }
            None => {
                let ty = type_of(&p.ty).map_err(|e| {
                    what(format!(
                        "the prop `{}`: {e} is not a view prop (String, Bool, Int, Double, Float, a union of strings, arrays and optionals of them, or an `on…` event)",
                        p.name.name
                    ))
                })?;
                if ty == Type::Void {
                    return Err(what(format!("the prop `{}` is `Void`", p.name.name)));
                }
                PropType::Value(ty)
            }
        };
        let default = p.default.as_ref().and_then(literal);
        props.push(Prop { name: p.name.name.clone(), ty, default });
    }
    Ok(NativeView { name, props })
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
        let mut views = Vec::new();
        for inner in &block.items {
            let ItemKind::Fn(f) = &inner.kind else { continue };
            if f.ret.as_ref().is_some_and(is_view) {
                views.push(view_of(block, extern_name(inner, &f.name.name), f)?);
                continue;
            }
            let what = |e: String| {
                format!(
                    "`{}.{}`: {e} does not cross a native bridge (it carries String, Bool, Int, Double, arrays and optionals of them)",
                    block.package.name, f.name.name
                )
            };
            let params = f
                .params
                .iter()
                .map(|p| match type_of(&p.ty).map_err(what)? {
                    Type::Strings(_) => Err(what("a union of strings".into())),
                    t => Ok((p.name.name.clone(), t)),
                })
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
        out.push(Module { name: block.package.name.clone(), functions, views });
    }
    Ok(out)
}

const HEADER: &str =
    "// Generated by bloom from an `extern native` interface: regenerated on every build, never edited.\n";

/// The spec's return type: a promise for an async function, a boolean for a synchronous one
/// without a result (so the call blocks; see the module's docs).
fn spec_ret(f: &Function) -> String {
    match (&f.ret, f.is_async) {
        (ret, true) => format!("Promise<{}>", ret.ts()),
        (Type::Void, false) => "boolean".into(),
        (ret, false) => ret.ts(),
    }
}

/// React Native's codegen input for `module`'s functions.
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

/// The event payload type of an event prop: `Readonly<{ width: CodegenTypes.Double }>`.
fn event_payload(fields: &[(String, Type)]) -> String {
    if fields.is_empty() {
        return "Readonly<{}>".into();
    }
    let fields: Vec<String> = fields
        .iter()
        .map(|(n, t)| {
            let optional = if matches!(t, Type::Optional(_)) { "?" } else { "" };
            format!("{n}{optional}: {}", t.component_ts())
        })
        .collect();
    format!("Readonly<{{ {} }}>", fields.join("; "))
}

/// React Native's codegen input for one native view.
pub fn component_spec(view: &NativeView) -> String {
    let mut out = String::from(HEADER);
    out.push_str("import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';\n");
    out.push_str("import { codegenNativeComponent } from 'react-native';\n\n");
    out.push_str("export interface NativeProps extends ViewProps {\n");
    for prop in &view.props {
        let line = match &prop.ty {
            PropType::Event(fields) => {
                format!("{}?: CodegenTypes.DirectEventHandler<{}>", prop.name, event_payload(fields))
            }
            // An enum prop has a default: the parameter's, else its first value.
            PropType::Value(t) if enum_values(t).is_some() => {
                let values = enum_values(t).unwrap_or_default();
                let default = match &prop.default {
                    Some(Literal::Str(s)) => s.clone(),
                    _ => values.first().cloned().unwrap_or_default(),
                };
                format!("{}?: CodegenTypes.WithDefault<{}, '{default}'>", prop.name, strings(values))
            }
            PropType::Value(t) => match (&prop.default, t) {
                (Some(default), Type::Bool | Type::Int | Type::Number | Type::Float | Type::String) => {
                    format!(
                        "{}?: CodegenTypes.WithDefault<{}, {}>",
                        prop.name,
                        t.component_ts(),
                        default.ts()
                    )
                }
                (_, Type::Optional(_)) => format!("{}?: {}", prop.name, t.component_ts()),
                _ => format!("{}: {}", prop.name, t.component_ts()),
            },
        };
        out.push_str(&format!("  {line};\n"));
    }
    out.push_str("}\n\n");
    out.push_str(&format!(
        "export default codegenNativeComponent<NativeProps>('{}') as HostComponent<NativeProps>;\n",
        view.name
    ));
    out
}

/// The values of an enum prop (`"a" | "b"`, or an optional one).
fn enum_values(t: &Type) -> Option<&[String]> {
    match t {
        Type::Strings(values) => Some(values),
        Type::Optional(inner) => enum_values(inner),
        _ => None,
    }
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
    if !module.views.is_empty() {
        out.push_str("import { type ComponentType, createElement } from 'react';\nimport { type Child, Embed } from '@oxy.so/bloom-language';\n");
    }
    if !module.functions.is_empty() {
        out.push_str(&format!("import type {{ Spec }} from './Native{name}';\n"));
    }
    out.push_str("\ndeclare const require: (id: string) => unknown;\n");
    if !module.functions.is_empty() {
        out.push_str(&format!(
            "\nlet native: Spec | undefined;\n\n/** The TurboModule, loaded on first use (a web bundle or a Node test never loads it). */\nfunction module(): Spec {{\n  if (!native) {{\n    const found = (require('./Native{name}') as {{ default: Spec | null }}).default;\n    if (!found) throw new Error('Bloom: the native module {name} is not in this build (bloom build android links it)');\n    native = found;\n  }}\n  return native;\n}}\n\n/** The native module is linked (always true in a `bloom build`; false on the web and in tests). */\nexport function isAvailable(): boolean {{\n  if (native) return true;\n  try {{\n    return module() !== undefined;\n  }} catch {{\n    return false;\n  }}\n}}\n"
        ));
    }
    for f in &module.functions {
        let params: Vec<String> = f.params.iter().map(|(n, t)| format!("{n}: {}", t.bloom_ts())).collect();
        let args: Vec<String> = f
            .params
            .iter()
            .map(|(n, t)| match t {
                Type::Optional(_) => format!("{n} ?? null"),
                // Bloom's arrays are read-only; the native side does not write to them.
                Type::Array(_) => format!("{n} as {}", t.ts()),
                _ => n.clone(),
            })
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
    if !module.views.is_empty() {
        out.push_str(VIEW_HOST);
    }
    for view in &module.views {
        out.push_str(&view_bridge(view));
    }
    out
}

/// What every native view's bridge shares: the lazy load and the fill style.
const VIEW_HOST: &str = r#"
type Host = ComponentType<Record<string, unknown>>;

/** A native view takes the space it is offered (a `.frame()` sizes it). */
const FILL = { flexGrow: 1, alignSelf: 'stretch' } as const;

/** The native component `name`, or `null` where the build does not link it (the web, tests). */
function hostOf(name: string, load: () => unknown): Host | null {
  try {
    const { UIManager } = require('react-native') as {
      UIManager?: { hasViewManagerConfig?: (name: string) => boolean };
    };
    if (UIManager?.hasViewManagerConfig?.(name) !== true) return null;
    return (load() as { default: Host }).default;
  } catch {
    return null;
  }
}
"#;

fn view_bridge(view: &NativeView) -> String {
    let name = &view.name;
    let params: Vec<String> = view
        .props
        .iter()
        .map(|p| {
            let ty = match &p.ty {
                PropType::Value(t) => t.bloom_ts(),
                PropType::Event(fields) => {
                    let arg = if fields.is_empty() {
                        String::new()
                    } else {
                        let fields: Vec<String> = fields
                            .iter()
                            .map(|(n, t)| match t {
                                Type::Optional(_) => format!("readonly {n}?: {}", t.bloom_ts()),
                                _ => format!("readonly {n}: {}", t.bloom_ts()),
                            })
                            .collect();
                        format!("event: {{ {} }}", fields.join("; "))
                    };
                    format!("(({arg}) => void) | undefined")
                }
            };
            format!("{}: {ty}", p.name)
        })
        .collect();
    let props: Vec<String> = view
        .props
        .iter()
        .map(|p| match &p.ty {
            PropType::Event(fields) if fields.is_empty() => {
                format!("    {0}: {0} === undefined ? undefined : () => {0}(),", p.name)
            }
            PropType::Event(fields) => {
                let ty = fields
                    .iter()
                    .map(|(n, t)| format!("{n}: {}", t.bloom_ts()))
                    .collect::<Vec<_>>()
                    .join("; ");
                format!(
                    "    {0}: {0} === undefined ? undefined : (e: {{ nativeEvent: {{ {ty} }} }}) => {0}(e.nativeEvent),",
                    p.name
                )
            }
            PropType::Value(_) => format!("    {},", p.name),
        })
        .collect();
    format!(
        r#"
let {name}Host: Host | null | undefined;

/** The native view `{name}` (a Fabric component). It draws nothing where the build does not link it. */
export function {name}({params}): Child {{
  if ({name}Host === undefined) {name}Host = hostOf('{name}', () => require('./{component}'));
  if ({name}Host === null) return Embed(null);
  return Embed(
    createElement({name}Host, {{
      style: FILL,
{props}
    }}) as Parameters<typeof Embed>[0],
  );
}}
"#,
        params = params.join(", "),
        props = props.join("\n"),
        component = component_file(name).trim_end_matches(".ts"),
    )
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
        assert_eq!(modules[0].codegen_type(), "modules");
        assert!(modules[0].component_descriptors().is_empty());
    }

    #[test]
    fn the_bridge_carries_bloom_forms_and_loads_lazily() {
        let bridge = bridge(&modules(STORAGE).unwrap()[0]);
        assert!(bridge.contains("import type { Spec } from './NativeBloomStorage';"), "{bridge}");
        assert!(!bridge.contains("from 'react-native'"), "{bridge}");
        assert!(!bridge.contains("from 'react'"), "{bridge}");
        assert!(bridge.contains("return module().get(kind, name, key) ?? undefined;"), "{bridge}");
        assert!(bridge.contains("module().set(kind, name, key, value ?? null);"), "{bridge}");
        assert!(
            bridge.contains("export function keys(kind: string, name: string): readonly string[]"),
            "{bridge}"
        );
    }

    #[test]
    fn a_type_the_bridge_cannot_carry_is_named() {
        let error = modules("extern native \"X\" {\n  func f(_ a: Post) -> String\n}\n").unwrap_err();
        assert!(error.contains("`X.f`: `Post` does not cross a native bridge"), "{error}");
    }

    const IMAGE: &str = r#"extern native "BloomImage" {
  @extern("BloomImageView")
  private func imageView(
    source: String?,
    contentFit: "cover" | "contain" | "fill" = "contain",
    transition: Int = 0,
    tint: String? = nil,
    blur: Double,
    onLoad: (({ width: Double, height: Double }) -> Void)? = nil,
    onDone: () -> Void
  ) -> View
  func prefetch(_ urls: [String]) async throws -> Bool
}
"#;

    #[test]
    fn a_view_writes_its_component_spec() {
        let module = &modules(IMAGE).unwrap()[0];
        assert_eq!(module.functions.len(), 1);
        assert_eq!(module.views.len(), 1);
        assert_eq!(module.codegen_type(), "all");
        assert_eq!(module.component_descriptors(), ["BloomImageViewComponentDescriptor"]);
        let files: Vec<String> = module.generated().into_iter().map(|(n, _)| n).collect();
        assert_eq!(
            files,
            ["NativeBloomImage.ts", "BloomImageViewNativeComponent.ts", "NativeBloomImageBridge.ts"]
        );
        let spec = component_spec(&module.views[0]);
        assert!(spec.contains("import { codegenNativeComponent } from 'react-native';"), "{spec}");
        assert!(spec.contains("export interface NativeProps extends ViewProps {"), "{spec}");
        assert!(spec.contains("  source?: string;"), "{spec}");
        assert!(
            spec.contains(
                "  contentFit?: CodegenTypes.WithDefault<'cover' | 'contain' | 'fill', 'contain'>;"
            ),
            "{spec}"
        );
        assert!(spec.contains("  transition?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>;"), "{spec}");
        assert!(spec.contains("  tint?: string;"), "{spec}");
        assert!(spec.contains("  blur: CodegenTypes.Double;"), "{spec}");
        assert!(
            spec.contains(
                "  onLoad?: CodegenTypes.DirectEventHandler<Readonly<{ width: CodegenTypes.Double; height: CodegenTypes.Double }>>;"
            ),
            "{spec}"
        );
        assert!(spec.contains("  onDone?: CodegenTypes.DirectEventHandler<Readonly<{}>>;"), "{spec}");
        assert!(
            spec.ends_with(
                "export default codegenNativeComponent<NativeProps>('BloomImageView') as HostComponent<NativeProps>;\n"
            ),
            "{spec}"
        );
    }

    #[test]
    fn a_views_bridge_embeds_the_component_lazily() {
        let bridge = bridge(&modules(IMAGE).unwrap()[0]);
        assert!(bridge.contains("import { type Child, Embed } from '@oxy.so/bloom-language';"), "{bridge}");
        assert!(bridge.contains(
            "export function BloomImageView(source: string | undefined, contentFit: 'cover' | 'contain' | 'fill', transition: number, tint: string | undefined, blur: number, onLoad: ((event: { readonly width: number; readonly height: number }) => void) | undefined, onDone: (() => void) | undefined): Child {"
        ), "{bridge}");
        assert!(
            bridge.contains("hostOf('BloomImageView', () => require('./BloomImageViewNativeComponent'))"),
            "{bridge}"
        );
        assert!(bridge.contains("    onLoad: onLoad === undefined ? undefined : (e: { nativeEvent: { width: number; height: number } }) => onLoad(e.nativeEvent),"), "{bridge}");
        assert!(
            bridge.contains("    onDone: onDone === undefined ? undefined : () => onDone(),"),
            "{bridge}"
        );
        // The module's functions still cross the TurboModule.
        assert!(
            bridge.contains("export function prefetch(urls: readonly string[]): Promise<boolean> {"),
            "{bridge}"
        );
        assert!(bridge.contains("return module().prefetch(urls as Array<string>);"), "{bridge}");
    }

    #[test]
    fn what_a_view_cannot_carry_is_named() {
        let error = modules("extern native \"X\" {\n  func v(post: Post) -> View\n}\n").unwrap_err();
        assert!(
            error.contains("the native view `X.v`: the prop `post`: `Post` is not a view prop"),
            "{error}"
        );
        let error = modules("extern native \"X\" {\n  func v(loaded: () -> Void) -> View\n}\n").unwrap_err();
        assert!(error.contains("the event `loaded` is named `on…`"), "{error}");
        let error =
            modules("extern native \"X\" {\n  func v(onLoad: (Double) -> Void) -> View\n}\n").unwrap_err();
        assert!(error.contains("an event's one parameter is a record of its fields"), "{error}");
        let error = modules("extern native \"X\" {\n  func f(_ fit: \"a\" | \"b\")\n}\n").unwrap_err();
        assert!(error.contains("`X.f`: a union of strings does not cross"), "{error}");
    }
}
