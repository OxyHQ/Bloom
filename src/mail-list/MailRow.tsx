import React, { memo, useEffect, useMemo, useState } from 'react';
import { View, type TextStyle } from 'react-native';

import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { Checkbox } from '../checkbox';
import { RiAttachment2 } from '../icons/remix/RiAttachment2';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useSurfaceFill } from '../styles/surface-levels';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { SwipeRow, useSwipeAvailable } from '../swipe-row';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  MailGlyphButton,
  MailLabelChips,
  MailLabelMarks,
  MailRowLink,
  MailStar,
} from './parts';
import {
  IS_WEB,
  MAIL_LIST_CSS,
  MAIL_LIST_STYLE_ID,
  MAIL_ROW_GEOMETRY,
  MAIL_ROW_RADIUS,
  composeMailRowName,
  labelDotColor,
  labelMarks,
  mailActionColor,
  mailStrings,
  resolveMailPaint,
  toSwipeActions,
  visibleLabels,
} from './shared';
import type { MailAction, MailRowProps } from './types';

/**
 * One message thread in the inbox.
 *
 *   comfortable  72 tall · 16 padding · 48 avatar · sender and time on the
 *                first line, subject and snippet on the second, the star on
 *                the right where it is a control
 *   compact      40 tall · 12 padding · 24 avatar · sender, then subject and
 *                snippet on ONE baseline, then the states and the time
 *
 * ONE component, two rungs of a geometry table. There is no second row
 * component for the desktop: everything a compact row draws, a comfortable row
 * draws too, and a density that forked into two files is a density that drifts.
 *
 * TWO LINES, NOT THREE, AND NOTHING DRAWN AT REST THAT IS NOT INFORMATION.
 * The phone row is the same 72/48 as a conversation row, so an inbox and a
 * messages screen read as one library. What paid for the third line: the
 * subject and the snippet share line two, the labels collapse to a chip and
 * dots, and the star is drawn only where it is a control.
 *
 * THE SUBJECT AND THE SNIPPET ARE ONE `Text`, at both densities. Two
 * neighbouring flex children each want to be as wide as their content, and the
 * result of a long one is a row that pushes sideways or a subject clipped to
 * nothing. One string with a nested span truncates where the line ends.
 *
 * UNREAD IS THE WHOLE ROW, NOT A DOT. The sender and the subject go semibold
 * and every rung of text moves up to the primary colour; a read row sits on the
 * quiet rungs. That is a property of the row, so it survives truncation, a
 * narrow pane and a colour-blind reader in a way an 8px dot does not.
 *
 * ACTIONS HAVE TWO AFFORDANCES AND NEITHER IS AN ICON AT REST. A touch pointer
 * drags: `swipeActions` are the panes `SwipeRow` uncovers, the library's one
 * drag implementation. A mouse gets `actions` as the hover rail, revealed on
 * hover and on keyboard focus, because a drag is undiscoverable with a pointer.
 * Both report through `onAction`, and both also reach the row's
 * `accessibilityActions` — the rotor is the path a screen reader has to a
 * gesture it cannot perform.
 *
 * ACCESSIBILITY: the row is ONE target with ONE composed name, and the content
 * is hidden from assistive technology. The checkbox, the star and the rail are
 * SIBLINGS of the row's link and never its children — a button inside an anchor
 * is invalid HTML, and every "Archive" click would open the message.
 */
