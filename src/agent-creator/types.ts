import type { StyleProp, ViewStyle } from 'react-native';
import type { AvatarCharacter } from '../agent-avatar';
import type { AgentCreatorMessages } from './messages';

export type AgentLanguage = 'auto' | 'en' | 'tr' | 'es' | 'fr' | 'de' | 'ja' | 'pt';
export type AgentPreferences = {
  voice: string;
  speed: number;
  language: AgentLanguage;
  notifications: boolean;
};
export type AgentCreatorAgent = {
  id: string;
  name: string;
  label: string;
  description: string;
  avatar: AvatarCharacter;
  preferences?: AgentPreferences;
};
export type AgentVoice = { id: string; name: string; language: string };
export interface AgentCreatorProps {
  locale?: string;
  labels?: Partial<AgentCreatorMessages>;
  agent: AgentCreatorAgent;
  onChange: (agent: AgentCreatorAgent) => void;
  onClose?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Native hosts can supply their speech provider's catalog. Web uses local device voices by default. */
  voices?: readonly AgentVoice[];
  /**
   * Draw the speech preferences (voice, speed, language, notifications) under the profile. Default
   * `true`. A host that does not keep them, because its agents have no voice, turns it off: the
   * editor is then the profile and the look alone, and `agent.preferences` is left untouched.
   */
  showPreferences?: boolean;
  /** Host-owned speech preview, used on native and optionally on web. */
  onPreviewVoice?: (text: string, preferences: AgentPreferences) => void;
}
