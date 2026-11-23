// Inventory of every className-style JSX attribute in a package's src.
// Usage: node sites.mjs <pkgDir> <out.json>
// Each site: file, attr, element, source (import of the element's root), static class string
// (or null with the expression's code), literal props, whether a matching style prop exists.
import { parse } from '@babel/parser';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [pkg, out] = process.argv.slice(2);
const files = execFileSync('git', ['ls-files', 'src'], { cwd: pkg, encoding: 'utf8' })
  .split('\n')
  .filter(
    (f) => /\.tsx?$/.test(f) && !f.includes('__tests__') && !/\.(test|spec|stories)\.tsx?$/.test(f),
  );

export function parseFile(src) {
  return parse(src, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
}

const STYLE_OF = {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
  columnWrapperClassName: 'columnWrapperStyle',
};

function staticString(v) {
  if (!v) return null;
  if (v.type === 'StringLiteral') return v.value;
  if (v.type === 'JSXExpressionContainer') {
    const e = v.expression;
    if (e.type === 'StringLiteral') return e.value;
    if (e.type === 'TemplateLiteral' && e.expressions.length === 0) return e.quasis[0].value.cooked;
  }
  return null;
}

function literal(v) {
  if (v === null) return true;
  if (v.type === 'StringLiteral') return v.value;
  if (v.type === 'JSXExpressionContainer') {
    const e = v.expression;
    if (['StringLiteral', 'NumericLiteral', 'BooleanLiteral'].includes(e.type)) return e.value;
  }
  return undefined;
}

const sites = [];
for (const rel of files) {
  const file = path.join(pkg, rel);
  const src = fs.readFileSync(file, 'utf8');
  if (!/[cC]lassName/.test(src)) continue;
  let ast;
  try {
    ast = parseFile(src);
  } catch (e) {
    console.error('PARSE', rel, e.message);
    continue;
  }
  const imports = {};
  for (const n of ast.program.body)
    if (n.type === 'ImportDeclaration')
      for (const s of n.specifiers)
        imports[s.local.name] = { source: n.source.value, imported: s.imported?.name ?? 'default' };
  let index = 0;
  const walk = (n) => {
    if (!n || typeof n.type !== 'string') return;
    if (n.type === 'JSXOpeningElement') {
      const name =
        n.name.type === 'JSXIdentifier'
          ? n.name.name
          : n.name.type === 'JSXMemberExpression'
            ? `${n.name.object.name}.${n.name.property.name}`
            : '?';
      const root = name.split('.')[0];
      for (const a of n.attributes) {
        if (a.type !== 'JSXAttribute' || !/[cC]lassName$/.test(a.name.name)) continue;
        const props = {};
        let styleAttr = null;
        for (const b of n.attributes) {
          if (b.type !== 'JSXAttribute') continue;
          if (b.name.name === STYLE_OF[a.name.name])
            styleAttr = src.slice(b.value.start, b.value.end);
          if (/[cC]lassName$/.test(b.name.name) || b.name.name === 'style') continue;
          const lit = literal(b.value);
          if (lit !== undefined) props[b.name.name] = lit;
        }
        const cls = staticString(a.value);
        sites.push({
          file: rel,
          line: a.loc.start.line,
          index: index++,
          attr: a.name.name,
          element: name,
          source: imports[root]?.source ?? (root[0] === root[0].toLowerCase() ? 'host' : 'local'),
          imported: imports[root]?.imported ?? root,
          className: cls,
          expression: cls === null ? src.slice(a.value.start, a.value.end) : null,
          props,
          attrNames: n.attributes.filter((b) => b.type === 'JSXAttribute').map((b) => b.name.name),
          style: styleAttr,
          selfClosing: n.selfClosing,
        });
      }
    }
    for (const key of Object.keys(n)) {
      if (key === 'loc') continue;
      const v = n[key];
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(ast.program);
}
fs.writeFileSync(out, JSON.stringify(sites, null, 1));
const dynamic = sites.filter((s) => s.className === null);
console.log(
  `${sites.length} sites, ${dynamic.length} dynamic, ${new Set(sites.map((s) => s.file)).size} files`,
);
