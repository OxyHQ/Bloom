//! Expressions, as Swift writes them.

use std::fmt::Write as _;

use bloom_lang::ast::*;

use super::{Emitter, Mode, VALUE_RENAMES, kw, label, pad};

/// Swift's precedence of a binary operator (higher binds tighter), and whether it groups
/// to the right. Bloom's table differs: `??` is Bloom's loosest and binds tighter than a
/// comparison in Swift, so a tree Bloom parsed is parenthesised by Swift's table.
fn swift_precedence(op: BinaryOp) -> (u8, bool) {
    match op {
        BinaryOp::Mul | BinaryOp::Div | BinaryOp::Rem => (8, false),
        BinaryOp::Add | BinaryOp::Sub => (7, false),
        BinaryOp::Default => (5, true),
        BinaryOp::Lt | BinaryOp::Le | BinaryOp::Gt | BinaryOp::Ge | BinaryOp::Eq | BinaryOp::Ne => (4, false),
        BinaryOp::And => (3, false),
        BinaryOp::Or => (2, false),
    }
}

fn is_comparison(op: BinaryOp) -> bool {
    matches!(op, BinaryOp::Lt | BinaryOp::Le | BinaryOp::Gt | BinaryOp::Ge | BinaryOp::Eq | BinaryOp::Ne)
}

/// The members of a list or a string that Swift answers with a slice (`ArraySlice`,
/// `Substring`), where Bloom's answer is the list or string itself.
const SLICING: &[&str] = &["prefix", "suffix", "dropFirst", "dropLast"];

/// The result type of a function type as the checker writes it (`(Post) -> Void`).
fn fn_result(ty: &str) -> Option<&str> {
    let bytes = ty.as_bytes();
    let mut depth = 0i32;
    let mut at = None;
    for i in 0..bytes.len() {
        match bytes[i] {
            b'(' | b'[' | b'<' => depth += 1,
            b')' | b']' => depth -= 1,
            b'>' if i > 0 && bytes[i - 1] == b'-' && depth == 0 => at = Some(i + 1),
            b'>' if !(i > 0 && bytes[i - 1] == b'-') => depth -= 1,
            _ => {}
        }
    }
    at.map(|i| ty[i..].trim())
}

