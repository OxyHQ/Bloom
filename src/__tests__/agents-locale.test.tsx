import React from 'react';
import { render } from '@testing-library/react-native';

// Same stubs as `AgentChat.test.tsx`: the shared mocks stub neither
// `useFrameCallback` nor the SVG blur filter the native `ComposerLoader` needs.
jest.mock('react-native-svg', () => {
  const actual = jest.requireActual('../../__mocks__/react-native-svg');
  const R = jest.requireActual('react');
  const stub = (name: string) => {
    const C = R.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      R.createElement(name, { ref, ...props }, props.children as React.ReactNode),
    );
    C.displayName = name;
    return C;
  };
  return {
    ...actual,
    __esModule: true,
    default: actual.Svg,
    Filter: stub('Filter'),
    FeGaussianBlur: stub('FeGaussianBlur'),
  };
});
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('../../__mocks__/react-native-reanimated');
  return {
    ...actual,
    __esModule: true,
    useFrameCallback: () => ({ setActive: jest.fn(), isActive: false, callbackId: 0 }),
  };
});
jest.mock('../styles/adopt-style-sheet', () => ({
  adoptStyleSheet: jest.fn(),
  dropStyleSheet: jest.fn(),
}));

import { AgentChat, AgentChatComposer, AgentChatHistory, AgentChatMessage } from '../agent-chat';
import { AGENT_CHAT_MESSAGES } from '../agent-chat/messages';
import { formatAgo, relativeTime } from '../agent-chat/shared';
import { AgentLimitsCard } from '../agent-limits-card';
import { AgentProgress } from '../agent-progress';
import { AgentThinking } from '../agent-thinking';
import { AiChatCodePanel, AiChatFeedbackRow } from '../ai-chat';
import { AiProfileCard } from '../ai-profile-card';
import { ComposerPanel, ComposerPanelStatusTab } from '../composer-panel';
import { LocaleProvider } from '../locale';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { WebSearch } from '../web-search';
import { messagesIn } from './support/messages-in';

const HIDDEN = { includeHiddenElements: true } as const;
const NOW = Date.now();
const CELLS = Array.from({ length: 38 * 7 }, () => ({ count: 1 }));

function renderIn(ui: React.ReactElement, locale = 'es') {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <LocaleProvider locale={locale}>{ui}</LocaleProvider>
    </BloomThemeProvider>,
  );
}

describe('agent-chat speaks the locale', () => {
  it('formats ages with each language’s plurals, not English suffixes', () => {
    const ru = messagesIn(AGENT_CHAT_MESSAGES, 'ru');
    const ar = messagesIn(AGENT_CHAT_MESSAGES, 'ar');
    const es = messagesIn(AGENT_CHAT_MESSAGES, 'es');
    const ja = messagesIn(AGENT_CHAT_MESSAGES, 'ja');
    expect(formatAgo(NOW - 60_000, NOW, ru.ago)).toBe('1 минуту назад');
    expect(formatAgo(NOW - 3 * 60_000, NOW, ru.ago)).toBe('3 минуты назад');
    expect(formatAgo(NOW - 5 * 60_000, NOW, ru.ago)).toBe('5 минут назад');
    expect(formatAgo(NOW - 21 * 60_000, NOW, ru.ago)).toBe('21 минуту назад');
    expect(formatAgo(NOW - 2 * 3_600_000, NOW, ar.ago)).toBe('منذ ساعتين');
    expect(formatAgo(NOW - 10_000, NOW, es.ago)).toBe('ahora mismo');
    expect(formatAgo(NOW - 3 * 86_400_000, NOW, ja.ago)).toBe('3日前');
    expect(relativeTime(NOW - 34 * 60_000, NOW, es.age)).toBe('34 min');
  });

  it('draws the empty state, suggestions and composer in Spanish', () => {
    const { getByText, getAllByText, getByLabelText } = renderIn(
      <AgentChat messages={[]} onSubmit={jest.fn()} />,
    );
    expect(getByText('¿En qué puedo ayudarte?')).toBeTruthy();
    expect(getByText('Dame cinco nombres para una app de citas')).toBeTruthy();
    expect(getByLabelText('Enviar mensaje')).toBeTruthy();
    expect(getAllByText('Nuevo chat').length).toBeGreaterThan(0);
  });

  it('dates a message and names its actions in Spanish; a label prop still wins', () => {
    const { getByText, getByLabelText, queryByLabelText } = renderIn(
      <AgentChatMessage
        role="assistant"
        text="Hola"
        at={NOW - 3 * 60_000}
        onCopy={jest.fn()}
        labels={{ copy: 'Copy it' }}
      />,
    );
    expect(getByText('hace 3 minutos')).toBeTruthy();
    expect(getByLabelText('Copy it')).toBeTruthy();
    expect(queryByLabelText('Copiar mensaje')).toBeNull();
  });

  it('counts messages with the right plural form', () => {
    const one = renderIn(<AgentChatComposer messageCount={1} />);
    expect(one.getByText('1 mensaje')).toBeTruthy();
    one.unmount();
    const many = renderIn(<AgentChatComposer messageCount={5} />, 'ru');
    expect(many.getByText('5 сообщений')).toBeTruthy();
  });

  it('localises the rail: export name, compact ages, the thread menu; labels win', () => {
    const { getByTestId, getByText } = renderIn(
      <AgentChatHistory
        testID="h"
        threads={[{ id: 't1', title: 'Nombres', updatedAt: NOW - 34 * 60_000 }]}
        onExport={jest.fn()}
        labels={{ recent: 'Latest' }}
      />,
    );
    expect(getByTestId('h-export').props.accessibilityLabel).toBe('Exportar 1 chat');
    expect(getByText('34 min', HIDDEN)).toBeTruthy();
    expect(getByText('Latest')).toBeTruthy();
  });
});

