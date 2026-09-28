// Bloom's hi strings for every family. Loaded on demand by
// `loadBloomLanguage` (src/locale/translations.ts), the ONLY importer of this
// module, so a bundler gives each language one chunk of its own.
import type { Translations } from './types';
import { priceName as booking_priceName } from '../../booking/message-helpers';
import { compactDuration as calendar_compactDuration } from '../../calendar/message-helpers';
import { corner as callUi_corner } from '../../call-ui/message-helpers';
import { plural } from '../plural';
import { countOf as mapMarker_countOf } from '../../map-marker/message-helpers';
import { words as navigationBanner_words } from '../../navigation-banner/message-helpers';
import { withReviews as placeCard_withReviews, countOf as placeCard_countOf } from '../../place-card/message-helpers';
import { countForms as rating_countForms } from '../../rating/message-helpers';
import { shapeNames as shapes_shapeNames } from '../../shapes/message-helpers';
import { has as vendorCard_has, counted as vendorCard_counted } from '../../vendor-card/message-helpers';

const CALL_UI_MESSAGES__CORNERS = { 'top-left': 'ऊपर बाएं', 'top-right': 'ऊपर दाएं', 'bottom-left': 'नीचे बाएं', 'bottom-right': 'नीचे दाएं' };

const COMMON_MESSAGES: Translations['COMMON_MESSAGES'] = {
  close: 'बंद करें',
  dismiss: 'ख़ारिज करें',
  back: 'वापस',
  goBack: 'वापस जाएं',
  loading: 'लोड हो रहा है',
  more: 'और',
  moreOptions: 'और विकल्प',
  moreActions: 'और कार्रवाइयां',
  progress: 'प्रगति',
  stepOf: (step, total) => `चरण ${step} / ${total}`,
  labelFor: (label, subject) => `${subject} के लिए ${label}`,
  tapToClose: 'बंद करने के लिए टैप करें',
  cancel: 'रद्द करें',
  done: 'हो गया',
  save: 'सहेजें',
  delete: 'हटाएं',
  edit: 'संपादित करें',
  remove: 'निकालें',
  retry: 'फिर से कोशिश करें',
  search: 'खोजें',
  showMore: 'और दिखाएं',
  showLess: 'कम दिखाएं',
  next: 'अगला',
  previous: 'पिछला',
  open: 'खोलें',
  menu: 'मेन्यू',
  copy: 'कॉपी करें',
  copied: 'कॉपी हो गया',
  send: 'भेजें',
  clear: 'साफ़ करें',
  seeAll: 'सभी देखें',
  resizePanels: 'पैनल का आकार बदलें',
};

const SURFACES_MESSAGES: Translations['SURFACES_MESSAGES'] = { confirm: 'पुष्टि करें', ok: 'ठीक है' };

const CONTACT_CARD_MESSAGES: Translations['CONTACT_CARD_MESSAGES'] = {
  channels: {
    email: { action: 'ईमेल', name: (s) => `${s} को ईमेल करें` },
    phone: { action: 'कॉल', name: (s) => `${s} को कॉल करें` },
    chat: { action: 'संदेश', name: (s) => `${s} को संदेश भेजें` },
    meeting: { action: 'मीटिंग', name: (s) => `${s} के साथ मीटिंग शेड्यूल करें` },
    video: { action: 'वीडियो', name: (s) => `${s} के साथ वीडियो कॉल शुरू करें` },
    website: { action: 'वेबसाइट', name: (s) => `${s} की वेबसाइट खोलें` },
  },
  labelsFor: (name) => `${name} के लेबल`,
  owner: 'स्वामी',
};

const CHAT_LIST_MESSAGES: Translations['CHAT_LIST_MESSAGES'] = {
  item: { draft: 'ड्राफ़्ट:', pinned: 'पिन किया गया', muted: 'म्यूट किया गया', verified: 'सत्यापित', channel: 'चैनल', bot: 'बॉट', group: 'समूह' },
  search: { chat: 'चैट', message: 'संदेश', contact: 'संपर्क', empty: 'कोई परिणाम नहीं' },
  list: 'चैट',
  emptyTitle: 'अभी तक कोई बातचीत नहीं',
  emptyDescription: 'चैट शुरू करें, वह यहां दिखेगी।',
  searchResults: 'खोज परिणाम',
  searchChats: 'चैट खोजें',
  clearSearch: 'खोज साफ़ करें',
  newChat: 'नई चैट',
  archived: 'संग्रहीत',
  archivedName: (label, n) => `${label}, ${n} चैट`,
  folderName: (label, n) => `${label}, ${n} अपठित`,
  stories: 'स्टोरीज़',
  ownStory: 'आपकी स्टोरी',
  addStory: 'अपनी स्टोरी में जोड़ें',
  storyOf: (name) => `${name} की स्टोरी`,
};

const NOTE_CARD_MESSAGES: Translations['NOTE_CARD_MESSAGES'] = {
  pinned: 'पिन की गई',
  locked: 'सुरक्षित',
  attachments: (n) => plural('hi', n, { other: '{n} अटैचमेंट' }),
  select: 'नोट चुनें',
  checklistDone: 'पूरा',
  checklistTodo: 'बाकी',
  more: (n) => `${n} और`,
};

const DIALOG_MESSAGES: Translations['DIALOG_MESSAGES'] = {
  view: 'दृश्य',
  dismissDialog: 'डायलॉग बंद करें',
  dismissNamed: (label) => `${label} बंद करें`,
};

const ALERT_DIALOG_MESSAGES: Translations['ALERT_DIALOG_MESSAGES'] = {
  confirm: 'पुष्टि करें',
};

const SIDEBAR_MESSAGES: Translations['SIDEBAR_MESSAGES'] = {
  sidebar: 'साइडबार',
  collapse: 'साइडबार छोटा करें',
  expand: 'साइडबार बड़ा करें',
  close: 'साइडबार बंद करें',
  quickSearch: 'त्वरित खोज',
  searchPlaceholder: 'नेविगेशन में खोजें…',
  searchPlaceholderCompact: 'खोजें...',
  filter: 'नेविगेशन फ़िल्टर करें',
  clearSearch: 'नेविगेशन खोज साफ़ करें',
  noResults: 'कोई परिणाम नहीं',
  mode: 'मोड',
  upgrade: 'अपग्रेड करें',
  usersWithAccess: 'ऐक्सेस वाले उपयोगकर्ता',
  addUser: 'उपयोगकर्ता जोड़ें',
  manage: 'प्रबंधित करें',
  accountMenu: 'खाता मेन्यू',
  teamMenu: (team) => `${team} मेन्यू`,
};

const FILE_SIZE_UNITS: Translations['FILE_SIZE_UNITS'] = { byte: 'B', kilobyte: 'KB', megabyte: 'MB', gigabyte: 'GB' };

const CARD_FORM_MESSAGES: Translations['CARD_FORM_MESSAGES'] = {
  labels: { number: 'कार्ड नंबर', expiry: 'समाप्ति तिथि', securityCode: 'सुरक्षा कोड', name: 'कार्ड पर नाम', postcode: 'पिन कोड', country: 'देश' },
  selectCountry: 'देश चुनें',
};

const CHAT_COMPOSER_MESSAGES: Translations['CHAT_COMPOSER_MESSAGES'] = {
  attach: 'अटैच करें',
  emoji: 'इमोजी',
  camera: 'कैमरा',
  mic: 'वॉइस मैसेज रिकॉर्ड करें',
  message: 'संदेश',
  enterHint: 'भेजने के लिए Enter · नई पंक्ति के लिए Shift + Enter',
  modEnterHint: 'भेजने के लिए ⌘ + Enter · नई पंक्ति के लिए Enter',
  cancelRecording: 'रिकॉर्डिंग रद्द करें',
  sendVoice: 'वॉइस मैसेज भेजें',
  deleteRecording: 'रिकॉर्डिंग हटाएं',
  playRecording: 'रिकॉर्डिंग चलाएं',
  pauseRecording: 'रिकॉर्डिंग रोकें',
  lockRecording: 'रिकॉर्डिंग लॉक करें',
  slideToCancel: 'रद्द करने के लिए स्लाइड करें',
  recording: 'रिकॉर्ड हो रहा है',
  searchEmoji: 'इमोजी खोजें',
  noEmoji: 'कोई इमोजी नहीं मिला',
  frequentlyUsed: 'अक्सर उपयोग किए गए',
  skinTone: 'त्वचा का रंग',
  emojiPicker: 'इमोजी पिकर',
  moreReactions: 'और प्रतिक्रियाएं',
  quickReactions: 'त्वरित प्रतिक्रियाएं',
  messageActions: 'संदेश कार्रवाइयां',
  attachments: 'अटैचमेंट',
  removeAttachment: (name) => `${name} हटाएं`,
  suggestions: { mention: 'लोग', command: 'कमांड', emoji: 'इमोजी' },
  attachmentItems: { gallery: 'गैलरी', camera: 'कैमरा', file: 'फ़ाइल', location: 'लोकेशन', contact: 'संपर्क', poll: 'पोल', music: 'संगीत' },
};

const MAIL_COMPOSE_MESSAGES: Translations['MAIL_COMPOSE_MESSAGES'] = {
  to: 'प्रति',
  cc: 'Cc',
  bcc: 'Bcc',
  subject: 'विषय',
  showCopies: 'Cc Bcc',
  hideCopies: 'Cc और Bcc छिपाएं',
  removeRecipient: (name) => `${name} को हटाएं`,
  suggestions: 'संपर्क',
  send: COMMON_MESSAGES.send,
  sending: 'भेजा जा रहा है',
  attach: 'फ़ाइल अटैच करें',
  discard: 'ड्राफ़्ट हटाएं',
  minimize: 'छोटा करें',
  expand: 'बड़ा करें',
  close: COMMON_MESSAGES.close,
  title: 'नया संदेश',
};

const MEDIA_PLAYER_MESSAGES: Translations['MEDIA_PLAYER_MESSAGES'] = {
  lyrics: 'बोल',
  queue: 'कतार',
  devices: 'किसी डिवाइस से कनेक्ट करें',
  fullscreen: 'फ़ुल स्क्रीन',
  openPlayer: 'प्लेयर खोलें',
  currentDevice: 'मौजूदा डिवाइस',
  listeningOn: 'इस पर सुन रहे हैं',
  listeningOnDevice: (d) => `${d} पर सुन रहे हैं`,
  selectDevice: 'कोई डिवाइस चुनें',
  noDevices: 'कोई अन्य डिवाइस नहीं मिला',
  deviceHelp: 'आपका डिवाइस नहीं दिख रहा?',
  playbackSpeed: 'प्लेबैक स्पीड',
  sleepTimer: 'स्लीप टाइमर',
  sleepOff: 'बंद',
  endOfEpisode: 'एपिसोड के अंत में',
  oneHour: '1 घंटा',
  minutes: (n) => plural('hi', n, { other: '{n} मिनट' }),
  stopsIn: (r) => `${r} में रुक जाएगा`,
  shuffle: 'शफ़ल करें',
  repeat: 'रिपीट करें',
  repeatOne: 'एक गाना रिपीट करें',
  skipBack: (n) => plural('hi', n, { other: '{n} सेकंड पीछे' }),
  skipForward: (n) => plural('hi', n, { other: '{n} सेकंड आगे' }),
  closePlayer: 'प्लेयर बंद करें',
  share: 'शेयर करें',
  showLyrics: 'बोल दिखाएं',
};

const ADDRESS_MESSAGES: Translations['ADDRESS_MESSAGES'] = { emptyTitle: 'यहाँ अभी कुछ नहीं है', addresses: 'पते' };

