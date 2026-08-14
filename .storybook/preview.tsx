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
 * `fonts` is left at its default (`true`) DELIBERATELY. This harness passed
 * `fonts={false}` for months: every story still looked fine, because a missing
 * `@font-face` falls back to a system face rather than failing, so the harness
 * covered the whole font system with nothing while reporting green. A gate that
 * opts out of the default every consumer ships is not a gate. On web the loader
 * is synchronous (`applyFontFaces()` during render, `font-display: swap`), so
 * there is no render cost to pay for the coverage.
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
      <BloomThemeProvider mode={mode} colorPreset={colorPreset}>
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
       * looking. Four groups, and the boundaries are behavioural rather than
       * visual — a finer split (Actions / Layout / Navigation / Feedback) reads
       * well in a sidebar and then puts `Toast` and `Dialog` in different
       * places, which is the question a reader is actually asking.
       *
       *   Foundations   not a component you place — theme, tokens, type, icons,
       *                 motion
       *   Forms         inputs and controls: things you fill in or choose with
       *   Overlays      anything that opens over the page and dismisses,
       *                 whoever opened it (Dialog, BottomSheet, Toast, Command)
       *   Data Display  things whose job is to show you a value or a person
       *   Components    everything else
       */
      storySort: {
        order: [
          'Introduction',
          'Foundations',
          ['Theme', 'Design Tokens', 'Typography', 'Icons', 'Motion'],
          'Components',
          'Forms',
          'Overlays',
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
