//! Tokens, comments and the newline rules of spec section 2.
//!
//! The lexer reads every token and every line break, then drops the breaks
//! that do not end a statement: inside `(` or `[`, after a binary operator,
//! `,`, `=`, `->`, `=>` or `in`, and before a line that starts with `.name`,
//! `?.` or a binary operator other than `-`.

use crate::ast::{Comment, CommentKind, Span};
use crate::diagnostic::Diagnostic;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Kw {
    As,
    Async,
    Await,
    Body,
    Case,
    Default,
    Defer,
    Else,
    Enum,
    False,
    Fn,
    For,
    From,
    If,
    Import,
    In,
    Layout,
    Let,
    Match,
    None,
    Pub,
    Return,
    Screen,
    Struct,
    Task,
    True,
    Type,
    Var,
    View,
    While,
}

impl Kw {
    pub fn from_word(word: &str) -> Option<Kw> {
        Some(match word {
            "as" => Kw::As,
            "async" => Kw::Async,
            "await" => Kw::Await,
            "body" => Kw::Body,
            "case" => Kw::Case,
            "default" => Kw::Default,
            "defer" => Kw::Defer,
            "else" => Kw::Else,
            "enum" => Kw::Enum,
            "false" => Kw::False,
            "fn" => Kw::Fn,
            "for" => Kw::For,
            "from" => Kw::From,
            "if" => Kw::If,
            "import" => Kw::Import,
            "in" => Kw::In,
            "layout" => Kw::Layout,
            "let" => Kw::Let,
            "match" => Kw::Match,
            "none" => Kw::None,
            "pub" => Kw::Pub,
            "return" => Kw::Return,
            "screen" => Kw::Screen,
            "struct" => Kw::Struct,
            "task" => Kw::Task,
            "true" => Kw::True,
            "type" => Kw::Type,
            "var" => Kw::Var,
            "view" => Kw::View,
            "while" => Kw::While,
            _ => return None,
        })
    }

