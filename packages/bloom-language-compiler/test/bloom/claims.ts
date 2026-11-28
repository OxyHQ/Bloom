// A post TS types as always there, and a TS function that takes its id (Mention's postPermalink).
export interface ClaimPost {
  id: string;
  user: { name: string };
  metadata?: { slug?: string };
}
export function permalink(postId: string): string {
  return `https://mention.earth/p/${postId}`;
}

// A handle TS may not have (`@oxy.so/core`'s getNormalizedUserHandle), beside a TS optional member.
export interface ClaimUser {
  displayName?: string;
}
export function handleOf(user: ClaimUser): string | null {
  return user.displayName ?? null;
}
