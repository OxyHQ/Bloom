import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the carousel family draws or announces, in each Bloom
 * language. `Carousel`'s `previousLabel`/`nextLabel`/`dotLabel` props and a
 * slide's own `accessibilityLabel` still win over these.
 */
export interface CarouselMessages {
  previousSlide: string;
  nextSlide: string;
  /** A dot's name, given the 1-based slide it scrolls to. */
  goToSlide: (slide: number) => string;
  /** A slide's default name: its 1-based position and the total. */
  slideOf: (position: number, total: number) => string;
  /** What the region and a slide announce themselves as (web `aria-roledescription`). */
  carouselRole: string;
  slideRole: string;
}

export const CAROUSEL_MESSAGES: MessageCatalog<CarouselMessages> = {
  en: {
    previousSlide: 'Previous slide',
    nextSlide: 'Next slide',
    goToSlide: (n) => `Go to slide ${n}`,
    slideOf: (at, of) => `${at} of ${of}`,
    carouselRole: 'carousel',
    slideRole: 'slide',
  },
  es: {
    previousSlide: 'Diapositiva anterior',
    nextSlide: 'Diapositiva siguiente',
    goToSlide: (n) => `Ir a la diapositiva ${n}`,
    slideOf: (at, of) => `${at} de ${of}`,
    carouselRole: 'carrusel',
    slideRole: 'diapositiva',
  },
  ca: {
    previousSlide: 'Diapositiva anterior',
    nextSlide: 'Diapositiva següent',
    goToSlide: (n) => `Ves a la diapositiva ${n}`,
    slideOf: (at, of) => `${at} de ${of}`,
    carouselRole: 'carrusel',
    slideRole: 'diapositiva',
  },
  de: {
    previousSlide: 'Vorherige Folie',
    nextSlide: 'Nächste Folie',
    goToSlide: (n) => `Zu Folie ${n}`,
    slideOf: (at, of) => `${at} von ${of}`,
    carouselRole: 'Karussell',
    slideRole: 'Folie',
  },
  fr: {
    previousSlide: 'Diapositive précédente',
    nextSlide: 'Diapositive suivante',
    goToSlide: (n) => `Aller à la diapositive ${n}`,
    slideOf: (at, of) => `${at} sur ${of}`,
    carouselRole: 'carrousel',
    slideRole: 'diapositive',
  },
  it: {
    previousSlide: 'Slide precedente',
    nextSlide: 'Slide successiva',
    goToSlide: (n) => `Vai alla slide ${n}`,
    slideOf: (at, of) => `${at} di ${of}`,
    carouselRole: 'carosello',
    slideRole: 'slide',
  },
  pt: {
    previousSlide: 'Slide anterior',
    nextSlide: 'Próximo slide',
    goToSlide: (n) => `Ir para o slide ${n}`,
    slideOf: (at, of) => `${at} de ${of}`,
    carouselRole: 'carrossel',
    slideRole: 'slide',
  },
  ru: {
    previousSlide: 'Предыдущий слайд',
    nextSlide: 'Следующий слайд',
    goToSlide: (n) => `Перейти к слайду ${n}`,
    slideOf: (at, of) => `${at} из ${of}`,
    carouselRole: 'карусель',
    slideRole: 'слайд',
  },
  tr: {
    previousSlide: 'Önceki slayt',
    nextSlide: 'Sonraki slayt',
    goToSlide: (n) => `${n}. slayta git`,
    slideOf: (at, of) => `${at}/${of}`,
    carouselRole: 'karusel',
    slideRole: 'slayt',
  },
  ja: {
    previousSlide: '前のスライド',
    nextSlide: '次のスライド',
    goToSlide: (n) => `スライド${n}に移動`,
    slideOf: (at, of) => `${at}/${of}`,
    carouselRole: 'カルーセル',
    slideRole: 'スライド',
  },
  zh: {
    previousSlide: '上一张幻灯片',
    nextSlide: '下一张幻灯片',
    goToSlide: (n) => `转到第 ${n} 张幻灯片`,
    slideOf: (at, of) => `第 ${at} 张，共 ${of} 张`,
    carouselRole: '轮播',
    slideRole: '幻灯片',
  },
  ar: {
    previousSlide: 'الشريحة السابقة',
    nextSlide: 'الشريحة التالية',
    goToSlide: (n) => `الانتقال إلى الشريحة ${n}`,
    slideOf: (at, of) => `${at} من ${of}`,
    carouselRole: 'عرض دوّار',
    slideRole: 'شريحة',
  },
  hi: {
    previousSlide: 'पिछली स्लाइड',
    nextSlide: 'अगली स्लाइड',
    goToSlide: (n) => `स्लाइड ${n} पर जाएं`,
    slideOf: (at, of) => `${of} में से ${at}`,
    carouselRole: 'कैरसेल',
    slideRole: 'स्लाइड',
  },
  bn: {
    previousSlide: 'আগের স্লাইড',
    nextSlide: 'পরের স্লাইড',
    goToSlide: (n) => `স্লাইড ${n}-এ যান`,
    slideOf: (at, of) => `${of}টির মধ্যে ${at}`,
    carouselRole: 'ক্যারোসেল',
    slideRole: 'স্লাইড',
  },
  id: {
    previousSlide: 'Slide sebelumnya',
    nextSlide: 'Slide berikutnya',
    goToSlide: (n) => `Buka slide ${n}`,
    slideOf: (at, of) => `${at} dari ${of}`,
    carouselRole: 'korsel',
    slideRole: 'slide',
  },
};
