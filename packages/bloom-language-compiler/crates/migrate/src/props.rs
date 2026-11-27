//! A view's props typed by an interface of another TS file (`function X({ a }: XProps)`, with
//! `XProps` from `./types`): Bloom 2.0 has no `..Props` spread, so the view's stored
//! properties are that interface's fields, written out (ADR 0002), and the types they name
//! are imported where the interface's file has them.

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Declaration, ImportDeclarationSpecifier, ModuleExportName, PropertyKey, Statement,
    TSInterfaceDeclaration, TSSignature, TSType,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};

use crate::comments::Comments;

/// One field of the props: its name, its Bloom type and whether TS's field is optional.
#[derive(Debug, Clone)]
pub struct Field {
    pub name: String,
    pub ty: String,
    pub optional: bool,
}

/// The fields of `name` as declared in the module `specifier` imports from `from` (the
/// view's file), and the types they name: (specifier relative to `from`, name). `None` when
/// the interface is not a plain object type the codemod can write out (generics, methods,
/// index signatures, a base it cannot read, a type with no Bloom form).
pub fn external_fields(
    from: &str,
    specifier: &str,
    name: &str,
) -> Option<(Vec<Field>, Vec<(String, String)>)> {
    let file = resolve(Path::new(from), specifier)?;
    let mut imports = Vec::new();
    let fields = fields_in(&file, from, specifier, name, &mut imports, 0)?;
    Some((fields, imports))
}

/// The file a relative specifier names (`./types` → `./types.ts`).
fn resolve(from: &Path, specifier: &str) -> Option<PathBuf> {
    if !(specifier.starts_with("./") || specifier.starts_with("../")) {
        return None;
    }
    let base = from.parent()?.join(specifier);
    let candidates = [
        base.with_extension("ts"),
        base.with_extension("tsx"),
        base.with_extension("d.ts"),
        base.join("index.ts"),
        base.join("index.tsx"),
    ];
    candidates.into_iter().find(|p| p.is_file())
}

/// `to` as a specifier from the directory of `from` (`./x`, `../y/z`), without its extension.
fn relative(from: &Path, to: &Path) -> Option<String> {
    let from_dir = from.parent()?;
    let normalize = |p: &Path| -> Vec<String> {
        let mut out: Vec<String> = Vec::new();
        for c in p.components() {
            match c {
                std::path::Component::CurDir => {}
                std::path::Component::ParentDir => {
                    if out.last().is_some_and(|l| l != "..") {
                        out.pop();
                    } else {
                        out.push("..".into());
                    }
                }
                other => out.push(other.as_os_str().to_string_lossy().into_owned()),
            }
        }
        out
    };
    let a = normalize(from_dir);
    let mut b = normalize(to);
    let last = b.pop()?;
    let stem = last.strip_suffix(".d.ts").or_else(|| last.rsplit_once('.').map(|(s, _)| s)).unwrap_or(&last);
    let stem = if stem == "index" && !b.is_empty() { None } else { Some(stem.to_string()) };
    let common = a.iter().zip(&b).take_while(|(x, y)| x == y).count();
    let mut parts: Vec<String> = vec![if a.len() == common { ".".into() } else { String::new() }];
    parts.retain(|p| !p.is_empty());
    parts.extend(std::iter::repeat_n("..".to_string(), a.len() - common));
    parts.extend(b[common..].iter().cloned());
    parts.extend(stem);
    Some(parts.join("/"))
}

