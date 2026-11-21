/**
 * Web parity: a language node and the Bloom element it stands for, each
 * rendered by react-native-web into the document under Bloom's real
 * provider, compared as DOM elements and the CSS that reaches each one.
 *
 * The two draw the same CSS by different routes (the language through its
 * generated atomic classes, a Bloom component through react-native-web's
 * inline styles and classes), so an element is compared on what it is:
 * its tag, its attributes other than `class` and `style`, its text, and its
 * declarations, collected from every rule that matches it in every sheet
 * (adopted ones included) and its inline style, with `var(--x)` resolved
 * through the custom properties its ancestors declare.
 */
import type { ReactNode } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Dimensions } from 'react-native';
import { BloomThemeProvider } from '@oxy.so/bloom/theme';

import type { ParityCase, Scheme } from './cases';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export interface DomTree {
  tag: string;
  attributes: Record<string, string>;
  css: Record<string, string>;
  children: (DomTree | string)[];
}

/**
 * Whether a media query holds: jsdom lays nothing out, so the viewport is the
 * width react-native-web reports to JavaScript (`Dimensions`), the one a
 * component reading the window's breakpoint sees. Only `min-width` is written.
 */
function viewportMatches(media: string): boolean {
  const width = Dimensions.get('window').width;
  return [...media.matchAll(/min-width:\s*(\d+)px/g)].every((match) => width >= Number(match[1]));
}

