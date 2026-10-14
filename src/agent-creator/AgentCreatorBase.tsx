import { useContext, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import {
  AgentAvatar,
  avatarBodyHex,
  resolveAvatarCharacter,
  updateAvatarCharacter,
} from '../agent-avatar';
import { CHARACTER_SHAPES } from '../agent-avatar/character-shapes';
import { CharacterRuntimeContext } from '../agent-avatar/context';
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
import { ScrollSurface } from '../layout/ScrollSurface';
import { ShapeArc } from './ShapeArc';
import { CHARACTER_COLORS, CHARACTER_OPTIONS } from './constants';
import {
  AgentCreatorCopyContext,
  useAgentCreatorBindings,
  useAgentCreatorMessages,
} from './context';
import type { AgentCreatorProps } from './types';

/** Controlled creator block; saving and the surrounding panel belong to the host. */
export function AgentCreatorBase(props: AgentCreatorProps) {
  const directionProps = useDirectionProps();
  const messages = useAgentCreatorMessages(props);
  const { agent, onChange, onClose, className, style } = props;
  const { colors } = useTheme();
  const { Popover, PopoverTrigger, PopoverContent } = useAgentCreatorBindings();
  const [reactionKey, setReactionKey] = useState(0);
  const [workingKey, setWorkingKey] = useState(0);
  const { runtimeUrl } = useContext(CharacterRuntimeContext);
  // Every control reads the resolved character and writes one edit to the saved one.
  const character = useMemo(() => resolveAvatarCharacter(agent.avatar), [agent.avatar]);
  const edit = (patch: Parameters<typeof updateAvatarCharacter>[1]) =>
    onChange({ ...agent, avatar: updateAvatarCharacter(agent.avatar, patch) });
  const paintColor = 'color' in character.paint ? character.paint.color : undefined;
  const customHex = 'bodyColor' in character.paint ? character.paint.bodyColor : undefined;
  const bodyHex = avatarBodyHex(character);
  const shapeChoices = runtimeUrl
    ? CHARACTER_SHAPES.map(([id, title]) => ({
        id,
        label:
          id in messages.shapes
            ? messages.shapes[id as keyof typeof messages.shapes]
            : messages.characterOption('shape', id, title),
        character: updateAvatarCharacter(agent.avatar, { shape: id }),
      }))
    : undefined;
  const eyeChoices = runtimeUrl
    ? CHARACTER_OPTIONS.eyes.map(([id, title]) => ({
        id,
        label: messages.characterOption('eyes', id, title),
        character: updateAvatarCharacter(agent.avatar, { eyes: id }),
        disabled: false,
      }))
    : undefined;
  return (
    <AgentCreatorCopyContext.Provider value={{ locale: props.locale, labels: props.labels }}>
      <StyledView
        {...directionProps}
        accessibilityLabel={messages.editor}
        className={className ?? 'flex h-full min-h-0 flex-col bg-background-full ps-1 pe-2'}
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
                transform: Platform.OS === 'web' ? undefined : [{ translateX: -134 }],
                zIndex: 10,
              }}
            >
              {eyeChoices && (
                <EmotionPicker
                  key={agent.id}
                  choices={eyeChoices}
                  backgroundColor={bodyHex}
                  value={character.eyes}
                  onSelect={(id) => edit({ eyes: id as typeof character.eyes })}
                />
              )}
            </StyledView>
            <StyledView
              pointerEvents={runtimeUrl ? 'auto' : 'none'}
              className={`${runtimeUrl ? 'pointer-events-auto' : 'pointer-events-none'} absolute left-1/2 top-[83px] -translate-x-1/2`}
              style={{
                position: 'absolute',
                left: '50%',
                top: 83,
                transform: Platform.OS === 'web' ? undefined : [{ translateX: -81 }],
              }}
            >
              <AgentAvatar
                character={agent.avatar}
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
              {shapeChoices && (
                <ShapeArc
                  key={agent.id}
                  choices={shapeChoices}
                  value={character.shape}
                  onSelect={(id) => edit({ shape: id as typeof character.shape })}
                />
              )}
            </StyledView>
          </StyledView>
          {runtimeUrl && (
            <StyledView className="mt-2 flex-row justify-center gap-2">
              <Button size="xs" onPress={() => setReactionKey((key) => key + 1)}>
                {messages.reaction}
              </Button>
              <Button size="xs" onPress={() => setWorkingKey((key) => key + 1)}>
                {messages.working}
              </Button>
            </StyledView>
          )}
          <StyledView
            className="mt-[15px] flex shrink-0 flex-row justify-center"
            style={{ flexShrink: 0 }}
          >
            <StyledView
              role="group"
              accessibilityLabel={messages.color}
              testID="agent-avatar-color-selector"
              className="flex h-[38px] shrink-0 items-center gap-1 rounded-full border border-border-button-default bg-background-primary-default p-[5px] shadow-xs flex-row"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                boxShadow: '0 1px 2px rgba(0,0,0,.05)',
              }}
            >
              {runtimeUrl &&
                CHARACTER_OPTIONS.color.map(([id, title]) => {
                  const active = paintColor === id;
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
                      onPress={() => edit({ color: id as typeof paintColor })}
                      className="relative shrink-0 cursor-pointer overflow-hidden rounded-full transition-transform duration-150 ease-out hover:scale-110 outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2 size-[26px]"
                    >
                      <GlossArt center={hex} edge={hex} active={active} />
                    </StyledPressable>
                  );
                })}
              <Popover>
                <PopoverTrigger asChild label={messages.customColor}>
                  <StyledPressable
                    aria-pressed={Boolean(customHex)}
                    accessibilityState={{ selected: Boolean(customHex) }}
                    className="relative size-[26px] shrink-0 overflow-hidden rounded-full"
                  >
                    <GlossArt
                      rainbow={!customHex}
                      center={customHex}
                      edge={customHex}
                      active={Boolean(customHex)}
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
                    value={bodyHex}
                    onChange={(hex) => {
                      if (/^#[0-9a-f]{6}$/i.test(hex)) edit({ bodyColor: hex.toLowerCase() });
                    }}
                  />
                </PopoverContent>
              </Popover>
            </StyledView>
          </StyledView>
          {runtimeUrl && (
            <CharacterControls
              character={agent.avatar}
              onChange={(avatar) => onChange({ ...agent, avatar })}
            />
          )}
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
                  onChangeText={(description) => onChange({ ...agent, description })}
                  placeholder={messages.descriptionPlaceholder}
                />
              </StyledView>
            </StyledView>
          </StyledView>
          {props.showPreferences === false ? null : <AgentPreferencesPanel {...props} />}
        </ScrollSurface>
      </StyledView>
    </AgentCreatorCopyContext.Provider>
  );
}
