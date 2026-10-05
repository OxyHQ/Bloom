import { render } from '@testing-library/react-native';
import React from 'react';
import { FOLD_CONFIG } from '../../agent-avatar';
import { LocaleProvider } from '../../locale';
import { pickMessages } from '../../locale/messages';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { Text } from '../../typography';
import type { Agent } from '../data';
import { MULTI_AGENT_CHAT_MESSAGES, formatChatMessage } from '../messages';
import { ReplyHeader } from '../ReplyRow';
import { SelectedAgentPreview } from '../SelectedAgentPreview';
import { useWorkspaceSettingsPages } from '../WorkspaceSettingsPages';

const agent: Agent = {
  id: 'peri',
  name: 'Peri',
  label: 'Research',
  description: '',
  avatar: { ...FOLD_CONFIG, motion: 0 },
};
const scope = (children: React.ReactNode, locale: string) => (
  <BloomThemeProvider mode="light">
    <LocaleProvider locale={locale}>{children}</LocaleProvider>
  </BloomThemeProvider>
);

describe('multi-agent chat locale', () => {
  const priorCancel = global.cancelAnimationFrame;
  beforeEach(() => {
    global.cancelAnimationFrame = jest.fn();
  });
  afterAll(() => {
    global.cancelAnimationFrame = priorCancel;
  });
  it('names the preview and edit action in the scoped language, preserving supplied names', () => {
    const messages = pickMessages(MULTI_AGENT_CHAT_MESSAGES, 'es');
    const view = render(
      scope(
        <>
          <SelectedAgentPreview agents={[agent]} nodes={new Map()} caption />
          <ReplyHeader agent={agent} thinking={false} onEdit={jest.fn()} />
        </>,
        'es',
      ),
    );
    expect(
      view.getByLabelText(formatChatMessage(messages.selectedAgents, 'Peri')),
    ).toBeTruthy();
    expect(
      view.getByLabelText(formatChatMessage(messages.editAgent, 'Peri')),
    ).toBeTruthy();
    expect(
      view.getByText(messages.chooseWhoSJoiningTheConversation),
    ).toBeTruthy();
    expect(view.queryByLabelText('Edit Peri')).toBeNull();
    view.rerender(
      scope(<ReplyHeader agent={agent} thinking onEdit={jest.fn()} />, 'ar'),
    );
    const arabic = pickMessages(MULTI_AGENT_CHAT_MESSAGES, 'ar');
    expect(
      view.getByLabelText(formatChatMessage(arabic.agentThinking, 'Peri')),
    ).toBeTruthy();
    expect(view.getByText(arabic.thinking)).toBeTruthy();
  });

  it('updates memoized settings titles when the locale changes', () => {
    function Titles() {
      const pages = useWorkspaceSettingsPages();
      return <Text>{pages.general?.title}</Text>;
    }
    const settings = render(scope(<Titles />, 'es'));
    expect(
      settings.getByText(pickMessages(MULTI_AGENT_CHAT_MESSAGES, 'es').general),
    ).toBeTruthy();
    settings.rerender(scope(<Titles />, 'ar'));
    expect(
      settings.getByText(pickMessages(MULTI_AGENT_CHAT_MESSAGES, 'ar').general),
    ).toBeTruthy();
  });

  it('formats count-dependent labels with each language’s cardinal forms', () => {
    const ru = pickMessages(MULTI_AGENT_CHAT_MESSAGES, 'ru');
    expect([1, 2, 5, 21].map(ru.results)).toEqual([
      '1 результат',
      '2 результата',
      '5 результатов',
      '21 результат',
    ]);
    expect(ru.includedSkills(2, 5)).toBe('2 приложения, 5 навыков');
    const ar = pickMessages(MULTI_AGENT_CHAT_MESSAGES, 'ar');
    expect(ar.results(3)).toBe('3 نتائج');
    expect(ar.includedSkills(2, 3)).toBe('2 تطبيقان، 3 مهارات');
  });
});
