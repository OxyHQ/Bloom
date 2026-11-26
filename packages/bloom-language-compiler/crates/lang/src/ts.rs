//! The foreign boundary (spec 4.7): a TS module's declarations, read with
//! Oxc from its `.d.ts` (or `.ts`/`.tsx` source), mapped to Bloom types where
//! they map. Anything else is `Foreign`, never `any`.

use std::cell::RefCell;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::rc::Rc;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    BindingPattern, Declaration, ExportDefaultDeclarationKind, FormalParameters, ImportDeclarationSpecifier,
    PropertyKey, Statement, TSLiteral, TSSignature, TSTupleElement, TSType, TSTypeName,
    TSTypeOperatorOperator, TSTypeParameterDeclaration,
};
use oxc_parser::Parser;
use oxc_span::SourceType;

use crate::Options;
use crate::types::{Def, DefKind, FieldDef, FieldDefault, FnTy, Origin, ParamTy, StrSet, Ty};

// ---- the summary of a TS file ---------------------------------------------

#[derive(Debug, Clone)]
pub enum TsType {
    Number,
    String,
    Boolean,
    Void,
    Undefined,
    Null,
    Any,
    Unknown,
    Never,
    StrLit(String),
    BoolLit,
    Array(Box<TsType>),
    Tuple(Vec<TsType>),
    Union(Vec<TsType>),
    /// A named type (`Promise`, `React.ReactNode`, an interface) and its arguments.
    Ref(String, Vec<TsType>),
    Object(Vec<TsMember>),
    Fn(Box<TsFn>),
    /// Anything else: foreign.
    Other,
}

#[derive(Debug, Clone)]
pub struct TsMember {
    pub name: String,
    pub optional: bool,
    pub ty: TsType,
}

#[derive(Debug, Clone)]
pub struct TsFn {
    pub type_params: Vec<String>,
    pub params: Vec<TsParam>,
    pub ret: Option<TsType>,
}

#[derive(Debug, Clone)]
pub struct TsParam {
    pub name: String,
    pub ty: Option<TsType>,
    pub optional: bool,
    pub rest: bool,
}

#[derive(Debug, Clone)]
pub enum TsDecl {
    Fn(TsFn),
    /// `const x: T` (`None`: no annotation).
    Var(Option<TsType>),
    Interface {
        params: Vec<String>,
        members: Vec<TsMember>,
        extends: Vec<TsType>,
    },
    Alias {
        params: Vec<String>,
        ty: TsType,
    },
    /// A class, an enum, a namespace: foreign.
    Other,
}

#[derive(Debug, Clone)]
pub enum Export {
    Local(String),
    From(String, String),
}

#[derive(Debug, Default)]
pub struct TsFile {
    pub path: PathBuf,
    /// A `.tsx` source: an uppercase function there is a component.
    pub tsx: bool,
    pub decls: HashMap<String, TsDecl>,
    pub exports: HashMap<String, Export>,
    /// `export * from "…"`.
    pub stars: Vec<String>,
    /// Local name → (specifier, imported name).
    pub imports: HashMap<String, (String, String)>,
}

thread_local! {
    static FILES: RefCell<HashMap<PathBuf, Rc<TsFile>>> = RefCell::new(HashMap::new());
}

/// Reads (once per process) and summarises a TS file.
pub fn read(path: &Path) -> Option<Rc<TsFile>> {
    if let Some(file) = FILES.with(|files| files.borrow().get(path).cloned()) {
        return Some(file);
    }
    let text = std::fs::read_to_string(path).ok()?;
    let file = Rc::new(summarise(path, &text));
    FILES.with(|files| files.borrow_mut().insert(path.to_path_buf(), file.clone()));
    Some(file)
}

fn summarise(path: &Path, text: &str) -> TsFile {
    let allocator = Allocator::default();
    let name = path.to_string_lossy();
    let source_type = if name.ends_with(".d.ts") {
        SourceType::d_ts()
    } else {
        SourceType::from_path(path).unwrap_or_else(|_| SourceType::ts())
    };
    let parsed = Parser::new(&allocator, text, source_type).parse();
    let mut file = TsFile { path: path.to_path_buf(), tsx: name.ends_with(".tsx"), ..TsFile::default() };
    let reader = Reader;
    for statement in &parsed.program.body {
        reader.statement(statement, &mut file, false);
    }
    file
}

struct Reader;

