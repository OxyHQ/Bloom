//! JS's `Date` as the standard library's (`stdlib/Bloom/Time.bloom`, #1066): a Bloom `Date` is a
//! plain JS `Date`, so it crosses TS in both directions, and it may be JS's Invalid Date as a TS
//! `Date` may.
//!
//! | TS | Bloom 2.0 |
//! |---|---|
//! | `new Date()`, `Date.now()` | `Date.now`, `Date.now.millisecondsSince1970` |
//! | `new Date(ms)` | `Date(millisecondsSince1970: ms)` |
//! | `new Date(iso)` | `(try? Date(iso, strategy: .iso8601))`, `?? Date(millisecondsSince1970: .nan)` as a value |
//! | `new Date(y, m, d, h, mi, s)` | `Calendar.current.date(year: y, month: m + 1, day: d, …)` |
//! | `new Date(d.getFullYear(), d.getMonth(), d.getDate())` | `Calendar.current.startOfDay(d)` |
//! | `Date.UTC(…)`, `Date.parse(s)` | `Calendar(utc: true).date(…).millisecondsSince1970`, `(try? Date(s, …))?.millisecondsSince1970 ?? .nan` |
//! | `d.getTime()`, `d.toISOString()` | `d.millisecondsSince1970`, `d.iso8601` |
//! | `d.getFullYear()`, `getMonth()`, `getDate()`, `getDay()`, `getHours()` … | `d.components().year`, `(… .month - 1)`, `.day`, `(… .weekday - 1)`, `.hour` … |
//! | `d.toLocaleDateString(l, o)`, `toLocaleTimeString`, `toLocaleString` | `d.formatted(.dateTime.month(.abbreviated).day(), locale: l)` |
//! | `new Intl.DateTimeFormat(l, o)` | `{ (date: Date) in date.formatted(…) }` |
//!
//! FormatStyle's fields are ECMA-402's options with its defaults spelled out
//! (`toLocaleDateString()` is `.dateTime.year().month(.defaultDigits).day()`), so the text is
//! byte-identical. JS prints "Invalid Date" for an Invalid Date where Intl throws, so a parse
//! that may fail formats as `?.formatted(…) ?? "Invalid Date"`. A setter (`setHours`)
//! is refused: a Bloom `Date` is a value.

use oxc_ast::ast::*;
use oxc_span::{GetSpan, Span};
use oxc_syntax::operator::BinaryOperator;

use crate::expr::is_postfix_text;
use crate::module::Tr;

/// What a date expression may hold besides a date.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum DateKind {
    /// A date (a TS `Date`, `new Date()`, a number of milliseconds).
    Valid,
    /// A `Date` that may be JS's Invalid Date (a local bound to a parse).
    MaybeInvalid,
    /// A `Date?`, `none` where JS has the Invalid Date (an inline `try?` parse).
    Optional,
}

pub struct DateVal {
    pub text: String,
    pub kind: DateKind,
}

const INVALID: &str = "Date(millisecondsSince1970: .nan)";

impl DateVal {
    /// As a `Date` value: JS's Invalid Date where the parse failed.
    pub fn value(self) -> String {
        match self.kind {
            DateKind::Optional => format!("({} ?? {INVALID})", self.text),
            _ => self.text,
        }
    }

    fn receiver(&self) -> String {
        if postfix(&self.text) { self.text.clone() } else { format!("({})", self.text) }
    }

    /// The same date as a `Date` (the Invalid Date included) for a member that reads it.
    fn plain(self) -> DateVal {
        let kind = if self.kind == DateKind::Optional { DateKind::MaybeInvalid } else { self.kind };
        DateVal { text: self.value(), kind }
    }
}

/// Whether `text` takes a member as it is: a name path, a call of one (`Date(…)`), or a
/// parenthesized whole.
fn postfix(text: &str) -> bool {
    if is_postfix_text(text) {
        return true;
    }
    let head_end = text.find('(').unwrap_or(text.len());
    if !text.ends_with(')') || !(head_end == 0 || is_postfix_text(&text[..head_end])) {
        return false;
    }
    // The parenthesis opened at `head_end` closes at the end (strings counted out).
    let (mut depth, mut quoted, mut escaped) = (0i32, false, false);
    for (i, c) in text.char_indices().skip_while(|(i, _)| *i < head_end) {
        if quoted {
            match c {
                _ if escaped => escaped = false,
                '\\' => escaped = true,
                '"' => quoted = false,
                _ => {}
            }
            continue;
        }
        match c {
            '"' => quoted = true,
            '(' => depth += 1,
            ')' => {
                depth -= 1;
                if depth == 0 {
                    return i == text.len() - 1;
                }
            }
            _ => {}
        }
    }
    false
}

