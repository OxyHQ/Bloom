// Bloom's ru strings for every family. Loaded on demand by
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
  'top-left': 'вверху слева',
  'top-right': 'вверху справа',
  'bottom-left': 'внизу слева',
  'bottom-right': 'внизу справа',
};

const MESSAGE_MEDIA_MESSAGES__items = (n: number) =>
  plural('ru', n, {
    one: '{n} элемент',
    few: '{n} элемента',
    many: '{n} элементов',
    other: '{n} элемента',
  });

const AGENT_CREATOR_MESSAGES: Translations['AGENT_CREATOR_MESSAGES'] = {
  reaction: 'Реакция',
  working: 'Работать',
  avatarStyle: 'Стиль аватара',
  proceduralAvatar: 'Текущий аватар',
  betaPreset: 'Готовый персонаж (бета)',
  betaEyes: 'Стиль глаз',
  eyewear: 'Очки',
  accessory: 'Аксессуар',
  characterOption: (_category, _id, title) => String(title),
  editor: 'Редактор агента',
  newBot: 'Новый бот',
  closeEditor: 'Закрыть редактор агента',
  details: 'Внешний вид и сведения об агенте',
  color: 'Цвет аватара',
  customColor: 'Свой цвет аватара',
  name: 'Имя',
  label: 'Метка',
  description: 'Описание',
  nameInput: 'Имя агента',
  labelInput: 'Метка агента',
  descriptionInput: 'Описание агента',
  labelPlaceholder: 'Менеджер, маркетинг, художник',
  descriptionPlaceholder: 'Сведения об агенте',
  language: 'Язык',
  languageInput: 'Язык агента',
  notifications: 'Уведомления',
  notificationsDescription: 'Показать уведомление, когда ответ готов.',
  notifyFinished: 'Уведомить, когда этот агент завершит работу',
  voice: 'Голос',
  voiceInput: 'Голос агента',
  previewVoice: 'Прослушать голос',
  savedVoice: 'Сохранённый голос',
  systemVoice: 'Системный голос',
  off: 'Выкл.',
  playbackSpeed: 'Скорость воспроизведения',
  emotion: 'Эмоция агента',
  shape: 'Форма аватара',
  hexColor: 'Цвет HEX',
  hue: 'Оттенок',
  saturationBrightness: 'Насыщенность и яркость',
  increaseBrightness: 'Увеличить яркость',
  decreaseBrightness: 'Уменьшить яркость',
  increaseHue: 'Увеличить оттенок',
  decreaseHue: 'Уменьшить оттенок',
  nextShape: 'Следующая форма',
  previousShape: 'Предыдущая форма',
  newAgent: 'Новый агент',
  emotions: {
    neutral: 'Нейтральный',
    happy: 'Радостный',
    angry: 'Сердитый',
    thinking: 'Задумчивый',
    shook: 'Потрясённый',
    curious: 'Любопытный',
    wink: 'Подмигивающий',
    sleepy: 'Сонный',
    sad: 'Грустный',
    worried: 'Обеспокоенный',
    skeptical: 'Скептический',
    focused: 'Сосредоточенный',
    excited: 'Взволнованный',
    calm: 'Спокойный',
    shy: 'Застенчивый',
    confused: 'Растерянный',
  },
  shapes: {
    slender: 'Узкая',
    pocket: 'Карман',
    petal: 'Лепесток',
    flower: 'Цветок',
    star: 'Звезда',
    heart: 'Сердце',
    cloud: 'Облако',
    diamond: 'Ромб',
    shield: 'Щит',
  },
  colors: {
    Blue: 'Синий',
    Teal: 'Бирюзовый',
    Violet: 'Фиолетовый',
    Pink: 'Розовый',
    Red: 'Красный',
    Orange: 'Оранжевый',
    Cyan: 'Голубой',
    Lime: 'Лаймовый',
    Green: 'Зелёный',
  },
  languages: {
    auto: 'Автоопределение',
    en: 'Английский',
    tr: 'Турецкий',
    es: 'Испанский',
    fr: 'Французский',
    de: 'Немецкий',
    ja: 'Японский',
    pt: 'Португальский',
  },
  avatarColorLabel: (name) => 'Аватар: {name}'.replace('{name}', name),
  shapeLabel: (name) => 'Форма: {name}'.replace('{name}', name),
  silhouetteLabel: (name) => 'Силуэт: {name}'.replace('{name}', name),
  livePreview: (name) => '{name}, предпросмотр аватара'.replace('{name}', name),
  saturationBrightnessValue: (s, v) =>
    'насыщенность {s}%, яркость {v}%'.replace('{s}', String(s)).replace('{v}', String(v)),
  playbackSpeedLabel: (speed) =>
    'Скорость воспроизведения {speed}'.replace('{speed}', String(speed)),
};

const COMMON_MESSAGES: Translations['COMMON_MESSAGES'] = {
  close: 'Закрыть',
  dismiss: 'Скрыть',
  back: 'Назад',
  goBack: 'Вернуться',
  loading: 'Загрузка',
  more: 'Ещё',
  moreOptions: 'Другие параметры',
  moreActions: 'Другие действия',
  progress: 'Прогресс',
  stepOf: (step, total) => `Шаг ${step} из ${total}`,
  labelFor: (label, subject) => `${label}: ${subject}`,
  tapToClose: 'Нажмите, чтобы закрыть',
  cancel: 'Отмена',
  done: 'Готово',
  save: 'Сохранить',
  delete: 'Удалить',
  edit: 'Изменить',
  remove: 'Убрать',
  retry: 'Повторить',
  search: 'Поиск',
  showMore: 'Показать больше',
  showLess: 'Показать меньше',
  next: 'Далее',
  previous: 'Предыдущий',
  open: 'Открыть',
  menu: 'Меню',
  copy: 'Копировать',
  copied: 'Скопировано',
  send: 'Отправить',
  clear: 'Очистить',
  seeAll: 'Показать все',
  resizePanels: 'Изменить размер панелей',
};

const SURFACES_MESSAGES: Translations['SURFACES_MESSAGES'] = { confirm: 'Подтвердить', ok: 'ОК' };

const CONTACT_CARD_MESSAGES: Translations['CONTACT_CARD_MESSAGES'] = {
  // A name after a colon keeps its nominative case; a verb would demand another.
  channels: {
    email: { action: 'Письмо', name: (s) => `Написать письмо: ${s}` },
    phone: { action: 'Позвонить', name: (s) => `Позвонить: ${s}` },
    chat: { action: 'Сообщение', name: (s) => `Написать сообщение: ${s}` },
    meeting: { action: 'Встреча', name: (s) => `Назначить встречу: ${s}` },
    video: { action: 'Видео', name: (s) => `Начать видеозвонок: ${s}` },
    website: { action: 'Сайт', name: (s) => `Открыть сайт: ${s}` },
  },
  labelsFor: (name) => `Метки: ${name}`,
  owner: 'Ответственный',
};

const CHAT_LIST_MESSAGES: Translations['CHAT_LIST_MESSAGES'] = {
  item: {
    draft: 'Черновик:',
    pinned: 'Закреплён',
    muted: 'Без звука',
    verified: 'Подтверждён',
    channel: 'Канал',
    bot: 'Бот',
    group: 'Группа',
  },
  search: { chat: 'Чаты', message: 'Сообщения', contact: 'Контакты', empty: 'Ничего не найдено' },
  list: 'Чаты',
  emptyTitle: 'Чатов пока нет',
  emptyDescription: 'Начните чат, и он появится здесь.',
  searchResults: 'Результаты поиска',
  searchChats: 'Поиск по чатам',
  clearSearch: 'Очистить поиск',
  newChat: 'Новый чат',
  archived: 'Архив',
  archivedName: (label, n) =>
    `${label}, ${plural('ru', n, { one: '{n} чат', few: '{n} чата', many: '{n} чатов', other: '{n} чата' })}`,
  folderName: (label, n) => `${label}, непрочитанных: ${n}`,
  stories: 'Истории',
  ownStory: 'Ваша история',
  addStory: 'Добавить в историю',
  storyOf: (name) => `История: ${name}`,
};

const NOTE_CARD_MESSAGES: Translations['NOTE_CARD_MESSAGES'] = {
  pinned: 'Закреплено',
  locked: 'Защищено',
  attachments: (n) =>
    plural('ru', n, {
      one: '{n} вложение',
      few: '{n} вложения',
      many: '{n} вложений',
      other: '{n} вложения',
    }),
  select: 'Выбрать заметку',
  checklistDone: 'Выполнено',
  checklistTodo: 'Не выполнено',
  more: (n) => `ещё ${n}`,
};

const DIALOG_MESSAGES: Translations['DIALOG_MESSAGES'] = {
  view: 'Вид',
  dismissDialog: 'Закрыть диалоговое окно',
  dismissNamed: (label) => `Закрыть: ${label}`,
};

const ALERT_DIALOG_MESSAGES: Translations['ALERT_DIALOG_MESSAGES'] = {
  confirm: 'Подтвердить',
};

const SIDEBAR_MESSAGES: Translations['SIDEBAR_MESSAGES'] = {
  sidebar: 'Боковая панель',
  collapse: 'Свернуть боковую панель',
  expand: 'Развернуть боковую панель',
  close: 'Закрыть боковую панель',
  quickSearch: 'Быстрый поиск',
  searchPlaceholder: 'Поиск по навигации…',
  searchPlaceholderCompact: 'Поиск...',
  filter: 'Фильтр навигации',
  clearSearch: 'Очистить поиск по навигации',
  noResults: 'Ничего не найдено',
  mode: 'Режим',
  upgrade: 'Улучшить тариф',
  usersWithAccess: 'Пользователи с доступом',
  addUser: 'Добавить пользователя',
  manage: 'Управление',
  accountMenu: 'Меню аккаунта',
  teamMenu: (team) => `Меню ${team}`,
};

const FILE_SIZE_UNITS: Translations['FILE_SIZE_UNITS'] = {
  byte: 'Б',
  kilobyte: 'КБ',
  megabyte: 'МБ',
  gigabyte: 'ГБ',
};

const CARD_FORM_MESSAGES: Translations['CARD_FORM_MESSAGES'] = {
  labels: {
    number: 'Номер карты',
    expiry: 'Срок действия',
    securityCode: 'Код безопасности',
    name: 'Имя на карте',
    postcode: 'Почтовый индекс',
    country: 'Страна',
  },
  selectCountry: 'Выберите страну',
};

const CHAT_COMPOSER_MESSAGES: Translations['CHAT_COMPOSER_MESSAGES'] = {
  attach: 'Прикрепить',
  emoji: 'Эмодзи',
  camera: 'Камера',
  mic: 'Записать голосовое сообщение',
  message: 'Сообщение',
  enterHint: 'Enter — отправить · Shift + Enter — новая строка',
  modEnterHint: '⌘ + Enter — отправить · Enter — новая строка',
  cancelRecording: 'Отменить запись',
  sendVoice: 'Отправить голосовое сообщение',
  deleteRecording: 'Удалить запись',
  playRecording: 'Воспроизвести запись',
  pauseRecording: 'Приостановить запись',
  lockRecording: 'Закрепить запись',
  slideToCancel: 'Проведите, чтобы отменить',
  recording: 'Идёт запись',
  searchEmoji: 'Поиск эмодзи',
  noEmoji: 'Эмодзи не найдены',
  frequentlyUsed: 'Часто используемые',
  skinTone: 'Оттенок кожи',
  emojiPicker: 'Выбор эмодзи',
  moreReactions: 'Другие реакции',
  quickReactions: 'Быстрые реакции',
  messageActions: 'Действия с сообщением',
  attachments: 'Вложения',
  removeAttachment: (name) => `Удалить ${name}`,
  suggestions: { mention: 'Люди', command: 'Команды', emoji: 'Эмодзи' },
  suggestionVerified: 'Подтверждён',
  searchingSuggestions: 'Поиск…',
  noSuggestions: {
    mention: 'Никого не найдено',
    command: 'Команды не найдены',
    emoji: 'Эмодзи не найдены',
  },
  attachmentItems: {
    gallery: 'Галерея',
    camera: 'Камера',
    file: 'Файл',
    location: 'Геопозиция',
    contact: 'Контакт',
    poll: 'Опрос',
    music: 'Музыка',
  },
};

const MAIL_COMPOSE_MESSAGES: Translations['MAIL_COMPOSE_MESSAGES'] = {
  to: 'Кому',
  cc: 'Копия',
  bcc: 'Скрытая копия',
  subject: 'Тема',
  showCopies: 'Копия, скрытая',
  hideCopies: 'Скрыть поля копии',
  removeRecipient: (name) => `Удалить: ${name}`,
  suggestions: 'Контакты',
  send: COMMON_MESSAGES.send,
  sending: 'Отправка',
  attach: 'Прикрепить файл',
  discard: 'Удалить черновик',
  minimize: 'Свернуть',
  expand: 'Развернуть',
  close: COMMON_MESSAGES.close,
  title: 'Новое сообщение',
};

const MEDIA_PLAYER_MESSAGES: Translations['MEDIA_PLAYER_MESSAGES'] = {
  lyrics: 'Текст песни',
  queue: 'Очередь',
  devices: 'Подключиться к устройству',
  fullscreen: 'Во весь экран',
  openPlayer: 'Открыть плеер',
  currentDevice: 'Текущее устройство',
  listeningOn: 'Воспроизводится на',
  listeningOnDevice: (d) => `Воспроизводится на устройстве ${d}`,
  selectDevice: 'Выберите устройство',
  noDevices: 'Другие устройства не найдены',
  deviceHelp: 'Не видите своё устройство?',
  playbackSpeed: 'Скорость воспроизведения',
  sleepTimer: 'Таймер сна',
  sleepOff: 'Выкл.',
  endOfEpisode: 'Конец выпуска',
  oneHour: '1 час',
  minutes: (n) =>
    plural('ru', n, {
      one: '{n} минута',
      few: '{n} минуты',
      many: '{n} минут',
      other: '{n} минуты',
    }),
  stopsIn: (r) => `Остановится через ${r}`,
  shuffle: 'Перемешать',
  repeat: 'Повторять',
  repeatOne: 'Повторять трек',
  skipBack: (n) =>
    plural('ru', n, {
      one: 'Назад на {n} секунду',
      few: 'Назад на {n} секунды',
      many: 'Назад на {n} секунд',
      other: 'Назад на {n} секунды',
    }),
  skipForward: (n) =>
    plural('ru', n, {
      one: 'Вперёд на {n} секунду',
      few: 'Вперёд на {n} секунды',
      many: 'Вперёд на {n} секунд',
      other: 'Вперёд на {n} секунды',
    }),
  closePlayer: 'Закрыть плеер',
  share: 'Поделиться',
  showLyrics: 'Показать текст',
};

const ADDRESS_MESSAGES: Translations['ADDRESS_MESSAGES'] = {
  emptyTitle: 'Здесь пока ничего нет',
  addresses: 'Адреса',
};

