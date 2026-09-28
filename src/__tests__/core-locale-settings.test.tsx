/**
 * The core group on message catalogs: each family below speaks the
 * `LocaleProvider` locale, plural forms follow the language, and a caller's
 * own `labels` / `*Label` prop still wins. The web-only strings are in
 * `core-locale.web.test.tsx`.
 */
import React,{ useState } from 'react';
import * as ReactNative from 'react-native';
import { Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';

import { ErrorBoundary } from '../error-boundary';
import { RiSettings6Line } from '../icons/remix';
import { LocaleProvider } from '../locale';
import { SettingsDateField, SettingsModal, SettingsPlanCard, SettingsServerList, SettingsStoragePage, SettingsToolsPage } from '../settings-modal';
import { SETTINGS_MODAL_MESSAGES } from '../settings-modal/messages';
import { ThemeToggle } from '../theme-toggle';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { messagesIn } from './support/messages-in';

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
      const ru = messagesIn(SETTINGS_MODAL_MESSAGES, 'ru').storage.fileCount;
      expect([1, 3, 5, 21].map((n) => ru(n, String(n)))).toEqual(['1 файл', '3 файла', '5 файлов', '21 файл']);
      expect(SETTINGS_MODAL_MESSAGES.en.storage.fileCount(2, '2')).toBe('2 files');
      expect(messagesIn(SETTINGS_MODAL_MESSAGES, 'ar').storage.fileCount(2, '2')).toBe('ملفان');
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
