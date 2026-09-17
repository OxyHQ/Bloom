import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiVolumeMuteLine } from '../icons/remix/RiVolumeMuteLine';
import { RiVolumeUpLine } from '../icons/remix/RiVolumeUpLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { IconAction } from './AgentChatControls';
import {
  ACTION_SIZE,
  CONFIRM_MS,
  dataHook,
  formatAgo,
  IS_WEB,
  useAgentChatPalette,
  useAgentChatWebCss,
} from './shared';
import type { AgentChatMessageProps } from './types';

/**
 * `AgentMessage`: one turn of the transcript.
 *
 *   user        right-aligned bubble, max 75%, radius 16, px 12 / py 11,
 *               background-primary, shadow-card, body-regular, pre-wrap
 *   assistant   px 4, column gap 4: paragraphs (gap 12, body-regular) then the
 *               action row — copy, read aloud (28px, 16px glyph, icon-tertiary →
 *               icon-secondary on a background-primary fill) and the timestamp
 *               (caption-1-regular, text-tertiary, 4px in)
 *
 * Each non-empty line softens in ONCE as it first appears — opacity 0 → 1,
 * blur 5px → 0 (web) and y 4 → 0 over 420ms `cubic-bezier(0.22, 0.61, 0.36, 1)` —
 * and then only grows, so a streamed reply never re-animates what is already
 * on screen. Reduced motion mounts lines settled.
 *
 * The action row is mounted at all times: on web it is revealed on hover of the
 * message or focus inside it (so keyboard users reach it); on native, which has
 * no hover, it simply shows. While `streaming` it is hidden and inert.
 */

const LINE_MS = 420;
const LINE_EASE = Easing.bezier(0.22, 0.61, 0.36, 1);

const Line = memo(function Line({
  text,
  color,
  animate,
}: {
  text: string;
  color: string;
  animate: boolean;
}) {
  const progress = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    progress.value = withTiming(1, { duration: LINE_MS, easing: LINE_EASE });
  }, [progress]);
  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ translateY: 4 * (1 - progress.value) }],
      // A settled line keeps `blur(0px)` rather than dropping the filter.
      ...(IS_WEB ? { filter: `blur(${5 * (1 - progress.value)}px)` } : null),
    }),
    [progress],
  );
  return (
    <Animated.View style={animatedStyle}>
      <Text variant="body-regular" style={{ color }}>
        {text}
      </Text>
    </Animated.View>
  );
});

function defaultCopy(text: string): Promise<void> {
  const clipboard =
    typeof navigator !== 'undefined'
      ? (navigator as { clipboard?: { writeText?: (value: string) => Promise<void> } }).clipboard
      : undefined;
  if (!clipboard?.writeText) return Promise.reject(new Error('clipboard unavailable'));
  return clipboard.writeText(text);
}

interface SpeechLike {
  cancel: () => void;
  speak: (utterance: unknown) => void;
}

function webSpeech(): { synth: SpeechLike; Utterance: new (text: string) => { onend: (() => void) | null; onerror: (() => void) | null } } | null {
  if (!IS_WEB || typeof window === 'undefined') return null;
  const w = window as unknown as {
    speechSynthesis?: SpeechLike;
    SpeechSynthesisUtterance?: new (text: string) => { onend: (() => void) | null; onerror: (() => void) | null };
  };
  if (!w.speechSynthesis || !w.SpeechSynthesisUtterance) return null;
  return { synth: w.speechSynthesis, Utterance: w.SpeechSynthesisUtterance };
}

