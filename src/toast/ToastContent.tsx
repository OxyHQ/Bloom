/**
 * Derived from sonner-native v0.26.4 — src/toast.tsx:440-689
 * (MIT © Gunnar Torfi Steinarsson), restyled with
 * Bloom's design tokens and absorbing the surface/text/action styling from
 * Bloom's previous `Toast.tsx`.
 *
 * This is the DEFAULT renderer. A consumer who passes `jsx` (via `toast.custom`)
 * owns the whole row and this file is not involved.
 *
 THE LOOK is a notification card: radius 16,
 * 1px border/button/default, card surface, `shadow-dropdown`, padding 16, a 40px
 * tinted status disc with a 20px Remix glyph, body-medium title, body-regular
 * description, small `Button`s for the actions and an xs CloseButton at
 * top 12 / right 12. Toast-only adaptations:
 *
 * - Title-only messages use 12px vertical padding and a 28px disc.
 * - The right padding is a 44px close-button lane ONLY when a close
 *   button renders. `closeButton` defaults to false for toasts, and a one-line
 *   `toast('Saved')` with a permanently empty 28px lane reads as misaligned.
 * - No countdown bar. The engine pauses and resumes a row's timer (hover, app
 *   background, stack expansion); a bar that kept shrinking through a pause
 *   would state a lifetime the row does not have.
 *
 * W11 — the elevation is a `boxShadow` string, which react-native-web emits as
 * CSS and React Native (0.76+) draws natively. Upstream hardcodes iOS-only
 * `shadowOpacity`/`shadowRadius` values, so its toast has no shadow on web.
 */
import * as React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Button, CloseButton } from '../button';
import { NOTIFICATION_GEOMETRY as G } from '../notification/shared';
import { space } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { TYPE_SCALE } from '../typography/scale';
import { ToastIcon } from './ToastIcon';
import { useToastColors, type ToastColors } from './use-toast-colors';
import {
  isToastAction,
  type ToastAction,
  type ToasterProps,
  type ToastProps,
} from './types';

export type ToastContentProps = Pick<
  ToastProps,
  | 'id'
  | 'title'
  | 'description'
  | 'variant'
  | 'icon'
  | 'action'
  | 'cancel'
  | 'close'
  | 'closeButton'
  | 'dismissible'
  | 'richColors'
  | 'promiseOptions'
  | 'styles'
  | 'style'
  | 'actionButtonStyle'
  | 'actionButtonTextStyle'
  | 'cancelButtonStyle'
  | 'cancelButtonTextStyle'
  | 'allowFontScaling'
  | 'maxFontSizeMultiplier'
  | 'backgroundComponent'
> & {
  unstyled: boolean;
  onDismiss: (id: string | number) => void;
  /** Variant icon overrides from the outlet (`icons={{ success: … }}`). */
  icons: ToastIcons;
};

type ToastIcons = NonNullable<ToasterProps['icons']>;


const SANS: TextStyle =
  Platform.OS === 'web' ? { fontFamily: 'var(--bloom-font-sans)' } : { fontFamily: 'Inter' };

export function ToastContent({
  id,
  title,
  description,
  variant,
  icon,
  icons,
  action,
  cancel,
  close,
  closeButton,
  dismissible,
  richColors = false,
  promiseOptions,
  styles: styleOverrides,
  style,
  unstyled,
  onDismiss,
  actionButtonStyle,
  actionButtonTextStyle,
  cancelButtonStyle,
  cancelButtonTextStyle,
  allowFontScaling,
  maxFontSizeMultiplier,
  backgroundComponent,
}: ToastContentProps) {
  const colors = useToastColors({ variant, richColors });
  const isLoading = Boolean(promiseOptions) || variant === 'loading';
  // Only the built-in button is absolutely placed; a caller `close` node stays in the row.
  const showsClose = Boolean(dismissible && !close && closeButton);
  const titleOnly = !description && !action && !cancel;
  const visualSize = titleOnly ? 28 : G.visual;
  const hasVisual = Boolean(variant || icon || isLoading);

  const surfaceStyle: WebCssStyle | undefined = unstyled
    ? undefined
    : {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        boxShadow: colors.shadow,
        paddingTop: titleOnly ? 12 : G.padding,
        paddingBottom: titleOnly ? 12 : G.padding,
        paddingRight: showsClose ? G.paddingRight : G.padding,
      };

  const textProps = { allowFontScaling, maxFontSizeMultiplier };

  return (
    <View
      style={[
        unstyled ? undefined : styles.surface,
        surfaceStyle,
        // A custom background needs the surface transparent and clipped so it can
        // paint edge to edge underneath the content.
        backgroundComponent ? styles.hostedBackground : undefined,
        styleOverrides?.toast,
        style,
      ]}
    >
      {backgroundComponent}
      <View
        style={[
          unstyled ? undefined : styles.row,
          // A title on its own centres against its compact disc instead of hugging
          // its top and leaving an empty band where a description would sit.
          !unstyled && titleOnly ? styles.rowCentered : undefined,
          backgroundComponent ? styles.aboveBackground : undefined,
          styleOverrides?.toastContent,
        ]}
      >
        <ToastLeadingVisual
          variant={variant}
          icon={icon}
          icons={icons}
          isLoading={isLoading}
          size={visualSize}
          colors={colors}
          unstyled={unstyled}
        />

        <View style={[styles.textContainer, styleOverrides?.textContainer]}>
          <Text
            {...textProps}
            style={[
              unstyled ? undefined : styles.title,
              unstyled ? undefined : { color: colors.title },
              styleOverrides?.title,
            ]}
          >
            {title}
          </Text>

          {description ? (
            <Text
              {...textProps}
              style={[
                unstyled ? undefined : styles.description,
                unstyled ? undefined : { color: colors.description },
                styleOverrides?.description,
              ]}
            >
              {description}
            </Text>
          ) : null}

          {action || cancel ? (
            <View
              style={[
                unstyled ? undefined : styles.buttons,
                styleOverrides?.buttons,
              ]}
            >
              {/* Order: the secondary (cancel) first, the primary after. */}
              {isToastAction(cancel) ? (
                <ToastActionButton
                  action={{
                    label: cancel.label,
                    onClick: () => {
                      cancel.onClick();
                      onDismiss(id);
                    },
                  }}
                  variant="secondary"
                  buttonStyle={cancelButtonStyle}
                  textStyle={cancelButtonTextStyle}
                />
              ) : (
                cancel
              )}
              {isToastAction(action) ? (
                <ToastActionButton
                  action={action}
                  variant="primary"
                  buttonStyle={actionButtonStyle}
                  textStyle={actionButtonTextStyle}
                />
              ) : (
                action
              )}
            </View>
          ) : null}
        </View>

        <ToastCloseButton
          id={id}
          close={close}
          closeButton={closeButton}
          dismissible={dismissible}
          onDismiss={onDismiss}
          // Title-only: the ✕ centres on the row like the title does.
          buttonStyle={[
            titleOnly ? { top: hasVisual ? (visualSize - CLOSE_XS) / 2 : 0 } : undefined,
            styleOverrides?.closeButton,
          ]}
        />
      </View>
    </View>
  );
}

