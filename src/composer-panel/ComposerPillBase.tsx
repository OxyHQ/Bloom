import { useComposerButton } from './context';
import { COMPOSER_BUTTON_LAYOUT } from './button-layout';
import { SurfaceLevelProvider, surfaceFillVars, useSurfaceFill, useSurfaceLevelValue } from '../styles/surface-levels';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseRgba } from '../theme/color-utils';
import { SurfacePaint } from '../surface/SurfacePaint';
import {
  Pressable,
  StyleSheet,
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

import { useControllableState } from '../hooks/use-controllable-state';
import { useTextareaAutosize } from '../hooks/use-textarea-autosize';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { RadioIndicator } from '../radio-indicator';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text, TYPE_SCALE } from '../typography';
import { AddMenu } from './AddMenu';
import { MicButton, SendButton, StopButton } from './ComposerControls';
import { useComposerPopover } from './context';
import { EffortSlider } from './EffortSlider';
import {
  composerAddMenu,
  CONTROL_SIZE,
  DEFAULT_EFFORT,
  EFFORT_WIDTH,
  resolveComposerPalette,
  type ComposerPalette,
} from './shared';
import { COMPOSER_PANEL_MESSAGES } from './messages';
import type { ComposerPanelLabels, ComposerPillLabels, ComposerPillProps, ModelPickerModel } from './types';
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

