// Bloom's id strings for every family. Loaded on demand by
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

const CALL_UI_MESSAGES__CORNERS = { 'top-left': 'kiri atas', 'top-right': 'kanan atas', 'bottom-left': 'kiri bawah', 'bottom-right': 'kanan bawah' };

const COMMON_MESSAGES: Translations['COMMON_MESSAGES'] = {
  close: 'Tutup',
  dismiss: 'Abaikan',
  back: 'Kembali',
  goBack: 'Kembali ke sebelumnya',
  loading: 'Memuat',
  more: 'Lainnya',
  moreOptions: 'Opsi lainnya',
  moreActions: 'Tindakan lainnya',
  progress: 'Kemajuan',
  stepOf: (step, total) => `Langkah ${step} dari ${total}`,
  labelFor: (label, subject) => `${label} untuk ${subject}`,
  tapToClose: 'Ketuk untuk menutup',
  cancel: 'Batal',
  done: 'Selesai',
  save: 'Simpan',
  delete: 'Hapus',
  edit: 'Edit',
  remove: 'Keluarkan',
  retry: 'Coba lagi',
  search: 'Cari',
  showMore: 'Tampilkan lebih banyak',
  showLess: 'Tampilkan lebih sedikit',
  next: 'Berikutnya',
  previous: 'Sebelumnya',
  open: 'Buka',
  menu: 'Menu',
  copy: 'Salin',
  copied: 'Disalin',
  send: 'Kirim',
  clear: 'Bersihkan',
  seeAll: 'Lihat semua',
  resizePanels: 'Ubah ukuran panel',
};

const SURFACES_MESSAGES: Translations['SURFACES_MESSAGES'] = { confirm: 'Konfirmasi', ok: 'Oke' };

const CONTACT_CARD_MESSAGES: Translations['CONTACT_CARD_MESSAGES'] = {
  channels: {
    email: { action: 'Email', name: (s) => `Kirim email ke ${s}` },
    phone: { action: 'Telepon', name: (s) => `Telepon ${s}` },
    chat: { action: 'Pesan', name: (s) => `Kirim pesan ke ${s}` },
    meeting: { action: 'Rapat', name: (s) => `Jadwalkan rapat dengan ${s}` },
    video: { action: 'Video', name: (s) => `Mulai panggilan video dengan ${s}` },
    website: { action: 'Situs web', name: (s) => `Buka situs web ${s}` },
  },
  labelsFor: (name) => `Label untuk ${name}`,
  owner: 'Pemilik',
};

const CHAT_LIST_MESSAGES: Translations['CHAT_LIST_MESSAGES'] = {
  item: { draft: 'Draf:', pinned: 'Disematkan', muted: 'Dibisukan', verified: 'Terverifikasi', channel: 'Saluran', bot: 'Bot', group: 'Grup' },
  search: { chat: 'Obrolan', message: 'Pesan', contact: 'Kontak', empty: 'Tidak ada hasil' },
  list: 'Obrolan',
  emptyTitle: 'Belum ada percakapan',
  emptyDescription: 'Mulai obrolan dan obrolan akan muncul di sini.',
  searchResults: 'Hasil pencarian',
  searchChats: 'Cari obrolan',
  clearSearch: 'Hapus pencarian',
  newChat: 'Obrolan baru',
  archived: 'Diarsipkan',
  archivedName: (label, n) => `${label}, ${n} obrolan`,
  folderName: (label, n) => `${label}, ${n} belum dibaca`,
  stories: 'Cerita',
  ownStory: 'Cerita Anda',
  addStory: 'Tambahkan ke cerita Anda',
  storyOf: (name) => `Cerita ${name}`,
};

const NOTE_CARD_MESSAGES: Translations['NOTE_CARD_MESSAGES'] = {
  pinned: 'Disematkan',
  locked: 'Dilindungi',
  attachments: (n) => plural('id', n, { other: '{n} lampiran' }),
  select: 'Pilih catatan',
  checklistDone: 'Selesai',
  checklistTodo: 'Belum selesai',
  more: (n) => `${n} lainnya`,
};

const DIALOG_MESSAGES: Translations['DIALOG_MESSAGES'] = {
  view: 'Tampilan',
  dismissDialog: 'Tutup dialog',
  dismissNamed: (label) => `Tutup ${label}`,
};

const ALERT_DIALOG_MESSAGES: Translations['ALERT_DIALOG_MESSAGES'] = {
  confirm: 'Konfirmasi',
};

const SIDEBAR_MESSAGES: Translations['SIDEBAR_MESSAGES'] = {
  sidebar: 'Bilah sisi',
  collapse: 'Ciutkan bilah sisi',
  expand: 'Luaskan bilah sisi',
  close: 'Tutup bilah sisi',
  quickSearch: 'Pencarian Cepat',
  searchPlaceholder: 'Cari navigasi…',
  searchPlaceholderCompact: 'Cari...',
  filter: 'Filter navigasi',
  clearSearch: 'Hapus pencarian navigasi',
  noResults: 'Tidak ada hasil',
  mode: 'Mode',
  upgrade: 'Upgrade',
  usersWithAccess: 'Pengguna dengan akses',
  addUser: 'Tambah pengguna',
  manage: 'Kelola',
  accountMenu: 'Menu akun',
  teamMenu: (team) => `Menu ${team}`,
};

const FILE_SIZE_UNITS: Translations['FILE_SIZE_UNITS'] = { byte: 'B', kilobyte: 'KB', megabyte: 'MB', gigabyte: 'GB' };

const CARD_FORM_MESSAGES: Translations['CARD_FORM_MESSAGES'] = {
  labels: { number: 'Nomor kartu', expiry: 'Tanggal kedaluwarsa', securityCode: 'Kode keamanan', name: 'Nama di kartu', postcode: 'Kode pos', country: 'Negara' },
  selectCountry: 'Pilih negara',
};

const CHAT_COMPOSER_MESSAGES: Translations['CHAT_COMPOSER_MESSAGES'] = {
  attach: 'Lampirkan',
  emoji: 'Emoji',
  camera: 'Kamera',
  mic: 'Rekam pesan suara',
  message: 'Pesan',
  enterHint: 'Enter untuk mengirim · Shift + Enter untuk baris baru',
  modEnterHint: '⌘ + Enter untuk mengirim · Enter untuk baris baru',
  cancelRecording: 'Batalkan rekaman',
  sendVoice: 'Kirim pesan suara',
  deleteRecording: 'Hapus rekaman',
  playRecording: 'Putar rekaman',
  pauseRecording: 'Jeda rekaman',
  lockRecording: 'Kunci rekaman',
  slideToCancel: 'Geser untuk membatalkan',
  recording: 'Merekam',
  searchEmoji: 'Cari emoji',
  noEmoji: 'Emoji tidak ditemukan',
  frequentlyUsed: 'Sering digunakan',
  skinTone: 'Warna kulit',
  emojiPicker: 'Pemilih emoji',
  moreReactions: 'Reaksi lainnya',
  quickReactions: 'Reaksi cepat',
  messageActions: 'Tindakan pesan',
  attachments: 'Lampiran',
  removeAttachment: (name) => `Hapus ${name}`,
  suggestions: { mention: 'Orang', command: 'Perintah', emoji: 'Emoji' },
  suggestionVerified: 'Terverifikasi',
  searchingSuggestions: 'Mencari…',
  noSuggestions: { mention: 'Orang tidak ditemukan', command: 'Perintah tidak ditemukan', emoji: 'Emoji tidak ditemukan' },
  attachmentItems: { gallery: 'Galeri', camera: 'Kamera', file: 'File', location: 'Lokasi', contact: 'Kontak', poll: 'Polling', music: 'Musik' },
};

const MAIL_COMPOSE_MESSAGES: Translations['MAIL_COMPOSE_MESSAGES'] = {
  to: 'Kepada',
  cc: 'Cc',
  bcc: 'Bcc',
  subject: 'Subjek',
  showCopies: 'Cc Bcc',
  hideCopies: 'Sembunyikan Cc dan Bcc',
  removeRecipient: (name) => `Hapus ${name}`,
  suggestions: 'Kontak',
  send: COMMON_MESSAGES.send,
  sending: 'Mengirim',
  attach: 'Lampirkan file',
  discard: 'Buang draf',
  minimize: 'Perkecil',
  expand: 'Perluas',
  close: COMMON_MESSAGES.close,
  title: 'Pesan baru',
};

const MEDIA_PLAYER_MESSAGES: Translations['MEDIA_PLAYER_MESSAGES'] = {
  lyrics: 'Lirik',
  queue: 'Antrean',
  devices: 'Hubungkan ke perangkat',
  fullscreen: 'Layar penuh',
  openPlayer: 'Buka pemutar',
  currentDevice: 'Perangkat saat ini',
  listeningOn: 'Mendengarkan di',
  listeningOnDevice: (d) => `Mendengarkan di ${d}`,
  selectDevice: 'Pilih perangkat',
  noDevices: 'Tidak ada perangkat lain yang ditemukan',
  deviceHelp: 'Perangkat Anda tidak terlihat?',
  playbackSpeed: 'Kecepatan pemutaran',
  sleepTimer: 'Timer tidur',
  sleepOff: 'Nonaktif',
  endOfEpisode: 'Akhir episode',
  oneHour: '1 jam',
  minutes: (n) => plural('id', n, { other: '{n} menit' }),
  stopsIn: (r) => `Berhenti dalam ${r}`,
  shuffle: 'Acak',
  repeat: 'Ulangi',
  repeatOne: 'Ulangi satu',
  skipBack: (n) => plural('id', n, { other: 'Mundur {n} detik' }),
  skipForward: (n) => plural('id', n, { other: 'Maju {n} detik' }),
  closePlayer: 'Tutup pemutar',
  share: 'Bagikan',
  showLyrics: 'Tampilkan lirik',
};

const ADDRESS_MESSAGES: Translations['ADDRESS_MESSAGES'] = { emptyTitle: 'Belum ada apa pun di sini', addresses: 'Alamat' };

const CREATOR_STUDIO_MESSAGES: Translations['CREATOR_STUDIO_MESSAGES'] = {
  releaseTypes: { single: 'Singel', ep: 'EP', album: 'Album' },
  releaseStatuses: {
    draft: 'Draf',
    'in-review': 'Sedang ditinjau',
    scheduled: 'Terjadwal',
    live: 'Tayang',
    rejected: 'Ditolak',
    takedown: 'Diturunkan',
  },
  creditRoles: {
    songwriter: 'Penulis lagu',
    producer: 'Produser',
    composer: 'Komposer',
    performer: 'Penampil',
    lyricist: 'Penulis lirik',
    'mixing-engineer': 'Teknisi mixing',
    'mastering-engineer': 'Teknisi mastering',
  },
  periods: { '7d': '7 hari', '28d': '28 hari', '12m': '12 bulan', all: 'Sepanjang waktu' },
  artworkNotSquare: (w, h) => `Sampul harus persegi — gambar ini berukuran ${w}×${h} px.`,
  artworkTooSmall: (w, h, min) => `Sampul terlalu kecil (${w}×${h} px). Unggah minimal ${min}×${min} px.`,
  audience: { title: 'Audiens', period: 'Periode' },
  breakdown: {
    locations: 'Lokasi teratas',
    cities: 'Kota',
    countries: 'Negara',
    age: 'Usia',
    gender: 'Jenis kelamin',
    sources: 'Sumber dengar',
    metric: 'Pendengar',
  },
  streams: {
    metrics: 'Metrik grafik',
    summary: (metric, releases) =>
      releases ? `${metric} dari waktu ke waktu; rilisan: ${releases}` : `${metric} dari waktu ke waktu`,
  },
  topTracks: {
    title: 'Lagu teratas',
    rank: '#',
    rankName: 'Peringkat',
    track: 'Lagu',
    streams: 'Putaran',
    listeners: 'Pendengar',
    saves: 'Simpanan',
    trend: 'Tren',
    trends: { up: 'Naik', down: 'Turun', flat: 'Stabil', new: 'Entri baru' },
    newBadge: 'Baru',
    empty: 'Belum ada putaran di periode ini.',
  },
  tracks: (n) => plural('id', n, { other: '{n} lagu' }),
  timeline: {
    states: { complete: 'selesai', current: 'sedang berjalan', upcoming: 'belum dimulai', error: 'perlu perhatian' },
    label: 'Progres rilisan',
  },
  upload: {
    queued: 'Dalam antrean',
    processing: 'Mentranskode…',
    ready: 'Siap',
    failed: 'Unggahan gagal',
    remove: (name) => `Keluarkan ${name}`,
    progress: (name) => `Mengunggah ${name}`,
  },
  artwork: {
    title: 'Sampul',
    requirements: '3000×3000 px, JPG atau PNG',
    replace: 'Ganti',
    remove: 'Keluarkan sampul',
    preview: 'Sampul rilisan',
    upload: 'Unggah sampul',
  },
  credits: {
    title: 'Kredit',
    role: 'Peran',
    name: 'Nama',
    add: 'Tambah kredit',
    remove: (index, name) => (name ? `Keluarkan kredit ${index + 1}, ${name}` : `Keluarkan kredit ${index + 1}`),
    empty: 'Cantumkan penulis lagu, produser, dan penampil di lagu ini.',
    field: (field, n) => `${field}, kredit ${n}`,
  },
  artists: {
    add: 'Tambah',
    addTo: (label) => `Tambah ke ${label}`,
    remove: (name) => `Keluarkan ${name}`,
  },
  isrc: { hint: 'Format: CC-XXX-YY-NNNNN', invalid: 'Itu bukan ISRC yang valid' },
  metadata: {
    title: 'Judul lagu',
    version: 'Versi',
    versionPlaceholder: 'Remix, live, akustik…',
    explicit: 'Lirik eksplisit',
    explicitDescription: 'Aktifkan jika lagu berisi bahasa kasar atau tema eksplisit.',
    genre: 'Genre',
    genrePlaceholder: 'Pilih genre',
    primaryArtists: 'Artis utama',
    featuredArtists: 'Artis tamu',
    artistPlaceholder: 'Tambahkan nama artis',
    language: 'Bahasa lirik',
    languagePlaceholder: 'Pilih bahasa',
    lyrics: 'Lirik',
    lyricsPlaceholder: 'Tempel lirik, satu baris per baris yang dinyanyikan',
  },
  payout: {
    estimated: 'Perkiraan pendapatan bulan ini',
    lastPayout: 'Pembayaran terakhir',
    nextPayout: 'Pembayaran berikutnya',
    statements: 'Lihat laporan',
    chart: 'Pendapatan bulanan',
  },
  pitch: {
    title: 'Ajukan ke editor',
    description: 'Ceritakan rilisan berikutnya kepada tim editorial sebelum dirilis.',
    release: 'Rilisan',
    releasePlaceholder: 'Pilih rilisan mendatang',
    moods: 'Suasana',
    genres: 'Genre',
    pitch: 'Pengajuan Anda',
    pitchPlaceholder: 'Apa yang membuat rilisan ini menonjol? Untuk siapa, dan apa kisah di baliknya?',
    submit: 'Kirim pengajuan',
    tagLimit: (max) => `Pilih hingga ${max}`,
    statuses: { submitted: 'Pengajuan terkirim', accepted: 'Dipilih untuk ditinjau', declined: 'Belum terpilih kali ini' },
    statusDescriptions: {
      submitted: 'Editor membaca setiap pengajuan. Anda akan mendapat kabar sebelum tanggal rilis.',
      accepted: 'Rilisan Anda sedang dipertimbangkan untuk playlist editorial.',
      declined: 'Rilisan ini tidak terpilih. Anda bisa mengajukan rilisan berikutnya begitu dijadwalkan.',
    },
    edit: 'Edit pengajuan',
  },
};

