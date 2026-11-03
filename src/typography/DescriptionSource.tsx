import { Children, isValidElement, useLayoutEffect, type ReactNode } from 'react';

import { publishDescription } from '../hooks/use-described-by-hint';

/**
 * The words a text's children show: strings and numbers, nested texts' too, in
 * order, as a native text node's accessible text is its runs joined.
 */
export function textOf(children: ReactNode): string {
  let out = '';
  Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') out += String(child);
    else if (isValidElement<{ children?: ReactNode }>(child)) out += textOf(child.props.children);
  });
  return out;
}

/**
 * A Bloom `Text` with a `nativeID`, findable by it on native: its text is what a
 * control whose `aria-describedby` names the id says as its hint
 * (`hooks/use-described-by-hint.ts`). Renders nothing; `Text` mounts it only on
 * native and only for a text with an id, so every other text pays one branch.
 */
export function DescriptionSource({ id, children }: { id: string; children: ReactNode }) {
  const text = textOf(children);
  // A layout effect: the control described by this text re-renders with it
  // before the frame is shown, so it is never on screen without its hint.
  useLayoutEffect(() => publishDescription(id, text), [id, text]);
  return null;
}