const CREATOR_STUDIO_MESSAGES: Translations['CREATOR_STUDIO_MESSAGES'] = {
  releaseTypes: { single: 'Сингл', ep: 'Мини-альбом', album: 'Альбом' },
  releaseStatuses: {
    draft: 'Черновик',
    'in-review': 'На проверке',
    scheduled: 'Запланирован',
    live: 'Опубликован',
    rejected: 'Отклонён',
    takedown: 'Снят с публикации',
  },
  creditRoles: {
    songwriter: 'Автор песни',
    producer: 'Продюсер',
    composer: 'Композитор',
    performer: 'Исполнитель',
    lyricist: 'Автор текста',
    'mixing-engineer': 'Звукорежиссёр сведения',
    'mastering-engineer': 'Звукорежиссёр мастеринга',
  },
  periods: { '7d': '7 дней', '28d': '28 дней', '12m': '12 месяцев', all: 'Всё время' },
  artworkNotSquare: (w, h) => `Обложка должна быть квадратной, а это изображение — ${w}×${h} пикс.`,
  artworkTooSmall: (w, h, min) =>
    `Обложка слишком маленькая (${w}×${h} пикс.). Загрузите изображение не меньше ${min}×${min} пикс.`,
  audience: { title: 'Аудитория', period: 'Период' },
  breakdown: {
    locations: 'Основные регионы',
    cities: 'Города',
    countries: 'Страны',
    age: 'Возраст',
    gender: 'Пол',
    sources: 'Источники прослушиваний',
    metric: 'Слушатели',
  },
  streams: {
    metrics: 'Показатель графика',
    summary: (metric, releases) =>
      releases ? `${metric} в динамике; релизы: ${releases}` : `${metric} в динамике`,
  },
  topTracks: {
    title: 'Популярные треки',
    rank: '#',
    rankName: 'Место',
    track: 'Трек',
    streams: 'Прослушивания',
    listeners: 'Слушатели',
    saves: 'Сохранения',
    trend: 'Динамика',
    trends: { up: 'Растёт', down: 'Падает', flat: 'Без изменений', new: 'Новинка' },
    newBadge: 'Новый',
    empty: 'За этот период прослушиваний пока нет.',
  },
  tracks: (n) =>
    plural('ru', n, { one: '{n} трек', few: '{n} трека', many: '{n} треков', other: '{n} трека' }),
  timeline: {
    states: {
      complete: 'завершено',
      current: 'выполняется',
      upcoming: 'не начато',
      error: 'требует внимания',
    },
    label: 'Ход релиза',
  },
  upload: {
    queued: 'В очереди',
    processing: 'Перекодирование…',
    ready: 'Готово',
    failed: 'Не удалось загрузить',
    remove: (name) => `Убрать ${name}`,
    progress: (name) => `Загрузка: ${name}`,
  },
  artwork: {
    title: 'Обложка',
    requirements: '3000×3000 пикс., JPG или PNG',
    replace: 'Заменить',
    remove: 'Убрать обложку',
    preview: 'Обложка релиза',
    upload: 'Загрузить обложку',
  },
  credits: {
    title: 'Участники',
    role: 'Роль',
    name: 'Имя',
    add: 'Добавить участника',
    remove: (index, name) =>
      name ? `Убрать участника ${index + 1}, ${name}` : `Убрать участника ${index + 1}`,
    empty: 'Укажите авторов, продюсеров и исполнителей этого трека.',
    field: (field, n) => `${field}, участник ${n}`,
  },
  artists: {
    add: 'Добавить',
    addTo: (label) => `Добавить: ${label}`,
    remove: (name) => `Убрать ${name}`,
  },
  isrc: { hint: 'Формат: CC-XXX-YY-NNNNN', invalid: 'Это недействительный код ISRC' },
  metadata: {
    title: 'Название трека',
    version: 'Версия',
    versionPlaceholder: 'Ремикс, концертная, акустическая…',
    explicit: 'Откровенный текст',
    explicitDescription: 'Включите, если в треке есть грубая лексика или откровенные темы.',
    genre: 'Жанр',
    genrePlaceholder: 'Выберите жанр',
    primaryArtists: 'Основные исполнители',
    featuredArtists: 'Приглашённые исполнители',
    artistPlaceholder: 'Добавьте имя исполнителя',
    language: 'Язык текста',
    languagePlaceholder: 'Выберите язык',
    lyrics: 'Текст песни',
    lyricsPlaceholder: 'Вставьте текст — по одной строке на каждую спетую строку',
  },
  payout: {
    estimated: 'Ожидаемый доход за этот месяц',
    lastPayout: 'Последняя выплата',
    nextPayout: 'Следующая выплата',
    statements: 'Посмотреть отчёты',
    chart: 'Доход по месяцам',
  },
  pitch: {
    title: 'Питч для редакции',
    description: 'Расскажите редакции о своём следующем релизе до его выхода.',
    release: 'Релиз',
    releasePlaceholder: 'Выберите предстоящий релиз',
    moods: 'Настроение',
    genres: 'Жанр',
    pitch: 'Ваш питч',
    pitchPlaceholder: 'Чем выделяется этот релиз? Для кого он и какая история за ним стоит?',
    submit: 'Отправить питч',
    tagLimit: (max) => `Выберите до ${max}`,
    statuses: {
      submitted: 'Питч отправлен',
      accepted: 'Отобран для рассмотрения',
      declined: 'На этот раз не выбран',
    },
    statusDescriptions: {
      submitted: 'Редакция читает каждый питч. Вы получите ответ до даты релиза.',
      accepted: 'Ваш релиз рассматривается для редакционных плейлистов.',
      declined:
        'Этот релиз не выбран. Вы сможете предложить следующий, как только он будет запланирован.',
    },
    edit: 'Изменить питч',
  },
};

const PROPERTY_INSIGHTS_MESSAGES: Translations['PROPERTY_INSIGHTS_MESSAGES'] = {
  energy: 'Энергия',
  pending: 'Ожидается',
  energyRatingClass: (r) => `Класс энергоэффективности ${r}`,
  energyRatingStatus: (s) => `Класс энергоэффективности: ${String(s).toLowerCase()}`,
  energyRating: 'Класс энергоэффективности',
  certificateInProgress: 'Сертификат оформляется',
  consumption: 'Потребление',
  emissions: 'Выбросы',
  moreEfficient: 'Более эффективно',
  lessEfficient: 'Менее эффективно',
  walkTime: (t) => `${t} пешком`,
  scoreOutOf: (d, m) => `${d} из ${m}`,
  pricePerSquareMetre: 'Цена за квадратный метр',
  rentHistory: 'История аренды',
  rentHistoryEmpty: 'Для этого жилья пока нет истории',
  confidence: {
    low: 'Низкая достоверность',
    medium: 'Средняя достоверность',
    high: 'Высокая достоверность',
  },
  aboveEstimate: (p) => `На ${p} выше оценки`,
  belowEstimate: (p) => `На ${p} ниже оценки`,
  fairPrice: 'Справедливая цена',
  estimatedPrice: 'Оценочная цена',
  asking: 'Запрашиваемая цена',
  noVerdict: 'Недостаточно данных для вывода',
  whyThisEstimate: 'Почему такая оценка',
  comparables: (n) =>
    plural('ru', n, {
      one: 'На основе {n} похожего объекта',
      few: 'На основе {n} похожих объектов',
      many: 'На основе {n} похожих объектов',
      other: 'На основе {n} похожих объектов',
    }),
  currentPrice: 'Текущая цена',
  now: 'Сейчас',
  noPriceHistory: 'Истории цен пока нет',
  priceHistoryPeriod: 'Период истории цен',
  priceHistory: 'История цен',
  priceHistoryTrend: (head, a, aw, b, bw) => `${head}: с ${a} (${aw}) до ${b} (${bw}).`,
};

const MAP_MARKER_MESSAGES: Translations['MAP_MARKER_MESSAGES'] = {
  searchAsMapMoves: 'Искать при перемещении карты',
  searchThisArea: 'Искать в этой области',
  stays: (n) =>
    mapMarker_countOf('ru', n, {
      one: '{n} вариант жилья',
      few: '{n} варианта жилья',
      many: '{n} вариантов жилья',
      other: '{n} варианта жилья',
    }),
};

const LISTING_ACTIONS_MESSAGES: Translations['LISTING_ACTIONS_MESSAGES'] = {
  month: 'месяц',
  rentalStatus: { available: 'Доступно', reserved: 'Забронировано', rented: 'Сдано' },
  rentalStatusMessage: {
    reserved: 'Другой соискатель заключает договор. Новые просмотры приостановлены.',
    rented: 'Это жильё уже сдано и больше не принимает заявки.',
  },
  saleStatus: { available: 'В продаже', reserved: 'Забронировано', sold: 'Продано' },
  saleStatusMessage: {
    reserved: 'Предложение принято. Агент пока не назначает просмотры.',
    sold: 'Это жильё продано.',
  },
  requestViewing: 'Запросить просмотр',
  apply: 'Подать заявку',
  contactAgent: 'Связаться с агентом',
  requestVisit: 'Запросить просмотр',
  makeOffer: 'Сделать предложение',
  yourHome: 'Ваше жильё',
  theirHome: 'Их жильё',
  dates: 'Даты',
  guests: 'Гости',
  addDates: 'Добавить даты',
  addGuests: 'Добавить гостей',
  proposeSwap: 'Предложить обмен',
  exchangeModes: { swap: 'Взаимный обмен', host: 'Гостевые баллы', both: 'Любой' },
  scheduleViewing: 'Записаться на просмотр',
  noTimesLeft: 'На этот день свободного времени не осталось',
  noteForLandlord: 'Сообщение арендодателю',
  day: 'День',
  time: 'Время',
  submitViewing: 'Запросить просмотр',
  inPerson: 'Лично',
  videoCall: 'Видеозвонок',
  viewingType: 'Формат просмотра',
  yourApplication: 'Ваша заявка',
  applicationProgress: 'Готовность заявки',
  progressReady: (done, total) => `Готово: ${done} из ${total}`,
  applicationStatus: {
    missing: 'Отсутствует',
    uploaded: 'На проверке',
    verified: 'Проверено',
    rejected: 'Отклонено',
  },
  applicationAction: { upload: 'Загрузить', view: 'Открыть', replace: 'Заменить' },
  itemAction: (action, title) => `${action}: ${title}`,
  mortgage: {
    title: 'Ипотечный калькулятор',
    price: 'Стоимость жилья',
    downPayment: 'Первоначальный взнос',
    downPaymentPercent: 'Первоначальный взнос в процентах',
    percent: 'Процент',
    term: 'Срок кредита',
    years: 'лет',
    rate: 'Процентная ставка',
    monthlyPayment: 'Ежемесячный платёж',
    principal: 'Основной долг',
    interest: 'Проценты',
    loanAmount: 'Сумма кредита',
    totalInterest: 'Переплата по процентам',
    totalCost: 'Общая стоимость',
  },
  termYears: (n) =>
    plural('ru', n, { one: '{n} год', few: '{n} года', many: '{n} лет', other: '{n} года' }),
  mortgageDisclaimer:
    'Это оценка, а не предложение. Без учёта комиссий, налогов и страховки; ставка считается фиксированной на весь срок.',
};

const AGENT_PROGRESS_MESSAGES: Translations['AGENT_PROGRESS_MESSAGES'] = {
  stepsLeft: (n) =>
    plural('ru', n, {
      one: 'Остался {n} шаг',
      few: 'Осталось {n} шага',
      many: 'Осталось {n} шагов',
      other: 'Осталось {n} шага',
    }),
  allCompleted: 'Все шаги выполнены',
  minimize: 'Свернуть шаги',
  expand: 'Развернуть шаги',
  defaultSteps: [
    'Прочитать файлы проекта',
    'Обновить и установить токены светлой темы',
    'Реализовать токены тёмной темы',
    'Добавить переиспользуемый зарегистрированный переключатель темы',
    'Запустить реестр, линтер и продакшен-сборку',
  ],
};

const CALENDAR_MESSAGES: Translations['CALENDAR_MESSAGES'] = {
  newEvent: 'Новое событие',
  openNavigation: 'Открыть навигацию',
  month: 'Месяц',
  moreEvents: (n) => plural('ru', n, { other: 'Ещё {n}' }),
  eventDetails: 'Сведения о событии',
  join: 'Присоединиться',
  editTimeZone: 'Изменить часовой пояс',
  participants: 'Участники',
  editParticipants: 'Изменить участников',
  reminders: 'Напоминания',
  editReminders: 'Изменить напоминания',
  duration: calendar_compactDuration(' ч', ' мин', ' '),
  jumpToDate: 'Перейти к дате',
  previousMonth: 'Предыдущий месяц',
  nextMonth: 'Следующий месяц',
  chooseDate: (month) => `${month}, выбрать дату`,
  inbox: 'Входящие',
  inboxMenu: 'Меню входящих',
  addAccount: 'Добавить аккаунт',
};

const LISTING_DETAILS_MESSAGES: Translations['LISTING_DETAILS_MESSAGES'] = {
  ratedOutOf5: (r) => `Оценка ${r} из 5`,
  overallRating: 'Общая оценка',
  unavailable: 'Недоступно',
  showAllAmenities: (n) =>
    plural('ru', n, {
      one: 'Показать {n} удобство',
      few: 'Показать все {n} удобства',
      many: 'Показать все {n} удобств',
      other: 'Показать все {n} удобств',
    }),
  showAllFeatures: (n) =>
    plural('ru', n, {
      one: 'Показать {n} характеристику',
      few: 'Показать все {n} характеристики',
      many: 'Показать все {n} характеристик',
      other: 'Показать все {n} характеристик',
    }),
  propertyFeatures: 'Характеристики объекта',
  showAllPhotos: 'Показать все фото',
  listingPhotos: 'Фото объявления',
  photoOf: (p, t) => `Фото ${p} из ${t}`,
  photoWithAlt: (a, p, t) => `${a}, фото ${p} из ${t}`,
  floorPlanOf: (a, p, t) => `${a}, планировка ${p} из ${t}`,
  landlord: 'Арендодатель',
  agent: 'Агент',
  agency: 'Агентство',
  activeListings: (n) =>
    plural('ru', n, {
      one: '{n} активное объявление',
      few: '{n} активных объявления',
      many: '{n} активных объявлений',
      other: '{n} активных объявлений',
    }),
  verified: 'Подтверждено',
  showPhone: 'Показать телефон',
  call: 'Позвонить',
  messageHost: 'Написать хозяину',
  message: 'Написать',
};

const PRICE_BREAKDOWN_MESSAGES: Translations['PRICE_BREAKDOWN_MESSAGES'] = {
  states: { estimated: 'Предварительно', pending: 'Уточняется' },
  showDetails: 'Показать детали цены',
  hideDetails: 'Скрыть детали цены',
  breakdown: 'Детализация цены',
  about: (label) => `Подробнее: ${label}`,
};

const DATE_PICKER_MESSAGES: Translations['DATE_PICKER_MESSAGES'] = {
  cancel: 'Отмена',
  apply: 'Применить',
  previousMonth: 'Предыдущий месяц',
  nextMonth: 'Следующий месяц',
  datePlaceholder: 'Выберите дату',
  dateLabel: 'Дата',
  rangePlaceholder: 'Выберите период',
  rangeLabel: 'Период',
  startDate: 'Дата начала',
  endDate: 'Дата окончания',
  daysSelected: (n) =>
    plural('ru', n, {
      one: 'Выбран {n} день',
      few: 'Выбрано {n} дня',
      many: 'Выбрано {n} дней',
      other: 'Выбрано {n} дня',
    }),
  presets: {
    today: 'Сегодня',
    yesterday: 'Вчера',
    lastWeek: 'Прошлая неделя',
    thisMonth: 'Этот месяц',
    lastMonth: 'Прошлый месяц',
    thisYear: 'Этот год',
    lastYear: 'Прошлый год',
    allTime: 'Всё время',
  },
  meetingTrigger: 'Запланировать встречу',
  meetingLabel: 'Запланировать встречу',
  send: 'Отправить приглашение',
  selectTime: 'Выберите время',
  duration: (n) =>
    plural('ru', n, {
      one: '{n} минута',
      few: '{n} минуты',
      many: '{n} минут',
      other: '{n} минуты',
    }),
};

