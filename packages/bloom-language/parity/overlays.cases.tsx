import { AlertDialog } from '@oxy.so/bloom/alert-dialog';
import { Button } from '@oxy.so/bloom/button';
import { ConnectionStatusToasts } from '@oxy.so/bloom/connection-status';
import { Dialog } from '@oxy.so/bloom/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@oxy.so/bloom/popover';
import { RiInformationLine } from '@oxy.so/bloom/icons';
import { tokens } from '@oxy.so/bloom/styles';
import { toast as bloomToast, ToastOutlet } from '@oxy.so/bloom/toast';
import { Text } from '@oxy.so/bloom/typography';
import { type ReactElement, useEffect } from 'react';
import { View } from 'react-native';

import { ENUMS } from '../src/generated/spec.generated';
import * as O from '../src/controls/overlays';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { toast } from '../src/toast';
import { type ParityCase, Themed } from './support/cases';

const { space } = tokens;
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
          O.Dialog(L.Text('Body')).title('Filters').presentAt('bottom', { md: 'center' }),
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
  {
    name: 'connection status in its own words and timings',
    language: () =>
      toElement(
        O.ConnectionStatus()
          .offlineMessage('No network')
          .reconnectingMessage('Trying again')
          .restoredMessage('Back online')
          .reconnectingDelay(1000)
          .restoredDuration(4000),
      ),
    bloom: () => (
      <ConnectionStatusToasts
        offlineMessage="No network"
        reconnectingMessage="Trying again"
        restoredMessage="Back online"
        reconnectingDelayMs={1000}
        restoredDurationMs={4000}
      />
    ),
  },
];

// ── Wave 2's remaining overlays ──────────────────────────────────

const ICON = L.Icon(RiInformationLine).size('lg').foreground('primary');
const BloomIcon = () => <Themed>{(c) => <RiInformationLine size="lg" fill={c.primary} />}</Themed>;

