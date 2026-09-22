import React, { createContext, useContext, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useScreenContext } from '../screen/context';
import { useScrollOffset } from './scroll-offset';
import { TopEdgeProvider, useTopEdgeInset } from './top-edge';

interface HeaderDockState {
  scrollY: SharedValue<number>;
  headerHeight: SharedValue<number>;
  overlay: SharedValue<boolean>;
  overlaps: boolean;
  setOverlaps: React.Dispatch<React.SetStateAction<boolean>>;
  sectionOffset: SharedValue<number>;
  progress: SharedValue<number>;
  owner: React.MutableRefObject<object | null>;
}
const HeaderDockContext = createContext<HeaderDockState | null>(null);
export function useHeaderDockContext() { return useContext(HeaderDockContext); }

/** Native lists already below an inline header need no additional clearance. */
export function useHeaderDockInset(): number {
  const dock = useHeaderDockContext();
  const height = useTopEdgeInset();
  return Platform.OS === 'web' || dock?.overlaps ? height : 0;
}

/** Pairs one header and its docking section without rendering on scroll frames. */
export function HeaderDockProvider({ children, scrollY: supplied }: PropsWithChildren<{ scrollY?: SharedValue<number> }>) {
  const screen = useScreenContext();
  const contextual = useScrollOffset();
  const rest = useSharedValue(0);
  const scrollY = supplied ?? screen?.scrollY ?? contextual ?? rest;
  const headerHeight = useSharedValue(0);
  const overlay = useSharedValue(false);
  const [overlaps, setOverlaps] = useState(false);
  const sectionOffset = useSharedValue(Number.POSITIVE_INFINITY);
  const owner = useRef<object | null>(null);
  const progress = useDerivedValue(() => Math.min(1, Math.max(0, (scrollY.value - sectionOffset.value + (Platform.OS === 'web' || overlay.value ? headerHeight.value : 0) + 12) / 12)), [scrollY, sectionOffset, headerHeight, overlay]);
  const value = useMemo(() => ({scrollY,headerHeight,sectionOffset,progress,owner,overlay,overlaps,setOverlaps}), [scrollY,headerHeight,sectionOffset,progress,overlay,overlaps]);
  return <TopEdgeProvider><HeaderDockContext.Provider value={value}>{children}</HeaderDockContext.Provider></TopEdgeProvider>;
}
