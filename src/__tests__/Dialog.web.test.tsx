/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Dialog } from '../dialog/Dialog.web';
import { useDialogControl } from '../dialog/context';

// react-dom 19 logs a guard unless this flag is set in test environments.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const DIALOG_STYLE_ID = 'bloom-dialog-web-css';

let container: HTMLDivElement;
let root: Root;

function Harness({
  onControl,
}: {
  onControl: (control: ReturnType<typeof useDialogControl>) => void;
}) {
  const control = useDialogControl();
  React.useEffect(() => {
    onControl(control);
  }, [control, onControl]);
  return (
    <Dialog
      control={control}
      title="Delete item?"
      description="This cannot be undone."
      actions={[{ label: 'OK' }]}
    />
  );
}

function mount(ui: React.ReactElement): void {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
}

beforeEach(() => {
  // Ensure a clean document between runs — the injection is guarded by id, so a
  // leftover tag would make the "injects on mount" assertion pass vacuously.
  document.getElementById(DIALOG_STYLE_ID)?.remove();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.getElementById(DIALOG_STYLE_ID)?.remove();
});

describe('Dialog.web keyframe self-injection', () => {
  it('injects the bloomDialog @keyframes stylesheet into <head> on mount', () => {
    expect(document.getElementById(DIALOG_STYLE_ID)).toBeNull();

    let control: ReturnType<typeof useDialogControl> | undefined;
    mount(<Harness onControl={(c) => { control = c; }} />);

    const styleEl = document.getElementById(DIALOG_STYLE_ID);
    expect(styleEl).not.toBeNull();
    expect(styleEl?.tagName).toBe('STYLE');
    expect(styleEl?.parentElement).toBe(document.head);

    const css = styleEl?.textContent ?? '';
    expect(css).toContain('@keyframes bloomDialogZoomFadeIn');
    expect(css).toContain('@keyframes bloomDialogZoomFadeOut');
    expect(css).toContain('@keyframes bloomDialogFadeIn');
    expect(css).toContain('@keyframes bloomDialogFadeOut');

    // Opening the dialog (the path that actually plays the animation) must not
    // duplicate the stylesheet.
    act(() => { control?.open(); });
    expect(document.querySelectorAll(`#${DIALOG_STYLE_ID}`).length).toBe(1);
  });

  it('does not inject a second stylesheet when multiple dialogs mount', () => {
    mount(
      <>
        <Harness onControl={() => {}} />
        <Harness onControl={() => {}} />
      </>,
    );
    expect(document.querySelectorAll(`#${DIALOG_STYLE_ID}`).length).toBe(1);
  });
});
