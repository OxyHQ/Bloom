import { useEffect } from 'react';
import { hostElement } from '../floating/menu-keyboard';
import type { DropdownMenuContextValue } from './context';

/** Hover intent belongs to the existing menu; its trigger keeps the primary press. */
export function useHoverMenuTrigger(
  menu: DropdownMenuContextValue,
  disabled: boolean,
  primaryAction: boolean,
) {
  useEffect(() => {
    const node = hostElement(menu.anchorRef.current);
    const hover = menu.hover;
    if (!node || !hover || disabled || menu.activation !== 'hover') return;
    const enter = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') hover.enter();
    };
    const leave = (event: PointerEvent) => {
      if (
        event.pointerType !== 'touch' &&
        !hostElement(menu.panelRef?.current)?.contains(document.activeElement)
      )
        hover.hide();
    };
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      try {
        if (!event.target.matches(':focus-visible')) return;
      } catch {
        // Older DOM engines have focus without the focus-visible selector.
      }
      hover.show();
    };
    const blur = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && node.contains(event.relatedTarget)) return;
      hover.hide();
    };
    const press = () => {
      if (primaryAction) hover.dismiss();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') hover.hold();
      if (primaryAction && (event.key === 'Enter' || event.key === ' ')) hover.dismiss();
    };
    node.addEventListener('pointerenter', enter);
    node.addEventListener('pointerleave', leave);
    node.addEventListener('pointerdown', press);
    node.addEventListener('focusin', focus);
    node.addEventListener('focusout', blur);
    node.addEventListener('keydown', key);
    return () => {
      node.removeEventListener('pointerenter', enter);
      node.removeEventListener('pointerleave', leave);
      node.removeEventListener('pointerdown', press);
      node.removeEventListener('focusin', focus);
      node.removeEventListener('focusout', blur);
      node.removeEventListener('keydown', key);
    };
  }, [menu.activation, menu.anchorRef, menu.hover, menu.panelRef, disabled, primaryAction]);
}

/** Focus inside an interactive preview holds it just like its pointer bridge. */
export function useHoverMenuPanel(menu: DropdownMenuContextValue, panel: HTMLElement | null) {
  useEffect(() => {
    const hover = menu.hover;
    if (!panel || !hover || menu.activation !== 'hover' || !menu.open) return;
    const focus = () => hover.hold();
    const blur = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && panel.contains(event.relatedTarget)) return;
      hover.hide();
    };
    panel.addEventListener('focusin', focus);
    panel.addEventListener('focusout', blur);
    return () => {
      panel.removeEventListener('focusin', focus);
      panel.removeEventListener('focusout', blur);
    };
  }, [menu.activation, menu.hover, menu.open, panel]);
}
