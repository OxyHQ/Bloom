/**
 * Shared TextBubble factory for Tooltip (native + web).
 *
 * Returns a TextBubble component bound to the platform-specific Content
 * component, avoiding circular imports between TextBubble and the
 * platform entry points.
 */
import { Children } from 'react';
import { View } from 'react-native';

import { useMenuPalette } from '../floating/menu-palette';
import { Text, TYPE_SCALE } from '../typography';
import { TOOLTIP_SIZES, type TooltipSize } from './constants';
import { useTooltipSize } from './use-tooltip-size';

type ContentComponent = React.ComponentType<{
  children: React.ReactNode;
  label: string;
  size?: TooltipSize;
}>;

export function createTextBubble(Content: ContentComponent) {
  return function TextBubble({
    children,
    size: sizeProp,
  }: {
    children: React.ReactNode;
    /** Explicit size overrides BloomScope. Standalone sm uses 12px; md uses 14px. */
    size?: TooltipSize;
  }) {
    const size = useTooltipSize(sizeProp);
    const lines = Children.toArray(children);
    return (
      <Content label={lines.join(' ')} size={size}>
        <TextBubbleLines lines={lines} size={size} />
      </Content>
    );
  };
}

/** The bubble's text, rendered only when `Content` shows it: a closed tooltip reads no palette. */
function TextBubbleLines({
  lines,
  size,
}: {
  lines: ReturnType<typeof Children.toArray>;
  size: TooltipSize;
}) {
  const palette = useMenuPalette();
  const type = TOOLTIP_SIZES[size];
  return (
    <View style={{ gap: 2 }}>
      {lines.map((line, i) => (
        <Text key={i} style={[TYPE_SCALE[type.type], { color: palette.text }]}>
          {line}
        </Text>
      ))}
    </View>
  );
}
