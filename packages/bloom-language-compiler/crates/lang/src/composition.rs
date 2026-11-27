//! Swift's protocol composition (`P & Q`) in a constraint: `<T: P & Q>` and `where T: P & Q` are
//! read as one constraint per protocol by the parser, and a `type PQ = P & Q` of the module named
//! in a constraint (`<T: PQ>`) is spread here into its protocols, before checking. The alias
//! itself is a name for constraints only: it declares no type, and is not emitted.
//!
//! Not yet: `any P & Q` (an existential with a witness per protocol), and a composition alias
//! imported from another module.

use rustc_hash::FxHashMap as HashMap;

use crate::ast::*;

pub fn lower(file: &mut File) {
    let mut compositions: HashMap<String, Vec<TypeExpr>> = HashMap::default();
    file.items.retain(|item| match &item.kind {
        ItemKind::Alias(AliasDecl {
            name,
            generics,
            ty: TypeExpr { kind: TypeKind::Composition(parts), .. },
        }) if generics.is_empty() => {
            compositions.insert(name.name.clone(), parts.clone());
            false
        }
        _ => true,
    });
    if compositions.is_empty() {
        return;
    }
    // An alias of a composition that names another (`type PQR = PQ & R`), spread to its protocols.
    let names: Vec<String> = compositions.keys().cloned().collect();
    for _ in 0..names.len() {
        for name in &names {
            let parts = compositions[name].clone();
            let spread = spread(&parts, &compositions);
            compositions.insert(name.clone(), spread);
        }
    }
    for item in &mut file.items {
        match &mut item.kind {
            ItemKind::Fn(f) => expand(&mut f.constraints, &compositions),
            ItemKind::View(v) => expand(&mut v.constraints, &compositions),
            ItemKind::Class(c) => {
                for member in &mut c.body.members {
                    if let TypeMemberKind::Func(f) = &mut member.kind {
                        expand(&mut f.constraints, &compositions);
                    }
                }
            }
            _ => {}
        }
    }
}

fn spread(parts: &[TypeExpr], compositions: &HashMap<String, Vec<TypeExpr>>) -> Vec<TypeExpr> {
    let mut out = Vec::new();
    for part in parts {
        match &part.kind {
            TypeKind::Named { name, args } if args.is_empty() && compositions.contains_key(&name.name) => {
                out.extend(compositions[&name.name].iter().cloned());
            }
            _ => out.push(part.clone()),
        }
    }
    out
}

fn expand(constraints: &mut Vec<(Ident, TypeExpr)>, compositions: &HashMap<String, Vec<TypeExpr>>) {
    let mut out = Vec::with_capacity(constraints.len());
    for (param, bound) in constraints.drain(..) {
        match &bound.kind {
            TypeKind::Named { name, args } if args.is_empty() && compositions.contains_key(&name.name) => {
                for part in &compositions[&name.name] {
                    // Each protocol where the alias was named, so a diagnostic points there.
                    out.push((param.clone(), TypeExpr { kind: part.kind.clone(), span: bound.span }));
                }
            }
            _ => out.push((param, bound)),
        }
    }
    *constraints = out;
}
