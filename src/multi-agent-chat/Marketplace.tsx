import { RiCloseLine as DismissActionIcon } from '../icons/remix/RiCloseLine';
import { Card } from '../card';
import React, { useRef, useState, type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextInput,
  type ViewStyle,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { AgentAvatar, avatarCharacterInColor } from '../agent-avatar';
import { Button } from '../button';
import { RiArrowLeftLine } from '../icons/remix/RiArrowLeftLine';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiCodeSSlashLine } from '../icons/remix/RiCodeSSlashLine';
import { RiGlobalLine } from '../icons/remix/RiGlobalLine';
import { RiLinkM } from '../icons/remix/RiLinkM';
import { RiPlugLine } from '../icons/remix/RiPlugLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiStore2Line } from '../icons/remix/RiStore2Line';
import { useMessages, formatMessage } from '../locale/messages';
import { SettingsSectionLabel } from '../settings-modal';
import { SOCIAL_COLOR_LOGOS } from '../social-button/color-logos';
import { ColorLogo } from '../social-button/SocialButtonBase';
import { IS_WEB } from '../styles/platform';
import { ROUNDED_FULL } from '../styles/rounded-full';
import { AriaPressable } from '../styles/aria-hosts';
import type { WebCssStyle } from '../styles/web-view-style';
import { Tabs, TabsTrigger } from '../tabs';
import { TextField, TextFieldIcon, TextFieldInput } from '../text-field';
import { createTokenStyles, useColorTokens } from '../theme/color-tokens';
import { useTheme } from '../theme/use-theme';
import { fontFamilyStyle, Text } from '../typography';
import { useWindowBreakpoint } from '../hooks/use-width-class';
import type { Agent } from './data';
import {
  filterMarketplace,
  MARKETPLACE_ITEMS,
  marketplaceAgentId,
  type MarketplaceItem,
} from './marketplace-data';
import { MARKETPLACE_LOGOS } from './marketplace-logos';
import { MarketplaceSettings } from './MarketplaceSettings';
import { MULTI_AGENT_CHAT_MESSAGES, type MultiAgentChatMessages } from './messages';
import { useChatComponents } from './context';
import { BREAKPOINTS } from '../styles/breakpoints';
import {
  MARKETPLACE_HOOKS,
  useMultiAgentChatWebCss,
  WEB_TRANSITION_COLORS,
  stepLineHeight,
} from './web-css';

type Category = 'discover' | 'plugin' | 'bot' | 'installed';
const categories = (messages: MultiAgentChatMessages) =>
  [
    { id: 'discover', label: messages.discover },
    { id: 'plugin', label: messages.plugins },
    { id: 'bot', label: messages.bots },
    { id: 'installed', label: messages.installed },
  ] as const;

/**
 * A CSS grid on the web (`compactColumns` tracks, `columns` from `sm`); native
 * supplies the equivalent measured tracks. `wideLast` spans the last cell over
 * both tracks of the compact grid, on its own row.
 */
