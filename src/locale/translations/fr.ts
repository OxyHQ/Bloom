// Bloom's fr strings for every family. Loaded on demand by
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
  'top-left': 'en haut à gauche',
  'top-right': 'en haut à droite',
  'bottom-left': 'en bas à gauche',
  'bottom-right': 'en bas à droite',
};

const MESSAGE_MEDIA_MESSAGES__items = (n: number) =>
  plural('fr', n, { one: '{n} élément', other: '{n} éléments' });

const AGENT_CREATOR_MESSAGES: Translations['AGENT_CREATOR_MESSAGES'] = {
  reaction: 'Réagir',
  working: 'Travailler',
  avatarStyle: 'Style de l’avatar',
  proceduralAvatar: 'Avatar actuel',
  betaPreset: 'Personnage prédéfini (bêta)',
  betaEyes: 'Style des yeux',
  eyewear: 'Lunettes',
  accessory: 'Accessoire',
  characterOption: (_category, _id, title) => String(title),
  editor: 'Éditeur de l’agent',
  newBot: 'Nouveau bot',
  closeEditor: 'Fermer l’éditeur de l’agent',
  details: 'Apparence et détails de l’agent',
  color: 'Couleur de l’avatar',
  customColor: 'Couleur personnalisée de l’avatar',
  name: 'Nom',
  label: 'Libellé',
  description: 'Description',
  nameInput: 'Nom de l’agent',
  labelInput: 'Libellé de l’agent',
  descriptionInput: 'Description de l’agent',
  labelPlaceholder: 'Responsable, marketing, peintre',
  descriptionPlaceholder: 'Détails de l’agent',
  language: 'Langue',
  languageInput: 'Langue de l’agent',
  notifications: 'Notifications',
  notificationsDescription: 'Afficher un avis lorsqu’une réponse est prête.',
  notifyFinished: 'Notifier lorsque cet agent a terminé',
  voice: 'Voix',
  voiceInput: 'Voix de l’agent',
  previewVoice: 'Écouter la voix',
  savedVoice: 'Voix enregistrée',
  systemVoice: 'Voix du système',
  off: 'Désactivée',
  playbackSpeed: 'Vitesse de lecture',
  emotion: 'Émotion de l’agent',
  shape: 'Forme de l’avatar',
  hexColor: 'Couleur hexadécimale',
  hue: 'Teinte',
  saturationBrightness: 'Saturation et luminosité',
  increaseBrightness: 'Augmenter la luminosité',
  decreaseBrightness: 'Réduire la luminosité',
  increaseHue: 'Augmenter la teinte',
  decreaseHue: 'Réduire la teinte',
  nextShape: 'Forme suivante',
  previousShape: 'Forme précédente',
  newAgent: 'Nouvel agent',
  emotions: {
    neutral: 'Neutre',
    happy: 'Heureux',
    angry: 'En colère',
    thinking: 'Pensif',
    shook: 'Surpris',
    curious: 'Curieux',
    wink: 'Clin d’œil',
    sleepy: 'Somnolent',
    sad: 'Triste',
    worried: 'Inquiet',
    skeptical: 'Sceptique',
    focused: 'Concentré',
    excited: 'Enthousiaste',
    calm: 'Calme',
    shy: 'Timide',
    confused: 'Confus',
  },
  shapes: {
    slender: 'Élancée',
    pocket: 'Poche',
    petal: 'Pétale',
    flower: 'Fleur',
    star: 'Étoile',
    heart: 'Cœur',
    cloud: 'Nuage',
    diamond: 'Diamant',
    shield: 'Bouclier',
  },
  colors: {
    Blue: 'Bleu',
    Teal: 'Bleu sarcelle',
    Violet: 'Violet',
    Pink: 'Rose',
    Red: 'Rouge',
    Orange: 'Orange',
    Cyan: 'Cyan',
    Lime: 'Citron vert',
    Green: 'Vert',
  },
  languages: {
    auto: 'Détection automatique',
    en: 'Anglais',
    tr: 'Turc',
    es: 'Espagnol',
    fr: 'Français',
    de: 'Allemand',
    ja: 'Japonais',
    pt: 'Portugais',
  },
  avatarColorLabel: (name) => 'Avatar {name}'.replace('{name}', name),
  shapeLabel: (name) => 'Forme {name}'.replace('{name}', name),
  silhouetteLabel: (name) => 'Silhouette {name}'.replace('{name}', name),
  livePreview: (name) => '{name}, aperçu de l’avatar'.replace('{name}', name),
  saturationBrightnessValue: (s, v) =>
    'saturation {s}%, luminosité {v}%'.replace('{s}', String(s)).replace('{v}', String(v)),
  playbackSpeedLabel: (speed) =>
    'Vitesse de lecture {speed} fois'.replace('{speed}', String(speed)),
};

const COMMON_MESSAGES: Translations['COMMON_MESSAGES'] = {
  close: 'Fermer',
  dismiss: 'Ignorer',
  back: 'Retour',
  goBack: 'Revenir en arrière',
  loading: 'Chargement',
  more: 'Plus',
  moreOptions: "Plus d'options",
  moreActions: "Plus d'actions",
  progress: 'Progression',
  stepOf: (step, total) => `Étape ${step} sur ${total}`,
  labelFor: (label, subject) => `${label} pour ${subject}`,
  tapToClose: 'Touchez pour fermer',
  cancel: 'Annuler',
  done: 'Terminé',
  save: 'Enregistrer',
  delete: 'Supprimer',
  edit: 'Modifier',
  remove: 'Retirer',
  retry: 'Réessayer',
  search: 'Rechercher',
  showMore: 'Afficher plus',
  showLess: 'Afficher moins',
  next: 'Suivant',
  previous: 'Précédent',
  open: 'Ouvrir',
  menu: 'Menu',
  copy: 'Copier',
  copied: 'Copié',
  send: 'Envoyer',
  clear: 'Effacer',
  seeAll: 'Tout afficher',
  resizePanels: 'Redimensionner les panneaux',
};

const SURFACES_MESSAGES: Translations['SURFACES_MESSAGES'] = {
  confirm: 'Confirmer',
  ok: 'D’accord',
};

const CONTACT_CARD_MESSAGES: Translations['CONTACT_CARD_MESSAGES'] = {
  channels: {
    email: { action: 'E-mail', name: (s) => `Envoyer un e-mail à ${s}` },
    phone: { action: 'Appeler', name: (s) => `Appeler ${s}` },
    chat: { action: 'Message', name: (s) => `Envoyer un message à ${s}` },
    meeting: { action: 'Réunion', name: (s) => `Planifier une réunion avec ${s}` },
    video: { action: 'Vidéo', name: (s) => `Lancer un appel vidéo avec ${s}` },
    website: { action: 'Site web', name: (s) => `Ouvrir le site web de ${s}` },
  },
  labelsFor: (name) => `Libellés de ${name}`,
  owner: 'Responsable',
};

const CHAT_LIST_MESSAGES: Translations['CHAT_LIST_MESSAGES'] = {
  item: {
    draft: 'Brouillon :',
    pinned: 'Épinglé',
    muted: 'Mis en sourdine',
    verified: 'Vérifié',
    channel: 'Chaîne',
    bot: 'Bot',
    group: 'Groupe',
  },
  search: {
    chat: 'Discussions',
    message: 'Messages',
    contact: 'Contacts',
    empty: 'Aucun résultat',
  },
  list: 'Discussions',
  emptyTitle: 'Aucune conversation pour le moment',
  emptyDescription: 'Commencez une discussion, elle apparaîtra ici.',
  searchResults: 'Résultats de recherche',
  searchChats: 'Rechercher des discussions',
  clearSearch: 'Effacer la recherche',
  newChat: 'Nouvelle discussion',
  archived: 'Archivées',
  archivedName: (label, n) =>
    `${label}, ${plural('fr', n, { one: '{n} discussion', other: '{n} discussions' })}`,
  folderName: (label, n) =>
    `${label}, ${plural('fr', n, { one: '{n} non lu', other: '{n} non lus' })}`,
  stories: 'Stories',
  ownStory: 'Votre story',
  addStory: 'Ajouter à votre story',
  storyOf: (name) => `Story de ${name}`,
};

const NOTE_CARD_MESSAGES: Translations['NOTE_CARD_MESSAGES'] = {
  pinned: 'Épinglée',
  locked: 'Protégée',
  attachments: (n) => plural('fr', n, { one: '{n} pièce jointe', other: '{n} pièces jointes' }),
  select: 'Sélectionner la note',
  checklistDone: 'Terminé',
  checklistTodo: 'À faire',
  more: (n) => `${n} de plus`,
};

const DIALOG_MESSAGES: Translations['DIALOG_MESSAGES'] = {
  view: 'Vue',
  dismissDialog: 'Fermer la boîte de dialogue',
  dismissNamed: (label) => `Fermer ${label}`,
};

const ALERT_DIALOG_MESSAGES: Translations['ALERT_DIALOG_MESSAGES'] = {
  confirm: 'Confirmer',
};

const SIDEBAR_MESSAGES: Translations['SIDEBAR_MESSAGES'] = {
  sidebar: 'Barre latérale',
  collapse: 'Réduire la barre latérale',
  expand: 'Développer la barre latérale',
  close: 'Fermer la barre latérale',
  quickSearch: 'Recherche rapide',
  searchPlaceholder: 'Rechercher dans la navigation…',
  searchPlaceholderCompact: 'Rechercher...',
  filter: 'Filtrer la navigation',
  clearSearch: 'Effacer la recherche de navigation',
  noResults: 'Aucun résultat',
  mode: 'Mode',
  upgrade: 'Passer à la version supérieure',
  usersWithAccess: 'Utilisateurs ayant accès',
  addUser: 'Ajouter un utilisateur',
  manage: 'Gérer',
  accountMenu: 'Menu du compte',
  teamMenu: (team) => `Menu de ${team}`,
};

const FILE_SIZE_UNITS: Translations['FILE_SIZE_UNITS'] = {
  byte: 'o',
  kilobyte: 'Ko',
  megabyte: 'Mo',
  gigabyte: 'Go',
};

const CARD_FORM_MESSAGES: Translations['CARD_FORM_MESSAGES'] = {
  labels: {
    number: 'Numéro de carte',
    expiry: "Date d'expiration",
    securityCode: 'Code de sécurité',
    name: 'Nom sur la carte',
    postcode: 'Code postal',
    country: 'Pays',
  },
  selectCountry: 'Choisissez un pays',
};

const CHAT_COMPOSER_MESSAGES: Translations['CHAT_COMPOSER_MESSAGES'] = {
  attach: 'Joindre',
  emoji: 'Émoji',
  camera: 'Appareil photo',
  mic: 'Enregistrer un message vocal',
  message: 'Message',
  enterHint: 'Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne',
  modEnterHint: '⌘ + Entrée pour envoyer · Entrée pour une nouvelle ligne',
  cancelRecording: "Annuler l'enregistrement",
  sendVoice: 'Envoyer le message vocal',
  deleteRecording: "Supprimer l'enregistrement",
  playRecording: "Lire l'enregistrement",
  pauseRecording: "Mettre l'enregistrement en pause",
  lockRecording: "Verrouiller l'enregistrement",
  slideToCancel: 'Glisser pour annuler',
  recording: 'Enregistrement',
  searchEmoji: 'Rechercher un émoji',
  noEmoji: 'Aucun émoji trouvé',
  frequentlyUsed: 'Fréquemment utilisés',
  skinTone: 'Teint',
  emojiPicker: "Sélecteur d'émojis",
  moreReactions: 'Plus de réactions',
  quickReactions: 'Réactions rapides',
  messageActions: 'Actions sur le message',
  attachments: 'Pièces jointes',
  removeAttachment: (name) => `Retirer ${name}`,
  suggestions: { mention: 'Personnes', command: 'Commandes', emoji: 'Émoji' },
  suggestionVerified: 'Vérifié',
  searchingSuggestions: 'Recherche…',
  noSuggestions: {
    mention: 'Aucune personne trouvée',
    command: 'Aucune commande trouvée',
    emoji: 'Aucun émoji trouvé',
  },
  attachmentItems: {
    gallery: 'Galerie',
    camera: 'Appareil photo',
    file: 'Fichier',
    location: 'Position',
    contact: 'Contact',
    poll: 'Sondage',
    music: 'Musique',
  },
};

const MAIL_COMPOSE_MESSAGES: Translations['MAIL_COMPOSE_MESSAGES'] = {
  to: 'À',
  cc: 'Cc',
  bcc: 'Cci',
  subject: 'Objet',
  showCopies: 'Cc Cci',
  hideCopies: 'Masquer Cc et Cci',
  removeRecipient: (name) => `Retirer ${name}`,
  suggestions: 'Contacts',
  send: COMMON_MESSAGES.send,
  sending: 'Envoi',
  attach: 'Joindre un fichier',
  discard: 'Supprimer le brouillon',
  minimize: 'Réduire',
  expand: 'Agrandir',
  close: COMMON_MESSAGES.close,
  title: 'Nouveau message',
};

const MEDIA_PLAYER_MESSAGES: Translations['MEDIA_PLAYER_MESSAGES'] = {
  lyrics: 'Paroles',
  queue: "File d'attente",
  devices: 'Se connecter à un appareil',
  fullscreen: 'Plein écran',
  openPlayer: 'Ouvrir le lecteur',
  currentDevice: 'Appareil actuel',
  listeningOn: 'Écoute sur',
  listeningOnDevice: (d) => `Écoute sur ${d}`,
  selectDevice: 'Sélectionner un appareil',
  noDevices: 'Aucun autre appareil trouvé',
  deviceHelp: 'Vous ne voyez pas votre appareil ?',
  playbackSpeed: 'Vitesse de lecture',
  sleepTimer: 'Minuteur de veille',
  sleepOff: 'Désactivé',
  endOfEpisode: "Fin de l'épisode",
  oneHour: '1 heure',
  minutes: (n) => plural('fr', n, { one: '{n} minute', other: '{n} minutes' }),
  stopsIn: (r) => `S'arrête dans ${r}`,
  shuffle: 'Lecture aléatoire',
  repeat: 'Répéter',
  repeatOne: 'Répéter le titre',
  skipBack: (n) =>
    plural('fr', n, { one: 'Reculer de {n} seconde', other: 'Reculer de {n} secondes' }),
  skipForward: (n) =>
    plural('fr', n, { one: 'Avancer de {n} seconde', other: 'Avancer de {n} secondes' }),
  closePlayer: 'Fermer le lecteur',
  share: 'Partager',
  showLyrics: 'Afficher les paroles',
};

const ADDRESS_MESSAGES: Translations['ADDRESS_MESSAGES'] = {
  emptyTitle: 'Rien pour le moment',
  addresses: 'Adresses',
};

