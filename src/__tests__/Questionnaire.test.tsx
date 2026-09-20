import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Questionnaire } from '../questionnaire';
import type { QuestionnaireQuestion } from '../questionnaire';
import { resolveQuestionnairePalette } from '../questionnaire/Questionnaire';
import { buildTheme } from '../theme/build-theme';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

const QUESTIONS: QuestionnaireQuestion[] = [
  {
    id: 'scope',
    question: 'Which parts?',
    options: [
      { value: 'api', label: 'API routes', description: 'Handlers' },
      { value: 'db', label: 'Database layer' },
      { value: 'ui', label: 'Frontend' },
    ],
    other: true,
  },
  {
    id: 'tests',
    question: 'Tests?',
    select: 'single',
    options: [
      { value: 'keep', label: 'Keep' },
      { value: 'rewrite', label: 'Rewrite' },
    ],
    other: { label: 'Something else', placeholder: 'Describe it' },
  },
];

function renderQ(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Questionnaire', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps the card and row geometry, in longhands', () => {
    const { getByTestId } = renderQ(<Questionnaire testID="q" questions={QUESTIONS} />);
    expect(resolvedStyle(getByTestId('q').props.style)).toMatchObject({
      borderRadius: 20,
      padding: 12,
      gap: 10,
      boxShadow: '0 4px 2px rgba(0, 0, 0, 0.02), 0 1px 0.5px rgba(0, 0, 0, 0.05)',
    });
    const row = resolvedStyle(getByTestId('q-option-api').props.style);
    expect(row).toMatchObject({
      borderRadius: 16,
      borderWidth: 1,
      paddingTop: 9,
      paddingBottom: 9,
      paddingLeft: 11,
      paddingRight: 19,
      gap: 16,
    });
    expect(row.paddingHorizontal).toBeUndefined();
  });

  it('toggles checkbox rows, reporting values in option order', () => {
    const onAnswersChange = jest.fn();
    const { getByTestId } = renderQ(
      <Questionnaire testID="q" questions={QUESTIONS} onAnswersChange={onAnswersChange} />,
    );
    const ui = getByTestId('q-option-ui');
    expect(ui.props.role).toBe('checkbox');
    expect(ui.props['aria-checked']).toBe(false);
    expect(ui.props.accessibilityLabel).toBe('Frontend');
    pressHost(ui);
    pressHost(getByTestId('q-option-api'));
    expect(onAnswersChange).toHaveBeenLastCalledWith({ scope: { values: ['api', 'ui'] } });
    expect(getByTestId('q-option-ui').props['aria-checked']).toBe(true);
  });

  it('selects the Other row by typing and keeps the draft when unticked', () => {
    const onAnswersChange = jest.fn();
    const { getByTestId } = renderQ(
      <Questionnaire testID="q" questions={QUESTIONS} onAnswersChange={onAnswersChange} />,
    );
    fireEvent.changeText(getByTestId('q-other-input'), 'Auth');
    expect(onAnswersChange).toHaveBeenLastCalledWith({ scope: { values: [], other: 'Auth' } });
    const toggle = getByTestId('q-other-toggle');
    expect(toggle.props['aria-checked']).toBe(true);
    pressHost(toggle);
    expect(onAnswersChange).toHaveBeenLastCalledWith({ scope: { values: [] } });
    expect(getByTestId('q-other-input').props.value).toBe('Auth');
  });

  it('advances a single-select pick after advanceDelay, and completes on the last step', () => {
    jest.useFakeTimers();
    const onStepChange = jest.fn();
    const onComplete = jest.fn();
    const { getByTestId, getByText } = renderQ(
      <Questionnaire
        testID="q"
        questions={[QUESTIONS[1]!, { ...QUESTIONS[1]!, id: 'last', question: 'Last?' }]}
        onStepChange={onStepChange}
        onComplete={onComplete}
        advanceDelay={180}
      />,
    );
    const keep = getByTestId('q-option-keep');
    expect(keep.props.role).toBe('button');
    expect(keep.props['aria-keyshortcuts']).toBe('1');
    pressHost(keep);
    expect(getByTestId('q-option-keep').props['aria-pressed']).toBe(true);
    act(() => {
      jest.advanceTimersByTime(179);
    });
    expect(onStepChange).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onStepChange).toHaveBeenCalledWith(1);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByText('Done')).toBeTruthy();
    pressHost(getByTestId('q-option-rewrite'));
    act(() => {
      jest.advanceTimersByTime(180);
    });
    expect(onComplete).toHaveBeenCalledWith({
      tests: { values: ['keep'] },
      last: { values: ['rewrite'] },
    });
  });

  it('submits a single-select free-text answer with Enter only when non-empty', () => {
    const onStepChange = jest.fn();
    const { getByTestId } = renderQ(
      <Questionnaire testID="q" questions={QUESTIONS} defaultStep={1} onStepChange={onStepChange} />,
    );
    const input = getByTestId('q-other-input');
    expect(input.props.placeholder).toBe('Describe it');
    fireEvent(input, 'submitEditing');
    expect(onStepChange).not.toHaveBeenCalled();
  });

  it('disables Previous on the first step and names the steps and the dismiss', () => {
    const onDismiss = jest.fn();
    const { getByTestId, queryByTestId, rerender } = renderQ(
      <Questionnaire testID="q" questions={QUESTIONS} onDismiss={onDismiss} />,
    );
    expect(getByTestId('q-previous').props.disabled).toBe(true);
    expect(getByTestId('q-next').props.disabled).toBeFalsy();
    const dismiss = getByTestId('q-dismiss');
    expect(dismiss.props.accessibilityLabel).toBe('Dismiss');
    pressHost(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    const pill = getByTestId('q-step-1');
    expect(pill.props['aria-pressed']).toBe(false);
    expect(getByTestId('q-step-0').props['aria-pressed']).toBe(true);
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Questionnaire testID="q" questions={QUESTIONS} />
      </BloomThemeProvider>,
    );
    expect(queryByTestId('q-dismiss')).toBeNull();
  });

  it('moves between questions from the step pills and reports the step', () => {
    const onStepChange = jest.fn();
    const { getByTestId, getByText } = renderQ(
      <Questionnaire testID="q" questions={QUESTIONS} onStepChange={onStepChange} />,
    );
    pressHost(getByTestId('q-step-1'));
    expect(onStepChange).toHaveBeenCalledWith(1);
    expect(getByTestId('q-step-1').props['aria-pressed']).toBe(true);
    expect(getByText('Tests?')).toBeTruthy();
  });

  it('uses canonical roles in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const theme = buildTheme('teal', mode);
      expect(resolveQuestionnairePalette(theme)).toMatchObject({
        surface: theme.colors.card,
        rowBorder: theme.colors.borderLight,
        rowBorderHover: theme.colors.border,
        rowHover: theme.colors.backgroundSecondary,
        key: theme.colors.backgroundSecondary,
        keyRaised: theme.colors.backgroundTertiary,
        ring: theme.colors.primary,
        pillSelected: theme.colors.primarySubtle,
        pillLabelSelected: theme.colors.primarySubtleForeground,
      });
    }
  });
});
