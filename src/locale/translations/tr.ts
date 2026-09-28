// Bloom's tr strings for every family. Loaded on demand by
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

const CALL_UI_MESSAGES__CORNERS = { 'top-left': 'sol üst', 'top-right': 'sağ üst', 'bottom-left': 'sol alt', 'bottom-right': 'sağ alt' };

const COMMON_MESSAGES: Translations['COMMON_MESSAGES'] = {
  close: 'Kapat',
  dismiss: 'Yoksay',
  back: 'Geri',
  goBack: 'Geri dön',
  loading: 'Yükleniyor',
  more: 'Daha fazla',
  moreOptions: 'Diğer seçenekler',
  moreActions: 'Diğer işlemler',
  progress: 'İlerleme',
  stepOf: (step, total) => `Adım ${step}/${total}`,
  labelFor: (label, subject) => `${subject}: ${label}`,
  tapToClose: 'Kapatmak için dokunun',
  cancel: 'İptal',
  done: 'Bitti',
  save: 'Kaydet',
  delete: 'Sil',
  edit: 'Düzenle',
  remove: 'Kaldır',
  retry: 'Yeniden dene',
  search: 'Ara',
  showMore: 'Daha fazla göster',
  showLess: 'Daha az göster',
  next: 'İleri',
  previous: 'Önceki',
  open: 'Aç',
  menu: 'Menü',
  copy: 'Kopyala',
  copied: 'Kopyalandı',
  send: 'Gönder',
  clear: 'Temizle',
  seeAll: 'Tümünü gör',
  resizePanels: 'Panelleri yeniden boyutlandır',
};

const SURFACES_MESSAGES: Translations['SURFACES_MESSAGES'] = { confirm: 'Onayla', ok: 'Tamam' };

const CONTACT_CARD_MESSAGES: Translations['CONTACT_CARD_MESSAGES'] = {
  // The same colon form: Turkish case suffixes depend on the name's vowels.
  channels: {
    email: { action: 'E-posta', name: (s) => `E-posta gönder: ${s}` },
    phone: { action: 'Ara', name: (s) => `Ara: ${s}` },
    chat: { action: 'Mesaj', name: (s) => `Mesaj gönder: ${s}` },
    meeting: { action: 'Toplantı', name: (s) => `Toplantı planla: ${s}` },
    video: { action: 'Görüntülü', name: (s) => `Görüntülü arama başlat: ${s}` },
    website: { action: 'Web sitesi', name: (s) => `Web sitesini aç: ${s}` },
  },
  labelsFor: (name) => `Etiketler: ${name}`,
  owner: 'Sorumlu',
};

const CHAT_LIST_MESSAGES: Translations['CHAT_LIST_MESSAGES'] = {
  item: { draft: 'Taslak:', pinned: 'Sabitlendi', muted: 'Sessize alındı', verified: 'Doğrulanmış', channel: 'Kanal', bot: 'Bot', group: 'Grup' },
  search: { chat: 'Sohbetler', message: 'Mesajlar', contact: 'Kişiler', empty: 'Sonuç yok' },
  list: 'Sohbetler',
  emptyTitle: 'Henüz sohbet yok',
  emptyDescription: 'Bir sohbet başlatın, burada görünecek.',
  searchResults: 'Arama sonuçları',
  searchChats: 'Sohbetlerde ara',
  clearSearch: 'Aramayı temizle',
  newChat: 'Yeni sohbet',
  archived: 'Arşivlenenler',
  archivedName: (label, n) => `${label}, ${n} sohbet`,
  folderName: (label, n) => `${label}, ${n} okunmamış`,
  stories: 'Hikayeler',
  ownStory: 'Hikayen',
  addStory: 'Hikayene ekle',
  storyOf: (name) => `Hikaye: ${name}`,
};

const NOTE_CARD_MESSAGES: Translations['NOTE_CARD_MESSAGES'] = {
  pinned: 'Sabitlendi',
  locked: 'Korumalı',
  attachments: (n) => plural('tr', n, { other: '{n} ek' }),
  select: 'Notu seç',
  checklistDone: 'Tamamlandı',
  checklistTodo: 'Yapılacak',
  more: (n) => `${n} tane daha`,
};

const DIALOG_MESSAGES: Translations['DIALOG_MESSAGES'] = {
  view: 'Görünüm',
  dismissDialog: 'İletişim kutusunu kapat',
  dismissNamed: (label) => `${label} kapat`,
};

const ALERT_DIALOG_MESSAGES: Translations['ALERT_DIALOG_MESSAGES'] = {
  confirm: 'Onayla',
};

const SIDEBAR_MESSAGES: Translations['SIDEBAR_MESSAGES'] = {
  sidebar: 'Kenar çubuğu',
  collapse: 'Kenar çubuğunu daralt',
  expand: 'Kenar çubuğunu genişlet',
  close: 'Kenar çubuğunu kapat',
  quickSearch: 'Hızlı Arama',
  searchPlaceholder: 'Gezinmede ara…',
  searchPlaceholderCompact: 'Ara...',
  filter: 'Gezinmeyi filtrele',
  clearSearch: 'Gezinme aramasını temizle',
  noResults: 'Sonuç yok',
  mode: 'Mod',
  upgrade: 'Yükselt',
  usersWithAccess: 'Erişimi olan kullanıcılar',
  addUser: 'Kullanıcı ekle',
  manage: 'Yönet',
  accountMenu: 'Hesap menüsü',
  teamMenu: (team) => `${team} menüsü`,
};

const FILE_SIZE_UNITS: Translations['FILE_SIZE_UNITS'] = { byte: 'B', kilobyte: 'KB', megabyte: 'MB', gigabyte: 'GB' };

const CARD_FORM_MESSAGES: Translations['CARD_FORM_MESSAGES'] = {
  labels: { number: 'Kart numarası', expiry: 'Son kullanma tarihi', securityCode: 'Güvenlik kodu', name: 'Kart üzerindeki ad', postcode: 'Posta kodu', country: 'Ülke' },
  selectCountry: 'Ülke seçin',
};

const CHAT_COMPOSER_MESSAGES: Translations['CHAT_COMPOSER_MESSAGES'] = {
  attach: 'Ekle',
  emoji: 'Emoji',
  camera: 'Kamera',
  mic: 'Sesli mesaj kaydet',
  message: 'Mesaj',
  enterHint: 'Göndermek için Enter · Yeni satır için Shift + Enter',
  modEnterHint: 'Göndermek için ⌘ + Enter · Yeni satır için Enter',
  cancelRecording: 'Kaydı iptal et',
  sendVoice: 'Sesli mesajı gönder',
  deleteRecording: 'Kaydı sil',
  playRecording: 'Kaydı oynat',
  pauseRecording: 'Kaydı duraklat',
  lockRecording: 'Kaydı kilitle',
  slideToCancel: 'İptal için kaydır',
  recording: 'Kaydediliyor',
  searchEmoji: 'Emoji ara',
  noEmoji: 'Emoji bulunamadı',
  frequentlyUsed: 'Sık kullanılanlar',
  skinTone: 'Ten rengi',
  emojiPicker: 'Emoji seçici',
  moreReactions: 'Diğer tepkiler',
  quickReactions: 'Hızlı tepkiler',
  messageActions: 'Mesaj işlemleri',
  attachments: 'Ekler',
  removeAttachment: (name) => `Kaldır: ${name}`,
  suggestions: { mention: 'Kişiler', command: 'Komutlar', emoji: 'Emoji' },
  attachmentItems: { gallery: 'Galeri', camera: 'Kamera', file: 'Dosya', location: 'Konum', contact: 'Kişi', poll: 'Anket', music: 'Müzik' },
};

const MAIL_COMPOSE_MESSAGES: Translations['MAIL_COMPOSE_MESSAGES'] = {
  to: 'Kime',
  cc: 'Bilgi',
  bcc: 'Gizli',
  subject: 'Konu',
  showCopies: 'Bilgi Gizli',
  hideCopies: 'Bilgi ve Gizli alanlarını gizle',
  removeRecipient: (name) => `${name} adlı kişiyi kaldır`,
  suggestions: 'Kişiler',
  send: COMMON_MESSAGES.send,
  sending: 'Gönderiliyor',
  attach: 'Dosya ekle',
  discard: 'Taslağı sil',
  minimize: 'Küçült',
  expand: 'Genişlet',
  close: COMMON_MESSAGES.close,
  title: 'Yeni ileti',
};

const MEDIA_PLAYER_MESSAGES: Translations['MEDIA_PLAYER_MESSAGES'] = {
  lyrics: 'Şarkı sözleri',
  queue: 'Sıra',
  devices: 'Bir cihaza bağlan',
  fullscreen: 'Tam ekran',
  openPlayer: 'Oynatıcıyı aç',
  currentDevice: 'Geçerli cihaz',
  listeningOn: 'Şurada dinleniyor',
  listeningOnDevice: (d) => `${d} cihazında dinleniyor`,
  selectDevice: 'Bir cihaz seç',
  noDevices: 'Başka cihaz bulunamadı',
  deviceHelp: 'Cihazını göremiyor musun?',
  playbackSpeed: 'Oynatma hızı',
  sleepTimer: 'Uyku zamanlayıcısı',
  sleepOff: 'Kapalı',
  endOfEpisode: 'Bölüm sonu',
  oneHour: '1 saat',
  minutes: (n) => plural('tr', n, { other: '{n} dakika' }),
  stopsIn: (r) => `${r} sonra duracak`,
  shuffle: 'Karıştır',
  repeat: 'Tekrarla',
  repeatOne: 'Şarkıyı tekrarla',
  skipBack: (n) => plural('tr', n, { other: '{n} saniye geri' }),
  skipForward: (n) => plural('tr', n, { other: '{n} saniye ileri' }),
  closePlayer: 'Oynatıcıyı kapat',
  share: 'Paylaş',
  showLyrics: 'Şarkı sözlerini göster',
};

const ADDRESS_MESSAGES: Translations['ADDRESS_MESSAGES'] = { emptyTitle: 'Burada henüz bir şey yok', addresses: 'Adresler' };

const CREATOR_STUDIO_MESSAGES: Translations['CREATOR_STUDIO_MESSAGES'] = {
  releaseTypes: { single: 'Tekli', ep: 'EP', album: 'Albüm' },
  releaseStatuses: {
    draft: 'Taslak',
    'in-review': 'İncelemede',
    scheduled: 'Planlandı',
    live: 'Yayında',
    rejected: 'Reddedildi',
    takedown: 'Yayından kaldırıldı',
  },
  creditRoles: {
    songwriter: 'Şarkı yazarı',
    producer: 'Yapımcı',
    composer: 'Besteci',
    performer: 'Yorumcu',
    lyricist: 'Söz yazarı',
    'mixing-engineer': 'Miks mühendisi',
    'mastering-engineer': 'Mastering mühendisi',
  },
  periods: { '7d': '7 gün', '28d': '28 gün', '12m': '12 ay', all: 'Tüm zamanlar' },
  artworkNotSquare: (w, h) => `Kapak kare olmalı; bu görsel ${w}×${h} piksel.`,
  artworkTooSmall: (w, h, min) => `Kapak çok küçük (${w}×${h} piksel). En az ${min}×${min} piksel yükleyin.`,
  audience: { title: 'Kitle', period: 'Dönem' },
  breakdown: {
    locations: 'Öne çıkan konumlar',
    cities: 'Şehirler',
    countries: 'Ülkeler',
    age: 'Yaş',
    gender: 'Cinsiyet',
    sources: 'Dinleme kaynakları',
    metric: 'Dinleyiciler',
  },
  streams: {
    metrics: 'Grafik ölçütü',
    summary: (metric, releases) =>
      releases ? `Zaman içinde ${metric}; yayınlar: ${releases}` : `Zaman içinde ${metric}`,
  },
  topTracks: {
    title: 'En çok dinlenen parçalar',
    rank: '#',
    rankName: 'Sıra',
    track: 'Parça',
    streams: 'Dinlenme',
    listeners: 'Dinleyiciler',
    saves: 'Kaydetme',
    trend: 'Eğilim',
    trends: { up: 'Yükseliyor', down: 'Düşüyor', flat: 'Sabit', new: 'Yeni giriş' },
    newBadge: 'Yeni',
    empty: 'Bu dönemde henüz dinlenme yok.',
  },
  tracks: (n) => plural('tr', n, { one: '{n} parça', other: '{n} parça' }),
  timeline: {
    states: { complete: 'tamamlandı', current: 'devam ediyor', upcoming: 'başlamadı', error: 'ilgilenilmesi gerekiyor' },
    label: 'Yayın ilerlemesi',
  },
  upload: {
    queued: 'Sırada',
    processing: 'Dönüştürülüyor…',
    ready: 'Hazır',
    failed: 'Yükleme başarısız',
    remove: (name) => `Kaldır: ${name}`,
    progress: (name) => `${name} yükleniyor`,
  },
  artwork: {
    title: 'Kapak görseli',
    requirements: '3000×3000 piksel, JPG veya PNG',
    replace: 'Değiştir',
    remove: 'Kapak görselini kaldır',
    preview: 'Yayın kapağı',
    upload: 'Kapak görseli yükle',
  },
  credits: {
    title: 'Katkıda bulunanlar',
    role: 'Rol',
    name: 'Ad',
    add: 'Katkı ekle',
    remove: (index, name) => (name ? `${index + 1}. katkıyı kaldır, ${name}` : `${index + 1}. katkıyı kaldır`),
    empty: 'Bu parçanın söz yazarlarını, yapımcılarını ve yorumcularını belirtin.',
    field: (field, n) => `${field}, ${n}. katkı`,
  },
  artists: {
    add: 'Ekle',
    addTo: (label) => `${label}: ekle`,
    remove: (name) => `Kaldır: ${name}`,
  },
  isrc: { hint: 'Biçim: CC-XXX-YY-NNNNN', invalid: 'Bu geçerli bir ISRC değil' },
  metadata: {
    title: 'Parça adı',
    version: 'Sürüm',
    versionPlaceholder: 'Remiks, canlı, akustik…',
    explicit: 'Müstehcen sözler',
    explicitDescription: 'Parça kaba dil veya müstehcen temalar içeriyorsa bunu açın.',
    genre: 'Tür',
    genrePlaceholder: 'Tür seçin',
    primaryArtists: 'Ana sanatçılar',
    featuredArtists: 'Konuk sanatçılar',
    artistPlaceholder: 'Sanatçı adı ekleyin',
    language: 'Söz dili',
    languagePlaceholder: 'Dil seçin',
    lyrics: 'Şarkı sözleri',
    lyricsPlaceholder: 'Sözleri yapıştırın, söylenen her dize için bir satır',
  },
  payout: {
    estimated: 'Bu ayki tahmini kazanç',
    lastPayout: 'Son ödeme',
    nextPayout: 'Sonraki ödeme',
    statements: 'Hesap özetlerini görüntüle',
    chart: 'Aylık kazanç',
  },
  pitch: {
    title: 'Editörlere öner',
    description: 'Bir sonraki yayınınızı çıkmadan önce editör ekibine anlatın.',
    release: 'Yayın',
    releasePlaceholder: 'Yaklaşan bir yayın seçin',
    moods: 'Ruh hâli',
    genres: 'Tür',
    pitch: 'Öneriniz',
    pitchPlaceholder: 'Bu yayını öne çıkaran ne? Kimin için ve arkasındaki hikâye ne?',
    submit: 'Öneriyi gönder',
    tagLimit: (max) => `En fazla ${max} seçin`,
    statuses: { submitted: 'Öneri gönderildi', accepted: 'İncelemeye alındı', declined: 'Bu sefer seçilmedi' },
    statusDescriptions: {
      submitted: 'Editörler her öneriyi okur. Yayın tarihinden önce yanıt alacaksınız.',
      accepted: 'Yayınınız editoryal çalma listeleri için değerlendiriliyor.',
      declined: 'Bu yayın seçilmedi. Bir sonrakini planlanır planlanmaz önerebilirsiniz.',
    },
    edit: 'Öneriyi düzenle',
  },
};