    pub fn word(self) -> &'static str {
        match self {
            Kw::As => "as",
            Kw::Async => "async",
            Kw::Await => "await",
            Kw::Body => "body",
            Kw::Case => "case",
            Kw::Default => "default",
            Kw::Defer => "defer",
            Kw::Else => "else",
            Kw::Enum => "enum",
            Kw::False => "false",
            Kw::Fn => "fn",
            Kw::For => "for",
            Kw::From => "from",
            Kw::If => "if",
            Kw::Import => "import",
            Kw::In => "in",
            Kw::Layout => "layout",
            Kw::Let => "let",
            Kw::Match => "match",
            Kw::None => "none",
            Kw::Pub => "pub",
            Kw::Return => "return",
            Kw::Screen => "screen",
            Kw::Struct => "struct",
            Kw::Task => "task",
            Kw::True => "true",
            Kw::Type => "type",
            Kw::Var => "var",
            Kw::View => "view",
            Kw::While => "while",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum P {
    LParen,
    RParen,
    LBrace,
    RBrace,
    LBracket,
    RBracket,
    Comma,
    Colon,
    Semi,
    Dot,
    DotDot,
    Question,
    QuestionDot,
    QuestionQuestion,
    Arrow,
    FatArrow,
    Eq,
    EqEq,
    Ne,
    Lt,
    Le,
    Gt,
    Ge,
    Plus,
    Minus,
    Star,
    Slash,
    Percent,
    Bang,
    AndAnd,
    OrOr,
    PlusEq,
    MinusEq,
    StarEq,
    At,
    Dollar,
    Pipe,
}

impl P {
    pub fn text(self) -> &'static str {
        match self {
            P::LParen => "(",
            P::RParen => ")",
            P::LBrace => "{",
            P::RBrace => "}",
            P::LBracket => "[",
            P::RBracket => "]",
            P::Comma => ",",
            P::Colon => ":",
            P::Semi => ";",
            P::Dot => ".",
            P::DotDot => "..",
            P::Question => "?",
            P::QuestionDot => "?.",
            P::QuestionQuestion => "??",
            P::Arrow => "->",
            P::FatArrow => "=>",
            P::Eq => "=",
            P::EqEq => "==",
            P::Ne => "!=",
            P::Lt => "<",
            P::Le => "<=",
            P::Gt => ">",
            P::Ge => ">=",
            P::Plus => "+",
            P::Minus => "-",
            P::Star => "*",
            P::Slash => "/",
            P::Percent => "%",
            P::Bang => "!",
            P::AndAnd => "&&",
            P::OrOr => "||",
            P::PlusEq => "+=",
            P::MinusEq => "-=",
            P::StarEq => "*=",
            P::At => "@",
            P::Dollar => "$",
            P::Pipe => "|",
        }
    }

    /// A binary operator a line can end with and continue on the next.
    fn continues_after(self) -> bool {
        matches!(
            self,
            P::AndAnd
                | P::OrOr
                | P::QuestionQuestion
                | P::Plus
                | P::Minus
                | P::Star
                | P::Slash
                | P::Percent
                | P::EqEq
                | P::Ne
                | P::Le
                | P::Ge
                | P::Comma
                | P::Eq
                | P::Arrow
                | P::FatArrow
                | P::Dot
                | P::PlusEq
                | P::MinusEq
                | P::StarEq
        )
    }

    /// A binary operator (not `-`) a line can start with to continue the previous one.
    fn continues_before(self) -> bool {
        matches!(
            self,
            P::AndAnd
                | P::OrOr
                | P::QuestionQuestion
                | P::QuestionDot
                | P::Plus
                | P::Star
                | P::Slash
                | P::Percent
                | P::EqEq
                | P::Ne
                | P::Lt
                | P::Le
                | P::Gt
                | P::Ge
                | P::Question
                | P::Colon
        )
    }
}

/// A piece of a string literal before parsing: text (escapes resolved) or
/// the source range inside `${…}`.
#[derive(Debug, Clone, PartialEq)]
pub enum RawPart {
    Text(String),
    Interp(Span),
}

#[derive(Debug, Clone, PartialEq)]
pub enum Tok {
    Ident(String),
    Kw(Kw),
    Int(i64),
    Float(f64),
    Str { parts: Vec<RawPart>, raw: bool },
    P(P),
    Newline,
    Eof,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Token {
    pub tok: Tok,
    pub span: Span,
    /// Whitespace (or a line break) right before the token: `x?` is a try,
    /// `x ? a : b` a conditional.
    pub space_before: bool,
}

pub struct Lexed {
    pub tokens: Vec<Token>,
    pub comments: Vec<Comment>,
    pub diagnostics: Vec<Diagnostic>,
}

/// Lexes `source[start..end]`; spans are offsets into `source`.
pub fn lex(source: &str, start: usize, end: usize) -> Lexed {
    let mut lexer = Lexer {
        src: source.as_bytes(),
        text: source,
        pos: start,
        end,
        out: Lexed { tokens: Vec::new(), comments: Vec::new(), diagnostics: Vec::new() },
    };
    lexer.run();
    let mut lexed = lexer.out;
    lexed.tokens = fold_newlines(lexed.tokens);
    lexed
}

struct Lexer<'s> {
    src: &'s [u8],
    text: &'s str,
    pos: usize,
    end: usize,
    out: Lexed,
}

impl Lexer<'_> {
    fn peek(&self, ahead: usize) -> u8 {
        let at = self.pos + ahead;
        if at < self.end { self.src[at] } else { 0 }
    }

    fn push(&mut self, tok: Tok, start: usize, space_before: bool) {
        self.out.tokens.push(Token { tok, span: Span::new(start as u32, self.pos as u32), space_before });
    }

