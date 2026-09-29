// Bloom's pt strings for every family. Loaded on demand by
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
  'top-left': 'canto superior esquerdo',
  'top-right': 'canto superior direito',
  'bottom-left': 'canto inferior esquerdo',
  'bottom-right': 'canto inferior direito',
};

const MESSAGE_MEDIA_MESSAGES__items = (n: number) => plural('pt', n, { one: '{n} item', other: '{n} itens' });

const COMMON_MESSAGES: Translations['COMMON_MESSAGES'] = {
  close: 'Fechar',
  dismiss: 'Dispensar',
  back: 'Voltar',
  goBack: 'Voltar atrás',
  loading: 'Carregando',
  more: 'Mais',
  moreOptions: 'Mais opções',
  moreActions: 'Mais ações',
  progress: 'Progresso',
  stepOf: (step, total) => `Etapa ${step} de ${total}`,
  labelFor: (label, subject) => `${label} de ${subject}`,
  tapToClose: 'Toque para fechar',
  cancel: 'Cancelar',
  done: 'Concluído',
  save: 'Salvar',
  delete: 'Excluir',
  edit: 'Editar',
  remove: 'Remover',
  retry: 'Tentar novamente',
  search: 'Pesquisar',
  showMore: 'Mostrar mais',
  showLess: 'Mostrar menos',
  next: 'Próximo',
  previous: 'Anterior',
  open: 'Abrir',
  menu: 'Menu',
  copy: 'Copiar',
  copied: 'Copiado',
  send: 'Enviar',
  clear: 'Limpar',
  seeAll: 'Ver tudo',
  resizePanels: 'Redimensionar painéis',
};

const SURFACES_MESSAGES: Translations['SURFACES_MESSAGES'] = { confirm: 'Confirmar', ok: 'Certo' };

const CONTACT_CARD_MESSAGES: Translations['CONTACT_CARD_MESSAGES'] = {
  channels: {
    email: { action: 'E-mail', name: (s) => `Enviar e-mail para ${s}` },
    phone: { action: 'Ligar', name: (s) => `Ligar para ${s}` },
    chat: { action: 'Mensagem', name: (s) => `Enviar mensagem para ${s}` },
    meeting: { action: 'Reunião', name: (s) => `Agendar reunião com ${s}` },
    video: { action: 'Vídeo', name: (s) => `Iniciar videochamada com ${s}` },
    website: { action: 'Site', name: (s) => `Abrir o site de ${s}` },
  },
  labelsFor: (name) => `Etiquetas de ${name}`,
  owner: 'Responsável',
};

const CHAT_LIST_MESSAGES: Translations['CHAT_LIST_MESSAGES'] = {
  item: { draft: 'Rascunho:', pinned: 'Fixado', muted: 'Silenciado', verified: 'Verificado', channel: 'Canal', bot: 'Bot', group: 'Grupo' },
  search: { chat: 'Conversas', message: 'Mensagens', contact: 'Contatos', empty: 'Nenhum resultado' },
  list: 'Conversas',
  emptyTitle: 'Nenhuma conversa ainda',
  emptyDescription: 'Inicie uma conversa e ela aparecerá aqui.',
  searchResults: 'Resultados da pesquisa',
  searchChats: 'Pesquisar conversas',
  clearSearch: 'Limpar pesquisa',
  newChat: 'Nova conversa',
  archived: 'Arquivadas',
  archivedName: (label, n) => `${label}, ${plural('pt', n, { one: '{n} conversa', other: '{n} conversas' })}`,
  folderName: (label, n) => `${label}, ${plural('pt', n, { one: '{n} não lida', other: '{n} não lidas' })}`,
  stories: 'Histórias',
  ownStory: 'Sua história',
  addStory: 'Adicionar à sua história',
  storyOf: (name) => `História de ${name}`,
};

const NOTE_CARD_MESSAGES: Translations['NOTE_CARD_MESSAGES'] = {
  pinned: 'Fixada',
  locked: 'Protegida',
  attachments: (n) => plural('pt', n, { one: '{n} anexo', other: '{n} anexos' }),
  select: 'Selecionar nota',
  checklistDone: 'Concluído',
  checklistTodo: 'A fazer',
  more: (n) => `mais ${n}`,
};

const DIALOG_MESSAGES: Translations['DIALOG_MESSAGES'] = {
  view: 'Visualização',
  dismissDialog: 'Fechar caixa de diálogo',
  dismissNamed: (label) => `Fechar ${label}`,
};

const ALERT_DIALOG_MESSAGES: Translations['ALERT_DIALOG_MESSAGES'] = {
  confirm: 'Confirmar',
};

const SIDEBAR_MESSAGES: Translations['SIDEBAR_MESSAGES'] = {
  sidebar: 'Barra lateral',
  collapse: 'Recolher barra lateral',
  expand: 'Expandir barra lateral',
  close: 'Fechar barra lateral',
  quickSearch: 'Pesquisa rápida',
  searchPlaceholder: 'Pesquisar na navegação…',
  searchPlaceholderCompact: 'Pesquisar...',
  filter: 'Filtrar navegação',
  clearSearch: 'Limpar pesquisa de navegação',
  noResults: 'Nenhum resultado',
  mode: 'Modo',
  upgrade: 'Fazer upgrade',
  usersWithAccess: 'Usuários com acesso',
  addUser: 'Adicionar usuário',
  manage: 'Gerenciar',
  accountMenu: 'Menu da conta',
  teamMenu: (team) => `Menu de ${team}`,
};

const FILE_SIZE_UNITS: Translations['FILE_SIZE_UNITS'] = { byte: 'B', kilobyte: 'KB', megabyte: 'MB', gigabyte: 'GB' };

const CARD_FORM_MESSAGES: Translations['CARD_FORM_MESSAGES'] = {
  labels: { number: 'Número do cartão', expiry: 'Data de validade', securityCode: 'Código de segurança', name: 'Nome no cartão', postcode: 'CEP', country: 'País' },
  selectCountry: 'Selecione um país',
};

const CHAT_COMPOSER_MESSAGES: Translations['CHAT_COMPOSER_MESSAGES'] = {
  attach: 'Anexar',
  emoji: 'Emoji',
  camera: 'Câmera',
  mic: 'Gravar uma mensagem de voz',
  message: 'Mensagem',
  enterHint: 'Enter para enviar · Shift + Enter para uma nova linha',
  modEnterHint: '⌘ + Enter para enviar · Enter para uma nova linha',
  cancelRecording: 'Cancelar gravação',
  sendVoice: 'Enviar mensagem de voz',
  deleteRecording: 'Excluir gravação',
  playRecording: 'Reproduzir gravação',
  pauseRecording: 'Pausar gravação',
  lockRecording: 'Bloquear gravação',
  slideToCancel: 'Deslize para cancelar',
  recording: 'Gravando',
  searchEmoji: 'Pesquisar emoji',
  noEmoji: 'Nenhum emoji encontrado',
  frequentlyUsed: 'Usados com frequência',
  skinTone: 'Tom de pele',
  emojiPicker: 'Seletor de emojis',
  moreReactions: 'Mais reações',
  quickReactions: 'Reações rápidas',
  messageActions: 'Ações da mensagem',
  attachments: 'Anexos',
  removeAttachment: (name) => `Remover ${name}`,
  suggestions: { mention: 'Pessoas', command: 'Comandos', emoji: 'Emoji' },
  suggestionVerified: 'Verificado',
  searchingSuggestions: 'Pesquisando…',
  noSuggestions: { mention: 'Nenhuma pessoa encontrada', command: 'Nenhum comando encontrado', emoji: 'Nenhum emoji encontrado' },
  attachmentItems: { gallery: 'Galeria', camera: 'Câmera', file: 'Arquivo', location: 'Localização', contact: 'Contato', poll: 'Enquete', music: 'Música' },
};

const MAIL_COMPOSE_MESSAGES: Translations['MAIL_COMPOSE_MESSAGES'] = {
  to: 'Para',
  cc: 'Cc',
  bcc: 'Cco',
  subject: 'Assunto',
  showCopies: 'Cc Cco',
  hideCopies: 'Ocultar Cc e Cco',
  removeRecipient: (name) => `Remover ${name}`,
  suggestions: 'Contatos',
  send: COMMON_MESSAGES.send,
  sending: 'Enviando',
  attach: 'Anexar um arquivo',
  discard: 'Descartar rascunho',
  minimize: 'Minimizar',
  expand: 'Expandir',
  close: COMMON_MESSAGES.close,
  title: 'Nova mensagem',
};

const MEDIA_PLAYER_MESSAGES: Translations['MEDIA_PLAYER_MESSAGES'] = {
  lyrics: 'Letra',
  queue: 'Fila',
  devices: 'Conectar a um dispositivo',
  fullscreen: 'Tela cheia',
  openPlayer: 'Abrir player',
  currentDevice: 'Dispositivo atual',
  listeningOn: 'Ouvindo em',
  listeningOnDevice: (d) => `Ouvindo em ${d}`,
  selectDevice: 'Selecione um dispositivo',
  noDevices: 'Nenhum outro dispositivo encontrado',
  deviceHelp: 'Não está vendo seu dispositivo?',
  playbackSpeed: 'Velocidade de reprodução',
  sleepTimer: 'Timer para dormir',
  sleepOff: 'Desativado',
  endOfEpisode: 'Fim do episódio',
  oneHour: '1 hora',
  minutes: (n) => plural('pt', n, { one: '{n} minuto', other: '{n} minutos' }),
  stopsIn: (r) => `Para em ${r}`,
  shuffle: 'Aleatório',
  repeat: 'Repetir',
  repeatOne: 'Repetir uma',
  skipBack: (n) => plural('pt', n, { one: 'Voltar {n} segundo', other: 'Voltar {n} segundos' }),
  skipForward: (n) => plural('pt', n, { one: 'Avançar {n} segundo', other: 'Avançar {n} segundos' }),
  closePlayer: 'Fechar player',
  share: 'Compartilhar',
  showLyrics: 'Mostrar letra',
};

const ADDRESS_MESSAGES: Translations['ADDRESS_MESSAGES'] = { emptyTitle: 'Nada aqui ainda', addresses: 'Endereços' };

const CREATOR_STUDIO_MESSAGES: Translations['CREATOR_STUDIO_MESSAGES'] = {
  releaseTypes: { single: 'Single', ep: 'EP', album: 'Álbum' },
  releaseStatuses: {
    draft: 'Rascunho',
    'in-review': 'Em análise',
    scheduled: 'Agendado',
    live: 'Publicado',
    rejected: 'Rejeitado',
    takedown: 'Removido',
  },
  creditRoles: {
    songwriter: 'Autor',
    producer: 'Produtor',
    composer: 'Compositor',
    performer: 'Intérprete',
    lyricist: 'Letrista',
    'mixing-engineer': 'Engenheiro de mixagem',
    'mastering-engineer': 'Engenheiro de masterização',
  },
  periods: { '7d': '7 dias', '28d': '28 dias', '12m': '12 meses', all: 'Todo o período' },
  artworkNotSquare: (w, h) => `A capa deve ser quadrada — esta imagem tem ${w}×${h} px.`,
  artworkTooSmall: (w, h, min) => `A capa é pequena demais (${w}×${h} px). Envie uma de pelo menos ${min}×${min} px.`,
  audience: { title: 'Público', period: 'Período' },
  breakdown: {
    locations: 'Principais locais',
    cities: 'Cidades',
    countries: 'Países',
    age: 'Idade',
    gender: 'Gênero',
    sources: 'Fontes de audição',
    metric: 'Ouvintes',
  },
  streams: {
    metrics: 'Métrica do gráfico',
    summary: (metric, releases) =>
      releases ? `${metric} ao longo do tempo; lançamentos: ${releases}` : `${metric} ao longo do tempo`,
  },
  topTracks: {
    title: 'Principais faixas',
    rank: '#',
    rankName: 'Posição',
    track: 'Faixa',
    streams: 'Reproduções',
    listeners: 'Ouvintes',
    saves: 'Salvamentos',
    trend: 'Tendência',
    trends: { up: 'Em alta', down: 'Em queda', flat: 'Estável', new: 'Nova entrada' },
    newBadge: 'Nova',
    empty: 'Ainda não há reproduções neste período.',
  },
  tracks: (n) => plural('pt', n, { one: '{n} faixa', other: '{n} faixas' }),
  timeline: {
    states: { complete: 'concluído', current: 'em andamento', upcoming: 'não iniciado', error: 'requer atenção' },
    label: 'Progresso do lançamento',
  },
  upload: {
    queued: 'Na fila',
    processing: 'Transcodificando…',
    ready: 'Pronto',
    failed: 'Falha no envio',
    remove: (name) => `Remover ${name}`,
    progress: (name) => `Enviando ${name}`,
  },
  artwork: {
    title: 'Capa',
    requirements: '3000×3000 px, JPG ou PNG',
    replace: 'Substituir',
    remove: 'Remover capa',
    preview: 'Capa do lançamento',
    upload: 'Enviar capa',
  },
  credits: {
    title: 'Créditos',
    role: 'Função',
    name: 'Nome',
    add: 'Adicionar crédito',
    remove: (index, name) => (name ? `Remover crédito ${index + 1}, ${name}` : `Remover crédito ${index + 1}`),
    empty: 'Dê crédito aos autores, produtores e intérpretes desta faixa.',
    field: (field, n) => `${field}, crédito ${n}`,
  },
  artists: {
    add: 'Adicionar',
    addTo: (label) => `Adicionar: ${label}`,
    remove: (name) => `Remover ${name}`,
  },
  isrc: { hint: 'Formato: CC-XXX-YY-NNNNN', invalid: 'Este não é um ISRC válido' },
  metadata: {
    title: 'Título da faixa',
    version: 'Versão',
    versionPlaceholder: 'Remix, ao vivo, acústica…',
    explicit: 'Letra explícita',
    explicitDescription: 'Ative se a faixa tiver linguagem forte ou temas explícitos.',
    genre: 'Gênero',
    genrePlaceholder: 'Escolha um gênero',
    primaryArtists: 'Artistas principais',
    featuredArtists: 'Artistas convidados',
    artistPlaceholder: 'Adicione o nome de um artista',
    language: 'Idioma da letra',
    languagePlaceholder: 'Escolha um idioma',
    lyrics: 'Letra',
    lyricsPlaceholder: 'Cole a letra, uma linha por verso cantado',
  },
  payout: {
    estimated: 'Ganhos estimados neste mês',
    lastPayout: 'Último pagamento',
    nextPayout: 'Próximo pagamento',
    statements: 'Ver extratos',
    chart: 'Ganhos mensais',
  },
  pitch: {
    title: 'Apresentar aos editores',
    description: 'Conte à equipe editorial sobre seu próximo lançamento antes que ele saia.',
    release: 'Lançamento',
    releasePlaceholder: 'Escolha um lançamento futuro',
    moods: 'Clima',
    genres: 'Gênero',
    pitch: 'Sua apresentação',
    pitchPlaceholder: 'O que torna este lançamento especial? Para quem ele é e qual é a história por trás dele?',
    submit: 'Enviar apresentação',
    tagLimit: (max) => `Escolha até ${max}`,
    statuses: { submitted: 'Apresentação enviada', accepted: 'Selecionado para análise', declined: 'Não selecionado desta vez' },
    statusDescriptions: {
      submitted: 'Os editores leem todas as apresentações. Você terá uma resposta antes da data de lançamento.',
      accepted: 'Seu lançamento está sendo considerado para playlists editoriais.',
      declined: 'Este lançamento não foi selecionado. Você poderá apresentar o próximo assim que ele for agendado.',
    },
    edit: 'Editar apresentação',
  },
};

