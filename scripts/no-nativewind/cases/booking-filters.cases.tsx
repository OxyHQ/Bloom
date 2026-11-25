import { BudgetPicker, MoveInPicker } from '@bloom/home-search';
import {
  AvailabilityFilter,
  CountFilter,
  FilterFooter,
  FilterSection,
  SwitchFilterRow,
} from '@bloom/stay-filters';
import { GuestPicker } from '@bloom/stay-search';
import { Text } from '@bloom/typography';
import type { Cases } from '../support/cases';

const set = () => {};
const DAY = new Date(2026, 4, 12);

export const CASES: Cases = {
  'FilterSection with description': () => (
    <FilterSection title="Rooms" description="Bedrooms and beds" divider={false}>
      <Text>Any</Text>
    </FilterSection>
  ),
  FilterFooter: () => <FilterFooter resultsLabel="Show 12 places" onApply={set} onClear={set} />,
  CountFilter: () => <CountFilter title="Bedrooms" value={2} onValueChange={set} />,
  'SwitchFilterRow with description': () => (
    <SwitchFilterRow title="Instant book" description="Book at once" value onValueChange={set} />
  ),
  'AvailabilityFilter now': () => (
    <AvailabilityFilter availableNow onAvailableNowChange={set} date={null} onDateChange={set} />
  ),
  'AvailabilityFilter from a day': () => (
    <AvailabilityFilter
      availableNow={false}
      onAvailableNowChange={set}
      date={DAY}
      onDateChange={set}
      locale="en-GB"
    />
  ),
  GuestPicker: () => (
    <GuestPicker value={{ adults: 2, children: 1, infants: 0, pets: 1 }} onChange={set} />
  ),
  BudgetPicker: () => <BudgetPicker value={[500, 1500]} onValueChange={set} />,
  MoveInPicker: () => (
    <MoveInPicker
      value={{ timing: 'date', date: DAY, contractLength: 'any' }}
      onValueChange={set}
      defaultMonth={DAY}
    />
  ),
};