const CREATOR_STUDIO_MESSAGES: Translations['CREATOR_STUDIO_MESSAGES'] = {
  releaseTypes: { single: 'Single', ep: 'EP', album: 'Album' },
  releaseStatuses: {
    draft: 'Brouillon',
    'in-review': "En cours d'examen",
    scheduled: 'Programmé',
    live: 'En ligne',
    rejected: 'Refusé',
    takedown: 'Retiré',
  },
  creditRoles: {
    songwriter: 'Auteur-compositeur',
    producer: 'Producteur',
    composer: 'Compositeur',
    performer: 'Interprète',
    lyricist: 'Parolier',
    'mixing-engineer': 'Ingénieur de mixage',
    'mastering-engineer': 'Ingénieur de mastering',
  },
  periods: { '7d': '7 jours', '28d': '28 jours', '12m': '12 mois', all: 'Depuis toujours' },
  artworkNotSquare: (w, h) => `La pochette doit être carrée : cette image mesure ${w}×${h} px.`,
  artworkTooSmall: (w, h, min) =>
    `La pochette est trop petite (${w}×${h} px). Importez au moins ${min}×${min} px.`,
  audience: { title: 'Public', period: 'Période' },
  breakdown: {
    locations: 'Principaux lieux',
    cities: 'Villes',
    countries: 'Pays',
    age: 'Âge',
    gender: 'Genre',
    sources: "Sources d'écoute",
    metric: 'Auditeurs',
  },
  streams: {
    metrics: 'Mesure du graphique',
    summary: (metric, releases) =>
      releases ? `${metric} au fil du temps ; sorties : ${releases}` : `${metric} au fil du temps`,
  },
  topTracks: {
    title: 'Meilleurs titres',
    rank: '#',
    rankName: 'Rang',
    track: 'Titre',
    streams: 'Écoutes',
    listeners: 'Auditeurs',
    saves: 'Enregistrements',
    trend: 'Tendance',
    trends: { up: 'En hausse', down: 'En baisse', flat: 'Stable', new: 'Nouvelle entrée' },
    newBadge: 'Nouveau',
    empty: 'Aucune écoute sur cette période pour le moment.',
  },
  tracks: (n) => plural('fr', n, { one: '{n} titre', other: '{n} titres' }),
  timeline: {
    states: {
      complete: 'terminé',
      current: 'en cours',
      upcoming: 'pas commencé',
      error: 'action requise',
    },
    label: 'Progression de la sortie',
  },
  upload: {
    queued: 'En attente',
    processing: 'Transcodage…',
    ready: 'Prêt',
    failed: "Échec de l'importation",
    remove: (name) => `Retirer ${name}`,
    progress: (name) => `Importation de ${name}`,
  },
  artwork: {
    title: 'Pochette',
    requirements: '3000×3000 px, JPG ou PNG',
    replace: 'Remplacer',
    remove: 'Retirer la pochette',
    preview: 'Pochette de la sortie',
    upload: 'Importer une pochette',
  },
  credits: {
    title: 'Crédits',
    role: 'Rôle',
    name: 'Nom',
    add: 'Ajouter un crédit',
    remove: (index, name) =>
      name ? `Retirer le crédit ${index + 1}, ${name}` : `Retirer le crédit ${index + 1}`,
    empty: 'Créditez les auteurs, producteurs et interprètes de ce titre.',
    field: (field, n) => `${field}, crédit ${n}`,
  },
  artists: {
    add: 'Ajouter',
    addTo: (label) => `Ajouter : ${label}`,
    remove: (name) => `Retirer ${name}`,
  },
  isrc: { hint: 'Format : CC-XXX-YY-NNNNN', invalid: "Ce n'est pas un ISRC valide" },
  metadata: {
    title: 'Titre du morceau',
    version: 'Version',
    versionPlaceholder: 'Remix, live, acoustique…',
    explicit: 'Paroles explicites',
    explicitDescription:
      'Activez cette option si le morceau contient un langage cru ou des thèmes explicites.',
    genre: 'Genre',
    genrePlaceholder: 'Choisir un genre',
    primaryArtists: 'Artistes principaux',
    featuredArtists: 'Artistes invités',
    artistPlaceholder: "Ajouter le nom d'un artiste",
    language: 'Langue des paroles',
    languagePlaceholder: 'Choisir une langue',
    lyrics: 'Paroles',
    lyricsPlaceholder: 'Collez les paroles, une ligne par vers chanté',
  },
  payout: {
    estimated: 'Revenus estimés ce mois-ci',
    lastPayout: 'Dernier versement',
    nextPayout: 'Prochain versement',
    statements: 'Voir les relevés',
    chart: 'Revenus mensuels',
  },
  pitch: {
    title: 'Proposer aux éditeurs',
    description: "Présentez votre prochaine sortie à l'équipe éditoriale avant sa parution.",
    release: 'Sortie',
    releasePlaceholder: 'Choisir une sortie à venir',
    moods: 'Ambiance',
    genres: 'Genre',
    pitch: 'Votre présentation',
    pitchPlaceholder:
      "Qu'est-ce qui distingue cette sortie ? À qui s'adresse-t-elle, et quelle est son histoire ?",
    submit: 'Envoyer la proposition',
    tagLimit: (max) => `${max} au maximum`,
    statuses: {
      submitted: 'Proposition envoyée',
      accepted: 'Retenue pour examen',
      declined: 'Non retenue cette fois',
    },
    statusDescriptions: {
      submitted:
        'Les éditeurs lisent chaque proposition. Vous aurez une réponse avant la date de sortie.',
      accepted: 'Votre sortie est envisagée pour des playlists éditoriales.',
      declined:
        "Cette sortie n'a pas été retenue. Vous pourrez proposer la suivante dès qu'elle sera programmée.",
    },
    edit: 'Modifier la proposition',
  },
};

const PROPERTY_INSIGHTS_MESSAGES: Translations['PROPERTY_INSIGHTS_MESSAGES'] = {
  energy: 'Énergie',
  pending: 'En attente',
  energyRatingClass: (r) => `Classe énergétique ${r}`,
  energyRatingStatus: (s) => `Classe énergétique ${String(s).toLowerCase()}`,
  energyRating: 'Classe énergétique',
  certificateInProgress: 'Diagnostic en cours',
  consumption: 'Consommation',
  emissions: 'Émissions',
  moreEfficient: 'Plus performant',
  lessEfficient: 'Moins performant',
  walkTime: (t) => `${t} à pied`,
  scoreOutOf: (d, m) => `${d} sur ${m}`,
  pricePerSquareMetre: 'Prix au mètre carré',
  rentHistory: 'Historique des loyers',
  rentHistoryEmpty: 'Pas encore d’historique pour ce logement',
  confidence: { low: 'Confiance faible', medium: 'Confiance moyenne', high: 'Confiance élevée' },
  aboveEstimate: (p) => `${p} au-dessus de l’estimation`,
  belowEstimate: (p) => `${p} en dessous de l’estimation`,
  fairPrice: 'Prix juste',
  estimatedPrice: 'Prix estimé',
  asking: 'Prix demandé',
  noVerdict: 'Pas assez de données pour se prononcer',
  whyThisEstimate: 'Pourquoi cette estimation',
  comparables: (n) =>
    plural('fr', n, {
      one: 'Basé sur {n} bien comparable',
      other: 'Basé sur {n} biens comparables',
    }),
  currentPrice: 'Prix actuel',
  now: 'Maintenant',
  noPriceHistory: 'Pas encore d’historique des prix',
  priceHistoryPeriod: 'Période de l’historique des prix',
  priceHistory: 'Historique des prix',
  priceHistoryTrend: (head, a, aw, b, bw) => `${head} : de ${a} (${aw}) à ${b} (${bw}).`,
};

const MAP_MARKER_MESSAGES: Translations['MAP_MARKER_MESSAGES'] = {
  searchAsMapMoves: 'Rechercher en déplaçant la carte',
  searchThisArea: 'Rechercher dans cette zone',
  stays: (n) => mapMarker_countOf('fr', n, { one: '{n} logement', other: '{n} logements' }),
};

const LISTING_ACTIONS_MESSAGES: Translations['LISTING_ACTIONS_MESSAGES'] = {
  month: 'mois',
  rentalStatus: { available: 'Disponible', reserved: 'Réservé', rented: 'Loué' },
  rentalStatusMessage: {
    reserved:
      'Un autre candidat est en train de finaliser un bail. Les nouvelles visites sont suspendues.',
    rented: 'Ce logement a été loué et n’accepte plus de demandes.',
  },
  saleStatus: { available: 'À vendre', reserved: 'Réservé', sold: 'Vendu' },
  saleStatusMessage: {
    reserved: 'Une offre a été acceptée. L’agent n’organise pas de visites pour le moment.',
    sold: 'Ce logement a été vendu.',
  },
  requestViewing: 'Demander une visite',
  apply: 'Postuler',
  contactAgent: 'Contacter l’agent',
  requestVisit: 'Demander une visite',
  makeOffer: 'Faire une offre',
  yourHome: 'Votre logement',
  theirHome: 'Son logement',
  dates: 'Dates',
  guests: 'Voyageurs',
  addDates: 'Ajouter des dates',
  addGuests: 'Ajouter des voyageurs',
  proposeSwap: 'Proposer un échange',
  exchangeModes: { swap: 'Échange réciproque', host: 'Points d’accueil', both: 'Les deux' },
  scheduleViewing: 'Planifier une visite',
  noTimesLeft: 'Plus aucun créneau ce jour-là',
  noteForLandlord: 'Message au propriétaire',
  day: 'Jour',
  time: 'Heure',
  submitViewing: 'Demander la visite',
  inPerson: 'Sur place',
  videoCall: 'Appel vidéo',
  viewingType: 'Type de visite',
  yourApplication: 'Votre dossier',
  applicationProgress: 'Avancement du dossier',
  progressReady: (done, total) => `${done} sur ${total} prêts`,
  applicationStatus: {
    missing: 'Manquant',
    uploaded: 'En cours d’examen',
    verified: 'Vérifié',
    rejected: 'Refusé',
  },
  applicationAction: { upload: 'Importer', view: 'Voir', replace: 'Remplacer' },
  itemAction: (action, title) => `${action} : ${title}`,
  mortgage: {
    title: 'Simulateur de prêt immobilier',
    price: 'Prix du bien',
    downPayment: 'Apport',
    downPaymentPercent: 'Apport en pourcentage',
    percent: 'Pourcentage',
    term: 'Durée du prêt',
    years: 'ans',
    rate: 'Taux d’intérêt',
    monthlyPayment: 'Mensualité',
    principal: 'Capital',
    interest: 'Intérêts',
    loanAmount: 'Montant emprunté',
    totalInterest: 'Total des intérêts',
    totalCost: 'Coût total',
  },
  termYears: (n) => plural('fr', n, { one: '{n} an', other: '{n} ans' }),
  mortgageDisclaimer:
    'Une estimation, pas une offre. Elle n’inclut ni frais, ni taxes, ni assurance, et suppose un taux fixe sur toute la durée.',
};

const AGENT_PROGRESS_MESSAGES: Translations['AGENT_PROGRESS_MESSAGES'] = {
  stepsLeft: (n) => plural('fr', n, { one: '{n} étape restante', other: '{n} étapes restantes' }),
  allCompleted: 'Toutes les étapes sont terminées',
  minimize: 'Réduire les étapes',
  expand: 'Développer les étapes',
  defaultSteps: [
    'Lire les fichiers du projet',
    'Mettre à jour et installer les tokens du mode clair',
    'Implémenter les tokens du mode sombre',
    'Ajouter un sélecteur de thème réutilisable et enregistré',
    'Lancer le registre, le lint et le build de production',
  ],
};

const CALENDAR_MESSAGES: Translations['CALENDAR_MESSAGES'] = {
  newEvent: 'Nouvel événement',
  openNavigation: 'Ouvrir la navigation',
  month: 'Mois',
  moreEvents: (n) => plural('fr', n, { one: '+{n} autre', other: '+{n} autres' }),
  eventDetails: "Détails de l'événement",
  join: 'Rejoindre',
  editTimeZone: 'Modifier le fuseau horaire',
  participants: 'Participants',
  editParticipants: 'Modifier les participants',
  reminders: 'Rappels',
  editReminders: 'Modifier les rappels',
  duration: calendar_compactDuration(' h', ' min', ' '),
  jumpToDate: 'Aller à une date',
  previousMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  chooseDate: (month) => `${month}, choisir une date`,
  inbox: 'Boîte de réception',
  inboxMenu: 'Menu de la boîte de réception',
  addAccount: 'Ajouter un compte',
};

const LISTING_DETAILS_MESSAGES: Translations['LISTING_DETAILS_MESSAGES'] = {
  ratedOutOf5: (r) => `Noté ${r} sur 5`,
  overallRating: 'Note globale',
  unavailable: 'Indisponible',
  showAllAmenities: (n) =>
    plural('fr', n, { one: 'Afficher {n} équipement', other: 'Afficher les {n} équipements' }),
  showAllFeatures: (n) =>
    plural('fr', n, {
      one: 'Afficher {n} caractéristique',
      other: 'Afficher les {n} caractéristiques',
    }),
  propertyFeatures: 'Caractéristiques du bien',
  showAllPhotos: 'Afficher toutes les photos',
  listingPhotos: 'Photos de l’annonce',
  photoOf: (p, t) => `Photo ${p} sur ${t}`,
  photoWithAlt: (a, p, t) => `${a}, photo ${p} sur ${t}`,
  floorPlanOf: (a, p, t) => `${a}, plan ${p} sur ${t}`,
  landlord: 'Propriétaire',
  agent: 'Agent immobilier',
  agency: 'Agence',
  activeListings: (n) =>
    plural('fr', n, { one: '{n} annonce active', other: '{n} annonces actives' }),
  verified: 'Vérifié',
  showPhone: 'Afficher le numéro',
  call: 'Appeler',
  messageHost: 'Contacter l’hôte',
  message: 'Envoyer un message',
};

const PRICE_BREAKDOWN_MESSAGES: Translations['PRICE_BREAKDOWN_MESSAGES'] = {
  states: { estimated: 'Estimé', pending: 'En attente' },
  showDetails: 'Afficher le détail du prix',
  hideDetails: 'Masquer le détail du prix',
  breakdown: 'Détail du prix',
  about: (label) => `À propos de ${label}`,
};

const DATE_PICKER_MESSAGES: Translations['DATE_PICKER_MESSAGES'] = {
  cancel: 'Annuler',
  apply: 'Appliquer',
  previousMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  datePlaceholder: 'Sélectionner une date',
  dateLabel: 'Date',
  rangePlaceholder: 'Sélectionner une période',
  rangeLabel: 'Période',
  startDate: 'Date de début',
  endDate: 'Date de fin',
  daysSelected: (n) =>
    plural('fr', n, { one: '{n} jour sélectionné', other: '{n} jours sélectionnés' }),
  presets: {
    today: "Aujourd'hui",
    yesterday: 'Hier',
    lastWeek: 'La semaine dernière',
    thisMonth: 'Ce mois-ci',
    lastMonth: 'Le mois dernier',
    thisYear: 'Cette année',
    lastYear: "L'année dernière",
    allTime: 'Depuis toujours',
  },
  meetingTrigger: 'Planifier une réunion',
  meetingLabel: 'Planifier une réunion',
  send: "Envoyer l'invitation",
  selectTime: 'Sélectionner une heure',
  duration: (n) => plural('fr', n, { one: '{n} minute', other: '{n} minutes' }),
};

