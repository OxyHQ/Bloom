import { PriceEstimate, PricePerAreaComparison } from '@oxy.so/bloom/property-insights';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const euro = (value: number) => `€${Math.round(value / 1000)}k`;
const ROWS = [
  { label: 'This home', value: 4200, display: '€4,200/m²', highlight: true },
  { label: 'Old Halden', value: 3900, display: '€3,900/m²' },
  { label: 'Halden', value: 3400, display: '€3,400/m²' },
];

export const PROPERTY_INSIGHT_CASES: ParityCase[] = [
  ...(['low', 'medium', 'high'] as const).map((confidence) => ({
    name: `PriceEstimate ${confidence} confidence`,
    language: () => toElement(L.PriceEstimate(380000, 440000, confidence, { format: euro })),
    bloom: () => <PriceEstimate low={380000} high={440000} confidence={confidence} format={euro} />,
  })),
  ...([395000, 470000] as const).map((asking) => ({
    name: `PriceEstimate asking ${asking}, reasons open`,
    language: () =>
      toElement(
        L.PriceEstimate(380000, 440000, 'high', {
          estimate: 410000,
          asking,
          format: euro,
          reasons: ['Two recent sales on the street', 'A renovated kitchen'],
          expanded: true,
          onExpandedChange: set,
          comparables: 12,
          updated: 'Nov 2026',
        }),
      ),
    bloom: () => (
      <PriceEstimate
        low={380000}
        high={440000}
        confidence="high"
        estimate={410000}
        asking={asking}
        format={euro}
        reasons={['Two recent sales on the street', 'A renovated kitchen']}
        expanded
        onExpandedChange={set}
        comparables={12}
        updated="Nov 2026"
      />
    ),
  })),
  {
    name: 'PricePerAreaComparison',
    language: () => toElement(L.PricePerAreaComparison(ROWS)),
    bloom: () => <PricePerAreaComparison rows={ROWS} />,
  },
  {
    name: 'PricePerAreaComparison named',
    language: () => toElement(L.PricePerAreaComparison(ROWS).label('Price per m², by area')),
    bloom: () => <PricePerAreaComparison rows={ROWS} accessibilityLabel="Price per m², by area" />,
  },
];
