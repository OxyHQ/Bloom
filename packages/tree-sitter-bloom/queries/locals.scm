; Bloom, the language by Oxy: scopes, definitions and references.

; ---- scopes ---------------------------------------------------------------------------------

[
  (source_file)
  (function_declaration)
  (init_declaration)
  (view_declaration)
  (struct_declaration)
  (enum_declaration)
  (class_declaration)
  (extension_declaration)
  (protocol_declaration)
  (test_declaration)
  (block)
  (closure_expression)
  (for_statement)
  (if_expression)
  (switch_entry)
  (match_arm)
  (catch_clause)
] @local.scope

; ---- definitions ----------------------------------------------------------------------------

(parameter
  name: (identifier) @local.definition.parameter)

(closure_parameters
  name: (identifier) @local.definition.parameter)

(function_declaration
  name: (identifier) @local.definition.function)

(state_declaration
  name: (identifier) @local.definition.var)

(var_declaration
  name: (identifier) @local.definition.var)

(property_declaration
  name: (identifier) @local.definition.var)

(let_declaration
  pattern: (identifier) @local.definition.var)

(optional_binding
  pattern: (identifier) @local.definition.var)

(for_statement
  pattern: (identifier) @local.definition.var)

(value_binding_pattern
  (identifier) @local.definition.var)

(tuple_pattern
  (identifier) @local.definition.var)

(pattern_arguments
  (identifier) @local.definition.var)

(record_pattern_field
  key: (identifier) @local.definition.var
  !pattern)

(record_pattern_field
  pattern: (identifier) @local.definition.var)

(catch_clause
  pattern: (value_binding_pattern
    (identifier) @local.definition.var))

(equal_declaration
  (identifier) @local.definition.parameter)

; ---- references -----------------------------------------------------------------------------

(identifier) @local.reference
