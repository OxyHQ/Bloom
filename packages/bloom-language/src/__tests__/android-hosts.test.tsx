/**
 * Android and OxyOS: the lens engine draws the glass and presents the menu.
 * The native view is a stand-in host (`BloomLensMenu`): what reaches it is
 * the contract with the engine.
 */
import { DARK, LIGHT } from './support/bloom-theme';
import { act, Glyph, hosts, mount, only, quietRenderer } from './support/mount';
import {
  actions,
  BottomBar,
  Button,
  Divider,
  FAB,
  HStack,
  Icon,
  Item,
  Menu,
  Section,
  Submenu,
  Tab,
  Text,
} from '../primitives';
import { clear, regular } from '../glass';
import { toElement } from '../render';

jest.mock('../platform/lens', () => ({
  ...jest.requireActual('../platform/lens'),
  getNativeLens: () => 'BloomLensMenu',
}));
jest.mock('../platform/glass-host', () => jest.requireActual('../platform/glass-host.android'));
jest.mock('../platform/menu-host', () => jest.requireActual('../platform/menu-host.android'));

quietRenderer();

describe('glass is the lens', () => {
  it('a glass view is the lens view with no rows, its tint from a role at a named transparency', () => {
    const r = mount(
      toElement(HStack(Text('a')).glass(clear.tint('primary', 'medium')).corner('lg')),
    );
    const lens = only(r, 'BloomLensMenu');
    expect(lens.props).toMatchObject({
      items: [],
      lens: true,
      colorScheme: 'light',
      cornerRadius: 16,
      triggerConfig: { blur: 0.5, tintColor: LIGHT.primary, tintOpacity: 0.48 },
    });
    expect(hosts(r, 'Surface')).toHaveLength(0);
  });

  it('untinted regular glass is the engine’s own frost; the theme sets its scheme', () => {
    const r = mount(toElement(HStack(Text('a')).glass()), DARK);
    expect(only(r, 'BloomLensMenu').props).toMatchObject({
      cornerRadius: undefined,
      colorScheme: 'dark',
      triggerConfig: { blur: 1, tintColor: undefined, tintOpacity: undefined },
    });
  });

  it('a Button on glass keeps its press and ink; the glass draws its fill, tinted with its tone', () => {
    const onPress = jest.fn();
    const r = mount(toElement(Button(Icon(Glyph)).shape('circle').glass().onPress(onPress)));
    const button = only(r, 'BloomButton');
    expect(button.props).toMatchObject({ material: 'shared', onPress, iconOnly: true });
    expect(only(r, 'BloomLensMenu').props.triggerConfig).toMatchObject({
      tintColor: LIGHT.primary,
    });
    expect(hosts(r, 'Pressable')).toHaveLength(0);
  });

  it('a plain Button on glass stays neutral', () => {
    const r = mount(toElement(Button(Text('Edit')).style('plain').glass()));
    expect(only(r, 'BloomLensMenu').props.triggerConfig.tintColor).toBeUndefined();
  });

  it('a FAB is always on glass, tinted with its action tone unless its chain names a glass', () => {
    const r = mount(toElement(FAB(Icon(Glyph), Text('Compose'))));
    expect(only(r, 'BloomFab').props).toMatchObject({
      icon: Glyph,
      label: 'Compose',
      material: 'shared',
    });
    expect(only(r, 'BloomLensMenu').props.triggerConfig).toMatchObject({
      tintColor: LIGHT.tertiary,
    });
    const tinted = mount(toElement(FAB(Icon(Glyph)).glass(clear.tint('primary', 'subtle'))));
    expect(hosts(tinted, 'BloomLensMenu')).toHaveLength(1);
    expect(only(tinted, 'BloomLensMenu').props.triggerConfig).toMatchObject({
      blur: 0.5,
      tintColor: LIGHT.primary,
      tintOpacity: 0.24,
    });
  });
});

