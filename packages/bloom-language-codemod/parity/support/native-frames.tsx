/**
 * The roots the before side is drawn in on native, as the app mounts them.
 *
 * - `appNative`: this checkout's Bloom with `BloomNativeWindTheme`
 *   (`nativewind-theme.tsx`), as an app still using `className` mounts Bloom 23.
 * - `bloom22Native`: Bloom 22, the last Bloom that took a class on its
 *   components (Bloom 23 has none), mounted as an app on Bloom 22 mounts it; its
 *   provider hands the theme's variables to NativeWind. Only a region that hands
 *   a Bloom component a class (`bloom22` on the case) is drawn in it.
 *
 * `bloom-22` carries one patch (`patches/@oxy.so%2Fbloom@22.1.11.patch`): Bloom
 * 23's Android fix to the Screen's root (`collapsable={false}`, 22e4fc8d0), which
 * Bloom 22 lacks, so a region in a Screen differs only by what the codemod wrote.
 */
import type { ReactNode } from 'react';
import {
  PortalOutlet as PortalOutlet22,
  PortalProvider as PortalProvider22,
} from 'bloom-22/portal';
import { BloomThemeProvider as BloomThemeProvider22 } from 'bloom-22/theme';
import { PortalOutlet, PortalProvider } from '@oxy.so/bloom/portal';
import { BloomThemeProvider } from '@oxy.so/bloom/theme';

import type { NativeFrame } from '../../../bloom-language/parity/support/native';
import { NativeWindTheme } from './nativewind-theme';
export const appNative: NativeFrame = (element: ReactNode, scheme) => (
  <BloomThemeProvider fonts={false} mode={scheme}>
    <NativeWindTheme>
      <PortalProvider>
        {element}
        <PortalOutlet />
      </PortalProvider>
    </NativeWindTheme>
  </BloomThemeProvider>
);

export const bloom22Native: NativeFrame = (element: ReactNode, scheme) => (
  <BloomThemeProvider22 fonts={false} mode={scheme}>
    <PortalProvider22>
      {element}
      <PortalOutlet22 />
    </PortalProvider22>
  </BloomThemeProvider22>
);
