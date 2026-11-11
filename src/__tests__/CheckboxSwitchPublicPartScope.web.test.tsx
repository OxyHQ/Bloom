/** @jest-environment jsdom */
import type { ReactNode } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope, type BloomSize } from '../appearance';
import { Checkbox } from '../checkbox';
import { Portal } from '../portal/Portal.web';
import { Switch } from '../switch';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subjects({ explicit }: { explicit?: boolean }) {
  const size = explicit ? 'lg' : undefined;
  return (
    <>
      <Checkbox label="Accept terms" checked size={size} testID="checkbox" />
      <Switch accessibilityLabel="Notifications" checked size={size} testID="switch" />
    </>
  );
}

function Tree({
  scopes,
  explicit = false,
  portalled = false,
  omittedNestedScope = false,
}: {
  scopes: BloomSize[];
  explicit?: boolean;
  portalled?: boolean;
  omittedNestedScope?: boolean;
}) {
  const subjects = <Subjects explicit={explicit} />;
  const wrapped = <View>{portalled ? <Portal>{subjects}</Portal> : subjects}</View>;
  const base = omittedNestedScope ? <BloomScope>{wrapped}</BloomScope> : wrapped;
  const inScopes = (index: number): ReactNode => {
    const size = scopes[index];
    return size === undefined ? (
      base
    ) : (
      <BloomScope key={`${index}-${size}`} size={size}>
        {inScopes(index + 1)}
      </BloomScope>
    );
  };
  return <BloomThemeProvider fonts={false}>{inScopes(0)}</BloomThemeProvider>;
}

function measure() {
  const element = (testID: string) => {
    const node = document.body.querySelector<HTMLElement>(`[data-testid="${testID}"]`);
    if (!node) throw new Error(`Missing rendered part ${testID}`);
    return node;
  };
  const checkbox = Array.from(element('checkbox').querySelectorAll<HTMLElement>('*'))
    .map((node) => getComputedStyle(node))
    .find(
      (style) =>
        /^\d+(?:\.\d+)?px$/.test(style.width) &&
        style.width === style.height &&
        Number.parseFloat(style.width) >= 12,
    );
  const track = Array.from(element('switch').querySelectorAll<HTMLElement>('*'))
    .map((node) => getComputedStyle(node))
    .find(
      (style) =>
        /^\d+(?:\.\d+)?px$/.test(style.width) &&
        Number.parseFloat(style.width) >= 30 &&
        /^\d+(?:\.\d+)?px$/.test(style.height) &&
        Number.parseFloat(style.height) >= 18,
    );
  if (!checkbox || !track) throw new Error('Missing control geometry');
  return {
    checkbox: Number.parseFloat(checkbox.width),
    switch: [Number.parseFloat(track.width), Number.parseFloat(track.height)],
  };
}

it.each([
  { name: 'default', scopes: [], expected: { checkbox: 16, switch: [44, 26] } },
  { name: 'nearest xs', scopes: ['xs'], expected: { checkbox: 12, switch: [30, 18] } },
  {
    name: 'nested lg over xs',
    scopes: ['xs', 'lg'],
    expected: { checkbox: 20, switch: [52, 30] },
  },
  {
    name: 'actual portal with wrappers',
    scopes: ['sm'],
    portalled: true,
    omittedNestedScope: true,
    expected: { checkbox: 14, switch: [36, 22] },
  },
  {
    name: 'explicit lg overrides xs',
    scopes: ['xs'],
    explicit: true,
    expected: { checkbox: 20, switch: [52, 30] },
  },
] as const)(
  '$name is resolved by Checkbox and Switch in the web DOM',
  ({ scopes, explicit, portalled, omittedNestedScope, expected }) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() =>
        root.render(
          <Tree
            scopes={[...scopes]}
            explicit={explicit}
            portalled={portalled}
            omittedNestedScope={omittedNestedScope}
          />,
        ),
      );
      expect(measure()).toEqual(expected);
    } finally {
      act(() => root.unmount());
      host.remove();
      document.getElementById('bloom-portal-root')?.remove();
    }
  },
);
