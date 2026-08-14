// WHAT BELONGS ON THIS BARREL — the rule, so the gaps stop being folklore.
//
// A family is HERE unless one of two things is true:
//
//  1. Importing it would add a package to this barrel's module graph. Metro
//     does not tree-shake, so `import { Button } from '@oxyhq/bloom'` links
//     everything this file can reach — and an unmet REQUIRED peer is a build
//     failure, not a degradation. Measured today exactly three families fail
//     this, and each is reachable only through its own subpath:
//       · `./tab-bar` — statically imports `expo-glass-effect` + `expo-symbols`
//         from its `.native` files. Both ship Apple-only native modules, and the
//         "a consumer that never imports @oxyhq/bloom/tab-bar never reaches
//         them" rule in AGENTS.md is true only while this stays off the barrel.
//       · `./provider` — statically imports `expo-router` (via
//         `scroll/expo-router`). `BloomProvider` is expo-router-only BY
//         CONSTRUCTION; a Vite/SPA consumer composes `BloomThemeProvider` +
//         `ScrollRestorationProvider` itself. `theme/adaptive-colors.ts` also
//         names expo-router, but through the optional-`require` boundary, which
//         links nothing.
//       · `./zoomable-image-gallery` — statically imports `expo-image`.
//     Gate: `src/__tests__/root-barrel-graph.test.ts`.
//
//  2. Its exports are generic, collision-prone names. Those come in as a
//     NAMESPACE (the same rule that makes `Icons`/`Skeleton`/`Grid` namespaces),
//     never as loose top-level verbs.
//
// Everything else is here, including the pure-JS families that were absent for
// no recorded reason (`image-resolver`, `image-aspect-ratio-cache`, `scroll`,
// `overlay`, `content-panel`, `list`, `progressive-blur`, `connection-status`).

// Theme
export * from './theme';

// Styles & Utilities
export { atoms, flatten, Z_INDEX } from './styles';
export type { ViewStyleProp, TextStyleProp } from './styles';
export * as tokens from './styles/tokens';
export { web, native, ios, android, platform, select } from './styles/platform';

// Design tokens (Oxy Unified Design Language) — semantic Tailwind/NativeWind
// vocabulary. The Tailwind preset is consumed from `@oxyhq/bloom/tailwind-preset`
// in a config file; these named exports cover programmatic/runtime use.
export {
  bloomTailwindPreset,
  bloomThemeCss,
  bloomThemeBlock,
  FILL_ROLES,
  TEXT_ROLES,
  BORDER_ROLES,
  SPACING,
  RADIUS,
  BORDER_WIDTH,
  TYPOGRAPHY,
  FONT_FAMILY_VARS,
  SHADOW_BOX,
  bloomShadowStyle,
} from './design-tokens';
export type {
  TailwindPreset,
  TailwindPresetThemeExtend,
  FillRole,
  TextRole,
  BorderRole,
  TypeRole,
  TypeRoleName,
  ShadowRole,
} from './design-tokens';

// Hooks — through the family's own barrel, not eight deep paths into it.
// Reaching THROUGH a family is how `@oxyhq/bloom` and `@oxyhq/bloom/hooks`
// came to disagree about what the hooks family is: `useInteractionStates`,
// `usePressAnimation` and `mergeRefs` were on the subpath and not here, for no
// reason anyone had decided.
export * from './hooks';

// Icons
export * as Icons from './icons';
export { type Props as IconProps, sizes as iconSizes, useCommonSVGProps } from './icons/shared';

