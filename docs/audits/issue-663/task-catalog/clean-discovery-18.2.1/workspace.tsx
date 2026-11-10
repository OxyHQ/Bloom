import type { ReactNode } from 'react';
import { AppShell } from '@oxy.so/bloom/app-shell';
import { PageHeader } from '@oxy.so/bloom/page-header';
import { Screen, ScreenScrollView } from '@oxy.so/bloom/screen';

/** Mount under the application's BloomProvider in a bounded host. */
export function Workspace({ document, inspector }: { document: ReactNode; inspector: ReactNode }) {
  return (
    <AppShell
      header={null}
      scroll="fixed"
      contentMaxWidth="none"
      panelLayout={{
        mode: 'split',
        flow: 'bounded',
        appearance: 'joined',
        axis: { base: 'vertical', lg: 'horizontal' },
        activePanel: 'document',
        panels: [
          {
            id: 'document',
            span: 2,
            content: (
              <Screen header={<PageHeader title="Document" />}>
                <ScreenScrollView>{document}</ScreenScrollView>
              </Screen>
            ),
          },
          {
            id: 'inspector',
            span: 1,
            content: (
              <Screen header={<PageHeader title="Details" />}>
                <ScreenScrollView>{inspector}</ScreenScrollView>
              </Screen>
            ),
          },
        ],
      }}
    />
  );
}
