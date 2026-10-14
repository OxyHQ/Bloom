import type { ReactNode, Ref } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';
import type { AvatarCharacter } from '../agent-avatar';

/** An agent as the reply pieces draw it. */
export interface AgentReplyAgent {
  id: string;
  name: string;
  /** A short name for tight places (the profile's capsule); `name` when absent. */
  label?: string;
  /** The agent's 3D character. */
  avatar: AvatarCharacter;
}

export interface AgentReplyProps {
  /** The reply itself, usually an `AgentReplyBubble`. */
  children: ReactNode;
  /** Who is replying: an `AgentReplyIdentity`. Sits under the reply, at its start. */
  identity?: ReactNode;
  /**
   * What can be done with the reply: an `AgentReplyActions`. Sits under the reply, at its
   * end. Mouse hover and keyboard focus reveal it on web; touch platforms keep it shown.
   */
  actions?: ReactNode;
}

export interface AgentReplyBubbleProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export interface AgentReplyIdentityProps {
  /** The agent's 3D character. */
  character: AvatarCharacter;
  name: string;
  /** The agent is working on its reply: the avatar grows and the name gives way to "Thinking…". */
  thinking?: boolean;
  /** Seeds which working animation the avatar starts with; `name` when absent. */
  workingKey?: string;
  /** Hide the avatar while something else draws it (the handoff flight). */
  avatarHidden?: boolean;
  /** The avatar's box, for a caller that animates it elsewhere. */
  avatarRef?: Ref<View>;
  /** Makes the row a button. */
  onPress?: () => void;
  /** The button's name when it is not thinking ("Edit Lumi"); `name` when absent. */
  pressLabel?: string;
}

export type AgentReplyVote = 'up' | 'down';

export interface AgentReplyActionsProps {
  /** The vote given, when the caller keeps it. Omitted, the row keeps it. */
  vote?: AgentReplyVote | null;
  onVoteChange?: (vote: AgentReplyVote) => void;
  /** Copy tile; omitted, there is none. */
  onCopy?: () => void;
  /** More tiles, after copy: `AgentReplyAction`s. */
  children?: ReactNode;
}

export interface AgentReplyActionProps {
  /** The icon, drawn at 12px. */
  icon: (props: { width?: number; height?: number; fill?: string }) => ReactNode;
  /** The tile's name; it draws no text. */
  label: string;
  /** Lit as the current choice (a vote, a read-aloud in progress). */
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export interface AgentProfileProps {
  /** Everyone in the conversation; the first three are drawn. */
  agents: AgentReplyAgent[];
  /** The capsule's text. Defaults to the name, or the first three labels joined by " + ". */
  label?: string;
  /** The button's name; `label` when absent. */
  accessibilityLabel?: string;
  /** The panel this opens is open. */
  expanded?: boolean;
  onPress: () => void;
  /** The artwork's box, for a caller that animates it elsewhere. */
  avatarRef?: Ref<View>;
}

export interface AgentStackProps {
  agents: AgentReplyAgent[];
  /** The box's width and height. Default 40. */
  size?: number;
}
