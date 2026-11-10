import { shouldClosePan } from '../pan-dismiss';

describe('shouldClosePan', () => {
  it('closes on a fast downward flick at any distance', () => {
    expect(shouldClosePan(5, 901, 800)).toBe(true);
  });

  it('closes past a quarter of the screen, never under 140px', () => {
    expect(shouldClosePan(201, 0, 800)).toBe(true);
    expect(shouldClosePan(199, 0, 800)).toBe(false);
    expect(shouldClosePan(141, 0, 400)).toBe(true);
    expect(shouldClosePan(139, 0, 400)).toBe(false);
  });

  it('stays open when the finger is returning upward', () => {
    expect(shouldClosePan(300, -301, 800)).toBe(false);
  });
});
