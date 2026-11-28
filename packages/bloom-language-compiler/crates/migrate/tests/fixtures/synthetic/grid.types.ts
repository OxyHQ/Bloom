// A grid's entry and props, kept beside the grid (as Mention's `ProfileGridList.types.ts`).
export interface GridEntry {
  postId: string;
  mediaIndex?: number;
}

export interface CellProps {
  title: string;
  subtitle?: string;
  onOpen?: () => void;
}
