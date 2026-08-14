import React from 'react';
import { View } from 'react-native';
import type { Decorator, Preview } from '@storybook/react-vite';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BloomThemeProvider } from '../src/theme';
import { SurfaceProvider } from '../src/surfaces';
import { PortalProvider, PortalOutlet } from '../src/portal';

/**
 * Global decorator. Every Bloom story renders inside the full provider
 * stack consuming apps use:
 *
 *   <SafeAreaProvider>     safe-area insets
 *     <BloomThemeProvider>   theme + fonts
 *       <PortalProvider>     portal host (menus, tooltips)
 *         <SurfaceProvider>  the surface stack — alert()/confirm()/prompt()
 *           <story />
 *
 * `SafeAreaProvider` is not optional: `BottomSheet` reads insets through
 * `useSafeAreaInsets`, which THROWS ("No safe area value available") outside a
 * provider. Without it every sheet-backed story — the sheet itself, and the
 * `Dialog`, `Menu`, `Select`, `ContextMenu` and `Popover` surfaces that render
 * through one — hit the story error boundary instead of rendering, so the
 * Storybook web gate silently covered none of them. Consuming apps mount this
 * provider at their root; the decorator matches them.
 *
 * On web (where Storybook runs) BloomThemeProvider applies CSS variables and
 * the dark class, so stories pick up theme palette colors immediately.
 *
 * The padded container gives stories breathing room and a consistent
 * background that respects the active theme.
 */
const withProviders: Decorator = (Story, context) => {
  const mode = (context.globals.theme as 'light' | 'dark' | 'system') ?? 'light';
  const colorPreset =
    (context.globals.colorPreset as
      | 'oxy'
      | 'mention'
      | 'allo'
      | 'homiio'
      | 'tnp'
      | undefined) ?? 'oxy';

  return (
    <SafeAreaProvider>
      <BloomThemeProvider mode={mode} colorPreset={colorPreset} fonts={false}>
        <PortalProvider>
          <SurfaceProvider>
            <View
              style={{
                padding: 24,
                minHeight: '100%',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                gap: 16,
              }}
            >
              <Story />
            </View>
            <PortalOutlet />
          </SurfaceProvider>
        </PortalProvider>
      </BloomThemeProvider>
    </SafeAreaProvider>
  );
};

const preview: Preview = {
  decorators: [withProviders],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      /**
       * ONE taxonomy, so a reader can predict where a family lives before
       * looking. The rule per group, in the order they appear:
       *
       *   Foundations   not a component you place — theme, tokens, type, icons,
       *                 motion, fonts, resolvers, the app root provider, hooks
       *   Layout        structure and space
       *   Actions       things you press
       *   Forms         things you fill in or choose with
       *   Navigation    moving between places or sections
       *   Overlays      surfaces YOU open, on top of the page
       *   Feedback      surfaces the SYSTEM shows you, and state indicators
       *   Data Display  things that show you something
       */
      storySort: {
        order: [
          'Introduction',
          'Foundations',
          ['Theme', 'Design Tokens', 'Typography', 'Icons', 'Motion'],
          'Layout',
          'Actions',
          'Forms',
          'Navigation',
          'Overlays',
          'Feedback',
          'Data Display',
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Theme mode for Bloom components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    colorPreset: {
      description: 'Bloom color preset',
      defaultValue: 'oxy',
      toolbar: {
        title: 'Color',
        icon: 'paintbrush',
        items: [
          { value: 'oxy', title: 'Oxy' },
          { value: 'mention', title: 'Mention' },
          { value: 'allo', title: 'Allo' },
          { value: 'homiio', title: 'Homiio' },
          { value: 'tnp', title: 'TNP' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
