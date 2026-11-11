/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Announcement } from '../announcement';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ scope, nestedScope }: { scope?: BloomSize; nestedScope?: BloomSize }) {
  const announcement = (
    <Announcement
      title="Upgrade to Pro"
      actionLabel="Upgrade now"
      dismissible
      closeLabel="Hide announcement"
    />
  );
  return (
    <BloomThemeProvider fonts={false} mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{announcement}</BloomScope> : announcement}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps explicitly sized announcement controls stable under BloomScope in DOM web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderSubject = (props?: { scope?: BloomSize; nestedScope?: BloomSize }) =>
    act(() => root.render(<Subject {...props} />));
  const height = (label: string) => {
    const control =
      label === 'Upgrade now'
        ? [...host.querySelectorAll<HTMLElement>('button')].find((button) =>
            button.textContent?.includes(label),
          )
        : host.querySelector<HTMLElement>(`[aria-label="${label}"]`);
    if (!control) throw new Error(`Announcement did not render control ${label}`);
    return getComputedStyle(control).height;
  };
  try {
    renderSubject();
    expect(height('Upgrade now')).toBe('32px');
    expect(height('Hide announcement')).toBe('20px');
    renderSubject({ scope: 'xs' });
    expect(height('Upgrade now')).toBe('32px');
    expect(height('Hide announcement')).toBe('20px');
    renderSubject({ scope: 'lg' });
    expect(height('Upgrade now')).toBe('32px');
    expect(height('Hide announcement')).toBe('20px');
    renderSubject({ scope: 'xs', nestedScope: 'lg' });
    expect(height('Upgrade now')).toBe('32px');
    expect(height('Hide announcement')).toBe('20px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
