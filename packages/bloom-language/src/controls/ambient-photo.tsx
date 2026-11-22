import {
  AmbientPhoto as BloomAmbientPhoto,
  type AmbientPhotoProps,
} from '@oxy.so/bloom/ambient-photo';

import { Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** An ambient display's photo. */
export type AmbientPhotoKind = 'ambientPhoto';

/** Bloom `AmbientPhoto`'s timing (its cross-fade and drift) and its report of each photo shown. */
export type AmbientPhotoOptions = Omit<AmbientPhotoProps, 'source' | 'style' | 'testID'>;

/** Bloom `AmbientPhoto`: it fills its box. */
export type AmbientPhotoView = ViewModifiers<AmbientPhotoView>;

/**
 * Bloom `AmbientPhoto` of `source` (a URI): a new one cross-fades in over the
 * one on screen, `null` keeps it.
 */
export function AmbientPhoto(
  source: string | null | undefined,
  options: AmbientPhotoOptions = {},
): AmbientPhotoView {
  return new Node('ambientPhoto', { source, options }, []);
}

export const AMBIENT_PHOTOS: Record<AmbientPhotoKind, ControlRenderer> = {
  ambientPhoto: product(BloomAmbientPhoto),
};
