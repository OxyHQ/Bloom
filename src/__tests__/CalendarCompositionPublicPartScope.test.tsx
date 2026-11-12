import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import { CalendarView, CalendarViewHeader } from '../calendar';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const month = new Date(2026, 7, 1);
const sizes = [
  [undefined, 36],
  ['xs', 24],
  ['sm', 32],
  ['md', 36],
  ['lg', 44],
] as const;

function Action() {
  return (
    <Button testID="calendar-action">
      <Text>Action</Text>
    </Button>
  );
}

function CalendarHeader() {
  return (
    <CalendarViewHeader
      month={month}
      locale="en-US"
      onPreviousMonth={() => {}}
      onNextMonth={() => {}}
      onSelectDate={() => {}}
      actions={<Action />}
    />
  );
}

function Calendar() {
  return <CalendarView defaultMonth={month} events={[]} locale="en-US" actions={<Action />} />;
}

it.each(sizes)('CalendarViewHeader preserves caller action size under %s scope', (size, height) => {
  const header = <CalendarHeader />;
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{header}</BloomScope> : header}
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('calendar-action').props.style).height).toBe(height);
});

it.each(sizes)('CalendarView preserves caller action size under %s scope', (size, height) => {
  const calendar = <Calendar />;
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{calendar}</BloomScope> : calendar}
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('calendar-action').props.style).height).toBe(height);
});

it('CalendarView and its header preserve the nearest nested action scope', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <BloomScope size="lg">
          <Calendar />
        </BloomScope>
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('calendar-action').props.style).height).toBe(44);
});
