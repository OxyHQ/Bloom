import {
  Easing,
  cancelAnimation,
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
    withTiming(target.width, { duration: PANEL_LAYOUT_MS, easing: ease }),
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

/** A track's flex along its group's axis, as shared values (`PanelFlexTrack`). */
export interface PanelFlexValues {
  grow: SharedValue<number>;
  basis: SharedValue<number>;
  min: SharedValue<number>;
  /** `Infinity`: no maximum. */
  max: SharedValue<number>;
  gap: SharedValue<number>;
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
}

/**
 * The CSS compositor's exit → geometry → entry phases for native flex: the
 * track's flex values move as the browser transitions `flex-grow`,
 * `flex-basis`, `min-*`, `max-*` and the leading margin, and Yoga lays the
 * group out from them every frame, so neighbours give and take room natively.
 * A maximum to or from none cannot be interpolated and changes at once, as a
 * CSS `max-width: none` does. `immediate` lands everything at once (reduced
 * motion, a breakpoint crossed by a resize, a size a resize gesture set).
 */
export function animatePanelFlex(
  values: PanelFlexValues,
  target: {
    grow: number;
    basis: number;
    min: number;
    max: number;
    gap: number;
    visible: boolean;
  },
  ordered: boolean,
  immediate: boolean,
) {
  'worklet';
  const geometry = [
    [values.grow, target.grow],
    [values.basis, target.basis],
    [values.min, target.min],
    [values.gap, target.gap],
  ] as const;
  for (const value of [
    ...geometry.map(([shared]) => shared),
    values.max,
    values.opacity,
    values.scale,
  ])
    cancelAnimation(value);
  if (immediate) {
    for (const [shared, to] of geometry) shared.value = to;
    values.max.value = target.max;
    values.opacity.value = target.visible ? 1 : 0;
    values.scale.value = 1;
    return;
  }
  const geometryDelay = ordered ? PANEL_EXIT_MS : 0;
  const fadeDelay =
    ordered && target.visible && values.opacity.value < 1 ? PANEL_ENTER_DELAY_MS : 0;
  const timing = { duration: PANEL_LAYOUT_MS, easing: ease };
  for (const [shared, to] of geometry)
    shared.value = withDelay(geometryDelay, withTiming(to, timing));
  values.max.value =
    Number.isFinite(values.max.value) && Number.isFinite(target.max)
      ? withDelay(geometryDelay, withTiming(target.max, timing))
      : target.max;
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
