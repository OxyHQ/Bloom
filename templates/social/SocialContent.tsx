import { EngagementBar, EngagementAction } from '../../src/engagement-bar';
import {
  RiHeartLine,
  RiHeartFill,
  RiRepeatLine,
  RiChat1Line,
  RiBookmarkLine,
  RiBookmarkFill,
  RiImageLine,
} from '../../src/icons/remix';
import { ScrollArea as ScrollView } from '../../src/layout';
import { ListItem } from '../../src/list';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../src/typography';
import { FollowButton } from '../../src/media-header';
import { Avatar } from '../../src/avatar';
import { Button } from '../../src/button/index.web';
import { Card } from '../../src/card';
import { LinkPreviewCard } from '../../src/link-preview';
import { Sparkline } from '../../src/chart-cards';
import { Search } from '../../src/search';
import { Tabs, TabsTrigger } from '../../src/tabs';
import { defaultAvatarSource } from '../../src/avatar/default-avatar';
import { useSurfaceFill } from '../../src/styles/surface-levels';
import { useTheme } from '../../src/theme/use-theme';
import Svg, { Path } from 'react-native-svg';

const booksCover = new URL('./assets/books.svg', import.meta.url).href;

function useSocialPalette() {
  const { colors: c } = useTheme();
  const canvas = useSurfaceFill();
  return {
    canvas,
    shell: c.backgroundSecondary,
    surface: c.backgroundTertiary,
    raised: c.card,
    text: c.text,
    textMuted: c.textSecondary,
    identity: c.primary,
    onIdentity: c.primaryForeground,
    action: c.tertiary,
    onAction: c.tertiaryForeground,
    actionSoft: c.tertiarySubtle,
  };
}
type LabPalette = ReturnType<typeof useSocialPalette>;
export function SocialLogo({ color, size = 28 }: { color?: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <Svg viewBox="0 0 67.65 74.16" width={size} height={size}>
      <Path
        d="M60.31,69.05c-.38,1.28-.28,3.27,1.23,4.4,1.25,.94,2.94,.89,4.15,.2,2.17-1.23,1.95-4.01,1.93-4.2-.12-1.2-.79-3.05-2.38-3.57-1.99-.65-4.32,1.12-4.93,3.17Zm-25.68-15.26c-.55-2.36,.03-3.77,.36-5.19,1.9-8.07,3.99-16.1,5.7-24.21,1.3-6.17,3.27-12.26,2.95-18.69-.1-2.04-.31-4.09-2.44-5.07-2.19-1.02-4.42-.79-6.38,.64-.89,.65-1.74,1.46-2.35,2.37-3.65,5.43-7.57,10.72-10.77,16.4C13.26,35.01,6.84,50.89,.74,66.91c-1.42,3.74-.85,5.88,2.18,6.94,2.72,.95,5.21-.38,6.16-3.74,4.57-16.2,11.72-31.29,19.67-46.06,1.02-1.9,1.97-3.83,4.61-5.66-.42,2.24-.67,3.66-.96,5.07-2.65,12.88-6.49,25.49-8.48,38.52-.52,3.43,.15,6.29,3.47,7.82,3.48,1.6,6.02-.21,8.02-2.9,3.7-4.96,7.34-9.96,10.96-14.98,2.77-3.84,5.71-7.53,9.2-10.75,.78-.72,1.54-2.01,2.77-1.45,1.12,.51,1.02,1.92,1.04,3.01,.09,4.71,.06,9.43,.18,14.14,.06,2.24,.12,4.9,3.14,5.09,3.03,.19,3.79-2.12,4.17-4.69,.89-6.05,.87-12.13,.6-18.2-.3-6.7-4.95-9.74-11.34-7.69-5.82,1.87-9.12,6.72-12.82,11.01-2.97,3.45-5.54,7.24-8.69,11.4Z"
        fill={color ?? colors.text}
      />
    </Svg>
  );
}

type PostIllustrationVariant = 'dictionary-primary' | 'dictionary-secondary';

function PostIllustration({
  palette,
  variant,
}: {
  palette: LabPalette;
  variant: PostIllustrationVariant;
}) {
  const accent = variant === 'dictionary-secondary' ? palette.action : palette.identity;
  const onAccent = variant === 'dictionary-secondary' ? palette.onAction : palette.onIdentity;
  const label = 'Abstract dictionary-card illustration';

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityRole="image"
      style={[styles.galleryImage, styles.postIllustration, { backgroundColor: palette.shell }]}
    >
      <View style={[styles.dictionaryCard, { backgroundColor: palette.raised }]}>
        <View style={[styles.dictionaryMonogram, { backgroundColor: accent }]}>
          <Text style={[styles.dictionaryMonogramText, { color: onAccent }]}>W</Text>
        </View>
        <View style={styles.dictionaryCopy}>
          <View style={[styles.dictionaryLineLong, { backgroundColor: palette.text }]} />
          <View style={[styles.dictionaryLineMedium, { backgroundColor: accent }]} />
          <View style={[styles.dictionaryLineShort, { backgroundColor: palette.textMuted }]} />
        </View>
      </View>
    </View>
  );
}

