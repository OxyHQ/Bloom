import { BloomScope } from '../appearance';
import { useMenuDensity } from '../floating/use-menu-density';
/**
 * `Menubar` — NATIVE: on a phone each menu opens the same bottom sheet
 * `DropdownMenu` and `ContextMenu` present, because a phone has no room to hang
 * a panel beside a control and every Bloom overlay resolving to one sheet is
 * what makes the native surfaces feel like one system.
 *
 * Where the platform has popups of its own (`popup-surface`, an OxyOS window or
 * its shell), the bar's menus are instead the web's desktop menu: ONE anchored
 * panel in one platform popup (`viewport.tsx`), hanging under the open menu's
 * title with the web's menubar offsets and 266px floor, its submenus flying out
 * beside their rows when a pointer drives it (`floating/menu-sub-inline.tsx`),
 * its rows driven by the platform's keys. Moving to another menu while one is
 * open changes that popup into the next menu: it moves under the new title and
 * takes the new menu's size on the menu motion, re-anchored and resized by the
 * platform (`PopupSurfaceProps.anchorRef` moving), while the two menus'
 * rows crossfade; at once with Reduce Motion. The platform keeps the one popup,
 * its grab and the bar's pointer tracking throughout.
 *
 * The bar, the per-menu state, the trigger and the bar's keyboard are identical
 * on both platforms and live in `MenubarBase`. What forks is this file: the
 * surface a menu opens into, and which sub-menu the rows get.
 *
 * Bloom had no menu bar before this family; its rows are `floating/menu-rows`,
 * published here under the `Menubar*` names so a call site keeps every part it
 * wrote.
 */
import React, {
  type ComponentRef,
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Easing, type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { SheetShell } from '../dialog/SheetShell';
import {
  MENU_MORPH_MOTION,
  MENU_WIDTH,
  MENUBAR_ALIGN_OFFSET,
  MENUBAR_SIDE_OFFSET,
} from '../floating/constants';
import {
  POPUP_PANEL_BORDER,
  PopupPanelRows,
  PopupPanelScope,
  PopupPanelSurface,
} from '../floating/PopupPanel';
import { type PopupNavigation, usePopupNavigation } from '../floating/popup-navigation';
import { usePopupSurface } from '../platform-surface/context';
import type { PopupSurfaceProps } from '../platform-surface/types';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { MenuRowAlignmentScope } from '../floating/menu-row-alignment';
import { createMenuRows } from '../floating/menu-rows';
import { createInlineMenuSub } from '../floating/menu-sub-inline';
import { useSheetOpenBridge } from '../floating/use-sheet-open-bridge';
import { useAccessibilityFocus } from '../hooks/use-accessibility-focus';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useEasedValues } from '../motion/use-eased-values';
import { StyledView } from '../styles/styled-primitives';
import { useIsomorphicLayoutEffect } from '../theme/use-isomorphic-layout-effect';
import { MenubarMenuProvider, MenubarScopeProvider, useMenubar, useMenubarMenu } from './context';
import { createMenubarContent, createMenubarRows } from './declared';
import { createMenubar } from './MenubarBase';
import type { MenubarContentProps } from './types';
import {
  type MenubarLayer,
  MenubarLeavingScope,
  MenubarViewportContent,
  useMenubarLayers,
  useOpenCount,
} from './viewport';
import { useCommonMessages } from '../locale/common-messages';

export { MenubarMenu, MenubarTrigger } from './MenubarBase';

const MORPH_EASING = Easing.bezier(...MENU_MORPH_MOTION.easing);

/** A phone's menu: the bottom sheet every menu family presents there. */
function MenubarSheet({ children, size, label: labelProp, alignRows, style }: MenubarContentProps) {
  const common = useCommonMessages();
  const density = useMenuDensity(size);
  const label = labelProp ?? common.menu;
  const menu = useMenubarMenu();
  const { control, onSheetClose } = useSheetOpenBridge(menu.open, menu.setOpen);
  const surface = useMemo<MenuSurfaceContextValue>(
    () => ({ close: menu.choose, presentation: 'sheet' }),
    [menu.choose],
  );
  return (
    <BloomScope size={size}>
      <SheetShell
        anchored
        control={control}
        label={label}
        onClose={onSheetClose}
        contentStyle={[{ gap: density.gap }, style]}
      >
        <MenuSurfaceProvider value={surface}>
          <MenuRowAlignmentScope enabled={alignRows}>{children}</MenuRowAlignmentScope>
        </MenuSurfaceProvider>
      </SheetShell>
    </BloomScope>
  );
}

