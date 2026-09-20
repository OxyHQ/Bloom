import React from 'react';
import { resolvedStyle, findHost } from './support/rendered-style';
import { fireEvent, render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { buildTheme } from '../theme/build-theme';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Badge } from '../badge';
import { Chip } from '../chip';
import { Card, CardTitle, CardDescription } from '../card';
import { hostNodes } from './support/rendered-style';
import { Switch } from '../switch';
import { TextFieldInput } from '../text-field';

function mount(children: React.ReactNode) {
  return render(<BloomThemeProvider mode="light" colorPreset="oxy">{children}</BloomThemeProvider>);
}

it('inherits scale and tone across distinct controls, with explicit and nested overrides', () => {
  const screen = mount(<BloomScope size="lg" tone="danger">
    <Badge testID="outer" content="1" />
    <BloomScope size="xs"><Badge testID="nested" content="2" /><Badge testID="explicit" size="md" tone="success" content="3" /></BloomScope>
    <Chip testID="chip" appearance="solid">Danger</Chip>
  </BloomScope>);
  const outer = resolvedStyle(findHost(screen.toJSON(), 'outer')?.props.style);
  const nested = resolvedStyle(findHost(screen.toJSON(), 'nested')?.props.style);
  const explicit = resolvedStyle(findHost(screen.toJSON(), 'explicit')?.props.style);
  const chip = resolvedStyle(findHost(screen.toJSON(), 'chip')?.props.style);
  expect([outer.height, nested.height, explicit.height, chip.height]).toEqual([24, 14, 18, 28]);
  expect(nested.backgroundColor).toBe(outer.backgroundColor);
  expect(chip.backgroundColor).toBe(outer.backgroundColor);
  expect(explicit.backgroundColor).not.toBe(outer.backgroundColor);
});

it('reports semantic values from boolean and text controls', () => {
  const onCheckedChange = jest.fn();
  const onValueChange = jest.fn();
  const screen = mount(<>
    <Switch testID="switch" checked={false} onCheckedChange={onCheckedChange} accessibilityLabel="Notifications" />
    <TextFieldInput label="Name" value="" onValueChange={onValueChange} />
  </>);
  fireEvent.press(screen.getByTestId('switch'));
  fireEvent.changeText(screen.getByLabelText('Name'), 'Bloom');
  expect(onCheckedChange).toHaveBeenCalledWith(true);
  expect(onValueChange).toHaveBeenCalledWith('Bloom');
});

it('uses the semantic card foreground for title and description', () => {
  const screen = mount(<Card tone="danger" appearance="solid"><CardTitle>Title</CardTitle><CardDescription>Detail</CardDescription></Card>);
  const text = hostNodes(screen.toJSON()).filter(node => node.type === 'Text');
  expect(text).toHaveLength(2);
  const title = resolvedStyle(text[0]?.props.style);
  const detail = resolvedStyle(text[1]?.props.style);
  expect(title.color).toBe(detail.color);
  expect(title.color).toBeTruthy();
});

it('composes toggle and action callbacks while disabled toggles stay inert', () => {
  const onCheckedChange = jest.fn();
  const onPress = jest.fn();
  const screen = mount(<>
    <Chip testID="toggle" checked={false} onCheckedChange={onCheckedChange} onPress={onPress}>Filter</Chip>
    <Chip testID="disabled-toggle" checked disabled onCheckedChange={onCheckedChange}>Disabled</Chip>
  </>);
  fireEvent.press(screen.getByTestId('toggle'));
  expect(onCheckedChange).toHaveBeenCalledWith(true);
  expect(onPress).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByTestId('disabled-toggle'));
  expect(onCheckedChange).toHaveBeenCalledTimes(1);
});


it('inherits action/support roles and preserves explicit accent selection', () => {
  const colors = buildTheme('oxy', 'light').colors;
  const screen = mount(<BloomScope tone="action">
    <Badge testID="action" content="Action" />
    <Chip testID="action-chip" appearance="solid">Create</Chip>
    <BloomScope tone="support"><Badge testID="support" content="Support" /><Badge testID="identity" tone="accent" content="Identity" /></BloomScope>
  </BloomScope>);
  const background = (id: string) => resolvedStyle(findHost(screen.toJSON(), id)?.props.style).backgroundColor;
  expect(background('action')).toBe(colors.tertiary);
  expect(background('action-chip')).toBe(colors.tertiary);
  expect(background('support')).toBe(colors.secondary);
  expect(background('identity')).toBe(colors.primary);
});
