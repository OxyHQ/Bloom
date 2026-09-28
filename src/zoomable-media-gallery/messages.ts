import type { MessageCatalog } from '../locale/messages';
import type { ZoomableMediaGalleryLabels } from './types';

/**
 * Every fixed string the media viewer announces, in each Bloom language. A
 * caller's `labels` still wins over any entry.
 */
export const ZOOMABLE_MEDIA_GALLERY_MESSAGES: MessageCatalog<ZoomableMediaGalleryLabels> = {
  en: {
    close: 'Close media viewer',
    previous: 'Previous item',
    next: 'Next item',
    goTo: (i, n) => `Go to item ${i} of ${n}`,
    share: 'Share media',
  },
  es: {
    close: 'Cerrar visor multimedia',
    previous: 'Elemento anterior',
    next: 'Elemento siguiente',
    goTo: (i, n) => `Ir al elemento ${i} de ${n}`,
    share: 'Compartir contenido',
  },
  ca: {
    close: 'Tanca el visualitzador multimèdia',
    previous: 'Element anterior',
    next: 'Element següent',
    goTo: (i, n) => `Ves a l'element ${i} de ${n}`,
    share: 'Comparteix el contingut',
  },
  de: {
    close: 'Medienansicht schließen',
    previous: 'Vorheriges Element',
    next: 'Nächstes Element',
    goTo: (i, n) => `Zu Element ${i} von ${n}`,
    share: 'Medien teilen',
  },
  fr: {
    close: 'Fermer la visionneuse',
    previous: 'Élément précédent',
    next: 'Élément suivant',
    goTo: (i, n) => `Aller à l'élément ${i} sur ${n}`,
    share: 'Partager le média',
  },
  it: {
    close: 'Chiudi il visualizzatore',
    previous: 'Elemento precedente',
    next: 'Elemento successivo',
    goTo: (i, n) => `Vai all'elemento ${i} di ${n}`,
    share: 'Condividi contenuto',
  },
  pt: {
    close: 'Fechar visualizador de mídia',
    previous: 'Item anterior',
    next: 'Próximo item',
    goTo: (i, n) => `Ir para o item ${i} de ${n}`,
    share: 'Compartilhar mídia',
  },
  ru: {
    close: 'Закрыть просмотр',
    previous: 'Предыдущий элемент',
    next: 'Следующий элемент',
    goTo: (i, n) => `Перейти к элементу ${i} из ${n}`,
    share: 'Поделиться медиафайлом',
  },
  tr: {
    close: 'Medya görüntüleyiciyi kapat',
    previous: 'Önceki öğe',
    next: 'Sonraki öğe',
    goTo: (i, n) => `${n} öğeden ${i}. öğeye git`,
    share: 'Medyayı paylaş',
  },
  ja: {
    close: 'メディアビューアを閉じる',
    previous: '前の項目',
    next: '次の項目',
    goTo: (i, n) => `${n}件中${i}件目に移動`,
    share: 'メディアを共有',
  },
  zh: {
    close: '关闭媒体查看器',
    previous: '上一项',
    next: '下一项',
    goTo: (i, n) => `转到第 ${i} 项，共 ${n} 项`,
    share: '分享媒体',
  },
  ar: {
    close: 'إغلاق عارض الوسائط',
    previous: 'العنصر السابق',
    next: 'العنصر التالي',
    goTo: (i, n) => `الانتقال إلى العنصر ${i} من ${n}`,
    share: 'مشاركة الوسائط',
  },
  hi: {
    close: 'मीडिया व्यूअर बंद करें',
    previous: 'पिछला आइटम',
    next: 'अगला आइटम',
    goTo: (i, n) => `${n} में से आइटम ${i} पर जाएं`,
    share: 'मीडिया शेयर करें',
  },
  bn: {
    close: 'মিডিয়া ভিউয়ার বন্ধ করুন',
    previous: 'আগের আইটেম',
    next: 'পরের আইটেম',
    goTo: (i, n) => `${n}টির মধ্যে ${i} নম্বর আইটেমে যান`,
    share: 'মিডিয়া শেয়ার করুন',
  },
  id: {
    close: 'Tutup penampil media',
    previous: 'Item sebelumnya',
    next: 'Item berikutnya',
    goTo: (i, n) => `Buka item ${i} dari ${n}`,
    share: 'Bagikan media',
  },
};
