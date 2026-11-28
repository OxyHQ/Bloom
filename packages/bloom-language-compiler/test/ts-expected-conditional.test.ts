/**
 * A conditional whose branches differ in type where a TS type is expected (`minHeight: web ?
 * "var(…)" : 384`, RN's `DimensionValue` through `StyleSheet.create`'s constraint): each branch is
 * TS's to check, never joined to the other's type, and the value is the branch taken.
 */
import { Platform } from 'react-native';

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./bloom/ts-expected-conditional.bloom') as { videoMinHeight: () => string };

it('takes the branch for the platform', () => {
  expect(m.videoMinHeight()).toBe(
    Platform.OS === 'web' ? 'var(--bloom-screen-viewport-height)' : '384',
  );
});