const CREATOR_STUDIO_MESSAGES: Translations['CREATOR_STUDIO_MESSAGES'] = {
  releaseTypes: { single: 'सिंगल', ep: 'EP', album: 'एल्बम' },
  releaseStatuses: {
    draft: 'ड्राफ़्ट',
    'in-review': 'समीक्षा में',
    scheduled: 'शेड्यूल किया गया',
    live: 'लाइव',
    rejected: 'अस्वीकृत',
    takedown: 'हटाया गया',
  },
  creditRoles: {
    songwriter: 'गीत-लेखक',
    producer: 'प्रोड्यूसर',
    composer: 'संगीतकार',
    performer: 'परफ़ॉर्मर',
    lyricist: 'गीतकार',
    'mixing-engineer': 'मिक्सिंग इंजीनियर',
    'mastering-engineer': 'मास्टरिंग इंजीनियर',
  },
  periods: { '7d': '7 दिन', '28d': '28 दिन', '12m': '12 महीने', all: 'पूरा समय' },
  artworkNotSquare: (w, h) => `आर्टवर्क वर्गाकार होना चाहिए — यह इमेज ${w}×${h} px की है।`,
  artworkTooSmall: (w, h, min) =>
    `आर्टवर्क बहुत छोटा है (${w}×${h} px)। कम से कम ${min}×${min} px की इमेज अपलोड करें।`,
  audience: { title: 'ऑडियंस', period: 'अवधि' },
  breakdown: {
    locations: 'शीर्ष स्थान',
    cities: 'शहर',
    countries: 'देश',
    age: 'उम्र',
    gender: 'लिंग',
    sources: 'सुनने के स्रोत',
    metric: 'श्रोता',
  },
  streams: {
    metrics: 'चार्ट मीट्रिक',
    summary: (metric, releases) =>
      releases ? `समय के साथ ${metric}; रिलीज़: ${releases}` : `समय के साथ ${metric}`,
  },
  topTracks: {
    title: 'शीर्ष ट्रैक',
    rank: '#',
    rankName: 'रैंक',
    track: 'ट्रैक',
    streams: 'स्ट्रीम',
    listeners: 'श्रोता',
    saves: 'सेव',
    trend: 'रुझान',
    trends: { up: 'बढ़ रहा है', down: 'घट रहा है', flat: 'स्थिर', new: 'नई एंट्री' },
    newBadge: 'नया',
    empty: 'इस अवधि में अभी तक कोई स्ट्रीम नहीं।',
  },
  tracks: (n) => plural('hi', n, { one: '{n} ट्रैक', other: '{n} ट्रैक' }),
  timeline: {
    states: { complete: 'पूरा हुआ', current: 'जारी है', upcoming: 'शुरू नहीं हुआ', error: 'ध्यान देने की ज़रूरत' },
    label: 'रिलीज़ की प्रगति',
  },
  upload: {
    queued: 'कतार में',
    processing: 'ट्रांसकोड हो रहा है…',
    ready: 'तैयार',
    failed: 'अपलोड विफल रहा',
    remove: (name) => `${name} निकालें`,
    progress: (name) => `${name} अपलोड हो रहा है`,
  },
  artwork: {
    title: 'आर्टवर्क',
    requirements: '3000×3000 px, JPG या PNG',
    replace: 'बदलें',
    remove: 'आर्टवर्क निकालें',
    preview: 'रिलीज़ आर्टवर्क',
    upload: 'आर्टवर्क अपलोड करें',
  },
  credits: {
    title: 'क्रेडिट',
    role: 'भूमिका',
    name: 'नाम',
    add: 'क्रेडिट जोड़ें',
    remove: (index, name) => (name ? `क्रेडिट ${index + 1} निकालें, ${name}` : `क्रेडिट ${index + 1} निकालें`),
    empty: 'इस ट्रैक के गीत-लेखकों, प्रोड्यूसरों और परफ़ॉर्मरों को क्रेडिट दें।',
    field: (field, n) => `${field}, क्रेडिट ${n}`,
  },
  artists: {
    add: 'जोड़ें',
    addTo: (label) => `${label} में जोड़ें`,
    remove: (name) => `${name} निकालें`,
  },
  isrc: { hint: 'फ़ॉर्मैट: CC-XXX-YY-NNNNN', invalid: 'यह मान्य ISRC नहीं है' },
  metadata: {
    title: 'ट्रैक का शीर्षक',
    version: 'वर्शन',
    versionPlaceholder: 'रीमिक्स, लाइव, एकूस्टिक…',
    explicit: 'स्पष्ट बोल',
    explicitDescription: 'अगर ट्रैक में कड़ी भाषा या स्पष्ट विषय हैं, तो इसे चालू करें।',
    genre: 'शैली',
    genrePlaceholder: 'शैली चुनें',
    primaryArtists: 'मुख्य कलाकार',
    featuredArtists: 'फ़ीचर्ड कलाकार',
    artistPlaceholder: 'कलाकार का नाम जोड़ें',
    language: 'बोल की भाषा',
    languagePlaceholder: 'भाषा चुनें',
    lyrics: 'बोल',
    lyricsPlaceholder: 'बोल चिपकाएं, हर गाई गई पंक्ति के लिए एक लाइन',
  },
  payout: {
    estimated: 'इस महीने की अनुमानित कमाई',
    lastPayout: 'पिछला भुगतान',
    nextPayout: 'अगला भुगतान',
    statements: 'स्टेटमेंट देखें',
    chart: 'मासिक कमाई',
  },
  pitch: {
    title: 'संपादकों को पिच करें',
    description: 'अपनी अगली रिलीज़ के बारे में उसके आने से पहले संपादकीय टीम को बताएं।',
    release: 'रिलीज़',
    releasePlaceholder: 'आने वाली रिलीज़ चुनें',
    moods: 'मूड',
    genres: 'शैली',
    pitch: 'आपकी पिच',
    pitchPlaceholder: 'इस रिलीज़ को क्या खास बनाता है? यह किसके लिए है, और इसके पीछे की कहानी क्या है?',
    submit: 'पिच भेजें',
    tagLimit: (max) => `अधिकतम ${max} चुनें`,
    statuses: { submitted: 'पिच भेज दी गई', accepted: 'समीक्षा के लिए चुनी गई', declined: 'इस बार नहीं चुनी गई' },
    statusDescriptions: {
      submitted: 'संपादक हर पिच पढ़ते हैं। रिलीज़ की तारीख से पहले आपको जवाब मिलेगा।',
      accepted: 'आपकी रिलीज़ पर संपादकीय प्लेलिस्ट के लिए विचार किया जा रहा है।',
      declined: 'यह रिलीज़ नहीं चुनी गई। अगली रिलीज़ शेड्यूल होते ही आप उसे पिच कर सकते हैं।',
    },
    edit: 'पिच संपादित करें',
  },
};

const PROPERTY_INSIGHTS_MESSAGES: Translations['PROPERTY_INSIGHTS_MESSAGES'] = {
  energy: 'ऊर्जा',
  pending: 'लंबित',
  energyRatingClass: (r) => `ऊर्जा रेटिंग ${r}`,
  energyRatingStatus: (s) => `ऊर्जा रेटिंग: ${s}`,
  energyRating: 'ऊर्जा रेटिंग',
  certificateInProgress: 'प्रमाणपत्र प्रक्रिया में है',
  consumption: 'खपत',
  emissions: 'उत्सर्जन',
  moreEfficient: 'अधिक कुशल',
  lessEfficient: 'कम कुशल',
  walkTime: (t) => `${t} पैदल`,
  scoreOutOf: (d, m) => `${m} में से ${d}`,
  pricePerSquareMetre: 'प्रति वर्ग मीटर कीमत',
  rentHistory: 'किराये का इतिहास',
  rentHistoryEmpty: 'इस घर का अभी कोई इतिहास नहीं है',
  confidence: { low: 'कम विश्वसनीयता', medium: 'मध्यम विश्वसनीयता', high: 'उच्च विश्वसनीयता' },
  aboveEstimate: (p) => `अनुमान से ${p} अधिक`,
  belowEstimate: (p) => `अनुमान से ${p} कम`,
  fairPrice: 'उचित कीमत',
  estimatedPrice: 'अनुमानित कीमत',
  asking: 'माँगी गई कीमत',
  noVerdict: 'आकलन के लिए पर्याप्त डेटा नहीं',
  whyThisEstimate: 'यह अनुमान क्यों',
  comparables: (n) =>
    plural('hi', n, { one: '{n} तुलनीय घर के आधार पर', other: '{n} तुलनीय घरों के आधार पर' }),
  currentPrice: 'मौजूदा कीमत',
  now: 'अभी',
  noPriceHistory: 'अभी कोई मूल्य इतिहास नहीं',
  priceHistoryPeriod: 'मूल्य इतिहास की अवधि',
  priceHistory: 'मूल्य इतिहास',
  priceHistoryTrend: (head, a, aw, b, bw) => `${head}: ${aw} में ${a} से ${bw} में ${b} तक।`,
};

const MAP_MARKER_MESSAGES: Translations['MAP_MARKER_MESSAGES'] = {
  searchAsMapMoves: 'मानचित्र हिलाने पर खोजें',
  searchThisArea: 'इस क्षेत्र में खोजें',
  stays: (n) => mapMarker_countOf('hi', n, { one: '{n} ठहरने की जगह', other: '{n} ठहरने की जगहें' }),
};

const LISTING_ACTIONS_MESSAGES: Translations['LISTING_ACTIONS_MESSAGES'] = {
  month: 'माह',
  rentalStatus: { available: 'उपलब्ध', reserved: 'आरक्षित', rented: 'किराये पर दिया गया' },
  rentalStatusMessage: {
    reserved: 'एक अन्य आवेदक अनुबंध पूरा कर रहा है। नई विज़िट फ़िलहाल रोकी गई हैं।',
    rented: 'यह घर किराये पर दे दिया गया है और अब अनुरोध स्वीकार नहीं करता।',
  },
  saleStatus: { available: 'बिक्री के लिए', reserved: 'आरक्षित', sold: 'बिक गया' },
  saleStatusMessage: {
    reserved: 'एक प्रस्ताव स्वीकार कर लिया गया है। एजेंट फ़िलहाल विज़िट तय नहीं कर रहा है।',
    sold: 'यह घर बिक चुका है।',
  },
  requestViewing: 'विज़िट का अनुरोध करें',
  apply: 'आवेदन करें',
  contactAgent: 'एजेंट से संपर्क करें',
  requestVisit: 'विज़िट का अनुरोध करें',
  makeOffer: 'प्रस्ताव दें',
  yourHome: 'आपका घर',
  theirHome: 'उनका घर',
  dates: 'तारीखें',
  guests: 'मेहमान',
  addDates: 'तारीखें जोड़ें',
  addGuests: 'मेहमान जोड़ें',
  proposeSwap: 'अदला-बदली का प्रस्ताव दें',
  exchangeModes: { swap: 'आपसी अदला-बदली', host: 'अतिथि पॉइंट', both: 'कोई भी' },
  scheduleViewing: 'विज़िट तय करें',
  noTimesLeft: 'इस दिन कोई समय खाली नहीं है',
  noteForLandlord: 'मकान मालिक के लिए नोट',
  day: 'दिन',
  time: 'समय',
  submitViewing: 'विज़िट का अनुरोध करें',
  inPerson: 'व्यक्तिगत रूप से',
  videoCall: 'वीडियो कॉल',
  viewingType: 'विज़िट का प्रकार',
  yourApplication: 'आपका आवेदन',
  applicationProgress: 'आवेदन की प्रगति',
  progressReady: (done, total) => `${total} में से ${done} तैयार`,
  applicationStatus: { missing: 'अनुपलब्ध', uploaded: 'समीक्षा में', verified: 'सत्यापित', rejected: 'अस्वीकृत' },
  applicationAction: { upload: 'अपलोड करें', view: 'देखें', replace: 'बदलें' },
  itemAction: (action, title) => `${title}: ${action}`,
  mortgage: {
    title: 'होम लोन कैलकुलेटर',
    price: 'संपत्ति की कीमत',
    downPayment: 'डाउन पेमेंट',
    downPaymentPercent: 'डाउन पेमेंट प्रतिशत',
    percent: 'प्रतिशत',
    term: 'ऋण अवधि',
    years: 'वर्ष',
    rate: 'ब्याज दर',
    monthlyPayment: 'मासिक किस्त',
    principal: 'मूलधन',
    interest: 'ब्याज',
    loanAmount: 'ऋण राशि',
    totalInterest: 'कुल ब्याज',
    totalCost: 'कुल लागत',
  },
  termYears: (n) => plural('hi', n, { one: '{n} वर्ष', other: '{n} वर्ष' }),
  mortgageDisclaimer:
    'यह एक अनुमान है, प्रस्ताव नहीं। इसमें शुल्क, कर और बीमा शामिल नहीं हैं, और पूरी अवधि के लिए स्थिर ब्याज दर मानी गई है।',
};

const AGENT_PROGRESS_MESSAGES: Translations['AGENT_PROGRESS_MESSAGES'] = {
  stepsLeft: (n) => plural('hi', n, { other: '{n} चरण बाकी' }),
  allCompleted: 'सभी चरण पूरे हो गए',
  minimize: 'चरण छोटे करें',
  expand: 'चरण दिखाएं',
  defaultSteps: [
    'प्रोजेक्ट फ़ाइलें पढ़ें',
    'लाइट मोड टोकन अपडेट और इंस्टॉल करें',
    'डार्क मोड टोकन लागू करें',
    'दोबारा इस्तेमाल होने वाला रजिस्टर्ड थीम टॉगल जोड़ें',
    'रजिस्ट्री, लिंट और प्रोडक्शन बिल्ड चलाएं',
  ],
};

const CALENDAR_MESSAGES: Translations['CALENDAR_MESSAGES'] = {
  newEvent: 'नया इवेंट',
  openNavigation: 'नेविगेशन खोलें',
  month: 'महीना',
  moreEvents: (n) => plural('hi', n, { other: '+{n} और' }),
  eventDetails: 'इवेंट का विवरण',
  join: 'शामिल हों',
  editTimeZone: 'टाइम ज़ोन बदलें',
  participants: 'प्रतिभागी',
  editParticipants: 'प्रतिभागी बदलें',
  reminders: 'रिमाइंडर',
  editReminders: 'रिमाइंडर बदलें',
  duration: calendar_compactDuration(' घं', ' मि', ' '),
  jumpToDate: 'तारीख पर जाएँ',
  previousMonth: 'पिछला महीना',
  nextMonth: 'अगला महीना',
  chooseDate: (month) => `${month}, तारीख चुनें`,
  inbox: 'इनबॉक्स',
  inboxMenu: 'इनबॉक्स मेनू',
  addAccount: 'नया खाता जोड़ें',
};

const LISTING_DETAILS_MESSAGES: Translations['LISTING_DETAILS_MESSAGES'] = {
  ratedOutOf5: (r) => `5 में से ${r} रेटिंग`,
  overallRating: 'कुल रेटिंग',
  unavailable: 'उपलब्ध नहीं',
  showAllAmenities: (n) => plural('hi', n, { one: '{n} सुविधा दिखाएँ', other: 'सभी {n} सुविधाएँ दिखाएँ' }),
  showAllFeatures: (n) => plural('hi', n, { one: '{n} विशेषता दिखाएँ', other: 'सभी {n} विशेषताएँ दिखाएँ' }),
  propertyFeatures: 'संपत्ति की विशेषताएँ',
  showAllPhotos: 'सभी फ़ोटो दिखाएँ',
  listingPhotos: 'लिस्टिंग की फ़ोटो',
  photoOf: (p, t) => `${t} में से फ़ोटो ${p}`,
  photoWithAlt: (a, p, t) => `${a}, ${t} में से फ़ोटो ${p}`,
  floorPlanOf: (a, p, t) => `${a}, ${t} में से फ़्लोर प्लान ${p}`,
  landlord: 'मकान मालिक',
  agent: 'एजेंट',
  agency: 'एजेंसी',
  activeListings: (n) => plural('hi', n, { other: '{n} सक्रिय लिस्टिंग' }),
  verified: 'सत्यापित',
  showPhone: 'फ़ोन नंबर दिखाएँ',
  call: 'कॉल करें',
  messageHost: 'होस्ट को संदेश भेजें',
  message: 'संदेश भेजें',
};

const PRICE_BREAKDOWN_MESSAGES: Translations['PRICE_BREAKDOWN_MESSAGES'] = {
  states: { estimated: 'अनुमानित', pending: 'लंबित' },
  showDetails: 'कीमत का विवरण दिखाएँ',
  hideDetails: 'कीमत का विवरण छिपाएँ',
  breakdown: 'कीमत का ब्योरा',
  about: (label) => `${label} के बारे में`,
};

const DATE_PICKER_MESSAGES: Translations['DATE_PICKER_MESSAGES'] = {
  cancel: 'रद्द करें',
  apply: 'लागू करें',
  previousMonth: 'पिछला महीना',
  nextMonth: 'अगला महीना',
  datePlaceholder: 'तारीख़ चुनें',
  dateLabel: 'तारीख़',
  rangePlaceholder: 'तारीख़ की सीमा चुनें',
  rangeLabel: 'तारीख़ की सीमा',
  startDate: 'शुरू होने की तारीख़',
  endDate: 'ख़त्म होने की तारीख़',
  daysSelected: (n) => plural('hi', n, { one: '{n} दिन चुना गया', other: '{n} दिन चुने गए' }),
  presets: {
    today: 'आज',
    yesterday: 'बीता कल',
    lastWeek: 'पिछला सप्ताह',
    thisMonth: 'इस महीने',
    lastMonth: 'पिछला महीना',
    thisYear: 'इस साल',
    lastYear: 'पिछला साल',
    allTime: 'पूरा समय',
  },
  meetingTrigger: 'मीटिंग शेड्यूल करें',
  meetingLabel: 'मीटिंग शेड्यूल करें',
  send: 'आमंत्रण भेजें',
  selectTime: 'समय चुनें',
  duration: (n) => plural('hi', n, { other: '{n} मिनट' }),
};

