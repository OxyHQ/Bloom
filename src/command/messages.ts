import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the command palette draws or announces, in each Bloom
 * language. A caller's `placeholder` / `emptyText` still wins.
 */
export interface CommandMessages {
  /** The search field's placeholder, and its name. */
  placeholder: string;
  /** Shown when no item matches. */
  empty: string;
  /** Names the dialog. */
  palette: string;
  /** Names the button that clears the query. */
  clearSearch: string;
}

export const COMMAND_MESSAGES: MessageCatalog<CommandMessages> = {
  en: {
    placeholder: 'Type a command or search…',
    empty: 'No results found.',
    palette: 'Command palette',
    clearSearch: 'Clear search',
  },
  es: {
    placeholder: 'Escribe un comando o busca…',
    empty: 'No se encontraron resultados.',
    palette: 'Paleta de comandos',
    clearSearch: 'Borrar búsqueda',
  },
  ca: {
    placeholder: 'Escriu una ordre o cerca…',
    empty: "No s'ha trobat cap resultat.",
    palette: "Paleta d'ordres",
    clearSearch: 'Esborra la cerca',
  },
  de: {
    placeholder: 'Befehl eingeben oder suchen…',
    empty: 'Keine Ergebnisse gefunden.',
    palette: 'Befehlspalette',
    clearSearch: 'Suche löschen',
  },
  fr: {
    placeholder: 'Saisissez une commande ou recherchez…',
    empty: 'Aucun résultat trouvé.',
    palette: 'Palette de commandes',
    clearSearch: 'Effacer la recherche',
  },
  it: {
    placeholder: 'Digita un comando o cerca…',
    empty: 'Nessun risultato trovato.',
    palette: 'Tavolozza dei comandi',
    clearSearch: 'Cancella ricerca',
  },
  pt: {
    placeholder: 'Digite um comando ou pesquise…',
    empty: 'Nenhum resultado encontrado.',
    palette: 'Paleta de comandos',
    clearSearch: 'Limpar pesquisa',
  },
  ru: {
    placeholder: 'Введите команду или запрос…',
    empty: 'Ничего не найдено.',
    palette: 'Палитра команд',
    clearSearch: 'Очистить поиск',
  },
  tr: {
    placeholder: 'Bir komut yazın veya arayın…',
    empty: 'Sonuç bulunamadı.',
    palette: 'Komut paleti',
    clearSearch: 'Aramayı temizle',
  },
  ja: {
    placeholder: 'コマンドを入力または検索…',
    empty: '結果が見つかりません。',
    palette: 'コマンドパレット',
    clearSearch: '検索をクリア',
  },
  zh: {
    placeholder: '输入命令或搜索…',
    empty: '未找到结果。',
    palette: '命令面板',
    clearSearch: '清除搜索',
  },
  ar: {
    placeholder: 'اكتب أمرًا أو ابحث…',
    empty: 'لم يتم العثور على نتائج.',
    palette: 'لوحة الأوامر',
    clearSearch: 'مسح البحث',
  },
  hi: {
    placeholder: 'कोई कमांड लिखें या खोजें…',
    empty: 'कोई परिणाम नहीं मिला।',
    palette: 'कमांड पैलेट',
    clearSearch: 'खोज साफ़ करें',
  },
  bn: {
    placeholder: 'একটি কমান্ড লিখুন বা খুঁজুন…',
    empty: 'কোনো ফলাফল পাওয়া যায়নি।',
    palette: 'কমান্ড প্যালেট',
    clearSearch: 'অনুসন্ধান মুছুন',
  },
  id: {
    placeholder: 'Ketik perintah atau cari…',
    empty: 'Tidak ada hasil yang ditemukan.',
    palette: 'Palet perintah',
    clearSearch: 'Hapus pencarian',
  },
};
