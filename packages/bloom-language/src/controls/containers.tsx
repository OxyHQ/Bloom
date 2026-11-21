import { createElement, Fragment, type ErrorInfo, type ReactElement, type ReactNode } from 'react';
import type { BloomAppearance, BloomSize, BloomTone } from '@oxy.so/bloom/appearance';
import {
  AdmonitionContent,
  AdmonitionIcon,
  AdmonitionRoot,
  AdmonitionRow,
  AdmonitionText,
} from '@oxy.so/bloom/admonition';
import {
  Card as BloomCard,
  CardBody as BloomCardBody,
  CardDescription as BloomCardDescription,
  CardFooter as BloomCardFooter,
  CardHeader as BloomCardHeader,
  CardTitle as BloomCardTitle,
} from '@oxy.so/bloom/card';
import { Chip as BloomChip } from '@oxy.so/bloom/chip';
import { EmptyState as BloomEmptyState, type EmptyStateAction } from '@oxy.so/bloom/empty-state';
import { ErrorBoundary as BloomErrorBoundary } from '@oxy.so/bloom/error-boundary';
import {
  GroupedSection as BloomGroupedSection,
  GroupedSectionItem as BloomGroupedSectionItem,
} from '@oxy.so/bloom/grouped-section';
import { Item as BloomItem } from '@oxy.so/bloom/item';
import { Kbd as BloomKbd } from '@oxy.so/bloom/kbd';
import { Tabs as BloomTabs, TabsTrigger } from '@oxy.so/bloom/tabs';

import type { Binding } from '../binding';
import type { ENUMS } from '../generated/spec.generated';
import {
  isNode,
  Node,
  type ButtonView,
  type Child,
  type IconComponent,
  type Modifier,
  type Press,
  type TextProps,
  type ViewModifiers,
  type ViewNode,
} from '../node';
import type { ControlDraw, ControlRenderer } from './draw';

/** Containers: cards, rows, grouped sections, chips and notices. */
export type ContainerKind =
  | 'card'
  | 'cardHeader'
  | 'cardBody'
  | 'cardFooter'
  | 'cardTitle'
  | 'cardDescription'
  | 'row'
  | 'groupedSection'
  | 'groupedSectionItem'
  | 'chip'
  | 'emptyState'
  | 'admonition'
  | 'tabs'
  | 'tabItem'
  | 'kbd'
  | 'errorBoundary';

/** A Card's corner: Bloom's radius rungs, the panel's, or concentric with what holds it. */
export type CardRadius = (typeof ENUMS.cardRadius)[number];
/** A Card's lift: none, or one of Bloom's elevation roles. */
export type CardElevation = (typeof ENUMS.cardElevation)[number];
/** A Card's own stroke. */
export type CardBorder = (typeof ENUMS.cardBorder)[number];
export type GroupedSectionStyle = (typeof ENUMS.groupedSectionStyle)[number];
/** What sets a grouped section's rows apart. */
export type GroupedSeparator = (typeof ENUMS.groupedSeparator)[number];
export type ChipSize = (typeof ENUMS.chipSize)[number];
/** A chip's decorative hue, over its tone. */
export type ChipHue = (typeof ENUMS.chipHue)[number];
export type EmptyStateStyle = (typeof ENUMS.emptyStateStyle)[number];
/** How an empty state draws its icon: bare, or on a disc. */
export type EmptyStateMedia = (typeof ENUMS.emptyStateMedia)[number];
/** The kind of notice an admonition is. */
export type AdmonitionStyle = (typeof ENUMS.admonitionStyle)[number];
export type TabsStyle = (typeof ENUMS.tabsStyle)[number];
export type KbdSize = (typeof ENUMS.kbdSize)[number];
/** The containers' `.style()` token sets beside the controls' own. */
export type ContainerStyle = GroupedSectionStyle | EmptyStateStyle | AdmonitionStyle | TabsStyle;
/** The containers' `.size()` token sets beside the controls' own. */
export type ContainerSize = ChipSize | KbdSize;
/** What an `ErrorBoundary` reports a caught error to. */
export type BoundaryErrorHandler = (error: Error, info: ErrorInfo) => void;

