import React, { useRef, useState, type ReactNode } from 'react';
import { Platform, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { AgentAvatar } from '../agent-avatar';
import { Button, CloseButton } from '../button';
import { RiArrowLeftLine } from '../icons/remix/RiArrowLeftLine';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiCodeSSlashLine } from '../icons/remix/RiCodeSSlashLine';
import { RiGlobalLine } from '../icons/remix/RiGlobalLine';
import { RiLinkM } from '../icons/remix/RiLinkM';
import { RiPlugLine } from '../icons/remix/RiPlugLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiStore2Line } from '../icons/remix/RiStore2Line';
import { useMessages } from '../locale/messages';
import { SettingsCard, SettingsSectionLabel } from '../settings-modal';
import { SOCIAL_COLOR_LOGOS } from '../social-button/color-logos';
import { ColorLogo } from '../social-button/SocialButtonBase';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { Tabs, TabsTrigger } from '../tabs';
import { TextField, TextFieldIcon, TextFieldInput } from '../text-field';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { Agent } from './data';
import {
  filterMarketplace,
  MARKETPLACE_ITEMS,
  marketplaceAgentId,
  type MarketplaceItem,
} from './marketplace-data';
import { MARKETPLACE_LOGOS } from './marketplace-logos';
import { MarketplaceSettings } from './MarketplaceSettings';
import {
  formatChatMessage,
  MULTI_AGENT_CHAT_MESSAGES,
  type MultiAgentChatMessages,
} from './messages';
import { ScrollSurface } from './ScrollSurface';
const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');
const focus = 'outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring';
type View = 'discover' | 'plugin' | 'bot' | 'installed';
const categories = (messages: MultiAgentChatMessages) =>
  [
    { id: 'discover', label: messages.discover },
    { id: 'plugin', label: messages.plugins },
    { id: 'bot', label: messages.bots },
    { id: 'installed', label: messages.installed },
  ] as const;

