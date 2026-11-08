import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index.web';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiShareForwardLine } from '../icons/remix/RiShareForwardLine';
import { HeaderActions } from './HeaderActions.web';
import { PageHeader } from './PageHeader';
import { Text } from '../typography';
import { AppShell, AppShellMenuButton } from '../app-shell/index.web';

const meta: Meta = { title: 'Composition/Headers/Adaptive Actions' };
export default meta;
type Story = StoryObj;

export const LocalWidth: Story = {
  render: function LocalWidthStory() {
    const [width, setWidth] = useState(640);
    const [result, setResult] = useState('Ready');
    const [selected, setSelected] = useState(false);
    return (
      <View style={{ gap: 16, width: '100%' }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[240, 320, 390, 640, 900].map((value) => (
            <Button key={value} onPress={() => setWidth(value)} testID={`actions-width-${value}`}>
              {String(value)}
            </Button>
          ))}
        </View>
        <View style={{ width, maxWidth: '100%' }} testID="action-host">
          <PageHeader
            title="Project document"
            onBack={() => setResult('Back')}
            testID="action-header"
            actions={
              <HeaderActions
                testID="adaptive-actions"
                actions={[
                  {
                    id: 'find',
                    label: 'Find in document',
                    icon: RiSearchLine,
                    group: 'document',
                    onPress: () => setResult('Find'),
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
                    icon: RiSearchLine,
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
        </View>
        <Text testID="action-result">{result}</Text>
      </View>
    );
  },
};

/** The drawer trigger disappears without leaving a leading flex gap. */
export const ResponsiveNavigation: Story = {
  render: function ResponsiveNavigationStory() {
    const [width, setWidth] = useState(900);
    return (
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[390, 900].map((value) => (
            <Button
              key={value}
              testID={`navigation-width-${value}`}
              onPress={() => setWidth(value)}
            >
              {String(value)}
            </Button>
          ))}
        </View>
        <View testID="navigation-host" style={{ width, height: 420 }}>
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
      </View>
    );
  },
};