const PROPERTY_INSIGHTS_MESSAGES: Translations['PROPERTY_INSIGHTS_MESSAGES'] = {
  energy: 'Energi',
  pending: 'Tertunda',
  energyRatingClass: (r) => `Peringkat energi ${r}`,
  energyRatingStatus: (s) => `Peringkat energi ${String(s).toLowerCase()}`,
  energyRating: 'Peringkat energi',
  certificateInProgress: 'Sertifikat sedang diproses',
  consumption: 'Konsumsi',
  emissions: 'Emisi',
  moreEfficient: 'Lebih efisien',
  lessEfficient: 'Kurang efisien',
  walkTime: (t) => `${t} jalan kaki`,
  scoreOutOf: (d, m) => `${d} dari ${m}`,
  pricePerSquareMetre: 'Harga per meter persegi',
  rentHistory: 'Riwayat sewa',
  rentHistoryEmpty: 'Belum ada riwayat untuk rumah ini',
  confidence: { low: 'Keyakinan rendah', medium: 'Keyakinan sedang', high: 'Keyakinan tinggi' },
  aboveEstimate: (p) => `${p} di atas perkiraan`,
  belowEstimate: (p) => `${p} di bawah perkiraan`,
  fairPrice: 'Harga wajar',
  estimatedPrice: 'Perkiraan harga',
  asking: 'Harga yang diminta',
  noVerdict: 'Data tidak cukup untuk penilaian',
  whyThisEstimate: 'Mengapa perkiraan ini',
  comparables: (n) => plural('id', n, { other: 'Berdasarkan {n} rumah pembanding' }),
  currentPrice: 'Harga saat ini',
  now: 'Sekarang',
  noPriceHistory: 'Belum ada riwayat harga',
  priceHistoryPeriod: 'Periode riwayat harga',
  priceHistory: 'Riwayat harga',
  priceHistoryTrend: (head, a, aw, b, bw) => `${head}: dari ${a} (${aw}) menjadi ${b} (${bw}).`,
};

const MAP_MARKER_MESSAGES: Translations['MAP_MARKER_MESSAGES'] = {
  searchAsMapMoves: 'Cari saat saya menggeser peta',
  searchThisArea: 'Cari di area ini',
  stays: (n) => mapMarker_countOf('id', n, { other: '{n} penginapan' }),
};

const LISTING_ACTIONS_MESSAGES: Translations['LISTING_ACTIONS_MESSAGES'] = {
  month: 'bulan',
  rentalStatus: { available: 'Tersedia', reserved: 'Dipesan', rented: 'Tersewa' },
  rentalStatusMessage: {
    reserved: 'Pelamar lain sedang menyelesaikan kontrak. Kunjungan baru dijeda.',
    rented: 'Rumah ini sudah tersewa dan tidak lagi menerima permintaan.',
  },
  saleStatus: { available: 'Dijual', reserved: 'Dipesan', sold: 'Terjual' },
  saleStatusMessage: {
    reserved: 'Sebuah penawaran telah diterima. Agen belum mengatur kunjungan untuk saat ini.',
    sold: 'Rumah ini sudah terjual.',
  },
  requestViewing: 'Minta kunjungan',
  apply: 'Ajukan permohonan',
  contactAgent: 'Hubungi agen',
  requestVisit: 'Minta kunjungan',
  makeOffer: 'Ajukan penawaran',
  yourHome: 'Rumah Anda',
  theirHome: 'Rumah mereka',
  dates: 'Tanggal',
  guests: 'Tamu',
  addDates: 'Tambahkan tanggal',
  addGuests: 'Tambahkan tamu',
  proposeSwap: 'Usulkan tukar rumah',
  exchangeModes: { swap: 'Tukar timbal balik', host: 'Poin tamu', both: 'Keduanya' },
  scheduleViewing: 'Jadwalkan kunjungan',
  noTimesLeft: 'Tidak ada waktu tersisa pada hari ini',
  noteForLandlord: 'Catatan untuk pemilik',
  day: 'Hari',
  time: 'Waktu',
  submitViewing: 'Minta kunjungan',
  inPerson: 'Langsung',
  videoCall: 'Panggilan video',
  viewingType: 'Jenis kunjungan',
  yourApplication: 'Permohonan Anda',
  applicationProgress: 'Kemajuan permohonan',
  progressReady: (done, total) => `${done} dari ${total} siap`,
  applicationStatus: { missing: 'Belum ada', uploaded: 'Sedang ditinjau', verified: 'Terverifikasi', rejected: 'Ditolak' },
  applicationAction: { upload: 'Unggah', view: 'Lihat', replace: 'Ganti' },
  itemAction: (action, title) => `${action} ${title}`,
  mortgage: {
    title: 'Kalkulator KPR',
    price: 'Harga properti',
    downPayment: 'Uang muka',
    downPaymentPercent: 'Persentase uang muka',
    percent: 'Persen',
    term: 'Jangka waktu pinjaman',
    years: 'tahun',
    rate: 'Suku bunga',
    monthlyPayment: 'Cicilan bulanan',
    principal: 'Pokok',
    interest: 'Bunga',
    loanAmount: 'Jumlah pinjaman',
    totalInterest: 'Total bunga',
    totalCost: 'Total biaya',
  },
  termYears: (n) => `${n} tahun`,
  mortgageDisclaimer:
    'Ini perkiraan, bukan penawaran. Belum termasuk biaya, pajak, dan asuransi, serta mengasumsikan suku bunga tetap selama seluruh jangka waktu.',
};

const AGENT_PROGRESS_MESSAGES: Translations['AGENT_PROGRESS_MESSAGES'] = {
  stepsLeft: (n) => plural('id', n, { other: '{n} langkah lagi' }),
  allCompleted: 'Semua langkah selesai',
  minimize: 'Ciutkan langkah',
  expand: 'Luaskan langkah',
  defaultSteps: [
    'Baca file proyek',
    'Perbarui dan pasang token mode terang',
    'Terapkan token mode gelap',
    'Tambahkan pengalih tema terdaftar yang dapat dipakai ulang',
    'Jalankan registry, lint, dan build produksi',
  ],
};

const CALENDAR_MESSAGES: Translations['CALENDAR_MESSAGES'] = {
  newEvent: 'Acara baru',
  openNavigation: 'Buka navigasi',
  month: 'Bulan',
  moreEvents: (n) => plural('id', n, { other: '+{n} lainnya' }),
  eventDetails: 'Detail acara',
  join: 'Gabung',
  editTimeZone: 'Edit zona waktu',
  participants: 'Peserta',
  editParticipants: 'Edit peserta',
  reminders: 'Pengingat',
  editReminders: 'Edit pengingat',
  duration: calendar_compactDuration(' j', ' mnt', ' '),
  jumpToDate: 'Lompat ke tanggal',
  previousMonth: 'Bulan sebelumnya',
  nextMonth: 'Bulan berikutnya',
  chooseDate: (month) => `${month}, pilih tanggal`,
  inbox: 'Kotak masuk',
  inboxMenu: 'Menu kotak masuk',
  addAccount: 'Tambah akun baru',
};

const LISTING_DETAILS_MESSAGES: Translations['LISTING_DETAILS_MESSAGES'] = {
  ratedOutOf5: (r) => `Rating ${r} dari 5`,
  overallRating: 'Rating keseluruhan',
  unavailable: 'Tidak tersedia',
  showAllAmenities: (n) => plural('id', n, { other: 'Tampilkan semua {n} fasilitas' }),
  showAllFeatures: (n) => plural('id', n, { other: 'Tampilkan semua {n} fitur' }),
  propertyFeatures: 'Fitur properti',
  showAllPhotos: 'Tampilkan semua foto',
  listingPhotos: 'Foto iklan',
  photoOf: (p, t) => `Foto ${p} dari ${t}`,
  photoWithAlt: (a, p, t) => `${a}, foto ${p} dari ${t}`,
  floorPlanOf: (a, p, t) => `${a}, denah ${p} dari ${t}`,
  landlord: 'Pemilik',
  agent: 'Agen',
  agency: 'Agensi',
  activeListings: (n) => plural('id', n, { other: '{n} iklan aktif' }),
  verified: 'Terverifikasi',
  showPhone: 'Tampilkan telepon',
  call: 'Telepon',
  messageHost: 'Kirim pesan ke tuan rumah',
  message: 'Kirim pesan',
};

const PRICE_BREAKDOWN_MESSAGES: Translations['PRICE_BREAKDOWN_MESSAGES'] = {
  states: { estimated: 'Perkiraan', pending: 'Tertunda' },
  showDetails: 'Tampilkan rincian harga',
  hideDetails: 'Sembunyikan rincian harga',
  breakdown: 'Rincian harga',
  about: (label) => `Tentang ${label}`,
};

const DATE_PICKER_MESSAGES: Translations['DATE_PICKER_MESSAGES'] = {
  cancel: 'Batal',
  apply: 'Terapkan',
  previousMonth: 'Bulan sebelumnya',
  nextMonth: 'Bulan berikutnya',
  datePlaceholder: 'Pilih tanggal',
  dateLabel: 'Tanggal',
  rangePlaceholder: 'Pilih rentang tanggal',
  rangeLabel: 'Rentang tanggal',
  startDate: 'Tanggal mulai',
  endDate: 'Tanggal selesai',
  daysSelected: (n) => plural('id', n, { other: '{n} hari dipilih' }),
  presets: {
    today: 'Hari ini',
    yesterday: 'Kemarin',
    lastWeek: 'Minggu lalu',
    thisMonth: 'Bulan ini',
    lastMonth: 'Bulan lalu',
    thisYear: 'Tahun ini',
    lastYear: 'Tahun lalu',
    allTime: 'Sepanjang waktu',
  },
  meetingTrigger: 'Jadwalkan rapat',
  meetingLabel: 'Jadwalkan rapat',
  send: 'Kirim undangan',
  selectTime: 'Pilih waktu',
  duration: (n) => plural('id', n, { other: '{n} menit' }),
};