// ── Views ────────────────────────────────────────────────────────

/** Bloom `Card`: a surface holding its parts (`CardHeader`, `CardBody`, `CardFooter`) or any view. */
export interface CardView extends ViewModifiers<CardView> {
  style(value: BloomAppearance): CardView;
  tint(value: BloomTone): CardView;
  /** Its corner: a radius rung (`radius-16`), `panel` or `concentric`. */
  radius(value: CardRadius): CardView;
  /** Its lift: `none`, or an elevation role (`s`, `m`, `floating`). */
  elevation(value: CardElevation): CardView;
  /** Its own stroke over its appearance's: `none`, `hairline`, `thin` or `medium`. */
  outline(value: CardBorder): CardView;
  /** Clips its content to its corner. */
  clipped(): CardView;
  disabled(value?: boolean): CardView;
}
/** A Card's header, body or footer: its padded region. */
export type CardPartView = ViewModifiers<CardPartView>;
/** A Card's title or description, in the card's own type. */
export interface CardTextView extends ViewNode {
  /** Truncates it to `n` lines. */
  lines(value: number): CardTextView;
}
/** Bloom `Item`: a list row, its title and subtitle between a leading and a trailing view. */
export interface RowView extends ViewModifiers<RowView> {
  size(value: BloomSize): RowView;
  subtitle(value: string | undefined): RowView;
  /** What sits before the text (an avatar, an icon). */
  leadingView(...value: Child[]): RowView;
  /** What sits after the text (a value, a control, a chevron). */
  trailing(...value: Child[]): RowView;
  /** The title's lines (one by default). */
  lines(value: number): RowView;
  disabled(value?: boolean): RowView;
  destructive(): RowView;
  /** The chosen row of a list. */
  selected(value?: boolean): RowView;
  /** The row of the page on screen (a sidebar's current destination). */
  active(value: boolean | undefined): RowView;
  /** Lit as the keyboard's current row (a command list's cursor). */
  highlighted(value?: boolean): RowView;
}
/** Bloom `GroupedSection`: rows on one surface, as a settings page groups them. */
export interface GroupedSectionView extends ViewModifiers<GroupedSectionView> {
  /** The heading above the rows. */
  title(value: string): GroupedSectionView;
  /** The note under the rows (Bloom's `footer`). */
  caption(value: string): GroupedSectionView;
  /** `filled` (a card) or `plain` (rows on the page). */
  style(value: GroupedSectionStyle): GroupedSectionView;
  /** What sets the rows apart: `space`, a `line`, or `none`. */
  separator(value: GroupedSeparator): GroupedSectionView;
  radius(value: CardRadius): GroupedSectionView;
}
/** Bloom `GroupedSectionItem`: a row of a grouped section. */
export interface GroupedSectionItemView extends ViewNode {
  /** Its icon (a `GroupedSectionIcon`, an `Icon`, an avatar). */
  leadingView(...value: Child[]): GroupedSectionItemView;
  description(value: string): GroupedSectionItemView;
  /** The current value, at the trailing edge. */
  value(value: string): GroupedSectionItemView;
  /** A control at the trailing edge (a `Toggle`). */
  trailing(...value: Child[]): GroupedSectionItemView;
  chevron(value?: boolean): GroupedSectionItemView;
  /** The title's lines. */
  lines(value: number): GroupedSectionItemView;
  destructive(): GroupedSectionItemView;
  disabled(value?: boolean): GroupedSectionItemView;
  onPress(value: Press | undefined): GroupedSectionItemView;
  label(value: string | undefined): GroupedSectionItemView;
  hint(value: string | undefined): GroupedSectionItemView;
  testID(value: string): GroupedSectionItemView;
}
/** Bloom `Chip`: an `Icon` before the `Text` leads it, one after trails it. */
export interface ChipView extends ViewModifiers<ChipView> {
  style(value: BloomAppearance): ChipView;
  tint(value: BloomTone): ChipView;
  size(value: ChipSize): ChipView;
  hue(value: ChipHue): ChipView;
  /** A filter chip: on or off, through its binding. */
  toggle(value: Binding<boolean>): ChipView;
  /** Drawn chosen, its state owned elsewhere. */
  selected(value?: boolean): ChipView;
  /** A remove button on the chip, named `label` for assistive technology. */
  onClose(action: () => void, label?: string): ChipView;
  disabled(value?: boolean): ChipView;
}
/** Bloom `EmptyState`: what a list or a page shows when there is nothing in it. */
export interface EmptyStateView extends ViewModifiers<EmptyStateView> {
  icon(value: IconComponent): EmptyStateView;
  description(value: string): EmptyStateView;
  media(value: EmptyStateMedia): EmptyStateView;
  style(value: EmptyStateStyle): EmptyStateView;
  /** Its button: a `Button`'s label, glyph, press, state and name. */
  action(value: ButtonView): EmptyStateView;
  secondaryAction(value: ButtonView): EmptyStateView;
}
/** Bloom `Admonition`: a notice, its `Text` and its `Button`s beside the type's glyph. */
export interface AdmonitionView extends ViewModifiers<AdmonitionView> {
  style(value: AdmonitionStyle): AdmonitionView;
  size(value: BloomSize): AdmonitionView;
}
/** Bloom `Tabs`: the strip of tabs; what each one shows is the screen's to draw. */
export interface TabsView extends ViewModifiers<TabsView> {
  style(value: TabsStyle): TabsView;
  /** The tabs share the strip's width. */
  fullWidth(value?: boolean): TabsView;
}
/** A tab of a `Tabs` strip: its value and label. */
export interface TabItemView<V extends string = string> extends ViewNode {
  icon(value: IconComponent): TabItemView<V>;
  count(value: number | null | undefined): TabItemView<V>;
  disabled(value?: boolean): TabItemView<V>;
  testID(value: string): TabItemView<V>;
}
export type TabItemChild<V extends string> =
  | TabItemView<V>
  | false
  | null
  | undefined
  | readonly TabItemChild<V>[];
