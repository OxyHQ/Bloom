import type React from 'react';
import { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { AppShellPanel, AppShellPanels } from '../app-shell';
import type { AppShellPanelLayout } from '../app-shell';
import { Screen } from '../screen';
import { Dialog, useDialogControl } from '../dialog';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>
);
it.each(['joined', 'separated', 'plain'] as const)(
  'measures one shared %s header and preserves drafts and open overlays as tracks change',
  (appearance) => {
    const mounted = jest.fn(),
      unmounted = jest.fn();
    function Editor() {
      const [draft, setDraft] = useState('Draft');
      const popup = useDialogControl();
      useEffect(() => {
        mounted();
        return unmounted;
      }, []);
      return (
        <Screen scroll="none">
          <TextInput testID="draft" value={draft} onChangeText={setDraft} />
          <Text onPress={() => popup.open()}>Open details</Text>
          <Dialog control={popup} title="Details">
            <Text>Keep this overlay</Text>
          </Dialog>
        </Screen>
      );
    }
    const layout: AppShellPanelLayout = {
      appearance,
      header: <Text>Shared workspace header</Text>,
      mode: 'split',
      panels: [
        { id: 'editor', content: <Editor /> },
        {
          id: 'updates',
          visible: false,
          width: 300,
          content: (
            <Screen scroll="none">
              <Text>Updates</Text>
            </Screen>
          ),
        },
      ],
    };
    const view = render(<AppShellPanels testID="panels" layout={layout} />, { wrapper });
    fireEvent(view.getByTestId('panels-workspace-header'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 1000, height: 44 } },
    });
    expect(resolvedStyle(view.getByTestId('panels-workspace-content').props.style).paddingTop).toBe(
      44,
    );
    fireEvent.changeText(view.getByTestId('draft'), 'Unsaved work');
    fireEvent.press(view.getByText('Open details'));
    expect(view.getByText('Keep this overlay')).toBeTruthy();
    const next = {
      ...layout,
      panels: [layout.panels[0]!, { ...layout.panels[1]!, visible: true }],
    };
    view.rerender(<AppShellPanels testID="panels" layout={next} />);
    expect(view.getByTestId('draft').props.value).toBe('Unsaved work');
    expect(view.getByText('Keep this overlay')).toBeTruthy();
    expect(mounted).toHaveBeenCalledTimes(1);
    expect(unmounted).not.toHaveBeenCalled();
    expect(view.getAllByText('Shared workspace header')).toHaveLength(1);
    expect(view.getAllByTestId('content-panel-surface')).toHaveLength(
      appearance === 'separated' ? 2 : 1,
    );
    if (appearance === 'plain') {
      expect(
        resolvedStyle(view.getByTestId('content-panel-surface').props.style).backgroundColor,
      ).toBe('transparent');
    }
    view.rerender(<AppShellPanels testID="panels" layout={{ ...next, header: null }} />);
    expect(view.getByTestId('draft').props.value).toBe('Unsaved work');
    expect(mounted).toHaveBeenCalledTimes(1);
    expect(resolvedStyle(view.getByTestId('panels-workspace-content').props.style).paddingTop).toBe(
      0,
    );
  },
);
it('allows the same header owner in an explicitly local workspace inside a page panel', () => {
  const view = render(
    <AppShellPanel>
      <Screen scroll="none">
        <AppShellPanels
          scope="local"
          testID="local"
          layout={{
            appearance: 'joined',
            header: <Text>Embedded header</Text>,
            panels: [
              {
                id: 'body',
                content: (
                  <Screen scroll="none">
                    <Text>Embedded body</Text>
                  </Screen>
                ),
              },
            ],
          }}
        />
      </Screen>
    </AppShellPanel>,
    { wrapper },
  );
  expect(view.getByText('Embedded header')).toBeTruthy();
  expect(view.getByText('Embedded body')).toBeTruthy();
});

it('inherits an enclosing surface without a second paint when no workspace header is needed', () => {
  const view = render(
    <AppShellPanels
      scope="local"
      layout={{
        appearance: 'plain',
        panels: [
          { id: 'versions', width: 320, content: <Text>Versions</Text> },
          { id: 'preview', content: <Text>Preview</Text> },
        ],
      }}
    />,
    { wrapper },
  );
  expect(view.getAllByTestId('content-panel-surface')).toHaveLength(1);
  expect(resolvedStyle(view.getByTestId('content-panel-surface').props.style).backgroundColor).toBe(
    'transparent',
  );
  expect(view.getByText('Versions')).toBeTruthy();
  expect(view.getByText('Preview')).toBeTruthy();
});
