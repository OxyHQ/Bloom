import { Stepper } from '@bloom/stepper';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Stepper plain': () => <Stepper value={2} onValueChange={() => {}} />,
  'Stepper bounded, small': () => (
    <Stepper value={0} min={0} max={5} step={1} size="sm" onValueChange={() => {}} />
  ),
  'Stepper disabled': () => <Stepper value={3} disabled onValueChange={() => {}} />,
  'Stepper outline': () => <Stepper value={1} appearance="outline" onValueChange={() => {}} />,
};
