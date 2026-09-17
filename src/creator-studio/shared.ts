import { Platform } from 'react-native';

import { ACCENT_TABLE, colorRamp, DANGER_TABLE, mixColor, resolveButtonRamps } from '../button/shared';
import type { AccentTone } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import type {
  CreatorOption,
  ReleaseStatus,
  ReleaseType,
  TrackUploadStatus,
} from './types';
import { clamp } from '../styles/clamp';

export const IS_WEB = Platform.OS === 'web';

/** Cards: `rounded-2xl`, the chart cards' radius. */
export const CARD_RADIUS = 16;
/** Covers inside a card. */
export const COVER_RADIUS = 12;

/** Every colour the creator studio paints outside Bloom's own primitives. Pure. */
export interface CreatorStudioPaint {
  /** Card surface — the chart cards' `background-secondary`. */
  surface: string;
  /** A tile or row inside a card. */
  inner: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** Progress rails, connectors, placeholder art. */
  track: string;
  /** An idle ring (an upcoming timeline step) — a step stronger than `track`. */
  ring: string;
  placeholder: string;
  placeholderIcon: string;
  accent: string;
  onAccent: string;
  positive: string;
  negative: string;
  error: string;
  errorSurface: string;
}

/**
 *   surface      neutral-100            dark neutral-900
 *   inner        card (white)           dark neutral-800 at 60% over surface
 *   border       neutral-200            dark neutral-800
 *   track        neutral-200            dark neutral-800
 *   placeholder  neutral-200 / icon 400 dark neutral-800 / icon 500
 *   accent       accent-500             dark accent-400
 *   positive     success ramp 700       dark 400
 *   negative     danger ramp on `negative` 600 / dark 400
 *   error        danger ramp on `error` 600 / dark 400; surface 50 / 950 at 50%
 */
export function resolveCreatorStudioPaint(theme: Theme): CreatorStudioPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  const red = colorRamp(theme.colors.error, DANGER_TABLE);
  const rose = colorRamp(theme.colors.negative, DANGER_TABLE);
  const green = colorRamp(theme.colors.success, ACCENT_TABLE);
  const surface = dark ? n[900] : n[100];
  return {
    surface,
    inner: dark ? mixColor(surface, n[800], 0.6) : theme.colors.card,
    border: dark ? n[800] : n[200],
    text: theme.colors.text,
    textSecondary: dark ? n[400] : n[500],
    textTertiary: dark ? n[500] : n[400],
    track: dark ? n[700] : n[200],
    ring: dark ? n[700] : n[300],
    placeholder: dark ? n[800] : n[200],
    placeholderIcon: dark ? n[500] : n[400],
    accent: dark ? accent[400] : accent[500],
    onAccent: theme.colors.primaryForeground,
    positive: dark ? green[400] : green[700],
    negative: dark ? rose[400] : rose[600],
    error: dark ? red[400] : red[600],
    errorSurface: dark ? mixColor(theme.colors.background, red[950], 0.5) : red[50],
  };
}

// ---------------------------------------------------------------------------
//  Releases
// ---------------------------------------------------------------------------

export const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  single: 'Single',
  ep: 'EP',
  album: 'Album',
};

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  draft: 'Draft',
  'in-review': 'In review',
  scheduled: 'Scheduled',
  live: 'Live',
  rejected: 'Rejected',
  takedown: 'Taken down',
};

/**
 * The status badge's tone. Each status reads from a distinct role, so the
 * catalog scans by colour before it is read:
 *
 *   draft      default   nothing is happening yet
 *   in-review  warning   waiting on someone else
 *   scheduled  info      settled, not yet out
 *   live       success
 *   rejected   error     needs the artist
 *   takedown   error     outlined — ended, not actionable
 */
export const RELEASE_STATUS_TONES: Record<ReleaseStatus, { tone: AccentTone; fill: 'subtle' | 'outlined' }> = {
  draft: { tone: 'default', fill: 'subtle' },
  'in-review': { tone: 'warning', fill: 'subtle' },
  scheduled: { tone: 'info', fill: 'subtle' },
  live: { tone: 'success', fill: 'subtle' },
  rejected: { tone: 'error', fill: 'subtle' },
  takedown: { tone: 'error', fill: 'outlined' },
};

/** Whether a status carries a reason worth showing on the card. */
export function releaseStatusNeedsReason(status: ReleaseStatus): boolean {
  return status === 'rejected' || status === 'takedown';
}

export const DEFAULT_CREDIT_ROLES: readonly CreatorOption[] = [
  { value: 'songwriter', label: 'Songwriter' },
  { value: 'producer', label: 'Producer' },
  { value: 'composer', label: 'Composer' },
  { value: 'performer', label: 'Performer' },
  { value: 'lyricist', label: 'Lyricist' },
  { value: 'mixing-engineer', label: 'Mixing engineer' },
  { value: 'mastering-engineer', label: 'Mastering engineer' },
];

