import { type ComponentRef, forwardRef } from 'react';
import type { ScrollView, ScrollViewProps } from 'react-native';
import { ScrollSurface } from '../layout/ScrollSurface';
import type { RefComponent } from '../styles/native-refs';

interface SidebarScrollAreaProps extends ScrollViewProps {
  /** Actual surface behind this scroll region. */
  fadeColor: string;
  fadeHeight?: number;
}

/** Sidebar geometry around the common independent scroll surface. */
export const SidebarScrollArea: RefComponent<
  SidebarScrollAreaProps,
  ComponentRef<typeof ScrollView>
> = forwardRef<ComponentRef<typeof ScrollView>, SidebarScrollAreaProps>(function SidebarScrollArea(
  { style, fadeHeight = 40, testID = 'sidebar-scroll', ...props },
  ref,
) {
  return (
    <ScrollSurface
      {...props}
      testID={testID}
      scrollRef={ref}
      hostStyle={[{ minHeight: 0, position: 'relative' }, style]}
      style={{ flexGrow: 1, flexShrink: 1, minHeight: 0 }}
      fadeHeight={fadeHeight}
      fadeBottom
    />
  );
});
SidebarScrollArea.displayName = 'SidebarScrollArea';
