import { Badge } from '@oxy.so/bloom/badge';
import { RiLinksLine, RiMailLine } from '@oxy.so/bloom/icons';
import { NoteCard, NoteCardSkeleton } from '@oxy.so/bloom/note-card';
import { RouteStops } from '@oxy.so/bloom/route-stops';
import { ShareSheet } from '@oxy.so/bloom/share-sheet';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const pick = (_id: string) => {};

const STOPS = [
  { id: 'a', title: 'Home', subtitle: 'Carrer de l’Om 14', state: 'reached' as const },
  { id: 'b', title: 'Office', subtitle: 'Gran Via 2', state: 'current' as const, meta: '12 min' },
  { id: 'c', title: 'Gym', meta: '1.2 km', badge: <Badge content="New" /> },
];
const TWO = STOPS.slice(0, 2);

const routes: ParityCase[] = [
  ...(['default', 'compact'] as const).map((density) => ({
    name: `RouteStops ${density}`,
    language: () =>
      toElement(
        L.RouteStops(STOPS, {
          onPressStop: pick,
          onAddStop: press,
          onRemoveStop: pick,
          canAddStop: false,
        })
          .density(density)
          .label('Trip'),
      ),
    bloom: () => (
      <RouteStops
        stops={STOPS}
        onPressStop={pick}
        onAddStop={press}
        onRemoveStop={pick}
        canAddStop={false}
        density={density === 'compact' ? 'compact' : 'comfortable'}
        accessibilityLabel="Trip"
      />
    ),
  })),
  {
    name: 'RouteStops two stops, a swap',
    language: () => toElement(L.RouteStops(TWO, { onSwap: press })),
    bloom: () => <RouteStops stops={TWO} onSwap={press} />,
  },
];

const CHECKLIST = [
  { id: '1', label: 'Buy rope', done: true },
  { id: '2', label: 'Check the tide' },
];
const META = { edited: '2 min ago', notebook: 'Field notes', attachments: 2 };

const notes: ParityCase[] = [
  ...ENUMS.noteCardLayout.map((layout) => ({
    name: `NoteCard ${layout}`,
    language: () =>
      toElement(
        L.NoteCard('Harbour notes', {
          excerpt: 'The boats come in at dawn and leave before noon.',
          tags: ['sea', 'walks', 'ideas', 'later'],
          meta: META,
          pinned: true,
        })
          .style(layout)
          .onPress(press)
          .onLongPress(press),
      ),
    bloom: () => (
      <NoteCard
        title="Harbour notes"
        excerpt="The boats come in at dawn and leave before noon."
        tags={['sea', 'walks', 'ideas', 'later']}
        meta={META}
        pinned
        density={layout}
        onPress={press}
        onLongPress={press}
      />
    ),
  })),
  ...ENUMS.accentTone.map((tone) => ({
    name: `NoteCard ${tone}, a checklist`,
    language: () =>
      toElement(
        L.NoteCard('Packing', { checklist: CHECKLIST, checklistTotal: 5 })
          .tint(tone)
          .onPress(press),
      ),
    bloom: () => (
      <NoteCard
        title="Packing"
        checklist={CHECKLIST}
        checklistTotal={5}
        tone={tone}
        onPress={press}
      />
    ),
  })),
  {
    name: 'NoteCard selectable, selected',
    language: () =>
      toElement(
        L.NoteCard('Harbour notes', {
          excerpt: 'Dawn',
          selectable: true,
          selected: true,
          onSelectedChange: press,
        }).label('Harbour'),
      ),
    bloom: () => (
      <NoteCard
        title="Harbour notes"
        excerpt="Dawn"
        selectable
        selected
        onSelectedChange={press}
        accessibilityLabel="Harbour"
      />
    ),
  },
  {
    name: 'NoteCard loading',
    language: () => toElement(L.NoteCard('Harbour notes').style('row').loading()),
    bloom: () => <NoteCard title="Harbour notes" density="row" loading />,
  },
  ...ENUMS.noteCardLayout.map((layout) => ({
    name: `NoteCardSkeleton ${layout}`,
    language: () => toElement(L.NoteCardSkeleton().style(layout).lines(2)),
    bloom: () => <NoteCardSkeleton density={layout} lines={2} />,
  })),
];

const PEOPLE = [
  { id: '1', name: 'Ana García', subtitle: '@ana' },
  { id: '2', name: 'Bruno', subtitle: '@bruno' },
];
const TARGETS = [
  { key: 'copy', label: 'Copy link', icon: RiLinksLine, onPress: press },
  { key: 'email', label: 'Email', icon: RiMailLine, onPress: press },
];
const SEARCH = { value: 'an', onValueChange: pick, placeholder: 'Search' };

const shares: ParityCase[] = [
  ...ENUMS.shareSheetSize.map((size) => ({
    name: `ShareSheet ${size}`,
    language: () =>
      toElement(
        L.ShareSheet({
          title: 'Send to',
          search: SEARCH,
          people: PEOPLE,
          onPersonPress: pick,
          targets: TARGETS,
        }).size(size),
      ),
    bloom: () => (
      <ShareSheet
        title="Send to"
        search={SEARCH}
        people={PEOPLE}
        onPersonPress={pick}
        targets={TARGETS}
        size={size}
      />
    ),
  })),
  {
    name: 'ShareSheet no people',
    language: () =>
      toElement(L.ShareSheet({ title: null, people: [], peopleEmpty: L.Text('Nobody yet') })),
    bloom: () => <ShareSheet title={null} people={[]} peopleEmpty={<Text>Nobody yet</Text>} />,
  },
  {
    name: 'ShareSheet people loading',
    language: () => toElement(L.ShareSheet({ peopleLoading: true, targets: TARGETS })),
    bloom: () => <ShareSheet peopleLoading targets={TARGETS} />,
  },
];

export const ROUTE_NOTE_SHARE_CASES: ParityCase[] = [...routes, ...notes, ...shares];
