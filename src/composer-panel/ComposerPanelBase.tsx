import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { SurfaceLevelProvider, surfaceFillVars, useSurfaceFill } from '../styles/surface-levels';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SurfacePaint } from '../surface/SurfacePaint';
import {
  Text as RNText,
  TextInput,
  View,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
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
import { useTextareaAutosize } from '../hooks/use-textarea-autosize';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { TYPE_SCALE } from '../typography';
import { AddMenu } from './AddMenu';
import { AttachmentStrip } from './AttachmentStrip';
import { MicButton, SendButton, StopButton } from './ComposerControls';
import { ModelPickerBase } from './ModelPickerBase';
import { PermissionMenu } from './PermissionMenu';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { COMPOSER_PANEL_MESSAGES } from './messages';
import {
  CARD_PADDING,
  CARD_RADIUS,
  composerAddMenu,
  composerPermissions,
  PROMPT_LINE,
  PROMPT_MAX_HEIGHT,
  resolveComposerPalette,
} from './shared';
import type { ComposerPanelLabels, ComposerPanelProps } from './types';
import { dataHook, IS_WEB, useComposerWebCss } from './web-hooks';

const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);

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
  placeholder: placeholderProp,
  permissions: permissionsProp,
  permission,
  defaultPermission,
  onPermissionChange,
  onLearnMore,
  addMenu: addMenuProp,
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
  onAttachmentRetry,
  status,
  emptyAction,
  onKeyPress: onKeyPressProp,
  inputRef,
  labels: labelOverrides,
  style,
  testID,
}: ComposerPanelProps) {
  useComposerWebCss();
  const theme = useTheme();
  const parentFill = useSurfaceFill();
  const palette = useMemo(() => resolveComposerPalette(theme), [theme]);
  const publishedFill = resolveSurfaceMaterial({
    fill: palette.surface,
    parentFill: parentFill,
  }).publishedFill;
  const { messages } = useMessages(COMPOSER_PANEL_MESSAGES);
  const common = useCommonMessages();
  const labels = useMemo<Required<ComposerPanelLabels>>(
    () => ({
      message: messages.message,
      add: messages.add,
      addMenu: messages.addMenu,
      permissions: messages.permissions,
      permissionMode: messages.permissionMode,
      learnMore: messages.learnMore,
      voice: messages.voice,
      send: messages.send,
      stop: messages.stop,
      remove: common.remove,
      retry: common.retry,
      ...labelOverrides,
    }),
    [messages, common, labelOverrides],
  );
  // A caller's `remove` / `retry` stays a prefix to the file name, as it always
  // was; Bloom's own wording is the language's whole phrase.
  const removeOverride = labelOverrides?.remove;
  const retryOverride = labelOverrides?.retry;
  const removeFileLabel = useMemo(
    () =>
      removeOverride !== undefined
        ? (name: string) => `${removeOverride} ${name}`
        : messages.removeFile,
    [removeOverride, messages],
  );
  const retryFileLabel = useMemo(
    () =>
      retryOverride !== undefined
        ? (name: string) => `${retryOverride} ${name}`
        : messages.retryFile,
    [retryOverride, messages],
  );
  const placeholder = placeholderProp ?? messages.panelPlaceholder;
  const permissions = useMemo(
    () => permissionsProp ?? composerPermissions(messages),
    [permissionsProp, messages],
  );
  const addMenu = useMemo(() => addMenuProp ?? composerAddMenu(messages), [addMenuProp, messages]);

  const [text, setText] = useControllableState<string>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
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
  // scrolls. Web measures the textarea, collapsing it only when the draft may
  // have got shorter (`useTextareaAutosize`). Native lays the same text out in
  // an invisible twin and takes ITS height: the field's own
  // `onContentSizeChange` does not fire for a value set from outside until the
  // field is focused (Android 16), so a question loaded to edit showed one line
  // and a cancelled edit kept four.
  const [height, setHeight] = useState(PROMPT_LINE);
  useTextareaAutosize(fieldRef, text, {
    enabled: IS_WEB,
    height,
    minHeight: PROMPT_LINE,
    onMeasure: (content) => setHeight(Math.min(PROMPT_MAX_HEIGHT, Math.max(PROMPT_LINE, content))),
  });
  const onTwinLayout = useCallback((event: LayoutChangeEvent) => {
    setHeight(Math.min(PROMPT_MAX_HEIGHT, Math.max(PROMPT_LINE, event.nativeEvent.layout.height)));
  }, []);

  const submit = useCallback(() => {
    if (disabled || busy) return;
    onSubmit?.(text);
    if (value === undefined) setText('');
  }, [disabled, busy, onSubmit, text, value, setText]);

  const onKeyPress = useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      // The host sees the key first and may take it (a suggestion list).
      onKeyPressProp?.(event);
      if (event.defaultPrevented) return;
      const native: TextInputKeyPressEventData & { shiftKey?: boolean; isComposing?: boolean } =
        event.nativeEvent;
      if (!IS_WEB || native.key !== 'Enter' || native.shiftKey || native.isComposing) return;
      event.preventDefault();
      submit();
    },
    [submit, onKeyPressProp],
  );

  const hasAttachments = !!attachments && attachments.length > 0;

  const cardStyle: WebCssStyle = {
    width: '100%',
    flexDirection: 'column',
    borderRadius: CARD_RADIUS,
    backgroundColor: 'transparent',
    padding: CARD_PADDING,
    boxShadow: palette.shadowCard,
    '--bloom-composer-ring': palette.focusRing,
  };

  return (
    <View testID={testID} style={[{ width: '100%', flexDirection: 'column' }, style]}>
      {status ?? null}

      <SurfaceLevelProvider level={1} fill={publishedFill}>
        <View style={[cardStyle, surfaceFillVars(publishedFill)]}>
          <SurfacePaint fill={palette.surface} radius={CARD_RADIUS} />
          <Collapse open={hasAttachments}>
            <View style={{ paddingBottom: 4 }}>
              <AttachmentStrip
                attachments={attachments ?? []}
                palette={palette}
                onRemove={onRemoveAttachment}
                onRetry={onAttachmentRetry}
                removeLabel={removeFileLabel}
                retryLabel={retryFileLabel}
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
              {IS_WEB ? null : (
                <RNText
                  aria-hidden
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  pointerEvents="none"
                  testID={testID ? `${testID}-input-twin` : undefined}
                  onLayout={onTwinLayout}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 6,
                    right: 6,
                    opacity: 0,
                    ...TYPE_SCALE['body-regular'],
                    fontFamily: 'Inter',
                  }}
                >
                  {/* A trailing newline is a line of its own in the field; a
                    Text drops it unless something follows. */}
                  {text.endsWith('\n') || text === '' ? `${text} ` : text}
                </RNText>
              )}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              {/* The actions never give way: + and the permission chip on the
                left, voice and send on the right keep their size, and the
                model chip between them is what truncates (a long model name
                once covered + and pushed voice off the card). */}
              <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
              <View
                style={{
                  minWidth: 0,
                  flexShrink: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 16,
                }}
              >
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
                <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MicButton
                    listening={isListening}
                    onToggle={() => setListening(!isListening)}
                    label={labels.voice}
                    palette={palette}
                  />
                  {/* Stop wins; then the host's empty action while there is
                    nothing to send; otherwise send. */}
                  {busy && onStop ? (
                    <StopButton onPress={onStop} label={labels.stop} />
                  ) : emptyAction !== undefined && text.trim() === '' && !attachments?.length ? (
                    emptyAction
                  ) : (
                    <SendButton disabled={disabled} onPress={submit} label={labels.send} />
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </SurfaceLevelProvider>
    </View>
  );
}
