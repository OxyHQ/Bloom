/**
 * @jest-environment node
 */

/**
 * A colour token is never made translucent by appending hex alpha to it.
 *
 * Every token `getResolvedTokens` produces is a full `rgb(r g b)` string, so
 * `colors.primary + '15'` and `` `${colors.error}18` `` build `rgb(31 153 239)15`
 * — a string no CSS or RN colour parser accepts. Nothing throws: react-native-web
 * hands the unparseable value back through its colour normaliser and paints the
 * base colour FULLY OPAQUE. A pill that meant to be a 10% tint is painted at 100%,
 * and a label using the same token lands on its own colour at contrast 1.00. It
 * came from a world where these tokens were hex strings, where the trick worked.
 *
 * `theme/__tests__/accent-colors.test.ts` is the runtime half and it is the right
 * shape: it composites the actual background and computes the WCAG ratio, so it
 * catches the SYMPTOM at the theme layer regardless of how the colour was built.
 * What it cannot see is a component that builds one for itself. This is the
 * source half, and neither subsumes the other.
 *
 * WHAT IT CANNOT SEE, stated rather than implied: an alpha appended to a colour
 * that reached a local variable first (`const base = colors.primary; base + a`),
 * and an alpha held in a variable rather than written as a literal. Both are
 * invisible to any source scan that does not do type inference, and both are
 * covered by the compositing half. What is caught here is the shape that has
 * actually shipped, in Bloom and in three consumer apps.
 *
 * DOCS ARE SCANNED TOO, in fenced code blocks only. `theme.colors.error + '15'`
 * reached consumers by being copied, and prose that DESCRIBES the hazard — this
 * comment, `theme/types.ts`, AGENTS.md — must not count as an instance of it.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const ROOT = join(__dirname, '..', '..');
const SRC = join(__dirname, '..');

/**
 * The colour vocabulary, read off `ThemeColors` rather than typed out here. A
 * hand-written list would silently stop covering a token added later, which is
 * the same defect as a hand-maintained subject list.
 */
function colourTokenNames(): Set<string> {
  const file = join(SRC, 'theme', 'types.ts');
  const sf = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const names = new Set<string>();
  for (const stmt of sf.statements) {
    if (!ts.isInterfaceDeclaration(stmt) || stmt.name.text !== 'ThemeColors') continue;
    for (const member of stmt.members) {
      if (member.name && ts.isIdentifier(member.name)) names.add(member.name.text);
    }
  }
  return names;
}

const TOKENS = colourTokenNames();

/** A run of hex digits: what an alpha suffix looks like, and nothing else does. */
const HEX_SUFFIX = /^[0-9a-fA-F]{1,8}$/;

const unwrap = (node: ts.Expression): ts.Expression =>
  ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node;

/**
 * Reads as a colour token: `x.primary`, `x['primary']`, at any depth of receiver.
 * The receiver is deliberately not constrained — `theme.colors.error`,
 * `colors.error`, `resolved.error` and a destructured `accent.error` all name the
 * same hazard, and requiring a known receiver is how a scan stops seeing the next
 * spelling. It over-matches an unrelated `.success` (a toast result, say), which
 * only makes the rule stricter: no property of any object should have hex digits
 * concatenated onto it.
 */
function isColourToken(node: ts.Node): boolean {
  if (ts.isPropertyAccessExpression(node)) return TOKENS.has(node.name.text);
  if (ts.isElementAccessExpression(node)) {
    const arg = node.argumentExpression;
    return ts.isStringLiteral(arg) && TOKENS.has(arg.text);
  }
  return false;
}

