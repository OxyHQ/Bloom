; Bloom, the language by Oxy: tags (code navigation).

(struct_declaration
  name: (type_identifier) @name) @definition.class

(class_declaration
  name: (type_identifier) @name) @definition.class

(enum_declaration
  name: (type_identifier) @name) @definition.class

(protocol_declaration
  name: (type_identifier) @name) @definition.interface

(typealias_declaration
  name: (type_identifier) @name) @definition.type

(view_declaration
  name: (type_identifier) @name) @definition.class

(extension_declaration
  name: (type_identifier) @name) @reference.implementation

(function_declaration
  name: (identifier) @name) @definition.function

(enum_case
  name: (identifier) @name) @definition.constant

(call_expression
  function: (identifier) @name) @reference.call

(call_expression
  function: (navigation_expression
    suffix: (identifier) @name)) @reference.call

(user_type
  name: (type_identifier) @name) @reference.type