/// What `new Date(x)`'s one argument is.
enum Arg {
    Ms,
    Text,
    Copy,
}

fn string_value<'b>(e: &'b Expression) -> Option<&'b str> {
    match e.without_parentheses() {
        Expression::StringLiteral(s) => s.value.as_str(),
        _ => None,
    }
}

/// `Date.<name>(…)`, the JS global.
fn date_static<'b>(call: &'b CallExpression) -> Option<&'b str> {
    let Expression::StaticMemberExpression(m) = &call.callee else { return None };
    let Expression::Identifier(o) = &m.object else { return None };
    (o.name == "Date").then_some(m.property.name.as_str())
}

/// Methods only a JS `Date` has: their receiver is one.
const DATE_ONLY: &[&str] = &[
    "getTime",
    "getFullYear",
    "getMonth",
    "getDate",
    "getDay",
    "getHours",
    "getMinutes",
    "getSeconds",
    "getUTCFullYear",
    "getUTCMonth",
    "getUTCDate",
    "getUTCDay",
    "getUTCHours",
    "getUTCMinutes",
    "getUTCSeconds",
    "toISOString",
    "toLocaleDateString",
    "toLocaleTimeString",
];

/// Intl's date options: an options object with one is a date's (`toLocaleString`).
const DATE_OPTIONS: &[&str] =
    &["year", "month", "day", "weekday", "hour", "minute", "second", "dateStyle", "timeStyle", "timeZone"];

/// Which fields ECMA-402's ToDateTimeOptions requires, and the defaults it adds without them.
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Need {
    /// `toLocaleDateString`: a date field, else year, month and day.
    Date,
    /// `toLocaleTimeString`: a time field, else hour, minute and second.
    Time,
    /// `toLocaleString`: any field, else all six.
    All,
    /// `Intl.DateTimeFormat`: any field, else year, month and day.
    AnyDate,
}