const SHIPMENT_REQUEST_MESSAGES: Translations['SHIPMENT_REQUEST_MESSAGES'] = {
  kinds: {
    envelope: { label: 'Конверт', description: 'Документы, ключи, всё плоское.' },
    parcel: { label: 'Посылка', description: 'Коробка или сумка, которую унесёт один человек.' },
    furniture: {
      label: 'Мебель',
      description: 'Диван, стол, матрас — по два человека с каждой стороны.',
    },
    pallet: { label: 'Паллета', description: 'Упакованная и уложенная, грузится гидробортом.' },
    food: { label: 'Еда', description: 'Заказ из ресторана с нужной температурой.' },
  },
  sizes: {
    small: 'До обувной коробки — 35 × 25 × 20 см.',
    medium: 'До ручной клади — 55 × 40 × 25 см.',
    large: 'До стиральной машины — 85 × 60 × 60 см.',
    extraLarge: 'Больше — опишите в примечаниях.',
  },
  access: { ground: 'Первый этаж', stairs: 'Лестница', lift: 'Лифт' },
  load: {
    kind: 'Что везём?',
    size: 'Размер',
    weight: 'Вес',
    quantity: 'Количество',
    quantityValue: (n) =>
      plural('ru', n, { one: '{n} место', few: '{n} места', many: '{n} мест', other: '{n} места' }),
    notes: 'Что ещё нужно знать перевозчику?',
    notesPlaceholder: 'Хрупкое, код лифта, где оставить…',
  },
  options: { extras: 'Дополнительно', access: 'Доступ в обоих адресах', window: 'Когда забрать?' },
  form: {
    route: 'Маршрут',
    routeDescription: 'Сначала погрузка, в конце выгрузка.',
    load: 'Груз',
    photos: 'Фото',
    photosDescription: 'Фото груза сильнее всего улучшает предложения, которые вы получите.',
    options: 'Параметры',
    optionsDescription: 'Каждый из них влияет на цену.',
    price: 'Цена',
  },
  shipmentRequest: 'Заявка на перевозку',
};

const LABEL_MESSAGES: Translations['LABEL_MESSAGES'] = { required: 'обязательно' };

const CHECKOUT_SUMMARY_MESSAGES: Translations['CHECKOUT_SUMMARY_MESSAGES'] = {
  title: 'Проверьте заказ',
  orderSummary: 'Сводка заказа',
  deliverTo: 'Адрес доставки',
  notChosen: 'Не выбрано',
  opensPicker: 'Открывает выбор',
  placeOrder: 'Оформить заказ',
  placingOrder: 'Оформляем заказ',
};

const VEHICLE_PICKER_MESSAGES: Translations['VEHICLE_PICKER_MESSAGES'] = {
  from: 'От',
  fits: (label) => `Что помещается: ${label}`,
  unavailable: 'Не подходит для этого груза',
  vehicle: 'Транспорт',
  vehicles: {
    bike: {
      label: 'Грузовой велосипед',
      capacity: 'До 25 кг · 60 × 40 × 40 см',
      fits: ['Документы', 'Заказ еды', 'Небольшая коробка'],
    },
    car: {
      label: 'Легковой автомобиль',
      capacity: 'До 150 кг · 100 × 80 × 60 см',
      fits: ['Два чемодана', 'Четыре коробки', 'Велосипед'],
    },
    van: {
      label: 'Фургон',
      capacity: 'До 800 кг · 240 × 150 × 140 см',
      fits: ['Диван', 'Переезд из студии', 'Полпаллеты'],
    },
    boxTruck: {
      label: 'Грузовик с кузовом',
      capacity: 'До 3500 кг · 420 × 200 × 210 см',
      fits: ['Две паллеты', 'Переезд из двухкомнатной квартиры', 'Гидроборт'],
    },
    refrigerated: {
      label: 'Рефрижератор',
      capacity: 'До 700 кг · при 2–8 °C',
      fits: ['Свежие продукты', 'Охлаждённый кейтеринг', 'Цветы'],
    },
  },
};

const COMPOSER_PANEL_MESSAGES: Translations['COMPOSER_PANEL_MESSAGES'] = {
  message: 'Сообщение',
  add: 'Прикрепить файл',
  addMenu: 'Добавить в чат',
  permissions: 'Разрешения',
  permissionMode: 'Режим разрешений',
  learnMore: 'Подробнее',
  voice: 'Голосовой ввод',
  send: 'Отправить сообщение',
  stop: 'Остановить генерацию',
  permissionTrigger: (mode) => `Разрешения: ${mode}`,
  removeFile: (name) => `Убрать ${name}`,
  retryFile: (name) => `Повторить загрузку ${name}`,
  panelPlaceholder: 'Привет! Чем помочь сегодня?',
  pillPlaceholder: 'Спросите о чём угодно',
  pillCompactPlaceholder: 'Спросите',
  modelSettings: 'Настройки модели',
  models: 'Модели',
  modelGroup: 'Модель',
  effort: 'Усилие',
  effortAuto: 'Авто',
  faster: 'Быстрее',
  smarter: 'Умнее',
  quickSearch: 'Быстрый поиск',
  searchModels: 'Поиск моделей',
  closeSearch: 'Закрыть поиск',
  noMatches: 'Нет подходящих моделей',
  providers: 'Провайдеры',
  matchingModels: 'Подходящие модели',
  providerModels: (provider) => `Модели ${provider}`,
  localFolders: 'Локальные папки',
  context: (percent) => `Контекст ${percent}%`,
  effortLevels: [
    'Низкий',
    'Средний',
    'Сбалансированный',
    'Высокий',
    'Очень высокий',
    'Максимальный',
  ],
  permissionModes: {
    auto: { label: 'Авто', description: 'Агент решает сам' },
    manual: { label: 'Вручную', description: 'Всегда спрашивать перед изменением' },
    plan: { label: 'Режим плана', description: 'Составить план, прежде чем продолжить' },
    bypass: { label: 'Пропускать всё', description: 'Агент сам решает вопросы разрешений' },
  },
  addMenuRows: {
    add: 'Добавить',
    plugins: 'Плагины',
    files: 'Файлы и папки',
    goal: 'Цель',
    goalDescription: 'Задайте цель, чтобы быстрее получить результат',
    plan: 'Режим плана',
    planDescription: 'Управляйте сложными задачами',
    documents: 'Документы',
    documentsDescription: 'Создавайте и редактируйте документы',
    spreadsheets: 'Таблицы',
    spreadsheetsDescription: 'Создавайте таблицы',
    presentations: 'Презентации',
    presentationsDescription: 'Создавайте маркетинговые материалы',
    code: 'Блоки кода',
    codeDescription: 'Пишите и редактируйте существующий код',
  },
};

const MESSAGE_BUBBLE_MESSAGES: Translations['MESSAGE_BUBBLE_MESSAGES'] = {
  forwardedFrom: (name) => `Переслано от ${name}`,
  deleted: 'Сообщение удалено',
  retry: 'Отправить ещё раз',
  addReaction: 'Добавить реакцию',
  replyTo: 'Перейти к цитируемому сообщению',
  selected: 'Выбрано',
  pending: 'Отправляется',
  failed: 'Не отправлено',
  reactionSelected: 'выбрано',
  unread: 'Непрочитанные сообщения',
  typing: 'Печатает…',
};

const PAYMENT_STATUS_MESSAGES: Translations['PAYMENT_STATUS_MESSAGES'] = {
  states: {
    authorising: 'Авторизация',
    paid: 'Оплачено',
    failed: 'Платёж не прошёл',
    refunded: 'Возвращено',
    pending: 'Платёж в обработке',
  },
  reference: 'Номер',
};

const AVATAR_MESSAGES: Translations['AVATAR_MESSAGES'] = { live: 'ЭФИР' };

const PLACE_CARD_MESSAGES: Translations['PLACE_CARD_MESSAGES'] = {
  openStates: {
    open: 'Открыто',
    'closing-soon': 'Скоро закроется',
    closed: 'Закрыто',
    'opening-soon': 'Скоро откроется',
  },
  new: 'Новое',
  actions: 'Действия',
  actionsFor: (name) => `Действия: ${name}`,
  rated: (value, reviews) =>
    placeCard_withReviews(
      `Оценка ${value} из 5`,
      reviews === undefined
        ? undefined
        : placeCard_countOf('ru', reviews, {
            one: '{n} отзыв',
            few: '{n} отзыва',
            many: '{n} отзывов',
            other: '{n} отзыва',
          }),
    ),
};

const SOCIAL_BUTTON_MESSAGES: Translations['SOCIAL_BUTTON_MESSAGES'] = {
  actions: {
    continue: (b) => `Продолжить через ${b}`,
    signIn: (b) => `Войти через ${b}`,
    signUp: (b) => `Зарегистрироваться через ${b}`,
  },
};

const QUESTIONNAIRE_MESSAGES: Translations['QUESTIONNAIRE_MESSAGES'] = {
  other: 'Другое',
  otherPlaceholder: 'Введите свой ответ',
  steps: 'Шаги',
  step: (n) => `Шаг ${n}`,
};

const MAP_CONTROLS_MESSAGES: Translations['MAP_CONTROLS_MESSAGES'] = {
  group: 'Управление картой',
  locate: 'Показать моё местоположение',
  following: 'Не следовать за моим местоположением',
  zoomIn: 'Приблизить',
  zoomOut: 'Отдалить',
  zoom: 'Масштаб',
  tilt: 'Наклонить карту',
  tiltOff: 'Вернуть карту в плоский вид',
  compass: (degrees) => `Направление ${degrees}°. Сориентировать на север`,
  layerTrigger: 'Слои карты',
  layers: 'Карта',
  overlays: 'Наложения',
};

const PAYMENT_METHOD_MESSAGES: Translations['PAYMENT_METHOD_MESSAGES'] = {
  states: { expired: 'Срок истёк', declined: 'Отклонено' },
  default: 'Основной',
  add: 'Добавить способ оплаты',
  emptyTitle: 'Нет сохранённых способов оплаты',
  paymentMethods: 'Способы оплаты',
};

const AVATAR_GROUP_MESSAGES: Translations['AVATAR_GROUP_MESSAGES'] = {
  more: (n) =>
    plural('ru', n, {
      one: 'ещё {n} человек',
      few: 'ещё {n} человека',
      many: 'ещё {n} человек',
      other: 'ещё {n} человека',
    }),
  profile: 'Профиль',
};

const MENUBAR_MESSAGES: Translations['MENUBAR_MESSAGES'] = {
  menuBar: 'Строка меню',
};

const AGENT_THINKING_MESSAGES: Translations['AGENT_THINKING_MESSAGES'] = { thinking: 'Думаю' };

const AI_CHAT_MESSAGES: Translations['AI_CHAT_MESSAGES'] = {
  feedback: {
    like: 'Хороший ответ',
    dislike: 'Плохой ответ',
    copy: 'Копировать ответ',
    copied: 'Скопировано!',
  },
  imageGeneration: {
    generated: 'Изображение создано',
    generating: 'Создание изображения',
    remaining: (n) =>
      plural('ru', n, {
        one: 'Осталась {n} секунда',
        few: 'Осталось {n} секунды',
        many: 'Осталось {n} секунд',
        other: 'Осталось {n} секунды',
      }),
    likeToast: 'Спасибо за отзыв',
    dislikeToast: 'Спасибо, это поможет нам стать лучше',
  },
  generatedImage: (alt) => `Созданное изображение: ${alt}`,
  codePanel: {
    changes: 'Изменения',
    browser: 'Браузер',
    uncommitted: (n) =>
      plural('ru', n, {
        one: '{n} незафиксированное изменение',
        few: '{n} незафиксированных изменения',
        many: '{n} незафиксированных изменений',
        other: '{n} незафиксированного изменения',
      }),
    undo: 'Отменить изменения',
    browserPreview: 'Предпросмотр в браузере',
  },
  galleryPanel: {
    gallery: 'Галерея',
    styles: 'Стили',
    stylePresets: 'Готовые стили',
    enlarge: (prompt) => `Увеличить: ${prompt}`,
    minimize: (prompt) => `Уменьшить: ${prompt}`,
    download: (prompt) => `Скачать: ${prompt}`,
  },
  panelView: 'Вид панели',
  openTerminal: 'Открыть терминал',
  newGeneration: 'Новая генерация',
  expandPanel: 'Развернуть панель',
  togglePanel: 'Показать или скрыть панель',
  container: { breadcrumb: 'Расположение чата', share: 'Поделиться чатом' },
  shell: {
    openNavigation: 'Открыть навигацию',
    closeNavigation: 'Закрыть навигацию',
    openPanel: (panel) => `Открыть панель «${panel}»`,
    closePanel: (panel) => `Закрыть панель «${panel}»`,
  },
  code: 'Код',
};

const COMMAND_MESSAGES: Translations['COMMAND_MESSAGES'] = {
  placeholder: 'Введите команду или запрос…',
  empty: 'Ничего не найдено.',
  palette: 'Палитра команд',
  clearSearch: 'Очистить поиск',
};

const MUSIC_LIBRARY_MESSAGES: Translations['MUSIC_LIBRARY_MESSAGES'] = {
  kinds: {
    playlist: 'Плейлист',
    artist: 'Исполнитель',
    album: 'Альбом',
    podcast: 'Подкаст',
    audiobook: 'Аудиокнига',
    folder: 'Папка',
  },
  library: {
    title: 'Моя медиатека',
    create: 'Создать плейлист или папку',
    collapseRail: 'Свернуть медиатеку',
    expandRail: 'Открыть медиатеку',
    filters: 'Фильтры',
    clearFilters: 'Сбросить фильтры',
    filter: {
      playlists: 'Плейлисты',
      artists: 'Исполнители',
      albums: 'Альбомы',
      podcasts: 'Подкасты',
      audiobooks: 'Аудиокниги',
    },
    downloaded: 'Скачанное',
    search: 'Искать в медиатеке',
    searchPlaceholder: 'Искать в медиатеке',
    clearSearch: 'Очистить поиск',
    sortAndView: 'Сортировка и вид',
    sortBy: 'Сортировать',
    viewAs: 'Вид',
    sort: {
      recents: 'Недавние',
      'recently-added': 'Недавно добавленные',
      alphabetical: 'По алфавиту',
      creator: 'По автору',
    },
    view: { compact: 'Компактный', list: 'Список', grid: 'Сетка' },
    empty: 'Здесь пока ничего нет',
  },
  item: { pinned: 'Закреплено', downloaded: 'Скачано', nowPlaying: 'Сейчас играет' },
  search: { placeholder: 'Что хотите послушать?', clear: 'Очистить поиск', browse: 'Обзор' },
  resultTypes: 'Типы результатов',
  topResultKinds: {
    song: 'Трек',
    artist: 'Исполнитель',
    album: 'Альбом',
    playlist: 'Плейлист',
    podcast: 'Подкаст',
    episode: 'Выпуск',
    audiobook: 'Аудиокнига',
    profile: 'Профиль',
  },
  recent: {
    title: 'Недавние запросы',
    clearAll: 'Очистить недавние запросы',
    remove: (title) => `Убрать ${title}`,
  },
};

const LISTING_CARD_MESSAGES: Translations['LISTING_CARD_MESSAGES'] = {
  statuses: {
    reserved: 'Забронировано',
    sold: 'Продано',
    rented: 'Сдано',
    unavailable: 'Недоступно',
  },
  originally: (p) => `ранее ${p}`,
  approximateLocation: 'Примерное местоположение',
  rated: (r) => `Оценка ${r} из 5`,
  ratedWithReviews: (r, c) =>
    plural('ru', c, {
      one: `Оценка ${r} из 5, ${c} отзыв`,
      few: `Оценка ${r} из 5, ${c} отзыва`,
      many: `Оценка ${r} из 5, ${c} отзывов`,
      other: `Оценка ${r} из 5, ${c} отзыва`,
    }),
  newListing: 'Новое',
  previousPhoto: 'Предыдущее фото',
  nextPhoto: 'Следующее фото',
  saveToWishlist: 'Добавить в избранное',
  removeFromWishlist: 'Удалить из избранного',
};

const NAVIGATION_BANNER_MESSAGES: Translations['NAVIGATION_BANNER_MESSAGES'] = {
  states: { 'off-route': 'Вы сошли с маршрута', rerouting: 'Поиск нового маршрута' },
  thenLine: (street, maneuver) =>
    navigationBanner_words('затем', navigationBanner_midSentence(maneuver, 'ru'), street),
  laneGuidance: 'Подсказка по полосам',
  laneCount: (n) =>
    plural('ru', n, {
      one: '{n} полоса',
      few: '{n} полосы',
      many: '{n} полос',
      other: '{n} полосы',
    }),
  laneNumber: (n) => `полосу ${n}`,
  and: (a, b) => `${a} и ${b}`,
  useLanes: (lanes) => `займите ${lanes}`,
  speedLimit: (limit) => `Ограничение скорости ${limit}`,
  overLimit: 'превышение',
  arrival: 'Прибытие',
  left: 'Осталось',
  distance: 'Расстояние',
  end: 'Завершить',
};

