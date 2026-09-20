import { ButtonGroup, ButtonGroupItem } from '../../src/button-group';
import { Screen, useScreen } from '../../src/screen';
import { PageHeader } from '../../src/page-header';
import { VirtualList } from '../../src/list/index.web';
import { BottomBar } from '../../src/bottom-bar/index.web';
import { Fab } from '../../src/fab/index.web';
import { useState } from 'react';
import { View, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../../src/app-shell/index.web';
import { BloomScope } from '../../src/appearance';
import { Button } from '../../src/button/index.web';
import { TextFieldInput } from '../../src/text-field';
import { Dialog, useDialogControl } from '../../src/dialog/index.web';
import { useTheme } from '../../src/theme/use-theme';
import * as Icons from '../../src/icons';
import type { AppShellNavigationPlacement } from '../../src/app-shell/types';
import type { BloomSize } from '../../src/appearance/types';

interface Args { bottomActionBehavior: 'hide' | 'visible'; sidebarSurface: 'card' | 'docked'; width: number; count: number; size: BloomSize; placement: AppShellNavigationPlacement; material: 'solid' | 'translucent'; action: boolean; scenario: 'feed' | 'form' | 'surfaces' }
function SystemDemo({ bottomActionBehavior, sidebarSurface, width, count, size, placement, material, action, scenario }: Args) {
  const [value, setValue] = useState('home');
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const { colors } = useTheme();
  const dialog = useDialogControl();
  const sheet = useDialogControl();
  return <BloomScope size={size}><View style={{ width: width > 0 ? width : '100%', maxWidth: '100%', flex: 1, minHeight: 0, alignSelf: 'center', backgroundColor: colors.background }}>
    <AppShell bottomActionBehavior={bottomActionBehavior} testID="system-shell" sidebar={{ surface: sidebarSurface }} header={<PageHeader title={scenario === 'form' ? 'Profile' : 'Community'} onBack={() => setValue('home')} actions={<ButtonGroup accessibilityLabel="Page actions"><ButtonGroupItem iconOnly leadingIcon={Icons.RiSearchLine} accessibilityLabel="Search" onPress={() => setValue('search')} /><ButtonGroupItem iconOnly leadingIcon={Icons.RiMore2Line} accessibilityLabel="More" onPress={() => dialog.open()} /></ButtonGroup>} />} title={scenario === 'form' ? 'Profile' : 'Community'} navigationPlacement={placement} navigationMaterial={material}
      navigation={[{ value: 'home', label: 'Home', icon: <Icons.RiHomeLine /> }, { value: 'search', label: 'Explore', icon: <Icons.RiSearchLine /> }, { value: 'profile', label: 'Profile', icon: <Icons.RiUserLine /> }]}
      value={value} onValueChange={setValue}
      primaryAction={action ? { icon: Icons.RiAddLine, tone: 'action', accessibilityLabel: 'Create post', onPress: () => dialog.open() } : undefined}>
      {scenario === 'form' ? <View style={{ gap: 16, maxWidth: 560 }}>
        <Text style={{ color: colors.text }}>Shared sizes, semantic colors and action states</Text>
        <TextFieldInput label="Display name" value={name} onValueChange={setName} invalid={saved && !name.trim()} />
        {saved && !name.trim() && <Text style={{ color: colors.error }}>Enter a display name.</Text>}
        <Button tone="action" onPress={() => setSaved(true)}>Save profile</Button>
        <Button disabled tone="neutral" appearance="subtle">Unavailable action</Button>
        <Button tone="action" loading>Saving preview</Button>
      </View> : <>
        {scenario === 'surfaces' && <View style={{ gap: 12 }}><Button tone="neutral" appearance="subtle" onPress={() => dialog.open()}>Open dialog</Button><Button tone="neutral" appearance="subtle" onPress={() => sheet.open()}>Open sheet</Button></View>}
        {count === 0 && <Text style={{ color: colors.textSecondary }}>No posts yet. Create the first one.</Text>}
        {Array.from({ length: count }, (_, i) => <View key={i} style={{ padding: 20, minHeight: 130, gap: 12, borderRadius: 20, backgroundColor: colors.backgroundSecondary }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>{['A place for new ideas', 'Made with care', 'A small everyday discovery'][i % 3]}</Text>
          <Text style={{ color: colors.textSecondary }}>Post {i + 1} · Scroll to check coordinated header and navigation motion.</Text>
          <Button tone="accent" appearance="plain" onPress={() => dialog.open()}>Read more</Button>
        </View>)}
      </>}
    </AppShell>
    <Dialog control={dialog} title="Create something" description="The screen remains behind this independent surface." actions={[{ label: 'Done' }]} />
    <Dialog control={sheet} placement="bottom" title="Screen actions" description="A sheet owns its geometry while the underlying screen preserves its offset." actions={[{ label: 'Done' }]} />
  </View></BloomScope>;
}
const meta: Meta<typeof SystemDemo> = { title: 'Templates/Coherent system', component: SystemDemo, parameters: { layout: 'fullscreen' }, args: { bottomActionBehavior: 'hide', sidebarSurface: 'card', width: 0, count: 12, size: 'md', placement: 'auto', material: 'translucent', action: true, scenario: 'feed' }, argTypes: { bottomActionBehavior: { control: 'select', options: ['hide', 'visible'] }, sidebarSurface: { control: 'select', options: ['card', 'docked'] }, width: { description: '0 fills the canvas; positive values preview a narrower host.', control: { type: 'select', labels: { 0: 'Canvas', 320: '320 px', 390: '390 px', 768: '768 px', 1024: '1024 px', 1200: '1200 px', 1440: '1440 px' } }, options: [0, 320, 390, 768, 1024, 1200, 1440] }, count: { control: { type: 'range', min: 0, max: 40, step: 1 } }, size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] }, placement: { control: 'select', options: ['auto', 'bottom', 'rail', 'sidebar'] }, material: { control: 'select', options: ['solid', 'translucent'] }, action: { control: 'boolean' }, scenario: { control: 'select', options: ['feed', 'form', 'surfaces'] } } };
export default meta;
type Story = StoryObj<typeof SystemDemo>;
export const Feed: Story = {};
export const Form: Story = { args: { scenario: 'form', count: 0 }, argTypes: { count: { table: { disable: true } }, scenario: { table: { disable: true } } } };
export const Desktop: Story = { args: { width: 0, sidebarSurface: 'card' } };
export const DesktopDetached: Story = { args: { width: 0, sidebarSurface: 'card' } };
export const DesktopDocked: Story = { args: { width: 0, sidebarSurface: 'docked' } };
export const Surfaces: Story = { args: { scenario: 'surfaces' } };

