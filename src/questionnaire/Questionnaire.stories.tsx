import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { Questionnaire } from './index';
import type { QuestionnaireAnswers, QuestionnaireQuestion } from './types';

const meta: Meta<typeof Questionnaire> = {
  title: 'Blocks/Questionnaire',
  component: Questionnaire,
  decorators: [
    (Story) => (
      <View style={{ padding: 40, width: 560 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Questionnaire>;

/** Plan-mode questions an agent asks before a migration. */
const QUESTIONS: QuestionnaireQuestion[] = [
  {
    id: 'scope',
    question: 'Which parts of the app should the migration cover?',
    options: [
      { value: 'api', label: 'API routes', description: 'Move handlers to the new router' },
      { value: 'db', label: 'Database layer', description: 'Swap the ORM and regenerate types' },
      { value: 'ui', label: 'Frontend', description: 'Update data fetching hooks' },
    ],
    other: true,
  },
  {
    id: 'tests',
    question: 'How should we handle the test suite?',
    select: 'single',
    options: [
      { value: 'keep', label: 'Keep existing tests', description: 'Adapt them as we go' },
      { value: 'rewrite', label: 'Rewrite from scratch', description: 'Start clean with the new stack' },
    ],
    other: true,
  },
  {
    id: 'ship',
    question: 'When should this ship?',
    select: 'single',
    options: [
      { value: 'now', label: 'This week' },
      { value: 'later', label: 'Next sprint' },
    ],
  },
];

/** Checkbox rows; Next advances. */
export const MultipleSelect: Story = {
  args: { questions: QUESTIONS, onDismiss: () => {} },
};

/** Number-key rows; a pick advances after 180ms, and the digit keys pick too. */
export const SingleSelect: Story = {
  args: { questions: QUESTIONS, select: 'single', defaultStep: 1 },
};

/** Remembered answers: ticked rows, a filled "Other", a lifted pick. */
export const Answered: Story = {
  render: () => (
    <View style={{ gap: 24 }}>
      <Questionnaire
        testID="answered-multiple"
        questions={QUESTIONS}
        onDismiss={() => {}}
        defaultAnswers={{ scope: { values: ['db'], other: 'Auth too' } }}
      />
      <Questionnaire
        testID="answered-single"
        questions={QUESTIONS}
        defaultStep={1}
        defaultAnswers={{ tests: { values: ['rewrite'] } }}
      />
    </View>
  ),
};

/** Without a dismiss handler the prompt spans the full width. */
export const WithoutDismiss: Story = {
  args: { questions: QUESTIONS },
};

/** The last question swaps Next for Done. */
export const LastStep: Story = {
  args: { questions: QUESTIONS, defaultStep: 2, onDismiss: () => {} },
};

/** A reworded "Other" row and custom step pill labels. */
export const CustomLabels: Story = {
  args: {
    questions: [
      {
        ...QUESTIONS[0]!,
        stepLabel: 'Scope',
        other: { label: 'Something else', placeholder: 'Describe it' },
      },
      { ...QUESTIONS[1]!, stepLabel: 'Tests' },
      { ...QUESTIONS[2]!, stepLabel: 'Timing' },
    ],
    labels: { previous: 'Back', next: 'Continue', complete: 'Start plan' },
  },
};

/** A realistic thread: the card sits under the agent's message and reports the answers. */
export const Demo: Story = {
  render: function DemoStory() {
    const [done, setDone] = useState<QuestionnaireAnswers | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [key, setKey] = useState(0);
    return (
      <View style={{ gap: 16 }}>
        <Text variant="body-regular">
          Before I draft the migration plan, a few quick questions.
        </Text>
        {dismissed ? (
          <Text variant="body-regular" onPress={() => { setDismissed(false); setKey((k) => k + 1); }}>
            Questions dismissed — tap to ask again.
          </Text>
        ) : (
          <Questionnaire
            key={key}
            testID="demo"
            questions={QUESTIONS}
            onDismiss={() => setDismissed(true)}
            onComplete={setDone}
          />
        )}
        {done ? (
          <Text variant="caption-1-regular" style={{ fontFamily: 'monospace' }}>
            {JSON.stringify(done, null, 2)}
          </Text>
        ) : null}
      </View>
    );
  },
};
