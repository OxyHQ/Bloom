import { Text, View } from 'react-native';
import { AgentLogGuideBridge, AgentLogRowConnector, AgentLogShimmerText } from '@bloom/agent-log';
import { AgentThinking } from '@bloom/agent-thinking';
import { NotificationsScreen } from '@bloom/notifications';
import { TaskList } from '@bloom/task-list';
import { WebSearch } from '@bloom/web-search';
import type { Cases } from '../support/cases';

const noop = () => {};

const TASKS = [
  {
    title: 'Found project files',
    runningTitle: 'Finding project files',
    steps: [
      { label: 'Scanning 52 files' },
      { label: 'Reading', chips: [{ label: 'package.json' }, { label: 'tsconfig.json' }] },
    ],
  },
  { title: 'Checks passed', runningTitle: 'Running checks', steps: [{ label: 'Type checking' }] },
];

const SOURCES = [
  { title: 'RTINGS', domain: 'www.rtings.com' },
  { title: 'Reddit', domain: 'www.reddit.com', brand: 'reddit' as const },
  { title: 'GitHub', domain: 'github.com', brand: 'github' as const },
];

const STEPS = [
  { label: 'Researching keyboards', heading: true },
  { label: 'Searched the web for', query: 'budget keyboard', meta: '10 results', sources: SOURCES },
  { label: 'Searched X for', brand: 'x' as const, query: 'aula f75' },
  { label: 'Read' },
];

export const CASES: Cases = {
  'AgentLog connector, bridge and shimmer': () => (
    <View>
      <AgentLogRowConnector first last={false} reduce />
      <AgentLogGuideBridge height={6} offset={7} reduce />
      <Text>
        <AgentLogShimmerText>Reading files</AgentLogShimmerText>
      </Text>
    </View>
  ),
  'AgentThinking disclosure': () => (
    <AgentThinking label="Thought for 4s" thinking={false} defaultOpen>
      <Text>Weighing it up</Text>
    </AgentThinking>
  ),
  NotificationsScreen: () => (
    <NotificationsScreen
      title="Notifications"
      notifications={[
        {
          id: 'a',
          title: 'Ana followed you',
          description: 'Say hello',
          timestamp: '2m',
          unread: true,
        },
        { id: 'b', title: 'Welcome', timestamp: '1d' },
      ]}
      onNotificationPress={noop}
      onMarkAllRead={noop}
      push={{ enabled: false, onChange: noop }}
    />
  ),
  'TaskList revealed': () => <TaskList tasks={TASKS} revealed={5} reduce />,
  'TaskList running': () => <TaskList tasks={TASKS} revealed={2} reduce />,
  'WebSearch revealed': () => <WebSearch steps={STEPS} revealed={6} reduce />,
  'WebSearch running': () => <WebSearch steps={STEPS} revealed={2} reduce />,
};
