import {
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

type TElementWithChildren = ReactElement<{ children?: ReactNode }>;

const flattenElements = (nodes: ReactNode): TElementWithChildren[] =>
  Children.toArray(nodes).flatMap((node: ReactNode): TElementWithChildren[] => {
    if (!isValidElement<{ children?: ReactNode }>(node)) return [];
    if (node.type === Fragment) return flattenElements(node.props.children);
    return [node];
  });

export { flattenElements, type TElementWithChildren };
