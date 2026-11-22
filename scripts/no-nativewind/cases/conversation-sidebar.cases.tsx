import { View } from 'react-native';
import { ConversationSidebar } from '@bloom/conversation-sidebar';
import type { Cases } from '../support/cases';

const noop = () => {};
const AGENT = { id: 'a', name: 'Ember', avatar: { preset: 'blue_beret' as const } };

export const CASES: Cases = {
  'ConversationSidebar tools': () => (
    <View style={{ height: 500, width: 320 }}>
      <ConversationSidebar
        conversations={[{ id: '1', title: 'Launch', description: 'Plan', agents: [AGENT] }]}
        activeId="1"
        onSelect={noop}
        onMarketplace={noop}
        onCreate={noop}
      />
    </View>
  ),
  'ConversationSidebar menu': () => (
    <View style={{ height: 500, width: 320 }}>
      <ConversationSidebar
        conversations={[]}
        onSelect={noop}
        createOptions={[{ key: 'agent', label: 'Create', description: 'New', onPress: noop }]}
      />
    </View>
  ),
};
