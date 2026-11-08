/**
 * A settings rail's selection moving draws again only the two rows it moves between, never every
 * row, with the platform's keyboard (the rail one Tab stop, its rows roving) as without it: a
 * settings application's rail has a row for every page, and drawing all of them again at each page
 * shown was a third of what showing a page cost in OxyOS's Settings. Counted by each row's icon,
 * which its row draws whenever it renders; the groups are the same objects for as long as they say
 * the same, as an application keeps them.
 */
import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { PlatformSurfaceProvider } from '../platform-surface/context';
import { SettingsLayout, type SettingsNavGroup } from '../settings-modal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { fakeKeyboard, menuBarAdapter } from './support/fake-menu-bar';
import { mockWindowSize } from './support/window-size';

const renders = new Map<string, number>();

function drawn(key: string) {
  renders.set(key, (renders.get(key) ?? 0) + 1);
  return null;
}

// Each row's icon, which its row draws whenever it renders.
const ICONS = {
  general: () => drawn('general'),
  appearance: () => drawn('appearance'),
  sound: () => drawn('sound'),
  network: () => drawn('network'),
  privacy: () => drawn('privacy'),
  about: () => drawn('about'),
};

const KEYS = Object.keys(ICONS) as (keyof typeof ICONS)[];
const GROUPS: SettingsNavGroup[] = [
  {
    key: 'personal',
    label: 'Personal',
    items: KEYS.slice(0, 3).map((key) => ({ key, label: key, icon: ICONS[key], page: key })),
  },
  {
    key: 'system',
    label: 'System',
    items: KEYS.slice(3).map((key) => ({ key, label: key, icon: ICONS[key], page: key })),
  },
];
const PAGES = Object.fromEntries(
  KEYS.map((key) => [key, { title: key, content: <Text>{key} body</Text> }]),
);

/** The rows drawn again by `change`, by key. */
function drawnAgain(change: () => void): string[] {
  const before = new Map(renders);
  act(change);
  return [...renders.keys()].filter((key) => renders.get(key) !== before.get(key)).sort();
}

beforeEach(() => {
  renders.clear();
  mockWindowSize({ width: 1280, height: 800, scale: 1, fontScale: 1 });
});

describe.each([
  ['with the platform keyboard', true],
  ['without it', false],
])('Settings rail selection, %s', (_, withKeyboard) => {
  const keyboard = withKeyboard ? fakeKeyboard() : undefined;
  const settings = (page: string) => (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PlatformSurfaceProvider value={keyboard ? menuBarAdapter(undefined, keyboard) : null}>
        <SettingsLayout
          groups={GROUPS}
          pages={PAGES}
          page={page}
          onPageChange={() => {}}
          testID="settings"
        />
      </PlatformSurfaceProvider>
    </BloomThemeProvider>
  );

  it('draws again only the two rows the selection moves between', () => {
    const screen = render(settings('general'), { createNodeMock: () => ({}) });
    expect(drawnAgain(() => screen.rerender(settings('sound')))).toEqual(['general', 'sound']);
    expect(drawnAgain(() => screen.rerender(settings('about')))).toEqual(['about', 'sound']);
  });

  it('draws no row when the selection stays', () => {
    const screen = render(settings('network'), { createNodeMock: () => ({}) });
    expect(drawnAgain(() => screen.rerender(settings('network')))).toEqual([]);
  });
});
