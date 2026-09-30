import type { Meta, StoryObj } from '@storybook/react-vite';
import { MultiAgentChat } from './MultiAgentChat.web';
const meta: Meta<typeof MultiAgentChat> = {
  title: 'AI/Multi-agent Chat',
  component: MultiAgentChat,
  parameters: { layout: 'fullscreen' },
  args: { storageKey: null, style: { flex: 1, width: '100%' } },
};
export default meta;
export const Default: StoryObj<typeof MultiAgentChat> = {};
