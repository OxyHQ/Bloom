/** Isolated native acceptance fixture; never imported by a product entrypoint. */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Keyboard, View } from 'react-native';
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
    <Screen bottomBar={<EditorToolbar controller={controller} />}>
      <ScreenScrollView>
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
            focused: ui.focused,
            linking: ui.linking,
            selection: snapshot.selection,
          })}
        </Text>
      </ScreenScrollView>
    </Screen>
  );
}
export default function App() {
  return (
    <BloomProvider fonts={false}>
      <AppShell>
        <Fixture />
      </AppShell>
    </BloomProvider>
  );
}
