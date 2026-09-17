import type { ActivityRing } from '../../src/chart-cards/ActivityRingsCard';
import type { ActivityDay } from '../../src/chart-cards/MostActiveDaysCard';
import type { SleepMetric } from '../../src/chart-cards/SleepScoreCard';
import type { StepsPoint } from '../../src/chart-cards/StepsCard';
import {
  RiAlarmWarningLine,
  RiArrowLeftRightLine,
  RiAsterisk,
  RiCapsuleFill,
  RiDropLine,
  RiHeartPulseFill,
  RiHomeHeartLine,
  RiHotelBedLine,
  RiLogoutBoxRLine,
  RiLungsFill,
  RiMenLine,
  RiMoonClearFill,
  RiPrinterLine,
  RiStethoscopeLine,
  RiTestTubeFill,
  RiUserHeartLine,
  RiWalkLine,
} from '../../src/icons/remix';
import type { ImportantAlertsCardAlert } from '../../src/important-alerts-card';
import type { PatientInfoCardDetail } from '../../src/patient-info-card';
import type { ChipHue } from '../../src/chip';
import type { DataTableRowActionItem, DataTableSelectOption } from '../../src/data-table';
import { PHOTO_PEOPLE, makeRng } from '../shared/dashboard';

/**
 * Demo data for the medical profile template — the cards' constants and the
 * patients table's seeded roster, all deterministic (no Math.random /
 * Date.now). The sidebar, header and photo people are the dashboard family's
 * shared demo data (`../shared/dashboard`).
 */

// ---------------------------------------------------------------------------
//  Cards
// ---------------------------------------------------------------------------

export const YEAR = 2026;
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Today — later days have no activity yet. */
export const TODAY: ActivityDay = { month: 6, day: 10 };

export const PATIENT = {
  name: 'Maya Collins',
  initials: 'M',
  details: [
    { icon: RiAsterisk, label: 'Date of Birth', value: '28 July, 1997' },
    { icon: RiMenLine, label: 'Gender', value: 'Male' },
    { icon: RiDropLine, label: 'Blood Type', value: 'A rh+' },
    { icon: RiStethoscopeLine, label: 'GP Doctor', value: 'Mattheus Clarkson' },
  ] satisfies PatientInfoCardDetail[],
};