const more: ParityCase[] = [
  {
    name: 'alert with an icon',
    language: () =>
      toElement(OPEN.alert([true, setOpen], O.Alert('Update ready').icon(ICON).hideCancel())),
    bloom: () => (
      <>
        <OpenButton />
        <AlertDialog
          open
          onOpenChange={setOpen}
          title="Update ready"
          icon={<BloomIcon />}
          hideCancel
        />
      </>
    ),
  },
  {
    name: 'dialog with a width, a ceiling and no content padding',
    language: () =>
      toElement(
        OPEN.dialog(
          [true, setOpen],
          O.Dialog(L.Text('Body'))
            .title('Wide')
            .frame({ width: '640', maxWidth: '768' })
            .padding('none'),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <Dialog
          open
          onClose={() => setOpen()}
          title="Wide"
          width={640}
          maxWidth={768}
          contentPadding={0}
        >
          <Text>Body</Text>
        </Dialog>
      </>
    ),
  },
  {
    name: 'dialog with a header and a footer',
    language: () =>
      toElement(
        OPEN.dialog(
          [true, setOpen],
          O.Dialog(L.Text('Body'))
            .header({ title: 'Settings', subtitle: 'Your account', largeTitle: false })
            .footer(L.Text('Saved a minute ago'))
            .label('Settings'),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <Dialog
          open
          onClose={() => setOpen()}
          header={{ title: 'Settings', subtitle: 'Your account', largeTitle: false }}
          footer={<Text>Saved a minute ago</Text>}
          label="Settings"
        >
          <Text>Body</Text>
        </Dialog>
      </>
    ),
  },
  {
    name: 'dialog on a page of its own',
    language: () =>
      toElement(
        OPEN.dialog(
          [true, setOpen],
          O.Dialog(L.Text('Body'))
            .page({ key: 'details', header: { title: 'Details' }, direction: 'none' })
            .label('Details'),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <Dialog
          open
          onClose={() => setOpen()}
          frame={{ key: 'details', header: { title: 'Details' }, direction: 'none' }}
          label="Details"
        >
          <Text>Body</Text>
        </Dialog>
      </>
    ),
  },
  {
    name: 'dialog at an app width, its gutter and height ceiling',
    language: () =>
      toElement(
        OPEN.dialog(
          [true, setOpen],
          O.Dialog(L.Text('Body'))
            .title('Compose')
            .frame({ width: '560', maxWidth: '720' })
            .sideGutter('none')
            .maxHeightRatio(0.9),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <Dialog
          open
          onClose={() => setOpen()}
          title="Compose"
          width={560}
          maxWidth={720}
          minSideGutter={0}
          maxHeightRatio={0.9}
        >
          <Text>Body</Text>
        </Dialog>
      </>
    ),
  },
  ...(['sm', 'md', 'lg', 'xl'] as const).map((tier) => ({
    name: `dialog from the bottom, at the end from ${tier}`,
    language: () =>
      toElement(
        OPEN.dialog(
          [true, setOpen],
          O.Dialog(L.Text('Body'))
            .title('Filters')
            .presentAt('bottom', { [tier]: 'end' }),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <Dialog
          open
          onClose={() => setOpen()}
          title="Filters"
          placement={{ base: 'bottom', [tier]: 'end' }}
        >
          <Text>Body</Text>
        </Dialog>
      </>
    ),
  })),
  {
    name: 'popover with offsets and widths',
    language: () =>
      toElement(
        OPEN.popover(
          [true, setOpen],
          O.Popover(L.Text('Details'))
            .side('bottom', 'start')
            .sideOffset('xs')
            .alignOffset('-sm')
            .frame({ minWidth: '240', maxWidth: '400', maxHeight: '384' }),
        ),
      ),
    bloom: () => (
      <Popover open onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button onPress={onPress}>Open</Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={4}
          alignOffset={-8}
          minWidth={240}
          maxWidth={400}
          maxHeight={384}
        >
          <Text>Details</Text>
        </PopoverContent>
      </Popover>
    ),
  },
];

export const OVERLAY_CASES: ParityCase[] = [
  ...alerts,
  ...dialogs,
  ...popovers,
  ...feedback,
  ...more,
];

/** Bloom's toast outlet with one toast `fire` raised as it mounts, dismissed as it goes. */
function Toasted({ fire }: { fire: () => string | number }): ReactElement {
  useEffect(() => {
    const id = fire();
    return () => {
      bloomToast.dismiss(id);
    };
  }, [fire]);
  return <ToastOutlet />;
}

const TOAST = { id: 'parity-toast' } as const;
const fireLanguage = () => toast.success('Saved', TOAST);
const fireBloom = () => bloomToast.success('Saved', TOAST);
const fireLanguageView = () =>
  toast.custom(
    L.HStack(L.Text('Uploaded'), L.Icon(RiInformationLine).size('md')).spacing('sm'),
    TOAST,
  );
const fireBloomView = () =>
  bloomToast.custom(
    <Themed>
      {(c) => (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Text>Uploaded</Text>
          <RiInformationLine size="md" fill={c.text} />
        </View>
      )}
    </Themed>,
    TOAST,
  );

/**
 * Toasts, raised through the language's `toast` and through Bloom's. A page has
 * one toast store, so two toasters side by side (the story's pairs) would each
 * draw both toasts: compared by the Jest suites, where one case renders at a
 * time, and left out of the story. The web suite compares the rows the toaster
 * portals into the document; native's toaster draws in Bloom's overlay host,
 * outside the committed tree, as an open dialog does.
 */
export const OVERLAY_CASES_TOASTS: ParityCase[] = [
  {
    name: 'toast with a title',
    language: () => <Toasted fire={fireLanguage} />,
    bloom: () => <Toasted fire={fireBloom} />,
  },
  {
    name: 'toast.custom with a view',
    language: () => <Toasted fire={fireLanguageView} />,
    bloom: () => <Toasted fire={fireBloomView} />,
  },
];
