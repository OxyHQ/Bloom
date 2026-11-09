import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Platform, type View } from 'react-native';
import { useCharacterHistory } from './use-character-history';
import { useVectorGeometryPreparation } from '../agent-avatar/use-vector-geometry-preparation';
import {
  AgentAvatar,
  avatarBodyHex,
  resolveAvatarCharacter,
  updateAvatarCharacter,
} from '../agent-avatar';
import { editorShapeId } from './shape-choices';
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
import { PageHeader } from '../page-header/PageHeader';
import { useDialogContext } from '../dialog/context';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { useSurfaceBacking } from '../surface/use-surface-backing';
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
  const { isWithinDialog } = useDialogContext();
  const { colors } = useTheme();
  const backing = useSurfaceBacking(colors.background, style);
  const { Screen, ScreenScrollView, Popover, PopoverTrigger, PopoverContent } =
    useAgentCreatorBindings();
  const latest = useRef({ agent, onChange });
  latest.current = { agent, onChange };
  const copy = useMemo(
    () => ({ locale: props.locale, labels: props.labels }),
    [props.locale, props.labels],
  );
  const changePreferences = useCallback((next: AgentCreatorProps['agent']) => {
    latest.current.onChange({ ...latest.current.agent, preferences: next.preferences });
  }, []);
  const preferencesPanel = useMemo(
    () =>
      props.showPreferences === false ? null : (
        <AgentPreferencesPanel {...props} onChange={changePreferences} />
      ),
    [
      agent.preferences,
      props.showPreferences,
      props.voices,
      props.onPreviewVoice,
      props.locale,
      props.labels,
      changePreferences,
    ],
  );
  const history = useCharacterHistory(agent, onChange);
  const avatar = history.character;
  const editor = useRef<ComponentRef<typeof View> | null>(null);
  const [preparing, setPreparing] = useState(false);
  const keyboard = useRef(history);
  keyboard.current = history;
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = editor.current as unknown as HTMLElement | null;
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.defaultPrevented ||
        event.isComposing ||
        target.isContentEditable ||
        target.closest('input, textarea, [contenteditable="true"], [role="textbox"]')
      )
        return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey && keyboard.current.canUndo) {
        event.preventDefault();
        keyboard.current.undo();
      } else if ((key === 'y' || (key === 'z' && event.shiftKey)) && keyboard.current.canRedo) {
        event.preventDefault();
        keyboard.current.redo();
      }
    };
    node?.addEventListener('keydown', keydown);
    return () => node?.removeEventListener('keydown', keydown);
  }, []);
  const [reactionKey, setReactionKey] = useState(0);
  const [workingKey, setWorkingKey] = useState(0);
  // Every control reads the resolved character and writes one edit to the saved one.
  const character = useMemo(() => resolveAvatarCharacter(avatar), [avatar]);
  const edit = (patch: Parameters<typeof updateAvatarCharacter>[1]) =>
    history.change(updateAvatarCharacter(avatar, patch));
  const paintColor = 'color' in character.paint ? character.paint.color : undefined;
  const customHex = 'bodyColor' in character.paint ? character.paint.bodyColor : undefined;
  const bodyHex = avatarBodyHex(character);
  const shapeChoices = useMemo(
    () =>
      CHARACTER_OPTIONS.shape.map(([id, title]) => ({
        id,
        label:
          id in messages.shapes
            ? messages.shapes[id as keyof typeof messages.shapes]
            : messages.characterOption('shape', id, title),
        character: updateAvatarCharacter(avatar, { shape: id }),
      })),
    [avatar, messages],
  );
  const nearby = useMemo(() => {
    const index = CHARACTER_OPTIONS.shape.findIndex(
      ([id]) => id === editorShapeId(character.shape),
    );
    return [index - 1, index + 1].flatMap((i) => {
      const next = CHARACTER_OPTIONS.shape[i];
      return next ? [updateAvatarCharacter(avatar, { shape: next[0] })] : [];
    });
  }, [avatar, character.shape]);
  useVectorGeometryPreparation(nearby);
  const eyeChoices = useMemo(
    () =>
      CHARACTER_OPTIONS.eyes.map(([id, title]) => ({
        id,
        label: messages.characterOption('eyes', id, title),
        character: updateAvatarCharacter(avatar, { eyes: id }),
        disabled: false,
      })),
    [avatar, messages],
  );
  return (
    <AgentCreatorCopyContext.Provider value={copy}>
      <SurfaceLevelProvider level={backing.level} fill={backing.fill}>
        <StyledView
          {...directionProps}
          ref={editor}
          accessibilityLabel={messages.editor}
          className={className ?? 'flex h-full min-h-0 flex-col bg-background-full'}
          style={[
            {
              flex: 1,
              minHeight: 0,
              backgroundColor: colors.background,
            },
            style,
            backing.vars,
          ]}
        >
          <Screen
            scroll="auto"
            documentScroll={false}
            contentClearance={0}
            header={
              <PageHeader
                title={agent.name || messages.newBot}
                titleAlign="center"
                sticky={false}
                safeArea={false}
                actions={
                  !isWithinDialog && onClose ? (
                    <CloseButton
                      size="xs"
                      accessibilityLabel={messages.closeEditor}
                      onPress={onClose}
                    />
                  ) : undefined
                }
              />
            }
          >
            <ScreenScrollView
              accessibilityLabel={messages.details}
              style={{ flex: 1, minHeight: 0 }}
              contentContainerStyle={{ paddingStart: 4, paddingEnd: 8, paddingBottom: 16 }}
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
                  pointerEvents="auto"
                  className="pointer-events-auto absolute left-1/2 top-[83px] -translate-x-1/2"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 83,
                    transform: Platform.OS === 'web' ? undefined : [{ translateX: -81 }],
                  }}
                >
                  <AgentAvatar
                    character={avatar}
                    size={162}
                    interactive
                    renderer="svg"
                    reactionKey={reactionKey}
                    workingKey={workingKey}
                    onLoadingChange={setPreparing}
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
                      value={editorShapeId(character.shape)}
                      onSelect={(id) => edit({ shape: id as typeof character.shape })}
                    />
                  )}
                </StyledView>
              </StyledView>
              <StyledView
                style={{ minHeight: 20, alignItems: 'center' }}
                aria-busy={preparing}
                testID="agent-avatar-preparation"
              >
                <Text accessibilityLiveRegion="polite" role="status" variant="caption-1-regular">
                  {preparing ? messages.preparingAvatar : ''}
                </Text>
              </StyledView>
              <StyledView className="mt-2 flex-row justify-center gap-2">
                <Button size="xs" onPress={() => setReactionKey((key) => key + 1)}>
                  {messages.reaction}
                </Button>
                <Button size="xs" onPress={() => setWorkingKey((key) => key + 1)}>
                  {messages.working}
                </Button>
              </StyledView>
              <StyledView
                className="mt-[15px] flex shrink-0 flex-row justify-center"
                style={{ flexShrink: 0 }}
              >
                <StyledView
                  collapsable={false}
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
                  {CHARACTER_OPTIONS.color.map(([id, title]) => {
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
                        key={agent.id}
                        value={bodyHex}
                        onInteractionStart={history.begin}
                        onInteractionEnd={history.end}
                        onChange={(hex) => {
                          if (/^#[0-9a-f]{6}$/i.test(hex)) edit({ bodyColor: hex.toLowerCase() });
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </StyledView>
              </StyledView>
              <CharacterControls character={avatar} onChange={history.change} />
              <StyledView className="mt-3 flex-row flex-wrap justify-center gap-2">
                <Button appearance="plain" onPress={history.undo} disabled={!history.canUndo}>
                  {messages.undoAvatar}
                </Button>
                <Button appearance="plain" onPress={history.redo} disabled={!history.canRedo}>
                  {messages.redoAvatar}
                </Button>
                <Button appearance="plain" onPress={history.restore} disabled={!history.canRestore}>
                  {messages.restoreAvatar}
                </Button>
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
                {agent.handle === undefined ? null : (
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
                      {messages.handle}
                    </Text>
                    <StyledView className="min-w-0 flex-1">
                      <TextFieldInput
                        label={messages.handleInput}
                        size="sm"
                        maxLength={32}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={agent.handle}
                        onChangeText={(handle) => onChange({ ...agent, handle })}
                      />
                    </StyledView>
                  </StyledView>
                )}
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
              {preferencesPanel}
            </ScreenScrollView>
          </Screen>
        </StyledView>
      </SurfaceLevelProvider>
    </AgentCreatorCopyContext.Provider>
  );
}
