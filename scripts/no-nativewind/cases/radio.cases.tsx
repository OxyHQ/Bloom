import { RadioCard, RadioChip, RadioGroup } from '@bloom/radio';
import type { Cases } from '../support/cases';

const OPTIONS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B', disabled: true },
];

export const CASES: Cases = {
  'RadioGroup default': () => (
    <RadioGroup label="Pick" value="a" onValueChange={() => {}} options={OPTIONS} />
  ),
  'RadioGroup chip, styled': () => (
    <RadioGroup
      label="Pick"
      variant="chip"
      value="a"
      onValueChange={() => {}}
      options={OPTIONS}
      optionStyle={{ borderRadius: 12 }}
      labelStyle={{ fontSize: 18 }}
      style={{ gap: 4 }}
    />
  ),
  'RadioGroup card and swatch': () => (
    <>
      <RadioGroup
        label="Plan"
        variant="card"
        value="a"
        onValueChange={() => {}}
        options={OPTIONS}
      />
      <RadioGroup
        label="Colour"
        variant="swatch"
        value="a"
        onValueChange={() => {}}
        options={[
          { value: 'a', label: 'Red', color: '#f00' },
          { value: 'b', label: 'Blue', color: '#00f' },
        ]}
      />
    </>
  ),
  'RadioCard and RadioChip alone': () => (
    <>
      <RadioCard value="x" title="Card" description="More" checked />
      <RadioChip value="y" label="Chip" appearance="solid" size="sm" />
    </>
  ),
};
