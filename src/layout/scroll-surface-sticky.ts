/** Leave room for content, otherwise all chrome participates in ordinary scrolling. */
export function canStickScrollChrome(viewport: number, header: number, footer: number): boolean {
  'worklet';
  return viewport > 0 && viewport - header - footer >= 48;
}

/** A direct ScrollView footer cell moves as a whole; its children are never translated alone. */
export function stickyFooterTranslation(
  offset: number,
  viewport: number,
  content: number,
  enabled: boolean,
): number {
  'worklet';
  if (!enabled || viewport <= 0 || content < 0) return 0;
  const maximum = Math.max(0, content - viewport);
  const scroll = Math.min(maximum, Math.max(0, offset));
  return Math.min(0, scroll + viewport - content);
}

/** Two edges leave at least half of the visible body unobscured. */
export function scrollChromeFadeHeight(
  requested: number,
  viewport: number,
  chrome: number,
): number {
  if (viewport <= 0) return requested;
  return Math.max(0, Math.min(requested, (viewport - chrome) / 4));
}
