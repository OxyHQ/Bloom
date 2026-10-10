// Bloom's ca strings for every family. Loaded on demand by
// `loadBloomLanguage` (src/locale/translations.ts), the ONLY importer of this
// module, so a bundler gives each language one chunk of its own.
import type { Translations } from './types';
import { priceName as booking_priceName } from '../../booking/message-helpers';
import { compactDuration as calendar_compactDuration } from '../../calendar/message-helpers';
import { corner as callUi_corner } from '../../call-ui/message-helpers';
import { plural } from '../plural';
import { countOf as mapMarker_countOf } from '../../map-marker/message-helpers';
import {
  words as navigationBanner_words,
  midSentence as navigationBanner_midSentence,
} from '../../navigation-banner/message-helpers';
import {
  withReviews as placeCard_withReviews,
  countOf as placeCard_countOf,
} from '../../place-card/message-helpers';
import { countForms as rating_countForms } from '../../rating/message-helpers';
import { shapeNames as shapes_shapeNames } from '../../shapes/message-helpers';
import {
  has as vendorCard_has,
  counted as vendorCard_counted,
} from '../../vendor-card/message-helpers';

const CALL_UI_MESSAGES__CORNERS = {
  'top-left': "a dalt a l'esquerra",
  'top-right': 'a dalt a la dreta',
  'bottom-left': "a baix a l'esquerra",
  'bottom-right': 'a baix a la dreta',
};

const MESSAGE_MEDIA_MESSAGES__items = (n: number) =>
  plural('ca', n, { one: '{n} element', other: '{n} elements' });

const AGENT_CREATOR_MESSAGES: Translations['AGENT_CREATOR_MESSAGES'] = {
  reaction: 'Reacció',
  working: 'Treballa',
  avatarStyle: 'Estil de l’avatar',
  proceduralAvatar: 'Avatar actual',
  betaPreset: 'Personatge predefinit (beta)',
  betaEyes: 'Estil dels ulls',
  eyewear: 'Ulleres',
  accessory: 'Accessori',
  characterOption: (_category, _id, title) => String(title),
  editor: 'Editor de l’agent',
  newBot: 'Bot nou',
  closeEditor: 'Tanca l’editor de l’agent',
  details: 'Aparença i detalls de l’agent',
  color: 'Color de l’avatar',
  customColor: 'Color personalitzat de l’avatar',
  name: 'Nom',
  label: 'Etiqueta',
  description: 'Descripció',
  nameInput: 'Nom de l’agent',
  labelInput: 'Etiqueta de l’agent',
  descriptionInput: 'Descripció de l’agent',
  labelPlaceholder: 'Gerent, màrqueting, pintor',
  descriptionPlaceholder: 'Detalls de l’agent',
  language: 'Idioma',
  languageInput: 'Idioma de l’agent',
  notifications: 'Notificacions',
  notificationsDescription: 'Mostra un avís quan la resposta estigui llesta.',
  notifyFinished: 'Avisa quan aquest agent acabi',
  voice: 'Veu',
  voiceInput: 'Veu de l’agent',
  previewVoice: 'Escolta la veu',
  savedVoice: 'Veu desada',
  systemVoice: 'Veu del sistema',
  off: 'Desactivada',
  playbackSpeed: 'Velocitat de reproducció',
  emotion: 'Emoció de l’agent',
  shape: 'Forma de l’avatar',
  hexColor: 'Color hexadecimal',
  hue: 'To',
  saturationBrightness: 'Saturació i brillantor',
  increaseBrightness: 'Augmenta la brillantor',
  decreaseBrightness: 'Redueix la brillantor',
  increaseHue: 'Augmenta el to',
  decreaseHue: 'Redueix el to',
  nextShape: 'Forma següent',
  previousShape: 'Forma anterior',
  newAgent: 'Agent nou',
  emotions: {
    neutral: 'Neutral',
    happy: 'Feliç',
    angry: 'Enfadat',
    thinking: 'Pensatiu',
    shook: 'Sorprès',
    curious: 'Curiós',
    wink: 'Picada d’ullet',
    sleepy: 'Adormit',
    sad: 'Trist',
    worried: 'Preocupat',
    skeptical: 'Escèptic',
    focused: 'Concentrat',
    excited: 'Entusiasmat',
    calm: 'Tranquil',
    shy: 'Tímid',
    confused: 'Confós',
  },
  shapes: {
    slender: 'Esvelta',
    pocket: 'Butxaca',
    petal: 'Pètal',
    flower: 'Flor',
    star: 'Estrella',
    heart: 'Cor',
    cloud: 'Núvol',
    diamond: 'Diamant',
    shield: 'Escut',
  },
  colors: {
    Blue: 'Blau',
    Teal: 'Verd blavós',
    Violet: 'Violeta',
    Pink: 'Rosa',
    Red: 'Vermell',
    Orange: 'Taronja',
    Cyan: 'Cian',
    Lime: 'Llima',
    Green: 'Verd',
  },
  languages: {
    auto: 'Detecció automàtica',
    en: 'Anglès',
    tr: 'Turc',
    es: 'Castellà',
    fr: 'Francès',
    de: 'Alemany',
    ja: 'Japonès',
    pt: 'Portuguès',
  },
  avatarColorLabel: (name) => 'Avatar {name}'.replace('{name}', name),
  shapeLabel: (name) => 'Forma {name}'.replace('{name}', name),
  silhouetteLabel: (name) => 'Silueta {name}'.replace('{name}', name),
  livePreview: (name) => '{name}, previsualització de l’avatar'.replace('{name}', name),
  saturationBrightnessValue: (s, v) =>
    'saturació {s}%, brillantor {v}%'.replace('{s}', String(s)).replace('{v}', String(v)),
  playbackSpeedLabel: (speed) =>
    'Velocitat de reproducció {speed} vegades'.replace('{speed}', String(speed)),
};

const COMMON_MESSAGES: Translations['COMMON_MESSAGES'] = {
  close: 'Tanca',
  dismiss: 'Descarta',
  back: 'Enrere',
  goBack: 'Torna enrere',
  loading: "S'està carregant",
  more: 'Més',
  moreOptions: 'Més opcions',
  moreActions: 'Més accions',
  progress: 'Progrés',
  stepOf: (step, total) => `Pas ${step} de ${total}`,
  labelFor: (label, subject) => `${label} de ${subject}`,
  tapToClose: 'Toca per tancar',
  cancel: 'Cancel·la',
  done: 'Fet',
  save: 'Desa',
  delete: 'Suprimeix',
  edit: 'Edita',
  remove: 'Treu',
  retry: 'Torna-ho a provar',
  search: 'Cerca',
  showMore: "Mostra'n més",
  showLess: "Mostra'n menys",
  next: 'Següent',
  previous: 'Anterior',
  open: 'Obre',
  menu: 'Menú',
  copy: 'Copia',
  copied: 'Copiat',
  send: 'Envia',
  clear: 'Esborra',
  seeAll: 'Mostra-ho tot',
  resizePanels: 'Canvia la mida dels taulers',
};

const SURFACES_MESSAGES: Translations['SURFACES_MESSAGES'] = { confirm: 'Confirma', ok: "D'acord" };

const CONTACT_CARD_MESSAGES: Translations['CONTACT_CARD_MESSAGES'] = {
  channels: {
    email: { action: 'Correu', name: (s) => `Envia un correu a ${s}` },
    phone: { action: 'Truca', name: (s) => `Truca a ${s}` },
    chat: { action: 'Missatge', name: (s) => `Envia un missatge a ${s}` },
    meeting: { action: 'Reunió', name: (s) => `Programa una reunió amb ${s}` },
    video: { action: 'Vídeo', name: (s) => `Inicia una videotrucada amb ${s}` },
    website: { action: 'Lloc web', name: (s) => `Obre el lloc web de ${s}` },
  },
  labelsFor: (name) => `Etiquetes de ${name}`,
  owner: 'Responsable',
};

const CHAT_LIST_MESSAGES: Translations['CHAT_LIST_MESSAGES'] = {
  item: {
    draft: 'Esborrany:',
    pinned: 'Fixat',
    muted: 'Silenciat',
    verified: 'Verificat',
    channel: 'Canal',
    bot: 'Bot',
    group: 'Grup',
  },
  search: { chat: 'Xats', message: 'Missatges', contact: 'Contactes', empty: 'Cap resultat' },
  list: 'Xats',
  emptyTitle: 'Encara no hi ha converses',
  emptyDescription: 'Comença un xat i apareixerà aquí.',
  searchResults: 'Resultats de la cerca',
  searchChats: 'Cerca xats',
  clearSearch: 'Esborra la cerca',
  newChat: 'Xat nou',
  archived: 'Arxivats',
  archivedName: (label, n) => `${label}, ${plural('ca', n, { one: '{n} xat', other: '{n} xats' })}`,
  folderName: (label, n) => `${label}, ${n} sense llegir`,
  stories: 'Històries',
  ownStory: 'La teva història',
  addStory: 'Afegeix a la teva història',
  storyOf: (name) => `Història de ${name}`,
};

const NOTE_CARD_MESSAGES: Translations['NOTE_CARD_MESSAGES'] = {
  pinned: 'Fixada',
  locked: 'Protegida',
  attachments: (n) => plural('ca', n, { one: '{n} fitxer adjunt', other: '{n} fitxers adjunts' }),
  select: 'Selecciona la nota',
  checklistDone: 'Fet',
  checklistTodo: 'Pendent',
  more: (n) => `${n} més`,
};

const DIALOG_MESSAGES: Translations['DIALOG_MESSAGES'] = {
  view: 'Vista',
  dismissDialog: 'Tanca el diàleg',
  dismissNamed: (label) => `Tanca ${label}`,
};

const ALERT_DIALOG_MESSAGES: Translations['ALERT_DIALOG_MESSAGES'] = {
  confirm: 'Confirma',
};

const SIDEBAR_MESSAGES: Translations['SIDEBAR_MESSAGES'] = {
  sidebar: 'Barra lateral',
  collapse: 'Redueix la barra lateral',
  expand: 'Amplia la barra lateral',
  close: 'Tanca la barra lateral',
  quickSearch: 'Cerca ràpida',
  searchPlaceholder: 'Cerca a la navegació…',
  searchPlaceholderCompact: 'Cerca...',
  filter: 'Filtra la navegació',
  clearSearch: 'Esborra la cerca de navegació',
  noResults: 'Cap resultat',
  mode: 'Mode',
  upgrade: 'Millora el pla',
  usersWithAccess: 'Usuaris amb accés',
  addUser: 'Afegeix un usuari',
  manage: 'Gestiona',
  accountMenu: 'Menú del compte',
  teamMenu: (team) => `Menú de ${team}`,
};

const FILE_SIZE_UNITS: Translations['FILE_SIZE_UNITS'] = {
  byte: 'B',
  kilobyte: 'kB',
  megabyte: 'MB',
  gigabyte: 'GB',
};

const CARD_FORM_MESSAGES: Translations['CARD_FORM_MESSAGES'] = {
  labels: {
    number: 'Número de targeta',
    expiry: 'Data de caducitat',
    securityCode: 'Codi de seguretat',
    name: 'Nom a la targeta',
    postcode: 'Codi postal',
    country: 'País',
  },
  selectCountry: 'Selecciona un país',
};

const CHAT_COMPOSER_MESSAGES: Translations['CHAT_COMPOSER_MESSAGES'] = {
  attach: 'Adjunta',
  emoji: 'Emoji',
  camera: 'Càmera',
  mic: 'Enregistra un missatge de veu',
  message: 'Missatge',
  enterHint: 'Retorn per enviar · Maj + Retorn per a una línia nova',
  modEnterHint: '⌘ + Retorn per enviar · Retorn per a una línia nova',
  cancelRecording: 'Cancel·la la gravació',
  sendVoice: 'Envia el missatge de veu',
  deleteRecording: 'Suprimeix la gravació',
  playRecording: 'Reprodueix la gravació',
  pauseRecording: 'Posa en pausa la gravació',
  lockRecording: 'Bloqueja la gravació',
  slideToCancel: 'Llisca per cancel·lar',
  recording: 'Enregistrant',
  searchEmoji: 'Cerca emojis',
  noEmoji: "No s'ha trobat cap emoji",
  frequentlyUsed: 'Més utilitzats',
  skinTone: 'To de pell',
  emojiPicker: "Selector d'emojis",
  moreReactions: 'Més reaccions',
  quickReactions: 'Reaccions ràpides',
  messageActions: 'Accions del missatge',
  attachments: 'Fitxers adjunts',
  removeAttachment: (name) => `Treu ${name}`,
  suggestions: { mention: 'Persones', command: 'Ordres', emoji: 'Emoji' },
  suggestionVerified: 'Verificat',
  searchingSuggestions: 'Cercant…',
  noSuggestions: {
    mention: "No s'ha trobat ningú",
    command: "No s'han trobat ordres",
    emoji: "No s'han trobat emojis",
  },
  attachmentItems: {
    gallery: 'Galeria',
    camera: 'Càmera',
    file: 'Fitxer',
    location: 'Ubicació',
    contact: 'Contacte',
    poll: 'Enquesta',
    music: 'Música',
  },
};

const MAIL_COMPOSE_MESSAGES: Translations['MAIL_COMPOSE_MESSAGES'] = {
  to: 'Per a',
  cc: 'A/c',
  bcc: 'C/o',
  subject: 'Assumpte',
  showCopies: 'A/c C/o',
  hideCopies: 'Amaga A/c i C/o',
  removeRecipient: (name) => `Treu ${name}`,
  suggestions: 'Contactes',
  send: COMMON_MESSAGES.send,
  sending: "S'està enviant",
  attach: 'Adjunta un fitxer',
  discard: "Descarta l'esborrany",
  minimize: 'Minimitza',
  expand: 'Amplia',
  close: COMMON_MESSAGES.close,
  title: 'Missatge nou',
};

const MEDIA_PLAYER_MESSAGES: Translations['MEDIA_PLAYER_MESSAGES'] = {
  lyrics: 'Lletra',
  queue: 'Cua',
  devices: 'Connecta a un dispositiu',
  fullscreen: 'Pantalla completa',
  openPlayer: 'Obre el reproductor',
  currentDevice: 'Dispositiu actual',
  listeningOn: 'Escoltant a',
  listeningOnDevice: (d) => `Escoltant a ${d}`,
  selectDevice: 'Selecciona un dispositiu',
  noDevices: "No s'han trobat altres dispositius",
  deviceHelp: 'No veus el teu dispositiu?',
  playbackSpeed: 'Velocitat de reproducció',
  sleepTimer: 'Temporitzador',
  sleepOff: 'Desactivat',
  endOfEpisode: "Final de l'episodi",
  oneHour: '1 hora',
  minutes: (n) => plural('ca', n, { one: '{n} minut', other: '{n} minuts' }),
  stopsIn: (r) => `S'atura d'aquí a ${r}`,
  shuffle: 'Aleatori',
  repeat: 'Repeteix',
  repeatOne: 'Repeteix-ne una',
  skipBack: (n) => plural('ca', n, { one: 'Enrere {n} segon', other: 'Enrere {n} segons' }),
  skipForward: (n) => plural('ca', n, { one: 'Endavant {n} segon', other: 'Endavant {n} segons' }),
  closePlayer: 'Tanca el reproductor',
  share: 'Comparteix',
  showLyrics: 'Mostra la lletra',
};

const ADDRESS_MESSAGES: Translations['ADDRESS_MESSAGES'] = {
  emptyTitle: 'Encara no hi ha res',
  addresses: 'Adreces',
};

