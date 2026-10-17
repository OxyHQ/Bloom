/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root as DOMRoot } from 'react-dom/client';
import { fireEvent, within } from '@testing-library/dom';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { AgentCreator } from '../agent-creator/AgentCreator.web';
import { FOLD_CONFIG } from '../agent-avatar';
import type { AgentCreatorAgent } from '../agent-creator/types';
import { DirectionProvider } from '../direction';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement; let domRoot: DOMRoot;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); domRoot = createRoot(container); });
afterEach(() => { act(() => domRoot.unmount()); container.remove(); });
function render(node: React.ReactNode) { act(() => domRoot.render(node)); return { ...within(container), rerender: (next: React.ReactNode) => act(() => domRoot.render(next)) }; }

function Root({ children }: { children: React.ReactNode }) { return <BloomThemeProvider mode="light" fonts={false}>{children}</BloomThemeProvider>; }
const agent: AgentCreatorAgent = { id: 'designer', name: 'Designer', label: 'Design', description: 'Helpful designer', avatar: { ...FOLD_CONFIG, motion: 0 } };
it('renders avatar shape selection and emotion state as real web attributes', () => {
  const onChange = jest.fn();
  const view = render(<Root><AgentCreator agent={agent} onChange={onChange} /></Root>);
  const happy = view.getByRole('button', { name: 'Happy' });
  expect(happy.getAttribute('aria-pressed')).toBe('false'); act(() => { fireEvent.click(happy); });
  const next: AgentCreatorAgent = onChange.mock.calls[0][0];
  view.rerender(<Root><AgentCreator agent={next} onChange={onChange} /></Root>);
  expect(view.getByRole('button', { name: 'Happy' }).getAttribute('aria-pressed')).toBe('true');
  expect(view.getByRole('listbox').getAttribute('aria-label')).toBeTruthy();
  expect(view.getAllByRole('option').some(option => option.getAttribute('aria-selected') === 'true')).toBe(true);
});
it('emits scoped web locale/direction attributes without changing outside content', () => {
  const view = render(<DirectionProvider locale="ar"><div>داخل</div><DirectionProvider locale="en"><div>Inside</div></DirectionProvider></DirectionProvider>);
  expect(view.getByText('داخل').parentElement?.getAttribute('dir')).toBe('rtl');
  expect(view.getByText('Inside').parentElement?.getAttribute('dir')).toBe('ltr');
  expect(view.getByText('Inside').parentElement?.getAttribute('lang')).toBe('en');
});
