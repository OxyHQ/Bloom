import React, { memo, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '../avatar';
import { AvatarGroup } from '../avatar-group';
import { Badge } from '../badge';
import { GlyphButton } from '../button';
import { Card } from '../card';
import { Chip, ChipRow } from '../chip';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { SurfaceLevelProvider, surfaceFillVars, useSurfaceFill } from '../styles/surface-levels';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  CONTACT_AVATAR_SIZE,
  CONTACT_PROFILE_PADDING,
  CONTACT_CHANNEL,
  CONTACT_CHANNEL_SIZE,
  CONTACT_ROW_MIN_HEIGHT,
} from './constants';
import {
  CONTACT_STYLE_ID,
  CONTACT_WEB_CSS,
  contactMetaLine,
  joinContactName,
  resolveContactPaint,
  type ContactPaint,
} from './shared';
import type { ContactProfileCardProps } from './types';

/**
 * A person or a company, as a card and as a row.
 *
 *   comfortable   a `Card` (16 padding, `radius-16`): a 48 avatar, the name with
 *                 its status pill, the meta line, the facts, the tags, the
 *                 facepile, then a hairline and the footer — the channel
 *                 actions on the left, the owner on the right.
 *   compact       no surface at all (the list owns it): 64 tall, a 36 avatar,
 *                 the name, the meta line, and the channel actions beside them.
 *                 Facts, tags, the facepile and the owner are comfortable-only —
 *                 a row that drew them would be a card with the padding removed.
 *
 * A COMPANY IS THE SAME CARD. `kind="company"` squares the avatar off into a
 * squircle, reads `role` as the industry and drops `company` (a company has no
 * company); everything else — the channels, the owner, the tags, the last touch —
 * is the same data in the same slots. There is no second component to keep in
 * step.
 *
 * **The card is not one big button.** `onPress` is bound to the IDENTITY BLOCK,
 * and the channels and `actions` sit outside it. A pressable card wrapping
 * pressable channels is a control inside a control: invalid on web (a `<button>`
 * inside a `<button>`), ambiguous everywhere. The identity block is still the
 * largest target on the row, so nothing is lost by scoping it.
 *
 * Every channel is an ACTION and never a string of text: a `GlyphButton` named
 * `"${verb} ${label ?? name}"` from `CONTACT_CHANNEL`, so a control that draws
 * only a glyph cannot ship unnamed.
 */

/** The fill the content lands on, and everything derived from it. */
function useContactPaint(onCard: boolean): ContactPaint {
  const theme = useTheme();
  const ambient = useSurfaceFill();
  const surface = onCard ? theme.colors.card : ambient;
  return useMemo(() => resolveContactPaint(theme, surface), [theme, surface]);
}

