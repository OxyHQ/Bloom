/**
 * `Select`'s controlled `open` on native: set, the sheet presents while it is
 * true and a press on the trigger reports it; unset, nothing changes (every
 * other Select test).
 */
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select';

const FRUIT = [
  { value: 'apple', label: 'Apple' },
  { value: 'cherry', label: 'Cherry' },
];

function Fruit({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <BloomThemeProvider>
      <Select value="apple" onValueChange={() => {}} open={open} onOpenChange={onOpenChange}>
        <SelectTrigger label="Fruit" testID="fruit">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent
          label="Fruit"
          items={FRUIT}
          renderItem={(item) => (
            <SelectItem value={item.value} label={item.label}>
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </Select>
    </BloomThemeProvider>
  );
}

it('presents the sheet while `open` holds, and reports a press on the trigger', () => {
  const onOpenChange = jest.fn();
  const screen = render(<Fruit open={false} onOpenChange={onOpenChange} />);
  expect(screen.queryByText('Cherry')).toBeNull();
  fireEvent.press(screen.getByText('Apple'));
  expect(screen.queryByText('Cherry')).toBeNull();
  expect(onOpenChange).toHaveBeenCalledWith(true);
  act(() => {
    screen.rerender(<Fruit open onOpenChange={onOpenChange} />);
  });
  expect(screen.queryByText('Cherry')).not.toBeNull();
});
