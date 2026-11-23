// Rewrites a package's static className JSX into StyleSheet / createTokenStyles entries.
// Usage: node convert.mjs <pkgDir> <work dir with sites.json + resolved.json> [--dry]
// Reads <work>/manual.json: { "<file>:<line>": { "style": {...token-form...} } | { "skip": "reason" } }
// Writes <work>/table.json (every converted site with its token-form style) and edits files in place.
import { parse } from '@babel/parser';
import fs from 'node:fs';
import path from 'node:path';

const [pkg, work, flag] = process.argv.slice(2);
const dry = flag === '--dry';
const sites = JSON.parse(fs.readFileSync(path.join(work, 'sites.json'), 'utf8'));
const resolved = JSON.parse(fs.readFileSync(path.join(work, 'resolved.json'), 'utf8'));
const manualPath = path.join(work, 'manual.json');
const manual = fs.existsSync(manualPath) ? JSON.parse(fs.readFileSync(manualPath, 'utf8')) : {};

const STYLE_OF = {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
  columnWrapperClassName: 'columnWrapperStyle',
};
const BLOOM_TEXT = new Set(['Text']);
const BLOOM_HEADING = /^H[1-6]$/;

/* ----------------------------- Bloom 22 Text rule ----------------------------- */
// Port of Bloom 22's typographyKeysClaimedByClassName (src/typography/defaults.ts).
const SIZE_TOKEN =
  /^(?:xs|sm|base|lg|[1-9]?xl|title-[123]-(?:regular|medium|semibold|bold)|\[(?:length:)?-?[\d.]+(?:px|rem|em|%|pt|vw|vh)\])(?:\/.+)?$/;
const NON_COLOR_TEXT_TOKEN =
  /^(?:left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)$/;
const WEIGHT_TOKEN =
  /^(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\[\d+\])$/;
const NON_TYPOGRAPHIC_UTILITY =
  /^(?:-?(?:m|p)[trblxyse]?-|-?(?:inset|top|left|right|bottom|start|end|z|order|translate|rotate|scale|skew)-|(?:flex|grow|shrink|basis|w|h|min|max|size|gap|space|items|justify|self|content|place|col|row|grid|auto|overflow|rounded|border|divide|bg|from|via|to|shadow|opacity|tracking|align|whitespace|break|select|pointer|cursor|transition|duration|delay|ease|animate|aspect|object|ring|outline|fill|stroke|line-clamp|backdrop|blur|web|native|ios|android)(?:-|$)|(?:block|inline|inline-block|hidden|relative|absolute|fixed|sticky|static|truncate|uppercase|lowercase|capitalize|normal-case|italic|not-italic|underline|no-underline|line-through|sr-only|font-(?:sans|serif|mono|display)|grow|shrink)$)/;
function claimed(className) {
  const out = new Set();
  for (const raw of className.trim().split(/\s+/)) {
    const token = raw.replace(/^(?:[\w-]+:)*/, '').replace(/^!/, '');
    if (token.startsWith('text-')) {
      const rest = token.slice(5);
      if (SIZE_TOKEN.test(rest)) out.add('fontSize').add('lineHeight');
      else if (!NON_COLOR_TEXT_TOKEN.test(rest)) out.add('color');
    } else if (token.startsWith('leading-')) out.add('lineHeight');
    else if (token.startsWith('font-') && WEIGHT_TOKEN.test(token.slice(5))) out.add('fontWeight');
    else if (!NON_TYPOGRAPHIC_UTILITY.test(token))
      ['color', 'fontSize', 'lineHeight', 'fontWeight'].forEach((k) => out.add(k));
  }
  return out;
}

/* ------------------------------- style building ------------------------------- */
const RENAME = {
  paddingInline: 'paddingHorizontal',
  paddingBlock: 'paddingVertical',
  marginInline: 'marginHorizontal',
  marginBlock: 'marginVertical',
};

