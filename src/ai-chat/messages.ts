import type { MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/**
 * Every fixed string the ai-chat family draws or announces, in each Bloom
 * language. The common words (More options, More actions for …) come from
 * `COMMON_MESSAGES`; a caller's `labels` prop still wins over any entry here.
 */
export interface AiChatMessages {
  /** `AiChatFeedbackRow`: the actions under an assistant turn. */
  feedback: {
    like: string;
    dislike: string;
    copy: string;
    /** The tooltip after a copy. */
    copied: string;
  };
  /** `AiChatImageGeneration`. */
  imageGeneration: {
    generated: string;
    generating: string;
    remaining: (seconds: number) => string;
    likeToast: string;
    dislikeToast: string;
  };
  /** Names the finished image: "Generated image: a red fox". */
  generatedImage: (alt: string) => string;
  /** `AiChatCodePanel`. */
  codePanel: {
    changes: string;
    browser: string;
    uncommitted: (count: number) => string;
    undo: string;
    browserPreview: string;
  };
  /** `AiChatGalleryPanel`. */
  galleryPanel: {
    gallery: string;
    styles: string;
    stylePresets: string;
    enlarge: (prompt: string) => string;
    minimize: (prompt: string) => string;
    download: (prompt: string) => string;
  };
  /** Names both panels' tab list. */
  panelView: string;
  /** The panels' default header actions. */
  openTerminal: string;
  newGeneration: string;
  expandPanel: string;
  togglePanel: string;
  /** `AiChatContainer`. */
  container: {
    breadcrumb: string;
    share: string;
  };
  /** `AiChatShell` and `AiChatResizeHandle`. */
  shell: {
    openNavigation: string;
    closeNavigation: string;
    openPanel: (panel: string) => string;
    closePanel: (panel: string) => string;
  };
  /** The shell's default panel name. */
  code: string;
}

// `String(panel)`: the catalog gate calls each entry with sample arguments, a number among them.
export const AI_CHAT_MESSAGES: MessageCatalog<AiChatMessages> = {
  en: {
    feedback: { like: 'Good response', dislike: 'Bad response', copy: 'Copy response', copied: 'Copied!' },
    imageGeneration: {
      generated: 'Image generated',
      generating: 'Generating image',
      remaining: (n) => plural('en', n, { one: '{n} second remaining', other: '{n} seconds remaining' }),
      likeToast: 'Thanks for the feedback',
      dislikeToast: "Thanks — we'll use this to improve",
    },
    generatedImage: (alt) => `Generated image: ${alt}`,
    codePanel: {
      changes: 'Changes',
      browser: 'Browser',
      // The published English wording, misspelling included (see the labels type).
      uncommitted: (count) => `${count} Uncomitted changes`,
      undo: 'Undo changes',
      browserPreview: 'Browser preview',
    },
    galleryPanel: {
      gallery: 'Gallery',
      styles: 'Styles',
      stylePresets: 'Style presets',
      enlarge: (prompt) => `Enlarge ${prompt}`,
      minimize: (prompt) => `Minimize ${prompt}`,
      download: (prompt) => `Download ${prompt}`,
    },
    panelView: 'Panel view',
    openTerminal: 'Open terminal',
    newGeneration: 'New generation',
    expandPanel: 'Expand panel',
    togglePanel: 'Toggle panel',
    container: { breadcrumb: 'Chat location', share: 'Share chat' },
    shell: {
      openNavigation: 'Open navigation',
      closeNavigation: 'Close navigation',
      openPanel: (panel) => `Open ${String(panel).toLowerCase()}`,
      closePanel: (panel) => `Close ${String(panel).toLowerCase()}`,
    },
    code: 'Code',
  },
  es: {
    feedback: { like: 'Buena respuesta', dislike: 'Mala respuesta', copy: 'Copiar respuesta', copied: '¡Copiado!' },
    imageGeneration: {
      generated: 'Imagen generada',
      generating: 'Generando imagen',
      remaining: (n) => plural('es', n, { one: 'Queda {n} segundo', other: 'Quedan {n} segundos' }),
      likeToast: 'Gracias por tu opinión',
      dislikeToast: 'Gracias, lo usaremos para mejorar',
    },
    generatedImage: (alt) => `Imagen generada: ${alt}`,
    codePanel: {
      changes: 'Cambios',
      browser: 'Navegador',
      uncommitted: (n) => plural('es', n, { one: '{n} cambio sin confirmar', other: '{n} cambios sin confirmar' }),
      undo: 'Deshacer cambios',
      browserPreview: 'Vista previa del navegador',
    },
    galleryPanel: {
      gallery: 'Galería',
      styles: 'Estilos',
      stylePresets: 'Estilos predefinidos',
      enlarge: (prompt) => `Ampliar ${prompt}`,
      minimize: (prompt) => `Reducir ${prompt}`,
      download: (prompt) => `Descargar ${prompt}`,
    },
    panelView: 'Vista del panel',
    openTerminal: 'Abrir terminal',
    newGeneration: 'Nueva generación',
    expandPanel: 'Expandir panel',
    togglePanel: 'Mostrar u ocultar panel',
    container: { breadcrumb: 'Ubicación del chat', share: 'Compartir chat' },
    shell: {
      openNavigation: 'Abrir navegación',
      closeNavigation: 'Cerrar navegación',
      openPanel: (panel) => `Abrir ${String(panel).toLowerCase()}`,
      closePanel: (panel) => `Cerrar ${String(panel).toLowerCase()}`,
    },
    code: 'Código',
  },
  ca: {
    feedback: { like: 'Bona resposta', dislike: 'Mala resposta', copy: 'Copia la resposta', copied: 'Copiat!' },
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
      uncommitted: (n) => plural('ca', n, { one: '{n} canvi sense confirmar', other: '{n} canvis sense confirmar' }),
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
  },
  de: {
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
  },
  fr: {
    feedback: {
      like: 'Bonne réponse',
      dislike: 'Mauvaise réponse',
      copy: 'Copier la réponse',
      copied: 'Copié !',
    },
    imageGeneration: {
      generated: 'Image générée',
      generating: "Génération de l'image",
      remaining: (n) => plural('fr', n, { one: '{n} seconde restante', other: '{n} secondes restantes' }),
      likeToast: 'Merci pour votre avis',
      dislikeToast: 'Merci, nous en tiendrons compte pour nous améliorer',
    },
    generatedImage: (alt) => `Image générée : ${alt}`,
    codePanel: {
      changes: 'Modifications',
      browser: 'Navigateur',
      uncommitted: (n) =>
        plural('fr', n, { one: '{n} modification non validée', other: '{n} modifications non validées' }),
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
  },
  it: {
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
  },
  pt: {
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
  },
  ru: {
    feedback: { like: 'Хороший ответ', dislike: 'Плохой ответ', copy: 'Копировать ответ', copied: 'Скопировано!' },
    imageGeneration: {
      generated: 'Изображение создано',
      generating: 'Создание изображения',
      remaining: (n) =>
        plural('ru', n, { one: 'Осталась {n} секунда', few: 'Осталось {n} секунды', many: 'Осталось {n} секунд', other: 'Осталось {n} секунды' }),
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
  },
  tr: {
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
  },
  ja: {
    feedback: { like: '良い回答', dislike: '良くない回答', copy: '回答をコピー', copied: 'コピーしました！' },
    imageGeneration: {
      generated: '画像を生成しました',
      generating: '画像を生成中',
      remaining: (n) => plural('ja', n, { other: '残り{n}秒' }),
      likeToast: 'フィードバックありがとうございます',
      dislikeToast: 'ありがとうございます。改善に役立てます',
    },
    generatedImage: (alt) => `生成された画像: ${alt}`,
    codePanel: {
      changes: '変更',
      browser: 'ブラウザ',
      uncommitted: (n) => plural('ja', n, { other: '未コミットの変更 {n} 件' }),
      undo: '変更を元に戻す',
      browserPreview: 'ブラウザプレビュー',
    },
    galleryPanel: {
      gallery: 'ギャラリー',
      styles: 'スタイル',
      stylePresets: 'スタイルプリセット',
      enlarge: (prompt) => `${prompt}を拡大`,
      minimize: (prompt) => `${prompt}を縮小`,
      download: (prompt) => `${prompt}をダウンロード`,
    },
    panelView: 'パネル表示',
    openTerminal: 'ターミナルを開く',
    newGeneration: '新規生成',
    expandPanel: 'パネルを拡大',
    togglePanel: 'パネルの表示を切り替え',
    container: { breadcrumb: 'チャットの場所', share: 'チャットを共有' },
    shell: {
      openNavigation: 'ナビゲーションを開く',
      closeNavigation: 'ナビゲーションを閉じる',
      openPanel: (panel) => `${panel}を開く`,
      closePanel: (panel) => `${panel}を閉じる`,
    },
    code: 'コード',
  },
  zh: {
    feedback: { like: '回答不错', dislike: '回答不好', copy: '复制回答', copied: '已复制！' },
    imageGeneration: {
      generated: '图片已生成',
      generating: '正在生成图片',
      remaining: (n) => plural('zh', n, { other: '还剩 {n} 秒' }),
      likeToast: '感谢你的反馈',
      dislikeToast: '谢谢，我们会据此改进',
    },
    generatedImage: (alt) => `生成的图片：${alt}`,
    codePanel: {
      changes: '更改',
      browser: '浏览器',
      uncommitted: (n) => plural('zh', n, { other: '{n} 项未提交的更改' }),
      undo: '撤销更改',
      browserPreview: '浏览器预览',
    },
    galleryPanel: {
      gallery: '图库',
      styles: '风格',
      stylePresets: '预设风格',
      enlarge: (prompt) => `放大${prompt}`,
      minimize: (prompt) => `缩小${prompt}`,
      download: (prompt) => `下载${prompt}`,
    },
    panelView: '面板视图',
    openTerminal: '打开终端',
    newGeneration: '重新生成',
    expandPanel: '展开面板',
    togglePanel: '显示或隐藏面板',
    container: { breadcrumb: '聊天位置', share: '分享聊天' },
    shell: {
      openNavigation: '打开导航',
      closeNavigation: '关闭导航',
      openPanel: (panel) => `打开${panel}`,
      closePanel: (panel) => `关闭${panel}`,
    },
    code: '代码',
  },
  ar: {
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
  },
  hi: {
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
  },
  bn: {
    feedback: { like: 'ভালো উত্তর', dislike: 'খারাপ উত্তর', copy: 'উত্তর কপি করুন', copied: 'কপি হয়েছে!' },
    imageGeneration: {
      generated: 'ছবি তৈরি হয়েছে',
      generating: 'ছবি তৈরি হচ্ছে',
      remaining: (n) => plural('bn', n, { one: '{n} সেকেন্ড বাকি', other: '{n} সেকেন্ড বাকি' }),
      likeToast: 'মতামতের জন্য ধন্যবাদ',
      dislikeToast: 'ধন্যবাদ — আমরা এটি উন্নতির কাজে লাগাব',
    },
    generatedImage: (alt) => `তৈরি করা ছবি: ${alt}`,
    codePanel: {
      changes: 'পরিবর্তন',
      browser: 'ব্রাউজার',
      uncommitted: (n) => plural('bn', n, { one: '{n}টি কমিট না করা পরিবর্তন', other: '{n}টি কমিট না করা পরিবর্তন' }),
      undo: 'পরিবর্তন বাতিল করুন',
      browserPreview: 'ব্রাউজার প্রিভিউ',
    },
    galleryPanel: {
      gallery: 'গ্যালারি',
      styles: 'স্টাইল',
      stylePresets: 'স্টাইল প্রিসেট',
      enlarge: (prompt) => `${prompt} বড় করুন`,
      minimize: (prompt) => `${prompt} ছোট করুন`,
      download: (prompt) => `${prompt} ডাউনলোড করুন`,
    },
    panelView: 'প্যানেল ভিউ',
    openTerminal: 'টার্মিনাল খুলুন',
    newGeneration: 'নতুন করে তৈরি',
    expandPanel: 'প্যানেল বড় করুন',
    togglePanel: 'প্যানেল দেখান বা লুকান',
    container: { breadcrumb: 'চ্যাটের অবস্থান', share: 'চ্যাট শেয়ার করুন' },
    shell: {
      openNavigation: 'নেভিগেশন খুলুন',
      closeNavigation: 'নেভিগেশন বন্ধ করুন',
      openPanel: (panel) => `${panel} খুলুন`,
      closePanel: (panel) => `${panel} বন্ধ করুন`,
    },
    code: 'কোড',
  },
  id: {
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
  },
};
