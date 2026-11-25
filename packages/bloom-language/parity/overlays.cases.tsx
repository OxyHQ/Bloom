import { AlertDialog } from '@oxy.so/bloom/alert-dialog';
import { Button } from '@oxy.so/bloom/button';
import { ConnectionStatusToasts } from '@oxy.so/bloom/connection-status';
import { Dialog, type DialogControlProps, useDialogControl } from '@oxy.so/bloom/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@oxy.so/bloom/popover';
import { RiInformationLine } from '@oxy.so/bloom/icons';
import { tokens } from '@oxy.so/bloom/styles';
import { toast as bloomToast, ToastOutlet } from '@oxy.so/bloom/toast';
import { Text } from '@oxy.so/bloom/typography';
import { type ReactElement, type ReactNode, useEffect } from 'react';
import { View } from 'react-native';

import { ENUMS } from '../src/generated/spec.generated';
import * as O from '../src/controls/overlays';
import { ConfirmationDialog } from '../src/controls/confirmation-dialog';
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
    isolated: true,
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
    isolated: true,
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
    isolated: true,
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
    isolated: true,
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
    isolated: true,
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
    isolated: true,
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

/**
 * Confirmation dialogs where the platform has no grown-out sheet of its own (the
 * web; native without the lens): Bloom's Dialog beside the view, its rows a
 * column of actions, from the bottom and centred from md.
 */
