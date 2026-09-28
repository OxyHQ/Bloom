/**
 * The core group on message catalogs: each family below speaks the
 * `LocaleProvider` locale, plural forms follow the language, and a caller's
 * own `labels` / `*Label` prop still wins. The web-only strings are in
 * `core-locale.web.test.tsx`.
 */
import React, { useState } from 'react';
import * as ReactNative from 'react-native';
import { Pressable, Text, Text as RNText } from 'react-native';
import { act, fireEvent, render, within } from '@testing-library/react-native';

import { AlertDialog } from '../alert-dialog';
import { AppShellHeader, NotificationBell, ProOfferCard } from '../app-shell';
import { AuthCard } from '../auth-card';
import { AUTH_CARD_MESSAGES } from '../auth-card/messages';
import { AvatarGroup } from '../avatar-group';
import { AVATAR_GROUP_MESSAGES } from '../avatar-group/messages';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { type CalendarViewEvent, CalendarViewEventDetails, CalendarViewHeader, CalendarViewMonthGrid, CalendarViewMonthSwitcher } from '../calendar';
import { Carousel, CarouselItem } from '../carousel';
import { CodeBlock } from '../code';
import { Command } from '../command';
import { ConnectionDots } from '../connection-dots';
import { ContactProfileCard } from '../contact-card';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../context-menu';
import { DataTable, type DataTableColumn } from '../data-table';
import { Dialog, useDialogControl } from '../dialog';
import { ErrorBoundary } from '../error-boundary';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../hover-card';
import { RiHomeLine, RiSettings6Line } from '../icons/remix';
import { InputOtp } from '../input-otp';
import { Label } from '../label';
import { LocaleProvider } from '../locale';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '../menubar';
import { Notification } from '../notification';
import { NotificationCenter, type NotificationCenterItem } from '../notification-center';
import { OutlineNav } from '../outline-nav';
import { Pagination } from '../pagination';
import { PAGINATION_MESSAGES } from '../pagination/messages';
import { PhoneInput } from '../phone-input';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { PortalOutlet, PortalProvider } from '../portal';
import { Rating, RatingInput } from '../rating';
import { RATING_MESSAGES } from '../rating/messages';
import { Search } from '../search';
import { SelectScrollDownButton, SelectScrollProvider, SelectScrollUpButton } from '../select';
import { SettingsDateField, SettingsModal, SettingsPlanCard, SettingsServerList, SettingsStoragePage, SettingsToolsPage } from '../settings-modal';
import { SETTINGS_MODAL_MESSAGES } from '../settings-modal/messages';
import { Sidebar, type SidebarAccount } from '../sidebar';
import { RangeSlider } from '../slider';
import { SocialButton, socialButtonLabel } from '../social-button';
import { Stepper } from '../stepper';
import { alert, confirm, prompt, SurfaceHost } from '../surfaces';
import { __resetSurfacesForTests } from '../surfaces/surface-store';
import { TagField } from '../tag-field';
import { TextFieldLabel } from '../text-field';
import { ThemeToggle } from '../theme-toggle';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

// The web portal is a react-dom portal (no DOM here); render in place.
jest.mock('../settings-modal/modal-portal', () => ({
  ModalPortal: ({ children }: { children: React.ReactNode }) => children,
}));

