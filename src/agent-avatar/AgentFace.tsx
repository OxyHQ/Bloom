import React from 'react';
import { DrawingContext } from './drawing';
import { Drawing } from './SvgDrawing';
import { drawFace, expressionRig } from './face';
import type { AvatarConfig } from './model';

/** Face-only artwork used by the emotion selector. */
export function AgentFace({ config, size = 34 }: { config: AvatarConfig; size?: number }) {
  const context = new DrawingContext();
  context.translate(100, 100);
  // The original emotion chip scales 200px artwork by .36 within its 34px slot.
  context.scale(.36 * 200 / size, .36 * 200 / size);
  drawFace(context, config, 0, expressionRig(config), [0, 0], size);
  return <Drawing context={context} size={size} />;
}
