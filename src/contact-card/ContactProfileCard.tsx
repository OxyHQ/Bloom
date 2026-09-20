import React, { memo, useEffect, useMemo } from 'react';
import { Image, Pressable, StyleSheet, View, type TextStyle } from 'react-native';

import { Avatar } from '../avatar';
import { AvatarGroup } from '../avatar-group';
import { Badge } from '../badge';
import { Button } from '../button';
import { Card } from '../card';
import { Chip, ChipRow } from '../chip';
import { useContainerWidth } from '../hooks/use-container-width';
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
  CONTACT_CONTENT_TOP,
  CONTACT_COVER_HEIGHT,
  CONTACT_OWNER_AVATAR_SIZE,
  CONTACT_PROFILE_PADDING,
  CONTACT_ROW_MIN_HEIGHT,
  CONTACT_TILE_PADDING,
  CONTACT_TILE_RADIUS,
} from './constants';
import {
  CONTACT_STYLE_ID,
  CONTACT_WEB_CSS,
  contactActionsAreLabelled,
  contactCoverWash,
  contactMetaLine,
  contactStatRows,
  joinContactName,
  resolveContactPaint,
  type ContactPaint,
} from './shared';
import type { ContactProfileCardProps } from './types';

/**
 * A person or a company, as a card and as a row.
 *
 * The card is a RECORD, and Bloom draws a record the way `ai-profile-card`
 * does — that is the register, and the `BesideTheReference` story puts the two
 * in one shot:
 *
 *   cover     a band across the top of the card: the caller's image, or an
 *             accent wash in `coverTone`
 *   mark      the 72 avatar, hanging half off the band's bottom edge, with the
 *             channel actions opposite it
 *   identity  the name at `title-2-medium`, then ONE line — the role and the
 *             account — with the status `Badge` beside it
 *   figure    a quiet label over the headline number, with a tinted delta pill
 *   tiles     the numbers the record is read for, as rounded tiles: the value
 *             over what it counts. One row on a wide card, two columns on a
 *             narrow one
 *   tags      ONE scrolling line of chips — the last touch, the facts, the tags
 *   footer    the facepile, and the owner as a quiet attribution line
 *
 *   compact   no surface, no cover, no tiles (the list owns all of it): 64
 *             tall, a 36 mark, the name, one meta line, the channels as glyphs
 *             beside them. That density is a LIST ITEM, and a list item that
 *             drew a cover band would be a card with the padding taken out.
 *
 * A COMPANY IS THE SAME CARD. `kind="company"` squares the mark off into a
 * squircle so a logo reads as a logo, reads `role` as the INDUSTRY and drops
 * `company` (a company has no company); everything else is the same data in the
 * same slots.
 *
 * **Every channel is a labelled CONTROL.** Each is a `Button` —
 * `variant="secondary" size="small"` with the kind's glyph and its ACTION word
 * — so it carries the surface, the border, the hover, the disabled treatment
 * and the focus ring every other Bloom action has. It drops to `iconOnly` only
 * where the card is too narrow to carry the words, and it is NAMED
 * `"${verb} ${label ?? name}"` either way, so losing the label never loses the
 * name.
 *
 * **The card is not one big button.** `onPress` is bound to the IDENTITY
 * BLOCK, and the channels and `actions` sit outside it — a control inside a
 * control is invalid on web and ambiguous everywhere, and it renders fine
 * either way.
 */

