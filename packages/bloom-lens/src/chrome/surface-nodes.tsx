// Native entry of a node layer (Android): the layer is one native view (GlassSurfaceNodes, Kotlin SurfaceNodesView).
// The host is an empty view in the React tree; the layer draws as a window overlay with the same geometry and
// material as the web renderer (surface-nodes-view.web.tsx).
import { requireNativeView } from "expo";
import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import type { NativeSyntheticEvent } from "react-native";

import type { TNode, TSurfaceNodesProps } from "./surface-layer";

type TNativeNodeEvent = NativeSyntheticEvent<{ id: string }>;
type TNativeFieldTextEvent = NativeSyntheticEvent<{ id: string; text: string }>;
type TNativeFieldFocusEvent = NativeSyntheticEvent<{ id: string; focused: boolean }>;

type TNativeNodesProps = {
  nodes: readonly TNode[];
  onNodePress: (event: TNativeNodeEvent) => void;
  onFieldText: (event: TNativeFieldTextEvent) => void;
  onFieldFocus: (event: TNativeFieldFocusEvent) => void;
  focusedField: string | null;
  style?: object;
  children?: ReactNode;
};

const NativeNodes = requireNativeView<TNativeNodesProps>("GlassSurfaceNodes");

// The native host has no size of its own: the layer draws over the window.
const HOST_STYLE = { position: "absolute" as const, left: 0, top: 0, width: 0, height: 0 };
const ICON_HOST_ID = "glass-surface-icons";
const ICON_HOST_STYLE = { position: "absolute" as const, left: 0, top: 0, width: 0, height: 0, opacity: 0 };
const SLOT_STYLE = { position: "absolute" as const, left: 0, top: 0 };

// Native icons: the React views of `icons` are children of the native host. The host keeps them at opacity 0 (not drawn
// by the hierarchy) and the layer draws them with view.draw at each node's centre (SurfaceNodesView, iconSlot).
const SurfaceNodes = ({ nodes, icons = [], onNodePress, onFieldText, onFieldFocus, focusedField = null }: TSurfaceNodesProps): ReactElement => (
  <NativeNodes
    nodes={nodes}
    focusedField={focusedField}
    onNodePress={(event): void => onNodePress?.(event.nativeEvent.id)}
    onFieldText={(event): void => onFieldText?.(event.nativeEvent.id, event.nativeEvent.text)}
    onFieldFocus={(event): void => onFieldFocus?.(event.nativeEvent.id, event.nativeEvent.focused)}
    style={HOST_STYLE}
  >
    <View nativeID={ICON_HOST_ID} collapsable={false} pointerEvents="none" style={ICON_HOST_STYLE}>
      {icons.map((icon: ReactNode, index: number): ReactElement => (
        <View key={index} collapsable={false} style={SLOT_STYLE}>
          {icon}
        </View>
      ))}
    </View>
  </NativeNodes>
);

export { SurfaceNodes };
