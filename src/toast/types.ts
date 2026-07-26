/**
 * Derived from sonner-native v0.26.4 — src/types.ts
 * (MIT © Gunnar Torfi Steinarsson), absorbed into Bloom's own toast API.
 * See the top-level NOTICE for full attribution.
 */
import type React from 'react';
import type { TextStyle, ViewProps, ViewStyle } from 'react-native';
import type {
  BaseAnimationBuilder,
  EntryExitAnimationFunction,
  ReanimatedKeyframe,
} from 'react-native-reanimated';

export type ToastPosition = 'top-center' | 'bottom-center' | 'center';

export type ToastSwipeDirection = 'left' | 'up';

/**
 * Engine-internal variant. The PUBLIC knob is `ToastOptions['type']`; the single
 * translation between the two lives in `toast-fns.ts`. `undefined` means "no
 * variant" — a plain `toast('Saved')` renders with neutral surface colors.
 */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';

/** Public variant knob. `'default'` maps to an ABSENT `ToastVariant`. */
export type ToastType =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading';

/**
 * Light/dark is owned by `BloomThemeProvider`/`BloomColorScope`, so this is
 * accepted and documented as a no-op rather than dropped from the surface.
 */
export type ToastTheme = 'light' | 'dark' | 'system';

export type AutoWiggle = 'never' | 'toast-change' | 'always';

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastStyles = {
  toastContainer?: ViewStyle;
  toast?: ViewStyle;
  toastContent?: ViewStyle;
  textContainer?: ViewStyle;
  title?: TextStyle;
  description?: TextStyle;
  buttons?: ViewStyle;
  closeButton?: ViewStyle;
  closeButtonIcon?: ViewStyle;
};

export type ToastEntryExitAnimation =
  | EntryExitAnimationFunction
  | BaseAnimationBuilder
  | typeof BaseAnimationBuilder
  | ReanimatedKeyframe
  | 'default';

export type ToastAnimation = {
  enter?: ToastEntryExitAnimation;
  exit?: ToastEntryExitAnimation;
};

export type PromiseStyles = {
  loading?: ToastStyles;
  success?: ToastStyles;
  error?: ToastStyles;
};

/**
 * The store's view of a pending promise toast. Non-generic on purpose: `promise`
 * already resolves to the SUCCESS TITLE because `toast.promise` maps the caller's
 * promise through their `success` formatter at the boundary. That is what lets
 * the store await it without casting an `unknown` result back to the caller's
 * type (upstream keeps `success` here and casts).
 */
export type PromiseOptions = {
  promise: Promise<string>;
  loading: string;
  error: ((error: unknown) => string) | string;
  styles?: PromiseStyles;
};

type StyleProps = {
  unstyled?: boolean;
  style?: ViewStyle;
  styles?: ToastStyles;
  backgroundComponent?: React.ReactNode;
};

export type ToastProps = StyleProps & {
  id: string | number;
  index: number;
  title: string;
  /** Optional so a variant-less toast stays variant-less. See `ToastVariant`. */
  variant?: ToastVariant;
  numberOfToasts: number;
  orderedToastIds: Array<string | number>;
  jsx?: React.ReactNode;
  description?: string;
  invert?: boolean;
  important?: boolean;
  duration?: number;
  position?: ToastPosition;
  animation?: ToastAnimation;
  dismissible?: boolean;
  icon?: React.ReactNode;
  action?: ToastAction | React.ReactNode;
  cancel?: ToastAction | React.ReactNode;
  close?: React.ReactNode;
  closeButton?: boolean;
  richColors?: boolean;
  onDismiss?: (id: string | number) => void;
  onAutoClose?: (id: string | number) => void;
  promiseOptions?: PromiseOptions;
  actionButtonStyle?: ViewStyle;
  actionButtonTextStyle?: TextStyle;
  cancelButtonStyle?: ViewStyle;
  cancelButtonTextStyle?: TextStyle;
  onPress?: () => void;
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
};

export type ToastRef = {
  wiggle: () => void;
};

/** Everything a caller may pass alongside the toast content. */
export type ToastOptions = Omit<
  ToastProps,
  | 'id'
  | 'index'
  | 'title'
  | 'jsx'
  | 'variant'
  | 'numberOfToasts'
  | 'orderedToastIds'
  | 'promiseOptions'
> & {
  id?: string | number;
  type?: ToastType;
};

export type PromiseToastOptions<T> = Omit<ToastOptions, 'type'> & {
  loading: string;
  success: (result: T) => string;
  error: ((error: unknown) => string) | string;
  styles?: PromiseStyles;
};