// App-wide plumbing (pure JS — no peer beyond what this barrel already links)
export { ImageResolverProvider, useImageResolver } from './image-resolver';
export type { ImageResolver } from './image-resolver';
// A namespace, not seven loose verbs: `getAspectRatio`/`setAspectRatio`/
// `hasAspectRatio` are exactly the collision-prone shape the namespace rule
// covers.
export * as ImageAspectRatio from './image-aspect-ratio-cache';
export { ScrollRestorationProvider, useScrollRestoration } from './scroll';
export type {
  ScreenFocusEffect,
  ScrollableHandle,
  ScrollRestorationBinding,
  ScrollRestorationProviderProps,
  ScrollRestorationTarget,
  ScrollRouterAdapter,
  UseScrollRestorationOptions,
} from './scroll';
export { ConnectionStatusToasts } from './connection-status';
export type { ConnectionStatusToastsProps } from './connection-status';

// Core components
export * from './portal';
// Overlay plumbing — the ONE way a portaled surface takes its place in the
// stack (`src/overlay/stack.ts`) and draws its press-to-dismiss dim.
export {
  OverlayRoot,
  Backdrop,
  useOverlayLayer,
  useOverlayLayerContext,
  layerForRank,
  BACKDROP_BLUR_INTENSITY,
  BACKDROP_DIM_OPACITY,
  OVERLAY_STACK_BAND,
  OVERLAY_STACK_BASE,
  OVERLAY_STACK_MAX_RANK,
  TOAST_LAYER_Z,
} from './overlay';
export type { OverlayRootProps, BackdropProps, OverlayLayer } from './overlay';
export {
  Dialog,
  useDialogContext,
  useDialogControl,
  useDialogHeader,
} from './dialog';
export type {
  DialogAction,
  DialogActionColor,
  DialogContextProps,
  DialogControlProps,
  DialogHeaderConfig,
  DialogInset,
  DialogPlacement,
  DialogProps,
  ResponsiveDialogPlacement,
} from './dialog';
// Surface stack — the ONE coordinated overlay system, and the ONE imperative
// overlay API. `alert()` and `confirm()` present into it (they used to be two
// separate FIFO queues with hosts of their own); `prompt` and the rest of the
// stack controls are named exports of `@oxyhq/bloom/surfaces`.
export { surfaces, alert, confirm, SurfaceProvider, SurfaceHost, useSurface } from './surfaces';
export type {
  SurfacePresentation,
  PresentOptions,
  SurfaceControls,
  SurfaceRenderFn,
  SurfaceStatus,
  SurfaceEntry,
  AlertButton,
  AlertButtonStyle,
  SurfaceConfirmOptions,
  SurfacePromptOptions,
} from './surfaces';
export * from './button';
export { Fab } from './fab';
export type { FabProps, FabVariant, FabSize, FabPlacement } from './fab';
export { FrostedIconButton } from './frosted-icon-button';
export type { FrostedIconButtonProps, FrostedIconButtonSize } from './frosted-icon-button';
export * from './divider';
export * from './radio-indicator';
export { ErrorBoundary } from './error-boundary';
export type {
  ErrorBoundaryProps,
  ErrorBoundaryFallback,
  ErrorBoundaryFallbackContext,
} from './error-boundary';
export * from './avatar';
export { AvatarGroup } from './avatar-group';
export type { AvatarGroupProps, AvatarGroupItem } from './avatar-group';
export { UserHoverCard } from './user-hover-card';
export type { UserHoverCardProps, UserHoverCardStat } from './user-hover-card';
export * from './loading';
export * from './prompt-input';
export * from './switch';
// `ToastOutlet` is a required app-root mount, like `SurfaceHost`. The full
// engine surface lives at `@oxyhq/bloom/toast`.
export { toast, ToastOutlet } from './toast';
export type { ToastFn, ToastOptions, ToastType } from './toast';

// Typography
export * as Typography from './typography';

