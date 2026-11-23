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
import type {
  SidebarAccount,
  SidebarLogo,
  SidebarOnboardingStep,
  SidebarPlan,
  SidebarTeam,
} from '@oxy.so/bloom/sidebar';
import type { CommandItem as BloomCommandItem } from '@oxy.so/bloom/command';
import type { AccentTone } from '@oxy.so/bloom/theme';
import type { AvatarAccount, AvatarProps as BloomAvatarProps } from '@oxy.so/bloom/avatar';
import type { AvatarGroupItem } from '@oxy.so/bloom/avatar-group';
import type { TagFieldKind } from './controls/tag-field';
import type { ContextMenuKind } from './controls/context-menu';
import type { HoverCardKind } from './controls/hover-card';
import type { MenubarKind } from './controls/menubar';
import type { ContextMenuAnchor } from '@oxy.so/bloom/context-menu';
import type { FileUploadKind } from './controls/file-upload';
import type { VideoViewKind } from './controls/video-view';
import type { SocialButtonKind } from './controls/social-button';
import type { LinkPreviewKind } from './controls/link-preview';
import type {
  Cover,
  GalleryIndicator,
  GalleryStyle,
  GalleryView,
} from './controls/zoomable-media-gallery';
import type { GalleryVideo } from '@oxy.so/bloom/zoomable-media-gallery';
import type { GalleryKind } from './controls/zoomable-media-gallery';
import type { InputGroupKind } from './controls/input-group';
import type { NotificationKind } from './controls/notification';
import type { CompositionBarKind } from './controls/composition-bar';
import type { PhoneInputKind } from './controls/phone-input';
import type { Country } from '@oxy.so/bloom/phone-input';
import type { AvatarFlightKind } from './controls/avatar-flight';
import type { CategoryBarKind } from './controls/category-bar';
import type { VideoSlot } from './controls/media-flight';
import type { VideoSurfaceType } from '@oxy.so/bloom/media-flight';
import type { MediaFlightKind } from './controls/media-flight';
import type { DataTableKind, DataTableStyle } from './controls/data-table';
import type { SortableChipRowKind } from './controls/sortable-chip-row';
import type { ViewportKind } from './controls/viewport';
import type { GlassGroupKind } from './controls/glass-group';
import type { ToolbarGroupKind } from './controls/toolbar-group';
import type { ViewThatFitsKind } from './controls/view-that-fits';
import type {
  ConfirmationDialogKind,
  ConfirmationDialogView,
  TitleVisibility,
} from './controls/confirmation-dialog';
import type { DataTableCellContext, DataTableSize } from '@oxy.so/bloom/data-table';
import type { SortableMediaKind } from './controls/sortable-media';
import type { VideoPlaybackKind } from './controls/video-playback';
import type { ExpandableTextKind } from './controls/expandable-text';
import type { DropZoneKind } from './controls/drop-zone';
import type { DragAction, DropTargetDragEvent } from '@oxy.so/bloom/drop-zone';
import type { CollapsibleKind } from './controls/collapsible';
import type { FactStripKind } from './controls/fact-strip';
import type { InlineMarkdownLink } from '@oxy.so/bloom/markdown';
import type { SocialButtonStyle, SocialIntent } from './controls/social-button';
import type { LiveRole, NotificationStatus } from './controls/notification';
import type { NotificationAction, NotificationAvatar } from '@oxy.so/bloom/notification';
import type { ChoiceListKind } from './controls/choice-list';
import type { ChoiceOptionBox } from './controls/choice-list';
import type { ExpandableTextStyle } from './controls/expandable-text';
import type { ColorSwatchPickerKind } from './controls/color-swatch-picker';
import type { InputOtpKind } from './controls/input-otp';
import type { OtpCharacters } from './tokens';
import type { AnimatedCheckKind } from './controls/animated-check';
import type { SpinnerIconKind } from './controls/spinner-icon';
import type { MediaInsetBorderKind } from './controls/media-inset-border';
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
import type { SliderKind } from './controls/slider';
import type { MarkdownKind } from './controls/markdown';
import type { CarouselKind } from './controls/carousel';
import type { ListKind, VirtualListScreen, VirtualListTuning } from './controls/list';
import type { ListAction, ListProps } from '@oxy.so/bloom/list';
import type { SwipeRowActions, SwipeRowProps } from '@oxy.so/bloom/swipe-row';
import type { TableKind } from './controls/table';
import type { StatBarKind } from './controls/stat-bar';
import type { RatingKind } from './controls/rating';
import type { MeterReveal } from './controls/stat-bar';
import type { DatePickerKind } from './controls/date-picker';
import type { HourFormat, WeekStart } from '@oxy.so/bloom/date-picker';

import type { AgentAvatarKind } from './controls/agent-avatar';
import type { PropertyInsightKind } from './controls/property-insights';
import type { OfferingBadgeKind } from './controls/offering-badge';
import type { ListingEditorKind } from './controls/listing-editor';
import type { ListingCardKind } from './controls/listing-card';
import type { ListingActionKind } from './controls/listing-actions';
import type { VoiceKind } from './controls/voice';
import type { AgentCreatorKind } from './controls/agent-creator';
import type { AgentReplyKind } from './controls/agent-reply';
import type { AiProfileCardKind } from './controls/ai-profile-card';
import type { MultiAgentChatKind } from './controls/multi-agent-chat';
import type { AgentChatKind } from './controls/agent-chat';
import type { WebSearchKind } from './controls/web-search';
import type { TaskListKind } from './controls/task-list';
import type { GenericKind } from './controls/generic';
import type { ShareSheetKind, ShareSheetSearchOptions } from './controls/share-sheet';
import type { CartTipOption } from '@oxy.so/bloom/cart-panel';
import type { NoteCardKind } from './controls/note-card';
import type { RouteStopsKind } from './controls/route-stops';
import type { CheckoutSheetKind } from './controls/checkout-sheet';
import type { StayFilterKind } from './controls/stay-filters';
import type { StaySearchKind } from './controls/stay-search';
import type { TenancyKind } from './controls/tenancy';
import type { EvictionKind } from './controls/eviction';
import type { PlaceReviewKind } from './controls/place-reviews';
import type { CallUiKind } from './controls/call-ui';
import type { ChatPeopleKind } from './controls/chat-people';
import type { MessageBubbleKind } from './controls/message-bubble';
import type { MapChromeKind } from './controls/map-chrome';
import type { PlaceKind } from './controls/places';
import type { MailKind } from './controls/mail';
import type { HomeSearchKind } from './controls/home-search';
import type { BookingKind } from './controls/booking';
import type { ProjectBoardKind } from './controls/project-board';
import type { ActivityFeedKind } from './controls/activity-feed';
import type { OrderStatusKind } from './controls/order-status';
import type { LockupKind } from './controls/lockup';
import type { AmbientPhotoKind } from './controls/ambient-photo';
import type { CalendarViewKind } from './controls/calendar';
import type { MediaPlayerKind } from './controls/media-player';
import type { LyricsKind } from './controls/lyrics';
import type { MediaCardKind } from './controls/media-cards';
import type { PaymentMethodsKind } from './controls/payment-method';
import type { AddressesKind } from './controls/address';
import type { OrderConfirmationKind } from './controls/order-confirmation';
import type { DeliverySlotKind } from './controls/delivery-slot';
import type { CheckoutSummaryKind } from './controls/checkout-summary';
import type { VendorCardKind } from './controls/vendor-card';
import type { MenuItemKind } from './controls/menu-item';
import type { CartKind, CartPanelPromoOptions, CartPanelTipOptions } from './controls/cart-panel';
import type { PaymentStatusKind } from './controls/payment-status';
import type { PriceBreakdownKind } from './controls/price-breakdown';
import type { CreatorStudioKind } from './controls/creator-studio';
import type { CardFormKind } from './controls/card-form';
import type { MediaKind } from './controls/media';
import type { ListingKind } from './controls/listings';
import type { ChatKind } from './controls/chat';
import type { CrmKind } from './controls/crm';
import type { DashboardCardKind } from './controls/dashboard-cards';
import type { LogisticsKind } from './controls/logistics';
import type { AgentKind } from './controls/agents';
import type { MediaControlKind } from './controls/media-controls';
import type { StatCardKind } from './controls/stat-cards';
import type { AiChatKind } from './controls/ai-chat';
import type { ComposerPanelKind } from './controls/composer-panel';
import type { ChartCardKind } from './controls/chart-cards';
import type { ChatComposerKind } from './controls/chat-composer';
import type { DialogAction, DialogHeaderConfig, DialogScreenFrame } from '@oxy.so/bloom/dialog';
import type { SearchToken } from '@oxy.so/bloom/search';

import type { AnyBinding, Binding } from './binding';
import type {
  BoundaryErrorHandler,
  BoundaryFallback,
  SelectionIndicator,
  CardBorder,
  CardElevation,
  CardRadius,
  ChipHue,
  ContainerKind,
  ContainerSize,
  ContainerStyle,
  EmptyStateMedia,
  GroupedSeparator,
} from './controls/containers';
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
import type {
  AlertDefault,
  AlertView,
  DialogPlacement,
  DialogTiers,
  DialogView,
  FloatingAlign,
  FloatingSide,
  OverlayKind,
  PopoverView,
  Presentation,
  PresentedNode,
} from './controls/overlays';
import type { SettingsKind } from './controls/settings';
import type { MusicLibraryKind } from './controls/music-library';
import type { QueuePanelKind } from './controls/queue-panel';
import type { TrackListKind } from './controls/track-list';
import { OBJECTS } from './generated/spec.generated';
import { regular, type GlassTransition, type GlassValue } from './glass';
import { loopKeyframes, type KeyframesValue } from './motion/keyframes';
import type { Namespace } from './motion/namespace';
import { environmentValues, type EnvironmentKey, type EnvironmentValue } from './environment';
import type { AnyView, ViewModifier } from './modifier';
import type {
  AnchorName,
  LoopName,
  MotionToken,
  RotationName,
  TimedMotionToken,
} from './motion/tokens';
import { motionKey } from './motion/tokens';
import { phaseKeyframes, poseOf } from './motion/phases';

/** The motion a step into a phase plays with when `.phases()` names none: SwiftUI's default spring, Bloom's `select`. */
const PHASE_MOTION: MotionToken = 'select';
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
  type AnyDensity,
  type Density,
  type ContentFit,
  type DurationName,
  type Edge,
  type Role,
  type ShrinkPriority,
  type FlexName,
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
  type AgentMood,
  type OfferingBadgeSize,
  type OfferingBadgeStyle,
  type ListingCardLayout,
  type MortgageLayout,
  type OutlineNavStyle,
  type RowActionStyle,
  type ThemeToggleStyle,
  type NoteCardLayout,
  type ShareSheetSize,
  type ShelfLayout,
  type PriceScale,
  type FeatureFilterStyle,
  type FilterTriggerSize,
  type GuestPickerSize,
  type TenancyLayout,
  type RentOutstandingTone,
  type CallMode,
  type GroupCallLayout,
  type IncomingCallAnswer,
  type SelectedChipsLayout,
  type MessagePosition,
  type MessageMediaFit,
  type MapAttributionStyle,
  type LocationPuckMode,
  type PlaceCardStyle,
  type DirectionsDensity,
  type MailComposeStyle,
  type NoteToolbarSize,
  type SearchModeTabsStyle,
  type TripCardOrientation,
  type ActivityFeedGrouping,
  type OrderStatusBarStyle,
  type EngagementBarTone,
  type LockupSize,
  type TitleAlign,
  type TitleLayout,
  type TitleAppearance,
  type DismissIcon,
  type ContentAlignment,
  type PrimaryActionPlacement,
  type RailLabels,
  type RailSelection,
  type ModesPresentation,
  type Blend,
  type ButtonMaterial,
  type RadarLegend,
  type MethodTitleAlign,
  type TypeRampStep,
  type TransportStyle,
  type TransportSize,
  type LyricsSize,
  type MediaCardLayout,
  type MediaCardSize,
  type ChoiceListStyle,
  type PaymentStatusStyle,
  type PriceLineTone,
  type PipelineLayout,
  type ReleaseCardLayout,
  type ReleaseStatusBadgeSize,
  type QueuePanelStyle,
  type SelectionBarPlacement,
  type LibraryItemStyle,
  type FollowButtonSize,
  type MapPriceMarkerSize,
  type MapMarkerState,
  type ListingPhotoLayout,
  type ListingHeaderSize,
  type VideoMessageStyle,
  type MessageTone,
  type FileMessageStyle,
  type ChatStatusTone,
  type ChatInfoPanelStyle,
  type ChatDateHeaderStyle,
  type ChatBackgroundStyle,
  type AgentThinkingTone,
  type AgentThinkingStyle,
  type PlaybackTimes,
  type PlayButtonStyle,
  type PlayButtonSize,
  type StatCardsVariant,
  type AiChatLineTone,
  type SparklineTone,
  type RadarVariant,
  type ChartShape,
  type AreaVariant,
  type ReactionPickerSize,
  type ComposerButtonTone,
  type AttachmentLayout,
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
  type IconCircleSize,
  type IconSizeToken,
  type LeadingToken,
  type TrackingName,
  type OpacityName,
  type PaddingToken,
  type MarginToken,
  type BorderStyleName,
  type LiveRegion,
  type SpaceToken,
  type ControlSize,
  type InsetEdge,
  type ButtonStyle,
  type WeightName,
  type HeaderPresentation,
  type HeaderTone,
  type ScrimFalloff,
  type TitleReveal,
  type ScrollEdge,
  type ScreenKind,
  type ScreenScroll,
  type ChromePlacement,
  type NavigationScope,
  type ColorPreset,
  type ActionPlacement,
  type ScrollIndicators,
  type KeyboardDismiss,
  type HitTesting,
  type ScrollbarVisibility,
  type ScrollbarSide,
  type ScrollbarSize,
  type ScrollSurfaceStyle,
  type ResizeHandleStyle,
  type ModePresentation,
  type TeamPlacement,
  type KeyboardTaps,
  type DragIndicator,
  type SheetMaterial,
  type SheetSizing,
  type SidebarVariant,
  type SidebarSurface,
  type SidebarSize,
  type FooterPinning,
  type SettingsView,
  type ShellLayout,
  type ShellPresentation,
  type PanelRole,
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
  HeaderTone,
  Role,
  ScrimFalloff,
  ScrollEdge,
  ShrinkPriority,
  TextAlignment,
  TextCase,
  TextStyleName,
  TitleDisplay,
  TitleReveal,
  Truncation,
};
export type {
  ActionPlacement,
  ChromePlacement,
  HitTesting,
  KeyboardDismiss,
  KeyboardTaps,
  ScrollbarVisibility,
  ScrollbarSide,
  ScrollbarSize,
  ScrollSurfaceStyle,
  ResizeHandleStyle,
  ModePresentation,
  TeamPlacement,
  NavigationScope,
  ColorPreset,
  ScreenKind,
  ScreenScroll,
  ScrollIndicators,
  DragIndicator,
  SheetMaterial,
  SheetSizing,
  SidebarVariant,
  SidebarSurface,
  SidebarSize,
  FooterPinning,
  SettingsView,
  ShellLayout,
  ShellPresentation,
  PanelRole,
};
export type { GlassValue };
export type EngagementTone = Exclude<AccentTone, 'default'>;
export type IconComponent = ComponentType<{ width?: number; height?: number; fill?: string }>;
export type PressHandler = (event: GestureResponderEvent) => unknown;
/** `.accessibilityState()`: what assistive technology reads of a view's state. */
export interface AccessibilityState {
  readonly selected?: boolean;
  readonly checked?: boolean | 'mixed';
  readonly busy?: boolean;
  readonly expanded?: boolean;
  readonly disabled?: boolean;
}
/** `.childSpacing()`: the margin after each child but the last, along an axis (Tailwind's `space-x`/`space-y`). */
export interface ChildSpacing {
  readonly axis: Axis;
  readonly space: SpaceToken;
}

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

/** A bottom sheet's footer: `viewport` keeps it at the screen's edge while the sheet is dragged down. */
export interface SheetFooter {
  readonly behavior?: 'sheet' | 'viewport';
}

