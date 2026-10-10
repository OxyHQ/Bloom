import React, { useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Dialog } from './Dialog';
import { useDialogControl } from './context';
import { alert } from '../surfaces';
import { OverlayInertBoundary } from '../overlay';

const meta: Meta<typeof Dialog> = {
  argTypes: {
    placement: { control: 'select', options: ['center', 'start', 'end', 'left', 'right', 'bottom'] },
    "open": { control: 'boolean' },
    "title": { control: 'text' },
    "description": { control: 'text' },
    "width": { control: 'number' },
    "maxWidth": { control: 'number' },
    "maxHeightRatio": { control: 'number' },
    "showHandle": { control: 'boolean' },
    "startOpen": { control: 'boolean' },
    "scrollable": { control: 'boolean' },
    "contentPadding": { control: 'number' },
    "dismissOnBackdrop": { control: 'boolean' },
    "morph": { control: 'boolean' },
    "panelClassName": { control: 'text' },
    "containerClassName": { control: 'text' },
    "label": { control: 'text' }
  },
  title: 'Base/Dialog',
  component: Dialog,
};

export default meta;

type Story = StoryObj<typeof Dialog>;

function DeclarativeDemo() {
  const control = useDialogControl();
  return (
    <>
      <Button onPress={() => control.open()}>Open dialog</Button>
      <Dialog
        control={control}
        title="Sign out?"
        description="You'll need to enter your password to sign in again."
        actions={[
          { label: 'Sign out', color: 'destructive' },
          { label: 'Cancel', color: 'cancel' },
        ]}
      />
    </>
  );
}

function CustomChildrenDemo() {
  const control = useDialogControl();
  return (
    <>
      <Button onPress={() => control.open()}>Open custom dialog</Button>
      <Dialog control={control} title="Custom body">
        <View style={{ gap: 12 }}>
          <Text>Render any JSX inside the dialog body.</Text>
          <Button onPress={() => control.close()} appearance="outline" tone="neutral">
            Done
          </Button>
        </View>
      </Dialog>
    </>
  );
}

function AlertDemo() {
  return (
    <Button onPress={() =>
        alert('Delete project?', 'This action cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive' },
        ])
      }>
      Trigger alert()
    </Button>
  );
}

function ThreeActionDemo() {
  const control = useDialogControl();
  return (
    <>
      <Button onPress={() => control.open()}>Three actions</Button>
      <Dialog
        control={control}
        title="Save changes?"
        description="You have unsaved changes."
        actions={[
          { label: 'Save', color: 'default' },
          { label: 'Discard', color: 'destructive' },
          { label: 'Cancel', color: 'cancel' },
        ]}
      />
    </>
  );
}

/**
 * The side-sheet placement, which is a DIFFERENT web surface from the centered
 * card: it resolves `SheetSurface` in `Dialog.web.tsx`, whose entry animation is
 * a CSS transition handed to the backdrop layers rather than a shared value.
 *
 * It needs its own story because that difference is exactly what broke. The
 * layers used to be reanimated components, and on web reanimated routes a style
 * carrying `transitionProperty` into its CSS transitions manager, which writes
 * to `ref.style` — undefined on expo-blur's web `BlurView`, whose ref is a
 * `setNativeProps`-only handle. Opening the sheet threw before it painted. Only
 * a real browser sees it: jest mocks both packages, so the whole suite passed.
 */
function SideSheetDemo({ placement }: { placement: 'left' | 'right' }) {
  const control = useDialogControl();
  return (
    <>
      <Button onPress={() => control.open()}>Open {placement} sheet</Button>
      <Dialog control={control} placement={placement} title="Store menu">
        <View style={{ gap: 12 }}>
          <Text>An anchored drawer, blurred and dimmed behind.</Text>
          <Button onPress={() => control.close()} appearance="outline" tone="neutral">
            Done
          </Button>
        </View>
      </Dialog>
    </>
  );
}

export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: () => <DeclarativeDemo />,
};

export const SideSheetLeft: Story = {
  parameters: { controls: { disable: true } },
  render: () => <SideSheetDemo placement="left" />,
};

export const SideSheetRight: Story = {
  parameters: { controls: { disable: true } },
  render: () => <SideSheetDemo placement="right" />,
};

export const CustomChildren: Story = {
  parameters: { controls: { disable: true } },
  render: () => <CustomChildrenDemo />,
};

export const AlertHelper: Story = {
  parameters: { controls: { disable: true } },
  render: () => <AlertDemo />,
};

export const ThreeAction: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ThreeActionDemo />,
};

export const Composition: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <DeclarativeDemo />
      <CustomChildrenDemo />
      <AlertDemo />
    </View>
  ),
};

