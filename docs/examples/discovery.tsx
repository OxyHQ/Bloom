import type { ReactNode } from 'react';
import { AppShell } from '@oxy.so/bloom/app-shell';
import { PageHeader } from '@oxy.so/bloom/page-header';
import { Screen, ScreenScrollView } from '@oxy.so/bloom/screen';

/** Supply domain filters/results; use a VirtualList owner for large result sets. */
export function Discovery({ filters, results }: { filters: ReactNode; results: ReactNode }) {
  return (
    <AppShell header={null} scroll="fixed" contentMaxWidth="none">
      <Screen header={<PageHeader title="Discover" />}>
        <ScreenScrollView>
          {filters}
          {results}
        </ScreenScrollView>
      </Screen>
    </AppShell>
  );
}
