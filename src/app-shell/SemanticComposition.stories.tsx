import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';
import { AppShell, AppShellPanels } from './index';
import type { AppShellLayout, AppShellPresentation } from './composition';
import { Screen, ScreenContent, ScreenScrollView } from '../screen';
import { PageHeader } from '../page-header';
import { TextFieldInput } from '../text-field';
import { Button } from '../button';
import { Text } from '../typography';
import { RiHomeLine } from '../icons/remix';
import { WEB_VIEWPORT_HEIGHT } from '../styles/web-view-style';

const meta: Meta<typeof AppShell> = {
  id: 'composition-semantic',
  title: 'Composition/Layout/Semantic Composition',
  component: AppShell,
  parameters: { layout: 'fullscreen', controls: { disable: true } },
};
export default meta;
type Story = StoryObj<typeof AppShell>;
let nextInstance = 0;

function DraftScreen({ name }: { name: string }) {
  const [draft, setDraft] = useState('');
  const instance = useRef<number | null>(null);
  if (instance.current === null) instance.current = ++nextInstance;
  return (
    <Screen kind="document" testID={`semantic-${name}-screen`}>
      <ScreenScrollView testID={`semantic-${name}-scroll`}>
        <ScreenContent testID={`semantic-${name}-body`}>
          <Text testID={`semantic-${name}-instance`}>Instance {instance.current}</Text>
          <TextFieldInput
            label={`${name} draft`}
            testID={`semantic-${name}-draft`}
            value={draft}
            onChangeText={setDraft}
          />
          {Array.from({ length: 24 }, (_, index) => (
            <Text key={index} className="py-4">
              Paragraph {index + 1}. This body follows the space of its own region.
            </Text>
          ))}
        </ScreenContent>
      </ScreenScrollView>
    </Screen>
  );
}

function Example({ routeOwned = false }: { routeOwned?: boolean }) {
  const [open, setOpen] = useState(false);
  const [family, setFamily] = useState<AppShellLayout>('workspace');
  const [presentation, setPresentation] = useState<AppShellPresentation>('continuous');
  const panelLayout = {
    header: (
      <PageHeader
        title="Workspace"
        presentation="navigation"
        actions={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button testID="semantic-open" onPress={() => setOpen(!open)}>
              Inspector
            </Button>
            <Button
              testID="semantic-presentation"
              onPress={() =>
                setPresentation(presentation === 'continuous' ? 'framed' : 'continuous')
              }
            >
              Frame
            </Button>
            <Button
              testID="semantic-family"
              onPress={() => setFamily(family === 'workspace' ? 'deck' : 'workspace')}
            >
              Layout
            </Button>
          </View>
        }
      />
    ),
    panels: [
      { id: 'main', role: 'main' as const, content: <DraftScreen name="main" /> },
      {
        id: 'inspector',
        role: 'inspector' as const,
        open,
        onOpenChange: setOpen,
        label: 'Inspector',
        content: <DraftScreen name="inspector" />,
      },
    ],
  };
  return (
    <View style={{ height: WEB_VIEWPORT_HEIGHT }}>
      <AppShell
        layout={family}
        presentation={presentation}
        header={null}
        testID="semantic-shell"
        sidebar={{ items: [{ key: 'home', label: 'Home', icon: RiHomeLine }], variant: 'panel' }}
        panelLayout={routeOwned ? undefined : panelLayout}
      >
        {routeOwned ? <AppShellPanels layout={panelLayout} testID="semantic-route" /> : null}
      </AppShell>
    </View>
  );
}

export const Workspace: Story = { render: () => <Example /> };
export const RouteOwnedWorkspace: Story = { render: () => <Example routeOwned /> };
