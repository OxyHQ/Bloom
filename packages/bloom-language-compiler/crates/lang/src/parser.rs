//! Recursive descent for items and statements, Pratt for expressions
//! (spec section 3). Errors recover at item, statement and closing-brace
//! boundaries: after one error the parser stays quiet until it resynchronises,
//! so one typo reports one error.

use crate::ast::*;
use crate::diagnostic::Diagnostic;
use crate::lexer::{Kw, P, RawPart, Tok, Token, lex};

pub fn parse(source: &str) -> (File, Comments, Vec<Diagnostic>) {
    let lexed = lex(source, 0, source.len());
    let mut next_id = 0;
    let mut parser = Parser::new(source, lexed.tokens, &mut next_id);
    parser.diagnostics = lexed.diagnostics;
    let file = parser.file();
    let diagnostics = parser.diagnostics;
    let mut comments = lexed.comments;
    comments.extend(parser.sub_comments);
    comments.sort_by_key(|c| c.span.start);
    (file, Comments { comments }, diagnostics)
}

struct Parser<'s, 'i> {
    source: &'s str,
    tokens: Vec<Token>,
    pos: usize,
    next_id: &'i mut u32,
    diagnostics: Vec<Diagnostic>,
    /// After an error, quiet until the next synchronisation point.
    panicking: bool,
    /// Comments found inside interpolations.
    sub_comments: Vec<Comment>,
}

/// Where an expression is read: a head (`if x {`) never takes a trailing closure.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Ctx {
    Normal,
    Head,
}

fn describe(tok: &Tok) -> String {
    match tok {
        Tok::Ident(name) => format!("`{name}`"),
        Tok::Kw(kw) => format!("`{}`", kw.word()),
        Tok::Int(v) => format!("`{v}`"),
        Tok::Float(v) => format!("`{v}`"),
        Tok::Str { .. } => "a string".into(),
        Tok::P(p) => format!("`{}`", p.text()),
        Tok::Newline => "a line break".into(),
        Tok::Eof => "the end of the file".into(),
    }
}

fn is_upper(name: &str) -> bool {
    name.chars().next().is_some_and(|c| c.is_ascii_uppercase())
}

impl<'s, 'i> Parser<'s, 'i> {
    fn new(source: &'s str, tokens: Vec<Token>, next_id: &'i mut u32) -> Self {
        Self {
            source,
            tokens,
            pos: 0,
            next_id,
            diagnostics: Vec::new(),
            panicking: false,
            sub_comments: Vec::new(),
        }
    }

    // ---- tokens -------------------------------------------------------

    fn tok(&self) -> &Tok {
        &self.tokens[self.pos].tok
    }

    fn token(&self) -> &Token {
        &self.tokens[self.pos]
    }

    fn nth(&self, n: usize) -> &Tok {
        &self.tokens[(self.pos + n).min(self.tokens.len() - 1)].tok
    }

    fn span(&self) -> Span {
        self.tokens[self.pos].span
    }

    fn prev_end(&self) -> u32 {
        if self.pos == 0 { 0 } else { self.tokens[self.pos - 1].span.end }
    }

    /// Moves past the current token; its span.
    fn bump(&mut self) -> Span {
        let token = self.tokens[self.pos].span;
        if self.pos < self.tokens.len() - 1 {
            self.pos += 1;
        }
        token
    }

    fn at(&self, p: P) -> bool {
        matches!(self.tok(), Tok::P(q) if *q == p)
    }

    fn at_kw(&self, kw: Kw) -> bool {
        matches!(self.tok(), Tok::Kw(k) if *k == kw)
    }

    fn eat(&mut self, p: P) -> bool {
        if self.at(p) {
            self.bump();
            true
        } else {
            false
        }
    }

    fn eat_kw(&mut self, kw: Kw) -> bool {
        if self.at_kw(kw) {
            self.bump();
            true
        } else {
            false
        }
    }

    fn skip_newlines(&mut self) {
        while matches!(self.tok(), Tok::Newline) || self.at(P::Semi) {
            self.bump();
        }
    }

    /// Whether the next token after any line breaks is `kw` (an `else` on
    /// the line after `}`).
    fn next_line_is(&self, kw: Kw) -> bool {
        let mut at = self.pos;
        while matches!(self.tokens[at].tok, Tok::Newline) {
            at += 1;
        }
        matches!(self.tokens[at].tok, Tok::Kw(k) if k == kw)
    }

    fn id(&mut self) -> ExprId {
        let id = ExprId(*self.next_id);
        *self.next_id += 1;
        id
    }

    fn expr_node(&mut self, kind: ExprKind, span: Span) -> Expr {
        Expr { id: self.id(), kind, span }
    }

    // ---- errors -------------------------------------------------------

    fn error(&mut self, diagnostic: Diagnostic) {
        if !self.panicking {
            self.diagnostics.push(diagnostic);
        }
        self.panicking = true;
    }

    fn unexpected(&mut self, expected: &str) {
        let found = describe(self.tok());
        let span = self.span();
        let mut diagnostic = Diagnostic::error("B0101", span, format!("expected {expected}, found {found}"))
            .label(format!("expected {expected} here"))
            .spec("3-grammar-ebnf");
        if let Tok::Ident(name) = self.tok()
            && let Some(kw) = keyword_typo(name)
        {
            diagnostic = diagnostic.help(format!("write `{kw}`")).fix(span, kw);
        }
        self.error(diagnostic);
    }

    fn expect(&mut self, p: P, expected: &str) -> Option<Span> {
        if self.at(p) {
            Some(self.bump())
        } else {
            self.unexpected(expected);
            None
        }
    }

    /// The closing delimiter of `open` at `open_span`.
    fn expect_close(&mut self, close: P, open_span: Span) -> bool {
        self.skip_newlines_if(close == P::RBrace);
        if self.eat(close) {
            return true;
        }
        let found = describe(self.tok());
        let span = self.span();
        let open = match close {
            P::RParen => "(",
            P::RBracket => "[",
            _ => "{",
        };
        self.error(
            Diagnostic::error("B0104", span, format!("expected `{}`, found {found}", close.text()))
                .label(format!("expected `{}` here", close.text()))
                .with_label(open_span, format!("to close this `{open}`"))
                .spec("3-grammar-ebnf"),
        );
        false
    }

    fn skip_newlines_if(&mut self, yes: bool) {
        if yes {
            self.skip_newlines();
        }
    }

    /// A statement, field or item ends: a line break, `;`, or the `}` that closes its block.
    fn end_line(&mut self) {
        match self.tok() {
            Tok::Newline | Tok::P(P::Semi) => {
                self.skip_newlines();
                self.panicking = false;
            }
            Tok::P(P::RBrace) | Tok::Eof => {}
            _ => {
                let found = describe(self.tok());
                let span = self.span();
                self.error(
                    Diagnostic::error("B0101", span, format!("expected a line break, found {found}"))
                        .label("a new statement starts here")
                        .help("put each statement on its own line, or separate them with `;`")
                        .spec("2-lexical-structure"),
                );
                self.recover_line();
            }
        }
    }

    /// Skips to the end of the line (or the `}` closing the current block),
    /// over balanced brackets.
    /// Whether the current token is the first of its line.
    fn at_line_start(&self) -> bool {
        let start = self.span().start as usize;
        let before = self.prev_end() as usize;
        before == 0 || self.source.get(before.min(start)..start).is_some_and(|between| between.contains('\n'))
    }

    fn recover_line(&mut self) {
        let mut depth = 0usize;
        loop {
            match self.tok() {
                Tok::Eof => break,
                Tok::Newline | Tok::P(P::Semi) if depth == 0 => break,
                // A line that ended in `=` lost its break: a member or statement keyword
                // at the start of a line is where the next one starts.
                Tok::Kw(
                    Kw::Body
                    | Kw::Let
                    | Kw::Var
                    | Kw::Fn
                    | Kw::Async
                    | Kw::Return
                    | Kw::For
                    | Kw::While
                    | Kw::Defer,
                )
                | Tok::P(P::At)
                    if depth == 0 && self.at_line_start() =>
                {
                    break;
                }
                Tok::P(P::LParen | P::LBracket | P::LBrace) => depth += 1,
                Tok::P(P::RParen | P::RBracket) => depth = depth.saturating_sub(1),
                Tok::P(P::RBrace) => {
                    if depth == 0 {
                        break;
                    }
                    depth -= 1;
                }
                _ => {}
            }
            self.bump();
        }
        self.skip_newlines();
        self.panicking = false;
    }

    /// Skips to the `}` closing the braces the parser is in (not past it).
    fn recover_to_close(&mut self) {
        let mut depth = 0usize;
        loop {
            match self.tok() {
                Tok::Eof => break,
                Tok::P(P::LParen | P::LBracket | P::LBrace) => depth += 1,
                Tok::P(P::RParen | P::RBracket) => depth = depth.saturating_sub(1),
                Tok::P(P::RBrace) if depth == 0 => break,
                Tok::P(P::RBrace) => depth -= 1,
                _ => {}
            }
            self.bump();
        }
    }