/** Shared glass paint behind an explicitly glass control; fades with its existing transition. */
function GlassChip({ shown, radius, dark }: { shown: boolean; radius: number; dark: boolean }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(shown ? 1 : 0);
  const [mounted, setMounted] = useState(shown);
  useEffect(() => {
    if (shown) setMounted(true);
    opacity.value = reducedMotion ? (shown ? 1 : 0) : withTiming(shown ? 1 : 0, { duration: GLASS_MS, easing: EASE });
    if (!shown) {
      const timer = setTimeout(() => setMounted(false), reducedMotion ? 0 : GLASS_MS);
      return () => clearTimeout(timer);
    }
  }, [shown, reducedMotion, opacity]);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }), [opacity]);
  if (!mounted) return null;
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, fade]}>
    <SurfacePaint fill={`rgba(255, 255, 255, ${dark ? 0.06 : 0.12})`} radius={radius} />
  </Animated.View>;
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
  const Button = useComposerButton();
  const Popover = useComposerPopover();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  // An id with no entry (a model the lineup no longer carries) shows as itself
  // rather than as an empty trigger.
  const modelName = models.find((entry) => entry.id === modelId)?.name ?? modelId;
  const hasEffort = levels.length > 0;
  const triggerStyle: WebCssStyle = {
    // At least 32, never exactly: a fixed height clips the name at the largest
    // system font.
    minHeight: 32,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 12,
    paddingTop: 6,
    paddingBottom: 6,
    paddingRight: 4,
    paddingLeft: 8,
    cursor: 'pointer',
    '--bloom-composer-ring': palette.focusRing,
  };
  return (
    <>
      <Button appearance="plain" tone="neutral"
        ref={triggerRef}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={modelName}
        aria-expanded={open}
        aria-haspopup="dialog"
        onPress={() => setOpen(!open)}

        onLayout={(event) => onTriggerLayout?.(event.nativeEvent.layout.width)}
        style={[COMPOSER_BUTTON_LAYOUT, triggerStyle]}>
        <Text variant="body-medium" numberOfLines={1} style={{ paddingLeft: 2, paddingRight: 2, color: palette.textSecondary }}>
          {modelName}
        </Text>
        <TurningChevron degrees={open ? 180 : 0} color={palette.iconSecondary} />
      </Button>

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
 *   add       36 disc on the chat's semantic add surface (one step
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
  placeholder: placeholderProp,
  compactPlaceholder: compactPlaceholderProp,
  addMenu: addMenuProp,
  onAddMenuSelect,
  models,
  model,
  defaultModel,
  onModelChange,
  effort,
  defaultEffort = DEFAULT_EFFORT,
  onEffortChange,
  effortLevels: effortLevelsProp,
  listening,
  defaultListening = false,
  onListeningChange,
  surface = true,
  glass = false,
  inputRef,
  labels: labelOverrides,
  style,
  maxLines = 8,
  emptyAction,
  onKeyPress: onKeyPressProp,
  testID,
}: ComposerPillProps) {
  useComposerWebCss();
  const theme = useTheme();
  const palette = useMemo(() => resolveComposerPalette(theme), [theme]);
  const { messages } = useMessages(COMPOSER_PANEL_MESSAGES);
  const common = useCommonMessages();
  const labels = useMemo<Required<ComposerPillLabels>>(
    () => ({
      message: messages.message,
      add: messages.add,
      addMenu: messages.addMenu,
      modelSettings: messages.modelSettings,
      models: messages.models,
      modelGroup: messages.modelGroup,
      effort: messages.effort,
      effortAuto: messages.effortAuto,
      faster: messages.faster,
      smarter: messages.smarter,
      voice: messages.voice,
      send: messages.send,
      stop: messages.stop,
      ...labelOverrides,
    }),
    [messages, labelOverrides],
  );
  // `AddMenu` reads the panel's label set; only `add` and `addMenu` reach it.
  const addMenuLabels = useMemo<Required<ComposerPanelLabels>>(
    () => ({
      message: labels.message,
      add: labels.add,
      addMenu: labels.addMenu,
      permissions: messages.permissions,
      permissionMode: messages.permissionMode,
      learnMore: messages.learnMore,
      voice: labels.voice,
      send: labels.send,
      stop: labels.stop,
      remove: common.remove,
      retry: common.retry,
    }),
    [labels, messages, common],
  );
  const placeholder = placeholderProp ?? messages.pillPlaceholder;
  const compactPlaceholder = compactPlaceholderProp ?? messages.pillCompactPlaceholder;
  const addMenu = useMemo(() => addMenuProp ?? composerAddMenu(messages), [addMenuProp, messages]);
  const effortLevels: ReadonlyArray<string> = effortLevelsProp ?? messages.effortLevels;
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

  const fieldRef = useRef<TextInput | null>(null);
  const setFieldRef = useCallback(
    (node: TextInput | null) => {
      fieldRef.current = node;
      if (inputRef) (inputRef as React.MutableRefObject<TextInput | null>).current = node;
    },
    [inputRef],
  );

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
      /*
       * The host sees the key first, and may take it.
       *
       * A composer with a suggestion list over it needs the arrows, Enter and
       * Escape to drive the list, not the field — and there was no way to ask
       * for them, so a host could only offer a list its keyboard could not
       * reach. It runs BEFORE the Enter rule below and a `defaultPrevented`
       * event stops here, which is the only ordering that lets the list win
       * Enter while the field keeps it the rest of the time.
       */
      onKeyPressProp?.(event);
      if (event.defaultPrevented) return;

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
    [submit, disabled, busy, onKeyPressProp],
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

  /*
   * On web the field is measured, not reported. react-native-web's
   * `onContentSizeChange` reads `scrollHeight` on input only, and that never
   * falls below the height already applied: a pill grown to four lines stayed
   * four lines tall after the draft was deleted, and after send — a
   * programmatic clear fires no input at all. `useTextareaAutosize` measures on
   * every change of the draft and collapses the field only when it may have
   * got shorter.
   */
  useTextareaAutosize(fieldRef, text, {
    enabled: IS_WEB,
    height: fieldHeight,
    minHeight: LINE_HEIGHT,
    onMeasure: setContentHeight,
  });

  const parentFill = useSurfaceFill();
  const parentLevel = useSurfaceLevelValue();
  const customSurface = StyleSheet.flatten(style);
  const surfaceFill = customSurface?.backgroundColor ?? palette.surface;
  const paintsSurface = surface && typeof surfaceFill === 'string' && surfaceFill !== 'transparent' && parseRgba(surfaceFill)?.a !== 0;
  const ownFill = paintsSurface ? surfaceFill : customSurface?.backgroundColor;
  const publishedFill = typeof ownFill === 'string' && ownFill !== 'transparent' && parseRgba(ownFill)?.a !== 0
    ? resolveSurfaceMaterial({ fill: ownFill, parentFill, paint: paintsSurface }).publishedFill : undefined;
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
    backgroundColor: 'transparent',
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

  const content = (
    <View {...dataHook('bloomComposerPill')} testID={testID} style={[pillStyle, style, paintsSurface ? { backgroundColor: 'transparent' } : undefined, surfaceFillVars(publishedFill)]}>
      {paintsSurface ? <SurfacePaint fill={surfaceFill} radius={customSurface?.borderRadius ?? (multiLine ? 26 : 9999)} /> : null}
      {addMenu.length > 0 ? (
        <View style={{ position: 'relative', flexShrink: 0 }}>
          <GlassChip shown={glass} radius={CONTROL_SIZE / 2} dark={theme.isDark} />
          <AddMenu
            palette={palette}
            groups={addMenu}
            onSelect={onAddMenuSelect}
            labels={addMenuLabels}
            testID={testID ? `${testID}-add` : undefined}
          />
        </View>
      ) : null}

      <View style={fieldStyle}>
        <TextInput
          ref={setFieldRef}
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
          onContentSizeChange={IS_WEB ? undefined : (event) => setContentHeight(event.nativeEvent.contentSize.height)}
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
        {/* What the trailing control is, in the order the states rank.
         *
         * Stop wins: a turn in flight is the one thing a person needs to be
         * able to reach, and `StopButton` deliberately takes no `disabled`.
         *
         * Then `emptyAction`, if the host gave one and there is nothing to
         * send. An assistant with a voice mode puts it here — the slot where
         * send WOULD be, which is where the thumb already is — and it is the
         * host's control, not a Bloom affordance, because only the host knows
         * whether it has one. Without it the send button simply sits there
         * disabled, as it always did. */}
        {busy && onStop ? (
          <StopButton onPress={onStop} label={labels.stop} />
        ) : emptyAction !== undefined && text.trim() === '' ? (
          emptyAction
        ) : (
          <SendButton disabled={disabled} onPress={submit} label={labels.send} />
        )}
      </View>
    </View>
  );
  return publishedFill ? <SurfaceLevelProvider level={surface ? 1 : parentLevel} fill={publishedFill}>{content}</SurfaceLevelProvider> : content;

}

/**
 * A bare string entry is its own id: the shorthand stays exact, and an `{ id,
 * name }` entry keys, matches and reports by id like `ModelPicker` does.
 */
function normalizeModels(
  models: ReadonlyArray<string | ModelPickerModel>,
): ReadonlyArray<ModelPickerModel> {
  return models.map((entry) => (typeof entry === 'string' ? { id: entry, name: entry } : entry));
}
