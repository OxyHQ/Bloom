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
import { GLASS } from '../generated/spec.generated';
// Bloom's own lens frost, read from its source, so the language's regular glass and Bloom's lens controls agree.
import { LENS_FROST } from '../../../../src/floating/lens/lens-frost';
// Bloom's own lens tint for a solid control and its FAB's default shape, read from its source, so the two agree.
import { LENS_FILL_TINT } from '../../../../src/floating/lens/lens-tint';
import { DEFAULT_FAB_SHAPE } from '../../../../src/fab/constants';
import { CONTROL_FILL_OPACITY } from '../platform/lens-glass';
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

const REGULAR_FROST = GLASS.regular.lensBlur;
const CLEAR_FROST = GLASS.clear.lensBlur;

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
      triggerConfig: { blur: CLEAR_FROST, tintColor: LIGHT.primary, tintOpacity: 0.48 },
    });
    expect(hosts(r, 'Surface')).toHaveLength(0);
  });

  it('untinted regular glass frosts as Liquid Glass does; the theme sets its scheme', () => {
    const r = mount(toElement(HStack(Text('a')).glass()), DARK);
    expect(only(r, 'BloomLensMenu').props).toMatchObject({
      cornerRadius: undefined,
      colorScheme: 'dark',
      triggerConfig: { blur: REGULAR_FROST, tintColor: undefined, tintOpacity: undefined },
    });
  });

  it('the frost is Liquid Glass’s: clear frosts less than regular, a menu more, as Bloom’s own lens', () => {
    expect(CLEAR_FROST).toBeLessThan(REGULAR_FROST);
    expect(REGULAR_FROST).toBeLessThan(GLASS.regular.lensMenuBlur);
    // Bloom's lens controls and menus take the regular glass's frost.
    expect(LENS_FROST).toEqual({ control: REGULAR_FROST, panel: GLASS.regular.lensMenuBlur });
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
      triggerConfig: { blur: REGULAR_FROST, tintColor: LIGHT.primary, tintOpacity: 0.48 },
    });
    expect(lens().props.style).toBeUndefined();
    act(() => only(r, 'Pressable').props.onPressIn());
    expect(lens().props).toMatchObject({
      cornerRadius: 20,
      style: { height: 40 },
      triggerConfig: { blur: REGULAR_FROST, tintColor: LIGHT.error, tintOpacity: 0.4 },
    });
    act(() => only(r, 'Pressable').props.onPressOut());
    expect(lens().props.triggerConfig).toMatchObject({ tintColor: LIGHT.primary });
  });

  it('a Button on glass keeps its press and ink; the glass draws its fill, tinted with its tone', () => {
    const onPress = jest.fn();
    const r = mount(toElement(Button(Icon(Glyph)).shape('circle').glass().onPress(onPress)));
    const button = only(r, 'BloomButton');
    // On glass it is Bloom's one floating size, whatever its chain says.
    expect(button.props).toMatchObject({ material: 'shared', onPress, iconOnly: true, size: 'lg' });
    // The solid fill tints the glass as Bloom's own lens control does (Apple's glassProminent).
    expect(only(r, 'BloomLensMenu').props.triggerConfig).toMatchObject({
      tintColor: LIGHT.primary,
      tintOpacity: 0.8,
    });
    // Bloom's lens control tints at the same strength.
    expect(CONTROL_FILL_OPACITY).toBe(LENS_FILL_TINT);
    expect(hosts(r, 'Pressable')).toHaveLength(0);
  });

  it('a plain Button on glass stays neutral', () => {
    const r = mount(toElement(Button(Text('Edit')).style('plain').glass()));
    expect(only(r, 'BloomLensMenu').props.triggerConfig.tintColor).toBeUndefined();
  });

  it('a FAB is always on glass, tinted with the accent unless its chain names a glass', () => {
    const r = mount(toElement(FAB(Icon(Glyph), Text('Compose'))));
    expect(only(r, 'BloomFab').props).toMatchObject({
      icon: Glyph,
      label: 'Compose',
      material: 'shared',
    });
    expect(only(r, 'BloomLensMenu').props).toMatchObject({
      triggerConfig: { tintColor: LIGHT.primary, tintOpacity: 0.8 },
    });
    const tinted = mount(toElement(FAB(Icon(Glyph)).glass(clear.tint('primary', 'subtle'))));
    expect(hosts(tinted, 'BloomLensMenu')).toHaveLength(1);
    expect(only(tinted, 'BloomLensMenu').props.triggerConfig).toMatchObject({
      blur: CLEAR_FROST,
      tintColor: LIGHT.primary,
      tintOpacity: 0.24,
    });
  });

  it('a FAB’s shape is its lens’s corner: 28% of its diameter, a squircle by default', () => {
    for (const shape of ['rounded', 'squircle'] as const) {
      const r = mount(toElement(FAB(Icon(Glyph)).shape(shape).label('Compose')));
      expect(only(r, 'BloomFab').props.shape).toBe(shape);
      expect(only(r, 'BloomLensMenu').props.cornerRadius).toBe(14);
    }
    // Unnamed, it is Bloom `Fab`'s default: a squircle, its lens the same corner.
    const plain = mount(toElement(FAB(Icon(Glyph)).label('Compose')));
    expect(DEFAULT_FAB_SHAPE).toBe('squircle');
    expect(only(plain, 'BloomFab').props.shape).toBe(DEFAULT_FAB_SHAPE);
    expect(only(plain, 'BloomLensMenu').props.cornerRadius).toBe(14);
    // A circle is the capsule the lens draws when it is given no corner.
    const circle = mount(toElement(FAB(Icon(Glyph)).shape('circle').label('Compose')));
    expect(only(circle, 'BloomFab').props.shape).toBe('circle');
    expect(only(circle, 'BloomLensMenu').props.cornerRadius).toBeUndefined();
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

  it('closed, a bare trigger is a base that draws no lens: no glass, its menu grows out of its shape', () => {
    const r = mount(toElement(node));
    const lens = only(r, 'BloomLensMenu');
    expect(lens.props).toMatchObject({
      // The base is the trigger's own, and it is what becomes the menu; a bare trigger is no glass.
      lens: false,
      colorScheme: 'light',
      fontFamily: 'Inter',
      openWithItems: false,
      // The menu's own base: a tap opens it natively, with no round trip to JS.
      openOnTap: true,
      // The upstream app's glass trigger config.
      triggerConfig: { absorb: { duration: 0.48 } },
    });
    // The upstream defaults: at its rows' width, from the side the trigger is on; a capsule
    // shape; the panel at the engine's own transparency.
    expect(lens.props.alignment).toBeUndefined();
    expect(lens.props.menuWidth).toBeUndefined();
    expect(lens.props.cornerRadius).toBeUndefined();
    expect(lens.props.restBackdrop).toBeUndefined();
    expect(lens.props.config.tintOpacity).toBeUndefined();
    expect(lens.props.items).toEqual([
      { id: 'r0', title: 'Copy', iconSlot: 0 },
      { id: 'separator-1', title: '', separator: true },
      { id: 'heading-2', title: 'Danger', heading: true },
      { id: 'r1.0', title: 'Delete', iconSlot: 1, destructive: true },
      { id: 'separator-4', title: '', separator: true },
      { id: 'r3', title: 'Share', items: [{ id: 'r3.0', title: 'Link' }] },
    ]);
    // Bloom gives the panel's frost (regular glass grown large) and colours: its tint and the rows' ink.
    expect(lens.props.config).toMatchObject({
      blur: GLASS.regular.lensMenuBlur,
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
    expect(lens.props).toMatchObject({ items: [], openWithItems: false });
    expect(builtRows).not.toHaveBeenCalled();
    act(() => only(r, 'Pressable').props.onPress());
    // No call: the base asks the view to open itself as the rows arrive.
    expect(mockLensHandle.open).not.toHaveBeenCalled();
    expect(only(r, 'BloomLensMenu')).toBe(lens);
    expect(lens.props).toMatchObject({
      items: [{ id: 'r0', title: 'Copy', iconSlot: 0 }],
      openWithItems: true,
    });
    // Opened, it re-arms.
    act(() => lens.props.onMenuOpenChange({ nativeEvent: { open: true } }));
    expect(only(r, 'BloomLensMenu').props.openWithItems).toBe(false);
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

  it('a disabled trigger leaves the tap to its own press, which does nothing', () => {
    const r = mount(toElement(Menu(Button(Icon(Glyph)).disabled(), Item('a'))));
    expect(only(r, 'BloomLensMenu').props.openOnTap).toBe(false);
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
    // The fixed layer's glass: drawn by the window, as upstream.
    expect(lens.props.restBackdrop).toBeUndefined();
    expect(only(r, 'BloomButton').props.material).toBeUndefined();
    act(() => only(r, 'BloomButton').props.onPress());
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
