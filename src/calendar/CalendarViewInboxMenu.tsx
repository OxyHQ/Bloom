import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';

import { Button } from '../button';
import { RiAddFill, RiInbox2Line, RiRssFill } from '../icons/remix';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import {
  createHueResolver,
  feedSwatchColors,
  resolveCalendarViewPalette,
  type CalendarViewPalette,
  type HueResolver,
} from './palette';
import { IS_WEB, type WebDataSet } from './shared';
import type { CalendarViewFeed, CalendarViewFeedAccount, CalendarViewInboxMenuProps } from './types';

/**
 * `CalendarViewInboxMenu`: the header's inbox button and the subscribed-feeds
 * panel it opens.
 *
 *   panel      266 wide (max 100vw − 32), radius 16, 1px border-button-default,
 *              primary surface, padding 10, shadow-dropdown; 16px between groups
 *   group      5px top inset, 6px gap; body-medium secondary heading, 8px left
 *   feed row   32 tall — padding 6/8, radius 10, gap 8; hover
 *              background-primary-hover; 20px radius-6 swatch with a 12px
 *              `rss-fill` (`*-200` / `*-700`, blue `*-900`); body-medium label
 *   divider    full-bleed 1px border-button-default between groups (not after
 *              the last), pulled 4px into the 16px gap on each side
 *   footer     full-width secondary small "Add new account"
 *
 * Web anchors the panel below the button, aligned to its end, 8px away; native
 * presents it in the bottom sheet every Bloom popover uses. The panel wears the
 * popover's motion (fade + zoom + short slide), owned by `popover`, rather
 * than a fade + scale + blur.
 */

const PANEL_WIDTH = 266;
const SWATCH = 20;
const SWATCH_ICON = 12;
const CSS_ID = 'bloom-calendar-feed-web-css';
const FEED_SELECTOR = '[data-bloom-calendar-feed]';
const FEED_CSS = `${FEED_SELECTOR} { outline: none; cursor: pointer; transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1); }
${FEED_SELECTOR}:focus-visible { background-color: var(--bloom-calendar-feed-hover); }`;

function FeedRow({
  feed,
  hue,
  palette,
  onPress,
}: {
  feed: CalendarViewFeed;
  hue: HueResolver;
  palette: CalendarViewPalette;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const swatch = feedSwatchColors(hue, feed.color);
  const hook: WebDataSet = IS_WEB ? { dataSet: { bloomCalendarFeed: '' } } : {};
  const style: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
    backgroundColor: hovered ? palette.rowHover : 'transparent',
    '--bloom-calendar-feed-hover': palette.rowHover,
  };
  return (
    <Pressable
      {...hook}
      role="button"
      accessibilityLabel={feed.label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}
    >
      <View
        style={{
          width: SWATCH,
          height: SWATCH,
          flexShrink: 0,
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: swatch.background,
        }}
      >
        <RiRssFill width={SWATCH_ICON} height={SWATCH_ICON} fill={swatch.icon} />
      </View>
      <Text variant="body-medium" numberOfLines={1} style={{ flexShrink: 1 }}>
        {feed.label}
      </Text>
    </Pressable>
  );
}

/** The feed groups, the dividers and the footer — the panel's body on both platforms. */
function InboxBody({
  accounts,
  palette,
  hue,
  addAccountLabel,
  onSelect,
  onAddAccount,
}: {
  accounts: readonly CalendarViewFeedAccount[];
  palette: CalendarViewPalette;
  hue: HueResolver;
  addAccountLabel: string;
  onSelect: (feed: CalendarViewFeed, account: CalendarViewFeedAccount) => void;
  onAddAccount: () => void;
}) {
  return (
    <View style={{ gap: 16 }}>
      {accounts.map((account, index) => (
        <React.Fragment key={account.email}>
          {index > 0 ? (
            <View
              role="separator"
              style={{
                height: 1,
                marginLeft: -10,
                marginRight: -10,
                marginTop: -4,
                marginBottom: -4,
                backgroundColor: palette.panelBorder,
              }}
            />
          ) : null}
          <View role="group" accessibilityLabel={account.email} style={{ gap: 6, paddingTop: 5 }}>
            <Text
              variant="body-medium"
              numberOfLines={1}
              style={{ paddingLeft: 8, color: palette.textSecondary }}
            >
              {account.email}
            </Text>
            <View style={{ gap: 4 }}>
              {account.feeds.map((feed) => (
                <FeedRow
                  key={feed.id}
                  feed={feed}
                  hue={hue}
                  palette={palette}
                  onPress={() => onSelect(feed, account)}
                />
              ))}
            </View>
          </View>
        </React.Fragment>
      ))}
      <Button
        variant="secondary"
        size="small"
        leadingIcon={RiAddFill}
        onPress={onAddAccount}
        style={{ width: '100%' }}
      >
        {addAccountLabel}
      </Button>
    </View>
  );
}

export function CalendarViewInboxMenu({
  accounts,
  onSelectFeed,
  onAddAccount,
  addAccountLabel = 'Add new account',
  accessibilityLabel = 'Inbox',
  testID,
}: CalendarViewInboxMenuProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveCalendarViewPalette(theme), [theme]);
  const hue = useMemo(() => createHueResolver(theme.colors.primary), [theme.colors.primary]);
  const [open, setOpen] = useState(false);
  const viewport = useWindowDimensions();

  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(CSS_ID, FEED_CSS);
  }, []);

  // Web: the popover's own panel IS this menu's chrome (266 wide, `rounded-2xl`,
  // border, surface, `p-2.5`, `shadow-dropdown`); only the height bound is the
  // menu's. Native: the sheet is the chrome.
  const panelStyle: WebCssStyle | undefined = Platform.select<WebCssStyle | undefined>({
    web: {
      width: PANEL_WIDTH,
      maxWidth: viewport.width - 32,
      maxHeight: viewport.height - 32,
    },
    default: undefined,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="medium"
          iconOnly
          leadingIcon={RiInbox2Line}
          accessibilityLabel={accessibilityLabel}
          testID={testID}
        />
      </PopoverTrigger>
      <PopoverContent
        label="Inbox menu"
        side="bottom"
        align="end"
        sideOffset={8}
        style={panelStyle}
        testID={testID ? `${testID}-panel` : undefined}
      >
        <InboxBody
          accounts={accounts}
          palette={palette}
          hue={hue}
          addAccountLabel={addAccountLabel}
          onSelect={(feed, account) => {
            onSelectFeed?.(feed, account);
            setOpen(false);
          }}
          onAddAccount={() => {
            onAddAccount?.();
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
