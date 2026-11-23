import { RiFileCodeLine, RiFolder3Line } from '@oxy.so/bloom/icons';
import { TaskList } from '@oxy.so/bloom/task-list';
import type { TaskListTask } from '@oxy.so/bloom/task-list';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const TASKS: TaskListTask[] = [
  {
    title: 'Found project files',
    runningTitle: 'Finding project files',
    icon: RiFolder3Line,
    steps: [
      { label: 'Scanning 52 files' },
      {
        label: 'Reading',
        chips: [
          { label: 'package.json' },
          { label: 'tsconfig.json', icon: toElement(L.Icon(RiFileCodeLine).size('xs')) },
        ],
      },
    ],
  },
  {
    title: 'Updated components',
    runningTitle: 'Updating components',
    steps: [{ label: 'Editing Button.tsx' }, { label: 'Editing Card.tsx' }],
  },
];

/** The log at rest: every unit revealed (or a part of it), with no timer running. */
const settled = { run: false, reduce: true } as const;

export const TASK_LIST_CASES: ParityCase[] = [
  {
    name: 'TaskList settled',
    language: () => toElement(L.TaskList(TASKS, { ...settled, revealed: 99, working: false })),
    bloom: () => <TaskList tasks={TASKS} {...settled} revealed={99} working={false} />,
  },
  {
    name: 'TaskList part revealed, collapsing',
    language: () =>
      toElement(
        L.TaskList(TASKS, { ...settled, revealed: 4, collapseOnComplete: true, working: false }),
      ),
    bloom: () => (
      <TaskList tasks={TASKS} {...settled} revealed={4} collapseOnComplete working={false} />
    ),
  },
  {
    name: 'TaskList settled, collapsed together, padded',
    language: () =>
      toElement(
        L.TaskList(TASKS, { ...settled, revealed: 99, collapseOnComplete: 'all' }).padding('md'),
      ),
    bloom: () => (
      <TaskList
        tasks={TASKS}
        {...settled}
        revealed={99}
        collapseOnComplete="all"
        style={{ paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12 }}
      />
    ),
  },
];

/** The working row trails a running log: it moves on the JS thread, so Jest compares it as it mounts. */
export const TASK_LIST_CASES_MOVING: ParityCase[] = [
  {
    name: 'TaskList running, working',
    language: () => toElement(L.TaskList(TASKS, { ...settled, revealed: 2, working: 'Thinking' })),
    bloom: () => <TaskList tasks={TASKS} {...settled} revealed={2} working="Thinking" />,
  },
];