    /// Skips to the next item keyword at the start of a line.
    fn recover_item(&mut self) {
        let mut depth = 0usize;
        loop {
            match self.tok() {
                Tok::Eof => break,
                Tok::P(P::LParen | P::LBracket | P::LBrace) => depth += 1,
                Tok::P(P::RParen | P::RBracket | P::RBrace) => depth = depth.saturating_sub(1),
                Tok::Newline if depth == 0 => {
                    self.bump();
                    if matches!(
                        self.tok(),
                        Tok::Kw(
                            Kw::Pub
                                | Kw::Struct
                                | Kw::Enum
                                | Kw::Fn
                                | Kw::Async
                                | Kw::View
                                | Kw::Screen
                                | Kw::Layout
                                | Kw::Type
                                | Kw::Let
                                | Kw::Import
                        )
                    ) {
                        break;
                    }
                    continue;
                }
                _ => {}
            }
            self.bump();
        }
        self.panicking = false;
    }

    fn ident(&mut self, what: &str) -> Ident {
        if let Tok::Ident(name) = self.tok() {
            let ident = Ident { name: name.clone(), span: self.span() };
            self.bump();
            return ident;
        }
        if let Tok::Kw(kw) = self.tok() {
            let word = kw.word();
            let span = self.span();
            self.error(
                Diagnostic::error("B0101", span, format!("`{word}` is a keyword, not a name"))
                    .label(format!("expected {what}"))
                    .help(format!("rename it (`{word}Value`)"))
                    .spec("2-lexical-structure"),
            );
            self.bump();
            return Ident { name: word.to_string(), span };
        }
        self.unexpected(what);
        Ident { name: String::new(), span: Span::new(self.prev_end(), self.prev_end()) }
    }

    /// A name where keywords are names too: argument labels, members after `.`.
    /// A name that may be a keyword which never starts an expression (`type`, `body`,
    /// `view`, `screen`, `layout`, `from`): a TS API's prop or field keeps its name.
    fn soft_name(&mut self, what: &str) -> Ident {
        if let Tok::Kw(kw) = self.tok()
            && is_soft(*kw)
        {
            return self.name_or_keyword(what);
        }
        self.ident(what)
    }

    fn name_or_keyword(&mut self, what: &str) -> Ident {
        if let Tok::Kw(kw) = self.tok() {
            let ident = Ident { name: kw.word().to_string(), span: self.span() };
            self.bump();
            return ident;
        }
        self.ident(what)
    }

    // ---- file and items -----------------------------------------------

    fn file(&mut self) -> File {
        let mut imports = Vec::new();
        let mut items = Vec::new();
        self.skip_newlines();
        while !matches!(self.tok(), Tok::Eof) {
            let before = self.pos;
            if self.at_kw(Kw::Import) {
                if let Some(import) = self.import() {
                    imports.push(import);
                }
            } else if let Some(item) = self.item() {
                items.push(item);
            }
            if self.panicking {
                self.recover_item();
            } else {
                self.end_line();
                if self.panicking {
                    self.recover_item();
                }
            }
            if self.pos == before {
                self.bump();
            }
            self.skip_newlines();
        }
        File { imports, items, span: Span::new(0, self.source.len() as u32) }
    }

    fn import(&mut self) -> Option<Import> {
        let start = self.bump();
        let kind = if self.eat(P::Star) {
            if !self.eat_kw(Kw::As) {
                self.unexpected("`as` (`import * as name from \"…\"`)");
                return None;
            }
            ImportKind::Namespace(self.ident("a module name"))
        } else {
            let open = self.expect(P::LBrace, "`{` and the names to import")?;
            let mut specs = Vec::new();
            loop {
                self.skip_newlines();
                if self.at(P::RBrace) {
                    break;
                }
                let spec_start = self.span();
                let type_only = matches!(self.tok(), Tok::Kw(Kw::Type))
                    && !matches!(self.nth(1), Tok::P(P::Comma | P::RBrace) | Tok::Kw(Kw::As));
                if type_only {
                    self.bump();
                }
                let name = self.name_or_keyword("a name to import");
                let alias = if self.eat_kw(Kw::As) { Some(self.ident("the local name")) } else { None };
                specs.push(ImportSpec {
                    type_only,
                    name,
                    alias,
                    span: spec_start.to(Span::new(self.prev_end(), self.prev_end())),
                });
                self.skip_newlines();
                if !self.eat(P::Comma) {
                    break;
                }
            }
            if !self.expect_close(P::RBrace, open) {
                return None;
            }
            ImportKind::Named(specs)
        };
        if !self.eat_kw(Kw::From) {
            self.unexpected("`from` and the module path");
            return None;
        }
        let (source, source_span) = match self.tok().clone() {
            Tok::Str { parts, .. } => {
                let span = self.bump();
                let text = parts
                    .iter()
                    .map(|part| match part {
                        RawPart::Text(text) => text.as_str(),
                        RawPart::Interp(_) => "",
                    })
                    .collect::<String>();
                (text, span)
            }
            _ => {
                self.unexpected("the module path, as a string");
                return None;
            }
        };
        Some(Import { kind, source, source_span, span: start.to(source_span) })
    }

    fn item(&mut self) -> Option<Item> {
        let start = self.span();
        let mut visibility = Visibility::Private;
        if self.eat_kw(Kw::Pub) {
            visibility = Visibility::Pub;
            if self.at_kw(Kw::Default) {
                self.bump();
                visibility = Visibility::PubDefault;
            }
        }
        let kind = match self.tok() {
            Tok::Kw(Kw::Struct) => ItemKind::Struct(self.struct_decl()),
            Tok::Kw(Kw::Enum) => ItemKind::Enum(self.enum_decl()),
            Tok::Kw(Kw::Type) => ItemKind::Alias(self.alias_decl()),
            Tok::Kw(Kw::Fn | Kw::Async) => ItemKind::Fn(self.fn_decl()),
            Tok::Kw(Kw::View | Kw::Screen | Kw::Layout) => ItemKind::View(self.view_decl()),
            Tok::Kw(Kw::Let) => ItemKind::Const(self.const_decl()),
            Tok::Kw(Kw::Var) => {
                let span = self.span();
                self.error(
                    Diagnostic::error("B0106", span, "a module has no `var`")
                        .label("module-level values are constants")
                        .help("write `let`; shared state lives in bloom-data stores")
                        .fix(span, "let")
                        .spec("10-modules-and-interop"),
                );
                return None;
            }
            _ => {
                let found = describe(self.tok());
                let span = self.span();
                let mut diagnostic =
                    Diagnostic::error("B0106", span, format!("expected an item, found {found}"))
                        .label(
                            "a module holds imports, structs, enums, types, fns, views and `let` constants",
                        )
                        .spec("3-grammar-ebnf");
                if let Tok::Ident(name) = self.tok()
                    && let Some(kw) = keyword_typo(name)
                {
                    diagnostic = diagnostic.help(format!("write `{kw}`")).fix(span, kw);
                }
                self.error(diagnostic);
                return None;
            }
        };
        Some(Item { visibility, kind, span: start.to(Span::new(self.prev_end(), self.prev_end())) })
    }

    fn generics(&mut self) -> Vec<Ident> {
        let mut generics = Vec::new();
        if self.eat(P::Lt) {
            loop {
                generics.push(self.ident("a type parameter"));
                if !self.eat(P::Comma) {
                    break;
                }
            }
            self.expect(P::Gt, "`>` to close the type parameters");
        }
        generics
    }

    fn struct_decl(&mut self) -> StructDecl {
        self.bump();
        let name = self.ident("the struct's name");
        let generics = self.generics();
        let mut fields = Vec::new();
        if let Some(open) = self.expect(P::LBrace, "`{` and the struct's fields") {
            self.skip_newlines();
            while !self.at(P::RBrace) && !matches!(self.tok(), Tok::Eof) {
                let start = self.span();
                let field_name = self.soft_name("a field name");
                self.expect(P::Colon, "`:` and the field's type");
                let ty = self.type_expr();
                let default = if self.eat(P::Eq) { Some(self.expr(Ctx::Normal)) } else { None };
                fields.push(Field {
                    name: field_name,
                    ty,
                    default,
                    span: start.to(Span::new(self.prev_end(), self.prev_end())),
                });
                self.eat(P::Comma);
                self.member_end();
            }
            self.expect_close(P::RBrace, open);
        }
        StructDecl { name, generics, fields }
    }

    /// The end of a field, variant or member: a line break, or recovery to one.
    fn member_end(&mut self) {
        if self.panicking {
            self.recover_line();
        } else {
            self.end_line();
        }
    }

