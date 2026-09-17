/**
 * The anchored list above the composer: `@mention`, `/command` and `:shortcode`
 * are ONE part with a `kind`, because the row geometry, the keyboard model and
 * the announced role are identical — only the leading slot differs.
 *
 * It is a listbox the composer's field OWNS: `activeIndex` arrives as a prop and
 * the arrow keys are handled on the input, never here. A list that kept its own
 * highlight would fight the field for it the first time a pointer moved.
 */
import React from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';

import { RiHashtag } from '../icons/remix/RiHashtag';
import { useImageResolver } from '../image-resolver/context';
import { useTheme } from '../theme/use-theme';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import {
  PANEL_RADIUS,
  SUGGESTION_MAX_HEIGHT,
  SUGGESTION_ROW_HEIGHT,
  resolveChatComposerPalette,
} from './shared';
import type { ChatComposerSuggestion, SuggestionKind, SuggestionListProps } from './types';
import { dataHook, IS_WEB } from './web-hooks';

const DEFAULT_NAMES: Record<SuggestionKind, string> = {
  mention: 'People',
  command: 'Commands',
  emoji: 'Emoji',
};

function isUrl(value: string): boolean {
  return /^(https?:)?\/\//.test(value) || value.startsWith('data:') || value.startsWith('file:');
}

function Leading({
  kind,
  suggestion,
}: {
  kind: SuggestionKind;
  suggestion: ChatComposerSuggestion;
}) {
  const theme = useTheme();
  const palette = resolveChatComposerPalette(theme);
  const resolveImage = useImageResolver();

  if (kind === 'emoji') {
    return (
      <Text variant="title-2-regular" style={{ width: 28, textAlign: 'center' }}>
        {suggestion.emoji ?? suggestion.label}
      </Text>
    );
  }
  if (kind === 'mention') {
    const uri =
      suggestion.avatar === undefined
        ? undefined
        : isUrl(suggestion.avatar)
          ? suggestion.avatar
          : resolveImage?.(suggestion.avatar, 'thumb');
    return uri ? (
      <Image
        source={{ uri }}
        accessibilityIgnoresInvertColors
        style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: palette.inset }}
      />
    ) : (
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: palette.inset,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text variant="body-2-medium" style={{ color: palette.textSecondary }}>
          {suggestion.label.slice(0, 1).toUpperCase()}
        </Text>
      </View>
    );
  }
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: palette.inset,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <RiHashtag width={16} height={16} fill={palette.iconSecondary} />
    </View>
  );
}

export function SuggestionList({
  kind,
  suggestions,
  activeIndex = -1,
  onSelectSuggestion,
  onActiveIndexChange,
  header,
  maxHeight = SUGGESTION_MAX_HEIGHT,
  style,
  testID,
  accessibilityLabel,
}: SuggestionListProps) {
  const theme = useTheme();
  const palette = resolveChatComposerPalette(theme);
  if (suggestions.length === 0) return null;

  // React Native's `Role` union has no `listbox`; react-native-web passes the
  // DOM `role` straight through, so it travels as a web-only prop.
  const listRole: Record<string, unknown> = IS_WEB ? { role: 'listbox' } : { accessibilityRole: 'list' };

  const panel: WebCssStyle = {
    borderRadius: PANEL_RADIUS,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    boxShadow: palette.shadowPanel,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 6,
    paddingRight: 6,
    overflow: 'hidden',
  };

  return (
    <View style={[panel, style]} testID={testID}>
      {header ? (
        <Text
          variant="caption-1-medium"
          style={{
            color: palette.textSecondary,
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 2,
            paddingBottom: 6,
          }}>
          {header}
        </Text>
      ) : null}
      <ScrollView
        {...dataHook('bloomChatComposerScroll')}
        {...listRole}
        accessibilityLabel={accessibilityLabel ?? DEFAULT_NAMES[kind]}
        style={{ maxHeight }}
        showsVerticalScrollIndicator={false}>
        {suggestions.map((suggestion, index) => {
          const active = index === activeIndex;
          const row: WebCssStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            minHeight: SUGGESTION_ROW_HEIGHT,
            borderRadius: 10,
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 6,
            paddingBottom: 6,
            opacity: suggestion.disabled ? 0.5 : 1,
            backgroundColor: active ? palette.hover : 'transparent',
            cursor: suggestion.disabled ? 'auto' : 'pointer',
            '--bloom-chat-composer-ring': palette.focusRing,
          };
          const name = suggestion.handle
            ? `${suggestion.label} ${suggestion.handle}`
            : suggestion.label;
          return (
            <Pressable
              key={suggestion.id}
              {...dataHook('bloomChatComposerRow')}
              role="option"
              accessibilityLabel={name}
              aria-selected={active}
              accessibilityState={{ selected: active, disabled: suggestion.disabled }}
              disabled={suggestion.disabled}
              onPress={() => onSelectSuggestion?.(suggestion, index)}
              onHoverIn={() => onActiveIndexChange?.(index)}
              style={row}
              testID={testID ? `${testID}-row-${suggestion.id}` : undefined}>
              <Leading kind={kind} suggestion={suggestion} />
              <View style={{ flexShrink: 1, flexGrow: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
                    {suggestion.label}
                  </Text>
                  {suggestion.handle ? (
                    <Text
                      variant="body-2-regular"
                      numberOfLines={1}
                      style={{ color: palette.textSecondary, flexShrink: 1 }}>
                      {suggestion.handle}
                    </Text>
                  ) : null}
                </View>
                {suggestion.description ? (
                  <Text
                    variant="caption-1-regular"
                    numberOfLines={1}
                    style={{ color: palette.textPlaceholder }}>
                    {suggestion.description}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
