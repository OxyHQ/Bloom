import {
  AiChatAssistantMessage,
  AiChatCodePanel,
  AiChatContainer,
  AiChatGalleryPanel,
  AiChatHeader,
  AiChatMessageLine,
  AiChatMobileHeader,
  AiChatShell,
  AiChatThread,
  AiChatUserMessage,
} from '@oxy.so/bloom/ai-chat';
import { RiFileCopyLine } from '@oxy.so/bloom/icons';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const ACTIONS = [{ key: 'copy', label: 'Copy', icon: RiFileCopyLine, onPress: press }];
const GENERATIONS = [
  { id: 'a', prompt: 'A fox', source: { uri: 'https://cdn.oxy.so/a.jpg' }, aspectRatio: 1 },
  { id: 'b', prompt: 'A boat', source: { uri: 'https://cdn.oxy.so/b.jpg' }, aspectRatio: 1.5 },
];
const FILES = [{ path: 'src/app.tsx', additions: 4, deletions: 1 }];

const lines: ParityCase[] = [
  {
    name: 'AiChatMessageLine',
    language: () => toElement(L.AiChatMessageLine('Here is the plan.')),
    bloom: () => <AiChatMessageLine>Here is the plan.</AiChatMessageLine>,
  },
  {
    name: 'AiChatMessageLine secondary, not selectable',
    language: () => toElement(L.AiChatMessageLine('Thinking…').tint('secondary').selectable(false)),
    bloom: () => (
      <AiChatMessageLine tone="secondary" selectable={false}>
        Thinking…
      </AiChatMessageLine>
    ),
  },
  {
    name: 'AiChatMessageLine a block',
    language: () => toElement(L.AiChatMessageLine(L.Text('A quote'))),
    bloom: () => (
      <AiChatMessageLine block>
        <Text>A quote</Text>
      </AiChatMessageLine>
    ),
  },
];

const turns: ParityCase[] = [
  {
    name: 'AiChatUserMessage',
    language: () => toElement(L.AiChatUserMessage(L.AiChatMessageLine('Plan a trip'))),
    bloom: () => (
      <AiChatUserMessage>
        <AiChatMessageLine>Plan a trip</AiChatMessageLine>
      </AiChatUserMessage>
    ),
  },
  {
    name: 'AiChatUserMessage with actions, not animated',
    language: () =>
      toElement(
        L.AiChatUserMessage(L.AiChatMessageLine('Plan a trip'), {
          actions: ACTIONS,
          animate: false,
        }),
      ),
    bloom: () => (
      <AiChatUserMessage actions={ACTIONS} animate={false}>
        <AiChatMessageLine>Plan a trip</AiChatMessageLine>
      </AiChatUserMessage>
    ),
  },
  {
    name: 'AiChatAssistantMessage of lines',
    language: () =>
      toElement(
        L.AiChatAssistantMessage([
          L.AiChatMessageLine('First, the route.'),
          L.AiChatMessageLine('Then the stays.'),
        ]),
      ),
    bloom: () => (
      <AiChatAssistantMessage>
        <AiChatMessageLine>First, the route.</AiChatMessageLine>
        <AiChatMessageLine>Then the stays.</AiChatMessageLine>
      </AiChatAssistantMessage>
    ),
  },
  {
    name: 'AiChatAssistantMessage with feedback',
    language: () =>
      toElement(
        L.AiChatAssistantMessage(L.AiChatMessageLine('Done.'), {
          feedback: true,
          feedbackProps: { onLike: press, onDislike: press },
        }),
      ),
    bloom: () => (
      <AiChatAssistantMessage feedback feedbackProps={{ onLike: press, onDislike: press }}>
        <AiChatMessageLine>Done.</AiChatMessageLine>
      </AiChatAssistantMessage>
    ),
  },
  {
    name: 'AiChatThread',
    language: () =>
      toElement(
        L.AiChatThread(
          [
            L.AiChatUserMessage(L.AiChatMessageLine('Hi')).id('u'),
            L.AiChatAssistantMessage(L.AiChatMessageLine('Hello')).id('a'),
          ],
          { autoFollow: false },
        ),
      ),
    bloom: () => (
      <AiChatThread autoFollow={false}>
        <AiChatUserMessage>
          <AiChatMessageLine>Hi</AiChatMessageLine>
        </AiChatUserMessage>
        <AiChatAssistantMessage>
          <AiChatMessageLine>Hello</AiChatMessageLine>
        </AiChatAssistantMessage>
      </AiChatThread>
    ),
  },
];

