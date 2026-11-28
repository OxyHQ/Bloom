// An interface two `extends` up (Bloom's `DatePickerProps extends PickerBaseProps extends
// CalendarConstraintProps`): its fields are the whole chain's.
export interface ConstraintProps {
  minDate?: Date | null;
}
interface BaseProps extends ConstraintProps {
  disabled?: boolean;
}
export interface PickerProps extends BaseProps {
  value?: Date | null;
}
export declare function makePicker(props: PickerProps): string;
