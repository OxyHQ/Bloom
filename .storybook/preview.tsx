import React from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';

// The compiled Tailwind/NativeWind stylesheet. This import is what makes every
// `className` in the library resolve to a rule — see `.storybook/tailwind.css`
// for why the harness is useless, not merely incomplete, without it.
import './tailwind.css';
import './preview.css';
import { CHARACTER_RUNTIME_URL } from '../runtime/avatar-runtime';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AgentAvatarProvider } from '../src/agent-avatar/AgentAvatarProvider';
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
 * templates declare their scroll owner: document stories grow naturally, while
 * contained app demos receive a bounded viewport.
 */
const withProviders: Decorator = (Story, context) => {
  const documentScroll = context.parameters.bloomScroll === 'document';
  const viewportHeight = context.viewMode === 'docs' ? 'min(760px, 80vh)' : '100dvh';
  const mode = (context.globals.theme as 'light' | 'dark' | 'system') ?? 'light';
  const requestedPreset = context.globals.colorPreset as AppColorName;
  const colorPreset = Object.prototype.hasOwnProperty.call(APP_COLOR_PRESETS, requestedPreset)
    ? requestedPreset
    : 'oxy';

  return (
    <SafeAreaProvider>
      <BloomThemeProvider mode={mode} colorPreset={colorPreset}>
        <PortalProvider>
          <AgentAvatarProvider runtimeUrl={CHARACTER_RUNTIME_URL}>
            <SurfaceProvider>
              <div
                data-bloom-story-layout={context.parameters.layout ?? 'padded'}
                data-bloom-story-view={context.viewMode}
                data-bloom-story-scroll={documentScroll ? 'document' : 'contained'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: context.parameters.layout === 'fullscreen' ? 'stretch' : 'flex-start',
                  width: '100%',
                  minWidth: 0,
                  minHeight:
                    documentScroll && context.parameters.layout === 'fullscreen'
                      ? viewportHeight
                      : 0,
                  ...(context.parameters.layout === 'fullscreen' && !documentScroll
                    ? { height: viewportHeight }
                    : {}),
                }}
              >
                <Story />
              </div>
              <PortalOutlet />
            </SurfaceProvider>
          </AgentAvatarProvider>
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
       * Foundations: design vocabulary and tokens.
       * Composition: contracts shared by fields, screens, navigation and overlays.
       * Components: reusable controls and content, grouped by purpose.
       * Patterns: complete workflows assembled from those components.
       * Templates: full applications in `templates/`, unpublished.
       * Labs: development diagnostics, separate from the consumer catalogue.
       *
       * Titles describe navigation; explicit meta.id keeps existing URLs stable.
       * Classification and contribution rules: .storybook/CATALOG.md.
       */
      storySort: {
        order: [
          'Foundations',
          [
            'Color',
            'Color Roles',
            'Color System Playground',
            'Design Tokens',
            'Typography',
            'Fonts',
            'Icons',
            'Shapes',
            'Surface Levels',
            'Motion',
          ],
          'Composition',
          [
            'Overview',
            'Provider',
            'Scope',
            'Fields',
            'Layout',
            ['App Shell', 'Screen', 'Content Panel', 'Page Header', 'Page Footer'],
            'Navigation',
            'Scrolling',
            'Overlays',
            'Motion',
            'Images',
            'Hooks',
          ],
          'Components',
          [
            'Actions',
            'Inputs',
            'Navigation',
            'Data Display',
            'Feedback',
            'Surfaces',
            'Overlays',
            'Media',
            'Chat',
            'Agents',
            'Maps',
            'Charts',
          ],
          'Patterns',
          ['Account', 'Forms', 'Chat', 'Agents', 'Productivity', '*'],
          'Templates',
          'Labs',
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
          value,
          title: preset.name,
        })),
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
