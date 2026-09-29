// Bloom's de strings for every family. Loaded on demand by
// `loadBloomLanguage` (src/locale/translations.ts), the ONLY importer of this
// module, so a bundler gives each language one chunk of its own.
import type { Translations } from './types';
import { priceName as booking_priceName } from '../../booking/message-helpers';
import { compactDuration as calendar_compactDuration } from '../../calendar/message-helpers';
import { corner as callUi_corner } from '../../call-ui/message-helpers';
import { plural } from '../plural';
import { countOf as mapMarker_countOf } from '../../map-marker/message-helpers';
import { words as navigationBanner_words, midSentence as navigationBanner_midSentence } from '../../navigation-banner/message-helpers';
import { withReviews as placeCard_withReviews, countOf as placeCard_countOf } from '../../place-card/message-helpers';
import { countForms as rating_countForms } from '../../rating/message-helpers';
import { shapeNames as shapes_shapeNames } from '../../shapes/message-helpers';
import { has as vendorCard_has, counted as vendorCard_counted } from '../../vendor-card/message-helpers';

const CALL_UI_MESSAGES__CORNERS = { 'top-left': 'oben links', 'top-right': 'oben rechts', 'bottom-left': 'unten links', 'bottom-right': 'unten rechts' };

const MESSAGE_MEDIA_MESSAGES__items = (n: number) => plural('de', n, { one: '{n} Element', other: '{n} Elemente' });

const COMMON_MESSAGES: Translations['COMMON_MESSAGES'] = {
  close: 'Schließen',
  dismiss: 'Ausblenden',
  back: 'Zurück',
  goBack: 'Zurückgehen',
  loading: 'Wird geladen',
  more: 'Mehr',
  moreOptions: 'Weitere Optionen',
  moreActions: 'Weitere Aktionen',
  progress: 'Fortschritt',
  stepOf: (step, total) => `Schritt ${step} von ${total}`,
  labelFor: (label, subject) => `${label} für ${subject}`,
  tapToClose: 'Zum Schließen tippen',
  cancel: 'Abbrechen',
  done: 'Fertig',
  save: 'Speichern',
  delete: 'Löschen',
  edit: 'Bearbeiten',
  remove: 'Entfernen',
  retry: 'Erneut versuchen',
  search: 'Suchen',
  showMore: 'Mehr anzeigen',
  showLess: 'Weniger anzeigen',
  next: 'Weiter',
  previous: 'Vorherige',
  open: 'Öffnen',
  menu: 'Menü',
  copy: 'Kopieren',
  copied: 'Kopiert',
  send: 'Senden',
  clear: 'Leeren',
  seeAll: 'Alle anzeigen',
  resizePanels: 'Bereichsgröße ändern',
};

const SURFACES_MESSAGES: Translations['SURFACES_MESSAGES'] = { confirm: 'Bestätigen', ok: 'Okay' };

const CONTACT_CARD_MESSAGES: Translations['CONTACT_CARD_MESSAGES'] = {
  channels: {
    email: { action: 'E-Mail', name: (s) => `E-Mail an ${s}` },
    phone: { action: 'Anrufen', name: (s) => `${s} anrufen` },
    chat: { action: 'Nachricht', name: (s) => `Nachricht an ${s}` },
    meeting: { action: 'Meeting', name: (s) => `Meeting mit ${s} planen` },
    video: { action: 'Video', name: (s) => `Videoanruf mit ${s} starten` },
    website: { action: 'Website', name: (s) => `Website von ${s} öffnen` },
  },
  labelsFor: (name) => `Labels von ${name}`,
  owner: 'Verantwortlich',
};

const CHAT_LIST_MESSAGES: Translations['CHAT_LIST_MESSAGES'] = {
  item: { draft: 'Entwurf:', pinned: 'Angeheftet', muted: 'Stummgeschaltet', verified: 'Verifiziert', channel: 'Kanal', bot: 'Bot', group: 'Gruppe' },
  search: { chat: 'Chats', message: 'Nachrichten', contact: 'Kontakte', empty: 'Keine Ergebnisse' },
  list: 'Chats',
  emptyTitle: 'Noch keine Unterhaltungen',
  emptyDescription: 'Starte einen Chat, dann erscheint er hier.',
  searchResults: 'Suchergebnisse',
  searchChats: 'Chats durchsuchen',
  clearSearch: 'Suche löschen',
  newChat: 'Neuer Chat',
  archived: 'Archiviert',
  archivedName: (label, n) => `${label}, ${plural('de', n, { one: '{n} Chat', other: '{n} Chats' })}`,
  folderName: (label, n) => `${label}, ${n} ungelesen`,
  stories: 'Storys',
  ownStory: 'Deine Story',
  addStory: 'Zu deiner Story hinzufügen',
  storyOf: (name) => `Story von ${name}`,
};

const NOTE_CARD_MESSAGES: Translations['NOTE_CARD_MESSAGES'] = {
  pinned: 'Angeheftet',
  locked: 'Geschützt',
  attachments: (n) => plural('de', n, { one: '{n} Anhang', other: '{n} Anhänge' }),
  select: 'Notiz auswählen',
  checklistDone: 'Erledigt',
  checklistTodo: 'Offen',
  more: (n) => `${n} weitere`,
};

const DIALOG_MESSAGES: Translations['DIALOG_MESSAGES'] = {
  view: 'Ansicht',
  dismissDialog: 'Dialog schließen',
  dismissNamed: (label) => `${label} schließen`,
};

const ALERT_DIALOG_MESSAGES: Translations['ALERT_DIALOG_MESSAGES'] = {
  confirm: 'Bestätigen',
};

const SIDEBAR_MESSAGES: Translations['SIDEBAR_MESSAGES'] = {
  sidebar: 'Seitenleiste',
  collapse: 'Seitenleiste einklappen',
  expand: 'Seitenleiste ausklappen',
  close: 'Seitenleiste schließen',
  quickSearch: 'Schnellsuche',
  searchPlaceholder: 'Navigation durchsuchen…',
  searchPlaceholderCompact: 'Suchen...',
  filter: 'Navigation filtern',
  clearSearch: 'Navigationssuche löschen',
  noResults: 'Keine Ergebnisse',
  mode: 'Modus',
  upgrade: 'Upgrade',
  usersWithAccess: 'Nutzer mit Zugriff',
  addUser: 'Nutzer hinzufügen',
  manage: 'Verwalten',
  accountMenu: 'Kontomenü',
  teamMenu: (team) => `Menü von ${team}`,
};

const FILE_SIZE_UNITS: Translations['FILE_SIZE_UNITS'] = { byte: 'B', kilobyte: 'KB', megabyte: 'MB', gigabyte: 'GB' };

const CARD_FORM_MESSAGES: Translations['CARD_FORM_MESSAGES'] = {
  labels: { number: 'Kartennummer', expiry: 'Ablaufdatum', securityCode: 'Sicherheitscode', name: 'Name auf der Karte', postcode: 'Postleitzahl', country: 'Land' },
  selectCountry: 'Land auswählen',
};

const CHAT_COMPOSER_MESSAGES: Translations['CHAT_COMPOSER_MESSAGES'] = {
  attach: 'Anhängen',
  emoji: 'Emoji',
  camera: 'Kamera',
  mic: 'Sprachnachricht aufnehmen',
  message: 'Nachricht',
  enterHint: 'Eingabe zum Senden · Umschalt + Eingabe für eine neue Zeile',
  modEnterHint: '⌘ + Eingabe zum Senden · Eingabe für eine neue Zeile',
  cancelRecording: 'Aufnahme abbrechen',
  sendVoice: 'Sprachnachricht senden',
  deleteRecording: 'Aufnahme löschen',
  playRecording: 'Aufnahme abspielen',
  pauseRecording: 'Aufnahme pausieren',
  lockRecording: 'Aufnahme fixieren',
  slideToCancel: 'Zum Abbrechen wischen',
  recording: 'Aufnahme läuft',
  searchEmoji: 'Emoji suchen',
  noEmoji: 'Keine Emojis gefunden',
  frequentlyUsed: 'Häufig verwendet',
  skinTone: 'Hautton',
  emojiPicker: 'Emoji-Auswahl',
  moreReactions: 'Weitere Reaktionen',
  quickReactions: 'Schnellreaktionen',
  messageActions: 'Nachrichtenaktionen',
  attachments: 'Anhänge',
  removeAttachment: (name) => `${name} entfernen`,
  suggestions: { mention: 'Personen', command: 'Befehle', emoji: 'Emoji' },
  suggestionVerified: 'Verifiziert',
  searchingSuggestions: 'Suche läuft…',
  noSuggestions: { mention: 'Keine Personen gefunden', command: 'Keine Befehle gefunden', emoji: 'Keine Emojis gefunden' },
  attachmentItems: { gallery: 'Galerie', camera: 'Kamera', file: 'Datei', location: 'Standort', contact: 'Kontakt', poll: 'Umfrage', music: 'Musik' },
};

const MAIL_COMPOSE_MESSAGES: Translations['MAIL_COMPOSE_MESSAGES'] = {
  to: 'An',
  cc: 'Cc',
  bcc: 'Bcc',
  subject: 'Betreff',
  showCopies: 'Cc Bcc',
  hideCopies: 'Cc und Bcc ausblenden',
  removeRecipient: (name) => `${name} entfernen`,
  suggestions: 'Kontakte',
  send: COMMON_MESSAGES.send,
  sending: 'Wird gesendet',
  attach: 'Datei anhängen',
  discard: 'Entwurf verwerfen',
  minimize: 'Minimieren',
  expand: 'Vergrößern',
  close: COMMON_MESSAGES.close,
  title: 'Neue Nachricht',
};

const MEDIA_PLAYER_MESSAGES: Translations['MEDIA_PLAYER_MESSAGES'] = {
  lyrics: 'Songtext',
  queue: 'Warteschlange',
  devices: 'Mit einem Gerät verbinden',
  fullscreen: 'Vollbild',
  openPlayer: 'Player öffnen',
  currentDevice: 'Aktuelles Gerät',
  listeningOn: 'Wiedergabe auf',
  listeningOnDevice: (d) => `Wiedergabe auf ${d}`,
  selectDevice: 'Gerät auswählen',
  noDevices: 'Keine weiteren Geräte gefunden',
  deviceHelp: 'Dein Gerät wird nicht angezeigt?',
  playbackSpeed: 'Wiedergabegeschwindigkeit',
  sleepTimer: 'Sleep-Timer',
  sleepOff: 'Aus',
  endOfEpisode: 'Ende der Folge',
  oneHour: '1 Stunde',
  minutes: (n) => plural('de', n, { one: '{n} Minute', other: '{n} Minuten' }),
  stopsIn: (r) => `Stoppt in ${r}`,
  shuffle: 'Zufallswiedergabe',
  repeat: 'Wiederholen',
  repeatOne: 'Titel wiederholen',
  skipBack: (n) => plural('de', n, { one: '{n} Sekunde zurück', other: '{n} Sekunden zurück' }),
  skipForward: (n) => plural('de', n, { one: '{n} Sekunde vor', other: '{n} Sekunden vor' }),
  closePlayer: 'Player schließen',
  share: 'Teilen',
  showLyrics: 'Songtext anzeigen',
};

const ADDRESS_MESSAGES: Translations['ADDRESS_MESSAGES'] = { emptyTitle: 'Noch nichts vorhanden', addresses: 'Adressen' };

