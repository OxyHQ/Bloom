import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  TextInput,
  View,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
  type TextInputKeyPressEventData,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useControllableState } from '../hooks/use-controllable-state';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { TYPE_SCALE } from '../typography';
import { AddMenu } from './AddMenu';
import { AttachmentStrip } from './AttachmentStrip';
import { MicButton, SendButton, StopButton } from './ComposerControls';
import { ModelPickerBase } from './ModelPickerBase';
import { PermissionMenu } from './PermissionMenu';
import {
  CARD_PADDING,
  CARD_RADIUS,
  COMPOSER_PANEL_ADD_MENU,
  COMPOSER_PANEL_PERMISSIONS,
  PROMPT_LINE,
  PROMPT_MAX_HEIGHT,
  resolveComposerPalette,
} from './shared';
import type { ComposerPanelLabels, ComposerPanelProps } from './types';
import { dataHook, IS_WEB, useComposerWebCss } from './web-hooks';

const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);

const DEFAULT_LABELS: Required<ComposerPanelLabels> = {
  message: 'Message',
  add: 'Add attachment',
  addMenu: 'Add to chat',
  permissions: 'Permissions',
  permissionMode: 'Permission mode',
  learnMore: 'Learn more',
  voice: 'Voice input',
  send: 'Send message',
  stop: 'Stop generating',
  remove: 'Remove',
};

/**
 * `AnimatePresence` + `height: 0 ↔ auto` and opacity, 250ms `ease-out`: the
 * strip mounts on arrival, the clip grows to its measured height, and it
 * unmounts once the collapse finishes. Mounted-open does not animate.
 */
function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(open ? 1 : 0);
  const measured = useSharedValue(0);

  useEffect(() => {
    if (open) setMounted(true);
    const target = open ? 1 : 0;
    if (reducedMotion) {
      progress.value = target;
      if (!open) setMounted(false);
      return;
    }
    progress.value = withTiming(target, { duration: 250, easing: EASE_OUT }, (finished) => {
      'worklet';
      if (finished && target === 0) runOnJS(setMounted)(false);
    });
  }, [open, reducedMotion, progress]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      measured.value = event.nativeEvent.layout.height;
    },
    [measured],
  );
  const style = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      height: progress.value >= 1 ? 'auto' : progress.value * measured.value,
    }),
    [progress, measured],
  );

  if (!mounted) return null;
  return (
    <Animated.View style={[{ overflow: 'hidden' }, style]}>
      <View onLayout={onLayout}>{children}</View>
    </Animated.View>
  );
}

/**
 * `ComposerPanel`: the two-row composer. A radius-24 card (p 10, the raw
 * Figma two-layer 2% shadow) carries the prompt on its first row and the
 * controls on its second; the status tab hangs off the card's top edge.
 *
 *   attachments   the tile strip, collapsing with its own 4px foot
 *   body          pt 6, prompt → controls 20
 *   prompt        px 6, body-regular, grows 20px a line up to 200 then scrolls
 *   controls      left: add + permission (8 apart); right: model picker, 16,
 *                 then mic + send (8 apart); `busy` + `onStop` puts the stop
 *                 control where send was, outside `disabled`'s reach
 *
 * Takes its panel implementation from the family's platform binding.
 */
