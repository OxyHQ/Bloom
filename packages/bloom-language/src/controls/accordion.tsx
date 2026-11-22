import type { BloomSize } from '@oxy.so/bloom/appearance';
import {
  Accordion as BloomAccordion,
  AccordionContent as BloomAccordionContent,
  AccordionItem as BloomAccordionItem,
  AccordionTrigger as BloomAccordionTrigger,
  type AccordionTransition,
} from '@oxy.so/bloom/accordion';

import type { Binding } from '../binding';
import { Node, type Child, type ViewModifiers } from '../node';
import type { ControlDraw, ControlRenderer } from './draw';

/** Collapsible sections, fully controlled (Bloom `accordion`). */
export type AccordionKind = 'accordion' | 'accordionItem' | 'accordionTrigger' | 'accordionContent';

/** What is open: an item's value (one at a time), the values (several), or none. */
export type AccordionSelection = string | string[] | undefined;

/** Bloom `Accordion`: its items, the open ones the binding's. */
export interface AccordionView extends ViewModifiers<AccordionView> {
  size(value: BloomSize): AccordionView;
  /** Several items open at once (one at a time by default). */
  allowsMultiple(): AccordionView;
  /** How a section opens: Bloom's `spring`, or a duration and curve. */
  revealMotion(value: AccordionTransition): AccordionView;
}
/** Bloom `AccordionItem`: a trigger and its content. */
export interface AccordionItemView extends ViewModifiers<AccordionItemView> {
  disabled(value?: boolean): AccordionItemView;
}
/** Bloom `AccordionTrigger`: the row that opens its item. */
export interface AccordionTriggerView extends ViewModifiers<AccordionTriggerView> {
  /** A glyph of its own in place of the chevron. */
  indicator(value: Child): AccordionTriggerView;
}
/** Bloom `AccordionContent`: what its item reveals. */
export type AccordionContentView = ViewModifiers<AccordionContentView>;

/** Bloom `Accordion`: the binding holds what is open. */
export function Accordion(open: Binding<AccordionSelection>, ...items: Child[]): AccordionView {
  return new Node('accordion', { open }, items);
}
/** Bloom `AccordionItem`: `value` names it in the binding. */
export function AccordionItem(value: string, ...children: Child[]): AccordionItemView {
  return new Node('accordionItem', { value }, children);
}
/** Bloom `AccordionTrigger`: a title (a string in the trigger's type) or a view. */
export function AccordionTrigger(title: string | Child): AccordionTriggerView {
  return new Node('accordionTrigger', { title }, []);
}
/** Bloom `AccordionContent`: its views. */
export function AccordionContent(...children: Child[]): AccordionContentView {
  return new Node('accordionContent', null, children);
}

const children = (d: ControlDraw) => d.children(d.node.children);

export const ACCORDIONS: Record<AccordionKind, ControlRenderer> = {
  accordion: (d) => {
    const [value, onValueChange] = (d.node.props as { open: Binding<AccordionSelection> }).open;
    const props = d.props();
    Object.assign(props, {
      value,
      onValueChange,
      size: d.own('size')?.value,
      type: d.own('allowsMultiple') === undefined ? undefined : 'multiple',
      transition: d.own('revealMotion')?.value,
    });
    return d.component(BloomAccordion, props, ...children(d));
  },
  accordionItem: (d) => {
    const props = d.props();
    props.value = (d.node.props as { value: string }).value;
    props.disabled = d.own('disabled')?.value;
    return d.component(BloomAccordionItem, props, ...children(d));
  },
  accordionTrigger: (d) => {
    const { title } = d.node.props as { title: string | Child };
    const props = d.props();
    const indicator = d.own('indicator')?.value as Child | undefined;
    props.icon = indicator === undefined ? undefined : d.render(indicator);
    return d.component(
      BloomAccordionTrigger,
      props,
      typeof title === 'string' ? title : d.render(title),
    );
  },
  accordionContent: (d) => d.component(BloomAccordionContent, d.props(), ...children(d)),
};
