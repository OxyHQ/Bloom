//! A TS module that draws a migrated view as JSX (`<PostItem post={p} />`): a view is a node
//! factory, not a React component, so `--write` draws it as `toElement(PostItem({ post: p }))`
//! (a `key` is `toElement`'s second argument), importing `toElement` when the module does not.

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    JSXAttributeItem, JSXAttributeName, JSXAttributeValue, JSXChild, JSXElement, JSXElementName,
};
use oxc_ast_visit::Visit;
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType, Span};

const LANGUAGE: &str = "@oxy.so/bloom-language";

/// `source` with each childless `<Name …/>` of `names` drawn as a node, or `None` when it
/// draws none (or one it cannot: children, a namespaced attribute).
pub fn draw_views_as_nodes(source: &str, filename: &str, names: &[String]) -> Option<String> {
    // A view drawn inside another's children is drawn first; the outer one on the next pass.
    let mut out = draw_pass(source, filename, names)?;
    for _ in 0..4 {
        match draw_pass(&out, filename, names) {
            Some(next) if next != out => out = next,
            _ => break,
        }
    }
    Some(out)
}

fn draw_pass(source: &str, filename: &str, names: &[String]) -> Option<String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(filename).unwrap_or_else(|_| SourceType::tsx());
    let parsed = Parser::new(&allocator, source, source_type).parse();
    if parsed.diagnostics.has_errors() {
        return None;
    }
    struct Finder<'s, 'n> {
        source: &'s str,
        names: &'n [String],
        /// (span, replacement), outermost first.
        edits: Vec<(Span, String)>,
        /// A JSX child: the node is written in braces.
        in_children: bool,
    }
    impl Finder<'_, '_> {
        /// Whether a migrated view is drawn among `children`, at any depth.
        fn has_view(&self, children: &[JSXChild]) -> bool {
            struct Any<'n>(&'n [String], bool);
            impl<'a> Visit<'a> for Any<'_> {
                fn visit_jsx_element(&mut self, e: &JSXElement<'a>) {
                    if let JSXElementName::IdentifierReference(id) = &e.opening_element.name
                        && self.0.iter().any(|n| n == id.name.as_str())
                    {
                        self.1 = true;
                    }
                    oxc_ast_visit::walk::walk_jsx_element(self, e);
                }
            }
            let mut any = Any(self.names, false);
            for child in children {
                any.visit_jsx_child(child);
            }
            any.1
        }
        fn text(&self, span: Span) -> &str {
            &self.source[span.start as usize..span.end as usize]
        }
        fn node(&self, e: &JSXElement) -> Option<String> {
            let JSXElementName::IdentifierReference(id) = &e.opening_element.name else { return None };
            if !self.names.iter().any(|n| n == id.name.as_str()) {
                return None;
            }
            let mut fields = Vec::new();
            // Children are the view's `children` prop (one as itself, several as a fragment), once
            // no migrated view is left among them (an inner one is drawn first, a pass before).
            let drawn: Vec<&JSXChild> = e
                .children
                .iter()
                .filter(|c| !matches!(c, JSXChild::Text(t) if t.value.trim().is_empty()))
                .collect();
            if !drawn.is_empty() {
                if self.has_view(&e.children) {
                    return None;
                }
                let children = match drawn.as_slice() {
                    [JSXChild::ExpressionContainer(c)] => {
                        self.text(c.expression.as_expression()?.span()).to_string()
                    }
                    [JSXChild::Element(child)] => self.text(child.span).to_string(),
                    _ => {
                        let inner = &self.source[e.opening_element.span.end as usize
                            ..e.closing_element.as_ref()?.span.start as usize];
                        format!("<>{inner}</>")
                    }
                };
                fields.push(format!("children: {children}"));
            }
            let mut key = None;
            for attribute in &e.opening_element.attributes {
                match attribute {
                    JSXAttributeItem::SpreadAttribute(s) => {
                        fields.push(format!("...{}", self.text(s.argument.span())))
                    }
                    JSXAttributeItem::Attribute(a) => {
                        let JSXAttributeName::Identifier(name) = &a.name else { return None };
                        let value = match &a.value {
                            None => "true".to_string(),
                            Some(JSXAttributeValue::StringLiteral(s)) => self.text(s.span).to_string(),
                            Some(JSXAttributeValue::ExpressionContainer(c)) => {
                                let e = c.expression.as_expression()?;
                                self.text(e.span()).to_string()
                            }
                            Some(_) => return None,
                        };
                        if name.name == "key" {
                            key = Some(value);
                        } else if value == name.name.as_str() {
                            fields.push(value);
                        } else {
                            fields.push(format!("{}: {value}", name.name));
                        }
                    }
                }
            }
            let props =
                if fields.is_empty() { String::new() } else { format!("{{ {} }}", fields.join(", ")) };
            let key = key.map(|k| format!(", {k}")).unwrap_or_default();
            Some(format!("toElement({}({props}){key})", id.name))
        }
    }
    impl<'a> Visit<'a> for Finder<'_, '_> {
        fn visit_jsx_element(&mut self, e: &JSXElement<'a>) {
            if let Some(node) = self.node(e) {
                let node = if self.in_children { format!("{{{node}}}") } else { node };
                self.edits.push((e.span, node));
                return;
            }
            self.visit_jsx_opening_element(&e.opening_element);
            for child in &e.children {
                self.visit_jsx_child(child);
            }
        }
        fn visit_jsx_child(&mut self, child: &JSXChild<'a>) {
            let in_children = std::mem::replace(&mut self.in_children, matches!(child, JSXChild::Element(_)));
            oxc_ast_visit::walk::walk_jsx_child(self, child);
            self.in_children = in_children;
        }
        fn visit_jsx_expression_container(&mut self, c: &oxc_ast::ast::JSXExpressionContainer<'a>) {
            let in_children = std::mem::replace(&mut self.in_children, false);
            oxc_ast_visit::walk::walk_jsx_expression_container(self, c);
            self.in_children = in_children;
        }
    }
    let mut finder = Finder { source, names, edits: Vec::new(), in_children: false };
    finder.visit_program(&parsed.program);
    if finder.edits.is_empty() {
        return None;
    }
    let mut out = source.to_string();
    let mut edits = finder.edits;
    edits.sort_by_key(|(span, _)| std::cmp::Reverse(span.start));
    for (span, text) in edits {
        out.replace_range(span.start as usize..span.end as usize, &text);
    }
    Some(import_to_element(&out, &parsed.program))
}