const LOCATION_PUCK_MESSAGES: Translations['LOCATION_PUCK_MESSAGES'] = {
  states: {
    locating: 'Определение вашего местоположения',
    located: 'Ваше местоположение',
    stale: 'Ваше последнее известное местоположение',
  },
  facing: (state, degrees) => `${state}, направление ${degrees}°`,
};

const CAROUSEL_MESSAGES: Translations['CAROUSEL_MESSAGES'] = {
  previousSlide: 'Предыдущий слайд',
  nextSlide: 'Следующий слайд',
  goToSlide: (n) => `Перейти к слайду ${n}`,
  slideOf: (at, of) => `${at} из ${of}`,
  carouselRole: 'карусель',
  slideRole: 'слайд',
};

const ORDER_STATUS_MESSAGES: Translations['ORDER_STATUS_MESSAGES'] = {
  states: { current: 'В процессе', upcoming: 'Ещё не начато', failed: 'Ошибка' },
  status: 'Статус',
};

const RATING_MESSAGES: Translations['RATING_MESSAGES'] = {
  newRating: 'Новое',
  reviews: (c) =>
    rating_countForms('ru', c, {
      one: '{n} отзыв',
      few: '{n} отзыва',
      many: '{n} отзывов',
      other: '{n} отзыва',
    }),
  rated: (v) => `Оценка ${v} из 5`,
  ratedWithReviews: (v, r) => `Оценка ${v} из 5, ${r}`,
  star: (n) =>
    plural('ru', n, {
      one: '{n} звезда',
      few: '{n} звезды',
      many: '{n} звёзд',
      other: '{n} звезды',
    }),
};

const LISTING_EDITOR_MESSAGES: Translations['LISTING_EDITOR_MESSAGES'] = {
  offering: {
    rent: { title: 'Аренда', description: 'Долгосрочная аренда с помесячной оплатой.' },
    sale: { title: 'Продажа', description: 'Продать жильё целиком.' },
    stay: { title: 'Посуточная аренда', description: 'Короткие поездки, цена за ночь.' },
    swap: { title: 'Обмен жильём', description: 'Обменивайтесь жильём с другими участниками.' },
    monthlyRent: 'Аренда в месяц',
    deposit: 'Залог',
    depositOption: (months) =>
      months === 0
        ? 'Нет'
        : plural('ru', months, {
            one: '{n} месяц',
            few: '{n} месяца',
            many: '{n} месяцев',
            other: '{n} месяца',
          }),
    availableFrom: 'Доступно с',
    minimumStay: 'Минимальный срок',
    months: (months) =>
      plural('ru', months, {
        one: '{n} месяц',
        few: '{n} месяца',
        many: '{n} месяцев',
        other: '{n} месяца',
      }),
    askingPrice: 'Цена продажи',
    pricePerArea: 'Цена за м²',
    pricePerAreaEmpty: 'Укажите цену',
    nightlyRate: 'Цена за ночь',
    cleaningFee: 'Плата за уборку',
    minimumNights: 'Минимум ночей',
    nights: (nights) =>
      plural('ru', nights, {
        one: '{n} ночь',
        few: '{n} ночи',
        many: '{n} ночей',
        other: '{n} ночи',
      }),
    swapMode: 'Как вы хотите обмениваться?',
    swapModes: { swap: 'Обмен жильём', host: 'Только принимать гостей', both: 'Любой вариант' },
    group: 'Как предлагается жильё?',
  },
  propertyTypes: {
    apartment: 'Квартира',
    house: 'Дом',
    room: 'Комната',
    studio: 'Студия',
    duplex: 'Двухуровневая квартира',
    penthouse: 'Пентхаус',
    coliving: 'Коливинг',
    hostel: 'Хостел',
    other: 'Другое',
  },
  propertyType: 'Тип жилья',
  addressPrecision: {
    exact: {
      title: 'Точный адрес',
      description: 'Метка стоит на здании. Подходит для жилья, которое и так легко найти.',
    },
    street: {
      title: 'Только улица',
      description:
        'Показывает улицу без номера дома. Точный адрес сообщается после бронирования или подписания.',
    },
    approximate: {
      title: 'Примерный район',
      description: 'Показывает круг радиусом около 500 м. Самый конфиденциальный вариант.',
    },
  },
  addressPrecisionLabel: 'Точность адреса',
  addressPrecisionFootnote:
    'Опубликованная карта следует этому выбору. Точный адрес видят только подтверждённые вами люди.',
  qualityTitle: 'Качество объявления',
  qualityScore: 'Оценка качества объявления',
  tips: 'Советы',
  todo: 'Не сделано',
  needsWork: 'Нужно доработать',
  good: 'Хорошо',
  excellent: 'Отлично',
  previewTitle: 'Предпросмотр',
  previewDescription: 'Так гости увидят ваше объявление.',
  card: 'Карточка',
  page: 'Страница',
  previewAs: 'Показать как',
  reviews: (n, shown) =>
    plural('ru', n, {
      one: '{s} отзыв',
      few: '{s} отзыва',
      many: '{s} отзывов',
      other: '{s} отзыва',
    }).replace('{s}', shown),
};

const MEDIA_HEADER_MESSAGES: Translations['MEDIA_HEADER_MESSAGES'] = {
  artistPick: 'Выбор исполнителя',
  saveEpisode: 'Сохранить выпуск',
  share: 'Поделиться',
  podcastEpisode: 'Выпуск подкаста',
  listeningProgress: 'Прогресс прослушивания',
  shuffle: 'Перемешать',
  download: 'Скачать',
  downloadProgress: 'Прогресс скачивания',
  follow: 'Подписаться',
  following: 'Вы подписаны',
  searchInPlaylist: 'Поиск в плейлисте',
  compactView: 'Компактный вид',
  editDetails: 'Изменить данные',
  about: 'Об исполнителе',
  discography: 'Дискография',
  showAll: 'Показать все',
  albums: 'Альбомы',
  singlesAndEps: 'Синглы и EP',
  compilations: 'Сборники',
  audiobook: 'Аудиокнига',
  popular: 'Популярные треки',
  seeMore: 'Ещё',
  podcast: 'Подкаст',
  latestEpisode: 'Последний выпуск',
  verifiedArtist: 'Подтверждённый исполнитель',
  profile: 'Профиль',
  editProfile: 'Редактировать профиль',
};

const MENU_ITEM_MESSAGES: Translations['MENU_ITEM_MESSAGES'] = {
  diets: {
    vegetarian: 'Вегетарианское',
    vegan: 'Веганское',
    'gluten-free': 'Без глютена',
    'dairy-free': 'Без лактозы',
    halal: 'Халяль',
    kosher: 'Кошерное',
  },
  spicy: 'Острота',
  spiceOf: (label, level, max) => `${label}: ${level} из ${max}`,
  originally: (price, original) => `${price}, вместо ${original}`,
  inBasket: (n) => `В корзине: ${n}`,
  soldOut: 'Нет в наличии',
  addItem: (name) => `Добавить «${name}»`,
  choose: (n) => `Выберите ${n}`,
  chooseRange: (min, max) => `Выберите от ${min} до ${max}`,
  upTo: (n) => `До ${n}`,
  optional: 'Необязательно',
  quantity: 'Количество',
  addToBasket: 'В корзину',
  options: 'Параметры',
};

const PAGINATION_MESSAGES: Translations['PAGINATION_MESSAGES'] = {
  pagination: 'Нумерация страниц',
  goToPage: (page) => `Перейти на страницу ${page}`,
};

const LEAD_SCORE_MESSAGES: Translations['LEAD_SCORE_MESSAGES'] = {
  title: 'Оценка лида',
  factors: 'Из чего складывается',
  bands: { cold: 'Холодный', warm: 'Тёплый', hot: 'Горячий' },
};

const DIRECTIONS_MESSAGES: Translations['DIRECTIONS_MESSAGES'] = {
  modes: { drive: 'Авто', transit: 'Транспорт', walk: 'Пешком', cycle: 'Велосипед' },
  traffic: { light: 'Дороги свободны', moderate: 'Умеренные пробки', heavy: 'Сильные пробки' },
  maneuvers: {
    depart: 'Начало маршрута',
    straight: 'Продолжайте прямо',
    'slight-left': 'Плавно налево',
    left: 'Поверните налево',
    'sharp-left': 'Резко налево',
    'slight-right': 'Плавно направо',
    right: 'Поверните направо',
    'sharp-right': 'Резко направо',
    uturn: 'Развернитесь',
    roundabout: 'На круговом движении',
    merge: 'Перестройтесь',
    arrive: 'Прибытие',
    board: 'Садитесь',
    alight: 'Выходите',
    transfer: 'Пересадка',
    walk: 'Идите пешком',
  },
  directions: 'Маршрут',
  otherRoutes: 'Другие маршруты',
  travelMode: 'Способ передвижения',
  start: 'Начать',
  currentStep: 'Текущий шаг',
  line: (name) => `Линия ${name}`,
};

const CART_PANEL_MESSAGES: Translations['CART_PANEL_MESSAGES'] = {
  basket: 'Корзина',
  checkout: 'К оформлению',
  emptyTitle: 'Корзина пуста',
  emptyDescription: 'Добавьте что-нибудь из меню, и это появится здесь.',
  soldOut: 'Нет в наличии',
  removeItem: (name) => `Удалить «${name}»`,
  originally: (price, original) => `${price}, вместо ${original}`,
  promoCode: 'Промокод',
  apply: 'Применить',
  tip: 'Чаевые',
};

const MEDIA_CARD_MESSAGES: Translations['MEDIA_CARD_MESSAGES'] = {
  albumTypes: { album: 'Альбом', single: 'Сингл', ep: 'EP', compilation: 'Сборник' },
  artist: 'Исполнитель',
  verified: 'Подтверждённый',
  audiobook: 'Аудиокнига',
  narratedBy: (n) => `Читает ${n}`,
  progressOf: (t) => `Прогресс: ${t}`,
  episode: 'Выпуск',
  played: 'Прослушано',
  event: 'Мероприятие',
  soldOut: 'Билеты распроданы',
  listeningNow: 'Слушает сейчас',
  trackBy: (t, a) => `${t} — ${a}`,
  mix: 'Микс',
  playlist: 'Плейлист',
  collaborative: 'Совместный',
  ownedBy: (o) => `Автор: ${o}`,
  podcast: 'Подкаст',
  profile: 'Профиль',
  followsYou: 'Подписан на вас',
  song: 'Трек',
  share: 'Поделиться',
  listened: 'Прослушано',
};

const JOB_BOARD_MESSAGES: Translations['JOB_BOARD_MESSAGES'] = {
  labels: {
    take: 'Взять заказ',
    pass: 'Пропустить',
    distance: 'Расстояние',
    duration: 'Время',
    window: 'Окно',
    pickup: 'Забор груза',
    dropoff: 'Доставка',
    state: { taken: 'Взят', expired: 'Истёк' },
    showPay: 'Показать оплату',
    hidePay: 'Скрыть оплату',
    payDetails: 'Оплата:',
    sort: 'Сортировать заказы',
    filtersToggle: 'Фильтры',
    filtersActive: (n) => `Применено: ${n}`,
    sortOptions: {
      pay: 'Лучше оплачиваемые',
      distance: 'Ближайшие',
      soonest: 'Начинаются раньше',
      expiring: 'Скоро закроются',
    },
    filters: { distance: 'Расстояние', pay: 'Оплата', when: 'Когда', vehicle: 'Транспорт' },
    clearFilters: 'Сбросить фильтры',
    refresh: 'Обновить список',
    count: (n) =>
      plural('ru', n, {
        one: '{n} заказ',
        few: '{n} заказа',
        many: '{n} заказов',
        other: '{n} заказа',
      }),
    loading: 'Загрузка заказов',
  },
  emptyTitle: 'Сейчас заказов нет',
  emptyDescription:
    'Ничего не подходит под ваш запрос. Расширьте фильтр или обновите список через минуту.',
  list: 'Заказы',
  payDetailsFor: (load) => `Оплата: ${load}`,
  route: (pickup, dropoff) => `${pickup} и ${dropoff}`,
  bands: {
    anyDistance: 'Любое расстояние',
    underKm: (km) => `До ${km} км`,
    anyTime: 'В любое время',
    withinHour: 'В течение часа',
    nextHours: (hours) =>
      `В ближайшие ${hours} ${plural('ru', hours, { one: 'час', few: 'часа', many: 'часов', other: 'часа' })}`,
    today: 'Сегодня',
  },
};

const FLOATING_MESSAGES: Translations['FLOATING_MESSAGES'] = {
  submenu: 'Подменю',
};

const AGENT_CHAT_MESSAGES: Translations['AGENT_CHAT_MESSAGES'] = {
  chat: {
    newChat: 'Новый чат',
    emptyTitle: 'Чем могу помочь?',
    emptyDescription:
      'Этот чат работает с вашим собственным API-ключом. История хранится в этом браузере.',
    thinking: 'Думаю',
    error: 'Что-то пошло не так. Проверьте журналы сервера и повторите попытку.',
    suggestions: [
      'Объясни, что делает этот стартовый проект',
      'Напиши новость о продукте в трёх предложениях',
      'Предложи пять названий для приложения-планировщика',
    ],
    you: 'Вы',
    assistant: 'Ассистент',
  },
  actions: {
    share: 'Поделиться чатом',
    shared: 'Переписка скопирована',
    more: 'Другие действия с этим чатом',
    exportChats: 'Экспортировать чаты',
    markUnread: 'Отметить как непрочитанный',
    deleteChat: 'Удалить чат',
  },
  message: {
    copy: 'Копировать сообщение',
    readAloud: 'Прочитать вслух',
    stopReading: 'Остановить чтение вслух',
  },
  history: {
    region: 'История чатов',
    recent: 'Недавние',
    empty: 'Здесь появятся начатые вами чаты.',
    rename: 'Переименовать',
    renameField: 'Переименовать чат',
    markUnread: 'Отметить как непрочитанный',
    unread: 'Непрочитанный',
    exportCount: (n) =>
      n === 0
        ? 'Нет чатов для экспорта'
        : plural('ru', n, {
            one: 'Экспортировать {n} чат',
            few: 'Экспортировать {n} чата',
            many: 'Экспортировать {n} чатов',
            other: 'Экспортировать {n} чата',
          }),
    accountMenu: (name) => `Меню аккаунта ${name}`,
    usageLeft: 'Остаток лимита',
    upgrade: 'Перейти на Max',
    logOut: 'Выйти',
  },
  composer: {
    field: 'Сообщение',
    placeholder: 'Спросите что угодно',
    attach: 'Прикрепить файл',
    send: 'Отправить сообщение',
    stop: 'Остановить генерацию',
    notConfigured: 'Не настроено',
    messageCount: (n) =>
      plural('ru', n, {
        one: '{n} сообщение',
        few: '{n} сообщения',
        many: '{n} сообщений',
        other: '{n} сообщения',
      }),
    answeringWith: (model) => `Отвечает ${model}`,
  },
  ago: {
    justNow: 'только что',
    minutes: (n) =>
      plural('ru', n, {
        one: '{n} минуту назад',
        few: '{n} минуты назад',
        many: '{n} минут назад',
        other: '{n} минуты назад',
      }),
    hours: (n) =>
      plural('ru', n, {
        one: '{n} час назад',
        few: '{n} часа назад',
        many: '{n} часов назад',
        other: '{n} часа назад',
      }),
    days: (n) =>
      plural('ru', n, {
        one: '{n} день назад',
        few: '{n} дня назад',
        many: '{n} дней назад',
        other: '{n} дня назад',
      }),
  },
  age: { now: 'сейчас', minutes: (n) => `${n} мин`, hours: (n) => `${n} ч`, days: (n) => `${n} д` },
};