fn fields_in(
    file: &Path,
    view: &str,
    specifier: &str,
    name: &str,
    imports: &mut Vec<(String, String)>,
    depth: u32,
) -> Option<Vec<Field>> {
    if depth > 4 {
        return None;
    }
    let source = std::fs::read_to_string(file).ok()?;
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(file).unwrap_or_default();
    let parsed = Parser::new(&allocator, &source, source_type).parse();
    if parsed.diagnostics.has_errors() {
        return None;
    }
    let program = parsed.program;
    // The file's own type names (exported or not) and its imports: local → (specifier, exported).
    let mut declared: HashMap<String, bool> = HashMap::new();
    let mut imported: HashMap<String, (String, String)> = HashMap::new();
    let mut private_aliases: HashMap<String, &TSType> = HashMap::new();
    let mut interface: Option<&TSInterfaceDeclaration> = None;
    let mut alias_members: Option<&oxc_allocator::Vec<TSSignature>> = None;
    for statement in &program.body {
        let (declaration, exported) = match statement {
            Statement::ExportDeclaration(e) => (Some(&e.declaration), true),
            Statement::ImportDeclaration(import) => {
                let from = import.source.value.as_str().unwrap_or_default().to_string();
                for s in import.specifiers.iter().flatten() {
                    if let ImportDeclarationSpecifier::ImportSpecifier(s) = s {
                        let exported = match &s.imported {
                            ModuleExportName::IdentifierName(n) => n.name.to_string(),
                            ModuleExportName::IdentifierReference(n) => n.name.to_string(),
                            ModuleExportName::StringLiteral(n) => {
                                n.value.as_str().unwrap_or_default().to_string()
                            }
                        };
                        imported.insert(s.local.name.to_string(), (from.clone(), exported));
                    }
                }
                continue;
            }
            other => (other.as_declaration(), false),
        };
        match declaration {
            Some(Declaration::TSInterfaceDeclaration(i)) => {
                declared.insert(i.id.name.to_string(), exported);
                if i.id.name == name {
                    interface = Some(&**i);
                }
            }
            Some(Declaration::TSTypeAliasDeclaration(a)) => {
                declared.insert(a.id.name.to_string(), exported);
                if !exported && a.type_parameters.is_none() {
                    private_aliases.insert(a.id.name.to_string(), &a.type_annotation);
                }
                if a.id.name == name {
                    if a.type_parameters.is_some() {
                        return None;
                    }
                    match &a.type_annotation {
                        TSType::TSTypeLiteral(l) => alias_members = Some(&l.members),
                        _ => return None,
                    }
                }
            }
            Some(Declaration::TSEnumDeclaration(e)) => {
                declared.insert(e.id.name.to_string(), exported);
            }
            Some(Declaration::ClassDeclaration(c)) => {
                if let Some(id) = &c.id {
                    declared.insert(id.name.to_string(), exported);
                }
            }
            _ => {}
        }
    }
    let mut fields = Vec::new();
    let members: &oxc_allocator::Vec<TSSignature> = match (interface, alias_members) {
        (Some(i), _) => {
            if i.type_parameters.is_some() {
                return None;
            }
            // `interface P extends Q, R`: Q's and R's fields first (each in this file or
            // imported by it), without type arguments.
            for base in &i.extends {
                if base.type_arguments.is_some() {
                    return None;
                }
                let oxc_ast::ast::TSTypeName::IdentifierReference(id) = &base.type_name else { return None };
                let base_fields = if declared.contains_key(id.name.as_str()) {
                    fields_in(file, view, specifier, &id.name, imports, depth + 1)?
                } else {
                    let (from, exported) = imported.get(id.name.as_str())?;
                    let base_file = resolve(file, from)?;
                    let base_specifier = relative(Path::new(view), &base_file)?;
                    fields_in(&base_file, view, &base_specifier, exported, imports, depth + 1)?
                };
                fields.extend(base_fields);
            }
            &i.body.body
        }
        (None, Some(members)) => members,
        (None, None) => return None,
    };
    // The members' types, translated as the props file writes them.
    let file_name = file.to_string_lossy().into_owned();
    let mut tr = crate::module::new_tr(&source, &file_name, Comments::new(&source, &program.comments));
    tr.quiet = true;
    for member in members {
        let TSSignature::TSPropertySignature(p) = member else { return None };
        let key = match &p.key {
            PropertyKey::StaticIdentifier(id) => id.name.to_string(),
            PropertyKey::StringLiteral(s)
                if crate::module::is_identifier(s.value.as_str().unwrap_or_default()) =>
            {
                s.value.as_str().unwrap_or_default().to_string()
            }
            _ => return None,
        };
        let annotation = p.type_annotation.as_ref()?;
        let mut ty = tr.ty(&annotation.type_annotation);
        if !tr.reasons.is_empty() {
            return None;
        }
        // The type names it uses, imported where the props file has them; a type alias the
        // file keeps to itself (`type UserNameView = (props: P) => V`) is written in place.
        let span_text = |t: &TSType| -> &str { &source[t.span().start as usize..t.span().end as usize] };
        let mut pending: Vec<String> = type_names(span_text(&annotation.type_annotation));
        let mut inlined = 0;
        while let Some(word) = pending.pop() {
            if let Some(alias) = private_aliases.get(&word) {
                inlined += 1;
                if inlined > 8 {
                    return None;
                }
                let text = tr.ty(alias);
                if !tr.reasons.is_empty() {
                    return None;
                }
                let text = if text.contains([' ', '|', '-']) { format!("({text})") } else { text };
                ty = substitute(&ty, &word, &text)?;
                pending.extend(type_names(span_text(alias)));
            } else if let Some(exported) = declared.get(&word) {
                if !exported {
                    return None;
                }
                imports.push((specifier.to_string(), word));
            } else if let Some((from, exported)) = imported.get(&word) {
                if exported != &word {
                    return None;
                }
                let specifier = if from.starts_with('.') {
                    relative(Path::new(view), &resolve(file, from)?)?
                } else {
                    from.clone()
                };
                imports.push((specifier, word));
            }
        }
        // A field redeclared by the interface itself replaces its base's.
        fields.retain(|f: &Field| f.name != key);
        fields.push(Field { name: key, ty, optional: p.optional });
    }
    Some(fields)
}

