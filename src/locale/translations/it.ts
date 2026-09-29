// Bloom's it strings for every family. Loaded on demand by
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

const CALL_UI_MESSAGES__CORNERS = {
  'top-left': 'in alto a sinistra',
  'top-right': 'in alto a destra',
  'bottom-left': 'in basso a sinistra',
  'bottom-right': 'in basso a destra',
};

const MESSAGE_MEDIA_MESSAGES__items = (n: number) => plural('it', n, { one: '{n} elemento', other: '{n} elementi' });

const COMMON_MESSAGES: Translations['COMMON_MESSAGES'] = {
  close: 'Chiudi',
  dismiss: 'Ignora',
  back: 'Indietro',
  goBack: 'Torna indietro',
  loading: 'Caricamento',
  more: 'Altro',
  moreOptions: 'Altre opzioni',
  moreActions: 'Altre azioni',
  progress: 'Avanzamento',
  stepOf: (step, total) => `Passaggio ${step} di ${total}`,
  labelFor: (label, subject) => `${label} per ${subject}`,
  tapToClose: 'Tocca per chiudere',
  cancel: 'Annulla',
  done: 'Fine',
  save: 'Salva',
  delete: 'Elimina',
  edit: 'Modifica',
  remove: 'Rimuovi',
  retry: 'Riprova',
  search: 'Cerca',
  showMore: 'Mostra di più',
  showLess: 'Mostra di meno',
  next: 'Avanti',
  previous: 'Precedente',
  open: 'Apri',
  menu: 'Menu',
  copy: 'Copia',
  copied: 'Copiato',
  send: 'Invia',
  clear: 'Cancella',
  seeAll: 'Mostra tutto',
  resizePanels: 'Ridimensiona pannelli',
};

const SURFACES_MESSAGES: Translations['SURFACES_MESSAGES'] = { confirm: 'Conferma', ok: 'Va bene' };

const CONTACT_CARD_MESSAGES: Translations['CONTACT_CARD_MESSAGES'] = {
  channels: {
    email: { action: 'Email', name: (s) => `Invia un'email a ${s}` },
    phone: { action: 'Chiama', name: (s) => `Chiama ${s}` },
    chat: { action: 'Messaggio', name: (s) => `Invia un messaggio a ${s}` },
    meeting: { action: 'Riunione', name: (s) => `Pianifica una riunione con ${s}` },
    video: { action: 'Video', name: (s) => `Avvia una videochiamata con ${s}` },
    website: { action: 'Sito web', name: (s) => `Apri il sito web di ${s}` },
  },
  labelsFor: (name) => `Etichette di ${name}`,
  owner: 'Responsabile',
};

const CHAT_LIST_MESSAGES: Translations['CHAT_LIST_MESSAGES'] = {
  item: { draft: 'Bozza:', pinned: 'Fissato', muted: 'Silenziato', verified: 'Verificato', channel: 'Canale', bot: 'Bot', group: 'Gruppo' },
  search: { chat: 'Chat', message: 'Messaggi', contact: 'Contatti', empty: 'Nessun risultato' },
  list: 'Chat',
  emptyTitle: 'Ancora nessuna conversazione',
  emptyDescription: 'Avvia una chat e comparirà qui.',
  searchResults: 'Risultati della ricerca',
  searchChats: 'Cerca chat',
  clearSearch: 'Cancella ricerca',
  newChat: 'Nuova chat',
  archived: 'Archiviate',
  archivedName: (label, n) => `${label}, ${n} chat`,
  folderName: (label, n) => `${label}, ${plural('it', n, { one: '{n} non letto', other: '{n} non letti' })}`,
  stories: 'Storie',
  ownStory: 'La tua storia',
  addStory: 'Aggiungi alla tua storia',
  storyOf: (name) => `Storia di ${name}`,
};

const NOTE_CARD_MESSAGES: Translations['NOTE_CARD_MESSAGES'] = {
  pinned: 'Fissata',
  locked: 'Protetta',
  attachments: (n) => plural('it', n, { one: '{n} allegato', other: '{n} allegati' }),
  select: 'Seleziona nota',
  checklistDone: 'Completato',
  checklistTodo: 'Da fare',
  more: (n) => `altri ${n}`,
};

const DIALOG_MESSAGES: Translations['DIALOG_MESSAGES'] = {
  view: 'Vista',
  dismissDialog: 'Chiudi finestra di dialogo',
  dismissNamed: (label) => `Chiudi ${label}`,
};

const ALERT_DIALOG_MESSAGES: Translations['ALERT_DIALOG_MESSAGES'] = {
  confirm: 'Conferma',
};

const SIDEBAR_MESSAGES: Translations['SIDEBAR_MESSAGES'] = {
  sidebar: 'Barra laterale',
  collapse: 'Comprimi barra laterale',
  expand: 'Espandi barra laterale',
  close: 'Chiudi barra laterale',
  quickSearch: 'Ricerca rapida',
  searchPlaceholder: 'Cerca nella navigazione…',
  searchPlaceholderCompact: 'Cerca...',
  filter: 'Filtra navigazione',
  clearSearch: 'Cancella ricerca nella navigazione',
  noResults: 'Nessun risultato',
  mode: 'Modalità',
  upgrade: 'Esegui l’upgrade',
  usersWithAccess: 'Utenti con accesso',
  addUser: 'Aggiungi utente',
  manage: 'Gestisci',
  accountMenu: 'Menu account',
  teamMenu: (team) => `Menu di ${team}`,
};

const FILE_SIZE_UNITS: Translations['FILE_SIZE_UNITS'] = { byte: 'B', kilobyte: 'KB', megabyte: 'MB', gigabyte: 'GB' };

const CARD_FORM_MESSAGES: Translations['CARD_FORM_MESSAGES'] = {
  labels: { number: 'Numero della carta', expiry: 'Data di scadenza', securityCode: 'Codice di sicurezza', name: 'Nome sulla carta', postcode: 'CAP', country: 'Paese' },
  selectCountry: 'Seleziona un paese',
};

const CHAT_COMPOSER_MESSAGES: Translations['CHAT_COMPOSER_MESSAGES'] = {
  attach: 'Allega',
  emoji: 'Emoji',
  camera: 'Fotocamera',
  mic: 'Registra un messaggio vocale',
  message: 'Messaggio',
  enterHint: 'Invio per inviare · Maiusc + Invio per andare a capo',
  modEnterHint: '⌘ + Invio per inviare · Invio per andare a capo',
  cancelRecording: 'Annulla registrazione',
  sendVoice: 'Invia messaggio vocale',
  deleteRecording: 'Elimina registrazione',
  playRecording: 'Riproduci registrazione',
  pauseRecording: 'Metti in pausa la registrazione',
  lockRecording: 'Blocca registrazione',
  slideToCancel: 'Scorri per annullare',
  recording: 'Registrazione',
  searchEmoji: 'Cerca emoji',
  noEmoji: 'Nessuna emoji trovata',
  frequentlyUsed: 'Usate di frequente',
  skinTone: 'Tonalità della pelle',
  emojiPicker: 'Selettore emoji',
  moreReactions: 'Altre reazioni',
  quickReactions: 'Reazioni rapide',
  messageActions: 'Azioni messaggio',
  attachments: 'Allegati',
  removeAttachment: (name) => `Rimuovi ${name}`,
  suggestions: { mention: 'Persone', command: 'Comandi', emoji: 'Emoji' },
  suggestionVerified: 'Verificato',
  searchingSuggestions: 'Ricerca in corso…',
  noSuggestions: { mention: 'Nessuna persona trovata', command: 'Nessun comando trovato', emoji: 'Nessuna emoji trovata' },
  attachmentItems: { gallery: 'Galleria', camera: 'Fotocamera', file: 'File', location: 'Posizione', contact: 'Contatto', poll: 'Sondaggio', music: 'Musica' },
};

const MAIL_COMPOSE_MESSAGES: Translations['MAIL_COMPOSE_MESSAGES'] = {
  to: 'A',
  cc: 'Cc',
  bcc: 'Ccn',
  subject: 'Oggetto',
  showCopies: 'Cc Ccn',
  hideCopies: 'Nascondi Cc e Ccn',
  removeRecipient: (name) => `Rimuovi ${name}`,
  suggestions: 'Contatti',
  send: COMMON_MESSAGES.send,
  sending: 'Invio',
  attach: 'Allega un file',
  discard: 'Elimina bozza',
  minimize: 'Riduci a icona',
  expand: 'Espandi',
  close: COMMON_MESSAGES.close,
  title: 'Nuovo messaggio',
};

const MEDIA_PLAYER_MESSAGES: Translations['MEDIA_PLAYER_MESSAGES'] = {
  lyrics: 'Testo',
  queue: 'Coda',
  devices: 'Connetti a un dispositivo',
  fullscreen: 'Schermo intero',
  openPlayer: 'Apri il player',
  currentDevice: 'Dispositivo attuale',
  listeningOn: 'In ascolto su',
  listeningOnDevice: (d) => `In ascolto su ${d}`,
  selectDevice: 'Seleziona un dispositivo',
  noDevices: 'Nessun altro dispositivo trovato',
  deviceHelp: 'Non vedi il tuo dispositivo?',
  playbackSpeed: 'Velocità di riproduzione',
  sleepTimer: 'Timer di spegnimento',
  sleepOff: 'Disattivato',
  endOfEpisode: "Fine dell'episodio",
  oneHour: '1 ora',
  minutes: (n) => plural('it', n, { one: '{n} minuto', other: '{n} minuti' }),
  stopsIn: (r) => `Si ferma tra ${r}`,
  shuffle: 'Riproduzione casuale',
  repeat: 'Ripeti',
  repeatOne: 'Ripeti brano',
  skipBack: (n) => plural('it', n, { one: 'Indietro di {n} secondo', other: 'Indietro di {n} secondi' }),
  skipForward: (n) => plural('it', n, { one: 'Avanti di {n} secondo', other: 'Avanti di {n} secondi' }),
  closePlayer: 'Chiudi il player',
  share: 'Condividi',
  showLyrics: 'Mostra testo',
};

const ADDRESS_MESSAGES: Translations['ADDRESS_MESSAGES'] = { emptyTitle: 'Ancora niente qui', addresses: 'Indirizzi' };

const CREATOR_STUDIO_MESSAGES: Translations['CREATOR_STUDIO_MESSAGES'] = {
  releaseTypes: { single: 'Singolo', ep: 'EP', album: 'Album' },
  releaseStatuses: {
    draft: 'Bozza',
    'in-review': 'In revisione',
    scheduled: 'Programmata',
    live: 'Pubblicata',
    rejected: 'Rifiutata',
    takedown: 'Rimossa',
  },
  creditRoles: {
    songwriter: 'Autore',
    producer: 'Produttore',
    composer: 'Compositore',
    performer: 'Interprete',
    lyricist: 'Paroliere',
    'mixing-engineer': 'Tecnico del mix',
    'mastering-engineer': 'Tecnico del mastering',
  },
  periods: { '7d': '7 giorni', '28d': '28 giorni', '12m': '12 mesi', all: 'Sempre' },
  artworkNotSquare: (w, h) => `La copertina deve essere quadrata: questa immagine è di ${w}×${h} px.`,
  artworkTooSmall: (w, h, min) => `La copertina è troppo piccola (${w}×${h} px). Caricane una di almeno ${min}×${min} px.`,
  audience: { title: 'Pubblico', period: 'Periodo' },
  breakdown: {
    locations: 'Località principali',
    cities: 'Città',
    countries: 'Paesi',
    age: 'Età',
    gender: 'Genere',
    sources: 'Fonti di ascolto',
    metric: 'Ascoltatori',
  },
  streams: {
    metrics: 'Metrica del grafico',
    summary: (metric, releases) => (releases ? `${metric} nel tempo; uscite: ${releases}` : `${metric} nel tempo`),
  },
  topTracks: {
    title: 'Brani più ascoltati',
    rank: '#',
    rankName: 'Posizione',
    track: 'Brano',
    streams: 'Ascolti',
    listeners: 'Ascoltatori',
    saves: 'Salvataggi',
    trend: 'Tendenza',
    trends: { up: 'In crescita', down: 'In calo', flat: 'Stabile', new: 'Nuova entrata' },
    newBadge: 'Nuovo',
    empty: 'Ancora nessun ascolto in questo periodo.',
  },
  tracks: (n) => plural('it', n, { one: '{n} brano', other: '{n} brani' }),
  timeline: {
    states: { complete: 'completato', current: 'in corso', upcoming: 'non iniziato', error: 'richiede attenzione' },
    label: "Avanzamento dell'uscita",
  },
  upload: {
    queued: 'In coda',
    processing: 'Transcodifica…',
    ready: 'Pronto',
    failed: 'Caricamento non riuscito',
    remove: (name) => `Rimuovi ${name}`,
    progress: (name) => `Caricamento di ${name}`,
  },
  artwork: {
    title: 'Copertina',
    requirements: '3000×3000 px, JPG o PNG',
    replace: 'Sostituisci',
    remove: 'Rimuovi copertina',
    preview: "Copertina dell'uscita",
    upload: 'Carica copertina',
  },
  credits: {
    title: 'Crediti',
    role: 'Ruolo',
    name: 'Nome',
    add: 'Aggiungi credito',
    remove: (index, name) => (name ? `Rimuovi credito ${index + 1}, ${name}` : `Rimuovi credito ${index + 1}`),
    empty: 'Indica autori, produttori e interpreti di questo brano.',
    field: (field, n) => `${field}, credito ${n}`,
  },
  artists: {
    add: 'Aggiungi',
    addTo: (label) => `Aggiungi: ${label}`,
    remove: (name) => `Rimuovi ${name}`,
  },
  isrc: { hint: 'Formato: CC-XXX-YY-NNNNN', invalid: 'Non è un codice ISRC valido' },
  metadata: {
    title: 'Titolo del brano',
    version: 'Versione',
    versionPlaceholder: 'Remix, live, acustica…',
    explicit: 'Testo esplicito',
    explicitDescription: 'Attiva se il brano contiene linguaggio forte o temi espliciti.',
    genre: 'Genere',
    genrePlaceholder: 'Scegli un genere',
    primaryArtists: 'Artisti principali',
    featuredArtists: 'Artisti ospiti',
    artistPlaceholder: 'Aggiungi il nome di un artista',
    language: 'Lingua del testo',
    languagePlaceholder: 'Scegli una lingua',
    lyrics: 'Testo',
    lyricsPlaceholder: 'Incolla il testo, una riga per ogni verso cantato',
  },
  payout: {
    estimated: 'Guadagni stimati questo mese',
    lastPayout: 'Ultimo pagamento',
    nextPayout: 'Prossimo pagamento',
    statements: 'Visualizza estratti conto',
    chart: 'Guadagni mensili',
  },
  pitch: {
    title: 'Proponi alla redazione',
    description: 'Presenta la tua prossima uscita al team editoriale prima che esca.',
    release: 'Uscita',
    releasePlaceholder: "Scegli un'uscita in arrivo",
    moods: 'Atmosfera',
    genres: 'Genere',
    pitch: 'La tua proposta',
    pitchPlaceholder: 'Cosa rende speciale questa uscita? A chi si rivolge e qual è la storia dietro?',
    submit: 'Invia proposta',
    tagLimit: (max) => `Scegline fino a ${max}`,
    statuses: { submitted: 'Proposta inviata', accepted: 'Selezionata per la revisione', declined: 'Non selezionata questa volta' },
    statusDescriptions: {
      submitted: 'La redazione legge ogni proposta. Riceverai una risposta prima della data di uscita.',
      accepted: 'La tua uscita è in valutazione per le playlist editoriali.',
      declined: 'Questa uscita non è stata selezionata. Potrai proporre la prossima non appena sarà programmata.',
    },
    edit: 'Modifica proposta',
  },
};