const PROPERTY_INSIGHTS_MESSAGES: Translations['PROPERTY_INSIGHTS_MESSAGES'] = {
  energy: 'Energia',
  pending: 'Pendente',
  energyRatingClass: (r) => `Classificação energética ${r}`,
  energyRatingStatus: (s) => `Classificação energética ${String(s).toLowerCase()}`,
  energyRating: 'Classificação energética',
  certificateInProgress: 'Certificado em curso',
  consumption: 'Consumo',
  emissions: 'Emissões',
  moreEfficient: 'Mais eficiente',
  lessEfficient: 'Menos eficiente',
  walkTime: (t) => `${t} a pé`,
  scoreOutOf: (d, m) => `${d} de ${m}`,
  pricePerSquareMetre: 'Preço por metro quadrado',
  rentHistory: 'Histórico de aluguel',
  rentHistoryEmpty: 'Ainda não há histórico para este imóvel',
  confidence: { low: 'Confiança baixa', medium: 'Confiança média', high: 'Confiança alta' },
  aboveEstimate: (p) => `${p} acima da estimativa`,
  belowEstimate: (p) => `${p} abaixo da estimativa`,
  fairPrice: 'Preço justo',
  estimatedPrice: 'Preço estimado',
  asking: 'Preço pedido',
  noVerdict: 'Dados insuficientes para uma avaliação',
  whyThisEstimate: 'Por que esta estimativa',
  comparables: (n) =>
    plural('pt', n, { one: 'Com base em {n} imóvel comparável', other: 'Com base em {n} imóveis comparáveis' }),
  currentPrice: 'Preço atual',
  now: 'Agora',
  noPriceHistory: 'Ainda não há histórico de preços',
  priceHistoryPeriod: 'Período do histórico de preços',
  priceHistory: 'Histórico de preços',
  priceHistoryTrend: (head, a, aw, b, bw) => `${head}: de ${a} (${aw}) para ${b} (${bw}).`,
};

const MAP_MARKER_MESSAGES: Translations['MAP_MARKER_MESSAGES'] = {
  searchAsMapMoves: 'Pesquisar ao mover o mapa',
  searchThisArea: 'Pesquisar nesta área',
  stays: (n) => mapMarker_countOf('pt', n, { one: '{n} acomodação', other: '{n} acomodações' }),
};

const LISTING_ACTIONS_MESSAGES: Translations['LISTING_ACTIONS_MESSAGES'] = {
  month: 'mês',
  rentalStatus: { available: 'Disponível', reserved: 'Reservado', rented: 'Alugado' },
  rentalStatusMessage: {
    reserved: 'Outro candidato está finalizando um contrato. Novas visitas estão pausadas.',
    rented: 'Este imóvel foi alugado e não aceita mais pedidos.',
  },
  saleStatus: { available: 'À venda', reserved: 'Reservado', sold: 'Vendido' },
  saleStatusMessage: {
    reserved: 'Uma oferta foi aceita. O corretor não está agendando visitas no momento.',
    sold: 'Este imóvel foi vendido.',
  },
  requestViewing: 'Pedir uma visita',
  apply: 'Candidatar-se',
  contactAgent: 'Falar com o corretor',
  requestVisit: 'Pedir uma visita',
  makeOffer: 'Fazer uma oferta',
  yourHome: 'Sua casa',
  theirHome: 'Casa dele(a)',
  dates: 'Datas',
  guests: 'Hóspedes',
  addDates: 'Adicionar datas',
  addGuests: 'Adicionar hóspedes',
  proposeSwap: 'Propor uma troca',
  exchangeModes: { swap: 'Troca recíproca', host: 'Pontos de hóspede', both: 'Qualquer um' },
  scheduleViewing: 'Agendar uma visita',
  noTimesLeft: 'Não há mais horários neste dia',
  noteForLandlord: 'Recado para o proprietário',
  day: 'Dia',
  time: 'Horário',
  submitViewing: 'Pedir visita',
  inPerson: 'Presencial',
  videoCall: 'Videochamada',
  viewingType: 'Tipo de visita',
  yourApplication: 'Sua candidatura',
  applicationProgress: 'Progresso da candidatura',
  progressReady: (done, total) => `${done} de ${total} prontos`,
  applicationStatus: { missing: 'Pendente', uploaded: 'Em análise', verified: 'Verificado', rejected: 'Recusado' },
  applicationAction: { upload: 'Enviar', view: 'Ver', replace: 'Substituir' },
  itemAction: (action, title) => `${action}: ${title}`,
  mortgage: {
    title: 'Simulador de financiamento',
    price: 'Preço do imóvel',
    downPayment: 'Entrada',
    downPaymentPercent: 'Percentual de entrada',
    percent: 'Percentual',
    term: 'Prazo do financiamento',
    years: 'anos',
    rate: 'Taxa de juros',
    monthlyPayment: 'Parcela mensal',
    principal: 'Principal',
    interest: 'Juros',
    loanAmount: 'Valor financiado',
    totalInterest: 'Total de juros',
    totalCost: 'Custo total',
  },
  termYears: (n) => plural('pt', n, { one: '{n} ano', other: '{n} anos' }),
  mortgageDisclaimer:
    'Uma estimativa, não uma oferta. Não inclui tarifas, impostos e seguros, e considera uma taxa fixa durante todo o prazo.',
};

const AGENT_PROGRESS_MESSAGES: Translations['AGENT_PROGRESS_MESSAGES'] = {
  stepsLeft: (n) => plural('pt', n, { one: '{n} etapa restante', other: '{n} etapas restantes' }),
  allCompleted: 'Todas as etapas concluídas',
  minimize: 'Minimizar etapas',
  expand: 'Expandir etapas',
  defaultSteps: [
    'Ler os arquivos do projeto',
    'Atualizar e instalar os tokens do modo claro',
    'Implementar os tokens do modo escuro',
    'Adicionar um seletor de tema reutilizável e registrado',
    'Executar o registro, o lint e o build de produção',
  ],
};

const CALENDAR_MESSAGES: Translations['CALENDAR_MESSAGES'] = {
  newEvent: 'Novo evento',
  openNavigation: 'Abrir navegação',
  month: 'Mês',
  moreEvents: (n) => plural('pt', n, { one: '+{n} outro', other: '+{n} outros' }),
  eventDetails: 'Detalhes do evento',
  join: 'Entrar',
  editTimeZone: 'Editar fuso horário',
  participants: 'Participantes',
  editParticipants: 'Editar participantes',
  reminders: 'Lembretes',
  editReminders: 'Editar lembretes',
  duration: calendar_compactDuration(' h', ' min', ' '),
  jumpToDate: 'Ir para uma data',
  previousMonth: 'Mês anterior',
  nextMonth: 'Próximo mês',
  chooseDate: (month) => `${month}, escolher uma data`,
  inbox: 'Caixa de entrada',
  inboxMenu: 'Menu da caixa de entrada',
  addAccount: 'Adicionar nova conta',
};

const LISTING_DETAILS_MESSAGES: Translations['LISTING_DETAILS_MESSAGES'] = {
  ratedOutOf5: (r) => `Avaliação: ${r} de 5`,
  overallRating: 'Avaliação geral',
  unavailable: 'Indisponível',
  showAllAmenities: (n) =>
    plural('pt', n, { one: 'Mostrar {n} comodidade', other: 'Mostrar todas as {n} comodidades' }),
  showAllFeatures: (n) =>
    plural('pt', n, { one: 'Mostrar {n} característica', other: 'Mostrar todas as {n} características' }),
  propertyFeatures: 'Características do imóvel',
  showAllPhotos: 'Mostrar todas as fotos',
  listingPhotos: 'Fotos do anúncio',
  photoOf: (p, t) => `Foto ${p} de ${t}`,
  photoWithAlt: (a, p, t) => `${a}, foto ${p} de ${t}`,
  floorPlanOf: (a, p, t) => `${a}, planta ${p} de ${t}`,
  landlord: 'Proprietário',
  agent: 'Corretor',
  agency: 'Imobiliária',
  activeListings: (n) => plural('pt', n, { one: '{n} anúncio ativo', other: '{n} anúncios ativos' }),
  verified: 'Verificado',
  showPhone: 'Mostrar telefone',
  call: 'Ligar',
  messageHost: 'Enviar mensagem ao anfitrião',
  message: 'Enviar mensagem',
};

const PRICE_BREAKDOWN_MESSAGES: Translations['PRICE_BREAKDOWN_MESSAGES'] = {
  states: { estimated: 'Estimado', pending: 'Pendente' },
  showDetails: 'Mostrar detalhes do preço',
  hideDetails: 'Ocultar detalhes do preço',
  breakdown: 'Detalhamento do preço',
  about: (label) => `Sobre ${label}`,
};

const DATE_PICKER_MESSAGES: Translations['DATE_PICKER_MESSAGES'] = {
  cancel: 'Cancelar',
  apply: 'Aplicar',
  previousMonth: 'Mês anterior',
  nextMonth: 'Próximo mês',
  datePlaceholder: 'Selecionar data',
  dateLabel: 'Data',
  rangePlaceholder: 'Selecionar período',
  rangeLabel: 'Período',
  startDate: 'Data de início',
  endDate: 'Data de término',
  daysSelected: (n) => plural('pt', n, { one: '{n} dia selecionado', other: '{n} dias selecionados' }),
  presets: {
    today: 'Hoje',
    yesterday: 'Ontem',
    lastWeek: 'Semana passada',
    thisMonth: 'Este mês',
    lastMonth: 'Mês passado',
    thisYear: 'Este ano',
    lastYear: 'Ano passado',
    allTime: 'Todo o período',
  },
  meetingTrigger: 'Agendar uma reunião',
  meetingLabel: 'Agendar reunião',
  send: 'Enviar convite',
  selectTime: 'Selecionar horário',
  duration: (n) => plural('pt', n, { one: '{n} minuto', other: '{n} minutos' }),
};

