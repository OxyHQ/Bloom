/**
 * Bloom components the language draws as a node of its own, mapped prop by
 * prop as the language's parity cases pair them
 * (`packages/bloom-language/parity/*.cases.tsx`). A prop not listed, or a
 * value in a form its rule does not take, keeps the element JSX. A rule
 * applies only where the language exports its node.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { LANGUAGE_PACKAGE } from './table';

/**
 * The forms a prop's value takes in a rule:
 * - `string`: a static string, or any expression that is no JSX (a hole);
 * - `token`: a static string only, written as it is (or through the rule's map);
 * - `flag`: bare (`.m()`), a literal (`.m(false)`) or an expression (`.m(x)`);
 * - `boolean`: as a flag, for a modifier whose value is required (bare is `.m(true)`);
 * - `mark`: bare or `{true}` only (`.m()`, a modifier that takes no value);
 * - `number`: a static number, or an expression (a hole);
 * - `handler`: a function, carried as it is;
 * - `view`: an element, converted when it can be, else embedded;
 * - `icon`: a Bloom icon component, by name.
 */
export type Form =
  | 'string'
  | 'token'
  | 'flag'
  | 'boolean'
  | 'mark'
  | 'number'
  | 'handler'
  | 'view'
  | 'icon';

/** A prop as a modifier: its name and form, and for a token, Bloom's value to the language's. */
export interface PropRule {
  readonly modifier: string;
  readonly form: Form;
  readonly map?: Readonly<Record<string, string>>;
}

/**
 * A constructor argument, in order:
 * - a prop (`optional` ones are `undefined` when absent);
 * - a binding: a value prop and its setter, `[value, setValue]`;
 * - the element's text children, as one string;
 * - an options object: each prop given, under its key (none given, no argument).
 */
export type Param =
  | { readonly prop: string; readonly form: Form; readonly optional?: boolean }
  | {
      /** The value prop and its setter (or the setters Bloom takes for it, the first winning). */
      readonly binding: readonly [value: string, set: string | readonly string[]];
      readonly hole: 'boolean' | 'string' | 'number';
    }
  | { readonly text: true }
  | { readonly options: Readonly<Record<string, Form>> };

export interface ComponentRule {
  /** The language constructor. */
  readonly node: string;
  readonly params?: readonly Param[];
  readonly props?: Readonly<Record<string, PropRule>>;
  /** The element's children as the constructor's rest arguments, each a view. */
  readonly children?: boolean;
  /** Drawn only inside a Bloom `Screen` (a screen's scroll view): its parity is drawn in one. */
  readonly inScreen?: boolean;
}

const spec = JSON.parse(readFileSync(join(LANGUAGE_PACKAGE, 'spec/language.json'), 'utf8')) as {
  scales: { corner: Record<string, number> };
  enums: Record<string, readonly string[]>;
  nodes: Record<string, { densities?: readonly string[] }>;
};

/** A spec enum as a token map: a value outside it is no token of the modifier's. */
function tokens(name: string): Readonly<Record<string, string>> {
  const values = spec.enums[name];
  if (!values) throw new Error(`bloom-language-codemod: no enum ${name} in the spec`);
  return Object.fromEntries(values.map((value) => [value, value]));
}

/** Bloom Card's `radius` (`radius-16`) as the language's corner rung (`lg`): `resolveCardRadius` turned round. */
const CARD_RADIUS: Readonly<Record<string, string>> = Object.fromEntries([
  ...Object.entries(spec.scales.corner)
    .filter(([name]) => !name.startsWith('$'))
    .map(([name, value]) => [`radius-${value}`, name]),
  ['radius-max', 'full'],
  ['panel', 'panel'],
  ['concentric', 'concentric'],
]);

/** A node's densities, as the spec checks them per node. */
function densities(kind: string): Readonly<Record<string, string>> {
  const values = spec.nodes[kind]?.densities;
  if (!values) throw new Error(`bloom-language-codemod: no densities for ${kind} in the spec`);
  return Object.fromEntries(values.map((value) => [value, value]));
}

const p = (modifier: string, form: Form, map?: Readonly<Record<string, string>>): PropRule => ({
  modifier,
  form,
  map,
});

/** The props a node takes from its press and name (`d.props()`). */
const NAMED = {
  accessibilityLabel: p('label', 'string'),
  accessibilityHint: p('hint', 'string'),
  testID: p('testID', 'string'),
} as const;

