/*! Prism component for Bloom, the language by Oxy (.bloom). https://github.com/OxyHQ/Bloom (The Breathe License). */
// One file, three ways in: a <script> after Prism's own registers `Prism.languages.bloom` on the
// global `Prism`; `require('prism-bloom')` after `require('prismjs')` does too (prismjs sets the
// global in Node); and the module's value is `bloom(Prism)`, the function refractor registers.
((root, factory) => {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  // biome-ignore lint/complexity/useOptionalChain: ES5, as Prism's own components are, for any page.
  if (root && root.Prism) factory(root.Prism);
})(typeof globalThis !== 'undefined' ? globalThis : this, function bloom(Prism) {
  var interpolation = {
    pattern: /\\\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)|\$\{(?:[^{}]|\{[^{}]*\})*\}/,
    inside: {
      'interpolation-punctuation': { pattern: /^\\\(|^\$\{|[)}]$/, alias: 'punctuation' },
      rest: null,
    },
  };
  var stringInside = {
    interpolation: interpolation,
    escape: { pattern: /\\(?:[nt"\\$]|u\{[0-9A-Fa-f]{1,6}\})/, alias: 'entity' },
    string: /[\s\S]+/,
  };

  Prism.languages.bloom = {
    comment: [
      {
        // Block comments nest: `/* a /* b */ c */`.
        pattern: /\/\*(?:[^*/]|\*(?!\/)|\/(?!\*)|\/\*(?:[^*/]|\*(?!\/)|\/(?!\*))*\*\/)*\*\//,
        greedy: true,
      },
      { pattern: /\/\/.*/, greedy: true },
    ],
    'string-literal': [
      // A raw multi-line string; interpolation kept.
      { pattern: /"""[\s\S]*?"""/, greedy: true, inside: stringInside },
      {
        pattern:
          /"(?:\\(?:\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)|[\s\S])|\$\{(?:[^{}"]|\{[^{}]*\})*\}|[^\\"\r\n])*"/,
        greedy: true,
        inside: stringInside,
      },
    ],
    // An enum case or token where a value is expected: `= .loading`, `.padding(.md)`,
    // `[.iOS(17), .web]`, `c ? .danger : .neutral`, `case .ready(x)`, `catch .offline`.
    'implicit-member': {
      pattern: /((?:[=(,:?[!]|=>|&&|\|\||\b(?:return|case|catch|throw|in|let|var))\s*)\.[a-z_]\w*/,
      lookbehind: true,
      alias: 'constant',
    },
    // 0.x `@state`; 2.0 `@State`, `@Environment(\.k)`, `@Observable`, `@extern("name")`.
    attribute: { pattern: /@[A-Za-z_]\w*/, alias: 'atrule' },
    // A test macro: `#expect(…)`.
    macro: { pattern: /#[A-Za-z_]\w*/, alias: 'property' },
    // A key path: `\.likes`, `\Post.title`.
    'key-path': { pattern: /\\(?:[A-Z]\w*)?\.[A-Za-z_]\w*/, alias: 'property' },
    'class-name': {
      // `struct Post`, `class FeedModel`, `actor Counter`, `view Composer`, `import Bloom`.
      pattern:
        /(\b(?:struct|enum|class|actor|protocol|extension|type|view|screen|layout|import)\s+)[A-Z]\w*(?:\.[A-Za-z_]\w*)*/,
      lookbehind: true,
    },
    'function-definition': {
      // 0.x `fn send`, 2.0 `func send`, and an operator's `static func ==`.
      pattern: /(\b(?:fn|func)\s+)(?:[A-Za-z_]\w*|[-+*/%=<>!&|]+)/,
      lookbehind: true,
      alias: 'function',
    },
    // A loop's label: `outer: for row in grid {`, and the one `break outer` and `continue outer` name.
    label: [
      {
        pattern: /(^|[^.\w$])[a-z_]\w*(?=\s*:\s*(?:for|while|repeat)\b)/,
        lookbehind: true,
        alias: 'symbol',
      },
      {
        pattern:
          /(\b(?:break|continue)[ \t]+)(?!(?:case|default|else|return|if|for|while|let|var)\b)[a-z_]\w*/,
        lookbehind: true,
        alias: 'symbol',
      },
    ],
    // `label:` in an argument list, a parameter or a field is never a keyword (`type: "error"`),
    // except a switch's `default:`.
    'argument-label': { pattern: /(^|[^.\w$])(?!default\b)[a-z_]\w*(?=:(?!:))/, lookbehind: true },
    keyword: [
      /\b(?:try|as)[?!]/,
      /\b(?:public|internal|private|fileprivate)\(set\)/,
      {
        pattern:
          /^([ \t]*)(?:test(?=\s*\()|effect(?=\s*[({])|equal(?=\s*\(\s*[a-z_]\w*\s*,\s*[a-z_]\w*\s*\)\s*\{))/m,
        lookbehind: true,
      },
      /\b(?:open|actor)(?=\s+(?:public|private|static|final|class|actor|func|var|let|init|[A-Z]\w*)\b)/,
      // `actor Ledger`: the class-name token has taken the name, so the declaration's `actor` ends
      // what is left before it.
      /\bactor(?=\s+$)/,
      /\b(?:get|set)\b(?=\s*(?:set\s*)?\})/,
      /\bextern\s+(?:module|native)\b/,
      /\b(?:any|as|async|await|body|break|case|catch|class|continue|default|defer|do|else|enum|extension|extern|fallthrough|fileprivate|final|fn|for|from|func|guard|if|import|in|init|internal|is|layout|let|match|mutating|nonisolated|private|protocol|pub|public|repeat|rethrows|return|screen|some|static|struct|switch|task|throw|throws|try|type|var|view|where|while)\b/,
    ],
    boolean: /\b(?:true|false)\b/,
    nil: { pattern: /\bnone\b/, alias: 'constant' },
    'self-keyword': { pattern: /\b(?:self|Self)\b/, alias: 'keyword' },
    // `$0`, `$1`: a closure's unnamed arguments; `$draft`: a binding.
    'short-argument': { pattern: /\$\d+\b/, alias: 'variable' },
    binding: { pattern: /\$[A-Za-z_]\w*/, alias: 'variable' },
    number:
      /\b(?:0x[0-9A-Fa-f](?:_?[0-9A-Fa-f])*|[0-9](?:_?[0-9])*(?:\.[0-9](?:_?[0-9])*)?(?:[eE][+-]?[0-9]+)?)\b/,
    'class-name-reference': { pattern: /\b[A-Z]\w*/, alias: 'class-name' },
    function: /\b[a-z_]\w*(?=\s*\()/,
    operator: /=>|->|\.\.<|\.\.\.|\.\.|\?\?|[!=]==|[!=<>]=|&&|\|\||[-+*/%]=?|[!?&|<>=\\]/,
    punctuation: /[{}[\]();,.:]/,
  };
  interpolation.inside.rest = Prism.languages.bloom;
});
