import * as Bloom from '../index';

type AnyExports = Record<string, unknown>;
const api = Bloom as AnyExports;

// The ONLY families allowed to remain namespace objects (collections /
// generic-colliding part names). Everything else is flat-with-prefix.
const ALLOWED_NAMESPACES = ['Icons', 'Typography', 'Skeleton', 'Grid', 'Code', 'Fonts'] as const;

// Compound families converted to flat: their top-level name becomes the
// root component (a function), no longer a namespace object.
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

describe('public API contract', () => {
  it('keeps the six collection families as namespace objects', () => {
    for (const ns of ALLOWED_NAMESPACES) {
      expect(typeof api[ns]).toBe('object');
    }
  });

  it('exposes each compound family root as a flat component (not a namespace)', () => {
    for (const name of FLATTENED_ROOTS) {
      expect(typeof api[name]).toBe('function');
    }
  });

  it('exposes compound parts as flat prefixed components', () => {
    for (const name of REPRESENTATIVE_PARTS) {
      expect(typeof api[name]).toBe('function');
    }
  });
});
