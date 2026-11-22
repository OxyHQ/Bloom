import type { AvatarAccessoryId, AvatarEyewearId } from '../agent-avatar/catalog-ids';
import {
  type AvatarCharacter,
  resolveAvatarCharacter,
  updateAvatarCharacter,
} from '../agent-avatar/character';
import { StyleSheet, View } from 'react-native';
import { Text } from '../typography';
import { useAgentCreatorLabelStyles } from './AgentCreatorField';
import { CHARACTER_OPTIONS } from './constants';
import { useAgentCreatorBindings, useAgentCreatorMessages } from './context';

/**
 * Eyewear and accessory share Bloom Select; shapes, eyes and colors use the pickers. A character
 * is made of those parts: there is no row to start from a ready-made preset.
 */
export function CharacterControls({
  character,
  onChange,
}: {
  character: AvatarCharacter;
  onChange: (character: AvatarCharacter) => void;
}) {
  const messages = useAgentCreatorMessages();
  const {
    Select,
    SelectTrigger,
    SelectValue,
    SelectIcon,
    SelectContent,
    SelectItem,
    SelectItemText,
  } = useAgentCreatorBindings();
  const labels = useAgentCreatorLabelStyles();
  const resolved = resolveAvatarCharacter(character);
  const row = (
    label: string,
    value: string,
    items: readonly { id: string; title: string; disabled?: boolean }[],
    onSelect: (id: string) => void,
    placeholder = label,
  ) => (
    <View key={label} style={styles.row}>
      <Text variant="body-regular" style={[labels.label, styles.label]}>
        {label}
      </Text>
      <View style={styles.control}>
        <Select size="sm" value={value} onValueChange={onSelect}>
          <SelectTrigger label={label}>
            <SelectValue placeholder={placeholder} />
            <SelectIcon />
          </SelectTrigger>
          <SelectContent
            label={label}
            items={items.map((item) => ({ ...item, label: item.title }))}
            width={224}
            valueExtractor={(item) => item.id}
            renderItem={(item) => (
              <SelectItem value={item.id} label={item.title} disabled={item.disabled}>
                <SelectItemText>{item.title}</SelectItemText>
              </SelectItem>
            )}
          />
        </Select>
      </View>
    </View>
  );
  const parts = {
    eyewear: messages.eyewear,
    accessory: messages.accessory,
  } as const;
  return (
    <View style={styles.controls} testID="agent-creator-character-controls">
      {(['eyewear', 'accessory'] as const).map((part) =>
        row(
          parts[part],
          resolved[part],
          (part === 'accessory'
            ? [['none', messages.off] as const, ...CHARACTER_OPTIONS[part]]
            : CHARACTER_OPTIONS[part]
          ).map(([id, title]) => ({
            id,
            title: messages.characterOption(part, id, title),
            disabled: false,
          })),
          (id) =>
            onChange(
              updateAvatarCharacter(
                character,
                part === 'eyewear'
                  ? { eyewear: id as AvatarEyewearId }
                  : { accessory: id as AvatarAccessoryId },
              ),
            ),
          parts[part],
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { width: 96 },
  control: { minWidth: 0, flexGrow: 1, flexShrink: 1, flexBasis: '0%' },
  controls: { marginTop: 15, flexDirection: 'column', gap: 8, paddingInline: 12 },
});