const CREATOR_STUDIO_MESSAGES: Translations['CREATOR_STUDIO_MESSAGES'] = {
  releaseTypes: { single: 'Senzill', ep: 'EP', album: 'Àlbum' },
  releaseStatuses: {
    draft: 'Esborrany',
    'in-review': 'En revisió',
    scheduled: 'Programat',
    live: 'Publicat',
    rejected: 'Rebutjat',
    takedown: 'Retirat',
  },
  creditRoles: {
    songwriter: 'Autor',
    producer: 'Productor',
    composer: 'Compositor',
    performer: 'Intèrpret',
    lyricist: 'Lletrista',
    'mixing-engineer': 'Enginyer de mescla',
    'mastering-engineer': 'Enginyer de masterització',
  },
  periods: { '7d': '7 dies', '28d': '28 dies', '12m': '12 mesos', all: 'Tot' },
  artworkNotSquare: (w, h) => `La portada ha de ser quadrada: aquesta imatge fa ${w}×${h} px.`,
  artworkTooSmall: (w, h, min) =>
    `La portada és massa petita (${w}×${h} px). Puja'n una d'almenys ${min}×${min} px.`,
  audience: { title: 'Audiència', period: 'Període' },
  breakdown: {
    locations: 'Ubicacions principals',
    cities: 'Ciutats',
    countries: 'Països',
    age: 'Edat',
    gender: 'Gènere',
    sources: "Fonts d'escolta",
    metric: 'Oients',
  },
  streams: {
    metrics: 'Mètrica del gràfic',
    summary: (metric, releases) =>
      releases
        ? `${metric} al llarg del temps; llançaments: ${releases}`
        : `${metric} al llarg del temps`,
  },
  topTracks: {
    title: 'Cançons principals',
    rank: '#',
    rankName: 'Posició',
    track: 'Cançó',
    streams: 'Reproduccions',
    listeners: 'Oients',
    saves: 'Desats',
    trend: 'Tendència',
    trends: { up: "A l'alça", down: 'A la baixa', flat: 'Estable', new: 'Nova entrada' },
    newBadge: 'Nova',
    empty: 'Encara no hi ha reproduccions en aquest període.',
  },
  tracks: (n) => plural('ca', n, { one: '{n} cançó', other: '{n} cançons' }),
  timeline: {
    states: {
      complete: 'completat',
      current: 'en curs',
      upcoming: 'no començat',
      error: 'requereix atenció',
    },
    label: 'Progrés del llançament',
  },
  upload: {
    queued: 'A la cua',
    processing: 'Transcodificant…',
    ready: 'A punt',
    failed: "No s'ha pogut pujar",
    remove: (name) => `Treu ${name}`,
    progress: (name) => `Pujant ${name}`,
  },
  artwork: {
    title: 'Portada',
    requirements: '3000×3000 px, JPG o PNG',
    replace: 'Substitueix',
    remove: 'Treu la portada',
    preview: 'Portada del llançament',
    upload: 'Puja la portada',
  },
  credits: {
    title: 'Crèdits',
    role: 'Rol',
    name: 'Nom',
    add: 'Afegeix un crèdit',
    remove: (index, name) =>
      name ? `Treu el crèdit ${index + 1}, ${name}` : `Treu el crèdit ${index + 1}`,
    empty: "Acredita els autors, productors i intèrprets d'aquesta cançó.",
    field: (field, n) => `${field}, crèdit ${n}`,
  },
  artists: {
    add: 'Afegeix',
    addTo: (label) => `Afegeix: ${label}`,
    remove: (name) => `Treu ${name}`,
  },
  isrc: { hint: 'Format: CC-XXX-YY-NNNNN', invalid: 'No és un ISRC vàlid' },
  metadata: {
    title: 'Títol de la cançó',
    version: 'Versió',
    versionPlaceholder: 'Remix, en directe, acústica…',
    explicit: 'Lletra explícita',
    explicitDescription: 'Activa-ho si la cançó conté llenguatge fort o temes explícits.',
    genre: 'Gènere',
    genrePlaceholder: 'Tria un gènere',
    primaryArtists: 'Artistes principals',
    featuredArtists: 'Artistes convidats',
    artistPlaceholder: "Afegeix el nom d'un artista",
    language: 'Idioma de la lletra',
    languagePlaceholder: 'Tria un idioma',
    lyrics: 'Lletra',
    lyricsPlaceholder: 'Enganxa la lletra, una línia per cada vers cantat',
  },
  payout: {
    estimated: "Ingressos estimats d'aquest mes",
    lastPayout: 'Últim pagament',
    nextPayout: 'Pròxim pagament',
    statements: 'Mostra els extractes',
    chart: 'Ingressos mensuals',
  },
  pitch: {
    title: 'Proposta als editors',
    description: "Explica a l'equip editorial el teu pròxim llançament abans que surti.",
    release: 'Llançament',
    releasePlaceholder: 'Tria un pròxim llançament',
    moods: "Estat d'ànim",
    genres: 'Gènere',
    pitch: 'La teva proposta',
    pitchPlaceholder:
      'Què fa especial aquest llançament? Per a qui és i quina història hi ha al darrere?',
    submit: 'Envia la proposta',
    tagLimit: (max) => `Tria'n fins a ${max}`,
    statuses: {
      submitted: 'Proposta enviada',
      accepted: 'Seleccionada per a revisió',
      declined: 'No seleccionada aquesta vegada',
    },
    statusDescriptions: {
      submitted:
        'Els editors llegeixen totes les propostes. Rebràs resposta abans de la data de llançament.',
      accepted: "El teu llançament s'està considerant per a llistes editorials.",
      declined:
        "Aquest llançament no s'ha seleccionat. Podràs proposar el següent tan aviat com estigui programat.",
    },
    edit: 'Edita la proposta',
  },
};

const PROPERTY_INSIGHTS_MESSAGES: Translations['PROPERTY_INSIGHTS_MESSAGES'] = {
  energy: 'Energia',
  pending: 'Pendent',
  energyRatingClass: (r) => `Qualificació energètica ${r}`,
  energyRatingStatus: (s) => `Qualificació energètica ${String(s).toLowerCase()}`,
  energyRating: 'Qualificació energètica',
  certificateInProgress: 'Certificat en tràmit',
  consumption: 'Consum',
  emissions: 'Emissions',
  moreEfficient: 'Més eficient',
  lessEfficient: 'Menys eficient',
  walkTime: (t) => `${t} a peu`,
  scoreOutOf: (d, m) => `${d} de ${m}`,
  pricePerSquareMetre: 'Preu per metre quadrat',
  rentHistory: 'Historial de lloguer',
  rentHistoryEmpty: 'Encara no hi ha historial d’aquest habitatge',
  confidence: { low: 'Confiança baixa', medium: 'Confiança mitjana', high: 'Confiança alta' },
  aboveEstimate: (p) => `${p} per sobre de l’estimació`,
  belowEstimate: (p) => `${p} per sota de l’estimació`,
  fairPrice: 'Preu just',
  estimatedPrice: 'Preu estimat',
  asking: 'Preu demanat',
  noVerdict: 'No hi ha prou dades per valorar-ho',
  whyThisEstimate: 'Per què aquesta estimació',
  comparables: (n) =>
    plural('ca', n, {
      one: 'Basat en {n} habitatge comparable',
      other: 'Basat en {n} habitatges comparables',
    }),
  currentPrice: 'Preu actual',
  now: 'Ara',
  noPriceHistory: 'Encara no hi ha historial de preus',
  priceHistoryPeriod: 'Període de l’historial de preus',
  priceHistory: 'Historial de preus',
  priceHistoryTrend: (head, a, aw, b, bw) => `${head}: de ${a} (${aw}) a ${b} (${bw}).`,
};

const MAP_MARKER_MESSAGES: Translations['MAP_MARKER_MESSAGES'] = {
  searchAsMapMoves: 'Cerca en moure el mapa',
  searchThisArea: 'Cerca en aquesta zona',
  stays: (n) => mapMarker_countOf('ca', n, { one: '{n} allotjament', other: '{n} allotjaments' }),
};

const LISTING_ACTIONS_MESSAGES: Translations['LISTING_ACTIONS_MESSAGES'] = {
  month: 'mes',
  rentalStatus: { available: 'Disponible', reserved: 'Reservat', rented: 'Llogat' },
  rentalStatusMessage: {
    reserved: 'Un altre sol·licitant està tancant un contracte. Les visites noves estan en pausa.',
    rented: 'Aquest habitatge ja està llogat i no admet més sol·licituds.',
  },
  saleStatus: { available: 'En venda', reserved: 'Reservat', sold: 'Venut' },
  saleStatusMessage: {
    reserved: 'S’ha acceptat una oferta. L’agent no organitza visites de moment.',
    sold: 'Aquest habitatge ja s’ha venut.',
  },
  requestViewing: 'Sol·licita una visita',
  apply: 'Presenta la sol·licitud',
  contactAgent: 'Contacta amb l’agent',
  requestVisit: 'Sol·licita una visita',
  makeOffer: 'Fes una oferta',
  yourHome: 'Casa teva',
  theirHome: 'Casa seva',
  dates: 'Dates',
  guests: 'Hostes',
  addDates: 'Afegeix dates',
  addGuests: 'Afegeix hostes',
  proposeSwap: 'Proposa un intercanvi',
  exchangeModes: { swap: 'Intercanvi recíproc', host: 'Punts d’hoste', both: 'Qualsevol' },
  scheduleViewing: 'Programa una visita',
  noTimesLeft: 'No queden hores disponibles aquest dia',
  noteForLandlord: 'Nota per al propietari',
  day: 'Dia',
  time: 'Hora',
  submitViewing: 'Sol·licita la visita',
  inPerson: 'En persona',
  videoCall: 'Videotrucada',
  viewingType: 'Tipus de visita',
  yourApplication: 'La teva sol·licitud',
  applicationProgress: 'Progrés de la sol·licitud',
  progressReady: (done, total) => `${done} de ${total} a punt`,
  applicationStatus: {
    missing: 'Falta',
    uploaded: 'En revisió',
    verified: 'Verificat',
    rejected: 'Rebutjat',
  },
  applicationAction: { upload: 'Puja', view: 'Mostra', replace: 'Substitueix' },
  itemAction: (action, title) => `${action}: ${title}`,
  mortgage: {
    title: 'Calculadora d’hipoteca',
    price: 'Preu de l’habitatge',
    downPayment: 'Entrada',
    downPaymentPercent: 'Percentatge d’entrada',
    percent: 'Percentatge',
    term: 'Termini del préstec',
    years: 'anys',
    rate: 'Tipus d’interès',
    monthlyPayment: 'Quota mensual',
    principal: 'Capital',
    interest: 'Interessos',
    loanAmount: 'Import del préstec',
    totalInterest: 'Interessos totals',
    totalCost: 'Cost total',
  },
  termYears: (n) => plural('ca', n, { one: '{n} any', other: '{n} anys' }),
  mortgageDisclaimer:
    'És una estimació, no una oferta. No inclou comissions, impostos ni assegurances, i suposa un tipus fix durant tot el termini.',
};

const AGENT_PROGRESS_MESSAGES: Translations['AGENT_PROGRESS_MESSAGES'] = {
  stepsLeft: (n) => plural('ca', n, { one: 'Queda {n} pas', other: 'Queden {n} passos' }),
  allCompleted: 'Tots els passos completats',
  minimize: 'Minimitza els passos',
  expand: 'Desplega els passos',
  defaultSteps: [
    'Llegir els fitxers del projecte',
    'Actualitzar i instal·lar els tokens del mode clar',
    'Implementar els tokens del mode fosc',
    'Afegir un selector de tema reutilitzable i registrat',
    'Executar el registre, el lint i la compilació de producció',
  ],
};

const CALENDAR_MESSAGES: Translations['CALENDAR_MESSAGES'] = {
  newEvent: 'Esdeveniment nou',
  openNavigation: 'Obre la navegació',
  month: 'Mes',
  moreEvents: (n) => plural('ca', n, { other: '+{n} més' }),
  eventDetails: "Detalls de l'esdeveniment",
  join: "Uneix-t'hi",
  editTimeZone: 'Edita la zona horària',
  participants: 'Participants',
  editParticipants: 'Edita els participants',
  reminders: 'Recordatoris',
  editReminders: 'Edita els recordatoris',
  duration: calendar_compactDuration(' h', ' min', ' '),
  jumpToDate: 'Ves a una data',
  previousMonth: 'Mes anterior',
  nextMonth: 'Mes següent',
  chooseDate: (month) => `${month}, tria una data`,
  inbox: "Safata d'entrada",
  inboxMenu: "Menú de la safata d'entrada",
  addAccount: 'Afegeix un altre compte',
};

const LISTING_DETAILS_MESSAGES: Translations['LISTING_DETAILS_MESSAGES'] = {
  ratedOutOf5: (r) => `Valoració: ${r} de 5`,
  overallRating: 'Valoració general',
  unavailable: 'No disponible',
  showAllAmenities: (n) =>
    plural('ca', n, { one: 'Mostra {n} servei', other: 'Mostra els {n} serveis' }),
  showAllFeatures: (n) =>
    plural('ca', n, { one: 'Mostra {n} característica', other: 'Mostra les {n} característiques' }),
  propertyFeatures: 'Característiques de l’immoble',
  showAllPhotos: 'Mostra totes les fotos',
  listingPhotos: 'Fotos de l’anunci',
  photoOf: (p, t) => `Foto ${p} de ${t}`,
  photoWithAlt: (a, p, t) => `${a}, foto ${p} de ${t}`,
  floorPlanOf: (a, p, t) => `${a}, plànol ${p} de ${t}`,
  landlord: 'Propietari',
  agent: 'Agent immobiliari',
  agency: 'Agència',
  activeListings: (n) => plural('ca', n, { one: '{n} anunci actiu', other: '{n} anuncis actius' }),
  verified: 'Verificat',
  showPhone: 'Mostra el telèfon',
  call: 'Truca',
  messageHost: 'Escriu a l’amfitrió',
  message: 'Envia un missatge',
};

const PRICE_BREAKDOWN_MESSAGES: Translations['PRICE_BREAKDOWN_MESSAGES'] = {
  states: { estimated: 'Estimat', pending: 'Pendent' },
  showDetails: 'Mostra els detalls del preu',
  hideDetails: 'Amaga els detalls del preu',
  breakdown: 'Desglossament del preu',
  about: (label) => `Quant a ${label}`,
};

const DATE_PICKER_MESSAGES: Translations['DATE_PICKER_MESSAGES'] = {
  cancel: 'Cancel·la',
  apply: 'Aplica',
  previousMonth: 'Mes anterior',
  nextMonth: 'Mes següent',
  datePlaceholder: 'Selecciona una data',
  dateLabel: 'Data',
  rangePlaceholder: 'Selecciona un interval de dates',
  rangeLabel: 'Interval de dates',
  startDate: "Data d'inici",
  endDate: 'Data de fi',
  daysSelected: (n) =>
    plural('ca', n, { one: '{n} dia seleccionat', other: '{n} dies seleccionats' }),
  presets: {
    today: 'Avui',
    yesterday: 'Ahir',
    lastWeek: 'La setmana passada',
    thisMonth: 'Aquest mes',
    lastMonth: 'El mes passat',
    thisYear: 'Aquest any',
    lastYear: "L'any passat",
    allTime: 'Tot',
  },
  meetingTrigger: 'Programa una reunió',
  meetingLabel: 'Programar reunió',
  send: 'Envia la invitació',
  selectTime: 'Selecciona una hora',
  duration: (n) => plural('ca', n, { one: '{n} minut', other: '{n} minuts' }),
};

const SHIPMENT_REQUEST_MESSAGES: Translations['SHIPMENT_REQUEST_MESSAGES'] = {
  kinds: {
    envelope: { label: 'Sobre', description: 'Documents, claus, qualsevol cosa plana.' },
    parcel: { label: 'Paquet', description: 'Una caixa o bossa que pugui portar una persona.' },
    furniture: {
      label: 'Mobles',
      description: 'Un sofà, una taula, un matalàs: dues persones a cada punt.',
    },
    pallet: { label: 'Palet', description: 'Embalat i apilat, amb plataforma elevadora.' },
    food: { label: 'Menjar', description: 'Una comanda de restaurant, a la temperatura adequada.' },
  },
  sizes: {
    small: 'Fins a una capsa de sabates: 35 × 25 × 20 cm.',
    medium: 'Fins a una maleta de cabina: 55 × 40 × 25 cm.',
    large: 'Fins a una rentadora: 85 × 60 × 60 cm.',
    extraLarge: 'Més gran: explica-ho a les notes.',
  },
  access: { ground: 'Planta baixa', stairs: 'Escales', lift: 'Ascensor' },
  load: {
    kind: 'Què transportem?',
    size: 'Mida',
    weight: 'Pes',
    quantity: 'Quantitat',
    quantityValue: (n) => plural('ca', n, { one: '{n} article', other: '{n} articles' }),
    notes: 'Alguna cosa més que hagi de saber el transportista?',
    notesPlaceholder: "Fràgil, un codi d'ascensor, on deixar-ho…",
  },
  options: {
    extras: 'Extres',
    access: 'Accés a origen i destinació',
    window: "Quan s'ha de recollir?",
  },
  form: {
    route: 'Recorregut',
    routeDescription: 'Primer la recollida, al final el lliurament.',
    load: 'La càrrega',
    photos: 'Fotos',
    photosDescription: 'Una foto de la càrrega és el que més millora els pressupostos que rebràs.',
    options: 'Opcions',
    optionsDescription: 'Cadascuna canvia el preu.',
    price: 'Preu',
  },
  shipmentRequest: "Sol·licitud d'enviament",
};