const SHIPMENT_REQUEST_MESSAGES: Translations['SHIPMENT_REQUEST_MESSAGES'] = {
  kinds: {
    envelope: { label: 'Envelope', description: 'Documentos, chaves, qualquer coisa plana.' },
    parcel: { label: 'Pacote', description: 'Uma caixa ou sacola que uma pessoa consegue carregar.' },
    furniture: { label: 'Móveis', description: 'Um sofá, uma mesa, um colchão — duas pessoas em cada ponta.' },
    pallet: { label: 'Palete', description: 'Embalado e empilhado, movido com plataforma elevatória.' },
    food: { label: 'Comida', description: 'Uma entrega de restaurante, na temperatura certa.' },
  },
  sizes: {
    small: 'Até uma caixa de sapatos — 35 × 25 × 20 cm.',
    medium: 'Até uma mala de bordo — 55 × 40 × 25 cm.',
    large: 'Até uma máquina de lavar — 85 × 60 × 60 cm.',
    extraLarge: 'Maior que isso — conte nas observações.',
  },
  access: { ground: 'Térreo', stairs: 'Escadas', lift: 'Elevador' },
  load: {
    kind: 'O que vamos transportar?',
    size: 'Tamanho',
    weight: 'Peso',
    quantity: 'Quantidade',
    quantityValue: (n) => plural('pt', n, { one: '{n} item', other: '{n} itens' }),
    notes: 'Algo mais que o transportador deva saber?',
    notesPlaceholder: 'Frágil, um código do elevador, onde deixar…',
  },
  options: { extras: 'Extras', access: 'Acesso nos dois endereços', window: 'Quando deve ser coletado?' },
  form: {
    route: 'Trajeto',
    routeDescription: 'Primeiro a coleta, por último a entrega.',
    load: 'A carga',
    photos: 'Fotos',
    photosDescription: 'Uma foto da carga é o que mais melhora os orçamentos que você recebe.',
    options: 'Opções',
    optionsDescription: 'Cada uma muda o preço.',
    price: 'Preço',
  },
  shipmentRequest: 'Solicitação de frete',
};

const LABEL_MESSAGES: Translations['LABEL_MESSAGES'] = { required: 'obrigatório' };

const CHECKOUT_SUMMARY_MESSAGES: Translations['CHECKOUT_SUMMARY_MESSAGES'] = {
  title: 'Revise seu pedido',
  orderSummary: 'Resumo do pedido',
  deliverTo: 'Entregar em',
  notChosen: 'Ainda não escolhido',
  opensPicker: 'Abre o seletor',
  placeOrder: 'Fazer pedido',
  placingOrder: 'Enviando seu pedido',
};

const VEHICLE_PICKER_MESSAGES: Translations['VEHICLE_PICKER_MESSAGES'] = {
  from: 'A partir de',
  fits: (label) => `O que cabe em: ${label}`,
  unavailable: 'Indisponível para esta carga',
  vehicle: 'Veículo',
  vehicles: {
    bike: { label: 'Bicicleta de carga', capacity: 'Até 25 kg · 60 × 40 × 40 cm', fits: ['Documentos', 'Um pedido de comida', 'Uma caixa pequena'] },
    car: { label: 'Carro', capacity: 'Até 150 kg · 100 × 80 × 60 cm', fits: ['Duas malas', 'Quatro caixas', 'Uma bicicleta'] },
    van: { label: 'Van', capacity: 'Até 800 kg · 240 × 150 × 140 cm', fits: ['Um sofá', 'A mudança de um estúdio', 'Meio palete'] },
    boxTruck: { label: 'Caminhão baú', capacity: 'Até 3.500 kg · 420 × 200 × 210 cm', fits: ['Dois paletes', 'A mudança de um apartamento de dois quartos', 'Uma plataforma elevatória'] },
    refrigerated: { label: 'Van refrigerada', capacity: 'Até 700 kg · entre 2 e 8 °C', fits: ['Hortifrúti', 'Bufê refrigerado', 'Flores'] },
  },
};

const COMPOSER_PANEL_MESSAGES: Translations['COMPOSER_PANEL_MESSAGES'] = {
  message: 'Mensagem',
  add: 'Adicionar anexo',
  addMenu: 'Adicionar ao chat',
  permissions: 'Permissões',
  permissionMode: 'Modo de permissão',
  learnMore: 'Saiba mais',
  voice: 'Entrada de voz',
  send: 'Enviar mensagem',
  stop: 'Parar geração',
  permissionTrigger: (mode) => `Permissão: ${mode}`,
  removeFile: (name) => `Remover ${name}`,
  retryFile: (name) => `Tentar ${name} novamente`,
  panelPlaceholder: 'Olá, do que você precisa hoje?',
  pillPlaceholder: 'Pergunte o que quiser',
  pillCompactPlaceholder: 'Pergunte',
  modelSettings: 'Configurações do modelo',
  models: 'Modelos',
  modelGroup: 'Modelo',
  effort: 'Esforço',
  effortAuto: 'Automático',
  faster: 'Mais rápido',
  smarter: 'Mais inteligente',
  quickSearch: 'Pesquisa rápida',
  searchModels: 'Pesquisar modelos',
  closeSearch: 'Fechar pesquisa',
  noMatches: 'Nenhum modelo corresponde',
  providers: 'Provedores',
  matchingModels: 'Modelos correspondentes',
  providerModels: (provider) => `Modelos ${provider}`,
  localFolders: 'Pastas locais',
  context: (percent) => `Contexto ${percent}%`,
  effortLevels: ['Baixo', 'Médio', 'Equilibrado', 'Alto', 'Muito alto', 'Máximo'],
  permissionModes: {
    auto: { label: 'Automático', description: 'O agente decide sozinho' },
    manual: { label: 'Manual', description: 'Sempre perguntar antes de fazer uma alteração' },
    plan: { label: 'Modo plano', description: 'Criar um plano antes de prosseguir' },
    bypass: { label: 'Ignorar tudo', description: 'O agente cuida das decisões de permissão' },
  },
  addMenuRows: {
    add: 'Adicionar',
    plugins: 'Plug-ins',
    files: 'Arquivos e pastas',
    goal: 'Meta',
    goalDescription: 'Defina uma meta para resultados mais rápidos',
    plan: 'Modo plano',
    planDescription: 'Gerencie tarefas complexas',
    documents: 'Documentos',
    documentsDescription: 'Crie e edite documentos',
    spreadsheets: 'Planilhas',
    spreadsheetsDescription: 'Gere planilhas',
    presentations: 'Apresentações',
    presentationsDescription: 'Crie materiais de marketing',
    code: 'Blocos de código',
    codeDescription: 'Escreva e edite código existente',
  },
};

const MESSAGE_BUBBLE_MESSAGES: Translations['MESSAGE_BUBBLE_MESSAGES'] = {
  forwardedFrom: (name) => `Encaminhada de ${name}`,
  deleted: 'Esta mensagem foi apagada',
  retry: 'Tentar enviar novamente',
  addReaction: 'Adicionar uma reação',
  replyTo: 'Ir para a mensagem citada',
  selected: 'Selecionada',
  pending: 'Enviando',
  failed: 'Não enviada',
  reactionSelected: 'selecionada',
  unread: 'Mensagens não lidas',
  typing: 'Digitando…',
};

const PAYMENT_STATUS_MESSAGES: Translations['PAYMENT_STATUS_MESSAGES'] = {
  states: { authorising: 'Autorizando', paid: 'Pago', failed: 'Falha no pagamento', refunded: 'Reembolsado', pending: 'Pagamento pendente' },
  reference: 'Referência',
};

const AVATAR_MESSAGES: Translations['AVATAR_MESSAGES'] = { live: 'AO VIVO' };

const PLACE_CARD_MESSAGES: Translations['PLACE_CARD_MESSAGES'] = {
  openStates: {
    open: 'Aberto',
    'closing-soon': 'Fecha em breve',
    closed: 'Fechado',
    'opening-soon': 'Abre em breve',
  },
  new: 'Novo',
  actions: 'Ações',
  actionsFor: (name) => `Ações de ${name}`,
  rated: (value, reviews) =>
    placeCard_withReviews(
      `Avaliação de ${value} de 5`,
      reviews === undefined ? undefined : placeCard_countOf('pt', reviews, { one: '{n} avaliação', other: '{n} avaliações' }),
    ),
};

const SOCIAL_BUTTON_MESSAGES: Translations['SOCIAL_BUTTON_MESSAGES'] = { actions: { continue: (b) => `Continuar com ${b}`, signIn: (b) => `Entrar com ${b}`, signUp: (b) => `Cadastrar-se com ${b}` } };

const QUESTIONNAIRE_MESSAGES: Translations['QUESTIONNAIRE_MESSAGES'] = { other: 'Outra', otherPlaceholder: 'Digite sua resposta aqui', steps: 'Etapas', step: (n) => `Etapa ${n}` };

const MAP_CONTROLS_MESSAGES: Translations['MAP_CONTROLS_MESSAGES'] = {
  group: 'Controles do mapa',
  locate: 'Mostrar minha localização',
  following: 'Parar de seguir minha localização',
  zoomIn: 'Aumentar zoom',
  zoomOut: 'Diminuir zoom',
  zoom: 'Zoom',
  tilt: 'Inclinar o mapa',
  tiltOff: 'Deixar o mapa plano',
  compass: (degrees) => `Voltado para ${degrees} graus. Redefinir para o norte`,
  layerTrigger: 'Camadas do mapa',
  layers: 'Mapa',
  overlays: 'Sobreposições',
};

const PAYMENT_METHOD_MESSAGES: Translations['PAYMENT_METHOD_MESSAGES'] = { states: { expired: 'Expirado', declined: 'Recusado' }, default: 'Padrão', add: 'Adicionar forma de pagamento', emptyTitle: 'Nenhuma forma de pagamento salva', paymentMethods: 'Formas de pagamento' };

const AVATAR_GROUP_MESSAGES: Translations['AVATAR_GROUP_MESSAGES'] = { more: (n) => plural('pt', n, { one: 'mais {n} pessoa', other: 'mais {n} pessoas' }), profile: 'Perfil' };

const MENUBAR_MESSAGES: Translations['MENUBAR_MESSAGES'] = {
  menuBar: 'Barra de menus',
};

const AGENT_THINKING_MESSAGES: Translations['AGENT_THINKING_MESSAGES'] = { thinking: 'Pensando' };

const AI_CHAT_MESSAGES: Translations['AI_CHAT_MESSAGES'] = {
  feedback: { like: 'Boa resposta', dislike: 'Resposta ruim', copy: 'Copiar resposta', copied: 'Copiado!' },
  imageGeneration: {
    generated: 'Imagem gerada',
    generating: 'Gerando imagem',
    remaining: (n) => plural('pt', n, { one: '{n} segundo restante', other: '{n} segundos restantes' }),
    likeToast: 'Obrigado pelo feedback',
    dislikeToast: 'Obrigado, vamos usar isso para melhorar',
  },
  generatedImage: (alt) => `Imagem gerada: ${alt}`,
  codePanel: {
    changes: 'Alterações',
    browser: 'Navegador',
    uncommitted: (n) => plural('pt', n, { one: '{n} alteração não confirmada', other: '{n} alterações não confirmadas' }),
    undo: 'Desfazer alterações',
    browserPreview: 'Prévia do navegador',
  },
  galleryPanel: {
    gallery: 'Galeria',
    styles: 'Estilos',
    stylePresets: 'Estilos predefinidos',
    enlarge: (prompt) => `Ampliar ${prompt}`,
    minimize: (prompt) => `Reduzir ${prompt}`,
    download: (prompt) => `Baixar ${prompt}`,
  },
  panelView: 'Visualização do painel',
  openTerminal: 'Abrir terminal',
  newGeneration: 'Nova geração',
  expandPanel: 'Expandir painel',
  togglePanel: 'Mostrar ou ocultar painel',
  container: { breadcrumb: 'Local do chat', share: 'Compartilhar chat' },
  shell: {
    openNavigation: 'Abrir navegação',
    closeNavigation: 'Fechar navegação',
    openPanel: (panel) => `Abrir ${String(panel).toLowerCase()}`,
    closePanel: (panel) => `Fechar ${String(panel).toLowerCase()}`,
  },
  code: 'Código',
};

const COMMAND_MESSAGES: Translations['COMMAND_MESSAGES'] = {
  placeholder: 'Digite um comando ou pesquise…',
  empty: 'Nenhum resultado encontrado.',
  palette: 'Paleta de comandos',
  clearSearch: 'Limpar pesquisa',
};

