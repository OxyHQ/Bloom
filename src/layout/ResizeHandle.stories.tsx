import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useIsRtl } from '../hooks/use-is-rtl';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ResizeHandle } from './ResizeHandle';
import type { ResizeHandleVariant } from './types';

const meta: Meta<typeof ResizeHandle> = {
  id: 'foundations-layout-resize-handle',
  title: 'Composition/Layout/Resize Handle',
  component: ResizeHandle,
  parameters: { controls: { disable: true } },
};
export default meta;
type Story = StoryObj<typeof ResizeHandle>;

const GAP = 7;
const MIN = 120;

function Pane({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 10,
        padding: 12,
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
    >
      <Text>{label}</Text>
    </View>
  );
}

/**
 * Two panes `GAP` apart with the handle in the gap, resizing the first: drag
 * it, or focus it and press the arrow keys.
 */
function Split({
  variant,
  orientation = 'vertical',
}: {
  variant: ResizeHandleVariant;
  orientation?: 'vertical' | 'horizontal';
}) {
  const { colors } = useTheme();
  const vertical = orientation === 'vertical';
  // The handle reports screen distance; the first pane is on the right in RTL.
  const rtl = useIsRtl();
  const sign = vertical && rtl ? -1 : 1;
  const extent = vertical ? 560 : 360;
  const [size, setSize] = useState(extent / 2 - GAP / 2);
  const [start, setStart] = useState(size);
  const clamp = (value: number) => Math.min(extent - GAP - MIN, Math.max(MIN, value));
  return (
    <View
      testID={`split-${variant}-${orientation}`}
      style={{
        width: vertical ? extent : 320,
        height: vertical ? 240 : extent,
        maxWidth: '100%',
        flexDirection: vertical ? 'row' : 'column',
        gap: GAP,
        padding: 6,
        borderRadius: 14,
        backgroundColor: colors.background,
      }}
    >
      <View style={vertical ? { width: size } : { height: size }}>
        <Pane label={`${Math.round(size)}`} />
        <View
          pointerEvents="box-none"
          style={
            vertical
              ? { position: 'absolute', top: 0, bottom: 0, insetInlineEnd: -GAP / 2, width: 0 }
              : { position: 'absolute', left: 0, right: 0, bottom: -GAP / 2, height: 0 }
          }
        >
          <ResizeHandle
            testID={`handle-${variant}-${orientation}`}
            variant={variant}
            orientation={vertical ? 'vertical' : 'horizontal'}
            thickness={variant === 'pill' ? GAP + 4 : undefined}
            onResizeStart={() => setStart(size)}
            onResize={(delta) => setSize(clamp(start + sign * delta))}
            onNudge={(delta) => setSize((current) => clamp(current + sign * delta))}
          />
        </View>
      </View>
      <Pane label="Second pane" />
    </View>
  );
}

/**
 * A split's divider: a 4×36 bar, radius 2, centred in the gap in the
 * foreground colour. Nothing at rest; 32% under the pointer or keyboard focus;
 * 55% while dragging. Its strip is the gap plus 2px of each pane.
 */
export const Pill: Story = { render: () => <Split variant="pill" /> };

/** The pill across a horizontal separator, resizing heights. */
export const PillHorizontal: Story = {
  render: () => <Split variant="pill" orientation="horizontal" />,
};

/** The default grip on the same split, following the pointer along the edge. */
export const Grip: Story = { render: () => <Split variant="grip" /> };