const LABEL_MESSAGES: Translations['LABEL_MESSAGES'] = { required: 'obligatori' };

const CHECKOUT_SUMMARY_MESSAGES: Translations['CHECKOUT_SUMMARY_MESSAGES'] = {
  title: 'Revisa la comanda',
  orderSummary: 'Resum de la comanda',
  deliverTo: 'Entregar a',
  notChosen: 'Encara no triat',
  opensPicker: 'Obre el selector',
  placeOrder: 'Fes la comanda',
  placingOrder: 'Fent la comanda',
};

const VEHICLE_PICKER_MESSAGES: Translations['VEHICLE_PICKER_MESSAGES'] = {
  from: 'Des de',
  fits: (label) => `Què hi cap: ${label}`,
  unavailable: 'No disponible per a aquesta càrrega',
  vehicle: 'Vehicle',
  vehicles: {
    bike: {
      label: 'Bicicleta de càrrega',
      capacity: 'Fins a 25 kg · 60 × 40 × 40 cm',
      fits: ['Documents', 'Una comanda de menjar', 'Una caixa petita'],
    },
    car: {
      label: 'Cotxe',
      capacity: 'Fins a 150 kg · 100 × 80 × 60 cm',
      fits: ['Dues maletes', 'Quatre caixes', 'Una bicicleta'],
    },
    van: {
      label: 'Furgoneta',
      capacity: 'Fins a 800 kg · 240 × 150 × 140 cm',
      fits: ['Un sofà', "La mudança d'un estudi", 'Mig palet'],
    },
    boxTruck: {
      label: 'Camió caixa',
      capacity: 'Fins a 3.500 kg · 420 × 200 × 210 cm',
      fits: ['Dos palets', "La mudança d'un pis de dues habitacions", 'Una plataforma elevadora'],
    },
    refrigerated: {
      label: 'Furgoneta frigorífica',
      capacity: 'Fins a 700 kg · entre 2 i 8 °C',
      fits: ['Productes frescos', 'Càtering refrigerat', 'Flors'],
    },
  },
};

const COMPOSER_PANEL_MESSAGES: Translations['COMPOSER_PANEL_MESSAGES'] = {
  message: 'Missatge',
  add: 'Afegeix un fitxer adjunt',
  addMenu: 'Afegeix al xat',
  permissions: 'Permisos',
  permissionMode: 'Mode de permisos',
  learnMore: 'Més informació',
  voice: 'Entrada de veu',
  send: 'Envia el missatge',
  stop: 'Atura la generació',
  permissionTrigger: (mode) => `Permisos: ${mode}`,
  removeFile: (name) => `Treu ${name}`,
  retryFile: (name) => `Torna a provar ${name}`,
  panelPlaceholder: 'Hola, què necessites avui?',
  pillPlaceholder: "Pregunta'm el que vulguis",
  pillCompactPlaceholder: "Pregunta'm",
  modelSettings: 'Configuració del model',
  models: 'Models',
  modelGroup: 'Model',
  effort: 'Esforç',
  effortAuto: 'Automàtic',
  faster: 'Més ràpid',
  smarter: 'Més intel·ligent',
  quickSearch: 'Cerca ràpida',
  searchModels: 'Cerca models',
  closeSearch: 'Tanca la cerca',
  noMatches: 'Cap model coincideix',
  providers: 'Proveïdors',
  matchingModels: 'Models coincidents',
  providerModels: (provider) => `Models de ${provider}`,
  localFolders: 'Carpetes locals',
  context: (percent) => `Context ${percent} %`,
  effortLevels: ['Baix', 'Mitjà', 'Equilibrat', 'Alt', 'Molt alt', 'Màxim'],
  permissionModes: {
    auto: { label: 'Automàtic', description: "L'agent decideix per si mateix" },
    manual: { label: 'Manual', description: 'Pregunta sempre abans de fer un canvi' },
    plan: { label: 'Mode pla', description: 'Crea un pla abans de continuar' },
    bypass: { label: 'Omet-ho tot', description: "L'agent gestiona els permisos" },
  },
  addMenuRows: {
    add: 'Afegeix',
    plugins: 'Complements',
    files: 'Fitxers i carpetes',
    goal: 'Objectiu',
    goalDescription: 'Fixa un objectiu per obtenir resultats abans',
    plan: 'Mode pla',
    planDescription: 'Gestiona tasques complexes',
    documents: 'Documents',
    documentsDescription: 'Crea i edita documents',
    spreadsheets: 'Fulls de càlcul',
    spreadsheetsDescription: 'Genera fulls de càlcul',
    presentations: 'Presentacions',
    presentationsDescription: 'Crea material de màrqueting',
    code: 'Blocs de codi',
    codeDescription: 'Escriu i edita codi existent',
  },
};

const MESSAGE_BUBBLE_MESSAGES: Translations['MESSAGE_BUBBLE_MESSAGES'] = {
  forwardedFrom: (name) => `Reenviat de ${name}`,
  deleted: "S'ha suprimit aquest missatge",
  retry: "Torna a provar d'enviar",
  addReaction: 'Afegeix una reacció',
  replyTo: 'Vés al missatge citat',
  selected: 'Seleccionat',
  pending: "S'està enviant",
  failed: 'No enviat',
  reactionSelected: 'seleccionada',
  unread: 'Missatges no llegits',
  typing: 'Escrivint…',
};

const PAYMENT_STATUS_MESSAGES: Translations['PAYMENT_STATUS_MESSAGES'] = {
  states: {
    authorising: 'Autoritzant',
    paid: 'Pagat',
    failed: 'El pagament ha fallat',
    refunded: 'Reemborsat',
    pending: 'Pagament pendent',
  },
  reference: 'Referència',
};

const AVATAR_MESSAGES: Translations['AVATAR_MESSAGES'] = { live: 'DIRECTE' };

const PLACE_CARD_MESSAGES: Translations['PLACE_CARD_MESSAGES'] = {
  openStates: {
    open: 'Obert',
    'closing-soon': 'Tanca aviat',
    closed: 'Tancat',
    'opening-soon': 'Obre aviat',
  },
  new: 'Nou',
  actions: 'Accions',
  actionsFor: (name) => `Accions de ${name}`,
  rated: (value, reviews) =>
    placeCard_withReviews(
      `Valoració de ${value} sobre 5`,
      reviews === undefined
        ? undefined
        : placeCard_countOf('ca', reviews, { one: '{n} ressenya', other: '{n} ressenyes' }),
    ),
};

const SOCIAL_BUTTON_MESSAGES: Translations['SOCIAL_BUTTON_MESSAGES'] = {
  actions: {
    continue: (b) => `Continua amb ${b}`,
    signIn: (b) => `Inicia la sessió amb ${b}`,
    signUp: (b) => `Registra't amb ${b}`,
  },
};

const QUESTIONNAIRE_MESSAGES: Translations['QUESTIONNAIRE_MESSAGES'] = {
  other: 'Una altra',
  otherPlaceholder: 'Escriu aquí la teva resposta',
  steps: 'Passos',
  step: (n) => `Pas ${n}`,
};

const MAP_CONTROLS_MESSAGES: Translations['MAP_CONTROLS_MESSAGES'] = {
  group: 'Controls del mapa',
  locate: 'Mostra la meva ubicació',
  following: 'Deixa de seguir la meva ubicació',
  zoomIn: 'Apropa',
  zoomOut: 'Allunya',
  zoom: 'Zoom',
  tilt: 'Inclina el mapa',
  tiltOff: 'Aplana el mapa',
  compass: (degrees) => `Orientat a ${degrees} graus. Restableix al nord`,
  layerTrigger: 'Capes del mapa',
  layers: 'Mapa',
  overlays: 'Capes superposades',
};

const PAYMENT_METHOD_MESSAGES: Translations['PAYMENT_METHOD_MESSAGES'] = {
  states: { expired: 'Caducada', declined: 'Rebutjada' },
  default: 'Predeterminada',
  add: 'Afegeix un mètode de pagament',
  emptyTitle: 'No hi ha mètodes de pagament desats',
  paymentMethods: 'Mètodes de pagament',
};

const AVATAR_GROUP_MESSAGES: Translations['AVATAR_GROUP_MESSAGES'] = {
  more: (n) => plural('ca', n, { one: '{n} persona més', other: '{n} persones més' }),
  profile: 'Perfil',
};

const MENUBAR_MESSAGES: Translations['MENUBAR_MESSAGES'] = {
  menuBar: 'Barra de menús',
};

const AGENT_THINKING_MESSAGES: Translations['AGENT_THINKING_MESSAGES'] = { thinking: 'Pensant' };

const AI_CHAT_MESSAGES: Translations['AI_CHAT_MESSAGES'] = {
  feedback: {
    like: 'Bona resposta',
    dislike: 'Mala resposta',
    copy: 'Copia la resposta',
    copied: 'Copiat!',
  },
  imageGeneration: {
    generated: 'Imatge generada',
    generating: "S'està generant la imatge",
    remaining: (n) => plural('ca', n, { one: 'Queda {n} segon', other: 'Queden {n} segons' }),
    likeToast: 'Gràcies pels comentaris',
    dislikeToast: 'Gràcies, ho farem servir per millorar',
  },
  generatedImage: (alt) => `Imatge generada: ${alt}`,
  codePanel: {
    changes: 'Canvis',
    browser: 'Navegador',
    uncommitted: (n) =>
      plural('ca', n, { one: '{n} canvi sense confirmar', other: '{n} canvis sense confirmar' }),
    undo: 'Desfés els canvis',
    browserPreview: 'Previsualització del navegador',
  },
  galleryPanel: {
    gallery: 'Galeria',
    styles: 'Estils',
    stylePresets: 'Estils predefinits',
    enlarge: (prompt) => `Amplia ${prompt}`,
    minimize: (prompt) => `Redueix ${prompt}`,
    download: (prompt) => `Baixa ${prompt}`,
  },
  panelView: 'Vista del tauler',
  openTerminal: 'Obre el terminal',
  newGeneration: 'Nova generació',
  expandPanel: 'Amplia el tauler',
  togglePanel: 'Mostra o amaga el tauler',
  container: { breadcrumb: 'Ubicació del xat', share: 'Comparteix el xat' },
  shell: {
    openNavigation: 'Obre la navegació',
    closeNavigation: 'Tanca la navegació',
    openPanel: (panel) => `Obre ${String(panel).toLowerCase()}`,
    closePanel: (panel) => `Tanca ${String(panel).toLowerCase()}`,
  },
  code: 'Codi',
};

const COMMAND_MESSAGES: Translations['COMMAND_MESSAGES'] = {
  placeholder: 'Escriu una ordre o cerca…',
  empty: "No s'ha trobat cap resultat.",
  palette: "Paleta d'ordres",
  clearSearch: 'Esborra la cerca',
};

const MUSIC_LIBRARY_MESSAGES: Translations['MUSIC_LIBRARY_MESSAGES'] = {
  kinds: {
    playlist: 'Llista',
    artist: 'Artista',
    album: 'Àlbum',
    podcast: 'Pòdcast',
    audiobook: 'Audiollibre',
    folder: 'Carpeta',
  },
  library: {
    title: 'La teva biblioteca',
    create: 'Crea una llista o una carpeta',
    collapseRail: 'Redueix La teva biblioteca',
    expandRail: 'Obre La teva biblioteca',
    filters: 'Filtres',
    clearFilters: 'Esborra els filtres',
    filter: {
      playlists: 'Llistes',
      artists: 'Artistes',
      albums: 'Àlbums',
      podcasts: 'Pòdcasts',
      audiobooks: 'Audiollibres',
    },
    downloaded: 'Baixat',
    search: 'Cerca a La teva biblioteca',
    searchPlaceholder: 'Cerca a La teva biblioteca',
    clearSearch: 'Esborra la cerca',
    sortAndView: 'Ordena i visualitza',
    sortBy: 'Ordena per',
    viewAs: 'Visualitza com a',
    sort: {
      recents: 'Recents',
      'recently-added': 'Afegits recentment',
      alphabetical: 'Ordre alfabètic',
      creator: 'Creador',
    },
    view: { compact: 'Compacta', list: 'Llista', grid: 'Quadrícula' },
    empty: 'Encara no hi ha res aquí',
  },
  item: { pinned: 'Fixat', downloaded: 'Baixat', nowPlaying: "S'està reproduint" },
  search: { placeholder: 'Què vols escoltar?', clear: 'Esborra la cerca', browse: 'Explora' },
  resultTypes: 'Tipus de resultat',
  topResultKinds: {
    song: 'Cançó',
    artist: 'Artista',
    album: 'Àlbum',
    playlist: 'Llista',
    podcast: 'Pòdcast',
    episode: 'Episodi',
    audiobook: 'Audiollibre',
    profile: 'Perfil',
  },
  recent: {
    title: 'Cerques recents',
    clearAll: 'Esborra les cerques recents',
    remove: (title) => `Treu ${title}`,
  },
};

const LISTING_CARD_MESSAGES: Translations['LISTING_CARD_MESSAGES'] = {
  statuses: { reserved: 'Reservat', sold: 'Venut', rented: 'Llogat', unavailable: 'No disponible' },
  originally: (p) => `abans ${p}`,
  approximateLocation: 'Ubicació aproximada',
  rated: (r) => `Valoració: ${r} de 5`,
  ratedWithReviews: (r, c) =>
    plural('ca', c, {
      one: `Valoració: ${r} de 5, ${c} ressenya`,
      other: `Valoració: ${r} de 5, ${c} ressenyes`,
    }),
  newListing: 'Nou',
  previousPhoto: 'Foto anterior',
  nextPhoto: 'Foto següent',
  saveToWishlist: 'Desa a preferits',
  removeFromWishlist: 'Treu de preferits',
};

const NAVIGATION_BANNER_MESSAGES: Translations['NAVIGATION_BANNER_MESSAGES'] = {
  states: { 'off-route': 'Fora de la ruta', rerouting: "S'està cercant una ruta nova" },
  thenLine: (street, maneuver) =>
    navigationBanner_words('després', navigationBanner_midSentence(maneuver), street),
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
};

const LOCATION_PUCK_MESSAGES: Translations['LOCATION_PUCK_MESSAGES'] = {
  states: {
    locating: "S'està cercant la teva ubicació",
    located: 'La teva ubicació',
    stale: 'La teva darrera ubicació coneguda',
  },
  facing: (state, degrees) => `${state}, orientat a ${degrees} graus`,
};

const CAROUSEL_MESSAGES: Translations['CAROUSEL_MESSAGES'] = {
  previousSlide: 'Diapositiva anterior',
  nextSlide: 'Diapositiva següent',
  goToSlide: (n) => `Ves a la diapositiva ${n}`,
  slideOf: (at, of) => `${at} de ${of}`,
  carouselRole: 'carrusel',
  slideRole: 'diapositiva',
};

const ORDER_STATUS_MESSAGES: Translations['ORDER_STATUS_MESSAGES'] = {
  states: { current: 'En curs', upcoming: 'Pendent', failed: 'Fallit' },
  status: 'Estat',
};

const RATING_MESSAGES: Translations['RATING_MESSAGES'] = {
  newRating: 'Nou',
  reviews: (c) => rating_countForms('ca', c, { one: '{n} ressenya', other: '{n} ressenyes' }),
  rated: (v) => `Valoració: ${v} de 5`,
  ratedWithReviews: (v, r) => `Valoració: ${v} de 5, ${r}`,
  star: (n) => plural('ca', n, { one: '{n} estrella', other: '{n} estrelles' }),
};