const SHIPMENT_REQUEST_MESSAGES: Translations['SHIPMENT_REQUEST_MESSAGES'] = {
  kinds: {
    envelope: { label: 'Enveloppe', description: 'Documents, clés, tout ce qui est plat.' },
    parcel: { label: 'Colis', description: 'Un carton ou un sac portable par une personne.' },
    furniture: {
      label: 'Meubles',
      description: 'Un canapé, une table, un matelas — deux personnes à chaque bout.',
    },
    pallet: { label: 'Palette', description: 'Filmée et empilée, déplacée avec un hayon.' },
    food: { label: 'Repas', description: 'Une livraison de restaurant, maintenue à température.' },
  },
  sizes: {
    small: "Jusqu'à une boîte à chaussures — 35 × 25 × 20 cm.",
    medium: "Jusqu'à un bagage cabine — 55 × 40 × 25 cm.",
    large: "Jusqu'à un lave-linge — 85 × 60 × 60 cm.",
    extraLarge: 'Plus grand — précisez-le dans les notes.',
  },
  access: { ground: 'Rez-de-chaussée', stairs: 'Escaliers', lift: 'Ascenseur' },
  load: {
    kind: 'Que transportons-nous ?',
    size: 'Taille',
    weight: 'Poids',
    quantity: 'Combien',
    quantityValue: (n) => plural('fr', n, { one: '{n} article', other: '{n} articles' }),
    notes: 'Autre chose que le transporteur doit savoir ?',
    notesPlaceholder: 'Fragile, un code d’ascenseur, où le déposer…',
  },
  options: {
    extras: 'Options supplémentaires',
    access: 'Accès aux deux adresses',
    window: 'Quand faut-il l’enlever ?',
  },
  form: {
    route: 'Trajet',
    routeDescription: 'D’abord l’enlèvement, la livraison en dernier.',
    load: 'Le chargement',
    photos: 'Photos',
    photosDescription:
      'Une photo du chargement est ce qui améliore le plus les devis que vous recevrez.',
    options: 'Options',
    optionsDescription: 'Chacune modifie le prix.',
    price: 'Prix',
  },
  shipmentRequest: 'Demande de transport',
};

const LABEL_MESSAGES: Translations['LABEL_MESSAGES'] = { required: 'obligatoire' };

const CHECKOUT_SUMMARY_MESSAGES: Translations['CHECKOUT_SUMMARY_MESSAGES'] = {
  title: 'Vérifiez votre commande',
  orderSummary: 'Récapitulatif de la commande',
  deliverTo: 'Livrer à',
  notChosen: 'Pas encore choisi',
  opensPicker: 'Ouvre le sélecteur',
  placeOrder: 'Passer la commande',
  placingOrder: 'Commande en cours',
};

const VEHICLE_PICKER_MESSAGES: Translations['VEHICLE_PICKER_MESSAGES'] = {
  from: 'À partir de',
  fits: (label) => `Ce qui tient dans : ${label}`,
  unavailable: 'Indisponible pour ce chargement',
  vehicle: 'Véhicule',
  vehicles: {
    bike: {
      label: 'Vélo cargo',
      capacity: "Jusqu'à 25 kg · 60 × 40 × 40 cm",
      fits: ['Des documents', 'Une commande de repas', 'Un petit carton'],
    },
    car: {
      label: 'Voiture',
      capacity: "Jusqu'à 150 kg · 100 × 80 × 60 cm",
      fits: ['Deux valises', 'Quatre cartons', 'Un vélo'],
    },
    van: {
      label: 'Fourgonnette',
      capacity: "Jusqu'à 800 kg · 240 × 150 × 140 cm",
      fits: ['Un canapé', "Le déménagement d'un studio", 'Une demi-palette'],
    },
    boxTruck: {
      label: 'Camion fourgon',
      capacity: "Jusqu'à 3 500 kg · 420 × 200 × 210 cm",
      fits: ['Deux palettes', "Le déménagement d'un T3", 'Un hayon élévateur'],
    },
    refrigerated: {
      label: 'Fourgon frigorifique',
      capacity: "Jusqu'à 700 kg · entre 2 et 8 °C",
      fits: ['Produits frais', 'Traiteur réfrigéré', 'Des fleurs'],
    },
  },
};

const COMPOSER_PANEL_MESSAGES: Translations['COMPOSER_PANEL_MESSAGES'] = {
  message: 'Message',
  add: 'Ajouter une pièce jointe',
  addMenu: 'Ajouter au chat',
  permissions: 'Autorisations',
  permissionMode: "Mode d'autorisation",
  learnMore: 'En savoir plus',
  voice: 'Saisie vocale',
  send: 'Envoyer le message',
  stop: 'Arrêter la génération',
  permissionTrigger: (mode) => `Autorisation : ${mode}`,
  removeFile: (name) => `Retirer ${name}`,
  retryFile: (name) => `Réessayer ${name}`,
  panelPlaceholder: "Bonjour, de quoi avez-vous besoin aujourd'hui ?",
  pillPlaceholder: 'Posez-moi une question',
  pillCompactPlaceholder: 'Demandez-moi',
  modelSettings: 'Paramètres du modèle',
  models: 'Modèles',
  modelGroup: 'Modèle',
  effort: 'Effort',
  effortAuto: 'Automatique',
  faster: 'Plus rapide',
  smarter: 'Plus intelligent',
  quickSearch: 'Recherche rapide',
  searchModels: 'Rechercher des modèles',
  closeSearch: 'Fermer la recherche',
  noMatches: 'Aucun modèle ne correspond',
  providers: 'Fournisseurs',
  matchingModels: 'Modèles correspondants',
  providerModels: (provider) => `Modèles ${provider}`,
  localFolders: 'Dossiers locaux',
  context: (percent) => `Contexte ${percent} %`,
  effortLevels: ['Faible', 'Moyen', 'Équilibré', 'Élevé', 'Très élevé', 'Maximal'],
  permissionModes: {
    auto: { label: 'Automatique', description: "L'agent décide seul" },
    manual: { label: 'Manuel', description: 'Toujours demander avant une modification' },
    plan: { label: 'Mode plan', description: 'Créer un plan avant de continuer' },
    bypass: { label: 'Tout contourner', description: "L'agent gère les autorisations" },
  },
  addMenuRows: {
    add: 'Ajouter',
    plugins: 'Plug-ins',
    files: 'Fichiers et dossiers',
    goal: 'Objectif',
    goalDescription: 'Fixez un objectif pour des résultats plus rapides',
    plan: 'Mode plan',
    planDescription: 'Gérez des tâches complexes',
    documents: 'Documents',
    documentsDescription: 'Créez et modifiez des documents',
    spreadsheets: 'Feuilles de calcul',
    spreadsheetsDescription: 'Générez des feuilles de calcul',
    presentations: 'Présentations',
    presentationsDescription: 'Créez des supports marketing',
    code: 'Blocs de code',
    codeDescription: 'Écrivez et modifiez du code existant',
  },
};

const MESSAGE_BUBBLE_MESSAGES: Translations['MESSAGE_BUBBLE_MESSAGES'] = {
  forwardedFrom: (name) => `Transféré de ${name}`,
  deleted: 'Ce message a été supprimé',
  retry: "Réessayer l'envoi",
  addReaction: 'Ajouter une réaction',
  replyTo: 'Aller au message cité',
  selected: 'Sélectionné',
  pending: 'Envoi en cours',
  failed: 'Non envoyé',
  reactionSelected: 'sélectionnée',
  unread: 'Messages non lus',
  typing: "En train d'écrire…",
};

const PAYMENT_STATUS_MESSAGES: Translations['PAYMENT_STATUS_MESSAGES'] = {
  states: {
    authorising: 'Autorisation en cours',
    paid: 'Payé',
    failed: 'Échec du paiement',
    refunded: 'Remboursé',
    pending: 'Paiement en attente',
  },
  reference: 'Référence',
};

const AVATAR_MESSAGES: Translations['AVATAR_MESSAGES'] = { live: 'DIRECT' };

const PLACE_CARD_MESSAGES: Translations['PLACE_CARD_MESSAGES'] = {
  openStates: {
    open: 'Ouvert',
    'closing-soon': 'Ferme bientôt',
    closed: 'Fermé',
    'opening-soon': 'Ouvre bientôt',
  },
  new: 'Nouveau',
  actions: 'Actions',
  actionsFor: (name) => `Actions pour ${name}`,
  rated: (value, reviews) =>
    placeCard_withReviews(
      `Noté ${value} sur 5`,
      reviews === undefined
        ? undefined
        : placeCard_countOf('fr', reviews, { one: '{n} avis', other: '{n} avis' }),
    ),
};

const SOCIAL_BUTTON_MESSAGES: Translations['SOCIAL_BUTTON_MESSAGES'] = {
  actions: {
    continue: (b) => `Continuer avec ${b}`,
    signIn: (b) => `Se connecter avec ${b}`,
    signUp: (b) => `S'inscrire avec ${b}`,
  },
};

const QUESTIONNAIRE_MESSAGES: Translations['QUESTIONNAIRE_MESSAGES'] = {
  other: 'Autre',
  otherPlaceholder: 'Saisissez votre réponse ici',
  steps: 'Étapes',
  step: (n) => `Étape ${n}`,
};

const MAP_CONTROLS_MESSAGES: Translations['MAP_CONTROLS_MESSAGES'] = {
  group: 'Commandes de la carte',
  locate: 'Afficher ma position',
  following: 'Ne plus suivre ma position',
  zoomIn: 'Zoom avant',
  zoomOut: 'Zoom arrière',
  zoom: 'Zoom',
  tilt: 'Incliner la carte',
  tiltOff: 'Remettre la carte à plat',
  compass: (degrees) => `Orienté à ${degrees} degrés. Réorienter vers le nord`,
  layerTrigger: 'Calques de la carte',
  layers: 'Carte',
  overlays: 'Superpositions',
};

const PAYMENT_METHOD_MESSAGES: Translations['PAYMENT_METHOD_MESSAGES'] = {
  states: { expired: 'Expirée', declined: 'Refusée' },
  default: 'Par défaut',
  add: 'Ajouter un moyen de paiement',
  emptyTitle: 'Aucun moyen de paiement enregistré',
  paymentMethods: 'Moyens de paiement',
};

const AVATAR_GROUP_MESSAGES: Translations['AVATAR_GROUP_MESSAGES'] = {
  more: (n) => plural('fr', n, { one: '{n} autre personne', other: '{n} autres personnes' }),
  profile: 'Profil',
};

const MENUBAR_MESSAGES: Translations['MENUBAR_MESSAGES'] = {
  menuBar: 'Barre de menus',
};

const AGENT_THINKING_MESSAGES: Translations['AGENT_THINKING_MESSAGES'] = {
  thinking: 'Réflexion en cours',
};

const AI_CHAT_MESSAGES: Translations['AI_CHAT_MESSAGES'] = {
  feedback: {
    like: 'Bonne réponse',
    dislike: 'Mauvaise réponse',
    copy: 'Copier la réponse',
    copied: 'Copié !',
  },
  imageGeneration: {
    generated: 'Image générée',
    generating: "Génération de l'image",
    remaining: (n) =>
      plural('fr', n, { one: '{n} seconde restante', other: '{n} secondes restantes' }),
    likeToast: 'Merci pour votre avis',
    dislikeToast: 'Merci, nous en tiendrons compte pour nous améliorer',
  },
  generatedImage: (alt) => `Image générée : ${alt}`,
  codePanel: {
    changes: 'Modifications',
    browser: 'Navigateur',
    uncommitted: (n) =>
      plural('fr', n, {
        one: '{n} modification non validée',
        other: '{n} modifications non validées',
      }),
    undo: 'Annuler les modifications',
    browserPreview: 'Aperçu du navigateur',
  },
  galleryPanel: {
    gallery: 'Galerie',
    styles: 'Styles',
    stylePresets: 'Styles prédéfinis',
    enlarge: (prompt) => `Agrandir ${prompt}`,
    minimize: (prompt) => `Réduire ${prompt}`,
    download: (prompt) => `Télécharger ${prompt}`,
  },
  panelView: 'Vue du panneau',
  openTerminal: 'Ouvrir le terminal',
  newGeneration: 'Nouvelle génération',
  expandPanel: 'Agrandir le panneau',
  togglePanel: 'Afficher ou masquer le panneau',
  container: { breadcrumb: 'Emplacement de la discussion', share: 'Partager la discussion' },
  shell: {
    openNavigation: 'Ouvrir la navigation',
    closeNavigation: 'Fermer la navigation',
    openPanel: (panel) => `Ouvrir le panneau ${panel}`,
    closePanel: (panel) => `Fermer le panneau ${panel}`,
  },
  code: 'Code',
};

const COMMAND_MESSAGES: Translations['COMMAND_MESSAGES'] = {
  placeholder: 'Saisissez une commande ou recherchez…',
  empty: 'Aucun résultat trouvé.',
  palette: 'Palette de commandes',
  clearSearch: 'Effacer la recherche',
};

const MUSIC_LIBRARY_MESSAGES: Translations['MUSIC_LIBRARY_MESSAGES'] = {
  kinds: {
    playlist: 'Playlist',
    artist: 'Artiste',
    album: 'Album',
    podcast: 'Podcast',
    audiobook: 'Livre audio',
    folder: 'Dossier',
  },
  library: {
    title: 'Bibliothèque',
    create: 'Créer une playlist ou un dossier',
    collapseRail: 'Réduire la bibliothèque',
    expandRail: 'Ouvrir la bibliothèque',
    filters: 'Filtres',
    clearFilters: 'Effacer les filtres',
    filter: {
      playlists: 'Playlists',
      artists: 'Artistes',
      albums: 'Albums',
      podcasts: 'Podcasts',
      audiobooks: 'Livres audio',
    },
    downloaded: 'Téléchargé',
    search: 'Rechercher dans la bibliothèque',
    searchPlaceholder: 'Rechercher dans la bibliothèque',
    clearSearch: 'Effacer la recherche',
    sortAndView: 'Trier et afficher',
    sortBy: 'Trier par',
    viewAs: 'Afficher en',
    sort: {
      recents: 'Récents',
      'recently-added': 'Ajoutés récemment',
      alphabetical: 'Ordre alphabétique',
      creator: 'Créateur',
    },
    view: { compact: 'Compact', list: 'Liste', grid: 'Grille' },
    empty: "Rien ici pour l'instant",
  },
  item: { pinned: 'Épinglé', downloaded: 'Téléchargé', nowPlaying: 'En cours de lecture' },
  search: {
    placeholder: "Qu'est-ce que vous voulez écouter ?",
    clear: 'Effacer la recherche',
    browse: 'Parcourir',
  },
  resultTypes: 'Types de résultats',
  topResultKinds: {
    song: 'Titre',
    artist: 'Artiste',
    album: 'Album',
    playlist: 'Playlist',
    podcast: 'Podcast',
    episode: 'Épisode',
    audiobook: 'Livre audio',
    profile: 'Profil',
  },
  recent: {
    title: 'Recherches récentes',
    clearAll: 'Effacer les recherches récentes',
    remove: (title) => `Retirer ${title}`,
  },
};

const LISTING_CARD_MESSAGES: Translations['LISTING_CARD_MESSAGES'] = {
  statuses: { reserved: 'Réservé', sold: 'Vendu', rented: 'Loué', unavailable: 'Indisponible' },
  originally: (p) => `initialement ${p}`,
  approximateLocation: 'Emplacement approximatif',
  rated: (r) => `Noté ${r} sur 5`,
  ratedWithReviews: (r, c) => plural('fr', c, { other: `Noté ${r} sur 5, ${c} avis` }),
  newListing: 'Nouveau',
  previousPhoto: 'Photo précédente',
  nextPhoto: 'Photo suivante',
  saveToWishlist: 'Enregistrer dans les favoris',
  removeFromWishlist: 'Retirer des favoris',
};

const NAVIGATION_BANNER_MESSAGES: Translations['NAVIGATION_BANNER_MESSAGES'] = {
  states: { 'off-route': 'Hors itinéraire', rerouting: "Recherche d'un nouvel itinéraire" },
  thenLine: (street, maneuver) =>
    navigationBanner_words('puis', navigationBanner_midSentence(maneuver, 'fr'), street),
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
};

