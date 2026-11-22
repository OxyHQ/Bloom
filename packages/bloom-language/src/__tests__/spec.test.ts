import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { BloomImageContentFit } from '@oxy.so/bloom/image';
import { tokens } from '@oxy.so/bloom/styles';
import { TYPE_SCALE } from '@oxy.so/bloom/typography';
import {
  EASING as BLOOM_EASING,
  MOTION as BLOOM_MOTION,
  SCALE as BLOOM_SCALE,
} from '@oxy.so/bloom/motion';
import {
  AVATAR_SIZE,
  BORDER_WIDTH,
  COLORS,
  CORNER,
  DURATION,
  EASING,
  ENVIRONMENT,
  ENVIRONMENT_DEFAULTS,
  FONT_SIZE,
  GLASS_OPACITY,
  HIT_SLOP,
  ICON_SIZE,
  LAYER_RANK,
  LEADING,
  LEADING_PX,
  MOTION,
  type NODE_MODIFIERS,
  OPACITY,
  ROTATION,
  SCALE,
  SHADOW,
  SPACE,
  TYPE_RAMP,
  TRACKING,
  TRACKING_PX,
  Z_INDEX,
} from '../generated/spec.generated';
import { SHADOW_BOX } from './support/bloom-design-tokens';
import { WEB_CLASS, WEB_SHEET } from '../generated/web-sheet.generated';
import type {
  ActionBarView,
  AppLayoutView,
  NavStackView,
  RouteView,
  TabNavigatorView,
  ActionGroupView,
  ActionView,
  AvatarGroupView,
  AvatarView,
  BadgeView,
  IconCircleView,
  LoadingView,
  SkeletonGroupView,
  SkeletonView,
  BottomBarView,
  ButtonGroupView,
  ButtonView,
  ShapeView,
  ComposedView,
  EmbedView,
  FabView,
  HeaderView,
  IconView,
  ImageView,
  MenuActionsView,
  MenuContentView,
  AspectRatioView,
  DividerView,
  FillView,
  GridView,
  MenuItemView,
  MenuSectionView,
  MenuSubmenuView,
  MenuView,
  LottieView,
  SpacerView,
  StackView,
  TabView,
  TextView,
} from '../node';
import type { AgentAvatarView } from '../controls/agent-avatar';
import type {
  ChatComposerView,
  CompactComposerView,
  ComposerBannerView,
  ComposerIconButtonView,
  SuggestionListView,
  VoiceRecorderView,
  AttachmentMenuView,
  EmojiPickerView,
  ReactionPickerView,
  MessageContextMenuView,
} from '../controls/chat-composer';
import type {
  AreaChartCardView,
  BarListCardView,
  ChartCardSurfaceView,
  ChartHeadlineView,
  ChartStatTilesView,
  ContributionsCardView,
  HeatmapChartCardView,
  LineChartCardView,
  RadarChartCardView,
  SleepScoreCardView,
  SparklineView,
  StageBarsCardView,
  StepsCardView,
  TokensChartCardView,
} from '../controls/chart-cards';
import type {
  ComposerPanelView,
  ComposerPillView,
  ComposerPanelStatusTabView,
} from '../controls/composer-panel';
import type {
  AiChatShellView,
  AiChatContainerView,
  AiChatThreadView,
  AiChatUserMessageView,
  AiChatAssistantMessageView,
  AiChatMessageLineView,
  AiChatHeaderView,
  AiChatMobileHeaderView,
  AiChatCodePanelView,
  AiChatGalleryPanelView,
} from '../controls/ai-chat';
import type { StatCardView, StatCardsView } from '../controls/stat-cards';
import type { PlayButtonView, PlaybackProgressView } from '../controls/media-controls';
import type {
  AgentLimitsCardView,
  UsageCardView,
  AgentThinkingView,
  AgentProgressView,
  AgentProgressLoadingTextView,
  AgentLogRowView,
  AgentLogShimmerTextView,
  AgentLogToolCallView,
  AgentLogToolCallsView,
  AgentLogWorkingRowView,
  ComposerLoaderView,
  ConversationSidebarView,
  QuestionnaireView,
} from '../controls/agents';
import type {
  ChatBackgroundView,
  ChatDateHeaderView,
  ChatEmptyStateView,
  ChatHeaderView,
  ChatInfoPanelView,
  PinnedMessageBarView,
  ScrollToBottomButtonView,
  ChatFolderTabsView,
  ChatSearchFieldView,
  ChatSearchResultsView,
  StoriesRowView,
  StoryRingView,
  TypingDotsView,
  ContactMessageView,
  DocumentGridView,
  FileMessageView,
  GifMessageView,
  ImageMessageView,
  LocationMessageView,
  PollMessageView,
  SharedMediaGridView,
  StickerMessageView,
  VideoMessageView,
  VoiceMessageView,
} from '../controls/chat';
import type {
  AmenityListView,
  HostCardView,
  ListingHeaderView,
  ListingHeaderActionView,
  ListingPhotoGridView,
  ReviewCardView,
  MapClusterMarkerView,
  MapPriceMarkerView,
  MapSearchAreaButtonView,
} from '../controls/listings';
import type {
  FollowButtonView,
  ShelfView,
  ShelfSkeletonView,
  SubscriptionPlansView,
  SubscriptionPriceView,
  UserHoverCardView,
} from '../controls/media';
import type {
  CardFormView,
  CardFormCountryView,
  CardFormPostcodeView,
  CardFormHostedFieldView,
} from '../controls/card-form';
import type { CheckoutSheetView } from '../controls/checkout-sheet';
import type { RouteStopsView } from '../controls/route-stops';
import type { NoteCardView, NoteCardSkeletonView } from '../controls/note-card';
import type { ShareSheetView } from '../controls/share-sheet';
import type {
  ConnectionDotsView,
  OutlineNavView,
  PaginationView,
  ProgressiveBlurView,
} from '../controls/generic';
import type { AddressRowView, AddressListView } from '../controls/address';
import type {
  PaymentMethodMarkView,
  PaymentMethodRowView,
  PaymentMethodListView,
} from '../controls/payment-method';
import type { PriceSummaryView, PriceSummaryLineView } from '../controls/price-breakdown';
import type { PaymentStatusBarView, PaymentStatusBlockView } from '../controls/payment-status';
import type {
  ContactProfileCardView,
  LeadScoreCardView,
  DealCardView,
  PipelineColumnView,
  PipelineBoardView,
} from '../controls/crm';
import type {
  ImportantAlertsCardView,
  PatientInfoCardView,
  RecentHiresCardView,
} from '../controls/dashboard-cards';
import type {
  CartLineView,
  CartPanelView,
  CartPromoFieldView,
  CartTipPickerView,
} from '../controls/cart-panel';
import type { MenuItemRowView, MenuItemOptionsView } from '../controls/menu-item';
import type { VendorCardView } from '../controls/vendor-card';
import type {
  MediaCardView,
  SongCardView,
  AlbumCardView,
  ArtistCardView,
  PlaylistCardView,
  MixCardView,
  PodcastCardView,
  EpisodeCardView,
  AudiobookCardView,
  GenreCardView,
  EventCardView,
  ProfileCardView,
  FriendActivityCardView,
  QuickAccessTileView,
  RecapCardView,
  ShareCardView,
} from '../controls/media-cards';
import type { LyricsViewView, LyricsPreviewCardView } from '../controls/lyrics';
import type {
  ArtistChipsInputView,
  ArtworkUploaderView,
  AudienceBreakdownView,
  AudienceOverviewView,
  CreditsEditorView,
  IsrcFieldView,
  PayoutSummaryCardView,
  PitchCardView,
  ReleaseCardView,
  ReleaseStatusBadgeView,
  ReleaseTimelineView,
  StreamsChartView,
  TopTracksTableView,
  TrackMetadataFormView,
  TrackUploadRowView,
} from '../controls/creator-studio';
import type {
  CheckoutSummaryRowView,
  CheckoutSummaryView,
  CheckoutConfirmView,
} from '../controls/checkout-summary';
import type {
  DeliverySlotDaysView,
  DeliverySlotOptionView,
  DeliverySlotPickerView,
} from '../controls/delivery-slot';
import type { OrderConfirmationView } from '../controls/order-confirmation';
import type { ContentFit } from '../tokens';