const SHIPMENT_REQUEST_MESSAGES: Translations['SHIPMENT_REQUEST_MESSAGES'] = {
  kinds: {
    envelope: { label: 'लिफ़ाफ़ा', description: 'दस्तावेज़, चाबियाँ, कोई भी चपटी चीज़।' },
    parcel: { label: 'पार्सल', description: 'एक डिब्बा या थैला जिसे एक व्यक्ति उठा सके।' },
    furniture: { label: 'फ़र्नीचर', description: 'सोफ़ा, मेज़, गद्दा — दोनों तरफ़ दो लोग।' },
    pallet: { label: 'पैलेट', description: 'पैक और स्टैक किया हुआ, टेल लिफ़्ट से उठाया जाता है।' },
    food: { label: 'खाना', description: 'रेस्तराँ डिलीवरी, सही तापमान पर।' },
  },
  sizes: {
    small: 'जूते के डिब्बे तक — 35 × 25 × 20 cm।',
    medium: 'केबिन बैग तक — 55 × 40 × 25 cm।',
    large: 'वॉशिंग मशीन तक — 85 × 60 × 60 cm।',
    extraLarge: 'इससे बड़ा — नोट्स में बताएँ।',
  },
  access: { ground: 'भूतल', stairs: 'सीढ़ियाँ', lift: 'लिफ़्ट' },
  load: {
    kind: 'हम क्या ले जा रहे हैं?',
    size: 'आकार',
    weight: 'वज़न',
    quantity: 'कितने',
    quantityValue: (n) => plural('hi', n, { one: '{n} आइटम', other: '{n} आइटम' }),
    notes: 'क्या कैरियर को कुछ और जानना चाहिए?',
    notesPlaceholder: 'नाज़ुक, लिफ़्ट कोड, कहाँ छोड़ना है…',
  },
  options: { extras: 'अतिरिक्त', access: 'दोनों जगह पहुँच', window: 'कब पिकअप करना है?' },
  form: {
    route: 'रास्ता',
    routeDescription: 'पहले पिकअप, आख़िर में ड्रॉप-ऑफ़।',
    load: 'सामान',
    photos: 'फ़ोटो',
    photosDescription: 'सामान की एक फ़ोटो आपको मिलने वाले कोटेशन को सबसे ज़्यादा बेहतर बनाती है।',
    options: 'विकल्प',
    optionsDescription: 'इनमें से हर एक कीमत बदलता है।',
    price: 'कीमत',
  },
  shipmentRequest: 'शिपमेंट अनुरोध',
};

const LABEL_MESSAGES: Translations['LABEL_MESSAGES'] = { required: 'आवश्यक' };

const CHECKOUT_SUMMARY_MESSAGES: Translations['CHECKOUT_SUMMARY_MESSAGES'] = {
  title: 'अपना ऑर्डर जाँचें',
  orderSummary: 'ऑर्डर सारांश',
  deliverTo: 'यहाँ डिलीवर करें',
  notChosen: 'अभी चुना नहीं गया',
  opensPicker: 'चयनकर्ता खोलता है',
  placeOrder: 'ऑर्डर करें',
  placingOrder: 'आपका ऑर्डर दिया जा रहा है',
};

const VEHICLE_PICKER_MESSAGES: Translations['VEHICLE_PICKER_MESSAGES'] = {
  from: 'शुरुआती कीमत',
  fits: (label) => `${label} में क्या आता है`,
  unavailable: 'इस सामान के लिए उपलब्ध नहीं',
  vehicle: 'वाहन',
  vehicles: {
    bike: { label: 'कार्गो बाइक', capacity: '25 kg तक · 60 × 40 × 40 cm', fits: ['दस्तावेज़', 'खाने का ऑर्डर', 'एक छोटा डिब्बा'] },
    car: { label: 'कार', capacity: '150 kg तक · 100 × 80 × 60 cm', fits: ['दो सूटकेस', 'चार डिब्बे', 'एक साइकिल'] },
    van: { label: 'वैन', capacity: '800 kg तक · 240 × 150 × 140 cm', fits: ['एक सोफ़ा', 'स्टूडियो फ़्लैट की शिफ़्टिंग', 'आधा पैलेट'] },
    boxTruck: { label: 'बॉक्स ट्रक', capacity: '3,500 kg तक · 420 × 200 × 210 cm', fits: ['दो पैलेट', '2BHK की शिफ़्टिंग', 'टेल लिफ़्ट'] },
    refrigerated: { label: 'रेफ़्रिजरेटेड वैन', capacity: '700 kg तक · 2–8 °C पर', fits: ['ताज़ी उपज', 'ठंडा कैटरिंग', 'फूल'] },
  },
};

const COMPOSER_PANEL_MESSAGES: Translations['COMPOSER_PANEL_MESSAGES'] = {
  message: 'संदेश',
  add: 'अटैचमेंट जोड़ें',
  addMenu: 'चैट में जोड़ें',
  permissions: 'अनुमतियां',
  permissionMode: 'अनुमति मोड',
  learnMore: 'और जानें',
  voice: 'वॉइस इनपुट',
  send: 'संदेश भेजें',
  stop: 'जनरेट करना रोकें',
  permissionTrigger: (mode) => `अनुमति: ${mode}`,
  removeFile: (name) => `${name} निकालें`,
  retryFile: (name) => `${name} फिर से आज़माएं`,
  panelPlaceholder: 'नमस्ते, आज आपको क्या चाहिए?',
  pillPlaceholder: 'मुझसे कुछ भी पूछें',
  pillCompactPlaceholder: 'मुझसे पूछें',
  modelSettings: 'मॉडल सेटिंग',
  models: 'मॉडल',
  modelGroup: 'मॉडल',
  effort: 'प्रयास',
  effortAuto: 'ऑटो',
  faster: 'तेज़',
  smarter: 'ज़्यादा स्मार्ट',
  quickSearch: 'त्वरित खोज',
  searchModels: 'मॉडल खोजें',
  closeSearch: 'खोज बंद करें',
  noMatches: 'कोई मॉडल मेल नहीं खाता',
  providers: 'प्रदाता',
  matchingModels: 'मेल खाने वाले मॉडल',
  providerModels: (provider) => `${provider} के मॉडल`,
  localFolders: 'लोकल फ़ोल्डर',
  context: (percent) => `कॉन्टेक्स्ट ${percent}%`,
  effortLevels: ['कम', 'मध्यम', 'संतुलित', 'उच्च', 'बहुत उच्च', 'अधिकतम'],
  permissionModes: {
    auto: { label: 'ऑटो', description: 'एजेंट खुद तय करता है' },
    manual: { label: 'मैन्युअल', description: 'बदलाव करने से पहले हमेशा पूछें' },
    plan: { label: 'प्लान मोड', description: 'आगे बढ़ने से पहले प्लान बनाएं' },
    bypass: { label: 'सभी बायपास करें', description: 'अनुमति से जुड़े फ़ैसले एजेंट लेता है' },
  },
  addMenuRows: {
    add: 'जोड़ें',
    plugins: 'प्लगइन',
    files: 'फ़ाइलें और फ़ोल्डर',
    goal: 'लक्ष्य',
    goalDescription: 'तेज़ नतीजों के लिए लक्ष्य तय करें',
    plan: 'प्लान मोड',
    planDescription: 'जटिल काम मैनेज करें',
    documents: 'दस्तावेज़',
    documentsDescription: 'दस्तावेज़ बनाएं और संपादित करें',
    spreadsheets: 'स्प्रेडशीट',
    spreadsheetsDescription: 'स्प्रेडशीट बनाएं',
    presentations: 'प्रेज़ेंटेशन',
    presentationsDescription: 'मार्केटिंग सामग्री बनाएं',
    code: 'कोड ब्लॉक',
    codeDescription: 'मौजूदा कोड लिखें और संपादित करें',
  },
};

const MESSAGE_BUBBLE_MESSAGES: Translations['MESSAGE_BUBBLE_MESSAGES'] = {
  forwardedFrom: (name) => `${name} से फ़ॉरवर्ड किया गया`,
  deleted: 'यह संदेश हटा दिया गया था',
  retry: 'फिर से भेजने की कोशिश करें',
  addReaction: 'प्रतिक्रिया जोड़ें',
  replyTo: 'उद्धृत संदेश पर जाएं',
  selected: 'चयनित',
  pending: 'भेजा जा रहा है',
  failed: 'नहीं भेजा गया',
  reactionSelected: 'चयनित',
  unread: 'अपठित संदेश',
  typing: 'टाइप कर रहे हैं…',
};

const PAYMENT_STATUS_MESSAGES: Translations['PAYMENT_STATUS_MESSAGES'] = {
  states: { authorising: 'अधिकृत किया जा रहा है', paid: 'भुगतान हो गया', failed: 'भुगतान विफल', refunded: 'रिफ़ंड हो गया', pending: 'भुगतान लंबित' },
  reference: 'संदर्भ',
};

const AVATAR_MESSAGES: Translations['AVATAR_MESSAGES'] = { live: 'लाइव' };

const PLACE_CARD_MESSAGES: Translations['PLACE_CARD_MESSAGES'] = {
  openStates: {
    open: 'खुला है',
    'closing-soon': 'जल्द बंद होगा',
    closed: 'बंद है',
    'opening-soon': 'जल्द खुलेगा',
  },
  new: 'नया',
  actions: 'कार्रवाइयाँ',
  actionsFor: (name) => `${name} के लिए कार्रवाइयाँ`,
  rated: (value, reviews) =>
    placeCard_withReviews(
      `5 में से ${value} रेटिंग`,
      reviews === undefined ? undefined : placeCard_countOf('hi', reviews, { one: '{n} समीक्षा', other: '{n} समीक्षाएँ' }),
    ),
};

const SOCIAL_BUTTON_MESSAGES: Translations['SOCIAL_BUTTON_MESSAGES'] = { actions: { continue: (b) => `${b} के साथ जारी रखें`, signIn: (b) => `${b} से साइन इन करें`, signUp: (b) => `${b} से साइन अप करें` } };

const QUESTIONNAIRE_MESSAGES: Translations['QUESTIONNAIRE_MESSAGES'] = { other: 'अन्य', otherPlaceholder: 'अपना जवाब यहाँ लिखें', steps: 'चरण', step: (n) => `चरण ${n}` };

const MAP_CONTROLS_MESSAGES: Translations['MAP_CONTROLS_MESSAGES'] = {
  group: 'मानचित्र नियंत्रण',
  locate: 'मेरी लोकेशन दिखाएं',
  following: 'मेरी लोकेशन को फ़ॉलो करना बंद करें',
  zoomIn: 'ज़ूम इन करें',
  zoomOut: 'ज़ूम आउट करें',
  zoom: 'ज़ूम',
  tilt: 'मानचित्र झुकाएं',
  tiltOff: 'मानचित्र समतल करें',
  compass: (degrees) => `${degrees} डिग्री की दिशा। उत्तर की ओर रीसेट करें`,
  layerTrigger: 'मानचित्र लेयर',
  layers: 'मानचित्र',
  overlays: 'ओवरले',
};

const PAYMENT_METHOD_MESSAGES: Translations['PAYMENT_METHOD_MESSAGES'] = { states: { expired: 'समाप्त', declined: 'अस्वीकृत' }, default: 'डिफ़ॉल्ट', add: 'भुगतान का तरीका जोड़ें', emptyTitle: 'कोई सहेजा गया भुगतान तरीका नहीं', paymentMethods: 'भुगतान के तरीके' };

const AVATAR_GROUP_MESSAGES: Translations['AVATAR_GROUP_MESSAGES'] = { more: (n) => `${n} और लोग`, profile: 'प्रोफ़ाइल' };

const MENUBAR_MESSAGES: Translations['MENUBAR_MESSAGES'] = {
  menuBar: 'मेन्यू बार',
};

const AGENT_THINKING_MESSAGES: Translations['AGENT_THINKING_MESSAGES'] = { thinking: 'सोच रहा है' };

const AI_CHAT_MESSAGES: Translations['AI_CHAT_MESSAGES'] = {
  feedback: { like: 'अच्छा जवाब', dislike: 'खराब जवाब', copy: 'जवाब कॉपी करें', copied: 'कॉपी हो गया!' },
  imageGeneration: {
    generated: 'इमेज बन गई',
    generating: 'इमेज बन रही है',
    remaining: (n) => plural('hi', n, { one: '{n} सेकंड बाकी', other: '{n} सेकंड बाकी' }),
    likeToast: 'आपके फ़ीडबैक के लिए धन्यवाद',
    dislikeToast: 'धन्यवाद — हम इससे सुधार करेंगे',
  },
  generatedImage: (alt) => `बनाई गई इमेज: ${alt}`,
  codePanel: {
    changes: 'बदलाव',
    browser: 'ब्राउज़र',
    uncommitted: (n) => plural('hi', n, { one: '{n} बदलाव कमिट नहीं हुआ', other: '{n} बदलाव कमिट नहीं हुए' }),
    undo: 'बदलाव पहले जैसे करें',
    browserPreview: 'ब्राउज़र प्रीव्यू',
  },
  galleryPanel: {
    gallery: 'गैलरी',
    styles: 'स्टाइल',
    stylePresets: 'स्टाइल प्रीसेट',
    enlarge: (prompt) => `${prompt} बड़ा करें`,
    minimize: (prompt) => `${prompt} छोटा करें`,
    download: (prompt) => `${prompt} डाउनलोड करें`,
  },
  panelView: 'पैनल व्यू',
  openTerminal: 'टर्मिनल खोलें',
  newGeneration: 'नया जनरेशन',
  expandPanel: 'पैनल बड़ा करें',
  togglePanel: 'पैनल दिखाएं या छिपाएं',
  container: { breadcrumb: 'चैट की जगह', share: 'चैट शेयर करें' },
  shell: {
    openNavigation: 'नेविगेशन खोलें',
    closeNavigation: 'नेविगेशन बंद करें',
    openPanel: (panel) => `${panel} खोलें`,
    closePanel: (panel) => `${panel} बंद करें`,
  },
  code: 'कोड',
};

const COMMAND_MESSAGES: Translations['COMMAND_MESSAGES'] = {
  placeholder: 'कोई कमांड लिखें या खोजें…',
  empty: 'कोई परिणाम नहीं मिला।',
  palette: 'कमांड पैलेट',
  clearSearch: 'खोज साफ़ करें',
};

