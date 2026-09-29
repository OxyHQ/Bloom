// Bloom's ar strings for every family. Loaded on demand by
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

const CALL_UI_MESSAGES__CORNERS = { 'top-left': 'أعلى اليسار', 'top-right': 'أعلى اليمين', 'bottom-left': 'أسفل اليسار', 'bottom-right': 'أسفل اليمين' };

const MESSAGE_MEDIA_MESSAGES__items = (n: number) =>
  plural('ar', n, {
    zero: 'لا عناصر',
    one: 'عنصر واحد',
    two: 'عنصران',
    few: '{n} عناصر',
    many: '{n} عنصرًا',
    other: '{n} عنصر',
  });

const COMMON_MESSAGES: Translations['COMMON_MESSAGES'] = {
  close: 'إغلاق',
  dismiss: 'تجاهل',
  back: 'رجوع',
  goBack: 'العودة',
  loading: 'جارٍ التحميل',
  more: 'المزيد',
  moreOptions: 'خيارات إضافية',
  moreActions: 'إجراءات إضافية',
  progress: 'التقدم',
  stepOf: (step, total) => `الخطوة ${step} من ${total}`,
  labelFor: (label, subject) => `${label}: ${subject}`,
  tapToClose: 'انقر للإغلاق',
  cancel: 'إلغاء',
  done: 'تم',
  save: 'حفظ',
  delete: 'حذف',
  edit: 'تعديل',
  remove: 'إزالة',
  retry: 'إعادة المحاولة',
  search: 'بحث',
  showMore: 'عرض المزيد',
  showLess: 'عرض أقل',
  next: 'التالي',
  previous: 'السابق',
  open: 'فتح',
  menu: 'القائمة',
  copy: 'نسخ',
  copied: 'تم النسخ',
  send: 'إرسال',
  clear: 'مسح',
  seeAll: 'عرض الكل',
  resizePanels: 'تغيير حجم اللوحات',
};

const SURFACES_MESSAGES: Translations['SURFACES_MESSAGES'] = { confirm: 'تأكيد', ok: 'حسنًا' };

const CONTACT_CARD_MESSAGES: Translations['CONTACT_CARD_MESSAGES'] = {
  channels: {
    email: { action: 'البريد', name: (s) => `إرسال بريد إلكتروني إلى ${s}` },
    phone: { action: 'اتصال', name: (s) => `الاتصال بـ ${s}` },
    chat: { action: 'رسالة', name: (s) => `إرسال رسالة إلى ${s}` },
    meeting: { action: 'اجتماع', name: (s) => `جدولة اجتماع مع ${s}` },
    video: { action: 'فيديو', name: (s) => `بدء مكالمة فيديو مع ${s}` },
    website: { action: 'الموقع', name: (s) => `فتح موقع ${s} الإلكتروني` },
  },
  labelsFor: (name) => `تصنيفات ${name}`,
  owner: 'المسؤول',
};

const CHAT_LIST_MESSAGES: Translations['CHAT_LIST_MESSAGES'] = {
  item: { draft: 'مسودة:', pinned: 'مثبّت', muted: 'مكتوم', verified: 'موثّق', channel: 'قناة', bot: 'بوت', group: 'مجموعة' },
  search: { chat: 'الدردشات', message: 'الرسائل', contact: 'جهات الاتصال', empty: 'لا توجد نتائج' },
  list: 'الدردشات',
  emptyTitle: 'لا توجد محادثات بعد',
  emptyDescription: 'ابدأ دردشة وستظهر هنا.',
  searchResults: 'نتائج البحث',
  searchChats: 'البحث في الدردشات',
  clearSearch: 'مسح البحث',
  newChat: 'دردشة جديدة',
  archived: 'المؤرشفة',
  archivedName: (label, n) => `${label}، ${plural('ar', n, { zero: 'لا توجد دردشات', one: 'دردشة واحدة', two: 'دردشتان', few: '{n} دردشات', many: '{n} دردشة', other: '{n} دردشة' })}`,
  folderName: (label, n) => `${label}، ${n} غير مقروءة`,
  stories: 'القصص',
  ownStory: 'قصتك',
  addStory: 'إضافة إلى قصتك',
  storyOf: (name) => `قصة ${name}`,
};

const NOTE_CARD_MESSAGES: Translations['NOTE_CARD_MESSAGES'] = {
  pinned: 'مثبّتة',
  locked: 'محمية',
  attachments: (n) =>
    plural('ar', n, {
      zero: 'لا مرفقات',
      one: 'مرفق واحد',
      two: 'مرفقان',
      few: '{n} مرفقات',
      many: '{n} مرفقًا',
      other: '{n} مرفق',
    }),
  select: 'تحديد الملاحظة',
  checklistDone: 'مكتمل',
  checklistTodo: 'غير مكتمل',
  more: (n) => `${n} أخرى`,
};

const DIALOG_MESSAGES: Translations['DIALOG_MESSAGES'] = {
  view: 'العرض',
  dismissDialog: 'إغلاق مربع الحوار',
  dismissNamed: (label) => `إغلاق ${label}`,
};

const ALERT_DIALOG_MESSAGES: Translations['ALERT_DIALOG_MESSAGES'] = {
  confirm: 'تأكيد',
};

const SIDEBAR_MESSAGES: Translations['SIDEBAR_MESSAGES'] = {
  sidebar: 'الشريط الجانبي',
  collapse: 'طي الشريط الجانبي',
  expand: 'توسيع الشريط الجانبي',
  close: 'إغلاق الشريط الجانبي',
  quickSearch: 'بحث سريع',
  searchPlaceholder: 'البحث في التنقل…',
  searchPlaceholderCompact: 'بحث...',
  filter: 'تصفية التنقل',
  clearSearch: 'مسح بحث التنقل',
  noResults: 'لا توجد نتائج',
  mode: 'الوضع',
  upgrade: 'ترقية',
  usersWithAccess: 'المستخدمون الذين لديهم حق الوصول',
  addUser: 'إضافة مستخدم',
  manage: 'إدارة',
  accountMenu: 'قائمة الحساب',
  teamMenu: (team) => `قائمة ${team}`,
};

const FILE_SIZE_UNITS: Translations['FILE_SIZE_UNITS'] = { byte: 'بايت', kilobyte: 'ك.ب', megabyte: 'م.ب', gigabyte: 'غ.ب' };

const CARD_FORM_MESSAGES: Translations['CARD_FORM_MESSAGES'] = {
  labels: { number: 'رقم البطاقة', expiry: 'تاريخ الانتهاء', securityCode: 'رمز الأمان', name: 'الاسم على البطاقة', postcode: 'الرمز البريدي', country: 'الدولة' },
  selectCountry: 'اختر دولة',
};

const CHAT_COMPOSER_MESSAGES: Translations['CHAT_COMPOSER_MESSAGES'] = {
  attach: 'إرفاق',
  emoji: 'رموز تعبيرية',
  camera: 'الكاميرا',
  mic: 'تسجيل رسالة صوتية',
  message: 'رسالة',
  enterHint: 'Enter للإرسال · Shift + Enter لسطر جديد',
  modEnterHint: '⌘ + Enter للإرسال · Enter لسطر جديد',
  cancelRecording: 'إلغاء التسجيل',
  sendVoice: 'إرسال الرسالة الصوتية',
  deleteRecording: 'حذف التسجيل',
  playRecording: 'تشغيل التسجيل',
  pauseRecording: 'إيقاف التسجيل مؤقتًا',
  lockRecording: 'قفل التسجيل',
  slideToCancel: 'اسحب للإلغاء',
  recording: 'جارٍ التسجيل',
  searchEmoji: 'البحث عن رمز تعبيري',
  noEmoji: 'لم يتم العثور على رموز تعبيرية',
  frequentlyUsed: 'الأكثر استخدامًا',
  skinTone: 'لون البشرة',
  emojiPicker: 'منتقي الرموز التعبيرية',
  moreReactions: 'المزيد من التفاعلات',
  quickReactions: 'تفاعلات سريعة',
  messageActions: 'إجراءات الرسالة',
  attachments: 'المرفقات',
  removeAttachment: (name) => `إزالة ${name}`,
  suggestions: { mention: 'الأشخاص', command: 'الأوامر', emoji: 'رموز تعبيرية' },
  suggestionVerified: 'موثّق',
  searchingSuggestions: 'جارٍ البحث…',
  noSuggestions: { mention: 'لم يتم العثور على أشخاص', command: 'لم يتم العثور على أوامر', emoji: 'لم يتم العثور على رموز تعبيرية' },
  attachmentItems: { gallery: 'المعرض', camera: 'الكاميرا', file: 'ملف', location: 'الموقع', contact: 'جهة اتصال', poll: 'استطلاع', music: 'موسيقى' },
};

const MAIL_COMPOSE_MESSAGES: Translations['MAIL_COMPOSE_MESSAGES'] = {
  to: 'إلى',
  cc: 'نسخة',
  bcc: 'نسخة مخفية',
  subject: 'الموضوع',
  showCopies: 'نسخة، نسخة مخفية',
  hideCopies: 'إخفاء النسخة والنسخة المخفية',
  removeRecipient: (name) => `إزالة ${name}`,
  suggestions: 'جهات الاتصال',
  send: COMMON_MESSAGES.send,
  sending: 'جارٍ الإرسال',
  attach: 'إرفاق ملف',
  discard: 'تجاهل المسودة',
  minimize: 'تصغير',
  expand: 'توسيع',
  close: COMMON_MESSAGES.close,
  title: 'رسالة جديدة',
};

const MEDIA_PLAYER_MESSAGES: Translations['MEDIA_PLAYER_MESSAGES'] = {
  lyrics: 'كلمات الأغنية',
  queue: 'قائمة الانتظار',
  devices: 'الاتصال بجهاز',
  fullscreen: 'ملء الشاشة',
  openPlayer: 'فتح المشغّل',
  currentDevice: 'الجهاز الحالي',
  listeningOn: 'الاستماع على',
  listeningOnDevice: (d) => `الاستماع على ${d}`,
  selectDevice: 'اختر جهازًا',
  noDevices: 'لم يتم العثور على أجهزة أخرى',
  deviceHelp: 'ألا ترى جهازك؟',
  playbackSpeed: 'سرعة التشغيل',
  sleepTimer: 'مؤقت النوم',
  sleepOff: 'إيقاف',
  endOfEpisode: 'نهاية الحلقة',
  oneHour: 'ساعة واحدة',
  minutes: (n) =>
    plural('ar', n, { zero: '{n} دقيقة', one: 'دقيقة واحدة', two: 'دقيقتان', few: '{n} دقائق', many: '{n} دقيقة', other: '{n} دقيقة' }),
  stopsIn: (r) => `يتوقف بعد ${r}`,
  shuffle: 'ترتيب عشوائي',
  repeat: 'تكرار',
  repeatOne: 'تكرار الأغنية',
  skipBack: (n) =>
    plural('ar', n, {
      zero: 'رجوع {n} ثانية',
      one: 'رجوع ثانية واحدة',
      two: 'رجوع ثانيتين',
      few: 'رجوع {n} ثوانٍ',
      many: 'رجوع {n} ثانية',
      other: 'رجوع {n} ثانية',
    }),
  skipForward: (n) =>
    plural('ar', n, {
      zero: 'تقديم {n} ثانية',
      one: 'تقديم ثانية واحدة',
      two: 'تقديم ثانيتين',
      few: 'تقديم {n} ثوانٍ',
      many: 'تقديم {n} ثانية',
      other: 'تقديم {n} ثانية',
    }),
  closePlayer: 'إغلاق المشغّل',
  share: 'مشاركة',
  showLyrics: 'عرض كلمات الأغنية',
};

const ADDRESS_MESSAGES: Translations['ADDRESS_MESSAGES'] = { emptyTitle: 'لا يوجد شيء هنا بعد', addresses: 'العناوين' };

const CREATOR_STUDIO_MESSAGES: Translations['CREATOR_STUDIO_MESSAGES'] = {
  releaseTypes: { single: 'أغنية منفردة', ep: 'ألبوم قصير', album: 'ألبوم' },
  releaseStatuses: {
    draft: 'مسودة',
    'in-review': 'قيد المراجعة',
    scheduled: 'مجدول',
    live: 'منشور',
    rejected: 'مرفوض',
    takedown: 'تمت إزالته',
  },
  creditRoles: {
    songwriter: 'كاتب الأغاني',
    producer: 'المنتج',
    composer: 'الملحن',
    performer: 'المؤدي',
    lyricist: 'كاتب الكلمات',
    'mixing-engineer': 'مهندس المزج',
    'mastering-engineer': 'مهندس الماسترينغ',
  },
  periods: { '7d': '7 أيام', '28d': '28 يومًا', '12m': '12 شهرًا', all: 'كل الأوقات' },
  artworkNotSquare: (w, h) => `يجب أن يكون الغلاف مربعًا — أبعاد هذه الصورة ${w}×${h} بكسل.`,
  artworkTooSmall: (w, h, min) =>
    `الغلاف صغير جدًا (${w}×${h} بكسل). حمّل صورة بأبعاد ${min}×${min} بكسل على الأقل.`,
  audience: { title: 'الجمهور', period: 'الفترة' },
  breakdown: {
    locations: 'أبرز المواقع',
    cities: 'المدن',
    countries: 'البلدان',
    age: 'العمر',
    gender: 'الجنس',
    sources: 'مصادر الاستماع',
    metric: 'المستمعون',
  },
  streams: {
    metrics: 'مقياس الرسم البياني',
    summary: (metric, releases) =>
      releases ? `${metric} بمرور الوقت؛ الإصدارات: ${releases}` : `${metric} بمرور الوقت`,
  },
  topTracks: {
    title: 'أبرز المقاطع',
    rank: '#',
    rankName: 'الترتيب',
    track: 'المقطع',
    streams: 'مرات التشغيل',
    listeners: 'المستمعون',
    saves: 'مرات الحفظ',
    trend: 'الاتجاه',
    trends: { up: 'في صعود', down: 'في هبوط', flat: 'ثابت', new: 'دخول جديد' },
    newBadge: 'جديد',
    empty: 'لا توجد مرات تشغيل في هذه الفترة بعد.',
  },
  tracks: (n) =>
    plural('ar', n, {
      zero: 'لا مقاطع',
      one: 'مقطع واحد',
      two: 'مقطعان',
      few: '{n} مقاطع',
      many: '{n} مقطعًا',
      other: '{n} مقطع',
    }),
  timeline: {
    states: { complete: 'مكتمل', current: 'قيد التنفيذ', upcoming: 'لم يبدأ', error: 'يحتاج إلى انتباه' },
    label: 'تقدّم الإصدار',
  },
  upload: {
    queued: 'في قائمة الانتظار',
    processing: 'جارٍ التحويل…',
    ready: 'جاهز',
    failed: 'تعذّر التحميل',
    remove: (name) => `إزالة ${name}`,
    progress: (name) => `جارٍ تحميل ${name}`,
  },
  artwork: {
    title: 'الغلاف',
    requirements: '3000×3000 بكسل، JPG أو PNG',
    replace: 'استبدال',
    remove: 'إزالة الغلاف',
    preview: 'غلاف الإصدار',
    upload: 'تحميل الغلاف',
  },
  credits: {
    title: 'المساهمون',
    role: 'الدور',
    name: 'الاسم',
    add: 'إضافة مساهم',
    remove: (index, name) => (name ? `إزالة المساهم ${index + 1}، ${name}` : `إزالة المساهم ${index + 1}`),
    empty: 'اذكر كتّاب الأغاني والمنتجين والمؤدين في هذا المقطع.',
    field: (field, n) => `${field}، المساهم ${n}`,
  },
  artists: {
    add: 'إضافة',
    addTo: (label) => `إضافة: ${label}`,
    remove: (name) => `إزالة ${name}`,
  },
  isrc: { hint: 'التنسيق: CC-XXX-YY-NNNNN', invalid: 'هذا ليس رمز ISRC صالحًا' },
  metadata: {
    title: 'عنوان المقطع',
    version: 'النسخة',
    versionPlaceholder: 'ريمكس، مباشر، أكوستيك…',
    explicit: 'كلمات صريحة',
    explicitDescription: 'فعّل هذا الخيار إذا كان المقطع يحتوي على لغة بذيئة أو مواضيع صريحة.',
    genre: 'النوع',
    genrePlaceholder: 'اختر نوعًا',
    primaryArtists: 'الفنانون الرئيسيون',
    featuredArtists: 'الفنانون الضيوف',
    artistPlaceholder: 'أضف اسم فنان',
    language: 'لغة الكلمات',
    languagePlaceholder: 'اختر لغة',
    lyrics: 'الكلمات',
    lyricsPlaceholder: 'الصق الكلمات، سطرًا لكل سطر مغنّى',
  },
  payout: {
    estimated: 'الأرباح المقدّرة لهذا الشهر',
    lastPayout: 'آخر دفعة',
    nextPayout: 'الدفعة التالية',
    statements: 'عرض الكشوفات',
    chart: 'الأرباح الشهرية',
  },
  pitch: {
    title: 'اقتراح على المحررين',
    description: 'عرّف فريق التحرير بإصدارك القادم قبل صدوره.',
    release: 'الإصدار',
    releasePlaceholder: 'اختر إصدارًا قادمًا',
    moods: 'الحالة المزاجية',
    genres: 'النوع',
    pitch: 'عرضك',
    pitchPlaceholder: 'ما الذي يميز هذا الإصدار؟ لمن هو، وما القصة وراءه؟',
    submit: 'إرسال العرض',
    tagLimit: (max) => `اختر حتى ${max}`,
    statuses: { submitted: 'تم إرسال العرض', accepted: 'تم اختياره للمراجعة', declined: 'لم يُختر هذه المرة' },
    statusDescriptions: {
      submitted: 'يقرأ المحررون كل عرض. ستتلقى ردًا قبل تاريخ الإصدار.',
      accepted: 'يجري النظر في إصدارك لقوائم التشغيل التحريرية.',
      declined: 'لم يُختر هذا الإصدار. يمكنك تقديم إصدارك التالي فور جدولته.',
    },
    edit: 'تعديل العرض',
  },
};

