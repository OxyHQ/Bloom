import React from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';

// The compiled Tailwind/NativeWind stylesheet. This import is what makes every
// `className` in the library resolve to a rule — see `.storybook/tailwind.css`
// for why the harness is useless, not merely incomplete, without it.
import './tailwind.css';
import './preview.css';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BloomThemeProvider } from '../src/theme';
import { APP_COLOR_PRESETS, type AppColorName } from '../src/theme/color-presets';
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
 * Storybook owns canvas padding through `parameters.layout`. Fullscreen
 * templates receive a bounded viewport; docs and component stories stay in flow.
 */
const withProviders: Decorator = (Story, context) => {
  const mode = (context.globals.theme as 'light' | 'dark' | 'system') ?? 'light';
  const requestedPreset = context.globals.colorPreset as AppColorName;
  const colorPreset = Object.prototype.hasOwnProperty.call(APP_COLOR_PRESETS, requestedPreset) ? requestedPreset : 'oxy';

  return (
    <SafeAreaProvider>
      <BloomThemeProvider mode={mode} colorPreset={colorPreset}>
        <PortalProvider>
          <SurfaceProvider>
            <div
              data-bloom-story-layout={context.parameters.layout ?? 'padded'}
              data-bloom-story-view={context.viewMode}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: context.parameters.layout === 'fullscreen' ? 'stretch' : 'flex-start',
                width: '100%',
                minWidth: 0,
                minHeight: 0,
                ...(context.parameters.layout === 'fullscreen'
                  ? { height: context.viewMode === 'docs' ? 'min(760px, 80vh)' : '100dvh' }
                  : {}),
              }}
            >
              <Story />
            </div>
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
    layout: 'padded',
    controls: {
      expanded: true,
      sort: 'requiredFirst',
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      /**
       * The catalogue taxonomy:
       *
       *   Foundations   not a component you place — colour, tokens, type, fonts,
       *                 icons, motion, and the plumbing families (portal, scroll…)
       *   Base          the everyday building blocks, alphabetical
       *   Blocks        larger assemblies, ready to drop in
       *   Charts        data cards for dashboards
       *   Templates     complete screens composed from the above (`templates/`, unpublished)
       */
      storySort: {
        order: [
          'Introduction',
          'Foundations',
          ['Color', 'Color System Playground', 'Typography', 'Fonts', 'Icons', 'Design Tokens', 'Motion'],
          'Base',
          'Blocks',
          'Charts',
          'Templates',
        ],
        method: 'alphabetical',
      },
    },
  },
  initialGlobals: { theme: 'light', colorPreset: 'oxy' },
  globalTypes: {
    theme: {
      description: 'Theme mode for Bloom components',
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
      toolbar: {
        title: 'Color',
        icon: 'paintbrush',
        items: Object.entries(APP_COLOR_PRESETS).map(([value, preset]) => ({
          value, title: preset.name,
        })),
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
