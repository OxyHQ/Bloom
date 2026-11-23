// A reel's route: a screen of its own fill that drives its own scroll, as Mention's videos tab and camera write them.
import { Screen } from '@oxy.so/bloom/screen';
import { useTheme } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';
export default function Reel({ empty, index, toTop, retry }) {
  const theme = useTheme();
  return (
    <Screen
      reselect={{ isAtTop: () => index === 0, scrollToTop: toTop, refresh: retry }}
      style={{ backgroundColor: empty ? theme.colors.background : '#000000' }}
    >
      <Text>Reel</Text>
    </Screen>
  );
}
export function Camera() {
  return (
    <Screen scroll="none" style={{ backgroundColor: '#000' }}>
      <Text>Camera</Text>
    </Screen>
  );
}
