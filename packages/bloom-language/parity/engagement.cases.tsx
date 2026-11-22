import { EngagementAction, EngagementBar, EngagementGroup } from '@oxy.so/bloom/engagement-bar';
import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiBookmarkFill,
  RiBookmarkLine,
  RiChat3Line,
  RiHeart3Fill,
  RiHeart3Line,
  RiTranslate2,
} from '@oxy.so/bloom/icons';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const compact = (count: number) => (count >= 1000 ? `${(count / 1000).toFixed(1)}K` : `${count}`);
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 4 };

/** A post's actions as Mention writes them: a vote pill, a reply, and saves and a translation trailing. */
const post = (
  orientation: (typeof ENUMS.axis)[number],
  tone: (typeof ENUMS.engagementBarTone)[number],
) => ({
  name: `ActionBar ${orientation}, ${tone}: a vote pill, trailing actions`,
  language: () =>
    toElement(
      L.ActionBar(
        L.ActionGroup(
          L.Action(RiArrowUpSLine, 'Upvote', { rollCount: true, hitSlop: HIT_SLOP })
            .count(1520)
            .active(true)
            .onPress(press),
          L.Action(RiArrowDownSLine, 'Downvote').tint('error').onPress(press),
        ),
        L.Action(RiChat3Line, 'Reply').count(0).onPress(press),
      )
        .trailing(
          L.Action(RiBookmarkLine, 'Save', { activeIcon: RiBookmarkFill }).count(4).onPress(press),
          L.Action(RiTranslate2, 'Translate').active(true).onPress(press),
        )
        .countFormat(compact)
        .axis(orientation)
        .tint(tone),
    ),
  bloom: () => (
    <EngagementBar
      formatCount={compact}
      orientation={orientation}
      tone={tone}
      trailing={
        <>
          <EngagementAction
            icon={RiBookmarkLine}
            activeIcon={RiBookmarkFill}
            accessibilityLabel="Save"
            count={4}
            onPress={press}
          />
          <EngagementAction
            icon={RiTranslate2}
            accessibilityLabel="Translate"
            active
            onPress={press}
          />
        </>
      }
    >
      <EngagementGroup>
        <EngagementAction
          icon={RiArrowUpSLine}
          accessibilityLabel="Upvote"
          count={1520}
          active
          rollCount
          hitSlop={HIT_SLOP}
          onPress={press}
        />
        <EngagementAction
          icon={RiArrowDownSLine}
          accessibilityLabel="Downvote"
          tone="error"
          onPress={press}
        />
      </EngagementGroup>
      <EngagementAction icon={RiChat3Line} accessibilityLabel="Reply" count={0} onPress={press} />
    </EngagementBar>
  ),
});

export const ENGAGEMENT_CASES: ParityCase[] = [
  ...ENUMS.axis.flatMap((orientation) =>
    ENUMS.engagementBarTone.map((tone) => post(orientation, tone)),
  ),
  {
    name: 'ActionBar a video’s: vertical, large, over artwork, zero counts shown',
    language: () =>
      toElement(
        L.ActionBar(
          L.Action(RiHeart3Line, 'Like', { activeIcon: RiHeart3Fill }).count(0).onPress(press),
          L.Action(RiChat3Line, 'Reply').count(12).onPress(press),
        )
          .axis('vertical')
          .size('lg')
          .tint('onImage')
          .showZeroCounts()
          .countFormat(compact),
      ),
    bloom: () => (
      <EngagementBar
        orientation="vertical"
        size="lg"
        tone="onImage"
        showZeroCounts
        formatCount={compact}
      >
        <EngagementAction
          icon={RiHeart3Line}
          activeIcon={RiHeart3Fill}
          accessibilityLabel="Like"
          count={0}
          onPress={press}
        />
        <EngagementAction
          icon={RiChat3Line}
          accessibilityLabel="Reply"
          count={12}
          onPress={press}
        />
      </EngagementBar>
    ),
  },
];

/** A busy action's mark turns while it works: Jest compares it as it mounts, the story leaves it out. */
export const ENGAGEMENT_CASES_MOVING: ParityCase[] = [
  {
    name: 'ActionBar a busy action',
    language: () =>
      toElement(L.ActionBar(L.Action(RiTranslate2, 'Translate', { busy: true }).onPress(press))),
    bloom: () => (
      <EngagementBar>
        <EngagementAction icon={RiTranslate2} accessibilityLabel="Translate" busy onPress={press} />
      </EngagementBar>
    ),
  },
];