const PROPERTY_INSIGHTS_MESSAGES: Translations['PROPERTY_INSIGHTS_MESSAGES'] = {
  energy: 'Enerji',
  pending: 'Beklemede',
  energyRatingClass: (r) => `Enerji sınıfı ${r}`,
  energyRatingStatus: (s) => `Enerji sınıfı: ${String(s).toLowerCase()}`,
  energyRating: 'Enerji sınıfı',
  certificateInProgress: 'Sertifika hazırlanıyor',
  consumption: 'Tüketim',
  emissions: 'Emisyonlar',
  moreEfficient: 'Daha verimli',
  lessEfficient: 'Daha az verimli',
  walkTime: (t) => `Yürüyerek ${t}`,
  scoreOutOf: (d, m) => `${m} üzerinden ${d}`,
  pricePerSquareMetre: 'Metrekare fiyatı',
  rentHistory: 'Kira geçmişi',
  rentHistoryEmpty: 'Bu ev için henüz geçmiş yok',
  confidence: { low: 'Düşük güven', medium: 'Orta güven', high: 'Yüksek güven' },
  aboveEstimate: (p) => `Tahminin ${p} üzerinde`,
  belowEstimate: (p) => `Tahminin ${p} altında`,
  fairPrice: 'Makul fiyat',
  estimatedPrice: 'Tahmini fiyat',
  asking: 'İstenen fiyat',
  noVerdict: 'Değerlendirme için yeterli veri yok',
  whyThisEstimate: 'Bu tahmin neden',
  comparables: (n) => plural('tr', n, { other: '{n} benzer eve dayanarak' }),
  currentPrice: 'Güncel fiyat',
  now: 'Şimdi',
  noPriceHistory: 'Henüz fiyat geçmişi yok',
  priceHistoryPeriod: 'Fiyat geçmişi dönemi',
  priceHistory: 'Fiyat geçmişi',
  priceHistoryTrend: (head, a, aw, b, bw) => `${head}: ${aw} döneminde ${a}, ${bw} döneminde ${b}.`,
};

const MAP_MARKER_MESSAGES: Translations['MAP_MARKER_MESSAGES'] = {
  searchAsMapMoves: 'Haritayı hareket ettirdikçe ara',
  searchThisArea: 'Bu bölgede ara',
  stays: (n) => mapMarker_countOf('tr', n, { one: '{n} konaklama', other: '{n} konaklama' }),
};

const LISTING_ACTIONS_MESSAGES: Translations['LISTING_ACTIONS_MESSAGES'] = {
  month: 'ay',
  rentalStatus: { available: 'Müsait', reserved: 'Rezerve', rented: 'Kiralandı' },
  rentalStatusMessage: {
    reserved: 'Başka bir aday sözleşmeyi tamamlıyor. Yeni görüntülemeler durduruldu.',
    rented: 'Bu ev kiralandı ve artık talep kabul etmiyor.',
  },
  saleStatus: { available: 'Satılık', reserved: 'Rezerve', sold: 'Satıldı' },
  saleStatusMessage: {
    reserved: 'Bir teklif kabul edildi. Emlakçı şimdilik ziyaret ayarlamıyor.',
    sold: 'Bu ev satıldı.',
  },
  requestViewing: 'Görüntüleme talep et',
  apply: 'Başvur',
  contactAgent: 'Emlakçıyla iletişime geç',
  requestVisit: 'Ziyaret talep et',
  makeOffer: 'Teklif ver',
  yourHome: 'Sizin eviniz',
  theirHome: 'Onların evi',
  dates: 'Tarihler',
  guests: 'Misafirler',
  addDates: 'Tarih ekle',
  addGuests: 'Misafir ekle',
  proposeSwap: 'Takas öner',
  exchangeModes: { swap: 'Karşılıklı takas', host: 'Misafir puanları', both: 'Her ikisi' },
  scheduleViewing: 'Görüntüleme planla',
  noTimesLeft: 'Bu gün için boş saat kalmadı',
  noteForLandlord: 'Ev sahibine not',
  day: 'Gün',
  time: 'Saat',
  submitViewing: 'Görüntüleme talep et',
  inPerson: 'Yüz yüze',
  videoCall: 'Görüntülü görüşme',
  viewingType: 'Görüntüleme türü',
  yourApplication: 'Başvurunuz',
  applicationProgress: 'Başvuru ilerlemesi',
  progressReady: (done, total) => `${total} belgeden ${done} tanesi hazır`,
  applicationStatus: { missing: 'Eksik', uploaded: 'İnceleniyor', verified: 'Doğrulandı', rejected: 'Reddedildi' },
  applicationAction: { upload: 'Yükle', view: 'Görüntüle', replace: 'Değiştir' },
  itemAction: (action, title) => `${title}: ${action}`,
  mortgage: {
    title: 'Konut kredisi hesaplayıcı',
    price: 'Konut fiyatı',
    downPayment: 'Peşinat',
    downPaymentPercent: 'Peşinat yüzdesi',
    percent: 'Yüzde',
    term: 'Kredi vadesi',
    years: 'yıl',
    rate: 'Faiz oranı',
    monthlyPayment: 'Aylık taksit',
    principal: 'Anapara',
    interest: 'Faiz',
    loanAmount: 'Kredi tutarı',
    totalInterest: 'Toplam faiz',
    totalCost: 'Toplam maliyet',
  },
  termYears: (n) => plural('tr', n, { one: '{n} yıl', other: '{n} yıl' }),
  mortgageDisclaimer:
    'Bu bir tahmindir, teklif değildir. Masraflar, vergiler ve sigorta dahil değildir; tüm vade boyunca sabit faiz varsayılır.',
};

const AGENT_PROGRESS_MESSAGES: Translations['AGENT_PROGRESS_MESSAGES'] = {
  stepsLeft: (n) => plural('tr', n, { other: '{n} adım kaldı' }),
  allCompleted: 'Tüm adımlar tamamlandı',
  minimize: 'Adımları küçült',
  expand: 'Adımları genişlet',
  defaultSteps: [
    'Proje dosyalarını oku',
    'Açık mod token’larını güncelle ve yükle',
    'Koyu mod token’larını uygula',
    'Yeniden kullanılabilir, kayıtlı bir tema düğmesi ekle',
    'Kayıt, lint ve üretim derlemesini çalıştır',
  ],
};

const CALENDAR_MESSAGES: Translations['CALENDAR_MESSAGES'] = {
  newEvent: 'Yeni etkinlik',
  openNavigation: 'Gezinmeyi aç',
  month: 'Ay',
  moreEvents: (n) => plural('tr', n, { other: '+{n} daha' }),
  eventDetails: 'Etkinlik ayrıntıları',
  join: 'Katıl',
  editTimeZone: 'Saat dilimini düzenle',
  participants: 'Katılımcılar',
  editParticipants: 'Katılımcıları düzenle',
  reminders: 'Hatırlatıcılar',
  editReminders: 'Hatırlatıcıları düzenle',
  duration: calendar_compactDuration(' sa', ' dk', ' '),
  jumpToDate: 'Tarihe git',
  previousMonth: 'Önceki ay',
  nextMonth: 'Sonraki ay',
  chooseDate: (month) => `${month}, tarih seçin`,
  inbox: 'Gelen kutusu',
  inboxMenu: 'Gelen kutusu menüsü',
  addAccount: 'Yeni hesap ekle',
};

const LISTING_DETAILS_MESSAGES: Translations['LISTING_DETAILS_MESSAGES'] = {
  ratedOutOf5: (r) => `5 üzerinden ${r} puan`,
  overallRating: 'Genel puan',
  unavailable: 'Mevcut değil',
  showAllAmenities: (n) => plural('tr', n, { other: '{n} olanağın tümünü göster' }),
  showAllFeatures: (n) => plural('tr', n, { other: '{n} özelliğin tümünü göster' }),
  propertyFeatures: 'Mülk özellikleri',
  showAllPhotos: 'Tüm fotoğrafları göster',
  listingPhotos: 'İlan fotoğrafları',
  photoOf: (p, t) => `Fotoğraf ${p}/${t}`,
  photoWithAlt: (a, p, t) => `${a}, fotoğraf ${p}/${t}`,
  floorPlanOf: (a, p, t) => `${a}, kat planı ${p}/${t}`,
  landlord: 'Ev sahibi',
  agent: 'Emlak danışmanı',
  agency: 'Emlak ofisi',
  activeListings: (n) => plural('tr', n, { other: '{n} aktif ilan' }),
  verified: 'Doğrulandı',
  showPhone: 'Telefonu göster',
  call: 'Ara',
  messageHost: 'Ev sahibine mesaj gönder',
  message: 'Mesaj gönder',
};

const PRICE_BREAKDOWN_MESSAGES: Translations['PRICE_BREAKDOWN_MESSAGES'] = {
  states: { estimated: 'Tahmini', pending: 'Beklemede' },
  showDetails: 'Fiyat ayrıntılarını göster',
  hideDetails: 'Fiyat ayrıntılarını gizle',
  breakdown: 'Fiyat dökümü',
  about: (label) => `${label} hakkında`,
};

const DATE_PICKER_MESSAGES: Translations['DATE_PICKER_MESSAGES'] = {
  cancel: 'İptal',
  apply: 'Uygula',
  previousMonth: 'Önceki ay',
  nextMonth: 'Sonraki ay',
  datePlaceholder: 'Tarih seçin',
  dateLabel: 'Tarih',
  rangePlaceholder: 'Tarih aralığı seçin',
  rangeLabel: 'Tarih aralığı',
  startDate: 'Başlangıç tarihi',
  endDate: 'Bitiş tarihi',
  daysSelected: (n) => plural('tr', n, { other: '{n} gün seçildi' }),
  presets: {
    today: 'Bugün',
    yesterday: 'Dün',
    lastWeek: 'Geçen hafta',
    thisMonth: 'Bu ay',
    lastMonth: 'Geçen ay',
    thisYear: 'Bu yıl',
    lastYear: 'Geçen yıl',
    allTime: 'Tüm zamanlar',
  },
  meetingTrigger: 'Toplantı planla',
  meetingLabel: 'Toplantı planla',
  send: 'Davet gönder',
  selectTime: 'Saat seçin',
  duration: (n) => plural('tr', n, { other: '{n} dakika' }),
};

