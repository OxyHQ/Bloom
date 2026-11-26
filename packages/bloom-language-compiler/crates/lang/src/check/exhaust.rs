//! Exhaustiveness and reachability of `match` (spec 4.3), by the usefulness
//! algorithm: a pattern row is useful when some value matches it and no row
//! above. A match is exhaustive when a wildcard row would not be useful; the
//! missing cases are the witnesses that would be.

use crate::types::{Def, DefKind, Ty, substitute};

#[derive(Debug, Clone, PartialEq)]
pub enum Pat {
    Wild,
    /// A constructor by name (`some`, `ok`, a case, `true`, `tuple`, `struct`) and its fields.
    Ctor(String, Vec<Pat>),
    /// A literal of an infinite type (an Int, a String).
    Lit(String),
}

/// A type's constructors with their field types; `None` when infinite.
pub fn ctors(ty: &Ty, defs: &[Def]) -> Option<Vec<(String, Vec<Ty>)>> {
    Some(match ty {
        Ty::Bool => vec![("true".into(), vec![]), ("false".into(), vec![])],
        Ty::Unit => vec![("()".into(), vec![])],
        Ty::Option(inner) => vec![("none".into(), vec![]), ("some".into(), vec![(**inner).clone()])],
        Ty::Result(ok, err) => {
            vec![("ok".into(), vec![(**ok).clone()]), ("err".into(), vec![(**err).clone()])]
        }
        Ty::Tuple(items) => vec![("tuple".into(), items.clone())],
        Ty::Strings(set) => set.values.iter().map(|v| (format!("\"{v}\""), vec![])).collect(),
        Ty::Adt(def, args) => match &defs[*def].kind {
            DefKind::Enum(variants) => variants
                .iter()
                .map(|v| {
                    (format!(".{}", v.name), v.payload.iter().map(|(_, t)| substitute(t, args)).collect())
                })
                .collect(),
            DefKind::Struct(fields) => {
                vec![("struct".into(), fields.iter().map(|f| substitute(&f.ty, args)).collect())]
            }
            DefKind::Protocol(_) => return None,
        },
        _ => return None,
    })
}

fn specialize(rows: &[Vec<Pat>], name: &str, arity: usize) -> Vec<Vec<Pat>> {
    rows.iter()
        .filter_map(|row| match &row[0] {
            Pat::Ctor(c, args) if c == name => {
                let mut out = args.clone();
                out.resize(arity, Pat::Wild);
                out.extend(row[1..].iter().cloned());
                Some(out)
            }
            Pat::Lit(l) if l == name => Some(row[1..].to_vec()),
            Pat::Wild => {
                let mut out = vec![Pat::Wild; arity];
                out.extend(row[1..].iter().cloned());
                Some(out)
            }
            _ => None,
        })
        .collect()
}

fn default_rows(rows: &[Vec<Pat>]) -> Vec<Vec<Pat>> {
    rows.iter().filter(|row| row[0] == Pat::Wild).map(|row| row[1..].to_vec()).collect()
}

/// A value matching `rows` none of the rows match, if there is one.
pub fn witness(rows: &[Vec<Pat>], tys: &[Ty], defs: &[Def]) -> Option<Vec<Pat>> {
    if tys.is_empty() {
        return if rows.is_empty() { Some(Vec::new()) } else { None };
    }
    let head_names: Vec<String> = rows
        .iter()
        .filter_map(|row| match &row[0] {
            Pat::Ctor(name, _) | Pat::Lit(name) => Some(name.clone()),
            Pat::Wild => None,
        })
        .collect();
    match ctors(&tys[0], defs) {
        Some(all) if all.iter().all(|(name, _)| head_names.contains(name)) => {
            for (name, fields) in &all {
                let mut sub_tys = fields.clone();
                sub_tys.extend(tys[1..].iter().cloned());
                if let Some(found) = witness(&specialize(rows, name, fields.len()), &sub_tys, defs) {
                    let (args, rest) = found.split_at(fields.len());
                    let mut out = vec![Pat::Ctor(name.clone(), args.to_vec())];
                    out.extend(rest.iter().cloned());
                    return Some(out);
                }
            }
            None
        }
        all => {
            let found = witness(&default_rows(rows), &tys[1..], defs)?;
            let head = all
                .and_then(|all| all.into_iter().find(|(name, _)| !head_names.contains(name)))
                .map_or(Pat::Wild, |(name, fields)| Pat::Ctor(name, vec![Pat::Wild; fields.len()]));
            let mut out = vec![head];
            out.extend(found);
            Some(out)
        }
    }
}

