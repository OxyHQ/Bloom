import React, { memo, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '../avatar';
import { AvatarGroup } from '../avatar-group';
import { Badge } from '../badge';
import { Button } from '../button';
import { Card } from '../card';
import { Chip } from '../chip';
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
  CONTACT_CHANNEL,
  CONTACT_CHANNEL_HIT,
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
 * It is built to the same four blocks every Bloom record card is built to —
 * `home-search`'s `SavedSearchCard` is the reference:
 *
 *   header   a 44 leading mark, the name at `body-semibold` (two lines), and a
 *            status `Badge` opposite it
 *   meta     ONE secondary line — the role and the account — then the facts,
 *            the last touch and the tags as OUTLINED `Chip`s wrapped 6 apart.
 *            Outlined, not filled: a neutral filled pill reads as disabled, and
 *            these are facts rather than states
 *   footer   a hairline, then the quiet owner label on the left and the REAL
 *            controls on the right
 *
 *   compact  no surface at all (the list owns it): 64 tall, a 36 mark, the name,
 *            one meta line, the channel controls beside them. Chips, the
 *            facepile and the owner are comfortable-only — a row that drew them
 *            would be a card with the padding removed.
 *
 * A COMPANY IS THE SAME CARD. `kind="company"` squares the mark off into a
 * squircle so a logo reads as a logo, reads `role` as the INDUSTRY and drops
 * `company` (a company has no company); everything else is the same data in the
 * same slots.
 *
 * **Every channel is a CONTROL, not a glyph.** Each is a `Button` —
 * `variant="secondary" size="small" iconOnly` — so it carries the surface, the
 * border, the hover, the disabled treatment and the focus ring every other
 * Bloom action has, named `"${verb} ${label ?? name}"` from `CONTACT_CHANNEL`.
 * Bare icons floating on a card surface are not an affordance anywhere else in
 * this library and were not one here.
 *
 * **The card is not one big button.** `onPress` is bound to the HEADER, and the
 * channels and `actions` sit outside it — a control inside a control is invalid
 * on web and ambiguous everywhere, and it renders fine either way.
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
  const touchAccent =
    lastTouchTone === undefined ? null : resolveAccentColors(theme.colors, lastTouchTone, 'subtle');

  const statusBadge = status ? (
    <Badge
      content={status.label}
      variant="subtle"
      color={status.tone ?? 'default'}
      size="label-medium"
      // The pill states a fact in one word; the LINE beside it is what gives
      // way. Without this both shrink and neither is readable.
      style={{ flexShrink: 0 }}
      testID={id('status')}
    />
  ) : null;

  // The header is the reference's: mark, title, badge. At compact the badge
  // moves down to the meta line — a row gives the identity about 150px once
  // the channel controls have taken theirs, and a pill beside the name there
  // truncated both ("Nora Van…" next to "Custo…").
  const header = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: comfortable ? 'center' : 'flex-start',
        gap: 12,
        flex: 1,
        minWidth: 0,
      }}
    >
      <Avatar
        size={CONTACT_AVATAR_SIZE[density]}
        source={avatar}
        name={name}
        // The quiet grey disc. The deterministic pastel tints belong to a
        // people LIST, where colour tells two rows apart; on a record card the
        // subject is already named and the tint is decoration that reads as a
        // status nobody set.
        color="neutral"
        shape={kind === 'company' ? 'squircle' : 'circle'}
        testID={id('avatar')}
      />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            variant="body-semibold"
            numberOfLines={comfortable ? 2 : 1}
            style={{ flex: 1, minWidth: 0, color: paint.text }}
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
                variant="body-2-regular"
                numberOfLines={1}
                style={{ flexShrink: 1, color: paint.textSecondary }}
                testID={id('meta')}
              >
                {meta}
              </Text>
            ) : null}
          </View>
        ) : null}
        {comfortable || !lastTouch ? null : (
          <Text
            variant="caption-1-regular"
            numberOfLines={1}
            style={{ color: touchAccent?.foreground ?? paint.textTertiary }}
            testID={id('last-touch')}
          >
            {lastTouch}
          </Text>
        )}
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
      {header}
    </Pressable>
  ) : (
    header
  );

  const channelRow = channels?.length ? (
    <View style={{ flexDirection: 'row', gap: 6, flexShrink: 0 }} testID={id('channels')}>
      {channels.map((channel, index) => {
        const spec = CONTACT_CHANNEL[channel.kind];
        return (
          <Button
            key={channel.kind + String(index)}
            variant="secondary"
            size="small"
            iconOnly
            icon={channel.icon ?? spec.icon}
            onPress={channel.onPress}
            disabled={channel.disabled}
            // The control DRAWS at the card's own 32 and is HIT at 44: a
            // contact row is a column of these, and a thumb needs the second
            // number while the card needs the first.
            hitSlop={CONTACT_CHANNEL_HIT}
            accessibilityLabel={`${spec.verb} ${channel.label ?? name}`}
            testID={channel.testID ?? id(`channel-${channel.kind}`)}
          />
        );
      })}
    </View>
  ) : null;

  if (!comfortable) {
    return (
      <View
        style={[{ minHeight: CONTACT_ROW_MIN_HEIGHT, justifyContent: 'center' }, style]}
        testID={testID}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {subject}
          {channelRow}
          {actions ? (
            <View style={{ flexShrink: 0 }} testID={id('actions')}>
              {actions}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  // The meta ROW: the last touch, the facts and the tags, all as outlined
  // chips. Three stacked quiet lines is what made this card read as something
  // other than Bloom — every one of them is a short fact, which is what a chip
  // row is for.
  const chips: React.ReactNode[] = [];
  if (lastTouch) {
    chips.push(
      <Chip
        key="last-touch"
        size="medium"
        variant={lastTouchTone === undefined ? 'outlined' : 'subtle'}
        color={lastTouchTone ?? 'default'}
        startIcon={
          <RiTimeLine
            width={14}
            height={14}
            fill={touchAccent?.foreground ?? paint.textSecondary}
          />
        }
        testID={id('last-touch')}
      >
        {lastTouch}
      </Chip>,
    );
  }
  for (const fact of facts ?? []) {
    if (fact !== '') chips.push(<Chip key={`fact-${fact}`} size="medium" variant="outlined">{fact}</Chip>);
  }
  for (const tag of tags ?? []) {
    chips.push(<Chip key={`tag-${tag}`} size="medium" variant="outlined">{tag}</Chip>);
  }

  return (
    <SurfaceLevelProvider level={1} fill={paint.surface}>
      <Card
        variant="outlined"
        radius="radius-16"
        style={[
          {
            paddingTop: 16,
            paddingBottom: 12,
            paddingLeft: 16,
            paddingRight: 16,
            gap: 12,
            ...surfaceFillVars(paint.surface),
          },
          style,
        ]}
        testID={testID}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          {subject}
          {actions ? (
            <View style={{ flexShrink: 0 }} testID={id('actions')}>
              {actions}
            </View>
          ) : null}
        </View>

        {chips.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} testID={id('chips')}>
            {chips}
          </View>
        ) : null}

        {people?.length ? (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
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
              <Text variant="body-2-regular" style={{ color: paint.textSecondary }}>
                {peopleLabel}
              </Text>
            ) : null}
          </View>
        ) : null}

        {owner || channelRow ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: paint.hairline,
            }}
            testID={id('footer')}
          >
            {owner ? (
              <>
                <Avatar size={20} source={owner.avatar} name={owner.name} color="neutral" />
                <Text
                  variant="body-2-regular"
                  numberOfLines={1}
                  style={{ flex: 1, minWidth: 0, color: paint.textSecondary }}
                  testID={id('owner')}
                >
                  {`${owner.label ?? 'Owner'} · ${owner.name}`}
                </Text>
              </>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {channelRow}
          </View>
        ) : null}
      </Card>
    </SurfaceLevelProvider>
  );
}

export const ContactProfileCard = memo(ContactProfileCardComponent);
ContactProfileCard.displayName = 'ContactProfileCard';
