/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act } from 'react';
import { Text } from 'react-native';
import { createRoot, type Root } from 'react-dom/client';

import { ContentPanel as ContentPanelWeb } from '../content-panel/ContentPanel.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { useSurfaceFill } from '../styles/surface-levels';
import { Dialog } from '../dialog/Dialog.web';
import { useDialogControl } from '../dialog/context';

// react-dom 19 logs a guard unless this flag is set in test environments.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const DIALOG_STYLE_ID = 'bloom-dialog-web-css';

let container: HTMLDivElement;
let root: Root;

function Harness({
  onControl,
  body,
}: {
  onControl: (control: ReturnType<typeof useDialogControl>) => void;
  /** Dialog content, for the suites that assert what the dialog tells it. */
  body?: React.ReactNode;
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
    >
      {body}
    </Dialog>
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
    // The backdrop's own fade is NOT a keyframe: it rides a shared value, so
    // the dim can never be driven past its own opacity (see the black-flash
    // regression below).
    expect(css).not.toContain('@keyframes bloomDialogFadeIn');
    expect(css).not.toContain('@keyframes bloomDialogFadeOut');

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

/**
 * The web dialog's `level={0}` surface RESET, asserted through the real render
 * path rather than through a hand-written provider.
 *
 * On web a portal keeps React context from where the dialog was RENDERED, so a
 * dialog opened from inside a `ContentPanel` is a React descendant of a
 * container publishing `colors.card`. The dialog paints the page colour, so
 * without the reset every piece of chrome inside it that asks "what am I
 * sitting on?" is told the column's colour and paints it on top of the
 * dialog's — a near-miss, which is invisible to any structural assertion.
 */
describe('Dialog.web resets the ambient surface for its content', () => {
  function FillReadout() {
    return <Text>{`fill=${useSurfaceFill()}`}</Text>;
  }

  it('publishes the DIALOG surface to a dialog opened inside a ContentPanel', () => {
    const theme = buildTheme('teal', 'dark');
    // The discriminator: if the panel's card and the page were the same colour
    // this would pass without measuring anything.
    expect(theme.colors.card).not.toBe(theme.colors.background);

    let control: ReturnType<typeof useDialogControl> | undefined;
    act(() => {
      root.render(
        <BloomThemeProvider mode="dark" colorPreset="teal">
          <ContentPanelWeb>
            <Harness
              onControl={(c) => {
                control = c;
              }}
              body={<FillReadout />}
            />
          </ContentPanelWeb>
        </BloomThemeProvider>,
      );
    });
    act(() => {
      control?.open();
    });

    const text = document.body.textContent ?? '';
    expect(text).toContain(`fill=${theme.colors.background}`);
    expect(text).not.toContain(`fill=${theme.colors.card}`);
  });
});
