import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { Search } from '../search';
import { RiPushpinLine } from '../icons/remix/RiPushpinLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiShareForwardLine } from '../icons/remix/RiShareForwardLine';
import { HeaderActions } from './HeaderActions.web';
import { PageHeader } from './PageHeader';
import { Text } from '../typography';
import { AppShell, AppShellMenuButton } from '../app-shell/index.web';

const meta: Meta = {
  id: 'composition-headers-adaptive-actions',
  title: 'Composition/Layout/Page Header/Actions',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const DOCUMENT_LINES = ['Project overview', 'Design decisions', 'Delivery checklist'];

export const LocalWidth: Story = {
  render: function LocalWidthStory() {
    const [result, setResult] = useState('Ready');
    const [selected, setSelected] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const matches = DOCUMENT_LINES.filter((line) =>
      line.toLowerCase().includes(query.trim().toLowerCase()),
    );
    return (
      <View style={{ width: '100%' }} testID="action-host">
        <PageHeader
          title="Project document"
          onBack={() => setResult('Back')}
          testID="action-header"
          accessory={
            searchOpen ? (
              <Search
                presentation="collapsible"
                open={searchOpen}
                onOpenChange={setSearchOpen}
                label="Find in document"
                value={query}
                onValueChange={setQuery}
                onClearText={() => setQuery('')}
              />
            ) : undefined
          }
          actions={
            <HeaderActions
              testID="adaptive-actions"
              actions={[
                {
                  id: 'find',
                  label: 'Find in document',
                  icon: RiSearchLine,
                  group: 'document',
                  onPress: () => {
                    setResult('Find');
                    setSearchOpen(true);
                  },
                },
                {
                  id: 'share',
                  label: 'Share document',
                  icon: RiShareForwardLine,
                  group: 'document',
                  priority: 10,
                  onPress: () => setResult('Share'),
                },
                {
                  id: 'pin',
                  label: 'Pin document',
                  icon: RiPushpinLine,
                  group: 'organize',
                  selected,
                  onPress: () => setSelected((value) => !value),
                },
                {
                  id: 'stop',
                  label: 'Stop',
                  icon: RiCloseLine,
                  essential: true,
                  labelVisibility: 'hidden',
                  onPress: () => setResult('Stopped'),
                },
              ]}
            />
          }
        />
        <View style={{ padding: 16, gap: 16 }}>
          <Text testID="action-result">{result}</Text>
          {matches.map((line) => (
            <Text key={line}>{line}</Text>
          ))}
          {matches.length === 0 && <Text>No results</Text>}
        </View>
      </View>
    );
  },
};

/** The drawer trigger disappears without leaving a leading flex gap. */
export const ResponsiveNavigation: Story = {
  render: function ResponsiveNavigationStory() {
    return (
      <View testID="navigation-host" style={{ width: '100%', height: 420 }}>
        <AppShell
          header={null}
          navFrom={777}
          contentMaxWidth="none"
          sidebar={{ items: [] }}
          panelLayout={{
            panels: [
              {
                id: 'main',
                content: (
                  <PageHeader
                    testID="navigation-header"
                    title="Inbox"
                    leading={<AppShellMenuButton testID="navigation-menu" />}
                  />
                ),
              },
            ],
          }}
        />
      </View>
    );
  },
};