/** `module#export` to its rule. */
export const COMPONENT_RULES: Readonly<Record<string, ComponentRule>> = {
  // parity/inputs.cases.tsx, Toggle (Switch).
  '@oxy.so/bloom/switch#Switch': {
    node: 'Toggle',
    params: [{ binding: ['checked', 'onCheckedChange'], hole: 'boolean' }],
    props: {
      size: p('size', 'token', tokens('controlSize')),
      tone: p('tint', 'token', tokens('tone')),
      disabled: p('disabled', 'flag'),
      accessibilityLabel: p('label', 'string'),
      testID: p('testID', 'string'),
    },
  },
  // parity/containers.cases.tsx, GroupedSection.
  '@oxy.so/bloom/grouped-section#GroupedSection': {
    node: 'GroupedSection',
    children: true,
    props: {
      title: p('title', 'string'),
      footer: p('caption', 'string'),
      variant: p('style', 'token', tokens('groupedSectionStyle')),
      separator: p('separator', 'token', tokens('groupedSeparator')),
      radius: p('radius', 'token', CARD_RADIUS),
      density: p('density', 'token', densities('groupedSection')),
      testID: p('testID', 'string'),
    },
  },
  '@oxy.so/bloom/grouped-section#GroupedSectionItem': {
    node: 'GroupedSectionItem',
    params: [{ prop: 'title', form: 'string' }],
    props: {
      icon: p('leadingView', 'view'),
      description: p('description', 'string'),
      value: p('value', 'string'),
      rightElement: p('trailing', 'view'),
      showChevron: p('chevron', 'flag'),
      titleNumberOfLines: p('lines', 'number'),
      destructive: p('destructive', 'mark'),
      disabled: p('disabled', 'flag'),
      onPress: p('onPress', 'handler'),
      ...NAMED,
    },
  },
  // parity/screen.cases.tsx: a scroll view is the screen's.
  '@oxy.so/bloom/screen#ScreenScrollView': {
    node: 'ScrollView',
    children: true,
    inScreen: true,
    props: {
      keyboardShouldPersistTaps: p('keyboardTaps', 'token', tokens('keyboardTaps')),
      testID: p('testID', 'string'),
    },
  },
  // parity/settings.cases.tsx.
  '@oxy.so/bloom/settings-modal#SettingsSection': {
    node: 'SettingsSection',
    params: [{ prop: 'label', form: 'string', optional: true }],
    children: true,
    props: {
      description: p('description', 'string'),
      action: p('trailing', 'view'),
      testID: p('testID', 'string'),
    },
  },
  '@oxy.so/bloom/settings-modal#SettingsValueField': {
    node: 'SettingsValue',
    params: [{ text: true }],
    props: {
      icon: p('icon', 'icon'),
      muted: p('muted', 'flag'),
      testID: p('testID', 'string'),
    },
  },
  // parity/inputs.cases.tsx, TextField: a bare TextFieldInput draws the TextField shell itself.
  '@oxy.so/bloom/text-field#TextFieldInput': {
    node: 'TextField',
    params: [
      { binding: ['value', ['onValueChange', 'onChangeText']], hole: 'string' },
      { prop: 'label', form: 'string' },
    ],
    props: {
      placeholder: p('placeholder', 'string'),
      size: p('size', 'token', tokens('controlSize')),
      invalid: p('invalid', 'flag'),
      disabled: p('disabled', 'flag'),
      floatingLabel: p('floatingLabel', 'mark'),
      keyboardType: p('keyboard', 'token', tokens('keyboard')),
      autoCapitalize: p('autocapitalize', 'token', tokens('autocapitalize')),
      autoCorrect: p('autocorrect', 'boolean'),
      autoComplete: p('contentType', 'token', tokens('contentType')),
      returnKeyType: p('submitLabel', 'token', tokens('submitLabel')),
      onSubmitEditing: p('onSubmit', 'handler'),
      autoFocus: p('autoFocus', 'mark'),
      maxLength: p('maxLength', 'number'),
      accessibilityHint: p('hint', 'string'),
      testID: p('testID', 'string'),
    },
  },
  // parity/containers.cases.tsx, Card.
  '@oxy.so/bloom/card#Card': {
    node: 'Card',
    children: true,
    props: {
      appearance: p('style', 'token', tokens('appearance')),
      tone: p('tint', 'token', tokens('tone')),
      radius: p('radius', 'token', CARD_RADIUS),
      elevation: p('elevation', 'token', tokens('cardElevation')),
      border: p('outline', 'token', tokens('cardBorder')),
      clipContent: p('clipped', 'mark'),
      disabled: p('disabled', 'flag'),
      onPress: p('onPress', 'handler'),
      ...NAMED,
    },
  },
  // parity/chat.cases.tsx, ChatEmptyState.
  '@oxy.so/bloom/chat-screen#ChatEmptyState': {
    node: 'ChatEmptyState',
    params: [
      {
        options: {
          title: 'string',
          description: 'string',
          notice: 'string',
          illustration: 'view',
          action: 'view',
        },
      },
    ],
    props: { testID: p('testID', 'string') },
  },
};

/**
 * Bloom components that stay JSX whatever their props, and why: the language
 * draws them, but not as a node a region can hold in their place.
 */
export const KEPT: Readonly<Record<string, string>> = {
  '@oxy.so/bloom/screen#Screen':
    'a Bloom Screen is a route’s `screen()` body in the language, its chrome the modifiers of the body’s root; no node a region holds draws one',
  '@oxy.so/bloom/page-header#PageHeader':
    'the language’s `Header` is the system navigation bar on iOS in a native stack, where Bloom’s PageHeader is drawn as it is',
};

const exported = readFileSync(join(LANGUAGE_PACKAGE, 'src/index.ts'), 'utf8');

/** The rule for a Bloom component, when the checked-out language draws its node. */
export function ruleFor(module: string, imported: string): ComponentRule | undefined {
  const rule = COMPONENT_RULES[`${module}#${imported}`];
  return rule && new RegExp(`\\b${rule.node}\\b`).test(exported) ? rule : undefined;
}
