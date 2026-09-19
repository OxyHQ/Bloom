/**
 * A modal is a second SCREEN, and the two screen-scoped contracts must not
 * cross it.
 *
 * The failure without the scope is silent in both directions and only shows up
 * as layout: a header inside a full-screen dialog claims the top edge of the
 * page UNDERNEATH it, so that page gets padded for chrome it does not have (and
 * un-padded again when the modal closes); chrome inside a sheet reads the page's
 * scroll offset, so it reacts to a scroller the user is not touching and ignores
 * the one they are.
 *
 * Every assertion here is written in both directions — the claim must not escape
 * the scope, AND it must still reach a reader inside it. A scope that blocked
 * everything would pass a one-directional test while breaking the surface's own
 * chrome.
 */
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { ScreenScope, ScrollOffsetProvider, TopEdgeProvider, useClaimTopEdge, useTopEdgeInset, useScrollOffset } from '../layout';
import { BottomEdgeProvider, useBottomEdgeInset, useClaimBottomEdge } from '../layout';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { DialogBody } from '../dialog/DialogContent';

function ClaimTop({ height }: { height: number }) {
  useClaimTopEdge(height);
  return null;
}

function ClaimBottom({ height }: { height: number }) {
  useClaimBottomEdge(height);
  return null;
}

function TopReader({ testID }: { testID: string }) {
  return <Text testID={testID}>{String(useTopEdgeInset())}</Text>;
}

function BottomReader({ testID }: { testID: string }) {
  return <Text testID={testID}>{String(useBottomEdgeInset())}</Text>;
}

function OffsetReader({ testID }: { testID: string }) {
  const offset = useScrollOffset();
  return <Text testID={testID}>{offset === null ? 'none' : 'published'}</Text>;
}

describe('ScreenScope', () => {
  it('keeps a claim made inside it away from a reader outside', () => {
    const { getByTestId } = render(
      <TopEdgeProvider>
        <TopReader testID="outside" />
        <ScreenScope>
          <ClaimTop height={72} />
          <TopReader testID="inside" />
        </ScreenScope>
      </TopEdgeProvider>,
    );
    expect(getByTestId('inside').props.children).toBe('72');
    expect(getByTestId('outside').props.children).toBe('0');
  });

  it('still lets the surface’s OWN chrome be read inside it', () => {
    // The other direction: a scope that simply swallowed claims would pass the
    // case above and break every header inside a sheet.
    const { getByTestId } = render(
      <TopEdgeProvider>
        <ClaimTop height={56} />
        <ScreenScope>
          <ClaimTop height={104} />
          <TopReader testID="inside" />
        </ScreenScope>
        <TopReader testID="outside" />
      </TopEdgeProvider>,
    );
    expect(getByTestId('inside').props.children).toBe('104');
    // The page keeps its own claim, unchanged by what the modal claimed.
    expect(getByTestId('outside').props.children).toBe('56');
  });

  it('does not let the page’s bottom occupancy pad content inside the surface', () => {
    // The bottom edge is the tab bar and the FAB, and a sheet is drawn OVER
    // both: a form inside it that cleared the tab bar would end in a band of
    // empty space.
    const { getByTestId } = render(
      <BottomEdgeProvider>
        <ClaimBottom height={64} />
        <BottomReader testID="page" />
        <ScreenScope>
          <BottomReader testID="sheet" />
        </ScreenScope>
      </BottomEdgeProvider>,
    );
    expect(getByTestId('page').props.children).toBe('64');
    expect(getByTestId('sheet').props.children).toBe('0');
  });

  it('reports NO scroll owner inside, whatever the page published', () => {
    const scrollY = { value: 0 } as never;
    const { getByTestId } = render(
      <ScrollOffsetProvider value={scrollY}>
        <OffsetReader testID="page" />
        <ScreenScope>
          <OffsetReader testID="sheet" />
        </ScreenScope>
      </ScrollOffsetProvider>,
    );
    expect(getByTestId('page').props.children).toBe('published');
    expect(getByTestId('sheet').props.children).toBe('none');
  });

  it('lets a scroll owner INSIDE the surface publish in the ordinary way', () => {
    const outer = { value: 0 } as never;
    const inner = { value: 0 } as never;
    const { getByTestId } = render(
      <ScrollOffsetProvider value={outer}>
        <ScreenScope>
          <ScrollOffsetProvider value={inner}>
            <OffsetReader testID="sheet" />
          </ScrollOffsetProvider>
        </ScreenScope>
      </ScrollOffsetProvider>,
    );
    expect(getByTestId('sheet').props.children).toBe('published');
  });
});

describe('the surfaces that mount it', () => {
  it("a dialog's body is a screen of its own", () => {
    // Mounted on `DialogBody` rather than on each of the three placements, so
    // the centred panel, the side sheets and the bottom sheet all get it.
    const { getByTestId } = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <TopEdgeProvider>
          <TopReader testID="page" />
          <DialogBody titleId="t" descriptionId="d" title="Rename">
            <ClaimTop height={88} />
            <TopReader testID="modal" />
          </DialogBody>
        </TopEdgeProvider>
      </BloomThemeProvider>,
    );
    expect(getByTestId('modal').props.children).toBe('88');
    expect(getByTestId('page').props.children).toBe('0');
  });
});
