import { ComposerAttachmentStrip } from './ComposerAttachmentStrip';
import { ComposerIconButton } from './ComposerIconButton';
import { SuggestionList } from './SuggestionList';
import { createChatComposer } from './create-chat-composer';

export const ChatComposer = createChatComposer({ ComposerAttachmentStrip, ComposerIconButton, SuggestionList });
