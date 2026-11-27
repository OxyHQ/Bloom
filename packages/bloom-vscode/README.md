# Bloom for Visual Studio Code

Bloom, the language by Oxy: a Swift-like language for apps on iOS, Android and the web, written
in `.bloom` files and compiled by the Bloom compiler to the Bloom UI kit. This extension adds
`.bloom` support to VS Code and to editors that install from Open VSX.

## Features

- **Syntax highlighting** for Bloom 2.0 (structs, views, `@State`, `switch`, `guard`,
  `async`/`throws`, string interpolation, `"""` strings) and for 0.x files.
- **Diagnostics** as you type: the compiler's own errors and warnings, each with its `B` code.
- **Hover** with the type the checker found.
- **Go to definition** and **find all references**.
- **Completion** of names, members, modifiers and tokens.
- **Formatting** (Format Document): the layout of `bloom fmt`.
- **Snippets** for the 2.0 forms: `view`, `state`, `binding`, `func`, `async throws`, `switch`,
  `guard let`, `if let`, `do`, `for`, `enum`, `struct`, `protocol`, `extension`, `@Observable`,
  `test` and `Task`.
- Comment toggling, `///` doc comments continued on Enter, bracket matching and auto-closing
  (including `"""`), and indentation that follows `{`, `}` and `case`.

Diagnostics, hover, definitions, references, completion and formatting come from the Bloom
language server, `bloom lsp` (`bloomc lsp` is the same program), which the extension starts for
you.

## Requirements

Install the Bloom compiler in your project:

```sh
npm install --save-dev @oxy.so/bloom-language-compiler
# or: bun add --dev @oxy.so/bloom-language-compiler
```

In a trusted workspace, the extension runs the compiler from the project's own `node_modules`, so
the editor always checks with the version the project builds with. Otherwise it runs `bloomc`,
then `bloom`, from your `PATH`. Highlighting and snippets work without the compiler.

## Settings

| Setting | Default | What it does |
|---|---|---|
| `bloom.bloomcPath` | `bloomc` | The compiler to run as the language server, `bloom` or `bloomc`, by name or path. Left at the default, the workspace's own compiler is used first. |

The extension also sets 2-space indentation for `.bloom` files, as the formatter writes them.

In an untrusted workspace, the extension never runs a binary from the workspace: only
`bloom.bloomcPath` or the compiler on your `PATH`.

## A taste

```swift
/// A title and a count, one more with each press.
struct Counter: View {
  let title: String
  @State private var count = 0

  var body: some View {
    VStack {
      Text("\(title): \(count)")
      Button(Text("Add one")).onPress { count += 1 }
    }
    .spacing("md")
  }
}
```

## Learn the language

- [Getting started](https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-language-getting-started.mdx)
- [The tour](https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-language-tour.mdx)
- [The language specification](https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-lang-spec.mdx)
- [The toolchain: packages, modules and the `bloom` command](https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-toolchain.mdx)

## Feedback

Report a problem or ask a question in
[the Bloom issues](https://github.com/OxyHQ/Bloom/issues).

## License

The Breathe License 1.0, a source-available license: see
[LICENSE](https://github.com/OxyHQ/Bloom/blob/main/packages/bloom-vscode/LICENSE).
