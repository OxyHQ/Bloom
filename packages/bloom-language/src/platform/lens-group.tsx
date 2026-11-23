/**
 * Android and OxyOS: the glasses of a glass group. The group is one lens base that draws each
 * glass inside it as its own shape (`LensBase members`): a glass registers its key, corner and
 * transition with the group, and marks its view with the key (`nativeID`), where the engine finds
 * it and measures it before each frame. Glasses of one `.glassUnion()` share a key, so the engine
 * draws them as one shape; a `.glassID()` is the key, so the glass that takes it over takes the
 * shape with it.
 */
import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import type { GlassMember } from './glass-host.types';
import type { LensGroupMember } from './lens';

interface Registry {
  set: (token: object, member: LensGroupMember) => void;
  remove: (token: object) => void;
}

const LensGroupContext = createContext<Registry | null>(null);
LensGroupContext.displayName = 'BloomLensGroup';

export const LensGroupProvider = LensGroupContext.Provider;

/** Whether a glass is inside a glass group (it is then one of its shapes). */
export function useInLensGroup(): boolean {
  return useContext(LensGroupContext) !== null;
}

function sameMember(a: LensGroupMember, b: LensGroupMember): boolean {
  return a.key === b.key && a.cornerRadius === b.cornerRadius && a.transition === b.transition;
}

/** A group's glasses, in the order they arrived, one per key, and the registry they join. */
export function useLensGroup(): [readonly LensGroupMember[], Registry] {
  const [members, setMembers] = useState<readonly LensGroupMember[]>([]);
  const registry = useMemo<Registry>(() => {
    const held = new Map<object, LensGroupMember>();
    const publish = () => {
      const byKey = new Map<string, LensGroupMember>();
      for (const member of held.values()) if (!byKey.has(member.key)) byKey.set(member.key, member);
      const next = [...byKey.values()];
      setMembers((last) =>
        last.length === next.length &&
        last.every((member, index) => {
          const other = next[index];
          return other !== undefined && sameMember(member, other);
        })
          ? last
          : next,
      );
    };
    return {
      set: (token, member) => {
        held.set(token, member);
        publish();
      },
      remove: (token) => {
        held.delete(token);
        publish();
      },
    };
  }, []);
  return [members, registry];
}

export interface LensGroupGlassProps {
  member: GlassMember | undefined;
  /** The corner radius in points; `undefined` is a capsule. */
  radius: number | undefined;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/** A glass in a group: its view, marked with its key, and its place among the group's shapes. */
export function LensGroupGlass({ member, radius, style, children }: LensGroupGlassProps) {
  const registry = useContext(LensGroupContext);
  const own = useId();
  const token = useRef({}).current;
  const key = member?.union ?? member?.id ?? `bloom-glass:${own}`;
  const transition = member?.transition;
  useLayoutEffect(() => {
    const entry: LensGroupMember = { key };
    if (radius !== undefined) entry.cornerRadius = radius;
    if (transition !== undefined) entry.transition = transition;
    registry?.set(token, entry);
  }, [registry, token, key, radius, transition]);
  useLayoutEffect(() => () => registry?.remove(token), [registry, token]);
  return (
    <View nativeID={key} collapsable={false} style={style}>
      {children}
    </View>
  );
}
