import { ActivityIndicator } from 'react-native';

import { Node, type ViewModifiers } from '../node';
import type { InkToken, ProgressViewSize } from '../tokens';
import { type ControlRenderer, defineControls } from './draw';

/** The platform's own spinner (React Native's `ActivityIndicator`). */
export type ProgressViewKind = 'progressView';

/**
 * The platform's indeterminate spinner, SwiftUI's `ProgressView()`: React
 * Native's `ActivityIndicator` (UIKit's activity indicator on iOS, Material's
 * on Android, react-native-web's ring on the web). Bloom's own loaders are
 * `Loading` and `SpinnerIcon`.
 */
export interface ProgressViewView extends ViewModifiers<ProgressViewView> {
  /** `small` (its default, 20pt) or `large` (36pt), React Native's `size`. */
  size(value: ProgressViewSize): ProgressViewView;
  /**
   * Its colour (React Native's `color`): a role painted from the theme, or an
   * app's own colour; the platform's grey by default.
   */
  tint(value: InkToken): ProgressViewView;
}

/** The platform's spinner (React Native's `ActivityIndicator`), turning while it is drawn. */
export function ProgressView(): ProgressViewView {
  return new Node('progressView', null, []);
}

const PROGRESS_VIEWS: Record<ProgressViewKind, ControlRenderer> = {
  // Its box is its `style`, as an app writes it.
  progressView: (d) => {
    const props: Record<string, unknown> = { key: d.key };
    const size = d.own('size')?.value as ProgressViewSize | undefined;
    if (size !== undefined) props.size = size;
    if (d.label !== undefined) props.accessibilityLabel = d.label;
    if (d.testID !== undefined) props.testID = d.testID;
    return d.painted(ActivityIndicator, props, {
      color: d.own('tint')?.value as InkToken | undefined,
    });
  },
};
defineControls(PROGRESS_VIEWS);