const PROPERTY_INSIGHTS_MESSAGES: Translations['PROPERTY_INSIGHTS_MESSAGES'] = {
  energy: 'Energia',
  pending: 'In attesa',
  energyRatingClass: (r) => `Classe energetica ${r}`,
  energyRatingStatus: (s) => `Classe energetica ${String(s).toLowerCase()}`,
  energyRating: 'Classe energetica',
  certificateInProgress: 'Certificato in corso',
  consumption: 'Consumo',
  emissions: 'Emissioni',
  moreEfficient: 'Più efficiente',
  lessEfficient: 'Meno efficiente',
  walkTime: (t) => `${t} a piedi`,
  scoreOutOf: (d, m) => `${d} su ${m}`,
  pricePerSquareMetre: 'Prezzo al metro quadro',
  rentHistory: 'Storico degli affitti',
  rentHistoryEmpty: 'Ancora nessuno storico per questa casa',
  confidence: { low: 'Affidabilità bassa', medium: 'Affidabilità media', high: 'Affidabilità alta' },
  aboveEstimate: (p) => `${p} sopra la stima`,
  belowEstimate: (p) => `${p} sotto la stima`,
  fairPrice: 'Prezzo equo',
  estimatedPrice: 'Prezzo stimato',
  asking: 'Prezzo richiesto',
  noVerdict: 'Dati insufficienti per una valutazione',
  whyThisEstimate: 'Perché questa stima',
  comparables: (n) =>
    plural('it', n, { one: 'Basata su {n} immobile simile', other: 'Basata su {n} immobili simili' }),
  currentPrice: 'Prezzo attuale',
  now: 'Ora',
  noPriceHistory: 'Ancora nessuno storico dei prezzi',
  priceHistoryPeriod: 'Periodo dello storico prezzi',
  priceHistory: 'Storico dei prezzi',
  priceHistoryTrend: (head, a, aw, b, bw) => `${head}: da ${a} (${aw}) a ${b} (${bw}).`,
};

const MAP_MARKER_MESSAGES: Translations['MAP_MARKER_MESSAGES'] = {
  searchAsMapMoves: 'Cerca mentre sposto la mappa',
  searchThisArea: 'Cerca in questa zona',
  stays: (n) => mapMarker_countOf('it', n, { one: '{n} alloggio', other: '{n} alloggi' }),
};

const LISTING_ACTIONS_MESSAGES: Translations['LISTING_ACTIONS_MESSAGES'] = {
  month: 'mese',
  rentalStatus: { available: 'Disponibile', reserved: 'Riservato', rented: 'Affittato' },
  rentalStatusMessage: {
    reserved: 'Un altro richiedente sta finalizzando un contratto. Le nuove visite sono sospese.',
    rented: 'Questa casa è stata affittata e non accetta più richieste.',
  },
  saleStatus: { available: 'In vendita', reserved: 'Riservato', sold: 'Venduto' },
  saleStatusMessage: {
    reserved: 'È stata accettata un’offerta. Per ora l’agente non organizza visite.',
    sold: 'Questa casa è stata venduta.',
  },
  requestViewing: 'Richiedi una visita',
  apply: 'Candidati',
  contactAgent: 'Contatta l’agente',
  requestVisit: 'Richiedi una visita',
  makeOffer: 'Fai un’offerta',
  yourHome: 'La tua casa',
  theirHome: 'La sua casa',
  dates: 'Date',
  guests: 'Ospiti',
  addDates: 'Aggiungi date',
  addGuests: 'Aggiungi ospiti',
  proposeSwap: 'Proponi uno scambio',
  exchangeModes: { swap: 'Scambio reciproco', host: 'Punti ospite', both: 'Entrambi' },
  scheduleViewing: 'Programma una visita',
  noTimesLeft: 'Nessun orario disponibile in questo giorno',
  noteForLandlord: 'Nota per il proprietario',
  day: 'Giorno',
  time: 'Ora',
  submitViewing: 'Richiedi visita',
  inPerson: 'Di persona',
  videoCall: 'Videochiamata',
  viewingType: 'Tipo di visita',
  yourApplication: 'La tua candidatura',
  applicationProgress: 'Avanzamento della candidatura',
  progressReady: (done, total) => `${done} di ${total} pronti`,
  applicationStatus: { missing: 'Mancante', uploaded: 'In revisione', verified: 'Verificato', rejected: 'Rifiutato' },
  applicationAction: { upload: 'Carica', view: 'Visualizza', replace: 'Sostituisci' },
  itemAction: (action, title) => `${action}: ${title}`,
  mortgage: {
    title: 'Calcolatore mutuo',
    price: 'Prezzo dell’immobile',
    downPayment: 'Anticipo',
    downPaymentPercent: 'Percentuale di anticipo',
    percent: 'Percentuale',
    term: 'Durata del mutuo',
    years: 'anni',
    rate: 'Tasso di interesse',
    monthlyPayment: 'Rata mensile',
    principal: 'Capitale',
    interest: 'Interessi',
    loanAmount: 'Importo del mutuo',
    totalInterest: 'Interessi totali',
    totalCost: 'Costo totale',
  },
  termYears: (n) => plural('it', n, { one: '{n} anno', other: '{n} anni' }),
  mortgageDisclaimer:
    'Una stima, non un’offerta. Non include commissioni, tasse e assicurazioni, e presuppone un tasso fisso per tutta la durata.',
};

const AGENT_PROGRESS_MESSAGES: Translations['AGENT_PROGRESS_MESSAGES'] = {
  stepsLeft: (n) => plural('it', n, { one: 'Manca {n} passaggio', other: 'Mancano {n} passaggi' }),
  allCompleted: 'Tutti i passaggi completati',
  minimize: 'Riduci passaggi',
  expand: 'Espandi passaggi',
  defaultSteps: [
    'Leggere i file del progetto',
    'Aggiornare e installare i token della modalità chiara',
    'Implementare i token della modalità scura',
    'Aggiungere un selettore di tema riutilizzabile e registrato',
    'Eseguire registry, lint e build di produzione',
  ],
};

const CALENDAR_MESSAGES: Translations['CALENDAR_MESSAGES'] = {
  newEvent: 'Nuovo evento',
  openNavigation: 'Apri la navigazione',
  month: 'Mese',
  moreEvents: (n) => plural('it', n, { one: '+{n} altro', other: '+{n} altri' }),
  eventDetails: "Dettagli dell'evento",
  join: 'Partecipa',
  editTimeZone: 'Modifica fuso orario',
  participants: 'Partecipanti',
  editParticipants: 'Modifica partecipanti',
  reminders: 'Promemoria',
  editReminders: 'Modifica promemoria',
  duration: calendar_compactDuration(' h', ' min', ' '),
  jumpToDate: 'Vai a una data',
  previousMonth: 'Mese precedente',
  nextMonth: 'Mese successivo',
  chooseDate: (month) => `${month}, scegli una data`,
  inbox: 'Posta in arrivo',
  inboxMenu: 'Menu della posta in arrivo',
  addAccount: 'Aggiungi un nuovo account',
};

const LISTING_DETAILS_MESSAGES: Translations['LISTING_DETAILS_MESSAGES'] = {
  ratedOutOf5: (r) => `Valutazione: ${r} su 5`,
  overallRating: 'Valutazione complessiva',
  unavailable: 'Non disponibile',
  showAllAmenities: (n) => plural('it', n, { one: 'Mostra {n} servizio', other: 'Mostra tutti i {n} servizi' }),
  showAllFeatures: (n) =>
    plural('it', n, { one: 'Mostra {n} caratteristica', other: 'Mostra tutte le {n} caratteristiche' }),
  propertyFeatures: 'Caratteristiche dell’immobile',
  showAllPhotos: 'Mostra tutte le foto',
  listingPhotos: 'Foto dell’annuncio',
  photoOf: (p, t) => `Foto ${p} di ${t}`,
  photoWithAlt: (a, p, t) => `${a}, foto ${p} di ${t}`,
  floorPlanOf: (a, p, t) => `${a}, planimetria ${p} di ${t}`,
  landlord: 'Proprietario',
  agent: 'Agente',
  agency: 'Agenzia',
  activeListings: (n) => plural('it', n, { one: '{n} annuncio attivo', other: '{n} annunci attivi' }),
  verified: 'Verificato',
  showPhone: 'Mostra telefono',
  call: 'Chiama',
  messageHost: 'Scrivi all’host',
  message: 'Invia un messaggio',
};

const PRICE_BREAKDOWN_MESSAGES: Translations['PRICE_BREAKDOWN_MESSAGES'] = {
  states: { estimated: 'Stimato', pending: 'In sospeso' },
  showDetails: 'Mostra dettagli prezzo',
  hideDetails: 'Nascondi dettagli prezzo',
  breakdown: 'Dettaglio del prezzo',
  about: (label) => `Informazioni su ${label}`,
};

const DATE_PICKER_MESSAGES: Translations['DATE_PICKER_MESSAGES'] = {
  cancel: 'Annulla',
  apply: 'Applica',
  previousMonth: 'Mese precedente',
  nextMonth: 'Mese successivo',
  datePlaceholder: 'Seleziona una data',
  dateLabel: 'Data',
  rangePlaceholder: 'Seleziona un intervallo di date',
  rangeLabel: 'Intervallo di date',
  startDate: 'Data di inizio',
  endDate: 'Data di fine',
  daysSelected: (n) => plural('it', n, { one: '{n} giorno selezionato', other: '{n} giorni selezionati' }),
  presets: {
    today: 'Oggi',
    yesterday: 'Ieri',
    lastWeek: 'Settimana scorsa',
    thisMonth: 'Questo mese',
    lastMonth: 'Mese scorso',
    thisYear: "Quest'anno",
    lastYear: 'Anno scorso',
    allTime: 'Sempre',
  },
  meetingTrigger: 'Pianifica una riunione',
  meetingLabel: 'Pianifica riunione',
  send: 'Invia invito',
  selectTime: 'Seleziona un orario',
  duration: (n) => plural('it', n, { one: '{n} minuto', other: '{n} minuti' }),
};