impl Reader {
    fn statement(&self, statement: &Statement, file: &mut TsFile, exported: bool) {
        match statement {
            Statement::ImportDeclaration(import) => {
                for specifier in import.specifiers.iter().flatten() {
                    let (local, imported) = match specifier {
                        ImportDeclarationSpecifier::ImportSpecifier(s) => {
                            (s.local.name.to_string(), s.imported.name().to_string())
                        }
                        ImportDeclarationSpecifier::ImportDefaultSpecifier(s) => {
                            (s.local.name.to_string(), "default".into())
                        }
                        ImportDeclarationSpecifier::ImportNamespaceSpecifier(s) => {
                            (s.local.name.to_string(), "*".into())
                        }
                    };
                    file.imports.insert(
                        local,
                        (import.source.value.as_str().unwrap_or_default().to_string(), imported),
                    );
                }
            }
            Statement::ExportDeclaration(export) => self.declaration(&export.declaration, file, true),
            Statement::ExportNamedDeclaration(export) => {
                for specifier in &export.specifiers {
                    file.exports.insert(
                        specifier.exported.name().to_string(),
                        Export::Local(specifier.local.name().to_string()),
                    );
                }
            }
            Statement::ExportFromDeclaration(export) => {
                for specifier in &export.specifiers {
                    file.exports.insert(
                        specifier.exported.name().to_string(),
                        Export::From(
                            export.source.value.as_str().unwrap_or_default().to_string(),
                            specifier.local.name().to_string(),
                        ),
                    );
                }
            }
            Statement::ExportAllDeclaration(export) => match &export.exported {
                Some(name) => {
                    file.exports.insert(
                        name.name().to_string(),
                        Export::From(
                            export.source.value.as_str().unwrap_or_default().to_string(),
                            "*".into(),
                        ),
                    );
                }
                None => file.stars.push(export.source.value.as_str().unwrap_or_default().to_string()),
            },
            Statement::ExportDefaultDeclaration(export) => match &export.declaration {
                ExportDefaultDeclarationKind::FunctionDeclaration(function) => {
                    let name = function.id.as_ref().map_or("default".to_string(), |id| id.name.to_string());
                    file.decls.insert(
                        name.clone(),
                        TsDecl::Fn(self.function(
                            &function.type_parameters,
                            &function.params,
                            function.return_type.as_ref().map(|t| &t.type_annotation),
                        )),
                    );
                    file.exports.insert("default".into(), Export::Local(name));
                }
                ExportDefaultDeclarationKind::Identifier(identifier) => {
                    file.exports.insert("default".into(), Export::Local(identifier.name.to_string()));
                }
                _ => {
                    file.decls.insert("default".into(), TsDecl::Other);
                    file.exports.insert("default".into(), Export::Local("default".into()));
                }
            },
            _ => {
                if let Some(declaration) = statement.as_declaration() {
                    self.declaration(declaration, file, exported);
                }
            }
        }
    }

    fn declaration(&self, declaration: &Declaration, file: &mut TsFile, exported: bool) {
        let add = |file: &mut TsFile, name: String, decl: TsDecl| {
            if exported {
                file.exports.insert(name.clone(), Export::Local(name.clone()));
            }
            // A function's first overload is the one Bloom reads.
            if !(matches!(decl, TsDecl::Fn(_)) && file.decls.contains_key(&name)) {
                file.decls.insert(name, decl);
            }
        };
        match declaration {
            Declaration::FunctionDeclaration(function) => {
                if let Some(id) = &function.id {
                    let decl = TsDecl::Fn(self.function(
                        &function.type_parameters,
                        &function.params,
                        function.return_type.as_ref().map(|t| &t.type_annotation),
                    ));
                    add(file, id.name.to_string(), decl);
                }
            }
            Declaration::VariableDeclaration(variables) => {
                for declarator in &variables.declarations {
                    if let BindingPattern::BindingIdentifier(id) = &declarator.id {
                        let ty =
                            declarator.type_annotation.as_ref().map(|t| self.ty(&t.type_annotation)).or_else(
                                || {
                                    // `export const X = function/arrow` with typed parameters: read the arrow.
                                    match declarator.init.as_ref() {
                                        Some(oxc_ast::ast::Expression::ArrowFunctionExpression(arrow)) => {
                                            Some(TsType::Fn(Box::new(self.function(
                                                &arrow.type_parameters,
                                                &arrow.params,
                                                arrow.return_type.as_ref().map(|t| &t.type_annotation),
                                            ))))
                                        }
                                        _ => None,
                                    }
                                },
                            );
                        add(file, id.name.to_string(), TsDecl::Var(ty));
                    }
                }
            }
            Declaration::TSInterfaceDeclaration(interface) => {
                let members = self.members(&interface.body.body);
                let extends = interface
                    .extends
                    .iter()
                    .map(|heritage| {
                        let args = heritage
                            .type_arguments
                            .as_ref()
                            .map(|a| a.params.iter().map(|t| self.ty(t)).collect())
                            .unwrap_or_default();
                        TsType::Ref(type_name(&heritage.type_name), args)
                    })
                    .collect();
                let name = interface.id.name.to_string();
                // Declaration merging: a second `interface X` adds members.
                if let Some(TsDecl::Interface { members: existing, .. }) = file.decls.get_mut(&name) {
                    existing.extend(members);
                    if exported {
                        file.exports.insert(name.clone(), Export::Local(name));
                    }
                    return;
                }
                add(
                    file,
                    name,
                    TsDecl::Interface { params: type_params(&interface.type_parameters), members, extends },
                );
            }
            Declaration::TSTypeAliasDeclaration(alias) => {
                add(
                    file,
                    alias.id.name.to_string(),
                    TsDecl::Alias {
                        params: type_params(&alias.type_parameters),
                        ty: self.ty(&alias.type_annotation),
                    },
                );
            }
            Declaration::ClassDeclaration(class) => {
                if let Some(id) = &class.id {
                    add(file, id.name.to_string(), TsDecl::Other);
                }
            }
            Declaration::TSEnumDeclaration(enumeration) => {
                add(file, enumeration.id.name.to_string(), TsDecl::Other)
            }
            _ => {}
        }
    }

