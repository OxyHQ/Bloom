// Theme
export * from './theme';

// Styles & Utilities
export { atoms, flatten, Z_INDEX, zIndex } from './styles';
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

// Hooks
export { useInteractionState } from './hooks/useInteractionState';
export { useDelayedLoading } from './hooks/useDelayedLoading';
export { useThrottledValue } from './hooks/useThrottledValue';
export { useHaptics, BloomHapticsProvider } from './hooks/useHaptics';
export type { HapticStrength, BloomHapticsProviderProps } from './hooks/useHaptics';
export { useGutters } from './hooks/useGutters';
export type { Gutter, Gutters } from './hooks/useGutters';
export { useImagePreload, preloadImage } from './hooks/useImagePreload';

// Icons
export * as Icons from './icons';
export { type Props as IconProps, sizes as iconSizes, useCommonSVGProps } from './icons/common';

// Core components
export * from './portal';
export {
  Dialog,
  DIALOG_SHEET_BACKDROP_TESTID,
  BloomDialogProvider,
  alert,
  useDialogContext,
  useDialogControl,
} from './dialog';
export type {
  AlertButton,
  AlertButtonStyle,
  DialogAction,
  DialogActionColor,
  DialogContextProps,
  DialogControlProps,
  DialogInset,
  DialogPlacement,
  DialogProps,
  ResponsiveDialogPlacement,
} from './dialog';
export * from './button';
export { Fab } from './fab';
export type { FabProps, FabVariant, FabSize, FabPlacement } from './fab';
export * from './grouped-buttons';
export * from './divider';
export * from './radio-indicator';
export * from './collapsible';
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
export { toast, type Toast } from './toast';

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

// Interaction primitives
export { PressableScale } from './pressable-scale';
export type { PressableScaleProps } from './pressable-scale';
export { PressableWithHover } from './pressable-with-hover';
export type { PressableWithHoverProps } from './pressable-with-hover';
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
export { SearchInput } from './search-input';
export { Label } from './label';
export type { LabelProps } from './label';
export { Field } from './field';
export type { FieldProps } from './field';
export { InputGroup } from './input-group';
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
export { AlertDialog, AlertDialogHost, confirm } from './alert-dialog';
export type {
  AlertDialogProps,
  AlertDialogActionStyle,
  ConfirmOptions,
} from './alert-dialog';
export { Command } from './command';
export type { CommandProps, CommandItem } from './command';

// Code (mono)
export * as Code from './code';

// Fonts
export * as Fonts from './fonts';