const MUSIC_LIBRARY_MESSAGES: Translations['MUSIC_LIBRARY_MESSAGES'] = {
  kinds: {
    playlist: 'प्लेलिस्ट',
    artist: 'कलाकार',
    album: 'एल्बम',
    podcast: 'पॉडकास्ट',
    audiobook: 'ऑडियोबुक',
    folder: 'फ़ोल्डर',
  },
  library: {
    title: 'आपकी लाइब्रेरी',
    create: 'प्लेलिस्ट या फ़ोल्डर बनाएं',
    collapseRail: 'आपकी लाइब्रेरी छोटी करें',
    expandRail: 'आपकी लाइब्रेरी खोलें',
    filters: 'फ़िल्टर',
    clearFilters: 'फ़िल्टर साफ़ करें',
    filter: {
      playlists: 'प्लेलिस्ट',
      artists: 'कलाकार',
      albums: 'एल्बम',
      podcasts: 'पॉडकास्ट',
      audiobooks: 'ऑडियोबुक',
    },
    downloaded: 'डाउनलोड किए गए',
    search: 'आपकी लाइब्रेरी में खोजें',
    searchPlaceholder: 'आपकी लाइब्रेरी में खोजें',
    clearSearch: 'खोज साफ़ करें',
    sortAndView: 'क्रम और व्यू',
    sortBy: 'इसके अनुसार क्रम',
    viewAs: 'इस रूप में देखें',
    sort: {
      recents: 'हाल ही के',
      'recently-added': 'हाल ही में जोड़े गए',
      alphabetical: 'वर्णानुक्रम',
      creator: 'निर्माता',
    },
    view: { compact: 'कॉम्पैक्ट', list: 'सूची', grid: 'ग्रिड' },
    empty: 'यहां अभी कुछ नहीं है',
  },
  item: { pinned: 'पिन किया गया', downloaded: 'डाउनलोड किया गया', nowPlaying: 'अभी चल रहा है' },
  search: { placeholder: 'आप क्या सुनना चाहते हैं?', clear: 'खोज साफ़ करें', browse: 'ब्राउज़ करें' },
  resultTypes: 'नतीजों के प्रकार',
  topResultKinds: {
    song: 'गाना',
    artist: 'कलाकार',
    album: 'एल्बम',
    playlist: 'प्लेलिस्ट',
    podcast: 'पॉडकास्ट',
    episode: 'एपिसोड',
    audiobook: 'ऑडियोबुक',
    profile: 'प्रोफ़ाइल',
  },
  recent: {
    title: 'हाल की खोजें',
    clearAll: 'हाल की खोजें साफ़ करें',
    remove: (title) => `${title} निकालें`,
  },
};

const LISTING_CARD_MESSAGES: Translations['LISTING_CARD_MESSAGES'] = {
  statuses: { reserved: 'आरक्षित', sold: 'बिक गया', rented: 'किराये पर दिया गया', unavailable: 'उपलब्ध नहीं' },
  originally: (p) => `पहले ${p}`,
  approximateLocation: 'अनुमानित स्थान',
  rated: (r) => `5 में से ${r} रेटिंग`,
  ratedWithReviews: (r, c) =>
    plural('hi', c, { one: `5 में से ${r} रेटिंग, ${c} समीक्षा`, other: `5 में से ${r} रेटिंग, ${c} समीक्षाएँ` }),
  newListing: 'नया',
  previousPhoto: 'पिछली फ़ोटो',
  nextPhoto: 'अगली फ़ोटो',
  saveToWishlist: 'विशलिस्ट में सहेजें',
  removeFromWishlist: 'विशलिस्ट से हटाएँ',
};

const NAVIGATION_BANNER_MESSAGES: Translations['NAVIGATION_BANNER_MESSAGES'] = {
  states: { 'off-route': 'रास्ते से हट गए', rerouting: 'नया रास्ता खोजा जा रहा है' },
  thenLine: (street, maneuver) => navigationBanner_words('फिर', maneuver, street),
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
};

const LOCATION_PUCK_MESSAGES: Translations['LOCATION_PUCK_MESSAGES'] = {
  states: { locating: 'आपकी लोकेशन ढूँढी जा रही है', located: 'आपकी लोकेशन', stale: 'आपकी आख़िरी ज्ञात लोकेशन' },
  facing: (state, degrees) => `${state}, ${degrees} डिग्री की दिशा में`,
};

const CAROUSEL_MESSAGES: Translations['CAROUSEL_MESSAGES'] = {
  previousSlide: 'पिछली स्लाइड',
  nextSlide: 'अगली स्लाइड',
  goToSlide: (n) => `स्लाइड ${n} पर जाएं`,
  slideOf: (at, of) => `${of} में से ${at}`,
  carouselRole: 'कैरसेल',
  slideRole: 'स्लाइड',
};

const ORDER_STATUS_MESSAGES: Translations['ORDER_STATUS_MESSAGES'] = { states: { current: 'जारी है', upcoming: 'अभी नहीं', failed: 'विफल' }, status: 'स्थिति' };

const RATING_MESSAGES: Translations['RATING_MESSAGES'] = {
  newRating: 'नया',
  reviews: (c) => rating_countForms('hi', c, { one: '{n} समीक्षा', other: '{n} समीक्षाएँ' }),
  rated: (v) => `5 में से ${v} रेटिंग`,
  ratedWithReviews: (v, r) => `5 में से ${v} रेटिंग, ${r}`,
  star: (n) => plural('hi', n, { one: '{n} स्टार', other: '{n} स्टार' }),
};

const LISTING_EDITOR_MESSAGES: Translations['LISTING_EDITOR_MESSAGES'] = {
  offering: {
    rent: { title: 'किराये पर', description: 'लंबी अवधि का किराया, मासिक कीमत।' },
    sale: { title: 'बिक्री के लिए', description: 'घर पूरी तरह बेचें।' },
    stay: { title: 'छुट्टियों का किराया', description: 'छोटे प्रवास, प्रति रात कीमत।' },
    swap: { title: 'घर की अदला-बदली', description: 'दूसरे सदस्यों के साथ घर बदलें।' },
    monthlyRent: 'मासिक किराया',
    deposit: 'जमा राशि',
    depositOption: (months) =>
      months === 0 ? 'कोई नहीं' : plural('hi', months, { one: '{n} महीना', other: '{n} महीने' }),
    availableFrom: 'कब से उपलब्ध',
    minimumStay: 'न्यूनतम अवधि',
    months: (months) => plural('hi', months, { one: '{n} महीना', other: '{n} महीने' }),
    askingPrice: 'माँगी गई कीमत',
    pricePerArea: 'प्रति m² कीमत',
    pricePerAreaEmpty: 'कीमत जोड़ें',
    nightlyRate: 'प्रति रात दर',
    cleaningFee: 'सफ़ाई शुल्क',
    minimumNights: 'न्यूनतम रातें',
    nights: (nights) => plural('hi', nights, { one: '{n} रात', other: '{n} रातें' }),
    swapMode: 'आप अदला-बदली कैसे करना चाहेंगे?',
    swapModes: { swap: 'घर बदलें', host: 'सिर्फ़ मेज़बानी', both: 'कोई भी' },
    group: 'घर किस रूप में पेश किया गया है?',
  },
  propertyTypes: {
    apartment: 'अपार्टमेंट',
    house: 'मकान',
    room: 'कमरा',
    studio: 'स्टूडियो',
    duplex: 'डुप्लेक्स',
    penthouse: 'पेंटहाउस',
    coliving: 'को-लिविंग',
    hostel: 'हॉस्टल',
    other: 'अन्य',
  },
  propertyType: 'प्रॉपर्टी का प्रकार',
  addressPrecision: {
    exact: {
      title: 'सटीक पता',
      description: 'पिन इमारत पर लगता है। उन घरों के लिए सबसे अच्छा जो वैसे भी आसानी से मिल जाते हैं।',
    },
    street: {
      title: 'सिर्फ़ गली',
      description: 'गली दिखती है, नंबर नहीं। सटीक पता बुकिंग या हस्ताक्षर के बाद साझा होता है।',
    },
    approximate: {
      title: 'अनुमानित इलाका',
      description: 'लगभग 500 m का घेरा दिखाता है। सबसे निजी विकल्प।',
    },
  },
  addressPrecisionLabel: 'पते की सटीकता',
  addressPrecisionFootnote: 'प्रकाशित नक्शा इसी चुनाव का पालन करता है। आपका सटीक पता सिर्फ़ उन्हीं लोगों से साझा होता है जिनकी आप पुष्टि करते हैं।',
  qualityTitle: 'लिस्टिंग की गुणवत्ता',
  qualityScore: 'लिस्टिंग गुणवत्ता स्कोर',
  tips: 'सुझाव',
  todo: 'बाकी',
  needsWork: 'सुधार की ज़रूरत',
  good: 'अच्छा',
  excellent: 'बेहतरीन',
  previewTitle: 'पूर्वावलोकन',
  previewDescription: 'मेहमान आपकी लिस्टिंग ऐसे देखेंगे।',
  card: 'कार्ड',
  page: 'पेज',
  previewAs: 'इस रूप में देखें',
  reviews: (n, shown) => plural('hi', n, { one: '{s} समीक्षा', other: '{s} समीक्षाएँ' }).replace('{s}', shown),
};

const MEDIA_HEADER_MESSAGES: Translations['MEDIA_HEADER_MESSAGES'] = {
  artistPick: 'कलाकार की पसंद',
  saveEpisode: 'एपिसोड सहेजें',
  share: 'शेयर करें',
  podcastEpisode: 'पॉडकास्ट एपिसोड',
  listeningProgress: 'सुनने की प्रगति',
  shuffle: 'शफ़ल करें',
  download: 'डाउनलोड करें',
  downloadProgress: 'डाउनलोड की प्रगति',
  follow: 'फ़ॉलो करें',
  following: 'फ़ॉलो कर रहे हैं',
  searchInPlaylist: 'प्लेलिस्ट में खोजें',
  compactView: 'कॉम्पैक्ट व्यू',
  editDetails: 'विवरण संपादित करें',
  about: 'परिचय',
  discography: 'डिस्कोग्राफ़ी',
  showAll: 'सभी दिखाएं',
  albums: 'एल्बम',
  singlesAndEps: 'सिंगल और EP',
  compilations: 'संकलन',
  audiobook: 'ऑडियोबुक',
  popular: 'लोकप्रिय',
  seeMore: 'और देखें',
  podcast: 'पॉडकास्ट',
  latestEpisode: 'नया एपिसोड',
  verifiedArtist: 'सत्यापित कलाकार',
  profile: 'प्रोफ़ाइल',
  editProfile: 'प्रोफ़ाइल संपादित करें',
};

const MENU_ITEM_MESSAGES: Translations['MENU_ITEM_MESSAGES'] = {
  diets: { vegetarian: 'शाकाहारी', vegan: 'वीगन', 'gluten-free': 'ग्लूटेन-मुक्त', 'dairy-free': 'डेयरी-मुक्त', halal: 'हलाल', kosher: 'कोशर' },
  spicy: 'तीखा',
  spiceOf: (label, level, max) => `${label} ${max} में से ${level}`,
  originally: (price, original) => `${price}, पहले ${original}`,
  inBasket: (n) => `बास्केट में ${n}`,
  soldOut: 'बिक गया',
  addItem: (name) => `${name} जोड़ें`,
  choose: (n) => `${n} चुनें`,
  chooseRange: (min, max) => `${min} से ${max} चुनें`,
  upTo: (n) => `${n} तक`,
  optional: 'वैकल्पिक',
  quantity: 'मात्रा',
  addToBasket: 'बास्केट में जोड़ें',
  options: 'विकल्प',
};

const PAGINATION_MESSAGES: Translations['PAGINATION_MESSAGES'] = {
  pagination: 'पेजिनेशन',
  goToPage: (page) => `पेज ${page} पर जाएं`,
};

const LEAD_SCORE_MESSAGES: Translations['LEAD_SCORE_MESSAGES'] = { title: 'लीड स्कोर', factors: 'यह किससे बना है', bands: { cold: 'ठंडा', warm: 'गर्म', hot: 'बहुत गर्म' } };

const DIRECTIONS_MESSAGES: Translations['DIRECTIONS_MESSAGES'] = {
  modes: { drive: 'गाड़ी', transit: 'सार्वजनिक परिवहन', walk: 'पैदल', cycle: 'साइकिल' },
  traffic: { light: 'कम ट्रैफ़िक', moderate: 'मध्यम ट्रैफ़िक', heavy: 'भारी ट्रैफ़िक' },
  maneuvers: {
    depart: 'प्रस्थान',
    straight: 'सीधे चलते रहें',
    'slight-left': 'हल्का बाएँ मुड़ें',
    left: 'बाएँ मुड़ें',
    'sharp-left': 'तेज़ी से बाएँ मुड़ें',
    'slight-right': 'हल्का दाएँ मुड़ें',
    right: 'दाएँ मुड़ें',
    'sharp-right': 'तेज़ी से दाएँ मुड़ें',
    uturn: 'यू-टर्न लें',
    roundabout: 'गोलचक्कर पर',
    merge: 'लेन में शामिल हों',
    arrive: 'पहुँचें',
    board: 'सवार हों',
    alight: 'उतरें',
    transfer: 'वाहन बदलें',
    walk: 'पैदल चलें',
  },
  directions: 'दिशा-निर्देश',
  otherRoutes: 'अन्य रास्ते',
  travelMode: 'यात्रा का तरीका',
  start: 'शुरू करें',
  currentStep: 'मौजूदा चरण',
  line: (name) => `लाइन ${name}`,
};

const CART_PANEL_MESSAGES: Translations['CART_PANEL_MESSAGES'] = {
  basket: 'बास्केट',
  checkout: 'चेकआउट पर जाएँ',
  emptyTitle: 'आपकी बास्केट खाली है',
  emptyDescription: 'मेन्यू से कुछ जोड़ें, वह यहाँ दिखेगा।',
  soldOut: 'बिक गया',
  removeItem: (name) => `${name} हटाएँ`,
  originally: (price, original) => `${price}, पहले ${original}`,
  promoCode: 'प्रोमो कोड',
  apply: 'लागू करें',
  tip: 'टिप',
};

const MEDIA_CARD_MESSAGES: Translations['MEDIA_CARD_MESSAGES'] = {
  albumTypes: { album: 'एल्बम', single: 'सिंगल', ep: 'EP', compilation: 'संकलन' },
  artist: 'कलाकार',
  verified: 'सत्यापित',
  audiobook: 'ऑडियोबुक',
  narratedBy: (n) => `${n} द्वारा सुनाई गई`,
  progressOf: (t) => `${t} की प्रगति`,
  episode: 'एपिसोड',
  played: 'सुना गया',
  event: 'इवेंट',
  soldOut: 'सभी टिकट बिक गए',
  listeningNow: 'अभी सुन रहे हैं',
  trackBy: (t, a) => `${a} का ${t}`,
  mix: 'मिक्स',
  playlist: 'प्लेलिस्ट',
  collaborative: 'साझा प्लेलिस्ट',
  ownedBy: (o) => `${o} द्वारा`,
  podcast: 'पॉडकास्ट',
  profile: 'प्रोफ़ाइल',
  followsYou: 'आपको फ़ॉलो करता है',
  song: 'गाना',
  share: 'शेयर करें',
  listened: 'सुना गया',
};

