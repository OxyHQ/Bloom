//! The tree of a `.bloom` file to a [`Doc`], with its comments put back.
//!
//! Comments come from the parser's side table, in source order, and are
//! emitted at the boundaries of sequences (imports, items, members, fields,
//! variants, statements, match arms, arguments, parameters, list elements and
//! chain links): a comment before an element leads it, a comment on the line
//! an element ends trails it, and what is left before a closing brace stays
//! inside the block. None is dropped: what no boundary claims is written at
//! the end of the file.
//!
//! Literals (numbers, strings) are written as the source wrote them, so a
//! string keeps its escapes and a raw string its indentation.

use std::collections::HashMap;

use bloom_lang::ast::*;

use crate::doc::{Doc, concat, group, if_break, indent, join, text};

pub struct Formatter<'a> {
    source: &'a str,
    comments: &'a [Comment],
    next: usize,
    /// `bloom migrate --from 0.x`: print 0.x forms as 2.0's.
    migrate: Option<Migration>,
}

/// What a 0.x-to-2.0 print needs: each local function's parameter labels (`Some(name)` when a
/// call names it, so it stays labelled; `None` prints `_`), and the notes on what stays 0.x.
#[derive(Debug, Default)]
pub struct Migration {
    pub labels: HashMap<String, Vec<Option<String>>>,
    /// Types a `public` declaration names: they become `public` too (0.x `pub` could name them).
    pub publicize: Vec<String>,
    pub notes: Vec<(Span, String)>,
}

fn line() -> Doc {
    Doc::Line
}
fn softline() -> Doc {
    Doc::SoftLine
}
fn hardline() -> Doc {
    Doc::HardLine
}

/// Comma-separated elements, and the comments trailing the last one (which
/// go after the trailing comma).
struct Commas {
    items: Vec<Doc>,
    last_trailing: Doc,
}

impl Commas {
    /// The elements and the trailing comma when broken, between `open` and
    /// `close` (`line` between brackets and elements: a space when flat, or nothing).
    fn wrap(self, open: &'static str, edge: fn() -> Doc, close: &'static str) -> Doc {
        if self.items.is_empty() {
            return text(format!("{open}{close}"));
        }
        group(concat(vec![
            text(open),
            indent(concat(vec![
                edge(),
                concat(self.items),
                if_break(text(","), Doc::Nil),
                self.last_trailing,
            ])),
            edge(),
            text(close),
        ]))
    }

    /// A bracketed list: one element per line, with a trailing comma, when it does not fit.
    fn bracketed(self, open: &'static str, close: &'static str) -> Doc {
        self.wrap(open, softline, close)
    }
}

impl<'a> Formatter<'a> {
    pub fn new(source: &'a str, comments: &'a Comments) -> Self {
        Self { source, comments: &comments.comments, next: 0, migrate: None }
    }

    /// A formatter that prints 0.x forms as 2.0's (`bloom migrate --from 0.x`).
    pub fn migrating(source: &'a str, comments: &'a Comments, migration: Migration) -> Self {
        Self { source, comments: &comments.comments, next: 0, migrate: Some(migration) }
    }

    /// The migration's notes: what it left in 0.x form, and why.
    pub fn into_notes(self) -> Vec<(Span, String)> {
        self.migrate.map(|m| m.notes).unwrap_or_default()
    }

    fn migrating_now(&self) -> bool {
        self.migrate.is_some()
    }

    fn note(&mut self, span: Span, text: impl Into<String>) {
        if let Some(m) = &mut self.migrate {
            m.notes.push((span, text.into()));
        }
    }

