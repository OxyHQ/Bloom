; Bloom, the language by Oxy: indentation (nvim-treesitter's captures).

[
  (struct_body)
  (enum_body)
  (class_body)
  (protocol_body)
  (view_body)
  (block)
  (closure_expression)
  (record_literal)
  (record_type)
  (record_pattern)
  (array_literal)
  (dictionary_literal)
  (value_arguments)
  (parameters)
  (enum_case_payload)
  (tuple_expression)
  (tuple_type)
  (switch_entry)
  (match_expression)
] @indent.begin

; A modifier chain continued on the next line is indented under its node.
(navigation_expression
  "." @indent.begin
  (#set! indent.immediate 1))

; `switch x {`: its `case`s sit at the switch's level, their statements one deeper.
(switch_expression
  "}" @indent.end @indent.branch)

[
  "}"
  ")"
  "]"
] @indent.end @indent.branch

[
  (comment)
  (block_comment)
  (raw_string_literal)
] @indent.auto

(ERROR) @indent.auto
