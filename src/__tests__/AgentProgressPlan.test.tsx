/**
 * @jest-environment jsdom
 */

// Real react-native-web, so the assertions read the ATTRIBUTES a browser sees.
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AgentProgressPlan, type AgentProgressPlanDecision } from '../agent-progress';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const STEPS = ['Read the files', 'Write the change'];

function mount(props: Partial<React.ComponentProps<typeof AgentProgressPlan>> = {}) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentProgressPlan testID="p" steps={STEPS} {...props} />
      </BloomThemeProvider>,
    );
  });
}

const approve = () => container.querySelector<HTMLElement>('[data-testid="p-approve"]');
const reject = () => container.querySelector<HTMLElement>('[data-testid="p-reject"]');
const status = () => container.querySelector<HTMLElement>('[data-testid="p-status"]')!;
const click = (el: HTMLElement | null) => act(() => el!.click());

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('AgentProgressPlan pending', () => {
  it('lists the steps under the default title with both actions named', () => {
    mount();
    expect(container.textContent).toContain('Proposed plan');
    const items = container.querySelectorAll('[role="listitem"]');
    expect([...items].map((item) => item.textContent)).toEqual(STEPS);
    expect(container.querySelector('[role="list"]')).not.toBeNull();
    expect(approve()?.textContent).toBe('Approve');
    expect(reject()?.textContent).toBe('Reject');
    expect(approve()?.getAttribute('role')).toBe('button');
    expect(container.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      'Plan decision',
    );
    expect(status().textContent).toBe('');
  });

  it('takes a title and labels', () => {
    mount({ title: 'Migration plan', approveLabel: 'Go ahead', rejectLabel: 'Not now' });
    expect(container.textContent).toContain('Migration plan');
    expect(approve()?.textContent).toBe('Go ahead');
    expect(reject()?.textContent).toBe('Not now');
  });

  it('fires each callback once per press and not the other', () => {
    const onApprove = jest.fn();
    const onReject = jest.fn();
    mount({ onApprove, onReject });
    click(approve());
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).not.toHaveBeenCalled();
    click(reject());
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('blocks both buttons while disabled', () => {
    const onApprove = jest.fn();
    const onReject = jest.fn();
    mount({ onApprove, onReject, disabled: true });
    click(approve());
    click(reject());
    expect(onApprove).not.toHaveBeenCalled();
    expect(onReject).not.toHaveBeenCalled();
    expect(approve()?.getAttribute('aria-disabled')).toBe('true');
    expect(reject()?.getAttribute('aria-disabled')).toBe('true');
  });

  it('blocks both buttons while a decision is sent, spinning the one pressed', () => {
    const onApprove = jest.fn();
    const onReject = jest.fn();
    mount({ onApprove, onReject });
    click(approve());
    mount({ onApprove, onReject, loading: true });
    click(approve());
    click(reject());
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).not.toHaveBeenCalled();
    expect(approve()?.getAttribute('aria-disabled')).toBe('true');
    expect(reject()?.getAttribute('aria-disabled')).toBe('true');
    expect(approve()?.getAttribute('aria-busy')).toBe('true');
    expect(reject()?.getAttribute('aria-busy')).not.toBe('true');
  });
});

describe.each([
  ['approved', 'Approved', 'Rejected'],
  ['rejected', 'Rejected', 'Approved'],
] as const)(
  'AgentProgressPlan %s',
  (decision: AgentProgressPlanDecision, shown: string, hidden: string) => {
    it('replaces the buttons with a status that is text', () => {
      mount({ decision });
      expect(approve()).toBeNull();
      expect(reject()).toBeNull();
      expect(container.querySelector('[role="group"]')).toBeNull();
      expect(status().getAttribute('role')).toBe('status');
      expect(status().textContent).toBe(shown);
      expect(container.textContent).not.toContain(hidden);
    });

    it('keeps the status region mounted from pending, so the change is announced', () => {
      mount();
      const region = status();
      mount({ decision });
      expect(status()).toBe(region);
      expect(region.textContent).toBe(shown);
    });
  },
);

describe('AgentProgressPlan rejected', () => {
  it('strikes the steps through', () => {
    mount({ decision: 'rejected' });
    const step = container.querySelector('[role="listitem"] [dir="auto"]') as HTMLElement;
    expect(step.style.textDecoration).toBe('line-through');
  });

  it('leaves them plain when approved', () => {
    mount({ decision: 'approved' });
    const step = container.querySelector('[role="listitem"] [dir="auto"]') as HTMLElement;
    expect(step.style.textDecoration).not.toBe('line-through');
  });
});

describe('AgentProgressPlan focus', () => {
  it('moves focus to the status after a press decides it', () => {
    mount();
    click(approve());
    mount({ decision: 'approved' });
    expect(document.activeElement).toBe(status());
  });

  it('leaves focus alone when the decision arrives from elsewhere', () => {
    mount();
    mount({ decision: 'approved' });
    expect(document.activeElement).not.toBe(status());
  });
});