    fn function(
        &self,
        type_parameters: &Option<oxc_allocator::Box<TSTypeParameterDeclaration>>,
        params: &FormalParameters,
        ret: Option<&TSType>,
    ) -> TsFn {
        let mut out = Vec::new();
        for (index, param) in params.items.iter().enumerate() {
            let name = match &param.pattern {
                BindingPattern::BindingIdentifier(id) => id.name.to_string(),
                _ => format!("arg{index}"),
            };
            out.push(TsParam {
                name,
                ty: param.type_annotation.as_ref().map(|t| self.ty(&t.type_annotation)),
                optional: param.optional || param.initializer.is_some(),
                rest: false,
            });
        }
        if let Some(rest) = &params.rest {
            let name = match &rest.rest.argument {
                BindingPattern::BindingIdentifier(id) => id.name.to_string(),
                _ => "rest".into(),
            };
            out.push(TsParam {
                name,
                ty: rest.type_annotation.as_ref().map(|t| self.ty(&t.type_annotation)),
                optional: true,
                rest: true,
            });
        }
        TsFn { type_params: type_params(type_parameters), params: out, ret: ret.map(|t| self.ty(t)) }
    }

    fn members(&self, signatures: &[TSSignature]) -> Vec<TsMember> {
        let mut members = Vec::new();
        for signature in signatures {
            match signature {
                TSSignature::TSPropertySignature(property) => {
                    let Some(name) = key_name(&property.key) else { continue };
                    let ty = property
                        .type_annotation
                        .as_ref()
                        .map_or(TsType::Any, |t| self.ty(&t.type_annotation));
                    members.push(TsMember { name, optional: property.optional, ty });
                }
                TSSignature::TSMethodSignature(method) => {
                    let Some(name) = key_name(&method.key) else { continue };
                    let function = self.function(
                        &method.type_parameters,
                        &method.params,
                        method.return_type.as_ref().map(|t| &t.type_annotation),
                    );
                    if members.iter().any(|m: &TsMember| m.name == name) {
                        continue;
                    }
                    members.push(TsMember {
                        name,
                        optional: method.optional,
                        ty: TsType::Fn(Box::new(function)),
                    });
                }
                TSSignature::TSIndexSignature(index) => {
                    let value = self.ty(&index.type_annotation.type_annotation);
                    members.push(TsMember { name: "[index]".into(), optional: false, ty: value });
                }
                _ => {}
            }
        }
        members
    }

    fn ty(&self, ty: &TSType) -> TsType {
        match ty {
            TSType::TSNumberKeyword(_) => TsType::Number,
            TSType::TSStringKeyword(_) => TsType::String,
            TSType::TSBooleanKeyword(_) => TsType::Boolean,
            TSType::TSVoidKeyword(_) => TsType::Void,
            TSType::TSUndefinedKeyword(_) => TsType::Undefined,
            TSType::TSNullKeyword(_) => TsType::Null,
            TSType::TSAnyKeyword(_) => TsType::Any,
            TSType::TSUnknownKeyword(_) => TsType::Unknown,
            TSType::TSNeverKeyword(_) => TsType::Never,
            TSType::TSLiteralType(literal) => match &literal.literal {
                TSLiteral::StringLiteral(s) => {
                    TsType::StrLit(s.value.as_str().unwrap_or_default().to_string())
                }
                TSLiteral::BooleanLiteral(_) => TsType::BoolLit,
                _ => self.other(),
            },
            TSType::TSArrayType(array) => TsType::Array(Box::new(self.ty(&array.element_type))),
            TSType::TSTypeOperatorType(operator) if operator.operator == TSTypeOperatorOperator::Readonly => {
                self.ty(&operator.type_annotation)
            }
            TSType::TSParenthesizedType(inner) => self.ty(&inner.type_annotation),
            TSType::TSTupleType(tuple) => {
                let mut items = Vec::new();
                for element in &tuple.element_types {
                    match element {
                        TSTupleElement::TSOptionalType(_) | TSTupleElement::TSRestType(_) => {
                            return self.other();
                        }
                        other => match other.as_ts_type() {
                            Some(t) => items.push(self.ty(t)),
                            None => return self.other(),
                        },
                    }
                }
                TsType::Tuple(items)
            }
            TSType::TSUnionType(union) => TsType::Union(union.types.iter().map(|t| self.ty(t)).collect()),
            TSType::TSTypeReference(reference) => {
                let args = reference
                    .type_arguments
                    .as_ref()
                    .map(|a| a.params.iter().map(|t| self.ty(t)).collect())
                    .unwrap_or_default();
                TsType::Ref(type_name(&reference.type_name), args)
            }
            TSType::TSTypeLiteral(literal) => {
                let members = self.members(&literal.members);
                if let [TsMember { name, ty, .. }] = members.as_slice()
                    && name == "[index]"
                {
                    return TsType::Ref("Record".into(), vec![TsType::String, ty.clone()]);
                }
                TsType::Object(members)
            }
            TSType::TSFunctionType(function) => TsType::Fn(Box::new(self.function(
                &function.type_parameters,
                &function.params,
                Some(&function.return_type.type_annotation),
            ))),
            _ => self.other(),
        }
    }

