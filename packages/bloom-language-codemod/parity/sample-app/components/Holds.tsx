// A story held to pause it, playing again as the touch lifts; a name saved as
// its field is left; a recovery phrase typed with no autofill or spelling marks.
import { TextFieldInput } from '@oxy.so/bloom/text-field';
import { Textarea } from '@oxy.so/bloom/textarea';
import { Text } from '@oxy.so/bloom/typography';
import { Pressable } from 'react-native';

export function HeldStory({ onHold, onRelease }: { onHold: () => void; onRelease: () => void }) {
  return (
    <Pressable onLongPress={onHold} onPressOut={onRelease}>
      <Text>Story</Text>
    </Pressable>
  );
}

export function RenameField({ onSave }: { onSave: () => void }) {
  return (
    <TextFieldInput
      label="Name"
      value="Design"
      onChangeText={() => {}}
      onBlur={onSave}
      spellCheck={false}
      returnKeyType="done"
    />
  );
}

export function RecoveryPhrase() {
  return (
    <Textarea
      accessibilityLabel="Recovery phrase"
      value=""
      onChangeText={() => {}}
      autoComplete="off"
      spellCheck={false}
      textContentType="none"
    />
  );
}