// Layout primitives
export * as Skeleton from './skeleton';
export * as Grid from './grid';
export { Fill } from './fill';
export { MediaInsetBorder } from './media-inset-border';
export type { MediaInsetBorderProps } from './media-inset-border';
export { IconCircle } from './icon-circle';
export { ConnectionDots } from './connection-dots';
export type { ConnectionDotsProps } from './connection-dots';
export { BenefitRow, BenefitList } from './benefit-list';
export type { BenefitRowProps, BenefitListProps } from './benefit-list';
export {
  ContentPanel,
  GUTTER_MASK_SPREAD,
  PANEL_TOP_INSET,
  PANEL_BOTTOM_INSET,
} from './content-panel';
export type { ContentPanelProps, ContentPanelFramedBreakpoint } from './content-panel';
export { ProgressiveBlur } from './progressive-blur';
export type { ProgressiveBlurProps } from './progressive-blur';
export { VirtualList } from './list';
export type {
  VirtualListHandle,
  VirtualListProps,
  VirtualListRenderItem,
  VirtualListRenderItemInfo,
  VirtualListSlot,
} from './list';

// Interaction primitives
export { PressableScale } from './pressable-scale';
export type { PressableScaleProps } from './pressable-scale';
export { SubtleHover } from './subtle-hover';
export type { SubtleHoverProps } from './subtle-hover';

// Motion presets (Reanimated enter/exit + directional screen transition)
export { ScaleAndFadeIn, ScaleAndFadeOut, ShrinkAndPop, ScreenTransition } from './motion';
export type { ScreenTransitionProps, ScreenTransitionDirection } from './motion';
export { AnimatedCheck } from './animated-check';
export type { AnimatedCheckProps, AnimatedCheckRef } from './animated-check';

// Form components
export * from './text-field';
export * from './segmented-control';
export { Search } from './search';
export { Label } from './label';
export type { LabelProps } from './label';
export { Field } from './field';
export type { FieldProps } from './field';
export { InputGroup, InputGroupAddon } from './input-group';
export type { InputGroupProps, InputGroupAddonProps } from './input-group';
export { Slider } from './slider';
export type { SliderProps } from './slider';
export { Combobox } from './combobox';
export type { ComboboxProps, ComboboxOption } from './combobox';

// Bottom sheet
export { BottomSheet } from './bottom-sheet';
export type { BottomSheetRef, BottomSheetProps } from './bottom-sheet';

// Data display
export * from './card';
export * from './badge';
export * from './chip';
export * from './tabs';
export * from './checkbox';
export * from './radio';
export * from './accordion';
export { LinkPreviewCard } from './link-preview';
export type { LinkPreviewCardProps } from './link-preview';

// Stat / profile widgets
export { CompositionBar } from './composition-bar';
export type { CompositionBarProps, CompositionCategory } from './composition-bar';
export { DotGridMeter } from './dot-grid-meter';
export type { DotGridMeterProps } from './dot-grid-meter';
export { StatBar } from './stat-bar';
export type {
  StatBarProps,
  StatBarProgressProps,
  StatBarSplitProps,
  StatBarVariant,
} from './stat-bar';
export { ActivityHeatmap, bucketByDay } from './activity-heatmap';
export type { ActivityHeatmapProps, ActivityHeatmapDay } from './activity-heatmap';
export { ProfileCard } from './profile-card';
export type {
  ProfileCardProps,
  ProfileCardLayout,
  ProfileCardVariant,
  ProfileCardAvatar,
  ProfileCardMetric,
  ProfileCardFooter,
} from './profile-card';

// Settings / Grouped list
export * from './settings-list';
export { Item } from './item';
export type { ItemProps } from './item';
export { Kbd } from './kbd';
export type { KbdProps } from './kbd';

// Overlay components
export * from './admonition';
export * from './menu';
export * from './tooltip';
export * from './select';
export * from './context-menu';
export * from './popover';
export { AlertDialog } from './alert-dialog';
export type { AlertDialogProps, AlertDialogActionStyle } from './alert-dialog';
export { Command } from './command';
export type { CommandProps, CommandItem } from './command';

// Code (mono)
export * as Code from './code';

// Fonts
export * as Fonts from './fonts';
