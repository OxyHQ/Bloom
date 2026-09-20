import React, { useMemo } from 'react';
import { Image, View, type ViewStyle } from 'react-native';

import { Avatar } from '../avatar';
import { Button } from '../button';
import {
  RiArrowRightLine,
  RiCornerDownLeftLine,
  RiGlobalLine,
  RiGroupLine,
  RiNotification2Line,
  RiTimeLine,
} from '../icons/remix';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { resolveCalendarViewPalette, type CalendarViewPalette } from './palette';
import { currentGmtLabel, durationLabel, formatEventDate } from './shared';
import type { CalendarViewEventDetailsProps } from './types';

/**
 * The event details modal: the panel an event chip opens beside its day.
 *
 *   panel        302 wide, radius 20, 1px border-button-default, padding 10,
 *                gap 10, Figma's raw 0/1/2 + 0/7/8 shadow
 *   title block  radius 10, padding 8/10, gap 1 — headline-medium + body-medium
 *   image        99 tall, radius 10, cover
 *   detail row   36 tall, radius 10, padding 8 / 6 right / 8 left, gap 10,
 *                background-secondary-default; 18px secondary icon, body-2-medium
 *   info chip    radius 4, padding 4, caption-1-medium on background-tertiary
 *   row button   secondary xs icon-only, icon in foreground-icon-secondary
 *
 * An all-day event (no `time`) shows only the title block (and its image).
 * Every other row renders only when its data is given.
 *
 * `bare` drops the panel chrome, for a surface that brings its own (the native
 * bottom sheet the month grid presents this in).
 */

const PANEL_WIDTH = 302;
const ROW_ICON = 18;
const ARROW_ICON = 20;
const ROW_BUTTON_ICON = 14;

function InfoChip({ children, palette }: { children: React.ReactNode; palette: CalendarViewPalette }) {
  return (
    <View
      style={{
        flexShrink: 0,
        borderRadius: 4,
        backgroundColor: palette.infoChip,
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 4,
        paddingRight: 4,
      }}
    >
      <Text variant="caption-1-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
        {children}
      </Text>
    </View>
  );
}

const ROW_CHROME: ViewStyle = {
  width: '100%',
  flexShrink: 0,
  borderRadius: 10,
  paddingTop: 8,
  paddingBottom: 8,
  paddingRight: 6,
  paddingLeft: 8,
};

function DetailRow({ children, palette }: { children: React.ReactNode; palette: CalendarViewPalette }) {
  return (
    <View
      style={{
        ...ROW_CHROME,
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: palette.detailRow,
      }}
    >
      {children}
    </View>
  );
}

/** The leading `icon + label` half of a row. */
function RowLead({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {children}
    </View>
  );
}

function RowButton({
  icon: Icon,
  label,
  palette,
  onPress,
}: {
  icon: typeof RiCornerDownLeftLine;
  label: string;
  palette: CalendarViewPalette;
  onPress?: () => void;
}) {
  return (
    <Button size="xs" leading={<Icon width={ROW_BUTTON_ICON} height={ROW_BUTTON_ICON} fill={palette.iconSecondary} />} accessibilityLabel={label} onPress={onPress} appearance="plain" tone="neutral" />
  );
}