/// Whether `row` matches a value no row of `rows` matches.
pub fn useful(rows: &[Vec<Pat>], row: &[Pat], tys: &[Ty], defs: &[Def]) -> bool {
    if row.is_empty() {
        return rows.is_empty();
    }
    let rest_tys = &tys[1..];
    match &row[0] {
        Pat::Ctor(name, args) => {
            let fields = ctors(&tys[0], defs)
                .and_then(|all| all.into_iter().find(|(n, _)| n == name).map(|(_, f)| f))
                .unwrap_or_else(|| vec![Ty::Unknown; args.len()]);
            let mut sub_row = args.clone();
            sub_row.resize(fields.len(), Pat::Wild);
            sub_row.extend(row[1..].iter().cloned());
            let mut sub_tys = fields.clone();
            sub_tys.extend(rest_tys.iter().cloned());
            useful(&specialize(rows, name, fields.len()), &sub_row, &sub_tys, defs)
        }
        Pat::Lit(name) => useful(&specialize(rows, name, 0), &row[1..], rest_tys, defs),
        Pat::Wild => {
            let head_names: Vec<String> = rows
                .iter()
                .filter_map(|r| match &r[0] {
                    Pat::Ctor(name, _) | Pat::Lit(name) => Some(name.clone()),
                    Pat::Wild => None,
                })
                .collect();
            match ctors(&tys[0], defs) {
                Some(all) if all.iter().all(|(name, _)| head_names.contains(name)) => {
                    all.iter().any(|(name, fields)| {
                        let mut sub_row = vec![Pat::Wild; fields.len()];
                        sub_row.extend(row[1..].iter().cloned());
                        let mut sub_tys = fields.clone();
                        sub_tys.extend(rest_tys.iter().cloned());
                        useful(&specialize(rows, name, fields.len()), &sub_row, &sub_tys, defs)
                    })
                }
                _ => useful(&default_rows(rows), &row[1..], rest_tys, defs),
            }
        }
    }
}

/// The missing cases of a match on `ty` with `rows` (one pattern each), as Bloom writes them.
pub fn missing(rows: &[Vec<Pat>], ty: &Ty, defs: &[Def]) -> Vec<String> {
    let mut out = Vec::new();
    match ctors(ty, defs) {
        Some(all) => {
            for (name, fields) in &all {
                let specialized = specialize(rows, name, fields.len());
                if let Some(found) = witness(&specialized, fields, defs) {
                    out.push(show(&Pat::Ctor(name.clone(), found)));
                }
            }
        }
        None => {
            if witness(rows, std::slice::from_ref(ty), defs).is_some() {
                out.push("_".into());
            }
        }
    }
    out
}

pub fn show(pat: &Pat) -> String {
    match pat {
        Pat::Wild => "_".into(),
        Pat::Lit(l) => l.clone(),
        Pat::Ctor(name, args) => {
            let args: Vec<String> = args.iter().map(show).collect();
            match name.as_str() {
                "tuple" => format!("({})", args.join(", ")),
                "struct" => "_".into(),
                "some" => args.first().cloned().unwrap_or_else(|| "_".into()),
                "none" | "true" | "false" | "()" => name.clone(),
                "ok" | "err" => format!(".{name}({})", args.join(", ")),
                _ if args.is_empty() => name.clone(),
                _ => format!("{name}({})", args.join(", ")),
            }
        }
    }
}
