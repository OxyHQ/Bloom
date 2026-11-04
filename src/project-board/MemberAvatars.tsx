import { AvatarGroup } from '../avatar-group';
import { useTheme } from '../theme/use-theme';
import type { ProjectMember } from './types';

/** A 2px ring of the card's fill around each face. */
const RING = 2;

/**
 * Overlapping assignee faces, 6px apart, ringed in the card's fill. The ring
 * overhangs the row the way a CSS ring does, so the row keeps the faces' own
 * `size`.
 */
export function MemberAvatars({
  ids,
  members,
  size,
}: {
  ids: readonly string[];
  members: Readonly<Record<string, ProjectMember>>;
  size: number;
}) {
  const { colors } = useTheme();
  const items = ids.flatMap((id) => {
    const member = members[id];
    return member ? [{ id, uri: member.avatar, name: member.name, initials: member.initials }] : [];
  });
  return (
    <AvatarGroup
      items={items}
      max={items.length}
      size={size + RING * 2}
      overlap={6}
      ringWidth={RING}
      ringColor={colors.card}
      style={{ margin: -RING }}
    />
  );
}
