import type { ReactNode } from 'react';
import { AppShell } from '@oxy.so/bloom/app-shell';
import { ResponsiveGrid } from '@oxy.so/bloom/grid';
import { PageHeader } from '@oxy.so/bloom/page-header';
import { Screen, ScreenScrollView } from '@oxy.so/bloom/screen';

/** Pass stable keyed chart/tool components; the grid adapts to its local host. */
export function Dashboard({ widgets }: { widgets: ReactNode }) {
  return (
    <AppShell header={null} scroll="fixed" contentMaxWidth="none">
      <Screen header={<PageHeader title="Dashboard" />}>
        <ScreenScrollView>
          <ResponsiveGrid minItemWidth={320} maxColumns={3} stretchItems>
            {widgets}
          </ResponsiveGrid>
        </ScreenScrollView>
      </Screen>
    </AppShell>
  );
}