function MessageActions({
  text,
  at,
  hidden,
  onCopy,
  onReadAloud,
  readingAloud,
  formatTime,
  labels,
}: {
  text: string;
  at?: number;
  hidden: boolean;
  onCopy?: AgentChatMessageProps['onCopy'];
  onReadAloud?: AgentChatMessageProps['onReadAloud'];
  readingAloud?: boolean;
  formatTime: (at: number) => string;
  labels: Required<NonNullable<AgentChatMessageProps['labels']>>;
}) {
  const palette = useAgentChatPalette();
  const [copied, setCopied] = useState(false);
  const [speakingState, setSpeaking] = useState(false);
  const speaking = readingAloud ?? speakingState;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  // Speech keeps running if the message unmounts mid-sentence; cancel it.
  useEffect(() => {
    if (onReadAloud) return;
    return () => webSpeech()?.synth.cancel();
  }, [onReadAloud]);

  const copyHandler = onCopy ?? (IS_WEB ? defaultCopy : undefined);
  const copy = useCallback(async () => {
    if (!copyHandler) return;
    try {
      await copyHandler(text);
      setCopied(true);
    } catch {
      // A refused clipboard leaves the icon unchanged.
    }
  }, [copyHandler, text]);

  const speech = onReadAloud ? null : webSpeech();
  const canSpeak = Boolean(onReadAloud || speech);
  const toggleSpeech = useCallback(() => {
    if (onReadAloud) {
      onReadAloud(text, !speaking);
      if (readingAloud === undefined) setSpeaking(!speaking);
      return;
    }
    const engine = webSpeech();
    if (!engine) return;
    if (speaking) {
      engine.synth.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new engine.Utterance(text);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    engine.synth.cancel();
    engine.synth.speak(utterance);
    setSpeaking(true);
  }, [onReadAloud, readingAloud, speaking, text]);

  const rowStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    // Web: the family sheet owns opacity (hover / focus-within reveal). Native
    // has no hover, so the row simply shows unless the reply is streaming.
    ...(IS_WEB ? null : { opacity: hidden ? 0 : 1 }),
  };

  const iconProps = {
    size: ACTION_SIZE,
    color: palette.iconTertiary,
    hoverColor: palette.iconSecondary,
    hoverBackground: palette.card,
    palette,
  };

  return (
    <View
      {...dataHook('bloomAgentChatActions', hidden ? 'hidden' : 'shown')}
      pointerEvents={hidden ? 'none' : 'auto'}
      style={rowStyle}>
      {copyHandler ? (
        <IconAction
          {...iconProps}
          label={copied ? labels.copied : labels.copy}
          onPress={copy}
          icon={(color) =>
            copied ? (
              <RiCheckLine width={16} height={16} fill={color} />
            ) : (
              <RiFileCopyLine width={16} height={16} fill={color} />
            )
          }
        />
      ) : null}
      {canSpeak ? (
        <IconAction
          {...iconProps}
          label={speaking ? labels.stopReading : labels.readAloud}
          onPress={toggleSpeech}
          icon={(color) =>
            speaking ? (
              <RiVolumeMuteLine width={16} height={16} fill={color} />
            ) : (
              <RiVolumeUpLine width={16} height={16} fill={color} />
            )
          }
        />
      ) : null}
      {at ? (
        <Text
          variant="caption-1-regular"
          style={{ marginLeft: 4, color: palette.textTertiary }}>
          {formatTime(at)}
        </Text>
      ) : null}
    </View>
  );
}

const DEFAULT_LABELS = {
  copy: 'Copy message',
  copied: 'Copied',
  readAloud: 'Read aloud',
  stopReading: 'Stop reading aloud',
};

export function AgentChatMessage({
  role,
  text,
  streaming = false,
  at,
  onCopy,
  onReadAloud,
  readingAloud,
  formatTime = formatAgo,
  labels,
  style,
  testID,
}: AgentChatMessageProps) {
  useAgentChatWebCss();
  const palette = useAgentChatPalette();
  const reducedMotion = useReducedMotion();
  const lines = useMemo(() => text.split('\n').filter((line) => line.trim() !== ''), [text]);
  const merged = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);

  if (!text) return null;

  if (role === 'user') {
    const bubble: WebCssStyle = {
      alignSelf: 'flex-end',
      maxWidth: '75%',
      borderRadius: 16,
      backgroundColor: palette.card,
      paddingLeft: 12,
      paddingRight: 12,
      paddingTop: 11,
      paddingBottom: 11,
      boxShadow: palette.shadowCard,
    };
    return (
      <View testID={testID} style={[bubble, style]}>
        <Text variant="body-regular" style={{ color: palette.text }}>
          {text}
        </Text>
      </View>
    );
  }

  return (
    <View
      {...dataHook('bloomAgentChatMessage')}
      testID={testID}
      style={[{ flexDirection: 'column', gap: 4, paddingLeft: 4, paddingRight: 4 }, style]}>
      <View style={{ flexDirection: 'column', gap: 12 }}>
        {lines.map((line, index) => (
          <Line key={index} text={line} color={palette.text} animate={!reducedMotion} />
        ))}
      </View>
      <MessageActions
        text={text}
        at={at}
        hidden={streaming}
        onCopy={onCopy}
        onReadAloud={onReadAloud}
        readingAloud={readingAloud}
        formatTime={formatTime}
        labels={merged}
      />
    </View>
  );
}
AgentChatMessage.displayName = 'AgentChatMessage';