/** CSS grid keeps its authored classes; native supplies the equivalent measured tracks. */
function CatalogGrid({
  children,
  className,
  columns = 2,
  compactColumns = 1,
  gap = 12,
}: {
  children: ReactNode;
  className: string;
  columns?: number;
  compactColumns?: number;
  gap?: number;
}) {
  const { width: viewportWidth } = useWindowDimensions();
  const [width, setWidth] = useState(0),
    count = viewportWidth >= 640 ? columns : compactColumns;
  const native = Platform.OS !== 'web';
  return (
    <StyledView
      className={className}
      onLayout={native ? (event) => setWidth(event.nativeEvent.layout.width) : undefined}
      style={native ? { flexDirection: 'row', flexWrap: 'wrap', gap } : undefined}
    >
      {native
        ? React.Children.map(children, (child) =>
            React.isValidElement<{
              style?: StyleProp<ViewStyle>;
              className?: string;
            }>(child)
              ? React.cloneElement(child, {
                  style: [
                    child.props.style,
                    {
                      width:
                        count === 2 && child.props.className?.includes('col-span-2')
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
    </StyledView>
  );
}

function ItemIcon({ item, size = 44 }: { item: MarketplaceItem; size?: number }) {
  const { isDark } = useTheme();
  if (item.avatar)
    return (
      <StyledView className="shrink-0">
        <AgentAvatar config={item.avatar} size={size} label={item.name} />
      </StyledView>
    );
  const key = item.logo!,
    logo = MARKETPLACE_LOGOS[key as keyof typeof MARKETPLACE_LOGOS],
    social = SOCIAL_COLOR_LOGOS[key as keyof typeof SOCIAL_COLOR_LOGOS];
  return (
    <StyledView
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
      className="flex shrink-0 items-center justify-center border border-separator-border bg-background-secondary-default flex-row"
    >
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
    </StyledView>
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

  return (
    <StyledView className="flex flex-col gap-1">
      <StyledView className="flex h-8 items-center justify-between px-2 flex-row">
        <Text className="text-body-medium text-text-primary">{title}</Text>
        {onViewAll && (
          <Button
            appearance="plain"
            size="sm"
            className="bg-transparent text-text-secondary hover:bg-background-secondary-default active:bg-background-tertiary-default"
            trailingIcon={RiArrowRightSLine}
            onPress={onViewAll}
          >
            {messages.viewAll}
          </Button>
        )}
      </StyledView>
      {children}
    </StyledView>
  );
}

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

  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('discover');
  const [detail, setDetail] = useState<MarketplaceItem | null>(
    () => MARKETPLACE_ITEMS.find((item) => item.id === initialItem) ?? null,
  );
  const searchRef = useRef<import('react-native').TextInput>(null);
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
  const browse = (next: View) => {
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
    <CatalogGrid className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <SettingsCard
          key={item.id}
          className="group min-w-0 gap-3 p-3 transition-colors hover:bg-background-secondary-hover"
        >
          <StyledPressable
            accessibilityRole="button"
            accessibilityLabel={formatChatMessage(messages.viewItem, item.name)}
            onPress={() => openDetail(item)}
            className={cx('flex min-w-0 items-center gap-3 rounded-xl text-start flex-row', focus)}
          >
            <ItemIcon item={item} size={36} />
            <StyledView className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Text className="truncate text-body-medium text-text-primary">{item.name}</Text>
              <Text className="text-caption-1-regular text-text-tertiary">{item.category}</Text>
            </StyledView>
          </StyledPressable>
          <Text className="text-body-2-regular text-text-secondary">{item.description}</Text>
          <Button
            size="sm"
            appearance="subtle"
            tone="neutral"
            className="mt-auto w-full shrink-0 rounded-full"
            accessibilityLabel={
              isAdded(item)
                ? formatChatMessage(messages.viewAdded, item.name)
                : formatChatMessage(messages.add2, item.name)
            }
            onPress={() => (isAdded(item) ? openDetail(item) : add(item))}
            leadingIcon={isAdded(item) ? RiCheckLine : undefined}
          >
            {isAdded(item) ? messages.added : messages.add}
          </Button>
        </SettingsCard>
      ))}
    </CatalogGrid>
  );
  const botStrip = (
    <CatalogGrid
      columns={4}
      compactColumns={2}
      gap={8}
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
    >
      {MARKETPLACE_ITEMS.filter((item) => item.kind === 'bot')
        .slice(0, 4)
        .map((item) => (
          <StyledPressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={formatChatMessage(messages.viewItem, item.name)}
            onPress={() => openDetail(item)}
            className={cx(
              'flex min-w-0 flex-col items-center gap-2 rounded-2xl bg-background-secondary-default px-2 py-4 text-center transition-colors hover:bg-background-tertiary-default',
              focus,
            )}
          >
            <ItemIcon item={item} size={52} />
            <StyledView className="flex flex-col gap-1">
              <Text className="text-body-2-medium text-text-primary">{item.name}</Text>
              <Text className="text-caption-1-regular text-text-secondary">{item.category}</Text>
            </StyledView>
          </StyledPressable>
        ))}
    </CatalogGrid>
  );

  return (
    <MarketplaceSettings
      onClose={onClose}
      defaultPage={defaultPage}
      marketplace={({ onBack, backLabel }) => (
        <>
          <StyledView className="flex shrink-0 items-center justify-between gap-3 px-4 pb-4 pt-8 sm:px-8 flex-row">
            <StyledView className="flex min-w-0 items-center gap-2 flex-row">
              {(detail || onBack) && (
                <Button
                  appearance="plain"
                  size="sm"
                  className="bg-transparent text-text-secondary hover:bg-background-secondary-default active:bg-background-tertiary-default"
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
              <Text className="text-title-3-medium text-text-primary">{messages.marketplace}</Text>
            </StyledView>
            <CloseButton
              accessibilityLabel={messages.closeMarketplace}
              size="sm"
              onPress={onClose}
            />
          </StyledView>
          {detail ? (
            <ScrollSurface
              key={detail.id}
              surface="full"
              className="flex-1"
              contentClassName="px-5 pb-8 sm:px-8"
              label={formatChatMessage(messages.itemDetails, detail.name)}
            >
              <StyledView className="flex flex-col gap-5 pt-1">
                <SettingsCard
                  className="items-center gap-4 p-5 text-center"
                  style={{
                    paddingLeft: 20,
                    paddingRight: 20,
                    paddingTop: 20,
                    paddingBottom: 20,
                  }}
                >
                  <ItemIcon item={detail} size={72} />
                  <StyledView className="flex flex-col items-center gap-1">
                    <Text className="text-title-3-semibold text-text-primary outline-none">
                      {detail.name}
                    </Text>
                    <Text className="text-body-2-regular text-text-secondary">
                      {formatChatMessage(messages.by, detail.category, detail.developer)}
                    </Text>
                  </StyledView>
                  <Text
                    className="max-w-md text-body-regular text-text-secondary"
                    style={{ textAlign: 'center' }}
                  >
                    {detail.detail}
                  </Text>
                  <CatalogGrid
                    columns={3}
                    compactColumns={2}
                    gap={8}
                    className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3"
                  >
                    {detail.kind === 'bot' && isAdded(detail) ? (
                      <Button
                        className="w-full rounded-full"
                        onPress={() => onChat(marketplaceAgentId(detail.id))}
                      >
                        {messages.startChat}
                      </Button>
                    ) : (
                      <Button
                        className="w-full rounded-full"
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
                      className="w-full rounded-full"
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
                      className="col-span-2 row-start-2 w-full rounded-full sm:col-span-1 sm:row-start-auto"
                      leadingIcon={RiGlobalLine}
                    >
                      {messages.website}
                    </Button>
                  </CatalogGrid>
                </SettingsCard>
                <StyledView className="flex flex-col gap-1">
                  <SettingsSectionLabel>
                    {formatChatMessage(messages.skills2, detail.skills.length)}
                  </SettingsSectionLabel>
                  <StyledView className="flex flex-col gap-2">
                    {detail.skills.map((skill) => (
                      <SettingsCard key={skill.name} className="flex-row items-center gap-3 p-3">
                        <RiCodeSSlashLine
                          className="size-5 shrink-0 text-foreground-icon-secondary"
                          aria-hidden
                        />
                        <StyledView className="flex min-w-0 flex-col gap-1">
                          <Text className="text-body-medium text-text-primary">{skill.name}</Text>
                          <Text className="text-body-2-regular text-text-secondary">
                            {skill.description}
                          </Text>
                        </StyledView>
                      </SettingsCard>
                    ))}
                  </StyledView>
                </StyledView>
                {!!detail.apps.length && (
                  <StyledView className="flex flex-col gap-1">
                    <SettingsSectionLabel>
                      {formatChatMessage(messages.apps, detail.apps.length)}
                    </SettingsSectionLabel>
                    <CatalogGrid gap={8} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {detail.apps.map((app) => (
                        <SettingsCard key={app} className="flex-row items-center gap-3 p-3">
                          <RiPlugLine
                            className="size-5 shrink-0 text-foreground-icon-secondary"
                            aria-hidden
                          />
                          <StyledView className="min-w-0">
                            <Text className="text-body-medium text-text-primary">{app}</Text>
                            <Text className="text-caption-1-regular text-text-secondary">
                              {messages.connector}
                            </Text>
                          </StyledView>
                        </SettingsCard>
                      ))}
                    </CatalogGrid>
                  </StyledView>
                )}
                <StyledView className="flex flex-col gap-1">
                  <SettingsSectionLabel>{messages.details}</SettingsSectionLabel>
                  <SettingsCard
                    className="gap-4 p-4"
                    style={{
                      paddingLeft: 16,
                      paddingRight: 16,
                      paddingTop: 16,
                      paddingBottom: 16,
                    }}
                  >
                    <CatalogGrid
                      compactColumns={2}
                      gap={16}
                      className="grid grid-cols-2 gap-x-4 gap-y-4"
                    >
                      {[
                        [messages.developer, detail.developer],
                        [messages.category, detail.category],
                        [
                          messages.includes,
                          messages.includedSkills(detail.apps.length, detail.skills.length),
                        ],
                        [messages.availability, messages.public],
                      ].map(([label, value]) => (
                        <StyledView key={label} className="flex min-w-0 flex-col gap-1">
                          <Text className="text-caption-1-regular text-text-secondary">
                            {label}
                          </Text>
                          <Text className="text-body-medium text-text-primary">{value}</Text>
                        </StyledView>
                      ))}
                    </CatalogGrid>
                  </SettingsCard>
                </StyledView>
                {detail.kind === 'plugin' && (
                  <Text className="px-3 text-caption-1-regular text-text-tertiary">
                    {messages.demoIntegrationAddingSavesItToThis}
                  </Text>
                )}
              </StyledView>
            </ScrollSurface>
          ) : (
            <StyledView className="flex min-h-0 flex-1 flex-row">
              <StyledView className="flex min-h-0 min-w-0 flex-1 flex-col">
                <StyledView className="flex shrink-0 flex-col gap-3 px-4 pb-4 sm:px-8">
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
                    onValueChange={(value) => browse(value as View)}
                  >
                    {categories(messages).map(({ id, label }) => (
                      <TabsTrigger key={id} value={id} label={label} />
                    ))}
                  </Tabs>
                </StyledView>
                <ScrollSurface
                  key={`${view}-${query}`}
                  surface="full"
                  className="flex-1"
                  contentClassName="px-4 pb-6 sm:px-8"
                  label={messages.marketplaceListings}
                >
                  <StyledView className="flex flex-col gap-5 pt-1">
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
                          <StyledView className="flex flex-col items-center gap-2 py-16 text-center">
                            <RiStore2Line className="mb-2 size-8 text-foreground-icon-tertiary" />
                            <Text className="text-body-medium text-text-primary">
                              {view === 'installed' && !query
                                ? messages.aLittleRoomForSomethingNew
                                : messages.noMatchesYet}
                            </Text>
                            <Text className="text-body-regular text-text-secondary">
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
                          </StyledView>
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
                  </StyledView>
                </ScrollSurface>
              </StyledView>
            </StyledView>
          )}
        </>
      )}
    />
  );
}
