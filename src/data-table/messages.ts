import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the data-table family draws or announces, in each Bloom
 * language. The search field and the row-actions menu speak the common words
 * (`Search`, `More actions`); a caller's `*Label` props still win over these.
 */
export interface DataTableMessages {
  /** The header checkbox's name. */
  selectAll: string;
  /** A row checkbox's name, about the row's id. */
  selectRow: (rowId: string) => string;
  /** The density control's name. */
  densityLabel: string;
  /** The density control's two segments. */
  density: { md: string; sm: string };
}

export const DATA_TABLE_MESSAGES: MessageCatalog<DataTableMessages> = {
  en: {
    selectAll: 'Select all rows on this page',
    selectRow: (id) => `Select row ${id}`,
    densityLabel: 'Table density',
    density: { md: 'Normal', sm: 'Compact' },
  },
  es: {
    selectAll: 'Seleccionar todas las filas de esta página',
    selectRow: (id) => `Seleccionar fila ${id}`,
    densityLabel: 'Densidad de la tabla',
    density: { md: 'Normal', sm: 'Compacta' },
  },
  ca: {
    selectAll: "Selecciona totes les files d'aquesta pàgina",
    selectRow: (id) => `Selecciona la fila ${id}`,
    densityLabel: 'Densitat de la taula',
    density: { md: 'Normal', sm: 'Compacta' },
  },
  de: {
    selectAll: 'Alle Zeilen auf dieser Seite auswählen',
    selectRow: (id) => `Zeile ${id} auswählen`,
    densityLabel: 'Tabellendichte',
    density: { md: 'Normal', sm: 'Kompakt' },
  },
  fr: {
    selectAll: 'Sélectionner toutes les lignes de cette page',
    selectRow: (id) => `Sélectionner la ligne ${id}`,
    densityLabel: 'Densité du tableau',
    density: { md: 'Normale', sm: 'Compacte' },
  },
  it: {
    selectAll: 'Seleziona tutte le righe di questa pagina',
    selectRow: (id) => `Seleziona la riga ${id}`,
    densityLabel: 'Densità della tabella',
    density: { md: 'Normale', sm: 'Compatta' },
  },
  pt: {
    selectAll: 'Selecionar todas as linhas desta página',
    selectRow: (id) => `Selecionar linha ${id}`,
    densityLabel: 'Densidade da tabela',
    density: { md: 'Normal', sm: 'Compacta' },
  },
  ru: {
    selectAll: 'Выбрать все строки на этой странице',
    selectRow: (id) => `Выбрать строку ${id}`,
    densityLabel: 'Плотность таблицы',
    density: { md: 'Обычная', sm: 'Компактная' },
  },
  tr: {
    selectAll: 'Bu sayfadaki tüm satırları seç',
    selectRow: (id) => `${id} satırını seç`,
    densityLabel: 'Tablo yoğunluğu',
    density: { md: 'Normal', sm: 'Sıkı' },
  },
  ja: {
    selectAll: 'このページのすべての行を選択',
    selectRow: (id) => `行 ${id} を選択`,
    densityLabel: '表の密度',
    density: { md: '標準', sm: 'コンパクト' },
  },
  zh: {
    selectAll: '选择本页所有行',
    selectRow: (id) => `选择第 ${id} 行`,
    densityLabel: '表格密度',
    density: { md: '标准', sm: '紧凑' },
  },
  ar: {
    selectAll: 'تحديد كل الصفوف في هذه الصفحة',
    selectRow: (id) => `تحديد الصف ${id}`,
    densityLabel: 'كثافة الجدول',
    density: { md: 'عادية', sm: 'مضغوطة' },
  },
  hi: {
    selectAll: 'इस पेज की सभी पंक्तियाँ चुनें',
    selectRow: (id) => `पंक्ति ${id} चुनें`,
    densityLabel: 'तालिका का घनत्व',
    density: { md: 'सामान्य', sm: 'संक्षिप्त' },
  },
  bn: {
    selectAll: 'এই পৃষ্ঠার সব সারি নির্বাচন করুন',
    selectRow: (id) => `সারি ${id} নির্বাচন করুন`,
    densityLabel: 'টেবিলের ঘনত্ব',
    density: { md: 'সাধারণ', sm: 'সংক্ষিপ্ত' },
  },
  id: {
    selectAll: 'Pilih semua baris di halaman ini',
    selectRow: (id) => `Pilih baris ${id}`,
    densityLabel: 'Kepadatan tabel',
    density: { md: 'Normal', sm: 'Ringkas' },
  },
};
