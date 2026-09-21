import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppShell } from '../../src/app-shell/index.web';
import { PageHeader } from '../../src/page-header';
import { Text } from '../../src/typography';
import { useTheme } from '../../src/theme/use-theme';
import { RiHome5Line } from '../../src/icons/remix/RiHome5Line';
import { RiCompass3Line } from '../../src/icons/remix/RiCompass3Line';
import { RiBookmarkLine } from '../../src/icons/remix/RiBookmarkLine';
import { RiLayoutGridLine } from '../../src/icons/remix/RiLayoutGridLine';

const destinations = [
  { value: 'home', label: 'Home', icon: <RiHome5Line /> },
  { value: 'explore', label: 'Explore', icon: <RiCompass3Line /> },
  { value: 'saved', label: 'Saved', icon: <RiBookmarkLine /> },
  { value: 'collections', label: 'Collections', icon: <RiLayoutGridLine /> },
];

/** Neutral space markers, not a loading request or a post component. */
function Placeholder({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  return <View accessible={false} aria-hidden style={{ height: compact ? 104 : 260, borderRadius: 16, backgroundColor: colors.backgroundSecondary }} />;
}

function SocialLayout({ showRightColumn = true, centerWidth = 620, framedContent = true, tallContext = false, gutter = 16 }: {
  showRightColumn?: boolean; centerWidth?: number; framedContent?: boolean; tallContext?: boolean; gutter?: number;
}) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState('home');
  const title = destinations.find(item => item.value === selected)?.label ?? 'Home';
  return (
    <AppShell
      testID="social"
      variant="feed"
      scroll="document"
      navigationAlign="content"
      navigation={destinations}
      value={selected}
      onValueChange={setSelected}
      navFrom={700}
      navExpandedFrom={1100}
      sidebar={{ surface: 'plain', size: 'lg', searchShortcut: false, logo: { wordmark: 'Social', accessibilityLabel: 'Social home', onPress: () => setSelected('home') } }}
      contentWidth={centerWidth}
      gutter={gutter}
      panel={framedContent}
      header={<PageHeader title={title} presentation="floating" />}
      asideFrom={1180}
      asideWidth={268}
      asideCollapse="hidden"
      aside={showRightColumn ? <View role="complementary" accessibilityLabel="Context column" style={{ paddingTop: 24, paddingBottom: 24, gap: 32 }}>
        <Text variant="headline-semibold">Contexto</Text>
        <Placeholder compact />
        <Placeholder compact />
        <Text variant="headline-semibold">Información adicional</Text>
        {Array.from({ length: tallContext ? 8 : 1 }, (_, index) => <Placeholder compact key={index} />)}
        <Text variant="caption-1-medium" style={{ color: colors.textSecondary }}>Final del contexto.</Text>
      </View> : undefined}
    >
      <View testID="social-main" role="main" accessibilityLabel={`${title} layout`} style={{ gap: 32 }}>
        <View style={{ gap: 8 }}>
          <Text variant="title-2-semibold">Contenido principal</Text>
          <Text style={{ color: colors.textSecondary }}>Espacio reservado para el contenido.</Text>
        </View>
        {Array.from({ length: 5 }, (_, index) => <Placeholder key={index} />)}
        <Text style={{ color: colors.textSecondary }}>Final del contenido.</Text>
      </View>
    </AppShell>
  );
}

const meta = {
  title: 'Templates/Social', component: SocialLayout,
  parameters: { layout: 'fullscreen', bloomScroll: 'document' },
  args: { showRightColumn: true, centerWidth: 620, framedContent: true, tallContext: false, gutter: 16 },
  argTypes: {
    gutter: { control: { type: 'range', min: 8, max: 40, step: 4 }, description: 'Shared gutter for the panel frame, mask and sticky header.' },
    framedContent: { control: 'boolean', description: 'Wrap the reading column in Bloom’s tonal ContentPanel.' },
    showRightColumn: { control: 'boolean', description: 'Show the contextual column from 1180px.' },
    centerWidth: { control: { type: 'range', min: 480, max: 650, step: 10 }, description: 'Maximum reading width; contracts on smaller screens.' },
    tallContext: { control: 'boolean', description: 'Verify a context column taller than the viewport still uses document scroll.' },
  },
} satisfies Meta<typeof SocialLayout>;
export default meta;
type Story = StoryObj<typeof meta>;
export const LightOlive: Story = { globals: { theme: 'light', colorPreset: 'olive' } };
export const DarkOlive: Story = { globals: { theme: 'dark', colorPreset: 'olive' } };
export const Copper: Story = { globals: { theme: 'dark', colorPreset: 'copper-field' } };
export const OpenColumns: Story = { globals: { theme: 'light', colorPreset: 'olive' }, args: { framedContent: false } };
export const TallContext: Story = { globals: { theme: 'light', colorPreset: 'olive' }, args: { tallContext: true } };
