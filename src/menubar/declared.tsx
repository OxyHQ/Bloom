/**
 * How a `Menubar` knows its own declaration (OxyOS ADR 0021).
 *
 * Every part an application declares (a menu's trigger, an item, a check item,
 * a radio item, a label, a separator, a submenu's trigger) REGISTERS itself
 * with its bar (`registry.ts`) while it is mounted: its kind, its label, its
 * state, its shortcut, and a `run` that calls the part's own current handler
 * (`onPress`, `onCheckedChange`, the radio group's `onValueChange`). So the
 * handlers stay the application's closures, and choosing an item anywhere runs
 * exactly what a press on its row runs.
 *
 * With the `menu-bar` capability (the platform draws the bar) the whole bar
 * is mounted HEADLESS: known but not drawn. A headless part registers and
 * renders nothing; its containers (a menu's content, a group, a radio group, a
 * submenu) render only their children, each in a slot that records its
 * position for the description's order.
 *
 * Without it, a CLOSED menu's or submenu's content is not mounted at all: its
 * entries are read from its elements (`description.ts`, `StaticDeclaration`)
 * so that its shortcuts work while it is closed, and its rows mount as it
 * opens, register, and draw. Only an element that is not one of Bloom's parts
 * (an application's own component rendering rows) is mounted headless there,
 * since it cannot be read without rendering it.
 *
 * A menu's content is its rows. Anything else placed inside one (a bare
 * `View` or `Text`) is not part of the description.
 */
import {
  type ComponentType,
  Fragment,
  isValidElement,
  type ReactNode,
  createContext,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { openHref } from '../hooks/link-activation';

import { MenuRadioGroupProvider, useMenuRadioGroup } from '../floating/context';
import { useControllableState } from '../hooks/use-controllable-state';
import type { MenuRowParts } from '../floating/types';
import { type Chord, formatChord, parseChord } from '../kbd/chord';
import { usePlatformEditing } from '../platform-surface/context';
import { useIsomorphicLayoutEffect } from '../theme/use-isomorphic-layout-effect';
import {
  type MenubarScope,
  MenubarScopeProvider,
  useMenubarMenu,
  useMenubarScope,
} from './context';
import {
  type DescribedEntry,
  describeMenu,
  markMenubarHint,
  markMenubarPart,
  textOf,
} from './description';
import { type MenuEntry, nextMenuEntryId } from './registry';
import { actionShortcut, isMenuAction, responderOf, useEditAction } from './use-edit-action';
import { useMenubarLeaving } from './viewport';
import type {
  MenubarCheckboxItemProps,
  MenubarContentProps,
  MenubarGroupProps,
  MenubarItemProps,
  MenubarLabelProps,
  MenubarRadioGroupProps,
  MenubarRadioItemProps,
  MenubarSubContentProps,
  MenubarSubProps,
  MenubarSubTriggerProps,
} from './types';

type EntryFields = Omit<MenuEntry, 'id' | 'parent' | 'path' | 'run'> &
  Partial<Pick<MenuEntry, 'id' | 'parent' | 'path'>>;

/**
 * Registers a part with its bar for as long as it is mounted, updated after
 * every render (an unchanged entry is not a change). `run` is read when the
 * item runs, never captured, so it is always the part's current handler.
 * Returns the entry's id. Outside a `Menubar` (no scope) it does nothing.
 */
export function useMenuEntry(
  scope: MenubarScope | null,
  fields: EntryFields,
  run?: () => void,
): string {
  const [ownId] = useState(nextMenuEntryId);
  const id = fields.id ?? ownId;
  const latestRun = useRef(run);
  const hasRun = run !== undefined;
  const [stableRun] = useState(() => () => latestRun.current?.());
  const registry = scope?.registry;

  useIsomorphicLayoutEffect(() => {
    latestRun.current = run;
    registry?.set({
      ...fields,
      id,
      parent: fields.parent !== undefined ? fields.parent : (scope?.parent ?? null),
      path: fields.path ?? scope?.path ?? [],
      run: hasRun ? stableRun : undefined,
    });
  });
  useIsomorphicLayoutEffect(() => {
    if (!registry) return undefined;
    return () => registry.delete(id);
  }, [registry, id]);
  return id;
}

export { textOf };

/** Whether the drawn submenu around a `MenubarSubContent` is open. */
const SubOpenContext = createContext(false);

const warnedChords = new Set<string>();

/** The chord a `shortcut` prop declares; null (and a warning in development) when it is not one. */
export function useChord(shortcut: string | undefined): Chord | null {
  return useMemo(() => {
    if (shortcut === undefined) return null;
    const chord = parseChord(shortcut);
    if (!chord && process.env.NODE_ENV !== 'production' && !warnedChords.has(shortcut)) {
      warnedChords.add(shortcut);
      console.warn(
        `[Bloom] Menubar: "${shortcut}" is not a key chord, so the item has no shortcut. ` +
          'Write modifiers out of Mod, Ctrl, Alt, Shift and Meta, then one key: "Mod+Shift+Z".',
      );
    }
    return chord;
  }, [shortcut]);
}

function Slot({
  scope,
  position,
  children,
}: {
  scope: MenubarScope;
  position: number;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ ...scope, owner: undefined, path: [...scope.path, position] }),
    [scope, position],
  );
  return <MenubarScopeProvider value={value}>{children}</MenubarScopeProvider>;
}

