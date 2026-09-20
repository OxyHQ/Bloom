import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  TextInput,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { resolveButtonRamps } from '../button/shared';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { RadioIndicator } from '../radio-indicator';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text, TYPE_SCALE } from '../typography';
import { AddMenu } from './AddMenu';
import { MicButton, SendButton, StopButton } from './ComposerControls';
import { useComposerPopover } from './context';
import { EffortSlider } from './EffortSlider';
import {
  COMPOSER_PANEL_ADD_MENU,
  CONTROL_SIZE,
  DEFAULT_EFFORT,
  EFFORT_WIDTH,
  MODEL_PICKER_EFFORT_LEVELS,
  resolveComposerPalette,
  type ComposerPalette,
} from './shared';
import type { ComposerPillLabels, ComposerPillProps, ModelPickerModel } from './types';
import { dataHook, IS_WEB, useComposerWebCss } from './web-hooks';

const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);
const GLASS_MS = 480;
/** `max-width: 639px`. */
const COMPACT_WIDTH = 640;
/** The pill at one line: the field's 20px line box plus 8px padding either side, in a 52 box. */
const PILL_HEIGHT = 52;
/** One line of `body-regular`, which is what the field was fixed at. */
const LINE_HEIGHT = 20;

const DEFAULT_LABELS: Required<ComposerPillLabels> = {
  message: 'Message',
  add: 'Add attachment',
  addMenu: 'Add to chat',
  modelSettings: 'Model settings',
  models: 'Models',
  modelGroup: 'Model',
  effort: 'Effort',
  effortAuto: 'Auto',
  faster: 'Faster',
  smarter: 'Smarter',
  voice: 'Voice input',
  send: 'Send message',
  stop: 'Stop generating',
};

/**
 * A frosted chip behind a control while the composer is on glass: a 6px
 * saturated backdrop blur, a white tint (12% light, 6% dark), a 155° white sheen
 * at half strength and a 0.3px conic rim lit from the top left. Native has no
 * backdrop filter, so it keeps the tint alone. Fades with the glass (480ms).
 */
function GlassChip({ shown, radius, dark }: { shown: boolean; radius: number; dark: boolean }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(shown ? 1 : 0);
  useEffect(() => {
    const target = shown ? 1 : 0;
    opacity.value = reducedMotion ? target : withTiming(target, { duration: GLASS_MS, easing: EASE });
  }, [shown, reducedMotion, opacity]);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }), [opacity]);
  const fill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius } as const;
  const frost: WebCssStyle = {
    ...fill,
    backdropFilter: 'blur(6px) saturate(160%)',
    WebkitBackdropFilter: 'blur(6px) saturate(160%)',
  };
  const sheen: WebCssStyle = {
    ...fill,
    opacity: 0.5,
    backgroundImage:
      'linear-gradient(155deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0) 68%, rgba(255, 255, 255, 0.32) 100%)',
  };
  return (
    <Animated.View pointerEvents="none" style={[fill, fade]}>
      {IS_WEB ? <View style={frost} /> : null}
      <View style={[fill, { backgroundColor: `rgba(255, 255, 255, ${dark ? 0.06 : 0.12})` }]} />
      {IS_WEB ? <View style={sheen} /> : null}
      {IS_WEB ? <View {...dataHook('bloomComposerGlassRim')} style={fill} /> : null}
    </Animated.View>
  );
}

/** A chevron that turns to `degrees` over 200ms `ease`. */
function TurningChevron({ degrees, color }: { degrees: number; color: string }) {
  const reducedMotion = useReducedMotion();
  const rotation = useSharedValue(degrees);
  useEffect(() => {
    rotation.value = reducedMotion ? degrees : withTiming(degrees, { duration: 200, easing: EASE });
  }, [degrees, reducedMotion, rotation]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }), [rotation]);
  return (
    <Animated.View style={[{ width: 18, height: 18, flexShrink: 0 }, style]}>
      <RiArrowDownSLine width={18} height={18} fill={color} />
    </Animated.View>
  );
}

/** The effort value after "Effort", blurring in (350ms ease-out) each time it changes. */
function EffortValue({ value, color }: { value: string; color: string }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reducedMotion) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 350, easing: EASE_OUT });
  }, [value, reducedMotion, progress]);
  const style = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      ...(IS_WEB ? { filter: progress.value >= 1 ? 'none' : `blur(${4 * (1 - progress.value)}px)` } : null),
    }),
    [progress],
  );
  return (
    <Animated.View style={style}>
      <Text variant="body-medium" style={{ color }}>
        {value}
      </Text>
    </Animated.View>
  );
}

