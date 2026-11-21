/**
 * Android and OxyOS: the lens engine draws the glass and presents the menu.
 * The native view is a stand-in host (`BloomLensMenu`): what reaches it is
 * the contract with the engine.
 */
import { createElement } from 'react';

import { DARK, LIGHT, PaintContext } from './support/bloom-theme';
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
import { menu } from '../primitives';
import { toElement } from '../render';
import { resolveCorner } from '../tokens';

/**
 * The lens is the upstream app's menu component itself (`@oxy.so/bloom-lens`, its Android files);
 * only its native view is a stand-in, whose props are the contract with the engine.
 */
const mockLensHandle = { open: jest.fn(async () => {}), close: jest.fn(async () => {}) };
jest.mock(
  'expo',
  () => {
    const { createElement, forwardRef, useImperativeHandle } = jest.requireActual('react');
    const NativeLens = forwardRef(function NativeLens(props: object, ref: unknown) {
      useImperativeHandle(ref, () => mockLensHandle);
      return createElement('BloomLensMenu', props);
    });
    return { requireNativeView: () => NativeLens };
  },
  { virtual: true },
);
const LENS_MENU = '../../../bloom-lens/src/menu/components';
jest.mock('../../../bloom-lens/src/menu/components/menu-trigger/menu-trigger', () =>
  jest.requireActual(`${LENS_MENU}/menu-trigger/menu-trigger.android`),
);
jest.mock('../platform/lens', () => ({
  ...jest.requireActual('../platform/lens'),
  getLens: () => jest.requireActual('@oxy.so/bloom-lens'),
}));
beforeEach(() => {
  mockLensHandle.open.mockClear();
  mockLensHandle.close.mockClear();
});
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

  it('a glass’s variants reach the lens: a fill its tint, a corner its radius, a frame its style', () => {
    const r = mount(
      toElement(
        HStack(Text('a'))
          .onPress(() => {})
          .glass(regular.tint('primary', 'medium'))
          .corner('lg')
          .when('pressed', (v) => v.background('error/40').corner('xl').frame({ height: '4xl' })),
      ),
    );
    const lens = () => only(r, 'BloomLensMenu');
    expect(lens().props).toMatchObject({
      cornerRadius: 16,
      triggerConfig: { blur: 1, tintColor: LIGHT.primary, tintOpacity: 0.48 },
    });
    expect(lens().props.style).toBeUndefined();
    act(() => only(r, 'Pressable').props.onPressIn());
    expect(lens().props).toMatchObject({
      cornerRadius: 20,
      style: { height: 40 },
      triggerConfig: { blur: 1, tintColor: LIGHT.error, tintOpacity: 0.4 },
    });
    act(() => only(r, 'Pressable').props.onPressOut());
    expect(lens().props.triggerConfig).toMatchObject({ tintColor: LIGHT.primary });
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

/** A `menu()` content: its rows are built only while the menu is open. */
const builtRows = jest.fn();
const Rows = menu(function Rows() {
  builtRows();
  return [Item('Copy').icon(Glyph)];
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

  it('closed, a plain trigger sits on a base the app draws, holding the rows and their glyphs', () => {
    const r = mount(toElement(node));
    const lens = only(r, 'BloomLensMenu');
    const panel = lens.props.config.tintColor;
    expect(lens.props).toMatchObject({
      // No lens in a scroll: the engine would draw it over the fixed layer.
      lens: false,
      morph: true,
      colorScheme: 'light',
      fontFamily: 'Inter',
      openWithItems: false,
      // The menu morphs out of the base, in its colour, and goes back as the upstream trigger's does.
      triggerConfig: { tintColor: panel, tintOpacity: 1, absorb: { duration: 0.48 } },
    });
    // The base: a capsule in the panel's colour around the trigger.
    const base = r.root.find(
      (instance) =>
        (instance.type as string) === 'View' && instance.props.style?.backgroundColor === panel,
    );
    expect(base.props.style.borderRadius).toBeGreaterThan(100);
    // The upstream defaults: at its rows' width, from the side the trigger is on; a capsule
    // shape; the panel at the engine's own transparency.
    expect(lens.props.alignment).toBeUndefined();
    expect(lens.props.menuWidth).toBeUndefined();
    expect(lens.props.cornerRadius).toBeUndefined();
    expect(lens.props.config.tintOpacity).toBeUndefined();
    expect(lens.props.items).toEqual([
      { id: 'r0', title: 'Copy', iconSlot: 0 },
      { id: 'separator-1', title: '', separator: true },
      { id: 'heading-2', title: 'Danger', heading: true },
      { id: 'r1.0', title: 'Delete', iconSlot: 1, destructive: true },
      { id: 'separator-4', title: '', separator: true },
      { id: 'r3', title: 'Share', items: [{ id: 'r3.0', title: 'Link' }] },
    ]);
    // Bloom gives the colours: the panel's tint and the rows' ink.
    expect(lens.props.config).toMatchObject({
      textColor: LIGHT.text,
      mutedColor: LIGHT.textSecondary,
    });
    // The glyphs are views in the icon host, one per slot, in the row's ink.
    const glyphs = hosts(r, 'Glyph').map((glyph) => glyph.props.fill);
    expect(glyphs.slice(-2)).toEqual([LIGHT.text, LIGHT.error]);
    // The upstream press layer is the trigger's, named after the menu.
    expect(only(r, 'Pressable').props.accessibilityLabel).toBe('Post options');
  });

  it('a press opens it natively: one call to the engine, the same view', () => {
    const r = mount(toElement(node));
    const lens = only(r, 'BloomLensMenu');
    act(() => only(r, 'Pressable').props.onPress());
    expect(mockLensHandle.open).toHaveBeenCalledTimes(1);
    expect(only(r, 'BloomLensMenu')).toBe(lens);
    act(() => lens.props.onItemSelect({ nativeEvent: { id: 'r1.0', index: 3, title: 'Delete' } }));
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('a render that changes no row sends the engine the same rows', () => {
    // Built anew on each render, as a view's body builds it.
    const build = () => Menu(Button(Icon(Glyph)).glass(regular), Item('Copy').icon(Glyph));
    const r = mount(toElement(build()));
    const before = only(r, 'BloomLensMenu').props;
    act(() => r.update(createElement(PaintContext.Provider, { value: LIGHT }, toElement(build()))));
    const after = only(r, 'BloomLensMenu').props;
    expect(after.items).toBe(before.items);
    expect(after.triggerConfig).toBe(before.triggerConfig);
  });

  it('a menu() content is built by the trigger’s press; the view opens itself with its rows, and lets them go once closed', () => {
    builtRows.mockClear();
    const r = mount(toElement(Menu(Icon(Glyph), Rows())));
    const lens = only(r, 'BloomLensMenu');
    expect(lens.props).toMatchObject({ items: [], openWithItems: true });
    expect(builtRows).not.toHaveBeenCalled();
    act(() => only(r, 'Pressable').props.onPress());
    // No call: the view opens itself as the rows arrive.
    expect(mockLensHandle.open).not.toHaveBeenCalled();
    expect(only(r, 'BloomLensMenu')).toBe(lens);
    expect(lens.props.items).toEqual([{ id: 'r0', title: 'Copy', iconSlot: 0 }]);
    expect(builtRows).toHaveBeenCalled();
    act(() => lens.props.onMenuClosed());
    expect(only(r, 'BloomLensMenu').props.items).toEqual([]);
  });

  it('a row’s subtitle is its second line', () => {
    const r = mount(toElement(Menu(Icon(Glyph), Item('Quiet').subtitle('No sound for an hour'))));
    expect(only(r, 'BloomLensMenu').props.items).toEqual([
      { id: 'r0', title: 'Quiet', subtitle: 'No sound for an hour' },
    ]);
  });

  it('a trigger with a name of its own keeps it', () => {
    const r = mount(toElement(Menu(Icon(Glyph).label('More'), Item('a')).label('Post options')));
    expect(only(r, 'Pressable').props.accessibilityLabel).toBe('More');
  });

  it('a trigger on glass gives its base that glass, its shape the base’s corner', () => {
    const r = mount(
      toElement(Menu(Button(Icon(Glyph)).corner('lg').glass(regular.tint('primary')), Item('a'))),
    );
    const lens = only(r, 'BloomLensMenu');
    expect(lens.props).toMatchObject({
      lens: true,
      cornerRadius: resolveCorner('lg'),
      triggerConfig: { tintColor: LIGHT.primary, absorb: { duration: 0.48 } },
      items: [{ id: 'r0', title: 'a' }],
    });
    expect(only(r, 'BloomButton').props.material).toBeUndefined();
    act(() => only(r, 'Pressable').props.onPress());
    expect(mockLensHandle.open).toHaveBeenCalledTimes(1);
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
    act(() => only(r, 'Pressable').props.onPress());
    expect(mockLensHandle.open).toHaveBeenCalledTimes(1);
    const lens = only(r, 'BloomLensMenu');
    act(() => lens.props.onItemSelect({ nativeEvent: { id: 'r0', index: 0, title: 'Copy' } }));
    expect(copy).toHaveBeenCalledTimes(1);
    expect(built).toHaveBeenCalledTimes(1);
    expect(only(r, 'BloomLensMenu')).toBe(lens);
  });
});