export function CalendarViewEventDetails({
  event,
  locale,
  gmtLabel,
  onJoinMeeting,
  onEditTimeZone,
  onEditParticipants,
  onEditReminders,
  bare = false,
  style,
  testID,
}: CalendarViewEventDetailsProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveCalendarViewPalette(theme), [theme]);
  const secondary = { color: palette.textSecondary };
  const timed = event.time != null;

  const chrome: WebCssStyle = bare
    ? {}
    : {
        width: PANEL_WIDTH,
        maxWidth: '100%',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.panelBorder,
        backgroundColor: palette.panel,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 10,
        paddingRight: 10,
        boxShadow: palette.shadowDetails,
      };

  return (
    <View testID={testID} style={[chrome, { gap: 10 }, style]}>
      <View
        style={{
          borderRadius: 10,
          backgroundColor: palette.detailRow,
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 10,
          paddingRight: 10,
          gap: 1,
        }}
      >
        <Text role="heading" variant="headline-medium" numberOfLines={1}>
          {event.title}
        </Text>
        <Text variant="body-medium" style={secondary}>
          {formatEventDate(event.date, locale)}
        </Text>
      </View>

      {event.image ? (
        <View
          style={{
            height: 99,
            width: '100%',
            flexShrink: 0,
            overflow: 'hidden',
            borderRadius: 10,
          }}
        >
          <Image
            source={event.image}
            accessibilityIgnoresInvertColors
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      ) : null}

      {timed && event.meeting ? (
        <DetailRow palette={palette}>
          <RowLead>
            {event.meeting.icon ? (
              <View style={{ width: 20, height: 20, flexShrink: 0 }}>{event.meeting.icon}</View>
            ) : null}
            <Text variant="body-2-medium" numberOfLines={1}>
              {event.meeting.label}
            </Text>
          </RowLead>
          <View
            style={{
              flexShrink: 0,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <InfoChip palette={palette}>{event.meeting.code}</InfoChip>
            <Button size="xs" onPress={onJoinMeeting ? () => onJoinMeeting(event) : undefined} appearance="solid" tone="accent">
              Join
            </Button>
          </View>
        </DetailRow>
      ) : null}

      {timed ? (
        <DetailRow palette={palette}>
          <RowLead>
            <RiTimeLine width={ROW_ICON} height={ROW_ICON} fill={palette.iconSecondary} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text variant="body-2-medium">{event.time}</Text>
              {event.endTime ? (
                <>
                  <RiArrowRightLine width={ARROW_ICON} height={ARROW_ICON} fill={palette.iconSecondary} />
                  <Text variant="body-2-medium">{event.endTime}</Text>
                </>
              ) : null}
            </View>
          </RowLead>
          {event.endTime ? (
            <InfoChip palette={palette}>{durationLabel(event.time!, event.endTime)}</InfoChip>
          ) : null}
        </DetailRow>
      ) : null}

      {timed && event.timeZone ? (
        <DetailRow palette={palette}>
          <RowLead>
            <RiGlobalLine width={ROW_ICON} height={ROW_ICON} fill={palette.iconSecondary} />
            <Text variant="body-2-medium" numberOfLines={1}>
              <Text variant="body-2-medium" style={secondary}>
                {gmtLabel ?? currentGmtLabel()}
              </Text>
              {` ${event.timeZone}`}
            </Text>
          </RowLead>
          <RowButton
            icon={RiCornerDownLeftLine}
            label="Edit timezone"
            palette={palette}
            onPress={onEditTimeZone ? () => onEditTimeZone(event) : undefined}
          />
        </DetailRow>
      ) : null}

      {timed && event.participants && event.participants.length > 0 ? (
        <View style={{ ...ROW_CHROME, backgroundColor: palette.detailRow, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <RowLead>
              <RiGlobalLine width={ROW_ICON} height={ROW_ICON} fill={palette.iconSecondary} />
              <Text variant="body-2-medium" numberOfLines={1} style={secondary}>
                Participants
              </Text>
            </RowLead>
            <RowButton
              icon={RiGroupLine}
              label="Edit participants"
              palette={palette}
              onPress={onEditParticipants ? () => onEditParticipants(event) : undefined}
            />
          </View>
          <View role="list">
            {event.participants.map((participant) => (
              <View
                key={participant.email}
                role="listitem"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingTop: 6,
                  paddingBottom: 6,
                }}
              >
                <Avatar size="xs" color={participant.color ?? 'neutral'} initials={participant.initials} />
                <Text variant="body-2-medium" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {participant.email}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {timed && event.reminder ? (
        <DetailRow palette={palette}>
          <RowLead>
            <RiNotification2Line width={ROW_ICON} height={ROW_ICON} fill={palette.iconSecondary} />
            <Text variant="body-2-medium" numberOfLines={1}>
              <Text variant="body-2-medium" style={secondary}>
                Reminders
              </Text>
              {` ${event.reminder}`}
            </Text>
          </RowLead>
          <RowButton
            icon={RiCornerDownLeftLine}
            label="Edit reminders"
            palette={palette}
            onPress={onEditReminders ? () => onEditReminders(event) : undefined}
          />
        </DetailRow>
      ) : null}
    </View>
  );
}
