import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { View } from 'react-native';
import { AppShell } from './index.web';
import { Screen, ScreenScrollView } from '../screen/index.web';

const meta: Meta = {
  id: 'composition-workspace-scroll-probe',
  title: 'Composition/Workspace/Scroll clearance',
};
export default meta;
type Story = StoryObj;
function Probe({ inline }: { inline: boolean }) {
  const [classed, setClassed] = useState(true);
  return (
    <View style={{ height: 400, width: 500 }}>
      <AppShell
        testID="shell"
        scroll="fixed"
        header={null}
        panelLayout={{
          flow: 'bounded',
          header: <View testID="header" style={{ height: 64 }} />,
          headerPlacement: 'scroll-under',
          panels: [
            {
              id: 'main',
              content: (
                <Screen scroll="auto" testID="route">
                  <ScreenScrollView
                    testID="body"
                    className="p-2"
                    style={inline ? { paddingVertical: 8 } : undefined}
                    contentContainerClassName={classed ? 'p-4 flex-1 justify-end' : undefined}
                  >
                    <button data-testid="toggle" onClick={() => setClassed((v) => !v)}>
                      Toggle
                    </button>
                    <input data-testid="draft" defaultValue="draft" />
                    <div data-testid="end">End</div>
                  </ScreenScrollView>
                </Screen>
              ),
            },
          ],
        }}
      />
    </View>
  );
}
export const Bounded: Story = { render: () => <Probe inline /> };
export const ClassPadding: Story = { render: () => <Probe inline={false} /> };
