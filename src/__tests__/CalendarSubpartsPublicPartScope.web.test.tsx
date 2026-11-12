/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import {
  CalendarViewEventDetails,
  CalendarViewInboxMenu,
  CalendarViewMonthGrid,
  CalendarViewMonthSwitcher,
} from '../calendar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const month = new Date(2026, 7, 1);
const event = {
  id: 'birthday',
  date: new Date(2026, 7, 11),
  title: 'Birthday',
  time: '20:30',
  endTime: '23:30',
  color: 'blue' as const,
  meeting: { label: 'Meet', code: 'abc-def' },
};
const accounts = [
  { email: 'person@example.com', feeds: [{ id: 'work', label: 'Work', color: 'blue' as const }] },
];
const sizes = [undefined, 'xs', 'sm', 'md', 'lg'] as const;

function withScope(size: (typeof sizes)[number], children: React.ReactNode) {
  return (
    <BloomThemeProvider fonts={false} colorPreset="blue">
      {size ? <BloomScope size={size}>{children}</BloomScope> : children}
    </BloomThemeProvider>
  );
}

function requiredElement<T extends Element>(element: T | null, label: string): T {
  if (!element) throw new Error(`Missing ${label}`);
  return element;
}

it.each(sizes)('CalendarViewEventDetails keeps panel width under %s scope on web', (size) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(withScope(size, <CalendarViewEventDetails testID="details" event={event} />)),
    );
    const panel = requiredElement(host.querySelector('[data-testid="details"]'), 'details panel');
    expect(getComputedStyle(panel).width).toBe('302px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it.each(sizes)('CalendarViewInboxMenu keeps its md trigger under %s scope on web', (size) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(withScope(size, <CalendarViewInboxMenu testID="inbox" accounts={accounts} />)),
    );
    const trigger = requiredElement(host.querySelector('[data-testid="inbox"]'), 'inbox trigger');
    expect(getComputedStyle(trigger).height).toBe('36px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it.each(sizes)('CalendarViewMonthGrid keeps compact card height under %s scope on web', (size) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        withScope(
          size,
          <CalendarViewMonthGrid
            testID="grid"
            month={month}
            events={[{ ...event, date: new Date(2026, 7, 20) }]}
            compact
          />,
        ),
      ),
    );
    const cell = requiredElement(
      host.querySelector('[data-testid="grid-day-2026-7-20"]'),
      'calendar day',
    );
    const card = requiredElement(cell.firstElementChild, 'calendar day card');
    expect(getComputedStyle(card).minHeight).toBe('76px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it.each(sizes)('CalendarViewMonthSwitcher keeps its footprint under %s scope on web', (size) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        withScope(
          size,
          <CalendarViewMonthSwitcher
            testID="switcher"
            month={month}
            onPreviousMonth={() => {}}
            onNextMonth={() => {}}
            onSelectDate={() => {}}
          />,
        ),
      ),
    );
    const switcher = requiredElement(
      host.querySelector('[data-testid="switcher"]'),
      'month switcher',
    );
    expect(getComputedStyle(switcher).height).toBe('36px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
