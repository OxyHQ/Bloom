import {
  TaskList as BloomTaskList,
  type TaskListProps,
  type TaskListTask,
} from '@oxy.so/bloom/task-list';

import { Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** The task list: an agent's tasks, their steps revealed as it works. */
export type TaskListKind = 'taskList';

/** Bloom `TaskList`'s reveal (its pace, or `revealed` from real events) and its handler. */
export type TaskListOptions = Omit<TaskListProps, 'tasks' | 'style' | 'testID'>;

/** Bloom `TaskList`. */
export type TaskListView = ViewModifiers<TaskListView>;

/** Bloom `TaskList` of `tasks`, in order (a chip's `icon` is a React element: `toElement(view)`). */
export function TaskList(
  tasks: readonly TaskListTask[],
  options: TaskListOptions = {},
): TaskListView {
  return new Node('taskList', { tasks, options }, []);
}

export const TASK_LISTS: Record<TaskListKind, ControlRenderer> = {
  taskList: product(BloomTaskList),
};
