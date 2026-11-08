import { Screen } from '@oxy.so/bloom/screen';
import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ComposerLoader } from '@oxy.so/bloom/composer-loader';
import { Button } from '@oxy.so/bloom/button';
import { Text } from '@oxy.so/bloom/typography';
import { useTheme } from '@oxy.so/bloom/theme';

/** Packaged renderer; synthetic content and the existing public geometry/clock. */
export function LoaderBenchmark({
  label,
  onToggleMode,
}: {
  label: string;
  onToggleMode?: () => void;
}) {
  const Renderer = ComposerLoader;
  const [count, setCount] = useState(1);
  const [taper, setTaper] = useState(0);
  const [active, setActive] = useState(true);
  const [speed, setSpeed] = useState(4.5);
  const [narrow, setNarrow] = useState(false);
  const [square, setSquare] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [screenMode, setScreenMode] = useState<'off' | 'active' | 'inactive'>('off');
  const state = `count=${count} taper=${taper} active=${active} speed=${speed} narrow=${narrow} radius=${square ? 12 : 9999} paused=${paused} layer=all reverse=${reverse} screen=${screenMode} clockLog=false`;
  useEffect(() => {
    console.info(`BloomBenchmarkState: ${state}`);
  }, [state]);
  const theme = useTheme();
  const loaders = (
    <>
      <Renderer
        key={`first-${count}-${taper}`}
        active={active}
        paused={paused}
        radius={square ? 12 : undefined}
        style={narrow ? { width: 240 } : undefined}
        speed={speed}
        reverse={reverse}
        taper={taper}
        testID="benchmark-loader-one"
      >
        <View style={{ height: 52 }} />
      </Renderer>
      {count === 2 ? (
        <Renderer
          key={`second-${count}-${taper}`}
          active={active}
          paused={paused}
          radius={square ? 12 : undefined}
          style={narrow ? { width: 240 } : undefined}
          speed={speed}
          reverse={reverse}
          taper={taper}
          testID="benchmark-loader-two"
        >
          <View style={{ height: 52 }} />
        </Renderer>
      ) : (
        <View style={{ height: 52 }} />
      )}
    </>
  );
  return (
    <>
      <>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View testID="material-scene" style={{ padding: 16, gap: 16 }}>
            <Text variant="title-3-semibold">Composer renderer benchmark</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button testID="benchmark-one" onPress={() => setCount(1)}>
                One
              </Button>
              <Button testID="benchmark-two" onPress={() => setCount(2)}>
                Two
              </Button>
              <Button testID="benchmark-taper-off" onPress={() => setTaper(0)}>
                No taper
              </Button>
              <Button testID="benchmark-taper-on" onPress={() => setTaper(0.5)}>
                Taper
              </Button>
              <Button testID="benchmark-motion" onPress={() => setActive((value) => !value)}>
                {active ? 'Stop' : 'Start'}
              </Button>
            </View>
            {screenMode === 'off' ? (
              loaders
            ) : (
              <Screen
                testID="benchmark-screen"
                scroll="none"
                active={screenMode === 'active'}
                style={{ height: 120, flexBasis: 120, flexGrow: 0, flexShrink: 0 }}
              >
                <View style={{ gap: 16 }}>{loaders}</View>
              </Screen>
            )}
            <Text testID="benchmark-state">{state}</Text>
            <Button
              testID="benchmark-freeze"
              onPress={() => setSpeed((value) => (value === 0 ? 4.5 : 0))}
            >
              {speed === 0 ? 'Run clock' : 'Freeze origin'}
            </Button>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button testID="benchmark-width" onPress={() => setNarrow((value) => !value)}>
                Width
              </Button>
              <Button testID="benchmark-radius" onPress={() => setSquare((value) => !value)}>
                Radius
              </Button>
              <Button testID="benchmark-pause" onPress={() => setPaused((value) => !value)}>
                Pause
              </Button>
              <Button testID="benchmark-theme" onPress={onToggleMode}>
                Theme
              </Button>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button testID="benchmark-reverse" onPress={() => setReverse((value) => !value)}>
                Reverse
              </Button>
              <Button
                testID="benchmark-screen-mode"
                onPress={() =>
                  setScreenMode((value) =>
                    value === 'off' ? 'active' : value === 'active' ? 'inactive' : 'active',
                  )
                }
              >
                Screen
              </Button>
            </View>
            <Text variant="caption-1-medium">{label}</Text>
          </View>
        </SafeAreaView>
      </>
    </>
  );
}
