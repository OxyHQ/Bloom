/** Isolated native acceptance fixture; never imported by a product entrypoint. */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Keyboard, View, TextInput, findNodeHandle } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BloomProvider } from '@oxy.so/bloom/provider';
import { AppShell } from '@oxy.so/bloom/app-shell';
import { Screen, ScreenScrollView } from '@oxy.so/bloom/screen';
import { Button } from '@oxy.so/bloom/button';
import { Text } from '@oxy.so/bloom/typography';
import {
  BlockEditor,
  EditorToolbar,
  EditorController,
  EditorStore,
  documentFromSnapshot,
} from '@oxy.so/bloom-editor';

function Fixture() {
  const [persistTaps, setPersistTaps] = useState<'handled' | 'always'>('handled');
  const [claimInput, setClaimInput] = useState(false);
  useEffect(() => { (globalThis as { editor434Claim?: boolean }).editor434Claim = claimInput; }, [claimInput]);
  const [store] = useState(() => {
    let id = 0;
    const newId = () => `fixture-${++id}`;
    return new EditorStore({
      newId,
      document: documentFromSnapshot(
        [
          {
            type: 'paragraph',
            text: [
              { text: 'Before ' },
              { text: 'linked', link: 'https://example.test/link' },
              { text: ' after' },
            ],
          },
          { type: 'paragraph', text: [{ text: 'Second editable paragraph' }] },
        ],
        newId,
      ),
    });
  });
  const [controller] = useState(() => new EditorController(store));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const ui = useSyncExternalStore(controller.ui.subscribe, controller.ui.get);
  const [ime, setIme] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setIme(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setIme(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const state = JSON.stringify({
    ime,
    persistTaps,
    claimInput,
    focused: ui.focused,
    linking: ui.linking,
    selection: snapshot.selection,
    blocks: snapshot.doc.blocks,
  });
  useEffect(() => {
    console.info('EDITOR434', state);
  }, [state]);
  const select = (start: number, end = start) => {
    store.setSelection({ kind: 'text', blockId: 'fixture-1', start, end });
    controller.refocus();
  };
  return (
    <Screen
      bottomBarKeyboardBehavior="follow"
      bottomBar={<EditorToolbar controller={controller} />}
    >
      <ScreenScrollView keyboardShouldPersistTaps={persistTaps} onResponderRelease={() => console.info('EDITOR434_SCROLL_RELEASE', findNodeHandle(TextInput.State.currentlyFocusedInput()))}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Button testID="editor-caret-outside" onPress={() => select(2)}>
            Caret outside
          </Button>
          <Button testID="editor-caret-inside" onPress={() => select(9)}>
            Caret inside
          </Button>
          <Button testID="editor-range" onPress={() => select(0, 6)}>
            Select before
          </Button>
        </View>
        <BlockEditor
          store={store}
          controller={controller}
          slashItems={[]}
          onOpenLink={(href) => console.info('EDITOR434_OPEN', href)}
        />
        <Text testID="editor-native-state">
          {JSON.stringify({
            ime,
    persistTaps,
    claimInput,
            focused: ui.focused,
            linking: ui.linking,
            selection: snapshot.selection,
          })}
        </Text>
          <Button testID="editor-scroll-taps" onPress={() => setPersistTaps(persistTaps === 'handled' ? 'always' : 'handled')}>Scroll taps: {persistTaps}</Button>
        <Button testID="editor-claim-input" onPress={() => setClaimInput(!claimInput)}>Claim input taps: {claimInput ? 'yes' : 'no'}</Button>
      </ScreenScrollView>
    </Screen>
  );
}
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <BloomProvider fonts={false} mode="light">
            <AppShell scroll="fixed">
              <Fixture />
            </AppShell>
          </BloomProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
