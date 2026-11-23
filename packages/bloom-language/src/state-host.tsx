import {
  createContext,
  createElement,
  useContext,
  useState,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { IDLE, type Interaction, InteractionContext, leafOf } from './paint';
import type { StyleOut } from './style';
import type { LiveCondition } from './variants';

/**
 * The outermost box of a view whose variants answer its state (`hovered`,
 * `focused`, `pressed`).
 *
 * - Web: the box carries the anchor class (`blsg`) the variant sheet's state
 *   selectors start from, so a state is the CSS of the view's own box, with no
 *   JavaScript. A class answers its nearest anchor's state (the spec's
 *   `variants.selectors`), so a view inside another answers its own.
 * - Native, and a Bloom component's box on the web (it reads its style as an
 *   object, which CSS cannot vary): the box tracks its press, hover and focus
 *   and hands them to the leaves of the view through `InteractionContext`. A
 *   change re-renders this box and the leaves that vary with it, never a view
 *   body.
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

/** A style with the anchor class after it. */
function anchored(style: unknown): unknown {
  return style === undefined ? ANCHOR : [style, ANCHOR].flat();
}

function WebStateHost(props: StateHostProps): ReactElement {
  // A Bloom component reads its style as an object: no anchor class, its state
  // read in JS. A language host around one tracks in JS and is the anchor too.
  if (props.out.object) return createElement(TrackedStateHost, props);
  const { host, out, states: _, style: motion, ...rest } = props;
  const style = anchored(out.style);
  // A moving box's motion style (`Outer`) comes after its own.
  return createElement(host, {
    ...rest,
    style: motion === undefined ? style : [style, motion].flat(),
  });
}

type Handler = ((event: unknown) => void) | undefined;

/**
 * Whether a focus is one a variant answers: on the web the browser's
 * `:focus-visible` (a keyboard's focus, not a click's), as a view's `focused`
 * selector is; on native every focus (a keyboard's, a remote's).
 */
function focusVisible(event: unknown): boolean {
  if (Platform.OS !== 'web') return true;
  const { currentTarget, target } = (event ?? {}) as { currentTarget?: unknown; target?: unknown };
  const node = (currentTarget ?? target) as { matches?: (selector: string) => boolean } | undefined;
  return typeof node?.matches !== 'function' || node.matches(':focus-visible');
}

function TrackedStateHost({ host, out, states, ...props }: StateHostProps): ReactElement {
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
    handlers.onFocus = (event: unknown) => {
      set('focused', focusVisible(event));
      (props.onFocus as Handler)?.(event);
    };
    handlers.onBlur = chain('onBlur', 'focused', false);
  }
  const style = Platform.OS === 'web' && out.anchor ? anchored(out.style) : out.style;
  // A moving box's motion style (`Outer`, `props.style`) comes after its own
  // classes (the anchor, a press host's); a painted box's leaf merges them
  // after what it paints.
  const motion = props.style as readonly unknown[] | undefined;
  const own = motion === undefined ? style : style === undefined ? motion : [style, ...motion];
  const box =
    out.paint === undefined
      ? createElement(host, { ...props, ...handlers, style: own })
      : createElement(leafOf(out.paint), {
          ...props,
          ...handlers,
          style: own,
          host,
          paint: out.paint,
        });
  return createElement(InteractionContext.Provider, { value: state }, box);
}

export const StateHost = Platform.OS === 'web' ? WebStateHost : TrackedStateHost;

type Report = (key: keyof Interaction, on: boolean) => void;

/** Where a control on glass reports its state: the box around its glass (`ReportedState`). */
const ReportContext = createContext<Report | null>(null);

/**
 * The box around a Button's or FAB's glass when the glass's variants answer a
 * state: the control inside it takes the press, hover and focus (`Reporting`)
 * and reports them here, so the glass's own leaf (a `Conditioned` Surface or
 * platform glass) varies with the control's state. It draws nothing itself.
 */
export function ReportedState({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<Interaction>(IDLE);
  const report: Report = (key, on) =>
    setState((current) => (current[key] === on ? current : { ...current, [key]: on }));
  return createElement(
    ReportContext.Provider,
    { value: report },
    createElement(InteractionContext.Provider, { value: state }, children),
  );
}

/** A control on glass: `host` with its own handlers, each state the glass answers (`reports`) also reported to the glass around it. */
export function Reporting({
  host,
  reports: states,
  ...props
}: {
  host: ComponentType<Record<string, unknown>>;
  reports: readonly LiveCondition[];
  [prop: string]: unknown;
}): ReactElement {
  const report = useContext(ReportContext);
  if (report === null) return createElement(host, props);
  const chain = (name: string, key: keyof Interaction, on: boolean) => (event: unknown) => {
    report(key, on);
    (props[name] as Handler)?.(event);
  };
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
    handlers.onFocus = (event: unknown) => {
      report('focused', focusVisible(event));
      (props.onFocus as Handler)?.(event);
    };
    handlers.onBlur = chain('onBlur', 'focused', false);
  }
  return createElement(host, { ...props, ...handlers });
}
