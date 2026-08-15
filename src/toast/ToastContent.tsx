/**
 * Derived from sonner-native v0.26.4 — src/toast.tsx:440-689
 * (MIT © Gunnar Torfi Steinarsson), restyled with
 * Bloom's design tokens and absorbing the surface/text/action styling from
 * Bloom's previous `Toast.tsx`.
 *
 * This is the DEFAULT renderer. A consumer who passes `jsx` (via `toast.custom`)
 * owns the whole row and this file is not involved.
 *
 * W11 — the surface elevation comes from `bloomShadowStyle('s')`, which is a
 * `boxShadow` on web and RN `shadow*`/`elevation` on native. Upstream hardcodes
 * iOS-only `shadowOpacity`/`shadowRadius` values, so its toast has no shadow on
 * web (no `boxShadow`) and none on iOS either (no `shadowColor`).
 */
import * as React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { useInteractionState } from '../hooks/use-interaction-state';
import { TimesLarge_Stroke2_Corner0_Rounded as TimesIcon } from '../icons/Times';
import { borderRadius, fontSize, space } from '../styles/tokens';
import { ToastIcon } from './ToastIcon';
import { useToastColors, type ToastActionColors } from './use-toast-colors';
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

  const surfaceStyle: ViewStyle | undefined = unstyled
    ? undefined
    : {
        backgroundColor: colors.surface,
        borderColor: colors.border,
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
          // With a description the row is tall, so the icon sits at the top
          // instead of being centred against two lines of text.
          unstyled || !description ? undefined : styles.rowWithDescription,
          backgroundComponent ? styles.aboveBackground : undefined,
          styleOverrides?.toastContent,
        ]}
      >
        <ToastLeadingIcon
          variant={variant}
          icon={icon}
          icons={icons}
          isLoading={isLoading}
          color={colors.icon}
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
              {isToastAction(action) ? (
                <ToastActionButton
                  action={action}
                  colors={colors.action}
                  buttonStyle={actionButtonStyle}
                  textStyle={actionButtonTextStyle}
                  {...textProps}
                />
              ) : (
                action
              )}
              {isToastAction(cancel) ? (
                <ToastActionButton
                  action={{
                    label: cancel.label,
                    onClick: () => {
                      cancel.onClick();
                      onDismiss(id);
                    },
                  }}
                  colors={colors.action}
                  transparent
                  buttonStyle={cancelButtonStyle}
                  textStyle={[{ color: colors.cancelText }, cancelButtonTextStyle]}
                  {...textProps}
                />
              ) : (
                cancel
              )}
            </View>
          ) : null}
        </View>

        <ToastCloseButton
          id={id}
          close={close}
          closeButton={closeButton}
          dismissible={dismissible}
          color={colors.closeButton}
          onDismiss={onDismiss}
          buttonStyle={styleOverrides?.closeButton}
          iconStyle={styleOverrides?.closeButtonIcon}
        />
      </View>
    </View>
  );
}

ToastContent.displayName = 'ToastContent';

function ToastLeadingIcon({
  variant,
  icon,
  icons,
  isLoading,
  color,
}: {
  variant: ToastProps['variant'];
  icon: ToastProps['icon'];
  icons: ToastIcons;
  isLoading: boolean;
  color: string;
}) {
  if (isLoading) {
    return <>{icons.loading ?? <ToastIcon variant="loading" color={color} />}</>;
  }
  if (icon) {
    return <>{icon}</>;
  }
  if (variant && icons[variant]) {
    return <>{icons[variant]}</>;
  }
  return <ToastIcon variant={variant} color={color} />;
}

function ToastActionButton({
  action,
  colors,
  transparent,
  buttonStyle,
  textStyle,
  allowFontScaling,
  maxFontSizeMultiplier,
}: {
  action: ToastAction;
  colors: ToastActionColors;
  transparent?: boolean;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle | Array<TextStyle | undefined>;
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
}) {
  // Driven from state rather than Pressable's function-form `style`, which
  // react-native-css swallows on web (dropping the base padding/radius).
  const { state: pressed, onIn, onOut } = useInteractionState();

  return (
    <Pressable
      onPress={action.onClick}
      onPressIn={onIn}
      onPressOut={onOut}
      accessibilityRole="button"
      style={[
        styles.actionButton,
        transparent
          ? undefined
          : {
              backgroundColor: pressed
                ? colors.pressedBackground
                : colors.background,
            },
        buttonStyle,
      ]}
    >
      <Text
        numberOfLines={1}
        allowFontScaling={allowFontScaling}
        maxFontSizeMultiplier={maxFontSizeMultiplier}
        style={[
          styles.actionButtonText,
          { color: pressed ? colors.pressedText : colors.text },
          textStyle,
        ]}
      >
        {action.label}
      </Text>
    </Pressable>
  );
}

function ToastCloseButton({
  id,
  close,
  closeButton,
  dismissible,
  color,
  onDismiss,
  buttonStyle,
  iconStyle,
}: {
  id: string | number;
  close: ToastProps['close'];
  closeButton: ToastProps['closeButton'];
  dismissible: boolean | undefined;
  color: string;
  onDismiss: (id: string | number) => void;
  buttonStyle?: ViewStyle;
  iconStyle?: ViewStyle;
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
    <Pressable
      onPress={handlePress}
      hitSlop={CLOSE_BUTTON_HIT_SLOP}
      accessibilityRole="button"
      style={buttonStyle}
    >
      <TimesIcon size="md" fill={color} style={iconStyle} />
    </Pressable>
  );
}

const CLOSE_BUTTON_HIT_SLOP = 10;

const styles = StyleSheet.create({
  surface: {
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    marginHorizontal: space.lg,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    ...bloomShadowStyle('s'),
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
    alignItems: 'center',
    gap: space.md,
  },
  rowWithDescription: {
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '600',
    lineHeight: 20,
  },
  description: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginTop: space._2xs,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
  },
  actionButton: {
    flexGrow: 0,
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: borderRadius.sm,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    lineHeight: 20,
  },
});
