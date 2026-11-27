import { Text, view } from '@oxy.so/bloom-language';

const AccountBadgeMarker = view(function AccountBadgeMarker({ kind }: { kind: string }) {
  return Text(kind);
});

/** Mention's AccountBadge: a function returning a Bloom node (or nothing), not a component. */
export function AccountBadge(props: { kind?: string }) {
  if (!props.kind) return null;
  return AccountBadgeMarker({ kind: props.kind });
}
