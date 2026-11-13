import { normalizeAgentPreferences } from '../shared';

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
