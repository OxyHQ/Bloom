import { useTemplateCopy } from '../template-copy';
import React from 'react';

import { AgentChatActionsBase } from './AgentChatActionsBase';
import { AgentChatBase } from './AgentChatBase';
import { AgentChatComposerBase } from './AgentChatComposerBase';
import { AgentChatHistoryBase } from './AgentChatHistoryBase';
import { AgentChatPlatformContext, type AgentChatPlatform } from './context';
import type {
  AgentChatActionsProps,
  AgentChatComposerProps,
  AgentChatHistoryProps,
  AgentChatProps,
} from './types';

/**
 * Binds the shared implementation to one platform's forked families. Called
 * once at module scope by `AgentChat.tsx` (native) and `AgentChat.web.tsx`
 * (web) — never per render, so the component identities are stable.
 */
export function bindAgentChat(platform: AgentChatPlatform) {
  function AgentChat(props: AgentChatProps) {
  const localizeBloomCopy = useTemplateCopy();
    return localizeBloomCopy((
      <AgentChatPlatformContext.Provider value={platform}>
        <AgentChatBase {...props} />
      </AgentChatPlatformContext.Provider>
    ));
  }
  AgentChat.displayName = 'AgentChat';

  function AgentChatActions(props: AgentChatActionsProps) {
  const localizeBloomCopy = useTemplateCopy();
    return localizeBloomCopy((
      <AgentChatPlatformContext.Provider value={platform}>
        <AgentChatActionsBase {...props} />
      </AgentChatPlatformContext.Provider>
    ));
  }
  AgentChatActions.displayName = 'AgentChatActions';

  function AgentChatHistory(props: AgentChatHistoryProps) {
  const localizeBloomCopy = useTemplateCopy();
    return localizeBloomCopy((
      <AgentChatPlatformContext.Provider value={platform}>
        <AgentChatHistoryBase {...props} />
      </AgentChatPlatformContext.Provider>
    ));
  }
  AgentChatHistory.displayName = 'AgentChatHistory';

  function AgentChatComposer(props: AgentChatComposerProps) {
  const localizeBloomCopy = useTemplateCopy();
    return localizeBloomCopy((
      <AgentChatPlatformContext.Provider value={platform}>
        <AgentChatComposerBase {...props} />
      </AgentChatPlatformContext.Provider>
    ));
  }
  AgentChatComposer.displayName = 'AgentChatComposer';

  return { AgentChat, AgentChatActions, AgentChatHistory, AgentChatComposer };
}