    fn enum_decl(&mut self) -> EnumDecl {
        self.bump();
        let name = self.ident("the enum's name");
        let generics = self.generics();
        let mut variants = Vec::new();
        if let Some(open) = self.expect(P::LBrace, "`{` and the enum's cases") {
            self.skip_newlines();
            while !self.at(P::RBrace) && !matches!(self.tok(), Tok::Eof) {
                let start = self.span();
                if self.at_kw(Kw::Case) {
                    let span = self.span();
                    self.error(
                        Diagnostic::error("B0101", span, "an enum's cases are written without `case`")
                            .label("remove this")
                            .help("write each case on its own line: `loading`, `failed(message: String)`")
                            .fix(span, "")
                            .spec("45-enums-option-and-result"),
                    );
                    self.bump();
                }
                let variant_name = self.ident("a case name");
                let mut payload = Vec::new();
                if let Some(open) = self.at(P::LParen).then(|| self.bump()) {
                    loop {
                        if self.at(P::RParen) {
                            break;
                        }
                        let payload_start = self.span();
                        let label = if matches!(self.tok(), Tok::Ident(_))
                            && matches!(self.nth(1), Tok::P(P::Colon))
                        {
                            let label = self.ident("a payload name");
                            self.bump();
                            Some(label)
                        } else {
                            None
                        };
                        let ty = self.type_expr();
                        payload.push(Payload {
                            name: label,
                            ty,
                            span: payload_start.to(Span::new(self.prev_end(), self.prev_end())),
                        });
                        if !self.eat(P::Comma) {
                            break;
                        }
                    }
                    self.expect_close(P::RParen, open);
                }
                variants.push(Variant {
                    name: variant_name,
                    payload,
                    span: start.to(Span::new(self.prev_end(), self.prev_end())),
                });
                if !self.eat(P::Comma) {
                    self.member_end();
                }
                self.skip_newlines();
            }
            self.expect_close(P::RBrace, open);
        }
        EnumDecl { name, generics, variants }
    }

    fn alias_decl(&mut self) -> AliasDecl {
        self.bump();
        let name = self.ident("the type's name");
        let generics = self.generics();
        self.expect(P::Eq, "`=` and the type");
        let ty = self.type_expr();
        AliasDecl { name, generics, ty }
    }

    fn const_decl(&mut self) -> ConstDecl {
        let start = self.bump();
        let name = self.ident("the constant's name");
        let ty = if self.eat(P::Colon) { Some(self.type_expr()) } else { None };
        self.expect(P::Eq, "`=` and the value");
        let value = self.expr(Ctx::Normal);
        ConstDecl { name, ty, span: start.to(value.span), value }
    }

    fn fn_decl(&mut self) -> FnDecl {
        let start = self.span();
        let is_async = self.eat_kw(Kw::Async);
        if !self.eat_kw(Kw::Fn) {
            self.unexpected("`fn` after `async`");
        }
        let name = self.ident("the function's name");
        let generics = self.generics();
        let params = if self.at(P::LParen) {
            self.params()
        } else {
            self.unexpected("`(` and the parameters");
            Vec::new()
        };
        let ret = if self.eat(P::Arrow) { Some(self.type_expr()) } else { None };
        let body = self.block();
        FnDecl { is_async, name, generics, params, ret, span: start.to(body.span), body }
    }

    fn params(&mut self) -> Vec<Param> {
        let open = self.bump();
        let mut params = Vec::new();
        loop {
            self.skip_newlines();
            if self.at(P::RParen) {
                break;
            }
            let start = self.span();
            let rest = self.eat(P::DotDot);
            if rest
                && matches!(self.tok(), Tok::Ident(n) if n.starts_with(|c: char| c.is_ascii_uppercase()))
                && !matches!(self.nth(1), Tok::P(P::Colon))
            {
                // `..Props`: a type's fields as props.
                let ty = self.type_expr();
                let name = match &ty.kind {
                    TypeKind::Named { name, .. } => name.clone(),
                    _ => Ident { name: String::new(), span: ty.span },
                };
                params.push(Param {
                    name,
                    rest: false,
                    spread: true,
                    whole: None,
                    ty,
                    default: None,
                    span: start.to(Span::new(self.prev_end(), self.prev_end())),
                });
                if !self.eat(P::Comma) {
                    break;
                }
                continue;
            }
            let name = self.soft_name("a parameter name");
            if !self.at(P::Colon) {
                let span = name.span;
                self.error(
                    Diagnostic::error(
                        "B0101",
                        Span::new(span.end, span.end),
                        format!("parameter `{}` needs a type", name.name),
                    )
                    .label("expected `:` and a type")
                    .help(format!("write `{}: String` (signatures are required at module level)", name.name))
                    .spec("42-inference"),
                );
            } else {
                self.bump();
            }
            let ty = self.type_expr();
            let default = if self.eat(P::Eq) { Some(self.expr(Ctx::Normal)) } else { None };
            // `..props: Props`, a named type and not a list: the props spread, their whole named.
            if rest && let TypeKind::Named { name: type_name, .. } = &ty.kind {
                params.push(Param {
                    name: type_name.clone(),
                    rest: false,
                    spread: true,
                    whole: Some(name),
                    ty,
                    default,
                    span: start.to(Span::new(self.prev_end(), self.prev_end())),
                });
                if !self.eat(P::Comma) {
                    break;
                }
                continue;
            }
            params.push(Param {
                name,
                rest,
                spread: false,
                whole: None,
                ty,
                default,
                span: start.to(Span::new(self.prev_end(), self.prev_end())),
            });
            if !self.eat(P::Comma) {
                break;
            }
        }
        self.expect_close(P::RParen, open);
        params
    }

    fn view_decl(&mut self) -> ViewDecl {
        let start = self.span();
        let kind = match self.tok() {
            Tok::Kw(Kw::Screen) => ViewKind::Screen,
            Tok::Kw(Kw::Layout) => ViewKind::Layout,
            _ => ViewKind::View,
        };
        self.bump();
        let name = self.ident("the view's name");
        let params = if self.at(P::LParen) { Some(self.params()) } else { None };
        let mut members = Vec::new();
        let mut body: Option<(Span, Block)> = None;
        if let Some(open) = self.expect(P::LBrace, "`{`, the members and `body { … }`") {
            self.skip_newlines();
            while !self.at(P::RBrace) && !matches!(self.tok(), Tok::Eof) {
                let at = self.span();
                match self.tok() {
                    Tok::Kw(Kw::Body) => {
                        let keyword = self.bump();
                        let block = self.block();
                        if body.is_some() {
                            self.error(
                                Diagnostic::error("B0106", keyword, "a view has one `body`")
                                    .label("a second body")
                                    .spec("71-a-view"),
                            );
                        }
                        body = Some((keyword, block));
                    }
                    _ => {
                        if let Some((keyword, _)) = &body {
                            let keyword = *keyword;
                            if !self.panicking {
                                self.diagnostics.push(
                                    Diagnostic::error("B0106", at, "members come before `body`")
                                        .label("this member is after the body")
                                        .with_label(keyword, "the body")
                                        .help("move it above `body { … }`")
                                        .spec("71-a-view"),
                                );
                            }
                        }
                        if let Some(member) = self.member() {
                            members.push(member);
                        }
                    }
                }
                self.member_end();
            }
            self.expect_close(P::RBrace, open);
        }
        let end = Span::new(self.prev_end(), self.prev_end());
        let (body_keyword, body) = body.unwrap_or_else(|| {
            let span = name.span;
            self.error(
                Diagnostic::error("B0106", span, format!("view `{}` has no body", name.name))
                    .label("this view draws nothing")
                    .help("add `body { … }` with the view it draws, after its members")
                    .spec("71-a-view"),
            );
            (span, Block { stmts: Vec::new(), span: end })
        });
        ViewDecl { kind, name, params, members, body_keyword, body, span: start.to(end) }
    }

