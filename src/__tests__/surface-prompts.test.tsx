import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import type { DialogProps } from '../dialog';
import { alert, confirm, prompt, SurfaceHost } from '../surfaces';
import { createSurfaceHost } from '../surfaces/SurfaceHost';
import {
  __resetSurfacesForTests,
  getSnapshot,
} from '../surfaces/surface-store';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

/**
 * `alert()`, `confirm()` and `prompt()` are the three built-in surfaces. They
 * used to be THREE module-scope imperative queues — `dialog/alert-store` +
 * `<BloomDialogProvider>`, `alert-dialog/confirm-store` + `<AlertDialogHost>`,
 * and this stack — of which the first two were one-at-a-time FIFOs that could
 * not layer over a surface opened from anywhere else. Both are gone; these
 * assert the surviving contract against the REAL rendered `Dialog` chrome.
 */
function renderHost() {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <SurfaceHost />
    </BloomThemeProvider>,
  );
}

/** `DialogAction.onPress` takes a press event these actions never read. */
const EVENT = {} as GestureResponderEvent;

describe('built-in surfaces', () => {
  afterEach(() => {
    __resetSurfacesForTests();
  });

  describe('alert()', () => {
    it('renders the title, message and buttons through the shared Dialog chrome', () => {
      const { getByText } = renderHost();
      act(() => {
        alert('Sign out?', 'You will need your password again.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign out', style: 'destructive' },
        ]);
      });
      expect(getByText('Sign out?')).toBeTruthy();
      expect(getByText('You will need your password again.')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Sign out')).toBeTruthy();
    });

    it('defaults to a single OK button when none are passed', () => {
      const { getByText, queryByText } = renderHost();
      act(() => {
        alert('Hello');
      });
      expect(getByText('Hello')).toBeTruthy();
      expect(getByText('OK')).toBeTruthy();
      expect(queryByText('Cancel')).toBeNull();
    });

    it('invokes the pressed button handler and dismisses the surface', () => {
      const onPress = jest.fn();
      const { getByText } = renderHost();
      act(() => {
        alert('Sign out?', undefined, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign out', style: 'destructive', onPress },
        ]);
      });
      act(() => {
        fireEvent.press(getByText('Sign out'));
      });
      expect(onPress).toHaveBeenCalledTimes(1);
      // …and the press dismissed the surface. (The store flips the entry to
      // 'closing' first and splices it when the exit animation settles; under
      // jest there is no animation, so it settles within the same `act`.)
      expect(getSnapshot()).toHaveLength(0);
    });

    it('STACKS a second alert instead of queueing it behind the first', () => {
      // The whole reason `alert()` moved onto this stack: the old FIFO queue
      // rendered only its head, so a second alert was invisible until the first
      // finished closing — and it could never layer over a surface presented by
      // anything else.
      const { getByText } = renderHost();
      act(() => {
        alert('First');
      });
      act(() => {
        alert('Second');
      });
      expect(getSnapshot()).toHaveLength(2);
      expect(getByText('First')).toBeTruthy();
      expect(getByText('Second')).toBeTruthy();
    });
  });

  describe('confirm()', () => {
    it('resolves true when the confirm button is pressed', async () => {
      const { getByText } = renderHost();
      let result!: Promise<boolean>;
      act(() => {
        result = confirm({
          title: 'Delete app?',
          description: 'This cannot be undone.',
          confirmLabel: 'Delete',
          cancelLabel: 'Keep',
        });
      });
      expect(getByText('This cannot be undone.')).toBeTruthy();
      act(() => {
        fireEvent.press(getByText('Delete'));
      });
      await expect(result).resolves.toBe(true);
    });

    it('resolves false when the cancel button is pressed', async () => {
      const { getByText } = renderHost();
      let result!: Promise<boolean>;
      act(() => {
        result = confirm({ title: 'Discard changes?', cancelLabel: 'Keep editing' });
      });
      act(() => {
        fireEvent.press(getByText('Keep editing'));
      });
      await expect(result).resolves.toBe(false);
    });

    it('resolves false on a backdrop / Escape / back dismissal', async () => {
      renderHost();
      let result!: Promise<boolean>;
      act(() => {
        result = confirm({ title: 'Discard unsaved changes?' });
      });
      act(() => {
        // What the host does for any dismissal it did not initiate: the store
        // resolves the entry with no result, which must read as "not confirmed"
        // — never as the (possibly destructive) confirm action.
        const top = getSnapshot()[0];
        if (top) top.resolve(undefined);
      });
      await expect(result).resolves.toBe(false);
    });

    // MEASURED, not assumed: leaving `shouldCloseOnPress` at its default still
    // resolves the right VALUE — the Dialog drains queued close-callbacks
    // before firing `onClose`, and the store resolves once — so no test driving
    // the real chrome can tell the two apart. What the flag actually buys is
    // WHEN: `false` resolves on the press, `true` resolves after the exit
    // animation, which is the surface stack's documented contract and is
    // invisible under jest (there is no animation). So it is pinned at the prop
    // boundary instead, with a mock Dialog that never closes at all.
    it('dismisses through the SURFACE, not the Dialog: resolves with no close', async () => {
      const captured: { props?: DialogProps } = {};
      const MockDialog = (props: DialogProps) => {
        captured.props = props;
        return null;
      };
      const { SurfaceHost: MockHost } = createSurfaceHost(MockDialog);
      render(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <MockHost />
        </BloomThemeProvider>,
      );

      let result!: Promise<boolean>;
      act(() => {
        result = confirm({ title: 'Proceed?', confirmLabel: 'Proceed' });
      });

      const confirmAction = captured.props?.actions?.[0];
      expect(confirmAction?.label).toBe('Proceed');
      expect(confirmAction?.shouldCloseOnPress).toBe(false);

      act(() => {
        confirmAction?.onPress?.(EVENT);
      });

      // This Dialog never calls `onClose`, so only the button's own
      // `surface.dismiss(true)` can have resolved this.
      await expect(result).resolves.toBe(true);
    });

    it('hides the cancel button when hideCancel is set', () => {
      const { getByText, queryByText } = renderHost();
      act(() => {
        void confirm({ title: 'Acknowledge', confirmLabel: 'OK', hideCancel: true });
      });
      expect(getByText('OK')).toBeTruthy();
      expect(queryByText('Cancel')).toBeNull();
    });

  });

  describe('prompt()', () => {
    it('resolves the typed value on submit', async () => {
      const { getByText, getByTestId } = renderHost();
      let result!: Promise<string | null>;
      act(() => {
        result = prompt({ title: 'Name this list', confirmLabel: 'Save' });
      });
      act(() => {
        fireEvent.changeText(getByTestId('bloom-surface-prompt-input'), 'Reading');
      });
      act(() => {
        fireEvent.press(getByText('Save'));
      });
      await expect(result).resolves.toBe('Reading');
    });

    it('resolves null on cancel', async () => {
      const { getByText } = renderHost();
      let result!: Promise<string | null>;
      act(() => {
        result = prompt({ title: 'Name this list', cancelLabel: 'Never mind' });
      });
      act(() => {
        fireEvent.press(getByText('Never mind'));
      });
      await expect(result).resolves.toBeNull();
    });

    it('seeds the input from defaultValue', async () => {
      const { getByText } = renderHost();
      let result!: Promise<string | null>;
      act(() => {
        result = prompt({ title: 'Rename', defaultValue: 'Untitled', confirmLabel: 'Save' });
      });
      act(() => {
        fireEvent.press(getByText('Save'));
      });
      await expect(result).resolves.toBe('Untitled');
    });
  });
});