function CatalogGrid({
  children,
  columns = 2,
  compactColumns = 1,
  gap = 12,
  fill = false,
  wideLast = false,
  style,
}: {
  children: ReactNode;
  columns?: number;
  compactColumns?: number;
  gap?: number;
  /** As wide as its parent (`w-full`). */
  fill?: boolean;
  wideLast?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { width: viewportWidth } = useWindowDimensions();
  const [width, setWidth] = useState(0),
    count = viewportWidth >= BREAKPOINTS.sm ? columns : compactColumns;
  const native = Platform.OS !== 'web';
  const last = React.Children.count(children) - 1;
  return (
    <View
      {...MARKETPLACE_HOOKS.grid(compactColumns, columns)}
      onLayout={native ? (event) => setWidth(event.nativeEvent.layout.width) : undefined}
      style={[
        fill && styles.fill,
        native ? { flexDirection: 'row', flexWrap: 'wrap', gap } : { gap },
        style,
      ]}
    >
      {native
        ? React.Children.map(children, (child, index) =>
            React.isValidElement<{ style?: StyleProp<ViewStyle> }>(child)
              ? React.cloneElement(child, {
                  style: [
                    child.props.style,
                    {
                      width:
                        count === 2 && wideLast && index === last
                          ? '100%'
                          : width
                            ? Math.max(0, (width - gap * (count - 1)) / count)
                            : '100%',
                    },
                  ],
                })
              : child,
          )
        : children}
    </View>
  );
}

function ItemIcon({ item, size = 44 }: { item: MarketplaceItem; size?: number }) {
  const { isDark } = useTheme();
  const tokens = useTokenStyles();
  if (item.avatar)
    return (
      <View style={styles.shrink}>
        <AgentAvatar
          character={avatarCharacterInColor(item.avatar, item.color)}
          size={size}
          label={item.name}
        />
      </View>
    );
  const key = item.logo!,
    logo = MARKETPLACE_LOGOS[key as keyof typeof MARKETPLACE_LOGOS],
    social = SOCIAL_COLOR_LOGOS[key as keyof typeof SOCIAL_COLOR_LOGOS];
  return (
    <View style={[tokens.logo, { width: size, height: size, borderRadius: size * 0.28 }]}>
      {logo ? (
        <SvgXml
          width={size * 0.6}
          height={size * 0.6}
          xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${logo.viewBox}">${logo.body}</svg>`}
        />
      ) : social ? (
        <ColorLogo
          logo={social}
          size={size * 0.6}
          inverted={isDark && ['apple', 'github', 'x'].includes(key)}
        />
      ) : null}
    </View>
  );
}

function Section({
  title,
  children,
  onViewAll,
}: {
  title: string;
  children: ReactNode;
  onViewAll?: () => void;
}) {
  const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
  const tokens = useTokenStyles();
  const quietButton = useQuietButton();

  return (
    <View style={styles.stack4}>
      <View style={styles.sectionHeader}>
        <Text style={tokens.bodyMedium}>{title}</Text>
        {onViewAll && (
          <Button
            appearance="plain"
            size="sm"
            {...quietButton}
            trailingIcon={RiArrowRightSLine}
            onPress={onViewAll}
          >
            {messages.viewAll}
          </Button>
        )}
      </View>
      {children}
    </View>
  );
}

/** A skill or app row: icon beside its text. */
const SKILL_CARD = { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 } as const;

/**
 * A quiet text button (`bg-transparent text-text-secondary`, hover
 * `background-secondary-default`, pressed `background-tertiary-default`).
 */
function useQuietButton() {
  const t = useColorTokens();
  return { color: t.mutedForeground, fill: '#0000', hoverFill: t.popover } as const;
}

/** The detail card's `text-center`: what inherits it on the web (its texts set their own). */
const DETAIL_CARD_WEB: WebCssStyle = { textAlign: 'center' };

/** `flex: 1`, as the CSS shorthand computes it. */
const FLEX_FILL = { flexGrow: 1, flexShrink: 1, flexBasis: '0%' } as const;

export function Marketplace({
  agents,
  installedPlugins,
  onTogglePlugin,
  onAddBot,
  onChat,
  onClose,
  onCopy,
  initialItem,
  defaultPage = 'marketplace',
}: {
  agents: Agent[];
  installedPlugins: string[];
  onTogglePlugin: (id: string) => void;
  onAddBot: (item: MarketplaceItem) => void;
  onChat: (id: string) => void;
  onClose: () => void;
  onCopy: (text: string, message: string) => void;
  initialItem?: string | null;
  defaultPage?: 'general' | 'marketplace';
}) {
  const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
  const { ScrollSurface } = useChatComponents();
  const tokens = useTokenStyles();
  const quietButton = useQuietButton();
  useMultiAgentChatWebCss();
  const narrow = useWindowBreakpoint() === 'base';

  const [query, setQuery] = useState('');
  const [view, setView] = useState<Category>('discover');
  const [detail, setDetail] = useState<MarketplaceItem | null>(
    () => MARKETPLACE_ITEMS.find((item) => item.id === initialItem) ?? null,
  );
  const searchRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const isPresent = true;
  const isAdded = (item: MarketplaceItem) =>
    item.kind === 'plugin'
      ? installedPlugins.includes(item.id)
      : agents.some((agent) => agent.id === marketplaceAgentId(item.id));
  const results = filterMarketplace(
    query,
    view === 'plugin' || view === 'bot' ? view : 'all',
  ).filter((item) => view !== 'installed' || isAdded(item));
  const openDetail = (item: MarketplaceItem) => {
    setDetail(item);
  };
  const browse = (next: Category) => {
    setView(next);
    setQuery('');
  };
  const add = (item: MarketplaceItem) =>
    item.kind === 'plugin' ? onTogglePlugin(item.id) : onAddBot(item);
  const share = (item: MarketplaceItem) => {
    const url = new URL(
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.href
        : 'https://oxy.so/',
    );
    url.searchParams.set('marketplace', item.id);
    onCopy(url.toString(), messages.marketplaceLinkCopied);
  };
  const grid = (items: MarketplaceItem[]) => (
    <CatalogGrid>
      {items.map((item) => (
        <Card key={item.id} style={[styles.listing, IS_WEB && WEB_TRANSITION_COLORS]}>
          <AriaPressable
            {...MARKETPLACE_HOOKS.item}
            accessibilityRole="button"
            accessibilityLabel={formatMessage(messages.viewItem, item.name)}
            onPress={() => openDetail(item)}
            style={styles.listingHead}
          >
            <ItemIcon item={item} size={36} />
            <View style={styles.listingTitle}>
              <Text {...MARKETPLACE_HOOKS.truncate} style={[tokens.bodyMedium, styles.truncate]}>
                {item.name}
              </Text>
              <Text style={tokens.caption}>{item.category}</Text>
            </View>
          </AriaPressable>
          <Text style={tokens.body2}>{item.description}</Text>
          <Button
            size="sm"
            appearance="subtle"
            tone="neutral"
            style={styles.listingAction}
            accessibilityLabel={
              isAdded(item)
                ? formatMessage(messages.viewAdded, item.name)
                : formatMessage(messages.add2, item.name)
            }
            onPress={() => (isAdded(item) ? openDetail(item) : add(item))}
            leadingIcon={isAdded(item) ? RiCheckLine : undefined}
          >
            {isAdded(item) ? messages.added : messages.add}
          </Button>
        </Card>
      ))}
    </CatalogGrid>
  );
  const botStrip = (
    <CatalogGrid columns={4} compactColumns={2} gap={8}>
      {MARKETPLACE_ITEMS.filter((item) => item.kind === 'bot')
        .slice(0, 4)
        .map((item) => (
          <AriaPressable
            {...MARKETPLACE_HOOKS.tile}
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={formatMessage(messages.viewItem, item.name)}
            onPress={() => openDetail(item)}
            style={[styles.tile, tokens.tile]}
          >
            <ItemIcon item={item} size={52} />
            <View style={styles.stack4}>
              <Text style={tokens.body2Medium}>{item.name}</Text>
              <Text style={tokens.caption}>{item.category}</Text>
            </View>
          </AriaPressable>
        ))}
    </CatalogGrid>
  );

  return (
    <MarketplaceSettings
      onClose={onClose}
      defaultPage={defaultPage}
      marketplace={({ onBack, backLabel }) => (
        <>
          <View style={[styles.header, !narrow && styles.wideInset]}>
            <View style={styles.headerTitle}>
              {(detail || onBack) && (
                <Button
                  appearance="plain"
                  size="sm"
                  {...quietButton}
                  iconOnly
                  leadingIcon={RiArrowLeftLine}
                  accessibilityLabel={detail ? messages.backToMarketplace : backLabel}
                  onPress={() => {
                    if (detail) {
                      setDetail(null);
                      requestAnimationFrame(() => searchRef.current?.focus());
                    } else onBack?.();
                  }}
                />
              )}
              <Text style={tokens.title}>{messages.marketplace}</Text>
            </View>
            <Button
              appearance="outline"
              tone="neutral"
              iconOnly
              icon={DismissActionIcon}
              accessibilityLabel={messages.closeMarketplace}
              size={24}
              onPress={onClose}
            />
          </View>
          {detail ? (
            <ScrollSurface
              key={detail.id}
              surface="full"
              hostStyle={FLEX_FILL}
              contentContainerStyle={{ paddingInline: narrow ? 20 : 32, paddingBottom: 32 }}
              label={formatMessage(messages.itemDetails, detail.name)}
            >
              <View style={styles.page}>
                <Card
                  style={[
                    {
                      alignItems: 'center',
                      gap: 16,
                      padding: 20,
                      paddingLeft: 20,
                      paddingRight: 20,
                      paddingTop: 20,
                      paddingBottom: 20,
                    },
                    IS_WEB && DETAIL_CARD_WEB,
                  ]}
                >
                  <ItemIcon item={detail} size={72} />
                  <View style={styles.detailTitle}>
                    <Text style={tokens.titleSemibold}>{detail.name}</Text>
                    <Text style={tokens.body2}>
                      {formatMessage(messages.by, detail.category, detail.developer)}
                    </Text>
                  </View>
                  <Text style={[tokens.body, styles.blurb]}>{detail.detail}</Text>
                  <CatalogGrid columns={3} compactColumns={2} gap={8} fill wideLast>
                    {detail.kind === 'bot' && isAdded(detail) ? (
                      <Button
                        style={styles.pill}
                        onPress={() => onChat(marketplaceAgentId(detail.id))}
                      >
                        {messages.startChat}
                      </Button>
                    ) : (
                      <Button
                        style={styles.pill}
                        appearance={isAdded(detail) ? 'subtle' : 'solid'}
                        tone={isAdded(detail) ? 'neutral' : 'accent'}
                        leadingIcon={isAdded(detail) ? RiCheckLine : undefined}
                        onPress={() => add(detail)}
                      >
                        {isAdded(detail) ? messages.remove : messages.add}
                      </Button>
                    )}
                    <Button
                      appearance="subtle"
                      tone="neutral"
                      style={styles.pill}
                      leadingIcon={RiLinkM}
                      onPress={() => share(detail)}
                    >
                      {messages.share}
                    </Button>
                    <Button
                      href={detail.website}
                      target="_blank"
                      rel="noreferrer"
                      appearance="subtle"
                      tone="neutral"
                      dataSet={MARKETPLACE_HOOKS.wide}
                      style={styles.pill}
                      leadingIcon={RiGlobalLine}
                    >
                      {messages.website}
                    </Button>
                  </CatalogGrid>
                </Card>
                <View style={styles.stack4}>
                  <SettingsSectionLabel>
                    {formatMessage(messages.skills2, detail.skills.length)}
                  </SettingsSectionLabel>
                  <View style={styles.stack8}>
                    {detail.skills.map((skill) => (
                      <Card key={skill.name} style={SKILL_CARD}>
                        <RiCodeSSlashLine style={tokens.rowIcon} aria-hidden />
                        <View style={styles.rowText}>
                          <Text style={tokens.bodyMedium}>{skill.name}</Text>
                          <Text style={tokens.body2}>{skill.description}</Text>
                        </View>
                      </Card>
                    ))}
                  </View>
                </View>
                {!!detail.apps.length && (
                  <View style={styles.stack4}>
                    <SettingsSectionLabel>
                      {formatMessage(messages.apps, detail.apps.length)}
                    </SettingsSectionLabel>
                    <CatalogGrid gap={8}>
                      {detail.apps.map((app) => (
                        <Card key={app} style={SKILL_CARD}>
                          <RiPlugLine style={tokens.rowIcon} aria-hidden />
                          <View style={styles.minW0}>
                            <Text style={tokens.bodyMedium}>{app}</Text>
                            <Text style={tokens.caption}>{messages.connector}</Text>
                          </View>
                        </Card>
                      ))}
                    </CatalogGrid>
                  </View>
                )}
                <View style={styles.stack4}>
                  <SettingsSectionLabel>{messages.details}</SettingsSectionLabel>
                  <Card
                    style={{
                      gap: 16,
                      padding: 16,
                      paddingLeft: 16,
                      paddingRight: 16,
                      paddingTop: 16,
                      paddingBottom: 16,
                    }}
                  >
                    <CatalogGrid compactColumns={2} gap={16} style={styles.axisGaps}>
                      {[
                        [messages.developer, detail.developer],
                        [messages.category, detail.category],
                        [
                          messages.includes,
                          messages.includedSkills(detail.apps.length, detail.skills.length),
                        ],
                        [messages.availability, messages.public],
                      ].map(([label, value]) => (
                        <View key={label} style={styles.rowText}>
                          <Text style={tokens.caption}>{label}</Text>
                          <Text style={tokens.bodyMedium}>{value}</Text>
                        </View>
                      ))}
                    </CatalogGrid>
                  </Card>
                </View>
                {detail.kind === 'plugin' && (
                  <Text style={[tokens.caption, styles.note]}>
                    {messages.demoIntegrationAddingSavesItToThis}
                  </Text>
                )}
              </View>
            </ScrollSurface>
          ) : (
            <View style={styles.browse}>
              <View style={styles.browseColumn}>
                <View style={[styles.search, !narrow && styles.wideInset]}>
                  <TextField style={{ borderRadius: 12 }}>
                    <TextFieldIcon icon={RiSearchLine} />
                    <TextFieldInput
                      inputRef={searchRef}
                      label={messages.searchMarketplace}
                      placeholder={messages.findYourNextToolOrTeammate}
                      value={query}
                      onChangeText={setQuery}
                    />
                  </TextField>
                  <Tabs
                    variant="filled"
                    value={view}
                    onValueChange={(value) => browse(value as Category)}
                  >
                    {categories(messages).map(({ id, label }) => (
                      <TabsTrigger key={id} value={id} label={label} />
                    ))}
                  </Tabs>
                </View>
                <ScrollSurface
                  key={`${view}-${query}`}
                  surface="full"
                  hostStyle={FLEX_FILL}
                  contentContainerStyle={{ paddingInline: narrow ? 16 : 32, paddingBottom: 24 }}
                  label={messages.marketplaceListings}
                >
                  <View style={styles.page}>
                    {query.trim() || view !== 'discover' ? (
                      <Section
                        title={
                          query.trim()
                            ? messages.results(results.length)
                            : view === 'installed'
                              ? messages.addedToYourWorkspace
                              : view === 'plugin'
                                ? messages.explorePlugins
                                : messages.findYourNextTeammate
                        }
                      >
                        {results.length ? (
                          grid(results)
                        ) : (
                          <View {...MARKETPLACE_HOOKS.center} style={styles.empty}>
                            <RiStore2Line style={tokens.emptyIcon} />
                            <Text style={tokens.bodyMedium}>
                              {view === 'installed' && !query
                                ? messages.aLittleRoomForSomethingNew
                                : messages.noMatchesYet}
                            </Text>
                            <Text style={tokens.body}>
                              {view === 'installed' && !query
                                ? messages.explorePluginsAndBotsToBuildYour
                                : messages.tryAnotherNameCategoryOrKeyword}
                            </Text>
                            <Button
                              appearance="plain"
                              size="sm"
                              onPress={() => {
                                setQuery('');
                                setView('discover');
                              }}
                            >
                              {messages.exploreMarketplace}
                            </Button>
                          </View>
                        )}
                      </Section>
                    ) : (
                      <>
                        <Section
                          title={messages.meetYourNextTeammate}
                          onViewAll={() => browse('bot')}
                        >
                          {botStrip}
                        </Section>
                        <Section
                          title={messages.toolsForYourWorkflow}
                          onViewAll={() => browse('plugin')}
                        >
                          {grid(MARKETPLACE_ITEMS.slice(0, 4))}
                        </Section>
                        <Section title={messages.everydayEssentials}>
                          {grid(MARKETPLACE_ITEMS.slice(4, 8))}
                        </Section>
                      </>
                    )}
                  </View>
                </ScrollSurface>
              </View>
            </View>
          )}
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%' },
  /** `gap-x-4 gap-y-4`. */
  axisGaps: { columnGap: 16, rowGap: 16 },
  shrink: { flexShrink: 0 },
  minW0: { minWidth: 0 },
  truncate: { overflow: 'hidden' },
  stack4: { flexDirection: 'column', gap: 4 },
  stack8: { flexDirection: 'column', gap: 8 },
  sectionHeader: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingInline: 8,
  },
  listing: { minWidth: 0, gap: 12, padding: 12 },
  listingAction: { marginTop: 'auto', width: '100%', flexShrink: 0, borderRadius: ROUNDED_FULL },
  pill: { width: '100%', borderRadius: ROUNDED_FULL },
  listingHead: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
  },
  listingTitle: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    flexDirection: 'column',
    gap: 2,
  },
  tile: {
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    paddingInline: 8,
    paddingBlock: 16,
  },
  header: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingInline: 16,
    paddingTop: 32,
    paddingBottom: 16,
  },
  /** `sm:px-8`. */
  wideInset: { paddingInline: 32 },
  headerTitle: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  page: { flexDirection: 'column', gap: 20, paddingTop: 4 },
  detailTitle: { flexDirection: 'column', alignItems: 'center', gap: 4 },
  blurb: { maxWidth: 448, textAlign: 'center' },
  rowText: { minWidth: 0, flexDirection: 'column', gap: 4 },
  note: { paddingInline: 12 },
  browse: { minHeight: 0, flexGrow: 1, flexShrink: 1, flexBasis: '0%', flexDirection: 'row' },
  browseColumn: {
    minHeight: 0,
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    flexDirection: 'column',
  },
  search: {
    flexShrink: 0,
    flexDirection: 'column',
    gap: 12,
    paddingInline: 16,
    paddingBottom: 16,
  },
  empty: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingBlock: 64,
  },
});

