// Native entry (Android): the chrome is one native view (GlassChrome, Kotlin). Geometry, springs and fills are the
// same as the web bar (ios-tab-bar-view.web.tsx); the native view runs its own frame loop and emits taps.
import { requireNativeView } from "expo";
import type { ReactElement } from "react";
import type { NativeSyntheticEvent } from "react-native";

import type { TIosTabBarProps } from "./interface";

type TNativeEvent<T> = NativeSyntheticEvent<T>;

type TNativeChromeProps = {
  labels: readonly string[];
  icons: readonly string[];
  selectedIndex: number;
  bottomInset: number;
  searchPlaceholder: string;
  onTabSelect: (event: TNativeEvent<{ index: number }>) => void;
  onSearchChange: (event: TNativeEvent<{ open: boolean }>) => void;
  onCreate: (event: TNativeEvent<Record<string, never>>) => void;
  style?: object;
};

const NativeChrome = requireNativeView<TNativeChromeProps>("GlassChrome");

// The native host is an empty view in the React tree: the chrome draws as a window overlay (GlassChromeView).
const HOST_STYLE = { position: "absolute" as const, left: 0, bottom: 0, width: 0, height: 0 };

const IosTabBar = ({
  items,
  selectedIndex,
  onSelect,
  onCreate,
  bottomInset,
  searchPlaceholder,
}: TIosTabBarProps): ReactElement => (
  <NativeChrome
    labels={items.map((item): string => item.label)}
    icons={items.map((item): string => item.icon)}
    selectedIndex={selectedIndex}
    bottomInset={bottomInset}
    searchPlaceholder={searchPlaceholder ?? "Search"}
    onTabSelect={(event): void => onSelect(event.nativeEvent.index)}
    onSearchChange={(): void => undefined}
    onCreate={(): void => onCreate()}
    style={HOST_STYLE}
  />
);

export { IosTabBar };
