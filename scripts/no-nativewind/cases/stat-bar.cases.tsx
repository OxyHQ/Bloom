import { Meter, MeterRing, StatBar } from '@bloom/stat-bar';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Meter plain': () => <Meter value={0.4} accessibilityLabel="Progress" testID="meter" />,
  'Meter loaded': () => (
    <Meter
      value={3}
      max={4}
      height={8}
      radius={2}
      width={120}
      fill="#5433eb"
      track="#eef0f1"
      transitionMs={200}
      role="progressbar"
      valueText="3 of 4"
      accessibilityLabel="Progress"
      style={{ marginTop: 4 }}
      fillStyle={{ borderRadius: 9999, backgroundColor: '#121212' }}
      testID="meter"
    />
  ),
  'Meter decorative': () => <Meter decorative value={0.7} testID="meter" />,
  'Meter revealed': () => (
    <Meter value={0.5} reveal={{ visible: true }} accessibilityLabel="Reveal" testID="meter" />
  ),
  'MeterRing plain': () => <MeterRing value={0.6} accessibilityLabel="Ring" testID="ring" />,
  'StatBar progress': () => (
    <StatBar label="Storage" value={30} max={100} minLabel="0" maxLabel="100" testID="bar" />
  ),
  'StatBar split': () => (
    <StatBar
      variant="split"
      label="Votes"
      percent={62}
      leftValue="62%"
      rightValue="38%"
      height={10}
      testID="bar"
    />
  ),
};
