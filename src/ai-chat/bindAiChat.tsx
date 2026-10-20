import React, { forwardRef } from 'react';
import { AiChatCodePanel as AiChatCodePanelBase } from './AiChatCodePanel';
import { AiChatThread as AiChatThreadBase } from './AiChatContainer';
import type { AiChatCodePanelProps, AiChatThreadHandle, AiChatThreadProps } from './types';

import { AiChatContainerBase } from './AiChatContainer';
import { AiChatShellBase } from './AiChatShell';
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
  AiChatShellProps,
} from './types';

/**
 * Binds the shared implementation to one platform's forked families. Called
 * once at module scope by `AiChat.tsx` (native) and `AiChat.web.tsx` (web) —
 * never per render, so the component identities are stable.
 */
export function bindAiChat(platform: AiChatPlatform) {
  function AiChatCodePanel(props: AiChatCodePanelProps) {
    return (
      <AiChatPlatformContext.Provider value={platform}>
        <AiChatCodePanelBase {...props} />
      </AiChatPlatformContext.Provider>
    );
  }
  const AiChatThread = forwardRef<AiChatThreadHandle, AiChatThreadProps>(
    function AiChatThread(props, ref) {
      return (
        <AiChatPlatformContext.Provider value={platform}>
          <AiChatThreadBase {...props} ref={ref} />
        </AiChatPlatformContext.Provider>
      );
    },
  );
  function AiChatShell(props: AiChatShellProps) {
    return (
      <AiChatPlatformContext.Provider value={platform}>
        <AiChatShellBase {...props} />
      </AiChatPlatformContext.Provider>
    );
  }
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
    AiChatCodePanel,
    AiChatThread,
    AiChatShell,
    AiChatFeedbackRow,
    AiChatUserMessage,
    AiChatAssistantMessage,
    AiChatImageGeneration,
    AiChatGalleryPanel,
    AiChatContainer,
  };
}
