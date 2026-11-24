/**
 * A covered screen for the lens: while something is in front of a screen (a stack scene over it, a
 * modal overlay over the app), its controls' lenses are drawn in their place, against the screen's
 * fill, under whatever covers them (`@oxy.so/bloom-lens`'s `LensCover`). The window overlay draws a
 * resting lens above everything: Mention drew Home's header over the settings modal a deep link
 * opened, and Profile's buttons over a settings page opened from it. Without the lens, or without a
 * fill to draw against (no theme above it), it renders its children alone.
 */
import type { ReactNode } from 'react';

import { getNativeLens } from './native-lens';

export function LensCover({
  covered,
  fill,
  children,
}: {
  covered: boolean;
  fill: string | undefined;
  children?: ReactNode;
}) {
  const Cover = getNativeLens()?.LensCover;
  if (!Cover || fill === undefined) return <>{children}</>;
  return (
    <Cover covered={covered} fill={fill}>
      {children}
    </Cover>
  );
}
