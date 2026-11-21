/** Stands in for Bloom's link opening: a test reads what was opened. */
export const opened: string[] = [];
export function openExternal(href: string): void {
  opened.push(href);
}
