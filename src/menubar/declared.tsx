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
 * A declaration is mounted HEADLESS where it must be known but not drawn: the
 * whole bar with the `menu-bar` capability (the platform draws it), and a
 * closed menu's or submenu's content without it (so its shortcuts work while
 * it is closed). A headless part registers and renders nothing; its containers
 * (a menu's content, a group, a radio group, a submenu) render only their
 * children, each in a slot that records its position for the description's
 * order. Open, the parts draw exactly as before and register too.
 *
 * A menu's content is its rows. Anything else placed inside one (a bare
 * `View` or `Text`) is mounted with the declaration and so would draw where
 * the declaration is mounted headless; it is not part of the description.
 */
import {
  type ComponentType,
  Fragment,
  isValidElement,
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Linking, Platform } from 'react-native';

import { MenuRadioGroupProvider, useMenuRadioGroup } from '../floating/context';
import { useControllableState } from '../hooks/use-controllable-state';
import type { MenuRowParts } from '../floating/types';
import { type Chord, formatChord, parseChord } from '../kbd/chord';
import { useIsomorphicLayoutEffect } from '../theme/use-isomorphic-layout-effect';
import {
  type MenubarScope,
  MenubarScopeProvider,
  useMenubarMenu,
  useMenubarScope,
} from './context';
import { type MenuEntry, nextMenuEntryId } from './registry';
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

/**
 * The text of a part's children, as the platform's bar shows it: every string
 * and number under it, element children included, except a shortcut hint
 * (`isHint`), which is not part of the name.
 */
export function textOf(children: ReactNode, isHint: (type: unknown) => boolean): string {
  const parts: string[] = [];
  const visit = (node: ReactNode) => {
    if (typeof node === 'string' || typeof node === 'number') parts.push(String(node));
    else if (Array.isArray(node)) node.forEach(visit);
    else if (isValidElement<{ children?: ReactNode }>(node) && !isHint(node.type)) {
      visit(node.props.children);
    }
  };
  visit(children);
  return parts.join('').replace(/\s+/g, ' ').trim();
}

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

/** Mounts a declaration to be known but not drawn (see the file comment). */
export function HeadlessDeclaration({ children }: { children?: ReactNode }) {
  const scope = useMenubarScope();
  const value = useMemo(() => (scope ? { ...scope, headless: true } : null), [scope]);
  if (!value) return null;
  return (
    <MenubarScopeProvider value={value}>
      <DeclaredChildren>{children}</DeclaredChildren>
    </MenubarScopeProvider>
  );
}

/** A press on a row with only an `href`: the link, as the row's own press follows it. */
function followLink(href: string): void {
  if (Platform.OS === 'web') {
    globalThis.location?.assign(href);
    return;
  }
  void Linking.openURL(href);
}

/**
 * A fork's `MenubarContent`: its panel (`Panel`, the sheet or the anchored
 * panel) as before, with the content headless beside it while the menu is
 * closed; only the headless content with the capability.
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
        {menu.open ? null : <HeadlessDeclaration>{props.children}</HeadlessDeclaration>}
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

  function MenubarItem({ shortcut, ...props }: MenubarItemProps) {
    const scope = useMenubarScope();
    const chord = useChord(shortcut);
    const { onPress, href } = props;
    useMenuEntry(
      scope,
      {
        kind: 'item',
        label: textOf(props.children, isHint) || (props.accessibilityLabel ?? ''),
        enabled: !props.disabled,
        shortcut: chord,
        keepOpen: props.keepOpen ?? false,
      },
      () => {
        if (onPress) onPress();
        else if (href != null) followLink(href);
      },
    );
    if (scope?.headless) return null;
    return <rows.Item {...props} trailing={props.trailing ?? hint(chord)} />;
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
      <SubOpenContext.Provider value={isOpen}>
        <rows.Sub open={isOpen} onOpenChange={setOpen}>
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

  /** Drawn: the fork's sub content, with its content headless beside it while it is closed. */
  function DrawnSubContent(props: MenubarSubContentProps) {
    const open = useContext(SubOpenContext);
    return (
      <>
        {open ? null : <HeadlessDeclaration>{props.children}</HeadlessDeclaration>}
        <rows.SubContent {...props} />
      </>
    );
  }

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