/**
 * A container's children, each in a slot that records its position. Arrays
 * and fragments are flattened into the container's own positions, so a
 * `{condition && <MenubarItem />}` keeps its place whether or not it renders.
 */
export function DeclaredChildren({ children }: { children?: ReactNode }) {
  const scope = useMenubarScope();
  if (!scope) return <>{children}</>;
  const slots: ReactNode[] = [];
  const visit = (node: ReactNode, keyPrefix: string) => {
    if (Array.isArray(node)) {
      node.forEach((child, index) => {
        visit(child, `${keyPrefix}${index}.`);
      });
      return;
    }
    if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment) {
      visit(node.props.children, `${keyPrefix}${node.key ?? ''}:`);
      return;
    }
    const position = slots.length;
    const key =
      isValidElement(node) && node.key != null
        ? `${keyPrefix}$${node.key}`
        : `${keyPrefix}${position}`;
    slots.push(
      <Slot key={key} scope={scope} position={position}>
        {node}
      </Slot>,
    );
  };
  visit(children, '');
  return <>{slots}</>;
}

const subscribeNowhere = () => () => undefined;

/**
 * A closed menu's or submenu's content, KNOWN to its bar without being
 * mounted: its entries read from its elements (`describeMenu`) and registered
 * here, each at the place its row would take; what is not one of Bloom's parts
 * is mounted headless at its place, as before.
 *
 * An entry's `run` is stable while it keeps its place and calls the current
 * element's handler, so a re-render of the application's bar is no change to
 * the registry unless what the menu says changed. An item with an editing
 * action follows the focused field, as its row would (`use-edit-action.ts`).
 */