const PROPERTY_INSIGHTS_MESSAGES: Translations['PROPERTY_INSIGHTS_MESSAGES'] = {
  energy: 'الطاقة',
  pending: 'قيد الانتظار',
  energyRatingClass: (r) => `تصنيف الطاقة ${r}`,
  energyRatingStatus: (s) => `تصنيف الطاقة: ${s}`,
  energyRating: 'تصنيف الطاقة',
  certificateInProgress: 'الشهادة قيد الإصدار',
  consumption: 'الاستهلاك',
  emissions: 'الانبعاثات',
  moreEfficient: 'أكثر كفاءة',
  lessEfficient: 'أقل كفاءة',
  walkTime: (t) => `${t} سيرًا على الأقدام`,
  scoreOutOf: (d, m) => `${d} من ${m}`,
  pricePerSquareMetre: 'السعر للمتر المربع',
  rentHistory: 'سجل الإيجار',
  rentHistoryEmpty: 'لا يوجد سجل لهذا المنزل بعد',
  confidence: { low: 'ثقة منخفضة', medium: 'ثقة متوسطة', high: 'ثقة عالية' },
  aboveEstimate: (p) => `أعلى من التقدير بنسبة ${p}`,
  belowEstimate: (p) => `أقل من التقدير بنسبة ${p}`,
  fairPrice: 'سعر عادل',
  estimatedPrice: 'السعر المقدَّر',
  asking: 'السعر المطلوب',
  noVerdict: 'لا توجد بيانات كافية للحكم',
  whyThisEstimate: 'لماذا هذا التقدير',
  comparables: (n) =>
    plural('ar', n, {
      zero: 'استنادًا إلى {n} منزل مماثل',
      one: 'استنادًا إلى منزل مماثل واحد',
      two: 'استنادًا إلى منزلين مماثلين',
      few: 'استنادًا إلى {n} منازل مماثلة',
      many: 'استنادًا إلى {n} منزلًا مماثلًا',
      other: 'استنادًا إلى {n} منزل مماثل',
    }),
  currentPrice: 'السعر الحالي',
  now: 'الآن',
  noPriceHistory: 'لا يوجد سجل أسعار بعد',
  priceHistoryPeriod: 'فترة سجل الأسعار',
  priceHistory: 'سجل الأسعار',
  priceHistoryTrend: (head, a, aw, b, bw) => `${head}: من ${a} في ${aw} إلى ${b} في ${bw}.`,
};

const MAP_MARKER_MESSAGES: Translations['MAP_MARKER_MESSAGES'] = {
  searchAsMapMoves: 'البحث عند تحريك الخريطة',
  searchThisArea: 'البحث في هذه المنطقة',
  stays: (n) =>
    mapMarker_countOf('ar', n, {
      zero: 'لا توجد أماكن إقامة',
      one: 'مكان إقامة واحد',
      two: 'مكانا إقامة',
      few: '{n} أماكن إقامة',
      many: '{n} مكان إقامة',
      other: '{n} مكان إقامة',
    }),
};

const LISTING_ACTIONS_MESSAGES: Translations['LISTING_ACTIONS_MESSAGES'] = {
  month: 'شهر',
  rentalStatus: { available: 'متاح', reserved: 'محجوز', rented: 'مؤجَّر' },
  rentalStatusMessage: {
    reserved: 'متقدم آخر يُنهي عقدًا الآن. المعاينات الجديدة متوقفة مؤقتًا.',
    rented: 'تم تأجير هذا المنزل ولم يعد يقبل طلبات.',
  },
  saleStatus: { available: 'للبيع', reserved: 'محجوز', sold: 'مُباع' },
  saleStatusMessage: {
    reserved: 'تم قبول عرض. الوكيل لا ينظّم زيارات في الوقت الحالي.',
    sold: 'تم بيع هذا المنزل.',
  },
  requestViewing: 'طلب معاينة',
  apply: 'تقديم طلب',
  contactAgent: 'التواصل مع الوكيل',
  requestVisit: 'طلب زيارة',
  makeOffer: 'تقديم عرض',
  yourHome: 'منزلك',
  theirHome: 'منزلهم',
  dates: 'التواريخ',
  guests: 'الضيوف',
  addDates: 'إضافة تواريخ',
  addGuests: 'إضافة ضيوف',
  proposeSwap: 'اقتراح تبادل',
  exchangeModes: { swap: 'تبادل متبادل', host: 'نقاط الضيوف', both: 'أيٌّ منهما' },
  scheduleViewing: 'حجز موعد معاينة',
  noTimesLeft: 'لا توجد أوقات متبقية في هذا اليوم',
  noteForLandlord: 'ملاحظة للمالك',
  day: 'اليوم',
  time: 'الوقت',
  submitViewing: 'طلب المعاينة',
  inPerson: 'حضوريًا',
  videoCall: 'مكالمة فيديو',
  viewingType: 'نوع المعاينة',
  yourApplication: 'طلبك',
  applicationProgress: 'تقدّم الطلب',
  progressReady: (done, total) => `${done} من ${total} جاهز`,
  applicationStatus: { missing: 'ناقص', uploaded: 'قيد المراجعة', verified: 'تم التحقق', rejected: 'مرفوض' },
  applicationAction: { upload: 'رفع', view: 'عرض', replace: 'استبدال' },
  itemAction: (action, title) => `${action}: ${title}`,
  mortgage: {
    title: 'حاسبة الرهن العقاري',
    price: 'سعر العقار',
    downPayment: 'الدفعة الأولى',
    downPaymentPercent: 'نسبة الدفعة الأولى',
    percent: 'النسبة',
    term: 'مدة القرض',
    years: 'سنوات',
    rate: 'سعر الفائدة',
    monthlyPayment: 'القسط الشهري',
    principal: 'أصل القرض',
    interest: 'الفائدة',
    loanAmount: 'مبلغ القرض',
    totalInterest: 'إجمالي الفائدة',
    totalCost: 'التكلفة الإجمالية',
  },
  termYears: (n) =>
    plural('ar', n, {
      zero: '{n} سنة',
      one: 'سنة واحدة',
      two: 'سنتان',
      few: '{n} سنوات',
      many: '{n} سنة',
      other: '{n} سنة',
    }),
  mortgageDisclaimer:
    'هذا تقدير وليس عرضًا. لا يشمل الرسوم والضرائب والتأمين، ويفترض سعر فائدة ثابتًا طوال المدة.',
};

const AGENT_PROGRESS_MESSAGES: Translations['AGENT_PROGRESS_MESSAGES'] = {
  stepsLeft: (n) =>
    plural('ar', n, {
      zero: 'لم تتبقَّ أي خطوات',
      one: 'تبقّت خطوة واحدة',
      two: 'تبقّت خطوتان',
      few: 'تبقّت {n} خطوات',
      many: 'تبقّت {n} خطوة',
      other: 'تبقّت {n} خطوة',
    }),
  allCompleted: 'اكتملت كل الخطوات',
  minimize: 'تصغير الخطوات',
  expand: 'توسيع الخطوات',
  defaultSteps: [
    'قراءة ملفات المشروع',
    'تحديث رموز الوضع الفاتح وتثبيتها',
    'تنفيذ رموز الوضع الداكن',
    'إضافة مبدّل سمة مسجَّل قابل لإعادة الاستخدام',
    'تشغيل السجل والتدقيق وبناء الإنتاج',
  ],
};

const CALENDAR_MESSAGES: Translations['CALENDAR_MESSAGES'] = {
  newEvent: 'حدث جديد',
  openNavigation: 'فتح التنقل',
  month: 'الشهر',
  moreEvents: (n) =>
    plural('ar', n, {
      one: '+حدث واحد آخر',
      two: '+حدثان آخران',
      few: '+{n} أحداث أخرى',
      many: '+{n} حدثًا آخر',
      other: '+{n} حدث آخر',
    }),
  eventDetails: 'تفاصيل الحدث',
  join: 'انضمام',
  editTimeZone: 'تعديل المنطقة الزمنية',
  participants: 'المشاركون',
  editParticipants: 'تعديل المشاركين',
  reminders: 'التذكيرات',
  editReminders: 'تعديل التذكيرات',
  duration: calendar_compactDuration(' س', ' د', ' '),
  jumpToDate: 'الانتقال إلى تاريخ',
  previousMonth: 'الشهر السابق',
  nextMonth: 'الشهر التالي',
  chooseDate: (month) => `${month}، اختر تاريخًا`,
  inbox: 'البريد الوارد',
  inboxMenu: 'قائمة البريد الوارد',
  addAccount: 'إضافة حساب جديد',
};

const LISTING_DETAILS_MESSAGES: Translations['LISTING_DETAILS_MESSAGES'] = {
  ratedOutOf5: (r) => `التقييم ${r} من 5`,
  overallRating: 'التقييم العام',
  unavailable: 'غير متاح',
  showAllAmenities: (n) => plural('ar', n, { other: 'عرض كل المرافق ({n})' }),
  showAllFeatures: (n) => plural('ar', n, { other: 'عرض كل الميزات ({n})' }),
  propertyFeatures: 'ميزات العقار',
  showAllPhotos: 'عرض كل الصور',
  listingPhotos: 'صور الإعلان',
  photoOf: (p, t) => `الصورة ${p} من ${t}`,
  photoWithAlt: (a, p, t) => `${a}، الصورة ${p} من ${t}`,
  floorPlanOf: (a, p, t) => `${a}، المخطط ${p} من ${t}`,
  landlord: 'المالك',
  agent: 'الوكيل العقاري',
  agency: 'الوكالة العقارية',
  activeListings: (n) =>
    plural('ar', n, {
      zero: 'لا توجد إعلانات نشطة',
      one: 'إعلان نشط واحد',
      two: 'إعلانان نشطان',
      few: '{n} إعلانات نشطة',
      many: '{n} إعلانًا نشطًا',
      other: '{n} إعلان نشط',
    }),
  verified: 'موثّق',
  showPhone: 'إظهار رقم الهاتف',
  call: 'اتصال',
  messageHost: 'مراسلة المضيف',
  message: 'إرسال رسالة',
};

const PRICE_BREAKDOWN_MESSAGES: Translations['PRICE_BREAKDOWN_MESSAGES'] = {
  states: { estimated: 'تقديري', pending: 'قيد الانتظار' },
  showDetails: 'عرض تفاصيل السعر',
  hideDetails: 'إخفاء تفاصيل السعر',
  breakdown: 'تفاصيل السعر',
  about: (label) => `حول ${label}`,
};

const DATE_PICKER_MESSAGES: Translations['DATE_PICKER_MESSAGES'] = {
  cancel: 'إلغاء',
  apply: 'تطبيق',
  previousMonth: 'الشهر السابق',
  nextMonth: 'الشهر التالي',
  datePlaceholder: 'اختر تاريخًا',
  dateLabel: 'التاريخ',
  rangePlaceholder: 'اختر نطاقًا زمنيًا',
  rangeLabel: 'النطاق الزمني',
  startDate: 'تاريخ البدء',
  endDate: 'تاريخ الانتهاء',
  daysSelected: (n) =>
    plural('ar', n, {
      zero: 'لم يتم تحديد أي يوم',
      one: 'تم تحديد يوم واحد',
      two: 'تم تحديد يومين',
      few: 'تم تحديد {n} أيام',
      many: 'تم تحديد {n} يومًا',
      other: 'تم تحديد {n} يوم',
    }),
  presets: {
    today: 'اليوم',
    yesterday: 'أمس',
    lastWeek: 'الأسبوع الماضي',
    thisMonth: 'هذا الشهر',
    lastMonth: 'الشهر الماضي',
    thisYear: 'هذا العام',
    lastYear: 'العام الماضي',
    allTime: 'كل الأوقات',
  },
  meetingTrigger: 'جدولة اجتماع',
  meetingLabel: 'جدولة اجتماع',
  send: 'إرسال الدعوة',
  selectTime: 'اختر وقتًا',
  duration: (n) =>
    plural('ar', n, {
      one: 'دقيقة واحدة',
      two: 'دقيقتان',
      few: '{n} دقائق',
      many: '{n} دقيقة',
      other: '{n} دقيقة',
    }),
};