describe('the menu is the lens menu', () => {
  const remove = jest.fn();
  const node = Menu(
    Icon(Glyph),
    Item('Copy').icon(Glyph),
    Section(Item('Delete').icon(Glyph).destructive().onPress(remove)).title('Danger'),
    Divider(),
    Submenu('Share', Item('Link')),
  ).label('Post options');

  it('closed, it is its trigger alone: no native view and no row work', () => {
    const r = mount(toElement(node));
    expect(hosts(r, 'BloomLensMenu')).toHaveLength(0);
    expect(only(r, 'Pressable').props).toMatchObject({
      focusable: true,
      // The menu's name is its trigger's.
      accessibilityLabel: 'Post options',
    });
  });

  it('a press mounts the lens view open around the trigger, with the rows and their glyphs', () => {
    const r = mount(toElement(node));
    act(() => only(r, 'Pressable').props.onPress());
    const lens = only(r, 'BloomLensMenu');
    expect(lens.props).toMatchObject({ openOnMount: true, lens: false });
    expect(lens.props.items).toEqual([
      { id: 'r0', title: 'Copy', iconSlot: 0 },
      { id: 'r1-', title: '', separator: true },
      { id: 'r1h', title: 'Danger', heading: true },
      { id: 'r1.0', title: 'Delete', iconSlot: 1, destructive: true },
      { id: 'r2', title: '', separator: true },
      { id: 'r3', title: 'Share', items: [{ id: 'r3.0', title: 'Link' }] },
    ]);
    expect(lens.props.config).toMatchObject({
      textColor: LIGHT.text,
      mutedColor: LIGHT.textSecondary,
    });
    // The glyphs are drawn as views, one per slot, in the menu's ink.
    const glyphs = hosts(r, 'Glyph').map((glyph) => glyph.props.fill);
    expect(glyphs.slice(-2)).toEqual([LIGHT.textSecondary, LIGHT.error]);
    act(() => lens.props.onItemSelect({ nativeEvent: { id: 'r1.0' } }));
    expect(remove).toHaveBeenCalledTimes(1);
    // The view stays until the engine has finished closing it.
    act(() => lens.props.onMenuClosed());
    expect(hosts(r, 'BloomLensMenu')).toHaveLength(0);
  });

  it('a trigger with a name of its own keeps it', () => {
    const r = mount(toElement(Menu(Icon(Glyph).label('More'), Item('a')).label('Post options')));
    expect(only(r, 'Pressable').props.accessibilityLabel).toBe('More');
  });

  it('a trigger on glass gives the menu its glass: the menu draws it, and morphs out of it', () => {
    const r = mount(
      toElement(
        Menu(Button(Icon(Glyph)).shape('circle').glass(regular.tint('primary')), Item('a')),
      ),
    );
    // Closed: the button on its own glass.
    expect(only(r, 'BloomLensMenu').props.items).toEqual([]);
    act(() => only(r, 'BloomButton').props.onPress());
    const lens = only(r, 'BloomLensMenu');
    expect(lens.props).toMatchObject({ lens: true, triggerConfig: { tintColor: LIGHT.primary } });
    expect(only(r, 'BloomButton').props.material).toBeUndefined();
  });
});

describe('the bottom bar', () => {
  it('is Bloom’s BottomBar with the tabs, the selection and the FAB as its action', () => {
    const onSelect = jest.fn();
    const r = mount(
      toElement(
        BottomBar(Tab('Home', Glyph).id('home').badge(2), Tab('Search', Glyph).id('search'))
          .selection('search')
          .onSelect(onSelect)
          .action(FAB(Icon(Glyph))),
      ),
    );
    const bar = only(r, 'BottomBar');
    expect(bar.props.value).toBe('search');
    expect(bar.props.onValueChange).toBe(onSelect);
    expect(
      bar.props.items.map((item: { name: string; badge?: number }) => [item.name, item.badge]),
    ).toEqual([
      ['home', 2],
      ['search', undefined],
    ]);
    expect(bar.props.items[0].icon.props).toEqual({ width: 24, height: 24 });
    // The action is drawn where the bar places it: the FAB on its lens.
    const action = mount(bar.props.action);
    expect(only(action, 'BloomFab').props.material).toBe('shared');
    expect(hosts(action, 'BloomLensMenu')).toHaveLength(1);
  });
});

describe('the lens menu: tagged rows', () => {
  it('a row the engine reports chosen runs its action, after the menu has closed', () => {
    const built = jest.fn();
    const copy = jest.fn();
    const Actions = actions(function actionsBody() {
      built();
      return { copy };
    });
    const r = mount(
      toElement(Menu(Icon(Glyph).onPress(undefined), Item('Copy').tag('copy')).actions(Actions())),
    );
    const open = r.root.find((instance) => typeof instance.props.onPress === 'function');
    act(() => open.props.onPress());
    const lens = only(r, 'BloomLensMenu');
    act(() => {
      lens.props.onItemSelect({ nativeEvent: { id: 'r0' } });
      lens.props.onMenuClosed();
    });
    expect(copy).toHaveBeenCalledTimes(1);
    expect(built).toHaveBeenCalledTimes(1);
    expect(hosts(r, 'BloomLensMenu')).toHaveLength(0);
  });
});
