/**
 * `PlacePicker`'s geometry. The list is drawn in the menu vocabulary
 * (`floating/`) — panel surface, hairline, dropdown shadow, 16px corner — so a
 * place list reads as the same object as a `TagField`'s suggestions or a
 * `Select`'s options, and its rows are 48 tall because each carries two lines.
 */

/** Characters typed before a list appears. Below three, a geocoder's answer is noise. */
export const PLACE_PICKER_MIN_QUERY_LENGTH = 3;

/** Decimal places a chosen coordinate is shown to: 5 is about a metre. */
export const PLACE_PICKER_COORDINATE_DIGITS = 5;

export const PLACE_PICKER_LIST_PADDING = 4;
export const PLACE_PICKER_LIST_GAP = 2;
export const PLACE_PICKER_LIST_RADIUS = 16;
export const PLACE_PICKER_OPTION_MIN_HEIGHT = 48;
export const PLACE_PICKER_OPTION_PADDING_X = 10;
export const PLACE_PICKER_OPTION_PADDING_Y = 6;
export const PLACE_PICKER_OPTION_RADIUS = 10;
export const PLACE_PICKER_OPTION_GAP = 10;
export const PLACE_PICKER_ICON_SIZE = 18;
