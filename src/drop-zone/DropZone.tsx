import { View } from 'react-native';
import { styled } from 'react-native-css';

import { usePlatformDropTarget } from '../platform-surface/context';
import { orderedActions } from './shared';
import type { DropZoneProps } from './types';

/**
 * A view that takes drops (`DropZoneProps`). Native: the platform's drop
 * target when its adapter reports `drag-and-drop`, which answers the drag from
 * these props and follows it with the callbacks; without one, a view that
 * takes nothing.
 */
function DropZoneComponent({
  accept,
  actions,
  preferredAction,
  disabled,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  style,
  className,
  testID,
  children,
}: DropZoneProps) {
  const DropTarget = usePlatformDropTarget();
  if (!DropTarget) {
    return (
      <View style={style} className={className} testID={testID}>
        {children}
      </View>
    );
  }
  return (
    <DropTarget
      accept={accept}
      actions={orderedActions(actions, preferredAction)}
      preferredAction={preferredAction}
      disabled={disabled}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={style}
      testID={testID}
    >
      {children}
    </DropTarget>
  );
}

/**
 * `className` resolved to `style` before the platform's drop target is given it: a host component
 * of the platform's takes styles, not class names.
 */
export const DropZone = styled(DropZoneComponent, { className: 'style' });
