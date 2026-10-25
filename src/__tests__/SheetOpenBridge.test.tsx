/**
 * A controlled menu, popover or select hears EVERY user dismissal of its sheet.
 *
 * The bridge used to close a sheet the user had already dismissed (the
 * `open=false` that dismissal caused ran the close-from-state path), which fires
 * no `onDismiss`, so its "closed from state" flag stayed set and swallowed the
 * next user dismissal: `onOpenChange(false)` never came, the consumer stayed
 * `open`, and its next open was a no-op. In Allo, after two backdrop taps,
 * holding a message opened nothing until the app restarted.
 */
import { act, render } from '@testing-library/react-native';
import { useState } from 'react';

const control = { id: 'c', ref: { current: null }, open: jest.fn(), close: jest.fn() };
jest.mock('../dialog/context', () => ({
  ...jest.requireActual('../dialog/context'),
  useDialogControl: () => control,
}));

import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';

let api: { setOpen: (next: boolean) => void; onSheetClose: () => void; open: boolean };
const reported: boolean[] = [];

function Consumer() {
  const [open, setOpenState] = useState(false);
  const setOpen = (next: boolean) => {
    reported.push(next);
    setOpenState(next);
  };
  const { onSheetClose } = useSheetOpenBridge(open, setOpen);
  api = { setOpen: setOpenState, onSheetClose, open };
  return null;
}

beforeEach(() => {
  control.open.mockClear();
  control.close.mockClear();
  reported.length = 0;
});

describe('useSheetOpenBridge', () => {
  it('reports every user dismissal, however many times the sheet is reopened', () => {
    render(<Consumer />);
    for (let round = 0; round < 3; round += 1) {
      act(() => api.setOpen(true));
      expect(control.open).toHaveBeenCalledTimes(round + 1);
      // The sheet finished animating out after a backdrop tap.
      act(() => api.onSheetClose());
      expect(api.open).toBe(false);
    }
    expect(reported).toEqual([false, false, false]);
    // A sheet the user already closed is never "closed" again from state.
    expect(control.close).not.toHaveBeenCalled();
  });

  it('closes from state without echoing it back, and keeps hearing users after', () => {
    render(<Consumer />);
    act(() => api.setOpen(true));
    act(() => api.setOpen(false));
    expect(control.close).toHaveBeenCalledTimes(1);
    act(() => api.onSheetClose());
    expect(reported).toEqual([]);
    act(() => api.setOpen(true));
    act(() => api.onSheetClose());
    expect(reported).toEqual([false]);
  });

  it('dismisses nothing on mount', () => {
    render(<Consumer />);
    expect(control.close).not.toHaveBeenCalled();
  });
});
