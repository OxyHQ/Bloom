import { Questionnaire } from '@bloom/questionnaire';
import type { Cases } from '../support/cases';

const QUESTIONS = [
  {
    id: 'q1',
    question: 'Which tabs should close?',
    detail: 'Three tabs are open.',
    options: [
      { value: 'a', label: 'Docs', description: 'oxy.so/docs' },
      { value: 'b', label: 'Mail' },
    ],
    other: true,
  },
  { id: 'q2', question: 'Confirm?', options: [{ value: 'y', label: 'Yes' }] },
];

export const CASES: Cases = {
  'Questionnaire single': () => <Questionnaire questions={QUESTIONS} testID="q" />,
  'Questionnaire multi answered': () => (
    <Questionnaire
      questions={QUESTIONS}
      select="multiple"
      defaultAnswers={{ q1: { values: ['a'], other: 'More' } }}
      onDismiss={() => {}}
      testID="q"
    />
  ),
};
