import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button, IconButton, LinkButton } from './Button';
import { CloseButton } from './CloseButton';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { Card, CardBody, CardTitle, CardDescription } from '../card';
import { LinkPreviewCard } from '../link-preview';
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

/** Compare the actual label, icon and spinner at every fixed control height. */
export const Alignment: Story = {
  render: function AlignmentStory() {
    const [guides, setGuides] = React.useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={guides} onChange={event => setGuides(event.target.checked)} />
          Show centre guides
        </label>
        {(['primary', 'secondary'] as const).map(variant => (
          <div key={variant} style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {(['xs', 'small', 'medium', 'large'] as const).map(size => (
              <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
                <BloomText variant="caption-1-semibold">{variant} / {size}</BloomText>
                {(['label', 'both', 'icon', 'loading'] as const).map(content => (
                  <div key={content} style={{ position: 'relative', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Button
                      variant={variant}
                      size={size}
                      leadingIcon={content === 'both' || content === 'icon' ? Plus : undefined}
                      iconOnly={content === 'icon'}
                      loading={content === 'loading'}
                      accessibilityLabel={content === 'icon' ? 'Add' : undefined}
                      testID={`alignment-${variant}-${size}-${content}`}
                    >Button</Button>
                    {guides ? <div aria-hidden="true" style={{ position: 'absolute', insetInline: 0, top: '50%', borderTop: '1px solid rgba(244, 63, 94, .7)', pointerEvents: 'none' }} /> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  },
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

function GlassPlaygroundGroup({ size }: { size: 'medium' | 'small' }) {
  const [selected, setSelected] = useState('Week');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <ButtonGroup size={size} accessibilityLabel={`Glass range · ${size}`}>
        {(['Day', 'Week', 'Month'] as const).map(value => (
          <ButtonGroupItem key={value} selected={selected === value} onPress={() => setSelected(value)}>
            {value}
          </ButtonGroupItem>
        ))}
      </ButtonGroup>
      <ButtonGroup size={size} accessibilityLabel={`Glass actions · ${size}`}>
        <ButtonGroupItem disabled>Disabled</ButtonGroupItem>
        <ButtonGroupItem iconOnly leadingIcon={RiMore2Line} accessibilityLabel="More range options" />
      </ButtonGroup>
    </div>
  );
}

/** The real buttons, with backdrops that make transparency visible. */
export const GlassPlayground: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ padding: 32, maxWidth: 1120, margin: 'auto', fontFamily: 'var(--bloom-font-sans, sans-serif)' }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>A little light. A clearer action.</h1>
      <p style={{ opacity: 0.65, marginBottom: 28 }}>Move over a button, press it, or use Tab to explore its focus state.</p>
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          <filter id="bloom-story-codepen-reference" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="1" seed="8" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="3" result="smooth-noise" />
            <feDisplacementMap in="SourceGraphic" in2="smooth-noise" scale="150" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <p style={{ opacity: 0.7 }}>Reference layers beside Bloom's real buttons. Every surface shares the refracted material, including disabled controls; brand buttons retain their saturated colour. The reference keeps its original white tint.</p>
      {[
        'url(https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/flowers.jpg) center / 500px',
        'repeating-linear-gradient(115deg, #163d59 0px 5px, #eee8d4 5px 15px, #b57851 15px 20px, #eee8d4 20px 30px)',
        'url(https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1600&auto=format&fit=crop&q=85) center 55% / cover',
      ].map((background, index) => (
        <section key={index} style={{ background, borderRadius: 24, padding: 32, marginBottom: 20, minHeight: 160, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <p style={{ background: '#fff', color: '#17251e', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>CodePen material · reference</p>
            <button type="button" style={{ position: 'relative', isolation: 'isolate', overflow: 'hidden', border: 0, borderRadius: 999, padding: '0 16px', height: 44, background: 'transparent', color: '#17251e', font: 'inherit', fontWeight: 500, cursor: 'pointer' }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', zIndex: -2, backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', filter: 'url(#bloom-story-codepen-reference)', pointerEvents: 'none' }} />
              <span style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', zIndex: -1, background: 'rgba(255,255,255,.25)', boxShadow: 'inset 2px 2px 1px rgba(255,255,255,.5), inset -1px -1px 1px 1px rgba(255,255,255,.5)', pointerEvents: 'none' }} />
              Explore
            </button>
          </div>
          <div>
            <p style={{ background: '#fff', color: '#17251e', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>Bloom · secondary</p>
            <Button variant="secondary" size="large">Explore</Button>
          </div>
          <div>
            <p style={{ background: '#fff', color: '#17251e', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>Bloom · primary</p>
            <Button size="large">Explore</Button>
          </div>
          <div style={{ flexBasis: '100%' }}>
            <p style={{ background: '#fff', color: '#17251e', padding: '4px 8px', borderRadius: 6, fontSize: 12, width: 'fit-content' }}>Bloom · grouped · medium / small</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              <GlassPlaygroundGroup size="medium" />
              <GlassPlaygroundGroup size="small" />
            </div>
          </div>
        </section>
      ))}
      {[
        { name: 'Quiet surface', background: 'linear-gradient(125deg, #dde9df, #edf0fa)' },
        { name: 'Through the pattern', background: 'repeating-conic-gradient(#d2bde8 0% 25%, #efdfca 0% 50%) 0 / 44px 44px' },
        { name: 'Over a landscape', background: 'url(https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1600&auto=format&fit=crop&q=85) center 55% / cover' },
      ].map(backdrop => (
        <section key={backdrop.name} style={{ background: backdrop.background, borderRadius: 24, padding: 28, marginBottom: 20, minHeight: 210 }}>
          <h2 style={{ color: '#17251e', background: 'rgba(255,255,255,.8)', padding: '5px 10px', borderRadius: 8, fontSize: 13, display: 'inline-block', margin: '0 0 28px' }}>{backdrop.name}</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button size="large" leadingIcon={Plus}>Create something</Button>
            <Button variant="secondary" size="large">Explore</Button>
            <Button variant="outline" size="large">Details</Button>
            <Button variant="destructive" size="large" leadingIcon={Trash}>Delete</Button>
            <IconButton size="large" icon={RiMore2Line} accessibilityLabel="More options" />
            <Button variant="inverse" size="large">Continue</Button>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 20 }}>
            <Button loading>Saving</Button>
            <Button disabled>Unavailable</Button>
            <Button variant="secondary" loading>Loading</Button>
            <Button variant="secondary" disabled>Disabled</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </section>
      ))}
      <section style={{ background: 'url(https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/flowers.jpg) center / 500px', borderRadius: 24, padding: 28, marginBottom: 24 }}>
        <h2 style={{ color: '#17251e', background: '#fff', padding: 8, borderRadius: 8, display: 'inline-block', fontSize: 16 }}>One material, every surface state</h2>
        {(['primary', 'destructive', 'secondary', 'outline', 'icon', 'ghost', 'inverse'] as const).map(variant => (
          <div key={variant} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 14 }}>
            <span style={{ background: '#fff', color: '#17251e', padding: '4px 8px', borderRadius: 6, width: 90, fontSize: 12 }}>{variant}</span>
            <Button variant={variant} testID={`glass-${variant}-enabled`} accessibilityLabel={`${variant} enabled`} icon={variant === 'icon' ? RiMore2Line : undefined}>Enabled</Button>
            <Button variant={variant} testID={`glass-${variant}-disabled`} disabled accessibilityLabel={`${variant} disabled`} icon={variant === 'icon' ? RiMore2Line : undefined}>Disabled</Button>
            <Button variant={variant} testID={`glass-${variant}-loading`} loading accessibilityLabel={`${variant} loading`} icon={variant === 'icon' ? RiMore2Line : undefined}>Loading</Button>
          </div>
        ))}
      </section>
      <section style={{ background: 'repeating-linear-gradient(115deg, #163d59 0px 5px, #eee8d4 5px 15px, #b57851 15px 20px, #eee8d4 20px 30px)', borderRadius: 24, padding: 24, marginBottom: 24 }}>
        <h2 style={{ background: '#fff', color: '#17251e', padding: 8, borderRadius: 8, display: 'inline-block', fontSize: 16 }}>Card and link preview · shared Surface</h2>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Card testID="glass-card" style={{ width: 280, maxWidth: '100%' }}>
            <CardBody>
              <CardTitle>A shared surface</CardTitle>
              <CardDescription>Card owns its shape. Surface paints the glass.</CardDescription>
            </CardBody>
          </Card>
          <LinkPreviewCard url="https://oxy.so" title="Oxy" description="A link preview built on the same Card." style={{ width: 280, maxWidth: '100%' }} onPress={() => {}} />
        </div>
      </section>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button size="xs">Extra small</Button><Button size="small">Small</Button>
        <Button size="medium">Medium</Button><Button size="large">Large</Button>
        <Button variant="text">Text action</Button><LinkButton href="#">Read more</LinkButton>
      </div>
    </div>
  ),
};
