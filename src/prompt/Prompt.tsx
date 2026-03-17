import React, { createContext, useCallback, useContext, useId, useMemo } from 'react';
import { View, Text, TouchableOpacity, Platform, type GestureResponderEvent } from 'react-native';

import { useTheme } from '../theme/use-theme';
import type { ThemeColors } from '../theme/types';
import * as Dialog from '../dialog';

export {
  type DialogControlProps as PromptControlProps,
  useDialogControl as usePromptControl,
} from '../dialog';

const PromptContext = createContext<{
  titleId: string;
  descriptionId: string;
}>({
  titleId: '',
  descriptionId: '',
});
PromptContext.displayName = 'BloomPromptContext';

export function Outer({
  children,
  control,
  testID,
  onClose,
}: React.PropsWithChildren<{
  control: Dialog.DialogControlProps;
  testID?: string;
  onClose?: () => void;
}>) {
  const titleId = useId();
  const descriptionId = useId();

  const context = useMemo(
    () => ({ titleId, descriptionId }),
    [titleId, descriptionId],
  );

  return (
    <Dialog.Outer
      control={control}
      testID={testID}
      onClose={onClose}
      webOptions={{ alignCenter: true }}
      preventExpansion
    >
      <Dialog.Handle />
      <PromptContext.Provider value={context}>
        <Dialog.ScrollableInner
          label=""
          style={Platform.select({
            web: { maxWidth: 320, borderRadius: 36 },
            default: undefined,
          })}
        >
          {children}
        </Dialog.ScrollableInner>
      </PromptContext.Provider>
    </Dialog.Outer>
  );
}

export function TitleText({ children }: React.PropsWithChildren) {
  const { titleId } = useContext(PromptContext);
  const theme = useTheme();

  return (
    <Text
      nativeID={titleId}
      style={{
        fontSize: 22,
        fontWeight: '600',
        color: theme.colors.text,
        paddingBottom: 4,
        lineHeight: 30,
      }}
    >
      {children}
    </Text>
  );
}

export function DescriptionText({
  children,
  selectable,
}: React.PropsWithChildren<{ selectable?: boolean }>) {
  const { descriptionId } = useContext(PromptContext);
  const theme = useTheme();

  return (
    <Text
      nativeID={descriptionId}
      selectable={selectable}
      style={{
        fontSize: 16,
        color: theme.colors.textSecondary,
        paddingBottom: 16,
        lineHeight: 22,
      }}
    >
      {children}
    </Text>
  );
}

export function Actions({ children }: { children: React.ReactNode }) {
  return <View style={{ width: '100%', gap: 8, justifyContent: 'flex-end' }}>{children}</View>;
}

export function Content({ children }: { children: React.ReactNode }) {
  return <View style={{ paddingBottom: 8 }}>{children}</View>;
}

export type ActionColor = 'primary' | 'primary_subtle' | 'secondary' | 'negative' | 'negative_subtle';

function getActionColors(color: ActionColor, colors: ThemeColors) {
  switch (color) {
    case 'negative':
      return { background: colors.negative, foreground: colors.negativeForeground };
    case 'negative_subtle':
      return { background: colors.negativeSubtle, foreground: colors.negativeSubtleForeground };
    case 'primary_subtle':
      return { background: colors.primarySubtle, foreground: colors.primarySubtleForeground };
    case 'secondary':
      return { background: colors.contrast50, foreground: colors.text };
    case 'primary':
    default:
      return { background: colors.primary, foreground: '#FFFFFF' };
  }
}

export function Cancel({ cta }: { cta?: string }) {
  const { close } = Dialog.useDialogContext();
  const theme = useTheme();
  const { background } = getActionColors('secondary', theme.colors);

  return (
    <TouchableOpacity
      style={{
        borderRadius: 9999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: background,
        paddingVertical: 12,
        paddingHorizontal: 24,
      }}
      onPress={() => close()}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 16, fontWeight: '500', color: theme.colors.text }}>
        {cta ?? 'Cancel'}
      </Text>
    </TouchableOpacity>
  );
}

export function Action({
  onPress,
  color = 'primary',
  cta,
  disabled = false,
  shouldCloseOnPress = true,
  testID,
}: {
  onPress: (e: GestureResponderEvent) => void;
  color?: ActionColor;
  cta?: string;
  disabled?: boolean;
  shouldCloseOnPress?: boolean;
  testID?: string;
}) {
  const { close } = Dialog.useDialogContext();
  const theme = useTheme();

  const handleOnPress = useCallback(
    (e: GestureResponderEvent) => {
      if (shouldCloseOnPress) {
        close(() => onPress(e));
      } else {
        onPress(e);
      }
    },
    [close, onPress, shouldCloseOnPress],
  );

  const { background, foreground } = getActionColors(color, theme.colors);

  return (
    <TouchableOpacity
      style={{
        borderRadius: 9999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: background,
        opacity: disabled ? 0.5 : 1,
        paddingVertical: 12,
        paddingHorizontal: 24,
      }}
      onPress={handleOnPress}
      disabled={disabled}
      activeOpacity={0.7}
      testID={testID}
    >
      <Text style={{ fontSize: 16, fontWeight: '500', color: foreground }}>
        {cta ?? 'Confirm'}
      </Text>
    </TouchableOpacity>
  );
}

export function Basic({
  control,
  title,
  description,
  cancelButtonCta,
  confirmButtonCta,
  onConfirm,
  confirmButtonColor,
  showCancel = true,
}: {
  control: Dialog.DialogOuterProps['control'];
  title: string;
  description?: string;
  cancelButtonCta?: string;
  confirmButtonCta?: string;
  onConfirm: (e: GestureResponderEvent) => void;
  confirmButtonColor?: ActionColor;
  showCancel?: boolean;
}) {
  return (
    <Outer control={control} testID="confirmModal">
      <Content>
        <TitleText>{title}</TitleText>
        {description && <DescriptionText>{description}</DescriptionText>}
      </Content>
      <Actions>
        <Action
          cta={confirmButtonCta}
          onPress={onConfirm}
          color={confirmButtonColor}
          testID="confirmBtn"
        />
        {showCancel && <Cancel cta={cancelButtonCta} />}
      </Actions>
    </Outer>
  );
}