const SHIPMENT_REQUEST_MESSAGES: Translations['SHIPMENT_REQUEST_MESSAGES'] = {
  kinds: {
    envelope: { label: 'ظرف', description: 'مستندات، مفاتيح، أي شيء مسطّح.' },
    parcel: { label: 'طرد', description: 'صندوق أو حقيبة يحملها شخص واحد.' },
    furniture: { label: 'أثاث', description: 'أريكة، طاولة، مرتبة — شخصان عند كل طرف.' },
    pallet: { label: 'منصة نقالة', description: 'مغلّفة ومرصوصة، تُنقل برافعة خلفية.' },
    food: { label: 'طعام', description: 'توصيل من مطعم، بدرجة الحرارة المناسبة.' },
  },
  sizes: {
    small: 'حتى حجم علبة أحذية — 35 × 25 × 20 سم.',
    medium: 'حتى حجم حقيبة المقصورة — 55 × 40 × 25 سم.',
    large: 'حتى حجم غسالة — 85 × 60 × 60 سم.',
    extraLarge: 'أكبر من ذلك — أخبرنا في الملاحظات.',
  },
  access: { ground: 'الطابق الأرضي', stairs: 'درج', lift: 'مصعد' },
  load: {
    kind: 'ماذا سننقل؟',
    size: 'الحجم',
    weight: 'الوزن',
    quantity: 'العدد',
    quantityValue: (n) => plural('ar', n, { zero: 'لا قطع', one: 'قطعة واحدة', two: 'قطعتان', few: '{n} قطع', many: '{n} قطعة', other: '{n} قطعة' }),
    notes: 'هل هناك ما يجب أن يعرفه الناقل؟',
    notesPlaceholder: 'قابل للكسر، رمز المصعد، مكان التسليم…',
  },
  options: { extras: 'إضافات', access: 'الوصول عند الطرفين', window: 'متى يجب الاستلام؟' },
  form: {
    route: 'المسار',
    routeDescription: 'الاستلام أولًا، والتسليم أخيرًا.',
    load: 'الحمولة',
    photos: 'الصور',
    photosDescription: 'صورة الحمولة هي أكثر ما يحسّن عروض الأسعار التي ستصلك.',
    options: 'الخيارات',
    optionsDescription: 'كل خيار منها يغيّر السعر.',
    price: 'السعر',
  },
  shipmentRequest: 'طلب شحن',
};

const LABEL_MESSAGES: Translations['LABEL_MESSAGES'] = { required: 'مطلوب' };

const CHECKOUT_SUMMARY_MESSAGES: Translations['CHECKOUT_SUMMARY_MESSAGES'] = {
  title: 'راجع طلبك',
  orderSummary: 'ملخص الطلب',
  deliverTo: 'التوصيل إلى',
  notChosen: 'لم يُختر بعد',
  opensPicker: 'يفتح أداة الاختيار',
  placeOrder: 'تأكيد الطلب',
  placingOrder: 'جارٍ إرسال طلبك',
};

const VEHICLE_PICKER_MESSAGES: Translations['VEHICLE_PICKER_MESSAGES'] = {
  from: 'ابتداءً من',
  fits: (label) => `ما يتسع له ${label}`,
  unavailable: 'غير متاحة لهذه الحمولة',
  vehicle: 'المركبة',
  vehicles: {
    bike: { label: 'دراجة شحن', capacity: 'حتى 25 كغ · 60 × 40 × 40 سم', fits: ['مستندات', 'طلب طعام', 'صندوق صغير'] },
    car: { label: 'سيارة', capacity: 'حتى 150 كغ · 100 × 80 × 60 سم', fits: ['حقيبتا سفر', 'أربعة صناديق', 'دراجة هوائية'] },
    van: { label: 'فان', capacity: 'حتى 800 كغ · 240 × 150 × 140 سم', fits: ['أريكة', 'نقل أثاث استوديو', 'نصف منصة نقالة'] },
    boxTruck: { label: 'شاحنة صندوقية', capacity: 'حتى 3500 كغ · 420 × 200 × 210 سم', fits: ['منصتان نقالتان', 'نقل أثاث شقة بغرفتي نوم', 'رافعة خلفية'] },
    refrigerated: { label: 'فان مبرّد', capacity: 'حتى 700 كغ · بين 2 و8 °م', fits: ['منتجات طازجة', 'تموين مبرّد', 'زهور'] },
  },
};

const COMPOSER_PANEL_MESSAGES: Translations['COMPOSER_PANEL_MESSAGES'] = {
  message: 'رسالة',
  add: 'إضافة مرفق',
  addMenu: 'إضافة إلى الدردشة',
  permissions: 'الأذونات',
  permissionMode: 'وضع الأذونات',
  learnMore: 'معرفة المزيد',
  voice: 'الإدخال الصوتي',
  send: 'إرسال الرسالة',
  stop: 'إيقاف الإنشاء',
  permissionTrigger: (mode) => `الأذونات: ${mode}`,
  removeFile: (name) => `إزالة ${name}`,
  retryFile: (name) => `إعادة محاولة ${name}`,
  panelPlaceholder: 'مرحبًا، ماذا تحتاج اليوم؟',
  pillPlaceholder: 'اسألني عن أي شيء',
  pillCompactPlaceholder: 'اسألني',
  modelSettings: 'إعدادات النموذج',
  models: 'النماذج',
  modelGroup: 'النموذج',
  effort: 'مستوى الجهد',
  effortAuto: 'تلقائي',
  faster: 'أسرع',
  smarter: 'أذكى',
  quickSearch: 'بحث سريع',
  searchModels: 'البحث في النماذج',
  closeSearch: 'إغلاق البحث',
  noMatches: 'لا توجد نماذج مطابقة',
  providers: 'مزوّدو الخدمة',
  matchingModels: 'النماذج المطابقة',
  providerModels: (provider) => `نماذج ${provider}`,
  localFolders: 'المجلدات المحلية',
  context: (percent) => `السياق ${percent}%`,
  effortLevels: ['منخفض', 'متوسط', 'متوازن', 'مرتفع', 'مرتفع جدًا', 'الأقصى'],
  permissionModes: {
    auto: { label: 'تلقائي', description: 'يقرر الوكيل بنفسه' },
    manual: { label: 'يدوي', description: 'السؤال دائمًا قبل إجراء أي تغيير' },
    plan: { label: 'وضع التخطيط', description: 'إنشاء خطة قبل المتابعة' },
    bypass: { label: 'تجاوز الكل', description: 'يتولى الوكيل قرارات الأذونات' },
  },
  addMenuRows: {
    add: 'إضافة',
    plugins: 'المكوّنات الإضافية',
    files: 'الملفات والمجلدات',
    goal: 'الهدف',
    goalDescription: 'حدّد هدفًا للحصول على نتائج أسرع',
    plan: 'وضع التخطيط',
    planDescription: 'إدارة المهام المعقدة',
    documents: 'المستندات',
    documentsDescription: 'إنشاء المستندات وتعديلها',
    spreadsheets: 'جداول البيانات',
    spreadsheetsDescription: 'إنشاء جداول البيانات',
    presentations: 'العروض التقديمية',
    presentationsDescription: 'إنشاء مواد تسويقية',
    code: 'كتل التعليمات البرمجية',
    codeDescription: 'كتابة التعليمات البرمجية الحالية وتعديلها',
  },
};

const MESSAGE_BUBBLE_MESSAGES: Translations['MESSAGE_BUBBLE_MESSAGES'] = {
  forwardedFrom: (name) => `تمت إعادة التوجيه من ${name}`,
  deleted: 'تم حذف هذه الرسالة',
  retry: 'إعادة محاولة الإرسال',
  addReaction: 'إضافة تفاعل',
  replyTo: 'الانتقال إلى الرسالة المقتبسة',
  selected: 'محدد',
  pending: 'جارٍ الإرسال',
  failed: 'لم يتم الإرسال',
  reactionSelected: 'محدد',
  unread: 'رسائل غير مقروءة',
  typing: 'يكتب…',
};

const PAYMENT_STATUS_MESSAGES: Translations['PAYMENT_STATUS_MESSAGES'] = {
  states: { authorising: 'جارٍ التفويض', paid: 'مدفوع', failed: 'فشل الدفع', refunded: 'مسترد', pending: 'الدفع قيد الانتظار' },
  reference: 'المرجع',
};

const AVATAR_MESSAGES: Translations['AVATAR_MESSAGES'] = { live: 'مباشر' };

const PLACE_CARD_MESSAGES: Translations['PLACE_CARD_MESSAGES'] = {
  openStates: {
    open: 'مفتوح',
    'closing-soon': 'يُغلق قريبًا',
    closed: 'مغلق',
    'opening-soon': 'يُفتح قريبًا',
  },
  new: 'جديد',
  actions: 'الإجراءات',
  actionsFor: (name) => `إجراءات ${name}`,
  rated: (value, reviews) =>
    placeCard_withReviews(
      `التقييم ${value} من 5`,
      reviews === undefined ? undefined : placeCard_countOf('ar', reviews, { zero: 'لا توجد مراجعات', one: 'مراجعة واحدة', two: 'مراجعتان', few: '{n} مراجعات', many: '{n} مراجعة', other: '{n} مراجعة' }),
    ),
};

const SOCIAL_BUTTON_MESSAGES: Translations['SOCIAL_BUTTON_MESSAGES'] = { actions: { continue: (b) => `المتابعة باستخدام ${b}`, signIn: (b) => `تسجيل الدخول باستخدام ${b}`, signUp: (b) => `إنشاء حساب باستخدام ${b}` } };

const QUESTIONNAIRE_MESSAGES: Translations['QUESTIONNAIRE_MESSAGES'] = { other: 'أخرى', otherPlaceholder: 'اكتب إجابتك هنا', steps: 'الخطوات', step: (n) => `الخطوة ${n}` };

const MAP_CONTROLS_MESSAGES: Translations['MAP_CONTROLS_MESSAGES'] = {
  group: 'عناصر التحكم في الخريطة',
  locate: 'عرض موقعي',
  following: 'إيقاف تتبع موقعي',
  zoomIn: 'تكبير',
  zoomOut: 'تصغير',
  zoom: 'التكبير/التصغير',
  tilt: 'إمالة الخريطة',
  tiltOff: 'تسوية الخريطة',
  compass: (degrees) => `الاتجاه ${degrees} درجة. إعادة التوجيه نحو الشمال`,
  layerTrigger: 'طبقات الخريطة',
  layers: 'الخريطة',
  overlays: 'الطبقات المتراكبة',
};

const PAYMENT_METHOD_MESSAGES: Translations['PAYMENT_METHOD_MESSAGES'] = { states: { expired: 'منتهية الصلاحية', declined: 'مرفوضة' }, default: 'افتراضية', add: 'إضافة طريقة دفع', emptyTitle: 'لا توجد طرق دفع محفوظة', paymentMethods: 'طرق الدفع' };

const AVATAR_GROUP_MESSAGES: Translations['AVATAR_GROUP_MESSAGES'] = {
  more: (n) =>
    plural('ar', n, {
      zero: 'لا أحد آخر',
      one: 'شخص آخر',
      two: 'شخصان آخران',
      few: '{n} أشخاص آخرين',
      many: '{n} شخصًا آخر',
      other: '{n} شخص آخر',
    }),
  profile: 'الملف الشخصي',
};

const MENUBAR_MESSAGES: Translations['MENUBAR_MESSAGES'] = {
  menuBar: 'شريط القوائم',
};

const AGENT_THINKING_MESSAGES: Translations['AGENT_THINKING_MESSAGES'] = { thinking: 'جارٍ التفكير' };

const AI_CHAT_MESSAGES: Translations['AI_CHAT_MESSAGES'] = {
  feedback: { like: 'إجابة جيدة', dislike: 'إجابة سيئة', copy: 'نسخ الإجابة', copied: 'تم النسخ!' },
  imageGeneration: {
    generated: 'تم إنشاء الصورة',
    generating: 'جارٍ إنشاء الصورة',
    remaining: (n) =>
      plural('ar', n, {
        zero: 'لم يتبقَّ وقت',
        one: 'تتبقى ثانية واحدة',
        two: 'تتبقى ثانيتان',
        few: 'تتبقى {n} ثوانٍ',
        many: 'تتبقى {n} ثانية',
        other: 'تتبقى {n} ثانية',
      }),
    likeToast: 'شكرًا على ملاحظاتك',
    dislikeToast: 'شكرًا، سنستفيد من ذلك في التحسين',
  },
  generatedImage: (alt) => `صورة منشأة: ${alt}`,
  codePanel: {
    changes: 'التغييرات',
    browser: 'المتصفح',
    uncommitted: (n) =>
      plural('ar', n, {
        zero: 'لا توجد تغييرات غير مثبتة',
        one: 'تغيير واحد غير مثبت',
        two: 'تغييران غير مثبتين',
        few: '{n} تغييرات غير مثبتة',
        many: '{n} تغييرًا غير مثبت',
        other: '{n} تغيير غير مثبت',
      }),
    undo: 'التراجع عن التغييرات',
    browserPreview: 'معاينة المتصفح',
  },
  galleryPanel: {
    gallery: 'المعرض',
    styles: 'الأنماط',
    stylePresets: 'أنماط جاهزة',
    enlarge: (prompt) => `تكبير ${prompt}`,
    minimize: (prompt) => `تصغير ${prompt}`,
    download: (prompt) => `تنزيل ${prompt}`,
  },
  panelView: 'عرض اللوحة',
  openTerminal: 'فتح الطرفية',
  newGeneration: 'إنشاء جديد',
  expandPanel: 'توسيع اللوحة',
  togglePanel: 'إظهار اللوحة أو إخفاؤها',
  container: { breadcrumb: 'موقع المحادثة', share: 'مشاركة المحادثة' },
  shell: {
    openNavigation: 'فتح التنقل',
    closeNavigation: 'إغلاق التنقل',
    openPanel: (panel) => `فتح لوحة ${panel}`,
    closePanel: (panel) => `إغلاق لوحة ${panel}`,
  },
  code: 'الرمز البرمجي',
};

const COMMAND_MESSAGES: Translations['COMMAND_MESSAGES'] = {
  placeholder: 'اكتب أمرًا أو ابحث…',
  empty: 'لم يتم العثور على نتائج.',
  palette: 'لوحة الأوامر',
  clearSearch: 'مسح البحث',
};