/** Bloom `Kbd`: a key cap (`⌘K`). */
export interface KbdView extends ViewModifiers<KbdView> {
  size(value: KbdSize): KbdView;
}
/** Bloom `ErrorBoundary`: its content, or Bloom's fallback when the content throws. */
export interface ErrorBoundaryView extends ViewNode {
  title(value: string): ErrorBoundaryView;
  message(value: string): ErrorBoundaryView;
  retryLabel(value: string): ErrorBoundaryView;
  /** A change of it retries the content. */
  resetKey(value: string | number | undefined): ErrorBoundaryView;
  onError(value: BoundaryErrorHandler | undefined): ErrorBoundaryView;
  /** What it shows in place of Bloom's fallback. */
  fallback(value: Child): ErrorBoundaryView;
  testID(value: string): ErrorBoundaryView;
}

// ── Constructors ─────────────────────────────────────────────────

const NONE: readonly Child[] = [];

interface TitledProps {
  readonly title: string | undefined;
}
interface CardTextProps {
  readonly text: string;
}
interface TabsProps<V extends string = string> {
  readonly selection: Binding<V>;
}
interface TabItemProps {
  readonly value: string;
  readonly label: string;
}
interface KbdProps {
  readonly keys: string;
}

/** Bloom `Card`, holding its parts or any view. */
export function Card(...children: Child[]): CardView {
  return new Node('card', null, children);
}
export function CardHeader(...children: Child[]): CardPartView {
  return new Node('cardHeader', null, children);
}
export function CardBody(...children: Child[]): CardPartView {
  return new Node('cardBody', null, children);
}
export function CardFooter(...children: Child[]): CardPartView {
  return new Node('cardFooter', null, children);
}
export function CardTitle(text: string): CardTextView {
  return new Node('cardTitle', { text } satisfies CardTextProps, NONE);
}
export function CardDescription(text: string): CardTextView {
  return new Node('cardDescription', { text } satisfies CardTextProps, NONE);
}

