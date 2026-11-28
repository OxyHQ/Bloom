/**
 * @file Bloom, the language by Oxy: a tree-sitter grammar for `.bloom` files.
 * @license SEE LICENSE IN LICENSE
 *
 * Written from the language's specification (docs/bloom-lang-spec.mdx) and its real parser
 * (packages/bloom-language-compiler/crates/lang/src/{lexer,parser}.rs). Where the two differ,
 * the parser wins: this grammar accepts what bloomc accepts. Both generations of the surface
 * parse: 0.x (`fn`, `pub`, `view`, `@state`, `match … =>`, `${…}`) and 2.0 (`func`, `public`,
 * `struct X: View`, `@State`, `switch`, `\(…)`).
 *
 * Newlines end statements, fields, cases and members, as the lexer's `fold_newlines` decides;
 * the external scanner (src/scanner.c) applies those rules and emits `_semi` only where the
 * grammar can end a line.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  ternary: 1,
  default: 2,
  or: 3,
  and: 4,
  equality: 5,
  comparison: 6,
  range: 7,
  additive: 8,
  multiplicative: 9,
  prefix: 10,
  postfix: 11,
};

/** Words the lexer reserves (`Kw` in lexer.rs). */
const HARD_KEYWORDS = [
  'as',
  'async',
  'await',
  'body',
  'case',
  'default',
  'defer',
  'else',
  'enum',
  'false',
  'fn',
  'for',
  'from',
  'if',
  'import',
  'in',
  'layout',
  'let',
  'match',
  'none',
  'pub',
  'return',
  'screen',
  'struct',
  'task',
  'true',
  'type',
  'var',
  'view',
  'while',
];

/** Hard keywords that never start an expression, so they may name a value (`is_soft`). */
const SOFT_KEYWORDS = ['type', 'body', 'view', 'screen', 'layout', 'from'];

/** Contextual words that start a statement or follow an expression, so never name a value. */
const STATEMENT_WORDS = [
  'break',
  'catch',
  'continue',
  'do',
  'guard',
  'is',
  'switch',
  'throw',
  'try',
  'where',
];

/** Words that are keywords only where the parser reads them so (2.0's contextual words). */
const CONTEXTUAL_KEYWORDS = [
  'actor',
  'any',
  'break',
  'catch',
  'class',
  'continue',
  'do',
  'effect',
  'equal',
  'extension',
  'extern',
  'fileprivate',
  'final',
  'func',
  'get',
  'guard',
  'init',
  'internal',
  'is',
  'module',
  'native',
  'open',
  'private',
  'protocol',
  'public',
  'rethrows',
  'set',
  'some',
  'static',
  'switch',
  'test',
  'throw',
  'throws',
  'try',
  'where',
];