const LISTING_EDITOR_MESSAGES: Translations['LISTING_EDITOR_MESSAGES'] = {
  offering: {
    rent: { title: 'De lloguer', description: 'Lloguer de llarga durada, amb preu mensual.' },
    sale: { title: 'En venda', description: "Ven l'habitatge en propietat." },
    stay: { title: 'Lloguer vacacional', description: 'Estades curtes, amb preu per nit.' },
    swap: {
      title: 'Intercanvi de casa',
      description: 'Intercanvia la teva casa amb altres membres.',
    },
    monthlyRent: 'Lloguer mensual',
    deposit: 'Fiança',
    depositOption: (months) =>
      months === 0 ? 'Cap' : plural('ca', months, { one: '{n} mes', other: '{n} mesos' }),
    availableFrom: 'Disponible des de',
    minimumStay: 'Estada mínima',
    months: (months) => plural('ca', months, { one: '{n} mes', other: '{n} mesos' }),
    askingPrice: 'Preu de venda',
    pricePerArea: 'Preu per m²',
    pricePerAreaEmpty: 'Afegeix un preu',
    nightlyRate: 'Preu per nit',
    cleaningFee: 'Tarifa de neteja',
    minimumNights: 'Nits mínimes',
    nights: (nights) => plural('ca', nights, { one: '{n} nit', other: '{n} nits' }),
    swapMode: "Com vols fer l'intercanvi?",
    swapModes: { swap: 'Intercanviar cases', host: 'Només allotjar', both: 'Qualsevol' },
    group: "Com s'ofereix l'habitatge?",
  },
  propertyTypes: {
    apartment: 'Pis',
    house: 'Casa',
    room: 'Habitació',
    studio: 'Estudi',
    duplex: 'Dúplex',
    penthouse: 'Àtic',
    coliving: 'Coliving',
    hostel: 'Alberg',
    other: 'Altres',
  },
  propertyType: "Tipus d'immoble",
  addressPrecision: {
    exact: {
      title: 'Adreça exacta',
      description:
        "El marcador se situa a l'edifici. Ideal per a habitatges fàcils de trobar igualment.",
    },
    street: {
      title: 'Només el carrer',
      description:
        "Mostra el carrer, no el número. L'adreça exacta es comparteix després de la reserva o la signatura.",
    },
    approximate: {
      title: 'Zona aproximada',
      description: "Mostra un cercle d'uns 500 m. L'opció més privada.",
    },
  },
  addressPrecisionLabel: "Precisió de l'adreça",
  addressPrecisionFootnote:
    'El mapa publicat segueix aquesta elecció. La teva adreça exacta només es comparteix amb les persones que confirmis.',
  qualityTitle: "Qualitat de l'anunci",
  qualityScore: "Puntuació de qualitat de l'anunci",
  tips: 'Consells',
  todo: 'Pendent',
  needsWork: 'Cal millorar-lo',
  good: 'Bé',
  excellent: 'Excel·lent',
  previewTitle: 'Previsualització',
  previewDescription: "Així veuran l'anunci els hostes.",
  card: 'Targeta',
  page: 'Pàgina',
  previewAs: 'Mostra com a',
  reviews: (n, shown) =>
    plural('ca', n, { one: '{s} ressenya', other: '{s} ressenyes' }).replace('{s}', shown),
};

const MEDIA_HEADER_MESSAGES: Translations['MEDIA_HEADER_MESSAGES'] = {
  artistPick: "Selecció de l'artista",
  saveEpisode: "Desa l'episodi",
  share: 'Comparteix',
  podcastEpisode: 'Episodi de pòdcast',
  listeningProgress: "Progrés d'escolta",
  shuffle: 'Aleatori',
  download: 'Baixa',
  downloadProgress: 'Progrés de la baixada',
  follow: 'Segueix',
  following: 'Seguint',
  searchInPlaylist: 'Cerca a la llista',
  compactView: 'Visualització compacta',
  editDetails: 'Edita els detalls',
  about: 'Informació',
  discography: 'Discografia',
  showAll: 'Mostra-ho tot',
  albums: 'Àlbums',
  singlesAndEps: 'Senzills i EP',
  compilations: 'Recopilatoris',
  audiobook: 'Audiollibre',
  popular: 'Populars',
  seeMore: "Mostra'n més",
  podcast: 'Pòdcast',
  latestEpisode: 'Últim episodi',
  verifiedArtist: 'Artista verificat',
  profile: 'Perfil',
  editProfile: 'Edita el perfil',
};

const MENU_ITEM_MESSAGES: Translations['MENU_ITEM_MESSAGES'] = {
  diets: {
    vegetarian: 'Vegetarià',
    vegan: 'Vegà',
    'gluten-free': 'Sense gluten',
    'dairy-free': 'Sense lactis',
    halal: 'Halal',
    kosher: 'Caixer',
  },
  spicy: 'Picant',
  spiceOf: (label, level, max) => `${label} ${level} de ${max}`,
  originally: (price, original) => `${price}, abans ${original}`,
  inBasket: (n) => `${n} a la cistella`,
  soldOut: 'Esgotat',
  addItem: (name) => `Afegeix ${name}`,
  choose: (n) => `Tria'n ${n}`,
  chooseRange: (min, max) => `Tria'n de ${min} a ${max}`,
  upTo: (n) => `Fins a ${n}`,
  optional: 'Opcional',
  quantity: 'Quantitat',
  addToBasket: 'Afegeix a la cistella',
  options: 'Opcions',
};

const PAGINATION_MESSAGES: Translations['PAGINATION_MESSAGES'] = {
  pagination: 'Paginació',
  goToPage: (page) => `Ves a la pàgina ${page}`,
};

const LEAD_SCORE_MESSAGES: Translations['LEAD_SCORE_MESSAGES'] = {
  title: 'Puntuació del lead',
  factors: 'De què es compon',
  bands: { cold: 'Fred', warm: 'Tebi', hot: 'Calent' },
};

const DIRECTIONS_MESSAGES: Translations['DIRECTIONS_MESSAGES'] = {
  modes: { drive: 'Cotxe', transit: 'Transport públic', walk: 'A peu', cycle: 'Bicicleta' },
  traffic: { light: 'Trànsit fluid', moderate: 'Trànsit moderat', heavy: 'Trànsit dens' },
  maneuvers: {
    depart: 'Sortida',
    straight: 'Continua recte',
    'slight-left': "Gira lleugerament a l'esquerra",
    left: "Gira a l'esquerra",
    'sharp-left': "Gira bruscament a l'esquerra",
    'slight-right': 'Gira lleugerament a la dreta',
    right: 'Gira a la dreta',
    'sharp-right': 'Gira bruscament a la dreta',
    uturn: 'Fes un canvi de sentit',
    roundabout: 'A la rotonda',
    merge: "Incorpora't",
    arrive: 'Arribada',
    board: 'Puja',
    alight: 'Baixa',
    transfer: 'Fes transbord',
    walk: 'Camina',
  },
  directions: 'Indicacions',
  otherRoutes: 'Altres rutes',
  travelMode: 'Mitjà de transport',
  start: 'Inicia',
  currentStep: 'Pas actual',
  line: (name) => `Línia ${name}`,
};

const CART_PANEL_MESSAGES: Translations['CART_PANEL_MESSAGES'] = {
  basket: 'Cistella',
  checkout: 'Ves al pagament',
  emptyTitle: 'La cistella és buida',
  emptyDescription: 'Afegeix alguna cosa del menú i apareixerà aquí.',
  soldOut: 'Esgotat',
  removeItem: (name) => `Treu ${name}`,
  originally: (price, original) => `${price}, abans ${original}`,
  promoCode: 'Codi promocional',
  apply: 'Aplica',
  tip: 'Propina',
};

const MEDIA_CARD_MESSAGES: Translations['MEDIA_CARD_MESSAGES'] = {
  albumTypes: { album: 'Àlbum', single: 'Senzill', ep: 'EP', compilation: 'Recopilatori' },
  artist: 'Artista',
  verified: 'Verificat',
  audiobook: 'Audiollibre',
  narratedBy: (n) => `Narrat per ${n}`,
  progressOf: (t) => `Progrés de ${t}`,
  episode: 'Episodi',
  played: 'Escoltat',
  event: 'Esdeveniment',
  soldOut: 'Exhaurit',
  listeningNow: 'Escoltant ara',
  trackBy: (t, a) => `${t} de ${a}`,
  mix: 'Mix',
  playlist: 'Llista',
  collaborative: 'Col·laborativa',
  ownedBy: (o) => `De ${o}`,
  podcast: 'Pòdcast',
  profile: 'Perfil',
  followsYou: 'Et segueix',
  song: 'Cançó',
  share: 'Comparteix',
  listened: 'Escoltat',
};

const JOB_BOARD_MESSAGES: Translations['JOB_BOARD_MESSAGES'] = {
  labels: {
    take: 'Accepta la feina',
    pass: 'Passa',
    distance: 'Distància',
    duration: 'Temps',
    window: 'Franja',
    pickup: 'Recollida',
    dropoff: 'Lliurament',
    state: { taken: 'Assignada', expired: 'Caducada' },
    showPay: 'Mostra quant es paga',
    hidePay: 'Amaga quant es paga',
    payDetails: 'Pagament per',
    sort: 'Ordena les feines',
    filtersToggle: 'Filtres',
    filtersActive: (n) => plural('ca', n, { one: '{n} aplicat', other: '{n} aplicats' }),
    sortOptions: {
      pay: 'Més ben pagades',
      distance: 'Més properes',
      soonest: 'Comencen abans',
      expiring: 'Tanquen abans',
    },
    filters: { distance: 'Distància', pay: 'Pagament', when: 'Quan', vehicle: 'Vehicle' },
    clearFilters: 'Treu els filtres',
    refresh: 'Actualitza la llista',
    count: (n) => plural('ca', n, { one: '{n} feina', other: '{n} feines' }),
    loading: "S'estan carregant les feines",
  },
  emptyTitle: 'Ara no hi ha feines',
  emptyDescription:
    'No hi ha res que coincideixi amb el que busques. Amplia un filtre o torna a actualitzar d’aquí a un minut.',
  list: 'Feines',
  payDetailsFor: (load) => `Pagament per ${load}`,
  route: (pickup, dropoff) => `${pickup} i ${dropoff}`,
  bands: {
    anyDistance: 'Qualsevol distància',
    underKm: (km) => `A menys de ${km} km`,
    anyTime: 'Qualsevol moment',
    withinHour: 'En la pròxima hora',
    nextHours: (hours) => `En les pròximes ${hours} hores`,
    today: 'Avui',
  },
};

const FLOATING_MESSAGES: Translations['FLOATING_MESSAGES'] = {
  submenu: 'Submenú',
};

const AGENT_CHAT_MESSAGES: Translations['AGENT_CHAT_MESSAGES'] = {
  chat: {
    newChat: 'Xat nou',
    emptyTitle: 'En què et puc ajudar?',
    emptyDescription:
      'Aquest xat funciona amb la teva pròpia clau d’API. L’historial es queda en aquest navegador.',
    thinking: 'Pensant',
    error: 'Alguna cosa ha fallat. Revisa els registres del servidor i torna-ho a provar.',
    suggestions: [
      'Explica què fa aquest projecte inicial',
      'Escriu una actualització de producte en tres frases',
      'Dona’m cinc noms per a una app de cites',
    ],
    you: 'Tu',
    assistant: 'Assistent',
  },
  actions: {
    share: 'Comparteix el xat',
    shared: 'Transcripció copiada',
    more: 'Més accions d’aquest xat',
    exportChats: 'Exporta els xats',
    markUnread: 'Marca com a no llegit',
    deleteChat: 'Suprimeix el xat',
  },
  message: {
    copy: 'Copia el missatge',
    readAloud: 'Llegeix en veu alta',
    stopReading: 'Deixa de llegir en veu alta',
  },
  history: {
    region: 'Historial de xats',
    recent: 'Recents',
    empty: 'Els xats que comencis apareixeran aquí.',
    rename: 'Canvia el nom',
    renameField: 'Canvia el nom del xat',
    markUnread: 'Marca com a no llegit',
    unread: 'No llegit',
    exportCount: (n) =>
      n === 0
        ? 'No hi ha xats per exportar'
        : plural('ca', n, { one: 'Exporta {n} xat', other: 'Exporta {n} xats' }),
    accountMenu: (name) => `Menú del compte de ${name}`,
    usageLeft: 'Ús restant',
    upgrade: 'Passa a Max',
    logOut: 'Tanca la sessió',
  },
  composer: {
    field: 'Missatge',
    placeholder: 'Pregunta’m el que vulguis',
    attach: 'Afegeix un fitxer adjunt',
    send: 'Envia el missatge',
    stop: 'Atura la generació',
    notConfigured: 'No configurat',
    messageCount: (n) => plural('ca', n, { one: '{n} missatge', other: '{n} missatges' }),
    answeringWith: (model) => `Responent amb ${model}`,
  },
  ago: {
    justNow: 'ara mateix',
    minutes: (n) => plural('ca', n, { one: 'fa {n} minut', other: 'fa {n} minuts' }),
    hours: (n) => plural('ca', n, { one: 'fa {n} hora', other: 'fa {n} hores' }),
    days: (n) => plural('ca', n, { one: 'fa {n} dia', other: 'fa {n} dies' }),
  },
  age: { now: 'ara', minutes: (n) => `${n} min`, hours: (n) => `${n} h`, days: (n) => `${n} d` },
};

const WEB_SEARCH_MESSAGES: Translations['WEB_SEARCH_MESSAGES'] = {
  sources: 'Fonts',
  working: 'Treballant',
};

const MAIL_THREAD_MESSAGES: Translations['MAIL_THREAD_MESSAGES'] = {
  to: 'Per a',
  cc: 'A/c',
  bcc: 'C/o',
  reply: 'Respon',
  replyAll: 'Respon a tothom',
  forward: 'Reenvia',
  more: COMMON_MESSAGES.more,
  moreAddresses: (n) => `${n} més`,
  earlierMessages: (n) =>
    plural('ca', n, { one: '{n} missatge anterior', other: '{n} missatges anteriors' }),
  showTrimmed: 'Mostra el contingut retallat',
  hideTrimmed: 'Amaga el contingut retallat',
  unread: 'No llegit',
  starred: 'Destacat',
  star: 'Destaca',
  attachments: 'Fitxers adjunts',
  attachmentCount: (n) =>
    plural('ca', n, { one: '{n} fitxer adjunt', other: '{n} fitxers adjunts' }),
  expand: 'Desplega el missatge',
  collapse: 'Plega el missatge',
};

const NOTIFICATION_CENTER_MESSAGES: Translations['NOTIFICATION_CENTER_MESSAGES'] = {
  title: 'Notificacions',
  emptyMessage: 'Ja estàs al dia.',
  emptyDescription: 'La nova activitat apareixerà aquí quan arribi.',
  noUnread: 'No hi ha notificacions sense llegir',
  unread: (n) => plural('ca', n, { one: '{n} sense llegir', other: '{n} sense llegir' }),
  markAllRead: 'Marca-ho tot com a llegit',
  category: 'Categoria de notificació',
  tabs: { all: 'Totes', mentions: 'Mencions', system: 'Sistema' },
  unreadDot: 'Sense llegir',
};

