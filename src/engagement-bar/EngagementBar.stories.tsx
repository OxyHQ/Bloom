import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { EngagementAction, EngagementBar, EngagementGroup } from './index';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { RiArrowUpSLine } from '../icons/remix/RiArrowUpSLine';
import { RiBarChartBoxLine } from '../icons/remix/RiBarChartBoxLine';
import { RiBookmarkFill } from '../icons/remix/RiBookmarkFill';
import { RiBookmarkLine } from '../icons/remix/RiBookmarkLine';
import { RiChat3Line } from '../icons/remix/RiChat3Line';
import { RiHeart3Fill } from '../icons/remix/RiHeart3Fill';
import { RiHeart3Line } from '../icons/remix/RiHeart3Line';
import { RiRepeat2Line } from '../icons/remix/RiRepeat2Line';
import { RiTranslate2 } from '../icons/remix/RiTranslate2';
import { RiUpload2Line } from '../icons/remix/RiUpload2Line';

const meta: Meta<typeof EngagementBar> = {
  id: 'base-engagement-bar',
  title: 'Components/Actions/Engagement Bar',
  component: EngagementBar,
};

export default meta;

type Story = StoryObj<typeof EngagementBar>;

function Post() {
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [translating, setTranslating] = useState(false);
  return (
    <View style={{ width: 420, maxWidth: '100%', paddingHorizontal: 16 }}>
      <EngagementBar
        trailing={
          <>
            <EngagementAction
              icon={RiBookmarkLine}
              activeIcon={RiBookmarkFill}
              accessibilityLabel="Save"
              active={saved}
              onPress={() => setSaved((value) => !value)}
            />
            <EngagementAction
              icon={RiTranslate2}
              accessibilityLabel="Translate"
              busy={translating}
              onPress={() => {
                setTranslating(true);
                setTimeout(() => setTranslating(false), 1200);
              }}
            />
            <EngagementAction
              icon={RiBarChartBoxLine}
              accessibilityLabel="Insights"
              onPress={() => {}}
            />
          </>
        }
      >
        <EngagementAction
          icon={RiHeart3Line}
          activeIcon={RiHeart3Fill}
          accessibilityLabel="Like"
          count={liked ? 1300 : 1299}
          active={liked}
          tone="error"
          popOnActivate
          rollCount
          onPress={() => setLiked((value) => !value)}
        />
        <EngagementAction
          icon={RiChat3Line}
          accessibilityLabel="Reply"
          count={42}
          onPress={() => {}}
        />
        <EngagementAction
          icon={RiRepeat2Line}
          accessibilityLabel="Repost"
          count={reposted ? 8 : 7}
          active={reposted}
          tone="success"
          onPress={() => setReposted((value) => !value)}
        />
        <EngagementAction icon={RiUpload2Line} accessibilityLabel="Share" onPress={() => {}} />
      </EngagementBar>
    </View>
  );
}

/**
 * A post's bar: the like pops and rolls its count, repost and save paint in
 * their tones, and translate spins while it works. Press feedback is the
 * tone's tint; on the web, hover paints the same tint.
 */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Post />,
};

function Vote() {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const score = 12 + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0);
  return (
    <EngagementBar>
      <EngagementGroup>
        <EngagementAction
          icon={RiArrowUpSLine}
          accessibilityLabel="Upvote"
          count={score}
          active={vote === 'up'}
          rollCount
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 0 }}
          onPress={() => setVote((value) => (value === 'up' ? null : 'up'))}
        />
        <EngagementAction
          icon={RiArrowDownSLine}
          accessibilityLabel="Downvote"
          active={vote === 'down'}
          tone="error"
          hitSlop={{ top: 5, bottom: 5, left: 0, right: 5 }}
          onPress={() => setVote((value) => (value === 'down' ? null : 'down'))}
        />
      </EngagementGroup>
    </EngagementBar>
  );
}

/**
 * An up/down vote reads as one control, so its two actions share one pill.
 * Neither arrow's hit slop grows toward the other, or it would swallow its taps.
 */
export const VotePill: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Vote />,
};
