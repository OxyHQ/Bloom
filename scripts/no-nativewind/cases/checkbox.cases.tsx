import { Checkbox, CheckboxCard } from '@bloom/checkbox';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Checkbox states': () => (
    <>
      <Checkbox checked={false} onCheckedChange={() => {}} label="Off" />
      <Checkbox checked onCheckedChange={() => {}} label="On" />
      <Checkbox checked={false} indeterminate onCheckedChange={() => {}} label="Mixed" disabled />
    </>
  ),
  CheckboxCard: () => (
    <CheckboxCard checked onCheckedChange={() => {}} label="Card" description="Details" />
  ),
};
