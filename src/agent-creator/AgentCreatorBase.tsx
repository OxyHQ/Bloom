import { useContext, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { AgentAvatar, type AvatarConfig } from '../agent-avatar';
import {
  CHARACTER_SHAPES,
  NATIVE_CHARACTER_SHAPES,
  createConfigForShape,
  currentCharacterShape,
  materializeCharacter,
} from '../agent-avatar/character-shapes';
import type { AvatarCharacterCategory } from '../agent-avatar/config-character';
import {
  CharacterRuntimeContext,
  CharacterCapabilitiesContext,
} from '../agent-avatar/context';
import { legacyCharacterRecipe } from '../agent-avatar/legacy-recipe';
import { Button } from '../button/Button';
import { CloseButton } from '../button/CloseButton';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { TextFieldInput } from '../text-field';
import { Textarea } from '../textarea';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AgentPreferencesPanel } from './AgentPreferencesPanel';
import { CharacterControls } from './CharacterControls';
import { CustomColorPicker } from './CustomColorPicker';
import { EmotionPicker } from './EmotionPicker';
import { GlossArt } from './GlossArt';
import { ScrollSurface } from './ScrollSurface';
import { ShapeArc } from './ShapeArc';
import {
  AVATAR_COLORS,
  CHARACTER_COLORS,
  CHARACTER_OPTIONS,
} from './constants';
import {
  AgentCreatorCopyContext,
  useAgentCreatorBindings,
  useAgentCreatorMessages,
} from './context';
import { avatarHex, hexAppearance } from './shared';
import type { AgentCreatorProps } from './types';