function styleRules(): CSSStyleRule[] {
  const sheets: CSSStyleSheet[] = [...Array.from(document.styleSheets)];
  const adopted = (document as Document & { adoptedStyleSheets?: CSSStyleSheet[] })
    .adoptedStyleSheets;
  if (adopted) sheets.push(...adopted);
  const rules: CSSStyleRule[] = [];
  const collect = (list: CSSRuleList) => {
    for (const rule of Array.from(list)) {
      if ('selectorText' in rule) rules.push(rule as CSSStyleRule);
      else if ('media' in rule && !viewportMatches((rule as CSSMediaRule).media.mediaText))
        continue;
      else if ('cssRules' in rule) collect((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of sheets) collect(sheet.cssRules);
  return rules;
}

/**
 * Spellings of one longhand that react-native-web writes by different routes:
 * its inline styles write `text-decoration`, its class compiler the longhand
 * and its `-webkit-` twin; a class writes a logical edge, an inline style the
 * physical one (the page is left to right). Each folds onto one name.
 */
const FOLDED: Record<string, string> = {
  'text-decoration': 'text-decoration-line',
  '-webkit-text-decoration-line': 'text-decoration-line',
  'padding-inline-start': 'padding-left',
  'padding-inline-end': 'padding-right',
  'margin-inline-start': 'margin-left',
  'margin-inline-end': 'margin-right',
  'border-inline-start-width': 'border-left-width',
  'border-inline-end-width': 'border-right-width',
  'inset-inline-start': 'left',
  'inset-inline-end': 'right',
  'border-inline-start-color': 'border-left-color',
  'border-inline-end-color': 'border-right-color',
  'border-start-start-radius': 'border-top-left-radius',
  'border-start-end-radius': 'border-top-right-radius',
  'border-end-start-radius': 'border-bottom-left-radius',
  'border-end-end-radius': 'border-bottom-right-radius',
};

const SIDES = ['top', 'right', 'bottom', 'left'];
/** The shorthands a probe may hold, read back as their longhands. */
const LONGHANDS: Record<string, string[]> = {
  padding: SIDES.map((side) => `padding-${side}`),
  margin: SIDES.map((side) => `margin-${side}`),
  'border-width': SIDES.map((side) => `border-${side}-width`),
  'border-style': SIDES.map((side) => `border-${side}-style`),
  'border-color': SIDES.map((side) => `border-${side}-color`),
  border: ['width', 'style', 'color'].flatMap((part) =>
    SIDES.map((side) => `border-${side}-${part}`),
  ),
  ...Object.fromEntries(
    SIDES.map((side) => [
      `border-${side}`,
      ['width', 'style', 'color'].map((part) => `border-${side}-${part}`),
    ]),
  ),
  'border-radius': ['top-left', 'top-right', 'bottom-right', 'bottom-left'].map(
    (corner) => `border-${corner}-radius`,
  ),
};

type Declarations = [string, string][];

function declarations(style: CSSStyleDeclaration, into: Declarations): void {
  for (let i = 0; i < style.length; i++) {
    const name = style[i] as string;
    into.push([name, style.getPropertyValue(name).trim()]);
  }
}

function matches(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

/** Every declaration that reaches `element`, in cascade order: matching rules, then its inline style. */
function declared(element: Element, rules: CSSStyleRule[]): Declarations {
  const out: Declarations = [];
  for (const rule of rules) if (matches(element, rule.selectorText)) declarations(rule.style, out);
  if (element instanceof HTMLElement || element instanceof SVGElement)
    declarations((element as HTMLElement).style, out);
  return out;
}

const VAR = /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/;

function resolve(text: string, scope: Record<string, string>): string {
  let out = text;
  for (let guard = 0; guard < 32; guard++) {
    const found = VAR.exec(out);
    if (!found) break;
    const replacement = scope[found[1] as string] ?? found[2] ?? '';
    out = `${out.slice(0, found.index)}${replacement}${out.slice(found.index + found[0].length)}`;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * The CSS that reaches an element, one value per longhand: the declarations
 * applied in order to a probe (so a later longhand overrides a shorthand, and
 * the browser serialises each value), its variables resolved in `scope`.
 */
function computed(list: Declarations, scope: Record<string, string>): Record<string, string> {
  const probe = document.createElement('div');
  for (const [name, text] of list) {
    // A shimmer's delay syncs it to the clock when it mounted: a time, not a look.
    if (name.startsWith('--') || name === 'animation-delay') continue;
    probe.style.setProperty(FOLDED[name] ?? name, resolve(text, scope));
  }
  const out: Record<string, string> = {};
  for (let i = 0; i < probe.style.length; i++) {
    const name = probe.style[i] as string;
    for (const longhand of LONGHANDS[name] ?? [name])
      out[longhand] = probe.style.getPropertyValue(longhand);
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => (a < b ? -1 : 1)));
}

function customProperties(list: Declarations, into: Record<string, string>): void {
  for (const [name, text] of list) if (name.startsWith('--')) into[name] = text;
}

function walk(element: Element, rules: CSSStyleRule[], inherited: Record<string, string>): DomTree {
  const own = declared(element, rules);
  const scope = { ...inherited };
  customProperties(own, scope);
  const css = computed(own, scope);
  const attributes: Record<string, string> = {};
  for (const attribute of Array.from(element.attributes).sort((a, b) =>
    a.name < b.name ? -1 : 1,
  )) {
    if (attribute.name === 'class' || attribute.name === 'style') continue;
    attributes[attribute.name] = reactIds(attribute.value);
  }
  const children: (DomTree | string)[] = [];
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === 3) {
      if (child.textContent) children.push(child.textContent);
    } else if (child.nodeType === 1) children.push(walk(child as Element, rules, scope));
  }
  return { tag: element.tagName.toLowerCase(), attributes, css, children };
}

function ancestorScope(element: Element, rules: CSSStyleRule[]): Record<string, string> {
  const chain: Element[] = [];
  for (let at = element.parentElement; at; at = at.parentElement) chain.unshift(at);
  const scope: Record<string, string> = {};
  for (const at of chain) customProperties(declared(at, rules), scope);
  return scope;
}

/** React's `useId` counts across roots; an id is compared by its order in the tree, not its count. */
const REACT_ID = /_r_[0-9a-z]+_|(?<=[-_:«#])r[0-9a-z]+(?=[-_:»)]|$)/g;
let ids: Map<string, string> = new Map();
function reactIds(text: string): string {
  return text.replace(REACT_ID, (id) => {
    let seen = ids.get(id);
    if (seen === undefined) {
      seen = `id${ids.size}`;
      ids.set(id, seen);
    }
    return seen;
  });
}

const MARK = 'data-parity-subject';

/** What `element` draws in the document, under Bloom's provider in `scheme`. */
export function webTree(element: ReactNode, scheme: Scheme = 'light'): unknown {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <BloomThemeProvider fonts={false} mode={scheme}>
        <div {...{ [MARK]: '' }}>{element}</div>
      </BloomThemeProvider>,
    );
  });
  const subject = container.querySelector(`[${MARK}]`) as Element;
  const rules = styleRules();
  ids = new Map();
  const scope = ancestorScope(subject, rules);
  const tree = Array.from(subject.children).map((child) => walk(child, rules, scope));
  // What the element portals out of its tree (a sheet, a dialog) is drawn in
  // the document's other roots; each is compared with its own inheritance.
  for (const root of Array.from(document.body.children)) {
    if (root === container) continue;
    for (const child of Array.from(root.children))
      tree.push(walk(child, rules, ancestorScope(child, rules)));
  }
  act(() => root.unmount());
  container.remove();
  return tree;
}

/** Every case, in both schemes: the language draws exactly the DOM and CSS Bloom's element does. */
export function describeWebParity(title: string, cases: readonly ParityCase[]): void {
  describe(title, () => {
    for (const scheme of ['light', 'dark'] as const) {
      describe(scheme, () => {
        it.each(cases.map((c) => [c.name, c] as const))('%s', (_name, c) => {
          expect(webTree(c.language(), scheme)).toEqual(webTree(c.bloom(), scheme));
        });
      });
    }
  });
}
