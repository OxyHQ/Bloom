import { Stepper as BloomStepper, StepperRow as BloomStepperRow } from '@oxy.so/bloom/stepper';

import type { Binding } from '../binding';
import { Node, type Child, type ViewModifiers } from '../node';
import type { StepperSize, StepperStyle } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';

/** A − value + counter for small whole quantities, and the row that labels it (Bloom `stepper`). */
export type StepperKind = 'stepper' | 'stepperRow';

/** Wording of your own for its buttons (Bloom speaks them in the locale). */
export interface StepperLabels {
  readonly decrement?: string;
  readonly increment?: string;
  readonly remove?: string;
}

interface StepperModifiers<Self> {
  /** The lowest and highest counts (0 and none by default). */
  bounds(min: number, max?: number): Self;
  step(value: number): Self;
  disabled(value?: boolean): Self;
  /** `sm` or `md` (default). */
  size(value: StepperSize): Self;
  /** `separate` buttons (default) or one `outline`. */
  style(value: StepperStyle): Self;
  /** The count's text (`2 guests`). */
  valueFormat(value: (value: number) => string): Self;
  /** At the lowest count, − becomes a remove button that does this. */
  onRemove(value: () => void): Self;
  labels(value: StepperLabels): Self;
}
/** Bloom `Stepper`: the binding's count. */
export type StepperView = ViewModifiers<StepperView> & StepperModifiers<StepperView>;
/** Bloom `StepperRow`: a title, its description and the stepper. */
export interface StepperRowView
  extends ViewModifiers<StepperRowView>,
    StepperModifiers<StepperRowView> {
  /** The line under the title (`Ages 13 or above`). */
  supporting(value: string | Child): StepperRowView;
  /** A hairline under the row. */
  dividers(value?: boolean): StepperRowView;
}

/** Bloom `Stepper`: the binding's count. */
export function Stepper(value: Binding<number>): StepperView {
  return new Node('stepper', { value }, []);
}
/** Bloom `StepperRow`: `title` (a string in the row's type, or a view) beside the binding's count. */
export function StepperRow(value: Binding<number>, title: string | Child): StepperRowView {
  return new Node('stepperRow', { value, title }, []);
}

const text = (d: ControlDraw, value: string | Child | undefined) =>
  typeof value === 'string' || value === undefined ? value : d.render(value);

function stepperProps(d: ControlDraw): Record<string, unknown> {
  const [value, onValueChange] = (d.node.props as { value: Binding<number> }).value;
  const bounds = d.own('bounds')?.value;
  const labels = d.own('labels')?.value as StepperLabels | undefined;
  const props = d.props();
  Object.assign(props, {
    value,
    onValueChange,
    min: bounds?.[0] ?? undefined,
    max: bounds?.[1] ?? undefined,
    step: d.own('step')?.value,
    disabled: d.own('disabled')?.value,
    size: d.own('size')?.value,
    appearance: d.own('style')?.value,
    formatValue: d.own('valueFormat')?.value,
    onRemove: d.own('onRemove')?.value,
    decrementLabel: labels?.decrement,
    incrementLabel: labels?.increment,
    removeLabel: labels?.remove,
  });
  return props;
}

export const STEPPERS: Record<StepperKind, ControlRenderer> = {
  stepper: (d) => d.component(BloomStepper, stepperProps(d)),
  stepperRow: (d) => {
    const props = stepperProps(d);
    props.title = text(d, (d.node.props as { title: string | Child }).title);
    props.description = text(d, d.own('supporting')?.value);
    props.divider = d.own('dividers')?.value;
    return d.component(BloomStepperRow, props);
  },
};