    fn member(&mut self) -> Option<Member> {
        match self.tok() {
            Tok::P(P::At) => {
                let start = self.bump();
                let word = self.ident("`state`, `list`, `record` or `env`");
                let attr = match word.name.as_str() {
                    "state" => StateAttr::State,
                    "list" => StateAttr::List,
                    "record" => StateAttr::Record,
                    "env" => StateAttr::Env,
                    "ref" => StateAttr::Ref,
                    other => {
                        let help =
                            crate::diagnostic::closest(other, ["state", "list", "record", "env", "ref"])
                                .map_or(
                                    "the attributes are @state, @list, @record, @env and @ref".to_string(),
                                    |near| format!("did you mean `@{near}`?"),
                                );
                        self.error(
                            Diagnostic::error(
                                "B0101",
                                start.to(word.span),
                                format!("unknown attribute `@{other}`"),
                            )
                            .label("not a member attribute")
                            .help(help)
                            .spec("73-reactivity-compile-time"),
                        );
                        return None;
                    }
                };
                let name = self.soft_name("the state's name");
                let ty = if self.eat(P::Colon) { Some(self.type_expr()) } else { None };
                self.expect(P::Eq, "`=` and the initial value");
                let value = self.expr(Ctx::Normal);
                Some(Member::State(StateDecl {
                    attr,
                    attr_span: start.to(word.span),
                    name,
                    ty,
                    span: start.to(value.span),
                    value,
                }))
            }
            Tok::Kw(Kw::Let) => Some(Member::Let(self.let_stmt())),
            Tok::Kw(Kw::Fn | Kw::Async) => Some(Member::Fn(self.fn_decl())),
            Tok::Ident(word) if word == "equal" && matches!(self.nth(1), Tok::P(P::LParen)) => {
                let keyword = self.bump();
                let open = self.bump();
                let old = self.ident("the old props' name");
                self.expect(P::Comma, "`,` and the new props' name");
                let new = self.ident("the new props' name");
                self.expect_close(P::RParen, open);
                let body = self.block();
                Some(Member::Equal(EqualDecl { keyword, old, new, span: keyword.to(body.span), body }))
            }
            Tok::Ident(word) if word == "effect" && matches!(self.nth(1), Tok::P(P::LBrace | P::LParen)) => {
                let keyword = self.bump();
                let id = if self.at(P::LParen) {
                    let open = self.bump();
                    let label = self.name_or_keyword("`id`");
                    if label.name != "id" {
                        self.error(
                            Diagnostic::error("B0101", label.span, "an effect takes `id:` only")
                                .label("not `id:`")
                                .help("write `effect(id: value) { … }`, or `effect { … }` to re-run on its reads")
                                .spec("8-effects-tasks-and-concurrency"),
                        );
                    }
                    self.expect(P::Colon, "`:` and the value it re-runs for");
                    let value = self.expr(Ctx::Normal);
                    self.expect_close(P::RParen, open);
                    Some(value)
                } else {
                    None
                };
                let body = self.block();
                Some(Member::Effect(EffectDecl { keyword, id, span: keyword.to(body.span), body }))
            }
            Tok::Kw(Kw::Var) => {
                let span = self.span();
                self.error(
                    Diagnostic::error("B0106", span, "a view has no `var` members")
                        .label("a view's own value that changes is a state")
                        .help("write `@state` instead of `var`")
                        .fix(span, "@state")
                        .spec("73-reactivity-compile-time"),
                );
                None
            }
            _ => {
                let found = describe(self.tok());
                let span = self.span();
                self.error(
                    Diagnostic::error("B0106", span, format!("expected a member or `body`, found {found}"))
                        .label("a view holds `@state`, `let` and `fn` members, then `body { … }`")
                        .spec("71-a-view"),
                );
                None
            }
        }
    }

    // ---- types --------------------------------------------------------

    fn type_expr(&mut self) -> TypeExpr {
        let mut ty = self.base_type();
        loop {
            if self.at(P::Question) && !self.token().space_before {
                let end = self.bump();
                ty = TypeExpr { span: ty.span.to(end), kind: TypeKind::Optional(Box::new(ty)) };
            } else if self.at(P::QuestionQuestion) && !self.token().space_before {
                let end = self.bump();
                let inner = TypeExpr {
                    span: ty.span.to(Span::new(end.start, end.start + 1)),
                    kind: TypeKind::Optional(Box::new(ty)),
                };
                ty = TypeExpr { span: inner.span.to(end), kind: TypeKind::Optional(Box::new(inner)) };
            } else {
                break;
            }
        }
        ty
    }

    fn base_type(&mut self) -> TypeExpr {
        let start = self.span();
        match self.tok().clone() {
            Tok::Ident(_) => {
                let name = self.ident("a type");
                let mut args = Vec::new();
                if self.at(P::Lt) && !self.token().space_before {
                    self.bump();
                    loop {
                        args.push(self.type_expr());
                        if !self.eat(P::Comma) {
                            break;
                        }
                    }
                    self.expect(P::Gt, "`>` to close the type arguments");
                }
                TypeExpr {
                    span: start.to(Span::new(self.prev_end(), self.prev_end())),
                    kind: TypeKind::Named { name, args },
                }
            }
            Tok::P(P::LBracket) => {
                let open = self.bump();
                let first = self.type_expr();
                let kind = if self.eat(P::Colon) {
                    let value = self.type_expr();
                    TypeKind::Map(Box::new(first), Box::new(value))
                } else {
                    TypeKind::List(Box::new(first))
                };
                self.expect_close(P::RBracket, open);
                TypeExpr { span: start.to(Span::new(self.prev_end(), self.prev_end())), kind }
            }
            Tok::Kw(Kw::Async) | Tok::P(P::LParen) => {
                let is_async = self.eat_kw(Kw::Async);
                let open = self.span();
                if self.expect(P::LParen, "`(` and the parameter types").is_none() {
                    return TypeExpr { kind: TypeKind::Error, span: start };
                }
                let mut items = Vec::new();
                while !self.at(P::RParen) && !matches!(self.tok(), Tok::Eof) {
                    items.push(self.type_expr());
                    if !self.eat(P::Comma) {
                        break;
                    }
                }
                self.expect_close(P::RParen, open);
                if self.eat(P::Arrow) {
                    let ret = self.type_expr();
                    return TypeExpr {
                        span: start.to(ret.span),
                        kind: TypeKind::Fn { is_async, params: items, ret: Box::new(ret) },
                    };
                }
                if is_async {
                    self.unexpected("`->` and the result type of the async function");
                }
                let span = start.to(Span::new(self.prev_end(), self.prev_end()));
                if items.len() == 1 {
                    let mut only = items.pop().expect("one");
                    only.span = span;
                    return only;
                }
                TypeExpr { span, kind: TypeKind::Tuple(items) }
            }
            Tok::Str { .. } => {
                let mut values = Vec::new();
                loop {
                    match self.tok().clone() {
                        Tok::Str { parts, .. } if parts.iter().all(|p| matches!(p, RawPart::Text(_))) => {
                            values.push(
                                parts
                                    .iter()
                                    .map(|p| if let RawPart::Text(t) = p { t.as_str() } else { "" })
                                    .collect(),
                            );
                            self.bump();
                        }
                        _ => {
                            self.unexpected("a string literal (`\"a\" | \"b\"`)");
                            break;
                        }
                    }
                    if !self.eat(P::Pipe) {
                        break;
                    }
                }
                TypeExpr {
                    span: start.to(Span::new(self.prev_end(), self.prev_end())),
                    kind: TypeKind::Strings(values),
                }
            }
            Tok::P(P::LBrace) => {
                let open = self.bump();
                let mut fields = Vec::new();
                loop {
                    self.skip_newlines();
                    if self.at(P::RBrace) || matches!(self.tok(), Tok::Eof) {
                        break;
                    }
                    let span = self.span();
                    let name = match self.tok() {
                        Tok::Ident(name) => name.clone(),
                        Tok::Kw(kw) => kw.word().to_string(),
                        Tok::Str { parts, .. } if parts.iter().all(|p| matches!(p, RawPart::Text(_))) => {
                            parts
                                .iter()
                                .map(|p| if let RawPart::Text(t) = p { t.as_str() } else { "" })
                                .collect()
                        }
                        _ => {
                            self.unexpected("a field (`name: Type`)");
                            self.recover_to_close();
                            break;
                        }
                    };
                    self.bump();
                    self.expect(P::Colon, "`:` and the field's type");
                    fields.push((Ident { name, span }, self.type_expr()));
                    self.skip_newlines();
                    if !self.eat(P::Comma) {
                        self.skip_newlines();
                        if !self.at(P::RBrace) {
                            self.unexpected("`,` or `}`");
                            self.recover_to_close();
                        }
                        break;
                    }
                }
                self.expect_close(P::RBrace, open);
                TypeExpr {
                    span: start.to(Span::new(self.prev_end(), self.prev_end())),
                    kind: TypeKind::Record(fields),
                }
            }
            _ => {
                self.unexpected("a type");
                TypeExpr { kind: TypeKind::Error, span: start }
            }
        }
    }

    // ---- statements ---------------------------------------------------

    fn block(&mut self) -> Block {
        let start = self.span();
        let Some(open) = self.expect(P::LBrace, "`{`") else {
            return Block { stmts: Vec::new(), span: start };
        };
        let stmts = self.stmts_until_close();
        self.expect_close(P::RBrace, open);
        Block { stmts, span: open.to(Span::new(self.prev_end(), self.prev_end())) }
    }

    fn stmts_until_close(&mut self) -> Vec<Stmt> {
        let mut stmts = Vec::new();
        self.skip_newlines();
        while !self.at(P::RBrace) && !matches!(self.tok(), Tok::Eof) {
            let before = self.pos;
            if let Some(stmt) = self.stmt() {
                stmts.push(stmt);
            }
            self.member_end();
            if self.pos == before {
                self.bump();
            }
            self.skip_newlines();
        }
        stmts
    }

    fn let_stmt(&mut self) -> LetStmt {
        let start = self.bump();
        let pattern = self.pattern();
        let ty = if self.eat(P::Colon) { Some(self.type_expr()) } else { None };
        self.expect(P::Eq, "`=` and the value");
        let value = self.expr(Ctx::Normal);
        LetStmt { pattern, ty, span: start.to(value.span), value }
    }

