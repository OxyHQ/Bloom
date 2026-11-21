import {
  DropZone as BloomDropZone,
  type DragAction,
  type DropKind,
  type DropTargetDragEvent,
  type DropTargetDropEvent,
} from '@oxy.so/bloom/drop-zone';

import { Node, type Child, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';

/** A view that takes what is dropped on it, from another application or this one (Bloom `drop-zone`). */
export type DropZoneKind = 'dropZone';

/** Bloom `DropZone`: its views, and what a drop of the kinds it accepts does. */
export interface DropZoneView extends ViewModifiers<DropZoneView> {
  /** The media types of files it takes (`image/png`, `image/*`); files of any type by default. */
  fileTypes(value: readonly string[]): DropZoneView;
  /** The actions a drop may take, and the one it prefers. */
  dragActions(value: readonly DragAction[], preferred?: DragAction): DropZoneView;
  /** Where a native platform puts dropped files (a folder of the app's). */
  folder(value: string): DropZoneView;
  disabled(value?: boolean): DropZoneView;
  /** A drag it would take came over it. */
  onDragEnter(value: (event: DropTargetDragEvent) => void): DropZoneView;
  /** That drag moved over it. */
  onDragOver(value: (event: DropTargetDragEvent) => void): DropZoneView;
  /** That drag left without dropping. */
  onDragLeave(value: () => void): DropZoneView;
}

/**
 * Bloom `DropZone`: `children`, taking drops of the `accept` kinds (`files`,
 * `text`, `url`, `html` or a media type); `onDrop` receives what was dropped.
 */
export function DropZone(
  accept: readonly DropKind[],
  onDrop: (event: DropTargetDropEvent) => void,
  ...children: Child[]
): DropZoneView {
  return new Node('dropZone', { accept, onDrop }, children);
}

export const DROP_ZONES: Record<DropZoneKind, ControlRenderer> = {
  dropZone: (d) => {
    const { accept, onDrop } = d.node.props as {
      accept: readonly DropKind[];
      onDrop: (event: DropTargetDropEvent) => void;
    };
    const actions = d.own('dragActions')?.value;
    const props = d.props();
    Object.assign(props, {
      accept,
      onDrop,
      acceptFileTypes: d.own('fileTypes')?.value,
      folder: d.own('folder')?.value,
      disabled: d.own('disabled')?.value,
      onDragEnter: d.own('onDragEnter')?.value,
      onDragOver: d.own('onDragOver')?.value,
      onDragLeave: d.own('onDragLeave')?.value,
    });
    if (actions !== undefined) [props.actions, props.preferredAction] = actions;
    return d.component(BloomDropZone, props, ...d.children(d.node.children));
  },
};
