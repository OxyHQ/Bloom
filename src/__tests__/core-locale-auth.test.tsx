/**
 * The core group on message catalogs: each family below speaks the
 * `LocaleProvider` locale, plural forms follow the language, and a caller's
 * own `labels` / `*Label` prop still wins. The web-only strings are in
 * `core-locale.web.test.tsx`.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { AuthCard } from '../auth-card';
import { AUTH_CARD_MESSAGES } from '../auth-card/messages';
import { InputOtp } from '../input-otp';
import { Label } from '../label';
import { LocaleProvider } from '../locale';
import { PhoneInput } from '../phone-input';
import { Rating, RatingInput } from '../rating';
import { RATING_MESSAGES } from '../rating/messages';
import { Search } from '../search';
import { SelectScrollDownButton, SelectScrollProvider, SelectScrollUpButton } from '../select';
import { RangeSlider } from '../slider';
import { Stepper } from '../stepper';
import { TagField } from '../tag-field';
import { TextFieldLabel } from '../text-field';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { messagesIn } from './support/messages-in';

// The web portal is a react-dom portal (no DOM here); render in place.
jest.mock('../settings-modal/modal-portal', () => ({
  ModalPortal: ({ children }: { children: React.ReactNode }) => children,
}));

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
      expect(
        getByText(
          'Introduce el código que enviamos a ana@example.com para terminar de iniciar sesión.',
        ),
      ).toBeTruthy();
      expect(getByText('Código de verificación')).toBeTruthy();
    });

    it('places the address where the language puts it (Japanese leads with it)', () => {
      expect(messagesIn(AUTH_CARD_MESSAGES, 'ja').codeSentTo('a@b.jp').startsWith('a@b.jp')).toBe(
        true,
      );
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
      const { getByLabelText } = renderIn(
        'es',
        <TagField value={['diseño']} onChange={() => {}} label="Etiquetas" />,
      );
      expect(getByLabelText('Quitar diseño')).toBeTruthy();
      const custom = renderIn(
        'es',
        <TagField
          value={['diseño']}
          onChange={() => {}}
          label="Etiquetas"
          labels={{ remove: (t) => `Borrar ${t}` }}
        />,
      );
      expect(custom.getByLabelText('Borrar diseño')).toBeTruthy();
    });
  });

  describe('label and text-field in Spanish', () => {
    it('announces the asterisk as required in the locale', () => {
      expect(
        renderIn('es', <Label required>Nombre</Label>).getByLabelText('obligatorio'),
      ).toBeTruthy();
      expect(
        renderIn('es', <TextFieldLabel required>Nombre</TextFieldLabel>).getByLabelText(
          'obligatorio',
        ),
      ).toBeTruthy();
    });
  });

  describe('select in Spanish', () => {
    it('names the scroll chevrons in the locale', () => {
      const { getByLabelText } = renderIn(
        'es',
        <SelectScrollProvider
          value={{ canScrollUp: true, canScrollDown: true, scrollBy: () => {} }}
        >
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
      const { getByLabelText } = renderIn(
        'es',
        <RangeSlider value={[10, 90]} onValueChange={() => {}} accessibilityLabel="Precio" />,
      );
      expect(getByLabelText('Mínimo')).toBeTruthy();
      expect(getByLabelText('Máximo')).toBeTruthy();
      const custom = renderIn(
        'es',
        <RangeSlider
          value={[10, 90]}
          onValueChange={() => {}}
          accessibilityLabel="Precio"
          thumbLabels={['Desde', 'Hasta']}
        />,
      );
      expect(custom.getByLabelText('Desde')).toBeTruthy();
    });
  });

  describe('stepper in Spanish', () => {
    it('names its buttons, and decrementLabel still wins', () => {
      const { getByLabelText } = renderIn(
        'es',
        <Stepper value={2} onValueChange={() => {}} accessibilityLabel="Huéspedes" />,
      );
      expect(getByLabelText('Disminuir')).toBeTruthy();
      expect(getByLabelText('Aumentar')).toBeTruthy();
      const custom = renderIn(
        'es',
        <Stepper
          value={2}
          onValueChange={() => {}}
          accessibilityLabel="Huéspedes"
          decrementLabel="Menos"
        />,
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
      expect(
        renderIn('es', <Rating value={null} newLabel="Recién llegado" />).getByText(
          'Recién llegado',
        ),
      ).toBeTruthy();
    });

    it('keeps a preformatted count exactly as given', () => {
      expect(messagesIn(RATING_MESSAGES, 'es').reviews('1,2 mil')).toBe('1,2 mil reseñas');
    });

    it('pluralises the star names per language', () => {
      const { getByLabelText } = renderIn(
        'ru',
        <RatingInput value={null} onChange={() => {}} accessibilityLabel="Оценка" />,
      );
      expect(getByLabelText('1 звезда')).toBeTruthy();
      expect(getByLabelText('2 звезды')).toBeTruthy();
      expect(getByLabelText('5 звёзд')).toBeTruthy();
      expect(messagesIn(RATING_MESSAGES, 'ar').reviews(2)).toBe('مراجعتان');
    });
  });
});