/** Bloom `Item`, a list row titled `title`. */
export function Row(title?: string): RowView {
  return new Node('row', { title } satisfies TitledProps, NONE);
}

/** Bloom `GroupedSection`: its rows, in order. */
export function GroupedSection(...items: Child[]): GroupedSectionView {
  return new Node('groupedSection', null, items);
}

/** A row of a `GroupedSection`, titled `title`. */
export function GroupedSectionItem(title: string): GroupedSectionItemView {
  return new Node('groupedSectionItem', { title } satisfies TitledProps, NONE);
}

/** Bloom `Chip`: its `Text` the label, an `Icon` before or after it the glyphs. */
export function Chip(...content: Child[]): ChipView {
  return new Node('chip', null, content);
}

/** Bloom `EmptyState`, titled `title`. */
export function EmptyState(title?: string): EmptyStateView {
  return new Node('emptyState', { title } satisfies TitledProps, NONE);
}

/** Bloom `Admonition`: its `Text` runs are what it says; a `Button` is an action under them. */
export function Admonition(...content: Child[]): AdmonitionView {
  return new Node('admonition', null, content);
}

/** Bloom `Tabs`: the chosen tab through `selection`, and its tabs in order. */
export function Tabs<V extends string>(
  selection: Binding<V>,
  ...items: TabItemChild<V>[]
): TabsView {
  return new Node('tabs', { selection } satisfies TabsProps<V>, items as Child[]);
}

/** A tab: the `value` it selects, and its label. */
export function TabItem<V extends string>(value: V, label: string): TabItemView<V> {
  return new Node('tabItem', { value, label } satisfies TabItemProps, NONE);
}

/** Bloom `Kbd`: a key cap reading `keys`. */
export function Kbd(keys: string): KbdView {
  return new Node('kbd', { keys } satisfies KbdProps, NONE);
}

/** Bloom `ErrorBoundary` around its content. */
export function ErrorBoundary(...children: Child[]): ErrorBoundaryView {
  return new Node('errorBoundary', null, children);
}

// ── Renderers ────────────────────────────────────────────────────

/** Language children, flattened to nodes. */
function nodes(children: readonly Child[]): Node[] {
  const out: Node[] = [];
  for (const child of children) {
    if (Array.isArray(child)) out.push(...nodes(child));
    else if (isNode(child)) out.push(child);
  }
  return out;
}

/** A `Text` node's words: its string and number runs. */
function words(node: Node): string {
  return (node.props as TextProps).runs
    .filter((run) => typeof run === 'string' || typeof run === 'number')
    .join('');
}

/** The value of `node`'s last modifier of this kind (another node's, read as data). */
function last<K extends Modifier['kind']>(
  node: Node,
  kind: K,
): Extract<Modifier, { kind: K }> | undefined {
  let found: Extract<Modifier, { kind: K }> | undefined;
  for (const modifier of node.modifiers)
    if (modifier.kind === kind) found = modifier as Extract<Modifier, { kind: K }>;
  return found;
}

/** A slot of views (a leading or trailing view) as one element. */
function slot(d: ControlDraw, children: readonly Child[] | undefined): ReactNode {
  if (children === undefined || children.length === 0) return undefined;
  if (children.length === 1) return d.render(children[0] as Child);
  return createElement(Fragment, null, ...d.children(children));
}

