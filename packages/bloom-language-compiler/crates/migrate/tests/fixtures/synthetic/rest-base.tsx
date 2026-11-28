// `{ kind, ...visual }: P` where `interface P extends B` and the rest is exactly B's fields: the
// rest is one stored property of `B`, and `X(props)` passes the own props by name and B's as a record.
import { Text, VStack, view } from '@oxy.so/bloom-language';

interface Visual {
  size?: string;
  tone?: 'foreground' | 'muted';
}

export interface BadgeProps extends Visual {
  kind?: string;
  isFederated?: boolean;
}

function marker(label: string, { size = '15', tone }: Visual) {
  return Text(`${label} ${size} ${tone ?? 'muted'}`);
}

const BadgeMarker = view(function BadgeMarker({ kind, isFederated, ...visual }: BadgeProps) {
  return VStack(marker(isFederated ? 'remote' : (kind ?? 'local'), visual));
});

export const Badge = view(function Badge(props: BadgeProps) {
  return BadgeMarker(props);
});
