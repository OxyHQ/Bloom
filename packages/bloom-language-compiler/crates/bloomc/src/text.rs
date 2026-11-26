//! Positions in a text as editors, `tsc` and source maps count them: 0-based
//! lines and UTF-16 columns, to and from byte offsets.

/// The 0-based line and UTF-16 column of a byte offset.
pub fn position(text: &str, offset: u32) -> (u32, u32) {
    let offset = (offset as usize).min(text.len());
    let before = &text[..offset];
    let line = before.matches('\n').count() as u32;
    let start = before.rfind('\n').map_or(0, |i| i + 1);
    let column: usize = text[start..offset].chars().map(char::len_utf16).sum();
    (line, column as u32)
}

/// The byte offset of a 0-based line and UTF-16 column (clamped to its line).
pub fn offset(text: &str, line: u32, column: u32) -> u32 {
    let start = if line == 0 {
        0
    } else {
        text.match_indices('\n').nth(line as usize - 1).map_or(text.len(), |(i, _)| i + 1)
    };
    let mut units = 0;
    for (index, c) in text[start..].char_indices() {
        if units >= column as usize || c == '\n' {
            return (start + index) as u32;
        }
        units += c.len_utf16();
    }
    text.len() as u32
}

/// The identifier (letters, digits, `_`, `$`) around `offset`: the one that
/// starts at, contains or ends at it (empty between two non-word characters).
pub fn word_at(text: &str, offset: u32) -> (u32, u32) {
    let offset = (offset as usize).min(text.len());
    let is_word = |c: char| c.is_alphanumeric() || c == '_' || c == '$';
    let start = text[..offset]
        .char_indices()
        .rev()
        .take_while(|&(_, c)| is_word(c))
        .last()
        .map_or(offset, |(i, _)| i);
    let end =
        text[offset..].char_indices().find(|&(_, c)| !is_word(c)).map_or(text.len(), |(i, _)| offset + i);
    (start as u32, end as u32)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn positions_count_utf16_units() {
        let text = "a\n😀b";
        assert_eq!(position(text, 6), (1, 2));
        assert_eq!(offset(text, 1, 2), 6);
        assert_eq!(offset(text, 0, 9), 1);
    }

    #[test]
    fn a_word_is_found_from_inside_it() {
        assert_eq!(word_at("let draft = x", 6), (4, 9));
        assert_eq!(word_at("a.b", 1), (0, 1));
        assert_eq!(word_at("a. b", 2), (2, 2));
    }
}