const SHIPMENT_REQUEST_MESSAGES: Translations['SHIPMENT_REQUEST_MESSAGES'] = {
  kinds: {
    envelope: { label: 'Amplop', description: 'Dokumen, kunci, apa pun yang pipih.' },
    parcel: { label: 'Paket', description: 'Kotak atau tas yang bisa dibawa satu orang.' },
    furniture: { label: 'Furnitur', description: 'Sofa, meja, kasur — dua orang di tiap ujung.' },
    pallet: { label: 'Palet', description: 'Dibungkus dan ditumpuk, dipindahkan dengan tail lift.' },
    food: { label: 'Makanan', description: 'Antaran restoran, dijaga suhunya.' },
  },
  sizes: {
    small: 'Hingga sebesar kotak sepatu — 35 × 25 × 20 cm.',
    medium: 'Hingga sebesar koper kabin — 55 × 40 × 25 cm.',
    large: 'Hingga sebesar mesin cuci — 85 × 60 × 60 cm.',
    extraLarge: 'Lebih besar — ceritakan di catatan.',
  },
  access: { ground: 'Lantai dasar', stairs: 'Tangga', lift: 'Lift' },
  load: {
    kind: 'Apa yang kita angkut?',
    size: 'Ukuran',
    weight: 'Berat',
    quantity: 'Jumlah',
    quantityValue: (n) => `${n} barang`,
    notes: 'Ada hal lain yang perlu diketahui kurir?',
    notesPlaceholder: 'Mudah pecah, kode lift, di mana meninggalkannya…',
  },
  options: { extras: 'Tambahan', access: 'Akses di kedua alamat', window: 'Kapan harus dijemput?' },
  form: {
    route: 'Rute',
    routeDescription: 'Penjemputan dulu, pengantaran terakhir.',
    load: 'Muatan',
    photos: 'Foto',
    photosDescription: 'Foto muatan adalah hal terpenting agar penawaran yang kamu terima lebih tepat.',
    options: 'Opsi',
    optionsDescription: 'Masing-masing mengubah harga.',
    price: 'Harga',
  },
  shipmentRequest: 'Permintaan pengiriman',
};

const LABEL_MESSAGES: Translations['LABEL_MESSAGES'] = { required: 'wajib diisi' };

const CHECKOUT_SUMMARY_MESSAGES: Translations['CHECKOUT_SUMMARY_MESSAGES'] = {
  title: 'Tinjau pesananmu',
  orderSummary: 'Ringkasan pesanan',
  deliverTo: 'Kirim ke',
  notChosen: 'Belum dipilih',
  opensPicker: 'Membuka pemilih',
  placeOrder: 'Buat pesanan',
  placingOrder: 'Memproses pesananmu',
};

const VEHICLE_PICKER_MESSAGES: Translations['VEHICLE_PICKER_MESSAGES'] = {
  from: 'Mulai',
  fits: (label) => `Yang muat di ${label}`,
  unavailable: 'Tidak tersedia untuk muatan ini',
  vehicle: 'Kendaraan',
  vehicles: {
    bike: { label: 'Sepeda kargo', capacity: 'Hingga 25 kg · 60 × 40 × 40 cm', fits: ['Dokumen', 'Pesanan makanan', 'Kotak kecil'] },
    car: { label: 'Mobil', capacity: 'Hingga 150 kg · 100 × 80 × 60 cm', fits: ['Dua koper', 'Empat kardus', 'Sepeda'] },
    van: { label: 'Van', capacity: 'Hingga 800 kg · 240 × 150 × 140 cm', fits: ['Sofa', 'Pindahan studio', 'Setengah palet'] },
    boxTruck: { label: 'Truk boks', capacity: 'Hingga 3.500 kg · 420 × 200 × 210 cm', fits: ['Dua palet', 'Pindahan rumah dua kamar', 'Tail lift'] },
    refrigerated: { label: 'Van berpendingin', capacity: 'Hingga 700 kg · suhu 2–8 °C', fits: ['Produk segar', 'Katering dingin', 'Bunga'] },
  },
};

const COMPOSER_PANEL_MESSAGES: Translations['COMPOSER_PANEL_MESSAGES'] = {
  message: 'Pesan',
  add: 'Tambahkan lampiran',
  addMenu: 'Tambahkan ke chat',
  permissions: 'Izin',
  permissionMode: 'Mode izin',
  learnMore: 'Pelajari lebih lanjut',
  voice: 'Input suara',
  send: 'Kirim pesan',
  stop: 'Hentikan pembuatan',
  permissionTrigger: (mode) => `Izin: ${mode}`,
  removeFile: (name) => `Hapus ${name}`,
  retryFile: (name) => `Coba lagi ${name}`,
  panelPlaceholder: 'Hai, apa yang kamu butuhkan hari ini?',
  pillPlaceholder: 'Tanyakan apa saja',
  pillCompactPlaceholder: 'Tanya saya',
  modelSettings: 'Setelan model',
  models: 'Model',
  modelGroup: 'Model',
  effort: 'Upaya',
  effortAuto: 'Otomatis',
  faster: 'Lebih cepat',
  smarter: 'Lebih cerdas',
  quickSearch: 'Pencarian Cepat',
  searchModels: 'Cari model',
  closeSearch: 'Tutup pencarian',
  noMatches: 'Tidak ada model yang cocok',
  providers: 'Penyedia',
  matchingModels: 'Model yang cocok',
  providerModels: (provider) => `Model ${provider}`,
  localFolders: 'Folder Lokal',
  context: (percent) => `Konteks ${percent}%`,
  effortLevels: ['Rendah', 'Sedang', 'Seimbang', 'Tinggi', 'Sangat tinggi', 'Maksimum'],
  permissionModes: {
    auto: { label: 'Otomatis', description: 'Agen memutuskan sendiri' },
    manual: { label: 'Manual', description: 'Selalu tanya sebelum membuat perubahan' },
    plan: { label: 'Mode rencana', description: 'Buat rencana sebelum melanjutkan' },
    bypass: { label: 'Lewati semua', description: 'Agen menangani keputusan izin' },
  },
  addMenuRows: {
    add: 'Tambah',
    plugins: 'Plugin',
    files: 'File dan folder',
    goal: 'Tujuan',
    goalDescription: 'Tetapkan tujuan untuk hasil lebih cepat',
    plan: 'Mode rencana',
    planDescription: 'Kelola tugas kompleks',
    documents: 'Dokumen',
    documentsDescription: 'Buat dan edit dokumen',
    spreadsheets: 'Spreadsheet',
    spreadsheetsDescription: 'Buat spreadsheet',
    presentations: 'Presentasi',
    presentationsDescription: 'Buat materi pemasaran',
    code: 'Blok kode',
    codeDescription: 'Tulis dan edit kode yang ada',
  },
};

const MESSAGE_BUBBLE_MESSAGES: Translations['MESSAGE_BUBBLE_MESSAGES'] = {
  forwardedFrom: (name) => `Diteruskan dari ${name}`,
  deleted: 'Pesan ini telah dihapus',
  retry: 'Coba kirim lagi',
  addReaction: 'Tambahkan reaksi',
  replyTo: 'Buka pesan yang dikutip',
  selected: 'Dipilih',
  pending: 'Mengirim',
  failed: 'Tidak terkirim',
  reactionSelected: 'dipilih',
  unread: 'Pesan belum dibaca',
  typing: 'Mengetik…',
};

const PAYMENT_STATUS_MESSAGES: Translations['PAYMENT_STATUS_MESSAGES'] = {
  states: { authorising: 'Mengotorisasi', paid: 'Lunas', failed: 'Pembayaran gagal', refunded: 'Dikembalikan', pending: 'Pembayaran tertunda' },
  reference: 'Referensi',
};

const AVATAR_MESSAGES: Translations['AVATAR_MESSAGES'] = { live: 'LIVE' };

const PLACE_CARD_MESSAGES: Translations['PLACE_CARD_MESSAGES'] = {
  openStates: {
    open: 'Buka',
    'closing-soon': 'Segera tutup',
    closed: 'Tutup',
    'opening-soon': 'Segera buka',
  },
  new: 'Baru',
  actions: 'Tindakan',
  actionsFor: (name) => `Tindakan untuk ${name}`,
  rated: (value, reviews) =>
    placeCard_withReviews(
      `Rating ${value} dari 5`,
      reviews === undefined ? undefined : placeCard_countOf('id', reviews, { other: '{n} ulasan' }),
    ),
};

const SOCIAL_BUTTON_MESSAGES: Translations['SOCIAL_BUTTON_MESSAGES'] = { actions: { continue: (b) => `Lanjutkan dengan ${b}`, signIn: (b) => `Masuk dengan ${b}`, signUp: (b) => `Daftar dengan ${b}` } };

const QUESTIONNAIRE_MESSAGES: Translations['QUESTIONNAIRE_MESSAGES'] = { other: 'Lainnya', otherPlaceholder: 'Tulis jawabanmu di sini', steps: 'Langkah', step: (n) => `Langkah ${n}` };

const MAP_CONTROLS_MESSAGES: Translations['MAP_CONTROLS_MESSAGES'] = {
  group: 'Kontrol peta',
  locate: 'Tampilkan lokasi saya',
  following: 'Berhenti mengikuti lokasi saya',
  zoomIn: 'Perbesar',
  zoomOut: 'Perkecil',
  zoom: 'Zoom',
  tilt: 'Miringkan peta',
  tiltOff: 'Ratakan peta',
  compass: (degrees) => `Menghadap ${degrees} derajat. Atur ulang ke utara`,
  layerTrigger: 'Lapisan peta',
  layers: 'Peta',
  overlays: 'Overlay',
};

const PAYMENT_METHOD_MESSAGES: Translations['PAYMENT_METHOD_MESSAGES'] = { states: { expired: 'Kedaluwarsa', declined: 'Ditolak' }, default: 'Utama', add: 'Tambah metode pembayaran', emptyTitle: 'Belum ada metode pembayaran tersimpan', paymentMethods: 'Metode pembayaran' };

const AVATAR_GROUP_MESSAGES: Translations['AVATAR_GROUP_MESSAGES'] = { more: (n) => `${n} orang lainnya`, profile: 'Profil' };

const MENUBAR_MESSAGES: Translations['MENUBAR_MESSAGES'] = {
  menuBar: 'Bilah menu',
};

const AGENT_THINKING_MESSAGES: Translations['AGENT_THINKING_MESSAGES'] = { thinking: 'Berpikir' };

const AI_CHAT_MESSAGES: Translations['AI_CHAT_MESSAGES'] = {
  feedback: { like: 'Respons bagus', dislike: 'Respons buruk', copy: 'Salin respons', copied: 'Disalin!' },
  imageGeneration: {
    generated: 'Gambar dibuat',
    generating: 'Membuat gambar',
    remaining: (n) => plural('id', n, { other: '{n} detik lagi' }),
    likeToast: 'Terima kasih atas masukannya',
    dislikeToast: 'Terima kasih — kami akan memakainya untuk perbaikan',
  },
  generatedImage: (alt) => `Gambar yang dibuat: ${alt}`,
  codePanel: {
    changes: 'Perubahan',
    browser: 'Browser',
    uncommitted: (n) => plural('id', n, { other: '{n} perubahan belum di-commit' }),
    undo: 'Batalkan perubahan',
    browserPreview: 'Pratinjau browser',
  },
  galleryPanel: {
    gallery: 'Galeri',
    styles: 'Gaya',
    stylePresets: 'Preset gaya',
    enlarge: (prompt) => `Perbesar ${prompt}`,
    minimize: (prompt) => `Perkecil ${prompt}`,
    download: (prompt) => `Unduh ${prompt}`,
  },
  panelView: 'Tampilan panel',
  openTerminal: 'Buka terminal',
  newGeneration: 'Buat baru',
  expandPanel: 'Perluas panel',
  togglePanel: 'Tampilkan/sembunyikan panel',
  container: { breadcrumb: 'Lokasi chat', share: 'Bagikan chat' },
  shell: {
    openNavigation: 'Buka navigasi',
    closeNavigation: 'Tutup navigasi',
    openPanel: (panel) => `Buka ${String(panel).toLowerCase()}`,
    closePanel: (panel) => `Tutup ${String(panel).toLowerCase()}`,
  },
  code: 'Kode',
};

const COMMAND_MESSAGES: Translations['COMMAND_MESSAGES'] = {
  placeholder: 'Ketik perintah atau cari…',
  empty: 'Tidak ada hasil yang ditemukan.',
  palette: 'Palet perintah',
  clearSearch: 'Hapus pencarian',
};