const CHART_CARDS_MESSAGES: Translations['CHART_CARDS_MESSAGES'] = {
  titles: {
    activity: 'Activitat',
    agents: 'Agents',
    visitors: 'Visitants',
    breakdown: 'Desglossament',
    sessions: 'Sessions',
    contributionsThisYear: 'Contribucions aquest any',
    earnedSoFar: 'Guanyat fins ara',
    signUpFunnel: 'Embut de registre',
    activeUsers: 'Usuaris actius',
    revenue: 'Ingressos',
    mostActiveDays: 'Dies més actius',
    orders: 'Comandes',
    trackedTime: 'Temps registrat',
    revenuePerAccount: 'Ingressos per compte',
    sleepScore: 'Puntuació del son',
    pipeline: 'Embut de vendes',
    steps: 'Passos',
    tokens: 'Tokens',
  },
  weekly: 'Setmanal',
  monthly: 'Mensual',
  yearly: 'Anual',
  stepsSuffix: 'passos',
  today: 'Avui',
  thisYear: 'Aquest any',
  lastYear: "L'any passat",
  sinceLastYear: "l'any passat",
  aYearEarlier: 'un any abans',
  earningsPeriod: 'Període de guanys',
  changePeriod: 'Canvia el període',
  period: 'Període',
  total: 'total',
  average: 'mitjana',
  thisMonth: 'aquest mes',
  ofGoal: "de l'objectiu",
  totalSteps: 'passos en total',
  gaugeChart: (title, reading) => `Indicador de ${title.toLowerCase()}: ${reading}`,
  halfGaugeChart: (title, items) => `Semicercle de ${title.toLowerCase()}: ${items}`,
  radialChart: (title, items) => `Gràfic radial de ${title.toLowerCase()}: ${items}`,
  percentOfGoal: (pct) => `${pct} % de l'objectiu`,
  periodOf: (label) => `Període d'${label.toLowerCase()}`,
  chartVs: (title, current, previous) =>
    `Gràfic de ${title.toLowerCase()}: ${current.toLowerCase()} davant ${previous.toLowerCase()}`,
  lineChart: (title) => `Gràfic de línies de ${title.toLowerCase()}`,
  barChart: (title, items) => `Gràfic de barres de ${title.toLowerCase()}: ${items}`,
  comboChart: (title, bar, line) =>
    `Gràfic de ${title.toLowerCase()}: barres de ${bar} davant línia de ${line}`,
  scatterChart: (title, series) => `Gràfic de dispersió de ${title.toLowerCase()}: ${series}`,
  bubbleChart: (title, series) => `Gràfic de bombolles de ${title.toLowerCase()}: ${series}`,
  ringItem: (label, value, pct) => `${label} ${value}, ${pct} % de l'objectiu`,
  scoreOf: (score, max) => `${score} de ${max}`,
  activityFor: (name, day) => `Activitat del ${day} de ${name}`,
  contributions: (n, date) => {
    const on = date ? ` el ${date}` : '';
    return n === 0
      ? `Cap contribució${on}`
      : plural('ca', n, { one: `{n} contribució${on}`, other: `{n} contribucions${on}` });
  },
};

const CODE_MESSAGES: Translations['CODE_MESSAGES'] = {
  copy: 'Copia el codi',
  copied: 'Codi copiat',
};

const OUTLINE_NAV_MESSAGES: Translations['OUTLINE_NAV_MESSAGES'] = {
  outline: 'En aquesta pàgina',
  progress: (at, of) => `Encapçalament ${at} de ${of}`,
};

const STEPPER_MESSAGES: Translations['STEPPER_MESSAGES'] = {
  decrease: 'Redueix',
  increase: 'Augmenta',
};

const CALL_UI_MESSAGES: Translations['CALL_UI_MESSAGES'] = {
  status: {
    calling: 'Trucant…',
    ringing: 'Sonant',
    connecting: "S'està connectant…",
    active: 'Connectat',
    reconnecting: "S'està reconnectant…",
    onHold: 'En espera',
    ended: 'Trucada finalitzada',
  },
  controls: {
    mute: 'Silencia el micròfon',
    unmute: 'Activa el micròfon',
    speakerOn: "Activa l'altaveu",
    speakerOff: "Desactiva l'altaveu",
    videoOn: 'Activa la càmera',
    videoOff: 'Desactiva la càmera',
    flipCamera: 'Canvia la càmera',
    screenShareOn: 'Comparteix la pantalla',
    screenShareOff: 'Deixa de compartir la pantalla',
    addParticipant: 'Afegeix un participant',
    endCall: 'Finalitza la trucada',
  },
  screen: {
    minimise: 'Minimitza la trucada',
    chat: 'Obre el xat',
    participants: 'Participants',
    movePip: (c) => `Mou la meva imatge (ara ${callUi_corner(CALL_UI_MESSAGES__CORNERS, c)})`,
  },
  pipCorners: CALL_UI_MESSAGES__CORNERS,
  history: {
    incoming: 'Entrant',
    outgoing: 'Sortint',
    missed: 'Perduda',
    declined: 'Rebutjada',
    callBack: (name) => `Torna la trucada a ${name}`,
  },
  incoming: {
    accept: 'Accepta',
    decline: 'Rebutja',
    message: 'Missatge',
    remind: "Recorda-m'ho",
    slideToAnswer: 'Llisca per respondre',
    voice: 'Trucada de veu entrant',
    video: 'Videotrucada entrant',
  },
  returnToCall: 'Torna a la trucada',
  returnToCallWith: (name) => `Torna a la trucada amb ${name}`,
  join: "Uneix-t'hi",
  leave: 'Surt',
  speaking: (name) => `${name} està parlant`,
  overflow: (n) => `+${n} més`,
  muted: (name) => `${name}, silenciat`,
};

const RECENT_HIRES_CARD_MESSAGES: Translations['RECENT_HIRES_CARD_MESSAGES'] = {
  title: 'Incorporacions recents',
};

const MAIL_LIST_MESSAGES: Translations['MAIL_LIST_MESSAGES'] = {
  draft: 'Esborrany:',
  unread: 'No llegit',
  starred: 'Destacat',
  star: 'Destaca',
  attachment: 'Té un fitxer adjunt',
  select: 'Selecciona',
  threadCount: (n) => plural('ca', n, { one: '{n} missatge', other: '{n} missatges' }),
  moreLabels: (n) => plural('ca', n, { one: '{n} etiqueta més', other: '{n} etiquetes més' }),
  selectedCount: (n) => plural('ca', n, { one: '{n} seleccionat', other: '{n} seleccionats' }),
  selectAll: 'Selecciona-ho tot',
  clearSelection: 'Esborra la selecció',
  emptyTitle: 'Aquí no hi ha res',
  emptyDescription: 'El correu nou arriba a aquesta carpeta.',
  today: 'Avui',
  yesterday: 'Ahir',
  list: 'Correu',
};

const IMPORTANT_ALERTS_CARD_MESSAGES: Translations['IMPORTANT_ALERTS_CARD_MESSAGES'] = {
  title: 'Alertes importants',
  thisWeek: 'aquesta setmana',
};

const STAT_CARDS_MESSAGES: Translations['STAT_CARDS_MESSAGES'] = {
  about: (label) => `Quant a ${label}`,
  fromLastMonth: 'Respecte al mes passat',
};

const SHAPE_MESSAGES: Translations['SHAPE_MESSAGES'] = {
  shapes: shapes_shapeNames(
    {
      square: 'Quadrat',
      slanted: 'Inclinat',
      arch: 'Arc',
      semicircle: 'Semicercle',
      oval: 'Oval',
      pill: 'Píndola',
      triangle: 'Triangle',
      arrow: 'Fletxa',
      fan: 'Ventall',
      diamond: 'Rombe',
      clamshell: 'Petxina',
      pentagon: 'Pentàgon',
      gem: 'Gemma',
      'very-sunny': 'Molt assolellat',
      sunny: 'Assolellat',
      burst: 'Esclat',
      'soft-burst': 'Esclat suau',
      boom: 'Explosió',
      'soft-boom': 'Explosió suau',
      flower: 'Flor',
      puffy: 'Esponjós',
      'puffy-diamond': 'Rombe esponjós',
      'ghost-ish': 'Gairebé fantasma',
      'pixel-circle': 'Cercle pixelat',
      'pixel-triangle': 'Triangle pixelat',
      bun: 'Brioix',
      heart: 'Cor',
    },
    (n) => `Galeta de ${n} costats`,
    (n) => `Trèvol de ${n} fulles`,
  ),
};

const TENANCY_MESSAGES: Translations['TENANCY_MESSAGES'] = {
  leasePaymentStatus: { upcoming: 'Pròxim', due: 'Venç aviat', overdue: 'Vençut', paid: 'Pagat' },
  rentPaymentStatus: { paid: 'Pagat', pending: 'Pendent', overdue: 'Vençut', partial: 'Parcial' },
  maintenanceCategory: {
    plumbing: 'Lampisteria',
    electrical: 'Electricitat',
    appliances: 'Electrodomèstics',
    heating: 'Calefacció',
    other: 'Altres',
  },
  maintenancePriority: {
    low: 'Prioritat baixa',
    medium: 'Prioritat mitjana',
    high: 'Prioritat alta',
    urgent: 'Urgent',
  },
  maintenanceStage: {
    reported: 'Notificada',
    acknowledged: 'Rebuda',
    scheduled: 'Programada',
    resolved: 'Resolta',
  },
  documentStatus: { signed: 'Signat', pending: 'Pendent de signatura', expired: 'Caducat' },
  timelineState: { complete: 'Completat', current: 'En curs', upcoming: 'Pendent' },
  leasePeriod: 'Durada del contracte',
  monthlyRent: 'Lloguer mensual',
  deposit: 'Fiança',
  nextPayment: 'Pròxim pagament',
  paidThisYear: 'Pagat aquest any',
  outstanding: 'Pendent',
  noPayments: 'Encara no hi ha pagaments',
  columns: {
    month: 'Mes',
    dueDate: 'Venciment',
    method: 'Mètode',
    amount: 'Import',
    status: 'Estat',
  },
  downloadReceipt: (month) => `Baixa el rebut de ${month}`,
  dueOn: (date) => `Venç el ${date}`,
  comments: (n) => plural('ca', n, { one: '{n} comentari', other: '{n} comentaris' }),
  photo: (position, total) => `Foto ${position} de ${total}`,
  photoWithAlt: (alt, position, total) => `${alt}, foto ${position} de ${total}`,
  sign: 'Signa',
  signDocument: (name) => `Signa ${name}`,
  viewDocument: (name) => `Mostra ${name}`,
  downloadDocument: (name) => `Baixa ${name}`,
  noDocuments: 'No hi ha documents',
};

const DATA_TABLE_MESSAGES: Translations['DATA_TABLE_MESSAGES'] = {
  selectAll: "Selecciona totes les files d'aquesta pàgina",
  selectRow: (id) => `Selecciona la fila ${id}`,
  densityLabel: 'Densitat de la taula',
  density: { md: 'Normal', sm: 'Compacta' },
};

const ERROR_BOUNDARY_MESSAGES: Translations['ERROR_BOUNDARY_MESSAGES'] = {
  title: 'Alguna cosa ha anat malament',
  message: "S'ha produït un error inesperat",
  retry: 'Torna-ho a provar',
};

const AI_PROFILE_CARD_MESSAGES: Translations['AI_PROFILE_CARD_MESSAGES'] = {
  contributions: 'Contribucions aquest any',
  activity: 'Activitat',
  periodGroup: (label) => `Període: ${label}`,
  periods: { weekly: 'Setmanal', monthly: 'Mensual', yearly: 'Anual' },
};

const BREADCRUMB_MESSAGES: Translations['BREADCRUMB_MESSAGES'] = {
  breadcrumb: 'Ruta de navegació',
};

const MESSAGE_MEDIA_MESSAGES: Translations['MESSAGE_MEDIA_MESSAGES'] = {
  photo: 'Foto',
  video: 'Vídeo',
  photoOf: (i, total) => `Foto ${i} de ${total}`,
  videoOf: (i, total) => `Vídeo ${i} de ${total}`,
  tapToView: 'Toca per veure',
  sendingPhoto: "S'està enviant la foto",
  sendingVideo: "S'està enviant el vídeo",
  sendingAlbum: "S'està enviant l'àlbum",
  sendingSticker: "S'està enviant l'adhesiu",
  sendingGif: "S'està enviant el GIF",
  album: (n) => `Àlbum, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  sharedMedia: (n) => `Multimèdia compartit, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  sharedFiles: (n) => `Fitxers compartits, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  moreItems: (n) => `+${n} més`,
  notSent: 'No enviat',
  voiceMessage: (d) => `Missatge de veu, ${d}`,
  playVoiceMessage: 'Reprodueix el missatge de veu',
  pauseVoiceMessage: 'Posa en pausa el missatge de veu',
  transcribe: 'Transcriu',
  hideTranscript: 'Amaga la transcripció',
  seek: 'Cerca la posició',
  seekPosition: (p, d) => `${p} de ${d}`,
  playbackSpeed: (r) => `Velocitat de reproducció, ${r}`,
  unplayed: 'No reproduït',
  download: 'Baixa',
  downloaded: 'Baixat',
  file: 'Fitxer',
  fileKinds: {
    pdf: 'PDF',
    doc: 'DOCUMENT',
    sheet: 'FULL DE CÀLCUL',
    slides: 'PRESENTACIÓ',
    zip: 'ZIP',
    audio: 'ÀUDIO',
    video: 'VÍDEO',
    image: 'IMATGE',
    code: 'CODI',
  },
  contact: 'Contacte',
  message: 'Missatge',
  add: 'Afegeix',
  location: 'Ubicació',
  liveLocation: 'Ubicació en temps real',
  stopSharing: 'Deixa de compartir',
  vote: 'Vota',
  viewResults: 'Mostra els resultats',
  anonymousVoting: 'Votació anònima',
  quiz: 'Qüestionari',
  selectOne: "Tria'n una",
  selectOneOrMore: "Tria'n una o més",
  correctAnswer: 'resposta correcta',
  yourAnswer: 'la teva resposta',
  votes: (n) => (n === 0 ? 'Cap vot' : plural('ca', n, { one: '{n} vot', other: '{n} vots' })),
  sticker: 'Adhesiu',
};

const PIPELINE_MESSAGES: Translations['PIPELINE_MESSAGES'] = {
  health: { 'on-track': 'Al dia', 'at-risk': 'En risc', stalled: 'Encallat' },
  stalledFor: (duration) => `Encallat des de fa ${duration}`,
  move: (title) => `Mou ${title}`,
  stages: "Etapes de l'embut",
  stageWithCount: (name, n) =>
    `${name}, ${plural('ca', n, { one: '{n} oportunitat', other: '{n} oportunitats' })}`,
  empty: 'No hi ha oportunitats en aquesta etapa',
  loadMore: "Carrega'n més",
};

const STAY_SEARCH_MESSAGES: Translations['STAY_SEARCH_MESSAGES'] = {
  where: 'On',
  checkIn: 'Arribada',
  checkOut: 'Sortida',
  when: 'Quan',
  who: 'Qui',
  destinationPlaceholder: 'Cerca destinacions',
  datesPlaceholder: 'Afegeix dates',
  guestsPlaceholder: 'Afegeix hostes',
  guests: { adults: 'Adults', children: 'Nens', infants: 'Nadons', pets: 'Mascotes' },
  guestDescriptions: {
    adults: 'A partir de 13 anys',
    children: 'De 2 a 12 anys',
    infants: 'Menys de 2 anys',
    pets: "Viatges amb un animal d'assistència?",
  },
  dateFlexibility: 'Flexibilitat de dates',
  exactDates: 'Dates exactes',
  plusMinusDays: (n) => plural('ca', n, { one: '± {n} dia', other: '± {n} dies' }),
  destinations: 'Destinacions',
  whereTo: 'On vols anar?',
  filters: 'Filtres',
};

const AUTH_CARD_MESSAGES: Translations['AUTH_CARD_MESSAGES'] = {
  modes: {
    signin: {
      title: 'Hola de nou',
      description: 'Inicia la sessió per continuar on ho vas deixar.',
      cta: 'Inicia la sessió',
      switchLead: 'Ets nou?',
      switchAction: 'Crea un compte',
    },
    signup: {
      title: 'Crea el teu compte',
      description: 'Comença a crear en un parell de minuts.',
      cta: 'Crea el compte',
      switchLead: 'Ja tens un compte?',
      switchAction: 'Inicia la sessió',
    },
    verify: {
      title: 'Revisa la safata d’entrada',
      description: "Introdueix el codi que t'hem enviat per acabar d'iniciar la sessió.",
      cta: 'Verifica i continua',
      switchLead: "No t'arriba el codi?",
      switchAction: "Envia'n un altre",
    },
  },
  codeSentTo: (email) =>
    `Introdueix el codi que hem enviat a ${email} per acabar d'iniciar la sessió.`,
  verificationCode: 'Codi de verificació',
  fullName: 'Nom complet',
  namePlaceholder: 'Laia Puig',
  email: 'Correu electrònic',
  emailPlaceholder: 'tu@empresa.cat',
  emailHint: "L'utilitzem per contactar amb tu i no el compartim mai.",
  password: 'Contrasenya',
  passwordPlaceholder: 'Introdueix la contrasenya',
  newPasswordPlaceholder: 'Almenys 8 caràcters',
  confirmPassword: 'Confirma la contrasenya',
  confirmPasswordPlaceholder: 'Repeteix la contrasenya',
  rememberMe: "Recorda'm",
  forgotPassword: 'Has oblidat la contrasenya?',
  terms:
    'En crear un compte, acceptes les nostres Condicions del servei i la nostra Política de privadesa.',
  orContinueWith: 'o continua amb',
};

