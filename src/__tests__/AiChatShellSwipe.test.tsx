/**
 * The former shell swipe claimed gestures across the whole conversation.
 * AppShell now owns the layout: the domain adapter must leave text selection,
 * horizontal content and vertical scrolling to their existing responders.
 * Historical gesture thresholds remain recorded in docs/ai-chat.mdx.
 */
import { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { AiChatShell, AiChatMobileHeader } from '../ai-chat';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { mockWindowSize } from './support/window-size';

beforeEach(() => {
  mockWindowSize({ width: 390, height: 900, scale: 1, fontScale: 1 });
});
afterEach(() => jest.restoreAllMocks());

it('leaves the shared shell root free of a second gesture responder', () => {
  const tree = render(
    <BloomThemeProvider mode="light">
      <AiChatShell
        testID="shell"
        sidebar={null}
        mobileSidebar={<Text>Navigation</Text>}
        navSwipeEnabled
      >
        <Text>Conversation</Text>
      </AiChatShell>
    </BloomThemeProvider>,
  );
  const root = tree.getByTestId('shell');
  expect(root.props.onMoveShouldSetResponder).toBeUndefined();
  expect(root.props.onMoveShouldSetResponderCapture).toBeUndefined();
});

it('keeps the conversation and its draft mounted when navigation is selected and closed', () => {
  let mounts = 0;
  function Conversation() {
    const [text, setText] = useState('');
    useEffect(() => {
      mounts += 1;
    }, []);
    return <TextInput testID="draft" value={text} onChangeText={setText} />;
  }
  function App() {
    const [open, setOpen] = useState(false);
    return (
      <BloomThemeProvider mode="light">
        <AiChatShell
          testID="shell"
          sidebar={null}
          mobileSidebar={<Text>Navigation</Text>}
          navOpen={open}
          onNavOpenChange={setOpen}
        >
          <AiChatMobileHeader title="Conversation" />
          <Conversation />
        </AiChatShell>
      </BloomThemeProvider>
    );
  }
  const tree = render(<App />);
  fireEvent.changeText(tree.getByTestId('draft'), 'Keep this draft');
  fireEvent.press(tree.getByLabelText('Open navigation'));
  expect(tree.getByText('Navigation')).toBeTruthy();
  expect(tree.getByTestId('draft', { includeHiddenElements: true }).props.value).toBe(
    'Keep this draft',
  );
  fireEvent.press(tree.getByLabelText('Close navigation', { includeHiddenElements: true }));
  expect(tree.getByTestId('draft').props.value).toBe('Keep this draft');
  expect(mounts).toBe(1);
});

it('lets the shared panel supply the actual content width', () => {
  const panel = jest.fn(() => <Text>Code</Text>);
  render(
    <BloomThemeProvider mode="light">
      <AiChatShell
        sidebar={null}
        panel={panel}
        panelOpen
        defaultPanelWidth={410}
        minPanelWidth={320}
        maxPanelWidth={560}
      >
        <Text>Conversation</Text>
      </AiChatShell>
    </BloomThemeProvider>,
  );
  expect(panel).toHaveBeenCalledWith('100%');
});
