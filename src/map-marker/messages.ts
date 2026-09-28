import type { MessageCatalog } from '../locale/messages';
import type { BloomLanguage } from '../locale/languages';
import { plural, type PluralCategory } from '../locale/plural';

/**
 * `plural` for a count that may arrive pre-formatted ("99+"): a string takes
 * the `other` form, which is the form every language uses for "many".
 */
function countOf(
  language: BloomLanguage,
  count: number | string,
  forms: Partial<Record<PluralCategory, string>> & { other: string },
): string {
  return typeof count === 'number' ? plural(language, count, forms) : forms.other.replace('{n}', count);
}

/**
 * Every fixed string the map-marker family draws or announces, in each Bloom
 * language. A caller's `label`/`accessibilityLabel` still wins.
 */
export interface MapMarkerMessages {
  /** `MapSearchAreaButton variant="toggle"`. */
  searchAsMapMoves: string;
  /** `MapSearchAreaButton`'s default button. */
  searchThisArea: string;
  /** Names a `MapClusterMarker`: "12 stays". */
  stays: (count: number | string) => string;
}

export const MAP_MARKER_MESSAGES: MessageCatalog<MapMarkerMessages> = {
  en: {
    searchAsMapMoves: 'Search as I move the map',
    searchThisArea: 'Search this area',
    stays: (n) => countOf('en', n, { one: '{n} stay', other: '{n} stays' }),
  },
  es: {
    searchAsMapMoves: 'Buscar al mover el mapa',
    searchThisArea: 'Buscar en esta zona',
    stays: (n) => countOf('es', n, { one: '{n} alojamiento', other: '{n} alojamientos' }),
  },
  ca: {
    searchAsMapMoves: 'Cerca en moure el mapa',
    searchThisArea: 'Cerca en aquesta zona',
    stays: (n) => countOf('ca', n, { one: '{n} allotjament', other: '{n} allotjaments' }),
  },
  de: {
    searchAsMapMoves: 'Beim Verschieben der Karte suchen',
    searchThisArea: 'In diesem Gebiet suchen',
    stays: (n) => countOf('de', n, { one: '{n} Unterkunft', other: '{n} Unterkünfte' }),
  },
  fr: {
    searchAsMapMoves: 'Rechercher en déplaçant la carte',
    searchThisArea: 'Rechercher dans cette zone',
    stays: (n) => countOf('fr', n, { one: '{n} logement', other: '{n} logements' }),
  },
  it: {
    searchAsMapMoves: 'Cerca mentre sposto la mappa',
    searchThisArea: 'Cerca in questa zona',
    stays: (n) => countOf('it', n, { one: '{n} alloggio', other: '{n} alloggi' }),
  },
  pt: {
    searchAsMapMoves: 'Pesquisar ao mover o mapa',
    searchThisArea: 'Pesquisar nesta área',
    stays: (n) => countOf('pt', n, { one: '{n} acomodação', other: '{n} acomodações' }),
  },
  ru: {
    searchAsMapMoves: 'Искать при перемещении карты',
    searchThisArea: 'Искать в этой области',
    stays: (n) => countOf('ru', n, { one: '{n} вариант жилья', few: '{n} варианта жилья', many: '{n} вариантов жилья', other: '{n} варианта жилья' }),
  },
  tr: {
    searchAsMapMoves: 'Haritayı hareket ettirdikçe ara',
    searchThisArea: 'Bu bölgede ara',
    stays: (n) => countOf('tr', n, { one: '{n} konaklama', other: '{n} konaklama' }),
  },
  ja: {
    searchAsMapMoves: '地図の移動に合わせて検索',
    searchThisArea: 'このエリアを検索',
    stays: (n) => countOf('ja', n, { other: '{n}件の宿泊先' }),
  },
  zh: {
    searchAsMapMoves: '移动地图时搜索',
    searchThisArea: '搜索此区域',
    stays: (n) => countOf('zh', n, { other: '{n} 个住宿' }),
  },
  ar: {
    searchAsMapMoves: 'البحث عند تحريك الخريطة',
    searchThisArea: 'البحث في هذه المنطقة',
    stays: (n) =>
      countOf('ar', n, {
        zero: 'لا توجد أماكن إقامة',
        one: 'مكان إقامة واحد',
        two: 'مكانا إقامة',
        few: '{n} أماكن إقامة',
        many: '{n} مكان إقامة',
        other: '{n} مكان إقامة',
      }),
  },
  hi: {
    searchAsMapMoves: 'मानचित्र हिलाने पर खोजें',
    searchThisArea: 'इस क्षेत्र में खोजें',
    stays: (n) => countOf('hi', n, { one: '{n} ठहरने की जगह', other: '{n} ठहरने की जगहें' }),
  },
  bn: {
    searchAsMapMoves: 'মানচিত্র সরালে খুঁজুন',
    searchThisArea: 'এই এলাকায় খুঁজুন',
    stays: (n) => countOf('bn', n, { other: '{n}টি থাকার জায়গা' }),
  },
  id: {
    searchAsMapMoves: 'Cari saat saya menggeser peta',
    searchThisArea: 'Cari di area ini',
    stays: (n) => countOf('id', n, { other: '{n} penginapan' }),
  },
};
