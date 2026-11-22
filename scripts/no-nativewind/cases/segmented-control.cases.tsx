import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@bloom/segmented-control';
import type { Cases } from '../support/cases';

const items = (['day', 'week', 'month'] as const).map((value) => (
  <SegmentedControlItem key={value} value={value}>
    <SegmentedControlItemText>{value}</SegmentedControlItemText>
  </SegmentedControlItem>
));

export const CASES: Cases = {
  'SegmentedControl plain': () => (
    <SegmentedControl label="Range" type="radio" value="week">
      {items}
    </SegmentedControl>
  ),
  'SegmentedControl tabs, plain variant, small, disabled': () => (
    <SegmentedControl label="Range" type="tabs" variant="plain" size="sm" disabled value="day">
      {items}
    </SegmentedControl>
  ),
  'SegmentedControl styled items': () => (
    <SegmentedControl label="Speed" type="radio" value="1" style={{ width: '100%' }}>
      {['1', '2'].map((v) => (
        <SegmentedControlItem
          key={v}
          value={v}
          style={{ flex: 1, minWidth: 0, paddingHorizontal: 4 }}
        >
          <SegmentedControlItemText>{v}</SegmentedControlItemText>
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  ),
};