const LOCATION_PUCK_MESSAGES: Translations['LOCATION_PUCK_MESSAGES'] = {
  states: {
    locating: 'Recherche de votre position',
    located: 'Votre position',
    stale: 'Votre dernière position connue',
  },
  facing: (state, degrees) => `${state}, orienté à ${degrees} degrés`,
};

const CAROUSEL_MESSAGES: Translations['CAROUSEL_MESSAGES'] = {
  previousSlide: 'Diapositive précédente',
  nextSlide: 'Diapositive suivante',
  goToSlide: (n) => `Aller à la diapositive ${n}`,
  slideOf: (at, of) => `${at} sur ${of}`,
  carouselRole: 'carrousel',
  slideRole: 'diapositive',
};

const ORDER_STATUS_MESSAGES: Translations['ORDER_STATUS_MESSAGES'] = {
  states: { current: 'En cours', upcoming: 'À venir', failed: 'Échec' },
  status: 'Statut',
};

const RATING_MESSAGES: Translations['RATING_MESSAGES'] = {
  newRating: 'Nouveau',
  reviews: (c) => rating_countForms('fr', c, { one: '{n} avis', other: '{n} avis' }),
  rated: (v) => `Noté ${v} sur 5`,
  ratedWithReviews: (v, r) => `Noté ${v} sur 5, ${r}`,
  star: (n) => plural('fr', n, { one: '{n} étoile', other: '{n} étoiles' }),
};

const LISTING_EDITOR_MESSAGES: Translations['LISTING_EDITOR_MESSAGES'] = {
  offering: {
    rent: { title: 'À louer', description: 'Location longue durée, au mois.' },
    sale: { title: 'À vendre', description: 'Vendre le logement.' },
    stay: { title: 'Location de vacances', description: 'Courts séjours, à la nuit.' },
    swap: {
      title: 'Échange de maison',
      description: 'Échangez votre logement avec d’autres membres.',
    },
    monthlyRent: 'Loyer mensuel',
    deposit: 'Dépôt de garantie',
    depositOption: (months) =>
      months === 0 ? 'Aucun' : plural('fr', months, { one: '{n} mois', other: '{n} mois' }),
    availableFrom: 'Disponible à partir du',
    minimumStay: 'Durée minimale',
    months: (months) => plural('fr', months, { one: '{n} mois', other: '{n} mois' }),
    askingPrice: 'Prix demandé',
    pricePerArea: 'Prix au m²',
    pricePerAreaEmpty: 'Ajoutez un prix',
    nightlyRate: 'Prix par nuit',
    cleaningFee: 'Frais de ménage',
    minimumNights: 'Nombre minimal de nuits',
    nights: (nights) => plural('fr', nights, { one: '{n} nuit', other: '{n} nuits' }),
    swapMode: 'Comment souhaitez-vous échanger ?',
    swapModes: { swap: 'Échanger les logements', host: 'Accueillir uniquement', both: 'Les deux' },
    group: 'Comment le logement est-il proposé ?',
  },
  propertyTypes: {
    apartment: 'Appartement',
    house: 'Maison',
    room: 'Chambre',
    studio: 'Studio',
    duplex: 'Duplex',
    penthouse: 'Penthouse',
    coliving: 'Colocation',
    hostel: 'Auberge',
    other: 'Autre',
  },
  propertyType: 'Type de bien',
  addressPrecision: {
    exact: {
      title: 'Adresse exacte',
      description:
        'Le repère est placé sur le bâtiment. Idéal pour les logements faciles à trouver de toute façon.',
    },
    street: {
      title: 'Rue uniquement',
      description:
        'Affiche la rue, pas le numéro. L’adresse exacte est communiquée après la réservation ou la signature.',
    },
    approximate: {
      title: 'Zone approximative',
      description: 'Affiche un cercle d’environ 500 m. L’option la plus discrète.',
    },
  },
  addressPrecisionLabel: 'Précision de l’adresse',
  addressPrecisionFootnote:
    'La carte publiée suit ce choix. Votre adresse exacte n’est communiquée qu’aux personnes que vous confirmez.',
  qualityTitle: 'Qualité de l’annonce',
  qualityScore: 'Score de qualité de l’annonce',
  tips: 'Conseils',
  todo: 'À faire',
  needsWork: 'À améliorer',
  good: 'Bien',
  excellent: 'Excellent',
  previewTitle: 'Aperçu',
  previewDescription: 'Voici comment les voyageurs verront votre annonce.',
  card: 'Carte',
  page: 'Page',
  previewAs: 'Aperçu en',
  reviews: (n, shown) =>
    plural('fr', n, { one: '{s} avis', other: '{s} avis' }).replace('{s}', shown),
};

const MEDIA_HEADER_MESSAGES: Translations['MEDIA_HEADER_MESSAGES'] = {
  artistPick: "Choix de l'artiste",
  saveEpisode: "Enregistrer l'épisode",
  share: 'Partager',
  podcastEpisode: 'Épisode de podcast',
  listeningProgress: "Progression de l'écoute",
  shuffle: 'Lecture aléatoire',
  download: 'Télécharger',
  downloadProgress: 'Progression du téléchargement',
  follow: 'Suivre',
  following: 'Abonné',
  searchInPlaylist: 'Rechercher dans la playlist',
  compactView: 'Affichage compact',
  editDetails: 'Modifier les détails',
  about: 'À propos',
  discography: 'Discographie',
  showAll: 'Tout afficher',
  albums: 'Albums',
  singlesAndEps: 'Singles et EP',
  compilations: 'Compilations',
  audiobook: 'Livre audio',
  popular: 'Populaires',
  seeMore: 'Voir plus',
  podcast: 'Podcast',
  latestEpisode: 'Dernier épisode',
  verifiedArtist: 'Artiste vérifié',
  profile: 'Profil',
  editProfile: 'Modifier le profil',
};

const MENU_ITEM_MESSAGES: Translations['MENU_ITEM_MESSAGES'] = {
  diets: {
    vegetarian: 'Végétarien',
    vegan: 'Végan',
    'gluten-free': 'Sans gluten',
    'dairy-free': 'Sans lactose',
    halal: 'Halal',
    kosher: 'Casher',
  },
  spicy: 'Épicé',
  spiceOf: (label, level, max) => `${label} ${level} sur ${max}`,
  originally: (price, original) => `${price}, au lieu de ${original}`,
  inBasket: (n) => `${n} dans le panier`,
  soldOut: 'Épuisé',
  addItem: (name) => `Ajouter ${name}`,
  choose: (n) => `Choisissez-en ${n}`,
  chooseRange: (min, max) => `Choisissez-en de ${min} à ${max}`,
  upTo: (n) => `Jusqu'à ${n}`,
  optional: 'Facultatif',
  quantity: 'Quantité',
  addToBasket: 'Ajouter au panier',
  options: 'Options',
};

const PAGINATION_MESSAGES: Translations['PAGINATION_MESSAGES'] = {
  pagination: 'Navigation entre les pages',
  goToPage: (page) => `Aller à la page ${page}`,
};

const LEAD_SCORE_MESSAGES: Translations['LEAD_SCORE_MESSAGES'] = {
  title: 'Score du prospect',
  factors: 'Ce qui le compose',
  bands: { cold: 'Froid', warm: 'Tiède', hot: 'Chaud' },
};

const DIRECTIONS_MESSAGES: Translations['DIRECTIONS_MESSAGES'] = {
  modes: { drive: 'Voiture', transit: 'Transports en commun', walk: 'À pied', cycle: 'Vélo' },
  traffic: { light: 'Trafic fluide', moderate: 'Trafic modéré', heavy: 'Trafic dense' },
  maneuvers: {
    depart: 'Départ',
    straight: 'Continuez tout droit',
    'slight-left': 'Tournez légèrement à gauche',
    left: 'Tournez à gauche',
    'sharp-left': 'Tournez fortement à gauche',
    'slight-right': 'Tournez légèrement à droite',
    right: 'Tournez à droite',
    'sharp-right': 'Tournez fortement à droite',
    uturn: 'Faites demi-tour',
    roundabout: 'Au rond-point',
    merge: 'Insérez-vous',
    arrive: 'Arrivée',
    board: 'Montez',
    alight: 'Descendez',
    transfer: 'Changez',
    walk: 'Marchez',
  },
  directions: 'Itinéraire',
  otherRoutes: 'Autres itinéraires',
  travelMode: 'Mode de transport',
  start: 'Démarrer',
  currentStep: 'Étape actuelle',
  line: (name) => `Ligne ${name}`,
};

const CART_PANEL_MESSAGES: Translations['CART_PANEL_MESSAGES'] = {
  basket: 'Panier',
  checkout: 'Passer au paiement',
  emptyTitle: 'Votre panier est vide',
  emptyDescription: 'Ajoutez un article depuis le menu et il apparaîtra ici.',
  soldOut: 'Épuisé',
  removeItem: (name) => `Retirer ${name}`,
  originally: (price, original) => `${price}, au lieu de ${original}`,
  promoCode: 'Code promo',
  apply: 'Appliquer',
  tip: 'Pourboire',
};

const MEDIA_CARD_MESSAGES: Translations['MEDIA_CARD_MESSAGES'] = {
  albumTypes: { album: 'Album', single: 'Single', ep: 'EP', compilation: 'Compilation' },
  artist: 'Artiste',
  verified: 'Vérifié',
  audiobook: 'Livre audio',
  narratedBy: (n) => `Lu par ${n}`,
  progressOf: (t) => `Progression de ${t}`,
  episode: 'Épisode',
  played: 'Écouté',
  event: 'Événement',
  soldOut: 'Complet',
  listeningNow: 'En écoute',
  trackBy: (t, a) => `${t} de ${a}`,
  mix: 'Mix',
  playlist: 'Liste de lecture',
  collaborative: 'Liste collaborative',
  ownedBy: (o) => `Par ${o}`,
  podcast: 'Podcast',
  profile: 'Profil',
  followsYou: 'Vous suit',
  song: 'Titre',
  share: 'Partager',
  listened: 'Écouté',
};

const JOB_BOARD_MESSAGES: Translations['JOB_BOARD_MESSAGES'] = {
  labels: {
    take: 'Prendre la mission',
    pass: 'Passer',
    distance: 'Distance',
    duration: 'Durée',
    window: 'Créneau',
    pickup: 'Enlèvement',
    dropoff: 'Livraison',
    state: { taken: 'Prise', expired: 'Expirée' },
    showPay: 'Voir la rémunération',
    hidePay: 'Masquer la rémunération',
    payDetails: 'Rémunération pour',
    sort: 'Trier les missions',
    filtersToggle: 'Filtres',
    filtersActive: (n) => plural('fr', n, { one: '{n} appliqué', other: '{n} appliqués' }),
    sortOptions: {
      pay: 'Mieux payées',
      distance: 'Les plus proches',
      soonest: 'Commencent le plus tôt',
      expiring: 'Se terminent le plus tôt',
    },
    filters: { distance: 'Distance', pay: 'Rémunération', when: 'Quand', vehicle: 'Véhicule' },
    clearFilters: 'Effacer les filtres',
    refresh: 'Actualiser la liste',
    count: (n) => plural('fr', n, { one: '{n} mission', other: '{n} missions' }),
    loading: 'Chargement des missions',
  },
  emptyTitle: 'Aucune mission pour le moment',
  emptyDescription:
    'Rien ne correspond à votre recherche. Élargissez un filtre ou actualisez dans une minute.',
  list: 'Missions',
  payDetailsFor: (load) => `Rémunération pour ${load}`,
  route: (pickup, dropoff) => `${pickup} et ${dropoff}`,
  bands: {
    anyDistance: 'Toute distance',
    underKm: (km) => `Moins de ${km} km`,
    anyTime: "N'importe quand",
    withinHour: "Dans l'heure",
    nextHours: (hours) => `Dans les ${hours} prochaines heures`,
    today: "Aujourd'hui",
  },
};

const FLOATING_MESSAGES: Translations['FLOATING_MESSAGES'] = {
  submenu: 'Sous-menu',
};

const AGENT_CHAT_MESSAGES: Translations['AGENT_CHAT_MESSAGES'] = {
  chat: {
    newChat: 'Nouvelle discussion',
    emptyTitle: 'Comment puis-je vous aider ?',
    emptyDescription:
      'Cette discussion utilise votre propre clé API. L’historique reste dans ce navigateur.',
    thinking: 'Réflexion en cours',
    error: 'Une erreur s’est produite. Consultez les journaux du serveur, puis réessayez.',
    suggestions: [
      'Explique ce que fait ce projet de démarrage',
      'Rédige une mise à jour produit en trois phrases',
      'Propose-moi cinq noms pour une application de prise de rendez-vous',
    ],
    you: 'Vous',
    assistant: 'Assistant',
  },
  actions: {
    share: 'Partager la discussion',
    shared: 'Transcription copiée',
    more: 'Plus d’actions pour cette discussion',
    exportChats: 'Exporter les discussions',
    markUnread: 'Marquer comme non lu',
    deleteChat: 'Supprimer la discussion',
  },
  message: {
    copy: 'Copier le message',
    readAloud: 'Lire à voix haute',
    stopReading: 'Arrêter la lecture à voix haute',
  },
  history: {
    region: 'Historique des discussions',
    recent: 'Récentes',
    empty: 'Les discussions que vous lancez apparaissent ici.',
    rename: 'Renommer',
    renameField: 'Renommer la discussion',
    markUnread: 'Marquer comme non lu',
    unread: 'Non lu',
    exportCount: (n) =>
      n === 0
        ? 'Aucune discussion à exporter'
        : plural('fr', n, { one: 'Exporter {n} discussion', other: 'Exporter {n} discussions' }),
    accountMenu: (name) => `Menu du compte de ${name}`,
    usageLeft: 'Utilisation restante',
    upgrade: 'Passer à Max',
    logOut: 'Se déconnecter',
  },
  composer: {
    field: 'Message',
    placeholder: 'Posez-moi une question',
    attach: 'Ajouter une pièce jointe',
    send: 'Envoyer le message',
    stop: 'Arrêter la génération',
    notConfigured: 'Non configuré',
    messageCount: (n) => plural('fr', n, { one: '{n} message', other: '{n} messages' }),
    answeringWith: (model) => `Réponse avec ${model}`,
  },
  ago: {
    justNow: 'à l’instant',
    minutes: (n) => plural('fr', n, { one: 'il y a {n} minute', other: 'il y a {n} minutes' }),
    hours: (n) => plural('fr', n, { one: 'il y a {n} heure', other: 'il y a {n} heures' }),
    days: (n) => plural('fr', n, { one: 'il y a {n} jour', other: 'il y a {n} jours' }),
  },
  age: {
    now: 'à l’instant',
    minutes: (n) => `${n} min`,
    hours: (n) => `${n} h`,
    days: (n) => `${n} j`,
  },
};

const WEB_SEARCH_MESSAGES: Translations['WEB_SEARCH_MESSAGES'] = {
  sources: 'Sources consultées',
  working: 'En cours',
};

