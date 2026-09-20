import type { Meta, StoryObj } from '@storybook/react-vite';

import { AiChatTemplate } from './AiChatTemplate';

/**
 * The AI chat template: the floating sidebar with its repositories tree, the
 * chat container (breadcrumb header, scripted thread, glass composer and status
 * bar) and the resizable changes / code panel. Below 1280 the panel becomes a
 * right drawer; below 1024 the sidebar becomes a push drawer.
 */
const meta: Meta<typeof AiChatTemplate> = {
  component: AiChatTemplate,
  args: { defaultScenario: 'coding-scenario' },
  argTypes: { defaultScenario: { name: 'Conversation', control: 'select', options: ['coding-scenario', 'landing-page-design', 'image-generation'], description: 'Changing the conversation restarts its scripted demo.' } },
  render: args => <AiChatTemplate key={args.defaultScenario} {...args} />,
  title: 'Templates/AI Chat',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof AiChatTemplate>;

/** The coding thread: the agent works through its steps, the composer lights up, then the code reply lands. */
export const Default: Story = {};

/** The landing-page thread: a longer conversation revealed a turn every two seconds. */
export const LandingPageDesign: Story = {
  args: { defaultScenario: 'landing-page-design' },
};

/** Reference views of the shared tonal surfaces, using the real app composition. */
export const TonalOlive: Story = {
  ...Default,
  globals: { theme: 'dark', colorPreset: 'olive' },
};

export const TonalCopper: Story = {
  ...Default,
  globals: { theme: 'dark', colorPreset: 'copper-field' },
};
