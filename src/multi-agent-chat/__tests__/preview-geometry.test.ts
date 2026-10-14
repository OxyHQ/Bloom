import { previewAvatarGeometry } from '../SelectedAgentPreview';

describe('selected agent preview geometry', () => {
  it('retains the group composition for one, three and four agents', () => {
    expect(previewAvatarGeometry(1, 0)).toEqual({ size: 80, x: 40, y: 16 });
    expect(previewAvatarGeometry(3, 2)).toEqual({ size: 62, x: 49, y: 46 });
    expect(previewAvatarGeometry(4, 0).size).toBe(48);
    expect(previewAvatarGeometry(4, 0).y).toBeCloseTo(2);
  });
});
