import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the lyrics family draws or announces, in each Bloom
 * language. A caller's `*Label` / `emptyText` / `title` prop still wins.
 */
export interface LyricsMessages {
  /** The region's name and the preview card's heading. */
  lyrics: string;
  showLyrics: string;
  backToCurrent: string;
  empty: string;
}

export const LYRICS_MESSAGES: MessageCatalog<LyricsMessages> = {
  en: {
    lyrics: 'Lyrics',
    showLyrics: 'Show lyrics',
    backToCurrent: 'Back to current line',
    empty: 'Lyrics aren’t available for this track',
  },
  es: {
    lyrics: 'Letra',
    showLyrics: 'Mostrar letra',
    backToCurrent: 'Volver a la línea actual',
    empty: 'La letra de esta canción no está disponible',
  },
  ca: {
    lyrics: 'Lletra',
    showLyrics: 'Mostra la lletra',
    backToCurrent: 'Torna a la línia actual',
    empty: "La lletra d'aquesta cançó no està disponible",
  },
  de: {
    lyrics: 'Songtext',
    showLyrics: 'Songtext anzeigen',
    backToCurrent: 'Zurück zur aktuellen Zeile',
    empty: 'Für diesen Titel ist kein Songtext verfügbar',
  },
  fr: {
    lyrics: 'Paroles',
    showLyrics: 'Afficher les paroles',
    backToCurrent: 'Revenir à la ligne en cours',
    empty: 'Les paroles de ce titre ne sont pas disponibles',
  },
  it: {
    lyrics: 'Testo',
    showLyrics: 'Mostra testo',
    backToCurrent: 'Torna alla riga corrente',
    empty: 'Il testo di questo brano non è disponibile',
  },
  pt: {
    lyrics: 'Letra',
    showLyrics: 'Mostrar letra',
    backToCurrent: 'Voltar à linha atual',
    empty: 'A letra desta faixa não está disponível',
  },
  ru: {
    lyrics: 'Текст песни',
    showLyrics: 'Показать текст',
    backToCurrent: 'К текущей строке',
    empty: 'Текст этого трека недоступен',
  },
  tr: {
    lyrics: 'Şarkı sözleri',
    showLyrics: 'Sözleri göster',
    backToCurrent: 'Geçerli satıra dön',
    empty: 'Bu parçanın sözleri mevcut değil',
  },
  ja: {
    lyrics: '歌詞',
    showLyrics: '歌詞を表示',
    backToCurrent: '再生中の行に戻る',
    empty: 'この曲の歌詞はありません',
  },
  zh: {
    lyrics: '歌词',
    showLyrics: '显示歌词',
    backToCurrent: '回到当前歌词',
    empty: '此曲目暂无歌词',
  },
  ar: {
    lyrics: 'الكلمات',
    showLyrics: 'عرض الكلمات',
    backToCurrent: 'العودة إلى السطر الحالي',
    empty: 'كلمات هذا المقطع غير متوفرة',
  },
  hi: {
    lyrics: 'बोल',
    showLyrics: 'बोल दिखाएं',
    backToCurrent: 'मौजूदा पंक्ति पर वापस जाएं',
    empty: 'इस ट्रैक के बोल उपलब्ध नहीं हैं',
  },
  bn: {
    lyrics: 'গানের কথা',
    showLyrics: 'গানের কথা দেখান',
    backToCurrent: 'বর্তমান লাইনে ফিরে যান',
    empty: 'এই ট্র্যাকের গানের কথা উপলব্ধ নেই',
  },
  id: {
    lyrics: 'Lirik',
    showLyrics: 'Tampilkan lirik',
    backToCurrent: 'Kembali ke baris saat ini',
    empty: 'Lirik untuk lagu ini tidak tersedia',
  },
};
