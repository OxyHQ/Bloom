import { View } from 'react-native';
import { ChoiceList } from '../choice-list';
import { useColorTokens } from '../theme/color-tokens';
import type { ColorSwatchPickerProps } from './types';

/**
 * `ColorSwatchPicker`: a wrapping row of colour swatches, one chosen. It is a
 * `ChoiceList`, so it is one keyboard stop (the chosen swatch), the arrows move
 * between swatches and Space or Return chooses, and a screen reader says each
 * swatch by its name with its place in the row.
 *
 * The chosen swatch is ringed in the text colour with a gap between ring and
 * colour, so it reads on any swatch, in either mode, without a check glyph
 * whose own colour would have to contrast with every swatch.
 */
export function ColorSwatchPicker({
  label,
  value,
  onValueChange,
  colors,
  names,
  size = 40,
  disabled,
  style,
  testID,
}: ColorSwatchPickerProps) {
  const tokens = useColorTokens();
  const ring = 2;
  const gap = 3;
  const outer = size + 2 * (ring + gap);
  return (
    <ChoiceList
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={colors.map((color) => ({ value: color, label: names?.[color] ?? color }))}
      renderContent={(option, { selected }) => (
        <View
          style={{
            width: outer,
            height: outer,
            borderRadius: outer / 2,
            borderWidth: ring,
            borderColor: selected ? tokens.foreground : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: option.value,
              borderWidth: 1,
              borderColor: tokens.border,
            }}
          />
        </View>
      )}
      disabled={disabled}
      style={[{ flexWrap: 'wrap', gap: 0 }, style]}
      testID={testID}
    />
  );
}
