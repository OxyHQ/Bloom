import type { MotionValue } from '@oxy.so/bloom/motion';
import type { ComponentType, ReactNode } from 'react';
import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
  GestureResponderEvent,
  Insets,
} from 'react-native';
import type { BloomAppearance, BloomSize, BloomTone } from '@oxy.so/bloom/appearance';
import type {
  BloomImageErrorInfo,
  BloomImageLoadInfo,
  BloomImageSource,
} from '@oxy.so/bloom/image';
import type { BottomBarProps } from '@oxy.so/bloom/bottom-bar';
import type { PageHeaderProps } from '@oxy.so/bloom/page-header';
import type { AppShellProps } from '@oxy.so/bloom/app-shell';
import type { AccentTone } from '@oxy.so/bloom/theme';
import type { AvatarAccount, AvatarProps as BloomAvatarProps } from '@oxy.so/bloom/avatar';
import type { AvatarGroupItem } from '@oxy.so/bloom/avatar-group';
import type { TagFieldKind } from './controls/tag-field';
import type { FileUploadKind } from './controls/file-upload';
import type { VideoViewKind } from './controls/video-view';
import type { TagSuggestion } from '@oxy.so/bloom/tag-field';
import type { FileUploadFile, FileUploadProps } from '@oxy.so/bloom/file-upload';
import type { TooltipKind } from './controls/tooltip';
import type { BreadcrumbKind } from './controls/breadcrumb';
import type { ActivityHeatmapKind } from './controls/activity-heatmap';
import type { BreadcrumbHoverMenu } from '@oxy.so/bloom/breadcrumb';
import type { ActivityHeatmapDay } from '@oxy.so/bloom/activity-heatmap';
import type { StepperKind } from './controls/stepper';
import type { CodeKind } from './controls/code';
import type { AccordionKind } from './controls/accordion';
import type { AccordionTransition } from '@oxy.so/bloom/accordion';
import type { SliderKind } from './controls/slider';
import type { MarkdownKind } from './controls/markdown';
import type { CarouselKind } from './controls/carousel';
import type { ListKind, VirtualListTuning } from './controls/list';
import type { ListAction, ListProps } from '@oxy.so/bloom/list';
import type { SwipeRowActions, SwipeRowProps } from '@oxy.so/bloom/swipe-row';
import type { TableKind } from './controls/table';
import type { StatBarKind } from './controls/stat-bar';
import type { RatingKind } from './controls/rating';
import type { MeterReveal } from '@oxy.so/bloom/stat-bar';
import type { DatePickerKind } from './controls/date-picker';
import type { HourFormat, WeekStart } from '@oxy.so/bloom/date-picker';
import type { Binding } from './binding';

import type { SearchToken } from '@oxy.so/bloom/search';

import type { ContainerKind } from './controls/containers';
import type {
  Autocapitalize,
  ContentType,
  InputKind,
  Keyboard,
  RadioStyle,
  SearchCollapse,
  SegmentedStyle,
  SubmitLabel,
  TextareaResize,
} from './controls/inputs';
import type { OverlayKind } from './controls/overlays';
import { OBJECTS } from './generated/spec.generated';
import { regular, type GlassValue } from './glass';
import type { KeyframesValue } from './motion/keyframes';
import type { Namespace } from './motion/namespace';
import type { MotionToken, RotationName } from './motion/tokens';
import { motionKey } from './motion/tokens';
import type { TransitionValue } from './motion/transition';
import {
  tokenKey,
  type AppToken,
  type Alignment,
  type Axis,
  type BorderEdge,
  type Condition,
  type Justify,
  type LengthToken,
  type OverlayAlignment,
  type ShadowName,
  type ScaleName,
  type CornerSide,
  type WordBreak,
  type ListMarker,
  type ZIndexName,
  type ButtonLinkTone,
  type ButtonShape,
  type ControlDensity,
  type ContentFit,
  type DurationName,
  type Edge,
  type Role,
  type ShrinkPriority,
  type AvatarColor,
  type AvatarLayout,
  type AvatarOverflow,
  type AvatarSizeName,
  type AvatarSizeToken,
  type BadgePlacement,
  type BadgeSize,
  type BadgeStyle,
  type LoadingStyle,
  type RatingCountStyle,
  type MeterCap,
  type ColumnWidthToken,
  type TableSort,
  type ListSeparator,
  type ArrowsPlacement,
  type ArrowsVisibility,
  type DotsShape,
  type DotsStyle,
  type StepperStyle,
  type TooltipSide,
  type RatingStyle,
  type Presence,
  type ShapeName,
  type BorderWidthName,
  type ColorName,
  type ColorToken,
  type InkToken,
  type CornerCurve,
  type CornerName,
  type DividerStyle,
  type GridFlow,
  type FontName,
  type HitSlopName,
  type IconSizeName,
  type IconSizeToken,
  type LeadingToken,
  type TrackingName,
  type OpacityName,
  type PaddingToken,
  type SpaceToken,
  type WeightName,
  type HeaderPresentation,
  type ScrollEdge,
  type TextAlignment,
  type TextCase,
  type TextStyleName,
  type TitleDisplay,
  type Truncation,
} from './tokens';

// ── Modifiers: immutable data, applied in order ──────────────────

export type {
  Alignment,
  Axis,
  BorderEdge,
  Condition,
  Justify,
  OverlayAlignment,
  ButtonShape,
  ContentFit,
  Edge,
  HeaderPresentation,
  Role,
  ScrollEdge,
  ShrinkPriority,
  TextAlignment,
  TextCase,
  TextStyleName,
  TitleDisplay,
  Truncation,
};
export type { GlassValue };
export type EngagementTone = Exclude<AccentTone, 'default'>;
export type IconComponent = ComponentType<{ width?: number; height?: number; fill?: string }>;
export type PressHandler = (event: GestureResponderEvent) => unknown;

/**
 * A place to go, as data: what `navigate(href, params)` returns. A press
 * modifier takes it like a handler; the router `layout()` and `screen()` that
 * draw the view resolve it to their navigator (a deck panel's own, on the web).
 */
export class Navigation {
  constructor(
    readonly href: string,
    readonly params: Readonly<Record<string, string | number>> | undefined,
  ) {}
}
export type Press = PressHandler | Navigation;

/** How a screen's sheet is presented: Bloom's Dialog, from the bottom and centred from `md`. */
export interface SheetOptions {
  /** Called when the reader dismisses the sheet (a swipe, the backdrop, Escape). */
  readonly onDismiss?: () => void;
  readonly title?: string;
}

/**
 * The app shell's own options, which stay the app's: its layout mode, panels
 * and error boundaries. The language places the navigator (in the panel the
 * app names with `navigator`) and owns the navigation chrome (sidebar rows,
 * the bottom bar and the primary action).
 */
export type ShellOptions = (
  navigator: ReactNode,
) => Omit<AppShellProps, 'primaryAction' | 'bottomBar' | 'children'>;

/** A screen's own bar at its foot (a reply composer): Bloom `Screen`'s `bottomBar`. */
export interface ScreenFooter {
  /** `overlay` floats it over the content, whose scroller pads its end clear of it; `inset` (default) keeps the content above it. */
  readonly placement?: 'inset' | 'overlay';
  /** `follow` rides the keyboard and keeps the focused input above it; `hide` (default) gives way to it. */
  readonly keyboard?: 'hide' | 'visible' | 'follow';
}

/** The title's heading level for assistive technology (the web's `aria-level`); 1 by default. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** What a screen's header is: a presentation of the screen's own title and toolbar, none, or a header of its own. */
export type ScreenHeader = HeaderPresentation | false | ViewNode;
export type ImageLoadHandler = (info: BloomImageLoadInfo) => void;
export type ImageErrorHandler = (info: BloomImageErrorInfo) => void;

/** A progress on the UI thread (a Reanimated shared value), as Bloom's bars take it. */
export type Progress = NonNullable<BottomBarProps['minimizeProgress']>;
/** The page's scroll offset on the UI thread, as Bloom's header takes it. */
export type ScrollOffset = NonNullable<PageHeaderProps['scrollY']>;

/**
 * The modifiers whose value is stored as given: flags, handlers, slots and the
 * values only one node kind reads. Each is `{ kind, key, value }`.
 */
export interface ValueModifiers {
  disabled: boolean;
  loading: boolean;
  collapsed: boolean;
  icon: IconComponent;
  destructive: true;
  checked: boolean;
  keepOpen: true;
  title: string;
  badge: number | ViewNode | undefined;
  activeIcon: IconComponent;
  selection: string;
  onSelect: (id: string) => void;
  action: Child;
  minimize: Progress | undefined;
  progress: Progress | undefined;
  hide: Progress | undefined;
  titleDisplay: TitleDisplay;
  subtitle: string | undefined;
  toolbar: readonly Child[];
  toolbarLeading: readonly Child[];
  onBack: (() => void) | null | undefined;
  scrollEdge: ScrollEdge;
  scrollY: ScrollOffset | undefined;
  presentation: HeaderPresentation;
  header: ScreenHeader;
  headingLevel: HeadingLevel;
  backLabel: string | undefined;
  onReselect: (() => void) | undefined;
  bottomBar: boolean;
  shell: ShellOptions;
  tag: string;
  actions: ViewNode;
  textStyle: TextStyleName;
  truncation: Truncation;
  selectable: boolean;
  link: string;
  textAlign: TextAlignment;
  italic: true;
  underline: true;
  strikethrough: true;
  textCase: TextCase;
  monospacedDigit: true;
  wordBreak: WordBreak;
  listMarker: ListMarker;
  lineStyle: DividerStyle;
  verified: boolean;
  live: boolean;
  liveBadge: boolean;
  presence: Presence;
  dot: true;
  max: number;
  placement: BadgePlacement;
  layout: AvatarLayout;
  total: number | undefined;
  overflow: AvatarOverflow;
  initials: true;
  onPressItem: ((item: AvatarGroupItem, index: number) => void) | undefined;
  hoverCard: boolean;
  pressScale: true;
  hoverHighlight: boolean | undefined;
  pressed: boolean;
  colors: readonly [ColorToken, ColorToken];
  linkTone: ButtonLinkTone;
  inverted: boolean;
  density: ControlDensity;
  dividers: boolean;
  separated: boolean;
  columns: number;
  minCellWidth: SpaceToken;
  flow: GridFlow;

  // Date and time pickers (controls/date-picker.tsx)
  bounds: readonly [
    min: Date | string | number | null,
    max: Date | string | number | null | undefined,
  ];
  unavailable: (date: Date) => boolean;
  weekStart: WeekStart;
  locale: string;
  placeholder: string;
  presented: Binding<boolean>;
  labels: Readonly<Record<string, unknown>>;
  quickSelect: boolean;
  initialMonth: Date;
  months: 1 | 2;
  step: number;
  hourFormat: HourFormat;

  // Ratings (controls/rating.tsx)
  countStyle: RatingCountStyle;
  showsValue: boolean;
  starSize: SpaceToken;
  starTint: ColorToken;
  countTint: ColorToken;
  emptyTint: ColorToken;
  fillValue: number;
  starLabel: (value: number, max: number) => string;
  valueLabel: string;
  labelWidth: SpaceToken;
  reveal: MeterReveal;

  // Meters and progress bars (controls/stat-bar.tsx)
  valueText: string;
  indeterminate: boolean;
  decorative: true;
  trackTint: ColorToken;
  thickness: SpaceToken;
  fillDuration: DurationName;
  barCorner: Exclude<CornerName, 'concentric'>;
  backdrop: ColorToken;
  cap: MeterCap;
  content: Child;
  onStop: readonly [action: () => void, label: string];
  rangeLabels: readonly [min: string | undefined, max: string | undefined];

