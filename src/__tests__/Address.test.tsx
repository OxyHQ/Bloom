/**
 * @jest-environment jsdom
 *
 * `AddressRow` and `AddressList` through the REAL react-native-web.
 *
 * Two of the family's claims are invisible to a prop-level test and are what
 * most of this file measures:
 *
 *  - `leading` is read for PRESENCE. `leading={null}` must draw NO media, and a
 *    `??` would answer it with the tile instead — a difference of one node that
 *    nothing else in the package would notice, and the one `RouteStops` depends
 *    on for its gutter.
 *  - the list VARIANT is the announced tree, not a style. A picker is a
 *    `radiogroup` of `radio`s carrying `aria-checked`; a list is `list`s of
 *    `listitem`s. Passing the prop is not evidence either arrived.
 */
import React, { useState } from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { AddressList, AddressRow, ADDRESS_KIND_ICON } from '../address';
import { resolveAddressPaint } from '../address/shared';
import { AA_TEXT, resolveSurfaceLevel } from '../styles/surface-levels';
import { contrastRatio } from '../styles/color-contrast';
import { buildTheme } from '../theme/build-theme';
import type { AddressListSection } from '../address';
import {
  allByRole,
  byLabel,
  byTestId,
  click,
  css,
  mount,
  queryTestId,
  root$,
  setupHarness,
  theme,
} from './support/commerce-harness';

setupHarness();

const SECTIONS: AddressListSection[] = [
  {
    id: 'saved',
    title: 'Saved',
    entries: [
      { id: 'home', kind: 'saved', title: 'Home', subtitle: 'Carrer de l’Om 14' },
      { id: 'studio', kind: 'saved', title: 'Studio', subtitle: 'Passatge del Vidre 8' },
    ],
  },
  {
    id: 'recent',
    title: 'Recent',
    entries: [{ id: 'r1', kind: 'recent', title: 'Plaça de les Bruixes 2', meta: '1.2 km' }],
  },
];

