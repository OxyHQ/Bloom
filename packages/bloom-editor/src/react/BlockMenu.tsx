import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  type CommandContext,
  composeCommands,
  duplicateBlocks,
  indentBlocks,
  moveBlocks,
  outdentBlocks,
  setBlocksProps,
  setProps,
  canTurnInto,
  turnInto,
} from '../model/commands';
import { childrenOf, positionOf } from '../model/document';
import { type Schema, specOf } from '../model/schema';
import type { Transaction } from '../model/operations';
import { useEditorContext } from './context';
import { BLOCK_COLOR_NAMES } from './theme';
import { useUi } from './ui-store';

/**
 * Whether `block` is what turning it into `action` would make it. A heading
 * and a toggle heading share a type; the prop that lets one hold children
 * (`childrenWhen`) tells them apart, and nothing else does (a collapsed
 * toggle heading is still one).
 */
function isCurrent(
  schema: Schema,
  block: { type: string; props: Readonly<Record<string, unknown>> },
  action: { type: string; props?: Readonly<Record<string, unknown>> },
): boolean {
  if (block.type !== action.type) return false;
  const key = specOf(schema, action.type).childrenWhen;
  return !key || Boolean(action.props?.[key]) === Boolean(block.props[key]);
}

/**
 * Options for a block — turn into, colours, duplicate, move, delete — and,
 * when it is one of the selected blocks, for all of them.
 */
export function BlockMenu() {
  const { store, ui, theme, labels, slashItems, blockActions, onCopyBlockLink, requestRemove } =
    useEditorContext();
  const id = useUi(ui, (s) => s.blockMenu);
  const selected = useUi(ui, (s) => s.selectedBlocks);
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
  const targets = selected.includes(id) ? selected.filter((b) => store.doc.blocks[b]) : [id];
  const many = targets.length > 1;
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
            {onCopyBlockLink && !many ? (
              <Row
                label={labels.copyBlockLink}
                onPress={() => {
                  close();
                  onCopyBlockLink(id);
                }}
              />
            ) : null}
            <Row label={labels.duplicate} onPress={() => act((c) => duplicateBlocks(c, targets))} />
            <Row
              label={labels.delete}
              onPress={() => {
                close();
                requestRemove(targets);
              }}
            />
            {before && !many ? (
              <Row
                label={labels.moveUp}
                onPress={() => act((c) => moveBlocks(c, [id], before, 'before'))}
              />
            ) : null}
            {after && !many ? (
              <Row
                label={labels.moveDown}
                onPress={() => act((c) => moveBlocks(c, [id], after, 'after'))}
              />
            ) : null}
            {before || many ? (
              <Row label={labels.indent} onPress={() => act((c) => indentBlocks(c, targets))} />
            ) : null}
            {parent !== null || many ? (
              <Row label={labels.outdent} onPress={() => act((c) => outdentBlocks(c, targets))} />
            ) : null}

            <Text style={[styles.section, { color: theme.textMuted }]}>{labels.turnInto}</Text>
            {turnIntoItems.map((item) =>
              item.action.kind === 'block' && canTurnInto(store, id, item.action.type) ? (
                <Row
                  key={item.id}
                  label={item.label}
                  active={isCurrent(store.schema, block, item.action)}
                  onPress={() => {
                    const action = item.action;
                    if (action.kind !== 'block') return;
                    act((c) =>
                      composeCommands(
                        c,
                        targets.flatMap((target) => [
                          (cc: CommandContext) => turnInto(cc, target, action.type),
                          (cc: CommandContext) =>
                            action.props ? setProps(cc, target, action.props) : null,
                        ]),
                      ),
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
                    act((c) =>
                      setBlocksProps(c, targets, { color: name === 'default' ? undefined : name }),
                    )
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
                      setBlocksProps(c, targets, {
                        backgroundColor: name === 'default' ? undefined : name,
                      }),
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