  // Tables (controls/table.tsx)
  width: ColumnWidthToken;
  share: number;
  minWidth: SpaceToken;
  sort: readonly [direction: TableSort, action: () => void];
  prefix: string | Child;
  emptyState: string | number | Child;
  selected: boolean;

  // Rows and lists (controls/list.tsx)
  supporting: string | Child;
  supportingLines: 1 | 2 | 3 | 'adaptive';
  footnote: Child;
  attachments: Child;
  compactPadding: SpaceToken;
  onPrefetch: () => void;
  checkable: Binding<boolean>;
  selecting: boolean;
  selectionLabel: string;
  rowActions: readonly [actions: readonly ListAction[], onAction: (key: string) => void];
  swipeActions: readonly [actions: SwipeRowActions, full: SwipeRowProps['fullSwipeAction']];
  swipeEnabled: boolean;
  contextMenu: Child;
  separator: ListSeparator;
  scrollable: boolean;
  scrollHeight: SpaceToken;
  stickyHeaders: boolean;
  sectionIndex: NonNullable<ListProps['sectionIndex']>;
  headerContent: Child;
  footerContent: Child;
  loadingRows: number;
  itemKey: (item: never, index: number) => string;
  itemType: (item: never, index: number) => string | number | undefined;
  estimatedItemSize: number;
  onEndReached: readonly [action: () => void, threshold: number | undefined];
  refreshable: readonly [refreshing: boolean, onRefresh: () => void];
  stickyIndices: readonly number[];
  restorationKey: string;
  tuning: VirtualListTuning;
  onSelectAll: (checked: boolean) => void;
  onClear: () => void;

  // Carousels (controls/carousel.tsx)
  groupSize: number;
  arrows: ArrowsPlacement | false;
  arrowsVisibility: ArrowsVisibility;
  arrowsInset: SpaceToken;
  hidesUnavailableArrows: true;
  dots: boolean;
  contentInset: SpaceToken;
  page: Binding<number>;

  // Markdown (controls/markdown.tsx)
  streaming: boolean;
  onLinkPress: (url: string) => void;
  codeBlock: (code: string, language: string | undefined) => Child;

  // Sliders (controls/slider.tsx)
  keyboardStep: number;
  thumbSize: SpaceToken;
  fillTint: ColorToken;
  thumbTint: ColorToken;
  onCommit: (value: never) => void;
  valueFormat: (value: number, index: number) => string;

  // Accordions (controls/accordion.tsx)
  allowsMultiple: true;
  revealMotion: AccordionTransition;
  indicator: Child;

  // Code (controls/code.tsx)
  language: string;
  lineNumbers: boolean;
  highlight: readonly string[];
  languageLabel: string;
  filename: string;
  diff: readonly [additions: number, deletions: number];
  copyable: boolean;
  onCopy: (code: string) => void | Promise<void>;

  // Steppers (controls/stepper.tsx)
  onRemove: () => void;

  // Tooltips, breadcrumbs and activity heatmaps (controls/tooltip.tsx, controls/breadcrumb.tsx, controls/activity-heatmap.tsx)
  side: TooltipSide;
  openDelay: number;
  collapses: true;
  separatorView: Child;
  hoverMenu: BreadcrumbHoverMenu;
  days: number;
  endDate: string;
  levels: number[];
  cellSize: SpaceToken;
  onPressDay: (day: ActivityHeatmapDay) => void;

  // Tag fields, file uploads and videos (controls/tag-field.tsx, controls/file-upload.tsx, controls/video-view.tsx)
  suggestions: readonly [list: ReadonlyArray<string | TagSuggestion>, max: number | undefined];
  allowsCreate: boolean;
  onMaxReached: () => void;
  normalize: (raw: string) => string;
  query: Binding<string>;
  invalid: boolean;
  file: FileUploadFile | null;
  uploadProgress: number;
  onFileSelected: (file: FileUploadFile) => void;
  onUploadComplete: (file: FileUploadFile) => void;
  onReject: (message: string, file: FileUploadFile) => void;
  picker: NonNullable<FileUploadProps['onPickFiles']>;
  allowedExtensions: readonly string[];
  maxBytes: number;
  fileIcon: (file: FileUploadFile) => Child;
  nativeControls: boolean;
  allowsPictureInPicture: boolean;

  // Inputs (controls/inputs.tsx)
  required: boolean;
  floatingLabel: true;
  revealable: true;
  suffix: string;
  keyboard: Keyboard;
  autocapitalize: Autocapitalize;
  autocorrect: boolean;
  contentType: ContentType;
  submitLabel: SubmitLabel;
  onSubmit: () => void;
  autoFocus: true;
  maxLength: number;
  description: string;
  error: string | null | undefined;
  readOnly: true;
  rows: number;
  autoResize: number | undefined;
  resize: TextareaResize;
  showCount: true;
  tabs: true;
  collapsible: SearchCollapse | undefined;
  tokens: Binding<readonly SearchToken[]>;

  // Overlays and feedback (controls/overlays.tsx)

  // Containers (controls/containers.tsx)
}
export type ValueModifier = {
  [K in keyof ValueModifiers]: {
    readonly kind: K;
    readonly key: string;
    readonly value: ValueModifiers[K];
  };
}[keyof ValueModifiers];

/** A frame's lengths: space rungs, app tokens, or lengths relative to the parent (`full`, `1/2`…). */
export interface FrameSpec {
  width?: LengthToken;
  height?: LengthToken;
  minWidth?: LengthToken;
  minHeight?: LengthToken;
  maxWidth?: LengthToken;
  maxHeight?: LengthToken;
}

/** A pinned view's distance from each edge of its parent (`none` touches it; `-sm` pulls past it). */
export interface PositionEdges {
  top?: PaddingToken;
  bottom?: PaddingToken;
  leading?: PaddingToken;
  trailing?: PaddingToken;
}

/** How far a view is drawn from where it is laid out: `x` to the right, `y` down. */
/** A move along each axis: a space token, or a `MotionValue` the view follows. */
export interface OffsetSpec {
  x?: PaddingToken | MotionValue;
  y?: PaddingToken | MotionValue;
}