const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

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
  coverSource,
  coverTone = 'primary',
  status,
  channels,
  owner,
  headline,
  stats,
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
  const { width, onLayout } = useContainerWidth();
  // A card that is too narrow for four tiles is too narrow for three labelled
  // buttons beside a 72 mark, so ONE measurement decides both.
  const labelled = comfortable && contactActionsAreLabelled(width);

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

  const mark = (
    <Avatar
      size={CONTACT_AVATAR_SIZE[density]}
      source={avatar}
      name={name}
      // The quiet grey disc. The deterministic pastel tints belong to a people
      // LIST, where colour tells two rows apart; on a record card the subject is
      // already named and the tint reads as a status nobody set.
      color="neutral"
      shape={kind === 'company' ? 'squircle' : 'circle'}
      testID={id('avatar')}
    />
  );

  // The identity block: the name at title weight, then one line carrying the
  // role, the account and the status. The badge sits on the META line at both
  // densities — beside a `title-2` name it competes with it, and in a row there
  // is no width for two things on the name line at all.
  const text = (
    <View style={{ flex: 1, minWidth: 0, gap: comfortable ? 4 : 2 }}>
      <Text
        variant={comfortable ? 'title-2-medium' : 'body-semibold'}
        numberOfLines={comfortable ? 2 : 1}
        style={{ color: paint.text }}
        testID={id('name')}
      >
        {name}
      </Text>
      {meta || statusBadge ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {meta ? (
            <Text
              variant={comfortable ? 'headline-medium' : 'body-2-regular'}
              numberOfLines={1}
              style={{ flexShrink: 1, color: paint.textSecondary }}
              testID={id('meta')}
            >
              {meta}
            </Text>
          ) : null}
          {statusBadge}
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
  );

  // On the CARD the mark is up beside the actions, overlapping the cover, so
  // the press target is the text alone. In a ROW there is no cover and no
  // second line for the mark to sit on, so it stays inside the target.
  const identity = comfortable ? (
    text
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
      {mark}
      {text}
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
    <View style={{ flexDirection: 'row', gap: 8, flexShrink: 0 }} testID={id('channels')}>
      {channels.map((channel, index) => {
        const spec = CONTACT_CHANNEL[channel.kind];
        return (
          <Button
            key={channel.kind + String(index)}
            variant="secondary"
            size="small"
            iconOnly={!labelled}
            leadingIcon={channel.icon ?? spec.icon}
            onPress={channel.onPress}
            disabled={channel.disabled}
            // The control DRAWS at the card's own 32 and is HIT at 44: a
            // contact row is a column of these, and a thumb needs the second
            // number while the card needs the first.
            hitSlop={CONTACT_CHANNEL_HIT}
            // The NAME never depends on whether the label fits.
            accessibilityLabel={`${spec.verb} ${channel.label ?? name}`}
            testID={channel.testID ?? id(`channel-${channel.kind}`)}
          >
            {labelled ? spec.action : undefined}
          </Button>
        );
      })}
    </View>
  ) : null;

  const actionSlot = actions ? (
    <View style={{ flexShrink: 0 }} testID={id('actions')}>
      {actions}
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
          {actionSlot}
        </View>
      </View>
    );
  }

  // ONE scrolling line of chips, AFTER the tiles: the last touch first (it is
  // the one that can be a state), then the facts, then the tags. A wrapping
  // wall of pills is what the tiles replaced — these are the leftovers of the
  // record, not the shape of it.
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

  const coverWash = contactCoverWash(theme, coverTone);

  return (
    <SurfaceLevelProvider level={1} fill={paint.surface}>
      <Card
        variant="outlined"
        radius="radius-20"
        // `Card` already clips to its own corners and draws no padding, so the
        // cover band can run to the edge and the content block owns the inset.
        style={[surfaceFillVars(paint.surface), style]}
        testID={testID}
      >
        <View
          testID={id('cover')}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: CONTACT_COVER_HEIGHT,
            overflow: 'hidden',
            backgroundColor: coverWash,
          }}
        >
          {coverSource ? (
            <Image
              source={typeof coverSource === 'string' ? { uri: coverSource } : coverSource}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
              aria-hidden
              style={StyleSheet.absoluteFill}
              testID={id('cover-image')}
            />
          ) : null}
        </View>

        <View
          testID={id('content')}
          // The card measures ITSELF, not the window: this same card is 358
          // wide in a phone column and 900 in a record pane, and the window
          // cannot tell those apart. The content block spans the card's full
          // inner width, so its layout IS the measurement.
          onLayout={onLayout}
          style={{
            paddingTop: CONTACT_CONTENT_TOP,
            paddingBottom: CONTACT_PROFILE_PADDING,
            paddingLeft: CONTACT_PROFILE_PADDING,
            paddingRight: CONTACT_PROFILE_PADDING,
            gap: 16,
          }}
        >
          {/* The mark and the actions share one row, so the buttons land on the
              mark's baseline rather than floating over the band. */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
            {mark}
            <View style={{ flex: 1, minWidth: 0 }} />
            {channelRow}
            {actionSlot}
          </View>

          {subject}

          {headline || stats?.length ? (
            <View style={{ gap: 12 }}>
              {headline ? (
                <View style={{ gap: 2 }} testID={id('headline')}>
                  <Text
                    variant="body-medium"
                    numberOfLines={1}
                    style={{ color: paint.textSecondary }}
                  >
                    {headline.label}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text
                      variant="title-1-medium"
                      numberOfLines={1}
                      style={[{ flexShrink: 1, color: paint.text }, TABULAR]}
                      testID={id('headline-value')}
                    >
                      {headline.value}
                    </Text>
                    {headline.delta ? (
                      <Chip
                        size="medium"
                        variant="subtle"
                        color={headline.deltaTone ?? 'success'}
                        style={{ alignSelf: 'center' }}
                        testID={id('delta')}
                      >
                        {headline.delta}
                      </Chip>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {stats?.length ? (
                <View style={{ gap: 8 }} testID={id('stats')}>
                  {contactStatRows(stats.length, labelled).map((row) => (
                    <View
                      key={`tile-row-${row[0]}`}
                      style={{ flexDirection: 'row', alignItems: 'stretch', gap: 8 }}
                    >
                      {row.map((index) => {
                        const stat = stats[index]!;
                        return (
                          <View
                            key={`${index}-${stat.label}`}
                            style={[styles.tile, { backgroundColor: paint.tile }]}
                            testID={id(`stat-${index}`)}
                          >
                            <Text
                              variant="body-medium"
                              numberOfLines={1}
                              style={[
                                { width: '100%', color: paint.tileText.text },
                                TABULAR,
                              ]}
                            >
                              {stat.value}
                            </Text>
                            <Text
                              variant="body-2-medium"
                              numberOfLines={1}
                              style={{ width: '100%', color: paint.tileText.textSecondary }}
                            >
                              {stat.label}
                            </Text>
                          </View>
                        );
                      })}
                      {/* An odd tile keeps its half of the two-column grid. */}
                      {row.length === 1 && !labelled ? <View style={styles.tileSpacer} /> : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {chips.length > 0 ? (
            <ChipRow
              gap={8}
              fadeColor={paint.surface}
              accessibilityLabel={`Labels for ${name}`}
              testID={id('chips')}
            >
              {chips}
            </ChipRow>
          ) : null}

          {people?.length || owner ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              testID={id('footer')}
            >
              {people?.length ? (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, minWidth: 0 }}
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
                    // Named people, not anonymous discs: without this a facepile
                    // of colleagues with no photo is four identical grey
                    // placeholders.
                    showInitials
                  />
                  {peopleLabel ? (
                    <Text
                      variant="body-2-regular"
                      numberOfLines={1}
                      style={{ flexShrink: 1, color: paint.textSecondary }}
                    >
                      {peopleLabel}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {people?.length && owner ? <View style={{ flex: 1 }} /> : null}
              {owner ? (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, minWidth: 0 }}
                >
                  <Avatar
                    size={CONTACT_OWNER_AVATAR_SIZE}
                    source={owner.avatar}
                    name={owner.name}
                    color="neutral"
                  />
                  <Text
                    variant="body-2-regular"
                    numberOfLines={1}
                    style={{ flexShrink: 1, color: paint.textSecondary }}
                    testID={id('owner')}
                  >
                    {`${owner.label ?? 'Owner'} · ${owner.name}`}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </Card>
    </SurfaceLevelProvider>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    gap: 2,
    borderRadius: CONTACT_TILE_RADIUS,
    paddingTop: CONTACT_TILE_PADDING,
    paddingBottom: CONTACT_TILE_PADDING,
    paddingLeft: CONTACT_TILE_PADDING,
    paddingRight: CONTACT_TILE_PADDING,
  },
  tileSpacer: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
});

export const ContactProfileCard = memo(ContactProfileCardComponent);
ContactProfileCard.displayName = 'ContactProfileCard';
