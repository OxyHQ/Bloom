/** Tagged rows on the web (and wherever Bloom's own menu presents): the same choice, through Bloom's menu. */
import { RiLinkM } from '@oxy.so/bloom/icons/RiLinkM';

import { act, Glyph, hosts, mount, only, quietRenderer } from './support/mount';
import { actions, Button, Icon, Item, Menu } from '../primitives';
import { toElement } from '../render';

jest.mock('../platform/menu-host', () => jest.requireActual('../platform/menu-host.web'));

quietRenderer();

const trigger = Button(Icon(Glyph)).style('plain').shape('circle').label('More');

describe('Bloom’s menu: tagged rows', () => {
  it('a chosen row runs its action through the actions body, built only then and only once', () => {
    const built = jest.fn();
    const copy = jest.fn();
    const Actions = actions(function actionsBody() {
      built();
      return { copy };
    });
    const element = () =>
      toElement(Menu(trigger, Item('Copy link').icon(RiLinkM).tag('copy')).actions(Actions()));
    const r = mount(element());
    act(() => only(r, 'DropdownMenu').props.onOpenChange(true));
    expect(built).not.toHaveBeenCalled();
    act(() => only(r, 'DropdownMenuItem').props.onPress());
    expect(copy).toHaveBeenCalledTimes(1);
    expect(built).toHaveBeenCalledTimes(1);
    act(() => r.update(element()));
    expect(built).toHaveBeenCalledTimes(1);
  });

  it('a tag with no action, or a menu without actions(), does nothing', () => {
    const r = mount(toElement(Menu(trigger, Item('Copy link').tag('copy'))));
    act(() => only(r, 'DropdownMenu').props.onOpenChange(true));
    expect(only(r, 'DropdownMenuItem').props.onPress).toBeUndefined();
    expect(hosts(r, 'DropdownMenuItem')).toHaveLength(1);
  });
});
