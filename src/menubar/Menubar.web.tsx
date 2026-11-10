import { BloomScope } from '../appearance';
/**
 * `Menubar` — WEB: the bar's menus are ONE anchored panel from `floating/FloatingPanel`
 * (`viewport.tsx`) rather than a sheet.
 *
 * Moving to another menu while one is open changes that panel into the next menu, as a Mac's
 * bar does: it moves under the new title and takes the new menu's size, both CSS transitions
 * on the menu motion (`MENU_MORPH_MOTION`), while the two menus' rows crossfade; at once with
 * Reduce Motion. The native fork does the same in the platform's one popup.
 *
 * The bar, the per-menu state and the trigger are identical on both platforms and live in
 * `MenubarBase`. What forks is this file: the surface a menu opens into, and which sub-menu the
 * rows get — a FLYOUT here, which needs a pointer.
 *
 * `align="start"` and the 266px floor are what make a menubar menu hang under its trigger the
 * way a desktop menu bar does, rather than centring like a popover.
 */
import React, {
  type ComponentRef,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';

import {
  MENU_MORPH_MOTION,
  MENU_MOTION_DURATION,
  MENU_WIDTH,
  MENUBAR_ALIGN_OFFSET,
  MENUBAR_SIDE_OFFSET,
  VIEWPORT_GUTTER,
} from '../floating/constants';
import { MenuSurfaceProvider, type MenuSurfaceContextValue } from '../floating/context';
import { MenuRowAlignmentScope } from '../floating/menu-row-alignment';
import { FloatingPanel } from '../floating/FloatingPanel';
import { hostElement, useMenuPanelKeys } from '../floating/menu-keyboard';
import { createMenuRows } from '../floating/menu-rows';
import { createFlyoutMenuSub } from '../floating/menu-sub-flyout';
import { useAnchorRect } from '../floating/use-anchor-rect';
import { useMenuDensity } from '../floating/use-menu-density';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { ScrollArea } from '../layout/ScrollArea.web';
import { motionCss } from '../motion/spec';
import { StyledView } from '../styles/styled-primitives';
import type { WebCssStyle } from '../styles/web-view-style';
import { MenubarMenuProvider, MenubarScopeProvider, useMenubar } from './context';
import { createMenubarContent, createMenubarRows } from './declared';
import { createMenubar } from './MenubarBase';
import {
  type MenubarLayer,
  MenubarLeavingScope,
  MenubarViewportContent,
  useMenubarLayers,
} from './viewport';
import { useCommonMessages } from '../locale/common-messages';

export { MenubarMenu, MenubarTrigger } from './MenubarBase';

/** The panel's 1px edge, inside which the layers sit. */
const EDGE = 1;

const NO_ANCHOR = { current: null };

interface Size {
  width: number;
  height: number;
}

/** A host element's layout box: untransformed (the panel scales as it opens), whole pixels. */
function boxOf(node: unknown): Size | null {
  const element = hostElement(node);
  if (!element) return null;
  return { width: element.offsetWidth, height: element.offsetHeight };
}

function MenubarViewport() {
  const bar = useMenubar();
  const instant = usePrefersReducedMotion();
  const common = useCommonMessages();
  const { layers, current, retire } = useMenubarLayers(bar.viewport, bar.value, instant);
  const open = current !== undefined;
  // Closing, the panel keeps the menu it showed while it animates out (`FloatingPanel`'s exit):
  // as a layer leaving, out of the declaration (the content's own headless declaration has it).
  const lastShown = useRef<readonly MenubarLayer[]>([]);
  if (open) lastShown.current = layers;
  const shown = open
    ? layers
    : lastShown.current.slice(-1).map((layer) => ({ ...layer, exiting: true }));
  const showing = open ? current : shown[0];
  const entry = showing?.entry;
  const anchor = useAnchorRect(entry?.menu.anchorRef ?? NO_ANCHOR, open);
  const { height: viewportHeight } = useWindowDimensions();

  const [panel, setPanel] = useState<ComponentRef<typeof View> | null>(null);
  const layerNodes = useRef(new Map<number, ComponentRef<typeof View>>());
  // Each layer's size as last laid out, and the panel's while it rests (its edge around a layer).
  const sizes = useRef(new Map<number, Size>());
  const resting = useRef<Size | null>(null);
  // Where the panel is going as it changes into the open menu: that menu's size, once measured.
  const [target, setTarget] = useState<{ key: number; size: Size } | null>(null);
  const morphing = open && (layers.length > 1 || (target !== null && target.key === current?.key));

  // Each commit: the layers' sizes, and the panel's while it rests. A layer that just became the
  // open one is measured before the frame paints and the panel set off towards its size; that
  // read also lands the panel's style at the size it had, so the transition starts from there.
  useLayoutEffect(() => {
    for (const [key, node] of layerNodes.current) {
      const size = boxOf(node);
      if (size) sizes.current.set(key, size);
    }
    for (const key of [...sizes.current.keys()]) {
      if (!layerNodes.current.has(key)) sizes.current.delete(key);
    }
    if (!open || !current) return;
    if (!morphing) {
      resting.current = boxOf(panel);
      return;
    }
    if (target?.key === current.key) return;
    const size = sizes.current.get(current.key);
    if (size) {
      setTarget({
        key: current.key,
        size: { width: size.width + 2 * EDGE, height: size.height + 2 * EDGE },
      });
    }
  });

  // Once the panel has reached the open menu, the menus it changed from go; then it rests,
  // sized by the open menu again.
  const leaving = useRef(layers);
  leaving.current = layers;
  const currentKey = current?.key;
  useLayoutEffect(() => {
    if (!target || target.key !== currentKey) return undefined;
    const timer = setTimeout(
      () => {
        for (const layer of leaving.current) if (layer.exiting) retire(layer.key);
        setTarget((now) => (now === target ? null : now));
      },
      instant ? 0 : MENU_MORPH_MOTION.duration,
    );
    return () => clearTimeout(timer);
  }, [target, currentKey, retire, instant]);

  if (!entry || !showing) return null;
  const { props } = entry;
  const revealed = target !== null && target.key === current?.key;
  const motion = motionCss(MENU_MORPH_MOTION, instant);
  const heightCeiling = Math.max(
    0,
    Math.min(viewportHeight - VIEWPORT_GUTTER * 2, props.maxHeight ?? Infinity),
  );
  const size = morphing ? (revealed ? target.size : (target?.size ?? resting.current)) : null;

  const panelMotion: WebCssStyle = {
    transitionProperty: morphing ? 'box-shadow, left, top, width, height' : 'box-shadow',
    transitionDuration: morphing
      ? `${instant ? 0 : MENU_MOTION_DURATION}ms, ${motion.duration}, ${motion.duration}, ${motion.duration}, ${motion.duration}`
      : `${instant ? 0 : MENU_MOTION_DURATION}ms`,
    transitionTimingFunction: morphing
      ? `ease-out, ${motion.easing}, ${motion.easing}, ${motion.easing}, ${motion.easing}`
      : 'ease-out',
  };

  return (
    <FloatingPanel
      panelRef={setPanel}
      open={open}
      anchor={anchor}
      role="menu"
      surface="menu"
      label={props.label ?? common.menu}
      side={props.side}
      align={props.align ?? 'start'}
      // `alignOffset={-4} sideOffset={8}` — upstream's own defaults, which pull the menu back
      // over its trigger's `p-1` so its left edge lines up with the trigger's label rather than
      // with the bar's border.
      sideOffset={props.sideOffset ?? MENUBAR_SIDE_OFFSET}
      alignOffset={props.alignOffset ?? MENUBAR_ALIGN_OFFSET}
      dismissible={props.dismissible}
      // The one non-modal surface of the four. A menubar's defining interaction is moving
      // between its menus, and a press-catching backdrop turns that into two clicks: the first
      // is eaten closing the open menu, the second finally reaches the sibling trigger. Without
      // a backdrop the press dismisses this menu AND lands on the trigger, which opens the next.
      modal={false}
      maxHeight={props.maxHeight}
      onDismiss={() => bar.setValue(undefined)}
      // The layers scroll themselves: each is the menu as it would be alone.
      scroll="external"
      className={props.className}
      style={[
        // The edge alone: each layer carries the menu's padding. Inline, so it wins over the
        // density's padding class whatever order the two sheets are in.
        NO_PADDING,
        size && { width: size.width, height: size.height },
        // The panel's shadow fades as it always has; its place and size follow the open menu.
        panelMotion,
        props.style,
      ]}
      testID={props.testID}
    >
      <View style={styles.stage}>
        {shown.map((layer) => (
          <MenuLayer
            key={layer.key}
            layer={layer}
            // The open menu shows once measured (the same frame); a leaving one goes then.
            opacity={layer.exiting ? 0 : morphing && !revealed ? 0 : 1}
            frozen={layer.exiting && open ? sizes.current.get(layer.key) : undefined}
            fade={motion}
            heightCeiling={Math.max(0, heightCeiling - 2 * EDGE)}
            nodes={layerNodes.current}
          />
        ))}
      </View>
    </FloatingPanel>
  );
}

/** One menu in the bar's panel: the open one, or one the panel is changing from. */
function MenuLayer({
  layer,
  opacity,
  frozen,
  fade,
  heightCeiling,
  nodes,
}: {
  layer: MenubarLayer;
  opacity: number;
  /** A leaving layer keeps the size it had, over the open one. */
  frozen: Size | undefined;
  fade: { duration: string; easing: string };
  heightCeiling: number;
  nodes: Map<number, ComponentRef<typeof View>>;
}) {
  const { key, entry, exiting } = layer;
  const { menu, props, scope } = entry;
  const density = useMenuDensity(props.size);
  const [node, setNode] = useState<ComponentRef<typeof View> | null>(null);
  const attach = useCallback(
    (next: ComponentRef<typeof View> | null) => {
      if (next) nodes.set(key, next);
      else nodes.delete(key);
      setNode(next);
    },
    [nodes, key],
  );
  // Leaving: never focused, pressed or read (`inert`, which react-native-web does not pass).
  useLayoutEffect(() => {
    const element = hostElement(node);
    if (!element) return;
    if (exiting) element.setAttribute('inert', '');
    else element.removeAttribute('inert');
  }, [node, exiting]);
  const close = useCallback(() => menu.setOpen(false), [menu]);
  // The menu's keys on its own rows; a layer leaving has none, and takes no intent (the next
  // open of its menu is a layer of its own).
  useMenuPanelKeys(hostElement(node), {
    open: !exiting,
    onTab: close,
    intent: exiting ? undefined : menu.focusIntent,
  });
  // A row chosen closes the menu and leaves the bar's keyboard (`focusValue`).
  const surface = useMemo<MenuSurfaceContextValue>(
    () => ({ close: menu.choose, presentation: 'dropdown' }),
    [menu.choose],
  );
  const minWidth = (props.minWidth ?? (density.desktop ? density.minWidth : MENU_WIDTH)) - 2 * EDGE;
  const layerStyle: WebCssStyle = {
    minWidth,
    maxWidth: props.maxWidth === undefined ? undefined : props.maxWidth - 2 * EDGE,
    maxHeight: heightCeiling,
    padding: density.panelPadding,
    opacity,
    transitionProperty: 'opacity',
    transitionDuration: fade.duration,
    transitionTimingFunction: fade.easing,
    pointerEvents: exiting ? 'none' : 'auto',
  };
  return (
    <StyledView
      ref={attach}
      collapsable={false}
      aria-hidden={exiting || undefined}
      style={[styles.layer, exiting && frozen && [styles.leaving, frozen], layerStyle]}
    >
      <MenubarMenuProvider value={menu}>
        {/* A leaving layer is out of the bar's declaration: its rows register nothing. */}
        <MenubarScopeProvider value={exiting ? null : scope}>
          <MenubarLeavingScope leaving={exiting}>
            <BloomScope size={props.size}>
              <MenuSurfaceProvider value={surface}>
                <MenuRowAlignmentScope enabled={props.alignRows}>
                  <ScrollArea
                    style={styles.scroll}
                    contentContainerStyle={{ gap: density.gap }}
                    keyboardShouldPersistTaps="handled"
                  >
                    {props.children}
                  </ScrollArea>
                </MenuRowAlignmentScope>
              </MenuSurfaceProvider>
            </BloomScope>
          </MenubarLeavingScope>
        </MenubarScopeProvider>
      </MenubarMenuProvider>
    </StyledView>
  );
}

/** The menu's content: drawn in the bar's panel, or the declaration alone where it is not drawn. */
export const MenubarContent = createMenubarContent(MenubarViewportContent);

/** The bar, its menus in one anchored panel. */
export const Menubar = createMenubar(MenubarViewport);

const rows = createMenubarRows(createMenuRows('Menubar', createFlyoutMenuSub));

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

const NO_PADDING: ViewStyle = { padding: 0 };

const styles = StyleSheet.create({
  // A row: each layer is laid out at its own width (its rows' longest), never squeezed to the
  // panel's while the panel grows towards it.
  stage: { flexDirection: 'row', alignItems: 'flex-start' },
  layer: { flexShrink: 0 },
  // A menu leaving, over the open one at the panel's corner, at the size it had.
  leaving: { position: 'absolute', left: 0, top: 0 },
  scroll: { flexShrink: 1, minHeight: 0 },
});
