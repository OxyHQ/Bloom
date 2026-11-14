import type { ReactNode } from 'react';
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
  /**
   * The character's parts (shape, eyes, eyewear, accessory, preset, eye spacing). The creator
   * hands it back without paint: the agent's colour is `color`, never the character's.
   */
  avatar: AvatarCharacter;
  /**
   * The agent's colour: its ACCOUNT's (`User.color` in Oxy), a Bloom colour preset key or a
   * `#rrggbb`. It paints the avatar, and the colour control changes it: `onChange` with a new
   * `color`, always a `#rrggbb` lifted to the avatar skin floor, so the stored colour is exactly
   * the drawn one.
   */
  color: string;
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
  /**
   * Rows of the host's own, after the description, in the same card. Compose them with
   * `AgentCreatorField` so they match the built-in ones. The editor owns the look, the name, the
   * label and the description; anything else an agent has (a username, a status, a link) is the
   * host's, and is handed in here rather than added to the editor one field at a time.
   */
  children?: ReactNode;
  /**
   * Cards of the host's own, below the details card: `AgentCreatorSection`s for what an agent has
   * beyond who it is (its schedule, its inbox, what it remembers). The editor scrolls them with
   * the rest.
   */
  sections?: ReactNode;
  /** Host-owned speech preview, used on native and optionally on web. */
  onPreviewVoice?: (text: string, preferences: AgentPreferences) => void;
}
