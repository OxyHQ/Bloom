import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the text-field family draws or announces, in each Bloom
 * language. A caller's `revealLabels` still wins over the reveal pair.
 */
export interface TextFieldMessages {
  /** The reveal button's name while the value is hidden. */
  showPassword: string;
  /** The reveal button's name while the value is shown. */
  hidePassword: string;
  /** The name of `TextFieldLabel`'s `required` asterisk. */
  required: string;
}

export const TEXT_FIELD_MESSAGES: MessageCatalog<TextFieldMessages> = {
  en: { showPassword: 'Show password', hidePassword: 'Hide password', required: 'required' },
  es: { showPassword: 'Mostrar contraseña', hidePassword: 'Ocultar contraseña', required: 'obligatorio' },
  ca: { showPassword: 'Mostra la contrasenya', hidePassword: 'Amaga la contrasenya', required: 'obligatori' },
  de: { showPassword: 'Passwort anzeigen', hidePassword: 'Passwort verbergen', required: 'erforderlich' },
  fr: {
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
    required: 'obligatoire',
  },
  it: { showPassword: 'Mostra la password', hidePassword: 'Nascondi la password', required: 'obbligatorio' },
  pt: { showPassword: 'Mostrar senha', hidePassword: 'Ocultar senha', required: 'obrigatório' },
  ru: { showPassword: 'Показать пароль', hidePassword: 'Скрыть пароль', required: 'обязательно' },
  tr: { showPassword: 'Şifreyi göster', hidePassword: 'Şifreyi gizle', required: 'zorunlu' },
  ja: { showPassword: 'パスワードを表示', hidePassword: 'パスワードを非表示', required: '必須' },
  zh: { showPassword: '显示密码', hidePassword: '隐藏密码', required: '必填' },
  ar: { showPassword: 'إظهار كلمة المرور', hidePassword: 'إخفاء كلمة المرور', required: 'مطلوب' },
  hi: { showPassword: 'पासवर्ड दिखाएँ', hidePassword: 'पासवर्ड छिपाएँ', required: 'आवश्यक' },
  bn: { showPassword: 'পাসওয়ার্ড দেখান', hidePassword: 'পাসওয়ার্ড লুকান', required: 'আবশ্যক' },
  id: { showPassword: 'Tampilkan kata sandi', hidePassword: 'Sembunyikan kata sandi', required: 'wajib diisi' },
};