export function StaticDeclaration({ children }: { children?: ReactNode }) {
  const scope = useMenubarScope();
  const description = useMemo(() => describeMenu(children), [children]);
  const editing = usePlatformEditing();
  const edits = description.entries.some((entry) => entry.editAction !== undefined);
  // What a focused field can do with each editing action, as one value: a change re-renders.
  const listen = useCallback(
    (listener: () => void) => (edits && editing ? editing.subscribe(listener) : subscribeNowhere()),
    [edits, editing],
  );
  useSyncExternalStore(
    listen,
    () =>
      edits
        ? description.entries.map((entry) => responderOf(editing, entry.editAction)).join()
        : '',
    () => '',
  );

  const registry = scope?.registry;
  const parent = scope?.parent ?? null;
  const idOf = useCallback((key: string) => `${parent ?? 'bar'}/${key}`, [parent]);
  const latest = useRef(new Map<string, DescribedEntry>());
  const latestEditing = useRef(editing);
  const runs = useRef(new Map<string, () => void>());
  const registered = useRef(new Set<string>());
  const runFor = (key: string) => {
    let run = runs.current.get(key);
    if (!run) {
      run = () => {
        const entry = latest.current.get(key);
        if (!entry) return;
        const field = latestEditing.current;
        if (entry.editAction && field && responderOf(field, entry.editAction) !== 'none') {
          field.perform(entry.editAction);
          return;
        }
        entry.run?.();
      };
      runs.current.set(key, run);
    }
    return run;
  };

  useIsomorphicLayoutEffect(() => {
    if (!registry || !scope) return;
    latest.current = new Map(description.entries.map((entry) => [entry.key, entry]));
    latestEditing.current = editing;
    const now = new Set<string>();
    for (const entry of description.entries) {
      const id = idOf(entry.key);
      now.add(id);
      const responder = responderOf(editing, entry.editAction);
      registry.set({
        id,
        kind: entry.kind,
        parent: entry.parentKey === null ? parent : idOf(entry.parentKey),
        path: [...scope.path, ...entry.path],
        label: entry.label,
        enabled: responder === 'none' ? entry.enabled : responder === 'enabled',
        shortcut: entry.shortcut,
        ...(entry.checked === undefined ? null : { checked: entry.checked }),
        ...(entry.keepOpen === undefined ? null : { keepOpen: entry.keepOpen }),
        ...(entry.action ? { action: entry.action } : null),
        run: entry.runs ? runFor(entry.key) : undefined,
      });
    }
    for (const id of registered.current) if (!now.has(id)) registry.delete(id);
    registered.current = now;
    for (const key of runs.current.keys()) if (!latest.current.has(key)) runs.current.delete(key);
  });
  useIsomorphicLayoutEffect(() => {
    if (!registry) return undefined;
    return () => {
      for (const id of registered.current) registry.delete(id);
      registered.current = new Set();
    };
  }, [registry, idOf]);

  if (!scope) return null;
  return (
    <>
      {description.unread.map((element) => {
        const subKey = element.parentKey;
        const path = [...scope.path, ...element.path];
        const { owner } = element;
        const value: MenubarScope = {
          ...scope,
          headless: true,
          parent: subKey === null ? parent : idOf(subKey),
          path,
          owner:
            owner && subKey !== null
              ? {
                  kind: 'submenu',
                  id: idOf(subKey),
                  parent: owner.parentKey === null ? parent : idOf(owner.parentKey),
                  path,
                }
              : undefined,
        };
        const node = element.radio ? (
          <MenuRadioGroupProvider value={element.radio}>{element.node}</MenuRadioGroupProvider>
        ) : (
          element.node
        );
        return (
          <MenubarScopeProvider key={`${subKey ?? ''}@${element.path.join('.')}`} value={value}>
            {node}
          </MenubarScopeProvider>
        );
      })}
    </>
  );
}

/**
 * A fork's `MenubarContent`: its panel (`Panel`, the sheet or the anchored
 * panel) as before, with the content known to the bar while the menu is
 * closed (`StaticDeclaration`); only the headless content with the capability.
 */
export function createMenubarContent(
  Panel: ComponentType<MenubarContentProps>,
): ComponentType<MenubarContentProps> {
  function MenubarContent(props: MenubarContentProps) {
    const scope = useMenubarScope();
    const menu = useMenubarMenu();
    if (scope?.headless) return <DeclaredChildren>{props.children}</DeclaredChildren>;
    return (
      <>
        {menu.open || scope?.declareClosed === false ? null : (
          <StaticDeclaration>{props.children}</StaticDeclaration>
        )}
        <Panel {...props} />
      </>
    );
  }
  MenubarContent.displayName = 'MenubarContent';
  return MenubarContent;
}

/** What `createMenubarRows` publishes: the rows, each declared to its bar. */
export interface MenubarRowParts {
  Item: ComponentType<MenubarItemProps>;
  CheckboxItem: ComponentType<MenubarCheckboxItemProps>;
  RadioGroup: ComponentType<MenubarRadioGroupProps>;
  RadioItem: ComponentType<MenubarRadioItemProps>;
  Label: ComponentType<MenubarLabelProps>;
  Separator: ComponentType<Record<string, never>>;
  Shortcut: MenuRowParts['Shortcut'];
  Group: ComponentType<MenubarGroupProps>;
  Sub: ComponentType<MenubarSubProps>;
  SubTrigger: ComponentType<MenubarSubTriggerProps>;
  SubContent: ComponentType<MenubarSubContentProps>;
}

/**
 * The menubar's rows: the shared menu rows (`floating/menu-rows`, the fork's
 * own sub-menu), each declared to its bar. Drawn, a row is the shared row
 * unchanged, plus its `shortcut` drawn for the platform as its trailing hint
 * when it has no `trailing` of its own.
 */
