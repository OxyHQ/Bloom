import { act, render, renderHook } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AvatarAnchor } from '../AvatarAnchor';
import { useAvatarFlights } from '../use-avatar-flights';
import type { AvatarFlightSpec } from '../types';

const character = { shape: 'blob' } as unknown as AvatarFlightSpec['character'];

describe('AvatarAnchor', () => {
  it('registers its box under the anchor key and shows its avatar at rest', () => {
    const { result } = renderHook(() => useAvatarFlights());
    const view = render(
      <AvatarAnchor flights={result.current} anchor="a">
        <Text>avatar</Text>
      </AvatarAnchor>,
    );
    expect(view.getByText('avatar')).toBeTruthy();
    expect(view.toJSON()).toMatchObject({ props: { style: [undefined, null] } });
  });

  it('hides itself while an avatar is in the air to it, and appears when it lands', async () => {
    const { result } = renderHook(() => useAvatarFlights());
    const source = {
      measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) =>
        cb(0, 0, 50, 50),
    };
    act(() => {
      result.current.anchor('from')(source as never);
    });
    const spec: AvatarFlightSpec = { key: 'k', character, from: 'from', to: 'to' };
    await act(async () => {
      await result.current.launch([spec]);
    });
    const view = render(
      <AvatarAnchor flights={result.current} anchor="to">
        <Text>avatar</Text>
      </AvatarAnchor>,
    );
    expect(JSON.stringify(view.toJSON())).toContain('"opacity":0');
    act(() => result.current.layer.arrive('k'));
    view.rerender(
      <AvatarAnchor flights={result.current} anchor="to">
        <Text>avatar</Text>
      </AvatarAnchor>,
    );
    expect(JSON.stringify(view.toJSON())).not.toContain('"opacity":0');
  });
});
