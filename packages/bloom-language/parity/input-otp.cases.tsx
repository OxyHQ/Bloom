import { InputOtp } from '@oxy.so/bloom/input-otp';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};

export const INPUT_OTP_CASES: readonly ParityCase[] = [
  {
    name: 'an empty code',
    language: () => toElement(L.InputOtp(['', set])),
    bloom: () => <InputOtp value="" onChange={set} />,
  },
  {
    name: 'a code half typed, four boxes',
    language: () => toElement(L.InputOtp(['12', set]).length(4)),
    bloom: () => <InputOtp value="12" onChange={set} length={4} />,
  },
  ...ENUMS.otpCharacters.map((characters) => ({
    name: `${characters} characters`,
    language: () => toElement(L.InputOtp(['A1B2', set]).characters(characters)),
    bloom: () => <InputOtp value="A1B2" onChange={set} type={characters} />,
  })),
  {
    name: 'grouped in threes, named, completing',
    language: () =>
      toElement(
        L.InputOtp(['123456', set])
          .groupSize(3)
          .onComplete(set)
          .label('Verification code')
          .testID('code'),
      ),
    bloom: () => (
      <InputOtp
        value="123456"
        onChange={set}
        groupEvery={3}
        onComplete={set}
        accessibilityLabel="Verification code"
        testID="code"
      />
    ),
  },
  {
    name: 'an invalid code',
    language: () => toElement(L.InputOtp(['999', set]).invalid()),
    bloom: () => <InputOtp value="999" onChange={set} invalid />,
  },
  {
    name: 'a disabled code',
    language: () => toElement(L.InputOtp(['', set]).disabled()),
    bloom: () => <InputOtp value="" onChange={set} disabled />,
  },
  {
    name: 'a code with a box of its own',
    language: () => toElement(L.InputOtp(['', set]).padding('md').frame({ width: '320' })),
    bloom: () => (
      <InputOtp
        value=""
        onChange={set}
        style={{ paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12, width: 320 }}
      />
    ),
  },
];

/**
 * A code that takes the focus as it appears: a page has one focus, so two side
 * by side (the story's pairs) cannot both draw it. Compared by the Jest suites,
 * where nothing takes focus, and left out of the story.
 */
export const INPUT_OTP_CASES_FOCUSED: readonly ParityCase[] = [
  {
    name: 'a code focused as it appears',
    language: () => toElement(L.InputOtp(['', set]).autoFocus()),
    bloom: () => <InputOtp value="" onChange={set} autoFocus />,
  },
];
