import React, { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { webDataSet } from '../styles/web-data';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { borderRadius, space } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useHovered, useMessageMediaCss } from './parts';
import {
  formatVoteCount,
  MESSAGE_MEDIA_RADIUS,
  MESSAGE_MEDIA_WIDTH,
  pollPercentages,
  resolveMessageMediaPaint,
  type MessageMediaPaint,
} from './shared';
import type { PollMessageProps, PollOption } from './types';

/** The mark's box. 20px: a radio you can hit without hitting the row. */
const MARK = 20;
/** The results bar. */
const BAR_HEIGHT = 4;

interface OptionRowProps {
  option: PollOption;
  percent: number;
  results: boolean;
  multiple: boolean;
  quiz: boolean;
  picked: boolean;
  paint: MessageMediaPaint;
  onPress?: () => void;
  testID?: string;
}

/**
 * One option.
 *
 * BEFORE the results it is a `radio` (single) or a `checkbox` (multiple)
 * carrying `aria-checked` — both spellings, because react-native-web reads only
 * the `aria-*` one and React Native folds it back into `accessibilityState`.
 * AFTER them it is no longer a control at all: it is a `progressbar` with its own
 * name and the three `aria-value*` attributes, because pressing it does nothing
 * and a disabled checkbox that still announces "not checked" invites a press
 * that is never going to land.
 *
 * A QUIZ marks the right answer green and the viewer's wrong pick negative, and
 * it marks BOTH — not just whichever one the viewer chose. A quiz that hides the
 * right answer after a wrong guess has taught nobody anything.
 */