function MailRowComponent({
  sender,
  subject,
  snippet,
  time,
  unread = false,
  starred = false,
  onStarredChange,
  hasAttachment = false,
  threadCount,
  draft = false,
  labels,
  maxLabels = 2,
  selected = false,
  checked = false,
  onCheckedChange,
  density = 'comfortable',
  onPress,
  onLongPress,
  href,
  actions,
  actionsPlacement,
  swipeActions,
  swipeEnabled,
  onAction,
  accessibilityLabel,
  strings,
  style,
  testID,
}: MailRowProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const swipeAvailable = useSwipeAvailable();
  useEffect(() => {
    adoptStyleSheet(MAIL_LIST_STYLE_ID, MAIL_LIST_CSS);
  }, []);
  const paint = useMemo(() => resolveMailPaint(theme, surface), [theme, surface]);
  const [pressed, setPressed] = useState(false);

  const text = useMemo(() => mailStrings(strings), [strings]);
  const geo = MAIL_ROW_GEOMETRY[density];
  const compact = density === 'compact';
  const placement = actionsPlacement ?? (IS_WEB ? 'hover' : 'none');
  const rail = placement === 'none' ? [] : (actions ?? []);

  const swipeLeft = swipeActions?.left ?? [];
  const swipeRight = swipeActions?.right ?? [];
  const swipeOn = (swipeEnabled ?? swipeAvailable) && swipeLeft.length + swipeRight.length > 0;

  // Every action the row offers, once each, for the rotor. A key the rail and a
  // pane share is ONE action announced once — the affordance differs, what it
  // does does not.
  const rotorActions: MailAction[] = [];
  const seenActions = new Set<string>();
  for (const action of [...(actions ?? []), ...swipeLeft, ...swipeRight]) {
    if (seenActions.has(action.key)) continue;
    seenActions.add(action.key);
    rotorActions.push(action);
  }

  // The three text rungs the row reads at. An unread row is at full strength on
  // every line; a read one is a step quieter on each.
  const senderColor = unread ? paint.text : paint.textSecondary;
  const subjectColor = unread ? paint.text : paint.textSecondary;
  const snippetColor = unread ? paint.textSecondary : paint.textTertiary;
  const timeColor = unread ? paint.accent : paint.textTertiary;

  const rowName =
    accessibilityLabel ??
    composeMailRowName(
      {
        sender: sender.name,
        subject,
        snippet,
        time,
        unread,
        starred,
        draft,
        hasAttachment,
        threadCount,
        labels,
      },
      text,
    );

  const chipSurface = selected ? paint.selected : paint.surface;
  // One line of chips on the dense row; one chip and dots on the two-line one,
  // where a second chip costs more width than a second label is worth.
  const { shown, overflow } = visibleLabels(labels, maxLabels);
  const chips =
    shown.length > 0 || overflow > 0 ? (
      <MailLabelChips
        labels={shown}
        overflow={overflow}
        surface={chipSurface}
        strings={text}
        testID={testID ? `${testID}-labels` : undefined}
      />
    ) : null;
  const marks = labelMarks(labels, maxLabels);
  const labelDots = marks.dots.map((label) => ({
    id: label.id,
    color: labelDotColor(theme, label),
  }));

  const draftPrefix: TextStyle = { color: paint.negative };
  const hasSnippet = snippet !== undefined || draft;
  // The draft prefix is a nested span so it takes the negative colour without
  // becoming a sibling that can wrap away from the words it leads.
  const snippetContent = (
    <>
      {draft ? <Text style={draftPrefix}>{`${text.draft} `}</Text> : null}
      {snippet}
    </>
  );
  // A nested span, never a sibling: one `Text` is what truncates at the line's
  // end instead of two children each claiming their content's width.
  const snippetSpan = hasSnippet ? (
    <Text
      style={{ color: snippetColor, fontWeight: '400' }}
      testID={testID ? `${testID}-snippet` : undefined}
    >
      {'  '}
      {snippetContent}
    </Text>
  ) : null;

  const paperclip = hasAttachment ? (
    <View
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexShrink: 0 }}
      testID={testID ? `${testID}-attachment` : undefined}
    >
      <RiAttachment2 width={geo.glyph} height={geo.glyph} fill={paint.textGraphical} />
    </View>
  ) : null;

  const threadBadge =
    (threadCount ?? 0) > 1 ? (
      <View
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        style={{ flexShrink: 0 }}
        testID={testID ? `${testID}-thread-count` : undefined}
      >
        <Badge content={threadCount} size="small" variant="subtle" color="default" />
      </View>
    ) : null;

  const timeText =
    time === undefined ? null : (
      <Text
        variant={geo.timeVariant}
        numberOfLines={1}
        style={{ color: timeColor, flexShrink: 0 }}
        testID={testID ? `${testID}-time` : undefined}
      >
        {time}
      </Text>
    );

  // --- the leading slot: a checkbox when the list can multi-select ----------
  const leading =
    onCheckedChange !== undefined ? (
      <View style={{ width: geo.avatar, alignItems: 'center', flexShrink: 0 }}>
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          size={compact ? 'small' : 'medium'}
          accessibilityLabel={`${text.select}: ${sender.name}, ${subject}`}
          testID={testID ? `${testID}-checkbox` : undefined}
        />
      </View>
    ) : (
      <View
        pointerEvents="none"
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        style={{ flexShrink: 0 }}
      >
        <Avatar
          source={sender.avatar ?? null}
          name={sender.name}
          size={geo.avatar}
          testID={testID ? `${testID}-avatar` : undefined}
        />
      </View>
    );

  // --- the text column -----------------------------------------------------
  const column = compact ? (
    <View
      pointerEvents="none"
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={{
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: geo.gap,
        marginLeft: geo.gap,
      }}
    >
      <Text
        variant={unread ? geo.senderUnreadVariant : geo.senderVariant}
        numberOfLines={1}
        style={{
          color: senderColor,
          flexGrow: 0,
          flexShrink: 1,
          flexBasis: geo.senderWidth,
          minWidth: geo.senderMinWidth,
          maxWidth: geo.senderMaxWidth,
        }}
        testID={testID ? `${testID}-sender` : undefined}
      >
        {sender.name}
      </Text>
      {chips}
      {threadBadge}
      <Text
        variant={unread ? geo.subjectUnreadVariant : geo.subjectVariant}
        numberOfLines={1}
        style={{ color: subjectColor, flex: 1, minWidth: 0 }}
        testID={testID ? `${testID}-subject` : undefined}
      >
        {subject}
        {snippetSpan}
      </Text>
    </View>
  ) : (
    <View
      pointerEvents="none"
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={{ flex: 1, minWidth: 0, marginLeft: geo.gap, gap: geo.lineGap }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <Text
          variant={unread ? geo.senderUnreadVariant : geo.senderVariant}
          numberOfLines={1}
          style={{ color: senderColor, flexShrink: 1, minWidth: 0 }}
          testID={testID ? `${testID}-sender` : undefined}
        >
          {sender.name}
        </Text>
        {threadBadge}
        <View style={{ flex: 1 }} />
        {paperclip}
        {timeText}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <MailLabelMarks
          chip={marks.chip}
          dots={labelDots}
          surface={chipSurface}
          testID={testID ? `${testID}-labels` : undefined}
        />
        <Text
          variant={unread ? geo.subjectUnreadVariant : geo.subjectVariant}
          numberOfLines={1}
          style={{ color: subjectColor, flex: 1, minWidth: 0 }}
          testID={testID ? `${testID}-subject` : undefined}
        >
          {subject}
          {snippetSpan}
        </Text>
      </View>
    </View>
  );

  // --- the trailing controls ----------------------------------------------
  // The star is the only thing out here, and only where it is a control. On a
  // one-line row the paperclip and the time keep it company, because that row
  // has no second line to put them on.
  const star = (
    <MailStar
      starred={starred}
      onStarredChange={onStarredChange}
      size={geo.action}
      glyph={geo.glyph + 2}
      paint={paint}
      strings={text}
      testID={testID ? `${testID}-star` : undefined}
    />
  );
  const trailing = compact ? (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginLeft: geo.gap,
        flexShrink: 0,
      }}
    >
      {paperclip}
      {star}
      {timeText}
    </View>
  ) : onStarredChange === undefined ? null : (
    <View style={{ marginLeft: 4, flexShrink: 0 }}>{star}</View>
  );

  const rowStyle: WebCssStyle = {
    position: 'relative',
    minHeight: geo.minHeight,
    ...(geo.height === undefined ? null : { height: geo.height }),
    borderRadius: MAIL_ROW_RADIUS,
    justifyContent: 'center',
    '--bloom-mail-hover': paint.hover,
    '--bloom-mail-selected': paint.selected,
    // On web the fill is the adopted sheet's job: an inline `background-color`
    // would outrank the `:hover` rule and the row would never light up.
    ...(IS_WEB
      ? { transitionProperty: 'background-color', transitionDuration: '120ms' }
      : {
          backgroundColor: selected ? paint.selected : pressed ? paint.hover : 'transparent',
        }),
  };

  const row = (
    <View
      {...webDataSet({ bloomMailRow: '', selected: String(selected) })}
      style={[rowStyle, style]}
      testID={testID}
    >
      <MailRowLink
        name={rowName}
        onPress={onPress}
        onLongPress={onLongPress}
        href={href}
        selected={selected}
        paint={paint}
        onPressedChange={setPressed}
        actions={rotorActions}
        onAction={onAction}
        testID={testID ? `${testID}-link` : undefined}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: geo.minHeight,
          ...(geo.height === undefined ? null : { height: geo.height }),
          paddingTop: geo.paddingVertical,
          paddingBottom: geo.paddingVertical,
          paddingLeft: geo.paddingHorizontal,
          paddingRight: geo.paddingHorizontal,
        }}
      >
        {leading}
        {column}
        {trailing}
      </View>
      {rail.length > 0 ? (
        <View
          {...(placement === 'hover' ? webDataSet({ bloomMailRail: '' }) : {})}
          style={{
            position: 'absolute',
            right: geo.paddingHorizontal - 4,
            top: 0,
            bottom: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
            paddingLeft: 12,
            borderTopRightRadius: MAIL_ROW_RADIUS,
            borderBottomRightRadius: MAIL_ROW_RADIUS,
            // Whatever fill the row shows WHILE the rail is visible, so the
            // buttons read as part of the row rather than as a floating chip.
            backgroundColor: selected ? paint.selected : paint.hover,
          }}
          testID={testID ? `${testID}-rail` : undefined}
        >
          {rail.map((action) => (
            <MailGlyphButton
              key={action.key}
              label={action.label}
              icon={action.icon}
              color={mailActionColor(action, paint)}
              hoverFill={paint.selected}
              ring={paint.accent}
              size={geo.action}
              glyph={geo.actionGlyph}
              onPress={() => {
                action.onPress?.();
                onAction?.(action.key);
              }}
              testID={testID ? `${testID}-action-${action.key}` : undefined}
            />
          ))}
        </View>
      ) : null}
    </View>
  );

  if (!swipeOn) return row;
  return (
    <SwipeRow
      actions={toSwipeActions({ left: swipeLeft, right: swipeRight })}
      onAction={onAction}
      // No `height`: a comfortable row is a FLOOR, so the panes take whatever
      // the row turns out to be rather than pinning it to the floor's value.
      {...(geo.height === undefined ? null : { height: geo.height })}
      radius={MAIL_ROW_RADIUS}
      background={paint.surface}
      testID={testID ? `${testID}-swipe` : undefined}
    >
      {row}
    </SwipeRow>
  );
}

export const MailRow = memo(MailRowComponent);
MailRow.displayName = 'MailRow';
