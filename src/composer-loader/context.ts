import { createContext, useContext, useEffect } from 'react';

/** Paint ownership only; frame clocks never flow through React context. */
export const ComposerLoaderPaintContext = createContext<boolean | undefined>(undefined);

export function useComposerLoaderPaint() {
  return useContext(ComposerLoaderPaintContext);
}

/**
 * How a composer inside a loader tells it what corner radius it has right now.
 *
 * The loader paints the pill's container and traces its rim, so both must follow the box they
 * wrap. A pill is a full capsule at one line and squares off when it grows into a stack (several
 * lines, attachments, a status tab), and only the pill knows which it is: a loader that kept the
 * capsule would draw an oval behind a rectangle. A `radius` the host passes to the loader wins.
 */
export const ComposerLoaderRadiusContext = createContext<
  ((radius: number | undefined) => void) | null
>(null);

/** Report this composer's corner radius to the loader around it, if there is one. */
export function useReportComposerRadius(radius: number) {
  const report = useContext(ComposerLoaderRadiusContext);
  useEffect(() => {
    report?.(radius);
    return () => report?.(undefined);
  }, [report, radius]);
}