function ContactProfileCardComponent({
  kind = 'person',
  name,
  role,
  company,
  avatar,
  status,
  channels,
  owner,
  tags,
  lastTouch,
  lastTouchTone,
  facts,
  people,
  peopleLabel,
  peopleTotal,
  density = 'comfortable',
  onPress,
  actions,
  accessibilityLabel,
  style,
  testID,
}: ContactProfileCardProps) {
  const theme = useTheme();
  const comfortable = density === 'comfortable';
  const paint = useContactPaint(comfortable);

  useEffect(() => {
    adoptStyleSheet(CONTACT_STYLE_ID, CONTACT_WEB_CSS);
  }, []);

  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const meta = contactMetaLine({ kind, role, company });
  const factLine = facts?.filter((fact) => fact !== '').join(' · ');
  const touchColor =
    lastTouchTone === undefined
      ? paint.textTertiary
      : resolveAccentColors(theme.colors, lastTouchTone, 'subtle').foreground;

  // The status pill sits beside the NAME on a card and on the META line in a
  // row. At 390 a row gives the identity ~190px once three channel actions have
  // taken theirs, and a pill beside the name there truncates both of them —
  // measured as "Nora Van…" next to "Custo…". The second line has the room.
  const statusBadge = status ? (
    <Badge
      content={status.label}
      variant="subtle"
      color={status.tone ?? 'default'}
      size="label-small"
      // The pill states a fact in one word; the LINE beside it is what gives
      // way. Without this both shrink and neither is readable.
      style={{ flexShrink: 0 }}
      testID={id('status')}
    />
  ) : null;

  const identity = (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        flex: 1,
        minWidth: 0,
        alignItems: comfortable ? 'flex-start' : 'center',
      }}
    >
      <Avatar
        size={CONTACT_AVATAR_SIZE[density]}
        source={avatar}
        name={name}
        shape={kind === 'company' ? 'squircle' : 'circle'}
        testID={id('avatar')}
      />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text
            variant={comfortable ? 'headline-semibold' : 'body-semibold'}
            numberOfLines={1}
            style={{ color: paint.text, flexShrink: 1 }}
            testID={id('name')}
          >
            {name}
          </Text>
          {comfortable ? statusBadge : null}
        </View>
        {meta || (!comfortable && statusBadge) ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {comfortable ? null : statusBadge}
            {meta ? (
              <Text
                variant={comfortable ? 'body-2-regular' : 'caption-1-regular'}
                numberOfLines={1}
                style={{ color: paint.textSecondary, flexShrink: 1 }}
                testID={id('meta')}
              >
                {meta}
              </Text>
            ) : null}
          </View>
        ) : null}
        {comfortable && factLine ? (
          <Text
            variant="caption-1-regular"
            numberOfLines={2}
            style={{ color: paint.textTertiary }}
            testID={id('facts')}
          >
            {factLine}
          </Text>
        ) : null}
        {lastTouch ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <RiTimeLine width={14} height={14} fill={touchColor} />
            <Text
              variant="caption-1-regular"
              numberOfLines={1}
              style={{ color: touchColor, flexShrink: 1 }}
              testID={id('last-touch')}
            >
              {lastTouch}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  const ringVars: WebCssStyle = { '--bloom-contact-ring': paint.ring };
  const subject = onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ??
        joinContactName([name, role, kind === 'company' ? undefined : company])
      }
      onPress={onPress}
      {...webDataSet({ bloomContactSubject: '' })}
      style={({ pressed }) => [
        { flex: 1, minWidth: 0, borderRadius: 12, ...ringVars },
        pressed ? { opacity: 0.7 } : null,
      ]}
      testID={id('subject')}
    >
      {identity}
    </Pressable>
  ) : (
    identity
  );

  const channelRow = channels?.length ? (
    <View style={{ flexDirection: 'row', gap: 4, flexShrink: 0 }} testID={id('channels')}>
      {channels.map((channel, index) => {
        const spec = CONTACT_CHANNEL[channel.kind];
        return (
          <GlyphButton
            key={channel.kind + String(index)}
            icon={channel.icon ?? spec.icon}
            size={CONTACT_CHANNEL_SIZE}
            glyphSize={20}
            onPress={channel.onPress}
            disabled={channel.disabled}
            hoverFill={paint.channelHover}
            ring={paint.ring}
            accessibilityLabel={`${spec.verb} ${channel.label ?? name}`}
            testID={channel.testID ?? id(`channel-${channel.kind}`)}
          />
        );
      })}
    </View>
  ) : null;

  const header = (
    <View style={{ flexDirection: 'row', alignItems: comfortable ? 'flex-start' : 'center', gap: 8 }}>
      {subject}
      {comfortable ? null : channelRow}
      {actions ? (
        <View style={{ flexShrink: 0 }} testID={id('actions')}>
          {actions}
        </View>
      ) : null}
    </View>
  );

  if (!comfortable) {
    return (
      <View
        style={[{ minHeight: CONTACT_ROW_MIN_HEIGHT, justifyContent: 'center' }, style]}
        testID={testID}
      >
        {header}
      </View>
    );
  }

  const footer =
    channelRow || owner ? (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: paint.hairline,
        }}
        testID={id('footer')}
      >
        {channelRow ?? <View />}
        {owner ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
            <Avatar size={20} source={owner.avatar} name={owner.name} />
            <Text
              variant="caption-1-regular"
              numberOfLines={1}
              style={{ color: paint.textSecondary, flexShrink: 1 }}
              testID={id('owner')}
            >
              {`${owner.label ?? 'Owner'} · ${owner.name}`}
            </Text>
          </View>
        ) : null}
      </View>
    ) : null;

  return (
    <SurfaceLevelProvider level={1} fill={paint.surface}>
      <Card
        variant="outlined"
        radius="radius-16"
        style={[{ padding: CONTACT_PROFILE_PADDING, ...surfaceFillVars(paint.surface) }, style]}
        testID={testID}
      >
        {header}
        {tags?.length ? (
          // `minWidth: 0` on BOTH: a flex item's automatic minimum is its
          // CONTENT width, so a horizontal scroller inside one widens the card
          // and then the page — 390 became 414 before this, with the document
          // itself scrolling sideways.
          <View style={{ marginTop: 12, minWidth: 0 }} testID={id('tags')}>
            <ChipRow
              gap={6}
              fadeColor={paint.surface}
              accessibilityLabel="Tags"
              style={{ minWidth: 0 }}
            >
              {tags.map((tag) => (
                <Chip key={tag} size="small" variant="subtle" color="default">
                  {tag}
                </Chip>
              ))}
            </ChipRow>
          </View>
        ) : null}
        {people?.length ? (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}
            testID={id('people')}
          >
            <AvatarGroup
              items={people.map((person) => ({
                id: person.id,
                uri: person.avatar,
                name: person.name,
              }))}
              size={24}
              max={4}
              total={peopleTotal}
              ringColor={paint.surface}
              // Named people, not anonymous discs: without this a facepile of
              // colleagues with no photo is four identical grey placeholders.
              showInitials
            />
            {peopleLabel ? (
              <Text variant="caption-1-regular" style={{ color: paint.textSecondary }}>
                {peopleLabel}
              </Text>
            ) : null}
          </View>
        ) : null}
        {footer}
      </Card>
    </SurfaceLevelProvider>
  );
}

export const ContactProfileCard = memo(ContactProfileCardComponent);
ContactProfileCard.displayName = 'ContactProfileCard';