export function createMenubarRows(rows: MenuRowParts): MenubarRowParts {
  const { Shortcut } = rows;
  const isHint = (type: unknown) => type === Shortcut;
  const hint = (chord: Chord | null) => (chord ? <Shortcut>{formatChord(chord)}</Shortcut> : null);

  function MenubarItem({ shortcut, action, ...props }: MenubarItemProps) {
    const scope = useMenubarScope();
    const chord = useChord(shortcut ?? actionShortcut(action));
    const { onPress, href } = props;
    const handler = onPress ?? (href != null ? () => openHref(href) : undefined);
    // An editing action goes to the focused text field first (use-edit-action.ts); the
    // application's own commands (About, Settings…) are its items, which no field takes.
    const menuAction = isMenuAction(action) ? action : undefined;
    const editAction = isMenuAction(action) ? undefined : action;
    const item = useEditAction(editAction, props.disabled ?? false, handler);
    const enabled = menuAction ? item.enabled && handler !== undefined : item.enabled;
    useMenuEntry(
      scope,
      {
        kind: 'item',
        label: textOf(props.children, isHint) || (props.accessibilityLabel ?? ''),
        enabled,
        shortcut: chord,
        keepOpen: props.keepOpen ?? false,
        ...(menuAction ? { action: menuAction } : null),
      },
      item.run,
    );
    if (scope?.headless) return null;
    const trailing = props.trailing ?? hint(chord);
    if (!action) return <rows.Item {...props} trailing={trailing} />;
    return <rows.Item {...props} disabled={!enabled} onPress={item.run} trailing={trailing} />;
  }
  MenubarItem.displayName = 'MenubarItem';

  function MenubarCheckboxItem({ shortcut, ...props }: MenubarCheckboxItemProps) {
    const scope = useMenubarScope();
    const chord = useChord(shortcut);
    const { checked, onCheckedChange } = props;
    useMenuEntry(
      scope,
      {
        kind: 'item',
        label: textOf(props.children, isHint) || (props.accessibilityLabel ?? ''),
        enabled: !props.disabled,
        shortcut: chord,
        checked,
        keepOpen: props.keepOpen ?? false,
      },
      () => onCheckedChange(!checked),
    );
    if (scope?.headless) return null;
    return <rows.CheckboxItem {...props} trailing={props.trailing ?? hint(chord)} />;
  }
  MenubarCheckboxItem.displayName = 'MenubarCheckboxItem';

  function MenubarRadioGroup(props: MenubarRadioGroupProps) {
    const scope = useMenubarScope();
    const { value, onValueChange } = props;
    const context = useMemo(() => ({ value, onValueChange }), [value, onValueChange]);
    if (!scope?.headless) return <rows.RadioGroup {...props} />;
    return (
      <MenuRadioGroupProvider value={context}>
        <DeclaredChildren>{props.children}</DeclaredChildren>
      </MenuRadioGroupProvider>
    );
  }
  MenubarRadioGroup.displayName = 'MenubarRadioGroup';

  function MenubarRadioItem({ shortcut, ...props }: MenubarRadioItemProps) {
    const scope = useMenubarScope();
    const chord = useChord(shortcut);
    const group = useMenuRadioGroup();
    const { value } = props;
    useMenuEntry(
      scope,
      {
        kind: 'item',
        label: textOf(props.children, isHint) || (props.accessibilityLabel ?? ''),
        enabled: !props.disabled,
        shortcut: chord,
        checked: group.value === value,
        keepOpen: props.keepOpen ?? false,
      },
      () => group.onValueChange(value),
    );
    if (scope?.headless) return null;
    return <rows.RadioItem {...props} trailing={props.trailing ?? hint(chord)} />;
  }
  MenubarRadioItem.displayName = 'MenubarRadioItem';

  function MenubarLabel(props: MenubarLabelProps) {
    const scope = useMenubarScope();
    // A group's label is shown, never chosen: an item that is never enabled.
    useMenuEntry(scope, {
      kind: 'item',
      label: textOf(props.children, isHint),
      enabled: false,
      shortcut: null,
    });
    if (scope?.headless) return null;
    return <rows.Label {...props} />;
  }
  MenubarLabel.displayName = 'MenubarLabel';

  function MenubarSeparator(props: Record<string, never>) {
    const scope = useMenubarScope();
    useMenuEntry(scope, { kind: 'separator', label: '', enabled: true, shortcut: null });
    if (scope?.headless) return null;
    return <rows.Separator {...props} />;
  }
  MenubarSeparator.displayName = 'MenubarSeparator';

  function MenubarGroup(props: MenubarGroupProps) {
    const scope = useMenubarScope();
    if (!scope?.headless) return <rows.Group {...props} />;
    return <DeclaredChildren>{props.children}</DeclaredChildren>;
  }
  MenubarGroup.displayName = 'MenubarGroup';

  function MenubarSub({ open, defaultOpen = false, onOpenChange, children }: MenubarSubProps) {
    const scope = useMenubarScope();
    // In a menu the bar's surface is changing from, a submenu shows nothing: its flyout goes as
    // the menu's rows begin to leave.
    const leaving = useMenubarLeaving();
    const [id] = useState(nextMenuEntryId);
    // The submenu's open state is held here and given to the fork's sub,
    // controlled, so its content knows when it is closed (and mounts headless
    // beside it); each fork keeps its own sub state private.
    const [isOpen, setOpen] = useControllableState<boolean>({
      value: open,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });
    const inner = useMemo(
      () =>
        scope && {
          ...scope,
          parent: id,
          owner: { kind: 'submenu' as const, id, parent: scope.parent, path: scope.path },
        },
      [scope, id],
    );
    const declared = inner ? (
      <MenubarScopeProvider value={inner}>{children}</MenubarScopeProvider>
    ) : (
      children
    );
    if (scope?.headless) return <>{declared}</>;
    return (
      <SubOpenContext.Provider value={isOpen && !leaving}>
        <rows.Sub open={isOpen && !leaving} onOpenChange={setOpen}>
          {declared}
        </rows.Sub>
      </SubOpenContext.Provider>
    );
  }
  MenubarSub.displayName = 'MenubarSub';

  function MenubarSubTrigger(props: MenubarSubTriggerProps) {
    const scope = useMenubarScope();
    const owner = scope?.owner?.kind === 'submenu' ? scope.owner : undefined;
    // Outside a `MenubarSub` there is no submenu to register.
    useMenuEntry(owner ? scope : null, {
      kind: 'submenu',
      id: owner?.id,
      parent: owner?.parent,
      path: owner?.path,
      label: textOf(props.children, isHint) || (props.accessibilityLabel ?? ''),
      enabled: !props.disabled,
      shortcut: null,
    });
    if (scope?.headless) return null;
    return <rows.SubTrigger {...props} />;
  }
  MenubarSubTrigger.displayName = 'MenubarSubTrigger';

  function MenubarSubContent(props: MenubarSubContentProps) {
    const scope = useMenubarScope();
    if (scope?.headless) return <DeclaredChildren>{props.children}</DeclaredChildren>;
    return <DrawnSubContent {...props} />;
  }
  MenubarSubContent.displayName = 'MenubarSubContent';

  /** Drawn: the fork's sub content, with its content known to the bar while it is closed. */
  function DrawnSubContent(props: MenubarSubContentProps) {
    const open = useContext(SubOpenContext);
    return (
      <>
        {open ? null : <StaticDeclaration>{props.children}</StaticDeclaration>}
        <rows.SubContent {...props} />
      </>
    );
  }

  markMenubarHint(Shortcut);
  markMenubarPart(MenubarItem, 'item');
  markMenubarPart(MenubarCheckboxItem, 'checkbox');
  markMenubarPart(MenubarRadioGroup, 'radioGroup');
  markMenubarPart(MenubarRadioItem, 'radio');
  markMenubarPart(MenubarLabel, 'label');
  markMenubarPart(MenubarSeparator, 'separator');
  markMenubarPart(MenubarGroup, 'group');
  markMenubarPart(MenubarSub, 'sub');
  markMenubarPart(MenubarSubTrigger, 'subTrigger');
  markMenubarPart(MenubarSubContent, 'subContent');

  return {
    Item: MenubarItem,
    CheckboxItem: MenubarCheckboxItem,
    RadioGroup: MenubarRadioGroup,
    RadioItem: MenubarRadioItem,
    Label: MenubarLabel,
    Separator: MenubarSeparator,
    Shortcut,
    Group: MenubarGroup,
    Sub: MenubarSub,
    SubTrigger: MenubarSubTrigger,
    SubContent: MenubarSubContent,
  };
}
