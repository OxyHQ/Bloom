import { RiCloseLine as DismissActionIcon } from '../icons/remix/RiCloseLine';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useCharacterHistory } from './use-character-history';
import { useVectorGeometryPreparation } from '../agent-avatar/use-vector-geometry-preparation';
import {
  AgentAvatar,
  avatarBodyHex,
  resolveAvatarCharacter,
  updateAvatarCharacter,
} from '../agent-avatar';
import { normalizeAvatarSkinColor } from '../agent-avatar/skin-color';
import { accountBodyHex, drawnCharacter } from './paint';
import { editorShapeId } from './shape-choices';
import { Button } from '../button';
import { RiArrowGoBackLine } from '../icons/remix/RiArrowGoBackLine';
import { RiArrowGoForwardLine } from '../icons/remix/RiArrowGoForwardLine';

import { useDirectionProps } from '../hooks/use-is-rtl';
import { ROUNDED_FULL } from '../styles/rounded-full';
import { TextFieldInput } from '../text-field';
import { Textarea } from '../textarea';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AgentCreatorField } from './AgentCreatorField';
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
import { AGENT_CREATOR_CARD } from './shared';
import type { AgentCreatorProps } from './types';
import { AGENT_CREATOR_HOOKS, useAgentCreatorWebCss } from './web-css';

