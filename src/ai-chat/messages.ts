import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/**
 * Every fixed string the ai-chat family draws or announces, in each Bloom
 * language. The common words (More options, More actions for …) come from
 * `COMMON_MESSAGES`; a caller's `labels` prop still wins over any entry here.
 */
export interface AiChatMessages {
  /** `AiChatFeedbackRow`: the actions under an assistant turn. */
  feedback: {
    like: string;
    dislike: string;
    copy: string;
    /** The tooltip after a copy. */
    copied: string;
  };
  /** `AiChatImageGeneration`. */
  imageGeneration: {
    generated: string;
    generating: string;
    remaining: (seconds: number) => string;
    likeToast: string;
    dislikeToast: string;
  };
  /** Names the finished image: "Generated image: a red fox". */
  generatedImage: (alt: string) => string;
  /** `AiChatCodePanel`. */
  codePanel: {
    changes: string;
    browser: string;
    uncommitted: (count: number) => string;
    undo: string;
    browserPreview: string;
  };
  /** `AiChatGalleryPanel`. */
  galleryPanel: {
    gallery: string;
    styles: string;
    stylePresets: string;
    enlarge: (prompt: string) => string;
    minimize: (prompt: string) => string;
    download: (prompt: string) => string;
  };
  /** Names both panels' tab list. */
  panelView: string;
  /** The panels' default header actions. */
  openTerminal: string;
  newGeneration: string;
  expandPanel: string;
  togglePanel: string;
  /** `AiChatContainer`. */
  container: {
    breadcrumb: string;
    share: string;
  };
  /** `AiChatShell` and `AiChatResizeHandle`. */
  shell: {
    openNavigation: string;
    closeNavigation: string;
    openPanel: (panel: string) => string;
    closePanel: (panel: string) => string;
  };
  /** The shell's default panel name. */
  code: string;
}

// `String(panel)`: the catalog gate calls each entry with sample arguments, a number among them.
export const AI_CHAT_MESSAGES: MessageCatalog<AiChatMessages> = defineMessages<AiChatMessages>('AI_CHAT_MESSAGES', {
  feedback: { like: 'Good response', dislike: 'Bad response', copy: 'Copy response', copied: 'Copied!' },
  imageGeneration: {
    generated: 'Image generated',
    generating: 'Generating image',
    remaining: (n) => plural('en', n, { one: '{n} second remaining', other: '{n} seconds remaining' }),
    likeToast: 'Thanks for the feedback',
    dislikeToast: "Thanks — we'll use this to improve",
  },
  generatedImage: (alt) => `Generated image: ${alt}`,
  codePanel: {
    changes: 'Changes',
    browser: 'Browser',
    // The published English wording, misspelling included (see the labels type).
    uncommitted: (count) => `${count} Uncomitted changes`,
    undo: 'Undo changes',
    browserPreview: 'Browser preview',
  },
  galleryPanel: {
    gallery: 'Gallery',
    styles: 'Styles',
    stylePresets: 'Style presets',
    enlarge: (prompt) => `Enlarge ${prompt}`,
    minimize: (prompt) => `Minimize ${prompt}`,
    download: (prompt) => `Download ${prompt}`,
  },
  panelView: 'Panel view',
  openTerminal: 'Open terminal',
  newGeneration: 'New generation',
  expandPanel: 'Expand panel',
  togglePanel: 'Toggle panel',
  container: { breadcrumb: 'Chat location', share: 'Share chat' },
  shell: {
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    openPanel: (panel) => `Open ${String(panel).toLowerCase()}`,
    closePanel: (panel) => `Close ${String(panel).toLowerCase()}`,
  },
  code: 'Code',
});
