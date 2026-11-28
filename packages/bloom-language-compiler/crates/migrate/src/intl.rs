//! JS's locale formatting as the standard library's FormatStyle (#1065, Swift's shapes over
//! `Intl`, byte-identical output):
//!
//! - `n.toLocaleString()` is `n.formatted(fractionDigits: 0...3)`, and `new Intl.NumberFormat(l,
//!   { maximumFractionDigits: 1 })` formats as `formatted(fractionDigits: 0...1, locale: l)`; a
//!   currency style is `formatted(currency: c, locale: l)`.
//!
//! A formatter object (`const number = new Intl.NumberFormat(…)`) is a closure, and its
//! `number.format(x)` a call of it. An option with no FormatStyle form is refused.
//!
//! Dates are `crate::dates`'s (`toLocaleDateString`, `Intl.DateTimeFormat`).

use oxc_ast::ast::*;
use oxc_span::GetSpan;

use crate::module::Tr;

fn string_value<'b>(e: &'b Expression) -> Option<&'b str> {
    match e.without_parentheses() {
        Expression::StringLiteral(s) => s.value.as_str(),
        _ => None,
    }
}

impl Tr<'_> {
    /// `locale: l` of a TS locale argument, or nothing for `undefined`/`'default'`/none.
    pub fn locale_arg(&mut self, locale: Option<&Argument>) -> Result<Option<String>, String> {
        let Some(arg) = locale else { return Ok(None) };
        let Some(e) = arg.as_expression() else { return Err("a spread locale".into()) };
        match e.without_parentheses() {
            Expression::Identifier(id) if id.name == "undefined" => Ok(None),
            e if string_value(e) == Some("default") => Ok(None),
            Expression::ArrayExpression(_) => Err("a list of locales".into()),
            e => Ok(Some(format!("locale: {}", self.expr(e)))),
        }
    }

    pub fn options<'b, 'a>(
        &self,
        options: Option<&'b Argument<'a>>,
    ) -> Result<Vec<(String, &'b Expression<'a>)>, String> {
        let Some(arg) = options else { return Ok(Vec::new()) };
        let Some(Expression::ObjectExpression(o)) = arg.as_expression().map(|e| e.without_parentheses())
        else {
            return Err("options that are not an object literal".into());
        };
        let mut out = Vec::new();
        for p in &o.properties {
            let ObjectPropertyKind::ObjectProperty(p) = p else { return Err("spread options".into()) };
            let Some(key) = crate::view::key_name(&p.key) else { return Err("a computed option".into()) };
            out.push((key, &p.value));
        }
        Ok(out)
    }

    /// The arguments of a number's `formatted(…)` for `Intl.NumberFormat(locale, options)` /
    /// `toLocaleString(locale, options)`.
    pub fn number_format_args(
        &mut self,
        locale: Option<&Argument>,
        options: Option<&Argument>,
    ) -> Result<String, String> {
        let locale = self.locale_arg(locale)?;
        let options = self.options(options)?;
        let (mut min, mut max, mut currency) = (None, None, None);
        for (key, value) in &options {
            match key.as_str() {
                "maximumFractionDigits" => max = Some(self.expr(value)),
                "minimumFractionDigits" => min = Some(self.expr(value)),
                "style" => match string_value(value) {
                    Some("currency") => {}
                    Some("decimal") => {}
                    _ => return Err(format!("the number style `{}`", self.slice(value.span()))),
                },
                "currency" => currency = Some(self.expr(value)),
                other => return Err(format!("the number option `{other}`")),
            }
        }
        let style_currency = options.iter().any(|(k, v)| k == "style" && string_value(v) == Some("currency"));
        if style_currency != currency.is_some() {
            return Err("a currency without the currency style".into());
        }
        let mut args = Vec::new();
        match (min, max) {
            (None, None) if currency.is_none() => args.push("fractionDigits: 0...3".to_string()),
            (None, None) => {}
            (min, Some(max)) => {
                args.push(format!("fractionDigits: {}...{max}", min.unwrap_or_else(|| "0".into())))
            }
            // Intl's maximum is at least the minimum and 3.
            (Some(_), None) => return Err("a minimum of fraction digits alone".into()),
        }
        if let Some(c) = currency {
            args.push(format!("currency: {c}"));
        }
        args.extend(locale);
        Ok(args.join(", "))
    }

    /// `new Intl.NumberFormat(…)` as a value: a closure that formats.
    pub fn intl_formatter(&mut self, n: &NewExpression) -> Option<String> {
        let kind = intl_kind(&n.callee)?;
        let (locale, options) = (n.arguments.first(), n.arguments.get(1));
        if kind != "NumberFormat" {
            return None;
        }
        let made = self
            .number_format_args(locale, options)
            .map(|a| format!("{{ (value: Float) in value.formatted({a}) }}"));
        Some(made.unwrap_or_else(|why| self.refuse("intl:option", why, n.span)))
    }

    /// `new Intl.NumberFormat(…).format(x)` in place: `x.formatted(…)`.
    pub fn intl_format_call(&mut self, call: &CallExpression) -> Option<String> {
        let Expression::StaticMemberExpression(m) = &call.callee else { return None };
        if m.property.name != "format" {
            return None;
        }
        let Expression::NewExpression(n) = m.object.without_parentheses() else { return None };
        let kind = intl_kind(&n.callee)?;
        let [arg] = call.arguments.as_slice() else { return None };
        let value = arg.as_expression()?;
        let (locale, options) = (n.arguments.first(), n.arguments.get(1));
        if kind != "NumberFormat" {
            return None;
        }
        let args = self.number_format_args(locale, options);
        Some(match args {
            Ok(args) => {
                let v = self.expr(value);
                let v = if crate::expr::is_postfix_text(&v) { v } else { format!("({v})") };
                format!("{v}.formatted({args})")
            }
            Err(why) => self.refuse("intl:option", why, n.span),
        })
    }
}

/// `Intl.NumberFormat` / `Intl.DateTimeFormat`: which.
fn intl_kind<'b>(callee: &'b Expression) -> Option<&'b str> {
    let Expression::StaticMemberExpression(m) = callee.without_parentheses() else { return None };
    let Expression::Identifier(ns) = &m.object else { return None };
    (ns.name == "Intl" && matches!(m.property.name.as_str(), "NumberFormat" | "DateTimeFormat"))
        .then_some(m.property.name.as_str())
}
