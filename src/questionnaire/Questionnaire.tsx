import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  Pressable,
  TextInput,
  View,
  type LayoutChangeEvent,
  type TextInput as TextInputType,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Button, CloseButton } from '../button';
import { mixColor, resolveButtonRamps } from '../button/shared';
import {
  CHECKBOX_GLYPH_CSS,
  CHECKBOX_GLYPH_STYLE_ID,
  CheckboxGlyph,
  resolveCheckboxPaint,
  type CheckboxPaint,
} from '../checkbox/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { clamp } from '../styles/clamp';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import type {
  QuestionnaireAnswer,
  QuestionnaireAnswers,
  QuestionnaireLabels,
  QuestionnaireOption,
  QuestionnaireProps,
  QuestionnaireQuestion,
  QuestionnaireSelect,
} from './types';

/**
 * The questions an agent asks before it commits to a plan, one at a time, as
 * a card in the thread.
 *
 *   card      radius 20, surface, padding 12, gap 10, two-layer shadow
 *             (0 4px 2px 2% over 0 1px 0.5px 5%)
 *   prompt    body-medium text, inset 2px left, 28px right when dismissable;
 *             20px circular dismiss 12/12 from the corner
 *   rows      radius 16, 1px border neutral-200 (dark 700), padding 9/19/9/11
 *             inside the border (a 60px row for title + description), gap 16,
 *             8 between rows; body-medium title over body-regular neutral-500
 *   multiple  Bloom's 16px `CheckboxGlyph` in a 4px vertical inset, hovering
 *             with its ROW; Next advances
 *   single    body-2-medium number key (radius 4, px 5 py 2) that steps one tone
 *             up on row hover / pick; picking advances after `advanceDelay`, and
 *             the digit keys pick too (web)
 *   other     free-text row: title over a bare 20px body-regular field;
 *             typing selects it, Enter continues, focus lifts the row
 *   footer    pt 2; accent pill tabs "Step N" (px 8 py 5, gap 8) with a thumb
 *             that slides between them, small secondary Previous / primary Next
 *
 * Row paint (semantic tokens → Bloom ramps):
 *
 *                 light                         dark
 *   resting       card, border n-200            n-800, border n-700
 *   hover         n-100                         n-700 @60% over n-800
 *   pressed       n-200, border n-300           n-800, border n-500
 *   selected      n-100, border n-300           n-700 @60%, border n-500
 *   key           n-100 → n-200 raised          n-700 → n-600 raised
 *
 * Questions cross-fade and slide 28px in the direction of travel (320ms,
 * `cubic-bezier(0.22, 1, 0.36, 1)`; plus a 4px blur on web) while the card
 * animates to the next question's height over 380ms, so the footer glides.
 * All of it snaps under reduced motion. No press scale anywhere.
 */

// ---------------------------------------------------------------------------
//  Palette
// ---------------------------------------------------------------------------

interface QuestionnairePalette {
  surface: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  rowBorder: string;
  rowBorderHover: string;
  rowHover: string;
  rowActive: string;
  key: string;
  keyRaised: string;
  ring: string;
  pillSelected: string;
  pillHover: string;
  pillLabelSelected: string;
  checkbox: CheckboxPaint;
}

/** Semantic tokens onto Bloom's ramps. Pure, so a test can walk it. */
export function resolveQuestionnairePalette(theme: Theme): QuestionnairePalette {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  const surface = dark ? n[800] : theme.colors.card;
  return {
    surface,
    text: theme.colors.text,
    textSecondary: n[500],
    textTertiary: dark ? n[600] : n[400],
    rowBorder: dark ? n[700] : n[200],
    rowBorderHover: dark ? n[500] : n[300],
    rowHover: dark ? mixColor(surface, n[700], 0.6) : n[100],
    rowActive: dark ? n[800] : n[200],
    key: dark ? n[700] : n[100],
    keyRaised: dark ? n[600] : n[200],
    ring: accent[500],
    pillSelected: dark ? mixColor(surface, accent[950], 0.6) : accent[50],
    pillHover: dark ? n[800] : n[100],
    pillLabelSelected: accent[500],
    checkbox: resolveCheckboxPaint(theme),
  };
}