const MUSIC_LIBRARY_MESSAGES: Translations['MUSIC_LIBRARY_MESSAGES'] = {
  kinds: {
    playlist: 'Playlist',
    artist: 'Artista',
    album: 'Álbum',
    podcast: 'Podcast',
    audiobook: 'Audiolivro',
    folder: 'Pasta',
  },
  library: {
    title: 'Sua Biblioteca',
    create: 'Criar playlist ou pasta',
    collapseRail: 'Recolher Sua Biblioteca',
    expandRail: 'Abrir Sua Biblioteca',
    filters: 'Filtros',
    clearFilters: 'Limpar filtros',
    filter: {
      playlists: 'Playlists',
      artists: 'Artistas',
      albums: 'Álbuns',
      podcasts: 'Podcasts',
      audiobooks: 'Audiolivros',
    },
    downloaded: 'Baixado',
    search: 'Pesquisar na Sua Biblioteca',
    searchPlaceholder: 'Pesquisar na Sua Biblioteca',
    clearSearch: 'Limpar pesquisa',
    sortAndView: 'Ordenar e visualizar',
    sortBy: 'Ordenar por',
    viewAs: 'Visualizar como',
    sort: {
      recents: 'Recentes',
      'recently-added': 'Adicionados recentemente',
      alphabetical: 'Ordem alfabética',
      creator: 'Criador',
    },
    view: { compact: 'Compacta', list: 'Lista', grid: 'Grade' },
    empty: 'Nada aqui ainda',
  },
  item: { pinned: 'Fixado', downloaded: 'Baixado', nowPlaying: 'Tocando agora' },
  search: { placeholder: 'O que você quer ouvir?', clear: 'Limpar pesquisa', browse: 'Navegar' },
  resultTypes: 'Tipos de resultado',
  topResultKinds: {
    song: 'Música',
    artist: 'Artista',
    album: 'Álbum',
    playlist: 'Playlist',
    podcast: 'Podcast',
    episode: 'Episódio',
    audiobook: 'Audiolivro',
    profile: 'Perfil',
  },
  recent: {
    title: 'Pesquisas recentes',
    clearAll: 'Limpar pesquisas recentes',
    remove: (title) => `Remover ${title}`,
  },
};

const LISTING_CARD_MESSAGES: Translations['LISTING_CARD_MESSAGES'] = {
  statuses: { reserved: 'Reservado', sold: 'Vendido', rented: 'Alugado', unavailable: 'Indisponível' },
  originally: (p) => `antes ${p}`,
  approximateLocation: 'Localização aproximada',
  rated: (r) => `Avaliação: ${r} de 5`,
  ratedWithReviews: (r, c) =>
    plural('pt', c, { one: `Avaliação: ${r} de 5, ${c} avaliação`, other: `Avaliação: ${r} de 5, ${c} avaliações` }),
  newListing: 'Novo',
  previousPhoto: 'Foto anterior',
  nextPhoto: 'Próxima foto',
  saveToWishlist: 'Salvar nos favoritos',
  removeFromWishlist: 'Remover dos favoritos',
};

const NAVIGATION_BANNER_MESSAGES: Translations['NAVIGATION_BANNER_MESSAGES'] = {
  states: { 'off-route': 'Fora da rota', rerouting: 'Procurando uma nova rota' },
  thenLine: (street, maneuver) => navigationBanner_words('depois', navigationBanner_midSentence(maneuver, 'pt'), street),
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
};

const LOCATION_PUCK_MESSAGES: Translations['LOCATION_PUCK_MESSAGES'] = {
  states: { locating: 'Procurando sua localização', located: 'Sua localização', stale: 'Sua última localização conhecida' },
  facing: (state, degrees) => `${state}, voltado para ${degrees} graus`,
};

const CAROUSEL_MESSAGES: Translations['CAROUSEL_MESSAGES'] = {
  previousSlide: 'Slide anterior',
  nextSlide: 'Próximo slide',
  goToSlide: (n) => `Ir para o slide ${n}`,
  slideOf: (at, of) => `${at} de ${of}`,
  carouselRole: 'carrossel',
  slideRole: 'slide',
};

const ORDER_STATUS_MESSAGES: Translations['ORDER_STATUS_MESSAGES'] = { states: { current: 'Em andamento', upcoming: 'Pendente', failed: 'Falhou' }, status: 'Status' };

const RATING_MESSAGES: Translations['RATING_MESSAGES'] = {
  newRating: 'Novo',
  reviews: (c) => rating_countForms('pt', c, { one: '{n} avaliação', other: '{n} avaliações' }),
  rated: (v) => `Avaliado com ${v} de 5`,
  ratedWithReviews: (v, r) => `Avaliado com ${v} de 5, ${r}`,
  star: (n) => plural('pt', n, { one: '{n} estrela', other: '{n} estrelas' }),
};

const LISTING_EDITOR_MESSAGES: Translations['LISTING_EDITOR_MESSAGES'] = {
  offering: {
    rent: { title: 'Para arrendar', description: 'Arrendamento de longa duração, com preço mensal.' },
    sale: { title: 'Para venda', description: 'Venda o imóvel.' },
    stay: { title: 'Alojamento de férias', description: 'Estadias curtas, com preço por noite.' },
    swap: { title: 'Troca de casa', description: 'Troque de casa com outros membros.' },
    monthlyRent: 'Renda mensal',
    deposit: 'Caução',
    depositOption: (months) => (months === 0 ? 'Nenhuma' : plural('pt', months, { one: '{n} mês', other: '{n} meses' })),
    availableFrom: 'Disponível a partir de',
    minimumStay: 'Estadia mínima',
    months: (months) => plural('pt', months, { one: '{n} mês', other: '{n} meses' }),
    askingPrice: 'Preço pedido',
    pricePerArea: 'Preço por m²',
    pricePerAreaEmpty: 'Adicione um preço',
    nightlyRate: 'Preço por noite',
    cleaningFee: 'Taxa de limpeza',
    minimumNights: 'Mínimo de noites',
    nights: (nights) => plural('pt', nights, { one: '{n} noite', other: '{n} noites' }),
    swapMode: 'Como pretende fazer a troca?',
    swapModes: { swap: 'Trocar de casa', host: 'Apenas receber', both: 'Qualquer um' },
    group: 'Como é oferecido o imóvel?',
  },
  propertyTypes: {
    apartment: 'Apartamento',
    house: 'Moradia',
    room: 'Quarto',
    studio: 'Estúdio',
    duplex: 'Duplex',
    penthouse: 'Penthouse',
    coliving: 'Coliving',
    hostel: 'Hostel',
    other: 'Outro',
  },
  propertyType: 'Tipo de imóvel',
  addressPrecision: {
    exact: {
      title: 'Morada exata',
      description: 'O marcador fica no edifício. Ideal para casas que são fáceis de encontrar de qualquer forma.',
    },
    street: {
      title: 'Só a rua',
      description: 'Mostra a rua, não o número. A morada exata é partilhada após a reserva ou a assinatura.',
    },
    approximate: {
      title: 'Zona aproximada',
      description: 'Mostra um círculo de cerca de 500 m. A opção mais privada.',
    },
  },
  addressPrecisionLabel: 'Precisão da morada',
  addressPrecisionFootnote:
    'O mapa publicado segue esta escolha. A sua morada exata só é partilhada com as pessoas que confirmar.',
  qualityTitle: 'Qualidade do anúncio',
  qualityScore: 'Pontuação de qualidade do anúncio',
  tips: 'Dicas',
  todo: 'Por fazer',
  needsWork: 'Precisa de melhorias',
  good: 'Bom',
  excellent: 'Excelente',
  previewTitle: 'Pré-visualização',
  previewDescription: 'É assim que os hóspedes verão o seu anúncio.',
  card: 'Cartão',
  page: 'Página',
  previewAs: 'Pré-visualizar como',
  reviews: (n, shown) => plural('pt', n, { one: '{s} avaliação', other: '{s} avaliações' }).replace('{s}', shown),
};

const MEDIA_HEADER_MESSAGES: Translations['MEDIA_HEADER_MESSAGES'] = {
  artistPick: 'Escolha do artista',
  saveEpisode: 'Salvar episódio',
  share: 'Compartilhar',
  podcastEpisode: 'Episódio de podcast',
  listeningProgress: 'Progresso da escuta',
  shuffle: 'Aleatório',
  download: 'Baixar',
  downloadProgress: 'Progresso do download',
  follow: 'Seguir',
  following: 'Seguindo',
  searchInPlaylist: 'Buscar na playlist',
  compactView: 'Visualização compacta',
  editDetails: 'Editar detalhes',
  about: 'Sobre',
  discography: 'Discografia',
  showAll: 'Mostrar tudo',
  albums: 'Álbuns',
  singlesAndEps: 'Singles e EPs',
  compilations: 'Coletâneas',
  audiobook: 'Audiolivro',
  popular: 'Populares',
  seeMore: 'Ver mais',
  podcast: 'Podcast',
  latestEpisode: 'Episódio mais recente',
  verifiedArtist: 'Artista verificado',
  profile: 'Perfil',
  editProfile: 'Editar perfil',
};

const MENU_ITEM_MESSAGES: Translations['MENU_ITEM_MESSAGES'] = {
  diets: { vegetarian: 'Vegetariano', vegan: 'Vegano', 'gluten-free': 'Sem glúten', 'dairy-free': 'Sem lactose', halal: 'Halal', kosher: 'Kosher' },
  spicy: 'Picante',
  spiceOf: (label, level, max) => `${label} ${level} de ${max}`,
  originally: (price, original) => `${price}, antes ${original}`,
  inBasket: (n) => `${n} na sacola`,
  soldOut: 'Esgotado',
  addItem: (name) => `Adicionar ${name}`,
  choose: (n) => `Escolha ${n}`,
  chooseRange: (min, max) => `Escolha de ${min} a ${max}`,
  upTo: (n) => `Até ${n}`,
  optional: 'Opcional',
  quantity: 'Quantidade',
  addToBasket: 'Adicionar à sacola',
  options: 'Opções',
};

const PAGINATION_MESSAGES: Translations['PAGINATION_MESSAGES'] = {
  pagination: 'Paginação',
  goToPage: (page) => `Ir para a página ${page}`,
};

const LEAD_SCORE_MESSAGES: Translations['LEAD_SCORE_MESSAGES'] = { title: 'Pontuação do lead', factors: 'Do que é composta', bands: { cold: 'Frio', warm: 'Morno', hot: 'Quente' } };

const DIRECTIONS_MESSAGES: Translations['DIRECTIONS_MESSAGES'] = {
  modes: { drive: 'Carro', transit: 'Transporte público', walk: 'A pé', cycle: 'Bicicleta' },
  traffic: { light: 'Trânsito leve', moderate: 'Trânsito moderado', heavy: 'Trânsito intenso' },
  maneuvers: {
    depart: 'Partida',
    straight: 'Siga em frente',
    'slight-left': 'Vire levemente à esquerda',
    left: 'Vire à esquerda',
    'sharp-left': 'Vire acentuadamente à esquerda',
    'slight-right': 'Vire levemente à direita',
    right: 'Vire à direita',
    'sharp-right': 'Vire acentuadamente à direita',
    uturn: 'Faça o retorno',
    roundabout: 'Na rotatória',
    merge: 'Entre na via',
    arrive: 'Chegada',
    board: 'Embarque',
    alight: 'Desembarque',
    transfer: 'Faça a baldeação',
    walk: 'Caminhe',
  },
  directions: 'Rotas',
  otherRoutes: 'Outras rotas',
  travelMode: 'Meio de transporte',
  start: 'Iniciar',
  currentStep: 'Etapa atual',
  line: (name) => `Linha ${name}`,
};

const CART_PANEL_MESSAGES: Translations['CART_PANEL_MESSAGES'] = {
  basket: 'Sacola',
  checkout: 'Ir para o pagamento',
  emptyTitle: 'Sua sacola está vazia',
  emptyDescription: 'Adicione algo do cardápio e ele aparecerá aqui.',
  soldOut: 'Esgotado',
  removeItem: (name) => `Remover ${name}`,
  originally: (price, original) => `${price}, antes ${original}`,
  promoCode: 'Cupom',
  apply: 'Aplicar',
  tip: 'Gorjeta',
};

const MEDIA_CARD_MESSAGES: Translations['MEDIA_CARD_MESSAGES'] = {
  albumTypes: { album: 'Álbum', single: 'Single', ep: 'EP', compilation: 'Coletânea' },
  artist: 'Artista',
  verified: 'Verificado',
  audiobook: 'Audiolivro',
  narratedBy: (n) => `Narrado por ${n}`,
  progressOf: (t) => `Progresso de ${t}`,
  episode: 'Episódio',
  played: 'Ouvido',
  event: 'Evento',
  soldOut: 'Esgotado',
  listeningNow: 'Ouvindo agora',
  trackBy: (t, a) => `${t} de ${a}`,
  mix: 'Mix',
  playlist: 'Playlist',
  collaborative: 'Colaborativa',
  ownedBy: (o) => `De ${o}`,
  podcast: 'Podcast',
  profile: 'Perfil',
  followsYou: 'Segue você',
  song: 'Música',
  share: 'Compartilhar',
  listened: 'Ouvido',
};

