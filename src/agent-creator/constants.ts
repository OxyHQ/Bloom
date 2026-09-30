import type { AgentLanguage, AgentPreferences } from './types';
export const AGENT_LANGUAGES = [
  { id: 'auto', label: 'Auto-detect' },
  { id: 'en', label: 'English' },
  { id: 'tr', label: 'Turkish' },
  { id: 'es', label: 'Spanish' },
  { id: 'fr', label: 'French' },
  { id: 'de', label: 'German' },
  { id: 'ja', label: 'Japanese' },
  { id: 'pt', label: 'Portuguese' },
] as const;
export const AGENT_SPEECH_RATES = [0.75, 1, 1.25, 1.5] as const;
export const DEFAULT_AGENT_PREFERENCES: AgentPreferences = {
  voice: 'alice',
  speed: 1,
  language: 'auto',
  notifications: true,
};
export const AVATAR_COLORS = [
  [220, 85, 'Blue', '#437EF7', '#004DE9'],
  [181, 49, 'Teal', '#27b5a2', '#00957c'],
  [259, 75, 'Violet', '#8554F6', '#3E00CD'],
  [321, 74, 'Pink', '#E34798', '#D3006D'],
  [0, 78, 'Red', '#E74241', '#CF0100'],
  [31, 89, 'Orange', '#f47327', '#d83f00'],
  [193, 78, 'Cyan', '#1bb4ce', '#0093ad'],
  [78, 72, 'Lime', '#88c81c', '#6aa400'],
  [145, 51, 'Green', '#36c15c', '#009f13'],
] as const;
export const EMOTION_NAMES = {
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
} as const;
export const PREVIEW_TEXT: Record<AgentLanguage, string> = {
  auto: 'Hello! Ready when you are.',
  en: 'Hello! Ready when you are.',
  tr: 'Merhaba! Hazır olduğunda başlayabiliriz.',
  es: '¡Hola! Podemos empezar cuando quieras.',
  fr: 'Bonjour ! Nous pouvons commencer quand vous voulez.',
  de: 'Hallo! Wir können anfangen, wenn du bereit bist.',
  ja: 'こんにちは！準備ができたら始めましょう。',
  pt: 'Olá! Podemos começar quando quiser.',
};
