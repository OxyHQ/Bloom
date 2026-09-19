/**
 * FIVE COMPOSITIONS, none of which is a header.
 *
 * Issue #148 asks for integration cases that do not depend on the component the
 * contracts were built for, because a contract that only works in the screen it
 * was written for is a private arrangement rather than a contract. So: a form in
 * a sheet, an interactive row with a secondary action, a chat bar, a data screen
 * and a shell screen — each asserting the property that CROSSES a boundary,
 * which is the only kind of property a per-family suite cannot see.
 *
 * ── WHAT THIS INSTRUMENT CAN AND CANNOT SEE ─────────────────────────────────
 *
 * jest with Bloom's react-native mock. It reads the element tree: props, ids,
 * roles, names, how many times a callback fired, which context reached which
 * node. It sees NOTHING about paint, layer order, hit testing, keyboard focus or
 * whether a class resolved to CSS — every one of those has its own instrument in
 * this repo (`scripts/verify-overlay-stacking.mjs`, `verify-trigger-disabled.mjs`,
 * `verify-header-islands.mjs`, and the `jsdom` suites that mount real
 * react-native-web). Nothing here should be read as a visual or device
 * verification; where a property needs one, the assertion says so.
 */
import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BottomSheet } from '../bottom-sheet';
import { Button } from '../button';
import { Card } from '../card';
import { ContentPanel } from '../content-panel';
import { DataTable, type DataTableColumn } from '../data-table';
import { Field } from '../field';
import { Select, SelectTrigger, SelectValue } from '../select';
import { Switch } from '../switch';
import { TextField, TextFieldInput } from '../text-field';
import { Textarea } from '../textarea';
import { ControlSurface } from '../control-surface';
import { ScreenScope, TopEdgeProvider, useClaimTopEdge, useTopEdgeInset } from '../layout';
import { Text } from '../typography';

