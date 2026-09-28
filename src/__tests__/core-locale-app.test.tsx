/**
 * The core group on message catalogs: each family below speaks the
 * `LocaleProvider` locale, plural forms follow the language, and a caller's
 * own `labels` / `*Label` prop still wins. The web-only strings are in
 * `core-locale.web.test.tsx`.
 */
import React from 'react';
import * as ReactNative from 'react-native';
import { render,within } from '@testing-library/react-native';

import { AppShellHeader,NotificationBell,ProOfferCard } from '../app-shell';
import { type CalendarViewEvent,CalendarViewEventDetails,CalendarViewHeader,CalendarViewMonthGrid,CalendarViewMonthSwitcher } from '../calendar';
import { DataTable,type DataTableColumn } from '../data-table';
import { LocaleProvider } from '../locale';
import { Notification } from '../notification';
import { NotificationCenter,type NotificationCenterItem } from '../notification-center';
import { PortalOutlet,PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

// The web portal is a react-dom portal (no DOM here); render in place.
jest.mock('../settings-modal/modal-portal', () => ({
  ModalPortal: ({ children }: { children: React.ReactNode }) => children,
}));

describe('calendar, data-table, notifications, app-shell', () => {
  function renderIn(ui: React.ReactElement, locale = 'es') {
    return render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <LocaleProvider locale={locale}>
          <PortalProvider>
            {ui}
            <PortalOutlet />
          </PortalProvider>
        </LocaleProvider>
      </BloomThemeProvider>,
    );
  }

  let viewportWidth = 1300;
  beforeEach(() => {
    viewportWidth = 1300;
    jest
      .spyOn(ReactNative, 'useWindowDimensions')
      .mockImplementation(() => ({ ...ReactNative.Dimensions.get('window'), width: viewportWidth }));
  });
  afterEach(() => jest.restoreAllMocks());

  const day = (month: number, date: number) => new Date(2026, month - 1, date);
  const AUGUST = day(8, 1);
  const busyDay = (count: number): CalendarViewEvent[] =>
    Array.from({ length: count }, (_, index) => ({
      id: `e${index}`,
      date: day(8, 20),
      title: `Event ${index}`,
      time: `1${index}:00`,
      color: 'blue' as const,
    }));

  describe('calendar speaks the provider locale', () => {
    it('names the month grid and counts the overflow in Spanish', () => {
      const screen = renderIn(<CalendarViewMonthGrid testID="grid" month={AUGUST} events={busyDay(6)} />);
      expect(screen.getByLabelText('Mes')).toBeTruthy();
      expect(within(screen.getByTestId('grid-day-2026-7-20')).getByText('+2 más')).toBeTruthy();
      // Weekday headers follow the provider too, not the runtime.
      expect(screen.getByLabelText('domingo')).toBeTruthy();
    });

    it('pluralises the overflow line (French: one / other)', () => {
      const one = renderIn(<CalendarViewMonthGrid testID="grid" month={AUGUST} events={busyDay(5)} />, 'fr');
      expect(within(one.getByTestId('grid-day-2026-7-20')).getByText('+1 autre')).toBeTruthy();
      one.unmount();
      const many = renderIn(<CalendarViewMonthGrid testID="grid" month={AUGUST} events={busyDay(6)} />, 'fr');
      expect(within(many.getByTestId('grid-day-2026-7-20')).getByText('+2 autres')).toBeTruthy();
    });

    it('translates the details panel, its duration chip and its date line', () => {
      const event: CalendarViewEvent = {
        id: 'x',
        date: day(8, 11),
        title: 'Cena',
        time: '20:30',
        endTime: '21:45',
        color: 'purple',
        meeting: { label: 'Google Meet', code: 'abc' },
        timeZone: 'Madrid',
        participants: [{ email: 'a@example.com', initials: 'A' }],
        reminder: '1 h',
      };
      const screen = renderIn(<CalendarViewEventDetails event={event} gmtLabel="GMT+2" />);
      expect(screen.getByText('Unirse')).toBeTruthy();
      expect(screen.getByText('Participantes')).toBeTruthy();
      expect(screen.getByText('Recordatorios')).toBeTruthy();
      expect(screen.getByText('1 h 15 min')).toBeTruthy();
      expect(screen.getByLabelText('Editar zona horaria')).toBeTruthy();
      expect(screen.getByText('mar, 11 ago')).toBeTruthy();
    });

    it('composes the switcher title name per language', () => {
      const screen = renderIn(
        <CalendarViewMonthSwitcher testID="switcher" month={AUGUST} onPreviousMonth={() => {}} onNextMonth={() => {}} onSelectDate={() => {}} />,
      );
      expect(screen.getByLabelText('Mes anterior')).toBeTruthy();
      expect(screen.getByLabelText('Mes siguiente')).toBeTruthy();
      expect(screen.getByTestId('switcher-title').props.accessibilityLabel).toBe('agosto de 2026, elegir una fecha');
    });

    it('lets newEventLabel and the inbox labels win over the catalog', () => {
      const screen = renderIn(
        <CalendarViewHeader
          month={AUGUST}
          onPreviousMonth={() => {}}
          onNextMonth={() => {}}
          onSelectDate={() => {}}
          onNewEvent={() => {}}
          newEventLabel="Crear cita"
          inboxAccounts={[{ email: 'me@example.com', feeds: [] }]}
        />,
      );
      expect(screen.getByText('Crear cita')).toBeTruthy();
      expect(screen.queryByText('Nuevo evento')).toBeNull();
      expect(screen.getByLabelText('Bandeja de entrada')).toBeTruthy();
    });
  });

  type Row = { id: string; name: string; joined: Date };
  const ROWS: Row[] = [{ id: 'a', name: 'Ana', joined: new Date(2026, 7, 1) }];
  const COLUMNS: DataTableColumn<Row>[] = [
    { id: 'name', header: 'Nombre', accessor: (r) => r.name },
    { id: 'joined', header: 'Alta', accessor: (r) => r.joined },
  ];

  describe('data-table speaks the provider locale', () => {
    it('names the checkboxes and the density control, and formats dates in the locale', () => {
      const screen = renderIn(
        <DataTable accessibilityLabel="Personas" rows={ROWS} columns={COLUMNS} getRowId={(r) => r.id} selectable showSizeToggle />,
      );
      expect(screen.getByLabelText('Seleccionar todas las filas de esta página')).toBeTruthy();
      expect(screen.getByLabelText('Seleccionar fila a')).toBeTruthy();
      expect(screen.getByText('Compacta')).toBeTruthy();
      const expected = new Intl.DateTimeFormat('es', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(ROWS[0]!.joined);
      expect(screen.getByText(expected)).toBeTruthy();
    });

    it('lets selectAllLabel and sizeToggleLabels win', () => {
      const screen = renderIn(
        <DataTable
          accessibilityLabel="Personas"
          rows={ROWS}
          columns={COLUMNS}
          getRowId={(r) => r.id}
          selectable
          showSizeToggle
          selectAllLabel="Todas"
          sizeToggleLabels={{ md: 'Amplia', sm: 'Estrecha' }}
        />,
      );
      expect(screen.getByLabelText('Todas')).toBeTruthy();
      expect(screen.getByText('Estrecha')).toBeTruthy();
      expect(screen.queryByText('Compacta')).toBeNull();
    });
  });

  const ITEMS: NotificationCenterItem[] = [
    { id: 'a', category: 'mentions', group: 'Hoy', title: 'Ana', description: 'Hola', timestamp: '2m', unread: true },
    { id: 'b', category: 'system', group: 'Hoy', title: 'Copia', description: 'Lista', timestamp: '1h', unread: true },
  ];

  describe('notification-center speaks the provider locale', () => {
    it('translates the tabs, the count and the button', () => {
      const screen = renderIn(<NotificationCenter notifications={ITEMS} />);
      expect(screen.getByText('Notificaciones')).toBeTruthy();
      expect(screen.getByText('2 sin leer')).toBeTruthy();
      expect(screen.getByText('Marcar todo como leído')).toBeTruthy();
      expect(screen.getByText('Todas')).toBeTruthy();
      expect(screen.getByText('Menciones')).toBeTruthy();
      expect(screen.getByText('Sistema')).toBeTruthy();
    });

    it('pluralises the unread count (Russian one / few)', () => {
      const one = renderIn(<NotificationCenter notifications={ITEMS.slice(0, 1)} />, 'ru');
      expect(one.getByText('1 непрочитанное')).toBeTruthy();
      one.unmount();
      const two = renderIn(<NotificationCenter notifications={ITEMS} />, 'ru');
      expect(two.getByText('2 непрочитанных')).toBeTruthy();
    });

    it('lets title win', () => {
      const screen = renderIn(<NotificationCenter notifications={ITEMS} title="Avisos" />);
      expect(screen.getByText('Avisos')).toBeTruthy();
      expect(screen.queryByText('Notificaciones')).toBeNull();
    });
  });

  describe('notification speaks the provider locale', () => {
    it('names the close button, and closeLabel still wins', () => {
      expect(renderIn(<Notification title="Hola" />).getByLabelText('Descartar notificación')).toBeTruthy();
      expect(renderIn(<Notification title="Hola" closeLabel="Quitar aviso" />).getByLabelText('Quitar aviso')).toBeTruthy();
    });
  });

  describe('app-shell speaks the provider locale', () => {
    it('names the hamburger, the bell and the offer', () => {
      viewportWidth = 700;
      const header = renderIn(<AppShellHeader title="Inicio" onMenuPress={() => {}} />);
      expect(header.getByLabelText('Abrir navegación')).toBeTruthy();
      header.unmount();
      viewportWidth = 1440;
      expect(renderIn(<NotificationBell testID="bell" notifications={ITEMS} />).getAllByLabelText('Notificaciones').length).toBeGreaterThan(0);
      expect(
        renderIn(<ProOfferCard testID="offer" title="Pro" description="d" ctaLabel="Obtener Pro" onDismiss={() => {}} />).getByTestId('offer')
          .props.accessibilityLabel,
      ).toBe('Oferta Pro');
    });

    it('lets menuLabel win', () => {
      viewportWidth = 700;
      expect(renderIn(<AppShellHeader title="Inicio" onMenuPress={() => {}} menuLabel="Menú" />).getByLabelText('Menú')).toBeTruthy();
    });
  });
});