const TRACK_LIST_MESSAGES: Translations['TRACK_LIST_MESSAGES'] = {
  title: 'Títol',
  album: 'Àlbum',
  dateAdded: "Data d'addició",
  plays: 'Reproduccions',
  duration: 'Durada',
  moveUp: 'Mou amunt',
  moveDown: 'Mou avall',
  reorder: 'Reordena',
  downloaded: 'Baixada',
  unavailable: 'No disponible',
  tracks: 'Cançons',
  episodes: 'Episodis',
  selected: (n) => plural('ca', n, { one: '{n} seleccionat', other: '{n} seleccionats' }),
  clearSelection: 'Esborra la selecció',
  played: 'Reproduït',
  listened: 'Escoltat',
  saveEpisode: "Desa l'episodi",
  downloadEpisode: "Baixa l'episodi",
  minutes: (m) => `${m} min`,
  hours: (h) => `${h} h`,
  hoursMinutes: (h, m) => `${h} h ${m} min`,
  remaining: (l) => `Queden ${l}`,
};

const LYRICS_MESSAGES: Translations['LYRICS_MESSAGES'] = {
  lyrics: 'Lletra',
  showLyrics: 'Mostra la lletra',
  backToCurrent: 'Torna a la línia actual',
  empty: "La lletra d'aquesta cançó no està disponible",
};

const ACTIVITY_FEED_MESSAGES: Translations['ACTIVITY_FEED_MESSAGES'] = {
  kinds: {
    call: 'Trucada',
    email: 'Correu',
    meeting: 'Reunió',
    note: 'Nota',
    'stage-change': "Canvi d'etapa",
    task: 'Tasca completada',
  },
  empty: 'Encara no hi ha activitat registrada',
  loggedBy: (name) => `Registrat per ${name}`,
  filterActivity: "Filtra l'activitat",
};

const PLACE_REVIEWS_MESSAGES: Translations['PLACE_REVIEWS_MESSAGES'] = {
  depositReturned: 'Fiança retornada',
  depositNotReturned: 'Fiança no retornada',
  recommend: 'Ho recomanaria',
  notRecommend: 'No ho recomanaria',
  helpful: 'Útil',
  report: 'Denuncia',
  promptTitle: 'Hi has viscut?',
  promptDescription: (building) =>
    `Ajuda els futurs llogaters de ${building}. Les ressenyes són anònimes.`,
  writeReview: 'Escriu una ressenya',
  reviewCount: (n) => plural('ca', n, { one: '{n} ressenya', other: '{n} ressenyes' }),
  depositRate: (percent) => `Fiança retornada en el ${percent}% dels lloguers`,
  recommendRate: (percent) => `El ${percent}% recomanaria viure-hi`,
};

const DELIVERY_SLOT_MESSAGES: Translations['DELIVERY_SLOT_MESSAGES'] = {
  tiers: { standard: 'Estàndard', express: 'Exprés' },
  soldOut: 'Esgotat',
  asap: 'Com més aviat millor',
  field: "Hora d'entrega",
  day: 'Dia',
  emptyTitle: 'No queden franges',
  emptyDescription: 'Tria un altre dia o el proper repartidor disponible.',
};

const PLACE_LIST_MESSAGES: Translations['PLACE_LIST_MESSAGES'] = {
  visibility: { private: 'Privada', shared: 'Compartida', public: 'Pública' },
  places: (n) => plural('ca', n, { one: '{n} lloc', other: '{n} llocs' }),
  sharedWith: (n) =>
    plural('ca', n, { one: 'Compartida amb {n} persona', other: 'Compartida amb {n} persones' }),
  labels: {
    moveEarlier: (position) => `Mou a la posició ${position - 1}`,
    moveLater: (position) => `Mou a la posició ${position + 1}`,
    remove: (name) => `Treu ${name} de la llista`,
    moved: (name, position, total) => `${name} s'ha mogut a la posició ${position} de ${total}`,
    note: 'Nota',
  },
  savedPlaces: 'Llocs desats',
};

const HOME_SEARCH_MESSAGES: Translations['HOME_SEARCH_MESSAGES'] = {
  modes: { rent: 'Lloguer', buy: 'Compra', stays: 'Lloguer de vacances', swap: 'Intercanvi' },
  searchMode: 'Mode de cerca',
  location: 'Ubicació',
  locationPlaceholder: 'Cerca una ciutat o zona',
  moveIn: 'Entrada',
  datePlaceholder: 'Afegeix una data',
  budget: 'Pressupost',
  budgetPlaceholder: 'Afegeix un pressupost',
  price: 'Preu',
  pricePlaceholder: 'Qualsevol preu',
  propertyType: "Tipus d'immoble",
  propertyTypePlaceholder: 'Qualsevol tipus',
  dates: 'Dates',
  homeSize: "Mida de l'habitatge",
  homeSizePlaceholder: 'Qualsevol mida',
  minimum: 'Mínim',
  maximum: 'Màxim',
  budgetPresets: 'Rangs de pressupost',
  monthlyBudget: 'Pressupost mensual',
  monthlyBudgetDescription: 'Lloguer mensual, sense despeses',
  totalPriceDescription: 'Preu total',
  upTo: (amount) => `Fins a ${amount}`,
  any: 'Qualsevol',
  moveInLabels: {
    date: "Data d'entrada",
    flexible: 'Flexible',
    asap: 'Com més aviat millor',
    contractLength: 'Durada del contracte',
  },
  contractLengths: {
    any: 'Qualsevol',
    short: '1–6 mesos',
    medium: '6–12 mesos',
    long: "Més d'1 any",
  },
  saveSearch: 'Desa la cerca',
  saved: 'Desada',
  newCount: (n) => plural('ca', n, { one: '{n} nou', other: '{n} nous' }),
  alertsOff: 'Alertes desactivades',
  actionOn: (action, subject) => `${action}: ${subject}`,
};

const OFFERING_BADGE_MESSAGES: Translations['OFFERING_BADGE_MESSAGES'] = {
  offerings: {
    long_term_rent: 'En lloguer',
    sale: 'En venda',
    short_term_rent: 'Lloguer turístic',
    exchange: 'Intercanvi',
  },
};

const MAP_ATTRIBUTION_MESSAGES: Translations['MAP_ATTRIBUTION_MESSAGES'] = {
  scale: 'Escala',
  mapData: 'Dades del mapa',
};

const SLIDER_MESSAGES: Translations['SLIDER_MESSAGES'] = {
  minimum: 'Mínim',
  maximum: 'Màxim',
  value: (n) => `Valor ${n}`,
};

const SELECT_MESSAGES: Translations['SELECT_MESSAGES'] = {
  selectOption: 'Selecciona una opció',
  scrollUp: 'Desplaça amunt',
  scrollDown: 'Desplaça avall',
};

const ZOOMABLE_MEDIA_GALLERY_MESSAGES: Translations['ZOOMABLE_MEDIA_GALLERY_MESSAGES'] = {
  close: 'Tanca el visualitzador multimèdia',
  previous: 'Element anterior',
  next: 'Element següent',
  goTo: (i, n) => `Ves a l'element ${i} de ${n}`,
  share: 'Comparteix el contingut',
};

const NOTIFICATION_MESSAGES: Translations['NOTIFICATION_MESSAGES'] = {
  dismiss: 'Descarta la notificació',
};

const PHONE_INPUT_MESSAGES: Translations['PHONE_INPUT_MESSAGES'] = {
  phoneNumber: 'Número de telèfon',
  countryCode: 'Codi de país',
};

const VENDOR_CARD_MESSAGES: Translations['VENDOR_CARD_MESSAGES'] = {
  facts: {
    deliveryTime: "Temps d'entrega",
    deliveryFee: 'Enviament',
    distance: 'Distància',
    minimumOrder: 'Comanda mínima',
  },
  availability: { paused: 'En pausa', closed: 'Tancat' },
  new: 'Nou',
  rated: (value, reviews) =>
    `Valoració: ${value} de 5${vendorCard_has(reviews) ? `, ${vendorCard_counted('ca', reviews, { one: '{n} ressenya', other: '{n} ressenyes' })}` : ''}`,
};

const CHAT_INDICATORS_MESSAGES: Translations['CHAT_INDICATORS_MESSAGES'] = {
  presence: { online: 'En línia', idle: 'Absent', offline: 'Desconnectat', busy: 'Ocupat' },
  status: {
    sending: "S'està enviant…",
    sent: 'Enviat',
    delivered: 'Lliurat',
    read: 'Llegit',
    failed: 'No enviat',
  },
  unread: 'No llegit',
  unreadCount: (n) =>
    plural('ca', n, { one: '{n} missatge no llegit', other: '{n} missatges no llegits' }),
};

const MEDIA_CONTROLS_MESSAGES: Translations['MEDIA_CONTROLS_MESSAGES'] = {
  play: 'Reprodueix',
  pause: 'Posa en pausa',
  playSubject: (s) => `Reprodueix ${s}`,
  pauseSubject: (s) => `Posa en pausa ${s}`,
  saveToLibrary: 'Desa a la teva biblioteca',
  saveSubjectToLibrary: (s) => `Desa ${s} a la teva biblioteca`,
  explicit: 'Explícit',
  seek: 'Posició de reproducció',
  seekValue: (a, b) => `${a} de ${b}`,
  mute: 'Silencia',
  unmute: 'Activa el so',
  volume: 'Volum',
  nowPlaying: "S'està reproduint",
};

const INPUT_OTP_MESSAGES: Translations['INPUT_OTP_MESSAGES'] = {
  oneTimeCode: "Codi d'un sol ús",
  digitOf: (i, n) => `Dígit ${i} de ${n}`,
  characterOf: (i, n) => `Caràcter ${i} de ${n}`,
};

const PLACE_DETAILS_MESSAGES: Translations['PLACE_DETAILS_MESSAGES'] = {
  infoActions: { call: 'Truca', open: 'Obre el lloc web', directions: 'Com arribar-hi' },
  busy: {
    busier: 'Més concorregut del que és habitual',
    typical: 'Tan concorregut com de costum',
    quieter: 'Menys concorregut del que és habitual',
  },
  transitModes: {
    bus: "Parada d'autobús",
    metro: 'Estació de metro',
    train: 'Estació de tren',
    tram: 'Parada de tramvia',
    ferry: 'Terminal de transbordadors',
  },
  notAvailable: 'No disponible',
  amenities: 'Serveis',
  today: 'Avui',
  closed: 'Tancat',
  openingHours: 'Horari',
  day: 'Dia',
  noDataForDay: "No hi ha dades d'aquest dia",
  chartNoData: (day) => `${day}, sense dades`,
  chartClosed: (day) => `${day}, tancat tot el dia`,
  chartPeak: (day, hour) => `${day}, més concorregut a les ${hour}`,
  chartNow: (hour) => `ara ${hour}`,
  live: 'en temps real',
  noDepartures: 'Ara no hi ha sortides',
  nearbyTransit: 'Transport públic a prop',
  lines: 'Línies',
  line: (name) => `Línia ${name}`,
  towards: (headsign) => `cap a ${headsign}`,
};

const APP_SHELL_MESSAGES: Translations['APP_SHELL_MESSAGES'] = {
  openNavigation: 'Obre la navegació',
  closeNavigation: 'Tanca la navegació',
  resizePanes: 'Canvia la mida dels panells',
  notifications: 'Notificacions',
  proOffer: 'Oferta Pro',
};

const ROUTE_STOPS_MESSAGES: Translations['ROUTE_STOPS_MESSAGES'] = {
  routeStops: 'Parades de la ruta',
  origin: 'Origen',
  destination: 'Destinació',
  stop: (position) => `Parada ${position}`,
  swap: "Intercanvia l'origen i la destinació",
  addStop: 'Afegeix una parada',
  removeStop: (title) => `Treu ${title}`,
  state: { reached: 'Assolida', current: 'Parada actual', pending: 'Pendent' },
};

const SEARCH_MESSAGES: Translations['SEARCH_MESSAGES'] = { clearQuery: 'Esborra la cerca' };

const TAG_FIELD_MESSAGES: Translations['TAG_FIELD_MESSAGES'] = {
  remove: (t) => `Treu ${t}`,
  full: (n) => `Màxim ${n}`,
  suggestions: 'Suggeriments',
};

const STAY_FILTERS_MESSAGES: Translations['STAY_FILTERS_MESSAGES'] = {
  propertyTypes: {
    apartment: 'Pis',
    house: 'Casa',
    room: 'Habitació',
    studio: 'Estudi',
    duplex: 'Dúplex / Àtic',
    coliving: 'Coliving',
    hostel: 'Alberg',
    other: 'Terreny / Altres',
  },
  features: {
    elevator: 'Ascensor',
    parking: 'Aparcament',
    terrace: 'Terrassa',
    garden: 'Jardí',
    pool: 'Piscina',
    furnished: 'Moblat',
    pets: "S'admeten mascotes",
    airConditioning: 'Aire condicionat',
    heating: 'Calefacció',
    accessible: 'Accessible',
    storage: 'Traster',
  },
  floors: { ground: 'Planta baixa', middle: 'Intermèdia', top: 'Última', elevator: 'Amb ascensor' },
  minimum: 'Mínim',
  maximum: 'Màxim',
  priceRange: 'Interval de preus',
  area: 'Superfície',
  featuresGroup: 'Característiques',
  floor: 'Planta',
  propertyType: "Tipus d'immoble",
  energyRating: 'Certificació energètica',
  anyRating: 'Qualsevol qualificació',
  ratingOnly: (r) => `Només ${r}`,
  ratingAndBetter: (r) => `${r} o millor`,
  filters: 'Filtres',
  filtersApplied: (label, n) =>
    `${label}, ${plural('ca', n, { one: '{n} aplicat', other: '{n} aplicats' })}`,
  clearAll: 'Esborra-ho tot',
  any: 'Qualsevol',
  availableNow: 'Disponible ara',
  availableNowDescription: 'A punt per entrar a viure avui',
  availableFrom: 'Disponible des de',
  anyDate: 'Qualsevol data',
};

const SETTINGS_MODAL_MESSAGES: Translations['SETTINGS_MODAL_MESSAGES'] = {
  dialog: 'Configuració',
  nav: 'Seccions de la configuració',
  close: 'Tanca la configuració',
  saved: 'Desat',
  currentPlan: 'Pla actual',
  actions: 'Accions',
  storage: {
    storedIn: 'Emmagatzemat a',
    fileCount: (n, shown) => plural('ca', n, { one: `${shown} fitxer`, other: `${shown} fitxers` }),
    filterByType: 'Filtra per tipus de fitxer',
    fileType: 'Tipus de fitxer',
    orderBy: 'Ordena per',
    modified: 'Modificats',
    oldestFirst: 'Primer els més antics',
    searchFiles: 'Cerca fitxers',
    selectAllOnPage: "Selecciona tots els fitxers d'aquesta pàgina",
    fileName: 'Nom del fitxer',
    uploadedOn: 'Data de pujada',
    fileSize: 'Mida del fitxer',
    sortBy: {
      name: 'Ordena per nom del fitxer',
      uploadedAt: 'Ordena per data de pujada',
      size: 'Ordena per mida del fitxer',
    },
    selectFile: (name) => `Selecciona ${name}`,
    deleteFile: 'Suprimeix el fitxer',
    deleteNamed: (name) => `Suprimeix ${name}`,
    noMatches: 'Cap fitxer no coincideix amb els filtres.',
    documents: 'Documents',
    spreadsheets: 'Fulls de càlcul',
    videos: 'Vídeos',
    downloadFile: 'Baixa el fitxer',
    rename: 'Canvia el nom',
    copyLink: "Copia l'enllaç",
  },
  tools: {
    showOutput: 'Mostra la sortida',
    refreshTools: 'Actualitza les eines',
    removeServer: 'Treu el servidor',
    logout: 'Tanca la sessió',
    logOutOf: (server) => `Tanca la sessió de ${server}`,
    showTools: (server) => `Mostra les eines de ${server}`,
    hideTools: (server) => `Amaga les eines de ${server}`,
    error: 'Error',
    showOutputLink: 'Mostra la sortida',
    showOutputOf: (server) => `Mostra la sortida de ${server}`,
    newServer: 'Servidor MCP nou',
    newServerDescription: 'Afegeix un servidor MCP personalitzat',
    projectScope: 'Àmbit del projecte',
    authentication: 'Autenticació',
    waitForAuth: "Espera l'autenticació MCP",
    waitForAuthDescription:
      "Espera sense límit de temps per autenticar-te quan se't demani. Si està desactivat, les sol·licituds d'autenticació s'ometen al cap de 30 segons.",
    waitForAuthSwitch: "Espera l'autenticació MCP",
    scopeServers: (scope) => `Servidors MCP de ${scope}`,
    scopeServersDescription: (scope) => `Servidors disponibles a ${scope}.`,
    teamServers: "Servidors MCP de l'equip",
    teamServersDescription: 'Configurats al tauler',
    manage: 'Gestiona',
    noTeamServers: "No hi ha servidors MCP de l'equip",
    noTeamServersBody:
      "Configura servidors MCP al tauler perquè estiguin disponibles a l'escriptori i al núvol.",
    configureTeam: "Configura els servidors MCP de l'equip",
    pluginServers: 'Servidors MCP de connectors',
  },
};

