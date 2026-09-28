import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the map-attribution family announces, in each Bloom
 * language. The credit and every reading are the app's; a caller's
 * `scaleLabel`/`accessibilityLabel` still wins.
 */
export interface MapAttributionMessages {
  /** The word before the readings in the scale's announcement. */
  scale: string;
  /** Names `MapAttribution`'s strip. */
  mapData: string;
}

export const MAP_ATTRIBUTION_MESSAGES: MessageCatalog<MapAttributionMessages> = {
  en: { scale: 'Scale', mapData: 'Map data' },
  es: { scale: 'Escala', mapData: 'Datos del mapa' },
  ca: { scale: 'Escala', mapData: 'Dades del mapa' },
  de: { scale: 'Maßstab', mapData: 'Kartendaten' },
  fr: { scale: 'Échelle', mapData: 'Données cartographiques' },
  it: { scale: 'Scala', mapData: 'Dati della mappa' },
  pt: { scale: 'Escala', mapData: 'Dados do mapa' },
  ru: { scale: 'Масштаб', mapData: 'Картографические данные' },
  tr: { scale: 'Ölçek', mapData: 'Harita verileri' },
  ja: { scale: '縮尺', mapData: '地図データ' },
  zh: { scale: '比例尺', mapData: '地图数据' },
  ar: { scale: 'مقياس الرسم', mapData: 'بيانات الخريطة' },
  hi: { scale: 'पैमाना', mapData: 'मानचित्र डेटा' },
  bn: { scale: 'স্কেল', mapData: 'মানচিত্রের ডেটা' },
  id: { scale: 'Skala', mapData: 'Data peta' },
};
