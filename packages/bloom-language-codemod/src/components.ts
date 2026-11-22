/**
 * Bloom components the language draws as a node of its own, mapped prop by
 * prop as the language's parity cases pair them
 * (`packages/bloom-language/parity/*.cases.tsx`). A prop not listed, or a
 * value in a form its rule does not take, keeps the element JSX. A rule
 * applies only where the language exports its node.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { type Arg, LANGUAGE_PACKAGE } from './table';

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
 * - `icon`: a Bloom icon component, by name;
 * - `literal`: a boolean literal (bare is `true`), through the rule's map (`'true'`, `'false'`);
 * - `refresh`: React Native's `RefreshControl` element, as a pull to refresh's
 *   binding and tint (`.refreshable([refreshing, () => onRefresh()], tint)`);
 * - `contentStyle`: a static content container style of paddings and a gap, as
 *   `.contentMargins(edge, token)` and `.spacing(token)`.
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
  | 'icon'
  | 'literal'
  | 'refresh'
  | 'contentStyle';

/** A prop as a modifier: its name and form, and for a token, Bloom's value to the language's. */
export interface PropRule {
  readonly modifier: string;
  readonly form: Form;
  readonly map?: Readonly<Record<string, string>>;
  /**
   * A second prop that is the modifier's next argument (`onEndReachedThreshold`
   * to `.onEndReached(action, threshold)`); given without this prop, it is a reason.
   */
  readonly with?: readonly [prop: string, form: Form];
  /** Fixed arguments after the value (`showsVerticalScrollIndicator` to `.scrollIndicators(value, 'vertical')`). */
  readonly args?: readonly Arg[];
}

/**
 * A constructor argument, in order:
 * - a prop (`optional` ones are `undefined` when absent);
 * - a binding: a value prop and its setter, `[value, setValue]`;
 * - the element's text children, as one string;
 * - an options object: each prop given, under its own name or the key named
 *   beside its form (none given, no argument);
 * - the label and glyphs of a chip or a button: its text children as a `Text`,
 *   the props naming its glyphs as an `Icon` before and after it.
 */
export type Param =
  | { readonly prop: string; readonly form: Form; readonly optional?: boolean }
  | {
      /** The value prop and its setter (or the setters Bloom takes for it, the first winning). */
      readonly binding: readonly [value: string, set: string | readonly string[]];
      readonly hole: 'boolean' | 'string' | 'number';
    }
  | { readonly text: true }
  | { readonly options: Readonly<Record<string, Form | readonly [key: string, form: Form]>> }
  | { readonly label: { readonly leading?: string; readonly trailing?: string } };

export interface ComponentRule {
  /** The language constructor. */
  readonly node: string;
  readonly params?: readonly Param[];
  readonly props?: Readonly<Record<string, PropRule>>;
  /** The element's children as the constructor's rest arguments, each a view. */
  readonly children?: boolean;
  /** Modifiers with no argument the node always takes (a `Header` drawn as Bloom's PageHeader: `.inPage()`). */
  readonly always?: readonly string[];
  /**
   * A Bloom component (`module#export`) it is drawn only inside (a screen's
   * scroll view in a `Screen`): its parity draws both sides in one.
   */
  readonly within?: string;
  /**
   * Components (`module#export`) whose context the Bloom component reads and
   * the language's node does not: inside one (in the file), the element stays JSX.
   */
  readonly outside?: readonly string[];
  /**
   * A shell around one input, drawn by the input's node: its children are the
   * input (`module#export`, by its own rule) between glyphs (`TextFieldIcon`),
   * which are the node's `icon` and `trailingIcon`; its own props join the input's.
   */
  readonly shell?: { readonly input: string; readonly icon: string };
  /** Props the Bloom component draws in a way no modifier of the node does, and how: each is the reason it stays JSX. */
  readonly differs?: Readonly<Record<string, string>>;
}

