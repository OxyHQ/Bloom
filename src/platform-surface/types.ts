import type { ComponentRef, ComponentType, ReactNode, RefObject } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';
import type { FloatingAlign, FloatingSide } from '../floating/types';

/**
 * What a host platform can show outside an application's own layout.
 *
 * - `popup-surface`: an anchored panel in a surface of the platform's own (an
 *   OxyOS compositor popup), which may extend beyond the application window.
 * - `window`: the application runs in a desktop window that has controls
 *   (close, minimize, zoom) in its top leading corner, and can be moved,
 *   zoomed and minimized. Bloom keeps the controls' room and, where the
 *   platform asks it to, draws them (`@oxy.so/bloom/window`).
 * - `menu-bar`: the platform shows the active window's menus in a bar of its
 *   own (the top of the screen, as on a Mac). A `Menubar` then draws nothing in
 *   the window: it describes its menus to the platform (`PlatformMenuBar`) and
 *   runs the item the person chooses there.
 * - `pointer`: a pointer (a mouse, a touchpad) drives the platform, though
 *   Bloom is not in a window of its own there (a desktop's shell, its top bar
 *   and dock): controls take a desktop's compact geometry and menus open as a
 *   desktop's (anchored dropdowns, submenus beside their row), as `window`
 *   gives an application.
 * - `appearance`: the platform has an appearance of its own for every
 *   application (`PlatformAppearance`): an accent colour, which seeds Bloom's
 *   palette, and whether transparency is reduced, which draws every blurred
 *   material opaque. Light or dark is not part of it: React Native's
 *   `Appearance` already carries that.
 * - `drag-and-drop`: content is dragged between applications through the
 *   platform (`PlatformDrag`, `DropTarget`): a `DropZone` takes drops from any
 *   application, and an application starts a drag of its own content with
 *   `usePlatformDrag()`.
 * - `material`: the platform blurs what is behind a view it is given
 *   (`Material`), its own material, as a Mac's vibrancy blurs the windows and
 *   desktop behind a menu or a sheet. A floating surface (`SurfacePaint
 *   floating`: menus, popovers, dialogs, sheets, toasts, tooltips) then draws
 *   its tint over that material instead of an opaque fill, unless
 *   transparency is reduced.
 */
export type SurfaceCapability =
  | 'popup-surface'
  | 'window'
  | 'pointer'
  | 'menu-bar'
  | 'appearance'
  | 'drag-and-drop'
  | 'material';

/**
 * What a drop does with what is dragged, as the web's `dropEffect`, Wayland's
 * and macOS's drag operations: a copy, a move (the source deletes its original
 * when it is data; files are moved by the target), or a link (an alias).
 */
export type DragAction = 'copy' | 'move' | 'link';

/**
 * A kind of content a drop target takes: files (`file://` URIs on a native
 * platform, the browser's `File` objects on the web), plain text, URLs, HTML,
 * or any other media type named exactly (`image/png`).
 */
export type DropKind = 'files' | 'text' | 'url' | 'html' | (string & {});

/** A file dropped: its `file://` URI where the platform has one, its name and type. */
export interface DroppedFile {
  readonly name: string;
  /** `file://`, as `expo-file-system` takes it; absent for a browser's file. */
  readonly uri?: string;
  readonly mimeType?: string;
  readonly size?: number;
  /** The browser's `File` on the web, to read or upload. */
  readonly raw?: unknown;
}

/** What a drop carried, of the kinds the target accepts. */
export interface DropData {
  readonly files: readonly DroppedFile[];
  readonly urls: readonly string[];
  readonly text?: string;
  readonly html?: string;
  /** Other media types the target accepts by name, as text. */
  readonly other: Readonly<Record<string, string>>;
}

/** A drag over a drop target: where (view-local), what a drop would do, what is offered. */
export interface DropTargetDragEvent {
  readonly x: number;
  readonly y: number;
  /** The action a drop here would take now; null when it would drop nothing. */
  readonly action: DragAction | null;
  /** The kinds the drag offers that the target accepts. */
  readonly kinds: readonly DropKind[];
  /**
   * The media type of each file dragged, as the source declares them, each
   * once (HTML5's `DataTransferItem.type` of the items of kind `file`): known
   * before the drop, where the content is not. Empty for a drag that carries
   * no files, or whose source declares none of their types.
   */
  readonly fileTypes: readonly string[];
}

/** A drop on a target: where, the action it took and the content. */
export interface DropTargetDropEvent extends DropTargetDragEvent {
  readonly action: DragAction;
  readonly data: DropData;
}

/**
 * The adapter's drop target (`DropTarget`, with `drag-and-drop`): a view that
 * takes drops from any application, its children inside it. The platform
 * answers the drag itself from these props (the kinds it accepts and the
 * actions it supports), so a drag never waits on JavaScript; the callbacks
 * follow it.
 */
export interface PlatformDropTargetProps {
  readonly accept: readonly DropKind[];
  /**
   * The media types of files it takes (`image/png`, or `image/*`), case
   * ignored and parameters too: a drag of files is taken (as `files`) only
   * when every file dragged is of one of them, as a Mac's Dock lights an
   * application's icon only for documents it opens. A drag whose files' types
   * the source does not declare is not taken. Absent: files of any type.
   */
  readonly acceptFileTypes?: readonly string[];
  /** The actions it supports; the first is its preferred one unless `preferredAction` says. */
  readonly actions: readonly DragAction[];
  readonly preferredAction?: DragAction;
  /**
   * The folder files dropped on it go into, as a `file://` URI. Where the
   * platform knows the volume each dragged file is on, a drag of files
   * prefers a move when every one is on this folder's volume and a copy when
   * any is not, as Finder does, if `actions` allows both; Option still forces
   * a copy and Command a move. Absent, or a drag that says no volumes: the
   * preferred action stands.
   */
  readonly folder?: string;
  /** Takes nothing while true. */
  readonly disabled?: boolean;
  onDragEnter?(event: DropTargetDragEvent): void;
  onDragOver?(event: DropTargetDragEvent): void;
  onDragLeave?(): void;
  onDrop(event: DropTargetDropEvent): void;
  readonly style?: unknown;
  readonly testID?: string;
  readonly children?: ReactNode;
}

