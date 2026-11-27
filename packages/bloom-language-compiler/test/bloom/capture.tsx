import type { ReactElement } from 'react';

/** What a TS caller that renders an element sees (a sheet's `render(close)`). */
export function capture(render: () => ReactElement): ReactElement {
  return render();
}

export function Panel({ title, onClose }: { title: string; onClose: () => void }) {
  void onClose;
  return <>{title}</>;
}
