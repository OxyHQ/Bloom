import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../button';
import { TextFieldInput } from '../text-field';
import { useTheme } from '../theme/use-theme';
import { present } from './surfaceStore';
import type {
  SurfaceConfirmOptions,
  SurfaceControls,
  SurfacePromptOptions,
} from './types';

/**
 * Built-in `confirm` / `prompt` surfaces.
 *
 * They are implemented AS surfaces — each calls `present(...)` so it STACKS
 * correctly above any open surface with the right layer/z (unlike Bloom's
 * one-at-a-time `alert()` FIFO queue, which cannot layer over another surface).
 * Their buttons resolve through the surface's own `dismiss(result)` (NOT the
 * underlying `Dialog`'s close), so the value flows back through the `present()`
 * promise.
 */

const TITLE_STYLE = { fontSize: 22, fontWeight: '600' as const, lineHeight: 30 };
const MESSAGE_STYLE = { fontSize: 16, lineHeight: 22 };

function ConfirmSurface({
  options,
  surface,
}: {
  options: SurfaceConfirmOptions;
  surface: SurfaceControls;
}) {
  const theme = useTheme();
  const onConfirm = useCallback(() => surface.dismiss(true), [surface]);
  const onCancel = useCallback(() => surface.dismiss(false), [surface]);

  return (
    <View>
      <Text
        style={[
          TITLE_STYLE,
          {
            color: theme.colors.text,
            paddingBottom: options.message ? 4 : 16,
          },
        ]}
      >
        {options.title}
      </Text>
      {options.message ? (
        <Text
          style={[
            MESSAGE_STYLE,
            { color: theme.colors.textSecondary, paddingBottom: 16 },
          ]}
        >
          {options.message}
        </Text>
      ) : null}
      <View style={{ gap: 8 }}>
        <Button
          variant={options.destructive ? 'destructive' : 'primary'}
          onPress={onConfirm}
          testID="bloom-surface-confirm-confirm"
        >
          {options.confirmLabel ?? 'Confirm'}
        </Button>
        {options.hideCancel ? null : (
          <Button
            variant="secondary"
            onPress={onCancel}
            testID="bloom-surface-confirm-cancel"
          >
            {options.cancelLabel ?? 'Cancel'}
          </Button>
        )}
      </View>
    </View>
  );
}

function PromptSurface({
  options,
  surface,
}: {
  options: SurfacePromptOptions;
  surface: SurfaceControls;
}) {
  const theme = useTheme();
  const [value, setValue] = useState(options.defaultValue ?? '');
  const onSubmit = useCallback(() => surface.dismiss(value), [surface, value]);
  const onCancel = useCallback(() => surface.dismiss(null), [surface]);

  return (
    <View>
      <Text
        style={[
          TITLE_STYLE,
          {
            color: theme.colors.text,
            paddingBottom: options.message ? 4 : 16,
          },
        ]}
      >
        {options.title}
      </Text>
      {options.message ? (
        <Text
          style={[
            MESSAGE_STYLE,
            { color: theme.colors.textSecondary, paddingBottom: 16 },
          ]}
        >
          {options.message}
        </Text>
      ) : null}
      <TextFieldInput
        label={options.inputLabel ?? options.title}
        placeholder={options.placeholder}
        value={value}
        onChangeText={setValue}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        testID="bloom-surface-prompt-input"
      />
      <View style={{ gap: 8, paddingTop: 16 }}>
        <Button
          variant="primary"
          onPress={onSubmit}
          testID="bloom-surface-prompt-confirm"
        >
          {options.confirmLabel ?? 'OK'}
        </Button>
        <Button
          variant="secondary"
          onPress={onCancel}
          testID="bloom-surface-prompt-cancel"
        >
          {options.cancelLabel ?? 'Cancel'}
        </Button>
      </View>
    </View>
  );
}

/**
 * Present a confirm surface stacked on top of anything currently open. Resolves
 * `true` on confirm, `false` on cancel OR on backdrop/Escape/back dismissal.
 */
export function confirm(options: SurfaceConfirmOptions): Promise<boolean> {
  return present<unknown>(
    (surface) => <ConfirmSurface options={options} surface={surface} />,
    {
      placement: options.placement ?? 'center',
      dismissOnBackdrop: options.dismissible ?? true,
      label: options.title,
    },
  ).then((result) => result === true);
}

/**
 * Present a prompt surface stacked on top of anything currently open. Resolves
 * the entered string on submit, or `null` on cancel OR backdrop/Escape/back
 * dismissal.
 */
export function prompt(options: SurfacePromptOptions): Promise<string | null> {
  return present<unknown>(
    (surface) => <PromptSurface options={options} surface={surface} />,
    {
      placement: options.placement ?? 'center',
      dismissOnBackdrop: options.dismissible ?? true,
      label: options.title,
    },
  ).then((result) => (typeof result === 'string' ? result : null));
}
