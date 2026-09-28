import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the code family announces, in each Bloom language.
 * `CodeBlock`'s `labels` prop still wins over these.
 */
export interface CodeMessages {
  /** The copy button's name. */
  copy: string;
  /** Its name for the moment after a copy. */
  copied: string;
}

export const CODE_MESSAGES: MessageCatalog<CodeMessages> = {
  en: { copy: 'Copy code', copied: 'Code copied' },
  es: { copy: 'Copiar código', copied: 'Código copiado' },
  ca: { copy: 'Copia el codi', copied: 'Codi copiat' },
  de: { copy: 'Code kopieren', copied: 'Code kopiert' },
  fr: { copy: 'Copier le code', copied: 'Code copié' },
  it: { copy: 'Copia codice', copied: 'Codice copiato' },
  pt: { copy: 'Copiar código', copied: 'Código copiado' },
  ru: { copy: 'Копировать код', copied: 'Код скопирован' },
  tr: { copy: 'Kodu kopyala', copied: 'Kod kopyalandı' },
  ja: { copy: 'コードをコピー', copied: 'コードをコピーしました' },
  zh: { copy: '复制代码', copied: '代码已复制' },
  ar: { copy: 'نسخ الرمز', copied: 'تم نسخ الرمز' },
  hi: { copy: 'कोड कॉपी करें', copied: 'कोड कॉपी हो गया' },
  bn: { copy: 'কোড কপি করুন', copied: 'কোড কপি হয়েছে' },
  id: { copy: 'Salin kode', copied: 'Kode disalin' },
};