describe('settings-modal, error-boundary, theme-toggle', () => {
  function renderIn(locale: string, ui: React.ReactElement) {
    return render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <LocaleProvider locale={locale}>{ui}</LocaleProvider>
      </BloomThemeProvider>,
    );
  }

  const FILES = [
    { id: 'a', name: 'Factura', kind: 'document', uploadedOn: '1 ene 2026', uploadedAt: 1, size: 1024 },
  ];

  describe('settings-modal in Spanish', () => {
    beforeEach(() => {
      jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width: 1280, height: 800, scale: 1, fontScale: 1 });
    });
    afterEach(() => jest.restoreAllMocks());

    function Modal({ labels }: { labels?: { close?: string } }) {
      const [open] = useState(true);
      return (
        <SettingsModal
          open={open}
          onClose={() => {}}
          groups={[{ label: 'Ajustes', items: [{ key: 'general', label: 'General', icon: RiSettings6Line, page: 'general' }] }]}
          pages={{ general: { title: 'General', content: <RNText>cuerpo</RNText> } }}
          labels={labels}
          testID="settings"
        />
      );
    }

    it('names the dialog and its close button from the catalog', () => {
      const { getByTestId } = renderIn('es', <Modal />);
      expect(getByTestId('settings').props['aria-label']).toBe('Ajustes');
      expect(getByTestId('settings-close').props.accessibilityLabel).toBe('Cerrar ajustes');
    });

    it('lets a labels prop win over the catalog', () => {
      const { getByTestId } = renderIn('es', <Modal labels={{ close: 'Salir' }} />);
      expect(getByTestId('settings-close').props.accessibilityLabel).toBe('Salir');
    });

    it('translates the storage table, with a plural file count', () => {
      const { getByText, getByLabelText } = renderIn('es', <SettingsStoragePage files={FILES} upload={false} />);
      expect(getByText('Almacenado en')).toBeTruthy();
      expect(getByText('1 archivo')).toBeTruthy();
      expect(getByLabelText('Eliminar Factura')).toBeTruthy();
      expect(getByLabelText('Ordenar por nombre del archivo')).toBeTruthy();
    });

    it('pluralises the file count per language', () => {
      const ru = SETTINGS_MODAL_MESSAGES.ru.storage.fileCount;
      expect([1, 3, 5, 21].map((n) => ru(n, String(n)))).toEqual(['1 файл', '3 файла', '5 файлов', '21 файл']);
      expect(SETTINGS_MODAL_MESSAGES.en.storage.fileCount(2, '2')).toBe('2 files');
      expect(SETTINGS_MODAL_MESSAGES.ar.storage.fileCount(2, '2')).toBe('ملفان');
    });

    it('translates the tools page and the server list', () => {
      const { getByText, getByLabelText } = renderIn(
        'es',
        <SettingsToolsPage
          scopes={[{ id: 'p', label: 'Oxy', servers: [{ id: 'f', name: 'Figma', status: 'error' }] }]}
          waitForAuthentication={false}
          onWaitForAuthenticationChange={() => {}}
        />,
      );
      expect(getByText('Autenticación')).toBeTruthy();
      expect(getByText('Servidores MCP de Oxy')).toBeTruthy();
      expect(getByText('No hay servidores MCP del equipo')).toBeTruthy();
      expect(getByLabelText('Mostrar salida de Figma')).toBeTruthy();
      expect(getByLabelText('Acciones de Figma')).toBeTruthy();
    });

    it('keeps the add-server props winning', () => {
      const { getByText } = renderIn(
        'es',
        <SettingsServerList servers={[]} onAddServer={() => {}} addServerLabel="Conectar" />,
      );
      expect(getByText('Conectar')).toBeTruthy();
      expect(getByText('Añadir un servidor MCP personalizado')).toBeTruthy();
    });

    it('translates the plan chip unless badge is given', () => {
      expect(renderIn('es', <SettingsPlanCard title="Pro" />).getByText('Plan actual')).toBeTruthy();
      expect(renderIn('es', <SettingsPlanCard title="Pro" badge="Tu plan" />).getByText('Tu plan')).toBeTruthy();
    });

    it('formats the birth date in the locale, not in English month names', () => {
      const { getByText } = renderIn(
        'es',
        <SettingsDateField label="Nacimiento" value={new Date(1997, 6, 28)} onChange={() => {}} />,
      );
      expect(getByText('28 de julio de 1997')).toBeTruthy();
    });
  });

  describe('error-boundary in Spanish', () => {
    let errorSpy: jest.SpyInstance;
    beforeEach(() => {
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => errorSpy.mockRestore());

    function Boom(): React.ReactElement {
      throw new Error('boom');
    }

    it('speaks the default fallback in the provider locale', () => {
      const { getByText, getByLabelText } = renderIn('es', <ErrorBoundary><Boom /></ErrorBoundary>);
      expect(getByText('Algo salió mal')).toBeTruthy();
      expect(getByLabelText('Volver a intentarlo')).toBeTruthy();
    });

    it('lets title and retryLabel win', () => {
      const { getByText } = renderIn('es', <ErrorBoundary title="Vaya" retryLabel="Otra vez"><Boom /></ErrorBoundary>);
      expect(getByText('Vaya')).toBeTruthy();
      expect(getByText('Otra vez')).toBeTruthy();
      expect(getByText('Se ha producido un error inesperado')).toBeTruthy();
    });
  });

  describe('theme-toggle in Spanish', () => {
    it('names the sidebar row and the segments', () => {
      const row = renderIn('es', <ThemeToggle testID="row" />);
      expect(row.getByTestId('row').props.accessibilityLabel).toBe('Modo oscuro');
      expect(row.getByText('Modo oscuro')).toBeTruthy();
      const seg = renderIn('es', <ThemeToggle variant="segmented" testID="seg" />);
      expect(seg.getByTestId('seg').props.accessibilityLabel).toBe('Tema');
      expect(seg.getByTestId('theme-toggle-dark').props.accessibilityLabel).toBe('Usar modo oscuro');
    });
  });
});

