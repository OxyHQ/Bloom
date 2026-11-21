/** The web: no glass (Bloom's frosted Surface), Bloom's own menu, Bloom's PageHeader. */
import { LIGHT, withAlpha } from './support/bloom-theme';
import { act, Glyph, hosts, mount, only, quietRenderer } from './support/mount';
import {
  Button,
  Divider,
  FAB,
  Header,
  Icon,
  Item,
  Menu,
  Section,
  Submenu,
  Text,
} from '../primitives';
import { clear } from '../glass';
import { toElement } from '../render';

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: { OS: 'web', select: <T,>(spec: { web?: T; default?: T }) => spec.web ?? spec.default },
}));
jest.mock('../platform/glass-host', () => jest.requireActual('../platform/glass-host.web'));
jest.mock('../platform/menu-host', () => jest.requireActual('../platform/menu-host.web'));

quietRenderer();

describe('glass on the web is Bloom’s frosted Surface', () => {
  it('a Button on glass: the Surface draws its fill, tinted with its tone; the button keeps its ink', () => {
    const r = mount(toElement(Button(Icon(Glyph)).shape('circle').glass()));
    expect(only(r, 'Surface').props.fill).toBe(LIGHT.primary);
    expect(only(r, 'BloomButton').props.material).toBe('shared');
  });

  it('a FAB: on its Surface, tinted from a role at a named transparency', () => {
    const r = mount(toElement(FAB(Icon(Glyph)).glass(clear.tint('primary', 'subtle'))));
    expect(only(r, 'Surface').props).toMatchObject({ sheen: false });
    // Bloom's withAlpha, as an app writes it: Surface computes its material from it.
    expect(only(r, 'Surface').props.fill).toBe(withAlpha(LIGHT.primary, 0.24));
  });

  it('a paint that is a CSS variable (Bloom’s prepaint) is mixed by the browser', () => {
    const prepainted = { ...LIGHT, primary: 'var(--bloom-paint-primary)' };
    const r = mount(toElement(FAB(Icon(Glyph)).glass(clear.tint('primary', 'subtle'))), prepainted);
    expect(only(r, 'Surface').props.fill).toBe(
      'color-mix(in srgb, var(--bloom-paint-primary) 24%, transparent)',
    );
  });
});

describe('the menu is Bloom’s menu', () => {
  it('its content mounts only while open; rows are Bloom’s rows', () => {
    const toggle = jest.fn();
    const r = mount(
      toElement(
        Menu(
          Button(Text('More')).style('plain'),
          Item('Pin').checked(false).onPress(toggle),
          Divider(),
          Section(Item('Delete').icon(Glyph).destructive()).title('Danger'),
          Submenu('Share', Item('Link')),
        ).label('Post options'),
      ),
    );
    const menu = only(r, 'DropdownMenu');
    expect(only(r, 'DropdownMenuTrigger').props).toMatchObject({
      asChild: true,
      label: 'Post options',
    });
    expect(hosts(r, 'DropdownMenuContent')).toHaveLength(0);
    act(() => menu.props.onOpenChange(true));
    expect(hosts(r, 'DropdownMenuContent')).toHaveLength(1);
    act(() => only(r, 'DropdownMenuCheckboxItem').props.onCheckedChange(true));
    expect(toggle).toHaveBeenCalledTimes(1);
    const items = hosts(r, 'DropdownMenuItem').map((item) => [
      item.props.children,
      item.props.variant,
    ]);
    expect(items).toEqual([
      ['Delete', 'destructive'],
      ['Link', 'default'],
    ]);
    expect(only(r, 'DropdownMenuLabel').props.children).toBe('Danger');
    expect(hosts(r, 'DropdownMenuSeparator')).toHaveLength(2);
    expect(only(r, 'DropdownMenuSubTrigger').props.children).toBe('Share');
  });
});

describe('the header is Bloom’s PageHeader', () => {
  it('a large title, its toolbar and how it meets the scrolled content', () => {
    const r = mount(
      toElement(
        Header('Home')
          .titleDisplay('large')
          .toolbar(Button(Icon(Glyph)).shape('circle'))
          .onBack(null)
          .scrollEdge('always')
          .presentation('bar'),
      ),
    );
    const header = only(r, 'PageHeader');
    expect(header.props).toMatchObject({
      title: 'Home',
      titleVariant: 'title-1-bold',
      onBack: null,
      scrim: 'always',
      presentation: 'bar',
    });
    expect(header.props.actions).toHaveLength(1);
  });

  it('toolbar items keep their keys, a menu among them too', () => {
    const r = mount(
      toElement(
        Header('Home').toolbar(
          Button(Icon(Glyph)).shape('circle').label('Search'),
          Menu(Icon(Glyph), Item('Copy')).label('More'),
        ),
      ),
    );
    const keys = (only(r, 'PageHeader').props.actions as { key: string | null }[]).map(
      (a) => a.key,
    );
    expect(keys).toEqual(['0', '1']);
  });
});
