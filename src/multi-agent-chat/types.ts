import type { StyleProp, ViewStyle } from 'react-native';
import type { AgentPreferences, AgentVoice } from '../agent-creator/types';
import type { Agent, Message, Workspace } from './data';
import type { ComposerPanelProps, ComposerPanelAttachment } from '../composer-panel/types';
import type { SidebarTeam } from '../sidebar/types';
import type { BloomThemeStorage } from '../theme/persistence';

/** Composer choices captured when the turn is sent, shared by every responding agent. */
export interface MultiAgentChatRequest {
  model?: string;
  permission: string;
  effort: number | null;
  attachments: ReadonlyArray<ComposerPanelAttachment>;
}

export interface MultiAgentChatProps {
  /** Model catalogue passed to Bloom's shared composer picker. */
  providers?: ReadonlyArray<import('../composer-panel/types').ModelPickerProvider>;
  onRespond?: (
    agent: Agent,
    messages: Message[],
    signal: AbortSignal,
    request: MultiAgentChatRequest,
  ) => Promise<string>;
  /** Shared ComposerPanel API for models, permissions, voice, attachments and labels. */
  composerProps?: Omit<
    ComposerPanelProps,
    'value' | 'defaultValue' | 'onValueChange' | 'onSubmit' | 'busy' | 'onStop' | 'providers'
  >;
  initialWorkspace?: Workspace;
  defaultEditorId?: string | null;
  /** The key the workspace is kept under in `storage`; null disables persistence. */
  storageKey?: string | null;
  /**
   * Where the workspace persists: the same adapter `BloomProvider`'s theme takes
   * (an `AsyncStorage`-compatible one on native). Defaults to `localStorage` on
   * the web; native keeps the session's workspace in memory without one.
   */
  storage?: BloomThemeStorage;
  onWorkspaceChange?: (workspace: Workspace) => void;
  /**
   * Copy handler. Default: Bloom's clipboard (`writeClipboardText`) where there
   * is one, else the system share sheet.
   */
  onCopy?: (text: string) => void | Promise<void>;
  /** The team card at the foot of the sidebar and the menu it opens. None by default. */
  team?: SidebarTeam;
  voices?: readonly AgentVoice[];
  onPreviewVoice?: (text: string, preferences: AgentPreferences) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