    fn other(&self) -> TsType {
        TsType::Other
    }
}

fn type_params(declaration: &Option<oxc_allocator::Box<TSTypeParameterDeclaration>>) -> Vec<String> {
    declaration
        .as_ref()
        .map(|d| d.params.iter().map(|p| p.name.name.to_string()).collect())
        .unwrap_or_default()
}

fn type_name(name: &TSTypeName) -> String {
    match name {
        TSTypeName::IdentifierReference(id) => id.name.to_string(),
        TSTypeName::QualifiedName(q) => format!("{}.{}", type_name(&q.left), q.right.name),
        TSTypeName::ThisExpression(_) => "this".into(),
    }
}

fn key_name(key: &PropertyKey) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(id) => Some(id.name.to_string()),
        PropertyKey::StringLiteral(s) => Some(s.value.as_str().unwrap_or_default().to_string()),
        _ => None,
    }
}

// ---- module resolution -----------------------------------------------------

/// The file a specifier names, from the importing file: relative paths, the
/// `paths` map, then `node_modules` (`types`, `.d.ts`, `@types`).
pub fn resolve(from: &Path, specifier: &str, options: &Options) -> Option<PathBuf> {
    let dir = from.parent().unwrap_or(Path::new("."));
    if specifier.starts_with("./") || specifier.starts_with("../") {
        return with_extensions(&dir.join(specifier));
    }
    let root = options.root.clone().unwrap_or_else(|| dir.to_path_buf());
    let configured;
    let paths: Vec<(&String, &Vec<String>)> = if options.paths.is_empty() {
        configured = tsconfig_paths(&root);
        configured.iter().map(|(k, v)| (k, v)).collect()
    } else {
        options.paths.iter().collect()
    };
    for (pattern, targets) in paths {
        let rest = match pattern.strip_suffix('*') {
            Some(prefix) => specifier.strip_prefix(prefix),
            None => (pattern == specifier).then_some(""),
        };
        let Some(rest) = rest else { continue };
        for target in targets {
            if let Some(found) = with_extensions(&root.join(target.replace('*', rest))) {
                return Some(found);
            }
        }
    }
    let (package, sub) = split_package(specifier);
    let mut search: Vec<PathBuf> = dir.ancestors().map(Path::to_path_buf).collect();
    search.extend(root.ancestors().map(Path::to_path_buf));
    for base in search {
        for package_dir in [
            base.join("node_modules").join(package),
            base.join("node_modules/@types").join(types_name(package)),
        ] {
            if !package_dir.is_dir() {
                continue;
            }
            if let Some(found) = in_package(&package_dir, sub) {
                return Some(found);
            }
        }
    }
    None
}

/// A `paths` map: each pattern with its targets.
type Paths = Rc<Vec<(String, Vec<String>)>>;

thread_local! {
    static TSCONFIG: RefCell<HashMap<PathBuf, Paths>> = RefCell::new(HashMap::new());
}

/// `compilerOptions.paths` of the root's `tsconfig.json`, targets joined to its `baseUrl`;
/// read without a JSON parser (keys and string arrays only).
fn tsconfig_paths(root: &Path) -> Paths {
    if let Some(found) = TSCONFIG.with(|c| c.borrow().get(root).cloned()) {
        return found;
    }
    let text = std::fs::read_to_string(root.join("tsconfig.json")).unwrap_or_default();
    let base = json_field(&text, "baseUrl").unwrap_or(".").to_string();
    let mut out = Vec::new();
    if let Some(at) = text.find("\"paths\"") {
        let rest = &text[at + 7..];
        if let (Some(open), Some(close)) = (rest.find('{'), rest.find('}')) {
            let body = &rest[open + 1..close.max(open + 1)];
            for entry in body.split(']') {
                let mut strings = entry.split('"').skip(1).step_by(2);
                if let Some(key) = strings.next() {
                    let targets: Vec<String> = strings.map(|t| format!("{base}/{t}")).collect();
                    if !targets.is_empty() {
                        out.push((key.to_string(), targets));
                    }
                }
            }
        }
    }
    let out = Rc::new(out);
    TSCONFIG.with(|c| c.borrow_mut().insert(root.to_path_buf(), out.clone()));
    out
}