describe('auth-card and the form fields', () => {
  function renderIn(locale: string, ui: React.ReactElement) {
    return render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <LocaleProvider locale={locale}>{ui}</LocaleProvider>
      </BloomThemeProvider>,
    );
  }

  describe('auth-card in Spanish', () => {
    it('speaks the mode, the fields and the links in the locale', () => {
      const { getByText, getAllByText } = renderIn('es', <AuthCard />);
      expect(getByText('Hola de nuevo')).toBeTruthy();
      expect(getAllByText('Iniciar sesión').length).toBeGreaterThan(0);
      expect(getByText('Recordarme')).toBeTruthy();
      expect(getByText('¿Has olvidado tu contraseña?')).toBeTruthy();
      expect(getByText('o continúa con')).toBeTruthy();
    });

    it('puts the address inside the translated sentence, not between English words', () => {
      const { getByText } = renderIn('es', <AuthCard mode="verify" email="ana@example.com" />);
      expect(getByText('ana@example.com')).toBeTruthy();
      expect(getByText('Introduce el código que enviamos a ana@example.com para terminar de iniciar sesión.')).toBeTruthy();
      expect(getByText('Código de verificación')).toBeTruthy();
    });

    it('places the address where the language puts it (Japanese leads with it)', () => {
      expect(AUTH_CARD_MESSAGES.ja.codeSentTo('a@b.jp').startsWith('a@b.jp')).toBe(true);
    });

    it('lets the title prop win over the catalog', () => {
      const { getByText, queryByText } = renderIn('es', <AuthCard title="Entra en Oxy" />);
      expect(getByText('Entra en Oxy')).toBeTruthy();
      expect(queryByText('Hola de nuevo')).toBeNull();
    });
  });

  describe('phone-input in Spanish', () => {
    it('names the number field and the country select', () => {
      const { getByLabelText } = renderIn('es', <PhoneInput />);
      expect(getByLabelText('Número de teléfono')).toBeTruthy();
      expect(getByLabelText('Código de país')).toBeTruthy();
    });

    it('countrySelectLabel still wins', () => {
      const { getByLabelText } = renderIn('es', <PhoneInput countrySelectLabel="Prefijo" />);
      expect(getByLabelText('Prefijo')).toBeTruthy();
    });
  });

  describe('input-otp in Spanish', () => {
    it('names the group and each box', () => {
      const { getByLabelText } = renderIn('es', <InputOtp length={4} />);
      expect(getByLabelText('Código de un solo uso')).toBeTruthy();
      expect(getByLabelText('Dígito 2 de 4')).toBeTruthy();
    });
  });

  describe('tag-field in Spanish', () => {
    it('names each chip’s remove button in the locale, and a labels entry wins', () => {
      const { getByLabelText } = renderIn('es', <TagField value={['diseño']} onChange={() => {}} label="Etiquetas" />);
      expect(getByLabelText('Quitar diseño')).toBeTruthy();
      const custom = renderIn(
        'es',
        <TagField value={['diseño']} onChange={() => {}} label="Etiquetas" labels={{ remove: (t) => `Borrar ${t}` }} />,
      );
      expect(custom.getByLabelText('Borrar diseño')).toBeTruthy();
    });
  });

  describe('label and text-field in Spanish', () => {
    it('announces the asterisk as required in the locale', () => {
      expect(renderIn('es', <Label required>Nombre</Label>).getByLabelText('obligatorio')).toBeTruthy();
      expect(renderIn('es', <TextFieldLabel required>Nombre</TextFieldLabel>).getByLabelText('obligatorio')).toBeTruthy();
    });
  });

  describe('select in Spanish', () => {
    it('names the scroll chevrons in the locale', () => {
      const { getByLabelText } = renderIn(
        'es',
        <SelectScrollProvider value={{ canScrollUp: true, canScrollDown: true, scrollBy: () => {} }}>
          <SelectScrollUpButton />
          <SelectScrollDownButton />
        </SelectScrollProvider>,
      );
      expect(getByLabelText('Desplazar hacia arriba')).toBeTruthy();
      expect(getByLabelText('Desplazar hacia abajo')).toBeTruthy();
    });
  });

  describe('search in Spanish', () => {
    it('takes the common "Search" as its name, and the clear button speaks the locale', () => {
      const { getByLabelText } = renderIn('es', <Search value="gatos" onClearText={() => {}} />);
      expect(getByLabelText('Buscar')).toBeTruthy();
      expect(getByLabelText('Borrar la búsqueda')).toBeTruthy();
    });
  });

  describe('slider in Spanish', () => {
    it('names the range thumbs, and thumbLabels still wins', () => {
      const { getByLabelText } = renderIn('es', <RangeSlider value={[10, 90]} onValueChange={() => {}} accessibilityLabel="Precio" />);
      expect(getByLabelText('Mínimo')).toBeTruthy();
      expect(getByLabelText('Máximo')).toBeTruthy();
      const custom = renderIn(
        'es',
        <RangeSlider value={[10, 90]} onValueChange={() => {}} accessibilityLabel="Precio" thumbLabels={['Desde', 'Hasta']} />,
      );
      expect(custom.getByLabelText('Desde')).toBeTruthy();
    });
  });

  describe('stepper in Spanish', () => {
    it('names its buttons, and decrementLabel still wins', () => {
      const { getByLabelText } = renderIn('es', <Stepper value={2} onValueChange={() => {}} accessibilityLabel="Huéspedes" />);
      expect(getByLabelText('Disminuir')).toBeTruthy();
      expect(getByLabelText('Aumentar')).toBeTruthy();
      const custom = renderIn(
        'es',
        <Stepper value={2} onValueChange={() => {}} accessibilityLabel="Huéspedes" decrementLabel="Menos" />,
      );
      expect(custom.getByLabelText('Menos')).toBeTruthy();
    });
  });

  describe('rating in Spanish', () => {
    it('pluralises the reviews and translates the accessible name', () => {
      const one = renderIn('es', <Rating value={4.5} count={1} countStyle="reviews" testID="r" />);
      expect(one.getByText('· 1 reseña')).toBeTruthy();
      expect(one.getByLabelText('Valoración: 4.5 de 5, 1 reseña')).toBeTruthy();
      const many = renderIn('es', <Rating value={4.5} count={128} countStyle="reviews" />);
      expect(many.getByText('· 128 reseñas')).toBeTruthy();
    });

    it('draws "Nuevo" with no rating, and newLabel still wins', () => {
      expect(renderIn('es', <Rating value={null} />).getByText('Nuevo')).toBeTruthy();
      expect(renderIn('es', <Rating value={null} newLabel="Recién llegado" />).getByText('Recién llegado')).toBeTruthy();
    });

    it('keeps a preformatted count exactly as given', () => {
      expect(RATING_MESSAGES.es.reviews('1,2 mil')).toBe('1,2 mil reseñas');
    });

    it('pluralises the star names per language', () => {
      const { getByLabelText } = renderIn('ru', <RatingInput value={null} onChange={() => {}} accessibilityLabel="Оценка" />);
      expect(getByLabelText('1 звезда')).toBeTruthy();
      expect(getByLabelText('2 звезды')).toBeTruthy();
      expect(getByLabelText('5 звёзд')).toBeTruthy();
      expect(RATING_MESSAGES.ar.reviews(2)).toBe('مراجعتان');
    });
  });
});

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

