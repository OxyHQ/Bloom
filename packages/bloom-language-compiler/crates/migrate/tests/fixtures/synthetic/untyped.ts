// A TS value Bloom cannot type (`any`): its members are TS's own.
// biome-ignore lint/suspicious/noExplicitAny: the fixture's point
export function thing(): any {
  return { name: ' a ', items: [], tags: [] };
}