function hash(seed: number) {
  let h = Math.imul(seed ^ 0x9e3779b9, 2654435761);
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Ring fill fraction for a day: 0 Move, 1 Exercise, 2 Running. */
export function ringPct(month: number, day: number, ring: number) {
  const h = hash(month * 1000 + day * 10 + ring);
  if (ring === 0) return 0.18 + h * h * 0.77;
  return 0.3 + h * 0.66;
}

/** The calendar's mini rings; days after today have no data. */
export function dayRings({ month, day }: ActivityDay): number[] | null {
  if (month > TODAY.month || (month === TODAY.month && day > TODAY.day)) return null;
  return [0, 1, 2].map((ring) => ringPct(month, day, ring));
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** The Figma defaults, when no day is picked. */
const DEFAULT_RINGS: ActivityRing[] = [
  { label: 'Move', value: '1,592 kcal', goalPct: 82 },
  { label: 'Exercise', value: '1h 45m', goalPct: 60 },
  { label: 'Running', value: '5.2 km', goalPct: 75 },
];

/** The Activity card's title and rings. */
export function activityFor(selected: ActivityDay | null): { title: string; rings: ActivityRing[] } {
  if (!selected) return { title: 'Activity', rings: DEFAULT_RINGS };
  const move = ringPct(selected.month, selected.day, 0);
  const exercise = ringPct(selected.month, selected.day, 1);
  const running = ringPct(selected.month, selected.day, 2);
  return {
    title: `Activity for ${MONTHS[selected.month]} ${selected.day}, ${YEAR}`,
    rings: [
      { label: 'Move', value: `${Math.round(500 + move * 1500).toLocaleString('en-US')} kcal`, goalPct: Math.round(move * 100) },
      { label: 'Exercise', value: formatDuration(Math.round(20 + exercise * 130)), goalPct: Math.round(exercise * 100) },
      { label: 'Running', value: `${(1 + running * 5.5).toFixed(1)} km`, goalPct: Math.round(running * 100) },
    ],
  };
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** A week of step counts, `offset` weeks from 29 Jun. */
export function stepsWeek(offset: number): StepsPoint[] {
  return DAYS.map((label, i) => {
    let value = Math.round((1800 + hash(offset * 100 + i) * 7000) / 100) * 100;
    if (offset === 0 && label === 'Thu') value = Math.round((value * 0.8) / 100) * 100;
    if (offset === 0 && label === 'Wed') value = Math.round((value * 0.85) / 100) * 100;
    return { label, value };
  });
}

/** `"29 Jun - 5 Jul"`. */
export function weekLabel(offset: number) {
  const start = new Date(YEAR, 5, 29);
  start.setDate(start.getDate() + offset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const abbr = (d: Date) => MONTHS[d.getMonth()]!.slice(0, 3);
  return `${start.getDate()} ${abbr(start)} - ${end.getDate()} ${abbr(end)}`;
}

export const SLEEP_METRICS: SleepMetric[] = [
  { label: 'Duration', detail: '7h 50m', score: 49, max: 50 },
  { label: 'Bedtime', detail: '20m earlier', score: 29, max: 30 },
  { label: 'Interruptions', detail: '5m wake up', score: 20, max: 20 },
];

export const ALERTS: ImportantAlertsCardAlert[] = [
  {
    icon: RiHeartPulseFill,
    tone: 'rose',
    title: 'High Heart rate',
    description:
      'Your heart rate rose above 120 BPM while you seemed to be inactive for 10 minutes starting at 8:59 AM, 12 June.',
    date: 'June, 12',
  },
  {
    icon: RiAsterisk,
    tone: 'amber',
    title: 'Medical ID',
    description: 'Your emergency contact and allergy information was updated in your Medical ID.',
    date: 'June, 9',
  },
  {
    icon: RiTestTubeFill,
    tone: 'emerald',
    title: 'Lab results ready',
    description:
      'Your latest blood panel ordered by Dr. Mattheus Clarkson is back — cholesterol and glucose are within the normal range.',
    date: 'June, 9',
  },
  {
    icon: RiCapsuleFill,
    tone: 'blue',
    title: 'Medication reminder',
    description:
      'You missed your 9:00 AM dose of Metoprolol. Take it as soon as possible unless your next dose is near.',
    date: 'June, 8',
  },
  {
    icon: RiMoonClearFill,
    tone: 'purple',
    title: 'Irregular sleep',
    description:
      'Your bedtime shifted by more than 2 hours on 3 of the last 7 nights, which can affect your sleep score.',
    date: 'June, 6',
  },
  {
    icon: RiLungsFill,
    tone: 'teal',
    title: 'Low blood oxygen',
    description: 'Your blood oxygen dipped to 93% for a short period during sleep on the night of 4 June.',
    date: 'June, 5',
  },
];

// ---------------------------------------------------------------------------
//  Patients — a seeded roster (mulberry32, seed 7, 540 rows)
// ---------------------------------------------------------------------------

export type StatusHue = Extract<ChipHue, 'lime' | 'yellow' | 'rose' | 'cyan' | 'blue'>;
export interface PatientStatus {
  label: string;
  hue: StatusHue;
}

export const STATUSES: PatientStatus[] = [
  { label: 'Stable', hue: 'lime' },
  { label: 'Under observation', hue: 'yellow' },
  { label: 'Critical', hue: 'rose' },
  { label: 'Recovering', hue: 'cyan' },
  { label: 'In treatment', hue: 'blue' },
];

export const CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Fracture', 'Post-op', 'Pregnancy', 'Allergy', 'Migraine'];

const DOCTORS = ['Dr. Clarkson', 'Dr. Vaccaro', 'Dr. Rhiel', 'Dr. Bator', 'Dr. Torff'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type Admission = 'inpatient' | 'outpatient' | 'discharged' | 'emergency';

export const ADMISSIONS: (DataTableSelectOption & { value: Admission })[] = [
  { value: 'inpatient', label: 'Inpatient', icon: RiHotelBedLine },
  { value: 'outpatient', label: 'Outpatient', icon: RiWalkLine },
  { value: 'discharged', label: 'Discharged', icon: RiHomeHeartLine },
  { value: 'emergency', label: 'Emergency', icon: RiAlarmWarningLine },
];

export const MORE_ACTIONS: readonly DataTableRowActionItem[] = [
  { icon: RiUserHeartLine, label: 'Assign care team' },
  { icon: RiPrinterLine, label: 'Print summary' },
  { icon: RiArrowLeftRightLine, label: 'Transfer ward' },
  { icon: RiLogoutBoxRLine, label: 'Discharge patient' },
];

export interface Patient {
  id: string;
  name: string;
  avatar?: string | number;
  initialsColor?: 'neutral' | 'blue';
  admission: Admission;
  status: PatientStatus;
  conditions: string[];
  doctor: string;
  nextAppointment: string;
  /** `nextAppointment` as a timestamp, for sorting. */
  appointmentTs: number;
}

const FIRST_NAMES = ['Marcus', 'Cheyenne', 'Alfredo', 'Talan', 'Roger', 'Cristofer', 'Emery', 'Kadin', 'Nolan', 'Ruben', 'Skylar', 'Hanna', 'Corey', 'Miracle', 'Zaire', 'Cooper', 'Leilani', 'Alena', 'Terry', 'Jaxson', 'Kaiya', 'Omar', 'Phoenix', 'Adison', 'Gretchen', 'Nova', 'Ellis', 'Dulce', 'Wilson'];
const LAST_NAMES = ['Culhane', 'Herwitz', 'Septimus', 'Bergson', 'Curtis', 'Vetrovs', 'Rhiel', 'Dokidis', 'Kenter', 'Stanton', 'Baptista', 'Workman', 'Torff', 'Calzoni', 'Rosser', 'Geidt', 'Bator', 'Vaccaro', 'Lipshutz', 'Botosh'];

export const PATIENTS: Patient[] = (() => {
  const rng = makeRng(7);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rng() * arr.length)]!;
  const rows = Array.from({ length: 540 }, (_, i): Patient => {
    const status = pick(STATUSES);
    const admission: Admission =
      status.label === 'Critical'
        ? pick(['inpatient', 'emergency'] as const)
        : pick(['inpatient', 'outpatient', 'discharged'] as const);
    const conditionCount = 1 + Math.floor(rng() * 2);
    const conditions = [...new Set(Array.from({ length: conditionCount }, () => pick(CONDITIONS)))];
    const monthIndex = Math.floor(rng() * MONTH_SHORT.length);
    const day = 1 + Math.floor(rng() * 28);
    const doctor = pick(DOCTORS);
    const base = {
      id: String(i),
      admission,
      status,
      conditions,
      doctor,
      nextAppointment: `${MONTH_SHORT[monthIndex]} ${String(day).padStart(2, '0')}, 2026`,
      appointmentTs: Date.UTC(2026, monthIndex, day),
    };
    const person = PHOTO_PEOPLE[i];
    if (person) return { ...base, name: person.name, avatar: person.avatar };
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    return { ...base, name, initialsColor: rng() > 0.5 ? 'blue' : 'neutral' };
  });
  // The first two rows lead with a "Recovering" and an "In treatment" patient.
  rows[0] = { ...rows[0]!, status: STATUSES[3]!, admission: 'outpatient' };
  rows[1] = { ...rows[1]!, status: STATUSES[4]!, admission: 'inpatient' };
  return rows;
})();

/** Rows 1 and 2 start selected. */
export const DEFAULT_SELECTED = ['1', '2'];
