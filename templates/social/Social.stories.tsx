import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SocialTemplate } from './SocialTemplate';

const meta = {
  title: 'Templates/Social', component: SocialTemplate,
  parameters: { layout: 'fullscreen', bloomScroll: 'document' },
  args: { authenticated: true, onNewPost: fn(), showRightColumn: true, centerWidth: 620, rightColumnWidth: 350, framedContent: true, tallContext: false, gutter: 8 },
  argTypes: {
    headerActions: { control: false },
    authenticated: { control: 'boolean', description: 'Signed-in composer or public sign-in view.' },
    onNewPost: { control: false, description: 'Primary sidebar action; opens the demo composer and is logged in Actions.' },
    gutter: { control: { type: 'range', min: 8, max: 40, step: 4 }, description: 'Shared gutter for the panel frame, mask and sticky header.' },
    framedContent: { control: 'boolean', description: 'Wrap the reading column in Bloom’s tonal ContentPanel.' },
    showRightColumn: { control: 'boolean', description: 'Show the contextual column from 1180px.' },
    rightColumnWidth: { control: { type: 'range', min: 280, max: 400, step: 10 }, description: 'Width reserved for widgets beside the reading column.' },
    centerWidth: { control: { type: 'range', min: 480, max: 650, step: 10 }, description: 'Maximum reading width; contracts on smaller screens.' },
    tallContext: { control: 'boolean', description: 'Verify a context column taller than the viewport still uses document scroll.' },
  },
} satisfies Meta<typeof SocialTemplate>;
export default meta;
type Story = StoryObj<typeof meta>;
export const LightOlive: Story = { globals: { theme: 'light', colorPreset: 'olive' } };
export const DarkOlive: Story = {
  args: {
    authenticated: false
  },

  globals: { theme: 'dark', colorPreset: 'olive' }
};
export const Copper: Story = { globals: { theme: 'dark', colorPreset: 'copper-field' } };
export const OpenColumns: Story = { globals: { theme: 'light', colorPreset: 'olive' }, args: { framedContent: false } };
export const TallContext: Story = { globals: { theme: 'light', colorPreset: 'olive' }, args: { tallContext: true } };
