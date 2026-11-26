// A Bloom Text's alignment and selection, a Button's icon and a bare glyph, as Allo writes them.
import { Button } from '@oxy.so/bloom/button';
import { RiAddLine } from '@oxy.so/bloom/icons/RiAddLine';
import { RiArrowRightSLine } from '@oxy.so/bloom/icons/RiArrowRightSLine';
import { RiMore2Line } from '@oxy.so/bloom/icons/RiMore2Line';
import { Text } from '@oxy.so/bloom/typography';
import { StyleSheet } from 'react-native';

export function CenteredTitle() {
  return (
    <Text variant="title-1-semibold" style={styles.centered}>
      Welcome
    </Text>
  );
}

export function FingerprintWord() {
  return (
    <Text variant="body-regular" selectable>
      falcon
    </Text>
  );
}

export function AddOption({ onAdd }: { onAdd: () => void }) {
  return (
    <Button icon={RiAddLine} onPress={onAdd} tone="accent" appearance="plain">
      Add option
    </Button>
  );
}

export function MoreActions({ onMore }: { onMore: () => void }) {
  return <Button icon={RiMore2Line} onPress={onMore} accessibilityLabel="More" />;
}

export function Disclosure() {
  return <RiArrowRightSLine />;
}

const styles = StyleSheet.create({
  centered: { textAlign: 'center' },
});