function MentionPost({
  palette,
  second = false,
  onReply,
}: {
  palette: LabPalette;
  second?: boolean;
  onReply?: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <View
      style={[styles.post, { backgroundColor: palette.canvas, borderBottomColor: palette.shell }]}
    >
      <Avatar source={defaultAvatarSource} size={36} />
      <View style={styles.postBody}>
        <View style={styles.postIdentityRow}>
          <Text numberOfLines={1} style={[styles.postName, { color: palette.text }]}>
            {second ? 'Depths of Wiktionary' : '404 MEDIA'}
          </Text>
          <Text numberOfLines={1} style={[styles.postHandle, { color: palette.textMuted }]}>
            {second ? '@depthsofwiktionary@wikis.world · 5d' : '@404mediaco@mastodon.social · 3d'}
          </Text>
        </View>
        {second ? null : (
          <Text style={[styles.postText, { color: palette.text }]}>
            We placed a tracking device in a shipment of rare books to see which AI company was
            buying it, and found an Amazon facility where Amazon scans and destroys books.
          </Text>
        )}

        {second ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryRow}
            style={{ width: '100%' }}
          >
            <PostIllustration palette={palette} variant="dictionary-primary" />
            <PostIllustration palette={palette} variant="dictionary-secondary" />
          </ScrollView>
        ) : (
          <LinkPreviewCard
            url="https://www.404media.co/"
            siteName="404 MEDIA"
            title="We Tracked a Shipment of Rare Books. It Ended at an Amazon AI Training Facility"
            description="We placed a tracking device in a shipment of rare books to see which AI company was buying it."
            image={booksCover}
            style={{ width: 280, maxWidth: '100%' }}
          />
        )}

        <EngagementBar
          trailing={
            <EngagementAction
              icon={RiBookmarkLine}
              activeIcon={RiBookmarkFill}
              accessibilityLabel="Bookmark"
              active={saved}
              onPress={() => setSaved(!saved)}
            />
          }
        >
          <EngagementAction
            icon={RiHeartLine}
            activeIcon={RiHeartFill}
            accessibilityLabel="Like"
            active={liked}
            count={liked ? 1 : 0}
            onPress={() => setLiked(!liked)}
          />
          <EngagementAction icon={RiChat1Line} accessibilityLabel="Reply" onPress={onReply} />
          <EngagementAction
            icon={RiRepeatLine}
            accessibilityLabel="Repost"
            active={reposted}
            onPress={() => setReposted(!reposted)}
          />
        </EngagementBar>
      </View>
    </View>
  );
}

function TrendRow({
  rank,
  title,
  meta,
  palette,
}: {
  rank: number;
  title: string;
  meta: string;
  palette: LabPalette;
}) {
  return (
    <View style={[styles.trendRow, { borderBottomColor: palette.shell }]}>
      <Text style={[styles.trendRank, { color: palette.textMuted }]}>{rank}</Text>
      <View style={styles.trendCopy}>
        <Text style={[styles.trendMeta, { color: palette.textMuted }]}>{meta}</Text>
        <Text style={[styles.trendTitle, { color: palette.text }]}>{title}</Text>
      </View>
      <Sparkline
        data={rank % 2 ? [2, 2, 2, 8, 3, 3, 3, 6] : [4, 4, 8, 3, 3, 3, 2]}
        width={50}
        height={24}
        color={palette.identity}
        accessibilityLabel={`${title} activity trend`}
      />
    </View>
  );
}

const FOLLOW_ITEMS = [
  ['Depths of Wiktionary', '@depthsofwiktionary@wikis.world'],
  ['David Revoy', '@davidrevoy@framapiaf.org'],
  ['Ritalin Invitees', '@intransitivelie@beige.party'],
  ['J L Westover', '@mrlovenstein@mastodon.social'],
] as const;

