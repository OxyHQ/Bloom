// A literal union named through an `as const` list (Mention's `MembershipBenefit`).
export const MEMBERSHIP_BENEFITS = ['content_read', 'discussion_write'] as const;
export type MembershipBenefit = (typeof MEMBERSHIP_BENEFITS)[number];
export declare const TIER_KINDS: readonly ['free', 'plus'];
export type TierKind = (typeof TIER_KINDS)[number];
export interface Tier {
  kind: TierKind;
  benefits: MembershipBenefit[];
}
