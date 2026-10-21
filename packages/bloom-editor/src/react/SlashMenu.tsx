import { SuggestionList, type SuggestionAnchor } from '@oxy.so/bloom/chat-composer';
import { useMemo } from 'react';
import type { BlockId } from '../model/document';
import { filterSlashItems, type SlashItem } from '../model/slash';
import { useEditorContext } from './context';
import { useUi } from './ui-store';

/** The editor owns the command; Bloom owns its anchored suggestion surface. */
export function SlashMenu({
  blockId,
  onChoose,
  anchor,
  listboxId,
}: {
  blockId: BlockId;
  onChoose: (item: SlashItem) => void;
  anchor: SuggestionAnchor;
  listboxId: string;
}) {
  const { ui, labels, slashItems, readOnly } = useEditorContext();
  const slash = useUi(ui, (s) => (s.slash?.blockId === blockId ? s.slash : null));
  const matches = useMemo(
    () => (slash ? filterSlashItems(slashItems, slash.query) : []),
    [slash, slashItems],
  );
  const suggestions = useMemo(
    () =>
      matches.map((item) => ({
        id: item.id,
        label: item.label,
        description: item.description,
        leading: item.leading,
        icon: item.icon,
        group: slash?.query === '' ? (labels.slashGroups[item.group] ?? item.group) : undefined,
      })),
    [matches, labels.slashGroups, slash?.query],
  );
  if (!slash || readOnly) return null;
  return (
    <SuggestionList
      kind="command"
      anchor={anchor}
      listboxId={listboxId}
      suggestions={suggestions}
      activeIndex={slash.highlighted}
      onActiveIndexChange={(highlighted) => {
        const current = ui.get().slash;
        if (current?.blockId === blockId) ui.set({ slash: { ...current, highlighted } });
      }}
      onSelectSuggestion={(_, index) => {
        const item = matches[index];
        if (item) onChoose(item);
      }}
      onOpenChange={(open) => {
        if (!open && ui.get().slash?.blockId === blockId) ui.set({ slash: null });
      }}
      showEmpty
      emptyLabel={labels.slashNoResults}
    />
  );
}
