import type { Meta, StoryObj } from '@storybook/react-vite';
import { MultiAgentChatTemplate } from './MultiAgentChatTemplate';
const meta: Meta<typeof MultiAgentChatTemplate> = {
  title: 'Templates/Multi-agent Chat',
  component: MultiAgentChatTemplate,
  parameters: { layout: 'fullscreen' },
};
export default meta;
export const Default: StoryObj<typeof MultiAgentChatTemplate> = {};
