/** Source numeric animation timeline, with the same 480ms cubic easing. */
export function animateNumber(
  from: number,
  to: number,
  options: {
    duration: number;
    ease: (t: number) => number;
    onUpdate: (value: number) => void;
    onComplete: () => void;
  },
) {
  const start = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / (options.duration * 1000));
    options.onUpdate(from + (to - from) * options.ease(t));
    if (t < 1) frame = requestAnimationFrame(tick);
    else options.onComplete();
  };
  frame = requestAnimationFrame(tick);
  return { stop: () => cancelAnimationFrame(frame) };
}