export function SocialWidgets(_props: { authenticated?: boolean }) {
  const palette = useSocialPalette();
  const [query, setQuery] = useState('');
  const [following, setFollowing] = useState<Set<string>>(() => new Set());
  return (
    <View style={styles.rightRail}>
      <View style={{ marginBottom: 16 }}>
        <Search
          label="Search Mention"
          value={query}
          onValueChange={setQuery}
          onClearText={() => setQuery('')}
        />
      </View>

      <Card
        testID="social-trending"
        appearance="plain"
        radius="radius-0"
        style={{ marginBottom: 16 }}
      >
        <Text style={[styles.widgetTitle, { color: palette.text }]}>Trending</Text>
        <TrendRow rank={1} title="Earth" meta="Trending · 4 people" palette={palette} />
        <TrendRow rank={2} title="Elon Musk" meta="Trending · 5 people" palette={palette} />
        <TrendRow rank={3} title="York" meta="Trending · 3 people" palette={palette} />
        <TrendRow rank={4} title="Grok" meta="Trending · 6 people" palette={palette} />
        <TrendRow rank={5} title="Trump" meta="Trending · 4 people" palette={palette} />
      </Card>
      <Text style={[styles.widgetTitle, { color: palette.text }]}>Who to follow</Text>
      {FOLLOW_ITEMS.map(([name, handle]) => (
        <ListItem
          person={{ name: name, subtitle: handle, avatar: defaultAvatarSource }}
          key={handle}
          trailing={
            <FollowButton
              following={following.has(handle)}
              onFollowChange={(next) =>
                setFollowing((current) => {
                  const updated = new Set(current);
                  if (next) updated.add(handle);
                  else updated.delete(handle);
                  return updated;
                })
              }
              style={{ minWidth: 100 }}
              testID={`social-follow-${name.toLowerCase().replace(/ /g, '-')}-button`}
            />
          }
          testID={`social-follow-${name.toLowerCase().replace(/ /g, '-')}`}
          style={{ borderBottomWidth: 1, borderBottomColor: palette.shell }}
        />
      ))}

      <Text style={[styles.footerCopy, { color: palette.textMuted }]}>
        Made with ❤️ in the 🌎 by Oxy.
      </Text>
      <Text style={[styles.footerCopy, { color: palette.textMuted }]}>
        Mention™ is a trademark of The Oxy Collective, Inc.
      </Text>
    </View>
  );
}

/** Original playground feed content; the shared template owns its surrounding layout. */
export function SocialFeed({
  authenticated,
  onCompose,
}: {
  authenticated: boolean;
  onCompose?: () => void;
}) {
  const palette = useSocialPalette();
  const [tab, setTab] = useState('For You');
  return (
    <View style={{ width: '100%', minWidth: 0, position: 'relative' }}>
      <Tabs value={tab} onValueChange={setTab} variant="underline" style={{ height: 38 }}>
        {(authenticated ? ['For You', 'Following'] : ['For You']).map((label) => (
          <TabsTrigger
            key={label}
            value={label}
            label={label}
            style={{
              height: 38,
              minWidth: 76,
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 0,
              paddingBottom: 0,
            }}
            textStyle={{ fontSize: 15, lineHeight: 18, fontWeight: tab === label ? '700' : '500' }}
          />
        ))}
      </Tabs>
      {authenticated && (
        <Button
          appearance="solid"
          tone="neutral"
          accessibilityRole="button"
          accessibilityLabel="Create a post"
          onPress={onCompose}
          style={styles.composer}
        >
          <Avatar source={defaultAvatarSource} size={32} name="Nate" />
          <Text style={[styles.composerPlaceholder, { color: palette.textMuted }]}>What's up?</Text>
          <RiImageLine fill={palette.textMuted} width={20} height={20} />
        </Button>
      )}
      <MentionPost palette={palette} onReply={onCompose} />
      <MentionPost second palette={palette} onReply={onCompose} />
      {!authenticated && (
        <View style={[styles.signInBanner, { backgroundColor: palette.identity }]}>
          <View>
            <Text style={[styles.signInTitle, { color: palette.onIdentity }]}>
              Don't miss what's happening
            </Text>
            <Text style={[styles.signInSubtitle, { color: palette.onIdentity }]}>
              People on Mention are the first to know.
            </Text>
          </View>
          <Button
            appearance="solid"
            tone="neutral"
            accessibilityLabel="Sign in"
            onPress={onCompose}
            style={styles.signInButton}
            textStyle={styles.signInButtonText}
          >
            Sign In
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    height: 'auto',
    minHeight: 56,
    margin: 12,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  composerPlaceholder: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
  },
  post: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: 1,
  },
  postBody: {
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  postIdentityRow: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postName: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
  },
  postHandle: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 18,
  },
  postText: {
    fontSize: 15,
    lineHeight: 20,
  },
  postIllustration: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  galleryImage: {
    width: 462,
    height: 180,
    borderRadius: 16,
  },
  dictionaryCard: {
    width: '78%',
    height: '74%',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dictionaryMonogram: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dictionaryMonogramText: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  dictionaryCopy: {
    flex: 1,
    gap: 9,
  },
  dictionaryLineLong: {
    width: '88%',
    height: 8,
    borderRadius: 4,
  },
  dictionaryLineMedium: {
    width: '68%',
    height: 7,
    borderRadius: 4,
  },
  dictionaryLineShort: {
    width: '48%',
    height: 6,
    borderRadius: 3,
  },
  signInBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signInTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
  },
  signInSubtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 16,
    opacity: 0.86,
  },
  signInButton: {
    height: 'auto',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 999,
  },
  signInButtonText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
  },
  rightRail: {
    width: '100%',
  },
  widgetTitle: {
    marginBottom: 7,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  trendRow: {
    minHeight: 48,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendRank: {
    width: 9,
    fontSize: 13,
    lineHeight: 16,
  },
  trendCopy: {
    flex: 1,
    minWidth: 0,
  },
  trendMeta: {
    fontSize: 12,
    lineHeight: 15,
  },
  trendTitle: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '600',
  },
  footerCopy: {
    fontSize: 12,
    lineHeight: 16,
  },
});
