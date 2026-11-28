/** A draft list's item: one stored on the server, or one only on this device. */
export type DraftItem =
  | { origin: 'server'; id: string; post: { title: string } }
  | { origin: 'device'; id: string; draft: { name: string } };
