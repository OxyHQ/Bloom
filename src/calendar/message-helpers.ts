/**
 * Helpers the calendar catalog's strings share across languages.
 * Kept apart from `messages.ts` so a language module can use them without
 * linking the family's English strings (see `src/locale/translations`).
 */

/** `3h15m`-shaped durations: hour and minute units, and what joins them. */
export function compactDuration(hourUnit: string, minuteUnit: string, joiner: string) {
  return (hours: number, minutes: number): string => {
    if (hours === 0) return `${minutes}${minuteUnit}`;
    return minutes > 0
      ? `${hours}${hourUnit}${joiner}${minutes}${minuteUnit}`
      : `${hours}${hourUnit}`;
  };
}
