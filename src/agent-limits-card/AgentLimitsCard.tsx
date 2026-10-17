import { memo } from 'react';
import { UsageCard } from '../usage-card';
import { useMessages } from '../locale/messages';
import { AGENT_LIMITS_CARD_MESSAGES } from './messages';
import type { AgentLimitsCardProps } from './types';

/** @deprecated Use UsageCard from @oxy.so/bloom/usage-card. */
export const AgentLimitsCard = memo(function AgentLimitsCard({
  context,
  formatTokens,
  labels,
  ...props
}: AgentLimitsCardProps) {
  const { messages } = useMessages(AGENT_LIMITS_CARD_MESSAGES);
  return (
    <UsageCard
      radius="radius-16"
      {...props}
      formatValue={formatTokens}
      labels={{ ...labels, usage: labels?.contextWindow ?? messages.contextWindow }}
      usage={
        context
          ? {
              max: context.max,
              segments: context.segments.map(({ tokens, ...segment }) => ({
                ...segment,
                value: tokens,
              })),
              groups: context.groups?.map(({ tokens, items, ...group }) => ({
                ...group,
                value: tokens,
                items: items.map(({ tokens, ...item }) => ({ ...item, value: tokens })),
              })),
            }
          : undefined
      }
    />
  );
});
