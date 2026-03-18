import { type ImageStyle, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { space, fontSize, lineHeight, borderRadius } from './tokens';

type AtomStyle = ViewStyle & TextStyle & ImageStyle;

/**
 * Static, theme-independent style atoms.
 * Follows ALF naming conventions (Tailwind-inspired with underscores).
 */
export const atoms = StyleSheet.create({
  // ---- Flex layout ----
  flex_row: { flexDirection: 'row' },
  flex_col: { flexDirection: 'column' },
  flex_row_reverse: { flexDirection: 'row-reverse' },
  flex_col_reverse: { flexDirection: 'column-reverse' },
  flex_wrap: { flexWrap: 'wrap' },
  flex_1: { flex: 1 },
  flex_shrink: { flexShrink: 1 },
  flex_grow: { flexGrow: 1 },

  // ---- Alignment ----
  align_center: { alignItems: 'center' },
  align_start: { alignItems: 'flex-start' },
  align_end: { alignItems: 'flex-end' },
  align_baseline: { alignItems: 'baseline' },
  align_stretch: { alignItems: 'stretch' },
  justify_center: { justifyContent: 'center' },
  justify_between: { justifyContent: 'space-between' },
  justify_end: { justifyContent: 'flex-end' },
  justify_start: { justifyContent: 'flex-start' },
  self_center: { alignSelf: 'center' },
  self_start: { alignSelf: 'flex-start' },
  self_end: { alignSelf: 'flex-end' },
  self_stretch: { alignSelf: 'stretch' },

  // ---- Position ----
  relative: { position: 'relative' },
  absolute: { position: 'absolute' },
  inset_0: { top: 0, right: 0, bottom: 0, left: 0 },
  top_0: { top: 0 },
  bottom_0: { bottom: 0 },
  left_0: { left: 0 },
  right_0: { right: 0 },

  // ---- Sizing ----
  w_full: { width: '100%' },
  h_full: { height: '100%' },
  max_w_full: { maxWidth: '100%' },

  // ---- Overflow ----
  overflow_hidden: { overflow: 'hidden' },

  // ---- Z-index ----
  z_10: { zIndex: 10 },
  z_20: { zIndex: 20 },
  z_30: { zIndex: 30 },
  z_40: { zIndex: 40 },
  z_50: { zIndex: 50 },

  // ---- Padding ----
  p_2xs: { padding: space._2xs },
  p_xs: { padding: space.xs },
  p_sm: { padding: space.sm },
  p_md: { padding: space.md },
  p_lg: { padding: space.lg },
  p_xl: { padding: space.xl },
  p_2xl: { padding: space._2xl },
  px_2xs: { paddingHorizontal: space._2xs },
  px_xs: { paddingHorizontal: space.xs },
  px_sm: { paddingHorizontal: space.sm },
  px_md: { paddingHorizontal: space.md },
  px_lg: { paddingHorizontal: space.lg },
  px_xl: { paddingHorizontal: space.xl },
  px_2xl: { paddingHorizontal: space._2xl },
  py_2xs: { paddingVertical: space._2xs },
  py_xs: { paddingVertical: space.xs },
  py_sm: { paddingVertical: space.sm },
  py_md: { paddingVertical: space.md },
  py_lg: { paddingVertical: space.lg },
  py_xl: { paddingVertical: space.xl },
  pt_2xs: { paddingTop: space._2xs },
  pt_xs: { paddingTop: space.xs },
  pt_sm: { paddingTop: space.sm },
  pt_md: { paddingTop: space.md },
  pt_lg: { paddingTop: space.lg },
  pb_2xs: { paddingBottom: space._2xs },
  pb_xs: { paddingBottom: space.xs },
  pb_sm: { paddingBottom: space.sm },
  pb_md: { paddingBottom: space.md },
  pb_lg: { paddingBottom: space.lg },
  pr_2xs: { paddingRight: space._2xs },
  pr_xs: { paddingRight: space.xs },
  pr_sm: { paddingRight: space.sm },
  pr_md: { paddingRight: space.md },
  pr_lg: { paddingRight: space.lg },
  pl_2xs: { paddingLeft: space._2xs },
  pl_xs: { paddingLeft: space.xs },
  pl_sm: { paddingLeft: space.sm },
  pl_md: { paddingLeft: space.md },
  pl_lg: { paddingLeft: space.lg },

  // ---- Margin ----
  m_auto: { margin: 'auto' as unknown as number },
  mx_auto: { marginHorizontal: 'auto' as unknown as number },
  my_auto: { marginVertical: 'auto' as unknown as number },
  mt_2xs: { marginTop: space._2xs },
  mt_xs: { marginTop: space.xs },
  mt_sm: { marginTop: space.sm },
  mt_md: { marginTop: space.md },
  mt_lg: { marginTop: space.lg },
  mb_2xs: { marginBottom: space._2xs },
  mb_xs: { marginBottom: space.xs },
  mb_sm: { marginBottom: space.sm },
  mb_md: { marginBottom: space.md },
  mb_lg: { marginBottom: space.lg },
  mr_2xs: { marginRight: space._2xs },
  mr_xs: { marginRight: space.xs },
  mr_sm: { marginRight: space.sm },
  mr_md: { marginRight: space.md },
  ml_2xs: { marginLeft: space._2xs },
  ml_xs: { marginLeft: space.xs },
  ml_sm: { marginLeft: space.sm },
  ml_md: { marginLeft: space.md },

  // ---- Gap ----
  gap_2xs: { gap: space._2xs },
  gap_xs: { gap: space.xs },
  gap_sm: { gap: space.sm },
  gap_md: { gap: space.md },
  gap_lg: { gap: space.lg },
  gap_xl: { gap: space.xl },
  gap_2xl: { gap: space._2xl },

  // ---- Border ----
  border: { borderWidth: 1 },
  border_t: { borderTopWidth: 1 },
  border_b: { borderBottomWidth: 1 },
  border_l: { borderLeftWidth: 1 },
  border_r: { borderRightWidth: 1 },

  // ---- Border radius ----
  rounded_2xs: { borderRadius: borderRadius._2xs },
  rounded_xs: { borderRadius: borderRadius.xs },
  rounded_sm: { borderRadius: borderRadius.sm },
  rounded_md: { borderRadius: borderRadius.md },
  rounded_lg: { borderRadius: borderRadius.lg },
  rounded_xl: { borderRadius: borderRadius.xl },
  rounded_2xl: { borderRadius: borderRadius._2xl },
  rounded_full: { borderRadius: borderRadius.full },

  // ---- Text ----
  text_2xs: { fontSize: fontSize._2xs },
  text_xs: { fontSize: fontSize.xs },
  text_sm: { fontSize: fontSize.sm },
  text_md: { fontSize: fontSize.md },
  text_lg: { fontSize: fontSize.lg },
  text_xl: { fontSize: fontSize.xl },
  text_2xl: { fontSize: fontSize._2xl },
  text_3xl: { fontSize: fontSize._3xl },
  text_4xl: { fontSize: fontSize._4xl },
  text_5xl: { fontSize: fontSize._5xl },
  text_left: { textAlign: 'left' },
  text_center: { textAlign: 'center' },
  text_right: { textAlign: 'right' },
  font_normal: { fontWeight: '400' as TextStyle['fontWeight'] },
  font_medium: { fontWeight: '500' as TextStyle['fontWeight'] },
  font_semibold: { fontWeight: '600' as TextStyle['fontWeight'] },
  font_bold: { fontWeight: '700' as TextStyle['fontWeight'] },
  font_heavy: { fontWeight: '800' as TextStyle['fontWeight'] },
  italic: { fontStyle: 'italic' },
  leading_tight: { lineHeight: fontSize.md * lineHeight.tight },
  leading_snug: { lineHeight: fontSize.md * lineHeight.snug },
  leading_normal: { lineHeight: fontSize.md * lineHeight.normal },
  leading_relaxed: { lineHeight: fontSize.md * lineHeight.relaxed },

  // ---- Pointer events ----
  pointer_events_none: { pointerEvents: 'none' as const },
  pointer_events_auto: { pointerEvents: 'auto' as const },

  // ---- Background ----
  bg_transparent: { backgroundColor: 'transparent' },

  // ---- Misc ----
  opacity_0: { opacity: 0 },
  opacity_50: { opacity: 0.5 },
  opacity_100: { opacity: 1 },
});

/**
 * Flatten a style prop into a single object.
 */
export function flatten(
  style: AtomStyle | AtomStyle[] | undefined | null | false,
): AtomStyle {
  return StyleSheet.flatten(style) as AtomStyle;
}

export type ViewStyleProp = { style?: ViewStyle | ViewStyle[] };
export type TextStyleProp = { style?: TextStyle | TextStyle[] };
