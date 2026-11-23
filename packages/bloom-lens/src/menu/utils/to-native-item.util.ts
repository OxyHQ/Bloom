import type { TNativeMenuItem } from "../context/interface";
import type { TMenuEntry } from "../interface";

const toNativeItem = (entry: TMenuEntry, index: number): TNativeMenuItem => {
  if ("separator" in entry) {
    return { id: `separator-${index}`, title: "", separator: true };
  }
  if ("heading" in entry) {
    return { id: `heading-${index}`, title: entry.heading, heading: true };
  }
  return {
    id: entry.id,
    title: entry.title,
    subtitle: entry.subtitle,
    icon: entry.icon,
    iconPath: entry.iconPath,
    checked: entry.checked,
    destructive: entry.destructive,
    disabled: entry.disabled,
    keepOpen: entry.keepOpen,
  };
};

export { toNativeItem };
