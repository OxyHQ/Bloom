import {
  Easing,
  cancelAnimation,
  runOnJS,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

export const PANEL_EXIT_MS = 150;
export const PANEL_LAYOUT_MS = 380;
export const PANEL_ENTER_DELAY_MS = PANEL_EXIT_MS + PANEL_LAYOUT_MS;
const ease = Easing.bezier(0.4, 0, 0.2, 1);

/** Native adapter for the same exit → geometry → entry phases used by the CSS compositor. */
export function animatePanelLayout(
  values: {
    width: SharedValue<number>;
    gap: SharedValue<number>;
    opacity: SharedValue<number>;
    scale: SharedValue<number>;
  },
  target: { width: number; gap: number; visible: boolean },
  ordered: boolean,
  reduced: boolean,
  /** The width's animation finished at `target.width` (`useRestingSize`'s `landed`). */
  onWidthLanded?: (width: number) => void,
) {
  'worklet';
  for (const value of [values.width, values.gap, values.opacity, values.scale])
    cancelAnimation(value);
  if (reduced) {
    values.width.value = target.width;
    values.gap.value = target.gap;
    values.opacity.value = target.visible ? 1 : 0;
    values.scale.value = 1;
    return;
  }
  const geometryDelay = ordered ? PANEL_EXIT_MS : 0;
  const fadeDelay =
    ordered && target.visible && values.opacity.value < 1 ? PANEL_ENTER_DELAY_MS : 0;
  values.width.value = withDelay(
    geometryDelay,
    withTiming(target.width, { duration: PANEL_LAYOUT_MS, easing: ease }, (finished) => {
      if (finished && onWidthLanded) runOnJS(onWidthLanded)(target.width);
    }),
  );
  values.gap.value = withDelay(
    geometryDelay,
    withTiming(target.gap, { duration: PANEL_LAYOUT_MS, easing: ease }),
  );
  values.opacity.value = withDelay(
    fadeDelay,
    withTiming(target.visible ? 1 : 0, {
      duration: ordered ? PANEL_EXIT_MS : PANEL_LAYOUT_MS,
      easing: ease,
    }),
  );
  values.scale.value = withDelay(
    fadeDelay,
    withTiming(ordered && !target.visible ? 0.98 : 1, { duration: PANEL_EXIT_MS }),
  );
}
