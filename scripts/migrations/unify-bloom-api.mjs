/** Import-aware migration. Defaults to preview; --write applies safe literal edits.
 * Dynamic variants/spreads are reported for review, never guessed.
 * Usage: node scripts/migrations/unify-bloom-api.mjs --write src templates docs
 */
import ts from 'typescript';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const buttonKinds = new Set([
  'Button',
  'PrimaryButton',
  'SecondaryButton',
  'IconButton',
  'GhostButton',
  'TextButton',
  'InverseButton',
  'OutlineButton',
  'LinkButton',
  'DestructiveButton',
  'CloseButton',
]);
const buttonVariants = {
  primary: ['solid', 'accent'],
  secondary: ['outline', 'neutral'],
  outline: ['outline', 'neutral'],
  icon: ['outline', 'neutral'],
  ghost: ['subtle', 'accent'],
  text: ['plain', 'accent'],
  destructive: ['solid', 'danger'],
};
const cardVariants = { plain: 'solid', elevated: 'solid', outlined: 'outline', filled: 'subtle' };
const sizes = { small: 'sm', medium: 'md', large: 'lg', default: 'md', icon: 'md' };

export function migrateSource(
  source,
  filename = 'consumer.tsx',
  snippets = false,
  internal = false,
) {
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const edits = [];
  const warnings = [];
  const bindings = new Map();
  const additions = new Map();
  const edit = (start, end, text) => {
    if (text === '') {
      const lineStart = source.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = source.indexOf('\n', end);
      if (
        lineEnd >= 0 &&
        !source.slice(lineStart, start).trim() &&
        !source.slice(end, lineEnd).trim()
      ) {
        start = lineStart;
        end = lineEnd + 1;
      }
    }
    edits.push({ start, end, text });
  };
  const warn = (node, reason) =>
    warnings.push({
      line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1,
      reason,
    });
  const recognized = (name) =>
    buttonKinds.has(name) ||
    [
      'Card',
      'Switch',
      'ControlSurface',
      'TextField',
      'TextFieldInput',
      'Textarea',
      'TimeField',
      'Select',
      'SelectTrigger',
      'Checkbox',
      'ButtonGroup',
      'ButtonGroupItem',
      'Stepper',
      'FollowButton',
      'FilterTriggerButton',
      'NoteEditor',
      'NoteEditorToolbar',
      'TagField',
      'Radio',
      'RadioGroup',
      'RadioCard',
      'Loading',
      'InputGroup',
      'SegmentedControl',
      'Fab',
      'CallControl',
      'RatingInput',
      'PlayButton',
      'LikeButton',
      'ReactionPicker',
      'TransportControls',
      'PlaybackSpeedMenu',
      'SleepTimerMenu',
    ].includes(name);
  const isBloom = (module) =>
    /^@oxy\.so\/bloom(?:\/|$)/.test(module) ||
    (internal &&
      /^(?:\.\.?\/)+(?:.*\/)?(?:button|card|switch|control-surface|text-field|textarea|time-field|select|checkbox|button-group|stepper|media-header|stay-filters|note-editor|tag-field|date-picker|radio|loading|input-group|segmented-control|fab|call-ui|rating|media-controls|chat-composer|media-player)(?:\/.*)?$/.test(
        module,
      ));
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
      continue;
    const module = statement.moduleSpecifier.text;
    if (!isBloom(module)) continue;
    const imports = statement.importClause?.namedBindings;
    if (imports && ts.isNamespaceImport(imports))
      warn(statement, 'Namespace import: review component props manually');
    if (
      module.includes('control-surface') &&
      imports &&
      ts.isNamedImports(imports) &&
      imports.elements.some((item) => (item.propertyName ?? item.name).text !== 'ControlSurface')
    ) {
      warn(
        statement,
        'ControlSurface hook/type imports need manual migration to the appearance contract',
      );
      continue;
    }
    if (imports && ts.isNamedImports(imports))
      for (const specifier of imports.elements) {
        const imported = (specifier.propertyName ?? specifier.name).text;
        if (!recognized(imported)) continue;
        bindings.set(specifier.name.text, { imported, module, imports, specifier, statement });
      }
  }
  const declaredNames = new Set();
  const collectName = (name) => {
    if (!name) return;
    if (ts.isIdentifier(name)) declaredNames.add(name.text);
    else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name))
      for (const item of name.elements) if (ts.isBindingElement(item)) collectName(item.name);
  };
  const collect = (node) => {
    if (
      ts.isImportSpecifier(node) ||
      ts.isNamespaceImport(node) ||
      ts.isImportClause(node) ||
      ts.isVariableDeclaration(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isParameter(node)
    )
      collectName(node.name);
    ts.forEachChild(node, collect);
  };
  collect(file);
  const bindingFor = (name) =>
    bindings.get(name) ??
    (snippets && !declaredNames.has(name) && recognized(name) ? { imported: name } : undefined);
  const requireName = (name, binding) => {
    for (const [local, existing] of bindings) if (existing.imported === name) return local;
    if (!binding.imports) return name;
    const key = binding.imports;
    const names = additions.get(key) ?? new Set();
    // Avoid shadowing an unrelated import/local declaration.
    if (declaredNames.has(name)) return null;
    names.add(name);
    additions.set(key, names);
    return name;
  };
  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(file);
      const binding = bindingFor(tag);
      if (binding) {
        const kind = binding.imported;
        const attrs = new Map(
          node.attributes.properties
            .filter(ts.isJsxAttribute)
            .map((a) => [a.name.getText(file), a]),
        );
        const getValue = (attr) => {
          if (!attr?.initializer) return undefined;
          const i = attr.initializer;
          if (ts.isStringLiteral(i)) return i.text;
          if (ts.isJsxExpression(i) && i.expression && ts.isStringLiteral(i.expression))
            return i.expression.text;
          return undefined;
        };
        const add = (name, value) => {
          if (!attrs.has(name))
            edit(
              node.attributes.end,
              node.attributes.end,
              ` ${name}${value === true ? '' : `="${value}"`}`,
            );
        };
        const rename = (newName) => {
          const local = requireName(newName, binding);
          if (!local) {
            warn(node, `Name ${newName} is already used; migrate this element manually`);
            return false;
          }
          edit(node.tagName.getStart(file), node.tagName.end, local);
          if (ts.isJsxOpeningElement(node) && ts.isJsxElement(node.parent))
            edit(
              node.parent.closingElement.tagName.getStart(file),
              node.parent.closingElement.tagName.end,
              local,
            );
          return true;
        };
        const variant = attrs.get('variant');
        const value = getValue(variant);
        if (variant && node.attributes.properties.some(ts.isJsxSpreadAttribute)) {
          warn(
            variant,
            'A spread may supply appearance/tone; migrate the variant with explicit precedence',
          );
          ts.forEachChild(node, visit);
          return;
        }
        if (
          buttonKinds.has(kind) &&
          kind !== 'LinkButton' &&
          (value === 'inverse' || value === 'link') &&
          (attrs.has('appearance') || attrs.has('tone') || attrs.has('colors'))
        ) {
          warn(variant, 'Link/inverse with explicit visual axes requires semantic review');
          ts.forEachChild(node, visit);
          return;
        }
        if ((buttonKinds.has(kind) || kind === 'Card') && variant) {
          if (value === undefined)
            warn(variant, `${kind} dynamic variant requires semantic migration`);
          else if (kind === 'LinkButton')
            edit(variant.name.getStart(file), variant.name.end, 'linkTone');
          else if (kind === 'Card' && cardVariants[value]) {
            edit(variant.getStart(file), variant.end, '');
            add('appearance', cardVariants[value]);
            if (value === 'plain' && !attrs.has('appearance')) add('elevation', 'none');
          } else if (buttonKinds.has(kind) && (value === 'inverse' || value === 'link')) {
            if (rename(value === 'inverse' ? 'InverseButton' : 'LinkButton'))
              edit(variant.getStart(file), variant.end, '');
          } else if (buttonKinds.has(kind) && buttonVariants[value]) {
            edit(variant.getStart(file), variant.end, '');
            add('appearance', buttonVariants[value][0]);
            add('tone', buttonVariants[value][1]);
            if (value === 'icon') add('iconOnly', true);
          } else warn(variant, `Unknown ${kind} variant ${value}`);
        }
        if (kind === 'Fab') {
          for (const old of ['placement', 'offset', 'zIndex', 'minimizeBehavior', 'children'])
            if (attrs.has(old))
              warn(
                attrs.get(old),
                `Fab ${old} must move to its Screen/BottomBar parent or explicit collapsed state`,
              );
          if (variant) {
            const tones = {
              primary: 'accent',
              secondary: 'support',
              tertiary: 'action',
              surface: 'neutral',
            };
            if (tones[value]) {
              edit(variant.getStart(file), variant.end, '');
              add('tone', tones[value]);
              add('appearance', value === 'surface' ? 'subtle' : 'solid');
            } else warn(variant, 'Dynamic Fab variant requires semantic migration');
          }
        }
        const size = attrs.get('size');
        const sizeValue = getValue(size);
        if (kind === 'Fab' && size && sizeValue === undefined)
          warn(
            size,
            'Fab size must be a canonical preset; migrate numeric/dynamic geometry explicitly',
          );
        const mappedSize =
          kind === 'Fab' && sizeValue === 'small'
            ? 'xs'
            : ['TransportControls', 'PlaybackSpeedMenu', 'SleepTimerMenu'].includes(kind)
              ? ({ compact: 'sm', regular: 'md', large: 'lg' }[sizeValue] ?? sizes[sizeValue])
              : sizes[sizeValue];
        if (mappedSize) {
          edit(size.initializer.getStart(file), size.initializer.end, `"${mappedSize}"`);
          if (sizeValue === 'icon') add('iconOnly', true);
        }
        if (kind === 'Switch' || ['Radio', 'RadioGroup', 'RadioCard'].includes(kind))
          for (const [old, replacement] of kind === 'Switch'
            ? [
                ['value', 'checked'],
                ['onValueChange', 'onCheckedChange'],
              ]
            : [
                ['selected', 'checked'],
                ['onSelect', 'onValueChange'],
              ]) {
            const attr = attrs.get(old);
            if (attr) {
              if (attrs.has(replacement)) edit(attr.getStart(file), attr.end, '');
              else edit(attr.name.getStart(file), attr.name.end, replacement);
            }
          }
        if (kind === 'ControlSurface') {
          const density = attrs.get('density');
          if (density) {
            edit(density.name.getStart(file), density.name.end, 'size');
            const v = getValue(density);
            if (sizes[v])
              edit(density.initializer.getStart(file), density.initializer.end, `"${sizes[v]}"`);
            else if (v === undefined)
              warn(density, 'Dynamic density: migrate values to xs/sm/md/lg');
          }
          if (tag === 'ControlSurface') {
            edit(node.tagName.getStart(file), node.tagName.end, 'BloomScope');
            if (ts.isJsxOpeningElement(node) && ts.isJsxElement(node.parent))
              edit(
                node.parent.closingElement.tagName.getStart(file),
                node.parent.closingElement.tagName.end,
                'BloomScope',
              );
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  for (const [local, binding] of bindings)
    if (binding.imported === 'ControlSurface') {
      edit(
        binding.specifier.getStart(file),
        binding.specifier.end,
        local === 'ControlSurface' ? 'BloomScope' : `BloomScope as ${local}`,
      );
      if (binding.module.includes('control-surface'))
        edit(
          binding.statement.moduleSpecifier.getStart(file),
          binding.statement.moduleSpecifier.end,
          JSON.stringify(binding.module.replace(/control-surface(?:\/.*)?$/, 'appearance')),
        );
    }
  for (const [imports, names] of additions) {
    // The closing brace is stable even with a trailing comma.
    const last = imports.elements.at(-1);
    const trailing = last && source.slice(last.end, imports.end - 1).includes(',');
    edit(
      imports.end - 1,
      imports.end - 1,
      `${last && !trailing ? ',' : ''} ${[...names].join(', ')} `,
    );
  }
  const unique = [...new Map(edits.map((e) => [`${e.start}:${e.end}:${e.text}`, e])).values()];
  unique.sort((a, b) => b.start - a.start || b.end - a.end);
  let output = source;
  for (const e of unique) output = output.slice(0, e.start) + e.text + output.slice(e.end);
  return { source: output, warnings };
}

function migrateFile(source, filename, internal) {
  if (!filename.endsWith('.mdx') && !filename.endsWith('.md'))
    return migrateSource(source, filename, false, internal);
  const warnings = [];
  const output = source.replace(
    /```(?:tsx|jsx|typescript|ts)\n([\s\S]*?)```/g,
    (block, code, offset) => {
      const result = migrateSource(code, filename, internal, internal);
      warnings.push(
        ...result.warnings.map((w) => ({
          ...w,
          line: w.line + source.slice(0, offset).split('\n').length,
        })),
      );
      return block.replace(code, result.source);
    },
  );
  return { source: output, warnings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const internal = args.includes('--internal');
  const exclude =
    args
      .find((a) => a.startsWith('--exclude='))
      ?.slice(10)
      .split(',') ?? [];
  const roots = args.filter((a) => !a.startsWith('--'));
  if (!roots.length) {
    console.error(
      'Usage: node scripts/migrations/unify-bloom-api.mjs [--write] [--internal] [--exclude=path,...] <paths...>',
    );
    process.exit(1);
  }
  let changed = 0,
    pending = 0;
  const walk = (path) => {
    if (exclude.some((prefix) => resolve(path).startsWith(resolve(prefix)))) return;
    if (statSync(path).isDirectory()) {
      for (const entry of readdirSync(path))
        if (!['node_modules', '.git', '.worktrees', 'lib'].includes(entry))
          walk(`${path}/${entry}`);
    } else if (/\.(tsx?|jsx?|mdx?)$/.test(path)) {
      const input = readFileSync(path, 'utf8');
      const result = migrateFile(input, path, internal);
      if (result.source !== input) {
        changed++;
        console.log(`${write ? 'update' : 'preview'} ${relative(process.cwd(), path)}`);
        if (write) writeFileSync(path, result.source);
      }
      for (const warning of result.warnings) {
        pending++;
        console.error(`${relative(process.cwd(), path)}:${warning.line}: ${warning.reason}`);
      }
    }
  };
  roots.forEach(walk);
  console.log(
    `${write ? 'Updated' : 'Would update'} ${changed} files; ${pending} expressions need review.`,
  );
}
