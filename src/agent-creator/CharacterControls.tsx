import type { AvatarAccessoryId, AvatarEyewearId } from '../agent-avatar/catalog-ids';
import {
  type AvatarCharacter,
  resolveAvatarCharacter,
  updateAvatarCharacter,
} from '../agent-avatar/character';
import { StyledView } from '../styles/styled-primitives';
import { Text } from '../typography';
import {
  CHARACTER_OPTIONS,
  CHARACTER_PRESETS,
  CHARACTER_TEMPLATES,
  characterTemplateChoice,
} from './constants';
import { useAgentCreatorBindings, useAgentCreatorMessages } from './context';

/** Template and accessory controls share Bloom Select; shapes, eyes and colors use the pickers. */
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
  const choice = characterTemplateChoice(character);
  const resolved = resolveAvatarCharacter(character);
  const row = (
    label: string,
    value: string,
    items: readonly { id: string; title: string; disabled?: boolean }[],
    onSelect: (id: string) => void,
    placeholder = label,
  ) => (
    <StyledView key={label} className="flex flex-row items-center gap-3">
      <Text variant="body-regular" className="w-[96px] text-body-regular text-text-primary">
        {label}
      </Text>
      <StyledView className="min-w-0 flex-1">
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
      </StyledView>
    </StyledView>
  );
  const templates = [
    ...(choice === 'custom'
      ? [{ id: 'custom', title: messages.characterOption('preset', 'custom', 'Custom') }]
      : []),
    ...CHARACTER_PRESETS.map((item) => ({
      id: item.id,
      title: messages.characterOption('preset', item.id, item.title),
    })),
  ];
  const parts = {
    eyewear: messages.eyewear,
    accessory: messages.accessory,
  } as const;
  return (
    <StyledView
      className="mt-[15px] flex flex-col gap-2 px-3"
      testID="agent-creator-character-controls"
    >
      {row(
        messages.avatarStyle,
        choice,
        templates,
        (id) => {
          const template = CHARACTER_TEMPLATES[id];
          if (template) onChange(template);
        },
        messages.betaPreset,
      )}
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
    </StyledView>
  );
}
