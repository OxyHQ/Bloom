import { resolveSidebarArrangement } from '../sidebar/arrangement';

describe('resolveSidebarArrangement', () => {
  it('pins the logo and the primary action by default', () => {
    expect(resolveSidebarArrangement(undefined, undefined)).toEqual({
      logo: 'top',
      primaryAction: 'bottom',
      centred: false,
    });
    expect(resolveSidebarArrangement('start', {})).toEqual({
      logo: 'top',
      primaryAction: 'bottom',
      centred: false,
    });
  });

  it('groups every part under contentAlignment="center"', () => {
    expect(resolveSidebarArrangement('center', undefined)).toEqual({
      logo: 'group',
      primaryAction: 'group',
      centred: true,
    });
  });

  it('lets a part that is given win over the preset', () => {
    expect(resolveSidebarArrangement('center', { logo: 'top' })).toEqual({
      logo: 'top',
      primaryAction: 'group',
      centred: true,
    });
    expect(resolveSidebarArrangement('center', { logo: 'top', primaryAction: 'bottom' })).toEqual({
      logo: 'top',
      primaryAction: 'bottom',
      centred: true,
    });
  });

  it('groups one part without the preset, and centres the destinations with it', () => {
    expect(resolveSidebarArrangement(undefined, { logo: 'group' })).toEqual({
      logo: 'group',
      primaryAction: 'bottom',
      centred: true,
    });
    expect(resolveSidebarArrangement('start', { primaryAction: 'group' })).toEqual({
      logo: 'top',
      primaryAction: 'group',
      centred: true,
    });
  });
});
