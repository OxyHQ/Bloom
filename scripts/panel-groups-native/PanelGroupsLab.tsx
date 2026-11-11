import build from './build.json';
import { useState } from 'react';
import { StyledView as View } from './.source/styles/styled-primitives';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BloomProvider } from './.source/provider';
import { PortalProvider, PortalOutlet } from './.source/portal';
import { SurfaceProvider } from './.source/surfaces';
import { AppShell } from './.source/app-shell';
import { Screen, ScreenScrollView } from './.source/screen';
import { PageHeader } from './.source/page-header';
import { Button } from './.source/button';
import { Text } from './.source/typography';

function Reading({ title, short = false }: { title: string; short?: boolean }) {
  return (
    <Screen header={<PageHeader title={title} />} testID={`native-${title}`}>
      <ScreenScrollView>
        <View className="gap-4 p-4">
          {Array.from({ length: short ? 3 : 40 }, (_, index) => (
            <Text key={`${title}-${index}`} className="py-4">
              {title} row {index + 1}
            </Text>
          ))}
        </View>
      </ScreenScrollView>
    </Screen>
  );
}
export function PanelGroupsLab() {
  const [open, setOpen] = useState(false);
  const [exitCount, setExitCount] = useState(0);
  const [floating, setFloating] = useState(false);
  const [flow, setFlow] = useState(false);
  const [short, setShort] = useState(false);
  const [count, setCount] = useState(3);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BloomProvider mode="light" colorPreset="oxy" haptics={false}>
          <PortalProvider>
            <SurfaceProvider>
              <AppShell
                scroll="fixed"
                header={null}
                gutter={8}
                contentMaxWidth="none"
                panelLayout={{
                  mode: 'split',
                  flow: 'bounded',
                  header: (
                    <PageHeader
                      title={`Panels ${build.identity.slice(0, 8)}`}
                      actions={
                        <View className="flex-row gap-2">
                          <Button
                            testID="native-open"
                            accessibilityLabel={`Split; completed exits ${exitCount}`}
                            onPress={() => setOpen(!open)}
                          >
                            Split
                          </Button>
                          <Button
                            testID="native-sheet"
                            onPress={() => {
                              setFloating(!floating);
                              setOpen(true);
                            }}
                          >
                            Sheet
                          </Button>
                          <Button testID="native-flow" onPress={() => setFlow(!flow)}>
                            Flow
                          </Button>
                          <Button
                            testID="native-add"
                            onPress={() => (flow ? setCount(count + 1) : setShort(!short))}
                          >
                            Add
                          </Button>
                        </View>
                      }
                    />
                  ),
                  panels: [
                    {
                      id: 'workspace',
                      group: flow
                        ? {
                            mode: 'flow',
                            axis: 'vertical',
                            panels: Array.from({ length: count }, (_, index) => ({
                              id: `email-${index}`,
                              content: (
                                <View className="gap-4 p-6">
                                  <Text>Email {index + 1}</Text>
                                  {Array.from({ length: 8 }, (_, line) => (
                                    <Text key={`line-${line}`}>Email paragraph {line + 1}</Text>
                                  ))}
                                </View>
                              ),
                            })),
                          }
                        : {
                            mode: 'split',
                            axis: 'vertical',
                            gap: 8,
                            panels: [
                              {
                                id: 'post',
                                minHeight: 120,
                                resizable: true,
                                testID: 'native-post-panel',
                                content: <Reading title="Post" />,
                              },
                              {
                                id: 'likes',
                                resizeMaxHeight: 'content',
                                minHeight: 120,
                                visible: open,
                                onExitComplete: () => setExitCount((count) => count + 1),
                                testID: 'native-likes-panel',
                                ...(floating
                                  ? {
                                      floating: {
                                        below: 'md' as const,
                                        whenConstrained: true,
                                        open,
                                        onOpenChange: setOpen,
                                        placement: 'bottom' as const,
                                        label: 'Likes',
                                      },
                                    }
                                  : {}),
                                content: <Reading title="Likes" short={short} />,
                              },
                            ],
                          },
                    },
                  ],
                }}
              />
              <PortalOutlet />
            </SurfaceProvider>
          </PortalProvider>
        </BloomProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