const JOB_BOARD_MESSAGES: Translations['JOB_BOARD_MESSAGES'] = {
  labels: {
    take: 'Aceitar o frete',
    pass: 'Passar',
    distance: 'Distância',
    duration: 'Tempo',
    window: 'Janela',
    pickup: 'Coleta',
    dropoff: 'Entrega',
    state: { taken: 'Aceito', expired: 'Expirado' },
    showPay: 'Mostrar quanto paga',
    hidePay: 'Ocultar quanto paga',
    payDetails: 'Pagamento por',
    sort: 'Ordenar fretes',
    filtersToggle: 'Filtros',
    filtersActive: (n) => plural('pt', n, { one: '{n} aplicado', other: '{n} aplicados' }),
    sortOptions: {
      pay: 'Mais bem pagos',
      distance: 'Mais próximos',
      soonest: 'Começam antes',
      expiring: 'Encerram antes',
    },
    filters: { distance: 'Distância', pay: 'Pagamento', when: 'Quando', vehicle: 'Veículo' },
    clearFilters: 'Limpar filtros',
    refresh: 'Atualizar a lista',
    count: (n) => plural('pt', n, { one: '{n} frete', other: '{n} fretes' }),
    loading: 'Carregando fretes',
  },
  emptyTitle: 'Nenhum frete no momento',
  emptyDescription: 'Nada corresponde ao que você procura. Amplie um filtro ou atualize de novo em um minuto.',
  list: 'Fretes',
  payDetailsFor: (load) => `Pagamento por ${load}`,
  route: (pickup, dropoff) => `${pickup} e ${dropoff}`,
  bands: {
    anyDistance: 'Qualquer distância',
    underKm: (km) => `Menos de ${km} km`,
    anyTime: 'Qualquer horário',
    withinHour: 'Na próxima hora',
    nextHours: (hours) => `Nas próximas ${hours} horas`,
    today: 'Hoje',
  },
};

const FLOATING_MESSAGES: Translations['FLOATING_MESSAGES'] = {
  submenu: 'Menu secundário',
};

const AGENT_CHAT_MESSAGES: Translations['AGENT_CHAT_MESSAGES'] = {
  chat: {
    newChat: 'Nova conversa',
    emptyTitle: 'Como posso ajudar?',
    emptyDescription: 'Esta conversa usa sua própria chave de API. O histórico fica neste navegador.',
    thinking: 'Pensando',
    error: 'Algo deu errado. Verifique os logs do servidor e tente novamente.',
    suggestions: [
      'Explique o que este projeto inicial faz',
      'Escreva uma atualização de produto em três frases',
      'Me dê cinco nomes para um app de agendamento',
    ],
    you: 'Você',
    assistant: 'Assistente',
  },
  actions: {
    share: 'Compartilhar conversa',
    shared: 'Transcrição copiada',
    more: 'Mais ações desta conversa',
    exportChats: 'Exportar conversas',
    markUnread: 'Marcar como não lida',
    deleteChat: 'Excluir conversa',
  },
  message: { copy: 'Copiar mensagem', readAloud: 'Ler em voz alta', stopReading: 'Parar leitura em voz alta' },
  history: {
    region: 'Histórico de conversas',
    recent: 'Recentes',
    empty: 'As conversas que você iniciar aparecem aqui.',
    rename: 'Renomear',
    renameField: 'Renomear conversa',
    markUnread: 'Marcar como não lida',
    unread: 'Não lida',
    exportCount: (n) =>
      n === 0
        ? 'Nenhuma conversa para exportar'
        : plural('pt', n, { one: 'Exportar {n} conversa', other: 'Exportar {n} conversas' }),
    accountMenu: (name) => `Menu da conta de ${name}`,
    usageLeft: 'Uso restante',
    upgrade: 'Fazer upgrade para o Max',
    logOut: 'Sair',
  },
  composer: {
    field: 'Mensagem',
    placeholder: 'Pergunte qualquer coisa',
    attach: 'Adicionar anexo',
    send: 'Enviar mensagem',
    stop: 'Parar geração',
    notConfigured: 'Não configurado',
    messageCount: (n) => plural('pt', n, { one: '{n} mensagem', other: '{n} mensagens' }),
    answeringWith: (model) => `Respondendo com ${model}`,
  },
  ago: {
    justNow: 'agora mesmo',
    minutes: (n) => plural('pt', n, { one: 'há {n} minuto', other: 'há {n} minutos' }),
    hours: (n) => plural('pt', n, { one: 'há {n} hora', other: 'há {n} horas' }),
    days: (n) => plural('pt', n, { one: 'há {n} dia', other: 'há {n} dias' }),
  },
  age: { now: 'agora', minutes: (n) => `${n} min`, hours: (n) => `${n} h`, days: (n) => `${n} d` },
};

const WEB_SEARCH_MESSAGES: Translations['WEB_SEARCH_MESSAGES'] = { sources: 'Fontes', working: 'Trabalhando' };

const MAIL_THREAD_MESSAGES: Translations['MAIL_THREAD_MESSAGES'] = {
  to: 'Para',
  cc: 'Cc',
  bcc: 'Cco',
  reply: 'Responder',
  replyAll: 'Responder a todos',
  forward: 'Encaminhar',
  more: COMMON_MESSAGES.more,
  moreAddresses: (n) => `mais ${n}`,
  earlierMessages: (n) => plural('pt', n, { one: '{n} mensagem anterior', other: '{n} mensagens anteriores' }),
  showTrimmed: 'Mostrar conteúdo cortado',
  hideTrimmed: 'Ocultar conteúdo cortado',
  unread: 'Não lido',
  starred: 'Com estrela',
  star: 'Marcar com estrela',
  attachments: 'Anexos',
  attachmentCount: (n) => plural('pt', n, { one: '{n} anexo', other: '{n} anexos' }),
  expand: 'Expandir mensagem',
  collapse: 'Recolher mensagem',
};

const NOTIFICATION_CENTER_MESSAGES: Translations['NOTIFICATION_CENTER_MESSAGES'] = {
  title: 'Notificações',
  emptyMessage: 'Está tudo em dia.',
  emptyDescription: 'Novas atividades aparecerão aqui quando chegarem.',
  noUnread: 'Nenhuma notificação não lida',
  unread: (n) => plural('pt', n, { one: '{n} não lida', other: '{n} não lidas' }),
  markAllRead: 'Marcar tudo como lido',
  category: 'Categoria de notificação',
  tabs: { all: 'Todas', mentions: 'Menções', system: 'Sistema' },
  unreadDot: 'Não lida',
};

const CHART_CARDS_MESSAGES: Translations['CHART_CARDS_MESSAGES'] = {
  titles: {
    activity: 'Atividade',
    agents: 'Agentes',
    visitors: 'Visitantes',
    breakdown: 'Detalhamento',
    sessions: 'Sessões',
    contributionsThisYear: 'Contribuições este ano',
    earnedSoFar: 'Ganho até agora',
    signUpFunnel: 'Funil de cadastro',
    activeUsers: 'Usuários ativos',
    revenue: 'Receita',
    mostActiveDays: 'Dias mais ativos',
    orders: 'Pedidos',
    trackedTime: 'Tempo registrado',
    revenuePerAccount: 'Receita por conta',
    sleepScore: 'Pontuação do sono',
    pipeline: 'Funil de vendas',
    steps: 'Passos',
    tokens: 'Tokens',
  },
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
  stepsSuffix: 'passos',
  today: 'Hoje',
  thisYear: 'Este ano',
  lastYear: 'Ano passado',
  sinceLastYear: 'o ano passado',
  aYearEarlier: 'um ano antes',
  earningsPeriod: 'Período de ganhos',
  changePeriod: 'Alterar período',
  period: 'Período',
  total: 'total',
  average: 'média',
  thisMonth: 'este mês',
  ofGoal: 'da meta',
  totalSteps: 'passos no total',
  gaugeChart: (title, reading) => `Medidor de ${title.toLowerCase()}: ${reading}`,
  halfGaugeChart: (title, items) => `Meio medidor de ${title.toLowerCase()}: ${items}`,
  radialChart: (title, items) => `Gráfico radial de ${title.toLowerCase()}: ${items}`,
  percentOfGoal: (pct) => `${pct}% da meta`,
  periodOf: (label) => `Período de ${label.toLowerCase()}`,
  chartVs: (title, current, previous) => `Gráfico de ${title.toLowerCase()}: ${current.toLowerCase()} vs. ${previous.toLowerCase()}`,
  lineChart: (title) => `Gráfico de linhas de ${title.toLowerCase()}`,
  barChart: (title, items) => `Gráfico de barras de ${title.toLowerCase()}: ${items}`,
  comboChart: (title, bar, line) => `Gráfico de ${title.toLowerCase()}: barras de ${bar} em relação à linha de ${line}`,
  scatterChart: (title, series) => `Gráfico de dispersão de ${title.toLowerCase()}: ${series}`,
  bubbleChart: (title, series) => `Gráfico de bolhas de ${title.toLowerCase()}: ${series}`,
  ringItem: (label, value, pct) => `${label} ${value}, ${pct}% da meta`,
  scoreOf: (score, max) => `${score} de ${max}`,
  activityFor: (name, day) => `Atividade em ${day} de ${name}`,
  contributions: (n, date) => { const on = date ? ` em ${date}` : ''; return n === 0 ? `Nenhuma contribuição${on}` : plural('pt', n, { one: `{n} contribuição${on}`, other: `{n} contribuições${on}` }); },
};

const CODE_MESSAGES: Translations['CODE_MESSAGES'] = { copy: 'Copiar código', copied: 'Código copiado' };

const OUTLINE_NAV_MESSAGES: Translations['OUTLINE_NAV_MESSAGES'] = { outline: 'Nesta página', progress: (at, of) => `Título ${at} de ${of}` };

const STEPPER_MESSAGES: Translations['STEPPER_MESSAGES'] = { decrease: 'Diminuir', increase: 'Aumentar' };

const CALL_UI_MESSAGES: Translations['CALL_UI_MESSAGES'] = {
  status: {
    calling: 'Chamando…',
    ringing: 'Tocando',
    connecting: 'Conectando…',
    active: 'Conectado',
    reconnecting: 'Reconectando…',
    onHold: 'Em espera',
    ended: 'Chamada encerrada',
  },
  controls: {
    mute: 'Desativar microfone',
    unmute: 'Ativar microfone',
    speakerOn: 'Ativar alto-falante',
    speakerOff: 'Desativar alto-falante',
    videoOn: 'Ativar câmera',
    videoOff: 'Desativar câmera',
    flipCamera: 'Virar câmera',
    screenShareOn: 'Compartilhar tela',
    screenShareOff: 'Parar de compartilhar tela',
    addParticipant: 'Adicionar participante',
    endCall: 'Encerrar chamada',
  },
  screen: {
    minimise: 'Minimizar chamada',
    chat: 'Abrir chat',
    participants: 'Participantes',
    movePip: (c) => `Mover sua imagem (agora no ${callUi_corner(CALL_UI_MESSAGES__CORNERS, c)})`,
  },
  pipCorners: CALL_UI_MESSAGES__CORNERS,
  history: {
    incoming: 'Recebida',
    outgoing: 'Efetuada',
    missed: 'Perdida',
    declined: 'Recusada',
    callBack: (name) => `Ligar de volta para ${name}`,
  },
  incoming: {
    accept: 'Aceitar',
    decline: 'Recusar',
    message: 'Mensagem',
    remind: 'Lembrar-me',
    slideToAnswer: 'Deslize para atender',
    voice: 'Chamada de voz recebida',
    video: 'Chamada de vídeo recebida',
  },
  returnToCall: 'Voltar à chamada',
  returnToCallWith: (name) => `Voltar à chamada com ${name}`,
  join: 'Entrar',
  leave: 'Sair',
  speaking: (name) => `${name} está falando`,
  overflow: (n) => `+${n} outros`,
  muted: (name) => `${name}, microfone desativado`,
};

const RECENT_HIRES_CARD_MESSAGES: Translations['RECENT_HIRES_CARD_MESSAGES'] = { title: 'Contratações recentes' };

const MAIL_LIST_MESSAGES: Translations['MAIL_LIST_MESSAGES'] = {
  draft: 'Rascunho:',
  unread: 'Não lido',
  starred: 'Com estrela',
  star: 'Marcar com estrela',
  attachment: 'Com anexo',
  select: 'Selecionar',
  threadCount: (n) => plural('pt', n, { one: '{n} mensagem', other: '{n} mensagens' }),
  moreLabels: (n) => plural('pt', n, { one: 'mais {n} marcador', other: 'mais {n} marcadores' }),
  selectedCount: (n) => plural('pt', n, { one: '{n} selecionado', other: '{n} selecionados' }),
  selectAll: 'Selecionar tudo',
  clearSelection: 'Limpar seleção',
  emptyTitle: 'Nada aqui',
  emptyDescription: 'Os novos e-mails chegam a esta pasta.',
  today: 'Hoje',
  yesterday: 'Ontem',
  list: 'E-mail',
};

const IMPORTANT_ALERTS_CARD_MESSAGES: Translations['IMPORTANT_ALERTS_CARD_MESSAGES'] = { title: 'Alertas importantes', thisWeek: 'esta semana' };

const STAT_CARDS_MESSAGES: Translations['STAT_CARDS_MESSAGES'] = { about: (label) => `Sobre ${label}`, fromLastMonth: 'Em relação ao mês passado' };

