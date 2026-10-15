import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BlockId } from '../model/document';
import { type MentionItem, useEditorContext } from './context';
import { useUi } from './ui-store';

/** The mention menu under a block: the matches for what was typed after `@`, grouped. */
export function MentionMenu({
  blockId,
  onChoose,
}: {
  blockId: BlockId;
  onChoose: (item: MentionItem) => void;
}) {
  const { ui, theme, labels } = useEditorContext();
  const mention = useUi(ui, (s) => (s.mention?.blockId === blockId ? s.mention : null));
  if (!mention) return null;
  const { items } = mention;

  return (
    <View
      style={[styles.menu, { backgroundColor: theme.background, borderColor: theme.border }]}
      accessibilityRole="menu"
    >
      {items.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textMuted }]} accessibilityLiveRegion="polite">
          {mention.loading ? labels.mentionSearching : labels.mentionNoResults}
        </Text>
      ) : (
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="always">
          {items.map((item, index) => {
            const showGroup = item.group && (index === 0 || items[index - 1]?.group !== item.group);
            const active = index === mention.highlighted;
            return (
              <View key={`${item.group ?? ''}:${item.id}`}>
                {showGroup ? (
                  <Text style={[styles.group, { color: theme.textMuted }]}>{item.group}</Text>
                ) : null}
                <Pressable
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: active }}
                  aria-selected={active}
                  onHoverIn={() => ui.set({ mention: { ...mention, highlighted: index } })}
                  onPress={() => onChoose(item)}
                  style={[styles.item, active && { backgroundColor: theme.selection }]}
                >
                  <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {item.description ? (
                    <Text
                      style={[styles.description, { color: theme.textMuted }]}
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: 50,
    width: 300,
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  scroll: { maxHeight: 320 },
  group: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  item: { paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 4, borderRadius: 4 },
  label: { fontSize: 14 },
  description: { fontSize: 12, marginTop: 1 },
  empty: { fontSize: 13, paddingHorizontal: 12, paddingVertical: 8 },
});
