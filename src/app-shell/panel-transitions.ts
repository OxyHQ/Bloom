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

/** Only the track and its material paint layers own panel exit completion. */
export function panelExitTransitions(owner: HTMLElement): Animation[] {
  return (owner.getAnimations?.({ subtree: true }) ?? []).filter((animation) => {
    if (
      !('transitionProperty' in animation) ||
      typeof animation.transitionProperty !== 'string' ||
      (!animation.pending && animation.playState !== 'running')
    )
      return false;
    const target = (animation.effect as KeyframeEffect | null)?.target;
    if (!(target instanceof HTMLElement)) return false;
    if (target === owner)
      return (
        GEOMETRY_PROPERTY.test(animation.transitionProperty) ||
        /^(opacity|scale)$/.test(animation.transitionProperty)
      );
    return (
      animation.transitionProperty === 'opacity' &&
      target.parentElement?.hasAttribute('data-bloom-panel-material') === true &&
      target.closest('[data-bloom-panel-owner]') === owner
    );
  });
}