const SHIPMENT_REQUEST_MESSAGES: Translations['SHIPMENT_REQUEST_MESSAGES'] = {
  kinds: {
    envelope: { label: 'Zarf', description: 'Evrak, anahtar, düz olan her şey.' },
    parcel: { label: 'Koli', description: 'Tek kişinin taşıyabileceği bir kutu ya da çanta.' },
    furniture: { label: 'Mobilya', description: 'Kanepe, masa, yatak — iki uçta da iki kişi.' },
    pallet: { label: 'Palet', description: 'Sarılmış ve istiflenmiş, hidrolik kapakla taşınır.' },
    food: { label: 'Yemek', description: 'Restoran siparişi, doğru sıcaklıkta.' },
  },
  sizes: {
    small: 'Ayakkabı kutusuna kadar — 35 × 25 × 20 cm.',
    medium: 'Kabin bavuluna kadar — 55 × 40 × 25 cm.',
    large: 'Çamaşır makinesine kadar — 85 × 60 × 60 cm.',
    extraLarge: 'Daha büyük — notlarda anlatın.',
  },
  access: { ground: 'Zemin kat', stairs: 'Merdiven', lift: 'Asansör' },
  load: {
    kind: 'Ne taşıyoruz?',
    size: 'Boyut',
    weight: 'Ağırlık',
    quantity: 'Adet',
    quantityValue: (n) => `${n} parça`,
    notes: 'Taşıyıcının bilmesi gereken başka bir şey var mı?',
    notesPlaceholder: 'Kırılabilir, asansör kodu, nereye bırakılacağı…',
  },
  options: { extras: 'Ekstralar', access: 'İki adreste de erişim', window: 'Ne zaman alınmalı?' },
  form: {
    route: 'Güzergâh',
    routeDescription: 'Önce alım, en son teslim.',
    load: 'Yük',
    photos: 'Fotoğraflar',
    photosDescription: 'Yükün bir fotoğrafı, alacağınız teklifleri en çok iyileştiren şeydir.',
    options: 'Seçenekler',
    optionsDescription: 'Her biri fiyatı değiştirir.',
    price: 'Fiyat',
  },
  shipmentRequest: 'Taşıma talebi',
};

const LABEL_MESSAGES: Translations['LABEL_MESSAGES'] = { required: 'zorunlu' };

const CHECKOUT_SUMMARY_MESSAGES: Translations['CHECKOUT_SUMMARY_MESSAGES'] = {
  title: 'Siparişini gözden geçir',
  orderSummary: 'Sipariş özeti',
  deliverTo: 'Teslimat adresi',
  notChosen: 'Henüz seçilmedi',
  opensPicker: 'Seçiciyi açar',
  placeOrder: 'Siparişi ver',
  placingOrder: 'Siparişin veriliyor',
};

const VEHICLE_PICKER_MESSAGES: Translations['VEHICLE_PICKER_MESSAGES'] = {
  from: 'Başlangıç',
  fits: (label) => `${label} içine neler sığar`,
  unavailable: 'Bu yük için uygun değil',
  vehicle: 'Araç',
  vehicles: {
    bike: { label: 'Kargo bisikleti', capacity: '25 kg’a kadar · 60 × 40 × 40 cm', fits: ['Evrak', 'Yemek siparişi', 'Küçük bir kutu'] },
    car: { label: 'Otomobil', capacity: '150 kg’a kadar · 100 × 80 × 60 cm', fits: ['İki bavul', 'Dört koli', 'Bir bisiklet'] },
    van: { label: 'Panelvan', capacity: '800 kg’a kadar · 240 × 150 × 140 cm', fits: ['Bir kanepe', 'Stüdyo daire taşıma', 'Yarım palet'] },
    boxTruck: { label: 'Kapalı kasa kamyon', capacity: '3.500 kg’a kadar · 420 × 200 × 210 cm', fits: ['İki palet', '2+1 ev taşıma', 'Hidrolik kapak'] },
    refrigerated: { label: 'Frigorifik panelvan', capacity: '700 kg’a kadar · 2–8 °C arası', fits: ['Taze ürünler', 'Soğuk ikram', 'Çiçekler'] },
  },
};

const COMPOSER_PANEL_MESSAGES: Translations['COMPOSER_PANEL_MESSAGES'] = {
  message: 'Mesaj',
  add: 'Ek ekle',
  addMenu: 'Sohbete ekle',
  permissions: 'İzinler',
  permissionMode: 'İzin modu',
  learnMore: 'Daha fazla bilgi',
  voice: 'Sesli giriş',
  send: 'Mesajı gönder',
  stop: 'Oluşturmayı durdur',
  permissionTrigger: (mode) => `İzin: ${mode}`,
  removeFile: (name) => `${name}: Kaldır`,
  retryFile: (name) => `${name}: Yeniden dene`,
  panelPlaceholder: 'Merhaba, bugün neye ihtiyacın var?',
  pillPlaceholder: 'Bana istediğini sor',
  pillCompactPlaceholder: 'Bana sor',
  modelSettings: 'Model ayarları',
  models: 'Modeller',
  modelGroup: 'Model',
  effort: 'Efor',
  effortAuto: 'Otomatik',
  faster: 'Daha hızlı',
  smarter: 'Daha akıllı',
  quickSearch: 'Hızlı Arama',
  searchModels: 'Model ara',
  closeSearch: 'Aramayı kapat',
  noMatches: 'Eşleşen model yok',
  providers: 'Sağlayıcılar',
  matchingModels: 'Eşleşen modeller',
  providerModels: (provider) => `${provider} modelleri`,
  localFolders: 'Yerel Klasörler',
  context: (percent) => `Bağlam %${percent}`,
  effortLevels: ['Düşük', 'Orta', 'Dengeli', 'Yüksek', 'Çok yüksek', 'Maksimum'],
  permissionModes: {
    auto: { label: 'Otomatik', description: 'Ajan kendisi karar verir' },
    manual: { label: 'Manuel', description: 'Değişiklik yapmadan önce her zaman sor' },
    plan: { label: 'Plan modu', description: 'Devam etmeden önce bir plan oluştur' },
    bypass: { label: 'Tümünü atla', description: 'İzin kararlarını ajan verir' },
  },
  addMenuRows: {
    add: 'Ekle',
    plugins: 'Eklentiler',
    files: 'Dosyalar ve klasörler',
    goal: 'Hedef',
    goalDescription: 'Daha hızlı sonuç için bir hedef belirle',
    plan: 'Plan modu',
    planDescription: 'Karmaşık görevleri yönet',
    documents: 'Belgeler',
    documentsDescription: 'Belge oluştur ve düzenle',
    spreadsheets: 'Elektronik tablolar',
    spreadsheetsDescription: 'Elektronik tablo oluştur',
    presentations: 'Sunumlar',
    presentationsDescription: 'Pazarlama materyali oluştur',
    code: 'Kod blokları',
    codeDescription: 'Mevcut kodu yaz ve düzenle',
  },
};

const MESSAGE_BUBBLE_MESSAGES: Translations['MESSAGE_BUBBLE_MESSAGES'] = {
  forwardedFrom: (name) => `${name} kaynağından iletildi`,
  deleted: 'Bu mesaj silindi',
  retry: 'Yeniden göndermeyi dene',
  addReaction: 'Tepki ekle',
  replyTo: 'Alıntılanan mesaja git',
  selected: 'Seçildi',
  pending: 'Gönderiliyor',
  failed: 'Gönderilemedi',
  reactionSelected: 'seçildi',
  unread: 'Okunmamış mesajlar',
  typing: 'Yazıyor…',
};

const PAYMENT_STATUS_MESSAGES: Translations['PAYMENT_STATUS_MESSAGES'] = {
  states: { authorising: 'Onaylanıyor', paid: 'Ödendi', failed: 'Ödeme başarısız', refunded: 'İade edildi', pending: 'Ödeme bekleniyor' },
  reference: 'Referans',
};

const AVATAR_MESSAGES: Translations['AVATAR_MESSAGES'] = { live: 'CANLI' };

const PLACE_CARD_MESSAGES: Translations['PLACE_CARD_MESSAGES'] = {
  openStates: {
    open: 'Açık',
    'closing-soon': 'Yakında kapanıyor',
    closed: 'Kapalı',
    'opening-soon': 'Yakında açılıyor',
  },
  new: 'Yeni',
  actions: 'İşlemler',
  actionsFor: (name) => `${name} işlemleri`,
  rated: (value, reviews) =>
    placeCard_withReviews(
      `5 üzerinden ${value} puan`,
      reviews === undefined ? undefined : placeCard_countOf('tr', reviews, { other: '{n} değerlendirme' }),
    ),
};

const SOCIAL_BUTTON_MESSAGES: Translations['SOCIAL_BUTTON_MESSAGES'] = { actions: { continue: (b) => `${b} ile devam et`, signIn: (b) => `${b} ile giriş yap`, signUp: (b) => `${b} ile kaydol` } };

const QUESTIONNAIRE_MESSAGES: Translations['QUESTIONNAIRE_MESSAGES'] = { other: 'Diğer', otherPlaceholder: 'Kendi yanıtınızı buraya yazın', steps: 'Adımlar', step: (n) => `Adım ${n}` };

const MAP_CONTROLS_MESSAGES: Translations['MAP_CONTROLS_MESSAGES'] = {
  group: 'Harita kontrolleri',
  locate: 'Konumumu göster',
  following: 'Konumumu takip etmeyi durdur',
  zoomIn: 'Yakınlaştır',
  zoomOut: 'Uzaklaştır',
  zoom: 'Yakınlaştırma',
  tilt: 'Haritayı eğ',
  tiltOff: 'Haritayı düzleştir',
  compass: (degrees) => `Yön ${degrees} derece. Kuzeye sıfırla`,
  layerTrigger: 'Harita katmanları',
  layers: 'Harita',
  overlays: 'Katmanlar',
};

const PAYMENT_METHOD_MESSAGES: Translations['PAYMENT_METHOD_MESSAGES'] = { states: { expired: 'Süresi doldu', declined: 'Reddedildi' }, default: 'Varsayılan', add: 'Ödeme yöntemi ekle', emptyTitle: 'Kayıtlı ödeme yöntemi yok', paymentMethods: 'Ödeme yöntemleri' };

const AVATAR_GROUP_MESSAGES: Translations['AVATAR_GROUP_MESSAGES'] = { more: (n) => `${n} kişi daha`, profile: 'Profil' };

const MENUBAR_MESSAGES: Translations['MENUBAR_MESSAGES'] = {
  menuBar: 'Menü çubuğu',
};

const AGENT_THINKING_MESSAGES: Translations['AGENT_THINKING_MESSAGES'] = { thinking: 'Düşünüyor' };

const AI_CHAT_MESSAGES: Translations['AI_CHAT_MESSAGES'] = {
  feedback: { like: 'İyi yanıt', dislike: 'Kötü yanıt', copy: 'Yanıtı kopyala', copied: 'Kopyalandı!' },
  imageGeneration: {
    generated: 'Görsel oluşturuldu',
    generating: 'Görsel oluşturuluyor',
    remaining: (n) => plural('tr', n, { other: '{n} saniye kaldı' }),
    likeToast: 'Geri bildiriminiz için teşekkürler',
    dislikeToast: 'Teşekkürler, bunu gelişmek için kullanacağız',
  },
  generatedImage: (alt) => `Oluşturulan görsel: ${alt}`,
  codePanel: {
    changes: 'Değişiklikler',
    browser: 'Tarayıcı',
    uncommitted: (n) => plural('tr', n, { other: 'Commit edilmemiş {n} değişiklik' }),
    undo: 'Değişiklikleri geri al',
    browserPreview: 'Tarayıcı önizlemesi',
  },
  galleryPanel: {
    gallery: 'Galeri',
    styles: 'Stiller',
    stylePresets: 'Hazır stiller',
    enlarge: (prompt) => `Büyüt: ${prompt}`,
    minimize: (prompt) => `Küçült: ${prompt}`,
    download: (prompt) => `İndir: ${prompt}`,
  },
  panelView: 'Panel görünümü',
  openTerminal: 'Terminali aç',
  newGeneration: 'Yeni oluşturma',
  expandPanel: 'Paneli genişlet',
  togglePanel: 'Paneli göster/gizle',
  container: { breadcrumb: 'Sohbet konumu', share: 'Sohbeti paylaş' },
  shell: {
    openNavigation: 'Gezinmeyi aç',
    closeNavigation: 'Gezinmeyi kapat',
    openPanel: (panel) => `${panel} panelini aç`,
    closePanel: (panel) => `${panel} panelini kapat`,
  },
  code: 'Kod',
};

const COMMAND_MESSAGES: Translations['COMMAND_MESSAGES'] = {
  placeholder: 'Bir komut yazın veya arayın…',
  empty: 'Sonuç bulunamadı.',
  palette: 'Komut paleti',
  clearSearch: 'Aramayı temizle',
};