const MUSIC_LIBRARY_MESSAGES: Translations['MUSIC_LIBRARY_MESSAGES'] = {
  kinds: {
    playlist: 'قائمة تشغيل',
    artist: 'فنان',
    album: 'ألبوم',
    podcast: 'بودكاست',
    audiobook: 'كتاب صوتي',
    folder: 'مجلد',
  },
  library: {
    title: 'مكتبتك',
    create: 'إنشاء قائمة تشغيل أو مجلد',
    collapseRail: 'طي مكتبتك',
    expandRail: 'فتح مكتبتك',
    filters: 'عوامل التصفية',
    clearFilters: 'مسح عوامل التصفية',
    filter: {
      playlists: 'قوائم التشغيل',
      artists: 'الفنانون',
      albums: 'الألبومات',
      podcasts: 'البودكاست',
      audiobooks: 'الكتب الصوتية',
    },
    downloaded: 'تم تنزيله',
    search: 'البحث في مكتبتك',
    searchPlaceholder: 'البحث في مكتبتك',
    clearSearch: 'مسح البحث',
    sortAndView: 'الترتيب والعرض',
    sortBy: 'الترتيب حسب',
    viewAs: 'العرض كـ',
    sort: {
      recents: 'الأحدث',
      'recently-added': 'المضافة مؤخرًا',
      alphabetical: 'أبجديًا',
      creator: 'المنشئ',
    },
    view: { compact: 'مضغوط', list: 'قائمة', grid: 'شبكة' },
    empty: 'لا يوجد شيء هنا بعد',
  },
  item: { pinned: 'مثبّت', downloaded: 'تم تنزيله', nowPlaying: 'قيد التشغيل الآن' },
  search: { placeholder: 'ماذا تريد أن تسمع؟', clear: 'مسح البحث', browse: 'تصفّح' },
  resultTypes: 'أنواع النتائج',
  topResultKinds: {
    song: 'أغنية',
    artist: 'فنان',
    album: 'ألبوم',
    playlist: 'قائمة تشغيل',
    podcast: 'بودكاست',
    episode: 'حلقة',
    audiobook: 'كتاب صوتي',
    profile: 'ملف شخصي',
  },
  recent: {
    title: 'عمليات البحث الأخيرة',
    clearAll: 'مسح عمليات البحث الأخيرة',
    remove: (title) => `إزالة ${title}`,
  },
};

const LISTING_CARD_MESSAGES: Translations['LISTING_CARD_MESSAGES'] = {
  statuses: { reserved: 'محجوز', sold: 'تم البيع', rented: 'تم التأجير', unavailable: 'غير متاح' },
  originally: (p) => `السعر الأصلي ${p}`,
  approximateLocation: 'موقع تقريبي',
  rated: (r) => `التقييم ${r} من 5`,
  ratedWithReviews: (r, c) =>
    plural('ar', c, { other: `التقييم ${r} من 5، عدد المراجعات: ${c}` }),
  newListing: 'جديد',
  previousPhoto: 'الصورة السابقة',
  nextPhoto: 'الصورة التالية',
  saveToWishlist: 'حفظ في قائمة الأمنيات',
  removeFromWishlist: 'إزالة من قائمة الأمنيات',
};

const NAVIGATION_BANNER_MESSAGES: Translations['NAVIGATION_BANNER_MESSAGES'] = {
  states: { 'off-route': 'خارج المسار', rerouting: 'جارٍ البحث عن مسار جديد' },
  thenLine: (street, maneuver) => navigationBanner_words('ثم', maneuver, street),
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
};

const LOCATION_PUCK_MESSAGES: Translations['LOCATION_PUCK_MESSAGES'] = {
  states: { locating: 'جارٍ تحديد موقعك', located: 'موقعك', stale: 'آخر موقع معروف لك' },
  facing: (state, degrees) => `${state}، باتجاه ${degrees} درجة`,
};

const CAROUSEL_MESSAGES: Translations['CAROUSEL_MESSAGES'] = {
  previousSlide: 'الشريحة السابقة',
  nextSlide: 'الشريحة التالية',
  goToSlide: (n) => `الانتقال إلى الشريحة ${n}`,
  slideOf: (at, of) => `${at} من ${of}`,
  carouselRole: 'عرض دوّار',
  slideRole: 'شريحة',
};

const ORDER_STATUS_MESSAGES: Translations['ORDER_STATUS_MESSAGES'] = { states: { current: 'قيد التنفيذ', upcoming: 'لم يبدأ بعد', failed: 'فشل' }, status: 'الحالة' };

const RATING_MESSAGES: Translations['RATING_MESSAGES'] = {
  newRating: 'جديد',
  reviews: (c) =>
    rating_countForms('ar', c, {
      zero: 'لا توجد مراجعات',
      one: 'مراجعة واحدة',
      two: 'مراجعتان',
      few: '{n} مراجعات',
      many: '{n} مراجعة',
      other: '{n} مراجعة',
    }),
  rated: (v) => `التقييم ${v} من 5`,
  ratedWithReviews: (v, r) => `التقييم ${v} من 5، ${r}`,
  star: (n) =>
    plural('ar', n, {
      zero: 'لا نجوم',
      one: 'نجمة واحدة',
      two: 'نجمتان',
      few: '{n} نجوم',
      many: '{n} نجمة',
      other: '{n} نجمة',
    }),
};

const LISTING_EDITOR_MESSAGES: Translations['LISTING_EDITOR_MESSAGES'] = {
  offering: {
    rent: { title: 'للإيجار', description: 'إيجار طويل الأمد بسعر شهري.' },
    sale: { title: 'للبيع', description: 'بيع المنزل بالكامل.' },
    stay: { title: 'إيجار لقضاء العطلات', description: 'إقامات قصيرة بسعر لكل ليلة.' },
    swap: { title: 'تبادل المنازل', description: 'بادل منزلك مع أعضاء آخرين.' },
    monthlyRent: 'الإيجار الشهري',
    deposit: 'التأمين',
    depositOption: (months) =>
      months === 0
        ? 'بلا'
        : plural('ar', months, {
            one: 'شهر واحد',
            two: 'شهران',
            few: '{n} أشهر',
            many: '{n} شهرًا',
            other: '{n} شهر',
          }),
    availableFrom: 'متاح اعتبارًا من',
    minimumStay: 'الحد الأدنى لمدة الإقامة',
    months: (months) =>
      plural('ar', months, {
        zero: '{n} شهر',
        one: 'شهر واحد',
        two: 'شهران',
        few: '{n} أشهر',
        many: '{n} شهرًا',
        other: '{n} شهر',
      }),
    askingPrice: 'السعر المطلوب',
    pricePerArea: 'السعر لكل م²',
    pricePerAreaEmpty: 'أضف سعرًا',
    nightlyRate: 'سعر الليلة',
    cleaningFee: 'رسوم التنظيف',
    minimumNights: 'الحد الأدنى لعدد الليالي',
    nights: (nights) =>
      plural('ar', nights, {
        zero: '{n} ليلة',
        one: 'ليلة واحدة',
        two: 'ليلتان',
        few: '{n} ليالٍ',
        many: '{n} ليلة',
        other: '{n} ليلة',
      }),
    swapMode: 'كيف تريد التبادل؟',
    swapModes: { swap: 'تبادل المنازل', host: 'الاستضافة فقط', both: 'أيٌّ منهما' },
    group: 'كيف يُعرض المنزل؟',
  },
  propertyTypes: {
    apartment: 'شقة',
    house: 'منزل',
    room: 'غرفة',
    studio: 'استوديو',
    duplex: 'دوبلكس',
    penthouse: 'بنتهاوس',
    coliving: 'سكن مشترك',
    hostel: 'نُزُل',
    other: 'أخرى',
  },
  propertyType: 'نوع العقار',
  addressPrecision: {
    exact: {
      title: 'العنوان الدقيق',
      description: 'يظهر الدبوس على المبنى. الأفضل للمنازل التي يسهل العثور عليها على أي حال.',
    },
    street: {
      title: 'الشارع فقط',
      description: 'يعرض الشارع دون الرقم. يُشارَك العنوان الدقيق بعد الحجز أو التوقيع.',
    },
    approximate: {
      title: 'منطقة تقريبية',
      description: 'يعرض دائرة بنحو 500 م. الخيار الأكثر خصوصية.',
    },
  },
  addressPrecisionLabel: 'دقة العنوان',
  addressPrecisionFootnote: 'تتبع الخريطة المنشورة هذا الاختيار. لا يُشارَك عنوانك الدقيق إلا مع من تؤكّدهم.',
  qualityTitle: 'جودة الإعلان',
  qualityScore: 'درجة جودة الإعلان',
  tips: 'نصائح',
  todo: 'مطلوب',
  needsWork: 'يحتاج إلى تحسين',
  good: 'جيد',
  excellent: 'ممتاز',
  previewTitle: 'معاينة',
  previewDescription: 'هكذا سيرى الضيوف إعلانك.',
  card: 'بطاقة',
  page: 'صفحة',
  previewAs: 'معاينة بصيغة',
  reviews: (n, shown) =>
    plural('ar', n, {
      zero: 'لا مراجعات',
      one: 'مراجعة واحدة',
      two: 'مراجعتان',
      few: '{s} مراجعات',
      many: '{s} مراجعة',
      other: '{s} مراجعة',
    }).replace('{s}', shown),
};

const MEDIA_HEADER_MESSAGES: Translations['MEDIA_HEADER_MESSAGES'] = {
  artistPick: 'اختيار الفنان',
  saveEpisode: 'حفظ الحلقة',
  share: 'مشاركة',
  podcastEpisode: 'حلقة بودكاست',
  listeningProgress: 'تقدّم الاستماع',
  shuffle: 'ترتيب عشوائي',
  download: 'تنزيل',
  downloadProgress: 'تقدّم التنزيل',
  follow: 'متابعة',
  following: 'تتم المتابعة',
  searchInPlaylist: 'البحث في قائمة التشغيل',
  compactView: 'عرض مضغوط',
  editDetails: 'تعديل التفاصيل',
  about: 'نبذة',
  discography: 'الأعمال الموسيقية',
  showAll: 'عرض الكل',
  albums: 'الألبومات',
  singlesAndEps: 'الأغاني المنفردة وEP',
  compilations: 'المجموعات',
  audiobook: 'كتاب صوتي',
  popular: 'الأكثر شيوعًا',
  seeMore: 'عرض المزيد',
  podcast: 'بودكاست',
  latestEpisode: 'أحدث حلقة',
  verifiedArtist: 'فنان موثّق',
  profile: 'الملف الشخصي',
  editProfile: 'تعديل الملف الشخصي',
};

const MENU_ITEM_MESSAGES: Translations['MENU_ITEM_MESSAGES'] = {
  diets: { vegetarian: 'نباتي', vegan: 'نباتي صرف', 'gluten-free': 'خالٍ من الغلوتين', 'dairy-free': 'خالٍ من الألبان', halal: 'حلال', kosher: 'كوشر' },
  spicy: 'حار',
  spiceOf: (label, level, max) => `${label} ${level} من ${max}`,
  originally: (price, original) => `${price}، بدلًا من ${original}`,
  inBasket: (n) => `في السلة: ${n}`,
  soldOut: 'نفدت الكمية',
  addItem: (name) => `إضافة ${name}`,
  choose: (n) => `اختر ${n}`,
  chooseRange: (min, max) => `اختر من ${min} إلى ${max}`,
  upTo: (n) => `حتى ${n}`,
  optional: 'اختياري',
  quantity: 'الكمية',
  addToBasket: 'أضف إلى السلة',
  options: 'الخيارات',
};

const PAGINATION_MESSAGES: Translations['PAGINATION_MESSAGES'] = {
  pagination: 'ترقيم الصفحات',
  goToPage: (page) => `الانتقال إلى الصفحة ${page}`,
};

const LEAD_SCORE_MESSAGES: Translations['LEAD_SCORE_MESSAGES'] = { title: 'تقييم العميل المحتمل', factors: 'مكوّنات التقييم', bands: { cold: 'بارد', warm: 'دافئ', hot: 'ساخن' } };

const DIRECTIONS_MESSAGES: Translations['DIRECTIONS_MESSAGES'] = {
  modes: { drive: 'القيادة', transit: 'المواصلات العامة', walk: 'المشي', cycle: 'الدراجة' },
  traffic: { light: 'حركة مرور خفيفة', moderate: 'حركة مرور متوسطة', heavy: 'حركة مرور كثيفة' },
  maneuvers: {
    depart: 'الانطلاق',
    straight: 'تابع مباشرةً',
    'slight-left': 'انعطف قليلًا إلى اليسار',
    left: 'انعطف يسارًا',
    'sharp-left': 'انعطف بحدة إلى اليسار',
    'slight-right': 'انعطف قليلًا إلى اليمين',
    right: 'انعطف يمينًا',
    'sharp-right': 'انعطف بحدة إلى اليمين',
    uturn: 'استدر للخلف',
    roundabout: 'عند الدوار',
    merge: 'اندمج في المسار',
    arrive: 'الوصول',
    board: 'اصعد',
    alight: 'انزل',
    transfer: 'بدّل الخط',
    walk: 'امشِ',
  },
  directions: 'الاتجاهات',
  otherRoutes: 'مسارات أخرى',
  travelMode: 'وسيلة التنقل',
  start: 'ابدأ',
  currentStep: 'الخطوة الحالية',
  line: (name) => `الخط ${name}`,
};

const CART_PANEL_MESSAGES: Translations['CART_PANEL_MESSAGES'] = {
  basket: 'السلة',
  checkout: 'المتابعة إلى الدفع',
  emptyTitle: 'سلتك فارغة',
  emptyDescription: 'أضف شيئًا من القائمة وسيظهر هنا.',
  soldOut: 'نفدت الكمية',
  removeItem: (name) => `إزالة ${name}`,
  originally: (price, original) => `${price}، بدلًا من ${original}`,
  promoCode: 'رمز الخصم',
  apply: 'تطبيق',
  tip: 'إكرامية',
};

const MEDIA_CARD_MESSAGES: Translations['MEDIA_CARD_MESSAGES'] = {
  albumTypes: { album: 'ألبوم', single: 'أغنية منفردة', ep: 'EP', compilation: 'مجموعة' },
  artist: 'فنان',
  verified: 'موثّق',
  audiobook: 'كتاب صوتي',
  narratedBy: (n) => `بصوت ${n}`,
  progressOf: (t) => `تقدّم ${t}`,
  episode: 'حلقة',
  played: 'تم الاستماع',
  event: 'فعالية',
  soldOut: 'نفدت التذاكر',
  listeningNow: 'يستمع الآن',
  trackBy: (t, a) => `${t} لـ ${a}`,
  mix: 'مزيج',
  playlist: 'قائمة تشغيل',
  collaborative: 'قائمة تعاونية',
  ownedBy: (o) => `بواسطة ${o}`,
  podcast: 'بودكاست',
  profile: 'الملف الشخصي',
  followsYou: 'يتابعك',
  song: 'أغنية',
  share: 'مشاركة',
  listened: 'تم الاستماع',
};