/** Where a screen's own floating action sits, and when it shows: Bloom `Screen`'s `primaryAction`. */
export interface FloatingActionOptions {
  /** Its place along the foot, in reading order; `end` by default. */
  readonly placement?: ActionPlacement;
  /** `alone` shows it only while the screen's panel is shown alone; `always` by default. */
  readonly visibility?: 'always' | 'alone';
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
  /** How a glass with an identity arrives and leaves (`.glassTransition()`). */
  glassTransition: GlassTransition;
  /** A glass in the content layer, on purpose (`.inContent()`). */
  inContent: true;
  loading: boolean;
  collapsed: boolean | AnyBinding;
  icon: IconComponent | ViewNode;
  destructive: true;
  checked: boolean;
  keepOpen: true;
  title: string;
  badge: string | number | ViewNode | undefined;
  activeIcon: IconComponent | ViewNode;
  selection: AnyBinding;
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
  header: ScreenHeader | DialogHeaderConfig;
  headingLevel: HeadingLevel;
  backLabel: string | undefined;
  inPage: boolean;
  safeArea: boolean;
  tone: HeaderTone;
  scrimColor: ColorToken;
  scrimFalloff: ScrimFalloff;
  titleReveal: TitleReveal;
  /** A screen's (no argument) or an app layout's (the reselected destination's name). */
  onReselect: ((name: string) => void) | undefined;
  screenKind: ScreenKind;
  screenScroll: ScreenScroll;
  documentScroll: boolean;
  headerPlacement: ChromePlacement;
  underlay: Child;
  contentClearance: SpaceToken;
  navigationScope: NavigationScope;
  colorPreset: ColorPreset;
  seed: string;
  screenActive: boolean;
  initialHeaderHeight: SpaceToken;
  initialFooterHeight: SpaceToken;
  scrollDismissesKeyboard: KeyboardDismiss;
  keyboardTaps: KeyboardTaps;
  detached: boolean;
  dragIndicator: DragIndicator;
  material: SheetMaterial | ButtonMaterial;
  scrollable: boolean;
  sizing: SheetSizing;
  interactiveDismissDisabled: boolean;
  onDismissAttempt: () => boolean;
  manualActivation: boolean;
  secondary: true;
  shortcut: string;
  expanded: AnyBinding;
  collapsible: boolean | SearchCollapse;
  emptyLabel: string;
  error: string | null | undefined;
  meta: string | undefined;
  variant: SidebarVariant;
  surface: SidebarSurface | boolean;
  searchable: boolean;
  themeToggle: boolean;
  logo: SidebarLogo;
  account: SidebarAccount;
  width: SpaceToken | ColumnWidthToken;
  pinning: FooterPinning;
  ignoresSafeArea: boolean;
  placeholder: string;
  filter: ((item: BloomCommandItem, query: string) => boolean) | AnyBinding;
  keywords: readonly string[];
  content: Child | (() => Child);
  fullBleed: boolean;
  initialView: SettingsView;
  shellLayout: ShellLayout;
  shellPresentation: ShellPresentation;
  panels: readonly Child[];
  destinations: readonly Child[];
  panelRole: PanelRole;
  minWidth: SpaceToken;
  maxWidth: SpaceToken;
  resizable: boolean;
  keepMounted: boolean;
  page: boolean | DialogScreenFrame | Binding<number>;
  preload: boolean;
  bar: boolean;
  sidebar: boolean;
  sidebarAfter: string;
  accessory: Child;
  scrollbar: ScrollbarVisibility;
  scrollbarSide: ScrollbarSide;
  stickyHeader: Child;
  stickyFooter: Child;
  fadeHeight: SpaceToken;
  fadeBottom: boolean;
  matchSurfacePaint: boolean;
  summary: string | number | Child;
  onReveal: () => void;
  peek: boolean;
  barHeight: SpaceToken;
  collapsedHeight: SpaceToken;
  band: InkToken;
  peekDelay: DurationName;
  unpeekDelay: DurationName;
  hideMotion: MotionToken;
  showMotion: MotionToken;
  thickness: SpaceToken;
  onResizeStart: () => void;
  onResizeEnd: () => void;
  onNudge: (distance: number) => void;
  mode: AnyBinding;
  modePresentation: ModePresentation;
  modesLabel: string;
  team: SidebarTeam;
  teamPlacement: TeamPlacement;
  plan: SidebarPlan;
  onboarding: SidebarOnboarding;
  onDrop: (drop: TreeDrop) => void;
  draggable: boolean;
  droppable: boolean;
  dropBeside: boolean;
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
  /** `.pressFade()`: React Native's TouchableOpacity as the press host, at this opacity while pressed (its own default without one). */
  pressFade: OpacityName | undefined;
  hoverHighlight: boolean | undefined;
  pressed: boolean | AnyBinding;
  colors: readonly [ColorToken, ColorToken];
  linkTone: ButtonLinkTone;
  inverted: boolean;
  density: AnyDensity;
  dividers: boolean;
  separated: boolean;
  columns: number;
  minCellWidth: SpaceToken;
  flow: GridFlow;
  stretchItems: boolean;

  // Inputs (controls/inputs.tsx)
  invalid: boolean;
  required: boolean;
  floatingLabel: true;
  revealable: true;
  prefix: string | Child;
  suffix: string | Child;
  keyboard: Keyboard;
  autocapitalize: Autocapitalize;
  autocorrect: boolean;
  contentType: ContentType;
  submitLabel: SubmitLabel;
  onSubmit: () => void;
  onClearText: () => void;
  autoFocus: true;
  maxLength: number;
  description: string | AnyBinding;
  readOnly: true;
  indeterminate: boolean;
  rows: number;
  autoResize: number | undefined;
  resize: TextareaResize;
  showCount: true;
  tabs: true;
  presented: Binding<boolean>;
  tokens: Binding<readonly SearchToken[]>;
  trailingIcon: IconComponent;
  completion: string;
  focused: Binding<boolean>;
  trigger: ViewNode;

  // Overlays and feedback (controls/overlays.tsx)
  alert: Presentation;
  confirmationDialog: Presentation;
  titleVisibility: TitleVisibility;
  dialog: Presentation;
  popover: Presentation;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: (() => void) | undefined;
  onCancel: (() => void) | undefined;
  hideCancel: true;
  defaultAction: AlertDefault;
  dismissible: boolean;
  buttons: readonly DialogAction[] | readonly NotificationAction[];
  presentAt: { readonly base: DialogPlacement; readonly tiers: DialogTiers | undefined };
  sideOffset: SpaceToken;
  alignOffset: PaddingToken;
  offlineMessage: string;
  reconnectingMessage: string;
  restoredMessage: string;
  reconnectingDelay: DurationName;
  restoredDuration: DurationName;
  dismissOnBackdrop: boolean;
  side: { readonly side: FloatingSide; readonly align: FloatingAlign | undefined };

  // Containers (controls/containers.tsx)
  radius: CardRadius;
  elevation: CardElevation;
  outline: CardBorder;
  clipped: true;
  leadingView: readonly Child[];
  selected: boolean | AnyBinding;
  highlighted: boolean;
  caption: string | Child;
  separator: GroupedSeparator | ListSeparator;
  value: string | AnyBinding;
  chevron: boolean;
  wrapControl: boolean;
  descriptionLines: number;
  toggle: Binding<boolean>;
  onClose: { readonly action: () => void; readonly label: string | undefined };
  hue: ChipHue;
  color: AccentTone;
  media: EmptyStateMedia;
  secondaryAction: ViewNode;
  retryLabel: string;
  resetKey: string | number | undefined;
  fullWidth: boolean;
  contentInset: SpaceToken;
  inset: SpaceToken;
  illustration: Child;
  suggestions: readonly Child[];
  suggestionsLabel: string;
  onReorder: ((fromValue: string, toValue: string) => void) | ((keys: string[]) => void);
  reorderable: boolean;
  dragTranslation: MotionValue;
  indicator: SelectionIndicator | Child;
  fade: InkToken;
  ringInset: SpaceToken;
  nativeID: string;
  describedBy: string;
  sideGutter: SpaceToken;
  maxHeightRatio: number;
  /** A dialog's `onDismissed`: once it has finished closing. */
  onDismissed: () => void;

  // Settings rows (controls/settings.tsx)
  muted: boolean | AnyBinding;
  compact: boolean;
  savedToast: boolean;
  minDate: Date;
  maxDate: Date;
  dateFormat: (date: Date) => string;

  // Date and time pickers (controls/date-picker.tsx)
  bounds: readonly [
    min: Date | string | number | null,
    max: Date | string | number | null | undefined,
  ];
  unavailable: (date: Date) => boolean;
  weekStart: WeekStart;
  locale: string;
  labels: Readonly<Record<string, unknown>>;
  quickSelect: boolean;
  initialMonth: Date;
  months: 1 | 2;
  step: number | AnyBinding;
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
  decorative: true;
  trackTint: ColorToken;
  fillDuration: DurationName;
  barCorner: Exclude<CornerName, 'concentric'>;
  backdrop: ColorToken;
  cap: MeterCap;
  onStop: readonly [action: () => void, label: string];
  rangeLabels: readonly [min: string | undefined, max: string | undefined];

  // Tables (controls/table.tsx)
  share: number;
  sort: readonly [direction: TableSort, action: () => void];
  emptyState: string | number | Child;

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
  scrollHeight: SpaceToken;
  stickyHeaders: boolean;
  sectionIndex: NonNullable<ListProps['sectionIndex']>;
  headerContent: Child;
  footerContent: Child;
  loadingRows: number;
  itemKey: (item: never, index: number) => string;
  itemType: (item: never, index: number) => string | number | undefined;
  estimatedItemSize: number;
  stickyIndices: readonly number[];
  restorationKey: string;
  tuning: VirtualListTuning;
  screen: VirtualListScreen;
  onSelectAll: (checked: boolean) => void;
  onClear: () => void;

  // Carousels (controls/carousel.tsx)
  groupSize: number;
  arrows: ArrowsPlacement | false;
  arrowsVisibility: ArrowsVisibility;
  arrowsInset: SpaceToken;
  hidesUnavailableArrows: true;
  dots: boolean;

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
  revealMotion: TimedMotionToken;

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
  onRemove: (() => void) | ((id: string) => void);

  // Tooltips, breadcrumbs and activity heatmaps (controls/tooltip.tsx, controls/breadcrumb.tsx, controls/activity-heatmap.tsx)
  openDelay: DurationName;
  collapses: true;
  separatorView: Child;
  hoverMenu: BreadcrumbHoverMenu;
  days: number;
  endDate: string;
  levels: number[];
  cellSize: SpaceToken;
  onPressDay: (day: ActivityHeatmapDay) => void;

  // Tag fields, file uploads and videos (controls/tag-field.tsx, controls/file-upload.tsx, controls/video-view.tsx)
  tagSuggestions: readonly [list: ReadonlyArray<string | TagSuggestion>, max: number | undefined];
  allowsCreate: boolean;
  onMaxReached: () => void;
  normalize: (raw: string) => string;
  query: Binding<string>;
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

  // One-time codes (controls/input-otp.tsx)
  length: number;
  characters: OtpCharacters;
  onComplete: (code: string) => void;
  // Media inset borders (controls/media-inset-border.tsx)
  opaque: boolean;
  mediaCorner: Exclude<CornerName, 'concentric'>;

  // Collapsibles (controls/collapsible.tsx)
  revealsOnAppear: boolean;
  keepsMounted: boolean;

  // Drop zones (controls/drop-zone.tsx)
  fileTypes: readonly string[];
  dragActions: readonly [actions: readonly DragAction[], preferred: DragAction | undefined];
  folder: string;
  onDragEnter: (event: DropTargetDragEvent) => void;
  onDragOver: (event: DropTargetDragEvent) => void;
  onDragLeave: () => void;

  // Fact strips (controls/fact-strip.tsx)
  minItemWidth: SpaceToken;
  // Choice lists (controls/choice-list.tsx)
  optionBox: ChoiceOptionBox;

  // Photo grids (controls/sortable-media.tsx)
  onRetry: (id: string) => void;
  onAdd: () => void;
  addHint: string;
  imageVariant: string;

  // Video playback (controls/video-playback.tsx)
  autoplay: boolean;

  // Activity heatmaps (controls/activity-heatmap.tsx)
  colorScale: readonly ColorToken[];
  // Phone inputs (controls/phone-input.tsx)
  country: Binding<string>;
  countries: readonly Country[];
  showsInfo: true;

  // Composition bars (controls/composition-bar.tsx)
  readoutFormat: (amount: number, percent: number) => string;

  // Media flights (controls/media-flight.tsx)
  surfaceType: VideoSurfaceType;
  flightId: string;
  videoSlot: VideoSlot;
  // Input groups (controls/input-group.tsx)
  divider: boolean;
  flush: boolean;

  // Notifications (controls/notification.tsx)
  timestamp: string;
  status: NotificationStatus;
  avatar: NotificationAvatar;
  onDismiss: () => void;
  autoDismiss: DurationName;
  introDelay: DurationName;
  liveRole: LiveRole;

  // Link previews (controls/link-preview.tsx)
  coverFill: boolean;

  // Social buttons (controls/social-button.tsx)
  intent: SocialIntent;

  // Meeting schedulers (controls/date-picker.tsx)
  timeSlots: readonly string[];
  onTimezonePress: () => void;
  triggerTitle: string;

  // Media galleries (controls/zoomable-media-gallery.tsx)
  fullScreenCover: Cover;
  pageIndicator: GalleryIndicator;
  videoOverlay: (media: GalleryVideo) => Child;
  sourceAnchors: readonly (string | undefined)[];

  // Inline markdown (controls/markdown.tsx)
  plainRun: (text: string) => Child;
  linkView: (link: InlineMarkdownLink) => Child | undefined;
  // Data tables (controls/data-table.tsx)
  cell: (context: DataTableCellContext<never>) => Child;
  sortable: boolean;
  sortsDescendingFirst: boolean;
  sorting: AnyBinding;
  rowSelection: Binding<readonly string[]>;
  pageSize: number;
  sizeToggle: Binding<DataTableSize>;
  bordered: boolean;

  // Sortable chip rows (controls/sortable-chip-row.tsx)
  onDragChange: (dragging: boolean) => void;

  // Viewports (controls/viewport.tsx)
  root: true;

  // Context menus (controls/context-menu.tsx)
  presentedAt: Binding<ContextMenuAnchor | null>;

  // Hover cards (controls/hover-card.tsx)
  closeDelay: DurationName;
  padded: boolean;

  // Menubars (controls/menubar.tsx)
  openMenu: Binding<string | undefined>;

  // Agent avatars (controls/agent-avatar.tsx)
  mood: AgentMood;
  interactive: boolean;
  portrait: boolean;

  // Chat composer (controls/chat-composer.tsx)
  iconSize: IconSizeToken;

  // Chart cards (controls/chart-cards.tsx)
  activeTint: ColorToken;

  // Chat (controls/chat.tsx)
  bubbleTint: ColorToken;
  contentTint: ColorToken;
  placeholderTint: ColorToken;

  // A product component's list of colours (a loader's, a gradient's, a ring's)
  gradient: readonly InkToken[];

  // Call screens (controls/call-ui.tsx)
  answerStyle: IncomingCallAnswer;

  // Message bubbles (controls/message-bubble.tsx)
  groupPosition: MessagePosition;
  mediaFit: MessageMediaFit;
  tail: boolean;
  metaOverlay: boolean;
  senderTint: ColorToken;
  // A product component's hairline (a lockup's)
  // An action bar's zero counts
  showZeroCounts: boolean;

  // Signature pads (controls/logistics.tsx)
  strokeWidth: BorderWidthName;

  // The chat screen's secondary looks (controls/chat.tsx)
  titleAlign: TitleAlign;
  titleLayout: TitleLayout;
  titleAppearance: TitleAppearance;
  dismissIcon: DismissIcon;

  // Agents (controls/agents.tsx)
  sidebarSurface: SidebarSurface;
  contentAlignment: ContentAlignment;
  primaryActionPlacement: PrimaryActionPlacement;
  railLabels: RailLabels;
  railSelection: RailSelection;
  modesPresentation: ModesPresentation;
  textVariant: TypeRampStep;
  /** A blend mode (a composer loader's), or a glass group's distance at which its glasses blend. */
  blend: Blend | SpaceToken;
  bloomOnly: boolean;

