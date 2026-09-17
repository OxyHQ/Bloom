import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, TextInput, View, useWindowDimensions, type TextStyle } from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import { RiArrowUpLine } from '../icons/remix/RiArrowUpLine';
import { RiAttachment2 } from '../icons/remix/RiAttachment2';
import { RiInfinityLine } from '../icons/remix/RiInfinityLine';
import { RiSparklingLine } from '../icons/remix/RiSparklingLine';
import { RiStopFill } from '../icons/remix/RiStopFill';
import type { WebCssStyle } from '../styles/web-view-style';
import { TYPE_SCALE, Text } from '../typography';
import { PrimaryDisc } from './AgentChatControls';
import { useAgentChatPlatform } from './context';
import {
  COMPOSER_CONTROL,
  COMPOSER_HEIGHT,
  dataHook,
  IS_WEB,
  shortModel,
  useAgentChatPalette,
  useAgentChatWebCss,
  type AgentChatPalette,
} from './shared';
import type { AgentChatComposerProps } from './types';

/**
 * The free composer: a 52px pill with a text field and circular controls, and
 * the thin status row beneath it.
 *
 *   column     gap 10
 *   pill       52 tall, full radius, p 8, gap 10; background-primary + shadow-xs
 *              at rest, transparent while busy so `ComposerLoader`'s own surface
 *              and light band show through
 *   attach     36 disc, composer-add background (hover one step), 20px
 *              icon-primary paperclip
 *   field      20 tall, flex 1, body-regular, text-primary, placeholder
 *              text-tertiary "Ask me anything"
 *   model      32 tall, radius 12, py 6 / px 8, gap 4: 16px sparkle
 *              (icon-secondary) + body-2-medium text-secondary, max 13ch
 *   controls   pl 6, gap 8: send (36 `bg-button-primary` disc, white 20px arrow,
 *              40% while empty) or stop (36 background-secondary disc, 20px
 *              icon-secondary square, one step darker on hover)
 *   status     26 tall, space-between: provider (∞) and message count (✦),
 *              16px icon-secondary + body-2-medium text-secondary, gap 4
 *
 * Enter submits (web: Shift+Enter is swallowed, the field is single-line, a
 * plain `<input>`).
 */

const DEFAULT_LABELS = {
  field: 'Message',
  placeholder: 'Ask me anything',
  attach: 'Add attachment',
  send: 'Send message',
  stop: 'Stop generating',
  notConfigured: 'Not configured',
  newChat: 'New chat',
  messageCount: (count: number) => `${count} messages`,
  answeringWith: (model: string) => `Answering with ${model}`,
};

/** `max-w-[13ch]`: `ch` has no RN unit; 13ch of Inter at 13px measures 131px in Chrome. */
const MODEL_MAX_WIDTH = 131;
/** `hidden sm:inline` — the model name drops below the `sm` breakpoint, the sparkle stays. */
const MODEL_NAME_MIN_WINDOW = 640;

function AttachButton({
  label,
  onPress,
  palette,
}: {
  label: string;
  onPress?: () => void;
  palette: AgentChatPalette;
}) {
  const [hovered, setHovered] = useState(false);
  const style: WebCssStyle = {
    width: COMPOSER_CONTROL,
    height: COMPOSER_CONTROL,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: hovered ? palette.addHover : palette.addBackground,
    '--bloom-agent-chat-ring': palette.ring,
  };
  return (
    <Pressable
      {...dataHook('bloomAgentChatControl')}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}>
      <RiAttachment2 width={20} height={20} fill={palette.iconPrimary} />
    </Pressable>
  );
}

function StopButton({
  label,
  onPress,
  palette,
}: {
  label: string;
  onPress?: () => void;
  palette: AgentChatPalette;
}) {
  const [hovered, setHovered] = useState(false);
  const style: WebCssStyle = {
    width: COMPOSER_CONTROL,
    height: COMPOSER_CONTROL,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: hovered ? palette.rowHover : palette.chatSurface,
    '--bloom-agent-chat-ring': palette.ring,
  };
  return (
    <Pressable
      {...dataHook('bloomAgentChatControl')}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}>
      <RiStopFill width={20} height={20} fill={palette.iconSecondary} />
    </Pressable>
  );
}

