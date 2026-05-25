import React from 'react';
import { View } from 'react-native';
import type { Decorator, Preview } from '@storybook/react-vite';

import { BloomThemeProvider } from '../src/theme';
import { BloomDialogProvider } from '../src/dialog';
import { Provider as PortalProvider, Outlet as PortalOutlet } from '../src/portal';

/**
 * Global decorator. Every Bloom story renders inside the full provider
 * stack consuming apps use:
 *
 *   <BloomThemeProvider>   theme + fonts
 *     <PortalProvider>     portal host (menus, tooltips)
 *       <BloomDialogProvider>  imperative alert() host
 *         <story />
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
    <BloomThemeProvider mode={mode} colorPreset={colorPreset} fonts={false}>
      <PortalProvider>
        <BloomDialogProvider>
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
        </BloomDialogProvider>
      </PortalProvider>
    </BloomThemeProvider>
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
      storySort: {
        order: [
          'Introduction',
          'Foundations',
          ['Theme', 'Typography', 'Icons'],
          'Components',
          [
            'Button',
            'Dialog',
            'BottomSheet',
            'Toast',
            'Avatar',
            'TextField',
            'Loading',
            'Menu',
            'Select',
            'ContextMenu',
            'PromptInput',
            'SettingsList',
          ],
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