const JOB_BOARD_MESSAGES: Translations['JOB_BOARD_MESSAGES'] = {
  labels: {
    take: 'काम लें',
    pass: 'छोड़ें',
    distance: 'दूरी',
    duration: 'समय',
    window: 'समय-सीमा',
    pickup: 'पिक-अप',
    dropoff: 'ड्रॉप-ऑफ़',
    state: { taken: 'लिया गया', expired: 'समाप्त' },
    showPay: 'भुगतान दिखाएं',
    hidePay: 'भुगतान छिपाएं',
    payDetails: 'भुगतान:',
    sort: 'काम क्रमबद्ध करें',
    filtersToggle: 'फ़िल्टर',
    filtersActive: (n) => `${n} लागू`,
    sortOptions: {
      pay: 'सबसे ज़्यादा भुगतान',
      distance: 'सबसे नज़दीक',
      soonest: 'सबसे पहले शुरू',
      expiring: 'सबसे पहले बंद',
    },
    filters: { distance: 'दूरी', pay: 'भुगतान', when: 'कब', vehicle: 'वाहन' },
    clearFilters: 'फ़िल्टर हटाएं',
    refresh: 'सूची रीफ़्रेश करें',
    count: (n) => `${n} काम`,
    loading: 'काम लोड हो रहे हैं',
  },
  emptyTitle: 'अभी कोई काम नहीं',
  emptyDescription: 'आपकी खोज से कुछ मेल नहीं खाता। कोई फ़िल्टर बढ़ाएं या एक मिनट बाद फिर से रीफ़्रेश करें।',
  list: 'काम',
  payDetailsFor: (load) => `${load} का भुगतान`,
  route: (pickup, dropoff) => `${pickup} और ${dropoff}`,
  bands: {
    anyDistance: 'कोई भी दूरी',
    underKm: (km) => `${km} किमी से कम`,
    anyTime: 'कभी भी',
    withinHour: 'एक घंटे के भीतर',
    nextHours: (hours) => `अगले ${hours} घंटे`,
    today: 'आज',
  },
};

const FLOATING_MESSAGES: Translations['FLOATING_MESSAGES'] = {
  submenu: 'उप-मेन्यू',
};

const AGENT_CHAT_MESSAGES: Translations['AGENT_CHAT_MESSAGES'] = {
  chat: {
    newChat: 'नई चैट',
    emptyTitle: 'मैं किसमें मदद कर सकता हूं?',
    emptyDescription: 'यह चैट आपकी अपनी API कुंजी से चलती है। इतिहास इसी ब्राउज़र में रहता है।',
    thinking: 'सोच रहा है',
    error: 'कुछ गलत हो गया। सर्वर लॉग देखें, फिर दोबारा कोशिश करें।',
    suggestions: [
      'बताओ कि यह स्टार्टर प्रोजेक्ट क्या करता है',
      'तीन वाक्यों में एक प्रोडक्ट अपडेट लिखो',
      'शेड्यूलिंग ऐप के लिए पांच नाम सुझाओ',
    ],
    you: 'आप',
    assistant: 'असिस्टेंट',
  },
  actions: {
    share: 'चैट शेयर करें',
    shared: 'ट्रांसक्रिप्ट कॉपी हो गया',
    more: 'इस चैट के लिए और कार्रवाइयां',
    exportChats: 'चैट एक्सपोर्ट करें',
    markUnread: 'अपठित के रूप में चिह्नित करें',
    deleteChat: 'चैट हटाएं',
  },
  message: { copy: 'मैसेज कॉपी करें', readAloud: 'पढ़कर सुनाएं', stopReading: 'पढ़कर सुनाना बंद करें' },
  history: {
    region: 'चैट इतिहास',
    recent: 'हाल की',
    empty: 'आप जो चैट शुरू करेंगे, वे यहां दिखेंगी।',
    rename: 'नाम बदलें',
    renameField: 'चैट का नाम बदलें',
    markUnread: 'अपठित के रूप में चिह्नित करें',
    unread: 'अपठित',
    exportCount: (n) =>
      n === 0 ? 'एक्सपोर्ट करने के लिए कोई चैट नहीं' : plural('hi', n, { other: '{n} चैट एक्सपोर्ट करें' }),
    accountMenu: (name) => `${name} का खाता मेनू`,
    usageLeft: 'बचा हुआ उपयोग',
    upgrade: 'Max में अपग्रेड करें',
    logOut: 'लॉग आउट करें',
  },
  composer: {
    field: 'मैसेज',
    placeholder: 'मुझसे कुछ भी पूछें',
    attach: 'अटैचमेंट जोड़ें',
    send: 'मैसेज भेजें',
    stop: 'जनरेट करना रोकें',
    notConfigured: 'कॉन्फ़िगर नहीं है',
    messageCount: (n) => plural('hi', n, { other: '{n} मैसेज' }),
    answeringWith: (model) => `${model} से जवाब दिया जा रहा है`,
  },
  ago: {
    justNow: 'अभी-अभी',
    minutes: (n) => plural('hi', n, { other: '{n} मिनट पहले' }),
    hours: (n) => plural('hi', n, { one: '{n} घंटा पहले', other: '{n} घंटे पहले' }),
    days: (n) => plural('hi', n, { other: '{n} दिन पहले' }),
  },
  age: { now: 'अभी', minutes: (n) => `${n} मि॰`, hours: (n) => `${n} घं॰`, days: (n) => `${n} दि॰` },
};

const WEB_SEARCH_MESSAGES: Translations['WEB_SEARCH_MESSAGES'] = { sources: 'स्रोत', working: 'काम चल रहा है' };

const MAIL_THREAD_MESSAGES: Translations['MAIL_THREAD_MESSAGES'] = {
  to: 'प्रति',
  cc: 'Cc',
  bcc: 'Bcc',
  reply: 'जवाब दें',
  replyAll: 'सभी को जवाब दें',
  forward: 'फ़ॉरवर्ड करें',
  more: COMMON_MESSAGES.more,
  moreAddresses: (n) => `${n} और`,
  earlierMessages: (n) => plural('hi', n, { one: '{n} पिछला संदेश', other: '{n} पिछले संदेश' }),
  showTrimmed: 'काटी गई सामग्री दिखाएं',
  hideTrimmed: 'काटी गई सामग्री छिपाएं',
  unread: 'अपठित',
  starred: 'तारांकित',
  star: 'तारांकित करें',
  attachments: 'अटैचमेंट',
  attachmentCount: (n) => plural('hi', n, { other: '{n} अटैचमेंट' }),
  expand: 'संदेश विस्तृत करें',
  collapse: 'संदेश संक्षिप्त करें',
};

const NOTIFICATION_CENTER_MESSAGES: Translations['NOTIFICATION_CENTER_MESSAGES'] = {
  title: 'सूचनाएँ',
  emptyMessage: 'आपने सब कुछ देख लिया है।',
  emptyDescription: 'नई गतिविधि आने पर यहाँ दिखाई देगी।',
  noUnread: 'कोई अपठित सूचना नहीं',
  unread: (n) => plural('hi', n, { other: '{n} अपठित' }),
  markAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',
  category: 'सूचना की श्रेणी',
  tabs: { all: 'सभी', mentions: 'उल्लेख', system: 'सिस्टम' },
  unreadDot: 'अपठित',
};

const CHART_CARDS_MESSAGES: Translations['CHART_CARDS_MESSAGES'] = {
  titles: {
    activity: 'गतिविधि',
    agents: 'एजेंट',
    visitors: 'विज़िटर',
    breakdown: 'विवरण',
    sessions: 'सत्र',
    contributionsThisYear: 'इस साल के योगदान',
    earnedSoFar: 'अब तक की कमाई',
    signUpFunnel: 'साइन-अप फ़नल',
    activeUsers: 'सक्रिय उपयोगकर्ता',
    revenue: 'राजस्व',
    mostActiveDays: 'सबसे सक्रिय दिन',
    orders: 'ऑर्डर',
    trackedTime: 'दर्ज समय',
    revenuePerAccount: 'प्रति खाता राजस्व',
    sleepScore: 'नींद स्कोर',
    pipeline: 'सेल्स पाइपलाइन',
    steps: 'कदम',
    tokens: 'टोकन',
  },
  weekly: 'साप्ताहिक',
  monthly: 'मासिक',
  yearly: 'वार्षिक',
  stepsSuffix: 'कदम',
  today: 'आज',
  thisYear: 'इस साल',
  lastYear: 'पिछला साल',
  sinceLastYear: 'पिछले साल की तुलना में',
  aYearEarlier: 'एक साल पहले',
  earningsPeriod: 'कमाई की अवधि',
  changePeriod: 'अवधि बदलें',
  period: 'अवधि',
  total: 'कुल',
  average: 'औसत',
  thisMonth: 'इस महीने',
  ofGoal: 'लक्ष्य का',
  totalSteps: 'कुल कदम',
  gaugeChart: (title, reading) => `${title} गेज: ${reading}`,
  halfGaugeChart: (title, items) => `${title} अर्ध गेज: ${items}`,
  radialChart: (title, items) => `${title} रेडियल चार्ट: ${items}`,
  percentOfGoal: (pct) => `लक्ष्य का ${pct}%`,
  periodOf: (label) => `${label} की अवधि`,
  chartVs: (title, current, previous) => `${title} चार्ट: ${current} बनाम ${previous}`,
  lineChart: (title) => `${title} लाइन चार्ट`,
  barChart: (title, items) => `${title} बार चार्ट: ${items}`,
  comboChart: (title, bar, line) => `${title} चार्ट: ${bar} बार बनाम ${line} रेखा`,
  scatterChart: (title, series) => `${title} स्कैटर चार्ट: ${series}`,
  bubbleChart: (title, series) => `${title} बबल चार्ट: ${series}`,
  ringItem: (label, value, pct) => `${label} ${value}, लक्ष्य का ${pct}%`,
  scoreOf: (score, max) => `${max} में से ${score}`,
  activityFor: (name, day) => `${day} ${name} की गतिविधि`,
  contributions: (n, date) => { const on = date ? `${date} को ` : ''; return n === 0 ? `${on}कोई योगदान नहीं` : `${on}${n} योगदान`; },
};

const CODE_MESSAGES: Translations['CODE_MESSAGES'] = { copy: 'कोड कॉपी करें', copied: 'कोड कॉपी हो गया' };

const OUTLINE_NAV_MESSAGES: Translations['OUTLINE_NAV_MESSAGES'] = { outline: 'इस पेज पर', progress: (at, of) => `${of} में से शीर्षक ${at}` };

const STEPPER_MESSAGES: Translations['STEPPER_MESSAGES'] = { decrease: 'घटाएँ', increase: 'बढ़ाएँ' };

const CALL_UI_MESSAGES: Translations['CALL_UI_MESSAGES'] = {
  status: {
    calling: 'कॉल किया जा रहा है…',
    ringing: 'घंटी बज रही है',
    connecting: 'कनेक्ट हो रहा है…',
    active: 'कनेक्ट हो गया',
    reconnecting: 'फिर से कनेक्ट हो रहा है…',
    onHold: 'होल्ड पर',
    ended: 'कॉल समाप्त',
  },
  controls: {
    mute: 'म्यूट करें',
    unmute: 'अनम्यूट करें',
    speakerOn: 'स्पीकर चालू करें',
    speakerOff: 'स्पीकर बंद करें',
    videoOn: 'कैमरा चालू करें',
    videoOff: 'कैमरा बंद करें',
    flipCamera: 'कैमरा बदलें',
    screenShareOn: 'स्क्रीन शेयर करें',
    screenShareOff: 'स्क्रीन शेयर करना बंद करें',
    addParticipant: 'प्रतिभागी जोड़ें',
    endCall: 'कॉल समाप्त करें',
  },
  screen: {
    minimise: 'कॉल छोटा करें',
    chat: 'चैट खोलें',
    participants: 'प्रतिभागी',
    movePip: (c) => `अपना वीडियो खिसकाएं (अभी ${callUi_corner(CALL_UI_MESSAGES__CORNERS, c)})`,
  },
  pipCorners: CALL_UI_MESSAGES__CORNERS,
  history: {
    incoming: 'इनकमिंग',
    outgoing: 'आउटगोइंग',
    missed: 'मिस्ड',
    declined: 'अस्वीकृत',
    callBack: (name) => `${name} को वापस कॉल करें`,
  },
  incoming: {
    accept: 'स्वीकार करें',
    decline: 'अस्वीकार करें',
    message: 'संदेश',
    remind: 'मुझे याद दिलाएं',
    slideToAnswer: 'जवाब देने के लिए स्लाइड करें',
    voice: 'इनकमिंग वॉइस कॉल',
    video: 'इनकमिंग वीडियो कॉल',
  },
  returnToCall: 'कॉल पर वापस जाएं',
  returnToCallWith: (name) => `${name} के साथ कॉल पर वापस जाएं`,
  join: 'शामिल हों',
  leave: 'छोड़ें',
  speaking: (name) => `${name} बोल रहे हैं`,
  overflow: (n) => `+${n} और`,
  muted: (name) => `${name}, म्यूट`,
};

const RECENT_HIRES_CARD_MESSAGES: Translations['RECENT_HIRES_CARD_MESSAGES'] = { title: 'हाल की भर्तियाँ' };

const MAIL_LIST_MESSAGES: Translations['MAIL_LIST_MESSAGES'] = {
  draft: 'ड्राफ़्ट:',
  unread: 'अपठित',
  starred: 'तारांकित',
  star: 'तारांकित करें',
  attachment: 'अटैचमेंट है',
  select: 'चुनें',
  threadCount: (n) => plural('hi', n, { other: '{n} संदेश' }),
  moreLabels: (n) => plural('hi', n, { other: 'और {n} लेबल' }),
  selectedCount: (n) => `${n} चुने गए`,
  selectAll: 'सभी चुनें',
  clearSelection: 'चयन हटाएं',
  emptyTitle: 'यहाँ कुछ नहीं है',
  emptyDescription: 'नए ईमेल इस फ़ोल्डर में आते हैं।',
  today: 'आज',
  yesterday: 'कल',
  list: 'मेल',
};

const IMPORTANT_ALERTS_CARD_MESSAGES: Translations['IMPORTANT_ALERTS_CARD_MESSAGES'] = { title: 'महत्वपूर्ण अलर्ट', thisWeek: 'इस सप्ताह' };

const STAT_CARDS_MESSAGES: Translations['STAT_CARDS_MESSAGES'] = { about: (label) => `${label} के बारे में`, fromLastMonth: 'पिछले महीने से' };

