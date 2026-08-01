/**
 * Stacked-overlay stories.
 *
 * These exist because overlay stacking used to be decided by hand-picked
 * `zIndex` constants, so the answer to "which surface is on top" depended on
 * WHICH KIND of surface each one was rather than on which one the user opened
 * last. The failure was silent and total: the later surface rendered perfectly,
 * fully interactive, entirely behind the earlier one — unreachable and
 * undismissable.
 *
 * Every story opens a second surface from INSIDE a first one and puts a button
 * in the second surface that writes into a result line. That makes the check a
 * real one: drive it with actual input at the button's coordinates and the
 * result only changes if the second surface genuinely received the press. A
 * geometry read (`zIndex`, bounding boxes) would pass on a surface the user
 * cannot touch. `src/__tests__/overlay-stack-order.test.ts` covers the ordering
 * rule itself; `scripts/verify-overlay-stacking.mjs` drives these stories in a
 * real browser.
 */
import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BottomSheet, type BottomSheetRef } from '../bottom-sheet';
import { Button } from '../button';
import { Dialog } from '../dialog/Dialog';
import { useDialogControl } from '../dialog/context';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../menu';

const meta: Meta = {
  title: 'Components/Overlay stacking',
};

export default meta;

type Story = StoryObj;

/** The line the harness reads. Starts at `idle`; the top surface writes to it. */
function Result({ value }: { value: string }) {
  return <Text testID="result">result: {value}</Text>;
}

/**
 * The reported bug: a confirm dialog opened from a control inside an open bottom
 * sheet. The dialog opens LAST, so it must be the surface that takes the press.
 */
function DialogOverSheet() {
  const sheetRef = useRef<BottomSheetRef>(null);
  const dialogControl = useDialogControl();
  const [result, setResult] = useState('idle');

  return (
    <>
      <Button testID="open-first" onPress={() => sheetRef.current?.present()}>
        Open sheet
      </Button>
      <Result value={result} />

      <BottomSheet ref={sheetRef}>
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>Post options</Text>
          <Button
            testID="open-second"
            variant="secondary"
            onPress={() => dialogControl.open()}
          >
            Delete post
          </Button>
        </View>
      </BottomSheet>

      <Dialog
        control={dialogControl}
        testID="confirm-dialog"
        title="Delete post?"
        description="This cannot be undone."
        actions={[
          {
            label: 'Delete',
            color: 'destructive',
            testID: 'top-action',
            onPress: () => setResult('dialog'),
          },
          { label: 'Cancel', color: 'cancel' },
        ]}
      />
    </>
  );
}

/** The mirror image: a sheet opened from inside an already-open dialog. */
function SheetOverDialog() {
  const sheetRef = useRef<BottomSheetRef>(null);
  const dialogControl = useDialogControl();
  const [result, setResult] = useState('idle');

  return (
    <>
      <Button testID="open-first" onPress={() => dialogControl.open()}>
        Open dialog
      </Button>
      <Result value={result} />

      <Dialog control={dialogControl} testID="outer-dialog" title="Settings">
        <Button
          testID="open-second"
          variant="secondary"
          onPress={() => sheetRef.current?.present()}
        >
          Pick an option
        </Button>
      </Dialog>

      <BottomSheet ref={sheetRef}>
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>Options</Text>
          <Button testID="top-action" variant="secondary" onPress={() => setResult('sheet')}>
            Choose this
          </Button>
        </View>
      </BottomSheet>
    </>
  );
}

/** Two dialogs. The second must sit above the first. */
function DialogOverDialog() {
  const first = useDialogControl();
  const second = useDialogControl();
  const [result, setResult] = useState('idle');

  return (
    <>
      <Button testID="open-first" onPress={() => first.open()}>
        Open first dialog
      </Button>
      <Result value={result} />

      <Dialog control={first} testID="first-dialog" title="First">
        <Button testID="open-second" variant="secondary" onPress={() => second.open()}>
          Open second dialog
        </Button>
      </Dialog>

      <Dialog control={second} testID="second-dialog" title="Second">
        <Button testID="top-action" variant="secondary" onPress={() => setResult('second')}>
          Act
        </Button>
      </Dialog>
    </>
  );
}

/**
 * A menu opened from inside a dialog. `Menu` sat on the `dropdown` rung of the
 * scale (40/41) and the dialog on `overlay` (50/60), so the menu opened behind
 * the dialog that launched it no matter what order they opened in.
 */
function MenuOverDialog() {
  const control = useDialogControl();
  const [result, setResult] = useState('idle');

  return (
    <>
      <Button testID="open-first" onPress={() => control.open()}>
        Open dialog
      </Button>
      <Result value={result} />

      <Dialog control={control} testID="menu-host-dialog" title="Filters">
        <Menu>
          <MenuTrigger label="Sort by">
            {({ props }) => (
              <Button {...props} testID="open-second" variant="secondary">
                Sort by
              </Button>
            )}
          </MenuTrigger>
          <MenuContent>
            <MenuItem testID="top-action" label="Newest" onPress={() => setResult('menu')} />
            <MenuItem label="Oldest" onPress={() => setResult('menu-oldest')} />
          </MenuContent>
        </Menu>
      </Dialog>
    </>
  );
}

export const DialogOverSheetStory: Story = {
  name: 'Dialog over sheet',
  render: () => <DialogOverSheet />,
};

export const SheetOverDialogStory: Story = {
  name: 'Sheet over dialog',
  render: () => <SheetOverDialog />,
};

export const DialogOverDialogStory: Story = {
  name: 'Dialog over dialog',
  render: () => <DialogOverDialog />,
};

export const MenuOverDialogStory: Story = {
  name: 'Menu over dialog',
  render: () => <MenuOverDialog />,
};
