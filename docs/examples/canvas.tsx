import type { ReactNode } from 'react';
import { AppShell } from '@oxy.so/bloom/app-shell';
import { PageHeader } from '@oxy.so/bloom/page-header';
import { Screen } from '@oxy.so/bloom/screen';

/** The application supplies a map/board engine with its own gestures. */
export function Canvas({ canvas }: { canvas: ReactNode }) {
  return (
    <AppShell header={null} scroll="fixed" contentMaxWidth="none">
      <Screen scroll="none" header={<PageHeader title="Explore" />}>
        {canvas}
      </Screen>
    </AppShell>
  );
}
