/**
 * Every disc in an attachment-menu row sits at the top of its cell on native.
 *
 * Button hands `alignItems` to its content, which is a row, so the cell's
 * 'center' centred each disc vertically: in Allo's sheet (Pixel 8a) the discs
 * beside the wrapped "Photos and videos" sat lower than its.
 *
 * Rendered through the `react-native` mock.
 */
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Button } from '../button';
import { AttachmentMenu } from '../chat-composer';
import type { AttachmentMenuItem } from '../chat-composer/types';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const ITEMS: AttachmentMenuItem[] = ['Photos and videos', 'Camera', 'Document'].map((label, i) => ({
  id: `item-${i}`,
  label,
  icon: RiAddLine,
}));

describe('AttachmentMenu grid on native', () => {
  it('tops each disc in its cell', () => {
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AttachmentMenu open onOpenChange={() => {}} items={ITEMS}>
          <Button>Attach</Button>
        </AttachmentMenu>
      </BloomThemeProvider>,
    );
    const cells = screen
      .UNSAFE_getAllByType(Button)
      .filter((node) => ITEMS.some((item) => item.label === node.props.accessibilityLabel));
    expect(cells).toHaveLength(ITEMS.length);
    for (const cell of cells) {
      expect(StyleSheet.flatten(cell.props.style)?.alignItems).toBe('flex-start');
    }
  });
});