const WEB_SEARCH_MESSAGES: Translations['WEB_SEARCH_MESSAGES'] = {
  sources: 'Источники',
  working: 'Работаю',
};

const MAIL_THREAD_MESSAGES: Translations['MAIL_THREAD_MESSAGES'] = {
  to: 'Кому',
  cc: 'Копия',
  bcc: 'Скрытая копия',
  reply: 'Ответить',
  replyAll: 'Ответить всем',
  forward: 'Переслать',
  more: COMMON_MESSAGES.more,
  moreAddresses: (n) => `ещё ${n}`,
  earlierMessages: (n) =>
    plural('ru', n, {
      one: '{n} предыдущее сообщение',
      few: '{n} предыдущих сообщения',
      many: '{n} предыдущих сообщений',
      other: '{n} предыдущих сообщения',
    }),
  showTrimmed: 'Показать скрытый текст',
  hideTrimmed: 'Скрыть текст',
  unread: 'Не прочитано',
  starred: 'Помечено',
  star: 'Пометить',
  attachments: 'Вложения',
  attachmentCount: (n) =>
    plural('ru', n, {
      one: '{n} вложение',
      few: '{n} вложения',
      many: '{n} вложений',
      other: '{n} вложения',
    }),
  expand: 'Развернуть сообщение',
  collapse: 'Свернуть сообщение',
};

const NOTIFICATION_CENTER_MESSAGES: Translations['NOTIFICATION_CENTER_MESSAGES'] = {
  title: 'Уведомления',
  emptyMessage: 'Вы всё просмотрели.',
  emptyDescription: 'Новые события появятся здесь, как только они произойдут.',
  noUnread: 'Нет непрочитанных уведомлений',
  unread: (n) =>
    plural('ru', n, {
      one: '{n} непрочитанное',
      few: '{n} непрочитанных',
      many: '{n} непрочитанных',
      other: '{n} непрочитанных',
    }),
  markAllRead: 'Отметить все как прочитанные',
  category: 'Категория уведомлений',
  tabs: { all: 'Все', mentions: 'Упоминания', system: 'Система' },
  unreadDot: 'Не прочитано',
};

const CHART_CARDS_MESSAGES: Translations['CHART_CARDS_MESSAGES'] = {
  titles: {
    activity: 'Активность',
    agents: 'Агенты',
    visitors: 'Посетители',
    breakdown: 'Разбивка',
    sessions: 'Сеансы',
    contributionsThisYear: 'Вклад за этот год',
    earnedSoFar: 'Заработано на данный момент',
    signUpFunnel: 'Воронка регистрации',
    activeUsers: 'Активные пользователи',
    revenue: 'Выручка',
    mostActiveDays: 'Самые активные дни',
    orders: 'Заказы',
    trackedTime: 'Учтённое время',
    revenuePerAccount: 'Выручка на аккаунт',
    sleepScore: 'Оценка сна',
    pipeline: 'Воронка продаж',
    steps: 'Шаги',
    tokens: 'Токены',
  },
  weekly: 'По неделям',
  monthly: 'По месяцам',
  yearly: 'По годам',
  stepsSuffix: 'шагов',
  today: 'Сегодня',
  thisYear: 'Этот год',
  lastYear: 'Прошлый год',
  sinceLastYear: 'к прошлому году',
  aYearEarlier: 'годом ранее',
  earningsPeriod: 'Период заработка',
  changePeriod: 'Изменить период',
  period: 'Период',
  total: 'всего',
  average: 'среднее',
  thisMonth: 'в этом месяце',
  ofGoal: 'от цели',
  totalSteps: 'шагов всего',
  gaugeChart: (title, reading) => `Шкала «${title}»: ${reading}`,
  halfGaugeChart: (title, items) => `Полукруглая шкала «${title}»: ${items}`,
  radialChart: (title, items) => `Радиальная диаграмма «${title}»: ${items}`,
  percentOfGoal: (pct) => `${pct} % от цели`,
  periodOf: (label) => `Период: ${label.toLowerCase()}`,
  chartVs: (title, current, previous) =>
    `Диаграмма «${title}»: ${current.toLowerCase()} в сравнении с ${previous.toLowerCase()}`,
  lineChart: (title) => `Линейная диаграмма «${title}»`,
  barChart: (title, items) => `Столбчатая диаграмма «${title}»: ${items}`,
  comboChart: (title, bar, line) =>
    `Диаграмма «${title}»: столбцы «${bar}» в сравнении с линией «${line}»`,
  scatterChart: (title, series) => `Точечная диаграмма «${title}»: ${series}`,
  bubbleChart: (title, series) => `Пузырьковая диаграмма «${title}»: ${series}`,
  ringItem: (label, value, pct) => `${label} ${value}, ${pct} % от цели`,
  scoreOf: (score, max) => `${score} из ${max}`,
  activityFor: (name, day) => `Активность: ${day} ${name}`,
  contributions: (n, date) => {
    const on = date ? `, ${date}` : '';
    return n === 0
      ? `Нет вклада${on}`
      : plural('ru', n, {
          one: `{n} вклад${on}`,
          few: `{n} вклада${on}`,
          many: `{n} вкладов${on}`,
          other: `{n} вклада${on}`,
        });
  },
};

const CODE_MESSAGES: Translations['CODE_MESSAGES'] = {
  copy: 'Копировать код',
  copied: 'Код скопирован',
};

const OUTLINE_NAV_MESSAGES: Translations['OUTLINE_NAV_MESSAGES'] = {
  outline: 'На этой странице',
  progress: (at, of) => `Заголовок ${at} из ${of}`,
};

const STEPPER_MESSAGES: Translations['STEPPER_MESSAGES'] = {
  decrease: 'Уменьшить',
  increase: 'Увеличить',
};

const CALL_UI_MESSAGES: Translations['CALL_UI_MESSAGES'] = {
  status: {
    calling: 'Вызов…',
    ringing: 'Идут гудки',
    connecting: 'Соединение…',
    active: 'Соединено',
    reconnecting: 'Переподключение…',
    onHold: 'На удержании',
    ended: 'Звонок завершён',
  },
  controls: {
    mute: 'Выключить микрофон',
    unmute: 'Включить микрофон',
    speakerOn: 'Включить динамик',
    speakerOff: 'Выключить динамик',
    videoOn: 'Включить камеру',
    videoOff: 'Выключить камеру',
    flipCamera: 'Сменить камеру',
    screenShareOn: 'Показать экран',
    screenShareOff: 'Остановить показ экрана',
    addParticipant: 'Добавить участника',
    endCall: 'Завершить звонок',
  },
  screen: {
    minimise: 'Свернуть звонок',
    chat: 'Открыть чат',
    participants: 'Участники',
    movePip: (c) =>
      `Переместить своё видео (сейчас ${callUi_corner(CALL_UI_MESSAGES__CORNERS, c)})`,
  },
  pipCorners: CALL_UI_MESSAGES__CORNERS,
  history: {
    incoming: 'Входящий',
    outgoing: 'Исходящий',
    missed: 'Пропущенный',
    declined: 'Отклонённый',
    callBack: (name) => `Перезвонить: ${name}`,
  },
  incoming: {
    accept: 'Принять',
    decline: 'Отклонить',
    message: 'Сообщение',
    remind: 'Напомнить',
    slideToAnswer: 'Проведите, чтобы ответить',
    voice: 'Входящий аудиозвонок',
    video: 'Входящий видеозвонок',
  },
  returnToCall: 'Вернуться к звонку',
  returnToCallWith: (name) => `Вернуться к звонку: ${name}`,
  join: 'Присоединиться',
  leave: 'Выйти',
  speaking: (name) => `${name} говорит`,
  overflow: (n) => `Ещё ${n}`,
  muted: (name) => `${name}, микрофон выключен`,
};

const RECENT_HIRES_CARD_MESSAGES: Translations['RECENT_HIRES_CARD_MESSAGES'] = {
  title: 'Новые сотрудники',
};

const MAIL_LIST_MESSAGES: Translations['MAIL_LIST_MESSAGES'] = {
  draft: 'Черновик:',
  unread: 'Не прочитано',
  starred: 'Помечено',
  star: 'Пометить',
  attachment: 'Есть вложение',
  select: 'Выбрать',
  threadCount: (n) =>
    plural('ru', n, {
      one: '{n} сообщение',
      few: '{n} сообщения',
      many: '{n} сообщений',
      other: '{n} сообщения',
    }),
  moreLabels: (n) =>
    plural('ru', n, {
      one: 'ещё {n} ярлык',
      few: 'ещё {n} ярлыка',
      many: 'ещё {n} ярлыков',
      other: 'ещё {n} ярлыка',
    }),
  selectedCount: (n) => `Выбрано: ${n}`,
  selectAll: 'Выбрать все',
  clearSelection: 'Снять выделение',
  emptyTitle: 'Здесь пусто',
  emptyDescription: 'Новые письма появятся в этой папке.',
  today: 'Сегодня',
  yesterday: 'Вчера',
  list: 'Почта',
};

const IMPORTANT_ALERTS_CARD_MESSAGES: Translations['IMPORTANT_ALERTS_CARD_MESSAGES'] = {
  title: 'Важные оповещения',
  thisWeek: 'на этой неделе',
};

const STAT_CARDS_MESSAGES: Translations['STAT_CARDS_MESSAGES'] = {
  about: (label) => `Подробнее: ${label}`,
  fromLastMonth: 'По сравнению с прошлым месяцем',
};

const SHAPE_MESSAGES: Translations['SHAPE_MESSAGES'] = {
  shapes: shapes_shapeNames(
    {
      square: 'Квадрат',
      slanted: 'Наклонный',
      arch: 'Арка',
      semicircle: 'Полукруг',
      oval: 'Овал',
      pill: 'Таблетка',
      triangle: 'Треугольник',
      arrow: 'Стрелка',
      fan: 'Веер',
      diamond: 'Ромб',
      clamshell: 'Ракушка',
      pentagon: 'Пятиугольник',
      gem: 'Самоцвет',
      'very-sunny': 'Очень солнечный',
      sunny: 'Солнечный',
      burst: 'Вспышка',
      'soft-burst': 'Мягкая вспышка',
      boom: 'Взрыв',
      'soft-boom': 'Мягкий взрыв',
      flower: 'Цветок',
      puffy: 'Пышный',
      'puffy-diamond': 'Пышный ромб',
      'ghost-ish': 'Почти призрак',
      'pixel-circle': 'Пиксельный круг',
      'pixel-triangle': 'Пиксельный треугольник',
      bun: 'Булочка',
      heart: 'Сердце',
    },
    (n) => `Печенье с ${n} сторонами`,
    (n) => `Клевер с ${n} листьями`,
  ),
};

const TENANCY_MESSAGES: Translations['TENANCY_MESSAGES'] = {
  leasePaymentStatus: {
    upcoming: 'Предстоит',
    due: 'Скоро срок',
    overdue: 'Просрочено',
    paid: 'Оплачено',
  },
  rentPaymentStatus: {
    paid: 'Оплачено',
    pending: 'Ожидается',
    overdue: 'Просрочено',
    partial: 'Частично',
  },
  maintenanceCategory: {
    plumbing: 'Сантехника',
    electrical: 'Электрика',
    appliances: 'Бытовая техника',
    heating: 'Отопление',
    other: 'Другое',
  },
  maintenancePriority: {
    low: 'Низкий приоритет',
    medium: 'Средний приоритет',
    high: 'Высокий приоритет',
    urgent: 'Срочно',
  },
  maintenanceStage: {
    reported: 'Заявлено',
    acknowledged: 'Принято',
    scheduled: 'Запланировано',
    resolved: 'Устранено',
  },
  documentStatus: { signed: 'Подписан', pending: 'Ожидает подписи', expired: 'Истёк' },
  timelineState: { complete: 'Выполнено', current: 'В процессе', upcoming: 'Ещё не начато' },
  leasePeriod: 'Срок аренды',
  monthlyRent: 'Аренда в месяц',
  deposit: 'Залог',
  nextPayment: 'Следующий платёж',
  paidThisYear: 'Оплачено в этом году',
  outstanding: 'Задолженность',
  noPayments: 'Платежей пока нет',
  columns: {
    month: 'Месяц',
    dueDate: 'Срок оплаты',
    method: 'Способ',
    amount: 'Сумма',
    status: 'Статус',
  },
  downloadReceipt: (month) => `Скачать квитанцию за ${month}`,
  dueOn: (date) => `Срок: ${date}`,
  comments: (n) =>
    plural('ru', n, {
      one: '{n} комментарий',
      few: '{n} комментария',
      many: '{n} комментариев',
      other: '{n} комментария',
    }),
  photo: (position, total) => `Фото ${position} из ${total}`,
  photoWithAlt: (alt, position, total) => `${alt}, фото ${position} из ${total}`,
  sign: 'Подписать',
  signDocument: (name) => `Подписать ${name}`,
  viewDocument: (name) => `Открыть ${name}`,
  downloadDocument: (name) => `Скачать ${name}`,
  noDocuments: 'Нет документов',
};

const DATA_TABLE_MESSAGES: Translations['DATA_TABLE_MESSAGES'] = {
  selectAll: 'Выбрать все строки на этой странице',
  selectRow: (id) => `Выбрать строку ${id}`,
  densityLabel: 'Плотность таблицы',
  density: { md: 'Обычная', sm: 'Компактная' },
};

const ERROR_BOUNDARY_MESSAGES: Translations['ERROR_BOUNDARY_MESSAGES'] = {
  title: 'Что-то пошло не так',
  message: 'Произошла непредвиденная ошибка',
  retry: 'Повторить попытку',
};

const AI_PROFILE_CARD_MESSAGES: Translations['AI_PROFILE_CARD_MESSAGES'] = {
  contributions: 'Вклад за этот год',
  activity: 'Активность',
  periodGroup: (label) => `Период: ${label}`,
  periods: { weekly: 'Неделя', monthly: 'Месяц', yearly: 'Год' },
};

const BREADCRUMB_MESSAGES: Translations['BREADCRUMB_MESSAGES'] = {
  breadcrumb: 'Навигационная цепочка',
};

