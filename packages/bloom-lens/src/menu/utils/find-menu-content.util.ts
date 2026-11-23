import type { ReactElement, ReactNode } from "react";

import { MenuContent } from "../components/menu-content/menu-content";
import type { IMenuContent } from "../interface";
import {
  flattenElements,
  type TElementWithChildren,
} from "./flatten-elements.util";

const findMenuContent = (
  children: ReactNode,
): ReactElement<IMenuContent> | null =>
  (flattenElements(children).find(
    (element: TElementWithChildren): boolean => element.type === MenuContent,
  ) as ReactElement<IMenuContent> | undefined) ?? null;

export { findMenuContent };
