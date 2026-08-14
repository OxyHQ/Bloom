import React, { useCallback } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';

import { Text } from '../typography';

import type { ThemeColors } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { useInteractionState } from '../hooks/use-interaction-state';
import { borderRadius } from '../styles/tokens';
import { useDialogContext } from './context';
import type { DialogAction, DialogActionColor } from './types';

/**
 * Shared dialog content primitives used by every `<Dialog>` placement on both
 * platforms — the centered panel, the side-sheets, and the `BottomSheet`-backed
 * bottom placement. Keeping them here is the single source of truth for the
 * declarative `title` / `description` / `actions` chrome, so the surfaces never
 * drift in spacing, typography, or action-button behaviour.
 */

/**
 * Renders the dialog's body: optional declarative title + description, any
 * `children`, then the action row. The `titleId`/`descriptionId` are wired by
 * the caller onto the dialog role element for `aria-labelledby` /
 * `aria-describedby`.
 */
export function DialogBody({
  titleId,
  descriptionId,
  title,
  description,
  actions,
  children,
}: {
  titleId: string;
  descriptionId: string;
  title?: string;
  description?: string;
  actions?: DialogAction[];
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <>
      {title ? (
        // Bloom's `Text`, not react-native's: the raw one renders in whatever
        // font the platform picks and takes no theme colour, so every dialog
        // title in the library was the system face while the rest of the surface
        // was Bloom's. The sizes stay explicit — the typography ROLES
        // (`H1`…`H6`, `P`) carry family and weight, not a size ramp.
        <Text
          nativeID={titleId}
          style={{
            fontSize: 22,
            fontWeight: '600',
            paddingBottom: description ? 4 : 16,
            lineHeight: 30,
          }}
        >
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text
          nativeID={descriptionId}
          style={{
            fontSize: 16,
            color: theme.colors.textSecondary,
            paddingBottom: 16,
            lineHeight: 22,
          }}
        >
          {description}
        </Text>
      ) : null}
      {children}
      {actions && actions.length > 0 ? <ActionRow actions={actions} /> : null}
    </>
  );
}

export function ActionRow({ actions }: { actions: DialogAction[] }) {
  return (
    <View style={{ width: '100%', gap: 8, justifyContent: 'flex-end' }}>
      {actions.map((action, idx) => (
        <ActionButton key={`${action.label}-${idx}`} action={action} />
      ))}
    </View>
  );
}

function ActionButton({ action }: { action: DialogAction }) {
  const { close } = useDialogContext();
  const theme = useTheme();
  const color: DialogActionColor = action.color ?? 'default';
  const shouldCloseOnPress = action.shouldCloseOnPress ?? true;

  const { background, foreground } = getActionPalette(color, theme.colors);
  // Component state, not `Pressable`'s function-form `style`: css-interop
  // swallows the function form and every base style with it.
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();

  // `shouldCloseOnPress` (default true) is the ONLY switch, for every colour.
  // `cancel` used to bypass it — on the premise that a cancel button must always
  // dismiss — which made it the one action a caller could not own the dismissal
  // of. That is exactly what a surface needs: the surface stack dismisses
  // through its OWN `dismiss(result)` so the value reaches the `present()`
  // promise, and the entry's `'closing'` status is what runs the exit animation.
  // The default is unchanged, so a caller that says nothing still gets
  // dismiss-on-press.
  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      const onPress = action.onPress;
      if (shouldCloseOnPress) {
        close(onPress ? () => onPress(e) : undefined);
      } else {
        onPress?.(e);
      }
    },
    [action.onPress, close, shouldCloseOnPress],
  );

  return (
    <Pressable
      style={[
        {
          borderRadius: borderRadius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background,
          opacity: action.disabled ? 0.5 : 1,
          paddingVertical: 12,
          paddingHorizontal: 24,
        },
        !action.disabled && pressed && { opacity: 0.7 },
      ]}
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={action.disabled}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      testID={action.testID}
    >
      <Text style={{ fontSize: 16, fontWeight: '500', color: foreground }}>
        {action.label}
      </Text>
    </Pressable>
  );
}

export function getActionPalette(
  color: DialogActionColor,
  colors: ThemeColors,
): { background: string; foreground: string } {
  switch (color) {
    case 'destructive':
      return {
        background: colors.negative,
        foreground: colors.negativeForeground,
      };
    case 'cancel':
      return { background: colors.contrast50, foreground: colors.text };
    case 'default':
      return { background: colors.primary, foreground: colors.primaryForeground };
    /* c8 ignore next 3 -- TS exhaustiveness check guards this branch */
    default: {
      const _exhaustive: never = color;
      return { background: colors.primary, foreground: colors.primaryForeground };
    }
  }
}
