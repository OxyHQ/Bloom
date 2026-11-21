import { makeMutable } from 'react-native-reanimated';
import { RiTrophyLine } from '@oxy.so/bloom/icons';
import { Meter, MeterRing, StatBar } from '@oxy.so/bloom/stat-bar';
import { withAlpha } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const stop = () => {};
const share = makeMutable(0.5);

const bars: ParityCase[] = [
  {
    name: 'Meter',
    language: () => toElement(L.Meter(0.4).label('Charge')),
    bloom: () => <Meter value={0.4} accessibilityLabel="Charge" />,
  },
  {
    name: 'Meter of a total, with its reading',
    language: () => toElement(L.Meter(3, 5).valueText('3 of 5').label('Steps').testID('steps')),
    bloom: () => (
      <Meter value={3} max={5} valueText="3 of 5" accessibilityLabel="Steps" testID="steps" />
    ),
  },
  {
    name: 'ProgressBar',
    language: () => toElement(L.ProgressBar(30, 100).label('Upload')),
    bloom: () => <Meter value={30} max={100} role="progressbar" accessibilityLabel="Upload" />,
  },
  {
    name: 'ProgressBar, indeterminate',
    language: () => toElement(L.ProgressBar(0).indeterminate().label('Transcoding')),
    bloom: () => (
      <Meter value={0} role="progressbar" indeterminate accessibilityLabel="Transcoding" />
    ),
  },
  {
    name: 'Meter, decorative',
    language: () => toElement(L.Meter(0.6).decorative()),
    bloom: () => <Meter value={0.6} decorative />,
  },
  {
    name: 'Meter tinted, thick, squared, easing, framed',
    language: () =>
      toElement(
        L.Meter(0.25)
          .tint('success')
          .trackTint('muted/20')
          .thickness('10')
          .barCorner('2xs')
          .fillDuration('slow')
          .frame({ width: '96' })
          .label('Battery'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <Meter
            value={0.25}
            fill={c.success}
            track={withAlpha(c.textSecondary, 0.2)}
            height={10}
            radius={2}
            transitionMs={300}
            style={{ width: 96 }}
            accessibilityLabel="Battery"
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'Meter, revealed',
    language: () => toElement(L.Meter(0.8).reveal({ visible: true, duration: 600 }).label('Score')),
    bloom: () => (
      <Meter value={0.8} reveal={{ visible: true, duration: 600 }} accessibilityLabel="Score" />
    ),
  },
];

const rings: ParityCase[] = [
  {
    name: 'MeterRing',
    language: () => toElement(L.MeterRing(0.7).label('Score')),
    bloom: () => <MeterRing value={0.7} accessibilityLabel="Score" />,
  },
  ...ENUMS.meterCap.map((cap) => ({
    name: `MeterRing cap ${cap}`,
    language: () =>
      toElement(L.MeterRing(7, 10).size('80').thickness('6').cap(cap).label('Rating')),
    bloom: () => (
      <MeterRing value={7} max={10} size={80} thickness={6} cap={cap} accessibilityLabel="Rating" />
    ),
  })),
  {
    name: 'MeterRing with content, tinted, over a backdrop',
    language: () =>
      toElement(
        L.MeterRing(0.9)
          .content(L.Text('9'))
          .tint('white')
          .trackTint('white/30')
          .backdrop('black/half')
          .valueText('9 of 10')
          .label('Match'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <MeterRing
            value={0.9}
            fill={c.white}
            track={withAlpha(c.white, 0.3)}
            backdrop={withAlpha(c.black, 0.5)}
            valueText="9 of 10"
            accessibilityLabel="Match"
          >
            <Text>9</Text>
          </MeterRing>
        )}
      </Themed>
    ),
  },
  {
    name: 'ProgressRing that stops what it measures',
    language: () =>
      toElement(L.ProgressRing(0.3).onStop(stop, 'Stop downloading').label('Download')),
    bloom: () => (
      <MeterRing
        value={0.3}
        role="progressbar"
        onStop={stop}
        stopLabel="Stop downloading"
        accessibilityLabel="Download"
      />
    ),
  },
  {
    name: 'ProgressRing, indeterminate, easing',
    language: () =>
      toElement(L.ProgressRing(0).indeterminate().fillDuration('fast').label('Preparing')),
    bloom: () => (
      <MeterRing
        value={0}
        role="progressbar"
        indeterminate
        transitionMs={150}
        accessibilityLabel="Preparing"
      />
    ),
  },
  {
    name: 'MeterRing, decorative, following a shared value',
    language: () => toElement(L.MeterRing(0).decorative().progress(share)),
    bloom: () => <MeterRing value={0} decorative progress={share} />,
  },
];

const labelled: ParityCase[] = [
  {
    name: 'StatBar',
    language: () => toElement(L.StatBar('Level', 40, 100)),
    bloom: () => <StatBar label="Level" value={40} max={100} />,
  },
  {
    name: 'StatBar with its range, a trophy, tinted and thick',
    language: () =>
      toElement(
        L.StatBar('Points', 720, 1000)
          .rangeLabels('0', '1,000')
          .trailing(L.Icon(RiTrophyLine).size('sm'))
          .tint('warning')
          .trackTint('border')
          .thickness('10')
          .testID('points'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <StatBar
            label="Points"
            value={720}
            max={1000}
            minLabel="0"
            maxLabel="1,000"
            icon={<RiTrophyLine size="sm" fill={c.text} />}
            fillColor={c.warning}
            trackColor={c.border}
            height={10}
            testID="points"
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'SplitBar',
    language: () => toElement(L.SplitBar('Inflow', 62, '$1.2k', '$740')),
    bloom: () => (
      <StatBar variant="split" label="Inflow" percent={62} leftValue="$1.2k" rightValue="$740" />
    ),
  },
  {
    name: 'SplitBar tinted, padded',
    language: () =>
      toElement(L.SplitBar('Wins', 30, '3', '7').tint('info').trackTint('error').padding('md')),
    bloom: () => (
      <Themed>
        {(c) => (
          <StatBar
            variant="split"
            label="Wins"
            percent={30}
            leftValue="3"
            rightValue="7"
            fillColor={c.info}
            trackColor={c.error}
            style={{ paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12 }}
          />
        )}
      </Themed>
    ),
  },
];

export const STAT_BAR_CASES: readonly ParityCase[] = [...bars, ...rings, ...labelled];
