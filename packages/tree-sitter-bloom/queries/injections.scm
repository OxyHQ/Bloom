; Bloom, the language by Oxy: injections.

; TODO/FIXME/NOTE markers in comments.
([
  (comment)
  (block_comment)
] @injection.content
  (#set! injection.language "comment"))

; `Regex("^[a-z]+$", "i")`: the pattern is a JavaScript regular expression.
(call_expression
  function: (identifier) @_regex
  (#eq? @_regex "Regex")
  arguments: (value_arguments
    .
    (value_argument
      value: (string_literal
        (string_content) @injection.content)))
  (#set! injection.language "regex"))
