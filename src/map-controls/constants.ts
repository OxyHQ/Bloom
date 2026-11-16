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

export const MAP_CONTROLS_GEOMETRY: MapControlsGeometry = {
  control: 44,
  gap: 8,
  northTolerance: 0.5,
};