const CREATOR_STUDIO_MESSAGES: Translations['CREATOR_STUDIO_MESSAGES'] = {
  releaseTypes: { single: 'Single', ep: 'EP', album: 'Album' },
  releaseStatuses: {
    draft: 'Entwurf',
    'in-review': 'In Prüfung',
    scheduled: 'Geplant',
    live: 'Veröffentlicht',
    rejected: 'Abgelehnt',
    takedown: 'Entfernt',
  },
  creditRoles: {
    songwriter: 'Songwriter',
    producer: 'Produzent',
    composer: 'Komponist',
    performer: 'Interpret',
    lyricist: 'Texter',
    'mixing-engineer': 'Mix-Engineer',
    'mastering-engineer': 'Mastering-Engineer',
  },
  periods: { '7d': '7 Tage', '28d': '28 Tage', '12m': '12 Monate', all: 'Gesamter Zeitraum' },
  artworkNotSquare: (w, h) => `Das Cover muss quadratisch sein – dieses Bild ist ${w}×${h} px groß.`,
  artworkTooSmall: (w, h, min) => `Das Cover ist zu klein (${w}×${h} px). Lade mindestens ${min}×${min} px hoch.`,
  audience: { title: 'Publikum', period: 'Zeitraum' },
  breakdown: {
    locations: 'Top-Standorte',
    cities: 'Städte',
    countries: 'Länder',
    age: 'Alter',
    gender: 'Geschlecht',
    sources: 'Hörquellen',
    metric: 'Hörer',
  },
  streams: {
    metrics: 'Diagrammwert',
    summary: (metric, releases) =>
      releases ? `${metric} im Zeitverlauf; Releases: ${releases}` : `${metric} im Zeitverlauf`,
  },
  topTracks: {
    title: 'Top-Titel',
    rank: '#',
    rankName: 'Platz',
    track: 'Titel',
    streams: 'Streams',
    listeners: 'Hörer',
    saves: 'Gespeichert',
    trend: 'Trend',
    trends: { up: 'Steigend', down: 'Fallend', flat: 'Unverändert', new: 'Neueinstieg' },
    newBadge: 'Neu',
    empty: 'In diesem Zeitraum noch keine Streams.',
  },
  tracks: (n) => plural('de', n, { one: '{n} Titel', other: '{n} Titel' }),
  timeline: {
    states: { complete: 'abgeschlossen', current: 'läuft', upcoming: 'nicht begonnen', error: 'erfordert Aufmerksamkeit' },
    label: 'Release-Fortschritt',
  },
  upload: {
    queued: 'In der Warteschlange',
    processing: 'Wird transkodiert…',
    ready: 'Bereit',
    failed: 'Upload fehlgeschlagen',
    remove: (name) => `${name} entfernen`,
    progress: (name) => `${name} wird hochgeladen`,
  },
  artwork: {
    title: 'Cover',
    requirements: '3000×3000 px, JPG oder PNG',
    replace: 'Ersetzen',
    remove: 'Cover entfernen',
    preview: 'Release-Cover',
    upload: 'Cover hochladen',
  },
  credits: {
    title: 'Mitwirkende',
    role: 'Rolle',
    name: 'Name',
    add: 'Mitwirkende hinzufügen',
    remove: (index, name) =>
      name ? `Mitwirkende ${index + 1} (${name}) entfernen` : `Mitwirkende ${index + 1} entfernen`,
    empty: 'Nenne die Songwriter, Produzenten und Interpreten dieses Titels.',
    field: (field, n) => `${field}, Mitwirkende ${n}`,
  },
  artists: {
    add: 'Hinzufügen',
    addTo: (label) => `Hinzufügen: ${label}`,
    remove: (name) => `${name} entfernen`,
  },
  isrc: { hint: 'Format: CC-XXX-YY-NNNNN', invalid: 'Das ist keine gültige ISRC' },
  metadata: {
    title: 'Titelname',
    version: 'Fassung',
    versionPlaceholder: 'Remix, Live, Akustik…',
    explicit: 'Expliziter Text',
    explicitDescription: 'Aktiviere dies, wenn der Titel derbe Sprache oder explizite Themen enthält.',
    genre: 'Genre',
    genrePlaceholder: 'Genre auswählen',
    primaryArtists: 'Hauptinterpreten',
    featuredArtists: 'Gastinterpreten',
    artistPlaceholder: 'Namen eines Interpreten hinzufügen',
    language: 'Sprache des Songtexts',
    languagePlaceholder: 'Sprache auswählen',
    lyrics: 'Songtext',
    lyricsPlaceholder: 'Songtext einfügen, eine Zeile pro gesungener Zeile',
  },
  payout: {
    estimated: 'Geschätzte Einnahmen diesen Monat',
    lastPayout: 'Letzte Auszahlung',
    nextPayout: 'Nächste Auszahlung',
    statements: 'Abrechnungen ansehen',
    chart: 'Monatliche Einnahmen',
  },
  pitch: {
    title: 'Pitch an die Redaktion',
    description: 'Stell der Redaktion dein nächstes Release vor, bevor es erscheint.',
    release: 'Veröffentlichung',
    releasePlaceholder: 'Kommende Veröffentlichung auswählen',
    moods: 'Stimmung',
    genres: 'Genre',
    pitch: 'Dein Pitch',
    pitchPlaceholder: 'Was macht dieses Release besonders? Für wen ist es, und welche Geschichte steckt dahinter?',
    submit: 'Pitch senden',
    tagLimit: (max) => `Bis zu ${max} auswählen`,
    statuses: { submitted: 'Pitch gesendet', accepted: 'Zur Prüfung ausgewählt', declined: 'Diesmal nicht ausgewählt' },
    statusDescriptions: {
      submitted: 'Die Redaktion liest jeden Pitch. Du erhältst vor dem Erscheinungsdatum eine Antwort.',
      accepted: 'Dein Release wird für redaktionelle Playlists in Betracht gezogen.',
      declined: 'Dieses Release wurde nicht ausgewählt. Du kannst dein nächstes pitchen, sobald es geplant ist.',
    },
    edit: 'Pitch bearbeiten',
  },
};

const PROPERTY_INSIGHTS_MESSAGES: Translations['PROPERTY_INSIGHTS_MESSAGES'] = {
  energy: 'Energie',
  pending: 'Ausstehend',
  energyRatingClass: (r) => `Energieeffizienzklasse ${r}`,
  energyRatingStatus: (s) => `Energieeffizienzklasse ${String(s).toLowerCase()}`,
  energyRating: 'Energieeffizienzklasse',
  certificateInProgress: 'Energieausweis in Bearbeitung',
  consumption: 'Verbrauch',
  emissions: 'Emissionen',
  moreEfficient: 'Effizienter',
  lessEfficient: 'Weniger effizient',
  walkTime: (t) => `${t} zu Fuß`,
  scoreOutOf: (d, m) => `${d} von ${m}`,
  pricePerSquareMetre: 'Preis pro Quadratmeter',
  rentHistory: 'Mietverlauf',
  rentHistoryEmpty: 'Für dieses Zuhause gibt es noch keinen Verlauf',
  confidence: { low: 'Geringe Zuverlässigkeit', medium: 'Mittlere Zuverlässigkeit', high: 'Hohe Zuverlässigkeit' },
  aboveEstimate: (p) => `${p} über der Schätzung`,
  belowEstimate: (p) => `${p} unter der Schätzung`,
  fairPrice: 'Fairer Preis',
  estimatedPrice: 'Geschätzter Preis',
  asking: 'Angebotspreis',
  noVerdict: 'Nicht genug Daten für eine Bewertung',
  whyThisEstimate: 'Warum diese Schätzung',
  comparables: (n) =>
    plural('de', n, {
      one: 'Basierend auf {n} vergleichbaren Immobilie',
      other: 'Basierend auf {n} vergleichbaren Immobilien',
    }),
  currentPrice: 'Aktueller Preis',
  now: 'Jetzt',
  noPriceHistory: 'Noch kein Preisverlauf',
  priceHistoryPeriod: 'Zeitraum des Preisverlaufs',
  priceHistory: 'Preisverlauf',
  priceHistoryTrend: (head, a, aw, b, bw) => `${head}: von ${a} (${aw}) auf ${b} (${bw}).`,
};

const MAP_MARKER_MESSAGES: Translations['MAP_MARKER_MESSAGES'] = {
  searchAsMapMoves: 'Beim Verschieben der Karte suchen',
  searchThisArea: 'In diesem Gebiet suchen',
  stays: (n) => mapMarker_countOf('de', n, { one: '{n} Unterkunft', other: '{n} Unterkünfte' }),
};

const LISTING_ACTIONS_MESSAGES: Translations['LISTING_ACTIONS_MESSAGES'] = {
  month: 'Monat',
  rentalStatus: { available: 'Verfügbar', reserved: 'Reserviert', rented: 'Vermietet' },
  rentalStatusMessage: {
    reserved: 'Ein anderer Interessent schließt gerade einen Vertrag ab. Neue Besichtigungen sind pausiert.',
    rented: 'Diese Wohnung ist vermietet und nimmt keine Anfragen mehr an.',
  },
  saleStatus: { available: 'Zu verkaufen', reserved: 'Reserviert', sold: 'Verkauft' },
  saleStatusMessage: {
    reserved: 'Ein Angebot wurde angenommen. Der Makler vereinbart derzeit keine Besichtigungen.',
    sold: 'Diese Immobilie wurde verkauft.',
  },
  requestViewing: 'Besichtigung anfragen',
  apply: 'Bewerben',
  contactAgent: 'Makler kontaktieren',
  requestVisit: 'Besichtigung anfragen',
  makeOffer: 'Angebot machen',
  yourHome: 'Dein Zuhause',
  theirHome: 'Ihr Zuhause',
  dates: 'Daten',
  guests: 'Gäste',
  addDates: 'Daten hinzufügen',
  addGuests: 'Gäste hinzufügen',
  proposeSwap: 'Tausch vorschlagen',
  exchangeModes: { swap: 'Gegenseitiger Tausch', host: 'Gastpunkte', both: 'Beides' },
  scheduleViewing: 'Besichtigung vereinbaren',
  noTimesLeft: 'An diesem Tag sind keine Zeiten mehr frei',
  noteForLandlord: 'Nachricht an den Vermieter',
  day: 'Tag',
  time: 'Uhrzeit',
  submitViewing: 'Besichtigung anfragen',
  inPerson: 'Vor Ort',
  videoCall: 'Videoanruf',
  viewingType: 'Art der Besichtigung',
  yourApplication: 'Deine Bewerbung',
  applicationProgress: 'Fortschritt der Bewerbung',
  progressReady: (done, total) => `${done} von ${total} bereit`,
  applicationStatus: { missing: 'Fehlt', uploaded: 'In Prüfung', verified: 'Bestätigt', rejected: 'Abgelehnt' },
  applicationAction: { upload: 'Hochladen', view: 'Ansehen', replace: 'Ersetzen' },
  itemAction: (action, title) => `${title}: ${action}`,
  mortgage: {
    title: 'Hypothekenrechner',
    price: 'Kaufpreis',
    downPayment: 'Eigenkapital',
    downPaymentPercent: 'Eigenkapital in Prozent',
    percent: 'Prozent',
    term: 'Laufzeit',
    years: 'Jahre',
    rate: 'Zinssatz',
    monthlyPayment: 'Monatliche Rate',
    principal: 'Tilgung',
    interest: 'Zinsen',
    loanAmount: 'Darlehensbetrag',
    totalInterest: 'Zinsen gesamt',
    totalCost: 'Gesamtkosten',
  },
  termYears: (n) => plural('de', n, { one: '{n} Jahr', other: '{n} Jahre' }),
  mortgageDisclaimer:
    'Eine Schätzung, kein Angebot. Gebühren, Steuern und Versicherungen sind nicht enthalten, und es wird ein fester Zinssatz über die gesamte Laufzeit angenommen.',
};

const AGENT_PROGRESS_MESSAGES: Translations['AGENT_PROGRESS_MESSAGES'] = {
  stepsLeft: (n) => plural('de', n, { one: 'Noch {n} Schritt', other: 'Noch {n} Schritte' }),
  allCompleted: 'Alle Schritte abgeschlossen',
  minimize: 'Schritte minimieren',
  expand: 'Schritte einblenden',
  defaultSteps: [
    'Projektdateien lesen',
    'Tokens für den hellen Modus aktualisieren und installieren',
    'Tokens für den dunklen Modus implementieren',
    'Wiederverwendbaren, registrierten Theme-Umschalter hinzufügen',
    'Registry, Lint und Produktions-Build ausführen',
  ],
};

const CALENDAR_MESSAGES: Translations['CALENDAR_MESSAGES'] = {
  newEvent: 'Neuer Termin',
  openNavigation: 'Navigation öffnen',
  month: 'Monat',
  moreEvents: (n) => plural('de', n, { other: '+{n} weitere' }),
  eventDetails: 'Termindetails',
  join: 'Teilnehmen',
  editTimeZone: 'Zeitzone bearbeiten',
  participants: 'Teilnehmende',
  editParticipants: 'Teilnehmende bearbeiten',
  reminders: 'Erinnerungen',
  editReminders: 'Erinnerungen bearbeiten',
  duration: calendar_compactDuration(' Std.', ' Min.', ' '),
  jumpToDate: 'Zu Datum springen',
  previousMonth: 'Vorheriger Monat',
  nextMonth: 'Nächster Monat',
  chooseDate: (month) => `${month}, Datum auswählen`,
  inbox: 'Posteingang',
  inboxMenu: 'Posteingangsmenü',
  addAccount: 'Neues Konto hinzufügen',
};

const LISTING_DETAILS_MESSAGES: Translations['LISTING_DETAILS_MESSAGES'] = {
  ratedOutOf5: (r) => `Bewertet mit ${r} von 5`,
  overallRating: 'Gesamtbewertung',
  unavailable: 'Nicht verfügbar',
  showAllAmenities: (n) =>
    plural('de', n, { one: '{n} Ausstattungsmerkmal anzeigen', other: 'Alle {n} Ausstattungsmerkmale anzeigen' }),
  showAllFeatures: (n) => plural('de', n, { one: '{n} Merkmal anzeigen', other: 'Alle {n} Merkmale anzeigen' }),
  propertyFeatures: 'Objektmerkmale',
  showAllPhotos: 'Alle Fotos anzeigen',
  listingPhotos: 'Fotos des Inserats',
  photoOf: (p, t) => `Foto ${p} von ${t}`,
  photoWithAlt: (a, p, t) => `${a}, Foto ${p} von ${t}`,
  floorPlanOf: (a, p, t) => `${a}, Grundriss ${p} von ${t}`,
  landlord: 'Vermieter',
  agent: 'Makler',
  agency: 'Maklerbüro',
  activeListings: (n) => plural('de', n, { one: '{n} aktives Inserat', other: '{n} aktive Inserate' }),
  verified: 'Verifiziert',
  showPhone: 'Telefonnummer anzeigen',
  call: 'Anrufen',
  messageHost: 'Gastgeber kontaktieren',
  message: 'Nachricht senden',
};

const PRICE_BREAKDOWN_MESSAGES: Translations['PRICE_BREAKDOWN_MESSAGES'] = {
  states: { estimated: 'Geschätzt', pending: 'Ausstehend' },
  showDetails: 'Preisdetails anzeigen',
  hideDetails: 'Preisdetails ausblenden',
  breakdown: 'Preisaufschlüsselung',
  about: (label) => `Über ${label}`,
};

