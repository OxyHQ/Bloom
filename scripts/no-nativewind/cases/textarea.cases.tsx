import { Textarea } from '@bloom/textarea';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Textarea plain': () => <Textarea label="Notes" placeholder="Write" />,
  'Textarea loaded': () => (
    <Textarea
      label="Notes"
      hint="Markdown"
      value="Hello"
      showCount
      maxLength={100}
      size="sm"
      rows={4}
      autoResize
      maxRows={8}
      required
      style={{ maxWidth: 320 }}
      fieldStyle={{ paddingLeft: 12 }}
      inputStyle={{ minHeight: 22 }}
    />
  ),
  'Textarea invalid, disabled': () => (
    <>
      <Textarea label="A" invalid value="a" />
      <Textarea label="B" disabled value="b" />
    </>
  ),
};