const useTokenStyles = createTokenStyles((t) => ({
  logo: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.surface,
  },
  // The web paints the tile from its sheet, so its hover fill can replace it.
  tile: IS_WEB ? {} : { backgroundColor: t.surface },
  title: {
    ...fontFamilyStyle('display'),
    fontSize: 18,
    color: t.foreground,
    lineHeight: stepLineHeight(26, 18),
    fontWeight: 500,
  },
  titleSemibold: {
    ...fontFamilyStyle('display'),
    fontSize: 18,
    color: t.foreground,
    lineHeight: stepLineHeight(26, 18),
    fontWeight: 600,
  },
  bodyMedium: { color: t.foreground, lineHeight: stepLineHeight(20, 14), fontWeight: 500 },
  body: { color: t.mutedForeground, lineHeight: stepLineHeight(20, 14), fontWeight: 400 },
  body2: { color: t.mutedForeground, lineHeight: stepLineHeight(18, 13), fontWeight: 400 },
  body2Medium: { color: t.foreground, lineHeight: stepLineHeight(18, 13), fontWeight: 500 },
  caption: {
    color: t.mutedForeground,
    lineHeight: stepLineHeight(16, 12),
    letterSpacing: 0.15,
    fontWeight: 400,
  },
  // The icons' classes reached only the web's <svg>: their box and colour (`size-5 shrink-0`, `mb-2 size-8`).
  rowIcon: IS_WEB ? { flexShrink: 0, color: t.mutedForeground } : {},
  emptyIcon: IS_WEB ? { marginBottom: 8, width: 32, height: 32, color: t.mutedForeground } : {},
}));