export default grammar({
  name: 'bloom',

  word: ($) => $.identifier,

  externals: ($) => [
    $._semi,
    $.block_comment,
    $._immediate_question,
    $._string_content,
    $._raw_string_content,
    $._error_sentinel,
  ],

  extras: ($) => [/\s/, $.comment, $.block_comment],

  supertypes: ($) => [$._expression, $._statement, $._type, $._pattern, $._declaration],

  // Each is a choice the parser makes by reading ahead; GLR keeps both readings until one fails.
  conflicts: ($) => [
    // `import { type }` (a name) or `import { type X }`.
    [$.import_specifier, $._label_name],
    // `Name<T>(…)` (a type applied) or `name < x` (a comparison).
    [$._name, $._type_name],
    // `{ a: Int in … }` (a typed closure parameter) or `{ a: b }` (a record).
    [$._name, $._label_name],
    // `f(x) { … }`: a trailing closure, or the block of a construct around the call.
    [$.call_expression],
    // `{ (a, b) in … }` or a closure whose first statement is the tuple `(a, b)`.
    [$._closure_parameter, $._expression],
    // `{ }` after an expression in a member's getter: a block or a trailing closure.
    [$.block, $.closure_expression],
    // `case private(x)` (a case named so) or `private(set) var …`; `case init(x)` or `init(…) {`.
    [$._case_name, $.visibility_modifier],
    [$._case_name, $.init_declaration],
    // `{ outer: for … }` (a labelled loop in a closure) or `{ a: b }` (a record).
    [$._name, $._label_name, $.labeled_statement],
    [$._name, $.labeled_statement],
  ],

  rules: {
    source_file: ($) => optional(lines(choice($.import_declaration, $._declaration), $._sep)),

    _sep: ($) => repeat1(choice($._semi, ';')),

    /** A member, field or case ends with a line break, `;` or `,` (the parser eats one comma). */
    _member_sep: ($) => choice($._sep, seq(',', optional($._sep))),

    // ---- names --------------------------------------------------------------------------

    identifier: (_) => /#?[a-zA-Z_][a-zA-Z0-9_]*/,

    /** A name where a soft keyword is a name too (`view NoticeRow(type: String, body: String)`). */
    _name: ($) =>
      choice(
        $.identifier,
        ...[
          ...SOFT_KEYWORDS,
          ...CONTEXTUAL_KEYWORDS.filter((kw) => !STATEMENT_WORDS.includes(kw)),
        ].map((kw) => alias(kw, $.identifier)),
      ),

    /**
     * An enum case's name. A modifier word names a case unless a declaration follows it
     * (`case public, private`), as the parser's `member_ahead` reads it.
     */
    _case_name: ($) =>
      choice(
        $.identifier,
        ...[
          ...SOFT_KEYWORDS,
          ...CONTEXTUAL_KEYWORDS.filter((kw) => !STATEMENT_WORDS.includes(kw)),
        ].map((kw) => alias(kw, $.identifier)),
      ),

    /** A label, a record key or a member after `.`: any word, keywords included. */
    _label_name: ($) =>
      choice(
        $.identifier,
        ...[...HARD_KEYWORDS, ...CONTEXTUAL_KEYWORDS].map((kw) => alias(kw, $.identifier)),
      ),

    _type_name: ($) => alias($.identifier, $.type_identifier),

    // ---- imports ------------------------------------------------------------------------

    import_declaration: ($) =>
      seq(
        'import',
        choice(
          seq(
            '{',
            optional(seq(commaSep1($.import_specifier), optional(','))),
            '}',
            'from',
            field('source', $.string_literal),
          ),
          seq('*', 'as', field('alias', $._name), 'from', field('source', $.string_literal)),
          field('module', $.module_path),
        ),
      ),

    import_specifier: ($) =>
      seq(
        optional('type'),
        field('name', $._label_name),
        optional(seq('as', field('alias', $._name))),
      ),

    module_path: ($) => prec.right(seq($.identifier, repeat(seq('.', $.identifier)))),

    // ---- declarations -------------------------------------------------------------------

    _declaration: ($) =>
      choice(
        $.struct_declaration,
        $.enum_declaration,
        $.class_declaration,
        $.protocol_declaration,
        $.extension_declaration,
        $.typealias_declaration,
        $.function_declaration,
        $.property_declaration,
        $.view_declaration,
        $.extern_declaration,
        $.test_declaration,
      ),

    /** `@Observable public final`, `public private(set)`, `static`, 0.x `pub` and `pub default`. */
    modifiers: ($) =>
      repeat1(choice($.attribute, $.visibility_modifier, $.member_modifier, $.default_modifier)),

    attribute: ($) =>
      prec.right(
        seq('@', field('name', $.identifier), optional(field('arguments', $.value_arguments))),
      ),

    visibility_modifier: (_) =>
      choice(
        seq(
          choice('public', 'internal', 'private', 'fileprivate', 'open'),
          optional(seq('(', 'set', ')')),
        ),
        'pub',
      ),

    member_modifier: (_) => choice('static', 'final'),

    /** `pub default view X`: the file's default export. */
    default_modifier: (_) => 'default',

    struct_declaration: ($) =>
      seq(
        optional($.modifiers),
        'struct',
        field('name', $._type_name),
        optional(field('type_parameters', $.type_parameters)),
        optional($.inheritance_clause),
        optional($.where_clause),
        field('body', $.struct_body),
      ),

    struct_body: ($) =>
      seq('{', optional(lines(choice($.field_declaration, $._type_member), $._member_sep)), '}'),

    /** 0.x: `name: Type = default`. */
    field_declaration: ($) =>
      seq(
        field('name', $._label_name),
        ':',
        field('type', $._type),
        optional(seq('=', field('value', $._expression))),
      ),

    _type_member: ($) =>
      choice(
        $.property_declaration,
        $.function_declaration,
        $.init_declaration,
        alias($._destructuring_member, $.let_declaration),
      ),

    /** `let x: T = v`, `public private(set) var x = v`, `var body: some View { … }`. */
    property_declaration: ($) =>
      prec.right(
        seq(
          optional($.modifiers),
          choice('let', 'var'),
          field('name', $._label_name),
          optional(seq(':', field('type', $._type))),
          optional(choice(seq('=', field('value', $._expression)), field('getter', $.block))),
        ),
      ),

    /** `let { a, b } = useThing()` among a type's members (a view's). */
    _destructuring_member: ($) =>
      seq(
        'let',
        field('pattern', choice($.record_pattern, $.tuple_pattern)),
        optional(seq(':', field('type', $._type))),
        '=',
        field('value', $._expression),
      ),

    init_declaration: ($) =>
      seq(
        optional($.modifiers),
        'init',
        field('parameters', $.parameters),
        optional('async'),
        optional($.throws_clause),
        field('body', $.block),
      ),

    enum_declaration: ($) =>
      seq(
        optional($.modifiers),
        'enum',
        field('name', $._type_name),
        optional(field('type_parameters', $.type_parameters)),
        optional($.inheritance_clause),
        field('body', $.enum_body),
      ),

    enum_body: ($) =>
      seq('{', optional(lines(choice($.enum_case, $._type_member), $._member_sep)), '}'),

    /** `loading`, `failed(message: String)`, 2.0 `case ready(T)`. */
    enum_case: ($) =>
      seq(
        optional('case'),
        field('name', $._case_name),
        optional(field('payload', $.enum_case_payload)),
      ),

    enum_case_payload: ($) => seq('(', commaSep($.enum_case_payload_item), optional(','), ')'),

    enum_case_payload_item: ($) =>
      seq(optional(seq(field('name', $._name), ':')), field('type', $._type)),

    /** `class Name`, `actor Name` (a class whose methods run one at a time). */
    class_declaration: ($) =>
      seq(
        optional($.modifiers),
        field('kind', choice('class', 'actor')),
        field('name', $._type_name),
        optional(field('type_parameters', $.type_parameters)),
        optional($.inheritance_clause),
        field('body', $.class_body),
      ),

    class_body: ($) => seq('{', optional(lines($._type_member, $._member_sep)), '}'),

    extension_declaration: ($) =>
      seq(
        optional($.modifiers),
        'extension',
        field('name', $._type_name),
        optional(field('type_parameters', $.type_parameters)),
        optional($.inheritance_clause),
        optional($.where_clause),
        field('body', $.class_body),
      ),

    protocol_declaration: ($) =>
      seq(
        optional($.modifiers),
        'protocol',
        field('name', $._type_name),
        optional($.inheritance_clause),
        field('body', $.protocol_body),
      ),

    protocol_body: ($) =>
      seq(
        '{',
        optional(
          lines(choice($.protocol_property_requirement, $.function_declaration), $._member_sep),
        ),
        '}',
      ),

    /** `var id: String { get }`, `var title: String { get set }`. */
    protocol_property_requirement: ($) =>
      seq(
        optional($.modifiers),
        choice('var', 'let'),
        field('name', $._label_name),
        ':',
        field('type', $._type),
        optional($.accessors),
      ),

    accessors: (_) => seq('{', repeat(choice('get', 'set')), '}'),

    typealias_declaration: ($) =>
      seq(
        optional($.modifiers),
        'type',
        field('name', $._type_name),
        optional(field('type_parameters', $.type_parameters)),
        '=',
        field('value', $._type),
      ),

    /** `fn` (0.x) or `func` (2.0); no body in a protocol or an `extern` block. */
    function_declaration: ($) =>
      prec.right(
        seq(
          optional($.modifiers),
          optional('async'),
          choice('func', 'fn'),
          field('name', choice($._name, alias('==', $.operator))),
          optional(field('type_parameters', $.type_parameters)),
          field('parameters', $.parameters),
          optional('async'),
          optional($.throws_clause),
          optional(seq('->', field('return_type', $._type))),
          optional($.where_clause),
          optional(field('body', $.block)),
        ),
      ),

    throws_clause: ($) =>
      prec.right(
        seq(choice('throws', 'rethrows'), optional(seq('(', field('type', $._type), ')'))),
      ),

    parameters: ($) => seq('(', optional(seq(commaSep1($.parameter), optional(','))), ')'),

    /** `p: T = v`, `to target: Point` (a label, then the name), `..xs: [T]`, `..Props`. */
    parameter: ($) =>
      choice(
        seq('..', field('type', $.user_type)),
        seq(
          optional('..'),
          optional(field('label', $._label_name)),
          field('name', $._name),
          ':',
          field('type', $._type),
          optional(seq('=', field('default', $._expression))),
        ),
      ),

    type_parameters: ($) => seq('<', commaSep1($.type_parameter), '>'),

    type_parameter: ($) =>
      seq(
        field('name', $._type_name),
        optional(
          seq(':', field('constraint', $._type), repeat(seq('&', field('constraint', $._type)))),
        ),
      ),

    where_clause: ($) =>
      prec.right(
        seq(
          'where',
          commaSep1(
            seq(
              field('name', $._type_name),
              ':',
              field('constraint', $._type),
              repeat(seq('&', field('constraint', $._type))),
            ),
          ),
        ),
      ),

    inheritance_clause: ($) => prec.right(seq(':', commaSep1($._type))),

    /** 0.x: `view Name(params) { members; body { … } }`, `screen`, `layout`. */
    view_declaration: ($) =>
      seq(
        optional($.modifiers),
        field('kind', choice('view', 'screen', 'layout')),
        field('name', $._type_name),
        optional(field('parameters', $.parameters)),
        field('body', $.view_body),
      ),

    view_body: ($) =>
      seq(
        '{',
        optional(
          lines(
            choice(
              $.state_declaration,
              $.let_declaration,
              $.function_declaration,
              $.effect_declaration,
              $.equal_declaration,
              $.body_declaration,
            ),
            $._sep,
          ),
        ),
        '}',
      ),

    /** 0.x: `@state draft = Draft()`, `@list`, `@record`, `@env`, `@ref`. */
    state_declaration: ($) =>
      seq(
        '@',
        field('kind', alias($.identifier, $.attribute_name)),
        field('name', $._name),
        optional(seq(':', field('type', $._type))),
        '=',
        field('value', $._expression),
      ),

    body_declaration: ($) => seq('body', field('body', $.block)),

    /** `effect { … }`, `effect(id: x) { … }`. */
    effect_declaration: ($) =>
      seq(
        'effect',
        optional(seq('(', field('label', $.identifier), ':', field('id', $._expression), ')')),
        field('body', $.block),
      ),

    /** `equal(old, new) { … }`: the memo comparator. */
    equal_declaration: ($) => seq('equal', '(', $._name, ',', $._name, ')', field('body', $.block)),

    /** `extern module "pkg" { … }`, `extern native "Name" { … }`. */
    extern_declaration: ($) =>
      seq(
        optional($.modifiers),
        'extern',
        field('kind', choice('module', 'native')),
        field('source', $.string_literal),
        '{',
        optional(lines($._declaration, $._member_sep)),
        '}',
      ),

    test_declaration: ($) =>
      seq('test', '(', field('name', $.string_literal), ')', field('body', $.block)),

    // ---- statements ---------------------------------------------------------------------

    block: ($) => seq('{', optional(lines($._statement, $._sep)), '}'),

    _statement: ($) =>
      choice(
        $.let_declaration,
        $.var_declaration,
        $.assignment,
        $.return_statement,
        $.defer_statement,
        $.while_statement,
        $.for_statement,
        $.guard_statement,
        $.throw_statement,
        $.do_statement,
        $.control_transfer_statement,
        $.labeled_statement,
        $.state_statement,
        $._expression,
      ),

    /** `outer: for row in grid { … }`: a loop `break outer` / `continue outer` names. */
    labeled_statement: ($) =>
      seq(
        field('label', $.identifier),
        ':',
        field('body', choice($.for_statement, $.while_statement)),
      ),

    /** `@State var n = 0` at the top of a hook function's body. */
    state_statement: ($) => seq(repeat1($.attribute), $.var_declaration),

    /** `let x = v`, `let { t } = useTranslation()`, `async let x = f()`. */
    let_declaration: ($) =>
      seq(
        optional('async'),
        'let',
        field('pattern', $._pattern),
        optional(seq(':', field('type', $._type))),
        '=',
        field('value', $._expression),
      ),

    var_declaration: ($) =>
      seq(
        'var',
        field('name', $._name),
        optional(seq(':', field('type', $._type))),
        '=',
        field('value', $._expression),
      ),

    assignment: ($) =>
      seq(
        field('target', $._expression),
        field('operator', choice('=', '+=', '-=', '*=')),
        field('value', $._expression),
      ),

    return_statement: ($) => prec.right(seq('return', optional(field('value', $._expression)))),

    defer_statement: ($) => seq('defer', field('body', $.block)),

    while_statement: ($) =>
      seq('while', field('condition', $._head_expression), field('body', $.block)),

    for_statement: ($) =>
      seq(
        'for',
        field('pattern', $._pattern),
        'in',
        field('value', $._head_expression),
        field('body', $.block),
      ),

    /** `guard cond else { … }`, `guard let x = v else { … }`. */
    guard_statement: ($) =>
      seq(
        'guard',
        field('condition', choice($._expression, $.optional_binding)),
        'else',
        field('body', $.block),
      ),

    throw_statement: ($) => seq('throw', field('value', $._expression)),

    do_statement: ($) => prec.right(seq('do', field('body', $.block), repeat($.catch_clause))),

    /** `catch { … }`, `catch let e as T { … }`, `catch .offline { … }`. */
    catch_clause: ($) =>
      seq(
        'catch',
        // `catch {` always opens the block, never a record pattern.
        optional(field('pattern', $._unbraced_pattern)),
        optional(seq('as', field('type', $._type))),
        field('body', $.block),
      ),

    control_transfer_statement: ($) =>
      prec.right(seq(choice('break', 'continue'), optional(field('label', $.identifier)))),

    // ---- expressions --------------------------------------------------------------------

    ...expressionFamily(false),
    ...expressionFamily(true),

    _literal: ($) =>
      choice(
        $.integer_literal,
        $.float_literal,
        $.boolean_literal,
        $.none_literal,
        $.string_literal,
        $.raw_string_literal,
      ),

    _trailing_closures: ($) =>
      prec.right(
        seq(
          field('trailing_closure', $.closure_expression),
          repeat(
            seq(field('label', $.identifier), ':', field('trailing_closure', $.closure_expression)),
          ),
        ),
      ),

    value_arguments: ($) =>
      seq('(', optional(seq(commaSep1($.value_argument), optional(','))), ')'),

    value_argument: ($) =>
      choice(
        seq(
          optional(seq(field('label', $._label_name), ':')),
          field('value', choice($._expression, $.operator_function)),
        ),
        $.spread_element,
      ),

    /** `reduce(0, +)`, `sorted(by: <)`, `(+)`: an operator passed as a function (Swift's). */
    operator_function: (_) => choice('+', '-', '*', '/', '%', '<', '<=', '>', '>=', '==', '!='),

    spread_element: ($) => seq('..', $._expression),

    /** `Map<String, Int>()`, `ViewRef<ViewInstance>()`: a type applied. */
    type_application: ($) =>
      prec.dynamic(1, seq(field('name', $._type_name), field('arguments', $.type_arguments))),

    /** `.md`, `.ready(x)`: a member of the expected type. */
    implicit_member_expression: ($) => seq('.', field('name', $._label_name)),

    /** `\.likes`, `\Prefs.likes`. */
    key_path_expression: ($) =>
      prec.right(
        seq(
          '\\',
          optional(field('root', $._type_name)),
          repeat1(seq(token.immediate('.'), field('component', $.identifier))),
        ),
      ),

    /** `$draft`: a binding to a state (`$draft.text` reads on as a member). */
    binding_expression: ($) =>
      seq('$', field('name', alias(token.immediate(/[a-zA-Z_][a-zA-Z0-9_]*/), $.identifier))),

    /** `$0`: a closure's shorthand parameter. */
    shorthand_argument: (_) => /\$[0-9]+/,

    dynamic_import: ($) => seq('import', field('arguments', $.value_arguments)),

    unit: (_) => seq('(', ')'),

    parenthesized_expression: ($) => seq('(', choice($._expression, $.operator_function), ')'),

    tuple_expression: ($) =>
      seq('(', $._expression, ',', optional(seq(commaSep1($._expression), optional(','))), ')'),

    array_literal: ($) =>
      seq(
        '[',
        optional(seq(commaSep1(choice($._expression, $.spread_element)), optional(','))),
        ']',
      ),

    dictionary_literal: ($) =>
      seq('[', choice(':', seq(commaSep1($.dictionary_entry), optional(','))), ']'),

    dictionary_entry: ($) => seq(field('key', $._expression), ':', field('value', $._expression)),

    /** `{ key: value, "quoted-key": v, ..spread }`. */
    record_literal: ($) =>
      seq('{', commaSep1(choice($.record_field, $.spread_element)), optional(','), '}'),

    record_field: ($) =>
      seq(
        field('key', choice($._label_name, $.string_literal)),
        ':',
        field('value', $._expression),
      ),

    /** `{ a, b in … }`, `{ (a, b) in … }`, `{ $0.x }`. */
    closure_expression: ($) =>
      seq(
        '{',
        optional(seq(field('parameters', $.closure_parameters), 'in')),
        optional(lines($._statement, $._sep)),
        '}',
      ),

    closure_parameters: ($) =>
      choice(
        commaSep1($._closure_parameter),
        seq(
          '(',
          optional(commaSep1($._closure_parameter)),
          ')',
          optional(seq('->', field('return_type', $._type))),
        ),
      ),

    _closure_parameter: ($) =>
      seq(field('name', $._name), optional(seq(':', field('type', $._type)))),

    if_expression: ($) =>
      prec.right(
        seq(
          'if',
          field(
            'condition',
            choice($._head_expression, alias($._head_optional_binding, $.optional_binding)),
          ),
          field('consequence', $.block),
          optional(seq('else', field('alternative', choice($.if_expression, $.block)))),
        ),
      ),

    /** `let x = optional` in an `if` or a `guard`. */
    optional_binding: ($) =>
      seq('let', field('pattern', $._pattern), '=', field('value', $._expression)),

    _head_optional_binding: ($) =>
      seq('let', field('pattern', $._pattern), '=', field('value', $._head_expression)),

    /** 0.x: `match x { case .a(v) => … }`. */
    match_expression: ($) =>
      seq(
        'match',
        field('value', $._head_expression),
        '{',
        optional(lines($.match_arm, $._member_sep)),
        '}',
      ),

    match_arm: ($) =>
      prec.right(
        seq(
          'case',
          field('pattern', $._pattern),
          optional(seq('if', field('guard', $._expression))),
          '=>',
          field('body', choice(prec(1, $.block), $._statement)),
        ),
      ),

    /** 2.0: `switch x { case .a, .b: … case let .c(v) where v > 0: … default: … }`. */
    switch_expression: ($) =>
      seq('switch', field('value', $._head_expression), '{', repeat($.switch_entry), '}'),

    switch_entry: ($) =>
      prec.right(
        seq(
          choice(
            seq(
              'case',
              commaSep1(field('pattern', $._pattern)),
              optional(seq('where', field('guard', $._expression))),
            ),
            'default',
          ),
          ':',
          optional(lines($._statement, $._sep)),
        ),
      ),

    /** `task { … }`: spawns its block. */
    task_expression: ($) => seq('task', field('body', $.block)),

    // ---- literals -----------------------------------------------------------------------

    integer_literal: (_) => token(choice(/0[xX][0-9a-fA-F_]+/, /[0-9][0-9_]*/)),

    float_literal: (_) =>
      token(choice(/[0-9][0-9_]*\.[0-9][0-9_]*([eE][+-]?[0-9]+)?/, /[0-9][0-9_]*[eE][+-]?[0-9]+/)),

    boolean_literal: (_) => choice('true', 'false'),

    none_literal: (_) => 'none',

    string_literal: ($) =>
      seq(
        '"',
        repeat(
          choice(alias($._string_content, $.string_content), $.escape_sequence, $.interpolation),
        ),
        token.immediate('"'),
      ),

    /** `"""…"""`: several lines, interpolation kept. */
    raw_string_literal: ($) =>
      seq(
        '"""',
        repeat(
          choice(
            alias($._raw_string_content, $.string_content),
            $.escape_sequence,
            $.interpolation,
          ),
        ),
        token.immediate('"""'),
      ),

    escape_sequence: (_) => token.immediate(seq('\\', choice(/u\{[0-9a-fA-F]+\}/, /[^(u\n]/))),

    /** `\(expr)` (2.0) or `${expr}` (0.x). */
    interpolation: ($) =>
      choice(
        seq(token.immediate('\\('), $._expression, ')'),
        seq(token.immediate('${'), $._expression, '}'),
      ),

    comment: (_) => token(seq('//', /[^\n]*/)),

    // ---- types --------------------------------------------------------------------------

    _type: ($) =>
      choice(
        $.user_type,
        $.optional_type,
        $.array_type,
        $.dictionary_type,
        $.tuple_type,
        $.function_type,
        $.opaque_type,
        $.existential_type,
        $.literal_union_type,
        $.record_type,
        $.composition_type,
      ),

    /** `Named & Counted`: a value of a type conforming to both. */
    composition_type: ($) => prec.left(-1, seq($._type, '&', $._type)),

    user_type: ($) =>
      prec.right(seq(field('name', $._type_name), optional(field('arguments', $.type_arguments)))),

    type_arguments: ($) => seq('<', commaSep1($._type), '>'),

    optional_type: ($) =>
      prec(
        PREC.postfix,
        seq(
          field('wrapped', $._type),
          choice(alias($._immediate_question, '?'), token.immediate('??')),
        ),
      ),

    array_type: ($) => seq('[', field('element', $._type), ']'),

    dictionary_type: ($) => seq('[', field('key', $._type), ':', field('value', $._type), ']'),

    /** `(A, B)`, or `(A)` (a parenthesised type). */
    tuple_type: ($) => seq('(', optional(seq(commaSep1($._type), optional(','))), ')'),

    /** `(A) -> R`, `async (A) -> R`, `() async throws -> T`. */
    function_type: ($) =>
      prec.right(
        seq(
          optional('async'),
          '(',
          optional(seq(commaSep1($._type), optional(','))),
          ')',
          optional('async'),
          optional('throws'),
          '->',
          field('return_type', $._type),
        ),
      ),

    /** `some View`. */
    opaque_type: ($) => prec.right(seq('some', $._type)),

    /** `any Titled`. */
    existential_type: ($) => prec.right(seq('any', $._type)),

    /** `"a" | "b"`. */
    literal_union_type: ($) =>
      prec.right(seq($.string_literal, repeat(seq('|', $.string_literal)))),

    /** `{ name: String, count: Int }`. */
    record_type: ($) => seq('{', optional(seq(commaSep1($.record_type_field), optional(','))), '}'),

    record_type_field: ($) =>
      seq(field('name', choice($._label_name, $.string_literal)), ':', field('type', $._type)),

    // ---- patterns -----------------------------------------------------------------------

    _pattern: ($) => choice($._unbraced_pattern, $.record_pattern, $.alternative_pattern),

    _unbraced_pattern: ($) =>
      choice(
        $._name,
        $.case_pattern,
        $.tuple_pattern,
        $.value_binding_pattern,
        $.integer_literal,
        $.float_literal,
        $.boolean_literal,
        $.none_literal,
        $.string_literal,
        alias($._negative_literal, $.prefix_expression),
      ),

    _negative_literal: ($) => seq('-', choice($.integer_literal, $.float_literal)),

    /** `case let .failed(message)`, `.ready(let count)`. */
    value_binding_pattern: ($) => prec.right(seq(choice('let', 'var'), $._pattern)),

    /** `.ready(x)`, `Load.ready(x)`, `ok(x)`. */
    case_pattern: ($) =>
      prec.right(
        choice(
          seq(
            optional(field('type', $._type_name)),
            '.',
            field('name', $._label_name),
            optional(field('arguments', $.pattern_arguments)),
          ),
          seq(field('name', $.identifier), field('arguments', $.pattern_arguments)),
        ),
      ),

    pattern_arguments: ($) => seq('(', optional(seq(commaSep1($._pattern), optional(','))), ')'),

    tuple_pattern: ($) => seq('(', optional(seq(commaSep1($._pattern), optional(','))), ')'),

    /** `{ t, i18n: i }`: record destructuring. */
    record_pattern: ($) =>
      seq('{', optional(seq(commaSep1($.record_pattern_field), optional(','))), '}'),

    record_pattern_field: ($) =>
      seq(field('key', $._name), optional(seq(':', field('pattern', $._pattern)))),

    alternative_pattern: ($) => prec.left(seq($._pattern, '|', $._pattern)),
  },
});

/**
 * The expressions that read operators and postfixes, twice: in a head (`if x {`, `while`,
 * `for … in xs {`, `match x {`, `switch x {`), where the parser's `Ctx::Head` reads no trailing
 * closure (spec section 3, rule 1) and a `{` is never a closure or a record; and everywhere
 * else. The head's rules are hidden and aliased to the same node names.
 * @param {boolean} head
 */
function expressionFamily(head) {
  const p = head ? '_head_' : '';
  /** @param {GrammarSymbols<string>} $ */
  const expr = ($) => (head ? $._head_expression : $._expression);
  /**
   * @param {GrammarSymbols<string>} $
   * @param {string} name
   */
  const node = ($, name) => (head ? alias($[`_head_${name}`], $[name]) : $[name]);
  const names = [
    'ternary_expression',
    'binary_expression',
    'is_expression',
    'cast_expression',
    'prefix_expression',
    'try_expression',
    'await_expression',
    'call_expression',
    'navigation_expression',
    'optional_call_expression',
    'subscript_expression',
    'force_unwrap_expression',
    'postfix_try_expression',
  ];

  /** @type {Record<string, ($: GrammarSymbols<string>) => RuleOrLiteral>} */
  const rules = {
    [`${p || '_'}expression`]: ($) =>
      choice(
        ...names.map((name) => node($, name)),
        $.if_expression,
        $.match_expression,
        $.switch_expression,
        $.task_expression,
        ...(head ? [] : [$.closure_expression, $.record_literal]),
        $.array_literal,
        $.dictionary_literal,
        $.tuple_expression,
        $.parenthesized_expression,
        $.unit,
        $.type_application,
        $.implicit_member_expression,
        $.key_path_expression,
        $.binding_expression,
        $.shorthand_argument,
        $.dynamic_import,
        $._literal,
        $._name,
      ),

    [`${p}ternary_expression`]: ($) =>
      prec.right(
        PREC.ternary,
        seq(
          field('condition', expr($)),
          '?',
          field('consequence', expr($)),
          ':',
          field('alternative', expr($)),
        ),
      ),

    [`${p}binary_expression`]: ($) =>
      choice(
        ...[
          [PREC.multiplicative, choice('*', '/', '%')],
          [PREC.additive, choice('+', '-')],
          [PREC.range, choice('..<', '...')],
          [PREC.comparison, choice('<', '<=', '>', '>=')],
          [PREC.equality, choice('==', '!=', '===', '!==')],
          [PREC.and, '&&'],
          [PREC.or, '||'],
        ].map(([precedence, operator]) =>
          prec.left(
            /** @type {number} */ (precedence),
            seq(
              field('left', expr($)),
              field('operator', /** @type {RuleOrLiteral} */ (operator)),
              field('right', expr($)),
            ),
          ),
        ),
        prec.right(
          PREC.default,
          seq(field('left', expr($)), field('operator', '??'), field('right', expr($))),
        ),
      ),

    /** `x is T`, at the comparisons' level (spec 4.7). */
    [`${p}is_expression`]: ($) =>
      prec.left(PREC.equality, seq(field('value', expr($)), 'is', field('type', $._type))),

    /** `error as? HTTPError`, `x as! T`. */
    [`${p}cast_expression`]: ($) =>
      prec.left(
        PREC.equality,
        seq(
          field('value', expr($)),
          'as',
          choice(alias($._immediate_question, '?'), token.immediate('!')),
          field('type', $._type),
        ),
      ),

    [`${p}prefix_expression`]: ($) =>
      prec.right(PREC.prefix, seq(field('operator', choice('!', '-')), field('operand', expr($)))),

    /** `try f()`, `try? f()`, `try! f()`. */
    [`${p}try_expression`]: ($) =>
      prec.right(
        PREC.prefix,
        seq(
          'try',
          optional(choice(alias($._immediate_question, '?'), token.immediate('!'))),
          field('operand', expr($)),
        ),
      ),

    [`${p}await_expression`]: ($) =>
      prec.right(PREC.prefix, seq('await', field('operand', expr($)))),

    /** `f(x)`, `f(x) { … }`, `VStack { … }`, `Button { … } label: { … }`; no trailing closure in a head. */
    [`${p}call_expression`]: ($) =>
      prec(
        PREC.postfix,
        seq(
          field('function', expr($)),
          head
            ? field('arguments', $.value_arguments)
            : choice(
                seq(field('arguments', $.value_arguments), optional($._trailing_closures)),
                $._trailing_closures,
              ),
        ),
      ),

    /** `x.name`, `x?.name`, `t.0`. */
    [`${p}navigation_expression`]: ($) =>
      prec(
        PREC.postfix,
        seq(
          field('target', expr($)),
          choice('.', '?.'),
          field(
            'suffix',
            choice($._label_name, alias(token.immediate(/[0-9]+/), $.integer_literal)),
          ),
        ),
      ),

    /** `f?.(…)`: a call only when `f` is not `none`. */
    [`${p}optional_call_expression`]: ($) =>
      prec(
        PREC.postfix,
        seq(field('function', expr($)), '?.', field('arguments', $.value_arguments)),
      ),

    [`${p}subscript_expression`]: ($) =>
      prec(PREC.postfix, seq(field('target', expr($)), '[', field('index', $._expression), ']')),

    [`${p}force_unwrap_expression`]: ($) => prec(PREC.postfix, seq(expr($), token.immediate('!'))),

    /** `expr?`: returns the error (or `none`) early. */
    [`${p}postfix_try_expression`]: ($) =>
      prec(PREC.postfix, seq(expr($), alias($._immediate_question, '?'))),
  };
  return rules;
}

/**
 * `rule` one or more times, separated by `separator`, with an optional trailing separator.
 * @param {RuleOrLiteral} rule
 * @param {RuleOrLiteral} separator
 */
function lines(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)), optional(separator));
}

/** @param {RuleOrLiteral} rule */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

/** @param {RuleOrLiteral} rule */
function commaSep(rule) {
  return optional(commaSep1(rule));
}
