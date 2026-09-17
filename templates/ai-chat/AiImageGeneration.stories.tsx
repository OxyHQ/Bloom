import type { Meta, StoryObj } from '@storybook/react-vite';

import { AiChatTemplate } from './AiChatTemplate';

/**
 * The AI chat shell opened on its image-generation thread: the thread renders
 * the generation frame and feedback row, and the right-hand panel is the
 * generations gallery instead of the code view.
 */
const meta: Meta = {
  title: 'Templates/AI Image Generation',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/** The image generates for four seconds, lands, and surfaces at the top of the gallery 0.9s later. */
export const Default: Story = {
  render: () => <AiChatTemplate defaultScenario="image-generation" />,
};