    fn run(&mut self) {
        let mut space = true;
        while self.pos < self.end {
            let start = self.pos;
            let c = self.peek(0);
            match c {
                b' ' | b'\t' | b'\r' => {
                    self.pos += 1;
                    space = true;
                }
                b'\n' => {
                    self.pos += 1;
                    if !matches!(self.out.tokens.last(), Some(Token { tok: Tok::Newline, .. })) {
                        self.push(Tok::Newline, start, true);
                    }
                    space = true;
                }
                b'/' if self.peek(1) == b'/' => {
                    self.line_comment();
                    space = true;
                }
                b'/' if self.peek(1) == b'*' => {
                    self.block_comment();
                    space = true;
                }
                b'"' => {
                    self.string(space);
                    space = false;
                }
                b'0'..=b'9' => {
                    self.number(space);
                    space = false;
                }
                c if c == b'_' || c.is_ascii_alphabetic() => {
                    while self.peek(0) == b'_' || self.peek(0).is_ascii_alphanumeric() {
                        self.pos += 1;
                    }
                    let word = &self.text[start..self.pos];
                    let tok = Kw::from_word(word).map_or_else(|| Tok::Ident(word.to_string()), Tok::Kw);
                    self.push(tok, start, space);
                    space = false;
                }
                _ => {
                    match self.punct() {
                        Some(p) => self.push(Tok::P(p), start, space),
                        None => {
                            let ch = self.text[self.pos..].chars().next().unwrap_or('?');
                            self.pos += ch.len_utf8();
                            self.out.diagnostics.push(
                                Diagnostic::error(
                                    "B0103",
                                    Span::new(start as u32, self.pos as u32),
                                    format!("unexpected character `{ch}`"),
                                )
                                .label("not part of Bloom's syntax")
                                .spec("2-lexical-structure"),
                            );
                        }
                    }
                    space = false;
                }
            }
        }
        let at = self.end as u32;
        if !matches!(self.out.tokens.last(), Some(Token { tok: Tok::Newline, .. })) {
            self.out.tokens.push(Token { tok: Tok::Newline, span: Span::new(at, at), space_before: true });
        }
        self.out.tokens.push(Token { tok: Tok::Eof, span: Span::new(at, at), space_before: true });
    }

    fn punct(&mut self) -> Option<P> {
        let (p, len) = match (self.peek(0), self.peek(1)) {
            (b'.', b'.') => (P::DotDot, 2),
            (b'?', b'.') if !self.peek(2).is_ascii_digit() => (P::QuestionDot, 2),
            (b'?', b'?') => (P::QuestionQuestion, 2),
            (b'-', b'>') => (P::Arrow, 2),
            (b'=', b'>') => (P::FatArrow, 2),
            (b'=', b'=') => (P::EqEq, 2),
            (b'!', b'=') => (P::Ne, 2),
            (b'<', b'=') => (P::Le, 2),
            (b'>', b'=') => (P::Ge, 2),
            (b'&', b'&') => (P::AndAnd, 2),
            (b'|', b'|') => (P::OrOr, 2),
            (b'+', b'=') => (P::PlusEq, 2),
            (b'-', b'=') => (P::MinusEq, 2),
            (b'*', b'=') => (P::StarEq, 2),
            (b'(', _) => (P::LParen, 1),
            (b')', _) => (P::RParen, 1),
            (b'{', _) => (P::LBrace, 1),
            (b'}', _) => (P::RBrace, 1),
            (b'[', _) => (P::LBracket, 1),
            (b']', _) => (P::RBracket, 1),
            (b',', _) => (P::Comma, 1),
            (b':', _) => (P::Colon, 1),
            (b';', _) => (P::Semi, 1),
            (b'.', _) => (P::Dot, 1),
            (b'?', _) => (P::Question, 1),
            (b'=', _) => (P::Eq, 1),
            (b'<', _) => (P::Lt, 1),
            (b'>', _) => (P::Gt, 1),
            (b'+', _) => (P::Plus, 1),
            (b'-', _) => (P::Minus, 1),
            (b'*', _) => (P::Star, 1),
            (b'/', _) => (P::Slash, 1),
            (b'%', _) => (P::Percent, 1),
            (b'!', _) => (P::Bang, 1),
            (b'@', _) => (P::At, 1),
            (b'$', _) => (P::Dollar, 1),
            (b'|', _) => (P::Pipe, 1),
            _ => return None,
        };
        self.pos += len;
        Some(p)
    }

    fn line_comment(&mut self) {
        let start = self.pos;
        let doc = self.peek(2) == b'/' && self.peek(3) != b'/';
        while self.pos < self.end && self.peek(0) != b'\n' {
            self.pos += 1;
        }
        let body = &self.text[start + if doc { 3 } else { 2 }..self.pos];
        self.out.comments.push(Comment {
            kind: if doc { CommentKind::Doc } else { CommentKind::Line },
            text: body.strip_suffix('\r').unwrap_or(body).to_string(),
            span: Span::new(start as u32, self.pos as u32),
        });
    }

