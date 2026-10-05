import { DrawingContext } from './drawing';
import { drawFace, expressionRig } from './face';
import type { AvatarConfig } from './model';
import { Drawing } from './SvgDrawing';

/** Face-only artwork used by the emotion selector. */
export function AgentFace({
  config,
  size = 34,
}: {
  config: AvatarConfig;
  size?: number;
}) {
  const context = new DrawingContext();
  context.translate(100, 100 + (2 * 200) / size);
  // The original emotion chip scales 200px artwork by .36 within its 34px slot.
  context.scale((0.36 * 200) / size, (0.36 * 200) / size);
  drawFace(context, config, 0, expressionRig(config), [0, 0], 200);
  return <Drawing context={context} size={size} />;
}
