import type { MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { ListingStatus } from './types';

/**
 * Every fixed string the listing-card family draws or announces, in each Bloom
 * language. "Loading" comes from `COMMON_MESSAGES`; a caller's `*Label` props
 * still win over any entry here.
 */
export interface ListingCardMessages {
  /** The status pill. `available` draws nothing. */
  statuses: Record<Exclude<ListingStatus, 'available'>, string>;
  /** Appended to a price line's name: "originally €250,000". */
  originally: (price: string) => string;
  approximateLocation: string;
  /** The card's name for a rated stay: "Rated 4.92 out of 5". */
  rated: (rating: string) => string;
  /** The same with a review count, which may arrive pre-formatted ("1,204"). */
  ratedWithReviews: (rating: string, reviews: string) => string;
  /** An unrated stay. */
  newListing: string;
  previousPhoto: string;
  nextPhoto: string;
  saveToWishlist: string;
  removeFromWishlist: string;
}

export const LISTING_CARD_MESSAGES: MessageCatalog<ListingCardMessages> = {
  en: {
    statuses: { reserved: 'Reserved', sold: 'Sold', rented: 'Rented', unavailable: 'Unavailable' },
    originally: (p) => `originally ${p}`,
    approximateLocation: 'Approximate location',
    rated: (r) => `Rated ${r} out of 5`,
    ratedWithReviews: (r, c) =>
      plural('en', c, { one: `Rated ${r} out of 5, ${c} review`, other: `Rated ${r} out of 5, ${c} reviews` }),
    newListing: 'New',
    previousPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    saveToWishlist: 'Save to wishlist',
    removeFromWishlist: 'Remove from wishlist',
  },
  es: {
    statuses: { reserved: 'Reservado', sold: 'Vendido', rented: 'Alquilado', unavailable: 'No disponible' },
    originally: (p) => `antes ${p}`,
    approximateLocation: 'Ubicación aproximada',
    rated: (r) => `Valoración: ${r} de 5`,
    ratedWithReviews: (r, c) =>
      plural('es', c, { one: `Valoración: ${r} de 5, ${c} reseña`, other: `Valoración: ${r} de 5, ${c} reseñas` }),
    newListing: 'Nuevo',
    previousPhoto: 'Foto anterior',
    nextPhoto: 'Foto siguiente',
    saveToWishlist: 'Guardar en favoritos',
    removeFromWishlist: 'Quitar de favoritos',
  },
  ca: {
    statuses: { reserved: 'Reservat', sold: 'Venut', rented: 'Llogat', unavailable: 'No disponible' },
    originally: (p) => `abans ${p}`,
    approximateLocation: 'Ubicació aproximada',
    rated: (r) => `Valoració: ${r} de 5`,
    ratedWithReviews: (r, c) =>
      plural('ca', c, { one: `Valoració: ${r} de 5, ${c} ressenya`, other: `Valoració: ${r} de 5, ${c} ressenyes` }),
    newListing: 'Nou',
    previousPhoto: 'Foto anterior',
    nextPhoto: 'Foto següent',
    saveToWishlist: 'Desa a preferits',
    removeFromWishlist: 'Treu de preferits',
  },
  de: {
    statuses: { reserved: 'Reserviert', sold: 'Verkauft', rented: 'Vermietet', unavailable: 'Nicht verfügbar' },
    originally: (p) => `ursprünglich ${p}`,
    approximateLocation: 'Ungefährer Standort',
    rated: (r) => `Bewertet mit ${r} von 5`,
    ratedWithReviews: (r, c) =>
      plural('de', c, { one: `Bewertet mit ${r} von 5, ${c} Bewertung`, other: `Bewertet mit ${r} von 5, ${c} Bewertungen` }),
    newListing: 'Neu',
    previousPhoto: 'Vorheriges Foto',
    nextPhoto: 'Nächstes Foto',
    saveToWishlist: 'Zur Wunschliste hinzufügen',
    removeFromWishlist: 'Von der Wunschliste entfernen',
  },
  fr: {
    statuses: { reserved: 'Réservé', sold: 'Vendu', rented: 'Loué', unavailable: 'Indisponible' },
    originally: (p) => `initialement ${p}`,
    approximateLocation: 'Emplacement approximatif',
    rated: (r) => `Noté ${r} sur 5`,
    ratedWithReviews: (r, c) =>
      plural('fr', c, { other: `Noté ${r} sur 5, ${c} avis` }),
    newListing: 'Nouveau',
    previousPhoto: 'Photo précédente',
    nextPhoto: 'Photo suivante',
    saveToWishlist: 'Enregistrer dans les favoris',
    removeFromWishlist: 'Retirer des favoris',
  },
  it: {
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
  },
  pt: {
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
  },
  ru: {
    statuses: { reserved: 'Забронировано', sold: 'Продано', rented: 'Сдано', unavailable: 'Недоступно' },
    originally: (p) => `ранее ${p}`,
    approximateLocation: 'Примерное местоположение',
    rated: (r) => `Оценка ${r} из 5`,
    ratedWithReviews: (r, c) =>
      plural('ru', c, { one: `Оценка ${r} из 5, ${c} отзыв`, few: `Оценка ${r} из 5, ${c} отзыва`, many: `Оценка ${r} из 5, ${c} отзывов`, other: `Оценка ${r} из 5, ${c} отзыва` }),
    newListing: 'Новое',
    previousPhoto: 'Предыдущее фото',
    nextPhoto: 'Следующее фото',
    saveToWishlist: 'Добавить в избранное',
    removeFromWishlist: 'Удалить из избранного',
  },
  tr: {
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
  },
  ja: {
    statuses: { reserved: '予約済み', sold: '売却済み', rented: '賃貸済み', unavailable: '利用不可' },
    originally: (p) => `元の価格 ${p}`,
    approximateLocation: 'おおよその位置',
    rated: (r) => `5段階中${r}の評価`,
    ratedWithReviews: (r, c) =>
      plural('ja', c, { other: `5段階中${r}の評価、レビュー${c}件` }),
    newListing: '新着',
    previousPhoto: '前の写真',
    nextPhoto: '次の写真',
    saveToWishlist: 'ウィッシュリストに保存',
    removeFromWishlist: 'ウィッシュリストから削除',
  },
  zh: {
    statuses: { reserved: '已预订', sold: '已售出', rented: '已出租', unavailable: '不可用' },
    originally: (p) => `原价 ${p}`,
    approximateLocation: '大致位置',
    rated: (r) => `评分${r}分（满分5分）`,
    ratedWithReviews: (r, c) =>
      plural('zh', c, { other: `评分${r}分（满分5分），${c}条评价` }),
    newListing: '新房源',
    previousPhoto: '上一张照片',
    nextPhoto: '下一张照片',
    saveToWishlist: '保存到心愿单',
    removeFromWishlist: '从心愿单中移除',
  },
  ar: {
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
  },
  hi: {
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
  },
  bn: {
    statuses: { reserved: 'সংরক্ষিত', sold: 'বিক্রি হয়েছে', rented: 'ভাড়া হয়েছে', unavailable: 'উপলভ্য নয়' },
    originally: (p) => `আগে ${p}`,
    approximateLocation: 'আনুমানিক অবস্থান',
    rated: (r) => `৫-এর মধ্যে ${r} রেটিং`,
    ratedWithReviews: (r, c) =>
      plural('bn', c, { other: `৫-এর মধ্যে ${r} রেটিং, ${c}টি রিভিউ` }),
    newListing: 'নতুন',
    previousPhoto: 'আগের ছবি',
    nextPhoto: 'পরের ছবি',
    saveToWishlist: 'উইশলিস্টে সংরক্ষণ করুন',
    removeFromWishlist: 'উইশলিস্ট থেকে সরান',
  },
  id: {
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
  },
};
