import { Component, type ReactNode, type RefObject, type ComponentRef } from 'react';
import { Platform, type View } from 'react-native';

interface Props {
  ids: readonly string[];
  rootRef: RefObject<ComponentRef<typeof View> | null>;
  children: ReactNode;
}
type Snapshot = Array<{ node: Element; x: number; y: number }> | null;

/** A semantic move preserves browser scroller state lost by remove/insert DOM operations. */
export class PanelOrderBoundary extends Component<Props, Record<string, never>, Snapshot> {
  getSnapshotBeforeUpdate(previous: Props): Snapshot {
    if (Platform.OS !== 'web') return null;
    const retained = previous.ids.filter((id) => this.props.ids.includes(id));
    const next = this.props.ids.filter((id) => previous.ids.includes(id));
    if (retained.join('\0') === next.join('\0')) return null;
    const root = this.props.rootRef.current as unknown as HTMLElement | null;
    if (!root) return null;
    root.setAttribute('data-bloom-panel-ordering', 'true');
    return Array.from(root.querySelectorAll('*')).flatMap((node) =>
      node.scrollLeft || node.scrollTop ? [{ node, x: node.scrollLeft, y: node.scrollTop }] : [],
    );
  }
  componentDidUpdate(_previous: Props, _state: Record<string, never>, snapshot: Snapshot) {
    for (const { node, x, y } of snapshot ?? []) {
      if (!node.isConnected) continue;
      if (node.scrollLeft !== x) node.scrollLeft = x;
      if (node.scrollTop !== y) node.scrollTop = y;
    }
  }
  render() {
    return this.props.children;
  }
}
