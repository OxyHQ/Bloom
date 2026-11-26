import { RiHeart3Line, RiWifiLine } from '@oxy.so/bloom/icons';
import { ImportantAlertsCard } from '@oxy.so/bloom/important-alerts-card';
import { PatientInfoCard } from '@oxy.so/bloom/patient-info-card';

import * as L from '../src/__tests__/support/language.generated';
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
];
