// Two TS object types of one shape (TS's types are structural), an optional of a type Bloom
// does not map, and a view prop typed with the embedded language's `ViewNode`.
import type { ViewNode } from '@oxy.so/bloom-language';

export interface PostUser {
  id: string;
  name: string;
  verified?: boolean;
}
export interface ProfileCardData {
  id: string;
  name: string;
}
export interface Writer {
  writer: PostUser;
}
export interface AvatarAccount {
  id: string;
}
export declare function useWriters(): Writer[];
export declare function useAccount(): AvatarAccount | undefined;
export declare function ProfileCard(props: {
  profile: ProfileCardData;
  account?: AvatarAccount;
  subtitle?: ViewNode;
}): React.JSX.Element;