// ---------------------------------------------------------------------------
//  Geometry + motion
// ---------------------------------------------------------------------------

const IS_WEB = Platform.OS === 'web';

const CARD_RADIUS = 20;
const CARD_PADDING = 12;
const CARD_GAP = 10;
const CARD_SHADOW = '0 4px 2px rgba(0, 0, 0, 0.02), 0 1px 0.5px rgba(0, 0, 0, 0.05)';
/** The viewport's breathing room above and below the rows, for their focus rings. */
const VIEWPORT_INSET = 4;
const ROW_RADIUS = 16;
const ROW_GAP = 8;
const KEY_RADIUS = 4;

const SLIDE = 28;
const PANEL_MS = 320;
const HEIGHT_MS = 380;
const COLOR_MS = 150;
const PILL_THUMB_MS = 300;
const PILL_HOVER_MS = 200;
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const PILL_EASE = Easing.bezier(0.34, 1.2, 0.64, 1);

const BODY_MEDIUM: TextStyle = TYPE_SCALE['body-medium'];
const BODY_REGULAR: TextStyle = TYPE_SCALE['body-regular'];
const BODY_2_MEDIUM: TextStyle = TYPE_SCALE['body-2-medium'];

const EMPTY_ANSWER: QuestionnaireAnswer = { values: [] };

const DEFAULT_LABELS: Required<QuestionnaireLabels> = {
  previous: 'Previous',
  next: 'Next',
  complete: 'Done',
  other: 'Other',
  otherPlaceholder: 'Enter your custom answer here',
  dismiss: 'Dismiss',
  steps: 'Steps',
};

// ---------------------------------------------------------------------------
//  Web CSS: focus rings, colour transitions, the check draw-in. Every hook is a
//  `dataSet` attribute — react-native-web drops unknown props, and a class never
//  reaches the DOM through react-native-css.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-questionnaire-web-css';
const ROW = '[data-bloom-questionnaire-row]';
const KEY = '[data-bloom-questionnaire-key]';
const PILL = '[data-bloom-questionnaire-pill]';
const PANEL = '[data-bloom-questionnaire-panel]';
const INPUT = '[data-bloom-questionnaire-input]';

const WEB_CSS = `
${ROW}, ${KEY} {
  transition: background-color ${COLOR_MS}ms ease, border-color ${COLOR_MS}ms ease, color ${COLOR_MS}ms ease, box-shadow ${COLOR_MS}ms ease;
}
${ROW}, ${PILL}, ${PANEL}, ${INPUT} {
  outline: none;
}
${ROW} { user-select: none; }
${ROW}[data-bloom-questionnaire-row="other"] { cursor: text; user-select: auto; }
${ROW}[data-bloom-questionnaire-row="pick"]:focus-visible {
  box-shadow: 0 0 0 2px var(--bloom-questionnaire-ring);
}
[data-bloom-questionnaire-toggle] { outline: none; cursor: pointer; }
${PILL}:focus-visible {
  box-shadow: 0 0 0 2px var(--bloom-questionnaire-ring);
}
${INPUT}::placeholder { color: var(--bloom-questionnaire-placeholder); opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  ${ROW}, ${KEY} { transition: none; }
}
`;

function dataSet(entries: Record<string, string>): Record<string, unknown> {
  return IS_WEB ? { dataSet: entries } : {};
}

function useHover() {
  const [hovered, setHovered] = useState(false);
  const onHoverIn = useCallback(() => setHovered(true), []);
  const onHoverOut = useCallback(() => setHovered(false), []);
  return { hovered, onHoverIn, onHoverOut };
}

function usePressed() {
  const [pressed, setPressed] = useState(false);
  const onPressIn = useCallback(() => setPressed(true), []);
  const onPressOut = useCallback(() => setPressed(false), []);
  return { pressed, onPressIn, onPressOut };
}

type RowState = 'rest' | 'hover' | 'pressed' | 'selected';

function rowStyle(palette: QuestionnairePalette, state: RowState): ViewStyle {
  return {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: ROW_RADIUS,
    borderWidth: 1,
    borderColor:
      state === 'pressed' || state === 'selected' ? palette.rowBorderHover : palette.rowBorder,
    backgroundColor:
      state === 'hover' || state === 'selected'
        ? palette.rowHover
        : state === 'pressed'
          ? palette.rowActive
          : palette.surface,
    // Longhands: 10 / 20 / 10 / 12 with the stroke drawn inside.
    paddingTop: 9,
    paddingBottom: 9,
    paddingLeft: 11,
    paddingRight: 19,
  };
}

