/**
 * A native `Button` that is a list's column header (`accessibilityRole="columnheader"`)
 * is announced as one: React Native's ARIA `role`, which it takes over
 * `accessibilityRole`, so a screen reader says "Name, ascending, column header",
 * not a button, while a press and an assistive technology's activation still sort.
 */
import { fireEvent, render } from '@testing-library/react-native';
import { Button } from '../button/Button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function hostOf(screen: ReturnType<typeof render>, id: string) {
  const all = screen.getAllByTestId(id);
  const found = all.find((node) => typeof node.type === 'string') ?? all[0];
  if (!found) throw new Error(`no view ${id}`);
  return found;
}

it('is a column header, still pressed', () => {
  const onPress = jest.fn();
  const screen = render(
    <BloomThemeProvider>
      <Button
        testID="header"
        tabIndex={-1}
        accessibilityRole="columnheader"
        accessibilityLabel="Name, ascending"
        onPress={onPress}
      >
        Name
      </Button>
      <Button testID="plain" onPress={onPress}>
        Plain
      </Button>
    </BloomThemeProvider>,
  );
  const header = hostOf(screen, 'header');
  expect(header.props.role).toBe('columnheader');
  expect(header.props.accessibilityRole).toBeUndefined();
  expect(hostOf(screen, 'plain').props.accessibilityRole).toBe('button');
  expect(hostOf(screen, 'plain').props.role).toBeUndefined();
  fireEvent.press(header);
  expect(onPress).toHaveBeenCalledTimes(1);
});
