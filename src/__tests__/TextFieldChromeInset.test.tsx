/** The chrome box is independent of field layout and interactive descendants. */
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TextField, TextFieldInput } from '../text-field';
import { FieldBox } from '../text-field/FieldBox';
import { resolvedStyle } from './support/rendered-style';

it('insets material, resting border and focus ring together without shrinking the field', () => {
  const { UNSAFE_getAllByType, getByTestId, getByLabelText } = render(
    <BloomThemeProvider mode="light">
      <TextField style={{ height: 44 }} chromeInset={4}>
        <TextFieldInput label="Find" />
      </TextField>
    </BloomThemeProvider>,
  );
  const paint = resolvedStyle(getByTestId('text-field-paint').props.style);
  for (const edge of ['top', 'right', 'bottom', 'left']) expect(paint[edge]).toBe(4);
  const border = resolvedStyle(getByTestId('text-field-rest-border').props.style);
  for (const edge of ['top', 'right', 'bottom', 'left']) expect(border[edge]).toBe(4);
  const boxes = UNSAFE_getAllByType(FieldBox);
  expect(resolvedStyle(boxes[0]?.props.style).height).toBe(44);
  const ring = boxes.find((box) => resolvedStyle(box.props.baseStyle).borderWidth === 2);
  expect(ring).toBeDefined();
  for (const edge of ['top', 'right', 'bottom', 'left'])
    expect(resolvedStyle(ring!.props.baseStyle)[edge]).toBe(4);
  expect(getByLabelText('Find')).toBeTruthy();
});