/** A menu's content: the bar's one popup draws it where the platform has popups, else a sheet. */
function MenubarPanel(props: MenubarContentProps) {
  const PopupSurface = usePopupSurface();
  return PopupSurface ? <MenubarViewportContent {...props} /> : <MenubarSheet {...props} />;
}

interface Size {
  width: number;
  height: number;
}

/**
 * The frame of `view` where an absolutely placed child of `bar` at `origin` (its `left`/`top`)
 * would have to be to cover it: the title's frame as the morph's anchor is placed. Null where
 * the platform cannot measure (a test renderer).
 */
function frameFor(
  view: ComponentRef<typeof View> | null,
  bar: ComponentRef<typeof View> | null,
  anchor: ComponentRef<typeof View> | null,
  origin: { left: number; top: number },
): [number, number, number, number] | null {
  type Measurable = {
    measureLayout?: (
      relativeTo: unknown,
      onSuccess: (x: number, y: number, width: number, height: number) => void,
      onFail?: () => void,
    ) => void;
  };
  const measure = (node: unknown) => {
    let frame: [number, number, number, number] | null = null;
    const target = node as Measurable | null;
    if (typeof target?.measureLayout !== 'function' || !bar) return null;
    // Fabric measures synchronously, from the shadow tree.
    target.measureLayout(
      bar,
      (x, y, width, height) => {
        frame = [x, y, width, height];
      },
      () => {},
    );
    return frame as [number, number, number, number] | null;
  };
  const title = measure(view);
  const at = measure(anchor);
  if (!title || !at) return null;
  // The anchor's own place tells where its `left: 0, top: 0` is in the bar (its border).
  return [title[0] - (at[0] - origin.left), title[1] - (at[1] - origin.top), title[2], title[3]];
}

function MenubarViewport() {
  const bar = useMenubar();
  const PopupSurface = usePopupSurface();
  const instant = usePrefersReducedMotion();
  const { layers, current, retire } = useMenubarLayers(
    bar.viewport,
    PopupSurface ? bar.value : undefined,
    instant,
  );
  const opened = useOpenCount(current !== undefined);
  if (!PopupSurface || !current) return null;
  return (
    <MenubarPopup
      key={opened}
      PopupSurface={PopupSurface}
      layers={layers}
      current={current}
      retire={retire}
    />
  );
}