const BLOOM_SRC = join(__dirname, '../../../../src');
const PACKAGE = join(__dirname, '../..');
const read = (path: string) => readFileSync(join(BLOOM_SRC, path), 'utf8');

/** A numeric token: an exact value carried over from apps (`'44'`, `'28px'`, `'-0.02em'`), not a design rung. */
const NUMERIC = /^-?\d+(\.\d+)?(px|em)?$/;
/** A scale's named rungs: the design scale, which Bloom owns. */
const named = (scale: Record<string, number>) =>
  Object.fromEntries(Object.entries(scale).filter(([name]) => !NUMERIC.test(name)));

/** `_2xl` → `2xl`: Bloom's JS keys spell a leading digit with an underscore. */
const unprefixed = (table: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(table).map(([key, value]) => [key.replace(/^_/, ''), value]));

describe('the spec is Bloom’s scales, rung for rung', () => {
  it('space, corner, size, leading and hit slop equal Bloom’s tokens', () => {
    expect(named(SPACE)).toEqual({ none: 0, ...unprefixed(tokens.space) });
    expect(named(CORNER)).toEqual(unprefixed(tokens.borderRadius));
    expect(named(FONT_SIZE)).toEqual(unprefixed(tokens.fontSize));
    expect(LEADING).toEqual(tokens.lineHeight);
    expect(HIT_SLOP).toEqual(tokens.hitSlop);
    // The language names Bloom's one disabled fade neutrally: it is any half opacity, not only a disabled control's.
    expect(OPACITY.half).toBe(tokens.DISABLED_OPACITY);
    expect(DURATION).toEqual(tokens.animation.duration);
  });

  it('a numeric token is its own value, in its scale’s unit: an exact value carried over from apps', () => {
    const scales: [Record<string, number>, string, number][] = [
      [SPACE, '', 1],
      [CORNER, '', 1],
      [FONT_SIZE, '', 1],
      [LEADING_PX, 'px', 1],
      [TRACKING, 'em', 1],
      [TRACKING_PX, 'px', 1],
      [OPACITY, '', 100],
      [Z_INDEX, '', 1],
      [SCALE, '', 100],
      [BORDER_WIDTH as unknown as Record<string, number>, '', 1],
      [ROTATION, '', 1],
    ];
    let checked = 0;
    for (const [scale, unit, factor] of scales) {
      for (const [name, value] of Object.entries(scale)) {
        if (!NUMERIC.test(name)) continue;
        expect(name).toBe(`${Number((value * factor).toFixed(6))}${unit}`);
        checked += 1;
      }
    }
    // Vacuity floor: a spec with no numeric tokens checks nothing.
    expect(checked).toBeGreaterThanOrEqual(50);
    // Every px line height and tracking is numeric; the named ones are ratios and em.
    expect(Object.keys(LEADING_PX).every((name) => NUMERIC.test(name))).toBe(true);
    expect(Object.keys(LEADING).some((name) => NUMERIC.test(name))).toBe(false);
  });

  it('an image’s content fits are BloomImage’s', () => {
    type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
    // A type error here means spec/language.json and BloomImage's contentFit disagree.
    const same: Same<ContentFit, BloomImageContentFit> = true;
    expect(same).toBe(true);
  });

  it('the type ramp is Bloom’s TYPE_SCALE, entry for entry', () => {
    expect(Object.keys(TYPE_RAMP).sort()).toEqual(Object.keys(TYPE_SCALE).sort());
    for (const [variant, step] of Object.entries(TYPE_SCALE)) {
      expect(TYPE_RAMP[variant as keyof typeof TYPE_RAMP]).toEqual([
        step.fontSize,
        step.lineHeight,
        step.letterSpacing,
        step.fontWeight,
      ]);
    }
  });

  it('icon and avatar rungs match Bloom’s own tables', () => {
    // Both modules pull the theme provider at import, so their text is read.
    const icons = read('icons/shared.tsx');
    for (const [name, size] of Object.entries(ICON_SIZE)) {
      expect(icons).toMatch(new RegExp(`\\n\\s+'?${name}'?: ${size},`));
    }
    const avatars = read('avatar/initials.ts');
    for (const [name, size] of Object.entries(AVATAR_SIZE)) {
      expect(avatars).toMatch(new RegExp(`\\n\\s+${name}: ${size},`));
    }
  });

  it('each colour role names the theme colour Bloom builds from its CSS variable', () => {
    // build-theme.ts: `textSecondary: g('muted-foreground')`: the ThemeColors key
    // and the canonical variable the web reads are one pair. A fixed colour
    // (`white: '#ffffff'`) is the same literal on both sides.
    const theme = read('theme/build-theme.ts');
    for (const { paint, web } of Object.values(COLORS)) {
      const variable = /^var\(--([\w-]+)\)$/.exec(web)?.[1];
      expect(theme).toMatch(
        new RegExp(`\\n\\s+${paint}: ${variable ? `g\\('${variable}'\\)` : `'${web}'`},`),
      );
    }
  });

  it('a text with no font measures its leading and tracking from Bloom Text’s own size', () => {
    expect(read('typography/Typography.tsx')).toMatch(
      new RegExp(
        `DEFAULT_TEXT_TYPOGRAPHY: TextStyle = \\{\\n\\s+fontSize: ${ENVIRONMENT_DEFAULTS.fontSize},`,
      ),
    );
  });

  it('shadows are Bloom’s elevation roles; stacking levels are Bloom’s Z_INDEX', () => {
    // A shadow that is no role is Tailwind's own, named by its exact box-shadow.
    const roles = Object.fromEntries(
      Object.entries(SHADOW).filter(([name, value]) => name !== value),
    );
    expect(roles).toEqual(SHADOW_BOX);
    expect(Object.keys(SHADOW).length - Object.keys(roles).length).toBe(7);
    const levels = read('styles/z-index.ts');
    for (const [name, level] of Object.entries(named(Z_INDEX))) {
      expect(levels).toMatch(new RegExp(`\\n\\s+${name}: ${level},`));
    }
  });

  it('scale factors are Bloom’s own: a press, the engagement pop’s dip and swell', () => {
    // Bloom's PressableScale and engagement pop play these through its motion
    // engine (`SCALE` in @oxy.so/bloom/motion), which the motion table test holds equal.
    expect(named(SCALE)).toEqual({ dip: 0.7, pressed: 0.98, full: 1, swell: 1.2 });
  });

  it('the strongest glass tint is the opacity Surface already gives an opaque fill on the web', () => {
    expect(read('surface/shared.ts')).toMatch(
      new RegExp(`SURFACE_TINT_OPACITY = ${GLASS_OPACITY.strong};`),
    );
  });
});

