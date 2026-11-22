import {
  HoverCard as BloomHoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@oxy.so/bloom/hover-card';

import type { Binding } from '../binding';
import { Node, type Child, type ViewModifiers } from '../node';
import type { TooltipSide } from '../tokens';
import type { ControlRenderer } from './draw';

/** A preview card a resting pointer, focus or a long press opens on a view (Bloom `hover-card`). */
export type HoverCardKind = 'hoverCard';

/**
 * Bloom `HoverCard`: its trigger, and the card it opens. It opens itself (a
 * pointer resting or focus on the web, a long press on native); the screen
 * can own whether it is open. The trigger's box is the view's.
 */
export interface HoverCardView extends ViewModifiers<HoverCardView> {
  /** Whether the card shows, and what showing and hiding it set. */
  presented(value: Binding<boolean>): HoverCardView;
  /** How long the pointer rests before it opens, in ms (400 by default; the web's). */
  openDelay(value: number): HoverCardView;
  /** How long it stays after the pointer leaves, in ms (150 by default; the web's). */
  closeDelay(value: number): HoverCardView;
  /** The side of the trigger: `bottom` (default) or `top`. */
  side(value: TooltipSide): HoverCardView;
  /** How the card lines up with the trigger along that side. */
  align(value: 'start' | 'center' | 'end'): HoverCardView;
  /** `false`: the card draws no surface of its own (its content paints one). */
  padded(value: boolean): HoverCardView;
  /** Nothing opens it. */
  disabled(value?: boolean): HoverCardView;
}

/** Bloom `HoverCard` on `trigger`; `content` is the card (named with `.label()`). */
export function HoverCard(trigger: Child, content: Child): HoverCardView {
  return new Node('hoverCard', { trigger, content }, []);
}

export const HOVER_CARDS: Record<HoverCardKind, ControlRenderer> = {
  hoverCard: (d) => {
    const { trigger, content } = d.node.props as { trigger: Child; content: Child };
    const presented = d.own('presented')?.value;
    return (
      <BloomHoverCard
        key={d.key}
        open={presented?.[0]}
        onOpenChange={presented?.[1]}
        openDelay={d.own('openDelay')?.value}
        closeDelay={d.own('closeDelay')?.value}
      >
        {d.component(
          HoverCardTrigger,
          { disabled: d.own('disabled')?.value, testID: d.testID },
          d.render(trigger),
        )}
        <HoverCardContent
          label={d.label}
          side={d.own('side')?.value.side as TooltipSide | undefined}
          align={d.own('align')?.value as 'start' | 'center' | 'end' | undefined}
          padded={d.own('padded')?.value}
        >
          {d.render(content)}
        </HoverCardContent>
      </BloomHoverCard>
    );
  },
};