const EVICTION_MESSAGES: Translations['EVICTION_MESSAGES'] = {
  status: {
    scheduled: 'Programat',
    postponed: 'Ajornat',
    suspended: 'Suspès',
    executed: 'Executat',
    cancelled: 'Cancel·lat',
  },
  attend: 'Hi seré',
  share: 'Comparteix',
  contactSupport: 'Contacta amb el grup de suport',
  verified: 'Verificat per la comunitat',
  caseHistory: 'Historial del cas',
  source: (source) => `Font: ${source}`,
};

const BOOKING_MESSAGES: Translations['BOOKING_MESSAGES'] = {
  checkIn: 'Arribada',
  checkOut: 'Sortida',
  guests: 'Hostes',
  addDate: 'Afegeix una data',
  reserve: 'Reserva',
  checkAvailability: 'Consulta la disponibilitat',
  notChargedYet: 'Encara no se’t cobrarà res',
  total: 'Total',
  tripStatus: {
    confirmed: 'Confirmada',
    pending: 'Pendent',
    cancelled: 'Cancel·lada',
    completed: 'Completada',
  },
  priceName: booking_priceName(
    (p, u) => `${p} per ${u}`,
    (s, o) => `${s}, abans ${o}`,
  ),
};

const AGENT_LIMITS_CARD_MESSAGES: Translations['AGENT_LIMITS_CARD_MESSAGES'] = {
  contextWindow: 'Finestra de context',
  freeSpace: 'Espai lliure',
  planUsageLimits: 'Límits d’ús del pla',
  managePlan: 'Gestiona el pla',
};

const SWIPE_ROW_MESSAGES: Translations['SWIPE_ROW_MESSAGES'] = {
  closeActions: 'Tanca les accions',
};

const PATIENT_INFO_CARD_MESSAGES: Translations['PATIENT_INFO_CARD_MESSAGES'] = {
  addPhoto: 'Afegeix una foto de perfil',
};

const THEME_TOGGLE_MESSAGES: Translations['THEME_TOGGLE_MESSAGES'] = {
  theme: 'Tema',
  darkMode: 'Mode fosc',
  lightMode: 'Mode clar',
  useDarkMode: 'Utilitza el mode fosc',
  useLightMode: 'Utilitza el mode clar',
};

const EARNINGS_MESSAGES: Translations['EARNINGS_MESSAGES'] = {
  earned: 'Guanyat',
  period: 'Període de guanys',
  breakdown: "D'on ve",
  payout: 'Proper pagament',
  payoutState: {
    scheduled: 'Programat',
    processing: 'En camí',
    paid: 'Pagat',
    held: 'Retingut',
    failed: 'Fallit',
  },
  chart: (label) => `Guanys: ${label}, per període`,
  empty: 'Encara no has guanyat res',
  earnings: 'Guanys',
};

const PROOF_OF_DELIVERY_MESSAGES: Translations['PROOF_OF_DELIVERY_MESSAGES'] = {
  labels: {
    signature: 'Signatura',
    signaturePad: 'Signatura',
    signatureHint: 'Signa amb el dit',
    signed: 'Signat',
    clear: 'Esborra la signatura',
    typeName: 'O escriu el teu nom',
    typeNamePlaceholder: 'Nom complet',
    photo: 'Foto',
    photoHint: "On l'has deixat, o el paquet amb el destinatari.",
    code: "Codi d'entrega",
    codeHint: 'Demana al destinatari que llegeixi el codi de la seva app.',
    recipient: "Qui l'ha rebut",
    recipientPlaceholder: 'Nom',
    note: 'Nota',
    notePlaceholder: 'Qualsevol cosa que valgui la pena anotar',
    submit: "Confirma l'entrega",
    required: 'Obligatori',
    missing: 'Cal això per poder confirmar.',
    missingSummary: (n) =>
      plural('ca', n, { one: 'Encara falta una cosa', other: 'Encara falten {n} coses' }),
  },
  proofOfDelivery: "Prova d'entrega",
};

const FILE_UPLOAD_MESSAGES: Translations['FILE_UPLOAD_MESSAGES'] = {
  promptWeb: 'Arrossega i deixa anar per pujar o',
  promptNative: 'Toca per',
  selectWeb: 'selecciona',
  selectNative: 'seleccionar un fitxer',
  uploading: (size) => `Pujant ${size}...`,
  uploaded: "S'ha pujat correctament!",
  unsupported: (extensions) => `Només s'admeten fitxers ${extensions}`,
  tooLarge: (max) => `El fitxer supera ${max}`,
  max: (size) => `(màx. ${size})`,
  uploadFile: 'Puja un fitxer',
};

const POPOVER_MESSAGES: Translations['POPOVER_MESSAGES'] = {
  popover: 'Finestra emergent',
};

const QUEUE_PANEL_MESSAGES: Translations['QUEUE_PANEL_MESSAGES'] = {
  queueTab: 'Cua',
  recentTab: 'Escoltat recentment',
  close: 'Tanca la cua',
  nextInQueue: 'Següent a la cua',
  nextFrom: (c) => `Següent de: ${c}`,
  nextUp: 'A continuació',
  clearQueue: 'Buida la cua',
  reorder: (t) => `Reordena ${t}`,
  reorderHint: 'Arrossega o fes servir les tecles de fletxa',
  moveUp: 'Mou amunt',
  moveDown: 'Mou avall',
  remove: 'Treu de la cua',
  moved: (t, p, n) => `${t} s'ha mogut a la posició ${p} de ${n}`,
  emptyQueue: 'La teva cua és buida',
  emptyQueueHint: 'Afegeix cançons i episodis per escoltar-los a continuació.',
  emptyRecent: 'Encara no has reproduït res',
};

const HOVER_CARD_MESSAGES: Translations['HOVER_CARD_MESSAGES'] = {
  hoverCard: 'Targeta de previsualització',
};

const NOTE_EDITOR_MESSAGES: Translations['NOTE_EDITOR_MESSAGES'] = {
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
};

const MEDIA_SHELF_MESSAGES: Translations['MEDIA_SHELF_MESSAGES'] = {
  filters: 'Filtres',
  showAll: 'Mostra-ho tot',
};

const CATEGORY_BAR_MESSAGES: Translations['CATEGORY_BAR_MESSAGES'] = {
  previous: 'Categories anteriors',
  next: 'Categories següents',
};

const CARRIER_QUOTE_MESSAGES: Translations['CARRIER_QUOTE_MESSAGES'] = {
  labels: {
    accept: 'Accepta',
    message: 'Missatge',
    decline: 'Rebutja',
    pickup: 'Recollida',
    eta: 'Arriba',
    vehicle: 'Vehicle',
    jobs: (jobs) => `${jobs} feines`,
    verified: 'Transportista verificat',
    marks: { cheapest: 'Més barat', fastest: 'Més ràpid' },
    showPrice: 'Mostra el desglossament del preu',
    hidePrice: 'Amaga el desglossament del preu',
    priceDetails: 'Desglossament del preu de',
    sort: 'Ordena les ofertes',
    sortOptions: { price: 'Més barat', eta: 'Més ràpid', rating: 'Més ben valorat' },
    count: (n) => plural('ca', n, { one: '{n} oferta', other: '{n} ofertes' }),
    loading: "S'estan carregant les ofertes",
  },
  emptyTitle: 'Encara no hi ha ofertes',
  emptyDescription:
    'Els transportistes estan mirant el teu enviament. Les primeres ofertes solen arribar en pocs minuts.',
  list: 'Ofertes',
  priceDetailsFor: (name) => `Desglossament del preu de ${name}`,
};

const TEXT_FIELD_MESSAGES: Translations['TEXT_FIELD_MESSAGES'] = {
  showPassword: 'Mostra la contrasenya',
  hidePassword: 'Amaga la contrasenya',
  required: 'obligatori',
};

const CHAT_SCREEN_MESSAGES: Translations['CHAT_SCREEN_MESSAGES'] = {
  call: 'Truca',
  videoCall: 'Videotrucada',
  searchInConversation: 'Cerca a la conversa',
  connecting: "S'està connectant…",
  verified: 'Verificat',
  bot: 'Bot',
  channel: 'Canal',
  clearSelection: 'Esborra la selecció',
  forward: 'Reenvia',
  pin: 'Fixa',
  selectedCount: (n) => plural('ca', n, { one: '{n} seleccionat', other: '{n} seleccionats' }),
  pinnedList: 'Mostra els missatges fixats',
  pinnedClose: 'Amaga la barra de fixats',
  pinnedUnpin: 'Deixa de fixar aquest missatge',
  pinnedMessage: 'Missatge fixat',
  pinnedMessageNumber: (n) => `Missatge fixat núm. ${n}`,
  scrollToBottom: 'Vés als missatges més recents',
  jumpToMention: 'Vés a la menció',
  emptyTitle: 'Encara no hi ha missatges',
  info: 'Informació',
  members: 'Membres',
  addMember: 'Afegeix membres',
  memberSearch: 'Cerca membres',
  noMembers: "No s'ha trobat cap membre",
  owner: 'Propietari',
  admin: 'Administrador',
  resizeList: 'Canvia la mida de la llista de converses',
};

const CONTEXT_MENU_MESSAGES: Translations['CONTEXT_MENU_MESSAGES'] = {
  contextMenu: 'Menú contextual',
};

const SORTABLE_MEDIA_MESSAGES: Translations['SORTABLE_MEDIA_MESSAGES'] = {
  photo: (p, t) => `Foto ${p} de ${t}`,
  cover: 'Portada',
  moveEarlier: (p) => `Mou la foto ${p} abans`,
  moveLater: (p) => `Mou la foto ${p} després`,
  remove: (p) => `Treu la foto ${p}`,
  retry: (p) => `Torna a pujar la foto ${p}`,
  uploading: (p) => `S'està pujant la foto ${p}`,
  failed: "No s'ha pogut pujar",
  add: 'Afegeix fotos',
  moved: (p, t) => `S'ha mogut a la posició ${p} de ${t}`,
  photos: 'Fotos',
};

const CONNECTION_DOTS_MESSAGES: Translations['CONNECTION_DOTS_MESSAGES'] = {
  connecting: 'Connectant',
};

const CHAT_PEOPLE_MESSAGES: Translations['CHAT_PEOPLE_MESSAGES'] = {
  newGroup: {
    photo: 'Tria una foto del grup',
    name: 'Nom del grup',
    namePlaceholder: 'Posa nom a aquest grup',
    description: 'Descripció',
    descriptionPlaceholder: 'Per a què serveix aquest grup?',
    members: (n) => plural('ca', n, { one: '{n} membre', other: '{n} membres' }),
    addMembers: 'Afegeix membres',
    remove: (name) => `Treu ${name}`,
  },
  member: {
    owner: 'Propietari',
    admin: 'Administrador',
    promote: 'Fes administrador',
    restrict: 'Restringeix',
    remove: 'Treu del grup',
    actions: (name) => `Accions de ${name}`,
  },
  story: {
    close: 'Tanca la història',
    previous: 'Història anterior',
    next: 'Història següent',
    mute: 'Silencia la història',
    unmute: 'Activa el so de la història',
    more: 'Opcions de la història',
    replyPlaceholder: 'Respon…',
    send: 'Envia la resposta',
    progress: (index, count) => `Història ${index + 1} de ${count}`,
    react: (emoji) => `Reacciona amb ${emoji}`,
  },
  searchMembers: 'Cerca membres',
  share: 'Comparteix',
  postOptions: 'Opcions de la publicació',
  pinned: 'Fixada',
  views: (c) => plural('ca', c, { one: `${c} visualització`, other: `${c} visualitzacions` }),
  forwards: (c) => plural('ca', c, { one: `${c} reenviament`, other: `${c} reenviaments` }),
  jumpTo: (letter) => `Ves a la ${letter}`,
  add: 'Afegeix',
  added: 'Afegit',
  actionOn: (action, name) => `${action}: ${name}`,
};