const OptionRow = memo(function OptionRow({
  option,
  percent,
  results,
  multiple,
  quiz,
  picked,
  paint,
  onPress,
  testID,
}: OptionRowProps) {
  const [hovered, handlers] = useHovered();

  const correct = quiz && option.correct === true;
  const wrong = quiz && results && picked && option.correct !== true;
  const markColor = correct ? paint.correct : wrong ? paint.danger : paint.accent;
  const marked = results ? picked || correct : picked;

  const mark = (
    <View
      style={{
        width: MARK,
        height: MARK,
        borderRadius: multiple && !results ? 6 : borderRadius.full,
        borderWidth: marked ? 0 : 1.5,
        borderColor: paint.rail,
        backgroundColor: marked ? markColor : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      testID={testID ? `${testID}-mark` : undefined}
    >
      {marked ? (
        wrong ? (
          <RiCloseLine width={13} height={13} fill={paint.onAccent} />
        ) : (
          <RiCheckLine width={13} height={13} fill={paint.onAccent} />
        )
      ) : null}
    </View>
  );

  const label = (
    <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Text
          variant="body-2-regular"
          style={{ color: paint.text, flexGrow: 1, flexShrink: 1 }}
        >
          {option.label}
        </Text>
        {results ? (
          <Text
            variant="body-2-medium"
            style={{ color: paint.textMuted, fontVariant: ['tabular-nums'] }}
            testID={testID ? `${testID}-percent` : undefined}
          >
            {`${percent}%`}
          </Text>
        ) : null}
      </View>
      {results ? (
        <View
          style={{
            height: BAR_HEIGHT,
            borderRadius: borderRadius.full,
            backgroundColor: paint.rail,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${percent}%`,
              height: BAR_HEIGHT,
              borderRadius: borderRadius.full,
              backgroundColor: correct ? paint.correct : wrong ? paint.danger : paint.accent,
            }}
            testID={testID ? `${testID}-bar` : undefined}
          />
        </View>
      ) : null}
    </View>
  );

  const rowStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: results ? 'flex-start' : 'center',
    gap: space.md,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 6,
    paddingRight: 6,
    borderRadius: 10,
    backgroundColor: hovered && onPress ? paint.wash : 'transparent',
    '--bloom-message-media-ring': paint.ring,
  };

  if (results) {
    const name = `${option.label}, ${percent}%${correct ? ', correct answer' : ''}${
      wrong ? ', your answer' : ''
    }`;
    return (
      <View
        role="progressbar"
        accessibilityLabel={name}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${percent}%`}
        accessibilityValue={{ now: percent, min: 0, max: 100, text: `${percent}%` }}
        style={rowStyle}
        testID={testID}
      >
        {mark}
        {label}
      </View>
    );
  }

  return (
    <Pressable
      {...webDataSet({ bloomMessageMediaPressable: '' })}
      {...handlers}
      role={multiple ? 'checkbox' : 'radio'}
      accessibilityLabel={option.label}
      aria-checked={picked}
      accessibilityState={{ checked: picked }}
      onPress={onPress}
      style={rowStyle}
      testID={testID}
    >
      {mark}
      {label}
    </Pressable>
  );
});

/**
 * A poll or a quiz in a bubble.
 *
 * The percentages come from `pollPercentages()`, which distributes the rounding
 * remainder by largest fraction so the column sums to exactly 100. Rounding each
 * share on its own gives three equal options 33/33/33 and two equal ones
 * 51/51 — a poll that visibly cannot add up is a poll nobody believes.
 *
 * MULTIPLE choice keeps its picks locally until the viewer presses "Vote", and
 * that is the only reason this component holds state at all: a multi-select
 * poll where each tap is a separate commit has no way to change your mind.
 * Single choice commits on the tap, since there is nothing to accumulate —
 * unless it is `multiple`, when the action row is the commit.
 *
 * `anonymous` and `quiz` are LABELS on the question, not styling: they change
 * what voting means, and a reader has to be told before they vote rather than
 * after.
 */
function PollMessageComponent({
  question,
  options,
  totalVotes,
  multiple = false,
  anonymous = false,
  quiz = false,
  voted = false,
  showResults = false,
  onVote,
  onViewResults,
  voteLabel = 'Vote',
  viewResultsLabel = 'View results',
  anonymousLabel = 'Anonymous voting',
  quizLabel = 'Quiz',
  formatVotes = formatVoteCount,
  hintLabel,
  width = MESSAGE_MEDIA_WIDTH,
  radius = MESSAGE_MEDIA_RADIUS,
  tone = 'incoming',
  onColor,
  bubbleColor,
  style,
  testID,
}: PollMessageProps) {
  const theme = useTheme();
  useMessageMediaCss();
  const paint = useMemo(
    () => resolveMessageMediaPaint(theme, tone, onColor, bubbleColor),
    [theme, tone, onColor, bubbleColor],
  );

  const [pending, setPending] = useState<string[]>([]);
  const results = voted || showResults;

  const percentages = useMemo(
    () => pollPercentages(options.map((o) => o.votes ?? 0), totalVotes),
    [options, totalVotes],
  );
  const total =
    totalVotes ?? options.reduce((sum, option) => sum + (option.votes ?? 0), 0);

  const isPicked = useCallback(
    (option: PollOption) => (results ? option.selected === true : pending.includes(option.id)),
    [results, pending],
  );

  const pick = useCallback(
    (option: PollOption) => {
      if (multiple) {
        setPending((current) =>
          current.includes(option.id)
            ? current.filter((id) => id !== option.id)
            : [...current, option.id],
        );
        return;
      }
      setPending([option.id]);
      onVote?.([option.id]);
    },
    [multiple, onVote],
  );

  const hint = hintLabel ?? (multiple ? 'Select one or more' : 'Select one');
  const labels = [quiz ? quizLabel : undefined, anonymous ? anonymousLabel : undefined].filter(
    (l): l is string => Boolean(l),
  );

  const [actionHovered, actionHandlers] = useHovered();
  const actionStyle: WebCssStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 7,
    paddingBottom: 7,
    borderRadius: borderRadius.full,
    marginTop: space.sm,
    backgroundColor: actionHovered ? paint.washStrong : paint.wash,
    '--bloom-message-media-ring': paint.ring,
  };

  const action = results
    ? onViewResults
      ? { label: viewResultsLabel, press: onViewResults }
      : null
    : multiple && onVote
      ? { label: voteLabel, press: () => onVote(pending) }
      : null;

  return (
    <View
      role="group"
      accessibilityLabel={question}
      style={[{ width, borderRadius: radius }, style ?? null]}
      testID={testID}
    >
      <Text variant="body-medium" style={{ color: paint.text }}>
        {question}
      </Text>
      <Text
        variant="caption-1-regular"
        style={{ color: paint.textMuted, paddingTop: 2 }}
        testID={testID ? `${testID}-labels` : undefined}
      >
        {[...labels, results ? undefined : hint].filter(Boolean).join(' · ')}
      </Text>

      <View style={{ paddingTop: space.sm }}>
        {options.map((option, index) => (
          <OptionRow
            key={option.id}
            option={option}
            percent={percentages[index] ?? 0}
            results={results}
            multiple={multiple}
            quiz={quiz}
            picked={isPicked(option)}
            paint={paint}
            onPress={results ? undefined : () => pick(option)}
            testID={testID ? `${testID}-option-${option.id}` : undefined}
          />
        ))}
      </View>

      {action ? (
        <Pressable
          {...webDataSet({ bloomMessageMediaPressable: '' })}
          {...actionHandlers}
          role="button"
          accessibilityLabel={action.label}
          onPress={action.press}
          style={actionStyle}
          testID={testID ? `${testID}-action` : undefined}
        >
          <Text variant="body-2-medium" style={{ color: paint.accent }}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}

      <Text
        variant="caption-1-regular"
        style={{ color: paint.textMuted, paddingTop: space.sm }}
        testID={testID ? `${testID}-total` : undefined}
      >
        {formatVotes(total)}
      </Text>
    </View>
  );
}

export const PollMessage = memo(PollMessageComponent);
PollMessage.displayName = 'PollMessage';
