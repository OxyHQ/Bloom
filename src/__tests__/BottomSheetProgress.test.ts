import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('BottomSheet animated progress', () => {
  const source = readFileSync(join(__dirname, '../bottom-sheet/BottomSheetBase.tsx'), 'utf8');

  it('mirrors both presentation and drag position on the UI thread', () => {
    expect(source).toContain('useAnimatedReaction(');
    expect(source).toContain('Math.min(\n          opacity.value,');
    // Drag position is the sheet's own travel (its measured height), the same fade the backdrop uses.
    expect(source).toContain('backdropFade(');
    expect(source).toContain('sheetHeightSV.value');
    expect(source).toContain('animatedProgress.value = progress');
  });
});
