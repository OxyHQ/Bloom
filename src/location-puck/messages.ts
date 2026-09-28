import type { MessageCatalog } from '../locale/messages';
import type { LocationPuckState } from './types';

/**
 * What `LocationPuck` announces in place of a coloured dot, in each Bloom
 * language. A caller's `stateLabels`/`accessibilityLabel` still wins.
 */
export interface LocationPuckMessages {
  states: Readonly<Record<LocationPuckState, string>>;
  /** "Your location, facing 90 degrees" — the state words, then the bearing. */
  facing: (state: string, degrees: number) => string;
}

export const LOCATION_PUCK_MESSAGES: MessageCatalog<LocationPuckMessages> = {
  en: {
    states: { locating: 'Finding your location', located: 'Your location', stale: 'Your last known location' },
    facing: (state, degrees) => `${state}, facing ${degrees} degrees`,
  },
  es: {
    states: { locating: 'Buscando tu ubicación', located: 'Tu ubicación', stale: 'Tu última ubicación conocida' },
    facing: (state, degrees) => `${state}, orientado a ${degrees} grados`,
  },
  ca: {
    states: { locating: "S'està cercant la teva ubicació", located: 'La teva ubicació', stale: 'La teva darrera ubicació coneguda' },
    facing: (state, degrees) => `${state}, orientat a ${degrees} graus`,
  },
  de: {
    states: { locating: 'Standort wird ermittelt', located: 'Dein Standort', stale: 'Dein letzter bekannter Standort' },
    facing: (state, degrees) => `${state}, Blickrichtung ${degrees} Grad`,
  },
  fr: {
    states: { locating: 'Recherche de votre position', located: 'Votre position', stale: 'Votre dernière position connue' },
    facing: (state, degrees) => `${state}, orienté à ${degrees} degrés`,
  },
  it: {
    states: { locating: 'Ricerca della tua posizione', located: 'La tua posizione', stale: 'La tua ultima posizione nota' },
    facing: (state, degrees) => `${state}, orientamento ${degrees} gradi`,
  },
  pt: {
    states: { locating: 'Procurando sua localização', located: 'Sua localização', stale: 'Sua última localização conhecida' },
    facing: (state, degrees) => `${state}, voltado para ${degrees} graus`,
  },
  ru: {
    states: { locating: 'Определение вашего местоположения', located: 'Ваше местоположение', stale: 'Ваше последнее известное местоположение' },
    facing: (state, degrees) => `${state}, направление ${degrees}°`,
  },
  tr: {
    states: { locating: 'Konumunuz bulunuyor', located: 'Konumunuz', stale: 'Bilinen son konumunuz' },
    facing: (state, degrees) => `${state}, yön ${degrees} derece`,
  },
  ja: {
    states: { locating: '現在地を取得しています', located: '現在地', stale: '最後に確認された現在地' },
    facing: (state, degrees) => `${state}、${degrees}度の方向`,
  },
  zh: {
    states: { locating: '正在查找你的位置', located: '你的位置', stale: '你最后已知的位置' },
    facing: (state, degrees) => `${state}，朝向 ${degrees} 度`,
  },
  ar: {
    states: { locating: 'جارٍ تحديد موقعك', located: 'موقعك', stale: 'آخر موقع معروف لك' },
    facing: (state, degrees) => `${state}، باتجاه ${degrees} درجة`,
  },
  hi: {
    states: { locating: 'आपकी लोकेशन ढूँढी जा रही है', located: 'आपकी लोकेशन', stale: 'आपकी आख़िरी ज्ञात लोकेशन' },
    facing: (state, degrees) => `${state}, ${degrees} डिग्री की दिशा में`,
  },
  bn: {
    states: { locating: 'আপনার অবস্থান খোঁজা হচ্ছে', located: 'আপনার অবস্থান', stale: 'আপনার শেষ জানা অবস্থান' },
    facing: (state, degrees) => `${state}, ${degrees} ডিগ্রি অভিমুখে`,
  },
  id: {
    states: { locating: 'Mencari lokasi Anda', located: 'Lokasi Anda', stale: 'Lokasi terakhir Anda yang diketahui' },
    facing: (state, degrees) => `${state}, menghadap ${degrees} derajat`,
  },
};
