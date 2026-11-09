import { previewAvatarGeometry, SelectedAgentPreview } from '../multi-agent-chat';

describe('SelectedAgentPreview', () => {
  it('is public from the multi-agent-chat entry', () => {
    expect(typeof SelectedAgentPreview).toBe('function');
  });

  it('composes one large avatar, a trio, and a ring from four up', () => {
    expect(previewAvatarGeometry(1, 0).size).toBe(80);
    expect(previewAvatarGeometry(3, 1).size).toBe(62);
    const ring = [0, 1, 2, 3].map((i) => previewAvatarGeometry(4, i));
    expect(new Set(ring.map((a) => a.size))).toEqual(new Set([48]));
    // A ring: no two avatars share a place.
    expect(new Set(ring.map((a) => `${a.x.toFixed(1)},${a.y.toFixed(1)}`)).size).toBe(4);
  });
});
