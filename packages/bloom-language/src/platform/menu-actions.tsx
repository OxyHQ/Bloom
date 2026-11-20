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
  readonly actions: MenuActionsProps;
  readonly tag: string;
}

export interface MenuChoice {
  /** Runs `tag`'s action. */
  choose: ((tag: string) => void) | undefined;
  /** The components running the choices made: place them beside the menu. */
  running: ReactNode;
}

export interface MenuChoices {
  /** Runs `tag`'s action, from the `actions()` view that resolves it. */
  choose: (actions: MenuActionsProps, tag: string) => void;
  running: ReactNode;
}

/** The choices made in any of several menus (a navigation bar's), each resolved by its own actions. */
export function useMenuChoices(): MenuChoices {
  const [choices, setChoices] = useState<readonly Choice[]>(NONE);
  const next = useRef(0);
  const choose = useCallback((actions: MenuActionsProps, tag: string) => {
    next.current += 1;
    const id = next.current;
    setChoices((current) => [...current, { id, actions, tag }]);
  }, []);
  const settle = useCallback(
    (id: number) => setChoices((current) => current.filter((choice) => choice.id !== id)),
    [],
  );
  return {
    choose,
    running: choices.map((choice) => (
      <RunChoice key={choice.id} choice={choice} onSettled={settle} />
    )),
  };
}

/** A menu's actions, when it has an `actions()` view. */
export function actionsOf(actions: Child | undefined): MenuActionsProps | undefined {
  return isNode(actions) && actions.kind === 'menuActions'
    ? (actions.props as MenuActionsProps)
    : undefined;
}

/** One menu's choices. */
export function useMenuChoice(actions: Child | undefined): MenuChoice {
  const { choose, running } = useMenuChoices();
  const props = actionsOf(actions);
  return {
    choose: props ? (tag) => choose(props, tag) : undefined,
    running,
  };
}

const NONE: readonly Choice[] = [];

function RunChoice({ choice, onSettled }: { choice: Choice; onSettled: (id: number) => void }) {
  const run = choice.actions.body(choice.actions.props)[choice.tag];
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
