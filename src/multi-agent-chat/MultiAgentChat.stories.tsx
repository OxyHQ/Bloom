import type { Meta, StoryObj } from '@storybook/react-vite';
import { MultiAgentChat } from './MultiAgentChat.web';
const meta: Meta<typeof MultiAgentChat> = { title: 'AI/Multi-agent Chat', component: MultiAgentChat, args: { storageKey: null, style: { minHeight: 760, width: '100%' } } };
export default meta;
export const Default: StoryObj<typeof MultiAgentChat> = {};