/** What `.drag()` takes besides its value. */
export interface DragSpec {
  /** The axis the finger moves the value along. Default `'y'`. */
  axis?: 'x' | 'y';
  /** Bounds of the value while dragging. */
  min?: number;
  max?: number;
  /** Once per touch, when it ends: where the value is and the finger's velocity. */
  onEnd?: (end: { value: number; velocity: number }) => void;
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export type Modifier =
  | {
      readonly kind: 'padding';
      readonly key: string;
      readonly edge: Edge;
      readonly value: PaddingToken;
    }
  | { readonly kind: 'frame'; readonly key: string; readonly value: FrameSpec }
  | { readonly kind: 'grow'; readonly key: string }
  | { readonly kind: 'alignSelf'; readonly key: string; readonly value: Alignment }
  | { readonly kind: 'position'; readonly key: string; readonly value: PositionEdges }
  | { readonly kind: 'offset'; readonly key: string; readonly value: OffsetSpec }
  | { readonly kind: 'zIndex'; readonly key: string; readonly value: ZIndexName }
  | { readonly kind: 'hidden'; readonly key: string; readonly value: boolean }
  | { readonly kind: 'basis'; readonly key: string; readonly value: LengthToken }
  | { readonly kind: 'scale'; readonly key: string; readonly value: ScaleName | MotionValue }
  | { readonly kind: 'allowsHitTesting'; readonly key: string; readonly value: boolean }
  | { readonly kind: 'accessibilityOnly'; readonly key: string }
  | {
      readonly kind: 'overlay';
      readonly key: string;
      readonly content: ViewNode;
      readonly alignment: OverlayAlignment;
      /** A view background (\`.background(view)\`): drawn behind the content, not over it. */
      readonly behind: boolean;
    }
  | { readonly kind: 'shadow'; readonly key: string; readonly value: ShadowName }
  | { readonly kind: 'fill'; readonly key: string; readonly value: ColorToken }
  | {
      readonly kind: 'stroke';
      readonly key: string;
      readonly value: ColorToken;
      readonly width: BorderWidthName;
    }
  | {
      readonly kind: 'image';
      readonly key: string;
      readonly source: ShapeImageSource;
      readonly alt: string | undefined;
    }
  | {
      readonly kind: 'when';
      readonly key: string;
      readonly condition: Condition;
      /** What the variant changes: modifiers over the values the chain set before it. */
      readonly modifiers: readonly Modifier[];
    }
  | {
      readonly kind: 'ring';
      readonly key: string;
      readonly value: InkToken | 'none';
      readonly width: BorderWidthName;
      readonly offset: SpaceToken | undefined;
    }
  | { readonly kind: 'shrink'; readonly key: string; readonly value: ShrinkPriority }
  | { readonly kind: 'background'; readonly key: string; readonly value: InkToken }
  | {
      readonly kind: 'border';
      readonly key: string;
      readonly value: InkToken;
      readonly width: BorderWidthName;
      readonly edge: BorderEdge;
    }
  | {
      readonly kind: 'corner';
      readonly key: string;
      readonly value: CornerName;
      readonly side: CornerSide;
    }
  | { readonly kind: 'cornerCurve'; readonly key: string; readonly value: CornerCurve }
  | { readonly kind: 'opacity'; readonly key: string; readonly value: OpacityName }
  | { readonly kind: 'glass'; readonly key: string; readonly value: GlassValue }
  | { readonly kind: 'blur'; readonly key: string }
  | { readonly kind: 'foreground'; readonly key: string; readonly value: InkToken }
  | { readonly kind: 'font'; readonly key: string; readonly value: FontName }
  | { readonly kind: 'weight'; readonly key: string; readonly value: WeightName }
  | { readonly kind: 'leading'; readonly key: string; readonly value: LeadingToken }
  | { readonly kind: 'tracking'; readonly key: string; readonly value: TrackingName }
  | { readonly kind: 'spacing'; readonly key: string; readonly value: SpaceToken }
  | { readonly kind: 'align'; readonly key: string; readonly value: Alignment }
  | { readonly kind: 'justify'; readonly key: string; readonly value: Justify }
  | { readonly kind: 'wrap'; readonly key: string; readonly value: boolean }
  | { readonly kind: 'axis'; readonly key: string; readonly value: Axis }
  | { readonly kind: 'lines'; readonly key: string; readonly value: number }
  | { readonly kind: 'noWrap'; readonly key: string }
  | { readonly kind: 'contentFit'; readonly key: string; readonly value: ContentFit }
  | { readonly kind: 'aspectRatio'; readonly key: string; readonly value: number }
  | { readonly kind: 'crossFade'; readonly key: string; readonly value: DurationName }
  | { readonly kind: 'onLoad'; readonly key: string; readonly value: ImageLoadHandler | undefined }
  | {
      readonly kind: 'onError';
      readonly key: string;
      readonly value: ImageErrorHandler | undefined;
    }
  | {
      readonly kind: 'size';
      readonly key: string;
      readonly value: IconSizeToken | AvatarSizeToken | BloomSize | BadgeSize | SpaceToken;
    }
  | {
      readonly kind: 'style';
      readonly key: string;
      readonly value:
        | BloomAppearance
        | BadgeStyle
        | LoadingStyle
        | RatingStyle
        | DotsStyle
        | StepperStyle
        | RadioStyle
        | SegmentedStyle;
    }
  | {
      readonly kind: 'shape';
      readonly key: string;
      readonly value: ButtonShape | ShapeName | DotsShape;
    }
  | {
      readonly kind: 'tint';
      readonly key: string;
      readonly value: AccentTone | BloomTone | ColorName | AvatarColor;
    }
  | {
      readonly kind: 'count';
      readonly key: string;
      readonly value: number | string | null | undefined;
    }
  | { readonly kind: 'active'; readonly key: string; readonly value: boolean | undefined }
  | { readonly kind: 'trailing'; readonly key: string; readonly value: readonly Child[] }
  | {
      readonly kind: 'countFormat';
      readonly key: string;
      readonly value: (count: number) => string;
    }
  | { readonly kind: 'onPress'; readonly key: string; readonly value: Press | undefined }
  | { readonly kind: 'onLongPress'; readonly key: string; readonly value: (() => void) | undefined }
  | {
      readonly kind: 'onHover';
      readonly key: string;
      readonly enter: (() => void) | undefined;
      readonly leave: (() => void) | undefined;
    }
  | { readonly kind: 'hoverGroup'; readonly key: string }
  | { readonly kind: 'label'; readonly key: string; readonly value: string | undefined }
  | { readonly kind: 'hint'; readonly key: string; readonly value: string | undefined }
  | { readonly kind: 'role'; readonly key: string; readonly value: Role }
  | { readonly kind: 'hitSlop'; readonly key: string; readonly value: HitSlopName }
  | { readonly kind: 'testID'; readonly key: string; readonly value: string }
  | { readonly kind: 'id'; readonly key: string; readonly value: string | number }
  | {
      readonly kind: 'sheet';
      readonly key: string;
      readonly open: boolean;
      readonly content: () => Child;
      readonly options: SheetOptions | undefined;
    }
  | {
      readonly kind: 'footer';
      readonly key: string;
      readonly content: Child;
      readonly options: ScreenFooter | undefined;
    }
  | {
      readonly kind: 'primaryAction';
      readonly key: string;
      readonly icon: IconComponent;
      readonly label: string;
      readonly destination: string;
    }
  | { readonly kind: 'rotation'; readonly key: string; readonly value: RotationName | MotionValue }
  | {
      readonly kind: 'drag';
      readonly key: string;
      readonly value: MotionValue;
      readonly options: DragSpec;
    }
  | {
      readonly kind: 'swipe';
      readonly key: string;
      readonly direction: SwipeDirection;
      readonly onSwipe: () => void;
    }
  | {
      readonly kind: 'animation';
      readonly key: string;
      readonly motion: MotionToken;
      readonly value: unknown;
      readonly gated: boolean;
    }
  | { readonly kind: 'transition'; readonly key: string; readonly value: TransitionValue }
  | {
      readonly kind: 'keyframes';
      readonly key: string;
      readonly value: KeyframesValue;
      readonly trigger: unknown;
    }
  | {
      readonly kind: 'matchedGeometry';
      readonly key: string;
      readonly id: string;
      readonly namespace: Namespace;
    }
  | {
      readonly kind: 'contentTransition';
      readonly key: string;
      readonly value: 'roll';
      readonly direction: number | undefined;
    }
  | { readonly kind: 'loop'; readonly key: string }
  | { readonly kind: 'paused'; readonly key: string; readonly value: boolean }
  | { readonly kind: 'fallback'; readonly key: string; readonly value: Child }
  | ValueModifier;

export type ModifierKind = Modifier['kind'];

// ── Nodes ────────────────────────────────────────────────────────

export type NodeKind =
  | 'stack'
  | 'spacer'
  | 'text'
  | 'icon'
  | 'avatar'
  | 'image'
  | 'button'
  | 'buttonGroup'
  | 'shape'
  | 'action'
  | 'actionBar'
  | 'actionGroup'
  | 'embed'
  | 'view'
  | 'fab'
  | 'menu'
  | 'menuItem'
  | 'menuSubmenu'
  | 'menuSection'
  | 'divider'
  | 'avatarGroup'
  | 'badge'
  | 'iconCircle'
  | 'loading'
  | 'skeleton'
  | 'skeletonGroup'
  | 'fill'
  | 'ratio'
  | 'grid'
  | 'menuContent'
  | 'menuActions'
  | 'header'
  | 'bottomBar'
  | 'tab'
  | 'appLayout'
  | 'navStack'
  | 'route'
  | 'tabView'
  | 'lottie'
  | DatePickerKind
  | RatingKind
  | StatBarKind
  | TableKind
  | ListKind
  | CarouselKind
  | MarkdownKind
  | SliderKind
  | AccordionKind
  | CodeKind
  | StepperKind
  | TooltipKind
  | BreadcrumbKind
  | ActivityHeatmapKind
  | TagFieldKind
  | FileUploadKind
  | VideoViewKind
  | InputKind
  | OverlayKind
  | ContainerKind;

/** A node as data: its kind, props, children and ordered modifiers. Every view type is one. */
export interface ViewNode {
  readonly kind: NodeKind;
  readonly props: unknown;
  readonly children: readonly Child[];
  readonly modifiers: readonly Modifier[];
}

/** What a container takes. Strings and numbers belong in `Text`; `false`, `null` and `undefined` render nothing. */
export type Child = ViewNode | false | null | undefined | readonly Child[];
/** What a `Text` takes: runs of text, and nested `Text` for inline spans. */
export type TextRun = string | number | ViewNode | false | null | undefined;

export interface StackProps {
  readonly axis: 'horizontal' | 'vertical' | 'depth';
}
export interface TextProps {
  readonly runs: readonly TextRun[];
}
export interface IconProps {
  readonly icon: IconComponent;
}
export interface AvatarProps {
  readonly source: string | null | undefined;
  readonly options: AvatarOptions;
}
export interface AvatarOptions {
  /** Rendition requested for a bare file id (Bloom `Avatar`'s `variant`). */
  readonly variant?: string;
  /** The account it stands for: character, then image, then initials from its name. */
  readonly account?: AvatarAccount;
  /** The person's name: the initial and tint of the fallback disc. */
  readonly name?: string;
  /** Explicit initials for the fallback disc. */
  readonly initials?: string;
  /** An image to show when the source is missing or fails. */
  readonly fallbackSource?: BloomAvatarProps['fallbackSource'];
  /** An explicit character; `null` draws the image even for a bot. */
  readonly character?: BloomAvatarProps['character'];
}
export interface AvatarGroupProps {
  readonly items: readonly AvatarGroupItem[];
}
export interface BadgeProps {
  readonly content: string | number | undefined;
}
export type SkeletonShape = 'text' | 'circle' | 'pill' | 'box';
export interface SkeletonProps {
  readonly shape: SkeletonShape;
}
export interface ImageProps {
  readonly source: BloomImageSource | null | undefined;
  readonly alt: string | undefined;
}
export interface ActionProps {
  readonly icon: IconComponent;
  readonly label: string;
  readonly options: ActionOptions;
}
export interface ActionOptions {
  readonly activeIcon?: IconComponent;
  readonly pop?: boolean;
  readonly rollCount?: boolean;
  readonly busy?: boolean;
  readonly hitSlop?: Insets | number;
  readonly accessibilityActions?: readonly AccessibilityActionInfo[];
  readonly onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
}
export interface LottieProps {
  /** A Lottie animation: a JSON document, a `require`d asset, or a URL. */
  readonly source: unknown;
}
export interface EmbedProps {
  /** A React element, or a function of a renderer that draws language nodes in the current environment. */
  readonly content: ReactNode | ((render: (child: Child) => ReactNode) => ReactNode);
}
export interface MenuProps {
  readonly trigger: Child;
}
export interface TitleProps {
  readonly title: string;
}
export interface TabProps {
  readonly label: string;
  readonly icon: IconComponent;
}
export interface RouteProps {
  /** The route's name in its navigator (the file's name in the layout's directory). */
  readonly name: string;
  readonly presentation: 'push' | 'sheet';
}
export interface NavStackProps {
  /** The routes the stack declares, in order; a bare name is pushed. */
  readonly routes: readonly (string | ViewNode)[];
}
export interface MenuContentProps {
  /** The content's body: called while the menu is open, by the component that presents it. */
  readonly body: (props: object) => Child;
  readonly props: object;
}
/** What a tagged row's choice runs: built only when a row is chosen (see `actions()`). */
export type MenuActionTable = Readonly<Record<string, (() => void) | undefined>>;
export interface MenuActionsProps {
  /** The actions' body: called once per choice, by a component mounted for it. */
  readonly body: (props: object) => MenuActionTable;
  readonly props: object;
}
export interface ViewNodeProps {
  /** The view's component: React's own memo of its host, so props compare key by key. */
  readonly component: ComponentType<object>;
  /** The props object the view was called with, handed to its body as is. */
  readonly props: object;
}

/**
 * What a node last rendered as, and where: the same node in the same
 * environment renders the same element, so React sees an unchanged element
 * and skips the subtree. A node that keeps its identity across renders (a
 * module constant, one the compiler hoisted, one the React Compiler kept)
 * costs one comparison per render.
 */
export interface Rendered {
  readonly env: unknown;
  readonly provided: unknown;
  readonly animation: unknown;
  readonly key: string | number | undefined;
  /** Drawn inside a text, as an inline span. */
  readonly inText: boolean | undefined;
  /** Drawn as a child of an `HStack`. */
  readonly inRow: boolean | undefined;
  readonly element: ReactNode;
}

/**
 * One node of the tree: a kind, its props, its children, and the ordered list
 * of modifiers chained onto it. A chain call never changes the node it is
 * called on; it returns a new node with one more modifier.
 *
 * Every modifier method exists here; the exported constructor types
 * (`TextView`, `StackView`…) expose only the ones that apply to each kind.
 */
export class Node {
  /** The render memo (see `Rendered`). Internal to the renderer; not part of the node's value. */
  rendered: Rendered | undefined = undefined;

  constructor(
    readonly kind: NodeKind,
    readonly props: unknown,
    readonly children: readonly Child[],
    readonly modifiers: readonly Modifier[] = [],
  ) {}

  private with(modifier: Modifier): Node {
    return new Node(this.kind, this.props, this.children, [...this.modifiers, modifier]);
  }

