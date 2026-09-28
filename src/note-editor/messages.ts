import type { MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { NoteEditorHeaderLabels, NoteEditorToolbarLabels } from './types';

/**
 * Every fixed string the note-editor family draws or announces, in each Bloom
 * language. A caller's `labels`, `placeholder` and `accessibilityLabel` props
 * still win over any entry here.
 */
export interface NoteEditorMessages {
  header: Required<NoteEditorHeaderLabels>;
  /** The empty title's placeholder. */
  untitled: string;
  /** Names the header region. */
  note: string;
  toolbar: Required<NoteEditorToolbarLabels>;
}

export const NOTE_EDITOR_MESSAGES: MessageCatalog<NoteEditorMessages> = {
  en: {
    header: {
      saved: 'Saved',
      saving: 'Saving…',
      offline: 'Offline — changes are held',
      error: 'Not saved',
      words: (n) => plural('en', n, { one: '{n} word', other: '{n} words' }),
      title: 'Title',
    },
    untitled: 'Untitled',
    note: 'Note',
    toolbar: { more: 'More formatting', moreMenu: 'More formatting' },
  },
  es: {
    header: {
      saved: 'Guardado',
      saving: 'Guardando…',
      offline: 'Sin conexión — los cambios se conservan',
      error: 'No guardado',
      words: (n) => plural('es', n, { one: '{n} palabra', other: '{n} palabras' }),
      title: 'Título',
    },
    untitled: 'Sin título',
    note: 'Nota',
    toolbar: { more: 'Más formato', moreMenu: 'Más formato' },
  },
  ca: {
    header: {
      saved: 'Desat',
      saving: "S'està desant…",
      offline: 'Sense connexió — els canvis es conserven',
      error: 'No desat',
      words: (n) => plural('ca', n, { one: '{n} paraula', other: '{n} paraules' }),
      title: 'Títol',
    },
    untitled: 'Sense títol',
    note: 'Nota',
    toolbar: { more: 'Més format', moreMenu: 'Més format' },
  },
  de: {
    header: {
      saved: 'Gespeichert',
      saving: 'Wird gespeichert…',
      offline: 'Offline – Änderungen werden aufbewahrt',
      error: 'Nicht gespeichert',
      words: (n) => plural('de', n, { one: '{n} Wort', other: '{n} Wörter' }),
      title: 'Titel',
    },
    untitled: 'Ohne Titel',
    note: 'Notiz',
    toolbar: { more: 'Weitere Formatierung', moreMenu: 'Weitere Formatierung' },
  },
  fr: {
    header: {
      saved: 'Enregistré',
      saving: 'Enregistrement…',
      offline: 'Hors ligne — modifications conservées',
      error: 'Non enregistré',
      words: (n) => plural('fr', n, { one: '{n} mot', other: '{n} mots' }),
      title: 'Titre',
    },
    untitled: 'Sans titre',
    note: 'Note',
    toolbar: { more: 'Plus de mise en forme', moreMenu: 'Plus de mise en forme' },
  },
  it: {
    header: {
      saved: 'Salvato',
      saving: 'Salvataggio…',
      offline: 'Offline — modifiche conservate',
      error: 'Non salvato',
      words: (n) => plural('it', n, { one: '{n} parola', other: '{n} parole' }),
      title: 'Titolo',
    },
    untitled: 'Senza titolo',
    note: 'Nota',
    toolbar: { more: 'Altra formattazione', moreMenu: 'Altra formattazione' },
  },
  pt: {
    header: {
      saved: 'Salvo',
      saving: 'Salvando…',
      offline: 'Offline — alterações mantidas',
      error: 'Não salvo',
      words: (n) => plural('pt', n, { one: '{n} palavra', other: '{n} palavras' }),
      title: 'Título',
    },
    untitled: 'Sem título',
    note: 'Nota',
    toolbar: { more: 'Mais formatação', moreMenu: 'Mais formatação' },
  },
  ru: {
    header: {
      saved: 'Сохранено',
      saving: 'Сохранение…',
      offline: 'Нет сети — изменения сохранены на устройстве',
      error: 'Не сохранено',
      words: (n) => plural('ru', n, { one: '{n} слово', few: '{n} слова', many: '{n} слов', other: '{n} слова' }),
      title: 'Заголовок',
    },
    untitled: 'Без названия',
    note: 'Заметка',
    toolbar: { more: 'Ещё форматирование', moreMenu: 'Ещё форматирование' },
  },
  tr: {
    header: {
      saved: 'Kaydedildi',
      saving: 'Kaydediliyor…',
      offline: 'Çevrimdışı — değişiklikler bekletiliyor',
      error: 'Kaydedilmedi',
      words: (n) => plural('tr', n, { other: '{n} kelime' }),
      title: 'Başlık',
    },
    untitled: 'Başlıksız',
    note: 'Not',
    toolbar: { more: 'Diğer biçimlendirme', moreMenu: 'Diğer biçimlendirme' },
  },
  ja: {
    header: {
      saved: '保存済み',
      saving: '保存中…',
      offline: 'オフライン — 変更は保持されています',
      error: '未保存',
      words: (n) => plural('ja', n, { other: '{n}語' }),
      title: 'タイトル',
    },
    untitled: '無題',
    note: 'メモ',
    toolbar: { more: 'その他の書式', moreMenu: 'その他の書式' },
  },
  zh: {
    header: {
      saved: '已保存',
      saving: '正在保存…',
      offline: '离线 — 更改已暂存',
      error: '未保存',
      words: (n) => plural('zh', n, { other: '{n} 个词' }),
      title: '标题',
    },
    untitled: '无标题',
    note: '笔记',
    toolbar: { more: '更多格式', moreMenu: '更多格式' },
  },
  ar: {
    header: {
      saved: 'تم الحفظ',
      saving: 'جارٍ الحفظ…',
      offline: 'غير متصل — التغييرات محفوظة مؤقتًا',
      error: 'لم يتم الحفظ',
      words: (n) =>
        plural('ar', n, {
          zero: 'لا كلمات',
          one: 'كلمة واحدة',
          two: 'كلمتان',
          few: '{n} كلمات',
          many: '{n} كلمة',
          other: '{n} كلمة',
        }),
      title: 'العنوان',
    },
    untitled: 'بلا عنوان',
    note: 'ملاحظة',
    toolbar: { more: 'تنسيق إضافي', moreMenu: 'تنسيق إضافي' },
  },
  hi: {
    header: {
      saved: 'सहेजा गया',
      saving: 'सहेजा जा रहा है…',
      offline: 'ऑफ़लाइन — बदलाव रखे गए हैं',
      error: 'सहेजा नहीं गया',
      words: (n) => plural('hi', n, { other: '{n} शब्द' }),
      title: 'शीर्षक',
    },
    untitled: 'शीर्षकहीन',
    note: 'नोट',
    toolbar: { more: 'और फ़ॉर्मैटिंग', moreMenu: 'और फ़ॉर्मैटिंग' },
  },
  bn: {
    header: {
      saved: 'সংরক্ষিত',
      saving: 'সংরক্ষণ করা হচ্ছে…',
      offline: 'অফলাইন — পরিবর্তনগুলো রাখা আছে',
      error: 'সংরক্ষিত হয়নি',
      words: (n) => plural('bn', n, { other: '{n}টি শব্দ' }),
      title: 'শিরোনাম',
    },
    untitled: 'শিরোনামহীন',
    note: 'নোট',
    toolbar: { more: 'আরও ফরম্যাটিং', moreMenu: 'আরও ফরম্যাটিং' },
  },
  id: {
    header: {
      saved: 'Tersimpan',
      saving: 'Menyimpan…',
      offline: 'Offline — perubahan ditahan',
      error: 'Tidak tersimpan',
      words: (n) => plural('id', n, { other: '{n} kata' }),
      title: 'Judul',
    },
    untitled: 'Tanpa judul',
    note: 'Catatan',
    toolbar: { more: 'Format lainnya', moreMenu: 'Format lainnya' },
  },
};