const SHAPE_MESSAGES: Translations['SHAPE_MESSAGES'] = {
  shapes: shapes_shapeNames(
    {
      square: 'Quadrado',
      slanted: 'Inclinado',
      arch: 'Arco',
      semicircle: 'Semicírculo',
      oval: 'Oval',
      pill: 'Pílula',
      triangle: 'Triângulo',
      arrow: 'Seta',
      fan: 'Leque',
      diamond: 'Losango',
      clamshell: 'Concha',
      pentagon: 'Pentágono',
      gem: 'Gema',
      'very-sunny': 'Muito ensolarado',
      sunny: 'Ensolarado',
      burst: 'Explosão',
      'soft-burst': 'Explosão suave',
      boom: 'Estouro',
      'soft-boom': 'Estouro suave',
      flower: 'Flor',
      puffy: 'Fofo',
      'puffy-diamond': 'Losango fofo',
      'ghost-ish': 'Quase fantasma',
      'pixel-circle': 'Círculo pixelado',
      'pixel-triangle': 'Triângulo pixelado',
      bun: 'Pãozinho',
      heart: 'Coração',
    },
    (n) => `Biscoito de ${n} lados`,
    (n) => `Trevo de ${n} folhas`,
  ),
};

const TENANCY_MESSAGES: Translations['TENANCY_MESSAGES'] = {
  leasePaymentStatus: { upcoming: 'Próximo', due: 'Vence em breve', overdue: 'Em atraso', paid: 'Pago' },
  rentPaymentStatus: { paid: 'Pago', pending: 'Pendente', overdue: 'Em atraso', partial: 'Parcial' },
  maintenanceCategory: {
    plumbing: 'Canalização',
    electrical: 'Eletricidade',
    appliances: 'Eletrodomésticos',
    heating: 'Aquecimento',
    other: 'Outro',
  },
  maintenancePriority: { low: 'Prioridade baixa', medium: 'Prioridade média', high: 'Prioridade alta', urgent: 'Urgente' },
  maintenanceStage: { reported: 'Comunicado', acknowledged: 'Recebido', scheduled: 'Agendado', resolved: 'Resolvido' },
  documentStatus: { signed: 'Assinado', pending: 'Assinatura pendente', expired: 'Expirado' },
  timelineState: { complete: 'Concluído', current: 'Em curso', upcoming: 'Ainda não' },
  leasePeriod: 'Duração do contrato',
  monthlyRent: 'Renda mensal',
  deposit: 'Caução',
  nextPayment: 'Próximo pagamento',
  paidThisYear: 'Pago este ano',
  outstanding: 'Em dívida',
  noPayments: 'Ainda não há pagamentos',
  columns: { month: 'Mês', dueDate: 'Vencimento', method: 'Método', amount: 'Montante', status: 'Estado' },
  downloadReceipt: (month) => `Transferir recibo de ${month}`,
  dueOn: (date) => `Vence a ${date}`,
  comments: (n) => plural('pt', n, { one: '{n} comentário', other: '{n} comentários' }),
  photo: (position, total) => `Foto ${position} de ${total}`,
  photoWithAlt: (alt, position, total) => `${alt}, foto ${position} de ${total}`,
  sign: 'Assinar',
  signDocument: (name) => `Assinar ${name}`,
  viewDocument: (name) => `Ver ${name}`,
  downloadDocument: (name) => `Transferir ${name}`,
  noDocuments: 'Sem documentos',
};

const DATA_TABLE_MESSAGES: Translations['DATA_TABLE_MESSAGES'] = {
  selectAll: 'Selecionar todas as linhas desta página',
  selectRow: (id) => `Selecionar linha ${id}`,
  densityLabel: 'Densidade da tabela',
  density: { md: 'Normal', sm: 'Compacta' },
};

const ERROR_BOUNDARY_MESSAGES: Translations['ERROR_BOUNDARY_MESSAGES'] = { title: 'Algo deu errado', message: 'Ocorreu um erro inesperado', retry: 'Tentar novamente' };

const AI_PROFILE_CARD_MESSAGES: Translations['AI_PROFILE_CARD_MESSAGES'] = {
  contributions: 'Contribuições este ano',
  activity: 'Atividade',
  periodGroup: (label) => `Período: ${label}`,
  periods: { weekly: 'Semanal', monthly: 'Mensal', yearly: 'Anual' },
};

const BREADCRUMB_MESSAGES: Translations['BREADCRUMB_MESSAGES'] = {
  breadcrumb: 'Trilha de navegação',
};

const MESSAGE_MEDIA_MESSAGES: Translations['MESSAGE_MEDIA_MESSAGES'] = {
  photo: 'Foto',
  video: 'Vídeo',
  photoOf: (i, total) => `Foto ${i} de ${total}`,
  videoOf: (i, total) => `Vídeo ${i} de ${total}`,
  tapToView: 'Toque para ver',
  sendingPhoto: 'Enviando foto',
  sendingVideo: 'Enviando vídeo',
  sendingAlbum: 'Enviando álbum',
  sendingSticker: 'Enviando figurinha',
  sendingGif: 'Enviando GIF',
  album: (n) => `Álbum, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  sharedMedia: (n) => `Mídia compartilhada, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  sharedFiles: (n) => `Arquivos compartilhados, ${MESSAGE_MEDIA_MESSAGES__items(n)}`,
  moreItems: (n) => `+${n} mais`,
  notSent: 'Não enviada',
  voiceMessage: (d) => `Mensagem de voz, ${d}`,
  playVoiceMessage: 'Reproduzir mensagem de voz',
  pauseVoiceMessage: 'Pausar mensagem de voz',
  transcribe: 'Transcrever',
  hideTranscript: 'Ocultar transcrição',
  seek: 'Posição',
  seekPosition: (p, d) => `${p} de ${d}`,
  playbackSpeed: (r) => `Velocidade de reprodução, ${r}`,
  unplayed: 'Não reproduzida',
  download: 'Baixar',
  downloaded: 'Baixado',
  file: 'Arquivo',
  fileKinds: {
    pdf: 'PDF',
    doc: 'DOCUMENTO',
    sheet: 'PLANILHA',
    slides: 'APRESENTAÇÃO',
    zip: 'ZIP',
    audio: 'ÁUDIO',
    video: 'VÍDEO',
    image: 'IMAGEM',
    code: 'CÓDIGO',
  },
  contact: 'Contato',
  message: 'Mensagem',
  add: 'Adicionar',
  location: 'Localização',
  liveLocation: 'Localização em tempo real',
  stopSharing: 'Parar de compartilhar',
  vote: 'Votar',
  viewResults: 'Ver resultados',
  anonymousVoting: 'Votação anônima',
  quiz: 'Quiz',
  selectOne: 'Escolha uma',
  selectOneOrMore: 'Escolha uma ou mais',
  correctAnswer: 'resposta correta',
  yourAnswer: 'sua resposta',
  votes: (n) => (n === 0 ? 'Nenhum voto' : plural('pt', n, { one: '{n} voto', other: '{n} votos' })),
  sticker: 'Figurinha',
};

const PIPELINE_MESSAGES: Translations['PIPELINE_MESSAGES'] = {
  health: { 'on-track': 'No prazo', 'at-risk': 'Em risco', stalled: 'Parado' },
  stalledFor: (duration) => `Parado há ${duration}`,
  move: (title) => `Mover ${title}`,
  stages: 'Etapas do funil',
  stageWithCount: (name, n) => `${name}, ${plural('pt', n, { one: '{n} negócio', other: '{n} negócios' })}`,
  empty: 'Nenhum negócio nesta etapa',
  loadMore: 'Carregar mais',
};

const STAY_SEARCH_MESSAGES: Translations['STAY_SEARCH_MESSAGES'] = {
  where: 'Onde',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  when: 'Quando',
  who: 'Quem',
  destinationPlaceholder: 'Pesquisar destinos',
  datesPlaceholder: 'Adicionar datas',
  guestsPlaceholder: 'Adicionar hóspedes',
  guests: { adults: 'Adultos', children: 'Crianças', infants: 'Bebês', pets: 'Animais' },
  guestDescriptions: {
    adults: '13 anos ou mais',
    children: 'De 2 a 12 anos',
    infants: 'Menos de 2 anos',
    pets: 'Vai levar um animal de serviço?',
  },
  dateFlexibility: 'Flexibilidade de datas',
  exactDates: 'Datas exatas',
  plusMinusDays: (n) => plural('pt', n, { one: '± {n} dia', other: '± {n} dias' }),
  destinations: 'Destinos',
  whereTo: 'Para onde?',
  filters: 'Filtros',
};

const AUTH_CARD_MESSAGES: Translations['AUTH_CARD_MESSAGES'] = {
  modes: {
    signin: {
      title: 'Bem-vindo de volta',
      description: 'Entre para continuar de onde parou.',
      cta: 'Entrar',
      switchLead: 'Novo por aqui?',
      switchAction: 'Criar uma conta',
    },
    signup: {
      title: 'Crie sua conta',
      description: 'Comece a criar em poucos minutos.',
      cta: 'Criar conta',
      switchLead: 'Já tem uma conta?',
      switchAction: 'Entrar',
    },
    verify: {
      title: 'Confira sua caixa de entrada',
      description: 'Digite o código que enviamos para concluir o login.',
      cta: 'Verificar e continuar',
      switchLead: 'O código não chegou?',
      switchAction: 'Enviar outro',
    },
  },
  codeSentTo: (email) => `Digite o código que enviamos para ${email} para concluir o login.`,
  verificationCode: 'Código de verificação',
  fullName: 'Nome completo',
  namePlaceholder: 'Ana Silva',
  email: 'E-mail',
  emailPlaceholder: 'voce@empresa.com',
  emailHint: 'Usamos para entrar em contato com você e nunca o compartilhamos.',
  password: 'Senha',
  passwordPlaceholder: 'Digite sua senha',
  newPasswordPlaceholder: 'Pelo menos 8 caracteres',
  confirmPassword: 'Confirmar senha',
  confirmPasswordPlaceholder: 'Repita sua senha',
  rememberMe: 'Lembrar de mim',
  forgotPassword: 'Esqueceu a senha?',
  terms: 'Ao criar uma conta, você concorda com nossos Termos de Serviço e nossa Política de Privacidade.',
  orContinueWith: 'ou continue com',
};

const TRACK_LIST_MESSAGES: Translations['TRACK_LIST_MESSAGES'] = {
  title: 'Título',
  album: 'Álbum',
  dateAdded: 'Adicionada em',
  plays: 'Reproduções',
  duration: 'Duração',
  moveUp: 'Mover para cima',
  moveDown: 'Mover para baixo',
  reorder: 'Reordenar',
  downloaded: 'Baixada',
  unavailable: 'Indisponível',
  tracks: 'Músicas',
  episodes: 'Episódios',
  selected: (n) => plural('pt', n, { one: '{n} selecionado', other: '{n} selecionados' }),
  clearSelection: 'Limpar seleção',
  played: 'Reproduzido',
  listened: 'Ouvido',
  saveEpisode: 'Salvar episódio',
  downloadEpisode: 'Baixar episódio',
  minutes: (m) => `${m} min`,
  hours: (h) => `${h} h`,
  hoursMinutes: (h, m) => `${h} h ${m} min`,
  remaining: (l) => `Faltam ${l}`,
};

const LYRICS_MESSAGES: Translations['LYRICS_MESSAGES'] = {
  lyrics: 'Letra',
  showLyrics: 'Mostrar letra',
  backToCurrent: 'Voltar à linha atual',
  empty: 'A letra desta faixa não está disponível',
};

const ACTIVITY_FEED_MESSAGES: Translations['ACTIVITY_FEED_MESSAGES'] = {
  kinds: { call: 'Chamada', email: 'E-mail', meeting: 'Reunião', note: 'Nota', 'stage-change': 'Mudança de etapa', task: 'Tarefa concluída' },
  empty: 'Nenhuma atividade registrada',
  loggedBy: (name) => `Registrado por ${name}`,
  filterActivity: 'Filtrar atividade',
};

const PLACE_REVIEWS_MESSAGES: Translations['PLACE_REVIEWS_MESSAGES'] = {
  depositReturned: 'Caução devolvida',
  depositNotReturned: 'Caução não devolvida',
  recommend: 'Recomendaria',
  notRecommend: 'Não recomendaria',
  helpful: 'Útil',
  report: 'Denunciar',
  promptTitle: 'Você morou aqui?',
  promptDescription: (building) =>
    `Ajude os futuros inquilinos de ${building}. As avaliações são anônimas.`,
  writeReview: 'Escrever uma avaliação',
  reviewCount: (n) => plural('pt', n, { one: '{n} avaliação', other: '{n} avaliações' }),
  depositRate: (percent) => `Caução devolvida em ${percent}% das locações`,
  recommendRate: (percent) => `${percent}% recomendariam morar aqui`,
};

const DELIVERY_SLOT_MESSAGES: Translations['DELIVERY_SLOT_MESSAGES'] = {
  tiers: { standard: 'Padrão', express: 'Expressa' },
  soldOut: 'Esgotado',
  asap: 'O mais rápido possível',
  field: 'Horário de entrega',
  day: 'Dia',
  emptyTitle: 'Não há mais horários',
  emptyDescription: 'Escolha outro dia ou o próximo entregador disponível.',
};

