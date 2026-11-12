import { render } from '@testing-library/react-native';
import { BloomScope } from '../../appearance';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { AvatarFlightLayer } from '../AvatarFlightLayer';
import type { AvatarFlights } from '../use-avatar-flights';
import type { AvatarFlightSpec } from '../types';

const character = { shape: 'blob' } as unknown as AvatarFlightSpec['character'];
const layer = {
  flights: [
    {
      spec: { key: 'moving', from: 'from', to: 'to', character },
      from: { x: 12, y: 18, width: 48, height: 40 },
      snapshot: { uri: 'avatar.png' },
    },
  ],
  arrived: [],
  node: () => undefined,
  arrive: () => {},
  finish: () => {},
} as unknown as AvatarFlights['layer'];

it.each([undefined, 'xs', 'sm', 'md', 'lg'] as const)(
  'keeps measured flight artwork geometry fixed under %s scope',
  (size) => {
    const runtime = globalThis as typeof globalThis & {
      requestAnimationFrame?: (callback: FrameRequestCallback) => number;
      cancelAnimationFrame?: (handle: number) => void;
    };
    const priorRequest = runtime.requestAnimationFrame;
    const priorCancel = runtime.cancelAnimationFrame;
    runtime.requestAnimationFrame = () => 1;
    runtime.cancelAnimationFrame = () => {};
    const content = <AvatarFlightLayer flights={{ layer } as AvatarFlights} />;
    try {
      const view = render(
        <BloomThemeProvider fonts={false}>
          {size ? <BloomScope size={size}>{content}</BloomScope> : content}
        </BloomThemeProvider>,
      );
      const tree = JSON.stringify(view.toJSON());
      expect(tree).toContain('"width":48');
      expect(tree).toContain('"height":40');
      view.unmount();
    } finally {
      runtime.requestAnimationFrame = priorRequest;
      runtime.cancelAnimationFrame = priorCancel;
    }
  },
);