const spec = JSON.parse(readFileSync(join(LANGUAGE_PACKAGE, 'spec/language.json'), 'utf8')) as {
  scales: {
    corner: Record<string, number>;
    space: Record<string, number>;
    avatarSize: Record<string, number>;
    iconSize: Record<string, number>;
  };
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

/** A scroll indicator's boolean prop as `.scrollIndicators()` on its axis. */
const INDICATOR = { true: 'visible', false: 'hidden' } as const;
const indicator = (axis: 'vertical' | 'horizontal'): PropRule => ({
  ...p('scrollIndicators', 'literal', INDICATOR),
  args: [axis],
});

/** Bloom's spacing in points (`12`) as the language's space token (`md`), the spec's scale turned round. */
export const SPACE: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(spec.scales.space)
    .filter(([name]) => !name.startsWith('$'))
    .map(([name, value]) => [String(value), name]),
);
/** An avatar's diameter in points as its rung. */
const AVATAR_SIZE: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(spec.scales.avatarSize)
    .filter(([name]) => !name.startsWith('$'))
    .map(([name, value]) => [String(value), name]),
);
/** An icon's size in points as its rung. */
const ICON_SIZE: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(spec.scales.iconSize)
    .filter(([name]) => !name.startsWith('$'))
    .flatMap(([name, value]) => [
      [String(value), name],
      [name, name],
    ]),
);

