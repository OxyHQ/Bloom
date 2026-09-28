import type { MessageCatalog } from '../locale/messages';

/** The select family's fixed words, in each Bloom language. `label` still wins. */
export interface SelectMessages {
  /** The list's name when `SelectContent` has no `label`. */
  selectOption: string;
  /** The scroll chevrons' names. */
  scrollUp: string;
  scrollDown: string;
}

export const SELECT_MESSAGES: MessageCatalog<SelectMessages> = {
  en: { selectOption: 'Select an option', scrollUp: 'Scroll up', scrollDown: 'Scroll down' },
  es: { selectOption: 'Selecciona una opción', scrollUp: 'Desplazar hacia arriba', scrollDown: 'Desplazar hacia abajo' },
  ca: { selectOption: 'Selecciona una opció', scrollUp: 'Desplaça amunt', scrollDown: 'Desplaça avall' },
  de: { selectOption: 'Option auswählen', scrollUp: 'Nach oben scrollen', scrollDown: 'Nach unten scrollen' },
  fr: { selectOption: 'Sélectionnez une option', scrollUp: 'Faire défiler vers le haut', scrollDown: 'Faire défiler vers le bas' },
  it: { selectOption: 'Seleziona un’opzione', scrollUp: 'Scorri verso l’alto', scrollDown: 'Scorri verso il basso' },
  pt: { selectOption: 'Selecione uma opção', scrollUp: 'Rolar para cima', scrollDown: 'Rolar para baixo' },
  ru: { selectOption: 'Выберите вариант', scrollUp: 'Прокрутить вверх', scrollDown: 'Прокрутить вниз' },
  tr: { selectOption: 'Bir seçenek belirleyin', scrollUp: 'Yukarı kaydır', scrollDown: 'Aşağı kaydır' },
  ja: { selectOption: 'オプションを選択', scrollUp: '上にスクロール', scrollDown: '下にスクロール' },
  zh: { selectOption: '选择一个选项', scrollUp: '向上滚动', scrollDown: '向下滚动' },
  ar: { selectOption: 'اختر خيارًا', scrollUp: 'التمرير لأعلى', scrollDown: 'التمرير لأسفل' },
  hi: { selectOption: 'कोई विकल्प चुनें', scrollUp: 'ऊपर स्क्रॉल करें', scrollDown: 'नीचे स्क्रॉल करें' },
  bn: { selectOption: 'একটি বিকল্প বেছে নিন', scrollUp: 'উপরে স্ক্রল করুন', scrollDown: 'নিচে স্ক্রল করুন' },
  id: { selectOption: 'Pilih opsi', scrollUp: 'Gulir ke atas', scrollDown: 'Gulir ke bawah' },
};
