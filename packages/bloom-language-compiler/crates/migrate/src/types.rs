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
            // `Child[]`: a list that may hold `null`/`false` (drawn as nothing), `[View?]`.
            TSType::TSArrayType(array) => match &array.element_type {
                TSType::TSTypeReference(r)
                    if let TSTypeName::IdentifierReference(id) = &r.type_name
                        && self.is_lang(&id.name, "Child") =>
                {
                    "[View?]".to_string()
                }
                element => format!("[{}]", self.ty(element)),
            },
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
                            // No Bloom union of several types: the TS union, kept as a `Foreign`.
                            let text: Vec<&str> = rest.iter().map(|t| self.slice(t.span())).collect();
                            let ty = self.foreign_ty(&text.join(" | "));
                            if optional { optional_ty(&ty) } else { ty }
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
                // The language's own node types (`ScrollViewNode`, `VStackNode`) are views: a node
                // of that kind is handed to it, and its modifiers chain on it (core14's answer to
                // repros/mention16/runtime-node-types).
                if name.ends_with("Node") && name.len() > 4 && self.lang.contains_key(name.as_str()) {
                    return "View".into();
                }
                // TS's utility types have no Bloom spelling: the TS type, kept as a `Foreign`.
                const UTILITY: &[&str] = &[
                    "ReturnType",
                    "Parameters",
                    "Awaited",
                    "NonNullable",
                    "Partial",
                    "Required",
                    "Pick",
                    "Omit",
                    "Exclude",
                    "Extract",
                    "InstanceType",
                    "ComponentProps",
                    "ComponentPropsWithoutRef",
                ];
                // JS's own classes and DOM types as types: the TS type, kept as a `Foreign`.
                // (`Date` is the standard library's, a JS `Date` itself.)
                const JS_TYPES: &[&str] = &[
                    "RegExp",
                    "Error",
                    "URL",
                    "Blob",
                    "File",
                    "FormData",
                    "HTMLElement",
                    "HTMLDivElement",
                    "HTMLInputElement",
                    "Element",
                    "Event",
                    "KeyboardEvent",
                    "MouseEvent",
                    "AbortController",
                    "AbortSignal",
                    "Response",
                    "Headers",
                ];
                if JS_TYPES.contains(&name.as_str())
                    && reference.type_arguments.is_none()
                    && !self.objects.contains(&name)
                    && !self.unions.contains_key(&name)
                    && !self.imported.contains(name.as_str())
                {
                    let text = self.slice(reference.span).to_string();
                    return self.foreign_ty(&text);
                }
                if UTILITY.contains(&name.as_str())
                    && !self.objects.contains(&name)
                    && !self.unions.contains_key(&name)
                {
                    let text = self.slice(reference.span).to_string();
                    return self.foreign_ty(&text);
                }
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
                    // A read-only set or map is the value-semantics `Set`/`Map` (no one writes through it).
                    ("ReadonlySet", [element]) if !self.imported.contains("ReadonlySet") => {
                        format!("Set<{element}>")
                    }
                    ("ReadonlyMap", [key, value]) if !self.imported.contains("ReadonlyMap") => {
                        format!("Map<{key}, {value}>")
                    }
                    // `Readonly<T>`: a Bloom value is not written through a `let`, so it is `T`.
                    ("Readonly", [inner])
                        if !self.objects.contains(&name) && !self.imported.contains("Readonly") =>
                    {
                        inner.clone()
                    }
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
            // `Request & { signal?: AbortSignal }` of the file's object types and inline ones: one
            // record type of all their fields (no general intersection; a later field wins, as in TS).
            TSType::TSIntersectionType(i) => {
                let mut fields: Vec<String> = Vec::new();
                let push = |fields: &mut Vec<String>, field: String| {
                    let name = field.split(':').next().unwrap_or_default().to_string();
                    fields.retain(|f| f.split(':').next() != Some(name.as_str()));
                    fields.push(field);
                };
                for part in &i.types {
                    match part {
                        TSType::TSTypeLiteral(literal) => {
                            for member in &literal.members {
                                let Some((name, ty, optional)) = self.field(member) else {
                                    return self.refuse("type:intersection", "an intersection type", i.span);
                                };
                                push(
                                    &mut fields,
                                    format!("{name}: {}", if optional { optional_ty(&ty) } else { ty }),
                                );
                            }
                        }
                        TSType::TSTypeReference(r)
                            if r.type_arguments.is_none()
                                && let TSTypeName::IdentifierReference(id) = &r.type_name
                                && let Some(own) = self.object_fields.get(id.name.as_str()).cloned() =>
                        {
                            for field in own {
                                push(&mut fields, field);
                            }
                        }
                        // An object type imported from another TS file: its fields written out.
                        TSType::TSTypeReference(r)
                            if r.type_arguments.is_none()
                                && let TSTypeName::IdentifierReference(id) = &r.type_name
                                && self.imported.contains(id.name.as_str())
                                && let Some(external) = self.external_props(&id.name) =>
                        {
                            for f in external {
                                let ty = if f.optional { optional_ty(&f.ty) } else { f.ty };
                                push(&mut fields, format!("{}: {ty}", f.name));
                            }
                        }
                        _ => return self.refuse("type:intersection", "an intersection type", i.span),
                    }
                }
                format!("{{ {} }}", fields.join(", "))
            }
            TSType::TSAnyKeyword(_) => self.foreign_ty("any"),
            // `object`: a TS value Bloom passes on as it is.
            TSType::TSObjectKeyword(_) => self.foreign_ty("object"),
            // `unknown` is the stdlib's `JSONValue` (`Foreign<"unknown">`), read leniently:
            // `x.object`, `x.string`, `x["k"]` are `none` on a mismatch (the lead's decision).
            TSType::TSUnknownKeyword(_) => "Foreign<\"unknown\">".into(),
            TSType::TSNullKeyword(t) => self.refuse("type:null", "`null` alone", t.span),
            // `(x): x is T`: a test, so a `Bool`. TS's narrowing at the call is bloomc's to
            // check (an `is`/`!= none` test narrows; anything else it refuses).
            TSType::TSTypePredicate(p) if !p.asserts => "Bool".into(),
            // `X['k']`, `keyof X`, `typeof f`, `ReturnType<…>`: the TS type, kept as a `Foreign`.
            TSType::TSIndexedAccessType(_) | TSType::TSTypeOperatorType(_) | TSType::TSTypeQuery(_) => {
                let text = self.slice(ty.span()).to_string();
                self.foreign_ty(&text)
            }
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
    /// `ReactNode` itself (imported from `react`, or `React.ReactNode`), which holds `undefined`.
    pub fn is_react_node(&self, ty: &TSType) -> bool {
        let TSType::TSTypeReference(r) = ty else { return false };
        let named = match &r.type_name {
            TSTypeName::IdentifierReference(id) => self.react.get(id.name.as_str()).map(String::as_str),
            TSTypeName::QualifiedName(q) => Some(q.right.name.as_str()),
            _ => None,
        };
        named == Some("ReactNode") && self.is_react_element_type(&r.type_name)
    }

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
