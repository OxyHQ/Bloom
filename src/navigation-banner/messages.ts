import type { MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { NavigationBannerState } from './types';

/**
 * Every fixed string the navigation-banner family draws or announces, in each
 * Bloom language. The maneuver words are `directions`' (`DIRECTIONS_MESSAGES`);
 * a caller's `labels`/`*Label` props still win, one key at a time.
 */
export interface NavigationBannerMessages {
  /** The headline in each exceptional state. */
  states: Readonly<Record<Exclude<NavigationBannerState, 'guiding'>, string>>;
  /**
   * The line after the maneuver — "then turn left Carrer del Roure". `maneuver`
   * is the next maneuver's word, written to START a sentence; the language
   * cases it for the middle of one.
   */
  thenLine: (street: string | undefined, maneuver: string | undefined) => string;
  /** Names `LaneGuidance`. */
  laneGuidance: string;
  /** "4 lanes". */
  laneCount: (count: number) => string;
  /** "lane 3", counted from the left. */
  laneNumber: (position: number) => string;
  /** Joins two lanes: "lane 3 and lane 4". */
  and: (first: string, second: string) => string;
  /** "use lane 3 and lane 4". */
  useLanes: (lanes: string) => string;
  /** "Speed limit 50 km/h" — `limit` arrives with its unit. */
  speedLimit: (limit: string) => string;
  overLimit: string;
  /** `ArrivalBar`'s three captions and its ending action. */
  arrival: string;
  left: string;
  distance: string;
  end: string;
}

const words = (...parts: ReadonlyArray<string | undefined>) => parts.filter(Boolean).join(' ');
/** The first letter lowercased: the rest may be a noun or a proper name that keeps its case. */
const midSentence = (word: string | undefined, locale?: string) =>
  word ? word.charAt(0).toLocaleLowerCase(locale) + word.slice(1) : undefined;

export const NAVIGATION_BANNER_MESSAGES: MessageCatalog<NavigationBannerMessages> = {
  en: {
    states: { 'off-route': 'Off route', rerouting: 'Finding a new route' },
    thenLine: (street, maneuver) => words('then', maneuver?.toLowerCase(), street),
    laneGuidance: 'Lane guidance',
    laneCount: (n) => plural('en', n, { one: '{n} lane', other: '{n} lanes' }),
    laneNumber: (n) => `lane ${n}`,
    and: (a, b) => `${a} and ${b}`,
    useLanes: (lanes) => `use ${lanes}`,
    speedLimit: (limit) => `Speed limit ${limit}`,
    overLimit: 'over the limit',
    arrival: 'Arrival',
    left: 'Left',
    distance: 'Distance',
    end: 'End',
  },
  es: {
    states: { 'off-route': 'Fuera de ruta', rerouting: 'Buscando una nueva ruta' },
    thenLine: (street, maneuver) => words('luego', midSentence(maneuver), street),
    laneGuidance: 'Indicación de carriles',
    laneCount: (n) => plural('es', n, { one: '{n} carril', other: '{n} carriles' }),
    laneNumber: (n) => `carril ${n}`,
    and: (a, b) => `${a} y ${b}`,
    useLanes: (lanes) => `usa el ${lanes}`,
    speedLimit: (limit) => `Límite de velocidad ${limit}`,
    overLimit: 'por encima del límite',
    arrival: 'Llegada',
    left: 'Restante',
    distance: 'Distancia',
    end: 'Finalizar',
  },
  ca: {
    states: { 'off-route': 'Fora de la ruta', rerouting: "S'està cercant una ruta nova" },
    thenLine: (street, maneuver) => words('després', midSentence(maneuver), street),
    laneGuidance: 'Indicació de carrils',
    laneCount: (n) => plural('ca', n, { one: '{n} carril', other: '{n} carrils' }),
    laneNumber: (n) => `carril ${n}`,
    and: (a, b) => `${a} i ${b}`,
    useLanes: (lanes) => `fes servir el ${lanes}`,
    speedLimit: (limit) => `Límit de velocitat ${limit}`,
    overLimit: 'per sobre del límit',
    arrival: 'Arribada',
    left: 'Restant',
    distance: 'Distància',
    end: 'Finalitza',
  },
  de: {
    states: { 'off-route': 'Route verlassen', rerouting: 'Neue Route wird gesucht' },
    thenLine: (street, maneuver) => words('dann', midSentence(maneuver, 'de'), street),
    laneGuidance: 'Spurassistent',
    laneCount: (n) => plural('de', n, { one: '{n} Fahrspur', other: '{n} Fahrspuren' }),
    laneNumber: (n) => `Spur ${n}`,
    and: (a, b) => `${a} und ${b}`,
    useLanes: (lanes) => `${lanes} benutzen`,
    speedLimit: (limit) => `Tempolimit ${limit}`,
    overLimit: 'zu schnell',
    arrival: 'Ankunft',
    left: 'Verbleibend',
    distance: 'Entfernung',
    end: 'Beenden',
  },
  fr: {
    states: { 'off-route': 'Hors itinéraire', rerouting: "Recherche d'un nouvel itinéraire" },
    thenLine: (street, maneuver) => words('puis', midSentence(maneuver, 'fr'), street),
    laneGuidance: 'Guidage sur voie',
    laneCount: (n) => plural('fr', n, { one: '{n} voie', other: '{n} voies' }),
    laneNumber: (n) => `voie ${n}`,
    and: (a, b) => `${a} et ${b}`,
    useLanes: (lanes) => `prenez la ${lanes}`,
    speedLimit: (limit) => `Limitation de vitesse ${limit}`,
    overLimit: 'au-dessus de la limite',
    arrival: 'Arrivée',
    left: 'Restant',
    distance: 'Distance',
    end: 'Terminer',
  },
  it: {
    states: { 'off-route': 'Fuori percorso', rerouting: 'Ricerca di un nuovo percorso' },
    thenLine: (street, maneuver) => words('poi', midSentence(maneuver, 'it'), street),
    laneGuidance: 'Indicazione corsie',
    laneCount: (n) => plural('it', n, { one: '{n} corsia', other: '{n} corsie' }),
    laneNumber: (n) => `corsia ${n}`,
    and: (a, b) => `${a} e ${b}`,
    useLanes: (lanes) => `usa la ${lanes}`,
    speedLimit: (limit) => `Limite di velocità ${limit}`,
    overLimit: 'oltre il limite',
    arrival: 'Arrivo',
    left: 'Rimanente',
    distance: 'Distanza',
    end: 'Termina',
  },
  pt: {
    states: { 'off-route': 'Fora da rota', rerouting: 'Procurando uma nova rota' },
    thenLine: (street, maneuver) => words('depois', midSentence(maneuver, 'pt'), street),
    laneGuidance: 'Orientação de faixas',
    laneCount: (n) => plural('pt', n, { one: '{n} faixa', other: '{n} faixas' }),
    laneNumber: (n) => `faixa ${n}`,
    and: (a, b) => `${a} e ${b}`,
    useLanes: (lanes) => `use a ${lanes}`,
    speedLimit: (limit) => `Limite de velocidade ${limit}`,
    overLimit: 'acima do limite',
    arrival: 'Chegada',
    left: 'Restante',
    distance: 'Distância',
    end: 'Encerrar',
  },
  ru: {
    states: { 'off-route': 'Вы сошли с маршрута', rerouting: 'Поиск нового маршрута' },
    thenLine: (street, maneuver) => words('затем', midSentence(maneuver, 'ru'), street),
    laneGuidance: 'Подсказка по полосам',
    laneCount: (n) => plural('ru', n, { one: '{n} полоса', few: '{n} полосы', many: '{n} полос', other: '{n} полосы' }),
    laneNumber: (n) => `полосу ${n}`,
    and: (a, b) => `${a} и ${b}`,
    useLanes: (lanes) => `займите ${lanes}`,
    speedLimit: (limit) => `Ограничение скорости ${limit}`,
    overLimit: 'превышение',
    arrival: 'Прибытие',
    left: 'Осталось',
    distance: 'Расстояние',
    end: 'Завершить',
  },
  tr: {
    states: { 'off-route': 'Rota dışı', rerouting: 'Yeni rota bulunuyor' },
    thenLine: (street, maneuver) => words('ardından', midSentence(maneuver, 'tr'), street),
    laneGuidance: 'Şerit rehberi',
    laneCount: (n) => plural('tr', n, { one: '{n} şerit', other: '{n} şerit' }),
    laneNumber: (n) => `${n}. şerit`,
    and: (a, b) => `${a} ve ${b}`,
    useLanes: (lanes) => `kullanılacak şerit: ${lanes}`,
    speedLimit: (limit) => `Hız sınırı ${limit}`,
    overLimit: 'sınırın üzerinde',
    arrival: 'Varış',
    left: 'Kalan',
    distance: 'Mesafe',
    end: 'Bitir',
  },
  ja: {
    states: { 'off-route': 'ルートから外れました', rerouting: '新しいルートを検索しています' },
    thenLine: (street, maneuver) => `その後、${words(maneuver, street)}`,
    laneGuidance: 'レーン案内',
    laneCount: (n) => plural('ja', n, { other: '{n}車線' }),
    laneNumber: (n) => `左から${n}番目の車線`,
    and: (a, b) => `${a}と${b}`,
    useLanes: (lanes) => `${lanes}を走行`,
    speedLimit: (limit) => `制限速度 ${limit}`,
    overLimit: '速度超過',
    arrival: '到着',
    left: '残り時間',
    distance: '距離',
    end: '終了',
  },
  zh: {
    states: { 'off-route': '已偏离路线', rerouting: '正在重新规划路线' },
    thenLine: (street, maneuver) => `然后${words(maneuver, street)}`,
    laneGuidance: '车道指引',
    laneCount: (n) => plural('zh', n, { other: '{n} 条车道' }),
    laneNumber: (n) => `左起第 ${n} 条车道`,
    and: (a, b) => `${a}和${b}`,
    useLanes: (lanes) => `请走${lanes}`,
    speedLimit: (limit) => `限速 ${limit}`,
    overLimit: '已超速',
    arrival: '到达',
    left: '剩余时间',
    distance: '距离',
    end: '结束',
  },
  ar: {
    states: { 'off-route': 'خارج المسار', rerouting: 'جارٍ البحث عن مسار جديد' },
    thenLine: (street, maneuver) => words('ثم', maneuver, street),
    laneGuidance: 'إرشاد الحارات',
    laneCount: (n) =>
      plural('ar', n, {
        zero: 'لا توجد حارات',
        one: 'حارة واحدة',
        two: 'حارتان',
        few: '{n} حارات',
        many: '{n} حارة',
        other: '{n} حارة',
      }),
    laneNumber: (n) => `الحارة ${n}`,
    and: (a, b) => `${a} و${b}`,
    useLanes: (lanes) => `استخدم ${lanes}`,
    speedLimit: (limit) => `الحد الأقصى للسرعة ${limit}`,
    overLimit: 'تجاوز الحد',
    arrival: 'الوصول',
    left: 'المتبقي',
    distance: 'المسافة',
    end: 'إنهاء',
  },
  hi: {
    states: { 'off-route': 'रास्ते से हट गए', rerouting: 'नया रास्ता खोजा जा रहा है' },
    thenLine: (street, maneuver) => words('फिर', maneuver, street),
    laneGuidance: 'लेन मार्गदर्शन',
    laneCount: (n) => plural('hi', n, { one: '{n} लेन', other: '{n} लेन' }),
    laneNumber: (n) => `लेन ${n}`,
    and: (a, b) => `${a} और ${b}`,
    useLanes: (lanes) => `${lanes} का इस्तेमाल करें`,
    speedLimit: (limit) => `गति सीमा ${limit}`,
    overLimit: 'सीमा से ज़्यादा',
    arrival: 'पहुँचने का समय',
    left: 'बाकी',
    distance: 'दूरी',
    end: 'खत्म करें',
  },
  bn: {
    states: { 'off-route': 'রুটের বাইরে', rerouting: 'নতুন রুট খোঁজা হচ্ছে' },
    thenLine: (street, maneuver) => words('তারপর', maneuver, street),
    laneGuidance: 'লেন নির্দেশিকা',
    laneCount: (n) => plural('bn', n, { other: '{n}টি লেন' }),
    laneNumber: (n) => `লেন ${n}`,
    and: (a, b) => `${a} ও ${b}`,
    useLanes: (lanes) => `${lanes} ব্যবহার করুন`,
    speedLimit: (limit) => `গতিসীমা ${limit}`,
    overLimit: 'সীমা ছাড়িয়ে গেছে',
    arrival: 'পৌঁছানোর সময়',
    left: 'বাকি',
    distance: 'দূরত্ব',
    end: 'শেষ করুন',
  },
  id: {
    states: { 'off-route': 'Keluar dari rute', rerouting: 'Mencari rute baru' },
    thenLine: (street, maneuver) => words('lalu', midSentence(maneuver, 'id'), street),
    laneGuidance: 'Panduan lajur',
    laneCount: (n) => plural('id', n, { other: '{n} lajur' }),
    laneNumber: (n) => `lajur ${n}`,
    and: (a, b) => `${a} dan ${b}`,
    useLanes: (lanes) => `gunakan ${lanes}`,
    speedLimit: (limit) => `Batas kecepatan ${limit}`,
    overLimit: 'melebihi batas',
    arrival: 'Tiba',
    left: 'Sisa',
    distance: 'Jarak',
    end: 'Akhiri',
  },
};
