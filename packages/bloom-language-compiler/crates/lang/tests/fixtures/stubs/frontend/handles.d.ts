// TS object types a Bloom struct is handed to (Mention's `UserHandleInput`, `AccountAvatar`):
// TS checks them structurally.
export interface UserHandleInput {
  username?: string | null;
  handle?: string | null;
}
export declare function normalizedHandle(user: UserHandleInput | null | undefined): string | null;
export interface AvatarSource {
  id: string;
  avatar?: string;
  color?: { hue: number };
}
export declare function placeholderColor(source: AvatarSource): string;
export declare function AccountAvatar(props: {
  account: AvatarSource;
  size?: number;
}): React.JSX.Element;
