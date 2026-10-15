import type { MentionMark, Segment } from '@oxy.so/bloom-text/model';

/** A link or mention in a block's text, with the range it covers. */
export type InlineTarget =
  | { kind: 'link'; href: string; start: number; end: number }
  | { kind: 'mention'; mention: MentionMark; text: string; start: number; end: number };

/** The links (adjacent segments with one href are one link) and mentions of a text. */
function inlineTargets(segments: readonly Segment[]): InlineTarget[] {
  const out: InlineTarget[] = [];
  let at = 0;
  for (const segment of segments) {
    const start = at;
    const end = at + segment.text.length;
    at = end;
    const last = out[out.length - 1];
    if (segment.mention) {
      out.push({ kind: 'mention', mention: segment.mention, text: segment.text, start, end });
    } else if (
      segment.link &&
      last?.kind === 'link' &&
      last.href === segment.link &&
      last.end === start
    ) {
      last.end = end;
    } else if (segment.link) {
      out.push({ kind: 'link', href: segment.link, start, end });
    }
  }
  return out;
}

/** The link or mention a caret is at: inside it or just after it. */
export function inlineTargetAt(segments: readonly Segment[], offset: number): InlineTarget | null {
  return inlineTargets(segments).find((t) => offset > t.start && offset <= t.end) ?? null;
}
