import { createContext, type Context } from "react";
import type { IMenuContext } from "./interface";

const MenuContext: Context<IMenuContext | null> =
  createContext<IMenuContext | null>(null);

export { MenuContext };