const SHIPMENT_REQUEST_MESSAGES: Translations['SHIPMENT_REQUEST_MESSAGES'] = {
  kinds: {
    envelope: { label: 'Busta', description: 'Documenti, chiavi, qualsiasi cosa piatta.' },
    parcel: { label: 'Pacco', description: 'Una scatola o una borsa che una persona può portare.' },
    furniture: { label: 'Mobili', description: 'Un divano, un tavolo, un materasso: due persone a ogni capo.' },
    pallet: { label: 'Pallet', description: 'Imballato e impilato, movimentato con sponda idraulica.' },
    food: { label: 'Cibo', description: 'Una consegna dal ristorante, alla giusta temperatura.' },
  },
  sizes: {
    small: 'Fino a una scatola da scarpe: 35 × 25 × 20 cm.',
    medium: 'Fino a un bagaglio a mano: 55 × 40 × 25 cm.',
    large: 'Fino a una lavatrice: 85 × 60 × 60 cm.',
    extraLarge: 'Più grande: descrivilo nelle note.',
  },
  access: { ground: 'Piano terra', stairs: 'Scale', lift: 'Ascensore' },
  load: {
    kind: 'Cosa trasportiamo?',
    size: 'Dimensione',
    weight: 'Peso',
    quantity: 'Quanti',
    quantityValue: (n) => plural('it', n, { one: '{n} articolo', other: '{n} articoli' }),
    notes: 'Altro che il corriere dovrebbe sapere?',
    notesPlaceholder: 'Fragile, un codice per l’ascensore, dove lasciarlo…',
  },
  options: { extras: 'Extra', access: 'Accesso a entrambi gli indirizzi', window: 'Quando va ritirato?' },
  form: {
    route: 'Percorso',
    routeDescription: 'Prima il ritiro, poi la consegna.',
    load: 'Il carico',
    photos: 'Foto',
    photosDescription: 'Una foto del carico è la cosa che migliora di più i preventivi che riceverai.',
    options: 'Opzioni',
    optionsDescription: 'Ognuna cambia il prezzo.',
    price: 'Prezzo',
  },
  shipmentRequest: 'Richiesta di spedizione',
};

const LABEL_MESSAGES: Translations['LABEL_MESSAGES'] = { required: 'obbligatorio' };

const CHECKOUT_SUMMARY_MESSAGES: Translations['CHECKOUT_SUMMARY_MESSAGES'] = {
  title: 'Controlla il tuo ordine',
  orderSummary: 'Riepilogo ordine',
  deliverTo: 'Consegna a',
  notChosen: 'Non ancora scelto',
  opensPicker: 'Apre il selettore',
  placeOrder: 'Effettua ordine',
  placingOrder: 'Invio del tuo ordine',
};

const VEHICLE_PICKER_MESSAGES: Translations['VEHICLE_PICKER_MESSAGES'] = {
  from: 'Da',
  fits: (label) => `Cosa entra in: ${label}`,
  unavailable: 'Non disponibile per questo carico',
  vehicle: 'Veicolo',
  vehicles: {
    bike: { label: 'Cargo bike', capacity: 'Fino a 25 kg · 60 × 40 × 40 cm', fits: ['Documenti', 'Un ordine di cibo', 'Una scatola piccola'] },
    car: { label: 'Auto', capacity: 'Fino a 150 kg · 100 × 80 × 60 cm', fits: ['Due valigie', 'Quattro scatoloni', 'Una bicicletta'] },
    van: { label: 'Furgone', capacity: 'Fino a 800 kg · 240 × 150 × 140 cm', fits: ['Un divano', 'Il trasloco di un monolocale', 'Mezzo pallet'] },
    boxTruck: { label: 'Camion furgonato', capacity: 'Fino a 3.500 kg · 420 × 200 × 210 cm', fits: ['Due pallet', 'Il trasloco di un trilocale', 'Una sponda idraulica'] },
    refrigerated: { label: 'Furgone refrigerato', capacity: 'Fino a 700 kg · tra 2 e 8 °C', fits: ['Prodotti freschi', 'Catering refrigerato', 'Fiori'] },
  },
};

const COMPOSER_PANEL_MESSAGES: Translations['COMPOSER_PANEL_MESSAGES'] = {
  message: 'Messaggio',
  add: 'Aggiungi allegato',
  addMenu: 'Aggiungi alla chat',
  permissions: 'Autorizzazioni',
  permissionMode: 'Modalità autorizzazioni',
  learnMore: 'Scopri di più',
  voice: 'Input vocale',
  send: 'Invia messaggio',
  stop: 'Interrompi generazione',
  permissionTrigger: (mode) => `Autorizzazioni: ${mode}`,
  removeFile: (name) => `Rimuovi ${name}`,
  retryFile: (name) => `Riprova ${name}`,
  panelPlaceholder: 'Ciao, di cosa hai bisogno oggi?',
  pillPlaceholder: 'Chiedimi qualsiasi cosa',
  pillCompactPlaceholder: 'Chiedimi',
  modelSettings: 'Impostazioni modello',
  models: 'Modelli',
  modelGroup: 'Modello',
  effort: 'Sforzo',
  effortAuto: 'Automatico',
  faster: 'Più veloce',
  smarter: 'Più intelligente',
  quickSearch: 'Ricerca rapida',
  searchModels: 'Cerca modelli',
  closeSearch: 'Chiudi ricerca',
  noMatches: 'Nessun modello corrispondente',
  providers: 'Fornitori',
  matchingModels: 'Modelli corrispondenti',
  providerModels: (provider) => `Modelli ${provider}`,
  localFolders: 'Cartelle locali',
  context: (percent) => `Contesto ${percent}%`,
  effortLevels: ['Basso', 'Medio', 'Bilanciato', 'Alto', 'Molto alto', 'Massimo'],
  permissionModes: {
    auto: { label: 'Automatico', description: "L'agente decide da solo" },
    manual: { label: 'Manuale', description: 'Chiedi sempre prima di apportare una modifica' },
    plan: { label: 'Modalità piano', description: 'Crea un piano prima di procedere' },
    bypass: { label: 'Ignora tutto', description: "L'agente gestisce le autorizzazioni" },
  },
  addMenuRows: {
    add: 'Aggiungi',
    plugins: 'Plugin',
    files: 'File e cartelle',
    goal: 'Obiettivo',
    goalDescription: 'Imposta un obiettivo per risultati più rapidi',
    plan: 'Modalità piano',
    planDescription: 'Gestisci attività complesse',
    documents: 'Documenti',
    documentsDescription: 'Crea e modifica documenti',
    spreadsheets: 'Fogli di calcolo',
    spreadsheetsDescription: 'Genera fogli di calcolo',
    presentations: 'Presentazioni',
    presentationsDescription: 'Crea materiali di marketing',
    code: 'Blocchi di codice',
    codeDescription: 'Scrivi e modifica codice esistente',
  },
};

const MESSAGE_BUBBLE_MESSAGES: Translations['MESSAGE_BUBBLE_MESSAGES'] = {
  forwardedFrom: (name) => `Inoltrato da ${name}`,
  deleted: 'Questo messaggio è stato eliminato',
  retry: "Riprova l'invio",
  addReaction: 'Aggiungi una reazione',
  replyTo: 'Vai al messaggio citato',
  selected: 'Selezionato',
  pending: 'Invio in corso',
  failed: 'Non inviato',
  reactionSelected: 'selezionata',
  unread: 'Messaggi non letti',
  typing: 'Sta scrivendo…',
};

const PAYMENT_STATUS_MESSAGES: Translations['PAYMENT_STATUS_MESSAGES'] = {
  states: { authorising: 'Autorizzazione in corso', paid: 'Pagato', failed: 'Pagamento non riuscito', refunded: 'Rimborsato', pending: 'Pagamento in sospeso' },
  reference: 'Riferimento',
};

const AVATAR_MESSAGES: Translations['AVATAR_MESSAGES'] = { live: 'DIRETTA' };

const PLACE_CARD_MESSAGES: Translations['PLACE_CARD_MESSAGES'] = {
  openStates: {
    open: 'Aperto',
    'closing-soon': 'Chiude a breve',
    closed: 'Chiuso',
    'opening-soon': 'Apre a breve',
  },
  new: 'Nuovo',
  actions: 'Azioni',
  actionsFor: (name) => `Azioni per ${name}`,
  rated: (value, reviews) =>
    placeCard_withReviews(
      `Valutazione di ${value} su 5`,
      reviews === undefined ? undefined : placeCard_countOf('it', reviews, { one: '{n} recensione', other: '{n} recensioni' }),
    ),
};

const SOCIAL_BUTTON_MESSAGES: Translations['SOCIAL_BUTTON_MESSAGES'] = { actions: { continue: (b) => `Continua con ${b}`, signIn: (b) => `Accedi con ${b}`, signUp: (b) => `Registrati con ${b}` } };

const QUESTIONNAIRE_MESSAGES: Translations['QUESTIONNAIRE_MESSAGES'] = { other: 'Altro', otherPlaceholder: 'Scrivi qui la tua risposta', steps: 'Passaggi', step: (n) => `Passaggio ${n}` };

const MAP_CONTROLS_MESSAGES: Translations['MAP_CONTROLS_MESSAGES'] = {
  group: 'Controlli della mappa',
  locate: 'Mostra la mia posizione',
  following: 'Non seguire più la mia posizione',
  zoomIn: 'Aumenta zoom',
  zoomOut: 'Riduci zoom',
  zoom: 'Zoom',
  tilt: 'Inclina la mappa',
  tiltOff: 'Appiattisci la mappa',
  compass: (degrees) => `Orientamento ${degrees} gradi. Riorienta verso nord`,
  layerTrigger: 'Livelli della mappa',
  layers: 'Mappa',
  overlays: 'Sovrapposizioni',
};

const PAYMENT_METHOD_MESSAGES: Translations['PAYMENT_METHOD_MESSAGES'] = { states: { expired: 'Scaduta', declined: 'Rifiutata' }, default: 'Predefinita', add: 'Aggiungi un metodo di pagamento', emptyTitle: 'Nessun metodo di pagamento salvato', paymentMethods: 'Metodi di pagamento' };

const AVATAR_GROUP_MESSAGES: Translations['AVATAR_GROUP_MESSAGES'] = { more: (n) => plural('it', n, { one: '{n} altra persona', other: 'altre {n} persone' }), profile: 'Profilo' };

const MENUBAR_MESSAGES: Translations['MENUBAR_MESSAGES'] = {
  menuBar: 'Barra dei menu',
};

const AGENT_THINKING_MESSAGES: Translations['AGENT_THINKING_MESSAGES'] = { thinking: 'Sto pensando' };

const AI_CHAT_MESSAGES: Translations['AI_CHAT_MESSAGES'] = {
  feedback: { like: 'Risposta utile', dislike: 'Risposta non utile', copy: 'Copia risposta', copied: 'Copiato!' },
  imageGeneration: {
    generated: 'Immagine generata',
    generating: 'Generazione immagine',
    remaining: (n) => plural('it', n, { one: 'Manca {n} secondo', other: 'Mancano {n} secondi' }),
    likeToast: 'Grazie per il feedback',
    dislikeToast: 'Grazie, lo useremo per migliorare',
  },
  generatedImage: (alt) => `Immagine generata: ${alt}`,
  codePanel: {
    changes: 'Modifiche',
    browser: 'Browser',
    uncommitted: (n) => plural('it', n, { one: '{n} modifica non confermata', other: '{n} modifiche non confermate' }),
    undo: 'Annulla modifiche',
    browserPreview: 'Anteprima browser',
  },
  galleryPanel: {
    gallery: 'Galleria',
    styles: 'Stili',
    stylePresets: 'Stili predefiniti',
    enlarge: (prompt) => `Ingrandisci ${prompt}`,
    minimize: (prompt) => `Riduci ${prompt}`,
    download: (prompt) => `Scarica ${prompt}`,
  },
  panelView: 'Vista pannello',
  openTerminal: 'Apri terminale',
  newGeneration: 'Nuova generazione',
  expandPanel: 'Espandi pannello',
  togglePanel: 'Mostra/nascondi pannello',
  container: { breadcrumb: 'Posizione della chat', share: 'Condividi chat' },
  shell: {
    openNavigation: 'Apri navigazione',
    closeNavigation: 'Chiudi navigazione',
    openPanel: (panel) => `Apri ${String(panel).toLowerCase()}`,
    closePanel: (panel) => `Chiudi ${String(panel).toLowerCase()}`,
  },
  code: 'Codice',
};

const COMMAND_MESSAGES: Translations['COMMAND_MESSAGES'] = {
  placeholder: 'Digita un comando o cerca…',
  empty: 'Nessun risultato trovato.',
  palette: 'Tavolozza dei comandi',
  clearSearch: 'Cancella ricerca',
};

