import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button, IconButton, LinkButton } from './Button';
import { CloseButton } from './CloseButton';
import { Text as BloomText } from '../typography';
import {
  RiAddLine as Plus,
  RiArrowRightLine as ArrowRight,
  RiDeleteBinLine as Trash,
  RiMore2Line,
} from '../icons/remix';

const meta: Meta<typeof Button> = {
  title: 'Base/Button',
  component: Button,
  args: {
    children: 'Button',
    onPress: () => {},
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive', 'outline', 'inverse', 'icon', 'text', 'link'],
    },
    size: {
      control: 'select',
      options: ['xs', 'small', 'medium', 'large'],
    },
    disabled: { control: 'boolean' },
    iconOnly: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Basic: Story = {
  args: { children: 'Save' },
};

export const Primary: Story = {
  args: { variant: 'primary', children: 'Primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
};

export const TextOnly: Story = {
  args: { variant: 'text', children: 'Text button' },
  name: 'Text',
};

export const Inverse: Story = {
  args: { variant: 'inverse', children: 'Inverse' },
};

export const Variants: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Danger</Button>
      <Button variant="inverse">Inverse</Button>
      <Button variant="text">Text</Button>
    </View>
  ),
};

export const Sizes: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Button size="xs">Xs</Button>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </View>
  ),
};

export const Loading: Story = {
  args: { loading: true, children: 'Submitting' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

export const Composition: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
      <Button variant="primary">Save</Button>
      <Button variant="secondary">Cancel</Button>
    </View>
  ),
};

const MATRIX_VARIANTS = ['primary', 'secondary', 'ghost', 'destructive'] as const;
const MATRIX_SIZES = ['medium', 'small', 'xs'] as const;

/** Type × Size matrix: label, icons, icon-only, disabled. */
export const Matrix: Story = {
  render: () => (
    <View style={{ gap: 24 }}>
      {MATRIX_VARIANTS.map((variant) => (
        <View key={variant} style={{ gap: 10 }}>
          <BloomText variant="caption-1-semibold" style={{ textTransform: 'capitalize' }}>
            {variant}
          </BloomText>
          {MATRIX_SIZES.map((size) => (
            <View
              key={size}
              style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
            >
              <Button variant={variant} size={size}>
                Button
              </Button>
              <Button variant={variant} size={size} leadingIcon={Plus} trailingIcon={ArrowRight}>
                Button
              </Button>
              <Button
                variant={variant}
                size={size}
                iconOnly
                leadingIcon={variant === 'destructive' ? Trash : Plus}
                accessibilityLabel="Add"
              />
              <Button variant={variant} size={size} disabled leadingIcon={Plus}>
                Disabled
              </Button>
              <Button variant={variant} size={size} loading>
                Loading
              </Button>
            </View>
          ))}
        </View>
      ))}
    </View>
  ),
};

/** `CloseButton`: 2xs · xs · sm · md. */
export const CloseButtons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      {(['2xs', 'xs', 'sm', 'md'] as const).map((size) => (
        <CloseButton key={size} size={size} accessibilityLabel="Close" onPress={() => {}} />
      ))}
    </View>
  ),
};

/** `IconButton`: the secondary square at medium (36 · 20) and small (32 · 16). */
export const IconButtons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <IconButton icon={RiMore2Line} accessibilityLabel="More" />
      <IconButton icon={RiMore2Line} size="small" accessibilityLabel="More" />
      <IconButton icon={RiMore2Line} disabled accessibilityLabel="More" />
      <IconButton icon={RiMore2Line} size="small" disabled accessibilityLabel="More" />
    </View>
  ),
};

/** `LinkButton`: primary and secondary at every size, disabled, and an anchor. */
export const LinkButtons: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      {(['primary', 'secondary'] as const).map((variant) => (
        <View key={variant} style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          {(['medium', 'small', 'xs'] as const).map((size) => (
            <LinkButton key={size} variant={variant} size={size} trailingIcon={ArrowRight}>
              Learn more
            </LinkButton>
          ))}
          <LinkButton variant={variant} disabled>
            Disabled
          </LinkButton>
          <LinkButton variant={variant} href="#">
            Anchor
          </LinkButton>
        </View>
      ))}
    </View>
  ),
};

/**
 * `underline` and the `text` link tone — the inline text action four families
 * hand-rolled before these existed. `rest` makes the underline the affordance,
 * `hover` keeps it as the pointer cue, and `linkTone="text"` keeps the label at
 * the READING colour so it sits inside a sentence.
 */
export const TextLinks: Story = {
  render: () => (
    <View style={{ gap: 16, alignItems: 'flex-start' }}>
      {(['text', 'primary', 'secondary'] as const).map((tone) => (
        <View key={tone} style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
          <BloomText variant="caption-1-semibold" style={{ width: 72 }}>
            {tone}
          </BloomText>
          <Button variant="link" linkTone={tone} underline="rest">
            Underlined at rest
          </Button>
          <Button variant="link" linkTone={tone} underline="hover">
            Underlined on hover
          </Button>
          <Button variant="link" linkTone={tone} underline="none">
            Never underlined
          </Button>
          <Button variant="link" linkTone={tone} underline="rest" disabled>
            Disabled
          </Button>
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
        <BloomText variant="caption-1-semibold" style={{ width: 72 }}>
          ramp
        </BloomText>
        {(['caption-1-regular', 'body-2-medium', 'body-medium', 'body-semibold', 'title-3-semibold'] as const).map(
          (step) => (
            <Button key={step} variant="link" linkTone="text" underline="rest" textVariant={step}>
              {step}
            </Button>
          ),
        )}
      </View>
    </View>
  ),
};

/** `numberOfLines={1}` truncates rather than clipping a label with no warning. */
export const TruncatedLabel: Story = {
  render: () => (
    <View style={{ gap: 12, width: 180 }}>
      <Button variant="secondary" numberOfLines={1} style={{ width: 180 }}>
        A label far longer than its button
      </Button>
      <Button variant="link" linkTone="text" underline="rest" numberOfLines={1} style={{ width: 180 }}>
        A link far longer than its box
      </Button>
    </View>
  ),
};
