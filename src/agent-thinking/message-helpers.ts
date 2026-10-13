/**
 * Helpers the reasoning catalog's strings share across languages.
 * Kept apart from `messages.ts` so a language module can use them without
 * linking the family's English strings (see `src/locale/translations`).
 */

/**
 * "Thought for 1 min 5 s"-shaped headers. `pattern` holds `{time}`; the units
 * carry their own leading space (` s`, or none for `秒`), and `joiner` sits
 * between the minutes and the seconds. A zero part is left out, so a whole
 * minute reads "1 min" and not "1 min 0 s".
 */
export function thoughtFor(pattern: string, minuteUnit: string, secondUnit: string, joiner = ' ') {
  return (minutes: number, seconds: number): string => {
    const parts: string[] = [];
    if (minutes > 0) parts.push(`${minutes}${minuteUnit}`);
    if (seconds > 0 || minutes === 0) parts.push(`${seconds}${secondUnit}`);
    return pattern.replace('{time}', parts.join(joiner));
  };
}
