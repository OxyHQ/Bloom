import { Text } from 'react-native';
import { DetailDialog, DetailDialogSection, DetailDialogSectionGroup, Dialog } from '@bloom/dialog';
import { PortalOutlet, PortalProvider } from '@bloom/portal';
import type { ReactNode } from 'react';
import type { Cases } from '../support/cases';

const noop = () => {};

/** A portaled surface draws into the app's outlet. */
function Portaled({ children }: { children: ReactNode }) {
  return (
    <PortalProvider>
      {children}
      <PortalOutlet />
    </PortalProvider>
  );
}

export const CASES: Cases = {
  'DetailDialogSection group': () => (
    <DetailDialogSectionGroup testID="group">
      <DetailDialogSection label="Status">
        <Text>Open</Text>
      </DetailDialogSection>
      <DetailDialogSection label="Owner">
        <Text>Ana</Text>
        <Text>Ben</Text>
      </DetailDialogSection>
    </DetailDialogSectionGroup>
  ),
  'Dialog center, styled': () => (
    <Dialog
      open
      onClose={noop}
      label="Rename"
      title="Rename"
      style={{ margin: 1 }}
      panelStyle={{ padding: 4 }}
      containerStyle={{ paddingTop: 2 }}
    >
      <Text>Body</Text>
    </Dialog>
  ),
  'Dialog bottom': () => (
    <Dialog open onClose={noop} label="Sheet" placement="bottom" panelStyle={{ padding: 4 }}>
      <Text>Body</Text>
    </Dialog>
  ),
  'Dialog side': () => (
    <Portaled>
      <Dialog open onClose={noop} label="Side" placement="right" containerStyle={{ paddingTop: 2 }}>
        <Text>Body</Text>
      </Dialog>
    </Portaled>
  ),
  'DetailDialog, scroll footer': () => (
    <Portaled>
      <DetailDialog
        open
        onClose={noop}
        label="Ticket"
        header="Ticket"
        scrollFooter={<Text>Foot</Text>}
      >
        <DetailDialogSection label="Status">
          <Text>Open</Text>
        </DetailDialogSection>
      </DetailDialog>
    </Portaled>
  ),
  'DetailDialog, centred, not scrollable': () => (
    <Portaled>
      <DetailDialog open onClose={noop} label="Ticket" mode="center" scrollable={false}>
        <Text>Body</Text>
      </DetailDialog>
    </Portaled>
  ),
  'Dialog title and description': () => (
    <Dialog open onClose={noop} label="Delete" title="Delete" description="It cannot be undone.">
      <Text>Body</Text>
    </Dialog>
  ),
};