  padding(edgeOrValue: Edge | PaddingToken, value?: PaddingToken): Node {
    const edge: Edge = value === undefined ? 'all' : (edgeOrValue as Edge);
    const token = value === undefined ? (edgeOrValue as PaddingToken) : value;
    return this.with({ kind: 'padding', key: `p:${edge}:${tokenKey(token)}`, edge, value: token });
  }
  frame(value: FrameSpec): Node {
    return this.with({ kind: 'frame', key: `f:${objectKey(value, FRAME_KEYS)}`, value });
  }
  grow(): Node {
    return this.with({ kind: 'grow', key: 'grow' });
  }
  alignSelf(value: Alignment): Node {
    return this.with({ kind: 'alignSelf', key: `self:${value}`, value });
  }
  position(value: PositionEdges): Node {
    return this.with({ kind: 'position', key: `pos:${objectKey(value, EDGE_KEYS)}`, value });
  }
  offset(value: OffsetSpec): Node {
    return this.with({ kind: 'offset', key: 'offset', value });
  }
  zIndex(value: ZIndexName): Node {
    return this.with({ kind: 'zIndex', key: `z:${value}`, value });
  }
  hidden(value = true): Node {
    return this.with({ kind: 'hidden', key: `hidden:${value}`, value });
  }
  basis(value: LengthToken): Node {
    return this.with({ kind: 'basis', key: `basis:${tokenKey(value)}`, value });
  }
  scale(value: ScaleName | MotionValue): Node {
    return this.with({ kind: 'scale', key: 'scale', value });
  }
  allowsHitTesting(value: boolean): Node {
    return this.with({ kind: 'allowsHitTesting', key: `hit:${value}`, value });
  }
  accessibilityOnly(): Node {
    return this.with({ kind: 'accessibilityOnly', key: 'a11yOnly' });
  }
  overlay(content: ViewNode, alignment: OverlayAlignment = 'center'): Node {
    return this.with({ kind: 'overlay', key: 'overlay', content, alignment, behind: false });
  }
  shadow(value: ShadowName): Node {
    return this.with({ kind: 'shadow', key: `sh:${value}`, value });
  }
  when(condition: Condition, build: (variant: Node) => Node): Node {
    const { modifiers } = build(new Node(this.kind, undefined, []));
    const key = `when:${condition}(${modifiers.map((modifier) => modifier.key).join(';')})`;
    return this.with({ kind: 'when', key, condition, modifiers });
  }
  ring(value: InkToken | 'none', width: BorderWidthName = 'thin', offset?: SpaceToken): Node {
    const key = `ring:${tokenKey(value)}:${width}:${offset === undefined ? '' : tokenKey(offset)}`;
    return this.with({ kind: 'ring', key, value, width, offset });
  }
  shrink(value: ShrinkPriority): Node {
    return this.with({ kind: 'shrink', key: `shrink:${value}`, value });
  }
  /** A colour role behind the view, or a view behind it (at an alignment, SwiftUI's `background(alignment:)`). */
  background(value: InkToken | ViewNode, alignment: OverlayAlignment = 'center'): Node {
    if (isNode(value)) {
      return this.with({
        kind: 'overlay',
        key: 'overlay',
        content: value,
        alignment,
        behind: true,
      });
    }
    const ink = value as InkToken;
    return this.with({ kind: 'background', key: `bg:${tokenKey(ink)}`, value: ink });
  }
  border(value: InkToken, width: BorderWidthName = 'hairline', edge: BorderEdge = 'all'): Node {
    return this.with({
      kind: 'border',
      key: `b:${tokenKey(value)}:${width}:${edge}`,
      value,
      width,
      edge,
    });
  }
  corner(value: CornerName, side: CornerSide = 'all'): Node {
    const key = side === 'all' ? `r:${value}` : `r:${value}:${side}`;
    return this.with({ kind: 'corner', key, value, side });
  }
  cornerCurve(value: CornerCurve): Node {
    return this.with({ kind: 'cornerCurve', key: `rc:${value}`, value });
  }
  opacity(value: OpacityName): Node {
    return this.with({ kind: 'opacity', key: `o:${value}`, value });
  }
  glass(value: GlassValue = regular): Node {
    return this.with({ kind: 'glass', key: value.key, value });
  }
  blur(): Node {
    return this.with({ kind: 'blur', key: 'blur' });
  }
  foreground(value: InkToken): Node {
    return this.with({ kind: 'foreground', key: `fg:${tokenKey(value)}`, value });
  }
  font(value: FontName): Node {
    return this.with({ kind: 'font', key: `font:${value}`, value });
  }
  weight(value: WeightName): Node {
    return this.with({ kind: 'weight', key: `w:${value}`, value });
  }
  leading(value: LeadingToken): Node {
    return this.with({ kind: 'leading', key: `lh:${tokenKey(value)}`, value });
  }
  tracking(value: TrackingName): Node {
    return this.with({ kind: 'tracking', key: `ls:${value}`, value });
  }
  spacing(value: SpaceToken): Node {
    return this.with({ kind: 'spacing', key: `gap:${tokenKey(value)}`, value });
  }
  align(value: Alignment): Node {
    return this.with({ kind: 'align', key: `align:${value}`, value });
  }
  justify(value: Justify): Node {
    return this.with({ kind: 'justify', key: `justify:${value}`, value });
  }
  wrap(value = true): Node {
    return this.with({ kind: 'wrap', key: `wrap:${value}`, value });
  }
  axis(value: Axis): Node {
    return this.with({ kind: 'axis', key: `axis:${value}`, value });
  }
  lines(value: number): Node {
    return this.with({ kind: 'lines', key: `lines:${value}`, value });
  }
  noWrap(): Node {
    return this.with({ kind: 'noWrap', key: 'nowrap' });
  }
  contentFit(value: ContentFit): Node {
    return this.with({ kind: 'contentFit', key: `fit:${value}`, value });
  }
  aspectRatio(value: number): Node {
    return this.with({ kind: 'aspectRatio', key: `aspect:${value}`, value });
  }
  crossFade(value: DurationName): Node {
    return this.with({ kind: 'crossFade', key: `crossFade:${value}`, value });
  }
  onLoad(value: ImageLoadHandler | undefined): Node {
    return this.with({ kind: 'onLoad', key: 'onLoad', value });
  }
  onError(value: ImageErrorHandler | undefined): Node {
    return this.with({ kind: 'onError', key: 'onError', value });
  }
  size(value: IconSizeToken | AvatarSizeToken | BloomSize | BadgeSize | SpaceToken): Node {
    return this.with({ kind: 'size', key: `size:${tokenKey(value)}`, value });
  }
  style(
    value:
      | BloomAppearance
      | BadgeStyle
      | LoadingStyle
      | RatingStyle
      | DotsStyle
      | StepperStyle
      | RadioStyle
      | SegmentedStyle,
  ): Node {
    return this.with({ kind: 'style', key: `style:${value}`, value });
  }
  shape(value: ButtonShape | ShapeName | DotsShape): Node {
    return this.with({ kind: 'shape', key: `shape:${value}`, value });
  }
  tint(value: AccentTone | BloomTone | ColorName | AvatarColor): Node {
    return this.with({ kind: 'tint', key: `tint:${value}`, value });
  }
  count(value: number | string | null | undefined): Node {
    return this.with({ kind: 'count', key: 'count', value });
  }
  active(value: boolean | undefined): Node {
    return this.with({ kind: 'active', key: 'active', value });
  }
  trailing(...value: Child[]): Node {
    return this.with({ kind: 'trailing', key: 'trailing', value });
  }
  countFormat(value: (count: number) => string): Node {
    return this.with({ kind: 'countFormat', key: 'countFormat', value });
  }
  /**
   * The press handler. The modifier's PRESENCE makes the view pressable; an
   * `undefined` handler keeps the same host, out of the focus order, so a row
   * that is sometimes inert never changes element type (and never remounts).
   */
  onPress(value: Press | undefined): Node {
    return this.with({ kind: 'onPress', key: 'onPress', value });
  }
  onLongPress(value: (() => void) | undefined): Node {
    return this.with({ kind: 'onLongPress', key: 'onLongPress', value });
  }
  onHover(enter: (() => void) | undefined, leave: (() => void) | undefined): Node {
    return this.with({ kind: 'onHover', key: 'onHover', enter, leave });
  }
  hoverGroup(): Node {
    return this.with({ kind: 'hoverGroup', key: 'hoverGroup' });
  }
  label(value: string | undefined): Node {
    return this.with({ kind: 'label', key: 'label', value });
  }
  hint(value: string | undefined): Node {
    return this.with({ kind: 'hint', key: 'hint', value });
  }
  role(value: Role): Node {
    return this.with({ kind: 'role', key: `role:${value}`, value });
  }
  hitSlop(value: HitSlopName): Node {
    return this.with({ kind: 'hitSlop', key: `hitSlop:${value}`, value });
  }
  testID(value: string): Node {
    return this.with({ kind: 'testID', key: 'testID', value });
  }
  /** The view's identity among its siblings (React's `key`), for lists that reorder. */
  id(value: string | number): Node {
    return this.with({ kind: 'id', key: 'id', value });
  }
  private set<K extends keyof ValueModifiers>(kind: K, value: ValueModifiers[K]): Node {
    return this.with({ kind, key: kind, value } as ValueModifier);
  }
  disabled(value = true): Node {
    return this.set('disabled', value);
  }
  loading(value = true): Node {
    return this.set('loading', value);
  }
  collapsed(value = true): Node {
    return this.set('collapsed', value);
  }
  icon(value: IconComponent): Node {
    return this.set('icon', value);
  }
  destructive(): Node {
    return this.set('destructive', true);
  }
  checked(value: boolean): Node {
    return this.set('checked', value);
  }
  keepOpen(): Node {
    return this.set('keepOpen', true);
  }
  tag(value: string): Node {
    return this.set('tag', value);
  }
  actions(value: ViewNode): Node {
    return this.set('actions', value);
  }
  title(value: string): Node {
    return this.set('title', value);
  }
  badge(value: number | ViewNode | undefined): Node {
    return this.set('badge', value);
  }
  activeIcon(value: IconComponent): Node {
    return this.set('activeIcon', value);
  }
  selection(value: string): Node {
    return this.set('selection', value);
  }
  onSelect(value: (id: string) => void): Node {
    return this.set('onSelect', value);
  }
  action(value: Child): Node {
    return this.set('action', value);
  }
  minimize(value: Progress | undefined): Node {
    return this.set('minimize', value);
  }
  progress(value: Progress | undefined): Node {
    return this.set('progress', value);
  }
  hide(value: Progress | undefined): Node {
    return this.set('hide', value);
  }
  titleDisplay(value: TitleDisplay): Node {
    return this.set('titleDisplay', value);
  }
  subtitle(value: string | undefined): Node {
    return this.set('subtitle', value);
  }
  toolbar(...value: Child[]): Node {
    return this.set('toolbar', value);
  }
  toolbarLeading(...value: Child[]): Node {
    return this.set('toolbarLeading', value);
  }
  onBack(value: (() => void) | null | undefined): Node {
    return this.set('onBack', value);
  }
  scrollEdge(value: ScrollEdge): Node {
    return this.set('scrollEdge', value);
  }
  scrollY(value: ScrollOffset | undefined): Node {
    return this.set('scrollY', value);
  }
  presentation(value: HeaderPresentation): Node {
    return this.set('presentation', value);
  }
  header(value: ScreenHeader): Node {
    return this.set('header', value);
  }
  headingLevel(value: HeadingLevel): Node {
    return this.set('headingLevel', value);
  }
  backLabel(value: string | undefined): Node {
    return this.set('backLabel', value);
  }
  sheet(open: boolean, content: () => Child, options?: SheetOptions): Node {
    return this.with({ kind: 'sheet', key: 'sheet', open, content, options });
  }
  onReselect(value: (() => void) | undefined): Node {
    return this.set('onReselect', value);
  }
  footer(content: Child, options?: ScreenFooter): Node {
    return this.with({ kind: 'footer', key: 'footer', content, options });
  }
  primaryAction(icon: IconComponent, label: string, destination: string): Node {
    return this.with({ kind: 'primaryAction', key: 'primaryAction', icon, label, destination });
  }
  bottomBar(value: boolean): Node {
    return this.set('bottomBar', value);
  }
  shell(value: ShellOptions): Node {
    return this.set('shell', value);
  }
  textStyle(value: TextStyleName): Node {
    return this.set('textStyle', value);
  }
  truncation(value: Truncation): Node {
    return this.set('truncation', value);
  }
  selectable(value = true): Node {
    return this.set('selectable', value);
  }
  link(value: string): Node {
    return this.set('link', value);
  }
  textAlign(value: TextAlignment): Node {
    return this.set('textAlign', value);
  }
  italic(): Node {
    return this.set('italic', true);
  }
  underline(): Node {
    return this.set('underline', true);
  }
  strikethrough(): Node {
    return this.set('strikethrough', true);
  }
  textCase(value: TextCase): Node {
    return this.set('textCase', value);
  }
  monospacedDigit(): Node {
    return this.set('monospacedDigit', true);
  }
  wordBreak(value: WordBreak): Node {
    return this.with({ kind: 'wordBreak', key: `break:${value}`, value });
  }
  lineStyle(value: DividerStyle): Node {
    return this.set('lineStyle', value);
  }
  columns(value: number): Node {
    return this.set('columns', value);
  }
  minCellWidth(value: SpaceToken): Node {
    return this.set('minCellWidth', value);
  }
  flow(value: GridFlow): Node {
    return this.set('flow', value);
  }
  verified(value = true): Node {
    return this.set('verified', value);
  }
  live(value = true): Node {
    return this.set('live', value);
  }
  liveBadge(value: boolean): Node {
    return this.set('liveBadge', value);
  }
  presence(value: Presence): Node {
    return this.set('presence', value);
  }
  dot(): Node {
    return this.set('dot', true);
  }
  max(value: number): Node {
    return this.set('max', value);
  }
  placement(value: BadgePlacement): Node {
    return this.set('placement', value);
  }
  layout(value: AvatarLayout): Node {
    return this.set('layout', value);
  }
  total(value: number | undefined): Node {
    return this.set('total', value);
  }
  overflow(value: AvatarOverflow): Node {
    return this.set('overflow', value);
  }
  initials(): Node {
    return this.set('initials', true);
  }
  onPressItem(value: ((item: AvatarGroupItem, index: number) => void) | undefined): Node {
    return this.set('onPressItem', value);
  }
  hoverCard(value = true): Node {
    return this.set('hoverCard', value);
  }
  pressScale(): Node {
    return this.set('pressScale', true);
  }
  hoverHighlight(value?: boolean): Node {
    return this.set('hoverHighlight', value);
  }
  listMarker(value: ListMarker): Node {
    return this.with({ kind: 'listMarker', key: `list:${value}`, value });
  }
  pressed(value: boolean): Node {
    return this.set('pressed', value);
  }
  colors(background: ColorToken, foreground: ColorToken): Node {
    const value = [background, foreground] as const;
    return this.with({ kind: 'colors', key: `colors:${background}:${foreground}`, value });
  }
  linkTone(value: ButtonLinkTone): Node {
    return this.with({ kind: 'linkTone', key: `linkTone:${value}`, value });
  }
  inverted(value = true): Node {
    return this.with({ kind: 'inverted', key: `inverted:${value}`, value });
  }
  density(value: ControlDensity): Node {
    return this.with({ kind: 'density', key: `density:${value}`, value });
  }
  dividers(value = true): Node {
    return this.with({ kind: 'dividers', key: `dividers:${value}`, value });
  }
  separated(value = true): Node {
    return this.with({ kind: 'separated', key: `separated:${value}`, value });
  }
  fill(value: ColorToken): Node {
    return this.with({ kind: 'fill', key: `fill:${value}`, value });
  }
  stroke(value: ColorToken, width: BorderWidthName = 'thin'): Node {
    return this.with({ kind: 'stroke', key: `stroke:${value}:${width}`, value, width });
  }
  image(source: ShapeImageSource, alt?: string): Node {
    return this.with({ kind: 'image', key: 'image', source, alt });
  }
  rotation(value: RotationName | MotionValue): Node {
    return this.with({ kind: 'rotation', key: 'rotation', value });
  }
  animation(motion: MotionToken, ...value: [unknown?]): Node {
    return this.with({
      kind: 'animation',
      key: `anim:${motionKey(motion)}`,
      motion,
      value: value[0],
      gated: value.length > 0,
    });
  }
  transition(value: TransitionValue): Node {
    return this.with({ kind: 'transition', key: 'transition', value });
  }
  keyframes(value: KeyframesValue, trigger: unknown): Node {
    return this.with({ kind: 'keyframes', key: 'keyframes', value, trigger });
  }
  matchedGeometry(id: string, namespace: Namespace): Node {
    return this.with({ kind: 'matchedGeometry', key: 'matchedGeometry', id, namespace });
  }
  drag(value: MotionValue, options: DragSpec = {}): Node {
    return this.with({ kind: 'drag', key: 'drag', value, options });
  }
  swipe(direction: SwipeDirection, onSwipe: () => void): Node {
    return this.with({ kind: 'swipe', key: 'swipe', direction, onSwipe });
  }
  contentTransition(value: 'roll', direction?: number): Node {
    return this.with({ kind: 'contentTransition', key: 'contentTransition', value, direction });
  }
  loop(): Node {
    return this.with({ kind: 'loop', key: 'loop' });
  }
  paused(value: boolean): Node {
    return this.with({ kind: 'paused', key: 'paused', value });
  }
  fallback(value: Child): Node {
    return this.with({ kind: 'fallback', key: 'fallback', value });
  }