const JOB_BOARD_MESSAGES: Translations['JOB_BOARD_MESSAGES'] = {
  labels: {
    take: 'قبول المهمة',
    pass: 'تخطٍّ',
    distance: 'المسافة',
    duration: 'المدة',
    window: 'الفترة',
    pickup: 'الاستلام',
    dropoff: 'التسليم',
    state: { taken: 'محجوزة', expired: 'منتهية' },
    showPay: 'عرض الأجر',
    hidePay: 'إخفاء الأجر',
    payDetails: 'الأجر:',
    sort: 'ترتيب المهام',
    filtersToggle: 'عوامل التصفية',
    filtersActive: (n) => `مطبَّق: ${n}`,
    sortOptions: {
      pay: 'الأعلى أجرًا',
      distance: 'الأقرب',
      soonest: 'الأقرب بدءًا',
      expiring: 'الأقرب انتهاءً',
    },
    filters: { distance: 'المسافة', pay: 'الأجر', when: 'الموعد', vehicle: 'المركبة' },
    clearFilters: 'مسح عوامل التصفية',
    refresh: 'تحديث القائمة',
    count: (n) => plural('ar', n, { zero: 'لا مهام', one: 'مهمة واحدة', two: 'مهمتان', few: '{n} مهام', many: '{n} مهمة', other: '{n} مهمة' }),
    loading: 'جارٍ تحميل المهام',
  },
  emptyTitle: 'لا توجد مهام الآن',
  emptyDescription: 'لا شيء يطابق ما تبحث عنه. وسّع أحد عوامل التصفية أو حدّث القائمة بعد دقيقة.',
  list: 'المهام',
  payDetailsFor: (load) => `أجر ${load}`,
  route: (pickup, dropoff) => `${pickup} و${dropoff}`,
  bands: {
    anyDistance: 'أي مسافة',
    underKm: (km) => `أقل من ${km} كم`,
    anyTime: 'في أي وقت',
    withinHour: 'خلال الساعة',
    nextHours: (hours) => `خلال الساعات الـ${hours} القادمة`,
    today: 'اليوم',
  },
};

const FLOATING_MESSAGES: Translations['FLOATING_MESSAGES'] = {
  submenu: 'قائمة فرعية',
};

const AGENT_CHAT_MESSAGES: Translations['AGENT_CHAT_MESSAGES'] = {
  chat: {
    newChat: 'محادثة جديدة',
    emptyTitle: 'كيف يمكنني مساعدتك؟',
    emptyDescription: 'تعمل هذه المحادثة بمفتاح API الخاص بك. يبقى السجل في هذا المتصفح.',
    thinking: 'جارٍ التفكير',
    error: 'حدث خطأ ما. تحقق من سجلات الخادم، ثم حاول مرة أخرى.',
    suggestions: [
      'اشرح ما يفعله هذا المشروع المبدئي',
      'اكتب تحديثًا عن المنتج في ثلاث جمل',
      'اقترح خمسة أسماء لتطبيق جدولة مواعيد',
    ],
    you: 'أنت',
    assistant: 'المساعد',
  },
  actions: {
    share: 'مشاركة المحادثة',
    shared: 'تم نسخ نص المحادثة',
    more: 'إجراءات إضافية لهذه المحادثة',
    exportChats: 'تصدير المحادثات',
    markUnread: 'وضع علامة كغير مقروءة',
    deleteChat: 'حذف المحادثة',
  },
  message: { copy: 'نسخ الرسالة', readAloud: 'القراءة بصوت عالٍ', stopReading: 'إيقاف القراءة بصوت عالٍ' },
  history: {
    region: 'سجل المحادثات',
    recent: 'الأخيرة',
    empty: 'تظهر هنا المحادثات التي تبدأها.',
    rename: 'إعادة تسمية',
    renameField: 'إعادة تسمية المحادثة',
    markUnread: 'وضع علامة كغير مقروءة',
    unread: 'غير مقروءة',
    exportCount: (n) =>
      n === 0
        ? 'لا توجد محادثات لتصديرها'
        : plural('ar', n, {
            one: 'تصدير محادثة واحدة',
            two: 'تصدير محادثتين',
            few: 'تصدير {n} محادثات',
            many: 'تصدير {n} محادثة',
            other: 'تصدير {n} محادثة',
          }),
    accountMenu: (name) => `قائمة حساب ${name}`,
    usageLeft: 'الاستخدام المتبقي',
    upgrade: 'الترقية إلى Max',
    logOut: 'تسجيل الخروج',
  },
  composer: {
    field: 'الرسالة',
    placeholder: 'اسألني أي شيء',
    attach: 'إضافة مرفق',
    send: 'إرسال الرسالة',
    stop: 'إيقاف الإنشاء',
    notConfigured: 'غير مُعد',
    messageCount: (n) =>
      plural('ar', n, {
        zero: 'لا توجد رسائل',
        one: 'رسالة واحدة',
        two: 'رسالتان',
        few: '{n} رسائل',
        many: '{n} رسالة',
        other: '{n} رسالة',
      }),
    answeringWith: (model) => `الإجابة باستخدام ${model}`,
  },
  ago: {
    justNow: 'الآن',
    minutes: (n) =>
      plural('ar', n, { one: 'منذ دقيقة', two: 'منذ دقيقتين', few: 'منذ {n} دقائق', many: 'منذ {n} دقيقة', other: 'منذ {n} دقيقة' }),
    hours: (n) =>
      plural('ar', n, { one: 'منذ ساعة', two: 'منذ ساعتين', few: 'منذ {n} ساعات', many: 'منذ {n} ساعة', other: 'منذ {n} ساعة' }),
    days: (n) =>
      plural('ar', n, { one: 'منذ يوم', two: 'منذ يومين', few: 'منذ {n} أيام', many: 'منذ {n} يومًا', other: 'منذ {n} يوم' }),
  },
  age: { now: 'الآن', minutes: (n) => `${n} د`, hours: (n) => `${n} س`, days: (n) => `${n} ي` },
};

const WEB_SEARCH_MESSAGES: Translations['WEB_SEARCH_MESSAGES'] = { sources: 'المصادر', working: 'جارٍ العمل' };

const MAIL_THREAD_MESSAGES: Translations['MAIL_THREAD_MESSAGES'] = {
  to: 'إلى',
  cc: 'نسخة',
  bcc: 'نسخة مخفية',
  reply: 'رد',
  replyAll: 'الرد على الكل',
  forward: 'إعادة توجيه',
  more: COMMON_MESSAGES.more,
  moreAddresses: (n) => `${n} آخرون`,
  earlierMessages: (n) =>
    plural('ar', n, {
      zero: 'لا رسائل سابقة',
      one: 'رسالة سابقة واحدة',
      two: 'رسالتان سابقتان',
      few: '{n} رسائل سابقة',
      many: '{n} رسالة سابقة',
      other: '{n} رسالة سابقة',
    }),
  showTrimmed: 'عرض المحتوى المقتطع',
  hideTrimmed: 'إخفاء المحتوى المقتطع',
  unread: 'غير مقروءة',
  starred: 'مميّزة بنجمة',
  star: 'تمييز بنجمة',
  attachments: 'المرفقات',
  attachmentCount: (n) =>
    plural('ar', n, {
      zero: 'لا مرفقات',
      one: 'مرفق واحد',
      two: 'مرفقان',
      few: '{n} مرفقات',
      many: '{n} مرفقًا',
      other: '{n} مرفق',
    }),
  expand: 'توسيع الرسالة',
  collapse: 'طي الرسالة',
};

const NOTIFICATION_CENTER_MESSAGES: Translations['NOTIFICATION_CENTER_MESSAGES'] = {
  title: 'الإشعارات',
  emptyMessage: 'لقد اطّلعت على كل شيء.',
  emptyDescription: 'سيظهر النشاط الجديد هنا عند وصوله.',
  noUnread: 'لا توجد إشعارات غير مقروءة',
  unread: (n) =>
    plural('ar', n, {
      zero: 'لا إشعارات غير مقروءة',
      one: 'إشعار واحد غير مقروء',
      two: 'إشعاران غير مقروءين',
      few: '{n} إشعارات غير مقروءة',
      many: '{n} إشعارًا غير مقروء',
      other: '{n} إشعار غير مقروء',
    }),
  markAllRead: 'تعليم الكل كمقروء',
  category: 'فئة الإشعارات',
  tabs: { all: 'الكل', mentions: 'الإشارات', system: 'النظام' },
  unreadDot: 'غير مقروء',
};

const CHART_CARDS_MESSAGES: Translations['CHART_CARDS_MESSAGES'] = {
  titles: {
    activity: 'النشاط',
    agents: 'الوكلاء',
    visitors: 'الزوار',
    breakdown: 'التفصيل',
    sessions: 'الجلسات',
    contributionsThisYear: 'المساهمات هذا العام',
    earnedSoFar: 'الأرباح حتى الآن',
    signUpFunnel: 'مسار التسجيل',
    activeUsers: 'المستخدمون النشطون',
    revenue: 'الإيرادات',
    mostActiveDays: 'الأيام الأكثر نشاطًا',
    orders: 'الطلبات',
    trackedTime: 'الوقت المسجَّل',
    revenuePerAccount: 'الإيرادات لكل حساب',
    sleepScore: 'درجة النوم',
    pipeline: 'مسار المبيعات',
    steps: 'الخطوات',
    tokens: 'الرموز',
  },
  weekly: 'أسبوعي',
  monthly: 'شهري',
  yearly: 'سنوي',
  stepsSuffix: 'خطوة',
  today: 'اليوم',
  thisYear: 'هذا العام',
  lastYear: 'العام الماضي',
  sinceLastYear: 'مقارنةً بالعام الماضي',
  aYearEarlier: 'قبل عام',
  earningsPeriod: 'فترة الأرباح',
  changePeriod: 'تغيير الفترة',
  period: 'الفترة',
  total: 'الإجمالي',
  average: 'المتوسط',
  thisMonth: 'هذا الشهر',
  ofGoal: 'من الهدف',
  totalSteps: 'خطوة إجمالًا',
  gaugeChart: (title, reading) => `مقياس ${title}: ${reading}`,
  halfGaugeChart: (title, items) => `نصف مقياس ${title}: ${items}`,
  radialChart: (title, items) => `مخطط شعاعي لـ${title}: ${items}`,
  percentOfGoal: (pct) => `‎${pct}% من الهدف`,
  periodOf: (label) => `فترة ${label}`,
  chartVs: (title, current, previous) => `مخطط ${title}: ${current} مقارنةً بـ${previous}`,
  lineChart: (title) => `مخطط خطي لـ${title}`,
  barChart: (title, items) => `مخطط شريطي لـ${title}: ${items}`,
  comboChart: (title, bar, line) => `مخطط ${title}: أشرطة ${bar} مقارنةً بخط ${line}`,
  scatterChart: (title, series) => `مخطط انتشار لـ${title}: ${series}`,
  bubbleChart: (title, series) => `مخطط فقاعي لـ${title}: ${series}`,
  ringItem: (label, value, pct) => `${label} ${value}، ‎${pct}% من الهدف`,
  scoreOf: (score, max) => `${score} من ${max}`,
  activityFor: (name, day) => `النشاط في ${day} ${name}`,
  contributions: (n, date) => { const on = date ? ` في ${date}` : ''; return n === 0 ? `لا مساهمات${on}` : plural('ar', n, { one: `مساهمة واحدة${on}`, two: `مساهمتان${on}`, few: `{n} مساهمات${on}`, many: `{n} مساهمة${on}`, other: `{n} مساهمة${on}` }); },
};

const CODE_MESSAGES: Translations['CODE_MESSAGES'] = { copy: 'نسخ الرمز', copied: 'تم نسخ الرمز' };

const OUTLINE_NAV_MESSAGES: Translations['OUTLINE_NAV_MESSAGES'] = { outline: 'في هذه الصفحة', progress: (at, of) => `العنوان ${at} من ${of}` };

const STEPPER_MESSAGES: Translations['STEPPER_MESSAGES'] = { decrease: 'إنقاص', increase: 'زيادة' };

const CALL_UI_MESSAGES: Translations['CALL_UI_MESSAGES'] = {
  status: {
    calling: 'جارٍ الاتصال…',
    ringing: 'يرن',
    connecting: 'جارٍ التوصيل…',
    active: 'متصل',
    reconnecting: 'جارٍ إعادة الاتصال…',
    onHold: 'قيد الانتظار',
    ended: 'انتهت المكالمة',
  },
  controls: {
    mute: 'كتم الميكروفون',
    unmute: 'إلغاء كتم الميكروفون',
    speakerOn: 'تشغيل مكبر الصوت',
    speakerOff: 'إيقاف مكبر الصوت',
    videoOn: 'تشغيل الكاميرا',
    videoOff: 'إيقاف الكاميرا',
    flipCamera: 'تبديل الكاميرا',
    screenShareOn: 'مشاركة الشاشة',
    screenShareOff: 'إيقاف مشاركة الشاشة',
    addParticipant: 'إضافة مشارك',
    endCall: 'إنهاء المكالمة',
  },
  screen: {
    minimise: 'تصغير المكالمة',
    chat: 'فتح الدردشة',
    participants: 'المشاركون',
    movePip: (c) => `نقل صورتك (حاليًا في ${callUi_corner(CALL_UI_MESSAGES__CORNERS, c)})`,
  },
  pipCorners: CALL_UI_MESSAGES__CORNERS,
  history: {
    incoming: 'واردة',
    outgoing: 'صادرة',
    missed: 'فائتة',
    declined: 'مرفوضة',
    callBack: (name) => `معاودة الاتصال بـ${name}`,
  },
  incoming: {
    accept: 'قبول',
    decline: 'رفض',
    message: 'رسالة',
    remind: 'ذكّرني',
    slideToAnswer: 'اسحب للرد',
    voice: 'مكالمة صوتية واردة',
    video: 'مكالمة فيديو واردة',
  },
  returnToCall: 'العودة إلى المكالمة',
  returnToCallWith: (name) => `العودة إلى المكالمة مع ${name}`,
  join: 'انضمام',
  leave: 'مغادرة',
  speaking: (name) => `${name} يتحدث`,
  overflow: (n) => `+${n} آخرين`,
  muted: (name) => `${name}، الميكروفون مكتوم`,
};

const RECENT_HIRES_CARD_MESSAGES: Translations['RECENT_HIRES_CARD_MESSAGES'] = { title: 'التعيينات الأخيرة' };

const MAIL_LIST_MESSAGES: Translations['MAIL_LIST_MESSAGES'] = {
  draft: 'مسودة:',
  unread: 'غير مقروءة',
  starred: 'مميّزة بنجمة',
  star: 'تمييز بنجمة',
  attachment: 'تحتوي على مرفق',
  select: 'تحديد',
  threadCount: (n) =>
    plural('ar', n, {
      zero: 'لا رسائل',
      one: 'رسالة واحدة',
      two: 'رسالتان',
      few: '{n} رسائل',
      many: '{n} رسالة',
      other: '{n} رسالة',
    }),
  moreLabels: (n) =>
    plural('ar', n, {
      zero: 'لا تصنيفات أخرى',
      one: 'تصنيف آخر',
      two: 'تصنيفان آخران',
      few: '{n} تصنيفات أخرى',
      many: '{n} تصنيفًا آخر',
      other: '{n} تصنيف آخر',
    }),
  selectedCount: (n) => `تم تحديد ${n}`,
  selectAll: 'تحديد الكل',
  clearSelection: 'مسح التحديد',
  emptyTitle: 'لا يوجد شيء هنا',
  emptyDescription: 'يصل البريد الجديد إلى هذا المجلد.',
  today: 'اليوم',
  yesterday: 'أمس',
  list: 'البريد',
};

const IMPORTANT_ALERTS_CARD_MESSAGES: Translations['IMPORTANT_ALERTS_CARD_MESSAGES'] = { title: 'تنبيهات مهمة', thisWeek: 'هذا الأسبوع' };

