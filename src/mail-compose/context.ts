import { createContext, useCallback, useMemo, useState } from 'react';

import { MAIL_COMPOSE_GEOMETRY } from './shared';

/**
 * The header's shared gutter: ONE width for the To / Cc / Bcc / Subject
 * labels, so the chips and the subject keep a single left margin — and wide
 * enough for the longest label in the language on screen. A fixed 56 fitted
 * English "Subject" and clipped Russian "Скрытая копия" and Arabic
 * "نسخة مخفية" to an ellipsis.
 */
export interface MailGutter {
  width: number;
  /** A label's natural (unconstrained) width, reported by its measuring copy. */
  report: (id: string, width: number) => void;
}

export const MailGutterContext = createContext<MailGutter | null>(null);

/** Past this the gutter would squeeze the chips on a phone; a longer label ellipsizes. */
const MAX_GUTTER = 120;

/** The gutter state for a set of labels; measurements reset when the labels change. */
export function useMailGutterState(labels: readonly (string | undefined)[]): MailGutter {
  const key = labels.join('\u0000');
  const [measured, setMeasured] = useState<{ key: string; widths: Record<string, number> }>({
    key,
    widths: {},
  });
  const widths = measured.key === key ? measured.widths : {};

  const report = useCallback(
    (id: string, width: number) => {
      setMeasured((previous) => {
        const base = previous.key === key ? previous.widths : {};
        if (previous.key === key && base[id] === width) return previous;
        return { key, widths: { ...base, [id]: width } };
      });
    },
    [key],
  );

  const width = Math.min(
    MAX_GUTTER,
    Math.max(
      MAIL_COMPOSE_GEOMETRY.labelWidth,
      ...Object.values(widths).map((value) => Math.ceil(value)),
    ),
  );
  return useMemo(() => ({ width, report }), [width, report]);
}
