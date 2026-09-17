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

type ContentComponent = React.ComponentType<{
  children: React.ReactNode;
  label: string;
  size?: TooltipSize;
}>;

export function createTextBubble(Content: ContentComponent) {
  return function TextBubble({
    children,
    size = 'sm',
  }: {
    children: React.ReactNode;
    /** `sm` (default) → 12px Caption 1/Medium, `md` → 14px Body 1/Medium. */
    size?: TooltipSize;
  }) {
    const palette = useMenuPalette();
    const type = TOOLTIP_SIZES[size];
    const c = Children.toArray(children);
    return (
      <Content label={c.join(' ')} size={size}>
        <View style={{ gap: 2 }}>
          {c.map((child, i) => (
            <Text key={i} style={[TYPE_SCALE[type.type], { color: palette.text }]}>
              {child}
            </Text>
          ))}
        </View>
      </Content>
    );
  };
}
