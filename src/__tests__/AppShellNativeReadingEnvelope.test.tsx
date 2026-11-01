import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import { AppShell } from '../app-shell';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { findHost } from './support/rendered-style';
import { mockWindowSize } from './support/window-size';
import { createYogaHostRenderer } from './support/yoga-host-tree';

/**
 * On a phone the reading envelope is not content-aligned, and its animated
 * style must then write what its static style writes. Writing `UNSET` there
 * reset `flexGrow`/`flexShrink`/`flexBasis`/`minWidth` to Yoga's defaults on
 * Fabric, so inside the shell's row the envelope took its content's width —
 * zero, as every page fills its parent — and each screen of the app drew
 * nothing but the bars around it.
 */

let yoga: ReturnType<typeof createYogaHostRenderer>;
beforeAll(() => {
  yoga = createYogaHostRenderer();
}, 120_000);
afterAll(() => yoga?.dispose());
afterEach(() => jest.restoreAllMocks());

function pageBox(tree: ReturnType<ReturnType<typeof render>['toJSON']>) {
  const root = findHost(tree, 'root');
  if (!root) throw new Error('no root host');
  const page = yoga.layout(root).get('page');
  if (!page) throw new Error('the page was not laid out');
  return page;
}

describe.each([
  ['the default reading width', {}],
  ['no reading cap', { contentMaxWidth: 'none' as const }],
])('%s', (_, props) => {
  it.each([360, 412])(
    'a phone page at %i fills the screen, neither collapsed nor overflowing',
    (width) => {
      mockWindowSize({ width, height: 800 });
      const screen = render(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <View testID="root" style={{ width, height: 800 }}>
            <AppShell
              testID="shell"
              variant="feed"
              scroll="page"
              drawer="reveal"
              header={null}
              {...props}
            >
              <View testID="page" style={{ flex: 1 }} />
            </AppShell>
          </View>
        </BloomThemeProvider>,
      );
      const page = pageBox(screen.toJSON());
      expect(page.width).toBeGreaterThan(width / 2);
      expect(page.width).toBeLessThanOrEqual(width);
      expect(page.height).toBeGreaterThan(0);
    },
  );
});

// Mention's shell on a phone: a bounded, separated split whose main panel asks
// for 620 and whose context panel hides below 990. The panels sit in a
// horizontal ScrollView, whose content natively takes its children's width;
// the preferred width gives way to the screen instead of overflowing it.
it.each([360, 412])('a feed shell with a 620-wide main panel fits a %i phone', (width) => {
  mockWindowSize({ width, height: 800 });
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <View testID="root" style={{ width, height: 800 }}>
        <AppShell
          testID="shell"
          variant="feed"
          scroll="page"
          drawer="reveal"
          header={null}
          navigationAlign="content"
          navigationGap={0}
          gutter={8}
          panelLayout={{
            mode: 'split',
            flow: 'bounded',
            appearance: 'separated',
            gap: 0,
            activePanel: 'main',
            panels: [
              {
                id: 'main',
                visible: true,
                keepMounted: true,
                width: 620,
                minWidth: 0,
                resizable: false,
                content: <View testID="page" style={{ flex: 1 }} />,
              },
              {
                id: 'context',
                visible: true,
                sticky: true,
                width: 350,
                hideBelow: 990,
                content: <View />,
              },
            ],
          }}
        />
      </View>
    </BloomThemeProvider>,
  );
  const page = pageBox(screen.toJSON());
  expect(page.width).toBeGreaterThan(width / 2);
  expect(page.width).toBeLessThanOrEqual(width);
});