/** The text input modifiers every field takes (`textInputProps` in the language's inputs). */
const TEXT_INPUT = {
  keyboardType: p('keyboard', 'token', tokens('keyboard')),
  autoCapitalize: p('autocapitalize', 'token', tokens('autocapitalize')),
  autoCorrect: p('autocorrect', 'boolean'),
  autoComplete: p('contentType', 'token', tokens('contentType')),
  returnKeyType: p('submitLabel', 'token', tokens('submitLabel')),
  onSubmitEditing: p('onSubmit', 'handler'),
  autoFocus: p('autoFocus', 'mark'),
  maxLength: p('maxLength', 'number'),
} as const;

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
      descriptionLines: p('descriptionLines', 'number'),
      wrapControl: p('wrapControl', 'flag'),
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
    within: '@oxy.so/bloom/screen#Screen',
    props: {
      keyboardShouldPersistTaps: p('keyboardTaps', 'token', tokens('keyboardTaps')),
      onEndReached: { ...p('onEndReached', 'handler'), with: ['onEndReachedThreshold', 'number'] },
      refreshControl: p('refreshable', 'refresh'),
      showsVerticalScrollIndicator: indicator('vertical'),
      showsHorizontalScrollIndicator: indicator('horizontal'),
      contentContainerStyle: p('contentMargins', 'contentStyle'),
      testID: p('testID', 'string'),
    },
    differs: {
      contentContainerClassName:
        'Bloom lays a content className out in a view of its own inside a content container that grows to the viewport, and reports no intrinsic height; the content margins pad the content container itself',
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
    // A bare input draws its own shell, with the enclosing Field's state; the node draws its shell as it is.
    outside: ['@oxy.so/bloom/text-field#TextField', '@oxy.so/bloom/field#Field'],
    props: {
      placeholder: p('placeholder', 'string'),
      size: p('size', 'token', tokens('controlSize')),
      invalid: p('invalid', 'flag'),
      disabled: p('disabled', 'flag'),
      floatingLabel: p('floatingLabel', 'mark'),
      ...TEXT_INPUT,
      accessibilityHint: p('hint', 'string'),
      testID: p('testID', 'string'),
    },
  },
  // parity/inputs.cases.tsx, TextField: the shell an app writes around its input.
  '@oxy.so/bloom/text-field#TextField': {
    node: 'TextField',
    shell: {
      input: '@oxy.so/bloom/text-field#TextFieldInput',
      icon: '@oxy.so/bloom/text-field#TextFieldIcon',
    },
    props: {
      size: p('size', 'token', tokens('controlSize')),
      invalid: p('invalid', 'flag'),
      // Measured: a shell's disabled draws what the node's .disabled() draws.
      disabled: p('disabled', 'flag'),
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
  // parity/list.cases.tsx, Row (Bloom Item).
  '@oxy.so/bloom/item#Item': {
    node: 'Row',
    params: [{ prop: 'title', form: 'string', optional: true }],
    props: {
      subtitle: p('subtitle', 'string'),
      leading: p('leadingView', 'view'),
      trailing: p('trailing', 'view'),
      size: p('size', 'token', tokens('controlSize')),
      titleNumberOfLines: p('lines', 'number'),
      disabled: p('disabled', 'flag'),
      destructive: p('destructive', 'mark'),
      selected: p('selected', 'flag'),
      active: p('active', 'boolean'),
      highlighted: p('highlighted', 'flag'),
      contentDensity: p('density', 'token', densities('row')),
      onPress: p('onPress', 'handler'),
      onLongPress: p('onLongPress', 'handler'),
      ...NAMED,
    },
  },
  // parity/inputs.cases.tsx, Field.
  '@oxy.so/bloom/field#Field': {
    node: 'Field',
    params: [{ prop: 'label', form: 'string', optional: true }],
    children: true,
    props: {
      description: p('description', 'string'),
      error: p('error', 'string'),
      required: p('required', 'flag'),
      disabled: p('disabled', 'flag'),
      testID: p('testID', 'string'),
    },
  },
  // parity/inputs.cases.tsx, TextEditor (Textarea).
  '@oxy.so/bloom/textarea#Textarea': {
    node: 'TextEditor',
    params: [
      { binding: ['value', ['onValueChange', 'onChangeText']], hole: 'string' },
      { prop: 'label', form: 'string', optional: true },
    ],
    // Inside a Field, Bloom's Textarea takes the field's state.
    outside: ['@oxy.so/bloom/field#Field'],
    props: {
      placeholder: p('placeholder', 'string'),
      hint: p('description', 'string'),
      size: p('size', 'token', tokens('controlSize')),
      disabled: p('disabled', 'flag'),
      invalid: p('invalid', 'flag'),
      required: p('required', 'flag'),
      rows: p('rows', 'number'),
      autoResize: { ...p('autoResize', 'mark'), with: ['maxRows', 'number'] },
      resize: p('resize', 'token', tokens('textareaResize')),
      showCount: p('showCount', 'mark'),
      ...TEXT_INPUT,
      accessibilityLabel: p('label', 'string'),
      accessibilityHint: p('hint', 'string'),
      testID: p('testID', 'string'),
    },
  },
  // parity/inputs.cases.tsx, Search.
  '@oxy.so/bloom/search#Search': {
    node: 'Search',
    params: [{ binding: ['value', ['onValueChange', 'onChangeText']], hole: 'string' }],
    outside: ['@oxy.so/bloom/field#Field'],
    props: {
      label: p('label', 'string'),
      placeholder: p('placeholder', 'string'),
      size: p('size', 'token', tokens('controlSize')),
      disabled: p('disabled', 'flag'),
      onClearText: p('onClearText', 'handler'),
      ...TEXT_INPUT,
      testID: p('testID', 'string'),
    },
  },
  // parity/inputs.cases.tsx, Checkbox.
  '@oxy.so/bloom/checkbox#Checkbox': {
    node: 'Checkbox',
    params: [
      { binding: ['checked', 'onCheckedChange'], hole: 'boolean' },
      { prop: 'label', form: 'string', optional: true },
    ],
    props: {
      description: p('description', 'string'),
      size: p('size', 'token', tokens('controlSize')),
      tone: p('tint', 'token', tokens('tone')),
      disabled: p('disabled', 'flag'),
      readOnly: p('readOnly', 'mark'),
      indeterminate: p('indeterminate', 'flag'),
      accessibilityLabel: p('label', 'string'),
      testID: p('testID', 'string'),
    },
  },
  // parity/pieces.cases.tsx and material.cases.tsx: the small pieces.
  '@oxy.so/bloom/divider#Divider': {
    node: 'Divider',
    props: {
      variant: p('lineStyle', 'token', tokens('dividerStyle')),
      spacing: p('spacing', 'token', SPACE),
      ...NAMED,
    },
  },
  '@oxy.so/bloom/loading#Loading': {
    node: 'Loading',
    props: {
      variant: p('style', 'token', tokens('loadingStyle')),
      size: p('size', 'token', tokens('controlSize')),
      tone: p('tint', 'token', tokens('tone')),
      ...NAMED,
    },
  },
  '@oxy.so/bloom/badge#Badge': {
    node: 'Badge',
    params: [{ prop: 'content', form: 'string', optional: true }],
    props: {
      variant: p('style', 'token', tokens('badgeStyle')),
      tone: p('tint', 'token', tokens('tone')),
      size: p('size', 'token', tokens('badgeSize')),
      icon: p('icon', 'icon'),
      dot: p('dot', 'mark'),
      max: p('max', 'number'),
      placement: p('placement', 'token', tokens('badgePlacement')),
      color: p('color', 'token', tokens('accentTone')),
      ...NAMED,
    },
  },
  '@oxy.so/bloom/icon-circle#IconCircle': {
    node: 'IconCircle',
    params: [{ prop: 'icon', form: 'icon' }],
    props: { size: p('size', 'token', ICON_SIZE), ...NAMED },
  },
  // parity/avatar.cases.tsx.
  '@oxy.so/bloom/avatar#Avatar': {
    node: 'Avatar',
    params: [
      { prop: 'source', form: 'string', optional: true },
      { options: { variant: 'string', name: 'string', initials: 'string' } },
    ],
    props: {
      size: p('size', 'token', AVATAR_SIZE),
      shape: p('shape', 'token', tokens('shapeName')),
      verified: p('verified', 'flag'),
      live: p('live', 'flag'),
      alt: p('label', 'string'),
      testID: p('testID', 'string'),
    },
  },
  // parity/material.cases.tsx, Grid (ResponsiveGrid).
  '@oxy.so/bloom/grid#ResponsiveGrid': {
    node: 'Grid',
    children: true,
    props: {
      maxColumns: p('columns', 'number'),
      minItemWidth: p('minCellWidth', 'token', SPACE),
      gap: p('spacing', 'token', SPACE),
      flow: p('flow', 'token', tokens('gridFlow')),
      stretchItems: p('stretchItems', 'flag'),
      ...NAMED,
    },
  },
  // parity/engagement.cases.tsx, Action (EngagementAction).
  '@oxy.so/bloom/engagement-bar#EngagementAction': {
    node: 'Action',
    within: '@oxy.so/bloom/engagement-bar#EngagementBar',
    params: [
      { prop: 'icon', form: 'icon' },
      { prop: 'accessibilityLabel', form: 'string' },
      {
        options: {
          activeIcon: 'icon',
          popOnActivate: ['pop', 'boolean'],
          rollCount: 'boolean',
          busy: 'boolean',
        },
      },
    ],
    props: {
      count: p('count', 'number'),
      active: p('active', 'boolean'),
      tone: p('tint', 'token', tokens('engagementTone')),
      onPress: p('onPress', 'handler'),
      onLongPress: p('onLongPress', 'handler'),
      accessibilityHint: p('hint', 'string'),
      testID: p('testID', 'string'),
    },
  },
  // parity/containers.cases.tsx, Chip: an `Icon` before its `Text` leads it, one after trails it.
  '@oxy.so/bloom/chip#Chip': {
    node: 'Chip',
    params: [{ label: { leading: 'leadingIcon', trailing: 'trailingIcon' } }],
    props: {
      // `inverted` is Bloom's chip variant; the appearances are its `appearance`.
      variant: p('style', 'token', { inverted: 'inverted' }),
      appearance: p('style', 'token', tokens('appearance')),
      tone: p('tint', 'token', tokens('tone')),
      size: p('size', 'token', tokens('chipSize')),
      hue: p('hue', 'token', tokens('chipHue')),
      selected: p('selected', 'flag'),
      disabled: p('disabled', 'flag'),
      onPress: p('onPress', 'handler'),
      onLongPress: p('onLongPress', 'handler'),
      ...NAMED,
    },
  },
  // parity/containers.cases.tsx, Admonition: its text as a `Text`, which it draws as its AdmonitionText.
  '@oxy.so/bloom/admonition#Admonition': {
    node: 'Admonition',
    params: [{ label: {} }],
    props: {
      type: p('style', 'token', tokens('admonitionStyle')),
      size: p('size', 'token', tokens('controlSize')),
    },
  },
  // parity/screen.cases.tsx and header cases: Bloom's PageHeader, in the page on every platform.
  '@oxy.so/bloom/page-header#PageHeader': {
    node: 'Header',
    params: [{ prop: 'title', form: 'string', optional: true }],
    always: ['inPage'],
    props: {
      subtitle: p('subtitle', 'string'),
      actions: p('toolbar', 'view'),
      leading: p('toolbarLeading', 'view'),
      onBack: p('onBack', 'handler'),
      backLabel: p('backLabel', 'string'),
      headingLevel: p('headingLevel', 'number'),
      scrim: p('scrollEdge', 'token', tokens('scrollEdge')),
      presentation: p('presentation', 'token', tokens('headerPresentation')),
      safeArea: p('safeArea', 'flag'),
      titleAlign: p('titleAlign', 'token', tokens('titleAlign')),
      accessory: p('accessory', 'view'),
      tone: p('tone', 'token', tokens('headerTone')),
      scrimFalloff: p('scrimFalloff', 'token', tokens('scrimFalloff')),
      titleReveal: p('titleReveal', 'token', tokens('titleReveal')),
      testID: p('testID', 'string'),
    },
  },
  '@oxy.so/bloom/loading#SpinnerIcon': {
    node: 'SpinnerIcon',
    props: { size: p('size', 'token', ICON_SIZE), testID: p('testID', 'string') },
  },
  // parity/slider.cases.tsx.
  '@oxy.so/bloom/slider#Slider': {
    node: 'Slider',
    params: [
      { binding: ['value', 'onValueChange'], hole: 'number' },
      { prop: 'label', form: 'string', optional: true },
    ],
    props: {
      min: { ...p('bounds', 'number'), with: ['max', 'number'] },
      step: p('step', 'number'),
      keyboardStep: p('keyboardStep', 'number'),
      size: p('size', 'token', tokens('controlSize')),
      tone: p('tint', 'token', tokens('tone')),
      disabled: p('disabled', 'flag'),
      showTooltip: p('showsValue', 'boolean'),
      formatValue: p('valueFormat', 'handler'),
      onSlidingComplete: p('onCommit', 'handler'),
      ...NAMED,
    },
  },
};

/**
 * Bloom's typography components, each its Text in a text style
 * (parity/text.cases.tsx, `textStyle`). `Blockquote` is a View around its Text.
 */
export const TEXT_STYLES: Readonly<Record<string, string>> = {
  Title: 'title',
  Subtitle: 'subtitle',
  H1: 'h1',
  H2: 'h2',
  H3: 'h3',
  H4: 'h4',
  H5: 'h5',
  H6: 'h6',
  P: 'paragraph',
  Lead: 'lead',
  Large: 'large',
  Small: 'small',
  Muted: 'muted',
};

/** Components removed in Bloom 22 that apps on 21 still draw, and what replaces each (docs/migrating-to-22.mdx). */
export const REMOVED: Readonly<Record<string, string>> = {
  '@oxy.so/bloom/settings-modal#SettingsRow':
    '`GroupedSectionItem` (its `title` and `rightElement`) in a `GroupedSection`',
  '@oxy.so/bloom/settings-modal#SettingsCard': '`GroupedSection`',
  '@oxy.so/bloom/button#GlyphButton':
    '`Button appearance="plain" tone="neutral"` (`glyphSize` is `iconSize`, `busy` is `loading`)',
  '@oxy.so/bloom/button#CloseButton': '`Button icon={CloseIcon}` with an `accessibilityLabel`',
  '@oxy.so/bloom/button-group#ButtonGroup': '`Button.Group` holding ordinary `Button`s',
  '@oxy.so/bloom/button-group#ButtonGroupItem': 'a `Button` in a `Button.Group`',
};

/**
 * Bloom components that stay JSX whatever their props, and why: the language
 * draws them, but not as a node a region can hold in their place.
 */
export const KEPT: Readonly<Record<string, string>> = {
  '@oxy.so/bloom/dialog#Dialog':
    'the language presents a dialog from the view that owns it (`.dialog(isPresented, Dialog(...))`), not as an element in place',
  '@oxy.so/bloom/screen#Screen':
    'a Bloom Screen is a route’s `screen()` body in the language, its chrome the modifiers of the body’s root; no node a region holds draws one',
};

const exported = readFileSync(join(LANGUAGE_PACKAGE, 'src/index.ts'), 'utf8');

/** The rule for a Bloom component, when the checked-out language draws its node. */
export function ruleFor(module: string, imported: string): ComponentRule | undefined {
  const rule = COMPONENT_RULES[`${module}#${imported}`];
  return rule && new RegExp(`\\b${rule.node}\\b`).test(exported) ? rule : undefined;
}