// ---------------------------------------------------------------------------
//  Parts
// ---------------------------------------------------------------------------

function OptionText({
  label,
  description,
  palette,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  palette: QuestionnairePalette;
}) {
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={[BODY_MEDIUM, { color: palette.text }]}>{label}</Text>
      {description !== undefined && description !== null ? (
        <Text style={[BODY_REGULAR, { color: palette.textSecondary }]}>{description}</Text>
      ) : null}
    </View>
  );
}

/** The number key on single-select rows; one tone up whenever its row is lifted. */
function OptionKey({
  index,
  raised,
  palette,
}: {
  index: number;
  raised: boolean;
  palette: QuestionnairePalette;
}) {
  return (
    <View
      {...dataSet({ bloomQuestionnaireKey: '' })}
      aria-hidden
      style={{
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: KEY_RADIUS,
        paddingLeft: 5,
        paddingRight: 5,
        paddingTop: 2,
        paddingBottom: 2,
        backgroundColor: raised ? palette.keyRaised : palette.key,
      }}
    >
      <Text style={[BODY_2_MEDIUM, { color: palette.text }]}>{index + 1}</Text>
    </View>
  );
}

function CheckboxRow({
  option,
  checked,
  onChange,
  palette,
  testID,
}: {
  option: QuestionnaireOption;
  checked: boolean;
  onChange: (selected: boolean) => void;
  palette: QuestionnairePalette;
  testID?: string;
}) {
  const { hovered, onHoverIn, onHoverOut } = useHover();
  const { pressed, onPressIn, onPressOut } = usePressed();
  const name = typeof option.label === 'string' ? option.label : option.value;
  return (
    <Pressable
      {...dataSet({ bloomQuestionnaireRow: 'check', bloomCheckboxFocusable: '' })}
      testID={testID}
      role="checkbox"
      aria-checked={checked}
      accessibilityLabel={name}
      onPress={() => onChange(!checked)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={rowStyle(palette, pressed ? 'pressed' : hovered ? 'hover' : 'rest')}
    >
      <OptionText label={option.label} description={option.description} palette={palette} />
      <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', paddingTop: 4, paddingBottom: 4 }}>
        <CheckboxGlyph
          size="medium"
          checked={checked}
          indeterminate={false}
          disabled={false}
          highlighted={hovered}
          paint={palette.checkbox}
        />
      </View>
    </Pressable>
  );
}

function PickRow({
  option,
  index,
  selected,
  onPick,
  palette,
  testID,
}: {
  option: QuestionnaireOption;
  index: number;
  selected: boolean;
  onPick: () => void;
  palette: QuestionnairePalette;
  testID?: string;
}) {
  const { hovered, onHoverIn, onHoverOut } = useHover();
  const { pressed, onPressIn, onPressOut } = usePressed();
  const name = typeof option.label === 'string' ? option.label : option.value;
  return (
    <Pressable
      {...dataSet({ bloomQuestionnaireRow: 'pick' })}
      testID={testID}
      role="button"
      aria-pressed={selected}
      accessibilityState={{ selected }}
      aria-keyshortcuts={index < 9 ? String(index + 1) : undefined}
      accessibilityLabel={name}
      onPress={onPick}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={rowStyle(
        palette,
        selected ? 'selected' : pressed ? 'pressed' : hovered ? 'hover' : 'rest',
      )}
    >
      <OptionText label={option.label} description={option.description} palette={palette} />
      <OptionKey index={index} raised={selected || hovered} palette={palette} />
    </Pressable>
  );
}

function OtherToggle({
  checked,
  label,
  onChange,
  palette,
  testID,
}: {
  checked: boolean;
  label: string;
  onChange: (selected: boolean) => void;
  palette: QuestionnairePalette;
  testID?: string;
}) {
  const { hovered, onHoverIn, onHoverOut } = useHover();
  return (
    <Pressable
      {...dataSet({ bloomQuestionnaireToggle: '', bloomCheckboxFocusable: '' })}
      testID={testID}
      role="checkbox"
      aria-checked={checked}
      accessibilityLabel={label}
      onPress={() => onChange(!checked)}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      hitSlop={14}
      style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', paddingTop: 4, paddingBottom: 4 }}
    >
      <CheckboxGlyph
          size="medium"
          checked={checked}
          indeterminate={false}
          disabled={false}
          highlighted={hovered}
          paint={palette.checkbox}
        />
    </Pressable>
  );
}

function OtherRow({
  mode,
  index,
  label,
  placeholder,
  draft,
  selected,
  inputRef,
  onDraftChange,
  onSelectedChange,
  onSubmit,
  palette,
  testID,
}: {
  mode: QuestionnaireSelect;
  index: number;
  label: string;
  placeholder: string;
  draft: string;
  selected: boolean;
  inputRef: React.RefObject<TextInputType | null>;
  onDraftChange: (text: string) => void;
  onSelectedChange: (selected: boolean) => void;
  onSubmit: () => void;
  palette: QuestionnairePalette;
  testID?: string;
}) {
  const { hovered, onHoverIn, onHoverOut } = useHover();
  const [focused, setFocused] = useState(false);
  const lifted = focused || (mode === 'single' && selected);
  const state: RowState = lifted ? 'selected' : hovered ? 'hover' : 'rest';

  const inputStyle: TextStyle = {
    ...BODY_REGULAR,
    color: palette.text,
    height: 20,
    width: '100%',
    minWidth: 0,
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  };

  return (
    <Pressable
      {...dataSet({ bloomQuestionnaireRow: 'other' })}
      testID={testID}
      // A press on the row itself lands in the field.
      onPress={() => inputRef.current?.focus()}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      accessible={false}
      focusable={false}
      style={rowStyle(palette, state)}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[BODY_MEDIUM, { color: palette.text }]}>{label}</Text>
        <TextInput
          {...dataSet({ bloomQuestionnaireInput: '' })}
          ref={inputRef}
          testID={testID ? `${testID}-input` : undefined}
          accessibilityLabel={label}
          placeholder={placeholder}
          placeholderTextColor={palette.textTertiary}
          value={draft}
          onChangeText={onDraftChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmit}
          submitBehavior="submit"
          returnKeyType="next"
          style={inputStyle}
        />
      </View>
      {mode === 'multiple' ? (
        <OtherToggle
          checked={selected}
          label={label}
          onChange={onSelectedChange}
          palette={palette}
          testID={testID ? `${testID}-toggle` : undefined}
        />
      ) : (
        <OptionKey index={index} raised={selected || hovered} palette={palette} />
      )}
    </Pressable>
  );
}

