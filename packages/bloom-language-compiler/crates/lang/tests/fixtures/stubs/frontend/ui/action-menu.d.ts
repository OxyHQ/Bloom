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
