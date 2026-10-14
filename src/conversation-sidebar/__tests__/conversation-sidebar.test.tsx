import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { RiDeleteBinLine } from '../../icons/remix/RiDeleteBinLine';
import { ConversationSidebar, type ConversationSidebarItem } from '..';

const agent = (id: string, name: string) => ({
  id,
  name,
  avatar: { preset: 'blue_beret' as const },
});
const CHATS: ConversationSidebarItem[] = [
  {
    id: 'a',
    title: 'Launch plan',
    description: 'Two days.',
    agents: [agent('l', 'Lumi'), agent('s', 'Sol')],
    pinned: true,
  },
  { id: 'b', title: 'Security', description: 'Review access.', agents: [agent('t', 'Atlas')] },
];
const scope = (ui: React.ReactElement) => (
  <BloomThemeProvider mode="light">{ui}</BloomThemeProvider>
);

describe('ConversationSidebar', () => {
  const priorCancel = global.cancelAnimationFrame;
  beforeEach(() => {
    global.cancelAnimationFrame = jest.fn();
  });
  afterAll(() => {
    global.cancelAnimationFrame = priorCancel;
  });

  it('draws a row per conversation, in the order given, and opens the one pressed', () => {
    const onSelect = jest.fn();
    const view = render(
      scope(<ConversationSidebar conversations={CHATS} activeId="a" onSelect={onSelect} />),
    );
    expect(view.getByLabelText('Launch plan')).toBeTruthy();
    expect(view.getByText('Review access.')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Security'));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('marks a pinned conversation and says when there are none', () => {
    const view = render(scope(<ConversationSidebar conversations={CHATS} onSelect={() => {}} />));
    expect(view.getByLabelText('Pinned chat')).toBeTruthy();
    view.rerender(scope(<ConversationSidebar conversations={[]} onSelect={() => {}} />));
    expect(view.getByText('No conversations found.')).toBeTruthy();
  });

  it('has the store and "+" tools only when it is given what they do', () => {
    const none = render(scope(<ConversationSidebar conversations={CHATS} onSelect={() => {}} />));
    expect(none.queryByLabelText('Marketplace')).toBeNull();
    expect(none.queryByLabelText('Create bot or chat')).toBeNull();
    none.unmount();

    const onMarketplace = jest.fn();
    const full = render(
      scope(
        <ConversationSidebar
          conversations={CHATS}
          onSelect={() => {}}
          onMarketplace={onMarketplace}
          createOptions={[{ key: 'x', label: 'New', onPress: () => {} }]}
        />,
      ),
    );
    fireEvent.press(full.getByLabelText('Marketplace'));
    expect(onMarketplace).toHaveBeenCalled();
    expect(full.getByLabelText('Create bot or chat')).toBeTruthy();
  });

  it('takes its words from labels', () => {
    const view = render(
      scope(
        <ConversationSidebar
          conversations={CHATS}
          onSelect={() => {}}
          onMarketplace={() => {}}
          labels={{ marketplace: 'Agents', conversations: 'Chats' }}
        />,
      ),
    );
    expect(view.getByLabelText('Agents')).toBeTruthy();
    expect(view.getByLabelText('Chats')).toBeTruthy();
  });

  it('gives a conversation a menu only when there are actions for it', () => {
    const view = render(
      scope(
        <ConversationSidebar
          conversations={CHATS}
          onSelect={() => {}}
          actions={(chat) =>
            chat.id === 'a'
              ? [{ key: 'delete', label: 'Delete', icon: RiDeleteBinLine, destructive: true }]
              : []
          }
        />,
      ),
    );
    expect(view.getByLabelText('Launch plan')).toBeTruthy();
    expect(view.getByLabelText('Security')).toBeTruthy();
  });

  it('makes "+" act directly with onCreate, and a menu only with createOptions', () => {
    const onCreate = jest.fn();
    const direct = render(
      scope(<ConversationSidebar conversations={CHATS} onSelect={() => {}} onCreate={onCreate} />),
    );
    fireEvent.press(direct.getByLabelText('Create bot or chat'));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
