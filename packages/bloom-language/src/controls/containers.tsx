import { createElement, Fragment, type ErrorInfo, type ReactElement, type ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import type { BloomAppearance, BloomSize, BloomTone } from '@oxy.so/bloom/appearance';
import {
  AdmonitionContent,
  AdmonitionIcon,
  AdmonitionRoot,
  AdmonitionRow,
  AdmonitionText,
} from '@oxy.so/bloom/admonition';
import {
  SelectionCard as BloomSelectionCard,
  Card as BloomCard,
  CardBody as BloomCardBody,
  CardDescription as BloomCardDescription,
  CardFooter as BloomCardFooter,
  CardHeader as BloomCardHeader,
  CardTitle as BloomCardTitle,
} from '@oxy.so/bloom/card';
import {
  CappedChipRow as BloomCappedChipRow,
  Chip as BloomChip,
  ChipRow as BloomChipRow,
} from '@oxy.so/bloom/chip';
import { EmptyState as BloomEmptyState, type EmptyStateAction } from '@oxy.so/bloom/empty-state';
import {
  ErrorBoundary as BloomErrorBoundary,
  type ErrorBoundaryFallbackContext,
} from '@oxy.so/bloom/error-boundary';
import {
  GroupedSection as BloomGroupedSection,
  GroupedSectionCollapse as BloomGroupedSectionCollapse,
  GroupedSectionDivider as BloomGroupedSectionDivider,
  GroupedSectionIcon as BloomGroupedSectionIcon,
  GroupedSectionItem as BloomGroupedSectionItem,
} from '@oxy.so/bloom/grouped-section';
import { Item as BloomItem } from '@oxy.so/bloom/item';
import { Kbd as BloomKbd } from '@oxy.so/bloom/kbd';
import type { MotionValue } from '@oxy.so/bloom/motion';
import { Tabs as BloomTabs, TabsContent, TabsTrigger } from '@oxy.so/bloom/tabs';

import type { Binding } from '../binding';
import type { ENUMS } from '../generated/spec.generated';
import {
  isNode,
  Node,
  type ButtonView,
  type Child,
  type FrameSpec,
  type IconComponent,
  type Press,
  type TextProps,
  type ViewModifiers,
  type ViewNode,
} from '../node';
import { paintedHost } from '../painted-host';
import type { PressOpenTab } from '../tokens';
import { layoutOf, layoutStyle, partBoxStyle, type StackModifier } from '../style';
import {
  type Alignment,
  type Axis,
  type Edge,
  type FontFamilyName,
  type FontName,
  type LeadingToken,
  type PaddingToken,
  type WeightName,
  resolveFont,
  type CardRadius,
  type Density,
  type InkToken,
  type Justify,
  type KeyboardTaps,
  resolveCardRadius,
  resolveSpace,
  type SpaceToken,
} from '../tokens';
import { type ControlDraw, type ControlRenderer, lastOf, nodesOf, slot } from './draw';

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
  | 'errorBoundary'
  | 'chipRow'
  | 'cappedChipRow'
  | 'groupedSectionIcon'
  | 'groupedSectionDivider'
  | 'groupedSectionCollapse'
  | 'tabContent'
  | 'selectionCard';

export type { CardRadius };
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
export type ContainerStyle =
  | GroupedSectionStyle
  | EmptyStateStyle
  | AdmonitionStyle
  | TabsStyle
  | ChipStyle;
/** The containers' `.size()` token sets beside the controls' own. */
export type ContainerSize = ChipSize | KbdSize;
/** What an `ErrorBoundary` reports a caught error to. */
export type BoundaryErrorHandler = (error: Error, info: ErrorInfo) => void;
/** An error boundary's fallback as a function of what it caught: its error, and `retry`. */
export type BoundaryFallback = (context: ErrorBoundaryFallbackContext) => Child;
/** A chip's look: Bloom's appearances, or `inverted` (the page's reading pair turned over when chosen). */
export type ChipStyle = (typeof ENUMS.chipStyle)[number];
/** A grouped-section icon's disc: one of Bloom's accent tones. */
export type AccentTone = (typeof ENUMS.accentTone)[number];
/** A selection card's mark: a `check` (several chosen) or a `radio` (one). */
export type SelectionIndicator = (typeof ENUMS.selectionIndicator)[number];
/** The box modifiers a component with a box but no press of the language's own takes. */
type BoxModifiers<Self> = Pick<
  ViewModifiers<Self>,
  | 'padding'
  | 'frame'
  | 'grow'
  | 'shrink'
  | 'alignSelf'
  | 'background'
  | 'border'
  | 'corner'
  | 'opacity'
>;

// ── Views ────────────────────────────────────────────────────────

/** Bloom `Card`: a surface holding its parts (`CardHeader`, `CardBody`, `CardFooter`) or any view. */
export interface CardView extends ViewModifiers<CardView> {
  style(value: BloomAppearance): CardView;
  tint(value: BloomTone): CardView;
  /** Its corner: a corner rung of Bloom's radius scale (`lg`), `panel` or `concentric`. */
  radius(value: CardRadius): CardView;
  /** Its lift: `none`, or an elevation role (`s`, `m`, `floating`). */
  elevation(value: CardElevation): CardView;
  /** Its own stroke over its appearance's: `none`, `hairline`, `thin` or `medium`. */
  outline(value: CardBorder): CardView;
  /** Clips its content to its corner. */
  clipped(on?: boolean): CardView;
  disabled(value?: boolean): CardView;
  /** Its content laid out side by side (`horizontal`) or one above another (the default), as a stack's. */
  axis(value: Axis): CardView;
  /** The gap between its children, as a stack's. */
  spacing(value: SpaceToken): CardView;
  /** Its children across its axis, as a stack's. */
  align(value: Alignment): CardView;
  /** Its children along its axis, as a stack's. */
  justify(value: Justify): CardView;
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
  /** Its rhythm: the touch list's (`comfortable`) or a desktop form's (`compact`). */
  density(value: Density<'row'>): RowView;
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
  /** Its rows' rhythm, reaching every row in it. */
  density(value: Density<'groupedSection'>): GroupedSectionView;
}
/** Bloom `GroupedSectionItem`: a row of a grouped section; its box is the row's own. */
export interface GroupedSectionItemView extends ViewNode, BoxModifiers<GroupedSectionItemView> {
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
  /** A wide trailing control wraps below the title, keeping at least 140 points for the text. */
  wrapControl(value?: boolean): GroupedSectionItemView;
  /** The description's lines: 2 by default, `0` never truncates. */
  descriptionLines(value: number): GroupedSectionItemView;
  destructive(): GroupedSectionItemView;
  disabled(value?: boolean): GroupedSectionItemView;
  onPress(value: Press | undefined): GroupedSectionItemView;
  label(value: string | undefined): GroupedSectionItemView;
  hint(value: string | undefined): GroupedSectionItemView;
  testID(value: string): GroupedSectionItemView;
}
/** Bloom `GroupedSectionIcon`: a glyph on a disc, a row's icon. */
export interface GroupedSectionIconView extends ViewNode {
  /** The disc's tone (`primary` by default). */
  tint(value: AccentTone): GroupedSectionIconView;
  testID(value: string): GroupedSectionIconView;
}
/** Bloom `GroupedSectionDivider`: a line between rows, inset at the text. */
export interface GroupedSectionDividerView extends ViewNode {
  inset(value: SpaceToken): GroupedSectionDividerView;
}
/** Bloom `GroupedSectionCollapse`: rows revealed and hidden in place, kept mounted. */
export interface GroupedSectionCollapseView extends ViewNode {
  testID(value: string): GroupedSectionCollapseView;
}
/** Bloom `Chip`: an `Icon` before the `Text` leads it, one after trails it. */
export interface ChipView extends ViewModifiers<ChipView> {
  /** Its look: an appearance, or `inverted`. */
  style(value: ChipStyle): ChipView;
  /**
   * Its tone; `undefined` is no tone of its own (Bloom's neutral), so a tone
   * chosen at render (`.tint(sensitive ? 'danger' : undefined)`) paints only
   * while it holds.
   */
  tint(value: BloomTone | undefined): ChipView;
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
/** Bloom `ChipRow`: chips in a row that scrolls sideways, faded where there is more. */
export interface ChipRowView extends ViewModifiers<ChipRowView> {
  /** The gap between chips. */
  spacing(value: SpaceToken): ChipRowView;
  /** The padding at both ends, inside the scroll. */
  contentInset(value: SpaceToken): ChipRowView;
  /** The whole row disabled, to assistive technology. */
  disabled(value?: boolean): ChipRowView;
  /** The colour its edges fade into on the web: a role or an app's own (the surface behind it by default). */
  fade(value: InkToken): ChipRowView;
  /** The room kept on every side for a chip's focus ring (4 by default). */
  ringInset(value: SpaceToken): ChipRowView;
  /** Whether a tap on a chip reaches it while the keyboard is open (`handled` by default). */
  keyboardTaps(value: KeyboardTaps): ChipRowView;
}
/** Bloom `CappedChipRow`: chips that wrap, up to `.lines(n)`, the rest behind a "+N" chip. */
export interface CappedChipRowView extends ViewModifiers<CappedChipRowView> {
  spacing(value: SpaceToken): CappedChipRowView;
  /** The most lines it takes (two by default). */
  lines(value: number): CappedChipRowView;
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
  /** A view above the title, in place of the icon (an image, a skeleton). */
  illustration(value: Child): EmptyStateView;
  /** Chips under the description, each read from a `Button`: its label, glyph, press and `.id()`. */
  suggestions(...value: ButtonView[]): EmptyStateView;
  /** The suggestions' name (Bloom's localized "Suggestions" without it). */
  suggestionsLabel(value: string): EmptyStateView;
  /** A view under the actions (Bloom's `footer`). */
  caption(value: Child): EmptyStateView;
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
  /** A tab moved (a drag, or Ctrl+Shift+Arrow on the web): the screen keeps the new order. */
  onReorder(value: (fromValue: string, toValue: string) => void): TabsView;
  /** A swipe's travel between the tabs, which the underline follows. */
  dragTranslation(value: MotionValue): TabsView;
  /**
   * What pressing the open tab does: `report` tells its value again, `reselect`
   * takes its content back to the top (and reloads there), as social apps'
   * inner tabs do (Bloom's `pressOpenTab`).
   */
  pressOpenTab(value: PressOpenTab): TabsView;
}
/** A tab of a `Tabs` strip: its value and label. */
export interface TabItemView<V extends string = string> extends ViewNode {
  icon(value: IconComponent): TabItemView<V>;
  count(value: number | null | undefined): TabItemView<V>;
  disabled(value?: boolean): TabItemView<V>;
  testID(value: string): TabItemView<V>;
  /** Only its icon shows; its label still names it. */
  iconOnly(): TabItemView<V>;
  /** It can be moved, and take a moved tab's place (with the strip's `.onReorder()`). */
  reorderable(value?: boolean): TabItemView<V>;
  /** A control beside its label, in its chrome, not part of its press. */
  trailing(...value: Child[]): TabItemView<V>;
  /** A long press: the tab's own menu. */
  onLongPress(value: Press | undefined): TabItemView<V>;
  /** The tab's own box (`TabsTrigger`'s `style`): its size, over Bloom's. */
  frame(value: FrameSpec): TabItemView<V>;
  /** The tab's own padding (`TabsTrigger`'s `style`), over Bloom's. */
  padding(value: PaddingToken): TabItemView<V>;
  padding(edge: Edge, value: PaddingToken): TabItemView<V>;
  /** Its label's size, line and weight (`TabsTrigger`'s `textStyle`), over Bloom's. */
  font(value: Exclude<FontName, 'mono' | 'display'>): TabItemView<V>;
  leading(value: LeadingToken): TabItemView<V>;
  weight(value: WeightName): TabItemView<V>;
}
/** Bloom `TabsContent`: what a tab shows, inside the strip, while its tab is chosen. */
export type TabContentView = ViewModifiers<TabContentView>;
export type TabItemChild<V extends string> =
  | TabItemView<V>
  | TabContentView
  | false
  | null
  | undefined
  | readonly TabItemChild<V>[];
/** Bloom `Kbd`: a key cap (`⌘K`). */
export interface KbdView extends ViewModifiers<KbdView> {
  size(value: KbdSize): KbdView;
}
/** Bloom `SelectionCard`: a card chosen as a checkbox (`.toggle()`) or as a radio (`.selected()`). */
export interface SelectionCardView extends ViewModifiers<SelectionCardView> {
  /** Chosen or not through its binding: a checkbox, one of several. */
  toggle(value: Binding<boolean>): SelectionCardView;
  /** The chosen one of a set, its press the screen's: a radio. */
  selected(value?: boolean): SelectionCardView;
  description(value: string): SelectionCardView;
  /** A glyph on a tile at its start. */
  icon(value: IconComponent): SelectionCardView;
  /** Its mark: `check` or `radio` (by default, what it is). */
  indicator(value: SelectionIndicator): SelectionCardView;
  /** A view above its head (an image). */
  illustration(value: Child): SelectionCardView;
  /** `compact`: the head's tighter padding. */
  density(value: Density<'selectionCard'>): SelectionCardView;
  disabled(value?: boolean): SelectionCardView;
  invalid(value?: boolean): SelectionCardView;
  /** Its id, for a description or a label elsewhere to point at. */
  nativeID(value: string): SelectionCardView;
  /** The id of what describes it (a field's hint or error). */
  describedBy(value: string): SelectionCardView;
}
/** Bloom `ErrorBoundary`: its content, or Bloom's fallback when the content throws. */
export interface ErrorBoundaryView extends ViewNode, BoxModifiers<ErrorBoundaryView> {
  title(value: string): ErrorBoundaryView;
  message(value: string): ErrorBoundaryView;
  retryLabel(value: string): ErrorBoundaryView;
  /** A change of it retries the content. */
  resetKey(value: string | number | undefined): ErrorBoundaryView;
  onError(value: BoundaryErrorHandler | undefined): ErrorBoundaryView;
  /** What it shows in place of Bloom's fallback: a view, or a view of what it caught. */
  fallback(value: Child | BoundaryFallback): ErrorBoundaryView;
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
interface IconProps {
  readonly icon: IconComponent;
}
interface OpenProps {
  readonly open: boolean;
}
interface ValueProps {
  readonly value: string;
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

/** Bloom `EmptyState`, titled `title`; its content sits between the explanation and the actions. */
export function EmptyState(title?: string, ...content: Child[]): EmptyStateView {
  return new Node('emptyState', { title } satisfies TitledProps, content);
}

/** Bloom `ChipRow`: its chips, in a row that scrolls sideways. */
export function ChipRow(...chips: Child[]): ChipRowView {
  return new Node('chipRow', null, chips);
}

/** Bloom `CappedChipRow`: its chips, wrapping, up to its lines. */
export function CappedChipRow(...chips: Child[]): CappedChipRowView {
  return new Node('cappedChipRow', null, chips);
}

/** A grouped-section row's icon: `icon` on a disc. */
export function GroupedSectionIcon(icon: IconComponent): GroupedSectionIconView {
  return new Node('groupedSectionIcon', { icon } satisfies IconProps, NONE);
}

/** A line between a grouped section's rows. */
export function GroupedSectionDivider(): GroupedSectionDividerView {
  return new Node('groupedSectionDivider', null, NONE);
}

/** A grouped section's rows shown while `open`, revealed and hidden in place. */
export function GroupedSectionCollapse(
  open: boolean,
  ...rows: Child[]
): GroupedSectionCollapseView {
  return new Node('groupedSectionCollapse', { open } satisfies OpenProps, rows);
}

/** What the tab `value` shows, inside its `Tabs`. */
export function TabContent<V extends string>(value: V, ...content: Child[]): TabContentView {
  return new Node('tabContent', { value } satisfies ValueProps, content);
}

/** Bloom `SelectionCard`, titled `title`; its content is the body under its head. */
export function SelectionCard(title: string, ...content: Child[]): SelectionCardView {
  return new Node('selectionCard', { title } satisfies TitledProps, content);
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

/** A `Text` node's words: its string and number runs. */
function words(node: Node): string {
  return (node.props as TextProps).runs
    .filter((run) => typeof run === 'string' || typeof run === 'number')
    .join('');
}

/** A Chip's content: its label and the glyphs before and after it. */
function chipContent(children: readonly Child[]): {
  label: string | undefined;
  leading: IconComponent | undefined;
  trailing: IconComponent | undefined;
  /** A view before or after the label: a glyph with a size or ink of its own, or any other view. */
  leadingView: Node | undefined;
  trailingView: Node | undefined;
} {
  let label: string | undefined;
  let leading: IconComponent | undefined;
  let trailing: IconComponent | undefined;
  let leadingView: Node | undefined;
  let trailingView: Node | undefined;
  for (const child of nodesOf(children)) {
    if (child.kind === 'text') {
      label = label === undefined ? words(child) : `${label} ${words(child)}`;
      continue;
    }
    // A bare glyph is Bloom's icon slot; one with modifiers, or another view, is drawn as it is.
    if (child.kind === 'icon' && child.modifiers.length === 0) {
      const icon = (child.props as { icon: IconComponent }).icon;
      if (label === undefined) leading ??= icon;
      else trailing ??= icon;
    } else if (label === undefined) leadingView ??= child;
    else trailingView ??= child;
  }
  return { label, leading, trailing, leadingView, trailingView };
}

/** A `Button` node as an empty state's action: its label, glyph, press, state and name. */
function emptyStateAction(
  d: ControlDraw,
  button: ViewNode | undefined,
): EmptyStateAction | undefined {
  if (!isNode(button)) return undefined;
  const { label, leading } = chipContent(button.children);
  return {
    label: label ?? '',
    icon: leading,
    // A handler as Bloom's button calls it; a `navigate()` through the screen's navigator.
    onPress: d.press(lastOf(button, 'onPress')?.value),
    disabled: lastOf(button, 'disabled')?.value,
    loading: lastOf(button, 'loading')?.value,
    accessibilityLabel: lastOf(button, 'label')?.value,
    testID: lastOf(button, 'testID')?.value,
  };
}

/** A card's (or grouped section's) `.radius()`, as Bloom's Card names it. */
function cardRadius(d: ControlDraw) {
  const radius = d.own('radius')?.value;
  return radius === undefined ? undefined : resolveCardRadius(radius);
}

/** What a card's own stack modifiers lay out: its content, in Bloom's Card's style. */
const CARD_LAYOUT = ['axis', 'spacing', 'align', 'justify'] as const;

function card(d: ControlDraw): ReactElement {
  const layout: StackModifier[] = [];
  for (const kind of CARD_LAYOUT) {
    const modifier = d.own(kind);
    if (modifier !== undefined) layout.push(modifier as StackModifier);
  }
  return d.component(
    BloomCard,
    {
      ...d.props(),
      // Bloom's Card holds its children in the view its style lays out.
      ...(layout.length === 0 ? null : { style: [layoutStyle(layoutOf(layout))] }),
      appearance: d.own('style')?.value,
      tone: d.own('tint')?.value,
      radius: cardRadius(d),
      cornerCurve: d.own('cornerCurve')?.value,
      elevation: d.own('elevation')?.value,
      border: d.own('outline')?.value,
      clipContent: d.own('clipped')?.value || undefined,
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
    contentDensity: d.own('density')?.value,
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
        radius: cardRadius(d),
        density: d.own('density')?.value,
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
    wrapControl: d.own('wrapControl')?.value,
    descriptionLines: d.own('descriptionLines')?.value,
    destructive: d.own('destructive')?.value,
    disabled: d.own('disabled')?.value,
  });
}

/** The view's press and name for a component that takes its role as `role`, not `accessibilityRole`. */
function roled(d: ControlDraw): Record<string, unknown> {
  const { accessibilityRole: _, ...props } = d.props();
  return d.role === undefined ? props : { ...props, role: d.role };
}

/** A space token as Bloom's number prop, when it is set. */
function space(token: SpaceToken | undefined): number | undefined {
  return token === undefined ? undefined : resolveSpace(token);
}

function chip(d: ControlDraw): ReactElement {
  const { label, leading, trailing, leadingView, trailingView } = chipContent(d.node.children);
  const toggle = d.own('toggle')?.value;
  const close = d.own('onClose')?.value;
  const style = d.own('style')?.value as ChipStyle | undefined;
  return d.component(
    BloomChip,
    {
      ...roled(d),
      // `inverted` is Bloom's chip variant; the appearances are its `appearance`.
      ...(style === 'inverted' ? { variant: style } : { appearance: style }),
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
      leading: leadingView === undefined ? undefined : d.render(leadingView),
      trailing: trailingView === undefined ? undefined : d.render(trailingView),
    },
    label,
  );
}

function chipRow(d: ControlDraw): ReactElement {
  const fade = d.own('fade')?.value;
  return d.component(
    fade === undefined ? BloomChipRow : paintedHost(BloomChipRow, 'fadeColor', fade),
    {
      ...roled(d),
      gap: space(d.own('spacing')?.value as SpaceToken | undefined),
      contentInset: space(d.own('contentInset')?.value),
      ringInset: space(d.own('ringInset')?.value),
      keyboardShouldPersistTaps: d.own('keyboardTaps')?.value,
      disabled: d.own('disabled')?.value,
      ...(fade === undefined ? null : { palette: d.palette }),
    },
    ...d.children(d.node.children),
  );
}

function cappedChipRow(d: ControlDraw): ReactElement {
  return d.component(
    BloomCappedChipRow,
    {
      ...roled(d),
      gap: space(d.own('spacing')?.value as SpaceToken | undefined),
      maxLines: d.own('lines')?.value,
    },
    ...d.children(d.node.children),
  );
}

/** A `Button` node as an empty state's suggestion: its `.id()`, label, glyph and press. */
function suggestion(d: ControlDraw, button: Node) {
  const { label, leading } = chipContent(button.children);
  return {
    id: String(lastOf(button, 'id')?.value ?? label ?? ''),
    label: label ?? '',
    icon: leading,
    onPress: d.press(lastOf(button, 'onPress')?.value) ?? (() => {}),
  };
}

function emptyState(d: ControlDraw): ReactElement {
  const illustration = d.own('illustration')?.value;
  const suggestions = d.own('suggestions')?.value;
  const caption = d.own('caption')?.value as Child | undefined;
  const content = d.node.children.length === 0 ? undefined : d.children(d.node.children);
  return d.pressAround((props) =>
    d.component(BloomEmptyState, {
      ...props,
      icon: d.own('icon')?.value as IconComponent | undefined,
      illustration: illustration === undefined ? undefined : d.render(illustration),
      title: (d.node.props as TitledProps).title,
      description: d.own('description')?.value,
      media: d.own('media')?.value,
      variant: d.own('style')?.value,
      action: emptyStateAction(d, d.own('action')?.value as ViewNode | undefined),
      secondaryAction: emptyStateAction(d, d.own('secondaryAction')?.value),
      suggestions:
        suggestions === undefined
          ? undefined
          : nodesOf(suggestions).map((button) => suggestion(d, button)),
      suggestionsLabel: d.own('suggestionsLabel')?.value,
      footer: caption === undefined ? undefined : d.render(caption),
      children: content === undefined ? undefined : createElement(Fragment, null, ...content),
    }),
  );
}

function admonition(d: ControlDraw): ReactElement {
  const content = nodesOf(d.node.children).map((child, index) =>
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

/** A tab's label's own size, line and weight, as Bloom's `TabsTrigger` takes them (`textStyle`). */
function tabText(item: Node): TextStyle | undefined {
  const font = lastOf(item, 'font')?.value as Exclude<FontName, FontFamilyName> | undefined;
  const leading = lastOf(item, 'leading')?.value as LeadingToken | undefined;
  const weight = lastOf(item, 'weight')?.value as WeightName | undefined;
  if (font === undefined && leading === undefined && weight === undefined) return undefined;
  // A weight is one of React Native's own (`'700'`), as `resolveFont` resolves it from the spec.
  return resolveFont(font, weight, leading) as TextStyle;
}

function tabs(d: ControlDraw): ReactElement {
  const [value, setValue] = (d.node.props as TabsProps).selection;
  // Its tabs and what they show, in order: a `TabContent` is drawn as the language draws a view.
  const triggers = nodesOf(d.node.children).map((item) => {
    if (item.kind === 'tabContent') return d.render(item);
    const { value: tab, label } = item.props as TabItemProps;
    return createElement(TabsTrigger, {
      key: tab,
      value: tab,
      label,
      leadingIcon: lastOf(item, 'icon')?.value as IconComponent | undefined,
      count: (lastOf(item, 'count')?.value as number | null | undefined) ?? undefined,
      disabled: lastOf(item, 'disabled')?.value,
      testID: lastOf(item, 'testID')?.value,
      iconOnly: lastOf(item, 'iconOnly') === undefined ? undefined : true,
      reorderable: lastOf(item, 'reorderable')?.value,
      trailing: slot(d, lastOf(item, 'trailing')?.value),
      onLongPress: d.press(lastOf(item, 'onLongPress')?.value as Press | undefined),
      style: partBoxStyle(item.modifiers),
      textStyle: tabText(item),
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
      onReorder: d.own('onReorder')?.value,
      dragTranslation: d.own('dragTranslation')?.value,
      pressOpenTab: d.own('pressOpenTab')?.value,
    },
    ...triggers,
  );
}

function tabContent(d: ControlDraw): ReactElement {
  return d.component(
    TabsContent,
    { key: d.key ?? (d.node.props as ValueProps).value, value: (d.node.props as ValueProps).value },
    ...d.children(d.node.children),
  );
}

function groupedSectionIcon(d: ControlDraw): ReactElement {
  const { icon } = d.node.props as IconProps;
  return createElement(BloomGroupedSectionIcon, {
    key: d.key,
    tone: d.own('tint')?.value as AccentTone | undefined,
    testID: d.testID,
    children: ({ color, size }: { color: string; size: number }) =>
      createElement(icon, { width: size, height: size, fill: color }),
  });
}

function selectionCard(d: ControlDraw): ReactElement {
  const toggle = d.own('toggle')?.value;
  const illustration = d.own('illustration')?.value;
  const props = d.props();
  return d.component(
    BloomSelectionCard,
    {
      ...props,
      // A toggle is a checkbox, one of several; a chosen card whose press is the screen's, a radio.
      selection: toggle === undefined ? 'single' : 'multiple',
      selected: toggle === undefined ? (d.own('selected')?.value ?? false) : toggle[0],
      onPress: toggle === undefined ? props.onPress : () => toggle[1](!toggle[0]),
      title: (d.node.props as TitledProps).title,
      description: d.own('description')?.value,
      icon: d.own('icon')?.value as IconComponent | undefined,
      indicator: d.own('indicator')?.value,
      media: illustration === undefined ? undefined : d.render(illustration),
      compact: d.own('density')?.value === 'compact' ? true : undefined,
      disabled: d.own('disabled')?.value,
      invalid: d.own('invalid')?.value,
      nativeID: d.own('nativeID')?.value,
      describedBy: d.own('describedBy')?.value,
    },
    ...d.children(d.node.children),
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
  // A view of what it caught is drawn where the boundary is, as a view is.
  const drawn =
    typeof fallback === 'function'
      ? (context: ErrorBoundaryFallbackContext) => d.render(fallback(context))
      : fallback === undefined
        ? undefined
        : d.render(fallback);
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
      fallback: drawn,
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
  chipRow,
  cappedChipRow,
  groupedSectionIcon,
  groupedSectionDivider: (d) =>
    createElement(BloomGroupedSectionDivider, { key: d.key, inset: space(d.own('inset')?.value) }),
  groupedSectionCollapse: (d) =>
    createElement(
      BloomGroupedSectionCollapse,
      { key: d.key, open: (d.node.props as OpenProps).open, testID: d.testID },
      ...d.children(d.node.children),
    ),
  tabContent,
  selectionCard,
};