ToastContent.displayName = 'ToastContent';

/**
 * The leading visual: a content-sized status disc holding the variant glyph (or
 * the spinner). A per-toast `icon` or an outlet `icons` override replaces the
 * GLYPH and keeps the disc. A variant-less toast with no `icon` has no leading
 * visual at all — it must never fall back to `info`.
 */
function ToastLeadingVisual({
  variant,
  icon,
  icons,
  isLoading,
  size,
  colors,
  unstyled,
}: {
  variant: ToastProps['variant'];
  icon: ToastProps['icon'];
  icons: ToastIcons;
  isLoading: boolean;
  size: number;
  colors: ToastColors;
  unstyled: boolean;
}) {
  let glyph: React.ReactNode;
  if (isLoading) {
    glyph = icons.loading ?? <ToastIcon variant="loading" color={colors.icon} />;
  } else if (icon) {
    glyph = icon;
  } else if (variant && icons[variant]) {
    glyph = icons[variant];
  } else {
    glyph = <ToastIcon variant={variant} color={colors.icon} />;
  }
  if (!variant && !icon && !isLoading) {
    return null;
  }
  if (unstyled) {
    return <>{glyph}</>;
  }
  return <View style={[styles.disc, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.iconBackground }]}>{glyph}</View>;
}

function ToastActionButton({
  action,
  variant,
  buttonStyle,
  textStyle,
}: {
  action: ToastAction;
  variant: 'primary' | 'secondary';
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Button size="sm" appearance={variant === 'primary' ? 'solid' : 'subtle'} tone={variant === 'primary' ? 'accent' : 'neutral'} onPress={action.onClick} style={buttonStyle} textStyle={textStyle}>
      {action.label}
    </Button>
  );
}

function ToastCloseButton({
  id,
  close,
  closeButton,
  dismissible,
  onDismiss,
  buttonStyle,
}: {
  id: string | number;
  close: ToastProps['close'];
  closeButton: ToastProps['closeButton'];
  dismissible: boolean | undefined;
  onDismiss: (id: string | number) => void;
  buttonStyle?: StyleProp<ViewStyle>;
}) {
  const handlePress = React.useCallback(() => {
    onDismiss(id);
  }, [onDismiss, id]);

  if (!dismissible) {
    return null;
  }
  if (close) {
    return <>{close}</>;
  }
  if (!closeButton) {
    return null;
  }

  return (
    <CloseButton
      size="xs"
      onPress={handlePress}
      // The NAME. Every other button in a toast is named by the text it
      // renders; this one renders a glyph, so it announced itself as an
      // unlabelled button beside the message it dismisses. The string is fixed
      // rather than a prop because the control means one thing — the same call
      // `DialogHeader` and `SheetShell` make for their own close affordances.
      accessibilityLabel="Close"
      style={[styles.close, buttonStyle]}
    />
  );
}

/** `CloseButton size="xs"`'s box. */
const CLOSE_XS = 20;

const styles = StyleSheet.create({
  surface: {
    justifyContent: 'center',
    paddingLeft: G.padding,
    paddingTop: G.padding,
    paddingBottom: G.padding,
    marginHorizontal: space.lg,
    borderRadius: G.radius,
    borderWidth: 1,
  },
  hostedBackground: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  aboveBackground: {
    position: 'relative',
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: G.gap,
  },
  rowCentered: {
    alignItems: 'center',
  },
  disc: {
    width: G.visual,
    height: G.visual,
    borderRadius: G.visual / 2,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    gap: G.contentGap,
  },
  title: {
    ...SANS,
    ...TYPE_SCALE['body-medium'],
  },
  description: {
    ...SANS,
    ...TYPE_SCALE['body-regular'],
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: G.actionsGap,
    marginTop: G.actionsMarginTop,
  },
  // Relative to the SURFACE: the row sits inside the surface's padding, so the
  // surface is the positioned ancestor `top-3 right-3` refers to.
  close: {
    position: 'absolute',
    top: G.closeInset - G.padding,
    right: G.closeInset - G.paddingRight,
  },
});
