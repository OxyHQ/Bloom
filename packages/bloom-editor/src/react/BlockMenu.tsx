import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  type CommandContext,
  composeCommands,
  duplicateBlocks,
  indent,
  moveBlocks,
  outdent,
  removeBlocks,
  setProps,
  turnInto,
} from '../model/commands';
import { childrenOf, positionOf } from '../model/document';
import type { Transaction } from '../model/operations';
import { useEditorContext } from './context';
import { BLOCK_COLOR_NAMES } from './theme';
import { useUi } from './ui-store';

/** Options for one block: turn into, colours, duplicate, move, delete. */
export function BlockMenu() {
  const { store, ui, theme, labels, slashItems, blockActions } = useEditorContext();
  const id = useUi(ui, (s) => s.blockMenu);
  const turnIntoItems = useMemo(
    () => slashItems.filter((item) => item.action.kind === 'block'),
    [slashItems],
  );
  const close = () => ui.set({ blockMenu: null });
  if (id === null || !store.doc.blocks[id]) return null;
  const block = store.doc.blocks[id];
  if (!block) return null;

  const act = (command: (ctx: CommandContext) => Transaction | null) => {
    close();
    store.sealHistory();
    store.run(command);
  };
  const { parent, index } = positionOf(store.doc, id);
  const siblings = childrenOf(store.doc, parent);
  const before = siblings[index - 1];
  const after = siblings[index + 1];

  const Row = ({
    label,
    onPress,
    active,
  }: {
    label: string;
    onPress: () => void;
    active?: boolean;
  }) => (
    <Pressable
      accessibilityRole="menuitem"
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        (pressed || active) && { backgroundColor: theme.selection },
      ]}
    >
      <Text style={[styles.itemText, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal transparent visible animationType="none" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={labels.blockMenu}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme.border }]}
        >
          <ScrollView>
            {blockActions.map((action) => (
              <Row
                key={action.id}
                label={action.label}
                onPress={() => {
                  close();
                  action.onPress(id);
                }}
              />
            ))}
            <Row label={labels.duplicate} onPress={() => act((c) => duplicateBlocks(c, [id]))} />
            <Row label={labels.delete} onPress={() => act((c) => removeBlocks(c, [id]))} />
            {before ? (
              <Row
                label={labels.moveUp}
                onPress={() => act((c) => moveBlocks(c, [id], before, 'before'))}
              />
            ) : null}
            {after ? (
              <Row
                label={labels.moveDown}
                onPress={() => act((c) => moveBlocks(c, [id], after, 'after'))}
              />
            ) : null}
            {before ? (
              <Row label={labels.indent} onPress={() => act((c) => indent(c, id))} />
            ) : null}
            {parent !== null ? (
              <Row label={labels.outdent} onPress={() => act((c) => outdent(c, id))} />
            ) : null}

            <Text style={[styles.section, { color: theme.textMuted }]}>{labels.turnInto}</Text>
            {turnIntoItems.map((item) =>
              item.action.kind === 'block' ? (
                <Row
                  key={item.id}
                  label={item.label}
                  active={block.type === item.action.type}
                  onPress={() => {
                    const action = item.action;
                    if (action.kind !== 'block') return;
                    act((c) =>
                      composeCommands(c, [
                        (cc) => turnInto(cc, id, action.type),
                        (cc) => (action.props ? setProps(cc, id, action.props) : null),
                      ]),
                    );
                  }}
                />
              ) : null,
            )}

            <Text style={[styles.section, { color: theme.textMuted }]}>{labels.color}</Text>
            <View style={styles.swatches}>
              {BLOCK_COLOR_NAMES.map((name) => (
                <Pressable
                  key={`c-${name}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${labels.color}: ${labels.colorNames[name] ?? name}`}
                  onPress={() =>
                    act((c) => setProps(c, id, { color: name === 'default' ? undefined : name }))
                  }
                  style={[styles.swatch, { borderColor: theme.border }]}
                >
                  <Text
                    style={{
                      color: name === 'default' ? theme.text : theme.colors[name]?.text,
                      fontWeight: '600',
                    }}
                  >
                    A
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.section, { color: theme.textMuted }]}>{labels.background}</Text>
            <View style={styles.swatches}>
              {BLOCK_COLOR_NAMES.map((name) => (
                <Pressable
                  key={`b-${name}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${labels.background}: ${labels.colorNames[name] ?? name}`}
                  onPress={() =>
                    act((c) =>
                      setProps(c, id, { backgroundColor: name === 'default' ? undefined : name }),
                    )
                  }
                  style={[
                    styles.swatch,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.colors[name]?.background ?? theme.background,
                    },
                  ]}
                />
              ))}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '80%',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
  },
  item: { paddingHorizontal: 14, paddingVertical: 9, marginHorizontal: 6, borderRadius: 6 },
  itemText: { fontSize: 14 },
  section: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
