import type { MessageCatalog } from '../locale/messages';
import type { LeadScoreBand } from './types';

/**
 * The lead score card's fixed words in each Bloom language. `title`,
 * `factorsLabel` and `bandLabel` still win.
 */
export interface LeadScoreMessages {
  title: string;
  /** The heading over the factors. */
  factors: string;
  /** Each band's word, drawn under the score. */
  bands: Record<LeadScoreBand, string>;
}

export const LEAD_SCORE_MESSAGES: MessageCatalog<LeadScoreMessages> = {
  en: { title: 'Lead score', factors: 'What it is made of', bands: { cold: 'Cold', warm: 'Warm', hot: 'Hot' } },
  es: { title: 'Puntuación del lead', factors: 'De qué se compone', bands: { cold: 'Frío', warm: 'Templado', hot: 'Caliente' } },
  ca: { title: 'Puntuació del lead', factors: 'De què es compon', bands: { cold: 'Fred', warm: 'Tebi', hot: 'Calent' } },
  de: { title: 'Lead-Score', factors: 'Woraus er sich zusammensetzt', bands: { cold: 'Kalt', warm: 'Warm', hot: 'Heiß' } },
  fr: { title: 'Score du prospect', factors: 'Ce qui le compose', bands: { cold: 'Froid', warm: 'Tiède', hot: 'Chaud' } },
  it: { title: 'Punteggio lead', factors: 'Da cosa è composto', bands: { cold: 'Freddo', warm: 'Tiepido', hot: 'Caldo' } },
  pt: { title: 'Pontuação do lead', factors: 'Do que é composta', bands: { cold: 'Frio', warm: 'Morno', hot: 'Quente' } },
  ru: { title: 'Оценка лида', factors: 'Из чего складывается', bands: { cold: 'Холодный', warm: 'Тёплый', hot: 'Горячий' } },
  tr: { title: 'Potansiyel müşteri puanı', factors: 'Nelerden oluşuyor', bands: { cold: 'Soğuk', warm: 'Ilık', hot: 'Sıcak' } },
  ja: { title: 'リードスコア', factors: 'スコアの内訳', bands: { cold: 'コールド', warm: 'ウォーム', hot: 'ホット' } },
  zh: { title: '线索评分', factors: '评分构成', bands: { cold: '冷', warm: '温', hot: '热' } },
  ar: { title: 'تقييم العميل المحتمل', factors: 'مكوّنات التقييم', bands: { cold: 'بارد', warm: 'دافئ', hot: 'ساخن' } },
  hi: { title: 'लीड स्कोर', factors: 'यह किससे बना है', bands: { cold: 'ठंडा', warm: 'गर्म', hot: 'बहुत गर्म' } },
  bn: { title: 'লিড স্কোর', factors: 'এটি কী দিয়ে তৈরি', bands: { cold: 'ঠান্ডা', warm: 'উষ্ণ', hot: 'গরম' } },
  id: { title: 'Skor prospek', factors: 'Komponen skornya', bands: { cold: 'Dingin', warm: 'Hangat', hot: 'Panas' } },
};