const DATE_PICKER_MESSAGES: Translations['DATE_PICKER_MESSAGES'] = {
  cancel: 'Abbrechen',
  apply: 'Übernehmen',
  previousMonth: 'Vorheriger Monat',
  nextMonth: 'Nächster Monat',
  datePlaceholder: 'Datum auswählen',
  dateLabel: 'Datum',
  rangePlaceholder: 'Zeitraum auswählen',
  rangeLabel: 'Zeitraum',
  startDate: 'Startdatum',
  endDate: 'Enddatum',
  daysSelected: (n) => plural('de', n, { one: '{n} Tag ausgewählt', other: '{n} Tage ausgewählt' }),
  presets: {
    today: 'Heute',
    yesterday: 'Gestern',
    lastWeek: 'Letzte Woche',
    thisMonth: 'Dieser Monat',
    lastMonth: 'Letzter Monat',
    thisYear: 'Dieses Jahr',
    lastYear: 'Letztes Jahr',
    allTime: 'Gesamter Zeitraum',
  },
  meetingTrigger: 'Meeting planen',
  meetingLabel: 'Meeting planen',
  send: 'Einladung senden',
  selectTime: 'Uhrzeit auswählen',
  duration: (n) => plural('de', n, { one: '{n} Minute', other: '{n} Minuten' }),
};

const SHIPMENT_REQUEST_MESSAGES: Translations['SHIPMENT_REQUEST_MESSAGES'] = {
  kinds: {
    envelope: { label: 'Umschlag', description: 'Dokumente, Schlüssel, alles Flache.' },
    parcel: { label: 'Paket', description: 'Ein Karton oder eine Tasche, die eine Person tragen kann.' },
    furniture: { label: 'Möbel', description: 'Ein Sofa, ein Tisch, eine Matratze – zwei Personen an beiden Enden.' },
    pallet: { label: 'Palette', description: 'Verpackt und gestapelt, mit Ladebordwand bewegt.' },
    food: { label: 'Essen', description: 'Eine Restaurantlieferung, richtig temperiert.' },
  },
  sizes: {
    small: 'Bis Schuhkarton – 35 × 25 × 20 cm.',
    medium: 'Bis Handgepäck – 55 × 40 × 25 cm.',
    large: 'Bis Waschmaschine – 85 × 60 × 60 cm.',
    extraLarge: 'Größer – beschreib es in den Notizen.',
  },
  access: { ground: 'Erdgeschoss', stairs: 'Treppe', lift: 'Aufzug' },
  load: {
    kind: 'Was transportieren wir?',
    size: 'Größe',
    weight: 'Gewicht',
    quantity: 'Anzahl',
    quantityValue: (n) => plural('de', n, { one: '{n} Stück', other: '{n} Stück' }),
    notes: 'Sollte der Fahrer noch etwas wissen?',
    notesPlaceholder: 'Zerbrechlich, ein Aufzugscode, wo es abgestellt werden soll…',
  },
  options: { extras: 'Extras', access: 'Zugang an beiden Adressen', window: 'Wann soll es abgeholt werden?' },
  form: {
    route: 'Strecke',
    routeDescription: 'Zuerst die Abholung, zuletzt die Zustellung.',
    load: 'Die Ladung',
    photos: 'Fotos',
    photosDescription: 'Ein Foto der Ladung verbessert die Angebote, die du bekommst, am meisten.',
    options: 'Optionen',
    optionsDescription: 'Jede davon ändert den Preis.',
    price: 'Preis',
  },
  shipmentRequest: 'Transportanfrage',
};

const LABEL_MESSAGES: Translations['LABEL_MESSAGES'] = { required: 'erforderlich' };

const CHECKOUT_SUMMARY_MESSAGES: Translations['CHECKOUT_SUMMARY_MESSAGES'] = {
  title: 'Bestellung prüfen',
  orderSummary: 'Bestellübersicht',
  deliverTo: 'Lieferung an',
  notChosen: 'Noch nicht gewählt',
  opensPicker: 'Öffnet die Auswahl',
  placeOrder: 'Bestellung aufgeben',
  placingOrder: 'Bestellung wird aufgegeben',
};

const VEHICLE_PICKER_MESSAGES: Translations['VEHICLE_PICKER_MESSAGES'] = {
  from: 'Ab',
  fits: (label) => `Was in folgendes Fahrzeug passt: ${label}`,
  unavailable: 'Für diese Ladung nicht verfügbar',
  vehicle: 'Fahrzeug',
  vehicles: {
    bike: { label: 'Lastenrad', capacity: 'Bis 25 kg · 60 × 40 × 40 cm', fits: ['Dokumente', 'Eine Essensbestellung', 'Ein kleiner Karton'] },
    car: { label: 'Auto', capacity: 'Bis 150 kg · 100 × 80 × 60 cm', fits: ['Zwei Koffer', 'Vier Kartons', 'Ein Fahrrad'] },
    van: { label: 'Transporter', capacity: 'Bis 800 kg · 240 × 150 × 140 cm', fits: ['Ein Sofa', 'Ein Einzimmer-Umzug', 'Eine halbe Palette'] },
    boxTruck: { label: 'Kofferaufbau-Lkw', capacity: 'Bis 3.500 kg · 420 × 200 × 210 cm', fits: ['Zwei Paletten', 'Ein Dreizimmer-Umzug', 'Eine Ladebordwand'] },
    refrigerated: { label: 'Kühltransporter', capacity: 'Bis 700 kg · bei 2–8 °C', fits: ['Frische Lebensmittel', 'Gekühltes Catering', 'Blumen'] },
  },
};

const COMPOSER_PANEL_MESSAGES: Translations['COMPOSER_PANEL_MESSAGES'] = {
  message: 'Nachricht',
  add: 'Anhang hinzufügen',
  addMenu: 'Zum Chat hinzufügen',
  permissions: 'Berechtigungen',
  permissionMode: 'Berechtigungsmodus',
  learnMore: 'Mehr erfahren',
  voice: 'Spracheingabe',
  send: 'Nachricht senden',
  stop: 'Generierung stoppen',
  permissionTrigger: (mode) => `Berechtigung: ${mode}`,
  removeFile: (name) => `${name} entfernen`,
  retryFile: (name) => `${name} erneut versuchen`,
  panelPlaceholder: 'Hallo, was brauchst du heute?',
  pillPlaceholder: 'Frag mich etwas',
  pillCompactPlaceholder: 'Frag mich',
  modelSettings: 'Modelleinstellungen',
  models: 'Modelle',
  modelGroup: 'Modell',
  effort: 'Aufwand',
  effortAuto: 'Automatisch',
  faster: 'Schneller',
  smarter: 'Intelligenter',
  quickSearch: 'Schnellsuche',
  searchModels: 'Modelle suchen',
  closeSearch: 'Suche schließen',
  noMatches: 'Keine passenden Modelle',
  providers: 'Anbieter',
  matchingModels: 'Passende Modelle',
  providerModels: (provider) => `Modelle von ${provider}`,
  localFolders: 'Lokale Ordner',
  context: (percent) => `Kontext ${percent} %`,
  effortLevels: ['Niedrig', 'Mittel', 'Ausgewogen', 'Hoch', 'Sehr hoch', 'Maximal'],
  permissionModes: {
    auto: { label: 'Automatisch', description: 'Der Agent entscheidet selbst' },
    manual: { label: 'Manuell', description: 'Vor jeder Änderung nachfragen' },
    plan: { label: 'Planmodus', description: 'Vor dem Fortfahren einen Plan erstellen' },
    bypass: { label: 'Alles umgehen', description: 'Der Agent trifft Berechtigungsentscheidungen' },
  },
  addMenuRows: {
    add: 'Hinzufügen',
    plugins: 'Plugins',
    files: 'Dateien und Ordner',
    goal: 'Ziel',
    goalDescription: 'Ein Ziel für schnellere Ergebnisse setzen',
    plan: 'Planmodus',
    planDescription: 'Komplexe Aufgaben verwalten',
    documents: 'Dokumente',
    documentsDescription: 'Dokumente erstellen und bearbeiten',
    spreadsheets: 'Tabellen',
    spreadsheetsDescription: 'Tabellen erstellen',
    presentations: 'Präsentationen',
    presentationsDescription: 'Marketingmaterial erstellen',
    code: 'Codeblöcke',
    codeDescription: 'Bestehenden Code schreiben und bearbeiten',
  },
};

const MESSAGE_BUBBLE_MESSAGES: Translations['MESSAGE_BUBBLE_MESSAGES'] = {
  forwardedFrom: (name) => `Weitergeleitet von ${name}`,
  deleted: 'Diese Nachricht wurde gelöscht',
  retry: 'Erneut senden',
  addReaction: 'Reaktion hinzufügen',
  replyTo: 'Zur zitierten Nachricht',
  selected: 'Ausgewählt',
  pending: 'Wird gesendet',
  failed: 'Nicht gesendet',
  reactionSelected: 'ausgewählt',
  unread: 'Ungelesene Nachrichten',
  typing: 'Schreibt…',
};

const PAYMENT_STATUS_MESSAGES: Translations['PAYMENT_STATUS_MESSAGES'] = {
  states: { authorising: 'Wird autorisiert', paid: 'Bezahlt', failed: 'Zahlung fehlgeschlagen', refunded: 'Erstattet', pending: 'Zahlung ausstehend' },
  reference: 'Referenz',
};

const AVATAR_MESSAGES: Translations['AVATAR_MESSAGES'] = { live: 'LIVE' };

const PLACE_CARD_MESSAGES: Translations['PLACE_CARD_MESSAGES'] = {
  openStates: {
    open: 'Geöffnet',
    'closing-soon': 'Schließt bald',
    closed: 'Geschlossen',
    'opening-soon': 'Öffnet bald',
  },
  new: 'Neu',
  actions: 'Aktionen',
  actionsFor: (name) => `Aktionen für ${name}`,
  rated: (value, reviews) =>
    placeCard_withReviews(
      `Mit ${value} von 5 bewertet`,
      reviews === undefined ? undefined : placeCard_countOf('de', reviews, { one: '{n} Bewertung', other: '{n} Bewertungen' }),
    ),
};

const SOCIAL_BUTTON_MESSAGES: Translations['SOCIAL_BUTTON_MESSAGES'] = { actions: { continue: (b) => `Weiter mit ${b}`, signIn: (b) => `Mit ${b} anmelden`, signUp: (b) => `Mit ${b} registrieren` } };

const QUESTIONNAIRE_MESSAGES: Translations['QUESTIONNAIRE_MESSAGES'] = { other: 'Sonstiges', otherPlaceholder: 'Gib hier deine eigene Antwort ein', steps: 'Schritte', step: (n) => `Schritt ${n}` };

const MAP_CONTROLS_MESSAGES: Translations['MAP_CONTROLS_MESSAGES'] = {
  group: 'Kartensteuerung',
  locate: 'Meinen Standort anzeigen',
  following: 'Meinem Standort nicht mehr folgen',
  zoomIn: 'Vergrößern',
  zoomOut: 'Verkleinern',
  zoom: 'Zoom',
  tilt: 'Karte neigen',
  tiltOff: 'Karte flach anzeigen',
  compass: (degrees) => `Ausrichtung ${degrees} Grad. Nach Norden ausrichten`,
  layerTrigger: 'Kartenebenen',
  layers: 'Karte',
  overlays: 'Überlagerungen',
};

const PAYMENT_METHOD_MESSAGES: Translations['PAYMENT_METHOD_MESSAGES'] = { states: { expired: 'Abgelaufen', declined: 'Abgelehnt' }, default: 'Standard', add: 'Zahlungsmethode hinzufügen', emptyTitle: 'Keine gespeicherten Zahlungsmethoden', paymentMethods: 'Zahlungsmethoden' };

const AVATAR_GROUP_MESSAGES: Translations['AVATAR_GROUP_MESSAGES'] = { more: (n) => plural('de', n, { one: '{n} weitere Person', other: '{n} weitere Personen' }), profile: 'Profil' };

const MENUBAR_MESSAGES: Translations['MENUBAR_MESSAGES'] = {
  menuBar: 'Menüleiste',
};

const AGENT_THINKING_MESSAGES: Translations['AGENT_THINKING_MESSAGES'] = { thinking: 'Denkt nach' };

const AI_CHAT_MESSAGES: Translations['AI_CHAT_MESSAGES'] = {
  feedback: { like: 'Gute Antwort', dislike: 'Schlechte Antwort', copy: 'Antwort kopieren', copied: 'Kopiert!' },
  imageGeneration: {
    generated: 'Bild erstellt',
    generating: 'Bild wird erstellt',
    remaining: (n) => plural('de', n, { one: 'Noch {n} Sekunde', other: 'Noch {n} Sekunden' }),
    likeToast: 'Danke für dein Feedback',
    dislikeToast: 'Danke – wir nutzen das, um besser zu werden',
  },
  generatedImage: (alt) => `Erstelltes Bild: ${alt}`,
  codePanel: {
    changes: 'Änderungen',
    browser: 'Browser',
    uncommitted: (n) =>
      plural('de', n, { one: '{n} nicht committete Änderung', other: '{n} nicht committete Änderungen' }),
    undo: 'Änderungen verwerfen',
    browserPreview: 'Browser-Vorschau',
  },
  galleryPanel: {
    gallery: 'Galerie',
    styles: 'Stile',
    stylePresets: 'Stilvorlagen',
    enlarge: (prompt) => `${prompt} vergrößern`,
    minimize: (prompt) => `${prompt} verkleinern`,
    download: (prompt) => `${prompt} herunterladen`,
  },
  panelView: 'Bereichsansicht',
  openTerminal: 'Terminal öffnen',
  newGeneration: 'Neu erstellen',
  expandPanel: 'Bereich maximieren',
  togglePanel: 'Bereich ein-/ausblenden',
  container: { breadcrumb: 'Chat-Pfad', share: 'Chat teilen' },
  shell: {
    openNavigation: 'Navigation öffnen',
    closeNavigation: 'Navigation schließen',
    openPanel: (panel) => `${panel} öffnen`,
    closePanel: (panel) => `${panel} schließen`,
  },
  code: 'Code',
};

const COMMAND_MESSAGES: Translations['COMMAND_MESSAGES'] = {
  placeholder: 'Befehl eingeben oder suchen…',
  empty: 'Keine Ergebnisse gefunden.',
  palette: 'Befehlspalette',
  clearSearch: 'Suche löschen',
};

