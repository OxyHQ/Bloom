import {
  type AvatarCharacter,
  avatarCharacterOf,
  resolveAvatarCharacter,
} from '../agent-avatar/character';
import { NATIVE_CHARACTER_SHAPES } from '../agent-avatar/character-shapes';
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

// Recovered engine catalog metadata. IDs are renderer selections; titles retain the beta catalog's English defaults.
export const CHARACTER_PRESETS = [
  { id: 'clippo', title: 'Clippo' },
  { id: 'blue_beret', title: 'Felipe' },
  { id: 'alfred', title: 'Alfred' },
  { id: 'purple_heart', title: 'Jojo' },
  { id: 'lime_frog', title: 'Todd' },
  { id: 'coral_monocle', title: 'Iris' },
  { id: 'gus', title: 'Thelma' },
  { id: 'blue_spectacles', title: 'Josh' },
  { id: 'lime_headphones', title: 'Iggy' },
] as const;
export const CHARACTER_OPTIONS = {
  shape: NATIVE_CHARACTER_SHAPES,
  color: [
    ['pink', 'Pink'],
    ['orchid', 'Orchid'],
    ['violet', 'Violet'],
    ['blue', 'Blue'],
    ['cyan', 'Cyan'],
    ['teal', 'Teal'],
    ['lime', 'Lime'],
    ['yellow', 'Yellow'],
    ['coral', 'Coral'],
  ],
  eyes: [
    ['cyclops', 'Single eye'],
    ['clippo', 'Clippo'],
    ['todd', 'Todd'],
    ['swept_lids', 'Swept lids'],
    ['oval', 'Oval'],
    ['sparkle_capsules', 'Sparkle capsules'],
    ['highlight_capsules', 'Highlight capsules'],
    ['dots', 'Dots'],
    ['double_highlights', 'Round highlights'],
    ['round_inset', 'Round inset'],
    ['crescent_inset', 'Crescent inset'],
    ['sleepy_lids', 'Sleepy lids'],
  ],
  eyewear: [
    ['none', 'None'],
    ['monocle', 'Monocle'],
    ['tall_oval_frames', 'Tall oval frames'],
    ['separate_trapezoid_lenses', 'Separate trapezoid lenses'],
    ['classic_sunglasses', 'Classic sunglasses'],
    ['round_sunglasses', 'Round sunglasses'],
  ],
  accessory: [
    ['headphones', 'Headphones'],
    ['bow', 'Bow tie'],
    ['beanie', 'Beanie'],
    ['hat', 'Hat'],
    ['beret', 'Beret'],
    ['felipe_beret', 'Felipe’s beret'],
    ['orb', 'Bulb'],
    ['three_lobe', 'Tuft'],
    ['crown', 'Crown'],
  ],
} as const;

export { CHARACTER_COLORS } from '../agent-avatar/character-colors';

/**
 * What choosing a template in the creator starts from: a complete character each. They are
 * creation choices only (Felipe starts orange with sleepy eyes, where the saved `blue_beret`
 * preset is blue with oval ones), so the character that results carries no hidden template id.
 */
export const CHARACTER_TEMPLATES: Record<string, AvatarCharacter> = {
  clippo: { preset: 'clippo' },
  blue_beret: {
    shape: 'six_lobed_flower',
    eyes: 'sleepy_lids',
    eyewear: 'none',
    accessory: 'felipe_beret',
    bodyColor: '#ff9547',
  },
  alfred: {
    preset: 'alfred',
    eyes: 'cyclops',
    eyewear: 'monocle',
    accessory: 'bow',
    color: 'cyan',
  },
  purple_heart: { preset: 'purple_heart' },
  lime_frog: {
    preset: 'lime_frog',
    eyes: 'clippo',
    eyewear: 'none',
    accessory: 'bow',
    color: 'coral',
  },
  coral_monocle: { preset: 'coral_monocle', eyes: 'clippo', eyewear: 'round_sunglasses' },
  gus: { preset: 'gus' },
  blue_spectacles: { preset: 'blue_spectacles' },
  lime_headphones: { preset: 'lime_headphones' },
};

/** The template a character is exactly, or `'custom'`. */
export function characterTemplateChoice(character: AvatarCharacter): string {
  const current = JSON.stringify(avatarCharacterOf(resolveAvatarCharacter(character)));
  return (
    Object.entries(CHARACTER_TEMPLATES).find(
      ([, template]) =>
        JSON.stringify(avatarCharacterOf(resolveAvatarCharacter(template))) === current,
    )?.[0] ?? 'custom'
  );
}