describe('agent-limits-card speaks the locale', () => {
  it('titles the plan section in Spanish, and labels win', () => {
    const { getByText, getByLabelText } = renderIn(
      <AgentLimitsCard
        plan="Max"
        limits={[]}
        onPlanPress={jest.fn()}
        labels={{ managePlan: 'Billing' }}
      />,
    );
    expect(getByText('Límites de uso del plan · Max')).toBeTruthy();
    expect(getByLabelText('Billing')).toBeTruthy();
  });
});

describe('agent-progress speaks the locale', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('counts the steps left with plurals and shows the demo steps translated', () => {
    const es = renderIn(<AgentProgress />);
    expect(es.getByText('Quedan 5 pasos')).toBeTruthy();
    expect(es.getAllByText('Leer los archivos del proyecto', HIDDEN).length).toBeGreaterThan(0);
    es.unmount();
    const ru = renderIn(<AgentProgress />, 'ru');
    expect(ru.getByText('Осталось 5 шагов')).toBeTruthy();
    ru.unmount();
    // An empty list falls back to the demo steps in the locale, not English.
    const empty = renderIn(<AgentProgress steps={[]} />);
    expect(empty.getAllByText('Leer los archivos del proyecto', HIDDEN).length).toBeGreaterThan(0);
    empty.unmount();
    const custom = renderIn(
      <AgentProgress steps={['A', 'B']} labels={{ stepsLeft: (n) => `${n} to go` }} />,
    );
    expect(custom.getByText('2 to go')).toBeTruthy();
  });
});

describe('agent-thinking speaks the locale', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('defaults its label to the locale; a label prop wins', () => {
    const view = renderIn(<AgentThinking showTimer={false} />);
    expect(view.getByText('Pensando')).toBeTruthy();
    view.unmount();
    expect(
      renderIn(<AgentThinking showTimer={false} label="Buscando" />).getByText('Buscando'),
    ).toBeTruthy();
  });
});

describe('ai-profile-card speaks the locale', () => {
  it('labels the headline, heatmap and switcher in Spanish; label props win', () => {
    const { getByText } = renderIn(
      <AiProfileCard
        name="Maya"
        contributions={10}
        countUpDuration={0}
        cells={CELLS}
        contributionsLabel="Aportes"
      />,
    );
    expect(getByText('Aportes')).toBeTruthy();
    expect(getByText('Actividad')).toBeTruthy();
    expect(getByText('Semanal')).toBeTruthy();
  });
});

describe('web-search speaks the locale', () => {
  const steps = [
    { label: 'Buscando teclados', heading: true },
    { label: 'Buscó en la web', sources: [{ title: 'Wired', domain: 'www.wired.com' }] },
  ];

  it('names the sources row in Spanish, and labels win', () => {
    const view = renderIn(<WebSearch steps={steps} revealed={99} reduce />);
    expect(view.getAllByText('Fuentes', HIDDEN).length).toBeGreaterThan(0);
    view.unmount();
    const custom = renderIn(
      <WebSearch steps={steps} revealed={99} reduce labels={{ sources: 'Links' }} />,
    );
    expect(custom.getAllByText('Links', HIDDEN).length).toBeGreaterThan(0);
  });
});

describe('composer-panel speaks the locale', () => {
  it('names the controls and the placeholder in Spanish; labels win', () => {
    const view = renderIn(
      <ComposerPanel
        attachments={[{ id: 'a', name: 'Brief.docx', kind: 'document' }]}
        onRemoveAttachment={jest.fn()}
      />,
    );
    expect(view.getByLabelText('Enviar mensaje')).toBeTruthy();
    expect(view.getByPlaceholderText('Hola, ¿qué necesitas hoy?')).toBeTruthy();
    expect(view.getByLabelText('Quitar Brief.docx')).toBeTruthy();
    view.unmount();
    expect(renderIn(<ComposerPanel labels={{ send: 'Go' }} />).getByLabelText('Go')).toBeTruthy();
  });

  it('names the context meter in the locale', () => {
    expect(
      renderIn(<ComposerPanelStatusTab context={57} />).getByLabelText('Contexto 57 %'),
    ).toBeTruthy();
  });
});

describe('ai-chat speaks the locale', () => {
  it('names the feedback row in Spanish; labels win', () => {
    const view = renderIn(
      <AiChatFeedbackRow onLike={jest.fn()} onDislike={jest.fn()} onCopy={jest.fn()} />,
    );
    expect(view.getByLabelText('Buena respuesta')).toBeTruthy();
    expect(view.getByLabelText('Copiar respuesta')).toBeTruthy();
    view.unmount();
    expect(
      renderIn(<AiChatFeedbackRow onLike={jest.fn()} labels={{ like: 'Nice' }} />).getByLabelText(
        'Nice',
      ),
    ).toBeTruthy();
  });

  it('counts uncommitted changes with plurals', () => {
    const one = renderIn(<AiChatCodePanel code="x" changeCount={1} actions={[]} />);
    expect(one.getByText('1 cambio sin confirmar')).toBeTruthy();
    one.unmount();
    const many = renderIn(<AiChatCodePanel code="x" changeCount={12} actions={[]} />);
    expect(many.getByText('12 cambios sin confirmar')).toBeTruthy();
  });
});