  // Date and time pickers (controls/date-picker.tsx)
  bounds(min: Date | string | number | null, max?: Date | string | number | null): Node {
    return this.set('bounds', [min, max]);
  }
  unavailable(value: (date: Date) => boolean): Node {
    return this.set('unavailable', value);
  }
  weekStart(value: WeekStart): Node {
    return this.set('weekStart', value);
  }
  locale(value: string): Node {
    return this.set('locale', value);
  }
  placeholder(value: string): Node {
    return this.set('placeholder', value);
  }
  presented(value: Binding<boolean>): Node {
    return this.set('presented', value);
  }
  labels(value: object): Node {
    return this.set('labels', value as Readonly<Record<string, unknown>>);
  }
  quickSelect(value: boolean): Node {
    return this.set('quickSelect', value);
  }
  initialMonth(value: Date): Node {
    return this.set('initialMonth', value);
  }
  months(value: 1 | 2): Node {
    return this.set('months', value);
  }
  step(value: number): Node {
    return this.set('step', value);
  }
  hourFormat(value: HourFormat): Node {
    return this.set('hourFormat', value);
  }

  // Ratings (controls/rating.tsx)
  countStyle(value: RatingCountStyle): Node {
    return this.set('countStyle', value);
  }
  showsValue(value: boolean): Node {
    return this.set('showsValue', value);
  }
  starSize(value: SpaceToken): Node {
    return this.set('starSize', value);
  }
  starTint(value: ColorToken): Node {
    return this.set('starTint', value);
  }
  countTint(value: ColorToken): Node {
    return this.set('countTint', value);
  }
  emptyTint(value: ColorToken): Node {
    return this.set('emptyTint', value);
  }
  fillValue(value: number): Node {
    return this.set('fillValue', value);
  }
  starLabel(value: (value: number, max: number) => string): Node {
    return this.set('starLabel', value);
  }
  valueLabel(value: string): Node {
    return this.set('valueLabel', value);
  }
  labelWidth(value: SpaceToken): Node {
    return this.set('labelWidth', value);
  }
  reveal(value: MeterReveal): Node {
    return this.set('reveal', value);
  }

  // Meters and progress bars (controls/stat-bar.tsx)
  valueText(value: string): Node {
    return this.set('valueText', value);
  }
  indeterminate(value = true): Node {
    return this.set('indeterminate', value);
  }
  decorative(): Node {
    return this.set('decorative', true);
  }
  trackTint(value: ColorToken): Node {
    return this.set('trackTint', value);
  }
  thickness(value: SpaceToken): Node {
    return this.set('thickness', value);
  }
  fillDuration(value: DurationName): Node {
    return this.set('fillDuration', value);
  }
  barCorner(value: Exclude<CornerName, 'concentric'>): Node {
    return this.set('barCorner', value);
  }
  backdrop(value: ColorToken): Node {
    return this.set('backdrop', value);
  }
  cap(value: MeterCap): Node {
    return this.set('cap', value);
  }
  content(value: Child): Node {
    return this.set('content', value);
  }
  onStop(action: () => void, label: string): Node {
    return this.set('onStop', [action, label]);
  }
  rangeLabels(min: string | undefined, max?: string): Node {
    return this.set('rangeLabels', [min, max]);
  }

  // Tables (controls/table.tsx)
  width(value: ColumnWidthToken): Node {
    return this.set('width', value);
  }
  share(value: number): Node {
    return this.set('share', value);
  }
  minWidth(value: SpaceToken): Node {
    return this.set('minWidth', value);
  }
  sort(direction: TableSort, action: () => void): Node {
    return this.set('sort', [direction, action]);
  }
  prefix(value: string | Child): Node {
    return this.set('prefix', value);
  }
  emptyState(value: string | number | Child): Node {
    return this.set('emptyState', value);
  }
  selected(value: boolean): Node {
    return this.set('selected', value);
  }

  // Rows and lists (controls/list.tsx)
  supporting(value: string | Child): Node {
    return this.set('supporting', value);
  }
  supportingLines(value: 1 | 2 | 3 | 'adaptive'): Node {
    return this.set('supportingLines', value);
  }
  footnote(value: Child): Node {
    return this.set('footnote', value);
  }
  attachments(value: Child): Node {
    return this.set('attachments', value);
  }
  compactPadding(value: SpaceToken): Node {
    return this.set('compactPadding', value);
  }
  onPrefetch(value: () => void): Node {
    return this.set('onPrefetch', value);
  }
  checkable(value: Binding<boolean>): Node {
    return this.set('checkable', value);
  }
  selecting(value: boolean): Node {
    return this.set('selecting', value);
  }
  selectionLabel(value: string): Node {
    return this.set('selectionLabel', value);
  }
  rowActions(actions: readonly ListAction[], onAction: (key: string) => void): Node {
    return this.set('rowActions', [actions, onAction]);
  }
  swipeActions(actions: SwipeRowActions, full?: SwipeRowProps['fullSwipeAction']): Node {
    return this.set('swipeActions', [actions, full]);
  }
  swipeEnabled(value: boolean): Node {
    return this.set('swipeEnabled', value);
  }
  contextMenu(value: Child): Node {
    return this.set('contextMenu', value);
  }
  separator(value: ListSeparator): Node {
    return this.set('separator', value);
  }
  scrollable(value = true): Node {
    return this.set('scrollable', value);
  }
  scrollHeight(value: SpaceToken): Node {
    return this.set('scrollHeight', value);
  }
  stickyHeaders(value = true): Node {
    return this.set('stickyHeaders', value);
  }
  sectionIndex(value: NonNullable<ListProps['sectionIndex']>): Node {
    return this.set('sectionIndex', value);
  }
  headerContent(value: Child): Node {
    return this.set('headerContent', value);
  }
  footerContent(value: Child): Node {
    return this.set('footerContent', value);
  }
  loadingRows(value: number): Node {
    return this.set('loadingRows', value);
  }
  itemKey(value: (item: never, index: number) => string): Node {
    return this.set('itemKey', value);
  }
  itemType(value: (item: never, index: number) => string | number | undefined): Node {
    return this.set('itemType', value);
  }
  estimatedItemSize(value: number): Node {
    return this.set('estimatedItemSize', value);
  }
  onEndReached(action: () => void, threshold?: number): Node {
    return this.set('onEndReached', [action, threshold]);
  }
  refreshable(refreshing: boolean, onRefresh: () => void): Node {
    return this.set('refreshable', [refreshing, onRefresh]);
  }
  stickyIndices(value: readonly number[]): Node {
    return this.set('stickyIndices', value);
  }
  restorationKey(value: string): Node {
    return this.set('restorationKey', value);
  }
  tuning(value: VirtualListTuning): Node {
    return this.set('tuning', value);
  }
  onSelectAll(value: (checked: boolean) => void): Node {
    return this.set('onSelectAll', value);
  }
  onClear(value: () => void): Node {
    return this.set('onClear', value);
  }

  // Carousels (controls/carousel.tsx)
  groupSize(value: number): Node {
    return this.set('groupSize', value);
  }
  arrows(value: ArrowsPlacement | false): Node {
    return this.set('arrows', value);
  }
  arrowsVisibility(value: ArrowsVisibility): Node {
    return this.set('arrowsVisibility', value);
  }
  arrowsInset(value: SpaceToken): Node {
    return this.set('arrowsInset', value);
  }
  hidesUnavailableArrows(): Node {
    return this.set('hidesUnavailableArrows', true);
  }
  dots(value = true): Node {
    return this.set('dots', value);
  }
  contentInset(value: SpaceToken): Node {
    return this.set('contentInset', value);
  }
  page(value: Binding<number>): Node {
    return this.set('page', value);
  }

  // Markdown (controls/markdown.tsx)
  streaming(value = true): Node {
    return this.set('streaming', value);
  }
  onLinkPress(value: (url: string) => void): Node {
    return this.set('onLinkPress', value);
  }
  codeBlock(value: (code: string, language: string | undefined) => Child): Node {
    return this.set('codeBlock', value);
  }