const MAIL_THREAD_MESSAGES: Translations['MAIL_THREAD_MESSAGES'] = {
  to: 'À',
  cc: 'Cc',
  bcc: 'Cci',
  reply: 'Répondre',
  replyAll: 'Répondre à tous',
  forward: 'Transférer',
  more: COMMON_MESSAGES.more,
  moreAddresses: (n) => `${n} de plus`,
  earlierMessages: (n) =>
    plural('fr', n, { one: '{n} message précédent', other: '{n} messages précédents' }),
  showTrimmed: 'Afficher le contenu tronqué',
  hideTrimmed: 'Masquer le contenu tronqué',
  unread: 'Non lu',
  starred: 'Suivi',
  star: 'Suivre',
  attachments: 'Pièces jointes',
  attachmentCount: (n) => plural('fr', n, { one: '{n} pièce jointe', other: '{n} pièces jointes' }),
  expand: 'Développer le message',
  collapse: 'Réduire le message',
};

const NOTIFICATION_CENTER_MESSAGES: Translations['NOTIFICATION_CENTER_MESSAGES'] = {
  title: 'Notifications',
  emptyMessage: 'Vous êtes à jour.',
  emptyDescription: 'La nouvelle activité apparaîtra ici dès son arrivée.',
  noUnread: 'Aucune notification non lue',
  unread: (n) => plural('fr', n, { one: '{n} non lue', other: '{n} non lues' }),
  markAllRead: 'Tout marquer comme lu',
  category: 'Catégorie de notification',
  tabs: { all: 'Toutes', mentions: 'Mentions', system: 'Système' },
  unreadDot: 'Non lue',
};

const CHART_CARDS_MESSAGES: Translations['CHART_CARDS_MESSAGES'] = {
  titles: {
    activity: 'Activité',
    agents: 'Agents',
    visitors: 'Visiteurs',
    breakdown: 'Répartition',
    sessions: 'Sessions',
    contributionsThisYear: 'Contributions cette année',
    earnedSoFar: "Gagné jusqu'ici",
    signUpFunnel: "Entonnoir d'inscription",
    activeUsers: 'Utilisateurs actifs',
    revenue: "Chiffre d'affaires",
    mostActiveDays: 'Jours les plus actifs',
    orders: 'Commandes',
    trackedTime: 'Temps suivi',
    revenuePerAccount: "Chiffre d'affaires par compte",
    sleepScore: 'Score de sommeil',
    pipeline: 'Pipeline commercial',
    steps: 'Pas',
    tokens: 'Jetons',
  },
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  yearly: 'Annuel',
  stepsSuffix: 'pas',
  today: "Aujourd'hui",
  thisYear: 'Cette année',
  lastYear: "L'année dernière",
  sinceLastYear: "l'année dernière",
  aYearEarlier: 'un an plus tôt',
  earningsPeriod: 'Période de gains',
  changePeriod: 'Changer de période',
  period: 'Période',
  total: 'total',
  average: 'moyenne',
  thisMonth: 'ce mois-ci',
  ofGoal: "de l'objectif",
  totalSteps: 'pas au total',
  gaugeChart: (title, reading) => `Jauge ${title} : ${reading}`,
  halfGaugeChart: (title, items) => `Demi-jauge ${title} : ${items}`,
  radialChart: (title, items) => `Graphique radial ${title} : ${items}`,
  percentOfGoal: (pct) => `${pct} % de l'objectif`,
  periodOf: (label) => `Période : ${label.toLowerCase()}`,
  chartVs: (title, current, previous) =>
    `Graphique ${title} : ${current.toLowerCase()} par rapport à ${previous.toLowerCase()}`,
  lineChart: (title) => `Graphique linéaire ${title}`,
  barChart: (title, items) => `Graphique à barres ${title} : ${items}`,
  comboChart: (title, bar, line) =>
    `Graphique ${title} : barres ${bar} par rapport à la courbe ${line}`,
  scatterChart: (title, series) => `Nuage de points ${title} : ${series}`,
  bubbleChart: (title, series) => `Graphique à bulles ${title} : ${series}`,
  ringItem: (label, value, pct) => `${label} ${value}, ${pct} % de l'objectif`,
  scoreOf: (score, max) => `${score} sur ${max}`,
  activityFor: (name, day) => `Activité du ${day} ${name}`,
  contributions: (n, date) => {
    const on = date ? ` le ${date}` : '';
    return n === 0
      ? `Aucune contribution${on}`
      : plural('fr', n, { one: `{n} contribution${on}`, other: `{n} contributions${on}` });
  },
};

const CODE_MESSAGES: Translations['CODE_MESSAGES'] = {
  copy: 'Copier le code',
  copied: 'Code copié',
};

const OUTLINE_NAV_MESSAGES: Translations['OUTLINE_NAV_MESSAGES'] = {
  outline: 'Sur cette page',
  progress: (at, of) => `Titre ${at} sur ${of}`,
};

const STEPPER_MESSAGES: Translations['STEPPER_MESSAGES'] = {
  decrease: 'Diminuer',
  increase: 'Augmenter',
};

const CALL_UI_MESSAGES: Translations['CALL_UI_MESSAGES'] = {
  status: {
    calling: 'Appel en cours…',
    ringing: 'Sonnerie',
    connecting: 'Connexion…',
    active: 'Connecté',
    reconnecting: 'Reconnexion…',
    onHold: 'En attente',
    ended: 'Appel terminé',
  },
  controls: {
    mute: 'Couper le micro',
    unmute: 'Réactiver le micro',
    speakerOn: 'Activer le haut-parleur',
    speakerOff: 'Désactiver le haut-parleur',
    videoOn: 'Activer la caméra',
    videoOff: 'Désactiver la caméra',
    flipCamera: 'Changer de caméra',
    screenShareOn: "Partager l'écran",
    screenShareOff: "Arrêter le partage d'écran",
    addParticipant: 'Ajouter un participant',
    endCall: 'Raccrocher',
  },
  screen: {
    minimise: "Réduire l'appel",
    chat: 'Ouvrir le chat',
    participants: 'Participants',
    movePip: (c) =>
      `Déplacer ma vidéo (actuellement ${callUi_corner(CALL_UI_MESSAGES__CORNERS, c)})`,
  },
  pipCorners: CALL_UI_MESSAGES__CORNERS,
  history: {
    incoming: 'Entrant',
    outgoing: 'Sortant',
    missed: 'Manqué',
    declined: 'Refusé',
    callBack: (name) => `Rappeler ${name}`,
  },
  incoming: {
    accept: 'Accepter',
    decline: 'Refuser',
    message: 'Message',
    remind: 'Me le rappeler',
    slideToAnswer: 'Faites glisser pour répondre',
    voice: 'Appel vocal entrant',
    video: 'Appel vidéo entrant',
  },
  returnToCall: "Revenir à l'appel",
  returnToCallWith: (name) => `Revenir à l'appel avec ${name}`,
  join: 'Rejoindre',
  leave: 'Quitter',
  speaking: (name) => `${name} parle`,
  overflow: (n) => `+${n} de plus`,
  muted: (name) => `${name}, micro coupé`,
};

const RECENT_HIRES_CARD_MESSAGES: Translations['RECENT_HIRES_CARD_MESSAGES'] = {
  title: 'Recrutements récents',
};

const MAIL_LIST_MESSAGES: Translations['MAIL_LIST_MESSAGES'] = {
  draft: 'Brouillon :',
  unread: 'Non lu',
  starred: 'Suivi',
  star: 'Suivre',
  attachment: 'Contient une pièce jointe',
  select: 'Sélectionner',
  threadCount: (n) => plural('fr', n, { one: '{n} message', other: '{n} messages' }),
  moreLabels: (n) => plural('fr', n, { one: '{n} autre libellé', other: '{n} autres libellés' }),
  selectedCount: (n) => plural('fr', n, { one: '{n} sélectionné', other: '{n} sélectionnés' }),
  selectAll: 'Tout sélectionner',
  clearSelection: 'Effacer la sélection',
  emptyTitle: 'Rien ici',
  emptyDescription: 'Les nouveaux e-mails arrivent dans ce dossier.',
  today: "Aujourd'hui",
  yesterday: 'Hier',
  list: 'Messagerie',
};

const IMPORTANT_ALERTS_CARD_MESSAGES: Translations['IMPORTANT_ALERTS_CARD_MESSAGES'] = {
  title: 'Alertes importantes',
  thisWeek: 'cette semaine',
};

const STAT_CARDS_MESSAGES: Translations['STAT_CARDS_MESSAGES'] = {
  about: (label) => `À propos de ${label}`,
  fromLastMonth: 'Par rapport au mois dernier',
};

const SHAPE_MESSAGES: Translations['SHAPE_MESSAGES'] = {
  shapes: shapes_shapeNames(
    {
      square: 'Carré',
      slanted: 'Incliné',
      arch: 'Arche',
      semicircle: 'Demi-cercle',
      oval: 'Ovale',
      pill: 'Pilule',
      triangle: 'Triangle',
      arrow: 'Flèche',
      fan: 'Éventail',
      diamond: 'Losange',
      clamshell: 'Coquillage',
      pentagon: 'Pentagone',
      gem: 'Gemme',
      'very-sunny': 'Très ensoleillé',
      sunny: 'Ensoleillé',
      burst: 'Éclat',
      'soft-burst': 'Éclat doux',
      boom: 'Explosion',
      'soft-boom': 'Explosion douce',
      flower: 'Fleur',
      puffy: 'Gonflé',
      'puffy-diamond': 'Losange gonflé',
      'ghost-ish': 'Presque fantôme',
      'pixel-circle': 'Cercle pixelisé',
      'pixel-triangle': 'Triangle pixelisé',
      bun: 'Brioche',
      heart: 'Cœur',
    },
    (n) => `Biscuit à ${n} côtés`,
    (n) => `Trèfle à ${n} feuilles`,
  ),
};

const TENANCY_MESSAGES: Translations['TENANCY_MESSAGES'] = {
  leasePaymentStatus: {
    upcoming: 'À venir',
    due: 'Bientôt dû',
    overdue: 'En retard',
    paid: 'Payé',
  },
  rentPaymentStatus: {
    paid: 'Payé',
    pending: 'En attente',
    overdue: 'En retard',
    partial: 'Partiel',
  },
  maintenanceCategory: {
    plumbing: 'Plomberie',
    electrical: 'Électricité',
    appliances: 'Électroménager',
    heating: 'Chauffage',
    other: 'Autre',
  },
  maintenancePriority: {
    low: 'Priorité basse',
    medium: 'Priorité moyenne',
    high: 'Priorité haute',
    urgent: 'Urgent',
  },
  maintenanceStage: {
    reported: 'Signalée',
    acknowledged: 'Prise en compte',
    scheduled: 'Planifiée',
    resolved: 'Résolue',
  },
  documentStatus: { signed: 'Signé', pending: 'Signature en attente', expired: 'Expiré' },
  timelineState: { complete: 'Terminé', current: 'En cours', upcoming: 'À venir' },
  leasePeriod: 'Durée du bail',
  monthlyRent: 'Loyer mensuel',
  deposit: 'Dépôt de garantie',
  nextPayment: 'Prochain paiement',
  paidThisYear: 'Payé cette année',
  outstanding: 'Restant dû',
  noPayments: 'Aucun paiement pour le moment',
  columns: {
    month: 'Mois',
    dueDate: 'Échéance',
    method: 'Moyen',
    amount: 'Montant',
    status: 'Statut',
  },
  downloadReceipt: (month) => `Télécharger la quittance de ${month}`,
  dueOn: (date) => `Échéance le ${date}`,
  comments: (n) => plural('fr', n, { one: '{n} commentaire', other: '{n} commentaires' }),
  photo: (position, total) => `Photo ${position} sur ${total}`,
  photoWithAlt: (alt, position, total) => `${alt}, photo ${position} sur ${total}`,
  sign: 'Signer',
  signDocument: (name) => `Signer ${name}`,
  viewDocument: (name) => `Voir ${name}`,
  downloadDocument: (name) => `Télécharger ${name}`,
  noDocuments: 'Aucun document',
};

const DATA_TABLE_MESSAGES: Translations['DATA_TABLE_MESSAGES'] = {
  selectAll: 'Sélectionner toutes les lignes de cette page',
  selectRow: (id) => `Sélectionner la ligne ${id}`,
  densityLabel: 'Densité du tableau',
  density: { md: 'Normale', sm: 'Compacte' },
};

const ERROR_BOUNDARY_MESSAGES: Translations['ERROR_BOUNDARY_MESSAGES'] = {
  title: 'Un problème est survenu',
  message: 'Une erreur inattendue s’est produite',
  retry: 'Réessayer',
};

const AI_PROFILE_CARD_MESSAGES: Translations['AI_PROFILE_CARD_MESSAGES'] = {
  contributions: 'Contributions cette année',
  activity: 'Activité',
  periodGroup: (label) => `Période : ${label}`,
  periods: { weekly: 'Hebdomadaire', monthly: 'Mensuel', yearly: 'Annuel' },
};

const BREADCRUMB_MESSAGES: Translations['BREADCRUMB_MESSAGES'] = {
  breadcrumb: 'Fil d’Ariane',
};

