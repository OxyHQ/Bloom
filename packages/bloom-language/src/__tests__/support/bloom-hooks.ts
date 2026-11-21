/** Stands in for Bloom's link opening: a test reads what was opened. */
export const opened: string[] = [];
export function openExternal(href: string): void {
  opened.push(href);
}

/** Stands in for Bloom's window breakpoint: the tier a test renders at. */
export const windowTier: { current: 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' } = {
  current: 'base',
};
export function useWindowBreakpoint(): 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  return windowTier.current;
}
