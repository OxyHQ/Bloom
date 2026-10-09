import React, { useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { Button } from '../button';
import { useTheme } from '../theme/use-theme';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
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

/** A titled row of fixed-width cards: header and arrows share one row, and the track is inset. */
export const WithHeader: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <Carousel
        accessibilityLabel="Who to follow"
        header={<Text variant="body-medium">Who to follow</Text>}
        showDots={false}
        inset={12}
        gap={12}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <CarouselItem key={i} width={172}>
            <Slide label={`Card ${i}`} height={220} />
          </CarouselItem>
        ))}
      </Carousel>
    </Frame>
  ),
};

/** Overlay controls stay with the track; the consumer owns its responsive breakpoint. */
export const OverlayArrows: Story = {
  render: function OverlayArrowsStory() {
    const { width } = useWindowDimensions();
    const [picked, setPicked] = useState(0);
    return <Frame width={640}>
      <Carousel testID="overlay-carousel" accessibilityLabel="Featured categories"
        arrowsPlacement="overlay" showArrows={width >= 640} showDots={false} gap={12}>
        {[1, 2, 3, 4, 5].map(index => <CarouselItem key={index} width={172} testID={`overlay-slide-${index}`}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Choose category ${index}`}
            onPress={() => setPicked(index)}><Slide label={`Category ${index}`} /></Pressable>
        </CarouselItem>)}
      </Carousel>
      <Text testID="overlay-selected">{picked}</Text>
    </Frame>;
  },
};

/** A gallery's thumbnails own the same index its swipe reports. */
export const Controlled: Story = {
  render: function ControlledStory() {
    const [index, setIndex] = useState(1);
    const [width, setWidth] = useState(440);
    const [count, setCount] = useState(4);
    const [revision, setRevision] = useState(0);
    const [reversed, setReversed] = useState(false);
    const [accept, setAccept] = useState(true);
    const [events, setEvents] = useState<number[]>([]);
    return <Frame width={width}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {Array.from({ length: count }, (_, i) => <Button key={i} onPress={() => setIndex(i)}>Thumbnail {i + 1}</Button>)}
      </View>
      <Carousel testID="controlled-carousel" accessibilityLabel="Product gallery" index={index}
        onIndexChange={next => { setEvents(previous => [...previous, next]); if (accept) setIndex(next); }}>
        {Array.from({ length: count }, (_, i) => reversed ? count - i - 1 : i).map((id, position) =>
          <CarouselItem key={`${revision}-${id}`} testID={`controlled-slide-${position}`}>
            <Slide label={`Photo ${id + 1}`} />
          </CarouselItem>)}
      </Carousel>
      <Text testID="controlled-index">{index}</Text>
      <Text testID="controlled-events">{JSON.stringify(events)}</Text>
      <Button onPress={() => setWidth(value => value === 440 ? 280 : 440)}>Resize gallery</Button>
      <Button onPress={() => setReversed(value => !value)}>Reverse images</Button>
      <Button onPress={() => setCount(value => Math.max(0, value - 1))}>Remove last image</Button>
      <Button onPress={() => { setRevision(value => value + 1); setCount(4); setIndex(0); setReversed(false); }}>Replace gallery</Button>
      <Button onPress={() => setAccept(value => !value)}>Toggle accepting requests</Button>
    </Frame>;
  },
};

function HoverArrowsDemo({ mode, placement }: { mode: 'light' | 'dark'; placement: 'header' | 'overlay' }) {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);
  return <BloomThemeProvider mode={mode} colorPreset="oxy"><Frame width={440}>
    <Button testID="before-carousel" onPress={() => {}}>Before gallery</Button>
    <Carousel testID="hover-carousel" accessibilityLabel="Interactive photo gallery" index={index} onIndexChange={setIndex}
      arrowsPlacement={placement} arrowsVisibility="hover" showArrows={show} showDots={false}>
      {[0, 1, 2].map(value => <CarouselItem key={value}><Slide label={`Photo ${value + 1}`} /></CarouselItem>)}
    </Carousel>
    <Text testID="hover-index">{index}</Text>
    <Button testID="after-carousel" onPress={() => setShow(value => !value)}>Toggle arrows</Button>
    <Carousel testID="always-carousel" accessibilityLabel="Always visible controls" arrowsPlacement="overlay" showDots={false}>
      {[0, 1].map(value => <CarouselItem key={value}><Slide label={`Other photo ${value + 1}`} /></CarouselItem>)}
    </Carousel>
  </Frame></BloomThemeProvider>;
}
export const HoverArrowsLight: Story = { render: args => <HoverArrowsDemo mode="light" placement={args.arrowsPlacement ?? 'overlay'} /> };
export const HoverArrowsDark: Story = { render: args => <HoverArrowsDemo mode="dark" placement={args.arrowsPlacement ?? 'overlay'} /> };

function ArrowRecipeDemo({ mode, placement }: { mode: 'light' | 'dark'; placement: 'header' | 'overlay' }) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(440);
  const [count, setCount] = useState(3);
  return <BloomThemeProvider mode={mode} colorPreset="oxy"><Frame width={width}>
    <Button testID="recipe-before" onPress={() => {}}>Before gallery</Button>
    <Carousel testID="recipe-carousel" accessibilityLabel="Styled gallery" index={index} onIndexChange={setIndex}
      arrowsPlacement={placement} arrowsVisibility="hover" hideUnavailableArrows showDots={false}
      arrowButtonProps={{ material: 'flat', className: 'bloom-demo-carousel-arrow', iconSize: 20 }}>
      {Array.from({ length: count }, (_, value) => <CarouselItem key={value}><Slide label={`Photo ${value + 1}`} /></CarouselItem>)}
    </Carousel>
    <Text testID="recipe-index">{index}</Text>
    <Button testID="recipe-after" onPress={() => setIndex(0)}>First photo</Button>
    <Button onPress={() => setIndex(count - 1)}>Last photo</Button>
    <Button onPress={() => setWidth(value => value === 440 ? 280 : 440)}>Resize gallery</Button>
    <Button onPress={() => setCount(1)}>Single photo</Button>
  </Frame></BloomThemeProvider>;
}
export const ArrowRecipeLight: Story = { render: args => <ArrowRecipeDemo mode="light" placement={args.arrowsPlacement ?? 'overlay'} /> };
export const ArrowRecipeDark: Story = { render: args => <ArrowRecipeDemo mode="dark" placement={args.arrowsPlacement ?? 'overlay'} /> };
