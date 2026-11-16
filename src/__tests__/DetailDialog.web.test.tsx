/** @jest-environment jsdom */
import React, { act, createContext, useContext, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DetailDialog, DetailDialogSection, DetailDialogSectionGroup } from '../dialog/index.web';
import { ProjectBoardCardContent } from '../project-board/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BloomColorScope } from '../theme/color-scope/index.web';
import { Screen, ScreenContent } from '../screen/index.web';
import { View } from 'react-native';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const rn = jest.requireActual('react-native-web');
  return {
    __esModule: true,
    ...base,
    default: { ...base.default, View: rn.View, Text: rn.Text, ScrollView: rn.ScrollView },
    ScrollView: rn.ScrollView,
  };
});
jest.mock('../hooks/use-prefers-reduced-motion', () => ({ usePrefersReducedMotion: () => true }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const RecordContext = createContext('missing');
function Toolbar() {
  return <button type="button">{useContext(RecordContext)}</button>;
}
function Fixture({ canvas = false }: { canvas?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <BloomThemeProvider colorPreset="teal" mode="light">
      <button type="button" onClick={() => setOpen(true)}>
        Reopen
      </button>
      <RecordContext.Provider value="Record toolbar">
        <DetailDialog
          open={open}
          onClose={() => setOpen(false)}
          label="Product record"
          header="Record title"
          subtitle="Workspace"
          closeLabel="Close record"
          testID="detail"
          footer={<Toolbar />}
          contentKind={canvas ? 'canvas' : 'document'}
          scrollable={!canvas}
        >
          <DetailDialogSectionGroup>
            <DetailDialogSection label="Status">
              <input aria-label="Editable status" defaultValue="Draft" />
            </DetailDialogSection>
          </DetailDialogSectionGroup>
        </DetailDialog>
      </RecordContext.Provider>
    </BloomThemeProvider>
  );
}

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  jest.useFakeTimers();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  document.body.replaceChildren();
  jest.useRealTimers();
});
const settle = () => act(() => jest.runOnlyPendingTimers());

it.each([{ colorPreset: 'rose' as const }, { seed: '#8e5137' }])(
  'paints a Screen color override on its actual DOM host: %j',
  (color) => {
    act(() =>
      root.render(
        <BloomThemeProvider colorPreset="teal" mode="light">
          <BloomColorScope {...color} asChild>
            <View testID="reference-color" />
          </BloomColorScope>
          <Screen {...color} kind="document" testID="screen-color">
            <ScreenContent
              testID="record-body"
              dataSet={{ recordId: '42', bloomBody: 'caller-marker' }}
            />
          </Screen>
        </BloomThemeProvider>,
      ),
    );
    const reference = document.querySelector<HTMLElement>('[data-testid="reference-color"]')!;
    const screen = document.querySelector<HTMLElement>('[data-testid="screen-color"]')!;
    const expected = reference.style.getPropertyValue('--background');
    expect(expected).not.toBe('');
    expect(screen.style.getPropertyValue('--background')).toBe(expected);
    const body = document.querySelector<HTMLElement>('[data-testid="record-body"]')!;
    expect(body.dataset.recordId).toBe('42');
    expect(body.dataset.bloomBody).toMatch(/^bloom-body-/);
  },
);

it('retains conditionally mounted detail until the existing Dialog exit completes', () => {
  const closed = jest.fn();
  function ConditionalDetail() {
    const [mounted, setMounted] = useState(true);
    return (
      <BloomThemeProvider>
        {mounted && (
          <DetailDialog
            startOpen
            label="Mounted record"
            closeLabel="Close mounted record"
            onClose={() => {
              closed();
              setMounted(false);
            }}
          />
        )}
      </BloomThemeProvider>
    );
  }
  act(() => root.render(<ConditionalDetail />));
  settle();
  act(() => (document.querySelector('[aria-label="Close mounted record"]') as HTMLElement).click());
  expect(closed).not.toHaveBeenCalled();
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  act(() => jest.advanceTimersByTime(100));
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  settle();
  expect(closed).toHaveBeenCalledTimes(1);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});

it('shares the product provider with fixed chrome, keeps one scroller, and closes/reopens through Dialog', () => {
  act(() => root.render(<Fixture />));
  settle();
  expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
  expect(document.querySelectorAll('[data-testid="detail-scroll"]')).toHaveLength(1);
  const toolbar = Array.from(document.querySelectorAll('button')).find(
    (node) => node.textContent === 'Record toolbar',
  )!;
  expect(toolbar).toBeDefined();
  expect(document.querySelector('[data-testid="detail-scroll"]')?.contains(toolbar)).toBe(false);
  expect(document.querySelectorAll('input[aria-label="Editable status"]')).toHaveLength(1);
  act(() => (document.querySelector('[aria-label="Close record"]') as HTMLElement).click());
  settle();
  settle();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  act(() =>
    Array.from(document.querySelectorAll('button'))
      .find((node) => node.textContent === 'Reopen')!
      .click(),
  );
  settle();
  expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
});

it('leaves a canvas bounded without adding a second scroller', () => {
  act(() => root.render(<Fixture canvas />));
  settle();
  expect(document.querySelector('[data-testid="detail-scroll"]')).toBeNull();
  expect(document.querySelector('input[aria-label="Editable status"]')).not.toBeNull();
});

it('keeps custom title controls editable and preview outside the card padding', () => {
  act(() =>
    root.render(
      <BloomThemeProvider colorPreset="teal" mode="light">
        <ProjectBoardCardContent
          preview={<div data-testid="preview" />}
          header={<input aria-label="Card title" defaultValue="Draft" />}
          actions={<button type="button">Move</button>}
        >
          <button type="button">Edit property</button>
        </ProjectBoardCardContent>
      </BloomThemeProvider>,
    ),
  );
  const preview = host.querySelector('[data-testid="preview"]')!;
  const input = host.querySelector('input')!;
  expect(preview.parentElement?.contains(input)).toBe(true);
  expect(preview.nextElementSibling?.contains(input)).toBe(true);
  expect(input.closest('span')).toBeNull();
  expect(host.textContent).toContain('Edit property');
});

function BackingProbe() {
  const fill = useSurfaceFill();
  const { colors } = useTheme();
  return (
    <div
      data-testid="backing-probe"
      data-fill={fill}
      data-card={colors.card}
      data-page={colors.background}
    />
  );
}

it.each(['light', 'dark'] as const)(
  'publishes the painted detail backing to its chrome in %s mode',
  (mode) => {
    act(() =>
      root.render(
        <BloomThemeProvider colorPreset="teal" mode={mode}>
          <DetailDialog
            startOpen
            label="Record"
            header="Record"
            actions={<BackingProbe />}
            testID="backing-detail"
            onClose={() => {}}
          >
            <BackingProbe />
          </DetailDialog>
        </BloomThemeProvider>,
      ),
    );
    settle();
    const probes = [...document.querySelectorAll<HTMLElement>('[data-testid="backing-probe"]')];
    expect(probes).toHaveLength(2);
    for (const probe of probes) {
      expect(probe.dataset.card).not.toBe(probe.dataset.page);
      expect(probe.dataset.fill).toBe(probe.dataset.card);
    }
    const surface = document.querySelector<HTMLElement>('[data-testid="backing-detail-surface"]')!;
    const expected = document.createElement('div');
    expected.style.backgroundColor = probes[0]!.dataset.card!;
    expect(surface.style.backgroundColor).toBe(expected.style.backgroundColor);
  },
);
