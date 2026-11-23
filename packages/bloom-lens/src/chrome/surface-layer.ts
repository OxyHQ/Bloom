import type { ReactNode } from "react";

// Platform-neutral description of one glass layer (the gallery components of chrome/). Imported as "./surface-layer";
// the platform entries are surface-nodes.web.tsx and surface-nodes.tsx. A layer is a list of nodes in
// window dp; the web renderer (surface-nodes.web.tsx) and the native renderer (surface-nodes.tsx, Kotlin
// SurfaceNodesView) draw the same list with the same material (ChromeMaterial / chromeGlassState) and the same springs.
// Components only compute nodes; they hold no material, motion or gesture code of their own.

// glass:     circle or rounded rectangle of the chrome material (no refraction)
// selection: the selection pill (refractive: the one material with refraction in the chrome)
// field:     glass rectangle with a text input on it (search field)
// label:     no material, only text (and a tap area); e.g. the segments of a segmented control
export type TNodeKind = "glass" | "selection" | "field" | "label";

export type TNode = {
  id: string;
  kind: TNodeKind;
  // window dp
  x: number;
  y: number;
  w: number;
  h: number;
  // corner radius dp (h / 2 for a pill or a circle)
  r: number;
  // Ionicons name, drawn centred (glass, label) or at the left inside a field
  icon?: string;
  // Index of a React child of SurfaceNodes (the `icons` prop) drawn centred in the node: the same mechanism as the
  // menu's iconSlot. Takes the place of `icon` when set. The child is a React view, so any icon set can be used.
  iconSlot?: number;
  // text drawn centred on the node (labels, title on a capsule, selection text)
  text?: string;
  textSize?: number;
  // colour of the icon and the text, #RRGGBB
  color?: string;
  // field: hint and current value
  placeholder?: string;
  value?: string;
  // a tap on the node emits onNodePress(id). Default true.
  pressable?: boolean;
};

export type TBox = { x: number; y: number; width: number; height: number };

export type TNodeRect = { x: number; y: number; w: number; h: number; r: number };

// Size classes (window dp). Compact: phone portrait; regular: from 480 dp (the Pixel 10 Pro is ~412 dp wide, so it
// is compact); expanded: from 840 dp, where the sidebar is shown.
export const REGULAR_MIN_WIDTH = 480;
export const EXPANDED_MIN_WIDTH = 840;
export type TSizeClass = "compact" | "regular" | "expanded";
export const sizeClassOf = (width: number): TSizeClass =>
  width >= EXPANDED_MIN_WIDTH ? "expanded" : width >= REGULAR_MIN_WIDTH ? "regular" : "compact";

// Metrics shared by the components (one place, so web and Android agree).
export const CHROME_METRICS = {
  // Circular glass button (search, FAB, toolbar circles, call buttons).
  circle: 56,
  // Height of a capsule bar (compact header, segmented control, toolbar pill).
  bar: 52,
  // Gap between separate glass shapes and the window side.
  gap: 8,
  margin: 16,
} as const;

// The rectangle of a node as it is at a given position of its spring (0 = from, 1 = to).
export const lerpRect = (from: TNodeRect, to: TNodeRect, t: number): TNodeRect => ({
  x: from.x + (to.x - from.x) * t,
  y: from.y + (to.y - from.y) * t,
  w: from.w + (to.w - from.w) * t,
  h: from.h + (to.h - from.h) * t,
  r: from.r + (to.r - from.r) * t,
});

export const rectOfNode = (node: TNode): TNodeRect => ({ x: node.x, y: node.y, w: node.w, h: node.h, r: node.r });

// One tab of an adaptive bar: an icon (Ionicons name) and its label.
export type TTabItem = { label: string; icon: string };

export type TSurfaceNodesProps = {
  nodes: readonly TNode[];
  // React views for the nodes' iconSlot (index = slot).
  icons?: readonly ReactNode[];
  // Tap on a pressable node (glass, selection, label).
  onNodePress?: (id: string) => void;
  // Text typed in a field node.
  onFieldText?: (id: string, text: string) => void;
  // A field gained (true) or lost (false) focus.
  onFieldFocus?: (id: string, focused: boolean) => void;
  // The field that must hold the keyboard, or null for none. Set by the component, not by the user's touch.
  focusedField?: string | null;
};
