import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import { AvatarGroup } from '..';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';

const character = { preset: 'blue_beret' };

function renderGroup(items: Parameters<typeof AvatarGroup>[0]['items'], total?: number) {
  return render(
    <BloomThemeProvider>
      <AvatarGroup layout="cluster" size={64} items={items} total={total} max={3} testID="g" />
    </BloomThemeProvider>,
  );
}

describe('AvatarGroup with characters', () => {
  it('draws a character unclipped, with a gap instead of a circular cell', () => {
    const { getByTestId } = renderGroup([
      { id: 'a', name: 'Alia', kind: 'bot', character },
      { id: 'b', name: 'Codea', kind: 'bot', character },
    ]);
    const face = getByTestId('g-face-0');
    expect(face).toBeTruthy();
  });

  it('shows the overflow as a bare count beside characters, a chip beside photos', () => {
    const bots = renderGroup(
      [
        { id: 'a', name: 'Alia', kind: 'bot', character },
        { id: 'b', name: 'Codea', kind: 'bot', character },
        { id: 'c', name: 'Kai', kind: 'bot', character },
      ],
      6,
    );
    expect(bots.getByText('+4')).toBeTruthy();
    const style = StyleSheet.flatten(bots.getByText('+4').props.style).color;
    expect(style).not.toBe('#FFFFFF');

    const people = renderGroup(
      [
        { id: 'a', name: 'Ada' },
        { id: 'b', name: 'Bo' },
        { id: 'c', name: 'Cy' },
      ],
      6,
    );
    expect(StyleSheet.flatten(people.getByText('+4').props.style).color).toBe('#FFFFFF');
  });
});