    fn block_comment(&mut self) {
        let start = self.pos;
        self.pos += 2;
        let mut depth = 1;
        while self.pos < self.end && depth > 0 {
            if self.peek(0) == b'/' && self.peek(1) == b'*' {
                depth += 1;
                self.pos += 2;
            } else if self.peek(0) == b'*' && self.peek(1) == b'/' {
                depth -= 1;
                self.pos += 2;
            } else {
                self.pos += 1;
            }
        }
        let span = Span::new(start as u32, self.pos as u32);
        if depth > 0 {
            self.out.diagnostics.push(
                Diagnostic::error(
                    "B0102",
                    Span::new(start as u32, start as u32 + 2),
                    "unterminated block comment",
                )
                .label("this comment is never closed")
                .help("close it with `*/`"),
            );
        }
        let inner_end = if depth > 0 { self.pos } else { self.pos - 2 };
        self.out.comments.push(Comment {
            kind: CommentKind::Block,
            text: self.text[start + 2..inner_end.max(start + 2)].to_string(),
            span,
        });
    }

    fn number(&mut self, space: bool) {
        let start = self.pos;
        let after_dot =
            matches!(self.out.tokens.last(), Some(Token { tok: Tok::P(P::Dot | P::QuestionDot), .. }));
        if self.peek(0) == b'0' && matches!(self.peek(1), b'x' | b'X') {
            self.pos += 2;
            while self.peek(0).is_ascii_hexdigit() || self.peek(0) == b'_' {
                self.pos += 1;
            }
            let digits: String = self.text[start + 2..self.pos].chars().filter(|c| *c != '_').collect();
            let value = i64::from_str_radix(&digits, 16).unwrap_or_else(|_| {
                self.bad_number(start);
                0
            });
            self.push(Tok::Int(value), start, space);
            return;
        }
        while self.peek(0).is_ascii_digit() || self.peek(0) == b'_' {
            self.pos += 1;
        }
        let mut float = false;
        // `t.0.1` reads two tuple indices, never a float.
        if !after_dot && self.peek(0) == b'.' && self.peek(1).is_ascii_digit() {
            float = true;
            self.pos += 1;
            while self.peek(0).is_ascii_digit() || self.peek(0) == b'_' {
                self.pos += 1;
            }
        }
        if !after_dot
            && matches!(self.peek(0), b'e' | b'E')
            && (self.peek(1).is_ascii_digit()
                || (matches!(self.peek(1), b'+' | b'-') && self.peek(2).is_ascii_digit()))
        {
            float = true;
            self.pos += 2;
            while self.peek(0).is_ascii_digit() {
                self.pos += 1;
            }
        }
        let text: String = self.text[start..self.pos].chars().filter(|c| *c != '_').collect();
        let tok = if float {
            Tok::Float(text.parse().unwrap_or(0.0))
        } else {
            match text.parse::<i64>() {
                Ok(value) if value <= (1 << 53) => Tok::Int(value),
                _ => {
                    self.bad_number(start);
                    Tok::Int(0)
                }
            }
        };
        self.push(tok, start, space);
    }

    fn bad_number(&mut self, start: usize) {
        self.out.diagnostics.push(
            Diagnostic::error(
                "B0105",
                Span::new(start as u32, self.pos as u32),
                "this integer does not fit in an Int",
            )
            .label("an Int is a 53-bit safe integer")
            .help("use a Float (`2e60`) or a smaller number")
            .spec("41-the-types"),
        );
    }

