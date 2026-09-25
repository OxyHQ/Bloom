import React from 'react';

import { AiChatContainerBase } from './AiChatContainer';
import { AiChatFeedbackRowBase } from './AiChatFeedbackRowBase';
import { AiChatGalleryPanelBase } from './AiChatGalleryPanelBase';
import { AiChatImageGenerationBase } from './AiChatImageGenerationBase';
import { AiChatAssistantMessageBase, AiChatUserMessageBase } from './AiChatMessages';
import { AiChatPlatformContext, type AiChatPlatform } from './context';
import type {
  AiChatAssistantMessageProps,
  AiChatContainerProps,
  AiChatFeedbackRowProps,
  AiChatGalleryPanelProps,
  AiChatImageGenerationProps,
  AiChatUserMessageProps,
} from './types';

/**
 * Binds the shared implementation to one platform's forked families. Called
 * once at module scope by `AiChat.tsx` (native) and `AiChat.web.tsx` (web) —
 * never per render, so the component identities are stable.
 */
export function bindAiChat(platform: AiChatPlatform) {
  function AiChatFeedbackRow(props: AiChatFeedbackRowProps) {
    return (
      <AiChatPlatformContext.Provider value={platform}>
        <AiChatFeedbackRowBase {...props} />
      </AiChatPlatformContext.Provider>
    );
  }
  AiChatFeedbackRow.displayName = 'AiChatFeedbackRow';

  function AiChatUserMessage(props: AiChatUserMessageProps) {
    return (
      <AiChatPlatformContext.Provider value={platform}>
        <AiChatUserMessageBase {...props} />
      </AiChatPlatformContext.Provider>
    );
  }
  AiChatUserMessage.displayName = 'AiChatUserMessage';

  function AiChatAssistantMessage(props: AiChatAssistantMessageProps) {
    return (
      <AiChatPlatformContext.Provider value={platform}>
        <AiChatAssistantMessageBase {...props} />
      </AiChatPlatformContext.Provider>
    );
  }
  AiChatAssistantMessage.displayName = 'AiChatAssistantMessage';

  function AiChatImageGeneration(props: AiChatImageGenerationProps) {
    return (
      <AiChatPlatformContext.Provider value={platform}>
        <AiChatImageGenerationBase {...props} />
      </AiChatPlatformContext.Provider>
    );
  }
  AiChatImageGeneration.displayName = 'AiChatImageGeneration';

  function AiChatGalleryPanel(props: AiChatGalleryPanelProps) {
    return (
      <AiChatPlatformContext.Provider value={platform}>
        <AiChatGalleryPanelBase {...props} />
      </AiChatPlatformContext.Provider>
    );
  }
  AiChatGalleryPanel.displayName = 'AiChatGalleryPanel';

  function AiChatContainer(props: AiChatContainerProps) {
    return (
      <AiChatPlatformContext.Provider value={platform}>
        <AiChatContainerBase {...props} />
      </AiChatPlatformContext.Provider>
    );
  }
  AiChatContainer.displayName = 'AiChatContainer';

  return {
    AiChatFeedbackRow,
    AiChatUserMessage,
    AiChatAssistantMessage,
    AiChatImageGeneration,
    AiChatGalleryPanel,
    AiChatContainer,
  };
}
