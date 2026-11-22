import { View } from 'react-native';

import { usePlatformDropTarget } from '../platform-surface/context';
import { orderedActions } from './shared';
import type { DropZoneProps } from './types';

/**
 * A view that takes drops (`DropZoneProps`). Native: the platform's drop
 * target when its adapter reports `drag-and-drop`, which answers the drag from
 * these props and follows it with the callbacks; without one, a view that
 * takes nothing.
 */
export function DropZone({
  accept,
  acceptFileTypes,
  actions,
  preferredAction,
  folder,
  disabled,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  style,
  testID,
  children,
}: DropZoneProps) {
  const DropTarget = usePlatformDropTarget();
  if (!DropTarget) {
    return (
      <View style={style} testID={testID}>
        {children}
      </View>
    );
  }
  return (
    <DropTarget
      accept={accept}
      acceptFileTypes={acceptFileTypes}
      actions={orderedActions(actions, preferredAction)}
      preferredAction={preferredAction}
      folder={folder}
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
