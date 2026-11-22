/**
 * iOS: SwiftUI's `confirmationDialog` (through `@expo/ui`'s `ConfirmationDialog`),
 * presented from the view that asks: the system draws it as an action sheet
 * from that view, or a popover in regular width, with its own cancel. Its rows
 * are SwiftUI buttons (a destructive row has the destructive role). Without
 * `@expo/ui`, Bloom's dialog.
 *
 * NOT VERIFIED: written without an iOS build (no Mac on this machine).
 */
import type { ComponentType, ReactNode } from 'react';
import { useTheme } from '@oxy.so/bloom/theme';

import { confirmationValues, type ConfirmationHostProps } from '../controls/confirmation-dialog';
import { ConfirmationHost as DialogHost } from './confirmation-host.web';
import { useMenuChoice } from './menu-actions';
import { readMenuRows, type MenuRowData } from './menu-rows';

type Slot = ComponentType<{ children?: ReactNode }>;

interface SwiftUI {
  Host: ComponentType<{
    matchContents?: boolean;
    colorScheme?: 'light' | 'dark';
    children?: ReactNode;
  }>;
  ConfirmationDialog: ComponentType<{
    title: string;
    isPresented: boolean;
    onIsPresentedChange: (presented: boolean) => void;
    titleVisibility?: 'automatic' | 'visible' | 'hidden';
    children?: ReactNode;
  }> & { Trigger: Slot; Actions: Slot; Message: Slot };
  Button: ComponentType<{
    label: string;
    role?: 'default' | 'destructive' | 'cancel';
    onPress?: () => void;
  }>;
  Text: ComponentType<{ children?: ReactNode }>;
  RNHostView: ComponentType<{ matchContents?: boolean; children: ReactNode }>;
}

let swift: SwiftUI | null | undefined;

function loadSwiftUI(): SwiftUI | null {
  if (swift !== undefined) return swift;
  swift = null;
  try {
    const module = require('@expo/ui/swift-ui') as SwiftUI;
    swift = module.ConfirmationDialog && module.RNHostView ? module : null;
  } catch {
    swift = null;
  }
  return swift;
}

/** The rows as SwiftUI's buttons: sections and dividers only group them. */
function buttons(rows: readonly MenuRowData[], ui: SwiftUI, out: ReactNode[] = []): ReactNode[] {
  for (const row of rows) {
    if (row.kind === 'section' || row.kind === 'submenu') buttons(row.rows, ui, out);
    else if (row.kind === 'item')
      out.push(
        <ui.Button
          key={row.id}
          label={row.title}
          role={row.destructive ? 'destructive' : 'default'}
          onPress={row.onPress}
        />,
      );
  }
  return out;
}

export function ConfirmationHost(props: ConfirmationHostProps) {
  const ui = loadSwiftUI();
  if (!ui) return <DialogHost {...props} />;
  return <SystemConfirmation {...props} ui={ui} />;
}

function SystemConfirmation({
  presenting,
  isPresented: [open, setOpen],
  dialog,
  ui,
}: ConfirmationHostProps & { ui: SwiftUI }) {
  const theme = useTheme();
  const own = confirmationValues(dialog);
  const { choose, running } = useMenuChoice(own.actions);
  const { ConfirmationDialog } = ui;
  return (
    <>
      <ui.Host matchContents colorScheme={theme.isDark ? 'dark' : 'light'}>
        <ConfirmationDialog
          title={own.title}
          isPresented={open}
          onIsPresentedChange={setOpen}
          titleVisibility={own.visibility}
        >
          <ConfirmationDialog.Trigger>
            <ui.RNHostView matchContents>{presenting}</ui.RNHostView>
          </ConfirmationDialog.Trigger>
          <ConfirmationDialog.Actions>
            {buttons(readMenuRows(dialog.children, choose), ui)}
          </ConfirmationDialog.Actions>
          {own.message === undefined ? null : (
            <ConfirmationDialog.Message>
              <ui.Text>{own.message}</ui.Text>
            </ConfirmationDialog.Message>
          )}
        </ConfirmationDialog>
      </ui.Host>
      {running}
    </>
  );
}
