import { useComposerButton } from './context';
import { COMPOSER_BUTTON_LAYOUT } from './button-layout';
import { Surface } from '../surface';
import React, { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SurfacePaint } from '../surface/SurfacePaint';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
  type TextInputKeyPressEvent,
  type ViewProps,
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
import { RiErrorWarningLine } from '../icons/remix/RiErrorWarningLine';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { RadioIndicator } from '../radio-indicator';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text, TYPE_SCALE } from '../typography';
import { AddMenu } from './AddMenu';
import { AttachmentStrip } from './AttachmentStrip';
import { Collapse } from './Collapse';
import { ComposerDock } from './ComposerDock';
import { ComposerTrailingActions } from './ComposerTrailingActions';
import { PermissionMenu } from './PermissionMenu';
import { useComposerPopover } from './context';
import { EffortSlider } from './EffortSlider';
import { useAttachmentLabels } from './use-attachment-labels';
import {
  composerAddMenu,
  CONTROL_SIZE,
  DEFAULT_EFFORT,
  EFFORT_WIDTH,
  resolveComposerPalette,
  type ComposerPalette,
} from './shared';
import { COMPOSER_PANEL_MESSAGES } from './messages';
import type {
  ComposerPanelLabels,
  ComposerPillLabels,
  ComposerPillProps,
  ComposerVoiceState,
  ModelPickerModel,
} from './types';
import { useComposerWebCss } from './web-hooks';
import { IS_WEB } from '../styles/platform';
import { dataHook } from '../styles/data-hook';
import { useInteractionState } from '../hooks/use-interaction-state';

const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);
const FROST_MS = 480;
/** `max-width: 639px`. */
const COMPACT_WIDTH = 640;
/** The pill at one line: the field's 20px line box plus 8px padding either side, in a 52 box. */
const PILL_HEIGHT = 52;
/** One line of `body-regular`, which is what the field was fixed at. */
const LINE_HEIGHT = 20;

