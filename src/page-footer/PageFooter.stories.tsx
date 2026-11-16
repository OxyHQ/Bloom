import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell, AppShellMenuButton } from '../app-shell';
import { BottomBar } from '../bottom-bar';
import { Button } from '../button';
import { ChatComposer } from '../chat-composer';
import { RiInbox2Line, RiSearchLine } from '../icons/remix';
import { List } from '../list';
import { MailMessage } from '../mail-thread';
import { PageHeader } from '../page-header';
import { Screen, ScreenScrollView } from '../screen';
import { Search } from '../search';
import { Text } from '../typography';
import { PageFooter } from './index';
import type { PageFooterProps } from './types';

const meta: Meta<typeof PageFooter> = {
  id: 'blocks-page-footer',
  title: 'Composition/Layout/Page Footer',
  component: PageFooter,
  parameters: { layout: 'fullscreen' },
  args: { scrim: 'always' },
  argTypes: { scrim: { control: 'select', options: ['auto', 'always', 'none'] } },
};
export default meta;
type Story = StoryObj<typeof PageFooter>;

const SUBJECT = 'The next chapter';
const SENDER = { name: 'Alex Morgan', address: 'alex@studio.example' };
const ME = { name: 'You', address: 'you@studio.example' };
const NOTES = [
  [
    'A place to begin',
    'The reading room will open next month. Here is the plan we discussed, with the decisions still to make before we welcome our first guests.',
  ],
  [
    'The collection',
    'We have enough books for the first shelves. Please bring your recommendations to our next meeting, especially titles you would like to discuss together.',
  ],
  [
    'Opening weekend',
    'Saturday morning is reserved for the volunteers. We will arrange the shelves, check the lighting and make sure everyone can find their way around.',
  ],
  [
    'The welcome desk',
    'Two people will be at the entrance during each shift. They can explain the lending cards, introduce new members and help visitors choose something to read.',
  ],
  [
    'A quieter corner',
    'The tables beside the windows will stay available for independent reading. Group conversations can use the larger table near the courtyard.',
  ],
  [
    'Our first conversation',
    'We will start with a short book that everyone can finish in a week. Suggestions are welcome; the final choice will go into the next newsletter.',
  ],
  [
    'Accessibility',
    'Please walk through the room with the furniture in place. We need clear routes between shelves and enough space beside every table.',
  ],
  [
    'The noticeboard',
    'Upcoming conversations, volunteer shifts and lending information will be posted near the entrance. Each notice should have a date and a contact person.',
  ],
  [
    'Food and drinks',
    'Tea and coffee will be available in the courtyard. We will keep that area separate from the books and provide water inside the room.',
  ],
  [
    'Photographs',
    'We would like a few photographs of the finished space for the newsletter. We will ask visitors before including anyone in a picture.',
  ],
  [
    'Before we open',
    'The last walkthrough is on Thursday. Please send any outstanding questions before then so that we can give each one enough time.',
  ],
  [
    'See you there',
    'Thank you for helping turn an empty room into somewhere people can spend time together. I am looking forward to seeing what we build next.',
  ],
] as const;
type Route = 'message' | 'inbox' | 'search';
type Reply = 'Reply' | 'Reply all' | 'Forward';