const MUSIC_LIBRARY_MESSAGES: Translations['MUSIC_LIBRARY_MESSAGES'] = {
  kinds: {
    playlist: 'Playlist',
    artist: 'Artis',
    album: 'Album',
    podcast: 'Podcast',
    audiobook: 'Buku audio',
    folder: 'Folder',
  },
  library: {
    title: 'Koleksi Kamu',
    create: 'Buat playlist atau folder',
    collapseRail: 'Ciutkan Koleksi Kamu',
    expandRail: 'Buka Koleksi Kamu',
    filters: 'Filter',
    clearFilters: 'Hapus filter',
    filter: {
      playlists: 'Playlist',
      artists: 'Artis',
      albums: 'Album',
      podcasts: 'Podcast',
      audiobooks: 'Buku audio',
    },
    downloaded: 'Diunduh',
    search: 'Cari di Koleksi Kamu',
    searchPlaceholder: 'Cari di Koleksi Kamu',
    clearSearch: 'Hapus pencarian',
    sortAndView: 'Urutkan dan tampilan',
    sortBy: 'Urutkan menurut',
    viewAs: 'Tampilkan sebagai',
    sort: {
      recents: 'Terbaru',
      'recently-added': 'Baru ditambahkan',
      alphabetical: 'Menurut abjad',
      creator: 'Pembuat',
    },
    view: { compact: 'Ringkas', list: 'Daftar', grid: 'Kisi' },
    empty: 'Belum ada apa-apa di sini',
  },
  item: { pinned: 'Disematkan', downloaded: 'Diunduh', nowPlaying: 'Sedang diputar' },
  search: { placeholder: 'Mau dengar apa?', clear: 'Hapus pencarian', browse: 'Jelajahi' },
  resultTypes: 'Jenis hasil',
  topResultKinds: {
    song: 'Lagu',
    artist: 'Artis',
    album: 'Album',
    playlist: 'Playlist',
    podcast: 'Podcast',
    episode: 'Episode',
    audiobook: 'Buku audio',
    profile: 'Profil',
  },
  recent: {
    title: 'Pencarian terbaru',
    clearAll: 'Hapus pencarian terbaru',
    remove: (title) => `Keluarkan ${title}`,
  },
};

const LISTING_CARD_MESSAGES: Translations['LISTING_CARD_MESSAGES'] = {
  statuses: { reserved: 'Dipesan', sold: 'Terjual', rented: 'Tersewa', unavailable: 'Tidak tersedia' },
  originally: (p) => `semula ${p}`,
  approximateLocation: 'Perkiraan lokasi',
  rated: (r) => `Rating ${r} dari 5`,
  ratedWithReviews: (r, c) =>
    plural('id', c, { other: `Rating ${r} dari 5, ${c} ulasan` }),
  newListing: 'Baru',
  previousPhoto: 'Foto sebelumnya',
  nextPhoto: 'Foto berikutnya',
  saveToWishlist: 'Simpan ke wishlist',
  removeFromWishlist: 'Hapus dari wishlist',
};

const NAVIGATION_BANNER_MESSAGES: Translations['NAVIGATION_BANNER_MESSAGES'] = {
  states: { 'off-route': 'Keluar dari rute', rerouting: 'Mencari rute baru' },
  thenLine: (street, maneuver) => navigationBanner_words('lalu', navigationBanner_midSentence(maneuver, 'id'), street),
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
};

const LOCATION_PUCK_MESSAGES: Translations['LOCATION_PUCK_MESSAGES'] = {
  states: { locating: 'Mencari lokasi Anda', located: 'Lokasi Anda', stale: 'Lokasi terakhir Anda yang diketahui' },
  facing: (state, degrees) => `${state}, menghadap ${degrees} derajat`,
};

const CAROUSEL_MESSAGES: Translations['CAROUSEL_MESSAGES'] = {
  previousSlide: 'Slide sebelumnya',
  nextSlide: 'Slide berikutnya',
  goToSlide: (n) => `Buka slide ${n}`,
  slideOf: (at, of) => `${at} dari ${of}`,
  carouselRole: 'korsel',
  slideRole: 'slide',
};

const ORDER_STATUS_MESSAGES: Translations['ORDER_STATUS_MESSAGES'] = { states: { current: 'Sedang berlangsung', upcoming: 'Belum', failed: 'Gagal' }, status: 'Status' };

const RATING_MESSAGES: Translations['RATING_MESSAGES'] = {
  newRating: 'Baru',
  reviews: (c) => rating_countForms('id', c, { other: '{n} ulasan' }),
  rated: (v) => `Rating ${v} dari 5`,
  ratedWithReviews: (v, r) => `Rating ${v} dari 5, ${r}`,
  star: (n) => plural('id', n, { other: '{n} bintang' }),
};

const LISTING_EDITOR_MESSAGES: Translations['LISTING_EDITOR_MESSAGES'] = {
  offering: {
    rent: { title: 'Disewakan', description: 'Sewa jangka panjang, harga per bulan.' },
    sale: { title: 'Dijual', description: 'Jual rumah sepenuhnya.' },
    stay: { title: 'Sewa liburan', description: 'Menginap singkat, harga per malam.' },
    swap: { title: 'Tukar rumah', description: 'Bertukar rumah dengan anggota lain.' },
    monthlyRent: 'Sewa bulanan',
    deposit: 'Deposit',
    depositOption: (months) => (months === 0 ? 'Tidak ada' : plural('id', months, { other: '{n} bulan' })),
    availableFrom: 'Tersedia mulai',
    minimumStay: 'Masa sewa minimum',
    months: (months) => plural('id', months, { other: '{n} bulan' }),
    askingPrice: 'Harga yang diminta',
    pricePerArea: 'Harga per m²',
    pricePerAreaEmpty: 'Tambahkan harga',
    nightlyRate: 'Tarif per malam',
    cleaningFee: 'Biaya kebersihan',
    minimumNights: 'Malam minimum',
    nights: (nights) => plural('id', nights, { other: '{n} malam' }),
    swapMode: 'Bagaimana Anda ingin bertukar?',
    swapModes: { swap: 'Tukar rumah', host: 'Hanya menjadi tuan rumah', both: 'Keduanya' },
    group: 'Bagaimana rumah ini ditawarkan?',
  },
  propertyTypes: {
    apartment: 'Apartemen',
    house: 'Rumah',
    room: 'Kamar',
    studio: 'Studio',
    duplex: 'Dupleks',
    penthouse: 'Penthouse',
    coliving: 'Co-living',
    hostel: 'Hostel',
    other: 'Lainnya',
  },
  propertyType: 'Jenis properti',
  addressPrecision: {
    exact: {
      title: 'Alamat persis',
      description: 'Penanda berada di gedung. Paling cocok untuk rumah yang memang mudah ditemukan.',
    },
    street: {
      title: 'Hanya jalan',
      description: 'Menampilkan jalan, bukan nomornya. Alamat persis dibagikan setelah pemesanan atau penandatanganan.',
    },
    approximate: {
      title: 'Area perkiraan',
      description: 'Menampilkan lingkaran sekitar 500 m. Opsi paling privat.',
    },
  },
  addressPrecisionLabel: 'Ketepatan alamat',
  addressPrecisionFootnote:
    'Peta yang dipublikasikan mengikuti pilihan ini. Alamat persis Anda hanya dibagikan kepada orang yang Anda konfirmasi.',
  qualityTitle: 'Kualitas listing',
  qualityScore: 'Skor kualitas listing',
  tips: 'Tips',
  todo: 'Belum selesai',
  needsWork: 'Perlu diperbaiki',
  good: 'Baik',
  excellent: 'Sangat baik',
  previewTitle: 'Pratinjau',
  previewDescription: 'Beginilah tamu akan melihat listing Anda.',
  card: 'Kartu',
  page: 'Halaman',
  previewAs: 'Pratinjau sebagai',
  reviews: (n, shown) => plural('id', n, { other: '{s} ulasan' }).replace('{s}', shown),
};

const MEDIA_HEADER_MESSAGES: Translations['MEDIA_HEADER_MESSAGES'] = {
  artistPick: 'Pilihan artis',
  saveEpisode: 'Simpan episode',
  share: 'Bagikan',
  podcastEpisode: 'Episode podcast',
  listeningProgress: 'Progres mendengarkan',
  shuffle: 'Acak',
  download: 'Unduh',
  downloadProgress: 'Progres unduhan',
  follow: 'Ikuti',
  following: 'Mengikuti',
  searchInPlaylist: 'Cari di daftar putar',
  compactView: 'Tampilan ringkas',
  editDetails: 'Edit detail',
  about: 'Tentang',
  discography: 'Diskografi',
  showAll: 'Tampilkan semua',
  albums: 'Album',
  singlesAndEps: 'Single dan EP',
  compilations: 'Kompilasi',
  audiobook: 'Buku audio',
  popular: 'Populer',
  seeMore: 'Lihat lainnya',
  podcast: 'Podcast',
  latestEpisode: 'Episode terbaru',
  verifiedArtist: 'Artis terverifikasi',
  profile: 'Profil',
  editProfile: 'Edit profil',
};

const MENU_ITEM_MESSAGES: Translations['MENU_ITEM_MESSAGES'] = {
  diets: { vegetarian: 'Vegetarian', vegan: 'Vegan', 'gluten-free': 'Bebas gluten', 'dairy-free': 'Bebas susu', halal: 'Halal', kosher: 'Kosher' },
  spicy: 'Pedas',
  spiceOf: (label, level, max) => `${label} ${level} dari ${max}`,
  originally: (price, original) => `${price}, sebelumnya ${original}`,
  inBasket: (n) => `${n} di keranjang`,
  soldOut: 'Habis',
  addItem: (name) => `Tambah ${name}`,
  choose: (n) => `Pilih ${n}`,
  chooseRange: (min, max) => `Pilih ${min} sampai ${max}`,
  upTo: (n) => `Hingga ${n}`,
  optional: 'Opsional',
  quantity: 'Jumlah',
  addToBasket: 'Tambah ke keranjang',
  options: 'Opsi',
};

const PAGINATION_MESSAGES: Translations['PAGINATION_MESSAGES'] = {
  pagination: 'Penomoran halaman',
  goToPage: (page) => `Buka halaman ${page}`,
};

const LEAD_SCORE_MESSAGES: Translations['LEAD_SCORE_MESSAGES'] = { title: 'Skor prospek', factors: 'Komponen skornya', bands: { cold: 'Dingin', warm: 'Hangat', hot: 'Panas' } };

const DIRECTIONS_MESSAGES: Translations['DIRECTIONS_MESSAGES'] = {
  modes: { drive: 'Mobil', transit: 'Transportasi umum', walk: 'Jalan kaki', cycle: 'Sepeda' },
  traffic: { light: 'Lalu lintas lancar', moderate: 'Lalu lintas sedang', heavy: 'Lalu lintas padat' },
  maneuvers: {
    depart: 'Berangkat',
    straight: 'Lurus terus',
    'slight-left': 'Belok sedikit ke kiri',
    left: 'Belok kiri',
    'sharp-left': 'Belok tajam ke kiri',
    'slight-right': 'Belok sedikit ke kanan',
    right: 'Belok kanan',
    'sharp-right': 'Belok tajam ke kanan',
    uturn: 'Putar balik',
    roundabout: 'Di bundaran',
    merge: 'Bergabung',
    arrive: 'Tiba',
    board: 'Naik',
    alight: 'Turun',
    transfer: 'Pindah',
    walk: 'Jalan kaki',
  },
  directions: 'Petunjuk arah',
  otherRoutes: 'Rute lainnya',
  travelMode: 'Moda transportasi',
  start: 'Mulai',
  currentStep: 'Langkah saat ini',
  line: (name) => `Jalur ${name}`,
};

const CART_PANEL_MESSAGES: Translations['CART_PANEL_MESSAGES'] = {
  basket: 'Keranjang',
  checkout: 'Lanjut ke pembayaran',
  emptyTitle: 'Keranjangmu kosong',
  emptyDescription: 'Tambahkan sesuatu dari menu dan akan muncul di sini.',
  soldOut: 'Habis',
  removeItem: (name) => `Hapus ${name}`,
  originally: (price, original) => `${price}, sebelumnya ${original}`,
  promoCode: 'Kode promo',
  apply: 'Terapkan',
  tip: 'Tip',
};

const MEDIA_CARD_MESSAGES: Translations['MEDIA_CARD_MESSAGES'] = {
  albumTypes: { album: 'Album', single: 'Single', ep: 'EP', compilation: 'Kompilasi' },
  artist: 'Artis',
  verified: 'Terverifikasi',
  audiobook: 'Buku audio',
  narratedBy: (n) => `Dinarasikan oleh ${n}`,
  progressOf: (t) => `Progres ${t}`,
  episode: 'Episode',
  played: 'Sudah diputar',
  event: 'Acara',
  soldOut: 'Habis terjual',
  listeningNow: 'Sedang mendengarkan',
  trackBy: (t, a) => `${t} oleh ${a}`,
  mix: 'Mix',
  playlist: 'Daftar putar',
  collaborative: 'Kolaboratif',
  ownedBy: (o) => `Oleh ${o}`,
  podcast: 'Podcast',
  profile: 'Profil',
  followsYou: 'Mengikuti Anda',
  song: 'Lagu',
  share: 'Bagikan',
  listened: 'Sudah didengarkan',
};

