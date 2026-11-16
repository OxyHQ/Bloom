import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View, type TextInputInstance } from 'react-native';
import { AppShell, AppShellPanels, usePanelSessionFocus, usePanelSessionState } from './index';
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

function DraftScreen({ name, registered = false }: { name: string; registered?: boolean }) {
  const [localDraft, setLocalDraft] = useState('');
  const [sessionDraft, setSessionDraft] = usePanelSessionState(`${name}:draft`, '');
  const focus = usePanelSessionFocus<TextInputInstance>(`${name}:input`);
  const [draft, setDraft] = registered
    ? [sessionDraft, setSessionDraft]
    : [localDraft, setLocalDraft];
  const instance = useRef<number | null>(null);
  if (instance.current === null) instance.current = ++nextInstance;
  return (
    <Screen kind="document" testID={`semantic-${name}-screen`}>
      <ScreenScrollView testID={`semantic-${name}-scroll`}>
        <ScreenContent testID={`semantic-${name}-body`}>
          <Text testID={`semantic-${name}-instance`}>Instance {instance.current}</Text>
          <TextFieldInput
            {...(registered
              ? {
                  inputRef: focus.ref,
                  onFocus: focus.onFocus,
                  onBlur: focus.onBlur,
                  onSelectionChange: focus.onSelectionChange,
                }
              : {})}
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

function Example({
  routeOwned = false,
  registered = false,
}: {
  routeOwned?: boolean;
  registered?: boolean;
}) {
  const families: AppShellLayout[] = [
    'workspace',
    'deck',
    'feed',
    'catalog',
    'collection-detail',
    'map-browser',
  ];
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
              accessibilityLabel={`Presentation: ${presentation}`}
              onPress={() =>
                setPresentation(
                  presentation === 'continuous'
                    ? 'framed'
                    : presentation === 'framed'
                      ? 'floating'
                      : 'continuous',
                )
              }
            >
              Frame
            </Button>
            <Button
              testID="semantic-family"
              accessibilityLabel={`Layout: ${family}`}
              onPress={() => setFamily(families[(families.indexOf(family) + 1) % families.length]!)}
            >
              Layout
            </Button>
          </View>
        }
      />
    ),
    panels: [
      {
        id: 'main',
        role: 'main' as const,
        content: <DraftScreen name="main" registered={registered} />,
      },
      {
        id: 'inspector',
        role: 'inspector' as const,
        open,
        onOpenChange: setOpen,
        label: 'Inspector',
        content: <DraftScreen name="inspector" registered={registered} />,
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

export const RegisteredSessionWorkspace: Story = { render: () => <Example registered /> };

export const NestedBodyRegions: Story = {
  render: () => (
    <View style={{ width: 1000 }}>
      <Screen kind="document">
        <ScreenContent testID="semantic-wide-body">
          <Text>Wide document body</Text>
          <View style={{ width: 320 }}>
            <ScreenContent testID="semantic-narrow-body">
              <Text>Embedded narrow document body</Text>
            </ScreenContent>
          </View>
        </ScreenContent>
      </Screen>
    </View>
  ),
};
