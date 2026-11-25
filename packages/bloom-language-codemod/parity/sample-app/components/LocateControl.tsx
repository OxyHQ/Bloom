// A compose toolbar's location control: its glyph in the ink Bloom hands it,
// a spinner in its place while it locates, in Bloom's square icon button.
import { Button } from '@oxy.so/bloom/button';
import { RiMapPinLine } from '@oxy.so/bloom/icons/RiMapPinLine';
import { Loading } from '@oxy.so/bloom/loading';

export function LocateControl({ busy, locate }: { busy: boolean; locate: () => void }) {
  return (
    <Button
      appearance="plain"
      tone="neutral"
      iconOnly
      accessibilityLabel="Location"
      onPress={locate}
    >
      {(color) =>
        busy ? (
          <Loading variant="inline" size="sm" />
        ) : (
          <RiMapPinLine width={20} height={20} fill={color} />
        )
      }
    </Button>
  );
}
