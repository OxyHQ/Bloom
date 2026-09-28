import type { MessageCatalog } from '../locale/messages';

/** `AgentThinking`'s default status label in each Bloom language; a `label` prop still wins. */
export interface AgentThinkingMessages {
  thinking: string;
}

export const AGENT_THINKING_MESSAGES: MessageCatalog<AgentThinkingMessages> = {
  en: { thinking: 'Thinking' },
  es: { thinking: 'Pensando' },
  ca: { thinking: 'Pensant' },
  de: { thinking: 'Denkt nach' },
  fr: { thinking: 'Réflexion en cours' },
  it: { thinking: 'Sto pensando' },
  pt: { thinking: 'Pensando' },
  ru: { thinking: 'Думаю' },
  tr: { thinking: 'Düşünüyor' },
  ja: { thinking: '考え中' },
  zh: { thinking: '思考中' },
  ar: { thinking: 'جارٍ التفكير' },
  hi: { thinking: 'सोच रहा है' },
  bn: { thinking: 'ভাবছে' },
  id: { thinking: 'Berpikir' },
};