impl Emitter<'_> {
    /// An expression in a place that takes Swift's `if`/`switch` expressions (a `let`'s
    /// value, a `return`, an assignment): written as one when each branch is a single
    /// expression, else as a closure called at once.
    pub(crate) fn expr_value(&mut self, e: &Expr, indent: usize) -> String {
        match &e.kind {
            ExprKind::If(i) if !matches!(i.cond, Cond::Let(..)) && self.simple_if(i) => self.expr(e),
            ExprKind::If(_) | ExprKind::Match(_) => self.immediate(e, indent),
            _ => self.expr(e),
        }
    }

    fn simple_if(&self, i: &IfExpr) -> bool {
        let single = |b: &Block| matches!(b.stmts.as_slice(), [Stmt { kind: StmtKind::Expr(x), .. }] if !matches!(x.kind, ExprKind::If(_) | ExprKind::Match(_)));
        single(&i.then)
            && match i.otherwise.as_deref() {
                Some(Else::Block(b)) => single(b),
                Some(Else::If(x)) => matches!(&x.kind, ExprKind::If(inner) if !matches!(inner.cond, Cond::Let(..)) && self.simple_if(inner)),
                None => false,
            }
    }

    /// `{ () -> T in switch x { case .a: return 1 … } }()`: a branching value anywhere.
    fn immediate(&mut self, e: &Expr, indent: usize) -> String {
        let ret = self.type_at(e.span).map(|t| self.swift_type_text(t));
        let stmt = Stmt { kind: StmtKind::Expr(e.clone()), span: e.span };
        let body = self.stmt(&stmt, indent + 1, Mode::Value);
        let head = ret.map(|t| format!(" () -> {t} in")).unwrap_or_default();
        format!("{{{head}\n{body}{}}}()", pad(indent))
    }

    /// A type as the checker writes it, in Swift.
    pub(crate) fn swift_type_text(&self, t: &str) -> String {
        let t = t.replace("Float", "Double").replace("Unit", "Void");
        if t.starts_with("async ") { t.trim_start_matches("async ").to_string() } else { t }
    }

    pub(crate) fn expr(&mut self, e: &Expr) -> String {
        match &e.kind {
            ExprKind::Int(n) => n.to_string(),
            ExprKind::Float(f) => {
                let s = f.to_string();
                if s.contains('.') || s.contains('e') || s.contains("inf") || s.contains("NaN") { s } else { format!("{s}.0") }
            }
            ExprKind::Bool(b) => b.to_string(),
            ExprKind::None => "nil".into(),
            ExprKind::Unit => "()".into(),
            ExprKind::Str { parts, .. } => self.string(parts),
            ExprKind::Name(n) => match VALUE_RENAMES.iter().find(|(b, _)| b == n) {
                Some((_, s)) => s.to_string(),
                None if n.starts_with('$') => n.clone(),
                None => kw(n),
            },
            ExprKind::ImplicitMember(name) => format!(".{}", kw(&name.name)),
            ExprKind::Binding(path) => {
                let place: Vec<String> = path.iter().map(|i| kw(&i.name)).collect();
                format!("${}", place.join("."))
            }
            ExprKind::KeyPath { root, path } => {
                let root = root.as_ref().map(|r| r.name.clone()).unwrap_or_default();
                let path: Vec<String> = path.iter().map(|i| kw(&i.name)).collect();
                format!("\\{root}.{}", path.join("."))
            }
            ExprKind::TypeApply { name, args } => {
                let args: Vec<String> = args.iter().map(|a| self.ty(a)).collect();
                format!("{}<{}>", name.name, args.join(", "))
            }
            ExprKind::Paren(inner) => format!("({})", self.expr(inner)),
            ExprKind::Tuple(items) => {
                let items: Vec<String> = items.iter().map(|i| self.expr(i)).collect();
                format!("({})", items.join(", "))
            }
            ExprKind::List(items) => self.list(items),
            ExprKind::Spread(inner) => self.expr(inner),
            ExprKind::Map(entries) if entries.is_empty() => "[:]".into(),
            ExprKind::Map(entries) => {
                // Bloom's maps keep insertion order: an `OrderedDictionary`, whatever the context.
                let items: Vec<String> =
                    entries.iter().map(|(k, v)| format!("{}: {}", self.expr(k), self.expr(v))).collect();
                format!("([{}] as OrderedDictionary)", items.join(", "))
            }
            ExprKind::Is(inner, t) => format!("{} is {}", self.operand(inner), self.ty(t)),
            ExprKind::CastAs(inner, t) => format!("({} as? {})", self.operand(inner), self.ty(t)),
            ExprKind::Record(entries) => self.record(e, entries),
            ExprKind::Unary(op, inner) => {
                let inner = self.operand(inner);
                match op {
                    UnaryOp::Not => format!("!{inner}"),
                    UnaryOp::Neg => format!("-{inner}"),
                }
            }
            ExprKind::Binary(op, a, b) => self.binary(*op, a, b),
            ExprKind::Ternary(c, a, b) => {
                let c = self.ternary_part(c);
                let a = self.ternary_part(a);
                let b = self.ternary_part(b);
                format!("{c} ? {a} : {b}")
            }
            ExprKind::Await(inner) => match &inner.kind {
                // Swift writes `try await`, never `await try`.
                ExprKind::Throwing(kind, call) => format!("{} await {}", try_word(*kind), self.expr(call)),
                _ => format!("await {}", self.expr(inner)),
            },
            ExprKind::Try(inner) => {
                self.unsupported(e.span, "`expr?` (0.x early return; write `try`)");
                self.expr(inner)
            }
            ExprKind::Force(inner) => format!("{}!", self.postfix_base(inner)),
            ExprKind::Throwing(kind, inner) => format!("{} {}", try_word(*kind), self.expr(inner)),
            ExprKind::Field(base, field) => self.field(base, field),
            ExprKind::OptField(base, field) => format!("{}?.{}", self.postfix_base(base), kw(&field.name)),
            ExprKind::Index(base, index) => format!("{}[{}]", self.postfix_base(base), self.expr(index)),
            ExprKind::Call(call) => self.call(e, call),
            ExprKind::Closure(c) => self.closure(c, e.span, self.indent),
            ExprKind::If(i) => {
                if self.simple_if(i) && !matches!(i.cond, Cond::Let(..)) {
                    // `c ? a : b`, which every position takes.
                    let cond = self.cond(&i.cond);
                    let then = self.branch_value(&i.then);
                    let otherwise = match i.otherwise.as_deref() {
                        Some(Else::Block(b)) => self.branch_value(b),
                        Some(Else::If(x)) => format!("({})", self.expr(x)),
                        None => "()".into(),
                    };
                    format!("({cond} ? {then} : {otherwise})")
                } else {
                    self.immediate(e, self.indent)
                }
            }
            ExprKind::Match(_) => self.immediate(e, self.indent),
            ExprKind::Task(block) => {
                let at = self.indent;
                let body = self.block(&block.stmts, at + 1, Mode::Unit);
                format!("Task {{\n{body}{}}}", pad(at))
            }
            ExprKind::Error => self.unsupported(e.span, "an unreadable expression"),
        }
    }

    fn branch_value(&mut self, b: &Block) -> String {
        match b.stmts.as_slice() {
            [Stmt { kind: StmtKind::Expr(x), .. }] => self.ternary_part(x),
            _ => "()".into(),
        }
    }

    fn ternary_part(&mut self, e: &Expr) -> String {
        let text = self.expr(e);
        match &e.kind {
            ExprKind::Ternary(..) | ExprKind::Closure(_) => format!("({text})"),
            ExprKind::Binary(BinaryOp::Default, ..) => format!("({text})"),
            _ => text,
        }
    }

    /// An operand of a prefix operator: parenthesised unless it is atomic.
    fn operand(&mut self, e: &Expr) -> String {
        let text = self.expr(e);
        match &e.kind {
            ExprKind::Binary(..) | ExprKind::Ternary(..) | ExprKind::Await(_) | ExprKind::Throwing(..) | ExprKind::Is(..) => {
                format!("({text})")
            }
            _ => text,
        }
    }

    /// The base of `.field`, `[i]`, `!`: parenthesised unless it is postfix-safe.
    pub(crate) fn postfix_base(&mut self, e: &Expr) -> String {
        let text = self.expr(e);
        match &e.kind {
            ExprKind::Binary(..)
            | ExprKind::Ternary(..)
            | ExprKind::Unary(..)
            | ExprKind::Await(_)
            | ExprKind::Throwing(..)
            | ExprKind::Is(..)
            | ExprKind::Closure(_) => format!("({text})"),
            ExprKind::Int(n) if *n < 0 => format!("({text})"),
            _ => text,
        }
    }

    fn binary(&mut self, op: BinaryOp, a: &Expr, b: &Expr) -> String {
        let (prec, right) = swift_precedence(op);
        let side = |this: &mut Self, child: &Expr, is_right: bool| -> String {
            let text = this.expr(child);
            let wrap = match &child.kind {
                ExprKind::Binary(cop, ..) => {
                    let (cprec, _) = swift_precedence(*cop);
                    cprec < prec
                        || (cprec == prec && (is_comparison(op) || is_right != right))
                }
                ExprKind::Ternary(..) | ExprKind::Is(..) | ExprKind::CastAs(..) => true,
                ExprKind::Await(_) | ExprKind::Throwing(..) => !is_right || matches!(op, BinaryOp::Default),
                _ => false,
            };
            if wrap { format!("({text})") } else { text }
        };
        let a = side(self, a, false);
        let b = side(self, b, true);
        format!("{a} {} {b}", op.text())
    }

    fn list(&mut self, items: &[Expr]) -> String {
        if !items.iter().any(|i| matches!(i.kind, ExprKind::Spread(_))) {
            let items: Vec<String> = items.iter().map(|i| self.expr(i)).collect();
            return format!("[{}]", items.join(", "));
        }
        // `[..a, b, ..c]` → `a + [b] + c`.
        let mut parts: Vec<String> = Vec::new();
        let mut run: Vec<String> = Vec::new();
        for item in items {
            match &item.kind {
                ExprKind::Spread(inner) => {
                    if !run.is_empty() {
                        parts.push(format!("[{}]", run.join(", ")));
                        run.clear();
                    }
                    parts.push(self.postfix_base(inner));
                }
                _ => run.push(self.expr(item)),
            }
        }
        if !run.is_empty() {
            parts.push(format!("[{}]", run.join(", ")));
        }
        format!("({})", parts.join(" + "))
    }

    /// `{ id: "1", likes: 0 }` typed by a struct: its construction.
    fn record(&mut self, e: &Expr, entries: &[RecordEntry]) -> String {
        let ty = self.type_at(e.span).map(|t| t.trim_end_matches('?').to_string());
        match ty {
            Some(t) if self.decls.structs.contains_key(&t) && entries.iter().all(|x| matches!(x, RecordEntry::Field { .. })) => {
                let order = self.decls.structs.get(&t).cloned().unwrap_or_default();
                let mut args: Vec<(usize, String)> = entries
                    .iter()
                    .filter_map(|x| match x {
                        RecordEntry::Field { key, value } => {
                            let at = order.iter().position(|p| p.name == key.name).unwrap_or(usize::MAX);
                            Some((at, format!("{}: {}", kw(&key.name), self.expr(value))))
                        }
                        RecordEntry::Spread(_) => None,
                    })
                    .collect();
                args.sort_by_key(|(at, _)| *at);
                format!("{t}({})", args.into_iter().map(|(_, a)| a).collect::<Vec<_>>().join(", "))
            }
            _ => self.unsupported(e.span, "a record literal not typed by a struct"),
        }
    }

    pub(crate) fn string(&mut self, parts: &[StrPart]) -> String {
        let mut out = String::from("\"");
        for part in parts {
            match part {
                StrPart::Text(t) => {
                    for ch in t.chars() {
                        match ch {
                            '"' => out.push_str("\\\""),
                            '\\' => out.push_str("\\\\"),
                            '\n' => out.push_str("\\n"),
                            '\r' => out.push_str("\\r"),
                            '\t' => out.push_str("\\t"),
                            '\0' => out.push_str("\\0"),
                            c if (c as u32) < 0x20 || c as u32 == 0x7f => {
                                let _ = write!(out, "\\u{{{:X}}}", c as u32);
                            }
                            c => out.push(c),
                        }
                    }
                }
                StrPart::Interp(e) => {
                    let _ = write!(out, "\\({})", self.expr(e));
                }
            }
        }
        out.push('"');
        out
    }

    pub(crate) fn receiver_type(&self, e: &Expr) -> Option<String> {
        self.type_at(e.span).map(|t| t.to_string())
    }

    /// `x.field`. A string's `count` is Swift's own: grapheme clusters, as Bloom defines it on
    /// every backend (ADR 0003).
    fn field(&mut self, base: &Expr, field: &Ident) -> String {
        let ty = self.receiver_type(base).unwrap_or_default();
        let b = self.postfix_base(base);
        match field.name.as_str() {
            name => {
                let _ = ty;
                format!("{b}.{}", kw(name))
            }
        }
    }

    /// The arguments of a call, labels as written: Bloom's labels are Swift's.
    pub(crate) fn args(&mut self, call: &Call) -> String {
        let items: Vec<String> = call
            .args
            .iter()
            .map(|a| {
                if a.spread {
                    self.unsupported(a.span, "a struct spread argument (`..value`)");
                }
                let value = self.arg_value(&a.value);
                match &a.label {
                    Some(l) => format!("{}: {value}", label(&l.name)),
                    None => value,
                }
            })
            .collect();
        items.join(", ")
    }

    fn arg_value(&mut self, e: &Expr) -> String {
        match &e.kind {
            ExprKind::Closure(c) => self.closure(c, e.span, self.indent),
            _ => self.expr(e),
        }
    }

    pub(crate) fn trailing(&mut self, call: &Call, span: Span) -> String {
        match call.trailing.as_deref() {
            Some(c) => format!(" {}", self.closure(c, c.span.to(span), self.indent)),
            None => String::new(),
        }
    }

    fn call(&mut self, e: &Expr, call: &Call) -> String {
        // `Binding(get: v, set: f)`: SwiftUI's getter is a closure.
        if let ExprKind::Name(n) = &call.callee.kind
            && n == "Binding"
            && call.args.iter().any(|a| a.label.as_ref().is_some_and(|l| l.name == "get"))
        {
            let mut items = Vec::new();
            for a in &call.args {
                let label = a.label.as_ref().map(|l| l.name.as_str()).unwrap_or("");
                let value = self.arg_value(&a.value);
                items.push(if label == "get" { format!("get: {{ {value} }}") } else { format!("{label}: {value}") });
            }
            return format!("Binding({})", items.join(", "));
        }
        let callee = match &call.callee.kind {
            ExprKind::Field(base, method) => {
                let b = self.postfix_base(base);
                format!("{b}.{}", kw(&method.name))
            }
            _ => self.postfix_base(&call.callee),
        };
        let q = if call.optional { "?" } else { "" };
        let args = self.args(call);
        let trailing = self.trailing(call, e.span);
        let text = if call.parens || call.trailing.is_none() {
            format!("{callee}{q}({args}){trailing}")
        } else if call.args.iter().all(|a| a.label.is_some() && matches!(a.value.kind, ExprKind::Closure(_))) {
            // `row { } label: { "Go" }`: Swift's labelled trailing closures, as written.
            let rest: Vec<String> = call
                .args
                .iter()
                .map(|a| {
                    let value = self.arg_value(&a.value);
                    format!("{}: {value}", label(&a.label.as_ref().map(|l| l.name.clone()).unwrap_or_default()))
                })
                .collect();
            format!("{callee}{q}{trailing} {}", rest.join(" "))
        } else {
            format!("{callee}{q}({args}){trailing}")
        };
        // `xs.prefix(2)` is an `ArraySlice` in Swift, `[T]` in Bloom.
        if let ExprKind::Field(base, method) = &call.callee.kind
            && SLICING.contains(&method.name.as_str())
        {
            let ty = self.receiver_type(base).unwrap_or_default();
            if ty.starts_with('[') && !ty.contains(':') {
                return format!("Array({text})");
            }
            if ty == "String" {
                return format!("String({text})");
            }
        }
        text
    }

    /// A closure. Its body returns its last expression when the checker types the closure
    /// as returning a value; one expression is Swift's implicit return already.
    pub(crate) fn closure(&mut self, c: &Closure, span: Span, indent: usize) -> String {
        let shorthand = !c.has_in && c.params.iter().all(|p| p.name.name.starts_with('$'));
        let params: Vec<String> = c
            .params
            .iter()
            .map(|q| match &q.ty {
                Some(t) => format!("{}: {}", kw(&q.name.name), self.ty(t)),
                None => kw(&q.name.name),
            })
            .collect();
        let typed = c.params.iter().any(|q| q.ty.is_some());
        let head = if shorthand || params.is_empty() {
            String::new()
        } else if c.tuple || typed {
            format!(" ({}) in", params.join(", "))
        } else {
            format!(" {} in", params.join(", "))
        };
        let returns = self
            .type_at(c.span)
            .or_else(|| self.type_at(span))
            .and_then(fn_result)
            .map(|r| !matches!(r, "Unit" | "Void" | "()" | "Never"));
        if let [Stmt { kind: StmtKind::Expr(x), .. }] = c.body.as_slice()
            && !matches!(x.kind, ExprKind::If(_) | ExprKind::Match(_) | ExprKind::Task(_))
        {
            return format!("{{{head} {} }}", self.expr(x));
        }
        let mode = if returns == Some(true) { Mode::Value } else { Mode::Unit };
        let body = self.block(&c.body, indent + 1, mode);
        format!("{{{head}\n{body}{}}}", pad(indent))
    }
}

fn try_word(kind: TryKind) -> &'static str {
    match kind {
        TryKind::Plain => "try",
        TryKind::Optional => "try?",
        TryKind::Force => "try!",
    }
}
