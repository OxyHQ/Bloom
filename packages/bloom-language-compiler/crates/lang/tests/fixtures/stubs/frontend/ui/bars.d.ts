/** Function components as a library's emitted declarations write them (`import("react").JSX.Element`). */
import type { ReactNode } from 'react';

export interface BarProps {
  size?: 'sm' | 'md';
  children?: ReactNode;
}
export declare function EngagementBar({ size, children }: BarProps): import('react').JSX.Element;

export interface ActionProps {
  label: string;
}
export declare function Action({ label }: ActionProps): import('react').JSX.Element;

export interface SlotProps {
  title: string;
  content?: ReactNode;
}
/** A component whose node slot is not `children`. */
export declare function Slot({ title, content }: SlotProps): import('react').JSX.Element;

export interface LeafProps {
  title: string;
}
/** A component that takes no children at all. */
export declare function Leaf({ title }: LeafProps): import('react').JSX.Element;

/** A component with a component static (`Button.Group`), as Bloom's Button declares it. */
declare function ToolbarGroup({ children }: { children?: ReactNode }): import('react').JSX.Element;
export declare const Toolbar: ((props: { title: string }) => import('react').JSX.Element) & {
  Group: typeof ToolbarGroup;
};