// ---------------------------------------------------------------------------
//  Uploads
// ---------------------------------------------------------------------------

/**
 * Clamps a progress value to a whole 0–100.
 *
 * NOT `clamp01` under another name: this is a PERCENTAGE and it rounds.
 */
export function clampProgress(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.round(clamp(value, 0, 100));
}

/** What a row draws for a status: a determinate bar, a running bar, or none. */
export function uploadBarKind(status: TrackUploadStatus): 'determinate' | 'indeterminate' | 'none' {
  if (status === 'uploading') return 'determinate';
  if (status === 'processing') return 'indeterminate';
  return 'none';
}

/**
 * A stable pseudo-waveform for a file name: `count` bar heights in 0.2–1,
 * the same every render (no audio is analysed — it is a placeholder).
 */
export function placeholderWaveform(seed: string, count: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const r = ((h >>> 0) % 1000) / 1000;
    // A gentle envelope so it reads as a song, not noise.
    const envelope = 0.55 + 0.45 * Math.sin((Math.PI * (i + 0.5)) / count);
    out.push(Math.max(0.2, Math.min(1, r * envelope + 0.15)));
  }
  return out;
}

// ---------------------------------------------------------------------------
//  ISRC and artwork validation
// ---------------------------------------------------------------------------

/** `CC-XXX-YY-NNNNN`: country, registrant, year, designation. */
const ISRC_RE = /^[A-Z]{2}[A-Z0-9]{3}\d{2}\d{5}$/;

/** Uppercases and strips everything but letters and digits, capped at 12 characters. */
export function normalizeIsrc(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

/** Groups a (partial) ISRC as `CC-XXX-YY-NNNNN` while typing. */
export function formatIsrc(value: string): string {
  const raw = normalizeIsrc(value);
  const parts = [raw.slice(0, 2), raw.slice(2, 5), raw.slice(5, 7), raw.slice(7, 12)].filter(Boolean);
  return parts.join('-');
}

/** Whether a value (hyphens allowed) is a complete, well-formed ISRC. */
export function isValidIsrc(value: string): boolean {
  return ISRC_RE.test(normalizeIsrc(value));
}

/**
 * The "too small" message for artwork, or `null` when it is big enough and
 * square. The app measures the image (the component never decodes one).
 */
export function artworkDimensionsError(
  width: number,
  height: number,
  minSize = 3000,
): string | null {
  if (width !== height) return `Artwork must be square — this image is ${width}×${height} px.`;
  if (width < minSize) {
    return `Artwork is too small (${width}×${height} px). Upload at least ${minSize}×${minSize} px.`;
  }
  return null;
}

/** Adds a string to a list once, trimmed; returns the same list when nothing changes. */
export function addUnique(list: readonly string[], value: string, max?: number): string[] {
  const name = value.trim();
  if (!name) return [...list];
  if (list.some((v) => v.toLowerCase() === name.toLowerCase())) return [...list];
  if (max !== undefined && list.length >= max) return [...list];
  return [...list, name];
}

/** Toggles a tag in a selection capped at `max`. */
export function toggleTag(list: readonly string[], tag: string, max: number): string[] {
  if (list.includes(tag)) return list.filter((t) => t !== tag);
  if (list.length >= max) return [...list];
  return [...list, tag];
}

// ---------------------------------------------------------------------------
//  Web CSS: focus rings and cursors on react-native-web pressables, hung off
//  `dataSet` hooks and adopted (CSP), never a `<style>` element.
// ---------------------------------------------------------------------------

export const CREATOR_STUDIO_STYLE_ID = 'bloom-creator-studio-web-css';

const PRESS = '[data-bloom-studio-press]';

export const CREATOR_STUDIO_CSS = `
${PRESS} { outline: none; cursor: pointer; transition: background-color 150ms ease; }
${PRESS}:focus-visible { outline: 2px solid var(--bloom-studio-ring, currentColor); outline-offset: 2px; }
@keyframes bloom-studio-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}
[data-bloom-studio-indeterminate] { animation: bloom-studio-indeterminate 1.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  ${PRESS} { transition: none; }
  [data-bloom-studio-indeterminate] { animation: none; transform: translateX(75%); }
}
`;

/** The `dataSet` hook of a pressable that takes the studio's focus ring (web only). */
export function pressDataSet(): { dataSet?: Record<string, string> } {
  return IS_WEB ? { dataSet: { bloomStudioPress: '' } } : {};
}

/** The `dataSet` hook of the running segment of an indeterminate bar (web only; native animates it). */
export function indeterminateDataSet(): { dataSet?: Record<string, string> } {
  return IS_WEB ? { dataSet: { bloomStudioIndeterminate: '' } } : {};
}
