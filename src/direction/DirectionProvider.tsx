import React, { useMemo, type ComponentType } from 'react';
import { Platform, type ViewProps } from 'react-native';
import { StyledView } from '../styles/styled-primitives';
import { DirectionContext, directionForLocale } from './context';
import type { DirectionProviderProps } from './types';

const DirectionView: ComponentType<ViewProps & { className?: string; dir?: 'ltr' | 'rtl'; lang?: string }> = StyledView;

export function DirectionProvider({ locale, children, className, style }: DirectionProviderProps) {
  const value = useMemo(() => ({ locale, direction: directionForLocale(locale) }), [locale]);
  return <DirectionContext.Provider value={value}>
    <DirectionView dir={value.direction} lang={locale} className={className} style={[Platform.OS === 'web' ? { display: 'contents' } : undefined, { direction: value.direction }, style]}>
      {children}
    </DirectionView>
  </DirectionContext.Provider>;
}
