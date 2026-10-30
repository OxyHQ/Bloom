import React from 'react';
import * as ReactNative from 'react-native';
import { Modal, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { Dialog, useDialogControl } from '../dialog';
import { CenteredCard } from '../dialog/CenteredCard';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function Harness({
  children,
  onControl,
}: {
  children?: (control: ReturnType<typeof useDialogControl>) => React.ReactNode;
  onControl?: (control: ReturnType<typeof useDialogControl>) => void;
}) {
  const control = useDialogControl();
  React.useEffect(() => {
    onControl?.(control);
  }, [control, onControl]);
  return <>{children?.(control)}</>;
}

describe('Dialog (unified API)', () => {
  it('does not render content until control.open() is called', () => {
    const { queryByText } = renderWithTheme(
      <Harness>
        {(control) => (
          <Dialog control={control} title="Hidden until opened">
            <Text>Body</Text>
          </Dialog>
        )}
      </Harness>,
    );
    expect(queryByText('Hidden until opened')).toBeNull();
    expect(queryByText('Body')).toBeNull();
  });

  it('renders declarative title + description + actions when opened', () => {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const onDelete = jest.fn();
    const { getByText } = renderWithTheme(
      <Harness
        onControl={(c) => {
          control = c;
        }}
      >
        {(c) => (
          <Dialog
            control={c}
            title="Delete item?"
            description="This action cannot be undone."
            actions={[
              { label: 'Delete', color: 'destructive', onPress: onDelete },
              { label: 'Cancel', color: 'cancel' },
            ]}
          />
        )}
      </Harness>,
    );
    act(() => {
      control?.open();
    });
    expect(getByText('Delete item?')).toBeTruthy();
    expect(getByText('This action cannot be undone.')).toBeTruthy();
    expect(getByText('Delete')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('renders custom children alongside the declarative header', () => {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const { getByText } = renderWithTheme(
      <Harness
        onControl={(c) => {
          control = c;
        }}
      >
        {(c) => (
          <Dialog control={c} title="Pick a tag">
            <Text>Custom body content</Text>
          </Dialog>
        )}
      </Harness>,
    );
    act(() => {
      control?.open();
    });
    expect(getByText('Pick a tag')).toBeTruthy();
    expect(getByText('Custom body content')).toBeTruthy();
  });

  it('fires the action onPress after the dialog finishes closing', () => {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const onConfirm = jest.fn();
    const { getByText } = renderWithTheme(
      <Harness
        onControl={(c) => {
          control = c;
        }}
      >
        {(c) => (
          <Dialog
            control={c}
            title="Confirm?"
            actions={[{ label: 'Confirm', onPress: onConfirm }]}
          />
        )}
      </Harness>,
    );
    act(() => {
      control?.open();
    });
    act(() => {
      fireEvent.press(getByText('Confirm'));
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('Dialog nav header (rich fields)', () => {
  function openHeader(header: React.ComponentProps<typeof Dialog>['header']) {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const utils = renderWithTheme(
      <Harness
        onControl={(c) => {
          control = c;
        }}
      >
        {(c) => (
          <Dialog control={c} header={header} scrollable>
            <Text>Screen body</Text>
          </Dialog>
        )}
      </Harness>,
    );
    act(() => {
      control?.open();
    });
    return utils;
  }

  it('renders primaryAction, actions, search and segments', () => {
    const { getByText, getByLabelText, getByPlaceholderText } = openHeader({
      title: 'Rich title',
      primaryAction: { label: 'Save', onPress: jest.fn() },
      actions: [
        { icon: () => <Text>·</Text>, accessibilityLabel: 'Share', onPress: jest.fn() },
        { icon: () => <Text>·</Text>, accessibilityLabel: 'Star', onPress: jest.fn() },
      ],
      search: { value: '', onValueChange: jest.fn(), placeholder: 'Find items' },
      segments: {
        items: [
          { key: 'all', label: 'All' },
          { key: 'photos', label: 'Photos' },
        ],
        value: 'all',
        onChange: jest.fn(),
      },
      progress: { step: 2, total: 5 },
    });
    expect(getByText('Save')).toBeTruthy();
    expect(getByLabelText('Share')).toBeTruthy();
    expect(getByLabelText('Star')).toBeTruthy();
    expect(getByPlaceholderText('Find items')).toBeTruthy();
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Photos')).toBeTruthy();
  });

  it('fires primaryAction.onPress when the CTA is pressed', () => {
    const onSave = jest.fn();
    const { getByText } = openHeader({
      title: 'T',
      primaryAction: { label: 'Save', onPress: onSave },
    });
    act(() => {
      fireEvent.press(getByText('Save'));
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('collapses surplus actions into a "More" overflow trigger', () => {
    const { getByLabelText } = openHeader({
      title: 'T',
      actions: [
        { icon: () => <Text>a</Text>, accessibilityLabel: 'A1', onPress: jest.fn() },
        { icon: () => <Text>b</Text>, accessibilityLabel: 'A2', onPress: jest.fn() },
        { icon: () => <Text>c</Text>, accessibilityLabel: 'A3', onPress: jest.fn() },
        { icon: () => <Text>d</Text>, accessibilityLabel: 'A4', onPress: jest.fn() },
      ],
    });
    // 4 actions > the inline max (3): the first two stay inline + a "More" trigger.
    expect(getByLabelText('A1')).toBeTruthy();
    expect(getByLabelText('A2')).toBeTruthy();
    expect(getByLabelText('More')).toBeTruthy();
  });

  it('backward-compat: a title-only header still renders the default close', () => {
    const { getAllByText, getByLabelText } = openHeader({ title: 'Just a title' });
    // Title renders in both the large title and the (collapsed) bar title.
    expect(getAllByText('Just a title').length).toBeGreaterThanOrEqual(1);
    expect(getByLabelText('Close')).toBeTruthy();
  });
});

/**
 * The NATIVE centred card is a detached `BottomSheet`, which takes its first
 * visibility from `open` and its user-dismissal veto from `onDismissAttempt`.
 * The bottom placement mapped both; the centred one mapped neither, so an
 * uncontrolled `startOpen` card never appeared and `dismissOnBackdrop={false}`
 * still closed on a backdrop tap.
 */
describe('native centred Dialog: startOpen and dismissOnBackdrop', () => {
  afterEach(() => jest.restoreAllMocks());

  function setViewportWidth(width: number) {
    jest
      .spyOn(ReactNative, 'useWindowDimensions')
      .mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
  }

  it('an uncontrolled startOpen centred dialog is open on mount', () => {
    const { getByText } = renderWithTheme(
      <Harness>
        {(c) => (
          <Dialog control={c} startOpen placement="center" title="Seeded">
            <Text>Seeded body</Text>
          </Dialog>
        )}
      </Harness>,
    );
    expect(getByText('Seeded body')).toBeTruthy();
  });

  it('a responsive { base: bottom, md: center } startOpen dialog is open at >= 768dp', () => {
    setViewportWidth(1024);
    const { getByText } = renderWithTheme(
      <Harness>
        {(c) => (
          <Dialog control={c} startOpen placement={{ base: 'bottom', md: 'center' }}>
            <Text>Wide body</Text>
          </Dialog>
        )}
      </Harness>,
    );
    expect(getByText('Wide body')).toBeTruthy();
  });

  it('keeps the initial bottom renderer and content through a responsive breakpoint while open', () => {
    setViewportWidth(375);
    // A fresh element per render: an identical one would bail out of the update.
    const tree = () => (
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Harness>
          {(c) => (
            <Dialog control={c} startOpen placement={{ base: 'bottom', md: 'center' }}>
              <Text>Crossing body</Text>
            </Dialog>
          )}
        </Harness>
      </BloomThemeProvider>
    );
    const screen = render(tree());
    // The bottom branch already honoured `startOpen`.
    const body = screen.getByText('Crossing body');
    expect(body).toBeTruthy();
    setViewportWidth(1024);
    screen.rerender(tree());
    expect(screen.getByText('Crossing body')).toBeTruthy();
    expect(screen.getByText('Crossing body')).toBe(body);
    // Responsive placement is resolved for the next opening, not mid-edit.
    expect(screen.UNSAFE_queryByProps({ detached: true })).toBeNull();
  });

  describe('backdrop and Android Back', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    function renderCentred(dismissOnBackdrop: boolean | undefined, onClose: () => void) {
      let control: ReturnType<typeof useDialogControl> | undefined;
      const screen = renderWithTheme(
        <Harness
          onControl={(c) => {
            control = c;
          }}
        >
          {(c) => (
            <Dialog
              control={c}
              placement="center"
              dismissOnBackdrop={dismissOnBackdrop}
              onClose={onClose}
            >
              <Text>Centred body</Text>
            </Dialog>
          )}
        </Harness>,
      );
      act(() => control?.open());
      return { screen, control: () => control };
    }

    it('with dismissOnBackdrop={false}, a backdrop tap and Android Back leave it open', () => {
      const onClose = jest.fn();
      const { screen, control } = renderCentred(false, onClose);
      fireEvent.press(screen.getByLabelText('Dismiss'));
      act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose());
      act(() => jest.advanceTimersByTime(500));
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByText('Centred body')).toBeTruthy();
      expect(screen.UNSAFE_getByType(Modal).props.visible).toBe(true);
      // `close()` is not a user dismissal: the veto does not block it.
      act(() => control()?.close());
      act(() => jest.advanceTimersByTime(500));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Centred body')).toBeNull();
    });

    it('by default, a backdrop tap closes it', () => {
      const onClose = jest.fn();
      const { screen } = renderCentred(undefined, onClose);
      fireEvent.press(screen.getByLabelText('Dismiss'));
      act(() => jest.advanceTimersByTime(500));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Centred body')).toBeNull();
    });
  });
});

/**
 * Controlled mode: the host owns `open`, so a close the SURFACE makes on its
 * own (backdrop, Android Back, a swipe) must reach `onClose`, or the host's
 * state says open over a closed dialog and the next `open` flip is a no-op.
 * A close the host makes (it flips `open` to false) must not echo back.
 */
describe('controlled native Dialog: a self-dismissal reaches onClose', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  function ControlledHost({
    placement,
    onClose,
  }: {
    placement: 'center' | 'left';
    onClose: () => void;
  }) {
    const [open, setOpen] = React.useState(true);
    return (
      <>
        <Text onPress={() => setOpen(true)}>Reopen</Text>
        <Dialog
          open={open}
          placement={placement}
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        >
          <Text>Controlled body</Text>
        </Dialog>
      </>
    );
  }

  function settle() {
    act(() => jest.advanceTimersByTime(600));
  }

  it.each(['center', 'left'] as const)(
    '%s: a backdrop tap calls onClose once and the host can reopen it',
    (placement) => {
      const onClose = jest.fn();
      const screen = renderWithTheme(<ControlledHost placement={placement} onClose={onClose} />);
      fireEvent.press(
        placement === 'left'
          ? screen.getByTestId('bloom-dialog-sheet-backdrop', { includeHiddenElements: true })
          : screen.getByLabelText('Dismiss'),
      );
      settle();
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Controlled body')).toBeNull();
      fireEvent.press(screen.getByText('Reopen'));
      settle();
      expect(screen.getByText('Controlled body')).toBeTruthy();
    },
  );

  it('center: Android Back calls onClose once', () => {
    const onClose = jest.fn();
    const screen = renderWithTheme(<ControlledHost placement="center" onClose={onClose} />);
    act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose());
    settle();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Controlled body')).toBeNull();
  });

  it('center: a host-made close does not echo back through onClose', () => {
    const onClose = jest.fn();
    const tree = (open: boolean) => (
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Dialog open={open} placement="center" onClose={onClose}>
          <Text>Host body</Text>
        </Dialog>
      </BloomThemeProvider>
    );
    const screen = render(tree(true));
    screen.rerender(tree(false));
    settle();
    expect(screen.queryByText('Host body')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('DialogAction loading', () => {
  function openWith(actions: React.ComponentProps<typeof Dialog>['actions']) {
    let control: ReturnType<typeof useDialogControl> | undefined;
    const utils = renderWithTheme(
      <Harness
        onControl={(c) => {
          control = c;
        }}
      >
        {(c) => <Dialog control={c} title="Publish?" actions={actions} />}
      </Harness>,
    );
    act(() => {
      control?.open();
    });
    return utils;
  }

  it('draws the spinner, announces busy, and ignores the press: no close, no onPress', () => {
    const onPublish = jest.fn();
    const { getByLabelText, getByText } = openWith([
      { label: 'Publish', onPress: onPublish, loading: true },
    ]);
    const host = getByLabelText('Publish');
    expect(host.props['aria-busy']).toBe(true);
    expect(host.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
    expect(host.props.onPress).toBeUndefined();
    act(() => {
      fireEvent.press(host);
    });
    expect(onPublish).not.toHaveBeenCalled();
    // Still open: the press neither ran the action nor dismissed the dialog.
    expect(getByText('Publish?')).toBeTruthy();
  });

  it('leaves an action without `loading` pressable and unannounced', () => {
    const onPublish = jest.fn();
    const { getByLabelText } = openWith([
      { label: 'Publish', onPress: onPublish, shouldCloseOnPress: false },
    ]);
    const host = getByLabelText('Publish');
    expect(host.props['aria-busy']).toBeUndefined();
    act(() => {
      fireEvent.press(host);
    });
    expect(onPublish).toHaveBeenCalledTimes(1);
  });
});

it('keeps a native imperative session through resize and chooses the new placement after complete close', () => {
  jest.useFakeTimers();
  const width = jest.spyOn(ReactNative, 'useWindowDimensions');
  width.mockReturnValue({ width: 1000, height: 800, scale: 1, fontScale: 1 });
  let control!: ReturnType<typeof useDialogControl>;
  const closed = jest.fn();
  const tree = () => (
    <BloomThemeProvider>
      <Harness>
        {(c) => {
          control = c;
          return (
            <Dialog control={c} placement={{ base: 'bottom', md: 'center' }} onClose={closed}>
              <Text>Native draft</Text>
            </Dialog>
          );
        }}
      </Harness>
    </BloomThemeProvider>
  );
  try {
    const screen = render(tree());
    act(() => control.open());
    const draft = screen.getByText('Native draft');
    width.mockReturnValue({ width: 320, height: 800, scale: 1, fontScale: 1 });
    screen.rerender(tree());
    expect(screen.getByText('Native draft')).toBe(draft);
    expect(screen.UNSAFE_queryByType(CenteredCard)).not.toBeNull();
    const callback = jest.fn();
    act(() => control.close(callback));
    act(() => jest.runOnlyPendingTimers());
    expect(closed).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Native draft')).toBeNull();
    act(() => control.open());
    expect(screen.getByText('Native draft')).toBeTruthy();
    expect(screen.UNSAFE_queryByType(CenteredCard)).toBeNull();
    expect(screen.UNSAFE_queryByProps({ detached: true })).toBeNull();
  } finally {
    width.mockRestore();
    jest.useRealTimers();
  }
});
