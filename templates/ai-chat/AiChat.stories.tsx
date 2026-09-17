import type { Meta, StoryObj } from '@storybook/react-vite';

import { AiChatTemplate } from './AiChatTemplate';

/**
 * The AI chat template: the floating sidebar with its repositories tree, the
 * chat container (breadcrumb header, scripted thread, glass composer and status
 * bar) and the resizable changes / code panel. Below 1280 the panel becomes a
 * right drawer; below 1024 the sidebar becomes a push drawer.
 */
const meta: Meta = {
  title: 'Templates/AI Chat',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/** The coding thread: the agent works through its steps, the composer lights up, then the code reply lands. */
export const Default: Story = {
  render: () => <AiChatTemplate defaultScenario="coding-scenario" />,
};

/** The landing-page thread: a longer conversation revealed a turn every two seconds. */
export const LandingPageDesign: Story = {
  render: () => <AiChatTemplate defaultScenario="landing-page-design" />,
};
