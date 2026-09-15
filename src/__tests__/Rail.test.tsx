import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Rail } from '../rail';
import type { RailItem } from '../rail/types';

/** Stand-in for a consumer's own icon set, tagged so a test can tell the two states apart. */
function BareIcon({ id }: { id: string }) {
  return React.createElement('bloom-test-icon', { testID: id });
}

const ITEMS: RailItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <BareIcon id="home-icon" />,
    activeIcon: <BareIcon id="home-icon-active" />,
  },
  { id: 'devices', label: 'Devices', icon: <BareIcon id="devices-icon" /> },
];

function renderRail(props: Partial<React.ComponentProps<typeof Rail>> = {}) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <Rail items={ITEMS} onSelect={() => {}} {...props} />
    </BloomThemeProvider>,
  );
}

describe('Rail', () => {
  it('renders every item label', () => {
    const { getByText } = renderRail();
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Devices')).toBeTruthy();
  });

  it('announces the active item as selected and every other item as not', () => {
    const { getByLabelText } = renderRail({ activeId: 'home' });
    expect(getByLabelText('Home').props['aria-selected']).toBe(true);
    expect(getByLabelText('Devices').props['aria-selected']).toBe(false);
  });

  it('leaves nothing selected when activeId names no item', () => {
    const { getByLabelText } = renderRail({ activeId: 'nonexistent' });
    expect(getByLabelText('Home').props['aria-selected']).toBe(false);
    expect(getByLabelText('Devices').props['aria-selected']).toBe(false);
  });

  it('renders the active item\'s activeIcon in place of its icon', () => {
    const { getByTestId, queryByTestId } = renderRail({ activeId: 'home' });
    expect(getByTestId('home-icon-active')).toBeTruthy();
    expect(queryByTestId('home-icon')).toBeNull();
  });

  it('falls back to icon for an active item with no activeIcon', () => {
    const { getByTestId } = renderRail({ activeId: 'devices' });
    expect(getByTestId('devices-icon')).toBeTruthy();
  });

  it('calls onSelect with the pressed item\'s id', () => {
    const onSelect = jest.fn();
    const { getByLabelText } = renderRail({ onSelect });
    fireEvent.press(getByLabelText('Devices'));
    expect(onSelect).toHaveBeenCalledWith('devices');
  });

  it('defaults to an 80px width and honors a custom one', () => {
    const defaultRender = renderRail({ testID: 'default-rail' });
    expect(widthIn(defaultRender.getByTestId('default-rail').props.style)).toBe(80);
    const customRender = renderRail({ testID: 'custom-rail', width: 64 });
    expect(widthIn(customRender.getByTestId('custom-rail').props.style)).toBe(64);
  });
});

/** `styled()`'s `style` prop nests arrays; find the resolved `width` anywhere inside. */
function widthIn(style: unknown): unknown {
  if (Array.isArray(style)) {
    for (const entry of style) {
      const found = widthIn(entry);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (style !== null && typeof style === 'object' && 'width' in style) {
    return (style as { width: unknown }).width;
  }
  return undefined;
}
