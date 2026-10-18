import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';
import { AppShell } from '../app-shell';
import { Button } from '../button';
import { PageHeader } from '../page-header';
import { Screen, ScreenScrollView } from '../screen';
import { Text } from '../typography';
import {
  PanelRouterProvider,
  PanelRouteSlot,
  useOptionalPanelRouter,
  type PanelRouteDefinition,
} from './index';

const meta: Meta = { title: 'Navigation/Panel Routing' };
export default meta;
type Story = StoryObj;

function RouteLayout() {
  const router = useOptionalPanelRouter();
  return (
    <Screen
      scroll="auto"
      header={
        <PageHeader
          title={router?.pathname ?? 'Panel'}
          onBack={router?.canGoBack() ? router.back : undefined}
        />
      }
    >
      <ScreenScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <PanelRouteSlot />
      </ScreenScrollView>
    </Screen>
  );
}
function Feed() {
  const router = useOptionalPanelRouter();
  return (
    <>
      <Text>Each column has independent history. Open a post, visit its author, then go back.</Text>
      {Array.from({ length: 12 }, (_, index) => (
        <Button
          key={index}
          appearance="outline"
          onPress={() => router?.push(`/posts/${index + 1}`)}
        >
          Open post {index + 1}
        </Button>
      ))}
    </>
  );
}
function Post() {
  const router = useOptionalPanelRouter();
  return (
    <>
      <Text variant="title-2-medium">Post {router?.params.id}</Text>
      <Text>This route renders inside the same column and shared screen header.</Text>
      <Button onPress={() => router?.push('/profiles/alex')}>View author</Button>
    </>
  );
}
function Profile() {
  const router = useOptionalPanelRouter();
  return (
    <>
      <Text variant="title-2-medium">{router?.params.name}</Text>
      <Text>The other column keeps its own route and scroll position.</Text>
    </>
  );
}
const routes: readonly PanelRouteDefinition[] = [
  { path: '/', component: Feed, layouts: [RouteLayout] },
  { path: '/posts/[id]', component: Post, layouts: [RouteLayout] },
  { path: '/profiles/[name]', component: Profile, layouts: [RouteLayout] },
];

export const IndependentRoutes: Story = {
  render: () => (
    <View style={{ height: 620 }}>
      <AppShell
        panelLayout={{
          mode: 'deck',
          flow: 'bounded',
          horizontalScroll: 'contained',
          panels: ['left', 'right'].map((id) => ({
            id,
            width: 380,
            navigation: {
              initialEntries: [{ key: `${id}-feed`, name: '/' }],
              render: () => <PanelRouterProvider routes={routes} />,
            },
          })),
        }}
      />
    </View>
  ),
};
