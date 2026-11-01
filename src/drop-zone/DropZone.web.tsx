import { type ComponentRef, useEffect, useRef } from 'react';
import { View } from 'react-native';

import type { DragAction, DropKind, DroppedFile } from '../platform-surface/types';
import {
  allowedActions,
  chosenAction,
  dropData,
  KIND_TYPES,
  offeredKinds,
  orderedActions,
} from './shared';
import type { DropZoneProps } from './types';

/** The web's `dropEffect` for an action; `none` drops nothing. */
function effect(action: DragAction | null): 'copy' | 'move' | 'link' | 'none' {
  return action ?? 'none';
}

/** A browser's file, as a drop gives it. */
function domFile(file: File): DroppedFile {
  return {
    name: file.name,
    ...(file.type ? { mimeType: file.type } : {}),
    size: file.size,
    raw: file,
  };
}

/**
 * A view that takes drops (`DropZoneProps`), on the web: HTML5's drag and drop
 * on its element. A drag it would take is accepted in `dragenter` and
 * `dragover` (their default prevented, `dropEffect` the action); what it
 * carries is read only at the drop. Enterings and leavings of its children are
 * counted, so the zone is left only when the pointer leaves it.
 */
export function DropZone({
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
  const ref = useRef<ComponentRef<typeof View>>(null);
  const latest = useRef({
    accept,
    actions,
    preferredAction,
    disabled,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  });
  latest.current = {
    accept,
    actions,
    preferredAction,
    disabled,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  };

  useEffect(() => {
    // Under react-native-web a View's ref is its DOM node.
    const node = ref.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return;
    let depth = 0;
    const inside = { current: false };
    const describe = (event: DragEvent) => {
      const props = latest.current;
      const types = Array.from(event.dataTransfer?.types ?? []);
      const kinds: DropKind[] = props.disabled ? [] : offeredKinds(props.accept, types);
      const supported = orderedActions(props.actions, props.preferredAction);
      const action =
        kinds.length === 0
          ? null
          : chosenAction(supported, allowedActions(event.dataTransfer?.effectAllowed), event);
      const rect = node.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, action, kinds };
    };
    const answer = (event: DragEvent) => {
      const described = describe(event);
      if (described.action) {
        event.preventDefault();
      }
      if (event.dataTransfer) event.dataTransfer.dropEffect = effect(described.action);
      return described;
    };
    const onEnter = (event: DragEvent) => {
      depth += 1;
      const described = answer(event);
      if (!inside.current && described.kinds.length > 0) {
        inside.current = true;
        latest.current.onDragEnter?.(described);
      }
    };
    const onOver = (event: DragEvent) => {
      const described = answer(event);
      if (inside.current) latest.current.onDragOver?.(described);
    };
    const leave = () => {
      depth = 0;
      if (inside.current) {
        inside.current = false;
        latest.current.onDragLeave?.();
      }
    };
    const onLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) leave();
    };
    const onDropEvent = (event: DragEvent) => {
      const described = describe(event);
      leave();
      if (!described.action || !event.dataTransfer) return;
      event.preventDefault();
      const props = latest.current;
      const received: Record<string, string> = {};
      const read = new Set<string>();
      for (const kind of described.kinds) {
        const types = kind in KIND_TYPES ? KIND_TYPES[kind as keyof typeof KIND_TYPES] : [kind];
        for (const type of types) {
          if (read.has(type)) continue;
          read.add(type);
          const value = event.dataTransfer.getData(type);
          if (value) received[type] = value;
        }
      }
      const files = props.accept.includes('files')
        ? Array.from(event.dataTransfer.files ?? []).map(domFile)
        : [];
      props.onDrop({
        ...described,
        action: described.action,
        data: dropData(props.accept, received, files),
      });
    };
    node.addEventListener('dragenter', onEnter);
    node.addEventListener('dragover', onOver);
    node.addEventListener('dragleave', onLeave);
    node.addEventListener('drop', onDropEvent);
    return () => {
      node.removeEventListener('dragenter', onEnter);
      node.removeEventListener('dragover', onOver);
      node.removeEventListener('dragleave', onLeave);
      node.removeEventListener('drop', onDropEvent);
    };
  }, []);

  return (
    <View ref={ref} style={style} className={className} testID={testID}>
      {children}
    </View>
  );
}