const SHAPE_MESSAGES: Translations['SHAPE_MESSAGES'] = {
  shapes: shapes_shapeNames(
    {
      square: 'वर्ग',
      slanted: 'तिरछा',
      arch: 'मेहराब',
      semicircle: 'अर्धवृत्त',
      oval: 'अंडाकार',
      pill: 'गोली',
      triangle: 'त्रिभुज',
      arrow: 'तीर',
      fan: 'पंखा',
      diamond: 'हीरा',
      clamshell: 'सीप',
      pentagon: 'पंचभुज',
      gem: 'रत्न',
      'very-sunny': 'बहुत धूप',
      sunny: 'धूप',
      burst: 'विस्फोट',
      'soft-burst': 'नरम विस्फोट',
      boom: 'धमाका',
      'soft-boom': 'नरम धमाका',
      flower: 'फूल',
      puffy: 'फूला हुआ',
      'puffy-diamond': 'फूला हुआ हीरा',
      'ghost-ish': 'भूत जैसा',
      'pixel-circle': 'पिक्सेल वृत्त',
      'pixel-triangle': 'पिक्सेल त्रिभुज',
      bun: 'बन',
      heart: 'दिल',
    },
    (n) => `${n} भुजाओं वाली कुकी`,
    (n) => `${n} पत्तियों वाला क्लोवर`,
  ),
};

const TENANCY_MESSAGES: Translations['TENANCY_MESSAGES'] = {
  leasePaymentStatus: { upcoming: 'आगामी', due: 'जल्द देय', overdue: 'बकाया', paid: 'भुगतान हो गया' },
  rentPaymentStatus: { paid: 'भुगतान हो गया', pending: 'लंबित', overdue: 'बकाया', partial: 'आंशिक' },
  maintenanceCategory: {
    plumbing: 'प्लंबिंग',
    electrical: 'बिजली',
    appliances: 'उपकरण',
    heating: 'हीटिंग',
    other: 'अन्य',
  },
  maintenancePriority: { low: 'कम प्राथमिकता', medium: 'मध्यम प्राथमिकता', high: 'उच्च प्राथमिकता', urgent: 'अत्यावश्यक' },
  maintenanceStage: { reported: 'रिपोर्ट किया गया', acknowledged: 'स्वीकार किया गया', scheduled: 'निर्धारित', resolved: 'हल हो गया' },
  documentStatus: { signed: 'हस्ताक्षरित', pending: 'हस्ताक्षर लंबित', expired: 'समाप्त' },
  timelineState: { complete: 'पूरा', current: 'जारी है', upcoming: 'अभी नहीं' },
  leasePeriod: 'लीज़ अवधि',
  monthlyRent: 'मासिक किराया',
  deposit: 'जमा राशि',
  nextPayment: 'अगला भुगतान',
  paidThisYear: 'इस वर्ष भुगतान किया गया',
  outstanding: 'बकाया राशि',
  noPayments: 'अभी कोई भुगतान नहीं',
  columns: { month: 'महीना', dueDate: 'देय तिथि', method: 'तरीका', amount: 'राशि', status: 'स्थिति' },
  downloadReceipt: (month) => `${month} की रसीद डाउनलोड करें`,
  dueOn: (date) => `देय ${date}`,
  comments: (n) => plural('hi', n, { one: '{n} टिप्पणी', other: '{n} टिप्पणियाँ' }),
  photo: (position, total) => `फ़ोटो ${position} / ${total}`,
  photoWithAlt: (alt, position, total) => `${alt}, फ़ोटो ${position} / ${total}`,
  sign: 'हस्ताक्षर करें',
  signDocument: (name) => `${name} पर हस्ताक्षर करें`,
  viewDocument: (name) => `${name} देखें`,
  downloadDocument: (name) => `${name} डाउनलोड करें`,
  noDocuments: 'कोई दस्तावेज़ नहीं',
};

const DATA_TABLE_MESSAGES: Translations['DATA_TABLE_MESSAGES'] = {
  selectAll: 'इस पेज की सभी पंक्तियाँ चुनें',
  selectRow: (id) => `पंक्ति ${id} चुनें`,
  densityLabel: 'तालिका का घनत्व',
  density: { md: 'सामान्य', sm: 'संक्षिप्त' },
};

const ERROR_BOUNDARY_MESSAGES: Translations['ERROR_BOUNDARY_MESSAGES'] = { title: 'कुछ गलत हो गया', message: 'एक अनपेक्षित त्रुटि हुई', retry: 'फिर से कोशिश करें' };

const AI_PROFILE_CARD_MESSAGES: Translations['AI_PROFILE_CARD_MESSAGES'] = {
  contributions: 'इस साल के योगदान',
  activity: 'गतिविधि',
  periodGroup: (label) => `${label} की अवधि`,
  periods: { weekly: 'साप्ताहिक', monthly: 'मासिक', yearly: 'वार्षिक' },
};

const BREADCRUMB_MESSAGES: Translations['BREADCRUMB_MESSAGES'] = {
  breadcrumb: 'ब्रेडक्रंब',
};

const MESSAGE_MEDIA_MESSAGES: Translations['MESSAGE_MEDIA_MESSAGES'] = {
  photo: 'फ़ोटो',
  video: 'वीडियो',
  photoOf: (i, total) => `फ़ोटो ${i} / ${total}`,
  videoOf: (i, total) => `वीडियो ${i} / ${total}`,
  tapToView: 'देखने के लिए टैप करें',
  sendingPhoto: 'फ़ोटो भेजी जा रही है',
  sendingVideo: 'वीडियो भेजा जा रहा है',
  sendingAlbum: 'एल्बम भेजा जा रहा है',
  sendingSticker: 'स्टिकर भेजा जा रहा है',
  sendingGif: 'GIF भेजा जा रहा है',
  album: (n) => `एल्बम, ${n} आइटम`,
  sharedMedia: (n) => `शेयर किया गया मीडिया, ${n} आइटम`,
  sharedFiles: (n) => `शेयर की गई फ़ाइलें, ${n} आइटम`,
  moreItems: (n) => `+${n} और`,
  notSent: 'नहीं भेजा गया',
  voiceMessage: (d) => `वॉइस मैसेज, ${d}`,
  playVoiceMessage: 'वॉइस मैसेज चलाएं',
  pauseVoiceMessage: 'वॉइस मैसेज रोकें',
  transcribe: 'टेक्स्ट में बदलें',
  hideTranscript: 'टेक्स्ट छिपाएं',
  seek: 'प्लेबैक स्थिति',
  seekPosition: (p, d) => `${p} / ${d}`,
  playbackSpeed: (r) => `प्लेबैक स्पीड, ${r}`,
  unplayed: 'नहीं सुना गया',
  download: 'डाउनलोड करें',
  downloaded: 'डाउनलोड हो गया',
  file: 'फ़ाइल',
  fileKinds: {
    pdf: 'PDF',
    doc: 'दस्तावेज़',
    sheet: 'स्प्रेडशीट',
    slides: 'प्रेज़ेंटेशन',
    zip: 'ZIP',
    audio: 'ऑडियो',
    video: 'वीडियो',
    image: 'इमेज',
    code: 'कोड',
  },
  contact: 'संपर्क',
  message: 'मैसेज करें',
  add: 'जोड़ें',
  location: 'जगह',
  liveLocation: 'लाइव जगह',
  stopSharing: 'शेयर करना बंद करें',
  vote: 'वोट करें',
  viewResults: 'नतीजे देखें',
  anonymousVoting: 'गुमनाम वोटिंग',
  quiz: 'क्विज़',
  selectOne: 'एक चुनें',
  selectOneOrMore: 'एक या ज़्यादा चुनें',
  correctAnswer: 'सही उत्तर',
  yourAnswer: 'आपका उत्तर',
  votes: (n) => (n === 0 ? 'कोई वोट नहीं' : `${n} वोट`),
  sticker: 'स्टिकर',
};

const PIPELINE_MESSAGES: Translations['PIPELINE_MESSAGES'] = {
  health: { 'on-track': 'सही दिशा में', 'at-risk': 'जोखिम में', stalled: 'अटकी हुई' },
  stalledFor: (duration) => `${duration} से अटकी हुई`,
  move: (title) => `${title} को ले जाएँ`,
  stages: 'पाइपलाइन चरण',
  stageWithCount: (name, n) => `${name}, ${plural('hi', n, { one: '{n} डील', other: '{n} डील' })}`,
  empty: 'इस चरण में कोई डील नहीं',
  loadMore: 'और लोड करें',
};

const STAY_SEARCH_MESSAGES: Translations['STAY_SEARCH_MESSAGES'] = {
  where: 'कहाँ',
  checkIn: 'चेक-इन',
  checkOut: 'चेक-आउट',
  when: 'कब',
  who: 'कौन',
  destinationPlaceholder: 'गंतव्य खोजें',
  datesPlaceholder: 'तारीखें जोड़ें',
  guestsPlaceholder: 'मेहमान जोड़ें',
  guests: { adults: 'वयस्क', children: 'बच्चे', infants: 'शिशु', pets: 'पालतू जानवर' },
  guestDescriptions: {
    adults: '13 वर्ष या उससे अधिक',
    children: '2 – 12 वर्ष',
    infants: '2 वर्ष से कम',
    pets: 'क्या आप सर्विस एनिमल ला रहे हैं?',
  },
  dateFlexibility: 'तारीखों में लचीलापन',
  exactDates: 'सटीक तारीखें',
  plusMinusDays: (n) => plural('hi', n, { one: '± {n} दिन', other: '± {n} दिन' }),
  destinations: 'गंतव्य',
  whereTo: 'कहाँ जाना है?',
  filters: 'फ़िल्टर',
};

const AUTH_CARD_MESSAGES: Translations['AUTH_CARD_MESSAGES'] = {
  modes: {
    signin: {
      title: 'फिर से स्वागत है',
      description: 'जहाँ छोड़ा था, वहीं से जारी रखने के लिए साइन इन करें।',
      cta: 'साइन इन करें',
      switchLead: 'यहाँ नए हैं?',
      switchAction: 'खाता बनाएँ',
    },
    signup: {
      title: 'अपना खाता बनाएँ',
      description: 'कुछ ही मिनटों में शुरू करें।',
      cta: 'खाता बनाएँ',
      switchLead: 'क्या आपका पहले से खाता है?',
      switchAction: 'साइन इन करें',
    },
    verify: {
      title: 'अपना इनबॉक्स देखें',
      description: 'साइन इन पूरा करने के लिए हमारा भेजा गया कोड दर्ज करें।',
      cta: 'सत्यापित करें और जारी रखें',
      switchLead: 'कोड नहीं मिला?',
      switchAction: 'नया कोड भेजें',
    },
  },
  codeSentTo: (email) => `साइन इन पूरा करने के लिए ${email} पर भेजा गया कोड दर्ज करें।`,
  verificationCode: 'सत्यापन कोड',
  fullName: 'पूरा नाम',
  namePlaceholder: 'प्रिया शर्मा',
  email: 'ईमेल',
  emailPlaceholder: 'aap@company.com',
  emailHint: 'हम इसका उपयोग आपसे संपर्क करने के लिए करते हैं और इसे कभी साझा नहीं करते।',
  password: 'पासवर्ड',
  passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
  newPasswordPlaceholder: 'कम से कम 8 वर्ण',
  confirmPassword: 'पासवर्ड की पुष्टि करें',
  confirmPasswordPlaceholder: 'पासवर्ड दोबारा दर्ज करें',
  rememberMe: 'मुझे याद रखें',
  forgotPassword: 'पासवर्ड भूल गए?',
  terms: 'खाता बनाकर आप हमारी सेवा की शर्तों और गोपनीयता नीति से सहमत होते हैं।',
  orContinueWith: 'या इसके साथ जारी रखें',
};

const TRACK_LIST_MESSAGES: Translations['TRACK_LIST_MESSAGES'] = {
  title: 'शीर्षक',
  album: 'एल्बम',
  dateAdded: 'जोड़ने की तारीख',
  plays: 'प्ले',
  duration: 'अवधि',
  moveUp: 'ऊपर ले जाएं',
  moveDown: 'नीचे ले जाएं',
  reorder: 'क्रम बदलें',
  downloaded: 'डाउनलोड किया गया',
  unavailable: 'उपलब्ध नहीं',
  tracks: 'ट्रैक',
  episodes: 'एपिसोड',
  selected: (n) => plural('hi', n, { one: '{n} चुना गया', other: '{n} चुने गए' }),
  clearSelection: 'चयन हटाएं',
  played: 'चलाया गया',
  listened: 'सुना गया',
  saveEpisode: 'एपिसोड सहेजें',
  downloadEpisode: 'एपिसोड डाउनलोड करें',
  minutes: (m) => `${m} मिनट`,
  hours: (h) => `${h} घंटा`,
  hoursMinutes: (h, m) => `${h} घंटा ${m} मिनट`,
  remaining: (l) => `${l} बाकी`,
};

const LYRICS_MESSAGES: Translations['LYRICS_MESSAGES'] = {
  lyrics: 'बोल',
  showLyrics: 'बोल दिखाएं',
  backToCurrent: 'मौजूदा पंक्ति पर वापस जाएं',
  empty: 'इस ट्रैक के बोल उपलब्ध नहीं हैं',
};

const ACTIVITY_FEED_MESSAGES: Translations['ACTIVITY_FEED_MESSAGES'] = {
  kinds: { call: 'कॉल', email: 'ईमेल', meeting: 'मीटिंग', note: 'नोट', 'stage-change': 'चरण बदला', task: 'कार्य पूरा' },
  empty: 'अभी तक कुछ दर्ज नहीं हुआ',
  loggedBy: (name) => `${name} द्वारा दर्ज`,
  filterActivity: 'गतिविधि फ़िल्टर करें',
};

const PLACE_REVIEWS_MESSAGES: Translations['PLACE_REVIEWS_MESSAGES'] = {
  depositReturned: 'जमा राशि लौटाई गई',
  depositNotReturned: 'जमा राशि नहीं लौटाई गई',
  recommend: 'सुझाऊँगा',
  notRecommend: 'नहीं सुझाऊँगा',
  helpful: 'मददगार',
  report: 'रिपोर्ट करें',
  promptTitle: 'क्या आप यहाँ रहे हैं?',
  promptDescription: (building) =>
    `${building} के भावी किरायेदारों की मदद करें। समीक्षाएँ गुमनाम होती हैं।`,
  writeReview: 'समीक्षा लिखें',
  reviewCount: (n) => plural('hi', n, { one: '{n} समीक्षा', other: '{n} समीक्षाएँ' }),
  depositRate: (percent) => `${percent}% किरायेदारियों में जमा राशि लौटाई गई`,
  recommendRate: (percent) => `${percent}% यहाँ रहने की सलाह देंगे`,
};

const DELIVERY_SLOT_MESSAGES: Translations['DELIVERY_SLOT_MESSAGES'] = {
  tiers: { standard: 'सामान्य', express: 'एक्सप्रेस' },
  soldOut: 'भर गया',
  asap: 'जितनी जल्दी हो सके',
  field: 'डिलीवरी का समय',
  day: 'दिन',
  emptyTitle: 'कोई स्लॉट नहीं बचा',
  emptyDescription: 'कोई और दिन चुनें, या अगला उपलब्ध कूरियर लें।',
};

