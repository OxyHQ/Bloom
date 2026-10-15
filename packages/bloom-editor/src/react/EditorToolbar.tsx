import { useSyncExternalStore } from 'react';
import { ScrollView, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { indent, outdent } from '../model/commands';
import type { EditorController } from './controller';
import { BarButton, FormatBar } from './FormatBar';
import { KeepFocus } from './KeepFocus';
import { DEFAULT_LABELS, type EditorLabels } from './labels';
import { DEFAULT_THEME, type EditorTheme } from './theme';
import { useUi } from './ui-store';

export interface EditorToolbarProps {
  controller: EditorController;
  theme?: EditorTheme;
  labels?: Partial<EditorLabels>;
  /** Offer a mention button that types this indicator (the one `mentions` listens for). */
  mentionIndicator?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The editing toolbar a touch device needs where there are no shortcuts:
 * marks, link, mention, indent, outdent, undo and redo for the block being
 * edited. Shown while a block has the keyboard; the app places it (above the
 * keyboard) and passes the same controller as `BlockEditor`.
 */
export function EditorToolbar({
  controller,
  theme = DEFAULT_THEME,
  labels,
  mentionIndicator,
  style,
}: EditorToolbarProps) {
  const merged = { ...DEFAULT_LABELS, ...labels };
  const { store, ui } = controller;
  const focused = useUi(ui, (s) => s.focused);
  const linking = useUi(ui, (s) => s.linking);
  const selection = useSyncExternalStore(store.subscribe, () => controller.textSelection);
  const canUndo = useSyncExternalStore(store.subscribe, () => store.getSnapshot().canUndo);
  const canRedo = useSyncExternalStore(store.subscribe, () => store.getSnapshot().canRedo);
  if ((!focused && !linking) || !selection) return null;
  const blockId = selection.blockId;
  const run = (command: Parameters<typeof store.run>[0]) => {
    store.sealHistory();
    store.run(command);
  };

  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel={merged.formatting}
      style={[
        styles.bar,
        { backgroundColor: theme.background, borderTopColor: theme.border },
        style,
      ]}
    >
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="always"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <FormatBar controller={controller} theme={theme} labels={merged} />
        {linking ? null : (
          <KeepFocus style={styles.row}>
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
            {mentionIndicator ? (
              <BarButton
                label={merged.mention}
                theme={theme}
                onPress={() => controller.startMention(mentionIndicator)}
              >
                <Text style={[styles.glyph, { color: theme.text }]}>{mentionIndicator}</Text>
              </BarButton>
            ) : null}
            <BarButton
              label={merged.outdent}
              theme={theme}
              onPress={() => run((c) => outdent(c, blockId))}
            >
              <Text style={[styles.glyph, { color: theme.text }]}>⇤</Text>
            </BarButton>
            <BarButton
              label={merged.indent}
              theme={theme}
              onPress={() => run((c) => indent(c, blockId))}
            >
              <Text style={[styles.glyph, { color: theme.text }]}>⇥</Text>
            </BarButton>
            <BarButton
              label={merged.undo}
              theme={theme}
              disabled={!canUndo}
              onPress={() => store.undo()}
            >
              <Text style={[styles.glyph, { color: theme.text }]}>↶</Text>
            </BarButton>
            <BarButton
              label={merged.redo}
              theme={theme}
              disabled={!canRedo}
              onPress={() => store.redo()}
            >
              <Text style={[styles.glyph, { color: theme.text }]}>↷</Text>
            </BarButton>
          </KeepFocus>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth },
  content: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  separator: { width: StyleSheet.hairlineWidth, height: 20, marginHorizontal: 6 },
  glyph: { fontSize: 16 },
});
