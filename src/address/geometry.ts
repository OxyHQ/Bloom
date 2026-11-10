import type { BloomSize } from '../appearance';
import type { TypeScaleVariant } from '../typography/scale';
import type { AddressDensity } from './types';

export const ADDRESS_SCOPED_GEOMETRY: Record<
  BloomSize,
  Record<
    AddressDensity,
    { tile: number; glyph: number; badgeGap: number; metaGap: number; splitActionPadding: number }
  >
> = {
  xs: {
    comfortable: { tile: 32, glyph: 16, badgeGap: 4, metaGap: 6, splitActionPadding: 12 },
    compact: { tile: 24, glyph: 12, badgeGap: 3, metaGap: 4, splitActionPadding: 8 },
  },
  sm: {
    comfortable: { tile: 36, glyph: 18, badgeGap: 5, metaGap: 7, splitActionPadding: 14 },
    compact: { tile: 28, glyph: 14, badgeGap: 4, metaGap: 5, splitActionPadding: 10 },
  },
  md: {
    comfortable: { tile: 40, glyph: 20, badgeGap: 6, metaGap: 8, splitActionPadding: 16 },
    compact: { tile: 32, glyph: 16, badgeGap: 5, metaGap: 6, splitActionPadding: 12 },
  },
  lg: {
    comfortable: { tile: 48, glyph: 24, badgeGap: 8, metaGap: 12, splitActionPadding: 20 },
    compact: { tile: 40, glyph: 20, badgeGap: 6, metaGap: 8, splitActionPadding: 16 },
  },
};

export interface AddressListGeometry {
  sectionGap: number;
  sectionsGap: number;
  headerPadding: number;
  headerVariant: TypeScaleVariant;
  rowGap: number;
  loadingPaddingHorizontal: number;
  loadingPaddingVertical: number;
  loadingContentGap: number;
  loadingTitleLineHeight: number;
  loadingSubtitleLineHeight: number;
  emptyIcon: number;
  emptyGap: number;
  emptyPaddingHorizontal: number;
  emptyPaddingVertical: number;
  emptyTitleVariant: TypeScaleVariant;
  emptyDescriptionVariant: TypeScaleVariant;
}

export const ADDRESS_LIST_GEOMETRY: Record<BloomSize, AddressListGeometry> = {
  xs: {
    sectionGap: 6,
    sectionsGap: 12,
    headerPadding: 12,
    headerVariant: 'caption-2-semibold',
    rowGap: 8,
    loadingPaddingHorizontal: 12,
    loadingPaddingVertical: 8,
    loadingContentGap: 2,
    loadingTitleLineHeight: 14,
    loadingSubtitleLineHeight: 12,
    emptyIcon: 24,
    emptyGap: 6,
    emptyPaddingHorizontal: 12,
    emptyPaddingVertical: 24,
    emptyTitleVariant: 'body-2-medium',
    emptyDescriptionVariant: 'caption-1-regular',
  },
  sm: {
    sectionGap: 7,
    sectionsGap: 14,
    headerPadding: 14,
    headerVariant: 'caption-1-semibold',
    rowGap: 10,
    loadingPaddingHorizontal: 14,
    loadingPaddingVertical: 9,
    loadingContentGap: 3,
    loadingTitleLineHeight: 16,
    loadingSubtitleLineHeight: 13,
    emptyIcon: 28,
    emptyGap: 7,
    emptyPaddingHorizontal: 14,
    emptyPaddingVertical: 28,
    emptyTitleVariant: 'body-medium',
    emptyDescriptionVariant: 'body-2-regular',
  },
  md: {
    sectionGap: 8,
    sectionsGap: 16,
    headerPadding: 16,
    headerVariant: 'caption-1-semibold',
    rowGap: 12,
    loadingPaddingHorizontal: 16,
    loadingPaddingVertical: 10,
    loadingContentGap: 4,
    loadingTitleLineHeight: 16,
    loadingSubtitleLineHeight: 14,
    emptyIcon: 32,
    emptyGap: 8,
    emptyPaddingHorizontal: 16,
    emptyPaddingVertical: 32,
    emptyTitleVariant: 'body-medium',
    emptyDescriptionVariant: 'body-2-regular',
  },
  lg: {
    sectionGap: 10,
    sectionsGap: 20,
    headerPadding: 20,
    headerVariant: 'body-2-semibold',
    rowGap: 16,
    loadingPaddingHorizontal: 20,
    loadingPaddingVertical: 12,
    loadingContentGap: 6,
    loadingTitleLineHeight: 20,
    loadingSubtitleLineHeight: 16,
    emptyIcon: 40,
    emptyGap: 10,
    emptyPaddingHorizontal: 20,
    emptyPaddingVertical: 40,
    emptyTitleVariant: 'headline-medium',
    emptyDescriptionVariant: 'body-regular',
  },
};

export const ADDRESS_TITLE_VARIANT: Record<BloomSize, TypeScaleVariant> = {
  xs: 'body-2-medium',
  sm: 'body-medium',
  md: 'headline-medium',
  lg: 'title-3-medium',
};

export const ADDRESS_META_VARIANT: Record<BloomSize, TypeScaleVariant> = {
  xs: 'caption-1-regular',
  sm: 'body-2-regular',
  md: 'body-2-regular',
  lg: 'body-regular',
};
