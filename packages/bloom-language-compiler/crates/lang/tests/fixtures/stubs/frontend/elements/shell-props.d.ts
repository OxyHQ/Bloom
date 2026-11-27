import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';
/** Props Bloom cannot read (they extend another module's), as Bloom's `ScreenProps`. */
export interface ShellProps extends ViewProps {
  header?: ReactNode;
  children?: ReactNode;
}
