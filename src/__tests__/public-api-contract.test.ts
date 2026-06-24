import * as Bloom from '../index';

type AnyExports = Record<string, unknown>;
const api = Bloom as AnyExports;

// Collections / generic-colliding part names that intentionally STAY namespaced.
const ALLOWED_NAMESPACES = ['Icons', 'Typography', 'Skeleton', 'Grid', 'Code', 'Fonts'] as const;

// Compound families converted to flat: the top-level name is the root component.
const FLATTENED_ROOTS = [
  'Tabs', 'Accordion', 'Select', 'Menu', 'ContextMenu', 'Popover',
  'Tooltip', 'SegmentedControl', 'TextField', 'Admonition', 'PromptInput',
] as const;

// One renamed part per converted family — proves the flat rename landed.
const REPRESENTATIVE_PARTS = [
  'TabsTrigger', 'AccordionItem', 'SelectItem', 'MenuItem', 'ContextMenuItem',
  'PopoverTrigger', 'TooltipTrigger', 'SegmentedControlItem', 'TextFieldInput',
  'AdmonitionIcon', 'PromptInputTextarea',
] as const;

/**
 * A flat React component export is either a plain function component or a wrapped
 * component object (React.memo / forwardRef), which carries a `$$typeof` symbol.
 * A `export * as X` namespace is a plain object WITHOUT `$$typeof`.
 */
function isReactComponent(value: unknown): boolean {
  if (typeof value === 'function') return true;
  if (typeof value === 'object' && value !== null) {
    return typeof (value as { $$typeof?: unknown }).$$typeof === 'symbol';
  }
  return false;
}

describe('public API contract', () => {
  it('keeps the six collection families as namespace objects (not components)', () => {
    for (const ns of ALLOWED_NAMESPACES) {
      expect(typeof api[ns]).toBe('object');
      expect(isReactComponent(api[ns])).toBe(false);
    }
  });

  it('exposes each compound family root as a flat component (not a namespace)', () => {
    for (const name of FLATTENED_ROOTS) {
      expect(isReactComponent(api[name])).toBe(true);
    }
  });

  it('exposes compound parts as flat prefixed components', () => {
    for (const name of REPRESENTATIVE_PARTS) {
      expect(isReactComponent(api[name])).toBe(true);
    }
  });
});