const MUSIC_LIBRARY_MESSAGES: Translations['MUSIC_LIBRARY_MESSAGES'] = {
  kinds: {
    playlist: 'Çalma listesi',
    artist: 'Sanatçı',
    album: 'Albüm',
    podcast: 'Podcast',
    audiobook: 'Sesli kitap',
    folder: 'Klasör',
  },
  library: {
    title: 'Kitaplığın',
    create: 'Çalma listesi veya klasör oluştur',
    collapseRail: 'Kitaplığını daralt',
    expandRail: 'Kitaplığını aç',
    filters: 'Filtreler',
    clearFilters: 'Filtreleri temizle',
    filter: {
      playlists: 'Çalma listeleri',
      artists: 'Sanatçılar',
      albums: 'Albümler',
      podcasts: 'Podcast’ler',
      audiobooks: 'Sesli kitaplar',
    },
    downloaded: 'İndirilenler',
    search: 'Kitaplığında ara',
    searchPlaceholder: 'Kitaplığında ara',
    clearSearch: 'Aramayı temizle',
    sortAndView: 'Sırala ve görüntüle',
    sortBy: 'Sıralama ölçütü',
    viewAs: 'Görünüm',
    sort: {
      recents: 'En son çalınanlar',
      'recently-added': 'Son eklenenler',
      alphabetical: 'Alfabetik',
      creator: 'Oluşturan',
    },
    view: { compact: 'Sıkışık', list: 'Liste', grid: 'Izgara' },
    empty: 'Burada henüz bir şey yok',
  },
  item: { pinned: 'Sabitlendi', downloaded: 'İndirildi', nowPlaying: 'Şimdi çalıyor' },
  search: { placeholder: 'Ne dinlemek istersin?', clear: 'Aramayı temizle', browse: 'Göz at' },
  resultTypes: 'Sonuç türleri',
  topResultKinds: {
    song: 'Şarkı',
    artist: 'Sanatçı',
    album: 'Albüm',
    playlist: 'Çalma listesi',
    podcast: 'Podcast',
    episode: 'Bölüm',
    audiobook: 'Sesli kitap',
    profile: 'Profil',
  },
  recent: {
    title: 'Son aramalar',
    clearAll: 'Son aramaları temizle',
    remove: (title) => `Kaldır: ${title}`,
  },
};

const LISTING_CARD_MESSAGES: Translations['LISTING_CARD_MESSAGES'] = {
  statuses: { reserved: 'Rezerve edildi', sold: 'Satıldı', rented: 'Kiralandı', unavailable: 'Mevcut değil' },
  originally: (p) => `önceki fiyat ${p}`,
  approximateLocation: 'Yaklaşık konum',
  rated: (r) => `5 üzerinden ${r} puan`,
  ratedWithReviews: (r, c) =>
    plural('tr', c, { other: `5 üzerinden ${r} puan, ${c} değerlendirme` }),
  newListing: 'Yeni',
  previousPhoto: 'Önceki fotoğraf',
  nextPhoto: 'Sonraki fotoğraf',
  saveToWishlist: 'İstek listesine kaydet',
  removeFromWishlist: 'İstek listesinden kaldır',
};

const NAVIGATION_BANNER_MESSAGES: Translations['NAVIGATION_BANNER_MESSAGES'] = {
  states: { 'off-route': 'Rota dışı', rerouting: 'Yeni rota bulunuyor' },
  thenLine: (street, maneuver) => navigationBanner_words('ardından', navigationBanner_midSentence(maneuver, 'tr'), street),
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
};

const LOCATION_PUCK_MESSAGES: Translations['LOCATION_PUCK_MESSAGES'] = {
  states: { locating: 'Konumunuz bulunuyor', located: 'Konumunuz', stale: 'Bilinen son konumunuz' },
  facing: (state, degrees) => `${state}, yön ${degrees} derece`,
};

const CAROUSEL_MESSAGES: Translations['CAROUSEL_MESSAGES'] = {
  previousSlide: 'Önceki slayt',
  nextSlide: 'Sonraki slayt',
  goToSlide: (n) => `${n}. slayta git`,
  slideOf: (at, of) => `${at}/${of}`,
  carouselRole: 'karusel',
  slideRole: 'slayt',
};

const ORDER_STATUS_MESSAGES: Translations['ORDER_STATUS_MESSAGES'] = { states: { current: 'Devam ediyor', upcoming: 'Henüz değil', failed: 'Başarısız' }, status: 'Durum' };

const RATING_MESSAGES: Translations['RATING_MESSAGES'] = {
  newRating: 'Yeni',
  reviews: (c) => rating_countForms('tr', c, { other: '{n} değerlendirme' }),
  rated: (v) => `5 üzerinden ${v} puan`,
  ratedWithReviews: (v, r) => `5 üzerinden ${v} puan, ${r}`,
  star: (n) => plural('tr', n, { other: '{n} yıldız' }),
};

const LISTING_EDITOR_MESSAGES: Translations['LISTING_EDITOR_MESSAGES'] = {
  offering: {
    rent: { title: 'Kiralık', description: 'Uzun dönem kiralama, aylık fiyat.' },
    sale: { title: 'Satılık', description: 'Evi tamamen satın.' },
    stay: { title: 'Tatil kiralaması', description: 'Kısa konaklamalar, gecelik fiyat.' },
    swap: { title: 'Ev takası', description: 'Diğer üyelerle ev takası yapın.' },
    monthlyRent: 'Aylık kira',
    deposit: 'Depozito',
    depositOption: (months) => (months === 0 ? 'Yok' : plural('tr', months, { one: '{n} ay', other: '{n} ay' })),
    availableFrom: 'Müsait olduğu tarih',
    minimumStay: 'Asgari kiralama süresi',
    months: (months) => plural('tr', months, { one: '{n} ay', other: '{n} ay' }),
    askingPrice: 'İstenen fiyat',
    pricePerArea: 'm² fiyatı',
    pricePerAreaEmpty: 'Fiyat ekleyin',
    nightlyRate: 'Gecelik fiyat',
    cleaningFee: 'Temizlik ücreti',
    minimumNights: 'Asgari gece sayısı',
    nights: (nights) => plural('tr', nights, { one: '{n} gece', other: '{n} gece' }),
    swapMode: 'Nasıl takas yapmak istersiniz?',
    swapModes: { swap: 'Ev takası', host: 'Yalnızca ev sahipliği', both: 'Fark etmez' },
    group: 'Ev nasıl sunuluyor?',
  },
  propertyTypes: {
    apartment: 'Daire',
    house: 'Müstakil ev',
    room: 'Oda',
    studio: 'Stüdyo daire',
    duplex: 'Dubleks',
    penthouse: 'Çatı katı',
    coliving: 'Ortak yaşam',
    hostel: 'Hostel',
    other: 'Diğer',
  },
  propertyType: 'Mülk türü',
  addressPrecision: {
    exact: {
      title: 'Tam adres',
      description: 'İşaret binanın üzerinde durur. Zaten kolay bulunan evler için en iyisi.',
    },
    street: {
      title: 'Yalnızca sokak',
      description: 'Numarayı değil sokağı gösterir. Tam adres rezervasyon ya da imzadan sonra paylaşılır.',
    },
    approximate: {
      title: 'Yaklaşık bölge',
      description: 'Yaklaşık 500 m’lik bir daire gösterir. En gizli seçenek.',
    },
  },
  addressPrecisionLabel: 'Adres hassasiyeti',
  addressPrecisionFootnote:
    'Yayımlanan harita bu seçimi izler. Tam adresiniz yalnızca onayladığınız kişilerle paylaşılır.',
  qualityTitle: 'İlan kalitesi',
  qualityScore: 'İlan kalite puanı',
  tips: 'İpuçları',
  todo: 'Yapılacak',
  needsWork: 'Geliştirilmeli',
  good: 'İyi',
  excellent: 'Mükemmel',
  previewTitle: 'Önizleme',
  previewDescription: 'Misafirler ilanınızı böyle görecek.',
  card: 'Kart',
  page: 'Sayfa',
  previewAs: 'Önizleme türü',
  reviews: (n, shown) => plural('tr', n, { one: '{s} değerlendirme', other: '{s} değerlendirme' }).replace('{s}', shown),
};

const MEDIA_HEADER_MESSAGES: Translations['MEDIA_HEADER_MESSAGES'] = {
  artistPick: 'Sanatçının seçimi',
  saveEpisode: 'Bölümü kaydet',
  share: 'Paylaş',
  podcastEpisode: 'Podcast bölümü',
  listeningProgress: 'Dinleme ilerlemesi',
  shuffle: 'Karıştır',
  download: 'İndir',
  downloadProgress: 'İndirme ilerlemesi',
  follow: 'Takip et',
  following: 'Takip ediliyor',
  searchInPlaylist: 'Çalma listesinde ara',
  compactView: 'Kompakt görünüm',
  editDetails: 'Ayrıntıları düzenle',
  about: 'Hakkında',
  discography: 'Diskografi',
  showAll: 'Tümünü göster',
  albums: 'Albümler',
  singlesAndEps: "Single'lar ve EP'ler",
  compilations: 'Derlemeler',
  audiobook: 'Sesli kitap',
  popular: 'Popüler',
  seeMore: 'Daha fazla gör',
  podcast: 'Podcast',
  latestEpisode: 'En son bölüm',
  verifiedArtist: 'Onaylı sanatçı',
  profile: 'Profil',
  editProfile: 'Profili düzenle',
};

const MENU_ITEM_MESSAGES: Translations['MENU_ITEM_MESSAGES'] = {
  diets: { vegetarian: 'Vejetaryen', vegan: 'Vegan', 'gluten-free': 'Glutensiz', 'dairy-free': 'Laktozsuz', halal: 'Helal', kosher: 'Koşer' },
  spicy: 'Acılık',
  spiceOf: (label, level, max) => `${label} ${max} üzerinden ${level}`,
  originally: (price, original) => `${price}, önceki fiyat ${original}`,
  inBasket: (n) => `Sepette ${n} adet`,
  soldOut: 'Tükendi',
  addItem: (name) => `${name} ekle`,
  choose: (n) => `${n} seçin`,
  chooseRange: (min, max) => `${min}–${max} arası seçin`,
  upTo: (n) => `En fazla ${n}`,
  optional: 'İsteğe bağlı',
  quantity: 'Adet',
  addToBasket: 'Sepete ekle',
  options: 'Seçenekler',
};

const PAGINATION_MESSAGES: Translations['PAGINATION_MESSAGES'] = {
  pagination: 'Sayfalandırma',
  goToPage: (page) => `${page}. sayfaya git`,
};

const LEAD_SCORE_MESSAGES: Translations['LEAD_SCORE_MESSAGES'] = { title: 'Potansiyel müşteri puanı', factors: 'Nelerden oluşuyor', bands: { cold: 'Soğuk', warm: 'Ilık', hot: 'Sıcak' } };

const DIRECTIONS_MESSAGES: Translations['DIRECTIONS_MESSAGES'] = {
  modes: { drive: 'Araba', transit: 'Toplu taşıma', walk: 'Yürüyüş', cycle: 'Bisiklet' },
  traffic: { light: 'Trafik akıcı', moderate: 'Orta yoğunlukta trafik', heavy: 'Yoğun trafik' },
  maneuvers: {
    depart: 'Başlangıç',
    straight: 'Düz devam edin',
    'slight-left': 'Hafif sola dönün',
    left: 'Sola dönün',
    'sharp-left': 'Keskin sola dönün',
    'slight-right': 'Hafif sağa dönün',
    right: 'Sağa dönün',
    'sharp-right': 'Keskin sağa dönün',
    uturn: 'U dönüşü yapın',
    roundabout: 'Dönel kavşakta',
    merge: 'Şeride katılın',
    arrive: 'Varış',
    board: 'Binin',
    alight: 'İnin',
    transfer: 'Aktarma yapın',
    walk: 'Yürüyün',
  },
  directions: 'Yol tarifi',
  otherRoutes: 'Diğer rotalar',
  travelMode: 'Ulaşım şekli',
  start: 'Başlat',
  currentStep: 'Geçerli adım',
  line: (name) => `${name} hattı`,
};

const CART_PANEL_MESSAGES: Translations['CART_PANEL_MESSAGES'] = {
  basket: 'Sepet',
  checkout: 'Ödemeye geç',
  emptyTitle: 'Sepetin boş',
  emptyDescription: 'Menüden bir şey ekle, burada görünecek.',
  soldOut: 'Tükendi',
  removeItem: (name) => `${name} ürününü kaldır`,
  originally: (price, original) => `${price}, önceki fiyat ${original}`,
  promoCode: 'Promosyon kodu',
  apply: 'Uygula',
  tip: 'Bahşiş',
};

const MEDIA_CARD_MESSAGES: Translations['MEDIA_CARD_MESSAGES'] = {
  albumTypes: { album: 'Albüm', single: 'Single', ep: 'EP', compilation: 'Derleme' },
  artist: 'Sanatçı',
  verified: 'Onaylı',
  audiobook: 'Sesli kitap',
  narratedBy: (n) => `Seslendiren: ${n}`,
  progressOf: (t) => `${t} ilerlemesi`,
  episode: 'Bölüm',
  played: 'Dinlendi',
  event: 'Etkinlik',
  soldOut: 'Tükendi',
  listeningNow: 'Şu an dinliyor',
  trackBy: (t, a) => `${a} - ${t}`,
  mix: 'Mix',
  playlist: 'Çalma listesi',
  collaborative: 'Ortak',
  ownedBy: (o) => `${o} tarafından`,
  podcast: 'Podcast',
  profile: 'Profil',
  followsYou: 'Seni takip ediyor',
  song: 'Şarkı',
  share: 'Paylaş',
  listened: 'Dinlendi',
};

