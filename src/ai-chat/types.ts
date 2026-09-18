import type { ComponentType, ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

import type { CodeLanguage } from '../code';
import type { BloomIconComponent } from '../icons/icon-component';
import type { Props as IconProps } from '../icons/shared';

/** A Bloom icon component (`RiFolderLine`, not `<RiFolderLine />`). */
export type AiChatIconComponent = ComponentType<IconProps>;

// ---------------------------------------------------------------------------
//  Feedback row
// ---------------------------------------------------------------------------

export interface AiChatFeedbackLabels {
  /** Default `'Good response'`. */
  like?: string;
  /** Default `'Bad response'`. */
  dislike?: string;
  /** Default `'Copy response'`. */
  copy?: string;
  /** Default `'Copied!'` — the tooltip after a copy. */
  copied?: string;
}

export interface AiChatFeedbackRowProps {
  onLike?: () => void;
  onDislike?: () => void;
  /**
   * Copy handler. The glyph swaps to a check and the tooltip reads "Copied!" for
   * 1.6s either way.
   */
  onCopy?: () => void;
  labels?: AiChatFeedbackLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Messages
// ---------------------------------------------------------------------------

export interface AiChatUserMessageProps {
  /** `AiChatMessageLine`s — or a string, wrapped in one. */
  children: ReactNode;
  /** Skip the blur-in (a turn restored from history). Default `true`. */
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AiChatAssistantMessageProps {
  /**
   * The reply's blocks, top to bottom: `AiChatMessageLine`, `AiChatBulletList`,
   * a `CodeBlock`… Each blurs in on its own beat (180ms apart).
   */
  children: ReactNode;
  /** The like / dislike / copy row under the reply. Default `true`. */
  feedback?: boolean;
  /** Feedback handlers and labels. */
  feedbackProps?: Omit<AiChatFeedbackRowProps, 'style' | 'testID'>;
  /** Skip the staggered blur-in. Default `true`. */
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AiChatMessageLineProps {
  /** Paragraph text; strings and inline nodes (`AiChatStrong`, `AiChatLinkChip`) flow together. */
  children: ReactNode;
  /** `secondary` for status lines such as "Worked for 5m 32s". Default `primary`. */
  tone?: 'primary' | 'secondary';
  /** Render `children` as a block (a code card, an image) instead of a paragraph. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface AiChatBulletListProps {
  /** `AiChatBullet`s. They blur in one after another. */
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export interface AiChatBulletProps {
  children: ReactNode;
}

export interface AiChatStrongProps {
  children: ReactNode;
}

export interface AiChatLinkChipProps {
  /** The link text, e.g. `figma.com/project/hse82s...`. */
  children: string;
  onPress?: () => void;
}

// ---------------------------------------------------------------------------
//  Image generation
// ---------------------------------------------------------------------------

export interface AiChatImageGenerationLabels {
  /** Default `'Image generated'`. */
  generated?: string;
  /** Default `'Generating image'`. */
  generating?: string;
  /** Default `(seconds) => \`${seconds} seconds remaining\``. */
  remaining?: (seconds: number) => string;
  /** Default `"Thanks for the feedback"`. */
  likeToast?: string;
  /** Default `"Thanks — we'll use this to improve"`. */
  dislikeToast?: string;
}

export interface AiChatImageGenerationProps {
  /** The finished artwork. */
  source: ImageSourcePropType;
  /** Describes the artwork once revealed. */
  alt: string;
  /** How long the scripted generation runs, ms. Default `4000`. */
  duration?: number;
  /** Controlled: `true` reveals the image now (a real generation landing). Uncontrolled it lands after `duration`. */
  ready?: boolean;
  /** Fires once when the image lands. */
  onGenerated?: () => void;
  /** Hide the "Image generated" line above the frame. */
  hideHeader?: boolean;
  /** Feedback handlers under the landed image. */
  onLike?: () => void;
  onDislike?: () => void;
  onCopy?: () => void;
  labels?: AiChatImageGenerationLabels;
  feedbackLabels?: AiChatFeedbackLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Panels
// ---------------------------------------------------------------------------

export interface AiChatPanelTab {
  value: string;
  label: string;
  icon?: BloomIconComponent;
}

export interface AiChatPanelAction {
  key: string;
  label: string;
  icon: AiChatIconComponent;
  onPress?: () => void;
}

export interface AiChatChangedFile {
  path: string;
  /** Lines added, shown after the path. */
  additions?: number;
  /** Status chip, e.g. `New`. */
  status?: string;
  /** A 16px mark before the path (e.g. the React logo). */
  icon?: ReactNode;
}

export interface AiChatCodePanelLabels {
  /** Default `'Changes'`. */
  changes?: string;
  /** Default `'Browser'`. */
  browser?: string;
  /** Default `'Panel view'`. */
  tabs?: string;
  /** Default `(count) => \`${count} Uncomitted changes\`` (intentionally misspelled). */
  uncommitted?: (count: number) => string;
  /** Default `'Undo changes'`. */
  undo?: string;
  /** Default `'Browser preview'`. */
  browserPreview?: string;
}

export interface AiChatCodePanelProps {
  /** The file shown in the code view. */
  code: string;
  /** Its grammar (`tsx`, `ts`, `js`…); omit for plain text. */
  language?: CodeLanguage;
  /** Changed files in the summary card. Default none. */
  changedFiles?: ReadonlyArray<AiChatChangedFile>;
  /** Summary counts. Omit `changeCount` to hide the summary card. */
  changeCount?: number;
  additions?: number;
  deletions?: number;
  onUndo?: () => void;
  /** Controlled tab (`'changes' | 'browser'`). */
  tab?: 'changes' | 'browser';
  defaultTab?: 'changes' | 'browser';
  onTabChange?: (tab: 'changes' | 'browser') => void;
  /** Replaces the "Browser preview" placeholder. */
  browser?: ReactNode;
  /** Header actions. Default terminal / expand / toggle glyphs. */
  actions?: ReadonlyArray<AiChatPanelAction>;
  /** Column width; `'100%'` inside a drawer. Default `410`. */
  width?: number | `${number}%`;
  labels?: AiChatCodePanelLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AiChatGeneration {
  id: string;
  prompt: string;
  /** Artwork. Without one the tile draws a placeholder wash. */
  source?: ImageSourcePropType;
  /** Intrinsic aspect ratio (width / height) — what gives the masonry its rhythm. */
  aspectRatio: number;
}

export interface AiChatGalleryPanelLabels {
  /** Default `'Gallery'`. */
  gallery?: string;
  /** Default `'Styles'`. */
  styles?: string;
  /** Default `'Panel view'`. */
  tabs?: string;
  /** Default `'Style presets'`. */
  stylePresets?: string;
  /** Default `(prompt) => \`Enlarge ${prompt}\``. */
  enlarge?: (prompt: string) => string;
  /** Default `(prompt) => \`Minimize ${prompt}\``. */
  minimize?: (prompt: string) => string;
  /** Default `(prompt) => \`Download ${prompt}\``. */
  download?: (prompt: string) => string;
  /** Default `(prompt) => \`More actions for ${prompt}\``. */
  more?: (prompt: string) => string;
}

export interface AiChatGalleryPanelProps {
  /** The wall, in cascade order. */
  generations: ReadonlyArray<AiChatGeneration>;
  /** Freshly generated images, newest first — they land at the top-left and push that column down. */
  generated?: ReadonlyArray<AiChatGeneration>;
  /** Column count. Default `3`. */
  columns?: number;
  onDownload?: (generation: AiChatGeneration) => void;
  onMore?: (generation: AiChatGeneration) => void;
  /** Controlled tab (`'gallery' | 'styles'`). */
  tab?: 'gallery' | 'styles';
  defaultTab?: 'gallery' | 'styles';
  onTabChange?: (tab: 'gallery' | 'styles') => void;
  /** Replaces the "Style presets" placeholder. */
  stylePresets?: ReactNode;
  /** Header actions. Default new generation / expand / toggle. */
  actions?: ReadonlyArray<AiChatPanelAction>;
  /** Column width; `'100%'` inside a drawer. Default `410`. */
  width?: number | `${number}%`;
  labels?: AiChatGalleryPanelLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Container, thread, shell
// ---------------------------------------------------------------------------

export interface AiChatContainerLabels {
  /** Default `'Chat location'`. */
  breadcrumb?: string;
  /** Default `'Share chat'`. */
  share?: string;
  /** Default `'More options'`. */
  more?: string;
}

export interface AiChatContainerProps {
  /** The project crumb, after its folder glyph. */
  project: string;
  /** The current chat crumb. */
  title: string;
  /** The project crumb's glyph. Default `RiFolderLine`. */
  projectIcon?: BloomIconComponent;
  onProjectPress?: () => void;
  onShare?: () => void;
  onMore?: () => void;
  /** Rendered above the breadcrumb — the shell's `AiChatMobileHeader`. */
  header?: ReactNode;
  /** The thread — usually an `AiChatThread`. */
  children: ReactNode;
  /** The composer and status bar under the thread. */
  composer?: ReactNode;
  /** Shows `AgentThinking` (infinity) above the composer while the agent works. */
  working?: boolean;
  /** `AgentThinking`'s label. Default `'Thinking'`. */
  workingLabel?: string;
  labels?: AiChatContainerLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AiChatThreadProps {
  /** The turns. The thread follows the newest one with a smooth scroll as it grows. */
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AiChatShellLabels {
  /** Default `'Open navigation'`. */
  openNavigation?: string;
  /** Default `'Close navigation'`. */
  closeNavigation?: string;
  /** Default `(panel) => \`Open ${panel.toLowerCase()}\``. */
  openPanel?: (panel: string) => string;
  /** Default `(panel) => \`Close ${panel.toLowerCase()}\``. */
  closePanel?: (panel: string) => string;
  /** Default `'Resize panels'`. */
  resize?: string;
}

export interface AiChatShellProps {
  /** The floating sidebar shown from `lg` (1024). */
  sidebar: ReactNode;
  /** The flat sidebar revealed under the workspace below `lg`. Default: none (no nav drawer). */
  mobileSidebar?: ReactNode;
  /** The chat container. */
  children: ReactNode;
  /** The right panel. Receives its current width (`'100%'` in the phone drawer). */
  panel?: (width: number | '100%') => ReactNode;
  /** The panel's name in the drawer header and its buttons ("Code", "Gallery"). */
  panelLabel?: string;
  /** Glyph of the header button that opens the panel drawer. Default `RiCodeSLine`. */
  panelIcon?: BloomIconComponent;
  /** Initial panel width. Default `410`; dragging clamps it to 320–560. */
  defaultPanelWidth?: number;
  minPanelWidth?: number;
  maxPanelWidth?: number;
  /** Controlled nav drawer (below `lg`). */
  navOpen?: boolean;
  onNavOpenChange?: (open: boolean) => void;
  /** Controlled panel drawer (below `xl`). */
  panelOpen?: boolean;
  onPanelOpenChange?: (open: boolean) => void;
  labels?: AiChatShellLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AiChatMobileHeaderProps {
  /** The chat's name beside the menu button ("Agentic chat"). */
  title: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AiChatResizeHandleProps {
  /** Pointer went down on the grip. */
  onResizeStart?: () => void;
  /** Horizontal distance from where the drag started, px. */
  onResize: (dx: number) => void;
  onResizeEnd?: () => void;
  /** Names the separator. Default `'Resize panels'`. */
  label?: string;
  /** Keyboard nudge (web: ←/→ move by 16). */
  onNudge?: (dx: number) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
