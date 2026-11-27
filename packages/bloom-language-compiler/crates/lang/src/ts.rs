//! The foreign boundary (spec 4.7): a TS module's declarations, read with
//! Oxc from its `.d.ts` (or `.ts`/`.tsx` source), mapped to Bloom types where
//! they map. Anything else is `Foreign`, never `any`.

use rustc_hash::FxHashMap as HashMap;
use std::cell::RefCell;

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

mod infer;

// ---- the summary of a TS file ---------------------------------------------

#[derive(Debug, Clone)]
pub enum TsType {
    Number,
    /// An integer literal's `const` (`export const MAX = 4`): an `Int`, which widens to `Float`.
    Int,
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
    /// `A & B`: foreign, but a component may be one of its members (react-native's
    /// `TextInput` is a function from props to a node with statics beside it).
    Intersection(Vec<TsType>),
    /// `typeof x`: the type of the module's value `x` (a declaration or an import).
    Query(String),
    /// `ReturnType<F>`: what the function type `F` returns.
    Returns(Box<TsType>),
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
    /// What an unannotated function returns, read from its body (`infer`): mapped where `ret`
    /// is absent, but not a component's mark (an unannotated `.tsx` function still is one).
    pub inferred: Option<TsType>,
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
    /// A class. One that extends another and is named in UpperCamel is a component
    /// (`extends Component<P>` gives its props; any other's are TS's to check); the
    /// rest are a value and a type TS checks (`ViewModifier`).
    Class {
        extends: bool,
        props: Option<TsType>,
    },
    /// `const X = memo(Inner)`: the component `Inner` is (its props).
    Memo(String),
    /// An enum, a namespace: foreign.
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
    /// A type declared beside a value of the same name (`declare const X: T;
    /// declare type X = typeof X`): the value is in `decls`, the type here.
    pub types: HashMap<String, TsDecl>,
    pub exports: HashMap<String, Export>,
    /// `export * from "…"`.
    pub stars: Vec<String>,
    /// `export = N`: the namespace whose members are the module's exports (`@types/react`).
    pub export_equals: Option<String>,
    /// A namespace's member names (`declare namespace React { … }`).
    pub namespaces: HashMap<String, Vec<String>>,
    /// Local name → (specifier, imported name).
    pub imports: HashMap<String, (String, String)>,
}

/// A file's identity on disk: a cached summary is reused while it holds.
pub(crate) type Stamp = (Option<std::time::SystemTime>, u64);

pub(crate) fn stamp(path: &Path) -> Option<Stamp> {
    let meta = std::fs::metadata(path).ok()?;
    Some((meta.modified().ok(), meta.len()))
}

/// A summary with the stamp it was read at and the compile that last checked it.
struct Cached<T> {
    value: T,
    stamp: Stamp,
    checked: u64,
}

/// A per-thread cache that is never dropped: the thread's exit leaves it to the
/// OS instead of running its destructor.
///
/// The addon runs in Node worker threads (jest-worker, Metro's workers) and in
/// processes that `process.exit()` while other threads still compile. A
/// `thread_local!` whose value needs dropping registers a TLS destructor
/// (`__cxa_thread_atexit_impl`), which runs during the thread's or process's
/// teardown, after Node has begun tearing down the environment the addon was
/// loaded into, and in an order no caller controls. These caches hold only
/// Rust data, so dropping them buys nothing at exit, and a value with no drop
/// glue registers no destructor at all: the compiler stays out of the exit path
/// (a segfault and a glibc "double free" were seen at worker exit with the
/// addon loaded; `test/worker-exit.test.cjs` loops those exits). The cost is
/// one cache per exited thread, which long-lived workers make rare;
/// `clear_caches` and `forget` still free one on demand.
pub(crate) type ThreadCache<T> = std::mem::ManuallyDrop<RefCell<T>>;

/// A [`ThreadCache`] holding `value`.
pub(crate) const fn thread_cache<T>(value: T) -> ThreadCache<T> {
    std::mem::ManuallyDrop::new(RefCell::new(value))
}

thread_local! {
    static FILES: ThreadCache<HashMap<PathBuf, Cached<Rc<TsFile>>>> = thread_cache(HashMap::default());
    static TSCONFIG: ThreadCache<HashMap<PathBuf, Cached<Paths>>> = thread_cache(HashMap::default());
    /// Bumped by each compile: a cached file is checked against the disk once per compile.
    static EPOCH: std::cell::Cell<u64> = const { std::cell::Cell::new(0) };
}

/// The current compile (see [`next_epoch`]).
pub(crate) fn epoch() -> u64 {
    EPOCH.with(std::cell::Cell::get)
}

/// Starts a compile: cached files are checked against the disk again (once each).
pub fn next_epoch() {
    EPOCH.with(|e| e.set(e.get() + 1));
}

/// Forgets `path`'s summary (an editor changed it).
pub fn invalidate(path: &Path) {
    FILES.with(|files| files.borrow_mut().remove(path));
    TSCONFIG.with(|c| c.borrow_mut().retain(|root, _| root.join("tsconfig.json") != path));
}

