import { useTemplateCopy } from '../../src/template-copy';
import React from 'react';
import { MultiAgentChat } from '../../src/multi-agent-chat/index.web';
/** Sample responses are supplied by the component. Production hosts provide onRespond. */
export function MultiAgentChatTemplate() {
  const localizeBloomCopy = useTemplateCopy(); return localizeBloomCopy(<MultiAgentChat storageKey={null} style={{ minHeight: 760 }} />); }
