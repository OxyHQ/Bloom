import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { ScrollBar } from '../layout/ScrollBar';
it('keeps native ScrollBar absent for every control scope and visual-thickness prop', () => {
  for (const scope of ['xs', 'lg'] as const) {
    for (const size of ['sm', 'md'] as const) {
      const screen = render(
        <BloomScope size={scope}>
          <ScrollBar target={{ current: null }} size={size} />
        </BloomScope>,
      );
      expect(screen.toJSON()).toBeNull();
      screen.unmount();
    }
  }
});
