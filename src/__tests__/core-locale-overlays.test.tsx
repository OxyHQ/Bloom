/**
 * The core group on message catalogs: each family below speaks the
 * `LocaleProvider` locale, plural forms follow the language, and a caller's
 * own `labels` / `*Label` prop still wins. The web-only strings are in
 * `core-locale.web.test.tsx`.
 */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { AlertDialog } from '../alert-dialog';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { Command } from '../command';
import { ConnectionDots } from '../connection-dots';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../context-menu';
import { Dialog, useDialogControl } from '../dialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../hover-card';
import { RiHomeLine } from '../icons/remix';
import { LocaleProvider } from '../locale';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '../menubar';
import { Pagination } from '../pagination';
import { PAGINATION_MESSAGES } from '../pagination/messages';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { PortalOutlet, PortalProvider } from '../portal';
import { Sidebar, type SidebarAccount } from '../sidebar';
import { alert, confirm, prompt, SurfaceHost } from '../surfaces';
import { __resetSurfacesForTests } from '../surfaces/surface-store';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { messagesIn } from './support/messages-in';

// The web portal is a react-dom portal (no DOM here); render in place.
jest.mock('../settings-modal/modal-portal', () => ({
  ModalPortal: ({ children }: { children: React.ReactNode }) => children,
}));

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
      expect(messagesIn(PAGINATION_MESSAGES, 'tr').goToPage(4)).toBe('4. sayfaya git');
      expect(messagesIn(PAGINATION_MESSAGES, 'ja').goToPage(4)).toBe('4ページへ移動');
    });
  });
});
