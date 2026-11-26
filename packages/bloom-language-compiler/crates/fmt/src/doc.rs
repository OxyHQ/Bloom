//! A pretty-printing document and its printer: the Wadler/Prettier algorithm.
//!
//! A [`Doc::Group`] prints flat (its lines as spaces or nothing) when all of it,
//! and what follows it up to the next line break, fits in the width; otherwise
//! its own lines break. A hard line, or a [`Doc::BreakParent`] (a line comment),
//! never fits flat, so every group around one breaks.

use std::borrow::Cow;

#[derive(Debug, Clone)]
pub enum Doc {
    Nil,
    Text(Cow<'static, str>),
    /// A space when flat, a line break when broken.
    Line,
    /// Nothing when flat, a line break when broken.
    SoftLine,
    /// Always a line break.
    HardLine,
    /// An empty line (two breaks), never at the start of a block.
    BlankLine,
    /// Breaks every group around it (a `//` comment must end its line).
    BreakParent,
    Indent(Box<Doc>),
    Group(Box<Doc>),
    Concat(Vec<Doc>),
    /// `broken` in a broken group, `flat` in a flat one.
    IfBreak(Box<Doc>, Box<Doc>),
}

pub fn text(s: impl Into<Cow<'static, str>>) -> Doc {
    Doc::Text(s.into())
}

pub fn concat(parts: Vec<Doc>) -> Doc {
    Doc::Concat(parts)
}

pub fn group(doc: Doc) -> Doc {
    Doc::Group(Box::new(doc))
}

pub fn indent(doc: Doc) -> Doc {
    Doc::Indent(Box::new(doc))
}

pub fn if_break(broken: Doc, flat: Doc) -> Doc {
    Doc::IfBreak(Box::new(broken), Box::new(flat))
}

/// `parts` with `separator` between each two.
pub fn join(parts: Vec<Doc>, separator: impl Fn() -> Doc) -> Doc {
    let mut out = Vec::with_capacity(parts.len() * 2);
    for (index, part) in parts.into_iter().enumerate() {
        if index > 0 {
            out.push(separator());
        }
        out.push(part);
    }
    Doc::Concat(out)
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Mode {
    Flat,
    Break,
}

const INDENT: usize = 2;

/// Prints `doc` in `width` columns, two spaces per indent, with no trailing
/// whitespace on any line.
pub fn print(doc: &Doc, width: usize) -> String {
    let mut out = String::new();
    let mut column = 0usize;
    let mut stack: Vec<(usize, Mode, &Doc)> = vec![(0, Mode::Break, doc)];
    while let Some((level, mode, doc)) = stack.pop() {
        match doc {
            Doc::Nil | Doc::BreakParent => {}
            Doc::Text(s) => {
                out.push_str(s);
                column += s.chars().count();
            }
            Doc::Line | Doc::SoftLine if mode == Mode::Flat => {
                if matches!(doc, Doc::Line) {
                    out.push(' ');
                    column += 1;
                }
            }
            Doc::Line | Doc::SoftLine | Doc::HardLine => {
                newline(&mut out, level);
                column = level;
            }
            Doc::BlankLine => {
                trim_trailing(&mut out);
                out.push('\n');
                newline(&mut out, level);
                column = level;
            }
            Doc::Indent(inner) => stack.push((level + INDENT, mode, inner)),
            Doc::Group(inner) => {
                let flat = mode == Mode::Flat || fits(inner, &stack, width.saturating_sub(column));
                stack.push((level, if flat { Mode::Flat } else { Mode::Break }, inner));
            }
            Doc::Concat(parts) => stack.extend(parts.iter().rev().map(|part| (level, mode, part))),
            Doc::IfBreak(broken, flat) => {
                stack.push((level, mode, if mode == Mode::Break { broken } else { flat }))
            }
        }
    }
    trim_trailing(&mut out);
    out
}

fn newline(out: &mut String, level: usize) {
    trim_trailing(out);
    out.push('\n');
    out.extend(std::iter::repeat_n(' ', level));
}

fn trim_trailing(out: &mut String) {
    let kept = out.trim_end_matches(' ').len();
    out.truncate(kept);
}

/// Whether `doc`, flat, and then what follows it on its line, fit in `width`.
fn fits(doc: &Doc, rest: &[(usize, Mode, &Doc)], width: usize) -> bool {
    let mut remaining = width as isize;
    let mut stack: Vec<(Mode, &Doc)> = vec![(Mode::Flat, doc)];
    let mut rest = rest.iter().rev();
    loop {
        let Some((mode, doc)) = stack.pop() else {
            match rest.next() {
                Some(&(_, mode, doc)) => {
                    stack.push((mode, doc));
                    continue;
                }
                None => return true,
            }
        };
        match doc {
            Doc::Nil => {}
            Doc::Text(s) => {
                remaining -= s.chars().count() as isize;
                if remaining < 0 {
                    return false;
                }
            }
            Doc::Line | Doc::SoftLine => {
                if mode == Mode::Break {
                    return true;
                }
                if matches!(doc, Doc::Line) {
                    remaining -= 1;
                    if remaining < 0 {
                        return false;
                    }
                }
            }
            Doc::HardLine | Doc::BlankLine | Doc::BreakParent => return mode == Mode::Break,
            Doc::Indent(inner) | Doc::Group(inner) => stack.push((mode, inner)),
            Doc::Concat(parts) => stack.extend(parts.iter().rev().map(|part| (mode, part))),
            Doc::IfBreak(broken, flat) => stack.push((mode, if mode == Mode::Break { broken } else { flat })),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(items: &[&'static str]) -> Doc {
        group(concat(vec![
            text("f("),
            indent(concat(vec![
                Doc::SoftLine,
                join(items.iter().map(|s| text(*s)).collect(), || concat(vec![text(","), Doc::Line])),
                if_break(text(","), Doc::Nil),
            ])),
            Doc::SoftLine,
            text(")"),
        ]))
    }

    #[test]
    fn a_group_that_fits_stays_flat() {
        assert_eq!(print(&args(&["a", "b"]), 20), "f(a, b)");
    }

    #[test]
    fn a_group_that_does_not_fit_breaks_with_a_trailing_comma() {
        assert_eq!(print(&args(&["alpha", "beta"]), 10), "f(\n  alpha,\n  beta,\n)");
    }

    #[test]
    fn a_break_parent_breaks_the_group_around_it() {
        let doc = group(concat(vec![text("a"), Doc::Line, Doc::BreakParent, text("b")]));
        assert_eq!(print(&doc, 80), "a\nb");
    }
}
