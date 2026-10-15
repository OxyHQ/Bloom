import { memo, type ReactNode, useCallback, useSyncExternalStore } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { insertBlockAfter, setProps } from '../model/commands';
import type { BlockId } from '../model/document';
import { specOf } from '../model/schema';
import { useBlock, useEditorContext } from './context';
import { TextBlock } from './TextBlock';
import { blockSpacing } from './typography';
import { useUi } from './ui-store';
import { blockDomId } from './block-dom';
import { startBlockDrag } from './drag';

const INDENT = 26;
const BULLETS = ['•', '◦', '▪'];

/** A list of sibling blocks; numbers consecutive numbered items. */
export function BlockList({ ids, depth }: { ids: readonly BlockId[]; depth: number }) {
  const { store } = useEditorContext();
  // Numbering needs the siblings' types; read them from the current document.
  const types = useSyncExternalStore(store.subscribe, () =>
    ids.map((id) => store.getSnapshot().doc.blocks[id]?.type ?? '').join('|'),
  );
  const kinds = types.split('|');
  let counter = 0;
  return (
    <>
      {ids.map((id, index) => {
        counter = kinds[index] === 'numbered_list_item' ? counter + 1 : 0;
        return <BlockRow key={id} id={id} depth={depth} number={counter} />;
      })}
    </>
  );
}

const BlockRow = memo(function BlockRow({
  id,
  depth,
  number,
}: {
  id: BlockId;
  depth: number;
  number: number;
}) {
  const { store, ui, theme, labels, renderers, readOnly } = useEditorContext();
  const block = useBlock(store, id);
  const selected = useUi(ui, (s) => s.selectedBlocks.includes(id));
  const hovered = useUi(ui, (s) => s.hovered === id);
  const dropHere = useUi(ui, (s) => (s.drag?.target === id ? s.drag.position : null));

  const updateProps = useCallback(
    (patch: Record<string, unknown>) => {
      store.sealHistory();
      store.run((c) => setProps(c, id, patch));
    },
    [id, store],
  );

  if (!block) return null;
  const spec = specOf(store.schema, block.type);
  const expanded = block.props.expanded !== false;
  const background =
    typeof block.props.backgroundColor === 'string'
      ? theme.colors[block.props.backgroundColor]?.background
      : undefined;
  const renderChildren = () =>
    block.children.length > 0 ? <BlockList ids={block.children} depth={depth + 1} /> : null;

  let content: ReactNode;
  const custom = renderers[block.type];
  if (custom) {
    content = custom({ block, readOnly, updateProps, renderChildren });
  } else if (spec.hasText) {
    content = <TextBlock block={block} />;
  } else if (block.type === 'divider') {
    content = <View style={[styles.divider, { backgroundColor: theme.border }]} />;
  } else {
    content = null;
  }

  const marker = (() => {
    switch (block.type) {
      case 'bulleted_list_item':
        return (
          <Text style={[styles.marker, { color: theme.text }]}>
            {BULLETS[depth % BULLETS.length]}
          </Text>
        );
      case 'numbered_list_item':
        return (
          <Text style={[styles.marker, styles.number, { color: theme.text }]}>{`${number}.`}</Text>
        );
      case 'todo': {
        const checked = block.props.checked === true;
        return (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={labels.checkbox}
            accessibilityState={{ checked }}
            aria-checked={checked}
            disabled={readOnly}
            onPress={() => updateProps({ checked: !checked })}
            style={[
              styles.checkbox,
              { borderColor: checked ? theme.accent : theme.textMuted },
              checked && { backgroundColor: theme.accent },
            ]}
          >
            {checked ? <Text style={[styles.check, { color: theme.accentText }]}>✓</Text> : null}
          </Pressable>
        );
      }
      case 'toggle':
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expanded ? labels.toggleOpen : labels.toggleClosed}
            accessibilityState={{ expanded }}
            aria-expanded={expanded}
            onPress={() => updateProps({ expanded: !expanded })}
            style={styles.markerButton}
          >
            <Text style={[styles.chevron, { color: theme.text }, expanded && styles.chevronOpen]}>
              ▸
            </Text>
          </Pressable>
        );
      case 'callout':
        return (
          <Text style={styles.calloutIcon}>
            {typeof block.props.icon === 'string' ? block.props.icon : '💡'}
          </Text>
        );
      default:
        return null;
    }
  })();

  const showsChildren =
    block.children.length > 0 && !custom && spec.canHaveChildren && !spec.isContainer && expanded;

  return (
    <View
      nativeID={blockDomId(id)}
      onPointerEnter={
        Platform.OS === 'web' && !readOnly ? () => ui.set({ hovered: id }) : undefined
      }
      onPointerLeave={
        Platform.OS === 'web' && !readOnly
          ? () => {
              if (ui.get().hovered === id) ui.set({ hovered: null });
            }
          : undefined
      }
      style={[
        styles.block,
        { marginTop: blockSpacing(block.type) },
        selected && { backgroundColor: theme.selection },
      ]}
    >
      <View
        style={[
          styles.row,
          block.type === 'callout' && [
            styles.callout,
            { backgroundColor: background ?? theme.codeBackground },
          ],
          block.type === 'code' && [styles.code, { backgroundColor: theme.codeBackground }],
          block.type !== 'callout' && background !== undefined && { backgroundColor: background },
          dropHere === 'inside' && { backgroundColor: theme.selection },
        ]}
      >
        {Platform.OS === 'web' && !readOnly ? <Gutter id={id} visible={hovered} /> : null}
        {block.type === 'quote' ? (
          <View style={[styles.quoteBar, { backgroundColor: theme.text }]} />
        ) : null}
        {marker ? <View style={styles.markerBox}>{marker}</View> : null}
        <View style={styles.content}>{content}</View>
      </View>
      {/* Drop lines come after the row: drag and drop measures a block by its
          first child, which must stay the row. */}
      {dropHere === 'before' ? (
        <View style={[styles.dropLine, styles.dropTop, { backgroundColor: theme.accent }]} />
      ) : null}
      {showsChildren ? <View style={{ paddingLeft: INDENT }}>{renderChildren()}</View> : null}
      {dropHere === 'after' ? (
        <View style={[styles.dropLine, styles.dropBottom, { backgroundColor: theme.accent }]} />
      ) : null}
    </View>
  );
});