impl Tr<'_> {
    fn date_disabled(&self) -> bool {
        self.imported.contains("Date")
    }

    /// Whether `e` is a date: `new Date(…)`, a local bound to one, or a TS `Date`.
    pub fn date_val(&mut self, e: &Expression) -> Option<DateVal> {
        if self.date_disabled() {
            return None;
        }
        match e.without_parentheses() {
            Expression::NewExpression(n) if matches!(&n.callee, Expression::Identifier(id) if id.name == "Date") => {
                Some(self.new_date(n))
            }
            Expression::Identifier(id)
                if let Some(kind) = self.scope.dates.get(id.name.as_str()).copied() =>
            {
                Some(DateVal { text: self.expr(e), kind })
            }
            Expression::ConditionalExpression(c)
                if self.is_date_expr(&c.consequent) && self.is_date_expr(&c.alternate) =>
            {
                let test = self.condition(&c.test);
                let (a, b) = (self.date_val(&c.consequent)?, self.date_val(&c.alternate)?);
                let maybe = [a.kind, b.kind].iter().any(|k| *k != DateKind::Valid);
                let text = format!("{test} ? {} : {}", a.value(), b.value());
                Some(DateVal { text, kind: if maybe { DateKind::MaybeInvalid } else { DateKind::Valid } })
            }
            _ if self.type_of(e).as_deref() == Some("Date")
                || matches!(self.declared_type(e).as_deref(), Some("Date" | "Date?")) =>
            {
                Some(DateVal { text: self.expr(e), kind: DateKind::Valid })
            }
            _ => None,
        }
    }

    /// Whether `e` is a date by its shape (no text is written).
    pub fn is_date_expr(&self, e: &Expression) -> bool {
        if self.date_disabled() {
            return false;
        }
        match e.without_parentheses() {
            Expression::NewExpression(n) => {
                matches!(&n.callee, Expression::Identifier(id) if id.name == "Date")
            }
            Expression::Identifier(id) => self.scope.dates.contains_key(id.name.as_str()),
            Expression::ConditionalExpression(c) => {
                self.is_date_expr(&c.consequent) && self.is_date_expr(&c.alternate)
            }
            _ => {
                self.type_of(e).as_deref() == Some("Date")
                    || matches!(self.declared_type(e).as_deref(), Some("Date" | "Date?"))
            }
        }
    }

    /// Whether `init` is a local midnight: a date of its year, month and day only, a day's start,
    /// or a copy of a local midnight.
    pub fn is_midnight(&self, init: &Expression) -> bool {
        match init.without_parentheses() {
            Expression::NewExpression(n) if matches!(&n.callee, Expression::Identifier(id) if id.name == "Date") => {
                match n.arguments.as_slice() {
                    [y, m, d] => [y, m, d].iter().all(|a| a.as_expression().is_some()),
                    [one] => matches!(one.as_expression().map(|e| e.without_parentheses()),
                        Some(Expression::Identifier(id)) if self.scope.midnights.contains(id.name.as_str())),
                    _ => false,
                }
            }
            _ => false,
        }
    }

    /// The kind a local bound to `init` holds (`const d = new Date(s)`), read from its shape.
    pub fn date_local_kind(&self, init: &Expression) -> Option<DateKind> {
        if !self.is_date_expr(init) {
            return None;
        }
        Some(self.date_kind(init))
    }

    /// The kind of a date expression as a `Date` value (`DateVal::plain`).
    fn date_kind(&self, e: &Expression) -> DateKind {
        match e.without_parentheses() {
            Expression::NewExpression(n) => match n.arguments.as_slice() {
                [one] if let Some(one) = one.as_expression() => match self.date_arg_kind(one) {
                    Arg::Text => DateKind::MaybeInvalid,
                    Arg::Copy => self.date_kind(one),
                    Arg::Ms => DateKind::Valid,
                },
                _ => DateKind::Valid,
            },
            Expression::Identifier(id) => {
                self.scope.dates.get(id.name.as_str()).copied().unwrap_or(DateKind::Valid)
            }
            Expression::ConditionalExpression(c) => {
                if self.date_kind(&c.consequent) == DateKind::Valid
                    && self.date_kind(&c.alternate) == DateKind::Valid
                {
                    DateKind::Valid
                } else {
                    DateKind::MaybeInvalid
                }
            }
            _ => DateKind::Valid,
        }
    }

    /// A name's or a prop's declared Bloom type.
    pub fn declared_type(&self, e: &Expression) -> Option<String> {
        let name = match e.without_parentheses() {
            Expression::Identifier(id) => {
                self.scope.renames.get(id.name.as_str()).cloned().unwrap_or(id.name.to_string())
            }
            Expression::StaticMemberExpression(m) => match &m.object {
                Expression::Identifier(id) if self.scope.props.as_deref() == Some(id.name.as_str()) => {
                    m.property.name.to_string()
                }
                _ => return None,
            },
            _ => return None,
        };
        self.scope.decl.get(&name).cloned()
    }

    fn date_arg_kind(&self, e: &Expression) -> Arg {
        match e.without_parentheses() {
            Expression::StringLiteral(_) | Expression::TemplateLiteral(_) => Arg::Text,
            Expression::NumericLiteral(_) => Arg::Ms,
            Expression::BinaryExpression(b)
                if matches!(
                    b.operator,
                    BinaryOperator::Subtraction | BinaryOperator::Multiplication | BinaryOperator::Division
                ) =>
            {
                Arg::Ms
            }
            Expression::BinaryExpression(b) if b.operator == BinaryOperator::Addition => {
                if self.is_number_expr(&b.left) || self.is_number_expr(&b.right) {
                    Arg::Ms
                } else {
                    Arg::Text
                }
            }
            e if self.is_number_expr(e) => Arg::Ms,
            e if self.is_date_expr(e) => Arg::Copy,
            e => match self.declared_type(e).as_deref() {
                Some("Float" | "Int" | "Float?" | "Int?") => Arg::Ms,
                _ => Arg::Text,
            },
        }
    }

    /// A number by its shape: `Date.now()`, `Date.UTC(…)`, `d.getTime()`, a numeric literal.
    fn is_number_expr(&self, e: &Expression) -> bool {
        match e.without_parentheses() {
            Expression::NumericLiteral(_) => true,
            Expression::CallExpression(c) => {
                matches!(date_static(c), Some("now" | "UTC" | "parse"))
                    || matches!(&c.callee, Expression::StaticMemberExpression(m) if m.property.name == "getTime")
            }
            Expression::BinaryExpression(b) => {
                matches!(
                    b.operator,
                    BinaryOperator::Subtraction | BinaryOperator::Multiplication | BinaryOperator::Division
                ) || (b.operator == BinaryOperator::Addition
                    && self.is_number_expr(&b.left)
                    && self.is_number_expr(&b.right))
            }
            _ => false,
        }
    }

    /// `new Date(…)`.
    fn new_date(&mut self, n: &NewExpression) -> DateVal {
        let args: Vec<&Expression> = n.arguments.iter().filter_map(|a| a.as_expression()).collect();
        if args.len() != n.arguments.len() {
            let text = self.refuse("call:spread", "a spread argument to `new Date`", n.span);
            return DateVal { text, kind: DateKind::Valid };
        }
        match args.as_slice() {
            [] => DateVal { text: "Date.now".into(), kind: DateKind::Valid },
            [one] => match self.date_arg_kind(one) {
                Arg::Ms => {
                    // `new Date(Date.UTC(…))`: the calendar's date itself.
                    if let Expression::CallExpression(c) = one.without_parentheses()
                        && date_static(c) == Some("UTC")
                    {
                        let text = self.calendar_date("Calendar(utc: true)", &c.arguments, c.span);
                        return DateVal { text, kind: DateKind::Valid };
                    }
                    let ms = self.expr(one);
                    DateVal { text: format!("Date(millisecondsSince1970: {ms})"), kind: DateKind::Valid }
                }
                Arg::Text => {
                    let s = self.expr(one);
                    DateVal {
                        text: format!("(try? Date({s}, strategy: .iso8601))"),
                        kind: DateKind::Optional,
                    }
                }
                // A copy: a Bloom `Date` is a value.
                Arg::Copy => self.date_val(one).map(DateVal::plain).unwrap_or_else(|| DateVal {
                    text: self.refuse("new", "`new Date(x)` of an unknown value", n.span),
                    kind: DateKind::Valid,
                }),
            },
            [y, m, d] if let Some(of) = self.same_day_of(y, m, d) => {
                let text = format!("Calendar.current.startOfDay({})", of.value());
                DateVal { text, kind: DateKind::Valid }
            }
            _ => {
                let text = self.calendar_date("Calendar.current", &n.arguments, n.span);
                DateVal { text, kind: DateKind::Valid }
            }
        }
    }

    /// `new Date(x.getFullYear(), x.getMonth(), x.getDate())`: `x`, the day's start.
    fn same_day_of(&mut self, y: &Expression, m: &Expression, d: &Expression) -> Option<DateVal> {
        let receiver = |e: &Expression, name: &str| -> Option<Span> {
            let Expression::CallExpression(c) = e.without_parentheses() else { return None };
            let Expression::StaticMemberExpression(member) = &c.callee else { return None };
            (member.property.name == name && c.arguments.is_empty() && !member.optional)
                .then(|| member.object.span())
        };
        let (a, b, c) = (receiver(y, "getFullYear")?, receiver(m, "getMonth")?, receiver(d, "getDate")?);
        let (ta, tb, tc) = (self.slice(a), self.slice(b), self.slice(c));
        if ta != tb || tb != tc {
            return None;
        }
        let Expression::CallExpression(call) = y.without_parentheses() else { return None };
        let Expression::StaticMemberExpression(member) = &call.callee else { return None };
        let object = &member.object;
        if !self.is_date_expr(object) && !matches!(object.without_parentheses(), Expression::Identifier(_)) {
            return None;
        }
        Some(
            self.date_val(object)
                .unwrap_or_else(|| DateVal { text: self.expr(object), kind: DateKind::Valid })
                .plain(),
        )
    }

    /// `calendar.date(year: y, month: m + 1, day: d, …)` of JS's `(y, m, d, h, mi, s, ms)`.
    fn calendar_date(&mut self, calendar: &str, args: &[Argument], span: Span) -> String {
        let args: Vec<&Expression> = args.iter().filter_map(|a| a.as_expression()).collect();
        if args.len() < 2 || args.len() > 7 {
            return self.refuse("date:parts", "a date of fewer than two or more than seven parts", span);
        }
        if let Some(ms) = args.get(6)
            && !matches!(ms.without_parentheses(), Expression::NumericLiteral(n) if n.value == 0.0)
        {
            return self.refuse("date:parts", "a date's milliseconds", ms.span());
        }
        let labels = ["year", "month", "day", "hour", "minute", "second"];
        let mut out = Vec::new();
        for (i, label) in labels.iter().enumerate() {
            let Some(arg) = args.get(i) else {
                // JS's day defaults to 1, the time to 0 (the calendar's own defaults).
                if *label == "day" {
                    out.push("day: 1".to_string());
                }
                continue;
            };
            if i >= 3 && matches!(arg.without_parentheses(), Expression::NumericLiteral(n) if n.value == 0.0)
            {
                continue;
            }
            let value = if *label == "month" { self.month_plus_one(arg) } else { self.expr(arg) };
            out.push(format!("{label}: {value}"));
        }
        format!("{calendar}.date({})", out.join(", "))
    }

    /// JS's 0-based month as the calendar's 1-based one.
    fn month_plus_one(&mut self, m: &Expression) -> String {
        match m.without_parentheses() {
            Expression::NumericLiteral(n) if n.value.fract() == 0.0 => format!("{}", n.value as i64 + 1),
            Expression::BinaryExpression(b)
                if b.operator == BinaryOperator::Subtraction
                    && matches!(b.right.without_parentheses(), Expression::NumericLiteral(n) if n.value == 1.0) =>
            {
                self.expr(&b.left)
            }
            Expression::CallExpression(c)
                if let Expression::StaticMemberExpression(member) = &c.callee
                    && member.property.name == "getMonth"
                    && c.arguments.is_empty()
                    && !member.optional =>
            {
                let d = self.date_receiver(&member.object).plain();
                format!("{}.components().month", d.receiver())
            }
            other => {
                let v = self.expr(other);
                if is_postfix_text(&v) { format!("{v} + 1") } else { format!("({v}) + 1") }
            }
        }
    }

    /// A Date-only method's receiver: a date, or a value TS typed one.
    fn date_receiver(&mut self, object: &Expression) -> DateVal {
        self.date_val(object).unwrap_or_else(|| DateVal { text: self.expr(object), kind: DateKind::Valid })
    }

    /// `d.getMonth() + 1` (and `d.getUTCMonth() + 1`): `d.components().month`.
    pub fn date_month(&mut self, b: &BinaryExpression) -> Option<String> {
        if self.date_disabled()
            || b.operator != BinaryOperator::Addition
            || !matches!(b.right.without_parentheses(), Expression::NumericLiteral(n) if n.value == 1.0)
        {
            return None;
        }
        let Expression::CallExpression(c) = b.left.without_parentheses() else { return None };
        let Expression::StaticMemberExpression(m) = &c.callee else { return None };
        let utc = match m.property.name.as_str() {
            "getMonth" => "",
            "getUTCMonth" => "utc: true",
            _ => return None,
        };
        if !c.arguments.is_empty() || m.optional {
            return None;
        }
        let d = self.date_receiver(&m.object).plain();
        Some(format!("{}.components({utc}).month", d.receiver()))
    }

    /// `Date.now()`, `Date.parse(s)`, `Date.UTC(…)`, a date's methods, and `Intl.DateTimeFormat`'s
    /// `format(x)`.
    pub fn date_call(&mut self, call: &CallExpression) -> Option<String> {
        if self.date_disabled() {
            return None;
        }
        if let Some(name) = date_static(call) {
            return Some(match (name, call.arguments.as_slice()) {
                ("now", []) => "Date.now.millisecondsSince1970".into(),
                ("parse", [s]) if let Some(s) = s.as_expression() => {
                    let s = self.expr(s);
                    format!("((try? Date({s}, strategy: .iso8601))?.millisecondsSince1970 ?? .nan)")
                }
                ("UTC", args) => {
                    let date = self.calendar_date("Calendar(utc: true)", args, call.span);
                    format!("{date}.millisecondsSince1970")
                }
                _ => self.refuse("date:static", format!("`Date.{name}` here"), call.span),
            });
        }
        if let Some(text) = self.date_format_call(call) {
            return Some(text);
        }
        let Expression::StaticMemberExpression(m) = &call.callee else { return None };
        let method = m.property.name.as_str();
        let dated = self.is_date_expr(&m.object);
        let date_only = DATE_ONLY.contains(&method);
        let date_options = method == "toLocaleString"
            && call.arguments.get(1).and_then(|a| a.as_expression()).is_some_and(|o| {
                matches!(o.without_parentheses(), Expression::ObjectExpression(obj) if obj.properties.iter().any(|p| {
                    matches!(p, ObjectPropertyKind::ObjectProperty(p)
                        if crate::view::key_name(&p.key).is_some_and(|k| DATE_OPTIONS.contains(&k.as_str())))
                }))
            });
        let setter = method.starts_with("set") && dated;
        // `d.setDate(n)` of a local midnight (`Tr::is_midnight`): the same local midnight on day `n`
        // of its month (JS's overflow included: the calendar's `date` takes day 0 and day 32 as
        // JS does), the local reassigned.
        if setter
            && method == "setDate"
            && let Expression::Identifier(id) = &m.object
            && self.scope.midnights.contains(id.name.as_str())
            && let [day] = call.arguments.as_slice()
            && let Some(day) = day.as_expression()
        {
            let name = self.expr(&m.object);
            let day = self.expr(day);
            return Some(format!(
                "{name} = Calendar.current.date(year: {name}.components().year, month: {name}.components().month, day: {day})"
            ));
        }
        // `d.setHours(h, m, s, 0)` of a local: every time field is set, so it is the calendar's date
        // of `d`'s day at that time (`h`/`m`/`s` past their range carry, as JS's do).
        if setter
            && method == "setHours"
            && let Expression::Identifier(id) = &m.object
            && self.scope.dates.contains_key(id.name.as_str())
            && let [h, mi, sec, ms] = call.arguments.as_slice()
            && matches!(ms.as_expression().map(|e| e.without_parentheses()), Some(Expression::NumericLiteral(n)) if n.value == 0.0)
            && let (Some(h), Some(mi), Some(sec)) =
                (h.as_expression(), mi.as_expression(), sec.as_expression())
        {
            let name = self.expr(&m.object);
            let (h, mi, sec) = (self.expr(h), self.expr(mi), self.expr(sec));
            return Some(format!(
                "{name} = Calendar.current.date(year: {name}.components().year, month: {name}.components().month, day: {name}.components().day, hour: {h}, minute: {mi}, second: {sec})"
            ));
        }
        if setter {
            return Some(self.refuse(
                "date:set",
                format!("`{method}` changes a date in place (a Bloom `Date` is a value)"),
                call.span,
            ));
        }
        if !(date_only || (dated && matches!(method, "toLocaleString" | "valueOf")) || date_options) {
            if dated && !matches!(method, "toString") {
                return Some(self.refuse("date:method", format!("the date method `{method}`"), call.span));
            }
            return None;
        }
        let optional = if m.optional { "?" } else { "" };
        let receiver = self.date_receiver(&m.object);
        let (utc, field) = match method.strip_prefix("getUTC") {
            Some(rest) => ("utc: true", rest),
            None => ("", method.strip_prefix("get").unwrap_or("")),
        };
        let text = match method {
            "getTime" | "valueOf" => match receiver.kind {
                DateKind::Optional => format!("({}?.millisecondsSince1970 ?? .nan)", receiver.text),
                _ => format!("{}{optional}.millisecondsSince1970", receiver.receiver()),
            },
            "toISOString" => format!("{}{optional}.iso8601", receiver.plain().receiver()),
            _ if method.starts_with("get") => {
                let member = match field {
                    "FullYear" => "year",
                    "Month" => "month",
                    "Date" => "day",
                    "Day" => "weekday",
                    "Hours" => "hour",
                    "Minutes" => "minute",
                    "Seconds" => "second",
                    _ => {
                        return Some(self.refuse(
                            "date:method",
                            format!("the date method `{method}`"),
                            call.span,
                        ));
                    }
                };
                let read = format!("{}{optional}.components({utc}).{member}", receiver.plain().receiver());
                match member {
                    "month" | "weekday" if m.optional => {
                        return Some(self.refuse("date:method", format!("`?.{method}()`"), call.span));
                    }
                    "month" | "weekday" => format!("({read} - 1)"),
                    _ => read,
                }
            }
            _ => {
                let need = match method {
                    "toLocaleDateString" => Need::Date,
                    "toLocaleTimeString" => Need::Time,
                    _ => Need::All,
                };
                let args = match self.date_format_args(need, call.arguments.first(), call.arguments.get(1)) {
                    Ok(args) => args,
                    Err(why) => return Some(self.refuse("intl:option", why, call.span)),
                };
                match receiver.kind {
                    _ if m.optional => format!("{}?.formatted({args})", receiver.receiver()),
                    DateKind::Valid => format!("{}.formatted({args})", receiver.receiver()),
                    // JS writes an Invalid Date as "Invalid Date"; Intl (FormatStyle) throws.
                    DateKind::MaybeInvalid => {
                        let r = receiver.receiver();
                        format!(
                            "({r}.millisecondsSince1970.isNaN ? \"Invalid Date\" : {r}.formatted({args}))"
                        )
                    }
                    DateKind::Optional => {
                        format!("({}?.formatted({args}) ?? \"Invalid Date\")", receiver.text)
                    }
                }
            }
        };
        Some(text)
    }

    /// `new Intl.DateTimeFormat(l, o).format(x)` in place, or `f.format(x)` of a named one.
    fn date_format_call(&mut self, call: &CallExpression) -> Option<String> {
        let Expression::StaticMemberExpression(m) = &call.callee else { return None };
        if m.property.name != "format" {
            return None;
        }
        let [arg] = call.arguments.as_slice() else { return None };
        let value = arg.as_expression()?;
        match m.object.without_parentheses() {
            Expression::NewExpression(n) if is_date_time_format(&n.callee) => {
                let args = self.date_format_args(Need::AnyDate, n.arguments.first(), n.arguments.get(1));
                Some(match args {
                    Ok(args) => {
                        let d = self.format_operand(value);
                        format!("{}.formatted({args})", d.receiver())
                    }
                    Err(why) => self.refuse("intl:option", why, n.span),
                })
            }
            Expression::Identifier(id)
                if self.src.contains(&format!("{} = new Intl.DateTimeFormat(", id.name)) =>
            {
                let f = self.expr(&m.object);
                let d = self.format_operand(value).value();
                Some(format!("{f}({d})"))
            }
            _ => None,
        }
    }

    /// What `Intl.DateTimeFormat`'s `format(x)` formats: a date (the Invalid Date throws, as
    /// Intl's does), or a number of milliseconds.
    fn format_operand(&mut self, value: &Expression) -> DateVal {
        if let Some(d) = self.date_val(value) {
            return d.plain();
        }
        if self.is_number_expr(value) || matches!(self.declared_type(value).as_deref(), Some("Float" | "Int"))
        {
            let ms = self.expr(value);
            return DateVal { text: format!("Date(millisecondsSince1970: {ms})"), kind: DateKind::Valid };
        }
        DateVal { text: self.expr(value), kind: DateKind::Valid }
    }

    /// `new Intl.DateTimeFormat(l, o)` as a value: a closure that formats a date.
    pub fn date_formatter(&mut self, n: &NewExpression) -> Option<String> {
        if !is_date_time_format(&n.callee) {
            return None;
        }
        let made = self
            .date_format_args(Need::AnyDate, n.arguments.first(), n.arguments.get(1))
            .map(|a| format!("{{ (date: Date) in date.formatted({a}) }}"));
        Some(made.unwrap_or_else(|why| self.refuse("intl:option", why, n.span)))
    }

    /// The arguments of a date's `formatted(…)` for `toLocale…String(locale, options)` and
    /// `Intl.DateTimeFormat(locale, options)`: the fields Intl shows, ECMA-402's defaults written
    /// out, then `locale:` and `timeZone:`.
    pub fn date_format_args(
        &mut self,
        need: Need,
        locale: Option<&Argument>,
        options: Option<&Argument>,
    ) -> Result<String, String> {
        let locale = self.locale_arg(locale)?;
        let options = self.options(options)?;
        let mut fields: Vec<(&str, String)> = Vec::new();
        let (mut date_style, mut time_style, mut time_zone) = (None, None, None);
        for (key, value) in &options {
            let key = key.as_str();
            if key == "timeZone" {
                time_zone = Some(self.expr(value));
                continue;
            }
            let Some(v) = string_value(value) else {
                return Err(format!("the date option `{key}` that is not a string literal"));
            };
            let style = match (key, v) {
                ("dateStyle", s) => {
                    date_style = Some(match s {
                        "full" => "complete",
                        "long" => "long",
                        "medium" => "abbreviated",
                        "short" => "numeric",
                        _ => return Err(format!("the date style `{s}`")),
                    });
                    continue;
                }
                ("timeStyle", s) => {
                    time_style = Some(match s {
                        "long" => "complete",
                        "medium" => "standard",
                        "short" => "shortened",
                        _ => return Err(format!("the time style `{s}`")),
                    });
                    continue;
                }
                ("month", "numeric") => ".defaultDigits",
                ("month", "2-digit") => ".twoDigits",
                ("month", "long") => ".wide",
                ("month", "short") => ".abbreviated",
                ("month", "narrow") => ".narrow",
                ("weekday", "long") => ".wide",
                ("weekday", "short") => ".abbreviated",
                ("weekday", "narrow") => ".narrow",
                ("year" | "day" | "hour" | "minute" | "second", "numeric") => "",
                ("year" | "day" | "hour" | "minute" | "second", "2-digit") => ".twoDigits",
                (key, v) => return Err(format!("the date option `{key}: '{v}'`")),
            };
            fields.push((key_static(key), style.to_string()));
        }
        let styled = date_style.is_some() || time_style.is_some();
        if styled && !fields.is_empty() {
            return Err("a date style with fields (Intl throws)".into());
        }
        if (need == Need::Date && time_style.is_some() && date_style.is_none())
            || (need == Need::Time && date_style.is_some() && time_style.is_none())
        {
            return Err("a style the method does not show (Intl throws)".into());
        }
        let has = |names: &[&str]| fields.iter().any(|(k, _)| names.contains(k));
        let date_fields = has(&["weekday", "year", "month", "day"]);
        let time_fields = has(&["hour", "minute", "second"]);
        let needs_defaults = !styled
            && match need {
                Need::Date => !date_fields,
                Need::Time => !time_fields,
                Need::All | Need::AnyDate => !date_fields && !time_fields,
            };
        if needs_defaults {
            if matches!(need, Need::Date | Need::All | Need::AnyDate) {
                fields.extend([
                    ("year", String::new()),
                    ("month", ".defaultDigits".into()),
                    ("day", String::new()),
                ]);
            }
            if matches!(need, Need::Time | Need::All) {
                fields.extend([
                    ("hour", String::new()),
                    ("minute", String::new()),
                    ("second", String::new()),
                ]);
            }
        }
        let mut args = Vec::new();
        if styled {
            args.push(format!("date: .{}", date_style.unwrap_or("omitted")));
            args.push(format!("time: .{}", time_style.unwrap_or("omitted")));
        } else {
            let chain: String = fields.iter().map(|(k, s)| format!(".{k}({s})")).collect();
            args.push(format!(".dateTime{chain}"));
        }
        args.extend(locale);
        if let Some(tz) = time_zone {
            args.push(format!("timeZone: {tz}"));
        }
        Ok(args.join(", "))
    }
}

fn key_static(key: &str) -> &'static str {
    match key {
        "year" => "year",
        "month" => "month",
        "day" => "day",
        "weekday" => "weekday",
        "hour" => "hour",
        "minute" => "minute",
        _ => "second",
    }
}

fn is_date_time_format(callee: &Expression) -> bool {
    let Expression::StaticMemberExpression(m) = callee.without_parentheses() else { return false };
    matches!(&m.object, Expression::Identifier(ns) if ns.name == "Intl")
        && m.property.name == "DateTimeFormat"
}
