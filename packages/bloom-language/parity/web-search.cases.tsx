import { RiGlobalLine, RiSearchLine } from '@oxy.so/bloom/icons';
import { WebSearch } from '@oxy.so/bloom/web-search';
import type { WebSearchStep } from '@oxy.so/bloom/web-search';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const STEPS: WebSearchStep[] = [
  { label: 'Researching budget mechanical keyboards', icon: RiSearchLine, heading: true },
  {
    label: 'Searched the web for',
    query: 'best budget mechanical keyboard',
    icon: RiGlobalLine,
    meta: '10 results',
    sources: [
      {
        title: 'The best budget mechanical keyboards in 2025',
        domain: 'www.pcgamer.com',
        href: 'https://www.pcgamer.com',
      },
      { title: "What's the best keyboard under $100?", domain: 'www.reddit.com', brand: 'reddit' },
      { title: 'Keyboard buying guide', domain: 'www.wired.com' },
    ],
  },
  { label: 'Searched X for', brand: 'x', query: 'aula f75 review', meta: '12 posts' },
];

/** The trail at rest: revealed by count, with no timer running. */
const settled = { run: false, reduce: true } as const;

export const WEB_SEARCH_CASES: ParityCase[] = [
  {
    name: 'WebSearch settled',
    language: () => toElement(L.WebSearch(STEPS, { ...settled, revealed: 99, working: false })),
    bloom: () => <WebSearch steps={STEPS} {...settled} revealed={99} working={false} />,
  },
  {
    name: 'WebSearch part revealed, its words',
    language: () =>
      toElement(
        L.WebSearch(STEPS, {
          ...settled,
          revealed: 2,
          working: false,
          labels: { sources: 'Found' },
        }),
      ),
    bloom: () => (
      <WebSearch
        steps={STEPS}
        {...settled}
        revealed={2}
        working={false}
        labels={{ sources: 'Found' }}
      />
    ),
  },
  {
    name: 'WebSearch without a heading, padded',
    language: () =>
      toElement(L.WebSearch(STEPS.slice(1), { ...settled, revealed: 99 }).padding('md')),
    bloom: () => (
      <WebSearch
        steps={STEPS.slice(1)}
        {...settled}
        revealed={99}
        style={{ paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12 }}
      />
    ),
  },
];

/** The working row trails a running search: it moves on the JS thread, so Jest compares it as it mounts. */
export const WEB_SEARCH_CASES_MOVING: ParityCase[] = [
  {
    name: 'WebSearch running, working',
    language: () =>
      toElement(L.WebSearch(STEPS, { ...settled, revealed: 2, working: 'Searching' })),
    bloom: () => <WebSearch steps={STEPS} {...settled} revealed={2} working="Searching" />,
  },
];