function screen(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

type Props = Record<string, unknown>;

// ---------------------------------------------------------------------------
//  1. A FORM IN A BOTTOM SHEET
// ---------------------------------------------------------------------------

describe('1. a form in a bottom sheet', () => {
  function Sheet({ disabled = false, error }: { disabled?: boolean; error?: string }) {
    const [submits, setSubmits] = useState(0);
    return (
      <BottomSheet open>
        <Field label="Room name" error={error} disabled={disabled}>
          <TextField>
            <TextFieldInput testID="name" label="Room name" value="" onChangeText={() => {}} />
          </TextField>
        </Field>
        <Field label="Visibility" disabled={disabled}>
          <Select value="public" onValueChange={() => {}}>
            <SelectTrigger testID="visibility">
              <SelectValue placeholder="Pick one" />
            </SelectTrigger>
          </Select>
        </Field>
        <Field label="Notify members" disabled={disabled}>
          <Switch testID="notify" value onValueChange={() => {}} />
        </Field>
        <Button testID="submit" onPress={() => setSubmits((n) => n + 1)}>
          Create
        </Button>
        <Text testID="submits">{String(submits)}</Text>
      </BottomSheet>
    );
  }

  it('associates the error with the control INSIDE the sheet', () => {
    // The sheet is a portalled surface on web and a separate subtree on native,
    // which is exactly where a context-based association is most likely to be
    // lost — and losing it renders identically.
    const view = screen(<Sheet error="Names are unique" />);
    const errorId = (view.getByText('Names are unique').props as Props).nativeID;
    expect((view.getByTestId('name').props as Props)['aria-describedby']).toBe(errorId);
  });

  it('disables the text field, the select trigger AND the switch from the field', () => {
    const view = screen(<Sheet disabled />);
    expect((view.getByTestId('name').props as Props).editable).toBe(false);
    expect((view.getByLabelText('Visibility').props as Props).disabled).toBe(true);
    expect((view.getByTestId('notify').props as Props).disabled).toBe(true);
  });

  it('submits ONCE per press', () => {
    const view = screen(<Sheet />);
    fireEvent.press(view.getByTestId('submit'));
    expect(view.getByTestId('submits').props.children).toBe('1');
  });

  it('names the switch from its field, which is the only name it can have', () => {
    const view = screen(<Sheet />);
    expect((view.getByTestId('notify').props as Props).accessibilityLabel).toBe('Notify members');
  });
});

// ---------------------------------------------------------------------------
//  2. AN INTERACTIVE ROW WITH A SECONDARY ACTION
// ---------------------------------------------------------------------------

describe('2. an interactive card with a secondary action', () => {
  function Row({ onOpen, onArchive }: { onOpen: () => void; onArchive: () => void }) {
    return (
      <Card testID="row" onPress={onOpen} accessibilityLabel="Order 4821">
        <Text>Order 4821</Text>
        <Button testID="archive" onPress={onArchive} variant="ghost" size="small">
          Archive
        </Button>
      </Card>
    );
  }

  it('the secondary action does not also fire the row', () => {
    // The ambiguity the issue names: a row whose whole surface is pressable, with
    // a second control inside it. React Native does not bubble a press, so the
    // inner control wins — but a web build DOES bubble a click, so the same
    // property has to be verified in a browser before it can be claimed for web.
    const onOpen = jest.fn();
    const onArchive = jest.fn();
    const view = screen(<Row onOpen={onOpen} onArchive={onArchive} />);
    fireEvent.press(view.getByTestId('archive'));
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('the row still fires for a press on the row itself', () => {
    const onOpen = jest.fn();
    const view = screen(<Row onOpen={onOpen} onArchive={() => {}} />);
    fireEvent.press(view.getByTestId('row'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
//  3. A CHAT BAR
// ---------------------------------------------------------------------------

describe('3. a chat composer', () => {
  it('sends once per press and keeps the draft the caller owns', () => {
    const { ChatComposer } = require('../chat-composer') as typeof import('../chat-composer');
    const onSend = jest.fn();
    const view = screen(<ChatComposer value="hello" onSend={onSend} testID="composer" />);
    const send = view.getByLabelText('Send');
    fireEvent.press(send);
    fireEvent.press(send);
    // Two presses, two sends — a composer that ALSO sent on change would report
    // four, and one that swallowed the second would report one.
    expect(onSend).toHaveBeenCalledTimes(2);
    expect(onSend).toHaveBeenLastCalledWith('hello');
  });

  it('a disabled bar fires nothing at all', () => {
    const { ChatComposer } = require('../chat-composer') as typeof import('../chat-composer');
    const onSend = jest.fn();
    const onAttachPress = jest.fn();
    const view = screen(
      <ChatComposer value="hello" onSend={onSend} onAttachPress={onAttachPress} disabled testID="composer" />,
    );
    fireEvent.press(view.getByLabelText('Send'));
    expect(onSend).not.toHaveBeenCalled();
    expect(onAttachPress).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
//  4. A DATA SCREEN
// ---------------------------------------------------------------------------

describe('4. a data screen: a table inside a panel inside a card', () => {
  interface Member {
    name: string;
  }
  const COLUMNS = [
    { id: 'name', header: 'Name', cell: ({ row }: { row: Member }) => row.name },
  ] satisfies readonly DataTableColumn<Member>[];

  it('renders the EMPTY state inside the panel rather than an empty table', () => {
    const view = screen(
      <ContentPanel>
        <Card>
          <DataTable<Member>
            accessibilityLabel="Members"
            rows={[]}
            columns={COLUMNS}
            getRowId={(row) => row.name}
            emptyState={<Text testID="empty">No members yet</Text>}
            testID="table"
          />
        </Card>
      </ContentPanel>,
    );
    expect(view.getByTestId('empty')).toBeTruthy();
  });

  it('keeps the table’s own accessible name when nested three surfaces deep', () => {
    const view = screen(
      <ContentPanel>
        <Card>
          <DataTable<Member>
            accessibilityLabel="Members"
            rows={[{ name: 'Ada' }]}
            columns={COLUMNS}
            getRowId={(row) => row.name}
            testID="table"
          />
        </Card>
      </ContentPanel>,
    );
    expect(view.getByLabelText('Members')).toBeTruthy();
  });

  it('a filter row in a small control surface makes its fields small without a prop each', () => {
    const view = screen(
      <Card>
        <ControlSurface density="small">
          <Textarea testID="notes" label="Notes" />
        </ControlSurface>
      </Card>,
    );
    // Read the resolved geometry, not the prop: the claim is that the control
    // DRAWS smaller, and a prop threaded through would satisfy a prop-level test
    // without changing a pixel.
    const shells = view.UNSAFE_getAllByType(require('react-native').View);
    const padded = shells
      .map((node: { props: { style?: unknown } }) =>
        Object.assign({}, ...[node.props.style].flat(3).filter(Boolean)),
      )
      .find((style: { paddingHorizontal?: number }) => style.paddingHorizontal !== undefined);
    const { TEXT_FIELD_GEOMETRY, TEXT_FIELD_RING_WIDTH } =
      require('../text-field/shared') as typeof import('../text-field/shared');
    expect(padded?.paddingHorizontal).toBe(
      TEXT_FIELD_GEOMETRY.small.paddingHorizontal - TEXT_FIELD_RING_WIDTH,
    );
  });
});

// ---------------------------------------------------------------------------
//  5. A SCREEN OF A SPECIALISED MODULE
// ---------------------------------------------------------------------------

describe('5. a screen with overlaying chrome and a modal over it', () => {
  function Chrome({ height }: { height: number }) {
    useClaimTopEdge(height);
    return null;
  }
  function Content({ testID }: { testID: string }) {
    return <Text testID={testID}>{String(useTopEdgeInset())}</Text>;
  }

  it('the page pads for its own chrome, and a modal’s chrome does not reach it', () => {
    // The composition the issue names: nested layouts must not take another
    // screen's insets. Both directions, in one tree.
    const view = screen(
      <TopEdgeProvider>
        <Chrome height={96} />
        <Content testID="page" />
        <ScreenScope>
          <Chrome height={140} />
          <Content testID="modal" />
        </ScreenScope>
      </TopEdgeProvider>,
    );
    expect(view.getByTestId('page').props.children).toBe('96');
    expect(view.getByTestId('modal').props.children).toBe('140');
  });

  it('a sheet on that screen is its own scope, so the form inside it clears nothing of the page', () => {
    const view = screen(
      <TopEdgeProvider>
        <Chrome height={96} />
        <BottomSheet open>
          <Content testID="in-sheet" />
        </BottomSheet>
      </TopEdgeProvider>,
    );
    expect(view.getByTestId('in-sheet').props.children).toBe('0');
  });
});