/** What an application drags: files as `file://` URIs, text, a URL, HTML. */
export interface DragData {
  readonly files?: readonly string[];
  readonly text?: string;
  readonly url?: string;
  readonly html?: string;
  /**
   * Other media types and their content as text, offered after the kinds
   * above, each by its name: `{ 'application/x-oxyos-application':
   * 'so.oxy.inbox' }`, an application dragged out of a launcher or a dock. A
   * target takes one by naming it in `accept`, and finds it in `DropData`'s
   * `other`.
   */
  readonly other?: Readonly<Record<string, string>>;
}

/**
 * Why a drag ended without a drop (`PlatformDragRequest.onCancel`), as
 * Wayland's and OxyOS's drag cancellations say: the person pressed Escape; the
 * drag was released over nothing that takes it (or over a target that would
 * drop nothing); the platform refused it at its start (no press held); or it
 * was cancelled otherwise (the source cancelled it, its window went, the
 * session locked).
 */
export type DragCancelReason = 'escape' | 'not-accepted' | 'refused' | 'cancelled';

/** A drag the application starts (`PlatformDrag.start`). */
export interface PlatformDragRequest {
  readonly data: DragData;
  /** The actions it allows (at least one). */
  readonly actions: readonly DragAction[];
  /**
   * The dragged view itself, where it is (an item's icon and name, a card):
   * the platform draws its rendered subtree as it looks, translucent, as the
   * drag's image, with the point pressed in it kept under the pointer, as a
   * Mac's dragged items are. It must be a view of its own: one that draws
   * nothing itself takes `collapsable={false}`, as a view snapshot needs.
   * None: the platform's own image.
   */
  readonly previewRef?: RefObject<ComponentRef<typeof View> | null>;
  /**
   * How many items are dragged, the one `previewRef` shows among them. Above
   * one the image is shown stacked, with the count on a badge at its top
   * right, as a Mac's drag of several files. Default 1.
   */
  readonly count?: number;
  /**
   * Dropped on nothing that takes it, the image vanishes in a puff of smoke
   * where it is, instead of sliding back to its item: an item dragged out of a
   * list to remove it, as a Mac's Dock removes an icon dragged off it
   * (`NSDraggingSession`'s `animatesToStartingPositionsOnCancelOrFail` off,
   * and the poof). The drag still resolves with none; Escape still puts the
   * image back. Default false.
   */
  readonly vanish?: boolean;
  /**
   * The drag ended without a drop, and why (`DragCancelReason`): called once,
   * before the drag resolves with none. A dock tells a release off it (remove
   * the icon) from Escape (put it back) by it. Where the platform cannot tell
   * Escape from a release over nothing (HTML5's `dragend` with `dropEffect`
   * `none`), it says `not-accepted`.
   */
  readonly onCancel?: (reason: DragCancelReason) => void;
}

/**
 * Dragging between applications (`drag-and-drop`): the application starts a
 * drag from the press it is handling (a mouse press moved past its slop, as
 * macOS's `beginDraggingSession` from `mouseDragged`), and the platform owns
 * it from then on.
 */
export interface PlatformDrag {
  /**
   * Starts the drag; resolves with the action the drop took, or null when it
   * was cancelled (Escape, a release over nothing that takes it) or refused
   * (no press held). With `move` of data the application deletes its
   * original; files are moved by the target.
   */
  start(request: PlatformDragRequest): Promise<DragAction | null>;
  /**
   * Follows drags over the application's window, from any application
   * (`useWindowDrag`): `enter` when a drag first comes over any of the
   * window's surfaces, `exit` when it has left all of them or ended, with
   * `dropped` true when it was dropped on one of them, told once that drop
   * was delivered (after the target's `onDrop`). Returns the function that
   * stops following. Absent: the platform does not say, and nothing is told.
   */
  watchWindow?(listener: (event: PlatformWindowDragEvent) => void): () => void;
}

/** A drag coming over the application's window, or leaving it (`PlatformDrag.watchWindow`). */
export type PlatformWindowDragEvent =
  | { readonly type: 'enter' }
  | { readonly type: 'exit'; readonly dropped: boolean };

/** Why the platform closed a popup without the application asking. */
export type PopupDismissReason =
  /** A press outside the popup and its parents. */
  | 'outside-press'
  /** The platform refused the popup's input grab. */
  | 'denied'
  /** The parent went away, was hidden, the session locked, or similar. */
  | 'closed';

/**
 * Props of an adapter's `PopupSurface`. Placement uses Bloom's own vocabulary
 * (`FloatingPositionProps`); the platform turns it into its positioner and
 * keeps the panel on screen (flip on the side axis, slide on the other).
 */