function ModelRow({
  name,
  selected,
  onPress,
  palette,
}: {
  name: string;
  selected: boolean;
  onPress: () => void;
  palette: ComposerPalette;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  /**
   * The field's measured content height, from `onContentSizeChange`.
   *
   * Measured rather than counted: a draft wraps, so the number of LINES is not
   * the number of newlines, and only the field knows how its own text laid out.
   */
  const [contentHeight, setContentHeight] = useState(LINE_HEIGHT);
  return (
    <Pressable
      {...dataHook('bloomComposerRow')}
      accessibilityRole="radio"
      accessibilityLabel={name}
      aria-checked={selected}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: 8,
        borderRadius: 10,
        backgroundColor: selected || hovered || focused ? palette.hover : 'transparent',
        cursor: 'pointer',
      }}>
      <Text variant="body-medium" numberOfLines={1} style={{ flexShrink: 1, color: palette.text }}>
        {name}
      </Text>
      <View pointerEvents="none">
        <RadioIndicator selected={selected} size={14} />
      </View>
    </Pressable>
  );
}

/**
 * The composer's model button and its "Models / Effort" panel: a 32-tall trigger (radius 12, py 6 / pr 4 / pl 8, primary-hover on
 * hover) with the model in body-medium text-secondary and an 18px chevron that
 * turns over while open, opening a 266px panel upward (radius 16, 1px border,
 * p 10, shadow-dropdown):
 *
 *   models   pt 4, label → rows 6: "Models" (pl 8, body-medium secondary), then a
 *            radio row per model — p 8, radius 10, body-medium primary + 14px
 *            radio, primary-hover while selected or hovered, 4 apart. Rows key,
 *            match and report by id; a string entry is its own id
 *   effort   only with stops to choose from — no `effortLevels`, no divider and
 *            no slider, rather than a slider that cannot commit
 *   divider  full bleed (−10 each side), 7 above, 12 below
 *   effort   "Effort <value>" (the value text-primary, blurring in on change),
 *            Faster / Smarter (body-2-medium secondary, px 8 / pt 8 / pb 3) and
 *            the six-stop slider in px 8 / pb 8
 *
 * Choosing a model closes the panel; nudging effort leaves it open.
 */
