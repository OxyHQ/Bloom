import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the outline-nav family draws or announces, in each Bloom
 * language. `OutlineNav`'s `labels`, `title` and `accessibilityLabel` props
 * still win over these.
 */
export interface OutlineNavMessages {
  /** Names the navigation region and the progress bar, and titles the list. */
  outline: string;
  /** The progress bar's spoken reading, given the position and the total. */
  progress: (at: number, of: number) => string;
}

export const OUTLINE_NAV_MESSAGES: MessageCatalog<OutlineNavMessages> = {
  en: { outline: 'On this page', progress: (at, of) => `Heading ${at} of ${of}` },
  es: { outline: 'En esta página', progress: (at, of) => `Encabezado ${at} de ${of}` },
  ca: { outline: 'En aquesta pàgina', progress: (at, of) => `Encapçalament ${at} de ${of}` },
  de: { outline: 'Auf dieser Seite', progress: (at, of) => `Überschrift ${at} von ${of}` },
  fr: { outline: 'Sur cette page', progress: (at, of) => `Titre ${at} sur ${of}` },
  it: { outline: 'In questa pagina', progress: (at, of) => `Titolo ${at} di ${of}` },
  pt: { outline: 'Nesta página', progress: (at, of) => `Título ${at} de ${of}` },
  ru: { outline: 'На этой странице', progress: (at, of) => `Заголовок ${at} из ${of}` },
  tr: { outline: 'Bu sayfada', progress: (at, of) => `Başlık ${at}/${of}` },
  ja: { outline: 'このページの内容', progress: (at, of) => `見出し ${at}/${of}` },
  zh: { outline: '本页内容', progress: (at, of) => `第 ${at} 个标题，共 ${of} 个` },
  ar: { outline: 'في هذه الصفحة', progress: (at, of) => `العنوان ${at} من ${of}` },
  hi: { outline: 'इस पेज पर', progress: (at, of) => `${of} में से शीर्षक ${at}` },
  bn: { outline: 'এই পৃষ্ঠায়', progress: (at, of) => `${of}টির মধ্যে শিরোনাম ${at}` },
  id: { outline: 'Di halaman ini', progress: (at, of) => `Judul ${at} dari ${of}` },
};
