import { useContext, useRef } from 'react';
import {
  CharacterRuntimeContext,
  CharacterCapabilitiesContext,
} from '../agent-avatar/context';
import type {
  AvatarCharacterCategory,
  AvatarCharacterConfig,
} from '../agent-avatar/config-character';
import { StyledView } from '../styles/styled-primitives';
import { Slider } from '../slider';
import { Text } from '../typography';
import { CHARACTER_OPTIONS, CHARACTER_PRESETS } from './constants';
import { useAgentCreatorBindings, useAgentCreatorMessages } from './context';

/** Preset and accessory controls share Bloom Select; shapes, eyes and colors use the existing pickers. */
export function CharacterControls({
  character,
  capabilitiesKey,
  selected,
  onChange,
}: {
  character?: AvatarCharacterConfig;
  capabilitiesKey?: string;
  selected?: Readonly<Record<string, string>>;
  onChange: (character: AvatarCharacterConfig | undefined) => void;
}) {
  const messages = useAgentCreatorMessages();
  const { runtimeUrl } = useContext(CharacterRuntimeContext);
  const { capabilities, capabilitiesByKey } = useContext(
    CharacterCapabilitiesContext,
  );
  const {
    Select,
    SelectTrigger,
    SelectValue,
    SelectIcon,
    SelectContent,
    SelectItem,
    SelectItemText,
  } = useAgentCreatorBindings();
  const key = capabilitiesKey ?? JSON.stringify(character);
  const current =
    capabilitiesByKey?.get(key) ??
    (character && capabilities?.key === key ? capabilities : undefined);
  const retained = useRef<{
    preset?: string;
    selected: Readonly<Record<string, string>>;
  }>({ selected: {} });
  if (retained.current.preset !== character?.preset)
    retained.current = { preset: character?.preset, selected: {} };
  if (current) retained.current.selected = current.selected;
  const resolved = {
    selected: selected ?? current?.selected ?? retained.current.selected,
  };
  if (!runtimeUrl) return null;
  const row = (
    label: string,
    value: string,
    items: readonly { id: string; title: string; disabled?: boolean }[],
    onSelect: (id: string) => void,
    placeholder = label,
  ) => (
    <StyledView key={label} className="flex flex-row items-center gap-3">
      <Text
        variant="body-regular"
        className="w-[96px] text-body-regular text-text-primary"
      >
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
              <SelectItem
                value={item.id}
                label={item.title}
                disabled={item.disabled}
              >
                <SelectItemText>{item.title}</SelectItemText>
              </SelectItem>
            )}
          />
        </Select>
      </StyledView>
    </StyledView>
  );
  const presets = [
    { id: 'bloom', title: messages.proceduralAvatar },
    ...CHARACTER_PRESETS.map((item) => ({
      id: item.id,
      title: messages.characterOption('preset', item.id, item.title),
    })),
  ];
  if (character && !presets.some((item) => item.id === character.preset))
    presets.push({
      id: character.preset,
      title:
        character.preset === 'legacy'
          ? messages.proceduralAvatar
          : messages.characterOption(
              'preset',
              character.preset,
              character.preset,
            ),
    });
  const labels: Record<AvatarCharacterCategory, string> = {
    shape: messages.shape,
    color: messages.color,
    eyes: messages.betaEyes,
    eyewear: messages.eyewear,
    accessory: messages.accessory,
  };
  return (
    <StyledView
      className="mt-[15px] flex flex-col gap-2 px-3"
      testID="agent-creator-character-controls"
    >
      {row(
        messages.avatarStyle,
        character?.preset ?? 'bloom',
        presets,
        (id) => onChange(id === 'bloom' ? undefined : { preset: id }),
        messages.betaPreset,
      )}
      {character &&
        (['eyewear', 'accessory'] as AvatarCharacterCategory[]).map(
          (category) =>
            row(
              labels[category],
              character.selections?.[category] ??
                resolved?.selected[category] ??
                'none',
              (category === 'accessory'
                ? [
                    ['none', messages.off] as const,
                    ...CHARACTER_OPTIONS[category],
                  ]
                : CHARACTER_OPTIONS[category]
              ).map(([id, title]) => ({
                id,
                title: messages.characterOption(category, id, title),
                disabled: false,
              })),
              (id) => {
                onChange({
                  ...character,
                  selections: {
                    ...(['eyes', 'eyewear', 'accessory'] as const).reduce(
                      (parts, part) => ({
                        ...parts,
                        ...(resolved?.selected[part]
                          ? { [part]: resolved.selected[part] }
                          : {}),
                      }),
                      {},
                    ),
                    ...character.selections,
                    [category]: id,
                  },
                });
              },
              labels[category],
            ),
        )}
      {character &&
        (character.selections?.eyes ?? resolved?.selected.eyes) !==
          'cyclops' && (
          <StyledView className="flex flex-row items-center gap-3">
            <Text className="w-[96px] text-body-regular text-text-primary">
              {messages.eyeSpacing}
            </Text>
            <StyledView className="min-w-0 flex-1">
              <Slider
                size="sm"
                min={50}
                max={150}
                step={1}
                value={Math.round((character.eyeSpacing ?? 1) * 100)}
                accessibilityLabel={messages.eyeSpacing}
                showTooltip={false}
                onValueChange={(value) =>
                  onChange({ ...character, eyeSpacing: value / 100 })
                }
              />
            </StyledView>
            <Text className="text-body-small text-text-secondary">
              {Math.round((character.eyeSpacing ?? 1) * 100)}%
            </Text>
          </StyledView>
        )}
    </StyledView>
  );
}
