import { backdropFade } from '../backdrop-fade';

describe('backdropFade', () => {
  it('is all of the backdrop at rest and none once the sheet has travelled its own height', () => {
    expect(backdropFade(0, 400)).toBe(1);
    expect(backdropFade(400, 400)).toBe(0);
  });

  it('goes away in a straight line with the drag', () => {
    expect(backdropFade(100, 400)).toBe(0.75);
    expect(backdropFade(200, 400)).toBe(0.5);
    expect(backdropFade(300, 400)).toBe(0.25);
  });

  it('stays within 0 and 1 for a sheet pulled up past rest or thrown past the bottom', () => {
    expect(backdropFade(-60, 400)).toBe(1);
    expect(backdropFade(900, 400)).toBe(0);
  });

  it('keeps the backdrop while the sheet has not been measured', () => {
    expect(backdropFade(120, 0)).toBe(1);
  });
});
