import { AlertDialog } from '@oxy.so/bloom/alert-dialog';
import { Button } from '@oxy.so/bloom/button';
import { ConnectionStatusToasts } from '@oxy.so/bloom/connection-status';
import { Dialog } from '@oxy.so/bloom/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@oxy.so/bloom/popover';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as O from '../src/controls/overlays';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const onPress = () => {};
const setOpen = () => {};
const confirm = () => {};
const cancel = () => {};

/** The view that presents: Bloom's Button, as an app writes it beside its overlay. */
const OPEN = L.Button(L.Text('Open')).onPress(onPress);
const OpenButton = () => <Button onPress={onPress}>Open</Button>;

const alerts: ParityCase[] = [
  ...([false, true] as const).map((open) => ({
    name: `alert ${open ? 'open' : 'closed'}`,
    language: () => toElement(OPEN.alert([open, setOpen], O.Alert('Delete post?'))),
    bloom: () => (
      <>
        <OpenButton />
        <AlertDialog open={open} onOpenChange={setOpen} title="Delete post?" />
      </>
    ),
  })),
  {
    name: 'alert with a message and its labels',
    language: () =>
      toElement(
        OPEN.alert(
          [true, setOpen],
          O.Alert('Leave the group?')
            .message('You can join again later.')
            .confirmLabel('Leave')
            .cancelLabel('Stay')
            .onConfirm(confirm)
            .onCancel(cancel),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <AlertDialog
          open
          onOpenChange={setOpen}
          title="Leave the group?"
          description="You can join again later."
          confirmLabel="Leave"
          cancelLabel="Stay"
          onConfirm={confirm}
          onCancel={cancel}
        />
      </>
    ),
  },
  {
    name: 'alert destructive',
    language: () =>
      toElement(
        OPEN.alert(
          [true, setOpen],
          O.Alert('Delete post?').confirmLabel('Delete').destructive().onConfirm(confirm),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <AlertDialog
          open
          onOpenChange={setOpen}
          title="Delete post?"
          confirmLabel="Delete"
          destructive
          onConfirm={confirm}
        />
      </>
    ),
  },
  {
    name: 'alert without cancel',
    language: () =>
      toElement(OPEN.alert([true, setOpen], O.Alert('Saved').confirmLabel('OK').hideCancel())),
    bloom: () => (
      <>
        <OpenButton />
        <AlertDialog open onOpenChange={setOpen} title="Saved" confirmLabel="OK" hideCancel />
      </>
    ),
  },
  ...ENUMS.alertDefault.map((action) => ({
    name: `alert default ${action}`,
    language: () =>
      toElement(OPEN.alert([true, setOpen], O.Alert('Discard?').defaultAction(action))),
    bloom: () => (
      <>
        <OpenButton />
        <AlertDialog open onOpenChange={setOpen} title="Discard?" defaultAction={action} />
      </>
    ),
  })),
  {
    name: 'alert not dismissible, with a test id',
    language: () =>
      toElement(
        OPEN.alert(
          [true, setOpen],
          O.Alert('Update required').dismissible(false).testID('update-alert'),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <AlertDialog
          open
          onOpenChange={setOpen}
          title="Update required"
          dismissible={false}
          testID="update-alert"
        />
      </>
    ),
  },
];

const dialogs: ParityCase[] = [
  ...([false, true] as const).map((open) => ({
    name: `dialog ${open ? 'open' : 'closed'}`,
    language: () =>
      toElement(OPEN.dialog([open, setOpen], O.Dialog(L.Text('Body')).title('Edit profile'))),
    bloom: () => (
      <>
        <OpenButton />
        <Dialog open={open} onClose={() => setOpen()} title="Edit profile">
          <Text>Body</Text>
        </Dialog>
      </>
    ),
  })),
  {
    name: 'dialog with a message, buttons and a name',
    language: () =>
      toElement(
        OPEN.dialog(
          [true, setOpen],
          O.Dialog(L.Text('Body'))
            .title('Share')
            .message('Anyone with the link can view it.')
            .label('Share the post')
            .buttons([
              { label: 'Copy link', onPress: confirm },
              { label: 'Cancel', color: 'cancel' },
            ])
            .testID('share-dialog'),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <Dialog
          open
          onClose={() => setOpen()}
          title="Share"
          description="Anyone with the link can view it."
          label="Share the post"
          actions={[
            { label: 'Copy link', onPress: confirm },
            { label: 'Cancel', color: 'cancel' },
          ]}
          testID="share-dialog"
        >
          <Text>Body</Text>
        </Dialog>
      </>
    ),
  },
  ...ENUMS.dialogPlacement.map((placement) => ({
    name: `dialog at ${placement}`,
    language: () =>
      toElement(
        OPEN.dialog(
          [true, setOpen],
          O.Dialog(L.Text('Body')).title('Filters').presentAt(placement),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <Dialog open onClose={() => setOpen()} title="Filters" placement={placement}>
          <Text>Body</Text>
        </Dialog>
      </>
    ),
  })),
  {
    name: 'dialog from the bottom, centred from md',
    language: () =>
      toElement(
        OPEN.dialog(
          [true, setOpen],
          O.Dialog(L.Text('Body')).title('Filters').presentAt('bottom', 'center'),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <Dialog
          open
          onClose={() => setOpen()}
          title="Filters"
          placement={{ base: 'bottom', md: 'center' }}
        >
          <Text>Body</Text>
        </Dialog>
      </>
    ),
  },
  {
    name: 'dialog scrollable, kept on a backdrop press',
    language: () =>
      toElement(
        OPEN.dialog(
          [true, setOpen],
          O.Dialog(L.Text('Body')).title('Terms').scrollable().dismissOnBackdrop(false),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <Dialog open onClose={() => setOpen()} title="Terms" scrollable dismissOnBackdrop={false}>
          <Text>Body</Text>
        </Dialog>
      </>
    ),
  },
];

const popovers: ParityCase[] = [
  ...([false, true] as const).map((open) => ({
    name: `popover ${open ? 'open' : 'closed'}`,
    language: () =>
      toElement(OPEN.popover([open, setOpen], O.Popover(L.Text('Details')).label('Details'))),
    bloom: () => (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button onPress={onPress}>Open</Button>
        </PopoverTrigger>
        <PopoverContent label="Details">
          <Text>Details</Text>
        </PopoverContent>
      </Popover>
    ),
  })),
  ...ENUMS.floatingSide.flatMap((side) =>
    ENUMS.floatingAlign.map((align) => ({
      name: `popover ${side} ${align}`,
      language: () =>
        toElement(
          OPEN.popover(
            [true, setOpen],
            O.Popover(L.Text('Details')).side(side, align).testID('pop'),
          ),
        ),
      bloom: () => (
        <Popover open onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button onPress={onPress}>Open</Button>
          </PopoverTrigger>
          <PopoverContent side={side} align={align} testID="pop">
            <Text>Details</Text>
          </PopoverContent>
        </Popover>
      ),
    })),
  ),
];

const feedback: ParityCase[] = [
  {
    name: 'connection status',
    language: () => toElement(O.ConnectionStatus()),
    bloom: () => <ConnectionStatusToasts />,
  },
];

export const OVERLAY_CASES: ParityCase[] = [...alerts, ...dialogs, ...popovers, ...feedback];
