import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Surface } from '../../src/surface';
import { Card } from '../../src/card';
import { Button } from '../../src/button';
import { BlurIsland } from '../../src/blur';
import { Text } from '../../src/typography';
import { PageHeader } from '../../src/page-header';
import { Screen, ScreenScrollView } from '../../src/screen';
import { TabBar, TabBarButton } from '../../src/tab-bar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../src/dropdown-menu';
import { Dialog, useDialogControl } from '../../src/dialog';
import { BottomSheet, type BottomSheetRef } from '../../src/bottom-sheet';
import { AgentChatComposer } from '../../src/agent-chat';
import { ComposerLoader } from '../../src/composer-loader';
import { BloomImage } from '../../src/image/BloomImage';
import { OverlayInertBoundary } from '../../src/overlay';
import { useTheme } from '../../src/theme/use-theme';
import { usePrefersReducedMotion } from '../../src/hooks/use-prefers-reduced-motion';
import { RiHomeLine } from '../../src/icons/remix/RiHomeLine';
import { RiSearchLine } from '../../src/icons/remix/RiSearchLine';
import photo from '../ai-chat/assets/gallery/beach-kid.webp';

type Background = 'solid' | 'stripes' | 'photo' | 'motion';

/** Fixed synthetic optical stimulus. Only the backdrop moves, never a material ancestor. */
function Backdrop({ background }: { background: Background }) {
  const theme = useTheme();
  const reduced = usePrefersReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    if (background === 'motion' && !reduced) {
      progress.value = withRepeat(
        withTiming(-100, { duration: 4000, easing: Easing.linear }),
        -1,
        true,
      );
    }
    return () => cancelAnimation(progress);
  }, [background, reduced, progress]);
  const movement = useAnimatedStyle(
    () => ({ transform: [{ translateX: progress.value }] }),
    [progress],
  );
  return (
    <View
      pointerEvents="none"
      aria-hidden
      style={[
        StyleSheet.absoluteFill,
        { overflow: 'hidden', backgroundColor: theme.colors.background },
      ]}
    >
      {background === 'stripes' ? (
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
          {Array.from({ length: 16 }, (_, index) => (
            <View
              key={index}
              style={{ flex: 1, backgroundColor: index % 2 ? '#202020' : '#FFFFFF' }}
            />
          ))}
        </View>
      ) : background !== 'solid' ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { right: -100 },
            background === 'motion' ? movement : null,
          ]}
        >
          <BloomImage
            source={photo}
            contentFit="cover"
            style={{ width: '100%', height: '100%' }}
            testID="material-photo"
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

/** The same source tree is mounted by Storybook and the offline Expo test app. */
export function MaterialScene({
  onToggleMode,
  onToggleTransparency,
  buildLabel,
}: {
  onToggleMode: () => void;
  onToggleTransparency: () => void;
  buildLabel: string;
}) {
  const [background, setBackground] = useState<Background>('solid');
  const [tab, setTab] = useState(0);
  const [busy, setBusy] = useState(true);
  const [draft, setDraft] = useState('Synthetic draft — no request is sent');
  const dialog = useDialogControl();
  const sheet = useRef<BottomSheetRef>(null);
  const theme = useTheme();
  return (
    <View testID="material-scene" style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Backdrop background={background} />
      <OverlayInertBoundary style={{ flex: 1 }}>
        <Screen
          style={{ backgroundColor: 'transparent' }}
          header={
            <PageHeader
              title="Material comparison"
              presentation="floating"
              scrim="none"
              onBack={() => setBackground('solid')}
              actions={
                <Button testID="material-theme" onPress={onToggleMode}>
                  Theme
                </Button>
              }
            />
          }
          bottomBar={
            <TabBar
              activeIndex={tab}
              onIndexChange={setTab}
              haptics={false}
              testID="material-tabbar"
            >
              <TabBarButton
                index={0}
                item={{ name: 'home', label: 'Home', icon: <RiHomeLine /> }}
              />
              <TabBarButton
                index={1}
                item={{ name: 'search', label: 'Search', icon: <RiSearchLine /> }}
              />
            </TabBar>
          }
        >
          <ScreenScrollView
            testID="material-scroll"
            contentContainerStyle={{ padding: 16, gap: 16 }}
          >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['solid', 'stripes', 'photo', 'motion'] as const).map((value) => (
                <Button
                  key={value}
                  testID={`material-background-${value}`}
                  onPress={() => setBackground(value)}
                >
                  {value}
                </Button>
              ))}
              <Button testID="material-transparency" onPress={onToggleTransparency}>
                Transparency
              </Button>
              <Button testID="material-loader-toggle" onPress={() => setBusy((value) => !value)}>
                {busy ? 'Pause loader' : 'Resume loader'}
              </Button>
            </View>
            <Surface testID="material-surface" style={{ padding: 16, gap: 8 }}>
              <Text variant="title-3-semibold">Surface</Text>
              <Text>In-flow fill, edge light, rounding and readable foreground.</Text>
              <Card testID="material-nested-card" style={{ padding: 12 }}>
                <Text>Nested card on the published backing</Text>
              </Card>
            </Surface>
            <Card testID="material-card" style={{ padding: 16, gap: 10 }}>
              <Text variant="title-3-semibold">Card and buttons</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Button testID="material-button">Primary</Button>
                <Button appearance="outline" tone="neutral">
                  Outline
                </Button>
                <Button disabled>Disabled</Button>
              </View>
            </Card>
            <BlurIsland testID="material-island" style={{ padding: 12, alignSelf: 'flex-start' }}>
              <Text>Floating BlurIsland</Text>
            </BlurIsland>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild label="Material menu">
                  <Button testID="material-menu-trigger">Menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent testID="material-menu">
                  <DropdownMenuItem>First synthetic action</DropdownMenuItem>
                  <DropdownMenuItem>Second synthetic action</DropdownMenuItem>
                  <DropdownMenuItem disabled>Disabled action</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button testID="material-dialog-trigger" onPress={() => dialog.open()}>
                Dialog
              </Button>
              <Button testID="material-sheet-trigger" onPress={() => sheet.current?.present()}>
                Sheet
              </Button>
            </View>
            <ComposerLoader active={busy} testID="material-loader">
              <View style={{ height: 52 }} />
            </ComposerLoader>
            <AgentChatComposer
              value={draft}
              onValueChange={setDraft}
              busy={busy}
              onStop={() => setBusy(false)}
              onSubmit={() => setBusy(true)}
              testID="material-composer"
            />
            <Text variant="caption-1-medium" testID="material-build">
              {buildLabel} · {theme.isDark ? 'dark' : 'light'} · {background}
            </Text>
          </ScreenScrollView>
        </Screen>
      </OverlayInertBoundary>
      <Dialog
        control={dialog}
        title="Material dialog"
        description="Synthetic content; no account, persistence or network action."
      >
        <View style={{ gap: 12 }}>
          <Surface style={{ padding: 12 }}>
            <Text>Nested surface inside a modal window</Text>
          </Surface>
          <Button testID="material-dialog-close" onPress={() => dialog.close()}>
            Close dialog
          </Button>
        </View>
      </Dialog>
      <BottomSheet ref={sheet} accessibilityLabel="Material sheet">
        <View style={{ padding: 24, gap: 12 }}>
          <Text variant="title-3-semibold">Material sheet</Text>
          <Text>Same shared paint, safe clipping and visible controls.</Text>
          <Button testID="material-sheet-close" onPress={() => sheet.current?.dismiss()}>
            Close sheet
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
}