    fn string(&mut self, space: bool) {
        let start = self.pos;
        let raw = self.peek(1) == b'"' && self.peek(2) == b'"';
        self.pos += if raw { 3 } else { 1 };
        let mut parts: Vec<RawPart> = Vec::new();
        let mut text = String::new();
        let mut closed = false;
        while self.pos < self.end {
            let c = self.peek(0);
            if raw && c == b'"' && self.peek(1) == b'"' && self.peek(2) == b'"' {
                self.pos += 3;
                closed = true;
                break;
            }
            if !raw && c == b'"' {
                self.pos += 1;
                closed = true;
                break;
            }
            if !raw && c == b'\n' {
                break;
            }
            if c == b'\\' {
                self.escape(&mut text);
                continue;
            }
            if c == b'$' && self.peek(1) == b'{' {
                if !text.is_empty() {
                    parts.push(RawPart::Text(std::mem::take(&mut text)));
                }
                let open = self.pos;
                self.pos += 2;
                let inner = self.pos;
                let mut depth = 1;
                while self.pos < self.end && depth > 0 {
                    match self.peek(0) {
                        b'{' => depth += 1,
                        b'}' => depth -= 1,
                        b'"' => {
                            // A string inside the interpolation: skip it whole.
                            self.pos += 1;
                            while self.pos < self.end && self.peek(0) != b'"' && self.peek(0) != b'\n' {
                                if self.peek(0) == b'\\' {
                                    self.pos += 1;
                                }
                                self.pos += 1;
                            }
                        }
                        b'\n' if !raw => break,
                        _ => {}
                    }
                    if depth > 0 {
                        self.pos += 1;
                    }
                }
                if depth > 0 {
                    self.out.diagnostics.push(
                        Diagnostic::error(
                            "B0102",
                            Span::new(open as u32, open as u32 + 2),
                            "unterminated interpolation",
                        )
                        .label("this `${` is never closed")
                        .help("close it with `}`"),
                    );
                    break;
                }
                parts.push(RawPart::Interp(Span::new(inner as u32, self.pos as u32)));
                self.pos += 1;
                continue;
            }
            let ch = self.text[self.pos..].chars().next().unwrap_or(' ');
            text.push(ch);
            self.pos += ch.len_utf8();
        }
        if !text.is_empty() {
            parts.push(RawPart::Text(text));
        }
        if !closed {
            self.out.diagnostics.push(
                Diagnostic::error("B0102", Span::new(start as u32, self.pos as u32), "unterminated string")
                    .label("this string is never closed")
                    .help(if raw {
                        "close it with `\"\"\"`"
                    } else {
                        "close it with `\"` on the same line, or use `\"\"\"` for several lines"
                    }),
            );
        }
        if raw {
            parts = strip_indent(parts);
        }
        self.push(Tok::Str { parts, raw }, start, space);
    }

    fn escape(&mut self, text: &mut String) {
        let start = self.pos;
        let c = self.peek(1);
        self.pos += 2;
        match c {
            b'n' => text.push('\n'),
            b't' => text.push('\t'),
            b'"' => text.push('"'),
            b'\\' => text.push('\\'),
            b'$' => text.push('$'),
            b'u' if self.peek(0) == b'{' => {
                let digits_start = self.pos + 1;
                let mut end = digits_start;
                while end < self.end && self.src[end].is_ascii_hexdigit() {
                    end += 1;
                }
                let ch = (end < self.end && self.src[end] == b'}')
                    .then(|| u32::from_str_radix(&self.text[digits_start..end], 16).ok())
                    .flatten()
                    .and_then(char::from_u32);
                match ch {
                    Some(ch) => {
                        text.push(ch);
                        self.pos = end + 1;
                    }
                    None => self.bad_escape(start),
                }
            }
            _ => self.bad_escape(start),
        }
    }

    fn bad_escape(&mut self, start: usize) {
        self.out.diagnostics.push(
            Diagnostic::error(
                "B0102",
                Span::new(start as u32, self.pos as u32),
                "unknown escape in a string",
            )
            .label("not an escape Bloom knows")
            .help("the escapes are \\n \\t \\\" \\\\ \\$ and \\u{1F600}; write `\\\\` for a backslash")
            .spec("2-lexical-structure"),
        );
    }
}

/// A raw string's indentation, the closing delimiter's, is stripped from every
/// line; the line break after the opening `"""` and before the closing one go.
fn strip_indent(parts: Vec<RawPart>) -> Vec<RawPart> {
    let last_text = parts.iter().rev().find_map(|part| match part {
        RawPart::Text(text) => Some(text.as_str()),
        RawPart::Interp(_) => None,
    });
    let indent = last_text
        .and_then(|text| text.rsplit_once('\n').map(|(_, tail)| tail))
        .filter(|tail| tail.chars().all(|c| c == ' ' || c == '\t'))
        .map_or(0, str::len);
    let count = parts.len();
    parts
        .into_iter()
        .enumerate()
        .map(|(index, part)| match part {
            RawPart::Text(text) => {
                let mut lines: Vec<String> = text.split('\n').map(str::to_string).collect();
                for (line_index, line) in lines.iter_mut().enumerate() {
                    if line_index > 0 || index == 0 {
                        let strip = line.chars().take(indent).take_while(|c| *c == ' ' || *c == '\t').count();
                        *line = line[strip..].to_string();
                    }
                }
                let mut text = lines.join("\n");
                if index == 0 {
                    text = text.strip_prefix('\n').map(str::to_string).unwrap_or(text);
                }
                if index == count - 1
                    && let Some(at) = text.rfind('\n')
                    && text[at + 1..].trim().is_empty()
                {
                    text.truncate(at);
                }
                RawPart::Text(text)
            }
            interp => interp,
        })
        .collect()
}

