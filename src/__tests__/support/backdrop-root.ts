/**
 * What makes a surface material lose its blur, read off a rendered jsdom tree.
 *
 * The material paints its body and edge light as `::before`/`::after` with a
 * `backdrop-filter`. In Chromium an element with `opacity` below 1, any `filter`
 * (`blur(0px)` included), a mask, a `clip-path`, a `mix-blend-mode` or its own
 * `backdrop-filter` is the BACKDROP ROOT of everything under it, so a material
 * host on or under one blurs nothing. This walks every material host (found
 * through the selectors the material registers as it is built, so the list
 * cannot go stale) and its ancestors, and reports each trigger three ways:
 *
 *   - INLINE and CASCADED values (`getComputedStyle`, which in jsdom applies the
 *     sheets Bloom's `<style>` fallback inserts);
 *   - ANIMATIONS: an `animation` naming a `@keyframes` whose frames set one;
 *   - STATE RULES THAT COULD MATCH: a rule with a dynamic pseudo-class
 *     (`:hover`, `:focus-within`, ...) setting one, whose selector with those
 *     stripped matches a host or an ancestor. jsdom never hovers anything; this
 *     is how a hover reveal that fades its container is still caught. Static
 *     rules are already in the cascaded values.
 *
 * The real-browser counterpart is `scripts/verify-backdrop-root.mjs`.
 */
import { materialHostSelector } from '../../surface/web-material';

export interface BackdropRootViolation {
  host: string;
  at: string;
  trigger: string;
}

const DYNAMIC = /:(hover|focus-within|focus-visible|focus|active)\b/g;
const DYNAMIC_TEST = /:(hover|focus-within|focus-visible|focus|active)\b/;

function describe(node: Element): string {
  const id = node.getAttribute('data-testid');
  const cls = Array.from(node.classList)
    .filter((c) => !/^(css|r)-/.test(c))
    .slice(0, 2);
  const data = Array.from(node.attributes)
    .map((a) => a.name)
    .filter((name) => name.startsWith('data-') && name !== 'data-testid')
    .slice(0, 2);
  return [
    node.tagName.toLowerCase(),
    id ? `#${id}` : '',
    cls.length ? `.${cls.join('.')}` : '',
    data.length ? `[${data.join(',')}]` : '',
  ].join('');
}

function declarationTriggers(style: CSSStyleDeclaration, isHost: boolean): string[] {
  const out: string[] = [];
  const read = (name: string) => style.getPropertyValue(name).trim();
  const opacity = read('opacity');
  if (opacity && !opacity.includes('var(') && Number.parseFloat(opacity) < 1)
    out.push(`opacity ${opacity}`);
  const filter = read('filter');
  if (filter && filter !== 'none' && !filter.includes('var(')) out.push(`filter ${filter}`);
  for (const name of ['mask', 'mask-image', '-webkit-mask-image', 'clip-path']) {
    const value = read(name);
    if (value && value !== 'none' && value !== 'initial') out.push(`${name} ${value}`);
  }
  const blend = read('mix-blend-mode');
  if (blend && blend !== 'normal') out.push(`mix-blend-mode ${blend}`);
  const backdrop = read('backdrop-filter') || read('-webkit-backdrop-filter');
  if (backdrop && backdrop !== 'none' && !isHost) out.push(`backdrop-filter ${backdrop}`);
  return out;
}

function styleRules(doc: Document): CSSRule[] {
  const out: CSSRule[] = [];
  const visit = (rules: CSSRuleList | undefined) => {
    if (!rules) return;
    for (const rule of Array.from(rules)) {
      out.push(rule);
      const nested = (rule as CSSGroupingRule).cssRules;
      if (nested && nested !== rules) visit(nested);
    }
  };
  const adopted =
    (doc as Document & { adoptedStyleSheets?: CSSStyleSheet[] }).adoptedStyleSheets ?? [];
  for (const sheet of [...Array.from(doc.styleSheets), ...adopted]) {
    try {
      visit(sheet.cssRules);
    } catch {
      // an unreadable sheet paints nothing of Bloom's
    }
  }
  return out;
}

const KEYFRAME_TRIGGER =
  /(^|[;{\s])(opacity\s*:\s*(0(\.\d+)?|\.\d+)\s*[;}]|filter\s*:\s*(?!none)[^;}]+|mask(-image)?\s*:|clip-path\s*:)/;