    fn slice(&self, span: Span) -> &'a str {
        &self.source[span.start as usize..span.end as usize]
    }

    // ----- comments -----

    fn comment_doc(comment: &Comment) -> Doc {
        match comment.kind {
            CommentKind::Line => text(format!("//{}", comment.text.trim_end())),
            CommentKind::Doc => text(format!("///{}", comment.text.trim_end())),
            CommentKind::Block => text(format!("/*{}*/", comment.text)),
        }
    }

    /// Whether any comment not yet written starts inside `span`.
    fn has_comment_in(&self, span: Span) -> bool {
        self.comments[self.next..].iter().any(|c| span.contains(c.span.start))
    }

    /// The comments before `offset`, each on its own line (a block comment
    /// followed on its line by code stays on that line), then a break.
    fn leading(&mut self, offset: u32) -> Doc {
        let mut out = Vec::new();
        while let Some(comment) = self.comments.get(self.next).filter(|c| c.span.start < offset) {
            self.next += 1;
            out.push(Self::comment_doc(comment));
            // The line breaks in the whitespace after it.
            let breaks = self.source[comment.span.end as usize..]
                .chars()
                .take_while(|c| c.is_whitespace())
                .filter(|&c| c == '\n')
                .count();
            out.push(match (comment.kind, breaks) {
                (CommentKind::Block, 0) => text(" "),
                (_, 0 | 1) => hardline(),
                _ => Doc::BlankLine,
            });
        }
        concat(out)
    }

    /// The comments on the line where an element ends, after it.
    fn trailing(&mut self, end: u32) -> Doc {
        let mut out = Vec::new();
        let mut end = end as usize;
        while let Some(comment) = self.comments.get(self.next) {
            let start = comment.span.start as usize;
            if start < end
                || !self.source[end..start].chars().all(|c| c == ' ' || c == '\t' || c == ',' || c == ';')
            {
                break;
            }
            self.next += 1;
            out.push(text(" "));
            out.push(Self::comment_doc(comment));
            if comment.kind != CommentKind::Block {
                out.push(Doc::BreakParent);
            }
            end = comment.span.end as usize;
        }
        concat(out)
    }

    /// The comments left before `offset` (a closing brace), each on its own line
    /// after the block's last element.
    fn dangling(&mut self, offset: u32) -> Doc {
        let mut out = Vec::new();
        while let Some(comment) = self.comments.get(self.next).filter(|c| c.span.start < offset) {
            self.next += 1;
            out.push(hardline());
            out.push(Self::comment_doc(comment));
            if comment.kind != CommentKind::Block {
                out.push(Doc::BreakParent);
            }
        }
        concat(out)
    }

    /// Whether the source has an empty line between `from` and `to`.
    fn blank_between(&self, from: u32, to: u32) -> bool {
        let (from, to) = (from as usize, (to as usize).max(from as usize));
        let mut breaks = 0;
        for c in self.source[from..to].chars() {
            match c {
                '\n' => {
                    breaks += 1;
                    if breaks >= 2 {
                        return true;
                    }
                }
                c if c.is_whitespace() => {}
                _ => breaks = 0,
            }
        }
        false
    }

    /// Elements one per line, each with its comments, keeping at most one
    /// empty line where the source had one.
    fn lines<T>(
        &mut self,
        items: &[T],
        span: impl Fn(&T) -> Span,
        mut print: impl FnMut(&mut Self, &T) -> Doc,
    ) -> Doc {
        let mut out = Vec::new();
        let mut previous_end: Option<u32> = None;
        for item in items {
            let item_span = span(item);
            let first =
                self.comments.get(self.next).map_or(item_span.start, |c| c.span.start.min(item_span.start));
            if let Some(end) = previous_end {
                out.push(if self.blank_between(end, first) { Doc::BlankLine } else { hardline() });
            }
            out.push(self.leading(item_span.start));
            out.push(print(self, item));
            out.push(self.trailing(item_span.end));
            previous_end = Some(item_span.end);
        }
        concat(out)
    }

    /// Comma-separated elements with their comments, for [`bracketed`].
    fn commas<T>(
        &mut self,
        items: &[T],
        span: impl Fn(&T) -> Span,
        mut print: impl FnMut(&mut Self, &T) -> Doc,
    ) -> Commas {
        let mut out = Vec::new();
        let mut last_trailing = Doc::Nil;
        let count = items.len();
        for (index, item) in items.iter().enumerate() {
            let item_span = span(item);
            out.push(self.leading(item_span.start));
            out.push(print(self, item));
            let trailing = self.trailing(item_span.end);
            if index + 1 < count {
                out.extend([text(","), trailing, line()]);
            } else {
                last_trailing = trailing;
            }
        }
        Commas { items: out, last_trailing }
    }

    // ----- file -----

    pub fn file(&mut self, file: &File) -> Doc {
        let mut out = Vec::new();
        // A header (comments before the first import, ending in an empty line)
        // stays at the top; the comments of each import move with it when the
        // imports are sorted by path (a stable sort).
        if let Some(first) = file.imports.first() {
            out.push(self.header(first.span.start));
        }
        let mut imports: Vec<(&str, Doc)> = Vec::new();
        for import in &file.imports {
            let leading = self.leading(import.span.start);
            let doc = self.import(import);
            let trailing = self.trailing(import.span.end);
            imports.push((import.source.as_str(), concat(vec![leading, doc, trailing])));
        }
        imports.sort_by(|a, b| a.0.cmp(b.0));
        out.push(join(imports.into_iter().map(|(_, doc)| doc).collect(), hardline));
        if !file.imports.is_empty() && !file.items.is_empty() {
            out.push(Doc::BlankLine);
        }
        out.push(self.lines(&file.items, |item| item.span, Self::item));
        // Comments after the last item end the file.
        let mut written = !file.imports.is_empty() || !file.items.is_empty();
        let mut end =
            file.items.last().map(|i| i.span.end).or(file.imports.last().map(|i| i.span.end)).unwrap_or(0);
        while let Some(comment) = self.comments.get(self.next) {
            if written {
                out.push(if self.blank_between(end, comment.span.start) {
                    Doc::BlankLine
                } else {
                    hardline()
                });
            }
            self.next += 1;
            out.push(Self::comment_doc(comment));
            end = comment.span.end;
            written = true;
        }
        concat(out)
    }

    /// The comments before `offset` up to the last one an empty line follows.
    fn header(&mut self, offset: u32) -> Doc {
        let pending = &self.comments[self.next..];
        let before: Vec<&Comment> = pending.iter().take_while(|c| c.span.start < offset).collect();
        let last = (0..before.len()).rev().find(|&i| {
            let next = before.get(i + 1).map_or(offset, |c| c.span.start);
            self.blank_between(before[i].span.end, next)
        });
        match last {
            Some(i) => self.leading(before[i].span.end),
            None => Doc::Nil,
        }
    }

    fn import(&mut self, import: &Import) -> Doc {
        let source = text(self.slice(import.source_span).to_string());
        match &import.kind {
            ImportKind::Module(_) => concat(vec![text("import "), source]),
            ImportKind::Namespace(name) => {
                concat(vec![text(format!("import * as {} from ", name.name)), source])
            }
            ImportKind::Named(specs) => {
                let specs = self.commas(
                    specs,
                    |s| s.span,
                    |_, spec| {
                        let mut s = String::new();
                        if spec.type_only {
                            s.push_str("type ");
                        }
                        s.push_str(&spec.name.name);
                        if let Some(alias) = &spec.alias {
                            s.push_str(" as ");
                            s.push_str(&alias.name);
                        }
                        text(s)
                    },
                );
                let specs = specs.wrap("{", line, "}");
                concat(vec![text("import "), specs, text(" from "), source])
            }
        }
    }

    // ----- items -----

    fn item(&mut self, item: &Item) -> Doc {
        let publicize = self.migrate.as_ref().is_some_and(|m| m.publicize.contains(&item.kind.name().name))
            && item.modifiers.visibility_span.is_none();
        let modifiers = concat(vec![
            if publicize { text("public ") } else { Doc::Nil },
            self.modifiers(item.visibility, &item.modifiers, false),
        ]);
        let kind = match &item.kind {
            ItemKind::Struct(StructDecl { name, generics: g, surface: Some(body), .. }) => {
                self.type_body("struct ", name, g, body, item.span)
            }
            ItemKind::View(ViewDecl { name, generics: g, constraints, surface: Some(body), .. }) => {
                let g = self.constrained_generics(g, constraints);
                self.type_body_with("struct ", name, g, body, item.span)
            }
            ItemKind::View(v) if self.migrating_now() && self.view_migrates(v) => {
                self.view_as_struct(v, item.span)
            }
            ItemKind::Struct(s) => self.struct_decl(s, item.span),
            ItemKind::Enum(e) => self.enum_decl(e, item.span),
            ItemKind::Alias(a) => concat(vec![
                text("type "),
                text(a.name.name.clone()),
                generics(&a.generics),
                text(" = "),
                self.ty(&a.ty),
            ]),
            ItemKind::Fn(f) => self.fn_decl(f),
            ItemKind::View(v) => self.view_decl(v),
            ItemKind::Const(c) => {
                let keyword = if c.mutable { "var " } else { "let " };
                self.binding_decl(keyword, text(c.name.name.clone()), c.ty.as_ref(), &c.value)
            }
            ItemKind::Extension(e) => self.type_body("extension ", &e.name, &e.generics, &e.body, item.span),
            ItemKind::Class(c) => {
                let keyword = if c.actor { "actor " } else { "class " };
                self.type_body(keyword, &c.name, &c.generics, &c.body, item.span)
            }
            ItemKind::Protocol(p) => self.protocol_decl(p, item.span),
            // A binding module's declarations stay as written (they are curated by hand).
            ItemKind::Extern(_) => return text(self.slice(item.span).trim_end().to_string()),
            ItemKind::Test(t) => concat(vec![
                text("test("),
                text(self.slice(t.name.span).to_string()),
                text(") "),
                self.block(&t.body, Layout::Broken),
            ]),
        };
        concat(vec![modifiers, kind])
    }

    /// `@Observable` (a line each), then `public private(set) static final `, as written.
    fn modifiers(&mut self, visibility: Visibility, modifiers: &Modifiers, inline: bool) -> Doc {
        let mut parts = Vec::new();
        for attr in &modifiers.attrs {
            parts.push(text(self.slice(attr.span).to_string()));
            parts.push(if inline { text(" ") } else { hardline() });
        }
        if let Some(span) = modifiers.visibility_span {
            let word = match visibility {
                Visibility::PubDefault => "pub default",
                Visibility::Public if self.migrating_now() => "public",
                _ => self.slice(span),
            };
            parts.push(text(format!("{word} ")));
        }
        if let Some((_, span)) = modifiers.setter {
            parts.push(text(format!("{} ", self.slice(span))));
        }
        if modifiers.is_static {
            parts.push(text("static "));
        }
        if modifiers.is_final {
            parts.push(text("final "));
        }
        concat(parts)
    }

    fn struct_decl(&mut self, s: &StructDecl, span: Span) -> Doc {
        let head = concat(vec![text("struct "), text(s.name.name.clone()), generics(&s.generics), text(" ")]);
        let fields = self.lines(
            &s.fields,
            |f| f.span,
            |this, field| {
                // Migrating: `let x: T`, or `var x: T = d` (a default is a `var`'s, as in Swift).
                let keyword = match (this.migrating_now(), field.default.is_some()) {
                    (false, _) => "",
                    (true, false) => "let ",
                    (true, true) => "var ",
                };
                let mut parts =
                    vec![text(keyword), text(field.name.name.clone()), text(": "), this.ty(&field.ty)];
                if let Some(default) = &field.default {
                    parts.push(text(" = "));
                    parts.push(this.expr(default));
                }
                concat(parts)
            },
        );
        concat(vec![head, self.braced(fields, span.end)])
    }

    /// A 2.0 type as written: `struct Name<T>: P, Q {`, its members one per line, `}`.
    fn type_body(
        &mut self,
        keyword: &'static str,
        name: &Ident,
        g: &[Ident],
        body: &TypeBody,
        span: Span,
    ) -> Doc {
        self.type_body_with(keyword, name, generics(g), body, span)
    }

    fn type_body_with(
        &mut self,
        keyword: &'static str,
        name: &Ident,
        g: Doc,
        body: &TypeBody,
        span: Span,
    ) -> Doc {
        let conformances = self.conformances(&body.conformances);
        let head = concat(vec![text(keyword), text(name.name.clone()), g, conformances, text(" ")]);
        let members = self.lines(&body.members, |m| m.span, Self::type_member);
        concat(vec![head, self.braced(members, span.end)])
    }

    fn type_member(&mut self, member: &TypeMember) -> Doc {
        let modifiers = self.modifiers(member.visibility, &member.modifiers, true);
        let kind = match &member.kind {
            TypeMemberKind::Stored { mutable, name, ty, value } => {
                let mut parts = vec![text(if *mutable { "var " } else { "let " }), text(name.name.clone())];
                if let Some(ty) = ty {
                    parts.push(text(": "));
                    parts.push(self.ty(ty));
                }
                if let Some(value) = value {
                    parts.push(text(" = "));
                    parts.push(self.expr(value));
                }
                concat(parts)
            }
            TypeMemberKind::Computed { name, ty, body } => concat(vec![
                text(format!("var {}: ", name.name)),
                self.ty(ty),
                text(" "),
                self.block(body, Layout::Broken),
            ]),
            TypeMemberKind::Func(f) if f.name.name == "init" => {
                // `init?` (failable: the parser gave it `Self?`), its parameters, `throws`.
                let mut parts =
                    vec![text(if f.ret.is_some() { "init?" } else { "init" }), self.params(&f.params)];
                if let Some(throws) = &f.throws {
                    parts.push(text(" throws"));
                    if let Some(ty) = &throws.ty {
                        parts.push(text("("));
                        parts.push(self.ty(ty));
                        parts.push(text(")"));
                    }
                }
                parts.push(text(" "));
                parts.push(self.block(&f.body, Layout::Own));
                concat(parts)
            }
            TypeMemberKind::Func(f) => self.fn_decl(f),
            TypeMemberKind::Let(l) => self.let_stmt(l),
        };
        // An attribute with arguments on a property stays on its line (`@Environment(\.x) var`).
        concat(vec![modifiers, kind])
    }

    fn enum_decl(&mut self, e: &EnumDecl, span: Span) -> Doc {
        let conformances = self.conformances(&e.conformances);
        let head = concat(vec![
            text("enum "),
            text(e.name.name.clone()),
            generics(&e.generics),
            conformances,
            text(" "),
        ]);
        // One variant per line, as a struct's fields; members (2.0) where they were written.
        let case = if e.swift || self.migrating_now() { "case " } else { "" };
        let mut entries: Vec<(Span, Result<&Variant, &TypeMember>)> =
            e.variants.iter().map(|v| (v.span, Ok(v))).collect();
        entries.extend(e.members.iter().map(|m| (m.span, Err(m))));
        entries.sort_by_key(|(span, _)| span.start);
        let variants = self.lines(
            &entries,
            |(span, _)| *span,
            |this, (_, entry)| match entry {
                Ok(v) => concat(vec![text(case), this.variant(v)]),
                Err(m) => this.type_member(m),
            },
        );
        concat(vec![head, self.braced(variants, span.end)])
    }

    /// `protocol P: Q { requirements }`.
    fn protocol_decl(&mut self, p: &ProtocolDecl, span: Span) -> Doc {
        let inherits = self.conformances(&p.inherits);
        let head = concat(vec![text("protocol "), text(p.name.name.clone()), inherits, text(" ")]);
        let lines = self.lines(
            &p.requirements,
            |r| match r {
                Requirement::Property { span, .. } => *span,
                Requirement::Func { decl, .. } => decl.span,
            },
            |this, r| match r {
                Requirement::Property { name, ty, settable, is_static, .. } => concat(vec![
                    text(if *is_static { "static var " } else { "var " }),
                    text(format!("{}: ", name.name)),
                    this.ty(ty),
                    text(if *settable { " { get set }" } else { " { get }" }),
                ]),
                Requirement::Func { decl, is_static } => {
                    concat(vec![text(if *is_static { "static " } else { "" }), this.fn_signature(decl)])
                }
            },
        );
        concat(vec![head, self.braced(lines, span.end)])
    }

    /// `: View, Equatable`.
    fn conformances(&mut self, types: &[TypeExpr]) -> Doc {
        if types.is_empty() {
            return Doc::Nil;
        }
        let docs = types.iter().map(|t| self.ty(t)).collect();
        concat(vec![text(": "), join(docs, || text(", "))])
    }

    fn variant(&mut self, variant: &Variant) -> Doc {
        if variant.payload.is_empty() {
            return text(variant.name.name.clone());
        }
        let payload = self.commas(
            &variant.payload,
            |p| p.span,
            |this, payload| match &payload.name {
                Some(name) => concat(vec![text(format!("{}: ", name.name)), this.ty(&payload.ty)]),
                None => this.ty(&payload.ty),
            },
        );
        concat(vec![text(variant.name.name.clone()), payload.bracketed("(", ")")])
    }

    fn fn_decl(&mut self, f: &FnDecl) -> Doc {
        let signature = self.fn_signature(f);
        concat(vec![signature, text(" "), self.block(&f.body, Layout::Own)])
    }

    /// `func name<T>(params) async throws -> R`, without the body.
    fn fn_signature(&mut self, f: &FnDecl) -> Doc {
        let mut parts = Vec::new();
        let func = f.func || self.migrating_now();
        if f.is_async && !func {
            parts.push(text("async "));
        }
        parts.push(text(if func { "func " } else { "fn " }));
        parts.push(text(if f.name.name == "==" { "== ".to_string() } else { f.name.name.clone() }));
        parts.push(self.constrained_generics(&f.generics, &f.constraints));
        let labels = self.migrate.as_ref().and_then(|m| m.labels.get(&f.name.name)).cloned();
        parts.push(self.params_labelled(&f.params, labels.as_deref()));
        if f.is_async && func {
            parts.push(text(" async"));
        }
        if let Some(throws) = &f.throws {
            parts.push(text(" throws"));
            if let Some(ty) = &throws.ty {
                parts.push(concat(vec![text("("), self.ty(ty), text(")")]));
            }
        }
        if let Some(ret) = &f.ret {
            parts.push(text(" -> "));
            parts.push(self.ty(ret));
        }
        concat(parts)
    }

    fn params(&mut self, params: &[Param]) -> Doc {
        self.params_labelled(params, None)
    }

    /// A 0.x `fn`'s parameters as a `func`'s: `_ name` unless a call labels it.
    fn params_labelled(&mut self, params: &[Param], labels: Option<&[Option<String>]>) -> Doc {
        let unlabelled: Vec<Span> = match labels {
            Some(labels) => params
                .iter()
                .zip(labels)
                .filter(|(p, label)| label.is_none() && p.label.is_none() && !p.rest && !p.spread)
                .map(|(p, _)| p.span)
                .collect(),
            None => Vec::new(),
        };
        let params = self.commas(
            params,
            |p| p.span,
            |this, param| {
                if param.spread {
                    let whole = param.whole.as_ref().map_or(String::new(), |w| format!("{}: ", w.name));
                    return concat(vec![text(format!("..{whole}")), this.ty(&param.ty)]);
                }
                let mut name =
                    if param.rest { format!("..{}", param.name.name) } else { param.name.name.clone() };
                if let Some(label) = &param.label {
                    name = format!("{} {name}", label.name);
                } else if unlabelled.contains(&param.span) {
                    name = format!("_ {name}");
                }
                let mut parts =
                    vec![text(name), text(if param.inout { ": inout " } else { ": " }), this.ty(&param.ty)];
                if let Some(default) = &param.default {
                    parts.push(text(" = "));
                    parts.push(this.expr(default));
                }
                concat(parts)
            },
        );
        params.bracketed("(", ")")
    }

    fn view_decl(&mut self, v: &ViewDecl) -> Doc {
        let keyword = match v.kind {
            // A menu's actions or content is 2.0 only (`struct X: MenuActions`): printed as a struct.
            ViewKind::View | ViewKind::MenuActions | ViewKind::MenuContent | ViewKind::Modifier => "view ",
            ViewKind::Screen => "screen ",
            ViewKind::Layout => "layout ",
        };
        let mut head = vec![text(keyword), text(v.name.name.clone())];
        if let Some(params) = &v.params {
            head.push(self.params(params));
        }
        head.push(text(" {"));
        let members = self.lines(&v.members, Member::span, Self::member);
        let mut inner = vec![members];
        let body_start = self
            .comments
            .get(self.next)
            .map_or(v.body_keyword.start, |c| c.span.start.min(v.body_keyword.start));
        if let Some(last) = v.members.last() {
            inner.push(if self.blank_between(last.span().end, body_start) {
                Doc::BlankLine
            } else {
                hardline()
            });
        }
        inner.push(self.leading(v.body_keyword.start));
        inner.push(text("body "));
        inner.push(self.block(&v.body, Layout::Broken));
        inner.push(self.trailing(v.body.span.end));
        inner.push(self.dangling(v.span.end));
        concat(vec![concat(head), indent(concat(vec![hardline(), concat(inner)])), hardline(), text("}")])
    }

    /// A 0.x view 2.0 can say: no `..Props` or rest props, `effect`, `@ref`, `@list` or `@record`.
    fn view_migrates(&mut self, v: &ViewDecl) -> bool {
        let mut why = None;
        if v.params.iter().flatten().any(|p| p.spread || p.rest) {
            why = Some("its `..Props` spread becomes stored properties by hand");
        }
        for member in &v.members {
            match member {
                Member::Effect(_) => {
                    why = Some("an `effect` becomes `.task(id:)`, `.onChange(of:)` or `.onAppear` by hand")
                }
                Member::State(state) if state.attr == StateAttr::Ref => {
                    why = Some("an `@ref` becomes a `class` held in `@State` by hand")
                }
                Member::State(state) if matches!(state.attr, StateAttr::List | StateAttr::Record) => {
                    why = Some("`@list`/`@record` wait for BloomData's 2.0 `@Model`")
                }
                _ => {}
            }
        }
        match why {
            Some(why) => {
                self.note(v.name.span, format!("view `{}` stays 0.x: {why}", v.name.name));
                false
            }
            None => true,
        }
    }

    /// `view X(p: T) { @state s = v; body { … } }` as `struct X: View { let p: T; @State private
    /// var s = v; var body: some View { … } }`.
    fn view_as_struct(&mut self, v: &ViewDecl, span: Span) -> Doc {
        enum Entry<'v> {
            Prop(&'v Param),
            Member(&'v Member),
            Body,
        }
        let mut entries: Vec<(Span, Entry)> =
            v.params.iter().flatten().map(|p| (p.span, Entry::Prop(p))).collect();
        entries.extend(v.members.iter().map(|m| (m.span(), Entry::Member(m))));
        entries.push((v.body_keyword.to(v.body.span), Entry::Body));
        let protocol = match v.kind {
            ViewKind::View => "View",
            ViewKind::Screen => "Screen",
            ViewKind::Layout => "Layout",
            ViewKind::MenuActions => "MenuActions",
            ViewKind::MenuContent => "MenuContent",
            ViewKind::Modifier => "ViewModifier",
        };
        let equatable =
            if v.members.iter().any(|m| matches!(m, Member::Equal(_))) { ", Equatable" } else { "" };
        let head = text(format!("struct {}: {protocol}{equatable} ", v.name.name));
        let lines = self.lines(
            &entries,
            |e| e.0,
            |this, (_, entry)| match entry {
                Entry::Prop(p) => {
                    let mut parts = vec![
                        text(if p.default.is_some() { "var " } else { "let " }),
                        text(p.name.name.clone()),
                        text(": "),
                        this.ty(&p.ty),
                    ];
                    if let Some(default) = &p.default {
                        parts.push(text(" = "));
                        parts.push(this.expr(default));
                    }
                    concat(parts)
                }
                Entry::Member(Member::State(state)) => {
                    let (attr, value) = match state.attr {
                        StateAttr::Env => (
                            concat(vec![
                                text("@Environment("),
                                this.expr(&state.value),
                                text(") private var "),
                            ]),
                            None,
                        ),
                        _ => (text("@State private var "), Some(&state.value)),
                    };
                    let mut parts = vec![attr, text(state.name.name.clone())];
                    if let Some(ty) = &state.ty {
                        parts.push(text(": "));
                        parts.push(this.ty(ty));
                    }
                    if let Some(value) = value {
                        parts.push(text(" = "));
                        parts.push(this.expr(value));
                    }
                    concat(parts)
                }
                Entry::Member(Member::Equal(e)) => concat(vec![
                    text(format!("static func == ({}: Self, {}: Self) -> Bool ", e.old.name, e.new.name)),
                    this.block(&e.body, Layout::Own),
                ]),
                Entry::Member(member) => this.member(member),
                Entry::Body => {
                    concat(vec![text("var body: some View "), this.block(&v.body, Layout::Broken)])
                }
            },
        );
        concat(vec![head, self.braced(lines, span.end)])
    }

    fn member(&mut self, member: &Member) -> Doc {
        match member {
            Member::State(state) => {
                let head = text(format!("@{} {}", state.attr.word(), state.name.name));
                self.binding_decl("", head, state.ty.as_ref(), &state.value)
            }
            Member::Let(l) => self.let_stmt(l),
            Member::Fn(f) => self.fn_decl(f),
            Member::Equal(e) => concat(vec![
                text(format!("equal({}, {}) ", e.old.name, e.new.name)),
                self.block(&e.body, Layout::Own),
            ]),
            Member::Effect(e) => {
                let mut parts = vec![text("effect")];
                if let Some(id) = &e.id {
                    parts.push(text("(id: "));
                    parts.push(self.expr(id));
                    parts.push(text(")"));
                }
                parts.push(text(" "));
                parts.push(self.block(&e.body, Layout::Own));
                concat(parts)
            }
        }
    }

    /// `«keyword»«name»[: T] = value`.
    fn binding_decl(&mut self, keyword: &'static str, name: Doc, ty: Option<&TypeExpr>, value: &Expr) -> Doc {
        let mut parts = vec![text(keyword), name];
        if let Some(ty) = ty {
            parts.push(text(": "));
            parts.push(self.ty(ty));
        }
        parts.push(text(" = "));
        parts.push(self.expr(value));
        concat(parts)
    }

    // ----- statements and blocks -----

    /// `{ … }` around lines already printed: `{}` when empty.
    fn braced(&mut self, lines: Doc, close: u32) -> Doc {
        let dangling = self.dangling(close);
        let empty = matches!(&lines, Doc::Concat(parts) if parts.is_empty())
            && matches!(&dangling, Doc::Concat(parts) if parts.is_empty());
        if empty {
            return text("{}");
        }
        concat(vec![text("{"), indent(concat(vec![hardline(), lines, dangling])), hardline(), text("}")])
    }

    /// A block: `{ one }` on one line when it holds one statement, no comment,
    /// and fits (and `flat` allows it); otherwise one statement per line.
    fn block(&mut self, block: &Block, layout: Layout) -> Doc {
        self.statements(&[], &block.stmts, block.span, layout)
    }

    /// `{ [header] statements }`: a closure's `a, b in` header, then its body.
    fn statements(&mut self, header: &[Doc], stmts: &[Stmt], span: Span, layout: Layout) -> Doc {
        let single = layout != Layout::Broken && stmts.len() == 1 && !self.has_comment_in(span);
        let header_doc =
            if header.is_empty() { Doc::Nil } else { concat(vec![concat(header.to_vec()), text(" in")]) };
        if stmts.is_empty() && !self.has_comment_in(span) {
            return if header.is_empty() {
                text("{}")
            } else {
                concat(vec![text("{ "), header_doc, text(" }")])
            };
        }
        let body = self.lines(stmts, |s| s.span, Self::stmt);
        if single {
            let inner = concat(vec![
                text("{"),
                indent(concat(vec![
                    line(),
                    if header.is_empty() { Doc::Nil } else { concat(vec![header_doc, line()]) },
                    body,
                ])),
                line(),
                text("}"),
            ]);
            return if layout == Layout::Shared { inner } else { group(inner) };
        }
        let dangling = self.dangling(span.end);
        let open = if header.is_empty() { text("{") } else { concat(vec![text("{ "), header_doc]) };
        concat(vec![open, indent(concat(vec![hardline(), body, dangling])), hardline(), text("}")])
    }

    fn stmt(&mut self, stmt: &Stmt) -> Doc {
        match &stmt.kind {
            StmtKind::Let(l) => self.let_stmt(l),
            StmtKind::Var(v) => {
                let keyword = if v.state.is_some() { "@State var " } else { "var " };
                self.binding_decl(keyword, text(v.name.name.clone()), v.ty.as_ref(), &v.value)
            }
            StmtKind::Assign(a) => {
                concat(vec![self.expr(&a.target), text(format!(" {} ", a.op.text())), self.expr(&a.value)])
            }
            StmtKind::Return(value) => match value {
                Some(value) => concat(vec![text("return "), self.expr(value)]),
                None => text("return"),
            },
            StmtKind::While(w) => concat(vec![
                text(label_text(w.label.as_ref())),
                text("while "),
                self.expr(&w.cond),
                text(" "),
                self.block(&w.body, Layout::Own),
            ]),
            StmtKind::For(f) => concat(vec![
                text(label_text(f.label.as_ref())),
                text("for "),
                self.pattern(&f.pattern),
                text(" in "),
                self.expr(&f.iter),
                text(" "),
                self.block(&f.body, Layout::Own),
            ]),
            StmtKind::Defer(b) => concat(vec![text("defer "), self.block(b, Layout::Own)]),
            StmtKind::Guard(g) => {
                let cond = self.cond(&g.cond);
                concat(vec![text("guard "), cond, text(" else "), self.block(&g.otherwise, Layout::Own)])
            }
            StmtKind::Throw(e) => concat(vec![text("throw "), self.expr(e)]),
            StmtKind::Break(label) => {
                text(format!("break{}", label.as_ref().map_or(String::new(), |l| format!(" {}", l.name))))
            }
            StmtKind::Continue(label) => {
                text(format!("continue{}", label.as_ref().map_or(String::new(), |l| format!(" {}", l.name))))
            }
            StmtKind::Do(d) => {
                let mut parts = vec![text("do "), self.block(&d.body, Layout::Own)];
                for catch in &d.catches {
                    parts.push(text(" catch "));
                    if let Some(name) = &catch.name {
                        parts.push(text(format!("let {}", name.name)));
                        if let Some(ty) = &catch.ty {
                            parts.push(text(" as "));
                            parts.push(self.ty(ty));
                        }
                        parts.push(text(" "));
                    } else if let Some(pattern) = &catch.pattern {
                        parts.push(self.pattern(pattern));
                        parts.push(text(" "));
                    }
                    parts.push(self.block(&catch.body, Layout::Own));
                }
                concat(parts)
            }
            StmtKind::Expr(e) => self.expr_in(e, Context::Statement),
        }
    }

    fn let_stmt(&mut self, l: &LetStmt) -> Doc {
        let pattern = self.pattern(&l.pattern);
        let keyword = if l.is_async { "async let " } else { "let " };
        self.binding_decl(keyword, pattern, l.ty.as_ref(), &l.value)
    }

    // ----- expressions -----

    fn expr(&mut self, e: &Expr) -> Doc {
        self.expr_in(e, Context::Value)
    }

    fn expr_in(&mut self, e: &Expr, context: Context) -> Doc {
        match &e.kind {
            ExprKind::Str { .. } if self.migrating_now() => text(swift_interpolation(self.slice(e.span))),
            ExprKind::Int(_) | ExprKind::Float(_) | ExprKind::Str { .. } => {
                text(self.slice(e.span).to_string())
            }
            ExprKind::Bool(b) => text(if *b { "true" } else { "false" }),
            ExprKind::None => text("none"),
            ExprKind::Unit => text("()"),
            ExprKind::Task(b) => concat(vec![text("task "), self.block(b, Layout::Own)]),
            ExprKind::Name(name) => text(name.clone()),
            ExprKind::ImplicitMember(name) => text(format!(".{}", name.name)),
            ExprKind::Binding(path) => {
                text(format!("${}", path.iter().map(|i| i.name.as_str()).collect::<Vec<_>>().join(".")))
            }
            ExprKind::KeyPath { root, path } => text(format!(
                "\\{}.{}",
                root.as_ref().map_or("", |r| r.name.as_str()),
                path.iter().map(|i| i.name.as_str()).collect::<Vec<_>>().join(".")
            )),
            ExprKind::TypeApply { name, args } => {
                let args = args.iter().map(|a| self.ty(a)).collect();
                concat(vec![text(name.name.clone()), text("<"), join(args, || text(", ")), text(">")])
            }
            ExprKind::Paren(inner) => concat(vec![text("("), self.expr(inner), text(")")]),
            ExprKind::Throwing(kind, inner) => {
                let word = match kind {
                    TryKind::Plain => "try ",
                    TryKind::Optional => "try? ",
                    TryKind::Force => "try! ",
                };
                concat(vec![text(word), self.expr(inner)])
            }
            ExprKind::Tuple(items) => self.commas(items, |i| i.span, Self::expr).bracketed("(", ")"),
            ExprKind::List(items) => self.commas(items, |i| i.span, Self::expr).bracketed("[", "]"),
            ExprKind::Spread(inner) => concat(vec![text(".."), self.expr(inner)]),
            ExprKind::Is(inner, ty) => concat(vec![self.expr(inner), text(" is "), self.ty(ty)]),
            ExprKind::CastAs(inner, ty, forced) => {
                concat(vec![self.expr(inner), text(if *forced { " as! " } else { " as? " }), self.ty(ty)])
            }
            ExprKind::Map(entries) if entries.is_empty() => text("[:]"),
            ExprKind::Map(entries) => {
                let entries = self.commas(
                    entries,
                    |(k, v)| k.span.to(v.span),
                    |this, (k, v)| concat(vec![this.expr(k), text(": "), this.expr(v)]),
                );
                entries.bracketed("[", "]")
            }
            ExprKind::Record(entries) => {
                let entries = self.commas(entries, record_entry_span, |this, entry| match entry {
                    RecordEntry::Field { key, value } => {
                        let name = if record_key_is_name(&key.name) {
                            key.name.clone()
                        } else {
                            format!("{:?}", key.name)
                        };
                        concat(vec![text(name), text(": "), this.expr(value)])
                    }
                    RecordEntry::Spread(value) => concat(vec![text(".."), this.expr(value)]),
                });
                entries.wrap("{", line, "}")
            }
            ExprKind::Unary(op, inner) => {
                concat(vec![text(if *op == UnaryOp::Not { "!" } else { "-" }), self.expr(inner)])
            }
            ExprKind::InOut(inner) => concat(vec![text("&"), self.expr(inner)]),
            ExprKind::Binary(op, ..) => self.binary(e, *op),
            ExprKind::Ternary(c, a, b) => {
                concat(vec![self.expr(c), text(" ? "), self.expr(a), text(" : "), self.expr(b)])
            }
            ExprKind::Await(inner) => concat(vec![text("await "), self.expr(inner)]),
            ExprKind::Try(_)
            | ExprKind::Force(_)
            | ExprKind::Field(..)
            | ExprKind::OptField(..)
            | ExprKind::Index(..)
            | ExprKind::OptIndex(..)
            | ExprKind::KeyPathIndex(..) => self.chain(e, context),
            ExprKind::Call(call) if is_member(&call.callee) => self.chain(e, context),
            ExprKind::Call(call) => {
                let callee = self.expr(&call.callee);
                self.call_tail(callee, call)
            }
            ExprKind::Closure(closure) => self.closure(closure),
            ExprKind::If(i) => self.if_expr(i),
            ExprKind::Match(m) => self.match_expr(m, e.span),
            // A file with syntax errors is never formatted; this is never reached.
            ExprKind::Error => text(self.slice(e.span).to_string()),
        }
    }

    /// `a op b op c`: one level of the same precedence, breaking after each
    /// operator when it does not fit.
    fn binary(&mut self, e: &Expr, op: BinaryOp) -> Doc {
        // `0..<n`, `1...n`: Swift's form, with no spaces and no break.
        if op.is_range()
            && let ExprKind::Binary(_, lo, hi) = &e.kind
        {
            return concat(vec![self.expr(lo), text(op.text().to_string()), self.expr(hi)]);
        }
        let mut operands = Vec::new();
        let mut operators = Vec::new();
        let mut current = e;
        while let ExprKind::Binary(o, left, right) = &current.kind
            && o.precedence() == op.precedence()
        {
            operands.push(right.as_ref());
            operators.push(*o);
            current = left;
        }
        operands.push(current);
        operands.reverse();
        operators.reverse();
        let first = self.expr(operands[0]);
        let mut rest = Vec::new();
        for (operator, operand) in operators.iter().zip(&operands[1..]) {
            // A line cannot end with `>` (it may close a type's arguments), so `<` and `>`
            // start the next line instead.
            if matches!(operator, BinaryOp::Lt | BinaryOp::Gt) {
                rest.push(line());
                rest.push(text(format!("{} ", operator.text())));
            } else {
                rest.push(text(format!(" {}", operator.text())));
                rest.push(line());
            }
            rest.push(self.expr(operand));
        }
        group(concat(vec![first, indent(concat(rest))]))
    }

    /// `head.a(…).b(…)`: one call link per line once it does not fit (or its
    /// head spans lines). A builder's line keeps its links at its own indent; a
    /// chain inside an expression indents them, and breaks only with two calls
    /// or more (`items.filter { … }` breaks inside its closure instead).
    fn chain(&mut self, e: &Expr, context: Context) -> Doc {
        let mut links: Vec<Link<'_>> = Vec::new();
        let mut current = e;
        loop {
            match &current.kind {
                ExprKind::Field(inner, name) => {
                    links.push(Link::Member { name, optional: false, call: None });
                    current = inner;
                }
                ExprKind::OptField(inner, name) => {
                    links.push(Link::Member { name, optional: true, call: None });
                    current = inner;
                }
                ExprKind::Call(call) if is_member(&call.callee) => {
                    let (inner, name, optional) = match &call.callee.kind {
                        ExprKind::Field(inner, name) => (inner, name, false),
                        ExprKind::OptField(inner, name) => (inner, name, true),
                        _ => unreachable!("is_member"),
                    };
                    links.push(Link::Member { name, optional, call: Some(call) });
                    current = inner;
                }
                ExprKind::Index(inner, index) => {
                    links.push(Link::Index(index, false));
                    current = inner;
                }
                ExprKind::OptIndex(inner, index) => {
                    links.push(Link::Index(index, true));
                    current = inner;
                }
                ExprKind::KeyPathIndex(inner, key) => {
                    links.push(Link::KeyPath(key));
                    current = inner;
                }
                ExprKind::Try(inner) => {
                    links.push(Link::Try);
                    current = inner;
                }
                ExprKind::Force(inner) => {
                    links.push(Link::Force);
                    current = inner;
                }
                _ => break,
            }
        }
        links.reverse();
        let head = self.expr(current);
        let calls = links.iter().filter(|l| matches!(l, Link::Member { call: Some(_), .. })).count();
        // Each call link starts a line; fields, indexes and `?` stay on the line before.
        let mut lines: Vec<Vec<Doc>> = vec![vec![head]];
        for link in &links {
            match link {
                Link::Member { name, optional, call } => {
                    let dot = text(format!("{}.{}", if *optional { "?" } else { "" }, name.name));
                    match call {
                        Some(call) => {
                            let leading = self.leading(name.span.start);
                            let tail = self.call_tail(dot, call);
                            lines.push(vec![leading, tail]);
                        }
                        None => lines.last_mut().expect("head").push(dot),
                    }
                }
                Link::Index(index, optional) => {
                    let index = self.expr(index);
                    let open = if *optional { "?[" } else { "[" };
                    lines.last_mut().expect("head").extend([text(open), index, text("]")]);
                }
                Link::KeyPath(key) => {
                    let key = self.expr(key);
                    lines.last_mut().expect("head").extend([text("[keyPath: "), key, text("]")]);
                }
                Link::Try => lines.last_mut().expect("head").push(text("?")),
                Link::Force => lines.last_mut().expect("head").push(text("!")),
            }
        }
        let mut lines = lines.into_iter().map(concat);
        let first = lines.next().expect("head");
        let breaks = match context {
            Context::Statement => calls >= 1,
            Context::Value => calls >= 2,
        };
        if !breaks {
            return concat(std::iter::once(first).chain(lines).collect());
        }
        let rest = concat(lines.flat_map(|line| [softline(), line]).collect());
        match context {
            Context::Statement => group(concat(vec![first, rest])),
            Context::Value => group(concat(vec![first, indent(rest)])),
        }
    }

    /// `(args)` and a trailing closure after a callee.
    fn call_tail(&mut self, callee: Doc, call: &Call) -> Doc {
        let mut parts = vec![callee];
        if call.optional {
            parts.push(text("?."));
        }
        // `label: { … }` after the trailing closure (2.0): written after it, so printed there.
        let after = call.trailing.as_ref().map_or(u32::MAX, |t| t.span.end);
        let (inside, outside): (Vec<Arg>, Vec<Arg>) =
            call.args.iter().cloned().partition(|a| a.span.start < after);
        if call.parens {
            let inserted = self.inserted_labels(call);
            let args = self.commas(
                &inside,
                |a| a.span,
                |this, arg| {
                    let value = this.expr(&arg.value);
                    let inserted = inserted.iter().find(|(span, _)| *span == arg.span).map(|(_, l)| l);
                    match (&arg.label, arg.spread, inserted) {
                        (_, true, _) => concat(vec![text(".."), value]),
                        (Some(label), false, _) => concat(vec![text(format!("{}: ", label.name)), value]),
                        (None, false, Some(label)) => concat(vec![text(format!("{label}: ")), value]),
                        (None, false, None) => value,
                    }
                },
            );
            parts.push(args.bracketed("(", ")"));
        }
        if let Some(trailing) = &call.trailing {
            parts.push(text(" "));
            parts.push(self.closure(trailing));
        }
        for arg in &outside {
            let ExprKind::Closure(closure) = &arg.value.kind else { continue };
            let label = arg.label.as_ref().map_or("", |l| l.name.as_str());
            parts.push(text(format!(" {label}: ")));
            parts.push(self.closure(closure));
        }
        concat(parts)
    }

    /// Migrating, a positional argument to a parameter that stays labelled gets its label.
    fn inserted_labels(&self, call: &Call) -> Vec<(Span, String)> {
        let Some(m) = &self.migrate else { return Vec::new() };
        let ExprKind::Name(name) = &call.callee.kind else { return Vec::new() };
        let Some(labels) = m.labels.get(name) else { return Vec::new() };
        let mut filled: Vec<bool> = labels
            .iter()
            .map(|label| {
                label
                    .as_ref()
                    .is_some_and(|l| call.args.iter().any(|a| a.label.as_ref().is_some_and(|x| &x.name == l)))
            })
            .collect();
        let mut out = Vec::new();
        for arg in call.args.iter().filter(|a| a.label.is_none() && !a.spread) {
            let Some(slot) = filled.iter().position(|f| !f) else { break };
            filled[slot] = true;
            if let Some(label) = &labels[slot] {
                out.push((arg.span, label.clone()));
            }
        }
        out
    }

    fn closure(&mut self, closure: &Closure) -> Doc {
        // `reduce(0, +)`: an operator passed as a function, as written.
        if let Some(op) = closure.operator {
            return text(op.text());
        }
        let header: Vec<Doc> = if closure.has_in {
            let params = closure
                .params
                .iter()
                .map(|p| match &p.ty {
                    Some(ty) => concat(vec![text(format!("{}: ", p.name.name)), self.ty(ty)]),
                    None => text(p.name.name.clone()),
                })
                .collect();
            let params = join(params, || text(", "));
            match &closure.ret {
                // `{ () -> T in … }`, `{ (a: Int) -> T in … }`: Swift's signature.
                Some(ret) => vec![concat(vec![text("("), params, text(") -> "), self.ty(ret)])],
                None => vec![if closure.tuple { concat(vec![text("("), params, text(")")]) } else { params }],
            }
        } else {
            Vec::new()
        };
        self.statements(&header, &closure.body, closure.span, Layout::Own)
    }

    /// An `if`/`else` chain: its blocks are one group, so they go on one line
    /// together or each on its own lines.
    fn if_expr(&mut self, i: &IfExpr) -> Doc {
        group(self.if_chain(i))
    }

    fn cond(&mut self, cond: &Cond) -> Doc {
        match cond {
            Cond::Expr(e) => self.expr(e),
            // `if let x { … }` (Swift 5.7's shorthand): written as it was.
            Cond::Let(pattern, value)
                if value.span == pattern.span
                    && matches!((&pattern.kind, &value.kind), (PatternKind::Bind(a), ExprKind::Name(b)) if a.name == *b) =>
            {
                concat(vec![text("let "), self.pattern(pattern)])
            }
            Cond::Let(pattern, value) => {
                concat(vec![text("let "), self.pattern(pattern), text(" = "), self.expr(value)])
            }
        }
    }

    fn if_chain(&mut self, i: &IfExpr) -> Doc {
        let cond = self.cond(&i.cond);
        let mut parts = vec![text("if "), cond, text(" "), self.block(&i.then, Layout::Shared)];
        if let Some(otherwise) = &i.otherwise {
            parts.push(text(" else "));
            parts.push(match otherwise.as_ref() {
                Else::If(Expr { kind: ExprKind::If(inner), .. }) => self.if_chain(inner),
                Else::If(e) => self.expr(e),
                Else::Block(b) => self.block(b, Layout::Shared),
            });
        }
        concat(parts)
    }

    /// `switch x {` then `case .a, .b:`, `case let .c(v) where v > 0:`, `default:`, each
    /// with its statements indented under it.
    fn switch_expr(&mut self, m: &MatchExpr, span: Span) -> Doc {
        let scrutinee = self.expr(&m.scrutinee);
        let arms = self.lines(
            &m.arms,
            |a| a.span,
            |this, arm| {
                let mut parts = Vec::new();
                if arm.pattern.kind == PatternKind::Wildcard && this.slice(arm.pattern.span) == "default" {
                    parts.push(text("default"));
                } else {
                    parts.push(text(if binds(&arm.pattern) { "case let " } else { "case " }));
                    let alternatives = match &arm.pattern.kind {
                        PatternKind::Or(alternatives) => alternatives.iter().collect(),
                        _ => vec![&arm.pattern],
                    };
                    let docs: Vec<Doc> = alternatives.into_iter().map(|p| this.pattern(p)).collect();
                    parts.push(join(docs, || text(", ")));
                }
                if let Some(guard) = &arm.guard {
                    parts.push(text(" where "));
                    parts.push(this.expr(guard));
                }
                parts.push(text(":"));
                let body = match &arm.body {
                    ArmBody::Expr(e) => this.expr_in(e, Context::Statement),
                    ArmBody::Block(b) if b.stmts.is_empty() => text("break"),
                    ArmBody::Block(b) => this.lines(&b.stmts, |s| s.span, |this, stmt| this.stmt(stmt)),
                };
                parts.push(indent(concat(vec![hardline(), body])));
                concat(parts)
            },
        );
        // Swift's layout: the cases at the switch's own indentation.
        let dangling = self.dangling(span.end);
        concat(vec![
            text("switch "),
            scrutinee,
            text(" {"),
            hardline(),
            arms,
            dangling,
            hardline(),
            text("}"),
        ])
    }

    fn match_expr(&mut self, m: &MatchExpr, span: Span) -> Doc {
        if m.switch || self.migrating_now() {
            return self.switch_expr(m, span);
        }
        let scrutinee = self.expr(&m.scrutinee);
        let arms = self.lines(
            &m.arms,
            |a| a.span,
            |this, arm| {
                let mut parts = vec![text("case "), this.pattern(&arm.pattern)];
                if let Some(guard) = &arm.guard {
                    parts.push(text(" if "));
                    parts.push(this.expr(guard));
                }
                parts.push(text(" => "));
                parts.push(match &arm.body {
                    ArmBody::Expr(e) => this.expr(e),
                    // `=> draft = Draft()`: one statement that is not an expression
                    // parses as this block without its braces.
                    ArmBody::Block(b)
                        if b.stmts.len() == 1
                            && !matches!(b.stmts[0].kind, StmtKind::Expr(_))
                            && !this.has_comment_in(b.span) =>
                    {
                        this.stmt(&b.stmts[0])
                    }
                    ArmBody::Block(b) => this.block(b, Layout::Own),
                });
                concat(parts)
            },
        );
        concat(vec![text("match "), scrutinee, text(" "), self.braced(arms, span.end)])
    }

    // ----- patterns and types -----

    fn pattern(&mut self, p: &Pattern) -> Doc {
        match &p.kind {
            PatternKind::Wildcard => text("_"),
            PatternKind::Bind(name) => text(name.name.clone()),
            PatternKind::Literal(e) => self.expr(e),
            PatternKind::None => text("none"),
            PatternKind::Case { ty, name, args } => {
                let mut parts = Vec::new();
                if let Some(ty) = ty {
                    parts.push(text(ty.name.clone()));
                }
                parts.push(text(format!(".{}", name.name)));
                if let Some(args) = args {
                    let args = args.iter().map(|a| self.pattern(a)).collect();
                    parts.extend([text("("), join(args, || text(", ")), text(")")]);
                }
                concat(parts)
            }
            PatternKind::Tuple(items) => {
                let items = items.iter().map(|a| self.pattern(a)).collect();
                concat(vec![text("("), join(items, || text(", ")), text(")")])
            }
            PatternKind::Record(fields) => {
                let fields = fields
                    .iter()
                    .map(|(name, pattern)| match pattern {
                        Some(pattern) => {
                            concat(vec![text(format!("{}: ", name.name)), self.pattern(pattern)])
                        }
                        None => text(name.name.clone()),
                    })
                    .collect();
                concat(vec![text("{ "), join(fields, || text(", ")), text(" }")])
            }
            PatternKind::Or(options) => {
                let options = options.iter().map(|a| self.pattern(a)).collect();
                join(options, || text(" | "))
            }
        }
    }

    fn ty(&mut self, t: &TypeExpr) -> Doc {
        // `any P`: an existential, read as `any` applied to `P`.
        if let TypeKind::Named { name, args } = &t.kind
            && name.name == "any"
            && let [inner] = args.as_slice()
        {
            return concat(vec![text("any "), self.ty(inner)]);
        }
        // `some View`: the word, then the type it was read as.
        let word = "some ";
        if self.slice(t.span).starts_with(word) {
            let inner = TypeExpr {
                kind: t.kind.clone(),
                span: Span::new(t.span.start + word.len() as u32, t.span.end),
            };
            return concat(vec![text(word), self.ty(&inner)]);
        }
        match &t.kind {
            TypeKind::Named { name, args } if args.is_empty() => text(name.name.clone()),
            TypeKind::Named { name, args } => {
                let args = args.iter().map(|a| self.ty(a)).collect();
                concat(vec![text(name.name.clone()), text("<"), join(args, || text(", ")), text(">")])
            }
            TypeKind::List(inner) => concat(vec![text("["), self.ty(inner), text("]")]),
            TypeKind::Map(k, v) => concat(vec![text("["), self.ty(k), text(": "), self.ty(v), text("]")]),
            TypeKind::Strings(values) => {
                text(values.iter().map(|v| format!("{v:?}")).collect::<Vec<_>>().join(" | "))
            }
            TypeKind::Composition(parts) => {
                let parts = parts.iter().map(|p| self.ty(p)).collect();
                join(parts, || text(" & "))
            }
            TypeKind::Record(fields) => {
                let fields: Vec<Doc> = fields
                    .iter()
                    .map(|(name, t)| {
                        let key = if record_key_is_name(&name.name) {
                            name.name.clone()
                        } else {
                            format!("{:?}", name.name)
                        };
                        concat(vec![text(key), text(": "), self.ty(t)])
                    })
                    .collect();
                if fields.is_empty() {
                    text("{}")
                } else {
                    concat(vec![text("{ "), join(fields, || text(", ")), text(" }")])
                }
            }
            TypeKind::Tuple(items) => {
                let items = items.iter().map(|a| self.ty(a)).collect();
                concat(vec![text("("), join(items, || text(", ")), text(")")])
            }
            TypeKind::Fn { is_async, throws, params, ret } => {
                let params = params.iter().map(|a| self.ty(a)).collect();
                // Swift's spelling: `(A) async throws -> R`.
                let effects = match (*is_async, *throws) {
                    (true, true) => ") async throws -> ",
                    (true, false) => ") async -> ",
                    (false, true) => ") throws -> ",
                    (false, false) => ") -> ",
                };
                concat(vec![text("("), join(params, || text(", ")), text(effects), self.ty(ret)])
            }
            // An optional function or union keeps its parentheses: `() -> Int?` returns an
            // optional, and `"a" | "b"?` is not a type.
            TypeKind::Optional(inner) if matches!(inner.kind, TypeKind::Fn { .. } | TypeKind::Strings(_)) => {
                concat(vec![text("("), self.ty(inner), text(")?")])
            }
            TypeKind::Optional(inner) => concat(vec![self.ty(inner), text("?")]),
            TypeKind::Error => text(self.slice(t.span).to_string()),
        }
    }
}