const MUSIC_LIBRARY_MESSAGES: Translations['MUSIC_LIBRARY_MESSAGES'] = {
  kinds: {
    playlist: 'Playlist',
    artist: 'Artista',
    album: 'Album',
    podcast: 'Podcast',
    audiobook: 'Audiolibro',
    folder: 'Cartella',
  },
  library: {
    title: 'La tua libreria',
    create: 'Crea playlist o cartella',
    collapseRail: 'Comprimi La tua libreria',
    expandRail: 'Apri La tua libreria',
    filters: 'Filtri',
    clearFilters: 'Cancella filtri',
    filter: {
      playlists: 'Playlist',
      artists: 'Artisti',
      albums: 'Album',
      podcasts: 'Podcast',
      audiobooks: 'Audiolibri',
    },
    downloaded: 'Scaricato',
    search: 'Cerca nella tua libreria',
    searchPlaceholder: 'Cerca nella tua libreria',
    clearSearch: 'Cancella ricerca',
    sortAndView: 'Ordina e visualizza',
    sortBy: 'Ordina per',
    viewAs: 'Visualizza come',
    sort: {
      recents: 'Recenti',
      'recently-added': 'Aggiunti di recente',
      alphabetical: 'Ordine alfabetico',
      creator: 'Autore',
    },
    view: { compact: 'Compatta', list: 'Elenco', grid: 'Griglia' },
    empty: 'Ancora niente qui',
  },
  item: { pinned: 'Fissato', downloaded: 'Scaricato', nowPlaying: 'In riproduzione' },
  search: { placeholder: 'Cosa vuoi ascoltare?', clear: 'Cancella ricerca', browse: 'Sfoglia' },
  resultTypes: 'Tipi di risultato',
  topResultKinds: {
    song: 'Brano',
    artist: 'Artista',
    album: 'Album',
    playlist: 'Playlist',
    podcast: 'Podcast',
    episode: 'Episodio',
    audiobook: 'Audiolibro',
    profile: 'Profilo',
  },
  recent: {
    title: 'Ricerche recenti',
    clearAll: 'Cancella ricerche recenti',
    remove: (title) => `Rimuovi ${title}`,
  },
};

const LISTING_CARD_MESSAGES: Translations['LISTING_CARD_MESSAGES'] = {
  statuses: { reserved: 'Prenotato', sold: 'Venduto', rented: 'Affittato', unavailable: 'Non disponibile' },
  originally: (p) => `prima ${p}`,
  approximateLocation: 'Posizione approssimativa',
  rated: (r) => `Valutazione: ${r} su 5`,
  ratedWithReviews: (r, c) =>
    plural('it', c, { one: `Valutazione: ${r} su 5, ${c} recensione`, other: `Valutazione: ${r} su 5, ${c} recensioni` }),
  newListing: 'Nuovo',
  previousPhoto: 'Foto precedente',
  nextPhoto: 'Foto successiva',
  saveToWishlist: 'Salva nei preferiti',
  removeFromWishlist: 'Rimuovi dai preferiti',
};

const NAVIGATION_BANNER_MESSAGES: Translations['NAVIGATION_BANNER_MESSAGES'] = {
  states: { 'off-route': 'Fuori percorso', rerouting: 'Ricerca di un nuovo percorso' },
  thenLine: (street, maneuver) => navigationBanner_words('poi', navigationBanner_midSentence(maneuver, 'it'), street),
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
};

const LOCATION_PUCK_MESSAGES: Translations['LOCATION_PUCK_MESSAGES'] = {
  states: { locating: 'Ricerca della tua posizione', located: 'La tua posizione', stale: 'La tua ultima posizione nota' },
  facing: (state, degrees) => `${state}, orientamento ${degrees} gradi`,
};

const CAROUSEL_MESSAGES: Translations['CAROUSEL_MESSAGES'] = {
  previousSlide: 'Slide precedente',
  nextSlide: 'Slide successiva',
  goToSlide: (n) => `Vai alla slide ${n}`,
  slideOf: (at, of) => `${at} di ${of}`,
  carouselRole: 'carosello',
  slideRole: 'slide',
};

const ORDER_STATUS_MESSAGES: Translations['ORDER_STATUS_MESSAGES'] = { states: { current: 'In corso', upcoming: 'Non ancora', failed: 'Non riuscito' }, status: 'Stato' };

const RATING_MESSAGES: Translations['RATING_MESSAGES'] = {
  newRating: 'Nuovo',
  reviews: (c) => rating_countForms('it', c, { one: '{n} recensione', other: '{n} recensioni' }),
  rated: (v) => `Valutazione ${v} su 5`,
  ratedWithReviews: (v, r) => `Valutazione ${v} su 5, ${r}`,
  star: (n) => plural('it', n, { one: '{n} stella', other: '{n} stelle' }),
};

const LISTING_EDITOR_MESSAGES: Translations['LISTING_EDITOR_MESSAGES'] = {
  offering: {
    rent: { title: 'In affitto', description: 'Affitto a lungo termine, con prezzo mensile.' },
    sale: { title: 'In vendita', description: 'Vendi l’immobile.' },
    stay: { title: 'Affitto per vacanze', description: 'Soggiorni brevi, con prezzo a notte.' },
    swap: { title: 'Scambio casa', description: 'Scambia casa con altri membri.' },
    monthlyRent: 'Affitto mensile',
    deposit: 'Deposito cauzionale',
    depositOption: (months) => (months === 0 ? 'Nessuno' : plural('it', months, { one: '{n} mese', other: '{n} mesi' })),
    availableFrom: 'Disponibile dal',
    minimumStay: 'Durata minima',
    months: (months) => plural('it', months, { one: '{n} mese', other: '{n} mesi' }),
    askingPrice: 'Prezzo richiesto',
    pricePerArea: 'Prezzo al m²',
    pricePerAreaEmpty: 'Aggiungi un prezzo',
    nightlyRate: 'Prezzo a notte',
    cleaningFee: 'Costo di pulizia',
    minimumNights: 'Notti minime',
    nights: (nights) => plural('it', nights, { one: '{n} notte', other: '{n} notti' }),
    swapMode: 'Come vuoi fare lo scambio?',
    swapModes: { swap: 'Scambiare casa', host: 'Solo ospitare', both: 'Entrambi' },
    group: 'Come viene offerto l’immobile?',
  },
  propertyTypes: {
    apartment: 'Appartamento',
    house: 'Casa',
    room: 'Stanza',
    studio: 'Monolocale',
    duplex: 'Duplex',
    penthouse: 'Attico',
    coliving: 'Coliving',
    hostel: 'Ostello',
    other: 'Altro',
  },
  propertyType: 'Tipo di immobile',
  addressPrecision: {
    exact: {
      title: 'Indirizzo esatto',
      description: 'Il segnaposto è sull’edificio. Ideale per case comunque facili da trovare.',
    },
    street: {
      title: 'Solo la via',
      description: 'Mostra la via, non il numero civico. L’indirizzo esatto viene condiviso dopo la prenotazione o la firma.',
    },
    approximate: {
      title: 'Zona approssimativa',
      description: 'Mostra un cerchio di circa 500 m. L’opzione più riservata.',
    },
  },
  addressPrecisionLabel: 'Precisione dell’indirizzo',
  addressPrecisionFootnote:
    'La mappa pubblicata segue questa scelta. Il tuo indirizzo esatto viene condiviso solo con le persone che confermi.',
  qualityTitle: 'Qualità dell’annuncio',
  qualityScore: 'Punteggio di qualità dell’annuncio',
  tips: 'Consigli',
  todo: 'Da fare',
  needsWork: 'Da migliorare',
  good: 'Buono',
  excellent: 'Eccellente',
  previewTitle: 'Anteprima',
  previewDescription: 'Ecco come gli ospiti vedranno il tuo annuncio.',
  card: 'Scheda',
  page: 'Pagina',
  previewAs: 'Anteprima come',
  reviews: (n, shown) => plural('it', n, { one: '{s} recensione', other: '{s} recensioni' }).replace('{s}', shown),
};

const MEDIA_HEADER_MESSAGES: Translations['MEDIA_HEADER_MESSAGES'] = {
  artistPick: "Scelta dell'artista",
  saveEpisode: 'Salva episodio',
  share: 'Condividi',
  podcastEpisode: 'Episodio del podcast',
  listeningProgress: 'Avanzamento ascolto',
  shuffle: 'Riproduzione casuale',
  download: 'Scarica',
  downloadProgress: 'Avanzamento download',
  follow: 'Segui',
  following: 'Segui già',
  searchInPlaylist: 'Cerca nella playlist',
  compactView: 'Vista compatta',
  editDetails: 'Modifica dettagli',
  about: 'Informazioni',
  discography: 'Discografia',
  showAll: 'Mostra tutto',
  albums: 'Album',
  singlesAndEps: 'Singoli ed EP',
  compilations: 'Compilation',
  audiobook: 'Audiolibro',
  popular: 'Popolari',
  seeMore: 'Vedi altro',
  podcast: 'Podcast',
  latestEpisode: 'Ultimo episodio',
  verifiedArtist: 'Artista verificato',
  profile: 'Profilo',
  editProfile: 'Modifica profilo',
};

const MENU_ITEM_MESSAGES: Translations['MENU_ITEM_MESSAGES'] = {
  diets: { vegetarian: 'Vegetariano', vegan: 'Vegano', 'gluten-free': 'Senza glutine', 'dairy-free': 'Senza lattosio', halal: 'Halal', kosher: 'Kosher' },
  spicy: 'Piccante',
  spiceOf: (label, level, max) => `${label} ${level} su ${max}`,
  originally: (price, original) => `${price}, prima ${original}`,
  inBasket: (n) => `${n} nel carrello`,
  soldOut: 'Esaurito',
  addItem: (name) => `Aggiungi ${name}`,
  choose: (n) => `Scegline ${n}`,
  chooseRange: (min, max) => `Scegline da ${min} a ${max}`,
  upTo: (n) => `Fino a ${n}`,
  optional: 'Facoltativo',
  quantity: 'Quantità',
  addToBasket: 'Aggiungi al carrello',
  options: 'Opzioni',
};

const PAGINATION_MESSAGES: Translations['PAGINATION_MESSAGES'] = {
  pagination: 'Paginazione',
  goToPage: (page) => `Vai a pagina ${page}`,
};

const LEAD_SCORE_MESSAGES: Translations['LEAD_SCORE_MESSAGES'] = { title: 'Punteggio lead', factors: 'Da cosa è composto', bands: { cold: 'Freddo', warm: 'Tiepido', hot: 'Caldo' } };

const DIRECTIONS_MESSAGES: Translations['DIRECTIONS_MESSAGES'] = {
  modes: { drive: 'Auto', transit: 'Mezzi pubblici', walk: 'A piedi', cycle: 'Bici' },
  traffic: { light: 'Traffico scorrevole', moderate: 'Traffico moderato', heavy: 'Traffico intenso' },
  maneuvers: {
    depart: 'Partenza',
    straight: 'Prosegui dritto',
    'slight-left': 'Svolta leggermente a sinistra',
    left: 'Svolta a sinistra',
    'sharp-left': 'Svolta nettamente a sinistra',
    'slight-right': 'Svolta leggermente a destra',
    right: 'Svolta a destra',
    'sharp-right': 'Svolta nettamente a destra',
    uturn: 'Fai inversione a U',
    roundabout: 'Alla rotonda',
    merge: 'Immettiti',
    arrive: 'Arrivo',
    board: 'Sali',
    alight: 'Scendi',
    transfer: 'Cambia',
    walk: 'Cammina',
  },
  directions: 'Indicazioni',
  otherRoutes: 'Altri percorsi',
  travelMode: 'Mezzo di trasporto',
  start: 'Avvia',
  currentStep: 'Passaggio attuale',
  line: (name) => `Linea ${name}`,
};

const CART_PANEL_MESSAGES: Translations['CART_PANEL_MESSAGES'] = {
  basket: 'Carrello',
  checkout: 'Vai al pagamento',
  emptyTitle: 'Il carrello è vuoto',
  emptyDescription: 'Aggiungi qualcosa dal menu e comparirà qui.',
  soldOut: 'Esaurito',
  removeItem: (name) => `Rimuovi ${name}`,
  originally: (price, original) => `${price}, prima ${original}`,
  promoCode: 'Codice promozionale',
  apply: 'Applica',
  tip: 'Mancia',
};

const MEDIA_CARD_MESSAGES: Translations['MEDIA_CARD_MESSAGES'] = {
  albumTypes: { album: 'Album', single: 'Singolo', ep: 'EP', compilation: 'Compilation' },
  artist: 'Artista',
  verified: 'Verificato',
  audiobook: 'Audiolibro',
  narratedBy: (n) => `Letto da ${n}`,
  progressOf: (t) => `Avanzamento di ${t}`,
  episode: 'Episodio',
  played: 'Ascoltato',
  event: 'Evento',
  soldOut: 'Esaurito',
  listeningNow: 'In ascolto ora',
  trackBy: (t, a) => `${t} di ${a}`,
  mix: 'Mix',
  playlist: 'Playlist',
  collaborative: 'Collaborativa',
  ownedBy: (o) => `Di ${o}`,
  podcast: 'Podcast',
  profile: 'Profilo',
  followsYou: 'Ti segue',
  song: 'Brano',
  share: 'Condividi',
  listened: 'Ascoltato',
};

