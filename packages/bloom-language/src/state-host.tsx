import {
  createElement,
  useState,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { Conditioned, IDLE, type Interaction, InteractionContext, Painted } from './paint';
import type { StyleOut } from './style';
import type { LiveCondition } from './variants';

/**
 * The outermost box of a view whose variants answer its state (`hovered`,
 * `focused`, `pressed`).
 *
 * - Web: the box carries the anchor class (`blsg`) the variant sheet's state
 *   selectors start from, so a state is the CSS of the view's own box, with no
 *   JavaScript: `.blsg:hover .x-hovered`.
 * - Native: the box tracks its press, hover and focus and hands them to the
 *   leaves of the view through `InteractionContext`. A change re-renders this
 *   box and the leaves that vary with it, never a view body.
 */
interface StateHostProps {
  host: ComponentType<Record<string, unknown>> | string;
  out: StyleOut;
  /** The states the view's variants answer, when its box is pressable (a plain view has none to track). */
  states: readonly LiveCondition[];
  children?: ReactNode;
  [prop: string]: unknown;
}

const ANCHOR = Object.freeze({ $$css: true, blStateAnchor: 'blsg' });

function WebStateHost({ host, out, states: _, ...props }: StateHostProps): ReactElement {
  const style = out.style === undefined ? ANCHOR : [out.style, ANCHOR].flat();
  return createElement(host, { ...props, style });
}

type Handler = ((event: unknown) => void) | undefined;

function NativeStateHost({ host, out, states, ...props }: StateHostProps): ReactElement {
  const [state, setState] = useState<Interaction>(IDLE);
  const set = (key: keyof Interaction, on: boolean) =>
    setState((current) => (current[key] === on ? current : { ...current, [key]: on }));
  const chain = (name: string, key: keyof Interaction, on: boolean) => (event: unknown) => {
    set(key, on);
    (props[name] as Handler)?.(event);
  };
  // Only the states a variant answers are tracked, so a box gains no handler it does not need.
  const handlers: Record<string, (event: unknown) => void> = {};
  if (states.includes('pressed')) {
    handlers.onPressIn = chain('onPressIn', 'pressed', true);
    handlers.onPressOut = chain('onPressOut', 'pressed', false);
  }
  if (states.includes('hovered')) {
    handlers.onHoverIn = chain('onHoverIn', 'hovered', true);
    handlers.onHoverOut = chain('onHoverOut', 'hovered', false);
  }
  if (states.includes('focused')) {
    handlers.onFocus = chain('onFocus', 'focused', true);
    handlers.onBlur = chain('onBlur', 'focused', false);
  }
  const box =
    out.paint === undefined
      ? createElement(host, { ...props, ...handlers, style: out.style })
      : createElement(out.paint.variants ? Conditioned : Painted, {
          ...props,
          ...handlers,
          host,
          paint: out.paint,
        });
  return createElement(InteractionContext.Provider, { value: state }, box);
}

export const StateHost = Platform.OS === 'web' ? WebStateHost : NativeStateHost;