export interface PopupSurfaceProps {
  /**
   * The view the popup is anchored to (the trigger). It may change while the popup is open, and
   * the content's size with it: the platform places the same popup again against the new view,
   * at the new size, never closing it for another (a menu bar's one popup changing from one menu
   * into the next, moving between the titles frame by frame).
   */
  anchorRef: RefObject<ComponentRef<typeof View> | null>;
  /**
   * A point in the anchor, in layout pixels from its top-left corner, that the
   * popup is placed against instead of the anchor's frame: a context menu opens
   * where the pointer was pressed. `side`, `align` and the offsets apply to it
   * as to a frame of no size. A platform that cannot place a popup at a point
   * never reports `popup-surface` to a context menu.
   */
  point?: { x: number; y: number };
  /**
   * A view beside the popup that the pointer goes on driving while the popup
   * is open: a menu bar, whose titles open their menus in turn as the pointer
   * crosses them, as a Mac's menu bar tracks the pointer with a menu open. The
   * platform delivers the pointer's movement over this view (and over nothing
   * else outside the popup) while the popup holds its input grab; a press there
   * still closes the popup as any press outside it does. A platform that
   * cannot ignores it, and the bar then switches menus by press only.
   */
  trackingRef?: RefObject<ComponentRef<typeof View> | null>;
  side: FloatingSide;
  align: FloatingAlign;
  sideOffset: number;
  alignOffset: number;
  /**
   * Accessible role of the popup's content. A `tooltip` is a hint, not a
   * control: the platform shows it without taking the pointer or the keyboard
   * (no grab, presses pass through it) while it is mounted, and closes it
   * itself only with its parent.
   */
  role: 'menu' | 'listbox' | 'dialog' | 'tooltip';
  /** Accessible name. */
  label?: string;
  /** Called once when the platform closes the popup itself. */
  onDismiss: (reason: PopupDismissReason) => void;
  /**
   * Keys pressed while the popup has keyboard focus, as W3C `KeyboardEvent.key`
   * names (`ArrowDown`, `Enter`, `Escape`, … or the typed character). A platform
   * without a keyboard never calls it.
   */
  onKey?: (key: string) => void;
  testID?: string;
  /** The panel, sized by its own content. */
  children: ReactNode;
}

/**
 * Where a window's controls are, the same for every application on the
 * platform. Lengths are in layout pixels from the window's top and from its
 * LEADING edge: the left in a left-to-right locale, the right in a
 * right-to-left one.
 */