const JOB_BOARD_MESSAGES: Translations['JOB_BOARD_MESSAGES'] = {
  labels: {
    take: 'Accetta il lavoro',
    pass: 'Salta',
    distance: 'Distanza',
    duration: 'Tempo',
    window: 'Fascia',
    pickup: 'Ritiro',
    dropoff: 'Consegna',
    state: { taken: 'Assegnato', expired: 'Scaduto' },
    showPay: 'Mostra il compenso',
    hidePay: 'Nascondi il compenso',
    payDetails: 'Compenso per',
    sort: 'Ordina i lavori',
    filtersToggle: 'Filtri',
    filtersActive: (n) => plural('it', n, { one: '{n} applicato', other: '{n} applicati' }),
    sortOptions: {
      pay: 'Pagati meglio',
      distance: 'Più vicini',
      soonest: 'Iniziano prima',
      expiring: 'Chiudono prima',
    },
    filters: { distance: 'Distanza', pay: 'Compenso', when: 'Quando', vehicle: 'Veicolo' },
    clearFilters: 'Rimuovi i filtri',
    refresh: 'Aggiorna la lista',
    count: (n) => plural('it', n, { one: '{n} lavoro', other: '{n} lavori' }),
    loading: 'Caricamento dei lavori',
  },
  emptyTitle: 'Nessun lavoro al momento',
  emptyDescription: 'Nulla corrisponde a ciò che cerchi. Allarga un filtro o aggiorna di nuovo tra un minuto.',
  list: 'Lavori',
  payDetailsFor: (load) => `Compenso per ${load}`,
  route: (pickup, dropoff) => `${pickup} e ${dropoff}`,
  bands: {
    anyDistance: 'Qualsiasi distanza',
    underKm: (km) => `Meno di ${km} km`,
    anyTime: 'In qualsiasi momento',
    withinHour: 'Entro un\'ora',
    nextHours: (hours) => `Nelle prossime ${hours} ore`,
    today: 'Oggi',
  },
};

const FLOATING_MESSAGES: Translations['FLOATING_MESSAGES'] = {
  submenu: 'Sottomenu',
};

const AGENT_CHAT_MESSAGES: Translations['AGENT_CHAT_MESSAGES'] = {
  chat: {
    newChat: 'Nuova chat',
    emptyTitle: 'Come posso aiutarti?',
    emptyDescription: 'Questa chat usa la tua chiave API. La cronologia resta in questo browser.',
    thinking: 'Sto pensando',
    error: 'Si è verificato un errore. Controlla i log del server, poi riprova.',
    suggestions: [
      'Spiega cosa fa questo progetto di partenza',
      'Scrivi un aggiornamento di prodotto in tre frasi',
      'Dammi cinque nomi per un’app di prenotazione appuntamenti',
    ],
    you: 'Tu',
    assistant: 'Assistente',
  },
  actions: {
    share: 'Condividi chat',
    shared: 'Trascrizione copiata',
    more: 'Altre azioni per questa chat',
    exportChats: 'Esporta chat',
    markUnread: 'Segna come non letta',
    deleteChat: 'Elimina chat',
  },
  message: { copy: 'Copia messaggio', readAloud: 'Leggi ad alta voce', stopReading: 'Interrompi la lettura' },
  history: {
    region: 'Cronologia chat',
    recent: 'Recenti',
    empty: 'Le chat che inizi appaiono qui.',
    rename: 'Rinomina',
    renameField: 'Rinomina chat',
    markUnread: 'Segna come non letta',
    unread: 'Non letta',
    exportCount: (n) =>
      n === 0 ? 'Nessuna chat da esportare' : plural('it', n, { one: 'Esporta {n} chat', other: 'Esporta {n} chat' }),
    accountMenu: (name) => `Menu account di ${name}`,
    usageLeft: 'Utilizzo rimanente',
    upgrade: 'Passa a Max',
    logOut: 'Esci',
  },
  composer: {
    field: 'Messaggio',
    placeholder: 'Chiedimi qualsiasi cosa',
    attach: 'Aggiungi allegato',
    send: 'Invia messaggio',
    stop: 'Interrompi generazione',
    notConfigured: 'Non configurato',
    messageCount: (n) => plural('it', n, { one: '{n} messaggio', other: '{n} messaggi' }),
    answeringWith: (model) => `Risposta con ${model}`,
  },
  ago: {
    justNow: 'proprio ora',
    minutes: (n) => plural('it', n, { one: '{n} minuto fa', other: '{n} minuti fa' }),
    hours: (n) => plural('it', n, { one: '{n} ora fa', other: '{n} ore fa' }),
    days: (n) => plural('it', n, { one: '{n} giorno fa', other: '{n} giorni fa' }),
  },
  age: { now: 'ora', minutes: (n) => `${n} min`, hours: (n) => `${n} h`, days: (n) => `${n} g` },
};

const WEB_SEARCH_MESSAGES: Translations['WEB_SEARCH_MESSAGES'] = { sources: 'Fonti', working: 'In corso' };

const MAIL_THREAD_MESSAGES: Translations['MAIL_THREAD_MESSAGES'] = {
  to: 'A',
  cc: 'Cc',
  bcc: 'Ccn',
  reply: 'Rispondi',
  replyAll: 'Rispondi a tutti',
  forward: 'Inoltra',
  more: COMMON_MESSAGES.more,
  moreAddresses: (n) => `altri ${n}`,
  earlierMessages: (n) =>
    plural('it', n, { one: '{n} messaggio precedente', other: '{n} messaggi precedenti' }),
  showTrimmed: 'Mostra contenuto tagliato',
  hideTrimmed: 'Nascondi contenuto tagliato',
  unread: 'Non letto',
  starred: 'Speciale',
  star: 'Aggiungi a Speciali',
  attachments: 'Allegati',
  attachmentCount: (n) => plural('it', n, { one: '{n} allegato', other: '{n} allegati' }),
  expand: 'Espandi messaggio',
  collapse: 'Comprimi messaggio',
};

const NOTIFICATION_CENTER_MESSAGES: Translations['NOTIFICATION_CENTER_MESSAGES'] = {
  title: 'Notifiche',
  emptyMessage: 'Sei in pari.',
  emptyDescription: 'Le nuove attività appariranno qui non appena arrivano.',
  noUnread: 'Nessuna notifica da leggere',
  unread: (n) => plural('it', n, { one: '{n} da leggere', other: '{n} da leggere' }),
  markAllRead: 'Segna tutto come letto',
  category: 'Categoria di notifica',
  tabs: { all: 'Tutte', mentions: 'Menzioni', system: 'Sistema' },
  unreadDot: 'Da leggere',
};

const CHART_CARDS_MESSAGES: Translations['CHART_CARDS_MESSAGES'] = {
  titles: {
    activity: 'Attività',
    agents: 'Agenti',
    visitors: 'Visitatori',
    breakdown: 'Ripartizione',
    sessions: 'Sessioni',
    contributionsThisYear: 'Contributi quest\'anno',
    earnedSoFar: 'Guadagnato finora',
    signUpFunnel: 'Funnel di registrazione',
    activeUsers: 'Utenti attivi',
    revenue: 'Ricavi',
    mostActiveDays: 'Giorni più attivi',
    orders: 'Ordini',
    trackedTime: 'Tempo registrato',
    revenuePerAccount: 'Ricavi per account',
    sleepScore: 'Punteggio del sonno',
    pipeline: 'Pipeline di vendita',
    steps: 'Passi',
    tokens: 'Token',
  },
  weekly: 'Settimanale',
  monthly: 'Mensile',
  yearly: 'Annuale',
  stepsSuffix: 'passi',
  today: 'Oggi',
  thisYear: 'Quest\'anno',
  lastYear: 'Anno scorso',
  sinceLastYear: 'l\'anno scorso',
  aYearEarlier: 'un anno prima',
  earningsPeriod: 'Periodo dei guadagni',
  changePeriod: 'Cambia periodo',
  period: 'Periodo',
  total: 'totale',
  average: 'media',
  thisMonth: 'questo mese',
  ofGoal: 'dell\'obiettivo',
  totalSteps: 'passi in totale',
  gaugeChart: (title, reading) => `Indicatore ${title}: ${reading}`,
  halfGaugeChart: (title, items) => `Semicerchio ${title}: ${items}`,
  radialChart: (title, items) => `Grafico radiale ${title}: ${items}`,
  percentOfGoal: (pct) => `${pct}% dell'obiettivo`,
  periodOf: (label) => `Periodo di ${label.toLowerCase()}`,
  chartVs: (title, current, previous) => `Grafico ${title}: ${current.toLowerCase()} rispetto a ${previous.toLowerCase()}`,
  lineChart: (title) => `Grafico a linee ${title}`,
  barChart: (title, items) => `Grafico a barre ${title}: ${items}`,
  comboChart: (title, bar, line) => `Grafico ${title}: barre ${bar} rispetto alla linea ${line}`,
  scatterChart: (title, series) => `Grafico a dispersione ${title}: ${series}`,
  bubbleChart: (title, series) => `Grafico a bolle ${title}: ${series}`,
  ringItem: (label, value, pct) => `${label} ${value}, ${pct}% dell'obiettivo`,
  scoreOf: (score, max) => `${score} su ${max}`,
  activityFor: (name, day) => `Attività del ${day} ${name}`,
  contributions: (n, date) => { const on = date ? ` il ${date}` : ''; return n === 0 ? `Nessun contributo${on}` : plural('it', n, { one: `{n} contributo${on}`, other: `{n} contributi${on}` }); },
};

const CODE_MESSAGES: Translations['CODE_MESSAGES'] = { copy: 'Copia codice', copied: 'Codice copiato' };

const OUTLINE_NAV_MESSAGES: Translations['OUTLINE_NAV_MESSAGES'] = { outline: 'In questa pagina', progress: (at, of) => `Titolo ${at} di ${of}` };

const STEPPER_MESSAGES: Translations['STEPPER_MESSAGES'] = { decrease: 'Diminuisci', increase: 'Aumenta' };

const CALL_UI_MESSAGES: Translations['CALL_UI_MESSAGES'] = {
  status: {
    calling: 'Chiamata in corso…',
    ringing: 'Squilla',
    connecting: 'Connessione…',
    active: 'Connesso',
    reconnecting: 'Riconnessione…',
    onHold: 'In attesa',
    ended: 'Chiamata terminata',
  },
  controls: {
    mute: 'Disattiva microfono',
    unmute: 'Attiva microfono',
    speakerOn: 'Attiva vivavoce',
    speakerOff: 'Disattiva vivavoce',
    videoOn: 'Attiva fotocamera',
    videoOff: 'Disattiva fotocamera',
    flipCamera: 'Cambia fotocamera',
    screenShareOn: 'Condividi schermo',
    screenShareOff: 'Interrompi condivisione schermo',
    addParticipant: 'Aggiungi partecipante',
    endCall: 'Termina chiamata',
  },
  screen: {
    minimise: 'Riduci chiamata',
    chat: 'Apri chat',
    participants: 'Partecipanti',
    movePip: (c) => `Sposta la tua anteprima (ora ${callUi_corner(CALL_UI_MESSAGES__CORNERS, c)})`,
  },
  pipCorners: CALL_UI_MESSAGES__CORNERS,
  history: {
    incoming: 'In arrivo',
    outgoing: 'In uscita',
    missed: 'Persa',
    declined: 'Rifiutata',
    callBack: (name) => `Richiama ${name}`,
  },
  incoming: {
    accept: 'Accetta',
    decline: 'Rifiuta',
    message: 'Messaggio',
    remind: 'Ricordamelo',
    slideToAnswer: 'Scorri per rispondere',
    voice: 'Chiamata vocale in arrivo',
    video: 'Videochiamata in arrivo',
  },
  returnToCall: 'Torna alla chiamata',
  returnToCallWith: (name) => `Torna alla chiamata con ${name}`,
  join: 'Partecipa',
  leave: 'Esci',
  speaking: (name) => `${name} sta parlando`,
  overflow: (n) => `+${n} altri`,
  muted: (name) => `${name}, microfono disattivato`,
};

const RECENT_HIRES_CARD_MESSAGES: Translations['RECENT_HIRES_CARD_MESSAGES'] = { title: 'Assunzioni recenti' };

const MAIL_LIST_MESSAGES: Translations['MAIL_LIST_MESSAGES'] = {
  draft: 'Bozza:',
  unread: 'Non letto',
  starred: 'Speciale',
  star: 'Aggiungi a Speciali',
  attachment: 'Con allegato',
  select: 'Seleziona',
  threadCount: (n) => plural('it', n, { one: '{n} messaggio', other: '{n} messaggi' }),
  moreLabels: (n) => plural('it', n, { one: 'altra {n} etichetta', other: 'altre {n} etichette' }),
  selectedCount: (n) => plural('it', n, { one: '{n} selezionato', other: '{n} selezionati' }),
  selectAll: 'Seleziona tutto',
  clearSelection: 'Cancella selezione',
  emptyTitle: 'Nessun elemento',
  emptyDescription: 'I nuovi messaggi arrivano in questa cartella.',
  today: 'Oggi',
  yesterday: 'Ieri',
  list: 'Posta',
};

const IMPORTANT_ALERTS_CARD_MESSAGES: Translations['IMPORTANT_ALERTS_CARD_MESSAGES'] = { title: 'Avvisi importanti', thisWeek: 'questa settimana' };

const STAT_CARDS_MESSAGES: Translations['STAT_CARDS_MESSAGES'] = { about: (label) => `Informazioni su ${label}`, fromLastMonth: 'Rispetto al mese scorso' };

