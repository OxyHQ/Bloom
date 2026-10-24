import { act, render } from '@testing-library/react-native';
import type { SharedValue } from 'react-native-reanimated';

import type { DialogProps } from '../dialog';
import { present } from '../surfaces';
import { createSurfaceHost } from '../surfaces/SurfaceHost';
import { __resetSurfacesForTests, resetSurfaces } from '../surfaces/surface-store';

afterEach(() => {
  resetSurfaces();
  __resetSurfacesForTests();
});

describe('surface presentation', () => {
  it('hands the sheet progress and backdrop paint to its Dialog', () => {
    const captured: { props?: DialogProps } = {};
    const MockDialog = (props: DialogProps) => {
      captured.props = props;
      return null;
    };
    const { SurfaceHost } = createSurfaceHost(MockDialog);
    render(<SurfaceHost />);

    const progress = { value: 0 } as SharedValue<number>;
    const backdrop = { blurIntensity: 0, dimOpacity: 0 };
    act(() => {
      void present(() => null, { progress, backdrop });
    });

    expect(captured.props?.progress).toBe(progress);
    expect(captured.props?.backdrop).toBe(backdrop);
  });
});