const isHexLiteral = (node: ts.Expression): boolean =>
  (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
  HEX_SUFFIX.test(node.text);

interface Finding {
  where: string;
  text: string;
}

/** Every hex-alpha concatenation in one parsed unit of source. */
function findings(sf: ts.SourceFile, label: string, lineOffset = 0): Finding[] {
  const out: Finding[] = [];
  const at = (node: ts.Node): string =>
    `${label}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1 + lineOffset}`;
  const record = (node: ts.Node): void => {
    out.push({ where: at(node), text: node.getText(sf).replace(/\s+/g, ' ').slice(0, 80) });
  };
  const visit = (node: ts.Node): void => {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const left = unwrap(node.left);
      const right = unwrap(node.right);
      if ((isColourToken(left) && isHexLiteral(right)) || (isColourToken(right) && isHexLiteral(left))) {
        record(node);
      }
    }
    if (ts.isTemplateExpression(node)) {
      for (const span of node.templateSpans) {
        if (isColourToken(unwrap(span.expression)) && HEX_SUFFIX.test(span.literal.text)) {
          record(node);
          break;
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

/** How many colour-token expressions a unit contains at all — the vacuity floor. */
function colourTokenCount(sf: ts.SourceFile): number {
  let n = 0;
  const visit = (node: ts.Node): void => {
    if (isColourToken(node)) n += 1;
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return n;
}

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      // `__tests__` is excluded from the MEASUREMENT because a test may build the
      // malformed string on purpose to prove something rejects it — and that
      // exclusion is what makes the positive control below possible.
      if (name === '__tests__' || name === 'node_modules') continue;
      sourceFiles(full, out);
    } else if (/\.tsx?$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function testFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) testFiles(full, out);
    else if (/\.(test|spec)\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

const parseFile = (file: string): ts.SourceFile =>
  ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

const SOURCES = sourceFiles(SRC);

/** Fenced `ts`/`tsx`/`js`/`jsx` blocks in the docs, each parsed on its own. */
function docBlocks(): Array<{ file: string; code: string; line: number }> {
  const out: Array<{ file: string; code: string; line: number }> = [];
  const files: string[] = [join(ROOT, 'README.md')];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.')) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.mdx?$/.test(name)) files.push(full);
    }
  };
  walk(join(ROOT, 'docs'));
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/^```(?:tsx|ts|jsx|js)\n([\s\S]*?)^```/gm)) {
      const code = match[1] ?? '';
      out.push({
        file: relative(ROOT, file),
        code,
        line: text.slice(0, match.index ?? 0).split('\n').length,
      });
    }
  }
  return out;
}

const DOC_BLOCKS = docBlocks();

describe('the scan can see what it is looking for', () => {
  it('reads the token vocabulary off ThemeColors', () => {
    expect(TOKENS.size).toBeGreaterThanOrEqual(30);
    // A floor alone would survive a parse that produced a set of junk; name the
    // members the rule is actually about.
    for (const token of ['primary', 'error', 'background', 'successSubtle']) {
      expect(TOKENS.has(token)).toBe(true);
    }
  });

  it('reads a real tree, containing real colour-token expressions', () => {
    // Vacuity floors in the currency of the measurement: "no file appends hex
    // alpha" and "no file mentions a colour token" print the same empty array.
    expect(SOURCES.length).toBeGreaterThanOrEqual(400);
    const total = SOURCES.reduce((n, file) => n + colourTokenCount(parseFile(file)), 0);
    expect(total).toBeGreaterThanOrEqual(500);
  });

  it('reads the docs, and they contain colour-token expressions too', () => {
    expect(DOC_BLOCKS.length).toBeGreaterThanOrEqual(100);
    const total = DOC_BLOCKS.reduce(
      (n, block) =>
        n +
        colourTokenCount(
          ts.createSourceFile('block.tsx', block.code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
        ),
      0,
    );
    expect(total).toBeGreaterThanOrEqual(10);
  });

  it('finds the malformed shape where one is deliberately written (positive control)', () => {
    // Same detector, same file reads, same parse — over the directory the
    // measurement excludes. `accent-colors.test.ts` builds the malformed string
    // on purpose, to prove the colour parser rejects it.
    //
    // RETIREMENT CONDITION: if that assertion is ever removed or rewritten, this
    // control must be REPOINTED at whatever then deliberately constructs the
    // shape — not deleted. A gate whose control is gone is measuring nothing,
    // and this one is asserting an ABSENCE everywhere else.
    const inTests = testFiles(SRC).flatMap((file) =>
      findings(parseFile(file), relative(SRC, file)),
    );
    expect(inTests.map((f) => f.text)).toContain('`${colors.primary}18`');
    expect(inTests.map((f) => f.where.split(':')[0])).toContain(
      'theme/__tests__/accent-colors.test.ts',
    );
  });
});

describe('no colour token is given hex alpha', () => {
  it('not in the shipped source', () => {
    const offenders = SOURCES.flatMap((file) => findings(parseFile(file), relative(SRC, file))).map(
      (f) => `${f.where}  ${f.text}`,
    );
    expect(offenders).toEqual([]);
  });

  it('not in a documented example, where a consumer would copy it', () => {
    const offenders = DOC_BLOCKS.flatMap((block) =>
      findings(
        ts.createSourceFile('block.tsx', block.code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
        block.file,
        block.line,
      ),
    ).map((f) => `${f.where}  ${f.text}`);
    expect(offenders).toEqual([]);
  });
});