const SHAPE_MESSAGES: Translations['SHAPE_MESSAGES'] = {
  shapes: shapes_shapeNames(
    {
      square: 'Quadrato',
      slanted: 'Inclinato',
      arch: 'Arco',
      semicircle: 'Semicerchio',
      oval: 'Ovale',
      pill: 'Pillola',
      triangle: 'Triangolo',
      arrow: 'Freccia',
      fan: 'Ventaglio',
      diamond: 'Rombo',
      clamshell: 'Conchiglia',
      pentagon: 'Pentagono',
      gem: 'Gemma',
      'very-sunny': 'Molto soleggiato',
      sunny: 'Soleggiato',
      burst: 'Scoppio',
      'soft-burst': 'Scoppio morbido',
      boom: 'Esplosione',
      'soft-boom': 'Esplosione morbida',
      flower: 'Fiore',
      puffy: 'Soffice',
      'puffy-diamond': 'Rombo soffice',
      'ghost-ish': 'Quasi fantasma',
      'pixel-circle': 'Cerchio pixelato',
      'pixel-triangle': 'Triangolo pixelato',
      bun: 'Panino',
      heart: 'Cuore',
    },
    (n) => `Biscotto a ${n} lati`,
    (n) => `Trifoglio a ${n} foglie`,
  ),
};

const TENANCY_MESSAGES: Translations['TENANCY_MESSAGES'] = {
  leasePaymentStatus: { upcoming: 'In arrivo', due: 'In scadenza', overdue: 'Scaduto', paid: 'Pagato' },
  rentPaymentStatus: { paid: 'Pagato', pending: 'In attesa', overdue: 'Scaduto', partial: 'Parziale' },
  maintenanceCategory: {
    plumbing: 'Idraulica',
    electrical: 'Impianto elettrico',
    appliances: 'Elettrodomestici',
    heating: 'Riscaldamento',
    other: 'Altro',
  },
  maintenancePriority: { low: 'Priorità bassa', medium: 'Priorità media', high: 'Priorità alta', urgent: 'Urgente' },
  maintenanceStage: { reported: 'Segnalata', acknowledged: 'Presa in carico', scheduled: 'Programmata', resolved: 'Risolta' },
  documentStatus: { signed: 'Firmato', pending: 'In attesa di firma', expired: 'Scaduto' },
  timelineState: { complete: 'Completato', current: 'In corso', upcoming: 'Non ancora' },
  leasePeriod: 'Durata del contratto',
  monthlyRent: 'Affitto mensile',
  deposit: 'Deposito cauzionale',
  nextPayment: 'Prossimo pagamento',
  paidThisYear: 'Pagato quest’anno',
  outstanding: 'Da pagare',
  noPayments: 'Ancora nessun pagamento',
  columns: { month: 'Mese', dueDate: 'Scadenza', method: 'Metodo', amount: 'Importo', status: 'Stato' },
  downloadReceipt: (month) => `Scarica la ricevuta di ${month}`,
  dueOn: (date) => `Scade il ${date}`,
  comments: (n) => plural('it', n, { one: '{n} commento', other: '{n} commenti' }),
  photo: (position, total) => `Foto ${position} di ${total}`,
  photoWithAlt: (alt, position, total) => `${alt}, foto ${position} di ${total}`,
  sign: 'Firma',
  signDocument: (name) => `Firma ${name}`,
  viewDocument: (name) => `Visualizza ${name}`,
  downloadDocument: (name) => `Scarica ${name}`,
  noDocuments: 'Nessun documento',
};

const DATA_TABLE_MESSAGES: Translations['DATA_TABLE_MESSAGES'] = {
  selectAll: 'Seleziona tutte le righe di questa pagina',
  selectRow: (id) => `Seleziona la riga ${id}`,
  densityLabel: 'Densità della tabella',
  density: { md: 'Normale', sm: 'Compatta' },
};

const ERROR_BOUNDARY_MESSAGES: Translations['ERROR_BOUNDARY_MESSAGES'] = { title: 'Qualcosa è andato storto', message: 'Si è verificato un errore imprevisto', retry: 'Riprova' };

const AI_PROFILE_CARD_MESSAGES: Translations['AI_PROFILE_CARD_MESSAGES'] = {
  contributions: 'Contributi quest’anno',
  activity: 'Attività',
  periodGroup: (label) => `Periodo: ${label}`,
  periods: { weekly: 'Settimanale', monthly: 'Mensile', yearly: 'Annuale' },
};

const BREADCRUMB_MESSAGES: Translations['BREADCRUMB_MESSAGES'] = {
  breadcrumb: 'Percorso di navigazione',
};

const MESSAGE_MEDIA_MESSAGES: Translations['MESSAGE_MEDIA_MESSAGES'] = {
  photo: 'Foto',
  video: 'Video',
  photoOf: (i, total) => `Foto ${i} di ${total}`,
  videoOf: (i, total) => `Video ${i} di ${total}`,
  tapToView: 'Tocca per vedere',
  sendingPhoto: 'Invio della foto',
  sendingVideo: 'Invio del video',
  sendingAlbum: "Invio dell'album",
  sendingSticker: 'Invio dello sticker',
  sendingGif: 'Invio della GIF',
  album: (n) => `Album, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  sharedMedia: (n) => `Contenuti multimediali condivisi, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  sharedFiles: (n) => `File condivisi, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  moreItems: (n) => `+${n} altri`,
  notSent: 'Non inviato',
  voiceMessage: (d) => `Messaggio vocale, ${d}`,
  playVoiceMessage: 'Riproduci messaggio vocale',
  pauseVoiceMessage: 'Metti in pausa messaggio vocale',
  transcribe: 'Trascrivi',
  hideTranscript: 'Nascondi trascrizione',
  seek: 'Posizione',
  seekPosition: (p, d) => `${p} di ${d}`,
  playbackSpeed: (r) => `Velocità di riproduzione, ${r}`,
  unplayed: 'Non ascoltato',
  download: 'Scarica',
  downloaded: 'Scaricato',
  file: 'File',
  fileKinds: {
    pdf: 'PDF',
    doc: 'DOCUMENTO',
    sheet: 'FOGLIO DI CALCOLO',
    slides: 'PRESENTAZIONE',
    zip: 'ZIP',
    audio: 'AUDIO',
    video: 'VIDEO',
    image: 'IMMAGINE',
    code: 'CODICE',
  },
  contact: 'Contatto',
  message: 'Messaggio',
  add: 'Aggiungi',
  location: 'Posizione',
  liveLocation: 'Posizione in tempo reale',
  stopSharing: 'Interrompi condivisione',
  vote: 'Vota',
  viewResults: 'Vedi risultati',
  anonymousVoting: 'Voto anonimo',
  quiz: 'Quiz',
  selectOne: "Scegline una",
  selectOneOrMore: 'Scegline una o più',
  correctAnswer: 'risposta corretta',
  yourAnswer: 'la tua risposta',
  votes: (n) => (n === 0 ? 'Nessun voto' : plural('it', n, { one: '{n} voto', other: '{n} voti' })),
  sticker: 'Sticker',
};

const PIPELINE_MESSAGES: Translations['PIPELINE_MESSAGES'] = {
  health: { 'on-track': 'In linea', 'at-risk': 'A rischio', stalled: 'In stallo' },
  stalledFor: (duration) => `In stallo da ${duration}`,
  move: (title) => `Sposta ${title}`,
  stages: 'Fasi della pipeline',
  stageWithCount: (name, n) => `${name}, ${plural('it', n, { one: '{n} trattativa', other: '{n} trattative' })}`,
  empty: 'Nessuna trattativa in questa fase',
  loadMore: 'Carica altro',
};

const STAY_SEARCH_MESSAGES: Translations['STAY_SEARCH_MESSAGES'] = {
  where: 'Dove',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  when: 'Quando',
  who: 'Chi',
  destinationPlaceholder: 'Cerca destinazioni',
  datesPlaceholder: 'Aggiungi date',
  guestsPlaceholder: 'Aggiungi ospiti',
  guests: { adults: 'Adulti', children: 'Bambini', infants: 'Neonati', pets: 'Animali' },
  guestDescriptions: {
    adults: 'Dai 13 anni in su',
    children: 'Da 2 a 12 anni',
    infants: 'Meno di 2 anni',
    pets: 'Viaggi con un animale di servizio?',
  },
  dateFlexibility: 'Flessibilità delle date',
  exactDates: 'Date esatte',
  plusMinusDays: (n) => plural('it', n, { one: '± {n} giorno', other: '± {n} giorni' }),
  destinations: 'Destinazioni',
  whereTo: 'Dove vuoi andare?',
  filters: 'Filtri',
};

const AUTH_CARD_MESSAGES: Translations['AUTH_CARD_MESSAGES'] = {
  modes: {
    signin: {
      title: 'Bentornato',
      description: 'Accedi per riprendere da dove avevi lasciato.',
      cta: 'Accedi',
      switchLead: 'Sei nuovo?',
      switchAction: 'Crea un account',
    },
    signup: {
      title: 'Crea il tuo account',
      description: 'Inizia a creare in un paio di minuti.',
      cta: 'Crea account',
      switchLead: 'Hai già un account?',
      switchAction: 'Accedi',
    },
    verify: {
      title: 'Controlla la posta in arrivo',
      description: 'Inserisci il codice che ti abbiamo inviato per completare l’accesso.',
      cta: 'Verifica e continua',
      switchLead: 'Il codice non arriva?',
      switchAction: 'Inviane un altro',
    },
  },
  codeSentTo: (email) => `Inserisci il codice che abbiamo inviato a ${email} per completare l’accesso.`,
  verificationCode: 'Codice di verifica',
  fullName: 'Nome completo',
  namePlaceholder: 'Giulia Rossi',
  email: 'Email',
  emailPlaceholder: 'tu@azienda.it',
  emailHint: 'La usiamo per contattarti e non la condividiamo mai.',
  password: 'Password',
  passwordPlaceholder: 'Inserisci la password',
  newPasswordPlaceholder: 'Almeno 8 caratteri',
  confirmPassword: 'Conferma password',
  confirmPasswordPlaceholder: 'Ripeti la password',
  rememberMe: 'Ricordami',
  forgotPassword: 'Password dimenticata?',
  terms: 'Creando un account accetti i nostri Termini di servizio e la nostra Informativa sulla privacy.',
  orContinueWith: 'oppure continua con',
};

const TRACK_LIST_MESSAGES: Translations['TRACK_LIST_MESSAGES'] = {
  title: 'Titolo',
  album: 'Album',
  dateAdded: 'Data di aggiunta',
  plays: 'Riproduzioni',
  duration: 'Durata',
  moveUp: 'Sposta su',
  moveDown: 'Sposta giù',
  reorder: 'Riordina',
  downloaded: 'Scaricato',
  unavailable: 'Non disponibile',
  tracks: 'Brani',
  episodes: 'Episodi',
  selected: (n) => plural('it', n, { one: '{n} selezionato', other: '{n} selezionati' }),
  clearSelection: 'Cancella selezione',
  played: 'Riprodotto',
  listened: 'Ascoltato',
  saveEpisode: 'Salva episodio',
  downloadEpisode: 'Scarica episodio',
  minutes: (m) => `${m} min`,
  hours: (h) => `${h} h`,
  hoursMinutes: (h, m) => `${h} h ${m} min`,
  remaining: (l) => `Mancano ${l}`,
};

const LYRICS_MESSAGES: Translations['LYRICS_MESSAGES'] = {
  lyrics: 'Testo',
  showLyrics: 'Mostra testo',
  backToCurrent: 'Torna alla riga corrente',
  empty: 'Il testo di questo brano non è disponibile',
};

const ACTIVITY_FEED_MESSAGES: Translations['ACTIVITY_FEED_MESSAGES'] = {
  kinds: { call: 'Chiamata', email: 'Email', meeting: 'Riunione', note: 'Nota', 'stage-change': 'Cambio di fase', task: 'Attività completata' },
  empty: 'Nessuna attività registrata',
  loggedBy: (name) => `Registrato da ${name}`,
  filterActivity: 'Filtra attività',
};

const PLACE_REVIEWS_MESSAGES: Translations['PLACE_REVIEWS_MESSAGES'] = {
  depositReturned: 'Deposito restituito',
  depositNotReturned: 'Deposito non restituito',
  recommend: 'Lo consiglierei',
  notRecommend: 'Non lo consiglierei',
  helpful: 'Utile',
  report: 'Segnala',
  promptTitle: 'Hai vissuto qui?',
  promptDescription: (building) =>
    `Aiuta i futuri inquilini di ${building}. Le recensioni sono anonime.`,
  writeReview: 'Scrivi una recensione',
  reviewCount: (n) => plural('it', n, { one: '{n} recensione', other: '{n} recensioni' }),
  depositRate: (percent) => `Deposito restituito nel ${percent}% delle locazioni`,
  recommendRate: (percent) => `Il ${percent}% consiglierebbe di vivere qui`,
};

const DELIVERY_SLOT_MESSAGES: Translations['DELIVERY_SLOT_MESSAGES'] = {
  tiers: { standard: 'Standard', express: 'Espresso' },
  soldOut: 'Esaurito',
  asap: 'Il prima possibile',
  field: 'Orario di consegna',
  day: 'Giorno',
  emptyTitle: 'Nessuna fascia disponibile',
  emptyDescription: 'Scegli un altro giorno o il prossimo corriere disponibile.',
};

const PLACE_LIST_MESSAGES: Translations['PLACE_LIST_MESSAGES'] = {
  visibility: { private: 'Privata', shared: 'Condivisa', public: 'Pubblica' },
  places: (n) => plural('it', n, { one: '{n} luogo', other: '{n} luoghi' }),
  sharedWith: (n) => plural('it', n, { one: 'Condivisa con {n} persona', other: 'Condivisa con {n} persone' }),
  labels: {
    moveEarlier: (position) => `Sposta in posizione ${position - 1}`,
    moveLater: (position) => `Sposta in posizione ${position + 1}`,
    remove: (name) => `Rimuovi ${name} dall'elenco`,
    moved: (name, position, total) => `${name} spostato in posizione ${position} di ${total}`,
    note: 'Nota',
  },
  savedPlaces: 'Luoghi salvati',
};

