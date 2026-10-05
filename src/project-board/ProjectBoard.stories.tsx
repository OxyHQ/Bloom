import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProjectBoard } from './ProjectBoard';
const meta: Meta<typeof ProjectBoard> = {
  title: 'Application/Project Board',
  component: ProjectBoard,
  args: {
    initialColumns: [
      {
        id: 'backlog',
        title: 'Backlog',
        limit: 8,
        tickets: [
          {
            id: 'B-1',
            title: 'Prepare launch',
            code: 'B-1',
            area: 'Design',
            since: 'Now',
            priority: 'High',
            project: 'Bloom',
            assignees: [],
          },
        ],
      },
      { id: 'done', title: 'Done', limit: 8, tickets: [] },
    ],
  },
};
export default meta;
type Story = StoryObj<typeof ProjectBoard>;
export const Basic: Story = {};
