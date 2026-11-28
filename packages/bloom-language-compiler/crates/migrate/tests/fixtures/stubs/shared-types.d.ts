export interface LaneSummary {
  id: string;
  name: string;
  displayMode: 'tab' | 'mixed' | 'hidden';
}
export interface CrosspostVariant {
  postId: string;
  label: string;
  rendered: boolean;
}
export interface CrosspostProvenance {
  variants: CrosspostVariant[];
}