fn split_package(specifier: &str) -> (&str, &str) {
    let mut slashes = specifier.match_indices('/').map(|(i, _)| i);
    let end = if specifier.starts_with('@') { slashes.nth(1) } else { slashes.next() };
    match end {
        Some(end) => (&specifier[..end], &specifier[end + 1..]),
        None => (specifier, ""),
    }
}

/// `@scope/name` is `scope__name` under `@types`.
fn types_name(package: &str) -> String {
    package.strip_prefix('@').map_or_else(|| package.to_string(), |scoped| scoped.replace('/', "__"))
}

fn in_package(dir: &Path, sub: &str) -> Option<PathBuf> {
    let manifest = std::fs::read_to_string(dir.join("package.json")).unwrap_or_default();
    if sub.is_empty() {
        for field in ["types", "typings"] {
            if let Some(path) = json_field(&manifest, field)
                && let Some(found) = with_extensions(&dir.join(path))
            {
                return Some(found);
            }
        }
        if let Some(found) = with_extensions(&dir.join("index")) {
            return Some(found);
        }
        return json_field(&manifest, "source").and_then(|path| with_extensions(&dir.join(path)));
    }
    // `exports["./sub"].types`, read without a JSON parser: the first `types` after the key.
    let key = format!("\"./{sub}\"");
    if let Some(at) = manifest.find(&key)
        && let Some(path) = json_field(&manifest[at..], "types")
        && let Some(found) = with_extensions(&dir.join(path))
    {
        return Some(found);
    }
    with_extensions(&dir.join(sub))
}

/// The string value of the first `"field": "…"` in `json`.
fn json_field<'j>(json: &'j str, field: &str) -> Option<&'j str> {
    let key = format!("\"{field}\"");
    let at = json.find(&key)? + key.len();
    let rest = json[at..].trim_start().strip_prefix(':')?.trim_start().strip_prefix('"')?;
    rest.split('"').next()
}

fn with_extensions(base: &Path) -> Option<PathBuf> {
    let text = base.to_string_lossy();
    let is_file = |p: &Path| p.is_file();
    if (text.ends_with(".ts") || text.ends_with(".tsx")) && is_file(base) {
        return Some(base.to_path_buf());
    }
    let stem = text.strip_suffix(".js").or_else(|| text.strip_suffix(".mjs")).unwrap_or(&text).to_string();
    for extension in [".d.ts", ".ts", ".tsx"] {
        let candidate = PathBuf::from(format!("{stem}{extension}"));
        if is_file(&candidate) {
            return Some(candidate);
        }
    }
    for index in ["index.d.ts", "index.ts", "index.tsx"] {
        let candidate = base.join(index);
        if is_file(&candidate) {
            return Some(candidate);
        }
    }
    None
}

// ---- mapping to Bloom types -------------------------------------------------

/// What a TS name maps to: a value's type, a type, or both (an interface and a const).
#[derive(Debug, Clone, Default)]
pub struct Mapped {
    pub value: Option<Ty>,
    pub ty: Option<Ty>,
    /// A component: a function from props to an element.
    pub component: Option<Ty>,
}

pub struct Mapper<'m> {
    pub defs: &'m mut Vec<Def>,
    pub options: &'m Options,
    /// (file, declaration name) → its mapped type, so a recursive interface maps once.
    pub named: &'m mut HashMap<(PathBuf, String), Ty>,
}

/// The type parameters in scope while mapping a generic declaration.
type Scope = Vec<String>;

const REACT_ELEMENTS: &[&str] = &[
    "ReactNode",
    "ReactElement",
    "JSX.Element",
    "React.ReactNode",
    "React.ReactElement",
    "React.JSX.Element",
    "Element",
];
const COMPONENT_TYPES: &[&str] = &[
    "ComponentType",
    "FC",
    "FunctionComponent",
    "React.ComponentType",
    "React.FC",
    "React.FunctionComponent",
    "NamedExoticComponent",
    "React.NamedExoticComponent",
    "MemoExoticComponent",
    "React.MemoExoticComponent",
];

