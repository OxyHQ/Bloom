import { StepperRow } from '@bloom/stepper';
import { WizardFooter, WizardProgress } from '@bloom/wizard';
import type { Cases } from '../support/cases';

const steps = [
  { title: 'Place', description: 'Where guests stay' },
  { title: 'Photos', description: 'Add at least five photos' },
  { title: 'Price' },
];

export const CASES: Cases = {
  'WizardProgress current with description': () => <WizardProgress steps={steps} current={1} />,
  'WizardProgress last': () => <WizardProgress steps={steps} current={2} />,
  'WizardFooter back, next and status': () => (
    <WizardFooter onBack={() => {}} onNext={() => {}} status="Saved" />
  ),
  'WizardFooter next only': () => <WizardFooter onNext={() => {}} />,
  'StepperRow with description and divider': () => (
    <StepperRow
      title="Adults"
      description="Ages 13 or above"
      divider
      value={2}
      onValueChange={() => {}}
    />
  ),
};
