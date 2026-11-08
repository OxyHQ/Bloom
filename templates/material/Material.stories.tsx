import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useGlobals } from 'storybook/preview-api';
import { MaterialScene } from './MaterialScene';

const meta: Meta = {
  id: 'labs-material-comparison',
  title: 'Labs/Material Comparison',
  parameters: { layout: 'fullscreen' },
};
export default meta;
export const Comparison: StoryObj = {
  render: function Render() {
    const [globals, updateGlobals] = useGlobals();
    return (
      <MaterialScene
        buildLabel="Storybook source fixture"
        onToggleMode={() => updateGlobals({ theme: globals.theme === 'dark' ? 'light' : 'dark' })}
        onToggleTransparency={() =>
          updateGlobals({ material: globals.material === 'reduced' ? 'standard' : 'reduced' })
        }
      />
    );
  },
};
