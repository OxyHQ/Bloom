// A compose toolbar's controls: a glyph drawn in the ink Bloom hands its
// render function, and a row whose press is chosen at render.
import { Button } from '@oxy.so/bloom/button';
import { RiLinksLine } from '@oxy.so/bloom/icons/RiLinksLine';
import { Item } from '@oxy.so/bloom/item';

export function LinkControl({ add }: { add: () => void }) {
  return (
    <Button appearance="plain" tone="neutral" iconOnly accessibilityLabel="Link" onPress={add}>
      {(color) => <RiLinksLine width={20} height={20} fill={color} />}
    </Button>
  );
}

export function AddRow({ full, add }: { full: boolean; add: () => void }) {
  return <Item title="Add" onPress={full ? undefined : add} />;
}
