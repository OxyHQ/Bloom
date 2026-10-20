import { useMemo } from 'react';
import { useSidebarMetrics } from '../sidebar/metrics';
import type { AppShellSidebarProps } from './types';

export function normalizeSidebarWidth(width: number | undefined): number | undefined {
  return width !== undefined && Number.isFinite(width) ? Math.max(0, width) : undefined;
}

/** One expanded-width contract for CSS, native geometry and the rendered Sidebar. */
export function useAppShellSidebarMetrics(sidebar?: Pick<AppShellSidebarProps, 'size' | 'width'>) {
  const base = useSidebarMetrics(sidebar?.size);
  const expanded = normalizeSidebarWidth(sidebar?.width) ?? base.expanded;
  return useMemo(() => ({ ...base, expanded }), [base, expanded]);
}
