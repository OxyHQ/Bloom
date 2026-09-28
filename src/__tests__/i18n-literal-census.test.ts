/**
 * @jest-environment node
 */

/**
 * Every fixed English string a component DRAWS or ANNOUNCES, found in the
 * source. A Bloom component speaks through its family's catalog
 * (`src/<family>/messages.ts`) or `COMMON_MESSAGES`, so the language follows
 * `BloomProvider locale` — see `docs/locale.mdx`. An English literal in its
 * place is a word a translated app cannot translate.
 *
 * What counts as a literal, by syntax (TypeScript AST, not a grep):
 *   - JSX text with a word in it: `<Text>Loading</Text>`.
 *   - A naming or visible attribute given a string: `accessibilityLabel="Close"`,
 *     `placeholder={'Search'}`, `title`, `label`, `alt`, `aria-label`,
 *     `aria-valuetext`, `accessibilityHint`.
 *   - A default in a parameter list for a name that reads as text:
 *     `closeLabel = 'Close'`, `placeholder = 'Search'`, `title = 'Error'`.
 *   - A `?? 'Close'` fallback to a capitalised string.
 *   - A string (or template) inside an object whose name says it holds copy:
 *     `DEFAULT_LABELS = { back: 'Back' }`, `const labels = {…}`.
 *
 * Not everything English is copy: a brand name, a key name, a format pattern.
 * Such a line says why with a `// i18n-exempt: <reason>` comment on it or on
 * the line above, which this census honours and counts (`EXEMPTIONS`).
 *
 * `PENDING` is the families not yet moved onto catalogs, with their counts.
 * It is an EQUALITY, not a ceiling: a family that migrates must leave it, a new
 * literal in a listed family moves its count, and a literal in an unlisted
 * family fails outright. It can only shrink toward empty.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import ts from 'typescript';

const SRC = join(__dirname, '..');

const TEXT_ATTRIBUTES = new Set([
  'accessibilityLabel',
  'accessibilityHint',
  'aria-label',
  'aria-valuetext',
  'aria-roledescription',
  'placeholder',
  'title',
  'label',
  'alt',
]);

/** Parameter names whose default is copy. */
const TEXT_PARAMETER = /(label|Label|placeholder|Placeholder|title|Title|hint|Hint|text|Text|message|Message)$/;

/** Variables whose object literal holds copy. */
const COPY_OBJECT = /(labels?|LABELS?|copy|COPY|strings|STRINGS)$/;

const HAS_WORD = /[A-Za-z]{2,}/;

function isSkipped(rel: string): boolean {
  return (
    rel.startsWith(`__tests__${sep}`) ||
    rel.includes(`${sep}__tests__${sep}`) ||
    rel.startsWith(`locale${sep}`) ||
    /\.stories\.tsx?$/.test(rel) ||
    /\.d\.ts$/.test(rel) ||
    /(^|[\\/])messages\.ts$/.test(rel)
  );
}

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(name) && !isSkipped(relative(SRC, full))) out.push(full);
  }
  return out;
}

interface Finding {
  family: string;
  where: string;
  text: string;
}

function scanSource(rel: string, text: string): { findings: Finding[]; exemptions: number } {
  const findings: Finding[] = [];
  let exemptions = 0;
  const family = rel.split(sep)[0]!.split('/')[0]!.replace(/\.tsx?$/, '');
  const lines = text.split('\n');
  const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.ESNext, true, rel.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  const record = (node: ts.Node, value: string) => {
    if (!HAS_WORD.test(value)) return;
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line;
    if (/i18n-exempt:\s*\S/.test(lines[line] ?? '') || /i18n-exempt:\s*\S/.test(lines[line - 1] ?? '')) {
      exemptions += 1;
      return;
    }
    findings.push({ family, where: `${rel}:${line + 1}`, text: value.trim().slice(0, 60) });
  };

  const literalText = (node: ts.Node | undefined): string | null => {
    if (!node) return null;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isTemplateExpression(node)) {
      return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join(' ');
    }
    if (ts.isJsxExpression(node)) return literalText(node.expression);
    if (ts.isParenthesizedExpression(node)) return literalText(node.expression);
    return null;
  };

  const inCopyObject = (node: ts.Node): boolean => {
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (ts.isVariableDeclaration(parent)) {
        return ts.isIdentifier(parent.name) && COPY_OBJECT.test(parent.name.text);
      }
      if (ts.isFunctionLike(parent) && !ts.isArrowFunction(parent)) return false;
    }
    return false;
  };

  const parameterName = (node: ts.ParameterDeclaration | ts.BindingElement): string =>
    (ts.isBindingElement(node) && node.propertyName && ts.isIdentifier(node.propertyName) ? node.propertyName : node.name).getText(sf);

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      record(node, node.text);
    } else if (ts.isJsxExpression(node) && node.parent && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      const value = literalText(node.expression);
      if (value !== null) record(node, value);
    } else if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && TEXT_ATTRIBUTES.has(node.name.text)) {
      const value = literalText(node.initializer);
      if (value !== null) record(node, value);
    } else if ((ts.isParameter(node) || ts.isBindingElement(node)) && node.initializer && TEXT_PARAMETER.test(parameterName(node))) {
      const value = literalText(node.initializer);
      if (value !== null) record(node.initializer, value);
    } else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
      const value = literalText(node.right);
      if (value !== null && /^[A-Z]/.test(value)) record(node.right, value);
    } else if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) &&
      node.parent &&
      (ts.isPropertyAssignment(node.parent) || ts.isArrowFunction(node.parent)) &&
      inCopyObject(node)
    ) {
      const value = literalText(node);
      if (value !== null) record(node, value);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { findings, exemptions };
}

