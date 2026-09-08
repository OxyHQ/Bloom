import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('BottomSheet animated progress', () => {
  const source = readFileSync(join(__dirname, '../bottom-sheet/BottomSheetBase.tsx'), 'utf8');

  it('mirrors both presentation and drag position on the UI thread', () => {
    expect(source).toContain('useAnimatedReaction(');
    expect(source).toContain('Math.min(\n            opacity.value,');
    expect(source).toContain('interpolate(translateY.value, [0, screenHeightSV.value], [1, 0]');
    expect(source).toContain('animatedProgress.value = progress');
  });
});