const PLACE_LIST_MESSAGES: Translations['PLACE_LIST_MESSAGES'] = {
  visibility: { private: 'निजी', shared: 'शेयर की गई', public: 'सार्वजनिक' },
  places: (n) => plural('hi', n, { one: '{n} जगह', other: '{n} जगहें' }),
  sharedWith: (n) => plural('hi', n, { one: '{n} व्यक्ति के साथ शेयर की गई', other: '{n} लोगों के साथ शेयर की गई' }),
  labels: {
    moveEarlier: (position) => `स्थान ${position - 1} पर ले जाएँ`,
    moveLater: (position) => `स्थान ${position + 1} पर ले जाएँ`,
    remove: (name) => `${name} को सूची से निकालें`,
    moved: (name, position, total) => `${name} को ${total} में से स्थान ${position} पर ले जाया गया`,
    note: 'नोट',
  },
  savedPlaces: 'सहेजी गई जगहें',
};

const HOME_SEARCH_MESSAGES: Translations['HOME_SEARCH_MESSAGES'] = {
  modes: { rent: 'किराया', buy: 'खरीदें', stays: 'छुट्टियों के लिए किराया', swap: 'अदला-बदली' },
  searchMode: 'खोज मोड',
  location: 'स्थान',
  locationPlaceholder: 'शहर या इलाका खोजें',
  moveIn: 'शिफ़्टिंग',
  datePlaceholder: 'तारीख जोड़ें',
  budget: 'बजट',
  budgetPlaceholder: 'बजट जोड़ें',
  price: 'कीमत',
  pricePlaceholder: 'कोई भी कीमत',
  propertyType: 'प्रॉपर्टी का प्रकार',
  propertyTypePlaceholder: 'कोई भी प्रकार',
  dates: 'तारीखें',
  homeSize: 'घर का आकार',
  homeSizePlaceholder: 'कोई भी आकार',
  minimum: 'न्यूनतम',
  maximum: 'अधिकतम',
  budgetPresets: 'बजट की सीमाएँ',
  monthlyBudget: 'मासिक बजट',
  monthlyBudgetDescription: 'हर महीने का किराया, बिलों के बिना',
  totalPriceDescription: 'कुल कीमत',
  upTo: (amount) => `${amount} तक`,
  any: 'कोई भी',
  moveInLabels: {
    date: 'शिफ़्ट होने की तारीख',
    flexible: 'लचीला',
    asap: 'जितनी जल्दी हो सके',
    contractLength: 'अनुबंध की अवधि',
  },
  contractLengths: { any: 'कोई भी', short: '1–6 महीने', medium: '6–12 महीने', long: '1 साल से ज़्यादा' },
  saveSearch: 'खोज सहेजें',
  saved: 'सहेजी गई',
  newCount: (n) => plural('hi', n, { one: '{n} नया', other: '{n} नए' }),
  alertsOff: 'अलर्ट बंद',
  actionOn: (action, subject) => `${subject}: ${action}`,
};

const OFFERING_BADGE_MESSAGES: Translations['OFFERING_BADGE_MESSAGES'] = { offerings: { long_term_rent: 'किराए पर', sale: 'बिक्री के लिए', short_term_rent: 'छुट्टियों का किराया', exchange: 'अदला-बदली' } };

const MAP_ATTRIBUTION_MESSAGES: Translations['MAP_ATTRIBUTION_MESSAGES'] = { scale: 'पैमाना', mapData: 'मानचित्र डेटा' };

const SLIDER_MESSAGES: Translations['SLIDER_MESSAGES'] = { minimum: 'न्यूनतम', maximum: 'अधिकतम', value: (n) => `मान ${n}` };

const SELECT_MESSAGES: Translations['SELECT_MESSAGES'] = { selectOption: 'कोई विकल्प चुनें', scrollUp: 'ऊपर स्क्रॉल करें', scrollDown: 'नीचे स्क्रॉल करें' };

const ZOOMABLE_MEDIA_GALLERY_MESSAGES: Translations['ZOOMABLE_MEDIA_GALLERY_MESSAGES'] = {
  close: 'मीडिया व्यूअर बंद करें',
  previous: 'पिछला आइटम',
  next: 'अगला आइटम',
  goTo: (i, n) => `${n} में से आइटम ${i} पर जाएं`,
  share: 'मीडिया शेयर करें',
};

const NOTIFICATION_MESSAGES: Translations['NOTIFICATION_MESSAGES'] = { dismiss: 'सूचना हटाएँ' };

const PHONE_INPUT_MESSAGES: Translations['PHONE_INPUT_MESSAGES'] = { phoneNumber: 'फ़ोन नंबर', countryCode: 'देश कोड' };

const VENDOR_CARD_MESSAGES: Translations['VENDOR_CARD_MESSAGES'] = {
  facts: { deliveryTime: 'डिलीवरी का समय', deliveryFee: 'डिलीवरी', distance: 'दूरी', minimumOrder: 'न्यूनतम ऑर्डर' },
  availability: { paused: 'रुका हुआ', closed: 'बंद' },
  new: 'नया',
  rated: (value, reviews) =>
    `5 में से ${value} रेटिंग${vendorCard_has(reviews) ? `, ${vendorCard_counted('hi', reviews, { one: '{n} समीक्षा', other: '{n} समीक्षाएँ' })}` : ''}`,
};

const CHAT_INDICATORS_MESSAGES: Translations['CHAT_INDICATORS_MESSAGES'] = {
  presence: { online: 'ऑनलाइन', idle: 'दूर', offline: 'ऑफ़लाइन', busy: 'व्यस्त' },
  status: { sending: 'भेजा जा रहा है…', sent: 'भेजा गया', delivered: 'डिलीवर हुआ', read: 'पढ़ा गया', failed: 'नहीं भेजा गया' },
  unread: 'अपठित',
  unreadCount: (n) => plural('hi', n, { one: '{n} अपठित संदेश', other: '{n} अपठित संदेश' }),
};

const MEDIA_CONTROLS_MESSAGES: Translations['MEDIA_CONTROLS_MESSAGES'] = {
  play: 'चलाएं',
  pause: 'रोकें',
  playSubject: (s) => `${s} चलाएं`,
  pauseSubject: (s) => `${s} रोकें`,
  saveToLibrary: 'अपनी लाइब्रेरी में सहेजें',
  saveSubjectToLibrary: (s) => `${s} को अपनी लाइब्रेरी में सहेजें`,
  explicit: 'अश्लील सामग्री',
  seek: 'प्लेबैक की स्थिति',
  seekValue: (a, b) => `${b} में से ${a}`,
  mute: 'म्यूट करें',
  unmute: 'अनम्यूट करें',
  volume: 'वॉल्यूम',
  nowPlaying: 'अभी चल रहा है',
};

const INPUT_OTP_MESSAGES: Translations['INPUT_OTP_MESSAGES'] = {
  oneTimeCode: 'वन-टाइम कोड',
  digitOf: (i, n) => `${n} में से अंक ${i}`,
  characterOf: (i, n) => `${n} में से वर्ण ${i}`,
};

const PLACE_DETAILS_MESSAGES: Translations['PLACE_DETAILS_MESSAGES'] = {
  infoActions: { call: 'कॉल करें', open: 'वेबसाइट खोलें', directions: 'दिशा-निर्देश' },
  busy: {
    busier: 'सामान्य से ज़्यादा भीड़',
    typical: 'आम दिनों जितनी भीड़',
    quieter: 'सामान्य से कम भीड़',
  },
  transitModes: {
    bus: 'बस स्टॉप',
    metro: 'मेट्रो स्टेशन',
    train: 'रेलवे स्टेशन',
    tram: 'ट्राम स्टॉप',
    ferry: 'फ़ेरी टर्मिनल',
  },
  notAvailable: 'उपलब्ध नहीं',
  amenities: 'सुविधाएँ',
  today: 'आज',
  closed: 'बंद',
  openingHours: 'खुलने का समय',
  day: 'दिन',
  noDataForDay: 'इस दिन का कोई डेटा नहीं',
  chartNoData: (day) => `${day}, कोई डेटा नहीं`,
  chartClosed: (day) => `${day}, पूरे दिन बंद`,
  chartPeak: (day, hour) => `${day}, सबसे ज़्यादा भीड़ ${hour} बजे`,
  chartNow: (hour) => `अभी ${hour}`,
  live: 'लाइव',
  noDepartures: 'अभी कोई प्रस्थान नहीं',
  nearbyTransit: 'आस-पास का सार्वजनिक परिवहन',
  lines: 'लाइनें',
  line: (name) => `लाइन ${name}`,
  towards: (headsign) => `${headsign} की ओर`,
};

const APP_SHELL_MESSAGES: Translations['APP_SHELL_MESSAGES'] = {
  openNavigation: 'नेविगेशन खोलें',
  closeNavigation: 'नेविगेशन बंद करें',
  resizePanes: 'पैन का आकार बदलें',
  notifications: 'सूचनाएँ',
  proOffer: 'Pro ऑफ़र',
};

const ROUTE_STOPS_MESSAGES: Translations['ROUTE_STOPS_MESSAGES'] = {
  routeStops: 'रूट के स्टॉप',
  origin: 'शुरुआती जगह',
  destination: 'मंज़िल',
  stop: (position) => `स्टॉप ${position}`,
  swap: 'शुरुआती जगह और मंज़िल की अदला-बदली करें',
  addStop: 'स्टॉप जोड़ें',
  removeStop: (title) => `${title} निकालें`,
  state: { reached: 'पहुँच गए', current: 'मौजूदा स्टॉप', pending: 'नहीं पहुँचे' },
};

const SEARCH_MESSAGES: Translations['SEARCH_MESSAGES'] = { clearQuery: 'खोज क्वेरी साफ़ करें' };

const TAG_FIELD_MESSAGES: Translations['TAG_FIELD_MESSAGES'] = { remove: (t) => `${t} हटाएँ`, full: (n) => `अधिकतम ${n}`, suggestions: 'सुझाव' };

const STAY_FILTERS_MESSAGES: Translations['STAY_FILTERS_MESSAGES'] = {
  propertyTypes: {
    apartment: 'अपार्टमेंट',
    house: 'मकान',
    room: 'कमरा',
    studio: 'स्टूडियो',
    duplex: 'डुप्लेक्स / पेंटहाउस',
    coliving: 'को-लिविंग',
    hostel: 'हॉस्टल',
    other: 'ज़मीन / अन्य',
  },
  features: {
    elevator: 'लिफ़्ट',
    parking: 'पार्किंग',
    terrace: 'टैरेस',
    garden: 'बगीचा',
    pool: 'स्विमिंग पूल',
    furnished: 'फ़र्निश्ड',
    pets: 'पालतू जानवरों की अनुमति',
    airConditioning: 'एयर कंडीशनिंग',
    heating: 'हीटिंग',
    accessible: 'दिव्यांगजन के लिए सुलभ',
    storage: 'स्टोर रूम',
  },
  floors: { ground: 'भूतल', middle: 'बीच की मंज़िल', top: 'सबसे ऊपरी मंज़िल', elevator: 'लिफ़्ट के साथ' },
  minimum: 'न्यूनतम',
  maximum: 'अधिकतम',
  priceRange: 'कीमत की सीमा',
  area: 'क्षेत्रफल',
  featuresGroup: 'सुविधाएँ',
  floor: 'मंज़िल',
  propertyType: 'प्रॉपर्टी का प्रकार',
  energyRating: 'ऊर्जा रेटिंग',
  anyRating: 'कोई भी रेटिंग',
  ratingOnly: (r) => `केवल ${r}`,
  ratingAndBetter: (r) => `${r} या बेहतर`,
  filters: 'फ़िल्टर',
  filtersApplied: (label, n) => `${label}, ${n} लागू`,
  clearAll: 'सभी हटाएँ',
  any: 'कोई भी',
  availableNow: 'अभी उपलब्ध',
  availableNowDescription: 'आज ही शिफ़्ट होने के लिए तैयार',
  availableFrom: 'कब से उपलब्ध',
  anyDate: 'कोई भी तारीख',
};

const SETTINGS_MODAL_MESSAGES: Translations['SETTINGS_MODAL_MESSAGES'] = {
  dialog: 'सेटिंग्स',
  nav: 'सेटिंग्स के सेक्शन',
  close: 'सेटिंग्स बंद करें',
  saved: 'सेव हो गया',
  currentPlan: 'मौजूदा प्लान',
  actions: 'कार्रवाइयां',
  storage: {
    storedIn: 'संग्रहीत',
    fileCount: (n, shown) => plural('hi', n, { one: `${shown} फ़ाइल`, other: `${shown} फ़ाइलें` }),
    filterByType: 'फ़ाइल के प्रकार से फ़िल्टर करें',
    fileType: 'फ़ाइल का प्रकार',
    orderBy: 'क्रम',
    modified: 'बदलाव की तारीख',
    oldestFirst: 'सबसे पुरानी पहले',
    searchFiles: 'फ़ाइलें खोजें',
    selectAllOnPage: 'इस पेज की सभी फ़ाइलें चुनें',
    fileName: 'फ़ाइल का नाम',
    uploadedOn: 'अपलोड की तारीख',
    fileSize: 'फ़ाइल का साइज़',
    sortBy: { name: 'फ़ाइल के नाम के हिसाब से क्रमबद्ध करें', uploadedAt: 'अपलोड की तारीख के हिसाब से क्रमबद्ध करें', size: 'फ़ाइल के साइज़ के हिसाब से क्रमबद्ध करें' },
    selectFile: (name) => `${name} चुनें`,
    deleteFile: 'फ़ाइल हटाएं',
    deleteNamed: (name) => `${name} हटाएं`,
    noMatches: 'आपके फ़िल्टर से कोई फ़ाइल मेल नहीं खाती।',
    documents: 'दस्तावेज़',
    spreadsheets: 'स्प्रेडशीट',
    videos: 'वीडियो',
    downloadFile: 'फ़ाइल डाउनलोड करें',
    rename: 'नाम बदलें',
    copyLink: 'लिंक कॉपी करें',
  },
  tools: {
    showOutput: 'आउटपुट दिखाएं',
    refreshTools: 'टूल रीफ़्रेश करें',
    removeServer: 'सर्वर निकालें',
    logout: 'लॉग आउट',
    logOutOf: (server) => `${server} से लॉग आउट करें`,
    showTools: (server) => `${server} के टूल दिखाएं`,
    hideTools: (server) => `${server} के टूल छिपाएं`,
    error: 'गड़बड़ी',
    showOutputLink: 'आउटपुट दिखाएं',
    showOutputOf: (server) => `${server} का आउटपुट दिखाएं`,
    newServer: 'नया MCP सर्वर',
    newServerDescription: 'कस्टम MCP सर्वर जोड़ें',
    projectScope: 'प्रोजेक्ट का दायरा',
    authentication: 'प्रमाणीकरण',
    waitForAuth: 'MCP प्रमाणीकरण का इंतज़ार करें',
    waitForAuthDescription:
      'पूछे जाने पर प्रमाणीकरण के लिए बिना समय सीमा के इंतज़ार करें। बंद होने पर, 30 सेकंड के बाद प्रमाणीकरण के अनुरोध छोड़ दिए जाते हैं।',
    waitForAuthSwitch: 'MCP प्रमाणीकरण का इंतज़ार करें',
    scopeServers: (scope) => `${scope} के MCP सर्वर`,
    scopeServersDescription: (scope) => `${scope} में उपलब्ध सर्वर।`,
    teamServers: 'टीम के MCP सर्वर',
    teamServersDescription: 'डैशबोर्ड में कॉन्फ़िगर किए गए',
    manage: 'मैनेज करें',
    noTeamServers: 'टीम का कोई MCP सर्वर नहीं है',
    noTeamServersBody: 'MCP सर्वर को डेस्कटॉप और क्लाउड पर उपलब्ध कराने के लिए उन्हें डैशबोर्ड में कॉन्फ़िगर करें।',
    configureTeam: 'टीम के MCP सर्वर कॉन्फ़िगर करें',
    pluginServers: 'प्लगइन के MCP सर्वर',
  },
};