function tokenForm(style) {
  const out = {};
  for (let [k, v] of Object.entries(style)) {
    if (/Style$/.test(k) && k.startsWith('border') && v === 'solid') continue; // React Native's default
    if (k === 'borderRadius' && v > 9999) v = 9999; // rounded-full: Bloom's pill radius
    out[RENAME[k] ?? k] = v;
  }
  return out;
}

/** The style a site's class drew, as `style` on the same element under Bloom 23. */
function styleFor(site) {
  const r = resolved[site.className.trim().replace(/\s+/g, ' ')];
  if (!r) throw new Error(`unresolved string ${site.className}`);
  const isBloom = site.source.startsWith('@oxy.so/bloom');
  if (
    !isBloom &&
    !/^(react-native|react-native-css\/components|react-native-reanimated)$/.test(site.source)
  )
    return { reason: `own component from ${site.source}` };
  // A Bloom 22 heading under a class drew its Text with the display family and nothing of its ramp
  // (`createHeadingElement`); under Bloom 23 that is Bloom's Text as a heading, which takes the
  // display family from its role.
  const heading = isBloom && BLOOM_HEADING.test(site.imported) ? Number(site.imported.slice(1)) : 0;
  if (
    r.view &&
    Object.values(r.web).some((rules) => rules.some((rule) => rule.startsWith('@media')))
  )
    return { reason: 'responsive class' };
  const style = { ...(site.element === 'Text' ? r.text : r.view) };
  if (isBloom && (BLOOM_TEXT.has(site.imported) || heading)) {
    // Bloom 22 Text: the family is inline (it beats the class); its default fontSize and colour
    // are inline unless the class claims them, so a class value it does not claim never drew.
    if (/(?:^|\s)(?:[\w-]+:)*(?:font-mono|font-display|text-[3-9]xl)(?=\s|$)/.test(site.className))
      return { reason: 'Text family from class' };
    if (site.attrNames.includes('variant')) return { reason: 'Text with a variant' };
    const c = claimed(site.className);
    delete style.fontFamily;
    for (const k of ['fontSize', 'color']) if (!c.has(k)) delete style[k];
    for (const k of c)
      if (
        style[k] === undefined &&
        (k === 'fontSize' || k === 'color') &&
        !(k === 'color' && site.colourless)
      )
        return { reason: `Text: class claims ${k} without setting it` };
  }
  if (heading)
    return {
      style: tokenForm(style),
      after: { imported: 'Text', props: { role: 'heading', 'aria-level': heading } },
    };
  return { style: tokenForm(style) };
}

/* -------------------------------- code writing -------------------------------- */
function valueCode(v) {
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    let m = /^\$(\w+)$/.exec(v);
    if (m) return `t.${m[1]}`;
    m = /^tokenAlpha\(\$(\w+), ([\d.]+)\)$/.exec(v);
    if (m) return `tokenAlpha(t.${m[1]}, ${m[2]})`;
    return `'${v}'`;
  }
  throw new Error(`value ${JSON.stringify(v)}`);
}
const usesTokens = (style) =>
  Object.values(style).some((v) => typeof v === 'string' && v.includes('$'));
const usesAlpha = (style) =>
  Object.values(style).some((v) => typeof v === 'string' && v.startsWith('tokenAlpha'));

function baseName(site, style) {
  if (site.attr === 'contentContainerClassName') return 'content';
  if (site.element === 'Text' || BLOOM_HEADING.test(site.element)) {
    if (style.color === '$mutedForeground') return 'mutedText';
    if ((style.fontWeight ?? 0) >= 600 || (style.fontSize ?? 0) >= 18) return 'title';
    return 'text';
  }
  if (site.imported === 'Button') return 'button';
  if (site.imported === 'Card') return 'card';
  if (style.position === 'absolute') return 'overlay';
  if (style.flexDirection === 'row') return 'row';
  if (style.flexGrow === 1 && Object.keys(style).length <= 3) return 'fill';
  if (style.alignItems === 'center' && style.justifyContent === 'center') return 'centered';
  if (style.backgroundColor) return 'surface';
  if (style.gap !== undefined && Object.keys(style).length <= 2) return 'stack';
  if (Object.keys(style).every((k) => /^(padding|margin)/.test(k))) return 'section';
  return 'container';
}

