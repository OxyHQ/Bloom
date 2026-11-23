import { useEffect, useRef, type ReactNode } from 'react';
import {
  BottomSheet,
  type BottomSheetProps,
  type BottomSheetRef,
} from '@oxy.so/bloom/bottom-sheet';
import { Screen } from '@oxy.so/bloom/screen';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import type { BottomSheetView } from '../src/node';
import * as L from '../src/primitives';
import { ScreenHost } from '../src/router/screen-host';
import type { ParityCase } from './support/cases';

const noop = () => {};
const keep = () => false;

/** A screen presenting `sheet` (open), as the language draws it. */
function presenting(sheet: BottomSheetView) {
  return (
    <ScreenHost
      root={L.Text('a')
        .header(false)
        .sheet(true, () => sheet, { onDismiss: noop })}
    />
  );
}

/** What an app writes today: a Bloom BottomSheet held open by its state, presented on mount. */
function OpenSheet(props: Omit<BottomSheetProps, 'open' | 'onDismiss'> & { children: ReactNode }) {
  const ref = useRef<BottomSheetRef>(null);
  useEffect(() => ref.current?.present(), []);
  return <BottomSheet ref={ref} open onDismiss={noop} {...props} />;
}

function bloom(props: Omit<BottomSheetProps, 'open' | 'onDismiss' | 'children'>) {
  return (
    <>
      <Screen>
        <Text>a</Text>
      </Screen>
      <OpenSheet {...props}>
        <Text>b</Text>
      </OpenSheet>
    </>
  );
}

/** A presented sheet draws into the page's portal root: each side has a page of its own in Chrome. */
const presented = (c: ParityCase): ParityCase => ({ ...c, isolated: true });

export const SHEET_CASES: ParityCase[] = [
  {
    name: 'a bottom sheet',
    language: () => presenting(L.BottomSheet(L.Text('b'))),
    bloom: () => bloom({}),
  },
  {
    name: 'detached, without its handle, flat',
    language: () =>
      presenting(L.BottomSheet(L.Text('b')).detached().dragIndicator('hidden').material('flat')),
    bloom: () => bloom({ detached: true, showHandle: false, material: 'flat' }),
  },
  ...ENUMS.sheetSizing.map((sizing) => ({
    name: `sized to ${sizing}, not scrolling`,
    language: () => presenting(L.BottomSheet(L.Text('b')).sizing(sizing).scrollable(false)),
    bloom: () => bloom({ sizing, scrollable: false }),
  })),
  {
    name: 'not dismissed by a drag, a veto, manual activation and a name',
    language: () =>
      presenting(
        L.BottomSheet(L.Text('b'))
          .interactiveDismissDisabled()
          .onDismissAttempt(keep)
          .manualActivation()
          .label('Filters'),
      ),
    bloom: () =>
      bloom({
        enablePanDownToClose: false,
        onDismissAttempt: keep,
        manualActivation: true,
        accessibilityLabel: 'Filters',
      }),
  },
  ...(['sheet', 'viewport'] as const).map((behavior) => ({
    name: `a footer, ${behavior}`,
    language: () => presenting(L.BottomSheet(L.Text('b')).footer(L.Text('apply'), { behavior })),
    bloom: () => bloom({ footer: <Text>apply</Text>, footerBehavior: behavior }),
  })),
].map(presented);