const EVICTION_MESSAGES: Translations['EVICTION_MESSAGES'] = {
  status: {
    scheduled: 'निर्धारित',
    postponed: 'स्थगित',
    suspended: 'निलंबित',
    executed: 'लागू किया गया',
    cancelled: 'रद्द',
  },
  attend: 'मैं वहाँ रहूँगा',
  share: 'शेयर करें',
  contactSupport: 'सहायता समूह से संपर्क करें',
  verified: 'समुदाय द्वारा सत्यापित',
  caseHistory: 'मामले का इतिहास',
  source: (source) => `स्रोत: ${source}`,
};

const BOOKING_MESSAGES: Translations['BOOKING_MESSAGES'] = {
  checkIn: 'चेक-इन',
  checkOut: 'चेक-आउट',
  guests: 'मेहमान',
  addDate: 'तारीख जोड़ें',
  reserve: 'आरक्षित करें',
  checkAvailability: 'उपलब्धता देखें',
  notChargedYet: 'अभी आपसे कोई शुल्क नहीं लिया जाएगा',
  total: 'कुल',
  tripStatus: { confirmed: 'पुष्ट', pending: 'लंबित', cancelled: 'रद्द', completed: 'पूरा हुआ' },
  priceName: booking_priceName((p, u) => `${p} प्रति ${u}`, (s, o) => `${s}, पहले ${o}`),
};

const AGENT_LIMITS_CARD_MESSAGES: Translations['AGENT_LIMITS_CARD_MESSAGES'] = { contextWindow: 'कॉन्टेक्स्ट विंडो', freeSpace: 'खाली जगह', planUsageLimits: 'प्लान की उपयोग सीमाएं', managePlan: 'प्लान प्रबंधित करें' };

const SWIPE_ROW_MESSAGES: Translations['SWIPE_ROW_MESSAGES'] = {
  closeActions: 'कार्रवाइयां बंद करें',
};

const PATIENT_INFO_CARD_MESSAGES: Translations['PATIENT_INFO_CARD_MESSAGES'] = { addPhoto: 'प्रोफ़ाइल फ़ोटो जोड़ें' };

const THEME_TOGGLE_MESSAGES: Translations['THEME_TOGGLE_MESSAGES'] = { theme: 'थीम', darkMode: 'डार्क मोड', lightMode: 'लाइट मोड', useDarkMode: 'डार्क मोड इस्तेमाल करें', useLightMode: 'लाइट मोड इस्तेमाल करें' };

const EARNINGS_MESSAGES: Translations['EARNINGS_MESSAGES'] = {
  earned: 'कमाई',
  period: 'कमाई की अवधि',
  breakdown: 'कहाँ से आई',
  payout: 'अगला भुगतान',
  payoutState: { scheduled: 'निर्धारित', processing: 'रास्ते में', paid: 'भुगतान हो गया', held: 'रोका गया', failed: 'विफल' },
  chart: (label) => `${label} की कमाई, अवधि के अनुसार`,
  empty: 'अभी तक कोई कमाई नहीं',
  earnings: 'कमाई',
};

const PROOF_OF_DELIVERY_MESSAGES: Translations['PROOF_OF_DELIVERY_MESSAGES'] = {
  labels: {
    signature: 'हस्ताक्षर',
    signaturePad: 'हस्ताक्षर क्षेत्र',
    signatureHint: 'उंगली से हस्ताक्षर करें',
    signed: 'हस्ताक्षर हो गए',
    clear: 'हस्ताक्षर मिटाएँ',
    typeName: 'या अपना नाम लिखें',
    typeNamePlaceholder: 'पूरा नाम',
    photo: 'फ़ोटो',
    photoHint: 'जहाँ आपने छोड़ा, या प्राप्तकर्ता के साथ पार्सल।',
    code: 'डिलीवरी कोड',
    codeHint: 'प्राप्तकर्ता से उनके ऐप में दिखा कोड पढ़ने को कहें।',
    recipient: 'किसने लिया',
    recipientPlaceholder: 'नाम',
    note: 'नोट',
    notePlaceholder: 'दर्ज करने लायक कुछ भी',
    submit: 'डिलीवरी की पुष्टि करें',
    required: 'ज़रूरी',
    missing: 'पुष्टि करने से पहले यह ज़रूरी है।',
    missingSummary: (n) => plural('hi', n, { one: 'अभी {n} चीज़ बाकी है', other: 'अभी {n} चीज़ें बाकी हैं' }),
  },
  proofOfDelivery: 'डिलीवरी का प्रमाण',
};

const FILE_UPLOAD_MESSAGES: Translations['FILE_UPLOAD_MESSAGES'] = {
  promptWeb: 'अपलोड करने के लिए खींचें और छोड़ें या',
  promptNative: 'टैप करके',
  selectWeb: 'चुनें',
  selectNative: 'फ़ाइल चुनें',
  uploading: (size) => `${size} अपलोड हो रहा है...`,
  uploaded: 'सफलतापूर्वक अपलोड हो गया!',
  unsupported: (extensions) => `केवल ${extensions} फ़ाइलें समर्थित हैं`,
  tooLarge: (max) => `यह फ़ाइल ${max} से बड़ी है`,
  max: (size) => `(अधिकतम ${size})`,
  uploadFile: 'फ़ाइल अपलोड करें',
};

const POPOVER_MESSAGES: Translations['POPOVER_MESSAGES'] = {
  popover: 'पॉपओवर',
};

const QUEUE_PANEL_MESSAGES: Translations['QUEUE_PANEL_MESSAGES'] = {
  queueTab: 'कतार',
  recentTab: 'हाल ही में चलाए गए',
  close: 'कतार बंद करें',
  nextInQueue: 'कतार में आगे',
  nextFrom: (c) => `${c} से आगे`,
  nextUp: 'आगे आने वाले',
  clearQueue: 'कतार खाली करें',
  reorder: (t) => `${t} का क्रम बदलें`,
  reorderHint: 'खींचें या तीर कुंजियों का इस्तेमाल करें',
  moveUp: 'ऊपर ले जाएं',
  moveDown: 'नीचे ले जाएं',
  remove: 'कतार से निकालें',
  moved: (t, p, n) => `${t} को ${n} में से ${p} स्थान पर ले जाया गया`,
  emptyQueue: 'आपकी कतार खाली है',
  emptyQueueHint: 'गाने और एपिसोड जोड़ें ताकि वे आगे चलें।',
  emptyRecent: 'अभी तक कुछ नहीं चलाया गया',
};

const HOVER_CARD_MESSAGES: Translations['HOVER_CARD_MESSAGES'] = {
  hoverCard: 'पूर्वावलोकन कार्ड',
};

const NOTE_EDITOR_MESSAGES: Translations['NOTE_EDITOR_MESSAGES'] = {
  header: {
    saved: 'सहेजा गया',
    saving: 'सहेजा जा रहा है…',
    offline: 'ऑफ़लाइन — बदलाव रखे गए हैं',
    error: 'सहेजा नहीं गया',
    words: (n) => plural('hi', n, { other: '{n} शब्द' }),
    title: 'शीर्षक',
  },
  untitled: 'शीर्षकहीन',
  note: 'नोट',
  toolbar: { more: 'और फ़ॉर्मैटिंग', moreMenu: 'और फ़ॉर्मैटिंग' },
};

const MEDIA_SHELF_MESSAGES: Translations['MEDIA_SHELF_MESSAGES'] = { filters: 'फ़िल्टर', showAll: 'सभी दिखाएं' };

const CATEGORY_BAR_MESSAGES: Translations['CATEGORY_BAR_MESSAGES'] = { previous: 'पिछली श्रेणियाँ', next: 'अगली श्रेणियाँ' };

const CARRIER_QUOTE_MESSAGES: Translations['CARRIER_QUOTE_MESSAGES'] = {
  labels: {
    accept: 'स्वीकार करें',
    message: 'संदेश',
    decline: 'अस्वीकार करें',
    pickup: 'पिक-अप',
    eta: 'पहुँचेगा',
    vehicle: 'वाहन',
    jobs: (jobs) => `${jobs} काम`,
    verified: 'सत्यापित वाहक',
    marks: { cheapest: 'सबसे सस्ता', fastest: 'सबसे तेज़' },
    showPrice: 'कीमत का विवरण दिखाएं',
    hidePrice: 'कीमत का विवरण छिपाएं',
    priceDetails: 'कीमत का विवरण:',
    sort: 'ऑफ़र क्रमबद्ध करें',
    sortOptions: { price: 'सबसे सस्ते', eta: 'सबसे तेज़', rating: 'सबसे अच्छी रेटिंग' },
    count: (n) => `${n} ऑफ़र`,
    loading: 'ऑफ़र लोड हो रहे हैं',
  },
  emptyTitle: 'अभी कोई ऑफ़र नहीं',
  emptyDescription: 'वाहक आपका काम देख रहे हैं। पहले ऑफ़र आमतौर पर कुछ ही मिनटों में आ जाते हैं।',
  list: 'ऑफ़र',
  priceDetailsFor: (name) => `${name} की कीमत का विवरण`,
};

const TEXT_FIELD_MESSAGES: Translations['TEXT_FIELD_MESSAGES'] = { showPassword: 'पासवर्ड दिखाएँ', hidePassword: 'पासवर्ड छिपाएँ', required: 'आवश्यक' };

const CHAT_SCREEN_MESSAGES: Translations['CHAT_SCREEN_MESSAGES'] = {
  call: 'कॉल करें',
  videoCall: 'वीडियो कॉल',
  searchInConversation: 'बातचीत में खोजें',
  connecting: 'कनेक्ट हो रहा है…',
  verified: 'सत्यापित',
  bot: 'बॉट',
  channel: 'चैनल',
  clearSelection: 'चयन हटाएं',
  forward: 'फ़ॉरवर्ड करें',
  pin: 'पिन करें',
  selectedCount: (n) => `${n} चयनित`,
  pinnedList: 'पिन किए गए संदेश दिखाएं',
  pinnedClose: 'पिन बार छिपाएं',
  pinnedUnpin: 'इस संदेश को अनपिन करें',
  pinnedMessage: 'पिन किया गया संदेश',
  pinnedMessageNumber: (n) => `पिन किया गया संदेश #${n}`,
  scrollToBottom: 'नवीनतम संदेशों पर जाएं',
  jumpToMention: 'उल्लेख पर जाएं',
  emptyTitle: 'अभी तक कोई संदेश नहीं',
  info: 'जानकारी',
  members: 'सदस्य',
  addMember: 'सदस्य जोड़ें',
  memberSearch: 'सदस्य खोजें',
  noMembers: 'कोई सदस्य नहीं मिला',
  owner: 'स्वामी',
  admin: 'एडमिन',
  resizeList: 'बातचीत सूची का आकार बदलें',
};

const CONTEXT_MENU_MESSAGES: Translations['CONTEXT_MENU_MESSAGES'] = {
  contextMenu: 'संदर्भ मेन्यू',
};

const SORTABLE_MEDIA_MESSAGES: Translations['SORTABLE_MEDIA_MESSAGES'] = {
  photo: (p, t) => `${t} में से फ़ोटो ${p}`,
  cover: 'कवर',
  moveEarlier: (p) => `फ़ोटो ${p} को पहले ले जाएं`,
  moveLater: (p) => `फ़ोटो ${p} को बाद में ले जाएं`,
  remove: (p) => `फ़ोटो ${p} हटाएं`,
  retry: (p) => `फ़ोटो ${p} फिर से अपलोड करें`,
  uploading: (p) => `फ़ोटो ${p} अपलोड हो रही है`,
  failed: 'अपलोड नहीं हो सका',
  add: 'फ़ोटो जोड़ें',
  moved: (p, t) => `${t} में से स्थान ${p} पर ले जाया गया`,
  photos: 'फ़ोटो',
};

const CONNECTION_DOTS_MESSAGES: Translations['CONNECTION_DOTS_MESSAGES'] = {
  connecting: 'कनेक्ट हो रहा है',
};

const CHAT_PEOPLE_MESSAGES: Translations['CHAT_PEOPLE_MESSAGES'] = {
  newGroup: {
    photo: 'ग्रुप फ़ोटो चुनें',
    name: 'ग्रुप का नाम',
    namePlaceholder: 'इस ग्रुप को नाम दें',
    description: 'विवरण',
    descriptionPlaceholder: 'यह ग्रुप किस लिए है?',
    members: (n) => `${n} सदस्य`,
    addMembers: 'सदस्य जोड़ें',
    remove: (name) => `${name} को हटाएं`,
  },
  member: {
    owner: 'मालिक',
    admin: 'एडमिन',
    promote: 'एडमिन बनाएं',
    restrict: 'प्रतिबंधित करें',
    remove: 'ग्रुप से हटाएं',
    actions: (name) => `${name} के लिए कार्रवाइयां`,
  },
  story: {
    close: 'स्टोरी बंद करें',
    previous: 'पिछली स्टोरी',
    next: 'अगली स्टोरी',
    mute: 'स्टोरी म्यूट करें',
    unmute: 'स्टोरी अनम्यूट करें',
    more: 'स्टोरी के विकल्प',
    replyPlaceholder: 'जवाब दें…',
    send: 'जवाब भेजें',
    progress: (index, count) => `स्टोरी ${index + 1} / ${count}`,
    react: (emoji) => `${emoji} से प्रतिक्रिया दें`,
  },
  searchMembers: 'सदस्य खोजें',
  share: 'शेयर करें',
  postOptions: 'पोस्ट के विकल्प',
  pinned: 'पिन किया गया',
  views: (c) => `${c} व्यू`,
  forwards: (c) => `${c} फ़ॉरवर्ड`,
  jumpTo: (letter) => `${letter} पर जाएं`,
  add: 'जोड़ें',
  added: 'जोड़ा गया',
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