function scan(): { findings: Finding[]; exemptions: number } {
  const findings: Finding[] = [];
  let exemptions = 0;
  for (const file of sourceFiles(SRC)) {
    const result = scanSource(relative(SRC, file), readFileSync(file, 'utf8'));
    findings.push(...result.findings);
    exemptions += result.exemptions;
  }
  return { findings, exemptions };
}

/**
 * Families not yet on catalogs, and how many English literals each still has.
 * Remove a family when it migrates; never add one.
 */
const PENDING: Record<string, number> = {
  'activity-feed': 2,
  'address': 2,
  'alert-dialog': 1,
  'app-shell': 7,
  'auth-card': 32,
  'avatar': 69,
  'avatar-group': 2,
  'breadcrumb': 1,
  'calendar': 18,
  'call-ui': 36,
  'card-form': 7,
  'carousel': 2,
  'carrier-quote': 20,
  'cart-panel': 10,
  'category-bar': 2,
  'chart-cards': 36,
  'checkout-summary': 3,
  'code': 2,
  'command': 4,
  'connection-dots': 1,
  'contact-card': 2,
  'context-menu': 2,
  'creator-studio': 100,
  'data-table': 5,
  'delivery-slot': 2,
  'dialog': 1,
  'directions': 34,
  'earnings': 12,
  'error-boundary': 3,
  'file-upload': 6,
  'floating': 1,
  'hover-card': 2,
  'important-alerts-card': 1,
  'input-otp': 2,
  'job-board': 29,
  'label': 1,
  'lead-score': 2,
  'location-puck': 3,
  'lyrics': 4,
  'mail-compose': 16,
  'mail-list': 15,
  'mail-thread': 16,
  'map-attribution': 2,
  'map-controls': 12,
  'map-marker': 2,
  'media-card': 24,
  'media-controls': 9,
  'media-header': 25,
  'media-player': 33,
  'media-shelf': 2,
  'menu-item': 15,
  'menubar': 2,
  'music-library': 52,
  'navigation-banner': 11,
  'note-card': 6,
  'note-editor': 9,
  'notification': 1,
  'notification-center': 5,
  'offering-badge': 4,
  'order-status': 5,
  'outline-nav': 2,
  'pagination': 1,
  'patient-info-card': 1,
  'payment-method': 5,
  'payment-status': 6,
  'phone-input': 3,
  'pipeline': 4,
  'place-card': 10,
  'place-details': 26,
  'place-list': 9,
  'place-reviews': 9,
  'popover': 2,
  'price-breakdown': 6,
  'proof-of-delivery': 19,
  'questionnaire': 8,
  'queue-panel': 20,
  'rating': 2,
  'recent-hires-card': 1,
  'route-stops': 8,
  'search': 2,
  'select': 2,
  'settings-modal': 41,
  'shipment-request': 19,
  'sidebar': 15,
  'slider': 1,
  'social-button': 1,
  'sortable-media': 12,
  'stat-cards': 2,
  'stepper': 2,
  'surfaces': 4,
  'swipe-row': 1,
  'tag-field': 3,
  'text-field': 1,
  'theme-toggle': 3,
  'track-list': 20,
  'vehicle-picker': 4,
  'vendor-card': 7,
  'zoomable-media-gallery': 5,
};

/** `// i18n-exempt:` lines, counted so a new one is a reviewed decision. */
const EXEMPTIONS = 2;

const { findings, exemptions } = scan();
const byFamily = new Map<string, Finding[]>();
for (const finding of findings) {
  byFamily.set(finding.family, [...(byFamily.get(finding.family) ?? []), finding]);
}

describe('English literal census', () => {
  it('finds none outside the families still pending, and exactly the pending counts inside them', () => {
    const actual: Record<string, number> = {};
    for (const [family, list] of [...byFamily.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      actual[family] = list.length;
    }
    if (JSON.stringify(actual) !== JSON.stringify(PENDING)) {
      const unlisted = [...byFamily.entries()]
        .filter(([family, list]) => PENDING[family] !== list.length)
        .flatMap(([family, list]) => list.slice(0, 5).map((f) => `  ${family}  ${f.where}  "${f.text}"`));
      // The first few literals of each family whose count moved, to act on.
      console.log(unlisted.join('\n'));
    }
    expect(actual).toEqual(PENDING);
  });

  it('counts the exemptions exactly', () => {
    expect(exemptions).toBe(EXEMPTIONS);
  });

  it('catches each shape it claims to, and honours an exemption (control)', () => {
    // Guards the detector itself: a census that stopped seeing literals would
    // pass the equality above for the wrong reason once PENDING is empty.
    const sample = [
      "export function X({ closeLabel = 'Close', size = 'md' }) {",
      "  const labels = { back: 'Back', count: (n: number) => `${n} items` };",
      "  const name = props.name ?? 'Untitled';",
      "  return (",
      "    <View accessibilityLabel=\"Dismiss\" testID=\"x-close\">",
      "      <Text>Loading</Text>",
      "      <Text>{'Retry'}</Text>",
      "      <Text>{count} · {name}</Text>",
      "      {/* i18n-exempt: a brand name */}",
      "      <Text>Google</Text>",
      "    </View>",
      "  );",
      "}",
    ].join('\n');
    const { findings: found, exemptions: exempt } = scanSource('sample/Sample.tsx', sample);
    expect(found.map((f) => f.text)).toEqual(['Close', 'Back', 'items', 'Untitled', 'Dismiss', 'Loading', 'Retry']);
    expect(exempt).toBe(1);
  });
});