/** A Chip's content: its label and the glyphs before and after it. */
function chipContent(children: readonly Child[]): {
  label: string | undefined;
  leading: IconComponent | undefined;
  trailing: IconComponent | undefined;
} {
  let label: string | undefined;
  let leading: IconComponent | undefined;
  let trailing: IconComponent | undefined;
  for (const child of nodes(children)) {
    if (child.kind === 'text')
      label = label === undefined ? words(child) : `${label} ${words(child)}`;
    if (child.kind === 'icon') {
      const icon = (child.props as { icon: IconComponent }).icon;
      if (label === undefined) leading ??= icon;
      else trailing ??= icon;
    }
  }
  return { label, leading, trailing };
}

/** A `Button` node as an empty state's action: its label, glyph, press, state and name. */
function emptyStateAction(button: ViewNode | undefined): EmptyStateAction | undefined {
  if (!isNode(button)) return undefined;
  const { label, leading } = chipContent(button.children);
  const press = last(button, 'onPress')?.value;
  return {
    label: label ?? '',
    icon: leading,
    // A handler, as Bloom's own button calls it; a navigation is the screen's, not the action's.
    onPress: typeof press === 'function' ? (press as () => void) : undefined,
    disabled: last(button, 'disabled')?.value,
    loading: last(button, 'loading')?.value,
    accessibilityLabel: last(button, 'label')?.value,
    testID: last(button, 'testID')?.value,
  };
}

function card(d: ControlDraw): ReactElement {
  return d.component(
    BloomCard,
    {
      ...d.props(),
      appearance: d.own('style')?.value,
      tone: d.own('tint')?.value,
      radius: d.own('radius')?.value,
      elevation: d.own('elevation')?.value,
      border: d.own('outline')?.value,
      clipContent: d.own('clipped') === undefined ? undefined : true,
      disabled: d.own('disabled')?.value,
    },
    ...d.children(d.node.children),
  );
}

/** A Card's header, body or footer. */
function cardPart(part: unknown): ControlRenderer {
  return (d) => d.pressAround((props) => d.component(part, props, ...d.children(d.node.children)));
}

/** A Card's title or description. */
function cardText(part: unknown): ControlRenderer {
  return (d) =>
    d.component(
      part,
      { key: d.key, numberOfLines: d.own('lines')?.value },
      (d.node.props as CardTextProps).text,
    );
}

function row(d: ControlDraw): ReactElement {
  return d.component(BloomItem, {
    ...d.props(),
    size: d.own('size')?.value,
    title: (d.node.props as TitledProps).title,
    subtitle: d.own('subtitle')?.value,
    leading: slot(d, d.own('leadingView')?.value),
    trailing: slot(d, d.own('trailing')?.value),
    titleNumberOfLines: d.own('lines')?.value,
    disabled: d.own('disabled')?.value,
    destructive: d.own('destructive')?.value,
    selected: d.own('selected')?.value,
    active: d.own('active')?.value,
    highlighted: d.own('highlighted')?.value,
  });
}

function groupedSection(d: ControlDraw): ReactElement {
  return d.pressAround((props) =>
    d.component(
      BloomGroupedSection,
      {
        ...props,
        title: d.own('title')?.value,
        footer: d.own('caption')?.value,
        variant: d.own('style')?.value,
        separator: d.own('separator')?.value,
        radius: d.own('radius')?.value,
      },
      ...d.children(d.node.children),
    ),
  );
}

function groupedSectionItem(d: ControlDraw): ReactElement {
  return d.component(BloomGroupedSectionItem, {
    ...d.props(),
    title: (d.node.props as TitledProps).title,
    icon: slot(d, d.own('leadingView')?.value),
    description: d.own('description')?.value,
    value: d.own('value')?.value,
    rightElement: slot(d, d.own('trailing')?.value),
    showChevron: d.own('chevron')?.value,
    titleNumberOfLines: d.own('lines')?.value,
    destructive: d.own('destructive')?.value,
    disabled: d.own('disabled')?.value,
  });
}

