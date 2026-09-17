import React, { useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { ActivityRingsCard } from '../../src/chart-cards/ActivityRingsCard';
import { MostActiveDaysCard, type ActivityDay } from '../../src/chart-cards/MostActiveDaysCard';
import { SleepScoreCard } from '../../src/chart-cards/SleepScoreCard';
import { StepsCard } from '../../src/chart-cards/StepsCard';
import { RiAsterisk } from '../../src/icons/remix';
import { ImportantAlertsCard } from '../../src/important-alerts-card';
import { PatientInfoCard } from '../../src/patient-info-card';
import { BREAKPOINTS } from '../../src/styles/breakpoints';
import { DashboardShell } from '../shared/dashboard';
import {
  ALERTS,
  PATIENT,
  SLEEP_METRICS,
  YEAR,
  activityFor,
  dayRings,
  stepsWeek,
  weekLabel,
} from './demo-data';
import { PatientsTable } from './PatientsTable';

const WEEK_RANGE = weekLabel(0);

/**
 * The medical profile template: the floating sidebar with the reveal drawer
 * below `lg`, the breadcrumb + title header, six 330px cards — one column,
 * two from `md`, three from `xl` — and the patients table.
 *
 * Picking a day in Most active days swaps the Activity card to that day's
 * rings; it opens on today, Jul 10 2026.
 */
export function MedicalProfileTemplate() {
  const { width } = useWindowDimensions();
  const columns = width >= BREAKPOINTS.xl ? 3 : width >= BREAKPOINTS.md ? 2 : 1;
  const [selectedDay, setSelectedDay] = useState<ActivityDay | null>({ month: 6, day: 10 });
  const [weekOffset, setWeekOffset] = useState(0);

  const steps = useMemo(() => stepsWeek(weekOffset), [weekOffset]);
  const activity = useMemo(() => activityFor(selectedDay), [selectedDay]);

  const cards = [
    <PatientInfoCard key="patient" testID="medical-patient" name={PATIENT.name} initials={PATIENT.initials} details={PATIENT.details} />,
    <StepsCard
      key="steps"
      testID="medical-steps"
      data={steps}
      range={weekLabel(weekOffset)}
      onPrevRange={() => setWeekOffset((o) => o - 1)}
      onNextRange={() => setWeekOffset((o) => o + 1)}
    />,
    <SleepScoreCard key="sleep" testID="medical-sleep" metrics={SLEEP_METRICS} range={WEEK_RANGE} />,
    <MostActiveDaysCard
      key="days"
      testID="medical-days"
      year={YEAR}
      initialMonth={6}
      headline={32459}
      rings={dayRings}
      selectedDay={selectedDay}
      onSelectDay={setSelectedDay}
    />,
    <ActivityRingsCard key="activity" testID="medical-activity" title={activity.title} rings={activity.rings} />,
    <ImportantAlertsCard key="alerts" testID="medical-alerts" alerts={ALERTS} count={12} rangeLabel={WEEK_RANGE} />,
  ];

  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < cards.length; i += columns) rows.push(cards.slice(i, i + columns));

  return (
    <DashboardShell testID="medical" selected="medical" title="Medical Profile" crumbIcon={RiAsterisk} primaryAction="File a report">
        <View style={{ width: '100%', gap: 16 }} testID="medical-cards">
          {rows.map((row, r) => (
            <View key={`row-${r}`} style={{ width: '100%', flexDirection: 'row', gap: 16 }}>
              {row.map((card, c) => (
                <View key={`cell-${r}-${c}`} style={{ flex: 1, flexBasis: 0, minWidth: 0 }}>
                  {card}
                </View>
              ))}
            </View>
          ))}
        </View>
        <PatientsTable testID="medical-patients" />
    </DashboardShell>
  );
}
