import { ComposerAttachmentStrip } from './ComposerAttachmentStrip.web';
import { ComposerIconButton } from './ComposerIconButton.web';
import { SuggestionList } from './SuggestionList.web';
import { createChatComposer } from './create-chat-composer';

export const ChatComposer = createChatComposer({ ComposerAttachmentStrip, ComposerIconButton, SuggestionList });
