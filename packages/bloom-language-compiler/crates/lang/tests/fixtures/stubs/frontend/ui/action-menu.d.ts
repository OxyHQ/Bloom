/** A TS function whose one parameter is an intersection of object types (Mention's
 * `showCancelableActionMenu(request: ActionMenuRequest & { signal?: AbortSignal })`). */
export interface Act {
  label: string;
  color?: string;
  onPress: () => void;
}
interface Req {
  label: string;
  groups: Act[][];
}
export declare function showPlain(request: Req): void;
export declare function showBoth(
  request: Req & { signal?: AbortSignal; onClosed?: () => void },
): void;

/** A generic component's props, intersected (Mention's `NotificationsList` over `VirtualList`):
 * `T` is TS's to infer at the use, so the intersection stays TS's. */
export declare function GenericList<T>(props: {
  data: readonly T[];
  keyExtractor?: (item: T, index: number) => string;
}): import('react').ReactElement;
export type WrappedProps = Parameters<typeof GenericList>[0] & { extra?: string };
export declare function Wrapped(props: WrappedProps): import('react').ReactElement;
