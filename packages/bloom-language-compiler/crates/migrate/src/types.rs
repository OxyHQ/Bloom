//! TypeScript types as Bloom types (spec 4.1). A type with no Bloom spelling
//! (an inline object, a literal type, an intersection, `any`) is a refusal.

use oxc_ast::ast::{FormalParameters, TSTupleElement, TSType, TSTypeName, TSTypeOperatorOperator};
use oxc_span::GetSpan;

use crate::module::{Tr, VIEW_TYPES, optional_ty};

impl Tr<'_> {
    pub fn ty(&mut self, ty: &TSType) -> String {
        match ty {
            TSType::TSStringKeyword(_) => "String".into(),
            TSType::TSNumberKeyword(_) => "Float".into(),
            TSType::TSBooleanKeyword(_) => "Bool".into(),
            TSType::TSVoidKeyword(_) | TSType::TSUndefinedKeyword(_) => "Unit".into(),
            TSType::TSParenthesizedType(inner) => self.ty(&inner.type_annotation),
            TSType::TSTypeOperatorType(op) if op.operator == TSTypeOperatorOperator::Readonly => {
                self.ty(&op.type_annotation)
            }
            TSType::TSArrayType(array) => format!("[{}]", self.ty(&array.element_type)),
            TSType::TSTupleType(tuple) => {
                let mut items = Vec::new();
                for element in &tuple.element_types {
                    match element.as_ts_type() {
                        Some(t) if !matches!(element, TSTupleElement::TSOptionalType(_)) => {
                            items.push(self.ty(t))
                        }
                        _ => {
                            return self.refuse(
                                "type:tuple",
                                "an optional or rest tuple element",
                                tuple.span,
                            );
                        }
                    }
                }
                format!("({})", items.join(", "))
            }
            TSType::TSUnionType(union) => {
                let nullish = |t: &TSType| {
                    matches!(
                        t,
                        TSType::TSNullKeyword(_) | TSType::TSUndefinedKeyword(_) | TSType::TSVoidKeyword(_)
                    )
                };
                let rest: Vec<&TSType> = union.types.iter().filter(|t| !nullish(t)).collect();
                let optional = rest.len() < union.types.len();
                match rest.as_slice() {
                    [only] => {
                        let inner = self.ty(only);
                        if optional { optional_ty(&inner) } else { inner }
                    }
                    _ => {
                        let literals: Option<Vec<String>> = rest.iter().map(|t| string_literal(t)).collect();
                        if let Some(literals) = literals {
                            let union = literals.join(" | ");
                            if optional { optional_ty(&union) } else { union }
                        } else {
                            self.refuse("type:union", "a union of several types", union.span)
                        }
                    }
                }
            }
            TSType::TSTypeReference(reference) => {
                // React's element types are a `View` (bloomc reads them so at the TS boundary).
                if self.is_react_element_type(&reference.type_name) {
                    return "View".into();
                }
                let name = match &reference.type_name {
                    TSTypeName::IdentifierReference(id) => id.name.to_string(),
                    // `React.ReactNode`: React's type by name, imported from `react`.
                    TSTypeName::QualifiedName(q)
                        if matches!(&q.left, TSTypeName::IdentifierReference(l)
                            if self.react.get(l.name.as_str()).is_some_and(|e| e == "default" || e == "*")) =>
                    {
                        let name = q.right.name.to_string();
                        self.react_types.insert(name.clone());
                        name
                    }
                    _ => {
                        return self.refuse(
                            "type:qualified",
                            format!("the qualified type `{}`", self.slice(reference.span)),
                            reference.span,
                        );
                    }
                };
                let args: Vec<String> = reference
                    .type_arguments
                    .as_ref()
                    .map(|a| a.params.iter().map(|t| self.ty(t)).collect())
                    .unwrap_or_default();
                if VIEW_TYPES.iter().any(|v| self.is_lang(&name, v)) {
                    return "View".into();
                }
                match (name.as_str(), args.as_slice()) {
                    ("Array" | "ReadonlyArray", [element]) => format!("[{element}]"),
                    ("Record", [key, value]) if key == "String" => format!("[String: {value}]"),
                    // Keyed by a union of strings: a `[String: V]`, whose keys bloomc no longer checks.
                    ("Record", [key, value]) if key != "Float" && key != "Int" && !key.starts_with('[') => {
                        self.review(format!(
                            "`{}` is a `[String: {value}]`: its keys are no longer checked",
                            self.slice(reference.span)
                        ));
                        format!("[String: {value}]")
                    }
                    ("Record", _) => {
                        self.refuse("type:record", "a `Record` not keyed by `string`", reference.span)
                    }
                    _ => {
                        self.used.insert(name.clone());
                        if args.is_empty() { name } else { format!("{name}<{}>", args.join(", ")) }
                    }
                }
            }
            TSType::TSFunctionType(f) => {
                self.fn_type(&f.params, Some(&f.return_type.type_annotation), f.span)
            }
            TSType::TSTypeLiteral(literal) => {
                // An inline object type is a record type: `{ a: Int, b: String? }`.
                let mut fields = Vec::new();
                for member in &literal.members {
                    if let Some((name, ty, optional)) = self.field(member) {
                        let ty = if optional { optional_ty(&ty) } else { ty };
                        fields.push(format!("{name}: {ty}"));
                    }
                }
                if fields.is_empty() {
                    return self.refuse("type:inline-object", "an empty object type", literal.span);
                }
                format!("{{ {} }}", fields.join(", "))
            }
            TSType::TSLiteralType(literal) => match string_literal(ty) {
                Some(s) => s,
                None => self.refuse("type:literal", "a literal type other than a string", literal.span),
            },
            TSType::TSIntersectionType(i) => self.refuse("type:intersection", "an intersection type", i.span),
            TSType::TSAnyKeyword(t) => self.refuse("type:any", "`any`", t.span),
            // `unknown` is exactly a `Foreign` (bloomc writes it back as `unknown`).
            TSType::TSUnknownKeyword(_) => "Foreign".into(),
            TSType::TSNullKeyword(t) => self.refuse("type:null", "`null` alone", t.span),
            other => {
                self.refuse("type:other", format!("the type `{}`", self.slice(other.span())), other.span())
            }
        }
    }

    /// `(a: A, b?: B) => R` as `(A, B?) -> R`.
    pub fn fn_type(
        &mut self,
        params: &FormalParameters,
        ret: Option<&TSType>,
        span: oxc_span::Span,
    ) -> String {
        let mut out = Vec::new();
        for param in &params.items {
            match &param.type_annotation {
                Some(t) => {
                    let ty = self.ty(&t.type_annotation);
                    out.push(if param.optional { optional_ty(&ty) } else { ty });
                }
                None => out.push(self.refuse(
                    "type:untyped-param",
                    "a function type's untyped parameter",
                    param.span,
                )),
            }
        }
        if params.rest.is_some() {
            out.push(self.refuse("param:rest", "a rest parameter", span));
        }
        let ret = ret.map_or_else(|| "Unit".to_string(), |t| self.ty(t));
        format!("({}) -> {ret}", out.join(", "))
    }
}

