import React, { useContext } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AvatarPresence } from './AvatarPresence';
import { MessageStatus } from './MessageStatus';
import { PresenceDot } from './PresenceDot';
import { StoryRing } from './StoryRing';
import { TypingDots } from './TypingDots';
import { UnreadBadge } from './UnreadBadge';
import type { MessageDeliveryStatus, PresenceStatus, StoryRingState } from './types';
import { Avatar } from '../avatar';
import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Base/Chat Indicators',
};

export default meta;

type Story = StoryObj;

const PRESENCE: PresenceStatus[] = ['online', 'idle', 'busy', 'offline'];
const DELIVERY: MessageDeliveryStatus[] = ['sending', 'sent', 'delivered', 'read', 'failed'];
const RINGS: StoryRingState[] = ['unseen', 'seen', 'none'];

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

function Surface({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, padding: 20, gap: 20, backgroundColor: theme.colors.background }}>
      {children}
    </View>
  );
}

/**
 * The same block in both modes, side by side — every colour here flips. The
 * ambient preset is forwarded, or the nested providers would drop back to the
 * default one and the toolbar's preset switch would stop reaching these.
 */
function BothModes({ children }: { children: React.ReactNode }) {
  const preset = useContext(BloomThemeContext)?.colorPreset;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <View style={{ minWidth: 340, flexGrow: 1, flexBasis: 340 }}>
        <BloomThemeProvider mode="light" colorPreset={preset}>
          <Surface>{children}</Surface>
        </BloomThemeProvider>
      </View>
      <View style={{ minWidth: 340, flexGrow: 1, flexBasis: 340 }}>
        <BloomThemeProvider mode="dark" colorPreset={preset}>
          <Surface>{children}</Surface>
        </BloomThemeProvider>
      </View>
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Caption>{title}</Caption>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        {children}
      </View>
    </View>
  );
}

/** Every state of every piece, light and dark. */
export const Matrix: Story = {
  render: function ChatIndicatorMatrix() {
    return (
      <BothModes>
        <Group title="presence — online, away, busy, offline (8 / 10 / 12)">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <View key={size} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {PRESENCE.map((status) => (
                <PresenceDot key={status} status={status} size={size} />
              ))}
            </View>
          ))}
        </Group>

        <Group title="presence on an avatar">
          {PRESENCE.map((status) => (
            <AvatarPresence key={status} name="Ana Restrepo" size={40} status={status} />
          ))}
          <AvatarPresence name="Marcel Dubé" size={24} status="online" />
          <AvatarPresence name="Nour Haddad" size={56} status="busy" />
        </Group>

        <Group title="delivery — sending, sent, delivered, read, failed (12 / 14 / 16)">
          {([12, 14, 16] as const).map((size) => (
            <View key={size} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {DELIVERY.map((status) => (
                <MessageStatus key={status} status={status} size={size} />
              ))}
            </View>
          ))}
        </Group>

        <Group title="unread — accent, muted, dot, clamped">
          <UnreadBadge count={1} />
          <UnreadBadge count={12} />
          <UnreadBadge count={128} />
          <UnreadBadge count={7} muted />
          <UnreadBadge count={7} dot />
          <UnreadBadge count={3} size="small" />
          <UnreadBadge count={64} size="small" />
          <UnreadBadge count={4} size="small" muted />
          <UnreadBadge count={0} />
        </Group>

        <Group title="typing">
          <TypingDots />
          <TypingDots size={8} />
          <TypingDots label="Ana is typing…" />
        </Group>
      </BothModes>
    );
  },
};

