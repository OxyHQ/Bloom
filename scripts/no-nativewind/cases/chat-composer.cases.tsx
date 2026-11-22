import { View } from 'react-native';
import { CompactComposer } from '@bloom/chat-composer';
import { MediaAttachmentIcon } from '@bloom/icons/social/MediaAttachmentIcon';
import type { Cases } from '../support/cases';

const noop = () => {};
const actions = [
  { id: 'media', label: 'Attach media', icon: MediaAttachmentIcon, onPress: noop },
  { id: 'gif', label: 'Attach GIF', icon: MediaAttachmentIcon, onPress: noop, disabled: true },
];

export const CASES: Cases = {
  'CompactComposer plain': () => (
    <CompactComposer value="" onChangeText={noop} maxLength={250} onSubmit={noop} />
  ),
  'CompactComposer collapsed with actions': () => (
    <CompactComposer
      value=""
      onChangeText={noop}
      maxLength={250}
      onSubmit={noop}
      attachmentActions={actions}
      onExpand={noop}
      avatar={<View style={{ width: 32, height: 32 }} />}
      testID="cc"
    />
  ),
  'CompactComposer expanded loaded': () => (
    <CompactComposer
      value="Hello there"
      onChangeText={noop}
      maxLength={250}
      onSubmit={noop}
      attachmentActions={actions}
      attachments={<View style={{ height: 40 }} />}
      onExpand={noop}
      placeholder="Write"
      labels={{ submit: 'Post' }}
      style={{ margin: 4 }}
      testID="cc"
    />
  ),
  'CompactComposer busy': () => (
    <CompactComposer value="Draft" onChangeText={noop} maxLength={250} onSubmit={noop} busy />
  ),
  'CompactComposer disabled over limit': () => (
    <CompactComposer
      value="Too long"
      onChangeText={noop}
      maxLength={4}
      onSubmit={noop}
      disabled
      canSubmit={false}
    />
  ),
};