const MESSAGE_MEDIA_MESSAGES: Translations['MESSAGE_MEDIA_MESSAGES'] = {
  photo: 'Photo',
  video: 'Vidéo',
  photoOf: (i, total) => `Photo ${i} sur ${total}`,
  videoOf: (i, total) => `Vidéo ${i} sur ${total}`,
  tapToView: 'Touchez pour afficher',
  sendingPhoto: 'Envoi de la photo',
  sendingVideo: 'Envoi de la vidéo',
  sendingAlbum: "Envoi de l'album",
  sendingSticker: 'Envoi du sticker',
  sendingGif: 'Envoi du GIF',
  album: (n) => `Album, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  sharedMedia: (n) => `Médias partagés, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  sharedFiles: (n) => `Fichiers partagés, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  moreItems: (n) => `+${n} autres`,
  notSent: 'Non envoyé',
  voiceMessage: (d) => `Message vocal, ${d}`,
  playVoiceMessage: 'Lire le message vocal',
  pauseVoiceMessage: 'Mettre en pause le message vocal',
  transcribe: 'Transcrire',
  hideTranscript: 'Masquer la transcription',
  seek: 'Position de lecture',
  seekPosition: (p, d) => `${p} sur ${d}`,
  playbackSpeed: (r) => `Vitesse de lecture, ${r}`,
  unplayed: 'Non écouté',
  download: 'Télécharger',
  downloaded: 'Téléchargé',
  file: 'Fichier',
  fileKinds: {
    pdf: 'PDF',
    doc: 'DOCUMENT',
    sheet: 'TABLEUR',
    slides: 'PRÉSENTATION',
    zip: 'ZIP',
    audio: 'AUDIO',
    video: 'VIDÉO',
    image: 'IMAGE',
    code: 'CODE',
  },
  contact: 'Contact',
  message: 'Message',
  add: 'Ajouter',
  location: 'Position',
  liveLocation: 'Position en temps réel',
  stopSharing: 'Arrêter le partage',
  vote: 'Voter',
  viewResults: 'Voir les résultats',
  anonymousVoting: 'Vote anonyme',
  quiz: 'Quiz',
  selectOne: 'Choisissez une réponse',
  selectOneOrMore: 'Choisissez une ou plusieurs réponses',
  correctAnswer: 'bonne réponse',
  yourAnswer: 'votre réponse',
  votes: (n) => (n === 0 ? 'Aucun vote' : plural('fr', n, { one: '{n} vote', other: '{n} votes' })),
  sticker: 'Sticker',
};

const PIPELINE_MESSAGES: Translations['PIPELINE_MESSAGES'] = {
  health: { 'on-track': 'En bonne voie', 'at-risk': 'À risque', stalled: 'Bloqué' },
  stalledFor: (duration) => `Bloqué depuis ${duration}`,
  move: (title) => `Déplacer ${title}`,
  stages: 'Étapes du pipeline',
  stageWithCount: (name, n) =>
    `${name}, ${plural('fr', n, { one: '{n} affaire', other: '{n} affaires' })}`,
  empty: 'Aucune affaire à cette étape',
  loadMore: 'Charger plus',
};

const STAY_SEARCH_MESSAGES: Translations['STAY_SEARCH_MESSAGES'] = {
  where: 'Où',
  checkIn: 'Arrivée',
  checkOut: 'Départ',
  when: 'Quand',
  who: 'Qui',
  destinationPlaceholder: 'Rechercher une destination',
  datesPlaceholder: 'Ajouter des dates',
  guestsPlaceholder: 'Ajouter des voyageurs',
  guests: { adults: 'Adultes', children: 'Enfants', infants: 'Bébés', pets: 'Animaux' },
  guestDescriptions: {
    adults: '13 ans et plus',
    children: 'De 2 à 12 ans',
    infants: 'Moins de 2 ans',
    pets: "Vous voyagez avec un animal d'assistance ?",
  },
  dateFlexibility: 'Flexibilité des dates',
  exactDates: 'Dates exactes',
  plusMinusDays: (n) => plural('fr', n, { one: '± {n} jour', other: '± {n} jours' }),
  destinations: 'Destinations',
  whereTo: 'Où allez-vous ?',
  filters: 'Filtres',
};

const AUTH_CARD_MESSAGES: Translations['AUTH_CARD_MESSAGES'] = {
  modes: {
    signin: {
      title: 'Bon retour parmi nous',
      description: 'Connectez-vous pour reprendre là où vous en étiez.',
      cta: 'Se connecter',
      switchLead: 'Nouveau ici ?',
      switchAction: 'Créer un compte',
    },
    signup: {
      title: 'Créez votre compte',
      description: 'Lancez-vous en quelques minutes.',
      cta: 'Créer un compte',
      switchLead: 'Vous avez déjà un compte ?',
      switchAction: 'Se connecter',
    },
    verify: {
      title: 'Consultez votre boîte de réception',
      description: 'Saisissez le code que nous vous avons envoyé pour terminer la connexion.',
      cta: 'Vérifier et continuer',
      switchLead: 'Code non reçu ?',
      switchAction: 'En envoyer un nouveau',
    },
  },
  codeSentTo: (email) => `Saisissez le code envoyé à ${email} pour terminer la connexion.`,
  verificationCode: 'Code de vérification',
  fullName: 'Nom complet',
  namePlaceholder: 'Marie Dupont',
  email: 'E-mail',
  emailPlaceholder: 'vous@entreprise.fr',
  emailHint: 'Nous l’utilisons pour vous contacter et ne le partageons jamais.',
  password: 'Mot de passe',
  passwordPlaceholder: 'Saisissez votre mot de passe',
  newPasswordPlaceholder: 'Au moins 8 caractères',
  confirmPassword: 'Confirmer le mot de passe',
  confirmPasswordPlaceholder: 'Répétez votre mot de passe',
  rememberMe: 'Se souvenir de moi',
  forgotPassword: 'Mot de passe oublié ?',
  terms:
    'En créant un compte, vous acceptez nos Conditions d’utilisation et notre Politique de confidentialité.',
  orContinueWith: 'ou continuer avec',
};

const TRACK_LIST_MESSAGES: Translations['TRACK_LIST_MESSAGES'] = {
  title: 'Titre',
  album: 'Album',
  dateAdded: "Date d'ajout",
  plays: 'Écoutes',
  duration: 'Durée',
  moveUp: 'Monter',
  moveDown: 'Descendre',
  reorder: 'Réorganiser',
  downloaded: 'Téléchargé',
  unavailable: 'Indisponible',
  tracks: 'Titres',
  episodes: 'Épisodes',
  selected: (n) => plural('fr', n, { one: '{n} sélectionné', other: '{n} sélectionnés' }),
  clearSelection: 'Effacer la sélection',
  played: 'Lu',
  listened: 'Écouté',
  saveEpisode: "Enregistrer l'épisode",
  downloadEpisode: "Télécharger l'épisode",
  minutes: (m) => `${m} min`,
  hours: (h) => `${h} h`,
  hoursMinutes: (h, m) => `${h} h ${m} min`,
  remaining: (l) => `Il reste ${l}`,
};

const LYRICS_MESSAGES: Translations['LYRICS_MESSAGES'] = {
  lyrics: 'Paroles',
  showLyrics: 'Afficher les paroles',
  backToCurrent: 'Revenir à la ligne en cours',
  empty: 'Les paroles de ce titre ne sont pas disponibles',
};

const ACTIVITY_FEED_MESSAGES: Translations['ACTIVITY_FEED_MESSAGES'] = {
  kinds: {
    call: 'Appel',
    email: 'E-mail',
    meeting: 'Réunion',
    note: 'Note',
    'stage-change': "Changement d'étape",
    task: 'Tâche terminée',
  },
  empty: 'Aucune activité enregistrée',
  loggedBy: (name) => `Enregistré par ${name}`,
  filterActivity: "Filtrer l'activité",
};

const PLACE_REVIEWS_MESSAGES: Translations['PLACE_REVIEWS_MESSAGES'] = {
  depositReturned: 'Caution restituée',
  depositNotReturned: 'Caution non restituée',
  recommend: 'Recommande',
  notRecommend: 'Ne recommande pas',
  helpful: 'Utile',
  report: 'Signaler',
  promptTitle: 'Vous avez habité ici ?',
  promptDescription: (building) =>
    `Aidez les futurs locataires de ${building}. Les avis sont anonymes.`,
  writeReview: 'Écrire un avis',
  reviewCount: (n) => plural('fr', n, { one: '{n} avis', other: '{n} avis' }),
  depositRate: (percent) => `Caution restituée dans ${percent} % des locations`,
  recommendRate: (percent) => `${percent} % recommanderaient d'y vivre`,
};

const DELIVERY_SLOT_MESSAGES: Translations['DELIVERY_SLOT_MESSAGES'] = {
  tiers: { standard: 'Standard', express: 'Express' },
  soldOut: 'Complet',
  asap: 'Dès que possible',
  field: 'Heure de livraison',
  day: 'Jour',
  emptyTitle: 'Plus aucun créneau',
  emptyDescription: 'Choisissez un autre jour ou le prochain coursier disponible.',
};

const PLACE_LIST_MESSAGES: Translations['PLACE_LIST_MESSAGES'] = {
  visibility: { private: 'Privée', shared: 'Partagée', public: 'Publique' },
  places: (n) => plural('fr', n, { one: '{n} lieu', other: '{n} lieux' }),
  sharedWith: (n) =>
    plural('fr', n, { one: 'Partagée avec {n} personne', other: 'Partagée avec {n} personnes' }),
  labels: {
    moveEarlier: (position) => `Déplacer en position ${position - 1}`,
    moveLater: (position) => `Déplacer en position ${position + 1}`,
    remove: (name) => `Retirer ${name} de la liste`,
    moved: (name, position, total) => `${name} déplacé en position ${position} sur ${total}`,
    note: 'Note',
  },
  savedPlaces: 'Lieux enregistrés',
};

const HOME_SEARCH_MESSAGES: Translations['HOME_SEARCH_MESSAGES'] = {
  modes: { rent: 'Louer', buy: 'Acheter', stays: 'Locations de vacances', swap: 'Échange' },
  searchMode: 'Mode de recherche',
  location: 'Lieu',
  locationPlaceholder: 'Rechercher une ville ou un quartier',
  moveIn: 'Emménagement',
  datePlaceholder: 'Ajouter une date',
  budget: 'Budget',
  budgetPlaceholder: 'Ajouter un budget',
  price: 'Prix',
  pricePlaceholder: 'Tous les prix',
  propertyType: 'Type de bien',
  propertyTypePlaceholder: 'Tous les types',
  dates: 'Dates',
  homeSize: 'Taille du logement',
  homeSizePlaceholder: 'Toutes les tailles',
  minimum: 'Minimum',
  maximum: 'Maximum',
  budgetPresets: 'Fourchettes de budget',
  monthlyBudget: 'Budget mensuel',
  monthlyBudgetDescription: 'Loyer mensuel, hors charges',
  totalPriceDescription: 'Prix total',
  upTo: (amount) => `Jusqu'à ${amount}`,
  any: 'Indifférent',
  moveInLabels: {
    date: "Date d'emménagement",
    flexible: 'Flexible',
    asap: 'Dès que possible',
    contractLength: 'Durée du bail',
  },
  contractLengths: {
    any: 'Indifférent',
    short: '1–6 mois',
    medium: '6–12 mois',
    long: "Plus d'1 an",
  },
  saveSearch: 'Enregistrer la recherche',
  saved: 'Enregistrée',
  newCount: (n) => plural('fr', n, { one: '{n} nouveau', other: '{n} nouveaux' }),
  alertsOff: 'Alertes désactivées',
  actionOn: (action, subject) => `${action} : ${subject}`,
};

const OFFERING_BADGE_MESSAGES: Translations['OFFERING_BADGE_MESSAGES'] = {
  offerings: {
    long_term_rent: 'À louer',
    sale: 'À vendre',
    short_term_rent: 'Location de vacances',
    exchange: 'Échange',
  },
};

const MAP_ATTRIBUTION_MESSAGES: Translations['MAP_ATTRIBUTION_MESSAGES'] = {
  scale: 'Échelle',
  mapData: 'Données cartographiques',
};

const SLIDER_MESSAGES: Translations['SLIDER_MESSAGES'] = {
  minimum: 'Valeur minimale',
  maximum: 'Valeur maximale',
  value: (n) => `Valeur ${n}`,
};

const SELECT_MESSAGES: Translations['SELECT_MESSAGES'] = {
  selectOption: 'Sélectionnez une option',
  scrollUp: 'Faire défiler vers le haut',
  scrollDown: 'Faire défiler vers le bas',
};

const ZOOMABLE_MEDIA_GALLERY_MESSAGES: Translations['ZOOMABLE_MEDIA_GALLERY_MESSAGES'] = {
  close: 'Fermer la visionneuse',
  previous: 'Élément précédent',
  next: 'Élément suivant',
  goTo: (i, n) => `Aller à l'élément ${i} sur ${n}`,
  share: 'Partager le média',
};

const NOTIFICATION_MESSAGES: Translations['NOTIFICATION_MESSAGES'] = {
  dismiss: 'Ignorer la notification',
};

const PHONE_INPUT_MESSAGES: Translations['PHONE_INPUT_MESSAGES'] = {
  phoneNumber: 'Numéro de téléphone',
  countryCode: 'Indicatif du pays',
};

const VENDOR_CARD_MESSAGES: Translations['VENDOR_CARD_MESSAGES'] = {
  facts: {
    deliveryTime: 'Délai de livraison',
    deliveryFee: 'Livraison',
    distance: 'Distance',
    minimumOrder: 'Commande minimum',
  },
  availability: { paused: 'En pause', closed: 'Fermé' },
  new: 'Nouveau',
  rated: (value, reviews) =>
    `Noté ${value} sur 5${vendorCard_has(reviews) ? `, ${vendorCard_counted('fr', reviews, { one: '{n} avis', other: '{n} avis' })}` : ''}`,
};

const CHAT_INDICATORS_MESSAGES: Translations['CHAT_INDICATORS_MESSAGES'] = {
  presence: { online: 'En ligne', idle: 'Absent', offline: 'Hors ligne', busy: 'Occupé' },
  status: {
    sending: 'Envoi…',
    sent: 'Envoyé',
    delivered: 'Distribué',
    read: 'Lu',
    failed: 'Non envoyé',
  },
  unread: 'Non lu',
  unreadCount: (n) => plural('fr', n, { one: '{n} message non lu', other: '{n} messages non lus' }),
};

const MEDIA_CONTROLS_MESSAGES: Translations['MEDIA_CONTROLS_MESSAGES'] = {
  play: 'Lire',
  pause: 'Pause',
  playSubject: (s) => `Lire ${s}`,
  pauseSubject: (s) => `Mettre en pause ${s}`,
  saveToLibrary: 'Enregistrer dans votre bibliothèque',
  saveSubjectToLibrary: (s) => `Enregistrer ${s} dans votre bibliothèque`,
  explicit: 'Explicite',
  seek: 'Position de lecture',
  seekValue: (a, b) => `${a} sur ${b}`,
  mute: 'Couper le son',
  unmute: 'Réactiver le son',
  volume: 'Volume',
  nowPlaying: 'En cours de lecture',
};

const INPUT_OTP_MESSAGES: Translations['INPUT_OTP_MESSAGES'] = {
  oneTimeCode: 'Code à usage unique',
  digitOf: (i, n) => `Chiffre ${i} sur ${n}`,
  characterOf: (i, n) => `Caractère ${i} sur ${n}`,
};

const PLACE_DETAILS_MESSAGES: Translations['PLACE_DETAILS_MESSAGES'] = {
  infoActions: { call: 'Appeler', open: 'Ouvrir le site web', directions: 'Itinéraire' },
  busy: {
    busier: "Plus fréquenté que d'habitude",
    typical: "Aussi fréquenté que d'habitude",
    quieter: "Moins fréquenté que d'habitude",
  },
  transitModes: {
    bus: 'Arrêt de bus',
    metro: 'Station de métro',
    train: 'Gare',
    tram: 'Arrêt de tram',
    ferry: 'Terminal de ferry',
  },
  notAvailable: 'Non disponible',
  amenities: 'Équipements',
  today: "Aujourd'hui",
  closed: 'Fermé',
  openingHours: "Horaires d'ouverture",
  day: 'Jour',
  noDataForDay: 'Aucune donnée pour ce jour',
  chartNoData: (day) => `${day}, aucune donnée`,
  chartClosed: (day) => `${day}, fermé toute la journée`,
  chartPeak: (day, hour) => `${day}, affluence maximale à ${hour}`,
  chartNow: (hour) => `maintenant ${hour}`,
  live: 'en temps réel',
  noDepartures: 'Aucun départ pour le moment',
  nearbyTransit: 'Transports à proximité',
  lines: 'Lignes',
  line: (name) => `Ligne ${name}`,
  towards: (headsign) => `vers ${headsign}`,
};

const APP_SHELL_MESSAGES: Translations['APP_SHELL_MESSAGES'] = {
  openNavigation: 'Ouvrir la navigation',
  closeNavigation: 'Fermer la navigation',
  resizePanes: 'Redimensionner les panneaux',
  notifications: 'Notifications',
  proOffer: 'Offre Pro',
};

const ROUTE_STOPS_MESSAGES: Translations['ROUTE_STOPS_MESSAGES'] = {
  routeStops: "Étapes de l'itinéraire",
  origin: 'Départ',
  destination: 'Destination',
  stop: (position) => `Étape ${position}`,
  swap: 'Inverser le départ et la destination',
  addStop: 'Ajouter une étape',
  removeStop: (title) => `Retirer ${title}`,
  state: { reached: 'Atteinte', current: 'Étape actuelle', pending: 'Non atteinte' },
};

const SEARCH_MESSAGES: Translations['SEARCH_MESSAGES'] = { clearQuery: 'Effacer la recherche' };

const TAG_FIELD_MESSAGES: Translations['TAG_FIELD_MESSAGES'] = {
  remove: (t) => `Retirer ${t}`,
  full: (n) => `${n} au maximum`,
  suggestions: 'Propositions',
};

