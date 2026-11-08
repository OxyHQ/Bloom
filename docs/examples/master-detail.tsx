import type { ReactNode } from 'react';
import { AppShell } from '@oxy.so/bloom/app-shell';
import { Screen, ScreenScrollView } from '@oxy.so/bloom/screen';

/** The router/store owns selected identity; resizing preserves panel IDs. */
export function MasterDetail({
  list,
  detail,
  selected,
}: {
  list: ReactNode;
  detail: ReactNode;
  selected: boolean;
}) {
  return (
    <AppShell
      header={null}
      scroll="fixed"
      contentMaxWidth="none"
      panelLayout={{
        mode: 'split',
        flow: 'bounded',
        appearance: 'joined',
        activePanel: selected ? 'detail' : 'list',
        panels: [
          {
            id: 'list',
            span: 1,
            content: (
              <Screen>
                <ScreenScrollView>{list}</ScreenScrollView>
              </Screen>
            ),
          },
          {
            id: 'detail',
            span: 2,
            content: (
              <Screen>
                <ScreenScrollView>{detail}</ScreenScrollView>
              </Screen>
            ),
          },
        ],
      }}
    />
  );
}
