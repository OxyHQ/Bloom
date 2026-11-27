import type { JobForm } from './jobForm';
import type { useRowHeader } from '../rows/header.bloom';

// A component whose props name the hook's result through `ReturnType`.
export function JobFormFields(props: { form: JobForm }) {
  void props;
  return null;
}

// A `.bloom` hook's result, named from TS (through the declarations bloomc writes).
export type RowHeader = ReturnType<typeof useRowHeader>;