/** Controls configure the next presentation; dismissal stays imperative. */
export const Playground: Story = {
  args: { title: 'Review changes', description: 'Everything is ready to save.', width: 440, showHandle: true, dismissOnBackdrop: true, scrollable: true },
  parameters: { controls: { include: ['title', 'description', 'width', 'showHandle', 'dismissOnBackdrop', 'scrollable'] } },
  render: function PlaygroundDialog(args) {
    const control = useDialogControl();
    return <><Button onPress={() => control.open()}>Open dialog</Button><Dialog {...args} control={control} actions={[{ label: 'Done', color: 'default' }, { label: 'Cancel', color: 'cancel' }]} /></>;
  },
};

/** Exercises the semantic panel across a responsive placement change. */
export const ResponsiveAccessibility: Story = {
  args: { title: 'Account settings', description: 'Review your account preferences.' },
  render: function ResponsiveAccessibilityDemo(args) {
    const [open, setOpen] = React.useState(false);
    return (
      <OverlayInertBoundary>
        <Button onPress={() => setOpen(true)}>Open account settings</Button>
        <Dialog {...args} open={open} onClose={() => setOpen(false)} placement={{ base: 'bottom', md: 'center' }}>
          <Button onPress={() => setOpen(false)}>Save preferences</Button>
        </Dialog>
      </OverlayInertBoundary>
    );
  },
};

export const HeaderAccessibility: Story = {
  render: function HeaderAccessibilityDemo() {
    const control = useDialogControl();
    return (
      <OverlayInertBoundary>
        <Button onPress={() => control.open()}>Open account settings</Button>
        <Dialog control={control} placement="bottom" header={{ title: 'Account settings' }}>
          <Button onPress={() => control.close()}>Save preferences</Button>
        </Dialog>
      </OverlayInertBoundary>
    );
  },
};


function OwnedScrollerDemo({ placement = 'end', header = true }: { placement?: 'center' | 'bottom' | 'end'; header?: boolean }) {
  const control = useDialogControl();
  const scroll = useRef<ScrollView>(null);
  return <>
    <Button onPress={() => control.open()}>Open owned scroller</Button>
    <Dialog control={control} placement={placement} width={560} scrollable={false} contentPadding={0}
      label="Owned scroller" testID="owned-dialog" header={header ? { title: 'Owned scroller', largeTitle: false } : undefined}>
      <View style={{ flex: 1, minHeight: 0 }}>
        <Button onPress={() => scroll.current?.scrollTo({ y: 900, animated: false })}>Jump to row</Button>
        <ScrollView ref={scroll} style={{ flex: 1, minHeight: 0 }} testID="owned-scroll">
          {Array.from({ length: 60 }, (_, index) => <View key={index} style={{ height: 44 }}><Text>Row {index + 1}</Text></View>)}
        </ScrollView>
        <View style={{ height: 48 }} testID="owned-footer"><Button onPress={() => control.close()}>Done</Button></View>
      </View>
    </Dialog>
  </>;
}
export const OwnedScroller: Story = { args: { placement: 'end' }, render: args => <OwnedScrollerDemo placement={args.placement as 'center' | 'bottom' | 'end'} /> };
export const OwnedScrollerWithoutHeader: Story = { args: { placement: 'end' }, render: args => <OwnedScrollerDemo placement={args.placement as 'center' | 'bottom' | 'end'} header={false} /> };


export const OwnedScrollerPagination: Story = {
  args: { placement: 'bottom' },
  render: function Pagination(args) {
    const control = useDialogControl();
    return <>
      <Button onPress={() => control.open()}>Open paginated content</Button>
      <Dialog control={control} placement={args.placement} label="Paginated content" header={{ title: 'Paginated content', largeTitle: false }} scrollable={false} contentPadding={0}>
        <ScrollView style={{ flex: 1, minHeight: 0 }} testID="pagination-scroll">
          {Array.from({ length: 60 }, (_, index) => <View key={index} style={{ height: 44 }}><Text>Row {index + 1}</Text></View>)}
          <Button>Next page</Button>
        </ScrollView>
      </Dialog>
    </>;
  },
};

function MountedFocusDialog({ placement, onClose }: { placement: 'center' | 'end' | 'bottom'; onClose: () => void }) {
  const control = useDialogControl();
  React.useEffect(() => { control.open(); }, [control]);
  return <Dialog control={control} placement={placement} label="Focus restoration" header={{ title: 'Focus restoration', largeTitle:false }} onClose={onClose}>
    <Button onPress={() => control.close()}>Finish</Button>
  </Dialog>;
}
/** The opener is inert during exit; the host removes the dialog after closing. */
export const FocusRestoration: Story = {
  args:{ placement:'end' },
  render:function FocusRestorationDemo(args) {
    const [mounted,setMounted]=React.useState(false);
    return <>
      <OverlayInertBoundary testID="focus-boundary"><Button onPress={()=>setMounted(true)}>Open focus dialog</Button></OverlayInertBoundary>
      {mounted?<MountedFocusDialog placement={args.placement as 'center'|'end'|'bottom'} onClose={()=>setMounted(false)} />:null}
    </>;
  },
};

