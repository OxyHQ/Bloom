/**
 * The bar's action is the shell's: it steps aside while the screen in front
 * claims the primary action, through Bloom's own claim (its source, not a copy).
 */
import { ScreenActionScope, useScreenActionClaim } from '../../../../src/app-shell/screen-action';
import { act, Glyph, mount, only, quietRenderer } from './support/mount';
import { BottomBar, FAB, Icon, Tab } from '../primitives';
import { toElement } from '../render';

quietRenderer();

/** A route's screen: it claims the action spot while it shows its own. */
function RouteScreen({ ownAction }: { ownAction: boolean }) {
  useScreenActionClaim(ownAction);
  return null;
}

const bar = toElement(BottomBar(Tab('Home', Glyph).id('home')).action(FAB(Icon(Glyph))));

function Shell({ ownAction }: { ownAction: boolean }) {
  return (
    <ScreenActionScope>
      <RouteScreen ownAction={ownAction} />
      {bar}
    </ScreenActionScope>
  );
}

describe('the bottom bar’s action', () => {
  it('steps aside while the screen in front shows its own, and returns when it leaves', () => {
    const r = mount(<Shell ownAction />);
    expect(only(r, 'BottomBar').props.action).toBeUndefined();
    act(() => r.update(<Shell ownAction={false} />));
    expect(only(r, 'BottomBar').props.action).toBeDefined();
  });

  it('stays when no screen claims the spot', () => {
    const r = mount(<Shell ownAction={false} />);
    expect(only(r, 'BottomBar').props.action).toBeDefined();
  });
});
