import { Rating, RatingBar, RatingInput, RatingSummary } from '@oxy.so/bloom/rating';
import { withAlpha } from '@oxy.so/bloom/theme';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const set = () => {};
const DISTRIBUTION = { 5: 80, 4: 30, 3: 10, 1: 8 };

const ratings: ParityCase[] = [
  {
    name: 'Rating',
    language: () => toElement(L.Rating(4.92)),
    bloom: () => <Rating value={4.92} />,
  },
  {
    name: 'Rating, no rating yet',
    language: () => toElement(L.Rating(null)),
    bloom: () => <Rating value={null} />,
  },
  {
    name: 'Rating with a count',
    language: () => toElement(L.Rating(4.5).count(128)),
    bloom: () => <Rating value={4.5} count={128} />,
  },
  ...ENUMS.ratingCountStyle.map((style) => ({
    name: `Rating count ${style}`,
    language: () => toElement(L.Rating('4.8').count('1.2k').countStyle(style)),
    bloom: () => <Rating value="4.8" count="1.2k" countStyle={style} />,
  })),
  ...ENUMS.ratingSize.map((size) => ({
    name: `Rating ${size}`,
    language: () => toElement(L.Rating(3.7).count(9).size(size)),
    bloom: () => <Rating value={3.7} count={9} size={size} />,
  })),
  ...ENUMS.ratingStyle.map((style) => ({
    name: `Rating ${style}`,
    language: () => toElement(L.Rating(4.3).style(style)),
    bloom: () => <Rating value={4.3} variant={style} />,
  })),
  {
    name: 'Rating stars, a fill of its own, a star size, the value hidden',
    language: () =>
      toElement(L.Rating('4,5').style('stars').fillValue(4.5).starSize('xl').showsValue(false)),
    bloom: () => (
      <Rating value="4,5" variant="stars" fillValue={4.5} starSize={20} showValue={false} />
    ),
  },
  {
    name: 'Rating tinted',
    language: () => toElement(L.Rating(4.9).count(31).tint('white')),
    bloom: () => <Themed>{(c) => <Rating value={4.9} count={31} color={c.white} />}</Themed>,
  },
  {
    name: 'Rating with its star, count and empty star tinted',
    language: () =>
      toElement(
        L.Rating(2.5)
          .style('stars')
          .count(4)
          .starTint('warning')
          .countTint('muted/half')
          .emptyTint('border'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <Rating
            value={2.5}
            variant="stars"
            count={4}
            starColor={c.warning}
            countColor={withAlpha(c.textSecondary, 0.5)}
            emptyStarColor={c.border}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'Rating with words of its own, named, padded',
    language: () =>
      toElement(
        L.Rating(undefined)
          .count(0)
          .countStyle('reviews')
          .labels({ reviews: 'avis', new: 'Nouveau' })
          .label('Pas encore noté')
          .testID('rating')
          .padding('sm'),
      ),
    bloom: () => (
      <Rating
        value={undefined}
        count={0}
        countStyle="reviews"
        reviewsLabel="avis"
        newLabel="Nouveau"
        accessibilityLabel="Pas encore noté"
        testID="rating"
        style={{ paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 }}
      />
    ),
  },
];

const inputs: ParityCase[] = [
  {
    name: 'RatingInput, nothing chosen',
    language: () => toElement(L.RatingInput([null, set]).label('Overall rating')),
    bloom: () => <RatingInput value={null} onChange={set} accessibilityLabel="Overall rating" />,
  },
  ...ENUMS.ratingInputSize.map((size) => ({
    name: `RatingInput ${size}`,
    language: () => toElement(L.RatingInput([3, set]).size(size).label('Cleanliness')),
    bloom: () => (
      <RatingInput value={3} onChange={set} size={size} accessibilityLabel="Cleanliness" />
    ),
  })),
  {
    name: 'RatingInput, ten stars, labels of its own, disabled',
    language: () =>
      toElement(
        L.RatingInput([7, set])
          .max(10)
          .starLabel((value, max) => `${value}/${max}`)
          .disabled()
          .label('Score')
          .testID('score'),
      ),
    bloom: () => (
      <RatingInput
        value={7}
        onChange={set}
        max={10}
        formatStarLabel={(value, max) => `${value}/${max}`}
        disabled
        accessibilityLabel="Score"
        testID="score"
      />
    ),
  },
];

const breakdowns: ParityCase[] = [
  {
    name: 'RatingBar',
    language: () => toElement(L.RatingBar('Cleanliness', 4.9)),
    bloom: () => <RatingBar label="Cleanliness" value={4.9} />,
  },
  {
    name: 'RatingBar, a share with its reading and a label width',
    language: () =>
      toElement(L.RatingBar('5 stars', 0.72).max(1).valueLabel('72%').labelWidth('56')),
    bloom: () => <RatingBar label="5 stars" value={0.72} max={1} display="72%" labelWidth={56} />,
  },
  {
    name: 'RatingBar, revealed',
    language: () => toElement(L.RatingBar('Value', 3).reveal({ visible: false, once: true })),
    bloom: () => <RatingBar label="Value" value={3} reveal={{ visible: false, once: true }} />,
  },
  {
    name: 'RatingSummary',
    language: () => toElement(L.RatingSummary(4.4, 128, DISTRIBUTION)),
    bloom: () => <RatingSummary average={4.4} count={128} distribution={DISTRIBUTION} />,
  },
  {
    name: 'RatingSummary, nobody rated, words of its own',
    language: () =>
      toElement(
        L.RatingSummary(null, 0, {})
          .labels({ count: 'aucun avis', outOf: 'sur 5', noRatings: 'Pas de note' })
          .label('Notes'),
      ),
    bloom: () => (
      <RatingSummary
        average={null}
        count={0}
        distribution={{}}
        countLabel="aucun avis"
        outOfLabel="sur 5"
        noRatingsLabel="Pas de note"
        accessibilityLabel="Notes"
      />
    ),
  },
];

export const RATING_CASES: readonly ParityCase[] = [...ratings, ...inputs, ...breakdowns];