const STAT_CARDS_MESSAGES: Translations['STAT_CARDS_MESSAGES'] = { about: (label) => `حول ${label}`, fromLastMonth: 'مقارنةً بالشهر الماضي' };

const SHAPE_MESSAGES: Translations['SHAPE_MESSAGES'] = {
  shapes: shapes_shapeNames(
    {
      square: 'مربع',
      slanted: 'مائل',
      arch: 'قوس',
      semicircle: 'نصف دائرة',
      oval: 'بيضاوي',
      pill: 'كبسولة',
      triangle: 'مثلث',
      arrow: 'سهم',
      fan: 'مروحة',
      diamond: 'معيّن',
      clamshell: 'صدفة',
      pentagon: 'خماسي',
      gem: 'جوهرة',
      'very-sunny': 'مشمس جدًا',
      sunny: 'مشمس',
      burst: 'انفجار',
      'soft-burst': 'انفجار ناعم',
      boom: 'دويّ',
      'soft-boom': 'دويّ ناعم',
      flower: 'زهرة',
      puffy: 'منتفخ',
      'puffy-diamond': 'معيّن منتفخ',
      'ghost-ish': 'شبه شبح',
      'pixel-circle': 'دائرة بكسلية',
      'pixel-triangle': 'مثلث بكسلي',
      bun: 'كعكة مستديرة',
      heart: 'قلب',
    },
    (n) => `كعكة بـ${n} جوانب`,
    (n) => `برسيم بـ${n} أوراق`,
  ),
};

const TENANCY_MESSAGES: Translations['TENANCY_MESSAGES'] = {
  leasePaymentStatus: { upcoming: 'قادم', due: 'مستحق قريبًا', overdue: 'متأخر', paid: 'مدفوع' },
  rentPaymentStatus: { paid: 'مدفوع', pending: 'قيد الانتظار', overdue: 'متأخر', partial: 'جزئي' },
  maintenanceCategory: {
    plumbing: 'سباكة',
    electrical: 'كهرباء',
    appliances: 'أجهزة منزلية',
    heating: 'تدفئة',
    other: 'أخرى',
  },
  maintenancePriority: { low: 'أولوية منخفضة', medium: 'أولوية متوسطة', high: 'أولوية عالية', urgent: 'عاجل' },
  maintenanceStage: { reported: 'تم الإبلاغ', acknowledged: 'تم الاستلام', scheduled: 'تمت الجدولة', resolved: 'تم الحل' },
  documentStatus: { signed: 'موقَّع', pending: 'بانتظار التوقيع', expired: 'منتهي الصلاحية' },
  timelineState: { complete: 'مكتمل', current: 'قيد التنفيذ', upcoming: 'لم يبدأ بعد' },
  leasePeriod: 'مدة الإيجار',
  monthlyRent: 'الإيجار الشهري',
  deposit: 'التأمين',
  nextPayment: 'الدفعة التالية',
  paidThisYear: 'المدفوع هذا العام',
  outstanding: 'المبلغ المستحق',
  noPayments: 'لا توجد دفعات بعد',
  columns: { month: 'الشهر', dueDate: 'تاريخ الاستحقاق', method: 'الطريقة', amount: 'المبلغ', status: 'الحالة' },
  downloadReceipt: (month) => `تنزيل إيصال ${month}`,
  dueOn: (date) => `يُستحق في ${date}`,
  comments: (n) =>
    plural('ar', n, {
      zero: 'لا تعليقات',
      one: 'تعليق واحد',
      two: 'تعليقان',
      few: '{n} تعليقات',
      many: '{n} تعليقًا',
      other: '{n} تعليق',
    }),
  photo: (position, total) => `الصورة ${position} من ${total}`,
  photoWithAlt: (alt, position, total) => `${alt}، الصورة ${position} من ${total}`,
  sign: 'توقيع',
  signDocument: (name) => `توقيع ${name}`,
  viewDocument: (name) => `عرض ${name}`,
  downloadDocument: (name) => `تنزيل ${name}`,
  noDocuments: 'لا توجد مستندات',
};

const DATA_TABLE_MESSAGES: Translations['DATA_TABLE_MESSAGES'] = {
  selectAll: 'تحديد كل الصفوف في هذه الصفحة',
  selectRow: (id) => `تحديد الصف ${id}`,
  densityLabel: 'كثافة الجدول',
  density: { md: 'عادية', sm: 'مضغوطة' },
};

const ERROR_BOUNDARY_MESSAGES: Translations['ERROR_BOUNDARY_MESSAGES'] = { title: 'حدث خطأ ما', message: 'حدث خطأ غير متوقع', retry: 'إعادة المحاولة' };

const AI_PROFILE_CARD_MESSAGES: Translations['AI_PROFILE_CARD_MESSAGES'] = {
  contributions: 'المساهمات هذا العام',
  activity: 'النشاط',
  periodGroup: (label) => `فترة ${label}`,
  periods: { weekly: 'أسبوعي', monthly: 'شهري', yearly: 'سنوي' },
};

const BREADCRUMB_MESSAGES: Translations['BREADCRUMB_MESSAGES'] = {
  breadcrumb: 'مسار التنقل',
};