impl Mapper<'_> {
    /// `name` as `file` exports it; `path` is how emitted TS names its value (`useAuth`).
    pub fn export(&mut self, file: &Rc<TsFile>, name: &str, path: &str, depth: usize) -> Option<Mapped> {
        if depth > 8 {
            return None;
        }
        let local = match file.exports.get(name) {
            Some(Export::Local(local)) => local.clone(),
            Some(Export::From(specifier, imported)) => {
                let target = read(&resolve(&file.path, specifier, self.options)?)?;
                return self.export(&target, imported, path, depth + 1);
            }
            None => {
                if file.decls.contains_key(name)
                    && file.path.to_string_lossy().ends_with(".d.ts")
                    && file.exports.is_empty()
                {
                    name.to_string()
                } else {
                    for star in file.stars.clone() {
                        if let Some(target) = resolve(&file.path, &star, self.options).and_then(|p| read(&p))
                            && let Some(found) = self.export(&target, name, path, depth + 1)
                        {
                            return Some(found);
                        }
                    }
                    return None;
                }
            }
        };
        self.local(file, &local, path, depth)
    }

    fn local(&mut self, file: &Rc<TsFile>, name: &str, path: &str, depth: usize) -> Option<Mapped> {
        let Some(decl) = file.decls.get(name).cloned() else {
            // A re-export of an import (`import { x } from "y"; export { x }`).
            let (specifier, imported) = file.imports.get(name)?.clone();
            let target = read(&resolve(&file.path, &specifier, self.options)?)?;
            return self.export(&target, &imported, path, depth + 1);
        };
        let mut mapped = Mapped::default();
        match decl {
            TsDecl::Fn(function) => {
                if is_component_fn(file, name, &function) {
                    let props = function.params.first().and_then(|p| p.ty.clone());
                    let props = props.map_or(Ty::Unit, |props| {
                        self.ty(file, &props, &Vec::new(), &format!("Parameters<typeof {path}>[0]"), depth)
                    });
                    mapped.component = Some(props);
                } else {
                    mapped.value =
                        Some(self.function(file, &function, &Vec::new(), &format!("typeof {path}"), depth));
                }
            }
            TsDecl::Var(Some(ty)) => {
                if let TsType::Ref(reference, args) = &ty
                    && COMPONENT_TYPES.contains(&reference.as_str())
                {
                    let props = args.first().map_or(Ty::Unit, |p| {
                        self.ty(file, p, &Vec::new(), &format!("React.ComponentProps<typeof {path}>"), depth)
                    });
                    mapped.component = Some(props);
                    return Some(mapped);
                }
                mapped.value = Some(self.ty(file, &ty, &Vec::new(), &format!("typeof {path}"), depth));
            }
            TsDecl::Var(None) => mapped.value = Some(Ty::Foreign(format!("typeof {path}").into())),
            TsDecl::Interface { .. } | TsDecl::Alias { .. } => {
                mapped.ty = Some(self.named(file, name, &[], path, depth));
            }
            TsDecl::Other => mapped.value = Some(Ty::Foreign(format!("typeof {path}").into())),
        }
        Some(mapped)
    }

    fn function(
        &mut self,
        file: &Rc<TsFile>,
        function: &TsFn,
        scope: &Scope,
        path: &str,
        depth: usize,
    ) -> Ty {
        let mut scope = scope.clone();
        let generics = function.type_params.len() as u32;
        scope.extend(function.type_params.iter().cloned());
        let fn_path = if path.starts_with("typeof ") { path.to_string() } else { format!("({path})") };
        let mut params = Vec::new();
        for (index, param) in function.params.iter().enumerate() {
            let param_path = format!("Parameters<{fn_path}>[{index}]");
            let ty = match &param.ty {
                Some(TsType::Array(element)) if param.rest => {
                    self.ty(file, element, &scope, &format!("{param_path}[number]"), depth)
                }
                Some(ty) => self.ty(file, ty, &scope, &param_path, depth),
                None => Ty::Foreign("unknown".into()),
            };
            params.push(ParamTy {
                name: Some(param.name.clone()),
                ty,
                optional: param.optional,
                rest: param.rest,
            });
        }
        let ret_path = format!("ReturnType<{fn_path}>");
        let ret = match &function.ret {
            Some(TsType::Ref(promise, args)) if promise == "Promise" && args.len() == 1 => {
                Ty::Promise(Box::new(self.ty(file, &args[0], &scope, &format!("Awaited<{ret_path}>"), depth)))
            }
            Some(ret) => self.ty(file, ret, &scope, &ret_path, depth),
            None => Ty::Foreign(ret_path.into()),
        };
        Ty::Fn(Rc::new(FnTy { params, ret, is_async: false, generics, ts: true }))
    }

    /// A TS type as a Bloom type; `path` names it in emitted TS.
    pub fn ty(&mut self, file: &Rc<TsFile>, ty: &TsType, scope: &Scope, path: &str, depth: usize) -> Ty {
        match ty {
            TsType::Number => Ty::Float,
            TsType::String => Ty::Str,
            TsType::Boolean => Ty::Bool,
            TsType::Void | TsType::Undefined => Ty::Unit,
            TsType::Never => Ty::Never,
            TsType::BoolLit => Ty::Bool,
            TsType::StrLit(value) => Ty::Strings(Rc::new(StrSet {
                name: format!("\"{value}\""),
                values: vec![value.clone()],
                token: false,
            })),
            TsType::Array(element) => {
                Ty::List(Box::new(self.ty(file, element, scope, &format!("{path}[number]"), depth)))
            }
            TsType::Tuple(items) => Ty::Tuple(
                items
                    .iter()
                    .enumerate()
                    .map(|(i, t)| self.ty(file, t, scope, &format!("{path}[{i}]"), depth))
                    .collect(),
            ),
            TsType::Union(members) => self.union(file, members, scope, path, depth),
            TsType::Fn(function) => self.function(file, function, scope, path, depth),
            TsType::Object(members) => self.object(file, members, scope, path, "{…}", depth),
            TsType::Ref(name, args) => self.reference(file, name, args, scope, path, depth),
            TsType::Null | TsType::Any | TsType::Unknown | TsType::Other => Ty::Foreign(path.into()),
        }
    }

    fn union(
        &mut self,
        file: &Rc<TsFile>,
        members: &[TsType],
        scope: &Scope,
        path: &str,
        depth: usize,
    ) -> Ty {
        let nullable = members.iter().any(|m| matches!(m, TsType::Undefined | TsType::Null | TsType::Void));
        let rest: Vec<&TsType> = members
            .iter()
            .filter(|m| !matches!(m, TsType::Undefined | TsType::Null | TsType::Void))
            .collect();
        let inner_path = if nullable { format!("NonNullable<{path}>") } else { path.to_string() };
        let inner = if rest.iter().all(|m| matches!(m, TsType::StrLit(_))) && !rest.is_empty() {
            let values: Vec<String> = rest
                .iter()
                .filter_map(|m| if let TsType::StrLit(v) = m { Some(v.clone()) } else { None })
                .collect();
            let name = values.iter().map(|v| format!("\"{v}\"")).collect::<Vec<_>>().join(" | ");
            Ty::Strings(Rc::new(StrSet { name, values, token: false }))
        } else if rest.iter().all(|m| matches!(m, TsType::BoolLit | TsType::Boolean)) && !rest.is_empty() {
            Ty::Bool
        } else if let [only] = rest.as_slice() {
            self.ty(file, only, scope, &inner_path, depth)
        } else {
            return Ty::Foreign(path.into());
        };
        // `null` is not `undefined`: a nullable TS value is foreign until checked.
        if members.iter().any(|m| matches!(m, TsType::Null)) {
            return Ty::Foreign(path.into());
        }
        if nullable { Ty::Option(Box::new(inner)) } else { inner }
    }

    fn reference(
        &mut self,
        file: &Rc<TsFile>,
        name: &str,
        args: &[TsType],
        scope: &Scope,
        path: &str,
        depth: usize,
    ) -> Ty {
        if let Some(index) = scope.iter().position(|p| p == name) {
            return Ty::Param(index as u32, name.into());
        }
        let arg =
            |this: &mut Self, i: usize, sub: &str| args.get(i).map(|a| this.ty(file, a, scope, sub, depth));
        match name {
            "Promise" | "PromiseLike" if args.len() == 1 => {
                return Ty::Promise(Box::new(arg(self, 0, &format!("Awaited<{path}>")).unwrap_or(Ty::Unit)));
            }
            "Array" | "ReadonlyArray" if args.len() == 1 => {
                return Ty::List(Box::new(arg(self, 0, &format!("{path}[number]")).unwrap_or(Ty::Unknown)));
            }
            "Record" if args.len() == 2 && matches!(args[0], TsType::String) => {
                return Ty::Map(Box::new(arg(self, 1, &format!("{path}[string]")).unwrap_or(Ty::Unknown)));
            }
            "Partial" if args.len() == 1 => {
                let inner = arg(self, 0, &format!("Required<{path}>")).unwrap_or(Ty::Unknown);
                return if matches!(inner, Ty::Adt(..)) {
                    Ty::Partial(Box::new(inner))
                } else {
                    Ty::Foreign(path.into())
                };
            }
            "Error" => return Ty::JsError,
            "AbortSignal" => return Ty::Foreign("AbortSignal".into()),
            _ => {}
        }
        if REACT_ELEMENTS.contains(&name) {
            return Ty::Foreign(path.into());
        }
        if file.decls.contains_key(name) {
            let mapped: Vec<Ty> = args.iter().map(|a| self.ty(file, a, scope, path, depth)).collect();
            return self.named(file, name, &mapped, path, depth + 1);
        }
        if let Some((specifier, imported)) = file.imports.get(name).cloned()
            && let Some(target) = resolve(&file.path, &specifier, self.options).and_then(|p| read(&p))
            && let Some(local) = exported_local(&target, &imported)
        {
            let mapped: Vec<Ty> = args.iter().map(|a| self.ty(file, a, scope, path, depth)).collect();
            let (target, local) = local;
            return self.named(&target, &local, &mapped, path, depth + 1);
        }
        Ty::Foreign(path.into())
    }

    /// An interface or alias, mapped once per declaration (generic ones per use).
    fn named(&mut self, file: &Rc<TsFile>, name: &str, args: &[Ty], path: &str, depth: usize) -> Ty {
        if depth > 12 {
            return Ty::Foreign(path.into());
        }
        let key = (file.path.clone(), name.to_string());
        if args.is_empty()
            && let Some(ty) = self.named.get(&key)
        {
            return ty.clone();
        }
        let Some(decl) = file.decls.get(name).cloned() else { return Ty::Foreign(path.into()) };
        let ty = match decl {
            TsDecl::Interface { params, members, extends } => {
                if !params.is_empty() && params.len() != args.len() {
                    return Ty::Foreign(path.into());
                }
                let mut all = Vec::new();
                for parent in &extends {
                    if let TsType::Ref(parent_name, _) = parent
                        && let Some(TsDecl::Interface { members: inherited, .. }) =
                            file.decls.get(parent_name)
                    {
                        all.extend(inherited.iter().cloned());
                        continue;
                    }
                    return Ty::Foreign(path.into());
                }
                all.extend(members);
                // Reserve the definition first, so a recursive field refers to it.
                let id = self.defs.len();
                self.defs.push(Def {
                    name: name.to_string(),
                    generics: Vec::new(),
                    kind: DefKind::Struct(Vec::new()),
                    origin: Origin::Ts { path: path.to_string() },
                });
                let ty = Ty::Adt(id, Vec::new());
                if args.is_empty() {
                    self.named.insert(key.clone(), ty.clone());
                }
                let scope: Scope = params.clone();
                let fields = self.fields(file, &all, &scope, path, depth);
                let fields = fields
                    .into_iter()
                    .map(|f| FieldDef { ty: crate::types::substitute(&f.ty, args), ..f })
                    .collect();
                self.defs[id].kind = DefKind::Struct(fields);
                return ty;
            }
            TsDecl::Alias { params, ty } => {
                if !params.is_empty() {
                    return Ty::Foreign(path.into());
                }
                match &ty {
                    TsType::Object(members) => self.object(file, members, &Vec::new(), path, name, depth),
                    other => self.ty(file, other, &Vec::new(), path, depth),
                }
            }
            _ => Ty::Foreign(path.into()),
        };
        if args.is_empty() {
            self.named.insert(key, ty.clone());
        }
        ty
    }

    fn object(
        &mut self,
        file: &Rc<TsFile>,
        members: &[TsMember],
        scope: &Scope,
        path: &str,
        name: &str,
        depth: usize,
    ) -> Ty {
        if members.iter().any(|m| m.name == "[index]") {
            return Ty::Foreign(path.into());
        }
        let id = self.defs.len();
        self.defs.push(Def {
            name: name.to_string(),
            generics: Vec::new(),
            kind: DefKind::Struct(Vec::new()),
            origin: Origin::Ts { path: path.to_string() },
        });
        let fields = self.fields(file, members, scope, path, depth);
        self.defs[id].kind = DefKind::Struct(fields);
        Ty::Adt(id, Vec::new())
    }

    fn fields(
        &mut self,
        file: &Rc<TsFile>,
        members: &[TsMember],
        scope: &Scope,
        path: &str,
        depth: usize,
    ) -> Vec<FieldDef> {
        members
            .iter()
            .map(|member| {
                let field_path = format!("{path}[\"{}\"]", member.name);
                let mut ty = self.ty(file, &member.ty, scope, &field_path, depth);
                if member.optional && !matches!(ty, Ty::Option(_) | Ty::Foreign(_)) {
                    ty = Ty::Option(Box::new(ty));
                }
                let default = if member.optional { FieldDefault::Undefined } else { FieldDefault::None };
                FieldDef { name: member.name.clone(), ty, default }
            })
            .collect()
    }
}

/// The file and local declaration an export names, following re-exports.
fn exported_local(file: &Rc<TsFile>, name: &str) -> Option<(Rc<TsFile>, String)> {
    match file.exports.get(name)? {
        Export::Local(local) => Some((file.clone(), local.clone())),
        Export::From(_, _) => None,
    }
}

/// A function that is a component: an uppercase name, at most one parameter
/// (its props), returning an element (or, in a `.tsx` file, returning anything).
fn is_component_fn(file: &TsFile, name: &str, function: &TsFn) -> bool {
    if !name.chars().next().is_some_and(|c| c.is_ascii_uppercase()) || function.params.len() > 1 {
        return false;
    }
    match &function.ret {
        Some(TsType::Ref(ret, _)) => REACT_ELEMENTS.contains(&ret.as_str()),
        Some(TsType::Union(members)) => members.iter().all(|m| {
            matches!(m, TsType::Null)
                || matches!(m, TsType::Ref(r, _) if REACT_ELEMENTS.contains(&r.as_str()))
        }),
        None => file.tsx,
        _ => false,
    }
}