const JOB_BOARD_MESSAGES: Translations['JOB_BOARD_MESSAGES'] = {
  labels: {
    take: 'İşi al',
    pass: 'Geç',
    distance: 'Mesafe',
    duration: 'Süre',
    window: 'Zaman aralığı',
    pickup: 'Alım',
    dropoff: 'Teslimat',
    state: { taken: 'Alındı', expired: 'Süresi doldu' },
    showPay: 'Ödemeyi göster',
    hidePay: 'Ödemeyi gizle',
    payDetails: 'Ödeme:',
    sort: 'İşleri sırala',
    filtersToggle: 'Filtreler',
    filtersActive: (n) => `${n} uygulandı`,
    sortOptions: {
      pay: 'En iyi ödeyen',
      distance: 'En yakın',
      soonest: 'En erken başlayan',
      expiring: 'En erken kapanan',
    },
    filters: { distance: 'Mesafe', pay: 'Ödeme', when: 'Ne zaman', vehicle: 'Araç' },
    clearFilters: 'Filtreleri temizle',
    refresh: 'Listeyi yenile',
    count: (n) => plural('tr', n, { other: '{n} iş' }),
    loading: 'İşler yükleniyor',
  },
  emptyTitle: 'Şu anda iş yok',
  emptyDescription: 'Aradığınıza uyan bir şey yok. Bir filtreyi genişletin ya da bir dakika sonra yeniden yenileyin.',
  list: 'İşler',
  payDetailsFor: (load) => `${load} için ödeme`,
  route: (pickup, dropoff) => `${pickup} ve ${dropoff}`,
  bands: {
    anyDistance: 'Her mesafe',
    underKm: (km) => `${km} km'den az`,
    anyTime: 'Her zaman',
    withinHour: 'Bir saat içinde',
    nextHours: (hours) => `Sonraki ${hours} saat`,
    today: 'Bugün',
  },
};

const FLOATING_MESSAGES: Translations['FLOATING_MESSAGES'] = {
  submenu: 'Alt menü',
};

const AGENT_CHAT_MESSAGES: Translations['AGENT_CHAT_MESSAGES'] = {
  chat: {
    newChat: 'Yeni sohbet',
    emptyTitle: 'Nasıl yardımcı olabilirim?',
    emptyDescription: 'Bu sohbet kendi API anahtarınızla çalışır. Geçmiş bu tarayıcıda kalır.',
    thinking: 'Düşünüyor',
    error: 'Bir sorun oluştu. Sunucu günlüklerini kontrol edip tekrar deneyin.',
    suggestions: [
      'Bu başlangıç projesinin ne yaptığını açıkla',
      'Üç cümlelik bir ürün güncellemesi yaz',
      'Bir randevu uygulaması için beş isim öner',
    ],
    you: 'Sen',
    assistant: 'Asistan',
  },
  actions: {
    share: 'Sohbeti paylaş',
    shared: 'Döküm kopyalandı',
    more: 'Bu sohbet için diğer işlemler',
    exportChats: 'Sohbetleri dışa aktar',
    markUnread: 'Okunmadı olarak işaretle',
    deleteChat: 'Sohbeti sil',
  },
  message: { copy: 'Mesajı kopyala', readAloud: 'Sesli oku', stopReading: 'Sesli okumayı durdur' },
  history: {
    region: 'Sohbet geçmişi',
    recent: 'Son sohbetler',
    empty: 'Başlattığınız sohbetler burada görünür.',
    rename: 'Yeniden adlandır',
    renameField: 'Sohbeti yeniden adlandır',
    markUnread: 'Okunmadı olarak işaretle',
    unread: 'Okunmadı',
    exportCount: (n) => (n === 0 ? 'Dışa aktarılacak sohbet yok' : plural('tr', n, { other: '{n} sohbeti dışa aktar' })),
    accountMenu: (name) => `${name} hesap menüsü`,
    usageLeft: 'Kalan kullanım',
    upgrade: 'Max’e yükselt',
    logOut: 'Oturumu kapat',
  },
  composer: {
    field: 'Mesaj',
    placeholder: 'Bana her şeyi sorabilirsin',
    attach: 'Ek ekle',
    send: 'Mesaj gönder',
    stop: 'Üretmeyi durdur',
    notConfigured: 'Yapılandırılmadı',
    messageCount: (n) => plural('tr', n, { other: '{n} mesaj' }),
    answeringWith: (model) => `${model} ile yanıtlanıyor`,
  },
  ago: {
    justNow: 'az önce',
    minutes: (n) => plural('tr', n, { other: '{n} dakika önce' }),
    hours: (n) => plural('tr', n, { other: '{n} saat önce' }),
    days: (n) => plural('tr', n, { other: '{n} gün önce' }),
  },
  age: { now: 'şimdi', minutes: (n) => `${n} dk`, hours: (n) => `${n} sa`, days: (n) => `${n} g` },
};

const WEB_SEARCH_MESSAGES: Translations['WEB_SEARCH_MESSAGES'] = { sources: 'Kaynaklar', working: 'Çalışıyor' };

const MAIL_THREAD_MESSAGES: Translations['MAIL_THREAD_MESSAGES'] = {
  to: 'Kime',
  cc: 'Bilgi',
  bcc: 'Gizli',
  reply: 'Yanıtla',
  replyAll: 'Tümünü yanıtla',
  forward: 'İlet',
  more: COMMON_MESSAGES.more,
  moreAddresses: (n) => `${n} kişi daha`,
  earlierMessages: (n) => plural('tr', n, { other: '{n} önceki ileti' }),
  showTrimmed: 'Kırpılan içeriği göster',
  hideTrimmed: 'Kırpılan içeriği gizle',
  unread: 'Okunmadı',
  starred: 'Yıldızlı',
  star: 'Yıldız ekle',
  attachments: 'Ekler',
  attachmentCount: (n) => plural('tr', n, { other: '{n} ek' }),
  expand: 'İletiyi genişlet',
  collapse: 'İletiyi daralt',
};

const NOTIFICATION_CENTER_MESSAGES: Translations['NOTIFICATION_CENTER_MESSAGES'] = {
  title: 'Bildirimler',
  emptyMessage: 'Her şeyi gördünüz.',
  emptyDescription: 'Yeni etkinlikler geldiğinde burada görünecek.',
  noUnread: 'Okunmamış bildirim yok',
  unread: (n) => plural('tr', n, { other: '{n} okunmamış' }),
  markAllRead: 'Tümünü okundu olarak işaretle',
  category: 'Bildirim kategorisi',
  tabs: { all: 'Tümü', mentions: 'Bahsetmeler', system: 'Sistem' },
  unreadDot: 'Okunmadı',
};

const CHART_CARDS_MESSAGES: Translations['CHART_CARDS_MESSAGES'] = {
  titles: {
    activity: 'Etkinlik',
    agents: 'Ajanlar',
    visitors: 'Ziyaretçiler',
    breakdown: 'Döküm',
    sessions: 'Oturumlar',
    contributionsThisYear: 'Bu yılki katkılar',
    earnedSoFar: 'Şimdiye kadar kazanılan',
    signUpFunnel: 'Kayıt hunisi',
    activeUsers: 'Etkin kullanıcılar',
    revenue: 'Gelir',
    mostActiveDays: 'En etkin günler',
    orders: 'Siparişler',
    trackedTime: 'Kaydedilen süre',
    revenuePerAccount: 'Hesap başına gelir',
    sleepScore: 'Uyku puanı',
    pipeline: 'Satış hunisi',
    steps: 'Adımlar',
    tokens: 'Jetonlar',
  },
  weekly: 'Haftalık',
  monthly: 'Aylık',
  yearly: 'Yıllık',
  stepsSuffix: 'adım',
  today: 'Bugün',
  thisYear: 'Bu yıl',
  lastYear: 'Geçen yıl',
  sinceLastYear: 'geçen yıla göre',
  aYearEarlier: 'bir yıl önce',
  earningsPeriod: 'Kazanç dönemi',
  changePeriod: 'Dönemi değiştir',
  period: 'Dönem',
  total: 'toplam',
  average: 'ortalama',
  thisMonth: 'bu ay',
  ofGoal: 'hedefin',
  totalSteps: 'toplam adım',
  gaugeChart: (title, reading) => `${title} göstergesi: ${reading}`,
  halfGaugeChart: (title, items) => `${title} yarım göstergesi: ${items}`,
  radialChart: (title, items) => `${title} dairesel grafiği: ${items}`,
  percentOfGoal: (pct) => `hedefin %${pct} kadarı`,
  periodOf: (label) => `${label} dönemi`,
  chartVs: (title, current, previous) => `${title} grafiği: ${current.toLowerCase()} ile ${previous.toLowerCase()} karşılaştırması`,
  lineChart: (title) => `${title} çizgi grafiği`,
  barChart: (title, items) => `${title} çubuk grafiği: ${items}`,
  comboChart: (title, bar, line) => `${title} grafiği: ${bar} çubukları ile ${line} çizgisi`,
  scatterChart: (title, series) => `${title} dağılım grafiği: ${series}`,
  bubbleChart: (title, series) => `${title} kabarcık grafiği: ${series}`,
  ringItem: (label, value, pct) => `${label} ${value}, hedefin %${pct} kadarı`,
  scoreOf: (score, max) => `${score}/${max}`,
  activityFor: (name, day) => `${day} ${name} etkinliği`,
  contributions: (n, date) => { const on = date ? `${date} tarihinde ` : ''; return n === 0 ? `${on}katkı yok` : plural('tr', n, { other: `${on}{n} katkı` }); },
};

const CODE_MESSAGES: Translations['CODE_MESSAGES'] = { copy: 'Kodu kopyala', copied: 'Kod kopyalandı' };

const OUTLINE_NAV_MESSAGES: Translations['OUTLINE_NAV_MESSAGES'] = { outline: 'Bu sayfada', progress: (at, of) => `Başlık ${at}/${of}` };

const STEPPER_MESSAGES: Translations['STEPPER_MESSAGES'] = { decrease: 'Azalt', increase: 'Artır' };

const CALL_UI_MESSAGES: Translations['CALL_UI_MESSAGES'] = {
  status: {
    calling: 'Aranıyor…',
    ringing: 'Çalıyor',
    connecting: 'Bağlanıyor…',
    active: 'Bağlandı',
    reconnecting: 'Yeniden bağlanıyor…',
    onHold: 'Beklemede',
    ended: 'Arama sona erdi',
  },
  controls: {
    mute: 'Sesi kapat',
    unmute: 'Sesi aç',
    speakerOn: 'Hoparlörü aç',
    speakerOff: 'Hoparlörü kapat',
    videoOn: 'Kamerayı aç',
    videoOff: 'Kamerayı kapat',
    flipCamera: 'Kamerayı çevir',
    screenShareOn: 'Ekranı paylaş',
    screenShareOff: 'Ekran paylaşımını durdur',
    addParticipant: 'Katılımcı ekle',
    endCall: 'Aramayı bitir',
  },
  screen: {
    minimise: 'Aramayı küçült',
    chat: 'Sohbeti aç',
    participants: 'Katılımcılar',
    movePip: (c) => `Kendi görüntünü taşı (şu an: ${callUi_corner(CALL_UI_MESSAGES__CORNERS, c)})`,
  },
  pipCorners: CALL_UI_MESSAGES__CORNERS,
  history: {
    incoming: 'Gelen',
    outgoing: 'Giden',
    missed: 'Cevapsız',
    declined: 'Reddedildi',
    callBack: (name) => `${name} adlı kişiyi geri ara`,
  },
  incoming: {
    accept: 'Kabul et',
    decline: 'Reddet',
    message: 'Mesaj',
    remind: 'Bana hatırlat',
    slideToAnswer: 'Yanıtlamak için kaydır',
    voice: 'Gelen sesli arama',
    video: 'Gelen görüntülü arama',
  },
  returnToCall: 'Aramaya dön',
  returnToCallWith: (name) => `${name} ile aramaya dön`,
  join: 'Katıl',
  leave: 'Ayrıl',
  speaking: (name) => `${name} konuşuyor`,
  overflow: (n) => `+${n} kişi daha`,
  muted: (name) => `${name}, sesi kapalı`,
};

const RECENT_HIRES_CARD_MESSAGES: Translations['RECENT_HIRES_CARD_MESSAGES'] = { title: 'Son işe alımlar' };

const MAIL_LIST_MESSAGES: Translations['MAIL_LIST_MESSAGES'] = {
  draft: 'Taslak:',
  unread: 'Okunmadı',
  starred: 'Yıldızlı',
  star: 'Yıldız ekle',
  attachment: 'Ek içeriyor',
  select: 'Seç',
  threadCount: (n) => plural('tr', n, { other: '{n} ileti' }),
  moreLabels: (n) => plural('tr', n, { other: '{n} etiket daha' }),
  selectedCount: (n) => `${n} seçildi`,
  selectAll: 'Tümünü seç',
  clearSelection: 'Seçimi temizle',
  emptyTitle: 'Burada bir şey yok',
  emptyDescription: 'Yeni postalar bu klasöre gelir.',
  today: 'Bugün',
  yesterday: 'Dün',
  list: 'Posta',
};

const IMPORTANT_ALERTS_CARD_MESSAGES: Translations['IMPORTANT_ALERTS_CARD_MESSAGES'] = { title: 'Önemli uyarılar', thisWeek: 'bu hafta' };

const STAT_CARDS_MESSAGES: Translations['STAT_CARDS_MESSAGES'] = { about: (label) => `${label} hakkında`, fromLastMonth: 'Geçen aya göre' };

const SHAPE_MESSAGES: Translations['SHAPE_MESSAGES'] = {
  shapes: shapes_shapeNames(
    {
      square: 'Kare',
      slanted: 'Eğik',
      arch: 'Kemer',
      semicircle: 'Yarım daire',
      oval: 'Oval',
      pill: 'Hap',
      triangle: 'Üçgen',
      arrow: 'Ok',
      fan: 'Yelpaze',
      diamond: 'Baklava',
      clamshell: 'İstiridye',
      pentagon: 'Beşgen',
      gem: 'Mücevher',
      'very-sunny': 'Çok güneşli',
      sunny: 'Güneşli',
      burst: 'Patlama',
      'soft-burst': 'Yumuşak patlama',
      boom: 'Bum',
      'soft-boom': 'Yumuşak bum',
      flower: 'Çiçek',
      puffy: 'Kabarık',
      'puffy-diamond': 'Kabarık baklava',
      'ghost-ish': 'Hayaletimsi',
      'pixel-circle': 'Piksel daire',
      'pixel-triangle': 'Piksel üçgen',
      bun: 'Çörek',
      heart: 'Kalp',
    },
    (n) => `${n} kenarlı kurabiye`,
    (n) => `${n} yapraklı yonca`,
  ),
};

