import { ExpandableText } from '@oxy.so/bloom/expandable-text';

import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const set = () => {};
const REVIEW =
  'Stayed three nights in the loft. The light in the mornings is lovely, the bed is firm and the street is quiet after ten. The kitchen has everything you need for a long stay, and the host answered within minutes every time we wrote.';

export const EXPANDABLE_TEXT_CASES: readonly ParityCase[] = [
  {
    name: 'expandable text',
    language: () => toElement(L.ExpandableText(REVIEW)),
    bloom: () => <ExpandableText>{REVIEW}</ExpandableText>,
  },
  {
    name: 'expandable text, two lines, inline, worded',
    language: () =>
      toElement(
        L.ExpandableText(REVIEW)
          .lines(2)
          .style('inline')
          .labels({ more: 'Read more' })
          .testID('review'),
      ),
    bloom: () => (
      <ExpandableText numberOfLines={2} toggle="inline" moreLabel="Read more" testID="review">
        {REVIEW}
      </ExpandableText>
    ),
  },
  {
    name: 'expandable text, open, a binding',
    language: () => toElement(L.ExpandableText(REVIEW, [true, set]).labels({ less: 'Fewer' })),
    bloom: () => (
      <ExpandableText expanded onExpandedChange={set} lessLabel="Fewer">
        {REVIEW}
      </ExpandableText>
    ),
  },
  {
    name: 'expandable text in its type and colour, padded',
    language: () =>
      toElement(
        L.ExpandableText(REVIEW)
          .font('caption-1')
          .weight('medium')
          .foreground('muted')
          .padding('md'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <ExpandableText
            variant="caption-1-medium"
            color={c.textSecondary}
            style={{ paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12 }}
          >
            {REVIEW}
          </ExpandableText>
        )}
      </Themed>
    ),
  },
  {
    name: 'expandable text that never clamps',
    language: () => toElement(L.ExpandableText('Short.').lines(0)),
    bloom: () => <ExpandableText numberOfLines={0}>Short.</ExpandableText>,
  },
];
