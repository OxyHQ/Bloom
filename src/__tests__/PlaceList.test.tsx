/**
 * @jest-environment jsdom
 *
 * `PlaceListCard` and `PlaceList` through the REAL react-native-web.
 *
 * What this file is FOR. A saved list is two things a prop-level test cannot
 * see: a CARD that is one press target carrying four facts, and a LIST whose
 * only interesting operation — reordering — changes nothing on screen except
 * the order of two rows. So the card's composed name is measured as one
 * string, and every move is measured through what `onReorder` was handed AND
 * through what the live region says, because a reader who cannot see the swap
 * has nothing else.
 */
import React, { useState } from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { RiFlagLine } from '../icons/remix/RiFlagLine';
import { PlaceList } from '../place-list/PlaceList';
import { PlaceListCard } from '../place-list/PlaceListCard';
import { composePlaceListName, placeListCountLabel } from '../place-list/shared';
import type { PlaceListPlace } from '../place-list';
import {
  byTestId,
  click,
  mount,
  queryTestId,
  root$,
  setupHarness,
} from './support/commerce-harness';

setupHarness();

const noop = () => undefined;
const PHOTO = 'https://example.invalid/a.jpg';

const PEOPLE = [
  { id: '1', displayName: 'Ana Ferrer' },
  { id: '2', displayName: 'Marc Oliu' },
];

const SAVED: PlaceListPlace[] = [
  { id: 'a', note: 'Sourdough before ten.', place: { name: 'Forner de la Plaça', category: 'Bakery' } },
  { id: 'b', place: { name: 'Cafè del Roure', category: 'Coffee shop' } },
  { id: 'c', place: { name: 'Parc del Bosc Vell', category: 'Park' } },
];

// ---------------------------------------------------------------------------
//  PlaceListCard
// ---------------------------------------------------------------------------

describe('PlaceListCard: one press target, one sentence', () => {
  it('announces the name, the count, the sharing and the visibility, in that order', () => {
    mount(
      <PlaceListCard
        name="Want to go"
        count={12}
        photos={[PHOTO]}
        visibility="shared"
        collaborators={PEOPLE}
        onPress={noop}
        testID="l"
      />,
    );
    expect(byTestId('l').getAttribute('aria-label')).toBe(
      'Want to go, 12 places, Shared with 2, Shared',
    );
  });

  it('counts one place as one place', () => {
    expect(placeListCountLabel(1)).toBe('1 place');
    expect(placeListCountLabel(0)).toBe('0 places');
  });

  it('takes an explicit name over the composed one', () => {
    mount(<PlaceListCard name="Vull anar-hi" accessibilityLabel="Una llista" onPress={noop} testID="l" />);
    expect(byTestId('l').getAttribute('aria-label')).toBe('Una llista');
  });

  it('keeps the composed name free of the parts that were not given', () => {
    expect(composePlaceListName({ name: 'Favourites' })).toBe('Favourites, Private');
  });

  it('shows at most four photos, first one wide', () => {
    mount(
      <PlaceListCard
        name="Want to go"
        photos={[PHOTO, PHOTO, PHOTO, PHOTO, PHOTO, PHOTO]}
        onPress={noop}
        testID="l"
      />,
    );
    const tiles = Array.from(byTestId('l-cover').children) as HTMLElement[];
    expect(tiles.length).toBe(4);
    expect(tiles[0]!.style.flexGrow).toBe('2');
    expect(tiles[1]!.style.flexGrow).toBe('1');
  });

  it('holds the empty node instead of a strip when there are no photos', () => {
    mount(
      <PlaceListCard
        name="Weekend"
        color="#4E7A4A"
        empty={<span data-testid="nothing">Nothing saved yet</span>}
        onPress={noop}
        testID="l"
      />,
    );
    expect(byTestId('l-cover').style.backgroundColor).toBe('rgb(78, 122, 74)');
    expect(queryTestId('nothing')).not.toBeNull();
  });

  it('hides the collaborators from the announcement, which already names them', () => {
    mount(
      <PlaceListCard name="Want to go" collaborators={PEOPLE} onPress={noop} testID="l" />,
    );
    expect(byTestId('l-people').getAttribute('aria-hidden')).toBe('true');
  });

  it("draws the glyph in the list's own colour without deriving anything from it", () => {
    mount(<PlaceListCard name="Favourites" icon={RiFlagLine} color="#C2456B" onPress={noop} testID="l" />);
    const glyph = root$().querySelector('svg path') as SVGElement;
    expect(glyph.getAttribute('fill')).toBe('#C2456B');
  });
});

