import { EmptyState } from '../empty-state';
import { RiMusic2Line } from '../icons/remix/RiMusic2Line';
import type { TrackListEmptyProps } from './types';

/**
 * What a track list shows with nothing in it: `EmptyState` on its screen rung
 * with the glyph on a disc, a title, a line and an optional primary button.
 */
export function TrackListEmpty({
  icon = RiMusic2Line,
  title,
  description,
  actionLabel,
  onAction,
  style,
  testID,
}: TrackListEmptyProps) {
  return (
    <EmptyState
      icon={icon}
      media="circle"
      title={title}
      description={description}
      action={actionLabel && onAction ? { label: actionLabel, onPress: onAction } : undefined}
      style={[{ paddingLeft: 16, paddingRight: 16 }, style]}
      testID={testID}
    />
  );
}
