//! `Embed(…)`: the boundary to React disappears where `.bloom` has the same
//! thing. A TS component is a node with its props by name (spec 7.2), which
//! bloomc compiles back to `Embed(jsx(C, props))`; an embedded tree
//! (`Embed(<>{toElement(x)}</>)`) is the tree itself; a render-prop
//! (`Embed((render) => <Link …>{render(x)}</Link>)`) is the component with `x`
//! as its builder, compiled to the same render-prop.

use oxc_ast::ast::{
    Argument, BindingPattern, CallExpression, Expression, JSXAttributeItem, JSXAttributeName,
    JSXAttributeValue, JSXChild, JSXElement, JSXElementName, JSXExpression, JSXMemberExpressionObject,
};
use oxc_span::GetSpan;

use crate::module::Tr;

impl Tr<'_> {
    pub fn embed(&mut self, call: &CallExpression) -> String {
        let [arg] = call.arguments.as_slice() else {
            return self.refuse("embed:arity", "`Embed` with other than one argument", call.span);
        };
        match arg {
            Argument::JSXElement(el) => self.component(el),
            Argument::JSXFragment(fragment) => {
                let children: Vec<&JSXChild> = fragment.children.iter().filter(|c| !is_blank(c)).collect();
                match children.as_slice() {
                    [JSXChild::ExpressionContainer(c)] => match self.to_element_arg(&c.expression) {
                        Some(inner) => self.expr(inner),
                        None => self.refuse(
                            "embed:fragment",
                            "an `Embed` fragment that is not one `toElement(…)`",
                            fragment.span,
                        ),
                    },
                    _ => self.refuse(
                        "embed:fragment",
                        "an `Embed` fragment that is not one `toElement(…)`",
                        fragment.span,
                    ),
                }
            }
            Argument::ArrowFunctionExpression(arrow) => {
                let param = match arrow.params.items.as_slice() {
                    [p] => match &p.pattern {
                        BindingPattern::BindingIdentifier(id) => Some(id.name.to_string()),
                        _ => None,
                    },
                    _ => None,
                };
                let (Some(param), Some(Expression::JSXElement(el))) =
                    (param, arrow.get_expression().map(|e| e.without_parentheses()))
                else {
                    return self.refuse(
                        "embed:render",
                        "an `Embed` render function that is not one element",
                        arrow.span,
                    );
                };
                let saved = self.scope.render.replace(param);
                let out = self.component(el);
                self.scope.render = saved;
                out
            }
            other => {
                // A TS value that is already a React node: it stays embedded.
                let value = self.expr(other.to_expression());
                format!("{}({value})", self.name("Embed", call.callee.span()))
            }
        }
    }

    /// `toElement(x)` (or the render prop's `render(x)`): `x`.
    fn to_element_arg<'a>(&self, e: &'a JSXExpression<'a>) -> Option<&'a Expression<'a>> {
        let Some(Expression::CallExpression(call)) = e.as_expression() else { return None };
        let Expression::Identifier(id) = &call.callee else { return None };
        let renders =
            self.is_lang(&id.name, "toElement") || self.scope.render.as_deref() == Some(id.name.as_str());
        match call.arguments.as_slice() {
            [arg] if renders => arg.as_expression(),
            _ => None,
        }
    }

    /// `<C a={x} b>…</C>` as `C(a: x, b: true) { … }`.
    fn component(&mut self, el: &JSXElement) -> String {
        let name = match &el.opening_element.name {
            JSXElementName::IdentifierReference(id) => self.name(&id.name, id.span),
            JSXElementName::MemberExpression(m) => {
                let mut parts = vec![m.property.name.to_string()];
                let mut object = &m.object;
                loop {
                    match object {
                        JSXMemberExpressionObject::IdentifierReference(id) => {
                            parts.push(self.name(&id.name, id.span));
                            break;
                        }
                        JSXMemberExpressionObject::MemberExpression(inner) => {
                            parts.push(inner.property.name.to_string());
                            object = &inner.object;
                        }
                        JSXMemberExpressionObject::ThisExpression(t) => {
                            return self.refuse("class", "`this` in JSX", t.span);
                        }
                    }
                }
                parts.reverse();
                parts.join(".")
            }
            JSXElementName::Identifier(id) => {
                return self.refuse("jsx:host", format!("the host element `<{}>`", id.name), id.span);
            }
            other => return self.refuse("jsx:name", "a namespaced JSX name", other.span()),
        };
        if el.opening_element.type_arguments.is_some() {
            return self.refuse("ts:type-arguments", "type arguments on a JSX element", el.span);
        }
        let mut props = Vec::new();
        for attribute in &el.opening_element.attributes {
            let note = self.note(attribute.span().start);
            match attribute {
                JSXAttributeItem::SpreadAttribute(s) => {
                    props.push(self.refuse("jsx:spread", "spread props `{...p}`", s.span));
                }
                JSXAttributeItem::Attribute(a) => {
                    let JSXAttributeName::Identifier(key) = &a.name else {
                        props.push(self.refuse("jsx:name", "a namespaced prop", a.span));
                        continue;
                    };
                    if key.name == "key" {
                        props.push(self.refuse("jsx:key", "a JSX `key` (use `.id(…)`)", a.span));
                        continue;
                    }
                    let value = match &a.value {
                        None => "true".to_string(),
                        Some(JSXAttributeValue::StringLiteral(s)) => {
                            crate::expr::quote(s.value.as_str().unwrap_or_default())
                        }
                        Some(JSXAttributeValue::ExpressionContainer(c)) => match c.expression.as_expression()
                        {
                            Some(e) => self.prop_value(e),
                            None => self.refuse("jsx:empty", "an empty prop expression", c.span),
                        },
                        Some(other) => self.refuse("jsx:element-prop", "an element as a prop", other.span()),
                    };
                    props.push(format!("{note}{}: {value}", key.name));
                }
            }
        }
        let mut lines = Vec::new();
        for child in &el.children {
            if is_blank(child) {
                continue;
            }
            let line = match child {
                JSXChild::ExpressionContainer(c) => match self.to_element_arg(&c.expression) {
                    Some(inner) => self.expr(inner),
                    None => {
                        self.refuse("jsx:child", "a JSX child expression that is not `toElement(…)`", c.span)
                    }
                },
                JSXChild::Element(inner) => self.component(inner),
                JSXChild::Text(t) => self.refuse("jsx:text", "text inside a TS component", t.span),
                other => self.refuse("jsx:child", "a fragment or spread inside a TS component", other.span()),
            };
            lines.push(line);
        }
        let head = format!("{name}({})", props.join(", "));
        if lines.is_empty() { head } else { format!("{head} {{\n{}\n}}", lines.join("\n")) }
    }

    /// A prop: a JSX element there is a component node too.
    fn prop_value(&mut self, e: &Expression) -> String {
        match e.without_parentheses() {
            Expression::JSXElement(el) => {
                self.refuse("jsx:element-prop", "an element passed as a prop", el.span)
            }
            other => self.expr(other),
        }
    }
}

fn is_blank(child: &JSXChild) -> bool {
    match child {
        JSXChild::Text(t) => t.value.trim().is_empty(),
        JSXChild::ExpressionContainer(c) => matches!(c.expression, JSXExpression::EmptyExpression(_)),
        _ => false,
    }
}
