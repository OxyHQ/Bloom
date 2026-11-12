/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import { CalendarView, CalendarViewHeader } from '../calendar';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const month = new Date(2026, 7, 1);
const sizes = [
  [undefined, '36px'],
  ['xs', '24px'],
  ['sm', '32px'],
  ['md', '36px'],
  ['lg', '44px'],
] as const;

function Action() {
  return (
    <Button testID="calendar-action">
      <Text>Action</Text>
    </Button>
  );
}

function Subject({ view }: { view: 'header' | 'calendar' }) {
  return view === 'header' ? (
    <CalendarViewHeader
      month={month}
      locale="en-US"
      onPreviousMonth={() => {}}
      onNextMonth={() => {}}
      onSelectDate={() => {}}
      actions={<Action />}
    />
  ) : (
    <CalendarView defaultMonth={month} events={[]} locale="en-US" actions={<Action />} />
  );
}

function renderCase(view: 'header' | 'calendar', size: string | undefined, nested = false) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        {nested ? (
          <BloomScope size="xs">
            <BloomScope size="lg">
              <Subject view={view} />
            </BloomScope>
          </BloomScope>
        ) : size ? (
          <BloomScope size={size as 'xs' | 'sm' | 'md' | 'lg'}>
            <Subject view={view} />
          </BloomScope>
        ) : (
          <Subject view={view} />
        )}
      </BloomThemeProvider>,
    ),
  );
  return { host, root };
}

it.each(sizes)(
  'CalendarViewHeader preserves caller action size under %s scope on web',
  (size, height) => {
    const { host, root } = renderCase('header', size);
    try {
      const button = host.querySelector('[data-testid="calendar-action"]');
      if (!button) throw new Error('Missing calendar header action');
      expect(getComputedStyle(button).height).toBe(height);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);

it.each(sizes)(
  'CalendarView preserves caller action size under %s scope on web',
  (size, height) => {
    const { host, root } = renderCase('calendar', size);
    try {
      const button = host.querySelector('[data-testid="calendar-action"]');
      if (!button) throw new Error('Missing calendar action');
      expect(getComputedStyle(button).height).toBe(height);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);

it('CalendarView and its header preserve the nearest nested action scope on web', () => {
  const { host, root } = renderCase('calendar', undefined, true);
  try {
    const button = host.querySelector('[data-testid="calendar-action"]');
    if (!button) throw new Error('Missing calendar action');
    expect(getComputedStyle(button).height).toBe('44px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