export function ComposerPanelBase({
  value,
  defaultValue = '',
  onValueChange,
  onSubmit,
  onStop,
  busy = false,
  disabled = false,
  placeholder = 'Hi, what do you need today?',
  permissions = COMPOSER_PANEL_PERMISSIONS,
  permission,
  defaultPermission,
  onPermissionChange,
  onLearnMore,
  addMenu = COMPOSER_PANEL_ADD_MENU,
  onAddMenuSelect,
  providers,
  model,
  defaultModel,
  onModelChange,
  effort,
  defaultEffort,
  onEffortChange,
  effortLevels,
  modelPickerLabels,
  listening,
  defaultListening = false,
  onListeningChange,
  attachments,
  onRemoveAttachment,
  status,
  inputRef,
  labels: labelOverrides,
  style,
  testID,
}: ComposerPanelProps) {
  useComposerWebCss();
  const theme = useTheme();
  const palette = useMemo(() => resolveComposerPalette(theme), [theme]);
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelOverrides }), [labelOverrides]);

  const [text, setText] = useControllableState<string>({ value, defaultValue, onChange: onValueChange });
  const [isListening, setListening] = useControllableState<boolean>({
    value: listening,
    defaultValue: defaultListening,
    onChange: onListeningChange,
  });

  const fieldRef = useRef<TextInput | null>(null);
  const setFieldRef = useCallback(
    (node: TextInput | null) => {
      fieldRef.current = node;
      if (inputRef) (inputRef as React.MutableRefObject<TextInput | null>).current = node;
    },
    [inputRef],
  );

  // The prompt grows with its text, one 20px line at a time, up to 200 before it
  // scrolls. Web measures the textarea from zero (so it also shrinks back);
  // native reads the content size.
  const [height, setHeight] = useState(PROMPT_LINE);
  useLayoutEffect(() => {
    if (!IS_WEB) return;
    const node = fieldRef.current as unknown as { style?: { height: string }; scrollHeight?: number } | null;
    if (!node?.style || typeof node.scrollHeight !== 'number') return;
    node.style.height = '0px';
    const next = Math.min(PROMPT_MAX_HEIGHT, Math.max(PROMPT_LINE, node.scrollHeight));
    node.style.height = `${next}px`;
    setHeight(next);
  }, [text]);
  const onContentSizeChange = useCallback(
    (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      if (IS_WEB) return;
      setHeight(Math.min(PROMPT_MAX_HEIGHT, Math.max(PROMPT_LINE, event.nativeEvent.contentSize.height)));
    },
    [],
  );

  const submit = useCallback(() => {
    if (disabled || busy) return;
    onSubmit?.(text);
    if (value === undefined) setText('');
  }, [disabled, busy, onSubmit, text, value, setText]);

  const onKeyPress = useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const native: TextInputKeyPressEventData & { shiftKey?: boolean; isComposing?: boolean } = event.nativeEvent;
      if (!IS_WEB || native.key !== 'Enter' || native.shiftKey || native.isComposing) return;
      event.preventDefault();
      submit();
    },
    [submit],
  );

  const hasAttachments = !!attachments && attachments.length > 0;

  const cardStyle: WebCssStyle = {
    width: '100%',
    flexDirection: 'column',
    borderRadius: CARD_RADIUS,
    backgroundColor: palette.surface,
    padding: CARD_PADDING,
    boxShadow: palette.shadowCard,
    '--bloom-composer-ring': palette.focusRing,
  };

  return (
    <View testID={testID} style={[{ width: '100%', flexDirection: 'column' }, style]}>
      {status ?? null}

      <View style={cardStyle}>
        <Collapse open={hasAttachments}>
          <View style={{ paddingBottom: 4 }}>
            <AttachmentStrip
              attachments={attachments ?? []}
              palette={palette}
              onRemove={onRemoveAttachment}
              removeLabel={labels.remove}
            />
          </View>
        </Collapse>

        <View style={{ flexDirection: 'column', gap: 20, paddingTop: 6 }}>
          <View style={{ paddingLeft: 6, paddingRight: 6 }}>
            <TextInput
              ref={setFieldRef}
              {...dataHook('bloomComposerInput')}
              testID={testID ? `${testID}-input` : undefined}
              accessibilityLabel={labels.message}
              multiline
              value={text}
              onChangeText={setText}
              onKeyPress={onKeyPress}
              onContentSizeChange={onContentSizeChange}
              placeholder={placeholder}
              placeholderTextColor={palette.textTertiary}
              selectionColor={palette.accent500}
              cursorColor={palette.accent500}
              scrollEnabled={height >= PROMPT_MAX_HEIGHT}
              style={{
                width: '100%',
                height,
                maxHeight: PROMPT_MAX_HEIGHT,
                padding: 0,
                margin: 0,
                ...TYPE_SCALE['body-regular'],
                fontFamily: IS_WEB ? 'var(--bloom-font-sans)' : 'Inter',
                color: palette.text,
                backgroundColor: 'transparent',
                textAlignVertical: 'top',
                ...(IS_WEB ? { caretColor: palette.accent500 } : null),
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ minWidth: 0, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {addMenu.length > 0 ? (
                <AddMenu
                  palette={palette}
                  groups={addMenu}
                  onSelect={onAddMenuSelect}
                  labels={labels}
                  testID={testID ? `${testID}-add` : undefined}
                />
              ) : null}
              {permissions.length > 0 ? (
                <PermissionMenu
                  palette={palette}
                  permissions={permissions}
                  value={permission}
                  defaultValue={defaultPermission}
                  onChange={onPermissionChange}
                  onLearnMore={onLearnMore}
                  labels={labels}
                  testID={testID ? `${testID}-permission` : undefined}
                />
              ) : null}
            </View>
            <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {providers && providers.length > 0 ? (
                <ModelPickerBase
                  providers={providers}
                  value={model}
                  defaultValue={defaultModel}
                  onValueChange={onModelChange}
                  effort={effort}
                  defaultEffort={defaultEffort}
                  onEffortChange={onEffortChange}
                  effortLevels={effortLevels}
                  labels={modelPickerLabels}
                  testID={testID ? `${testID}-model` : undefined}
                />
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MicButton
                  listening={isListening}
                  onToggle={() => setListening(!isListening)}
                  label={labels.voice}
                  palette={palette}
                />
                {busy && onStop ? (
                  <StopButton onPress={onStop} label={labels.stop} palette={palette} />
                ) : (
                  <SendButton disabled={disabled} onPress={submit} label={labels.send} palette={palette} />
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
