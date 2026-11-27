/*! `bloom` grammar for highlight.js 11: Bloom, the language by Oxy. https://github.com/OxyHQ/Bloom (The Breathe License). Built from src/languages/bloom.js. */
"use strict";
var hljsGrammar = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/languages/bloom.js
  var bloom_exports = {};
  __export(bloom_exports, {
    default: () => bloom
  });
  function bloom(hljs) {
    const regex = hljs.regex;
    const IDENT = /[A-Za-z_][A-Za-z0-9_]*/;
    const TYPE_NAME = /[A-Z][A-Za-z0-9_]*/;
    const KEYWORDS = {
      $pattern: /[A-Za-z_][A-Za-z0-9_]*/,
      keyword: [
        "any",
        "as",
        "async",
        "await",
        "body",
        "break",
        "case",
        "catch",
        "class",
        "continue",
        "default",
        "defer",
        "do",
        "else",
        "enum",
        "extension",
        "extern",
        "fallthrough",
        "fileprivate",
        "final",
        "fn",
        "for",
        "from",
        "func",
        "guard",
        "if",
        "import",
        "in",
        "init",
        "internal",
        "is",
        "layout",
        "let",
        "match",
        "mutating",
        "nonisolated",
        "private",
        "protocol",
        "pub",
        "public",
        "repeat",
        "rethrows",
        "return",
        "screen",
        "some",
        "static",
        "struct",
        "switch",
        "task",
        "throw",
        "throws",
        "try",
        "type",
        "var",
        "view",
        "where",
        "while"
      ],
      literal: ["true", "false", "none"],
      type: [
        "Any",
        "Binding",
        "Bool",
        "CaseIterable",
        "Children",
        "Codable",
        "Comparable",
        "Decodable",
        "Double",
        "Encodable",
        "Equatable",
        "Error",
        "Float",
        "Foreign",
        "Hashable",
        "Identifiable",
        "Int",
        "Never",
        "Option",
        "Partial",
        "Promise",
        "Result",
        "Sendable",
        "String",
        "Unit",
        "View",
        "Void"
      ],
      "variable.language": ["self", "Self"]
    };
    const NUMBER = {
      scope: "number",
      relevance: 0,
      variants: [
        { match: /\b0x[0-9A-Fa-f](?:_?[0-9A-Fa-f])*\b/ },
        { match: /\b[0-9](?:_?[0-9])*(?:\.[0-9](?:_?[0-9])*)?(?:[eE][+-]?[0-9]+)?\b/ }
      ]
    };
    const ESCAPE = {
      scope: "char.escape",
      match: /\\(?:[nt"\\$]|u\{[0-9A-Fa-f]{1,6}\})/,
      relevance: 0
    };
    const PARENS = { begin: /\(/, end: /\)/, keywords: KEYWORDS, contains: [] };
    const INTERPOLATION = {
      scope: "subst",
      begin: /\\\(/,
      end: /\)/,
      keywords: KEYWORDS,
      contains: []
    };
    const LEGACY_INTERPOLATION = {
      scope: "subst",
      begin: /\$\{/,
      end: /\}/,
      keywords: KEYWORDS,
      contains: []
    };
    const STRING = {
      scope: "string",
      variants: [
        { begin: /"""/, end: /"""/ },
        { begin: /"/, end: /"|$/, illegal: /\n/ }
      ],
      contains: [ESCAPE, INTERPOLATION, LEGACY_INTERPOLATION]
    };
    const BLOCK_COMMENT = hljs.COMMENT(/\/\*/, /\*\//, { contains: ["self"] });
    const DOC_COMMENT = hljs.COMMENT(/\/\/\/(?!\/)/, /$/, { scope: "comment", relevance: 0 });
    const COMMENTS = [DOC_COMMENT, hljs.C_LINE_COMMENT_MODE, BLOCK_COMMENT];
    const DECLARATIONS = [
      {
        // `struct Post`, `class FeedModel`, `actor Counter`, `extension Post`, `type Tab`.
        match: [/\b(?:struct|enum|class|actor|protocol|extension|type)/, /\s+/, TYPE_NAME],
        scope: { 1: "keyword", 3: "title.class" }
      },
      {
        // 0.x `view Composer`, `screen Feed`, `layout Tabs`.
        match: [/\b(?:view|screen|layout)/, /\s+/, TYPE_NAME],
        scope: { 1: "keyword", 3: "title.class" }
      },
      {
        // 0.x `fn send`, 2.0 `func send`, and an operator's `static func ==`.
        match: [/\b(?:fn|func)/, /\s+/, regex.either(IDENT, /[-+*/%=<>!&|]+/)],
        scope: { 1: "keyword", 3: "title.function" }
      },
      {
        // `extern module "pkg" { … }`, `extern native "Name" { … }`.
        match: [/\bextern/, /\s+/, /module|native\b/],
        scope: { 1: "keyword", 3: "keyword" }
      },
      {
        // `import Bloom`, `import Mention.Posts`.
        match: [/\bimport/, /\s+/, /[A-Z][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/],
        scope: { 1: "keyword", 3: "title.class" }
      },
      // `test("…") { … }`, and the view members `effect { … }` and `equal(old, new) { … }`.
      { scope: "keyword", match: /^[ \t]*test(?=\s*\(\s*")/ },
      { scope: "keyword", match: /^[ \t]*effect(?=\s*[({])/ },
      { scope: "keyword", match: /^[ \t]*equal(?=\s*\(\s*[a-z_]\w*\s*,\s*[a-z_]\w*\s*\)\s*\{)/ },
      // `open` and `final` before a declaration; `private(set)`; a protocol's `{ get set }`.
      {
        scope: "keyword",
        match: /\bopen(?=\s+(?:public|private|static|final|class|actor|func|var|let|init)\b)/
      },
      { scope: "keyword", match: /\b(?:public|internal|private|fileprivate)\(set\)/ },
      { scope: "keyword", match: /\b(?:get|set)\b(?=\s*(?:set\s*)?\})/ },
      // `try?`, `try!`, `as?`, `as!`.
      { scope: "keyword", match: /\b(?:try|as)[?!]/ }
    ];
    const LABEL = {
      // `label:` in an argument list, a parameter or a field: never a keyword there
      // (`type: "error"`), except a switch's `default:`.
      match: /\b(?!default\b)[a-z_][A-Za-z0-9_]*(?=:(?!:))/,
      relevance: 0
    };
    const ATTRIBUTE = {
      // 0.x `@state`, 2.0 `@State`, `@Environment(\.locale)`, `@Observable`, `@extern("name")`.
      scope: "meta",
      match: /@[A-Za-z_][A-Za-z0-9_]*/
    };
    const MACRO = { scope: "meta", match: /#[A-Za-z_][A-Za-z0-9_]*/ };
    const KEY_PATH = {
      // `\.likes`, `\Post.title`.
      match: [/\\/, /(?:[A-Z][A-Za-z0-9_]*)?\.[A-Za-z_][A-Za-z0-9_]*/],
      scope: { 1: "operator", 2: "property" }
    };
    const CLOSURE_ARGUMENT = { scope: "variable.language", match: /\$[0-9]+\b/ };
    const BINDING = { scope: "variable", match: /\$[A-Za-z_][A-Za-z0-9_]*/ };
    const IMPLICIT_MEMBER = {
      // An enum case or token where a value is expected: `= .loading`, `.padding(.md)`,
      // `[.iOS(17), .web]`, `c ? .danger : .neutral`, `case .ready(x)`, `catch .offline`.
      scope: "symbol",
      match: /(?<=(?:[=(,:?[!]|=>|&&|\|\||\b(?:return|case|catch|throw|in|let|var))\s*)\.[a-z_][A-Za-z0-9_]*/
    };
    const TYPE = { scope: "type", match: /\b[A-Z][A-Za-z0-9_]*\b/, relevance: 0 };
    const CALL = {
      scope: "title.function.invoke",
      // Any word but a keyword (`if (…)`, `async (Draft) -> …`, `init(…)`, `throws(E)`).
      match: regex.concat(
        new RegExp(`\\b(?!(?:${[...KEYWORDS.keyword, "test"].join("|")})\\b)`),
        /[a-z_][A-Za-z0-9_]*(?=\s*\()/
      ),
      relevance: 0
    };
    const OPERATOR = {
      scope: "operator",
      match: /=>|->|\.\.<|\.\.\.|\.\.|\?\?|[!=<>]=|&&|\|\||[-+*/%]=?|[!?&|<>=]/,
      relevance: 0
    };
    const CODE = [
      ...COMMENTS,
      STRING,
      ATTRIBUTE,
      MACRO,
      KEY_PATH,
      ...DECLARATIONS,
      LABEL,
      NUMBER,
      CLOSURE_ARGUMENT,
      BINDING,
      IMPLICIT_MEMBER,
      TYPE,
      CALL,
      OPERATOR,
      PARENS
    ];
    PARENS.contains = CODE;
    INTERPOLATION.contains = CODE;
    LEGACY_INTERPOLATION.contains = CODE;
    return {
      name: "Bloom",
      aliases: ["bloom"],
      keywords: KEYWORDS,
      contains: CODE
    };
  }
  return __toCommonJS(bloom_exports);
})();
module.exports = hljsGrammar.default;
