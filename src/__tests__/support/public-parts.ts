/** Public React parts, resolved from package entrypoints with the TypeScript checker.
 * This enumerates contracts; it never treats a hook import or reachability as adoption.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { REPO_ROOT } from './adoption-matrix';

export interface PublicPart {
  id: string;
  names: string[];
  routes: string[];
  platforms: Array<'native' | 'web'>;
  declarations: string[];
  propsStatus: Record<string, 'typed' | 'none' | 'any' | 'unknown'>;
  props: Record<string, { type: string; literals: string[] }>;
}
export interface PartCensus {
  parts: PublicPart[];
  unresolved: string[];
  entrypoints: Record<'native' | 'web', string[]>;
}
const ROOT = REPO_ROOT;
type Entry = { route: string; file: string };
const own = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
function conditionSource(value: unknown): string | undefined {
  if (typeof value === 'string') {
    if (value.startsWith('./src/')) return value;
    return value
      .replace(/^\.\/lib\/(?:typescript\/(?:module|commonjs)|module|commonjs)\//, './src/')
      .replace(/\.d\.ts$|\.js$/, '.ts');
  }
  if (!own(value)) return undefined;
  if (typeof value.default === 'string' && value.default.startsWith('./src/')) return value.default;
  return conditionSource(value.types ?? value.default ?? value.import ?? value.require);
}
function sourceFile(path: string): string | undefined {
  for (const file of [path, path.replace(/\.ts$/, '.tsx')]) if (existsSync(file)) return file;
  return undefined;
}
function entrypoints(root: string, platform: 'native' | 'web'): Entry[] {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    exports: Record<string, unknown>;
  };
  const entries: Entry[] = [];
  for (const [route, entry] of Object.entries(pkg.exports)) {
    if (!own(entry)) continue; // package.json, fonts and CSS have no React exports.
    const path = conditionSource(
      platform === 'web'
        ? (entry.browser ?? entry['react-native'] ?? entry.import)
        : (entry['react-native'] ?? entry.import),
    );
    if (!path?.startsWith('./src/')) continue;
    const absolute = resolve(root, path);
    if (path.includes('*')) {
      const directory = dirname(absolute);
      const [before, suffix] = absolute.slice(directory.length + 1).split('*');
      const after = suffix!.replace(/\.tsx$/, '.ts');
      for (const name of readdirSync(directory).sort()) {
        // A source wildcard may target TS or TSX (the packed mapping uses JS).
        const stem = name.replace(/\.tsx?$/, '.ts');
        if (!stem.startsWith(before!) || !stem.endsWith(after!)) continue;
        const replacement = stem.slice(before!.length, stem.length - after!.length);
        entries.push({ route: route.replace('*', replacement), file: join(directory, name) });
      }
    } else {
      const file = sourceFile(absolute);
      if (!file) throw Error(`Public entrypoint has no source: ${platform} ${route} -> ${path}`);
      entries.push({ route, file });
    }
  }
  return entries.sort((a, b) => a.route.localeCompare(b.route));
}
function literals(type: ts.Type): string[] {
  if (type.isUnion()) return [...new Set(type.types.flatMap(literals))].sort();
  if (type.isStringLiteral() || type.isNumberLiteral()) return [String(type.value)];
  return [];
}
function localPath(root: string, file: string) {
  return relative(root, file).split('\\').join('/');
}

export function derivePublicParts(root = ROOT): PartCensus {
  const rows = new Map<string, PublicPart>();
  const unresolved: string[] = [];
  const published: PartCensus['entrypoints'] = { native: [], web: [] };
  for (const platform of ['native', 'web'] as const) {
    const entries = entrypoints(root, platform);
    published[platform] = entries.map(({ route }) => route);
    const probe = join(root, '__public_parts_probe__.tsx');
    const probeText =
      "import type { JSXElementConstructor, ExoticComponent } from 'react'; export type Component = JSXElementConstructor<never> | ExoticComponent<never>;";
    const options: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      moduleSuffixes: platform === 'web' ? ['.web', ''] : ['.native', ''],
    };
    const host = ts.createCompilerHost(options);
    const get = host.getSourceFile.bind(host);
    host.getSourceFile = (file, language, onError, fresh) =>
      file === probe
        ? ts.createSourceFile(file, probeText, language, true, ts.ScriptKind.TSX)
        : get(file, language, onError, fresh);
    const program = ts.createProgram(
      [...new Set(entries.map(({ file }) => file)), probe],
      options,
      host,
    );
    const checker = program.getTypeChecker();
    const probeSource = program.getSourceFile(probe)!;
    const probeModule = checker.getSymbolAtLocation(probeSource)!;
    const contract = checker.getDeclaredTypeOfSymbol(
      checker.getExportsOfModule(probeModule).find((s) => s.name === 'Component')!,
    );
    const follow = (symbol: ts.Symbol): ts.Symbol =>
      symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    // A star export can retain a value symbol even when its route is type-only.
    // Follow export syntax as well as resolved symbols; do not count erased routes.
    function runtimeExport(module: ts.Symbol, name: string, seen = new Set<ts.Symbol>()): boolean {
      if (seen.has(module)) return false;
      const next = new Set(seen).add(module);
      for (const declaration of module.declarations ?? []) {
        const statements = ts.isSourceFile(declaration)
          ? declaration.statements
          : ts.isModuleDeclaration(declaration) &&
              declaration.body &&
              ts.isModuleBlock(declaration.body)
            ? declaration.body.statements
            : [];
        for (const statement of statements) {
          if (ts.isExportDeclaration(statement)) {
            if (statement.isTypeOnly) continue;
            const clause = statement.exportClause;
            if (clause && ts.isNamedExports(clause)) {
              if (clause.elements.some((part) => !part.isTypeOnly && part.name.text === name))
                return true;
            } else if (clause && ts.isNamespaceExport(clause)) {
              if (clause.name.text === name) return true;
            } else if (statement.moduleSpecifier) {
              const target = checker.getSymbolAtLocation(statement.moduleSpecifier);
              if (target && runtimeExport(follow(target), name, next)) return true;
            }
          } else if (ts.isExportAssignment(statement) && name === 'default') return true;
          else if (
            ts.canHaveModifiers(statement) &&
            ts
              .getModifiers(statement)
              ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
          ) {
            if (
              name === 'default' &&
              ts
                .getModifiers(statement)
                ?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)
            )
              return true;
            const exported = checker.getExportsOfModule(module).find((part) => part.name === name);
            if (
              exported?.declarations?.some(
                (part) =>
                  part.getSourceFile() === statement.getSourceFile() &&
                  part.pos >= statement.pos &&
                  part.end <= statement.end,
              )
            )
              return true;
          }
        }
      }
      return false;
    }
    // Object properties can be aliases without SymbolFlags.Alias (shorthand,
    // property assignment, or a typeof declaration on an external static).
    function valueSymbol(exported: ts.Symbol): ts.Symbol {
      let symbol = follow(exported);
      const seen = new Set<ts.Symbol>();
      while (!seen.has(symbol)) {
        seen.add(symbol);
        const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
        let target: ts.Symbol | undefined;
        if (declaration && ts.isShorthandPropertyAssignment(declaration))
          target = checker.getShorthandAssignmentValueSymbol(declaration);
        else if (
          declaration &&
          (ts.isPropertyAssignment(declaration) || ts.isPropertyDeclaration(declaration)) &&
          declaration.initializer &&
          (ts.isIdentifier(declaration.initializer) ||
            ts.isPropertyAccessExpression(declaration.initializer))
        )
          target = checker.getSymbolAtLocation(declaration.initializer);
        else if (
          declaration &&
          (ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration)) &&
          declaration.type &&
          ts.isTypeQueryNode(declaration.type)
        )
          target = checker.getSymbolAtLocation(declaration.type.exprName);
        if (!target) break;
        symbol = follow(target);
      }
      return symbol;
    }
    function visit(
      exported: ts.Symbol,
      route: string,
      name: string,
      ancestors: Set<ts.Symbol>,
      ancestorTypes = new Set<ts.Type>(),
      ownerDeclaration?: ts.Declaration,
    ) {
      const symbol = valueSymbol(exported);
      if (!(symbol.flags & (ts.SymbolFlags.Value | ts.SymbolFlags.Module))) return;
      const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0] ?? ownerDeclaration;
      if (!declaration) {
        unresolved.push(`${platform}:${route}#${name}: no declaration`);
        return;
      }
      const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
      // Visit value properties even when their container is not itself a React
      // component. Track both symbols and instantiated types: recursive object
      // properties need not resolve to the same symbol as their owner.
      if (!ancestors.has(symbol) && !ancestorTypes.has(type)) {
        const chain = new Set(ancestors).add(symbol);
        const types = new Set(ancestorTypes).add(type);
        if (symbol.flags & ts.SymbolFlags.Module) {
          for (const child of type.getProperties())
            if (runtimeExport(symbol, child.name))
              visit(child, route, `${name}.${child.name}`, chain, types, declaration);
        } else if (
          type.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection) &&
          !checker.isArrayType(type) &&
          !checker.isTupleType(type)
        ) {
          const callable =
            type.getCallSignatures().length > 0 || type.getConstructSignatures().length > 0;
          const exotic = Boolean(type.getProperty('$$typeof'));
          for (const child of type.getProperties()) {
            // Framework implementation/configuration is not a composed part.
            // Plain exported objects may still use names such as `type` or
            // `render`; only exotic React values own those framework slots.
            if (
              callable &&
              [
                'prototype',
                'defaultProps',
                'propTypes',
                'contextType',
                'contextTypes',
                'childContextTypes',
                'displayName',
              ].includes(child.name)
            )
              continue;
            if (exotic && ['$$typeof', 'type', 'render', 'compare'].includes(child.name)) continue;
            visit(child, route, `${name}.${child.name}`, chain, types, declaration);
          }
        }
      }
      // A function/namespace merge has both children and its own component
      // signature. Module traversal must not erase that callable root.
      if (!(symbol.flags & ts.SymbolFlags.Value)) return;
      // Resolve alias identity before considering JSX naming. A lower-case
      // alias of Primary still exposes that same component. Exotic markers and
      // element-return signatures also admit lower-case component values used
      // through createElement or namespaces; scalar-return hooks are not parts.
      const leaf = name.split('.').pop()!;
      const componentName = (value: string) => value === 'default' || !/^[a-z]/.test(value);
      const elementReturn = type.getCallSignatures().some((signature) => {
        const result = checker.getReturnTypeOfSignature(signature);
        return (result.isUnion() ? result.types : [result]).some(
          (value) =>
            value.getProperty('type') && value.getProperty('props') && value.getProperty('key'),
        );
      });
      if (
        !componentName(leaf) &&
        !componentName(symbol.name) &&
        !type.getProperty('$$typeof') &&
        !elementReturn
      )
        return;
      if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
        unresolved.push(`${platform}:${route}#${name}: ${checker.typeToString(type)}`);
        return;
      }
      if (!checker.isTypeAssignableTo(type, contract)) return;
      const declarationPath = localPath(root, declaration.getSourceFile().fileName);
      // Inline members belong to their lexical declaration, not every equally
      // named property in this file. Resolved aliases retain the target's ID.
      const identity = [symbol.name];
      if (
        ts.isPropertyAssignment(declaration) ||
        ts.isPropertySignature(declaration) ||
        ts.isPropertyDeclaration(declaration) ||
        ts.isMethodDeclaration(declaration)
      ) {
        let owner: ts.Node | undefined = declaration.parent;
        while (owner && !ts.isSourceFile(owner)) {
          if ('name' in owner && owner.name && ts.isIdentifier(owner.name as ts.Node))
            identity.unshift((owner.name as ts.Identifier).text);
          owner = owner.parent;
        }
      }
      const id = `${declarationPath.replace(/\.(?:web|native)(?=\.[^.]+$)/, '')}#${identity.join('.')}`;
      let row = rows.get(id);
      if (!row) {
        row = {
          id,
          names: [],
          routes: [],
          platforms: [],
          declarations: [],
          propsStatus: {},
          props: {},
        };
        rows.set(id, row);
      }
      row.names.push(name);
      row.routes.push(`${platform}:${route}#${name}`);
      row.platforms.push(platform);
      row.declarations.push(declarationPath);
      const signature = type.getCallSignatures()[0] ?? type.getConstructSignatures()[0];
      const parameter = signature?.parameters[0];
      row.propsStatus[platform] = 'none';
      if (parameter) {
        const props = checker.getTypeOfSymbolAtLocation(
          parameter,
          parameter.valueDeclaration ?? declaration,
        );
        row.propsStatus[platform] =
          props.flags & ts.TypeFlags.Any
            ? 'any'
            : props.flags & ts.TypeFlags.Unknown
              ? 'unknown'
              : 'typed';
        for (const key of [
          'size',
          'density',
          'contentDensity',
          'controlDensity',
          'textVariant',
          'width',
          'height',
        ]) {
          const member = props.getProperty(key);
          if (!member) continue;
          const value = checker.getTypeOfSymbolAtLocation(
            member,
            member.valueDeclaration ?? declaration,
          );
          row.props[`${platform}:${key}`] = {
            type: checker.typeToString(value, undefined, ts.TypeFormatFlags.NoTruncation),
            literals: literals(value),
          };
        }
      }
    }
    for (const entry of entries) {
      const source = program.getSourceFile(entry.file);
      const symbol = source && checker.getSymbolAtLocation(source);
      if (!symbol) {
        unresolved.push(`${platform}:${entry.route}: no module symbol`);
        continue;
      }
      for (const exported of checker.getTypeOfSymbolAtLocation(symbol, source!).getProperties())
        if (runtimeExport(symbol, exported.name))
          visit(exported, entry.route, exported.name, new Set());
    }
  }
  for (const row of rows.values()) {
    row.names = [...new Set(row.names)].sort();
    row.routes = [...new Set(row.routes)].sort();
    row.platforms = [...new Set(row.platforms)].sort();
    row.declarations = [...new Set(row.declarations)].sort();
  }
  return {
    parts: [...rows.values()].sort((a, b) => a.id.localeCompare(b.id)),
    unresolved: [...new Set(unresolved)].sort(),
    entrypoints: published,
  };
}