/// React's element types, as `react` exports them.
const REACT_ELEMENT_TYPES: &[&str] = &["ReactNode", "ReactElement"];

impl Tr<'_> {
    /// `ReactNode`/`ReactElement` imported from `react`, `React.ReactNode`, `JSX.Element`.
    fn is_react_element_type(&self, name: &TSTypeName) -> bool {
        let react_namespace = |n: &str| self.react.get(n).is_some_and(|e| e == "default" || e == "*");
        match name {
            TSTypeName::IdentifierReference(id) => self
                .react
                .get(id.name.as_str())
                .is_some_and(|export| REACT_ELEMENT_TYPES.contains(&export.as_str())),
            TSTypeName::QualifiedName(q) => match &q.left {
                TSTypeName::IdentifierReference(l) if react_namespace(&l.name) => {
                    REACT_ELEMENT_TYPES.contains(&q.right.name.as_str())
                }
                TSTypeName::IdentifierReference(l) => {
                    l.name == "JSX" && !self.imported.contains("JSX") && q.right.name == "Element"
                }
                TSTypeName::QualifiedName(inner) => {
                    matches!(&inner.left, TSTypeName::IdentifierReference(l) if react_namespace(&l.name))
                        && inner.right.name == "JSX"
                        && q.right.name == "Element"
                }
                _ => false,
            },
            _ => false,
        }
    }
}

/// `'a'` as the Bloom string literal type `"a"`.
fn string_literal(ty: &TSType) -> Option<String> {
    let TSType::TSLiteralType(literal) = ty else { return None };
    let oxc_ast::ast::TSLiteral::StringLiteral(s) = &literal.literal else { return None };
    Some(crate::expr::quote(s.value.as_str().unwrap_or_default()))
}
