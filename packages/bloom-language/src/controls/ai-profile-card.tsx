import {
  AiProfileCard as BloomAiProfileCard,
  type AiProfileCardProps,
} from '@oxy.so/bloom/ai-profile-card';

import { type Child, Node, type ViewModifiers } from '../node';
import type { ColorToken } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** The AI profile card: an agent's cover, identity, stats and activity. */
export type AiProfileCardKind = 'aiProfileCard';

/**
 * Bloom `AiProfileCard`'s data (its cover, identity, stats, periods and
 * activity cells) and handlers; `actions` is a language child.
 */
export type AiProfileCardOptions = Omit<
  AiProfileCardProps,
  'name' | 'color' | 'actions' | 'style' | 'testID'
> & { readonly actions?: Child };

/** Bloom `AiProfileCard`. */
export interface AiProfileCardView extends ViewModifiers<AiProfileCardView> {
  /** The activity grid's colour: a role (Bloom's violet with none). */
  tint(value: ColorToken): AiProfileCardView;
}

/** Bloom `AiProfileCard` of the agent named `name`. */
export function AiProfileCard(name: string, options: AiProfileCardOptions = {}): AiProfileCardView {
  return new Node('aiProfileCard', { name, options }, []);
}

export const AI_PROFILE_CARDS: Record<AiProfileCardKind, ControlRenderer> = {
  aiProfileCard: product(BloomAiProfileCard, {
    slots: ['actions'],
    colors: (d) => ({ color: d.own('tint')?.value as ColorToken | undefined }),
  }),
};
