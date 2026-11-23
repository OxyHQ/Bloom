/**
 * The web (and a platform without its own): Bloom's `Dialog` beside the view,
 * from the bottom and centred from `md`, its rows a column of actions. Each
 * action closes it, and the backdrop and Escape cancel it.
 */
import { Fragment } from 'react';
import { Dialog as BloomDialog, type DialogAction } from '@oxy.so/bloom/dialog';

import { confirmationValues, type ConfirmationHostProps } from '../controls/confirmation-dialog';
import { useMenuChoice } from './menu-actions';
import { readMenuRows, type MenuRowData } from './menu-rows';

/** A dialog's rows, flattened to its actions (sections and dividers only group them). */
function actionRows(rows: readonly MenuRowData[], out: DialogAction[] = []): DialogAction[] {
  for (const row of rows) {
    if (row.kind === 'section' || row.kind === 'submenu') actionRows(row.rows, out);
    else if (row.kind === 'item')
      out.push({
        label: row.title,
        onPress: row.onPress,
        color: row.destructive ? 'destructive' : 'default',
        disabled: row.disabled || undefined,
        testID: row.testID,
      });
  }
  return out;
}

export function ConfirmationHost({
  presenting,
  isPresented: [open, setOpen],
  dialog,
}: ConfirmationHostProps) {
  const own = confirmationValues(dialog);
  const { choose, running } = useMenuChoice(own.actions);
  const actions = actionRows(readMenuRows(dialog.children, choose));
  if (own.cancelLabel !== undefined) actions.push({ label: own.cancelLabel, color: 'cancel' });
  return (
    <Fragment>
      {presenting}
      <BloomDialog
        open={open}
        onClose={() => setOpen(false)}
        title={own.visibility === 'hidden' ? undefined : own.title}
        label={own.title}
        description={own.message}
        actions={actions}
        placement={{ base: 'bottom', md: 'center' }}
        testID={own.testID}
      />
      {running}
    </Fragment>
  );
}