export interface ToastFn {
  (content: React.ReactNode, options?: ToastOptions): string | number;
  success: (content: React.ReactNode, options?: Omit<ToastOptions, 'type'>) => string | number;
  error: (content: React.ReactNode, options?: Omit<ToastOptions, 'type'>) => string | number;
  warning: (content: React.ReactNode, options?: Omit<ToastOptions, 'type'>) => string | number;
  info: (content: React.ReactNode, options?: Omit<ToastOptions, 'type'>) => string | number;
  loading: (content: React.ReactNode, options?: Omit<ToastOptions, 'type'>) => string | number;
  custom: (jsx: React.ReactElement, options?: Omit<ToastOptions, 'type'>) => string | number;
  promise: <T>(promise: Promise<T>, options: PromiseToastOptions<T>) => string | number;
  dismiss: (id?: string | number) => string | number | undefined;
  wiggle: (id: string | number) => void;
}

export type ToasterProps = Omit<StyleProps, 'style'> & {
  duration?: number;
  /** No-op — light/dark comes from `BloomThemeProvider`. */
  theme?: ToastTheme;
  visibleToasts?: number;
  position?: ToastPosition;
  closeButton?: boolean;
  offset?: number;
  autoWiggleOnUpdate?: AutoWiggle;
  style?: ViewStyle;
  positionerStyle?: ViewStyle;
  /** No-op — use `BloomColorScope` to recolour a subtree. */
  invert?: boolean;
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
  toastOptions?: {
    actionButtonStyle?: ViewStyle;
    actionButtonTextStyle?: TextStyle;
    cancelButtonStyle?: ViewStyle;
    cancelButtonTextStyle?: TextStyle;
    titleStyle?: TextStyle;
    descriptionStyle?: TextStyle;
    style?: ViewStyle;
    unstyled?: boolean;
    toastContainerStyle?: ViewStyle;
    toastContentStyle?: ViewStyle;
    buttonsStyle?: ViewStyle;
    closeButtonStyle?: ViewStyle;
    closeButtonIconStyle?: ViewStyle;
    textContainerStyle?: ViewStyle;
    backgroundComponent?: React.ReactNode;
    success?: ViewStyle;
    error?: ViewStyle;
    warning?: ViewStyle;
    info?: ViewStyle;
    loading?: ViewStyle;
  };
  gap?: number;
  loadingIcon?: React.ReactNode;
  richColors?: boolean;
  icons?: {
    success?: React.ReactNode;
    error?: React.ReactNode;
    warning?: React.ReactNode;
    info?: React.ReactNode;
    loading?: React.ReactNode;
  };
  swipeToDismissDirection?: ToastSwipeDirection;
  pauseWhenPageIsHidden?: boolean;
  enableStacking?: boolean;
  animation?: ToastAnimation;
  ToasterOverlayWrapper?: React.ComponentType<{ children: React.ReactNode }>;
  ToastWrapper?: React.ComponentType<
    ViewProps & {
      children: React.ReactNode;
      toastId: string | number;
    }
  >;
};

export type ToastHostProps = {
  children: React.ReactNode;
  ToasterOverlayWrapper?: React.ComponentType<{ children: React.ReactNode }>;
};

/** The subset of `ToasterProps` the store needs to resolve a new toast. */
export type ToastStoreConfig = {
  autoWiggleOnUpdate?: AutoWiggle;
  visibleToasts?: number;
  duration?: number;
  pauseWhenPageIsHidden?: boolean;
};

export type ToastStoreState = {
  toasts: ToastProps[];
  toastsById: Map<string | number, ToastProps>;
  toastsCounter: number;
  toastRefs: Record<string | number, React.RefObject<ToastRef | null>>;
  shouldShowOverlay: boolean;
  /**
   * INVARIANT: replaced, never mutated in place. Row offsets are recomputed in
   * React from this object, so an in-place write would not re-render. Pinned by
   * `toast-store.test.ts`.
   */
  toastHeights: Record<string | number, number>;
  isExpanded: boolean;
};

export type StableToastContextType = Required<
  Pick<
    ToasterProps,
    | 'duration'
    | 'swipeToDismissDirection'
    | 'closeButton'
    | 'position'
    | 'invert'
    | 'icons'
    | 'offset'
    | 'pauseWhenPageIsHidden'
    | 'gap'
    | 'theme'
    | 'toastOptions'
    | 'autoWiggleOnUpdate'
    | 'richColors'
    | 'unstyled'
    | 'enableStacking'
    | 'visibleToasts'
    | 'allowFontScaling'
  >
> & {
  animation: ToastAnimation;
  maxFontSizeMultiplier?: number;
};

export type DynamicToastContextType = {
  toastHeights: Record<string | number, number>;
  isExpanded: boolean;
  expand: () => void;
  collapse: () => void;
  toggleExpand: () => void;
};

export function isToastAction(
  action: ToastAction | React.ReactNode,
): action is ToastAction {
  if (typeof action !== 'object' || action === null) {
    return false;
  }
  return (
    'label' in action &&
    'onClick' in action &&
    typeof action.label === 'string' &&
    typeof action.onClick === 'function'
  );
}
