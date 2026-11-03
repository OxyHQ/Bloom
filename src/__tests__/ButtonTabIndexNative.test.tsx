/**
 * A native `Button`'s `tabIndex` is React Native's own: -1 leaves it out of the
 * keyboard's Tab order (the host view's `focusable`, which a native host's
 * keyboard focus reads), while a press and an assistive technology's
 * activation still reach it — a list's column header, as a Mac's table header
 * is not in the key view loop.
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

it('leaves the Tab order with tabIndex -1 and is still pressed and named', () => {
  const onPress = jest.fn();
  const screen = render(
    <BloomThemeProvider>
      <Button testID="header" tabIndex={-1} accessibilityLabel="Name, ascending" onPress={onPress}>
        Name
      </Button>
      <Button testID="plain" onPress={onPress}>
        Plain
      </Button>
    </BloomThemeProvider>,
  );
  const header = hostOf(screen, 'header');
  // React Native's View turns it into `focusable={false}` (View.js: `focusable = !tabIndex`).
  expect(header.props.tabIndex).toBe(-1);
  expect(header.props.accessibilityLabel).toBe('Name, ascending');
  expect(header.props.accessibilityRole).toBe('button');
  expect(hostOf(screen, 'plain').props.tabIndex).toBeUndefined();
  fireEvent.press(header);
  expect(onPress).toHaveBeenCalledTimes(1);
});
