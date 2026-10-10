import { defineMessages, type MessageCatalog } from '../locale/messages';

export interface AgentCreatorMessages {
  reaction: string;
  working: string;
  avatarStyle: string;
  proceduralAvatar: string;
  betaPreset: string;
  betaEyes: string;
  eyewear: string;
  accessory: string;
  /** Recovered beta catalog names default to their source titles; hosts may localize by category/ID. */
  characterOption: (category: string, id: string, title: string) => string;
  editor: string;
  newBot: string;
  closeEditor: string;
  details: string;
  color: string;
  customColor: string;
  name: string;
  label: string;
  description: string;
  nameInput: string;
  labelInput: string;
  descriptionInput: string;
  labelPlaceholder: string;
  descriptionPlaceholder: string;
  language: string;
  languageInput: string;
  notifications: string;
  notificationsDescription: string;
  notifyFinished: string;
  voice: string;
  voiceInput: string;
  previewVoice: string;
  savedVoice: string;
  systemVoice: string;
  off: string;
  playbackSpeed: string;
  emotion: string;
  shape: string;
  hexColor: string;
  hue: string;
  saturationBrightness: string;
  increaseBrightness: string;
  decreaseBrightness: string;
  increaseHue: string;
  decreaseHue: string;
  nextShape: string;
  previousShape: string;
  newAgent: string;
  emotions: Record<
    | 'neutral'
    | 'happy'
    | 'angry'
    | 'thinking'
    | 'shook'
    | 'curious'
    | 'wink'
    | 'sleepy'
    | 'sad'
    | 'worried'
    | 'skeptical'
    | 'focused'
    | 'excited'
    | 'calm'
    | 'shy'
    | 'confused',
    string
  >;
  shapes: Record<
    'slender' | 'pocket' | 'petal' | 'flower' | 'star' | 'heart' | 'cloud' | 'diamond' | 'shield',
    string
  >;
  colors: Record<
    'Blue' | 'Teal' | 'Violet' | 'Pink' | 'Red' | 'Orange' | 'Cyan' | 'Lime' | 'Green',
    string
  >;
  languages: Record<'auto' | 'en' | 'tr' | 'es' | 'fr' | 'de' | 'ja' | 'pt', string>;
  avatarColorLabel: (name: string) => string;
  shapeLabel: (name: string) => string;
  silhouetteLabel: (name: string) => string;
  livePreview: (name: string) => string;
  saturationBrightnessValue: (s: number, v: number) => string;
  playbackSpeedLabel: (speed: number) => string;
}

export const AGENT_CREATOR_MESSAGES: MessageCatalog<AgentCreatorMessages> =
  defineMessages<AgentCreatorMessages>('AGENT_CREATOR_MESSAGES', {
    reaction: 'React',
    working: 'Work',
    avatarStyle: 'Avatar style',
    proceduralAvatar: 'Current avatar',
    betaPreset: 'Character preset (beta)',
    betaEyes: 'Eye style',
    eyewear: 'Eyewear',
    accessory: 'Accessory',
    characterOption: (_category, _id, title) => String(title),
    editor: 'Agent editor',
    newBot: 'New bot',
    closeEditor: 'Close agent editor',
    details: 'Agent appearance and details',
    color: 'Avatar color',
    customColor: 'Custom avatar color',
    name: 'Name',
    label: 'Label',
    description: 'Description',
    nameInput: 'Agent name',
    labelInput: 'Agent label',
    descriptionInput: 'Agent description',
    labelPlaceholder: 'Manager, marketing, painter',
    descriptionPlaceholder: 'Details for the agent',
    language: 'Language',
    languageInput: 'Agent language',
    notifications: 'Notifications',
    notificationsDescription: 'Show a notice when a reply is ready.',
    notifyFinished: 'Notify when this agent finishes',
    voice: 'Voice',
    voiceInput: 'Agent voice',
    previewVoice: 'Preview voice',
    savedVoice: 'Saved voice',
    systemVoice: 'System voice',
    off: 'Off',
    playbackSpeed: 'Playback speed',
    emotion: 'Agent emotion',
    shape: 'Avatar shape',
    hexColor: 'Hex color',
    hue: 'Hue',
    saturationBrightness: 'Saturation and brightness',
    increaseBrightness: 'Increase brightness',
    decreaseBrightness: 'Decrease brightness',
    increaseHue: 'Increase hue',
    decreaseHue: 'Decrease hue',
    nextShape: 'Next shape',
    previousShape: 'Previous shape',
    newAgent: 'New agent',
    emotions: {
      neutral: 'Neutral',
      happy: 'Happy',
      angry: 'Angry',
      thinking: 'Thinking',
      shook: 'Shook',
      curious: 'Curious',
      wink: 'Wink',
      sleepy: 'Sleepy',
      sad: 'Sad',
      worried: 'Worried',
      skeptical: 'Skeptical',
      focused: 'Focused',
      excited: 'Excited',
      calm: 'Calm',
      shy: 'Shy',
      confused: 'Confused',
    },
    shapes: {
      slender: 'Slender',
      pocket: 'Pocket',
      petal: 'Petal',
      flower: 'Flower',
      star: 'Star',
      heart: 'Heart',
      cloud: 'Cloud',
      diamond: 'Diamond',
      shield: 'Shield',
    },
    colors: {
      Blue: 'Blue',
      Teal: 'Teal',
      Violet: 'Violet',
      Pink: 'Pink',
      Red: 'Red',
      Orange: 'Orange',
      Cyan: 'Cyan',
      Lime: 'Lime',
      Green: 'Green',
    },
    languages: {
      auto: 'Auto-detect',
      en: 'English',
      tr: 'Turkish',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      ja: 'Japanese',
      pt: 'Portuguese',
    },
    avatarColorLabel: (name) => '{name} avatar'.replace('{name}', name),
    shapeLabel: (name) => '{name} shape'.replace('{name}', name),
    silhouetteLabel: (name) => '{name} silhouette'.replace('{name}', name),
    livePreview: (name) => '{name}, live avatar preview'.replace('{name}', name),
    saturationBrightnessValue: (s, v) =>
      'saturation {s}%, brightness {v}%'.replace('{s}', String(s)).replace('{v}', String(v)),
    playbackSpeedLabel: (speed) => '{speed} times playback speed'.replace('{speed}', String(speed)),
  });