function chip(d: ControlDraw): ReactElement {
  const { label, leading, trailing } = chipContent(d.node.children);
  const toggle = d.own('toggle')?.value;
  const close = d.own('onClose')?.value;
  return d.component(
    BloomChip,
    {
      ...d.props(),
      appearance: d.own('style')?.value,
      tone: d.own('tint')?.value,
      size: d.own('size')?.value,
      hue: d.own('hue')?.value,
      checked: toggle?.[0],
      onCheckedChange: toggle?.[1],
      selected: d.own('selected')?.value,
      onClose: close?.action,
      closeLabel: close?.label,
      disabled: d.own('disabled')?.value,
      leadingIcon: leading,
      trailingIcon: trailing,
    },
    label,
  );
}

function emptyState(d: ControlDraw): ReactElement {
  return d.pressAround((props) =>
    d.component(BloomEmptyState, {
      ...props,
      icon: d.own('icon')?.value,
      title: (d.node.props as TitledProps).title,
      description: d.own('description')?.value,
      media: d.own('media')?.value,
      variant: d.own('style')?.value,
      action: emptyStateAction(d.own('action')?.value as ViewNode | undefined),
      secondaryAction: emptyStateAction(d.own('secondaryAction')?.value),
    }),
  );
}

function admonition(d: ControlDraw): ReactElement {
  const content = nodes(d.node.children).map((child, index) =>
    child.kind === 'text'
      ? createElement(AdmonitionText, { key: index }, words(child))
      : createElement(Fragment, { key: index }, d.render(child)),
  );
  return d.pressAround((props) =>
    d.component(
      AdmonitionRoot,
      { ...props, type: d.own('style')?.value, size: d.own('size')?.value },
      createElement(
        AdmonitionRow,
        null,
        createElement(AdmonitionIcon, null),
        createElement(AdmonitionContent, null, ...content),
      ),
    ),
  );
}

function tabs(d: ControlDraw): ReactElement {
  const [value, setValue] = (d.node.props as TabsProps).selection;
  const triggers = nodes(d.node.children).map((item) => {
    const { value: tab, label } = item.props as TabItemProps;
    return createElement(TabsTrigger, {
      key: tab,
      value: tab,
      label,
      leadingIcon: last(item, 'icon')?.value,
      count: last(item, 'count')?.value ?? undefined,
      disabled: last(item, 'disabled')?.value,
      testID: last(item, 'testID')?.value,
    });
  });
  return d.component(
    BloomTabs,
    {
      key: d.key,
      testID: d.testID,
      label: d.label,
      value,
      onValueChange: setValue,
      variant: d.own('style')?.value,
      fullWidth: d.own('fullWidth')?.value,
    },
    ...triggers,
  );
}

function kbd(d: ControlDraw): ReactElement {
  return d.pressAround((props) =>
    d.component(
      BloomKbd,
      { ...props, size: d.own('size')?.value },
      (d.node.props as KbdProps).keys,
    ),
  );
}

function errorBoundary(d: ControlDraw): ReactElement {
  const fallback = d.own('fallback')?.value;
  return d.component(
    BloomErrorBoundary,
    {
      key: d.key,
      testID: d.testID,
      title: d.own('title')?.value,
      message: d.own('message')?.value,
      retryLabel: d.own('retryLabel')?.value,
      resetKey: d.own('resetKey')?.value,
      onError: d.own('onError')?.value,
      fallback: fallback === undefined ? undefined : d.render(fallback),
    },
    ...d.children(d.node.children),
  );
}

/** The renderer of each kind in this family. */
export const CONTAINERS: Partial<Record<ContainerKind, ControlRenderer>> = {
  card,
  cardHeader: cardPart(BloomCardHeader),
  cardBody: cardPart(BloomCardBody),
  cardFooter: cardPart(BloomCardFooter),
  cardTitle: cardText(BloomCardTitle),
  cardDescription: cardText(BloomCardDescription),
  row,
  groupedSection,
  groupedSectionItem,
  chip,
  emptyState,
  admonition,
  tabs,
  kbd,
  errorBoundary,
};
