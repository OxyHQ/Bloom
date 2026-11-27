// The external scanner of Bloom, the language by Oxy.
//
// It decides what the grammar cannot: whether a line break ends a statement (the rules of
// `fold_newlines` in packages/bloom-language-compiler/crates/lang/src/lexer.rs), nested block
// comments, string bodies, and a `?` written against its operand (`f()?`, `T?`, `try?`) as
// opposed to a conditional's `c ? a : b`.

#include "tree_sitter/parser.h"

#include <stdbool.h>
#include <stdint.h>

enum TokenType {
  SEMI,
  BLOCK_COMMENT,
  IMMEDIATE_QUESTION,
  STRING_CONTENT,
  RAW_STRING_CONTENT,
  ERROR_SENTINEL,
};

void *tree_sitter_bloom_external_scanner_create(void) { return NULL; }

void tree_sitter_bloom_external_scanner_destroy(void *payload) { (void)payload; }

unsigned tree_sitter_bloom_external_scanner_serialize(void *payload, char *buffer) {
  (void)payload;
  (void)buffer;
  return 0;
}

void tree_sitter_bloom_external_scanner_deserialize(void *payload, const char *buffer,
                                                     unsigned length) {
  (void)payload;
  (void)buffer;
  (void)length;
}

static inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

static inline bool is_word_char(int32_t c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_';
}

static inline bool is_space(int32_t c) { return c == ' ' || c == '\t' || c == '\r' || c == '\f'; }

// The rest of a `/* … */` comment after its `/*`, nesting as the lexer does.
static void finish_block_comment(TSLexer *lexer) {
  unsigned depth = 1;
  while (depth > 0 && !lexer->eof(lexer)) {
    if (lexer->lookahead == '/') {
      advance(lexer);
      if (lexer->lookahead == '*') {
        advance(lexer);
        depth++;
      }
    } else if (lexer->lookahead == '*') {
      advance(lexer);
      if (lexer->lookahead == '/') {
        advance(lexer);
        depth--;
      }
    } else {
      advance(lexer);
    }
  }
}

// Whether the rest of the word at the lexer is `word` (and the word ends there).
static bool word_follows(TSLexer *lexer, const char *word) {
  for (const char *c = word; *c; c++) {
    if (lexer->lookahead != *c) return false;
    advance(lexer);
  }
  return !is_word_char(lexer->lookahead);
}

// After a line break: whether the next line continues the expression (lexer.rs's
// `continues_before`: a `.` member or modifier, or a binary operator other than `-`), or is
// the `else` / `catch` of the construct the previous line closed. The lexer is past the break
// and every blank or comment-only line after it; nothing it reads here is part of a token.
static bool next_line_continues(TSLexer *lexer) {
  switch (lexer->lookahead) {
    case '.':
      advance(lexer);
      // `..`, `..<` and `...` (a spread, a range) start a line of their own.
      return lexer->lookahead != '.';
    case '?':
    case '%':
    case '<':
    case '>':
    case ':':
      return true;
    case '&':
      advance(lexer);
      return lexer->lookahead == '&';
    case '|':
      advance(lexer);
      return lexer->lookahead == '|';
    case '+':
    case '*':
      advance(lexer);
      // `+=` and `*=` start an assignment of their own.
      return lexer->lookahead != '=';
    case '/':
      // Comments were skipped already, so a `/` here is a division.
      return true;
    case '=':
      advance(lexer);
      return lexer->lookahead == '=';
    case '!':
      advance(lexer);
      return lexer->lookahead == '=';
    case 'e':
      return word_follows(lexer, "else");
    case 'c':
      return word_follows(lexer, "catch");
    default:
      return false;
  }
}

