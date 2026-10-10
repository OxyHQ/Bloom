import type { StyleProp, ViewStyle } from 'react-native';
import type { AvatarConfig } from '../agent-avatar';
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
  avatar: AvatarConfig;
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
  /** Host-owned speech preview, used on native and optionally on web. */
  onPreviewVoice?: (text: string, preferences: AgentPreferences) => void;
}
