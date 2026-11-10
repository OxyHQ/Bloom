import type { ComponentProps } from "react";
import type Ionicons from "@expo/vector-icons/Ionicons";

export type TTabBarItem = {
  key: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
};

export type TIosTabBarProps = {
  items: readonly TTabBarItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onCreate: () => void;
  bottomInset: number;
  searchPlaceholder?: string;
};
