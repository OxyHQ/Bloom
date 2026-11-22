/**
 * Android and OxyOS: the lens menu, grown out of the view that asks, as
 * Apple's action sheet grows out of the element that initiates it. The view
 * is drawn inside a lens base (the nearest one, or a base of its own with no
 * resting lens), the base holds the dialog's rows (its title and message as
 * headings, then its actions), and the binding opens and closes it. A row
 * closes it as it is chosen; outside and back cancel it. Without the lens,
 * Bloom's dialog.
 */
import { useLayoutEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '@oxy.so/bloom/theme';

import { confirmationValues, type ConfirmationHostProps } from '../controls/confirmation-dialog';
import { getLens, type Lens, type LensRow } from './lens';
import { useMenuChoice } from './menu-actions';
import { lensMenuConfig, MENU_FONT_FAMILY, toLensRows } from './menu-host.android';
import { readMenuRows } from './menu-rows';
import { ConfirmationHost as DialogHost } from './confirmation-host.web';

export function ConfirmationHost(props: ConfirmationHostProps) {
  const lens = getLens();
  if (!lens) return <DialogHost {...props} />;
  return <LensConfirmation {...props} lens={lens} />;
}

function LensConfirmation({
  presenting,
  isPresented,
  dialog,
  render,
  lens,
}: ConfirmationHostProps & { lens: Lens }) {
  const theme = useTheme();
  const own = confirmationValues(dialog);
  const { choose, running } = useMenuChoice(own.actions);
  const inBase = lens.useInLensBase();
  const opener = (
    <ConfirmationOpener
      presenting={presenting}
      isPresented={isPresented}
      dialog={dialog}
      render={render}
      lens={lens}
      choose={choose}
    />
  );
  const { LensBase } = lens;
  return (
    <>
      {inBase ? (
        opener
      ) : (
        // A base of its own with no resting lens: the menu grows out of the view's shape.
        <LensBase lens={false} colorScheme={theme.isDark ? 'dark' : 'light'} style={BASE_STYLE}>
          {opener}
        </LensBase>
      )}
      {running}
    </>
  );
}

/** The dialog in the nearest base: the base holds its rows, and the binding opens and closes it. */
function ConfirmationOpener({
  presenting,
  isPresented: [open, setOpen],
  dialog,
  render,
  lens,
  choose,
}: ConfirmationHostProps & { lens: Lens; choose: ((tag: string) => void) | undefined }) {
  const theme = useTheme();
  const own = confirmationValues(dialog);
  const config = useMemo(() => lensMenuConfig(theme), [theme]);
  const rows: LensRow[] = [];
  if (own.visibility !== 'hidden') rows.push({ kind: 'heading', id: 'title', title: own.title });
  if (own.message !== undefined) rows.push({ kind: 'heading', id: 'message', title: own.message });
  if (rows.length > 0) rows.push({ kind: 'separator', id: 'head' });
  rows.push(...toLensRows(readMenuRows(dialog.children, choose), render));
  if (own.cancelLabel !== undefined)
    rows.push(
      { kind: 'separator', id: 'cancel-' },
      { kind: 'item', id: 'cancel', title: own.cancelLabel, onSelect: () => setOpen(false) },
    );
  const handle = lens.useLensBaseMenu({
    rows,
    config,
    fontFamily: MENU_FONT_FAMILY,
    onClosed: () => setOpen(false),
  });
  useLayoutEffect(() => {
    if (open) handle?.open();
    else handle?.close();
  }, [open, handle]);
  return <View testID={own.testID}>{presenting}</View>;
}

const BASE_STYLE = { alignSelf: 'flex-start' } as const;