/** Controlled creator block; saving and the surrounding panel belong to the host. */
export function AgentCreatorBase(props: AgentCreatorProps) {
  const directionProps = useDirectionProps();
  const messages = useAgentCreatorMessages(props);
  const { agent, onChange, onClose, style } = props;
  useAgentCreatorWebCss();
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
  // Every control draws the character in the agent's colour and writes one edit to the saved
  // one; the history keeps the parts and drops the paint.
  const painted = useMemo(() => drawnCharacter(avatar, agent.color), [avatar, agent.color]);
  const character = useMemo(() => resolveAvatarCharacter(painted), [painted]);
  const edit = (patch: Parameters<typeof updateAvatarCharacter>[1]) =>
    history.change(updateAvatarCharacter(painted, patch));
  const bodyHex = avatarBodyHex(character);
  // The colour control writes the ACCOUNT's colour, as the hex the avatar is drawn in.
  const colorHex = accountBodyHex(agent.color);
  const namedColor = CHARACTER_OPTIONS.color.find(
    ([id]) => normalizeAvatarSkinColor(CHARACTER_COLORS[id]) === colorHex,
  )?.[0];
  const customHex = namedColor === undefined ? colorHex : undefined;
  const changeColor = (hex: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
    const color = normalizeAvatarSkinColor(hex);
    if (color === accountBodyHex(latest.current.agent.color)) return;
    latest.current.onChange({ ...latest.current.agent, color });
  };
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
        <View
          {...directionProps}
          ref={editor}
          accessibilityLabel={messages.editor}
          style={[
            styles.root,
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
                  <Button.Group accessibilityLabel={messages.avatarHistory}>
                    <Button
                      iconOnly
                      leadingIcon={RiArrowGoBackLine}
                      accessibilityLabel={messages.undoAvatar}
                      disabled={!history.canUndo}
                      onPress={history.undo}
                    />
                    <Button
                      iconOnly
                      leadingIcon={RiArrowGoForwardLine}
                      accessibilityLabel={messages.redoAvatar}
                      disabled={!history.canRedo}
                      onPress={history.redo}
                    />
                  </Button.Group>
                }
                actions={
                  !isWithinDialog && onClose ? (
                    <Button
                      appearance="outline"
                      tone="neutral"
                      iconOnly
                      icon={DismissActionIcon}
                      size={20}
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
              <View style={styles.stage}>
                <View
                  pointerEvents="box-none"
                  style={{
                    ...styles.centered,
                    pointerEvents: 'none',
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
                </View>
                <View
                  pointerEvents="auto"
                  style={{
                    ...styles.centered,
                    pointerEvents: 'auto',
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
                </View>
                <View
                  pointerEvents="box-none"
                  style={[styles.arc, { position: 'absolute', left: 0, right: 0, bottom: 0 }]}
                >
                  {shapeChoices && (
                    <ShapeArc
                      key={agent.id}
                      choices={shapeChoices}
                      value={editorShapeId(character.shape)}
                      onSelect={(id) => edit({ shape: id as typeof character.shape })}
                    />
                  )}
                </View>
              </View>
              <View
                style={{ minHeight: 20, alignItems: 'center' }}
                aria-busy={preparing}
                testID="agent-avatar-preparation"
              >
                <Text accessibilityLiveRegion="polite" role="status" variant="caption-1-regular">
                  {preparing ? messages.preparingAvatar : ''}
                </Text>
              </View>
              <View style={[styles.colorRow, { flexShrink: 0 }]}>
                <View
                  collapsable={false}
                  role="group"
                  accessibilityLabel={messages.color}
                  testID="agent-avatar-color-selector"
                  style={{
                    ...styles.colors,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    boxShadow: '0 1px 2px rgba(0,0,0,.05)',
                  }}
                >
                  {CHARACTER_OPTIONS.color.map(([id, title]) => {
                    const active = namedColor === id;
                    const hex = CHARACTER_COLORS[id];
                    const disabled = false;
                    return (
                      <Pressable
                        {...AGENT_CREATOR_HOOKS.swatch}
                        key={id}
                        accessibilityRole="button"
                        accessibilityLabel={messages.avatarColorLabel(
                          messages.characterOption('color', id, title),
                        )}
                        aria-pressed={active}
                        aria-disabled={disabled}
                        accessibilityState={{ selected: active, disabled }}
                        disabled={disabled}
                        onPress={() => changeColor(hex)}
                        style={styles.swatch}
                      >
                        <GlossArt center={hex} edge={hex} active={active} />
                      </Pressable>
                    );
                  })}
                  <Popover>
                    <PopoverTrigger asChild label={messages.customColor}>
                      <Pressable
                        aria-pressed={Boolean(customHex)}
                        accessibilityState={{ selected: Boolean(customHex) }}
                        style={styles.swatch}
                      >
                        <GlossArt
                          rainbow={!customHex}
                          center={customHex}
                          edge={customHex}
                          active={Boolean(customHex)}
                        />
                      </Pressable>
                    </PopoverTrigger>
                    <PopoverContent
                      label={messages.customColor}
                      align="end"
                      minWidth={248}
                      maxWidth={248}
                      style={styles.customColor}
                    >
                      <CustomColorPicker key={agent.id} value={bodyHex} onChange={changeColor} />
                    </PopoverContent>
                  </Popover>
                </View>
              </View>
              <CharacterControls character={painted} onChange={history.change} />
              <View
                style={[
                  styles.details,
                  AGENT_CREATOR_CARD,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
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
              </View>
              {props.sections}
              {preferencesPanel}
            </ScreenScrollView>
          </Screen>
        </View>
      </SurfaceLevelProvider>
    </AgentCreatorCopyContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { height: '100%', minHeight: 0, flexDirection: 'column' },
  stage: { position: 'relative', height: 360, overflow: 'hidden' },
  // `left-1/2 -translate-x-1/2`: the web centres with `translate`; native with each one's transform.
  centered: Platform.OS === 'web' ? ({ translate: '-50% 0' } as object) : {},
  arc: { pointerEvents: 'none', position: 'absolute', insetInline: 0, bottom: 0 },
  colorRow: { marginTop: 15, flexShrink: 0, flexDirection: 'row', justifyContent: 'center' },
  colors: {
    height: 38,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: ROUNDED_FULL,
    borderStyle: 'solid',
    borderWidth: 1,
    padding: 5,
  },
  swatch: {
    position: 'relative',
    width: 26,
    height: 26,
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: ROUNDED_FULL,
  },
  customColor: { width: 248, borderRadius: 24, padding: 10 },
  details: { marginTop: 15 },
});
