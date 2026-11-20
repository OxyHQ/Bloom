/**
 * iOS: the tabs are the system tab bar (`TabView` is `NativeTabs`), which
 * draws itself inside the tabs group; the shell draws no bar. The primary
 * action is the prominent tab there, and the sidebar's first row on iPad.
 *
 * NOT VERIFIED: written without an iOS build (no Mac on this machine).
 */
import type { ReactNode } from 'react';

import type { PrimaryDestination } from './primary';

export function destinationBar(_shown: boolean, _primary: PrimaryDestination | null): ReactNode {
  return null;
}