describe('AddressRow', () => {
  it('names itself from its own text, in reading order, as one utterance', () => {
    mount(<AddressRow title="Home" subtitle="Carrer de l’Om 14" meta="1.2 km" onPress={() => undefined} testID="row" />);
    expect(byLabel('Home, Carrer de l’Om 14, 1.2 km')).not.toBeNull();
  });

  it('lets a caller replace that name', () => {
    mount(<AddressRow title="HQ" subtitle="Bldg 4" accessibilityLabel="Head office, building four" onPress={() => undefined} />);
    expect(byLabel('Head office, building four')).not.toBeNull();
    expect(document.querySelector('[aria-label="HQ, Bldg 4"]')).toBeNull();
  });

  it('draws the tile when leading is OMITTED and nothing when it is null', () => {
    mount(<AddressRow title="Home" testID="row" />);
    expect(queryTestId('row-tile')).not.toBeNull();
    mount(<AddressRow title="Home" leading={null} testID="row" />);
    expect(queryTestId('row-tile')).toBeNull();
    // …and a node wins over both.
    mount(<AddressRow title="Home" leading={<span data-testid="own">M</span>} testID="row" />);
    expect(queryTestId('row-tile')).toBeNull();
    expect(queryTestId('own')).not.toBeNull();
  });

  it('sizes the tile per density and steps it off the surface behind the row', () => {
    mount(<AddressRow title="Home" testID="row" />);
    const paint = resolveAddressPaint(theme(), resolveSurfaceLevel(theme(), 0).background);
    const comfortable = getComputedStyle(byTestId('row-tile'));
    expect(comfortable.width).toBe('40px');
    expect(comfortable.backgroundColor).toBe(css(paint.tile));
    mount(<AddressRow title="Home" density="compact" testID="row" />);
    expect(getComputedStyle(byTestId('row-tile')).width).toBe('32px');
  });

  it('is pressable only when it is given a handler', () => {
    const presses: string[] = [];
    mount(<AddressRow title="Home" onPress={() => presses.push('x')} testID="row" />);
    click(byLabel('Home'));
    expect(presses).toEqual(['x']);
    mount(<AddressRow title="Home" disabled onPress={() => presses.push('y')} testID="row" />);
    click(byLabel('Home'));
    expect(presses).toEqual(['x']);
  });

  it('announces selection with the state the ROLE defines', () => {
    mount(<AddressRow title="Home" role="radio" selected onPress={() => undefined} />);
    expect(byLabel('Home').getAttribute('aria-checked')).toBe('true');
    mount(<AddressRow title="Home" role="option" selected onPress={() => undefined} />);
    expect(byLabel('Home').getAttribute('aria-selected')).toBe('true');
    expect(byLabel('Home').getAttribute('aria-checked')).toBeNull();
  });

  it('draws the badge beside the title and the meta before the action', () => {
    mount(
      <AddressRow
        title="Home"
        meta="1.2 km"
        badge={<span data-testid="badge">Default</span>}
        action={<span data-testid="action">…</span>}
        testID="row"
      />,
    );
    expect(byTestId('row-title').textContent).toBe('Home');
    expect(byTestId('badge')).not.toBeNull();
    expect(byTestId('row-meta').textContent).toBe('1.2 km');
    // Reading order inside the trailing slot: the meta, then the action.
    const trailing = byTestId('row-meta').parentElement as HTMLElement;
    expect(trailing.contains(byTestId('action'))).toBe(true);
    expect(
      byTestId('row-meta').compareDocumentPosition(byTestId('action')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('never nests a control inside the pressable row', () => {
    // react-native-web's `Pressable` is a real `<button>`, so an action inside
    // a pressable row is a button inside a button: invalid HTML, and on web —
    // unlike native, which does not bubble a press — a click on the action ALSO
    // fires the row. The row and the action therefore sit side by side.
    const events: string[] = [];
    mount(
      <AddressRow
        title="Home"
        meta="1.2 km"
        onPress={() => events.push('row')}
        action={
          <button type="button" aria-label="More for Home" onClick={() => events.push('action')}>
            …
          </button>
        }
        testID="row"
      />,
    );
    expect(document.querySelector('button button')).toBeNull();
    const rowButton = byLabel('Home, 1.2 km');
    expect(rowButton.contains(byLabel('More for Home'))).toBe(false);
    click(byLabel('More for Home'));
    expect(events).toEqual(['action']);
    click(rowButton);
    expect(events).toEqual(['action', 'row']);
  });

  it('keeps the action in the trailing slot when the row is NOT a control', () => {
    mount(
      <AddressRow
        title="Home"
        action={<span data-testid="action">x</span>}
        testID="row"
      />,
    );
    // Nothing to nest inside, so nothing is split out.
    const row = byTestId('row');
    expect(row.contains(byTestId('action'))).toBe(true);
  });

  it('gives each flavour its own glyph, and lets `icon` win', () => {
    // The map is the DATA the flavour amounts to — four entries, four glyphs,
    // no fourth component.
    expect(new Set(Object.values(ADDRESS_KIND_ICON)).size).toBe(4);
    const Custom = ADDRESS_KIND_ICON.recent;
    mount(<AddressRow title="Home" kind="saved" icon={Custom} testID="row" />);
    expect(byTestId('row-tile').querySelector('svg')).not.toBeNull();
  });
});

describe('AddressList — the variant is the announced tree', () => {
  function Picker() {
    const [selected, setSelected] = useState('home');
    return (
      <AddressList
        sections={SECTIONS}
        variant="picker"
        selectedId={selected}
        onSelect={setSelected}
        accessibilityLabel="Delivery address"
        testID="p"
      />
    );
  }

  it('renders a picker as a named radiogroup of radios', () => {
    mount(<Picker />);
    const group = byTestId('p');
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-label')).toBe('Delivery address');
    const radios = allByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios.map((el) => el.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
    // Each section is a labelled group INSIDE the radiogroup.
    expect(byTestId('p-section-0').getAttribute('role')).toBe('group');
    expect(byTestId('p-section-0').getAttribute('aria-label')).toBe('Saved');
    expect(allByRole('listitem')).toHaveLength(0);
  });

  it('moves the checked state when a row is chosen', () => {
    mount(<Picker />);
    click(allByRole('radio')[1] as HTMLElement);
    expect(allByRole('radio').map((el) => el.getAttribute('aria-checked'))).toEqual([
      'false',
      'true',
      'false',
    ]);
  });

  it('renders a plain list as lists of listitems, one per section', () => {
    mount(<AddressList sections={SECTIONS} onSelect={() => undefined} accessibilityLabel="Places" testID="l" />);
    expect(byTestId('l').getAttribute('role')).toBeNull();
    expect(byTestId('l-section-0').getAttribute('role')).toBe('list');
    expect(byTestId('l-section-0').getAttribute('aria-label')).toBe('Saved');
    expect(allByRole('listitem')).toHaveLength(3);
    expect(allByRole('radio')).toHaveLength(0);
    // A pressable row inside a listitem is a button, which is the correct nesting.
    expect(allByRole('listitem')[0]?.querySelector('[role="button"]')).not.toBeNull();
  });

  it('draws a header only where a section has a title', () => {
    mount(<AddressList sections={[{ entries: SECTIONS[0]!.entries }]} testID="l" />);
    expect(queryTestId('l-section-0-title')).toBeNull();
    expect(root$().textContent).not.toContain('Saved');
  });
});

describe('AddressList — loading and empty', () => {
  it('marks the placeholder block busy and draws the asked-for number of rows', () => {
    mount(<AddressList sections={[]} loading loadingRows={4} accessibilityLabel="Results" testID="l" />);
    expect(byTestId('l').getAttribute('aria-busy')).toBe('true');
    expect(byTestId('l').getAttribute('aria-label')).toBe('Results');
    expect(queryTestId('l-placeholder-3')).not.toBeNull();
    expect(queryTestId('l-placeholder-4')).toBeNull();
    expect(queryTestId('l-empty')).toBeNull();
  });

  it('is empty when the SECTIONS exist but hold nothing', () => {
    mount(
      <AddressList
        sections={[{ title: 'Recent', entries: [] }, { title: 'Saved', entries: [] }]}
        emptyTitle="Nothing here"
        emptyDescription="Places you use show up here."
        testID="l"
      />,
    );
    expect(byTestId('l-empty')).not.toBeNull();
    expect(root$().textContent).toContain('Nothing here');
    expect(root$().textContent).toContain('Places you use show up here.');
    // The stale headers are not drawn over nothing.
    expect(root$().textContent).not.toContain('Recent');
  });

  it('lets a caller replace the whole empty block', () => {
    mount(<AddressList sections={[]} empty={<span data-testid="own-empty">Add one</span>} testID="l" />);
    expect(queryTestId('own-empty')).not.toBeNull();
    expect(queryTestId('l-empty')).toBeNull();
  });
});

describe('the paint is read off the surface, over every preset and mode', () => {
  const PRESETS = ['blue', 'teal', 'mono', 'yellow', 'purple'] as const;

  it('keeps the tile a step off its parent and the subtitle legible on it', () => {
    const failures: string[] = [];
    for (const preset of PRESETS) {
      for (const mode of ['light', 'dark'] as const) {
        const t = buildTheme(preset, mode);
        for (const level of [0, 1, 2, 3] as const) {
          const surface = resolveSurfaceLevel(t, level).background;
          const paint = resolveAddressPaint(t, surface);
          const where = `${preset}/${mode}/L${level}`;
          if (paint.tile === surface) failures.push(`${where}: the tile is the surface`);
          if (contrastRatio(paint.textSecondary, surface) < AA_TEXT) {
            failures.push(`${where}: subtitle ${contrastRatio(paint.textSecondary, surface).toFixed(2)}`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