const MESSAGE_MEDIA_MESSAGES: Translations['MESSAGE_MEDIA_MESSAGES'] = {
  photo: 'صورة',
  video: 'فيديو',
  photoOf: (i, total) => `الصورة ${i} من ${total}`,
  videoOf: (i, total) => `الفيديو ${i} من ${total}`,
  tapToView: 'انقر للعرض',
  sendingPhoto: 'جارٍ إرسال الصورة',
  sendingVideo: 'جارٍ إرسال الفيديو',
  sendingAlbum: 'جارٍ إرسال الألبوم',
  sendingSticker: 'جارٍ إرسال الملصق',
  sendingGif: 'جارٍ إرسال صورة GIF',
  album: (n) => `ألبوم، ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  sharedMedia: (n) => `الوسائط المشتركة، ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  sharedFiles: (n) => `الملفات المشتركة، ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  moreItems: (n) => `+${n} أخرى`,
  notSent: 'لم يتم الإرسال',
  voiceMessage: (d) => `رسالة صوتية، ${d}`,
  playVoiceMessage: 'تشغيل الرسالة الصوتية',
  pauseVoiceMessage: 'إيقاف الرسالة الصوتية مؤقتًا',
  transcribe: 'تحويل إلى نص',
  hideTranscript: 'إخفاء النص',
  seek: 'موضع التشغيل',
  seekPosition: (p, d) => `${p} من ${d}`,
  playbackSpeed: (r) => `سرعة التشغيل، ${r}`,
  unplayed: 'لم يتم تشغيلها',
  download: 'تنزيل',
  downloaded: 'تم التنزيل',
  file: 'ملف',
  fileKinds: {
    pdf: 'PDF',
    doc: 'مستند',
    sheet: 'جدول بيانات',
    slides: 'عرض تقديمي',
    zip: 'ZIP',
    audio: 'صوت',
    video: 'فيديو',
    image: 'صورة',
    code: 'رمز برمجي',
  },
  contact: 'جهة اتصال',
  message: 'مراسلة',
  add: 'إضافة',
  location: 'الموقع',
  liveLocation: 'الموقع المباشر',
  stopSharing: 'إيقاف المشاركة',
  vote: 'تصويت',
  viewResults: 'عرض النتائج',
  anonymousVoting: 'تصويت مجهول الهوية',
  quiz: 'اختبار',
  selectOne: 'اختر إجابة واحدة',
  selectOneOrMore: 'اختر إجابة أو أكثر',
  correctAnswer: 'الإجابة الصحيحة',
  yourAnswer: 'إجابتك',
  votes: (n) =>
    plural('ar', n, {
      zero: 'لا توجد أصوات',
      one: 'صوت واحد',
      two: 'صوتان',
      few: '{n} أصوات',
      many: '{n} صوتًا',
      other: '{n} صوت',
    }),
  sticker: 'ملصق',
};

const PIPELINE_MESSAGES: Translations['PIPELINE_MESSAGES'] = {
  health: { 'on-track': 'على المسار', 'at-risk': 'معرّضة للخطر', stalled: 'متوقفة' },
  stalledFor: (duration) => `متوقفة منذ ${duration}`,
  move: (title) => `نقل ${title}`,
  stages: 'مراحل خط المبيعات',
  stageWithCount: (name, n) =>
    `${name}، ${plural('ar', n, { zero: 'لا صفقات', one: 'صفقة واحدة', two: 'صفقتان', few: '{n} صفقات', many: '{n} صفقة', other: '{n} صفقة' })}`,
  empty: 'لا توجد صفقات في هذه المرحلة',
  loadMore: 'تحميل المزيد',
};

const STAY_SEARCH_MESSAGES: Translations['STAY_SEARCH_MESSAGES'] = {
  where: 'الوجهة',
  checkIn: 'تسجيل الوصول',
  checkOut: 'تسجيل المغادرة',
  when: 'متى',
  who: 'الضيوف',
  destinationPlaceholder: 'ابحث عن وجهات',
  datesPlaceholder: 'أضف التواريخ',
  guestsPlaceholder: 'أضف ضيوفًا',
  guests: { adults: 'البالغون', children: 'الأطفال', infants: 'الرضّع', pets: 'الحيوانات الأليفة' },
  guestDescriptions: {
    adults: '13 عامًا فأكثر',
    children: 'من 2 إلى 12 عامًا',
    infants: 'أقل من عامين',
    pets: 'هل ستصطحب حيوان خدمة؟',
  },
  dateFlexibility: 'مرونة التواريخ',
  exactDates: 'تواريخ محددة',
  plusMinusDays: (n) =>
    plural('ar', n, {
      zero: '± {n} يوم',
      one: '± يوم واحد',
      two: '± يومان',
      few: '± {n} أيام',
      many: '± {n} يومًا',
      other: '± {n} يوم',
    }),
  destinations: 'الوجهات',
  whereTo: 'إلى أين؟',
  filters: 'عوامل التصفية',
};

const AUTH_CARD_MESSAGES: Translations['AUTH_CARD_MESSAGES'] = {
  modes: {
    signin: {
      title: 'مرحبًا بعودتك',
      description: 'سجّل الدخول لتتابع من حيث توقفت.',
      cta: 'تسجيل الدخول',
      switchLead: 'جديد هنا؟',
      switchAction: 'إنشاء حساب',
    },
    signup: {
      title: 'أنشئ حسابك',
      description: 'ابدأ خلال دقيقتين.',
      cta: 'إنشاء حساب',
      switchLead: 'لديك حساب بالفعل؟',
      switchAction: 'تسجيل الدخول',
    },
    verify: {
      title: 'تحقق من بريدك الوارد',
      description: 'أدخل الرمز الذي أرسلناه لإكمال تسجيل الدخول.',
      cta: 'تحقق وتابع',
      switchLead: 'لم يصلك الرمز؟',
      switchAction: 'إرسال رمز جديد',
    },
  },
  codeSentTo: (email) => `أدخل الرمز الذي أرسلناه إلى ${email} لإكمال تسجيل الدخول.`,
  verificationCode: 'رمز التحقق',
  fullName: 'الاسم الكامل',
  namePlaceholder: 'سارة أحمد',
  email: 'البريد الإلكتروني',
  emailPlaceholder: 'you@company.com',
  emailHint: 'نستخدمه للتواصل معك، ولا نشاركه أبدًا.',
  password: 'كلمة المرور',
  passwordPlaceholder: 'أدخل كلمة المرور',
  newPasswordPlaceholder: '8 أحرف على الأقل',
  confirmPassword: 'تأكيد كلمة المرور',
  confirmPasswordPlaceholder: 'أعد إدخال كلمة المرور',
  rememberMe: 'تذكرني',
  forgotPassword: 'هل نسيت كلمة المرور؟',
  terms: 'بإنشاء حساب، فإنك توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا.',
  orContinueWith: 'أو تابع باستخدام',
};

const TRACK_LIST_MESSAGES: Translations['TRACK_LIST_MESSAGES'] = {
  title: 'العنوان',
  album: 'الألبوم',
  dateAdded: 'تاريخ الإضافة',
  plays: 'مرات التشغيل',
  duration: 'المدة',
  moveUp: 'نقل لأعلى',
  moveDown: 'نقل لأسفل',
  reorder: 'إعادة الترتيب',
  downloaded: 'تم التنزيل',
  unavailable: 'غير متاح',
  tracks: 'الأغاني',
  episodes: 'الحلقات',
  selected: (n) => plural('ar', n, { zero: 'تم تحديد {n} عنصر', one: 'تم تحديد عنصر واحد', two: 'تم تحديد عنصرين', few: 'تم تحديد {n} عناصر', many: 'تم تحديد {n} عنصرًا', other: 'تم تحديد {n} عنصر' }),
  clearSelection: 'مسح التحديد',
  played: 'تم التشغيل',
  listened: 'تم الاستماع',
  saveEpisode: 'حفظ الحلقة',
  downloadEpisode: 'تنزيل الحلقة',
  minutes: (m) => `${m} د`,
  hours: (h) => `${h} س`,
  hoursMinutes: (h, m) => `${h} س ${m} د`,
  remaining: (l) => `المتبقي ${l}`,
};

const LYRICS_MESSAGES: Translations['LYRICS_MESSAGES'] = {
  lyrics: 'الكلمات',
  showLyrics: 'عرض الكلمات',
  backToCurrent: 'العودة إلى السطر الحالي',
  empty: 'كلمات هذا المقطع غير متوفرة',
};

const ACTIVITY_FEED_MESSAGES: Translations['ACTIVITY_FEED_MESSAGES'] = {
  kinds: { call: 'مكالمة', email: 'بريد إلكتروني', meeting: 'اجتماع', note: 'ملاحظة', 'stage-change': 'تغيير المرحلة', task: 'مهمة مكتملة' },
  empty: 'لم يُسجَّل أي نشاط بعد',
  loggedBy: (name) => `سجّله ${name}`,
  filterActivity: 'تصفية النشاط',
};

const PLACE_REVIEWS_MESSAGES: Translations['PLACE_REVIEWS_MESSAGES'] = {
  depositReturned: 'تم رد التأمين',
  depositNotReturned: 'لم يتم رد التأمين',
  recommend: 'أنصح به',
  notRecommend: 'لا أنصح به',
  helpful: 'مفيد',
  report: 'إبلاغ',
  promptTitle: 'هل سكنت هنا؟',
  promptDescription: (building) =>
    `ساعد المستأجرين القادمين في ${building}. المراجعات مجهولة الهوية.`,
  writeReview: 'اكتب مراجعة',
  reviewCount: (n) =>
    plural('ar', n, {
      zero: 'لا توجد مراجعات',
      one: 'مراجعة واحدة',
      two: 'مراجعتان',
      few: '{n} مراجعات',
      many: '{n} مراجعة',
      other: '{n} مراجعة',
    }),
  depositRate: (percent) => `تم رد التأمين في ${percent}% من عقود الإيجار`,
  recommendRate: (percent) => `${percent}% ينصحون بالسكن هنا`,
};

const DELIVERY_SLOT_MESSAGES: Translations['DELIVERY_SLOT_MESSAGES'] = {
  tiers: { standard: 'عادي', express: 'سريع' },
  soldOut: 'نفدت الأماكن',
  asap: 'في أقرب وقت ممكن',
  field: 'وقت التوصيل',
  day: 'اليوم',
  emptyTitle: 'لا توجد فترات متاحة',
  emptyDescription: 'اختر يومًا آخر، أو أقرب مندوب متاح.',
};

const PLACE_LIST_MESSAGES: Translations['PLACE_LIST_MESSAGES'] = {
  visibility: { private: 'خاصة', shared: 'مشتركة', public: 'عامة' },
  places: (n) => plural('ar', n, { zero: 'لا توجد أماكن', one: 'مكان واحد', two: 'مكانان', few: '{n} أماكن', many: '{n} مكانًا', other: '{n} مكان' }),
  sharedWith: (n) => plural('ar', n, { one: 'تمت مشاركتها مع شخص واحد', two: 'تمت مشاركتها مع شخصين', few: 'تمت مشاركتها مع {n} أشخاص', many: 'تمت مشاركتها مع {n} شخصًا', other: 'تمت مشاركتها مع {n} شخص' }),
  labels: {
    moveEarlier: (position) => `نقل إلى الموضع ${position - 1}`,
    moveLater: (position) => `نقل إلى الموضع ${position + 1}`,
    remove: (name) => `إزالة ${name} من القائمة`,
    moved: (name, position, total) => `تم نقل ${name} إلى الموضع ${position} من ${total}`,
    note: 'ملاحظة',
  },
  savedPlaces: 'الأماكن المحفوظة',
};

const HOME_SEARCH_MESSAGES: Translations['HOME_SEARCH_MESSAGES'] = {
  modes: { rent: 'إيجار', buy: 'شراء', stays: 'إيجارات العطلات', swap: 'تبادل' },
  searchMode: 'وضع البحث',
  location: 'الموقع',
  locationPlaceholder: 'ابحث عن مدينة أو منطقة',
  moveIn: 'الانتقال',
  datePlaceholder: 'أضف تاريخًا',
  budget: 'الميزانية',
  budgetPlaceholder: 'أضف ميزانية',
  price: 'السعر',
  pricePlaceholder: 'أي سعر',
  propertyType: 'نوع العقار',
  propertyTypePlaceholder: 'أي نوع',
  dates: 'التواريخ',
  homeSize: 'مساحة المنزل',
  homeSizePlaceholder: 'أي مساحة',
  minimum: 'الحد الأدنى',
  maximum: 'الحد الأقصى',
  budgetPresets: 'نطاقات الميزانية',
  monthlyBudget: 'الميزانية الشهرية',
  monthlyBudgetDescription: 'الإيجار الشهري دون الفواتير',
  totalPriceDescription: 'السعر الإجمالي',
  upTo: (amount) => `حتى ${amount}`,
  any: 'أي',
  moveInLabels: {
    date: 'تاريخ الانتقال',
    flexible: 'مرن',
    asap: 'في أقرب وقت ممكن',
    contractLength: 'مدة العقد',
  },
  contractLengths: { any: 'أي مدة', short: '1–6 أشهر', medium: '6–12 شهرًا', long: 'أكثر من سنة' },
  saveSearch: 'حفظ البحث',
  saved: 'محفوظ',
  newCount: (n) =>
    plural('ar', n, {
      zero: 'لا نتائج جديدة',
      one: 'نتيجة جديدة',
      two: 'نتيجتان جديدتان',
      few: '{n} نتائج جديدة',
      many: '{n} نتيجة جديدة',
      other: '{n} نتيجة جديدة',
    }),
  alertsOff: 'التنبيهات متوقفة',
  actionOn: (action, subject) => `${action} ${subject}`,
};

const OFFERING_BADGE_MESSAGES: Translations['OFFERING_BADGE_MESSAGES'] = { offerings: { long_term_rent: 'للإيجار', sale: 'للبيع', short_term_rent: 'إيجار سياحي', exchange: 'مقايضة' } };

const MAP_ATTRIBUTION_MESSAGES: Translations['MAP_ATTRIBUTION_MESSAGES'] = { scale: 'مقياس الرسم', mapData: 'بيانات الخريطة' };

const SLIDER_MESSAGES: Translations['SLIDER_MESSAGES'] = { minimum: 'الحد الأدنى', maximum: 'الحد الأقصى', value: (n) => `القيمة ${n}` };

const SELECT_MESSAGES: Translations['SELECT_MESSAGES'] = { selectOption: 'اختر خيارًا', scrollUp: 'التمرير لأعلى', scrollDown: 'التمرير لأسفل' };

const ZOOMABLE_MEDIA_GALLERY_MESSAGES: Translations['ZOOMABLE_MEDIA_GALLERY_MESSAGES'] = {
  close: 'إغلاق عارض الوسائط',
  previous: 'العنصر السابق',
  next: 'العنصر التالي',
  goTo: (i, n) => `الانتقال إلى العنصر ${i} من ${n}`,
  share: 'مشاركة الوسائط',
};

const NOTIFICATION_MESSAGES: Translations['NOTIFICATION_MESSAGES'] = { dismiss: 'تجاهل الإشعار' };

const PHONE_INPUT_MESSAGES: Translations['PHONE_INPUT_MESSAGES'] = { phoneNumber: 'رقم الهاتف', countryCode: 'رمز البلد' };

const VENDOR_CARD_MESSAGES: Translations['VENDOR_CARD_MESSAGES'] = {
  facts: { deliveryTime: 'وقت التوصيل', deliveryFee: 'التوصيل', distance: 'المسافة', minimumOrder: 'الحد الأدنى للطلب' },
  availability: { paused: 'متوقف مؤقتًا', closed: 'مغلق' },
  new: 'جديد',
  rated: (value, reviews) =>
    `التقييم ${value} من 5${vendorCard_has(reviews) ? `، ${vendorCard_counted('ar', reviews, { zero: 'لا مراجعات', one: 'مراجعة واحدة', two: 'مراجعتان', few: '{n} مراجعات', many: '{n} مراجعة', other: '{n} مراجعة' })}` : ''}`,
};

const CHAT_INDICATORS_MESSAGES: Translations['CHAT_INDICATORS_MESSAGES'] = {
  presence: { online: 'متصل', idle: 'بعيد', offline: 'غير متصل', busy: 'مشغول' },
  status: { sending: 'جارٍ الإرسال…', sent: 'تم الإرسال', delivered: 'تم التسليم', read: 'تمت القراءة', failed: 'لم يتم الإرسال' },
  unread: 'غير مقروءة',
  unreadCount: (n) =>
    plural('ar', n, {
      zero: 'لا توجد رسائل غير مقروءة',
      one: 'رسالة واحدة غير مقروءة',
      two: 'رسالتان غير مقروءتين',
      few: '{n} رسائل غير مقروءة',
      many: '{n} رسالة غير مقروءة',
      other: '{n} رسالة غير مقروءة',
    }),
};

const MEDIA_CONTROLS_MESSAGES: Translations['MEDIA_CONTROLS_MESSAGES'] = {
  play: 'تشغيل',
  pause: 'إيقاف مؤقت',
  playSubject: (s) => `تشغيل ${s}`,
  pauseSubject: (s) => `إيقاف ${s} مؤقتًا`,
  saveToLibrary: 'حفظ في مكتبتك',
  saveSubjectToLibrary: (s) => `حفظ ${s} في مكتبتك`,
  explicit: 'محتوى صريح',
  seek: 'موضع التشغيل',
  seekValue: (a, b) => `${a} من ${b}`,
  mute: 'كتم الصوت',
  unmute: 'إلغاء كتم الصوت',
  volume: 'مستوى الصوت',
  nowPlaying: 'قيد التشغيل الآن',
};

const INPUT_OTP_MESSAGES: Translations['INPUT_OTP_MESSAGES'] = {
  oneTimeCode: 'رمز لمرة واحدة',
  digitOf: (i, n) => `الرقم ${i} من ${n}`,
  characterOf: (i, n) => `الحرف ${i} من ${n}`,
};

const PLACE_DETAILS_MESSAGES: Translations['PLACE_DETAILS_MESSAGES'] = {
  infoActions: { call: 'اتصال', open: 'فتح الموقع الإلكتروني', directions: 'الاتجاهات' },
  busy: {
    busier: 'أكثر ازدحامًا من المعتاد',
    typical: 'مزدحم كالمعتاد',
    quieter: 'أقل ازدحامًا من المعتاد',
  },
  transitModes: {
    bus: 'موقف حافلات',
    metro: 'محطة مترو',
    train: 'محطة قطار',
    tram: 'محطة ترام',
    ferry: 'محطة العبّارات',
  },
  notAvailable: 'غير متاح',
  amenities: 'المرافق',
  today: 'اليوم',
  closed: 'مغلق',
  openingHours: 'ساعات العمل',
  day: 'اليوم',
  noDataForDay: 'لا توجد بيانات لهذا اليوم',
  chartNoData: (day) => `${day}، لا توجد بيانات`,
  chartClosed: (day) => `${day}، مغلق طوال اليوم`,
  chartPeak: (day, hour) => `${day}، الأكثر ازدحامًا الساعة ${hour}`,
  chartNow: (hour) => `الآن ${hour}`,
  live: 'مباشر',
  noDepartures: 'لا توجد مغادرات الآن',
  nearbyTransit: 'المواصلات القريبة',
  lines: 'الخطوط',
  line: (name) => `الخط ${name}`,
  towards: (headsign) => `إلى ${headsign}`,
};

const APP_SHELL_MESSAGES: Translations['APP_SHELL_MESSAGES'] = {
  openNavigation: 'فتح التنقل',
  closeNavigation: 'إغلاق التنقل',
  resizePanes: 'تغيير حجم الأجزاء',
  notifications: 'الإشعارات',
  proOffer: 'عرض Pro',
};

const ROUTE_STOPS_MESSAGES: Translations['ROUTE_STOPS_MESSAGES'] = {
  routeStops: 'محطات المسار',
  origin: 'نقطة البداية',
  destination: 'الوجهة',
  stop: (position) => `المحطة ${position}`,
  swap: 'تبديل نقطة البداية والوجهة',
  addStop: 'إضافة محطة',
  removeStop: (title) => `إزالة ${title}`,
  state: { reached: 'تم الوصول', current: 'المحطة الحالية', pending: 'لم يتم الوصول' },
};

const SEARCH_MESSAGES: Translations['SEARCH_MESSAGES'] = { clearQuery: 'مسح عبارة البحث' };

const TAG_FIELD_MESSAGES: Translations['TAG_FIELD_MESSAGES'] = { remove: (t) => `إزالة ${t}`, full: (n) => `الحد الأقصى ${n}`, suggestions: 'اقتراحات' };

const STAY_FILTERS_MESSAGES: Translations['STAY_FILTERS_MESSAGES'] = {
  propertyTypes: {
    apartment: 'شقة',
    house: 'منزل',
    room: 'غرفة',
    studio: 'استوديو',
    duplex: 'دوبلكس / بنتهاوس',
    coliving: 'سكن مشترك',
    hostel: 'نُزُل',
    other: 'أرض / أخرى',
  },
  features: {
    elevator: 'مصعد',
    parking: 'موقف سيارات',
    terrace: 'شرفة',
    garden: 'حديقة',
    pool: 'مسبح',
    furnished: 'مفروش',
    pets: 'يُسمح بالحيوانات الأليفة',
    airConditioning: 'تكييف',
    heating: 'تدفئة',
    accessible: 'مهيأ لذوي الإعاقة',
    storage: 'غرفة تخزين',
  },
  floors: { ground: 'الطابق الأرضي', middle: 'طابق متوسط', top: 'الطابق الأخير', elevator: 'مع مصعد' },
  minimum: 'الحد الأدنى',
  maximum: 'الحد الأقصى',
  priceRange: 'نطاق السعر',
  area: 'المساحة',
  featuresGroup: 'المزايا',
  floor: 'الطابق',
  propertyType: 'نوع العقار',
  energyRating: 'تصنيف الطاقة',
  anyRating: 'أي تصنيف',
  ratingOnly: (r) => `${r} فقط`,
  ratingAndBetter: (r) => `${r} أو أفضل`,
  filters: 'عوامل التصفية',
  filtersApplied: (label, n) =>
    `${label}، ${plural('ar', n, {
      zero: 'لا عوامل مطبّقة',
      one: 'عامل واحد مطبّق',
      two: 'عاملان مطبّقان',
      few: '{n} عوامل مطبّقة',
      many: '{n} عاملًا مطبّقًا',
      other: '{n} عامل مطبّق',
    })}`,
  clearAll: 'مسح الكل',
  any: 'أي',
  availableNow: 'متاح الآن',
  availableNowDescription: 'جاهز للسكن اليوم',
  availableFrom: 'متاح من',
  anyDate: 'أي تاريخ',
};

const SETTINGS_MODAL_MESSAGES: Translations['SETTINGS_MODAL_MESSAGES'] = {
  dialog: 'الإعدادات',
  nav: 'أقسام الإعدادات',
  close: 'إغلاق الإعدادات',
  saved: 'تم الحفظ',
  currentPlan: 'الخطة الحالية',
  actions: 'الإجراءات',
  storage: {
    storedIn: 'مخزّنة في',
    fileCount: (n, shown) =>
      plural('ar', n, {
        zero: `${shown} ملف`,
        one: 'ملف واحد',
        two: 'ملفان',
        few: `${shown} ملفات`,
        many: `${shown} ملفًا`,
        other: `${shown} ملف`,
      }),
    filterByType: 'التصفية حسب نوع الملف',
    fileType: 'نوع الملف',
    orderBy: 'الترتيب حسب',
    modified: 'تاريخ التعديل',
    oldestFirst: 'الأقدم أولًا',
    searchFiles: 'البحث في الملفات',
    selectAllOnPage: 'تحديد كل الملفات في هذه الصفحة',
    fileName: 'اسم الملف',
    uploadedOn: 'تاريخ الرفع',
    fileSize: 'حجم الملف',
    sortBy: { name: 'الترتيب حسب اسم الملف', uploadedAt: 'الترتيب حسب تاريخ الرفع', size: 'الترتيب حسب حجم الملف' },
    selectFile: (name) => `تحديد ${name}`,
    deleteFile: 'حذف الملف',
    deleteNamed: (name) => `حذف ${name}`,
    noMatches: 'لا توجد ملفات تطابق عوامل التصفية.',
    documents: 'المستندات',
    spreadsheets: 'جداول البيانات',
    videos: 'الفيديوهات',
    downloadFile: 'تنزيل الملف',
    rename: 'إعادة التسمية',
    copyLink: 'نسخ الرابط',
  },
  tools: {
    showOutput: 'عرض المخرجات',
    refreshTools: 'تحديث الأدوات',
    removeServer: 'إزالة الخادم',
    logout: 'تسجيل الخروج',
    logOutOf: (server) => `تسجيل الخروج من ${server}`,
    showTools: (server) => `عرض أدوات ${server}`,
    hideTools: (server) => `إخفاء أدوات ${server}`,
    error: 'خطأ',
    showOutputLink: 'عرض المخرجات',
    showOutputOf: (server) => `عرض مخرجات ${server}`,
    newServer: 'خادم MCP جديد',
    newServerDescription: 'إضافة خادم MCP مخصص',
    projectScope: 'نطاق المشروع',
    authentication: 'المصادقة',
    waitForAuth: 'انتظار مصادقة MCP',
    waitForAuthDescription:
      'الانتظار دون حد زمني للمصادقة عند طلبها. عند الإيقاف، يتم تخطي طلبات المصادقة بعد 30 ثانية.',
    waitForAuthSwitch: 'انتظار مصادقة MCP',
    scopeServers: (scope) => `خوادم MCP في ${scope}`,
    scopeServersDescription: (scope) => `الخوادم المتاحة من ${scope}.`,
    teamServers: 'خوادم MCP للفريق',
    teamServersDescription: 'مُعدّة في لوحة التحكم',
    manage: 'إدارة',
    noTeamServers: 'لا توجد خوادم MCP للفريق',
    noTeamServersBody: 'اضبط خوادم MCP في لوحة التحكم لإتاحتها على سطح المكتب وفي السحابة.',
    configureTeam: 'ضبط خوادم MCP للفريق',
    pluginServers: 'خوادم MCP للإضافات',
  },
};

const EVICTION_MESSAGES: Translations['EVICTION_MESSAGES'] = {
  status: {
    scheduled: 'مُجدوَل',
    postponed: 'مؤجَّل',
    suspended: 'معلَّق',
    executed: 'مُنفَّذ',
    cancelled: 'ملغى',
  },
  attend: 'سأكون هناك',
  share: 'مشاركة',
  contactSupport: 'التواصل مع مجموعة الدعم',
  verified: 'تحقّق منه المجتمع',
  caseHistory: 'سجل القضية',
  source: (source) => `المصدر: ${source}`,
};

const BOOKING_MESSAGES: Translations['BOOKING_MESSAGES'] = {
  checkIn: 'تسجيل الوصول',
  checkOut: 'تسجيل المغادرة',
  guests: 'الضيوف',
  addDate: 'إضافة تاريخ',
  reserve: 'احجز',
  checkAvailability: 'تحقق من التوفر',
  notChargedYet: 'لن يتم تحصيل أي مبلغ منك بعد',
  total: 'الإجمالي',
  tripStatus: { confirmed: 'مؤكد', pending: 'قيد الانتظار', cancelled: 'ملغى', completed: 'مكتمل' },
  priceName: booking_priceName((p, u) => `${p} لكل ${u}`, (s, o) => `${s}، بدلاً من ${o}`),
};

const AGENT_LIMITS_CARD_MESSAGES: Translations['AGENT_LIMITS_CARD_MESSAGES'] = { contextWindow: 'نافذة السياق', freeSpace: 'المساحة الفارغة', planUsageLimits: 'حدود استخدام الخطة', managePlan: 'إدارة الخطة' };

const SWIPE_ROW_MESSAGES: Translations['SWIPE_ROW_MESSAGES'] = {
  closeActions: 'إغلاق الإجراءات',
};

const PATIENT_INFO_CARD_MESSAGES: Translations['PATIENT_INFO_CARD_MESSAGES'] = { addPhoto: 'إضافة صورة الملف الشخصي' };

const THEME_TOGGLE_MESSAGES: Translations['THEME_TOGGLE_MESSAGES'] = { theme: 'المظهر', darkMode: 'الوضع الداكن', lightMode: 'الوضع الفاتح', useDarkMode: 'استخدام الوضع الداكن', useLightMode: 'استخدام الوضع الفاتح' };

const EARNINGS_MESSAGES: Translations['EARNINGS_MESSAGES'] = {
  earned: 'الأرباح',
  period: 'فترة الأرباح',
  breakdown: 'مصدر الأرباح',
  payout: 'الدفعة التالية',
  payoutState: { scheduled: 'مجدولة', processing: 'في الطريق', paid: 'مدفوعة', held: 'معلّقة', failed: 'فشلت' },
  chart: (label) => `أرباح ${label} حسب الفترة`,
  empty: 'لا أرباح بعد',
  earnings: 'الأرباح',
};

const PROOF_OF_DELIVERY_MESSAGES: Translations['PROOF_OF_DELIVERY_MESSAGES'] = {
  labels: {
    signature: 'التوقيع',
    signaturePad: 'مساحة التوقيع',
    signatureHint: 'وقّع بإصبعك',
    signed: 'تم التوقيع',
    clear: 'مسح التوقيع',
    typeName: 'أو اكتب اسمك',
    typeNamePlaceholder: 'الاسم الكامل',
    photo: 'صورة',
    photoHint: 'المكان الذي تركته فيه، أو الطرد مع المستلم.',
    code: 'رمز التسليم',
    codeHint: 'اطلب من المستلم قراءة الرمز من تطبيقه.',
    recipient: 'من استلمه',
    recipientPlaceholder: 'الاسم',
    note: 'ملاحظة',
    notePlaceholder: 'أي شيء يستحق التسجيل',
    submit: 'تأكيد التسليم',
    required: 'مطلوب',
    missing: 'هذا مطلوب قبل أن تتمكن من التأكيد.',
    missingSummary: (n) =>
      plural('ar', n, { zero: 'لا ينقص شيء', one: 'ما زال ينقص شيء واحد', two: 'ما زال ينقص شيئان', few: 'ما زالت تنقص {n} أشياء', many: 'ما زال ينقص {n} شيئًا', other: 'ما زال ينقص {n} شيء' }),
  },
  proofOfDelivery: 'إثبات التسليم',
};

const FILE_UPLOAD_MESSAGES: Translations['FILE_UPLOAD_MESSAGES'] = {
  promptWeb: 'اسحب الملف وأفلته للرفع أو',
  promptNative: 'انقر',
  selectWeb: 'اختر ملفًا',
  selectNative: 'لاختيار ملف',
  uploading: (size) => `جارٍ رفع ${size}...`,
  uploaded: 'تم الرفع بنجاح!',
  unsupported: (extensions) => `الملفات المدعومة: ${extensions} فقط`,
  tooLarge: (max) => `حجم الملف أكبر من ${max}`,
  max: (size) => `(الحد الأقصى ${size})`,
  uploadFile: 'رفع ملف',
};

const POPOVER_MESSAGES: Translations['POPOVER_MESSAGES'] = {
  popover: 'نافذة منبثقة',
};

const QUEUE_PANEL_MESSAGES: Translations['QUEUE_PANEL_MESSAGES'] = {
  queueTab: 'قائمة الانتظار',
  recentTab: 'تم تشغيله مؤخرًا',
  close: 'إغلاق قائمة الانتظار',
  nextInQueue: 'التالي في قائمة الانتظار',
  nextFrom: (c) => `التالي من: ${c}`,
  nextUp: 'التالي',
  clearQueue: 'مسح قائمة الانتظار',
  reorder: (t) => `إعادة ترتيب ${t}`,
  reorderHint: 'اسحب أو استخدم مفاتيح الأسهم',
  moveUp: 'نقل لأعلى',
  moveDown: 'نقل لأسفل',
  remove: 'إزالة من قائمة الانتظار',
  moved: (t, p, n) => `تم نقل ${t} إلى الموضع ${p} من ${n}`,
  emptyQueue: 'قائمة الانتظار فارغة',
  emptyQueueHint: 'أضف أغاني وحلقات للاستماع إليها بعد ذلك.',
  emptyRecent: 'لم يتم تشغيل أي شيء بعد',
};

const HOVER_CARD_MESSAGES: Translations['HOVER_CARD_MESSAGES'] = {
  hoverCard: 'بطاقة معاينة',
};

const NOTE_EDITOR_MESSAGES: Translations['NOTE_EDITOR_MESSAGES'] = {
  header: {
    saved: 'تم الحفظ',
    saving: 'جارٍ الحفظ…',
    offline: 'غير متصل — التغييرات محفوظة مؤقتًا',
    error: 'لم يتم الحفظ',
    words: (n) =>
      plural('ar', n, {
        zero: 'لا كلمات',
        one: 'كلمة واحدة',
        two: 'كلمتان',
        few: '{n} كلمات',
        many: '{n} كلمة',
        other: '{n} كلمة',
      }),
    title: 'العنوان',
  },
  untitled: 'بلا عنوان',
  note: 'ملاحظة',
  toolbar: { more: 'تنسيق إضافي', moreMenu: 'تنسيق إضافي' },
};

const MEDIA_SHELF_MESSAGES: Translations['MEDIA_SHELF_MESSAGES'] = { filters: 'عوامل التصفية', showAll: 'عرض الكل' };

const CATEGORY_BAR_MESSAGES: Translations['CATEGORY_BAR_MESSAGES'] = { previous: 'الفئات السابقة', next: 'الفئات التالية' };

const CARRIER_QUOTE_MESSAGES: Translations['CARRIER_QUOTE_MESSAGES'] = {
  labels: {
    accept: 'قبول',
    message: 'رسالة',
    decline: 'رفض',
    pickup: 'الاستلام',
    eta: 'الوصول',
    vehicle: 'المركبة',
    jobs: (jobs) => `${jobs} مهمة`,
    verified: 'ناقل موثَّق',
    marks: { cheapest: 'الأرخص', fastest: 'الأسرع' },
    showPrice: 'عرض تفاصيل السعر',
    hidePrice: 'إخفاء تفاصيل السعر',
    priceDetails: 'تفاصيل السعر:',
    sort: 'ترتيب العروض',
    sortOptions: { price: 'الأرخص', eta: 'الأسرع', rating: 'الأعلى تقييمًا' },
    count: (n) => plural('ar', n, { zero: 'لا عروض', one: 'عرض واحد', two: 'عرضان', few: '{n} عروض', many: '{n} عرضًا', other: '{n} عرض' }),
    loading: 'جارٍ تحميل العروض',
  },
  emptyTitle: 'لا توجد عروض بعد',
  emptyDescription: 'يطّلع الناقلون على طلبك. تصل العروض الأولى عادةً خلال دقائق قليلة.',
  list: 'العروض',
  priceDetailsFor: (name) => `تفاصيل سعر ${name}`,
};

const TEXT_FIELD_MESSAGES: Translations['TEXT_FIELD_MESSAGES'] = { showPassword: 'إظهار كلمة المرور', hidePassword: 'إخفاء كلمة المرور', required: 'مطلوب' };

const CHAT_SCREEN_MESSAGES: Translations['CHAT_SCREEN_MESSAGES'] = {
  call: 'اتصال',
  videoCall: 'مكالمة فيديو',
  searchInConversation: 'البحث في المحادثة',
  connecting: 'جارٍ الاتصال…',
  verified: 'موثّق',
  bot: 'بوت',
  channel: 'قناة',
  clearSelection: 'مسح التحديد',
  forward: 'إعادة توجيه',
  pin: 'تثبيت',
  selectedCount: (n) => plural('ar', n, { one: 'تم تحديد عنصر واحد', two: 'تم تحديد عنصرين', few: 'تم تحديد {n} عناصر', other: 'تم تحديد {n} عنصر' }),
  pinnedList: 'عرض الرسائل المثبتة',
  pinnedClose: 'إخفاء شريط الرسائل المثبتة',
  pinnedUnpin: 'إلغاء تثبيت هذه الرسالة',
  pinnedMessage: 'رسالة مثبتة',
  pinnedMessageNumber: (n) => `رسالة مثبتة رقم ${n}`,
  scrollToBottom: 'الانتقال إلى أحدث الرسائل',
  jumpToMention: 'الانتقال إلى الإشارة',
  emptyTitle: 'لا توجد رسائل بعد',
  info: 'معلومات',
  members: 'الأعضاء',
  addMember: 'إضافة أعضاء',
  memberSearch: 'البحث عن أعضاء',
  noMembers: 'لم يتم العثور على أعضاء',
  owner: 'المالك',
  admin: 'مشرف',
  resizeList: 'تغيير حجم قائمة المحادثات',
};

const CONTEXT_MENU_MESSAGES: Translations['CONTEXT_MENU_MESSAGES'] = {
  contextMenu: 'القائمة السياقية',
};

const SORTABLE_MEDIA_MESSAGES: Translations['SORTABLE_MEDIA_MESSAGES'] = {
  photo: (p, t) => `الصورة ${p} من ${t}`,
  cover: 'الغلاف',
  moveEarlier: (p) => `نقل الصورة ${p} إلى موضع سابق`,
  moveLater: (p) => `نقل الصورة ${p} إلى موضع لاحق`,
  remove: (p) => `إزالة الصورة ${p}`,
  retry: (p) => `إعادة محاولة رفع الصورة ${p}`,
  uploading: (p) => `جارٍ رفع الصورة ${p}`,
  failed: 'تعذّر الرفع',
  add: 'إضافة صور',
  moved: (p, t) => `تم النقل إلى الموضع ${p} من ${t}`,
  photos: 'الصور',
};

const CONNECTION_DOTS_MESSAGES: Translations['CONNECTION_DOTS_MESSAGES'] = {
  connecting: 'جارٍ الاتصال',
};

const CHAT_PEOPLE_MESSAGES: Translations['CHAT_PEOPLE_MESSAGES'] = {
  newGroup: {
    photo: 'اختيار صورة المجموعة',
    name: 'اسم المجموعة',
    namePlaceholder: 'سمِّ هذه المجموعة',
    description: 'الوصف',
    descriptionPlaceholder: 'ما الغرض من هذه المجموعة؟',
    members: (n) =>
      plural('ar', n, {
        zero: 'لا يوجد أعضاء',
        one: 'عضو واحد',
        two: 'عضوان',
        few: '{n} أعضاء',
        many: '{n} عضوًا',
        other: '{n} عضو',
      }),
    addMembers: 'إضافة أعضاء',
    remove: (name) => `إزالة ${name}`,
  },
  member: {
    owner: 'المالك',
    admin: 'مشرف',
    promote: 'ترقية إلى مشرف',
    restrict: 'تقييد',
    remove: 'إزالة من المجموعة',
    actions: (name) => `إجراءات ${name}`,
  },
  story: {
    close: 'إغلاق القصة',
    previous: 'القصة السابقة',
    next: 'القصة التالية',
    mute: 'كتم صوت القصة',
    unmute: 'إلغاء كتم صوت القصة',
    more: 'خيارات القصة',
    replyPlaceholder: 'رد…',
    send: 'إرسال الرد',
    progress: (index, count) => `القصة ${index + 1} من ${count}`,
    react: (emoji) => `التفاعل بـ ${emoji}`,
  },
  searchMembers: 'البحث عن أعضاء',
  share: 'مشاركة',
  postOptions: 'خيارات المنشور',
  pinned: 'مثبّت',
  views: (c) =>
    plural('ar', c, {
      one: 'مشاهدة واحدة',
      two: 'مشاهدتان',
      few: `${c} مشاهدات`,
      other: `${c} مشاهدة`,
    }),
  forwards: (c) =>
    plural('ar', c, {
      one: 'إعادة توجيه واحدة',
      two: 'إعادتا توجيه',
      few: `${c} عمليات إعادة توجيه`,
      other: `${c} إعادة توجيه`,
    }),
  jumpTo: (letter) => `الانتقال إلى ${letter}`,
  add: 'إضافة',
  added: 'تمت الإضافة',
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