/// Forgets every summary.
pub fn clear_caches() {
    FILES.with(|files| files.borrow_mut().clear());
    TSCONFIG.with(|c| c.borrow_mut().clear());
}

/// `cache[path]` while the file on disk is unchanged (checked once per compile), else `load()`.
fn cached<T: Clone>(
    cache: &'static std::thread::LocalKey<ThreadCache<HashMap<PathBuf, Cached<T>>>>,
    path: &Path,
    key: &Path,
    load: impl FnOnce() -> Option<T>,
) -> Option<T> {
    let epoch = EPOCH.with(std::cell::Cell::get);
    let hit = cache.with(|c| {
        let mut c = c.borrow_mut();
        let entry = c.get_mut(key)?;
        if entry.checked != epoch {
            if stamp(path).unwrap_or((None, 0)) != entry.stamp {
                return None;
            }
            entry.checked = epoch;
        }
        Some(entry.value.clone())
    });
    if hit.is_some() {
        return hit;
    }
    let stamp = stamp(path).unwrap_or((None, 0));
    let value = load()?;
    cache.with(|c| {
        c.borrow_mut().insert(key.to_path_buf(), Cached { value: value.clone(), stamp, checked: epoch })
    });
    Some(value)
}

/// Reads and summarises a TS file (cached while it is unchanged on disk); a
/// `.bloom` module is not one (see [`bloom_export`]).
pub fn read(path: &Path) -> Option<Rc<TsFile>> {
    if path.extension().is_some_and(|e| e == "bloom") {
        return None;
    }
    cached(&FILES, path, path, || {
        let text = std::fs::read_to_string(path).ok()?;
        Some(Rc::new(summarise(path, &text)))
    })
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
    if let Some(members) = file.export_equals.as_ref().and_then(|n| file.namespaces.get(n)).cloned() {
        for member in members {
            file.exports.entry(member.clone()).or_insert(Export::Local(member));
        }
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
            Statement::TSExportAssignment(export) => {
                if let oxc_ast::ast::Expression::Identifier(id) = &export.expression {
                    file.export_equals = Some(id.name.to_string());
                }
            }
            Statement::ExportDefaultDeclaration(export) => match &export.declaration {
                ExportDefaultDeclarationKind::FunctionDeclaration(function) => {
                    let name = function.id.as_ref().map_or("default".to_string(), |id| id.name.to_string());
                    let mut decl = self.function(
                        &function.type_parameters,
                        &function.params,
                        function.return_type.as_ref().map(|t| &t.type_annotation),
                    );
                    decl.inferred = self.infer_function(function);
                    file.decls.insert(name.clone(), TsDecl::Fn(decl));
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
            let is_type = matches!(decl, TsDecl::Interface { .. } | TsDecl::Alias { .. });
            match file.decls.get(&name) {
                // A function's first overload is the one Bloom reads.
                Some(TsDecl::Fn(_)) if matches!(decl, TsDecl::Fn(_)) => {}
                // A value and a type of one name: both are kept.
                Some(TsDecl::Var(_) | TsDecl::Fn(_)) if is_type => {
                    file.types.insert(name, decl);
                }
                Some(TsDecl::Interface { .. } | TsDecl::Alias { .. }) if matches!(decl, TsDecl::Var(_)) => {
                    let ty = file.decls.insert(name.clone(), decl).expect("a type");
                    file.types.insert(name, ty);
                }
                _ => {
                    file.decls.insert(name, decl);
                }
            }
        };
        match declaration {
            Declaration::FunctionDeclaration(function) => {
                if let Some(id) = &function.id {
                    let mut decl = self.function(
                        &function.type_parameters,
                        &function.params,
                        function.return_type.as_ref().map(|t| &t.type_annotation),
                    );
                    decl.inferred = self.infer_function(function);
                    add(file, id.name.to_string(), TsDecl::Fn(decl));
                }
            }
            Declaration::VariableDeclaration(variables) => {
                for declarator in &variables.declarations {
                    if let BindingPattern::BindingIdentifier(id) = &declarator.id
                        && declarator.type_annotation.is_none()
                        && let Some(decl) = self.memo(declarator.init.as_ref())
                    {
                        let name = id.name.to_string();
                        let decl = match decl {
                            // `memo(function Inner(…) { … })`: the inner function, kept unexported.
                            TsDecl::Fn(_) => {
                                let inner = format!("{name}$memo");
                                file.decls.insert(inner.clone(), decl);
                                TsDecl::Memo(inner)
                            }
                            decl => decl,
                        };
                        add(file, name, decl);
                        continue;
                    }
                    if let BindingPattern::BindingIdentifier(id) = &declarator.id {
                        let ty =
                            declarator.type_annotation.as_ref().map(|t| self.ty(&t.type_annotation)).or_else(
                                || {
                                    // `export const X = function/arrow` with typed parameters: read the arrow.
                                    match declarator.init.as_ref() {
                                        Some(oxc_ast::ast::Expression::ArrowFunctionExpression(arrow)) => {
                                            let mut function = self.function(
                                                &arrow.type_parameters,
                                                &arrow.params,
                                                arrow.return_type.as_ref().map(|t| &t.type_annotation),
                                            );
                                            function.inferred = self.infer_arrow(arrow);
                                            Some(TsType::Fn(Box::new(function)))
                                        }
                                        // `export const GAP = 12`: what its initializer is (R7).
                                        Some(init) if variables.kind.is_const() => self.infer_init(init),
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
                    let props = class.heritage.as_ref().and_then(|heritage| {
                        let base = match &heritage.expression {
                            oxc_ast::ast::Expression::Identifier(id) => id.name.to_string(),
                            oxc_ast::ast::Expression::StaticMemberExpression(member) => {
                                member.property.name.to_string()
                            }
                            _ => return None,
                        };
                        if !matches!(base.as_str(), "Component" | "PureComponent") {
                            return None;
                        }
                        heritage.type_arguments.as_ref()?.params.first().map(|t| self.ty(t))
                    });
                    let extends = class.heritage.is_some();
                    add(file, id.name.to_string(), TsDecl::Class { extends, props });
                }
            }
            Declaration::TSEnumDeclaration(enumeration) => {
                add(file, enumeration.id.name.to_string(), TsDecl::Other)
            }
            // `declare namespace React { … }`: its members are read beside the file's own, for
            // an `export = React` to export them.
            Declaration::TSNamespaceDeclaration(namespace) => {
                let name = namespace.id.name.to_string();
                if let oxc_ast::ast::TSNamespaceDeclarationBody::TSModuleBlock(block) = &namespace.body {
                    let before: std::collections::HashSet<String> = file.decls.keys().cloned().collect();
                    for statement in &block.body {
                        self.statement(statement, file, false);
                    }
                    let members: Vec<String> =
                        file.decls.keys().filter(|k| !before.contains(*k)).cloned().collect();
                    file.namespaces.entry(name.clone()).or_default().extend(members);
                }
                add(file, name, TsDecl::Other);
            }
            _ => {}
        }
    }

    /// `memo(Inner)`, `memo(function Inner(props: P) { … })`, `memo((props: P) => …)` (also
    /// `React.memo`): a component with the inner one's props.
    fn memo(&self, init: Option<&oxc_ast::ast::Expression>) -> Option<TsDecl> {
        use oxc_ast::ast::{Argument, Expression};
        let Some(Expression::CallExpression(call)) = init else { return None };
        let callee = match &call.callee {
            Expression::Identifier(id) => id.name.as_str(),
            Expression::StaticMemberExpression(member) if matches!(&member.object, Expression::Identifier(o) if o.name == "React") => {
                member.property.name.as_str()
            }
            _ => return None,
        };
        if callee != "memo" {
            return None;
        }
        match call.arguments.first()? {
            Argument::Identifier(inner) => Some(TsDecl::Memo(inner.name.to_string())),
            Argument::FunctionExpression(function) => Some(TsDecl::Fn(self.function(
                &function.type_parameters,
                &function.params,
                function.return_type.as_ref().map(|t| &t.type_annotation),
            ))),
            Argument::ArrowFunctionExpression(arrow) => Some(TsDecl::Fn(self.function(
                &arrow.type_parameters,
                &arrow.params,
                arrow.return_type.as_ref().map(|t| &t.type_annotation),
            ))),
            _ => None,
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
        TsFn {
            type_params: fn_type_params(type_parameters),
            params: out,
            ret: ret.map(|t| self.ty(t)),
            inferred: None,
        }
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
                // `(content: string) => void` inside an interface: the value is callable.
                TSSignature::TSCallSignatureDeclaration(_)
                | TSSignature::TSConstructSignatureDeclaration(_) => {
                    members.push(TsMember { name: "[call]".into(), optional: false, ty: TsType::Other });
                }
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
            TSType::TSIntersectionType(both) => {
                TsType::Intersection(both.types.iter().map(|t| self.ty(t)).collect())
            }
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
            // `typeof useX`: the value's type, read where the summary is mapped.
            TSType::TSTypeQuery(query) if query.type_arguments.is_none() => match &query.expr_name {
                oxc_ast::ast::TSTypeQueryExprName::IdentifierReference(id) => {
                    TsType::Query(id.name.to_string())
                }
                _ => self.other(),
            },
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

/// A function's type parameters; one bound by a view's modifiers (`<V extends
/// ViewModifiers<V>>`, `AnyView`, `ViewNode`) is marked `V\0view`: Bloom reads it as a view.
fn fn_type_params(declaration: &Option<oxc_allocator::Box<TSTypeParameterDeclaration>>) -> Vec<String> {
    declaration
        .as_ref()
        .map(|d| {
            d.params
                .iter()
                .map(|p| {
                    let view = matches!(
                        &p.constraint,
                        Some(TSType::TSTypeReference(r))
                            if matches!(type_name(&r.type_name).as_str(), "ViewModifiers" | "AnyView" | "ViewNode")
                    );
                    if view { format!("{}{VIEW_PARAM}", p.name.name) } else { p.name.name.to_string() }
                })
                .collect()
        })
        .unwrap_or_default()
}

/// The mark of a type parameter bound by a view's modifiers.
const VIEW_PARAM: &str = "\0view";

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

/// `compilerOptions.paths` of the root's `tsconfig.json`, targets joined to its `baseUrl`;
/// read without a JSON parser (keys and string arrays only).
fn tsconfig_paths(root: &Path) -> Paths {
    let config = root.join("tsconfig.json");
    cached(&TSCONFIG, &config, root, || Some(read_tsconfig_paths(&config))).unwrap_or_default()
}

fn read_tsconfig_paths(config: &Path) -> Paths {
    let text = std::fs::read_to_string(config).unwrap_or_default();
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
    Rc::new(out)
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
    if (text.ends_with(".ts") || text.ends_with(".tsx") || text.ends_with(".bloom")) && is_file(base) {
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
    /// Every file the mapping reads (a compile's dependencies).
    pub reads: &'m mut std::collections::BTreeSet<PathBuf>,
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
    "ForwardRefExoticComponent",
    "React.ForwardRefExoticComponent",
    "LazyExoticComponent",
    "React.LazyExoticComponent",
    "ExoticComponent",
    "React.ExoticComponent",
    "ComponentClass",
    "React.ComponentClass",
];

impl Mapper<'_> {
    /// The TS module `specifier` names from `from`, recorded as a dependency.
    fn open(&mut self, from: &Path, specifier: &str) -> Option<Rc<TsFile>> {
        let path = resolve(from, specifier, self.options)?;
        let file = read(&path)?;
        self.reads.insert(path);
        Some(file)
    }

    /// `name` as `file` exports it; `path` is how emitted TS names its value (`useAuth`).
    pub fn export(&mut self, file: &Rc<TsFile>, name: &str, path: &str, depth: usize) -> Option<Mapped> {
        if depth > 8 {
            return None;
        }
        // `export * as X from "…"` (react-native's `StyleSheet`): a namespace, TS's to check.
        if name == "*" {
            return Some(Mapped {
                value: Some(Ty::Foreign(format!("typeof {path}").into())),
                ..Mapped::default()
            });
        }
        let local = match file.exports.get(name) {
            Some(Export::Local(local)) => local.clone(),
            Some(Export::From(specifier, imported)) => {
                let target = self.open(&file.path, specifier)?;
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
                        if let Some(target) = self.open(&file.path, &star)
                            && let Some(found) = self.export(&target, name, path, depth + 1)
                        {
                            return Some(found);
                        }
                    }
                    return None;
                }
            }
        };
        if local == "useTranslation" && file.path.to_string_lossy().contains("react-i18next") {
            return Some(Mapped {
                value: Some(self.use_translation(file, path, depth)),
                ..Mapped::default()
            });
        }
        self.local(file, &local, path, depth)
    }

    /// react-i18next's `useTranslation`, whose declared type is conditional (a selector
    /// mode) and its result a tuple intersected with a record: Bloom reads it as what it gives,
    /// `{ t: (String, options?) -> String, i18n, ready: Bool }`; TS checks the rest.
    fn use_translation(&mut self, file: &Rc<TsFile>, path: &str, depth: usize) -> Ty {
        let param = |name: &str, ty: TsType, optional: bool| TsParam {
            name: name.into(),
            ty: Some(ty),
            optional,
            rest: false,
        };
        let t = TsFn {
            type_params: Vec::new(),
            params: vec![param("key", TsType::String, false), param("options", TsType::Other, true)],
            ret: Some(TsType::String),
            inferred: None,
        };
        let member = |name: &str, ty: TsType| TsMember { name: name.into(), optional: false, ty };
        let hook = TsFn {
            type_params: Vec::new(),
            params: vec![param("ns", TsType::Other, true), param("options", TsType::Other, true)],
            ret: Some(TsType::Object(vec![
                member("t", TsType::Fn(Box::new(t))),
                member("i18n", TsType::Other),
                member("ready", TsType::Boolean),
            ])),
            inferred: None,
        };
        self.function(file, &hook, &Vec::new(), &format!("typeof {path}"), depth)
    }

    fn local(&mut self, file: &Rc<TsFile>, name: &str, path: &str, depth: usize) -> Option<Mapped> {
        let Some(decl) = file.decls.get(name).cloned() else {
            // A re-export of an import (`import { x } from "y"; export { x }`).
            let (specifier, imported) = file.imports.get(name)?.clone();
            let target = self.open(&file.path, &specifier)?;
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
                        Some(self.declared_fn(file, name, &function, &format!("typeof {path}"), depth));
                }
            }
            TsDecl::Var(Some(ty)) => {
                if let TsType::Ref(reference, args) = &ty
                    && COMPONENT_TYPES.contains(&reference.as_str())
                {
                    // `MemoExoticComponent<ComponentType<P>>`, `LazyExoticComponent<…>`: the
                    // component inside gives the props.
                    let mut props = args.first();
                    while let Some(TsType::Ref(inner, inner_args)) = props
                        && COMPONENT_TYPES.contains(&inner.as_str())
                    {
                        props = inner_args.first();
                    }
                    let props = match props {
                        Some(TsType::Ref(inner, _)) if inner.starts_with("typeof ") => Ty::Foreign("".into()),
                        Some(p) => self.ty(
                            file,
                            p,
                            &Vec::new(),
                            &format!("React.ComponentProps<typeof {path}>"),
                            depth,
                        ),
                        None => Ty::Unit,
                    };
                    mapped.component = Some(props);
                    return Some(mapped);
                }
                // `declare const TextInput: TextInputType`, an alias of a function from props to
                // a node (with statics beside it): a component.
                // (Named by its import: react-native declares it as `$$TextInput`.)
                if path.starts_with(|c: char| c.is_ascii_uppercase())
                    && let Some((props_file, props)) = self.component_in(file, &ty, depth)
                {
                    // As a type (`@ref input: TextInput?`) it is its instance, as a ref holds it:
                    // read from its `ref` prop when it declares one (`ComponentRef` gives `never` for
                    // a function that takes its ref as a prop), else React's `ComponentRef`.
                    let instance = if props.as_ref().is_some_and(has_ref_prop) {
                        format!(
                            "NonNullable<Extract<NonNullable<ComponentProps<typeof {path}>[\"ref\"]>, {{ current: unknown }}>[\"current\"]>"
                        )
                    } else {
                        format!("ComponentRef<typeof {path}>")
                    };
                    let props = match props {
                        Some(props) => self.ty(
                            &props_file,
                            &props,
                            &Vec::new(),
                            &format!("React.ComponentProps<typeof {path}>"),
                            depth,
                        ),
                        None => Ty::Unit,
                    };
                    mapped.component = Some(props);
                    mapped.ty = Some(Ty::Foreign(instance.into()));
                    return Some(mapped);
                }
                mapped.value = Some(self.ty(file, &ty, &Vec::new(), &format!("typeof {path}"), depth));
                mapped.ty = self.beside(file, name, path);
            }
            TsDecl::Var(None) => mapped.value = Some(Ty::Foreign(format!("typeof {path}").into())),
            TsDecl::Interface { .. } | TsDecl::Alias { .. } => {
                mapped.ty = Some(self.named(file, name, &[], path, depth));
            }
            TsDecl::Class { extends: true, props } if name.starts_with(|c: char| c.is_ascii_uppercase()) => {
                let props = match props {
                    Some(props) => self.ty(
                        file,
                        &props,
                        &Vec::new(),
                        &format!("React.ComponentProps<typeof {path}>"),
                        depth,
                    ),
                    None => Ty::Foreign("".into()),
                };
                mapped.component = Some(props);
            }
            TsDecl::Class { .. } => {
                mapped.value = Some(Ty::Foreign(format!("typeof {path}").into()));
                mapped.ty = Some(Ty::Foreign(path.into()));
            }
            TsDecl::Memo(inner) => {
                let mapped = self.local(file, &inner, path, depth + 1)?;
                return Some(match mapped.component {
                    // Named through the memo itself: `Parameters<typeof X>` has no call to read.
                    Some(_) => Mapped {
                        component: Some(self.memo_props(file, &inner, path, depth)),
                        ..Mapped::default()
                    },
                    None => mapped,
                });
            }
            TsDecl::Other => mapped.value = Some(Ty::Foreign(format!("typeof {path}").into())),
        }
        Some(mapped)
    }

    /// The props of the component `inner` names, as `React.ComponentProps<typeof {path}>`.
    fn memo_props(&mut self, file: &Rc<TsFile>, inner: &str, path: &str, depth: usize) -> Ty {
        let props = match file.decls.get(inner) {
            Some(TsDecl::Fn(function)) => function.params.first().and_then(|p| p.ty.clone()),
            _ => None,
        };
        match props {
            Some(props) => {
                self.ty(file, &props, &Vec::new(), &format!("React.ComponentProps<typeof {path}>"), depth)
            }
            None => Ty::Foreign("".into()),
        }
    }

    /// The type declared beside a value of the same name, named as TS names it.
    fn beside(&self, file: &Rc<TsFile>, name: &str, path: &str) -> Option<Ty> {
        file.types.contains_key(name).then(|| Ty::Foreign(path.into()))
    }

    /// The function from props to a node that `ty` is (through aliases, imports and
    /// intersections), with the file its props are read in.
    fn component_in(
        &mut self,
        file: &Rc<TsFile>,
        ty: &TsType,
        depth: usize,
    ) -> Option<(Rc<TsFile>, Option<TsType>)> {
        if depth > 8 {
            return None;
        }
        match ty {
            TsType::Fn(function) if function.params.len() <= 1 && returns_element(function) => {
                Some((file.clone(), function.params.first().and_then(|p| p.ty.clone())))
            }
            TsType::Intersection(members) => {
                members.iter().find_map(|m| self.component_in(file, m, depth + 1))
            }
            TsType::Ref(name, args) if args.is_empty() => {
                let (target, decl) = self.type_decl(file, name, depth + 1)?;
                match decl {
                    TsDecl::Alias { params, ty } if params.is_empty() => {
                        self.component_in(&target, &ty, depth + 1)
                    }
                    _ => None,
                }
            }
            _ => None,
        }
    }

    /// The type declaration a local name means in `file`, through its imports.
    fn type_decl(&mut self, file: &Rc<TsFile>, name: &str, depth: usize) -> Option<(Rc<TsFile>, TsDecl)> {
        if depth > 8 {
            return None;
        }
        if let Some(decl) = file.types.get(name).or_else(|| file.decls.get(name)) {
            return Some((file.clone(), decl.clone()));
        }
        let (specifier, imported) = file.imports.get(name)?.clone();
        let mut target = self.open(&file.path, &specifier)?;
        let mut name = imported;
        for _ in 0..8 {
            match target.exports.get(&name).cloned() {
                Some(Export::Local(local)) => return self.type_decl(&target, &local, depth + 1),
                Some(Export::From(specifier, imported)) => {
                    target = self.open(&target.path, &specifier)?;
                    name = imported;
                }
                None => {
                    return self.type_decl(&target, &name, depth + 1).filter(|_| target.exports.is_empty());
                }
            }
        }
        None
    }

    /// The file and declaration of the type a module exports as `name`, through re-exports
    /// (`export type { SurfaceRenderFn } from './types'`), `import`/`export` pairs and
    /// `export *` (R5).
    fn exported_type(&mut self, file: &Rc<TsFile>, name: &str, depth: usize) -> Option<(Rc<TsFile>, String)> {
        if depth > 12 {
            return None;
        }
        match file.exports.get(name).cloned() {
            Some(Export::Local(local)) if file.decls.contains_key(&local) => Some((file.clone(), local)),
            Some(Export::Local(local)) => {
                let (specifier, imported) = file.imports.get(&local)?.clone();
                let target = self.open(&file.path, &specifier)?;
                self.exported_type(&target, &imported, depth + 1)
            }
            Some(Export::From(specifier, imported)) => {
                let target = self.open(&file.path, &specifier)?;
                self.exported_type(&target, &imported, depth + 1)
            }
            None if file.exports.is_empty() && file.decls.contains_key(name) => {
                Some((file.clone(), name.to_string()))
            }
            None => file.stars.clone().iter().find_map(|star| {
                let target = self.open(&file.path, star)?;
                self.exported_type(&target, name, depth + 1)
            }),
        }
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
                labelled: false,
                positional: false,
                name: Some(param.name.clone()),
                ty,
                optional: param.optional,
                rest: param.rest,
            });
        }
        let ret_path = format!("ReturnType<{fn_path}>");
        let ret = match function.ret.as_ref().or(function.inferred.as_ref()) {
            Some(TsType::Ref(promise, args)) if promise == "Promise" && args.len() == 1 => {
                Ty::Promise(Box::new(self.ty(file, &args[0], &scope, &format!("Awaited<{ret_path}>"), depth)))
            }
            Some(ret) => self.ty(file, ret, &scope, &ret_path, depth),
            None => Ty::Foreign(ret_path.into()),
        };
        Ty::Fn(Rc::new(FnTy {
            params,
            ret,
            is_async: false,
            generics,
            ts: true,
            throws: false,
            bounds: Vec::new(),
        }))
    }

    /// A TS type as a Bloom type; `path` names it in emitted TS.
    pub fn ty(&mut self, file: &Rc<TsFile>, ty: &TsType, scope: &Scope, path: &str, depth: usize) -> Ty {
        match ty {
            TsType::Number => Ty::Float,
            TsType::Int => Ty::Int,
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
            // `['a', 'b'] as const`: a list of its strings (the tuple's order is not a type).
            TsType::Tuple(items)
                if items.len() > 1 && items.iter().all(|t| matches!(t, TsType::StrLit(_))) =>
            {
                let mut values: Vec<String> = Vec::new();
                for item in items {
                    if let TsType::StrLit(v) = item
                        && !values.contains(v)
                    {
                        values.push(v.clone());
                    }
                }
                let name = values.iter().map(|v| format!("\"{v}\"")).collect::<Vec<_>>().join(" | ");
                Ty::List(Box::new(Ty::Strings(std::rc::Rc::new(crate::types::StrSet {
                    name,
                    values,
                    token: false,
                }))))
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
            TsType::Query(name) => self.value_ty(file, name, path, depth + 1),
            TsType::Returns(function) => self.returns(file, function, scope, path, depth + 1),
            TsType::Null | TsType::Any | TsType::Unknown | TsType::Intersection(_) | TsType::Other => {
                Ty::Foreign(path.into())
            }
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
        // `null` is not `undefined`: a nullable TS value is foreign until checked. So is an
        // optional of a TS type Bloom does not map (`Foreign`, not `Foreign?`): TS checks the
        // whole where it lands, as a TS field's (`server?.robots` beside a `String?`).
        if members.iter().any(|m| matches!(m, TsType::Null)) || matches!(inner, Ty::Foreign(_)) {
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
        if scope.iter().any(|p| p.strip_suffix(VIEW_PARAM) == Some(name)) {
            return Ty::View(None);
        }
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
            "Map" | "ReadonlyMap" if args.len() == 2 => {
                let key = arg(self, 0, &format!("Parameters<{path}[\"get\"]>[0]")).unwrap_or(Ty::Unknown);
                let value =
                    arg(self, 1, &format!("NonNullable<ReturnType<{path}[\"get\"]>>")).unwrap_or(Ty::Unknown);
                return Ty::JsMap(Box::new(key), Box::new(value));
            }
            "Set" | "ReadonlySet" if args.len() == 1 => {
                let elem = arg(self, 0, &format!("Parameters<{path}[\"has\"]>[0]")).unwrap_or(Ty::Unknown);
                return Ty::Set(Box::new(elem));
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
            // `ReturnType<typeof useX>` (R7): what the hook returns, inferred or annotated.
            "ReturnType" if args.len() == 1 => return self.returns(file, &args[0], scope, path, depth + 1),
            "Error" => return Ty::JsError,
            "AbortSignal" => return Ty::Foreign("AbortSignal".into()),
            _ => {}
        }
        // A React element: named as React names it, so a Bloom view crosses into it as one
        // (`toElement(view)`, see `crate::check::is_element`).
        if REACT_ELEMENTS.contains(&name) {
            let element = if name.ends_with("ReactNode") { "ReactNode" } else { "ReactElement" };
            return Ty::Foreign(format!("import(\"react\").{element}").into());
        }
        // The embedded language's view types, now followed through its re-exports: a view.
        if matches!(name, "ViewNode" | "AnyView") {
            return Ty::View(None);
        }
        if file.decls.contains_key(name) {
            let mapped: Vec<Ty> = args.iter().map(|a| self.ty(file, a, scope, path, depth)).collect();
            return self.named(file, name, &mapped, path, depth + 1);
        }
        if let Some((specifier, imported)) = file.imports.get(name).cloned()
            && let Some(target) = self.open(&file.path, &specifier)
            && let Some(local) = self.exported_type(&target, &imported, depth)
        {
            let mapped: Vec<Ty> = args.iter().map(|a| self.ty(file, a, scope, path, depth)).collect();
            let (target, local) = local;
            return self.named(&target, &local, &mapped, path, depth + 1);
        }
        Ty::Foreign(path.into())
    }

    /// The type of the module value `name` (`typeof name`), named `path` in emitted TS: a
    /// declaration of `file`, or an import followed to its module (a `.bloom` one through the
    /// declarations bloomc writes beside it, `X.d.bloom.ts`).
    fn value_ty(&mut self, file: &Rc<TsFile>, name: &str, path: &str, depth: usize) -> Ty {
        if depth > 12 {
            return Ty::Foreign(path.into());
        }
        let Some((file, local, decl)) = self.value_decl(file, name, depth) else {
            return Ty::Foreign(path.into());
        };
        match decl {
            TsDecl::Fn(function) => self.declared_fn(&file, &local, &function, path, depth),
            TsDecl::Var(Some(ty)) => self.ty(&file, &ty, &Vec::new(), path, depth),
            _ => Ty::Foreign(path.into()),
        }
    }

    /// A declared function's type; what it returns, when that is inferred from its body, is
    /// mapped once per declaration (its result is one type, whichever name reaches it).
    fn declared_fn(
        &mut self,
        file: &Rc<TsFile>,
        name: &str,
        function: &TsFn,
        path: &str,
        depth: usize,
    ) -> Ty {
        let fn_path = if path.starts_with("typeof ") { path.to_string() } else { format!("({path})") };
        let Some(ret) = self.inferred_ret(file, name, function, &format!("ReturnType<{fn_path}>"), depth)
        else {
            return self.function(file, function, &Vec::new(), path, depth);
        };
        let bare = TsFn { inferred: None, ..function.clone() };
        match self.function(file, &bare, &Vec::new(), path, depth) {
            Ty::Fn(f) => Ty::Fn(Rc::new(FnTy { ret, ..(*f).clone() })),
            other => other,
        }
    }

    /// What the function `name` of `file` returns when that is read from its body (not
    /// annotated, not generic), named `path`; mapped once per declaration.
    fn inferred_ret(
        &mut self,
        file: &Rc<TsFile>,
        name: &str,
        function: &TsFn,
        path: &str,
        depth: usize,
    ) -> Option<Ty> {
        if function.ret.is_some() || !function.type_params.is_empty() {
            return None;
        }
        let inferred = function.inferred.as_ref()?;
        let key = (file.path.clone(), format!("{name}\0returns"));
        if let Some(ty) = self.named.get(&key) {
            return Some(ty.clone());
        }
        let ty = match inferred {
            TsType::Ref(promise, args) if promise == "Promise" && args.len() == 1 => Ty::Promise(Box::new(
                self.ty(file, &args[0], &Vec::new(), &format!("Awaited<{path}>"), depth),
            )),
            ret => self.ty(file, ret, &Vec::new(), path, depth),
        };
        self.named.insert(key, ty.clone());
        Some(ty)
    }

    /// `ReturnType<F>`, named `path`: what `F` returns when it is a function Bloom reads (not
    /// a generic one, whose result depends on its use).
    fn returns(
        &mut self,
        file: &Rc<TsFile>,
        function: &TsType,
        scope: &Scope,
        path: &str,
        depth: usize,
    ) -> Ty {
        if depth > 12 {
            return Ty::Foreign(path.into());
        }
        let (file, function) = match function {
            TsType::Query(name) => match self.value_decl(file, name, depth) {
                Some((file, local, TsDecl::Fn(function))) => {
                    if let Some(ret) = self.inferred_ret(&file, &local, &function, path, depth) {
                        return ret;
                    }
                    (file, function)
                }
                Some((file, _, TsDecl::Var(Some(TsType::Fn(function))))) => (file, *function),
                _ => return Ty::Foreign(path.into()),
            },
            TsType::Fn(function) => (file.clone(), (**function).clone()),
            _ => return Ty::Foreign(path.into()),
        };
        if !function.type_params.is_empty() {
            return Ty::Foreign(path.into());
        }
        match function.ret.as_ref().or(function.inferred.as_ref()) {
            Some(TsType::Ref(promise, args)) if promise == "Promise" && args.len() == 1 => {
                Ty::Promise(Box::new(self.ty(&file, &args[0], scope, &format!("Awaited<{path}>"), depth)))
            }
            Some(ret) => self.ty(&file, ret, scope, path, depth),
            None => Ty::Foreign(path.into()),
        }
    }

    /// The value declaration `name` names in `file` (its file, local name and declaration),
    /// following imports and re-exports.
    fn value_decl(
        &mut self,
        file: &Rc<TsFile>,
        name: &str,
        depth: usize,
    ) -> Option<(Rc<TsFile>, String, TsDecl)> {
        if depth > 12 {
            return None;
        }
        if let Some(decl) = file.decls.get(name) {
            return Some((file.clone(), name.to_string(), decl.clone()));
        }
        let (specifier, imported) = file.imports.get(name)?.clone();
        let target = match self.open(&file.path, &specifier) {
            Some(target) => target,
            None => {
                // A `.bloom` module: its declarations, as TS reads them.
                let path = resolve(&file.path, &specifier, self.options)?;
                let declarations = path.with_extension("d.bloom.ts");
                let target = read(&declarations)?;
                self.reads.insert(declarations);
                target
            }
        };
        match target.exports.get(&imported).cloned() {
            Some(Export::Local(local)) => self.value_decl(&target, &local, depth + 1),
            Some(Export::From(specifier, imported)) => {
                let next = self.open(&target.path, &specifier)?;
                let local = match next.exports.get(&imported) {
                    Some(Export::Local(local)) => local.clone(),
                    _ => imported,
                };
                self.value_decl(&next, &local, depth + 1)
            }
            None => target.decls.get(&imported).map(|decl| (target.clone(), imported.clone(), decl.clone())),
        }
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
                // An index signature (`[key: string]: unknown`) takes any key, and a call
                // signature makes it callable: TS checks those values (`Foreign`).
                if all.iter().any(|m| m.name == "[index]" || m.name == "[call]") {
                    return Ty::Foreign(path.into());
                }
                // Reserve the definition first, so a recursive field refers to it.
                let id = self.defs.len();
                self.defs.push(Def {
                    name: name.to_string(),
                    generics: Vec::new(),
                    kind: DefKind::Struct(Vec::new()),
                    origin: Origin::Ts { path: path.to_string() },
                    class: None,
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
        if members.iter().any(|m| m.name == "[index]" || m.name == "[call]") {
            return Ty::Foreign(path.into());
        }
        let id = self.defs.len();
        self.defs.push(Def {
            name: name.to_string(),
            generics: Vec::new(),
            kind: DefKind::Struct(Vec::new()),
            origin: Origin::Ts { path: path.to_string() },
            class: None,
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

/// The `.bloom` module and name a TS module's export `name` comes from, when
/// it re-exports one (`export { List } from "./list.bloom"`, through
/// `import`/`export` pairs and `export *`).
pub fn bloom_export(
    file: &Rc<TsFile>,
    name: &str,
    options: &Options,
    depth: usize,
) -> Option<(PathBuf, String)> {
    if depth > 8 {
        return None;
    }
    let follow = |specifier: &str, imported: &str| -> Option<(PathBuf, String)> {
        let path = resolve(&file.path, specifier, options)?;
        if specifier.ends_with(".bloom") {
            return Some((path, imported.to_string()));
        }
        bloom_export(&read(&path)?, imported, options, depth + 1)
    };
    match file.exports.get(name) {
        Some(Export::From(specifier, imported)) => follow(specifier, imported),
        Some(Export::Local(local)) => {
            let (specifier, imported) = file.imports.get(local)?;
            follow(specifier, imported)
        }
        None => file.stars.iter().find_map(|star| follow(star, name)),
    }
}

/// A function that is a component: an uppercase name, at most one parameter
/// (its props), returning an element (or, in a `.tsx` file, returning anything).
/// Whether props declare a `ref` (directly or as a member of an intersection).
fn has_ref_prop(props: &TsType) -> bool {
    match props {
        TsType::Object(members) => members.iter().any(|m| m.name == "ref"),
        TsType::Intersection(items) => items.iter().any(has_ref_prop),
        _ => false,
    }
}

/// Whether a function returns an element (or `null` beside one).
fn returns_element(function: &TsFn) -> bool {
    match &function.ret {
        Some(TsType::Ref(ret, _)) => REACT_ELEMENTS.contains(&ret.as_str()),
        Some(TsType::Union(members)) => members.iter().all(|m| {
            matches!(m, TsType::Null)
                || matches!(m, TsType::Ref(r, _) if REACT_ELEMENTS.contains(&r.as_str()))
        }),
        _ => false,
    }
}

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