describe('sidebar, surfaces and the overlays', () => {
  /**
   * Part of the core group's move onto message catalogs: each family below
   * speaks the provider's locale, and a caller's own label still wins.
   */
  function inLocale(ui: React.ReactElement, locale = 'es') {
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

  let dialogControl: ReturnType<typeof useDialogControl> | undefined;

  function Harness({ children }: { children: (control: ReturnType<typeof useDialogControl>) => React.ReactNode }) {
    const control = useDialogControl();
    dialogControl = control;
    return <>{children(control)}</>;
  }

  /** Renders a dialog harness, then opens it the way `Dialog.test.tsx` does. */
  function openDialog(ui: React.ReactElement, locale?: string) {
    const screen = inLocale(ui, locale);
    act(() => {
      dialogControl?.open();
    });
    return screen;
  }

  describe('sidebar', () => {
    const ITEMS = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/home' }];

    it('names its landmark and controls in the provider locale', () => {
      const screen = inLocale(<Sidebar items={ITEMS} />);
      expect(screen.getByLabelText('Barra lateral')).toBeTruthy();
      expect(screen.getByLabelText('Contraer barra lateral')).toBeTruthy();
      expect(screen.getByLabelText('Búsqueda rápida')).toBeTruthy();
    });

    it('lets a *Label prop win over the catalog', () => {
      const screen = inLocale(<Sidebar items={ITEMS} accessibilityLabel="Navegación principal" collapseLabel="Plegar" />);
      expect(screen.getByLabelText('Navegación principal')).toBeTruthy();
      expect(screen.getByLabelText('Plegar')).toBeTruthy();
      expect(screen.queryByLabelText('Barra lateral')).toBeNull();
    });

    it('says the account menu in the provider locale', () => {
      const account: SidebarAccount = {
        name: 'Ana',
        users: [{ id: 'a', name: 'Ana' }],
        onAddUser: () => {},
        onManage: () => {},
      };
      const screen = inLocale(<Sidebar items={ITEMS} account={account} />, 'de');
      fireEvent.press(screen.getAllByLabelText('Ana')[0]!);
      expect(screen.getByText('Nutzer mit Zugriff')).toBeTruthy();
      expect(screen.getByText('Nutzer hinzufügen')).toBeTruthy();
      expect(screen.getByText('Verwalten')).toBeTruthy();
    });
  });

  describe('surfaces', () => {
    afterEach(() => __resetSurfacesForTests());

    it('confirm() defaults its buttons to the provider locale, resolved where it renders', () => {
      const screen = inLocale(<SurfaceHost />);
      act(() => {
        void confirm({ title: '¿Salir?' });
      });
      expect(screen.getByText('Confirmar')).toBeTruthy();
      expect(screen.getByText('Cancelar')).toBeTruthy();
    });

    it('alert() with no buttons says OK in the provider locale', () => {
      const screen = inLocale(<SurfaceHost />, 'tr');
      act(() => {
        alert('Merhaba');
      });
      expect(screen.getByText('Tamam')).toBeTruthy();
    });

    it('prompt() localises its defaults, and a caller label still wins', () => {
      const screen = inLocale(<SurfaceHost />);
      act(() => {
        void prompt({ title: 'Nombre', confirmLabel: 'Guardar nombre' });
      });
      expect(screen.getByText('Guardar nombre')).toBeTruthy();
      expect(screen.queryByText('Aceptar')).toBeNull();
      expect(screen.getByText('Cancelar')).toBeTruthy();
    });
  });

  describe('command', () => {
    it('speaks its placeholder, empty state and name in the provider locale', () => {
      const screen = inLocale(<Command visible onClose={() => {}} items={[]} />);
      expect(screen.getByPlaceholderText('Escribe un comando o busca…')).toBeTruthy();
      expect(screen.getByText('No se encontraron resultados.')).toBeTruthy();
      expect(screen.getByLabelText('Paleta de comandos')).toBeTruthy();
    });

    it('lets placeholder and emptyText win', () => {
      const screen = inLocale(<Command visible onClose={() => {}} items={[]} placeholder="Busca algo" emptyText="Nada" />);
      expect(screen.getByPlaceholderText('Busca algo')).toBeTruthy();
      expect(screen.getByText('Nada')).toBeTruthy();
    });
  });

  describe('alert-dialog', () => {
    it('defaults its confirm and cancel words to the provider locale', () => {
      const screen = inLocale(<AlertDialog visible onClose={() => {}} title="¿Borrar?" />);
      expect(screen.getByText('Confirmar')).toBeTruthy();
      expect(screen.getByText('Cancelar')).toBeTruthy();
    });

    it('lets confirmLabel win', () => {
      const screen = inLocale(<AlertDialog visible onClose={() => {}} title="¿Borrar?" confirmLabel="Borrar" />);
      expect(screen.getByText('Borrar')).toBeTruthy();
      expect(screen.queryByText('Confirmar')).toBeNull();
    });
  });

  describe('dialog', () => {
    it('names an untitled header tab group in the provider locale', () => {
      const screen = openDialog(
        <Harness>
          {(control) => (
            <Dialog
              control={control}
              header={{ segments: { items: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }], value: 'a', onChange: () => {} } }}
            >
              <Text>Cuerpo</Text>
            </Dialog>
          )}
        </Harness>,
      );
      expect(screen.getByLabelText('Vista')).toBeTruthy();
    });

    it('names a side sheet backdrop in the provider locale, the dialog inside the language’s own phrase', () => {
      const unnamed = openDialog(
        <Harness>
          {(control) => (
            <Dialog control={control} placement="right" testID="d">
              <Text>Cuerpo</Text>
            </Dialog>
          )}
        </Harness>,
      );
      // The backdrop is not in the tree RNTL queries by default; its name is what is asserted.
      expect(unnamed.getAllByLabelText('Cerrar diálogo', { includeHiddenElements: true }).length).toBeGreaterThan(0);
      unnamed.unmount();
      const named = openDialog(
        <Harness>
          {(control) => (
            <Dialog control={control} placement="right" label="Filtros" testID="d">
              <Text>Cuerpo</Text>
            </Dialog>
          )}
        </Harness>,
        'de',
      );
      expect(named.getAllByLabelText('Filtros schließen', { includeHiddenElements: true }).length).toBeGreaterThan(0);
    });
  });

  describe('popover, hover-card, context-menu, menubar', () => {
    it('Popover names its panel in the provider locale', () => {
      const screen = inLocale(
        <Popover defaultOpen>
          <PopoverTrigger label="Abrir">Abrir</PopoverTrigger>
          <PopoverContent>
            <Text>Contenido</Text>
          </PopoverContent>
        </Popover>,
      );
      expect(screen.getByText('Contenido')).toBeTruthy();
      expect(screen.getAllByLabelText('Ventana emergente').length).toBeGreaterThan(0);
    });

    it('HoverCard names its card in the provider locale', () => {
      const screen = inLocale(
        <HoverCard>
          <HoverCardTrigger asChild>
            <Pressable>
              <Text>@nate</Text>
            </Pressable>
          </HoverCardTrigger>
          <HoverCardContent>
            <Text>Perfil</Text>
          </HoverCardContent>
        </HoverCard>,
      );
      fireEvent(screen.getByText('@nate'), 'longPress');
      expect(screen.getAllByLabelText('Tarjeta de vista previa').length).toBeGreaterThan(0);
    });

    it('ContextMenu names its menu in the provider locale', () => {
      jest.useFakeTimers();
      try {
        const screen = inLocale(
          <ContextMenu>
            <ContextMenuTrigger label="Mensaje">
              <Text>Hola</Text>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem>Copiar</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>,
        );
        fireEvent(screen.getByLabelText('Mensaje'), 'longPress');
        act(() => {
          jest.runOnlyPendingTimers();
        });
        expect(screen.getAllByLabelText('Menú contextual').length).toBeGreaterThan(0);
      } finally {
        jest.useRealTimers();
      }
    });

    it('Menubar names the bar and a menu in the provider locale', () => {
      const screen = inLocale(
        <Menubar defaultValue="file" testID="bar">
          <MenubarMenu value="file">
            <MenubarTrigger label="Archivo">Archivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Nuevo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );
      expect(screen.getByLabelText('Barra de menús')).toBeTruthy();
      expect(screen.getAllByLabelText('Menú').length).toBeGreaterThan(0);
    });
  });

  describe('connection-dots, breadcrumb, pagination', () => {
    it('ConnectionDots is named in the provider locale, and its prop still wins', () => {
      const screen = inLocale(<ConnectionDots left={<Text>A</Text>} right={<Text>B</Text>} />, 'fr');
      expect(screen.getByLabelText('Connexion en cours')).toBeTruthy();
      const own = inLocale(<ConnectionDots left={<Text>A</Text>} right={<Text>B</Text>} accessibilityLabel="Liaison" />, 'fr');
      expect(own.getByLabelText('Liaison')).toBeTruthy();
    });

    it('Breadcrumb names its landmark in the provider locale', () => {
      const screen = inLocale(
        <Breadcrumb>
          <BreadcrumbItem onPress={() => {}}>Inicio</BreadcrumbItem>
          <BreadcrumbItem>Ajustes</BreadcrumbItem>
        </Breadcrumb>,
      );
      expect(screen.getByLabelText('Ruta de navegación')).toBeTruthy();
    });

    it('Pagination names its landmark and page buttons in the provider locale', () => {
      const screen = inLocale(<Pagination page={2} totalPages={5} onChange={() => {}} />, 'ru');
      expect(screen.getByLabelText('Нумерация страниц')).toBeTruthy();
      expect(screen.getByLabelText('Перейти на страницу 3')).toBeTruthy();
      const own = inLocale(<Pagination page={2} totalPages={5} onChange={() => {}} getPageLabel={(n) => `Стр. ${n}`} />, 'ru');
      expect(own.getByLabelText('Стр. 3')).toBeTruthy();
    });

    it('keeps the page number in the language’s own order', () => {
      expect(PAGINATION_MESSAGES.tr.goToPage(4)).toBe('4. sayfaya git');
      expect(PAGINATION_MESSAGES.ja.goToPage(4)).toBe('4ページへ移動');
    });
  });
});

