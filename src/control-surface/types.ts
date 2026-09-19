import type { ReactNode } from 'react';

/**
 * The MATERIAL a control container paints itself in.
 *
 * `solid` is Bloom's default chrome: an opaque fill off the surface ladder, a
 * hairline and a shadow. `glass` is the translucent chrome a container paints
 * when it floats over content the container does not own — a page header's
 * islands, a media overlay's toolbar.
 *
 * It names the container's SURFACE, never the action's meaning. A destructive
 * action stays destructive in either material; see `docs/composition.mdx`.
 */
export type ControlMaterial = 'solid' | 'glass';

/** The size a container asks the controls inside it for. */
export type ControlDensity = 'medium' | 'small';

/**
 * What a container tells the controls inside it about presentation — and
 * nothing else.
 *
 * Both fields are VISUAL CONFIGURATION: a descendant may override either with
 * an explicit prop. Restrictions do not travel here, deliberately. `disabled`,
 * a modal's inertness and the effective accessibility preferences are
 * constraints rather than defaults, and a descendant must not be able to
 * re-enable itself by passing a prop — so they stay on their own channels.
 */
export interface ControlSurfaceValue {
  material: ControlMaterial;
  density: ControlDensity;
}

export interface ControlSurfaceProps {
  /** The material controls inside should default to. Inherited when omitted. */
  material?: ControlMaterial;
  /** The density controls inside should default to. Inherited when omitted. */
  density?: ControlDensity;
  children?: ReactNode;
}