const TENANCY_MESSAGES: Translations['TENANCY_MESSAGES'] = {
  leasePaymentStatus: { upcoming: 'Yaklaşan', due: 'Vadesi yakın', overdue: 'Gecikmiş', paid: 'Ödendi' },
  rentPaymentStatus: { paid: 'Ödendi', pending: 'Bekliyor', overdue: 'Gecikmiş', partial: 'Kısmi' },
  maintenanceCategory: {
    plumbing: 'Tesisat',
    electrical: 'Elektrik',
    appliances: 'Beyaz eşya',
    heating: 'Isıtma',
    other: 'Diğer',
  },
  maintenancePriority: { low: 'Düşük öncelik', medium: 'Orta öncelik', high: 'Yüksek öncelik', urgent: 'Acil' },
  maintenanceStage: { reported: 'Bildirildi', acknowledged: 'Alındı', scheduled: 'Planlandı', resolved: 'Çözüldü' },
  documentStatus: { signed: 'İmzalandı', pending: 'İmza bekleniyor', expired: 'Süresi doldu' },
  timelineState: { complete: 'Tamamlandı', current: 'Devam ediyor', upcoming: 'Henüz değil' },
  leasePeriod: 'Kira dönemi',
  monthlyRent: 'Aylık kira',
  deposit: 'Depozito',
  nextPayment: 'Sonraki ödeme',
  paidThisYear: 'Bu yıl ödenen',
  outstanding: 'Kalan borç',
  noPayments: 'Henüz ödeme yok',
  columns: { month: 'Ay', dueDate: 'Son ödeme tarihi', method: 'Yöntem', amount: 'Tutar', status: 'Durum' },
  downloadReceipt: (month) => `${month} makbuzunu indir`,
  dueOn: (date) => `Son ödeme: ${date}`,
  comments: (n) => plural('tr', n, { one: '{n} yorum', other: '{n} yorum' }),
  photo: (position, total) => `Fotoğraf ${position}/${total}`,
  photoWithAlt: (alt, position, total) => `${alt}, fotoğraf ${position}/${total}`,
  sign: 'İmzala',
  signDocument: (name) => `${name} belgesini imzala`,
  viewDocument: (name) => `${name} belgesini görüntüle`,
  downloadDocument: (name) => `${name} belgesini indir`,
  noDocuments: 'Belge yok',
};

const DATA_TABLE_MESSAGES: Translations['DATA_TABLE_MESSAGES'] = {
  selectAll: 'Bu sayfadaki tüm satırları seç',
  selectRow: (id) => `${id} satırını seç`,
  densityLabel: 'Tablo yoğunluğu',
  density: { md: 'Normal', sm: 'Sıkı' },
};

const ERROR_BOUNDARY_MESSAGES: Translations['ERROR_BOUNDARY_MESSAGES'] = { title: 'Bir şeyler ters gitti', message: 'Beklenmeyen bir hata oluştu', retry: 'Tekrar dene' };

const AI_PROFILE_CARD_MESSAGES: Translations['AI_PROFILE_CARD_MESSAGES'] = {
  contributions: 'Bu yılki katkılar',
  activity: 'Etkinlik',
  periodGroup: (label) => `${label} dönemi`,
  periods: { weekly: 'Haftalık', monthly: 'Aylık', yearly: 'Yıllık' },
};

const BREADCRUMB_MESSAGES: Translations['BREADCRUMB_MESSAGES'] = {
  breadcrumb: 'İçerik haritası',
};

const MESSAGE_MEDIA_MESSAGES: Translations['MESSAGE_MEDIA_MESSAGES'] = {
  photo: 'Fotoğraf',
  video: 'Video',
  photoOf: (i, total) => `Fotoğraf ${i}/${total}`,
  videoOf: (i, total) => `Video ${i}/${total}`,
  tapToView: 'Görmek için dokunun',
  sendingPhoto: 'Fotoğraf gönderiliyor',
  sendingVideo: 'Video gönderiliyor',
  sendingAlbum: 'Albüm gönderiliyor',
  sendingSticker: 'Çıkartma gönderiliyor',
  sendingGif: 'GIF gönderiliyor',
  album: (n) => `Albüm, ${n} öğe`,
  sharedMedia: (n) => `Paylaşılan medya, ${n} öğe`,
  sharedFiles: (n) => `Paylaşılan dosyalar, ${n} öğe`,
  moreItems: (n) => `+${n} daha`,
  notSent: 'Gönderilemedi',
  voiceMessage: (d) => `Sesli mesaj, ${d}`,
  playVoiceMessage: 'Sesli mesajı oynat',
  pauseVoiceMessage: 'Sesli mesajı duraklat',
  transcribe: 'Metne dönüştür',
  hideTranscript: 'Metni gizle',
  seek: 'Konum',
  seekPosition: (p, d) => `${p} / ${d}`,
  playbackSpeed: (r) => `Oynatma hızı, ${r}`,
  unplayed: 'Dinlenmedi',
  download: 'İndir',
  downloaded: 'İndirildi',
  file: 'Dosya',
  fileKinds: {
    pdf: 'PDF',
    doc: 'BELGE',
    sheet: 'TABLO',
    slides: 'SUNU',
    zip: 'ZIP',
    audio: 'SES',
    video: 'VİDEO',
    image: 'GÖRSEL',
    code: 'KOD',
  },
  contact: 'Kişi',
  message: 'Mesaj',
  add: 'Ekle',
  location: 'Konum',
  liveLocation: 'Canlı konum',
  stopSharing: 'Paylaşımı durdur',
  vote: 'Oy ver',
  viewResults: 'Sonuçları gör',
  anonymousVoting: 'Anonim oylama',
  quiz: 'Test',
  selectOne: 'Birini seçin',
  selectOneOrMore: 'Bir veya daha fazlasını seçin',
  correctAnswer: 'doğru cevap',
  yourAnswer: 'cevabınız',
  votes: (n) => (n === 0 ? 'Oy yok' : `${n} oy`),
  sticker: 'Çıkartma',
};

const PIPELINE_MESSAGES: Translations['PIPELINE_MESSAGES'] = {
  health: { 'on-track': 'Yolunda', 'at-risk': 'Risk altında', stalled: 'Durdu' },
  stalledFor: (duration) => `${duration} süredir duruyor`,
  move: (title) => `${title} fırsatını taşı`,
  stages: 'Satış hattı aşamaları',
  stageWithCount: (name, n) => `${name}, ${n} fırsat`,
  empty: 'Bu aşamada fırsat yok',
  loadMore: 'Daha fazla yükle',
};

const STAY_SEARCH_MESSAGES: Translations['STAY_SEARCH_MESSAGES'] = {
  where: 'Nereye',
  checkIn: 'Giriş',
  checkOut: 'Çıkış',
  when: 'Ne zaman',
  who: 'Kimler',
  destinationPlaceholder: 'Destinasyon ara',
  datesPlaceholder: 'Tarih ekle',
  guestsPlaceholder: 'Misafir ekle',
  guests: { adults: 'Yetişkinler', children: 'Çocuklar', infants: 'Bebekler', pets: 'Evcil hayvanlar' },
  guestDescriptions: {
    adults: '13 yaş ve üzeri',
    children: '2 – 12 yaş',
    infants: '2 yaş altı',
    pets: 'Yardımcı hayvanla mı seyahat ediyorsunuz?',
  },
  dateFlexibility: 'Tarih esnekliği',
  exactDates: 'Kesin tarihler',
  plusMinusDays: (n) => plural('tr', n, { one: '± {n} gün', other: '± {n} gün' }),
  destinations: 'Destinasyonlar',
  whereTo: 'Nereye gidiyorsunuz?',
  filters: 'Filtreler',
};

const AUTH_CARD_MESSAGES: Translations['AUTH_CARD_MESSAGES'] = {
  modes: {
    signin: {
      title: 'Tekrar hoş geldiniz',
      description: 'Kaldığınız yerden devam etmek için oturum açın.',
      cta: 'Oturum aç',
      switchLead: 'Yeni misiniz?',
      switchAction: 'Hesap oluşturun',
    },
    signup: {
      title: 'Hesabınızı oluşturun',
      description: 'Birkaç dakika içinde başlayın.',
      cta: 'Hesap oluştur',
      switchLead: 'Zaten hesabınız var mı?',
      switchAction: 'Oturum aç',
    },
    verify: {
      title: 'Gelen kutunuzu kontrol edin',
      description: 'Oturum açmayı tamamlamak için gönderdiğimiz kodu girin.',
      cta: 'Doğrula ve devam et',
      switchLead: 'Kod gelmedi mi?',
      switchAction: 'Yenisini gönder',
    },
  },
  codeSentTo: (email) => `Oturum açmayı tamamlamak için ${email} adresine gönderdiğimiz kodu girin.`,
  verificationCode: 'Doğrulama kodu',
  fullName: 'Ad soyad',
  namePlaceholder: 'Ayşe Yılmaz',
  email: 'E-posta',
  emailPlaceholder: 'siz@sirket.com',
  emailHint: 'Bunu yalnızca sizinle iletişim kurmak için kullanırız ve asla paylaşmayız.',
  password: 'Şifre',
  passwordPlaceholder: 'Şifrenizi girin',
  newPasswordPlaceholder: 'En az 8 karakter',
  confirmPassword: 'Şifreyi onayla',
  confirmPasswordPlaceholder: 'Şifrenizi tekrar girin',
  rememberMe: 'Beni hatırla',
  forgotPassword: 'Şifrenizi mi unuttunuz?',
  terms: 'Hesap oluşturarak Hizmet Şartlarımızı ve Gizlilik Politikamızı kabul etmiş olursunuz.',
  orContinueWith: 'veya şununla devam edin',
};

const TRACK_LIST_MESSAGES: Translations['TRACK_LIST_MESSAGES'] = {
  title: 'Başlık',
  album: 'Albüm',
  dateAdded: 'Eklenme tarihi',
  plays: 'Dinlenme',
  duration: 'Süre',
  moveUp: 'Yukarı taşı',
  moveDown: 'Aşağı taşı',
  reorder: 'Yeniden sırala',
  downloaded: 'İndirildi',
  unavailable: 'Kullanılamıyor',
  tracks: 'Şarkılar',
  episodes: 'Bölümler',
  selected: (n) => plural('tr', n, { other: '{n} seçildi' }),
  clearSelection: 'Seçimi temizle',
  played: 'Oynatıldı',
  listened: 'Dinlendi',
  saveEpisode: 'Bölümü kaydet',
  downloadEpisode: 'Bölümü indir',
  minutes: (m) => `${m} dk`,
  hours: (h) => `${h} sa`,
  hoursMinutes: (h, m) => `${h} sa ${m} dk`,
  remaining: (l) => `${l} kaldı`,
};

const LYRICS_MESSAGES: Translations['LYRICS_MESSAGES'] = {
  lyrics: 'Şarkı sözleri',
  showLyrics: 'Sözleri göster',
  backToCurrent: 'Geçerli satıra dön',
  empty: 'Bu parçanın sözleri mevcut değil',
};

const ACTIVITY_FEED_MESSAGES: Translations['ACTIVITY_FEED_MESSAGES'] = {
  kinds: { call: 'Arama', email: 'E-posta', meeting: 'Toplantı', note: 'Not', 'stage-change': 'Aşama değişikliği', task: 'Görev tamamlandı' },
  empty: 'Henüz kayıtlı etkinlik yok',
  loggedBy: (name) => `Kaydeden: ${name}`,
  filterActivity: 'Etkinliği filtrele',
};

const PLACE_REVIEWS_MESSAGES: Translations['PLACE_REVIEWS_MESSAGES'] = {
  depositReturned: 'Depozito iade edildi',
  depositNotReturned: 'Depozito iade edilmedi',
  recommend: 'Tavsiye ederim',
  notRecommend: 'Tavsiye etmem',
  helpful: 'Faydalı',
  report: 'Bildir',
  promptTitle: 'Burada yaşadınız mı?',
  promptDescription: (building) =>
    `${building} için gelecekteki kiracılara yardımcı olun. Değerlendirmeler anonimdir.`,
  writeReview: 'Değerlendirme yaz',
  reviewCount: (n) => plural('tr', n, { other: '{n} değerlendirme' }),
  depositRate: (percent) => `Kiralamaların %${percent} kadarında depozito iade edildi`,
  recommendRate: (percent) => `%${percent} burada yaşamayı tavsiye ediyor`,
};

const DELIVERY_SLOT_MESSAGES: Translations['DELIVERY_SLOT_MESSAGES'] = {
  tiers: { standard: 'Standart', express: 'Ekspres' },
  soldOut: 'Doldu',
  asap: 'En kısa sürede',
  field: 'Teslimat zamanı',
  day: 'Gün',
  emptyTitle: 'Boş zaman aralığı kalmadı',
  emptyDescription: 'Başka bir gün seçin ya da ilk uygun kuryeyi bekleyin.',
};

