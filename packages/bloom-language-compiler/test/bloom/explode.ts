/** Throws: called from a `.bloom` handler, for the source-map test. */
export function explode(message: string): void {
  throw new Error(message);
}
