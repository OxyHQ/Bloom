/**
 * COPIED FROM react-native-teleport 1.2.0 — `src/contexts/ScrollViewContext/index.ts`
 * MIT, Copyright (c) 2025 Kiryl Ziusko. Full licence in `NOTICE` at the root.
 *
 * Changed: import paths only, for this flat directory.
 */
import { createContext } from "react";
import type { ScrollViewContextValue } from "./types";

const ScrollViewContext = createContext<ScrollViewContextValue>(null);

export default ScrollViewContext;