    fn stmt(&mut self) -> Option<Stmt> {
        let start = self.span();
        let kind = match self.tok() {
            Tok::Kw(Kw::Let) => StmtKind::Let(self.let_stmt()),
            Tok::Kw(Kw::Var) => {
                self.bump();
                let name = self.ident("the variable's name");
                let ty = if self.eat(P::Colon) { Some(self.type_expr()) } else { None };
                self.expect(P::Eq, "`=` and the value");
                let value = self.expr(Ctx::Normal);
                StmtKind::Var(VarStmt { name, ty, span: start.to(value.span), value })
            }
            Tok::Kw(Kw::Return) => {
                self.bump();
                let value = if matches!(self.tok(), Tok::Newline | Tok::P(P::Semi | P::RBrace) | Tok::Eof) {
                    None
                } else {
                    Some(self.expr(Ctx::Normal))
                };
                StmtKind::Return(value)
            }
            Tok::Kw(Kw::Defer) => {
                self.bump();
                StmtKind::Defer(self.block())
            }
            Tok::Kw(Kw::While) => {
                self.bump();
                let cond = self.expr(Ctx::Head);
                let body = self.block();
                StmtKind::While(WhileStmt { cond, body })
            }
            Tok::Kw(Kw::For) => {
                self.bump();
                let pattern = self.pattern();
                if !self.eat_kw(Kw::In) {
                    self.unexpected("`in` (`for item in items { … }`)");
                }
                let iter = self.expr(Ctx::Head);
                let body = self.block();
                StmtKind::For(ForStmt { pattern, iter, body })
            }
            _ => {
                let expr = self.expr(Ctx::Normal);
                let op = match self.tok() {
                    Tok::P(P::Eq) => Some(AssignOp::Set),
                    Tok::P(P::PlusEq) => Some(AssignOp::Add),
                    Tok::P(P::MinusEq) => Some(AssignOp::Sub),
                    Tok::P(P::StarEq) => Some(AssignOp::Mul),
                    _ => None,
                };
                match op {
                    Some(op) => {
                        self.bump();
                        if !is_place(&expr) {
                            self.error(
                                Diagnostic::error(
                                    "B0101",
                                    expr.span,
                                    "only a name or its fields can be assigned",
                                )
                                .label("not a place")
                                .help("assign a state, a `var` or a field of one: `draft.text = value`")
                                .spec("73-reactivity-compile-time"),
                            );
                        }
                        let value = self.expr(Ctx::Normal);
                        StmtKind::Assign(AssignStmt {
                            span: expr.span.to(value.span),
                            target: expr,
                            op,
                            value,
                        })
                    }
                    None => StmtKind::Expr(expr),
                }
            }
        };
        Some(Stmt { kind, span: start.to(Span::new(self.prev_end(), self.prev_end())) })
    }

    // ---- patterns -----------------------------------------------------

    fn pattern(&mut self) -> Pattern {
        let first = self.single_pattern();
        if !self.at(P::Pipe) {
            return first;
        }
        let mut alternatives = vec![first];
        while self.eat(P::Pipe) {
            alternatives.push(self.single_pattern());
        }
        let span = alternatives[0].span.to(alternatives.last().expect("two").span);
        Pattern { kind: PatternKind::Or(alternatives), span }
    }

    fn pattern_args(&mut self) -> Option<Vec<Pattern>> {
        let open = self.at(P::LParen).then(|| self.bump())?;
        let mut args = Vec::new();
        while !self.at(P::RParen) && !matches!(self.tok(), Tok::Eof) {
            args.push(self.pattern());
            if !self.eat(P::Comma) {
                break;
            }
        }
        self.expect_close(P::RParen, open);
        Some(args)
    }

    fn single_pattern(&mut self) -> Pattern {
        let start = self.span();
        let kind = match self.tok().clone() {
            Tok::Ident(name) if name == "_" => {
                self.bump();
                PatternKind::Wildcard
            }
            Tok::Ident(name) if is_upper(&name) && matches!(self.nth(1), Tok::P(P::Dot)) => {
                let ty = self.ident("a type");
                self.bump();
                let name = self.name_or_keyword("a case name");
                let args = self.pattern_args();
                PatternKind::Case { ty: Some(ty), name, args }
            }
            Tok::Ident(_) if matches!(self.nth(1), Tok::P(P::LParen)) => {
                let name = self.ident("a case name");
                let args = self.pattern_args();
                PatternKind::Case { ty: None, name, args }
            }
            Tok::Ident(_) => PatternKind::Bind(self.ident("a name")),
            // `let body = …`: a soft keyword binds as a name.
            Tok::Kw(kw) if is_soft(kw) => PatternKind::Bind(self.soft_name("a name")),
            Tok::P(P::Dot) => {
                self.bump();
                let name = self.name_or_keyword("a case name");
                let args = self.pattern_args();
                PatternKind::Case { ty: None, name, args }
            }
            Tok::Kw(Kw::None) => {
                self.bump();
                PatternKind::None
            }
            Tok::Int(_)
            | Tok::Float(_)
            | Tok::Str { .. }
            | Tok::Kw(Kw::True | Kw::False)
            | Tok::P(P::Minus) => PatternKind::Literal(Box::new(self.unary(Ctx::Head))),
            Tok::P(P::LParen) => {
                let open = self.bump();
                let mut items = Vec::new();
                while !self.at(P::RParen) && !matches!(self.tok(), Tok::Eof) {
                    items.push(self.pattern());
                    if !self.eat(P::Comma) {
                        break;
                    }
                }
                self.expect_close(P::RParen, open);
                if items.len() == 1 {
                    let mut only = items.pop().expect("one");
                    only.span = start.to(Span::new(self.prev_end(), self.prev_end()));
                    return only;
                }
                PatternKind::Tuple(items)
            }
            Tok::P(P::LBrace) => {
                let open = self.bump();
                let mut fields = Vec::new();
                loop {
                    self.skip_newlines();
                    if self.at(P::RBrace) {
                        break;
                    }
                    let name = self.ident("a field name");
                    let sub = if self.eat(P::Colon) { Some(self.pattern()) } else { None };
                    fields.push((name, sub));
                    self.skip_newlines();
                    if !self.eat(P::Comma) {
                        break;
                    }
                }
                self.expect_close(P::RBrace, open);
                PatternKind::Record(fields)
            }
            _ => {
                self.unexpected("a pattern");
                PatternKind::Wildcard
            }
        };
        Pattern { kind, span: start.to(Span::new(self.prev_end(), self.prev_end())) }
    }

    // ---- expressions --------------------------------------------------

    fn expr(&mut self, ctx: Ctx) -> Expr {
        match self.tok() {
            Tok::Kw(Kw::If) => {
                let expr = self.if_expr();
                return self.postfix_after(expr, ctx);
            }
            Tok::Kw(Kw::Match) => {
                let expr = self.match_expr();
                return self.postfix_after(expr, ctx);
            }
            _ => {}
        }
        let cond = self.binary(0, ctx);
        if self.at(P::Question) && self.token().space_before {
            self.bump();
            let then = self.expr(ctx);
            if self.expect(P::Colon, "`:` and the value when the condition is false").is_none() {
                return then;
            }
            let otherwise = self.expr(ctx);
            let span = cond.span.to(otherwise.span);
            return self
                .expr_node(ExprKind::Ternary(Box::new(cond), Box::new(then), Box::new(otherwise)), span);
        }
        cond
    }

    /// An `if` or `match` continued by a modifier (`if … { } else { }.padding("md")` is rare but legal).
    fn postfix_after(&mut self, expr: Expr, ctx: Ctx) -> Expr {
        if self.at(P::Dot) { self.postfix_loop(expr, ctx, None) } else { expr }
    }

    fn binary_op(&self) -> Option<BinaryOp> {
        Some(match self.tok() {
            Tok::P(P::Star) => BinaryOp::Mul,
            Tok::P(P::Slash) => BinaryOp::Div,
            Tok::P(P::Percent) => BinaryOp::Rem,
            Tok::P(P::Plus) => BinaryOp::Add,
            Tok::P(P::Minus) => BinaryOp::Sub,
            Tok::P(P::Lt) => BinaryOp::Lt,
            Tok::P(P::Le) => BinaryOp::Le,
            Tok::P(P::Gt) => BinaryOp::Gt,
            Tok::P(P::Ge) => BinaryOp::Ge,
            Tok::P(P::EqEq) => BinaryOp::Eq,
            Tok::P(P::Ne) => BinaryOp::Ne,
            Tok::P(P::AndAnd) => BinaryOp::And,
            Tok::P(P::OrOr) => BinaryOp::Or,
            Tok::P(P::QuestionQuestion) => BinaryOp::Default,
            _ => return None,
        })
    }

    fn binary(&mut self, min: u8, ctx: Ctx) -> Expr {
        let mut lhs = self.unary(ctx);
        loop {
            // `x is T`, at the comparisons' level.
            if min <= BinaryOp::Eq.precedence() && matches!(self.tok(), Tok::Ident(word) if word == "is") {
                self.bump();
                let ty = self.type_expr();
                let span = lhs.span.to(ty.span);
                lhs = self.expr_node(ExprKind::Is(Box::new(lhs), ty), span);
                continue;
            }
            let Some(op) = self.binary_op() else { break };
            let prec = op.precedence();
            if prec < min {
                break;
            }
            let op_span = self.bump();
            let rhs =
                if op == BinaryOp::Default { self.binary(prec, ctx) } else { self.binary(prec + 1, ctx) };
            // Comparisons do not chain: `a < b < c` says nothing clear.
            if matches!(prec, 4 | 5)
                && let ExprKind::Binary(inner, _, _) = &lhs.kind
                && inner.precedence() == prec
            {
                self.error(
                    Diagnostic::error(
                        "B0101",
                        op_span,
                        format!("`{}` cannot follow another comparison", op.text()),
                    )
                    .label("comparisons do not chain")
                    .help("join two comparisons with `&&`: `a < b && b < c`")
                    .spec("61-precedence-high-to-low"),
                );
            }
            let span = lhs.span.to(rhs.span);
            lhs = self.expr_node(ExprKind::Binary(op, Box::new(lhs), Box::new(rhs)), span);
        }
        lhs
    }

