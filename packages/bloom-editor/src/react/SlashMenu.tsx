import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BlockId } from '../model/document';
import { filterSlashItems, type SlashItem } from '../model/slash';
import { useEditorContext } from './context';
import { useUi } from './ui-store';

/**
 * The slash menu under a block: filtered as the query is typed, grouped by
 * section, with the highlighted item the one Return picks. One list order is
 * used for highlighting, Return and rendering, so they always agree.
 */
export function SlashMenu({
  blockId,
  onChoose,
}: {
  blockId: BlockId;
  onChoose: (item: SlashItem) => void;
}) {
  const { ui, theme, labels, slashItems } = useEditorContext();
  const slash = useUi(ui, (s) => (s.slash?.blockId === blockId ? s.slash : null));
  const matches = useMemo(
    () => (slash ? filterSlashItems(slashItems, slash.query) : []),
    [slash, slashItems],
  );
  if (!slash) return null;

  return (
    <View
      style={[styles.menu, { backgroundColor: theme.background, borderColor: theme.border }]}
      accessibilityRole="menu"
    >
      {matches.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textMuted }]}>{labels.slashNoResults}</Text>
      ) : (
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="always">
          {matches.map((item, index) => {
            const showGroup = index === 0 || matches[index - 1]?.group !== item.group;
            const active = index === slash.highlighted;
            return (
              <View key={item.id}>
                {showGroup && slash.query === '' ? (
                  <Text style={[styles.group, { color: theme.textMuted }]}>
                    {labels.slashGroups[item.group] ?? item.group}
                  </Text>
                ) : null}
                <Pressable
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: active }}
                  aria-selected={active}
                  onHoverIn={() => ui.set({ slash: { ...slash, highlighted: index } })}
                  onPress={() => onChoose(item)}
                  style={[styles.item, active && { backgroundColor: theme.selection }]}
                >
                  <Text style={[styles.label, { color: theme.text }]}>{item.label}</Text>
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