export const FlatMaterial: Story = {
  render: function FlatMaterialStory(args) {
    const control = useDialogControl();
    return <>
      <Button onPress={control.open}>Open flat panel</Button>
      <Dialog control={control} placement={args.placement ?? 'center'} material={args.material ?? 'flat'}
        label="Material panel" panelStyle={{ backgroundColor: '#f3d7b6' }} header={{ title: 'Panel title' }} testID="material-panel">
        <View style={{ height: 240, padding: 20 }}><Text>Opaque content surface</Text></View>
      </Dialog>
    </>;
  },
};


export const SideGutter: Story = {
  render: function SideGutter() {
    const full = useDialogControl();
    const inset = useDialogControl();
    return <>
      <Button onPress={() => full.open()}>Open full side sheet</Button>
      <Button onPress={() => inset.open()}>Open default side sheet</Button>
      <Dialog control={full} placement="end" width={10000} minSideGutter={0} title="Full side sheet" testID="full-side-panel">
        <Button onPress={() => full.close()}>Close full sheet</Button>
      </Dialog>
      <Dialog control={inset} placement="end" width={10000} title="Default side sheet" testID="default-side-panel">
        <Button onPress={() => inset.close()}>Close default sheet</Button>
      </Dialog>
    </>;
  },
};

export const BackdropTransition: Story = {
  args: { placement: 'end' },
  render: function BackdropTransitionStory(args) {
    const control = useDialogControl();
    return <>
      <OverlayInertBoundary><Button onPress={() => control.open()}>Open timed surface</Button></OverlayInertBoundary>
      <Dialog control={control} placement={args.placement} label="Timed surface" title="Timed surface" testID="timed-panel"
        backdrop={{ blurIntensity: 0, dimOpacity: 1, dimGradient: { direction: 'start-to-end', stops: [
          { offset: 0, color: 'rgba(0,0,0,0)' }, { offset: .6975, color: 'rgba(0,0,0,.36)' }, { offset: 1, color: 'rgba(0,0,0,.36)' },
        ] } }} transition={{ duration: 300, easing: [0, 0, .58, 1] }}>
        <Text>The paint and transition share the surface lifecycle.</Text>
        <Button onPress={() => control.close()}>Close timed surface</Button>
      </Dialog>
    </>;
  },
};
export const BackdropTransitionCenter: Story = { ...BackdropTransition, args: { placement: 'center' } };
export const BackdropTransitionBottom: Story = { ...BackdropTransition, args: { placement: 'bottom' } };

export const LoadingButtonNames: Story = {
  render: function LoadingButtonNamesStory() {
    const [open, setOpen] = React.useState(false);
    const [pending, setPending] = React.useState(false);
    return <>
      <Button onPress={() => setOpen(true)}>Open pending dialog</Button>
      <Dialog open={open} onClose={() => { if (!pending) setOpen(false); }} title="Pending action" dismissOnBackdrop={!pending}>
        <View style={{ gap: 12 }}>
          <Button disabled={pending} onPress={() => setOpen(false)}>Cancel action</Button>
          <Button loading={pending} disabled={false} onPress={() => setPending(true)}>Remove variant</Button>
          <Button loading={pending} disabled={false}><ComposedActionName /></Button>
          <Button loading={pending} disabled={false}>حذف المتغيّر</Button>
          <Button loading={pending} accessibilityLabel="Save item" iconOnly><Text>+</Text></Button>
          <Button loading={pending} href="#destination">Open destination</Button>
          <Button loading={pending} asChild><a href="#supplied">Supplied link</a></Button>
          <Button onPress={() => setPending(false)}>Finish request</Button>
        </View>
      </Dialog>
    </>;
  },
};

function ComposedActionName() {
  const [identity] = React.useState(() => Math.random().toString(36));
  return <span data-testid="composed-action-name" data-identity={identity}>
    Publish <strong>draft</strong><span aria-hidden="true"> decorative</span>
  </span>;
}

/** All actions temporarily unavailable while a request is in flight. */
export const PendingFocus: Story = {
  args: { placement: 'center' },
  render: function PendingFocusStory(args) {
    const control = useDialogControl();
    const [pending, setPending] = React.useState(false);
    React.useEffect(() => {
      if (!pending) return;
      const timer = setTimeout(() => setPending(false), 4000);
      return () => clearTimeout(timer);
    }, [pending]);
    return <>
      <OverlayInertBoundary testID="pending-boundary"><Button onPress={() => control.open()}>Open pending focus</Button></OverlayInertBoundary>
      <Dialog control={control} placement={args.placement} label="Pending focus" dismissOnBackdrop={!pending}>
        <View style={{ gap: 12 }}>
          <Button disabled={pending} onPress={() => control.close()}>Cancel request</Button>
          <Button loading={pending} onPress={() => setPending(true)}>Start request</Button>
        </View>
      </Dialog>
    </>;
  },
};