/// How a block of one statement may lie.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Layout {
    /// Always one statement per line (a view's body).
    Broken,
    /// On one line when it fits, by itself.
    Own,
    /// On one line when the group around it (an `if`/`else` chain) fits.
    Shared,
}

#[derive(Clone, Copy)]
enum Context {
    /// A builder line or an expression statement: chain links keep its indent.
    Statement,
    /// Inside another expression: chain links are indented.
    Value,
}

enum Link<'e> {
    Member {
        name: &'e Ident,
        optional: bool,
        call: Option<&'e Call>,
    },
    /// `[i]`, or `?[i]` (optional).
    Index(&'e Expr, bool),
    /// `[keyPath: k]`.
    KeyPath(&'e Expr),
    Try,
    Force,
}

fn is_member(callee: &Expr) -> bool {
    matches!(callee.kind, ExprKind::Field(..) | ExprKind::OptField(..))
}

impl Formatter<'_> {
    /// `<T, U: Equatable & Hashable>`.
    fn constrained_generics(&mut self, names: &[Ident], constraints: &[(Ident, TypeExpr)]) -> Doc {
        if constraints.is_empty() {
            return generics(names);
        }
        let mut parts = vec![text("<")];
        for (index, name) in names.iter().enumerate() {
            if index > 0 {
                parts.push(text(", "));
            }
            parts.push(text(name.name.clone()));
            let bounds: Vec<&TypeExpr> =
                constraints.iter().filter(|(n, _)| n.name == name.name).map(|(_, ty)| ty).collect();
            for (k, ty) in bounds.into_iter().enumerate() {
                parts.push(text(if k == 0 { ": " } else { " & " }));
                parts.push(self.ty(ty));
            }
        }
        parts.push(text(">"));
        concat(parts)
    }
}

