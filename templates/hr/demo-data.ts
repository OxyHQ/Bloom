import type {
  BarListTab,
  ComboPoint,
  ComboRange,
  ComboSeries,
  RadarPoint,
  RadarRange,
  RadarSeries,
  StageBar,
  StageBarsRange,
} from '../../src/chart-cards';
import {
  RiChat3Line,
  RiFilePaper2Line,
  RiPhoneLine,
  RiShakeHandsLine,
  RiTeamLine,
  RiTimeLine,
  RiUserAddLine,
  RiUserMinusLine,
  RiUserSearchLine,
} from '../../src/icons/remix';
import type { StatCardsItem } from '../../src/stat-cards';
import type { ChipHue } from '../../src/chip';
import type { DataTableSelectOption } from '../../src/data-table';
import { MONTHS, PHOTO_PEOPLE, makeRng } from '../shared/dashboard';

/**
 * Demo data for the HR Management template. The numbers agree with each
 * other: headcount matches the KPI row, the pipeline's hires the combo's bars.
 */

// ---------------------------------------------------------------------------
//  KPI cards
// ---------------------------------------------------------------------------

export const HR_STATS: StatCardsItem[] = [
  { icon: RiTeamLine, label: 'Employees', value: '248', delta: '+4.2%', deltaColor: 'lime' },
  { icon: RiUserSearchLine, label: 'Open roles', value: '12', delta: '+8.3%', deltaColor: 'neutral' },
  { icon: RiTimeLine, label: 'Time to hire', value: '24 days', delta: '-8.3%', deltaColor: 'lime' },
  { icon: RiUserMinusLine, label: 'Attrition', value: '3.8%', delta: '-0.6%', deltaColor: 'lime' },
];

// ---------------------------------------------------------------------------
//  Hiring pipeline
// ---------------------------------------------------------------------------

const pipelineStages = (values: [number, number, number, number, number]): StageBar[] => [
  { label: 'Applications', value: values[0], icon: RiFilePaper2Line },
  { label: 'Screens', value: values[1], icon: RiPhoneLine },
  { label: 'Interviews', value: values[2], icon: RiChat3Line },
  { label: 'Offers', value: values[3], icon: RiShakeHandsLine },
  { label: 'Hires', value: values[4], icon: RiUserAddLine },
];

export const PIPELINE_RANGES: StageBarsRange[] = [
  { id: '30d', label: 'Last 30 days', stages: pipelineStages([412, 156, 68, 21, 12]), delta: 0.062 },
  { id: '90d', label: 'Last 90 days', stages: pipelineStages([1_240, 462, 210, 64, 38]), delta: 0.048 },
  { id: 'year', label: 'This year', stages: pipelineStages([4_680, 1_710, 790, 244, 141]), delta: -0.015 },
];

// ---------------------------------------------------------------------------
//  Team engagement
// ---------------------------------------------------------------------------

const engagement = (values: [number, number, number, number, number, number]): RadarPoint[] => [
  { label: 'Growth', score: values[0] },
  { label: 'Compensation', score: values[1] },
  { label: 'Culture', score: values[2] },
  { label: 'Management', score: values[3] },
  { label: 'Balance', score: values[4] },
  { label: 'Tools', score: values[5] },
];

export const ENGAGEMENT_SERIES: RadarSeries[] = [{ key: 'score', label: 'Score' }];

export const ENGAGEMENT_RANGES: RadarRange[] = [
  { id: 'q3', label: 'Q3 survey', data: engagement([84, 71, 88, 79, 66, 91]) },
  { id: 'q2', label: 'Q2 survey', data: engagement([78, 69, 85, 74, 58, 86]) },
  { id: 'q1', label: 'Q1 survey', data: engagement([74, 72, 81, 70, 62, 79]) },
];

// ---------------------------------------------------------------------------
//  Hires vs. attrition
// ---------------------------------------------------------------------------

const growthRows = (hires: number[], attrition: number[]): ComboPoint[] =>
  hires.map((value, i) => ({ label: MONTHS[i]!, hires: value, attrition: attrition[i]! }));

export const HIRES_BAR: ComboSeries = { key: 'hires', label: 'Hires' };

/** `color: var(--color-chart-3)` (pink) — the template resolves the tone on the theme. */
export const attritionLine = (color: string, activeColor: string): ComboSeries => ({
  key: 'attrition',
  label: 'Attrition',
  color,
  activeColor,
  format: (n: number) => `${Math.round(n * 10) / 10}%`,
});

export const GROWTH_RANGES: ComboRange[] = [
  {
    id: 'year',
    label: 'This year',
    data: growthRows(
      [8, 11, 14, 9, 12, 16, 10, 13, 15, 12, 14, 12],
      [5.2, 4.8, 4.6, 4.9, 4.4, 4.1, 4.3, 4.0, 3.9, 4.1, 3.8, 3.8],
    ),
    delta: 0.084,
  },
  {
    id: 'h2',
    label: 'Last 6 months',
    data: growthRows([10, 13, 15, 12, 14, 12], [4.3, 4.0, 3.9, 4.1, 3.8, 3.8]).map((row, i) => ({
      ...row,
      label: MONTHS[i + 6]!,
    })),
    delta: 0.061,
  },
  {
    id: 'prev',
    label: 'Last year',
    data: growthRows(
      [6, 8, 10, 7, 9, 12, 8, 10, 11, 9, 11, 10],
      [6.1, 5.8, 5.6, 5.9, 5.4, 5.2, 5.4, 5.1, 5.0, 5.2, 4.9, 5.0],
    ),
    delta: -0.032,
  },
];

// ---------------------------------------------------------------------------
//  Team makeup
// ---------------------------------------------------------------------------

