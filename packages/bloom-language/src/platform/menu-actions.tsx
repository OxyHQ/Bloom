/**
 * A menu's tagged rows, chosen: what each choice runs comes from the menu's
 * `actions()` view, whose body runs only for that choice.
 *
 * A row tagged `Item(title).tag(name)` holds no handler, so a closed menu
 * costs no hook and no closure and every platform can present its rows before
 * it opens (the system menu on iOS needs them then). Choosing one mounts a
 * component for that choice where the menu is placed: it calls the body (its
 * hooks read the app's context there), runs the tag's action once, and
 * unmounts. A choice outlives the menu that offered it, so a menu that closes
 * as it is chosen still runs it.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { isNode, type Child, type MenuActionsProps } from '../node';

interface Choice {
  readonly id: number;
  readonly tag: string;
}

export interface MenuChoice {
  /** Runs `tag`'s action. */
  choose: ((tag: string) => void) | undefined;
  /** The components running the choices made: place them beside the menu. */
  running: ReactNode;
}

export function useMenuChoice(actions: Child | undefined): MenuChoice {
  const [choices, setChoices] = useState<readonly Choice[]>(NONE);
  const next = useRef(0);
  const choose = useCallback((tag: string) => {
    next.current += 1;
    const id = next.current;
    setChoices((current) => [...current, { id, tag }]);
  }, []);
  const settle = useCallback(
    (id: number) => setChoices((current) => current.filter((choice) => choice.id !== id)),
    [],
  );
  if (!isNode(actions) || actions.kind !== 'menuActions')
    return { choose: undefined, running: null };
  const props = actions.props as MenuActionsProps;
  return {
    choose,
    running: choices.map((choice) => (
      <RunChoice key={choice.id} actions={props} choice={choice} onSettled={settle} />
    )),
  };
}

const NONE: readonly Choice[] = [];

function RunChoice({
  actions,
  choice,
  onSettled,
}: {
  actions: MenuActionsProps;
  choice: Choice;
  onSettled: (id: number) => void;
}) {
  const run = actions.body(actions.props)[choice.tag];
  const ran = useRef(false);
  useEffect(() => {
    // One mount is one choice: it runs once, then the component leaves.
    if (ran.current) return;
    ran.current = true;
    run?.();
    onSettled(choice.id);
  }, [run, onSettled, choice.id]);
  return null;
}