export interface PlatformWindowMetrics {
  /** The controls' group: three targets of equal size, evenly spaced across `width`. */
  readonly controls: {
    readonly start: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  /** The room the content keeps clear for them. */
  readonly room: { readonly top: number; readonly leading: number };
  /** The window's corner radius, for panels concentric with it. */
  readonly radius: number;
}

/** What the platform tells a window about itself. */
export interface PlatformWindowState {
  /** The active window: it, or one of its popups or dialogs, has the keyboard focus. */
  readonly active: boolean;
  /** Zoomed to fill the work area. */
  readonly maximized: boolean;
  /** Full screen: no controls and no room. */
  readonly fullscreen: boolean;
}

/**
 * The application's window, with the `window` capability. Its state is an
 * external store (`getState` + `subscribe`, as `useSyncExternalStore` reads
 * it); the actions are requests the platform carries out.
 */
export interface PlatformWindow {
  /**
   * Who draws the controls: `bloom` draws them inside the application, in the
   * platform's place (OxyOS); `platform` draws its own (a Mac's traffic
   * lights, a browser's over an installed web application) and Bloom only
   * keeps their room.
   */
  readonly controls: 'bloom' | 'platform';
  readonly metrics: PlatformWindowMetrics;
  getState(): PlatformWindowState;
  /** Calls `listener` whenever `getState()` changes; returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
  /** The application's close request (the close control). */
  close(): void;
  minimize(): void;
  /** Maximize, or restore the frame the window had. */
  zoom(): void;
  /** Start an interactive move from the press being handled. */
  startMove(): void;
  /**
   * The sizes the window can take: the platform never sizes it outside them
   * (a resize by its edges stops at them, and zoom fills the work area only
   * up to them). Replaces the last. Optional: a platform whose windows take
   * any size leaves it out, and Bloom then asks nothing.
   */
  setSizeLimits?(limits: PlatformWindowSizeLimits): void;
}

/**
 * The sizes a window can take, in layout pixels. A zero is no bound: no
 * minimum beyond the platform's own, no maximum.
 */
export interface PlatformWindowSizeLimits {
  readonly minWidth: number;
  readonly minHeight: number;
  readonly maxWidth: number;
  readonly maxHeight: number;
}

/**
 * One entry of a menu the platform shows (`PlatformMenuBar`). Plain data: the
 * platform draws it and reports a choice by `id`; it never runs anything.
 *
 * - `item`: a command. `label` is its text, `shortcut` its key chord in Bloom's
 *   spelling (`Mod+Shift+Z`, see `PlatformMenuBar`), `checked` its state when it
 *   is a check item or one item of a radio group (absent on a plain command).
 * - `submenu`: a nested menu, opened from a row labelled `label`.
 * - `separator`: a rule between groups of entries.
 *
 * `enabled` is false for an entry that cannot be chosen now, including every
 * entry under a disabled submenu or menu. A menu's group label (`MenubarLabel`)
 * is described as an item that is never enabled.
 */
export type PlatformMenuItem =
  | {
      readonly kind: 'item';
      readonly id: string;
      readonly label: string;
      readonly enabled: boolean;
      readonly shortcut?: string;
      /** Check items and radio items only. */
      readonly checked?: boolean;
    }
  | {
      readonly kind: 'submenu';
      readonly id: string;
      readonly label: string;
      readonly enabled: boolean;
      readonly items: readonly PlatformMenuItem[];
    }
  | { readonly kind: 'separator' };

/** One menu of the bar: `File`, `Edit`, … in the order the application declares them. */
export interface PlatformMenu {
  readonly id: string;
  readonly label: string;
  readonly items: readonly PlatformMenuItem[];
}

/**
 * The platform's menu bar, with the `menu-bar` capability: the bar at the top
 * of the screen that shows the active window's menus (OxyOS's shell, a Mac's
 * `NSMenu`).
 *
 * Ids are Bloom's own, stable for as long as the entry is mounted, and unique
 * in the window. A shortcut is a chord (`Mod+N`, `Mod+Shift+Z`): `+`-separated
 * modifiers out of `Mod` (the platform's command modifier: ⌘ on Apple
 * platforms, Ctrl elsewhere), `Ctrl`, `Alt`, `Shift` and `Meta`, in that
 * order, then one key (a character, upper case for a letter, or a W3C
 * `KeyboardEvent.key` name such as `Enter`, `ArrowUp`, `F5`; `Space` and
 * `Plus` for those two). The platform only SHOWS a shortcut: Bloom matches the
 * window's keys itself and runs the item, so the platform must never run an
 * item for a key of its own.
 */
export interface PlatformMenuBar {
  /** The window's menus now; replaces the last. An empty list: none. */
  setMenus(menus: readonly PlatformMenu[]): void;
  /**
   * An item the person chose in the platform's bar, by the id Bloom gave it.
   * Returns the unsubscribe. An id Bloom no longer has, or a disabled item's,
   * is ignored.
   */
  onActivate(listener: (id: string) => void): () => void;
}

/**
 * A key press as the platform reports it: W3C `KeyboardEvent`'s fields, the
 * shape React Native's own key events carry.
 */
export interface PlatformKeyEvent {
  /** `KeyboardEvent.key`: `n`, `N`, `Enter`, `ArrowDown`, … */
  readonly key: string;
  /** `KeyboardEvent.code`, the physical key (`KeyN`), when the platform knows it. */
  readonly code?: string;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  /** Held down and repeating. */
  readonly repeat?: boolean;
  /** Part of an input method's composition. */
  readonly isComposing?: boolean;
}

/**
 * The window's key presses, for a platform whose keys do not reach Bloom
 * through a DOM `document` (a native host). Optional and not a capability: it
 * changes no presentation. Without it Bloom listens on the `document` where
 * there is one (the web) and hears no window-wide keys elsewhere.
 */
export interface PlatformKeyboard {
  /**
   * Calls `listener` with each key press in the window, BEFORE the focused
   * view receives it (as a Mac's menu bar sees key equivalents first). It
   * returns true when Bloom took the key (a menu's shortcut ran): the platform
   * then does not deliver it to the focused view. Returns the unsubscribe.
   */
  subscribe(listener: (event: PlatformKeyEvent) => boolean): () => void;
}

/**
 * A standard editing action: what a Mac's Edit menu sends to the first
 * responder (`undo:`, `cut:`, `pasteAsPlainText:`, …), Android's
 * `TextView.onTextContextMenuItem` ids (`android.R.id.copy`, …) and
 * Electron's menu roles. `pasteAndMatchStyle` pastes as plain text, which in a
 * plain text field is a paste; `delete` deletes the selection.
 */
export type PlatformEditAction =
  | 'undo'
  | 'redo'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'pasteAndMatchStyle'
  | 'delete'
  | 'selectAll';

/**
 * Which standard editing actions the first responder can perform now, as
 * `NSTextView`'s `validateMenuItem:` answers: one flag per action.
 */
export type PlatformEditingState = Readonly<Record<PlatformEditAction, boolean>>;

/**
 * The window's first responder for the standard editing actions: the focused
 * text field, whatever component it is (Bloom's `TextField`, a bare
 * `TextInput`), as the platform knows it. Optional and not a capability: it
 * changes no presentation. A `MenubarItem` with an `action` sends it here
 * while a field is focused (an Edit menu's Copy copies the field's selection),
 * and falls back to its own `onPress` when none is. An external store
 * (`getState` + `subscribe`).
 */
export interface PlatformEditing {
  /**
   * What the focused text field can do now; null when no text field has focus
   * (nothing in the window is a text field's first responder). While it is not
   * null the field is the target of every action, as a Mac's first responder
   * is of the actions it implements: an action it cannot perform now is
   * disabled, never passed on.
   */
  getState(): PlatformEditingState | null;
  /**
   * Calls `listener` whenever `getState()` may have changed: focus, the
   * field's text, selection or history, the clipboard. Returns the unsubscribe.
   */
  subscribe(listener: () => void): () => void;
  /**
   * Performs `action` on the focused text field, as its own key or context
   * menu row would (the clipboard cites the person's latest input). Returns
   * whether a field performed it.
   */
  perform(action: PlatformEditAction): boolean;
}

/** What the platform's appearance is now (`PlatformAppearance.getState`). */
export interface PlatformAppearanceState {
  /**
   * The person's accent, by the name of one of Bloom's colour presets
   * (`APP_COLOR_PRESETS`: `oxy`, `blue`, `purple`, `pink`, …), or null for
   * none. A name Bloom does not know is treated as none.
   */
  readonly accent: string | null;
  /** Draw every blurred material opaque, with no backdrop blur. */
  readonly reduceTransparency: boolean;
  /**
   * Increase contrast: reduce transparency, and edge every surface with a
   * hairline that holds 3:1 against its body. Optional; absent is false.
   */
  readonly increaseContrast?: boolean;
}

/**
 * The platform's appearance, with the `appearance` capability: what it asks
 * every application to look like beyond light or dark (which React Native's
 * `Appearance` and `useColorScheme` carry). An external store (`getState` +
 * `subscribe`, as `useSyncExternalStore` reads it): a change applies at once,
 * with no restart.
 */
export interface PlatformAppearance {
  getState(): PlatformAppearanceState;
  /** Calls `listener` whenever `getState()` changes; returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
}

/**
 * One of the person's places (`PlatformFiles.places`): their home, a standard
 * folder in it, or a volume mounted for them (a USB stick, a card).
 */
export interface PlatformPlace {
  readonly kind:
    | 'home'
    | 'desktop'
    | 'documents'
    | 'downloads'
    | 'pictures'
    | 'music'
    | 'videos'
    | 'volume';
  /** The name the platform gives it: the folder's own, a volume's label. */
  readonly name: string;
  /** The folder's `file://` URI, as `expo-file-system`'s `Directory` takes it. */
  readonly uri: string;
}

/** An item in the Trash (`PlatformFiles.trashed`). */
export interface PlatformTrashedItem {
  /** Its `file://` URI in the Trash: what `restore` and `erase` take. */
  readonly uri: string;
  /** Its name where it was. */
  readonly name: string;
  readonly isDirectory: boolean;
  /** Where it was, as a `file://` URI; null when the Trash no longer says. */
  readonly originalUri: string | null;
  /** When it was put in the Trash, in milliseconds since the epoch; null when the Trash does not say. */
  readonly deletedAt: number | null;
  /** Its size in bytes; null for a folder. */
  readonly size: number | null;
  /** When its content last changed, in milliseconds since the epoch. */
  readonly lastModified: number | null;
  /** Its tags as it sits in the Trash (Finder's Trash shows them); empty when it has none. */
  readonly tags: readonly PlatformFileTag[];
}

/**
 * Why the platform did not do something to an item:
 *
 * - `not-found`: nothing is there;
 * - `exists`: an item with that name is already where it would go (an item is
 *   never put back over another);
 * - `refused`: the platform does not let an application change it (the home
 *   itself, a volume's root, anything outside the person's files);
 * - `denied`: the file system did not allow it;
 * - `io`: anything else the file system answered.
 */
export type PlatformFileError = 'not-found' | 'exists' | 'refused' | 'denied' | 'io';

/**
 * What came of one item of a request about several: `result` is where the
 * item is now (its URI in the Trash after `trash`, where it was put back after
 * `restore`, its old URI in the Trash after `erase`).
 */
export type PlatformFileOutcome =
  | { readonly uri: string; readonly ok: true; readonly result: string }
  | { readonly uri: string; readonly ok: false; readonly error: PlatformFileError };

/**
 * What the platform asks of an application it started to choose files for
 * another (an open or save panel shown as a sheet of that application's
 * window): `PlatformFileChooser.request`.
 */
export interface PlatformFileChooserRequest {
  /** `open`: existing items are chosen; `save`: the one file to write. */
  readonly mode: 'open' | 'save';
  /** Several items may be chosen (`open`). */
  readonly multiple: boolean;
  /** Folders are chosen, not files (`open`). */
  readonly directory: boolean;
  /**
   * What may be chosen: media types (`image/png`, `image/*`) and extensions
   * (`.png`). Empty: anything.
   */
  readonly types: readonly string[];
  /** The panel's title, when the asker gave one. */
  readonly title: string | null;
  /** The name a `save` panel starts with, when the asker gave one. */
  readonly suggestedName: string | null;
  /** Where to start, as a `file://` URI, when the asker said. */
  readonly folder: string | null;
  /** Who asks: the application whose window the panel is a sheet of, when the platform knows it. */
  readonly application: { readonly id: string; readonly name: string } | null;
}

/**
 * The request the platform started this application to answer, as the
 * person's file chooser (`PlatformFiles.chooser`). The application shows its
 * open or save panel for `request` and answers exactly once.
 */
export interface PlatformFileChooser {
  readonly request: PlatformFileChooserRequest;
  /**
   * The person chose: `file://` URIs (for `save`, the one file to write, its
   * replacing already confirmed by the panel). The platform cites the latest
   * press the application received, then closes the panel.
   */
  choose(uris: readonly string[]): void;
  /** The person cancelled. The platform closes the panel. */
  cancel(): void;
}

/** A tag's colour: Finder's seven. */
export type PlatformTagColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'grey';

/** A tag on an item: its name and, where the item itself says one (a Mac's tags do), its colour. */
export interface PlatformFileTag {
  readonly name: string;
  readonly color: PlatformTagColor | null;
}

/** An item the platform's index found carrying a tag (`PlatformFileTags.tagged`). */
export interface PlatformTaggedItem {
  readonly uri: string;
  readonly name: string;
  readonly isDirectory: boolean;
  /** Bytes; null for a folder. */
  readonly size: number | null;
  /** Milliseconds since the epoch. */
  readonly lastModified: number | null;
  readonly tags: readonly PlatformFileTag[];
}

/** A change to items' tags: each of `add` once (case aside, appended in order), each of `remove` gone. */
export interface PlatformTagChange {
  readonly add?: readonly PlatformFileTag[];
  readonly remove?: readonly string[];
}

/** A tag name the index found, and how many items carry it. */
export interface PlatformTagName {
  readonly name: string;
  readonly count: number;
}

/**
 * The person's tags on their files (a desktop's Finder tags), where the
 * platform keeps them (`PlatformFiles.tags`). Tag names compare without
 * regard to case, the first spelling kept. Every URI is `file://`, as
 * `expo-file-system` gives them.
 */
export interface PlatformFileTags {
  /** The tags of what a folder holds, by each item's URI as `Directory.list()` writes it; items with none left out. */
  inFolder(folderUri: string): Promise<Readonly<Record<string, readonly PlatformFileTag[]>>>;
  /** Each item's tags, in the order asked; null for an item that is not there. */
  ofItems(uris: readonly string[]): Promise<readonly (readonly PlatformFileTag[] | null)[]>;
  /** Changes items' tags, each on its own; an outcome per item, `result` its URI. */
  change(
    uris: readonly string[],
    change: PlatformTagChange,
  ): Promise<readonly PlatformFileOutcome[]>;
  /** Every item in the person's places (not the Trash's) carrying `name`, case aside, from the platform's index. */
  tagged(name: string): Promise<readonly PlatformTaggedItem[]>;
  /** Every tag the index found on the person's items. */
  names(): Promise<readonly PlatformTagName[]>;
  /** Calls `listener` when the index changes (an item's tags, a tagged item moved, gone or come); the unsubscribe. */
  watch(listener: () => void): () => void;
}

/** A place the person's backups are kept (`PlatformFileBackups.state`): a disk, or a share on a NAS. */
export interface PlatformBackupDestination {
  readonly id: string;
  /** Its name as the person knows it: a disk's label, a share's. */
  readonly name: string;
  readonly kind: 'disk' | 'share';
  /** Connected (a disk) or reachable (a share): its backups can be browsed and restored from now. */
  readonly available: boolean;
  /** Its newest backup, in milliseconds since the epoch; null before the first. */
  readonly lastBackup: number | null;
  /** Its oldest backup still kept, in milliseconds since the epoch. */
  readonly oldestBackup: number | null;
}

/** Where the person's backups are kept, and when the last was made. */
export interface PlatformBackupsState {
  /** Empty where no backup is kept (none was set up): an application then shows none. */
  readonly destinations: readonly PlatformBackupDestination[];
  /** The newest backup of any destination, in milliseconds since the epoch. */
  readonly lastBackup: number | null;
  /** A backup is being made now. */
  readonly backingUp: boolean;
}

/** One backup: the moment it was made, on the destination that keeps it. */
export interface PlatformBackup {
  /** The destination that keeps it (`PlatformBackupDestination.id`). */
  readonly destination: string;
  /** The backup's own id on it. */
  readonly id: string;
  /** When it was made, in milliseconds since the epoch. */
  readonly time: number;
}

/**
 * A version of an item: what one backup held of it (`PlatformFileBackups.versions`).
 * A file has a version for each backup it changed in; a folder has one in
 * every backup (what it holds may have changed though it did not).
 */
export interface PlatformFileVersion {
  readonly backup: PlatformBackup;
  readonly isDirectory: boolean;
  /** Bytes; null for a folder. */
  readonly size: number | null;
  /** When its content had last changed, as the backup holds it, in milliseconds since the epoch. */
  readonly lastModified: number | null;
}

/** An item a folder held in a backup (`PlatformFileBackups.contents`). */
export interface PlatformBackupItem {
  /** Where it was (and may still be), under the folder's URI as asked: what `versions` and `restore` take. */
  readonly uri: string;
  readonly name: string;
  readonly isDirectory: boolean;
  /** Bytes; null for a folder. */
  readonly size: number | null;
  /** Milliseconds since the epoch. */
  readonly lastModified: number | null;
}

/** How a restore is told its progress: bytes written, of `totalBytes` (null for a folder, whose size is known only at the end). */
export interface PlatformRestoreProgress {
  readonly bytesWritten: number;
  readonly totalBytes: number | null;
}

/** How an item is restored (`PlatformFileBackups.restore`). */
export interface PlatformRestoreOptions {
  /**
   * The folder to restore into (Restore to…), as a `file://` URI. Absent:
   * where the item is, or was.
   */
  readonly to?: string;
  /**
   * Where an item of the same name is there: replace it, in one step (true),
   * or keep both (false, the default), the restored item beside it named as
   * a Mac's Time Machine names it, `notes (original).txt`, then
   * `notes (original 2).txt`. The platform never replaces what the person may
   * not change (their home's standard folders).
   */
  readonly replace?: boolean;
  /** Told as the item is written. */
  readonly onProgress?: (progress: PlatformRestoreProgress) => void;
  /** Aborting it stops the restore; nothing half written is left, and it rejects with `cancelled`. */
  readonly signal?: AbortSignal;
}

/** What came of a restore. */
export interface PlatformRestored {
  /** Where the item is now: its own name, or the kept one beside it. */
  readonly uri: string;
  /**
   * Items of a folder left out: links that led out of it, devices, pipes and
   * sockets, none of which are a person's files.
   */
  readonly skipped: number;
}

/**
 * Why a backup's question or restore failed, as the error's `code`: the
 * file errors (`PlatformFileError`), and
 *
 * - `unavailable`: the backup is not reachable now (its disk is not
 *   connected, its share not answering) or the platform's backups are not
 *   running;
 * - `not-permitted`: the application may not reach the person's backups;
 * - `cancelled`: the restore's signal was aborted.
 */
export type PlatformBackupError = PlatformFileError | 'unavailable' | 'not-permitted' | 'cancelled';

/**
 * The person's backups of their files, for a platform that makes them (a
 * desktop's Time Machine): an item's past versions, a folder as it was at a
 * backup, and restoring either, as the person, beside what is there or in its
 * place. Present only where the platform has backups at all; an application
 * shows them only while `state()` names a destination. Every URI is
 * `file://`, as `expo-file-system` gives them. A promise rejects with an
 * `Error` whose `code` is a `PlatformBackupError`.
 */
export interface PlatformFileBackups {
  /** Where backups are kept and when the last was made. */
  state(): Promise<PlatformBackupsState>;
  /** Calls `listener` when the state changes (a destination added or gone, a backup made); returns the unsubscribe. */
  watch(listener: () => void): () => void;
  /** The item's versions, newest first; empty for an item no backup holds. */
  versions(uri: string): Promise<readonly PlatformFileVersion[]>;
  /** What the folder at `folderUri` held in `backup`, its files and folders. */
  contents(backup: PlatformBackup, folderUri: string): Promise<readonly PlatformBackupItem[]>;
  /** Restores the item at `uri` as `backup` held it. */
  restore(
    backup: PlatformBackup,
    uri: string,
    options?: PlatformRestoreOptions,
  ): Promise<PlatformRestored>;
}

/**
 * The person's files beyond what `expo-file-system` reaches, for a platform
 * that has them: their places (a desktop's home, standard folders and
 * volumes), the Trash every file manager on it shares and, where it keeps
 * them, their tags on their files and their backups. Optional and not a
 * capability (it changes no presentation). Without it an application has the
 * folders `expo-file-system` gives it (`Paths.document`) and deletes as that
 * API does, for good.
 *
 * Every URI is `file://`, as `expo-file-system` takes and gives them: an
 * application reads and changes what a place holds through that API, and
 * watches it with `Directory.watch`.
 */
export interface PlatformFiles {
  /** The person's places now: their home, the standard folders in it that exist, the volumes. */
  places(): Promise<readonly PlatformPlace[]>;
  /** Calls `listener` when the places change (a volume mounted or gone); returns the unsubscribe. */
  watchPlaces(listener: () => void): () => void;
  /** Puts items in the Trash; each outcome's `result` is the item's URI there. */
  trash(uris: readonly string[]): Promise<readonly PlatformFileOutcome[]>;
  /** What the Trash holds. */
  trashed(): Promise<readonly PlatformTrashedItem[]>;
  /** Calls `listener` when what the Trash holds changes; returns the unsubscribe. */
  watchTrash(listener: () => void): () => void;
  /** Puts items in the Trash back where they were, never over an item there now. */
  restore(uris: readonly string[]): Promise<readonly PlatformFileOutcome[]>;
  /** Deletes items in the Trash for good. */
  erase(uris: readonly string[]): Promise<readonly PlatformFileOutcome[]>;
  /** Deletes everything in the Trash for good. */
  emptyTrash(): Promise<void>;
  /**
   * Present only in an application the platform started as the person's file
   * chooser (a file manager in its picker mode): the request it answers.
   */
  readonly chooser?: PlatformFileChooser;
  /**
   * The person's tags on their files, for a platform that keeps them (a
   * desktop's Finder tags). Absent: the platform keeps none, and an
   * application keeps its own or shows none.
   */
  readonly tags?: PlatformFileTags;
  /**
   * The person's backups of their files (an item's past versions, a folder as
   * it was, restoring), for a platform that makes them. Absent: the platform
   * keeps none, and an application shows nothing of backups.
   */
  readonly backups?: PlatformFileBackups;
}

/**
 * What a search result is, by kind, as the person picks it in a search field's
 * filters (Finder's "Kind"): an application, a page of Settings, a folder, a
 * document by its kind (`pdf`, `text`, `source` code, `presentation`,
 * `spreadsheet`), media (`image`, `movie`, `music`), an `archive`, an
 * application's own item (`contact`, `event`, `mail`, `message`) or anything
 * else (`other`).
 */
export type PlatformSearchCategory =
  | 'application'
  | 'settings'
  | 'folder'
  | 'document'
  | 'pdf'
  | 'text'
  | 'source'
  | 'presentation'
  | 'spreadsheet'
  | 'image'
  | 'movie'
  | 'music'
  | 'archive'
  | 'contact'
  | 'event'
  | 'mail'
  | 'message'
  | 'other';

/** A search field's token (Finder's "Kind: PDF"), a filter the person chose. */
export type PlatformSearchToken =
  | { kind: 'category'; value: PlatformSearchCategory }
  | { kind: 'tag'; value: string }
  | { kind: 'date'; value: 'today' | 'yesterday' | 'week' | 'month' | 'year' }
  | { kind: 'name'; value: string };

/**
 * A question to the platform's index (`PlatformSearch.query`), as a Mac's
 * `NSMetadataQuery` asks Spotlight: the words typed, the filters chosen and
 * where to look.
 */
export type PlatformSearchQuery = {
  /** What the person typed: words matched as prefixes of words in names and contents, "quoted phrases", and typed filters (kind:pdf, tag:Work, date:today, name:report). */
  text: string;
  /** The filters the person chose as tokens; every one must match. */
  tokens?: readonly PlatformSearchToken[];
  /** Only items inside these folders (file:// URIs), recursively. */
  within?: readonly string[];
  /** Only these categories. */
  categories?: readonly PlatformSearchCategory[];
  /** At most this many items (the platform's default 60, at most 200). */
  limit?: number;
  /** The language titles are given in (a BCP 47 tag); the platform's own when absent. */
  language?: string;
};

/**
 * One result: a file or folder, an application, a page of Settings, or an
 * application's own item it donated (`PlatformSearch.index`).
 */
export type PlatformSearchItem = {
  /** Stable while the item exists: a file's URI, `application:<id>`, `settings:<page>`, `<application id>:<its id>` for an application's own items. */
  id: string;
  /** What it is. */
  category: PlatformSearchCategory;
  /** Its name as the person reads it, in the query's language. */
  title: string;
  /** A file's or folder's file:// URI. */
  uri?: string;
  /** What opens anything that is not a file: an application's or Settings' URL. */
  url?: string;
  /** The application it is, or the one whose item it is. */
  application?: string;
  /** A picture for it (an application's icon), file://. */
  icon?: string;
  /** A file's media type. */
  contentType?: string;
  /** A file's size in bytes. */
  size?: number;
  /** Milliseconds since the epoch. */
  modified?: number;
  /** When it was made, in milliseconds since the epoch. */
  created?: number;
  /** When the person last opened it, in milliseconds since the epoch. */
  lastUsed?: number;
  /** The person's tags on it (`PlatformFiles.tags`). */
  tags?: readonly string[];
  /** Text around what matched in its contents. */
  snippet?: string;
  /** Where a file is, as the person reads it (`Documents › Work`). */
  location?: string;
};

/** What a query found (`PlatformSearch.query`), best first. */
export type PlatformSearchResults = {
  /** The items found, in the platform's order of relevance. */
  items: readonly PlatformSearchItem[];
  /** The id of the item the platform judged best, shown first. */
  topHit: string | null;
  /** Whether the platform is still indexing, so results may be incomplete. */
  indexing: boolean;
};

/** An application's own item, donated to the platform's index (Core Spotlight's CSSearchableItem). */
export type PlatformSearchableItem = {
  /** The application's own id for it, unique within the application. */
  id: string;
  /** Its name as the person reads it. */
  title: string;
  /** What it is. */
  category: 'contact' | 'event' | 'mail' | 'message' | 'other';
  /** Its contents, matched as a file's are. */
  text?: string;
  /** More words it is found by, never shown. */
  keywords?: readonly string[];
  /** What opens it: the application's URL. */
  url: string;
  /** Milliseconds since the epoch. */
  modified?: number;
};

/**
 * The platform's search across the person's files, applications, Settings and
 * applications' own items, for a platform that keeps an index (a desktop's
 * Spotlight). Optional and not a capability, as `files` is: an application
 * without it searches only what it holds itself. Modelled on a Mac's
 * `NSMetadataQuery` (asking) and Core Spotlight (donating).
 */
export interface PlatformSearch {
  /** Asks the index. A query the person has since changed may be dropped by its caller. */
  query(query: PlatformSearchQuery): Promise<PlatformSearchResults>;
  /** Told whenever the index changed, to query again; returns the unsubscribe. */
  watch(listener: () => void): () => void;
  /** The person opened this result: the platform ranks it higher. */
  used(id: string): void;
  /** The application's own items. */
  readonly index: {
    /** Adds the items, or replaces those with the same ids. */
    donate(items: readonly PlatformSearchableItem[]): Promise<void>;
    /** Removes the items with these ids. */
    remove(ids: readonly string[]): Promise<void>;
    /** Removes every item this application donated. */
    removeAll(): Promise<void>;
  };
}

/**
 * A sound the platform plays for something the person did, by its meaning:
 * putting items in the Trash (`move-to-trash`) and emptying it for good
 * (`empty-trash`), as a Mac's Finder and Dock play them.
 */
export type PlatformSystemSound = 'move-to-trash' | 'empty-trash';

/**
 * The platform's own sounds, for a platform that has them. Optional and not a
 * capability (it changes no presentation). An application asks for a sound by
 * its meaning and ships no copy of it: every application on the platform
 * sounds the same, at the person's interface sounds setting.
 */
export interface PlatformSounds {
  /**
   * Plays `sound` for what the person just did, as the platform plays its
   * own: never when they turned interface sound effects off or the sound
   * output is muted, and without waiting for it. The platform cites the
   * latest input the application received, so a sound follows the person's
   * own action.
   */
  play(sound: PlatformSystemSound): void;
}

/**
 * A host platform's surfaces, registered with `BloomProvider platform={…}`
 * (or `PlatformSurfaceProvider`) by the runtime that runs the application. A
 * `BloomProvider` with no `platform` of its own keeps the one around it, so an
 * application's own provider never hides its runtime's adapter.
 *
 * Bloom stays free of any platform's protocol: an adapter reports what it can
 * do and supplies the components that do it. A capability the adapter does
 * not report is never used, and the family keeps its default presentation (a
 * native menu stays a bottom sheet).
 */
export interface PlatformSurfaceAdapter {
  /** The platform's name, for diagnostics. */
  readonly platform: string;
  readonly capabilities: ReadonlySet<SurfaceCapability>;
  /**
   * Required with `popup-surface`. Renders its children in a popup of the
   * platform, in the SAME React tree: providers, theme, locale and state reach
   * the panel as they reach any child. Mounted while the popup is open.
   */
  readonly PopupSurface?: ComponentType<PopupSurfaceProps>;
  /** Required with `window`: the application's window. */
  readonly window?: PlatformWindow;
  /** Required with `menu-bar`: the platform's bar that shows this window's menus. */
  readonly menuBar?: PlatformMenuBar;
  /** Required with `appearance`: the accent and reduce transparency every application follows. */
  readonly appearance?: PlatformAppearance;
  /** The window's key presses, where they do not arrive through a DOM `document`. */
  readonly keyboard?: PlatformKeyboard;
  /** The focused text field as the standard editing actions' target, where the platform knows it. */
  readonly editing?: PlatformEditing;
  /** The person's places and the Trash, where the platform has them. */
  readonly files?: PlatformFiles;
  /** The platform's search of the person's files, applications and Settings, where it keeps an index. */
  readonly search?: PlatformSearch;
  /** The platform's own sounds, where it has them. */
  readonly sounds?: PlatformSounds;
  /** Required with `drag-and-drop`: the view that takes drops from any application. */
  readonly DropTarget?: ComponentType<PlatformDropTargetProps>;
  /** Required with `drag-and-drop`: dragging the application's own content out. */
  readonly drag?: PlatformDrag;
  /** Required with `material`: the view the platform fills with its blurred material. */
  readonly Material?: ComponentType<PlatformMaterialProps>;
}

/**
 * The adapter's material (`material`): a view the platform fills with what is
 * behind it, blurred and saturated as the platform's own materials are, behind
 * the window as well as within it (the desktop and the windows under a menu).
 * It has no content: Bloom lays the surface's tint and edge over it, clipped
 * to the surface's shape, and stops mounting it while transparency is reduced.
 */
export interface PlatformMaterialProps {
  /** Its frame and shape: the surface's (absolute fill, corner radii). */
  readonly style?: StyleProp<ViewStyle>;
  /** Light or dark, by Bloom's theme, so a surface never takes the other mode's material. */
  readonly appearance: 'light' | 'dark';
  readonly testID?: string;
}
