import { RiHeart3Line, RiWifiLine } from '@oxy.so/bloom/icons';
import { ImportantAlertsCard } from '@oxy.so/bloom/important-alerts-card';
import { PatientInfoCard } from '@oxy.so/bloom/patient-info-card';
import { RecentHiresCard } from '@oxy.so/bloom/recent-hires-card';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const ALERTS = [
  {
    icon: RiHeart3Line,
    tone: 'rose' as const,
    title: 'High heart rate',
    description: 'Your heart rate rose above 120 BPM while you seemed to be inactive.',
    date: 'June, 12',
  },
  {
    icon: RiWifiLine,
    tone: 'teal' as const,
    title: 'Device offline',
    description: 'Your watch has not synced since this morning.',
    date: 'June, 9',
  },
];
const DETAILS = [
  { icon: RiHeart3Line, label: 'Blood type', value: 'A+' },
  { icon: RiWifiLine, label: 'Doctor', value: 'Dr. Ana Lima' },
];
const HIRES = [
  { id: 'a', name: 'Ana Lima', joined: 'Joined May 2', role: 'Designer' },
  { id: 'b', name: 'Idris Kalu', joined: 'Joined May 9', role: 'Engineer', initials: 'IK' },
  { id: 'c', name: 'Nora Vance', joined: 'Joined May 12', role: 'Operations' },
  { id: 'd', name: 'Teo Nagy', joined: 'Joined May 20', role: 'Sales' },
];

export const DASHBOARD_CARD_CASES: ParityCase[] = [
  {
    name: 'ImportantAlertsCard',
    language: () =>
      toElement(L.ImportantAlertsCard(ALERTS, 2, { rangeLabel: 'This week', height: '360' })),
    bloom: () => (
      <ImportantAlertsCard alerts={ALERTS} count={2} rangeLabel="This week" height={360} />
    ),
  },
  {
    name: 'PatientInfoCard',
    language: () =>
      toElement(L.PatientInfoCard('Ana Lima', DETAILS, { initials: 'AL', onAddPhoto: press })),
    bloom: () => (
      <PatientInfoCard name="Ana Lima" details={DETAILS} initials="AL" onAddPhoto={press} />
    ),
  },
  {
    name: 'PatientInfoCard no add photo, a height',
    language: () =>
      toElement(L.PatientInfoCard('Ana Lima', DETAILS, { hideAddPhoto: true, height: '320' })),
    bloom: () => <PatientInfoCard name="Ana Lima" details={DETAILS} hideAddPhoto height={320} />,
  },
  {
    name: 'RecentHiresCard',
    language: () =>
      toElement(
        L.RecentHiresCard(HIRES, 12, {
          teamLabel: 'Design',
          onTeamPress: press,
          onPreviousPress: press,
          onNextPress: press,
          previousDisabled: true,
        }),
      ),
    bloom: () => (
      <RecentHiresCard
        hires={HIRES}
        count={12}
        teamLabel="Design"
        onTeamPress={press}
        onPreviousPress={press}
        onNextPress={press}
        previousDisabled
      />
    ),
  },
  ...(['auto', '384'] as const).map((height) => ({
    name: `RecentHiresCard height ${height}`,
    language: () => toElement(L.RecentHiresCard(HIRES, '4', { height })),
    bloom: () => (
      <RecentHiresCard hires={HIRES} count="4" height={height === 'auto' ? height : 384} />
    ),
  })),
];
