/**
 * The core group on message catalogs: each family below speaks the
 * `LocaleProvider` locale, plural forms follow the language, and a caller's
 * own `labels` / `*Label` prop still wins. The web-only strings are in
 * `core-locale.web.test.tsx`.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { AvatarGroup } from '../avatar-group';
import { AVATAR_GROUP_MESSAGES } from '../avatar-group/messages';
import { Carousel, CarouselItem } from '../carousel';
import { CodeBlock } from '../code';
import { ContactProfileCard } from '../contact-card';
import { LocaleProvider } from '../locale';
import { OutlineNav } from '../outline-nav';
import { SocialButton, socialButtonLabel } from '../social-button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { messagesIn } from './support/messages-in';

// The web portal is a react-dom portal (no DOM here); render in place.
jest.mock('../settings-modal/modal-portal', () => ({
  ModalPortal: ({ children }: { children: React.ReactNode }) => children,
}));

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
      const { getByLabelText, getByTestId } = renderIn(
        'es',
        <Carousel accessibilityLabel="Galería">{slides(3)}</Carousel>,
      );
      expect(getByLabelText('Diapositiva anterior')).toBeTruthy();
      expect(getByLabelText('Diapositiva siguiente')).toBeTruthy();
      expect(getByLabelText('Ir a la diapositiva 2')).toBeTruthy();
      expect(getByTestId('slide-1').props.accessibilityLabel).toBe('2 de 3');
    });

    it('lets previousLabel / dotLabel win over the catalog', () => {
      const { getByLabelText } = renderIn(
        'es',
        <Carousel
          accessibilityLabel="G"
          previousLabel="Atrás del todo"
          dotLabel={(n) => `Foto ${n}`}
        >
          {slides(2)}
        </Carousel>,
      );
      expect(getByLabelText('Atrás del todo')).toBeTruthy();
      expect(getByLabelText('Foto 2')).toBeTruthy();
    });
  });

  describe('code', () => {
    it('names the copy button in the provider locale, and labels still win', () => {
      const { getByLabelText, rerender } = renderIn(
        'es',
        <CodeBlock code="x" filename="a.ts" onCopy={() => {}} />,
      );
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
      const { getByText } = renderIn(
        'es',
        <OutlineNav headings={headings} activeId="a" labels={{ outline: 'Índice' }} />,
      );
      expect(getByText('Índice')).toBeTruthy();
    });
  });

  describe('contact-card', () => {
    it('names channels, chips and the owner in the provider locale', () => {
      const { getByLabelText, getByText } = renderIn(
        'es',
        <ContactProfileCard
          name="Nora Vance"
          channels={[
            { kind: 'phone', onPress: () => {} },
            { kind: 'website', onPress: () => {} },
          ]}
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
      const { getByText } = renderIn(
        'es',
        <ContactProfileCard name="Nora" owner={{ name: 'Marta', label: 'Gestora' }} />,
      );
      expect(getByText('Gestora · Marta')).toBeTruthy();
    });
  });

  describe('avatar-group', () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ id: String(i), name: `P${i}` }));

    it('names the overflow chip with a plural in the provider locale', () => {
      const { getByLabelText } = renderIn(
        'es',
        <AvatarGroup items={items} max={3} onPressItem={() => {}} />,
      );
      expect(getByLabelText('2 personas más')).toBeTruthy();
    });

    it('pluralises per language (ru, ar, fr)', () => {
      expect(messagesIn(AVATAR_GROUP_MESSAGES, 'ru').more(1)).toBe('ещё 1 человек');
      expect(messagesIn(AVATAR_GROUP_MESSAGES, 'ru').more(3)).toBe('ещё 3 человека');
      expect(messagesIn(AVATAR_GROUP_MESSAGES, 'ru').more(5)).toBe('ещё 5 человек');
      expect(messagesIn(AVATAR_GROUP_MESSAGES, 'ar').more(2)).toBe('شخصان آخران');
      expect(messagesIn(AVATAR_GROUP_MESSAGES, 'fr').more(1)).toBe('1 autre personne');
      expect(messagesIn(AVATAR_GROUP_MESSAGES, 'es').more(1)).toBe('1 persona más');
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
      const { getByText } = renderIn(
        'es',
        <SocialButton brand="google" onPress={() => {}}>
          Entrar
        </SocialButton>,
      );
      expect(getByText('Entrar')).toBeTruthy();
    });
  });
});