    fn unary(&mut self, ctx: Ctx) -> Expr {
        let start = self.span();
        match self.tok() {
            Tok::P(P::Bang) => {
                self.bump();
                let operand = self.unary(ctx);
                let span = start.to(operand.span);
                self.expr_node(ExprKind::Unary(UnaryOp::Not, Box::new(operand)), span)
            }
            Tok::P(P::Minus) => {
                self.bump();
                let operand = self.unary(ctx);
                let span = start.to(operand.span);
                self.expr_node(ExprKind::Unary(UnaryOp::Neg, Box::new(operand)), span)
            }
            Tok::Kw(Kw::Await) => {
                self.bump();
                let primary = self.primary(ctx);
                let operand = self.postfix_loop(primary, ctx, Some(start));
                if contains_await_marker(&operand) {
                    // `await f()?` is `(await f())?`: the await was applied inside the chain.
                    return operand;
                }
                let span = start.to(operand.span);
                self.expr_node(ExprKind::Await(Box::new(operand)), span)
            }
            _ => {
                let primary = self.primary(ctx);
                self.postfix_loop(primary, ctx, None)
            }
        }
    }

    /// Calls, members, indexing, `?` and trailing closures after `expr`.
    /// Under `await`, the first `?` applies to the awaited value:
    /// `await f()?` is `(await f())?`.
    fn postfix_loop(&mut self, mut expr: Expr, ctx: Ctx, mut awaiting: Option<Span>) -> Expr {
        loop {
            match self.tok() {
                Tok::P(P::LParen)
                    if !self.token().space_before
                        || matches!(expr.kind, ExprKind::Name(_) | ExprKind::Field(..)) =>
                {
                    let (args, end) = self.args();
                    let trailing = if ctx == Ctx::Normal && self.at(P::LBrace) {
                        Some(Box::new(self.closure()))
                    } else {
                        None
                    };
                    let end = trailing.as_ref().map_or(end, |c| c.span);
                    let span = expr.span.to(end);
                    expr = self.expr_node(
                        ExprKind::Call(Call {
                            callee: Box::new(expr),
                            args,
                            parens: true,
                            trailing,
                            optional: false,
                        }),
                        span,
                    );
                }
                Tok::P(P::LBrace) if ctx == Ctx::Normal && is_callee(&expr) => {
                    let closure = self.closure();
                    let span = expr.span.to(closure.span);
                    expr = self.expr_node(
                        ExprKind::Call(Call {
                            callee: Box::new(expr),
                            args: Vec::new(),
                            parens: false,
                            trailing: Some(Box::new(closure)),
                            optional: false,
                        }),
                        span,
                    );
                }
                Tok::P(P::Dot) => {
                    self.bump();
                    let name = match self.tok().clone() {
                        Tok::Int(index) => {
                            let span = self.bump();
                            Ident { name: index.to_string(), span }
                        }
                        _ => self.name_or_keyword("a member name"),
                    };
                    let span = expr.span.to(name.span);
                    expr = self.expr_node(ExprKind::Field(Box::new(expr), name), span);
                }
                Tok::P(P::QuestionDot) if matches!(self.nth(1), Tok::P(P::LParen)) => {
                    // `f?.(…)`: a call only when `f` is not `none`.
                    self.bump();
                    let (args, end) = self.args();
                    let span = expr.span.to(end);
                    expr = self.expr_node(
                        ExprKind::Call(Call {
                            callee: Box::new(expr),
                            args,
                            parens: true,
                            trailing: None,
                            optional: true,
                        }),
                        span,
                    );
                }
                Tok::P(P::QuestionDot) => {
                    self.bump();
                    let name = self.name_or_keyword("a member name");
                    let span = expr.span.to(name.span);
                    expr = self.expr_node(ExprKind::OptField(Box::new(expr), name), span);
                }
                Tok::P(P::LBracket) if !self.token().space_before => {
                    let open = self.bump();
                    let index = self.expr(Ctx::Normal);
                    self.expect_close(P::RBracket, open);
                    let span = expr.span.to(Span::new(self.prev_end(), self.prev_end()));
                    expr = self.expr_node(ExprKind::Index(Box::new(expr), Box::new(index)), span);
                }
                Tok::P(P::Question) if !self.token().space_before => {
                    let end = self.bump();
                    if let Some(keyword) = awaiting.take() {
                        let span = keyword.to(expr.span);
                        expr = self.expr_node(ExprKind::Await(Box::new(expr)), span);
                    }
                    let span = expr.span.to(end);
                    expr = self.expr_node(ExprKind::Try(Box::new(expr)), span);
                }
                _ => break,
            }
        }
        expr
    }

    fn args(&mut self) -> (Vec<Arg>, Span) {
        let open = self.bump();
        let mut args = Vec::new();
        while !self.at(P::RParen) && !matches!(self.tok(), Tok::Eof) {
            let start = self.span();
            if self.eat(P::DotDot) {
                let value = self.expr(Ctx::Normal);
                args.push(Arg { label: None, spread: true, span: start.to(value.span), value });
            } else {
                let labelled = matches!(self.tok(), Tok::Ident(_) | Tok::Kw(_))
                    && matches!(self.nth(1), Tok::P(P::Colon));
                let label = if labelled {
                    let label = self.name_or_keyword("a label");
                    self.bump();
                    Some(label)
                } else {
                    None
                };
                let value = self.expr(Ctx::Normal);
                args.push(Arg { label, spread: false, span: start.to(value.span), value });
            }
            if !self.eat(P::Comma) {
                break;
            }
        }
        self.expect_close(P::RParen, open);
        (args, open.to(Span::new(self.prev_end(), self.prev_end())))
    }

    /// `{ [params in] stmts }`
    /// Whether the `{` here opens a record: a key (a name, a keyword or a string) and
    /// `:`, or `..`, first, and no closure's `in` on its first line (`{ x: Int in … }`).
    fn record_ahead(&self) -> bool {
        let mut at = 1;
        while matches!(self.nth(at), Tok::Newline) {
            at += 1;
        }
        let keyed = match self.nth(at) {
            Tok::P(P::DotDot) => return true,
            Tok::Ident(_) | Tok::Kw(_) | Tok::Str { .. } => matches!(self.nth(at + 1), Tok::P(P::Colon)),
            _ => false,
        };
        if !keyed {
            return false;
        }
        let mut depth = 0usize;
        loop {
            at += 1;
            match self.nth(at) {
                Tok::P(P::LParen | P::LBracket | P::LBrace) => depth += 1,
                Tok::P(P::RParen | P::RBracket) => depth = depth.saturating_sub(1),
                Tok::P(P::RBrace) if depth == 0 => return true,
                Tok::P(P::RBrace) => depth -= 1,
                Tok::Kw(Kw::In) if depth == 0 => return false,
                Tok::Newline if depth == 0 => return true,
                Tok::Eof => return true,
                _ => {}
            }
        }
    }

    /// `{ key: value, "quoted-key": v, ..spread }`
    fn record(&mut self) -> Expr {
        let open = self.bump();
        let mut entries = Vec::new();
        loop {
            self.skip_newlines();
            if self.at(P::RBrace) || matches!(self.tok(), Tok::Eof) {
                break;
            }
            if self.eat(P::DotDot) {
                entries.push(RecordEntry::Spread(self.expr(Ctx::Normal)));
            } else {
                let span = self.span();
                let name = match self.tok() {
                    Tok::Ident(name) => Some(name.clone()),
                    Tok::Kw(kw) => Some(kw.word().to_string()),
                    Tok::Str { parts, .. } if parts.iter().all(|p| matches!(p, RawPart::Text(_))) => Some(
                        parts
                            .iter()
                            .map(|p| if let RawPart::Text(t) = p { t.as_str() } else { "" })
                            .collect(),
                    ),
                    _ => None,
                };
                let Some(name) = name else {
                    self.unexpected("a key (`name: value`) or `..spread`");
                    self.recover_to_close();
                    break;
                };
                self.bump();
                self.expect(P::Colon, "`:` and the value");
                let value = self.expr(Ctx::Normal);
                entries.push(RecordEntry::Field { key: Ident { name, span }, value });
            }
            self.skip_newlines();
            if !self.eat(P::Comma) {
                self.skip_newlines();
                if !self.at(P::RBrace) {
                    self.unexpected("`,` or `}`");
                    self.recover_to_close();
                }
                break;
            }
        }
        self.expect_close(P::RBrace, open);
        let span = open.to(Span::new(self.prev_end(), self.prev_end()));
        self.expr_node(ExprKind::Record(entries), span)
    }

