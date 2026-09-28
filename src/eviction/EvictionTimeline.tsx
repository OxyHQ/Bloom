import React, { memo, useMemo } from 'react';

import { TenancyTimeline } from '../tenancy/TenancyTimeline';
import type { TenancyTimelineEvent } from '../tenancy/types';
import { useMessages } from '../locale/messages';
import { EVICTION_EVENT } from './constants';
import { EVICTION_MESSAGES } from './messages';
import type { EvictionTimelineProps } from './types';

/**
 * An eviction case's history: the report, the date being set, postponements,
 * suspensions, the outcome — each with its date and where it came from.
 *
 * It is `TenancyTimeline` at comfortable density with a marker per event kind:
 *
 *   published     file       primary
 *   date-set      calendar   warning
 *   postponed     clock      info
 *   suspended     shield     success
 *   executed      house      neutral
 *   cancelled     x circle   neutral
 *   mobilisation  group      primary
 *   update        info       primary
 *
 * `upcoming` entries (a date not yet reached) draw a hollow marker. The source
 * is drawn beside the date ("14 Aug 2026 · Source: Court notice") so a reader
 * can weigh each claim.
 */
function EvictionTimelineComponent({
  events,
  formatSource: formatSourceProp,
  accessibilityLabel: accessibilityLabelProp,
  style,
  testID,
}: EvictionTimelineProps) {
  const { messages } = useMessages(EVICTION_MESSAGES);
  const formatSource = formatSourceProp ?? messages.source;
  const accessibilityLabel = accessibilityLabelProp ?? messages.caseHistory;
  const mapped = useMemo<TenancyTimelineEvent[]>(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        actor: event.source ? formatSource(event.source) : undefined,
        description: event.description,
        icon: EVICTION_EVENT[event.kind].icon,
        tone: EVICTION_EVENT[event.kind].tone,
        state: event.upcoming ? 'upcoming' : 'complete',
      })),
    [events, formatSource],
  );
  return (
    <TenancyTimeline
      events={mapped}
      accessibilityLabel={accessibilityLabel}
      style={style}
      testID={testID}
    />
  );
}

export const EvictionTimeline = memo(EvictionTimelineComponent);
EvictionTimeline.displayName = 'EvictionTimeline';
