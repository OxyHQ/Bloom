/**
 * An app's OWN icon set reaches a Bloom icon slot, and follows the state.
 *
 * Bloom tints a glyph by passing `fill`, so an icon component that paints from
 * a `color` prop — which is what most app icon sets look like — cannot be
 * handed to `leadingIcon`: the two prop sets have NOTHING in common, so it does
 * not typecheck, and were it cast it would render at its own default size in
 * its own default colour with nothing thrown. `frosted-icon-button/shared.ts`
 * and `tab-bar/types.ts` both record that hazard.
 *
 * `renderLeadingIcon` is the way through, and it is a SEPARATE prop on purpose.
 * The adapter component a caller writes today —
 * `({ width, fill }) => <Glyph size={width} color={fill} />` — is a function,
 * and so is a paint callback. One prop accepting both could not tell them
 * apart, and would break exactly the callers who already did the right thing.
 * The test below pins that adapter as still working, which is the half a
 * widened union would have silently changed.
 */

import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { Button } from '../button';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { BloomThemeProvider } from '../theme';

/** An app icon: `size`/`color`, the spelling Bloom's slot cannot name. */
function AppGlyph({ size, color }: { size?: number; color?: string }) {
  return <View testID="app-glyph" accessibilityLabel={`${size ?? 0}|${color ?? 'none'}`} />;
}

const wrap = (ui: React.ReactElement) => render(<BloomThemeProvider>{ui}</BloomThemeProvider>);

describe('renderLeadingIcon hands an app glyph the box and the live colour', () => {
  it('ButtonGroupItem passes a numeric size and a non-empty colour', () => {
    const { getByTestId } = wrap(
      <ButtonGroup accessibilityLabel="Actions">
        <ButtonGroupItem
          iconOnly
          accessibilityLabel="Search"
          renderLeadingIcon={({ size, color }) => <AppGlyph size={size} color={color} />}
        />
      </ButtonGroup>,
    );

    const [size, color] = getByTestId('app-glyph').props.accessibilityLabel.split('|');
    // The item's own geometry, not the glyph's default.
    expect(Number(size)).toBeGreaterThan(0);
    expect(color).not.toBe('none');
    expect(color).not.toBe('');
  });

  it('Button passes them too, and the renderer wins over leadingIcon', () => {
    const Never = () => <View testID="bloom-shaped" />;
    const { getByTestId, queryByTestId } = wrap(
      <Button
        accessibilityLabel="Search"
        iconOnly
        leadingIcon={Never}
        renderLeadingIcon={({ size, color }) => <AppGlyph size={size} color={color} />}
      />,
    );

    expect(getByTestId('app-glyph')).toBeTruthy();
    // Precedence, matching GlyphButton, where the caller-painted glyph wins.
    expect(queryByTestId('bloom-shaped')).toBeNull();
  });

  it('still renders the label beside a rendered trailing glyph', () => {
    const { getByText, getByTestId } = wrap(
      <Button renderTrailingIcon={({ size, color }) => <AppGlyph size={size} color={color} />}>
        Continue
      </Button>,
    );
    expect(getByText('Continue')).toBeTruthy();
    expect(getByTestId('app-glyph')).toBeTruthy();
  });

  it('leaves the ADAPTER-COMPONENT form working, which is what a union would have broken', () => {
    // A plain function component, the documented way to use an app icon today.
    const Adapter = ({ width, fill }: { width?: number; height?: number; fill?: string }) => (
      <AppGlyph size={width} color={fill} />
    );
    const { getByTestId } = wrap(
      <ButtonGroup accessibilityLabel="Actions">
        <ButtonGroupItem iconOnly accessibilityLabel="Search" leadingIcon={Adapter} />
      </ButtonGroup>,
    );
    const [size, color] = getByTestId('app-glyph').props.accessibilityLabel.split('|');
    expect(Number(size)).toBeGreaterThan(0);
    expect(color).not.toBe('none');
  });

  it('draws nothing when neither form is given', () => {
    const { queryByTestId } = wrap(
      <ButtonGroup accessibilityLabel="Actions">
        <ButtonGroupItem accessibilityLabel="Plain">
          <Text>Plain</Text>
        </ButtonGroupItem>
      </ButtonGroup>,
    );
    expect(queryByTestId('app-glyph')).toBeNull();
  });
});