interface PillBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function StepPill({
  label,
  selected,
  onPress,
  onLayout,
  palette,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  palette: QuestionnairePalette;
  testID?: string;
}) {
  const reducedMotion = useReducedMotion();
  const { hovered, onHoverIn, onHoverOut } = useHover();
  const hover = useSharedValue(0);
  useEffect(() => {
    const target = hovered && !selected ? 1 : 0;
    hover.value = reducedMotion
      ? target
      : withTiming(target, { duration: PILL_HOVER_MS, easing: Easing.bezier(0, 0, 0.2, 1) });
  }, [hovered, selected, reducedMotion, hover]);
  const hoverStyle = useAnimatedStyle(() => ({ opacity: hover.value }), [hover]);

  return (
    <Pressable
      {...dataSet({ bloomQuestionnairePill: '' })}
      testID={testID}
      role="button"
      aria-pressed={selected}
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onLayout={onLayout}
      style={{
        flexShrink: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 5,
        paddingBottom: 5,
        borderRadius: borderRadius.full,
        zIndex: 1,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: borderRadius.full,
            backgroundColor: palette.pillHover,
          },
          hoverStyle,
        ]}
      />
      <Text
        numberOfLines={1}
        style={[
          BODY_MEDIUM,
          { color: selected ? palette.pillLabelSelected : palette.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** The pill tab list (blue): a thumb that slides to the selected pill with a soft overshoot. */
function StepPills({
  questions,
  step,
  onSelect,
  label,
  palette,
  testID,
}: {
  questions: ReadonlyArray<QuestionnaireQuestion>;
  step: number;
  onSelect: (index: number) => void;
  label: string;
  palette: QuestionnairePalette;
  testID?: string;
}) {
  const reducedMotion = useReducedMotion();
  const [boxes, setBoxes] = useState<Record<number, PillBox>>({});
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const w = useSharedValue(0);
  const h = useSharedValue(0);
  const placed = useRef(false);
  const target = boxes[step];

  useEffect(() => {
    if (!target) return;
    if (!placed.current || reducedMotion) {
      placed.current = true;
      x.value = target.x;
      y.value = target.y;
      w.value = target.width;
      h.value = target.height;
      return;
    }
    const config = { duration: PILL_THUMB_MS, easing: PILL_EASE };
    x.value = withTiming(target.x, config);
    y.value = withTiming(target.y, config);
    w.value = withTiming(target.width, config);
    h.value = withTiming(target.height, config);
  }, [target, reducedMotion, x, y, w, h]);

  const thumbStyle = useAnimatedStyle(
    () => ({
      width: w.value,
      height: h.value,
      transform: [{ translateX: x.value }, { translateY: y.value }],
    }),
    [x, y, w, h],
  );

  return (
    <View
      role="group"
      accessibilityLabel={label}
      testID={testID}
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, flexShrink: 1 }}
    >
      {target ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              borderRadius: borderRadius.full,
              backgroundColor: palette.pillSelected,
            },
            thumbStyle,
          ]}
        />
      ) : null}
      {questions.map((entry, index) => (
        <StepPill
          key={entry.id}
          label={entry.stepLabel ?? `Step ${index + 1}`}
          selected={index === step}
          onPress={() => onSelect(index)}
          onLayout={(event) => {
            const { x: lx, y: ly, width, height } = event.nativeEvent.layout;
            setBoxes((current) => {
              const prev = current[index];
              if (prev && prev.x === lx && prev.y === ly && prev.width === width && prev.height === height) {
                return current;
              }
              return { ...current, [index]: { x: lx, y: ly, width, height } };
            });
          }}
          palette={palette}
          testID={testID ? `${testID}-${index}` : undefined}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Panel transition
// ---------------------------------------------------------------------------

/**
 * `AnimatePresence mode="popLayout"`: the incoming panel takes the layout slot
 * and fades/slides in from `SLIDE × direction`; the outgoing one is popped out
 * of flow (absolute, same inset) and leaves toward `-SLIDE × direction`.
 */
function SlidingPanel({
  role,
  direction,
  animate,
  onExited,
  onLayout,
  panelRef,
  children,
}: {
  role: 'enter' | 'exit';
  direction: number;
  animate: boolean;
  onExited?: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  panelRef?: React.Ref<View>;
  children: React.ReactNode;
}) {
  const progress = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (!animate) {
      progress.value = 1;
      if (role === 'exit') onExited?.();
      return;
    }
    progress.value = withTiming(1, { duration: PANEL_MS, easing: EASE }, (finished) => {
      'worklet';
      if (finished && role === 'exit' && onExited) runOnJS(onExited)();
    });
    // Runs once per mount: a panel animates exactly one transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const visible = role === 'enter' ? p : 1 - p;
    const offset = role === 'enter' ? (1 - p) * SLIDE * direction : -p * SLIDE * direction;
    const style: Record<string, unknown> = {
      opacity: visible,
      transform: [{ translateX: offset }],
    };
    if (IS_WEB) style.filter = `blur(${(1 - visible) * 4}px)`;
    return style;
  }, [progress, role, direction]);

  return (
    <Animated.View
      ref={panelRef}
      {...dataSet({ bloomQuestionnairePanel: '' })}
      {...(IS_WEB && role === 'enter' ? { tabIndex: -1 } : {})}
      onLayout={onLayout}
      pointerEvents={role === 'exit' ? 'none' : 'auto'}
      aria-hidden={role === 'exit' ? true : undefined}
      style={[
        { gap: CARD_GAP },
        role === 'exit'
          ? { position: 'absolute', top: VIEWPORT_INSET, left: CARD_PADDING, right: CARD_PADDING }
          : null,
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
//  Questionnaire
// ---------------------------------------------------------------------------

function QuestionnaireComponent({
  questions,
  select = 'multiple',
  step: stepProp,
  defaultStep = 0,
  onStepChange,
  answers: answersProp,
  defaultAnswers,
  onAnswersChange,
  onComplete,
  onDismiss,
  advanceDelay = 180,
  labels,
  style,
  testID,
}: QuestionnaireProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveQuestionnairePalette(theme), [theme]);
  const reducedMotion = useReducedMotion();
  const headingId = `bloom-questionnaire-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const text = { ...DEFAULT_LABELS, ...labels };
  const total = questions.length;
  const lastIndex = Math.max(total - 1, 0);

  useEffect(() => {
    if (!IS_WEB) return;
    adoptStyleSheet(STYLE_ID, WEB_CSS);
    adoptStyleSheet(CHECKBOX_GLYPH_STYLE_ID, CHECKBOX_GLYPH_CSS);
  }, []);

  const [stepState, setStepState] = useState(() => clamp(defaultStep, 0, lastIndex));
  const step = clamp(stepProp ?? stepState, 0, lastIndex);

  const [answersState, setAnswersState] = useState<QuestionnaireAnswers>(defaultAnswers ?? {});
  const answers = answersProp ?? answersState;
  // The freshest answers, for a scheduled advance and chained updates in one tick.
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Free text survives unticking the row and coming back to the question.
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const seeded: Record<string, string> = {};
    for (const [id, answer] of Object.entries(defaultAnswers ?? {})) {
      if (answer.other !== undefined) seeded[id] = answer.other;
    }
    return seeded;
  });

  // Direction of travel and the outgoing panel, derived as the step changes.
  const [travel, setTravel] = useState<{
    step: number;
    direction: number;
    leaving: { step: number; key: number } | null;
  }>({ step, direction: 1, leaving: null });
  const transitionKey = useRef(0);
  if (travel.step !== step) {
    transitionKey.current += 1;
    setTravel({
      step,
      direction: step > travel.step ? 1 : -1,
      leaving: questions[travel.step] ? { step: travel.step, key: transitionKey.current } : null,
    });
  }
  const direction = travel.direction;
  const clearLeaving = useCallback(
    () => setTravel((current) => (current.leaving ? { ...current, leaving: null } : current)),
    [],
  );

  const question = questions[step];
  const questionId = question?.id;
  const otherInputRef = useRef<TextInputType>(null);
  const rootRef = useRef<View>(null);
  const panelRef = useRef<View>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The viewport follows the visible question's height (+4px above and below).
  const height = useSharedValue(-1);
  const onPanelLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const next = event.nativeEvent.layout.height + VIEWPORT_INSET * 2;
      if (height.value < 0 || reducedMotion) height.value = next;
      else if (Math.abs(height.value - next) > 0.5) {
        height.value = withTiming(next, { duration: HEIGHT_MS, easing: EASE });
      }
    },
    [height, reducedMotion],
  );
  const viewportStyle = useAnimatedStyle(
    () => (height.value < 0 ? {} : { height: height.value }),
    [height],
  );

  // When the picked row unmounts with the old question, focus would fall to
  // the page; park it on the new panel so the number keys keep working (web).
  const mounted = useRef(false);
  useLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!IS_WEB || typeof document === 'undefined') return;
    const root = rootRef.current as unknown as HTMLElement | null;
    const panel = panelRef.current as unknown as HTMLElement | null;
    const active = document.activeElement;
    if (root && panel && (!active || active === document.body || !root.contains(active))) {
      panel.focus?.({ preventScroll: true });
    }
  }, [questionId]);

  const clearAdvance = useCallback(() => {
    if (advanceTimer.current !== null) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, []);
  useEffect(() => clearAdvance, [step, clearAdvance]);

  if (!question) return null;

  const mode: QuestionnaireSelect = question.select ?? select;
  const isLast = step === lastIndex;

  const commitAnswers = (next: QuestionnaireAnswers) => {
    answersRef.current = next;
    if (answersProp === undefined) setAnswersState(next);
    onAnswersChange?.(next);
    return next;
  };

  const goTo = (index: number) => {
    const target = clamp(index, 0, lastIndex);
    if (target === step) return;
    clearAdvance();
    if (stepProp === undefined) setStepState(target);
    onStepChange?.(target);
  };

  const finish = (latest: QuestionnaireAnswers) => {
    if (isLast) onComplete?.(latest);
    else goTo(step + 1);
  };

  const renderQuestion = (q: QuestionnaireQuestion, interactive: boolean) => {
    const qMode: QuestionnaireSelect = q.select ?? select;
    const answer = answers[q.id] ?? EMPTY_ANSWER;
    const draft = drafts[q.id] ?? '';
    const otherSelected = answer.other !== undefined;
    const hasOther = Boolean(q.other);
    const otherConfig = typeof q.other === 'object' ? q.other : undefined;
    const otherLabel = otherConfig?.label ?? text.other;
    const otherPlaceholder = otherConfig?.placeholder ?? text.otherPlaceholder;
    const noop = () => {};

    const updateAnswer = (next: QuestionnaireAnswer) =>
      commitAnswers({ ...answersRef.current, [q.id]: next });

    const scheduleAdvance = (latest: QuestionnaireAnswers) => {
      clearAdvance();
      advanceTimer.current = setTimeout(
        () => {
          advanceTimer.current = null;
          finish(latest);
        },
        reducedMotion ? 0 : advanceDelay,
      );
    };

    const pick = (value: string) => scheduleAdvance(updateAnswer({ values: [value] }));

    const toggle = (value: string, selected: boolean) => {
      const chosen = new Set(answer.values);
      if (selected) chosen.add(value);
      else chosen.delete(value);
      const values = q.options.filter((o) => chosen.has(o.value)).map((o) => o.value);
      updateAnswer(otherSelected ? { values, other: answer.other } : { values });
    };

    const setOtherSelected = (selected: boolean) =>
      updateAnswer(selected ? { values: answer.values, other: draft } : { values: answer.values });

    const setDraft = (value: string) => {
      setDrafts((current) => ({ ...current, [q.id]: value }));
      if (qMode === 'single') {
        updateAnswer(value ? { values: [], other: value } : { values: [] });
      } else if (value) {
        updateAnswer({ values: answer.values, other: value });
      } else if (otherSelected) {
        updateAnswer({ values: answer.values });
      }
    };

    const submitOther = () => {
      if (qMode === 'single') {
        if (!draft.trim()) return;
        finish(updateAnswer({ values: [], other: draft }));
      } else {
        finish(answersRef.current);
      }
    };

    const rowTestID = (suffix: string) =>
      interactive && testID ? `${testID}-${suffix}` : undefined;

    return (
      <>
        <View
          style={{
            minHeight: 20,
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingLeft: 2,
            paddingRight: onDismiss ? 28 : 0,
          }}
        >
          <Text
            nativeID={interactive ? headingId : undefined}
            role={interactive ? 'heading' : undefined}
            style={[BODY_MEDIUM, { color: palette.text, flexShrink: 1 }]}
          >
            {q.question}
          </Text>
        </View>
        <View
          role="group"
          aria-labelledby={interactive ? headingId : undefined}
          accessibilityLabel={q.question}
          style={{ gap: ROW_GAP }}
        >
          {q.options.map((option, index) =>
            qMode === 'multiple' ? (
              <CheckboxRow
                key={option.value}
                option={option}
                checked={answer.values.includes(option.value)}
                onChange={interactive ? (selected) => toggle(option.value, selected) : noop}
                palette={palette}
                testID={rowTestID(`option-${option.value}`)}
              />
            ) : (
              <PickRow
                key={option.value}
                option={option}
                index={index}
                selected={answer.values.includes(option.value)}
                onPick={interactive ? () => pick(option.value) : noop}
                palette={palette}
                testID={rowTestID(`option-${option.value}`)}
              />
            ),
          )}
          {hasOther ? (
            <OtherRow
              mode={qMode}
              index={q.options.length}
              label={otherLabel}
              placeholder={otherPlaceholder}
              draft={draft}
              selected={otherSelected}
              inputRef={interactive ? otherInputRef : { current: null }}
              onDraftChange={interactive ? setDraft : noop}
              onSelectedChange={interactive ? setOtherSelected : noop}
              onSubmit={interactive ? submitOther : noop}
              palette={palette}
              testID={rowTestID('other')}
            />
          ) : null}
        </View>
      </>
    );
  };

  const onKeyDown = (event: {
    key: string;
    metaKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    target?: unknown;
    preventDefault?: () => void;
  }) => {
    if (mode !== 'single' || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as { tagName?: string } | undefined;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
    if (!/^[1-9]$/.test(event.key)) return;
    const index = Number(event.key) - 1;
    if (index < question.options.length) {
      event.preventDefault?.();
      const value = question.options[index]!.value;
      clearAdvance();
      const latest = commitAnswers({ ...answersRef.current, [question.id]: { values: [value] } });
      advanceTimer.current = setTimeout(
        () => {
          advanceTimer.current = null;
          finish(latest);
        },
        reducedMotion ? 0 : advanceDelay,
      );
    } else if (question.other && index === question.options.length) {
      event.preventDefault?.();
      otherInputRef.current?.focus();
    }
  };

  const leaving = travel.leaving;
  const leavingQuestion = leaving ? questions[leaving.step] : undefined;

  const cardStyle: WebCssStyle = {
    position: 'relative',
    width: '100%',
    gap: CARD_GAP,
    overflow: 'hidden',
    borderRadius: CARD_RADIUS,
    backgroundColor: palette.surface,
    padding: CARD_PADDING,
    boxShadow: CARD_SHADOW,
    '--bloom-questionnaire-ring': palette.ring,
    '--bloom-questionnaire-surface': palette.surface,
    '--bloom-questionnaire-placeholder': palette.textTertiary,
  };

  return (
    <View
      ref={rootRef}
      testID={testID}
      role="group"
      aria-labelledby={headingId}
      accessibilityLabel={question.question}
      {...(IS_WEB ? { onKeyDown } : {})}
      style={[cardStyle, style]}
    >
      <Animated.View
        style={[
          {
            position: 'relative',
            overflow: 'hidden',
            marginLeft: -CARD_PADDING,
            marginRight: -CARD_PADDING,
            marginTop: -VIEWPORT_INSET,
            marginBottom: -VIEWPORT_INSET,
            paddingLeft: CARD_PADDING,
            paddingRight: CARD_PADDING,
            paddingTop: VIEWPORT_INSET,
            paddingBottom: VIEWPORT_INSET,
          },
          viewportStyle,
        ]}
      >
        {leaving && leavingQuestion ? (
          <SlidingPanel
            key={`exit-${leaving.key}`}
            role="exit"
            direction={direction}
            animate={!reducedMotion}
            onExited={clearLeaving}
          >
            {renderQuestion(leavingQuestion, false)}
          </SlidingPanel>
        ) : null}
        <SlidingPanel
          key={`enter-${question.id}`}
          role="enter"
          direction={direction}
          animate={Boolean(leaving) && !reducedMotion}
          onLayout={onPanelLayout}
          panelRef={panelRef}
        >
          {renderQuestion(question, true)}
        </SlidingPanel>
      </Animated.View>

      {onDismiss ? (
        <CloseButton
          size="xs"
          accessibilityLabel={text.dismiss}
          onPress={onDismiss}
          style={{ position: 'absolute', top: CARD_PADDING, right: CARD_PADDING }}
          testID={testID ? `${testID}-dismiss` : undefined}
        />
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          paddingTop: 2,
        }}
      >
        <StepPills
          questions={questions}
          step={step}
          onSelect={goTo}
          label={text.steps}
          palette={palette}
          testID={testID ? `${testID}-step` : undefined}
        />
        <View style={{ flexDirection: 'row', flexShrink: 0, alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <Button
            variant="secondary"
            size="small"
            disabled={step === 0}
            onPress={() => goTo(step - 1)}
            testID={testID ? `${testID}-previous` : undefined}
          >
            {text.previous}
          </Button>
          <Button
            variant="primary"
            size="small"
            onPress={() => finish(answersRef.current)}
            testID={testID ? `${testID}-next` : undefined}
          >
            {isLast ? text.complete : text.next}
          </Button>
        </View>
      </View>
    </View>
  );
}

export const Questionnaire = memo(QuestionnaireComponent);
