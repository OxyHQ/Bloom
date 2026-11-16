import { useState } from 'react';
import type { TextInputInstance } from 'react-native';
import { AppShell, usePanelSessionFocus, usePanelSessionState } from './.source/app-shell';
import { Screen } from './.source/screen';
import { PageHeader } from './.source/page-header';
import { Textarea } from './.source/textarea';
import { Button } from './.source/button';
import { Text } from './.source/typography';
import { StyledView as View } from './.source/styles/styled-primitives';

function Draft({ adapt }: { adapt: () => void }) {
  const [draft, setDraft] = usePanelSessionState('comment-draft', '');
  const focus = usePanelSessionFocus<TextInputInstance>('comment-input');
  return (
    <Screen kind="form" header={<PageHeader title="Inspector draft" />}>
      <View className="gap-4 p-4">
        <Button testID="native-session-adapt" onPress={() => setTimeout(adapt, 3000)}>
          Adapt after 3s
        </Button>
        <Textarea
          testID="native-session-input"
          inputRef={focus.ref}
          value={draft}
          onChangeText={setDraft}
          onFocus={focus.onFocus}
          onBlur={focus.onBlur}
          onSelectionChange={focus.onSelectionChange}
          placeholder="Inspector draft"
        />
        <Text testID="native-session-value">Draft: {draft}</Text>
      </View>
    </Screen>
  );
}

/** Real inline/sheet remount: the draft lives in the shared panel session. */
export function PanelSessionLab() {
  const [floating, setFloating] = useState(false);
  const [open, setOpen] = useState(true);
  return (
    <AppShell
      layout="workspace"
      presentation="continuous"
      scroll="fixed"
      panelLayout={{
        axis: 'vertical',
        panels: [
          {
            id: 'document',
            role: 'main',
            minHeight: 100,
            content: (
              <Screen header={<PageHeader title="Session continuity" />}>
                <Button testID="native-session-open" onPress={() => setOpen(true)}>
                  Open inspector
                </Button>
                <Text>{floating ? 'Floating' : 'Inline'}</Text>
              </Screen>
            ),
          },
          {
            id: 'inspector',
            role: 'inspector',
            visible: open,
            minHeight: 220,
            floating: floating
              ? {
                  below: 'md',
                  open,
                  onOpenChange: setOpen,
                  label: 'Inspector draft',
                  placement: 'bottom',
                }
              : undefined,
            content: <Draft adapt={() => setFloating((current) => !current)} />,
          },
        ],
      }}
    />
  );
}