// ---------------------------------------------------------------------------
//  PlaceList
// ---------------------------------------------------------------------------

function Editable({ onReorder }: { onReorder?: (next: PlaceListPlace[]) => void }) {
  const [places, setPlaces] = useState<PlaceListPlace[]>(SAVED);
  return (
    <PlaceList
      places={places}
      onReorder={(next) => {
        setPlaces(next);
        onReorder?.(next);
      }}
      onRemove={(id) => setPlaces((current) => current.filter((entry) => entry.id !== id))}
      testID="s"
    />
  );
}

describe('PlaceList: the place is a PlaceCard row and the note is its sibling', () => {
  it('names the note as a note, so it is not read as part of the place', () => {
    mount(<PlaceList places={SAVED} testID="s" />);
    const note = root$().querySelector('[aria-label="Note: Sourdough before ten."]');
    expect(note).not.toBeNull();
    // The place's own announcement is `PlaceCard`'s, and does not swallow it.
    const place = root$().querySelector('[aria-label^="Forner de la Plaça"]');
    expect(place!.getAttribute('aria-label')).not.toContain('Sourdough');
  });

  it('draws no controls at all without the callbacks that operate them', () => {
    mount(<PlaceList places={SAVED} testID="s" />);
    expect(queryTestId('s-item-0-up')).toBeNull();
    expect(queryTestId('s-item-0-remove')).toBeNull();
  });

  it('moves a place later and hands back the WHOLE list in its new order', () => {
    const seen: PlaceListPlace[][] = [];
    mount(<Editable onReorder={(next) => seen.push(next)} />);
    const lastOrder = (): string[] => (seen[seen.length - 1] ?? []).map((entry) => entry.id);
    click(byTestId('s-item-0-down'));
    expect(lastOrder()).toEqual(['b', 'a', 'c']);
    // And the rows follow, so the second press moves the same place again.
    click(byTestId('s-item-1-down'));
    expect(lastOrder()).toEqual(['b', 'c', 'a']);
  });

  it('announces the move, which is otherwise a silent swap', () => {
    mount(<Editable />);
    expect(byTestId('s-status').textContent).toBe('');
    click(byTestId('s-item-0-down'));
    expect(byTestId('s-status').textContent).toBe(
      'Forner de la Plaça moved to position 2 of 3',
    );
    expect(byTestId('s-status').getAttribute('aria-live')).toBe('polite');
  });

  it('disables the ends rather than removing the control that sits there', () => {
    mount(<Editable />);
    expect(byTestId('s-item-0-up').getAttribute('aria-disabled')).toBe('true');
    expect(byTestId('s-item-0-down').getAttribute('aria-disabled')).toBeNull();
    expect(byTestId('s-item-2-down').getAttribute('aria-disabled')).toBe('true');
    // Pressing a disabled end changes nothing.
    click(byTestId('s-item-0-up'));
    expect(byTestId('s-status').textContent).toBe('');
  });

  it('names each control by what it will do to THIS position', () => {
    mount(<Editable />);
    expect(byTestId('s-item-1-up').getAttribute('aria-label')).toBe('Move to position 1');
    expect(byTestId('s-item-1-down').getAttribute('aria-label')).toBe('Move to position 3');
    expect(byTestId('s-item-1-remove').getAttribute('aria-label')).toBe(
      'Remove Cafè del Roure from the list',
    );
  });

  it('removes the entry it was drawn for', () => {
    mount(<Editable />);
    click(byTestId('s-item-1-remove'));
    expect(root$().querySelector('[aria-label^="Cafè del Roure"]')).toBeNull();
    expect(root$().querySelector('[aria-label^="Forner de la Plaça"]')).not.toBeNull();
  });

  it('keeps the controls but stops them while disabled', () => {
    mount(
      <PlaceList places={SAVED} onReorder={noop} onRemove={noop} disabled testID="s" />,
    );
    expect(byTestId('s-item-1-down').getAttribute('aria-disabled')).toBe('true');
    expect(byTestId('s-item-1-remove').getAttribute('aria-disabled')).toBe('true');
  });

  it('draws the empty node instead of an empty list', () => {
    mount(
      <PlaceList places={[]} empty={<span data-testid="none">Nothing saved</span>} testID="s" />,
    );
    expect(queryTestId('s')).toBeNull();
    expect(queryTestId('none')).not.toBeNull();
  });
});
