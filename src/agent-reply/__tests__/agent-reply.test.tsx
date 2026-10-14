import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { LocaleProvider } from '../../locale';
import { formatMessage, pickMessages } from '../../locale/messages';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import {
  AgentProfile,
  AgentReply,
  AgentReplyAction,
  AgentReplyActions,
  AgentReplyBubble,
  AgentReplyIdentity,
  AgentStack,
  type AgentReplyAgent,
} from '..';
import { AGENT_REPLY_MESSAGES } from '../messages';
import { Text } from '../../typography';
import { RiFileCopyLine } from '../../icons/remix/RiFileCopyLine';

const agent = (id: string, name: string, label?: string): AgentReplyAgent => ({
  id,
  name,
  label,
  avatar: { preset: 'blue_beret' },
});
const scope = (children: React.ReactNode, locale?: string) => (
  <BloomThemeProvider mode="light">
    {locale ? <LocaleProvider locale={locale}>{children}</LocaleProvider> : children}
  </BloomThemeProvider>
);

describe('agent reply', () => {
  const priorCancel = global.cancelAnimationFrame;
  beforeEach(() => {
    global.cancelAnimationFrame = jest.fn();
  });
  afterAll(() => {
    global.cancelAnimationFrame = priorCancel;
  });

  describe('AgentReplyActions', () => {
    it('keeps the vote itself, one at a time, and reports it', () => {
      const onVoteChange = jest.fn();
      const view = render(scope(<AgentReplyActions onVoteChange={onVoteChange} />));
      const up = () => view.getByLabelText('Helpful response');
      const down = () => view.getByLabelText('Unhelpful response');

      fireEvent.press(up());
      expect(onVoteChange).toHaveBeenLastCalledWith('up');
      expect(up().props['aria-pressed']).toBe(true);
      expect(down().props['aria-pressed']).toBe(false);

      fireEvent.press(down());
      expect(onVoteChange).toHaveBeenLastCalledWith('down');
      expect(up().props['aria-pressed']).toBe(false);
      expect(down().props['aria-pressed']).toBe(true);
    });

    it('shows the vote the caller keeps, and ignores its own once controlled', () => {
      const view = render(scope(<AgentReplyActions vote="down" />));
      fireEvent.press(view.getByLabelText('Helpful response'));
      expect(view.getByLabelText('Unhelpful response').props['aria-pressed']).toBe(true);
      expect(view.getByLabelText('Helpful response').props['aria-pressed']).toBe(false);
    });

    it('draws copy only when it can copy, and adds the caller’s own tiles after it', () => {
      const onCopy = jest.fn();
      const extra = jest.fn();
      const view = render(
        scope(
          <AgentReplyActions onCopy={onCopy}>
            <AgentReplyAction icon={RiFileCopyLine} label="Read aloud" onPress={extra} />
          </AgentReplyActions>,
        ),
      );
      fireEvent.press(view.getByLabelText('Copy response'));
      fireEvent.press(view.getByLabelText('Read aloud'));
      expect(onCopy).toHaveBeenCalledTimes(1);
      expect(extra).toHaveBeenCalledTimes(1);

      const plain = render(scope(<AgentReplyActions />));
      expect(plain.queryByLabelText('Copy response')).toBeNull();
    });

    it('says its labels in the scoped language', () => {
      const es = pickMessages(AGENT_REPLY_MESSAGES, 'es');
      const view = render(scope(<AgentReplyActions onCopy={jest.fn()} />, 'es'));
      expect(view.getByLabelText(es.helpfulResponse)).toBeTruthy();
      expect(view.getByLabelText(es.unhelpfulResponse)).toBeTruthy();
      expect(view.getByLabelText(es.copyResponse)).toBeTruthy();
    });
  });

  describe('AgentReplyIdentity', () => {
    it('is a button only when it can be pressed, named by the caller', () => {
      const onPress = jest.fn();
      const view = render(
        scope(
          <AgentReplyIdentity
            character={{ preset: 'blue_beret' }}
            name="Peri"
            onPress={onPress}
            pressLabel="Edit Peri"
          />,
        ),
      );
      fireEvent.press(view.getByLabelText('Edit Peri'));
      expect(onPress).toHaveBeenCalledTimes(1);

      const plain = render(
        scope(<AgentReplyIdentity character={{ preset: 'blue_beret' }} name="Peri" />),
      );
      expect(plain.queryByRole('button')).toBeNull();
    });

    it('announces that the agent is thinking, in the scoped language', () => {
      const arabic = pickMessages(AGENT_REPLY_MESSAGES, 'ar');
      const view = render(
        scope(
          <AgentReplyIdentity character={{ preset: 'blue_beret' }} name="Peri" thinking />,
          'ar',
        ),
      );
      expect(view.getByLabelText(formatMessage(arabic.agentThinking, 'Peri'))).toBeTruthy();
      expect(view.getByText(arabic.thinking)).toBeTruthy();
    });
  });

  describe('AgentProfile', () => {
    it('names one agent by its name and a team by its labels, three at most', () => {
      const one = render(
        scope(<AgentProfile agents={[agent('a', 'Ada Lovelace')]} onPress={jest.fn()} />),
      );
      expect(one.getByText('Ada Lovelace')).toBeTruthy();

      const team = ['a', 'b', 'c', 'd'].map((id) => agent(id, `Agent ${id}`, id.toUpperCase()));
      const many = render(scope(<AgentProfile agents={team} onPress={jest.fn()} />));
      expect(many.getByText('A + B + C +1')).toBeTruthy();
    });

    it('takes the caller’s label and name, and reports presses and expansion', () => {
      const onPress = jest.fn();
      const view = render(
        scope(
          <AgentProfile
            agents={[]}
            label="Choose your teammates"
            accessibilityLabel="Edit conversation agents"
            expanded
            onPress={onPress}
          />,
        ),
      );
      const button = view.getByLabelText('Edit conversation agents');
      expect(button.props['aria-expanded']).toBe(true);
      expect(view.getByText('Choose your teammates')).toBeTruthy();
      fireEvent.press(button);
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  it('AgentStack names everyone it stacks', () => {
    const view = render(scope(<AgentStack agents={[agent('a', 'Ada'), agent('b', 'Bo')]} />));
    expect(view.getByLabelText('Ada, Bo')).toBeTruthy();
  });

  it('AgentReply draws the reply, who answered, and the actions together', () => {
    const view = render(
      scope(
        <AgentReply identity={<Text>identity</Text>} actions={<Text>actions</Text>}>
          <AgentReplyBubble>
            <Text>the answer</Text>
          </AgentReplyBubble>
        </AgentReply>,
      ),
    );
    expect(view.getByText('the answer')).toBeTruthy();
    expect(view.getByText('identity')).toBeTruthy();
    expect(view.getByText('actions')).toBeTruthy();
  });
});
