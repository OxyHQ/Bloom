import { Sidebar } from '../sidebar';
import type { SidebarProps } from '../sidebar/types';
import type { AppShellSidebarProps } from './types';
import { normalizeSidebarWidth } from './use-sidebar-metrics';

/** A full Sidebar replacement, without adding another Sidebar or scroll owner. */
export function SidebarSlot({
  render,
  width,
  ...props
}: SidebarProps & Pick<AppShellSidebarProps, 'render' | 'width'>) {
  const expandedWidth = normalizeSidebarWidth(width);
  const resolved: SidebarProps =
    expandedWidth !== undefined && props.variant !== 'rail'
      ? {
          ...props,
          // Keep Sidebar's expanded content and collapse clock on the region width.
          fluid: true,
          style:
            props.mobile || !props.collapsed
              ? [props.style, { width: expandedWidth }]
              : props.style,
        }
      : props;
  return render ? render(resolved) : <Sidebar {...resolved} />;
}