const confirmations: ParityCase[] = [
  ...([false, true] as const).map((open) => ({
    name: `confirmation dialog ${open ? 'open' : 'closed'}`,
    language: () =>
      toElement(
        OPEN.confirmationDialog(
          [open, setOpen],
          ConfirmationDialog(
            'Delete this post?',
            L.Item('Delete').destructive().onPress(confirm),
            L.Item('Archive instead').onPress(cancel),
          ).message('It cannot be undone.'),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <Dialog
          open={open}
          onClose={() => setOpen()}
          title="Delete this post?"
          label="Delete this post?"
          description="It cannot be undone."
          actions={[
            { label: 'Delete', onPress: confirm, color: 'destructive' },
            { label: 'Archive instead', onPress: cancel, color: 'default' },
          ]}
          placement={{ base: 'bottom', md: 'center' }}
        />
      </>
    ),
  })),
  {
    name: 'confirmation dialog with its title hidden and a cancel row',
    language: () =>
      toElement(
        OPEN.confirmationDialog(
          [true, setOpen],
          ConfirmationDialog('Leave the call?', L.Item('Leave').destructive().onPress(confirm))
            .titleVisibility('hidden')
            .cancelLabel('Stay'),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <Dialog
          open
          onClose={() => setOpen()}
          label="Leave the call?"
          actions={[
            { label: 'Leave', onPress: confirm, color: 'destructive' },
            { label: 'Stay', color: 'cancel' },
          ]}
          placement={{ base: 'bottom', md: 'center' }}
        />
      </>
    ),
  },
];

const dialogs: ParityCase[] = [
  ...([false, true] as const).map((open) => ({
    name: `dialog ${open ? 'open' : 'closed'}`,
    isolated: true,
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
    isolated: true,
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
    isolated: true,
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
    isolated: true,
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
    isolated: true,
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

/** A dialog control (`useDialogControl()`) opened once mounted, as a FAB elsewhere opens it. */
function Opened({ children }: { children: (control: DialogControlProps) => ReactNode }): ReactNode {
  const control = useDialogControl();
  // biome-ignore lint/correctness/useExhaustiveDependencies: opened once, as the case is drawn
  useEffect(() => control.open(), []);
  return children(control);
}

/** Mention's payment sheets and saved-folder picker: a detached bottom panel kept to a width, a dialog a control opens. */
const dialogProps: ParityCase[] = [
  {
    name: 'a detached bottom dialog, its panel kept to a width, no content padding',
    isolated: true,
    language: () =>
      toElement(
        OPEN.dialog(
          [true, setOpen],
          O.Dialog(L.Text('Body'))
            .presentAt('bottom')
            .detached()
            .panelFrame({ maxWidth: '540' })
            .padding('none'),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <Dialog
          open
          onClose={() => setOpen()}
          placement="bottom"
          detached
          panelStyle={{ maxWidth: 540 }}
          contentPadding={0}
        >
          <Text>Body</Text>
        </Dialog>
      </>
    ),
  },
  {
    name: 'a dialog its control opens (.control())',
    isolated: true,
    language: () => (
      <Opened>
        {(control) => toElement(O.Dialog(L.Text('Body')).title('Save to folder').control(control))}
      </Opened>
    ),
    bloom: () => (
      <Opened>
        {(control) => (
          <Dialog control={control} title="Save to folder">
            <Text>Body</Text>
          </Dialog>
        )}
      </Opened>
    ),
  },
];

const popovers: ParityCase[] = [
  ...([false, true] as const).map((open) => ({
    name: `popover ${open ? 'open' : 'closed'}`,
    isolated: true,
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
      isolated: true,
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
    // Online, the toasts draw nothing on the web: no toast is up.
    drawsNothing: ['web'],
    language: () => toElement(O.ConnectionStatus()),
    bloom: () => <ConnectionStatusToasts />,
  },
  {
    name: 'connection status in its own words and timings',
    // Online, the toasts draw nothing on the web: no toast is up.
    drawsNothing: ['web'],
    language: () =>
      toElement(
        O.ConnectionStatus()
          .offlineMessage('No network')
          .reconnectingMessage('Trying again')
          .restoredMessage('Back online')
          .reconnectingDelay('1000')
          .restoredDuration('4000'),
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
    isolated: true,
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
    isolated: true,
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
    isolated: true,
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
    isolated: true,
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
    // Its content is a tree of its own: it paints from the page's preset, not the app's.
    name: 'dialog on a page with a colour preset of its own, its content painted',
    isolated: true,
    language: () =>
      toElement(
        OPEN.dialog(
          [true, setOpen],
          O.Dialog(L.Text('Body').foreground('primary').padding('md').background('surface'))
            .page({ key: 'details', colorPreset: 'green', direction: 'none' })
            .label('Details'),
        ),
      ),
    bloom: () => (
      <>
        <OpenButton />
        <Dialog
          open
          onClose={() => setOpen()}
          frame={{ key: 'details', colorPreset: 'green', direction: 'none' }}
          label="Details"
        >
          <Themed>
            {(c) => (
              <Text
                style={{
                  paddingTop: 12,
                  paddingBottom: 12,
                  paddingStart: 12,
                  paddingEnd: 12,
                  color: c.primary,
                  backgroundColor: c.backgroundSecondary,
                }}
              >
                Body
              </Text>
            )}
          </Themed>
        </Dialog>
      </>
    ),
  },
  {
    name: 'dialog at an app width, its gutter and height ceiling',
    isolated: true,
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
    isolated: true,
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
    isolated: true,
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

/**
 * A dialog that is a view of its own (`.presented(binding)`): Bloom's Dialog in
 * place, as a component that is a dialog returns it, its `open` and `onClose`
 * handed in by the caller.
 */
const presentedDialogs: ParityCase[] = [
  ...([false, true] as const).map((open) => ({
    name: `presented dialog ${open ? 'open' : 'closed'}`,
    // Open, it portals to the page: in Chrome each side is drawn alone. Closed,
    // Bloom's Dialog draws nothing on the web: the claim is that the node draws nothing too.
    ...(open ? { isolated: true } : { drawsNothing: ['web'] as const }),
    language: () =>
      toElement(O.Dialog(L.Text('Body')).title('Edit profile').presented([open, setOpen])),
    bloom: () => (
      <Dialog open={open} onClose={() => setOpen()} title="Edit profile">
        <Text>Body</Text>
      </Dialog>
    ),
  })),
  {
    name: 'presented dialog with its width, padding, placement and actions: none a box',
    isolated: true,
    language: () =>
      toElement(
        O.Dialog(L.Text('Body'))
          .label('Sources')
          .message('Where it came from.')
          .frame({ maxWidth: '400' })
          .padding('none')
          .presentAt('bottom', { md: 'center' })
          .header({ title: 'Sources' })
          .buttons([{ label: 'Done', onPress: confirm }])
          .dismissOnBackdrop(false)
          .testID('sources')
          .presented([true, setOpen]),
      ),
    bloom: () => (
      <Dialog
        open
        onClose={() => setOpen()}
        label="Sources"
        description="Where it came from."
        maxWidth={400}
        contentPadding={0}
        placement={{ base: 'bottom', md: 'center' }}
        header={{ title: 'Sources' }}
        actions={[{ label: 'Done', onPress: confirm }]}
        dismissOnBackdrop={false}
        testID="sources"
      >
        <Text>Body</Text>
      </Dialog>
    ),
  },
  {
    // onDismissed is a callback, not a look: the dialog draws what Bloom's draws with it.
    name: 'presented dialog that hears it has finished closing (onDismissed)',
    isolated: true,
    language: () =>
      toElement(
        O.Dialog(L.Text('Body'))
          .title('Edit profile')
          .onDismissed(confirm)
          .presented([true, setOpen]),
      ),
    bloom: () => (
      <Dialog open onClose={() => setOpen()} onDismissed={confirm} title="Edit profile">
        <Text>Body</Text>
      </Dialog>
    ),
  },
  {
    name: 'presented dialog in a stack, beside the button that opens it',
    language: () =>
      toElement(
        L.VStack(
          OPEN,
          O.Dialog(L.Text('Body')).title('Edit profile').presented([true, setOpen]),
        ).spacing('md'),
      ),
    bloom: () => (
      <View style={{ gap: space.md }}>
        <OpenButton />
        <Dialog open onClose={() => setOpen()} title="Edit profile">
          <Text>Body</Text>
        </Dialog>
      </View>
    ),
  },
];

export const OVERLAY_CASES: ParityCase[] = [
  ...alerts,
  ...dialogs,
  ...dialogProps,
  ...confirmations,
  ...presentedDialogs,
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