/** The bar's menu as one platform popup, its layers inside. */
function MenubarPopup({
  PopupSurface,
  layers,
  current,
  retire,
}: {
  PopupSurface: ComponentType<PopupSurfaceProps>;
  layers: readonly MenubarLayer[];
  current: MenubarLayer;
  retire: (key: number) => void;
}) {
  const bar = useMenubar();
  const common = useCommonMessages();
  const { props, menu } = current.entry;
  // The open layer's keyboard navigation: the platform's keys go to it.
  const navigation = useRef<PopupNavigation | null>(null);
  // The view the popup hangs from while it changes from one menu into another: a box in the bar
  // moved from one title's frame to the next's, the platform placing the popup against it.
  const morphAnchor = useRef<ComponentRef<typeof View> | null>(null);
  // Each layer's size as laid out, by key.
  const [sizes, setSizes] = useState<ReadonlyMap<number, Size>>(() => new Map());
  const measured = useCallback((key: number, { width, height }: Size) => {
    setSizes((prev) => {
      const was = prev.get(key);
      if (was && was.width === width && was.height === height) return prev;
      return new Map(prev).set(key, { width, height });
    });
  }, []);
  // The open menu's title frame, as the morph's anchor would cover it.
  const [title, setTitle] = useState<{
    key: number;
    frame: [number, number, number, number] | null;
  } | null>(null);
  const placed = useRef({ left: 0, top: 0 });
  useIsomorphicLayoutEffect(() => {
    setTitle({
      key: current.key,
      frame: frameFor(
        menu.anchorRef.current,
        bar.barRef.current,
        morphAnchor.current,
        placed.current,
      ),
    });
  }, [current.key]);
  // The menu the popup opened with shows at once, as a menu opening does; each one after it once
  // it is laid out and its title measured, so the change starts from both menus' real sizes.
  const [first] = useState(current.key);
  const instant = usePrefersReducedMotion();
  const size = sizes.get(current.key);
  // With Reduce Motion the popup changes at once: nothing to wait for.
  const revealed =
    current.key === first || instant || (size !== undefined && title?.key === current.key);
  // Where the popup is going: the open title's frame and the open layer's size. Until the open
  // layer is revealed it stays where it is (`shown`); none until the first is known.
  const shownRef = useRef<readonly number[]>([]);
  const frame = title?.key === current.key ? title.frame : null;
  const target = revealed && size && frame ? [...frame, size.width, size.height] : shownRef.current;
  const shown = useEasedValues(target, MENU_MORPH_MOTION.duration, MORPH_EASING);
  shownRef.current = shown;
  const moving = shown.length === 6 && shown.some((value, index) => value !== target[index]);
  const morphing = layers.length > 1 || moving;
  if (shown.length === 6) placed.current = { left: shown[0] as number, top: shown[1] as number };

  return (
    <>
      <View
        ref={morphAnchor}
        collapsable={false}
        pointerEvents="none"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.anchor,
          shown.length === 6 && {
            left: shown[0],
            top: shown[1],
            width: shown[2],
            height: shown[3],
          },
        ]}
      />
      <PopupSurface
        // The open title while the popup rests; the box moving between titles while it changes.
        anchorRef={morphing && shown.length === 6 ? morphAnchor : menu.anchorRef}
        // The bar goes on taking the pointer while the menu is open: crossing onto another
        // title changes this popup into its menu (`MenubarTriggerButton`).
        trackingRef={bar.barRef}
        side={props.side ?? 'bottom'}
        align={props.align ?? 'start'}
        // The web's menubar defaults (`Menubar.web.tsx`): the menu's edge under its title's label.
        sideOffset={props.sideOffset ?? MENUBAR_SIDE_OFFSET}
        alignOffset={props.alignOffset ?? MENUBAR_ALIGN_OFFSET}
        role="menu"
        label={props.label ?? common.menu}
        // Closed by the platform on an outside press (or a refused grab).
        onDismiss={() => menu.setOpen(false)}
        onKey={(key) => navigation.current?.onKey(key)}
        testID={props.testID}
      >
        {/* No edge of its own: each layer keeps the menu's 1px edge inside it, so the popup is
            exactly the open layer's size, whatever the scale's pixel grid. */}
        <PopupPanelSurface edge={0}>
          <View
            style={[
              styles.stage,
              morphing && [
                styles.changing,
                shown.length === 6 && { width: shown[4], height: shown[5] },
              ],
            ]}
          >
            {layers.map((layer) => (
              <PopupMenuLayer
                key={layer.key}
                layer={layer}
                PopupSurface={PopupSurface}
                revealed={layer.exiting ? false : revealed}
                currentRevealed={revealed}
                morphing={morphing}
                size={sizes.get(layer.key)}
                measured={measured}
                retire={retire}
                navigation={navigation}
              />
            ))}
          </View>
        </PopupPanelSurface>
      </PopupSurface>
    </>
  );
}