/** Only message data and local actions live here; Screen owns all chrome and clearance. */
function MessageScreen({
  footer,
  route,
  onRoute,
  longLabels,
  initiallyReplying,
}: {
  footer: PageFooterProps;
  route: Route;
  onRoute: (route: Route) => void;
  longLabels: boolean;
  initiallyReplying: boolean;
}) {
  const [reply, setReply] = useState<Reply | null>(initiallyReplying ? 'Reply' : null);
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [starred, setStarred] = useState(false);
  const reading = route === 'message';
  return (
    <Screen
      testID="footer-screen"
      header={
        <PageHeader
          title={reading ? SUBJECT : route === 'search' ? 'Search mail' : 'Inbox'}
          leading={!reading ? <AppShellMenuButton /> : undefined}
          onBack={reading ? () => onRoute('inbox') : undefined}
          search={
            route === 'search' ? (
              <Search
                label="Search mail"
                value={query}
                onValueChange={setQuery}
                onClearText={() => setQuery('')}
              />
            ) : undefined
          }
          actions={
            reading && reply ? (
              <Button onPress={() => setReply(null)}>Cancel reply</Button>
            ) : undefined
          }
        />
      }
      bottomBarPlacement="overlay"
      bottomBarKeyboardBehavior="follow"
      bottomBar={
        reading ? (
          <PageFooter
            {...footer}
            testID="message-footer"
            actions={
              reply
                ? undefined
                : (footer.actions ?? (
                    <>
                      <Button onPress={() => setReply('Reply')}>
                        {longLabels ? 'Reply to this message' : 'Reply'}
                      </Button>
                      <Button onPress={() => setReply('Reply all')}>
                        {longLabels ? 'Reply to all participants' : 'Reply all'}
                      </Button>
                      <Button onPress={() => setReply('Forward')}>
                        {longLabels ? 'Forward this message' : 'Forward'}
                      </Button>
                    </>
                  ))
            }
          >
            {reply ? (
              <ChatComposer
                testID="message-composer"
                value={draft}
                onValueChange={setDraft}
                accessibilityLabel={reply}
                placeholder={reply === 'Forward' ? 'Add a message…' : 'Write a reply…'}
                onSend={(value) => {
                  setSent((messages) => [...messages, value]);
                  setDraft('');
                  setReply(null);
                }}
              />
            ) : (
              footer.children
            )}
          </PageFooter>
        ) : undefined
      }
    >
      <ScreenScrollView testID="message-content">
        {reading ? (
          <>
            <MailMessage
              sender={SENDER}
              to={[ME]}
              date="Today, 10:24"
              time="10:24"
              preview={NOTES[0][1]}
              defaultExpanded
              starred={starred}
              onStarredChange={setStarred}
            >
              <View style={{ gap: 24 }}>
                {NOTES.map(([heading, text]) => (
                  <View key={heading} style={{ gap: 8 }}>
                    <Text variant="body-medium">{heading}</Text>
                    <Text>{text}</Text>
                  </View>
                ))}
                <Text testID="message-end">Alex</Text>
              </View>
            </MailMessage>
            {sent.map((text, index) => (
              <MailMessage
                key={index}
                sender={ME}
                to={[SENDER]}
                date="Just now"
                time="Now"
                preview={text}
                defaultExpanded
              >
                <Text>{text}</Text>
              </MailMessage>
            ))}
          </>
        ) : (
          <List
            items={
              !query || `${SUBJECT} ${SENDER.name}`.toLowerCase().includes(query.toLowerCase())
                ? [
                    {
                      id: 'chapter',
                      mail: {
                        sender: SENDER,
                        subject: SUBJECT,
                        snippet: NOTES[0][1],
                        time: '10:24',
                      },
                      onPress: () => onRoute('message'),
                    },
                  ]
                : []
            }
            empty={<Text>No messages found.</Text>}
          />
        )}
      </ScreenScrollView>
    </Screen>
  );
}

function MessageApp({
  footer,
  navigation = false,
  longLabels = false,
  document = false,
  initiallyReplying = false,
}: {
  footer: PageFooterProps;
  navigation?: boolean;
  longLabels?: boolean;
  document?: boolean;
  initiallyReplying?: boolean;
}) {
  const [route, setRoute] = useState<Route>('message');
  return (
    <AppShell
      testID="footer-app"
      header={null}
      contentMaxWidth="none"
      sidebar={{
        logo: { wordmark: 'Inbosh', icon: <RiInbox2Line />, onPress: () => setRoute('inbox') },
        items: [
          { key: 'inbox', label: 'Inbox', icon: RiInbox2Line },
          { key: 'search', label: 'Search', icon: RiSearchLine },
        ],
        selected: route === 'search' ? 'search' : 'inbox',
        onNavigate: (item) => setRoute(item.key === 'search' ? 'search' : 'inbox'),
        showSearch: false,
        showThemeToggle: false,
      }}
      scroll={document ? 'page' : 'fixed'}
      bottomBar={
        navigation ? (
          <BottomBar
            testID="mail-navigation"
            items={[
              { name: 'inbox', label: 'Inbox', icon: <RiInbox2Line /> },
              { name: 'search', label: 'Search', icon: <RiSearchLine /> },
            ]}
            value={route === 'search' ? 'search' : 'inbox'}
            onValueChange={(value) => setRoute(value === 'search' ? 'search' : 'inbox')}
          />
        ) : undefined
      }
      panelLayout={{
        mode: 'split',
        flow: document ? 'document' : 'bounded',
        panels: [
          {
            id: 'message',
            span: 1,
            content: (
              <MessageScreen
                footer={footer}
                route={route}
                onRoute={setRoute}
                longLabels={longLabels}
                initiallyReplying={initiallyReplying}
              />
            ),
          },
        ],
      }}
    />
  );
}

export const FloatingOverMessage: Story = { render: (args) => <MessageApp footer={args} /> };
export const AboveNavigation: Story = { render: (args) => <MessageApp footer={args} navigation /> };
export const WrappedActions: Story = {
  render: (args) => <MessageApp footer={args} longLabels navigation />,
};
export const DocumentComposer: Story = {
  parameters: { bloomScroll: 'document' },
  render: (args) => <MessageApp footer={args} document initiallyReplying />,
};