const JOB_BOARD_MESSAGES: Translations['JOB_BOARD_MESSAGES'] = {
  labels: {
    take: 'Ambil pekerjaan',
    pass: 'Lewati',
    distance: 'Jarak',
    duration: 'Waktu',
    window: 'Rentang waktu',
    pickup: 'Penjemputan',
    dropoff: 'Pengantaran',
    state: { taken: 'Sudah diambil', expired: 'Kedaluwarsa' },
    showPay: 'Tampilkan bayaran',
    hidePay: 'Sembunyikan bayaran',
    payDetails: 'Bayaran untuk',
    sort: 'Urutkan pekerjaan',
    filtersToggle: 'Filter',
    filtersActive: (n) => `${n} diterapkan`,
    sortOptions: {
      pay: 'Bayaran tertinggi',
      distance: 'Terdekat',
      soonest: 'Mulai paling cepat',
      expiring: 'Segera ditutup',
    },
    filters: { distance: 'Jarak', pay: 'Bayaran', when: 'Kapan', vehicle: 'Kendaraan' },
    clearFilters: 'Hapus filter',
    refresh: 'Muat ulang daftar',
    count: (n) => `${n} pekerjaan`,
    loading: 'Memuat pekerjaan',
  },
  emptyTitle: 'Belum ada pekerjaan saat ini',
  emptyDescription: 'Tidak ada yang cocok dengan pencarian Anda. Perluas filter, atau muat ulang daftar dalam satu menit.',
  list: 'Pekerjaan',
  payDetailsFor: (load) => `Bayaran untuk ${load}`,
  route: (pickup, dropoff) => `${pickup} dan ${dropoff}`,
  bands: {
    anyDistance: 'Jarak berapa pun',
    underKm: (km) => `Kurang dari ${km} km`,
    anyTime: 'Kapan saja',
    withinHour: 'Dalam satu jam',
    nextHours: (hours) => `${hours} jam ke depan`,
    today: 'Hari ini',
  },
};

const FLOATING_MESSAGES: Translations['FLOATING_MESSAGES'] = {
  submenu: 'Sub-menu',
};

const AGENT_CHAT_MESSAGES: Translations['AGENT_CHAT_MESSAGES'] = {
  chat: {
    newChat: 'Obrolan baru',
    emptyTitle: 'Ada yang bisa saya bantu?',
    emptyDescription: 'Obrolan ini berjalan dengan kunci API Anda sendiri. Riwayat tetap tersimpan di browser ini.',
    thinking: 'Berpikir',
    error: 'Terjadi kesalahan. Periksa log server, lalu coba lagi.',
    suggestions: [
      'Jelaskan apa yang dilakukan proyek awal ini',
      'Tulis pembaruan produk dalam tiga kalimat',
      'Beri saya lima nama untuk aplikasi penjadwalan',
    ],
    you: 'Anda',
    assistant: 'Asisten',
  },
  actions: {
    share: 'Bagikan obrolan',
    shared: 'Transkrip disalin',
    more: 'Tindakan lainnya untuk obrolan ini',
    exportChats: 'Ekspor obrolan',
    markUnread: 'Tandai belum dibaca',
    deleteChat: 'Hapus obrolan',
  },
  message: { copy: 'Salin pesan', readAloud: 'Bacakan', stopReading: 'Berhenti membacakan' },
  history: {
    region: 'Riwayat obrolan',
    recent: 'Terbaru',
    empty: 'Obrolan yang Anda mulai akan muncul di sini.',
    rename: 'Ganti nama',
    renameField: 'Ganti nama obrolan',
    markUnread: 'Tandai belum dibaca',
    unread: 'Belum dibaca',
    exportCount: (n) => (n === 0 ? 'Tidak ada obrolan untuk diekspor' : plural('id', n, { other: 'Ekspor {n} obrolan' })),
    accountMenu: (name) => `Menu akun ${name}`,
    usageLeft: 'Sisa penggunaan',
    upgrade: 'Tingkatkan ke Max',
    logOut: 'Keluar',
  },
  composer: {
    field: 'Pesan',
    placeholder: 'Tanyakan apa saja',
    attach: 'Tambahkan lampiran',
    send: 'Kirim pesan',
    stop: 'Hentikan pembuatan',
    notConfigured: 'Belum dikonfigurasi',
    messageCount: (n) => plural('id', n, { other: '{n} pesan' }),
    answeringWith: (model) => `Menjawab dengan ${model}`,
  },
  ago: {
    justNow: 'baru saja',
    minutes: (n) => plural('id', n, { other: '{n} menit lalu' }),
    hours: (n) => plural('id', n, { other: '{n} jam lalu' }),
    days: (n) => plural('id', n, { other: '{n} hari lalu' }),
  },
  age: { now: 'sekarang', minutes: (n) => `${n} mnt`, hours: (n) => `${n} j`, days: (n) => `${n} h` },
};

const WEB_SEARCH_MESSAGES: Translations['WEB_SEARCH_MESSAGES'] = { sources: 'Sumber', working: 'Sedang bekerja' };

const MAIL_THREAD_MESSAGES: Translations['MAIL_THREAD_MESSAGES'] = {
  to: 'Kepada',
  cc: 'Cc',
  bcc: 'Bcc',
  reply: 'Balas',
  replyAll: 'Balas semua',
  forward: 'Teruskan',
  more: COMMON_MESSAGES.more,
  moreAddresses: (n) => `${n} lainnya`,
  earlierMessages: (n) => plural('id', n, { other: '{n} pesan sebelumnya' }),
  showTrimmed: 'Tampilkan konten yang dipangkas',
  hideTrimmed: 'Sembunyikan konten yang dipangkas',
  unread: 'Belum dibaca',
  starred: 'Berbintang',
  star: 'Beri bintang',
  attachments: 'Lampiran',
  attachmentCount: (n) => plural('id', n, { other: '{n} lampiran' }),
  expand: 'Luaskan pesan',
  collapse: 'Ciutkan pesan',
};

const NOTIFICATION_CENTER_MESSAGES: Translations['NOTIFICATION_CENTER_MESSAGES'] = {
  title: 'Notifikasi',
  emptyMessage: 'Semua sudah Anda lihat.',
  emptyDescription: 'Aktivitas baru akan muncul di sini saat tiba.',
  noUnread: 'Tidak ada notifikasi yang belum dibaca',
  unread: (n) => plural('id', n, { other: '{n} belum dibaca' }),
  markAllRead: 'Tandai semua sudah dibaca',
  category: 'Kategori notifikasi',
  tabs: { all: 'Semua', mentions: 'Sebutan', system: 'Sistem' },
  unreadDot: 'Belum dibaca',
};

const CHART_CARDS_MESSAGES: Translations['CHART_CARDS_MESSAGES'] = {
  titles: {
    activity: 'Aktivitas',
    agents: 'Agen',
    visitors: 'Pengunjung',
    breakdown: 'Rincian',
    sessions: 'Sesi',
    contributionsThisYear: 'Kontribusi tahun ini',
    earnedSoFar: 'Pendapatan sejauh ini',
    signUpFunnel: 'Corong pendaftaran',
    activeUsers: 'Pengguna aktif',
    revenue: 'Pendapatan',
    mostActiveDays: 'Hari paling aktif',
    orders: 'Pesanan',
    trackedTime: 'Waktu tercatat',
    revenuePerAccount: 'Pendapatan per akun',
    sleepScore: 'Skor tidur',
    pipeline: 'Pipeline penjualan',
    steps: 'Langkah',
    tokens: 'Token',
  },
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
  stepsSuffix: 'langkah',
  today: 'Hari ini',
  thisYear: 'Tahun ini',
  lastYear: 'Tahun lalu',
  sinceLastYear: 'dibanding tahun lalu',
  aYearEarlier: 'setahun sebelumnya',
  earningsPeriod: 'Periode pendapatan',
  changePeriod: 'Ubah periode',
  period: 'Periode',
  total: 'total',
  average: 'rata-rata',
  thisMonth: 'bulan ini',
  ofGoal: 'dari target',
  totalSteps: 'langkah total',
  gaugeChart: (title, reading) => `Pengukur ${title.toLowerCase()}: ${reading}`,
  halfGaugeChart: (title, items) => `Setengah pengukur ${title.toLowerCase()}: ${items}`,
  radialChart: (title, items) => `Grafik radial ${title.toLowerCase()}: ${items}`,
  percentOfGoal: (pct) => `${pct}% dari target`,
  periodOf: (label) => `Periode ${label.toLowerCase()}`,
  chartVs: (title, current, previous) => `Grafik ${title.toLowerCase()}: ${current.toLowerCase()} dibanding ${previous.toLowerCase()}`,
  lineChart: (title) => `Grafik garis ${title.toLowerCase()}`,
  barChart: (title, items) => `Grafik batang ${title.toLowerCase()}: ${items}`,
  comboChart: (title, bar, line) => `Grafik ${title.toLowerCase()}: batang ${bar} dibanding garis ${line}`,
  scatterChart: (title, series) => `Grafik sebar ${title.toLowerCase()}: ${series}`,
  bubbleChart: (title, series) => `Grafik gelembung ${title.toLowerCase()}: ${series}`,
  ringItem: (label, value, pct) => `${label} ${value}, ${pct}% dari target`,
  scoreOf: (score, max) => `${score} dari ${max}`,
  activityFor: (name, day) => `Aktivitas ${day} ${name}`,
  contributions: (n, date) => { const on = date ? ` pada ${date}` : ''; return n === 0 ? `Tidak ada kontribusi${on}` : `${n} kontribusi${on}`; },
};

const CODE_MESSAGES: Translations['CODE_MESSAGES'] = { copy: 'Salin kode', copied: 'Kode disalin' };

const OUTLINE_NAV_MESSAGES: Translations['OUTLINE_NAV_MESSAGES'] = { outline: 'Di halaman ini', progress: (at, of) => `Judul ${at} dari ${of}` };

const STEPPER_MESSAGES: Translations['STEPPER_MESSAGES'] = { decrease: 'Kurangi', increase: 'Tambah' };

const CALL_UI_MESSAGES: Translations['CALL_UI_MESSAGES'] = {
  status: {
    calling: 'Memanggil…',
    ringing: 'Berdering',
    connecting: 'Menghubungkan…',
    active: 'Terhubung',
    reconnecting: 'Menghubungkan ulang…',
    onHold: 'Ditahan',
    ended: 'Panggilan berakhir',
  },
  controls: {
    mute: 'Bisukan',
    unmute: 'Bunyikan',
    speakerOn: 'Nyalakan speaker',
    speakerOff: 'Matikan speaker',
    videoOn: 'Nyalakan kamera',
    videoOff: 'Matikan kamera',
    flipCamera: 'Balik kamera',
    screenShareOn: 'Bagikan layar',
    screenShareOff: 'Berhenti berbagi layar',
    addParticipant: 'Tambah peserta',
    endCall: 'Akhiri panggilan',
  },
  screen: {
    minimise: 'Perkecil panggilan',
    chat: 'Buka chat',
    participants: 'Peserta',
    movePip: (c) => `Pindahkan tampilan Anda (sekarang ${callUi_corner(CALL_UI_MESSAGES__CORNERS, c)})`,
  },
  pipCorners: CALL_UI_MESSAGES__CORNERS,
  history: {
    incoming: 'Masuk',
    outgoing: 'Keluar',
    missed: 'Tak terjawab',
    declined: 'Ditolak',
    callBack: (name) => `Telepon balik ${name}`,
  },
  incoming: {
    accept: 'Terima',
    decline: 'Tolak',
    message: 'Pesan',
    remind: 'Ingatkan saya',
    slideToAnswer: 'Geser untuk menjawab',
    voice: 'Panggilan suara masuk',
    video: 'Panggilan video masuk',
  },
  returnToCall: 'Kembali ke panggilan',
  returnToCallWith: (name) => `Kembali ke panggilan dengan ${name}`,
  join: 'Gabung',
  leave: 'Keluar',
  speaking: (name) => `${name} sedang berbicara`,
  overflow: (n) => `+${n} lainnya`,
  muted: (name) => `${name}, dibisukan`,
};

const RECENT_HIRES_CARD_MESSAGES: Translations['RECENT_HIRES_CARD_MESSAGES'] = { title: 'Karyawan baru' };

const MAIL_LIST_MESSAGES: Translations['MAIL_LIST_MESSAGES'] = {
  draft: 'Draf:',
  unread: 'Belum dibaca',
  starred: 'Berbintang',
  star: 'Beri bintang',
  attachment: 'Ada lampiran',
  select: 'Pilih',
  threadCount: (n) => plural('id', n, { other: '{n} pesan' }),
  moreLabels: (n) => plural('id', n, { other: '{n} label lainnya' }),
  selectedCount: (n) => `${n} dipilih`,
  selectAll: 'Pilih semua',
  clearSelection: 'Hapus pilihan',
  emptyTitle: 'Tidak ada apa-apa',
  emptyDescription: 'Email baru masuk ke folder ini.',
  today: 'Hari ini',
  yesterday: 'Kemarin',
  list: 'Email',
};

const IMPORTANT_ALERTS_CARD_MESSAGES: Translations['IMPORTANT_ALERTS_CARD_MESSAGES'] = { title: 'Peringatan penting', thisWeek: 'minggu ini' };

const STAT_CARDS_MESSAGES: Translations['STAT_CARDS_MESSAGES'] = { about: (label) => `Tentang ${label}`, fromLastMonth: 'Dari bulan lalu' };