const PLACE_LIST_MESSAGES: Translations['PLACE_LIST_MESSAGES'] = {
  visibility: { private: 'Privada', shared: 'Compartilhada', public: 'Pública' },
  places: (n) => plural('pt', n, { one: '{n} lugar', other: '{n} lugares' }),
  sharedWith: (n) => plural('pt', n, { one: 'Compartilhada com {n} pessoa', other: 'Compartilhada com {n} pessoas' }),
  labels: {
    moveEarlier: (position) => `Mover para a posição ${position - 1}`,
    moveLater: (position) => `Mover para a posição ${position + 1}`,
    remove: (name) => `Remover ${name} da lista`,
    moved: (name, position, total) => `${name} movido para a posição ${position} de ${total}`,
    note: 'Nota',
  },
  savedPlaces: 'Lugares salvos',
};

const HOME_SEARCH_MESSAGES: Translations['HOME_SEARCH_MESSAGES'] = {
  modes: { rent: 'Alugar', buy: 'Comprar', stays: 'Aluguel por temporada', swap: 'Troca' },
  searchMode: 'Modo de pesquisa',
  location: 'Localização',
  locationPlaceholder: 'Pesquisar cidade ou região',
  moveIn: 'Mudança',
  datePlaceholder: 'Adicionar data',
  budget: 'Orçamento',
  budgetPlaceholder: 'Adicionar orçamento',
  price: 'Preço',
  pricePlaceholder: 'Qualquer preço',
  propertyType: 'Tipo de imóvel',
  propertyTypePlaceholder: 'Qualquer tipo',
  dates: 'Datas',
  homeSize: 'Tamanho do imóvel',
  homeSizePlaceholder: 'Qualquer tamanho',
  minimum: 'Mínimo',
  maximum: 'Máximo',
  budgetPresets: 'Faixas de orçamento',
  monthlyBudget: 'Orçamento mensal',
  monthlyBudgetDescription: 'Aluguel por mês, sem contas',
  totalPriceDescription: 'Preço total',
  upTo: (amount) => `Até ${amount}`,
  any: 'Qualquer',
  moveInLabels: {
    date: 'Data da mudança',
    flexible: 'Flexível',
    asap: 'O quanto antes',
    contractLength: 'Duração do contrato',
  },
  contractLengths: { any: 'Qualquer', short: '1–6 meses', medium: '6–12 meses', long: 'Mais de 1 ano' },
  saveSearch: 'Salvar pesquisa',
  saved: 'Salva',
  newCount: (n) => plural('pt', n, { one: '{n} novo', other: '{n} novos' }),
  alertsOff: 'Alertas desativados',
  actionOn: (action, subject) => `${action}: ${subject}`,
};

const OFFERING_BADGE_MESSAGES: Translations['OFFERING_BADGE_MESSAGES'] = { offerings: { long_term_rent: 'Para alugar', sale: 'À venda', short_term_rent: 'Aluguel por temporada', exchange: 'Troca' } };

const MAP_ATTRIBUTION_MESSAGES: Translations['MAP_ATTRIBUTION_MESSAGES'] = { scale: 'Escala', mapData: 'Dados do mapa' };

const SLIDER_MESSAGES: Translations['SLIDER_MESSAGES'] = { minimum: 'Mínimo', maximum: 'Máximo', value: (n) => `Valor ${n}` };

const SELECT_MESSAGES: Translations['SELECT_MESSAGES'] = { selectOption: 'Selecione uma opção', scrollUp: 'Rolar para cima', scrollDown: 'Rolar para baixo' };

const ZOOMABLE_MEDIA_GALLERY_MESSAGES: Translations['ZOOMABLE_MEDIA_GALLERY_MESSAGES'] = {
  close: 'Fechar visualizador de mídia',
  previous: 'Item anterior',
  next: 'Próximo item',
  goTo: (i, n) => `Ir para o item ${i} de ${n}`,
  share: 'Compartilhar mídia',
};

const NOTIFICATION_MESSAGES: Translations['NOTIFICATION_MESSAGES'] = { dismiss: 'Dispensar notificação' };

const PHONE_INPUT_MESSAGES: Translations['PHONE_INPUT_MESSAGES'] = { phoneNumber: 'Número de telefone', countryCode: 'Código do país' };

const VENDOR_CARD_MESSAGES: Translations['VENDOR_CARD_MESSAGES'] = {
  facts: { deliveryTime: 'Tempo de entrega', deliveryFee: 'Entrega', distance: 'Distância', minimumOrder: 'Pedido mínimo' },
  availability: { paused: 'Pausado', closed: 'Fechado' },
  new: 'Novo',
  rated: (value, reviews) =>
    `Avaliação ${value} de 5${vendorCard_has(reviews) ? `, ${vendorCard_counted('pt', reviews, { one: '{n} avaliação', other: '{n} avaliações' })}` : ''}`,
};

const CHAT_INDICATORS_MESSAGES: Translations['CHAT_INDICATORS_MESSAGES'] = {
  presence: { online: 'On-line', idle: 'Ausente', offline: 'Off-line', busy: 'Ocupado' },
  status: { sending: 'Enviando…', sent: 'Enviada', delivered: 'Entregue', read: 'Lida', failed: 'Não enviada' },
  unread: 'Não lida',
  unreadCount: (n) => plural('pt', n, { one: '{n} mensagem não lida', other: '{n} mensagens não lidas' }),
};

const MEDIA_CONTROLS_MESSAGES: Translations['MEDIA_CONTROLS_MESSAGES'] = {
  play: 'Reproduzir',
  pause: 'Pausar',
  playSubject: (s) => `Reproduzir ${s}`,
  pauseSubject: (s) => `Pausar ${s}`,
  saveToLibrary: 'Salvar na sua biblioteca',
  saveSubjectToLibrary: (s) => `Salvar ${s} na sua biblioteca`,
  explicit: 'Explícito',
  seek: 'Posição da reprodução',
  seekValue: (a, b) => `${a} de ${b}`,
  mute: 'Silenciar',
  unmute: 'Ativar som',
  volume: 'Volume',
  nowPlaying: 'Tocando agora',
};

const INPUT_OTP_MESSAGES: Translations['INPUT_OTP_MESSAGES'] = {
  oneTimeCode: 'Código de uso único',
  digitOf: (i, n) => `Dígito ${i} de ${n}`,
  characterOf: (i, n) => `Caractere ${i} de ${n}`,
};

const PLACE_DETAILS_MESSAGES: Translations['PLACE_DETAILS_MESSAGES'] = {
  infoActions: { call: 'Ligar', open: 'Abrir site', directions: 'Rotas' },
  busy: {
    busier: 'Mais movimentado que o normal',
    typical: 'Movimentado como de costume',
    quieter: 'Menos movimentado que o normal',
  },
  transitModes: {
    bus: 'Ponto de ônibus',
    metro: 'Estação de metrô',
    train: 'Estação de trem',
    tram: 'Parada de bonde',
    ferry: 'Terminal de balsas',
  },
  notAvailable: 'Não disponível',
  amenities: 'Comodidades',
  today: 'Hoje',
  closed: 'Fechado',
  openingHours: 'Horário de funcionamento',
  day: 'Dia',
  noDataForDay: 'Sem dados para este dia',
  chartNoData: (day) => `${day}, sem dados`,
  chartClosed: (day) => `${day}, fechado o dia todo`,
  chartPeak: (day, hour) => `${day}, mais movimentado às ${hour}`,
  chartNow: (hour) => `agora ${hour}`,
  live: 'em tempo real',
  noDepartures: 'Nenhuma partida no momento',
  nearbyTransit: 'Transporte público próximo',
  lines: 'Linhas',
  line: (name) => `Linha ${name}`,
  towards: (headsign) => `para ${headsign}`,
};

const APP_SHELL_MESSAGES: Translations['APP_SHELL_MESSAGES'] = {
  openNavigation: 'Abrir navegação',
  closeNavigation: 'Fechar navegação',
  resizePanes: 'Redimensionar painéis',
  notifications: 'Notificações',
  proOffer: 'Oferta Pro',
};

const ROUTE_STOPS_MESSAGES: Translations['ROUTE_STOPS_MESSAGES'] = {
  routeStops: 'Paradas da rota',
  origin: 'Origem',
  destination: 'Destino',
  stop: (position) => `Parada ${position}`,
  swap: 'Inverter origem e destino',
  addStop: 'Adicionar uma parada',
  removeStop: (title) => `Remover ${title}`,
  state: { reached: 'Alcançada', current: 'Parada atual', pending: 'Não alcançada' },
};

const SEARCH_MESSAGES: Translations['SEARCH_MESSAGES'] = { clearQuery: 'Limpar pesquisa' };

const TAG_FIELD_MESSAGES: Translations['TAG_FIELD_MESSAGES'] = { remove: (t) => `Remover ${t}`, full: (n) => `Máximo de ${n}`, suggestions: 'Sugestões' };

const STAY_FILTERS_MESSAGES: Translations['STAY_FILTERS_MESSAGES'] = {
  propertyTypes: {
    apartment: 'Apartamento',
    house: 'Casa',
    room: 'Quarto',
    studio: 'Estúdio',
    duplex: 'Duplex / Cobertura',
    coliving: 'Coliving',
    hostel: 'Hostel',
    other: 'Terreno / Outro',
  },
  features: {
    elevator: 'Elevador',
    parking: 'Estacionamento',
    terrace: 'Terraço',
    garden: 'Jardim',
    pool: 'Piscina',
    furnished: 'Mobiliado',
    pets: 'Aceita animais',
    airConditioning: 'Ar-condicionado',
    heating: 'Aquecimento',
    accessible: 'Acessível',
    storage: 'Depósito',
  },
  floors: { ground: 'Térreo', middle: 'Andar intermediário', top: 'Último andar', elevator: 'Com elevador' },
  minimum: 'Mínimo',
  maximum: 'Máximo',
  priceRange: 'Faixa de preço',
  area: 'Área',
  featuresGroup: 'Características',
  floor: 'Andar',
  propertyType: 'Tipo de imóvel',
  energyRating: 'Classificação energética',
  anyRating: 'Qualquer classificação',
  ratingOnly: (r) => `Apenas ${r}`,
  ratingAndBetter: (r) => `${r} ou melhor`,
  filters: 'Filtros',
  filtersApplied: (label, n) => `${label}, ${plural('pt', n, { one: '{n} aplicado', other: '{n} aplicados' })}`,
  clearAll: 'Limpar tudo',
  any: 'Qualquer',
  availableNow: 'Disponível agora',
  availableNowDescription: 'Pronto para morar hoje',
  availableFrom: 'Disponível a partir de',
  anyDate: 'Qualquer data',
};

const SETTINGS_MODAL_MESSAGES: Translations['SETTINGS_MODAL_MESSAGES'] = {
  dialog: 'Configurações',
  nav: 'Seções das configurações',
  close: 'Fechar configurações',
  saved: 'Salvo',
  currentPlan: 'Plano atual',
  actions: 'Ações',
  storage: {
    storedIn: 'Armazenado em',
    fileCount: (n, shown) => plural('pt', n, { one: `${shown} arquivo`, other: `${shown} arquivos` }),
    filterByType: 'Filtrar por tipo de arquivo',
    fileType: 'Tipo de arquivo',
    orderBy: 'Ordenar por',
    modified: 'Modificados',
    oldestFirst: 'Mais antigos primeiro',
    searchFiles: 'Pesquisar arquivos',
    selectAllOnPage: 'Selecionar todos os arquivos desta página',
    fileName: 'Nome do arquivo',
    uploadedOn: 'Enviado em',
    fileSize: 'Tamanho do arquivo',
    sortBy: { name: 'Ordenar por nome do arquivo', uploadedAt: 'Ordenar por data de envio', size: 'Ordenar por tamanho do arquivo' },
    selectFile: (name) => `Selecionar ${name}`,
    deleteFile: 'Excluir arquivo',
    deleteNamed: (name) => `Excluir ${name}`,
    noMatches: 'Nenhum arquivo corresponde aos filtros.',
    documents: 'Documentos',
    spreadsheets: 'Planilhas',
    videos: 'Vídeos',
    downloadFile: 'Baixar arquivo',
    rename: 'Renomear',
    copyLink: 'Copiar link',
  },
  tools: {
    showOutput: 'Mostrar saída',
    refreshTools: 'Atualizar ferramentas',
    removeServer: 'Remover servidor',
    logout: 'Sair',
    logOutOf: (server) => `Sair de ${server}`,
    showTools: (server) => `Mostrar ferramentas de ${server}`,
    hideTools: (server) => `Ocultar ferramentas de ${server}`,
    error: 'Erro',
    showOutputLink: 'Mostrar saída',
    showOutputOf: (server) => `Mostrar saída de ${server}`,
    newServer: 'Novo servidor MCP',
    newServerDescription: 'Adicionar um servidor MCP personalizado',
    projectScope: 'Escopo do projeto',
    authentication: 'Autenticação',
    waitForAuth: 'Aguardar autenticação MCP',
    waitForAuthDescription:
      'Aguardar sem limite de tempo pela autenticação quando solicitada. Se desativado, as solicitações de autenticação são ignoradas após 30 segundos.',
    waitForAuthSwitch: 'Aguardar autenticação MCP',
    scopeServers: (scope) => `Servidores MCP de ${scope}`,
    scopeServersDescription: (scope) => `Servidores disponíveis em ${scope}.`,
    teamServers: 'Servidores MCP da equipe',
    teamServersDescription: 'Configurados no painel',
    manage: 'Gerenciar',
    noTeamServers: 'Nenhum servidor MCP da equipe',
    noTeamServersBody: 'Configure servidores MCP no painel para disponibilizá-los no desktop e na nuvem.',
    configureTeam: 'Configurar servidores MCP da equipe',
    pluginServers: 'Servidores MCP de plugins',
  },
};

