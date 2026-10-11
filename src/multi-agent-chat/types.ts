import type { StyleProp, ViewStyle } from 'react-native';
import type { AgentPreferences, AgentVoice } from '../agent-creator/types';
import type { Agent, Message, Workspace } from './data';

export interface MultiAgentChatProps {
  /** Model catalogue passed to Bloom's shared composer picker. */
  providers?: ReadonlyArray<import('../composer-panel/types').ModelPickerProvider>;
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