const chrome: ParityCase[] = [
  {
    name: 'AiChatContainer',
    language: () =>
      toElement(
        L.AiChatContainer(L.AiChatMessageLine('Hello'), {
          title: 'Trip',
          project: 'Travel',
          composer: L.Text('Composer'),
        }),
      ),
    bloom: () => (
      <AiChatContainer title="Trip" project="Travel" composer={<Text>Composer</Text>}>
        <AiChatMessageLine>Hello</AiChatMessageLine>
      </AiChatContainer>
    ),
  },
  {
    name: 'AiChatContainer working, no surface, a header',
    language: () =>
      toElement(
        L.AiChatContainer(L.AiChatMessageLine('Hello'), {
          working: true,
          surface: false,
          header: L.AiChatHeader(L.Text('Header')),
          onShare: press,
        }),
      ),
    bloom: () => (
      <AiChatContainer
        working
        surface={false}
        header={
          <AiChatHeader>
            <Text>Header</Text>
          </AiChatHeader>
        }
        onShare={press}
      >
        <AiChatMessageLine>Hello</AiChatMessageLine>
      </AiChatContainer>
    ),
  },
  {
    name: 'AiChatMobileHeader',
    language: () => toElement(L.AiChatMobileHeader('Trip')),
    bloom: () => <AiChatMobileHeader title="Trip" />,
  },
  {
    name: 'AiChatCodePanel',
    language: () =>
      toElement(
        L.AiChatCodePanel('const a = 1;', {
          language: 'ts',
          changedFiles: FILES,
          additions: 4,
          deletions: 1,
          width: '320',
        }),
      ),
    bloom: () => (
      <AiChatCodePanel
        code="const a = 1;"
        language="ts"
        changedFiles={FILES}
        additions={4}
        deletions={1}
        width={320}
      />
    ),
  },
  {
    name: 'AiChatGalleryPanel',
    language: () => toElement(L.AiChatGalleryPanel(GENERATIONS, { columns: 2, width: 'full' })),
    bloom: () => <AiChatGalleryPanel generations={GENERATIONS} columns={2} width="100%" />,
  },
];

const shells: ParityCase[] = [
  {
    name: 'AiChatShell',
    language: () =>
      toElement(L.AiChatShell(L.AiChatMessageLine('Hello'), { sidebar: L.Text('Chats') })),
    bloom: () => (
      <AiChatShell sidebar={<Text>Chats</Text>}>
        <AiChatMessageLine>Hello</AiChatMessageLine>
      </AiChatShell>
    ),
  },
  {
    name: 'AiChatShell with a panel, a sidebar width',
    language: () =>
      toElement(
        L.AiChatShell(L.AiChatMessageLine('Hello'), {
          sidebar: L.Text('Chats'),
          sidebarWidth: '256',
          panel: () => L.Text('Panel'),
          panelOpen: true,
          panelLabel: 'Code',
        }),
      ),
    bloom: () => (
      <AiChatShell
        sidebar={<Text>Chats</Text>}
        sidebarWidth={256}
        panel={() => <Text>Panel</Text>}
        panelOpen
        panelLabel="Code"
      >
        <AiChatMessageLine>Hello</AiChatMessageLine>
      </AiChatShell>
    ),
  },
];

export const AI_CHAT_CASES: ParityCase[] = [...lines, ...turns, ...chrome, ...shells];
