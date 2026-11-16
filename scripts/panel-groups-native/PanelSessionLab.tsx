import { useCallback, useEffect, useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import {
  AppShell,
  useAppShellPanel,
  usePanelSessionFocus,
  usePanelSessionState,
} from './.source/app-shell';
import { Screen } from './.source/screen';
import { PageHeader } from './.source/page-header';
import { Textarea } from './.source/textarea';
import { Button } from './.source/button';
import { Text } from './.source/typography';
import { StyledView as View } from './.source/styles/styled-primitives';
import { DetailDialogLab } from './DetailDialogLab';

interface SelectionTrace {
  event: 'focus' | 'blur' | 'selection' | 'armed' | 'transition';
  presentation: 'inline' | 'floating';
  selection?: { start: number; end: number };
}

function Draft({
  adapt,
  trace,
  report,
  pending,
}: {
  adapt: () => void;
  trace: SelectionTrace[];
  report: (event: SelectionTrace) => void;
  pending: boolean;
}) {
  const [draft, setDraft] = usePanelSessionState('comment-draft', '');
  const focus = usePanelSessionFocus<TextInputInstance>('comment-input');
  const presentation = useAppShellPanel().presentation ?? 'inline';
  return (
    <Screen kind="form" header={<PageHeader title="Inspector draft" />}>
      <View className="gap-4 p-4">
        <Button testID="native-session-adapt" onPress={adapt} disabled={pending}>
          {pending ? 'Adapt queued' : 'Adapt after 8s'}
        </Button>
        <Textarea
          testID="native-session-input"
          inputRef={focus.ref}
          value={draft}
          onChangeText={setDraft}
          onFocus={() => {
            focus.onFocus();
            report({ event: 'focus', presentation });
          }}
          onBlur={() => {
            focus.onBlur();
            report({ event: 'blur', presentation });
          }}
          onSelectionChange={(event) => {
            focus.onSelectionChange(event);
            report({ event: 'selection', presentation, selection: event.nativeEvent.selection });
          }}
          placeholder="Inspector draft"
        />
        <Text testID="native-session-value">Draft: {draft}</Text>
        <Text testID="native-session-trace">
          {trace
            .map(
              (entry) =>
                `${entry.presentation} ${entry.event}${entry.selection ? ` [${entry.selection.start},${entry.selection.end}]` : ''}`,
            )
            .join('\n')}
        </Text>
      </View>
    </Screen>
  );
}

/** Real inline/sheet remount: the draft lives in the shared panel session. */
export function PanelSessionLab() {
  const [floating, setFloating] = useState(false);
  const [open, setOpen] = useState(true);
  const [pending, setPending] = useState(false);
  const [trace, setTrace] = useState<SelectionTrace[]>([]);
  const latestTrace = useRef<SelectionTrace[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const report = useCallback((event: SelectionTrace) => {
    latestTrace.current = [...latestTrace.current, event].slice(-8);
    setTrace(latestTrace.current);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const adapt = () => {
    if (timer.current) return;
    const presentation = floating ? 'floating' : 'inline';
    setPending(true);
    report({ event: 'armed', presentation });
    // Test-only delay leaves time to refocus after button-induced keyboard
    // movement, read the current input bounds, select, and capture the range.
    timer.current = setTimeout(() => {
      const lastSelection = [...latestTrace.current]
        .reverse()
        .find((entry) => entry.event === 'selection');
      report({ event: 'transition', presentation, selection: lastSelection?.selection });
      timer.current = null;
      setPending(false);
      setFloating((current) => !current);
    }, 8000);
  };
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
                <DetailDialogLab />
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
            content: <Draft adapt={adapt} trace={trace} report={report} pending={pending} />,
          },
        ],
      }}
    />
  );
}
