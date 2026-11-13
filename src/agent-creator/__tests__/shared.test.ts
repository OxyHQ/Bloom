import { hexToHsv, hsvToHex, normalizeAgentPreferences } from '../shared';

describe('agent color picker maths', () => {
  it.each(['#000000', '#ffffff', '#437ef7', '#27b5a2', '#e34798', '#7f7f7f'])(
    'round-trips %s through hsv',
    (hex) => {
      expect(hsvToHex(hexToHsv(hex)!)).toBe(hex);
    },
  );
  it('rejects incomplete input', () => {
    expect(hexToHsv('invalid')).toBeNull();
  });
  it('retains hue when a controlled picker reaches black or gray', () => {
    const color = { h: 259, s: 0.75, v: 0 };
    expect(hsvToHex(color)).toBe('#000000');
    expect(hsvToHex({ ...color, v: 1 })).toBe('#7c40ff');
  });
});

describe('agent preference restoration', () => {
  it('keeps valid selections, including voice off and notifications off', () => {
    expect(
      normalizeAgentPreferences({
        voice: '',
        speed: 0.75,
        language: 'es',
        notifications: false,
      }),
    ).toEqual({ voice: '', speed: 0.75, language: 'es', notifications: false });
  });
  it('bounds untrusted preference values before use by speech providers', () => {
    expect(
      normalizeAgentPreferences({
        voice: 'x'.repeat(250),
        speed: Infinity,
        language: 'unsupported',
        notifications: 'yes',
      } as never),
    ).toEqual({
      voice: 'x'.repeat(200),
      speed: 1,
      language: 'auto',
      notifications: true,
    });
    expect(normalizeAgentPreferences(null)).toEqual({
      voice: 'alice',
      speed: 1,
      language: 'auto',
      notifications: true,
    });
  });
});
