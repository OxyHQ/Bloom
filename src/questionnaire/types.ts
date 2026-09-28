import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** How a question's rows pick: checkboxes (`multiple`) or one row that advances (`single`). */
export type QuestionnaireSelect = 'single' | 'multiple';

export interface QuestionnaireOption {
  value: string;
  /** Row title. Text content — it is rendered inside a `Text`. */
  label: ReactNode;
  /** Secondary line under the title. Text content. */
  description?: ReactNode;
}

export interface QuestionnaireQuestion {
  id: string;
  /** The question itself, shown across the top of the card. */
  question: string;
  /** Overrides the card-level `select` for this question. */
  select?: QuestionnaireSelect;
  options: ReadonlyArray<QuestionnaireOption>;
  /** Adds a free-text "Other" row after the options; pass an object to reword it. */
  other?: boolean | { label?: string; placeholder?: string };
  /** Label for this question's step pill; "Step N" (in the locale) by default. */
  stepLabel?: string;
}

export interface QuestionnaireAnswer {
  /** Selected option values, in the question's option order. */
  values: string[];
  /** The free-text answer; present only while the "Other" row is selected. */
  other?: string;
}

/** Answers keyed by question id. */
export type QuestionnaireAnswers = Record<string, QuestionnaireAnswer>;

/** The card's fixed strings, overridable for localisation. */
export interface QuestionnaireLabels {
  /** `'Previous'` in English. */
  previous?: string;
  /** `'Next'` in English. */
  next?: string;
  /** Replaces Next on the last question. `'Done'` in English. */
  complete?: string;
  /** The free-text row's title (`'Other'` in English). */
  other?: string;
  /** `'Enter your custom answer here'` in English. */
  otherPlaceholder?: string;
  /** Names the corner dismiss button (`'Dismiss'` in English). */
  dismiss?: string;
  /** Names the step pill group (`'Steps'` in English). */
  steps?: string;
}

export interface QuestionnaireProps {
  questions: ReadonlyArray<QuestionnaireQuestion>;
  /** Selection mode for questions that do not set their own. Default `'multiple'`. */
  select?: QuestionnaireSelect;
  /** Zero-based index of the visible question (controlled). */
  step?: number;
  /** Initial step when uncontrolled. Default `0`. */
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  /** Controlled answers. */
  answers?: QuestionnaireAnswers;
  /** Initial answers when uncontrolled. */
  defaultAnswers?: QuestionnaireAnswers;
  onAnswersChange?: (answers: QuestionnaireAnswers) => void;
  /** Fires with every answer once the last question is answered. */
  onComplete?: (answers: QuestionnaireAnswers) => void;
  /** Shows the dismiss control in the corner and receives its press. */
  onDismiss?: () => void;
  /** How long a single-select pick stays visible before the next question slides in (ms). Default `180`. */
  advanceDelay?: number;
  labels?: QuestionnaireLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
