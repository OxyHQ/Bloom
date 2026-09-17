import React, { memo } from 'react';

import { ContactCard } from './ContactCard';
import type { HostCardProps } from './types';

/**
 * The host of a stay: `ContactCard` with `role="host"` — a profile card, then
 * details and a "Message host" button. Geometry, colours and testIDs are
 * `ContactCard`'s (see its header).
 */
function HostCardComponent({ messageLabel = 'Message host', ...props }: HostCardProps) {
  return <ContactCard {...props} role="host" messageLabel={messageLabel} />;
}

export const HostCard = memo(HostCardComponent);
HostCard.displayName = 'HostCard';
