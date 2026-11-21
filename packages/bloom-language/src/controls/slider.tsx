import type { BloomSize, BloomTone } from '@oxy.so/bloom/appearance';
import { RangeSlider as BloomRangeSlider, Slider as BloomSlider } from '@oxy.so/bloom/slider';

import type { Binding } from '../binding';
import { Node, type ViewModifiers } from '../node';
import { resolveSpace, type ColorToken, type SpaceToken } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';

/** A value on a continuum, or a range of one (Bloom `slider`). */
export type SliderKind = 'slider' | 'rangeSlider';

interface SliderModifiers<Self> {
  size(value: BloomSize): Self;
  tint(value: BloomTone): Self;
  /** The lowest and highest values (0 and 1 by default). */
  bounds(min: number, max?: number): Self;
  /** The values it snaps to, from `min`. */
  step(value: number): Self;
  /** How far an arrow key moves it (the step by default). */
  keyboardStep(value: number): Self;
  disabled(value?: boolean): Self;
  /** The track's height. */
  thickness(value: SpaceToken): Self;
  thumbSize(value: SpaceToken): Self;
  /** The filled part of the track. */
  fillTint(value: ColorToken): Self;
  /** The rest of the track. */
  trackTint(value: ColorToken): Self;
  thumbTint(value: ColorToken): Self;
  /** The value's bubble over the thumb (shown by default; it takes 32 above the track). */
  showsValue(value: boolean): Self;
}
/** Bloom `Slider`: the binding's value, changed as it slides. */
export interface SliderView extends ViewModifiers<SliderView>, SliderModifiers<SliderView> {
  /** Called once, where the thumb comes to rest. */
  onCommit(value: (value: number) => void): SliderView;
  /** The value's text in its bubble. */
  valueFormat(value: (value: number) => string): SliderView;
}
/** Bloom `RangeSlider`: two thumbs, the binding's lower and upper values. */
export interface RangeSliderView
  extends ViewModifiers<RangeSliderView>,
    SliderModifiers<RangeSliderView> {
  onCommit(value: (value: [number, number]) => void): RangeSliderView;
  /** Each thumb's bubble text (`index` 0 the lower, 1 the upper). */
  valueFormat(value: (value: number, index: number) => string): RangeSliderView;
  /** Each thumb's name (`Minimum`, `Maximum` by default, in the locale). */
  labels(value: { readonly lower: string; readonly upper: string }): RangeSliderView;
}

/** Bloom `Slider`: the binding's value; `title` is its visible label (and name). */
export function Slider(value: Binding<number>, title?: string): SliderView {
  return new Node('slider', { value, title }, []);
}
/** Bloom `RangeSlider`: the binding's `[lower, upper]`; `title` is its visible label. */
export function RangeSlider(value: Binding<[number, number]>, title?: string): RangeSliderView {
  return new Node('rangeSlider', { value, title }, []);
}

const space = (token: SpaceToken | undefined) =>
  token === undefined ? undefined : resolveSpace(token);

function sliderProps(d: ControlDraw): Record<string, unknown> {
  const { value, title } = d.node.props as { value: Binding<unknown>; title: string | undefined };
  const props = d.props();
  const bounds = d.own('bounds')?.value;
  Object.assign(props, {
    value: value[0],
    onValueChange: value[1],
    label: title,
    size: d.own('size')?.value,
    tone: d.own('tint')?.value,
    min: bounds?.[0] ?? undefined,
    max: bounds?.[1] ?? undefined,
    step: d.own('step')?.value,
    keyboardStep: d.own('keyboardStep')?.value,
    disabled: d.own('disabled')?.value,
    trackHeight: space(d.own('thickness')?.value),
    thumbSize: space(d.own('thumbSize')?.value),
    showTooltip: d.own('showsValue')?.value,
    onSlidingComplete: d.own('onCommit')?.value,
    formatValue: d.own('valueFormat')?.value,
  });
  return props;
}

function draw(host: unknown) {
  return (d: ControlDraw) => {
    const props = sliderProps(d);
    if (host === BloomRangeSlider) {
      const labels = d.own('labels')?.value as { lower: string; upper: string } | undefined;
      props.thumbLabels = labels === undefined ? undefined : [labels.lower, labels.upper];
    }
    return d.painted(host, props, {
      minimumTrackTintColor: d.own('fillTint')?.value,
      maximumTrackTintColor: d.own('trackTint')?.value,
      thumbTintColor: d.own('thumbTint')?.value,
    });
  };
}

export const SLIDERS: Record<SliderKind, ControlRenderer> = {
  slider: draw(BloomSlider),
  rangeSlider: draw(BloomRangeSlider),
};
