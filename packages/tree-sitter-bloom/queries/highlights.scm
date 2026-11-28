; Bloom, the language by Oxy: highlights.
;
; Patterns are ordered from the most general to the most specific: when several patterns
; capture one node, the last one wins (tree-sitter-highlight 0.27, as Neovim does).

; ---- names ----------------------------------------------------------------------------------

(identifier) @variable

((identifier) @type
  (#match? @type "^[A-Z]"))

((identifier) @constant
  (#match? @constant "^[A-Z][A-Z0-9_]+$"))

(type_identifier) @type

; ---- operators and punctuation --------------------------------------------------------------

[
  "!"
  "!="
  "!=="
  "%"
  "&&"
  "*"
  "*="
  "+"
  "+="
  "-"
  "-="
  "->"
  "..."
  "..<"
  ".."
  "/"
  "<"
  "<="
  "="
  "=="
  "==="
  "=>"
  ">"
  ">="
  "?"
  "??"
  "|"
  "||"
  "&"
] @operator

[
  "."
  "?."
  ","
  ":"
  ";"
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

(type_arguments
  [
    "<"
    ">"
  ] @punctuation.bracket)

(type_parameters
  [
    "<"
    ">"
  ] @punctuation.bracket)

; ---- literals -------------------------------------------------------------------------------

[
  (string_literal)
  (raw_string_literal)
] @string

(escape_sequence) @string.escape

(interpolation
  [
    "\\("
    ")"
    "${"
    "}"
  ] @punctuation.special)

(boolean_literal) @boolean

(none_literal) @constant.builtin

(integer_literal) @number

(float_literal) @number.float

; ---- keywords -------------------------------------------------------------------------------

[
  "let"
  "var"
  "in"
  "body"
  "effect"
  "equal"
  "test"
  "get"
  "set"
] @keyword

[
  "is"
  "as"
] @keyword.operator

[
  "fn"
  "func"
] @keyword.function

[
  "struct"
  "enum"
  "class"
  "actor"
  "protocol"
  "extension"
  "type"
  "view"
  "screen"
  "layout"
] @keyword.type

[
  "pub"
  "public"
  "internal"
  "private"
  "fileprivate"
  "open"
  "static"
  "final"
  "extern"
  "module"
  "native"
  "some"
  "any"
] @keyword.modifier

(default_modifier) @keyword.modifier

(visibility_modifier
  "set" @keyword.modifier)

[
  "async"
  "await"
  "task"
] @keyword.coroutine

"return" @keyword.return

[
  "if"
  "else"
  "switch"
  "match"
  "case"
  "default"
  "guard"
  "where"
] @keyword.conditional

[
  "for"
  "while"
] @keyword.repeat

(for_statement
  "in" @keyword.repeat)

(control_transfer_statement
  [
    "break"
    "continue"
  ] @keyword.repeat)

; `outer: for …` and `break outer`: a loop's label.
(labeled_statement
  label: (identifier) @label)

(control_transfer_statement
  label: (identifier) @label)

[
  "try"
  "throw"
  "throws"
  "rethrows"
  "do"
  "catch"
  "defer"
] @keyword.exception

[
  "import"
  "from"
] @keyword.import

(import_declaration
  "as" @keyword.import)

(import_specifier
  [
    "as"
    "type"
  ] @keyword.import)

; ---- members, records, bindings -------------------------------------------------------------

(navigation_expression
  suffix: (identifier) @property)

(navigation_expression
  suffix: (integer_literal) @property)

; `Load.ready`, `Duration.minutes`: a type's case or static member.
((navigation_expression
  target: (identifier) @type
  suffix: (identifier) @constant)
  (#match? @type "^[A-Z]")
  (#match? @constant "^[a-z]"))

; `.md`, `.ready`: a member of the expected type (a token, an enum case).
(implicit_member_expression
  name: (identifier) @constant)

(record_field
  key: (identifier) @property)

(record_type_field
  name: (identifier) @property)

(record_pattern_field
  key: (identifier) @property)

(key_path_expression
  "\\" @punctuation.special)

(key_path_expression
  root: (type_identifier) @type)

(key_path_expression
  component: (identifier) @property)

(binding_expression
  "$" @punctuation.special)

(case_pattern
  name: (identifier) @constant)

(case_pattern
  type: (type_identifier) @type)

; ---- calls ----------------------------------------------------------------------------------

(call_expression
  function: (identifier) @function.call)

; `VStack { … }`, `Text("…")`, `Post(…)`: a type or a node, constructed.
((call_expression
  function: (identifier) @constructor)
  (#match? @constructor "^[A-Z]"))

; `#expect(…)`: a macro-like call.
((call_expression
  function: (identifier) @function.macro)
  (#match? @function.macro "^#"))

; `.padding("md")`, `xs.map { … }`: a modifier or a method.
(call_expression
  function: (navigation_expression
    suffix: (identifier) @function.method.call))

(call_expression
  function: (implicit_member_expression
    name: (identifier) @function.method.call))

(optional_call_expression
  function: (identifier) @function.call)

(dynamic_import
  "import" @function.builtin)

(value_argument
  label: (identifier) @variable.parameter)

(call_expression
  label: (identifier) @variable.parameter)

; ---- declarations ---------------------------------------------------------------------------

(property_declaration
  name: (identifier) @variable)

; A type's stored or computed property.
[
  (struct_body
    (property_declaration
      name: (identifier) @property))
  (class_body
    (property_declaration
      name: (identifier) @property))
  (enum_body
    (property_declaration
      name: (identifier) @property))
]

(field_declaration
  name: (identifier) @property)

(protocol_property_requirement
  name: (identifier) @property)

(enum_case
  name: (identifier) @constant)

(enum_case_payload_item
  name: (identifier) @variable.parameter)

(parameter
  name: (identifier) @variable.parameter)

(parameter
  label: (identifier) @variable.parameter)

(closure_parameters
  name: (identifier) @variable.parameter)

(equal_declaration
  (identifier) @variable.parameter)

(effect_declaration
  label: (identifier) @variable.parameter)

(function_declaration
  name: (identifier) @function)

(function_declaration
  name: (operator) @operator)

(init_declaration
  "init" @constructor)

(type_parameter
  name: (type_identifier) @type)

(type_application
  name: (type_identifier) @type)

(attribute
  "@" @attribute
  name: (identifier) @attribute)

(state_declaration
  "@" @attribute
  kind: (attribute_name) @attribute)

(test_declaration
  name: (string_literal) @string.special)

(module_path
  (identifier) @module)

(import_declaration
  source: (string_literal) @string.special.path)

(extern_declaration
  source: (string_literal) @string.special.path)

; ---- built-ins ------------------------------------------------------------------------------

((type_identifier) @type.builtin
  (#any-of? @type.builtin
    "Int" "Float" "Double" "Bool" "String" "Character" "Unit" "Void" "Never" "Error" "Self"
    "Optional" "Result" "Promise" "Map" "Set" "Array" "Dictionary" "Partial" "Foreign" "View"
    "Binding" "Equatable" "Hashable" "Identifiable" "CaseIterable" "Codable" "Decodable"
    "Encodable" "Sendable"))

((identifier) @variable.builtin
  (#any-of? @variable.builtin "self" "super" "_"))

((identifier) @type.builtin
  (#eq? @type.builtin "Self"))

(shorthand_argument) @variable.builtin

; ---- comments -------------------------------------------------------------------------------

[
  (comment)
  (block_comment)
] @comment

((comment) @comment.documentation
  (#match? @comment.documentation "^///([^/]|$)"))
