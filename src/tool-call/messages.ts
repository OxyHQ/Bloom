import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * What `ToolCall` says in words about its status, so the state is never carried
 * by colour or an icon alone. Announced through the row's live region.
 */
export interface ToolCallMessages {
  running: string;
  done: string;
  failed: string;
}

export const TOOL_CALL_MESSAGES: MessageCatalog<ToolCallMessages> =
  defineMessages<ToolCallMessages>('TOOL_CALL_MESSAGES', {
    running: 'Running',
    done: 'Done',
    failed: 'Failed',
  });