/** Keyframe names whose frames set a backdrop-root trigger. */
function triggeringKeyframes(doc: Document): Set<string> {
  const names = new Set<string>();
  for (const rule of styleRules(doc)) {
    if (rule.type !== 7) continue;
    const keyframes = rule as CSSKeyframesRule;
    const text = keyframes.cssText.replace(/backdrop-filter\s*:[^;}]+/g, '');
    if (KEYFRAME_TRIGGER.test(text)) names.add(keyframes.name);
  }
  return names;
}

/**
 * The style object React handed the DOM node. jsdom's declaration silently drops
 * values its parser rejects (an `animation` with a `cubic-bezier()` is one), so
 * a fading keyframe on a host would be invisible in `node.style`.
 */
function reactStyle(node: Element): Record<string, unknown> {
  const key = Object.keys(node).find((k) => k.startsWith('__reactProps$'));
  const props = key ? (node as unknown as Record<string, { style?: unknown }>)[key] : undefined;
  const style = props?.style;
  return style && typeof style === 'object' ? (style as Record<string, unknown>) : {};
}

function animationNames(style: CSSStyleDeclaration, node?: Element): string[] {
  const names = style.getPropertyValue('animation-name');
  const shorthand = style.getPropertyValue('animation');
  const fromReact = node ? reactStyle(node) : {};
  const assigned = [fromReact.animation, fromReact.animationName]
    .filter((v) => typeof v === 'string')
    .join(' ');
  return `${names} ${shorthand} ${assigned}`
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function backdropRootViolations(doc: Document = document): BackdropRootViolation[] {
  const material = materialHostSelector();
  if (!material) throw new Error('no material host selector registered: nothing to check');
  const hosts = Array.from(doc.querySelectorAll(material)).filter(
    (host) =>
      !(host instanceof HTMLElement) ||
      host.style.getPropertyValue('--bloom-surface-filter').trim() !== 'none',
  );
  const keyframes = triggeringKeyframes(doc);
  const rules = styleRules(doc).filter(
    (rule): rule is CSSStyleRule =>
      rule.type === 1 && !/::?(before|after)/.test((rule as CSSStyleRule).selectorText),
  );
  const view = doc.defaultView;
  const out: BackdropRootViolation[] = [];
  const seen = new Set<string>();
  const push = (host: Element, node: Element, trigger: string) => {
    const entry = { host: describe(host), at: node === host ? 'host' : describe(node), trigger };
    const key = `${entry.host}|${entry.at}|${entry.trigger}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(entry);
  };
  for (const host of hosts) {
    for (let node: Element | null = host; node; node = node.parentElement) {
      const isHost = node === host;
      if (node instanceof HTMLElement) {
        for (const hit of declarationTriggers(node.style, isHost))
          push(host, node, `inline ${hit}`);
        for (const name of animationNames(node.style, node))
          if (keyframes.has(name)) push(host, node, `animation ${name}`);
      }
      if (view) {
        const computed = view.getComputedStyle(node);
        for (const hit of declarationTriggers(computed, isHost))
          push(host, node, `computed ${hit}`);
        for (const name of animationNames(computed))
          if (keyframes.has(name)) push(host, node, `animation ${name}`);
      }
      for (const rule of rules) {
        if (!DYNAMIC_TEST.test(rule.selectorText)) continue;
        const hits = declarationTriggers(rule.style, isHost);
        const animated = animationNames(rule.style).filter((name) => keyframes.has(name));
        if (hits.length === 0 && animated.length === 0) continue;
        const selector = rule.selectorText.replace(DYNAMIC, '');
        let matches = false;
        try {
          matches = node.matches(selector);
        } catch {
          matches = false;
        }
        if (!matches) continue;
        for (const hit of hits) push(host, node, `rule ${rule.selectorText} { ${hit} }`);
        for (const name of animated)
          push(host, node, `rule ${rule.selectorText} { animation ${name} }`);
      }
    }
  }
  return out;
}

/** How many material hosts are in the tree: the vacuity floor for a check. */
export function materialHostCount(doc: Document = document): number {
  const material = materialHostSelector();
  return material ? doc.querySelectorAll(material).length : 0;
}