const STAY_FILTERS_MESSAGES: Translations['STAY_FILTERS_MESSAGES'] = {
  propertyTypes: {
    apartment: 'Appartement',
    house: 'Maison',
    room: 'Chambre',
    studio: 'Studio',
    duplex: 'Duplex / Attique',
    coliving: 'Colocation',
    hostel: 'Auberge',
    other: 'Terrain / Autre',
  },
  features: {
    elevator: 'Ascenseur',
    parking: 'Stationnement',
    terrace: 'Terrasse',
    garden: 'Jardin',
    pool: 'Piscine',
    furnished: 'Meublé',
    pets: 'Animaux acceptés',
    airConditioning: 'Climatisation',
    heating: 'Chauffage',
    accessible: 'Accessible PMR',
    storage: 'Cellier',
  },
  floors: {
    ground: 'Rez-de-chaussée',
    middle: 'Étage intermédiaire',
    top: 'Dernier étage',
    elevator: 'Avec ascenseur',
  },
  minimum: 'Minimum',
  maximum: 'Maximum',
  priceRange: 'Fourchette de prix',
  area: 'Surface',
  featuresGroup: 'Équipements',
  floor: 'Étage',
  propertyType: 'Type de bien',
  energyRating: 'Classe énergétique',
  anyRating: 'Toutes les classes',
  ratingOnly: (r) => `${r} uniquement`,
  ratingAndBetter: (r) => `${r} ou mieux`,
  filters: 'Filtres',
  filtersApplied: (label, n) =>
    `${label}, ${plural('fr', n, { one: '{n} appliqué', other: '{n} appliqués' })}`,
  clearAll: 'Tout effacer',
  any: 'Indifférent',
  availableNow: 'Disponible maintenant',
  availableNowDescription: "Prêt à emménager aujourd'hui",
  availableFrom: 'Disponible à partir du',
  anyDate: "N'importe quelle date",
};

const SETTINGS_MODAL_MESSAGES: Translations['SETTINGS_MODAL_MESSAGES'] = {
  dialog: 'Paramètres',
  nav: 'Sections des paramètres',
  close: 'Fermer les paramètres',
  saved: 'Enregistré',
  currentPlan: 'Forfait actuel',
  actions: 'Actions',
  storage: {
    storedIn: 'Stocké dans',
    fileCount: (n, shown) =>
      plural('fr', n, { one: `${shown} fichier`, other: `${shown} fichiers` }),
    filterByType: 'Filtrer par type de fichier',
    fileType: 'Type de fichier',
    orderBy: 'Trier par',
    modified: 'Modifiés',
    oldestFirst: 'Plus anciens d’abord',
    searchFiles: 'Rechercher des fichiers',
    selectAllOnPage: 'Sélectionner tous les fichiers de cette page',
    fileName: 'Nom du fichier',
    uploadedOn: 'Date d’import',
    fileSize: 'Taille du fichier',
    sortBy: {
      name: 'Trier par nom du fichier',
      uploadedAt: 'Trier par date d’import',
      size: 'Trier par taille du fichier',
    },
    selectFile: (name) => `Sélectionner ${name}`,
    deleteFile: 'Supprimer le fichier',
    deleteNamed: (name) => `Supprimer ${name}`,
    noMatches: 'Aucun fichier ne correspond à vos filtres.',
    documents: 'Documents',
    spreadsheets: 'Feuilles de calcul',
    videos: 'Vidéos',
    downloadFile: 'Télécharger le fichier',
    rename: 'Renommer',
    copyLink: 'Copier le lien',
  },
  tools: {
    showOutput: 'Afficher la sortie',
    refreshTools: 'Actualiser les outils',
    removeServer: 'Retirer le serveur',
    logout: 'Déconnexion',
    logOutOf: (server) => `Se déconnecter de ${server}`,
    showTools: (server) => `Afficher les outils de ${server}`,
    hideTools: (server) => `Masquer les outils de ${server}`,
    error: 'Erreur',
    showOutputLink: 'Afficher la sortie',
    showOutputOf: (server) => `Afficher la sortie de ${server}`,
    newServer: 'Nouveau serveur MCP',
    newServerDescription: 'Ajouter un serveur MCP personnalisé',
    projectScope: 'Portée du projet',
    authentication: 'Authentification',
    waitForAuth: 'Attendre l’authentification MCP',
    waitForAuthDescription:
      'Attendre sans limite de temps l’authentification lorsqu’elle est demandée. Désactivé, les demandes d’authentification sont ignorées après 30 secondes.',
    waitForAuthSwitch: 'Attendre l’authentification MCP',
    scopeServers: (scope) => `Serveurs MCP de ${scope}`,
    scopeServersDescription: (scope) => `Serveurs disponibles dans ${scope}.`,
    teamServers: 'Serveurs MCP de l’équipe',
    teamServersDescription: 'Configurés dans le tableau de bord',
    manage: 'Gérer',
    noTeamServers: 'Aucun serveur MCP d’équipe',
    noTeamServersBody:
      'Configurez des serveurs MCP dans le tableau de bord pour les rendre disponibles sur ordinateur et dans le cloud.',
    configureTeam: 'Configurer les serveurs MCP de l’équipe',
    pluginServers: 'Serveurs MCP des plugins',
  },
};

const EVICTION_MESSAGES: Translations['EVICTION_MESSAGES'] = {
  status: {
    scheduled: 'Programmée',
    postponed: 'Reportée',
    suspended: 'Suspendue',
    executed: 'Exécutée',
    cancelled: 'Annulée',
  },
  attend: 'Je serai là',
  share: 'Partager',
  contactSupport: 'Contacter le groupe de soutien',
  verified: 'Vérifié par la communauté',
  caseHistory: 'Historique du dossier',
  source: (source) => `Source : ${source}`,
};

const BOOKING_MESSAGES: Translations['BOOKING_MESSAGES'] = {
  checkIn: 'Arrivée',
  checkOut: 'Départ',
  guests: 'Voyageurs',
  addDate: 'Ajouter une date',
  reserve: 'Réserver',
  checkAvailability: 'Vérifier la disponibilité',
  notChargedYet: 'Aucun montant ne vous sera débité pour le moment',
  total: 'Total',
  tripStatus: {
    confirmed: 'Confirmé',
    pending: 'En attente',
    cancelled: 'Annulé',
    completed: 'Terminé',
  },
  priceName: booking_priceName(
    (p, u) => `${p} par ${u}`,
    (s, o) => `${s}, au lieu de ${o}`,
  ),
};

const AGENT_LIMITS_CARD_MESSAGES: Translations['AGENT_LIMITS_CARD_MESSAGES'] = {
  contextWindow: 'Fenêtre de contexte',
  freeSpace: 'Espace libre',
  planUsageLimits: 'Limites d’utilisation de l’abonnement',
  managePlan: 'Gérer l’abonnement',
};

const SWIPE_ROW_MESSAGES: Translations['SWIPE_ROW_MESSAGES'] = {
  closeActions: 'Fermer les actions',
};

const PATIENT_INFO_CARD_MESSAGES: Translations['PATIENT_INFO_CARD_MESSAGES'] = {
  addPhoto: 'Ajouter une photo de profil',
};

const THEME_TOGGLE_MESSAGES: Translations['THEME_TOGGLE_MESSAGES'] = {
  theme: 'Thème',
  darkMode: 'Mode sombre',
  lightMode: 'Mode clair',
  useDarkMode: 'Utiliser le mode sombre',
  useLightMode: 'Utiliser le mode clair',
};

const EARNINGS_MESSAGES: Translations['EARNINGS_MESSAGES'] = {
  earned: 'Gagné',
  period: 'Période de revenus',
  breakdown: "D'où ça vient",
  payout: 'Prochain versement',
  payoutState: {
    scheduled: 'Programmé',
    processing: 'En route',
    paid: 'Versé',
    held: 'En attente',
    failed: 'Échec',
  },
  chart: (label) => `Revenus ${label}, par période`,
  empty: "Rien de gagné pour l'instant",
  earnings: 'Revenus',
};

const PROOF_OF_DELIVERY_MESSAGES: Translations['PROOF_OF_DELIVERY_MESSAGES'] = {
  labels: {
    signature: 'Signature',
    signaturePad: 'Zone de signature',
    signatureHint: 'Signez avec le doigt',
    signed: 'Signé',
    clear: 'Effacer la signature',
    typeName: 'Ou saisissez votre nom',
    typeNamePlaceholder: 'Nom complet',
    photo: 'Photo',
    photoHint: 'Là où vous l’avez laissé, ou le colis avec le destinataire.',
    code: 'Code de livraison',
    codeHint: 'Demandez au destinataire de lire le code dans son appli.',
    recipient: 'Qui l’a reçu',
    recipientPlaceholder: 'Nom',
    note: 'Note',
    notePlaceholder: 'Tout ce qui mérite d’être noté',
    submit: 'Confirmer la livraison',
    required: 'Obligatoire',
    missing: 'Requis avant de pouvoir confirmer.',
    missingSummary: (n) =>
      plural('fr', n, {
        one: 'Il manque encore {n} élément',
        other: 'Il manque encore {n} éléments',
      }),
  },
  proofOfDelivery: 'Preuve de livraison',
};

const FILE_UPLOAD_MESSAGES: Translations['FILE_UPLOAD_MESSAGES'] = {
  promptWeb: 'Glissez-déposez pour importer ou',
  promptNative: 'Touchez pour',
  selectWeb: 'parcourir',
  selectNative: 'choisir un fichier',
  uploading: (size) => `Importation de ${size}...`,
  uploaded: 'Importation réussie !',
  unsupported: (extensions) => `Seuls les fichiers ${extensions} sont acceptés`,
  tooLarge: (max) => `Ce fichier dépasse ${max}`,
  max: (size) => `(max. ${size})`,
  uploadFile: 'Importer un fichier',
};

const POPOVER_MESSAGES: Translations['POPOVER_MESSAGES'] = {
  popover: 'Fenêtre contextuelle',
};

const QUEUE_PANEL_MESSAGES: Translations['QUEUE_PANEL_MESSAGES'] = {
  queueTab: "File d'attente",
  recentTab: 'Écoutés récemment',
  close: "Fermer la file d'attente",
  nextInQueue: "À suivre dans la file d'attente",
  nextFrom: (c) => `À suivre depuis : ${c}`,
  nextUp: 'À suivre',
  clearQueue: "Vider la file d'attente",
  reorder: (t) => `Réorganiser ${t}`,
  reorderHint: 'Faites glisser ou utilisez les touches fléchées',
  moveUp: 'Monter',
  moveDown: 'Descendre',
  remove: "Retirer de la file d'attente",
  moved: (t, p, n) => `${t} déplacé en position ${p} sur ${n}`,
  emptyQueue: "Votre file d'attente est vide",
  emptyQueueHint: 'Ajoutez des titres et des épisodes pour les écouter ensuite.',
  emptyRecent: "Rien n'a encore été écouté",
};

const HOVER_CARD_MESSAGES: Translations['HOVER_CARD_MESSAGES'] = {
  hoverCard: 'Carte d’aperçu',
};

const NOTE_EDITOR_MESSAGES: Translations['NOTE_EDITOR_MESSAGES'] = {
  header: {
    saved: 'Enregistré',
    saving: 'Enregistrement…',
    offline: 'Hors ligne — modifications conservées',
    error: 'Non enregistré',
    words: (n) => plural('fr', n, { one: '{n} mot', other: '{n} mots' }),
    title: 'Titre',
  },
  untitled: 'Sans titre',
  note: 'Note',
  toolbar: { more: 'Plus de mise en forme', moreMenu: 'Plus de mise en forme' },
};

const MEDIA_SHELF_MESSAGES: Translations['MEDIA_SHELF_MESSAGES'] = {
  filters: 'Filtres',
  showAll: 'Tout afficher',
};

const CATEGORY_BAR_MESSAGES: Translations['CATEGORY_BAR_MESSAGES'] = {
  previous: 'Catégories précédentes',
  next: 'Catégories suivantes',
};

const CARRIER_QUOTE_MESSAGES: Translations['CARRIER_QUOTE_MESSAGES'] = {
  labels: {
    accept: 'Accepter',
    message: 'Message',
    decline: 'Refuser',
    pickup: 'Enlèvement',
    eta: 'Arrivée',
    vehicle: 'Véhicule',
    jobs: (jobs) => `${jobs} missions`,
    verified: 'Transporteur vérifié',
    marks: { cheapest: 'Le moins cher', fastest: 'Le plus rapide' },
    showPrice: 'Afficher le détail du prix',
    hidePrice: 'Masquer le détail du prix',
    priceDetails: 'Détail du prix pour',
    sort: 'Trier les offres',
    sortOptions: { price: 'Les moins chères', eta: 'Les plus rapides', rating: 'Les mieux notées' },
    count: (n) => plural('fr', n, { one: '{n} offre', other: '{n} offres' }),
    loading: 'Chargement des offres',
  },
  emptyTitle: "Pas encore d'offres",
  emptyDescription:
    'Les transporteurs examinent votre demande. Les premières offres arrivent généralement en quelques minutes.',
  list: 'Offres',
  priceDetailsFor: (name) => `Détail du prix pour ${name}`,
};

const TEXT_FIELD_MESSAGES: Translations['TEXT_FIELD_MESSAGES'] = {
  showPassword: 'Afficher le mot de passe',
  hidePassword: 'Masquer le mot de passe',
  required: 'obligatoire',
};

const CHAT_SCREEN_MESSAGES: Translations['CHAT_SCREEN_MESSAGES'] = {
  call: 'Appeler',
  videoCall: 'Appel vidéo',
  searchInConversation: 'Rechercher dans la conversation',
  connecting: 'Connexion…',
  verified: 'Vérifié',
  bot: 'Bot',
  channel: 'Chaîne',
  clearSelection: 'Effacer la sélection',
  forward: 'Transférer',
  pin: 'Épingler',
  selectedCount: (n) => plural('fr', n, { one: '{n} sélectionné', other: '{n} sélectionnés' }),
  pinnedList: 'Afficher les messages épinglés',
  pinnedClose: 'Masquer la barre des messages épinglés',
  pinnedUnpin: 'Désépingler ce message',
  pinnedMessage: 'Message épinglé',
  pinnedMessageNumber: (n) => `Message épinglé nº ${n}`,
  scrollToBottom: 'Aller aux derniers messages',
  jumpToMention: 'Aller à la mention',
  emptyTitle: 'Aucun message pour le moment',
  info: 'Infos',
  members: 'Membres',
  addMember: 'Ajouter des membres',
  memberSearch: 'Rechercher des membres',
  noMembers: 'Aucun membre trouvé',
  owner: 'Propriétaire',
  admin: 'Administrateur',
  resizeList: 'Redimensionner la liste des conversations',
};

const CONTEXT_MENU_MESSAGES: Translations['CONTEXT_MENU_MESSAGES'] = {
  contextMenu: 'Menu contextuel',
};

const SORTABLE_MEDIA_MESSAGES: Translations['SORTABLE_MEDIA_MESSAGES'] = {
  photo: (p, t) => `Photo ${p} sur ${t}`,
  cover: 'Couverture',
  moveEarlier: (p) => `Déplacer la photo ${p} vers l'avant`,
  moveLater: (p) => `Déplacer la photo ${p} vers l'arrière`,
  remove: (p) => `Retirer la photo ${p}`,
  retry: (p) => `Réessayer l'envoi de la photo ${p}`,
  uploading: (p) => `Envoi de la photo ${p}`,
  failed: "Échec de l'envoi",
  add: 'Ajouter des photos',
  moved: (p, t) => `Déplacée en position ${p} sur ${t}`,
  photos: 'Photos',
};

