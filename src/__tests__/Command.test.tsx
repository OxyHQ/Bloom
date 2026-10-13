import React, { useImperativeHandle } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { Command } from '../command';
import { createCommand } from '../command/Command';
import type { CommandItem } from '../command';
import type { DialogProps } from '../dialog';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function makeItems(onSelect: () => void): CommandItem[] {
  return [
    { id: 'profile', label: 'Go to profile', group: 'Navigation', onSelect },
    { id: 'settings', label: 'Open settings', group: 'Navigation', onSelect },
    {
      id: 'new-app',
      label: 'Create application',
      description: 'Register a new OAuth client',
      group: 'Actions',
      keywords: ['oauth', 'client'],
      onSelect,
    },
  ];
}

// `Command` is now a ⌘K palette built on `<Dialog placement="center">`. These
// tests assert the public-API contract it owns (controlled visibility, the
// grouped results list, query filtering, the empty state, and select →
// onOpenChange) holds on the native Dialog surface.
describe('Command (built on Dialog)', () => {
  it('renders nothing when not open', () => {
    const { queryByText } = renderWithTheme(
      <Command open={false} onOpenChange={() => {}} items={makeItems(() => {})} />,
    );
    expect(queryByText('Go to profile')).toBeNull();
  });

  it('renders grouped items and their group headers when open', () => {
    const { getByText } = renderWithTheme(
      <Command open onOpenChange={() => {}} items={makeItems(() => {})} />,
    );
    expect(getByText('Go to profile')).toBeTruthy();
    expect(getByText('Open settings')).toBeTruthy();
    expect(getByText('Create application')).toBeTruthy();
    // Group headers are rendered above their items.
    expect(getByText('Navigation')).toBeTruthy();
    expect(getByText('Actions')).toBeTruthy();
  });

  it('filters items by a controlled query (label, description, keywords)', () => {
    const { getByText, queryByText, rerender } = renderWithTheme(
      <Command open onOpenChange={() => {}} items={makeItems(() => {})} query="settings" />,
    );
    expect(getByText('Open settings')).toBeTruthy();
    expect(queryByText('Go to profile')).toBeNull();

    // A keyword on a different item matches that item.
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Command open onOpenChange={() => {}} items={makeItems(() => {})} query="oauth" />
      </BloomThemeProvider>,
    );
    expect(getByText('Create application')).toBeTruthy();
    expect(queryByText('Open settings')).toBeNull();
  });

  it('shows the empty state when nothing matches', () => {
    const { getByText } = renderWithTheme(
      <Command
        open
        onOpenChange={() => {}}
        items={makeItems(() => {})}
        query="zzz-no-match"
        emptyText="Nothing here"
      />,
    );
    expect(getByText('Nothing here')).toBeTruthy();
  });

  it('invokes onSelect then onOpenChange when an item is pressed', () => {
    const onSelect = jest.fn();
    const onOpenChange = jest.fn();
    const { getByText } = renderWithTheme(
      <Command open onOpenChange={onOpenChange} items={makeItems(onSelect)} />,
    );
    act(() => {
      fireEvent.press(getByText('Open settings'));
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  // The migration off the controlled `open` prop onto the imperative `control`
  // handle (making `Command` the last controlled-mode `Dialog` consumer to move
  // over). These pin the fix at the prop boundary between `Command` and the
  // underlying `Dialog`, using a prop-capturing mock `Dialog` so the assertions
  // are deterministic and platform-agnostic — mirroring `AlertDialog`'s round.
  describe('control-mode bridge', () => {
    function captureDialogProps() {
      const captured: { props?: DialogProps } = {};
      const MockDialog = (props: DialogProps) => {
        captured.props = props;
        return null;
      };
      return { captured, MockDialog };
    }

    it('drives the underlying Dialog imperatively (control), never the controlled `open` prop', () => {
      const { captured, MockDialog } = captureDialogProps();
      const TestCommand = createCommand(MockDialog);
      renderWithTheme(<TestCommand open onOpenChange={() => {}} items={makeItems(() => {})} />);
      // The whole point of the migration: `Command` must take the Dialog's
      // imperative/uncontrolled branch (the one that plays the exit animation on
      // dismiss), so an imperative `control` handle is passed and the controlled
      // `open` boolean — which fires `onOpenChange` synchronously — is never set.
      expect(captured.props?.control).toBeDefined();
      expect(captured.props?.open).toBeUndefined();
    });

    // A mock Dialog that registers the real imperative contract on `control.ref`
    // (so `Command`'s `control.open()` / `control.close()` proxy through it) and
    // fires `onOpenChange` when imperatively closed — modelling the real Dialog,
    // which invokes `onClose` only AFTER its exit animation settles.
    function ImperativeMockDialog(props: DialogProps) {
      const onCloseRef = React.useRef(props.onClose);
      onCloseRef.current = props.onClose;
      useImperativeHandle(
        props.control?.ref,
        () => ({
          open: () => {},
          // The real Dialog fires `onOpenChange` post-exit-animation.
          close: () => onCloseRef.current?.(),
        }),
        [],
      );
      return null;
    }

    it('opens the Dialog imperatively on mount when open, and closes it when open flips false', () => {
      const spies = { open: jest.fn(), close: jest.fn() };
      const MockDialog = (props: DialogProps) => {
        useImperativeHandle(props.control?.ref, () => spies, []);
        return null;
      };
      const TestCommand = createCommand(MockDialog);
      const { rerender } = renderWithTheme(
        <TestCommand open onOpenChange={() => {}} items={makeItems(() => {})} />,
      );
      expect(spies.open).toHaveBeenCalledTimes(1);
      expect(spies.close).not.toHaveBeenCalled();

      act(() => {
        rerender(
          <BloomThemeProvider mode="light" colorPreset="teal">
            <TestCommand open={false} onOpenChange={() => {}} items={makeItems(() => {})} />
          </BloomThemeProvider>,
        );
      });
      expect(spies.close).toHaveBeenCalledTimes(1);
    });

    it('forwards a user dismissal (backdrop / Escape) through onOpenChange', () => {
      const spyRef: { fn?: () => void } = {};
      const MockDialog = (props: DialogProps) => {
        spyRef.fn = props.onClose;
        return null;
      };
      const onOpenChange = jest.fn();
      const TestCommand = createCommand(MockDialog);
      renderWithTheme(<TestCommand open onOpenChange={onOpenChange} items={makeItems(() => {})} />);
      // The real Dialog fires `onOpenChange` once its exit animation settles after a
      // backdrop / Escape dismissal. `Command` must forward that to the consumer.
      act(() => {
        spyRef.fn?.();
      });
      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    it('does not re-enter onOpenChange when the consumer closes it (open → false)', () => {
      const onOpenChange = jest.fn();
      const TestCommand = createCommand(ImperativeMockDialog);
      const { rerender } = renderWithTheme(
        <TestCommand open onOpenChange={onOpenChange} items={makeItems(() => {})} />,
      );
      act(() => {
        rerender(
          <BloomThemeProvider mode="light" colorPreset="teal">
            <TestCommand open={false} onOpenChange={onOpenChange} items={makeItems(() => {})} />
          </BloomThemeProvider>,
        );
      });
      // A consumer-initiated close flips `open` to false → `Command`
      // imperatively `close()`s the Dialog (which fires its post-exit `onOpenChange`).
      // That programmatic close must NOT re-enter the consumer's `onOpenChange`,
      // preserving the previous controlled semantics.
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });
});