const PLACE_LIST_MESSAGES: Translations['PLACE_LIST_MESSAGES'] = {
  visibility: { private: 'Gizli', shared: 'Paylaşılan', public: 'Herkese açık' },
  places: (n) => plural('tr', n, { other: '{n} yer' }),
  sharedWith: (n) => plural('tr', n, { other: '{n} kişiyle paylaşıldı' }),
  labels: {
    moveEarlier: (position) => `${position - 1}. sıraya taşı`,
    moveLater: (position) => `${position + 1}. sıraya taşı`,
    remove: (name) => `${name} öğesini listeden kaldır`,
    moved: (name, position, total) => `${name}, ${total} öğe içinde ${position}. sıraya taşındı`,
    note: 'Not',
  },
  savedPlaces: 'Kaydedilen yerler',
};

const HOME_SEARCH_MESSAGES: Translations['HOME_SEARCH_MESSAGES'] = {
  modes: { rent: 'Kiralık', buy: 'Satılık', stays: 'Tatil kiralama', swap: 'Takas' },
  searchMode: 'Arama modu',
  location: 'Konum',
  locationPlaceholder: 'Şehir veya bölge ara',
  moveIn: 'Taşınma',
  datePlaceholder: 'Tarih ekle',
  budget: 'Bütçe',
  budgetPlaceholder: 'Bütçe ekle',
  price: 'Fiyat',
  pricePlaceholder: 'Tüm fiyatlar',
  propertyType: 'Mülk tipi',
  propertyTypePlaceholder: 'Tüm tipler',
  dates: 'Tarihler',
  homeSize: 'Ev büyüklüğü',
  homeSizePlaceholder: 'Tüm büyüklükler',
  minimum: 'En az',
  maximum: 'En fazla',
  budgetPresets: 'Bütçe aralıkları',
  monthlyBudget: 'Aylık bütçe',
  monthlyBudgetDescription: 'Aylık kira, faturalar hariç',
  totalPriceDescription: 'Toplam fiyat',
  upTo: (amount) => `En fazla ${amount}`,
  any: 'Fark etmez',
  moveInLabels: {
    date: 'Taşınma tarihi',
    flexible: 'Esnek',
    asap: 'En kısa sürede',
    contractLength: 'Sözleşme süresi',
  },
  contractLengths: { any: 'Fark etmez', short: '1–6 ay', medium: '6–12 ay', long: '1 yıldan fazla' },
  saveSearch: 'Aramayı kaydet',
  saved: 'Kaydedildi',
  newCount: (n) => `${n} yeni`,
  alertsOff: 'Bildirimler kapalı',
  actionOn: (action, subject) => `${subject}: ${action}`,
};

const OFFERING_BADGE_MESSAGES: Translations['OFFERING_BADGE_MESSAGES'] = { offerings: { long_term_rent: 'Kiralık', sale: 'Satılık', short_term_rent: 'Tatil kiralık', exchange: 'Takas' } };

const MAP_ATTRIBUTION_MESSAGES: Translations['MAP_ATTRIBUTION_MESSAGES'] = { scale: 'Ölçek', mapData: 'Harita verileri' };

const SLIDER_MESSAGES: Translations['SLIDER_MESSAGES'] = { minimum: 'En düşük', maximum: 'En yüksek', value: (n) => `Değer ${n}` };

const SELECT_MESSAGES: Translations['SELECT_MESSAGES'] = { selectOption: 'Bir seçenek belirleyin', scrollUp: 'Yukarı kaydır', scrollDown: 'Aşağı kaydır' };

const ZOOMABLE_MEDIA_GALLERY_MESSAGES: Translations['ZOOMABLE_MEDIA_GALLERY_MESSAGES'] = {
  close: 'Medya görüntüleyiciyi kapat',
  previous: 'Önceki öğe',
  next: 'Sonraki öğe',
  goTo: (i, n) => `${n} öğeden ${i}. öğeye git`,
  share: 'Medyayı paylaş',
};

const NOTIFICATION_MESSAGES: Translations['NOTIFICATION_MESSAGES'] = { dismiss: 'Bildirimi kapat' };

const PHONE_INPUT_MESSAGES: Translations['PHONE_INPUT_MESSAGES'] = { phoneNumber: 'Telefon numarası', countryCode: 'Ülke kodu' };

const VENDOR_CARD_MESSAGES: Translations['VENDOR_CARD_MESSAGES'] = {
  facts: { deliveryTime: 'Teslimat süresi', deliveryFee: 'Teslimat', distance: 'Mesafe', minimumOrder: 'Minimum sipariş' },
  availability: { paused: 'Duraklatıldı', closed: 'Kapalı' },
  new: 'Yeni',
  rated: (value, reviews) =>
    `5 üzerinden ${value} puan${vendorCard_has(reviews) ? `, ${vendorCard_counted('tr', reviews, { other: '{n} değerlendirme' })}` : ''}`,
};

const CHAT_INDICATORS_MESSAGES: Translations['CHAT_INDICATORS_MESSAGES'] = {
  presence: { online: 'Çevrimiçi', idle: 'Uzakta', offline: 'Çevrimdışı', busy: 'Meşgul' },
  status: { sending: 'Gönderiliyor…', sent: 'Gönderildi', delivered: 'İletildi', read: 'Okundu', failed: 'Gönderilemedi' },
  unread: 'Okunmadı',
  unreadCount: (n) => plural('tr', n, { one: '{n} okunmamış mesaj', other: '{n} okunmamış mesaj' }),
};

const MEDIA_CONTROLS_MESSAGES: Translations['MEDIA_CONTROLS_MESSAGES'] = {
  play: 'Oynat',
  pause: 'Duraklat',
  playSubject: (s) => `${s} oynat`,
  pauseSubject: (s) => `${s} duraklat`,
  saveToLibrary: 'Kitaplığına kaydet',
  saveSubjectToLibrary: (s) => `${s} kitaplığına kaydet`,
  explicit: 'Müstehcen',
  seek: 'Oynatma konumu',
  seekValue: (a, b) => `${a} / ${b}`,
  mute: 'Sesi kapat',
  unmute: 'Sesi aç',
  volume: 'Ses düzeyi',
  nowPlaying: 'Şimdi çalıyor',
};

const INPUT_OTP_MESSAGES: Translations['INPUT_OTP_MESSAGES'] = {
  oneTimeCode: 'Tek kullanımlık kod',
  digitOf: (i, n) => `Rakam ${i}/${n}`,
  characterOf: (i, n) => `Karakter ${i}/${n}`,
};

const PLACE_DETAILS_MESSAGES: Translations['PLACE_DETAILS_MESSAGES'] = {
  infoActions: { call: 'Ara', open: 'Web sitesini aç', directions: 'Yol tarifi' },
  busy: {
    busier: 'Normalden daha kalabalık',
    typical: 'Her zamanki kadar kalabalık',
    quieter: 'Normalden daha sakin',
  },
  transitModes: {
    bus: 'Otobüs durağı',
    metro: 'Metro istasyonu',
    train: 'Tren istasyonu',
    tram: 'Tramvay durağı',
    ferry: 'Feribot iskelesi',
  },
  notAvailable: 'Mevcut değil',
  amenities: 'Olanaklar',
  today: 'Bugün',
  closed: 'Kapalı',
  openingHours: 'Çalışma saatleri',
  day: 'Gün',
  noDataForDay: 'Bu gün için veri yok',
  chartNoData: (day) => `${day}, veri yok`,
  chartClosed: (day) => `${day}, tüm gün kapalı`,
  chartPeak: (day, hour) => `${day}, en kalabalık saat ${hour}`,
  chartNow: (hour) => `şu an ${hour}`,
  live: 'canlı',
  noDepartures: 'Şu anda kalkış yok',
  nearbyTransit: 'Yakındaki toplu taşıma',
  lines: 'Hatlar',
  line: (name) => `${name} hattı`,
  towards: (headsign) => `${headsign} yönüne`,
};

const APP_SHELL_MESSAGES: Translations['APP_SHELL_MESSAGES'] = {
  openNavigation: 'Gezinmeyi aç',
  closeNavigation: 'Gezinmeyi kapat',
  resizePanes: 'Bölmeleri yeniden boyutlandır',
  notifications: 'Bildirimler',
  proOffer: 'Pro teklifi',
};

const ROUTE_STOPS_MESSAGES: Translations['ROUTE_STOPS_MESSAGES'] = {
  routeStops: 'Rota durakları',
  origin: 'Başlangıç',
  destination: 'Varış noktası',
  stop: (position) => `${position}. durak`,
  swap: 'Başlangıç ve varış noktasını değiştir',
  addStop: 'Durak ekle',
  removeStop: (title) => `${title} kaldır`,
  state: { reached: 'Ulaşıldı', current: 'Mevcut durak', pending: 'Ulaşılmadı' },
};

const SEARCH_MESSAGES: Translations['SEARCH_MESSAGES'] = { clearQuery: 'Arama sorgusunu temizle' };

const TAG_FIELD_MESSAGES: Translations['TAG_FIELD_MESSAGES'] = { remove: (t) => `${t} etiketini kaldır`, full: (n) => `En fazla ${n}`, suggestions: 'Öneriler' };

const STAY_FILTERS_MESSAGES: Translations['STAY_FILTERS_MESSAGES'] = {
  propertyTypes: {
    apartment: 'Daire',
    house: 'Müstakil ev',
    room: 'Oda',
    studio: 'Stüdyo',
    duplex: 'Dubleks / Çatı katı',
    coliving: 'Ortak yaşam',
    hostel: 'Hostel',
    other: 'Arsa / Diğer',
  },
  features: {
    elevator: 'Asansör',
    parking: 'Otopark',
    terrace: 'Teras',
    garden: 'Bahçe',
    pool: 'Havuz',
    furnished: 'Eşyalı',
    pets: 'Evcil hayvan kabul edilir',
    airConditioning: 'Klima',
    heating: 'Isıtma',
    accessible: 'Engelli erişimine uygun',
    storage: 'Depo',
  },
  floors: { ground: 'Giriş katı', middle: 'Ara kat', top: 'En üst kat', elevator: 'Asansörlü' },
  minimum: 'En az',
  maximum: 'En fazla',
  priceRange: 'Fiyat aralığı',
  area: 'Alan',
  featuresGroup: 'Özellikler',
  floor: 'Kat',
  propertyType: 'Mülk tipi',
  energyRating: 'Enerji sınıfı',
  anyRating: 'Tüm sınıflar',
  ratingOnly: (r) => `Yalnızca ${r}`,
  ratingAndBetter: (r) => `${r} ve üzeri`,
  filters: 'Filtreler',
  filtersApplied: (label, n) => `${label}, ${n} uygulandı`,
  clearAll: 'Tümünü temizle',
  any: 'Fark etmez',
  availableNow: 'Hemen müsait',
  availableNowDescription: 'Bugün taşınmaya hazır',
  availableFrom: 'Müsait olduğu tarih',
  anyDate: 'Herhangi bir tarih',
};

const SETTINGS_MODAL_MESSAGES: Translations['SETTINGS_MODAL_MESSAGES'] = {
  dialog: 'Ayarlar',
  nav: 'Ayar bölümleri',
  close: 'Ayarları kapat',
  saved: 'Kaydedildi',
  currentPlan: 'Mevcut plan',
  actions: 'İşlemler',
  storage: {
    storedIn: 'Depolanan',
    fileCount: (n, shown) => plural('tr', n, { other: `${shown} dosya` }),
    filterByType: 'Dosya türüne göre filtrele',
    fileType: 'Dosya türü',
    orderBy: 'Sıralama',
    modified: 'Değiştirilme',
    oldestFirst: 'Önce en eski',
    searchFiles: 'Dosyalarda ara',
    selectAllOnPage: 'Bu sayfadaki tüm dosyaları seç',
    fileName: 'Dosya adı',
    uploadedOn: 'Yüklenme tarihi',
    fileSize: 'Dosya boyutu',
    sortBy: { name: 'Dosya adına göre sırala', uploadedAt: 'Yüklenme tarihine göre sırala', size: 'Dosya boyutuna göre sırala' },
    selectFile: (name) => `Seç: ${name}`,
    deleteFile: 'Dosyayı sil',
    deleteNamed: (name) => `Sil: ${name}`,
    noMatches: 'Filtrelerinize uyan dosya yok.',
    documents: 'Belgeler',
    spreadsheets: 'E-tablolar',
    videos: 'Videolar',
    downloadFile: 'Dosyayı indir',
    rename: 'Yeniden adlandır',
    copyLink: 'Bağlantıyı kopyala',
  },
  tools: {
    showOutput: 'Çıktıyı göster',
    refreshTools: 'Araçları yenile',
    removeServer: 'Sunucuyu kaldır',
    logout: 'Oturumu kapat',
    logOutOf: (server) => `Oturumu kapat: ${server}`,
    showTools: (server) => `${server} araçlarını göster`,
    hideTools: (server) => `${server} araçlarını gizle`,
    error: 'Hata',
    showOutputLink: 'Çıktıyı göster',
    showOutputOf: (server) => `${server} çıktısını göster`,
    newServer: 'Yeni MCP sunucusu',
    newServerDescription: 'Özel bir MCP sunucusu ekle',
    projectScope: 'Proje kapsamı',
    authentication: 'Kimlik doğrulama',
    waitForAuth: 'MCP kimlik doğrulamasını bekle',
    waitForAuthDescription:
      'İstendiğinde kimlik doğrulama için süresiz bekle. Kapalıyken kimlik doğrulama istemleri 30 saniye sonra atlanır.',
    waitForAuthSwitch: 'MCP kimlik doğrulamasını bekle',
    scopeServers: (scope) => `${scope} MCP sunucuları`,
    scopeServersDescription: (scope) => `Kullanılabilir sunucular: ${scope}.`,
    teamServers: 'Ekip MCP sunucuları',
    teamServersDescription: 'Kontrol panelinde yapılandırılır',
    manage: 'Yönet',
    noTeamServers: 'Ekip MCP sunucusu yok',
    noTeamServersBody: 'MCP sunucularını masaüstünde ve bulutta kullanılabilir kılmak için kontrol panelinde yapılandırın.',
    configureTeam: 'Ekip MCP sunucularını yapılandır',
    pluginServers: 'Eklenti MCP sunucuları',
  },
};

