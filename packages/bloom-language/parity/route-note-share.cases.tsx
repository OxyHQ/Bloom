import { Badge } from '@oxy.so/bloom/badge';
import { RouteStops } from '@oxy.so/bloom/route-stops';

import { NODE_DENSITIES } from '../src/generated/spec.generated';
import * as L from '../src/__tests__/support/language.generated';
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
  ...NODE_DENSITIES.routeStops.map((density) => ({
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
        density={density}
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

export const ROUTE_NOTE_SHARE_CASES: ParityCase[] = routes;
