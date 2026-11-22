import { RiSearchLine } from '@bloom/icons/remix/RiSearchLine';
import { TextField, TextFieldIcon, TextFieldInput, TextFieldSuffix } from '@bloom/text-field';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'TextField plain': () => (
    <TextField>
      <TextFieldInput label="Name" placeholder="Name" />
    </TextField>
  ),
  'TextField loaded': () => (
    <TextField size="sm" radius={999} chromeInset={2} style={{ width: 240 }}>
      <TextFieldIcon icon={RiSearchLine} />
      <TextFieldInput label="Find" value="query" />
      <TextFieldSuffix>kg</TextFieldSuffix>
    </TextField>
  ),
  'TextField invalid, disabled': () => (
    <>
      <TextField invalid>
        <TextFieldInput label="A" value="a" />
      </TextField>
      <TextField disabled>
        <TextFieldInput label="B" value="b" />
      </TextField>
    </>
  ),
};
