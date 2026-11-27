// As Mention's postMenuActions declares PostMenuSubmenuRows: a TS discriminated union.
export type SubmenuRows =
  | { kind: 'sources'; sources: { url: string }[] }
  | { kind: 'replySettings'; postId: string }
  | { kind: 'lane'; laneId: string; label?: string };

// A field every member has (`domain`), read without narrowing (Mention's PublishedFederationBlock).
export type Block =
  | { source: 'policy'; domain: string; reason: string }
  | { source: 'operational'; domain: string };

// A union a member chain reaches (`item.media`, Mention's ComposeVariantItem).
export interface Variant {
  media: { mode: 'inherit'; alt: Record<string, string> } | { mode: 'override'; media: string[] };
}

// A record Bloom does not map (a literal union's keys, `Partial`): TS's own object.
export type Prefs = Partial<Record<'video' | 'audio', 'show' | 'hide'>>;
export const PREF_KEYS = ['video', 'audio'] as const;