const SHAPE_MESSAGES: Translations['SHAPE_MESSAGES'] = {
  shapes: shapes_shapeNames(
    {
      square: 'Persegi',
      slanted: 'Miring',
      arch: 'Lengkung',
      semicircle: 'Setengah lingkaran',
      oval: 'Oval',
      pill: 'Pil',
      triangle: 'Segitiga',
      arrow: 'Panah',
      fan: 'Kipas',
      diamond: 'Belah ketupat',
      clamshell: 'Kerang',
      pentagon: 'Segi lima',
      gem: 'Permata',
      'very-sunny': 'Sangat cerah',
      sunny: 'Cerah',
      burst: 'Ledakan',
      'soft-burst': 'Ledakan lembut',
      boom: 'Bum',
      'soft-boom': 'Bum lembut',
      flower: 'Bunga',
      puffy: 'Mengembang',
      'puffy-diamond': 'Belah ketupat mengembang',
      'ghost-ish': 'Mirip hantu',
      'pixel-circle': 'Lingkaran piksel',
      'pixel-triangle': 'Segitiga piksel',
      bun: 'Roti bundar',
      heart: 'Hati',
    },
    (n) => `Kue ${n} sisi`,
    (n) => `Semanggi ${n} daun`,
  ),
};

const TENANCY_MESSAGES: Translations['TENANCY_MESSAGES'] = {
  leasePaymentStatus: { upcoming: 'Mendatang', due: 'Segera jatuh tempo', overdue: 'Terlambat', paid: 'Lunas' },
  rentPaymentStatus: { paid: 'Lunas', pending: 'Menunggu', overdue: 'Terlambat', partial: 'Sebagian' },
  maintenanceCategory: {
    plumbing: 'Pipa air',
    electrical: 'Listrik',
    appliances: 'Peralatan rumah',
    heating: 'Pemanas',
    other: 'Lainnya',
  },
  maintenancePriority: { low: 'Prioritas rendah', medium: 'Prioritas sedang', high: 'Prioritas tinggi', urgent: 'Mendesak' },
  maintenanceStage: { reported: 'Dilaporkan', acknowledged: 'Diterima', scheduled: 'Dijadwalkan', resolved: 'Selesai' },
  documentStatus: { signed: 'Ditandatangani', pending: 'Menunggu tanda tangan', expired: 'Kedaluwarsa' },
  timelineState: { complete: 'Selesai', current: 'Sedang berlangsung', upcoming: 'Belum' },
  leasePeriod: 'Masa sewa',
  monthlyRent: 'Sewa bulanan',
  deposit: 'Deposit',
  nextPayment: 'Pembayaran berikutnya',
  paidThisYear: 'Dibayar tahun ini',
  outstanding: 'Sisa tagihan',
  noPayments: 'Belum ada pembayaran',
  columns: { month: 'Bulan', dueDate: 'Jatuh tempo', method: 'Metode', amount: 'Jumlah', status: 'Status' },
  downloadReceipt: (month) => `Unduh kuitansi ${month}`,
  dueOn: (date) => `Jatuh tempo ${date}`,
  comments: (n) => plural('id', n, { other: '{n} komentar' }),
  photo: (position, total) => `Foto ${position} dari ${total}`,
  photoWithAlt: (alt, position, total) => `${alt}, foto ${position} dari ${total}`,
  sign: 'Tanda tangani',
  signDocument: (name) => `Tanda tangani ${name}`,
  viewDocument: (name) => `Lihat ${name}`,
  downloadDocument: (name) => `Unduh ${name}`,
  noDocuments: 'Tidak ada dokumen',
};

const DATA_TABLE_MESSAGES: Translations['DATA_TABLE_MESSAGES'] = {
  selectAll: 'Pilih semua baris di halaman ini',
  selectRow: (id) => `Pilih baris ${id}`,
  densityLabel: 'Kepadatan tabel',
  density: { md: 'Normal', sm: 'Ringkas' },
};

const ERROR_BOUNDARY_MESSAGES: Translations['ERROR_BOUNDARY_MESSAGES'] = { title: 'Terjadi kesalahan', message: 'Terjadi kesalahan yang tidak terduga', retry: 'Coba lagi' };

