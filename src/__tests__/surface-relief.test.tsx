import { render } from '@testing-library/react-native';
import { SurfacePaint } from '../surface/SurfacePaint';
import { resolveSurfaceOptics } from '../surface/shared';
import { ReducedTransparencyProvider } from '../theme/reduced-transparency';
import { IncreasedContrastProvider } from '../theme/increased-contrast';
import { contrastRatio } from '../styles/color-contrast';
import { resolvedStyle } from './support/rendered-style';

jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({ isDark: false, colors: { text: '#17251e' } }),
}));

it('adds relief to the existing native paint without replacing explicit tint alpha', () => {
  const tree = render(<SurfacePaint testID="paint" fill="rgba(18,52,86,.5)" radius={12} />);
  const style = resolvedStyle(tree.getByTestId('paint').props.style);
  expect(style.backgroundColor).toBe('rgba(18,52,86,.5)');
  expect(style.boxShadow).toContain(resolveSurfaceOptics(false).bodyShadow);
  expect(style.experimental_backgroundImage).toBeUndefined();
});

it('lets a host opt out of sheen while retaining its independent edge', () => {
  const tree = render(<SurfacePaint testID="paint" fill="#123456" sheen={false} />);
  const style = resolvedStyle(tree.getByTestId('paint').props.style);
  const optics = resolveSurfaceOptics(false);
  expect(style.boxShadow).toBe(optics.rim);
  expect(style.backgroundColor).toBe('#123456');
});

it('removes relief under reduced transparency and keeps the opaque body', () => {
  const tree = render(
    <ReducedTransparencyProvider value>
      <SurfacePaint testID="paint" fill="#123456" />
    </ReducedTransparencyProvider>,
  );
  const style = resolvedStyle(tree.getByTestId('paint').props.style);
  expect(style.backgroundColor).toBe('#123456');
  expect(String(style.boxShadow)).not.toContain(resolveSurfaceOptics(false).bodyShadow);
});

it('keeps the contrast hairline authoritative instead of a decorative shadow', () => {
  const tree = render(
    <ReducedTransparencyProvider value>
      <IncreasedContrastProvider value>
        <SurfacePaint testID="paint" fill="#f4f4f6" />
      </IncreasedContrastProvider>
    </ReducedTransparencyProvider>,
  );
  const style = resolvedStyle(tree.getByTestId('paint').props.style);
  expect(style.boxShadow).toBeUndefined();
  expect(style.borderWidth).toBe(1);
  expect(contrastRatio(String(style.borderColor), '#f4f4f6')).toBeGreaterThanOrEqual(3);
});