const MESSAGE_MEDIA_MESSAGES: Translations['MESSAGE_MEDIA_MESSAGES'] = {
  photo: 'Фото',
  video: 'Видео',
  photoOf: (i, total) => `Фото ${i} из ${total}`,
  videoOf: (i, total) => `Видео ${i} из ${total}`,
  tapToView: 'Нажмите, чтобы посмотреть',
  sendingPhoto: 'Отправка фото',
  sendingVideo: 'Отправка видео',
  sendingAlbum: 'Отправка альбома',
  sendingSticker: 'Отправка стикера',
  sendingGif: 'Отправка GIF',
  album: (n) => `Альбом, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  sharedMedia: (n) => `Общие медиафайлы, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  sharedFiles: (n) => `Общие файлы, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  moreItems: (n) => `ещё ${n}`,
  notSent: 'Не отправлено',
  voiceMessage: (d) => `Голосовое сообщение, ${d}`,
  playVoiceMessage: 'Воспроизвести голосовое сообщение',
  pauseVoiceMessage: 'Приостановить голосовое сообщение',
  transcribe: 'Расшифровать',
  hideTranscript: 'Скрыть расшифровку',
  seek: 'Перемотка',
  seekPosition: (p, d) => `${p} из ${d}`,
  playbackSpeed: (r) => `Скорость воспроизведения: ${r}`,
  unplayed: 'Не прослушано',
  download: 'Скачать',
  downloaded: 'Скачано',
  file: 'Файл',
  fileKinds: {
    pdf: 'PDF',
    doc: 'ДОКУМЕНТ',
    sheet: 'ТАБЛИЦА',
    slides: 'ПРЕЗЕНТАЦИЯ',
    zip: 'ZIP',
    audio: 'АУДИО',
    video: 'ВИДЕО',
    image: 'ИЗОБРАЖЕНИЕ',
    code: 'КОД',
  },
  contact: 'Контакт',
  message: 'Написать',
  add: 'Добавить',
  location: 'Геопозиция',
  liveLocation: 'Геопозиция в реальном времени',
  stopSharing: 'Остановить трансляцию',
  vote: 'Голосовать',
  viewResults: 'Посмотреть результаты',
  anonymousVoting: 'Анонимное голосование',
  quiz: 'Викторина',
  selectOne: 'Выберите один вариант',
  selectOneOrMore: 'Выберите один или несколько',
  correctAnswer: 'правильный ответ',
  yourAnswer: 'ваш ответ',
  votes: (n) =>
    n === 0
      ? 'Нет голосов'
      : plural('ru', n, {
          one: '{n} голос',
          few: '{n} голоса',
          many: '{n} голосов',
          other: '{n} голоса',
        }),
  sticker: 'Стикер',
};

const PIPELINE_MESSAGES: Translations['PIPELINE_MESSAGES'] = {
  health: { 'on-track': 'По плану', 'at-risk': 'Под угрозой', stalled: 'Застряла' },
  stalledFor: (duration) => `Без движения: ${duration}`,
  move: (title) => `Переместить «${title}»`,
  stages: 'Этапы воронки',
  stageWithCount: (name, n) =>
    `${name}, ${plural('ru', n, { one: '{n} сделка', few: '{n} сделки', many: '{n} сделок', other: '{n} сделки' })}`,
  empty: 'На этом этапе нет сделок',
  loadMore: 'Загрузить ещё',
};

const STAY_SEARCH_MESSAGES: Translations['STAY_SEARCH_MESSAGES'] = {
  where: 'Куда',
  checkIn: 'Заезд',
  checkOut: 'Выезд',
  when: 'Когда',
  who: 'Кто',
  destinationPlaceholder: 'Поиск направлений',
  datesPlaceholder: 'Добавить даты',
  guestsPlaceholder: 'Добавить гостей',
  guests: { adults: 'Взрослые', children: 'Дети', infants: 'Младенцы', pets: 'Питомцы' },
  guestDescriptions: {
    adults: 'От 13 лет',
    children: 'От 2 до 12 лет',
    infants: 'Младше 2 лет',
    pets: 'Путешествуете с животным-помощником?',
  },
  dateFlexibility: 'Гибкость дат',
  exactDates: 'Точные даты',
  plusMinusDays: (n) =>
    plural('ru', n, {
      one: '± {n} день',
      few: '± {n} дня',
      many: '± {n} дней',
      other: '± {n} дня',
    }),
  destinations: 'Направления',
  whereTo: 'Куда едем?',
  filters: 'Фильтры',
};

const AUTH_CARD_MESSAGES: Translations['AUTH_CARD_MESSAGES'] = {
  modes: {
    signin: {
      title: 'С возвращением',
      description: 'Войдите, чтобы продолжить с того места, где остановились.',
      cta: 'Войти',
      switchLead: 'Впервые здесь?',
      switchAction: 'Создать аккаунт',
    },
    signup: {
      title: 'Создайте аккаунт',
      description: 'Начните работу за пару минут.',
      cta: 'Создать аккаунт',
      switchLead: 'Уже есть аккаунт?',
      switchAction: 'Войти',
    },
    verify: {
      title: 'Проверьте почту',
      description: 'Введите код, который мы отправили, чтобы завершить вход.',
      cta: 'Подтвердить и продолжить',
      switchLead: 'Код не приходит?',
      switchAction: 'Отправить новый',
    },
  },
  codeSentTo: (email) => `Введите код, который мы отправили на ${email}, чтобы завершить вход.`,
  verificationCode: 'Код подтверждения',
  fullName: 'Полное имя',
  namePlaceholder: 'Анна Иванова',
  email: 'Эл. почта',
  emailPlaceholder: 'vy@kompaniya.ru',
  emailHint: 'Мы используем её, чтобы связаться с вами, и никому не передаём.',
  password: 'Пароль',
  passwordPlaceholder: 'Введите пароль',
  newPasswordPlaceholder: 'Не менее 8 символов',
  confirmPassword: 'Подтвердите пароль',
  confirmPasswordPlaceholder: 'Повторите пароль',
  rememberMe: 'Запомнить меня',
  forgotPassword: 'Забыли пароль?',
  terms:
    'Создавая аккаунт, вы принимаете наши Условия использования и Политику конфиденциальности.',
  orContinueWith: 'или продолжите с',
};

const TRACK_LIST_MESSAGES: Translations['TRACK_LIST_MESSAGES'] = {
  title: 'Название',
  album: 'Альбом',
  dateAdded: 'Дата добавления',
  plays: 'Прослушивания',
  duration: 'Длительность',
  moveUp: 'Переместить вверх',
  moveDown: 'Переместить вниз',
  reorder: 'Изменить порядок',
  downloaded: 'Скачано',
  unavailable: 'Недоступно',
  tracks: 'Треки',
  episodes: 'Выпуски',
  selected: (n) =>
    plural('ru', n, {
      one: 'Выбран {n} трек',
      few: 'Выбрано {n} трека',
      many: 'Выбрано {n} треков',
      other: 'Выбрано {n} трека',
    }),
  clearSelection: 'Снять выделение',
  played: 'Прослушано',
  listened: 'Прослушано',
  saveEpisode: 'Сохранить выпуск',
  downloadEpisode: 'Скачать выпуск',
  minutes: (m) => `${m} мин`,
  hours: (h) => `${h} ч`,
  hoursMinutes: (h, m) => `${h} ч ${m} мин`,
  remaining: (l) => `Осталось ${l}`,
};

const LYRICS_MESSAGES: Translations['LYRICS_MESSAGES'] = {
  lyrics: 'Текст песни',
  showLyrics: 'Показать текст',
  backToCurrent: 'К текущей строке',
  empty: 'Текст этого трека недоступен',
};

const ACTIVITY_FEED_MESSAGES: Translations['ACTIVITY_FEED_MESSAGES'] = {
  kinds: {
    call: 'Звонок',
    email: 'Письмо',
    meeting: 'Встреча',
    note: 'Заметка',
    'stage-change': 'Смена этапа',
    task: 'Задача выполнена',
  },
  empty: 'Пока ничего не записано',
  loggedBy: (name) => `Записал(а): ${name}`,
  filterActivity: 'Фильтр активности',
};

const PLACE_REVIEWS_MESSAGES: Translations['PLACE_REVIEWS_MESSAGES'] = {
  depositReturned: 'Залог возвращён',
  depositNotReturned: 'Залог не возвращён',
  recommend: 'Рекомендую',
  notRecommend: 'Не рекомендую',
  helpful: 'Полезно',
  report: 'Пожаловаться',
  promptTitle: 'Вы жили здесь?',
  promptDescription: (building) => `Помогите будущим жильцам дома «${building}». Отзывы анонимны.`,
  writeReview: 'Написать отзыв',
  reviewCount: (n) =>
    plural('ru', n, {
      one: '{n} отзыв',
      few: '{n} отзыва',
      many: '{n} отзывов',
      other: '{n} отзыва',
    }),
  depositRate: (percent) => `Залог возвращён в ${percent}% случаев аренды`,
  recommendRate: (percent) => `${percent}% рекомендуют здесь жить`,
};

const DELIVERY_SLOT_MESSAGES: Translations['DELIVERY_SLOT_MESSAGES'] = {
  tiers: { standard: 'Обычная', express: 'Экспресс' },
  soldOut: 'Мест нет',
  asap: 'Как можно скорее',
  field: 'Время доставки',
  day: 'День',
  emptyTitle: 'Свободных окон нет',
  emptyDescription: 'Выберите другой день или ближайшего курьера.',
};

const PLACE_LIST_MESSAGES: Translations['PLACE_LIST_MESSAGES'] = {
  visibility: { private: 'Личный', shared: 'Общий', public: 'Публичный' },
  places: (n) =>
    plural('ru', n, { one: '{n} место', few: '{n} места', many: '{n} мест', other: '{n} места' }),
  sharedWith: (n) =>
    plural('ru', n, {
      one: 'Доступ открыт {n} человеку',
      few: 'Доступ открыт {n} людям',
      many: 'Доступ открыт {n} людям',
      other: 'Доступ открыт {n} людям',
    }),
  labels: {
    moveEarlier: (position) => `Переместить на позицию ${position - 1}`,
    moveLater: (position) => `Переместить на позицию ${position + 1}`,
    remove: (name) => `Убрать «${name}» из списка`,
    moved: (name, position, total) => `«${name}» перемещено на позицию ${position} из ${total}`,
    note: 'Заметка',
  },
  savedPlaces: 'Сохранённые места',
};

const HOME_SEARCH_MESSAGES: Translations['HOME_SEARCH_MESSAGES'] = {
  modes: { rent: 'Аренда', buy: 'Покупка', stays: 'Посуточно', swap: 'Обмен' },
  searchMode: 'Режим поиска',
  location: 'Местоположение',
  locationPlaceholder: 'Город или район',
  moveIn: 'Въезд',
  datePlaceholder: 'Добавить дату',
  budget: 'Бюджет',
  budgetPlaceholder: 'Указать бюджет',
  price: 'Цена',
  pricePlaceholder: 'Любая цена',
  propertyType: 'Тип жилья',
  propertyTypePlaceholder: 'Любой тип',
  dates: 'Даты',
  homeSize: 'Площадь жилья',
  homeSizePlaceholder: 'Любая площадь',
  minimum: 'Минимум',
  maximum: 'Максимум',
  budgetPresets: 'Варианты бюджета',
  monthlyBudget: 'Бюджет в месяц',
  monthlyBudgetDescription: 'Аренда в месяц без коммунальных платежей',
  totalPriceDescription: 'Полная стоимость',
  upTo: (amount) => `До ${amount}`,
  any: 'Любой',
  moveInLabels: {
    date: 'Дата въезда',
    flexible: 'Гибко',
    asap: 'Как можно скорее',
    contractLength: 'Срок договора',
  },
  contractLengths: {
    any: 'Любой',
    short: '1–6 месяцев',
    medium: '6–12 месяцев',
    long: 'Больше года',
  },
  saveSearch: 'Сохранить поиск',
  saved: 'Сохранено',
  newCount: (n) =>
    plural('ru', n, { one: '{n} новый', few: '{n} новых', many: '{n} новых', other: '{n} новых' }),
  alertsOff: 'Уведомления выключены',
  actionOn: (action, subject) => `${action}: ${subject}`,
};

const OFFERING_BADGE_MESSAGES: Translations['OFFERING_BADGE_MESSAGES'] = {
  offerings: {
    long_term_rent: 'Аренда',
    sale: 'Продажа',
    short_term_rent: 'Посуточно',
    exchange: 'Обмен',
  },
};

const MAP_ATTRIBUTION_MESSAGES: Translations['MAP_ATTRIBUTION_MESSAGES'] = {
  scale: 'Масштаб',
  mapData: 'Картографические данные',
};

const SLIDER_MESSAGES: Translations['SLIDER_MESSAGES'] = {
  minimum: 'Минимум',
  maximum: 'Максимум',
  value: (n) => `Значение ${n}`,
};

const SELECT_MESSAGES: Translations['SELECT_MESSAGES'] = {
  selectOption: 'Выберите вариант',
  scrollUp: 'Прокрутить вверх',
  scrollDown: 'Прокрутить вниз',
};

const ZOOMABLE_MEDIA_GALLERY_MESSAGES: Translations['ZOOMABLE_MEDIA_GALLERY_MESSAGES'] = {
  close: 'Закрыть просмотр',
  previous: 'Предыдущий элемент',
  next: 'Следующий элемент',
  goTo: (i, n) => `Перейти к элементу ${i} из ${n}`,
  share: 'Поделиться медиафайлом',
};

const NOTIFICATION_MESSAGES: Translations['NOTIFICATION_MESSAGES'] = {
  dismiss: 'Закрыть уведомление',
};

const PHONE_INPUT_MESSAGES: Translations['PHONE_INPUT_MESSAGES'] = {
  phoneNumber: 'Номер телефона',
  countryCode: 'Код страны',
};

const VENDOR_CARD_MESSAGES: Translations['VENDOR_CARD_MESSAGES'] = {
  facts: {
    deliveryTime: 'Время доставки',
    deliveryFee: 'Доставка',
    distance: 'Расстояние',
    minimumOrder: 'Минимальный заказ',
  },
  availability: { paused: 'Приостановлено', closed: 'Закрыто' },
  new: 'Новое',
  rated: (value, reviews) =>
    `Оценка ${value} из 5${vendorCard_has(reviews) ? `, ${vendorCard_counted('ru', reviews, { one: '{n} отзыв', few: '{n} отзыва', many: '{n} отзывов', other: '{n} отзыва' })}` : ''}`,
};

const CHAT_INDICATORS_MESSAGES: Translations['CHAT_INDICATORS_MESSAGES'] = {
  presence: { online: 'В сети', idle: 'Нет на месте', offline: 'Не в сети', busy: 'Занят' },
  status: {
    sending: 'Отправка…',
    sent: 'Отправлено',
    delivered: 'Доставлено',
    read: 'Прочитано',
    failed: 'Не отправлено',
  },
  unread: 'Не прочитано',
  unreadCount: (n) =>
    plural('ru', n, {
      one: '{n} непрочитанное сообщение',
      few: '{n} непрочитанных сообщения',
      many: '{n} непрочитанных сообщений',
      other: '{n} непрочитанного сообщения',
    }),
};

const MEDIA_CONTROLS_MESSAGES: Translations['MEDIA_CONTROLS_MESSAGES'] = {
  play: 'Воспроизвести',
  pause: 'Пауза',
  playSubject: (s) => `Воспроизвести ${s}`,
  pauseSubject: (s) => `Приостановить ${s}`,
  saveToLibrary: 'Сохранить в медиатеку',
  saveSubjectToLibrary: (s) => `Сохранить ${s} в медиатеку`,
  explicit: 'Ненормативный контент',
  seek: 'Позиция воспроизведения',
  seekValue: (a, b) => `${a} из ${b}`,
  mute: 'Выключить звук',
  unmute: 'Включить звук',
  volume: 'Громкость',
  nowPlaying: 'Сейчас играет',
};

const INPUT_OTP_MESSAGES: Translations['INPUT_OTP_MESSAGES'] = {
  oneTimeCode: 'Одноразовый код',
  digitOf: (i, n) => `Цифра ${i} из ${n}`,
  characterOf: (i, n) => `Символ ${i} из ${n}`,
};

const PLACE_DETAILS_MESSAGES: Translations['PLACE_DETAILS_MESSAGES'] = {
  infoActions: { call: 'Позвонить', open: 'Открыть сайт', directions: 'Маршрут' },
  busy: {
    busier: 'Больше людей, чем обычно',
    typical: 'Как обычно',
    quieter: 'Меньше людей, чем обычно',
  },
  transitModes: {
    bus: 'Автобусная остановка',
    metro: 'Станция метро',
    train: 'Железнодорожная станция',
    tram: 'Трамвайная остановка',
    ferry: 'Паромный терминал',
  },
  notAvailable: 'Недоступно',
  amenities: 'Удобства',
  today: 'Сегодня',
  closed: 'Закрыто',
  openingHours: 'Часы работы',
  day: 'День',
  noDataForDay: 'Нет данных за этот день',
  chartNoData: (day) => `${day}, нет данных`,
  chartClosed: (day) => `${day}, закрыто весь день`,
  chartPeak: (day, hour) => `${day}, больше всего людей в ${hour}`,
  chartNow: (hour) => `сейчас ${hour}`,
  live: 'в реальном времени',
  noDepartures: 'Сейчас нет отправлений',
  nearbyTransit: 'Транспорт поблизости',
  lines: 'Линии',
  line: (name) => `Линия ${name}`,
  towards: (headsign) => `до ${headsign}`,
};

const APP_SHELL_MESSAGES: Translations['APP_SHELL_MESSAGES'] = {
  openNavigation: 'Открыть навигацию',
  closeNavigation: 'Закрыть навигацию',
  resizePanes: 'Изменить размер панелей',
  notifications: 'Уведомления',
  proOffer: 'Предложение Pro',
};

const ROUTE_STOPS_MESSAGES: Translations['ROUTE_STOPS_MESSAGES'] = {
  routeStops: 'Остановки маршрута',
  origin: 'Откуда',
  destination: 'Куда',
  stop: (position) => `Остановка ${position}`,
  swap: 'Поменять местами начало и конец маршрута',
  addStop: 'Добавить остановку',
  removeStop: (title) => `Убрать «${title}»`,
  state: { reached: 'Пройдена', current: 'Текущая остановка', pending: 'Не пройдена' },
};

const SEARCH_MESSAGES: Translations['SEARCH_MESSAGES'] = {
  clearQuery: 'Очистить поисковый запрос',
};

const TAG_FIELD_MESSAGES: Translations['TAG_FIELD_MESSAGES'] = {
  remove: (t) => `Убрать «${t}»`,
  full: (n) => `Максимум: ${n}`,
  suggestions: 'Подсказки',
};

const STAY_FILTERS_MESSAGES: Translations['STAY_FILTERS_MESSAGES'] = {
  propertyTypes: {
    apartment: 'Квартира',
    house: 'Дом',
    room: 'Комната',
    studio: 'Студия',
    duplex: 'Дуплекс / Пентхаус',
    coliving: 'Коливинг',
    hostel: 'Хостел',
    other: 'Участок / Другое',
  },
  features: {
    elevator: 'Лифт',
    parking: 'Парковка',
    terrace: 'Терраса',
    garden: 'Сад',
    pool: 'Бассейн',
    furnished: 'С мебелью',
    pets: 'Можно с животными',
    airConditioning: 'Кондиционер',
    heating: 'Отопление',
    accessible: 'Доступная среда',
    storage: 'Кладовая',
  },
  floors: {
    ground: 'Первый этаж',
    middle: 'Средний этаж',
    top: 'Последний этаж',
    elevator: 'С лифтом',
  },
  minimum: 'Минимум',
  maximum: 'Максимум',
  priceRange: 'Диапазон цен',
  area: 'Площадь',
  featuresGroup: 'Удобства',
  floor: 'Этаж',
  propertyType: 'Тип жилья',
  energyRating: 'Класс энергоэффективности',
  anyRating: 'Любой класс',
  ratingOnly: (r) => `Только ${r}`,
  ratingAndBetter: (r) => `${r} и лучше`,
  filters: 'Фильтры',
  filtersApplied: (label, n) =>
    `${label}, ${plural('ru', n, { one: '{n} применён', few: '{n} применено', many: '{n} применено', other: '{n} применено' })}`,
  clearAll: 'Сбросить всё',
  any: 'Любое',
  availableNow: 'Свободно сейчас',
  availableNowDescription: 'Можно въехать сегодня',
  availableFrom: 'Свободно с',
  anyDate: 'Любая дата',
};

const SETTINGS_MODAL_MESSAGES: Translations['SETTINGS_MODAL_MESSAGES'] = {
  dialog: 'Настройки',
  nav: 'Разделы настроек',
  close: 'Закрыть настройки',
  saved: 'Сохранено',
  currentPlan: 'Текущий тариф',
  actions: 'Действия',
  storage: {
    storedIn: 'Хранится в',
    fileCount: (n, shown) =>
      plural('ru', n, {
        one: `${shown} файл`,
        few: `${shown} файла`,
        many: `${shown} файлов`,
        other: `${shown} файла`,
      }),
    filterByType: 'Фильтр по типу файла',
    fileType: 'Тип файла',
    orderBy: 'Сортировка',
    modified: 'По изменению',
    oldestFirst: 'Сначала старые',
    searchFiles: 'Поиск файлов',
    selectAllOnPage: 'Выбрать все файлы на этой странице',
    fileName: 'Имя файла',
    uploadedOn: 'Дата загрузки',
    fileSize: 'Размер файла',
    sortBy: {
      name: 'Сортировать по имени файла',
      uploadedAt: 'Сортировать по дате загрузки',
      size: 'Сортировать по размеру файла',
    },
    selectFile: (name) => `Выбрать ${name}`,
    deleteFile: 'Удалить файл',
    deleteNamed: (name) => `Удалить ${name}`,
    noMatches: 'Нет файлов, соответствующих фильтрам.',
    documents: 'Документы',
    spreadsheets: 'Таблицы',
    videos: 'Видео',
    downloadFile: 'Скачать файл',
    rename: 'Переименовать',
    copyLink: 'Копировать ссылку',
  },
  tools: {
    showOutput: 'Показать вывод',
    refreshTools: 'Обновить инструменты',
    removeServer: 'Удалить сервер',
    logout: 'Выйти',
    logOutOf: (server) => `Выйти из ${server}`,
    showTools: (server) => `Показать инструменты ${server}`,
    hideTools: (server) => `Скрыть инструменты ${server}`,
    error: 'Ошибка',
    showOutputLink: 'Показать вывод',
    showOutputOf: (server) => `Показать вывод ${server}`,
    newServer: 'Новый MCP-сервер',
    newServerDescription: 'Добавить собственный MCP-сервер',
    projectScope: 'Область проекта',
    authentication: 'Аутентификация',
    waitForAuth: 'Ждать аутентификации MCP',
    waitForAuthDescription:
      'Ждать аутентификации без ограничения по времени, когда она запрошена. Если выключено, запросы аутентификации пропускаются через 30 секунд.',
    waitForAuthSwitch: 'Ждать аутентификации MCP',
    scopeServers: (scope) => `MCP-серверы: ${scope}`,
    scopeServersDescription: (scope) => `Серверы, доступные в ${scope}.`,
    teamServers: 'MCP-серверы команды',
    teamServersDescription: 'Настраиваются в панели управления',
    manage: 'Управлять',
    noTeamServers: 'Нет MCP-серверов команды',
    noTeamServersBody:
      'Настройте MCP-серверы в панели управления, чтобы они были доступны на компьютере и в облаке.',
    configureTeam: 'Настроить MCP-серверы команды',
    pluginServers: 'MCP-серверы плагинов',
  },
};

const EVICTION_MESSAGES: Translations['EVICTION_MESSAGES'] = {
  status: {
    scheduled: 'Назначено',
    postponed: 'Перенесено',
    suspended: 'Приостановлено',
    executed: 'Исполнено',
    cancelled: 'Отменено',
  },
  attend: 'Я приду',
  share: 'Поделиться',
  contactSupport: 'Связаться с группой поддержки',
  verified: 'Подтверждено сообществом',
  caseHistory: 'История дела',
  source: (source) => `Источник: ${source}`,
};

const BOOKING_MESSAGES: Translations['BOOKING_MESSAGES'] = {
  checkIn: 'Заезд',
  checkOut: 'Выезд',
  guests: 'Гости',
  addDate: 'Добавить дату',
  reserve: 'Забронировать',
  checkAvailability: 'Проверить наличие мест',
  notChargedYet: 'Пока с вас ничего не спишут',
  total: 'Итого',
  tripStatus: {
    confirmed: 'Подтверждено',
    pending: 'Ожидает',
    cancelled: 'Отменено',
    completed: 'Завершено',
  },
  priceName: booking_priceName(
    (p, u) => `${p} за ${u}`,
    (s, o) => `${s}, раньше ${o}`,
  ),
};

const AGENT_LIMITS_CARD_MESSAGES: Translations['AGENT_LIMITS_CARD_MESSAGES'] = {
  contextWindow: 'Контекстное окно',
  freeSpace: 'Свободно',
  planUsageLimits: 'Лимиты тарифа',
  managePlan: 'Управление тарифом',
};

const SWIPE_ROW_MESSAGES: Translations['SWIPE_ROW_MESSAGES'] = {
  closeActions: 'Скрыть действия',
};

const PATIENT_INFO_CARD_MESSAGES: Translations['PATIENT_INFO_CARD_MESSAGES'] = {
  addPhoto: 'Добавить фото профиля',
};

const THEME_TOGGLE_MESSAGES: Translations['THEME_TOGGLE_MESSAGES'] = {
  theme: 'Тема',
  darkMode: 'Тёмная тема',
  lightMode: 'Светлая тема',
  useDarkMode: 'Включить тёмную тему',
  useLightMode: 'Включить светлую тему',
};

const EARNINGS_MESSAGES: Translations['EARNINGS_MESSAGES'] = {
  earned: 'Заработано',
  period: 'Период заработка',
  breakdown: 'Из чего складывается',
  payout: 'Следующая выплата',
  payoutState: {
    scheduled: 'Запланирована',
    processing: 'В пути',
    paid: 'Выплачено',
    held: 'Задержана',
    failed: 'Не удалась',
  },
  chart: (label) => `Заработок: ${label}, по периодам`,
  empty: 'Пока ничего не заработано',
  earnings: 'Заработок',
};

const PROOF_OF_DELIVERY_MESSAGES: Translations['PROOF_OF_DELIVERY_MESSAGES'] = {
  labels: {
    signature: 'Подпись',
    signaturePad: 'Поле для подписи',
    signatureHint: 'Распишитесь пальцем',
    signed: 'Подписано',
    clear: 'Стереть подпись',
    typeName: 'Или введите имя',
    typeNamePlaceholder: 'Полное имя',
    photo: 'Фото',
    photoHint: 'Где вы оставили посылку или посылка у получателя.',
    code: 'Код доставки',
    codeHint: 'Попросите получателя назвать код из приложения.',
    recipient: 'Кто получил',
    recipientPlaceholder: 'Имя',
    note: 'Примечание',
    notePlaceholder: 'Всё, что стоит записать',
    submit: 'Подтвердить доставку',
    required: 'Обязательно',
    missing: 'Это нужно заполнить перед подтверждением.',
    missingSummary: (n) =>
      plural('ru', n, {
        one: 'Не заполнен {n} пункт',
        few: 'Не заполнено {n} пункта',
        many: 'Не заполнено {n} пунктов',
        other: 'Не заполнено {n} пункта',
      }),
  },
  proofOfDelivery: 'Подтверждение доставки',
};

const FILE_UPLOAD_MESSAGES: Translations['FILE_UPLOAD_MESSAGES'] = {
  promptWeb: 'Перетащите файл для загрузки или',
  promptNative: 'Нажмите, чтобы',
  selectWeb: 'выберите',
  selectNative: 'выбрать файл',
  uploading: (size) => `Загрузка ${size}...`,
  uploaded: 'Файл загружен!',
  unsupported: (extensions) => `Поддерживаются только файлы ${extensions}`,
  tooLarge: (max) => `Файл больше ${max}`,
  max: (size) => `(макс. ${size})`,
  uploadFile: 'Загрузить файл',
};

const POPOVER_MESSAGES: Translations['POPOVER_MESSAGES'] = {
  popover: 'Всплывающее окно',
};

const QUEUE_PANEL_MESSAGES: Translations['QUEUE_PANEL_MESSAGES'] = {
  queueTab: 'Очередь',
  recentTab: 'Недавно прослушанные',
  close: 'Закрыть очередь',
  nextInQueue: 'Далее в очереди',
  nextFrom: (c) => `Далее из: ${c}`,
  nextUp: 'Далее',
  clearQueue: 'Очистить очередь',
  reorder: (t) => `Переместить ${t}`,
  reorderHint: 'Перетащите или используйте клавиши со стрелками',
  moveUp: 'Переместить вверх',
  moveDown: 'Переместить вниз',
  remove: 'Удалить из очереди',
  moved: (t, p, n) => `${t}: позиция ${p} из ${n}`,
  emptyQueue: 'Очередь пуста',
  emptyQueueHint: 'Добавьте треки и выпуски, чтобы послушать их следующими.',
  emptyRecent: 'Вы ещё ничего не слушали',
};

const HOVER_CARD_MESSAGES: Translations['HOVER_CARD_MESSAGES'] = {
  hoverCard: 'Карточка предпросмотра',
};

const NOTE_EDITOR_MESSAGES: Translations['NOTE_EDITOR_MESSAGES'] = {
  header: {
    saved: 'Сохранено',
    saving: 'Сохранение…',
    offline: 'Нет сети — изменения сохранены на устройстве',
    error: 'Не сохранено',
    words: (n) =>
      plural('ru', n, { one: '{n} слово', few: '{n} слова', many: '{n} слов', other: '{n} слова' }),
    title: 'Заголовок',
  },
  untitled: 'Без названия',
  note: 'Заметка',
  toolbar: { more: 'Ещё форматирование', moreMenu: 'Ещё форматирование' },
};

const MEDIA_SHELF_MESSAGES: Translations['MEDIA_SHELF_MESSAGES'] = {
  filters: 'Фильтры',
  showAll: 'Показать все',
};

const CATEGORY_BAR_MESSAGES: Translations['CATEGORY_BAR_MESSAGES'] = {
  previous: 'Предыдущие категории',
  next: 'Следующие категории',
};

const CARRIER_QUOTE_MESSAGES: Translations['CARRIER_QUOTE_MESSAGES'] = {
  labels: {
    accept: 'Принять',
    message: 'Написать',
    decline: 'Отклонить',
    pickup: 'Забор груза',
    eta: 'Прибытие',
    vehicle: 'Транспорт',
    jobs: (jobs) => `Выполнено заказов: ${jobs}`,
    verified: 'Проверенный перевозчик',
    marks: { cheapest: 'Дешевле всех', fastest: 'Быстрее всех' },
    showPrice: 'Показать детали цены',
    hidePrice: 'Скрыть детали цены',
    priceDetails: 'Детали цены:',
    sort: 'Сортировать предложения',
    sortOptions: { price: 'Сначала дешёвые', eta: 'Сначала быстрые', rating: 'С лучшим рейтингом' },
    count: (n) =>
      plural('ru', n, {
        one: '{n} предложение',
        few: '{n} предложения',
        many: '{n} предложений',
        other: '{n} предложения',
      }),
    loading: 'Загрузка предложений',
  },
  emptyTitle: 'Предложений пока нет',
  emptyDescription:
    'Перевозчики изучают ваш заказ. Первые предложения обычно приходят в течение нескольких минут.',
  list: 'Предложения',
  priceDetailsFor: (name) => `Детали цены: ${name}`,
};

const TEXT_FIELD_MESSAGES: Translations['TEXT_FIELD_MESSAGES'] = {
  showPassword: 'Показать пароль',
  hidePassword: 'Скрыть пароль',
  required: 'обязательно',
};

const CHAT_SCREEN_MESSAGES: Translations['CHAT_SCREEN_MESSAGES'] = {
  call: 'Позвонить',
  videoCall: 'Видеозвонок',
  searchInConversation: 'Поиск в чате',
  connecting: 'Подключение…',
  verified: 'Подтверждён',
  bot: 'Бот',
  channel: 'Канал',
  clearSelection: 'Снять выделение',
  forward: 'Переслать',
  pin: 'Закрепить',
  selectedCount: (n) => `Выбрано: ${n}`,
  pinnedList: 'Показать закреплённые сообщения',
  pinnedClose: 'Скрыть панель закреплённых',
  pinnedUnpin: 'Открепить это сообщение',
  pinnedMessage: 'Закреплённое сообщение',
  pinnedMessageNumber: (n) => `Закреплённое сообщение №${n}`,
  scrollToBottom: 'К последним сообщениям',
  jumpToMention: 'Перейти к упоминанию',
  emptyTitle: 'Сообщений пока нет',
  info: 'Информация',
  members: 'Участники',
  addMember: 'Добавить участников',
  memberSearch: 'Поиск участников',
  noMembers: 'Участники не найдены',
  owner: 'Владелец',
  admin: 'Администратор',
  resizeList: 'Изменить ширину списка чатов',
};

const CONTEXT_MENU_MESSAGES: Translations['CONTEXT_MENU_MESSAGES'] = {
  contextMenu: 'Контекстное меню',
};

const SORTABLE_MEDIA_MESSAGES: Translations['SORTABLE_MEDIA_MESSAGES'] = {
  photo: (p, t) => `Фото ${p} из ${t}`,
  cover: 'Обложка',
  moveEarlier: (p) => `Переместить фото ${p} ближе к началу`,
  moveLater: (p) => `Переместить фото ${p} ближе к концу`,
  remove: (p) => `Удалить фото ${p}`,
  retry: (p) => `Повторить загрузку фото ${p}`,
  uploading: (p) => `Загрузка фото ${p}`,
  failed: 'Не удалось загрузить',
  add: 'Добавить фото',
  moved: (p, t) => `Перемещено на позицию ${p} из ${t}`,
  photos: 'Фото',
};

const CONNECTION_DOTS_MESSAGES: Translations['CONNECTION_DOTS_MESSAGES'] = {
  connecting: 'Подключение',
};

const CHAT_PEOPLE_MESSAGES: Translations['CHAT_PEOPLE_MESSAGES'] = {
  newGroup: {
    photo: 'Выбрать фото группы',
    name: 'Название группы',
    namePlaceholder: 'Назовите группу',
    description: 'Описание',
    descriptionPlaceholder: 'Для чего эта группа?',
    members: (n) =>
      plural('ru', n, {
        one: '{n} участник',
        few: '{n} участника',
        many: '{n} участников',
        other: '{n} участника',
      }),
    addMembers: 'Добавить участников',
    remove: (name) => `Убрать: ${name}`,
  },
  member: {
    owner: 'Владелец',
    admin: 'Администратор',
    promote: 'Назначить администратором',
    restrict: 'Ограничить',
    remove: 'Удалить из группы',
    actions: (name) => `Действия: ${name}`,
  },
  story: {
    close: 'Закрыть историю',
    previous: 'Предыдущая история',
    next: 'Следующая история',
    mute: 'Выключить звук истории',
    unmute: 'Включить звук истории',
    more: 'Параметры истории',
    replyPlaceholder: 'Ответить…',
    send: 'Отправить ответ',
    progress: (index, count) => `История ${index + 1} из ${count}`,
    react: (emoji) => `Отреагировать: ${emoji}`,
  },
  searchMembers: 'Поиск участников',
  share: 'Поделиться',
  postOptions: 'Параметры публикации',
  pinned: 'Закреплено',
  views: (c) =>
    plural('ru', c, {
      one: `${c} просмотр`,
      few: `${c} просмотра`,
      many: `${c} просмотров`,
      other: `${c} просмотра`,
    }),
  forwards: (c) =>
    plural('ru', c, {
      one: `${c} пересылка`,
      few: `${c} пересылки`,
      many: `${c} пересылок`,
      other: `${c} пересылки`,
    }),
  jumpTo: (letter) => `Перейти к ${letter}`,
  add: 'Добавить',
  added: 'Добавлено',
  actionOn: (action, name) => `${action}: ${name}`,
};

const MULTI_AGENT_CHAT_MESSAGES: Translations['MULTI_AGENT_CHAT_MESSAGES'] = {
  pickerAction: (editing: boolean, count: number) =>
    editing
      ? 'Сохранить изменения'
      : 'Начать чат' +
        (count
          ? ' · ' +
            plural('ru', count, { one: '{n} агент', few: '{n} агента', other: '{n} агентов' })
          : ''),
  you: 'Вы',
  responseFailed: '{0} не смог ответить. Попробуйте ещё раз.',
  editAgentTitle: 'Изменить агента',
  aLittleHelp: 'Небольшая помощь',
  aFewMindsOneConversation: 'Несколько умов. Один разговор.',
  aLittleRoomForSomethingNew: 'Немного места для чего-то нового',
  accountDetails: 'Детали учетной записи',
  add: 'Добавить',
  add2: 'Добавить {0}',
  added: 'Добавлено',
  addedToYourWorkspace: 'Добавлено в вашу рабочую область',
  agent: 'Агент',
  agentConversation: 'Разговор с агентом',
  appearance: 'Внешний вид',
  apps: 'Приложения · {0}',
  availability: 'Наличие',
  backToMarketplace: 'Вернуться на торговую площадку',
  billing: 'Биллинг',
  bitbucket: 'Bitbucket',
  bloom: 'Bloom',
  bots: 'Боты',
  bringYourAgentsIntoOneChat: 'Объедините своих агентов в один чат.',
  category: 'Категория',
  chatActions: 'Действия в чате',
  chatList: 'Список чатов',
  chatName: 'Название чата',
  chatRemoved: 'Чат удален',
  chatWithYourAgents: 'Общайтесь со своими агентами',
  chooseAnAgentOrCreateYourOwn: 'Выберите агента или создайте своего, чтобы начать разговор.',
  chooseWhoSJoiningTheConversation: 'Выберите, кто присоединится к разговору.',
  chooseYourTeammates: 'Выберите товарищей по команде',
  closeMarketplace: 'Закрыть торговую площадку',
  closeSearch: 'Закрыть поиск',
  company: 'Компания',
  companyDetails: 'Подробная информация о компании',
  completionSound: 'Звук завершения',
  connectedAccount: 'Подключенный аккаунт',
  connector: 'Разъем',
  conversationIDCopied: 'Идентификатор беседы скопирован',
  conversationCopied: 'Разговор скопирован',
  conversationOptions: 'Варианты разговора',
  conversations: 'Разговоры',
  copied: 'Скопировано',
  copyConversation: 'Копировать разговор',
  copyConversationID: 'Копировать идентификатор беседы',
  copyResponse: 'Копировать ответ',
  couldnTCopyPleaseTryAgain: 'Не удалось скопировать. Пожалуйста, попробуйте еще раз.',
  create: 'Создать',
  createANewBot: 'Создать нового бота',
  createBotOrChat: 'Создать бота или чат',
  criticalRequests: 'Критические запросы',
  customize: 'Настроить',
  customizeANewTeammate: 'Настройте нового товарища по команде.',
  dateOfBirth: 'Дата рождения',
  demoIntegrationAddingSavesItToThis:
    'Демо-интеграция. Добавление сохраняет его в этот браузер; никакая внешняя учетная запись не подключена.',
  desktopApp: 'Приложение для ПК',
  details: 'Подробности',
  developer: 'Разработчик',
  deviceID: 'Идентификатор устройства',
  discover: 'Откройте для себя',
  dispatchAlerts: 'Отправка оповещений',
  editConversationAgents: 'Редактировать агентов беседы',
  editBot: 'Изменить бота',
  editGroup: 'Редактировать группу',
  editAgent: 'Редактировать {0}',
  email: 'Письмо',
  everydayEssentials: 'Все необходимое на каждый день',
  exploreMarketplace: 'Исследуйте торговую площадку',
  explorePlugins: 'Изучите плагины',
  explorePluginsAndBotsToBuildYour: 'Изучите плагины и ботов, чтобы создать свою команду.',
  findYourNextTeammate: 'Найдите своего следующего товарища по команде',
  findYourNextToolOrTeammate: 'Найдите свой следующий инструмент или товарища по команде',
  firstName: 'Имя',
  folders: 'Папки',
  general: 'Общие',
  getNotifiedWhenTheModeNeedsTo:
    'Получайте уведомления, когда режиму необходимо принять критическое решение',
  git: 'Git',
  github: 'GitHub',
  gitlab: 'GitLab',
  helpfulResponse: 'Полезный ответ',
  inTheBrowser: 'В браузере',
  inThisConversation: 'В этом разговоре',
  includes: 'Включает',
  insideTheApp: 'Внутри приложения',
  installed: 'Установлено',
  integrations: 'Интеграции',
  iLlApproachThisFromThePerspective: 'Я подхожу к этому с точки зрения {0}.',
  lastName: 'Фамилия',
  limits: 'Ограничения',
  logOutFromAllDevices: 'Выйти со всех устройств',
  logout: 'Выйти',
  manage: 'Управлять',
  manageLimits: 'Управление лимитами',
  marketplace: 'Торговая площадка',
  marketplaceLinkCopied: 'Ссылка на торговую площадку скопирована.',
  marketplaceListings: 'Объявления на торговой площадке',
  meetYourNextTeammate: 'Познакомьтесь со своим следующим товарищем по команде',
  messages: 'Сообщения',
  noConversationsFound: 'Разговоров не найдено.',
  noMatchesYet: 'Пока совпадений нет',
  notifications: 'Уведомления',
  openConversations: 'Открытые беседы',
  openPullRequestLinksInsideYourApp:
    'Откройте ссылки запроса на включение внутри вашего приложения.',
  openTheMarketplaceToExplorePluginsAnd:
    'Откройте Marketplace, чтобы изучить плагины и ботов. Используйте меню разговора, чтобы редактировать внешний вид и детали его бота. Выберите выражение из колеса эмоций. Прокрутите или перетащите дугу фигуры или используйте клавиши со стрелками, чтобы изучить фигуры.',
  prDestination: 'PR-направление',
  people: 'Люди',
  personal: 'Персональный',
  pinChat: 'Закрепить чат',
  pinnedChat: 'Закрепленный чат',
  plugins: 'Плагины',
  profile: 'Профиль',
  public: 'Публичный',
  publicProfile: 'Публичный профиль',
  pullRequests: 'Запросы на извлечение',
  pushNotificationOnYourPhoneWhenThe:
    'Push-уведомление на телефоне, когда приложение отправляет вам сообщение.',
  remove: 'Убрать',
  removeChat: 'Удалить чат',
  renameChat: 'Переименовать чат',
  responseCopied: 'Ответ скопирован',
  reviewProvider: 'Поставщик отзывов',
  rulesAndWorkflows: 'Правила и рабочие процессы',
  saveName: 'Сохранить имя',
  sayHelloTo: 'Передавай привет {0}',
  searchConversations: 'Поиск бесед',
  searchConversations2: 'Поиск бесед…',
  searchMarketplace: 'Поиск на торговой площадке',
  selectGithubOrOtherProvidersForReviews: 'Выберите Github или других поставщиков для отзывов.',
  selectedAgents: 'Выбранные агенты: {0}',
  sendWithEnterUseShiftEnterFor:
    'Отправить с помощью Enter. Используйте Shift + Enter для новой строки. Ваши изменения останутся в этом браузере.',
  settings: 'Настройки',
  share: 'Поделиться',
  showFundamentalNotificationsWhenAnAgentCompletes:
    'Показывать основные уведомления, когда агент выполняет задачу',
  signOut: 'Выйти',
  skills: 'Навыки',
  skills2: 'Навыки · {0}',
  soundEffectATaskIsCompleted: 'Звуковой эффект выполнения задания',
  startAConversation: 'Начать разговор',
  startAGroupChat: 'Начать групповой чат',
  startChat: 'Начать чат',
  storage: 'Хранение',
  support: 'Поддержка',
  systemNotifications: 'Системные уведомления',
  thinkingTogether: 'Думаем вместе…',
  thinking: 'Думая…',
  today: 'Сегодня',
  tools: 'Инструменты',
  toolsForYourWorkflow: 'Инструменты для вашего рабочего процесса',
  tryAnotherNameCategoryOrKeyword: 'Попробуйте другое имя, категорию или ключевое слово.',
  ultra149Mo: 'Ультра $149 в месяц',
  unhelpfulResponse: 'Бесполезный ответ',
  unpinChat: 'Открепить чат',
  upgradeToMax: 'Перейти на Max',
  useToCreateABotOrStart:
    'Используйте +, чтобы создать бота или начать общение с несколькими агентами.',
  viewAdded: 'Посмотреть добавлено {0}',
  viewAll: 'Посмотреть все',
  viewTeamProfile: 'Посмотреть профиль команды',
  viewItem: 'Посмотреть {0}',
  website: 'Сайт',
  whenEnabledYourProfilePageWillBe:
    'Если эта функция включена, страница вашего профиля будет видна всем.',
  youAreOn7xMoreUsageThan: 'Вы используете в 7 раз больше, чем Премиум.',
  youAreOn7xMoreUsageThan2: 'Вы используете в 7 раз больше, чем обычный.',
  areHereSendAMessageToGet: '{0} здесь. Отправьте сообщение, чтобы узнать мнение каждого.',
  itemDetails: '{0} подробнее',
  agentThinking: '{0} думает',
  by: '{0} · от {1}',
  results: (count: number) =>
    plural('ru', count, { one: '{n} результат', few: '{n} результата', other: '{n} результатов' }),
  includedSkills: (apps: number, skills: number) =>
    (apps
      ? plural('ru', apps, {
          one: '{n} приложение',
          few: '{n} приложения',
          other: '{n} приложений',
        }) + ', '
      : '') + plural('ru', skills, { one: '{n} навык', few: '{n} навыка', other: '{n} навыков' }),
};

const translations: Translations = {
  MULTI_AGENT_CHAT_MESSAGES,
  PROJECT_BOARD_MESSAGES: {
    defaultTitle: 'Задачи дизайна Bloom',
    defaultTeam: 'Команда Bloom',
    openTicket: (code, title) => `Открыть ${code}: ${title}`,
    addTicketTo: (column) => `Добавить задачу в ${column}`,
    board: 'Доска проекта',
    controls: 'Управление доской',
    navigation: 'Открыть навигацию',
    inbox: 'Открыть входящие проекта',
    newTicket: 'Новая задача',
    columns: 'Столбцы доски проекта',
    sortTickets: 'Сортировать задачи',
    filterTickets: 'Фильтровать задачи',
    displayOptions: 'Параметры отображения',
    sort: 'Сортировать',
    filter: 'Фильтр',
    display: 'Отображение',
    manualOrder: 'Ручной порядок',
    priority: 'Приоритет',
    title: 'Название',
    project: 'Проект',
    allPriorities: 'Все приоритеты',
    allProjects: 'Все проекты',
    clearFilters: 'Сбросить фильтры',
    showDone: 'Показать завершённые',
    fillScreens: 'Заполнить широкий экран',
    createTicket: 'Создать задачу',
    closeCreate: 'Закрыть создание задачи',
    ticketTitle: 'Название задачи',
    enterTitle: 'Введите название задачи',
    description: 'Описание',
    descriptionArea: 'Область описания',
    status: 'Статус',
    urgency: 'Срочность',
    assignee: 'Исполнитель',
    unassigned: 'Не назначен',
    keepCreating: 'Продолжить создание',
    cancel: 'Отмена',
    addTicket: 'Добавить задачу',
    sortTitle: 'Сортировать по названию',
    noTickets: 'Здесь нет проблем',
    favoriteAdd: 'Добавить в избранное',
    favoriteRemove: 'Убрать из избранного',
    copyLink: 'Копировать ссылку на задачу',
    actions: 'Действия с задачей',
    editDescription: 'Изменить описание',
    copyId: 'Копировать ID задачи',
    reopen: 'Открыть задачу заново',
    markDone: 'Отметить выполненной',
    closeDetails: 'Закрыть подробности задачи',
    linkCopied: 'Ссылка на задачу скопирована',
    idCopied: 'ID задачи скопирован',
    copyFailed: 'Не удалось скопировать. Попробуйте ещё раз.',
    createdBy: 'Создано',
    saveDescription: 'Сохранить описание',
    ticketDescription: 'Описание задачи',
    properties: 'Свойства',
    editAssignees: 'Изменить исполнителей',
    resources: 'Ресурсы',
    tokens: 'Использованные токены',
    comments: 'Комментарии',
    you: 'Вы',
    justNow: 'Только что',
    addComment: 'Добавить комментарий',
    enterComment: 'Введите комментарий',
    postComment: 'Опубликовать комментарий',
    moveUp: 'Переместить вверх',
    moveDown: 'Переместить вниз',
    nextColumn: 'В следующий столбец',
    previousColumn: 'В предыдущий столбец',
    keyboardHint:
      'Enter открывает. Пробел поднимает, стрелки перемещают, пробел опускает, Escape отменяет.',
  },

  AGENT_CREATOR_MESSAGES,
  AGENT_AVATAR_MESSAGES: { label: 'Аватар агента', unavailable: 'Аватар недоступен' },
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