  // Sliders (controls/slider.tsx)
  keyboardStep(value: number): Node {
    return this.set('keyboardStep', value);
  }
  thumbSize(value: SpaceToken): Node {
    return this.set('thumbSize', value);
  }
  fillTint(value: ColorToken): Node {
    return this.set('fillTint', value);
  }
  thumbTint(value: ColorToken): Node {
    return this.set('thumbTint', value);
  }
  onCommit(value: (value: never) => void): Node {
    return this.set('onCommit', value);
  }
  valueFormat(value: (value: number, index: number) => string): Node {
    return this.set('valueFormat', value);
  }

  // Accordions (controls/accordion.tsx)
  allowsMultiple(): Node {
    return this.set('allowsMultiple', true);
  }
  revealMotion(value: AccordionTransition): Node {
    return this.set('revealMotion', value);
  }
  indicator(value: Child): Node {
    return this.set('indicator', value);
  }

  // Code (controls/code.tsx)
  language(value: string): Node {
    return this.set('language', value);
  }
  lineNumbers(value = true): Node {
    return this.set('lineNumbers', value);
  }
  highlight(value: readonly string[]): Node {
    return this.set('highlight', value);
  }
  languageLabel(value: string): Node {
    return this.set('languageLabel', value);
  }
  filename(value: string): Node {
    return this.set('filename', value);
  }
  diff(additions: number, deletions: number): Node {
    return this.set('diff', [additions, deletions]);
  }
  copyable(value: boolean): Node {
    return this.set('copyable', value);
  }
  onCopy(value: (code: string) => void | Promise<void>): Node {
    return this.set('onCopy', value);
  }

  // Steppers (controls/stepper.tsx)
  onRemove(value: () => void): Node {
    return this.set('onRemove', value);
  }

  // Tooltips, breadcrumbs and activity heatmaps (controls/tooltip.tsx, controls/breadcrumb.tsx, controls/activity-heatmap.tsx)
  side(value: TooltipSide): Node {
    return this.set('side', value);
  }
  openDelay(value: number): Node {
    return this.set('openDelay', value);
  }
  collapses(): Node {
    return this.set('collapses', true);
  }
  separatorView(value: Child): Node {
    return this.set('separatorView', value);
  }
  hoverMenu(value: BreadcrumbHoverMenu): Node {
    return this.set('hoverMenu', value);
  }
  days(value: number): Node {
    return this.set('days', value);
  }
  endDate(value: string): Node {
    return this.set('endDate', value);
  }
  levels(value: number[]): Node {
    return this.set('levels', value);
  }
  cellSize(value: SpaceToken): Node {
    return this.set('cellSize', value);
  }
  onPressDay(value: (day: ActivityHeatmapDay) => void): Node {
    return this.set('onPressDay', value);
  }

  // Tag fields, file uploads and videos (controls/tag-field.tsx, controls/file-upload.tsx, controls/video-view.tsx)
  suggestions(list: ReadonlyArray<string | TagSuggestion>, max?: number): Node {
    return this.set('suggestions', [list, max]);
  }
  allowsCreate(value: boolean): Node {
    return this.set('allowsCreate', value);
  }
  onMaxReached(value: () => void): Node {
    return this.set('onMaxReached', value);
  }
  normalize(value: (raw: string) => string): Node {
    return this.set('normalize', value);
  }
  query(value: Binding<string>): Node {
    return this.set('query', value);
  }
  invalid(value = true): Node {
    return this.set('invalid', value);
  }
  file(value: FileUploadFile | null): Node {
    return this.set('file', value);
  }
  uploadProgress(value: number): Node {
    return this.set('uploadProgress', value);
  }
  onFileSelected(value: (file: FileUploadFile) => void): Node {
    return this.set('onFileSelected', value);
  }
  onUploadComplete(value: (file: FileUploadFile) => void): Node {
    return this.set('onUploadComplete', value);
  }
  onReject(value: (message: string, file: FileUploadFile) => void): Node {
    return this.set('onReject', value);
  }
  picker(value: NonNullable<FileUploadProps['onPickFiles']>): Node {
    return this.set('picker', value);
  }
  allowedExtensions(value: readonly string[]): Node {
    return this.set('allowedExtensions', value);
  }
  maxBytes(value: number): Node {
    return this.set('maxBytes', value);
  }
  fileIcon(value: (file: FileUploadFile) => Child): Node {
    return this.set('fileIcon', value);
  }
  nativeControls(value: boolean): Node {
    return this.set('nativeControls', value);
  }
  allowsPictureInPicture(value: boolean): Node {
    return this.set('allowsPictureInPicture', value);
  }

  // Inputs (controls/inputs.tsx)
  required(value = true): Node {
    return this.set('required', value);
  }
  floatingLabel(): Node {
    return this.set('floatingLabel', true);
  }
  revealable(): Node {
    return this.set('revealable', true);
  }
  suffix(value: string): Node {
    return this.set('suffix', value);
  }
  keyboard(value: Keyboard): Node {
    return this.set('keyboard', value);
  }
  autocapitalize(value: Autocapitalize): Node {
    return this.set('autocapitalize', value);
  }
  autocorrect(value: boolean): Node {
    return this.set('autocorrect', value);
  }
  contentType(value: ContentType): Node {
    return this.set('contentType', value);
  }
  submitLabel(value: SubmitLabel): Node {
    return this.set('submitLabel', value);
  }
  onSubmit(value: () => void): Node {
    return this.set('onSubmit', value);
  }
  autoFocus(): Node {
    return this.set('autoFocus', true);
  }
  maxLength(value: number): Node {
    return this.set('maxLength', value);
  }
  description(value: string): Node {
    return this.set('description', value);
  }
  error(value: string | null | undefined): Node {
    return this.set('error', value);
  }
  readOnly(): Node {
    return this.set('readOnly', true);
  }
  rows(value: number): Node {
    return this.set('rows', value);
  }
  autoResize(maxRows?: number): Node {
    return this.set('autoResize', maxRows);
  }
  resize(value: TextareaResize): Node {
    return this.set('resize', value);
  }
  showCount(): Node {
    return this.set('showCount', true);
  }
  tabs(): Node {
    return this.set('tabs', true);
  }
  collapsible(value?: SearchCollapse): Node {
    return this.set('collapsible', value);
  }
  tokens(value: Binding<readonly SearchToken[]>): Node {
    return this.set('tokens', value);
  }

  // Overlays and feedback (controls/overlays.tsx)