/** Controlled creator block; saving and the surrounding panel belong to the host. */
export function AgentCreatorBase(props: AgentCreatorProps) {
  const directionProps = useDirectionProps();
  const messages = useAgentCreatorMessages(props);
  const { agent, onChange, onClose, className, style } = props;
  const { colors } = useTheme();
  const { Popover, PopoverTrigger, PopoverContent } = useAgentCreatorBindings();
  const c = agent.avatar;
  const [reactionKey, setReactionKey] = useState(0);
  const [workingKey, setWorkingKey] = useState(0);
  const runtime = useContext(CharacterRuntimeContext);
  const catalog = useContext(CharacterCapabilitiesContext);
  const previewConfig = useMemo(
    () => ({ ...c, lookAt: 'wander' as const }),
    [c],
  );
  const { runtimeUrl } = runtime;
  const beta = Boolean(c.character && c.character.preset !== 'bloom');
  const key = JSON.stringify(beta ? c.character : legacyCharacterRecipe(c));
  const currentCapabilities =
    catalog.capabilitiesByKey?.get(key) ??
    (catalog.capabilities?.key === key ? catalog.capabilities : undefined);
  const retained = useRef<{ owner: string; selected: Record<string, string> }>({
    owner: '',
    selected: {},
  });
  const owner = JSON.stringify([agent.id, c.character?.preset ?? 'bloom']);
  if (retained.current.owner !== owner)
    retained.current = { owner, selected: {} };
  if (currentCapabilities)
    retained.current.selected = currentCapabilities.selected;
  const capabilities = currentCapabilities ?? {
    selected: retained.current.selected,
    available: {},
  };
  const betaColor =
    c.character?.selections?.color ?? capabilities?.selected.color;
  const betaBodyColor =
    c.character?.bodyColor ??
    (c.character?.preset === 'clippo' && !c.character.selections?.color
      ? '#999b9d'
      : undefined) ??
    (!betaColor ? capabilities?.selected.bodyColor : undefined);
  const customColorValue = beta
    ? (betaBodyColor ??
      (c.character?.selections?.color
        ? CHARACTER_COLORS[
            c.character.selections.color as keyof typeof CHARACTER_COLORS
          ]
        : undefined) ??
      capabilities?.selected.bodyColor ??
      CHARACTER_COLORS[betaColor as keyof typeof CHARACTER_COLORS] ??
      avatarHex(c))
    : (c.character?.bodyColor ??
      CHARACTER_COLORS[
        c.character?.selections?.color as keyof typeof CHARACTER_COLORS
      ] ??
      avatarHex(c));
  const selectedEyes =
    c.character?.selections?.eyes ??
    capabilities?.selected.eyes ??
    (c.character?.preset === 'clippo'
      ? 'clippo'
      : c.character?.preset === 'lime_frog'
        ? 'todd'
        : 'oval');
  const selectedEyewear =
    c.character?.selections?.eyewear ?? capabilities?.selected.eyewear;
  const selectedAccessory =
    c.character?.selections?.accessory ?? capabilities?.selected.accessory;
  const selectedParts = {
    ...(c.character?.selections?.eyes ||
    capabilities.selected.eyes ||
    c.character?.preset === 'clippo' ||
    c.character?.preset === 'lime_frog'
      ? { eyes: selectedEyes }
      : {}),
    ...(selectedEyewear ? { eyewear: selectedEyewear } : {}),
    ...(selectedAccessory ? { accessory: selectedAccessory } : {}),
  };
  const characterConfig = (
    category: AvatarCharacterCategory,
    id: string,
  ): AvatarConfig => {
    if (category === 'shape')
      return createConfigForShape(c, id, capabilities.selected);
    const character = materializeCharacter(c, capabilities.selected);
    // Choosing a body retains the edited face and the preset's effective parts.
    // Presets supply defaults; their catalog restrictions do not own edits.
    const selections = {
      ...selectedParts,
      ...character.selections,
      [category]: id,
    };
    const next = {
      ...character,
      selections,
    };
    if (category === 'color') delete next.bodyColor;
    return { ...c, character: next };
  };
  const selectCharacter = (category: AvatarCharacterCategory, id: string) =>
    onChange({ ...agent, avatar: characterConfig(category, id) });
  const thumbnailBase = runtimeUrl
    ? runtimeUrl.slice(0, runtimeUrl.lastIndexOf('/') + 1)
    : '';
  const eyeBackground = customColorValue;
  const shapeChoices = runtimeUrl
    ? CHARACTER_SHAPES.map(([id, title]) => ({
        id,
        label:
          id in messages.shapes
            ? messages.shapes[id as keyof typeof messages.shapes]
            : messages.characterOption('shape', id, title),
        config: createConfigForShape(c, id, capabilities.selected),
        ...(NATIVE_CHARACTER_SHAPES.some(([shape]) => shape === id) &&
        id !== 'clippo' &&
        id !== 'todd'
          ? { thumbnail: `${thumbnailBase}thumbnails/shapes/${id}.png` }
          : {}),
      }))
    : undefined;
  const shapeValue =
    c.character?.selections?.shape ??
    (beta
      ? (capabilities.selected.shape ??
        (c.character?.preset === 'clippo' ? 'clippo' : undefined))
      : currentCharacterShape(c));
  const selectShape = (id: string) => selectCharacter('shape', id);
  const eyeChoices = runtimeUrl
    ? CHARACTER_OPTIONS.eyes.map(([id, title]) => ({
        id,
        label: messages.characterOption('eyes', id, title),
        config: characterConfig('eyes', id),
        ...(id === 'clippo' || id === 'cyclops'
          ? { artwork: id }
          : { thumbnail: `${thumbnailBase}thumbnails/eyes/${id}.png` }),
        disabled: false,
      }))
    : undefined;
  const appearance = (patch: Partial<AvatarConfig>) => {
    const { character: _character, ...procedural } = c;
    const character =
      c.character?.preset === 'bloom' ? { ...c.character } : undefined;
    if (
      character &&
      ('hue' in patch || 'saturation' in patch || 'lightness' in patch)
    )
      delete character.bodyColor;
    onChange({
      ...agent,
      avatar: {
        ...procedural,
        ...patch,
        ...(character ? { character } : {}),
        lookAt: 'wander',
      },
    });
  };
  return (
    <AgentCreatorCopyContext.Provider
      value={{ locale: props.locale, labels: props.labels }}
    >
      <StyledView
        {...directionProps}
        accessibilityLabel={messages.editor}
        className={
          className ??
          'flex h-full min-h-0 flex-col bg-background-full ps-1 pe-2'
        }
        style={[
          {
            flex: 1,
            minHeight: 0,
            paddingStart: 4,
            paddingEnd: 8,
            backgroundColor: colors.background,
          },
          style,
        ]}
      >
        <StyledView
          className="relative flex h-8 shrink-0 items-start justify-center pt-4"
          style={{ flexDirection: 'row' }}
        >
          <Text
            variant="body-medium"
            className="max-w-[260px] truncate text-body-medium text-text-primary"
            numberOfLines={1}
            style={{ maxWidth: 260, alignSelf: 'center' }}
          >
            {agent.name || messages.newBot}
          </Text>
          {onClose && (
            <CloseButton
              size="xs"
              accessibilityLabel={messages.closeEditor}
              className="absolute end-0 top-3.5 text-foreground-icon-tertiary"
              style={{ position: 'absolute', end: 0, top: 14 }}
              onPress={onClose}
            />
          )}
        </StyledView>
        <ScrollSurface
          className="flex-1"
          contentClassName="pb-4"
          surface="full"
          label={messages.details}
          fadeBottom
        >
          <StyledView className="relative h-[360px] overflow-hidden">
            <StyledView
              pointerEvents="box-none"
              className="pointer-events-none absolute left-1/2 top-[30px] z-10 -translate-x-1/2"
              style={{
                position: 'absolute',
                left: '50%',
                top: 30,
                transform:
                  Platform.OS === 'web' ? undefined : [{ translateX: -134 }],
                zIndex: 10,
              }}
            >
              <EmotionPicker
                key={agent.id}
                config={c}
                onChange={(eyes) => appearance({ eyes })}
                choices={eyeChoices}
                backgroundColor={eyeBackground}
                value={runtimeUrl ? selectedEyes : undefined}
                onSelect={
                  runtimeUrl ? (id) => selectCharacter('eyes', id) : undefined
                }
              />
            </StyledView>
            <StyledView
              pointerEvents={runtimeUrl ? 'auto' : 'none'}
              className={`${runtimeUrl ? 'pointer-events-auto' : 'pointer-events-none'} absolute left-1/2 top-[83px] -translate-x-1/2`}
              style={{
                position: 'absolute',
                left: '50%',
                top: 83,
                transform:
                  Platform.OS === 'web' ? undefined : [{ translateX: -81 }],
              }}
            >
              <AgentAvatar
                config={previewConfig}
                size={162}
                interactive={Boolean(runtimeUrl)}
                reactionKey={reactionKey}
                workingKey={workingKey}
                label={messages.livePreview(agent.name || messages.newAgent)}
              />
            </StyledView>
            <StyledView
              pointerEvents="box-none"
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
            >
              <ShapeArc
                key={agent.id}
                config={c}
                onChange={(foldShape) =>
                  appearance({
                    foldShape,
                    ...(c.family === 'alien'
                      ? { family: 'fold' as const }
                      : {}),
                  })
                }
                choices={shapeChoices}
                value={shapeChoices ? shapeValue : undefined}
                onSelect={shapeChoices ? selectShape : undefined}
              />
            </StyledView>
          </StyledView>
          {runtimeUrl && (
            <StyledView className="mt-2 flex-row justify-center gap-2">
              <Button
                size="xs"
                onPress={() => setReactionKey((key) => key + 1)}
              >
                {messages.reaction}
              </Button>
              <Button size="xs" onPress={() => setWorkingKey((key) => key + 1)}>
                {messages.working}
              </Button>
            </StyledView>
          )}
          <CharacterControls
            character={
              runtimeUrl
                ? beta
                  ? c.character
                  : materializeCharacter(c, capabilities.selected)
                : c.character
            }
            capabilitiesKey={key}
            selected={capabilities.selected}
            onChange={(character) => {
              if (character)
                onChange({ ...agent, avatar: { ...c, character } });
              else appearance({});
            }}
          />
          <StyledView className="mt-[15px] flex flex-row justify-center">
            <StyledView
              role="group"
              accessibilityLabel={messages.color}
              className="flex h-[38px] shrink-0 items-center gap-1 rounded-full border border-border-button-default bg-background-primary-default p-[5px] shadow-xs flex-row"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                boxShadow: '0 1px 2px rgba(0,0,0,.05)',
              }}
            >
              {!runtimeUrl &&
                AVATAR_COLORS.map(([hue, saturation, name, center, edge]) => {
                  const active =
                    c.hue === hue &&
                    c.saturation === saturation &&
                    c.lightness === undefined;
                  return (
                    <StyledPressable
                      key={name}
                      accessibilityRole="button"
                      accessibilityLabel={messages.avatarColorLabel(
                        messages.colors[name],
                      )}
                      accessibilityState={{ selected: active }}
                      aria-pressed={active}
                      onPress={() =>
                        appearance({
                          hue,
                          saturation,
                          lightness: undefined,
                          lightEyes: false,
                        })
                      }
                      className="relative shrink-0 cursor-pointer overflow-hidden rounded-full transition-transform duration-150 ease-out hover:scale-110 outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2 size-[26px]"
                    >
                      <GlossArt center={center} edge={edge} active={active} />
                    </StyledPressable>
                  );
                })}
              {runtimeUrl &&
                CHARACTER_OPTIONS.color.map(([id, title]) => {
                  const active = !betaBodyColor && betaColor === id;
                  const hex = CHARACTER_COLORS[id];
                  const disabled = false;
                  return (
                    <StyledPressable
                      key={id}
                      accessibilityRole="button"
                      accessibilityLabel={messages.avatarColorLabel(
                        messages.characterOption('color', id, title),
                      )}
                      aria-pressed={active}
                      aria-disabled={disabled}
                      accessibilityState={{ selected: active, disabled }}
                      disabled={disabled}
                      onPress={() => selectCharacter('color', id)}
                      className="relative shrink-0 cursor-pointer overflow-hidden rounded-full transition-transform duration-150 ease-out hover:scale-110 outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2 size-[26px]"
                    >
                      <GlossArt center={hex} edge={hex} active={active} />
                    </StyledPressable>
                  );
                })}
              <Popover>
                <PopoverTrigger asChild label={messages.customColor}>
                  <StyledPressable
                    aria-pressed={
                      runtimeUrl ? Boolean(betaBodyColor) : undefined
                    }
                    accessibilityState={{
                      selected: Boolean(runtimeUrl) && Boolean(betaBodyColor),
                    }}
                    className="relative size-[26px] shrink-0 overflow-hidden rounded-full"
                  >
                    <GlossArt
                      rainbow={!runtimeUrl || !betaBodyColor}
                      center={runtimeUrl ? betaBodyColor : undefined}
                      edge={runtimeUrl ? betaBodyColor : undefined}
                      active={Boolean(runtimeUrl) && Boolean(betaBodyColor)}
                    />
                  </StyledPressable>
                </PopoverTrigger>
                <PopoverContent
                  label={messages.customColor}
                  align="end"
                  minWidth={248}
                  maxWidth={248}
                  className="w-[248px] rounded-3xl p-2.5"
                >
                  <CustomColorPicker
                    value={customColorValue}
                    onChange={(hex) => {
                      const next = hexAppearance(hex);
                      if (!next) return;
                      if (runtimeUrl)
                        onChange({
                          ...agent,
                          avatar: {
                            ...c,
                            ...next,
                            character: {
                              ...materializeCharacter(c, capabilities.selected),
                              bodyColor: hex.toLowerCase(),
                            },
                          },
                        });
                      else appearance(next);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </StyledView>
          </StyledView>
          <StyledView
            className="mt-[15px] overflow-hidden rounded-2xl bg-background-secondary-default ps-3"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <StyledView
              className="grid h-[52px] grid-cols-[96px_minmax(0,1fr)] items-center border-b border-border-button-default dark:border-border-button-default/35 pe-2.5 flex-row"
              style={{
                flexDirection: 'row',
                alignContent: 'stretch',
                borderColor: colors.border,
              }}
            >
              <Text
                variant="body-regular"
                className="text-body-regular text-text-primary"
                style={{ width: 96 }}
              >
                {messages.name}
              </Text>
              <StyledView className="min-w-0 flex-1">
                <TextFieldInput
                  label={messages.nameInput}
                  size="sm"
                  maxLength={48}
                  value={agent.name}
                  onChangeText={(name) => onChange({ ...agent, name })}
                  /* i18n-exempt: original example person’s proper name */
                  placeholder={'Michael Scott'}
                />
              </StyledView>
            </StyledView>
            <StyledView
              className="grid h-[52px] grid-cols-[96px_minmax(0,1fr)] items-center border-b border-border-button-default dark:border-border-button-default/35 pe-2.5 flex-row"
              style={{
                flexDirection: 'row',
                alignContent: 'stretch',
                borderColor: colors.border,
              }}
            >
              <Text
                variant="body-regular"
                className="text-body-regular text-text-primary"
                style={{ width: 96 }}
              >
                {messages.label}
              </Text>
              <StyledView className="min-w-0 flex-1">
                <TextFieldInput
                  label={messages.labelInput}
                  size="sm"
                  maxLength={60}
                  value={agent.label}
                  onChangeText={(label) => onChange({ ...agent, label })}
                  placeholder={messages.labelPlaceholder}
                />
              </StyledView>
            </StyledView>
            <StyledView
              className="grid h-[82px] grid-cols-[96px_minmax(0,1fr)] items-start py-2.5 pe-2.5 flex-row"
              style={{ flexDirection: 'row' }}
            >
              <Text
                variant="body-regular"
                className="pt-1 text-body-regular text-text-primary"
                style={{ width: 96, paddingTop: 4 }}
              >
                {messages.description}
              </Text>
              <StyledView className="min-w-0 flex-1">
                <Textarea
                  accessibilityLabel={messages.descriptionInput}
                  size="sm"
                  rows={2}
                  resize="none"
                  maxLength={500}
                  fieldStyle={{ height: 62 }}
                  style={{ height: 62 }}
                  value={agent.description}
                  onChangeText={(description) =>
                    onChange({ ...agent, description })
                  }
                  placeholder={messages.descriptionPlaceholder}
                />
              </StyledView>
            </StyledView>
          </StyledView>
          <AgentPreferencesPanel {...props} />
        </ScrollSurface>
      </StyledView>
    </AgentCreatorCopyContext.Provider>
  );
}
