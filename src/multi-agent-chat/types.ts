import type { StyleProp, ViewStyle } from 'react-native';
import type { AgentVoice, AgentPreferences } from '../agent-creator/types';
import type { Agent, Message, Workspace } from './data';

export interface MultiAgentChatProps {
  onRespond?: (agent: Agent, messages: Message[], signal: AbortSignal) => Promise<string>;
  initialWorkspace?: Workspace;
  defaultEditorId?: string | null;
  /** Web persistence; null disables storage. Native retains session state. */
  storageKey?: string | null;
  onWorkspaceChange?: (workspace: Workspace) => void;
  /** Clipboard integration for native hosts; web uses navigator.clipboard by default. */
  onCopy?: (text: string) => void | Promise<void>;
  voices?: readonly AgentVoice[];
  onPreviewVoice?: (text: string, preferences: AgentPreferences) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
