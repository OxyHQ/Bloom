/** Only finite compositor geometry transitions can delay a scroll-owner handoff or reveal. */
const GEOMETRY_PROPERTY =
  /^(width|height|flex-basis|flex-grow|min-width|min-height|max-width|max-height|margin-inline-start|margin-top|padding-inline-start|display)$/;

export function panelGeometryTransitions(owners: Iterable<HTMLElement>): Animation[] {
  return [...new Set(owners)].flatMap((owner) =>
    (owner.getAnimations?.() ?? []).filter(
      (animation) =>
        'transitionProperty' in animation &&
        typeof animation.transitionProperty === 'string' &&
        GEOMETRY_PROPERTY.test(animation.transitionProperty) &&
        (animation.pending || animation.playState === 'running'),
    ),
  );
}