const MUSIC_LIBRARY_MESSAGES: Translations['MUSIC_LIBRARY_MESSAGES'] = {
  kinds: {
    playlist: 'Playlist',
    artist: 'Künstler',
    album: 'Album',
    podcast: 'Podcast',
    audiobook: 'Hörbuch',
    folder: 'Ordner',
  },
  library: {
    title: 'Deine Bibliothek',
    create: 'Playlist oder Ordner erstellen',
    collapseRail: 'Deine Bibliothek einklappen',
    expandRail: 'Deine Bibliothek öffnen',
    filters: 'Filter',
    clearFilters: 'Filter zurücksetzen',
    filter: {
      playlists: 'Playlists',
      artists: 'Künstler',
      albums: 'Alben',
      podcasts: 'Podcasts',
      audiobooks: 'Hörbücher',
    },
    downloaded: 'Heruntergeladen',
    search: 'In Deiner Bibliothek suchen',
    searchPlaceholder: 'In Deiner Bibliothek suchen',
    clearSearch: 'Suche leeren',
    sortAndView: 'Sortieren und anzeigen',
    sortBy: 'Sortieren nach',
    viewAs: 'Anzeigen als',
    sort: {
      recents: 'Zuletzt gehört',
      'recently-added': 'Zuletzt hinzugefügt',
      alphabetical: 'Alphabetisch',
      creator: 'Ersteller',
    },
    view: { compact: 'Kompakt', list: 'Liste', grid: 'Raster' },
    empty: 'Hier ist noch nichts',
  },
  item: { pinned: 'Angeheftet', downloaded: 'Heruntergeladen', nowPlaying: 'Wird gerade gespielt' },
  search: { placeholder: 'Was möchtest du hören?', clear: 'Suche leeren', browse: 'Stöbern' },
  resultTypes: 'Ergebnistypen',
  topResultKinds: {
    song: 'Song',
    artist: 'Künstler',
    album: 'Album',
    playlist: 'Playlist',
    podcast: 'Podcast',
    episode: 'Folge',
    audiobook: 'Hörbuch',
    profile: 'Profil',
  },
  recent: {
    title: 'Letzte Suchen',
    clearAll: 'Letzte Suchen löschen',
    remove: (title) => `${title} entfernen`,
  },
};

const LISTING_CARD_MESSAGES: Translations['LISTING_CARD_MESSAGES'] = {
  statuses: { reserved: 'Reserviert', sold: 'Verkauft', rented: 'Vermietet', unavailable: 'Nicht verfügbar' },
  originally: (p) => `ursprünglich ${p}`,
  approximateLocation: 'Ungefährer Standort',
  rated: (r) => `Bewertet mit ${r} von 5`,
  ratedWithReviews: (r, c) =>
    plural('de', c, { one: `Bewertet mit ${r} von 5, ${c} Bewertung`, other: `Bewertet mit ${r} von 5, ${c} Bewertungen` }),
  newListing: 'Neu',
  previousPhoto: 'Vorheriges Foto',
  nextPhoto: 'Nächstes Foto',
  saveToWishlist: 'Zur Wunschliste hinzufügen',
  removeFromWishlist: 'Von der Wunschliste entfernen',
};

const NAVIGATION_BANNER_MESSAGES: Translations['NAVIGATION_BANNER_MESSAGES'] = {
  states: { 'off-route': 'Route verlassen', rerouting: 'Neue Route wird gesucht' },
  thenLine: (street, maneuver) => navigationBanner_words('dann', navigationBanner_midSentence(maneuver, 'de'), street),
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
};

const LOCATION_PUCK_MESSAGES: Translations['LOCATION_PUCK_MESSAGES'] = {
  states: { locating: 'Standort wird ermittelt', located: 'Dein Standort', stale: 'Dein letzter bekannter Standort' },
  facing: (state, degrees) => `${state}, Blickrichtung ${degrees} Grad`,
};

const CAROUSEL_MESSAGES: Translations['CAROUSEL_MESSAGES'] = {
  previousSlide: 'Vorherige Folie',
  nextSlide: 'Nächste Folie',
  goToSlide: (n) => `Zu Folie ${n}`,
  slideOf: (at, of) => `${at} von ${of}`,
  carouselRole: 'Karussell',
  slideRole: 'Folie',
};

const ORDER_STATUS_MESSAGES: Translations['ORDER_STATUS_MESSAGES'] = { states: { current: 'In Bearbeitung', upcoming: 'Ausstehend', failed: 'Fehlgeschlagen' }, status: 'Status' };

const RATING_MESSAGES: Translations['RATING_MESSAGES'] = {
  newRating: 'Neu',
  reviews: (c) => rating_countForms('de', c, { one: '{n} Bewertung', other: '{n} Bewertungen' }),
  rated: (v) => `Bewertet mit ${v} von 5`,
  ratedWithReviews: (v, r) => `Bewertet mit ${v} von 5, ${r}`,
  star: (n) => plural('de', n, { one: '{n} Stern', other: '{n} Sterne' }),
};

const LISTING_EDITOR_MESSAGES: Translations['LISTING_EDITOR_MESSAGES'] = {
  offering: {
    rent: { title: 'Zur Miete', description: 'Langzeitmiete, Preis pro Monat.' },
    sale: { title: 'Zum Kauf', description: 'Das Zuhause vollständig verkaufen.' },
    stay: { title: 'Ferienunterkunft', description: 'Kurze Aufenthalte, Preis pro Nacht.' },
    swap: { title: 'Haustausch', description: 'Mit anderen Mitgliedern das Zuhause tauschen.' },
    monthlyRent: 'Monatsmiete',
    deposit: 'Kaution',
    depositOption: (months) =>
      months === 0 ? 'Keine' : plural('de', months, { one: '{n} Monat', other: '{n} Monate' }),
    availableFrom: 'Verfügbar ab',
    minimumStay: 'Mindestmietdauer',
    months: (months) => plural('de', months, { one: '{n} Monat', other: '{n} Monate' }),
    askingPrice: 'Angebotspreis',
    pricePerArea: 'Preis pro m²',
    pricePerAreaEmpty: 'Preis hinzufügen',
    nightlyRate: 'Preis pro Nacht',
    cleaningFee: 'Reinigungsgebühr',
    minimumNights: 'Mindestanzahl Nächte',
    nights: (nights) => plural('de', nights, { one: '{n} Nacht', other: '{n} Nächte' }),
    swapMode: 'Wie möchtest du tauschen?',
    swapModes: { swap: 'Zuhause tauschen', host: 'Nur Gäste aufnehmen', both: 'Beides' },
    group: 'Wie wird das Zuhause angeboten?',
  },
  propertyTypes: {
    apartment: 'Wohnung',
    house: 'Haus',
    room: 'Zimmer',
    studio: 'Einzimmerwohnung',
    duplex: 'Maisonette',
    penthouse: 'Penthouse',
    coliving: 'Co-Living',
    hostel: 'Hostel',
    other: 'Sonstiges',
  },
  propertyType: 'Immobilienart',
  addressPrecision: {
    exact: {
      title: 'Genaue Adresse',
      description: 'Die Markierung sitzt auf dem Gebäude. Am besten für Zuhause, die ohnehin leicht zu finden sind.',
    },
    street: {
      title: 'Nur die Straße',
      description: 'Zeigt die Straße, nicht die Hausnummer. Die genaue Adresse wird nach Buchung oder Unterschrift geteilt.',
    },
    approximate: {
      title: 'Ungefähre Gegend',
      description: 'Zeigt einen Kreis von etwa 500 m. Die privateste Option.',
    },
  },
  addressPrecisionLabel: 'Genauigkeit der Adresse',
  addressPrecisionFootnote:
    'Die veröffentlichte Karte folgt dieser Wahl. Deine genaue Adresse wird nur mit Personen geteilt, die du bestätigst.',
  qualityTitle: 'Qualität des Inserats',
  qualityScore: 'Qualitätswert des Inserats',
  tips: 'Tipps',
  todo: 'Offen',
  needsWork: 'Ausbaufähig',
  good: 'Gut',
  excellent: 'Hervorragend',
  previewTitle: 'Vorschau',
  previewDescription: 'So sehen Gäste dein Inserat.',
  card: 'Karte',
  page: 'Seite',
  previewAs: 'Vorschau als',
  reviews: (n, shown) => plural('de', n, { one: '{s} Bewertung', other: '{s} Bewertungen' }).replace('{s}', shown),
};

const MEDIA_HEADER_MESSAGES: Translations['MEDIA_HEADER_MESSAGES'] = {
  artistPick: 'Empfehlung des Künstlers',
  saveEpisode: 'Folge speichern',
  share: 'Teilen',
  podcastEpisode: 'Podcast-Folge',
  listeningProgress: 'Hörfortschritt',
  shuffle: 'Zufallswiedergabe',
  download: 'Herunterladen',
  downloadProgress: 'Download-Fortschritt',
  follow: 'Folgen',
  following: 'Folge ich',
  searchInPlaylist: 'In Playlist suchen',
  compactView: 'Kompakte Ansicht',
  editDetails: 'Details bearbeiten',
  about: 'Info',
  discography: 'Diskografie',
  showAll: 'Alle anzeigen',
  albums: 'Alben',
  singlesAndEps: 'Singles und EPs',
  compilations: 'Kompilationen',
  audiobook: 'Hörbuch',
  popular: 'Beliebt',
  seeMore: 'Mehr anzeigen',
  podcast: 'Podcast',
  latestEpisode: 'Neueste Folge',
  verifiedArtist: 'Verifizierter Künstler',
  profile: 'Profil',
  editProfile: 'Profil bearbeiten',
};

const MENU_ITEM_MESSAGES: Translations['MENU_ITEM_MESSAGES'] = {
  diets: { vegetarian: 'Vegetarisch', vegan: 'Vegan', 'gluten-free': 'Glutenfrei', 'dairy-free': 'Laktosefrei', halal: 'Halal', kosher: 'Koscher' },
  spicy: 'Scharf',
  spiceOf: (label, level, max) => `${label} ${level} von ${max}`,
  originally: (price, original) => `${price}, statt ${original}`,
  inBasket: (n) => `${n} im Warenkorb`,
  soldOut: 'Ausverkauft',
  addItem: (name) => `${name} hinzufügen`,
  choose: (n) => `${n} auswählen`,
  chooseRange: (min, max) => `${min} bis ${max} auswählen`,
  upTo: (n) => `Bis zu ${n}`,
  optional: 'Optional',
  quantity: 'Menge',
  addToBasket: 'In den Warenkorb',
  options: 'Optionen',
};

const PAGINATION_MESSAGES: Translations['PAGINATION_MESSAGES'] = {
  pagination: 'Seitennummerierung',
  goToPage: (page) => `Zu Seite ${page}`,
};

const LEAD_SCORE_MESSAGES: Translations['LEAD_SCORE_MESSAGES'] = { title: 'Lead-Score', factors: 'Woraus er sich zusammensetzt', bands: { cold: 'Kalt', warm: 'Warm', hot: 'Heiß' } };

const DIRECTIONS_MESSAGES: Translations['DIRECTIONS_MESSAGES'] = {
  modes: { drive: 'Auto', transit: 'ÖPNV', walk: 'Zu Fuß', cycle: 'Fahrrad' },
  traffic: { light: 'Wenig Verkehr', moderate: 'Mäßiger Verkehr', heavy: 'Starker Verkehr' },
  maneuvers: {
    depart: 'Losfahren',
    straight: 'Geradeaus weiter',
    'slight-left': 'Leicht links abbiegen',
    left: 'Links abbiegen',
    'sharp-left': 'Scharf links abbiegen',
    'slight-right': 'Leicht rechts abbiegen',
    right: 'Rechts abbiegen',
    'sharp-right': 'Scharf rechts abbiegen',
    uturn: 'Wenden',
    roundabout: 'Im Kreisverkehr',
    merge: 'Einfädeln',
    arrive: 'Ankommen',
    board: 'Einsteigen',
    alight: 'Aussteigen',
    transfer: 'Umsteigen',
    walk: 'Zu Fuß gehen',
  },
  directions: 'Wegbeschreibung',
  otherRoutes: 'Andere Routen',
  travelMode: 'Verkehrsmittel',
  start: 'Starten',
  currentStep: 'Aktueller Schritt',
  line: (name) => `Linie ${name}`,
};

const CART_PANEL_MESSAGES: Translations['CART_PANEL_MESSAGES'] = {
  basket: 'Warenkorb',
  checkout: 'Zur Kasse',
  emptyTitle: 'Dein Warenkorb ist leer',
  emptyDescription: 'Füge etwas aus der Speisekarte hinzu, dann erscheint es hier.',
  soldOut: 'Ausverkauft',
  removeItem: (name) => `${name} entfernen`,
  originally: (price, original) => `${price}, statt ${original}`,
  promoCode: 'Gutscheincode',
  apply: 'Einlösen',
  tip: 'Trinkgeld',
};

const MEDIA_CARD_MESSAGES: Translations['MEDIA_CARD_MESSAGES'] = {
  albumTypes: { album: 'Album', single: 'Single', ep: 'EP', compilation: 'Kompilation' },
  artist: 'Künstler',
  verified: 'Verifiziert',
  audiobook: 'Hörbuch',
  narratedBy: (n) => `Gelesen von ${n}`,
  progressOf: (t) => `Fortschritt: ${t}`,
  episode: 'Folge',
  played: 'Gehört',
  event: 'Veranstaltung',
  soldOut: 'Ausverkauft',
  listeningNow: 'Hört gerade',
  trackBy: (t, a) => `${t} von ${a}`,
  mix: 'Mix',
  playlist: 'Playlist',
  collaborative: 'Gemeinsam',
  ownedBy: (o) => `Von ${o}`,
  podcast: 'Podcast',
  profile: 'Profil',
  followsYou: 'Folgt dir',
  song: 'Titel',
  share: 'Teilen',
  listened: 'Gehört',
};

