import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiThumbDownLine } from '../icons/remix/RiThumbDownLine';
import { RiThumbUpLine } from '../icons/remix/RiThumbUpLine';
import { SurfaceAction, SwapGlyph, TurnActionButton, turnActionSurface } from './AiChatControls';
import { CONFIRM_MS, useAiChatPalette, useAiChatWebCss } from './shared';
import type { AiChatCopyResult, AiChatFeedbackRowProps } from './types';

const DEFAULT_LABELS = {
  like: 'Good response',
  dislike: 'Bad response',
  copy: 'Copy response',
  copied: 'Copied!',
};

/**
 * `FeedbackRow`: the actions under an assistant turn.
 *
 *   row      gap 6
 *   button   28 square — radius 8 (`rounded-lg`), p 6, background-tertiary;
 *            background-secondary-hover on hover, the 16px glyph deepening from
 *            icon-secondary to icon-primary (150ms)
 *   tooltip  a `sm` tooltip above, after a 200ms hover
 *   copy     the copy glyph blurs, scales to 75% and fades out as a check comes
 *            in (200ms ease-out); the tooltip is held open reading "Copied!"
 *            for 1.6s, then dismissed even if the pointer is still over it — once
 *            the copy HAPPENED: an async handler is waited for, and a `false`,
 *            a throw or a rejection shows nothing
 *   actions  the caller's extra buttons after copy, on the same surface
 */
export function AiChatFeedbackRowBase({ onLike, onDislike, onCopy, actions, labels, style, testID }: AiChatFeedbackRowProps) {
  useAiChatWebCss();
  const palette = useAiChatPalette();
  const l = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  const [copied, setCopied] = useState(false);
  const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The latest press: a slower, earlier copy settling late must not confirm.
  const attempt = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const confirm = () => {
    if (timer.current) clearTimeout(timer.current);
    setCopied(true);
    setCopyTooltipOpen(true);
    timer.current = setTimeout(() => {
      setCopied(false);
      setCopyTooltipOpen(false);
    }, CONFIRM_MS);
  };

  const copy = () => {
    const id = ++attempt.current;
    let result: AiChatCopyResult;
    try {
      result = onCopy?.();
    } catch {
      return;
    }
    if (isPromiseLike(result)) {
      result.then(
        (ok) => {
          if (ok !== false && mounted.current && id === attempt.current) confirm();
        },
        () => undefined,
      );
      return;
    }
    if (result !== false) confirm();
  };

  const surface = turnActionSurface(palette);

  return (
    <View testID={testID} style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, style]}>
      <SurfaceAction
        {...surface}
        testID={testID ? `${testID}-like` : undefined}
        label={l.like}
        onPress={onLike}
        glyph={(color) => <RiThumbUpLine width={16} height={16} fill={color} />}
      />
      <SurfaceAction
        {...surface}
        testID={testID ? `${testID}-dislike` : undefined}
        label={l.dislike}
        onPress={onDislike}
        glyph={(color) => <RiThumbDownLine width={16} height={16} fill={color} />}
      />
      <SurfaceAction
        {...surface}
        testID={testID ? `${testID}-copy` : undefined}
        label={l.copy}
        tooltip={copied ? l.copied : undefined}
        tooltipOpen={copyTooltipOpen}
        onTooltipOpenChange={setCopyTooltipOpen}
        onPress={copy}
        glyph={(color) => (
          <View style={{ width: 16, height: 16 }}>
            <SwapGlyph shown={!copied} size={16}>
              <RiFileCopyLine width={16} height={16} fill={color} />
            </SwapGlyph>
            <SwapGlyph shown={copied} size={16}>
              <RiCheckLine width={16} height={16} fill={color} />
            </SwapGlyph>
          </View>
        )}
      />
      {actions?.map((action) => (
        <TurnActionButton key={action.key} action={action} palette={palette} testID={testID} />
      ))}
    </View>
  );
}

function isPromiseLike(value: unknown): value is PromiseLike<void | boolean> {
  return typeof (value as PromiseLike<unknown> | null | undefined)?.then === 'function';
}
