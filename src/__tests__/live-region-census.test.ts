import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

/**
 * Live regions reach native, and only what must interrupt does.
 *
 * A screen reader says a live region's text when it appears or changes:
 * `alert` assertively (interrupting), `status` and `log` politely, and an
 * explicit `aria-live` / `accessibilityLiveRegion` over the role's implied one
 * (`docs/composition.mdx` §Live regions). Two ways this silently fails on
 * native, both invisible on the web:
 *
 * 1. A VIEW whose only accessibility prop is a role is flattened away: Fabric
 *    keeps a view for a live region (`ViewShadowNode::initialize`), not for a
 *    role, so the region never reaches the platform and nothing is said. A live
 *    view therefore states `aria-live` (or `accessibilityLiveRegion`) too.
 * 2. React Native's `Text` drops `aria-live` before it reaches native (only
 *    `View` maps it). A text that is a live region says so with its ROLE
 *    (`status`, `alert`), which both platforms read, or the RN prop.
 *
 * And the third, a judgement this pins by EQUALITY: every element that may be
 * ASSERTIVE (an `alert` role, or `aria-live="assertive"`), with why it may
 * interrupt. An alert is for what the user just did going wrong; a callout, a
 * tooltip, a confirmation or a log line is not one. A new assertive element
 * fails until it is listed with its reason, and a stale entry fails too.
 *
 * Web forks (`*.web.tsx`) are the DOM's and out of scope.
 */

const sourceRoot = resolve(__dirname, '..');

const LIVE_ROLES = new Set(['alert', 'status', 'log']);

/** `file:tag` of every element that may speak assertively, and why it may. */
const ASSERTIVE: Record<string, string> = {
  'field/Field.tsx:Text': "the field's error, answering what the user entered",
  'text-field/TextField.tsx:Text': "an invalid `TextFieldHint` is the field's error",
  'file-upload/FileUpload.tsx:Text': 'a rejection of the file the user just dropped or picked',
  'creator-studio/ArtworkUploader.tsx:View': 'a rejection of the artwork the user just picked',
  'listing-editor/OfferingEditor.tsx:Text': 'a validation error of the form the user submitted',
  'listing-editor/PropertyTypeSelector.tsx:Text': 'a validation error of the user’s choice',
  'proof-of-delivery/ProofOfDelivery.tsx:View':
    'what is still missing, said in the gesture that asked to finish',
  'composer-panel/ComposerPillBase.tsx:View': 'the reason the message the user wrote is refused',
  'cover-header/CoverHeader.tsx:Text': 'the cover position the user set could not be saved',
  'agent-chat/AgentChatBase.tsx:Text': 'the reply the user asked for failed',
  'notification/Notification.tsx:Animated.View': 'an `error` notification (the rest are polite)',
  'toast/ToastSwipeHandler.tsx:Animated.View':
    'an `error` or `important` toast (`toastLiveness`; the rest are polite)',
};

function nativeSources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== '__tests__') nativeSources(path, out);
    } else if (/\.tsx$/.test(name) && !/\.web\.tsx$|\.stories\.tsx$/.test(name)) {
      out.push(path);
    }
  }
  return out;
}

/** The string literals an attribute's value may take. */
function literals(value: ts.Node | undefined): string[] {
  const out: string[] = [];
  const collect = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) out.push(node.text);
    ts.forEachChild(node, collect);
  };
  if (value) collect(value);
  return out;
}

/**
 * Whether a value is only literals (`'polite'`, `cond ? 'alert' : undefined`).
 * Anything else — a call, a prop, a constant — may be assertive.
 */
function onlyLiterals(value: ts.Node | undefined): boolean {
  if (!value) return true;
  if (ts.isJsxExpression(value)) return onlyLiterals(value.expression);
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) return true;
  if (ts.isIdentifier(value)) return value.text === 'undefined';
  if (ts.isParenthesizedExpression(value)) return onlyLiterals(value.expression);
  if (ts.isConditionalExpression(value))
    return onlyLiterals(value.whenTrue) && onlyLiterals(value.whenFalse);
  return false;
}

/** A text host: Bloom's `Text`, RN's, or a component that renders one. */
function isTextTag(tag: string): boolean {
  return /(^|\.)(\w*Text|ThinkingLabel)$/.test(tag);
}

interface Found {
  where: string;
  key: string;
  tag: string;
  liveRole: boolean;
  ariaLive: boolean;
  rnLive: boolean;
  assertive: boolean;
}

function census(): Found[] {
  const found: Found[] = [];
  for (const file of nativeSources(sourceRoot)) {
    const text = readFileSync(file, 'utf8');
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const rel = relative(sourceRoot, file);
    const visit = (node: ts.Node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const attributes = new Map<string, ts.JsxAttribute>();
        for (const attribute of node.attributes.properties)
          if (ts.isJsxAttribute(attribute)) attributes.set(attribute.name.getText(), attribute);
        const roles = [
          ...literals(attributes.get('role')?.initializer),
          ...literals(attributes.get('accessibilityRole')?.initializer),
        ];
        const live = [
          ...literals(attributes.get('aria-live')?.initializer),
          ...literals(attributes.get('accessibilityLiveRegion')?.initializer),
        ];
        const computed = ['role', 'accessibilityRole', 'aria-live', 'accessibilityLiveRegion'].some(
          (name) => !onlyLiterals(attributes.get(name)?.initializer),
        );
        const liveRole = roles.some((role) => LIVE_ROLES.has(role));
        const ariaLive = attributes.has('aria-live');
        const rnLive = attributes.has('accessibilityLiveRegion');
        if (liveRole || ariaLive || rnLive || (computed && attributes.has('aria-live'))) {
          const tag = node.tagName.getText();
          const { line } = ast.getLineAndCharacterOfPosition(node.getStart());
          found.push({
            where: `${rel}:${line + 1} <${tag}>`,
            key: `${rel}:${tag}`,
            tag,
            liveRole,
            ariaLive,
            rnLive,
            // A computed role or politeness may be assertive: it is listed too.
            assertive:
              roles.includes('alert') ||
              live.includes('assertive') ||
              ((liveRole || ariaLive || rnLive) && computed),
          });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  return found;
}

describe('live regions', () => {
  const found = census();

  it('finds the regions it is about (the census is falsifiable)', () => {
    const keys = found.map((entry) => entry.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        'field/Field.tsx:Text',
        'toast/ToastSwipeHandler.tsx:Animated.View',
        'notification/Notification.tsx:Animated.View',
        'tag-field/TagField.tsx:Text',
      ]),
    );
    expect(found.length).toBeGreaterThan(40);
  });

  it('a live VIEW states its politeness, so native keeps it (a role alone is flattened)', () => {
    const loose = found
      .filter(
        (entry) => entry.liveRole && !isTextTag(entry.tag) && !entry.ariaLive && !entry.rnLive,
      )
      .map((entry) => entry.where);
    expect(loose).toEqual([]);
  });

  it('a live TEXT says so with its role or the RN prop (Text drops aria-live on native)', () => {
    const webOnly = found
      .filter((entry) => isTextTag(entry.tag) && entry.ariaLive && !entry.liveRole && !entry.rnLive)
      .map((entry) => entry.where);
    expect(webOnly).toEqual([]);
  });

  it('every element that may interrupt is listed with why (EQUALITY)', () => {
    const assertive = Array.from(
      new Set(found.filter((entry) => entry.assertive).map((entry) => entry.key)),
    ).sort();
    expect(assertive).toEqual(Object.keys(ASSERTIVE).sort());
  });
});
