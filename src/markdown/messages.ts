import { defineMessages, type MessageCatalog } from '../locale/messages';

/** What a task-list marker announces, in each Bloom language. */
export interface MarkdownMessages {
  taskDone: string;
  taskTodo: string;
}

export const MARKDOWN_MESSAGES: MessageCatalog<MarkdownMessages> = defineMessages<MarkdownMessages>(
  'MARKDOWN_MESSAGES',
  {
    taskDone: 'Completed',
    taskTodo: 'Not completed',
  },
);
