import { ColorSwatchPicker as BloomColorSwatchPicker } from '@oxy.so/bloom/color-swatch-picker';

import type { Binding } from '../binding';
import { Node, type ViewModifiers } from '../node';
import { resolveSpace, type SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';

/** A wrapping row of colour swatches, one chosen (Bloom `color-swatch-picker`). */
export type ColorSwatchPickerKind = 'colorSwatchPicker';

/** Bloom `ColorSwatchPicker`: the binding's colour, one of its swatches. */
export interface ColorSwatchPickerView extends ViewModifiers<ColorSwatchPickerView> {
  /** What a screen reader says of a swatch, by colour (`{ '#ef4444': 'Red' }`); its own string otherwise. */
  labels(value: Readonly<Record<string, string>>): ColorSwatchPickerView;
  /** A swatch's diameter: `4xl` (40) by default. */
  size(value: SpaceToken): ColorSwatchPickerView;
  disabled(value?: boolean): ColorSwatchPickerView;
}

/**
 * Bloom `ColorSwatchPicker`: `label` names the whole, the binding holds the
 * chosen colour, `colors` are the swatches (CSS colours, each its own value).
 */
export function ColorSwatchPicker(
  label: string,
  color: Binding<string>,
  colors: readonly string[],
): ColorSwatchPickerView {
  return new Node('colorSwatchPicker', { label, color, colors }, []);
}

export const COLOR_SWATCH_PICKERS: Record<ColorSwatchPickerKind, ControlRenderer> = {
  colorSwatchPicker: (d) => {
    const { label, color, colors } = d.node.props as {
      label: string;
      color: Binding<string>;
      colors: readonly string[];
    };
    const size = d.own('size')?.value as SpaceToken | undefined;
    const props = d.props();
    Object.assign(props, {
      label,
      value: color[0],
      onValueChange: color[1],
      colors,
      names: d.own('labels')?.value,
      size: size === undefined ? undefined : resolveSpace(size),
      disabled: d.own('disabled')?.value,
    });
    return d.component(BloomColorSwatchPicker, props);
  },
};
