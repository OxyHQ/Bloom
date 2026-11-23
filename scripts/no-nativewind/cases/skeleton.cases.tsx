import * as Skeleton from '@bloom/skeleton';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Skeleton.Region plain': () => (
    <Skeleton.Region>
      <Skeleton.Text />
    </Skeleton.Region>
  ),
  'Skeleton.Region styled, labelled': () => (
    <Skeleton.Region label="Loading posts" style={{ gap: 8, padding: 12 }} testID="region">
      <Skeleton.Text style={{ width: 120 }} />
    </Skeleton.Region>
  ),
};