const HOME_SEARCH_MESSAGES: Translations['HOME_SEARCH_MESSAGES'] = {
  modes: { rent: 'Affitto', buy: 'Acquisto', stays: 'Case vacanza', swap: 'Scambio' },
  searchMode: 'Modalità di ricerca',
  location: 'Posizione',
  locationPlaceholder: 'Cerca città o zona',
  moveIn: 'Ingresso',
  datePlaceholder: 'Aggiungi data',
  budget: 'Budget',
  budgetPlaceholder: 'Aggiungi budget',
  price: 'Prezzo',
  pricePlaceholder: 'Qualsiasi prezzo',
  propertyType: 'Tipo di immobile',
  propertyTypePlaceholder: 'Qualsiasi tipo',
  dates: 'Date',
  homeSize: 'Dimensione della casa',
  homeSizePlaceholder: 'Qualsiasi dimensione',
  minimum: 'Minimo',
  maximum: 'Massimo',
  budgetPresets: 'Fasce di budget',
  monthlyBudget: 'Budget mensile',
  monthlyBudgetDescription: 'Affitto mensile, spese escluse',
  totalPriceDescription: 'Prezzo totale',
  upTo: (amount) => `Fino a ${amount}`,
  any: 'Qualsiasi',
  moveInLabels: {
    date: "Data d'ingresso",
    flexible: 'Flessibile',
    asap: 'Il prima possibile',
    contractLength: 'Durata del contratto',
  },
  contractLengths: { any: 'Qualsiasi', short: '1–6 mesi', medium: '6–12 mesi', long: 'Oltre 1 anno' },
  saveSearch: 'Salva ricerca',
  saved: 'Salvata',
  newCount: (n) => plural('it', n, { one: '{n} nuovo', other: '{n} nuovi' }),
  alertsOff: 'Avvisi disattivati',
  actionOn: (action, subject) => `${action}: ${subject}`,
};

const OFFERING_BADGE_MESSAGES: Translations['OFFERING_BADGE_MESSAGES'] = { offerings: { long_term_rent: 'In affitto', sale: 'In vendita', short_term_rent: 'Casa vacanze', exchange: 'Scambio' } };

const MAP_ATTRIBUTION_MESSAGES: Translations['MAP_ATTRIBUTION_MESSAGES'] = { scale: 'Scala', mapData: 'Dati della mappa' };

const SLIDER_MESSAGES: Translations['SLIDER_MESSAGES'] = { minimum: 'Valore minimo', maximum: 'Valore massimo', value: (n) => `Valore ${n}` };

const SELECT_MESSAGES: Translations['SELECT_MESSAGES'] = { selectOption: 'Seleziona un’opzione', scrollUp: 'Scorri verso l’alto', scrollDown: 'Scorri verso il basso' };

const ZOOMABLE_MEDIA_GALLERY_MESSAGES: Translations['ZOOMABLE_MEDIA_GALLERY_MESSAGES'] = {
  close: 'Chiudi il visualizzatore',
  previous: 'Elemento precedente',
  next: 'Elemento successivo',
  goTo: (i, n) => `Vai all'elemento ${i} di ${n}`,
  share: 'Condividi contenuto',
};

const NOTIFICATION_MESSAGES: Translations['NOTIFICATION_MESSAGES'] = { dismiss: 'Ignora notifica' };

const PHONE_INPUT_MESSAGES: Translations['PHONE_INPUT_MESSAGES'] = { phoneNumber: 'Numero di telefono', countryCode: 'Prefisso internazionale' };

const VENDOR_CARD_MESSAGES: Translations['VENDOR_CARD_MESSAGES'] = {
  facts: { deliveryTime: 'Tempo di consegna', deliveryFee: 'Consegna', distance: 'Distanza', minimumOrder: 'Ordine minimo' },
  availability: { paused: 'In pausa', closed: 'Chiuso' },
  new: 'Nuovo',
  rated: (value, reviews) =>
    `Valutazione ${value} su 5${vendorCard_has(reviews) ? `, ${vendorCard_counted('it', reviews, { one: '{n} recensione', other: '{n} recensioni' })}` : ''}`,
};

const CHAT_INDICATORS_MESSAGES: Translations['CHAT_INDICATORS_MESSAGES'] = {
  presence: { online: 'Online', idle: 'Assente', offline: 'Offline', busy: 'Occupato' },
  status: { sending: 'Invio in corso…', sent: 'Inviato', delivered: 'Consegnato', read: 'Letto', failed: 'Non inviato' },
  unread: 'Non letto',
  unreadCount: (n) => plural('it', n, { one: '{n} messaggio non letto', other: '{n} messaggi non letti' }),
};

const MEDIA_CONTROLS_MESSAGES: Translations['MEDIA_CONTROLS_MESSAGES'] = {
  play: 'Riproduci',
  pause: 'Pausa',
  playSubject: (s) => `Riproduci ${s}`,
  pauseSubject: (s) => `Metti in pausa ${s}`,
  saveToLibrary: 'Salva nella tua libreria',
  saveSubjectToLibrary: (s) => `Salva ${s} nella tua libreria`,
  explicit: 'Esplicito',
  seek: 'Posizione di riproduzione',
  seekValue: (a, b) => `${a} di ${b}`,
  mute: 'Disattiva audio',
  unmute: 'Riattiva audio',
  volume: 'Volume',
  nowPlaying: 'In riproduzione',
};

const INPUT_OTP_MESSAGES: Translations['INPUT_OTP_MESSAGES'] = {
  oneTimeCode: 'Codice monouso',
  digitOf: (i, n) => `Cifra ${i} di ${n}`,
  characterOf: (i, n) => `Carattere ${i} di ${n}`,
};

const PLACE_DETAILS_MESSAGES: Translations['PLACE_DETAILS_MESSAGES'] = {
  infoActions: { call: 'Chiama', open: 'Apri il sito web', directions: 'Indicazioni' },
  busy: {
    busier: 'Più affollato del solito',
    typical: 'Affollato come al solito',
    quieter: 'Meno affollato del solito',
  },
  transitModes: {
    bus: 'Fermata dell\'autobus',
    metro: 'Stazione della metropolitana',
    train: 'Stazione ferroviaria',
    tram: 'Fermata del tram',
    ferry: 'Terminal dei traghetti',
  },
  notAvailable: 'Non disponibile',
  amenities: 'Servizi',
  today: 'Oggi',
  closed: 'Chiuso',
  openingHours: 'Orari di apertura',
  day: 'Giorno',
  noDataForDay: 'Nessun dato per questo giorno',
  chartNoData: (day) => `${day}, nessun dato`,
  chartClosed: (day) => `${day}, chiuso tutto il giorno`,
  chartPeak: (day, hour) => `${day}, più affollato alle ${hour}`,
  chartNow: (hour) => `ora ${hour}`,
  live: 'in tempo reale',
  noDepartures: 'Nessuna partenza al momento',
  nearbyTransit: 'Mezzi pubblici nelle vicinanze',
  lines: 'Linee',
  line: (name) => `Linea ${name}`,
  towards: (headsign) => `per ${headsign}`,
};

const APP_SHELL_MESSAGES: Translations['APP_SHELL_MESSAGES'] = {
  openNavigation: 'Apri la navigazione',
  closeNavigation: 'Chiudi la navigazione',
  resizePanes: 'Ridimensiona i riquadri',
  notifications: 'Notifiche',
  proOffer: 'Offerta Pro',
};

const ROUTE_STOPS_MESSAGES: Translations['ROUTE_STOPS_MESSAGES'] = {
  routeStops: 'Tappe del percorso',
  origin: 'Partenza',
  destination: 'Destinazione',
  stop: (position) => `Tappa ${position}`,
  swap: 'Inverti partenza e destinazione',
  addStop: 'Aggiungi una tappa',
  removeStop: (title) => `Rimuovi ${title}`,
  state: { reached: 'Raggiunta', current: 'Tappa attuale', pending: 'Non raggiunta' },
};

const SEARCH_MESSAGES: Translations['SEARCH_MESSAGES'] = { clearQuery: 'Cancella la ricerca' };

const TAG_FIELD_MESSAGES: Translations['TAG_FIELD_MESSAGES'] = { remove: (t) => `Rimuovi ${t}`, full: (n) => `Massimo ${n}`, suggestions: 'Suggerimenti' };

const STAY_FILTERS_MESSAGES: Translations['STAY_FILTERS_MESSAGES'] = {
  propertyTypes: {
    apartment: 'Appartamento',
    house: 'Casa',
    room: 'Stanza',
    studio: 'Monolocale',
    duplex: 'Duplex / Attico',
    coliving: 'Coliving',
    hostel: 'Ostello',
    other: 'Terreno / Altro',
  },
  features: {
    elevator: 'Ascensore',
    parking: 'Parcheggio',
    terrace: 'Terrazza',
    garden: 'Giardino',
    pool: 'Piscina',
    furnished: 'Arredato',
    pets: 'Animali ammessi',
    airConditioning: 'Aria condizionata',
    heating: 'Riscaldamento',
    accessible: 'Accessibile',
    storage: 'Ripostiglio',
  },
  floors: { ground: 'Piano terra', middle: 'Piano intermedio', top: 'Ultimo piano', elevator: 'Con ascensore' },
  minimum: 'Minimo',
  maximum: 'Massimo',
  priceRange: 'Fascia di prezzo',
  area: 'Superficie',
  featuresGroup: 'Caratteristiche',
  floor: 'Piano',
  propertyType: 'Tipo di immobile',
  energyRating: 'Classe energetica',
  anyRating: 'Qualsiasi classe',
  ratingOnly: (r) => `Solo ${r}`,
  ratingAndBetter: (r) => `${r} o migliore`,
  filters: 'Filtri',
  filtersApplied: (label, n) => `${label}, ${plural('it', n, { one: '{n} applicato', other: '{n} applicati' })}`,
  clearAll: 'Cancella tutto',
  any: 'Qualsiasi',
  availableNow: 'Disponibile subito',
  availableNowDescription: 'Pronto da abitare oggi',
  availableFrom: 'Disponibile dal',
  anyDate: 'Qualsiasi data',
};

const SETTINGS_MODAL_MESSAGES: Translations['SETTINGS_MODAL_MESSAGES'] = {
  dialog: 'Impostazioni',
  nav: 'Sezioni delle impostazioni',
  close: 'Chiudi impostazioni',
  saved: 'Salvato',
  currentPlan: 'Piano attuale',
  actions: 'Azioni',
  storage: {
    storedIn: 'Archiviati in',
    fileCount: (n, shown) => plural('it', n, { one: `${shown} file`, other: `${shown} file` }),
    filterByType: 'Filtra per tipo di file',
    fileType: 'Tipo di file',
    orderBy: 'Ordina per',
    modified: 'Modificati',
    oldestFirst: 'Prima i meno recenti',
    searchFiles: 'Cerca file',
    selectAllOnPage: 'Seleziona tutti i file di questa pagina',
    fileName: 'Nome file',
    uploadedOn: 'Caricato il',
    fileSize: 'Dimensione file',
    sortBy: { name: 'Ordina per nome file', uploadedAt: 'Ordina per data di caricamento', size: 'Ordina per dimensione file' },
    selectFile: (name) => `Seleziona ${name}`,
    deleteFile: 'Elimina file',
    deleteNamed: (name) => `Elimina ${name}`,
    noMatches: 'Nessun file corrisponde ai filtri.',
    documents: 'Documenti',
    spreadsheets: 'Fogli di calcolo',
    videos: 'Video',
    downloadFile: 'Scarica file',
    rename: 'Rinomina',
    copyLink: 'Copia link',
  },
  tools: {
    showOutput: 'Mostra output',
    refreshTools: 'Aggiorna strumenti',
    removeServer: 'Rimuovi server',
    logout: 'Esci',
    logOutOf: (server) => `Esci da ${server}`,
    showTools: (server) => `Mostra gli strumenti di ${server}`,
    hideTools: (server) => `Nascondi gli strumenti di ${server}`,
    error: 'Errore',
    showOutputLink: 'Mostra output',
    showOutputOf: (server) => `Mostra l'output di ${server}`,
    newServer: 'Nuovo server MCP',
    newServerDescription: 'Aggiungi un server MCP personalizzato',
    projectScope: 'Ambito del progetto',
    authentication: 'Autenticazione',
    waitForAuth: "Attendi l'autenticazione MCP",
    waitForAuthDescription:
      "Attendi senza limiti di tempo l'autenticazione quando richiesta. Se disattivato, le richieste di autenticazione vengono saltate dopo 30 secondi.",
    waitForAuthSwitch: "Attendi l'autenticazione MCP",
    scopeServers: (scope) => `Server MCP di ${scope}`,
    scopeServersDescription: (scope) => `Server disponibili da ${scope}.`,
    teamServers: 'Server MCP del team',
    teamServersDescription: 'Configurati nella dashboard',
    manage: 'Gestisci',
    noTeamServers: 'Nessun server MCP del team',
    noTeamServersBody: 'Configura i server MCP nella dashboard per renderli disponibili sul desktop e nel cloud.',
    configureTeam: 'Configura i server MCP del team',
    pluginServers: 'Server MCP dei plugin',
  },
};

