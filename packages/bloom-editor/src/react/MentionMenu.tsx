import { SuggestionList, type SuggestionAnchor } from '@oxy.so/bloom/chat-composer';
import type { BlockId } from '../model/document';
import { type MentionItem, useEditorContext } from './context';
import { useUi } from './ui-store';

/** The same shared suggestion renderer, with application-provided mention results. */
export function MentionMenu({
  blockId,
  onChoose,
  anchor,
  listboxId,
}: {
  blockId: BlockId;
  onChoose: (item: MentionItem) => void;
  anchor: SuggestionAnchor;
  listboxId: string;
}) {
  const { ui, labels, readOnly } = useEditorContext();
  const mention = useUi(ui, (s) => (s.mention?.blockId === blockId ? s.mention : null));
  if (!mention || readOnly) return null;
  return (
    <SuggestionList
      kind="mention"
      anchor={anchor}
      listboxId={listboxId}
      suggestions={mention.items.map((item) => ({ ...item, id: mentionSuggestionId(item) }))}
      activeIndex={mention.highlighted}
      onActiveIndexChange={(highlighted) => {
        const current = ui.get().mention;
        if (current?.blockId === blockId) ui.set({ mention: { ...current, highlighted } });
      }}
      onSelectSuggestion={(_, index) => {
        const item = mention.items[index];
        if (item) onChoose(item);
      }}
      onOpenChange={(open) => {
        if (!open && ui.get().mention?.blockId === blockId) ui.set({ mention: null });
      }}
      loading={mention.loading}
      loadingLabel={labels.mentionSearching}
      showEmpty
      emptyLabel={labels.mentionNoResults}
    />
  );
}

/** A person and a page may have the same ID; keep their option IDs distinct. */
export function mentionSuggestionId(item: MentionItem): string {
  return JSON.stringify([item.group ?? '', item.id]);
}