/** Shared surface paint behind an explicitly frosted control; fades with its existing transition. */
function FrostedChip({ shown, radius, dark }: { shown: boolean; radius: number; dark: boolean }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(shown ? 1 : 0);
  const [mounted, setMounted] = useState(shown);
  useEffect(() => {
    if (shown) setMounted(true);
    opacity.value = reducedMotion
      ? shown
        ? 1
        : 0
      : withTiming(shown ? 1 : 0, { duration: FROST_MS, easing: EASE });
    if (!shown) {
      const timer = setTimeout(() => setMounted(false), reducedMotion ? 0 : FROST_MS);
      return () => clearTimeout(timer);
    }
  }, [shown, reducedMotion, opacity]);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }), [opacity]);
  if (!mounted) return null;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, fade]}>
      <SurfacePaint fill={`rgba(255, 255, 255, ${dark ? 0.06 : 0.12})`} radius={radius} />
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
  const style = useAnimatedStyle(
    () => ({ transform: [{ rotate: `${rotation.value}deg` }] }),
    [rotation],
  );
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
      ...(IS_WEB
        ? { filter: progress.value >= 1 ? 'none' : `blur(${4 * (1 - progress.value)}px)` }
        : null),
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
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
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
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
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
      }}
    >
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
  const triggerRef = useRef<ComponentRef<typeof View>>(null);
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
      <Button
        appearance="plain"
        tone="neutral"
        ref={triggerRef}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={modelName}
        aria-expanded={open}
        aria-haspopup="dialog"
        onPress={() => setOpen(!open)}
        onLayout={(event) => onTriggerLayout?.(event.nativeEvent.layout.width)}
        style={[COMPOSER_BUTTON_LAYOUT, triggerStyle]}
      >
        <Text
          variant="body-medium"
          numberOfLines={1}
          style={{ paddingLeft: 2, paddingRight: 2, color: palette.textSecondary }}
        >
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
        }}
      >
        <View style={{ width: '100%', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
          <Text variant="body-medium" style={{ paddingLeft: 8, color: palette.textSecondary }}>
            {labels.models}
          </Text>
          <View
            role="radiogroup"
            accessibilityLabel={labels.modelGroup}
            style={{ width: '100%', flexDirection: 'column', gap: 4 }}
          >
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
            <View
              style={{
                height: 1,
                marginLeft: -10,
                marginRight: -10,
                marginTop: 7,
                marginBottom: 12,
                backgroundColor: palette.border,
              }}
            />
            <View style={{ width: '100%', flexDirection: 'column' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 8 }}>
                <Text variant="body-medium" style={{ color: palette.textSecondary }}>
                  {`${labels.effort} `}
                </Text>
                <EffortValue
                  value={
                    effort === null ? labels.effortAuto : (levels[effort] ?? labels.effortAuto)
                  }
                  color={palette.text}
                />
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
                  }}
                >
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
 * The AI chat's pill composer (the reference's `Composer` and the frosted composer):
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
 * `frosted` drops the add, model and mic paint (480ms) onto frosted chips, so an
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
  permissions,
  permission,
  defaultPermission,
  onPermissionChange,
  onLearnMore,
  question,
  status,
  models,
  model,
  defaultModel,
  onModelChange,
  effort,
  defaultEffort = DEFAULT_EFFORT,
  onEffortChange,
  effortLevels: effortLevelsProp,
  voiceState,
  defaultVoiceState = 'idle',
  onVoiceStateChange,
  attachments,
  onRemoveAttachment,
  onAttachmentRetry,
  error,
  surface = true,
  frosted = false,
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
      permissions: messages.permissions,
      permissionMode: messages.permissionMode,
      learnMore: messages.learnMore,
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
      transcribing: messages.transcribing,
      remove: common.remove,
      retry: common.retry,
      ...labelOverrides,
    }),
    [messages, common, labelOverrides],
  );
  const { removeFileLabel, retryFileLabel } = useAttachmentLabels(labelOverrides);
  // `AddMenu` and `PermissionMenu` read the panel's label set.
  const addMenuLabels = useMemo<Required<ComposerPanelLabels>>(
    () => ({
      message: labels.message,
      add: labels.add,
      addMenu: labels.addMenu,
      permissions: labels.permissions,
      permissionMode: labels.permissionMode,
      learnMore: labels.learnMore,
      voice: labels.voice,
      send: labels.send,
      stop: labels.stop,
      transcribing: labels.transcribing,
      remove: labels.remove,
      retry: labels.retry,
    }),
    [labels],
  );
  const placeholder = placeholderProp ?? messages.pillPlaceholder;
  const compactPlaceholder = compactPlaceholderProp ?? messages.pillCompactPlaceholder;
  const addMenu = useMemo(() => addMenuProp ?? composerAddMenu(messages), [addMenuProp, messages]);
  const effortLevels: ReadonlyArray<string> = effortLevelsProp ?? messages.effortLevels;
  const compact = useWindowDimensions().width < COMPACT_WIDTH;

  const [text, setText] = useControllableState<string>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const [voice, setVoice] = useControllableState<ComposerVoiceState>({
    value: voiceState,
    defaultValue: defaultVoiceState,
    onChange: onVoiceStateChange,
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

  const fieldRef = useRef<ComponentRef<typeof TextInput> | null>(null);
  const setFieldRef = useCallback(
    (node: ComponentRef<typeof TextInput> | null) => {
      fieldRef.current = node;
      if (inputRef)
        (inputRef as React.MutableRefObject<ComponentRef<typeof TextInput> | null>).current = node;
    },
    [inputRef],
  );

  const controlPalette: ComposerPalette = useMemo(
    () =>
      frosted
        ? {
            ...palette,
            surface: 'transparent',
            hover: 'transparent',
            border: 'transparent',
            shadowXs: '0 0 0 0 transparent',
          }
        : palette,
    [palette, frosted],
  );

  const submit = useCallback(() => {
    if (disabled || busy) return;
    onSubmit?.(text);
  }, [disabled, busy, onSubmit, text]);

  const onKeyPress = useCallback(
    (event: TextInputKeyPressEvent) => {
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

      const native: TextInputKeyPressEvent['nativeEvent'] & {
        shiftKey?: boolean;
        isComposing?: boolean;
      } = event.nativeEvent;
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
        !IS_WEB ||
        native.key !== 'Enter' ||
        native.shiftKey ||
        native.isComposing ||
        disabled ||
        busy
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
  const hasAttachments = !!attachments && attachments.length > 0;
  const errorMessage = typeof error === 'string' && error !== '' ? error : undefined;
  const invalid = error !== undefined && error !== false && error !== '';
  /*
   * The capsule is one line of controls and nothing else. A strip above the
   * field or a reason under it makes the pill a stack, and a fully-round
   * stack puts its first and last rows inside the curve like a grown draft. The same goes
   * for a status tab: its flat foot needs a card edge to sit on, not the crown of a circle.
   */
  const stacked = multiLine || hasAttachments || errorMessage !== undefined || status != null;
  const radius = stacked ? 26 : 9999;

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

  const customSurface = StyleSheet.flatten(style);
  // An error ring is outside the box, so the pill neither shifts nor resizes.
  const errorRing = invalid ? `0 0 0 1px ${palette.error}` : undefined;
  const pillStyle: WebCssStyle = {
    width: '100%',
    flexDirection: 'column',
    borderRadius: radius,
    boxShadow:
      [surface ? palette.shadowXs : undefined, errorRing].filter(Boolean).join(', ') || undefined,
    '--bloom-composer-ring': palette.focusRing,
  };
  const rowStyle: WebCssStyle = {
    height: pillHeight,
    flexDirection: 'row',
    // The controls sit with the LAST line once the field has grown, which is
    // where the caret is; centred, they would drift to the middle of the draft.
    alignItems: multiLine ? 'flex-end' : 'center',
    gap: 10,
    padding: 8,
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

  const pill = (
    <PillRoot
      {...dataHook('bloomComposerPill')}
      testID={testID}
      style={[pillStyle, style]}
      surface={surface}
      radius={typeof customSurface?.borderRadius === 'number' ? customSurface.borderRadius : radius}
    >
      <Collapse open={hasAttachments}>
        <View style={{ paddingTop: 8, paddingLeft: 8, paddingRight: 8 }}>
          <AttachmentStrip
            attachments={attachments ?? []}
            palette={palette}
            onRemove={onRemoveAttachment}
            onRetry={onAttachmentRetry}
            removeLabel={removeFileLabel}
            retryLabel={retryFileLabel}
          />
        </View>
      </Collapse>
      <View style={rowStyle}>
        {addMenu.length > 0 ? (
          <View style={{ position: 'relative', flexShrink: 0 }}>
            <FrostedChip shown={frosted} radius={CONTROL_SIZE / 2} dark={theme.isDark} />
            <AddMenu
              palette={palette}
              groups={addMenu}
              onSelect={onAddMenuSelect}
              labels={addMenuLabels}
              testID={testID ? `${testID}-add` : undefined}
            />
          </View>
        ) : null}

        {permissions && permissions.length > 0 ? (
          <View style={{ flexShrink: 0 }}>
            <PermissionMenu
              palette={palette}
              permissions={permissions}
              value={permission}
              defaultValue={defaultPermission}
              onChange={onPermissionChange}
              onLearnMore={onLearnMore}
              labels={addMenuLabels}
              iconOnly={compact}
              testID={testID ? `${testID}-permission` : undefined}
            />
          </View>
        ) : null}

        <View style={fieldStyle}>
          <TextInput
            ref={setFieldRef}
            {...dataHook('bloomComposerInput')}
            testID={testID ? `${testID}-input` : undefined}
            accessibilityLabel={labels.message}
            aria-invalid={invalid || undefined}
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
            onContentSizeChange={
              IS_WEB ? undefined : (event) => setContentHeight(event.nativeEvent.contentSize.height)
            }
            style={{
              width: '100%',
              height: fieldHeight,
              // react-native-web gives a multiline field a resize grip and a
              // scrollbar it does not need: the pill owns the height.
              ...(IS_WEB
                ? { resize: 'none', overflowY: lines >= maxLines ? 'auto' : 'hidden' }
                : null),
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
            <FrostedChip shown={frosted && modelWidth > 0} radius={12} dark={theme.isDark} />
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

        <View
          style={{
            flexShrink: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 6,
          }}
        >
          <ComposerTrailingActions
            palette={controlPalette}
            voice={voice}
            onVoiceChange={setVoice}
            text={text}
            attachments={attachments}
            busy={busy}
            disabled={disabled}
            onStop={onStop}
            onSubmit={submit}
            emptyAction={emptyAction}
            labels={labels}
            micBackdrop={
              <FrostedChip shown={frosted} radius={CONTROL_SIZE / 2} dark={theme.isDark} />
            }
          />
        </View>
      </View>
      {errorMessage !== undefined ? (
        <View
          role="alert"
          aria-live="assertive"
          testID={testID ? `${testID}-error` : undefined}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 10,
          }}
        >
          <RiErrorWarningLine width={16} height={16} fill={palette.error} />
          <Text variant="body-2-regular" style={{ flexShrink: 1, color: palette.error }}>
            {errorMessage}
          </Text>
        </View>
      ) : null}
    </PillRoot>
  );
  // The dock wraps only when something is docked: a bare pill is the same single node as before.
  return question || status ? (
    <ComposerDock question={question} status={status}>
      {pill}
    </ComposerDock>
  ) : (
    pill
  );
}

/**
 * The pill's root. With `surface` it IS a Bloom `Surface` — the one base every control shares, so
 * the composer's tone follows the same material as buttons and cards; without it the host paints.
 */
function PillRoot({
  surface,
  radius,
  children,
  ...rest
}: ViewProps & { surface: boolean; radius: number }) {
  return surface ? (
    <Surface {...rest} radius={radius}>
      {children}
    </Surface>
  ) : (
    <View {...rest} style={[{ backgroundColor: 'transparent' }, rest.style]}>
      {children}
    </View>
  );
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