const JOB_BOARD_MESSAGES: Translations['JOB_BOARD_MESSAGES'] = {
  labels: {
    take: 'Auftrag annehmen',
    pass: 'Überspringen',
    distance: 'Entfernung',
    duration: 'Dauer',
    window: 'Zeitfenster',
    pickup: 'Abholung',
    dropoff: 'Abgabe',
    state: { taken: 'Vergeben', expired: 'Abgelaufen' },
    showPay: 'Vergütung anzeigen',
    hidePay: 'Vergütung ausblenden',
    payDetails: 'Vergütung für',
    sort: 'Aufträge sortieren',
    filtersToggle: 'Filter',
    filtersActive: (n) => `${n} aktiv`,
    sortOptions: {
      pay: 'Beste Bezahlung',
      distance: 'Am nächsten',
      soonest: 'Frühester Start',
      expiring: 'Endet bald',
    },
    filters: { distance: 'Entfernung', pay: 'Bezahlung', when: 'Wann', vehicle: 'Fahrzeug' },
    clearFilters: 'Filter zurücksetzen',
    refresh: 'Liste aktualisieren',
    count: (n) => plural('de', n, { one: '{n} Auftrag', other: '{n} Aufträge' }),
    loading: 'Aufträge werden geladen',
  },
  emptyTitle: 'Gerade keine Aufträge',
  emptyDescription: 'Nichts passt zu deiner Suche. Erweitere einen Filter oder aktualisiere in einer Minute erneut.',
  list: 'Aufträge',
  payDetailsFor: (load) => `Vergütung für ${load}`,
  route: (pickup, dropoff) => `${pickup} und ${dropoff}`,
  bands: {
    anyDistance: 'Beliebige Entfernung',
    underKm: (km) => `Unter ${km} km`,
    anyTime: 'Jederzeit',
    withinHour: 'Innerhalb einer Stunde',
    nextHours: (hours) => `In den nächsten ${hours} Stunden`,
    today: 'Heute',
  },
};

const FLOATING_MESSAGES: Translations['FLOATING_MESSAGES'] = {
  submenu: 'Untermenü',
};

const AGENT_CHAT_MESSAGES: Translations['AGENT_CHAT_MESSAGES'] = {
  chat: {
    newChat: 'Neuer Chat',
    emptyTitle: 'Wobei kann ich helfen?',
    emptyDescription: 'Dieser Chat läuft mit deinem eigenen API-Schlüssel. Der Verlauf bleibt in diesem Browser.',
    thinking: 'Denkt nach',
    error: 'Etwas ist schiefgelaufen. Prüfe die Serverprotokolle und versuche es dann erneut.',
    suggestions: [
      'Erkläre, was dieses Starterprojekt macht',
      'Schreibe ein Produkt-Update in drei Sätzen',
      'Nenne mir fünf Namen für eine Terminplanungs-App',
    ],
    you: 'Du',
    assistant: 'Assistent',
  },
  actions: {
    share: 'Chat teilen',
    shared: 'Transkript kopiert',
    more: 'Weitere Aktionen für diesen Chat',
    exportChats: 'Chats exportieren',
    markUnread: 'Als ungelesen markieren',
    deleteChat: 'Chat löschen',
  },
  message: { copy: 'Nachricht kopieren', readAloud: 'Vorlesen', stopReading: 'Vorlesen beenden' },
  history: {
    region: 'Chatverlauf',
    recent: 'Zuletzt',
    empty: 'Chats, die du beginnst, erscheinen hier.',
    rename: 'Umbenennen',
    renameField: 'Chat umbenennen',
    markUnread: 'Als ungelesen markieren',
    unread: 'Ungelesen',
    exportCount: (n) =>
      n === 0
        ? 'Keine Chats zum Exportieren'
        : plural('de', n, { one: '{n} Chat exportieren', other: '{n} Chats exportieren' }),
    accountMenu: (name) => `Kontomenü von ${name}`,
    usageLeft: 'Verbleibende Nutzung',
    upgrade: 'Auf Max upgraden',
    logOut: 'Abmelden',
  },
  composer: {
    field: 'Nachricht',
    placeholder: 'Frag mich etwas',
    attach: 'Anhang hinzufügen',
    send: 'Nachricht senden',
    stop: 'Generierung stoppen',
    notConfigured: 'Nicht konfiguriert',
    messageCount: (n) => plural('de', n, { one: '{n} Nachricht', other: '{n} Nachrichten' }),
    answeringWith: (model) => `Antwortet mit ${model}`,
  },
  ago: {
    justNow: 'gerade eben',
    minutes: (n) => plural('de', n, { one: 'vor {n} Minute', other: 'vor {n} Minuten' }),
    hours: (n) => plural('de', n, { one: 'vor {n} Stunde', other: 'vor {n} Stunden' }),
    days: (n) => plural('de', n, { one: 'vor {n} Tag', other: 'vor {n} Tagen' }),
  },
  age: { now: 'jetzt', minutes: (n) => `${n} Min.`, hours: (n) => `${n} Std.`, days: (n) => `${n} T.` },
};

const WEB_SEARCH_MESSAGES: Translations['WEB_SEARCH_MESSAGES'] = { sources: 'Quellen', working: 'Arbeitet' };

const MAIL_THREAD_MESSAGES: Translations['MAIL_THREAD_MESSAGES'] = {
  to: 'An',
  cc: 'Cc',
  bcc: 'Bcc',
  reply: 'Antworten',
  replyAll: 'Allen antworten',
  forward: 'Weiterleiten',
  more: COMMON_MESSAGES.more,
  moreAddresses: (n) => `${n} weitere`,
  earlierMessages: (n) => plural('de', n, { one: '{n} frühere Nachricht', other: '{n} frühere Nachrichten' }),
  showTrimmed: 'Gekürzten Inhalt anzeigen',
  hideTrimmed: 'Gekürzten Inhalt ausblenden',
  unread: 'Ungelesen',
  starred: 'Markiert',
  star: 'Markieren',
  attachments: 'Anhänge',
  attachmentCount: (n) => plural('de', n, { one: '{n} Anhang', other: '{n} Anhänge' }),
  expand: 'Nachricht aufklappen',
  collapse: 'Nachricht zuklappen',
};

const NOTIFICATION_CENTER_MESSAGES: Translations['NOTIFICATION_CENTER_MESSAGES'] = {
  title: 'Benachrichtigungen',
  emptyMessage: 'Du bist auf dem neuesten Stand.',
  emptyDescription: 'Neue Aktivitäten erscheinen hier, sobald sie eintreffen.',
  noUnread: 'Keine ungelesenen Benachrichtigungen',
  unread: (n) => plural('de', n, { one: '{n} ungelesen', other: '{n} ungelesen' }),
  markAllRead: 'Alle als gelesen markieren',
  category: 'Benachrichtigungskategorie',
  tabs: { all: 'Alle', mentions: 'Erwähnungen', system: 'System' },
  unreadDot: 'Ungelesen',
};

const CHART_CARDS_MESSAGES: Translations['CHART_CARDS_MESSAGES'] = {
  titles: {
    activity: 'Aktivität',
    agents: 'Agenten',
    visitors: 'Besucher',
    breakdown: 'Aufschlüsselung',
    sessions: 'Sitzungen',
    contributionsThisYear: 'Beiträge dieses Jahr',
    earnedSoFar: 'Bisher verdient',
    signUpFunnel: 'Registrierungstrichter',
    activeUsers: 'Aktive Nutzer',
    revenue: 'Umsatz',
    mostActiveDays: 'Aktivste Tage',
    orders: 'Bestellungen',
    trackedTime: 'Erfasste Zeit',
    revenuePerAccount: 'Umsatz pro Konto',
    sleepScore: 'Schlafwert',
    pipeline: 'Vertriebspipeline',
    steps: 'Schritte',
    tokens: 'Tokens',
  },
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
  yearly: 'Jährlich',
  stepsSuffix: 'Schritte',
  today: 'Heute',
  thisYear: 'Dieses Jahr',
  lastYear: 'Letztes Jahr',
  sinceLastYear: 'letztes Jahr',
  aYearEarlier: 'ein Jahr zuvor',
  earningsPeriod: 'Einnahmezeitraum',
  changePeriod: 'Zeitraum ändern',
  period: 'Zeitraum',
  total: 'gesamt',
  average: 'Durchschnitt',
  thisMonth: 'diesen Monat',
  ofGoal: 'des Ziels',
  totalSteps: 'Schritte insgesamt',
  gaugeChart: (title, reading) => `Anzeige ${title}: ${reading}`,
  halfGaugeChart: (title, items) => `Halbkreisanzeige ${title}: ${items}`,
  radialChart: (title, items) => `Radialdiagramm ${title}: ${items}`,
  percentOfGoal: (pct) => `${pct} % des Ziels`,
  periodOf: (label) => `Zeitraum: ${label}`,
  chartVs: (title, current, previous) => `Diagramm ${title}: ${current} gegenüber ${previous}`,
  lineChart: (title) => `Liniendiagramm ${title}`,
  barChart: (title, items) => `Balkendiagramm ${title}: ${items}`,
  comboChart: (title, bar, line) => `Diagramm ${title}: Balken ${bar} gegenüber Linie ${line}`,
  scatterChart: (title, series) => `Streudiagramm ${title}: ${series}`,
  bubbleChart: (title, series) => `Blasendiagramm ${title}: ${series}`,
  ringItem: (label, value, pct) => `${label} ${value}, ${pct} % des Ziels`,
  scoreOf: (score, max) => `${score} von ${max}`,
  activityFor: (name, day) => `Aktivität am ${day}. ${name}`,
  contributions: (n, date) => { const on = date ? ` am ${date}` : ''; return n === 0 ? `Keine Beiträge${on}` : plural('de', n, { one: `{n} Beitrag${on}`, other: `{n} Beiträge${on}` }); },
};

const CODE_MESSAGES: Translations['CODE_MESSAGES'] = { copy: 'Code kopieren', copied: 'Code kopiert' };

const OUTLINE_NAV_MESSAGES: Translations['OUTLINE_NAV_MESSAGES'] = { outline: 'Auf dieser Seite', progress: (at, of) => `Überschrift ${at} von ${of}` };

const STEPPER_MESSAGES: Translations['STEPPER_MESSAGES'] = { decrease: 'Verringern', increase: 'Erhöhen' };

const CALL_UI_MESSAGES: Translations['CALL_UI_MESSAGES'] = {
  status: {
    calling: 'Wird angerufen…',
    ringing: 'Klingelt',
    connecting: 'Verbindung wird hergestellt…',
    active: 'Verbunden',
    reconnecting: 'Verbindung wird wiederhergestellt…',
    onHold: 'Gehalten',
    ended: 'Anruf beendet',
  },
  controls: {
    mute: 'Stummschalten',
    unmute: 'Stummschaltung aufheben',
    speakerOn: 'Lautsprecher einschalten',
    speakerOff: 'Lautsprecher ausschalten',
    videoOn: 'Kamera einschalten',
    videoOff: 'Kamera ausschalten',
    flipCamera: 'Kamera wechseln',
    screenShareOn: 'Bildschirm teilen',
    screenShareOff: 'Bildschirmfreigabe beenden',
    addParticipant: 'Teilnehmer hinzufügen',
    endCall: 'Anruf beenden',
  },
  screen: {
    minimise: 'Anruf minimieren',
    chat: 'Chat öffnen',
    participants: 'Teilnehmer',
    movePip: (c) => `Eigenes Bild verschieben (jetzt ${callUi_corner(CALL_UI_MESSAGES__CORNERS, c)})`,
  },
  pipCorners: CALL_UI_MESSAGES__CORNERS,
  history: {
    incoming: 'Eingehend',
    outgoing: 'Ausgehend',
    missed: 'Verpasst',
    declined: 'Abgelehnt',
    callBack: (name) => `${name} zurückrufen`,
  },
  incoming: {
    accept: 'Annehmen',
    decline: 'Ablehnen',
    message: 'Nachricht',
    remind: 'Erinnern',
    slideToAnswer: 'Zum Annehmen schieben',
    voice: 'Eingehender Sprachanruf',
    video: 'Eingehender Videoanruf',
  },
  returnToCall: 'Zurück zum Anruf',
  returnToCallWith: (name) => `Zurück zum Anruf mit ${name}`,
  join: 'Beitreten',
  leave: 'Verlassen',
  speaking: (name) => `${name} spricht`,
  overflow: (n) => `+${n} weitere`,
  muted: (name) => `${name}, stummgeschaltet`,
};

const RECENT_HIRES_CARD_MESSAGES: Translations['RECENT_HIRES_CARD_MESSAGES'] = { title: 'Neueinstellungen' };

const MAIL_LIST_MESSAGES: Translations['MAIL_LIST_MESSAGES'] = {
  draft: 'Entwurf:',
  unread: 'Ungelesen',
  starred: 'Markiert',
  star: 'Markieren',
  attachment: 'Mit Anhang',
  select: 'Auswählen',
  threadCount: (n) => plural('de', n, { one: '{n} Nachricht', other: '{n} Nachrichten' }),
  moreLabels: (n) => plural('de', n, { one: '{n} weiteres Label', other: '{n} weitere Labels' }),
  selectedCount: (n) => `${n} ausgewählt`,
  selectAll: 'Alle auswählen',
  clearSelection: 'Auswahl aufheben',
  emptyTitle: 'Hier ist nichts',
  emptyDescription: 'Neue E-Mails landen in diesem Ordner.',
  today: 'Heute',
  yesterday: 'Gestern',
  list: 'E-Mail',
};