function ModelMenu({
  models,
  modelId,
  onModelChange,
  effort,
  onEffortChange,
  levels,
  labels,
  palette,
  triggerPalette,
  onTriggerLayout,
  testID,
}: {
  models: ReadonlyArray<ModelPickerModel>;
  modelId: string;
  onModelChange: (modelId: string) => void;
  effort: number | null;
  onEffortChange: (effort: number) => void;
  levels: ReadonlyArray<string>;
  labels: Required<ComposerPillLabels>;
  palette: ComposerPalette;
  triggerPalette: ComposerPalette;
  onTriggerLayout?: (width: number) => void;
  testID?: string;
}) {
  const Popover = useComposerPopover();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  // An id with no entry (a model the lineup no longer carries) shows as itself
  // rather than as an empty trigger.
  const modelName = models.find((entry) => entry.id === modelId)?.name ?? modelId;
  const hasEffort = levels.length > 0;
  const triggerStyle: WebCssStyle = {
    height: 32,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 12,
    backgroundColor: hovered ? triggerPalette.hover : triggerPalette.surface,
    paddingTop: 6,
    paddingBottom: 6,
    paddingRight: 4,
    paddingLeft: 8,
    cursor: 'pointer',
    '--bloom-composer-ring': palette.focusRing,
  };
  return (
    <>
      <Pressable
        ref={triggerRef}
        testID={testID}
        {...dataHook('bloomComposerControl')}
        accessibilityRole="button"
        accessibilityLabel={modelName}
        aria-expanded={open}
        aria-haspopup="dialog"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onLayout={(event) => onTriggerLayout?.(event.nativeEvent.layout.width)}
        style={triggerStyle}>
        <Text variant="body-medium" numberOfLines={1} style={{ paddingLeft: 2, paddingRight: 2, color: palette.textSecondary }}>
          {modelName}
        </Text>
        <TurningChevron degrees={open ? 180 : 0} color={palette.iconSecondary} />
      </Pressable>

      <Popover
        open={open}
        onOpenChange={setOpen}
        anchorRef={triggerRef}
        label={labels.modelSettings}
        side="top"
        sideOffset={8}
        testID={testID ? `${testID}-panel` : undefined}
        style={{
          width: EFFORT_WIDTH,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.surface,
          padding: 10,
          boxShadow: palette.shadowDropdown,
          gap: 0,
        }}>
        <View style={{ width: '100%', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
          <Text variant="body-medium" style={{ paddingLeft: 8, color: palette.textSecondary }}>
            {labels.models}
          </Text>
          <View role="radiogroup" accessibilityLabel={labels.modelGroup} style={{ width: '100%', flexDirection: 'column', gap: 4 }}>
            {models.map((entry) => (
              <ModelRow
                key={entry.id}
                name={entry.name}
                selected={entry.id === modelId}
                palette={palette}
                onPress={() => {
                  onModelChange(entry.id);
                  setOpen(false);
                }}
              />
            ))}
          </View>
        </View>
        {hasEffort ? (
          <>
            <View style={{ height: 1, marginLeft: -10, marginRight: -10, marginTop: 7, marginBottom: 12, backgroundColor: palette.border }} />
            <View style={{ width: '100%', flexDirection: 'column' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 8 }}>
                <Text variant="body-medium" style={{ color: palette.textSecondary }}>
                  {`${labels.effort} `}
                </Text>
                <EffortValue value={effort === null ? labels.effortAuto : (levels[effort] ?? labels.effortAuto)} color={palette.text} />
              </View>
              <View style={{ width: '100%', flexDirection: 'column', gap: 4 }}>
                <View
                  style={{
                    width: '100%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 8,
                    paddingBottom: 3,
                  }}>
                  <Text variant="body-2-medium" style={{ color: palette.textSecondary }}>
                    {labels.faster}
                  </Text>
                  <Text variant="body-2-medium" style={{ color: palette.textSecondary }}>
                    {labels.smarter}
                  </Text>
                </View>
                <View style={{ width: '100%', paddingLeft: 8, paddingRight: 8, paddingBottom: 8 }}>
                  <EffortSlider
                    value={effort}
                    onChange={onEffortChange}
                    levels={levels}
                    label={labels.effort}
                    unsetLabel={labels.effortAuto}
                    palette={palette}
                  />
                </View>
              </View>
            </View>
          </>
        ) : null}
      </Popover>
    </>
  );
}

/**
 * The AI chat's pill composer (the reference's `Composer` and `GlassComposer`):
 *
 *   pill      52 tall, full radius, p 8, gap 10; background-primary + shadow-xs
 *             (`surface`)
 *   add       36 disc on the chat's add surface (neutral-100 / dark 700, one step
 *             darker hovered) whose plus turns 45° while the 361px menu is open
 *   field     20 tall, flex 1, body-regular text-primary, accent-500 caret,
 *             placeholder text-tertiary ("Ask me anything", "Ask me" under 640);
 *             unfocused on web, its last 32px fade into the pill
 *   model     the model menu trigger (see `ModelMenu`)
 *   controls  pl 6, gap 8: the bordered mic (dancing accent bars while
 *             listening) and the `bg-button-primary` send disc — which becomes
 *             the stop disc while `busy`, outside `disabled`'s reach
 *
 * `glass` drops the add, model and mic paint (480ms) onto frosted chips, so an
 * active `ComposerLoader` behind the pill shows through them.
 */
export function ComposerPillBase({
  value,
  defaultValue = '',
  onValueChange,
  onSubmit,
  onStop,
  busy = false,
  disabled = false,
  placeholder = 'Ask me anything',
  compactPlaceholder = 'Ask me',
  addMenu = COMPOSER_PANEL_ADD_MENU,
  onAddMenuSelect,
  models,
  model,
  defaultModel,
  onModelChange,
  effort,
  defaultEffort = DEFAULT_EFFORT,
  onEffortChange,
  effortLevels = MODEL_PICKER_EFFORT_LEVELS,
  listening,
  defaultListening = false,
  onListeningChange,
  surface = true,
  glass = false,
  inputRef,
  labels: labelOverrides,
  style,
  maxLines = 8,
  testID,
}: ComposerPillProps) {
  useComposerWebCss();
  const theme = useTheme();
  const palette = useMemo(() => resolveComposerPalette(theme), [theme]);
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelOverrides }), [labelOverrides]);
  const compact = useWindowDimensions().width < COMPACT_WIDTH;

  const [text, setText] = useControllableState<string>({ value, defaultValue, onChange: onValueChange });
  const [isListening, setListening] = useControllableState<boolean>({
    value: listening,
    defaultValue: defaultListening,
    onChange: onListeningChange,
  });
  const lineup = useMemo(() => normalizeModels(models ?? []), [models]);
  const [modelId, setModel] = useControllableState<string>({
    value: model,
    defaultValue: defaultModel ?? lineup[0]?.id ?? '',
    onChange: onModelChange,
  });
  const [effortValue, setEffort] = useControllableState<number | null>({
    value: effort,
    defaultValue: defaultEffort,
    // The menu can only ever land on a stop; `null` is the caller's to hold.
    onChange: (next) => {
      if (next !== null) onEffortChange?.(next);
    },
  });
  const [focused, setFocused] = useState(false);
  /**
   * The field's measured content height, from `onContentSizeChange`.
   *
   * Measured rather than counted: a draft wraps, so the number of LINES is not
   * the number of newlines, and only the field knows how its own text laid out.
   */
  const [contentHeight, setContentHeight] = useState(LINE_HEIGHT);
  const [modelWidth, setModelWidth] = useState(0);

  // The chat's add surface is a step lighter than the Composer Panel's:
  // `ai-chat-composer-add-background` neutral-100 / dark 700, hovered 200 / dark 600.
  const addPalette: ComposerPalette = useMemo(() => {
    if (glass) return { ...palette, add: 'transparent', addHover: 'transparent' };
    const { neutral: n } = resolveButtonRamps(theme);
    return {
      ...palette,
      add: theme.isDark ? n[700] : n[100],
      addHover: theme.isDark ? n[600] : n[200],
    };
  }, [palette, glass, theme]);
  const controlPalette: ComposerPalette = useMemo(
    () =>
      glass
        ? { ...palette, surface: 'transparent', hover: 'transparent', border: 'transparent', shadowXs: '0 0 0 0 transparent' }
        : palette,
    [palette, glass],
  );

  const submit = useCallback(() => {
    if (disabled || busy) return;
    onSubmit?.(text);
  }, [disabled, busy, onSubmit, text]);

  const onKeyPress = useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const native: TextInputKeyPressEventData & { shiftKey?: boolean; isComposing?: boolean } = event.nativeEvent;
      /*
       * Shift+Enter is a NEWLINE, not a send.
       *
       * This handler used to read only the key, so a person holding shift to
       * break a line sent the half-written message instead — on a field that
       * could not have held the line anyway. `ComposerPanelBase` has always
       * had the clause (`… || native.shiftKey || …`); the pill did not, and
       * the two composers disagreeing about the most-used key in a composer
       * was a difference nobody chose.
       */
      if (
        !IS_WEB
        || native.key !== 'Enter'
        || native.shiftKey
        || native.isComposing
        || disabled
        || busy
      ) {
        return;
      }
      event.preventDefault();
      submit();
    },
    [submit, disabled, busy],
  );

  /*
   * How tall the pill is: one line, or as many as the draft needs up to
   * `maxLines`.
   *
   * It was `height: PILL_HEIGHT` with a `height: 20` field and no `multiline`
   * — under react-native-web that is an `<input>`, which cannot hold a newline
   * and cannot grow. A composer for an assistant has to hold a paragraph, so
   * the field is multiline and the pill measures it.
   *
   * The radius stays at 9999 while it is one line and squares off to 26 beyond
   * that: a fully-round multi-line box puts the first and last lines inside
   * the curve, where the text meets the edge.
   */
  const lines = Math.min(maxLines, Math.max(1, Math.ceil(contentHeight / LINE_HEIGHT) || 1));
  const fieldHeight = lines * LINE_HEIGHT;
  /*
   * At one line the pill is exactly what it always was. Its 52 comes from the
   * CONTROLS — a 36px disc inside 8px padding — not from the 20px field, so
   * growing from the field's height would have SHRUNK the resting pill to 36.
   * Each line after the first adds its own height and nothing else moves.
   */
  const pillHeight = PILL_HEIGHT + (lines - 1) * LINE_HEIGHT;
  const multiLine = lines > 1;

  const pillStyle: WebCssStyle = {
    width: '100%',
    height: pillHeight,
    flexDirection: 'row',
    // The controls sit with the LAST line once the field has grown, which is
    // where the caret is; centred, they would drift to the middle of the draft.
    alignItems: multiLine ? 'flex-end' : 'center',
    gap: 10,
    borderRadius: multiLine ? 26 : 9999,
    padding: 8,
    backgroundColor: surface ? palette.surface : 'transparent',
    boxShadow: surface ? palette.shadowXs : undefined,
    '--bloom-composer-ring': palette.focusRing,
  };

  const fieldStyle: WebCssStyle = {
    height: fieldHeight,
    minWidth: 0,
    flex: 1,
    // The fade that hints at overflowing text is a ONE-LINE affordance: on a
    // grown field it would dim the end of every line.
    ...(IS_WEB && !focused && !multiLine
      ? {
          maskImage: 'linear-gradient(to right, #000 calc(100% - 32px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, #000 calc(100% - 32px), transparent 100%)',
        }
      : null),
  };

  return (
    <View {...dataHook('bloomComposerPill')} testID={testID} style={[pillStyle, style]}>
      {addMenu.length > 0 ? (
        <View style={{ position: 'relative', flexShrink: 0 }}>
          <GlassChip shown={glass} radius={CONTROL_SIZE / 2} dark={theme.isDark} />
          <AddMenu
            palette={addPalette}
            groups={addMenu}
            onSelect={onAddMenuSelect}
            labels={{ ...DEFAULT_PANEL_LABELS, add: labels.add, addMenu: labels.addMenu }}
            testID={testID ? `${testID}-add` : undefined}
          />
        </View>
      ) : null}

      <View style={fieldStyle}>
        <TextInput
          ref={inputRef}
          {...dataHook('bloomComposerInput')}
          testID={testID ? `${testID}-input` : undefined}
          accessibilityLabel={labels.message}
          value={text}
          onChangeText={setText}
          onKeyPress={onKeyPress}
          onSubmitEditing={submit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={compact ? compactPlaceholder : placeholder}
          placeholderTextColor={palette.textTertiary}
          selectionColor={palette.accent500}
          cursorColor={palette.accent500}
          returnKeyType="send"
          multiline
          onContentSizeChange={(event) => setContentHeight(event.nativeEvent.contentSize.height)}
          style={{
            width: '100%',
            height: fieldHeight,
            // react-native-web gives a multiline field a resize grip and a
            // scrollbar it does not need: the pill owns the height.
            ...(IS_WEB ? { resize: 'none', overflowY: lines >= maxLines ? 'auto' : 'hidden' } : null),
            padding: 0,
            margin: 0,
            ...TYPE_SCALE['body-regular'],
            fontFamily: IS_WEB ? 'var(--bloom-font-sans)' : 'Inter',
            color: palette.text,
            backgroundColor: 'transparent',
            ...(IS_WEB ? { caretColor: palette.accent500 } : null),
          }}
        />
      </View>

      {lineup.length > 0 ? (
        <View style={{ position: 'relative', flexShrink: 0 }}>
          <GlassChip shown={glass && modelWidth > 0} radius={12} dark={theme.isDark} />
          <ModelMenu
            models={lineup}
            modelId={modelId}
            onModelChange={setModel}
            effort={effortValue}
            onEffortChange={setEffort}
            levels={effortLevels}
            labels={labels}
            palette={palette}
            triggerPalette={controlPalette}
            onTriggerLayout={setModelWidth}
            testID={testID ? `${testID}-model` : undefined}
          />
        </View>
      ) : null}

      <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6 }}>
        <View style={{ position: 'relative' }}>
          <GlassChip shown={glass} radius={CONTROL_SIZE / 2} dark={theme.isDark} />
          <MicButton
            listening={isListening}
            onToggle={() => setListening(!isListening)}
            label={labels.voice}
            palette={controlPalette}
          />
        </View>
        {busy && onStop ? (
          <StopButton onPress={onStop} label={labels.stop} palette={palette} />
        ) : (
          <SendButton disabled={disabled} onPress={submit} label={labels.send} palette={palette} />
        )}
      </View>
    </View>
  );
}

const DEFAULT_PANEL_LABELS = {
  message: 'Message',
  add: 'Add attachment',
  addMenu: 'Add to chat',
  permissions: 'Permissions',
  permissionMode: 'Permission mode',
  learnMore: 'Learn more',
  voice: 'Voice input',
  send: 'Send message',
  stop: 'Stop generating',
  remove: 'Remove',
};

/**
 * A bare string entry is its own id: the shorthand stays exact, and an `{ id,
 * name }` entry keys, matches and reports by id like `ModelPicker` does.
 */
function normalizeModels(
  models: ReadonlyArray<string | ModelPickerModel>,
): ReadonlyArray<ModelPickerModel> {
  return models.map((entry) => (typeof entry === 'string' ? { id: entry, name: entry } : entry));
}
