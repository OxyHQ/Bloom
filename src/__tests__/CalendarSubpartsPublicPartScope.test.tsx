import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import {
  CalendarViewEventDetails,
  CalendarViewInboxMenu,
  CalendarViewMonthGrid,
  CalendarViewMonthSwitcher,
} from '../calendar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const month = new Date(2026, 7, 1);
const event = {
  id: 'birthday',
  date: new Date(2026, 7, 11),
  title: 'Birthday',
  time: '20:30',
  endTime: '23:30',
  meeting: { label: 'Meet', code: 'abc-def' },
};
const accounts = [
  { email: 'person@example.com', feeds: [{ id: 'work', label: 'Work', color: 'blue' as const }] },
];
const sizes = [undefined, 'xs', 'sm', 'md', 'lg'] as const;

function tree(size: (typeof sizes)[number], ui: React.ReactNode) {
  return render(
    <BloomThemeProvider fonts={false} colorPreset="blue">
      {size ? <BloomScope size={size}>{ui}</BloomScope> : ui}
    </BloomThemeProvider>,
  );
}

it.each(sizes)(
  'CalendarViewEventDetails keeps its panel and explicit action sizes under %s scope',
  (size) => {
    const result = tree(size, <CalendarViewEventDetails testID="details" event={event} />);
    expect(resolvedStyle(result.getByTestId('details').props.style)).toMatchObject({
      width: 302,
      borderRadius: 20,
    });
  },
);

it.each(sizes)(
  'CalendarViewInboxMenu keeps its trigger md and footer sm under %s scope',
  (size) => {
    const result = tree(size, <CalendarViewInboxMenu testID="inbox" accounts={accounts} />);
    expect(resolvedStyle(result.getByTestId('inbox').props.style).height).toBe(36);
  },
);

it.each(sizes)(
  'CalendarViewMonthGrid keeps its explicit compact geometry under %s scope',
  (size) => {
    const result = tree(
      size,
      <CalendarViewMonthGrid
        testID="grid"
        month={month}
        events={[{ ...event, color: 'blue', date: new Date(2026, 7, 20) }]}
        compact
      />,
    );
    const card = result.getByTestId('grid-day-2026-7-20').children[0] as {
      props: { style: unknown };
    };
    expect(resolvedStyle(card.props.style)).toMatchObject({ minHeight: 76 });
  },
);

it.each(sizes)('CalendarViewMonthSwitcher keeps its 36px footprint under %s scope', (size) => {
  const result = tree(
    size,
    <CalendarViewMonthSwitcher
      month={month}
      onPreviousMonth={() => {}}
      onNextMonth={() => {}}
      onSelectDate={() => {}}
      testID="switcher"
    />,
  );
  expect(resolvedStyle(result.getByTestId('switcher').props.style).height).toBe(36);
});