  // Containers (controls/containers.tsx)
}

const FRAME_KEYS = OBJECTS.frame.keys;
const EDGE_KEYS = OBJECTS.edges.keys;
const OFFSET_KEYS = OBJECTS.offset.keys;

/** An object parameter's cache key: its set keys, in the spec's order, with their tokens. */
function objectKey<T extends object>(value: T, keys: readonly string[]): string {
  const parts: string[] = [];
  for (const name of keys) {
    const token = (value as Record<string, string | AppToken | undefined>)[name];
    if (token !== undefined) parts.push(`${name}=${tokenKey(token)}`);
  }
  return parts.join(',');
}

// ── The typed surface: which modifiers each kind accepts ─────────

/** Modifiers every view takes. `Self` is the view's own type, so a chain keeps its kind. */
export interface ViewModifiers<Self> extends ViewNode {
  padding(value: PaddingToken): Self;
  padding(edge: Edge, value: PaddingToken): Self;
  frame(value: FrameSpec): Self;
  /** Takes the free space along its parent's axis. */
  grow(): Self;
  shrink(value: ShrinkPriority): Self;
  /** Its own place across its parent's axis, over the parent's `align`. */
  alignSelf(value: Alignment): Self;
  /**
   * Pinned to its parent's edges, out of the stack's flow (absolute): each edge
   * given is a distance from that edge of the parent. An overlay
   * (`.overlay(view, alignment)`) is the way to lay one view over another.
   */
  position(value: PositionEdges): Self;
  /** Drawn shifted from where it is laid out (`x` right, `y` down); its siblings keep their places. */
  offset(value: OffsetSpec): Self;
  /** Its stacking level among its siblings: Bloom's `base`, `raised`, `floating`, `dropdown`. */
  zIndex(value: ZIndexName): Self;
  /** Leaves the layout (`display: none`) while staying mounted; `hidden(false)` puts it back, as a variant does. */
  hidden(value?: boolean): Self;
  /** Its length along its parent's axis before free space is shared (`flex-basis`): a space rung, a length of the parent, or `fit`. */
  basis(value: LengthToken): Self;
  /** Drawn scaled about its centre, where it is laid out; its siblings keep their places. */
  scale(value: ScaleName | MotionValue): Self;
  /** `false`: touches and the pointer pass through the view and everything inside it, to what is under it. */
  allowsHitTesting(value: boolean): Self;
  /**
   * Read by assistive technology and not drawn: a 1pt clipped box out of the
   * layout (Tailwind's `sr-only`). A screen reader still announces it.
   */
  accessibilityOnly(): Self;
  /** A fill: a colour role, or a role at a named opacity (`'primary/10'`); or a view behind it, placed at `alignment` (centred by default). */
  background(value: InkToken): Self;
  background(value: ViewNode, alignment?: OverlayAlignment): Self;
  /** A view over this one, the size of this one as drawn so far, placed at `alignment` (centred by default). */
  overlay(content: ViewNode, alignment?: OverlayAlignment): Self;
  border(value: InkToken, width?: BorderWidthName, edge?: BorderEdge): Self;
  /** A ring outside the box (an outline, which takes no room): a role, `thin` by default, `offset` from the edge; `none` removes one. */
  ring(value: InkToken | 'none', width?: BorderWidthName, offset?: SpaceToken): Self;
  /** Bloom's elevation under the box: `s`, `m` or `floating`. */
  shadow(value: ShadowName): Self;
  /**
   * A variant: while `condition` holds, the modifiers `build` chains onto the
   * view override the values set before this call (`.padding('sm').when('md',
   * (v) => v.padding('lg'))`). Only style modifiers vary (the spec's
   * `variants.modifiers`); on the web a breakpoint, the scheme and a state are
   * CSS, on native environment reads.
   */
  when(condition: Condition, build: (variant: Self) => Self): Self;
  /**
   * Rounds the box: a radius rung, `full`, or `concentric` (the radius of the
   * shape it sits in, less the inset between them: a glass's, another
   * concentric box's, a Bloom card's).
   */
  corner(value: CornerName, side?: CornerSide): Self;
  /** `smooth`: the platform's continuous corner (a squircle on the web), as Bloom's surfaces draw theirs. */
  cornerCurve(value: CornerCurve): Self;
  opacity(value: OpacityName): Self;
  /**
   * A glass material behind the view: `regular` (the default) or `clear`,
   * optionally `.tint(role, opacity?)`. Drawn by Bloom's `Surface` today.
   */
  glass(value?: GlassValue): Self;
  /**
   * The view floats over content as an island: Bloom's `BlurIsland`, the shared
   * material with its shadow (the lens on Android), a capsule unless a
   * `corner` names its radius.
   */
  blur(): Self;
  /** Text and icon colour for this view and everything inside it; a role, or a role at an opacity token (`'muted/70'`). */
  foreground(value: InkToken): Self;
  /** A ramp step or a size rung; or `mono`, Bloom's monospaced face, which keeps the size. */
  font(value: FontName): Self;
  weight(value: WeightName): Self;
  leading(value: LeadingToken): Self;
  /** Letter spacing for this view's text, in em of its size (`tight` … `widest`): its font's, else Bloom Text's 13px. */
  tracking(value: TrackingName): Self;
  onPress(value: Press | undefined): Self;
  onLongPress(value: (() => void) | undefined): Self;
  onHover(enter: (() => void) | undefined, leave: (() => void) | undefined): Self;
  /**
   * Web: the pointer over this view is what `group-hover:` styles inside it
   * answer (Bloom `SubtleHover`). Native has no hover group; it does nothing.
   */
  hoverGroup(): Self;
  /** A pressable view shrinks slightly under the finger (Bloom `PressableScale`). */
  pressScale(): Self;
  label(value: string | undefined): Self;
  hint(value: string | undefined): Self;
  role(value: Role): Self;
  hitSlop(value: HitSlopName): Self;
  testID(value: string): Self;
  /** A Bloom `Badge` attached to the view, at the badge's `placement` (the top right by default). */
  badge(value: BadgeView): Self;
  id(value: string | number): Self;
  // The screen's chrome: read from the root of a router `screen()` body, nothing elsewhere.
  /** The screen's title: the navigation bar's on iOS, the page header's elsewhere. */
  title(value: string): Self;
  /** `large`: the large title that folds into the bar as the page scrolls; `inline` (default). */
  titleDisplay(value: TitleDisplay): Self;
  subtitle(value: string | undefined): Self;
  /**
   * The screen's header: a presentation of its title and toolbar (`floating`,
   * the default, `bar` or `navigation`), `false` for none, or a header node of
   * its own (drawn in the page on every platform).
   */
  header(value: ScreenHeader): Self;
  /** The header's trailing items, in reading order. */
  toolbar(...value: Child[]): Self;
  /** The header's leading items, after the back button. */
  toolbarLeading(...value: Child[]): Self;
  /** The back button's action; `null` shows none (a top-level destination). */
  onBack(value: (() => void) | null | undefined): Self;
  /** The back button's name for assistive technology; Bloom's "Back" by default. */
  backLabel(value: string | undefined): Self;
  /** The title's heading level (the web's `aria-level`); 1 by default. */
  headingLevel(value: HeadingLevel): Self;
  /** The screen's own bar at its foot (a reply composer), over or under its content. */
  footer(content: Child, options?: ScreenFooter): Self;
  /** A sheet over the screen while `open`: Bloom's Dialog, from the bottom and centred from `md`. */
  sheet(open: boolean, content: () => Child, options?: SheetOptions): Self;
  /** Pressing the screen's destination while it is in front (after it scrolled back to the top). */
  onReselect(value: (() => void) | undefined): Self;
  rotation(value: RotationName | MotionValue): Self;
  /**
   * SwiftUI's `.animation(_:value:)`: changes to this view's scale, offset,
   * rotation and opacity, and to what animates inside it (a matched geometry, a
   * content transition, keyframes and transitions without their own motion),
   * play with `motion`. With a value, they animate only when that value changes.
   */
  animation(motion: MotionToken, value?: unknown): Self;
  /** How the view arrives and leaves (see `TransitionValue`). */
  transition(value: TransitionValue): Self;
  /** Plays `keyframes` each time `trigger` changes to a truthy value. */
  keyframes(value: KeyframesValue, trigger: unknown): Self;
  /** SwiftUI's `matchedGeometryEffect`: moves from where the view with this id last was. */
  matchedGeometry(id: string, namespace: Namespace): Self;
  /**
   * The finger moves `value` along `options.axis` (default `y`), from where it
   * was, within `min`/`max`. Bind the value to see it (`.offset({ y })`);
   * `options.onEnd` decides where it goes on release (`animate()`). Native: the
   * drag runs on the UI thread, with no JS per frame.
   */
  drag(value: MotionValue, options?: DragSpec): Self;
  /**
   * The view follows a swipe toward `direction` and, released past a quarter
   * of the window across (or a tap's slop up or down), flies out and calls
   * `onSwipe`; short of it, it comes back.
   */
  swipe(direction: SwipeDirection, onSwipe: () => void): Self;
}

export interface StackView extends ViewModifiers<StackView> {
  /** The gap between children. */
  spacing(value: SpaceToken): StackView;
  /** The children's place across the axis. */
  align(value: Alignment): StackView;
  /** How the children spread along the axis: packed at `start`, `center` or `end`, or the free space `between`, `around` or `evenly` around them. */
  justify(value: Justify): StackView;
  /** Children that do not fit flow onto further lines. */
  wrap(value?: boolean): StackView;
  /** Lays the children out along `horizontal` or `vertical`, over the constructor's own (a breakpoint variant's row). */
  axis(value: Axis): StackView;
  /** A pressable stack that takes no presses, announced as disabled; what `when('disabled', …)` answers. */
  disabled(value?: boolean): StackView;
  /**
   * Bloom's hover wash behind the stack (`SubtleHover`): under the pointer, on
   * the web; or while `active` (a coordinated highlight), on every platform.
   */
  hoverHighlight(active?: boolean): StackView;
  /**
   * Web: a list, each child a row behind the marker (an HTML list and its
   * items, `list-style-type`); give it the room for the markers with a
   * leading padding. Native draws no markers, as React Native has none.
   */
  listMarker(value: ListMarker): StackView;
}
/**
 * Text, drawn by Bloom's `Text` (its type ramp, its families, its desktop
 * scale). A nested `Text` is an inline span: it sets only what its own chain
 * names and inherits the rest from the text it is in.
 */
export interface TextView extends ViewModifiers<TextView> {
  /** At most `n` lines; what does not fit is cut where `truncation` says (the tail by default). */
  lines(value: number): TextView;
  /** Web: never wraps (`white-space: nowrap`); native text in a row already keeps its width. */
  noWrap(): TextView;
  /** Where a text cut by `lines` loses its characters: `head`, `middle`, `tail` or `clip`. */
  truncation(value: Truncation): TextView;
  /** The reader can select and copy the text. */
  selectable(value?: boolean): TextView;
  /**
   * One of Bloom's typography components: `title`, `subtitle`, `h1`…`h6`,
   * `paragraph`, `lead`, `large`, `small`, `muted`, `blockquote`. Its role,
   * rule and spacing come with it, as the component draws them.
   */
  textStyle(value: TextStyleName): TextView;
  /**
   * A link to `href`, drawn as Bloom's inline link (the primary ink, underlined,
   * announced as a link): an anchor on the web, opened outside the app on
   * native. Its own `.foreground()` replaces the ink; `.onPress()` replaces the opening.
   */
  link(href: string): TextView;
  /** How its lines align: `start` and `end` follow the reading direction. */
  textAlign(value: TextAlignment): TextView;
  italic(): TextView;
  underline(): TextView;
  strikethrough(): TextView;
  /** Draws the text in upper case, lower case, or with each word capitalised. */
  textCase(value: TextCase): TextView;
  /** Digits of one width, so numbers in a column or a counter line up (`font-variant: tabular-nums`). */
  monospacedDigit(): TextView;
  /** Web: where a line may break inside a word (`all`, `words`); native text keeps its platform's breaking. */
  wordBreak(value: WordBreak): TextView;
  /**
   * SwiftUI's `.contentTransition(.numericText(value:))`: a change of the text
   * inside an animation rolls the old text out and the new one in, up when
   * `direction` rose and down when it fell.
   */
  contentTransition(value: 'roll', direction?: number): TextView;
}
export interface LottieView extends ViewModifiers<LottieView> {
  /** Plays again from the start each time it ends. */
  loop(): LottieView;
  paused(value: boolean): LottieView;
  /** What draws in its place where it cannot play (reduced motion, no player). */
  fallback(value: Child): LottieView;
  /** Hidden from assistive technology: its container already names it (a sticker message's press). */
  decorative(): LottieView;
}
export interface IconView extends ViewModifiers<IconView> {
  size(value: IconSizeToken): IconView;
}
/**
 * Bloom `Avatar`: the image, else the account's character, else initials on a
 * tinted disc. `.label()` is its `alt`.
 */
export interface AvatarView extends ViewModifiers<AvatarView> {
  /** A rung (`xs` 20, `sm` 24, `md` 32, `lg` 36) or an app's own diameter; 40 with none. */
  size(value: AvatarSizeToken): AvatarView;
  /** The initials disc's tint; derived from the name when not set. */
  tint(value: AvatarColor): AvatarView;
  /** One of Bloom's silhouettes; the image and the fallback keep it. */
  shape(value: ShapeName): AvatarView;
  /** Bloom's verified mark in the corner. */
  verified(value?: boolean): AvatarView;
  /** Live-streaming: the live ring, and the LIVE pill unless `liveBadge(false)`. */
  live(value?: boolean): AvatarView;
  liveBadge(value: boolean): AvatarView;
  /** A presence dot on its edge (Bloom `AvatarPresence`), sized from the avatar. */
  presence(value: Presence): AvatarView;
}
/** Bloom `AvatarGroup`: a facepile, a row, a cluster or a conversation of avatars. */
export interface AvatarGroupView extends ViewModifiers<AvatarGroupView> {
  layout(value: AvatarLayout): AvatarGroupView;
  /** Each avatar's diameter (a cluster's whole box); Bloom's default with none. */
  size(value: AvatarSizeToken): AvatarGroupView;
  shape(value: ShapeName): AvatarGroupView;
  /** The most avatars before the `+N` chip. */
  max(value: number): AvatarGroupView;
  /** The real number of members, when more exist than the items given. */
  total(value: number | undefined): AvatarGroupView;
  /** The gap between avatars of a `row`. */
  spacing(value: SpaceToken): AvatarGroupView;
  overflow(value: AvatarOverflow): AvatarGroupView;
  /** A member without an image shows its tinted initial, not the neutral placeholder. */
  initials(): AvatarGroupView;
  onPressItem(value: ((item: AvatarGroupItem, index: number) => void) | undefined): AvatarGroupView;
  /** Web: hovering an avatar shows the member's card. */
  hoverCard(value?: boolean): AvatarGroupView;
}
/** Bloom `Badge`: a count, a dot or a label; attached to a view with `.badge(Badge(…))`. */
export interface BadgeView extends ViewModifiers<BadgeView> {
  style(value: BadgeStyle): BadgeView;
  tint(value: BloomTone): BadgeView;
  size(value: BadgeSize): BadgeView;
  /** A glyph before the label, at the rung's size, in the label's ink. */
  icon(value: IconComponent): BadgeView;
  /** A dot without content: a status dot alone, a marker when attached. */
  dot(): BadgeView;
  /** Counts above it read `{max}+`. */
  max(value: number): BadgeView;
  /** Where an attached badge sits on its view. */
  placement(value: BadgePlacement): BadgeView;
}
/** Bloom `IconCircle`: an icon on a tinted disc. */
export interface IconCircleView extends ViewModifiers<IconCircleView> {
  size(value: IconSizeName): IconCircleView;
}
/** Bloom `Loading`: a spinner, the top bar, or an inline line beside its `Text`. */
export interface LoadingView extends ViewModifiers<LoadingView> {
  style(value: LoadingStyle): LoadingView;
  size(value: BloomSize): LoadingView;
  tint(value: BloomTone): LoadingView;
}
/** A Bloom skeleton shape: `text`, `circle`, `pill` or `box`, sized by its frame (a text's by its font). */
export type SkeletonView = ViewModifiers<SkeletonView>;
/** Bloom `Skeleton.Region`: what is loading, named once for assistive technology (`.label()`). */
export type SkeletonGroupView = ViewModifiers<SkeletonGroupView>;
/**
 * A raster image. It is sized like any view (`frame`, or one side and
 * `aspectRatio`) and clipped by `corner`; it has no intrinsic size until it loads.
 */
export interface ImageView extends ViewModifiers<ImageView> {
  /** How the image fills its box. Defaults to `cover`. */
  contentFit(value: ContentFit): ImageView;
  /** Width over height, so one side sizes the other (`16 / 9`). */
  aspectRatio(value: number): ImageView;
  /** Paints every opaque pixel one colour role (monochrome artwork). */
  tint(value: ColorName): ImageView;
  /**
   * Cross-fades the image in when it arrives, over a Bloom duration. Defaults
   * to none. (`.transition()` is how any view arrives and leaves.)
   */
  crossFade(value: DurationName): ImageView;
  /** The intrinsic pixel size, once loaded. */
  onLoad(value: ImageLoadHandler | undefined): ImageView;
  onError(value: ImageErrorHandler | undefined): ImageView;
}
export interface ButtonView extends ViewModifiers<ButtonView> {
  style(value: BloomAppearance): ButtonView;
  shape(value: ButtonShape): ButtonView;
  size(value: BloomSize): ButtonView;
  tint(value: BloomTone): ButtonView;
  disabled(value?: boolean): ButtonView;
  /** Busy: the label gives way to Bloom's spinner and presses are ignored. */
  loading(value?: boolean): ButtonView;
  /** A toggle, on or off: announced as pressed on every platform. */
  pressed(value: boolean): ButtonView;
  /** A link: a real anchor on the web, the address opened on native (unless `.onPress` is set). */
  link(href: string): ButtonView;
  /** Truncates the label to `n` lines instead of wrapping it. */
  lines(value: number): ButtonView;
  /** The label carries its underline at rest (a `plain` action inside running copy). */
  underline(): ButtonView;
  /**
   * A paired fill and label from two colour roles (Bloom's `colors`), for a
   * brand action; the geometry stays the button's.
   */
  colors(background: ColorToken, foreground: ColorToken): ButtonView;
  /** A `plain` link's ink: the accent (`primary`), the secondary text, or the reading colour (`text`). */
  linkTone(value: ButtonLinkTone): ButtonView;
  /** The theme's background and foreground swapped: a high-contrast action. */
  inverted(value?: boolean): ButtonView;
  /** The control's geometry over the nearest Bloom scope's: `default` or `compact`. */
  density(value: ControlDensity): ButtonView;
}
/** What a shape's image draws: a bundled asset, or a URI descriptor (Bloom `shapes`' `ImageSource`). */
export type ShapeImageSource =
  | number
  | { uri: string; width?: number; height?: number; scale?: number };

export interface ShapeProps {
  readonly name: ShapeName;
}

/**
 * One of Bloom's silhouettes, at a fixed size (Bloom `shapes`): `.fill(role)`
 * (the default, in the foreground), `.stroke(role, width?)` (an outline inside
 * the silhouette) or `.image(source, alt?)` (clipped to it). The last of the
 * three in the chain is what it draws; an overlay draws two.
 */
export interface ShapeView extends ViewModifiers<ShapeView> {
  /** Its side: a space rung or an app token (`4xl`, 40, by default). */
  size(value: SpaceToken): ShapeView;
  fill(value: ColorToken): ShapeView;
  stroke(value: ColorToken, width?: BorderWidthName): ShapeView;
  image(source: ShapeImageSource, alt?: string): ShapeView;
}

/**
 * Bloom `Button.Group`: buttons joined on one material, `horizontal` by
 * default (`.axis('vertical')` stacks them), with hairlines between them.
 */
export interface ButtonGroupView extends ViewModifiers<ButtonGroupView> {
  axis(value: Axis): ButtonGroupView;
  /** Every button's size. */
  size(value: BloomSize): ButtonGroupView;
  /** The hairlines between controls (on by default). */
  dividers(value?: boolean): ButtonGroupView;
  /** Flat segments with a gap between them, under the shared outer pill. */
  separated(value?: boolean): ButtonGroupView;
}
/**
 * Bloom `Fab`: the prominent action, drawn on the platform's glass (see
 * docs/bloom-language.mdx, Glass). An `Icon` child is its glyph, a `Text`
 * child its extended label.
 */
export interface FabView extends ViewModifiers<FabView> {
  style(value: BloomAppearance): FabView;
  size(value: BloomSize): FabView;
  tint(value: BloomTone): FabView;
  disabled(value?: boolean): FabView;
  /** Folds the extended label away, keeping the action and its name. */
  collapsed(value?: boolean): FabView;
}
/** A menu: its trigger, and the rows it presents when the trigger is pressed. */
export interface MenuView extends ViewModifiers<MenuView> {
  /**
   * What its tagged rows do: an `actions()` view, whose body (it may call
   * hooks) runs only when a row is chosen. The rows stay plain data, which
   * every platform can present before the menu opens.
   */
  actions(value: MenuActionsView): MenuView;
}
/** What a menu holds: rows, and at most one `menu()` content. */
export type MenuRow = MenuItemView | MenuSubmenuView | MenuSectionView | DividerView;
export type MenuChild = MenuRow | false | null | undefined | readonly MenuChild[];
export interface MenuItemView extends ViewNode {
  icon(value: IconComponent): MenuItemView;
  /** Drawn in the theme's negative colour: an action that deletes or leaves. */
  destructive(): MenuItemView;
  disabled(value?: boolean): MenuItemView;
  /** A check mark: the row is a toggle that is on. */
  checked(value: boolean): MenuItemView;
  /** Choosing the row leaves the menu open. */
  keepOpen(): MenuItemView;
  /** A second, quieter line under the title (drawn by the lens menu on Android and OxyOS). */
  subtitle(value: string | undefined): MenuItemView;
  onPress(value: (() => void) | undefined): MenuItemView;
  /** The row's action by name: the menu's `actions()` resolve it when the row is chosen. */
  tag(value: string): MenuItemView;
  testID(value: string): MenuItemView;
}
export interface MenuSubmenuView extends ViewNode {
  icon(value: IconComponent): MenuSubmenuView;
  disabled(value?: boolean): MenuSubmenuView;
  testID(value: string): MenuSubmenuView;
}
export interface MenuSectionView extends ViewNode {
  /** A quiet heading above the section's rows. */
  title(value: string): MenuSectionView;
}
/**
 * Bloom `Divider`: a line across its stack, vertical in an `HStack`. A label
 * (a `Text`, or any view) sits on it. In a menu, it is the line between rows.
 */
export interface DividerView extends ViewModifiers<DividerView> {
  /** `single` (default) hairline, `double` framing hairlines, or a `fill` strip. */
  lineStyle(value: DividerStyle): DividerView;
  /** Where the label sits on the line. */
  align(value: 'start' | 'center' | 'end'): DividerView;
  /** The space on each side of the line, along its stack. */
  spacing(value: SpaceToken): DividerView;
  /** The line's colour role; the neutral separator by default. */
  tint(value: ColorName): DividerView;
}
/** Bloom `Fill`: its children over the whole of the view it is in (an absolute inset). */
export type FillView = ViewModifiers<FillView>;
/** Bloom `AspectRatio`: the width of its parent, the height its ratio gives. */
export type AspectRatioView = ViewModifiers<AspectRatioView>;
/**
 * Bloom `ResponsiveGrid`: as many columns of equal cells as fit, up to
 * `columns`, each at least `minCellWidth` wide; one column below that.
 */
export interface GridView extends ViewModifiers<GridView> {
  /** The most columns (Bloom's default: 2). */
  columns(value: number): GridView;
  /** A cell's narrowest width before the grid drops a column (Bloom's default: 320). */
  minCellWidth(value: SpaceToken): GridView;
  /** The space between cells, both ways. */
  spacing(value: SpaceToken): GridView;
  /** `rows` (default) aligns cells in rows; `columns` stacks each column. */
  flow(value: GridFlow): GridView;
}
/** A `menu()` content placed in a menu: its rows are built while the menu is open. */
export type MenuContentView = ViewNode;
/** An `actions()` view: what a menu's tagged rows do, built when one is chosen. */
export type MenuActionsView = ViewNode;
/**
 * The page header and the navigation bar: a title, its toolbar items and how
 * it meets the scrolled content.
 */
export interface HeaderView extends ViewNode {
  /** `large`: the title at the ramp's title step; `inline` (default): the bar's own. */
  titleDisplay(value: TitleDisplay): HeaderView;
  subtitle(value: string | undefined): HeaderView;
  /** Trailing items, in reading order. */
  toolbar(...value: Child[]): HeaderView;
  /** Leading items, after the back button. */
  toolbarLeading(...value: Child[]): HeaderView;
  /** The back button's action; `null` shows none (a top-level destination). */
  onBack(value: (() => void) | null | undefined): HeaderView;
  /** The back button's name for assistive technology; Bloom's "Back" by default. */
  backLabel(value: string | undefined): HeaderView;
  /** The title's heading level (the web's `aria-level`); 1 by default. The system bar has none. */
  headingLevel(value: HeadingLevel): HeaderView;
  /** How the edge meets the content under it: `auto` fades in as it scrolls. */
  scrollEdge(value: ScrollEdge): HeaderView;
  /** The page's scroll offset, when the header is not in a Bloom `Screen`. */
  scrollY(value: ScrollOffset | undefined): HeaderView;
  /** `floating` (default) islands, a `bar`, or the compact `navigation` bar. */
  presentation(value: HeaderPresentation): HeaderView;
  testID(value: string): HeaderView;
}
/** The bottom bar: its tabs, the selected one, and its action (a `FAB`). */
export interface BottomBarView extends ViewNode {
  /** The `id` of the selected tab. */
  selection(value: string): BottomBarView;
  onSelect(value: (id: string) => void): BottomBarView;
  /** The action beside the tabs: a `FAB`. */
  action(value: Child): BottomBarView;
  /** Folds the bar as the page scrolls (Bloom `Screen`'s collapse progress). */
  minimize(value: Progress | undefined): BottomBarView;
  /** A swipe pager's continuous selection, in tab-index space. */
  progress(value: Progress | undefined): BottomBarView;
  /** The bar's presence, 0 (shown) to 1 (gone): it slides off its edge as a pager leaves its pages. */
  hide(value: Progress | undefined): BottomBarView;
  testID(value: string): BottomBarView;
}
export interface TabView extends ViewNode {
  /** The selected glyph, when the set draws selection by shape (an outline that fills). */
  activeIcon(value: IconComponent): TabView;
  /** A count over the glyph's corner; nothing at 0. */
  badge(value: number | undefined): TabView;
  /** The tab's identity: what `selection` and `onSelect` speak. */
  id(value: string): TabView;
  testID(value: string): TabView;
}
export interface ActionView extends ViewModifiers<ActionView> {
  count(value: number | null | undefined): ActionView;
  active(value: boolean | undefined): ActionView;
  tint(value: EngagementTone): ActionView;
}
export interface ActionBarView extends ViewModifiers<ActionBarView> {
  trailing(...value: Child[]): ActionBarView;
  countFormat(value: (count: number) => string): ActionBarView;
  size(value: BloomSize): ActionBarView;
}
export type ActionGroupView = ViewModifiers<ActionGroupView>;
export type SpacerView = ViewModifiers<SpacerView>;
export type EmbedView = ViewModifiers<EmbedView>;
/** A `view()` component placed in a tree. Its modifiers apply around its body. */
export type ComposedView = ViewModifiers<ComposedView>;

/** The app's root layout: its navigator in the shell, the primary action, the bottom bar. */
export interface AppLayoutView extends ViewNode {
  /**
   * The prominent action: the bar's FAB and the sidebar's first row on
   * Android, OxyOS and the web; on iOS, `destination`'s tab, drawn on its own
   * surface. `destination` is a destination's name (a page of the pager).
   */
  primaryAction(icon: IconComponent, label: string, destination: string): AppLayoutView;
  /** Whether the bottom bar shows on this route (the system tab bar on iOS draws itself). */
  bottomBar(value: boolean): AppLayoutView;
  /** The shell's own options (panels, layout mode, error boundaries); `navigator` is where the stack goes. */
  shell(value: ShellOptions): AppLayoutView;
  testID(value: string): AppLayoutView;
}
/** A stack of routes: the system's on iOS, the predictive-back stack on Android, the document on the web. */
export type NavStackView = ViewNode;
/** A stack's route presented as a sheet. */
export type RouteView = ViewNode;
/** The tabs group's navigator: the system tab bar on iOS, Bloom's pager elsewhere. */
export type TabNavigatorView = ViewNode;

export function isNode(value: unknown): value is Node {
  return value instanceof Node;
}
