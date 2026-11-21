import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';
import { Text } from '@oxy.so/bloom/typography';

import type { ParityCase } from '../../parity/support/cases';
import { ACCORDION_CASES } from '../../parity/accordion.cases';
import { ACTIVITY_HEATMAP_CASES } from '../../parity/activity-heatmap.cases';
import { AVATAR_CASES } from '../../parity/avatar.cases';
import { BREADCRUMB_CASES } from '../../parity/breadcrumb.cases';
import { BUTTON_CASES } from '../../parity/button.cases';
import { CAROUSEL_CASES } from '../../parity/carousel.cases';
import { CODE_CASES } from '../../parity/code.cases';
import { CONTEXT_MENU_CASES } from '../../parity/context-menu.cases';
import { HOVER_CARD_CASES } from '../../parity/hover-card.cases';
import { MENUBAR_CASES } from '../../parity/menubar.cases';
import { DATE_PICKER_CASES } from '../../parity/date-picker.cases';
import { FILE_UPLOAD_CASES } from '../../parity/file-upload.cases';
import { ICON_CASES, ICON_CASES_EVERY } from '../../parity/icon.cases';
import { INPUT_CASES } from '../../parity/inputs.cases';
import { LAYOUT_CASES } from '../../parity/layout.cases';
import { LIST_CASES } from '../../parity/list.cases';
import { MARKDOWN_CASES } from '../../parity/markdown.cases';
import { PIECES_CASES } from '../../parity/pieces.cases';
import { RATING_CASES } from '../../parity/rating.cases';
import { SLIDER_CASES } from '../../parity/slider.cases';
import { STAT_BAR_CASES } from '../../parity/stat-bar.cases';
import { STEPPER_CASES } from '../../parity/stepper.cases';
import { STICKER_CASES } from '../../parity/sticker.cases';
import { TABLE_CASES } from '../../parity/table.cases';
import { TAG_FIELD_CASES } from '../../parity/tag-field.cases';
import { TOOLTIP_CASES } from '../../parity/tooltip.cases';
import { ANIMATED_CHECK_CASES } from '../../parity/animated-check.cases';
import { FACT_STRIP_CASES } from '../../parity/fact-strip.cases';
import { EXPANDABLE_TEXT_CASES } from '../../parity/expandable-text.cases';
import { COMPOSITION_BAR_CASES } from '../../parity/composition-bar.cases';
import { MATERIAL_CASES } from '../../parity/material.cases';
import { TEXT_CASES } from '../../parity/text.cases';
import { VARIANT_CASES } from '../../parity/variants.cases';
import { VIDEO_CASES } from '../../parity/video-view.cases';
import { CATEGORY_BAR_CASES } from '../../parity/category-bar.cases';
import { SORTABLE_MEDIA_CASES } from '../../parity/sortable-media.cases';
import { VIDEO_PLAYBACK_CASES } from '../../parity/video-playback.cases';
import { DROP_ZONE_CASES } from '../../parity/drop-zone.cases';
import { COLLAPSIBLE_CASES } from '../../parity/collapsible.cases';
import { CHOICE_LIST_CASES } from '../../parity/choice-list.cases';
import { COLOR_SWATCH_PICKER_CASES } from '../../parity/color-swatch-picker.cases';
import { INPUT_OTP_CASES } from '../../parity/input-otp.cases';
import { IMAGE_ASPECT_RATIO_CASES } from '../../parity/image-aspect-ratio-cache.cases';
import { MEDIA_INSET_BORDER_CASES } from '../../parity/media-inset-border.cases';

/**
 * Each language node beside the Bloom element it stands for: the same cases
 * the parity suite compares (`parity/*.cases.tsx`). `scripts/verify-parity-web.mjs`
 * compares each pair's computed styles in a browser; a reader compares them by eye.
 */
function ParityTable({ cases }: { cases: readonly ParityCase[] }) {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Text variant="caption-1-semibold" style={{ width: 220 }}>
          Case
        </Text>
        <Text variant="caption-1-semibold" style={{ flex: 1 }}>
          Bloom
        </Text>
        <Text variant="caption-1-semibold" style={{ flex: 1 }}>
          Language
        </Text>
      </View>
      {cases.map((c, index) => (
        <View key={c.name} style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
          <Text variant="caption-1-regular" style={{ width: 220 }}>
            {c.name}
          </Text>
          <View testID={`bloom-${index}`} style={{ flex: 1, alignItems: 'flex-start' }}>
            {c.bloom()}
          </View>
          <View testID={`language-${index}`} style={{ flex: 1, alignItems: 'flex-start' }}>
            {c.language()}
          </View>
        </View>
      ))}
    </View>
  );
}