/** One menu in the bar's popup: the open one, or one it is changing from. */
function PopupMenuLayer({
  layer,
  PopupSurface,
  revealed,
  currentRevealed,
  morphing,
  size,
  measured,
  retire,
  navigation: openNavigation,
}: {
  layer: MenubarLayer;
  PopupSurface: ComponentType<PopupSurfaceProps>;
  /** The open layer, laid out: it shows. */
  revealed: boolean;
  /** The open layer shows: a layer leaving goes. */
  currentRevealed: boolean;
  /** The popup is changing: every layer is laid out over the others at its own size. */
  morphing: boolean;
  size: Size | undefined;
  measured: (key: number, size: Size) => void;
  retire: (key: number) => void;
  navigation: React.MutableRefObject<PopupNavigation | null>;
}) {
  const { key, entry, exiting } = layer;
  const { menu, props, scope } = entry;
  const density = useMenuDensity(props.size);
  // Opened from the keys on a row: that row takes the screen reader's focus (`MenuRowShell`), not
  // the menu. Read before the navigation takes the intent, as the layer mounts (always as the
  // open one).
  const [openedOnRow] = useState(
    () => menu.focusIntent?.edge.current === 'first' || menu.focusIntent?.edge.current === 'last',
  );
  const close = useCallback(() => menu.setOpen(false), [menu]);
  // A layer leaving takes no intent: the next open of its menu is a layer of its own.
  const rows = usePopupNavigation(close, exiting ? undefined : menu.focusIntent);
  if (!exiting) {
    openNavigation.current = rows;
    menu.navigation.current = rows;
  }
  // Screen-reader focus moves into the menu as it opens (as `PopupPanel`'s), the menu replacing
  // another included; the title takes it back as the bar's menu closes (`TriggerSlot`).
  const focusRef = useAccessibilityFocus<ComponentRef<typeof View>>(!openedOnRow);
  const surface = useMemo<MenuSurfaceContextValue>(
    () => ({ close: menu.choose, presentation: 'dropdown' }),
    [menu.choose],
  );
  // The crossfade, eased as a transition: the open layer in once revealed, a leaving one out
  // once the open one shows (held where it is until then). The popup's first menu shows at once.
  const lastOpacity = useRef(revealed ? 1 : 0);
  const target = exiting ? (currentRevealed ? 0 : lastOpacity.current) : revealed ? 1 : 0;
  const [opacity = 0] = useEasedValues([target], MENU_MORPH_MOTION.duration, MORPH_EASING);
  lastOpacity.current = opacity;
  useEffect(() => {
    if (exiting && target === 0 && opacity === 0) retire(key);
  }, [exiting, target, opacity, retire, key]);
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => measured(key, event.nativeEvent.layout),
    [measured, key],
  );
  const { provider } = rows;
  const content = useMemo(
    () => (
      <MenubarMenuProvider value={menu}>
        {/* A leaving layer is out of the bar's declaration: its rows register nothing. */}
        <MenubarScopeProvider value={exiting ? null : scope}>
          <MenubarLeavingScope leaving={exiting}>
            <BloomScope size={props.size}>
              <PopupPanelScope PopupSurface={PopupSurface}>
                <MenuSurfaceProvider value={surface}>
                  <MenuRowAlignmentScope enabled={props.alignRows}>
                    <PopupPanelRows>{provider(props.children)}</PopupPanelRows>
                  </MenuRowAlignmentScope>
                </MenuSurfaceProvider>
              </PopupPanelScope>
            </BloomScope>
          </MenubarLeavingScope>
        </MenubarScopeProvider>
      </MenubarMenuProvider>
    ),
    [
      menu,
      exiting,
      scope,
      props.size,
      props.alignRows,
      props.children,
      PopupSurface,
      surface,
      provider,
    ],
  );
  return (
    <View
      // The screen reader's focus is sent to this view: it must be a view the platform has, never
      // one flattened away (a view of layout alone is not mounted, and the focus sent to it lands
      // nowhere).
      ref={focusRef}
      collapsable={false}
      pointerEvents={exiting ? 'none' : 'auto'}
      importantForAccessibility={exiting ? 'no-hide-descendants' : 'auto'}
      accessibilityElementsHidden={exiting}
      // While the popup changes, the open layer too is out of the stage's flow, laid out at its
      // own width: its size is the one the popup is going to, as it will rest.
      style={[styles.layer, (exiting || morphing) && styles.leaving, exiting && size, { opacity }]}
    >
      {/* The menu as it would be alone: its 1px edge and its padding, its 266px floor and its
          limits. Laid out at its own size whatever the surface's is now. */}
      <StyledView
        onLayout={exiting ? undefined : onLayout}
        className={props.className}
        style={[
          {
            padding: density.panelPadding + POPUP_PANEL_BORDER,
            minWidth: props.minWidth ?? MENU_WIDTH,
            maxWidth: props.maxWidth,
            maxHeight: props.maxHeight,
          },
          props.style,
        ]}
      >
        {content}
      </StyledView>
    </View>
  );
}

/** The menu's content: the bar's popup or a sheet, or the declaration alone where it is not drawn. */
export const MenubarContent = createMenubarContent(MenubarPanel);

/** The bar, its menus in one popup where the platform has popups. */
export const Menubar = createMenubar(MenubarViewport);

const rows = createMenubarRows(createMenuRows('Menubar', createInlineMenuSub));

export const MenubarItem = rows.Item;
export const MenubarCheckboxItem = rows.CheckboxItem;
export const MenubarRadioGroup = rows.RadioGroup;
export const MenubarRadioItem = rows.RadioItem;
export const MenubarLabel = rows.Label;
export const MenubarSeparator = rows.Separator;
export const MenubarShortcut = rows.Shortcut;
export const MenubarGroup = rows.Group;
export const MenubarSub = rows.Sub;
export const MenubarSubTrigger = rows.SubTrigger;
export const MenubarSubContent = rows.SubContent;

const styles = StyleSheet.create({
  // Out of the bar's layout, under no pointer and no assistive technology.
  anchor: { position: 'absolute', left: 0, top: 0, width: 0, height: 0 },
  // At rest the open layer flows in it, as a menu's rows do in its panel.
  stage: { overflow: 'hidden' },
  // Changing, a row: its layers, out of its flow, are each laid out at its own width (Yoga
  // measures a row's absolute child unconstrained), never squeezed to the surface's while the
  // surface grows towards it.
  changing: { flexDirection: 'row', alignItems: 'flex-start' },
  layer: { flexShrink: 0 },
  // A menu out of the stage's flow at the surface's corner: leaving, at the size it had; or
  // open while the popup changes.
  leaving: { position: 'absolute', left: 0, top: 0 },
});
