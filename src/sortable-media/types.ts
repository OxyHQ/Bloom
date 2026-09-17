import type { StyleProp, ViewStyle } from 'react-native';

/** Where one photo is in its upload. */
export type SortablePhotoStatus = 'uploading' | 'uploaded' | 'error';

/** One photo in a {@link SortablePhotoGridProps} list. */
export interface SortablePhoto {
  /** Stable id; the grid keys, reorders and reports by it. */
  id: string;
  /** An absolute URL (a local `file:`/`blob:` preview works) or an `ImageResolver` id. */
  uri: string;
  /** Default `uploaded`. */
  status?: SortablePhotoStatus;
  /** Upload progress 0..100 while `uploading`. Omitted: an indeterminate overlay. */
  progress?: number;
  /** The error line while `status` is `error`. Default `labels.failed`. */
  error?: string;
  /** What the photo shows ("Living room"), added to its accessible name. */
  alt?: string;
}

/** Visible and accessible copy, overridable for localisation. */
export interface SortablePhotoGridLabels {
  /** A photo's name. Default `` (position, total) => `Photo ${position} of ${total}` ``. */
  photo: (position: number, total: number) => string;
  /** The first photo's badge, also added to its name. Default `"Cover"`. */
  cover: string;
  /** Default `` (position) => `Move photo ${position} earlier` ``. */
  moveEarlier: (position: number) => string;
  /** Default `` (position) => `Move photo ${position} later` ``. */
  moveLater: (position: number) => string;
  /** Default `` (position) => `Remove photo ${position}` ``. */
  remove: (position: number) => string;
  /** The retry button's name. Default `` (position) => `Retry uploading photo ${position}` ``. */
  retry: (position: number) => string;
  /** The retry button's visible text. Default `"Retry"`. */
  retryAction: string;
  /** The progress overlay's name. Default `` (position) => `Uploading photo ${position}` ``. */
  uploading: (position: number) => string;
  /** Default `"Upload failed"`. */
  failed: string;
  /** The add tile. Default `"Add photos"`. */
  add: string;
  /** Announced after a move. Default `` (position, total) => `Moved to position ${position} of ${total}` ``. */
  moved: (position: number, total: number) => string;
}

export interface SortablePhotoGridProps {
  /** The photos, in order. The first is the cover. */
  photos: ReadonlyArray<SortablePhoto>;
  /** Called with the whole list in its new order after a drag or a move button. */
  onReorder: (photos: SortablePhoto[]) => void;
  /** Draws each photo's remove button. Called with the photo's id. */
  onRemove?: (id: string) => void;
  /** Draws the retry button on a failed photo. Called with the photo's id. */
  onRetry?: (id: string) => void;
  /** Draws the add tile after the photos; open the app's picker here. */
  onAdd?: () => void;
  /** Hides the add tile once this many photos are in the list. */
  maxPhotos?: number;
  /** A line under "Add photos" on the add tile ("JPG or PNG, up to 20 MB"). */
  addHint?: string;
  /** A fixed column count. Default: 4 from 640 wide, 3 below. */
  columns?: number;
  /** The `ImageResolver` rendition for an id `uri`. */
  photoVariant?: string;
  /** Stops reordering, removing and adding. */
  disabled?: boolean;
  labels?: Partial<SortablePhotoGridLabels>;
  /** Names the grid. Default `"Photos"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
