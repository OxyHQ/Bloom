/**
 * A desktop platform's one alert layout (`dialog/DialogContent.tsx`): the
 * default button trailing in a row and on top of a stack, buttons sized to
 * their labels, the accent on the default alone, an optional icon, a narrow
 * card. Without a desktop platform the old full-width stack is unchanged.
 */
import type React from 'react';
import { StyleSheet, Text as RNText } from 'react-native';
import { act, fireEvent, render, within } from '@testing-library/react-native';

import { AlertDialog } from '../alert-dialog';
import {
  DESKTOP_ACTION_HEIGHT,
  DESKTOP_ACTION_MIN_WIDTH,
  DESKTOP_ALERT_WIDTH,
  desktopActionOrder,
  desktopDefaultAction,
  hasChildren,
} from '../dialog/DialogContent';
import type { DialogAction } from '../dialog/types';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { DESKTOP_TEXT_STYLES } from '../typography/desktop-scale';

const DESKTOP: PlatformSurfaceAdapter = { platform: 'desktop', capabilities: new Set(['window']) };

function renderOn(adapter: PlatformSurfaceAdapter | null, ui: React.ReactElement) {
  return render(
    <PlatformSurfaceProvider value={adapter}>
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>
    </PlatformSurfaceProvider>,
  );
}

const QUIT: DialogAction[] = [
  { label: 'Force Quit', color: 'cancel' },
  { label: 'Cancel', color: 'cancel' },
  { label: 'Quit', color: 'default', initialFocus: true },
];

describe('desktop alert order', () => {
  it('takes the initial-focus action as the default, else the first that is not a cancel', () => {
    expect(desktopDefaultAction(QUIT)).toBe(2);
    expect(
      desktopDefaultAction([
        { label: 'Delete', color: 'destructive' },
        { label: 'Cancel', color: 'cancel' },
      ]),
    ).toBe(0);
    expect(desktopDefaultAction([{ label: 'Done', color: 'cancel' }])).toBe(-1);
  });

  it('puts the default last in a row and first in a stack, the rest in the caller order', () => {
    expect(desktopActionOrder(QUIT, 'row').map((a) => a.label)).toEqual([
      'Force Quit',
      'Cancel',
      'Quit',
    ]);
    expect(desktopActionOrder(QUIT, 'stack').map((a) => a.label)).toEqual([
      'Quit',
      'Force Quit',
      'Cancel',
    ]);
    const confirm: DialogAction[] = [
      { label: 'Delete', color: 'destructive' },
      { label: 'Cancel', color: 'cancel' },
    ];
    expect(desktopActionOrder(confirm, 'row').map((a) => a.label)).toEqual(['Cancel', 'Delete']);
    expect(desktopActionOrder(confirm, 'stack').map((a) => a.label)).toEqual(['Delete', 'Cancel']);
  });

  it('tells a dialog of declarative chrome alone from one with content', () => {
    expect(hasChildren(undefined)).toBe(false);
    expect(hasChildren(null)).toBe(false);
    expect(hasChildren([null, false])).toBe(false);
    expect(hasChildren(<RNText>body</RNText>)).toBe(true);
  });
});

function labelsInOrder(root: ReturnType<typeof render>, labels: string[]) {
  const actions = root.getByTestId('bloom-dialog-actions');
  const found = within(actions)
    .getAllByText(new RegExp(`^(${labels.join('|')})$`))
    .map((node) => node.props.children as string);
  return found;
}

describe('AlertDialog on a desktop platform', () => {
  it('draws two buttons side by side, Cancel then the default, each sized to its label', () => {
    const root = renderOn(
      DESKTOP,
      <AlertDialog
        open
        onOpenChange={() => {}}
        title="Delete app?"
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep"
      />,
    );
    expect(labelsInOrder(root, ['Delete', 'Keep'])).toEqual(['Keep', 'Delete']);
    const button = root.getByLabelText('Delete');
    const style = StyleSheet.flatten(button.props.style);
    expect(style.minWidth).toBe(DESKTOP_ACTION_MIN_WIDTH);
    expect(style.height).toBe(DESKTOP_ACTION_HEIGHT);
    expect(style.width).toBeUndefined();
  });

  it('sets the title and message in the desktop text styles', () => {
    const root = renderOn(
      DESKTOP,
      <AlertDialog open onOpenChange={() => {}} title="Delete app?" description="Gone for good." />,
    );
    const title = StyleSheet.flatten(root.getByText('Delete app?').props.style);
    expect(title.fontSize).toBe(DESKTOP_TEXT_STYLES.headline.fontSize);
    expect(title.fontWeight).toBe(DESKTOP_TEXT_STYLES.headline.fontWeight);
    const message = StyleSheet.flatten(root.getByText('Gone for good.').props.style);
    expect(message.fontSize).toBe(DESKTOP_TEXT_STYLES.callout.fontSize);
  });

  it('draws an icon above the title when given one', () => {
    const root = renderOn(
      DESKTOP,
      <AlertDialog
        open
        onOpenChange={() => {}}
        title="Quit Inbox?"
        icon={<RNText testID="app-icon">icon</RNText>}
      />,
    );
    expect(root.getByTestId('bloom-dialog-icon')).toBeTruthy();
    expect(root.getByTestId('app-icon')).toBeTruthy();
  });

  it('keeps Return on the default and the press contract', () => {
    const onConfirm = jest.fn();
    const root = renderOn(
      DESKTOP,
      <AlertDialog
        open
        onOpenChange={() => {}}
        title="OK?"
        confirmLabel="Yes"
        onConfirm={onConfirm}
      />,
    );
    act(() => {
      fireEvent.press(root.getByText('Yes'));
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('a desktop alert of three buttons', () => {
  it('stacks them full width with the default on top and Cancel at the bottom', () => {
    // `Dialog` itself, as an application declares one (Activity Monitor's quit).
    const { Dialog } = require('../dialog') as typeof import('../dialog');
    const root = renderOn(
      DESKTOP,
      <Dialog open onClose={() => {}} title="Quit “Inbox”?" actions={QUIT} />,
    );
    expect(labelsInOrder(root, ['Force Quit', 'Cancel', 'Quit'])).toEqual([
      'Quit',
      'Force Quit',
      'Cancel',
    ]);
    const style = StyleSheet.flatten(root.getByLabelText('Quit').props.style);
    expect(style.width).toBe('100%');
  });
});

describe('without a desktop platform', () => {
  it('keeps the full-width stack in the caller order, at the large size', () => {
    const root = renderOn(
      null,
      <AlertDialog
        open
        onOpenChange={() => {}}
        title="Delete app?"
        confirmLabel="Delete"
        cancelLabel="Keep"
      />,
    );
    expect(root.queryByTestId('bloom-dialog-actions')).toBeNull();
    const style = StyleSheet.flatten(root.getByLabelText('Delete').props.style);
    expect(style.width).toBe('100%');
    expect(style.minWidth).toBeUndefined();
    const title = StyleSheet.flatten(root.getByText('Delete app?').props.style);
    expect(title.fontSize).toBe(22);
  });
});

describe('the desktop alert width', () => {
  it('is narrow', () => {
    expect(DESKTOP_ALERT_WIDTH).toBeLessThanOrEqual(300);
  });
});
