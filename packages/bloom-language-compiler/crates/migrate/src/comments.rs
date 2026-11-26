//! The `.tsx` file's comments, carried into the `.bloom` file in order.
//!
//! A comment is written at the next place a `.bloom` line may start (an item,
//! a member, a statement, a builder line, a modifier, an argument), so none is
//! lost and none lands where a newline would end an expression. Directives for
//! TypeScript and the linters mean nothing in `.bloom` and are dropped.

use oxc_ast::Comment;

pub struct Comments {
    /// (start, end, is JSDoc, text without delimiters)
    items: Vec<(u32, u32, bool, String)>,
    next: usize,
}

const DIRECTIVES: &[&str] = &["eslint-disable", "eslint-enable", "@ts-", "biome-ignore", "prettier-ignore"];

impl Comments {
    pub fn new(source: &str, comments: &[Comment]) -> Self {
        let mut items = Vec::new();
        for comment in comments {
            let text = &source[comment.content_span().start as usize..comment.content_span().end as usize];
            if DIRECTIVES.iter().any(|d| text.trim_start().starts_with(d)) {
                continue;
            }
            items.push((comment.span.start, comment.span.end, comment.is_jsdoc(), text.to_string()));
        }
        Self { items, next: 0 }
    }

    /// Every comment not yet written that starts before `pos`, as `.bloom`
    /// comment lines each ending in a newline; `doc` writes JSDoc as `///`.
    pub fn before(&mut self, pos: u32, doc: bool) -> String {
        let mut out = String::new();
        while let Some((start, _, jsdoc, text)) = self.items.get(self.next) {
            if *start >= pos {
                break;
            }
            // Only the JSDoc block directly above the item documents it.
            let last = self.items.get(self.next + 1).is_none_or(|(s, ..)| *s >= pos);
            let prefix = if doc && *jsdoc && last { "///" } else { "//" };
            for line in lines(text, *jsdoc) {
                if line.is_empty() {
                    out.push_str(prefix);
                } else {
                    out.push_str(prefix);
                    out.push(' ');
                    out.push_str(&line);
                }
                out.push('\n');
            }
            self.next += 1;
        }
        out
    }

    /// Skips the comments inside `[start, end)` that a dropped construct held
    /// (a `useCallback` dependency list): they described what is gone.
    pub fn skip_within(&mut self, start: u32, end: u32) {
        while let Some((s, e, ..)) = self.items.get(self.next) {
            if *s >= start && *e <= end {
                self.next += 1;
            } else {
                break;
            }
        }
    }

    /// Whatever is left, for the end of the file.
    pub fn rest(&mut self) -> String {
        self.before(u32::MAX, false)
    }
}

/// A comment's lines without the block's ` * ` gutter and its blank edges.
fn lines(text: &str, block_gutter: bool) -> Vec<String> {
    let mut out: Vec<String> = text
        .lines()
        .map(|line| {
            let line = line.trim_end();
            let gutter = line.trim_start();
            let line = if block_gutter || gutter.starts_with('*') {
                gutter.strip_prefix('*').unwrap_or(gutter)
            } else {
                line
            };
            line.strip_prefix(' ').unwrap_or(line).to_string()
        })
        .collect();
    while out.first().is_some_and(String::is_empty) {
        out.remove(0);
    }
    while out.last().is_some_and(String::is_empty) {
        out.pop();
    }
    if out.is_empty() {
        out.push(String::new());
    }
    out
}
