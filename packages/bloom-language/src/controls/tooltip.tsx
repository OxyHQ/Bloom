import {
  Tooltip as BloomTooltip,
  TooltipContent as BloomTooltipContent,
  TooltipTrigger as BloomTooltipTrigger,
} from '@oxy.so/bloom/tooltip';

import type { Binding } from '../binding';
import { Node, type Child, type ViewModifiers } from '../node';
import type { TooltipSide, TooltipSize } from '../tokens';
import type { ControlRenderer } from './draw';

/** A hint about an already-labelled control, controlled (Bloom `tooltip`). */
export type TooltipKind = 'tooltip';

/**
 * Bloom `Tooltip`: its trigger and its bubble. What opens it differs by
 * platform (a pointer resting, a long press), so it is controlled. The trigger
 * carries its own box.
 */
export interface TooltipView extends ViewModifiers<TooltipView> {
  /** Whether the bubble shows, and what showing and hiding it set. */
  presented(value: Binding<boolean>): TooltipView;
  /** The side of its trigger: `bottom` (default) or `top`. */
  side(value: TooltipSide): TooltipView;
  /** How long the pointer rests before it shows, in ms (a desktop's own wait by default). */
  openDelay(value: number): TooltipView;
  /** `sm` or `md`; the nearest Bloom scope's by default. */
  size(value: TooltipSize): TooltipView;
}

/**
 * Bloom `Tooltip` around `trigger`; `content` is its bubble (a string, also
 * its accessible text, or a view named with `.label()`).
 */
export function Tooltip(trigger: Child, content: string | Child): TooltipView {
  return new Node('tooltip', { trigger, content }, []);
}

const NOOP = () => {};

export const TOOLTIPS: Record<TooltipKind, ControlRenderer> = {
  tooltip: (d) => {
    const { trigger, content } = d.node.props as { trigger: Child; content: string | Child };
    const presented = d.own('presented')?.value ?? [false, NOOP];
    const text = typeof content === 'string';
    return (
      <BloomTooltip
        key={d.props().key as string | undefined}
        visible={presented[0]}
        onVisibleChange={presented[1]}
        position={d.own('side')?.value.side as TooltipSide | undefined}
        delay={d.own('openDelay')?.value}
      >
        <BloomTooltipTrigger>{d.render(trigger)}</BloomTooltipTrigger>
        <BloomTooltipContent
          label={text ? content : (d.label ?? '')}
          size={d.own('size')?.value as TooltipSize | undefined}
        >
          {text ? content : d.render(content)}
        </BloomTooltipContent>
      </BloomTooltip>
    );
  },
};