const IMPORTANT_ALERTS_CARD_MESSAGES: Translations['IMPORTANT_ALERTS_CARD_MESSAGES'] = { title: 'Wichtige Hinweise', thisWeek: 'diese Woche' };

const STAT_CARDS_MESSAGES: Translations['STAT_CARDS_MESSAGES'] = { about: (label) => `Über ${label}`, fromLastMonth: 'Gegenüber Vormonat' };

const SHAPE_MESSAGES: Translations['SHAPE_MESSAGES'] = {
  shapes: shapes_shapeNames(
    {
      square: 'Quadrat',
      slanted: 'Schräg',
      arch: 'Bogen',
      semicircle: 'Halbkreis',
      oval: 'Oval',
      pill: 'Pille',
      triangle: 'Dreieck',
      arrow: 'Pfeil',
      fan: 'Fächer',
      diamond: 'Raute',
      clamshell: 'Muschel',
      pentagon: 'Fünfeck',
      gem: 'Edelstein',
      'very-sunny': 'Sehr sonnig',
      sunny: 'Sonnig',
      burst: 'Zacken',
      'soft-burst': 'Weiche Zacken',
      boom: 'Explosion',
      'soft-boom': 'Weiche Explosion',
      flower: 'Blume',
      puffy: 'Bauschig',
      'puffy-diamond': 'Bauschige Raute',
      'ghost-ish': 'Gespenstisch',
      'pixel-circle': 'Pixelkreis',
      'pixel-triangle': 'Pixeldreieck',
      bun: 'Brötchen',
      heart: 'Herz',
    },
    (n) => `Keks mit ${n} Seiten`,
    (n) => `${n}-blättriges Kleeblatt`,
  ),
};

const TENANCY_MESSAGES: Translations['TENANCY_MESSAGES'] = {
  leasePaymentStatus: { upcoming: 'Anstehend', due: 'Bald fällig', overdue: 'Überfällig', paid: 'Bezahlt' },
  rentPaymentStatus: { paid: 'Bezahlt', pending: 'Ausstehend', overdue: 'Überfällig', partial: 'Teilweise' },
  maintenanceCategory: {
    plumbing: 'Sanitär',
    electrical: 'Elektrik',
    appliances: 'Haushaltsgeräte',
    heating: 'Heizung',
    other: 'Sonstiges',
  },
  maintenancePriority: { low: 'Niedrige Priorität', medium: 'Mittlere Priorität', high: 'Hohe Priorität', urgent: 'Dringend' },
  maintenanceStage: { reported: 'Gemeldet', acknowledged: 'Bestätigt', scheduled: 'Terminiert', resolved: 'Erledigt' },
  documentStatus: { signed: 'Unterschrieben', pending: 'Unterschrift ausstehend', expired: 'Abgelaufen' },
  timelineState: { complete: 'Erledigt', current: 'In Bearbeitung', upcoming: 'Noch offen' },
  leasePeriod: 'Mietdauer',
  monthlyRent: 'Monatsmiete',
  deposit: 'Kaution',
  nextPayment: 'Nächste Zahlung',
  paidThisYear: 'Dieses Jahr bezahlt',
  outstanding: 'Offen',
  noPayments: 'Noch keine Zahlungen',
  columns: { month: 'Monat', dueDate: 'Fälligkeit', method: 'Zahlungsart', amount: 'Betrag', status: 'Status' },
  downloadReceipt: (month) => `Beleg für ${month} herunterladen`,
  dueOn: (date) => `Fällig am ${date}`,
  comments: (n) => plural('de', n, { one: '{n} Kommentar', other: '{n} Kommentare' }),
  photo: (position, total) => `Foto ${position} von ${total}`,
  photoWithAlt: (alt, position, total) => `${alt}, Foto ${position} von ${total}`,
  sign: 'Unterschreiben',
  signDocument: (name) => `${name} unterschreiben`,
  viewDocument: (name) => `${name} ansehen`,
  downloadDocument: (name) => `${name} herunterladen`,
  noDocuments: 'Keine Dokumente',
};

const DATA_TABLE_MESSAGES: Translations['DATA_TABLE_MESSAGES'] = {
  selectAll: 'Alle Zeilen auf dieser Seite auswählen',
  selectRow: (id) => `Zeile ${id} auswählen`,
  densityLabel: 'Tabellendichte',
  density: { md: 'Normal', sm: 'Kompakt' },
};

const ERROR_BOUNDARY_MESSAGES: Translations['ERROR_BOUNDARY_MESSAGES'] = { title: 'Etwas ist schiefgelaufen', message: 'Ein unerwarteter Fehler ist aufgetreten', retry: 'Erneut versuchen' };

const AI_PROFILE_CARD_MESSAGES: Translations['AI_PROFILE_CARD_MESSAGES'] = {
  contributions: 'Beiträge in diesem Jahr',
  activity: 'Aktivität',
  periodGroup: (label) => `Zeitraum: ${label}`,
  periods: { weekly: 'Wöchentlich', monthly: 'Monatlich', yearly: 'Jährlich' },
};

const BREADCRUMB_MESSAGES: Translations['BREADCRUMB_MESSAGES'] = {
  breadcrumb: 'Brotkrümelnavigation',
};