// A line break the grammar can end a line with: `_semi`, spanning the break and the blank
// lines after it, unless the next line continues the expression.
static bool scan_semi(TSLexer *lexer) {
  // The break itself.
  advance(lexer);
  lexer->mark_end(lexer);
  // Blank lines join the semi; from the first comment on, the rest is lookahead only.
  bool marking = true;
  bool saw_line_comment = false;
  for (;;) {
    if (lexer->eof(lexer)) {
      lexer->result_symbol = SEMI;
      return true;
    }
    int32_t c = lexer->lookahead;
    if (is_space(c)) {
      advance(lexer);
    } else if (c == '\n') {
      advance(lexer);
      if (marking && !saw_line_comment) lexer->mark_end(lexer);
    } else if (c == '/') {
      // A comment-only line counts as blank; the comment stays an extra of its own.
      advance(lexer);
      if (lexer->lookahead == '/') {
        saw_line_comment = true;
        while (!lexer->eof(lexer) && lexer->lookahead != '\n') advance(lexer);
      } else if (lexer->lookahead == '*') {
        // `marking` stays false from here: the semi ends before the comment.
        marking = false;
        advance(lexer);
        finish_block_comment(lexer);
      } else {
        // A division at the start of the line continues it.
        return false;
      }
    } else {
      break;
    }
  }
  // A continuation after a block comment still ends the line: the comment is an extra the
  // internal lexer cannot skip, so `false` here would leave it unread. (Rare: a modifier
  // chain broken by a `/* … */` line.)
  if (next_line_continues(lexer) && marking) return false;
  lexer->result_symbol = SEMI;
  return true;
}

// A string's text up to its end, an escape or an interpolation (`\(`, `${`).
static bool scan_string_content(TSLexer *lexer, bool raw) {
  bool has_content = false;
  for (;;) {
    lexer->mark_end(lexer);
    if (lexer->eof(lexer)) break;
    int32_t c = lexer->lookahead;
    if (c == '\\') break;
    if (!raw && (c == '"' || c == '\n')) break;
    if (raw && c == '"') {
      advance(lexer);
      if (lexer->lookahead == '"') {
        advance(lexer);
        if (lexer->lookahead == '"') break;
      }
      has_content = true;
      continue;
    }
    if (c == '$') {
      advance(lexer);
      if (lexer->lookahead == '{') break;
      has_content = true;
      continue;
    }
    advance(lexer);
    has_content = true;
  }
  if (!has_content) return false;
  lexer->result_symbol = raw ? RAW_STRING_CONTENT : STRING_CONTENT;
  return true;
}

bool tree_sitter_bloom_external_scanner_scan(void *payload, TSLexer *lexer,
                                             const bool *valid_symbols) {
  (void)payload;
  bool recovering = valid_symbols[ERROR_SENTINEL];

  if (!recovering) {
    if (valid_symbols[STRING_CONTENT]) return scan_string_content(lexer, false);
    if (valid_symbols[RAW_STRING_CONTENT]) return scan_string_content(lexer, true);

    // `?` against its operand: not `??`, `?.` (a member read through an optional) or a
    // conditional's `?` (which has a space before it).
    if (valid_symbols[IMMEDIATE_QUESTION] && lexer->lookahead == '?') {
      advance(lexer);
      if (lexer->lookahead != '?' && lexer->lookahead != '.') {
        lexer->mark_end(lexer);
        lexer->result_symbol = IMMEDIATE_QUESTION;
        return true;
      }
      return false;
    }
  }

  bool semi = !recovering && valid_symbols[SEMI];
  // Where no line can end, a line break is whitespace; skipped here, so that a block comment
  // after it is still this scanner's to read.
  while (is_space(lexer->lookahead) || (!semi && lexer->lookahead == '\n')) skip(lexer);

  if (semi && lexer->lookahead == '\n') return scan_semi(lexer);

  if (lexer->lookahead == '/') {
    advance(lexer);
    if (lexer->lookahead != '*') return false;
    advance(lexer);
    finish_block_comment(lexer);
    lexer->mark_end(lexer);
    lexer->result_symbol = BLOCK_COMMENT;
    return true;
  }

  return false;
}
