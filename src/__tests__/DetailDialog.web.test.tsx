/** @jest-environment jsdom */
import React, { act, createContext, useContext, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DetailDialog, DetailDialogSection, DetailDialogSectionGroup } from '../dialog/index.web';
import { ProjectBoardCardContent } from '../project-board/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

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
