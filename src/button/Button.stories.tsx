import React, { useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { View, Text as TextForCounter } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { CloseButton } from './CloseButton';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { Card, CardBody, CardTitle, CardDescription } from '../card';
import { LinkPreviewCard } from '../link-preview';
import { BloomScope } from '../appearance';
import { RiAddLine, RiArrowRightLine } from '../icons/remix';

const meta = {
  title: 'Base/Button', component: Button,
  parameters: { controls: { include: ['children', 'appearance', 'tone', 'size', 'disabled', 'loading', 'loadingColor', 'href'] } },
  args: { children: 'Save', appearance: 'solid', tone: 'accent', size: 'md', disabled: false, loading: false, onPress: () => {} },
  argTypes: {
    children: { control: 'text' },
    "loadingColor": { control: 'text' },
    "href": { control: 'text' },
    "target": { control: 'text' },
    "rel": { control: 'text' },
    "type": { control: 'select', options: ["button","submit","reset"] },
    "asChild": { control: 'boolean' },
    "name": { control: 'text' },
    "value": { control: 'text' },
    "title": { control: 'text' },
    "autoFocus": { control: 'boolean' },
    "tabIndex": { control: 'number' },
    appearance: { control: 'select', options: ['solid', 'subtle', 'outline', 'plain'] },
    tone: { control: 'select', options: ['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    disabled: { control: 'boolean' }, loading: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof Button>;
export const Basic: Story = {};
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <View style={{gap: 20}}>{(['solid','subtle','outline','plain'] as const).map(appearance =>
    <View key={appearance} style={{flexDirection:'row', gap:12, flexWrap:'wrap'}}>
      {(['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'] as const).map(tone =>
        <Button key={tone} appearance={appearance} tone={tone} leadingIcon={RiAddLine}>{tone}</Button>)}
    </View>)}</View>,
};
export const Sizes: Story = {
  parameters: { controls: { disable: true } }, render: () => <View style={{gap:12,alignItems:'flex-start'}}>{(['xs','sm','md','lg'] as const).map(size => <Button key={size} size={size}>{size}</Button>)}</View> };
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Icon: Story = { args: { icon: RiAddLine, accessibilityLabel: 'Add item', children: undefined } };
export const Link: Story = { args: { href: '#', appearance: 'plain', children: 'Learn more', trailingIcon: RiArrowRightLine } };
export const Inherited: Story = {
  parameters: { controls: { disable: true } },
  render: () => <BloomScope size="lg" tone="success"><View style={{gap:12,alignItems:'flex-start'}}>
    <Button>Inherited</Button><Button tone="danger" size="sm">Explicit override</Button>
    <BloomScope size="xs"><Button>Nested size, inherited tone</Button></BloomScope>
  </View></BloomScope>,
};
export const CloseButtons: Story = {
  parameters: { controls: { disable: true } }, render: () => <View style={{flexDirection:'row',gap:16}}>{(['xs','sm','md','lg'] as const).map(size => <CloseButton key={size} size={size} accessibilityLabel="Close" />)}</View> };

function PlaygroundGroup({ size }: { size: 'md' | 'sm' }) {
  const [checked, setChecked] = useState('Week');
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
    <ButtonGroup size={size} accessibilityLabel={`Range ${size}`}>
      {['Day', 'Week', 'Month'].map(label => <ButtonGroupItem key={label} checked={checked === label} onPress={() => setChecked(label)}>{label}</ButtonGroupItem>)}
    </ButtonGroup>
    <ButtonGroup size={size} accessibilityLabel={`Actions ${size}`}>
      <ButtonGroupItem leadingIcon={RiAddLine}>Add</ButtonGroupItem>
      <ButtonGroupItem disabled>Disabled</ButtonGroupItem>
    </ButtonGroup>
  </div>;
}

/** Approved material on the latest semantic Button API. */
export const GlassPlayground: Story = {
  render: () => (
    <div style={{ padding: 28, borderRadius: 24, backgroundImage: 'url(https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/flowers.jpg)', backgroundSize: '500px auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: 20 }}>
        {(['solid', 'subtle', 'outline', 'plain'] as const).map(appearance => (
          <div key={appearance} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(['accent', 'neutral', 'danger', 'support', 'action'] as const).map(tone => <Button key={tone} appearance={appearance} tone={tone}>{appearance} · {tone}</Button>)}
            <Button appearance={appearance} disabled>Disabled {appearance}</Button>
            <Button appearance={appearance} loading>Loading</Button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: 20 }}>
        <PlaygroundGroup size="md" /><PlaygroundGroup size="sm" />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: 20 }}>
        <Card testID="glass-card" style={{ width: 280, maxWidth: '100%' }}>
          <CardBody><CardTitle>Shared Surface</CardTitle><CardDescription>Card owns the shape; Surface paints the material.</CardDescription></CardBody>
        </Card>
        <LinkPreviewCard url="https://oxy.so" title="Oxy" description="Link preview inherits the Card material." onPress={() => {}} style={{ width: 280, maxWidth: '100%' }} />
      </div>
    </div>
  ),
};

export const Flat: Story = {
  render: () => <View style={{ gap: 16, alignItems: 'flex-start' }}>
    <Button material="flat" colors={{ background: '#5433eb', foreground: '#ffffff' }} testID="flat-button">Flat action</Button>
    <Button colors={{ background: '#5433eb', foreground: '#ffffff' }} testID="surface-button">Surface action</Button>
    <Button material="flat" disabled testID="flat-disabled">Unavailable</Button>
  </View>,
};

/** Loading may hide content, but must not reset its state or alter geometry. */
export const LoadingIdentity: Story = {
  render: function LoadingIdentityDemo() {
    const [loading, setLoading] = useState(false);
    return <View style={{ gap: 24, padding: 24, alignItems: 'flex-start' }}>
      <Button testID="toggle-loading" onPress={() => setLoading(value => !value)}>Toggle loading</Button>
      <Button testID="loading-content" loading={loading} leadingIcon={RiAddLine} trailingIcon={RiArrowRightLine}>
        <LoadingCounter />
      </Button>
      <View style={{ width: 360, maxWidth: '100%' }}>
        <Button testID="loading-wide" loading={loading} style={{ width: '100%', height: 52 }}>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}><LoadingCounter /><LoadingCounter /></View>
        </Button>
      </View>
      <Button testID="loading-icon" iconOnly accessibilityLabel="Count" loading={loading}><LoadingCounter /></Button>
      <Button asChild loading={loading}><a data-testid="loading-link" href="#loading"><LoadingCounter /></a></Button>
    </View>;
  },
};

let nextCounterId = 0;
function LoadingCounter() {
  const [id] = useState(() => ++nextCounterId);
  return <View testID={`loading-counter-${id}`}><TextForCounter>{id}</TextForCounter></View>;
}

export const ClassNameAuthority: Story = {
  render: function ClassNameAuthorityDemo() {
    const [loading, setLoading] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const reduce = usePrefersReducedMotion();
    const className = ['bloom-demo-purchase', disabled ? 'bloom-demo-purchase-disabled' : '',
      !loading && !disabled ? 'bloom-demo-purchase-interactive' : '',
      !loading && !disabled && !reduce ? 'bloom-demo-purchase-motion' : ''].join(' ');
    return <View style={{ gap: 20, padding: 32, alignItems: 'flex-start' }}>
      <Button testID="class-toggle-loading" onPress={() => setLoading(value => !value)}>Toggle loading</Button>
      <Button testID="class-toggle-disabled" onPress={() => setDisabled(value => !value)}>Toggle disabled</Button>
      <Button material="flat" className={className} testID="class-purchase" loading={loading} disabled={disabled} leadingIcon={RiAddLine}>Purchase</Button>
      <Button material="flat" className={className} testID="class-stateful" loading={loading} disabled={disabled}><LoadingCounter /></Button>
      <Button material="flat" className="bloom-demo-purchase bloom-demo-secondary" testID="class-secondary">Secondary</Button>
      <Button material="flat" className="bloom-demo-purchase bloom-demo-outline" testID="class-outline">Outline</Button>
      <Button className="ms-0" testID="class-default">Default</Button>
      <Button testID="no-class-default">Default</Button>
    </View>;
  },
};
