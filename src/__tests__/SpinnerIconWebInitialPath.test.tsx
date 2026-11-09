import { render } from '@testing-library/react-native';

import { SpinnerIcon } from '../loading/SpinnerIcon.web';

describe('web SpinnerIcon markup', () => {
  beforeEach(() => {
    // The loop never ticks here: only the markup of the first render is under test.
    Object.assign(globalThis, {
      requestAnimationFrame: jest.fn(() => 1),
      cancelAnimationFrame: jest.fn(),
    });
  });

  it('draws its shape in the first render, before any animation frame runs', () => {
    const { UNSAFE_getByType } = render(<SpinnerIcon size={26} color="#111111" />);

    const d = UNSAFE_getByType('path' as never).props.d as string;
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });
});
