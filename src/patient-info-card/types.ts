import type { ImageSource } from '../shapes';
import type { StyleProp, ViewStyle } from 'react-native';
import type { BloomIconComponent } from '../icons/icon-component';

export interface PatientInfoCardDetail {
  icon: BloomIconComponent;
  label: string;
  /** Pre-formatted value (`"28 July, 1997"`). */
  value: string;
}

export interface PatientInfoCardProps {
  /** Patient name under the photo. */
  name: string;
  /** Photo. Without one the avatar shows `initials` on the neutral disc. */
  avatarSource?: string | ImageSource | null;
  /** Initials for the photo-less disc. Defaults to the first letter of `name`. */
  initials?: string;
  /** Label / value rows under the name. */
  details: readonly PatientInfoCardDetail[];
  /** Press handler of the `+` button pinned to the avatar. */
  onAddPhoto?: () => void;
  /** Accessible name of the `+` button (`"Add profile photo"` in English). */
  addPhotoLabel?: string;
  /** Hide the `+` button. */
  hideAddPhoto?: boolean;
  /** Card height. Defaults to `330`. */
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
