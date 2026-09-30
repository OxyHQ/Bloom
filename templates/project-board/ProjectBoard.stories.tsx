import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';
import { LocaleProvider as DirectionProvider } from '../../src/locale';
import { ProjectBoard } from '../../src/project-board';
import { ProjectBoardShell } from './ProjectBoardShell';
import { PROJECT_MEMBERS } from './project-board-data';
import {
  PROJECT_BOARD_DEMO_COLUMNS,
  ProjectBoardTemplate,
} from './ProjectBoardTemplate';

const meta: Meta<typeof ProjectBoardTemplate> = {
  title: 'Templates/Project Board',
  component: ProjectBoardTemplate,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story, context) =>
      context.name === 'Default' ? (
        <Story />
      ) : (
        <View style={{ width: '100%', height: '100%', padding: 24 }}>
          <Story />
        </View>
      ),
  ],
};
export default meta;
type Story = StoryObj<typeof ProjectBoardTemplate>;
export const Default: Story = { render: () => <ProjectBoardShell /> };
export const BoardOnly: Story = {};
export const Empty: Story = {
  render: () => (
    <ProjectBoard
      initialColumns={PROJECT_BOARD_DEMO_COLUMNS.map((column) => ({
        ...column,
        tickets: [],
      }))}
      members={PROJECT_MEMBERS}
      projects={['Bloom']}
    />
  ),
};
export const TicketDetail: Story = {
  render: () => (
    <ProjectBoard
      initialColumns={PROJECT_BOARD_DEMO_COLUMNS}
      members={PROJECT_MEMBERS}
      projects={['vibl', 'firstview', 'Bloom']}
      initialTicketId="ticket-ds-38"
    />
  ),
};
export const RightToLeft: Story = {
  render: () => (
    <DirectionProvider locale="ar">
      <ProjectBoardTemplate />
    </DirectionProvider>
  ),
};