function StatusItem({
  icon: Icon,
  label,
  palette,
}: {
  icon: typeof RiInfinityLine;
  label: string;
  palette: AgentChatPalette;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon width={16} height={16} fill={palette.iconSecondary} />
      <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
        {label}
      </Text>
    </View>
  );
}

export function AgentChatComposerBase({
  value,
  defaultValue = '',
  onValueChange,
  onSubmit,
  onStop,
  busy = false,
  onAttach,
  model,
  provider,
  messageCount = 0,
  disabled = false,
  labels,
  style,
  testID,
}: AgentChatComposerProps) {
  useAgentChatWebCss();
  const palette = useAgentChatPalette();
  const { ComposerLoader } = useAgentChatPlatform();
  const l = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  const [text, setText] = useControllableState<string>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const empty = text.trim().length === 0;
  const showModelName = useWindowDimensions().width >= MODEL_NAME_MIN_WINDOW;

  const submit = useCallback(() => {
    if (disabled) return;
    onSubmit?.(text);
    // Uncontrolled: clear what was sent.
    if (value === undefined && !busy && text.trim()) setText('');
  }, [busy, disabled, onSubmit, setText, text, value]);

  const pill: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: COMPOSER_HEIGHT,
    gap: 10,
    padding: 8,
    borderRadius: 9999,
    backgroundColor: busy ? 'transparent' : palette.card,
    boxShadow: busy ? undefined : palette.shadowXs,
  };

  const fieldStyle: TextStyle & WebCssStyle = {
    ...TYPE_SCALE['body-regular'],
    fontFamily: IS_WEB ? 'var(--bloom-font-sans)' : 'Inter',
    color: palette.text,
    height: 20,
    minWidth: 0,
    flex: 1,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    '--bloom-agent-chat-placeholder': palette.textTertiary,
  };

  return (
    <View testID={testID} style={[{ width: '100%', flexDirection: 'column', gap: 10 }, style]}>
      <ComposerLoader active={busy}>
        <View style={pill}>
          <AttachButton label={l.attach} onPress={onAttach} palette={palette} />
          <TextInput
            {...dataHook('bloomAgentChatField')}
            testID={testID ? `${testID}-field` : undefined}
            accessibilityLabel={l.field}
            value={text}
            onChangeText={setText}
            placeholder={l.placeholder}
            placeholderTextColor={palette.textTertiary}
            selectionColor={palette.text}
            cursorColor={palette.text}
            autoComplete="off"
            editable={!disabled}
            returnKeyType="send"
            submitBehavior="submit"
            onSubmitEditing={submit}
            style={fieldStyle}
          />
          {model ? (
            <View
              accessible
              accessibilityLabel={l.answeringWith(model)}
              style={{
                height: 32,
                flexShrink: 0,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                borderRadius: 12,
                paddingTop: 6,
                paddingBottom: 6,
                paddingLeft: 8,
                paddingRight: 8,
              }}>
              <RiSparklingLine width={16} height={16} fill={palette.iconSecondary} />
              {showModelName ? (
                <Text
                  variant="body-2-medium"
                  numberOfLines={1}
                  style={{ maxWidth: MODEL_MAX_WIDTH, color: palette.textSecondary }}>
                  {shortModel(model)}
                </Text>
              ) : null}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', flexShrink: 0, alignItems: 'center', gap: 8, paddingLeft: 6 }}>
            {busy ? (
              <StopButton label={l.stop} onPress={onStop} palette={palette} />
            ) : (
              <PrimaryDisc
                testID={testID ? `${testID}-send` : undefined}
                label={l.send}
                size={COMPOSER_CONTROL}
                disabled={empty || disabled}
                onPress={submit}
                palette={palette}>
                <RiArrowUpLine width={20} height={20} fill="#ffffff" />
              </PrimaryDisc>
            )}
          </View>
        </View>
      </ComposerLoader>

      <View
        style={{
          width: '100%',
          height: 26,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <StatusItem icon={RiInfinityLine} label={provider ?? l.notConfigured} palette={palette} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <StatusItem
            icon={RiSparklingLine}
            label={messageCount === 0 ? l.newChat : l.messageCount(messageCount)}
            palette={palette}
          />
        </View>
      </View>
    </View>
  );
}