/// The capitalised identifiers of a TS type's text (`ProfileData['privacy']`, `Href | null`).
fn type_names(text: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut word = String::new();
    let mut quoted: Option<char> = None;
    for c in text.chars().chain(std::iter::once(' ')) {
        if let Some(q) = quoted {
            if c == q {
                quoted = None;
            }
            continue;
        }
        if c == '\'' || c == '"' || c == '`' {
            quoted = Some(c);
            word.clear();
            continue;
        }
        if c.is_alphanumeric() || c == '_' || c == '$' {
            word.push(c);
            continue;
        }
        if word.starts_with(|w: char| w.is_ascii_uppercase()) && c != '.' && !out.contains(&word) {
            out.push(word.clone());
        }
        // `React.ReactNode`: the namespace is not a type of the file.
        word.clear();
    }
    out
}

/// `text` with each whole-word `name` as `replacement`; `None` when one is inside a string
/// (a `Foreign<"…">` type text, which cannot hold a Bloom type).
fn substitute(text: &str, name: &str, replacement: &str) -> Option<String> {
    let mut out = String::with_capacity(text.len());
    let mut quoted = false;
    let mut i = 0;
    let bytes = text.as_bytes();
    while i < text.len() {
        if bytes[i] == b'"' {
            quoted = !quoted;
        }
        let boundary_before = i == 0 || !(bytes[i - 1].is_ascii_alphanumeric() || bytes[i - 1] == b'_');
        if boundary_before && text[i..].starts_with(name) {
            let after = text[i + name.len()..].chars().next();
            if after.is_none_or(|c| !(c.is_alphanumeric() || c == '_')) {
                if quoted {
                    return None;
                }
                out.push_str(replacement);
                i += name.len();
                continue;
            }
        }
        let c = text[i..].chars().next()?;
        out.push(c);
        i += c.len_utf8();
    }
    Some(out)
}