describe('motion tokens are Bloom’s motion table', () => {
  it('each motion, curve and scale is Bloom’s own, by name (Bloom’s animations play these)', () => {
    expect(MOTION).toEqual(BLOOM_MOTION);
    expect(EASING).toEqual(BLOOM_EASING);
    // The scale's named rungs; its numeric ones are factors carried over from apps.
    expect(named(SCALE)).toEqual(BLOOM_SCALE);
  });
});

describe('the spec drives the rules', () => {
  it('layering and the environment are the spec’s', () => {
    expect(LAYER_RANK.padding).toBeLessThan(LAYER_RANK.background);
    expect(LAYER_RANK.glass).toBe(LAYER_RANK.background);
    expect(ENVIRONMENT).toEqual(['foreground', 'font', 'weight', 'leading', 'tracking']);
  });

  it('each node type exposes exactly the modifiers the spec gives its kind', () => {
    type MethodsOf<T> = {
      [K in keyof T]-?: T[K] extends (...args: never[]) => unknown ? K : never;
    }[keyof T];
    type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
    type Of<K extends keyof typeof NODE_MODIFIERS> = (typeof NODE_MODIFIERS)[K][number];
    // A type error here means a node interface and spec/language.json disagree.
    const checks: [
      Same<MethodsOf<StackView>, Of<'stack'>>,
      Same<MethodsOf<SpacerView>, Of<'spacer'>>,
      Same<MethodsOf<TextView>, Of<'text'>>,
      Same<MethodsOf<IconView>, Of<'icon'>>,
      Same<MethodsOf<AvatarView>, Of<'avatar'>>,
      Same<MethodsOf<AvatarGroupView>, Of<'avatarGroup'>>,
      Same<MethodsOf<BadgeView>, Of<'badge'>>,
      Same<MethodsOf<IconCircleView>, Of<'iconCircle'>>,
      Same<MethodsOf<LoadingView>, Of<'loading'>>,
      Same<MethodsOf<SkeletonView>, Of<'skeleton'>>,
      Same<MethodsOf<SkeletonGroupView>, Of<'skeletonGroup'>>,
      Same<MethodsOf<ImageView>, Of<'image'>>,
      Same<MethodsOf<ButtonView>, Of<'button'>>,
      Same<MethodsOf<ButtonGroupView>, Of<'buttonGroup'>>,
      Same<MethodsOf<ShapeView>, Of<'shape'>>,
      Same<MethodsOf<ActionView>, Of<'action'>>,
      Same<MethodsOf<ActionBarView>, Of<'actionBar'>>,
      Same<MethodsOf<ActionGroupView>, Of<'actionGroup'>>,
      Same<MethodsOf<EmbedView>, Of<'embed'>>,
      Same<MethodsOf<LottieView>, Of<'lottie'>>,
      Same<MethodsOf<ComposedView>, Of<'view'>>,
      Same<MethodsOf<FabView>, Of<'fab'>>,
      Same<MethodsOf<MenuView>, Of<'menu'>>,
      Same<MethodsOf<MenuItemView>, Of<'menuItem'>>,
      Same<MethodsOf<MenuSubmenuView>, Of<'menuSubmenu'>>,
      Same<MethodsOf<MenuSectionView>, Of<'menuSection'>>,
      Same<MethodsOf<DividerView>, Of<'divider'>>,
      Same<MethodsOf<FillView>, Of<'fill'>>,
      Same<MethodsOf<AspectRatioView>, Of<'ratio'>>,
      Same<MethodsOf<GridView>, Of<'grid'>>,
      Same<MethodsOf<MenuContentView>, Of<'menuContent'>>,
      Same<MethodsOf<MenuActionsView>, Of<'menuActions'>>,
      Same<MethodsOf<HeaderView>, Of<'header'>>,
      Same<MethodsOf<BottomBarView>, Of<'bottomBar'>>,
      Same<MethodsOf<TabView>, Of<'tab'>>,
      Same<MethodsOf<AppLayoutView>, Of<'appLayout'>>,
      Same<MethodsOf<NavStackView>, Of<'navStack'>>,
      Same<MethodsOf<RouteView>, Of<'route'>>,
      Same<MethodsOf<TabNavigatorView>, Of<'tabView'>>,
      Same<MethodsOf<AgentAvatarView>, Of<'agentAvatar'>>,
      Same<MethodsOf<ChatComposerView>, Of<'chatComposer'>>,
      Same<MethodsOf<CompactComposerView>, Of<'compactComposer'>>,
      Same<MethodsOf<ComposerBannerView>, Of<'composerBanner'>>,
      Same<MethodsOf<ComposerIconButtonView>, Of<'composerIconButton'>>,
      Same<MethodsOf<SuggestionListView>, Of<'suggestionList'>>,
      Same<MethodsOf<VoiceRecorderView>, Of<'voiceRecorder'>>,
      Same<MethodsOf<AttachmentMenuView>, Of<'attachmentMenu'>>,
      Same<MethodsOf<EmojiPickerView>, Of<'emojiPicker'>>,
      Same<MethodsOf<ReactionPickerView>, Of<'reactionPicker'>>,
      Same<MethodsOf<MessageContextMenuView>, Of<'messageContextMenu'>>,
      Same<MethodsOf<AreaChartCardView>, Of<'areaChartCard'>>,
      Same<MethodsOf<BarListCardView>, Of<'barListCard'>>,
      Same<MethodsOf<ChartCardSurfaceView>, Of<'chartCardSurface'>>,
      Same<MethodsOf<ChartHeadlineView>, Of<'chartHeadline'>>,
      Same<MethodsOf<ChartStatTilesView>, Of<'chartStatTiles'>>,
      Same<MethodsOf<ContributionsCardView>, Of<'contributionsCard'>>,
      Same<MethodsOf<HeatmapChartCardView>, Of<'heatmapChartCard'>>,
      Same<MethodsOf<LineChartCardView>, Of<'lineChartCard'>>,
      Same<MethodsOf<RadarChartCardView>, Of<'radarChartCard'>>,
      Same<MethodsOf<SleepScoreCardView>, Of<'sleepScoreCard'>>,
      Same<MethodsOf<SparklineView>, Of<'sparkline'>>,
      Same<MethodsOf<StageBarsCardView>, Of<'stageBarsCard'>>,
      Same<MethodsOf<StepsCardView>, Of<'stepsCard'>>,
      Same<MethodsOf<TokensChartCardView>, Of<'tokensChartCard'>>,
      Same<MethodsOf<ComposerPanelView>, Of<'composerPanel'>>,
      Same<MethodsOf<ComposerPillView>, Of<'composerPill'>>,
      Same<MethodsOf<ComposerPanelStatusTabView>, Of<'composerPanelStatusTab'>>,
      Same<MethodsOf<AiChatShellView>, Of<'aiChatShell'>>,
      Same<MethodsOf<AiChatContainerView>, Of<'aiChatContainer'>>,
      Same<MethodsOf<AiChatThreadView>, Of<'aiChatThread'>>,
      Same<MethodsOf<AiChatUserMessageView>, Of<'aiChatUserMessage'>>,
      Same<MethodsOf<AiChatAssistantMessageView>, Of<'aiChatAssistantMessage'>>,
      Same<MethodsOf<AiChatMessageLineView>, Of<'aiChatMessageLine'>>,
      Same<MethodsOf<AiChatHeaderView>, Of<'aiChatHeader'>>,
      Same<MethodsOf<AiChatMobileHeaderView>, Of<'aiChatMobileHeader'>>,
      Same<MethodsOf<AiChatCodePanelView>, Of<'aiChatCodePanel'>>,
      Same<MethodsOf<AiChatGalleryPanelView>, Of<'aiChatGalleryPanel'>>,
      Same<MethodsOf<StatCardView>, Of<'statCard'>>,
      Same<MethodsOf<StatCardsView>, Of<'statCards'>>,
      Same<MethodsOf<PlayButtonView>, Of<'playButton'>>,
      Same<MethodsOf<PlaybackProgressView>, Of<'playbackProgress'>>,
      Same<MethodsOf<AgentLimitsCardView>, Of<'agentLimitsCard'>>,
      Same<MethodsOf<UsageCardView>, Of<'usageCard'>>,
      Same<MethodsOf<AgentThinkingView>, Of<'agentThinking'>>,
      Same<MethodsOf<AgentProgressView>, Of<'agentProgress'>>,
      Same<MethodsOf<AgentProgressLoadingTextView>, Of<'agentProgressLoadingText'>>,
      Same<MethodsOf<AgentLogRowView>, Of<'agentLogRow'>>,
      Same<MethodsOf<AgentLogShimmerTextView>, Of<'agentLogShimmerText'>>,
      Same<MethodsOf<AgentLogToolCallView>, Of<'agentLogToolCall'>>,
      Same<MethodsOf<AgentLogToolCallsView>, Of<'agentLogToolCalls'>>,
      Same<MethodsOf<AgentLogWorkingRowView>, Of<'agentLogWorkingRow'>>,
      Same<MethodsOf<ComposerLoaderView>, Of<'composerLoader'>>,
      Same<MethodsOf<ConversationSidebarView>, Of<'conversationSidebar'>>,
      Same<MethodsOf<QuestionnaireView>, Of<'questionnaire'>>,
      Same<MethodsOf<ChatBackgroundView>, Of<'chatBackground'>>,
      Same<MethodsOf<ChatDateHeaderView>, Of<'chatDateHeader'>>,
      Same<MethodsOf<ChatEmptyStateView>, Of<'chatEmptyState'>>,
      Same<MethodsOf<ChatHeaderView>, Of<'chatHeader'>>,
      Same<MethodsOf<ChatInfoPanelView>, Of<'chatInfoPanel'>>,
      Same<MethodsOf<PinnedMessageBarView>, Of<'pinnedMessageBar'>>,
      Same<MethodsOf<ScrollToBottomButtonView>, Of<'scrollToBottomButton'>>,
      Same<MethodsOf<ChatFolderTabsView>, Of<'chatFolderTabs'>>,
      Same<MethodsOf<ChatSearchFieldView>, Of<'chatSearchField'>>,
      Same<MethodsOf<ChatSearchResultsView>, Of<'chatSearchResults'>>,
      Same<MethodsOf<StoriesRowView>, Of<'storiesRow'>>,
      Same<MethodsOf<StoryRingView>, Of<'storyRing'>>,
      Same<MethodsOf<TypingDotsView>, Of<'typingDots'>>,
      Same<MethodsOf<ContactMessageView>, Of<'contactMessage'>>,
      Same<MethodsOf<DocumentGridView>, Of<'documentGrid'>>,
      Same<MethodsOf<FileMessageView>, Of<'fileMessage'>>,
      Same<MethodsOf<GifMessageView>, Of<'gifMessage'>>,
      Same<MethodsOf<ImageMessageView>, Of<'imageMessage'>>,
      Same<MethodsOf<LocationMessageView>, Of<'locationMessage'>>,
      Same<MethodsOf<PollMessageView>, Of<'pollMessage'>>,
      Same<MethodsOf<SharedMediaGridView>, Of<'sharedMediaGrid'>>,
      Same<MethodsOf<StickerMessageView>, Of<'stickerMessage'>>,
      Same<MethodsOf<VideoMessageView>, Of<'videoMessage'>>,
      Same<MethodsOf<VoiceMessageView>, Of<'voiceMessage'>>,
      Same<MethodsOf<AmenityListView>, Of<'amenityList'>>,
      Same<MethodsOf<HostCardView>, Of<'hostCard'>>,
      Same<MethodsOf<ListingHeaderView>, Of<'listingHeader'>>,
      Same<MethodsOf<ListingHeaderActionView>, Of<'listingHeaderAction'>>,
      Same<MethodsOf<ListingPhotoGridView>, Of<'listingPhotoGrid'>>,
      Same<MethodsOf<ReviewCardView>, Of<'reviewCard'>>,
      Same<MethodsOf<MapClusterMarkerView>, Of<'mapClusterMarker'>>,
      Same<MethodsOf<MapPriceMarkerView>, Of<'mapPriceMarker'>>,
      Same<MethodsOf<MapSearchAreaButtonView>, Of<'mapSearchAreaButton'>>,
      Same<MethodsOf<FollowButtonView>, Of<'followButton'>>,
      Same<MethodsOf<ShelfView>, Of<'shelf'>>,
      Same<MethodsOf<ShelfSkeletonView>, Of<'shelfSkeleton'>>,
      Same<MethodsOf<SubscriptionPlansView>, Of<'subscriptionPlans'>>,
      Same<MethodsOf<SubscriptionPriceView>, Of<'subscriptionPrice'>>,
      Same<MethodsOf<UserHoverCardView>, Of<'userHoverCard'>>,
      Same<MethodsOf<CardFormView>, Of<'cardForm'>>,
      Same<MethodsOf<CardFormCountryView>, Of<'cardFormCountry'>>,
      Same<MethodsOf<CardFormPostcodeView>, Of<'cardFormPostcode'>>,
      Same<MethodsOf<CardFormHostedFieldView>, Of<'cardFormHostedField'>>,
      Same<MethodsOf<CheckoutSheetView>, Of<'checkoutSheet'>>,
      Same<MethodsOf<RouteStopsView>, Of<'routeStops'>>,
      Same<MethodsOf<NoteCardView>, Of<'noteCard'>>,
      Same<MethodsOf<NoteCardSkeletonView>, Of<'noteCardSkeleton'>>,
      Same<MethodsOf<ShareSheetView>, Of<'shareSheet'>>,
      Same<MethodsOf<ConnectionDotsView>, Of<'connectionDots'>>,
      Same<MethodsOf<OutlineNavView>, Of<'outlineNav'>>,
      Same<MethodsOf<PaginationView>, Of<'pagination'>>,
      Same<MethodsOf<ProgressiveBlurView>, Of<'progressiveBlur'>>,
      Same<MethodsOf<AddressRowView>, Of<'addressRow'>>,
      Same<MethodsOf<AddressListView>, Of<'addressList'>>,
      Same<MethodsOf<PaymentMethodMarkView>, Of<'paymentMethodMark'>>,
      Same<MethodsOf<PaymentMethodRowView>, Of<'paymentMethodRow'>>,
      Same<MethodsOf<PaymentMethodListView>, Of<'paymentMethodList'>>,
      Same<MethodsOf<PriceSummaryView>, Of<'priceSummary'>>,
      Same<MethodsOf<PriceSummaryLineView>, Of<'priceSummaryLine'>>,
      Same<MethodsOf<PaymentStatusBarView>, Of<'paymentStatusBar'>>,
      Same<MethodsOf<PaymentStatusBlockView>, Of<'paymentStatusBlock'>>,
      Same<MethodsOf<ContactProfileCardView>, Of<'contactProfileCard'>>,
      Same<MethodsOf<LeadScoreCardView>, Of<'leadScoreCard'>>,
      Same<MethodsOf<DealCardView>, Of<'dealCard'>>,
      Same<MethodsOf<PipelineColumnView>, Of<'pipelineColumn'>>,
      Same<MethodsOf<PipelineBoardView>, Of<'pipelineBoard'>>,
      Same<MethodsOf<ImportantAlertsCardView>, Of<'importantAlertsCard'>>,
      Same<MethodsOf<PatientInfoCardView>, Of<'patientInfoCard'>>,
      Same<MethodsOf<RecentHiresCardView>, Of<'recentHiresCard'>>,
      Same<MethodsOf<CartLineView>, Of<'cartLine'>>,
      Same<MethodsOf<CartPanelView>, Of<'cartPanel'>>,
      Same<MethodsOf<CartPromoFieldView>, Of<'cartPromoField'>>,
      Same<MethodsOf<CartTipPickerView>, Of<'cartTipPicker'>>,
      Same<MethodsOf<MenuItemRowView>, Of<'menuItemRow'>>,
      Same<MethodsOf<MenuItemOptionsView>, Of<'menuItemOptions'>>,
      Same<MethodsOf<VendorCardView>, Of<'vendorCard'>>,
      Same<MethodsOf<MediaCardView>, Of<'mediaCard'>>,
      Same<MethodsOf<SongCardView>, Of<'songCard'>>,
      Same<MethodsOf<AlbumCardView>, Of<'albumCard'>>,
      Same<MethodsOf<ArtistCardView>, Of<'artistCard'>>,
      Same<MethodsOf<PlaylistCardView>, Of<'playlistCard'>>,
      Same<MethodsOf<MixCardView>, Of<'mixCard'>>,
      Same<MethodsOf<PodcastCardView>, Of<'podcastCard'>>,
      Same<MethodsOf<EpisodeCardView>, Of<'episodeCard'>>,
      Same<MethodsOf<AudiobookCardView>, Of<'audiobookCard'>>,
      Same<MethodsOf<GenreCardView>, Of<'genreCard'>>,
      Same<MethodsOf<EventCardView>, Of<'eventCard'>>,
      Same<MethodsOf<ProfileCardView>, Of<'profileCard'>>,
      Same<MethodsOf<FriendActivityCardView>, Of<'friendActivityCard'>>,
      Same<MethodsOf<QuickAccessTileView>, Of<'quickAccessTile'>>,
      Same<MethodsOf<RecapCardView>, Of<'recapCard'>>,
      Same<MethodsOf<ShareCardView>, Of<'shareCard'>>,
      Same<MethodsOf<LyricsViewView>, Of<'lyricsView'>>,
      Same<MethodsOf<LyricsPreviewCardView>, Of<'lyricsPreviewCard'>>,
      Same<MethodsOf<ArtistChipsInputView>, Of<'artistChipsInput'>>,
      Same<MethodsOf<ArtworkUploaderView>, Of<'artworkUploader'>>,
      Same<MethodsOf<AudienceBreakdownView>, Of<'audienceBreakdown'>>,
      Same<MethodsOf<AudienceOverviewView>, Of<'audienceOverview'>>,
      Same<MethodsOf<CreditsEditorView>, Of<'creditsEditor'>>,
      Same<MethodsOf<IsrcFieldView>, Of<'isrcField'>>,
      Same<MethodsOf<PayoutSummaryCardView>, Of<'payoutSummaryCard'>>,
      Same<MethodsOf<PitchCardView>, Of<'pitchCard'>>,
      Same<MethodsOf<ReleaseCardView>, Of<'releaseCard'>>,
      Same<MethodsOf<ReleaseStatusBadgeView>, Of<'releaseStatusBadge'>>,
      Same<MethodsOf<ReleaseTimelineView>, Of<'releaseTimeline'>>,
      Same<MethodsOf<StreamsChartView>, Of<'streamsChart'>>,
      Same<MethodsOf<TopTracksTableView>, Of<'topTracksTable'>>,
      Same<MethodsOf<TrackMetadataFormView>, Of<'trackMetadataForm'>>,
      Same<MethodsOf<TrackUploadRowView>, Of<'trackUploadRow'>>,
      Same<MethodsOf<CheckoutSummaryRowView>, Of<'checkoutSummaryRow'>>,
      Same<MethodsOf<CheckoutSummaryView>, Of<'checkoutSummary'>>,
      Same<MethodsOf<CheckoutConfirmView>, Of<'checkoutConfirm'>>,
      Same<MethodsOf<DeliverySlotDaysView>, Of<'deliverySlotDays'>>,
      Same<MethodsOf<DeliverySlotOptionView>, Of<'deliverySlotOption'>>,
      Same<MethodsOf<DeliverySlotPickerView>, Of<'deliverySlotPicker'>>,
      Same<MethodsOf<OrderConfirmationView>, Of<'orderConfirmation'>>,
    ] = [
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ];
    expect(checks.every(Boolean)).toBe(true);
  });

  it('every generated class is in the sheet once', () => {
    const names = Object.values(WEB_CLASS);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) {
      expect(WEB_SHEET.split('\n').filter((rule) => rule.startsWith(`.${name}{`))).toHaveLength(1);
    }
  });

  it('the className table is current with the spec and the apps’ usage', () => {
    const script = join(PACKAGE, 'scripts/generate-classnames.mjs');
    expect(() =>
      execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' }),
    ).not.toThrow();
  });

  it('the generated outputs are current with the spec', () => {
    const script = join(PACKAGE, 'scripts/generate.mjs');
    expect(() =>
      execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' }),
    ).not.toThrow();
  });
});