const EVICTION_MESSAGES: Translations['EVICTION_MESSAGES'] = {
  status: {
    scheduled: 'Planlandı',
    postponed: 'Ertelendi',
    suspended: 'Durduruldu',
    executed: 'Uygulandı',
    cancelled: 'İptal edildi',
  },
  attend: 'Orada olacağım',
  share: 'Paylaş',
  contactSupport: 'Destek grubuyla iletişime geç',
  verified: 'Topluluk tarafından doğrulandı',
  caseHistory: 'Dava geçmişi',
  source: (source) => `Kaynak: ${source}`,
};

const BOOKING_MESSAGES: Translations['BOOKING_MESSAGES'] = {
  checkIn: 'Giriş',
  checkOut: 'Çıkış',
  guests: 'Misafirler',
  addDate: 'Tarih ekle',
  reserve: 'Rezervasyon yap',
  checkAvailability: 'Müsaitliği kontrol et',
  notChargedYet: 'Henüz sizden ücret alınmayacak',
  total: 'Toplam',
  tripStatus: { confirmed: 'Onaylandı', pending: 'Beklemede', cancelled: 'İptal edildi', completed: 'Tamamlandı' },
  priceName: booking_priceName((p, u) => `${u} başına ${p}`, (s, o) => `${s}, önceki fiyat ${o}`),
};

const AGENT_LIMITS_CARD_MESSAGES: Translations['AGENT_LIMITS_CARD_MESSAGES'] = { contextWindow: 'Bağlam penceresi', freeSpace: 'Boş alan', planUsageLimits: 'Plan kullanım sınırları', managePlan: 'Planı yönet' };

const SWIPE_ROW_MESSAGES: Translations['SWIPE_ROW_MESSAGES'] = {
  closeActions: 'Eylemleri kapat',
};

const PATIENT_INFO_CARD_MESSAGES: Translations['PATIENT_INFO_CARD_MESSAGES'] = { addPhoto: 'Profil fotoğrafı ekle' };

const THEME_TOGGLE_MESSAGES: Translations['THEME_TOGGLE_MESSAGES'] = { theme: 'Tema', darkMode: 'Koyu mod', lightMode: 'Açık mod', useDarkMode: 'Koyu modu kullan', useLightMode: 'Açık modu kullan' };

const EARNINGS_MESSAGES: Translations['EARNINGS_MESSAGES'] = {
  earned: 'Kazanılan',
  period: 'Kazanç dönemi',
  breakdown: 'Nereden geldi',
  payout: 'Sonraki ödeme',
  payoutState: { scheduled: 'Planlandı', processing: 'Yolda', paid: 'Ödendi', held: 'Bekletiliyor', failed: 'Başarısız' },
  chart: (label) => `${label} kazançları, döneme göre`,
  empty: 'Henüz kazanç yok',
  earnings: 'Kazançlar',
};

const PROOF_OF_DELIVERY_MESSAGES: Translations['PROOF_OF_DELIVERY_MESSAGES'] = {
  labels: {
    signature: 'İmza',
    signaturePad: 'İmza alanı',
    signatureHint: 'Parmağınızla imzalayın',
    signed: 'İmzalandı',
    clear: 'İmzayı temizle',
    typeName: 'Ya da adınızı yazın',
    typeNamePlaceholder: 'Ad soyad',
    photo: 'Fotoğraf',
    photoHint: 'Bıraktığınız yer ya da alıcıyla birlikte paket.',
    code: 'Teslimat kodu',
    codeHint: 'Alıcıdan uygulamasındaki kodu okumasını isteyin.',
    recipient: 'Teslim alan',
    recipientPlaceholder: 'Ad',
    note: 'Not',
    notePlaceholder: 'Kayda değer her şey',
    submit: 'Teslimatı onayla',
    required: 'Zorunlu',
    missing: 'Onaylamadan önce bu gerekli.',
    missingSummary: (n) => `${n} eksik bilgi var`,
  },
  proofOfDelivery: 'Teslimat kanıtı',
};

const FILE_UPLOAD_MESSAGES: Translations['FILE_UPLOAD_MESSAGES'] = {
  promptWeb: 'Yüklemek için sürükleyip bırakın ya da',
  promptNative: 'Dokunarak',
  selectWeb: 'seçin',
  selectNative: 'dosya seçin',
  uploading: (size) => `${size} yükleniyor...`,
  uploaded: 'Başarıyla yüklendi!',
  unsupported: (extensions) => `Yalnızca ${extensions} dosyaları desteklenir`,
  tooLarge: (max) => `Bu dosya ${max} boyutundan büyük`,
  max: (size) => `(en fazla ${size})`,
  uploadFile: 'Dosya yükle',
};

const POPOVER_MESSAGES: Translations['POPOVER_MESSAGES'] = {
  popover: 'Açılır pencere',
};

const QUEUE_PANEL_MESSAGES: Translations['QUEUE_PANEL_MESSAGES'] = {
  queueTab: 'Sıra',
  recentTab: 'Son çalınanlar',
  close: 'Sırayı kapat',
  nextInQueue: 'Sırada sonraki',
  nextFrom: (c) => `Sonraki: ${c}`,
  nextUp: 'Sıradaki',
  clearQueue: 'Sırayı temizle',
  reorder: (t) => `${t} öğesini yeniden sırala`,
  reorderHint: 'Sürükleyin veya ok tuşlarını kullanın',
  moveUp: 'Yukarı taşı',
  moveDown: 'Aşağı taşı',
  remove: 'Sıradan kaldır',
  moved: (t, p, n) => `${t}, ${n} öğe içinde ${p}. sıraya taşındı`,
  emptyQueue: 'Sıran boş',
  emptyQueueHint: 'Sonra dinlemek için şarkı ve bölüm ekle.',
  emptyRecent: 'Henüz bir şey çalınmadı',
};

const HOVER_CARD_MESSAGES: Translations['HOVER_CARD_MESSAGES'] = {
  hoverCard: 'Önizleme kartı',
};

const NOTE_EDITOR_MESSAGES: Translations['NOTE_EDITOR_MESSAGES'] = {
  header: {
    saved: 'Kaydedildi',
    saving: 'Kaydediliyor…',
    offline: 'Çevrimdışı — değişiklikler bekletiliyor',
    error: 'Kaydedilmedi',
    words: (n) => plural('tr', n, { other: '{n} kelime' }),
    title: 'Başlık',
  },
  untitled: 'Başlıksız',
  note: 'Not',
  toolbar: { more: 'Diğer biçimlendirme', moreMenu: 'Diğer biçimlendirme' },
};

const MEDIA_SHELF_MESSAGES: Translations['MEDIA_SHELF_MESSAGES'] = { filters: 'Filtreler', showAll: 'Tümünü göster' };

const CATEGORY_BAR_MESSAGES: Translations['CATEGORY_BAR_MESSAGES'] = { previous: 'Önceki kategoriler', next: 'Sonraki kategoriler' };

const CARRIER_QUOTE_MESSAGES: Translations['CARRIER_QUOTE_MESSAGES'] = {
  labels: {
    accept: 'Kabul et',
    message: 'Mesaj',
    decline: 'Reddet',
    pickup: 'Alım',
    eta: 'Varış',
    vehicle: 'Araç',
    jobs: (jobs) => `${jobs} iş`,
    verified: 'Doğrulanmış taşıyıcı',
    marks: { cheapest: 'En ucuz', fastest: 'En hızlı' },
    showPrice: 'Fiyat ayrıntılarını göster',
    hidePrice: 'Fiyat ayrıntılarını gizle',
    priceDetails: 'Fiyat ayrıntıları:',
    sort: 'Teklifleri sırala',
    sortOptions: { price: 'En ucuz', eta: 'En hızlı', rating: 'En yüksek puanlı' },
    count: (n) => plural('tr', n, { other: '{n} teklif' }),
    loading: 'Teklifler yükleniyor',
  },
  emptyTitle: 'Henüz teklif yok',
  emptyDescription: 'Taşıyıcılar işinizi inceliyor. İlk teklifler genellikle birkaç dakika içinde gelir.',
  list: 'Teklifler',
  priceDetailsFor: (name) => `${name} için fiyat ayrıntıları`,
};

const TEXT_FIELD_MESSAGES: Translations['TEXT_FIELD_MESSAGES'] = { showPassword: 'Şifreyi göster', hidePassword: 'Şifreyi gizle', required: 'zorunlu' };

const CHAT_SCREEN_MESSAGES: Translations['CHAT_SCREEN_MESSAGES'] = {
  call: 'Sesli ara',
  videoCall: 'Görüntülü ara',
  searchInConversation: 'Sohbette ara',
  connecting: 'Bağlanıyor…',
  verified: 'Doğrulanmış',
  bot: 'Bot',
  channel: 'Kanal',
  clearSelection: 'Seçimi temizle',
  forward: 'İlet',
  pin: 'Sabitle',
  selectedCount: (n) => `${n} seçildi`,
  pinnedList: 'Sabitlenmiş mesajları göster',
  pinnedClose: 'Sabitlenenler çubuğunu gizle',
  pinnedUnpin: 'Bu mesajın sabitlemesini kaldır',
  pinnedMessage: 'Sabitlenmiş mesaj',
  pinnedMessageNumber: (n) => `Sabitlenmiş mesaj #${n}`,
  scrollToBottom: 'En son mesajlara git',
  jumpToMention: 'Bahsetmeye git',
  emptyTitle: 'Henüz mesaj yok',
  info: 'Bilgi',
  members: 'Üyeler',
  addMember: 'Üye ekle',
  memberSearch: 'Üye ara',
  noMembers: 'Üye bulunamadı',
  owner: 'Sahip',
  admin: 'Yönetici',
  resizeList: 'Sohbet listesini yeniden boyutlandır',
};

const CONTEXT_MENU_MESSAGES: Translations['CONTEXT_MENU_MESSAGES'] = {
  contextMenu: 'Bağlam menüsü',
};

const SORTABLE_MEDIA_MESSAGES: Translations['SORTABLE_MEDIA_MESSAGES'] = {
  photo: (p, t) => `Fotoğraf ${p}/${t}`,
  cover: 'Kapak',
  moveEarlier: (p) => `${p}. fotoğrafı öne taşı`,
  moveLater: (p) => `${p}. fotoğrafı arkaya taşı`,
  remove: (p) => `${p}. fotoğrafı kaldır`,
  retry: (p) => `${p}. fotoğrafı yeniden yükle`,
  uploading: (p) => `${p}. fotoğraf yükleniyor`,
  failed: 'Yükleme başarısız',
  add: 'Fotoğraf ekle',
  moved: (p, t) => `${t} içinde ${p}. konuma taşındı`,
  photos: 'Fotoğraflar',
};

const CONNECTION_DOTS_MESSAGES: Translations['CONNECTION_DOTS_MESSAGES'] = {
  connecting: 'Bağlanıyor',
};

const CHAT_PEOPLE_MESSAGES: Translations['CHAT_PEOPLE_MESSAGES'] = {
  newGroup: {
    photo: 'Grup fotoğrafı seç',
    name: 'Grup adı',
    namePlaceholder: 'Bu gruba bir ad verin',
    description: 'Açıklama',
    descriptionPlaceholder: 'Bu grup ne için?',
    members: (n) => plural('tr', n, { one: '{n} üye', other: '{n} üye' }),
    addMembers: 'Üye ekle',
    remove: (name) => `Kaldır: ${name}`,
  },
  member: {
    owner: 'Sahip',
    admin: 'Yönetici',
    promote: 'Yönetici yap',
    restrict: 'Kısıtla',
    remove: 'Gruptan çıkar',
    actions: (name) => `İşlemler: ${name}`,
  },
  story: {
    close: 'Hikâyeyi kapat',
    previous: 'Önceki hikâye',
    next: 'Sonraki hikâye',
    mute: 'Hikâyenin sesini kapat',
    unmute: 'Hikâyenin sesini aç',
    more: 'Hikâye seçenekleri',
    replyPlaceholder: 'Yanıtla…',
    send: 'Yanıtı gönder',
    progress: (index, count) => `Hikâye ${index + 1}/${count}`,
    react: (emoji) => `${emoji} ile tepki ver`,
  },
  searchMembers: 'Üye ara',
  share: 'Paylaş',
  postOptions: 'Gönderi seçenekleri',
  pinned: 'Sabitlendi',
  views: (c) => `${c} görüntülenme`,
  forwards: (c) => `${c} iletme`,
  jumpTo: (letter) => `${letter} harfine git`,
  add: 'Ekle',
  added: 'Eklendi',
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