/** Whether anything in the module declares a binding called `styles` (comments do not count). */
function declaresStyles(node) {
  let found = false;
  const walk = (n) => {
    if (found || !n || typeof n.type !== 'string') return;
    if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.id.name === 'styles')
      found = true;
    if (n.type === 'Identifier' && n.name === 'styles') found = true; // any use: param, destructure, member object
    for (const key of Object.keys(n)) {
      if (key === 'loc') continue;
      const v = n[key];
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(node);
  return found;
}

const byFile = {};
for (const s of sites) (byFile[s.file] ??= []).push(s);
const table = [];
const flagged = [];

for (const [rel, fileSites] of Object.entries(byFile)) {
  const file = path.join(pkg, rel);
  let src = fs.readFileSync(file, 'utf8');
  const ast = parse(src, { sourceType: 'module', plugins: ['typescript', 'jsx'] });

  // Plan each site.
  const plans = [];
  for (const site of fileSites) {
    const key = `${site.file}:${site.line}`;
    const m = manual[key];
    if (m?.skip) {
      flagged.push({ key, element: site.element, reason: `manual: ${m.skip}` });
      continue;
    }
    if (site.className === null && !m) {
      flagged.push({ key, element: site.element, reason: 'dynamic', expression: site.expression });
      continue;
    }
    // `colourless`: the class claimed the colour without setting one, so Bloom 22 drew the text with no
    // colour at all (the platform's default); it takes Bloom's text colour now. Listed in the table.
    const p = m?.style
      ? { style: m.style }
      : styleFor(m?.colourless ? { ...site, colourless: true } : site);
    if (p.reason) {
      flagged.push({ key, element: site.element, className: site.className, reason: p.reason });
      continue;
    }
    plans.push({
      site: m?.colourless ? { ...site, colourless: true } : site,
      style: p.style,
      after: p.after,
    });
  }
  if (plans.length === 0) continue;

  // A module-level `const styles = StyleSheet.create({...})` takes the static entries;
  // the colour entries then go in `useThemedStyles` (read as `themed`).
  let existingSheet = null;
  for (const n of ast.program.body) {
    const d = n.type === 'VariableDeclaration' ? n.declarations[0] : null;
    if (
      d?.id.name === 'styles' &&
      d.init?.type === 'CallExpression' &&
      src.slice(d.init.callee.start, d.init.callee.end) === 'StyleSheet.create' &&
      d.init.arguments[0]?.type === 'ObjectExpression'
    )
      existingSheet = d.init.arguments[0];
  }
  // A module that already binds `styles` otherwise gets its sheet as `viewStyles`.
  const own = !existingSheet && declaresStyles(ast.program) ? 'viewStyles' : 'styles';
  const ownHook = own === 'styles' ? 'useStyles' : 'useViewStyles';
  const names = new Set(existingSheet ? existingSheet.properties.map((x) => x.key.name) : []);
  const entries = new Map(); // `${sheet}|json` -> name
  for (const p of plans) {
    p.sheet = usesTokens(p.style) ? (existingSheet ? 'themed' : own) : own;
    const json = JSON.stringify(p.style);
    const k = `${p.sheet}|${json}`;
    if (!entries.has(k)) {
      const base = baseName(p.site, p.style);
      let name = base;
      for (let i = 2; names.has(name); i++) name = `${base}${i}`;
      names.add(name);
      entries.set(k, name);
    }
    p.entry = entries.get(k);
  }
  const tokens = plans.some((p) => usesTokens(p.style));
  const alpha = plans.some((p) => usesAlpha(p.style));

  // Locate attributes by walking in the same order as sites.mjs.
  const attrs = [];
  const fnStack = [];
  const parentsOf = new Map(); // JSXOpeningElement -> its JSXElement
  const hookTargets = new Map(); // function node start -> node
  const walk = (n, parents) => {
    if (!n || typeof n.type !== 'string') return;
    const isFn = /Function/.test(n.type);
    if (n.type === 'JSXElement') parentsOf.set(n.openingElement, n);
    if (n.type === 'JSXOpeningElement') {
      for (const a of n.attributes)
        if (a.type === 'JSXAttribute' && /[cC]lassName$/.test(a.name.name))
          attrs.push({ a, el: n, fns: [...fnStack] });
    }
    if (isFn) fnStack.push(n);
    for (const key of Object.keys(n)) {
      if (key === 'loc') continue;
      const v = n[key];
      if (Array.isArray(v)) v.forEach((c) => walk(c, parents));
      else if (v && typeof v === 'object') walk(v, parents);
    }
    if (isFn) fnStack.pop();
  };
  walk(ast.program);

  const edits = []; // {start, end, text}
  const closingOf = (opening) => parentsOf.get(opening)?.closingElement ?? null;
  if (plans.some((p) => p.after)) {
    const tb = ast.program.body.find(
      (n) => n.type === 'ImportDeclaration' && n.specifiers.some((x) => x.local.name === 'Text'),
    );
    if (tb && tb.source.value !== '@oxy.so/bloom/typography')
      throw new Error(`${rel}: Text is ${tb.source.value}`);
    if (!tb) {
      const typo = ast.program.body.find(
        (n) => n.type === 'ImportDeclaration' && n.source.value === '@oxy.so/bloom/typography',
      );
      const last = typo.specifiers[typo.specifiers.length - 1];
      edits.push({ start: last.end, end: last.end, text: ', Text' });
    }
  }
  const componentName = (fn) => {
    if (fn.id?.name) return fn.id.name;
    return null;
  };
  // Name of a function: its id, or the variable it initialises.
  const fnNames = new Map();
  const nameWalk = (n) => {
    if (!n || typeof n.type !== 'string') return;
    if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init) {
      let init = n.init;
      while (init.type === 'CallExpression' && init.arguments[0]) init = init.arguments[0]; // memo(forwardRef(fn))
      if (/Function/.test(init.type)) fnNames.set(init, n.id.name);
    }
    for (const key of Object.keys(n)) {
      if (key === 'loc') continue;
      const v = n[key];
      if (Array.isArray(v)) v.forEach(nameWalk);
      else if (v && typeof v === 'object') nameWalk(v);
    }
  };
  nameWalk(ast.program);

  for (const p of plans) {
    const { a, el, fns } = attrs[p.site.index];
    const styleProp = STYLE_OF[a.name.name];
    const existing = el.attributes.find(
      (b) => b.type === 'JSXAttribute' && b.name.name === styleProp,
    );
    const ref = `${p.sheet}.${p.entry}`;
    if (existing) {
      // react-native-css merged the class first and the inline style over it.
      const e = existing.value.expression;
      const inner =
        e.type === 'ArrayExpression'
          ? src.slice(e.start + 1, e.end - 1)
          : src.slice(e.start, e.end);
      edits.push({
        start: existing.value.start,
        end: existing.value.end,
        text: `{[${ref}, ${inner}]}`,
      });
      // remove the className attribute with its leading whitespace
      let s = a.start;
      while (/\s/.test(src[s - 1])) s--;
      edits.push({ start: s, end: a.end, text: '' });
    } else {
      edits.push({ start: a.start, end: a.end, text: `${styleProp}={${ref}}` });
    }
    if (p.after) {
      // The heading becomes Bloom's Text as a heading (opening and closing tag).
      edits.push({
        start: el.name.start,
        end: el.name.end,
        text: `Text role="heading" aria-level={${p.after.props['aria-level']}}`,
      });
      const closing = closingOf(el);
      if (closing) edits.push({ start: closing.name.start, end: closing.name.end, text: 'Text' });
    }
    if (p.sheet === 'themed' || (tokens && !existingSheet)) {
      // The hook goes in the nearest enclosing component (a capitalised function, or a hook).
      const comp = [...fns]
        .reverse()
        .find((f) => /^(?:[A-Z]|use[A-Z])/.test(fnNames.get(f) ?? componentName(f) ?? ''));
      if (!comp || comp.body.type !== 'BlockStatement') {
        flagged.push({
          key: `${p.site.file}:${p.site.line}`,
          reason: 'no component body for the hook',
        });
      } else hookTargets.set(comp.body.start, comp);
    }
  }
  if (
    flagged.some(
      (f) => f.reason === 'no component body for the hook' && f.key.startsWith(rel + ':'),
    )
  ) {
    console.error('SKIP FILE (hook placement)', rel);
    continue;
  }
  const hookCall = existingSheet
    ? 'const themed = useThemedStyles();'
    : `const ${own} = ${ownHook}();`;
  for (const [start] of hookTargets)
    edits.push({ start: start + 1, end: start + 1, text: `\n  ${hookCall}` });

  // The sheets.
  const entryCode = (sheet) =>
    [...entries]
      .filter(([k]) => k.startsWith(`${sheet}|`))
      .map(([k, name]) => {
        const st = JSON.parse(k.slice(sheet.length + 1));
        return `  ${name}: { ${Object.entries(st)
          .map(([a, v]) => `${a}: ${valueCode(v)}`)
          .join(', ')} },`;
      })
      .join('\n');
  if (existingSheet) {
    const add = entryCode('styles');
    if (add) {
      const closing = existingSheet.end - 1;
      const before = src.slice(existingSheet.start, closing).trimEnd();
      const comma = before.endsWith(',') || before.endsWith('{') ? '' : ',';
      edits.push({ start: closing, end: closing, text: `${comma}\n${add}\n` });
    }
    const themed = entryCode('themed');
    if (themed)
      edits.push({
        start: src.length,
        end: src.length,
        text: `\nconst useThemedStyles = createTokenStyles((t) => ({\n${themed}\n}));\n`,
      });
  } else {
    const body = entryCode(own);
    edits.push({
      start: src.length,
      end: src.length,
      text: tokens
        ? `\nconst ${ownHook} = createTokenStyles((t) => ({\n${body}\n}));\n`
        : `\nconst ${own} = StyleSheet.create({\n${body}\n});\n`,
    });
  }

  // Imports.
  const lastImport = ast.program.body.filter((n) => n.type === 'ImportDeclaration').pop();
  const importAt = lastImport ? lastImport.end : 0;
  const needRN = !tokens || (existingSheet && plans.some((p) => p.sheet === 'styles'));
  if (tokens) {
    const names = ['createTokenStyles', ...(alpha ? ['tokenAlpha'] : [])];
    edits.push({
      start: importAt,
      end: importAt,
      text: `\nimport { ${names.join(', ')} } from '@oxy.so/bloom/theme';`,
    });
  }
  if (needRN) {
    const rn = ast.program.body.find(
      (n) =>
        n.type === 'ImportDeclaration' &&
        n.source.value === 'react-native' &&
        n.importKind !== 'type',
    );
    const has = rn?.specifiers.some((s) => s.local.name === 'StyleSheet');
    if (!has) {
      if (rn && rn.specifiers.length && rn.specifiers.every((s) => s.type === 'ImportSpecifier')) {
        const last = rn.specifiers[rn.specifiers.length - 1];
        edits.push({ start: last.end, end: last.end, text: ', StyleSheet' });
      } else
        edits.push({
          start: importAt,
          end: importAt,
          text: `\nimport { StyleSheet } from 'react-native';`,
        });
    }
  }

  edits.sort((x, y) => y.start - x.start || y.end - x.end);
  for (const e of edits) src = src.slice(0, e.start) + e.text + src.slice(e.end);
  if (!dry) fs.writeFileSync(file, src);
  for (const p of plans)
    table.push({
      ...p.site,
      style: p.style,
      entry: p.entry,
      ...(p.after ? { after: p.after } : {}),
    });
}

fs.writeFileSync(path.join(work, 'table.json'), JSON.stringify(table, null, 1));
fs.writeFileSync(path.join(work, 'flagged.json'), JSON.stringify(flagged, null, 1));
console.log(`converted ${table.length}, flagged ${flagged.length}`);
for (const f of flagged)
  console.log('  FLAG', f.key, f.element ?? '', f.reason, f.className ?? f.expression ?? '');
