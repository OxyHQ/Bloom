import type { MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/**
 * Every fixed string the place-reviews family draws or announces, in each
 * Bloom language. A caller's `*Label` and `format*` props still win.
 */
export interface PlaceReviewsMessages {
  /** `PlaceReviewCard`'s chips. */
  depositReturned: string;
  depositNotReturned: string;
  recommend: string;
  notRecommend: string;
  /** `PlaceReviewCard`'s footer. */
  helpful: string;
  report: string;
  /** `WriteReviewPrompt`. */
  promptTitle: string;
  promptDescription: (building: string) => string;
  writeReview: string;
  /** `PlaceReviewSummary`'s lines. */
  reviewCount: (count: number) => string;
  depositRate: (percent: number) => string;
  recommendRate: (percent: number) => string;
}

export const PLACE_REVIEWS_MESSAGES: MessageCatalog<PlaceReviewsMessages> = {
  en: {
    depositReturned: 'Deposit returned',
    depositNotReturned: 'Deposit not returned',
    recommend: 'Would recommend',
    notRecommend: "Wouldn't recommend",
    helpful: 'Helpful',
    report: 'Report',
    promptTitle: 'Did you live here?',
    promptDescription: (building) => `Help future tenants of ${building}. Reviews are anonymous.`,
    writeReview: 'Write a review',
    reviewCount: (n) => plural('en', n, { one: '{n} review', other: '{n} reviews' }),
    depositRate: (percent) => `Deposit returned in ${percent}% of tenancies`,
    recommendRate: (percent) => `${percent}% would recommend living here`,
  },
  es: {
    depositReturned: 'Fianza devuelta',
    depositNotReturned: 'Fianza no devuelta',
    recommend: 'Lo recomendaría',
    notRecommend: 'No lo recomendaría',
    helpful: 'Útil',
    report: 'Denunciar',
    promptTitle: '¿Has vivido aquí?',
    promptDescription: (building) => `Ayuda a los futuros inquilinos de ${building}. Las reseñas son anónimas.`,
    writeReview: 'Escribir una reseña',
    reviewCount: (n) => plural('es', n, { one: '{n} reseña', other: '{n} reseñas' }),
    depositRate: (percent) => `Fianza devuelta en el ${percent}% de los alquileres`,
    recommendRate: (percent) => `El ${percent}% recomendaría vivir aquí`,
  },
  ca: {
    depositReturned: 'Fiança retornada',
    depositNotReturned: 'Fiança no retornada',
    recommend: 'Ho recomanaria',
    notRecommend: 'No ho recomanaria',
    helpful: 'Útil',
    report: 'Denuncia',
    promptTitle: 'Hi has viscut?',
    promptDescription: (building) => `Ajuda els futurs llogaters de ${building}. Les ressenyes són anònimes.`,
    writeReview: 'Escriu una ressenya',
    reviewCount: (n) => plural('ca', n, { one: '{n} ressenya', other: '{n} ressenyes' }),
    depositRate: (percent) => `Fiança retornada en el ${percent}% dels lloguers`,
    recommendRate: (percent) => `El ${percent}% recomanaria viure-hi`,
  },
  de: {
    depositReturned: 'Kaution zurückerhalten',
    depositNotReturned: 'Kaution nicht zurückerhalten',
    recommend: 'Würde es empfehlen',
    notRecommend: 'Würde es nicht empfehlen',
    helpful: 'Hilfreich',
    report: 'Melden',
    promptTitle: 'Hast du hier gewohnt?',
    promptDescription: (building) =>
      `Hilf künftigen Mietern von ${building}. Bewertungen sind anonym.`,
    writeReview: 'Bewertung schreiben',
    reviewCount: (n) => plural('de', n, { one: '{n} Bewertung', other: '{n} Bewertungen' }),
    depositRate: (percent) => `Kaution in ${percent} % der Mietverhältnisse zurückerhalten`,
    recommendRate: (percent) => `${percent} % würden das Wohnen hier empfehlen`,
  },
  fr: {
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
  },
  it: {
    depositReturned: 'Deposito restituito',
    depositNotReturned: 'Deposito non restituito',
    recommend: 'Lo consiglierei',
    notRecommend: 'Non lo consiglierei',
    helpful: 'Utile',
    report: 'Segnala',
    promptTitle: 'Hai vissuto qui?',
    promptDescription: (building) =>
      `Aiuta i futuri inquilini di ${building}. Le recensioni sono anonime.`,
    writeReview: 'Scrivi una recensione',
    reviewCount: (n) => plural('it', n, { one: '{n} recensione', other: '{n} recensioni' }),
    depositRate: (percent) => `Deposito restituito nel ${percent}% delle locazioni`,
    recommendRate: (percent) => `Il ${percent}% consiglierebbe di vivere qui`,
  },
  pt: {
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
  },
  ru: {
    depositReturned: 'Залог возвращён',
    depositNotReturned: 'Залог не возвращён',
    recommend: 'Рекомендую',
    notRecommend: 'Не рекомендую',
    helpful: 'Полезно',
    report: 'Пожаловаться',
    promptTitle: 'Вы жили здесь?',
    promptDescription: (building) =>
      `Помогите будущим жильцам дома «${building}». Отзывы анонимны.`,
    writeReview: 'Написать отзыв',
    reviewCount: (n) => plural('ru', n, { one: '{n} отзыв', few: '{n} отзыва', many: '{n} отзывов', other: '{n} отзыва' }),
    depositRate: (percent) => `Залог возвращён в ${percent}% случаев аренды`,
    recommendRate: (percent) => `${percent}% рекомендуют здесь жить`,
  },
  tr: {
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
  },
  ja: {
    depositReturned: '敷金が返還された',
    depositNotReturned: '敷金が返還されなかった',
    recommend: 'おすすめする',
    notRecommend: 'おすすめしない',
    helpful: '参考になった',
    report: '報告',
    promptTitle: 'ここに住んでいましたか？',
    promptDescription: (building) =>
      `${building}の今後の入居者のためにご協力ください。レビューは匿名です。`,
    writeReview: 'レビューを書く',
    reviewCount: (n) => plural('ja', n, { other: '{n}件のレビュー' }),
    depositRate: (percent) => `${percent}%の入居者に敷金が返還されました`,
    recommendRate: (percent) => `${percent}%がここでの暮らしをおすすめしています`,
  },
  zh: {
    depositReturned: '押金已退还',
    depositNotReturned: '押金未退还',
    recommend: '会推荐',
    notRecommend: '不会推荐',
    helpful: '有帮助',
    report: '举报',
    promptTitle: '你在这里住过吗？',
    promptDescription: (building) => `帮助${building}的未来租户。评价均为匿名。`,
    writeReview: '写评价',
    reviewCount: (n) => plural('zh', n, { other: '{n} 条评价' }),
    depositRate: (percent) => `${percent}% 的租约退还了押金`,
    recommendRate: (percent) => `${percent}% 的人推荐住在这里`,
  },
  ar: {
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
  },
  hi: {
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
  },
  bn: {
    depositReturned: 'জামানত ফেরত দেওয়া হয়েছে',
    depositNotReturned: 'জামানত ফেরত দেওয়া হয়নি',
    recommend: 'সুপারিশ করব',
    notRecommend: 'সুপারিশ করব না',
    helpful: 'সহায়ক',
    report: 'রিপোর্ট করুন',
    promptTitle: 'আপনি কি এখানে থাকতেন?',
    promptDescription: (building) =>
      `${building}-এর ভবিষ্যৎ ভাড়াটেদের সাহায্য করুন। রিভিউ বেনামী থাকে।`,
    writeReview: 'রিভিউ লিখুন',
    reviewCount: (n) => plural('bn', n, { other: '{n}টি রিভিউ' }),
    depositRate: (percent) => `${percent}% ভাড়ায় জামানত ফেরত দেওয়া হয়েছে`,
    recommendRate: (percent) => `${percent}% এখানে থাকার সুপারিশ করবেন`,
  },
  id: {
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
  },
};