const CONNECTION_DOTS_MESSAGES: Translations['CONNECTION_DOTS_MESSAGES'] = {
  connecting: 'Connexion en cours',
};

const CHAT_PEOPLE_MESSAGES: Translations['CHAT_PEOPLE_MESSAGES'] = {
  newGroup: {
    photo: 'Choisir une photo de groupe',
    name: 'Nom du groupe',
    namePlaceholder: 'Nommez ce groupe',
    description: 'Description',
    descriptionPlaceholder: 'À quoi sert ce groupe ?',
    members: (n) => plural('fr', n, { one: '{n} membre', other: '{n} membres' }),
    addMembers: 'Ajouter des membres',
    remove: (name) => `Retirer ${name}`,
  },
  member: {
    owner: 'Propriétaire',
    admin: 'Administrateur',
    promote: 'Nommer administrateur',
    restrict: 'Restreindre',
    remove: 'Retirer du groupe',
    actions: (name) => `Actions pour ${name}`,
  },
  story: {
    close: 'Fermer la story',
    previous: 'Story précédente',
    next: 'Story suivante',
    mute: 'Couper le son de la story',
    unmute: 'Réactiver le son de la story',
    more: 'Options de la story',
    replyPlaceholder: 'Répondre…',
    send: 'Envoyer la réponse',
    progress: (index, count) => `Story ${index + 1} sur ${count}`,
    react: (emoji) => `Réagir avec ${emoji}`,
  },
  searchMembers: 'Rechercher des membres',
  share: 'Partager',
  postOptions: 'Options de la publication',
  pinned: 'Épinglé',
  views: (c) => plural('fr', c, { one: `${c} vue`, other: `${c} vues` }),
  forwards: (c) => plural('fr', c, { one: `${c} transfert`, other: `${c} transferts` }),
  jumpTo: (letter) => `Aller à ${letter}`,
  add: 'Ajouter',
  added: 'Ajouté',
  actionOn: (action, name) => `${action} : ${name}`,
};

const MULTI_AGENT_CHAT_MESSAGES: Translations['MULTI_AGENT_CHAT_MESSAGES'] = {
  pickerAction: (editing: boolean, count: number) =>
    editing
      ? 'Enregistrer les modifications'
      : 'Démarrer le chat' +
        (count ? ' · ' + plural('fr', count, { one: '{n} agent', other: '{n} agents' }) : ''),
  you: 'Vous',
  responseFailed: '{0} n’a pas pu répondre. Veuillez réessayer.',
  editAgentTitle: 'Modifier l’agent',
  aLittleHelp: 'Un peu d’aide',
  aFewMindsOneConversation: 'Quelques esprits. Une conversation.',
  aLittleRoomForSomethingNew: 'Un peu de place pour quelque chose de nouveau',
  accountDetails: 'Détails du compte',
  add: 'Ajouter',
  add2: 'Ajouter {0}',
  added: 'Ajouté',
  addedToYourWorkspace: 'Ajouté à votre espace de travail',
  agent: 'Agent immobilier',
  agentConversation: "Conversation avec l'agent",
  appearance: 'Apparence',
  apps: 'Applications · {0}',
  availability: 'Disponibilité',
  backToMarketplace: 'Retour au marché',
  billing: 'Facturation',
  bitbucket: 'Bitbucket',
  bloom: 'Bloom',
  bots: 'Bots',
  bringYourAgentsIntoOneChat: 'Rassemblez vos agents dans une seule conversation.',
  category: 'Catégorie',
  chatActions: 'Actions de discussion',
  chatList: 'Liste de discussion',
  chatName: 'Nom du chat',
  chatRemoved: 'Chat supprimé',
  chatWithYourAgents: 'Discutez avec vos agents',
  chooseAnAgentOrCreateYourOwn:
    'Choisissez un agent ou créez le vôtre pour démarrer une conversation.',
  chooseWhoSJoiningTheConversation: 'Choisissez qui rejoint la conversation.',
  chooseYourTeammates: 'Choisissez vos coéquipiers',
  closeMarketplace: 'Fermer le marché',
  closeSearch: 'Fermer la recherche',
  company: 'Entreprise',
  companyDetails: "Détails de l'entreprise",
  completionSound: "Son d'achèvement",
  connectedAccount: 'Compte connecté',
  connector: 'Connecteur',
  conversationIDCopied: 'ID de conversation copié',
  conversationCopied: 'Conversation copiée',
  conversationOptions: 'Options de conversation',
  conversations: 'Conversations',
  copied: 'Copié',
  copyConversation: 'Copier la conversation',
  copyConversationID: "Copier l'ID de la conversation",
  copyResponse: 'Copier la réponse',
  couldnTCopyPleaseTryAgain: 'Impossible de copier. Veuillez réessayer.',
  create: 'Créer',
  createANewBot: 'Créer un nouveau bot',
  createBotOrChat: 'Créer un bot ou un chat',
  criticalRequests: 'Demandes critiques',
  customize: 'Personnaliser',
  customizeANewTeammate: 'Personnalisez un nouveau coéquipier.',
  dateOfBirth: 'Date de naissance',
  demoIntegrationAddingSavesItToThis:
    "Intégration de démonstration. L'ajout l'enregistre dans ce navigateur ; aucun compte externe n'est connecté.",
  desktopApp: 'Application de bureau',
  details: 'Détails',
  developer: 'Développeur',
  deviceID: "ID de l'appareil",
  discover: 'Découvrir',
  dispatchAlerts: 'Alertes de répartition',
  editConversationAgents: 'Modifier les agents de conversation',
  editBot: 'Modifier le bot',
  editGroup: 'Modifier le groupe',
  editAgent: 'Modifier {0}',
  email: 'E-mail',
  everydayEssentials: 'Les essentiels du quotidien',
  exploreMarketplace: 'Explorer le marché',
  explorePlugins: 'Explorer les plugins',
  explorePluginsAndBotsToBuildYour:
    'Explorez les plugins et les robots pour constituer votre équipe.',
  findYourNextTeammate: 'Trouvez votre prochain coéquipier',
  findYourNextToolOrTeammate: 'Trouvez votre prochain outil ou coéquipier',
  firstName: 'Prénom',
  folders: 'Dossiers',
  general: 'Général',
  getNotifiedWhenTheModeNeedsTo: 'Soyez averti lorsque le mode doit prendre une décision critique',
  git: 'Git',
  github: 'GitHub',
  gitlab: 'GitLab',
  helpfulResponse: 'Réponse utile',
  inTheBrowser: 'Dans le navigateur',
  inThisConversation: 'Dans cette conversation',
  includes: 'Comprend',
  insideTheApp: "Dans l'application",
  installed: 'Installé',
  integrations: 'Intégrations',
  iLlApproachThisFromThePerspective: 'Je vais aborder cela du point de vue de {0}.',
  lastName: 'Nom de famille',
  limits: 'Limites',
  logOutFromAllDevices: 'Se déconnecter de tous les appareils',
  logout: 'Déconnexion',
  manage: 'Gérer',
  manageLimits: 'Gérer les limites',
  marketplace: 'Marché',
  marketplaceLinkCopied: 'Lien Marketplace copié',
  marketplaceListings: 'Annonces sur le marché',
  meetYourNextTeammate: 'Rencontrez votre prochain coéquipier',
  messages: 'Messages',
  noConversationsFound: 'Aucune conversation trouvée.',
  noMatchesYet: "Aucun résultat pour l'instant",
  notifications: 'Notifications',
  openConversations: 'Conversations ouvertes',
  openPullRequestLinksInsideYourApp:
    "Ouvrir les liens de demande d'extraction dans votre application",
  openTheMarketplaceToExplorePluginsAnd:
    'Ouvrez le Marketplace pour explorer les plugins et les robots. Utilisez le menu d’une conversation pour modifier l’apparence et les détails de son bot. Choisissez une expression dans la roue des émotions. Faites défiler ou faites glisser l’arc de la forme, ou utilisez ses touches fléchées pour explorer les formes.',
  prDestination: 'Destination PR',
  people: 'Personnes',
  personal: 'Personnel',
  pinChat: 'Épingler le chat',
  pinnedChat: 'Discussion épinglée',
  plugins: 'Plug-ins',
  profile: 'Profil',
  public: 'Publique',
  publicProfile: 'Profil public',
  pullRequests: "Demandes d'extraction",
  pushNotificationOnYourPhoneWhenThe:
    "Notification push sur votre téléphone lorsque l'application vous envoie un message",
  remove: 'Retirer',
  removeChat: 'Supprimer le chat',
  renameChat: 'Renommer la discussion',
  responseCopied: 'Réponse copiée',
  reviewProvider: "Fournisseur d'avis",
  rulesAndWorkflows: 'Règles et flux de travail',
  saveName: 'Enregistrer le nom',
  sayHelloTo: 'Dites bonjour à {0}',
  searchConversations: 'Rechercher des conversations',
  searchConversations2: 'Rechercher des conversations…',
  searchMarketplace: 'Marché de recherche',
  selectGithubOrOtherProvidersForReviews:
    "Sélectionnez Github ou d'autres fournisseurs pour les avis",
  selectedAgents: 'Agents sélectionnés : {0}',
  sendWithEnterUseShiftEnterFor:
    'Envoyer avec Entrée. Utilisez Shift + Enter pour une nouvelle ligne. Vos modifications restent dans ce navigateur.',
  settings: 'Paramètres',
  share: 'Partager',
  showFundamentalNotificationsWhenAnAgentCompletes:
    "Afficher les notifications fondamentales lorsqu'un agent termine une tâche",
  signOut: 'Se déconnecter',
  skills: 'Compétences',
  skills2: 'Compétences · {0}',
  soundEffectATaskIsCompleted: 'Effet sonore, une tâche est terminée',
  startAConversation: 'Démarrer une conversation',
  startAGroupChat: 'Démarrer une discussion de groupe',
  startChat: 'Démarrer le chat',
  storage: 'Stockage',
  support: 'Assistance',
  systemNotifications: 'Notifications système',
  thinkingTogether: 'Penser ensemble…',
  thinking: 'En pensant…',
  today: "Aujourd'hui",
  tools: 'Outils',
  toolsForYourWorkflow: 'Outils pour votre flux de travail',
  tryAnotherNameCategoryOrKeyword: 'Essayez un autre nom, catégorie ou mot-clé.',
  ultra149Mo: 'Ultra 149 $/mois',
  unhelpfulResponse: 'Réponse inutile',
  unpinChat: 'Désépingler le chat',
  upgradeToMax: 'Passer à Max',
  useToCreateABotOrStart:
    'Utilisez + pour créer un bot ou démarrer une conversation avec plusieurs agents.',
  viewAdded: 'Voir ajouté {0}',
  viewAll: 'Tout voir',
  viewTeamProfile: "Voir le profil de l'équipe",
  viewItem: 'Voir {0}',
  website: 'Site web',
  whenEnabledYourProfilePageWillBe:
    "Lorsqu'elle est activée, votre page de profil sera visible par tout le monde",
  youAreOn7xMoreUsageThan: 'Vous utilisez 7 fois plus que Premium',
  youAreOn7xMoreUsageThan2: 'Vous utilisez 7 fois plus que Regular.',
  areHereSendAMessageToGet:
    '{0} sont ici. Envoyez un message pour obtenir le point de vue de chacun.',
  itemDetails: '{0} détails',
  agentThinking: '{0} réfléchit',
  by: '{0} · avant {1}',
  results: (count: number) => plural('fr', count, { one: '{n} résultat', other: '{n} résultats' }),
  includedSkills: (apps: number, skills: number) =>
    (apps ? plural('fr', apps, { one: '{n} application', other: '{n} applications' }) + ', ' : '') +
    plural('fr', skills, { one: '{n} compétence', other: '{n} compétences' }),
};

const translations: Translations = {
  MULTI_AGENT_CHAT_MESSAGES,
  PROJECT_BOARD_MESSAGES: {
    defaultTitle: 'Tâches de design Bloom',
    defaultTeam: 'Équipe Bloom',
    openTicket: (code, title) => `Ouvrir ${code}: ${title}`,
    addTicketTo: (column) => `Ajouter un ticket à ${column}`,
    board: 'Tableau du projet',
    controls: 'Commandes du tableau',
    navigation: 'Ouvrir la navigation',
    inbox: 'Ouvrir la boîte du projet',
    newTicket: 'Nouveau ticket',
    columns: 'Colonnes du tableau du projet',
    sortTickets: 'Trier les tickets',
    filterTickets: 'Filtrer les tickets',
    displayOptions: 'Options d’affichage',
    sort: 'Trier',
    filter: 'Filtrer',
    display: 'Affichage',
    manualOrder: 'Ordre manuel',
    priority: 'Priorité',
    title: 'Titre',
    project: 'Projet',
    allPriorities: 'Toutes les priorités',
    allProjects: 'Tous les projets',
    clearFilters: 'Effacer les filtres',
    showDone: 'Afficher la colonne terminée',
    fillScreens: 'Remplir les écrans larges',
    createTicket: 'Créer un ticket',
    closeCreate: 'Fermer la création du ticket',
    ticketTitle: 'Titre du ticket',
    enterTitle: 'Saisissez le titre du ticket',
    description: 'Description',
    descriptionArea: 'Zone de description',
    status: 'État',
    urgency: 'Urgence',
    assignee: 'Responsable',
    unassigned: 'Non attribué',
    keepCreating: 'Continuer à créer',
    cancel: 'Annuler',
    addTicket: 'Ajouter un ticket',
    sortTitle: 'Trier par titre',
    noTickets: 'Aucun problème ici',
    favoriteAdd: 'Ajouter aux favoris',
    favoriteRemove: 'Retirer des favoris',
    copyLink: 'Copier le lien du ticket',
    actions: 'Actions du ticket',
    editDescription: 'Modifier la description',
    copyId: 'Copier l’ID du ticket',
    reopen: 'Rouvrir le ticket',
    markDone: 'Marquer comme terminé',
    closeDetails: 'Fermer les détails du ticket',
    linkCopied: 'Lien du ticket copié',
    idCopied: 'ID du ticket copié',
    copyFailed: 'Impossible de copier. Réessayez.',
    createdBy: 'Créé par',
    saveDescription: 'Enregistrer la description',
    ticketDescription: 'Description du ticket',
    properties: 'Propriétés',
    editAssignees: 'Modifier les responsables',
    resources: 'Ressources',
    tokens: 'Jetons consommés',
    comments: 'Commentaires',
    you: 'Vous',
    justNow: 'À l’instant',
    addComment: 'Ajouter un commentaire',
    enterComment: 'Saisissez votre commentaire',
    postComment: 'Publier le commentaire',
    moveUp: 'Déplacer vers le haut',
    moveDown: 'Déplacer vers le bas',
    nextColumn: 'Déplacer vers la colonne suivante',
    previousColumn: 'Déplacer vers la colonne précédente',
    keyboardHint:
      'Entrée ouvre. Espace saisit, les flèches déplacent, Espace dépose et Échap annule.',
  },

  AGENT_CREATOR_MESSAGES,
  AGENT_AVATAR_MESSAGES: { label: 'Avatar de l’agent', unavailable: 'Avatar indisponible' },
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