    fn closure(&mut self) -> Closure {
        let open = self.bump();
        let mut params = Vec::new();
        let mut has_in = false;
        // `{ a, b: T in …`: read the parameters, or go back when there is no `in`.
        let save = self.pos;
        let quiet = self.diagnostics.len();
        let was_panicking = self.panicking;
        self.skip_newlines();
        let tuple = matches!(self.tok(), Tok::P(P::LParen)) && matches!(self.nth(1), Tok::Ident(_));
        if tuple {
            self.bump();
        }
        if matches!(self.tok(), Tok::Ident(_)) {
            while let Tok::Ident(_) = self.tok() {
                let name = self.ident("a parameter");
                let ty = if self.at(P::Colon) {
                    self.bump();
                    Some(self.type_expr())
                } else {
                    None
                };
                params.push(ClosureParam { name, ty });
                if !self.eat(P::Comma) {
                    break;
                }
            }
            if tuple && !self.eat(P::RParen) {
                params.clear();
            }
            if self.at_kw(Kw::In) && (!tuple || !params.is_empty()) {
                self.bump();
                has_in = true;
            }
        }
        let tuple = tuple && has_in;
        if !has_in {
            params.clear();
            self.pos = save;
            self.diagnostics.truncate(quiet);
            self.panicking = was_panicking;
        }
        let body = self.stmts_until_close();
        self.expect_close(P::RBrace, open);
        Closure { params, has_in, tuple, body, span: open.to(Span::new(self.prev_end(), self.prev_end())) }
    }

    fn if_expr(&mut self) -> Expr {
        let start = self.bump();
        let cond = if self.eat_kw(Kw::Let) {
            let pattern = self.pattern();
            self.expect(P::Eq, "`=` and the value to match");
            let value = self.expr(Ctx::Head);
            Cond::Let(pattern, Box::new(value))
        } else {
            Cond::Expr(Box::new(self.expr(Ctx::Head)))
        };
        let then = self.block();
        let otherwise = if self.next_line_is(Kw::Else) {
            self.skip_newlines();
            self.bump();
            if self.at_kw(Kw::If) {
                Some(Box::new(Else::If(self.if_expr())))
            } else {
                Some(Box::new(Else::Block(self.block())))
            }
        } else {
            None
        };
        let end = Span::new(self.prev_end(), self.prev_end());
        self.expr_node(ExprKind::If(IfExpr { cond, then, otherwise }), start.to(end))
    }

    fn match_expr(&mut self) -> Expr {
        let start = self.bump();
        let scrutinee = self.expr(Ctx::Head);
        let mut arms = Vec::new();
        if let Some(open) = self.expect(P::LBrace, "`{` and the match's `case` arms") {
            self.skip_newlines();
            while !self.at(P::RBrace) && !matches!(self.tok(), Tok::Eof) {
                let arm_start = self.span();
                if !self.eat_kw(Kw::Case) {
                    let span = self.span();
                    self.error(
                        Diagnostic::error(
                            "B0101",
                            span,
                            format!("expected `case`, found {}", describe(self.tok())),
                        )
                        .label("a match arm starts with `case`")
                        .help("write `case .ready(value) => …`")
                        .spec("3-grammar-ebnf"),
                    );
                    self.recover_line();
                    continue;
                }
                let pattern = self.pattern();
                let guard = if self.eat_kw(Kw::If) { Some(self.expr(Ctx::Head)) } else { None };
                self.expect(P::FatArrow, "`=>` and the arm's value");
                let body = if self.at(P::LBrace) {
                    ArmBody::Block(self.block())
                } else {
                    // `case .ok(_) => draft = Draft()`: an arm may be one statement.
                    match self.stmt() {
                        Some(Stmt { kind: StmtKind::Expr(expr), .. }) => ArmBody::Expr(expr),
                        Some(stmt) => ArmBody::Block(Block { span: stmt.span, stmts: vec![stmt] }),
                        None => ArmBody::Block(Block { stmts: Vec::new(), span: self.span() }),
                    }
                };
                arms.push(Arm {
                    pattern,
                    guard,
                    body,
                    span: arm_start.to(Span::new(self.prev_end(), self.prev_end())),
                });
                self.eat(P::Comma);
                self.member_end();
            }
            self.expect_close(P::RBrace, open);
        }
        let end = Span::new(self.prev_end(), self.prev_end());
        self.expr_node(ExprKind::Match(MatchExpr { scrutinee: Box::new(scrutinee), arms }), start.to(end))
    }

    fn primary(&mut self, ctx: Ctx) -> Expr {
        let start = self.span();
        match self.tok().clone() {
            // `import("./X")`: a dynamic import, a call TS types (`lazy(() => import("./X"))`).
            Tok::Kw(Kw::Import) if matches!(self.nth(1), Tok::P(P::LParen)) => {
                self.bump();
                self.expr_node(ExprKind::Name("import".into()), start)
            }
            // `type`, `body`, …: a name where a value goes (a prop or field of a TS API). Not
            // `body {` or `view X`, which start a member or a declaration, not a value.
            Tok::Kw(kw)
                if is_soft(kw)
                    && !(matches!(kw, Kw::Body) && matches!(self.nth(1), Tok::P(P::LBrace)))
                    && !(matches!(kw, Kw::View | Kw::Screen | Kw::Layout)
                        && matches!(self.nth(1), Tok::Ident(_))) =>
            {
                let ident = self.name_or_keyword("a name");
                self.expr_node(ExprKind::Name(ident.name), start)
            }
            Tok::Int(value) => {
                self.bump();
                self.expr_node(ExprKind::Int(value), start)
            }
            Tok::Float(value) => {
                self.bump();
                self.expr_node(ExprKind::Float(value), start)
            }
            Tok::Kw(Kw::True) => {
                self.bump();
                self.expr_node(ExprKind::Bool(true), start)
            }
            Tok::Kw(Kw::False) => {
                self.bump();
                self.expr_node(ExprKind::Bool(false), start)
            }
            Tok::Kw(Kw::None) => {
                self.bump();
                self.expr_node(ExprKind::None, start)
            }
            Tok::Str { parts, raw } => {
                self.bump();
                let parts = parts
                    .into_iter()
                    .map(|part| match part {
                        RawPart::Text(text) => StrPart::Text(text),
                        RawPart::Interp(span) => StrPart::Interp(self.interpolation(span)),
                    })
                    .collect();
                self.expr_node(ExprKind::Str { parts, raw }, start)
            }
            Tok::Ident(name) => {
                if is_upper(&name) && self.at_type_application() {
                    let ident = self.ident("a type");
                    self.bump();
                    let mut args = Vec::new();
                    loop {
                        args.push(self.type_expr());
                        if !self.eat(P::Comma) {
                            break;
                        }
                    }
                    self.expect(P::Gt, "`>`");
                    let span = start.to(Span::new(self.prev_end(), self.prev_end()));
                    return self.expr_node(ExprKind::TypeApply { name: ident, args }, span);
                }
                self.bump();
                self.expr_node(ExprKind::Name(name), start)
            }
            Tok::P(P::Dot) => {
                self.bump();
                let name = self.name_or_keyword("a case name after `.`");
                let span = start.to(name.span);
                self.expr_node(ExprKind::ImplicitMember(name), span)
            }
            Tok::P(P::Backslash) => {
                self.bump();
                let root = match self.tok() {
                    Tok::Ident(name) if is_upper(name) => Some(self.ident("a type")),
                    _ => None,
                };
                let mut path = Vec::new();
                loop {
                    if !self.at(P::Dot) || (!path.is_empty() || root.is_some()) && self.token().space_before {
                        break;
                    }
                    self.bump();
                    path.push(self.ident("a field (`\\.likes`)"));
                    if !matches!(self.tok(), Tok::P(P::Dot)) {
                        break;
                    }
                }
                if path.is_empty() {
                    self.unexpected("`.field` after `\\` (`\\.likes`, `\\Prefs.likes`)");
                }
                let span = start.to(Span::new(self.prev_end(), self.prev_end()));
                self.expr_node(ExprKind::KeyPath { root, path }, span)
            }
            Tok::P(P::Dollar) => {
                self.bump();
                let mut path = vec![self.ident("the state to bind (`$draft`)")];
                while self.at(P::Dot) && !self.token().space_before && matches!(self.nth(1), Tok::Ident(_)) {
                    self.bump();
                    path.push(self.ident("a field"));
                }
                let span = start.to(Span::new(self.prev_end(), self.prev_end()));
                self.expr_node(ExprKind::Binding(path), span)
            }
            Tok::P(P::LParen) => {
                let open = self.bump();
                let mut items = Vec::new();
                let mut trailing_comma = false;
                while !self.at(P::RParen) && !matches!(self.tok(), Tok::Eof) {
                    items.push(self.expr(Ctx::Normal));
                    trailing_comma = self.eat(P::Comma);
                    if !trailing_comma {
                        break;
                    }
                }
                self.expect_close(P::RParen, open);
                let span = start.to(Span::new(self.prev_end(), self.prev_end()));
                if items.is_empty() {
                    return self.expr_node(ExprKind::Unit, span);
                }
                if items.len() == 1 && !trailing_comma {
                    let inner = items.pop().expect("one");
                    return self.expr_node(ExprKind::Paren(Box::new(inner)), span);
                }
                self.expr_node(ExprKind::Tuple(items), span)
            }
            Tok::P(P::LBracket) => {
                let open = self.bump();
                if self.at(P::Colon) && matches!(self.nth(1), Tok::P(P::RBracket)) {
                    self.bump();
                    self.bump();
                    let span = start.to(Span::new(self.prev_end(), self.prev_end()));
                    return self.expr_node(ExprKind::Map(Vec::new()), span);
                }
                let mut items = Vec::new();
                let mut entries = Vec::new();
                while !self.at(P::RBracket) && !matches!(self.tok(), Tok::Eof) {
                    let dots = self.span();
                    if self.eat(P::DotDot) {
                        let inner = self.expr(Ctx::Normal);
                        let span = dots.to(inner.span);
                        items.push(self.expr_node(ExprKind::Spread(Box::new(inner)), span));
                        if !self.eat(P::Comma) {
                            break;
                        }
                        continue;
                    }
                    let key = self.expr(Ctx::Normal);
                    if self.eat(P::Colon) {
                        let value = self.expr(Ctx::Normal);
                        entries.push((key, value));
                    } else {
                        items.push(key);
                    }
                    if !self.eat(P::Comma) {
                        break;
                    }
                }
                self.expect_close(P::RBracket, open);
                let span = start.to(Span::new(self.prev_end(), self.prev_end()));
                if !entries.is_empty() {
                    if !items.is_empty() {
                        self.error(
                            Diagnostic::error("B0101", span, "a literal is a list or a map, not both")
                                .label("some entries have a key and some do not")
                                .help("write `[a, b]` for a list or `[\"k\": v]` for a map")
                                .spec("3-grammar-ebnf"),
                        );
                    }
                    return self.expr_node(ExprKind::Map(entries), span);
                }
                self.expr_node(ExprKind::List(items), span)
            }
            Tok::P(P::LBrace) if self.record_ahead() => self.record(),
            Tok::P(P::LBrace) => {
                let closure = self.closure();
                let span = closure.span;
                self.expr_node(ExprKind::Closure(closure), span)
            }
            Tok::Kw(Kw::If) => self.if_expr(),
            Tok::Kw(Kw::Match) => self.match_expr(),
            Tok::Kw(Kw::Task) => {
                self.bump();
                let block = self.block();
                let span = start.to(block.span);
                self.expr_node(ExprKind::Task(block), span)
            }
            _ => {
                let _ = ctx;
                self.unexpected("an expression");
                self.expr_node(ExprKind::Error, start)
            }
        }
    }