const EVICTION_MESSAGES: Translations['EVICTION_MESSAGES'] = {
  status: {
    scheduled: 'Agendado',
    postponed: 'Adiado',
    suspended: 'Suspenso',
    executed: 'Executado',
    cancelled: 'Cancelado',
  },
  attend: 'Vou estar lá',
  share: 'Partilhar',
  contactSupport: 'Contactar o grupo de apoio',
  verified: 'Verificado pela comunidade',
  caseHistory: 'Histórico do caso',
  source: (source) => `Fonte: ${source}`,
};

const BOOKING_MESSAGES: Translations['BOOKING_MESSAGES'] = {
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  guests: 'Hóspedes',
  addDate: 'Adicionar data',
  reserve: 'Reservar',
  checkAvailability: 'Verificar disponibilidade',
  notChargedYet: 'Você ainda não será cobrado',
  total: 'Total',
  tripStatus: { confirmed: 'Confirmada', pending: 'Pendente', cancelled: 'Cancelada', completed: 'Concluída' },
  priceName: booking_priceName((p, u) => `${p} por ${u}`, (s, o) => `${s}, antes ${o}`),
};

const AGENT_LIMITS_CARD_MESSAGES: Translations['AGENT_LIMITS_CARD_MESSAGES'] = { contextWindow: 'Janela de contexto', freeSpace: 'Espaço livre', planUsageLimits: 'Limites de uso do plano', managePlan: 'Gerenciar plano' };

const SWIPE_ROW_MESSAGES: Translations['SWIPE_ROW_MESSAGES'] = {
  closeActions: 'Fechar ações',
};

const PATIENT_INFO_CARD_MESSAGES: Translations['PATIENT_INFO_CARD_MESSAGES'] = { addPhoto: 'Adicionar foto de perfil' };

const THEME_TOGGLE_MESSAGES: Translations['THEME_TOGGLE_MESSAGES'] = { theme: 'Tema', darkMode: 'Modo escuro', lightMode: 'Modo claro', useDarkMode: 'Usar modo escuro', useLightMode: 'Usar modo claro' };

const EARNINGS_MESSAGES: Translations['EARNINGS_MESSAGES'] = {
  earned: 'Ganho',
  period: 'Período de ganhos',
  breakdown: 'De onde veio',
  payout: 'Próximo repasse',
  payoutState: { scheduled: 'Agendado', processing: 'A caminho', paid: 'Pago', held: 'Retido', failed: 'Falhou' },
  chart: (label) => `Ganhos ${label}, por período`,
  empty: 'Nenhum ganho ainda',
  earnings: 'Ganhos',
};

const PROOF_OF_DELIVERY_MESSAGES: Translations['PROOF_OF_DELIVERY_MESSAGES'] = {
  labels: {
    signature: 'Assinatura',
    signaturePad: 'Assinatura',
    signatureHint: 'Assine com o dedo',
    signed: 'Assinado',
    clear: 'Limpar a assinatura',
    typeName: 'Ou digite seu nome',
    typeNamePlaceholder: 'Nome completo',
    photo: 'Foto',
    photoHint: 'Onde você deixou, ou o pacote com o destinatário.',
    code: 'Código de entrega',
    codeHint: 'Peça ao destinatário para ler o código no app dele.',
    recipient: 'Quem recebeu',
    recipientPlaceholder: 'Nome',
    note: 'Observação',
    notePlaceholder: 'Qualquer coisa que valha registrar',
    submit: 'Confirmar a entrega',
    required: 'Obrigatório',
    missing: 'Isto é necessário para confirmar.',
    missingSummary: (n) => plural('pt', n, { one: 'Ainda falta {n} item', other: 'Ainda faltam {n} itens' }),
  },
  proofOfDelivery: 'Comprovante de entrega',
};

const FILE_UPLOAD_MESSAGES: Translations['FILE_UPLOAD_MESSAGES'] = {
  promptWeb: 'Arraste e solte para enviar ou',
  promptNative: 'Toque para',
  selectWeb: 'selecione',
  selectNative: 'selecionar um arquivo',
  uploading: (size) => `Enviando ${size}...`,
  uploaded: 'Enviado com sucesso!',
  unsupported: (extensions) => `Somente arquivos ${extensions} são aceitos`,
  tooLarge: (max) => `O arquivo é maior que ${max}`,
  max: (size) => `(máx. ${size})`,
  uploadFile: 'Enviar um arquivo',
};

const POPOVER_MESSAGES: Translations['POPOVER_MESSAGES'] = {
  popover: 'Pop-over',
};

const QUEUE_PANEL_MESSAGES: Translations['QUEUE_PANEL_MESSAGES'] = {
  queueTab: 'Fila',
  recentTab: 'Tocadas recentemente',
  close: 'Fechar fila',
  nextInQueue: 'A seguir na fila',
  nextFrom: (c) => `A seguir de: ${c}`,
  nextUp: 'A seguir',
  clearQueue: 'Limpar fila',
  reorder: (t) => `Reordenar ${t}`,
  reorderHint: 'Arraste ou use as teclas de seta',
  moveUp: 'Mover para cima',
  moveDown: 'Mover para baixo',
  remove: 'Remover da fila',
  moved: (t, p, n) => `${t} movido para a posição ${p} de ${n}`,
  emptyQueue: 'Sua fila está vazia',
  emptyQueueHint: 'Adicione músicas e episódios para ouvi-los a seguir.',
  emptyRecent: 'Nada tocado ainda',
};

const HOVER_CARD_MESSAGES: Translations['HOVER_CARD_MESSAGES'] = {
  hoverCard: 'Cartão de pré-visualização',
};

const NOTE_EDITOR_MESSAGES: Translations['NOTE_EDITOR_MESSAGES'] = {
  header: {
    saved: 'Salvo',
    saving: 'Salvando…',
    offline: 'Offline — alterações mantidas',
    error: 'Não salvo',
    words: (n) => plural('pt', n, { one: '{n} palavra', other: '{n} palavras' }),
    title: 'Título',
  },
  untitled: 'Sem título',
  note: 'Nota',
  toolbar: { more: 'Mais formatação', moreMenu: 'Mais formatação' },
};

const MEDIA_SHELF_MESSAGES: Translations['MEDIA_SHELF_MESSAGES'] = { filters: 'Filtros', showAll: 'Mostrar tudo' };

const CATEGORY_BAR_MESSAGES: Translations['CATEGORY_BAR_MESSAGES'] = { previous: 'Categorias anteriores', next: 'Próximas categorias' };

const CARRIER_QUOTE_MESSAGES: Translations['CARRIER_QUOTE_MESSAGES'] = {
  labels: {
    accept: 'Aceitar',
    message: 'Mensagem',
    decline: 'Recusar',
    pickup: 'Coleta',
    eta: 'Chega',
    vehicle: 'Veículo',
    jobs: (jobs) => `${jobs} fretes`,
    verified: 'Transportadora verificada',
    marks: { cheapest: 'Mais barato', fastest: 'Mais rápido' },
    showPrice: 'Mostrar detalhes do preço',
    hidePrice: 'Ocultar detalhes do preço',
    priceDetails: 'Detalhes do preço de',
    sort: 'Ordenar ofertas',
    sortOptions: { price: 'Mais baratas', eta: 'Mais rápidas', rating: 'Mais bem avaliadas' },
    count: (n) => plural('pt', n, { one: '{n} oferta', other: '{n} ofertas' }),
    loading: 'Carregando ofertas',
  },
  emptyTitle: 'Nenhuma oferta ainda',
  emptyDescription: 'As transportadoras estão vendo seu frete. As primeiras ofertas costumam chegar em poucos minutos.',
  list: 'Ofertas',
  priceDetailsFor: (name) => `Detalhes do preço de ${name}`,
};

const TEXT_FIELD_MESSAGES: Translations['TEXT_FIELD_MESSAGES'] = { showPassword: 'Mostrar senha', hidePassword: 'Ocultar senha', required: 'obrigatório' };

const CHAT_SCREEN_MESSAGES: Translations['CHAT_SCREEN_MESSAGES'] = {
  call: 'Ligar',
  videoCall: 'Chamada de vídeo',
  searchInConversation: 'Pesquisar na conversa',
  connecting: 'Conectando…',
  verified: 'Verificado',
  bot: 'Bot',
  channel: 'Canal',
  clearSelection: 'Limpar seleção',
  forward: 'Encaminhar',
  pin: 'Fixar',
  selectedCount: (n) => plural('pt', n, { one: '{n} selecionado', other: '{n} selecionados' }),
  pinnedList: 'Mostrar mensagens fixadas',
  pinnedClose: 'Ocultar a barra de fixados',
  pinnedUnpin: 'Desafixar esta mensagem',
  pinnedMessage: 'Mensagem fixada',
  pinnedMessageNumber: (n) => `Mensagem fixada nº ${n}`,
  scrollToBottom: 'Ir para as mensagens mais recentes',
  jumpToMention: 'Ir para a menção',
  emptyTitle: 'Nenhuma mensagem ainda',
  info: 'Informações',
  members: 'Membros',
  addMember: 'Adicionar membros',
  memberSearch: 'Pesquisar membros',
  noMembers: 'Nenhum membro encontrado',
  owner: 'Proprietário',
  admin: 'Administrador',
  resizeList: 'Redimensionar a lista de conversas',
};

const CONTEXT_MENU_MESSAGES: Translations['CONTEXT_MENU_MESSAGES'] = {
  contextMenu: 'Menu de contexto',
};

const SORTABLE_MEDIA_MESSAGES: Translations['SORTABLE_MEDIA_MESSAGES'] = {
  photo: (p, t) => `Foto ${p} de ${t}`,
  cover: 'Capa',
  moveEarlier: (p) => `Mover a foto ${p} para antes`,
  moveLater: (p) => `Mover a foto ${p} para depois`,
  remove: (p) => `Remover a foto ${p}`,
  retry: (p) => `Tentar enviar a foto ${p} novamente`,
  uploading: (p) => `Enviando a foto ${p}`,
  failed: 'Falha no envio',
  add: 'Adicionar fotos',
  moved: (p, t) => `Movida para a posição ${p} de ${t}`,
  photos: 'Fotos',
};

const CONNECTION_DOTS_MESSAGES: Translations['CONNECTION_DOTS_MESSAGES'] = {
  connecting: 'Conectando',
};

const CHAT_PEOPLE_MESSAGES: Translations['CHAT_PEOPLE_MESSAGES'] = {
  newGroup: {
    photo: 'Escolher foto do grupo',
    name: 'Nome do grupo',
    namePlaceholder: 'Dê um nome a este grupo',
    description: 'Descrição',
    descriptionPlaceholder: 'Para que serve este grupo?',
    members: (n) => plural('pt', n, { one: '{n} membro', other: '{n} membros' }),
    addMembers: 'Adicionar membros',
    remove: (name) => `Remover ${name}`,
  },
  member: {
    owner: 'Proprietário',
    admin: 'Administrador',
    promote: 'Tornar administrador',
    restrict: 'Restringir',
    remove: 'Remover do grupo',
    actions: (name) => `Ações de ${name}`,
  },
  story: {
    close: 'Fechar story',
    previous: 'Story anterior',
    next: 'Próximo story',
    mute: 'Silenciar story',
    unmute: 'Ativar som do story',
    more: 'Opções do story',
    replyPlaceholder: 'Responder…',
    send: 'Enviar resposta',
    progress: (index, count) => `Story ${index + 1} de ${count}`,
    react: (emoji) => `Reagir com ${emoji}`,
  },
  searchMembers: 'Pesquisar membros',
  share: 'Compartilhar',
  postOptions: 'Opções da publicação',
  pinned: 'Fixada',
  views: (c) => plural('pt', c, { one: `${c} visualização`, other: `${c} visualizações` }),
  forwards: (c) => plural('pt', c, { one: `${c} encaminhamento`, other: `${c} encaminhamentos` }),
  jumpTo: (letter) => `Ir para ${letter}`,
  add: 'Adicionar',
  added: 'Adicionado',
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
