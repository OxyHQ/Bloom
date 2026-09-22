import React, { useCallback, useEffect, useRef } from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import { useSurfaceFill } from '../styles/surface-levels';
import { Z_INDEX } from '../styles/z-index';
import { WEB_POSITION_STICKY, webSurfaceStickyTopPlus, type WebCssStyle } from '../styles/web-view-style';
import { useHeaderDockContext } from './header-dock';
import { useTopEdgeInset } from './top-edge';

export interface StickySectionProps extends ViewProps {
  /** Native: this sticky child's Y in the list content, measured by its owner. */
  offset?: number;
}

/** One docking section. Native lists retain ownership of stickyHeaderIndices. */
export function StickySection({children, offset, style, onLayout, ...props}: StickySectionProps) {
  const dock = useHeaderDockContext();
  const top = useTopEdgeInset();
  const fill = useSurfaceFill();
  const marker = useRef<View>(null);
  const section = useRef<View>(null);
  const owner = useRef({});
  const measure = useCallback(() => {
    if (!dock) return;
    dock.owner.current = owner.current;
    if (Platform.OS !== 'web') {
      if (offset !== undefined) dock.sectionOffset.value = offset;
      return;
    }
    const anchor = marker.current as unknown as HTMLElement | null;
    const sticky = section.current as unknown as HTMLElement | null;
    if (!anchor?.getBoundingClientRect || !sticky) return;
    // The zero-height marker remains in normal flow while the section sticks.
    // Its coordinate is measured against the actual scrolling viewport.
    let viewportTop = 0;
    for (let parent = anchor.parentElement; parent; parent = parent.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) {
        viewportTop = parent.getBoundingClientRect().top + parent.clientTop;
        break;
      }
    }
    const stickyTop = Number.parseFloat(getComputedStyle(sticky).top) || top;
    dock.sectionOffset.value = anchor.getBoundingClientRect().top - viewportTop + dock.scrollY.value - stickyTop + top;
  }, [dock, offset, top]);
  useEffect(() => {
    measure();
    if (Platform.OS !== 'web') return;
    const anchor = marker.current as unknown as HTMLElement | null;
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    // Ancestor size changes cover delayed hero images/fonts without a scroll listener.
    for (let element = anchor?.parentElement; element; element = element.parentElement) observer?.observe(element);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [measure]);
  useEffect(() => () => {
    if (dock?.owner.current === owner.current) {
      dock.owner.current = null;
      dock.sectionOffset.value = Number.POSITIVE_INFINITY;
    }
  }, [dock]);
  const stickyStyle: WebCssStyle = Platform.OS === 'web'
    ? {position:WEB_POSITION_STICKY, top:webSurfaceStickyTopPlus(top), zIndex:Z_INDEX.raised}
    : {zIndex:Z_INDEX.raised};
  return <>
    {Platform.OS === 'web' && <View ref={marker} pointerEvents="none" style={{height:0}} />}
    <View {...props} ref={section} onLayout={event => {measure(); onLayout?.(event);}}
      style={[stickyStyle, {backgroundColor:fill}, style]}>{children}</View>
  </>;
}