function DocumentNavigation({ action, material, bottomActionBehavior }: Pick<Args, 'action' | 'material' | 'bottomActionBehavior'>) {
  const { collapseProgress } = useScreen();
  const [value, onValueChange] = useState('home');
  return <BottomBar testID="document-navigation" items={[{ name: 'home', label: 'Home and updates', icon: <Icons.RiHomeLine /> }, { name: 'search', label: 'Discover communities', icon: <Icons.RiSearchLine /> }, { name: 'profile', label: 'Personal profile', icon: <Icons.RiUserLine /> }]}
    value={value} onValueChange={onValueChange} minimizeProgress={collapseProgress} material={material} actionBehavior={bottomActionBehavior} action={action ? <Fab tone="neutral" appearance="subtle" icon={Icons.RiArrowUpLine} accessibilityLabel="Back to top" onPress={() => window.scrollTo({ top: 0, behavior: 'smooth' })} /> : undefined} />;
}
function DocumentListDemo({ width, count, size, action, material, bottomActionBehavior }: Args) {
  const { colors } = useTheme();
  return <BloomScope size={size}><View style={{ width: width > 0 ? width : '100%', maxWidth: '100%', alignSelf: 'center' }}><Screen documentScroll header={<PageHeader title="Document list" onBack={() => window.scrollTo(0, 0)} actions={<ButtonGroup accessibilityLabel="List actions"><ButtonGroupItem iconOnly leadingIcon={Icons.RiSearchLine} accessibilityLabel="Jump to middle" onPress={() => window.scrollTo({ top: count * 50, behavior: 'smooth' })} /></ButtonGroup>} />} bottomBar={<DocumentNavigation action={action} material={material} bottomActionBehavior={bottomActionBehavior} />}>
    <VirtualList screen={{}} data={Array.from({ length: count }, (_, i) => i)} estimatedItemSize={100} keyExtractor={item => String(item)}
      renderItem={({ item }) => <View testID={`document-row-${item}`} style={{ minHeight: 100, padding: 20 }}><Text style={{ color: colors.text }}>Document row {item + 1}</Text></View>} />
  </Screen></View></BloomScope>;
}
export const ExternalList: Story = {
  args: { count: 40 },
  argTypes: {
    scenario: { table: { disable: true } },
    sidebarSurface: { table: { disable: true } },
    placement: { table: { disable: true } },
  },
  render: args => <DocumentListDemo {...args} />,
};