/// Drops the line breaks that do not end a statement (section 2).
fn fold_newlines(tokens: Vec<Token>) -> Vec<Token> {
    let mut out: Vec<Token> = Vec::with_capacity(tokens.len());
    let mut stack: Vec<P> = Vec::new();
    let mut iter = tokens.into_iter().peekable();
    while let Some(token) = iter.next() {
        match &token.tok {
            Tok::P(open @ (P::LParen | P::LBracket | P::LBrace)) => stack.push(*open),
            Tok::P(P::RParen | P::RBracket | P::RBrace) => {
                stack.pop();
            }
            Tok::Newline => {
                let inside = matches!(stack.last(), Some(P::LParen | P::LBracket));
                let after = out.last().is_some_and(|last| match &last.tok {
                    Tok::P(P::Question) => last.space_before,
                    Tok::P(p) => p.continues_after(),
                    Tok::Kw(Kw::In) => true,
                    Tok::Newline => true,
                    _ => false,
                }) || out.is_empty();
                let before = iter.peek().is_some_and(|next| match &next.tok {
                    Tok::P(P::Dot) => true,
                    Tok::P(p) => p.continues_before(),
                    _ => false,
                });
                let is_eof = matches!(iter.peek(), Some(Token { tok: Tok::Eof, .. }));
                if (inside || after || before) && !is_eof {
                    continue;
                }
            }
            _ => {}
        }
        out.push(token);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn kinds(source: &str) -> Vec<String> {
        lex(source, 0, source.len())
            .tokens
            .iter()
            .map(|t| match &t.tok {
                Tok::Ident(name) => name.clone(),
                Tok::Kw(kw) => kw.word().to_string(),
                Tok::Int(v) => v.to_string(),
                Tok::Float(v) => format!("{v}f"),
                Tok::Str { .. } => "str".into(),
                Tok::P(p) => p.text().to_string(),
                Tok::Newline => "NL".into(),
                Tok::Eof => "EOF".into(),
            })
            .collect()
    }

    #[test]
    fn modifier_on_the_next_line_continues() {
        assert_eq!(
            kinds("Text(a)\n  .padding(b)\nx"),
            ["Text", "(", "a", ")", ".", "padding", "(", "b", ")", "NL", "x", "NL", "EOF"]
        );
    }

    #[test]
    fn operators_continue_lines() {
        assert_eq!(kinds("a &&\nb\nc\n  || d"), ["a", "&&", "b", "NL", "c", "||", "d", "NL", "EOF"]);
        // A `-` starting a line is a new statement.
        assert_eq!(kinds("a\n-b"), ["a", "NL", "-", "b", "NL", "EOF"]);
    }

    #[test]
    fn breaks_inside_parentheses_fold() {
        assert_eq!(kinds("f(\n a,\n b\n)\n"), ["f", "(", "a", ",", "b", ")", "NL", "EOF"]);
    }

    #[test]
    fn tuple_indices_are_not_floats() {
        assert_eq!(kinds("t.0.1 1.5"), ["t", ".", "0", ".", "1", "1.5f", "NL", "EOF"]);
    }

    #[test]
    fn interpolation_parts() {
        let lexed = lex("\"a${b}c\"", 0, 8);
        assert_eq!(
            lexed.tokens[0].tok,
            Tok::Str {
                parts: vec![
                    RawPart::Text("a".into()),
                    RawPart::Interp(Span::new(4, 5)),
                    RawPart::Text("c".into())
                ],
                raw: false
            }
        );
    }

    #[test]
    fn raw_strings_strip_indentation() {
        let source = "\"\"\"\n    one\n      two\n    \"\"\"";
        let lexed = lex(source, 0, source.len());
        assert_eq!(
            lexed.tokens[0].tok,
            Tok::Str { parts: vec![RawPart::Text("one\n  two".into())], raw: true }
        );
    }
}