/** The web gutter: add-below and the drag handle that also opens the block menu. */
function Gutter({ id, visible }: { id: BlockId; visible: boolean }) {
  const { store, ui, theme, labels } = useEditorContext();
  return (
    <View style={[styles.gutter, { opacity: visible ? 1 : 0 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labels.addBelow}
        onPress={() => {
          store.sealHistory();
          store.run((c) => insertBlockAfter(c, id, 'paragraph'));
        }}
        style={styles.gutterButton}
      >
        <Text style={[styles.gutterGlyph, { color: theme.textMuted }]}>+</Text>
      </Pressable>
      {/* Drag starts on the raw pointer-down: a Pressable delays its press-in
          and cancels it when the pointer moves, so a quick drag never began. */}
      <View
        onPointerDown={(event) =>
          startBlockDrag(store, ui, id, { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY })
        }
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.blockMenu}
          onPress={() => {
            if (!ui.get().drag) ui.set({ blockMenu: id });
          }}
          style={styles.gutterButton}
        >
          <Text style={[styles.gutterGlyph, { color: theme.textMuted }]}>⋮⋮</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { position: 'relative', borderRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 4 },
  content: { flex: 1, minWidth: 0 },
  markerBox: { width: 24, alignItems: 'center', paddingTop: 2 },
  marker: { fontSize: 16, lineHeight: 24 },
  number: { fontVariant: ['tabular-nums'] },
  markerButton: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  chevron: { fontSize: 13, transform: [{ rotate: '0deg' }] },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 3,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { fontSize: 11, lineHeight: 13, fontWeight: '700' },
  calloutIcon: { fontSize: 18, lineHeight: 24 },
  callout: { padding: 12, gap: 6 },
  code: { borderRadius: 4 },
  quoteBar: { width: 3, alignSelf: 'stretch', marginRight: 12, borderRadius: 1 },
  divider: { height: 1, marginVertical: 12 },
  gutter: { position: 'absolute', left: -52, top: 0, flexDirection: 'row' },
  gutterButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  gutterGlyph: { fontSize: 14, fontWeight: '600' },
  dropLine: { position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 2, zIndex: 10 },
  dropTop: { top: -2 },
  dropBottom: { bottom: -2 },
});