const MULTI_AGENT_CHAT_MESSAGES: Translations['MULTI_AGENT_CHAT_MESSAGES'] = {
  pickerAction: (editing: boolean, count: number) =>
    editing
      ? 'Desa els canvis'
      : 'Inicia el xat' +
        (count ? ' · ' + plural('ca', count, { one: '{n} agent', other: '{n} agents' }) : ''),
  you: 'Tu',
  responseFailed: '{0} no ha pogut respondre. Torna-ho a provar.',
  editAgentTitle: 'Edita l’agent',
  aLittleHelp: 'Una mica d’ajuda',
  aFewMindsOneConversation: 'Unes quantes ments. Una conversa.',
  aLittleRoomForSomethingNew: 'Un petit espai per a alguna cosa nova',
  accountDetails: 'Detalls del compte',
  add: 'Afegeix',
  add2: 'Afegeix {0}',
  added: 'Afegit',
  addedToYourWorkspace: "S'ha afegit al vostre espai de treball",
  agent: 'Agent immobiliari',
  agentConversation: "Conversa de l'agent",
  appearance: 'Aparença',
  apps: 'Aplicacions · {0}',
  availability: 'Disponibilitat',
  backToMarketplace: 'Tornar al mercat',
  billing: 'Facturació',
  bitbucket: 'Bitbucket',
  bloom: 'Bloom',
  bots: 'Bots',
  bringYourAgentsIntoOneChat: 'Porta els teus agents en un sol xat.',
  category: 'Categoria',
  chatActions: 'Accions de xat',
  chatList: 'Llista de xat',
  chatName: 'Nom del xat',
  chatRemoved: "S'ha eliminat el xat",
  chatWithYourAgents: 'Xateja amb els teus agents',
  chooseAnAgentOrCreateYourOwn: 'Tria un agent o crea el teu propi per iniciar una conversa.',
  chooseWhoSJoiningTheConversation: "Tria qui s'uneix a la conversa.",
  chooseYourTeammates: 'Tria els teus companys',
  closeMarketplace: 'Tancar el mercat',
  closeSearch: 'Tanca la cerca',
  company: 'Empresa',
  companyDetails: "Dades de l'empresa",
  completionSound: 'So de finalització',
  connectedAccount: 'Compte connectat',
  connector: 'Connector',
  conversationIDCopied: "S'ha copiat l'identificador de la conversa",
  conversationCopied: "S'ha copiat la conversa",
  conversationOptions: 'Opcions de conversa',
  conversations: 'Converses',
  copied: 'Copiat',
  copyConversation: 'Copia la conversa',
  copyConversationID: "Copia l'identificador de conversa",
  copyResponse: 'Copia la resposta',
  couldnTCopyPleaseTryAgain: "No s'ha pogut copiar. Si us plau, torna-ho a provar.",
  create: 'Crear',
  createANewBot: 'Crea un bot nou',
  createBotOrChat: 'Crea bot o xat',
  criticalRequests: 'Sol·licituds crítiques',
  customize: 'Personalitza',
  customizeANewTeammate: "Personalitza un nou company d'equip.",
  dateOfBirth: 'Data de naixement',
  demoIntegrationAddingSavesItToThis:
    'Integració de demostració. Afegir-lo es desa en aquest navegador; no hi ha cap compte extern connectat.',
  desktopApp: "Aplicació d'escriptori",
  details: 'Detalls',
  developer: 'Desenvolupador',
  deviceID: 'ID del dispositiu',
  discover: 'Descobreix',
  dispatchAlerts: "Alertes d'enviament",
  editConversationAgents: 'Edita els agents de conversa',
  editBot: 'Edita el bot',
  editGroup: 'Edita el grup',
  editAgent: 'Edita {0}',
  email: 'Correu',
  everydayEssentials: 'Elements imprescindibles per al dia a dia',
  exploreMarketplace: 'Exploreu el mercat',
  explorePlugins: 'Exploreu els connectors',
  explorePluginsAndBotsToBuildYour: 'Exploreu connectors i bots per crear el vostre equip.',
  findYourNextTeammate: "Troba el teu proper company d'equip",
  findYourNextToolOrTeammate: "Troba la teva propera eina o company d'equip",
  firstName: 'Nom',
  folders: 'Carpetes',
  general: 'General',
  getNotifiedWhenTheModeNeedsTo:
    'Rebeu una notificació quan el mode hagi de prendre una decisió crítica',
  git: 'Git',
  github: 'GitHub',
  gitlab: 'GitLab',
  helpfulResponse: 'Resposta útil',
  inTheBrowser: 'Al navegador',
  inThisConversation: 'En aquesta conversa',
  includes: 'Inclou',
  insideTheApp: "Dins de l'aplicació",
  installed: 'Instal·lat',
  integrations: 'Integracions',
  iLlApproachThisFromThePerspective: 'Ho abordaré des de la perspectiva de {0}.',
  lastName: 'Cognoms',
  limits: 'Límits',
  logOutFromAllDevices: 'Tanqueu la sessió de tots els dispositius',
  logout: 'Tanca la sessió',
  manage: 'Gestiona',
  manageLimits: 'Gestiona els límits',
  marketplace: 'Mercat',
  marketplaceLinkCopied: "S'ha copiat l'enllaç del mercat",
  marketplaceListings: 'Llistes del mercat',
  meetYourNextTeammate: "Coneix el teu proper company d'equip",
  messages: 'Missatges',
  noConversationsFound: "No s'han trobat converses.",
  noMatchesYet: 'Encara no hi ha cap coincidència',
  notifications: 'Notificacions',
  openConversations: 'Converses obertes',
  openPullRequestLinksInsideYourApp:
    "Obriu els enllaços de sol·licitud d'extracció dins de la vostra aplicació",
  openTheMarketplaceToExplorePluginsAnd:
    "Obriu el Marketplace per explorar connectors i bots. Utilitzeu el menú d'una conversa per editar l'aparença i els detalls del bot. Trieu una expressió de la roda de les emocions. Desplaceu-vos o arrossegueu l'arc de forma, o utilitzeu les tecles de fletxa per explorar les formes.",
  prDestination: 'PR destinació',
  people: 'Persones',
  personal: 'Personal',
  pinChat: 'Fixa el xat',
  pinnedChat: 'Xat fixat',
  plugins: 'Complements',
  profile: 'Perfil',
  public: 'Pública',
  publicProfile: 'Perfil públic',
  pullRequests: "Sol·licituds d'extracció",
  pushNotificationOnYourPhoneWhenThe:
    "Envia una notificació al teu telèfon quan l'aplicació t'envia un missatge",
  remove: 'Treu',
  removeChat: 'Elimina el xat',
  renameChat: 'Canvia el nom del xat',
  responseCopied: "S'ha copiat la resposta",
  reviewProvider: 'Revisa el proveïdor',
  rulesAndWorkflows: 'Regles i fluxos de treball',
  saveName: 'Desa el nom',
  sayHelloTo: 'Saludeu a {0}',
  searchConversations: 'Cerca converses',
  searchConversations2: 'Cerca converses...',
  searchMarketplace: 'Cerca al mercat',
  selectGithubOrOtherProvidersForReviews:
    'Seleccioneu Github o altres proveïdors per obtenir ressenyes',
  selectedAgents: 'Agents seleccionats: {0}',
  sendWithEnterUseShiftEnterFor:
    'Envia amb Intro. Utilitzeu Maj + Retorn per a una línia nova. Els vostres canvis es mantenen en aquest navegador.',
  settings: 'Configuració',
  share: 'Comparteix',
  showFundamentalNotificationsWhenAnAgentCompletes:
    'Mostra les notificacions fonamentals quan un agent completa una tasca',
  signOut: 'Tanca la sessió',
  skills: 'Habilitats',
  skills2: 'Habilitats · {0}',
  soundEffectATaskIsCompleted: "Efecte de so una tasca s'ha completat",
  startAConversation: 'Inicia una conversa',
  startAGroupChat: 'Inicia un xat de grup',
  startChat: 'Inicia el xat',
  storage: 'Emmagatzematge',
  support: 'Suport',
  systemNotifications: 'Notificacions del sistema',
  thinkingTogether: 'Pensant junts...',
  thinking: 'Pensant...',
  today: 'Avui',
  tools: 'Eines',
  toolsForYourWorkflow: 'Eines per al vostre flux de treball',
  tryAnotherNameCategoryOrKeyword: 'Prova amb un altre nom, categoria o paraula clau.',
  ultra149Mo: 'Ultra 149 $/mes',
  unhelpfulResponse: 'Resposta poc útil',
  unpinChat: 'Deixa de fixar el xat',
  upgradeToMax: 'Passa a Max',
  useToCreateABotOrStart:
    'Utilitzeu + per crear un bot o iniciar una conversa amb diversos agents.',
  viewAdded: 'Visualització afegida {0}',
  viewAll: 'Mostra-ho tot',
  viewTeamProfile: "Veure el perfil de l'equip",
  viewItem: 'Mostra {0}',
  website: 'Lloc web',
  whenEnabledYourProfilePageWillBe:
    'Quan estigui activat, la teva pàgina de perfil serà visible per a tothom',
  youAreOn7xMoreUsageThan: 'Utilitzeu 7 vegades més que Premium',
  youAreOn7xMoreUsageThan2: 'Esteu fent servir 7 vegades més que el normal.',
  areHereSendAMessageToGet: '{0} són aquí. Envia un missatge per obtenir la perspectiva de tothom.',
  itemDetails: '{0} detalls',
  agentThinking: '{0} està pensant',
  by: '{0} · per {1}',
  results: (count: number) => plural('ca', count, { one: '{n} resultat', other: '{n} resultats' }),
  includedSkills: (apps: number, skills: number) =>
    (apps ? plural('ca', apps, { one: '{n} aplicació', other: '{n} aplicacions' }) + ', ' : '') +
    plural('ca', skills, { one: '{n} habilitat', other: '{n} habilitats' }),
};

const translations: Translations = {
  MULTI_AGENT_CHAT_MESSAGES,
  PROJECT_BOARD_MESSAGES: {
    defaultTitle: 'Tasques de disseny de Bloom',
    defaultTeam: 'Equip Bloom',
    openTicket: (code, title) => `Obrir ${code}: ${title}`,
    addTicketTo: (column) => `Afegir tasca a ${column}`,
    board: 'Tauler del projecte',
    controls: 'Controls del tauler',
    navigation: 'Obrir navegació',
    inbox: 'Obrir safata del projecte',
    newTicket: 'Nova tasca',
    columns: 'Columnes del tauler del projecte',
    sortTickets: 'Ordenar tasques',
    filterTickets: 'Filtrar tasques',
    displayOptions: 'Opcions de visualització',
    sort: 'Ordenar',
    filter: 'Filtrar',
    display: 'Visualització',
    manualOrder: 'Ordre manual',
    priority: 'Prioritat',
    title: 'Títol',
    project: 'Projecte',
    allPriorities: 'Totes les prioritats',
    allProjects: 'Tots els projectes',
    clearFilters: 'Esborrar filtres',
    showDone: 'Mostrar columna completades',
    fillScreens: 'Omplir pantalles amples',
    createTicket: 'Crear tasca',
    closeCreate: 'Tancar creació de tasca',
    ticketTitle: 'Títol de la tasca',
    enterTitle: 'Introdueix el títol de la tasca',
    description: 'Descripció',
    descriptionArea: 'Àrea de descripció',
    status: 'Estat',
    urgency: 'Urgència',
    assignee: 'Responsable',
    unassigned: 'Sense assignar',
    keepCreating: 'Continuar creant',
    cancel: 'Cancel·lar',
    addTicket: 'Afegir tasca',
    sortTitle: 'Ordenar per títol',
    noTickets: 'No hi ha incidències aquí',
    favoriteAdd: 'Afegir als preferits',
    favoriteRemove: 'Treure dels preferits',
    copyLink: 'Copiar enllaç de la tasca',
    actions: 'Accions de la tasca',
    editDescription: 'Editar descripció',
    copyId: 'Copiar ID de la tasca',
    reopen: 'Reobrir tasca',
    markDone: 'Marcar com a completada',
    closeDetails: 'Tancar detalls de la tasca',
    linkCopied: 'Enllaç de la tasca copiat',
    idCopied: 'ID de la tasca copiat',
    copyFailed: 'No s’ha pogut copiar. Torna-ho a provar.',
    createdBy: 'Creada per',
    saveDescription: 'Desar descripció',
    ticketDescription: 'Descripció de la tasca',
    properties: 'Propietats',
    editAssignees: 'Editar responsables',
    resources: 'Recursos',
    tokens: 'Tokens consumits',
    comments: 'Comentaris',
    you: 'Tu',
    justNow: 'Ara mateix',
    addComment: 'Afegir un comentari',
    enterComment: 'Introdueix el teu comentari',
    postComment: 'Publicar comentari',
    moveUp: 'Moure amunt',
    moveDown: 'Moure avall',
    nextColumn: 'Moure a la columna següent',
    previousColumn: 'Moure a la columna anterior',
    keyboardHint:
      'Prem Retorn per obrir. Espai recull, les fletxes mouen, espai deixa anar i Esc cancel·la.',
  },

  AGENT_CREATOR_MESSAGES,
  AGENT_AVATAR_MESSAGES: { label: 'Avatar de l’agent', unavailable: 'Avatar no disponible' },
  COMMON_MESSAGES,
  SURFACES_MESSAGES,
  CONTACT_CARD_MESSAGES,
  CHAT_LIST_MESSAGES,
  NOTE_CARD_MESSAGES,
  DIALOG_MESSAGES,
  ALERT_DIALOG_MESSAGES,
  SIDEBAR_MESSAGES,
  FILE_SIZE_UNITS,
  CARD_FORM_MESSAGES,
  CHAT_COMPOSER_MESSAGES,
  MAIL_COMPOSE_MESSAGES,
  MEDIA_PLAYER_MESSAGES,
  ADDRESS_MESSAGES,
  CREATOR_STUDIO_MESSAGES,
  PROPERTY_INSIGHTS_MESSAGES,
  MAP_MARKER_MESSAGES,
  LISTING_ACTIONS_MESSAGES,
  AGENT_PROGRESS_MESSAGES,
  CALENDAR_MESSAGES,
  LISTING_DETAILS_MESSAGES,
  PRICE_BREAKDOWN_MESSAGES,
  DATE_PICKER_MESSAGES,
  SHIPMENT_REQUEST_MESSAGES,
  LABEL_MESSAGES,
  CHECKOUT_SUMMARY_MESSAGES,
  VEHICLE_PICKER_MESSAGES,
  COMPOSER_PANEL_MESSAGES,
  MESSAGE_BUBBLE_MESSAGES,
  PAYMENT_STATUS_MESSAGES,
  AVATAR_MESSAGES,
  PLACE_CARD_MESSAGES,
  SOCIAL_BUTTON_MESSAGES,
  QUESTIONNAIRE_MESSAGES,
  MAP_CONTROLS_MESSAGES,
  PAYMENT_METHOD_MESSAGES,
  AVATAR_GROUP_MESSAGES,
  MENUBAR_MESSAGES,
  AGENT_THINKING_MESSAGES,
  AI_CHAT_MESSAGES,
  COMMAND_MESSAGES,
  MUSIC_LIBRARY_MESSAGES,
  LISTING_CARD_MESSAGES,
  NAVIGATION_BANNER_MESSAGES,
  LOCATION_PUCK_MESSAGES,
  CAROUSEL_MESSAGES,
  ORDER_STATUS_MESSAGES,
  RATING_MESSAGES,
  LISTING_EDITOR_MESSAGES,
  MEDIA_HEADER_MESSAGES,
  MENU_ITEM_MESSAGES,
  PAGINATION_MESSAGES,
  LEAD_SCORE_MESSAGES,
  DIRECTIONS_MESSAGES,
  CART_PANEL_MESSAGES,
  MEDIA_CARD_MESSAGES,
  JOB_BOARD_MESSAGES,
  FLOATING_MESSAGES,
  AGENT_CHAT_MESSAGES,
  WEB_SEARCH_MESSAGES,
  MAIL_THREAD_MESSAGES,
  NOTIFICATION_CENTER_MESSAGES,
  CHART_CARDS_MESSAGES,
  CODE_MESSAGES,
  OUTLINE_NAV_MESSAGES,
  STEPPER_MESSAGES,
  CALL_UI_MESSAGES,
  RECENT_HIRES_CARD_MESSAGES,
  MAIL_LIST_MESSAGES,
  IMPORTANT_ALERTS_CARD_MESSAGES,
  STAT_CARDS_MESSAGES,
  SHAPE_MESSAGES,
  TENANCY_MESSAGES,
  DATA_TABLE_MESSAGES,
  ERROR_BOUNDARY_MESSAGES,
  AI_PROFILE_CARD_MESSAGES,
  BREADCRUMB_MESSAGES,
  MESSAGE_MEDIA_MESSAGES,
  PIPELINE_MESSAGES,
  STAY_SEARCH_MESSAGES,
  AUTH_CARD_MESSAGES,
  TRACK_LIST_MESSAGES,
  LYRICS_MESSAGES,
  ACTIVITY_FEED_MESSAGES,
  PLACE_REVIEWS_MESSAGES,
  DELIVERY_SLOT_MESSAGES,
  PLACE_LIST_MESSAGES,
  HOME_SEARCH_MESSAGES,
  OFFERING_BADGE_MESSAGES,
  MAP_ATTRIBUTION_MESSAGES,
  SLIDER_MESSAGES,
  SELECT_MESSAGES,
  ZOOMABLE_MEDIA_GALLERY_MESSAGES,
  NOTIFICATION_MESSAGES,
  PHONE_INPUT_MESSAGES,
  VENDOR_CARD_MESSAGES,
  CHAT_INDICATORS_MESSAGES,
  MEDIA_CONTROLS_MESSAGES,
  INPUT_OTP_MESSAGES,
  PLACE_DETAILS_MESSAGES,
  APP_SHELL_MESSAGES,
  ROUTE_STOPS_MESSAGES,
  SEARCH_MESSAGES,
  TAG_FIELD_MESSAGES,
  STAY_FILTERS_MESSAGES,
  SETTINGS_MODAL_MESSAGES,
  EVICTION_MESSAGES,
  BOOKING_MESSAGES,
  AGENT_LIMITS_CARD_MESSAGES,
  SWIPE_ROW_MESSAGES,
  PATIENT_INFO_CARD_MESSAGES,
  THEME_TOGGLE_MESSAGES,
  EARNINGS_MESSAGES,
  PROOF_OF_DELIVERY_MESSAGES,
  FILE_UPLOAD_MESSAGES,
  POPOVER_MESSAGES,
  QUEUE_PANEL_MESSAGES,
  HOVER_CARD_MESSAGES,
  NOTE_EDITOR_MESSAGES,
  MEDIA_SHELF_MESSAGES,
  CATEGORY_BAR_MESSAGES,
  CARRIER_QUOTE_MESSAGES,
  TEXT_FIELD_MESSAGES,
  CHAT_SCREEN_MESSAGES,
  CONTEXT_MENU_MESSAGES,
  SORTABLE_MEDIA_MESSAGES,
  CONNECTION_DOTS_MESSAGES,
  CHAT_PEOPLE_MESSAGES,
};

export default translations;
