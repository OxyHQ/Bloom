import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
import {
  INDICATOR_CASES,
  IndicatorScopes,
  IndicatorSubjects,
  IndependentSubjects,
} from './support/indicator-scope-cases';
import { resolvedStyle } from './support/rendered-style';

describe.each([false, true])('native indicator parts, portalled=%s', (portalled) => {
  it.each(INDICATOR_CASES)('$name', ({ scopes, explicit, heights }) => {
    const subjects = <IndicatorSubjects size={explicit} />;
    const screen = render(
      <BloomThemeProvider>
        <PortalProvider>
          <IndicatorScopes scopes={scopes}>
            {portalled ? <Portal>{subjects}</Portal> : subjects}
          </IndicatorScopes>
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>,
    );
    expect(
      ['presence', 'unread', 'energy'].map(
        (id) => resolvedStyle(screen.getByTestId(id).props.style).height,
      ),
    ).toEqual(heights);
  });
});

it.each(['xs', 'lg'] as const)(
  'keeps document and audio artwork independent of %s control size',
  (scope) => {
    for (const explicit of [false, true]) {
      const screen = render(
        <BloomThemeProvider>
          <IndicatorScopes scopes={[scope]}>
            <IndependentSubjects explicit={explicit} />
          </IndicatorScopes>
        </BloomThemeProvider>,
      );
      expect(
        resolvedStyle(screen.getByTestId('wave', { includeHiddenElements: true }).props.style)
          .height,
      ).toBe(explicit ? 72 : 40);
      expect(resolvedStyle(screen.getByText('Paragraph').props.style).fontSize).toBe(
        explicit ? 16 : 14,
      );
      expect(resolvedStyle(screen.getByText('content').props.style).fontSize).toBe(
        explicit ? 13 : 11,
      );
      screen.unmount();
    }
  },
);
