/** Abortable pacing shared by the demo's thinking delay and text reveal. */
export function waitForReply(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Reveal complete words, preserving all original whitespace and paragraph breaks. */
export async function streamReply(
  text: string,
  signal: AbortSignal,
  onText: (text: string) => void,
) {
  const words = text.match(/\s*\S+\s*/gu) ?? [];
  let visible = '';
  for (let i = 0; i < words.length; i += 2) {
    if (signal.aborted) return;
    visible += words.slice(i, i + 2).join('');
    onText(visible);
    if (i + 2 < words.length)
      await waitForReply(
        /\n\s*\n$/u.test(visible) ? 160 : /[.!?]\s*$/u.test(visible) ? 100 : 48,
        signal,
      );
  }
  if (!signal.aborted && visible !== text) onText(text);
}
