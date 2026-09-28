import type { MessageCatalog } from '../locale/messages';
import type { RouteStopState } from './types';

/**
 * Every fixed string `RouteStops` draws or announces, in each Bloom language.
 * A caller's `labels`/`accessibilityLabel` still wins, one key at a time.
 */
export interface RouteStopsMessages {
  /** Names the list. */
  routeStops: string;
  origin: string;
  destination: string;
  /** A stop between origin and destination, by its 1-based position. */
  stop: (position: number) => string;
  swap: string;
  /** The add button's VISIBLE label. */
  addStop: string;
  /** Names a stop's remove control: "Remove Home". */
  removeStop: (title: string) => string;
  state: Record<RouteStopState, string>;
}

export const ROUTE_STOPS_MESSAGES: MessageCatalog<RouteStopsMessages> = {
  en: {
    routeStops: 'Route stops',
    origin: 'Origin',
    destination: 'Destination',
    stop: (position) => `Stop ${position}`,
    swap: 'Swap origin and destination',
    addStop: 'Add a stop',
    removeStop: (title) => `Remove ${title}`,
    state: { reached: 'Reached', current: 'Current stop', pending: 'Not reached' },
  },
  es: {
    routeStops: 'Paradas de la ruta',
    origin: 'Origen',
    destination: 'Destino',
    stop: (position) => `Parada ${position}`,
    swap: 'Intercambiar origen y destino',
    addStop: 'Añadir una parada',
    removeStop: (title) => `Quitar ${title}`,
    state: { reached: 'Alcanzada', current: 'Parada actual', pending: 'Pendiente' },
  },
  ca: {
    routeStops: 'Parades de la ruta',
    origin: 'Origen',
    destination: 'Destinació',
    stop: (position) => `Parada ${position}`,
    swap: "Intercanvia l'origen i la destinació",
    addStop: 'Afegeix una parada',
    removeStop: (title) => `Treu ${title}`,
    state: { reached: 'Assolida', current: 'Parada actual', pending: 'Pendent' },
  },
  de: {
    routeStops: 'Stopps der Route',
    origin: 'Start',
    destination: 'Ziel',
    stop: (position) => `Stopp ${position}`,
    swap: 'Start und Ziel tauschen',
    addStop: 'Stopp hinzufügen',
    removeStop: (title) => `${title} entfernen`,
    state: { reached: 'Erreicht', current: 'Aktueller Stopp', pending: 'Nicht erreicht' },
  },
  fr: {
    routeStops: "Étapes de l'itinéraire",
    origin: 'Départ',
    destination: 'Destination',
    stop: (position) => `Étape ${position}`,
    swap: 'Inverser le départ et la destination',
    addStop: 'Ajouter une étape',
    removeStop: (title) => `Retirer ${title}`,
    state: { reached: 'Atteinte', current: 'Étape actuelle', pending: 'Non atteinte' },
  },
  it: {
    routeStops: 'Tappe del percorso',
    origin: 'Partenza',
    destination: 'Destinazione',
    stop: (position) => `Tappa ${position}`,
    swap: 'Inverti partenza e destinazione',
    addStop: 'Aggiungi una tappa',
    removeStop: (title) => `Rimuovi ${title}`,
    state: { reached: 'Raggiunta', current: 'Tappa attuale', pending: 'Non raggiunta' },
  },
  pt: {
    routeStops: 'Paradas da rota',
    origin: 'Origem',
    destination: 'Destino',
    stop: (position) => `Parada ${position}`,
    swap: 'Inverter origem e destino',
    addStop: 'Adicionar uma parada',
    removeStop: (title) => `Remover ${title}`,
    state: { reached: 'Alcançada', current: 'Parada atual', pending: 'Não alcançada' },
  },
  ru: {
    routeStops: 'Остановки маршрута',
    origin: 'Откуда',
    destination: 'Куда',
    stop: (position) => `Остановка ${position}`,
    swap: 'Поменять местами начало и конец маршрута',
    addStop: 'Добавить остановку',
    removeStop: (title) => `Убрать «${title}»`,
    state: { reached: 'Пройдена', current: 'Текущая остановка', pending: 'Не пройдена' },
  },
  tr: {
    routeStops: 'Rota durakları',
    origin: 'Başlangıç',
    destination: 'Varış noktası',
    stop: (position) => `${position}. durak`,
    swap: 'Başlangıç ve varış noktasını değiştir',
    addStop: 'Durak ekle',
    removeStop: (title) => `${title} kaldır`,
    state: { reached: 'Ulaşıldı', current: 'Mevcut durak', pending: 'Ulaşılmadı' },
  },
  ja: {
    routeStops: 'ルートの経由地',
    origin: '出発地',
    destination: '目的地',
    stop: (position) => `経由地 ${position}`,
    swap: '出発地と目的地を入れ替える',
    addStop: '経由地を追加',
    removeStop: (title) => `${title}を削除`,
    state: { reached: '到着済み', current: '現在の経由地', pending: '未到着' },
  },
  zh: {
    routeStops: '路线站点',
    origin: '起点',
    destination: '终点',
    stop: (position) => `第 ${position} 站`,
    swap: '交换起点和终点',
    addStop: '添加途经点',
    removeStop: (title) => `移除${title}`,
    state: { reached: '已到达', current: '当前站点', pending: '未到达' },
  },
  ar: {
    routeStops: 'محطات المسار',
    origin: 'نقطة البداية',
    destination: 'الوجهة',
    stop: (position) => `المحطة ${position}`,
    swap: 'تبديل نقطة البداية والوجهة',
    addStop: 'إضافة محطة',
    removeStop: (title) => `إزالة ${title}`,
    state: { reached: 'تم الوصول', current: 'المحطة الحالية', pending: 'لم يتم الوصول' },
  },
  hi: {
    routeStops: 'रूट के स्टॉप',
    origin: 'शुरुआती जगह',
    destination: 'मंज़िल',
    stop: (position) => `स्टॉप ${position}`,
    swap: 'शुरुआती जगह और मंज़िल की अदला-बदली करें',
    addStop: 'स्टॉप जोड़ें',
    removeStop: (title) => `${title} निकालें`,
    state: { reached: 'पहुँच गए', current: 'मौजूदा स्टॉप', pending: 'नहीं पहुँचे' },
  },
  bn: {
    routeStops: 'রুটের স্টপ',
    origin: 'শুরুর স্থান',
    destination: 'গন্তব্য',
    stop: (position) => `স্টপ ${position}`,
    swap: 'শুরুর স্থান ও গন্তব্য অদলবদল করুন',
    addStop: 'একটি স্টপ যোগ করুন',
    removeStop: (title) => `${title} সরান`,
    state: { reached: 'পৌঁছানো হয়েছে', current: 'বর্তমান স্টপ', pending: 'পৌঁছানো হয়নি' },
  },
  id: {
    routeStops: 'Perhentian rute',
    origin: 'Asal',
    destination: 'Tujuan',
    stop: (position) => `Perhentian ${position}`,
    swap: 'Tukar asal dan tujuan',
    addStop: 'Tambahkan perhentian',
    removeStop: (title) => `Hapus ${title}`,
    state: { reached: 'Tercapai', current: 'Perhentian saat ini', pending: 'Belum tercapai' },
  },
};