fn generics(names: &[Ident]) -> Doc {
    if names.is_empty() {
        return Doc::Nil;
    }
    text(format!("<{}>", names.iter().map(|n| n.name.as_str()).collect::<Vec<_>>().join(", ")))
}

fn record_entry_span(entry: &RecordEntry) -> Span {
    match entry {
        RecordEntry::Field { key, value } => key.span.to(value.span),
        RecordEntry::Spread(value) => value.span,
    }
}

/// Whether a record key is written bare (`name:`) rather than quoted (`"aria-label":`).
fn record_key_is_name(key: &str) -> bool {
    let mut chars = key.chars();
    chars.next().is_some_and(|c| c.is_ascii_alphabetic() || c == '_')
        && chars.all(|c| c.is_ascii_alphanumeric() || c == '_')
}

/// A pattern that binds a name (`case let` in a `switch`).
fn binds(p: &Pattern) -> bool {
    match &p.kind {
        PatternKind::Bind(_) => true,
        PatternKind::Case { args, .. } => args.iter().flatten().any(binds),
        PatternKind::Tuple(items) | PatternKind::Or(items) => items.iter().any(binds),
        PatternKind::Record(fields) => fields.iter().any(|(_, p)| p.as_ref().is_none_or(binds)),
        PatternKind::Wildcard | PatternKind::Literal(_) | PatternKind::None => false,
    }
}

/// A string literal's 0.x `${x}` interpolations as 2.0's `\(x)`.
fn swift_interpolation(literal: &str) -> String {
    let bytes = literal.as_bytes();
    let mut out = String::with_capacity(literal.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'\\' && i + 1 < bytes.len() {
            out.push_str(&literal[i..i + 2]);
            i += 2;
            continue;
        }
        if bytes[i] == b'$' && bytes.get(i + 1) == Some(&b'{') {
            let mut depth = 1;
            let mut j = i + 2;
            while j < bytes.len() && depth > 0 {
                match bytes[j] {
                    b'{' => depth += 1,
                    b'}' => depth -= 1,
                    _ => {}
                }
                if depth > 0 {
                    j += 1;
                }
            }
            out.push_str("\\(");
            out.push_str(&swift_interpolation(&literal[i + 2..j.min(bytes.len())]));
            out.push(')');
            i = j + 1;
            continue;
        }
        let ch = literal[i..].chars().next().expect("a char");
        out.push(ch);
        i += ch.len_utf8();
    }
    out
}

/// `outer: ` before a named loop.
fn label_text(label: Option<&bloom_lang::ast::Ident>) -> String {
    label.map_or_else(String::new, |l| format!("{}: ", l.name))
}
