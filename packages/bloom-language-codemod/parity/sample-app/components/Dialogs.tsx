// Dialogs opened by their caller: each a presented dialog, its `open` and `onClose` one binding.
import { Dialog } from '@oxy.so/bloom/dialog';
import { Text } from '@oxy.so/bloom/typography';
import { View } from 'react-native';

export function PublishAs({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Post as" label="Post as">
      <View className="gap-4 p-4">
        <Text className="text-sm">Choose an account</Text>
      </View>
    </Dialog>
  );
}

export function Sources({ open, close }: { open: boolean; close: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={() => close()}
      label="Sources"
      placement={{ base: 'bottom', md: 'center' }}
      contentPadding={0}
      maxWidth={400}
      actions={[{ label: 'Done' }]}
      dismissOnBackdrop={false}
    >
      <Text>Where it came from</Text>
    </Dialog>
  );
}

export function Shortcuts({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <View className="gap-2">
      <Text>Shortcuts</Text>
      <Dialog
        open={visible}
        onClose={onClose}
        header={{ title: 'Keyboard shortcuts' }}
        placement="center"
      >
        <View className="px-5" />
      </Dialog>
    </View>
  );
}