const meta: Meta<typeof ParityTable> = {
  title: 'Language/Parity',
  component: ParityTable,
};
export default meta;

type Story = StoryObj<typeof ParityTable>;

export const TextAndTypography: Story = { args: { cases: TEXT_CASES } };
export const Icons: Story = { args: { cases: ICON_CASES } };
export const EveryIcon: Story = { args: { cases: ICON_CASES_EVERY } };
export const Material: Story = { args: { cases: MATERIAL_CASES } };
export const AvatarsAndGroups: Story = { args: { cases: AVATAR_CASES } };
export const SmallPieces: Story = { args: { cases: PIECES_CASES } };
export const Buttons: Story = { args: { cases: BUTTON_CASES } };
export const Layout: Story = { args: { cases: LAYOUT_CASES } };
export const Variants: Story = { args: { cases: VARIANT_CASES } };
export const DateAndTimePickers: Story = { args: { cases: DATE_PICKER_CASES } };
export const Ratings: Story = { args: { cases: RATING_CASES } };
export const MetersAndProgress: Story = { args: { cases: STAT_BAR_CASES } };
export const Stickers: Story = { args: { cases: STICKER_CASES } };
export const Tables: Story = { args: { cases: TABLE_CASES } };
export const RowsAndLists: Story = { args: { cases: LIST_CASES } };
export const Carousels: Story = { args: { cases: CAROUSEL_CASES } };
export const Markdown: Story = { args: { cases: MARKDOWN_CASES } };
export const Sliders: Story = { args: { cases: SLIDER_CASES } };
export const Accordions: Story = { args: { cases: ACCORDION_CASES } };
export const Code: Story = { args: { cases: CODE_CASES } };
export const Steppers: Story = { args: { cases: STEPPER_CASES } };
export const Tooltips: Story = { args: { cases: TOOLTIP_CASES } };
export const Breadcrumbs: Story = { args: { cases: BREADCRUMB_CASES } };
export const ActivityHeatmaps: Story = { args: { cases: ACTIVITY_HEATMAP_CASES } };
export const TagFields: Story = { args: { cases: TAG_FIELD_CASES } };
export const FileUploads: Story = { args: { cases: FILE_UPLOAD_CASES } };
export const Videos: Story = { args: { cases: VIDEO_CASES } };
export const Inputs: Story = { args: { cases: INPUT_CASES } };
export const OneTimeCodes: Story = { args: { cases: INPUT_OTP_CASES } };
export const ColorSwatchPickers: Story = { args: { cases: COLOR_SWATCH_PICKER_CASES } };
export const AnimatedChecks: Story = { args: { cases: ANIMATED_CHECK_CASES } };
export const ContextMenus: Story = { args: { cases: CONTEXT_MENU_CASES } };
export const Collapsibles: Story = { args: { cases: COLLAPSIBLE_CASES } };
export const DropZones: Story = { args: { cases: DROP_ZONE_CASES } };
export const MediaInsetBorders: Story = { args: { cases: MEDIA_INSET_BORDER_CASES } };
export const ImageAspectRatios: Story = { args: { cases: IMAGE_ASPECT_RATIO_CASES } };
export const FactStrips: Story = { args: { cases: FACT_STRIP_CASES } };
export const PhotoGrids: Story = { args: { cases: SORTABLE_MEDIA_CASES } };
export const ChoiceLists: Story = { args: { cases: CHOICE_LIST_CASES } };
export const VideoPlayback: Story = { args: { cases: VIDEO_PLAYBACK_CASES } };
export const HoverCards: Story = { args: { cases: HOVER_CARD_CASES } };
export const ExpandableText: Story = { args: { cases: EXPANDABLE_TEXT_CASES } };
export const CategoryBars: Story = { args: { cases: CATEGORY_BAR_CASES } };
export const Menubars: Story = { args: { cases: MENUBAR_CASES } };
export const CompositionBars: Story = { args: { cases: COMPOSITION_BAR_CASES } };