const AI_PROFILE_CARD_MESSAGES: Translations['AI_PROFILE_CARD_MESSAGES'] = {
  contributions: 'Kontribusi tahun ini',
  activity: 'Aktivitas',
  periodGroup: (label) => `Periode ${label}`,
  periods: { weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan' },
};

const BREADCRUMB_MESSAGES: Translations['BREADCRUMB_MESSAGES'] = {
  breadcrumb: 'Jejak navigasi',
};

const MESSAGE_MEDIA_MESSAGES: Translations['MESSAGE_MEDIA_MESSAGES'] = {
  photo: 'Foto',
  video: 'Video',
  photoOf: (i, total) => `Foto ${i} dari ${total}`,
  videoOf: (i, total) => `Video ${i} dari ${total}`,
  tapToView: 'Ketuk untuk melihat',
  sendingPhoto: 'Mengirim foto',
  sendingVideo: 'Mengirim video',
  sendingAlbum: 'Mengirim album',
  sendingSticker: 'Mengirim stiker',
  sendingGif: 'Mengirim GIF',
  album: (n) => `Album, ${n} item`,
  sharedMedia: (n) => `Media bersama, ${n} item`,
  sharedFiles: (n) => `File bersama, ${n} item`,
  moreItems: (n) => `+${n} lainnya`,
  notSent: 'Tidak terkirim',
  voiceMessage: (d) => `Pesan suara, ${d}`,
  playVoiceMessage: 'Putar pesan suara',
  pauseVoiceMessage: 'Jeda pesan suara',
  transcribe: 'Transkripsikan',
  hideTranscript: 'Sembunyikan transkrip',
  seek: 'Posisi pemutaran',
  seekPosition: (p, d) => `${p} dari ${d}`,
  playbackSpeed: (r) => `Kecepatan pemutaran, ${r}`,
  unplayed: 'Belum diputar',
  download: 'Unduh',
  downloaded: 'Diunduh',
  file: 'File',
  fileKinds: {
    pdf: 'PDF',
    doc: 'DOKUMEN',
    sheet: 'SPREADSHEET',
    slides: 'PRESENTASI',
    zip: 'ZIP',
    audio: 'AUDIO',
    video: 'VIDEO',
    image: 'GAMBAR',
    code: 'KODE',
  },
  contact: 'Kontak',
  message: 'Kirim pesan',
  add: 'Tambah',
  location: 'Lokasi',
  liveLocation: 'Lokasi langsung',
  stopSharing: 'Berhenti berbagi',
  vote: 'Pilih',
  viewResults: 'Lihat hasil',
  anonymousVoting: 'Pemungutan suara anonim',
  quiz: 'Kuis',
  selectOne: 'Pilih satu',
  selectOneOrMore: 'Pilih satu atau lebih',
  correctAnswer: 'jawaban benar',
  yourAnswer: 'jawaban Anda',
  votes: (n) => (n === 0 ? 'Belum ada suara' : `${n} suara`),
  sticker: 'Stiker',
};

const PIPELINE_MESSAGES: Translations['PIPELINE_MESSAGES'] = {
  health: { 'on-track': 'Sesuai rencana', 'at-risk': 'Berisiko', stalled: 'Macet' },
  stalledFor: (duration) => `Macet selama ${duration}`,
  move: (title) => `Pindahkan ${title}`,
  stages: 'Tahapan pipeline',
  stageWithCount: (name, n) => `${name}, ${n} kesepakatan`,
  empty: 'Tidak ada kesepakatan di tahap ini',
  loadMore: 'Muat lebih banyak',
};

const STAY_SEARCH_MESSAGES: Translations['STAY_SEARCH_MESSAGES'] = {
  where: 'Ke mana',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  when: 'Kapan',
  who: 'Siapa',
  destinationPlaceholder: 'Cari destinasi',
  datesPlaceholder: 'Tambahkan tanggal',
  guestsPlaceholder: 'Tambahkan tamu',
  guests: { adults: 'Dewasa', children: 'Anak-anak', infants: 'Bayi', pets: 'Hewan peliharaan' },
  guestDescriptions: {
    adults: 'Usia 13 tahun ke atas',
    children: 'Usia 2 – 12 tahun',
    infants: 'Di bawah 2 tahun',
    pets: 'Membawa hewan pemandu?',
  },
  dateFlexibility: 'Fleksibilitas tanggal',
  exactDates: 'Tanggal pasti',
  plusMinusDays: (n) => plural('id', n, { other: '± {n} hari' }),
  destinations: 'Destinasi',
  whereTo: 'Mau ke mana?',
  filters: 'Filter',
};

const AUTH_CARD_MESSAGES: Translations['AUTH_CARD_MESSAGES'] = {
  modes: {
    signin: {
      title: 'Selamat datang kembali',
      description: 'Masuk untuk melanjutkan dari tempat terakhir Anda.',
      cta: 'Masuk',
      switchLead: 'Baru di sini?',
      switchAction: 'Buat akun',
    },
    signup: {
      title: 'Buat akun Anda',
      description: 'Mulai dalam beberapa menit.',
      cta: 'Buat akun',
      switchLead: 'Sudah punya akun?',
      switchAction: 'Masuk',
    },
    verify: {
      title: 'Periksa kotak masuk Anda',
      description: 'Masukkan kode yang kami kirim untuk menyelesaikan proses masuk.',
      cta: 'Verifikasi dan lanjutkan',
      switchLead: 'Kode tidak kunjung tiba?',
      switchAction: 'Kirim kode baru',
    },
  },
  codeSentTo: (email) => `Masukkan kode yang kami kirim ke ${email} untuk menyelesaikan proses masuk.`,
  verificationCode: 'Kode verifikasi',
  fullName: 'Nama lengkap',
  namePlaceholder: 'Siti Rahayu',
  email: 'Email',
  emailPlaceholder: 'anda@perusahaan.com',
  emailHint: 'Kami menggunakannya untuk menghubungi Anda dan tidak pernah membagikannya.',
  password: 'Kata sandi',
  passwordPlaceholder: 'Masukkan kata sandi Anda',
  newPasswordPlaceholder: 'Minimal 8 karakter',
  confirmPassword: 'Konfirmasi kata sandi',
  confirmPasswordPlaceholder: 'Ulangi kata sandi Anda',
  rememberMe: 'Ingat saya',
  forgotPassword: 'Lupa kata sandi?',
  terms: 'Dengan membuat akun, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.',
  orContinueWith: 'atau lanjutkan dengan',
};

const TRACK_LIST_MESSAGES: Translations['TRACK_LIST_MESSAGES'] = {
  title: 'Judul',
  album: 'Album',
  dateAdded: 'Tanggal ditambahkan',
  plays: 'Diputar',
  duration: 'Durasi',
  moveUp: 'Pindahkan ke atas',
  moveDown: 'Pindahkan ke bawah',
  reorder: 'Urutkan ulang',
  downloaded: 'Diunduh',
  unavailable: 'Tidak tersedia',
  tracks: 'Lagu',
  episodes: 'Episode',
  selected: (n) => plural('id', n, { other: '{n} dipilih' }),
  clearSelection: 'Hapus pilihan',
  played: 'Sudah diputar',
  listened: 'Sudah didengarkan',
  saveEpisode: 'Simpan episode',
  downloadEpisode: 'Unduh episode',
  minutes: (m) => `${m} mnt`,
  hours: (h) => `${h} jam`,
  hoursMinutes: (h, m) => `${h} jam ${m} mnt`,
  remaining: (l) => `${l} lagi`,
};

const LYRICS_MESSAGES: Translations['LYRICS_MESSAGES'] = {
  lyrics: 'Lirik',
  showLyrics: 'Tampilkan lirik',
  backToCurrent: 'Kembali ke baris saat ini',
  empty: 'Lirik untuk lagu ini tidak tersedia',
};

const ACTIVITY_FEED_MESSAGES: Translations['ACTIVITY_FEED_MESSAGES'] = {
  kinds: { call: 'Panggilan', email: 'Email', meeting: 'Rapat', note: 'Catatan', 'stage-change': 'Perubahan tahap', task: 'Tugas selesai' },
  empty: 'Belum ada aktivitas tercatat',
  loggedBy: (name) => `Dicatat oleh ${name}`,
  filterActivity: 'Filter aktivitas',
};

const PLACE_REVIEWS_MESSAGES: Translations['PLACE_REVIEWS_MESSAGES'] = {
  depositReturned: 'Deposit dikembalikan',
  depositNotReturned: 'Deposit tidak dikembalikan',
  recommend: 'Akan merekomendasikan',
  notRecommend: 'Tidak akan merekomendasikan',
  helpful: 'Membantu',
  report: 'Laporkan',
  promptTitle: 'Pernah tinggal di sini?',
  promptDescription: (building) =>
    `Bantu calon penyewa ${building}. Ulasan bersifat anonim.`,
  writeReview: 'Tulis ulasan',
  reviewCount: (n) => plural('id', n, { other: '{n} ulasan' }),
  depositRate: (percent) => `Deposit dikembalikan pada ${percent}% masa sewa`,
  recommendRate: (percent) => `${percent}% akan merekomendasikan tinggal di sini`,
};

const DELIVERY_SLOT_MESSAGES: Translations['DELIVERY_SLOT_MESSAGES'] = {
  tiers: { standard: 'Reguler', express: 'Ekspres' },
  soldOut: 'Habis',
  asap: 'Secepatnya',
  field: 'Waktu pengantaran',
  day: 'Hari',
  emptyTitle: 'Tidak ada slot tersisa',
  emptyDescription: 'Pilih hari lain, atau ambil kurir berikutnya.',
};

const PLACE_LIST_MESSAGES: Translations['PLACE_LIST_MESSAGES'] = {
  visibility: { private: 'Pribadi', shared: 'Dibagikan', public: 'Publik' },
  places: (n) => plural('id', n, { other: '{n} tempat' }),
  sharedWith: (n) => plural('id', n, { other: 'Dibagikan dengan {n} orang' }),
  labels: {
    moveEarlier: (position) => `Pindahkan ke posisi ${position - 1}`,
    moveLater: (position) => `Pindahkan ke posisi ${position + 1}`,
    remove: (name) => `Hapus ${name} dari daftar`,
    moved: (name, position, total) => `${name} dipindahkan ke posisi ${position} dari ${total}`,
    note: 'Catatan',
  },
  savedPlaces: 'Tempat tersimpan',
};

const HOME_SEARCH_MESSAGES: Translations['HOME_SEARCH_MESSAGES'] = {
  modes: { rent: 'Sewa', buy: 'Beli', stays: 'Sewa liburan', swap: 'Tukar rumah' },
  searchMode: 'Mode pencarian',
  location: 'Lokasi',
  locationPlaceholder: 'Cari kota atau area',
  moveIn: 'Pindah',
  datePlaceholder: 'Tambahkan tanggal',
  budget: 'Anggaran',
  budgetPlaceholder: 'Tambahkan anggaran',
  price: 'Harga',
  pricePlaceholder: 'Harga berapa saja',
  propertyType: 'Jenis properti',
  propertyTypePlaceholder: 'Semua jenis',
  dates: 'Tanggal',
  homeSize: 'Ukuran rumah',
  homeSizePlaceholder: 'Semua ukuran',
  minimum: 'Minimal',
  maximum: 'Maksimal',
  budgetPresets: 'Rentang anggaran',
  monthlyBudget: 'Anggaran bulanan',
  monthlyBudgetDescription: 'Sewa per bulan, belum termasuk tagihan',
  totalPriceDescription: 'Harga total',
  upTo: (amount) => `Hingga ${amount}`,
  any: 'Bebas',
  moveInLabels: {
    date: 'Tanggal pindah',
    flexible: 'Fleksibel',
    asap: 'Secepatnya',
    contractLength: 'Lama kontrak',
  },
  contractLengths: { any: 'Bebas', short: '1–6 bulan', medium: '6–12 bulan', long: 'Lebih dari 1 tahun' },
  saveSearch: 'Simpan pencarian',
  saved: 'Tersimpan',
  newCount: (n) => `${n} baru`,
  alertsOff: 'Notifikasi mati',
  actionOn: (action, subject) => `${action} ${subject}`,
};

const OFFERING_BADGE_MESSAGES: Translations['OFFERING_BADGE_MESSAGES'] = { offerings: { long_term_rent: 'Disewakan', sale: 'Dijual', short_term_rent: 'Sewa liburan', exchange: 'Tukar' } };

const MAP_ATTRIBUTION_MESSAGES: Translations['MAP_ATTRIBUTION_MESSAGES'] = { scale: 'Skala', mapData: 'Data peta' };

const SLIDER_MESSAGES: Translations['SLIDER_MESSAGES'] = { minimum: 'Nilai minimum', maximum: 'Nilai maksimum', value: (n) => `Nilai ${n}` };

const SELECT_MESSAGES: Translations['SELECT_MESSAGES'] = { selectOption: 'Pilih opsi', scrollUp: 'Gulir ke atas', scrollDown: 'Gulir ke bawah' };

const ZOOMABLE_MEDIA_GALLERY_MESSAGES: Translations['ZOOMABLE_MEDIA_GALLERY_MESSAGES'] = {
  close: 'Tutup penampil media',
  previous: 'Item sebelumnya',
  next: 'Item berikutnya',
  goTo: (i, n) => `Buka item ${i} dari ${n}`,
  share: 'Bagikan media',
};

const NOTIFICATION_MESSAGES: Translations['NOTIFICATION_MESSAGES'] = { dismiss: 'Tutup notifikasi' };

const PHONE_INPUT_MESSAGES: Translations['PHONE_INPUT_MESSAGES'] = { phoneNumber: 'Nomor telepon', countryCode: 'Kode negara' };

const VENDOR_CARD_MESSAGES: Translations['VENDOR_CARD_MESSAGES'] = {
  facts: { deliveryTime: 'Waktu pengantaran', deliveryFee: 'Ongkos kirim', distance: 'Jarak', minimumOrder: 'Pesanan minimum' },
  availability: { paused: 'Dijeda', closed: 'Tutup' },
  new: 'Baru',
  rated: (value, reviews) =>
    `Rating ${value} dari 5${vendorCard_has(reviews) ? `, ${vendorCard_counted('id', reviews, { other: '{n} ulasan' })}` : ''}`,
};

const CHAT_INDICATORS_MESSAGES: Translations['CHAT_INDICATORS_MESSAGES'] = {
  presence: { online: 'Online', idle: 'Pergi', offline: 'Offline', busy: 'Sibuk' },
  status: { sending: 'Mengirim…', sent: 'Terkirim', delivered: 'Diterima', read: 'Dibaca', failed: 'Tidak terkirim' },
  unread: 'Belum dibaca',
  unreadCount: (n) => `${n} pesan belum dibaca`,
};

const MEDIA_CONTROLS_MESSAGES: Translations['MEDIA_CONTROLS_MESSAGES'] = {
  play: 'Putar',
  pause: 'Jeda',
  playSubject: (s) => `Putar ${s}`,
  pauseSubject: (s) => `Jeda ${s}`,
  saveToLibrary: 'Simpan ke Koleksi Anda',
  saveSubjectToLibrary: (s) => `Simpan ${s} ke Koleksi Anda`,
  explicit: 'Eksplisit',
  seek: 'Posisi pemutaran',
  seekValue: (a, b) => `${a} dari ${b}`,
  mute: 'Bisukan',
  unmute: 'Bunyikan',
  volume: 'Volume',
  nowPlaying: 'Sedang diputar',
};

const INPUT_OTP_MESSAGES: Translations['INPUT_OTP_MESSAGES'] = {
  oneTimeCode: 'Kode sekali pakai',
  digitOf: (i, n) => `Digit ${i} dari ${n}`,
  characterOf: (i, n) => `Karakter ${i} dari ${n}`,
};

const PLACE_DETAILS_MESSAGES: Translations['PLACE_DETAILS_MESSAGES'] = {
  infoActions: { call: 'Telepon', open: 'Buka situs web', directions: 'Rute' },
  busy: {
    busier: 'Lebih ramai dari biasanya',
    typical: 'Seramai biasanya',
    quieter: 'Lebih sepi dari biasanya',
  },
  transitModes: {
    bus: 'Halte bus',
    metro: 'Stasiun MRT',
    train: 'Stasiun kereta',
    tram: 'Halte trem',
    ferry: 'Terminal feri',
  },
  notAvailable: 'Tidak tersedia',
  amenities: 'Fasilitas',
  today: 'Hari ini',
  closed: 'Tutup',
  openingHours: 'Jam buka',
  day: 'Hari',
  noDataForDay: 'Tidak ada data untuk hari ini',
  chartNoData: (day) => `${day}, tidak ada data`,
  chartClosed: (day) => `${day}, tutup sepanjang hari`,
  chartPeak: (day, hour) => `${day}, paling ramai pukul ${hour}`,
  chartNow: (hour) => `sekarang ${hour}`,
  live: 'langsung',
  noDepartures: 'Tidak ada keberangkatan saat ini',
  nearbyTransit: 'Transportasi umum terdekat',
  lines: 'Jalur',
  line: (name) => `Jalur ${name}`,
  towards: (headsign) => `ke ${headsign}`,
};

const APP_SHELL_MESSAGES: Translations['APP_SHELL_MESSAGES'] = {
  openNavigation: 'Buka navigasi',
  closeNavigation: 'Tutup navigasi',
  resizePanes: 'Ubah ukuran panel',
  notifications: 'Notifikasi',
  proOffer: 'Penawaran Pro',
};

const ROUTE_STOPS_MESSAGES: Translations['ROUTE_STOPS_MESSAGES'] = {
  routeStops: 'Perhentian rute',
  origin: 'Asal',
  destination: 'Tujuan',
  stop: (position) => `Perhentian ${position}`,
  swap: 'Tukar asal dan tujuan',
  addStop: 'Tambahkan perhentian',
  removeStop: (title) => `Hapus ${title}`,
  state: { reached: 'Tercapai', current: 'Perhentian saat ini', pending: 'Belum tercapai' },
};

const SEARCH_MESSAGES: Translations['SEARCH_MESSAGES'] = { clearQuery: 'Hapus kueri pencarian' };

const TAG_FIELD_MESSAGES: Translations['TAG_FIELD_MESSAGES'] = { remove: (t) => `Hapus ${t}`, full: (n) => `Maksimum ${n}`, suggestions: 'Saran' };

const STAY_FILTERS_MESSAGES: Translations['STAY_FILTERS_MESSAGES'] = {
  propertyTypes: {
    apartment: 'Apartemen',
    house: 'Rumah',
    room: 'Kamar',
    studio: 'Studio',
    duplex: 'Dupleks / Penthouse',
    coliving: 'Coliving',
    hostel: 'Hostel',
    other: 'Tanah / Lainnya',
  },
  features: {
    elevator: 'Lift',
    parking: 'Parkir',
    terrace: 'Teras',
    garden: 'Taman',
    pool: 'Kolam renang',
    furnished: 'Berperabot',
    pets: 'Boleh bawa hewan peliharaan',
    airConditioning: 'AC',
    heating: 'Pemanas',
    accessible: 'Ramah difabel',
    storage: 'Gudang',
  },
  floors: { ground: 'Lantai dasar', middle: 'Lantai tengah', top: 'Lantai teratas', elevator: 'Dengan lift' },
  minimum: 'Minimal',
  maximum: 'Maksimal',
  priceRange: 'Rentang harga',
  area: 'Luas',
  featuresGroup: 'Fasilitas',
  floor: 'Lantai',
  propertyType: 'Jenis properti',
  energyRating: 'Peringkat energi',
  anyRating: 'Semua peringkat',
  ratingOnly: (r) => `Hanya ${r}`,
  ratingAndBetter: (r) => `${r} atau lebih baik`,
  filters: 'Filter',
  filtersApplied: (label, n) => `${label}, ${n} diterapkan`,
  clearAll: 'Hapus semua',
  any: 'Bebas',
  availableNow: 'Tersedia sekarang',
  availableNowDescription: 'Siap huni hari ini',
  availableFrom: 'Tersedia mulai',
  anyDate: 'Tanggal berapa saja',
};

const SETTINGS_MODAL_MESSAGES: Translations['SETTINGS_MODAL_MESSAGES'] = {
  dialog: 'Pengaturan',
  nav: 'Bagian pengaturan',
  close: 'Tutup pengaturan',
  saved: 'Tersimpan',
  currentPlan: 'Paket saat ini',
  actions: 'Tindakan',
  storage: {
    storedIn: 'Disimpan di',
    fileCount: (n, shown) => plural('id', n, { other: `${shown} file` }),
    filterByType: 'Filter menurut jenis file',
    fileType: 'Jenis file',
    orderBy: 'Urutkan menurut',
    modified: 'Diubah',
    oldestFirst: 'Terlama dulu',
    searchFiles: 'Cari file',
    selectAllOnPage: 'Pilih semua file di halaman ini',
    fileName: 'Nama file',
    uploadedOn: 'Diunggah pada',
    fileSize: 'Ukuran file',
    sortBy: { name: 'Urutkan menurut nama file', uploadedAt: 'Urutkan menurut tanggal unggah', size: 'Urutkan menurut ukuran file' },
    selectFile: (name) => `Pilih ${name}`,
    deleteFile: 'Hapus file',
    deleteNamed: (name) => `Hapus ${name}`,
    noMatches: 'Tidak ada file yang cocok dengan filter Anda.',
    documents: 'Dokumen',
    spreadsheets: 'Spreadsheet',
    videos: 'Video',
    downloadFile: 'Unduh file',
    rename: 'Ganti nama',
    copyLink: 'Salin tautan',
  },
  tools: {
    showOutput: 'Tampilkan output',
    refreshTools: 'Muat ulang alat',
    removeServer: 'Keluarkan server',
    logout: 'Keluar',
    logOutOf: (server) => `Keluar dari ${server}`,
    showTools: (server) => `Tampilkan alat ${server}`,
    hideTools: (server) => `Sembunyikan alat ${server}`,
    error: 'Kesalahan',
    showOutputLink: 'Tampilkan output',
    showOutputOf: (server) => `Tampilkan output ${server}`,
    newServer: 'Server MCP baru',
    newServerDescription: 'Tambahkan server MCP kustom',
    projectScope: 'Cakupan proyek',
    authentication: 'Autentikasi',
    waitForAuth: 'Tunggu autentikasi MCP',
    waitForAuthDescription:
      'Tunggu tanpa batas waktu untuk autentikasi saat diminta. Jika nonaktif, permintaan autentikasi dilewati setelah 30 detik.',
    waitForAuthSwitch: 'Tunggu autentikasi MCP',
    scopeServers: (scope) => `Server MCP ${scope}`,
    scopeServersDescription: (scope) => `Server yang tersedia dari ${scope}.`,
    teamServers: 'Server MCP tim',
    teamServersDescription: 'Dikonfigurasi di dasbor',
    manage: 'Kelola',
    noTeamServers: 'Tidak ada server MCP tim',
    noTeamServersBody: 'Konfigurasikan server MCP di dasbor agar tersedia di desktop dan di cloud.',
    configureTeam: 'Konfigurasikan server MCP tim',
    pluginServers: 'Server MCP plugin',
  },
};

const EVICTION_MESSAGES: Translations['EVICTION_MESSAGES'] = {
  status: {
    scheduled: 'Dijadwalkan',
    postponed: 'Ditunda',
    suspended: 'Ditangguhkan',
    executed: 'Dilaksanakan',
    cancelled: 'Dibatalkan',
  },
  attend: 'Saya akan hadir',
  share: 'Bagikan',
  contactSupport: 'Hubungi kelompok pendukung',
  verified: 'Diverifikasi komunitas',
  caseHistory: 'Riwayat kasus',
  source: (source) => `Sumber: ${source}`,
};

const BOOKING_MESSAGES: Translations['BOOKING_MESSAGES'] = {
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  guests: 'Tamu',
  addDate: 'Tambahkan tanggal',
  reserve: 'Pesan',
  checkAvailability: 'Periksa ketersediaan',
  notChargedYet: 'Anda belum akan dikenai biaya',
  total: 'Total',
  tripStatus: { confirmed: 'Dikonfirmasi', pending: 'Menunggu', cancelled: 'Dibatalkan', completed: 'Selesai' },
  priceName: booking_priceName((p, u) => `${p} per ${u}`, (s, o) => `${s}, sebelumnya ${o}`),
};

const AGENT_LIMITS_CARD_MESSAGES: Translations['AGENT_LIMITS_CARD_MESSAGES'] = { contextWindow: 'Jendela konteks', freeSpace: 'Ruang kosong', planUsageLimits: 'Batas penggunaan paket', managePlan: 'Kelola paket' };

const SWIPE_ROW_MESSAGES: Translations['SWIPE_ROW_MESSAGES'] = {
  closeActions: 'Tutup tindakan',
};

const PATIENT_INFO_CARD_MESSAGES: Translations['PATIENT_INFO_CARD_MESSAGES'] = { addPhoto: 'Tambahkan foto profil' };

const THEME_TOGGLE_MESSAGES: Translations['THEME_TOGGLE_MESSAGES'] = { theme: 'Tema', darkMode: 'Mode gelap', lightMode: 'Mode terang', useDarkMode: 'Gunakan mode gelap', useLightMode: 'Gunakan mode terang' };

const EARNINGS_MESSAGES: Translations['EARNINGS_MESSAGES'] = {
  earned: 'Diperoleh',
  period: 'Periode pendapatan',
  breakdown: 'Sumbernya',
  payout: 'Pencairan berikutnya',
  payoutState: { scheduled: 'Terjadwal', processing: 'Dalam proses', paid: 'Dibayar', held: 'Ditahan', failed: 'Gagal' },
  chart: (label) => `Pendapatan ${label}, per periode`,
  empty: 'Belum ada pendapatan',
  earnings: 'Pendapatan',
};

const PROOF_OF_DELIVERY_MESSAGES: Translations['PROOF_OF_DELIVERY_MESSAGES'] = {
  labels: {
    signature: 'Tanda tangan',
    signaturePad: 'Area tanda tangan',
    signatureHint: 'Tanda tangani dengan jari',
    signed: 'Sudah ditandatangani',
    clear: 'Hapus tanda tangan',
    typeName: 'Atau ketik namamu',
    typeNamePlaceholder: 'Nama lengkap',
    photo: 'Foto',
    photoHint: 'Tempat kamu meninggalkannya, atau paket bersama penerima.',
    code: 'Kode pengantaran',
    codeHint: 'Minta penerima membacakan kode di aplikasinya.',
    recipient: 'Siapa yang menerima',
    recipientPlaceholder: 'Nama',
    note: 'Catatan',
    notePlaceholder: 'Apa pun yang perlu dicatat',
    submit: 'Konfirmasi pengantaran',
    required: 'Wajib',
    missing: 'Ini diperlukan sebelum kamu bisa mengonfirmasi.',
    missingSummary: (n) => `Masih ada ${n} hal yang kurang`,
  },
  proofOfDelivery: 'Bukti pengantaran',
};

const FILE_UPLOAD_MESSAGES: Translations['FILE_UPLOAD_MESSAGES'] = {
  promptWeb: 'Seret dan lepas untuk mengunggah atau',
  promptNative: 'Ketuk untuk',
  selectWeb: 'pilih',
  selectNative: 'memilih file',
  uploading: (size) => `Mengunggah ${size}...`,
  uploaded: 'Berhasil diunggah!',
  unsupported: (extensions) => `Hanya file ${extensions} yang didukung`,
  tooLarge: (max) => `File melebihi ${max}`,
  max: (size) => `(maks. ${size})`,
  uploadFile: 'Unggah file',
};

const POPOVER_MESSAGES: Translations['POPOVER_MESSAGES'] = {
  popover: 'Jendela munculan',
};

const QUEUE_PANEL_MESSAGES: Translations['QUEUE_PANEL_MESSAGES'] = {
  queueTab: 'Antrean',
  recentTab: 'Baru diputar',
  close: 'Tutup antrean',
  nextInQueue: 'Berikutnya di antrean',
  nextFrom: (c) => `Berikutnya dari: ${c}`,
  nextUp: 'Berikutnya',
  clearQueue: 'Hapus antrean',
  reorder: (t) => `Urutkan ulang ${t}`,
  reorderHint: 'Seret, atau gunakan tombol panah',
  moveUp: 'Pindahkan ke atas',
  moveDown: 'Pindahkan ke bawah',
  remove: 'Hapus dari antrean',
  moved: (t, p, n) => `${t} dipindahkan ke posisi ${p} dari ${n}`,
  emptyQueue: 'Antrean Anda kosong',
  emptyQueueHint: 'Tambahkan lagu dan episode untuk didengarkan berikutnya.',
  emptyRecent: 'Belum ada yang diputar',
};

const HOVER_CARD_MESSAGES: Translations['HOVER_CARD_MESSAGES'] = {
  hoverCard: 'Kartu pratinjau',
};

const NOTE_EDITOR_MESSAGES: Translations['NOTE_EDITOR_MESSAGES'] = {
  header: {
    saved: 'Tersimpan',
    saving: 'Menyimpan…',
    offline: 'Offline — perubahan ditahan',
    error: 'Tidak tersimpan',
    words: (n) => plural('id', n, { other: '{n} kata' }),
    title: 'Judul',
  },
  untitled: 'Tanpa judul',
  note: 'Catatan',
  toolbar: { more: 'Format lainnya', moreMenu: 'Format lainnya' },
};

const MEDIA_SHELF_MESSAGES: Translations['MEDIA_SHELF_MESSAGES'] = { filters: 'Filter', showAll: 'Tampilkan semua' };

const CATEGORY_BAR_MESSAGES: Translations['CATEGORY_BAR_MESSAGES'] = { previous: 'Kategori sebelumnya', next: 'Kategori berikutnya' };

const CARRIER_QUOTE_MESSAGES: Translations['CARRIER_QUOTE_MESSAGES'] = {
  labels: {
    accept: 'Terima',
    message: 'Pesan',
    decline: 'Tolak',
    pickup: 'Penjemputan',
    eta: 'Tiba',
    vehicle: 'Kendaraan',
    jobs: (jobs) => `${jobs} pekerjaan`,
    verified: 'Pengangkut terverifikasi',
    marks: { cheapest: 'Termurah', fastest: 'Tercepat' },
    showPrice: 'Tampilkan rincian harga',
    hidePrice: 'Sembunyikan rincian harga',
    priceDetails: 'Rincian harga untuk',
    sort: 'Urutkan penawaran',
    sortOptions: { price: 'Termurah', eta: 'Tercepat', rating: 'Rating terbaik' },
    count: (n) => `${n} penawaran`,
    loading: 'Memuat penawaran',
  },
  emptyTitle: 'Belum ada penawaran',
  emptyDescription: 'Para pengangkut sedang melihat pekerjaan Anda. Penawaran pertama biasanya tiba dalam beberapa menit.',
  list: 'Penawaran',
  priceDetailsFor: (name) => `Rincian harga untuk ${name}`,
};

const TEXT_FIELD_MESSAGES: Translations['TEXT_FIELD_MESSAGES'] = { showPassword: 'Tampilkan kata sandi', hidePassword: 'Sembunyikan kata sandi', required: 'wajib diisi' };

const CHAT_SCREEN_MESSAGES: Translations['CHAT_SCREEN_MESSAGES'] = {
  call: 'Panggilan suara',
  videoCall: 'Panggilan video',
  searchInConversation: 'Cari di percakapan',
  connecting: 'Menghubungkan…',
  verified: 'Terverifikasi',
  bot: 'Bot',
  channel: 'Saluran',
  clearSelection: 'Hapus pilihan',
  forward: 'Teruskan',
  pin: 'Sematkan',
  selectedCount: (n) => `${n} dipilih`,
  pinnedList: 'Tampilkan pesan yang disematkan',
  pinnedClose: 'Sembunyikan bilah sematan',
  pinnedUnpin: 'Lepas sematan pesan ini',
  pinnedMessage: 'Pesan disematkan',
  pinnedMessageNumber: (n) => `Pesan disematkan #${n}`,
  scrollToBottom: 'Gulir ke pesan terbaru',
  jumpToMention: 'Lompat ke sebutan',
  emptyTitle: 'Belum ada pesan',
  info: 'Informasi',
  members: 'Anggota',
  addMember: 'Tambahkan anggota',
  memberSearch: 'Cari anggota',
  noMembers: 'Anggota tidak ditemukan',
  owner: 'Pemilik',
  admin: 'Admin',
  resizeList: 'Ubah ukuran daftar percakapan',
};

const CONTEXT_MENU_MESSAGES: Translations['CONTEXT_MENU_MESSAGES'] = {
  contextMenu: 'Menu konteks',
};

const SORTABLE_MEDIA_MESSAGES: Translations['SORTABLE_MEDIA_MESSAGES'] = {
  photo: (p, t) => `Foto ${p} dari ${t}`,
  cover: 'Sampul',
  moveEarlier: (p) => `Pindahkan foto ${p} ke depan`,
  moveLater: (p) => `Pindahkan foto ${p} ke belakang`,
  remove: (p) => `Hapus foto ${p}`,
  retry: (p) => `Coba unggah ulang foto ${p}`,
  uploading: (p) => `Mengunggah foto ${p}`,
  failed: 'Gagal mengunggah',
  add: 'Tambahkan foto',
  moved: (p, t) => `Dipindahkan ke posisi ${p} dari ${t}`,
  photos: 'Foto',
};

const CONNECTION_DOTS_MESSAGES: Translations['CONNECTION_DOTS_MESSAGES'] = {
  connecting: 'Menghubungkan',
};

const CHAT_PEOPLE_MESSAGES: Translations['CHAT_PEOPLE_MESSAGES'] = {
  newGroup: {
    photo: 'Pilih foto grup',
    name: 'Nama grup',
    namePlaceholder: 'Beri nama grup ini',
    description: 'Deskripsi',
    descriptionPlaceholder: 'Untuk apa grup ini?',
    members: (n) => `${n} anggota`,
    addMembers: 'Tambah anggota',
    remove: (name) => `Hapus ${name}`,
  },
  member: {
    owner: 'Pemilik',
    admin: 'Admin',
    promote: 'Jadikan admin',
    restrict: 'Batasi',
    remove: 'Keluarkan dari grup',
    actions: (name) => `Tindakan untuk ${name}`,
  },
  story: {
    close: 'Tutup cerita',
    previous: 'Cerita sebelumnya',
    next: 'Cerita berikutnya',
    mute: 'Bisukan cerita',
    unmute: 'Bunyikan cerita',
    more: 'Opsi cerita',
    replyPlaceholder: 'Balas…',
    send: 'Kirim balasan',
    progress: (index, count) => `Cerita ${index + 1} dari ${count}`,
    react: (emoji) => `Bereaksi dengan ${emoji}`,
  },
  searchMembers: 'Cari anggota',
  share: 'Bagikan',
  postOptions: 'Opsi postingan',
  pinned: 'Disematkan',
  views: (c) => `${c} tayangan`,
  forwards: (c) => `${c} penerusan`,
  jumpTo: (letter) => `Lompat ke ${letter}`,
  add: 'Tambah',
  added: 'Ditambahkan',
  actionOn: (action, name) => `${action} ${name}`,
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