  // The other product components' secondary looks
  iconOnly: boolean;
  round: boolean;
  eyebrow: boolean;
  sidebarScrollbarSide: ScrollbarSide;
  floatingChrome: boolean;
  legend: RadarLegend;
  filled: boolean;
  mono: boolean;
  frosted: boolean;
  methodTitleAlign: MethodTitleAlign;
  methodTitleVariant: TypeRampStep;
  // Agent creator (controls/agent-creator.tsx)
  multiline: boolean;
  // A node's other editable values (controls/product.ts, bindings): each a Binding.
  activeIndex: AnyBinding;
  activeGroup: AnyBinding;
  skinTone: AnyBinding;
  activeTab: AnyBinding;
  range: AnyBinding;
  activeCell: AnyBinding;
  model: AnyBinding;
  effort: AnyBinding;
  voiceState: AnyBinding;
  permission: AnyBinding;
  tab: AnyBinding;
  navOpen: AnyBinding;
  panelOpen: AnyBinding;
  minimized: AnyBinding;
  searchQuery: AnyBinding;
  searchOpen: AnyBinding;
  answers: AnyBinding;
  memberQuery: AnyBinding;
  rate: AnyBinding;
  transcriptOpen: AnyBinding;
  highlightedIndex: AnyBinding;
  favorite: AnyBinding;
  starred: AnyBinding;
  expandedIds: AnyBinding;
  guestsOpen: AnyBinding;
  price: AnyBinding;
  downPayment: AnyBinding;
  years: AnyBinding;
  annualRate: AnyBinding;
  month: AnyBinding;
  period: AnyBinding;
  quantity: AnyBinding;
  liked: AnyBinding;
  release: AnyBinding;
  selectedMoods: AnyBinding;
  selectedGenres: AnyBinding;
  pitch: AnyBinding;
  metric: AnyBinding;
  day: AnyBinding;
  shuffle: AnyBinding;
  repeat: AnyBinding;
  playbackRate: AnyBinding;
  devicePickerOpen: AnyBinding;
  volume: AnyBinding;
  filtersOpen: AnyBinding;
  selectedExtras: AnyBinding;
  access: AnyBinding;
  window: AnyBinding;
  downloadedOnly: AnyBinding;
  view: AnyBinding;
  date: AnyBinding;
  selectedIds: AnyBinding;
  saved: AnyBinding;
  downloaded: AnyBinding;
  tilted: AnyBinding;
  lyricsActive: AnyBinding;
  queueActive: AnyBinding;
  speaker: AnyBinding;
  videoOn: AnyBinding;
  screenSharing: AnyBinding;
  localVideoCorner: AnyBinding;
  tip: readonly [tip: AnyBinding, choices: readonly CartTipOption[], options?: CartPanelTipOptions];
  promo: readonly [code: AnyBinding, options: CartPanelPromoOptions];
  search: readonly [text: AnyBinding, options?: ShareSheetSearchOptions];
  stage: AnyBinding;
  destination: AnyBinding;
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
  /** A physical side, the same in a right-to-left layout. */
  left?: PaddingToken;
  right?: PaddingToken;
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

/** What `.pinch()` takes besides its value. */
export interface PinchSpec {
  /** Bounds of the value while pinching (a scale factor). */
  min?: number;
  max?: number;
  /** Once per touch, when it ends: where the value is and the pinch's velocity (scale per second). */
  onEnd?: (end: { value: number; velocity: number }) => void;
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
/** How a text's change plays (`.contentTransition()`): the whole text rolls, or each character that changed. */
export type ContentTransition = 'roll' | 'numeric';

export type Modifier =
  | {
      readonly kind: 'padding';
      readonly key: string;
      readonly edge: Edge;
      readonly value: PaddingToken;
    }
  | { readonly kind: 'frame'; readonly key: string; readonly value: FrameSpec }
  | { readonly kind: 'grow'; readonly key: string }
  | { readonly kind: 'flex'; readonly key: string; readonly value: FlexName }
  | {
      readonly kind: 'margin';
      readonly key: string;
      readonly edge: Edge;
      readonly value: MarginToken;
    }
  | { readonly kind: 'alignSelf'; readonly key: string; readonly value: Alignment }
  | { readonly kind: 'position'; readonly key: string; readonly value: PositionEdges }
  | { readonly kind: 'offset'; readonly key: string; readonly value: OffsetSpec }
  | { readonly kind: 'zIndex'; readonly key: string; readonly value: ZIndexName }
  | { readonly kind: 'hidden'; readonly key: string; readonly value: boolean }
  | { readonly kind: 'basis'; readonly key: string; readonly value: LengthToken }
  | { readonly kind: 'scale'; readonly key: string; readonly value: ScaleName | MotionValue }
  | { readonly kind: 'allowsHitTesting'; readonly key: string; readonly value: HitTesting }
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
      /** A live or platform condition, or the app's own boolean. */
      readonly condition: Condition | boolean;
      /** What the variant changes: modifiers over the values the chain set before it. */
      readonly modifiers: readonly Modifier[];
    }
  | {
      readonly kind: 'contentView';
      readonly key: string;
      /** The content view's own modifiers, as its build function chains them. */
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
  | { readonly kind: 'borderStyle'; readonly key: string; readonly value: BorderStyleName }
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
  | { readonly kind: 'horizontalSpacing'; readonly key: string; readonly value: SpaceToken }
  | { readonly kind: 'verticalSpacing'; readonly key: string; readonly value: SpaceToken }
  | { readonly kind: 'childSpacing'; readonly key: string; readonly value: ChildSpacing }
  | { readonly kind: 'align'; readonly key: string; readonly value: Alignment }
  | { readonly kind: 'alignment'; readonly key: string; readonly value: OverlayAlignment }
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
      readonly value: ImageErrorHandler | BoundaryErrorHandler | undefined;
    }
  | {
      readonly kind: 'size';
      readonly key: string;
      readonly value:
        | IconSizeToken
        | AvatarSizeToken
        | BloomSize
        | BadgeSize
        | SpaceToken
        | ContainerSize
        | SidebarSize
        | ReactionPickerSize
        | PlayButtonSize
        | ListingHeaderSize
        | MapPriceMarkerSize
        | FollowButtonSize
        | FilterTriggerSize
        | GuestPickerSize
        | DirectionsDensity
        | NoteToolbarSize
        | OfferingBadgeSize
        | LockupSize
        | SidebarSize
        | ShareSheetSize
        | MediaCardSize
        | LyricsSize
        | ReleaseStatusBadgeSize
        | TransportSize;
    }
  | {
      readonly kind: 'style';
      readonly key: string;
      readonly value:
        | ButtonStyle
        | ExpandableTextStyle
        | SocialButtonStyle
        | BadgeStyle
        | LoadingStyle
        | RadioStyle
        | SegmentedStyle
        | ContainerStyle
        | ScrollSurfaceStyle
        | ResizeHandleStyle
        | RatingStyle
        | DotsStyle
        | StepperStyle
        | GalleryStyle
        | DataTableStyle
        | AttachmentLayout
        | AreaVariant
        | RadarVariant
        | StatCardsVariant
        | PlayButtonStyle
        | PlaybackTimes
        | AgentThinkingStyle
        | ChatBackgroundStyle
        | ChatDateHeaderStyle
        | ChatInfoPanelStyle
        | FileMessageStyle
        | VideoMessageStyle
        | ListingPhotoLayout
        | MapMarkerState
        | ShelfLayout
        | PriceScale
        | FeatureFilterStyle
        | TenancyLayout
        | CallMode
        | GroupCallLayout
        | SelectedChipsLayout
        | MapAttributionStyle
        | LocationPuckMode
        | PlaceCardStyle
        | MailComposeStyle
        | TripCardOrientation
        | SearchModeTabsStyle
        | MortgageLayout
        | ListingCardLayout
        | OfferingBadgeStyle
        | ActivityFeedGrouping
        | OrderStatusBarStyle
        | SidebarVariant
        | NoteCardLayout
        | OutlineNavStyle
        | ChoiceListStyle
        | PaymentStatusStyle
        | PipelineLayout
        | MediaCardLayout
        | ReleaseCardLayout
        | TransportStyle
        | RowActionStyle
        | ThemeToggleStyle
        | LibraryItemStyle
        | QueuePanelStyle
        | SelectionBarPlacement;
    }
  | {
      readonly kind: 'shape';
      readonly key: string;
      readonly value: ButtonShape | ShapeName | DotsShape | ChartShape;
    }
  | {
      readonly kind: 'tint';
      readonly key: string;
      readonly value:
        | BloomTone
        | ColorName
        | AvatarColor
        | AccentTone
        | ColorToken
        | ComposerButtonTone
        | SparklineTone
        | AiChatLineTone
        | AgentThinkingTone
        | ChatStatusTone
        | MessageTone
        | RentOutstandingTone
        | AccentTone
        | EngagementBarTone
        | PriceLineTone;
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
  | {
      readonly kind: 'accessibilityState';
      readonly key: string;
      readonly value: AccessibilityState;
    }
  | { readonly kind: 'liveRegion'; readonly key: string; readonly value: LiveRegion }
  | { readonly kind: 'accessibilityHidden'; readonly key: string; readonly value: boolean }
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
      /** A screen's footer options, or a bottom sheet's. */
      readonly options: ScreenFooter | SheetFooter | undefined;
    }
  | {
      readonly kind: 'floatingAction';
      readonly key: string;
      readonly content: Child;
      readonly options: FloatingActionOptions | undefined;
    }
  | {
      readonly kind: 'contentMargins';
      readonly key: string;
      readonly edge: Edge;
      readonly value: SpaceToken;
    }
  | {
      readonly kind: 'onEndReached';
      readonly key: string;
      readonly value: () => void;
      /** How many viewports before the end it is called; Bloom's 2 by default. */
      readonly threshold: number | undefined;
    }
  | {
      readonly kind: 'refreshable';
      readonly key: string;
      readonly value: Binding<boolean>;
      /** The refresh control's `tintColor` and `colors`, painted from a role; the platform's by default. */
      readonly tint: ColorToken | undefined;
    }
  | {
      readonly kind: 'scrollIndicators';
      readonly key: string;
      readonly value: ScrollIndicators;
      /** The one axis it sets; both by default. */
      readonly axis: Axis | undefined;
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
      readonly kind: 'pinch';
      readonly key: string;
      readonly value: MotionValue;
      readonly options: PinchSpec;
    }
  | { readonly kind: 'onDoubleTap'; readonly key: string; readonly value: () => void }
  | {
      readonly kind: 'animation';
      readonly key: string;
      readonly motion: MotionToken;
      readonly value: unknown;
      readonly gated: boolean;
    }
  | { readonly kind: 'animatesColors'; readonly key: string }
  | { readonly kind: 'transition'; readonly key: string; readonly value: TransitionValue }
  | {
      readonly kind: 'keyframes';
      readonly key: string;
      readonly value: KeyframesValue;
      readonly trigger: unknown;
    }
  | { readonly kind: 'repeatForever'; readonly key: string; readonly value: KeyframesValue }
  | { readonly kind: 'delay'; readonly key: string; readonly value: DurationName }
  | { readonly kind: 'anchor'; readonly key: string; readonly value: AnchorName }
  | {
      readonly kind: 'matchedGeometry';
      readonly key: string;
      readonly id: string;
      readonly namespace: Namespace;
    }
  | {
      /** `.safeAreaInset()` and `.safeAreaBar()` (`bar`): a view pinned at a scroll's edge. */
      readonly kind: 'safeAreaInset';
      readonly key: string;
      readonly edge: InsetEdge;
      readonly content: ViewNode;
      readonly spacing: SpaceToken | undefined;
      readonly bar: boolean;
    }
  | {
      readonly kind: 'environment';
      readonly key: string;
      /** The value's name: a built-in one (`controlSize`, `buttonStyle`) or an app's (`defineEnvironment`). */
      readonly name: string;
      readonly value: EnvironmentValue;
    }
  | {
      readonly kind: 'glassID';
      readonly key: string;
      readonly id: string;
      readonly namespace: Namespace;
    }
  | {
      readonly kind: 'glassUnion';
      readonly key: string;
      readonly id: string;
      readonly namespace: Namespace;
    }
  | {
      readonly kind: 'contentTransition';
      readonly key: string;
      readonly value: ContentTransition;
      readonly direction: number | undefined;
    }
  | { readonly kind: 'loop'; readonly key: string }
  | { readonly kind: 'paused'; readonly key: string; readonly value: boolean | AnyBinding }
  | {
      readonly kind: 'fallback';
      readonly key: string;
      readonly value: Child | BoundaryFallback;
    }
  | ValueModifier;

export type ModifierKind = Modifier['kind'];

// ── Nodes ────────────────────────────────────────────────────────

export type NodeKind =
  | 'stack'
  | 'zstack'
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
  | 'group'
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
  | InputKind
  | OverlayKind
  | ContainerKind
  | 'scrollView'
  | 'bottomSheet'
  | 'sidebar'
  | 'navItem'
  | 'treeSection'
  | 'treeFolder'
  | 'treeItem'
  | 'rail'
  | 'railItem'
  | 'pageFooter'
  | 'command'
  | 'commandItem'
  | 'commandGroup'
  | 'settings'
  | 'settingsGroup'
  | 'settingsItem'
  | 'panel'
  | 'destination'
  | 'toolbarView'
  | 'stickySection'
  | 'sidebarMode'
  | 'scrollArea'
  | 'scrollSurface'
  | 'autoHideBar'
  | 'resizeHandle'
  | SettingsKind
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
  | GalleryKind
  | InputGroupKind
  | PhoneInputKind
  | AvatarFlightKind
  | CategoryBarKind
  | MediaFlightKind
  | ChoiceListKind
  | VideoPlaybackKind
  | InputOtpKind
  | ColorSwatchPickerKind
  | ContextMenuKind
  | CollapsibleKind
  | DropZoneKind
  | MediaInsetBorderKind
  | SortableMediaKind
  | HoverCardKind
  | MenubarKind
  | DataTableKind
  | SortableChipRowKind
  | ViewportKind
  | GlassGroupKind
  | ToolbarGroupKind
  | ViewThatFitsKind
  | ConfirmationDialogKind
  | AnimatedCheckKind
  | SpinnerIconKind
  | FactStripKind
  | ExpandableTextKind
  | CompositionBarKind
  | NotificationKind
  | LinkPreviewKind
  | SocialButtonKind
  | AgentAvatarKind
  | ChatComposerKind
  | ChartCardKind
  | ComposerPanelKind
  | AiChatKind
  | StatCardKind
  | MediaControlKind
  | AgentKind
  | ChatKind
  | ListingKind
  | MediaKind
  | CardFormKind
  | CheckoutSheetKind
  | StayFilterKind
  | StaySearchKind
  | TenancyKind
  | EvictionKind
  | PlaceReviewKind
  | CallUiKind
  | ChatPeopleKind
  | MessageBubbleKind
  | MapChromeKind
  | PlaceKind
  | MailKind
  | BookingKind
  | HomeSearchKind
  | ListingActionKind
  | ListingCardKind
  | ListingEditorKind
  | OfferingBadgeKind
  | PropertyInsightKind
  | ProjectBoardKind
  | ActivityFeedKind
  | OrderStatusKind
  | LockupKind
  | AmbientPhotoKind
  | CalendarViewKind
  | TaskListKind
  | WebSearchKind
  | VoiceKind
  | AgentCreatorKind
  | AgentReplyKind
  | AiProfileCardKind
  | MultiAgentChatKind
  | AgentChatKind
  | RouteStopsKind
  | NoteCardKind
  | ShareSheetKind
  | GenericKind
  | AddressesKind
  | PaymentMethodsKind
  | PriceBreakdownKind
  | PaymentStatusKind
  | CrmKind
  | DashboardCardKind
  | CartKind
  | MenuItemKind
  | VendorCardKind
  | MediaCardKind
  | LyricsKind
  | CreatorStudioKind
  | CheckoutSummaryKind
  | DeliverySlotKind
  | OrderConfirmationKind
  | MediaPlayerKind
  | LogisticsKind
  | MusicLibraryKind
  | QueuePanelKind
  | TrackListKind;

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
  readonly axis: 'horizontal' | 'vertical';
}
export interface TextProps {
  readonly runs: readonly TextRun[];
  /** React Native's own Text (`RawText`): it writes only what its chain names, as a span does. */
  readonly raw?: boolean;
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
  readonly scoped: unknown;
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
  flex(value: FlexName): Node {
    return this.with({ kind: 'flex', key: `flex:${value}`, value });
  }
  margin(edgeOrValue: Edge | MarginToken, value?: MarginToken): Node {
    const edge: Edge = value === undefined ? 'all' : (edgeOrValue as Edge);
    const token = value === undefined ? (edgeOrValue as MarginToken) : value;
    return this.with({ kind: 'margin', key: `m:${edge}:${tokenKey(token)}`, edge, value: token });
  }
  alignSelf(value: Alignment): Node {
    return this.with({ kind: 'alignSelf', key: `self:${value}`, value });
  }
  position(value: PositionEdges): Node {
    return this.with({ kind: 'position', key: `pos:${objectKey(value, EDGE_KEYS)}`, value });
  }
  offset(value: OffsetSpec): Node {
    return this.with({
      kind: 'offset',
      key: `offset:${geometryKey(value.x)},${geometryKey(value.y)}`,
      value,
    });
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
    return this.with({ kind: 'scale', key: `scale:${geometryKey(value)}`, value });
  }
  allowsHitTesting(value: HitTesting): Node {
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
  when(condition: Condition | boolean, build: (variant: Node) => Node): Node {
    const { modifiers } = build(new Node(this.kind, undefined, []));
    const key = `when:${condition}(${modifiers.map((modifier) => modifier.key).join(';')})`;
    return this.with({ kind: 'when', key, condition, modifiers });
  }
  contentView(build: (view: Node) => Node): Node {
    const { modifiers } = build(new Node('stack', { axis: 'vertical' } satisfies StackProps, []));
    const key = `contentView(${modifiers.map((modifier) => modifier.key).join(';')})`;
    return this.with({ kind: 'contentView', key, modifiers });
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
  borderStyle(value: BorderStyleName): Node {
    return this.with({ kind: 'borderStyle', key: `bs:${value}`, value });
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
  horizontalSpacing(value: SpaceToken): Node {
    return this.with({ kind: 'horizontalSpacing', key: `gapx:${tokenKey(value)}`, value });
  }
  verticalSpacing(value: SpaceToken): Node {
    return this.with({ kind: 'verticalSpacing', key: `gapy:${tokenKey(value)}`, value });
  }
  childSpacing(axis: Axis, space: SpaceToken): Node {
    return this.with({
      kind: 'childSpacing',
      key: `cs:${axis}:${tokenKey(space)}`,
      value: { axis, space },
    });
  }
  align(value: Alignment): Node {
    return this.with({ kind: 'align', key: `align:${value}`, value });
  }
  alignment(value: OverlayAlignment): Node {
    return this.with({ kind: 'alignment', key: `alignment:${value}`, value });
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
  onError(value: ImageErrorHandler | BoundaryErrorHandler | undefined): Node {
    return this.with({ kind: 'onError', key: 'onError', value });
  }
  size(
    value:
      | IconSizeToken
      | AvatarSizeToken
      | BloomSize
      | BadgeSize
      | SpaceToken
      | ContainerSize
      | SidebarSize
      | ReactionPickerSize
      | PlayButtonSize
      | ListingHeaderSize
      | MapPriceMarkerSize
      | FollowButtonSize
      | FilterTriggerSize
      | GuestPickerSize
      | DirectionsDensity
      | NoteToolbarSize
      | OfferingBadgeSize
      | LockupSize
      | SidebarSize
      | ShareSheetSize
      | MediaCardSize
      | LyricsSize
      | ReleaseStatusBadgeSize
      | TransportSize,
  ): Node {
    return this.with({ kind: 'size', key: `size:${tokenKey(value)}`, value });
  }
  style(
    value:
      | ButtonStyle
      | ExpandableTextStyle
      | SocialButtonStyle
      | BadgeStyle
      | LoadingStyle
      | RadioStyle
      | SegmentedStyle
      | ContainerStyle
      | ScrollSurfaceStyle
      | ResizeHandleStyle
      | RatingStyle
      | DotsStyle
      | StepperStyle
      | GalleryStyle
      | DataTableStyle
      | AttachmentLayout
      | AreaVariant
      | RadarVariant
      | StatCardsVariant
      | PlayButtonStyle
      | PlaybackTimes
      | AgentThinkingStyle
      | ChatBackgroundStyle
      | ChatDateHeaderStyle
      | ChatInfoPanelStyle
      | FileMessageStyle
      | VideoMessageStyle
      | ListingPhotoLayout
      | MapMarkerState
      | ShelfLayout
      | PriceScale
      | FeatureFilterStyle
      | TenancyLayout
      | CallMode
      | GroupCallLayout
      | SelectedChipsLayout
      | MapAttributionStyle
      | LocationPuckMode
      | PlaceCardStyle
      | MailComposeStyle
      | TripCardOrientation
      | SearchModeTabsStyle
      | MortgageLayout
      | ListingCardLayout
      | OfferingBadgeStyle
      | ActivityFeedGrouping
      | OrderStatusBarStyle
      | SidebarVariant
      | NoteCardLayout
      | OutlineNavStyle
      | ChoiceListStyle
      | PaymentStatusStyle
      | PipelineLayout
      | MediaCardLayout
      | ReleaseCardLayout
      | TransportStyle
      | RowActionStyle
      | ThemeToggleStyle
      | LibraryItemStyle
      | QueuePanelStyle
      | SelectionBarPlacement,
  ): Node {
    return this.with({ kind: 'style', key: `style:${value}`, value });
  }
  shape(value: ButtonShape | ShapeName | DotsShape | ChartShape): Node {
    return this.with({ kind: 'shape', key: `shape:${value}`, value });
  }
  tint(
    value:
      | BloomTone
      | ColorName
      | AvatarColor
      | AccentTone
      | ColorToken
      | ComposerButtonTone
      | SparklineTone
      | AiChatLineTone
      | AgentThinkingTone
      | ChatStatusTone
      | MessageTone
      | RentOutstandingTone
      | AccentTone
      | EngagementBarTone
      | PriceLineTone,
  ): Node {
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
  accessibilityState(value: AccessibilityState): Node {
    return this.with({ kind: 'accessibilityState', key: 'a11yState', value });
  }
  liveRegion(value: LiveRegion): Node {
    return this.with({ kind: 'liveRegion', key: `live:${value}`, value });
  }
  accessibilityHidden(value = true): Node {
    return this.with({ kind: 'accessibilityHidden', key: `a11yHidden:${value}`, value });
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
  activeIndex(value: AnyBinding): Node {
    return this.set('activeIndex', value);
  }
  activeGroup(value: AnyBinding): Node {
    return this.set('activeGroup', value);
  }
  skinTone(value: AnyBinding): Node {
    return this.set('skinTone', value);
  }
  activeTab(value: AnyBinding): Node {
    return this.set('activeTab', value);
  }
  range(value: AnyBinding): Node {
    return this.set('range', value);
  }
  activeCell(value: AnyBinding): Node {
    return this.set('activeCell', value);
  }
  model(value: AnyBinding): Node {
    return this.set('model', value);
  }
  effort(value: AnyBinding): Node {
    return this.set('effort', value);
  }
  voiceState(value: AnyBinding): Node {
    return this.set('voiceState', value);
  }
  permission(value: AnyBinding): Node {
    return this.set('permission', value);
  }
  tab(value: AnyBinding): Node {
    return this.set('tab', value);
  }
  navOpen(value: AnyBinding): Node {
    return this.set('navOpen', value);
  }
  panelOpen(value: AnyBinding): Node {
    return this.set('panelOpen', value);
  }
  minimized(value: AnyBinding): Node {
    return this.set('minimized', value);
  }
  searchQuery(value: AnyBinding): Node {
    return this.set('searchQuery', value);
  }
  searchOpen(value: AnyBinding): Node {
    return this.set('searchOpen', value);
  }
  answers(value: AnyBinding): Node {
    return this.set('answers', value);
  }
  memberQuery(value: AnyBinding): Node {
    return this.set('memberQuery', value);
  }
  rate(value: AnyBinding): Node {
    return this.set('rate', value);
  }
  transcriptOpen(value: AnyBinding): Node {
    return this.set('transcriptOpen', value);
  }
  highlightedIndex(value: AnyBinding): Node {
    return this.set('highlightedIndex', value);
  }
  favorite(value: AnyBinding): Node {
    return this.set('favorite', value);
  }
  starred(value: AnyBinding): Node {
    return this.set('starred', value);
  }
  expandedIds(value: AnyBinding): Node {
    return this.set('expandedIds', value);
  }
  guestsOpen(value: AnyBinding): Node {
    return this.set('guestsOpen', value);
  }
  price(value: AnyBinding): Node {
    return this.set('price', value);
  }
  downPayment(value: AnyBinding): Node {
    return this.set('downPayment', value);
  }
  years(value: AnyBinding): Node {
    return this.set('years', value);
  }
  annualRate(value: AnyBinding): Node {
    return this.set('annualRate', value);
  }
  month(value: AnyBinding): Node {
    return this.set('month', value);
  }
  period(value: AnyBinding): Node {
    return this.set('period', value);
  }
  quantity(value: AnyBinding): Node {
    return this.set('quantity', value);
  }
  liked(value: AnyBinding): Node {
    return this.set('liked', value);
  }
  release(value: AnyBinding): Node {
    return this.set('release', value);
  }
  selectedMoods(value: AnyBinding): Node {
    return this.set('selectedMoods', value);
  }
  selectedGenres(value: AnyBinding): Node {
    return this.set('selectedGenres', value);
  }
  pitch(value: AnyBinding): Node {
    return this.set('pitch', value);
  }
  metric(value: AnyBinding): Node {
    return this.set('metric', value);
  }
  day(value: AnyBinding): Node {
    return this.set('day', value);
  }
  shuffle(value: AnyBinding): Node {
    return this.set('shuffle', value);
  }
  repeat(value: AnyBinding): Node {
    return this.set('repeat', value);
  }
  playbackRate(value: AnyBinding): Node {
    return this.set('playbackRate', value);
  }
  devicePickerOpen(value: AnyBinding): Node {
    return this.set('devicePickerOpen', value);
  }
  volume(value: AnyBinding): Node {
    return this.set('volume', value);
  }
  filtersOpen(value: AnyBinding): Node {
    return this.set('filtersOpen', value);
  }
  selectedExtras(value: AnyBinding): Node {
    return this.set('selectedExtras', value);
  }
  access(value: AnyBinding): Node {
    return this.set('access', value);
  }
  window(value: AnyBinding): Node {
    return this.set('window', value);
  }
  downloadedOnly(value: AnyBinding): Node {
    return this.set('downloadedOnly', value);
  }
  view(value: AnyBinding): Node {
    return this.set('view', value);
  }
  date(value: AnyBinding): Node {
    return this.set('date', value);
  }
  selectedIds(value: AnyBinding): Node {
    return this.set('selectedIds', value);
  }
  saved(value: AnyBinding): Node {
    return this.set('saved', value);
  }
  downloaded(value: AnyBinding): Node {
    return this.set('downloaded', value);
  }
  tilted(value: AnyBinding): Node {
    return this.set('tilted', value);
  }
  lyricsActive(value: AnyBinding): Node {
    return this.set('lyricsActive', value);
  }
  queueActive(value: AnyBinding): Node {
    return this.set('queueActive', value);
  }
  speaker(value: AnyBinding): Node {
    return this.set('speaker', value);
  }
  videoOn(value: AnyBinding): Node {
    return this.set('videoOn', value);
  }
  screenSharing(value: AnyBinding): Node {
    return this.set('screenSharing', value);
  }
  localVideoCorner(value: AnyBinding): Node {
    return this.set('localVideoCorner', value);
  }
  tip(value: AnyBinding, choices: readonly CartTipOption[], options?: CartPanelTipOptions): Node {
    return this.set('tip', [value, choices, options]);
  }
  promo(value: AnyBinding, options: CartPanelPromoOptions): Node {
    return this.set('promo', [value, options]);
  }
  search(value: AnyBinding, options?: ShareSheetSearchOptions): Node {
    return this.set('search', [value, options]);
  }
  stage(value: AnyBinding): Node {
    return this.set('stage', value);
  }
  destination(value: AnyBinding): Node {
    return this.set('destination', value);
  }
  disabled(value = true): Node {
    return this.set('disabled', value);
  }
  loading(value = true): Node {
    return this.set('loading', value);
  }
  collapsed(value: boolean | AnyBinding = true): Node {
    return this.set('collapsed', value);
  }
  icon(value: IconComponent | ViewNode): Node {
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
  badge(value: string | number | ViewNode | undefined): Node {
    return this.set('badge', value);
  }
  activeIcon(value: IconComponent | ViewNode): Node {
    return this.set('activeIcon', value);
  }
  selection(value: AnyBinding): Node {
    return this.set('selection', value);
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
  header(value: ScreenHeader | DialogHeaderConfig): Node {
    return this.set('header', value);
  }
  headingLevel(value: HeadingLevel): Node {
    return this.set('headingLevel', value);
  }
  backLabel(value: string | undefined): Node {
    return this.set('backLabel', value);
  }
  inPage(value = true): Node {
    return this.set('inPage', value);
  }
  safeArea(value = true): Node {
    return this.set('safeArea', value);
  }
  tone(value: HeaderTone): Node {
    return this.set('tone', value);
  }
  scrimColor(value: ColorToken): Node {
    return this.set('scrimColor', value);
  }
  scrimFalloff(value: ScrimFalloff): Node {
    return this.set('scrimFalloff', value);
  }
  titleReveal(value: TitleReveal): Node {
    return this.set('titleReveal', value);
  }
  sheet(open: boolean, content: () => Child, options?: SheetOptions): Node {
    return this.with({ kind: 'sheet', key: 'sheet', open, content, options });
  }
  onReselect(value: ((name: string) => void) | undefined): Node {
    return this.set('onReselect', value);
  }
  footer(content: Child, options?: ScreenFooter | SheetFooter): Node {
    return this.with({ kind: 'footer', key: 'footer', content, options });
  }
  screenKind(value: ScreenKind): Node {
    return this.set('screenKind', value);
  }
  screenScroll(value: ScreenScroll): Node {
    return this.set('screenScroll', value);
  }
  documentScroll(value = true): Node {
    return this.set('documentScroll', value);
  }
  headerPlacement(value: ChromePlacement): Node {
    return this.set('headerPlacement', value);
  }
  underlay(value: Child): Node {
    return this.set('underlay', value);
  }
  floatingAction(content: Child, options?: FloatingActionOptions): Node {
    return this.with({ kind: 'floatingAction', key: 'floatingAction', content, options });
  }
  contentClearance(value: SpaceToken): Node {
    return this.set('contentClearance', value);
  }
  navigationScope(value: NavigationScope): Node {
    return this.set('navigationScope', value);
  }
  colorPreset(value: ColorPreset): Node {
    return this.set('colorPreset', value);
  }
  seed(value: string): Node {
    return this.set('seed', value);
  }
  screenActive(value = true): Node {
    return this.set('screenActive', value);
  }
  initialHeaderHeight(value: SpaceToken): Node {
    return this.set('initialHeaderHeight', value);
  }
  initialFooterHeight(value: SpaceToken): Node {
    return this.set('initialFooterHeight', value);
  }
  contentMargins(edgeOrValue: Edge | SpaceToken, value?: SpaceToken): Node {
    const edge: Edge = value === undefined ? 'all' : (edgeOrValue as Edge);
    const token = value === undefined ? (edgeOrValue as SpaceToken) : value;
    return this.with({
      kind: 'contentMargins',
      key: `cm:${edge}:${tokenKey(token)}`,
      edge,
      value: token,
    });
  }
  refreshable(value: Binding<boolean>, tint?: ColorToken): Node {
    return this.with({ kind: 'refreshable', key: 'refreshable', value, tint });
  }
  onEndReached(value: () => void, threshold?: number): Node {
    return this.with({ kind: 'onEndReached', key: 'onEndReached', value, threshold });
  }
  scrollIndicators(value: ScrollIndicators, axis?: Axis): Node {
    return this.with({ kind: 'scrollIndicators', key: `si:${axis ?? ''}`, value, axis });
  }
  scrollDismissesKeyboard(value: KeyboardDismiss): Node {
    return this.set('scrollDismissesKeyboard', value);
  }
  keyboardTaps(value: KeyboardTaps): Node {
    return this.set('keyboardTaps', value);
  }
  detached(value = true): Node {
    return this.set('detached', value);
  }
  dragIndicator(value: DragIndicator): Node {
    return this.set('dragIndicator', value);
  }
  material(value: SheetMaterial | ButtonMaterial): Node {
    return this.set('material', value);
  }
  scrollable(value = true): Node {
    return this.set('scrollable', value);
  }
  sizing(value: SheetSizing): Node {
    return this.set('sizing', value);
  }
  interactiveDismissDisabled(value = true): Node {
    return this.set('interactiveDismissDisabled', value);
  }
  onDismissAttempt(value: () => boolean): Node {
    return this.set('onDismissAttempt', value);
  }
  manualActivation(value = true): Node {
    return this.set('manualActivation', value);
  }
  secondary(): Node {
    return this.set('secondary', true);
  }
  shortcut(value: string): Node {
    return this.set('shortcut', value);
  }
  expanded(value: AnyBinding): Node {
    return this.set('expanded', value);
  }
  collapsible(value: boolean | SearchCollapse = true): Node {
    return this.set('collapsible', value);
  }
  emptyLabel(value: string): Node {
    return this.set('emptyLabel', value);
  }
  error(value: string | null | undefined): Node {
    return this.set('error', value);
  }
  meta(value: string | undefined): Node {
    return this.set('meta', value);
  }
  variant(value: SidebarVariant): Node {
    return this.set('variant', value);
  }
  surface(value: SidebarSurface | boolean = true): Node {
    return this.set('surface', value);
  }
  searchable(value = true): Node {
    return this.set('searchable', value);
  }
  themeToggle(value = true): Node {
    return this.set('themeToggle', value);
  }
  logo(value: SidebarLogo): Node {
    return this.set('logo', value);
  }
  account(value: SidebarAccount): Node {
    return this.set('account', value);
  }
  width(value: SpaceToken | ColumnWidthToken): Node {
    return this.set('width', value);
  }
  pinning(value: FooterPinning): Node {
    return this.set('pinning', value);
  }
  ignoresSafeArea(value = true): Node {
    return this.set('ignoresSafeArea', value);
  }
  placeholder(value: string): Node {
    return this.set('placeholder', value);
  }
  query(value: Binding<string>): Node {
    return this.set('query', value);
  }
  filter(value: ((item: BloomCommandItem, query: string) => boolean) | AnyBinding): Node {
    return this.set('filter', value);
  }
  keywords(...value: string[]): Node {
    return this.set('keywords', value);
  }
  content(value: Child | (() => Child)): Node {
    return this.set('content', value);
  }
  fullBleed(value = true): Node {
    return this.set('fullBleed', value);
  }
  initialView(value: SettingsView): Node {
    return this.set('initialView', value);
  }
  shellLayout(value: ShellLayout): Node {
    return this.set('shellLayout', value);
  }
  shellPresentation(value: ShellPresentation): Node {
    return this.set('shellPresentation', value);
  }
  panels(...value: Child[]): Node {
    return this.set('panels', value);
  }
  destinations(...value: Child[]): Node {
    return this.set('destinations', value);
  }
  panelRole(value: PanelRole): Node {
    return this.set('panelRole', value);
  }
  minWidth(value: SpaceToken): Node {
    return this.set('minWidth', value);
  }
  maxWidth(value: SpaceToken): Node {
    return this.set('maxWidth', value);
  }
  resizable(value = true): Node {
    return this.set('resizable', value);
  }
  keepMounted(value = true): Node {
    return this.set('keepMounted', value);
  }
  page(value: boolean | DialogScreenFrame | Binding<number> = true): Node {
    return this.set('page', value);
  }
  preload(value = true): Node {
    return this.set('preload', value);
  }
  bar(value = true): Node {
    return this.set('bar', value);
  }
  sidebar(value = true): Node {
    return this.set('sidebar', value);
  }
  sidebarAfter(value: string): Node {
    return this.set('sidebarAfter', value);
  }
  accessory(value: Child): Node {
    return this.set('accessory', value);
  }
  scrollbar(value: ScrollbarVisibility): Node {
    return this.set('scrollbar', value);
  }
  scrollbarSide(value: ScrollbarSide): Node {
    return this.set('scrollbarSide', value);
  }
  stickyHeader(value: Child): Node {
    return this.set('stickyHeader', value);
  }
  stickyFooter(value: Child): Node {
    return this.set('stickyFooter', value);
  }
  fadeHeight(value: SpaceToken): Node {
    return this.set('fadeHeight', value);
  }
  fadeBottom(value = true): Node {
    return this.set('fadeBottom', value);
  }
  matchSurfacePaint(value = true): Node {
    return this.set('matchSurfacePaint', value);
  }
  summary(value: string | number | Child): Node {
    return this.set('summary', value);
  }
  onReveal(value: () => void): Node {
    return this.set('onReveal', value);
  }
  peek(value = true): Node {
    return this.set('peek', value);
  }
  barHeight(value: SpaceToken): Node {
    return this.set('barHeight', value);
  }
  collapsedHeight(value: SpaceToken): Node {
    return this.set('collapsedHeight', value);
  }
  band(value: InkToken): Node {
    return this.set('band', value);
  }
  peekDelay(value: DurationName): Node {
    return this.set('peekDelay', value);
  }
  unpeekDelay(value: DurationName): Node {
    return this.set('unpeekDelay', value);
  }
  hideMotion(value: MotionToken): Node {
    return this.set('hideMotion', value);
  }
  showMotion(value: MotionToken): Node {
    return this.set('showMotion', value);
  }
  thickness(value: SpaceToken): Node {
    return this.set('thickness', value);
  }
  onResizeStart(value: () => void): Node {
    return this.set('onResizeStart', value);
  }
  onResizeEnd(value: () => void): Node {
    return this.set('onResizeEnd', value);
  }
  onNudge(value: (distance: number) => void): Node {
    return this.set('onNudge', value);
  }
  mode(value: AnyBinding): Node {
    return this.set('mode', value);
  }
  modePresentation(value: ModePresentation): Node {
    return this.set('modePresentation', value);
  }
  modesLabel(value: string): Node {
    return this.set('modesLabel', value);
  }
  team(value: SidebarTeam): Node {
    return this.set('team', value);
  }
  teamPlacement(value: TeamPlacement): Node {
    return this.set('teamPlacement', value);
  }
  plan(value: SidebarPlan): Node {
    return this.set('plan', value);
  }
  onboarding(value: SidebarOnboarding): Node {
    return this.set('onboarding', value);
  }
  onDrop(value: (drop: TreeDrop) => void): Node {
    return this.set('onDrop', value);
  }
  draggable(value = true): Node {
    return this.set('draggable', value);
  }
  droppable(value = true): Node {
    return this.set('droppable', value);
  }
  dropBeside(value = true): Node {
    return this.set('dropBeside', value);
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
  stretchItems(value = true): Node {
    return this.set('stretchItems', value);
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
  pressFade(value?: OpacityName): Node {
    return this.set('pressFade', value);
  }
  hoverHighlight(value?: boolean): Node {
    return this.set('hoverHighlight', value);
  }
  listMarker(value: ListMarker): Node {
    return this.with({ kind: 'listMarker', key: `list:${value}`, value });
  }
  pressed(value: boolean | AnyBinding): Node {
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
  density(value: AnyDensity): Node {
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
    return this.with({ kind: 'rotation', key: `rotation:${geometryKey(value)}`, value });
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
  animatesColors(): Node {
    return this.with({ kind: 'animatesColors', key: 'animatesColors' });
  }
  transition(value: TransitionValue): Node {
    return this.with({ kind: 'transition', key: 'transition', value });
  }
  keyframes(value: KeyframesValue, trigger: unknown): Node {
    return this.with({ kind: 'keyframes', key: 'keyframes', value, trigger });
  }
  repeatForever(value: LoopName | KeyframesValue): Node {
    return this.with({
      kind: 'repeatForever',
      key: 'repeatForever',
      value: typeof value === 'string' ? loopKeyframes(value) : value,
    });
  }
  delay(value: DurationName): Node {
    return this.with({ kind: 'delay', key: `delay:${value}`, value });
  }
  anchor(value: AnchorName): Node {
    return this.with({ kind: 'anchor', key: `anchor:${value}`, value });
  }
  phases<P>(
    phases: readonly P[],
    trigger: unknown,
    build: (view: Node, phase: P) => Node,
    motion?: (phase: P) => MotionToken,
  ): Node {
    const blank = new Node(this.kind, undefined, []);
    const keyframes = phaseKeyframes(
      phases.map((phase) => poseOf(build(blank, phase).modifiers)),
      phases.map((phase) => motion?.(phase) ?? PHASE_MOTION),
    );
    const [rest] = phases;
    return (rest === undefined ? this : build(this, rest)).keyframes(keyframes, trigger);
  }
  matchedGeometry(id: string, namespace: Namespace): Node {
    return this.with({ kind: 'matchedGeometry', key: 'matchedGeometry', id, namespace });
  }
  glassID(id: string, namespace: Namespace): Node {
    return this.with({ kind: 'glassID', key: 'glassID', id, namespace });
  }
  glassUnion(id: string, namespace: Namespace): Node {
    return this.with({ kind: 'glassUnion', key: `glassUnion:${id}`, id, namespace });
  }
  glassTransition(value: GlassTransition): Node {
    return this.set('glassTransition', value);
  }
  inContent(): Node {
    return this.set('inContent', true);
  }
  environment<T extends EnvironmentValue>(key: EnvironmentKey<T>, value: T): Node {
    return this.with({
      kind: 'environment',
      key: `env:${key.name}=${String(value)}`,
      name: key.name,
      value,
    });
  }
  controlSize(value: ControlSize): Node {
    return this.environment(environmentValues.controlSize, value);
  }
  modifier<A extends readonly unknown[]>(value: ViewModifier<A>, ...args: A): Node {
    return value.apply(this as unknown as AnyView, ...args) as unknown as Node;
  }
  buttonStyle(value: ButtonStyle): Node {
    return this.environment(environmentValues.buttonStyle, value);
  }
  drag(value: MotionValue, options: DragSpec = {}): Node {
    return this.with({ kind: 'drag', key: 'drag', value, options });
  }
  swipe(direction: SwipeDirection, onSwipe: () => void): Node {
    return this.with({ kind: 'swipe', key: 'swipe', direction, onSwipe });
  }
  pinch(value: MotionValue, options: PinchSpec = {}): Node {
    return this.with({ kind: 'pinch', key: 'pinch', value, options });
  }
  onDoubleTap(value: () => void): Node {
    return this.with({ kind: 'onDoubleTap', key: 'onDoubleTap', value });
  }
  contentTransition(value: ContentTransition, direction?: number): Node {
    return this.with({ kind: 'contentTransition', key: 'contentTransition', value, direction });
  }
  loop(): Node {
    return this.with({ kind: 'loop', key: 'loop' });
  }
  paused(value: boolean | AnyBinding): Node {
    return this.with({ kind: 'paused', key: 'paused', value });
  }
  fallback(value: Child | BoundaryFallback): Node {
    return this.with({ kind: 'fallback', key: 'fallback', value });
  }

  // Inputs (controls/inputs.tsx)
  invalid(value = true): Node {
    return this.set('invalid', value);
  }
  required(value = true): Node {
    return this.set('required', value);
  }
  floatingLabel(): Node {
    return this.set('floatingLabel', true);
  }
  revealable(): Node {
    return this.set('revealable', true);
  }
  prefix(value: string | Child): Node {
    return this.set('prefix', value);
  }
  suffix(value: string | Child): Node {
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
  onClearText(value: () => void): Node {
    return this.set('onClearText', value);
  }
  autoFocus(): Node {
    return this.set('autoFocus', true);
  }
  maxLength(value: number): Node {
    return this.set('maxLength', value);
  }
  description(value: string | AnyBinding): Node {
    return this.set('description', value);
  }
  readOnly(): Node {
    return this.set('readOnly', true);
  }
  indeterminate(value = true): Node {
    return this.set('indeterminate', value);
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
  presented(value: Binding<boolean>): Node {
    return this.set('presented', value);
  }
  tokens(value: Binding<readonly SearchToken[]>): Node {
    return this.set('tokens', value);
  }
  trailingIcon(value: IconComponent): Node {
    return this.set('trailingIcon', value);
  }
  completion(value: string): Node {
    return this.set('completion', value);
  }
  focused(value: Binding<boolean>): Node {
    return this.set('focused', value);
  }
  trigger(value: ViewNode): Node {
    return this.set('trigger', value);
  }

  // Overlays and feedback (controls/overlays.tsx)
  alert(isPresented: Binding<boolean>, content: PresentedNode): Node {
    return this.set('alert', { isPresented, content });
  }
  confirmationDialog(isPresented: Binding<boolean>, content: PresentedNode): Node {
    return this.set('confirmationDialog', { isPresented, content });
  }
  titleVisibility(value: TitleVisibility): Node {
    return this.set('titleVisibility', value);
  }
  safeAreaInset(edge: InsetEdge, content: ViewNode, spacing?: SpaceToken): Node {
    return this.with({ kind: 'safeAreaInset', key: 'inset', edge, content, spacing, bar: false });
  }
  safeAreaBar(edge: InsetEdge, content: ViewNode): Node {
    return this.with({
      kind: 'safeAreaInset',
      key: 'inset',
      edge,
      content,
      spacing: undefined,
      bar: true,
    });
  }
  dialog(isPresented: Binding<boolean>, content: PresentedNode): Node {
    return this.set('dialog', { isPresented, content });
  }
  popover(isPresented: Binding<boolean>, content: PresentedNode): Node {
    return this.set('popover', { isPresented, content });
  }
  message(value: string): Node {
    return this.set('message', value);
  }
  confirmLabel(value: string): Node {
    return this.set('confirmLabel', value);
  }
  cancelLabel(value: string): Node {
    return this.set('cancelLabel', value);
  }
  onConfirm(value: (() => void) | undefined): Node {
    return this.set('onConfirm', value);
  }
  onCancel(value: (() => void) | undefined): Node {
    return this.set('onCancel', value);
  }
  hideCancel(): Node {
    return this.set('hideCancel', true);
  }
  defaultAction(value: AlertDefault): Node {
    return this.set('defaultAction', value);
  }
  dismissible(value: boolean): Node {
    return this.set('dismissible', value);
  }
  buttons(value: readonly DialogAction[] | readonly NotificationAction[]): Node {
    return this.set('buttons', value);
  }
  presentAt(base: DialogPlacement, tiers?: DialogTiers): Node {
    return this.set('presentAt', { base, tiers });
  }
  sideOffset(value: SpaceToken): Node {
    return this.set('sideOffset', value);
  }
  alignOffset(value: PaddingToken): Node {
    return this.set('alignOffset', value);
  }
  offlineMessage(value: string): Node {
    return this.set('offlineMessage', value);
  }
  reconnectingMessage(value: string): Node {
    return this.set('reconnectingMessage', value);
  }
  restoredMessage(value: string): Node {
    return this.set('restoredMessage', value);
  }
  reconnectingDelay(value: DurationName): Node {
    return this.set('reconnectingDelay', value);
  }
  restoredDuration(value: DurationName): Node {
    return this.set('restoredDuration', value);
  }
  dismissOnBackdrop(value: boolean): Node {
    return this.set('dismissOnBackdrop', value);
  }
  side(side: FloatingSide, align?: FloatingAlign): Node {
    return this.set('side', { side, align });
  }

  // Containers (controls/containers.tsx)
  radius(value: CardRadius): Node {
    return this.set('radius', value);
  }
  elevation(value: CardElevation): Node {
    return this.set('elevation', value);
  }
  outline(value: CardBorder): Node {
    return this.set('outline', value);
  }
  clipped(): Node {
    return this.set('clipped', true);
  }
  leadingView(...value: Child[]): Node {
    return this.set('leadingView', value);
  }
  selected(value: boolean | AnyBinding = true): Node {
    return this.set('selected', value);
  }
  highlighted(value = true): Node {
    return this.set('highlighted', value);
  }
  caption(value: string | Child): Node {
    return this.set('caption', value);
  }
  separator(value: GroupedSeparator | ListSeparator): Node {
    return this.set('separator', value);
  }
  value(value: string | AnyBinding): Node {
    return this.set('value', value);
  }
  chevron(value = true): Node {
    return this.set('chevron', value);
  }
  wrapControl(value = true): Node {
    return this.set('wrapControl', value);
  }
  descriptionLines(value: number): Node {
    return this.set('descriptionLines', value);
  }
  toggle(value: Binding<boolean>): Node {
    return this.set('toggle', value);
  }
  onClose(action: () => void, label?: string): Node {
    return this.set('onClose', { action, label });
  }
  color(value: AccentTone): Node {
    return this.set('color', value);
  }
  hue(value: ChipHue): Node {
    return this.set('hue', value);
  }
  media(value: EmptyStateMedia): Node {
    return this.set('media', value);
  }
  secondaryAction(value: ViewNode): Node {
    return this.set('secondaryAction', value);
  }
  retryLabel(value: string): Node {
    return this.set('retryLabel', value);
  }
  resetKey(value: string | number | undefined): Node {
    return this.set('resetKey', value);
  }
  fullWidth(value = true): Node {
    return this.set('fullWidth', value);
  }
  contentInset(value: SpaceToken): Node {
    return this.set('contentInset', value);
  }
  inset(value: SpaceToken): Node {
    return this.set('inset', value);
  }
  illustration(value: Child): Node {
    return this.set('illustration', value);
  }
  suggestions(...value: Child[]): Node {
    return this.set('suggestions', value);
  }
  suggestionsLabel(value: string): Node {
    return this.set('suggestionsLabel', value);
  }
  onReorder(
    value: ((fromValue: string, toValue: string) => void) | ((keys: string[]) => void),
  ): Node {
    return this.set('onReorder', value);
  }
  reorderable(value = true): Node {
    return this.set('reorderable', value);
  }
  dragTranslation(value: MotionValue): Node {
    return this.set('dragTranslation', value);
  }
  indicator(value: SelectionIndicator | Child): Node {
    return this.set('indicator', value);
  }
  fade(value: InkToken): Node {
    return this.set('fade', value);
  }
  ringInset(value: SpaceToken): Node {
    return this.set('ringInset', value);
  }
  nativeID(value: string): Node {
    return this.set('nativeID', value);
  }
  describedBy(value: string): Node {
    return this.set('describedBy', value);
  }
  sideGutter(value: SpaceToken): Node {
    return this.set('sideGutter', value);
  }
  maxHeightRatio(value: number): Node {
    return this.set('maxHeightRatio', value);
  }
  onDismissed(value: () => void): Node {
    return this.set('onDismissed', value);
  }

  // Settings rows (controls/settings.tsx)
  muted(value: boolean | AnyBinding = true): Node {
    return this.set('muted', value);
  }
  compact(value = true): Node {
    return this.set('compact', value);
  }
  savedToast(value = true): Node {
    return this.set('savedToast', value);
  }
  minDate(value: Date): Node {
    return this.set('minDate', value);
  }
  maxDate(value: Date): Node {
    return this.set('maxDate', value);
  }
  dateFormat(value: (date: Date) => string): Node {
    return this.set('dateFormat', value);
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
  step(value: number | AnyBinding): Node {
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
  decorative(): Node {
    return this.set('decorative', true);
  }
  trackTint(value: ColorToken): Node {
    return this.set('trackTint', value);
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
  onStop(action: () => void, label: string): Node {
    return this.set('onStop', [action, label]);
  }
  rangeLabels(min: string | undefined, max?: string): Node {
    return this.set('rangeLabels', [min, max]);
  }

  // Tables (controls/table.tsx)
  share(value: number): Node {
    return this.set('share', value);
  }
  sort(direction: TableSort, action: () => void): Node {
    return this.set('sort', [direction, action]);
  }
  emptyState(value: string | number | Child): Node {
    return this.set('emptyState', value);
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
  stickyIndices(value: readonly number[]): Node {
    return this.set('stickyIndices', value);
  }
  restorationKey(value: string): Node {
    return this.set('restorationKey', value);
  }
  tuning(value: VirtualListTuning): Node {
    return this.set('tuning', value);
  }
  screen(value: VirtualListScreen = {}): Node {
    return this.set('screen', value);
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
  revealMotion(value: TimedMotionToken): Node {
    return this.set('revealMotion', value);
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
  onRemove(value: (() => void) | ((id: string) => void)): Node {
    return this.set('onRemove', value);
  }

  // Tooltips, breadcrumbs and activity heatmaps (controls/tooltip.tsx, controls/breadcrumb.tsx, controls/activity-heatmap.tsx)
  openDelay(value: DurationName): Node {
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
  tagSuggestions(list: ReadonlyArray<string | TagSuggestion>, max?: number): Node {
    return this.set('tagSuggestions', [list, max]);
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

  // One-time codes (controls/input-otp.tsx)
  length(value: number): Node {
    return this.set('length', value);
  }
  characters(value: OtpCharacters): Node {
    return this.set('characters', value);
  }
  onComplete(value: (code: string) => void): Node {
    return this.set('onComplete', value);
  }
  // Collapsibles (controls/collapsible.tsx)
  revealsOnAppear(value = true): Node {
    return this.set('revealsOnAppear', value);
  }
  keepsMounted(value: boolean): Node {
    return this.set('keepsMounted', value);
  }

  // Drop zones (controls/drop-zone.tsx)
  fileTypes(value: readonly string[]): Node {
    return this.set('fileTypes', value);
  }
  dragActions(actions: readonly DragAction[], preferred?: DragAction): Node {
    return this.set('dragActions', [actions, preferred]);
  }
  folder(value: string): Node {
    return this.set('folder', value);
  }
  onDragEnter(value: (event: DropTargetDragEvent) => void): Node {
    return this.set('onDragEnter', value);
  }
  onDragOver(value: (event: DropTargetDragEvent) => void): Node {
    return this.set('onDragOver', value);
  }
  onDragLeave(value: () => void): Node {
    return this.set('onDragLeave', value);
  }

  // Media inset borders (controls/media-inset-border.tsx)
  opaque(value = true): Node {
    return this.set('opaque', value);
  }
  mediaCorner(value: Exclude<CornerName, 'concentric'>): Node {
    return this.set('mediaCorner', value);
  }

  // Fact strips (controls/fact-strip.tsx)
  minItemWidth(value: SpaceToken): Node {
    return this.set('minItemWidth', value);
  }

  // Photo grids (controls/sortable-media.tsx)
  onRetry(value: (id: string) => void): Node {
    return this.set('onRetry', value);
  }
  onAdd(value: () => void): Node {
    return this.set('onAdd', value);
  }
  addHint(value: string): Node {
    return this.set('addHint', value);
  }
  imageVariant(value: string): Node {
    return this.set('imageVariant', value);
  }

  // Choice lists (controls/choice-list.tsx)
  optionBox(value: ChoiceOptionBox): Node {
    return this.set('optionBox', value);
  }

  // Video playback (controls/video-playback.tsx)
  autoplay(value: boolean): Node {
    return this.set('autoplay', value);
  }

  // Activity heatmaps (controls/activity-heatmap.tsx)
  colorScale(value: readonly ColorToken[]): Node {
    return this.set('colorScale', value);
  }

  // Composition bars (controls/composition-bar.tsx)
  readoutFormat(value: (amount: number, percent: number) => string): Node {
    return this.set('readoutFormat', value);
  }

  // Phone inputs (controls/phone-input.tsx)
  country(value: Binding<string>): Node {
    return this.set('country', value);
  }
  countries(value: readonly Country[]): Node {
    return this.set('countries', value);
  }
  showsInfo(): Node {
    return this.set('showsInfo', true);
  }

  // Media flights (controls/media-flight.tsx)
  surfaceType(value: VideoSurfaceType): Node {
    return this.set('surfaceType', value);
  }
  flightId(value: string): Node {
    return this.set('flightId', value);
  }
  videoSlot(value: VideoSlot): Node {
    return this.set('videoSlot', value);
  }

  // Input groups (controls/input-group.tsx)
  divider(value = true): Node {
    return this.set('divider', value);
  }
  flush(value = true): Node {
    return this.set('flush', value);
  }

  // Notifications (controls/notification.tsx)
  timestamp(value: string): Node {
    return this.set('timestamp', value);
  }
  status(value: NotificationStatus): Node {
    return this.set('status', value);
  }
  avatar(value: NotificationAvatar): Node {
    return this.set('avatar', value);
  }
  onDismiss(value: () => void): Node {
    return this.set('onDismiss', value);
  }
  autoDismiss(value: DurationName): Node {
    return this.set('autoDismiss', value);
  }
  introDelay(value: DurationName): Node {
    return this.set('introDelay', value);
  }
  liveRole(value: LiveRole): Node {
    return this.set('liveRole', value);
  }

  // Link previews (controls/link-preview.tsx)
  coverFill(value = true): Node {
    return this.set('coverFill', value);
  }

  // Social buttons (controls/social-button.tsx)
  intent(value: SocialIntent): Node {
    return this.set('intent', value);
  }

  // Media galleries (controls/zoomable-media-gallery.tsx)
  fullScreenCover(isPresented: Binding<boolean>, content: GalleryView): Node {
    return this.set('fullScreenCover', [isPresented, content]);
  }
  pageIndicator(value: GalleryIndicator): Node {
    return this.set('pageIndicator', value);
  }
  videoOverlay(value: (media: GalleryVideo) => Child): Node {
    return this.set('videoOverlay', value);
  }
  sourceAnchors(value: readonly (string | undefined)[]): Node {
    return this.set('sourceAnchors', value);
  }

  // Meeting schedulers (controls/date-picker.tsx)
  timeSlots(value: readonly string[]): Node {
    return this.set('timeSlots', value);
  }
  onTimezonePress(value: () => void): Node {
    return this.set('onTimezonePress', value);
  }
  triggerTitle(value: string): Node {
    return this.set('triggerTitle', value);
  }

  // Inline markdown (controls/markdown.tsx)
  plainRun(value: (text: string) => Child): Node {
    return this.set('plainRun', value);
  }
  linkView(value: (link: InlineMarkdownLink) => Child | undefined): Node {
    return this.set('linkView', value);
  }

  // Data tables (controls/data-table.tsx)
  cell(value: (context: DataTableCellContext<never>) => Child): Node {
    return this.set('cell', value);
  }
  sortable(value = true): Node {
    return this.set('sortable', value);
  }
  sortsDescendingFirst(value = true): Node {
    return this.set('sortsDescendingFirst', value);
  }
  sorting(value: AnyBinding): Node {
    return this.set('sorting', value);
  }
  rowSelection(value: Binding<readonly string[]>): Node {
    return this.set('rowSelection', value);
  }
  pageSize(value: number): Node {
    return this.set('pageSize', value);
  }
  sizeToggle(value: Binding<DataTableSize>): Node {
    return this.set('sizeToggle', value);
  }
  bordered(value: boolean): Node {
    return this.set('bordered', value);
  }

  // Sortable chip rows (controls/sortable-chip-row.tsx)
  onDragChange(value: (dragging: boolean) => void): Node {
    return this.set('onDragChange', value);
  }

  // Viewports (controls/viewport.tsx)
  root(): Node {
    return this.set('root', true);
  }

  // Context menus (controls/context-menu.tsx)
  presentedAt(value: Binding<ContextMenuAnchor | null>): Node {
    return this.set('presentedAt', value);
  }

  // Hover cards (controls/hover-card.tsx)
  closeDelay(value: DurationName): Node {
    return this.set('closeDelay', value);
  }
  strokeWidth(value: BorderWidthName): Node {
    return this.set('strokeWidth', value);
  }
  padded(value: boolean): Node {
    return this.set('padded', value);
  }

  // Menubars (controls/menubar.tsx)
  openMenu(value: Binding<string | undefined>): Node {
    return this.set('openMenu', value);
  }

  // Agent avatars (controls/agent-avatar.tsx)
  mood(value: AgentMood): Node {
    return this.set('mood', value);
  }
  interactive(value = true): Node {
    return this.set('interactive', value);
  }
  portrait(value = true): Node {
    return this.set('portrait', value);
  }

  // Chat composer (controls/chat-composer.tsx)
  iconSize(value: IconSizeToken): Node {
    return this.set('iconSize', value);
  }

  // Chart cards (controls/chart-cards.tsx)
  activeTint(value: ColorToken): Node {
    return this.set('activeTint', value);
  }

  // Chat (controls/chat.tsx)
  bubbleTint(value: ColorToken): Node {
    return this.set('bubbleTint', value);
  }
  contentTint(value: ColorToken): Node {
    return this.set('contentTint', value);
  }
  placeholderTint(value: ColorToken): Node {
    return this.set('placeholderTint', value);
  }

  // A product component's list of colours
  gradient(colors: readonly InkToken[]): Node {
    return this.set('gradient', colors);
  }

  // Call screens (controls/call-ui.tsx)
  answerStyle(value: IncomingCallAnswer): Node {
    return this.set('answerStyle', value);
  }

  // Message bubbles (controls/message-bubble.tsx)
  groupPosition(value: MessagePosition): Node {
    return this.set('groupPosition', value);
  }
  mediaFit(value: MessageMediaFit): Node {
    return this.set('mediaFit', value);
  }
  tail(value = true): Node {
    return this.set('tail', value);
  }
  metaOverlay(value = true): Node {
    return this.set('metaOverlay', value);
  }
  senderTint(value: ColorToken): Node {
    return this.set('senderTint', value);
  }
  showZeroCounts(value = true): Node {
    return this.set('showZeroCounts', value);
  }

  // The chat screen's secondary looks (controls/chat.tsx)
  titleAlign(value: TitleAlign): Node {
    return this.set('titleAlign', value);
  }
  titleLayout(value: TitleLayout): Node {
    return this.set('titleLayout', value);
  }
  titleAppearance(value: TitleAppearance): Node {
    return this.set('titleAppearance', value);
  }
  dismissIcon(value: DismissIcon): Node {
    return this.set('dismissIcon', value);
  }

  // Agents (controls/agents.tsx)
  sidebarSurface(value: SidebarSurface): Node {
    return this.set('sidebarSurface', value);
  }
  contentAlignment(value: ContentAlignment): Node {
    return this.set('contentAlignment', value);
  }
  primaryActionPlacement(value: PrimaryActionPlacement): Node {
    return this.set('primaryActionPlacement', value);
  }
  railLabels(value: RailLabels): Node {
    return this.set('railLabels', value);
  }
  railSelection(value: RailSelection): Node {
    return this.set('railSelection', value);
  }
  modesPresentation(value: ModesPresentation): Node {
    return this.set('modesPresentation', value);
  }
  textVariant(value: TypeRampStep): Node {
    return this.set('textVariant', value);
  }
  blend(value: Blend | SpaceToken): Node {
    return this.set('blend', value);
  }
  bloomOnly(value = true): Node {
    return this.set('bloomOnly', value);
  }

  // The other product components' secondary looks
  iconOnly(value = true): Node {
    return this.set('iconOnly', value);
  }
  round(value = true): Node {
    return this.set('round', value);
  }
  eyebrow(value = true): Node {
    return this.set('eyebrow', value);
  }
  sidebarScrollbarSide(value: ScrollbarSide): Node {
    return this.set('sidebarScrollbarSide', value);
  }
  floatingChrome(value = true): Node {
    return this.set('floatingChrome', value);
  }
  legend(value: RadarLegend): Node {
    return this.set('legend', value);
  }
  filled(value = true): Node {
    return this.set('filled', value);
  }
  mono(value = true): Node {
    return this.set('mono', value);
  }
  frosted(value = true): Node {
    return this.set('frosted', value);
  }
  methodTitleAlign(value: MethodTitleAlign): Node {
    return this.set('methodTitleAlign', value);
  }
  methodTitleVariant(value: TypeRampStep): Node {
    return this.set('methodTitleVariant', value);
  }

  // Agent creator (controls/agent-creator.tsx)
  multiline(value = true): Node {
    return this.set('multiline', value);
  }
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

/**
 * A geometry value's part of its modifier's key: its token (a variant's style
 * is cached by it), or `@` for a `MotionValue`, whose number is no part of a style.
 */
function geometryKey(value: string | AppToken | MotionValue | undefined): string {
  if (value === undefined || typeof value === 'string') return value ?? '';
  return 'kind' in value && value.kind === 'motion-value' ? '@' : (value as AppToken).key;
}

// ── The typed surface: which modifiers each kind accepts ─────────

/** Modifiers every view takes. `Self` is the view's own type, so a chain keeps its kind. */
/** The screen's chrome: read from the root of a router `screen()` body, nothing elsewhere. */
export interface ScreenModifiers<Self> {
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
  /**
   * What the screen's body is (Bloom `Screen`'s `kind`): `document`, `form`,
   * `collection`, `table` or `canvas`. A collection or a table scrolls by its
   * own list (`content`), a canvas does not scroll (`none`).
   */
  screenKind(value: ScreenKind): Self;
  /**
   * Who scrolls the screen: `auto` (default) its own viewport, `content` the
   * list in it (a `ScrollView`), `none` a bounded canvas the chrome sits around.
   */
  screenScroll(value: ScreenScroll): Self;
  /** Web: the window scrolls the page, and the chrome stays sticky in its column. */
  documentScroll(value?: boolean): Self;
  /** `overlay`: the header paints over the content and reserves no room; `inset` by default. */
  headerPlacement(value: ChromePlacement): Self;
  /** How the screen's header meets the content scrolled under it: `auto` fades it in as the page scrolls. */
  scrollEdge(value: ScrollEdge): Self;
  /** A layer behind the whole screen, header and footer included, never interactive (a wallpaper). */
  underlay(value: Child): Self;
  /** The screen's own floating action (a `FAB`): the content pads its end clear of it, and the shell's steps aside. */
  floatingAction(content: Child, options?: FloatingActionOptions): Self;
  /** The room the content keeps above the screen's bottom chrome; Bloom's 16 by default. */
  contentClearance(value: SpaceToken): Self;
  /** `isolated` keeps the shell's collapse and navigation motion out of a modal screen; `inherit` by default. */
  navigationScope(value: NavigationScope): Self;
  /**
   * The screen's own colour recipe, one of Bloom's presets (Bloom `Screen`'s
   * `colorPreset`): its content, its panel and the shell around it, restored
   * when it leaves.
   */
  colorPreset(value: ColorPreset): Self;
  /**
   * The screen's colours from one RGB seed (`#rrggbb`, Bloom `Screen`'s `seed`,
   * a colour the person chose): over `colorPreset`, the roles from Bloom's colour engine.
   */
  seed(value: string): Self;
  /**
   * Whether the screen is in front (Bloom `Screen`'s `active`): a retained
   * screen (`false`) drives no scroll, chrome or reselect. `true` by default.
   */
  screenActive(value?: boolean): Self;
  /** The header's height before it measures itself (Bloom `Screen`'s `headerHeight`, safe area included). */
  initialHeaderHeight(value: SpaceToken): Self;
  /** The footer's height before it measures itself (Bloom `Screen`'s `bottomBarHeight`, safe area included). */
  initialFooterHeight(value: SpaceToken): Self;
}

export interface ViewModifiers<Self> extends ViewNode, ScreenModifiers<Self> {
  padding(value: PaddingToken): Self;
  padding(edge: Edge, value: PaddingToken): Self;
  frame(value: FrameSpec): Self;
  /** Takes the free space along its parent's axis. */
  grow(): Self;
  /**
   * Tailwind's flex utility, exactly: `1` is `flex-1` (grow 1, shrink 1, basis
   * 0%), `auto`, `initial`, `none`, and `grow` (`flex-grow: 1` alone).
   */
  flex(value: FlexName): Self;
  /**
   * Room outside the box, on every edge or one (`top`, `leading`, `left`…): a
   * margin, on the view itself. `auto` takes the free space on that side
   * (`.margin('leading', 'auto')` pushes the view to the trailing end, Tailwind's `ms-auto`).
   */
  margin(value: MarginToken): Self;
  margin(edge: Edge, value: MarginToken): Self;
  /** Clips what it draws to its bounds, rounded by its corner (SwiftUI's `clipped()`): a corner alone does not clip. */
  clipped(): Self;
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
  /**
   * `false`: touches and the pointer pass through the view and everything
   * inside it, to what is under it. `'children'`: through the view, not what
   * is inside it (React Native's `box-none`); `'self'`: the view takes them,
   * what is inside it does not (`box-only`).
   */
  allowsHitTesting(value: HitTesting): Self;
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
  /** The border's line: `solid` (the default), `dashed` or `dotted` (React Native's `borderStyle`). */
  borderStyle(value: BorderStyleName): Self;
  /** A ring outside the box (an outline, which takes no room): a role, `thin` by default, `offset` from the edge; `none` removes one. */
  ring(value: InkToken | 'none', width?: BorderWidthName, offset?: SpaceToken): Self;
  /** Bloom's elevation under the box: `s`, `m` or `floating`. */
  shadow(value: ShadowName): Self;
  /**
   * A variant: while `condition` holds, the modifiers `build` chains onto the
   * view override the values set before this call (`.padding('sm').when('md',
   * (v) => v.padding('lg'))`). Only style modifiers vary (the spec's
   * `variants.modifiers`); on the web a breakpoint, the scheme and a state are
   * CSS, on native environment reads. A boolean is the app's own condition,
   * settled when the view renders as a platform is (`.when(isActive, (v) =>
   * v.background('primary'))`).
   */
  when(condition: Condition | boolean, build: (variant: Self) => Self): Self;
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
  /**
   * A pressable view fades while pressed, as React Native's
   * `TouchableOpacity` fades it (its host): to `opacity` (an opacity token,
   * `TouchableOpacity`'s own 0.2 without one) at once on touch, and back on
   * release with its own timing and curve.
   */
  pressFade(value?: OpacityName): Self;
  label(value: string | undefined): Self;
  hint(value: string | undefined): Self;
  role(value: Role): Self;
  /**
   * What assistive technology reads of the view's state: `selected`,
   * `checked` (or `'mixed'`), `busy`, `expanded`, `disabled` (React Native's
   * `accessibilityState`, as an app writes it).
   */
  accessibilityState(value: AccessibilityState): Self;
  /** A change inside the view is announced: `polite`, `assertive` or `none` (`accessibilityLiveRegion`). */
  liveRegion(value: LiveRegion): Self;
  /**
   * Hidden from screen readers, with everything inside it: on Android and iOS
   * `accessibilityElementsHidden` and `importantForAccessibility:
   * 'no-hide-descendants'`, on the web `aria-hidden`. `false` reads it again.
   */
  accessibilityHidden(value?: boolean): Self;
  hitSlop(value: HitSlopName): Self;
  testID(value: string): Self;
  /** A Bloom `Badge` attached to the view, at the badge's `placement` (the top right by default). */
  badge(value: BadgeView): Self;
  /** What the binding presents over the screen while it is true (a `Gallery`); dismissing it clears the binding. */
  fullScreenCover(isPresented: Binding<boolean>, content: GalleryView): Self;
  id(value: string | number): Self;
  /** An alert while `isPresented` holds (Bloom's `AlertDialog`); dismissing it sets it false. */
  alert(isPresented: Binding<boolean>, alert: AlertView): Self;
  /**
   * SwiftUI's `confirmationDialog`: while `isPresented` holds, the dialog's
   * actions grow out of this view (the lens menu on Android and OxyOS, the
   * system's action sheet on iOS, Bloom's dialog on the web). Every action
   * dismisses it, and dismissing it cancels.
   */
  confirmationDialog(isPresented: Binding<boolean>, dialog: ConfirmationDialogView): Self;
  /** A dialog while `isPresented` holds (Bloom's `Dialog`); dismissing it sets it false. */
  dialog(isPresented: Binding<boolean>, dialog: DialogView): Self;
  /** A popover anchored on this view while `isPresented` holds (Bloom's `Popover`); pressing the view opens it. */
  popover(isPresented: Binding<boolean>, popover: PopoverView): Self;
  rotation(value: RotationName | MotionValue): Self;
  /**
   * SwiftUI's `.animation(_:value:)`: changes to this view's scale, offset,
   * rotation and opacity, and to what animates inside it (a matched geometry, a
   * content transition, keyframes and transitions without their own motion),
   * play with `motion`. With a value, they animate only when that value changes.
   * Its colours change at once unless it says `.animatesColors()`.
   */
  animation(motion: MotionToken, value?: unknown): Self;
  /**
   * The view's colour changes (the fill, border, outline and text colour of its
   * moving box) play with the `.animation()` in scope, its own or one above it
   * (Tailwind's `transition-colors`). A plain `.animation()` changes colours at
   * once, and a theme switch changes them at once here too.
   */
  animatesColors(): Self;
  /** How the view arrives and leaves (see `TransitionValue`). */
  transition(value: TransitionValue): Self;
  /** Plays `keyframes` each time `trigger` changes to a truthy value. */
  keyframes(value: KeyframesValue, trigger: unknown): Self;
  /**
   * SwiftUI's `keyframeAnimator(repeating: true)`: plays a loop again and
   * again while the view is on screen (`'spin'`, `'pulse'`, Tailwind's
   * `animate-spin` and `animate-pulse`, or keyframes of the app's own). Not
   * under reduced motion.
   */
  repeatForever(value: LoopName | KeyframesValue): Self;
  /**
   * How long what this view plays waits before it starts: a change under its
   * `.animation()`, its transition's insertion and removal, its keyframes and
   * its loop (a duration token: Bloom's `instant`, `fast`, `normal`, `slow`, or an exact one apps write).
   */
  delay(value: DurationName): Self;
  /**
   * The point the view scales and rotates about (SwiftUI's `anchor:`,
   * Tailwind's `origin-*`), the centre by default. Leading and trailing are
   * left and right: a transform never mirrors.
   */
  anchor(value: AnchorName): Self;
  /**
   * SwiftUI's `phaseAnimator`: the view rests in the first phase and, each
   * time `trigger` changes to a truthy value, moves through every next phase
   * and back. `build` sets a phase's geometry and opacity (`.offset()`,
   * `.scale()`, `.rotation()`, `.opacity()`, tokens), and `motion` the motion
   * a step into a phase plays with (Bloom's `select` spring by default). It
   * compiles into one keyframes value, played by the engine with no JS per frame.
   */
  phases<P>(
    phases: readonly P[],
    trigger: unknown,
    build: (view: Self, phase: P) => Self,
    motion?: (phase: P) => MotionToken,
  ): Self;
  /** SwiftUI's `matchedGeometryEffect`: moves from where the view with this id last was. */
  matchedGeometry(id: string, namespace: Namespace): Self;
  /**
   * SwiftUI's `glassEffectID`: the glass's identity in its `GlassGroup`. A glass
   * that arrives grows out of where the glass with this id was, and one that
   * leaves goes back into it (see `glassTransition`).
   */
  glassID(id: string, namespace: Namespace): Self;
  /**
   * SwiftUI's `glassEffectUnion`: the glasses of one `GlassGroup` with the same
   * id are one shape. Android's group is one base already; iOS's container
   * merges them within its `blend`; the web draws each glass on its own.
   */
  glassUnion(id: string, namespace: Namespace): Self;
  /**
   * How the glass arrives and leaves: `matchedGeometry` (the default) grows out
   * of the glass with its `glassID`; `materialize` fades the material in and out
   * where it is.
   */
  glassTransition(value: GlassTransition): Self;
  /**
   * This glass is in the content layer on purpose (a row's control that becomes
   * its menu): the compiler's warning about glass in scrolling content is not
   * said for it. Glass belongs to the navigation layer otherwise.
   */
  inContent(): Self;
  /**
   * Disables the view and every control inside it (SwiftUI's `disabled`): a
   * control that says nothing of its own takes it, and `when('disabled', …)`
   * answers it.
   */
  disabled(value?: boolean): Self;
  /** Sets an environment value on everything inside (`defineEnvironment`; read with `useEnvironment`). */
  environment<T extends EnvironmentValue>(key: EnvironmentKey<T>, value: T): Self;
  /** The size every control inside takes when it names none (Bloom's control rungs). */
  controlSize(value: ControlSize): Self;
  /** Applies a named recipe of modifiers (`defineModifier`), with its arguments. */
  modifier<A extends readonly unknown[]>(value: ViewModifier<A>, ...args: A): Self;
  /** The style every `Button` inside takes when it names none (`glass` and `glassProminent` included). */
  buttonStyle(value: ButtonStyle): Self;
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
  /**
   * `MagnifyGesture`: the fingers' spread scales `value` from where it was (a
   * factor: 2 is twice as large), within `min`/`max`. Bind the value to see it
   * (`.scale(s)`); `options.onEnd` decides where it goes on release
   * (`animate()`). Native: the pinch runs on the UI thread, with no JS per frame.
   */
  pinch(value: MotionValue, options?: PinchSpec): Self;
  /**
   * `onTapGesture(count: 2)`: two taps in quick succession run `action`, on
   * Bloom's gesture layer. A single tap is still the view's own (`.onPress()`).
   */
  onDoubleTap(action: () => void): Self;
}

export interface StackView extends ViewModifiers<StackView> {
  /** The gap between children. */
  spacing(value: SpaceToken): StackView;
  /** The gap between children side by side (`columnGap`, Tailwind's `gap-x-*`), over `spacing`'s. */
  horizontalSpacing(value: SpaceToken): StackView;
  /** The gap between children one above another, and between wrapped lines (`rowGap`, Tailwind's `gap-y-*`), over `spacing`'s. */
  verticalSpacing(value: SpaceToken): StackView;
  /**
   * Tailwind's `space-x-*`/`space-y-*` exactly as NativeWind draws them: on the
   * web a margin after every child but the last, along `axis` (the inline end,
   * or the block end); on Android and iOS nothing, as NativeWind writes no rule
   * for a child selector. Not a gap: new screens use `.spacing()`.
   */
  childSpacing(axis: Axis, space: SpaceToken): StackView;
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
 * Children over one another, later ones on top (SwiftUI's `ZStack`): the
 * stack is as big as its largest child, and each child sits at the stack's
 * alignment. A child pinned to its parent (`Fill()`, `.position()`) covers
 * the whole stack and takes no part in its size.
 */
export interface ZStackView extends ViewModifiers<ZStackView> {
  /** Where each child sits in the stack (`ZStack(alignment:)`): `center` by default. */
  alignment(value: OverlayAlignment): ZStackView;
  /** A pressable stack that takes no presses, announced as disabled; what `when('disabled', …)` answers. */
  disabled(value?: boolean): ZStackView;
  /**
   * Bloom's hover wash behind the stack (`SubtleHover`): under the pointer, on
   * the web; or while `active` (a coordinated highlight), on every platform.
   */
  hoverHighlight(active?: boolean): ZStackView;
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
  /**
   * How its lines align: `start` and `end` follow the reading direction;
   * `left` and `right` are Tailwind's `text-left` and `text-right` as NativeWind
   * writes them (React Native's own `left` and `right`, the web's CSS ones).
   */
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
   * How a change of the text inside an animation plays, up when `direction`
   * rose and down when it fell: `roll` rolls the old text out and the new one
   * in; `numeric` (SwiftUI's `.contentTransition(.numericText(value:))`) rolls
   * each character that changed, the rest staying put.
   */
  contentTransition(value: ContentTransition, direction?: number): TextView;
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
  /** Bloom's semantic colour (`color`): one of its accent tones, the tone when no `tint()` is set. */
  color(value: AccentTone): BadgeView;
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
  size(value: IconCircleSize): IconCircleView;
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
  /**
   * Bloom's appearance, or a glass style: `glass` (the button on glass, its
   * ink the neutral tone's) and `glassProminent` (on glass tinted with its
   * tone's fill, the accent by default: one per bar, for the key action).
   */
  style(value: ButtonStyle): ButtonView;
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
  density(value: Density<'button'>): ButtonView;
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
  /** The key chord that runs it from a menubar (`Mod+N`, `Mod+Shift+Z`), drawn beside its title there. */
  shortcut(value: string): MenuItemView;
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
  /** Chart cards fill the tallest cell of each row of several columns (Bloom's `stretchItems`). */
  stretchItems(value?: boolean): GridView;
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
  /** Bloom's `PageHeader` on iOS too, even in a native stack (no system bar). */
  inPage(value?: boolean): HeaderView;
  /** Pads its top by the safe-area inset (Bloom's default: on native, not on the web). */
  safeArea(value?: boolean): HeaderView;
  /** The title after the back button (`start`, the default) or centred on the bar. */
  titleAlign(value: TitleAlign): HeaderView;
  /** Full-width chrome under the title row (tabs, a toolbar). */
  accessory(value: Child): HeaderView;
  /** `onImage`: light title and text over media. */
  tone(value: HeaderTone): HeaderView;
  /** The opaque colour its scrim fades from, painted from a role (the page's background by default). */
  scrimColor(value: ColorToken): HeaderView;
  scrimFalloff(value: ScrimFalloff): HeaderView;
  /** When the title shows: `auto` (default), `always`, `onScroll`, `onDock`. */
  titleReveal(value: TitleReveal): HeaderView;
}
/** The bottom bar: its tabs, the selected one, and its action (a `FAB`). */
export interface BottomBarView extends ViewNode {
  /** The `id` of the selected tab: a binding, a tab's press writing it. */
  selection(value: Binding<string>): BottomBarView;
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
  /** The tab's identity: what the bar's `selection` speaks. */
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
  /** `horizontal` (default), or `vertical`: a video's column of actions. */
  axis(value: Axis): ActionBarView;
  /** `default`, or `onImage`: legible over artwork. */
  tint(value: EngagementBarTone): ActionBarView;
  /** Draws a count of 0 (a video's actions); by default a zero count is hidden. */
  showZeroCounts(value?: boolean): ActionBarView;
}
export type ActionGroupView = ViewModifiers<ActionGroupView>;
export type SpacerView = ViewModifiers<SpacerView>;
export type EmbedView = ViewModifiers<EmbedView>;
/**
 * Several views as one, with no view of its own (React's fragment): each child
 * is drawn where the group is, as if it were there. A `screen()` body's root
 * that holds several views: its screen modifiers are the screen's chrome.
 */
export interface GroupView extends ViewNode, ScreenModifiers<GroupView> {
  id(value: string | number): GroupView;
  /** On a `screen()` body's root, the screen's own name; elsewhere it names nothing. */
  testID(value: string): GroupView;
}
/** A `view()` component placed in a tree. Its modifiers apply around its body. */
export type ComposedView = ViewModifiers<ComposedView>;

/**
 * Bloom `ScreenScrollView`: the screen's scroller, bound to its header's fade,
 * the bottom bar's fold, its reselect and its keyboard. Its children are its
 * content, laid out in a column.
 */
export interface ScrollViewNode extends ViewModifiers<ScrollViewNode> {
  /**
   * SwiftUI's `safeAreaInset`: `view` pinned at the scroll's `edge`, and the
   * content inset by its measured height (and `spacing`), so it scrolls clear
   * of it: a filter bar over a list, a composer under a chat.
   */
  safeAreaInset(edge: InsetEdge, view: ViewNode, spacing?: SpaceToken): ScrollViewNode;
  /**
   * SwiftUI's `safeAreaBar`: a `safeAreaInset` that is a bar, with Bloom's
   * scroll edge scrim under it, so the content fades as it scrolls beneath.
   */
  safeAreaBar(edge: InsetEdge, view: ViewNode): ScrollViewNode;
  /** Room around the content, inside the scroll (the content container's padding). */
  contentMargins(value: SpaceToken): ScrollViewNode;
  contentMargins(edge: Edge, value: SpaceToken): ScrollViewNode;
  /** The gap between the content's children. */
  spacing(value: SpaceToken): ScrollViewNode;
  /**
   * Pull to refresh: whether it is refreshing, a binding a pull writes `true`
   * (the app writes `false` when done). `tint` paints the refresh control's
   * `tintColor` and `colors` from a colour role, as an app hands it its
   * theme's colour; the platform's by default.
   */
  refreshable(value: Binding<boolean>, tint?: ColorToken): ScrollViewNode;
  /** Called once each time the end comes within `threshold` viewports (2 by default). */
  onEndReached(action: () => void, threshold?: number): ScrollViewNode;
  /**
   * The scroll indicators: `hidden`, `visible`, or the platform's (`automatic`,
   * the default), on both axes or on the one `axis` names.
   */
  scrollIndicators(value: ScrollIndicators, axis?: Axis): ScrollViewNode;
  /** A drag `immediately` dismisses the keyboard, or drags it away `interactively`; `never` by default. */
  scrollDismissesKeyboard(value: KeyboardDismiss): ScrollViewNode;
  /** Whether a tap with the keyboard up reaches the content: `handled` by a control, `always`, or `never` (default). */
  keyboardTaps(value: KeyboardTaps): ScrollViewNode;
  /**
   * The content laid out in a view of its own inside the content container,
   * as Bloom's `ScreenScrollView contentView` lays it out: `build` sets that
   * view's layout (`.contentView((v) => v.padding('horizontal', 'lg').spacing('md'))`).
   * The content container then grows to the viewport and pads only the
   * screen's chrome; the content margins and spacing go on the view, after its own.
   */
  contentView(build: (view: ScrollContentView) => ScrollContentView): ScrollViewNode;
}

/**
 * A scroll view's content view (`.contentView()`): the layout of one view,
 * Bloom's inside the content container (the spec's `contentView.modifiers`).
 */
export interface ScrollContentView
  extends Pick<
    ViewModifiers<ScrollContentView>,
    'padding' | 'frame' | 'flex' | 'grow' | 'shrink' | 'basis' | 'alignSelf'
  > {
  /** The gap between the content's children. */
  spacing(value: SpaceToken): ScrollContentView;
  /** The gap between children side by side (`columnGap`). */
  horizontalSpacing(value: SpaceToken): ScrollContentView;
  /** The gap between children one above another (`rowGap`). */
  verticalSpacing(value: SpaceToken): ScrollContentView;
  /** The children's place across the axis. */
  align(value: Alignment): ScrollContentView;
  /** How the children spread along the axis. */
  justify(value: Justify): ScrollContentView;
  /** Children that do not fit flow onto further lines. */
  wrap(value?: boolean): ScrollContentView;
  /** Lays the children out along `horizontal` (a row) or `vertical` (the default). */
  axis(value: Axis): ScrollContentView;
}

/**
 * Bloom `BottomSheet`, as a `.sheet()`'s content: the sheet the content is
 * presented in, from the bottom (the system sheet on iOS). Its children are
 * its body, which scrolls inside it unless `.scrollable(false)`.
 */
export interface BottomSheetView extends ViewNode {
  /** Inset from the screen's edges with every corner rounded; full width with a rounded top by default. */
  detached(value?: boolean): BottomSheetView;
  /** The drag handle at its top: `visible` (default) or `hidden`. */
  dragIndicator(value: DragIndicator): BottomSheetView;
  /** Bloom's optical `surface` (default) or the plain backing fill (`flat`). */
  material(value: SheetMaterial): BottomSheetView;
  /** The body scrolls inside the sheet (default); `false` when the body owns its own list. */
  scrollable(value?: boolean): BottomSheetView;
  /** `content` (default) fits the body's height; `fill` gives a list a bounded viewport. */
  sizing(value: SheetSizing): BottomSheetView;
  /** A drag down does not dismiss it. */
  interactiveDismissDisabled(value?: boolean): BottomSheetView;
  /** Asked before the reader's dismissal (back, the backdrop, Escape, a drag); `false` keeps it open. */
  onDismissAttempt(value: () => boolean): BottomSheetView;
  /** The body's drag starts only at the top of its scroll and past 8 down (for scrolling content on Android). */
  manualActivation(value?: boolean): BottomSheetView;
  /** A bar under the body, its height reserved; `viewport` keeps it at the screen's edge while dragged. */
  footer(content: Child, options?: SheetFooter): BottomSheetView;
  /** The sheet's presence, 0 (closed) to 1 (presented), on the UI thread. */
  progress(value: Progress | undefined): BottomSheetView;
  /** The sheet's accessible name. */
  label(value: string | undefined): BottomSheetView;
}

/**
 * Bloom `Sidebar`: the app's navigation column. Its rows are `NavItem`s (its
 * destinations; `.secondary()` ones pinned at its foot) and `TreeSection`s
 * (Bloom's tree: `TreeFolder`s and `TreeItem`s, nested).
 */
export interface SidebarView extends ViewNode {
  /**
   * The id of the selected row, a destination or a tree row: a binding, a
   * pressed tree row writing it, and a destination that links (Bloom's
   * `onNavigate`, which then takes over the link's own push).
   */
  selection(value: Binding<string>): SidebarView;
  /** Replaces the logo and account row; `false` draws none. */
  header(value: ViewNode | false): SidebarView;
  /** A row of controls under the header, kept in view. */
  toolbar(...value: Child[]): SidebarView;
  /** What stays at its foot, under the rows. */
  footer(content: Child): SidebarView;
  /** `panel` (default) or the narrow `rail`. */
  variant(value: SidebarVariant): SidebarView;
  /** `card` (default), `plain` or `docked`. */
  surface(value: SidebarSurface): SidebarView;
  /** Its width and rows: `sm`, `md` (default) or `lg`. */
  size(value: SidebarSize): SidebarView;
  /** Folded to its icons: a binding, its collapse control writing it. */
  collapsed(value: Binding<boolean>): SidebarView;
  /** Its search field (shown by default). */
  searchable(value?: boolean): SidebarView;
  /** Its theme toggle (shown by default). */
  themeToggle(value?: boolean): SidebarView;
  logo(value: SidebarLogo): SidebarView;
  account(value: SidebarAccount): SidebarView;
  /** Its accessible name. */
  label(value: string | undefined): SidebarView;
  testID(value: string): SidebarView;
  /** The key of the selected `SidebarMode` (its switcher under the header): a binding, a press or its shortcut writing it. */
  mode(value: Binding<string>): SidebarView;
  /** `segmented` (default), the labelled control; `toggle`, a compact switch for two modes. */
  modePresentation(value: ModePresentation): SidebarView;
  /** The modes' accessible name. */
  modesLabel(value: string): SidebarView;
  /** The team: its card at the foot and the menu it opens (Bloom's `SidebarTeam`). */
  team(value: SidebarTeam): SidebarView;
  /** `header`: the team is the switcher at the top and the account the card at the foot; `footer` by default. */
  teamPlacement(value: TeamPlacement): SidebarView;
  /** The plan card at the foot, in place of the team card (Bloom's `SidebarPlan`). */
  plan(value: SidebarPlan): SidebarView;
  /** The getting-started card under the destinations. */
  onboarding(value: SidebarOnboarding): SidebarView;
  /** Its quick search's text, and what to tell when it changes (the app filters its own content with it). */
  query(value: Binding<string>): SidebarView;
  /** A `draggable` tree row was dropped: where it landed, by id; the app moves it. */
  onDrop(value: (drop: TreeDrop) => void): SidebarView;
}
/**
 * A mode of a `Sidebar`'s switcher (Search / Computer): its label and glyph.
 * The sidebar's `.mode()` is the selected one.
 */
export interface SidebarModeView extends ViewNode {
  /** Its key: what `.mode()` speaks; its label by default. */
  id(value: string): SidebarModeView;
  /** Its keyboard shortcut on the web, shown on hover and bound by the sidebar (`⌥⌃1`). */
  shortcut(value: string): SidebarModeView;
}
/**
 * Where a dragged tree row landed (Bloom's `SidebarTreeDrop`, by id): `before`
 * or `after` the row `target`, or `inside` it as its last row; with no target,
 * inside the section, after its last row.
 */
export interface TreeDrop {
  /** The dragged row. */
  readonly id: string;
  /** The section it came from. */
  readonly from: string;
  readonly target?: string;
  readonly position: 'before' | 'inside' | 'after';
  /** The section it landed in. */
  readonly section: string;
}
/** A sidebar's getting-started card (Bloom's `onboarding`): its steps are the app's tasks. */
export interface SidebarOnboarding {
  title: string;
  /** The product's mark or an avatar, in a 20px slot. */
  leading?: Child;
  steps: ReadonlyArray<SidebarOnboardingStep>;
  /** How many incomplete steps show, in order (2 by default). */
  visibleCount?: number;
  /** Opens the welcome flow from its header. */
  onPress?: () => void;
  /** Opens the full guide; without it the card has no footer action. */
  onSeeAll?: () => void;
  seeAllLabel?: string;
}
/** A destination in a `Sidebar`. */
export interface NavItemView extends ViewNode {
  /** Its identity: what `selection` speaks; its label by default. */
  id(value: string): NavItemView;
  activeIcon(value: IconComponent): NavItemView;
  /** A count or a word at its end. */
  badge(value: string | number | undefined): NavItemView;
  /** Where it goes (Bloom's router opens it). */
  link(href: string): NavItemView;
  /** Its keyboard shortcut, drawn at its end and bound on the web (`⌘1`). */
  shortcut(value: string): NavItemView;
  /** Pinned at the sidebar's foot, under its other rows. */
  secondary(): NavItemView;
  onPress(value: Press | undefined): NavItemView;
  onLongPress(value: (() => void) | undefined): NavItemView;
}
/** A section of a `Sidebar`'s tree: its folders and rows under a heading. */
export interface TreeSectionView extends ViewNode {
  id(value: string): TreeSectionView;
  /** Controls at the heading's end (an add button). */
  trailing(...value: Child[]): TreeSectionView;
  /** Its heading folds it. */
  collapsible(value?: boolean): TreeSectionView;
  /** Open: a binding (controlled); open at first otherwise. */
  expanded(value: Binding<boolean>): TreeSectionView;
  loading(value?: boolean): TreeSectionView;
  error(value: string | undefined): TreeSectionView;
  /** What it says when it has no rows. */
  emptyLabel(value: string): TreeSectionView;
  /** `false`: nothing can be dropped into it. */
  droppable(value?: boolean): TreeSectionView;
}
/** A folder of a tree section: rows under a disclosure. */
export interface TreeFolderView extends ViewNode {
  id(value: string): TreeFolderView;
  trailing(...value: Child[]): TreeFolderView;
  expanded(value: Binding<boolean>): TreeFolderView;
}
/** A row of a sidebar's tree; its `TreeItem` children are nested under it. */
export interface TreeItemView extends ViewNode {
  id(value: string): TreeItemView;
  icon(value: IconComponent): TreeItemView;
  /** A second line (Bloom's `description`). */
  subtitle(value: string | undefined): TreeItemView;
  /** A quiet word at its end (a count, a time). */
  meta(value: string | undefined): TreeItemView;
  link(href: string): TreeItemView;
  /** Controls at its end. */
  trailing(...value: Child[]): TreeItemView;
  disabled(value?: boolean): TreeItemView;
  expanded(value: Binding<boolean>): TreeItemView;
  emptyLabel(value: string): TreeItemView;
  onPress(value: Press | undefined): TreeItemView;
  onLongPress(value: (() => void) | undefined): TreeItemView;
  /** It can be dragged (the sidebar's `.onDrop` takes it): a long press lifts it on touch. */
  draggable(value?: boolean): TreeItemView;
  /** `false`: nothing lands inside it. */
  droppable(value?: boolean): TreeItemView;
  /** `false`: nothing lands before or after it (a container among containers); a drop goes inside. */
  dropBeside(value?: boolean): TreeItemView;
}
/** Bloom `Rail`: a narrow column of destinations, each a `RailItem`. */
export interface RailView extends ViewNode {
  /** The id of the active item: a binding, an item's press writing it. */
  selection(value: Binding<string>): RailView;
  /** Pinned above the items (a brand mark). */
  header(value: ViewNode): RailView;
  /** Pinned below the items (an account control). */
  footer(content: Child): RailView;
  /** Its width; Bloom's 80 by default. */
  width(value: SpaceToken): RailView;
  testID(value: string): RailView;
}
/** A destination of a `Rail`: its label and glyph views, as the app draws them. */
export interface RailItemView extends ViewNode {
  id(value: string): RailItemView;
  /** The glyph while it is active. */
  activeIcon(value: ViewNode): RailItemView;
}
/** Bloom `PageFooter`: a page's foot, its actions on a scrim over the content. */
export interface PageFooterView extends ViewNode {
  /** The controls row. */
  toolbar(...value: Child[]): PageFooterView;
  /** `absolute` (default) over the page, `sticky` or `document` in the web's flow, or `inline`. */
  pinning(value: FooterPinning): PageFooterView;
  /** The gradient behind it: `always` (default), `auto` as the page scrolls, or `none`. */
  scrollEdge(value: ScrollEdge): PageFooterView;
  /** No bottom safe-area padding (native pads it by default). */
  ignoresSafeArea(value?: boolean): PageFooterView;
  testID(value: string): PageFooterView;
}

/**
 * Bloom `Command`: the command palette, over the app while `presented`. Its
 * rows are `CommandItem`s, ungrouped first, then each `CommandGroup`'s under
 * its title.
 */
export interface CommandView extends ViewNode {
  presented(value: Binding<boolean>): CommandView;
  /** Told `false` when the reader closes it (Escape, the backdrop, a choice). */
  placeholder(value: string): CommandView;
  /** What it says when nothing matches. */
  emptyLabel(value: string): CommandView;
  /** The query, held by the app. */
  query(value: Binding<string>): CommandView;
  /** Which items a query matches; a substring of the label, subtitle or keywords by default. */
  filter(value: (item: BloomCommandItem, query: string) => boolean): CommandView;
  testID(value: string): CommandView;
}
/** A command: its label, and what choosing it does (the palette then closes). */
export interface CommandItemView extends ViewNode {
  /** Its identity; its label by default. */
  id(value: string): CommandItemView;
  icon(value: IconComponent): CommandItemView;
  subtitle(value: string | undefined): CommandItemView;
  /** Words a query also matches, not shown. */
  keywords(...value: string[]): CommandItemView;
  /** Its shortcut, drawn at its end (`⌘K`). */
  shortcut(value: string): CommandItemView;
  disabled(value?: boolean): CommandItemView;
  onPress(value: Press | undefined): CommandItemView;
}
/** Commands under a title. */
export type CommandGroupView = ViewNode;
/**
 * Bloom `SettingsModal`: the settings, over the app while `presented`; its
 * navigation is its `SettingsGroup`s of `SettingsItem`s, each item's
 * `.content` its page.
 */
export interface SettingsModalView extends ViewNode {
  /** Presented: a binding, told `false` when the reader closes it. */
  presented(value: Binding<boolean>): SettingsModalView;
  /** The id of the page shown: a binding, its navigation writing it. */
  selection(value: Binding<string>): SettingsModalView;
  /** Where a narrow screen starts: the `navigation` list (default) or the `page`. */
  initialView(value: SettingsView): SettingsModalView;
  /** Its header: a `bar` (default) or the `floating` capsule. */
  presentation(value: 'bar' | 'floating'): SettingsModalView;
  testID(value: string): SettingsModalView;
}
/** A group of the settings' navigation, under its label. */
export interface SettingsGroupView extends ViewNode {
  id(value: string): SettingsGroupView;
}
/** A row of the settings' navigation: it opens its page (`.content`), or runs its press. */
export interface SettingsItemView extends ViewNode {
  /** Its identity, the page's key; its label by default. */
  id(value: string): SettingsItemView;
  /** Its page's body, built while the page is shown. */
  content(value: () => Child): SettingsItemView;
  /** Its page's title; its label by default. */
  title(value: string): SettingsItemView;
  /** Its page reaches the edges. */
  fullBleed(value?: boolean): SettingsItemView;
  disabled(value?: boolean): SettingsItemView;
  onPress(value: Press | undefined): SettingsItemView;
}

/**
 * Bloom `Toolbar`: a row of tools that scrolls across when it does not fit,
 * its actions kept in reach at its end, an accessory row under it.
 */
export interface ToolbarView extends ViewNode {
  /** Controls kept in reach at its end (Bloom's `actions`). */
  trailing(...value: Child[]): ToolbarView;
  /** A second row under the tools. */
  accessory(value: Child): ToolbarView;
  /** Its controls' size; the nearest Bloom scope's by default. */
  size(value: BloomSize): ToolbarView;
  testID(value: string): ToolbarView;
}
/** Bloom `StickySection`: a section that docks under the header as the page scrolls past it. */
export interface StickySectionView extends ViewNode {
  testID(value: string): StickySectionView;
}

/** What Bloom's `ScrollArea` and `ScrollSurface` both take: the scroll and its bar. */
interface ScrollAreaModifiers<Self> extends ViewModifiers<Self> {
  /**
   * SwiftUI's `safeAreaInset`: `view` pinned at the scroll's `edge`, and the
   * content inset by its measured height (and `spacing`), so it scrolls clear
   * of it: a filter bar over a list, a composer under a chat.
   */
  safeAreaInset(edge: InsetEdge, view: ViewNode, spacing?: SpaceToken): Self;
  /**
   * SwiftUI's `safeAreaBar`: a `safeAreaInset` that is a bar, with Bloom's
   * scroll edge scrim under it, so the content fades as it scrolls beneath.
   */
  safeAreaBar(edge: InsetEdge, view: ViewNode): Self;
  /** Room around the content, inside the scroll (the content container's padding). */
  contentMargins(value: SpaceToken): Self;
  contentMargins(edge: Edge, value: SpaceToken): Self;
  /** The gap between the content's children. */
  spacing(value: SpaceToken): Self;
  /** `horizontal` scrolls across; `vertical` by default. */
  axis(value: Axis): Self;
  /** When its bar shows: as it scrolls (`scroll`, default), on `hover`, `always`, `never`. */
  scrollbar(value: ScrollbarVisibility): Self;
  /** The inline edge a vertical bar sits on (`end` by default); the web's, as the platform draws a native one. */
  scrollbarSide(value: ScrollbarSide): Self;
  /** The bar's thickness: `sm` (default) or `md`. */
  size(value: ScrollbarSize): Self;
  /** A drag `immediately` dismisses the keyboard, or drags it away `interactively`; `never` by default. */
  scrollDismissesKeyboard(value: KeyboardDismiss): Self;
  /** Whether a tap with the keyboard up reaches the content: `handled` by a control, `always`, or `never` (default). */
  keyboardTaps(value: KeyboardTaps): Self;
}

/**
 * Bloom `ScrollArea`: a scroll of its own (not the screen's) with Bloom's
 * scroll bar. Its box modifiers are a view around it, as a `ScrollView`'s are.
 */
export type ScrollAreaView = ScrollAreaModifiers<ScrollAreaView>;

/**
 * Bloom `ScrollSurface`: a `ScrollArea` on a surface, its ends fading into it,
 * with sticky chrome at its top and foot.
 */
export interface ScrollSurfaceView extends ScrollAreaModifiers<ScrollSurfaceView> {
  /** Kept at its top while it fits beside the footer. */
  stickyHeader(value: Child): ScrollSurfaceView;
  /** Kept at its foot; chrome too tall to keep scrolls. */
  stickyFooter(value: Child): ScrollSurfaceView;
  /** The depth of each end's fade (24 by default). */
  fadeHeight(value: SpaceToken): ScrollSurfaceView;
  /** Whether its foot fades too (it does by default). */
  fadeBottom(value?: boolean): ScrollSurfaceView;
  /** The colour its ends fade into: a role or an app's own (the surface's by default). */
  fade(value: InkToken): ScrollSurfaceView;
  /** The fade takes the paint of the nearest material, not the surface's colour. */
  matchSurfacePaint(value?: boolean): ScrollSurfaceView;
  /** The surface it sits on: `primary` (default), `secondary` or `full`. */
  style(value: ScrollSurfaceStyle): ScrollSurfaceView;
}

/**
 * Bloom `AutoHideBar`: a bar over a body that steps aside to a strip while
 * `collapsed`, peeking back under the pointer. The constructor's first view
 * is the bar, the rest its body.
 */
export interface AutoHideBarView extends ViewNode {
  /** What the collapsed strip shows; a string is drawn muted. */
  summary(value: Child | string): AutoHideBarView;
  /** The owner's decision that the bar steps aside (a page scrolled down). */
  collapsed(value?: boolean): AutoHideBarView;
  /** The strip was pressed: the owner clears `collapsed`. */
  onReveal(value: () => void): AutoHideBarView;
  /** Hovering the strip shows the bar over the body for a while (on by default). */
  peek(value?: boolean): AutoHideBarView;
  /** The bar's height (41 by default). */
  barHeight(value: SpaceToken): AutoHideBarView;
  /** The strip's height (20 by default). */
  collapsedHeight(value: SpaceToken): AutoHideBarView;
  /** The band behind the bar: a role or an app's own (the fill of the surface it sits on by default). */
  band(value: InkToken): AutoHideBarView;
  /** How long the pointer rests on the strip before the bar peeks: a duration token (`fast` by default). */
  peekDelay(value: DurationName): AutoHideBarView;
  /** How long after the pointer leaves a peeked bar it collapses again: a duration token (`'250'` by default). */
  unpeekDelay(value: DurationName): AutoHideBarView;
  /** How it collapses: a motion token (Bloom's own ease-out over 150ms by default). */
  hideMotion(value: MotionToken): AutoHideBarView;
  /** How it comes back, revealed or peeked: a motion token (Bloom's own ease-out over 200ms by default). */
  showMotion(value: MotionToken): AutoHideBarView;
  /** Names the strip's button. */
  label(value: string | undefined): AutoHideBarView;
  testID(value: string): AutoHideBarView;
}

/**
 * Bloom `ResizeHandle`: the separator between two panes that a drag or the
 * keyboard resizes. Its constructor takes `onResize`, told the distance along
 * the resize axis from where the drag started.
 */
export interface ResizeHandleView extends ViewNode {
  /** `vertical` (default) resizes widths; `horizontal` heights. */
  axis(value: Axis): ResizeHandleView;
  /** `grip` (default), a panel edge's grip; `pill`, a bar centred on the gap. */
  style(value: ResizeHandleStyle): ResizeHandleView;
  /** The depth of its hit strip, across the separator. */
  thickness(value: SpaceToken): ResizeHandleView;
  onResizeStart(value: () => void): ResizeHandleView;
  onResizeEnd(value: () => void): ResizeHandleView;
  /** A keyboard nudge (on the web, the arrow keys move it by 16). */
  onNudge(value: (distance: number) => void): ResizeHandleView;
  /** Names the separator. */
  label(value: string | undefined): ResizeHandleView;
  testID(value: string): ResizeHandleView;
}

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
  /** The shell's semantic layout: `workspace`, `collection-detail`, `feed`, `deck`, `catalog` or `map-browser`. */
  shellLayout(value: ShellLayout): AppLayoutView;
  /** How the shell frames its content: `continuous`, `framed` or `floating`. */
  shellPresentation(value: ShellPresentation): AppLayoutView;
  /** The shell's panels, in order; a `Panel` without content holds the navigator. */
  panels(...value: PanelView[]): AppLayoutView;
  /** The app's destinations (Bloom's `TabPagerProvider`): the pager's pages, the bar's tabs, the sidebar's rows. */
  destinations(...value: DestinationView[]): AppLayoutView;
  /** Pressing the destination in front again, by its name (Bloom's scroll to the top, then reload, by default). */
  onReselect(value: ((name: string) => void) | undefined): AppLayoutView;
}
/** A panel of the app's shell: the navigator, or a view beside it (a detail, an inspector). */
export interface PanelView extends ViewNode {
  /** What the panel is: `main`, `collection`, `detail`, `inspector`, `context` or `canvas` (each with Bloom's widths). */
  panelRole(value: PanelRole): PanelView;
  /** Its name; an inspector's must have one. */
  label(value: string | undefined): PanelView;
  width(value: SpaceToken): PanelView;
  minWidth(value: SpaceToken): PanelView;
  maxWidth(value: SpaceToken): PanelView;
  /** The reader can drag its edge. */
  resizable(value?: boolean): PanelView;
  /** Not shown (Bloom's `visible={false}`). */
  hidden(value?: boolean): PanelView;
  /** Kept mounted while hidden. */
  keepMounted(value?: boolean): PanelView;
  /** An inspector's open state: a column from `lg`, a sheet from the end below it. */
  presented(value: Binding<boolean>): PanelView;
  testID(value: string): PanelView;
}
/** A destination of the app: a route the pager, the bar and the sidebar know by its name. */
export interface DestinationView extends ViewNode {
  label(value: string | undefined): DestinationView;
  icon(value: IconComponent): DestinationView;
  activeIcon(value: IconComponent): DestinationView;
  badge(value: number | undefined): DestinationView;
  /** A page of the pager, without a tab of the bar. */
  page(value?: boolean): DestinationView;
  /** Mounted before it is first shown. */
  preload(value?: boolean): DestinationView;
  /** A tab of the bottom bar (and so a page of the pager). */
  bar(value?: boolean): DestinationView;
  /** A row of the sidebar (shown when it has a label and an icon, by default). */
  sidebar(value?: boolean): DestinationView;
  /** Its sidebar row goes after this destination's. */
  sidebarAfter(value: string): DestinationView;
  onPress(value: (() => void) | undefined): DestinationView;
  onLongPress(value: (() => void) | undefined): DestinationView;
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
