import type { ComponentType } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

/** An icon COMPONENT (`RiDropLine`, not an element) — the row sizes and colours it. */
export type PatientInfoCardIcon = ComponentType<{ width?: number; height?: number; fill?: string }>;

export interface PatientInfoCardDetail {
  icon: PatientInfoCardIcon;
  label: string;
  /** Pre-formatted value (`"28 July, 1997"`). */
  value: string;
}

export interface PatientInfoCardProps {
  /** Patient name under the photo. */
  name: string;
  /** Photo. Without one the avatar shows `initials` on the neutral disc. */
  avatarSource?: string | ImageSourcePropType | null;
  /** Initials for the photo-less disc. Defaults to the first letter of `name`. */
  initials?: string;
  /** Label / value rows under the name. */
  details: readonly PatientInfoCardDetail[];
  /** Press handler of the `+` button pinned to the avatar. */
  onAddPhoto?: () => void;
  /** Accessible name of the `+` button. Defaults to `"Add profile photo"`. */
  addPhotoLabel?: string;
  /** Hide the `+` button. */
  hideAddPhoto?: boolean;
  /** Card height. Defaults to `330`. */
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
