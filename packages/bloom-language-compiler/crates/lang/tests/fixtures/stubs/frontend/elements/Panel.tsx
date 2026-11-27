// A sheet's TS panel (Mention's PostItem sheets, lang-mention-9's ts-element).
export function Panel({ title, onClose }: { title: string; onClose: () => void }) {
  void onClose;
  return <>{title}</>;
}