const EVICTION_MESSAGES: Translations['EVICTION_MESSAGES'] = {
  status: {
    scheduled: 'Programmato',
    postponed: 'Rinviato',
    suspended: 'Sospeso',
    executed: 'Eseguito',
    cancelled: 'Annullato',
  },
  attend: 'Ci sarò',
  share: 'Condividi',
  contactSupport: 'Contatta il gruppo di sostegno',
  verified: 'Verificato dalla comunità',
  caseHistory: 'Cronologia del caso',
  source: (source) => `Fonte: ${source}`,
};

const BOOKING_MESSAGES: Translations['BOOKING_MESSAGES'] = {
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  guests: 'Ospiti',
  addDate: 'Aggiungi data',
  reserve: 'Prenota',
  checkAvailability: 'Verifica disponibilità',
  notChargedYet: 'Non ti verrà ancora addebitato nulla',
  total: 'Totale',
  tripStatus: { confirmed: 'Confermato', pending: 'In attesa', cancelled: 'Cancellato', completed: 'Completato' },
  priceName: booking_priceName((p, u) => `${p} a ${u}`, (s, o) => `${s}, invece di ${o}`),
};

const AGENT_LIMITS_CARD_MESSAGES: Translations['AGENT_LIMITS_CARD_MESSAGES'] = { contextWindow: 'Finestra di contesto', freeSpace: 'Spazio libero', planUsageLimits: 'Limiti di utilizzo del piano', managePlan: 'Gestisci piano' };

const SWIPE_ROW_MESSAGES: Translations['SWIPE_ROW_MESSAGES'] = {
  closeActions: 'Chiudi azioni',
};

const PATIENT_INFO_CARD_MESSAGES: Translations['PATIENT_INFO_CARD_MESSAGES'] = { addPhoto: 'Aggiungi foto profilo' };

const THEME_TOGGLE_MESSAGES: Translations['THEME_TOGGLE_MESSAGES'] = { theme: 'Tema', darkMode: 'Modalità scura', lightMode: 'Modalità chiara', useDarkMode: 'Usa la modalità scura', useLightMode: 'Usa la modalità chiara' };

const EARNINGS_MESSAGES: Translations['EARNINGS_MESSAGES'] = {
  earned: 'Guadagnato',
  period: 'Periodo dei guadagni',
  breakdown: 'Da dove arriva',
  payout: 'Prossimo pagamento',
  payoutState: { scheduled: 'Programmato', processing: 'In arrivo', paid: 'Pagato', held: 'Sospeso', failed: 'Non riuscito' },
  chart: (label) => `Guadagni ${label}, per periodo`,
  empty: 'Ancora nessun guadagno',
  earnings: 'Guadagni',
};

const PROOF_OF_DELIVERY_MESSAGES: Translations['PROOF_OF_DELIVERY_MESSAGES'] = {
  labels: {
    signature: 'Firma',
    signaturePad: 'Firma',
    signatureHint: 'Firma con il dito',
    signed: 'Firmato',
    clear: 'Cancella la firma',
    typeName: 'Oppure scrivi il tuo nome',
    typeNamePlaceholder: 'Nome e cognome',
    photo: 'Foto',
    photoHint: 'Dove l’hai lasciato, o il pacco con il destinatario.',
    code: 'Codice di consegna',
    codeHint: 'Chiedi al destinatario di leggere il codice nella sua app.',
    recipient: 'Chi l’ha ricevuto',
    recipientPlaceholder: 'Nome',
    note: 'Nota',
    notePlaceholder: 'Qualsiasi cosa da annotare',
    submit: 'Conferma la consegna',
    required: 'Obbligatorio',
    missing: 'Serve prima di poter confermare.',
    missingSummary: (n) => plural('it', n, { one: 'Manca ancora una cosa', other: 'Mancano ancora {n} cose' }),
  },
  proofOfDelivery: 'Prova di consegna',
};

const FILE_UPLOAD_MESSAGES: Translations['FILE_UPLOAD_MESSAGES'] = {
  promptWeb: 'Trascina qui per caricare oppure',
  promptNative: 'Tocca per',
  selectWeb: 'seleziona',
  selectNative: 'selezionare un file',
  uploading: (size) => `Caricamento di ${size}...`,
  uploaded: 'Caricamento completato!',
  unsupported: (extensions) => `Sono supportati solo file ${extensions}`,
  tooLarge: (max) => `Il file supera ${max}`,
  max: (size) => `(max ${size})`,
  uploadFile: 'Carica un file',
};

const POPOVER_MESSAGES: Translations['POPOVER_MESSAGES'] = {
  popover: 'Finestra popup',
};

const QUEUE_PANEL_MESSAGES: Translations['QUEUE_PANEL_MESSAGES'] = {
  queueTab: 'Coda',
  recentTab: 'Ascoltati di recente',
  close: 'Chiudi la coda',
  nextInQueue: 'Prossimi in coda',
  nextFrom: (c) => `Prossimi da: ${c}`,
  nextUp: 'Prossimi brani',
  clearQueue: 'Svuota la coda',
  reorder: (t) => `Riordina ${t}`,
  reorderHint: 'Trascina o usa i tasti freccia',
  moveUp: 'Sposta su',
  moveDown: 'Sposta giù',
  remove: 'Rimuovi dalla coda',
  moved: (t, p, n) => `${t} spostato in posizione ${p} di ${n}`,
  emptyQueue: 'La tua coda è vuota',
  emptyQueueHint: 'Aggiungi brani ed episodi per ascoltarli subito dopo.',
  emptyRecent: 'Non hai ancora ascoltato nulla',
};

const HOVER_CARD_MESSAGES: Translations['HOVER_CARD_MESSAGES'] = {
  hoverCard: 'Scheda di anteprima',
};

const NOTE_EDITOR_MESSAGES: Translations['NOTE_EDITOR_MESSAGES'] = {
  header: {
    saved: 'Salvato',
    saving: 'Salvataggio…',
    offline: 'Offline — modifiche conservate',
    error: 'Non salvato',
    words: (n) => plural('it', n, { one: '{n} parola', other: '{n} parole' }),
    title: 'Titolo',
  },
  untitled: 'Senza titolo',
  note: 'Nota',
  toolbar: { more: 'Altra formattazione', moreMenu: 'Altra formattazione' },
};

const MEDIA_SHELF_MESSAGES: Translations['MEDIA_SHELF_MESSAGES'] = { filters: 'Filtri', showAll: 'Mostra tutto' };

const CATEGORY_BAR_MESSAGES: Translations['CATEGORY_BAR_MESSAGES'] = { previous: 'Categorie precedenti', next: 'Categorie successive' };

const CARRIER_QUOTE_MESSAGES: Translations['CARRIER_QUOTE_MESSAGES'] = {
  labels: {
    accept: 'Accetta',
    message: 'Messaggio',
    decline: 'Rifiuta',
    pickup: 'Ritiro',
    eta: 'Arrivo',
    vehicle: 'Veicolo',
    jobs: (jobs) => `${jobs} lavori`,
    verified: 'Corriere verificato',
    marks: { cheapest: 'Il più economico', fastest: 'Il più veloce' },
    showPrice: 'Mostra i dettagli del prezzo',
    hidePrice: 'Nascondi i dettagli del prezzo',
    priceDetails: 'Dettagli del prezzo di',
    sort: 'Ordina le offerte',
    sortOptions: { price: 'Più economiche', eta: 'Più veloci', rating: 'Meglio valutate' },
    count: (n) => plural('it', n, { one: '{n} offerta', other: '{n} offerte' }),
    loading: 'Caricamento delle offerte',
  },
  emptyTitle: 'Ancora nessuna offerta',
  emptyDescription: 'I corrieri stanno guardando la tua spedizione. Le prime offerte di solito arrivano in pochi minuti.',
  list: 'Offerte',
  priceDetailsFor: (name) => `Dettagli del prezzo di ${name}`,
};

const TEXT_FIELD_MESSAGES: Translations['TEXT_FIELD_MESSAGES'] = { showPassword: 'Mostra la password', hidePassword: 'Nascondi la password', required: 'obbligatorio' };

const CHAT_SCREEN_MESSAGES: Translations['CHAT_SCREEN_MESSAGES'] = {
  call: 'Chiama',
  videoCall: 'Videochiamata',
  searchInConversation: 'Cerca nella conversazione',
  connecting: 'Connessione…',
  verified: 'Verificato',
  bot: 'Bot',
  channel: 'Canale',
  clearSelection: 'Cancella selezione',
  forward: 'Inoltra',
  pin: 'Fissa',
  selectedCount: (n) => plural('it', n, { one: '{n} selezionato', other: '{n} selezionati' }),
  pinnedList: 'Mostra messaggi fissati',
  pinnedClose: 'Nascondi la barra dei fissati',
  pinnedUnpin: 'Rimuovi questo messaggio dai fissati',
  pinnedMessage: 'Messaggio fissato',
  pinnedMessageNumber: (n) => `Messaggio fissato n. ${n}`,
  scrollToBottom: 'Vai agli ultimi messaggi',
  jumpToMention: 'Vai alla menzione',
  emptyTitle: 'Ancora nessun messaggio',
  info: 'Informazioni',
  members: 'Membri',
  addMember: 'Aggiungi membri',
  memberSearch: 'Cerca membri',
  noMembers: 'Nessun membro trovato',
  owner: 'Proprietario',
  admin: 'Amministratore',
  resizeList: "Ridimensiona l'elenco delle conversazioni",
};

const CONTEXT_MENU_MESSAGES: Translations['CONTEXT_MENU_MESSAGES'] = {
  contextMenu: 'Menu contestuale',
};

const SORTABLE_MEDIA_MESSAGES: Translations['SORTABLE_MEDIA_MESSAGES'] = {
  photo: (p, t) => `Foto ${p} di ${t}`,
  cover: 'Copertina',
  moveEarlier: (p) => `Sposta la foto ${p} prima`,
  moveLater: (p) => `Sposta la foto ${p} dopo`,
  remove: (p) => `Rimuovi la foto ${p}`,
  retry: (p) => `Riprova a caricare la foto ${p}`,
  uploading: (p) => `Caricamento della foto ${p}`,
  failed: 'Caricamento non riuscito',
  add: 'Aggiungi foto',
  moved: (p, t) => `Spostata in posizione ${p} di ${t}`,
  photos: 'Foto',
};

const CONNECTION_DOTS_MESSAGES: Translations['CONNECTION_DOTS_MESSAGES'] = {
  connecting: 'Connessione in corso',
};

const CHAT_PEOPLE_MESSAGES: Translations['CHAT_PEOPLE_MESSAGES'] = {
  newGroup: {
    photo: 'Scegli una foto del gruppo',
    name: 'Nome del gruppo',
    namePlaceholder: 'Dai un nome a questo gruppo',
    description: 'Descrizione',
    descriptionPlaceholder: 'A cosa serve questo gruppo?',
    members: (n) => plural('it', n, { one: '{n} membro', other: '{n} membri' }),
    addMembers: 'Aggiungi membri',
    remove: (name) => `Rimuovi ${name}`,
  },
  member: {
    owner: 'Proprietario',
    admin: 'Amministratore',
    promote: 'Nomina amministratore',
    restrict: 'Limita',
    remove: 'Rimuovi dal gruppo',
    actions: (name) => `Azioni per ${name}`,
  },
  story: {
    close: 'Chiudi storia',
    previous: 'Storia precedente',
    next: 'Storia successiva',
    mute: 'Disattiva audio della storia',
    unmute: 'Riattiva audio della storia',
    more: 'Opzioni della storia',
    replyPlaceholder: 'Rispondi…',
    send: 'Invia risposta',
    progress: (index, count) => `Storia ${index + 1} di ${count}`,
    react: (emoji) => `Reagisci con ${emoji}`,
  },
  searchMembers: 'Cerca membri',
  share: 'Condividi',
  postOptions: 'Opzioni del post',
  pinned: 'Fissato',
  views: (c) => plural('it', c, { one: `${c} visualizzazione`, other: `${c} visualizzazioni` }),
  forwards: (c) => plural('it', c, { one: `${c} inoltro`, other: `${c} inoltri` }),
  jumpTo: (letter) => `Vai a ${letter}`,
  add: 'Aggiungi',
  added: 'Aggiunto',
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