describe('carousel, code, outline-nav, contact-card, avatar-group, social-button', () => {
  function renderIn(locale: string, ui: React.ReactElement) {
    return render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <LocaleProvider locale={locale}>{ui}</LocaleProvider>
      </BloomThemeProvider>,
    );
  }

  const slides = (count: number) =>
    Array.from({ length: count }, (_, i) => (
      <CarouselItem key={i} testID={`slide-${i}`}>
        <></>
      </CarouselItem>
    ));

  describe('carousel', () => {
    it('names its arrows, dots and slides in the provider locale', () => {
      const { getByLabelText, getByTestId } = renderIn('es', <Carousel accessibilityLabel="Galería">{slides(3)}</Carousel>);
      expect(getByLabelText('Diapositiva anterior')).toBeTruthy();
      expect(getByLabelText('Diapositiva siguiente')).toBeTruthy();
      expect(getByLabelText('Ir a la diapositiva 2')).toBeTruthy();
      expect(getByTestId('slide-1').props.accessibilityLabel).toBe('2 de 3');
    });

    it('lets previousLabel / dotLabel win over the catalog', () => {
      const { getByLabelText } = renderIn(
        'es',
        <Carousel accessibilityLabel="G" previousLabel="Atrás del todo" dotLabel={(n) => `Foto ${n}`}>
          {slides(2)}
        </Carousel>,
      );
      expect(getByLabelText('Atrás del todo')).toBeTruthy();
      expect(getByLabelText('Foto 2')).toBeTruthy();
    });
  });

  describe('code', () => {
    it('names the copy button in the provider locale, and labels still win', () => {
      const { getByLabelText, rerender } = renderIn('es', <CodeBlock code="x" filename="a.ts" onCopy={() => {}} />);
      expect(getByLabelText('Copiar código')).toBeTruthy();
      rerender(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <LocaleProvider locale="es">
            <CodeBlock code="x" filename="a.ts" onCopy={() => {}} labels={{ copy: 'Copiar' }} />
          </LocaleProvider>
        </BloomThemeProvider>,
      );
      expect(getByLabelText('Copiar')).toBeTruthy();
    });
  });

  describe('outline-nav', () => {
    const headings = [
      { id: 'a', label: 'Uno', level: 2 },
      { id: 'b', label: 'Dos', level: 2 },
    ];

    it('titles the list and reads its progress in the provider locale', () => {
      const { getByText, toJSON } = renderIn('es', <OutlineNav headings={headings} activeId="a" />);
      expect(getByText('En esta página')).toBeTruthy();
      expect(JSON.stringify(toJSON())).toContain('Encabezado 1 de 2');
    });

    it('lets labels win', () => {
      const { getByText } = renderIn('es', <OutlineNav headings={headings} activeId="a" labels={{ outline: 'Índice' }} />);
      expect(getByText('Índice')).toBeTruthy();
    });
  });

  describe('contact-card', () => {
    it('names channels, chips and the owner in the provider locale', () => {
      const { getByLabelText, getByText } = renderIn(
        'es',
        <ContactProfileCard
          name="Nora Vance"
          channels={[{ kind: 'phone', onPress: () => {} }, { kind: 'website', onPress: () => {} }]}
          tags={['VIP']}
          owner={{ name: 'Marta' }}
        />,
      );
      expect(getByLabelText('Llamar a Nora Vance')).toBeTruthy();
      expect(getByLabelText('Abrir el sitio web de Nora Vance')).toBeTruthy();
      expect(getByLabelText('Etiquetas de Nora Vance')).toBeTruthy();
      expect(getByText('Responsable · Marta')).toBeTruthy();
    });

    it("lets the owner's own label win", () => {
      const { getByText } = renderIn('es', <ContactProfileCard name="Nora" owner={{ name: 'Marta', label: 'Gestora' }} />);
      expect(getByText('Gestora · Marta')).toBeTruthy();
    });
  });

  describe('avatar-group', () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ id: String(i), name: `P${i}` }));

    it('names the overflow chip with a plural in the provider locale', () => {
      const { getByLabelText } = renderIn('es', <AvatarGroup items={items} max={3} onPressItem={() => {}} />);
      expect(getByLabelText('2 personas más')).toBeTruthy();
    });

    it('pluralises per language (ru, ar, fr)', () => {
      expect(AVATAR_GROUP_MESSAGES.ru.more(1)).toBe('ещё 1 человек');
      expect(AVATAR_GROUP_MESSAGES.ru.more(3)).toBe('ещё 3 человека');
      expect(AVATAR_GROUP_MESSAGES.ru.more(5)).toBe('ещё 5 человек');
      expect(AVATAR_GROUP_MESSAGES.ar.more(2)).toBe('شخصان آخران');
      expect(AVATAR_GROUP_MESSAGES.fr.more(1)).toBe('1 autre personne');
      expect(AVATAR_GROUP_MESSAGES.es.more(1)).toBe('1 persona más');
    });
  });

  describe('social-button', () => {
    it('speaks the action phrase in the provider locale, with the brand where the language puts it', () => {
      const { getByText, getByLabelText } = renderIn(
        'es',
        <>
          <SocialButton brand="google" action="signIn" onPress={() => {}} />
          <SocialButton brand="github" iconOnly onPress={() => {}} />
        </>,
      );
      expect(getByText('Iniciar sesión con Google')).toBeTruthy();
      expect(getByLabelText('Continuar con GitHub')).toBeTruthy();
      expect(socialButtonLabel('Google', 'signIn', 'tr')).toBe('Google ile giriş yap');
    });

    it('lets children win', () => {
      const { getByText } = renderIn('es', <SocialButton brand="google" onPress={() => {}}>Entrar</SocialButton>);
      expect(getByText('Entrar')).toBeTruthy();
    });
  });
});
