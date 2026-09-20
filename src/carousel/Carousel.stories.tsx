import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { Carousel, CarouselItem } from './index';

const meta: Meta<typeof Carousel> = {
  argTypes: {
    "showArrows": { control: 'boolean' },
    "showDots": { control: 'boolean' },
    "align": { control: 'select', options: ["start","center"] },
    "gap": { control: 'number' },
    "previousLabel": { control: 'text' },
    "nextLabel": { control: 'text' }
  },
  title: 'Base/Carousel',
  component: Carousel,
};

export default meta;

type Story = StoryObj<typeof Carousel>;

function Slide({ label, height = 160 }: { label: string; height?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        height,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="body-medium">{label}</Text>
    </View>
  );
}

function Frame({ children, width = 440 }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View testID="frame" style={{ width, maxWidth: '100%', minWidth: 0, backgroundColor: theme.colors.background }}>
      <View style={{ width: '100%', minWidth: 0 }}>{children}</View>
    </View>
  );
}

/** One slide in view, arrows and dots — the default. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <Carousel accessibilityLabel="Gallery">
        {[1, 2, 3, 4].map((i) => (
          <CarouselItem key={i}>
            <Slide label={`Slide ${i}`} />
          </CarouselItem>
        ))}
      </Carousel>
    </Frame>
  ),
};

/** Narrower slides peek the next one; `align="center"` rests each in the middle. */
export const PeekCentered: Story = {
  args: { align: "center", gap: 12 },
  parameters: { controls: { include: ["align","gap","showArrows","showDots","previousLabel","nextLabel"] } },
  render: (args) => (
    <Frame>
      <Carousel {...args} accessibilityLabel="Peek gallery"  >
        {[1, 2, 3, 4, 5].map((i) => (
          <CarouselItem key={i} width={300}>
            <Slide label={`Card ${i}`} height={140} />
          </CarouselItem>
        ))}
      </Carousel>
    </Frame>
  ),
};

/** Mixed widths: positions are measured, not derived. */
export const MixedWidths: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <Carousel accessibilityLabel="Mixed widths">
        {[220, 320, 180, 440].map((w, i) => (
          <CarouselItem key={i} width={w}>
            <Slide label={`${w}px`} />
          </CarouselItem>
        ))}
      </Carousel>
    </Frame>
  ),
};

/** No arrows, dots only; and arrows only. A single slide shows no dots. */
export const Controls: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlsStory() {
    const [index, setIndex] = useState(0);
    return (
      <Frame>
        <View style={{ gap: 32 }}>
          <Carousel accessibilityLabel="Dots only" showArrows={false} onIndexChange={setIndex}>
            {[1, 2, 3].map((i) => (
              <CarouselItem key={i}>
                <Slide label={`Dots only ${i}`} height={100} />
              </CarouselItem>
            ))}
          </Carousel>
          <Text variant="body-2-regular">Active index: {index}</Text>
          <Carousel accessibilityLabel="Arrows only" showDots={false}>
            {[1, 2, 3].map((i) => (
              <CarouselItem key={i}>
                <Slide label={`Arrows only ${i}`} height={100} />
              </CarouselItem>
            ))}
          </Carousel>
          <Carousel accessibilityLabel="Single">
            <CarouselItem>
              <Slide label="Single slide" height={100} />
            </CarouselItem>
          </Carousel>
        </View>
      </Frame>
    );
  },
};
