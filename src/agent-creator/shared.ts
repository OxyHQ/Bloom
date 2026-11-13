import { AGENT_LANGUAGES, AGENT_SPEECH_RATES, DEFAULT_AGENT_PREFERENCES } from './constants';
import type { AgentPreferences } from './types';

export function normalizeAgentPreferences(
  value: Partial<AgentPreferences> | null | undefined,
): AgentPreferences {
  return {
    voice:
      typeof value?.voice === 'string'
        ? value.voice.slice(0, 200)
        : DEFAULT_AGENT_PREFERENCES.voice,
    speed: AGENT_SPEECH_RATES.some((rate) => rate === value?.speed) ? value!.speed! : 1,
    language: AGENT_LANGUAGES.some((language) => language.id === value?.language)
      ? value!.language!
      : 'auto',
    notifications: typeof value?.notifications === 'boolean' ? value.notifications : true,
  };
}