/** A conversation list row: avatar + presence, name, ticks, time and the count. */
export const ConversationRows: Story = {
  render: function ChatIndicatorRows() {
    const rows: Array<{
      name: string;
      status: PresenceStatus;
      preview: string;
      time: string;
      delivery?: MessageDeliveryStatus;
      unread?: number;
      muted?: boolean;
      typing?: boolean;
    }> = [
      { name: 'Ana Restrepo', status: 'online', preview: 'See you at the studio', time: '12:41', delivery: 'read' },
      { name: 'Marcel Dubé', status: 'idle', preview: '', time: '12:08', typing: true, unread: 3 },
      { name: 'Roof Garden Crew', status: 'offline', preview: 'Nour: bringing the speakers', time: 'Yesterday', unread: 128 },
      { name: 'Ines Okafor', status: 'busy', preview: 'Sent the floor plan', time: 'Yesterday', delivery: 'delivered' },
      { name: 'Building 12', status: 'offline', preview: 'Water is back on', time: 'Mon', unread: 6, muted: true },
      { name: 'Teodor Vlaicu', status: 'online', preview: 'Could not send', time: 'Mon', delivery: 'failed' },
    ];

    function Rows() {
      const theme = useTheme();
      return (
        <View style={{ gap: 2 }}>
          {rows.map((row) => (
            <View
              key={row.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingTop: 10,
                paddingBottom: 10,
                paddingLeft: 12,
                paddingRight: 12,
                borderRadius: 16,
                backgroundColor: theme.colors.backgroundSecondary,
              }}
            >
              <AvatarPresence
                name={row.name}
                size={44}
                status={row.status}
                presenceRingColor={theme.colors.backgroundSecondary}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="body-semibold" numberOfLines={1} style={{ color: theme.colors.text }}>
                  {row.name}
                </Text>
                {row.typing ? (
                  <TypingDots label="typing…" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {row.delivery ? <MessageStatus status={row.delivery} size={14} label="" /> : null}
                    <Text
                      variant="body-2-regular"
                      numberOfLines={1}
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {row.preview}
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text variant="caption-1-regular" style={{ color: theme.colors.textSecondary }}>
                  {row.time}
                </Text>
                {row.unread ? (
                  <UnreadBadge count={row.unread} size="small" muted={row.muted} />
                ) : null}
              </View>
            </View>
          ))}
        </View>
      );
    }

    return (
      <BothModes>
        <Rows />
      </BothModes>
    );
  },
};

/** The three ring states, an "Add" affordance and a `+ N` overflow pill. */
export const Stories: Story = {
  render: function ChatIndicatorStoryRings() {
    function Ring({ state, name }: { state: StoryRingState; name: string }) {
      return (
        <View style={{ alignItems: 'center', gap: 6, width: 76 }}>
          <StoryRing state={state} size={56} onPress={() => {}} accessibilityLabel={`${name}'s story`}>
            <Avatar name={name} size={56} />
          </StoryRing>
          <Text variant="caption-2-regular" numberOfLines={1}>
            {name.split(' ')[0]}
          </Text>
        </View>
      );
    }

    function Row() {
      const theme = useTheme();
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
          {RINGS.map((state, index) => (
            <Ring key={state} state={state} name={['Ana Restrepo', 'Marcel Dubé', 'Nour Haddad'][index] ?? 'Ana'} />
          ))}
          <View style={{ alignItems: 'center', gap: 6, width: 76 }}>
            <StoryRing
              state="seen"
              size={56}
              badge={
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.primary,
                    borderWidth: 2,
                    borderColor: theme.colors.background,
                  }}
                >
                  <Text
                    variant="caption-2-bold"
                    style={{ color: theme.colors.primaryForeground, lineHeight: 16 }}
                  >
                    +
                  </Text>
                </View>
              }
            >
              <Avatar name="You" size={56} />
            </StoryRing>
            <Text variant="caption-2-regular" numberOfLines={1}>
              Your story
            </Text>
          </View>
          <View style={{ alignItems: 'center', gap: 6, width: 76 }}>
            <StoryRing state="unseen" size={56} badge={<UnreadBadge count={4} size="small" />}>
              <Avatar name="Roof Garden" size={56} />
            </StoryRing>
            <Text variant="caption-2-regular" numberOfLines={1}>
              Roof Garden
            </Text>
          </View>
        </View>
      );
    }

    return (
      <BothModes>
        <Row />
      </BothModes>
    );
  },
};