    /// `Name<…>(` or `Name<…>.`: a type applied, read ahead without moving.
    fn at_type_application(&self) -> bool {
        if !matches!(self.nth(1), Tok::P(P::Lt)) || self.tokens[self.pos + 1].space_before {
            return false;
        }
        let mut depth = 0i32;
        let mut at = self.pos + 1;
        while at < self.tokens.len() {
            match &self.tokens[at].tok {
                Tok::P(P::Lt) => depth += 1,
                Tok::P(P::Gt) => {
                    depth -= 1;
                    if depth == 0 {
                        return matches!(
                            self.tokens.get(at + 1).map(|t| &t.tok),
                            Some(Tok::P(P::LParen | P::Dot))
                        );
                    }
                }
                Tok::Ident(_) | Tok::P(P::Comma | P::LBracket | P::RBracket | P::Colon | P::Question) => {}
                _ => return false,
            }
            at += 1;
        }
        false
    }

    fn interpolation(&mut self, span: Span) -> Expr {
        let lexed = lex(self.source, span.start as usize, span.end as usize);
        self.sub_comments.extend(lexed.comments);
        let mut sub = Parser::new(self.source, lexed.tokens, self.next_id);
        sub.diagnostics = lexed.diagnostics;
        sub.skip_newlines();
        let expr = if matches!(sub.tok(), Tok::Eof) {
            sub.error(
                Diagnostic::error(
                    "B0101",
                    Span::new(span.start.saturating_sub(2), span.end + 1),
                    "an empty interpolation",
                )
                .label("`${}` has no value")
                .help("write the value inside: `${count}`, or `\\$` for a dollar sign"),
            );
            sub.expr_node(ExprKind::Error, span)
        } else {
            sub.expr(Ctx::Normal)
        };
        sub.skip_newlines();
        if !matches!(sub.tok(), Tok::Eof) {
            sub.unexpected("`}` to end the interpolation");
        }
        let diagnostics = std::mem::take(&mut sub.diagnostics);
        let comments = std::mem::take(&mut sub.sub_comments);
        drop(sub);
        if !self.panicking {
            self.panicking = !diagnostics.is_empty();
            self.diagnostics.extend(diagnostics);
        }
        self.sub_comments.extend(comments);
        expr
    }
}

fn contains_await_marker(expr: &Expr) -> bool {
    match &expr.kind {
        ExprKind::Await(_) => true,
        ExprKind::Field(inner, _)
        | ExprKind::OptField(inner, _)
        | ExprKind::Try(inner)
        | ExprKind::Index(inner, _) => contains_await_marker(inner),
        ExprKind::Call(call) => contains_await_marker(&call.callee),
        _ => false,
    }
}

/// Whether `{` after `expr` is its trailing closure: after a name, a member
/// or a call (`VStack {`, `.onPress {`, `a?.map {`, `f(x) {`).
fn is_callee(expr: &Expr) -> bool {
    match &expr.kind {
        ExprKind::Name(_) | ExprKind::Field(..) | ExprKind::OptField(..) | ExprKind::TypeApply { .. } => true,
        ExprKind::Call(call) => call.trailing.is_none(),
        _ => false,
    }
}

fn is_place(expr: &Expr) -> bool {
    match &expr.kind {
        ExprKind::Name(name) => !is_upper(name),
        ExprKind::Field(inner, _) => is_place(inner),
        _ => false,
    }
}

/// A keyword written the way another language spells it.
fn keyword_typo(word: &str) -> Option<&'static str> {
    Some(match word {
        "func" | "function" | "def" => "fn",
        "const" => "let",
        "switch" => "match",
        "elif" | "elsif" => "else if",
        "null" | "nil" | "undefined" => "none",
        "export" => "pub",
        "interface" => "struct",
        "foreach" => "for",
        "await_" => "await",
        _ => return None,
    })
}

/// Keywords that never start an expression, so they may name a parameter, a field or a value.
fn is_soft(kw: Kw) -> bool {
    matches!(kw, Kw::Type | Kw::Body | Kw::View | Kw::Screen | Kw::Layout | Kw::From)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse_ok(source: &str) -> File {
        let (file, _, diagnostics) = parse(source);
        assert!(diagnostics.is_empty(), "{:#?}", diagnostics.iter().map(|d| &d.message).collect::<Vec<_>>());
        file
    }

    #[test]
    fn parses_the_taste() {
        let file = parse_ok(
            "import { useTranslation } from \"react-i18next\"\n\
             enum Load<T> {\n  loading\n  failed(message: String)\n  ready(T)\n}\n\
             struct Draft {\n  text: String = \"\"\n  sensitive: Bool = false\n}\n\
             pub view Composer(maxLength: Int = 500, onSend: async (Draft) -> Result<Unit, String>) {\n\
               let { t } = useTranslation()\n  @state draft = Draft()\n\
               let left = maxLength - draft.text.count\n\
               async fn send() {\n    match await onSend(draft) {\n      case .ok(_) => draft = Draft()\n      case .err(message) => toast(message, type: \"error\")\n    }\n  }\n\
               body {\n    VStack {\n      Text(\"${left}\").foreground(left < 0 ? \"error\" : \"muted\")\n      Button(Text(\"x\")).disabled(!true).onPress { await send() }\n    }\n    .spacing(\"md\")\n  }\n}\n",
        );
        assert_eq!(file.imports.len(), 1);
        assert_eq!(file.items.len(), 3);
    }

    #[test]
    fn await_binds_before_try() {
        let file = parse_ok("fn f() { let x = await g()? }");
        let ItemKind::Fn(f) = &file.items[0].kind else { panic!() };
        let StmtKind::Let(l) = &f.body.stmts[0].kind else { panic!() };
        let ExprKind::Try(inner) = &l.value.kind else { panic!("{:?}", l.value.kind) };
        assert!(matches!(inner.kind, ExprKind::Await(_)));
    }

    #[test]
    fn no_trailing_closure_in_heads() {
        let file = parse_ok("fn f(x: Bool) { if x { g() } else { h() } }");
        let ItemKind::Fn(f) = &file.items[0].kind else { panic!() };
        let StmtKind::Expr(e) = &f.body.stmts[0].kind else { panic!() };
        assert!(matches!(e.kind, ExprKind::If(_)));
    }

    #[test]
    fn one_typo_one_error() {
        let (_, _, diagnostics) = parse("fn f() {\n  let x = (1 +\n  g(x)\n}\nfn g() { 1 }\n");
        assert_eq!(diagnostics.len(), 1, "{diagnostics:#?}");
    }
}