export const TEAM_TABS: BarListTab[] = [
  {
    id: 'departments',
    label: 'Departments',
    items: [
      { label: 'Engineering', value: 96 },
      { label: 'Sales', value: 44 },
      { label: 'Support', value: 38 },
      { label: 'Marketing', value: 26 },
      { label: 'Design', value: 22 },
      { label: 'Operations', value: 14 },
      { label: 'People', value: 8 },
    ],
  },
  {
    id: 'sources',
    label: 'Hiring sources',
    items: [
      { label: 'Referrals', value: 52 },
      { label: 'LinkedIn', value: 38 },
      { label: 'Job boards', value: 24 },
      { label: 'Inbound', value: 17 },
      { label: 'Agencies', value: 10 },
    ],
  },
  {
    id: 'locations',
    label: 'Locations',
    items: [
      { label: 'Remote', value: 84 },
      { label: 'Berlin', value: 62 },
      { label: 'London', value: 48 },
      { label: 'New York', value: 34 },
      { label: 'Singapore', value: 20 },
    ],
  },
];

// ---------------------------------------------------------------------------
//  Employees table — 248 rows from a seeded PRNG.
// ---------------------------------------------------------------------------

export interface Department {
  label: string;
  color: ChipHue;
}

export type WorkStatus = 'active' | 'leave' | 'contract';

export interface Employee {
  id: string;
  name: string;
  avatar?: string | number;
  initialsColor: 'neutral' | 'blue';
  role: string;
  department: Department;
  status: WorkStatus;
  salary: number;
  started: string;
  startedTs: number;
}

export const DEPARTMENTS: Department[] = [
  { label: 'Engineering', color: 'blue' },
  { label: 'Design', color: 'purple' },
  { label: 'Sales', color: 'lime' },
  { label: 'Marketing', color: 'yellow' },
  { label: 'Support', color: 'cyan' },
  { label: 'Operations', color: 'rose' },
];

const ROLES: Record<string, string[]> = {
  Engineering: ['Backend Engineer', 'Frontend Engineer', 'DevOps Engineer', 'Engineering Manager', 'QA Engineer'],
  Design: ['Product Designer', 'UI Designer', 'User Researcher', 'Design Lead'],
  Sales: ['Account Executive', 'Sales Engineer', 'SDR', 'Head of Sales'],
  Marketing: ['Growth Marketer', 'Content Lead', 'Performance Marketer', 'Brand Designer'],
  Support: ['Support Specialist', 'Support Lead', 'Technical Writer'],
  Operations: ['People Ops', 'Finance Ops', 'Office Manager', 'Legal Counsel'],
};

export const SALARY_BUCKETS: { id: string; label: string; test: (n: number) => boolean }[] = [
  { id: 'all', label: 'All salaries', test: () => true },
  { id: 'under-60', label: 'Under $60K', test: (n) => n < 60_000 },
  { id: '60-90', label: '$60K – $90K', test: (n) => n >= 60_000 && n <= 90_000 },
  { id: '90-120', label: '$90K – $120K', test: (n) => n > 90_000 && n <= 120_000 },
  { id: 'over-120', label: 'Over $120K', test: (n) => n > 120_000 },
];

export const WORK_STATUSES: (DataTableSelectOption & { value: WorkStatus })[] = [
  { value: 'active', label: 'Active', dot: 'success' },
  { value: 'leave', label: 'On leave', dot: 'warning' },
  { value: 'contract', label: 'Contract', dot: 'info' },
];

const FIRST_NAMES = ['Marcus', 'Cheyenne', 'Alfredo', 'Talan', 'Roger', 'Cristofer', 'Emery', 'Kadin', 'Nolan', 'Ruben', 'Skylar', 'Hanna', 'Corey', 'Miracle', 'Zaire', 'Cooper', 'Leilani', 'Alena', 'Terry', 'Jaxson', 'Kaiya', 'Omar', 'Phoenix', 'Adison', 'Gretchen', 'Nova', 'Ellis', 'Dulce', 'Wilson'];
const LAST_NAMES = ['Culhane', 'Herwitz', 'Septimus', 'Bergson', 'Curtis', 'Vetrovs', 'Rhiel', 'Dokidis', 'Kenter', 'Stanton', 'Baptista', 'Workman', 'Torff', 'Calzoni', 'Rosser', 'Geidt', 'Bator', 'Vaccaro', 'Lipshutz', 'Botosh'];

export function formatSalary(n: number) {
  return `$${Math.round(n / 1000)}K`;
}

export const EMPLOYEES: Employee[] = (() => {
  const rng = makeRng(23);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]!;
  return Array.from({ length: 248 }, (_, i) => {
    const department = pick(DEPARTMENTS);
    const role = pick(ROLES[department.label]!);
    const status: WorkStatus = rng() < 0.82 ? 'active' : rng() < 0.55 ? 'leave' : 'contract';
    const salary = 42_000 + Math.floor(rng() * 118) * 1000;
    const monthIdx = Math.floor(rng() * 12);
    const day = 1 + Math.floor(rng() * 28);
    const year = 2020 + Math.floor(rng() * 7);
    const base = {
      id: String(i),
      role,
      department,
      status,
      salary,
      started: `${MONTHS[monthIdx]} ${String(day).padStart(2, '0')}, ${year}`,
      startedTs: Date.UTC(year, monthIdx, day),
    };
    const person = PHOTO_PEOPLE[i];
    if (person) return { ...base, name: person.name, avatar: person.avatar, initialsColor: 'neutral' as const };
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    return { ...base, name, initialsColor: rng() > 0.5 ? ('blue' as const) : ('neutral' as const) };
  });
})();

export const DEFAULT_SELECTED_EMPLOYEES = ['1', '2'];
