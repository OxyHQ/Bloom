/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Button } from '../button/Button.web';
import { Text } from 'react-native';
import { ConcentricView } from '../concentric/ConcentricView';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type SubjectProps = {
  scope?: BloomSize;
  nestedScope?: BloomSize;
  explicitSize?: BloomSize;
};

function Subject({ scope, nestedScope, explicitSize }: SubjectProps) {
  const control = (
    <Button testID="action" size={explicitSize}>
      <Text>Action</Text>
    </Button>
  );
  return (
    <BloomThemeProvider fonts={false} mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        <ConcentricView radius={32} style={{ padding: 8 }} testID="outer">
          <ConcentricView style={{ padding: 4 }} testID="inner">
            {nestedScope ? <BloomScope size={nestedScope}>{control}</BloomScope> : control}
          </ConcentricView>
        </ConcentricView>
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps corner geometry independent while nested wrappers preserve control-size scope', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderSubject = (props?: SubjectProps) => act(() => root.render(<Subject {...props} />));
  const action = () => host.querySelector<HTMLElement>('[data-testid="action"]');
  try {
    renderSubject();
    expect(action()?.style.height).toBe('36px');
    expect(
      host.querySelector<HTMLElement>('[data-testid="outer"]')?.style.borderTopLeftRadius,
    ).toBe('32px');

    renderSubject({ scope: 'xs' });
    expect(action()?.style.height).toBe('24px');
    renderSubject({ scope: 'lg' });
    expect(action()?.style.height).toBe('44px');
    renderSubject({ scope: 'xs', nestedScope: 'lg' });
    expect(action()?.style.height).toBe('44px');
    renderSubject({ scope: 'xs', explicitSize: 'md' });
    expect(action()?.style.height).toBe('36px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
