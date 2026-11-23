// Search with a FAB, inline variant: one bar at the bottom: a field (glass, with its text input) and a circular create
// button at its right. Tapping the field opens the search: the FAB shrinks away, the field takes the width, and a
// "Cancelar" label appears at the right end. Cancel (or the keyboard going away) closes it.
// Geometry is computed here; the material, motion and gesture are SurfaceNodes (shared with the web and native layers).
import { useState, type ReactElement } from "react";

import { SurfaceNodes } from "./surface-nodes";
import { CHROME_METRICS, type TBox, type TNode } from "./surface-layer";

const CIRCLE = CHROME_METRICS.circle;
const CANCEL_WIDTH = 88;
const ACCENT = "#0A84FF";

export type TGlassSearchFabProps = {
  // Area the bar is laid out in (window dp).
  box: TBox;
  insetBottom: number;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onCreate: () => void;
  onOpenChange?: (open: boolean) => void;
};

// The nodes of the bar for a given state (exported for the layout check; the component is the only user).
export const searchFabNodes = (box: TBox, insetBottom: number, open: boolean, value: string, placeholder: string): TNode[] => {
  const margin = CHROME_METRICS.margin;
  const gap = CHROME_METRICS.gap;
  const y = box.y + box.height - insetBottom - margin - CIRCLE;
  const fabX = box.x + box.width - margin - CIRCLE;
  const fieldLeft = box.x + margin;
  const fieldRight = open ? box.x + box.width - margin - CANCEL_WIDTH - gap : fabX - gap;
  const nodes: TNode[] = [
    {
      id: "search",
      kind: "field",
      x: fieldLeft,
      y,
      w: fieldRight - fieldLeft,
      h: CIRCLE,
      r: CIRCLE / 2,
      icon: "search",
      placeholder,
      value,
    },
    {
      id: "fab",
      kind: "glass",
      x: open ? box.x + box.width - margin : fabX,
      y,
      w: open ? 0 : CIRCLE,
      h: CIRCLE,
      r: CIRCLE / 2,
      icon: "add",
      textSize: 30,
    },
  ];
  if (open) {
    nodes.push({
      id: "cancel",
      kind: "label",
      x: box.x + box.width - margin - CANCEL_WIDTH,
      y,
      w: CANCEL_WIDTH,
      h: CIRCLE,
      r: 0,
      text: "Cancelar",
      textSize: 17,
      color: ACCENT,
    });
  }
  return nodes;
};

const GlassSearchFab = ({
  box,
  insetBottom,
  value,
  onChangeText,
  placeholder = "Buscar",
  onCreate,
  onOpenChange,
}: TGlassSearchFabProps): ReactElement => {
  const [open, setOpen] = useState(false);
  // The field that holds the keyboard, mirrored from the platform focus (so Cancel can give it up).
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const setOpenState = (next: boolean): void => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <SurfaceNodes
      nodes={searchFabNodes(box, insetBottom, open, value, placeholder)}
      focusedField={focusedField}
      onFieldText={(_id, text): void => onChangeText(text)}
      onFieldFocus={(id, focused): void => {
        setFocusedField(focused ? id : null);
        if (focused) setOpenState(true);
      }}
      onNodePress={(id): void => {
        if (id === "fab") onCreate();
        if (id === "cancel") {
          setFocusedField(null);
          setOpenState(false);
        }
      }}
    />
  );
};

export { GlassSearchFab };
