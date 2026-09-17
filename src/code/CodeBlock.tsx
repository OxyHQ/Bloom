import React, { memo, useEffect, useState } from 'react';
import { Pressable, Text as RNText, View, type TextStyle } from 'react-native';

import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { CodeLines } from './CodeLines';
import { CARD_RADIUS, CONFIRM_MS, dataHook, IS_WEB, MONO_FAMILY, useCodePalette, useCodeWebCss } from './shared';
import type { CodeBlockProps } from './types';

const DEFAULT_LABELS = { copy: 'Copy code', copied: 'Code copied' };

async function writeClipboard(text: string): Promise<void> {
  const nav =
    typeof navigator === 'undefined'
      ? undefined
      : (navigator as { clipboard?: { writeText?: (value: string) => Promise<void> } });
  if (!IS_WEB || !nav?.clipboard?.writeText) throw new Error('clipboard unavailable');
  await nav.clipboard.writeText(text);
}

function mono(fontSize: number, lineHeight: number, extra: TextStyle): TextStyle {
  return { fontFamily: MONO_FAMILY, fontSize, lineHeight, ...extra };
}

/**
 * A code card: a header naming the file, and highlighted, numbered lines.
 *
 *   card     radius 16, 1px border, the page surface, shadow-xs, clipped
 *   header   36 tall, px 10, gap 12, a 1px rule under it. Left (gap 8): the
 *            language chip — 14 tall, radius 6, a 1px purple-100 border on
 *            purple-50, px 6, JetBrains Mono 10/1 medium purple-500 — and the
 *            file name, JetBrains Mono 12 in the secondary tone, truncating.
 *            Right (gap 8): `+156 -23` in JetBrains Mono 11/1 (success-700 /
 *            negative-600, gap 4) and a 24px copy button (radius 6, hover fill)
 *            whose 14px glyph becomes a success check for 1.6s
 *   code     `CodeLines` at `sm`, px 12 / py 10, scrolling sideways
 *
 * The header is left out when there is nothing to put in it.
 */
function CodeBlockComponent({
  code,
  language,
  languageLabel,
  filename,
  additions,
  deletions,
  highlight,
  lineNumbers = true,
  wrap = false,
  copyable = true,
  onCopy,
  headerAccessory,
  labels,
  style,
  testID,
}: CodeBlockProps) {
  useCodeWebCss();
  const palette = useCodePalette();
  const l = { ...DEFAULT_LABELS, ...labels };
  const [copied, setCopied] = useState(false);
  const [copyHovered, setCopyHovered] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const canCopy = copyable && (onCopy !== undefined || IS_WEB);
  const copy = async () => {
    try {
      await (onCopy ?? writeClipboard)(code);
      setCopied(true);
    } catch {
      // A refused clipboard leaves the glyph as it was.
    }
  };

  const chip = languageLabel ?? language?.toUpperCase();
  const hasDiff = additions !== undefined || deletions !== undefined;
  const hasHeader = chip !== undefined || filename !== undefined || hasDiff || canCopy || headerAccessory != null;

  const copyStyle: WebCssStyle = {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: copyHovered ? palette.controlHover : 'transparent',
    '--bloom-code-ring': palette.ring,
  };

  return (
    <View
      testID={testID}
      style={[
        {
          overflow: 'hidden',
          borderRadius: CARD_RADIUS,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.surface,
          boxShadow: palette.shadow,
        },
        style,
      ]}>
      {hasHeader ? (
        <View
          style={{
            height: 36,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor: palette.border,
            paddingLeft: 10,
            paddingRight: 10,
          }}>
          <View style={{ minWidth: 0, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {chip ? (
              <View
                style={{
                  height: 14,
                  flexShrink: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: palette.chipBorder,
                  backgroundColor: palette.chipBackground,
                  paddingLeft: 6,
                  paddingRight: 6,
                }}>
                <RNText style={mono(10, 10, { fontWeight: '500', color: palette.chipText })}>{chip}</RNText>
              </View>
            ) : null}
            {filename ? (
              <RNText numberOfLines={1} style={mono(12, 20, { flexShrink: 1, color: palette.filename })}>
                {filename}
              </RNText>
            ) : null}
          </View>
          <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {headerAccessory}
            {hasDiff ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {additions !== undefined ? (
                  <RNText style={mono(11, 11, { color: palette.addition })}>{`+${additions}`}</RNText>
                ) : null}
                {deletions !== undefined ? (
                  <RNText style={mono(11, 11, { color: palette.deletion })}>{`-${deletions}`}</RNText>
                ) : null}
              </View>
            ) : null}
            {canCopy ? (
              <Pressable
                {...dataHook('bloomCodeCopy')}
                testID={testID ? `${testID}-copy` : undefined}
                accessibilityRole="button"
                accessibilityLabel={copied ? l.copied : l.copy}
                onPress={() => void copy()}
                onHoverIn={() => setCopyHovered(true)}
                onHoverOut={() => setCopyHovered(false)}
                style={copyStyle}>
                {copied ? (
                  <RiCheckLine width={14} height={14} fill={palette.confirm} />
                ) : (
                  <RiFileCopyLine width={14} height={14} fill={copyHovered ? palette.iconHover : palette.icon} />
                )}
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
      <CodeLines
        code={code}
        language={language}
        highlight={highlight}
        lineNumbers={lineNumbers}
        wrap={wrap}
        size="sm"
        style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 10, paddingBottom: 10 }}
      />
    </View>
  );
}

export const CodeBlock = memo(CodeBlockComponent);
CodeBlock.displayName = 'CodeBlock';