/// `source` (a TS module at `filename`) importing `toElement` from the language, if it does not.
pub fn with_to_element(source: &str, filename: &str) -> Option<String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(filename).unwrap_or_else(|_| SourceType::tsx());
    let parsed = Parser::new(&allocator, source, source_type).parse();
    if parsed.diagnostics.has_errors() {
        return None;
    }
    Some(import_to_element(source, &parsed.program))
}

/// `source` importing `toElement` from the language (beside its other names when it already
/// imports from it). `program` is the module before the edits, whose imports come first.
fn import_to_element(source: &str, program: &oxc_ast::ast::Program) -> String {
    // Any of the module's imports may name it already (PostDetailScreen imports the language twice).
    let imports_it = program.body.iter().any(|statement| {
        let oxc_ast::ast::Statement::ImportDeclaration(import) = statement else { return false };
        import.source.value.as_str() == Some(LANGUAGE)
            && !import.import_kind.is_type()
            && import.specifiers.iter().flatten().any(|s| {
                matches!(s, oxc_ast::ast::ImportDeclarationSpecifier::ImportSpecifier(i) if i.local.name == "toElement")
            })
    });
    if imports_it {
        return source.to_string();
    }
    let mut last_import_end = 0;
    for statement in &program.body {
        let oxc_ast::ast::Statement::ImportDeclaration(import) = statement else { continue };
        last_import_end = import.span.end as usize;
        if import.source.value.as_str() != Some(LANGUAGE) || import.import_kind.is_type() {
            continue;
        }
        let specifiers: &[oxc_ast::ast::ImportDeclarationSpecifier] = match &import.specifiers {
            Some(s) => s,
            None => &[],
        };
        let named = |n: &str| {
            specifiers.iter().any(|s| matches!(s, oxc_ast::ast::ImportDeclarationSpecifier::ImportSpecifier(i) if i.local.name == n))
        };
        if named("toElement") {
            return source.to_string();
        }
        // `import { a, b } from '…'`: `toElement` after the last name.
        if let Some(last) = specifiers.last()
            && matches!(last, oxc_ast::ast::ImportDeclarationSpecifier::ImportSpecifier(_))
        {
            let at = last.span().end as usize;
            let mut out = source.to_string();
            out.insert_str(at, ", toElement");
            return out;
        }
    }
    let mut out = source.to_string();
    out.insert_str(last_import_end, &format!("\nimport {{ toElement }} from '{LANGUAGE}';"));
    out
}
