import { InputOtp as BloomInputOtp } from '@oxy.so/bloom/input-otp';

import type { Binding } from '../binding';
import { Node, type ViewModifiers } from '../node';
import type { OtpCharacters } from '../tokens';
import type { ControlRenderer } from './draw';

/** A one-time code, one box per character (Bloom `input-otp`). */
export type InputOtpKind = 'inputOtp';

/** Bloom `InputOtp`: the binding's code, one box per character. */
export interface InputOtpView extends ViewModifiers<InputOtpView> {
  /** How many boxes: 6 by default. */
  length(value: number): InputOtpView;
  /** What a box takes: `numeric` (default, digits) or `alphanumeric` (upper-cased letters and digits). */
  characters(value: OtpCharacters): InputOtpView;
  /** The last box was filled, with the code. */
  onComplete(value: (code: string) => void): InputOtpView;
  invalid(value?: boolean): InputOtpView;
  disabled(value?: boolean): InputOtpView;
  /** A gap after every `n` boxes (`3` draws 000 000). */
  groupSize(value: number): InputOtpView;
  /** Takes the focus as it appears. */
  autoFocus(): InputOtpView;
}

/** Bloom `InputOtp`: the binding holds the code, cleaned of what its boxes do not take. */
export function InputOtp(code: Binding<string>): InputOtpView {
  return new Node('inputOtp', { code }, []);
}

export const INPUT_OTPS: Record<InputOtpKind, ControlRenderer> = {
  inputOtp: (d) => {
    const [value, onChange] = (d.node.props as { code: Binding<string> }).code;
    const props = d.props();
    Object.assign(props, {
      value,
      onChange,
      length: d.own('length')?.value,
      type: d.own('characters')?.value,
      onComplete: d.own('onComplete')?.value,
      invalid: d.own('invalid')?.value,
      disabled: d.own('disabled')?.value,
      groupEvery: d.own('groupSize')?.value,
      autoFocus: d.own('autoFocus') === undefined ? undefined : true,
    });
    return d.component(BloomInputOtp, props);
  },
};
