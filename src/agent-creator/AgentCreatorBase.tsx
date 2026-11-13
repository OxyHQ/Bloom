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
import { ColorSwatchPicker } from '../color-swatch-picker';
import { APP_COLOR_PRESETS, COLOR_PRESET_REGISTRY, FREE_COLOR_NAMES } from '../theme/color-presets';
import { drawnCharacter } from './paint';
import { editorShapeId } from './shape-choices';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { RiArrowGoBackLine } from '../icons/remix/RiArrowGoBackLine';
import { RiArrowGoForwardLine } from '../icons/remix/RiArrowGoForwardLine';
import { CloseButton } from '../button/CloseButton';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { TextFieldInput } from '../text-field';
import { Textarea } from '../textarea';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AgentCreatorField } from './AgentCreatorField';
import { AgentPreferencesPanel } from './AgentPreferencesPanel';
import { CharacterControls } from './CharacterControls';
import { EmotionPicker } from './EmotionPicker';
import { PageHeader } from '../page-header/PageHeader';
import { useDialogContext } from '../dialog/context';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { useSurfaceBacking } from '../surface/use-surface-backing';
import { ShapeArc } from './ShapeArc';
import { CHARACTER_OPTIONS } from './constants';
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
  const { Screen, ScreenScrollView } = useAgentCreatorBindings();
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
  // The colours offered are the host's, and only those Bloom can draw.
  const offered = useMemo(
    () => (props.colors ?? FREE_COLOR_NAMES).filter((key) => key in APP_COLOR_PRESETS),
    [props.colors],
  );
  const swatches = useMemo(() => {
    const keyOf: Record<string, string> = {};
    const names: Record<string, string> = {};
    const hexes = offered.map((key) => {
      const preset = COLOR_PRESET_REGISTRY.find(({ name }) => name === key)!;
      keyOf[preset.hex] = key;
      names[preset.hex] = preset.displayName;
      return preset.hex;
    });
    return { hexes, keyOf, names };
  }, [offered]);
  // Every control draws the character in the agent's colour and writes one edit to the saved
  // one; the history keeps the parts and drops the paint.
  const painted = useMemo(
    () => drawnCharacter(avatar, agent.color, offered),
    [avatar, agent.color, offered],
  );
  const character = useMemo(() => resolveAvatarCharacter(painted), [painted]);
  const edit = (patch: Parameters<typeof updateAvatarCharacter>[1]) =>
    history.change(updateAvatarCharacter(painted, patch));
  const bodyHex = avatarBodyHex(character);
  const chosenHex = (APP_COLOR_PRESETS as Record<string, { hex: string } | undefined>)[agent.color]
    ?.hex;
  const shapeChoices = useMemo(
    () =>
      CHARACTER_OPTIONS.shape.map(([id, title]) => ({
        id,
        label:
          id in messages.shapes
            ? messages.shapes[id as keyof typeof messages.shapes]
            : messages.characterOption('shape', id, title),
        character: updateAvatarCharacter(painted, { shape: id }),
      })),
    [painted, messages],
  );
  const nearby = useMemo(() => {
    const index = CHARACTER_OPTIONS.shape.findIndex(
      ([id]) => id === editorShapeId(character.shape),
    );
    return [index - 1, index + 1].flatMap((i) => {
      const next = CHARACTER_OPTIONS.shape[i];
      return next ? [updateAvatarCharacter(painted, { shape: next[0] })] : [];
    });
  }, [painted, character.shape]);
  useVectorGeometryPreparation(nearby);
  const eyeChoices = useMemo(
    () =>
      CHARACTER_OPTIONS.eyes.map(([id, title]) => ({
        id,
        label: messages.characterOption('eyes', id, title),
        character: updateAvatarCharacter(painted, { eyes: id }),
        disabled: false,
      })),
    [painted, messages],
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
                leading={
                  <ButtonGroup accessibilityLabel={messages.avatarHistory}>
                    <ButtonGroupItem
                      iconOnly
                      leadingIcon={RiArrowGoBackLine}
                      accessibilityLabel={messages.undoAvatar}
                      disabled={!history.canUndo}
                      onPress={history.undo}
                    />
                    <ButtonGroupItem
                      iconOnly
                      leadingIcon={RiArrowGoForwardLine}
                      accessibilityLabel={messages.redoAvatar}
                      disabled={!history.canRedo}
                      onPress={history.redo}
                    />
                  </ButtonGroup>
                }
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
                    character={painted}
                    size={162}
                    interactive
                    renderer="svg"
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
              <StyledView className="mt-[15px] px-3" testID="agent-avatar-color-selector">
                <ColorSwatchPicker
                  label={messages.color}
                  value={chosenHex ?? ''}
                  onValueChange={(hex) => {
                    const color = swatches.keyOf[hex];
                    if (color !== undefined && color !== agent.color) onChange({ ...agent, color });
                  }}
                  colors={swatches.hexes}
                  names={swatches.names}
                  size={22}
                  style={{ justifyContent: 'center' }}
                />
              </StyledView>
              <CharacterControls character={painted} onChange={history.change} />
              <StyledView
                className="mt-[15px] overflow-hidden rounded-2xl bg-background-secondary-default ps-3"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <AgentCreatorField label={messages.name} divider={false}>
                  <TextFieldInput
                    label={messages.nameInput}
                    size="sm"
                    maxLength={48}
                    value={agent.name}
                    onChangeText={(name) => onChange({ ...agent, name })}
                    /* i18n-exempt: original example person’s proper name */
                    placeholder={'Michael Scott'}
                  />
                </AgentCreatorField>
                <AgentCreatorField label={messages.label}>
                  <TextFieldInput
                    label={messages.labelInput}
                    size="sm"
                    maxLength={60}
                    value={agent.label}
                    onChangeText={(label) => onChange({ ...agent, label })}
                    placeholder={messages.labelPlaceholder}
                  />
                </AgentCreatorField>
                <AgentCreatorField label={messages.description} multiline>
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
                </AgentCreatorField>
                {props.children}
              </StyledView>
              {props.sections}
              {preferencesPanel}
            </ScreenScrollView>
          </Screen>
        </StyledView>
      </SurfaceLevelProvider>
    </AgentCreatorCopyContext.Provider>
  );
}
