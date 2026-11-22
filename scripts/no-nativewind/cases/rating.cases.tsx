import { Rating, RatingBar, RatingInput, RatingSummary } from '@bloom/rating';
import type { Cases } from '../support/cases';

const label = { fontSize: 10, lineHeight: 13, fontWeight: '600' } as const;

export const CASES: Cases = {
  'Rating plain': () => <Rating value={4.5} testID="rating" />,
  'Rating stars': () => (
    <Rating value={4.5} count={128} variant="stars" size="sm" starSize={20} testID="rating" />
  ),
  'RatingBar plain': () => <RatingBar label="Cleanliness" value={4.2} display="4.2" testID="row" />,
  'RatingBar fixed label': () => (
    <RatingBar label="5" value={0.75} max={1} labelWidth={16} display="75%" testID="row" />
  ),
  'RatingBar styled': () => (
    <RatingBar
      label="5"
      value={0.75}
      max={1}
      labelWidth={16}
      display="75%"
      style={{ gap: 8 }}
      labelStyle={label}
      displayStyle={label}
      trackStyle={{ height: 8, borderRadius: 9999, backgroundColor: '#eef0f1' }}
      testID="row"
    />
  ),
  'RatingInput plain': () => (
    <RatingInput value={3} onChange={() => {}} accessibilityLabel="Score" testID="input" />
  ),
  'RatingInput disabled': () => (
    <RatingInput
      value={null}
      onChange={() => {}}
      size="sm"
      max={10}
      disabled
      accessibilityLabel="Score"
      testID="input"
    />
  ),
  RatingSummary: () => (
    <RatingSummary
      average={4.6}
      count={1284}
      distribution={{ 5: 921, 4: 240, 3: 70, 2: 21, 1: 32 }}
      testID="summary"
    />
  ),
  'RatingSummary empty': () => <RatingSummary average={null} count={0} distribution={{}} />,
};