const MESSAGE_MEDIA_MESSAGES: Translations['MESSAGE_MEDIA_MESSAGES'] = {
  photo: 'Foto',
  video: 'Video',
  photoOf: (i, total) => `Foto ${i} von ${total}`,
  videoOf: (i, total) => `Video ${i} von ${total}`,
  tapToView: 'Zum Anzeigen tippen',
  sendingPhoto: 'Foto wird gesendet',
  sendingVideo: 'Video wird gesendet',
  sendingAlbum: 'Album wird gesendet',
  sendingSticker: 'Sticker wird gesendet',
  sendingGif: 'GIF wird gesendet',
  album: (n) => `Album, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  sharedMedia: (n) => `Geteilte Medien, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  sharedFiles: (n) => `Geteilte Dateien, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  moreItems: (n) => `+${n} weitere`,
  notSent: 'Nicht gesendet',
  voiceMessage: (d) => `Sprachnachricht, ${d}`,
  playVoiceMessage: 'Sprachnachricht abspielen',
  pauseVoiceMessage: 'Sprachnachricht pausieren',
  transcribe: 'Transkribieren',
  hideTranscript: 'Transkript ausblenden',
  seek: 'Position',
  seekPosition: (p, d) => `${p} von ${d}`,
  playbackSpeed: (r) => `Wiedergabegeschwindigkeit, ${r}`,
  unplayed: 'Nicht abgespielt',
  download: 'Herunterladen',
  downloaded: 'Heruntergeladen',
  file: 'Datei',
  fileKinds: {
    pdf: 'PDF',
    doc: 'DOKUMENT',
    sheet: 'TABELLE',
    slides: 'PRÄSENTATION',
    zip: 'ZIP',
    audio: 'AUDIO',
    video: 'VIDEO',
    image: 'BILD',
    code: 'CODE',
  },
  contact: 'Kontakt',
  message: 'Nachricht',
  add: 'Hinzufügen',
  location: 'Standort',
  liveLocation: 'Live-Standort',
  stopSharing: 'Teilen beenden',
  vote: 'Abstimmen',
  viewResults: 'Ergebnisse anzeigen',
  anonymousVoting: 'Anonyme Abstimmung',
  quiz: 'Quiz',
  selectOne: 'Eine Option wählen',
  selectOneOrMore: 'Eine oder mehrere wählen',
  correctAnswer: 'richtige Antwort',
  yourAnswer: 'deine Antwort',
  votes: (n) => (n === 0 ? 'Keine Stimmen' : plural('de', n, { one: '{n} Stimme', other: '{n} Stimmen' })),
  sticker: 'Sticker',
};

const PIPELINE_MESSAGES: Translations['PIPELINE_MESSAGES'] = {
  health: { 'on-track': 'Im Plan', 'at-risk': 'Gefährdet', stalled: 'Stockt' },
  stalledFor: (duration) => `Stockt seit ${duration}`,
  move: (title) => `${title} verschieben`,
  stages: 'Pipeline-Phasen',
  stageWithCount: (name, n) => `${name}, ${plural('de', n, { one: '{n} Deal', other: '{n} Deals' })}`,
  empty: 'Keine Deals in dieser Phase',
  loadMore: 'Mehr laden',
};

const STAY_SEARCH_MESSAGES: Translations['STAY_SEARCH_MESSAGES'] = {
  where: 'Wo',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  when: 'Wann',
  who: 'Wer',
  destinationPlaceholder: 'Reiseziele suchen',
  datesPlaceholder: 'Daten hinzufügen',
  guestsPlaceholder: 'Gäste hinzufügen',
  guests: { adults: 'Erwachsene', children: 'Kinder', infants: 'Kleinkinder', pets: 'Haustiere' },
  guestDescriptions: {
    adults: 'Ab 13 Jahren',
    children: '2 – 12 Jahre',
    infants: 'Unter 2 Jahren',
    pets: 'Reist du mit einem Assistenztier?',
  },
  dateFlexibility: 'Flexibilität der Daten',
  exactDates: 'Genaue Daten',
  plusMinusDays: (n) => plural('de', n, { one: '± {n} Tag', other: '± {n} Tage' }),
  destinations: 'Reiseziele',
  whereTo: 'Wohin geht es?',
  filters: 'Filter',
};

const AUTH_CARD_MESSAGES: Translations['AUTH_CARD_MESSAGES'] = {
  modes: {
    signin: {
      title: 'Willkommen zurück',
      description: 'Melde dich an, um dort weiterzumachen, wo du aufgehört hast.',
      cta: 'Anmelden',
      switchLead: 'Neu hier?',
      switchAction: 'Konto erstellen',
    },
    signup: {
      title: 'Konto erstellen',
      description: 'In wenigen Minuten startklar.',
      cta: 'Konto erstellen',
      switchLead: 'Du hast bereits ein Konto?',
      switchAction: 'Anmelden',
    },
    verify: {
      title: 'Prüfe dein Postfach',
      description: 'Gib den Code ein, den wir dir geschickt haben, um die Anmeldung abzuschließen.',
      cta: 'Bestätigen und fortfahren',
      switchLead: 'Kein Code angekommen?',
      switchAction: 'Neuen Code senden',
    },
  },
  codeSentTo: (email) => `Gib den Code ein, den wir an ${email} gesendet haben, um die Anmeldung abzuschließen.`,
  verificationCode: 'Bestätigungscode',
  fullName: 'Vollständiger Name',
  namePlaceholder: 'Erika Mustermann',
  email: 'E-Mail',
  emailPlaceholder: 'du@firma.de',
  emailHint: 'Wir nutzen sie nur, um dich zu kontaktieren, und geben sie nie weiter.',
  password: 'Passwort',
  passwordPlaceholder: 'Passwort eingeben',
  newPasswordPlaceholder: 'Mindestens 8 Zeichen',
  confirmPassword: 'Passwort bestätigen',
  confirmPasswordPlaceholder: 'Passwort wiederholen',
  rememberMe: 'Angemeldet bleiben',
  forgotPassword: 'Passwort vergessen?',
  terms: 'Mit der Erstellung eines Kontos stimmst du unseren Nutzungsbedingungen und unserer Datenschutzerklärung zu.',
  orContinueWith: 'oder weiter mit',
};

const TRACK_LIST_MESSAGES: Translations['TRACK_LIST_MESSAGES'] = {
  title: 'Titel',
  album: 'Album',
  dateAdded: 'Hinzugefügt am',
  plays: 'Wiedergaben',
  duration: 'Dauer',
  moveUp: 'Nach oben',
  moveDown: 'Nach unten',
  reorder: 'Neu anordnen',
  downloaded: 'Heruntergeladen',
  unavailable: 'Nicht verfügbar',
  tracks: 'Titel',
  episodes: 'Folgen',
  selected: (n) => plural('de', n, { other: '{n} ausgewählt' }),
  clearSelection: 'Auswahl aufheben',
  played: 'Gespielt',
  listened: 'Gehört',
  saveEpisode: 'Folge speichern',
  downloadEpisode: 'Folge herunterladen',
  minutes: (m) => `${m} Min.`,
  hours: (h) => `${h} Std.`,
  hoursMinutes: (h, m) => `${h} Std. ${m} Min.`,
  remaining: (l) => `Noch ${l}`,
};

const LYRICS_MESSAGES: Translations['LYRICS_MESSAGES'] = {
  lyrics: 'Songtext',
  showLyrics: 'Songtext anzeigen',
  backToCurrent: 'Zurück zur aktuellen Zeile',
  empty: 'Für diesen Titel ist kein Songtext verfügbar',
};

const ACTIVITY_FEED_MESSAGES: Translations['ACTIVITY_FEED_MESSAGES'] = {
  kinds: { call: 'Anruf', email: 'E-Mail', meeting: 'Meeting', note: 'Notiz', 'stage-change': 'Phasenwechsel', task: 'Aufgabe erledigt' },
  empty: 'Noch keine Aktivitäten erfasst',
  loggedBy: (name) => `Erfasst von ${name}`,
  filterActivity: 'Aktivitäten filtern',
};

const PLACE_REVIEWS_MESSAGES: Translations['PLACE_REVIEWS_MESSAGES'] = {
  depositReturned: 'Kaution zurückerhalten',
  depositNotReturned: 'Kaution nicht zurückerhalten',
  recommend: 'Würde es empfehlen',
  notRecommend: 'Würde es nicht empfehlen',
  helpful: 'Hilfreich',
  report: 'Melden',
  promptTitle: 'Hast du hier gewohnt?',
  promptDescription: (building) =>
    `Hilf künftigen Mietern von ${building}. Bewertungen sind anonym.`,
  writeReview: 'Bewertung schreiben',
  reviewCount: (n) => plural('de', n, { one: '{n} Bewertung', other: '{n} Bewertungen' }),
  depositRate: (percent) => `Kaution in ${percent} % der Mietverhältnisse zurückerhalten`,
  recommendRate: (percent) => `${percent} % würden das Wohnen hier empfehlen`,
};

const DELIVERY_SLOT_MESSAGES: Translations['DELIVERY_SLOT_MESSAGES'] = {
  tiers: { standard: 'Standard', express: 'Express' },
  soldOut: 'Ausgebucht',
  asap: 'So schnell wie möglich',
  field: 'Lieferzeit',
  day: 'Tag',
  emptyTitle: 'Keine Zeitfenster mehr frei',
  emptyDescription: 'Wähle einen anderen Tag oder den nächsten verfügbaren Kurier.',
};

const PLACE_LIST_MESSAGES: Translations['PLACE_LIST_MESSAGES'] = {
  visibility: { private: 'Privat', shared: 'Geteilt', public: 'Öffentlich' },
  places: (n) => plural('de', n, { one: '{n} Ort', other: '{n} Orte' }),
  sharedWith: (n) => plural('de', n, { one: 'Geteilt mit {n} Person', other: 'Geteilt mit {n} Personen' }),
  labels: {
    moveEarlier: (position) => `An Position ${position - 1} verschieben`,
    moveLater: (position) => `An Position ${position + 1} verschieben`,
    remove: (name) => `${name} aus der Liste entfernen`,
    moved: (name, position, total) => `${name} an Position ${position} von ${total} verschoben`,
    note: 'Notiz',
  },
  savedPlaces: 'Gespeicherte Orte',
};

const HOME_SEARCH_MESSAGES: Translations['HOME_SEARCH_MESSAGES'] = {
  modes: { rent: 'Mieten', buy: 'Kaufen', stays: 'Ferienunterkünfte', swap: 'Tauschen' },
  searchMode: 'Suchmodus',
  location: 'Ort',
  locationPlaceholder: 'Stadt oder Gegend suchen',
  moveIn: 'Einzug',
  datePlaceholder: 'Datum hinzufügen',
  budget: 'Budget',
  budgetPlaceholder: 'Budget hinzufügen',
  price: 'Preis',
  pricePlaceholder: 'Beliebiger Preis',
  propertyType: 'Immobilientyp',
  propertyTypePlaceholder: 'Beliebiger Typ',
  dates: 'Zeitraum',
  homeSize: 'Wohnfläche',
  homeSizePlaceholder: 'Beliebige Größe',
  minimum: 'Mindestens',
  maximum: 'Höchstens',
  budgetPresets: 'Budgetvorschläge',
  monthlyBudget: 'Monatliches Budget',
  monthlyBudgetDescription: 'Kaltmiete pro Monat',
  totalPriceDescription: 'Gesamtpreis',
  upTo: (amount) => `Bis ${amount}`,
  any: 'Beliebig',
  moveInLabels: {
    date: 'Einzugsdatum',
    flexible: 'Flexibel',
    asap: 'So bald wie möglich',
    contractLength: 'Vertragslaufzeit',
  },
  contractLengths: { any: 'Beliebig', short: '1–6 Monate', medium: '6–12 Monate', long: 'Über 1 Jahr' },
  saveSearch: 'Suche speichern',
  saved: 'Gespeichert',
  newCount: (n) => plural('de', n, { one: '{n} neues', other: '{n} neue' }),
  alertsOff: 'Benachrichtigungen aus',
  actionOn: (action, subject) => `${action}: ${subject}`,
};

const OFFERING_BADGE_MESSAGES: Translations['OFFERING_BADGE_MESSAGES'] = { offerings: { long_term_rent: 'Zu vermieten', sale: 'Zu verkaufen', short_term_rent: 'Ferienwohnung', exchange: 'Tausch' } };

const MAP_ATTRIBUTION_MESSAGES: Translations['MAP_ATTRIBUTION_MESSAGES'] = { scale: 'Maßstab', mapData: 'Kartendaten' };

const SLIDER_MESSAGES: Translations['SLIDER_MESSAGES'] = { minimum: 'Minimalwert', maximum: 'Maximalwert', value: (n) => `Wert ${n}` };

const SELECT_MESSAGES: Translations['SELECT_MESSAGES'] = { selectOption: 'Option auswählen', scrollUp: 'Nach oben scrollen', scrollDown: 'Nach unten scrollen' };

const ZOOMABLE_MEDIA_GALLERY_MESSAGES: Translations['ZOOMABLE_MEDIA_GALLERY_MESSAGES'] = {
  close: 'Medienansicht schließen',
  previous: 'Vorheriges Element',
  next: 'Nächstes Element',
  goTo: (i, n) => `Zu Element ${i} von ${n}`,
  share: 'Medien teilen',
};

const NOTIFICATION_MESSAGES: Translations['NOTIFICATION_MESSAGES'] = { dismiss: 'Benachrichtigung schließen' };

const PHONE_INPUT_MESSAGES: Translations['PHONE_INPUT_MESSAGES'] = { phoneNumber: 'Telefonnummer', countryCode: 'Ländervorwahl' };

const VENDOR_CARD_MESSAGES: Translations['VENDOR_CARD_MESSAGES'] = {
  facts: { deliveryTime: 'Lieferzeit', deliveryFee: 'Liefergebühr', distance: 'Entfernung', minimumOrder: 'Mindestbestellwert' },
  availability: { paused: 'Pausiert', closed: 'Geschlossen' },
  new: 'Neu',
  rated: (value, reviews) =>
    `Bewertet mit ${value} von 5${vendorCard_has(reviews) ? `, ${vendorCard_counted('de', reviews, { one: '{n} Bewertung', other: '{n} Bewertungen' })}` : ''}`,
};

const CHAT_INDICATORS_MESSAGES: Translations['CHAT_INDICATORS_MESSAGES'] = {
  presence: { online: 'Online', idle: 'Abwesend', offline: 'Offline', busy: 'Beschäftigt' },
  status: { sending: 'Wird gesendet…', sent: 'Gesendet', delivered: 'Zugestellt', read: 'Gelesen', failed: 'Nicht gesendet' },
  unread: 'Ungelesen',
  unreadCount: (n) => plural('de', n, { one: '{n} ungelesene Nachricht', other: '{n} ungelesene Nachrichten' }),
};

const MEDIA_CONTROLS_MESSAGES: Translations['MEDIA_CONTROLS_MESSAGES'] = {
  play: 'Wiedergeben',
  pause: 'Pausieren',
  playSubject: (s) => `${s} wiedergeben`,
  pauseSubject: (s) => `${s} pausieren`,
  saveToLibrary: 'In deiner Bibliothek speichern',
  saveSubjectToLibrary: (s) => `${s} in deiner Bibliothek speichern`,
  explicit: 'Explizit',
  seek: 'Wiedergabeposition',
  seekValue: (a, b) => `${a} von ${b}`,
  mute: 'Stummschalten',
  unmute: 'Stummschaltung aufheben',
  volume: 'Lautstärke',
  nowPlaying: 'Läuft gerade',
};

const INPUT_OTP_MESSAGES: Translations['INPUT_OTP_MESSAGES'] = {
  oneTimeCode: 'Einmalcode',
  digitOf: (i, n) => `Ziffer ${i} von ${n}`,
  characterOf: (i, n) => `Zeichen ${i} von ${n}`,
};

const PLACE_DETAILS_MESSAGES: Translations['PLACE_DETAILS_MESSAGES'] = {
  infoActions: { call: 'Anrufen', open: 'Website öffnen', directions: 'Route' },
  busy: {
    busier: 'Belebter als sonst',
    typical: 'So belebt wie sonst',
    quieter: 'Ruhiger als sonst',
  },
  transitModes: {
    bus: 'Bushaltestelle',
    metro: 'U-Bahn-Station',
    train: 'Bahnhof',
    tram: 'Straßenbahnhaltestelle',
    ferry: 'Fähranleger',
  },
  notAvailable: 'Nicht verfügbar',
  amenities: 'Ausstattung',
  today: 'Heute',
  closed: 'Geschlossen',
  openingHours: 'Öffnungszeiten',
  day: 'Tag',
  noDataForDay: 'Keine Daten für diesen Tag',
  chartNoData: (day) => `${day}, keine Daten`,
  chartClosed: (day) => `${day}, ganztägig geschlossen`,
  chartPeak: (day, hour) => `${day}, am meisten los um ${hour}`,
  chartNow: (hour) => `jetzt ${hour}`,
  live: 'live',
  noDepartures: 'Derzeit keine Abfahrten',
  nearbyTransit: 'ÖPNV in der Nähe',
  lines: 'Linien',
  line: (name) => `Linie ${name}`,
  towards: (headsign) => `nach ${headsign}`,
};

const APP_SHELL_MESSAGES: Translations['APP_SHELL_MESSAGES'] = {
  openNavigation: 'Navigation öffnen',
  closeNavigation: 'Navigation schließen',
  resizePanes: 'Bereichsgröße ändern',
  notifications: 'Benachrichtigungen',
  proOffer: 'Pro-Angebot',
};

const ROUTE_STOPS_MESSAGES: Translations['ROUTE_STOPS_MESSAGES'] = {
  routeStops: 'Stopps der Route',
  origin: 'Start',
  destination: 'Ziel',
  stop: (position) => `Stopp ${position}`,
  swap: 'Start und Ziel tauschen',
  addStop: 'Stopp hinzufügen',
  removeStop: (title) => `${title} entfernen`,
  state: { reached: 'Erreicht', current: 'Aktueller Stopp', pending: 'Nicht erreicht' },
};

const SEARCH_MESSAGES: Translations['SEARCH_MESSAGES'] = { clearQuery: 'Suchanfrage löschen' };

const TAG_FIELD_MESSAGES: Translations['TAG_FIELD_MESSAGES'] = { remove: (t) => `${t} entfernen`, full: (n) => `Maximal ${n}`, suggestions: 'Vorschläge' };

const STAY_FILTERS_MESSAGES: Translations['STAY_FILTERS_MESSAGES'] = {
  propertyTypes: {
    apartment: 'Wohnung',
    house: 'Haus',
    room: 'Zimmer',
    studio: 'Studio',
    duplex: 'Maisonette / Penthouse',
    coliving: 'Coliving',
    hostel: 'Hostel',
    other: 'Grundstück / Sonstiges',
  },
  features: {
    elevator: 'Aufzug',
    parking: 'Parkplatz',
    terrace: 'Terrasse',
    garden: 'Garten',
    pool: 'Pool',
    furnished: 'Möbliert',
    pets: 'Haustiere erlaubt',
    airConditioning: 'Klimaanlage',
    heating: 'Heizung',
    accessible: 'Barrierefrei',
    storage: 'Abstellraum',
  },
  floors: { ground: 'Erdgeschoss', middle: 'Mittlere Etage', top: 'Oberste Etage', elevator: 'Mit Aufzug' },
  minimum: 'Mindestens',
  maximum: 'Höchstens',
  priceRange: 'Preisspanne',
  area: 'Fläche',
  featuresGroup: 'Ausstattung',
  floor: 'Etage',
  propertyType: 'Immobilientyp',
  energyRating: 'Energieeffizienzklasse',
  anyRating: 'Beliebige Klasse',
  ratingOnly: (r) => `Nur ${r}`,
  ratingAndBetter: (r) => `${r} und besser`,
  filters: 'Filter',
  filtersApplied: (label, n) => `${label}, ${n} aktiv`,
  clearAll: 'Alle zurücksetzen',
  any: 'Beliebig',
  availableNow: 'Sofort verfügbar',
  availableNowDescription: 'Heute bezugsfertig',
  availableFrom: 'Verfügbar ab',
  anyDate: 'Beliebiges Datum',
};

const SETTINGS_MODAL_MESSAGES: Translations['SETTINGS_MODAL_MESSAGES'] = {
  dialog: 'Einstellungen',
  nav: 'Einstellungsbereiche',
  close: 'Einstellungen schließen',
  saved: 'Gespeichert',
  currentPlan: 'Aktueller Tarif',
  actions: 'Aktionen',
  storage: {
    storedIn: 'Gespeichert in',
    fileCount: (n, shown) => plural('de', n, { one: `${shown} Datei`, other: `${shown} Dateien` }),
    filterByType: 'Nach Dateityp filtern',
    fileType: 'Dateityp',
    orderBy: 'Sortieren nach',
    modified: 'Geändert',
    oldestFirst: 'Älteste zuerst',
    searchFiles: 'Dateien durchsuchen',
    selectAllOnPage: 'Alle Dateien auf dieser Seite auswählen',
    fileName: 'Dateiname',
    uploadedOn: 'Hochgeladen am',
    fileSize: 'Dateigröße',
    sortBy: { name: 'Nach Dateiname sortieren', uploadedAt: 'Nach Upload-Datum sortieren', size: 'Nach Dateigröße sortieren' },
    selectFile: (name) => `${name} auswählen`,
    deleteFile: 'Datei löschen',
    deleteNamed: (name) => `${name} löschen`,
    noMatches: 'Keine Dateien entsprechen deinen Filtern.',
    documents: 'Dokumente',
    spreadsheets: 'Tabellen',
    videos: 'Videos',
    downloadFile: 'Datei herunterladen',
    rename: 'Umbenennen',
    copyLink: 'Link kopieren',
  },
  tools: {
    showOutput: 'Ausgabe anzeigen',
    refreshTools: 'Tools aktualisieren',
    removeServer: 'Server entfernen',
    logout: 'Abmelden',
    logOutOf: (server) => `Von ${server} abmelden`,
    showTools: (server) => `Tools von ${server} anzeigen`,
    hideTools: (server) => `Tools von ${server} ausblenden`,
    error: 'Fehler',
    showOutputLink: 'Ausgabe anzeigen',
    showOutputOf: (server) => `Ausgabe von ${server} anzeigen`,
    newServer: 'Neuer MCP-Server',
    newServerDescription: 'Eigenen MCP-Server hinzufügen',
    projectScope: 'Projektbereich',
    authentication: 'Authentifizierung',
    waitForAuth: 'Auf MCP-Authentifizierung warten',
    waitForAuthDescription:
      'Bei einer Aufforderung unbegrenzt auf die Authentifizierung warten. Wenn deaktiviert, werden Authentifizierungsaufforderungen nach 30 Sekunden übersprungen.',
    waitForAuthSwitch: 'Auf MCP-Authentifizierung warten',
    scopeServers: (scope) => `MCP-Server von ${scope}`,
    scopeServersDescription: (scope) => `In ${scope} verfügbare Server.`,
    teamServers: 'Team-MCP-Server',
    teamServersDescription: 'Im Dashboard konfiguriert',
    manage: 'Verwalten',
    noTeamServers: 'Keine Team-MCP-Server',
    noTeamServersBody: 'Konfiguriere MCP-Server im Dashboard, um sie auf dem Desktop und in der Cloud verfügbar zu machen.',
    configureTeam: 'Team-MCP-Server konfigurieren',
    pluginServers: 'Plugin-MCP-Server',
  },
};

const EVICTION_MESSAGES: Translations['EVICTION_MESSAGES'] = {
  status: {
    scheduled: 'Angesetzt',
    postponed: 'Verschoben',
    suspended: 'Ausgesetzt',
    executed: 'Vollstreckt',
    cancelled: 'Abgesagt',
  },
  attend: 'Ich bin dabei',
  share: 'Teilen',
  contactSupport: 'Unterstützungsgruppe kontaktieren',
  verified: 'Von der Community bestätigt',
  caseHistory: 'Fallverlauf',
  source: (source) => `Quelle: ${source}`,
};

const BOOKING_MESSAGES: Translations['BOOKING_MESSAGES'] = {
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  guests: 'Gäste',
  addDate: 'Datum hinzufügen',
  reserve: 'Reservieren',
  checkAvailability: 'Verfügbarkeit prüfen',
  notChargedYet: 'Noch wird dir nichts berechnet',
  total: 'Gesamt',
  tripStatus: { confirmed: 'Bestätigt', pending: 'Ausstehend', cancelled: 'Storniert', completed: 'Abgeschlossen' },
  priceName: booking_priceName((p, u) => `${p} pro ${u}`, (s, o) => `${s}, vorher ${o}`),
};

const AGENT_LIMITS_CARD_MESSAGES: Translations['AGENT_LIMITS_CARD_MESSAGES'] = { contextWindow: 'Kontextfenster', freeSpace: 'Freier Platz', planUsageLimits: 'Nutzungslimits des Tarifs', managePlan: 'Tarif verwalten' };

const SWIPE_ROW_MESSAGES: Translations['SWIPE_ROW_MESSAGES'] = {
  closeActions: 'Aktionen schließen',
};

const PATIENT_INFO_CARD_MESSAGES: Translations['PATIENT_INFO_CARD_MESSAGES'] = { addPhoto: 'Profilfoto hinzufügen' };

const THEME_TOGGLE_MESSAGES: Translations['THEME_TOGGLE_MESSAGES'] = { theme: 'Design', darkMode: 'Dunkelmodus', lightMode: 'Hellmodus', useDarkMode: 'Dunkelmodus verwenden', useLightMode: 'Hellmodus verwenden' };

const EARNINGS_MESSAGES: Translations['EARNINGS_MESSAGES'] = {
  earned: 'Verdient',
  period: 'Zeitraum der Einnahmen',
  breakdown: 'Woher es kommt',
  payout: 'Nächste Auszahlung',
  payoutState: { scheduled: 'Geplant', processing: 'Unterwegs', paid: 'Ausgezahlt', held: 'Zurückgehalten', failed: 'Fehlgeschlagen' },
  chart: (label) => `Einnahmen ${label}, nach Zeitraum`,
  empty: 'Noch nichts verdient',
  earnings: 'Einnahmen',
};

const PROOF_OF_DELIVERY_MESSAGES: Translations['PROOF_OF_DELIVERY_MESSAGES'] = {
  labels: {
    signature: 'Unterschrift',
    signaturePad: 'Unterschrift',
    signatureHint: 'Mit dem Finger unterschreiben',
    signed: 'Unterschrieben',
    clear: 'Unterschrift löschen',
    typeName: 'Oder Namen eingeben',
    typeNamePlaceholder: 'Vollständiger Name',
    photo: 'Foto',
    photoHint: 'Wo du es abgestellt hast, oder das Paket beim Empfänger.',
    code: 'Zustellcode',
    codeHint: 'Bitte den Empfänger, den Code aus seiner App vorzulesen.',
    recipient: 'Wer es angenommen hat',
    recipientPlaceholder: 'Name',
    note: 'Notiz',
    notePlaceholder: 'Alles, was festgehalten werden sollte',
    submit: 'Zustellung bestätigen',
    required: 'Erforderlich',
    missing: 'Das wird benötigt, bevor du bestätigen kannst.',
    missingSummary: (n) => plural('de', n, { one: 'Eine Angabe fehlt noch', other: '{n} Angaben fehlen noch' }),
  },
  proofOfDelivery: 'Zustellnachweis',
};

const FILE_UPLOAD_MESSAGES: Translations['FILE_UPLOAD_MESSAGES'] = {
  promptWeb: 'Zum Hochladen hierher ziehen oder',
  promptNative: 'Tippen, um',
  selectWeb: 'auswählen',
  selectNative: 'eine Datei auszuwählen',
  uploading: (size) => `${size} wird hochgeladen...`,
  uploaded: 'Erfolgreich hochgeladen!',
  unsupported: (extensions) => `Nur ${extensions}-Dateien werden unterstützt`,
  tooLarge: (max) => `Die Datei ist größer als ${max}`,
  max: (size) => `(max. ${size})`,
  uploadFile: 'Datei hochladen',
};

const POPOVER_MESSAGES: Translations['POPOVER_MESSAGES'] = {
  popover: 'Pop-up',
};

const QUEUE_PANEL_MESSAGES: Translations['QUEUE_PANEL_MESSAGES'] = {
  queueTab: 'Warteschlange',
  recentTab: 'Zuletzt gehört',
  close: 'Warteschlange schließen',
  nextInQueue: 'Als Nächstes in der Warteschlange',
  nextFrom: (c) => `Als Nächstes aus: ${c}`,
  nextUp: 'Als Nächstes',
  clearQueue: 'Warteschlange leeren',
  reorder: (t) => `${t} verschieben`,
  reorderHint: 'Ziehen oder Pfeiltasten verwenden',
  moveUp: 'Nach oben',
  moveDown: 'Nach unten',
  remove: 'Aus Warteschlange entfernen',
  moved: (t, p, n) => `${t} an Position ${p} von ${n} verschoben`,
  emptyQueue: 'Deine Warteschlange ist leer',
  emptyQueueHint: 'Füge Songs und Folgen hinzu, um sie als Nächstes zu hören.',
  emptyRecent: 'Noch nichts abgespielt',
};

const HOVER_CARD_MESSAGES: Translations['HOVER_CARD_MESSAGES'] = {
  hoverCard: 'Vorschaukarte',
};

const NOTE_EDITOR_MESSAGES: Translations['NOTE_EDITOR_MESSAGES'] = {
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
};

const MEDIA_SHELF_MESSAGES: Translations['MEDIA_SHELF_MESSAGES'] = { filters: 'Filter', showAll: 'Alle anzeigen' };

const CATEGORY_BAR_MESSAGES: Translations['CATEGORY_BAR_MESSAGES'] = { previous: 'Vorherige Kategorien', next: 'Nächste Kategorien' };

const CARRIER_QUOTE_MESSAGES: Translations['CARRIER_QUOTE_MESSAGES'] = {
  labels: {
    accept: 'Annehmen',
    message: 'Nachricht',
    decline: 'Ablehnen',
    pickup: 'Abholung',
    eta: 'Ankunft',
    vehicle: 'Fahrzeug',
    jobs: (jobs) => `${jobs} Aufträge`,
    verified: 'Verifizierter Spediteur',
    marks: { cheapest: 'Günstigstes', fastest: 'Schnellstes' },
    showPrice: 'Preisdetails anzeigen',
    hidePrice: 'Preisdetails ausblenden',
    priceDetails: 'Preisdetails für',
    sort: 'Angebote sortieren',
    sortOptions: { price: 'Günstigste', eta: 'Schnellste', rating: 'Bestbewertet' },
    count: (n) => plural('de', n, { one: '{n} Angebot', other: '{n} Angebote' }),
    loading: 'Angebote werden geladen',
  },
  emptyTitle: 'Noch keine Angebote',
  emptyDescription: 'Spediteure sehen sich deinen Auftrag an. Die ersten Angebote kommen meist innerhalb weniger Minuten.',
  list: 'Angebote',
  priceDetailsFor: (name) => `Preisdetails für ${name}`,
};

const TEXT_FIELD_MESSAGES: Translations['TEXT_FIELD_MESSAGES'] = { showPassword: 'Passwort anzeigen', hidePassword: 'Passwort verbergen', required: 'erforderlich' };

const CHAT_SCREEN_MESSAGES: Translations['CHAT_SCREEN_MESSAGES'] = {
  call: 'Anrufen',
  videoCall: 'Videoanruf',
  searchInConversation: 'In der Unterhaltung suchen',
  connecting: 'Verbindung wird hergestellt…',
  verified: 'Verifiziert',
  bot: 'Bot',
  channel: 'Kanal',
  clearSelection: 'Auswahl aufheben',
  forward: 'Weiterleiten',
  pin: 'Anheften',
  selectedCount: (n) => `${n} ausgewählt`,
  pinnedList: 'Angeheftete Nachrichten anzeigen',
  pinnedClose: 'Angeheftete Leiste ausblenden',
  pinnedUnpin: 'Diese Nachricht loslösen',
  pinnedMessage: 'Angeheftete Nachricht',
  pinnedMessageNumber: (n) => `Angeheftete Nachricht Nr. ${n}`,
  scrollToBottom: 'Zu den neuesten Nachrichten',
  jumpToMention: 'Zur Erwähnung springen',
  emptyTitle: 'Noch keine Nachrichten',
  info: 'Infos',
  members: 'Mitglieder',
  addMember: 'Mitglieder hinzufügen',
  memberSearch: 'Mitglieder suchen',
  noMembers: 'Keine Mitglieder gefunden',
  owner: 'Inhaber',
  admin: 'Admin',
  resizeList: 'Größe der Unterhaltungsliste ändern',
};

const CONTEXT_MENU_MESSAGES: Translations['CONTEXT_MENU_MESSAGES'] = {
  contextMenu: 'Kontextmenü',
};

const SORTABLE_MEDIA_MESSAGES: Translations['SORTABLE_MEDIA_MESSAGES'] = {
  photo: (p, t) => `Foto ${p} von ${t}`,
  cover: 'Titelbild',
  moveEarlier: (p) => `Foto ${p} nach vorne verschieben`,
  moveLater: (p) => `Foto ${p} nach hinten verschieben`,
  remove: (p) => `Foto ${p} entfernen`,
  retry: (p) => `Hochladen von Foto ${p} wiederholen`,
  uploading: (p) => `Foto ${p} wird hochgeladen`,
  failed: 'Hochladen fehlgeschlagen',
  add: 'Fotos hinzufügen',
  moved: (p, t) => `An Position ${p} von ${t} verschoben`,
  photos: 'Fotos',
};

const CONNECTION_DOTS_MESSAGES: Translations['CONNECTION_DOTS_MESSAGES'] = {
  connecting: 'Verbindung wird hergestellt',
};

const CHAT_PEOPLE_MESSAGES: Translations['CHAT_PEOPLE_MESSAGES'] = {
  newGroup: {
    photo: 'Gruppenbild auswählen',
    name: 'Gruppenname',
    namePlaceholder: 'Gib der Gruppe einen Namen',
    description: 'Beschreibung',
    descriptionPlaceholder: 'Wofür ist diese Gruppe?',
    members: (n) => plural('de', n, { one: '{n} Mitglied', other: '{n} Mitglieder' }),
    addMembers: 'Mitglieder hinzufügen',
    remove: (name) => `${name} entfernen`,
  },
  member: {
    owner: 'Eigentümer',
    admin: 'Admin',
    promote: 'Zum Admin machen',
    restrict: 'Einschränken',
    remove: 'Aus Gruppe entfernen',
    actions: (name) => `Aktionen für ${name}`,
  },
  story: {
    close: 'Story schließen',
    previous: 'Vorherige Story',
    next: 'Nächste Story',
    mute: 'Story stummschalten',
    unmute: 'Stummschaltung der Story aufheben',
    more: 'Story-Optionen',
    replyPlaceholder: 'Antworten…',
    send: 'Antwort senden',
    progress: (index, count) => `Story ${index + 1} von ${count}`,
    react: (emoji) => `Mit ${emoji} reagieren`,
  },
  searchMembers: 'Mitglieder suchen',
  share: 'Teilen',
  postOptions: 'Beitragsoptionen',
  pinned: 'Angeheftet',
  views: (c) => plural('de', c, { one: `${c} Aufruf`, other: `${c} Aufrufe` }),
  forwards: (c) => plural('de', c, { one: `${c} Weiterleitung`, other: `${c} Weiterleitungen` }),
  jumpTo: (letter) => `Zu ${letter} springen`,
  add: 'Hinzufügen',
  added: 'Hinzugefügt',
  actionOn: (action, name) => `${action}: ${name}`,
};

const translations: Translations = {
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
