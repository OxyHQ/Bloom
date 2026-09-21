export interface MapControlsGeometry {
  /** A control's square target. */
  control: number;
  /** Between two islands in the stack. */
  gap: number;
  /**
   * How close to north the map has to be for the compass to call itself
   * pointed north and step out of the way.
   */
  northTolerance: number;
}

/**
 * 44 is the target, not the 34 the button group's `medium` rung draws.
 *
 * A group rung is sized for a toolbar standing beside other chrome, where the
 * row as a whole is the target a finger aims at. A map control is a LONE
 * circle over a moving map with a finger already on the glass, and 34 is under
 * every platform's minimum. The item takes the size through its own `style`,
 * which is the override `ButtonGroupItem` publishes — nothing about its fill,
 * its hover, its press or its focus ring changes.
 */
export const MAP_CONTROLS_GEOMETRY: MapControlsGeometry = {
  control: 44,
  gap: 8,
  northTolerance: 0.5,
};

/** The square every control in the stack takes. */
export const MAP_CONTROL_BOX = {
  width: MAP_CONTROLS_GEOMETRY.control,
  height: MAP_CONTROLS_GEOMETRY.control,
} as const;
