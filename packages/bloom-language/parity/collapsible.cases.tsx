import { Collapsible } from '@oxy.so/bloom/collapsible';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const TIMED = { duration: 180, easing: [0.4, 0, 0.2, 1] } as const;

export const COLLAPSIBLE_CASES: readonly ParityCase[] = [
  ...[true, false].map((open) => ({
    name: open ? 'an open collapsible' : 'a shut collapsible',
    language: () => toElement(L.Collapsible(open, L.Text('Ships in 2 days.'))),
    bloom: () => (
      <Collapsible open={open}>
        <Text>Ships in 2 days.</Text>
      </Collapsible>
    ),
  })),
  {
    name: 'a timed reveal that opens as it appears',
    language: () =>
      toElement(
        L.Collapsible(true, L.Text('New reply'))
          .revealMotion(TIMED)
          .revealsOnAppear()
          .testID('reply'),
      ),
    bloom: () => (
      <Collapsible open transition={TIMED} appear testID="reply">
        <Text>New reply</Text>
      </Collapsible>
    ),
  },
  {
    name: 'a shut collapsible that unmounts its content',
    language: () => toElement(L.Collapsible(false, L.Text('Tree')).keepsMounted(false)),
    bloom: () => (
      <Collapsible open={false} keepMounted={false}>
        <Text>Tree</Text>
      </Collapsible>
    ),
  },
  {
    name: 'a collapsible with a box',
    language: () => toElement(L.Collapsible(true, L.Text('Details'), L.Text('More')).padding('md')),
    bloom: () => (
      <Collapsible
        open
        style={{ paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12 }}
      >
        <Text>Details</Text>
        <Text>More</Text>
      </Collapsible>
    ),
  },
];
